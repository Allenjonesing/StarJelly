// ─────────────────────────────────────────────────────────────────────────────
// StarJelly  –  2D Side-Scrolling Platformer  (Lab Escape)
// You are an escaped blob experiment – fight your way out of the lab!
// Controls:  A / ← to move left   D / → to move right
//            W / ↑ / Space to jump
//            Click / Tap to shoot a sub-blob toward that point
// ─────────────────────────────────────────────────────────────────────────────

// ── Physics constants ────────────────────────────────────────────────────────
const BLOB_R      = 13;           // sub-blob radius (px)
const SPRING_REST = BLOB_R * 2.4; // spring natural length
const K_SPRING    = 0.038;        // spring stiffness
const K_REPEL     = 0.32;         // overlap repulsion strength
const REPEL_D     = BLOB_R * 1.8; // repulsion kicks in below this distance
const FRICTION    = 0.80;         // strong ground friction for tight platformer feel
const AIR_FRICTION= 0.94;         // lighter friction while airborne
const MAX_SPD     = 9;            // max blob speed
const GRAVITY     = 0.48;         // gravitational acceleration per norm-frame
const JUMP_VY     = -12;          // vertical impulse on jump
const MOVE_FORCE  = 0.65;         // horizontal acceleration force

// ── Projectile constants ─────────────────────────────────────────────────────
const SHOOT_V    = 14;            // launch speed
const COLLECT_D  = BLOB_R * 3.5; // distance to auto-collect a landed blob

// ── Game constants ────────────────────────────────────────────────────────────
const N_START    = 8;             // starting sub-blobs

// ── Palette ───────────────────────────────────────────────────────────────────
const C_PLAYER    = 0x00dd77;
const C_PLAYER_HI = 0x22ff99;
const C_PROJ      = 0x00ee55;
const C_PLATFORM  = 0x4a5c70;
const C_PLAT_TOP  = 0x6a8099;
const C_GROUND    = 0x3a4a5a;
const C_WALL_COL  = 0x2e3d4d;
const C_EXIT      = 0x00ff88;
const C_VAT       = 0x22bb44;
const C_WATER_COL = 0x2277cc;
const C_FIRE_COL  = 0xff5500;
const C_ENEMY_BUL = 0xff8800;

// =============================================================================
//  Level data builder  (levels are defined relative to H = screen height)
// =============================================================================
function buildLevels(H) {
    const G = H - 52;  // ground surface Y

    return [
        // ── Level 1: Specimen Chamber ─────────────────────────────────────────
        {
            title    : 'Level 1 – Specimen Chamber',
            worldW   : 2500,
            worldH   : H,
            bgColor  : '#0e1520',
            // Solid rectangles (full collision from all sides)
            solids   : [
                { x:0,    y:G,   w:2500, h:H-G+4 },  // ground
                { x:0,    y:0,   w:12,   h:H     },   // left wall
                { x:2488, y:0,   w:12,   h:H     },   // right wall
                { x:0,    y:0,   w:2500, h:12    },   // ceiling
            ],
            // One-way platforms (land on top, jump through from below)
            platforms: [
                { x:200,  y:G-110, w:240, h:14 },
                { x:620,  y:G-185, w:280, h:14 },
                { x:1030, y:G-110, w:210, h:14 },
                { x:1330, y:G-235, w:270, h:14 },
                { x:1680, y:G-140, w:240, h:14 },
                { x:2000, y:G-215, w:190, h:14 },
            ],
            playerStart: { x:70,   y:G-40 },
            exit       : { x:2410, y:G-130, w:65, h:130 },
            enemies    : [
                { x:400,  y:G-20, type:'scientist', dir: 1 },
                { x:780,  y:G-20, type:'scientist', dir:-1 },
                { x:1180, y:G-20, type:'scientist', dir: 1 },
                { x:1540, y:G-20, type:'scientist', dir:-1 },
                { x:1900, y:G-20, type:'scientist', dir: 1 },
                { x:2250, y:G-20, type:'scientist', dir:-1 },
            ],
            vats  : [
                { x:530,  y:G-28 },
                { x:1090, y:G-28 },
                { x:1820, y:G-28 },
            ],
            waters: [],
            fires : [],
        },

        // ── Level 2: Research Corridor ────────────────────────────────────────
        {
            title    : 'Level 2 – Research Corridor',
            worldW   : 3700,
            worldH   : H,
            bgColor  : '#0d1820',
            solids   : [
                { x:0,    y:G,   w:3700, h:H-G+4 },
                { x:0,    y:0,   w:12,   h:H     },
                { x:3688, y:0,   w:12,   h:H     },
                { x:0,    y:0,   w:3700, h:12    },
                // internal barriers / raised dividers
                { x:1050, y:G-190, w:14, h:190 },
                { x:2300, y:G-200, w:14, h:200 },
            ],
            platforms: [
                { x:160,  y:G-125, w:250, h:14 },
                { x:580,  y:G-225, w:290, h:14 },
                { x:1000, y:G-130, w:200, h:14 },
                // staircase section
                { x:1250, y:G-140, w:90,  h:14 },
                { x:1340, y:G-185, w:90,  h:14 },
                { x:1430, y:G-230, w:90,  h:14 },
                { x:1520, y:G-275, w:90,  h:14 },
                // high run
                { x:1720, y:G-290, w:360, h:14 },
                { x:2220, y:G-185, w:270, h:14 },
                { x:2650, y:G-120, w:220, h:14 },
                { x:3000, y:G-205, w:310, h:14 },
                { x:3380, y:G-140, w:210, h:14 },
            ],
            playerStart: { x:70,   y:G-40 },
            exit       : { x:3605, y:G-130, w:65, h:130 },
            enemies    : [
                { x:300,  y:G-20, type:'scientist', dir: 1 },
                { x:700,  y:G-20, type:'guard',     dir:-1 },
                { x:1100, y:G-20, type:'scientist', dir: 1 },
                { x:1500, y:G-20, type:'guard',     dir:-1 },
                { x:1950, y:G-20, type:'scientist', dir: 1 },
                { x:2380, y:G-20, type:'guard',     dir:-1 },
                { x:2750, y:G-20, type:'scientist', dir: 1 },
                { x:3100, y:G-20, type:'guard',     dir: 1 },
                { x:3450, y:G-20, type:'scientist', dir:-1 },
            ],
            vats  : [
                { x:490,  y:G-28 },
                { x:1050, y:G-28 },
                { x:1850, y:G-28 },
                { x:2580, y:G-28 },
            ],
            waters: [
                { x:1630, y:G-14, w:140, h:14 },
                { x:2940, y:G-14, w:110, h:14 },
            ],
            fires : [],
        },

        // ── Level 3: Security Wing ────────────────────────────────────────────
        {
            title    : 'Level 3 – Security Wing',
            worldW   : 4100,
            worldH   : H,
            bgColor  : '#100d18',
            solids   : [
                { x:0,    y:G,   w:4100, h:H-G+4 },
                { x:0,    y:0,   w:12,   h:H     },
                { x:4088, y:0,   w:12,   h:H     },
                { x:0,    y:0,   w:4100, h:12    },
                { x:950,  y:G-155, w:14, h:155 },
                { x:2150, y:G-175, w:14, h:175 },
                { x:3300, y:G-160, w:14, h:160 },
            ],
            platforms: [
                { x:200,  y:G-135, w:250, h:14 },
                { x:560,  y:G-240, w:300, h:14 },
                { x:1000, y:G-155, w:240, h:14 },
                // staircase
                { x:1380, y:G-150, w:85,  h:14 },
                { x:1465, y:G-200, w:85,  h:14 },
                { x:1550, y:G-250, w:85,  h:14 },
                { x:1635, y:G-300, w:85,  h:14 },
                // high section
                { x:1840, y:G-315, w:340, h:14 },
                { x:2350, y:G-200, w:250, h:14 },
                { x:2720, y:G-165, w:220, h:14 },
                { x:3100, y:G-255, w:310, h:14 },
                { x:3520, y:G-175, w:290, h:14 },
                { x:3880, y:G-135, w:155, h:14 },
            ],
            playerStart: { x:70,   y:G-40 },
            exit       : { x:4005, y:G-130, w:65, h:130 },
            enemies    : [
                { x:310,  y:G-20, type:'scientist',   dir: 1 },
                { x:650,  y:G-20, type:'guard',       dir:-1 },
                { x:1060, y:G-20, type:'guard',       dir: 1 },
                { x:1380, y:G-20, type:'flamethrower',dir:-1 },
                { x:1750, y:G-20, type:'guard',       dir: 1 },
                { x:2050, y:G-20, type:'scientist',   dir:-1 },
                { x:2430, y:G-20, type:'flamethrower',dir: 1 },
                { x:2810, y:G-20, type:'guard',       dir:-1 },
                { x:3130, y:G-20, type:'guard',       dir: 1 },
                { x:3430, y:G-20, type:'flamethrower',dir:-1 },
                { x:3720, y:G-20, type:'guard',       dir: 1 },
            ],
            vats  : [
                { x:470,  y:G-28 },
                { x:1090, y:G-28 },
                { x:2260, y:G-28 },
                { x:3020, y:G-28 },
                { x:3660, y:G-28 },
            ],
            waters: [
                { x:780,  y:G-14, w:120, h:14 },
                { x:1970, y:G-14, w:100, h:14 },
                { x:3010, y:G-14, w:90,  h:14 },
            ],
            fires : [
                { x:1590, y:G-18, w:80, h:18 },
                { x:2620, y:G-18, w:70, h:18 },
            ],
        },
    ];
}

