'use strict';

const DATA = {
  version: '0.7.0',
  offlineRate: 0.4,
  offlineMaxHours: 8,
  overdrive: { maxGauge: 100, drainPerSec: 5, chargePerSec: 3.2, attackSpeed: 1.7, spawnRate: 1.8, reward: 1.5, moveSpeed: 1.15 },
  speedOptions: [1, 2, 3],
  pilotExp: Array.from({ length: 101 }, (_, i) => i === 0 ? 0 : Math.floor(80 * Math.pow(i, 1.42) + i * 24)),
  aircraft: [
    { id: 'falcon', name: 'Falcon', title: '정통 강습기', base: 'straight', pool: ['straight', 'homing', 'laser', 'chain', 'shield'], cost: 0, difficulty: '★', theme: 'blue' },
    { id: 'hawk', name: 'Hawk', title: '고속 추적기', base: 'homing', pool: ['homing', 'straight', 'laser', 'chain', 'shield'], cost: 5000, difficulty: '★★', theme: 'red' }
  ],
  weapons: {
    straight: { name: '직선 미사일', desc: '정면 탄막. Lv5는 7발 확산.' },
    homing: { name: '유도 미사일', desc: '가까운 적을 추적합니다.' },
    laser: { name: '레이저', desc: '전방 관통 지속 피해.' },
    chain: { name: '체인', desc: '명중 지점에서 전격 전이.' },
    shield: { name: '실드', desc: '탄 제거와 근접 보호.' }
  },
  evolutions: {
    'homing+straight': '더블 호밍 캐논',
    'laser+straight': '레일 캐논',
    'chain+straight': '스파크 캐논',
    'shield+straight': '가드 캐논',
    'homing+laser': '호밍 레이저',
    'chain+homing': '썬더 미사일',
    'homing+shield': '가디언 드론',
    'chain+laser': '썬더 레이저',
    'laser+shield': '프리즘 실드',
    'chain+shield': '전기 실드'
  },
  research: [
    { id: 'goldGain', name: 'Gold Mining', desc: '골드 획득 +2%', max: 20, cost: 20, step: 0.02 },
    { id: 'offlineGain', name: 'Offline Mining', desc: '오프라인 보상 +3%', max: 20, cost: 20, step: 0.03 },
    { id: 'autoFire', name: 'Auto Fire', desc: 'AUTO 공격속도 +2%', max: 20, cost: 25, step: 0.02 },
    { id: 'odCharge', name: 'OD Charge', desc: 'OVER DRIVE 충전속도 +3%', max: 20, cost: 25, step: 0.03 },
    { id: 'odOutput', name: 'OD Output', desc: 'OVER DRIVE 공격력 +5%', max: 20, cost: 30, step: 0.05 },
    { id: 'pilotAtk', name: 'Pilot ATK', desc: '공격력 +2%', max: 20, cost: 30, step: 0.02 },
    { id: 'pilotHp', name: 'Pilot HP', desc: 'HP +2%', max: 20, cost: 25, step: 0.02 },
    { id: 'expGain', name: 'EXP Gain', desc: '경험치 +3%', max: 20, cost: 20, step: 0.03 }
  ],
  daily: [
    { id: 'kill300', name: '적 300기 처치', goal: 300, type: 'kills', gold: 800, rp: 15 },
    { id: 'boss3', name: '보스 3회 처치', goal: 3, type: 'boss', gold: 1500, rp: 25 },
    { id: 'od5', name: 'OVER DRIVE 5회 사용', goal: 5, type: 'od', gold: 1000, rp: 20 },
    { id: 'auto30', name: 'AUTO 30분 플레이', goal: 1800, type: 'autoTime', gold: 1200, rp: 20 },
    { id: 'research1', name: '연구소 연구 1회', goal: 1, type: 'research', gold: 1000, rp: 30 }
  ],
  enemyTypes: [
    { id: 'scout', hp: 30, speed: 95, gold: 5, exp: 9, asset: 'assets/enemies/enemy_scout.svg' },
    { id: 'fast', hp: 22, speed: 145, gold: 6, exp: 11, asset: 'assets/enemies/enemy_fast.svg' },
    { id: 'bomber', hp: 88, speed: 62, gold: 15, exp: 24, asset: 'assets/enemies/enemy_bomber.svg' },
    { id: 'suicide', hp: 45, speed: 132, gold: 10, exp: 16, asset: 'assets/enemies/enemy_suicide.svg' },
    { id: 'elite', hp: 260, speed: 55, gold: 45, exp: 70, asset: 'assets/enemies/enemy_elite.svg' }
  ],
  boss: { id: 'boss', hp: 760, speed: 40, gold: 180, exp: 100, asset: 'assets/enemies/enemy_boss.svg' }
};

