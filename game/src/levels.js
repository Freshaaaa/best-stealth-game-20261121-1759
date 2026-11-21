// NIGHTSHIFT — level definitions.
// Three facilities, each harder than the last. A level is walls and crates
// (rectangles in tile coordinates), shadow zones, and the spawn points for
// the player, the exit, the intel and the guards' patrol waypoints.
// Border walls are added by the world loader; these are the interiors.

export const LEVELS = [
  {
    name: 'WAREHOUSE',
    subtitle: 'Night shift — get in, grab the intel, get out unseen.',
    walls: [
      [8, 1, 1, 5],
      [8, 8, 1, 5],
      [20, 1, 1, 5],
      [20, 8, 1, 5],
      [12, 9, 6, 1],
      [12, 14, 6, 1],
    ],
    crates: [
      [4, 3], [5, 3], [14, 4], [25, 3], [26, 3],
      [4, 16], [25, 16], [26, 16], [14, 15], [6, 10], [24, 10],
    ],
    dark: [
      [2, 8, 4, 3],
      [26, 8, 4, 3],
    ],
    player: [2, 2],
    exit: [29, 17],
    intel: [[6, 2], [16, 6], [28, 10]],
    guards: [
      { waypoints: [[12, 3], [18, 3], [18, 6], [12, 6]] },
      { waypoints: [[22, 12], [28, 12], [28, 16], [22, 16]] },
    ],
  },
  {
    name: 'OFFICE',
    subtitle: 'More eyes, tighter corridors. The shadows are your friends.',
    walls: [
      [6, 1, 1, 7],
      [6, 11, 1, 7],
      [14, 1, 1, 4],
      [14, 7, 1, 4],
      [14, 13, 1, 5],
      [22, 1, 1, 7],
      [22, 11, 1, 7],
      [8, 9, 5, 1],
      [18, 9, 5, 1],
    ],
    crates: [
      [3, 5], [10, 3], [17, 5], [26, 5], [10, 16],
      [17, 15], [26, 16], [3, 15], [12, 12], [19, 12],
    ],
    dark: [
      [9, 4, 3, 3],
      [24, 13, 3, 3],
      [2, 13, 3, 3],
    ],
    player: [2, 2],
    exit: [29, 2],
    intel: [[9, 17], [16, 2], [28, 17]],
    guards: [
      { waypoints: [[8, 4], [12, 4], [12, 7], [8, 7]] },
      { waypoints: [[16, 12], [20, 12], [20, 16], [16, 16]] },
      { waypoints: [[24, 4], [28, 4], [28, 8], [24, 8]] },
    ],
  },
  {
    name: 'VAULT',
    subtitle: 'Four guards, one vault. Patience wins.',
    walls: [
      [5, 1, 1, 6],
      [5, 10, 1, 7],
      [11, 1, 1, 4],
      [11, 8, 1, 4],
      [11, 14, 1, 4],
      [17, 1, 1, 6],
      [17, 10, 1, 7],
      [23, 1, 1, 4],
      [23, 8, 1, 4],
      [23, 14, 1, 4],
      [7, 9, 3, 1],
      [13, 9, 3, 1],
      [19, 9, 3, 1],
      [25, 9, 3, 1],
    ],
    crates: [
      [2, 8], [8, 5], [14, 6], [20, 5], [26, 6],
      [8, 16], [14, 13], [20, 16], [26, 13], [2, 16], [29, 8],
    ],
    dark: [
      [3, 11, 3, 3],
      [13, 4, 3, 3],
      [27, 11, 3, 3],
    ],
    player: [2, 17],
    exit: [29, 2],
    intel: [[8, 17], [15, 17], [28, 16]],
    guards: [
      { waypoints: [[7, 3], [10, 3], [10, 6], [7, 6]] },
      { waypoints: [[13, 12], [16, 12], [16, 16], [13, 16]] },
      { waypoints: [[19, 3], [22, 3], [22, 6], [19, 6]] },
      { waypoints: [[25, 12], [28, 12], [28, 16], [25, 16]] },
    ],
  },
];
