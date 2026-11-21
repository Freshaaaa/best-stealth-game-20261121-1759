// NIGHTSHIFT — sound.
// Tiny WebAudio synth: no audio files, everything is an oscillator.
// Footsteps tick while the player moves, a sting rises with the alert,
// a chime marks intel, and short phrases open and close a level.
// M toggles mute. Audio starts on the first user gesture.

export function createAudio() {
  return { ctx: null, muted: false };
}

function ensureCtx(audio) {
  if (!audio.ctx) {
    try {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      audio.ctx = new Ctor();
    } catch {
      audio.ctx = null;
    }
  }
  if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
  return audio.ctx;
}

function tone(audio, freq, dur, type, gain, when = 0) {
  if (audio.muted) return;
  const ctx = ensureCtx(audio);
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function unlockAudio(audio) {
  ensureCtx(audio);
}

export function toggleMute(audio) {
  audio.muted = !audio.muted;
  return audio.muted;
}

export function playStep(audio) {
  tone(audio, 180 + Math.random() * 40, 0.05, 'triangle', 0.05);
}

export function playGuardStep(audio) {
  tone(audio, 110, 0.06, 'sine', 0.04);
}

export function playAlert(audio) {
  tone(audio, 620, 0.12, 'square', 0.06);
  tone(audio, 830, 0.16, 'square', 0.06, 0.1);
}

export function playPickup(audio) {
  tone(audio, 880, 0.1, 'sine', 0.08);
  tone(audio, 1318, 0.14, 'sine', 0.07, 0.08);
}

export function playCaught(audio) {
  tone(audio, 220, 0.25, 'sawtooth', 0.09);
  tone(audio, 165, 0.3, 'sawtooth', 0.09, 0.18);
  tone(audio, 110, 0.45, 'sawtooth', 0.09, 0.36);
}

export function playLevelClear(audio) {
  tone(audio, 523, 0.12, 'sine', 0.08);
  tone(audio, 659, 0.12, 'sine', 0.08, 0.11);
  tone(audio, 784, 0.2, 'sine', 0.08, 0.22);
}

export function playWin(audio) {
  tone(audio, 523, 0.14, 'sine', 0.08);
  tone(audio, 659, 0.14, 'sine', 0.08, 0.13);
  tone(audio, 784, 0.14, 'sine', 0.08, 0.26);
  tone(audio, 1046, 0.3, 'sine', 0.09, 0.39);
}
