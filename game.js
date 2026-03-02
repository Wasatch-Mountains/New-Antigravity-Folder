const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const coinsEl = document.getElementById('coins');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('ui-overlay');
const startBtn = document.getElementById('startBtn');
const buyBallBtn = document.getElementById('buyBallBtn');
const buyRadioBtn = document.getElementById('buyRadioBtn');
const buyRocketsBtn = document.getElementById('buyRocketsBtn');
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

function playRadioactiveSound() {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);

    lfo.type = 'square';
    lfo.frequency.setValueAtTime(20, audioCtx.currentTime);
    lfoGain.gain.setValueAtTime(50, audioCtx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    lfo.start();
    osc.start();
    lfo.stop(audioCtx.currentTime + 0.5);
    osc.stop(audioCtx.currentTime + 0.5);
}

function playSparkleSound() {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1500 + Math.random() * 1000, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function playDeathSound() {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
}

function playRocketLaunchSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

function playExplosionSound() {
    if (!audioCtx) return;
    const noise = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.5, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.5);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
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
let radioactiveTimer = 0;
let isRadioactive = false;
let sparkleTimer = 0;
let hasRockets = 0; // Number of launches available
let activeRockets = [];
let steelComboTimestamps = [];
const STEEL_COMBO_WINDOW = 4000; // 4 seconds

function createBall(x, y, dx, dy, docked = false) {
    return {
        x: x || canvas.width / 2,
        y: y || canvas.height - 30,
        dx: dx || 0,
        dy: dy || 0,
        color: '#fff',
        docked: docked
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
            const isSteel = r < 1; // Back row
            bricks[c][r] = {
                x: 0,
                y: 0,
                status: 1,
                color: isSteel ? '#888' : COLORS[r % COLORS.length],
                rotation: 0, // In radians
                type: isSteel ? 'steel' : 'normal',
                hits: isSteel ? (Math.random() < 0.5 ? 2 : 3) : 1,
                maxHits: isSteel ? 0 : 1 // 0 means it hasn't been hit yet for steel calculation
            };
            if (isSteel) bricks[c][r].maxHits = bricks[c][r].hits;
        }
    }
}

// Input Handling
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Right') paddle.isMovingRight = true;
    if (e.key === 'ArrowLeft' || e.key === 'Left') paddle.isMovingLeft = true;
    if (e.key === ' ' && gameState === 'PLAYING') {
        if (hasRockets > 0) launchRockets();
        releaseBalls();
    }
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

