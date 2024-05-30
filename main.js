const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events, Vector } = Matter;

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

let blobs = [];
let currentBlob = null;
let isDragging = false;

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

        // Draw face on the active blob
        if (this.isActive) {
            ctx.font = '20px Arial';
            ctx.fillStyle = 'black';
            ctx.fillText(this.face, -10, 5);
        }
        ctx.restore();
    }
}

function init() {
    currentBlob = new Blob(100, 100, 20, true);
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
    }
});

Events.on(mouseConstraint, 'mousemove', (event) => {
    if (isDragging && currentBlob) {
        const { mouse } = event.source;
        const x = mouse.position.x;
        const y = mouse.position.y;

        Matter.Body.setPosition(currentBlob.body, { x: x, y: y });
    }
});

Events.on(mouseConstraint, 'mouseup', (event) => {
    isDragging = false;
});

canvas.addEventListener('click', (e) => {
    if (!isDragging && currentBlob) {
        const rect = canvas.getBoundingClientRect();
        shootStream(e.clientX - rect.left, e.clientY - rect.top);
    }
});

function isInsideBlob(x, y, blob) {
    const dx = x - blob.body.position.x;
    const dy = y - blob.body.position.y;
    return Math.sqrt(dx * dx + dy * dy) < blob.size;
}

function shootStream(targetX, targetY) {
    const { x, y } = currentBlob.body.position;
    const angle = Math.atan2(targetY - y, targetX - x);

    const streamSize = 5;
    const streamX = x + Math.cos(angle) * currentBlob.size;
    const streamY = y + Math.sin(angle) * currentBlob.size;
    const streamBlob = new Blob(streamX, streamY, streamSize);
    Matter.Body.setVelocity(streamBlob.body, {
        x: Math.cos(angle) * 10,
        y: Math.sin(angle) * 10
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

function resetGame() {
    Composite.clear(world, false, true);
    blobs = [];
    currentBlob = new Blob(100, 100, 20, true);
    blobs.push(currentBlob);
    Composite.add(world, mouseConstraint);
}

init();
