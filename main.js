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

const INITIAL_BLOB_SIZE = 100;
const MINIMUM_ALIVE_SIZE = 10;
const MINIMUM_SHOOT_SIZE = 20;
const STREAM_INTERVAL = 100;

class Blob {
    constructor(x, y, size, isActive = false) {
        this.size = size;
        this.isActive = isActive;
        this.parts = [];
        this.body = this.createBlob(x, y, size);
        this.face = '😃';
        Composite.add(world, this.body);
    }

    createBlob(x, y, size) {
        const parts = [];
        const radius = size / 10;
        for (let i = 0; i < size; i++) {
            const angle = Math.PI * 2 * (i / size);
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            const part = Bodies.circle(px, py, radius / 2);
            parts.push(part);
        }

        this.parts = parts;
        const constraints = parts.map(part => Constraint.create({
            bodyA: part,
            bodyB: parts[0],
            stiffness: 0.1,
            damping: 0.1
        }));

        return Composite.create({
            bodies: parts,
            constraints: constraints
        });
    }

    draw() {
        this.parts.forEach(part => {
            const pos = part.position;
            const angle = part.angle;
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.arc(0, 0, part.circleRadius, 0, Math.PI * 2);
            ctx.fillStyle = this.isActive ? 'green' : 'blue';
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        });

        if (this.isActive) {
            const pos = this.body.bodies[0].position;
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

    currentBlob = new Blob(100, 100, INITIAL_BLOB_SIZE, true);
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
    ctx.fillText(`HP: ${currentBlob.parts.length}`, 20, 30);
}

function checkBlobCollisions() {
    for (let i = blobs.length - 1; i >= 0; i--) {
        const blob = blobs[i];
        if (!blob.isActive && isColliding(currentBlob.body, blob.body)) {
            currentBlob.size += blob.size;
            Composite.remove(world, blob.body);
            blobs.splice(i, 1);
            currentBlob.parts = currentBlob.parts.concat(blob.parts);
            currentBlob.body = Composite.create({
                bodies: currentBlob.parts,
                constraints: currentBlob.body.constraints
            });
            Composite.add(world, currentBlob.body);
        }
    }
}

function isColliding(bodyA, bodyB) {
    const dx = bodyA.bodies[0].position.x - bodyB.bodies[0].position.x;
    const dy = bodyA.bodies[0].position.y - bodyB.bodies[0].position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < bodyA.bodies[0].circleRadius + bodyB.bodies[0].circleRadius;
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
    } else if (currentBlob && currentBlob.parts.length >= MINIMUM_SHOOT_SIZE) {
        isShooting = true;
        startShooting(mouse.position.x, mouse.position.y);
    }
});

Events.on(mouseConstraint, 'mousemove', (event) => {
    if (isDragging && currentBlob) {
        const { mouse } = event.source;
        const x = mouse.position.x;

        // Prevent floating by only allowing horizontal movement
        const currentY = currentBlob.body.bodies[0].position.y;
        Body.setPosition(currentBlob.body, { x: x, y: currentY });
    }
});

Events.on(mouseConstraint, 'mouseup', () => {
    isDragging = false;
    isShooting = false;
});

canvas.addEventListener('click', (e) => {
    if (!isDragging && currentBlob && currentBlob.parts.length >= MINIMUM_SHOOT_SIZE) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        shootStream(x, y);
    }
});

function isInsideBlob(x, y, blob) {
    const dx = x - blob.body.bodies[0].position.x;
    const dy = y - blob.body.bodies[0].position.y;
    return Math.sqrt(dx * dx + dy * dy) < blob.size;
}

function shootStream(targetX, targetY) {
    if (currentBlob.parts.length <= MINIMUM_ALIVE_SIZE) return;

    const { x, y } = currentBlob.body.bodies[0].position;
    const angle = Math.atan2(targetY - y, targetX - x);

    const streamSize = 2;
    const streamX = x + Math.cos(angle) * currentBlob.size;
    const streamY = y + Math.sin(angle) * currentBlob.size;
    const streamBlob = new Blob(streamX, streamY, streamSize);
    Body.setVelocity(streamBlob.body.bodies[0], {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    });
    blobs.push(streamBlob);

    currentBlob.size -= streamSize;
    for (let i = 0; i < streamSize; i++) {
        Composite.remove(world, currentBlob.parts.pop());
    }

    if (currentBlob.parts.length < MINIMUM_ALIVE_SIZE) {
        alert('Game Over!');
        resetGame();
    }
}

function startShooting(targetX, targetY) {
    const shoot = () => {
        if (isShooting && currentBlob.parts.length >= MINIMUM_SHOOT_SIZE) {
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
    currentBlob = new Blob(100, 100, INITIAL_BLOB_SIZE, true);
    blobs.push(currentBlob);
    Composite.add(world, mouseConstraint);
}

init();