const SAVE_KEY = 'go_air_raid_v07_assets';
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let state = loadState();
let game = null;
let pendingOffline = null;
let levelTimer = null;
let levelSeconds = 5;
let lastFrame = performance.now();
const pointer = { active: false, x: 0, y: 0 };
const images = new Map();

function defaultState() {
  return {
    gold: 6000,
    rp: 80,
    pilotLevel: 1,
    pilotExp: 0,
    selected: 'falcon',
    owned: { falcon: true },
    mastery: { falcon: { lv: 1, exp: 0 } },
    research: {},
    dailyDate: '',
    daily: {},
    speed: 1,
    lastSeen: Date.now()
  };
}

function loadState() {
  try { return { ...defaultState(), ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; }
  catch { return defaultState(); }
}
function save() { state.lastSeen = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
function fmt(n) { return Math.floor(Number(n) || 0).toLocaleString('ko-KR'); }
function todayKey() { return new Date().toISOString().slice(0, 10); }
function acById(id) { return DATA.aircraft.find(a => a.id === id) || DATA.aircraft[0]; }
function weaponName(id) { return DATA.weapons[id]?.name || id; }
function mult(id) { const r = DATA.research.find(x => x.id === id); const lv = state.research[id] || 0; return 1 + (r ? r.step * lv : 0); }
function assetShip(id, level = 5) { return `assets/aircraft/${id}_lv${level}.svg`; }
function img(path) { return images.get(path); }

function preloadAssets() {
  const paths = [];
  DATA.aircraft.forEach(a => { for (let i = 1; i <= 5; i++) paths.push(assetShip(a.id, i)); paths.push(`assets/aircraft/${a.id}_icon.svg`); });
  DATA.enemyTypes.forEach(e => paths.push(e.asset)); paths.push(DATA.boss.asset);
  return Promise.all(paths.map(path => new Promise(resolve => {
    const im = new Image(); im.onload = () => { images.set(path, im); resolve(); }; im.onerror = resolve; im.src = path;
  })));
}

function resize() { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; }
window.addEventListener('resize', resize); resize();

function showToast(text) {
  const t = document.getElementById('toast');
  t.textContent = text; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1400);
}

function initDaily() {
  const key = todayKey();
  if (state.dailyDate !== key) { state.dailyDate = key; state.daily = {}; save(); }
}
function dailyProgress(type) {
  return Object.values(state.daily).filter(v => v.type === type).reduce((a, v) => a + (v.progress || 0), 0);
}
function addDaily(type, amount) {
  initDaily();
  DATA.daily.forEach(m => {
    if (m.type !== type) return;
    const item = state.daily[m.id] || { type: m.type, progress: 0, claimed: false };
    item.progress = Math.min(m.goal, (item.progress || 0) + amount);
    state.daily[m.id] = item;
  });
}
function claimDaily(id) {
  initDaily();
  const mission = DATA.daily.find(m => m.id === id);
  if (!mission) return;
  const item = state.daily[id] || { type: mission.type, progress: 0, claimed: false };
  if (item.claimed || item.progress < mission.goal) { showToast('아직 수령할 수 없습니다.'); return; }
  state.gold += mission.gold;
  state.rp += mission.rp;
  item.claimed = true;
  state.daily[id] = item;
  save();
  renderLobby();
  showToast(`미션 보상 획득 +${mission.gold}G / +${mission.rp}RP`);
}
window.claimDaily = claimDaily;

function checkOffline() {
  const diffSec = Math.max(0, (Date.now() - (state.lastSeen || Date.now())) / 1000);
  const capped = Math.min(diffSec, DATA.offlineMaxHours * 3600);
  if (capped < 60) return;
  const goldPerMin = 34 * mult('goldGain') * mult('offlineGain');
  const expPerMin = 7 * mult('expGain');
  pendingOffline = {
    gold: Math.floor(goldPerMin * (capped / 60) * DATA.offlineRate),
    exp: Math.floor(expPerMin * (capped / 60) * DATA.offlineRate)
  };
  document.getElementById('offlinePanel').classList.remove('hidden');
  document.getElementById('offlineGold').textContent = fmt(pendingOffline.gold);
  document.getElementById('offlineExp').textContent = fmt(pendingOffline.exp);
}
function claimOffline() {
  if (!pendingOffline) return;
  state.gold += pendingOffline.gold;
  state.pilotExp += pendingOffline.exp;
  levelPilot(); pendingOffline = null;
  document.getElementById('offlinePanel').classList.add('hidden');
  save(); renderLobby(); showToast('오프라인 보상 획득');
}

function levelPilot() {
  while (state.pilotLevel < DATA.pilotExp.length - 1 && state.pilotExp >= DATA.pilotExp[state.pilotLevel]) {
    state.pilotExp -= DATA.pilotExp[state.pilotLevel]; state.pilotLevel++;
  }
}

function renderLobby() {
  initDaily();
  document.getElementById('goldText').textContent = fmt(state.gold);
  document.getElementById('rpText').textContent = fmt(state.rp);
  document.getElementById('pilotLv').textContent = state.pilotLevel;
  document.getElementById('pilotExp').textContent = fmt(state.pilotExp) + ' / ' + fmt(DATA.pilotExp[state.pilotLevel] || 0);
  const ac = acById(state.selected);
  document.getElementById('selectedName').textContent = ac.name.toUpperCase();
  document.getElementById('selectedDesc').textContent = ac.title + ' / ' + ac.difficulty;
  document.getElementById('baseWeaponText').textContent = weaponName(ac.base);
  document.getElementById('selectedAircraftImg').src = assetShip(ac.id, 5);

  const acList = document.getElementById('aircraftList');
  acList.innerHTML = '';
  DATA.aircraft.forEach(a => {
    const owned = !!state.owned[a.id];
    const selected = state.selected === a.id;
    const div = document.createElement('div');
    div.className = 'aircraft-card ' + (selected ? 'selected ' : '') + (!owned ? 'locked' : '');
    div.innerHTML = `<img src="${assetShip(a.id, 5)}" alt="${a.name}"><h3>${a.name}</h3><p>${a.title}<br>기본 무기: ${weaponName(a.base)}</p><p>${a.difficulty}</p>`;
    const btn = document.createElement('button');
    if (owned) { btn.textContent = selected ? '선택 중' : '선택'; btn.disabled = selected; btn.onclick = () => { state.selected = a.id; save(); renderLobby(); }; }
    else { btn.textContent = `${fmt(a.cost)} G 구매`; btn.className = 'buy'; btn.onclick = () => buyAircraft(a.id); }
    div.appendChild(btn); acList.appendChild(div);
  });

  const daily = document.getElementById('dailyList');
  daily.innerHTML = '';
  DATA.daily.forEach(m => {
    const it = state.daily[m.id] || { type: m.type, progress: 0, claimed: false };
    const done = it.progress >= m.goal;
    const div = document.createElement('div'); div.className = 'mission ' + (done ? 'done' : '');
    div.innerHTML = `<div><b>${m.name}</b><p>${fmt(Math.min(it.progress, m.goal))} / ${fmt(m.goal)} · 보상 ${fmt(m.gold)}G / ${m.rp}RP</p></div>`;
    const btn = document.createElement('button'); btn.textContent = it.claimed ? '수령 완료' : '수령'; btn.disabled = it.claimed || !done; btn.onclick = () => claimDaily(m.id);
    div.appendChild(btn); daily.appendChild(div);
  });

  const research = document.getElementById('researchList');
  research.innerHTML = '';
  DATA.research.forEach(r => {
    const lv = state.research[r.id] || 0; const cost = Math.floor(r.cost * Math.pow(1.22, lv));
    const div = document.createElement('div'); div.className = 'research';
    div.innerHTML = `<div><b>${r.name} Lv.${lv}/${r.max}</b><p>${r.desc} · 비용 ${cost} RP</p></div>`;
    const btn = document.createElement('button'); btn.textContent = '연구'; btn.disabled = lv >= r.max || state.rp < cost; btn.onclick = () => buyResearch(r.id);
    div.appendChild(btn); research.appendChild(div);
  });
  save();
}

function buyAircraft(id) {
  const ac = acById(id);
  if (state.owned[id]) return;
  if (state.gold < ac.cost) { showToast('골드가 부족합니다.'); return; }
  state.gold -= ac.cost; state.owned[id] = true; state.selected = id;
  if (!state.mastery[id]) state.mastery[id] = { lv: 1, exp: 0 };
  save(); renderLobby(); showToast(`${ac.name} 구매 완료`);
}
function buyResearch(id) {
  const r = DATA.research.find(x => x.id === id); if (!r) return;
  const lv = state.research[id] || 0; const cost = Math.floor(r.cost * Math.pow(1.22, lv));
  if (lv >= r.max || state.rp < cost) return;
  state.rp -= cost; state.research[id] = lv + 1; addDaily('research', 1);
  save(); renderLobby(); showToast(`${r.name} 연구 완료`);
}

function setTab(tabId) {
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-page').forEach(p => p.classList.toggle('active', p.id === tabId));
}
document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => setTab(btn.dataset.tab)));
document.getElementById('claimOfflineBtn').addEventListener('click', claimOffline);
document.getElementById('startRunBtn').addEventListener('click', startRun);
document.getElementById('endRunBtn').addEventListener('click', endRun);
document.getElementById('odBtn').addEventListener('click', toggleOverdrive);
document.getElementById('closeResultBtn').addEventListener('click', closeResult);
document.querySelectorAll('#speedPanel button').forEach(btn => btn.addEventListener('click', () => setSpeed(Number(btn.dataset.speed))));