// =============================================================================
//  Accomplishment system
// =============================================================================
const ACCOMPLISH_KEY  = 'starjelly_accomplishments';
const ACCOMPLISH_DEFS = [
    { id: 'first_kill',    name: 'First Blood',      desc: 'Defeat your first enemy'               },
    { id: 'kills_10',      name: 'Slime Slayer',      desc: 'Defeat 10 enemies in one run'          },
    { id: 'kills_25',      name: 'Blob Brawler',      desc: 'Defeat 25 enemies in one run'          },
    { id: 'pickups_3',     name: 'Jelly Hoarder',     desc: 'Collect 3 jelly vats in one run'       },
    { id: 'pickups_8',     name: 'Vat Collector',     desc: 'Collect 8 jelly vats in one run'       },
    { id: 'water_3',       name: 'Waterlogged',       desc: 'Convert 3 water puddles into jelly'    },
    { id: 'level_2',       name: 'Corridor Runner',   desc: 'Reach Level 2'                         },
    { id: 'level_3',       name: 'Security Breach',   desc: 'Reach Level 3'                         },
    { id: 'escaped',       name: 'Free at Last',      desc: 'Escape the lab!'                       },
    { id: 'big_blob',      name: 'Mega Blob',         desc: 'Grow to 20 sub-blobs at once'          },
    { id: 'untouched',     name: 'Untouchable',       desc: 'Complete a level without losing a blob'},
];

const Accomplishments = {
    _data: null,

    _load() {
        if (this._data !== null) return;
        try {
            const raw  = localStorage.getItem(ACCOMPLISH_KEY);
            this._data = raw ? JSON.parse(raw) : {};
        } catch(e) {
            this._data = {};
        }
    },

    _save() {
        try { localStorage.setItem(ACCOMPLISH_KEY, JSON.stringify(this._data)); } catch(e) {}
    },

    isUnlocked(id) { this._load(); return !!(this._data[id]); },

    unlock(id) {
        if (!ACCOMPLISH_DEFS.some(d => d.id === id)) return false;
        this._load();
        if (this._data[id]) return false;
        this._data[id] = true;
        this._save();
        return true;
    },

    getAll() {
        this._load();
        return ACCOMPLISH_DEFS.map(def => ({ ...def, unlocked: !!this._data[def.id] }));
    }
};

// =============================================================================
//  Utility
// =============================================================================
function normDt(delta) { return Math.min(delta / 16.667, 3); }

// =============================================================================
//  GameScene
// =============================================================================
class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    create() {
        this.dead          = false;
        this.levelIdx      = 0;
        this.score         = 0;
        this.killCount     = 0;
        this.vatCount      = 0;
        this.waterCount    = 0;
        this.newlyUnlocked = [];
        this.blobsAtLevelStart = 0;

        this.blobs      = [];   // player sub-blobs
        this.projs      = [];   // player shot blobs (airborne)
        this.landed     = [];   // player shot blobs that have landed
        this.enemies    = [];
        this.enemyProjs = [];
        this.fireParticles = [];
        this.vats       = [];
        this.waters     = [];

        // Graphics layers (back → front)
        this.gBg      = this.add.graphics().setDepth(0);
        this.gLevel   = this.add.graphics().setDepth(1);
        this.gVat     = this.add.graphics().setDepth(2);
        this.gWater   = this.add.graphics().setDepth(2);
        this.gFire    = this.add.graphics().setDepth(3);
        this.gSlime   = this.add.graphics().setDepth(4);
        this.gBlob    = this.add.graphics().setDepth(5);
        this.gProj    = this.add.graphics().setDepth(5);
        this.gEnemy   = this.add.graphics().setDepth(6);
        this.gFx      = this.add.graphics().setDepth(7);

