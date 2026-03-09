// ─────────────────────────────────────────────────────────────────────────────
// StarJelly  –  A jelly-blob physics game
// Controls:  DRAG anywhere  →  slide your blob cluster
//            TAP / CLICK    →  shoot a sub-blob in that direction
// ─────────────────────────────────────────────────────────────────────────────

// ── Physics constants ────────────────────────────────────────────────────────
const BLOB_R      = 15;          // sub-blob radius (px)
const SPRING_REST = BLOB_R * 2.5; // spring natural length
const K_SPRING    = 0.045;        // spring stiffness
const K_REPEL     = 0.40;         // overlap repulsion
const REPEL_D     = BLOB_R * 1.85;// repulsion kicks in below this dist
const FRICTION    = 0.87;         // velocity decay per step
const MAX_SPD     = 10;           // max sub-blob speed

// ── Projectile constants ─────────────────────────────────────────────────────
const SHOOT_V      = 15;    // launch speed
const RETURN_AFTER = 1800;  // ms before a miss starts returning
const RETURN_K     = 0.10;  // pull-back acceleration
const REUNITE_D    = BLOB_R * 2.2; // distance to cluster to rejoin

// ── Game constants ────────────────────────────────────────────────────────────
const N_START            = 10;    // starting sub-blobs
const PICKUP_INTERVAL    = 9000;  // ms between bonus blob pickups
const WAVE_BONUS_BLOBS   = 3;     // slime blobs rewarded after clearing a wave
const BETWEEN_WAVE_DELAY = 3500;  // ms of downtime between waves
const DRAG_FORCE         = 0.015; // continuous-drag force coefficient

// ── Palette ───────────────────────────────────────────────────────────────────
const C_PLAYER    = 0x00dd77;
const C_PLAYER_HI = 0x22ff99;
const C_PROJ      = 0xddff00;
const C_ENEMY     = 0xdd2200;
const C_PICKUP    = 0x00eeff;

// =============================================================================
//  GameScene
// Normalize raw Phaser delta (ms) to 60-fps time units, capped to avoid spiral of death
function normDt(delta) { return Math.min(delta / 16.667, 3); }

// =============================================================================
class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    create() {
        this.cameras.main.setBackgroundColor('#080818');

        // State
        this.blobs   = [];   // active sub-blobs (the player "body")
        this.projs   = [];   // launched projectile blobs
        this.enemies = [];
        this.pickups = [];
        this.score   = 0;
        this.wave    = 0;
        this.dead    = false;
        this.waveActive   = false; // true while enemies are alive in the current wave
        this.betweenWaves = false; // true during the countdown between waves

        // Pointer / drag tracking
        this.ptrDown    = false;
        this.dragging   = false;
        this.ptrT       = 0;
        this.ptrStart   = null;
        this.ptrCurrent = null;

        // Graphics layers (back → front)
        this.gSlime  = this.add.graphics().setDepth(1);
        this.gEnemy  = this.add.graphics().setDepth(2);
        this.gPickup = this.add.graphics().setDepth(3);
        this.gProj   = this.add.graphics().setDepth(4);
        this.gBlob   = this.add.graphics().setDepth(5);
        this.gFx     = this.add.graphics().setDepth(6);

        // Spawn the starting cluster at the centre of the screen
        this._initCluster(this.scale.width / 2, this.scale.height / 2, N_START);

        this._createUI();

        // Input
        this.input.on('pointerdown',  this._onDown, this);
        this.input.on('pointermove',  this._onMove, this);
        this.input.on('pointerup',    this._onUp,   this);

        // Timers
        // First wave fires after a short delay; subsequent waves are triggered
        // by _onWaveComplete once all enemies are cleared.
        this.time.delayedCall(500, this._spawnWave, [], this);

        this.time.addEvent({
            delay: PICKUP_INTERVAL,
            callback: this._spawnPickup,
            callbackScope: this,
            loop: true
        });

