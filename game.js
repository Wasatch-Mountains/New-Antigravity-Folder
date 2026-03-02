const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const coinsEl = document.getElementById('coins');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('ui-overlay');
const startBtn = document.getElementById('startBtn');
const buyBallBtn = document.getElementById('buyBallBtn');
const msgTitle = document.getElementById('msg-title');

// Audio Setup
let audioCtx;
const FREQUENCIES = {
    '#ff00ff': 261.63, // C4
    '#00f2ff': 293.66, // D4
    '#39ff14': 329.63, // E4
    '#fff01f': 349.23, // F4
    '#b026ff': 392.00, // G4
    '#ff5a00': 440.00  // A4
};

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playBrickSound(color) {
    if (!audioCtx) return;

    const freq = FREQUENCIES[color] || 440;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square'; // Retro synth sound
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Envelope
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playCoinSound() {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    // Arpeggio effect
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1); // C6

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

function playPaddleSound() {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

// Game Constants
const BALL_RADIUS = 10;
const COIN_RADIUS = 15;
const COIN_SPEED = 3;
const COMBO_WINDOW = 1000; // 1 second
const PADDLE_HEIGHT = 15;
const PADDLE_WIDTH = 120;
const BRICK_ROWS = 6;
const BRICK_COLS = 10;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 50;
const BRICK_OFFSET_LEFT = 35;
const COLORS = ['#ff00ff', '#00f2ff', '#39ff14', '#fff01f', '#b026ff', '#ff5a00'];

// Game State
let score = 0;
let lives = 3;
let coins = 0;
let level = 1;
let gameState = 'START'; // START, PLAYING, GAME_OVER, WIN

let comboTimestamps = [];
let activeCoins = [];
let balls = [];

function createBall(x, y, dx, dy) {
    return {
        x: x || canvas.width / 2,
        y: y || canvas.height - 30,
        dx: dx || 4,
        dy: dy || -4,
        color: '#fff'
    };
}

let paddle = {
    x: (canvas.width - PADDLE_WIDTH) / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    isMovingLeft: false,
    isMovingRight: false
};

let bricks = [];

function initBricks() {
    bricks = [];
    for (let c = 0; c < BRICK_COLS; c++) {
        bricks[c] = [];
        for (let r = 0; r < BRICK_ROWS; r++) {
            bricks[c][r] = {
                x: 0,
                y: 0,
                status: 1,
                color: COLORS[r % COLORS.length]
            };
        }
    }
}

// Input Handling
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Right') paddle.isMovingRight = true;
    if (e.key === 'ArrowLeft' || e.key === 'Left') paddle.isMovingLeft = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Right') paddle.isMovingRight = false;
    if (e.key === 'ArrowLeft' || e.key === 'Left') paddle.isMovingLeft = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
    }
});

// Collision Detection
function collisionDetection() {
    for (let c = 0; c < BRICK_COLS; c++) {
        for (let r = 0; r < BRICK_ROWS; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                const brickX = c * (canvas.width - BRICK_OFFSET_LEFT * 2) / BRICK_COLS + BRICK_OFFSET_LEFT;
                const brickY = r * (PADDLE_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;

                b.x = brickX;
                b.y = brickY;

                const bw = (canvas.width - BRICK_OFFSET_LEFT * 2) / BRICK_COLS - BRICK_PADDING;
                const bh = PADDLE_HEIGHT;

                balls.forEach(ball => {
                    if (ball.x > brickX && ball.x < brickX + bw && ball.y > brickY && ball.y < brickY + bh) {
                        ball.dy = -ball.dy;
                        b.status = 0;
                        score += 10;
                        updateStats();
                        playBrickSound(b.color);

                        // Combo Detection
                        const now = Date.now();
                        comboTimestamps.push(now);
                        // Only keep timestamps within the window
                        comboTimestamps = comboTimestamps.filter(t => now - t < COMBO_WINDOW);

                        if (comboTimestamps.length >= 3) {
                            spawnCoin(brickX + bw / 2, brickY + bh / 2);
                            comboTimestamps = []; // Reset combo after spawn
                        }
                    }
                });

                // Check for win
                if (b.status === 0 && checkAllBricksCleared()) {
                    handleWin();
                }
            }
        }
    }
}

function spawnCoin(x, y) {
    activeCoins.push({ x, y, dy: COIN_SPEED });
}

function updateCoins() {
    for (let i = activeCoins.length - 1; i >= 0; i--) {
        const c = activeCoins[i];
        c.y += c.dy;

        // Paddle collision
        if (c.y + COIN_RADIUS > canvas.height - paddle.height - 10 &&
            c.y - COIN_RADIUS < canvas.height - 10 &&
            c.x > paddle.x && c.x < paddle.x + paddle.width) {
            coins++;
            updateStats();
            playCoinSound();
            activeCoins.splice(i, 1);
            continue;
        }

        // Out of bounds
        if (c.y > canvas.height + COIN_RADIUS) {
            activeCoins.splice(i, 1);
        }
    }
}

