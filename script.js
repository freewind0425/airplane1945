
const DATA={
  offlineRate:.4, offlineMaxHours:8,
  overdrive:{maxGauge:100,drainPerFrame:.12,chargePerFrame:.035,attackSpeed:1.7,spawnRate:1.8,reward:1.5},
  pilotExp:Array.from({length:101},(_,i)=>i===0?0:Math.floor(60*Math.pow(i,1.42)+i*20)),
  aircraft:[
    {id:'ranger',name:'Ranger',title:'정통 강습기',base:'straight',pool:['straight','homing','laser','chain','shield'],cost:0,difficulty:'★',od:'Standard Overdrive'},
    {id:'falcon',name:'Falcon',title:'자동 추적기',base:'homing',pool:['homing','straight','laser','chain','drone'],cost:5000,difficulty:'★★',od:'Homing Overdrive'},
    {id:'nova',name:'Nova',title:'관통 레이저기',base:'laser',pool:['laser','straight','homing','chain','orbital'],cost:20000,difficulty:'★★★',od:'Prism Overdrive'},
    {id:'volt',name:'Volt',title:'전격 확산기',base:'chain',pool:['chain','straight','homing','laser','shield'],cost:80000,difficulty:'★★',od:'Thunder Overdrive'},
    {id:'guardian',name:'Guardian',title:'방어 요격기',base:'shield',pool:['shield','straight','laser','chain','drone'],cost:300000,difficulty:'★',od:'Aegis Overdrive'}
  ],
  weapons:{
    straight:{name:'직선 미사일',desc:'정면 탄막. Lv5는 7발 확산.'},homing:{name:'유도 미사일',desc:'가까운 적 추적.'},laser:{name:'레이저',desc:'전방 관통 지속 피해.'},chain:{name:'체인',desc:'처치/명중 지점에서 전격 전이.'},shield:{name:'실드',desc:'탄 제거와 근접 보호.'},drone:{name:'드론',desc:'자동 보조 공격.'},orbital:{name:'오비탈',desc:'주변 궤도 공격.'}
  },
  evolutions:{
    'homing+straight':'더블 호밍 캐논','laser+straight':'레일 캐논','chain+straight':'스파크 캐논','shield+straight':'가드 캐논','homing+laser':'호밍 레이저','chain+homing':'썬더 미사일','homing+shield':'가디언 드론','chain+laser':'썬더 레이저','laser+shield':'프리즘 실드','chain+shield':'전기 실드'
  },
  research:[
    {id:'goldGain',name:'Gold Mining',desc:'골드 획득 +2%',max:20,cost:20,step:.02},
    {id:'offlineGain',name:'Offline Mining',desc:'오프라인 보상 +3%',max:20,cost:20,step:.03},
    {id:'autoFire',name:'Auto Fire',desc:'AUTO 공격속도 +2%',max:20,cost:25,step:.02},
    {id:'odCharge',name:'OD Charge',desc:'OVER DRIVE 충전속도 +3%',max:20,cost:25,step:.03},
    {id:'odOutput',name:'OD Output',desc:'OVER DRIVE 공격력 +5%',max:20,cost:30,step:.05},
    {id:'pilotAtk',name:'Pilot ATK',desc:'공격력 +2%',max:20,cost:30,step:.02},
    {id:'pilotHp',name:'Pilot HP',desc:'HP +2%',max:20,cost:25,step:.02},
    {id:'expGain',name:'EXP Gain',desc:'경험치 +3%',max:20,cost:20,step:.03}
  ],
  daily:[
    {id:'kill300',name:'적 300기 처치',goal:300,type:'kills',gold:800,rp:15},
    {id:'boss3',name:'보스 3회 처치',goal:3,type:'boss',gold:1500,rp:25},
    {id:'od5',name:'OVER DRIVE 5회 사용',goal:5,type:'od',gold:1000,rp:20},
    {id:'auto30',name:'AUTO 30분 플레이',goal:1800,type:'autoTime',gold:1200,rp:20},
    {id:'research1',name:'연구소 연구 1회',goal:1,type:'research',gold:1000,rp:30}
  ]
};
const saveKey='go_air_raid_v05';
let state=loadState();let pendingOffline=null;let game=null;
function defaultState(){return{gold:1200,rp:0,pilotLevel:1,pilotExp:0,selected:'ranger',owned:{ranger:true},mastery:{ranger:{lv:1,exp:0}},transcend:{},research:{},dailyDate:'',daily:{},lastSeen:Date.now()};}
function loadState(){try{return Object.assign(defaultState(),JSON.parse(localStorage.getItem(saveKey)||'{}'));}catch(e){return defaultState();}}
function save(){state.lastSeen=Date.now();localStorage.setItem(saveKey,JSON.stringify(state));}
function showTab(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');renderLobby();}
function fmt(n){return Math.floor(n).toLocaleString('ko-KR');}
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1400);}
function today(){return new Date().toISOString().slice(0,10);}function ensureDaily(){if(state.dailyDate!==today()){state.dailyDate=today();state.daily={};DATA.daily.forEach(d=>state.daily[d.id]={v:0,claimed:false});save();}}
function addDaily(type,v){ensureDaily();DATA.daily.forEach(d=>{if(d.type===type){state.daily[d.id].v=Math.min(d.goal,(state.daily[d.id].v||0)+v);}});}
function getResearch(id){return state.research[id]||0;}function mult(id){const r=DATA.research.find(x=>x.id===id);return 1+getResearch(id)*(r?r.step:0);}
function calcOffline(){const now=Date.now();const sec=Math.min((now-(state.lastSeen||now))/1000,DATA.offlineMaxHours*3600);if(sec<60)return null;let gold=sec*.18*DATA.offlineRate*mult('offlineGain')*mult('goldGain');let exp=sec*.06*DATA.offlineRate*mult('expGain');return{sec,gold:Math.floor(gold),exp:Math.floor(exp)};}
function claimOffline(){if(!pendingOffline)return;state.gold+=pendingOffline.gold;state.pilotExp+=pendingOffline.exp;levelPilot();pendingOffline=null;document.getElementById('offlinePanel').style.display='none';save();renderLobby();}
function levelPilot(){while(state.pilotLevel<DATA.pilotExp.length && state.pilotExp>=DATA.pilotExp[state.pilotLevel]){state.pilotExp-=DATA.pilotExp[state.pilotLevel];state.pilotLevel++;}}
function renderLobby(){ensureDaily();document.getElementById('pilotLv').textContent=state.pilotLevel;document.getElementById('pilotExp').textContent=fmt(state.pilotExp)+' / '+fmt(DATA.pilotExp[state.pilotLevel]||999999);document.getElementById('goldText').textContent=fmt(state.gold);document.getElementById('rpText').textContent=fmt(state.rp);pendingOffline=calcOffline();if(pendingOffline){document.getElementById('offlinePanel').style.display='block';document.getElementById('offlineGold').textContent='+'+fmt(pendingOffline.gold);document.getElementById('offlineExp').textContent='+'+fmt(pendingOffline.exp);}else document.getElementById('offlinePanel').style.display='none';
 let html='';DATA.aircraft.forEach(a=>{const owned=!!state.owned[a.id],sel=state.selected===a.id,m=state.mastery[a.id]||{lv:0,exp:0};html+=`<div class="card ${sel?'selected':''}"><div class="row"><div><h3>${a.name} <span class="badge">${a.difficulty}</span></h3><div class="small">${a.title} / 기본: ${DATA.weapons[a.base].name}</div><div class="small">Mastery Lv.${m.lv||0} / ${a.od}</div></div><div>${owned?`<button class="btn ${sel?'dark':''}" onclick="selectAircraft('${a.id}')">${sel?'선택중':'선택'}</button>`:`<button class="btn alt" onclick="buyAircraft('${a.id}')">${fmt(a.cost)}G</button>`}</div></div></div>`});document.getElementById('aircraftList').innerHTML=html;
 let dhtml='';DATA.daily.forEach(d=>{const v=state.daily[d.id]||{v:0,claimed:false};const done=v.v>=d.goal;dhtml+=`<div class="card"><div class="row"><div><b>${d.name}</b><div class="small">${fmt(v.v||0)} / ${fmt(d.goal)} · 보상 ${fmt(d.gold)}G + ${d.rp}RP</div></div><button class="btn" ${!done||v.claimed?'disabled':''} onclick="claimDaily('${d.id}')">${v.claimed?'완료':'수령'}</button></div></div>`});document.getElementById('dailyList').innerHTML=dhtml;renderResearch();}