        // Re-anchor right-aligned UI on resize
        this.scale.on('resize', (gs) => {
            if (this.txtWave)         this.txtWave.setX(gs.width - 16);
            if (this.txtHint)         this.txtHint.setX(gs.width / 2).setY(gs.height - 35);
            if (this.txtWaveBanner)   this.txtWaveBanner.setX(gs.width / 2).setY(gs.height / 2 - 90);
            if (this.txtWaveComplete) this.txtWaveComplete.setX(gs.width / 2).setY(gs.height / 2 - 60);
            if (this.txtWaveReward)   this.txtWaveReward.setX(gs.width / 2).setY(gs.height / 2);
            if (this.txtNextWave)     this.txtNextWave.setX(gs.width / 2).setY(gs.height / 2 + 60);
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    _makeBlob(x, y, vx = 0, vy = 0) {
        return {
            x, y, vx, vy,
            radius: BLOB_R,
            phase : Math.random() * Math.PI * 2,
            pSpeed: 0.04 + Math.random() * 0.04
        };
    }

    _initCluster(cx, cy, n) {
        for (let i = 0; i < n; i++) {
            const a    = (Math.PI * 2 * i / n);
            const ring = Math.floor(i / 6);
            const r    = (i === 0) ? 0 : SPRING_REST * (ring + 0.7);
            this.blobs.push(this._makeBlob(
                cx + Math.cos(a) * r + (Math.random() - 0.5) * 4,
                cy + Math.sin(a) * r + (Math.random() - 0.5) * 4
            ));
        }
    }

    _center() {
        if (!this.blobs.length) {
            return { x: this.scale.width / 2, y: this.scale.height / 2 };
        }
        let cx = 0, cy = 0;
        for (const b of this.blobs) { cx += b.x; cy += b.y; }
        return { x: cx / this.blobs.length, y: cy / this.blobs.length };
    }

    // ── Input ─────────────────────────────────────────────────────────────────
    _onDown(p) {
        this.ptrDown    = true;
        this.dragging   = false;
        this.ptrT       = this.time.now;
        this.ptrStart   = { x: p.x, y: p.y };
        this.ptrCurrent = { x: p.x, y: p.y };
    }

    _onMove(p) {
        if (!this.ptrDown) return;
        const dx = p.x - this.ptrStart.x, dy = p.y - this.ptrStart.y;
        if (Math.hypot(dx, dy) > 12 || this.time.now - this.ptrT > 150) {
            this.dragging = true;
        }
        this.ptrCurrent = { x: p.x, y: p.y };
    }

    _onUp(p) {
        if (!this.ptrDown) return;
        const dx = p.x - this.ptrStart.x, dy = p.y - this.ptrStart.y;
        if (!this.dragging && Math.hypot(dx, dy) < 15 && this.time.now - this.ptrT < 500) {
            this._shoot(p.x, p.y);
        }
        this.ptrDown    = false;
        this.dragging   = false;
        this.ptrCurrent = null;
    }

    // ── Shooting ──────────────────────────────────────────────────────────────
    _shoot(tx, ty) {
        if (this.dead || this.blobs.length <= 1) return;

        const c   = this._center();
        const dx  = tx - c.x, dy = ty - c.y;
        const len = Math.hypot(dx, dy) || 1;

        // Pick the sub-blob most aligned with the target direction
        let best = null, bestDot = -Infinity;
        for (const b of this.blobs) {
            const dot = (b.x - c.x) * dx / len + (b.y - c.y) * dy / len;
            if (dot > bestDot) { bestDot = dot; best = b; }
        }
        if (!best) return;

        this.blobs = this.blobs.filter(b => b !== best);
        this.projs.push({
            x : best.x, y : best.y,
            vx: dx / len * SHOOT_V + best.vx,
            vy: dy / len * SHOOT_V + best.vy,
            radius : BLOB_R,
            t0     : this.time.now,
            trail  : [],
            phase  : best.phase,
            pSpeed : best.pSpeed,
            reunite: false
        });
    }

    // ── Spawners ──────────────────────────────────────────────────────────────
    _spawnWave() {
        if (this.dead) return;
        this.wave++;
        this.waveActive   = true;
        this.betweenWaves = false;
        if (this.txtWave) this.txtWave.setText(`Wave ${this.wave}`);

        // Show wave announcement banner
        if (this.txtWaveBanner) {
            this.txtWaveBanner.setText(`⚡ WAVE ${this.wave} ⚡`).setAlpha(1);
            this.tweens.add({
                targets: this.txtWaveBanner, alpha: 0,
                delay: 1200, duration: 600, ease: 'Quad.easeIn'
            });
        }

        const W = this.scale.width, H = this.scale.height;
        const count = Math.min(2 + Math.floor(this.wave * 0.7), 8);

        for (let i = 0; i < count; i++) {
            const side = Math.floor(Math.random() * 4);
            const x = side === 0 ? Math.random() * W
                    : side === 1 ? Math.random() * W
                    : side === 2 ? -40
                    :               W + 40;
            const y = side === 0 ? -40
                    : side === 1 ? H + 40
                    : side === 2 ? Math.random() * H
                    :               Math.random() * H;

            const hp = 1 + Math.floor(this.wave / 4);
            this.enemies.push({
                x, y,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                radius     : 10 + Math.random() * 12,
                health     : hp,
                maxHealth  : hp,
                phase      : Math.random() * Math.PI * 2,
                pSpeed     : 0.03 + Math.random() * 0.05,
                speed      : 1.2 + this.wave * 0.08,
                hitTimer   : 0,
                eatCooldown: 0
            });
        }
    }

    _spawnPickup() {
        if (this.dead || this.blobs.length >= N_START * 1.5) return;
        const W = this.scale.width, H = this.scale.height;
        this.pickups.push({
            x    : 80 + Math.random() * (W - 160),
            y    : 80 + Math.random() * (H - 160),
            radius: BLOB_R * 0.75,
            pulse : 0,
            life  : 10000
        });
    }

    _onWaveComplete() {
        if (this.dead) return;
        this.betweenWaves = true;

        // Award slime bonus
        const c = this._center();
        for (let i = 0; i < WAVE_BONUS_BLOBS; i++) {
            const a = Math.PI * 2 * i / WAVE_BONUS_BLOBS;
            this.blobs.push(this._makeBlob(
                c.x + Math.cos(a) * SPRING_REST * 1.2,
                c.y + Math.sin(a) * SPRING_REST * 1.2
            ));
        }

        // Show wave-complete UI
        if (this.txtWaveComplete) {
            this.txtWaveComplete.setText(`✦ WAVE ${this.wave} COMPLETE! ✦`).setAlpha(1);
        }
        if (this.txtWaveReward) {
            this.txtWaveReward.setText(`+${WAVE_BONUS_BLOBS} SLIME BONUS!`).setAlpha(1);
        }

        // Countdown display
        let countdown = Math.ceil(BETWEEN_WAVE_DELAY / 1000);
        if (this.txtNextWave) {
            this.txtNextWave.setText(`Next wave in ${countdown}…`).setAlpha(1);
        }
        this.time.addEvent({
            delay: 1000, repeat: countdown - 1,
            callback: () => {
                countdown--;
                if (this.txtNextWave && countdown > 0) {
                    this.txtNextWave.setText(`Next wave in ${countdown}…`);
                }
            }
        });

        // Trigger next wave after delay
        this.time.delayedCall(BETWEEN_WAVE_DELAY, () => {
            if (this.txtWaveComplete) this.txtWaveComplete.setAlpha(0);
            if (this.txtWaveReward)   this.txtWaveReward.setAlpha(0);
            if (this.txtNextWave)     this.txtNextWave.setAlpha(0);
            this.betweenWaves = false;
            this._spawnWave();
        });
    }

    // ── Main loop ─────────────────────────────────────────────────────────────
    update(time, delta) {
        if (this.dead) return;
        const dt = normDt(delta); // normalized to 60 fps

        this._stepBlobs(dt);
        this._stepProjs(dt, time);
        this._stepEnemies(dt);
        this._stepPickups(dt);

        this._collideProjs();
        this._collideEnemyBlobs();
        this._collidePickups();
        this._reuniteProjs();

        // Trigger wave-complete when all enemies are cleared
        if (this.waveActive && this.enemies.length === 0) {
            this.waveActive = false;
            this._onWaveComplete();
        }

        this._draw(time);
        this._updateUI();

        if (this.blobs.length === 0 && this.projs.length === 0) {
            this.dead = true;
            this.time.delayedCall(600, () =>
                this.scene.start('GameOverScene', { score: this.score, wave: this.wave })
            );
        }
    }

    // ── Physics ───────────────────────────────────────────────────────────────
    _stepBlobs(dt) {
        const n = this.blobs.length;

        // Pairwise spring + repulsion
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const a = this.blobs[i], b = this.blobs[j];
                const dx = b.x - a.x, dy = b.y - a.y;
                const d  = Math.hypot(dx, dy) || 0.001;
                const nx = dx / d, ny = dy / d;

                // Attract / repel via spring
                const spring = (d - SPRING_REST) * K_SPRING;
                a.vx += nx * spring * dt;  a.vy += ny * spring * dt;
                b.vx -= nx * spring * dt;  b.vy -= ny * spring * dt;

                // Hard repulsion when overlapping
                if (d < REPEL_D) {
                    const rep = (REPEL_D - d) * K_REPEL;
                    a.vx -= nx * rep * dt;  a.vy -= ny * rep * dt;
                    b.vx += nx * rep * dt;  b.vy += ny * rep * dt;
                }
            }
        }

        const W = this.scale.width, H = this.scale.height;
        for (const b of this.blobs) {
            // Dampen and cap speed
            b.vx *= FRICTION;  b.vy *= FRICTION;
            const s = Math.hypot(b.vx, b.vy);
            if (s > MAX_SPD) { b.vx *= MAX_SPD / s; b.vy *= MAX_SPD / s; }

            // Move
            b.x += b.vx * dt;  b.y += b.vy * dt;

            // World-bounds bounce
            if (b.x < b.radius)     { b.x = b.radius;     b.vx =  Math.abs(b.vx) * 0.4; }
            if (b.x > W - b.radius) { b.x = W - b.radius; b.vx = -Math.abs(b.vx) * 0.4; }
            if (b.y < b.radius)     { b.y = b.radius;     b.vy =  Math.abs(b.vy) * 0.4; }
            if (b.y > H - b.radius) { b.y = H - b.radius; b.vy = -Math.abs(b.vy) * 0.4; }

            b.phase += b.pSpeed * dt;
        }

        // Continuous drag: while the player holds a finger/mouse down, pull the
        // whole cluster toward the current pointer position.
        if (this.ptrDown && this.dragging && this.ptrCurrent) {
            const c  = this._center();
            const dx = this.ptrCurrent.x - c.x;
            const dy = this.ptrCurrent.y - c.y;
            const d  = Math.hypot(dx, dy) || 0.001;
            const f  = d * DRAG_FORCE * dt;
            for (const b of this.blobs) {
                b.vx += dx / d * f;
                b.vy += dy / d * f;
            }
        }
    }