function setSpeed(speed) {
  state.speed = speed;
  document.querySelectorAll('#speedPanel button').forEach(b => b.classList.toggle('active', Number(b.dataset.speed) === speed));
  save(); showToast(`배속 x${speed}`);
}

function startRun() {
  const ac = acById(state.selected);
  game = {
    ac,
    mode: 'auto',
    stage: 1, kills: 0, need: 18,
    level: 1, xp: 0, nextXp: 80,
    gold: 0, exp: 0, boss: 0, odUses: 0, autoTime: 0,
    hp: 1000 * mult('pilotHp'), maxHp: 1000 * mult('pilotHp'), od: 50,
    lastShot: 0, lastSpawn: 0, time: 0,
    weapons: { [ac.base]: 1 }, evolutions: {},
    player: { x: canvas.width / 2, y: canvas.height * 0.73, tx: canvas.width / 2, ty: canvas.height * 0.73 },
    bullets: [], enemies: [], particles: [], floats: []
  };
  document.getElementById('lobby').classList.remove('active');
  ['hud', 'weaponStatus', 'gameControls', 'speedPanel'].forEach(id => document.getElementById(id).classList.remove('hidden'));
  setSpeed(state.speed || 1);
  lastFrame = performance.now();
  requestAnimationFrame(loop);
}