function checkAllBricksCleared() {
    for (let c = 0; c < BRICK_COLS; c++) {
        for (let r = 0; r < BRICK_ROWS; r++) {
            if (bricks[c][r].status === 1) return false;
        }
    }
    return true;
}

function updateStats() {
    scoreEl.textContent = score.toString().padStart(4, '0');
    livesEl.textContent = lives;
    coinsEl.textContent = coins;
    levelEl.textContent = level;

    // Shop Logic
    buyBallBtn.disabled = coins < 10;
}

// Drawing Functions
function drawBalls() {
    balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fff';
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;
    });
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, canvas.height - paddle.height - 10, paddle.width, paddle.height);
    ctx.fillStyle = '#00f2ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f2ff';
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

function drawBricks() {
    const bw = (canvas.width - BRICK_OFFSET_LEFT * 2) / BRICK_COLS - BRICK_PADDING;
    const bh = PADDLE_HEIGHT;

    for (let c = 0; c < BRICK_COLS; c++) {
        for (let r = 0; r < BRICK_ROWS; r++) {
            if (bricks[c][r].status === 1) {
                const b = bricks[c][r];
                ctx.beginPath();
                ctx.rect(b.x, b.y, bw, bh);
                ctx.fillStyle = b.color;
                ctx.shadowBlur = 8;
                ctx.shadowColor = b.color;
                ctx.fill();
                ctx.closePath();
                ctx.shadowBlur = 0;
            }
        }
    }
}

function drawCoins() {
    for (const c of activeCoins) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, COIN_RADIUS, 0, Math.PI * 2);

        // Golden Glow
        ctx.fillStyle = '#ffcf00';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffcf00';
        ctx.fill();

        // "$" Symbol
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', c.x, c.y);

        ctx.closePath();
    }
}

// Game Loop
function update() {
    if (gameState !== 'PLAYING') return;

    // Move paddle
    if (paddle.isMovingRight && paddle.x < canvas.width - paddle.width) {
        paddle.x += 7;
    } else if (paddle.isMovingLeft && paddle.x > 0) {
        paddle.x -= 7;
    }

    // Move balls
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall collision (Left/Right)
        if (ball.x + ball.dx > canvas.width - BALL_RADIUS || ball.x + ball.dx < BALL_RADIUS) {
            ball.dx = -ball.dx;
        }

        // Wall collision (Top)
        if (ball.y + ball.dy < BALL_RADIUS) {
            ball.dy = -ball.dy;
        } else if (ball.y + ball.dy > canvas.height - BALL_RADIUS - 10) {
            // Paddle collision
            if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
                ball.dy = -ball.dy;
                playPaddleSound();
                // Add some velocity change based on where it hit the paddle
                let hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
                ball.dx = hitPos * 5;
            } else if (ball.y > canvas.height + BALL_RADIUS) {
                // Out of bounds
                balls.splice(i, 1);

                if (balls.length === 0) {
                    lives--;
                    updateStats();
                    if (!lives) {
                        handleGameOver();
                    } else {
                        resetBall();
                    }
                }
            }
        }
    }

    updateCoins();
    collisionDetection();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBalls();
    drawPaddle();
    drawCoins();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// State Management
function startGame() {
    initAudio();
    gameState = 'PLAYING';
    overlay.classList.remove('active');
    if (lives === 0) {
        score = 0;
        lives = 3;
        level = 1;
        initBricks();
    }
    updateStats();
}

function handleGameOver() {
    gameState = 'GAME_OVER';
    msgTitle.textContent = 'GAME OVER';
    msgTitle.style.color = 'var(--neon-pink)';
    msgTitle.style.textShadow = '0 0 10px var(--neon-pink)';
    startBtn.textContent = 'Retry';
    overlay.classList.add('active');
}

function handleWin() {
    gameState = 'WIN';
    level++;
    msgTitle.textContent = 'LEVEL CLEAR!';
    msgTitle.style.color = 'var(--neon-green)';
    msgTitle.style.textShadow = '0 0 10px var(--neon-green)';
    startBtn.textContent = 'Next Level';
    overlay.classList.add('active');

    resetBall();
    initBricks();
}

function resetBall() {
    balls = [createBall()];
    paddle.x = (canvas.width - paddle.width) / 2;
    activeCoins = [];
    comboTimestamps = [];
}

function buyDoubleBall() {
    if (coins >= 10) {
        coins -= 10;
        updateStats();

        const currentBalls = [...balls];
        currentBalls.forEach(b => {
            // Create a new ball at the same position but with a different angle
            const angle = Math.atan2(b.dy, b.dx) + (Math.random() * 0.4 - 0.2);
            const speed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
            const newDx = Math.cos(angle) * speed;
            const newDy = Math.sin(angle) * speed;

            balls.push(createBall(b.x, b.y, newDx, newDy));
        });

        playCoinSound(); // Re-use coin sound for purchase
    }
}

buyBallBtn.addEventListener('click', buyDoubleBall);
startBtn.addEventListener('click', startGame);

// Init
initBricks();
resetBall();
updateStats();
loop();