function buyAircraft(id){const a=DATA.aircraft.find(x=>x.id===id);if(state.gold<a.cost)return toast('골드 부족');state.gold-=a.cost;state.owned[id]=true;state.mastery[id]={lv:1,exp:0};state.selected=id;save();renderLobby();toast(a.name+' 구매');}
function selectAircraft(id){if(!state.owned[id])return;state.selected=id;save();renderLobby();}
function renderResearch(){const r2=document.getElementById('rpText2');if(!r2)return;r2.textContent=fmt(state.rp);let html='';DATA.research.forEach(r=>{const lv=getResearch(r.id);const cost=Math.floor(r.cost*Math.pow(1.22,lv));html+=`<div class="card"><div class="row"><div><h3>${r.name} Lv.${lv}/${r.max}</h3><div class="small">${r.desc} · 다음 비용 ${cost} RP</div></div><button class="btn" ${lv>=r.max||state.rp<cost?'disabled':''} onclick="buyResearch('${r.id}')">연구</button></div></div>`});document.getElementById('researchList').innerHTML=html;}
function buyResearch(id){const r=DATA.research.find(x=>x.id===id);const lv=getResearch(id);const cost=Math.floor(r.cost*Math.pow(1.22,lv));if(state.rp<cost||lv>=r.max)return;state.rp-=cost;state.research[id]=lv+1;addDaily('research',1);save();renderResearch();renderLobby();}
function claimDaily(id){const d=DATA.daily.find(x=>x.id===id);const v=state.daily[id];if(!v||v.v<d.goal||v.claimed)return;v.claimed=true;state.gold+=d.gold;state.rp+=d.rp;save();renderLobby();}
const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');function resize(){canvas.width=app.clientWidth;canvas.height=app.clientHeight;}window.addEventListener('resize',resize);resize();
function startRun(){document.getElementById('lobby').classList.remove('active');document.getElementById('hud').style.display='block';document.getElementById('weaponStatus').style.display='block';document.getElementById('gameBtns').style.display='flex';const ac=DATA.aircraft.find(a=>a.id===state.selected);game={state:'play',mode:'auto',t:0,stage:1,kills:0,need:18,gold:0,exp:0,boss:0,odUses:0,autoTime:0,hp:100*mult('pilotHp'),maxHp:100*mult('pilotHp'),xp:0,nextXp:80,level:1,od:35,player:{x:canvas.width/2,y:canvas.height*.72,targetX:canvas.width/2,targetY:canvas.height*.72},weapons:{},evolutions:{},bullets:[],enemies:[],particles:[],lastShot:0,lastSpawn:0,ac};game.weapons[ac.base]=1;requestAnimationFrame(loop)}
function endRun(){if(!game)return;state.gold+=Math.floor(game.gold);state.pilotExp+=Math.floor(game.exp);levelPilot();const m=state.mastery[state.selected]||{lv:1,exp:0};m.exp+=(game.kills+game.boss*15);while(m.lv<10&&m.exp>=m.lv*80){m.exp-=m.lv*80;m.lv++;}state.mastery[state.selected]=m;save();document.getElementById('hud').style.display='none';document.getElementById('weaponStatus').style.display='none';document.getElementById('gameBtns').style.display='none';document.getElementById('resultText').innerHTML=`<p>Gold +${fmt(game.gold)}<br>Pilot EXP +${fmt(game.exp)}<br>Boss ${game.boss}회 / Kill ${game.kills}</p>`;document.getElementById('resultModal').classList.add('active');game=null;renderLobby();}
function closeResult(){document.getElementById('resultModal').classList.remove('active');showTab('lobby');}
function toggleOverdrive(){if(!game)return;if(game.mode==='od'){game.mode='auto';return;}if(game.od>=100){game.mode='od';game.odUses++;addDaily('od',1);}}
function spawnEnemy(now){let boss=game.stage%5===0&&game.kills>=game.need-1&&!game.enemies.some(e=>e.boss);if(boss){game.enemies.push({x:canvas.width/2,y:-80,w:120,h:90,hp:600+game.stage*120,max:600+game.stage*120,vy:1,boss:true,shoot:0});return;}let type=Math.random();game.enemies.push({x:30+Math.random()*(canvas.width-60),y:-40,w:type>.82?58:36,h:type>.82?52:36,hp:(type>.82?80:28)+game.stage*8,max:(type>.82?80:28)+game.stage*8,vy:(type>.82?1.2:2.0)+game.stage*.04,boss:false,shoot:0});}
function fire(now){let rate=310/(mult('autoFire')*(game.mode==='od'?DATA.overdrive.attackSpeed*mult('odOutput'):1));if(now-game.lastShot<rate)return;game.lastShot=now;const w=game.weapons,p=game.player,atk=14*mult('pilotAtk')*(game.mode==='od'?DATA.overdrive.attackSpeed*mult('odOutput'):1);if(w.straight){let patterns={1:[0],2:[-8,8],3:[-8,8,-15,15],4:[-12,0,12,-15,15],5:[-12,0,12,-15,15,-45,45]}[w.straight]||[0];patterns.forEach(a=>{let rad=(a||0)*Math.PI/180;game.bullets.push({x:p.x,y:p.y-30,vx:Math.sin(rad)*5,vy:-Math.cos(rad)*7,dmg:atk,type:'bullet'});});}if(w.homing){game.bullets.push({x:p.x,y:p.y-20,vx:0,vy:-5,dmg:atk*.9,type:'homing'});}if(w.laser){game.bullets.push({x:p.x,y:p.y-40,dmg:atk*.35,type:'laser',life:8,width:12+w.laser*4});}if(w.shield){for(let i=0;i<w.shield;i++){let a=game.t*.004+i*Math.PI*2/w.shield;game.particles.push({x:p.x+Math.cos(a)*55,y:p.y+Math.sin(a)*55,r:12,life:6,c:'#3867d6',shield:true,dmg:atk*.5});}}
}
function update(now){if(!game)return;game.t=now;const od=game.mode==='od';if(od){game.od-=DATA.overdrive.drainPerFrame;if(game.od<=0){game.od=0;game.mode='auto';}}else game.od=Math.min(DATA.overdrive.maxGauge,game.od+DATA.overdrive.chargePerFrame*mult('odCharge'));if(!od) {game.autoTime+=1/60;addDaily('autoTime',1/60);}let p=game.player;if(od&&pointer.active){p.x+=(p.targetX-p.x)*.16;p.y+=(p.targetY-p.y)*.16;}else{let target=game.enemies[0];if(target){p.x+=(target.x-p.x)*.025;p.y+=(canvas.height*.72-p.y)*.02;}else p.x+=(canvas.width/2-p.x)*.01;}p.x=Math.max(30,Math.min(canvas.width-30,p.x));p.y=Math.max(90,Math.min(canvas.height-70,p.y));let spawnRate=od?Math.floor(620/DATA.overdrive.spawnRate):620;if(now-game.lastSpawn>spawnRate){spawnEnemy(now);game.lastSpawn=now;}fire(now);
 game.bullets.forEach(b=>{if(b.type==='homing'&&game.enemies.length){let e=game.enemies.reduce((a,c)=>Math.hypot(c.x-b.x,c.y-b.y)<Math.hypot(a.x-b.x,a.y-b.y)?c:a,game.enemies[0]);b.vx+=(e.x-b.x)*.006;b.vy+=(e.y-b.y)*.006;}if(b.type!=='laser'){b.x+=b.vx;b.y+=b.vy;}else b.life--;});game.bullets=game.bullets.filter(b=>b.y>-50&&b.y<canvas.height+50&&b.x>-50&&b.x<canvas.width+50&&b.life!==0);
 game.enemies.forEach(e=>{e.y+=e.boss&&e.y<130?1:e.vy;if(e.boss&&e.y>=130)e.x+=Math.sin(now/700)*1.5;});
 game.bullets.forEach(b=>{game.enemies.forEach(e=>{let hit=false;if(b.type==='laser')hit=Math.abs(e.x-b.x)<e.w/2+b.width&&e.y<p.y;else hit=Math.hypot(e.x-b.x,e.y-b.y)<e.w/2+7;if(hit&&!b.dead){e.hp-=b.dmg;if(b.type!=='laser')b.dead=true;if(game.weapons.chain&&Math.random()<.22){game.enemies.filter(o=>o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<170).slice(0,game.weapons.chain).forEach(o=>{o.hp-=b.dmg*.65;game.particles.push({x1:e.x,y1:e.y,x2:o.x,y2:o.y,life:12,chain:true});});}}});});game.bullets=game.bullets.filter(b=>!b.dead);
 game.particles.forEach(p=>p.life--);game.particles=game.particles.filter(p=>p.life>0);
 for(let i=game.enemies.length-1;i>=0;i--){let e=game.enemies[i];if(e.hp<=0){let g=(e.boss?150: e.w>40?14:5)*mult('goldGain')*(od?DATA.overdrive.reward:1);let xp=(e.boss?80:e.w>40?22:9)*mult('expGain')*(od?DATA.overdrive.reward:1);game.gold+=g;game.exp+=xp;game.xp+=xp;game.kills++;if(e.boss){game.boss++;addDaily('boss',1);}addDaily('kills',1);game.enemies.splice(i,1);if(game.kills>=game.need){game.stage++;game.kills=0;game.need=Math.floor(game.need*1.22)+3;}}else if(e.y>canvas.height+80){game.hp-=e.boss?25:7;game.enemies.splice(i,1);}else if(Math.hypot(e.x-p.x,e.y-p.y)<(e.w/2+20)){game.hp-=e.boss?35:12;game.enemies.splice(i,1);}}
 if(game.xp>=game.nextXp){game.xp-=game.nextXp;game.nextXp=Math.floor(game.nextXp*1.22);game.level++;openLevel();}
 if(game.hp<=0)endRun();}