canvas.addEventListener('mousedown', (e) => {
    if (gameState === 'PLAYING') {
        if (hasRockets > 0) launchRockets();
        releaseBalls();
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
                    const bw = (canvas.width - BRICK_OFFSET_LEFT * 2) / BRICK_COLS - BRICK_PADDING;
                    const bh = PADDLE_HEIGHT;

                    // Support rotated brick collision
                    let dx = ball.x - (b.x + bw / 2);
                    let dy = ball.y - (b.y + bh / 2);

                    // Inverse rotate ball position relative to brick center
                    let rx = dx * Math.cos(-b.rotation) - dy * Math.sin(-b.rotation);
                    let ry = dx * Math.sin(-b.rotation) + dy * Math.cos(-b.rotation);

                    if (Math.abs(rx) < bw / 2 + BALL_RADIUS && Math.abs(ry) < bh / 2 + BALL_RADIUS) {
                        // Collision! Reflect based on rotation
                        let hitNormalX = 0;
                        let hitNormalY = 0;

                        if (Math.abs(rx) / (bw / 2) > Math.abs(ry) / (bh / 2)) {
                            hitNormalX = Math.sign(rx);
                        } else {
                            hitNormalY = Math.sign(ry);
                        }

                        // Rotate normal back
                        let realNormalX = hitNormalX * Math.cos(b.rotation) - hitNormalY * Math.sin(b.rotation);
                        let realNormalY = hitNormalX * Math.sin(b.rotation) + hitNormalY * Math.cos(b.rotation);

                        // Dot product reflection
                        let dot = ball.dx * realNormalX + ball.dy * realNormalY;
                        ball.dx -= 2 * dot * realNormalX;
                        ball.dy -= 2 * dot * realNormalY;

                        b.hits--;
                        if (b.hits <= 0) {
                            b.status = 0;
                            score += (b.type === 'steel' ? 50 : 10);
                            playBrickSound(b.color);

                            if (b.type === 'steel') {
                                // Steel combo detection
                                const now = Date.now();
                                steelComboTimestamps.push(now);
                                steelComboTimestamps = steelComboTimestamps.filter(t => now - t < STEEL_COMBO_WINDOW);
                                if (steelComboTimestamps.length >= 2) {
                                    spawnCoin(b.x + bw / 2, b.y + bh / 2, 'platinum');
                                    steelComboTimestamps = [];
                                }
                            }
                        } else {
                            playPaddleSound(); // Temporary sound for hit
                        }

                        updateStats();

                        if (isRadioactive && b.status === 0) {
                            destroyNeighbors(c, r);
                        }

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

function destroyNeighbors(c, r) {
    const neighbors = [
        [c - 1, r], [c + 1, r], [c, r - 1], [c, r + 1]
    ];

    neighbors.forEach(([nc, nr]) => {
        if (nc >= 0 && nc < BRICK_COLS && nr >= 0 && nr < BRICK_ROWS) {
            const nb = bricks[nc][nr];
            if (nb.status === 1) {
                nb.hits--;
                if (nb.hits <= 0) {
                    nb.status = 0;
                    score += 5;

                    if (Math.random() < 0.25) {
                        spawnCoin(bx + bw / 2, by + bh / 2, 'radioactive');
                    }
                }

                // Add to fading bricks
                fadingBricks.push({
                    x: bx, y: by, w: bw, h: bh,
                    alpha: 1.0,
                    life: 500 // 0.5s
                });
            }
        }
    });
}

function spawnCoin(x, y, type = 'normal') {
    activeCoins.push({ x, y, dy: COIN_SPEED, type });
}

function updateCoins() {
    for (let i = activeCoins.length - 1; i >= 0; i--) {
        const c = activeCoins[i];
        c.y += c.dy;

        // Paddle collision
        if (c.y + COIN_RADIUS > canvas.height - paddle.height - 10 &&
            c.y - COIN_RADIUS < canvas.height - 10 &&
            c.x > paddle.x && c.x < paddle.x + paddle.width) {

            if (c.type === 'radioactive') {
                coins += 3;
                playSparkleSound();
            } else if (c.type === 'platinum') {
                coins += 10;
                playRadioactiveSound(); // Big sound for big reward
            } else {
                coins++;
            }

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
    buyBallBtn.disabled = coins < 3;
    buyRadioBtn.disabled = coins < 7 || isRadioactive;
    buyRocketsBtn.disabled = coins < 5;
}

// Drawing Functions
function drawBalls() {
    balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = isRadioactive ? '#39ff14' : ball.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = isRadioactive ? '#39ff14' : '#fff';
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;
    });
}

function drawPaddle() {
    ctx.beginPath();

    // Rounded top paddle logic
    const r = 10; // corner radius
    const x = paddle.x;
    const y = canvas.height - paddle.height - 10;
    const w = paddle.width;
    const h = paddle.height;

    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); // top-right
    ctx.arcTo(x + w, y + h, x, y + h, 0); // bottom-right
    ctx.arcTo(x, y + h, x, y, 0);       // bottom-left
    ctx.arcTo(x, y, x + w, y, r);       // top-left
    ctx.closePath();

    ctx.fillStyle = isRadioactive ? '#39ff14' : '#00f2ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = isRadioactive ? '#39ff14' : '#00f2ff';
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
                ctx.save();
                ctx.translate(b.x + bw / 2, b.y + bh / 2);
                ctx.rotate(b.rotation);
                ctx.beginPath();
                ctx.rect(-bw / 2, -bh / 2, bw, bh);

                if (b.type === 'steel') {
                    // Metallic gradient
                    const grad = ctx.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2);
                    grad.addColorStop(0, '#555');
                    grad.addColorStop(0.5, '#AAA');
                    grad.addColorStop(1, '#555');
                    ctx.fillStyle = grad;
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);

                    // Bolted look
                    ctx.fillStyle = '#333';
                    const boltSize = 2;
                    ctx.fillRect(-bw / 2 + 2, -bh / 2 + 2, boltSize, boltSize);
                    ctx.fillRect(bw / 2 - 4, -bh / 2 + 2, boltSize, boltSize);
                    ctx.fillRect(-bw / 2 + 2, bh / 2 - 4, boltSize, boltSize);
                    ctx.fillRect(bw / 2 - 4, bh / 2 - 4, boltSize, boltSize);

                    // Cracks
                    if (b.hits < b.maxHits) {
                        ctx.strokeStyle = '#222';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(10, 5);
                        if (b.hits === 1) {
                            ctx.moveTo(0, 0);
                            ctx.lineTo(-10, -5);
                        }
                        ctx.stroke();
                    }
                } else {
                    ctx.fillStyle = b.color;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = b.color;
                }

                ctx.fill();
                ctx.closePath();
                ctx.shadowBlur = 0;
                ctx.restore();
            }
        }
    }
}