    _stepProjs(dt, now) {
        const c  = this._center();
        const W  = this.scale.width, H = this.scale.height;

        for (const p of this.projs) {
            // Record trail
            p.trail.unshift({ x: p.x, y: p.y });
            if (p.trail.length > 10) p.trail.pop();

            // Pull back after delay
            if (now - p.t0 > RETURN_AFTER) {
                const dx = c.x - p.x, dy = c.y - p.y;
                const d  = Math.hypot(dx, dy) || 0.001;
                p.vx += dx / d * RETURN_K * dt;
                p.vy += dy / d * RETURN_K * dt;
                if (d < REUNITE_D) p.reunite = true;
            }

            p.vx *= 0.98;  p.vy *= 0.98;
            p.x  += p.vx * dt;  p.y += p.vy * dt;

            // Wall bounce
            if (p.x < p.radius)     { p.x = p.radius;     p.vx =  Math.abs(p.vx) * 0.5; }
            if (p.x > W - p.radius) { p.x = W - p.radius; p.vx = -Math.abs(p.vx) * 0.5; }
            if (p.y < p.radius)     { p.y = p.radius;     p.vy =  Math.abs(p.vy) * 0.5; }
            if (p.y > H - p.radius) { p.y = H - p.radius; p.vy = -Math.abs(p.vy) * 0.5; }

            p.phase += p.pSpeed * dt;
        }
    }

