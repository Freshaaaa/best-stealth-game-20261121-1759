// NIGHTSHIFT — rendering.
// Everything the player sees, drawn on one canvas: the dark facility,
// the guards' vision cones, the cover, the exit, the HUD, and the
// title / caught / clear / win screens. No game logic here.

import { TILE, COLS, ROWS, VIEW_W, VIEW_H, VISION_RANGE, VISION_HALF_ANGLE, VISION_STEPS, COLORS } from './config.js';
import { FLOOR, WALL, CRATE, tileAt } from './world.js';

function coneColor(guard) {
  if (guard.state === 'chase') return COLORS.coneChase;
  if (guard.alert > 0.35) return COLORS.coneSuspicious;
  return COLORS.conePatrol;
}

function drawFloor(ctx, world) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const kind = tileAt(world, tx, ty);
      if (kind !== FLOOR) continue;
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
      ctx.strokeStyle = COLORS.floorLine;
      ctx.lineWidth = 1;
      ctx.strokeRect(tx * TILE + 0.5, ty * TILE + 0.5, TILE - 1, TILE - 1);
    }
  }
}

function drawDarkZones(ctx, world) {
  for (const z of world.dark) {
    ctx.fillStyle = COLORS.darkZone;
    ctx.fillRect(z.x * TILE, z.y * TILE, z.w * TILE, z.h * TILE);
    ctx.strokeStyle = 'rgba(120, 150, 200, 0.25)';
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(z.x * TILE + 1, z.y * TILE + 1, z.w * TILE - 2, z.h * TILE - 2);
    ctx.setLineDash([]);
  }
}

function drawWallsAndCrates(ctx, world) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const kind = tileAt(world, tx, ty);
      if (kind === WALL) {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(tx * TILE, ty * TILE, TILE, 5);
      } else if (kind === CRATE) {
        const x = tx * TILE;
        const y = ty * TILE;
        ctx.fillStyle = COLORS.crate;
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = COLORS.crateEdge;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3.5, y + 3.5, TILE - 7, TILE - 7);
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 3);
        ctx.lineTo(x + TILE - 3, y + TILE - 3);
        ctx.moveTo(x + TILE - 3, y + 3);
        ctx.lineTo(x + 3, y + TILE - 3);
        ctx.stroke();
      }
    }
  }
}

function drawExit(ctx, world, time) {
  const pulse = 0.55 + 0.25 * Math.sin(time * 3);
  const x = world.exit.x;
  const y = world.exit.y;
  const glow = ctx.createRadialGradient(x, y, 4, x, y, TILE * 1.4);
  glow.addColorStop(0, `rgba(57, 217, 138, ${pulse})`);
  glow.addColorStop(1, 'rgba(57, 217, 138, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - TILE * 1.4, y - TILE * 1.4, TILE * 2.8, TILE * 2.8);
  ctx.fillStyle = COLORS.exitDoor;
  ctx.fillRect(x - TILE * 0.42, y - TILE * 0.42, TILE * 0.84, TILE * 0.84);
  ctx.strokeStyle = COLORS.exitGlow;
  ctx.lineWidth = 3;
  ctx.strokeRect(x - TILE * 0.42, y - TILE * 0.42, TILE * 0.84, TILE * 0.84);
  ctx.fillStyle = COLORS.exitGlow;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', x, y - TILE * 0.62);
}

function drawIntel(ctx, world, time) {
  for (const item of world.intel) {
    if (item.taken) continue;
    const bob = Math.sin(time * 2.5 + item.x) * 2;
    const x = item.x;
    const y = item.y + bob;
    ctx.save();
    ctx.shadowColor = COLORS.intel;
    ctx.shadowBlur = 14;
    ctx.fillStyle = COLORS.intel;
    ctx.fillRect(x - 9, y - 12, 18, 24);
    ctx.restore();
    ctx.strokeStyle = '#7a5b12';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 6);
    ctx.lineTo(x + 5, y - 6);
    ctx.moveTo(x - 5, y - 1);
    ctx.lineTo(x + 5, y - 1);
    ctx.moveTo(x - 5, y + 4);
    ctx.lineTo(x + 1, y + 4);
    ctx.stroke();
  }
}

