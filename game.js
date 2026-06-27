const home = document.getElementById("home");
const airplanePage = document.getElementById("airplanePage");
const coinBtn = document.getElementById("coinBtn");
const backBtn = document.getElementById("backBtn");
const restartGameBtn = document.getElementById("restartGameBtn");
const airplaneCard = document.querySelector('[data-game="airplane"]');

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  score: document.getElementById("score"),
  best: document.getElementById("best"),
  level: document.getElementById("level"),
  hp: document.getElementById("hp"),
  startOverlay: document.getElementById("startOverlay"),
  gameOverOverlay: document.getElementById("gameOverOverlay"),
  finalScore: document.getElementById("finalScore"),
  startGameBtn: document.getElementById("startGameBtn"),
  retryBtn: document.getElementById("retryBtn"),
};

const W = canvas.width;
const H = canvas.height;

let keys = {};
let running = false;
let paused = false;
let frame = 0;
let score = 0;
let best = Number(localStorage.getItem("go_arcade_airplane_best") || 0);
let player, bullets, enemies, enemyBullets, items, particles, stars;

ui.best.textContent = best;

function showPage(page) {
  home.classList.remove("active");
  airplanePage.classList.remove("active");
  page.classList.add("active");
}

coinBtn.addEventListener("click", () => {
  airplaneCard.focus();
});

airplaneCard.addEventListener("click", () => {
  showPage(airplanePage);
  preview();
});

backBtn.addEventListener("click", () => {
  running = false;
  showPage(home);
});

restartGameBtn.addEventListener("click", startGame);
ui.startGameBtn.addEventListener("click", startGame);
ui.retryBtn.addEventListener("click", startGame);

function makeStars() {
  return Array.from({ length: 76 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    s: Math.random() * 2 + 0.4,
    v: Math.random() * 1.8 + 0.4,
  }));
}

function resetGame() {
  frame = 0;
  score = 0;
  running = true;
  paused = false;

  player = {
    x: W / 2,
    y: H - 86,
    w: 38,
    h: 48,
    speed: 4.2,
    hp: 3,
    level: 1,
    shotDelay: 14,
    lastShot: 0,
    inv: 0,
  };

  bullets = [];
  enemies = [];
  enemyBullets = [];
  items = [];
  particles = [];
  stars = makeStars();

  updateUI();
}

function startGame() {
  ui.startOverlay.classList.add("hidden");
  ui.gameOverOverlay.classList.add("hidden");
  resetGame();
  requestAnimationFrame(loop);
}

function preview() {
  ui.startOverlay.classList.remove("hidden");
  ui.gameOverOverlay.classList.add("hidden");
  player = { x: W / 2, y: H - 86, w: 38, h: 48, hp: 3, level: 1 };
  bullets = [];
  enemies = [];
  enemyBullets = [];
  items = [];
  particles = [];
  stars = makeStars();
  drawBackground();
  drawPlayer();
}

function updateUI() {
  ui.score.textContent = score;
  ui.best.textContent = best;
  ui.level.textContent = player ? player.level : 1;
  ui.hp.textContent = player ? player.hp : 3;
}

function gameOver() {
  running = false;
  if (score > best) {
    best = score;
    localStorage.setItem("go_arcade_airplane_best", String(best));
  }
  ui.finalScore.textContent = `SCORE ${score}`;
  ui.gameOverOverlay.classList.remove("hidden");
  updateUI();
}

