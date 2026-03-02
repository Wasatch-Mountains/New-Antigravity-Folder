const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('ui-overlay');
const startBtn = document.getElementById('startBtn');
const msgTitle = document.getElementById('msg-title');

// Game Constants
const BALL_RADIUS = 10;
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
let level = 1;
let gameState = 'START'; // START, PLAYING, GAME_OVER, WIN

let ball = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    dx: 4,
    dy: -4,
    color: '#fff'
};

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

                if (ball.x > brickX && ball.x < brickX + bw && ball.y > brickY && ball.y < brickY + bh) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;
                    updateStats();

                    // Check for win
                    if (checkAllBricksCleared()) {
                        handleWin();
                    }
                }
            }
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
    levelEl.textContent = level;
}

// Drawing Functions
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fff';
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
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

// Game Loop
function update() {
    if (gameState !== 'PLAYING') return;

    // Move paddle
    if (paddle.isMovingRight && paddle.x < canvas.width - paddle.width) {
        paddle.x += 7;
    } else if (paddle.isMovingLeft && paddle.x > 0) {
        paddle.x -= 7;
    }

    // Move ball
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
            // Add some velocity change based on where it hit the paddle
            let hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
            ball.dx = hitPos * 5;
        } else if (ball.y > canvas.height) {
            // Out of bounds
            lives--;
            updateStats();
            if (!lives) {
                handleGameOver();
            } else {
                resetBall();
            }
        }
    }

    collisionDetection();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// State Management
function startGame() {
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

    // Speed up
    ball.dx *= 1.1;
    ball.dy *= 1.1;

    resetBall();
    initBricks();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 30;
    ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -4;
    paddle.x = (canvas.width - paddle.width) / 2;
}

startBtn.addEventListener('click', startGame);

// Init
initBricks();
updateStats();
loop();
