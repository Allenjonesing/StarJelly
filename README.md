# ★ StarJelly

A browser-based jelly-blob physics survival game built with [Phaser 3](https://phaser.io/).

---

## Concept

You are **StarJelly** – a conglomerate blob made up of many smaller jelly sub-blobs.
Your health **is** your blob count. Lose all your blobs and it's game over.

Enemies approach in waves and will try to eat your blobs. Fight back by
shooting pieces of yourself at them. Missed shots always return to you.
Collect the glowing cyan blobs that occasionally appear to grow your cluster.

---

## Controls

| Input | Action |
|-------|--------|
| **Hold & drag** anywhere | Slide the whole jelly cluster in that direction |
| **Tap / click** | Launch the nearest sub-blob toward that point to attack |

> Works on both desktop (mouse) and mobile (touch).

---

## Gameplay

- You start with **10 sub-blobs**.
- Sub-blobs are held together by a magnetic spring force – they wobble and squish like real jelly.
- **Shooting** temporarily detaches one blob and fires it as a projectile.  
  - If it **hits an enemy** the enemy takes damage, the blob returns to you immediately.  
  - If it **misses**, the blob bounces around for ~2 seconds then pulls back to the cluster.
- **Enemies** (red blobs) appear in waves. They chase your cluster; if one touches a sub-blob it eats it (**-1 health**). Each enemy gets a short cool-down after eating so you have a chance to shoot it.
- **Cyan pickup blobs** appear periodically. Touch them with your cluster to absorb an extra sub-blob (+1 health, +25 score).
- Score: **+10** per hit, **+50** per kill, **+25** per pickup collected.
- Enemy waves get larger and faster as the wave number climbs.

---

## How to Run

The game is a static web app — no build step required.

```bash
# Install a simple static server (first time only)
npm install

# Serve the project (use any static server, e.g. http-server or live-server)
npx http-server . -p 8080
# then open http://localhost:8080
```

Or just open `index.html` directly in a browser that allows local file scripts
(Chrome/Edge work fine with `--allow-file-access-from-files`).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Game framework | [Phaser 3](https://phaser.io/) (`lib/phaser.min.js`) |
| Rendering | Phaser `Graphics` (procedural, no external sprites needed) |
| Physics | Custom spring/repulsion + velocity integration (no Box2D) |
| Platform | Runs entirely in the browser, no server required |

---

## Project Structure

```
StarJelly/
├── index.html        # Entry point
├── app.js            # All game logic (TitleScene, GameScene, GameOverScene)
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