function drawCoins() {
    for (const c of activeCoins) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, COIN_RADIUS, 0, Math.PI * 2);

        const isRadio = c.type === 'radioactive';
        const isPlatinum = c.type === 'platinum';
        const color = isPlatinum ? '#E5E4E2' : (isRadio ? '#39ff14' : '#ffcf00');

        // Glow
        ctx.fillStyle = color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.fill();

        // Symbol
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let symbol = '$';
        if (isRadio) symbol = '€3';
        if (isPlatinum) symbol = '€10';
        ctx.fillText(symbol, c.x, c.y);

        ctx.closePath();

        if ((isRadio || isPlatinum) && Math.random() < 0.1) {
            spawnParticles(c.x, c.y, color, 1);
        }
    }
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        activeParticles.push({
            x, y,
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4,
            size: Math.random() * 3 + 1,
            alpha: 1.0,
            life: 300 + Math.random() * 400,
            color: color
        });
    }
}

function drawRockets() {
    // Fired rockets
    activeRockets.forEach(r => {
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.angle + Math.PI / 2);

        // Body (Triangle)
        ctx.fillStyle = '#ff00ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff5a00';
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(8, 10);
        ctx.lineTo(-8, 10);
        ctx.fill();
        ctx.restore();

        // Thruster
        spawnParticles(r.x, r.y, '#ff5a00', 1);
    });

    // Docked rockets
    if (hasRockets > 0 && gameState === 'PLAYING') {
        const py = canvas.height - paddle.height - 20;
        [paddle.x - 15, paddle.x + paddle.width + 15].forEach(rx => {
            ctx.save();
            ctx.translate(rx, py + Math.sin(Date.now() * 0.01) * 5);
            ctx.fillStyle = '#ff00ff';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ff00ff';
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(5, 7);
            ctx.lineTo(-5, 7);
            ctx.fill();
            ctx.restore();
        });
    }
}

// Game Loop
function update() {
    if (gameState !== 'PLAYING') return;

    if (isRadioactive) {
        radioactiveTimer -= 16.67; // approx (1000/60)

        // Periodic sparkle sound
        sparkleTimer -= 16.67;
        if (sparkleTimer <= 0) {
            playSparkleSound();
            sparkleTimer = 200 + Math.random() * 300;
        }

        if (radioactiveTimer <= 0) {
            isRadioactive = false;
            radioactiveTimer = 0;
            updateStats();
        }
    }

    // Move paddle
    if (paddle.isMovingRight && paddle.x < canvas.width - paddle.width) {
        paddle.x += 7;
    } else if (paddle.isMovingLeft && paddle.x > 0) {
        paddle.x -= 7;
    }

    // Move balls
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];

        if (ball.docked) {
            ball.x = paddle.x + paddle.width / 2;
            ball.y = canvas.height - paddle.height - 25;
            continue;
        }

        ball.x += ball.dx;
        ball.y += ball.dy;

        if (isRadioactive) {
            // Spawn sparkles
            spawnParticles(ball.x, ball.y, '#39ff14', 2);
        }

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
                    playDeathSound();
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

    // Move Rockets
    for (let i = activeRockets.length - 1; i >= 0; i--) {
        const r = activeRockets[i];

        // Find closest target
        let target = null;
        let minDist = Infinity;
        for (let c = 0; c < BRICK_COLS; c++) {
            for (let row = 0; row < BRICK_ROWS; row++) {
                const b = bricks[c][row];
                if (b.status === 1) {
                    const d = Math.hypot(b.x - r.x, b.y - r.y);
                    if (d < minDist) { minDist = d; target = b; }
                }
            }
        }

        if (target) {
            let desiredAngle = Math.atan2(target.y - r.y, target.x - r.x);
            // Erratic whimsical movement
            r.angle += (desiredAngle - r.angle) * 0.1 + (Math.random() - 0.5) * 0.4;
            r.x += Math.cos(r.angle) * r.speed;
            r.y += Math.sin(r.angle) * r.speed;

            // Target hit
            if (minDist < 20) {
                explodeRocket(r.x, r.y);
                activeRockets.splice(i, 1);
            }
        } else {
            // No bricks left, fly away
            r.y -= r.speed;
            if (r.y < 0) activeRockets.splice(i, 1);
        }
    }

    // Update particles
    for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.life -= 16.67;
        p.alpha = p.life / 500;
        if (p.life <= 0) activeParticles.splice(i, 1);
    }

    // Update fading bricks
    for (let i = fadingBricks.length - 1; i >= 0; i--) {
        const fb = fadingBricks[i];
        fb.life -= 16.67;
        fb.alpha = fb.life / 500;
        if (fb.life <= 0) fadingBricks.splice(i, 1);
    }

    updateCoins();
    collisionDetection();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawFadingBricks();
    drawParticles();
    drawRockets();
    drawBalls();
    drawPaddle();
    drawCoins();
}

