// NIGHTSHIFT — rendering.
// Everything the player sees, drawn on one canvas: the dark facility,
// the guards' vision cones, the cover, the exit, the HUD, and the
// title / caught / clear / win screens. No game logic here.
//
// Visuals: a moody night facility — textured floor, warm lamp pools,
// soft gradient vision cones that stop at walls, detailed characters,
// floating dust, and a vignette. Palette: deep blue-teal + amber.

import { TILE, COLS, ROWS, VIEW_W, VIEW_H, VISION_RANGE, VISION_HALF_ANGLE, VISION_STEPS, COLORS } from './config.js';
import { FLOOR, WALL, CRATE, tileAt } from './world.js';

// Deterministic 0..1 hash from two integers — stable tile variation.
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function coneColors(guard) {
  if (guard.state === 'chase') return { base: COLORS.coneChase, core: COLORS.coneChaseCore, edge: 'rgba(255, 80, 60, 0.5)' };
  if (guard.alert > 0.35) return { base: COLORS.coneSuspicious, core: COLORS.coneCore, edge: 'rgba(255, 170, 70, 0.4)' };
  return { base: COLORS.conePatrol, core: COLORS.coneCore, edge: COLORS.coneEdge };
}

// --- Floor texture: rendered once per level into an offscreen canvas. ---
let floorCache = { index: -1, canvas: null };

function buildFloorTexture(world, levelIndex) {
  const c = document.createElement('canvas');
  c.width = VIEW_W;
  c.height = VIEW_H;
  const g = c.getContext('2d');
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (tileAt(world, tx, ty) !== FLOOR) continue;
      const x = tx * TILE;
      const y = ty * TILE;
      const h = hash2(tx, ty);
      // Two-tone base with a whisper of per-tile brightness change.
      const bright = 0.9 + h * 0.22;
      g.fillStyle = (tx + ty) % 2 === 0 ? shade(COLORS.floorA, bright) : shade(COLORS.floorB, bright);
      g.fillRect(x, y, TILE, TILE);
      // Speckles and wear.
      g.fillStyle = COLORS.floorSpeck;
      for (let s = 0; s < 4; s++) {
        const sx = x + 4 + hash2(tx * 7 + s, ty * 3 + s) * (TILE - 8);
        const sy = y + 4 + hash2(tx * 3 + s, ty * 7 + s) * (TILE - 8);
        g.fillRect(sx, sy, 2, 2);
      }
      const h2 = hash2(tx + 31, ty + 17);
      if (h2 > 0.94) {
        // Floor grate: dark slats.
        g.fillStyle = COLORS.floorGrate;
        g.fillRect(x + 6, y + 8, TILE - 12, TILE - 16);
        g.fillStyle = 'rgba(255,255,255,0.06)';
        for (let s = 0; s < 3; s++) g.fillRect(x + 9, y + 11 + s * 7, TILE - 18, 2);
      } else if (h2 > 0.88) {
        // Old stain.
        g.fillStyle = COLORS.floorStain;
        g.beginPath();
        g.ellipse(x + TILE / 2, y + TILE / 2, 12 + h * 6, 8 + h * 5, h * 2, 0, Math.PI * 2);
        g.fill();
      } else if (h2 > 0.84) {
        // Faded floor marking.
        g.strokeStyle = 'rgba(255, 209, 102, 0.14)';
        g.lineWidth = 2;
        g.strokeRect(x + 8.5, y + 8.5, TILE - 17, TILE - 17);
      }
      // Tile seam.
      g.strokeStyle = COLORS.floorLine;
      g.lineWidth = 1;
      g.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }
  }
  // Large-scale moonlight falloff baked in: brighter up top, darker below.
  const moon = g.createLinearGradient(0, 0, 0, VIEW_H);
  moon.addColorStop(0, 'rgba(120, 160, 220, 0.07)');
  moon.addColorStop(0.5, 'rgba(120, 160, 220, 0)');
  moon.addColorStop(1, 'rgba(2, 4, 9, 0.12)');
  g.fillStyle = moon;
  g.fillRect(0, 0, VIEW_W, VIEW_H);
  floorCache = { index: levelIndex, canvas: c };
}

// Multiply a #rrggbb color by a brightness factor.
function shade(hex, f) {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * f));
  const gg = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * f));
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * f));
  return `rgb(${r},${gg},${b})`;
}

