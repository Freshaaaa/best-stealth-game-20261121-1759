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

// Palette — NEON NOIR: near-black shadows, hot teal hero, molten amber
// lamps, blood-red chase cones, vivid green exit. One direction, pushed
// hard: the dark is darker, the light is hotter, the accents glow.
export const COLORS = {
  floorA: '#0f1626',
  floorB: '#0b101d',
  floorLine: '#1c2740',
  floorSpeck: 'rgba(255, 255, 255, 0.06)',
  floorStain: 'rgba(2, 4, 9, 0.42)',
  floorGrate: '#070c16',
  wall: '#3a4360',
  wallTop: '#5f6d94',
  wallEdge: '#1e2436',
  wallShadow: 'rgba(2, 4, 8, 0.6)',
  crate: '#6b5433',
  crateEdge: '#8a6f45',
  crateDark: '#4a3a22',
  crateMetal: '#9aa5b8',
  darkZone: 'rgba(3, 6, 12, 0.68)',
  exitGlow: '#2bff9e',
  exitDoor: '#0c3524',
  intel: '#ffd166',
  player: '#2dd4bf',
  playerDark: '#0f766e',
  guard: '#ff5a3c',
  guardDark: '#7f2d1e',
  conePatrol: 'rgba(255, 196, 60, 0.30)',
  coneSuspicious: 'rgba(255, 140, 40, 0.38)',
  coneChase: 'rgba(255, 55, 45, 0.44)',
  coneEdge: 'rgba(255, 205, 80, 0.5)',
  hudBar: 'rgba(8, 11, 19, 0.86)',
  hudText: '#dbe4f0',
  hudDim: '#8b98ad',
  title: '#e8eef7',
  accent: '#ffd166',
  danger: '#ff5a4e',
  // Lighting and atmosphere.
  lampGlow: 'rgba(255, 175, 70, 0.7)',
  lampCore: 'rgba(255, 210, 130, 1)',
  moonlight: 'rgba(80, 120, 200, 0.08)',
  vignette: 'rgba(2, 3, 8, 0.68)',
  dust: 'rgba(200, 220, 255, 0.35)',
  ray: 'rgba(255, 190, 100, 0.05)',
  coneCore: 'rgba(255, 220, 110, 0.38)',
  coneChaseCore: 'rgba(255, 100, 70, 0.42)',
  panel: 'rgba(6, 9, 17, 0.75)',
  gold: '#ffb454',
  // Neon-noir accents and floor props.
  neonTeal: '#35f5d8',
  neonAmber: '#ffb02e',
  playerHalo: 'rgba(53, 245, 216, 0.22)',
  barrel: '#7a3b2e',
  barrelDark: '#451f16',
  barrelEdge: '#b0613f',
  pipe: '#4d5a75',
  pipeDark: '#2a3350',
  pipeLight: '#7d8db0',
  paper: '#cfd6e2',
  plant: '#1d4d33',
  plantDark: '#0f2f1e',
  puddle: 'rgba(140, 180, 255, 0.13)',
  puddleSheen: 'rgba(255, 190, 100, 0.18)',
  vent: '#080d18',
  hazard: '#e8b93a',
};
