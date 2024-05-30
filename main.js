const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events, Body, Constraint } = Matter;

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

const INITIAL_BLOB_RADIUS = 50;
const MINIMUM_ALIVE_RADIUS = 10;
const MINIMUM_SHOOT_RADIUS = 20;
const STREAM_INTERVAL = 100;
const GRAVITY_SCALE = 1;

engine.world.gravity.y = GRAVITY_SCALE;

class Blob {
    constructor(x, y, radius, isActive = false) {
        this.radius = radius;
        this.isActive = isActive;
        this.body = Bodies.circle(x, y, radius, { inertia: Infinity, frictionAir: 0.1 });
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
        ctx.arc(0, 0, this.body.circleRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.isActive ? 'green' : 'blue';
        ctx.fill();
        ctx.closePath();
        ctx.restore();

        if (this.isActive) {
            ctx.font = '20px Arial';
            ctx.fillStyle = 'black';
            ctx.fillText(this.face, pos.x - 10, pos.y + 5);
        }
    }
}

function init() {
    const ground = Bodies.rectangle(canvas.width / 2, canvas.height - 30, canvas.width, 60, { isStatic: true });
    const leftWall = Bodies.rectangle(30, canvas.height / 2, 60, canvas.height, { isStatic: true });
    const rightWall = Bodies.rectangle(canvas.width - 30, canvas.height / 2, 60, canvas.height, { isStatic: true });
    Composite.add(world, [ground, leftWall, rightWall]);

    currentBlob = new Blob(100, 100, INITIAL_BLOB_RADIUS, true);
    blobs.push(currentBlob);
    gameLoop();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    blobs.forEach(blob => blob.draw());
    drawHUD();
    Engine.update(engine);
    checkBlobCollisions();
    requestAnimationFrame(gameLoop);
}

function drawHUD() {
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`HP: ${currentBlob.body.circleRadius.toFixed(2)}`, 20, 30);
}

function checkBlobCollisions() {
    for (let i = blobs.length - 1; i >= 0; i--) {
        const blob = blobs[i];
        if (!blob.isActive && isColliding(currentBlob.body, blob.body)) {
            mergeBlobs(currentBlob, blob);
            blobs.splice(i, 1);
        }
    }
}

function isColliding(bodyA, bodyB) {
    const dx = bodyA.position.x - bodyB.position.x;
    const dy = bodyA.position.y - bodyB.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < bodyA.circleRadius + bodyB.circleRadius;
}

function mergeBlobs(mainBlob, otherBlob) {
    const mainRadius = Math.pow(mainBlob.body.circleRadius, 2);
    const otherRadius = Math.pow(otherBlob.body.circleRadius, 2);
    const newRadius = Math.sqrt(mainRadius + otherRadius);
    
    Composite.remove(world, mainBlob.body);
    Composite.remove(world, otherBlob.body);

    mainBlob.body = Bodies.circle(mainBlob.body.position.x, mainBlob.body.position.y, newRadius, { inertia: Infinity, frictionAir: 0.1 });
    Composite.add(world, mainBlob.body);
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
    } else if (currentBlob && currentBlob.body.circleRadius >= MINIMUM_SHOOT_RADIUS) {
        isShooting = true;
        startShooting(mouse.position.x, mouse.position.y);
    }
});

Events.on(mouseConstraint, 'mousemove', (event) => {
    if (isDragging && currentBlob) {
        const { mouse } = event.source;
        const x = mouse.position.x;

        // Prevent floating by only allowing horizontal movement
        const currentY = currentBlob.body.position.y;
        Body.setPosition(currentBlob.body, { x: x, y: currentY });
    }
});

Events.on(mouseConstraint, 'mouseup', () => {
    isDragging = false;
    isShooting = false;
});

canvas.addEventListener('click', (e) => {
    if (!isDragging && currentBlob && currentBlob.body.circleRadius >= MINIMUM_SHOOT_RADIUS) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        shootStream(x, y);
    }
});

function isInsideBlob(x, y, blob) {
    const dx = x - blob.body.position.x;
    const dy = y - blob.body.position.y;
    return Math.sqrt(dx * dx + dy * dy) < blob.body.circleRadius;
}

function shootStream(targetX, targetY) {
    if (currentBlob.body.circleRadius <= MINIMUM_ALIVE_RADIUS) return;

    const { x, y } = currentBlob.body.position;
    const angle = Math.atan2(targetY - y, targetX - x);

    const streamRadius = MINIMUM_SHOOT_RADIUS / 2;
    const streamX = x + Math.cos(angle) * currentBlob.body.circleRadius;
    const streamY = y + Math.sin(angle) * currentBlob.body.circleRadius;
    const streamBlob = new Blob(streamX, streamY, streamRadius);
    Body.setVelocity(streamBlob.body, {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    });
    blobs.push(streamBlob);

    const newRadius = Math.sqrt(Math.pow(currentBlob.body.circleRadius, 2) - Math.pow(streamRadius, 2));
    Composite.remove(world, currentBlob.body);
    currentBlob.body = Bodies.circle(x, y, newRadius, { inertia: Infinity, frictionAir: 0.1 });
    Composite.add(world, currentBlob.body);

    if (currentBlob.body.circleRadius < MINIMUM_ALIVE_RADIUS) {
        alert('Game Over!');
        resetGame();
    }
}

function startShooting(targetX, targetY) {
    const shoot = () => {
        if (isShooting && currentBlob.body.circleRadius >= MINIMUM_SHOOT_RADIUS) {
            shootStream(targetX, targetY);
            setTimeout(shoot, STREAM_INTERVAL);
        }
    };
    shoot();
}

function resetGame() {
    Composite.clear(world, false, true);
    blobs = [];
    const ground = Bodies.rectangle(canvas.width / 2, canvas.height - 30, canvas.width, 60, { isStatic: true });
    const leftWall = Bodies.rectangle(30, canvas.height / 2, 60, canvas.height, { isStatic: true });
    const rightWall = Bodies.rectangle(canvas.width - 30, canvas.height / 2, 60, canvas.height, { isStatic: true });
    Composite.add(world, [ground, leftWall, rightWall]);
    currentBlob = new Blob(100, 100, INITIAL_BLOB_RADIUS, true);
    blobs.push(currentBlob);
    Composite.add(world, mouseConstraint);
}

init();
