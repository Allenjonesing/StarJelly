const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events } = Matter;

const canvas = document.getElementById('gameCanvas');
const engine = Engine.create();
const world = engine.world;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: canvas.width,
        height: canvas.height,
        wireframes: false,
        background: '#000'
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

const ctx = canvas.getContext('2d');

let blobs = [];
let currentBlob = null;
let isDragging = false;
let isShooting = false;

const INITIAL_BLOB_SIZE = 20;
const MINIMUM_SHOOT_SIZE = 20; // Twice the minimum size to be alive (10)
const STREAM_INTERVAL = 100; // Interval in milliseconds for shooting stream

class Blob {
    constructor(x, y, size, isActive = false) {
        this.body = Bodies.circle(x, y, size, { restitution: 0.8 });
        this.size = size;
        this.isActive = isActive;
        this.health = size;
        this.face = '😃';
        Composite.add(world, this.body);
    }

    draw() {
        const pos = this.body.position;
        const angle = this.body.angle;
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.isActive ? 'green' : 'blue';
        ctx.fill();
        ctx.closePath();

        if (this.isActive) {
            ctx.font = '20px Arial';
            ctx.fillStyle = 'black';
            ctx.fillText(this.face, -10, 5);
        }
        ctx.restore();
    }
}

function init() {
    const ground = Bodies.rectangle(canvas.width / 2, canvas.height - 50, canvas.width, 20, { isStatic: true });
    Composite.add(world, ground);

    currentBlob = new Blob(100, 100, INITIAL_BLOB_SIZE, true);
    blobs.push(currentBlob);
    gameLoop();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    blobs.forEach(blob => blob.draw());
    Engine.update(engine);
    requestAnimationFrame(gameLoop);
}

const mouse = Mouse.create(canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        render: { visible: false }
    }
});
Composite.add(world, mouseConstraint);

Events.on(mouseConstraint, 'mousedown', (event) => {
    const { mouse } = event.source;
    const x = mouse.position.x;
    const y = mouse.position.y;

    if (currentBlob && isInsideBlob(x, y, currentBlob)) {
        isDragging = true;
    } else if (currentBlob && currentBlob.size >= MINIMUM_SHOOT_SIZE) {
        isShooting = true;
        startShooting(mouse.position.x, mouse.position.y);
    }
});

Events.on(mouseConstraint, 'mousemove', (event) => {
    if (isDragging && currentBlob) {
        const { mouse } = event.source;
        const x = mouse.position.x;
        const y = mouse.position.y;

        if (y > currentBlob.body.position.y) {
            Matter.Body.setPosition(currentBlob.body, { x: x, y: y });
        }
    }
});

Events.on(mouseConstraint, 'mouseup', () => {
    isDragging = false;
    isShooting = false;
});

canvas.addEventListener('click', (e) => {
    if (!isDragging && currentBlob && currentBlob.size >= MINIMUM_SHOOT_SIZE) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        shootStream(x, y);
    }
});

function isInsideBlob(x, y, blob) {
    const dx = x - blob.body.position.x;
    const dy = y - blob.body.position.y;
    return Math.sqrt(dx * dx + dy * dy) < blob.size;
}

function shootStream(targetX, targetY) {
    if (currentBlob.size <= 2 * MINIMUM_SHOOT_SIZE) return;

    const { x, y } = currentBlob.body.position;
    const angle = Math.atan2(targetY - y, targetX - x);

    const streamSize = 2;
    const streamX = x + Math.cos(angle) * currentBlob.size;
    const streamY = y + Math.sin(angle) * currentBlob.size;
    const streamBlob = new Blob(streamX, streamY, streamSize);
    Matter.Body.setVelocity(streamBlob.body, {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    });
    blobs.push(streamBlob);

    currentBlob.size -= streamSize;
    currentBlob.health -= streamSize;
    Matter.Body.scale(currentBlob.body, 1 - streamSize / currentBlob.size, 1 - streamSize / currentBlob.size);

    if (currentBlob.size < 10) {
        alert('Game Over!');
        resetGame();
    }
}

function startShooting(targetX, targetY) {
    const shoot = () => {
        if (isShooting && currentBlob.size >= MINIMUM_SHOOT_SIZE) {
            shootStream(targetX, targetY);
            setTimeout(shoot, STREAM_INTERVAL);
        }
    };
    shoot();
}

function resetGame() {
    Composite.clear(world, false, true);
    blobs = [];
    const ground = Bodies.rectangle(canvas.width / 2, canvas.height - 50, canvas.width, 20, { isStatic: true });
    Composite.add(world, ground);
    currentBlob = new Blob(100, 100, INITIAL_BLOB_SIZE, true);
    blobs.push(currentBlob);
    Composite.add(world, mouseConstraint);
}

init();
