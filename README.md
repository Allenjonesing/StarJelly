# ★ StarJelly – Lab Escape

A browser-based 2D **side-scrolling platformer** built with [Phaser 3](https://phaser.io/).

---

## Concept

You are **StarJelly** – a sentient jelly-blob experiment that broke free inside a research
laboratory. Fight your way through scientists and security guards, collect jelly vats to grow
stronger, and reach the exit on each level to escape!

Your health **is** your blob count. Lose all your sub-blobs and it's game over.

---

## Controls

| Input | Action |
|-------|--------|
| **A / ←** | Move left |
| **D / →** | Move right |
| **W / ↑ / Space** | Jump (while on ground) |
| **Click / Tap** | Shoot the nearest sub-blob toward that point |
| **On-screen ◀ ▶ ▲** | Touch controls for mobile |

---

## Gameplay

- You start with **8 sub-blobs** forming a connected jelly cluster.
- Sub-blobs are held together by spring forces – they wobble and squish like real jelly.
- **Gravity** pulls the cluster down; you can jump between platforms and climb staircases.
- **Shooting** detaches one blob and fires it in a ballistic arc toward your target.  
  - The projectile **falls with gravity** and lands on the ground/platform.  
  - Landed blobs **do not return automatically** – walk over them to collect.  
  - A hit enemy takes damage; killing it awards points.
- **Enemies:**
  - 🥼 **Scientist** – patrols, shoots darts. 2 HP.
  - 🪖 **Guard** – tougher, faster shots. 3 HP.
  - 🔥 **Flamethrower** (Level 3) – shoots fire cones that **destroy blobs instantly**. 4 HP. Attack from behind or above!
- **Jelly Vats** (green cylinders) – touch them to grow your cluster by 3 blobs.
- **Water Puddles** – walk through to convert them into 2 extra blobs.
- **Fire Hazards** – avoid static fire pools in Level 3; they destroy blobs on contact.
- Reach the **glowing green EXIT** door at the end of each level to advance.

### Scoring
| Event | Points |
|-------|--------|
| Hit an enemy | +10 |
| Kill an enemy | +50 |
| Collect a jelly vat | +30 |
| Convert a water puddle | +20 |

---

## Levels

| # | Name | Enemies | Special |
|---|------|---------|---------|
| 1 | Specimen Chamber | Scientists | Tutorial-friendly layout |
| 2 | Research Corridor | Scientists + Guards | Staircases, water puddles |
| 3 | Security Wing | Guards + Flamethrowers | Fire hazards, toughest layout |

---

## Accomplishments

There are **11 hidden accomplishments** to unlock — from "First Blood" (first kill) to "Free at Last"
(escape the lab). They are tracked in `localStorage` and shown on the title screen and game-over screen.

---

## How to Run

The game is a static web app — no build step required.

```bash
# Serve the project with any static server
npx http-server . -p 8080
# then open http://localhost:8080
```

Or open `index.html` directly in a browser (Chrome/Edge work fine).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Game framework | [Phaser 3](https://phaser.io/) (`lib/phaser.min.js`) |
| Rendering | Phaser `Graphics` (procedural – no external sprites needed) |
| Physics | Custom spring/repulsion + gravity + platform collision |
| Platform | Runs entirely in the browser, no server required |

---

## Project Structure

```
StarJelly/
├── index.html        # Entry point
├── app.js            # All game logic (TitleScene, GameScene, GameOverScene, WinScene)
├── styles.css        # Minimal full-screen canvas styles
├── lib/
│   └── phaser.min.js # Phaser 3 engine (bundled)
├── assets/           # Legacy image assets (not used by current version)
├── package.json
└── README.md
```

---

## License

Copyright © Jonesing Studio. All rights reserved.
