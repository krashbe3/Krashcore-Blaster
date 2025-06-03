// Krashcore Blaster - version avec triangles stylisés, fond dégradé et ennemis qui descendent

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 480;
canvas.height = 640;

// Sons
const shootSound = new Audio('https://freesound.org/data/previews/341/341695_3248244-lq.mp3');
const explosionSound = new Audio('https://freesound.org/data/previews/256/256113_3263906-lq.mp3');

let score = 0;
let bestScore = localStorage.getItem('krashcoreBest') || 0;
let lives = 3;
let gameOver = false;
let enemySpeed = 1;
let waveTimer = 0;

const player = {
  x: canvas.width / 2,
  y: canvas.height - 60,
  width: 30,
  height: 40,
  speed: 5,
  bullets: [],
  draw() {
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.width / 2, this.y + this.height);
    ctx.lineTo(this.x + this.width / 2, this.y + this.height);
    ctx.closePath();
    ctx.fill();
  }
};

const enemies = [];
const explosions = [];

function createEnemyWave() {
  for (let i = 0; i < 5; i++) {
    enemies.push({
      x: i * 90 + 45,
      y: 20,
      width: 30,
      height: 40,
      dir: 1
    });
  }
}

function drawBackground() {
  // Fond dégradé vertical bleu très foncé à noir
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#000022');
  gradient.addColorStop(1, '#000000');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const e = explosions[i];
    // Effet simple avec un cercle blanc brillant qui diminue
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${e.timer / 10})`;
    ctx.arc(e.x + 20, e.y + 20, 20 - e.timer * 2, 0, 2 * Math.PI);
    ctx.fill();
    e.timer--;
    if (e.timer <= 0) explosions.splice(i, 1);
  }
}

function drawEnemy(e) {
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.moveTo(e.x, e.y + e.height);
  ctx.lineTo(e.x - e.width / 2, e.y);
  ctx.lineTo(e.x + e.width / 2, e.y);
  ctx.closePath();
  ctx.fill();
}

function updateGame() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  player.draw();
  drawExplosions();

  // Bullets
  for (let i = player.bullets.length - 1; i >= 0; i--) {
    const b = player.bullets[i];
    b.y -= 8;
    ctx.fillStyle = 'cyan';
    ctx.fillRect(b.x, b.y, 4, 10);
    if (b.y < 0) player.bullets.splice(i, 1);
  }

  // Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.x += e.dir * enemySpeed;

    // Quand ils touchent les bords, ils changent de direction ET descendent un peu
    if (e.x <= 20 || e.x >= canvas.width - 20) {
      e.dir *= -1;
      e.y += 10; // Descente de 10px à chaque changement de direction
    }

    drawEnemy(e);

    // Vérifie s'ils atteignent la ligne du joueur (bas)
    if (e.y + e.height >= canvas.height) {
      enemies.splice(i, 1);
      lives--;
      if (lives <= 0) gameOver = true;
    }
  }

  // Collisions
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    for (let j = player.bullets.length - 1; j >= 0; j--) {
      const b = player.bullets[j];
      if (
        b.x < e.x + e.width / 2 &&
        b.x + 4 > e.x - e.width / 2 &&
        b.y < e.y + e.height &&
        b.y + 10 > e.y
      ) {
        explosionSound.play();
        explosions.push({ x: e.x - 20, y: e.y, timer: 10 });
        enemies.splice(i, 1);
        player.bullets.splice(j, 1);
        score += 10;
        if (score > bestScore) {
          bestScore = score;
          localStorage.setItem('krashcoreBest', bestScore);
        }
        break;
      }
    }
  }

  // Waves
  waveTimer++;
  if (waveTimer > 180) {
    createEnemyWave();
    enemySpeed += 0.2;
    waveTimer = 0;
  }

  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Best: ${bestScore}`, 10, 40);
  ctx.fillText(`Lives: ${lives}`, 10, 60);

  if (!gameOver) requestAnimationFrame(updateGame);
  else ctx.fillText('Game Over', canvas.width / 2 - 40, canvas.height / 2);
}

function keyHandler(e) {
  if (e.key === 'ArrowLeft' && player.x - player.width / 2 > 0) player.x -= player.speed;
  if (e.key === 'ArrowRight' && player.x + player.width / 2 < canvas.width) player.x += player.speed;
  if (e.key === ' ' || e.key === 'ArrowUp') {
    shootSound.play();
    player.bullets.push({ x: player.x - 2, y: player.y });
  }
}

document.addEventListener('keydown', keyHandler);

// Démarrer le jeu
createEnemyWave();
updateGame();