function drawCone(ctx, guard) {
  const steps = VISION_STEPS;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  for (let i = 0; i <= steps; i++) {
    const a = guard.angle - VISION_HALF_ANGLE + (2 * VISION_HALF_ANGLE * i) / steps;
    ctx.lineTo(guard.x + Math.cos(a) * VISION_RANGE, guard.y + Math.sin(a) * VISION_RANGE);
  }
  ctx.closePath();
  ctx.fillStyle = coneColor(guard);
  ctx.fill();
  ctx.strokeStyle = COLORS.coneEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawGuard(ctx, guard, time) {
  drawCone(ctx, guard);
  // Body: a watchman with a visor, facing the cone.
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.fillStyle = COLORS.guardDark;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(guard.angle);
  ctx.fillStyle = '#ffd9d0';
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(2, -5);
  ctx.lineTo(2, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Alert "!" while suspicious, and a pulsing ring while chasing.
  if (guard.state === 'chase') {
    const r = 20 + 4 * Math.sin(time * 6);
    ctx.strokeStyle = COLORS.danger;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, r, 0, Math.PI * 2);
    ctx.stroke();
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
  const bob = moving ? Math.sin(time * 14) * 1.5 : 0;
  ctx.save();
  ctx.translate(player.x, player.y + bob);
  ctx.fillStyle = COLORS.playerDark;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(player.angle);
  ctx.fillStyle = '#d6fff8';
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(1, -4.5);
  ctx.lineTo(1, 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHud(ctx, game) {
  const level = game.levels[game.levelIndex];
  ctx.fillStyle = COLORS.hudBar;
  ctx.fillRect(0, 0, VIEW_W, 44);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`NIGHTSHIFT  ·  ${level.name}`, 16, 23);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '14px sans-serif';
  const intelGot = game.world.intel.filter((i) => i.taken).length;
  ctx.fillText(`INTEL ${intelGot}/${game.world.intel.length}`, 330, 23);
  ctx.fillText(`TIME ${formatTime(game.levelTime)}`, 470, 23);
  // Alert meter: the highest guard alert right now.
  const alert = Math.max(0, ...game.guards.map((g) => g.alert));
  ctx.fillStyle = '#2a3242';
  ctx.fillRect(620, 14, 220, 16);
  ctx.fillStyle = alert > 0.66 ? COLORS.danger : alert > 0.3 ? '#ff9f43' : '#ffd166';
  ctx.fillRect(620, 14, 220 * alert, 16);
  ctx.strokeStyle = '#55617a';
  ctx.strokeRect(620.5, 14.5, 220, 16);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(alert > 0.66 ? 'SPOTTED!' : alert > 0.3 ? 'SUSPICIOUS' : 'HIDDEN', 850, 23);
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

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6, 9, 16, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 64px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 90);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '20px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, VIEW_H / 2 - 20 + i * 32);
  });
  ctx.textAlign = 'left';
}

export function render(ctx, game) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (game.state === 'title') {
    drawFloor(ctx, game.world);
    drawDarkZones(ctx, game.world);
    drawWallsAndCrates(ctx, game.world);
    drawExit(ctx, game.world, game.time);
    drawIntel(ctx, game.world, game.time);
    for (const guard of game.guards) drawCone(ctx, guard);
    for (const guard of game.guards) drawGuard(ctx, guard, game.time);
    drawPlayer(ctx, game.player, game.time);
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
      COLORS.title,
    );
    return;
  }

  drawFloor(ctx, game.world);
  drawDarkZones(ctx, game.world);
  drawWallsAndCrates(ctx, game.world);
  drawExit(ctx, game.world, game.time);
  drawIntel(ctx, game.world, game.time);
  for (const guard of game.guards) drawCone(ctx, guard);
  for (const guard of game.guards) drawGuard(ctx, guard, game.time);
  drawPlayer(ctx, game.player, game.time);
  drawHud(ctx, game);

  if (game.state === 'caught') {
    overlay(ctx, 'SPOTTED!', ['A guard caught you in the light.', '', 'Press R to retry this level'], COLORS.danger);
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
    );
  }
}
