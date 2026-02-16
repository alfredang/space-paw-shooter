const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');

let score = 0;
let lives = 3;
let gameRunning = false;
let gameOver = false;

const player = { x: 180, y: 420, width: 40, height: 40, speed: 5 };
let bullets = [];
let enemies = [];
let stars = [];

const keys = {};

// Sound effects using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        if (type === 'shoot') {
            // Pew pew sound
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'hit') {
            // Explosion sound
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.2);
        } else if (type === 'gameover') {
            // Game over sound
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);
        }
    } catch(e) {
        // Audio not supported
    }
}

// Create stars
for (let i = 0; i < 50; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 2 + 0.5
    });
}

function drawPlayer() {
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.ellipse(player.x + 20, player.y + 25, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(player.x + 8, player.y + 15);
    ctx.lineTo(player.x + 5, player.y);
    ctx.lineTo(player.x + 15, player.y + 12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(player.x + 32, player.y + 15);
    ctx.lineTo(player.x + 35, player.y);
    ctx.lineTo(player.x + 25, player.y + 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x + 12, player.y + 20, 5, 0, Math.PI * 2);
    ctx.arc(player.x + 28, player.y + 20, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.x + 12, player.y + 20, 2, 0, Math.PI * 2);
    ctx.arc(player.x + 28, player.y + 20, 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawBullet(b) {
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 10, 0, Math.PI * 2);
    ctx.fill();
}

function drawEnemy(e) {
    ctx.fillStyle = '#7fff00';
    ctx.beginPath();
    ctx.arc(e.x + 15, e.y + 15, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(e.x + 8, e.y + 12, 5, 0, Math.PI * 2);
    ctx.arc(e.x + 22, e.y + 12, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7fff00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(e.x + 15, e.y - 5);
    ctx.lineTo(e.x + 15, e.y - 15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(e.x + 15, e.y - 18, 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function update() {
    if (!gameRunning || gameOver) return;

    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > canvas.height) s.y = 0;
    });

    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) player.y += player.speed;

    for (let i = bullets.length - 1; i >= 0; i--) {
        let prevY = bullets[i].y;
        bullets[i].y -= 12;
        
        if (bullets[i].y < -10) {
            bullets.splice(i, 1);
            continue;
        }
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            let e = enemies[j];
            let b = bullets[i];
            
            let dx = b.x - (e.x + 15);
            let dy = b.y - (e.y + 15);
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            let prevDy = prevY - (e.y + 15);
            let prevDist = Math.sqrt(dx * dx + prevDy * prevDy);
            
            if (dist < 35 || prevDist < 35) {
                score += 100;
                scoreEl.innerText = 'Score: ' + score;
                playSound('hit');
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                break;
            }
        }
    }

    if (Math.random() < 0.03) {
        enemies.push({ x: Math.random() * 340, y: -30, speed: Math.random() * 2 + 1 });
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemies[i].speed;
        
        // Check collision with player
        let e = enemies[i];
        let px = player.x + 20;
        let py = player.y + 20;
        let dist = Math.sqrt((e.x + 15 - px) ** 2 + (e.y + 15 - py) ** 2);
        
        if (dist < 35) {
            // Player hit!
            lives--;
            livesEl.innerText = '❤️'.repeat(lives);
            playSound('hit');
            enemies.splice(i, 1);
            
            if (lives <= 0) {
                gameOver = true;
                playSound('gameover');
                document.getElementById('instructions').innerText = 'Game Over! Score: ' + score + '. Press Space to restart.';
            }
            continue;
        }
        
        if (enemies[i].y > canvas.height + 30) {
            enemies.splice(i, 1);
        }
    }

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawStars();
    drawPlayer();
    bullets.forEach(drawBullet);
    enemies.forEach(drawEnemy);

    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff0000';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    }
}

document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ' && !gameRunning) {
        gameRunning = true;
        gameOver = false;
        score = 0;
        lives = 3;
        bullets = [];
        enemies = [];
        player.x = 180;
        player.y = 420;
        scoreEl.innerText = 'Score: 0';
        livesEl.innerText = '❤️❤️❤️';
        document.getElementById('instructions').innerText = 'Arrow keys to move, Space to shoot!';
        // Resume audio context (needed for some browsers)
        if (audioCtx.state === 'suspended') audioCtx.resume();
        update();
    }
    if (e.key === ' ' && gameRunning && !gameOver) {
        bullets.push({ x: player.x + 20, y: player.y });
        playSound('shoot');
    }
    if (e.key === ' ' && gameOver) {
        gameRunning = true;
        gameOver = false;
        score = 0;
        lives = 3;
        bullets = [];
        enemies = [];
        player.x = 180;
        player.y = 420;
        scoreEl.innerText = 'Score: 0';
        livesEl.innerText = '❤️❤️❤️';
        document.getElementById('instructions').innerText = 'Arrow keys to move, Space to shoot!';
        if (audioCtx.state === 'suspended') audioCtx.resume();
        update();
    }
});

document.addEventListener('keyup', e => {
    keys[e.key] = false;
});

draw();