function endRun() {
  if (!game) return;
  state.gold += Math.floor(game.gold);
  state.pilotExp += Math.floor(game.exp);
  levelPilot();
  const acId = game.ac.id;
  if (!state.mastery[acId]) state.mastery[acId] = { lv: 1, exp: 0 };
  state.mastery[acId].exp += Math.floor(game.kills * 0.2 + game.boss * 5 + game.autoTime / 120);
  save();
  document.getElementById('resultText').innerHTML = `<p>Gold +${fmt(game.gold)}<br>Pilot EXP +${fmt(game.exp)}<br>Boss ${game.boss}회 / Kill ${game.kills}</p>`;
  document.getElementById('resultModal').classList.add('active');
  game = null;
  ['hud', 'weaponStatus', 'gameControls', 'speedPanel'].forEach(id => document.getElementById(id).classList.add('hidden'));
}
function closeResult() { document.getElementById('resultModal').classList.remove('active'); document.getElementById('lobby').classList.add('active'); renderLobby(); }

function toggleOverdrive() {
  if (!game) return;
  if (game.mode === 'od') { game.mode = 'auto'; return; }
  if (game.od >= 100) { game.mode = 'od'; game.odUses++; addDaily('od', 1); showToast('OVER DRIVE!'); }
}

function spawnEnemy() {
  const isBoss = game.stage % 5 === 0 && game.kills >= game.need - 1 && !game.enemies.some(e => e.boss);
  let data;
  if (isBoss) data = DATA.boss;
  else {
    const roll = Math.random();
    data = roll > 0.92 ? DATA.enemyTypes[4] : roll > 0.78 ? DATA.enemyTypes[2] : roll > 0.62 ? DATA.enemyTypes[1] : roll > 0.50 ? DATA.enemyTypes[3] : DATA.enemyTypes[0];
  }
  const hp = data.hp + game.stage * (isBoss ? 120 : 8);
  game.enemies.push({
    data, boss: isBoss, x: isBoss ? canvas.width / 2 : 40 + Math.random() * (canvas.width - 80), y: isBoss ? -120 : -50,
    w: isBoss ? 130 : (data.id === 'bomber' || data.id === 'elite' ? 58 : 42), h: isBoss ? 130 : 48,
    hp, maxHp: hp, vy: data.speed, vx: (Math.random() - 0.5) * 30, asset: data.asset
  });
}