function drawPlayer() {
  const { x, y } = player;
  ctx.save();
  ctx.translate(x, y);

  if (player.inv > 0 && frame % 8 < 4) {
    ctx.globalAlpha = 0.45;
  }

  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.beginPath();
  ctx.ellipse(0, 18, 28, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  const grad = ctx.createLinearGradient(-34, 0, 34, 0);
  grad.addColorStop(0, "#2c6bff");
  grad.addColorStop(0.5, "#dce8ff");
  grad.addColorStop(1, "#2c6bff");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(-36, 18);
  ctx.lineTo(-10, 10);
  ctx.lineTo(0, 34);
  ctx.lineTo(10, 10);
  ctx.lineTo(36, 18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#0b1b38";
  ctx.beginPath();
  ctx.ellipse(0, -10, 7, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff8a24";
  ctx.beginPath();
  ctx.moveTo(-13, 26);
  ctx.lineTo(-8, 44);
  ctx.lineTo(-4, 26);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(13, 26);
  ctx.lineTo(8, 44);
  ctx.lineTo(4, 26);
  ctx.fill();

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = e.type === "heavy" ? "#78ff83" : "#ff4a4a";
  ctx.beginPath();
  ctx.moveTo(0, 25);
  ctx.lineTo(-26, -14);
  ctx.lineTo(-8, -5);
  ctx.lineTo(0, -26);
  ctx.lineTo(8, -5);
  ctx.lineTo(26, -14);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#151515";
  ctx.beginPath();
  ctx.ellipse(0, 2, 7, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function shoot() {
  if (frame - player.lastShot < player.shotDelay) return;
  player.lastShot = frame;

  const patterns = [
    [0],
    [-8, 8],
    [-14, 0, 14],
    [-18, -6, 6, 18],
    [-24, -12, 0, 12, 24],
  ];

  patterns[player.level - 1].forEach(dx => {
    bullets.push({
      x: player.x + dx,
      y: player.y - 33,
      vx: dx * 0.025,
      vy: -8,
      r: 4,
      dmg: 1,
    });
  });
}

function spawnEnemy() {
  const heavy = Math.random() < 0.16 + Math.min(score / 10000, 0.14);
  enemies.push({
    x: 34 + Math.random() * (W - 68),
    y: -42,
    w: heavy ? 48 : 38,
    h: heavy ? 54 : 44,
    hp: heavy ? 4 : 2,
    type: heavy ? "heavy" : "normal",
    speed: heavy ? 1.35 : 2.0 + Math.min(score / 6500, 1.3),
    shootTick: frame + Math.floor(Math.random() * 80) + 60,
  });
}

function spawnItem(x, y) {
  const roll = Math.random();
  const type = roll < 0.48 ? "power" : roll < 0.82 ? "speed" : "heal";
  items.push({ x, y, type, r: 12, vy: 2.0 });
}

function hitPointRect(p, r, pad = 0) {
  return (
    p.x > r.x - r.w / 2 - pad &&
    p.x < r.x + r.w / 2 + pad &&
    p.y > r.y - r.h / 2 - pad &&
    p.y < r.y + r.h / 2 + pad
  );
}

function explode(x, y, color = "#ffdf3d") {
  for (let i = 0; i < 14; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = Math.random() * 3 + 1;
    particles.push({
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      life: 28,
      color,
    });
  }
}

function damagePlayer() {
  if (player.inv > 0) return;
  player.hp -= 1;
  player.inv = 90;
  explode(player.x, player.y, "#ff8a24");
}

function update() {
  frame++;
  if (player.inv > 0) player.inv--;

  stars.forEach(s => {
    s.y += s.v;
    if (s.y > H) {
      s.y = -5;
      s.x = Math.random() * W;
    }
  });

  const left = keys.ArrowLeft || keys.a || keys.A;
  const right = keys.ArrowRight || keys.d || keys.D;
  const up = keys.ArrowUp || keys.w || keys.W;
  const down = keys.ArrowDown || keys.s || keys.S;

  if (left) player.x -= player.speed;
  if (right) player.x += player.speed;
  if (up) player.y -= player.speed;
  if (down) player.y += player.speed;

  player.x = Math.max(28, Math.min(W - 28, player.x));
  player.y = Math.max(42, Math.min(H - 42, player.y));

  if (keys[" "] || keys.Spacebar) shoot();

  const interval = Math.max(28, 70 - Math.floor(score / 350));
  if (frame % interval === 0) spawnEnemy();

  bullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
  });
  bullets = bullets.filter(b => b.y > -20);

  enemies.forEach(e => {
    e.y += e.speed;
    if (frame > e.shootTick && e.y > 40) {
      enemyBullets.push({ x: e.x, y: e.y + 22, vy: 3.6, r: 5 });
      e.shootTick = frame + 90 + Math.floor(Math.random() * 70);
    }
  });

  enemyBullets.forEach(b => b.y += b.vy);
  enemyBullets = enemyBullets.filter(b => b.y < H + 20);

  items.forEach(it => it.y += it.vy);
  items = items.filter(it => it.y < H + 30);

  bullets.forEach(b => {
    enemies.forEach(e => {
      if (!b.dead && hitPointRect(b, e, b.r)) {
        b.dead = true;
        e.hp -= b.dmg;
        explode(b.x, b.y, "#7df9ff");
      }
    });
  });
  bullets = bullets.filter(b => !b.dead);

  enemies.forEach(e => {
    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      score += e.type === "heavy" ? 200 : 100;
      explode(e.x, e.y, e.type === "heavy" ? "#78ff83" : "#ff4a4a");
      if (Math.random() < 0.24) spawnItem(e.x, e.y);
    }
  });

  enemies.forEach(e => {
    if (!e.dead &&
      Math.abs(e.x - player.x) < (e.w + player.w) / 2 - 8 &&
      Math.abs(e.y - player.y) < (e.h + player.h) / 2 - 8) {
      e.dead = true;
      damagePlayer();
    }
  });
  enemies = enemies.filter(e => !e.dead && e.y < H + 60);

  enemyBullets.forEach(b => {
    if (!b.dead && Math.hypot(b.x - player.x, b.y - player.y) < 20) {
      b.dead = true;
      damagePlayer();
    }
  });
  enemyBullets = enemyBullets.filter(b => !b.dead);

  items.forEach(it => {
    if (!it.dead && Math.hypot(it.x - player.x, it.y - player.y) < 30) {
      it.dead = true;
      if (it.type === "power") player.level = Math.min(5, player.level + 1);
      if (it.type === "speed") player.shotDelay = Math.max(6, player.shotDelay - 2);
      if (it.type === "heal") player.hp = Math.min(5, player.hp + 1);
      explode(it.x, it.y, it.type === "heal" ? "#78ff83" : "#ffdf3d");
    }
  });
  items = items.filter(it => !it.dead);

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  });
  particles = particles.filter(p => p.life > 0);

  if (player.hp <= 0) gameOver();
  updateUI();
}

