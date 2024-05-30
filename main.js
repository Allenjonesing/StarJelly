const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let blobs = [];
let currentBlob = null;
let isDragging = false;

class Blob {
    constructor(x, y, size, isActive = false) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.isActive = isActive;
        this.health = size;
        this.face = '😃';
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.isActive ? 'green' : 'blue';
        ctx.fill();
        ctx.closePath();

        ctx.font = '20px Arial';
        ctx.fillStyle = 'black';
        ctx.fillText(this.face, this.x - 10, this.y + 5);
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
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentBlob && isInsideBlob(x, y, currentBlob)) {
        isDragging = true;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging && currentBlob) {
        const rect = canvas.getBoundingClientRect();
        currentBlob.x = e.clientX - rect.left;
        currentBlob.y = e.clientY - rect.top;
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('click', (e) => {
    if (!isDragging && currentBlob) {
        shootStream(e.clientX, e.clientY);
    }
});

function isInsideBlob(x, y, blob) {
    const dx = x - blob.x;
    const dy = y - blob.y;
    return Math.sqrt(dx * dx + dy * dy) < blob.size;
}

function shootStream(targetX, targetY) {
    const dx = targetX - currentBlob.x;
    const dy = targetY - currentBlob.y;
    const angle = Math.atan2(dy, dx);

    const streamSize = 5;
    const streamX = currentBlob.x + Math.cos(angle) * currentBlob.size;
    const streamY = currentBlob.y + Math.sin(angle) * currentBlob.size;
    const streamBlob = new Blob(streamX, streamY, streamSize);
    blobs.push(streamBlob);

    currentBlob.size -= streamSize;
    currentBlob.health -= streamSize;

    if (currentBlob.size < 10) {
        alert('Game Over!');
        resetGame();
    }
}

function resetGame() {
    blobs = [];
    currentBlob = new Blob(100, 100, 20, true);
    blobs.push(currentBlob);
}

init();
