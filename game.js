const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const shootSound = document.getElementById("shoot-sound");
const explosionSound = document.getElementById("explosion-sound");
const bgm = document.getElementById("bgm");

let keys = {};
let player;
let bullets = [];
let enemies = [];
let enemyBullets = [];
let score = 0;
let lives = 3;
let gameInterval;
let difficultyTimer;
let gameRunning = false;

class Player {
  constructor() {
    this.x = canvas.width / 2 - 20;
    this.y = canvas.height - 60;
    this.width = 40;
    this.height = 40;
    this.speed = 5;
  }
  draw() {
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
  move() {
    if (keys["ArrowLeft"] || keys["q"]) this.x -= this.speed;
    if (keys["ArrowRight"] || keys["d"]) this.x += this.speed;
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
  }
  shoot() {
    bullets.push({ x: this.x + this.width / 2 - 2, y: this.y, w: 4, h: 10 });
    shootSound.currentTime = 0;
    shootSound.play();
  }
}

function createEnemy() {
  const x = Math.random() * (canvas.width - 40);
  enemies.push({ x, y: -40, w: 40, h: 40, speed: 2 + Math.random() * 2 });
}

function enemyShoot(enemy) {
  enemyBullets.push({ x: enemy.x + enemy.w / 2 - 2, y: enemy.y + enemy.h, w: 4, h: 10, speed: 4 });
}

function drawEntities() {
  player.draw();

  bullets.forEach((b, i) => {
    b.y -= 10;
    ctx.fillStyle = "yellow";
    ctx.fillRect(b.x, b.y, b.w, b.h);
    if (b.y < 0) bullets.splice(i, 1);
  });

  enemies.forEach((e, i) => {
    e.y += e.speed;
    ctx.fillStyle = "red";
    ctx.fillRect(e.x, e.y, e.w, e.h);
    if (Math.random() < 0.01) enemyShoot(e);
    if (e.y > canvas.height) enemies.splice(i, 1);
  });

  enemyBullets.forEach((b, i) => {
    b.y += b.speed;
    ctx.fillStyle = "orange";
    ctx.fillRect(b.x, b.y, b.w, b.h);
    if (b.y > canvas.height) enemyBullets.splice(i, 1);
  });
}

function checkCollisions() {
  enemies.forEach((e, ei) => {
    bullets.forEach((b, bi) => {
      if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
        bullets.splice(bi, 1);
        enemies.splice(ei, 1);
        score += 10;
        explosionSound.currentTime = 0;
        explosionSound.play();
      }
    });
    if (e.x < player.x + player.width && e.x + e.w > player.x && e.y < player.y + player.height && e.y + e.h > player.y) {
      enemies.splice(ei, 1);
      loseLife();
    }
  });

  enemyBullets.forEach((b, bi) => {
    if (b.x < player.x + player.width && b.x + b.w > player.x && b.y < player.y + player.height && b.y + b.h > player.y) {
      enemyBullets.splice(bi, 1);
      loseLife();
    }
  });
}

function loseLife() {
  lives--;
  if (lives <= 0) endGame();
}

function updateGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  player.move();
  drawEntities();
  checkCollisions();
  ctx.fillStyle = "white";
  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("Vies: " + lives, 10, 40);
}

function startGame() {
  document.getElementById("start-screen").style.display = "none";
  canvas.style.display = "block";
  bgm.play();
  player = new Player();
  score = 0;
  lives = 3;
  enemies = [];
  bullets = [];
  enemyBullets = [];
  gameRunning = true;
  gameInterval = setInterval(updateGame, 1000 / 60);
  difficultyTimer = setInterval(() => {
    createEnemy();
    enemies.forEach(e => e.speed += 0.2);
  }, 30000);
  setInterval(() => createEnemy(), 1000);
}

function endGame() {
  clearInterval(gameInterval);
  clearInterval(difficultyTimer);
  bgm.pause();
  gameRunning = false;
  document.getElementById("game-over-screen").style.display = "block";
  document.getElementById("final-score").textContent = "Ton score : " + score;
}

window.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key === " " && gameRunning) player.shoot();
});

window.addEventListener("keyup", e => {
  keys[e.key] = false;
});
