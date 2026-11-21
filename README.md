[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/freshaaaa/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/freshaaaa/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

# NIGHTSHIFT — a stealth game

A 2D top-down stealth game for make.fun's ["Make the best stealth game"](https://make.fun/bounty/best-stealth-game-20261121-1759) bounty ($50 in USDC).

Slip through a dark facility at night: learn the guards' patrols, hide behind crates and walls that block their vision cones, use the shadows to slow detection, grab the intel, and reach the exit unseen. Get spotted and the guard chases — break the line of sight and you can still recover.

## How to play

- **Move:** WASD / arrow keys, or click anywhere to walk there.
- **Guards:** patrol routes with vision cones (yellow while patrolling, orange when suspicious, red when chasing). If a guard's alert meter fills, it chases you; if it touches you, you're caught.
- **Cover:** crates and walls block vision. Shadow zones slow detection.
- **Goal:** reach the green EXIT. Collect the 3 intel documents per level for a better run.
- **Levels:** Warehouse → Office → Vault, each with more guards and tighter routes.
- **Keys:** Enter to start / next level, R to retry a level, M to mute.

## How it works

`game/` is plain static files (canvas + vanilla JS, no library, no network). `main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` to `/output` and writes `dossier.json` via the vendored make.fun library. Serve it locally with `node serve.ts` and open http://localhost:8080.

## Screenshots

1. Title screen · 2. Mid-infiltration behind cover · 3. Spotted — red cone by the exit · 4. Out clean.
