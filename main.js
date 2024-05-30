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
const GRAVITY_SCALE = 1;

engine.world.gravity.y = GRAVITY_SCALE;

class Blob {
    constructor(x, y, size, isActive = false) {
        this.size = size;
        this.isActive = isActive;
        this.body = this.createSoftBody(x, y, 5, 5, size / 20, 5, { stiffness: 0.5, damping: 0.1 });
        this.face = '😃';
        Composite.add(world, this.body);
    }

    createSoftBody(x, y, columns, rows, columnGap, rowGap, options) {
        const group = Body.nextGroup(true);
        const softBody = Composite.create({ label: 'Soft Body' });

        const particleOptions = Object.assign({ inertia: Infinity, friction: 0.1, frictionAir: 0.05, collisionFilter: { group: group }, render: { visible: true } }, options);

        const constraintOptions = Object.assign({ stiffness: 0.2, damping: 0.1 }, options);

        let particles = [];

        for (let row = 0; row < rows; row++) {
            for (let column = 0; column < columns; column++) {
                const particle = Bodies.circle(x + column * columnGap, y + row * rowGap, columnGap * 0.5, particleOptions);
                Composite.add(softBody, particle);
                particles.push(particle);

                if (column > 0) {
                    const constraint = Constraint.create(Object.assign({
                        bodyA: particles[particles.length - 2],
                        bodyB: particle,
                        length: columnGap
                    }, constraintOptions));
                    Composite.add(softBody, constraint);
                }

                if (row > 0) {
                    const constraint = Constraint.create(Object.assign({
                        bodyA: particles[column + (row - 1) * columns],
                        bodyB: particle,
                        length: rowGap
                    }, constraintOptions));
                    Composite.add(softBody, constraint);
                }
            }
        }

        softBody.particles = particles;

        return softBody;
    }

    draw() {
        this.body.bodies.forEach(part => {
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
    ctx.fillText(`HP: ${currentBlob.body.bodies.length}`, 20, 30);
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
    const dx = bodyA.bodies[0].position.x - bodyB.bodies[0].position.x;
    const dy = bodyA.bodies[0].position.y - bodyB.bodies[0].position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < bodyA.bodies[0].circleRadius + bodyB.bodies[0].circleRadius;
}

function mergeBlobs(mainBlob, otherBlob) {
    otherBlob.body.bodies.forEach(part => {
        Composite.remove(world, part);
        mainBlob.body.bodies.push(part);
        Composite.add(world, part);
    });
    mainBlob.size += otherBlob.size;
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
    } else if (currentBlob && currentBlob.body.bodies.length >= MINIMUM_SHOOT_SIZE) {
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
        currentBlob.body.bodies.forEach(part => {
            Body.setPosition(part, { x: x, y: currentY });
        });
    }
});

Events.on(mouseConstraint, 'mouseup', () => {
    isDragging = false;
    isShooting = false;
});

canvas.addEventListener('click', (e) => {
    if (!isDragging && currentBlob && currentBlob.body.bodies.length >= MINIMUM_SHOOT_SIZE) {
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
    if (currentBlob.body.bodies.length <= MINIMUM_ALIVE_SIZE) return;

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
        Composite.remove(world, currentBlob.body.bodies.pop());
    }

    if (currentBlob.body.bodies.length < MINIMUM_ALIVE_SIZE) {
        alert('Game Over!');
        resetGame();
    }
}

function startShooting(targetX, targetY) {
    const shoot = () => {
        if (isShooting && currentBlob.body.bodies.length >= MINIMUM_SHOOT_SIZE) {
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