function drawFloor(ctx, world, levelIndex) {
  if (floorCache.index !== levelIndex || !floorCache.canvas) buildFloorTexture(world, levelIndex);
  ctx.drawImage(floorCache.canvas, 0, 0);
}

function drawDarkZones(ctx, world, time) {
  for (const z of world.dark) {
    const x = z.x * TILE;
    const y = z.y * TILE;
    const w = z.w * TILE;
    const h = z.h * TILE;
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, 'rgba(6, 10, 20, 0.62)');
    grad.addColorStop(1, 'rgba(6, 10, 20, 0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(140, 170, 220, 0.22)';
    ctx.setLineDash([5, 7]);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.setLineDash([]);
    // A faint "shadow" shimmer so the zone reads as a place, not a hole.
    const shimmer = 0.05 + 0.04 * Math.sin(time * 1.2 + z.x);
    ctx.fillStyle = `rgba(150, 180, 230, ${shimmer})`;
    ctx.fillRect(x + 2, y + 2, w - 4, 3);
  }
}

function drawWallsAndCrates(ctx, world) {
  // Drop shadows first, so the walls lift off the floor.
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (tileAt(world, tx, ty) === WALL) {
        ctx.fillStyle = COLORS.wallShadow;
        ctx.fillRect(tx * TILE + 4, ty * TILE + 5, TILE, TILE);
      }
    }
  }
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const kind = tileAt(world, tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      if (kind === WALL) {
        // Beveled block: dark body, lit top edge, dark outline.
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(x, y, TILE, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x, y + 6, TILE, 3);
        ctx.strokeStyle = COLORS.wallEdge;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
        // Panel seam on long runs.
        if (hash2(tx, ty) > 0.6) {
          ctx.strokeStyle = 'rgba(0,0,0,0.25)';
          ctx.beginPath();
          ctx.moveTo(x + TILE / 2, y + 8);
          ctx.lineTo(x + TILE / 2, y + TILE - 2);
          ctx.stroke();
        }
      } else if (kind === CRATE) {
        // Wooden crate: shadow, wood gradient, plank lines, metal corners.
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(x + 6, y + 6, TILE - 6, TILE - 6);
        const g = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
        g.addColorStop(0, '#7d6240');
        g.addColorStop(0.55, COLORS.crate);
        g.addColorStop(1, COLORS.crateDark);
        ctx.fillStyle = g;
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 15);
        ctx.lineTo(x + TILE - 4, y + 15);
        ctx.moveTo(x + 4, y + 26);
        ctx.lineTo(x + TILE - 4, y + 26);
        ctx.stroke();
        ctx.strokeStyle = COLORS.crateEdge;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3.5, y + 3.5, TILE - 7, TILE - 7);
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 5);
        ctx.lineTo(x + TILE - 5, y + TILE - 5);
        ctx.stroke();
        // Metal corner brackets.
        ctx.fillStyle = COLORS.crateMetal;
        const c = 5;
        ctx.fillRect(x + 3, y + 3, c, c);
        ctx.fillRect(x + TILE - 3 - c, y + 3, c, c);
        ctx.fillRect(x + 3, y + TILE - 3 - c, c, c);
        ctx.fillRect(x + TILE - 3 - c, y + TILE - 3 - c, c, c);
      }
    }
  }
}

