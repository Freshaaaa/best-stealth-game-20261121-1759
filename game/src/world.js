// NIGHTSHIFT — world.
// Builds the tile grid from a level definition and answers the two
// questions the game asks every frame: "can I stand here?" and
// "can that guard see me?" No rendering, no AI decisions here.

import { TILE, COLS, ROWS } from './config.js';

// Tile kinds.
export const FLOOR = 0;
export const WALL = 1;
export const CRATE = 2;

export function tileCenter(tx, ty) {
  return { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
}

function tileIndex(tx, ty) {
  return ty * COLS + tx;
}

export function loadLevel(def) {
  const grid = new Uint8Array(COLS * ROWS);
  // Border walls.
  for (let x = 0; x < COLS; x++) {
    grid[tileIndex(x, 0)] = WALL;
    grid[tileIndex(x, ROWS - 1)] = WALL;
  }
  for (let y = 0; y < ROWS; y++) {
    grid[tileIndex(0, y)] = WALL;
    grid[tileIndex(COLS - 1, y)] = WALL;
  }
  // Interior walls.
  for (const [x, y, w, h] of def.walls) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        grid[tileIndex(x + dx, y + dy)] = WALL;
      }
    }
  }
  // Crates.
  for (const [x, y] of def.crates) {
    grid[tileIndex(x, y)] = CRATE;
  }
  const dark = def.dark.map(([x, y, w, h]) => ({ x, y, w, h }));
  const exit = tileCenter(def.exit[0], def.exit[1]);
  const playerStart = tileCenter(def.player[0], def.player[1]);
  const intel = def.intel.map(([x, y]) => ({
    ...tileCenter(x, y),
    taken: false,
  }));
  return { def, grid, dark, exit, playerStart, intel };
}

export function tileAt(world, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return WALL;
  return world.grid[tileIndex(tx, ty)];
}

export function isSolid(world, tx, ty) {
  return tileAt(world, tx, ty) !== FLOOR;
}

export function isDark(world, px, py) {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  return world.dark.some((z) => tx >= z.x && tx < z.x + z.w && ty >= z.y && ty < z.y + z.h);
}

// Line of sight between two pixel points: sample the segment and report
// whether any solid tile blocks it. Walls and crates both block vision.
export function hasLineOfSight(world, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / (TILE * 0.25)));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor((x0 + dx * t) / TILE);
    const ty = Math.floor((y0 + dy * t) / TILE);
    if (isSolid(world, tx, ty)) return false;
  }
  return true;
}

// Move a circle (radius r) by (dx, dy) with axis-separated collision:
// slide along a wall instead of sticking to it.
export function moveCircle(world, x, y, dx, dy, r) {
  let nx = x + dx;
  let ny = y;
  if (circleHitsSolid(world, nx, ny, r)) nx = x;
  ny = y + dy;
  if (circleHitsSolid(world, nx, ny, r)) ny = y;
  return { x: nx, y: ny };
}

function circleHitsSolid(world, x, y, r) {
  const x0 = Math.floor((x - r) / TILE);
  const x1 = Math.floor((x + r) / TILE);
  const y0 = Math.floor((y - r) / TILE);
  const y1 = Math.floor((y + r) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!isSolid(world, tx, ty)) continue;
      const cx = Math.max(tx * TILE, Math.min(x, (tx + 1) * TILE));
      const cy = Math.max(ty * TILE, Math.min(y, (ty + 1) * TILE));
      const ddx = x - cx;
      const ddy = y - cy;
      if (ddx * ddx + ddy * ddy < r * r) return true;
    }
  }
  return false;
}

// Flood fill from a tile: used at load time to make sure the exit and
// every intel can actually be reached on foot.
export function reachableCount(world, startTx, startTy) {
  const seen = new Uint8Array(COLS * ROWS);
  const queue = [[startTx, startTy]];
  seen[tileIndex(startTx, startTy)] = 1;
  let count = 0;
  while (queue.length > 0) {
    const [tx, ty] = queue.pop();
    count++;
    for (const [nx, ny] of [[tx + 1, ty], [tx - 1, ty], [tx, ty + 1], [tx, ty - 1]]) {
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      if (seen[tileIndex(nx, ny)] || isSolid(world, nx, ny)) continue;
      seen[tileIndex(nx, ny)] = 1;
      queue.push([nx, ny]);
    }
  }
  return { count, seen };
}