function drawBackground() {
  ctx.fillStyle = "#07101f";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(125, 249, 255, 0.75)";
  stars.forEach(s => ctx.fillRect(s.x, s.y, s.s, s.s * 2.5));

  ctx.strokeStyle = "rgba(46,252,255,0.12)";
  for (let y = (frame * 2) % 60; y < H; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function draw() {
  drawBackground();

  bullets.forEach(b => {
    ctx.fillStyle = "#55b7ff";
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 4, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  enemyBullets.forEach(b => {
    ctx.fillStyle = "#ff9b2f";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  });

  items.forEach(it => {
    ctx.fillStyle =
      it.type === "power" ? "#55b7ff" :
      it.type === "speed" ? "#ffdf3d" :
      "#78ff83";
    ctx.beginPath();
    ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#06101f";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(it.type === "power" ? "P" : it.type === "speed" ? "S" : "+", it.x, it.y + 1);
  });

  enemies.forEach(drawEnemy);
  drawPlayer();

  particles.forEach(p => {
    ctx.globalAlpha = Math.max(p.life / 28, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function loop() {
  if (!running) return;
  if (!paused) {
    update();
    draw();
  }
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key === "p" || e.key === "P") paused = !paused;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }
});

window.addEventListener("keyup", e => {
  keys[e.key] = false;
});

preview();
