// NIGHTSHIFT — configuration.
// One place for every number the game tunes: tile size, speeds, vision,
// detection rates and the palette. Nothing here is game logic.

export const TILE = 40;
export const COLS = 32;
export const ROWS = 20;
export const VIEW_W = COLS * TILE; // 1280
export const VIEW_H = ROWS * TILE; // 800

// Movement (tiles per second).
export const PLAYER_SPEED = 4.2;
export const GUARD_PATROL_SPEED = 1.9;
export const GUARD_CHASE_SPEED = 3.1;
export const GUARD_RETURN_SPEED = 2.2;

// Vision cone.
export const VISION_RANGE = 5.6 * TILE; // pixels
export const VISION_HALF_ANGLE = 0.61; // radians (~35 degrees)
export const VISION_STEPS = 52; // rays sampled for the cone polygon

// Detection. Alert is 0..1 per guard; at 1 the guard chases.
export const ALERT_RISE_CLOSE = 1.6; // per second, player < 2 tiles away
export const ALERT_RISE_MID = 0.9; // per second, 2..4 tiles away
export const ALERT_RISE_FAR = 0.45; // per second, beyond 4 tiles
export const ALERT_DECAY = 0.35; // per second while unseen
export const DARK_ZONE_FACTOR = 0.45; // alert rises slower in shadow
export const CHASE_GIVE_UP_SECONDS = 3.0; // unseen this long -> patrol again
export const CATCH_DISTANCE = 0.7 * TILE; // guard touches player -> caught

export const INTEL_PICKUP_RADIUS = 0.8 * TILE;
export const EXIT_RADIUS = 0.9 * TILE;

// Palette — a dark facility at night: deep blue-teal shadows, warm amber lamps.
// The player is teal, the guards are rust red, the light is amber.
export const COLORS = {
  floorA: '#1a2231',
  floorB: '#161d2a',
  floorLine: '#202a3c',
  floorSpeck: 'rgba(255, 255, 255, 0.05)',
  floorStain: 'rgba(6, 9, 16, 0.28)',
  floorGrate: '#0d1320',
  wall: '#39415a',
  wallTop: '#5a688a',
  wallEdge: '#232a3d',
  wallShadow: 'rgba(4, 7, 13, 0.5)',
  crate: '#6b5433',
  crateEdge: '#8a6f45',
  crateDark: '#4a3a22',
  crateMetal: '#9aa5b8',
  darkZone: 'rgba(8, 12, 24, 0.55)',
  exitGlow: '#39d98a',
  exitDoor: '#0f3d28',
  intel: '#ffd166',
  player: '#2dd4bf',
  playerDark: '#0f766e',
  guard: '#e05d44',
  guardDark: '#7f2d1e',
  conePatrol: 'rgba(255, 214, 90, 0.20)',
  coneSuspicious: 'rgba(255, 150, 60, 0.30)',
  coneChase: 'rgba(255, 60, 50, 0.34)',
  coneEdge: 'rgba(255, 214, 90, 0.35)',
  hudBar: 'rgba(10, 14, 22, 0.82)',
  hudText: '#dbe4f0',
  hudDim: '#8b98ad',
  title: '#e8eef7',
  accent: '#ffd166',
  danger: '#ff5a4e',
  // New: lighting and atmosphere.
  lampGlow: 'rgba(255, 180, 84, 0.55)',
  lampCore: 'rgba(255, 205, 120, 0.9)',
  moonlight: 'rgba(90, 130, 200, 0.10)',
  vignette: 'rgba(3, 5, 10, 0.55)',
  dust: 'rgba(200, 220, 255, 0.35)',
  ray: 'rgba(255, 190, 100, 0.05)',
  coneCore: 'rgba(255, 224, 130, 0.28)',
  coneChaseCore: 'rgba(255, 90, 70, 0.30)',
  panel: 'rgba(8, 12, 22, 0.72)',
  gold: '#ffb454',
};