function drawLamps(ctx, world, time) {
  const lamps = world.def.lamps || [];
  if (lamps.length === 0) return;
  // Warm light pools, additive so they glow over the floor.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [tx, ty] of lamps) {
    const x = (tx + 0.5) * TILE;
    const y = (ty + 0.5) * TILE;
    const flicker = 0.92 + 0.08 * Math.sin(time * 7 + tx * 3 + ty);
    const pool = ctx.createRadialGradient(x, y, 6, x, y, 120 * flicker);
    pool.addColorStop(0, 'rgba(255, 190, 100, 0.30)');
    pool.addColorStop(0.5, 'rgba(255, 170, 80, 0.10)');
    pool.addColorStop(1, 'rgba(255, 170, 80, 0)');
    ctx.fillStyle = pool;
    ctx.fillRect(x - 130, y - 130, 260, 260);
  }
  ctx.restore();
  // Fixtures: a small ceiling lamp dot with a hot core.
  for (const [tx, ty] of lamps) {
    const x = (tx + 0.5) * TILE;
    const y = (ty + 0.5) * TILE;
    ctx.save();
    ctx.shadowColor = COLORS.lampCore;
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ffe6b0';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(60, 40, 10, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawExit(ctx, world, time) {
  const pulse = 0.55 + 0.25 * Math.sin(time * 3);
  const x = world.exit.x;
  const y = world.exit.y;
  // Layered glow.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(x, y, 4, x, y, TILE * 1.9);
  glow.addColorStop(0, `rgba(57, 217, 138, ${pulse})`);
  glow.addColorStop(0.5, `rgba(57, 217, 138, ${pulse * 0.35})`);
  glow.addColorStop(1, 'rgba(57, 217, 138, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - TILE * 2, y - TILE * 2, TILE * 4, TILE * 4);
  ctx.restore();
  // Door frame + door with chevrons.
  ctx.fillStyle = '#0a2e1d';
  ctx.fillRect(x - TILE * 0.5, y - TILE * 0.5, TILE, TILE);
  ctx.fillStyle = COLORS.exitDoor;
  ctx.fillRect(x - TILE * 0.42, y - TILE * 0.42, TILE * 0.84, TILE * 0.84);
  ctx.strokeStyle = COLORS.exitGlow;
  ctx.lineWidth = 3;
  ctx.strokeRect(x - TILE * 0.42, y - TILE * 0.42, TILE * 0.84, TILE * 0.84);
  ctx.strokeStyle = 'rgba(120, 255, 180, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 2);
  ctx.lineTo(x, y - 9);
  ctx.lineTo(x + 7, y - 2);
  ctx.moveTo(x - 7, y + 6);
  ctx.lineTo(x, y - 1);
  ctx.lineTo(x + 7, y + 6);
  ctx.stroke();
  // Glowing EXIT sign.
  ctx.save();
  ctx.shadowColor = COLORS.exitGlow;
  ctx.shadowBlur = 12;
  ctx.fillStyle = COLORS.exitGlow;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', x, y - TILE * 0.68);
  ctx.restore();
}

function drawIntel(ctx, world, time) {
  for (const item of world.intel) {
    if (item.taken) continue;
    const bob = Math.sin(time * 2.5 + item.x) * 2;
    const x = item.x;
    const y = item.y + bob;
    // Warm glow behind the document.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(x, y, 2, x, y, 34);
    glow.addColorStop(0, 'rgba(255, 209, 102, 0.35)');
    glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 34, y - 34, 68, 68);
    ctx.restore();
    // Paper with a folded corner.
    ctx.save();
    ctx.shadowColor = COLORS.intel;
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ffe9ad';
    ctx.fillRect(x - 9, y - 12, 18, 24);
    ctx.restore();
    ctx.fillStyle = '#d9b96a';
    ctx.beginPath();
    ctx.moveTo(x + 9, y - 12);
    ctx.lineTo(x + 9, y - 5);
    ctx.lineTo(x + 2, y - 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7a5b12';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 5);
    ctx.lineTo(x + 5, y - 5);
    ctx.moveTo(x - 5, y + 0);
    ctx.lineTo(x + 5, y + 0);
    ctx.moveTo(x - 5, y + 5);
    ctx.lineTo(x + 1, y + 5);
    ctx.stroke();
    // Orbiting sparkles.
    for (let s = 0; s < 3; s++) {
      const a = time * 1.6 + s * (Math.PI * 2) / 3;
      const sx = x + Math.cos(a) * 15;
      const sy = y + Math.sin(a) * 15;
      const tw = 0.5 + 0.5 * Math.sin(time * 4 + s * 2);
      ctx.fillStyle = `rgba(255, 230, 150, ${0.35 + 0.5 * tw})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Length of one vision ray before it hits a wall (or the cone's range).
function rayLength(world, gx, gy, angle) {
  const step = TILE * 0.125;
  for (let d = step; d <= VISION_RANGE; d += step) {
    const tx = Math.floor((gx + Math.cos(angle) * d) / TILE);
    const ty = Math.floor((gy + Math.sin(angle) * d) / TILE);
    if (tileAt(world, tx, ty) !== FLOOR) return d;
  }
  return VISION_RANGE;
}

function conePath(ctx, world, guard) {
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  for (let i = 0; i <= VISION_STEPS; i++) {
    const a = guard.angle - VISION_HALF_ANGLE + (2 * VISION_HALF_ANGLE * i) / VISION_STEPS;
    const len = rayLength(world, guard.x, guard.y, a);
    ctx.lineTo(guard.x + Math.cos(a) * len, guard.y + Math.sin(a) * len);
  }
  ctx.closePath();
}

function drawCone(ctx, world, guard, time) {
  const colors = coneColors(guard);
  const pulse = guard.state === 'chase' ? 0.85 + 0.15 * Math.sin(time * 8) : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  try {
    ctx.filter = 'blur(3px)';
  } catch {
    // No filter support: the cone is still fine, just crisper.
  }
  conePath(ctx, world, guard);
  ctx.fillStyle = colors.base;
  ctx.fill();
  // Bright near the guard, fading with distance.
  ctx.clip();
  const g = ctx.createRadialGradient(guard.x, guard.y, 8, guard.x, guard.y, VISION_RANGE);
  g.addColorStop(0, colors.core);
  g.addColorStop(0.45, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(guard.x - VISION_RANGE, guard.y - VISION_RANGE, VISION_RANGE * 2, VISION_RANGE * 2);
  ctx.restore();
  // Soft rim along the cone's two straight sides only. The far edge is
  // the wall contour — stroking it would trace every step of the raycast.
  ctx.save();
  ctx.globalAlpha = pulse;
  const a0 = guard.angle - VISION_HALF_ANGLE;
  const a1 = guard.angle + VISION_HALF_ANGLE;
  const l0 = rayLength(world, guard.x, guard.y, a0);
  const l1 = rayLength(world, guard.x, guard.y, a1);
  ctx.strokeStyle = colors.edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(a0) * l0, guard.y + Math.sin(a0) * l0);
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(a1) * l1, guard.y + Math.sin(a1) * l1);
  ctx.stroke();
  ctx.restore();
}

function drawGuard(ctx, world, guard, time) {
  drawCone(ctx, world, guard, time);
  ctx.save();
  ctx.translate(guard.x, guard.y);
  // Ground shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 11, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(guard.angle);
  // Uniformed body: rust gradient, wider at the shoulders.
  const body = ctx.createRadialGradient(-3, 0, 2, 0, 0, 15);
  body.addColorStop(0, '#f08a70');
  body.addColorStop(0.55, COLORS.guard);
  body.addColorStop(1, COLORS.guardDark);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(13, 0);
  ctx.quadraticCurveTo(7, -13, -5, -12);
  ctx.quadraticCurveTo(-14, 0, -5, 12);
  ctx.quadraticCurveTo(7, 13, 13, 0);
  ctx.fill();
  // Shoulder pads.
  ctx.fillStyle = '#8a2f1c';
  ctx.beginPath();
  ctx.arc(-5, -10, 4.5, 0, Math.PI * 2);
  ctx.arc(-5, 10, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // Helmet dome with a pale visor slit.
  ctx.fillStyle = '#5d1f12';
  ctx.beginPath();
  ctx.arc(3, 0, 8.5, -Math.PI * 0.62, Math.PI * 0.62);
  ctx.fill();
  ctx.strokeStyle = '#ffd9d0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(9, -3.5);
  ctx.lineTo(12.5, 0);
  ctx.lineTo(9, 3.5);
  ctx.stroke();
  // Belt line.
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, -11);
  ctx.lineTo(-3, 11);
  ctx.stroke();
  // Rim light on the facing edge.
  ctx.strokeStyle = 'rgba(255, 150, 120, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 14, -0.9, 0.9);
  ctx.stroke();
  ctx.restore();
  // Alert "!" while suspicious, and a pulsing ring while chasing.
  if (guard.state === 'chase') {
    const r = 20 + 4 * Math.sin(time * 6);
    ctx.save();
    ctx.shadowColor = COLORS.danger;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = COLORS.danger;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (guard.alert > 0.05) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('!', guard.x, guard.y - 18);
  }
}

function drawPlayer(ctx, player, time) {
  const moving = player.moving;
  const bob = moving ? Math.sin(time * 14) * 1.2 : 0;
  ctx.save();
  ctx.translate(player.x, player.y + bob);
  // Ground shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 11, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(player.angle);
  // Hooded agent: teal cloak, darker hood, pale visor, rim light.
  const body = ctx.createRadialGradient(-3, 0, 2, 0, 0, 14);
  body.addColorStop(0, '#5eead4');
  body.addColorStop(0.55, COLORS.player);
  body.addColorStop(1, COLORS.playerDark);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(13, 0);
  ctx.quadraticCurveTo(6, -12, -6, -10);
  ctx.quadraticCurveTo(-14, 0, -6, 10);
  ctx.quadraticCurveTo(6, 12, 13, 0);
  ctx.fill();
  // Cloak tail fluttering behind.
  ctx.fillStyle = 'rgba(15, 118, 110, 0.85)';
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.quadraticCurveTo(-18 - (moving ? Math.sin(time * 14) * 2 : 0), 0, -10, 6);
  ctx.closePath();
  ctx.fill();
  // Hood.
  ctx.fillStyle = '#0b3f3a';
  ctx.beginPath();
  ctx.arc(4, 0, 7.5, -Math.PI * 0.55, Math.PI * 0.55);
  ctx.fill();
  // Visor slit.
  ctx.strokeStyle = '#d6fff8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(8, -3);
  ctx.lineTo(11.5, 0);
  ctx.lineTo(8, 3);
  ctx.stroke();
  // Rim light on the facing edge.
  ctx.strokeStyle = 'rgba(94, 234, 212, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 13, -0.9, 0.9);
  ctx.stroke();
  ctx.restore();
}

// Floating dust motes drifting through the lamplight.
function drawDust(ctx, time) {
  for (let i = 0; i < 48; i++) {
    const hx = hash2(i, 7);
    const hy = hash2(i, 13);
    const speed = 4 + hash2(i, 3) * 8;
    const x = hx * VIEW_W;
    const y = (hy * VIEW_H + time * speed) % VIEW_H;
    const tw = 0.5 + 0.5 * Math.sin(time * 1.5 + i * 1.7);
    ctx.fillStyle = `rgba(200, 220, 255, ${0.05 + 0.16 * tw})`;
    ctx.beginPath();
    ctx.arc(x, y, 1 + hash2(i, 5) * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVignette(ctx) {
  const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.32, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.95);
  g.addColorStop(0, 'rgba(3, 5, 10, 0)');
  g.addColorStop(1, COLORS.vignette);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHud(ctx, game) {
  const level = game.levels[game.levelIndex];
  // Gradient bar with a thin amber baseline.
  const bar = ctx.createLinearGradient(0, 0, 0, 44);
  bar.addColorStop(0, '#0e1424');
  bar.addColorStop(1, '#070a12');
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, VIEW_W, 44);
  ctx.fillStyle = 'rgba(255, 180, 84, 0.35)';
  ctx.fillRect(0, 44, VIEW_W, 1);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  try {
    ctx.letterSpacing = '1px';
  } catch {
    // Older canvas: no letter spacing, fine.
  }
  ctx.fillText(`NIGHTSHIFT  ·  ${level.name}`, 16, 23);
  try {
    ctx.letterSpacing = '0px';
  } catch {
    // ignore
  }
  // Intel with a tiny document icon.
  ctx.fillStyle = COLORS.intel;
  ctx.fillRect(330, 15, 10, 14);
  ctx.strokeStyle = '#7a5b12';
  ctx.lineWidth = 1;
  ctx.strokeRect(330.5, 15.5, 9, 13);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '14px sans-serif';
  const intelGot = game.world.intel.filter((i) => i.taken).length;
  ctx.fillText(`INTEL ${intelGot}/${game.world.intel.length}`, 348, 23);
  ctx.fillText(`TIME ${formatTime(game.levelTime)}`, 470, 23);
  // Alert meter: rounded track, gradient fill, glow when spotted.
  const alert = Math.max(0, ...game.guards.map((g) => g.alert));
  const status = alert > 0.66 ? 'SPOTTED!' : alert > 0.3 ? 'SUSPICIOUS' : 'HIDDEN';
  const statusColor = alert > 0.66 ? COLORS.danger : alert > 0.3 ? '#ff9f43' : COLORS.gold;
  ctx.save();
  roundRect(ctx, 620, 14, 220, 16, 8);
  ctx.fillStyle = '#232c40';
  ctx.fill();
  ctx.strokeStyle = '#55617a';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.clip();
  if (alert > 0) {
    const fill = ctx.createLinearGradient(620, 0, 840, 0);
    fill.addColorStop(0, '#ffd166');
    fill.addColorStop(0.6, '#ff9f43');
    fill.addColorStop(1, COLORS.danger);
    ctx.fillStyle = fill;
    ctx.fillRect(620, 14, 220 * alert, 16);
  }
  ctx.restore();
  if (alert > 0.66) {
    ctx.save();
    ctx.shadowColor = COLORS.danger;
    ctx.shadowBlur = 12;
    ctx.fillStyle = statusColor;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(status, 850, 23);
    ctx.restore();
  } else {
    ctx.fillStyle = statusColor;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(status, 850, 23);
  }
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('WASD / arrows to move · click to move · M mute', VIEW_W - 16, 23);
  ctx.textAlign = 'left';
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function gradientText(ctx, text, x, y, size, top, bottom) {
  const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.font = `bold ${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function overlay(ctx, title, lines, accent, time, titleTop, titleBottom) {
  ctx.fillStyle = 'rgba(5, 8, 14, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Thin gold rule under the title.
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 18;
  gradientText(ctx, title, VIEW_W / 2, VIEW_H / 2 - 110, 68, titleTop || '#ffffff', titleBottom || '#9fb4d8');
  ctx.restore();
  ctx.fillStyle = accent;
  ctx.fillRect(VIEW_W / 2 - 90, VIEW_H / 2 - 66, 180, 2);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, VIEW_H / 2 - 28 + i * 32);
  });
  // Blinking prompt on the last line, if it starts with "Press".
  const last = lines[lines.length - 1];
  if (last && last.startsWith('Press')) {
    const alpha = 0.55 + 0.45 * Math.sin(time * 4);
    ctx.fillStyle = `rgba(219, 228, 240, ${alpha})`;
    ctx.fillText(last, VIEW_W / 2, VIEW_H / 2 - 28 + (lines.length - 1) * 32);
  }
  ctx.textAlign = 'left';
}

export function render(ctx, game) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (game.state === 'title') {
    drawFloor(ctx, game.world, game.levelIndex);
    drawDarkZones(ctx, game.world, game.time);
    drawWallsAndCrates(ctx, game.world);
    drawLamps(ctx, game.world, game.time);
    drawExit(ctx, game.world, game.time);
    drawIntel(ctx, game.world, game.time);
    for (const guard of game.guards) drawCone(ctx, game.world, guard, game.time);
    for (const guard of game.guards) drawGuard(ctx, game.world, guard, game.time);
    drawPlayer(ctx, game.player, game.time);
    drawDust(ctx, game.time);
    drawVignette(ctx);
    overlay(
      ctx,
      'NIGHTSHIFT',
      [
        'A stealth game — slip past the patrols, grab the intel, reach the exit unseen.',
        '',
        'Move: WASD / arrow keys, or click to walk there.',
        'Hide behind crates and walls — they block the guards’ vision.',
        'Shadows slow detection. A red cone means run.',
        '',
        'Press ENTER to start · M to mute',
      ],
      COLORS.gold,
      game.time,
      '#f4f7fc',
      '#8fa8cc',
    );
    return;
  }

  drawFloor(ctx, game.world, game.levelIndex);
  drawDarkZones(ctx, game.world, game.time);
  drawWallsAndCrates(ctx, game.world);
  drawLamps(ctx, game.world, game.time);
  drawExit(ctx, game.world, game.time);
  drawIntel(ctx, game.world, game.time);
  for (const guard of game.guards) drawCone(ctx, game.world, guard, game.time);
  for (const guard of game.guards) drawGuard(ctx, game.world, guard, game.time);
  drawPlayer(ctx, game.player, game.time);
  drawDust(ctx, game.time);
  drawVignette(ctx);
  drawHud(ctx, game);

  if (game.state === 'caught') {
    overlay(
      ctx,
      'SPOTTED!',
      ['A guard caught you in the light.', '', 'Press R to retry this level'],
      COLORS.danger,
      game.time,
      '#ff8a7a',
      '#c22e20',
    );
  } else if (game.state === 'levelClear') {
    const level = game.levels[game.levelIndex];
    const intelGot = game.world.intel.filter((i) => i.taken).length;
    const last = game.levelIndex === game.levels.length - 1;
    overlay(
      ctx,
      last ? 'ALL CLEAR' : 'LEVEL CLEAR',
      [
        `${level.name} — ${intelGot}/${game.world.intel.length} intel, ${formatTime(game.levelTime)}.`,
        '',
        last ? 'Every facility breached. You were never seen.' : 'Press ENTER for the next facility',
        '',
        'Press R to replay this level',
      ],
      COLORS.exitGlow,
      game.time,
      '#a5f5c8',
      '#1f9d5c',
    );
  }
}