function fireWeapon() {
  const od = game.mode === 'od';
  const atk = 16 * mult('pilotAtk') * (od ? DATA.overdrive.attackSpeed * mult('odOutput') : 1);
  const rate = 0.28 / (mult('autoFire') * (od ? DATA.overdrive.attackSpeed : 1));
  if (game.time - game.lastShot < rate) return;
  game.lastShot = game.time;
  const p = game.player, w = game.weapons;
  if (w.straight) {
    const patterns = { 1: [0], 2: [-4, 4], 3: [-5, 5, -15, 15], 4: [-8, 0, 8, -15, 15], 5: [-9, 0, 9, -15, 15, -45, 45] }[w.straight] || [0];
    patterns.forEach(a => { const rad = a * Math.PI / 180; game.bullets.push({ x: p.x, y: p.y - 42, vx: Math.sin(rad) * 300, vy: -Math.cos(rad) * 470, dmg: atk, type: 'straight' }); });
  }
  if (w.homing) game.bullets.push({ x: p.x, y: p.y - 25, vx: 0, vy: -290, dmg: atk * 0.95, type: 'homing' });
  if (w.laser) game.bullets.push({ x: p.x, y: p.y - 55, dmg: atk * 0.36, type: 'laser', life: 0.12, width: 12 + w.laser * 4 });
  if (w.shield) for (let i = 0; i < w.shield; i++) { const a = game.time * 4 + i * Math.PI * 2 / w.shield; game.particles.push({ x: p.x + Math.cos(a) * 58, y: p.y + Math.sin(a) * 58, r: 15, life: 0.14, shield: true, c: '#3867d6', dmg: atk * 0.5 }); }
}