function drawFadingBricks() {
    fadingBricks.forEach(fb => {
        ctx.beginPath();
        ctx.rect(fb.x, fb.y, fb.w, fb.h);
        ctx.fillStyle = `rgba(57, 255, 20, ${fb.alpha})`;
        ctx.shadowBlur = 10 * fb.alpha;
        ctx.shadowColor = '#39ff14';
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;
    });
}

function drawParticles() {
    activeParticles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color || `rgba(57, 255, 20, ${p.alpha})`;
        ctx.fill();
        ctx.closePath();
    });
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
    balls = [createBall(null, null, null, null, true)];
    paddle.x = (canvas.width - paddle.width) / 2;
    activeCoins = [];
    comboTimestamps = [];
    steelComboTimestamps = [];
}

function releaseBalls() {
    balls.forEach(ball => {
        if (ball.docked) {
            ball.docked = false;
            // Launch in direction based on paddle position
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
            const speed = 5;
            ball.dx = Math.cos(angle) * speed;
            ball.dy = Math.sin(angle) * speed;
        }
    });
}

function buyDoubleBall() {
    if (coins >= 3) {
        coins -= 3;
        updateStats();

        const currentBalls = [...balls];
        currentBalls.forEach(b => {
            if (b.docked) return;
            // Create a new ball at the same position but with a different angle
            const angle = Math.atan2(b.dy, b.dx) + (Math.random() * 0.4 - 0.2);
            const speed = Math.sqrt(b.dx * b.dx + b.dy * b.dy) || 5;
            const newDx = Math.cos(angle) * speed;
            const newDy = Math.sin(angle) * speed;

            balls.push(createBall(b.x, b.y, newDx, newDy));
        });

        playCoinSound();
    }
}

function buyRadioactivity() {
    if (coins >= 7 && !isRadioactive) {
        coins -= 7;
        isRadioactive = true;
        radioactiveTimer = 10000;
        updateStats();
        playRadioactiveSound();
    }
}

function buyRockets() {
    if (coins >= 5) {
        coins -= 5;
        hasRockets++;
        updateStats();
        playCoinSound();
    }
}

function launchRockets() {
    hasRockets--;
    const py = canvas.height - paddle.height - 20;
    activeRockets.push({ x: paddle.x, y: py, angle: -Math.PI / 2, speed: 6 });
    activeRockets.push({ x: paddle.x + paddle.width, y: py, angle: -Math.PI / 2, speed: 6 });
    playRocketLaunchSound();
}

function explodeRocket(ex, ey) {
    playExplosionSound();
    spawnParticles(ex, ey, '#ff5a00', 20);

    const bw = (canvas.width - BRICK_OFFSET_LEFT * 2) / BRICK_COLS - BRICK_PADDING;
    const bh = PADDLE_HEIGHT;

    for (let c = 0; c < BRICK_COLS; c++) {
        for (let r = 0; r < BRICK_ROWS; r++) {
            const b = bricks[c][r];
            if (b.status === 0) continue;

            const dx = (b.x + bw / 2) - ex;
            const dy = (b.y + bh / 2) - ey;
            const dist = Math.hypot(dx, dy);

            if (dist < 60) {
                // Direct Hit
                b.status = 0;
            } else if (dist < 150) {
                // Shockwave - TILT the brick
                b.rotation += (Math.random() - 0.5) * 1.5;
            }
        }
    }
}

buyBallBtn.addEventListener('click', buyDoubleBall);
buyRadioBtn.addEventListener('click', buyRadioactivity);
buyRocketsBtn.addEventListener('click', buyRockets);
startBtn.addEventListener('click', startGame);

// Init
initBricks();
resetBall();
updateStats();
loop();