    _stepEnemies(dt) {
        const c  = this._center();
        const W  = this.scale.width, H = this.scale.height;

        for (const e of this.enemies) {
            // Steer toward player cluster
            const dx = c.x - e.x, dy = c.y - e.y;
            const d  = Math.hypot(dx, dy) || 0.001;
            e.vx += dx / d * e.speed * 0.06 * dt;
            e.vy += dy / d * e.speed * 0.06 * dt;

            e.vx *= 0.94;  e.vy *= 0.94;
            const s = Math.hypot(e.vx, e.vy);
            if (s > e.speed) { e.vx *= e.speed / s; e.vy *= e.speed / s; }

            e.x += e.vx * dt;  e.y += e.vy * dt;
            e.phase += e.pSpeed * dt;
            if (e.hitTimer   > 0) e.hitTimer   -= dt;
            if (e.eatCooldown > 0) e.eatCooldown -= dt;
        }

        // Cull enemies that wandered far off-screen
        this.enemies = this.enemies.filter(e =>
            e.x > -150 && e.x < W + 150 && e.y > -150 && e.y < H + 150
        );
    }

    _stepPickups(dt) {
        for (const pk of this.pickups) {
            pk.pulse += 0.05 * dt;
            pk.life  -= dt * 16.667;
        }
        this.pickups = this.pickups.filter(pk => pk.life > 0);
    }