        // Build level data using actual screen height
        this.levelDefs = buildLevels(this.scale.height);
        this._createUI();
        this._setupInput();
        this._loadLevel(0);
    }

    // ── Level loading ─────────────────────────────────────────────────────────
    _loadLevel(idx) {
        this.levelIdx = idx;
        const def     = this.levelDefs[idx];

        // Preserve blob count across levels; use N_START on first load
        const prevBlobCount = this.blobs.length;

        this.blobs    = [];
        this.projs    = [];
        this.landed   = [];
        this.enemies  = [];
        this.enemyProjs = [];
        this.fireParticles = [];

        // Vats and waters from level definition
        this.vats   = def.vats.map(v => ({ ...v, radius: BLOB_R * 1.3, pulse: 0, alive: true }));
        this.waters = def.waters.map(w => ({ ...w, alive: true }));

        // Spawn player cluster (carry over blob count from previous level)
        const ps = def.playerStart;
        this._initCluster(ps.x, ps.y, prevBlobCount > 0 ? prevBlobCount : N_START);

        // Track blob count at level start for untouched check
        this.blobsAtLevelStart = this.blobs.length;

        // Spawn enemies from definition
        for (const e of def.enemies) {
            this.enemies.push(this._makeEnemy(e.x, e.y, e.type, e.dir));
        }

        // Camera bounds
        this.cameras.main.setBounds(0, 0, def.worldW, def.worldH);

        // Background color
        this.cameras.main.setBackgroundColor(def.bgColor);

        if (this.txtLevel) {
            this.txtLevel.setText(def.title);
            this.tweens.add({ targets: this.txtLevel, alpha: 0, delay: 3000, duration: 1200 });
        }
    }

    _makeEnemy(x, y, type, dir) {
        const speeds  = { scientist: 1.4, guard: 2.0, flamethrower: 0.9 };
        const healths = { scientist: 2,   guard: 3,   flamethrower: 4   };
        return {
            x, y,
            vx: 0, vy: 0,
            type,
            dir    : dir || 1,
            health : healths[type] || 2,
            maxHealth: healths[type] || 2,
            speed  : speeds[type]  || 1.5,
            radius : type === 'flamethrower' ? 18 : type === 'guard' ? 16 : 14,
            phase  : Math.random() * Math.PI * 2,
            hitTimer     : 0,
            shootCooldown: this._enemyShootCooldown(type),
            onGround     : false,
            patrolDir    : dir || 1,
            patrolTimer  : 0,
        };
    }

    _enemyShootCooldown(type) {
        return type === 'scientist'    ? 180 + Math.random() * 60
             : type === 'guard'        ? 120 + Math.random() * 40
             : /* flamethrower */        80  + Math.random() * 30;
    }

    // ── Input setup ───────────────────────────────────────────────────────────
    _setupInput() {
        const kb = this.input.keyboard;
        this.keys = {
            left : kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            up   : kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            a    : kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            d    : kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            w    : kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        };
        this.touchLeft  = false;
        this.touchRight = false;
        this.touchJump  = false;

        // Shoot on click/tap
        this.input.on('pointerdown', (p) => {
            if (this.dead) return;
            // On-screen button regions – handled via _updateTouchButtons
            const W = this.scale.width;
            const H = this.scale.height;
            if (p.y > H * 0.72) return; // ignore lower HUD area taps (buttons)
            this._shoot(p.worldX, p.worldY);
        });

        this._createTouchButtons();
    }

    _createTouchButtons() {
        const W = this.scale.width;
        const H = this.scale.height;
        const btnStyle = { fontSize: '32px', fill: '#ffffff', fontFamily: 'monospace',
                           backgroundColor: '#334', padding: { x: 14, y: 8 }, alpha: 0.55 };

        this.btnLeft  = this.add.text(24,       H - 70, '◀', btnStyle).setOrigin(0, 1)
            .setScrollFactor(0).setDepth(30).setInteractive();
        this.btnRight = this.add.text(110,      H - 70, '▶', btnStyle).setOrigin(0, 1)
            .setScrollFactor(0).setDepth(30).setInteractive();
        this.btnJump  = this.add.text(W - 24,   H - 70, '▲', btnStyle).setOrigin(1, 1)
            .setScrollFactor(0).setDepth(30).setInteractive();

        const down = (flag) => () => { this[flag] = true; };
        const up   = (flag) => () => { this[flag] = false; };

        this.btnLeft.on('pointerdown',  down('touchLeft'));
        this.btnLeft.on('pointerup',    up('touchLeft'));
        this.btnLeft.on('pointerout',   up('touchLeft'));
        this.btnRight.on('pointerdown', down('touchRight'));
        this.btnRight.on('pointerup',   up('touchRight'));
        this.btnRight.on('pointerout',  up('touchRight'));
        this.btnJump.on('pointerdown',  down('touchJump'));
        this.btnJump.on('pointerup',    up('touchJump'));
        this.btnJump.on('pointerout',   up('touchJump'));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    _makeBlob(x, y, vx = 0, vy = 0) {
        return { x, y, vx, vy, radius: BLOB_R,
                 phase: Math.random() * Math.PI * 2,
                 pSpeed: 0.04 + Math.random() * 0.04,
                 onGround: false, prevY: y };
    }

    _initCluster(cx, cy, n) {
        this.blobs = [];
        for (let i = 0; i < n; i++) {
            const a    = Math.PI * 2 * i / n;
            const ring = Math.floor(i / 6);
            const r    = i === 0 ? 0 : SPRING_REST * (ring + 0.7);
            this.blobs.push(this._makeBlob(
                cx + Math.cos(a) * r + (Math.random() - 0.5) * 4,
                cy + Math.sin(a) * r + (Math.random() - 0.5) * 4
            ));
        }
    }

    _center() {
        if (!this.blobs.length) return { x: this.scale.width / 2, y: this.scale.height / 2 };
        let cx = 0, cy = 0;
        for (const b of this.blobs) { cx += b.x; cy += b.y; }
        return { x: cx / this.blobs.length, y: cy / this.blobs.length };
    }

    _isGrounded() {
        return this.blobs.some(b => b.onGround);
    }

    // ── Shooting ──────────────────────────────────────────────────────────────
    _shoot(tx, ty) {
        if (this.dead || this.blobs.length <= 2) return;
        const c   = this._center();
        const dx  = tx - c.x, dy = ty - c.y;
        const len = Math.hypot(dx, dy) || 1;

        // Pick the blob most aligned with the shoot direction
        let best = null, bestDot = -Infinity;
        for (const b of this.blobs) {
            const dot = (b.x - c.x) * dx / len + (b.y - c.y) * dy / len;
            if (dot > bestDot) { bestDot = dot; best = b; }
        }
        if (!best) return;

        this.blobs = this.blobs.filter(b => b !== best);
        this.projs.push({
            x: best.x, y: best.y,
            vx: dx / len * SHOOT_V + best.vx,
            vy: dy / len * SHOOT_V + best.vy - 2,  // small upward boost for arc feel
            radius: BLOB_R,
            trail : [],
            phase : best.phase,
            pSpeed: best.pSpeed,
            onGround: false,
            landed  : false,
        });
    }

    // ── Accomplishments ────────────────────────────────────────────────────────
    _tryUnlock(id) {
        if (Accomplishments.unlock(id)) this.newlyUnlocked.push(id);
    }

    _checkAccomplishments() {
        if (this.killCount >= 1)  this._tryUnlock('first_kill');
        if (this.killCount >= 10) this._tryUnlock('kills_10');
        if (this.killCount >= 25) this._tryUnlock('kills_25');
        if (this.vatCount  >= 3)  this._tryUnlock('pickups_3');
        if (this.vatCount  >= 8)  this._tryUnlock('pickups_8');
        if (this.waterCount >= 3) this._tryUnlock('water_3');
        if (this.blobs.length >= 20) this._tryUnlock('big_blob');
    }

    // ── Platform collision helpers ────────────────────────────────────────────
    _resolveVsLevel(obj, level) {
        // Returns true if the object is resting on something
        let grounded = false;
        const r = obj.radius;

        // --- Solid rectangles (4-sided collision) ---
        for (const s of level.solids) {
            // Broad phase
            if (obj.x + r < s.x || obj.x - r > s.x + s.w) continue;
            if (obj.y + r < s.y || obj.y - r > s.y + s.h) continue;

            // Find closest point on rect
            const cx  = Math.max(s.x, Math.min(obj.x, s.x + s.w));
            const cy  = Math.max(s.y, Math.min(obj.y, s.y + s.h));
            const ddx = obj.x - cx, ddy = obj.y - cy;
            const dist = Math.hypot(ddx, ddy);

            if (dist === 0) {
                // Blob centre is inside solid: push upwards
                obj.y  = s.y - r;
                obj.vy = Math.min(obj.vy, 0);
                grounded = true;
                continue;
            }
            if (dist >= r) continue;

            const overlap = r - dist;
            const nx = ddx / dist, ny = ddy / dist;
            obj.x += nx * overlap;
            obj.y += ny * overlap;

            if (ny < -0.5) { obj.vy = Math.min(obj.vy, 0); grounded = true; } // floor hit
            else if (ny > 0.5) { obj.vy = Math.max(obj.vy, 0); }              // ceiling hit
            if (Math.abs(nx) > 0.5) { obj.vx *= -0.1; }                       // wall hit: slight bounce
        }

        // --- One-way platforms (top-landing only) ---
        for (const p of level.platforms) {
            if (obj.x + r < p.x || obj.x - r > p.x + p.w) continue;
            if (obj.vy < 0) continue;                                          // rising: skip
            const bottom    = obj.y + r;
            const prevBottom = (obj.prevY || obj.y) + r;
            if (prevBottom <= p.y + 2 && bottom >= p.y) {
                obj.y  = p.y - r;
                obj.vy = 0;
                grounded = true;
            }
        }

        return grounded;
    }

    // ── Physics: blobs ────────────────────────────────────────────────────────
    _stepBlobs(dt) {
        const def = this.levelDefs[this.levelIdx];
        const n   = this.blobs.length;

        // ─── Pairwise spring + repulsion ───
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const a = this.blobs[i], b = this.blobs[j];
                const dx = b.x - a.x, dy = b.y - a.y;
                const d  = Math.hypot(dx, dy) || 0.001;
                const nx = dx / d, ny = dy / d;

                const spring = (d - SPRING_REST) * K_SPRING;
                a.vx += nx * spring * dt;  a.vy += ny * spring * dt;
                b.vx -= nx * spring * dt;  b.vy -= ny * spring * dt;

                if (d < REPEL_D) {
                    const rep = (REPEL_D - d) * K_REPEL;
                    a.vx -= nx * rep * dt;  a.vy -= ny * rep * dt;
                    b.vx += nx * rep * dt;  b.vy += ny * rep * dt;
                }
            }
        }

        // ─── Input: horizontal movement + jump ───
        const movingLeft  = Phaser.Input.Keyboard.JustDown(this.keys.left)  || this.keys.left.isDown  || this.touchLeft;
        const movingRight = Phaser.Input.Keyboard.JustDown(this.keys.right) || this.keys.right.isDown || this.touchRight;
        const wantsJump   = Phaser.Input.Keyboard.JustDown(this.keys.up)    ||
                            Phaser.Input.Keyboard.JustDown(this.keys.w)     ||
                            Phaser.Input.Keyboard.JustDown(this.keys.space) || this.touchJump;

        const grounded = this._isGrounded();

        if (wantsJump && grounded) {
            for (const b of this.blobs) b.vy = JUMP_VY;
            this.touchJump = false;
        }

        for (const b of this.blobs) {
            // Gravity
            b.vy += GRAVITY * dt;

            // Horizontal input
            if (movingLeft)  b.vx -= MOVE_FORCE * dt;
            if (movingRight) b.vx += MOVE_FORCE * dt;

            // Friction
            const fr = b.onGround ? FRICTION : AIR_FRICTION;
            b.vx *= Math.pow(fr, dt);
            b.vy *= 0.999;

            // Speed cap
            const s = Math.hypot(b.vx, b.vy);
            if (s > MAX_SPD) { b.vx *= MAX_SPD / s; b.vy *= MAX_SPD / s; }

            b.prevY = b.y;
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            b.onGround = this._resolveVsLevel(b, def);
            b.phase   += b.pSpeed * dt;
        }
    }

    // ── Physics: projectile blobs ─────────────────────────────────────────────
    _stepProjs(dt) {
        const def = this.levelDefs[this.levelIdx];
        for (const p of this.projs) {
            p.trail.unshift({ x: p.x, y: p.y });
            if (p.trail.length > 10) p.trail.pop();

            if (!p.landed) {
                p.vy += GRAVITY * dt;   // gravity on projectile
                p.vx *= 0.98;
                p.vy *= 0.99;
                p.prevY = p.y;
                p.x    += p.vx * dt;
                p.y    += p.vy * dt;
                const g  = this._resolveVsLevel(p, def);
                if (g) {
                    p.vx    *= 0.2;
                    p.vy     = 0;
                    p.landed = true;
                }
            }
            p.phase += p.pSpeed * dt;
        }
    }

    // ── Physics: enemies ──────────────────────────────────────────────────────
    _stepEnemies(dt) {
        const def = this.levelDefs[this.levelIdx];
        const c   = this._center();

        for (const e of this.enemies) {
            // Gravity
            e.vy += GRAVITY * dt;
            e.prevY = e.y;

            const dx = c.x - e.x, dy = c.y - e.y;
            const dist = Math.hypot(dx, dy) || 1;

            // ── Patrol / chase behaviour ──
            if (e.type === 'flamethrower') {
                // Slow approach when player is near
                if (Math.abs(dx) < 350) {
                    e.vx += (dx > 0 ? 1 : -1) * e.speed * 0.04 * dt;
                    e.dir = dx > 0 ? 1 : -1;
                }
            } else {
                // Patrol left/right on platform
                e.patrolTimer -= dt;
                if (e.patrolTimer <= 0) {
                    e.patrolDir   = -e.patrolDir;
                    e.patrolTimer = 80 + Math.random() * 80;
                }
                e.vx += e.patrolDir * e.speed * 0.03 * dt;
                // Face player when in shooting range
                if (Math.abs(dx) < 380 && Math.abs(dy) < 120) {
                    e.dir = dx > 0 ? 1 : -1;
                } else {
                    e.dir = e.patrolDir;
                }
            }

            // Friction
            e.vx *= 0.88;
            e.vy *= 0.999;
            const s = Math.hypot(e.vx, e.vy);
            if (s > e.speed * 2) { e.vx *= (e.speed * 2) / s; e.vy *= (e.speed * 2) / s; }

            const prevVx   = e.vx;
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            e.onGround = this._resolveVsLevel(e, def);
            // Reverse patrol direction if the enemy bounced off a wall
            if (e.vx * prevVx < 0) {
                e.patrolDir = -e.patrolDir;
                e.patrolTimer = 60 + Math.random() * 60;
            }
            e.phase   += 0.04 * dt;
            if (e.hitTimer > 0) e.hitTimer -= dt;

            // ── Shooting ──
            e.shootCooldown -= dt;
            if (e.shootCooldown <= 0 && Math.abs(dx) < 420 && Math.abs(dy) < 140) {
                this._enemyShoot(e, c);
                e.shootCooldown = this._enemyShootCooldown(e.type);
            }
        }

        // Step enemy projectiles
        for (const ep of this.enemyProjs) {
            ep.x    += ep.vx * dt;
            ep.y    += ep.vy * dt;
            ep.vy   += GRAVITY * 0.4 * dt; // slight arc
            ep.life -= dt;
        }

        // Step fire particles
        for (const fp of this.fireParticles) {
            fp.x    += fp.vx * dt;
            fp.y    += fp.vy * dt;
            fp.vy   += GRAVITY * 0.15 * dt;
            fp.life -= dt;
            fp.alpha = fp.life / fp.maxLife;
        }

        const W = this.scale.width + 400;
        this.enemyProjs    = this.enemyProjs.filter(ep =>
            ep.life > 0 && ep.x > -200 && ep.x < W && ep.y > -200 && ep.y < this.scale.height + 200);
        this.fireParticles = this.fireParticles.filter(fp => fp.life > 0);
    }

    _enemyShoot(e, target) {
        const dx = target.x - e.x, dy = target.y - e.y;
        const d  = Math.hypot(dx, dy) || 1;

        if (e.type === 'flamethrower') {
            // Burst of fire particles in a cone
            for (let i = 0; i < 6; i++) {
                const spread = (Math.random() - 0.5) * 0.6;
                const spd    = 4 + Math.random() * 3;
                const angle  = Math.atan2(dy, dx) + spread;
                const life   = 40 + Math.random() * 20;
                this.fireParticles.push({
                    x: e.x + Math.cos(angle) * e.radius,
                    y: e.y,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd - 1,
                    radius: 6 + Math.random() * 5,
                    life, maxLife: life, alpha: 1,
                });
            }
        } else {
            const spd = e.type === 'guard' ? 5.5 : 4.0;
            this.enemyProjs.push({
                x: e.x + e.dir * e.radius,
                y: e.y - 5,
                vx: dx / d * spd,
                vy: dy / d * spd * 0.5,  // flatter trajectory
                radius: e.type === 'guard' ? 6 : 5,
                life  : 150,
                type  : e.type,
            });
        }
    }

    // ── Collisions ────────────────────────────────────────────────────────────
    _collideProjs() {
        // Player proj blobs vs enemies
        for (const p of this.projs) {
            if (p.landed) continue;
            for (const e of this.enemies) {
                if (Math.hypot(e.x - p.x, e.y - p.y) >= e.radius + p.radius) continue;
                e.health--;
                e.hitTimer = 8;
                this.score += 10;

                // Reflect proj
                const nx = (e.x - p.x) / (Math.hypot(e.x - p.x, e.y - p.y) || 1);
                const ny = (e.y - p.y) / (Math.hypot(e.x - p.x, e.y - p.y) || 1);
                const dot = p.vx * nx + p.vy * ny;
                p.vx -= 1.4 * dot * nx;
                p.vy -= 1.4 * dot * ny;

                if (e.health <= 0) { this.score += 50; this.killCount++; }
            }
        }
        const prevLen = this.enemies.length;
        this.enemies = this.enemies.filter(e => e.health > 0);
        this._checkAccomplishments();
    }

    _collideEnemyProjs() {
        const hitProjs = new Set(), hitBlobs = new Set();
        for (let ei = 0; ei < this.enemyProjs.length; ei++) {
            const ep = this.enemyProjs[ei];
            for (let bi = 0; bi < this.blobs.length; bi++) {
                if (hitBlobs.has(bi)) continue;
                const b = this.blobs[bi];
                if (Math.hypot(ep.x - b.x, ep.y - b.y) < ep.radius + b.radius) {
                    hitProjs.add(ei);
                    hitBlobs.add(bi);
                    this.cameras.main.shake(55, 0.005);
                    break;
                }
            }
        }
        this.enemyProjs = this.enemyProjs.filter((_, i) => !hitProjs.has(i));
        this.blobs      = this.blobs.filter((_, i) => !hitBlobs.has(i));
    }

    _collideFireParticles() {
        // Fire particles destroy player blobs on contact
        const hitBlobs = new Set(), hitProjs = new Set();
        for (const fp of this.fireParticles) {
            for (let bi = 0; bi < this.blobs.length; bi++) {
                if (hitBlobs.has(bi)) continue;
                if (Math.hypot(fp.x - this.blobs[bi].x, fp.y - this.blobs[bi].y) < fp.radius + this.blobs[bi].radius) {
                    hitBlobs.add(bi);
                    this.cameras.main.shake(40, 0.004);
                }
            }
            // Fire also destroys player projectile blobs (including landed ones)
            for (let pi = 0; pi < this.projs.length; pi++) {
                if (hitProjs.has(pi)) continue;
                if (Math.hypot(fp.x - this.projs[pi].x, fp.y - this.projs[pi].y) < fp.radius + this.projs[pi].radius) {
                    hitProjs.add(pi);
                }
            }
        }
        this.blobs = this.blobs.filter((_, i) => !hitBlobs.has(i));
        this.projs = this.projs.filter((_, i) => !hitProjs.has(i));
    }

    _collideEnemyBlobs() {
        // Direct contact: enemies damage player blobs on touch
        const eaten = new Set();
        for (const e of this.enemies) {
            for (let i = 0; i < this.blobs.length; i++) {
                if (eaten.has(i)) continue;
                if (Math.hypot(e.x - this.blobs[i].x, e.y - this.blobs[i].y) < e.radius + this.blobs[i].radius) {
                    eaten.add(i);
                    e.health--;
                    e.hitTimer = 8;
                    if (e.health <= 0) { this.score += 50; this.killCount++; }
                    this.cameras.main.shake(70, 0.007);
                    break;
                }
            }
        }
        this.blobs   = this.blobs.filter((_, i) => !eaten.has(i));
        this.enemies = this.enemies.filter(e => e.health > 0);
        this._checkAccomplishments();
    }

    _collideLevelFires() {
        // Static fire hazards from level definition (burn blobs)
        const def    = this.levelDefs[this.levelIdx];
        const hitSet = new Set();
        for (const f of def.fires) {
            for (let i = 0; i < this.blobs.length; i++) {
                if (hitSet.has(i)) continue;
                const b = this.blobs[i];
                if (b.x + b.radius > f.x && b.x - b.radius < f.x + f.w && b.y + b.radius > f.y) {
                    hitSet.add(i);
                }
            }
        }
        if (hitSet.size) this.cameras.main.shake(40, 0.004);
        this.blobs = this.blobs.filter((_, i) => !hitSet.has(i));
    }

    // ── Collectibles ──────────────────────────────────────────────────────────
    _collectLandedBlobs() {
        // Collect landed blobs when the cluster gets close enough
        // Iterate in reverse order so we can splice by index without offset issues
        const toCollect = [];
        for (let i = this.projs.length - 1; i >= 0; i--) {
            const p = this.projs[i];
            if (!p.landed) continue;
            for (const b of this.blobs) {
                if (Math.hypot(b.x - p.x, b.y - p.y) < COLLECT_D) {
                    toCollect.push(i);
                    break;
                }
            }
        }
        // toCollect is already in descending order (high → low) so splice is safe
        for (const i of toCollect) {
            const p = this.projs.splice(i, 1)[0];
            this.blobs.push(this._makeBlob(p.x, p.y, p.vx * 0.2, p.vy * 0.2));
        }
    }

    _collectVats() {
        for (const v of this.vats) {
            if (!v.alive) continue;
            for (const b of this.blobs) {
                if (Math.hypot(b.x - v.x, b.y - v.y) < v.radius + b.radius + 16) {
                    v.alive = false;
                    this.vatCount++;
                    this.score += 30;
                    // Grow cluster by 3 blobs
                    const c = this._center();
                    for (let j = 0; j < 3; j++) {
                        const a = Math.PI * 2 * j / 3;
                        this.blobs.push(this._makeBlob(
                            v.x + Math.cos(a) * BLOB_R,
                            v.y + Math.sin(a) * BLOB_R
                        ));
                    }
                    this._checkAccomplishments();
                    break;
                }
            }
        }
        this.vats = this.vats.filter(v => v.alive);
    }

    _collectWater() {
        for (const w of this.waters) {
            if (!w.alive) continue;
            for (const b of this.blobs) {
                if (b.x > w.x && b.x < w.x + w.w && b.y + b.radius >= w.y) {
                    w.alive = false;
                    this.waterCount++;
                    this.score += 20;
                    // Convert water to 2 blobs
                    for (let j = 0; j < 2; j++) {
                        this.blobs.push(this._makeBlob(
                            w.x + w.w * (j + 1) / 3, w.y, 0, -3
                        ));
                    }
                    this._checkAccomplishments();
                    break;
                }
            }
        }
        this.waters = this.waters.filter(w => w.alive);
    }

    // ── Level exit ────────────────────────────────────────────────────────────
    _checkExit() {
        const def  = this.levelDefs[this.levelIdx];
        const exit = def.exit;
        const c    = this._center();
        if (c.x > exit.x && c.x < exit.x + exit.w &&
            c.y > exit.y && c.y < exit.y + exit.h) {
            this._onLevelComplete();
        }
    }

    _onLevelComplete() {
        if (this.dead || this._transitioning) return;
        this._transitioning = true;

        if (this.blobsAtLevelStart === this.blobs.length) {
            this._tryUnlock('untouched');
        }

        if (this.levelIdx + 1 >= this.levelDefs.length) {
            // All levels complete – win!
            this._tryUnlock('escaped');
            this._checkAccomplishments();
            this.time.delayedCall(400, () =>
                this.scene.start('WinScene', {
                    score: this.score,
                    blobs: this.blobs.length,
                    newlyUnlocked: this.newlyUnlocked,
                })
            );
        } else {
            // Next level
            if (this.levelIdx + 1 >= 1) this._tryUnlock('level_2');
            if (this.levelIdx + 1 >= 2) this._tryUnlock('level_3');

            this.cameras.main.flash(600, 0, 255, 100);
            this.time.delayedCall(700, () => {
                this._transitioning = false;
                this._loadLevel(this.levelIdx + 1);
            });
        }
    }

    // ── Camera ────────────────────────────────────────────────────────────────
    _updateCamera() {
        const def  = this.levelDefs[this.levelIdx];
        const c    = this._center();
        const W    = this.scale.width;
        const H    = this.scale.height;
        const maxX = Math.max(0, def.worldW - W);

        // Smooth horizontal follow, slightly ahead of player
        const targetX = Math.max(0, Math.min(c.x - W * 0.38, maxX));
        this.cameras.main.scrollX += (targetX - this.cameras.main.scrollX) * 0.08;
    }

    // ── Main loop ─────────────────────────────────────────────────────────────
    update(time, delta) {
        if (this.dead) return;
        const dt = normDt(delta);

        this._stepBlobs(dt);
        this._stepProjs(dt);
        this._stepEnemies(dt);

        this._collideProjs();
        this._collideEnemyProjs();
        this._collideFireParticles();
        this._collideEnemyBlobs();
        this._collideLevelFires();
        this._collectLandedBlobs();
        this._collectVats();
        this._collectWater();

        if (!this._transitioning) this._checkExit();

        this._updateCamera();
        this._draw(time);
        this._updateUI();

        if (this.blobs.length === 0) {
            this.dead = true;
            this._checkAccomplishments();
            this.time.delayedCall(500, () =>
                this.scene.start('GameOverScene', {
                    score: this.score,
                    level: this.levelIdx + 1,
                    newlyUnlocked: this.newlyUnlocked,
                })
            );
        }
    }

    // ── Rendering ─────────────────────────────────────────────────────────────
    _draw(time) {
        this.gBg.clear();
        this.gLevel.clear();
        this.gVat.clear();
        this.gWater.clear();
        this.gFire.clear();
        this.gSlime.clear();
        this.gBlob.clear();
        this.gProj.clear();
        this.gEnemy.clear();
        this.gFx.clear();

        this._drawBg();
        this._drawLevel();
        this._drawVats();
        this._drawWater();
        this._drawLevelFires();
        this._drawFireParticles();
        this._drawConnections();
        this._drawLandedBlobs();
        this._drawProjs();
        this._drawBlobs();
        this._drawEnemies();
        this._drawEnemyProjs();
        this._drawExit();
    }

    _drawBg() {
        const def  = this.levelDefs[this.levelIdx];
        const g    = this.gBg;
        const lw   = def.worldW;
        const lh   = def.worldH;

        // Base fill (already handled by camera bgColor, but draw lab tile grid)
        g.lineStyle(1, 0x1a2a3a, 0.4);
        for (let x = 0; x <= lw; x += 64) {
            g.lineBetween(x, 0, x, lh);
        }
        for (let y = 0; y <= lh; y += 64) {
            g.lineBetween(0, y, lw, y);
        }

        // Subtle lab decorations at fixed x-positions
        const decorX = [300, 550, 900, 1300, 1700, 2100, 2600, 3000, 3500, 3900];
        for (const dx of decorX) {
            if (dx > lw - 50) continue;
            const G = def.worldH - 52;
            // Computer terminal silhouette
            g.fillStyle(0x1e2d3e, 0.7);
            g.fillRect(dx, G - 60, 40, 50);   // terminal body
            g.fillStyle(0x2a4060, 0.6);
            g.fillRect(dx + 4, G - 54, 32, 32); // screen
            g.fillStyle(0x1a3a5a, 0.5);
            g.fillRect(dx + 15, G - 10, 10, 10); // base
            // Lab bench
            g.fillStyle(0x2e3e4e, 0.5);
            g.fillRect(dx + 50, G - 42, 80, 8);  // bench top
            g.fillRect(dx + 52, G - 42, 4, 42);   // left leg
            g.fillRect(dx + 124, G - 42, 4, 42);  // right leg
        }
    }

    _drawLevel() {
        const def  = this.levelDefs[this.levelIdx];
        const g    = this.gLevel;
        const G    = def.worldH - 52;

        // Draw solid rectangles
        for (const s of def.solids) {
            g.fillStyle(C_GROUND, 1);
            g.fillRect(s.x, s.y, s.w, s.h);
            // Top highlight for ground
            if (s.y >= G) {
                g.fillStyle(C_PLAT_TOP, 0.35);
                g.fillRect(s.x, s.y, s.w, 4);
            }
            // Wall paneling lines
            if (s.w <= 20) {
                g.lineStyle(1, 0x6a8099, 0.2);
                for (let y = s.y + 60; y < s.y + s.h; y += 60) {
                    g.lineBetween(s.x, y, s.x + s.w, y);
                }
            }
        }

        // Draw one-way platforms
        for (const p of def.platforms) {
            // Shadow
            g.fillStyle(0x000000, 0.22);
            g.fillRect(p.x + 3, p.y + 4, p.w, p.h);
            // Platform body
            g.fillStyle(C_PLATFORM, 1);
            g.fillRect(p.x, p.y, p.w, p.h);
            // Bright top edge
            g.fillStyle(C_PLAT_TOP, 0.75);
            g.fillRect(p.x, p.y, p.w, 3);
            // Subtle bolt markers
            for (let bx = p.x + 12; bx < p.x + p.w - 10; bx += 40) {
                g.fillStyle(0x8899aa, 0.5);
                g.fillCircle(bx, p.y + p.h - 4, 2);
            }
        }

        // Caution tape stripes on ground edges
        g.lineStyle(2, 0xffcc00, 0.18);
        const gw = def.worldW;
        for (let x = 0; x < gw; x += 40) {
            if ((Math.floor(x / 40)) % 2 === 0) {
                g.lineBetween(x, G + 1, x + 20, G + 1);
            }
        }
    }

    _drawVats() {
        const g = this.gVat;
        for (const v of this.vats) {
            v.pulse += 0.05;
            const pr = 1 + 0.12 * Math.sin(v.pulse);
            const vr = v.radius * pr;
            // Vat cylinder (rectangle base + oval top)
            g.fillStyle(0x224433, 0.9);
            g.fillRect(v.x - vr, v.y - vr * 1.8, vr * 2, vr * 1.8);
            // Liquid fill (green jelly)
            g.fillStyle(C_VAT, 0.7);
            g.fillEllipse(v.x, v.y - vr * 0.6, vr * 1.8, vr * 0.7);
            // Rim
            g.lineStyle(2, 0x44cc77, 0.8);
            g.strokeEllipse(v.x, v.y - vr * 1.5, vr * 2.1, vr * 0.5);
            // Glow
            g.fillStyle(C_VAT, 0.12);
            g.fillCircle(v.x, v.y - vr, vr * 2.2);
            // Label (J)
            g.fillStyle(0xaaffcc, 0.7);
            g.fillCircle(v.x, v.y - vr * 1.0, vr * 0.32);
        }
    }

    _drawWater() {
        const g = this.gWater;
        for (const w of this.waters) {
            if (!w.alive) continue;
            // Shimmer
            g.fillStyle(C_WATER_COL, 0.22);
            g.fillRect(w.x - 4, w.y - 4, w.w + 8, w.h + 8);
            g.fillStyle(C_WATER_COL, 0.65);
            g.fillRect(w.x, w.y, w.w, w.h);
            // Surface ripple highlight
            g.fillStyle(0xaaddff, 0.4);
            g.fillRect(w.x + 4, w.y, w.w - 8, 3);
        }
    }

    _drawLevelFires() {
        const def = this.levelDefs[this.levelIdx];
        const g   = this.gFire;
        const now = this.time.now;
        for (const f of def.fires) {
            // Animated fire
            for (let i = 0; i < 4; i++) {
                const flicker = Math.sin(now * 0.01 + i * 1.3) * 0.4;
                const fr      = 10 + i * 4 + flicker * 4;
                const fx      = f.x + (i / 3) * f.w;
                const fy      = f.y - 6 - flicker * 8;
                g.fillStyle(C_FIRE_COL, 0.8 - i * 0.15);
                g.fillCircle(fx, fy, fr);
                g.fillStyle(0xffaa00, 0.5);
                g.fillCircle(fx, fy + 4, fr * 0.6);
            }
            // Base glow
            g.fillStyle(0xff7700, 0.15);
            g.fillRect(f.x - 8, f.y - 20, f.w + 16, f.h + 20);
        }
    }

    _drawFireParticles() {
        const g = this.gFire;
        for (const fp of this.fireParticles) {
            g.fillStyle(C_FIRE_COL, fp.alpha * 0.85);
            g.fillCircle(fp.x, fp.y, fp.radius);
            g.fillStyle(0xffcc00, fp.alpha * 0.45);
            g.fillCircle(fp.x, fp.y, fp.radius * 0.5);
        }
    }

    _drawConnections() {
        const g    = this.gSlime;
        const maxD = SPRING_REST * 1.9;
        for (let i = 0; i < this.blobs.length; i++) {
            for (let j = i + 1; j < this.blobs.length; j++) {
                const a = this.blobs[i], b = this.blobs[j];
                const d = Math.hypot(b.x - a.x, b.y - a.y);
                if (d > maxD) continue;
                const t = 1 - d / maxD;
                g.lineStyle(3 + t * 10, C_PLAYER, t * 0.55);
                g.lineBetween(a.x, a.y, b.x, b.y);
            }
        }
    }

    _drawBlobs() {
        const g = this.gBlob;
        for (const b of this.blobs) {
            const w = Math.sin(b.phase) * 0.08;
            g.fillStyle(C_PLAYER_HI, 0.12);
            g.fillCircle(b.x, b.y, b.radius * 1.7);
            g.fillStyle(C_PLAYER, 0.88);
            g.fillEllipse(b.x, b.y, (1 + w) * b.radius * 2, (1 - w) * b.radius * 2);
            g.fillStyle(0xaaffdd, 0.55);
            g.fillCircle(b.x - b.radius * 0.3, b.y - b.radius * 0.32, b.radius * 0.32);
        }
    }

    _drawLandedBlobs() {
        // Landed projectile blobs waiting to be collected
        const g = this.gProj;
        for (const p of this.projs) {
            if (!p.landed) continue;
            // Dim version – sitting on the ground
            const w = Math.sin(p.phase) * 0.08;
            g.fillStyle(C_PROJ, 0.25);
            g.fillCircle(p.x, p.y, p.radius * 1.5);
            g.fillStyle(C_PROJ, 0.65);
            g.fillEllipse(p.x, p.y, (1 + w) * p.radius * 2, (1 - w) * p.radius * 2);
            // Pulsing ring to indicate collectable
            const ring = 1 + 0.3 * Math.sin(p.phase * 2);
            g.lineStyle(1.5, C_PROJ, 0.5 * ring);
            g.strokeCircle(p.x, p.y, p.radius * 2.0 * ring);
        }
    }

    _drawProjs() {
        const g = this.gProj;
        for (const p of this.projs) {
            if (p.landed) continue;
            // Trail
            for (let t = 0; t < p.trail.length; t++) {
                const tr = p.trail[t];
                const a  = (1 - t / p.trail.length) * 0.45;
                const r  = p.radius * (1 - t / p.trail.length) * 0.55;
                if (r < 1) continue;
                g.fillStyle(C_PROJ, a);
                g.fillCircle(tr.x, tr.y, r);
            }
            g.fillStyle(0xffffff, 0.1);
            g.fillCircle(p.x, p.y, p.radius * 2);
            const w = Math.sin(p.phase) * 0.1;
            g.fillStyle(C_PROJ, 0.92);
            g.fillEllipse(p.x, p.y, (1 + w) * p.radius * 2, (1 - w) * p.radius * 2);
            g.fillStyle(0xffffff, 0.6);
            g.fillCircle(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.3);
        }
    }

    _drawEnemies() {
        const g = this.gEnemy;
        for (const e of this.enemies) {
            const flashed = e.hitTimer > 0;
            const d       = e.dir;  // 1 = facing right, -1 = facing left

            if (e.type === 'scientist') {
                // Lab coat (white body rectangle)
                const col = flashed ? 0xffffff : 0xddddee;
                const headCol = flashed ? 0xffffff : 0xffccaa;
                // Body
                g.fillStyle(col, 0.95);
                g.fillRect(e.x - 9, e.y - 24, 18, 26);
                // Head
                g.fillStyle(headCol, 0.9);
                g.fillRect(e.x - 7, e.y - 38, 14, 14);
                // Glasses (two small rectangles)
                g.fillStyle(0x3399ff, 0.8);
                g.fillRect(e.x + (d > 0 ? 0 : -7), e.y - 33, 6, 4);
                // Lab coat front line
                g.lineStyle(1, 0xaaaacc, 0.5);
                g.lineBetween(e.x, e.y - 22, e.x, e.y + 2);
                // Arms
                g.fillStyle(col, 0.7);
                g.fillRect(e.x - 14, e.y - 22, 4, 14);
                g.fillRect(e.x + 10,  e.y - 22, 4, 14);
                // Gun barrel hint
                g.fillStyle(0x555566, 0.9);
                g.fillRect(e.x + d * 13, e.y - 16, d * 8, 3);
            } else if (e.type === 'guard') {
                // Guard: blue-gray uniform + helmet
                const col = flashed ? 0xffffff : 0x5577aa;
                const bodyCol = flashed ? 0xffffff : 0x4466aa;
                const helmCol = flashed ? 0xffffff : 0x334466;
                // Body
                g.fillStyle(bodyCol, 0.95);
                g.fillRect(e.x - 10, e.y - 26, 20, 28);
                // Head
                g.fillStyle(0xffccaa, 0.9);
                g.fillRect(e.x - 8, e.y - 40, 16, 14);
                // Helmet
                g.fillStyle(helmCol, 0.95);
                g.fillRect(e.x - 9, e.y - 44, 18, 10);
                g.fillStyle(helmCol, 0.6);
                g.fillRect(e.x + (d > 0 ? -9 : 1), e.y - 38, 8, 4);
                // Arms
                g.fillStyle(bodyCol, 0.75);
                g.fillRect(e.x - 15, e.y - 24, 4, 16);
                g.fillRect(e.x + 11,  e.y - 24, 4, 16);
                // Rifle
                g.fillStyle(0x222233, 0.9);
                g.fillRect(e.x + d * 12, e.y - 18, d * 14, 4);
                g.fillRect(e.x + d * 25, e.y - 22, d * 3, 8);
                // Belt buckle
                g.fillStyle(0xffcc00, 0.6);
                g.fillRect(e.x - 4, e.y - 2, 8, 4);
            } else {
                // Flamethrower: olive/brown + tank + nozzle
                const col = flashed ? 0xffffff : 0x667744;
                const tankCol = flashed ? 0xdddddd : 0x8b5e3c;
                // Body (heavier build)
                g.fillStyle(col, 0.95);
                g.fillRect(e.x - 12, e.y - 28, 24, 30);
                // Head
                g.fillStyle(0xffccaa, 0.9);
                g.fillRect(e.x - 8, e.y - 42, 16, 14);
                // Helmet (full face coverage)
                g.fillStyle(0x445533, 0.9);
                g.fillRect(e.x - 9, e.y - 46, 18, 14);
                g.fillStyle(0x99aaaa, 0.4);
                g.fillRect(e.x - 6, e.y - 44, 12, 8);
                // Tank on back (opposite of facing dir)
                g.fillStyle(tankCol, 0.9);
                g.fillCircle(e.x - d * 14, e.y - 18, 9);
                g.fillCircle(e.x - d * 14, e.y - 8,  7);
                // Hose
                g.lineStyle(3, 0x7b4c2a, 0.8);
                g.lineBetween(e.x - d * 8, e.y - 16, e.x + d * 8, e.y - 14);
                // Nozzle / flamethrower gun
                g.fillStyle(0x333322, 0.95);
                g.fillRect(e.x + d * 8,  e.y - 18, d * 18, 6);
                g.fillRect(e.x + d * 24, e.y - 20, d * 4,  10);
            }

            // Health pips
            if (e.maxHealth > 1) {
                for (let h = 0; h < e.maxHealth; h++) {
                    g.fillStyle(h < e.health ? 0xff6600 : 0x222233, 0.9);
                    g.fillCircle(e.x - e.maxHealth * 4 + h * 8, e.y - 52, 3);
                }
            }
        }
    }

    _drawEnemyProjs() {
        const g = this.gEnemy;
        for (const ep of this.enemyProjs) {
            const col = ep.type === 'guard' ? 0xffcc33 : 0xffaa66;
            g.fillStyle(col, 0.9);
            g.fillCircle(ep.x, ep.y, ep.radius);
            g.fillStyle(0xffffff, 0.5);
            g.fillCircle(ep.x - ep.radius * 0.3, ep.y - ep.radius * 0.3, ep.radius * 0.35);
        }
    }

    _drawExit() {
        const def  = this.levelDefs[this.levelIdx];
        const exit = def.exit;
        const g    = this.gFx;
        const now  = this.time.now;
        const glow = 0.6 + 0.3 * Math.sin(now * 0.003);

        // Door frame
        g.lineStyle(4, C_EXIT, glow);
        g.strokeRect(exit.x, exit.y, exit.w, exit.h);
        // Door fill
        g.fillStyle(C_EXIT, 0.08);
        g.fillRect(exit.x, exit.y, exit.w, exit.h);
        // Inner door highlight
        g.lineStyle(2, 0xaaffdd, glow * 0.5);
        g.strokeRect(exit.x + 5, exit.y + 5, exit.w - 10, exit.h - 10);
        // Arrow
        g.fillStyle(C_EXIT, glow * 0.9);
        const ax = exit.x + exit.w / 2;
        const ay = exit.y + exit.h / 2;
        g.fillTriangle(ax, ay - 12, ax + 14, ay, ax, ay + 12);
        g.fillRect(ax - 14, ay - 5, 14, 10);
        // "EXIT" label above
        // (drawn as simple line pattern, not text, to keep in world space)
    }

    // ── UI ────────────────────────────────────────────────────────────────────
    _createUI() {
        const D = 20;
        const W = this.scale.width;
        const H = this.scale.height;

        this.txtScore = this.add.text(16, 16, 'Score: 0', {
            fontSize: '21px', fill: '#ffffff', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 3
        }).setScrollFactor(0).setDepth(D);

        this.txtBlobs = this.add.text(16, 44, `Blobs: ${N_START}`, {
            fontSize: '21px', fill: '#00ff88', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 3
        }).setScrollFactor(0).setDepth(D);

        this.txtLevel = this.add.text(W / 2, 22, '', {
            fontSize: '22px', fill: '#ffdd44', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D);

        this.txtHint = this.add.text(W / 2, H - 105, 'A/D or ◀▶ to move  ·  W/Space/▲ to jump  ·  Click/Tap to shoot', {
            fontSize: '13px', fill: '#667788', fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(D);
        this.time.delayedCall(6000, () =>
            this.tweens.add({ targets: this.txtHint, alpha: 0, duration: 1500 })
        );

        this.scale.on('resize', (gs) => {
            if (this.txtLevel)  this.txtLevel.setX(gs.width / 2);
            if (this.txtHint)   this.txtHint.setX(gs.width / 2).setY(gs.height - 105);
            if (this.btnLeft)   this.btnLeft.setY(gs.height - 70);
            if (this.btnRight)  this.btnRight.setY(gs.height - 70);
            if (this.btnJump)   { this.btnJump.setX(gs.width - 24).setY(gs.height - 70); }
        });
    }

    _updateUI() {
        const total = this.blobs.length;
        this.txtScore.setText(`Score: ${this.score}`);
        this.txtBlobs.setText(`Blobs: ${total}`);
        const pct = total / N_START;
        this.txtBlobs.setStyle({ fill: pct > 0.6 ? '#00ff88' : pct > 0.3 ? '#ffcc00' : '#ff4444' });
    }
}

// =============================================================================
//  GameOverScene
// =============================================================================
class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOverScene' }); }

    create(data) {
        this.cameras.main.setBackgroundColor('#0a0e14');
        const W = this.scale.width, H = this.scale.height;

        // Background blob decoration
        const gfx = this.add.graphics();
        for (let i = 0; i < 18; i++) {
            gfx.fillStyle(0x00aa44, 0.06 + Math.random() * 0.05);
            gfx.fillCircle(Math.random() * W, Math.random() * H, 20 + Math.random() * 65);
        }

        this.add.text(W / 2, H / 2 - 120, '◆  CAPTURED  ◆', {
            fontSize: '46px', fill: '#ff4444', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 55, 'The lab security overpowered you…', {
            fontSize: '17px', fill: '#aa8866', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 10, `Score: ${data.score}`, {
            fontSize: '32px', fill: '#ffffff', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 + 36, `Reached: Level ${data.level}`, {
            fontSize: '22px', fill: '#ffaa00', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);

        const btn = this.add.text(W / 2, H / 2 + 100, '[ TRY AGAIN ]', {
            fontSize: '30px', fill: '#00ff88', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 3, padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });
        btn.on('pointerover',  () => btn.setStyle({ fill: '#88ffcc' }));
        btn.on('pointerout',   () => btn.setStyle({ fill: '#00ff88' }));
        btn.on('pointerdown',  () => this.scene.start('GameScene'));
        this.tweens.add({ targets: btn, scaleX: 1.06, scaleY: 1.06, yoyo: true, repeat: -1, duration: 700 });

        // Newly unlocked accomplishments
        const nu = (data.newlyUnlocked || []).slice(0, 4);
        if (nu.length > 0) {
            this.add.text(W / 2, H / 2 + 150, '★ NEW ACCOMPLISHMENTS ★', {
                fontSize: '14px', fill: '#ffcc33', fontFamily: 'monospace',
                fontStyle: 'bold', stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5);
            let yOff = H / 2 + 172;
            for (const id of nu) {
                const def = ACCOMPLISH_DEFS.find(d => d.id === id);
                if (!def) continue;
                this.add.text(W / 2, yOff, `✦ ${def.name}  –  ${def.desc}`, {
                    fontSize: '12px', fill: '#ffdd66', fontFamily: 'monospace', stroke: '#000', strokeThickness: 2
                }).setOrigin(0.5);
                yOff += 20;
            }
        }

        this.time.delayedCall(600, () => {
            this.input.on('pointerdown', () => this.scene.start('GameScene'));
        });
    }
}

// =============================================================================
//  WinScene
// =============================================================================
class WinScene extends Phaser.Scene {
    constructor() { super({ key: 'WinScene' }); }

    create(data) {
        this.cameras.main.setBackgroundColor('#040e08');
        const W = this.scale.width, H = this.scale.height;

        const gfx = this.add.graphics();
        // Celebratory green blobs
        const blobs = [];
        for (let i = 0; i < 20; i++) {
            blobs.push({
                x: Math.random() * W, y: Math.random() * H,
                r: 12 + Math.random() * 40,
                phase: Math.random() * Math.PI * 2,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                col: [0x00dd77, 0x22ff99, 0x00aa55][Math.floor(Math.random() * 3)]
            });
        }

        this.add.text(W / 2, H / 2 - 130, '★  ESCAPED!  ★', {
            fontSize: '54px', fill: '#00ff88', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(5);

        this.add.text(W / 2, H / 2 - 60, 'You broke out of the lab!\nThe world is yours, blob.', {
            fontSize: '20px', fill: '#aaffcc', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2, align: 'center'
        }).setOrigin(0.5).setDepth(5);

        this.add.text(W / 2, H / 2 + 12, `Final Score: ${data.score}`, {
            fontSize: '32px', fill: '#ffdd44', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(5);

        this.add.text(W / 2, H / 2 + 55, `Blobs remaining: ${data.blobs}`, {
            fontSize: '20px', fill: '#88ff88', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(5);

        const btn = this.add.text(W / 2, H / 2 + 115, '[ PLAY AGAIN ]', {
            fontSize: '30px', fill: '#00ff88', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 3, padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' }).setDepth(5);
        btn.on('pointerover',  () => btn.setStyle({ fill: '#88ffcc' }));
        btn.on('pointerout',   () => btn.setStyle({ fill: '#00ff88' }));
        btn.on('pointerdown',  () => this.scene.start('GameScene'));
        this.tweens.add({ targets: btn, scaleX: 1.06, scaleY: 1.06, yoyo: true, repeat: -1, duration: 700 });

        // Newly unlocked
        const nu = (data.newlyUnlocked || []).slice(0, 4);
        if (nu.length > 0) {
            this.add.text(W / 2, H / 2 + 165, '★ NEW ACCOMPLISHMENTS ★', {
                fontSize: '14px', fill: '#ffcc33', fontFamily: 'monospace',
                fontStyle: 'bold', stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setDepth(5);
            let yOff = H / 2 + 185;
            for (const id of nu) {
                const def = ACCOMPLISH_DEFS.find(d => d.id === id);
                if (!def) continue;
                this.add.text(W / 2, yOff, `✦ ${def.name}  –  ${def.desc}`, {
                    fontSize: '12px', fill: '#ffdd66', fontFamily: 'monospace',
                    stroke: '#000', strokeThickness: 2
                }).setOrigin(0.5).setDepth(5);
                yOff += 20;
            }
        }

        // Animated background blobs
        this.events.on('update', (time, delta) => {
            const dt = normDt(delta);
            gfx.clear();
            for (const b of blobs) {
                b.x += b.vx * dt; b.y += b.vy * dt;
                b.phase += 0.018 * dt;
                if (b.x < -60)    b.x = W + 60;
                if (b.x > W + 60) b.x = -60;
                if (b.y < -60)    b.y = H + 60;
                if (b.y > H + 60) b.y = -60;
                const rr = b.r * (1 + Math.sin(b.phase) * 0.08);
                gfx.fillStyle(b.col, 0.12);
                gfx.fillCircle(b.x, b.y, rr * 1.7);
                gfx.fillStyle(b.col, 0.55);
                gfx.fillCircle(b.x, b.y, rr);
            }
        });

        this.time.delayedCall(700, () => {
            this.input.on('pointerdown', () => this.scene.start('GameScene'));
        });
    }
}

// =============================================================================
//  TitleScene
// =============================================================================
class TitleScene extends Phaser.Scene {
    constructor() { super({ key: 'TitleScene' }); }

    create() {
        this.cameras.main.setBackgroundColor('#080818');
        const W = this.scale.width, H = this.scale.height;

        const gfx = this.add.graphics();
        const decorBlobs = [];
        for (let i = 0; i < 14; i++) {
            decorBlobs.push({
                x: Math.random() * W, y: Math.random() * H,
                r: 14 + Math.random() * 42,
                phase: Math.random() * Math.PI * 2,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                col: [0x00dd77, 0x22ff99, 0x00aa55][Math.floor(Math.random() * 3)]
            });
        }

        this.add.text(W / 2, H / 2 - 130, '★ StarJelly ★', {
            fontSize: '62px', fill: '#00ff88', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(10);

        this.add.text(W / 2, H / 2 - 60, 'Lab Escape', {
            fontSize: '26px', fill: '#aaffcc', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(10);

        this.add.text(W / 2, H / 2 - 20, [
            'You are an escaped jelly-blob experiment.',
            'Fight through the lab and reach the exit!',
        ].join('\n'), {
            fontSize: '15px', fill: '#778899', fontFamily: 'monospace',
            align: 'center', stroke: '#000', strokeThickness: 1
        }).setOrigin(0.5).setDepth(10);

        this.add.text(W / 2, H / 2 + 32,
            'A / ← → / D  to move   ·   W / ↑ / Space  to jump   ·   Click / Tap  to shoot',
            { fontSize: '13px', fill: '#556677', fontFamily: 'monospace' }
        ).setOrigin(0.5).setDepth(10);

        const btn = this.add.text(W / 2, H / 2 + 90, '[ START ]', {
            fontSize: '36px', fill: '#00ff88', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 3, padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' }).setDepth(10);
        btn.on('pointerover',  () => btn.setStyle({ fill: '#88ffcc' }));
        btn.on('pointerout',   () => btn.setStyle({ fill: '#00ff88' }));
        btn.on('pointerdown',  () => this.scene.start('GameScene'));
        this.tweens.add({ targets: btn, scaleX: 1.06, scaleY: 1.06, yoyo: true, repeat: -1, duration: 700 });

        this.add.text(W / 2, H - 22,
            'Jelly vats grow your cluster  ·  Shoot blobs to defeat enemies  ·  Beware fire!',
            { fontSize: '12px', fill: '#334455', fontFamily: 'monospace' }
        ).setOrigin(0.5).setDepth(10);

        // ── Accomplishments panel ──
        const accs          = Accomplishments.getAll();
        const unlockedCount = accs.filter(a => a.unlocked).length;
        const lineH         = 18;
        const cols          = 2;
        const rows          = Math.ceil(accs.length / cols);
        const panelH        = rows * lineH + 24;
        const panelTop      = Math.max(H / 2 + 140, H - 38 - panelH);

        this.add.text(W / 2, panelTop, `── ACCOMPLISHMENTS  ${unlockedCount} / ${accs.length} ──`, {
            fontSize: '12px', fill: '#445566', fontFamily: 'monospace', stroke: '#000', strokeThickness: 1
        }).setOrigin(0.5).setDepth(10);

        const colW   = Math.min(220, W / 2 - 12);
        const startY = panelTop + 20;
        for (let i = 0; i < accs.length; i++) {
            const acc   = accs[i];
            const col   = i % cols;
            const row   = Math.floor(i / cols);
            const x     = W / 2 + (col === 0 ? -colW / 2 : colW / 2);
            const y     = startY + row * lineH;
            this.add.text(x, y,
                acc.unlocked ? `✦ ${acc.name}` : `· ???`,
                { fontSize: '11px', fill: acc.unlocked ? '#ccaa33' : '#2a3c4e',
                  fontFamily: 'monospace', stroke: '#000', strokeThickness: 1 }
            ).setOrigin(0.5).setDepth(10);
        }

        // Animate background blobs
        this.events.on('update', (time, delta) => {
            const dt = normDt(delta);
            gfx.clear();
            for (const b of decorBlobs) {
                b.x += b.vx * dt; b.y += b.vy * dt;
                b.phase += 0.016 * dt;
                if (b.x < -60)    b.x = W + 60;
                if (b.x > W + 60) b.x = -60;
                if (b.y < -60)    b.y = H + 60;
                if (b.y > H + 60) b.y = -60;
                const rr = b.r * (1 + Math.sin(b.phase) * 0.07);
                gfx.fillStyle(b.col, 0.17);
                gfx.fillCircle(b.x, b.y, rr * 1.6);
                gfx.fillStyle(b.col, 0.55);
                gfx.fillCircle(b.x, b.y, rr);
                gfx.fillStyle(0xaaffdd, 0.28);
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
    scene          : [TitleScene, GameScene, GameOverScene, WinScene],
    scale          : {
        mode      : Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width     : window.innerWidth,
        height    : window.innerHeight
    }
});
