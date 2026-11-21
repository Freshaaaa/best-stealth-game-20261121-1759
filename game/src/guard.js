// NIGHTSHIFT — guard AI.
// A guard patrols its waypoints, watches a vision cone, and gets
// suspicious when the player crosses it. Alert rises while the player
// is seen and decays while hidden; at full alert the guard chases, and
// gives up after a few seconds without a line of sight — so a player
// who breaks away can always recover.

import {
  TILE,
  VISION_RANGE,
  VISION_HALF_ANGLE,
  GUARD_PATROL_SPEED,
  GUARD_CHASE_SPEED,
  GUARD_RETURN_SPEED,
  ALERT_RISE_CLOSE,
  ALERT_RISE_MID,
  ALERT_RISE_FAR,
  ALERT_DECAY,
  DARK_ZONE_FACTOR,
  CHASE_GIVE_UP_SECONDS,
  CATCH_DISTANCE,
} from './config.js';
import { tileCenter, hasLineOfSight, moveCircle, isDark } from './world.js';

export function createGuard(def) {
  const points = def.waypoints.map(([tx, ty]) => tileCenter(tx, ty));
  const start = points[0];
  const next = points[1] ?? points[0];
  return {
    x: start.x,
    y: start.y,
    angle: Math.atan2(next.y - start.y, next.x - start.x),
    waypoints: points,
    wpIndex: 1 % points.length,
    state: 'patrol', // 'patrol' | 'chase'
    alert: 0,
    unseenTimer: 0,
    pauseTimer: 0,
    stepTimer: 0, // footstep sound clock
  };
}

// Is the player inside this guard's cone with a clear line of sight?
export function canSee(guard, world, px, py) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > VISION_RANGE) return { seen: false, dist };
  const toPlayer = Math.atan2(dy, dx);
  let diff = toPlayer - guard.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > VISION_HALF_ANGLE) return { seen: false, dist };
  if (!hasLineOfSight(world, guard.x, guard.y, px, py)) return { seen: false, dist };
  return { seen: true, dist };
}

function alertRiseRate(dist, inDark) {
  const tiles = dist / TILE;
  let rate = ALERT_RISE_FAR;
  if (tiles < 2) rate = ALERT_RISE_CLOSE;
  else if (tiles < 4) rate = ALERT_RISE_MID;
  return inDark ? rate * DARK_ZONE_FACTOR : rate;
}

// Returns 'caught' when this guard touches the player, else null.
export function updateGuard(guard, world, player, dt) {
  const { seen, dist } = canSee(guard, world, player.x, player.y);

  if (seen) {
    guard.unseenTimer = 0;
    guard.alert = Math.min(1, guard.alert + alertRiseRate(dist, isDark(world, player.x, player.y)) * dt);
  } else {
    guard.alert = Math.max(0, guard.alert - ALERT_DECAY * dt);
    if (guard.state === 'chase') guard.unseenTimer += dt;
  }

  if (guard.alert >= 1 && guard.state !== 'chase') {
    guard.state = 'chase';
    guard.unseenTimer = 0;
  }

  if (guard.state === 'chase') {
    // Chase the player; give up after a while without a line of sight.
    if (guard.unseenTimer >= CHASE_GIVE_UP_SECONDS) {
      guard.state = 'patrol';
      guard.alert = 0;
      guard.wpIndex = nearestWaypoint(guard);
    } else {
      const target = Math.atan2(player.y - guard.y, player.x - guard.x);
      guard.angle = turnToward(guard.angle, target, dt * 6);
      const step = moveToward(guard, player.x, player.y, GUARD_CHASE_SPEED * TILE * dt, world);
      guard.x = step.x;
      guard.y = step.y;
      guard.stepTimer += dt;
      if (Math.hypot(player.x - guard.x, player.y - guard.y) < CATCH_DISTANCE) {
        return 'caught';
      }
    }
    return null;
  }

  // Patrol: walk to the next waypoint, pause briefly, turn to the next.
  if (guard.pauseTimer > 0) {
    guard.pauseTimer -= dt;
    if (guard.pauseTimer <= 0) {
      const target = guard.waypoints[guard.wpIndex];
      guard.angle = Math.atan2(target.y - guard.y, target.x - guard.x);
    }
    return null;
  }
  const target = guard.waypoints[guard.wpIndex];
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const wpDist = Math.hypot(dx, dy);
  const stepLen = GUARD_PATROL_SPEED * TILE * dt;
  if (wpDist <= Math.max(stepLen, 4)) {
    guard.x = target.x;
    guard.y = target.y;
    guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
    guard.pauseTimer = 0.7;
  } else {
    guard.angle = Math.atan2(dy, dx);
    const step = moveCircle(world, guard.x, guard.y, (dx / wpDist) * stepLen, (dy / wpDist) * stepLen, TILE * 0.32);
    guard.x = step.x;
    guard.y = step.y;
    guard.stepTimer += dt;
  }
  return null;
}

function moveToward(guard, tx, ty, stepLen, world) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return { x: guard.x, y: guard.y };
  return moveCircle(world, guard.x, guard.y, (dx / dist) * stepLen, (dy / dist) * stepLen, TILE * 0.32);
}

function nearestWaypoint(guard) {
  let best = 0;
  let bestDist = Infinity;
  guard.waypoints.forEach((wp, i) => {
    const d = Math.hypot(wp.x - guard.x, wp.y - guard.y);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

function turnToward(angle, target, maxStep) {
  let diff = target - angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) <= maxStep) return target;
  return angle + Math.sign(diff) * maxStep;
}

// Used when a chase ends far from the route: walk back to the nearest
// waypoint instead of teleporting.
export function returnSpeed() {
  return GUARD_RETURN_SPEED;
}