    // ── Collisions ────────────────────────────────────────────────────────────
    _collideProjs() {
        for (const p of this.projs) {
            if (p.reunite) continue;
            for (const e of this.enemies) {
                const d = Math.hypot(e.x - p.x, e.y - p.y);
                if (d >= e.radius + p.radius) continue;

                // Hit!
                e.health--;
                e.hitTimer = 6;
                this.score += 10;

                // Reflect projectile
                const nx  = (e.x - p.x) / d, ny = (e.y - p.y) / d;
                const dot = p.vx * nx + p.vy * ny;
                p.vx -= 1.5 * dot * nx;
                p.vy -= 1.5 * dot * ny;

                if (e.health <= 0) {
                    // Killed enemy → return projectile immediately
                    p.reunite = true;
                    this.score += 50;
                }
            }
        }
        this.enemies = this.enemies.filter(e => e.health > 0);
    }

    _collideEnemyBlobs() {
        const eaten = new Set();
        for (const e of this.enemies) {
            if (e.eatCooldown > 0) continue;
            for (let i = 0; i < this.blobs.length; i++) {
                if (eaten.has(i)) continue;
                const b = this.blobs[i];
                if (Math.hypot(e.x - b.x, e.y - b.y) >= e.radius + b.radius) continue;

                // Enemy eats a blob
                eaten.add(i);
                e.eatCooldown = 90; // dt-units (~1.5 s at 60 fps) before it can eat again
                const dist = Math.hypot(e.x - b.x, e.y - b.y) || 1;
                e.vx += (e.x - b.x) / dist * 4; // bounce enemy back
                e.vy += (e.y - b.y) / dist * 4;
                this.cameras.main.shake(80, 0.006);
                break;
            }
        }
        this.blobs = this.blobs.filter((_, i) => !eaten.has(i));
    }

    _collidePickups() {
        const got = new Set();
        for (let i = 0; i < this.pickups.length; i++) {
            const pk = this.pickups[i];
            for (const b of this.blobs) {
                if (Math.hypot(pk.x - b.x, pk.y - b.y) < pk.radius + b.radius + 22) {
                    got.add(i);
                    this.blobs.push(this._makeBlob(pk.x, pk.y));
                    this.score += 25;
                    break;
                }
            }
        }
        this.pickups = this.pickups.filter((_, i) => !got.has(i));
    }

    _reuniteProjs() {
        for (const p of this.projs.filter(p => p.reunite)) {
            this.blobs.push(this._makeBlob(p.x, p.y, p.vx * 0.3, p.vy * 0.3));
        }
        this.projs = this.projs.filter(p => !p.reunite);
    }

    // ── Rendering ─────────────────────────────────────────────────────────────
    _draw(time) {
        this.gSlime.clear();
        this.gEnemy.clear();
        this.gPickup.clear();
        this.gProj.clear();
        this.gBlob.clear();
        this.gFx.clear();

        this._drawConnections();
        this._drawEnemies();
        this._drawPickups();
        this._drawProjs();
        this._drawBlobs();
        this._drawDragHint();
    }

