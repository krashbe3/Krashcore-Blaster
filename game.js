const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 480;
canvas.height = 640;

// Images (fond basique)
const bgColor = '#000011';

// Sons
const shootSound = new Audio('https://freesound.org/data/previews/341/341695_3248244-lq.mp3');
const explosionSound = new Audio('https://freesound.org/data/previews/256/256113_3263906-lq.mp3');
const enemyShootSound = new Audio('https://freesound.org/data/previews/331/331912_3248244-lq.mp3');

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

// Crée une vague d’ennemis alignés en haut
function createEnemyWave() {
  enemies.length = 0;
  for (let i = 0; i < 8; i++) {
    enemies.push({
      x: 50 + i * 50,
      y: 30,
      width: 30,
      height: 40,
      speed: enemySpeed,
      shootCooldown: 100 + Math.random() * 200, // temps avant tir
    });
  }
}

function drawBackground() {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawExplosion(e) {
  ctx.fillStyle = 'orange';
  ctx.beginPath();
  ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(e) {
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.moveTo(e.x, e.y);
  ctx.lineTo(e.x - e.width / 2, e.y + e.height);
  ctx.lineTo(e.x + e.width / 2, e.y + e.height);
  ctx.closePath();
  ctx.fill();
}

function updateGame() {
  if (gameOver) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    ctx.font = '16px Arial';
    ctx.fillText('Appuie sur "Commencer" pour rejouer', canvas.width / 2 - 120, canvas.height / 2 + 30);
    startScreen.style.display = 'flex';
    canvas.style.display = 'none';
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  player.draw();

  // Tir joueur
  for (let i = player.bullets.length - 1; i >= 0; i--) {
    const b = player.bullets[i];
    b.y -= 8;
    ctx.fillStyle = 'cyan';
    ctx.fillRect(b.x, b.y, 4, 10);
    if (b.y < 0) player.bullets.splice(i, 1);
  }

  // Déplacement ennemis et tirs ennemis
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.y += e.speed * 0.5; // descente ennemis

    // Tir ennemi (tous les shootCooldown frames)
    e.shootCooldown--;
    if (e.shootCooldown <= 0) {
      enemyBullets.push({ x: e.x, y: e.y + e.height, width: 4, height: 10, speed: 5 });
      enemyShootSound.play();
      e.shootCooldown = 100 + Math.random() * 200;
    }

    drawEnemy(e);

    // Si ennemi atteint le bas -> perte d'une vie
    if (e.y + e.height >= canvas.height) {
      enemies.splice(i, 1);
      lives--;
      if (lives <= 0) gameOver = true;
    }
  }

  // Déplacement balles ennemies
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.y += b.speed;
    ctx.fillStyle = 'red';
    ctx.fillRect(b.x, b.y, b.width, b.height);
    if (b.y > canvas.height) enemyBullets.splice(i, 1);
  }

  // Collisions : balles joueur vs ennemis
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
        explosions.push({ x: e.x, y: e.y + e.height / 2, radius: 15, timer: 15 });
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

  // Collisions : balles ennemies vs joueur
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    if (
      b.x < player.x + player.width / 2 &&
      b.x + b.width > player.x - player.width / 2 &&
      b.y + b.height > player.y &&
      b.y < player.y + player.height
    ) {
      explosionSound.play();
      explosions.push({ x: player.x, y: player.y + player.height / 2, radius: 20, timer: 15 });
      enemyBullets.splice(i, 1);
      lives--;
      if (lives <= 0) gameOver = true;
    }
  }

  // Dessiner explosions et réduire leur timer
  for (let i = explosions.length - 1; i >= 0; i--) {
    const e = explosions[i];
    drawExplosion(e);
    e.timer--;
    if (e.timer <= 0) explosions.splice(i, 1);
  }

  // Difficulté progressive : augmentation vitesse ennemis toutes les 30 sec
  difficultyTimer++;
  if (difficultyTimer % (30 * 60) === 0) {
    enemySpeed += 0.3;
    enemies.forEach(e => e.speed = enemySpeed);
  }

  // Affichage scores et vies
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Meilleur: ${bestScore}`, 10, 40);
  ctx.fillText(`Vies: ${lives}`, 10, 60);

  requestAnimationFrame(updateGame);
}

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

  startScreen.style.display = 'none';
  canvas.style.display = 'block';

  updateGame();
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
startBtn.addEventListener('click', resetGame);