function update(dt) {
  if (!game) return;
  const speed = state.speed || 1;
  dt *= speed;
  game.time += dt;
  const od = game.mode === 'od';
  if (od) { game.od -= DATA.overdrive.drainPerSec * dt; if (game.od <= 0) { game.od = 0; game.mode = 'auto'; } }
  else { game.od = Math.min(100, game.od + DATA.overdrive.chargePerSec * mult('odCharge') * dt); game.autoTime += dt; addDaily('autoTime', dt); }

  const p = game.player;
  if (od && pointer.active) { p.x += (p.tx - p.x) * Math.min(1, 8 * dt); p.y += (p.ty - p.y) * Math.min(1, 8 * dt); }
  else {
    const target = nearestEnemy(p.x, p.y);
    if (target) { p.x += (target.x - p.x) * Math.min(1, 1.4 * dt); p.y += (canvas.height * 0.72 - p.y) * Math.min(1, 1.2 * dt); }
    else { p.x += (canvas.width / 2 - p.x) * Math.min(1, 0.7 * dt); }
  }
  p.x = Math.max(36, Math.min(canvas.width - 36, p.x)); p.y = Math.max(110, Math.min(canvas.height - 78, p.y));

  const spawnInterval = od ? 0.52 / DATA.overdrive.spawnRate : 0.78;
  if (game.time - game.lastSpawn > spawnInterval) { spawnEnemy(); game.lastSpawn = game.time; }
  fireWeapon();

  game.bullets.forEach(b => {
    if (b.type === 'homing') { const e = nearestEnemy(b.x, b.y); if (e) { b.vx += (e.x - b.x) * 3.2 * dt; b.vy += (e.y - b.y) * 3.2 * dt; } }
    if (b.type !== 'laser') { b.x += b.vx * dt; b.y += b.vy * dt; } else b.life -= dt;
  });
  game.bullets = game.bullets.filter(b => b.x > -80 && b.x < canvas.width + 80 && b.y > -120 && b.y < canvas.height + 120 && b.life !== 0);

  game.enemies.forEach(e => {
    if (e.boss && e.y < 135) e.y += e.vy * dt;
    else { e.y += e.vy * dt; e.x += (e.boss ? Math.sin(game.time * 2) * 35 : e.vx) * dt; }
  });

  handleHits();
  game.particles.forEach(p => p.life -= dt); game.particles = game.particles.filter(p => p.life > 0);
  game.floats.forEach(f => { f.y -= 35 * dt; f.life -= dt; }); game.floats = game.floats.filter(f => f.life > 0);
  if (game.hp <= 0) endRun();
}

function nearestEnemy(x, y) {
  if (!game || !game.enemies.length) return null;
  return game.enemies.reduce((a, c) => Math.hypot(c.x - x, c.y - y) < Math.hypot(a.x - x, a.y - y) ? c : a, game.enemies[0]);
}

function handleHits() {
  game.bullets.forEach(b => {
    game.enemies.forEach(e => {
      let hit = false;
      if (b.type === 'laser') hit = Math.abs(e.x - b.x) < e.w / 2 + b.width && e.y < game.player.y;
      else hit = Math.hypot(e.x - b.x, e.y - b.y) < e.w / 2 + 9;
      if (hit && !b.dead) {
        e.hp -= b.dmg;
        if (b.type !== 'laser') b.dead = true;
        if (game.weapons.chain && Math.random() < 0.2 + game.weapons.chain * 0.03) {
          game.enemies.filter(o => o !== e && Math.hypot(o.x - e.x, o.y - e.y) < 170).slice(0, game.weapons.chain).forEach(o => { o.hp -= b.dmg * 0.65; game.particles.push({ x1: e.x, y1: e.y, x2: o.x, y2: o.y, life: 0.18, chain: true }); });
        }
      }
    });
  });
  game.bullets = game.bullets.filter(b => !b.dead);

  for (let i = game.enemies.length - 1; i >= 0; i--) {
    const e = game.enemies[i];
    if (e.hp <= 0) {
      const od = game.mode === 'od';
      const g = e.data.gold * mult('goldGain') * (od ? DATA.overdrive.reward : 1);
      const xp = e.data.exp * mult('expGain') * (od ? DATA.overdrive.reward : 1);
      game.gold += g; game.exp += xp; game.xp += xp; game.kills++;
      if (e.boss) { game.boss++; addDaily('boss', 1); }
      addDaily('kills', 1);
      floatText(e.x, e.y, `+${fmt(g)}G +${fmt(xp)}EXP`);
      explode(e.x, e.y, e.boss ? '#ffd32a' : '#ff7a1a', e.boss ? 26 : 10);
      game.enemies.splice(i, 1);
      if (game.kills >= game.need) { game.stage++; game.kills = 0; game.need = Math.floor(game.need * 1.22) + 3; }
    } else if (e.y > canvas.height + 90) { game.hp -= e.boss ? 25 : 7; game.enemies.splice(i, 1); }
    else if (Math.hypot(e.x - game.player.x, e.y - game.player.y) < (e.w / 2 + 26)) { game.hp -= e.boss ? 36 : 13; game.enemies.splice(i, 1); explode(game.player.x, game.player.y, '#ff4757', 8); }
  }
  if (game.xp >= game.nextXp) { game.xp -= game.nextXp; game.nextXp = Math.floor(game.nextXp * 1.22); game.level++; openLevel(); }
}