    _drawConnections() {
        const g    = this.gSlime;
        const maxD = SPRING_REST * 1.8;
        for (let i = 0; i < this.blobs.length; i++) {
            for (let j = i + 1; j < this.blobs.length; j++) {
                const a = this.blobs[i], b = this.blobs[j];
                const d = Math.hypot(b.x - a.x, b.y - a.y);
                if (d > maxD) continue;
                const t = 1 - d / maxD;
                g.lineStyle(4 + t * 12, C_PLAYER, t * 0.5);
                g.lineBetween(a.x, a.y, b.x, b.y);
            }
        }
    }

    _drawBlobs() {
        const g = this.gBlob;
        for (const b of this.blobs) {
            const w = Math.sin(b.phase) * 0.08;
            // Soft outer glow
            g.fillStyle(C_PLAYER_HI, 0.12);
            g.fillCircle(b.x, b.y, b.radius * 1.7);
            // Main body (slightly squished for wobbly feel)
            g.fillStyle(C_PLAYER, 0.88);
            g.fillEllipse(b.x, b.y, (1 + w) * b.radius * 2, (1 - w) * b.radius * 2);
            // Specular highlight
            g.fillStyle(0xaaffdd, 0.55);
            g.fillCircle(b.x - b.radius * 0.3, b.y - b.radius * 0.32, b.radius * 0.32);
        }
    }

    _drawProjs() {
        const g = this.gProj;
        for (const p of this.projs) {
            // Motion trail
            for (let t = 0; t < p.trail.length; t++) {
                const tr = p.trail[t];
                const a  = (1 - t / p.trail.length) * 0.4;
                const r  = p.radius * (1 - t / p.trail.length) * 0.6;
                if (r < 1) continue;
                g.fillStyle(C_PROJ, a);
                g.fillCircle(tr.x, tr.y, r);
            }
            // Glow
            g.fillStyle(0xffffff, 0.12);
            g.fillCircle(p.x, p.y, p.radius * 2);
            // Body
            const w = Math.sin(p.phase) * 0.1;
            g.fillStyle(C_PROJ, 0.92);
            g.fillEllipse(p.x, p.y, (1 + w) * p.radius * 2, (1 - w) * p.radius * 2);
            // Highlight
            g.fillStyle(0xffffff, 0.65);
            g.fillCircle(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.3);
        }
    }

    _drawEnemies() {
        const g = this.gEnemy;
        for (const e of this.enemies) {
            const ew  = Math.sin(e.phase) * 0.09;
            const col = e.hitTimer > 0 ? 0xffffff : C_ENEMY;
            // Glow
            g.fillStyle(0xff3300, 0.14);
            g.fillCircle(e.x, e.y, e.radius * 1.6);
            // Body
            g.fillStyle(col, 0.9);
            g.fillEllipse(e.x, e.y, (1 + ew) * e.radius * 2, (1 - ew) * e.radius * 2);
            // Highlight
            g.fillStyle(0xff8866, 0.4);
            g.fillCircle(e.x - e.radius * 0.25, e.y - e.radius * 0.3, e.radius * 0.3);
            // Health pips
            if (e.maxHealth > 1) {
                for (let h = 0; h < e.maxHealth; h++) {
                    const a = (Math.PI * 2 * h / e.maxHealth) - Math.PI / 2;
                    const r = e.radius + 7;
                    g.fillStyle(h < e.health ? 0xff5500 : 0x222222, 1);
                    g.fillCircle(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 3);
                }
            }
        }
    }

    _drawPickups() {
        const g = this.gPickup;
        for (const pk of this.pickups) {
            const r = pk.radius * (1 + 0.2 * Math.sin(pk.pulse));
            // Outer ring
            g.fillStyle(C_PICKUP, 0.13);
            g.fillCircle(pk.x, pk.y, r * 2.5);
            // Body
            g.fillStyle(C_PICKUP, 0.75);
            g.fillCircle(pk.x, pk.y, r);
            // Highlight
            g.fillStyle(0xaaffff, 0.6);
            g.fillCircle(pk.x - r * 0.3, pk.y - r * 0.3, r * 0.3);
        }
    }

