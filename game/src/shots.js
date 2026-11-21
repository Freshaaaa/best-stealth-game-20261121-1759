// NIGHTSHIFT — screenshot scenes.
// The screenshots are real renders of the game, taken with ?shot= in the
// URL. Each shot pins the player, the guards and the clock to one fixed
// moment, so the same URL always renders the same picture.

import { TILE } from './config.js';
import { tileCenter } from './world.js';

export function shotFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get('shot');
  } catch {
    return null;
  }
}

function placePlayer(game, tx, ty, angle) {
  const p = tileCenter(tx, ty);
  game.player.x = p.x;
  game.player.y = p.y;
  game.player.angle = angle;
  game.player.moving = false;
}

function placeGuard(game, index, tx, ty, angle, state, alert) {
  const guard = game.guards[index];
  if (!guard) return;
  const p = tileCenter(tx, ty);
  guard.x = p.x;
  guard.y = p.y;
  guard.angle = angle;
  guard.state = state;
  guard.alert = alert;
  guard.unseenTimer = 0;
  guard.pauseTimer = 0;
}

// Pins one deterministic scene. Returns true when a shot was applied.
export function applyShot(game, shot) {
  if (!shot) return false;
  game.time = 1.0;
  game.levelTime = 42;
  if (shot === 'start') {
    game.state = 'title';
    return true;
  }
  if (shot === 'play') {
    // Mid-infiltration: the player waits behind a crate while a guard
    // patrols past, cone yellow, exit glowing in the far corner.
    game.state = 'playing';
    placePlayer(game, 10, 6, -Math.PI / 2);
    placeGuard(game, 0, 15, 3, Math.PI, 'patrol', 0);
    placeGuard(game, 1, 25, 14, Math.PI / 2, 'patrol', 0.2);
    return true;
  }
  if (shot === 'alert') {
    // The near miss: a guard has the player in a red cone by the exit,
    // the player one dash from the door.
    game.state = 'playing';
    placePlayer(game, 27, 15, Math.PI / 4);
    placeGuard(game, 0, 15, 3, Math.PI, 'patrol', 0);
    placeGuard(game, 1, 24, 13, Math.PI / 4, 'chase', 1);
    return true;
  }
  if (shot === 'exit') {
    // Out clean: every intel taken, the player on the exit, level clear.
    game.state = 'levelClear';
    for (const item of game.world.intel) item.taken = true;
    placePlayer(game, 29, 17, 0);
    placeGuard(game, 0, 15, 3, Math.PI, 'patrol', 0);
    placeGuard(game, 1, 25, 14, Math.PI / 2, 'patrol', 0);
    return true;
  }
  return false;
}
