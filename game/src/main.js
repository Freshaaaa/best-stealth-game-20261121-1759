// NIGHTSHIFT — game loop and state machine.
// Title -> playing -> caught / level clear -> next level -> all clear.
// This file wires input, world, guards, audio and rendering together;
// the rules live in guard.js and world.js, the pictures in render.js.

import { TILE, PLAYER_SPEED, INTEL_PICKUP_RADIUS, EXIT_RADIUS } from './config.js';
import { LEVELS } from './levels.js';
import { loadLevel, moveCircle, reachableCount } from './world.js';
import { createGuard, updateGuard } from './guard.js';
import { createInput, attachInput, moveDirection, consumeEdges } from './input.js';
import {
  createAudio,
  unlockAudio,
  toggleMute,
  playStep,
  playGuardStep,
  playAlert,
  playPickup,
  playCaught,
  playLevelClear,
  playWin,
} from './audio.js';
import { render } from './render.js';
import { shotFromUrl, applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const game = {
  state: 'title',
  levels: LEVELS,
  levelIndex: 0,
  world: null,
  player: { x: 0, y: 0, angle: -Math.PI / 2, moving: false },
  guards: [],
  time: 0,
  levelTime: 0,
  totalIntel: 0,
  totalTime: 0,
  audio: createAudio(),
  input: createInput(),
  stepTimer: 0,
  guardStepTimer: 0,
  alertSounded: false,
};

function startLevel(index) {
  game.levelIndex = index;
  game.world = loadLevel(LEVELS[index]);
  game.player.x = game.world.playerStart.x;
  game.player.y = game.world.playerStart.y;
  game.player.angle = -Math.PI / 2;
  game.player.moving = false;
  game.guards = LEVELS[index].guards.map((def) => createGuard(def));
  game.levelTime = 0;
  game.alertSounded = false;
  // Sanity check at load: the exit and every intel must be reachable.
  const startTx = Math.floor(game.world.playerStart.x / TILE);
  const startTy = Math.floor(game.world.playerStart.y / TILE);
  const { seen } = reachableCount(game.world, startTx, startTy);
  const exitTx = Math.floor(game.world.exit.x / TILE);
  const exitTy = Math.floor(game.world.exit.y / TILE);
  if (!seen[exitTy * 32 + exitTx]) console.warn('NIGHTSHIFT: exit unreachable on', LEVELS[index].name);
  for (const item of game.world.intel) {
    const tx = Math.floor(item.x / TILE);
    const ty = Math.floor(item.y / TILE);
    if (!seen[ty * 32 + tx]) console.warn('NIGHTSHIFT: intel unreachable on', LEVELS[index].name);
  }
}

function updatePlaying(dt) {
  const { input, player, world } = game;
  game.levelTime += dt;
  game.totalTime += dt;

  // Move the player.
  const dir = moveDirection(input, player.x, player.y);
  player.moving = dir.x !== 0 || dir.y !== 0;
  if (player.moving) {
    player.angle = Math.atan2(dir.y, dir.x);
    const step = PLAYER_SPEED * TILE * dt;
    const moved = moveCircle(world, player.x, player.y, dir.x * step, dir.y * step, 13);
    player.x = moved.x;
    player.y = moved.y;
    game.stepTimer += dt;
    if (game.stepTimer > 0.34) {
      game.stepTimer = 0;
      playStep(game.audio);
    }
  }

  // Guards: patrol, watch, chase. One touch ends the run.
  let maxAlert = 0;
  for (const guard of game.guards) {
    const result = updateGuard(guard, world, player, dt);
    maxAlert = Math.max(maxAlert, guard.alert);
    if (result === 'caught') {
      game.state = 'caught';
      playCaught(game.audio);
      return;
    }
  }
  // A guard's footsteps warn you when one is close.
  const nearGuard = game.guards.some((g) => Math.hypot(g.x - player.x, g.y - player.y) < 4.5 * TILE);
  if (nearGuard) {
    game.guardStepTimer += dt;
    if (game.guardStepTimer > 0.5) {
      game.guardStepTimer = 0;
      playGuardStep(game.audio);
    }
  }
  if (maxAlert >= 1 && !game.alertSounded) {
    game.alertSounded = true;
    playAlert(game.audio);
  }
  if (maxAlert < 0.5) game.alertSounded = false;

  // Intel pickup.
  for (const item of world.intel) {
    if (item.taken) continue;
    if (Math.hypot(item.x - player.x, item.y - player.y) < INTEL_PICKUP_RADIUS) {
      item.taken = true;
      game.totalIntel += 1;
      playPickup(game.audio);
    }
  }

  // Exit: reach it unseen to clear the level.
  if (Math.hypot(world.exit.x - player.x, world.exit.y - player.y) < EXIT_RADIUS) {
    game.state = 'levelClear';
    if (game.levelIndex === game.levels.length - 1) playWin(game.audio);
    else playLevelClear(game.audio);
  }
}

function update(dt) {
  const edges = consumeEdges(game.input);
  if (edges.mute) toggleMute(game.audio);
  if (edges.enter) unlockAudio(game.audio);

  if (game.state === 'title') {
    if (edges.enter) {
      unlockAudio(game.audio);
      startLevel(0);
      game.state = 'playing';
    }
    return;
  }
  if (game.state === 'playing') {
    updatePlaying(dt);
    return;
  }
  if (game.state === 'caught') {
    if (edges.restart) {
      startLevel(game.levelIndex);
      game.state = 'playing';
    }
    return;
  }
  if (game.state === 'levelClear') {
    if (edges.restart) {
      startLevel(game.levelIndex);
      game.state = 'playing';
    } else if (edges.enter && game.levelIndex < game.levels.length - 1) {
      startLevel(game.levelIndex + 1);
      game.state = 'playing';
    }
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  game.time += dt;
  update(dt);
  render(ctx, game);
  requestAnimationFrame(frame);
}

// Boot: level 0 under the title screen, then a screenshot scene if the
// URL asks for one (?shot=start|play|alert|exit).
startLevel(0);
attachInput(game.input, canvas);
const shot = shotFromUrl();
if (shot) applyShot(game, shot);
requestAnimationFrame(frame);
