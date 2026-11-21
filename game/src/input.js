// NIGHTSHIFT — input.
// Keyboard (WASD / arrows) and mouse (click-to-move target). One object,
// updated by event listeners, read by the game loop. No game logic here.

export function createInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    // Click-to-move: pixel target, or null when no click is active.
    clickX: null,
    clickY: null,
    // Edge-triggered keys, consumed by the game loop each frame.
    pressedEnter: false,
    pressedRestart: false,
    pressedMute: false,
  };
}

const KEY_MAP = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

export function attachInput(input, canvas) {
  window.addEventListener('keydown', (event) => {
    const dir = KEY_MAP[event.code];
    if (dir) {
      input[dir] = true;
      input.clickX = null;
      input.clickY = null;
      event.preventDefault();
      return;
    }
    if (event.code === 'Enter') {
      input.pressedEnter = true;
      event.preventDefault();
    } else if (event.code === 'KeyR') {
      input.pressedRestart = true;
    } else if (event.code === 'KeyM') {
      input.pressedMute = true;
    }
  });

  window.addEventListener('keyup', (event) => {
    const dir = KEY_MAP[event.code];
    if (dir) input[dir] = false;
  });

  window.addEventListener('blur', () => {
    input.up = false;
    input.down = false;
    input.left = false;
    input.right = false;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.clickX = event.clientX - rect.left;
    input.clickY = event.clientY - rect.top;
  });
}

// Direction vector from the held keys (or the click target), normalised.
// Returns { x, y } with length 0 when idle, or 1 when moving.
export function moveDirection(input, px, py) {
  let x = 0;
  let y = 0;
  if (input.left) x -= 1;
  if (input.right) x += 1;
  if (input.up) y -= 1;
  if (input.down) y += 1;
  if (x !== 0 || y !== 0) {
    const len = Math.hypot(x, y);
    return { x: x / len, y: y / len };
  }
  if (input.clickX !== null && input.clickY !== null) {
    const dx = input.clickX - px;
    const dy = input.clickY - py;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      input.clickX = null;
      input.clickY = null;
      return { x: 0, y: 0 };
    }
    return { x: dx / dist, y: dy / dist };
  }
  return { x: 0, y: 0 };
}

export function consumeEdges(input) {
  const edges = {
    enter: input.pressedEnter,
    restart: input.pressedRestart,
    mute: input.pressedMute,
  };
  input.pressedEnter = false;
  input.pressedRestart = false;
  input.pressedMute = false;
  return edges;
}