function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#06101f';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='rgba(125,249,255,.65)';for(let i=0;i<70;i++){let y=(i*97+Date.now()/30)%canvas.height;ctx.fillRect((i*53)%canvas.width,y,2,5);}if(!game)return;game.enemies.forEach(e=>{ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle=e.boss?'#3d123d':(e.w>40?'#2d142c':'#111b29');ctx.strokeStyle=e.boss?'#ffd32a':'#ff4757';ctx.lineWidth=e.boss?4:2;ctx.beginPath();ctx.moveTo(0,e.h/2);ctx.lineTo(-e.w/2,-e.h/2);ctx.lineTo(0,-e.h*.2);ctx.lineTo(e.w/2,-e.h/2);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();if(e.boss){ctx.fillStyle='#fff';ctx.fillRect(40,75,(canvas.width-80)*(e.hp/e.max),6);}});
 game.bullets.forEach(b=>{if(b.type==='laser'){ctx.strokeStyle='#00ffcc';ctx.lineWidth=b.width;ctx.shadowBlur=15;ctx.shadowColor='#00ffcc';ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x,0);ctx.stroke();ctx.shadowBlur=0;}else{ctx.fillStyle=b.type==='homing'?'#ffd32a':'#00ffcc';ctx.beginPath();ctx.arc(b.x,b.y,5,0,Math.PI*2);ctx.fill();}});
 game.particles.forEach(p=>{if(p.chain){ctx.strokeStyle='rgba(255,211,42,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x1,p.y1);ctx.lineTo(p.x2,p.y2);ctx.stroke();}else{ctx.fillStyle=p.c||'#ffdf3d';ctx.globalAlpha=Math.max(0,p.life/10);ctx.beginPath();ctx.arc(p.x,p.y,p.r||3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}});
 const p=game.player;ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle=game.mode==='od'?'#ff4757':'#ffffff';ctx.strokeStyle=game.mode==='od'?'#ffd32a':'#00ffcc';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-38);ctx.lineTo(-38,26);ctx.lineTo(-14,12);ctx.lineTo(0,32);ctx.lineTo(14,12);ctx.lineTo(38,26);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#ff9f43';ctx.beginPath();ctx.moveTo(-11,25);ctx.lineTo(-4,45);ctx.lineTo(0,25);ctx.fill();ctx.beginPath();ctx.moveTo(11,25);ctx.lineTo(4,45);ctx.lineTo(0,25);ctx.fill();ctx.restore();}
function renderHud(){if(!game)return;document.getElementById('stageText').textContent='STAGE '+game.stage+'  '+game.kills+'/'+game.need;document.getElementById('modeText').textContent=game.mode==='od'?'OVER DRIVE':'AUTO';document.getElementById('runGold').textContent=fmt(game.gold);document.getElementById('hpFill').style.width=Math.max(0,game.hp/game.maxHp*100)+'%';document.getElementById('xpFill').style.width=Math.min(100,game.xp/game.nextXp*100)+'%';document.getElementById('odFill').style.width=Math.min(100,game.od)+'%';document.getElementById('stageFill').style.width=Math.min(100,game.kills/game.need*100)+'%';const odBtn=document.getElementById('odBtn');odBtn.disabled=game.mode!=='od'&&game.od<100;odBtn.className='odbtn '+(game.mode==='od'?'active':'');odBtn.textContent=game.mode==='od'?'OVER DRIVE '+Math.floor(game.od)+'%':(game.od>=100?'OVER DRIVE':'CHARGING '+Math.floor(game.od)+'%');let whtml='';Object.keys(game.weapons).forEach(k=>whtml+=`<div><span>${DATA.weapons[k]?.name||k}</span><b>Lv.${game.weapons[k]}</b></div>`);Object.values(game.evolutions).forEach(n=>whtml+=`<div><span class="num">${n}</span><b>진화</b></div>`);document.getElementById('weaponStatus').innerHTML=whtml;}
function loop(now){update(now);draw();renderHud();if(game)requestAnimationFrame(loop)}
const pointer={active:false};function setPointer(e){const r=canvas.getBoundingClientRect();const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;const y=(e.touches?e.touches[0].clientY:e.clientY)-r.top-35;if(game){game.player.targetX=x;game.player.targetY=y;}pointer.active=true;}canvas.addEventListener('mousemove',setPointer);canvas.addEventListener('touchstart',e=>{setPointer(e);e.preventDefault()},{passive:false});canvas.addEventListener('touchmove',e=>{setPointer(e);e.preventDefault()},{passive:false});
function openLevel(){const modal=document.getElementById('levelModal');const list=document.getElementById('cardList');const cards=makeCards();list.innerHTML='';cards.forEach(c=>{let div=document.createElement('div');div.className='choice';div.innerHTML=`<h3>${c.name}</h3><p>${c.desc}</p>`;div.onclick=()=>{c.apply();modal.classList.remove('active')};list.appendChild(div);});modal.classList.add('active');}
function evolutionKey(a,b){return [a,b].sort().join('+');}
function pushCard(map,id,card){if(!map.has(id))map.set(id,card);}
function makeCards(){
  const map=new Map();
  const pool=game.ac.pool;
  pool.forEach(w=>{
    const wd=DATA.weapons[w];
    if(!wd)return;
    if(!game.weapons[w]) pushCard(map,'get_'+w,{name:wd.name+' 획득',desc:wd.desc,apply:()=>game.weapons[w]=1});
    else if(game.weapons[w]<5) pushCard(map,'up_'+w,{name:wd.name+' Lv.'+(game.weapons[w]+1),desc:'무기 성능이 증가합니다.',apply:()=>game.weapons[w]++});
  });
  Object.keys(game.weapons).forEach(a=>{
    if(game.weapons[a]>=5){
      Object.keys(game.weapons).forEach(b=>{
        if(a!==b&&game.weapons[b]>=1){
          const key=evolutionKey(a,b);
          const name=DATA.evolutions[key];
          if(name&&!game.evolutions[key]) pushCard(map,'evo_'+key,{name:'★진화★ '+name,desc:`${DATA.weapons[a].name} + ${DATA.weapons[b].name} 컨셉 결합`,apply:()=>game.evolutions[key]=name});
        }
      });
    }
  });
  if(game.hp<game.maxHp*.7) pushCard(map,'heal',{name:'긴급 수리',desc:'HP 35% 회복',apply:()=>game.hp=Math.min(game.maxHp,game.hp+game.maxHp*.35)});
  pushCard(map,'gold',{name:'전투 정산 보너스',desc:'즉시 Gold +200 획득',apply:()=>game.gold+=200});
  return Array.from(map.values()).sort(()=>Math.random()-.5).slice(0,3);
}
renderLobby();save();