function explode(x, y, color, count) { for (let i = 0; i < count; i++) game.particles.push({ x, y, vx: (Math.random() - 0.5) * 190, vy: (Math.random() - 0.5) * 190, r: Math.random() * 4 + 2, life: 0.35, c: color }); }
function floatText(x, y, text) { game.floats.push({ x, y, text, life: 0.8 }); }

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#06101f'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(125,249,255,.55)';
  for (let i = 0; i < 90; i++) { const y = (i * 97 + performance.now() / 30 * (state.speed || 1)) % canvas.height; ctx.fillRect((i * 53) % canvas.width, y, 2, 5); }
  if (!game) return;
  game.enemies.forEach(e => { const im = img(e.asset); if (im) ctx.drawImage(im, e.x - e.w / 2, e.y - e.h / 2, e.w, e.h); if (e.boss) { ctx.fillStyle = '#ff4757'; ctx.fillRect(44, 76, (canvas.width - 88) * Math.max(0, e.hp / e.maxHp), 8); } });
  game.bullets.forEach(b => { if (b.type === 'laser') { ctx.strokeStyle = game.evolutions['chain+laser'] ? '#ffd32a' : '#00ffcc'; ctx.lineWidth = b.width; ctx.shadowBlur = 18; ctx.shadowColor = ctx.strokeStyle; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x, 0); ctx.stroke(); ctx.shadowBlur = 0; } else { ctx.fillStyle = b.type === 'homing' ? '#ffd32a' : '#55b7ff'; ctx.beginPath(); ctx.ellipse(b.x, b.y, 5, 13, 0, 0, Math.PI * 2); ctx.fill(); } });
  game.particles.forEach(p => { if (p.chain) { ctx.strokeStyle = 'rgba(255,211,42,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x1, p.y1); ctx.lineTo(p.x2, p.y2); ctx.stroke(); } else { ctx.globalAlpha = Math.max(0, p.life / 0.35); ctx.fillStyle = p.c || '#ffdf3d'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r || 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; } });
  game.floats.forEach(f => { ctx.globalAlpha = Math.max(0, f.life / 0.8); ctx.fillStyle = '#ffd32a'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.fillText(f.text, f.x, f.y); ctx.globalAlpha = 1; });
  const level = Math.min(5, Math.max(1, Math.max(...Object.values(game.weapons))));
  const ship = img(assetShip(game.ac.id, level));
  const p = game.player; if (ship) { ctx.save(); if (game.mode === 'od') { ctx.shadowBlur = 26; ctx.shadowColor = game.ac.theme === 'red' ? '#ff4757' : '#00ffcc'; } ctx.drawImage(ship, p.x - 54, p.y - 70, 108, 132); ctx.restore(); }
}

function renderHud() {
  if (!game) return;
  document.getElementById('stageText').textContent = `STAGE ${game.stage}  ${game.kills}/${game.need}`;
  document.getElementById('modeText').textContent = game.mode === 'od' ? `OVER DRIVE x${state.speed}` : `AUTO x${state.speed}`;
  document.getElementById('runGold').textContent = fmt(game.gold);
  document.getElementById('hpFill').style.width = Math.max(0, game.hp / game.maxHp * 100) + '%';
  document.getElementById('xpFill').style.width = Math.min(100, game.xp / game.nextXp * 100) + '%';
  document.getElementById('odFill').style.width = Math.min(100, game.od) + '%';
  document.getElementById('stageFill').style.width = Math.min(100, game.kills / game.need * 100) + '%';
  const odBtn = document.getElementById('odBtn');
  odBtn.disabled = game.mode !== 'od' && game.od < 100;
  odBtn.className = 'od-btn ' + (game.mode === 'od' ? 'active' : '');
  odBtn.textContent = game.mode === 'od' ? `OVER DRIVE ${Math.floor(game.od)}%` : (game.od >= 100 ? 'OVER DRIVE READY' : `CHARGING ${Math.floor(game.od)}%`);
  let html = '';
  Object.keys(game.weapons).forEach(k => html += `<div><span>${weaponName(k)}</span><b>Lv.${game.weapons[k]}</b></div>`);
  Object.values(game.evolutions).forEach(n => html += `<div><span style="color:#ffd32a">${n}</span><b>진화</b></div>`);
  document.getElementById('weaponStatus').innerHTML = html;
}

function loop(now) {
  const rawDt = Math.min(0.05, (now - lastFrame) / 1000); lastFrame = now;
  update(rawDt); draw(); renderHud();
  if (game) requestAnimationFrame(loop);
}

function setPointer(e) {
  const r = canvas.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  pointer.active = true; pointer.x = p.clientX - r.left; pointer.y = p.clientY - r.top - 35;
  if (game) { game.player.tx = pointer.x; game.player.ty = pointer.y; }
}
canvas.addEventListener('mousemove', setPointer);
canvas.addEventListener('touchstart', e => { setPointer(e); e.preventDefault(); }, { passive: false });
canvas.addEventListener('touchmove', e => { setPointer(e); e.preventDefault(); }, { passive: false });

function openLevel() {
  const modal = document.getElementById('levelModal'); const list = document.getElementById('cardList');
  const cards = makeCards(); list.innerHTML = ''; clearInterval(levelTimer); levelSeconds = 5;
  document.getElementById('levelTimer').textContent = `자동 선택까지 ${levelSeconds}초`;
  cards.forEach((c, idx) => { const div = document.createElement('div'); div.className = 'choice ' + (c.evo ? 'evo' : ''); div.innerHTML = `<h3>${c.name}</h3><p>${c.desc}</p>`; div.onclick = () => selectCard(c); list.appendChild(div); if (idx === 0) list.dataset.first = '0'; });
  modal.classList.add('active');
  levelTimer = setInterval(() => { levelSeconds--; document.getElementById('levelTimer').textContent = `자동 선택까지 ${levelSeconds}초`; if (levelSeconds <= 0) selectCard(cards[0]); }, 1000);
}
function selectCard(card) { clearInterval(levelTimer); card.apply(); document.getElementById('levelModal').classList.remove('active'); }
function evolutionKey(a, b) { return [a, b].sort().join('+'); }
function pushCard(map, id, card) { if (!map.has(id)) map.set(id, card); }
function makeCards() {
  const map = new Map();
  game.ac.pool.forEach(w => {
    const wd = DATA.weapons[w]; if (!wd) return;
    if (!game.weapons[w]) pushCard(map, 'get_' + w, { name: wd.name + ' 획득', desc: wd.desc, apply: () => { game.weapons[w] = 1; } });
    else if (game.weapons[w] < 5) pushCard(map, 'up_' + w, { name: wd.name + ' Lv.' + (game.weapons[w] + 1), desc: '무기 성능이 증가합니다.', apply: () => { game.weapons[w]++; } });
  });
  Object.keys(game.weapons).forEach(a => {
    if (game.weapons[a] >= 5) Object.keys(game.weapons).forEach(b => {
      if (a === b || game.weapons[b] < 1) return;
      const key = evolutionKey(a, b); const name = DATA.evolutions[key];
      if (name && !game.evolutions[key]) pushCard(map, 'evo_' + key, { name: '★진화★ ' + name, desc: `${weaponName(a)} + ${weaponName(b)} 컨셉 결합`, evo: true, apply: () => { game.evolutions[key] = name; } });
    });
  });
  if (game.hp < game.maxHp * 0.7) pushCard(map, 'heal', { name: '긴급 수리', desc: 'HP 35% 회복', apply: () => { game.hp = Math.min(game.maxHp, game.hp + game.maxHp * 0.35); } });
  pushCard(map, 'gold', { name: '전투 정산 보너스', desc: '즉시 Gold +250 획득', apply: () => { game.gold += 250; } });
  return Array.from(map.values()).sort(() => Math.random() - 0.5).slice(0, 3);
}

preloadAssets().then(() => { initDaily(); checkOffline(); renderLobby(); setSpeed(state.speed || 1); save(); });