    _drawDragHint() {
        if (!this.ptrDown || !this.dragging || !this.ptrCurrent) return;
        const g = this.gFx;
        const c = this._center();
        const dx = this.ptrCurrent.x - c.x;
        const dy = this.ptrCurrent.y - c.y;
        if (Math.hypot(dx, dy) < 5) return;
        // Draw a line from cluster centre to pointer, showing pull direction
        g.lineStyle(2, 0x88ffcc, 0.3);
        g.lineBetween(c.x, c.y, this.ptrCurrent.x, this.ptrCurrent.y);
        g.fillStyle(0x88ffcc, 0.2);
        g.fillCircle(this.ptrCurrent.x, this.ptrCurrent.y, 14);
    }

    // ── UI ────────────────────────────────────────────────────────────────────
    _createUI() {
        const D  = 20;
        const W  = this.scale.width;
        const H  = this.scale.height;
        this.txtScore = this.add.text(16, 16, 'Score: 0', {
            fontSize: '22px', fill: '#ffffff', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 3
        }).setDepth(D);

        this.txtBlobs = this.add.text(16, 44, `Blobs: ${N_START}`, {
            fontSize: '22px', fill: '#00ff88', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 3
        }).setDepth(D);

        this.txtWave = this.add.text(W - 16, 16, 'Wave 0', {
            fontSize: '22px', fill: '#ffaa00', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(1, 0).setDepth(D);

        this.txtHint = this.add.text(
            W / 2, H - 35,
            'DRAG to move  ·  TAP to shoot',
            { fontSize: '15px', fill: '#666688', fontFamily: 'monospace' }
        ).setOrigin(0.5).setDepth(D);

        this.time.delayedCall(5000, () =>
            this.tweens.add({ targets: this.txtHint, alpha: 0, duration: 1500 })
        );

        // Wave announcement banner (shown briefly at wave start)
        this.txtWaveBanner = this.add.text(W / 2, H / 2 - 90, '', {
            fontSize: '48px', fill: '#ffdd00', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setAlpha(0).setDepth(25);

        // Between-wave UI (wave complete, reward, countdown)
        this.txtWaveComplete = this.add.text(W / 2, H / 2 - 60, '', {
            fontSize: '36px', fill: '#00ff88', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0).setDepth(25);

        this.txtWaveReward = this.add.text(W / 2, H / 2, '', {
            fontSize: '28px', fill: '#00eeff', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setAlpha(0).setDepth(25);

        this.txtNextWave = this.add.text(W / 2, H / 2 + 60, '', {
            fontSize: '22px', fill: '#aaaacc', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setAlpha(0).setDepth(25);
    }

    _updateUI() {
        const total = this.blobs.length + this.projs.length;
        this.txtScore.setText(`Score: ${this.score}`);
        this.txtBlobs.setText(`Blobs: ${total}`);
        const pct = total / N_START;
        this.txtBlobs.setStyle({
            fill: pct > 0.6 ? '#00ff88' : pct > 0.3 ? '#ffcc00' : '#ff4444'
        });
        this.txtWave.setX(this.scale.width - 16);
    }
}

// =============================================================================
//  GameOverScene
// =============================================================================
class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOverScene' }); }

    create(data) {
        this.cameras.main.setBackgroundColor('#080818');
        const W = this.scale.width, H = this.scale.height;

        // Background blob decoration
        const gfx = this.add.graphics();
        for (let i = 0; i < 22; i++) {
            gfx.fillStyle(0x00aa44, 0.07 + Math.random() * 0.06);
            gfx.fillCircle(
                Math.random() * W,
                Math.random() * H,
                20 + Math.random() * 70
            );
        }

        this.add.text(W / 2, H / 2 - 110, '✦  GAME OVER  ✦', {
            fontSize: '52px', fill: '#ff4444', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 30, `Score: ${data.score}`, {
            fontSize: '34px', fill: '#ffffff', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 + 22, `Waves Survived: ${data.wave}`, {
            fontSize: '22px', fill: '#ffaa00', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);

        const btn = this.add.text(W / 2, H / 2 + 95, '[ PLAY AGAIN ]', {
            fontSize: '30px', fill: '#00ff88', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 3, padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });

        btn.on('pointerover', () => btn.setStyle({ fill: '#88ffcc' }));
        btn.on('pointerout',  () => btn.setStyle({ fill: '#00ff88' }));
        btn.on('pointerdown', () => this.scene.start('GameScene'));

        this.tweens.add({
            targets : btn,
            scaleX  : 1.06, scaleY: 1.06,
            yoyo    : true,  repeat: -1,
            duration: 700
        });

        // Also allow tapping anywhere to restart (after a short guard delay)
        this.time.delayedCall(800, () => {
            this.input.on('pointerdown', () => this.scene.start('GameScene'));
        });
    }
}

// =============================================================================
//  Boot / title screen
// =============================================================================
class TitleScene extends Phaser.Scene {
    constructor() { super({ key: 'TitleScene' }); }

    create() {
        this.cameras.main.setBackgroundColor('#080818');
        const W = this.scale.width, H = this.scale.height;

        // Animated blob decorations
        const gfx = this.add.graphics();
        const decorBlobs = [];
        for (let i = 0; i < 15; i++) {
            decorBlobs.push({
                x: Math.random() * W, y: Math.random() * H,
                r: 15 + Math.random() * 45,
                phase: Math.random() * Math.PI * 2,
                speed: 0.015 + Math.random() * 0.02,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                col: [0x00dd77, 0x22ff99, 0x00aa55][Math.floor(Math.random() * 3)]
            });
        }

        // Title text
        this.add.text(W / 2, H / 2 - 100, '★ StarJelly ★', {
            fontSize: '64px', fill: '#00ff88', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(10);

        this.add.text(W / 2, H / 2 - 30, 'A jelly-blob survival game', {
            fontSize: '20px', fill: '#aaffcc', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(10);

        this.add.text(W / 2, H / 2 + 30,
            'DRAG to slide  ·  TAP to shoot',
            { fontSize: '18px', fill: '#888888', fontFamily: 'monospace' }
        ).setOrigin(0.5).setDepth(10);

        const btn = this.add.text(W / 2, H / 2 + 100, '[ START ]', {
            fontSize: '36px', fill: '#00ff88', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 3, padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' }).setDepth(10);

        btn.on('pointerover', () => btn.setStyle({ fill: '#88ffcc' }));
        btn.on('pointerout',  () => btn.setStyle({ fill: '#00ff88' }));
        btn.on('pointerdown', () => this.scene.start('GameScene'));

        this.tweens.add({
            targets: btn, scaleX: 1.06, scaleY: 1.06,
            yoyo: true, repeat: -1, duration: 700
        });

        this.add.text(W / 2, H - 24,
            'Your blob-count is your health  ·  Shoot blobs to kill enemies  ·  Collect cyan blobs to grow',
            { fontSize: '12px', fill: '#444466', fontFamily: 'monospace' }
        ).setOrigin(0.5).setDepth(10);

        // Animate background blobs each frame
        this.events.on('update', (time, delta) => {
            const dt = normDt(delta);
            gfx.clear();
            for (const b of decorBlobs) {
                b.x += b.vx * dt;  b.y += b.vy * dt;
                b.phase += b.speed * dt;
                if (b.x < -60)      b.x = W + 60;
                if (b.x > W + 60)   b.x = -60;
                if (b.y < -60)      b.y = H + 60;
                if (b.y > H + 60)   b.y = -60;
                const rr = b.r * (1 + Math.sin(b.phase) * 0.07);
                gfx.fillStyle(b.col, 0.18);
                gfx.fillCircle(b.x, b.y, rr * 1.6);
                gfx.fillStyle(b.col, 0.55);
                gfx.fillCircle(b.x, b.y, rr);
                gfx.fillStyle(0xaaffdd, 0.3);
                gfx.fillCircle(b.x - rr * 0.3, b.y - rr * 0.32, rr * 0.28);
            }
        });
    }
}

// =============================================================================
//  Phaser game config
// =============================================================================
const game = new Phaser.Game({
    type           : Phaser.AUTO,
    backgroundColor: '#080818',
    scene          : [TitleScene, GameScene, GameOverScene],
    scale          : {
        mode      : Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width     : window.innerWidth,
        height    : window.innerHeight
    }
});
