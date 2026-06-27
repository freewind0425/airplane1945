import {dist} from '../core/Vector.js';
export class CollisionSystem{
  constructor(game){this.game=game;}
  update(){const g=this.game;
    g.playerBullets.forEach(b=>{if(b.type.includes('LASER')){g.enemies.forEach(e=>{if(Math.abs(e.x-b.x)<e.width/2+(b.type==='PRISM_LASER'?28:16)&&e.y<g.player.y){e.hp-=b.damage;if(Math.random()>.84)g.particles.explode(e.x,e.y,'#00ffcc',2);}});b.dead=true;return;}
      g.enemies.forEach(e=>{if(!b.dead&&dist(b,e)<e.width/2+b.r){e.hp-=b.damage;b.dead=true;g.particles.explode(e.x,e.y,'#ff4757',5);if(b.type==='CLUSTER'){for(let i=0;i<4;i++)g.spawnMiniMissile(b,i);}});});
    g.enemyBullets.forEach(b=>{if(!b.dead&&dist(b,g.player)<g.player.width/3){b.dead=true;g.player.damage(b.damage||10);}});
    g.enemies.forEach(e=>{if(!e.dead&&dist(e,g.player)<g.player.width/3+e.width/3){e.dead=true;g.player.damage(e.type==='BOSS'?45:25);}});
    g.enemies.forEach(e=>{if(e.hp<=0&&!e.dead){e.dead=true;const r=e.reward();g.goldEarned+=r.gold;g.player.xp+=r.xp;g.stageKills+=r.kills;g.particles.explode(e.x,e.y,e.type==='BOSS'?'#ffd32a':'#ff4757',e.type==='BOSS'?45:14);g.tryChain(e);}});
  }
}
