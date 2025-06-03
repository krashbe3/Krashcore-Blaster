const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 480;
canvas.height = 640;

// Sons (tu peux changer les liens si besoin)
const shootSound = new Audio('https://freesound.org/data/previews/341/341695_3248244-lq.mp3');
const explosionSound = new Audio('https://freesound.org/data/previews/256/256113_3263906-lq.mp3');
const enemyShootSound = new Audio('https://freesound.org/data/previews/146/146725_2615117-lq.mp3');

let score = 0;
let bestScore = localStorage.getItem('krashcoreBest') || 0;
let lives = 3;
let gameOver = false;
let enemySpeed = 1;
let difficultyTimer = 0;

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
const enemyBullets = [];
const explosions = [];

function createEnemyWave() {
  enemies.length = 0; // reset
  for (let i = 0; i < 8; i++) {
    enemies.push({
      x: 50 + i * 50,
      y: 0,
      width: 30,
      height: 40,
      speed: enemySpeed
    });
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#000022');
  gradient.addColorStop(1, '#000000');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const e = explosions[i];
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
  if (gameOver) {
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    ctx.font = '16px Arial';
    ctx.fillText('Appuie sur "Commencer" pour rejouer', canvas.width / 2 - 120, canvas.height / 2 + 30);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  player.draw();
  drawExplosions();

  // Mouvements et dessins des balles du joueur
  for (let i = player.bullets.length - 1; i >= 0; i--) {
    const b = player.bullets[i];
    b.y -= 8;
    ctx.fillStyle = 'cyan';
    ctx.fillRect(b.x, b.y, 4, 10);
    if (b.y < 0) player.bullets.splice(i, 1);
  }

  // Mouvements ennemis + tir aléatoire + collision avec bas écran
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.y += e.speed;

    // Tir aléatoire (1 chance sur 100 par frame)
    if (Math.random() < 0.01) {
      enemyBullets.push({ x: e.x, y: e.y + e.height, width: 4, height: 10, speed: 5 });
      enemyShootSound.play();
    }

    if (e.y + e.height >= canvas.height) {
      enemies.splice(i, 1);
      lives--;
      if (lives <= 0) gameOver = true;
    }

    drawEnemy(e);
  }

  // Mouvements et dessin balles ennemies
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.y += b.speed;
    ctx.fillStyle = 'red';
    ctx.fillRect(b.x, b.y, b.width, b.height);
    if (b.y > canvas.height) enemyBullets.splice(i, 1);
  }

  // Collisions balles joueur <-> ennemis
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

  // Collisions balles ennemies <-> joueur
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    if (
      b.x < player.x + player.width / 2 &&
      b.x + b.width > player.x - player.width / 2 &&
      b.y + b.height > player.y &&
      b.y < player.y + player.height
    ) {
      enemyBullets.splice(i, 1);
      lives--;
      if (lives <= 0) gameOver = true;
      explosionSound.play();
    }
  }

  // Augmente la vitesse toutes les 30 secondes (1800 frames environ à 60fps)
  difficultyTimer++;
  if (difficultyTimer > 1800) {
    enemySpeed += 0.5;
    enemies.forEach(e => e.speed = enemySpeed);
    difficultyTimer = 0;
  }

  // Si plus d'ennemis, recrée une vague
  if (enemies.length === 0) {
    createEnemyWave();
  }

  // Affichage HUD
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Best: ${bestScore}`, 10, 40);
  ctx.fillText(`Lives: ${lives}`, 10, 60);

  requestAnimationFrame(updateGame);
}

function keyHandler(e) {
  if (gameOver) return;
  if (e.key === 'ArrowLeft' && player.x - player.width / 2 > 0) player.x -= player.speed;
  if (e.key === 'ArrowRight' && player.x + player.width / 2 < canvas.width) player.x += player.speed;
  if (e.key === ' ' || e.key === 'ArrowUp') {
    shootSound.play();
    player.bullets.push({ x: player.x - 2, y: player.y });
  }
}

document.addEventListener('keydown', keyHandler);

// Fonction pour reset le jeu
function resetGame() {
  score = 0;
  lives = 3;
  gameOver = false;
  enemySpeed = 1;
  difficultyTimer = 0;
  player.bullets = [];
  enemyBullets.length = 0;
  explosions.length = 0;
  createEnemyWave();
  updateGame();
}

// Expose resetGame pour le bouton "Commencer/Recommencer"
window.resetGame = resetGame;
