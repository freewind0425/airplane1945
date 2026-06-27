import {Bullet} from './Bullet.js';
import {rand} from '../core/Vector.js';
export class Enemy{
  constructor(game,type='SCOUT',x=0,y=0){this.game=game;this.type=type;this.x=x;this.y=y;this.dead=false;this.lastShot=0;this.seed=Math.random()*999;this.configure();}
  configure(){const st=this.game.stage;const map={SCOUT:[48,48,28+st*9,2.2,2000],FAST:[42,46,20+st*7,3.6,2600],BOMBER:[76,66,80+st*28,1.25,1200],SUICIDE:[52,52,34+st*10,2.8,9999],BOSS:[150,120,800+st*180,1.0,650]};const d=map[this.type]||map.SCOUT;[this.width,this.height,this.hp,this.speed,this.shotInterval]=d;this.maxHp=this.hp;this.stopY=this.type==='BOSS'?this.game.camera.y+170:this.game.camera.y+rand(170,360);}
  update(now){const p=this.game.player;if(this.type==='BOSS'){if(this.y<this.stopY)this.y+=this.speed;else this.x+=Math.sin(now/650)*2.0;}else if(this.type==='SUICIDE'){const a=Math.atan2(p.y-this.y,p.x-this.x);this.x+=Math.cos(a)*this.speed;this.y+=Math.sin(a)*this.speed;}else if(this.type==='FAST'){this.y+=this.speed;this.x+=Math.sin((now+this.seed)/240)*2.4;}else if(this.type==='BOMBER'){if(this.y<this.stopY)this.y+=this.speed;else this.x+=Math.sin((now+this.seed)/500)*1.1;}else{this.y+=this.speed;}
    this.shoot(now);if(this.y>this.game.world.height+120||this.x<-180||this.x>this.game.world.width+180)this.dead=true;}
  shoot(now){if(now-this.lastShot<this.shotInterval)return;if(this.type==='SUICIDE')return;this.lastShot=now;const fan=this.type==='BOSS'?5:(this.type==='BOMBER'?3:1);for(let i=0;i<fan;i++){const spread=(i-(fan-1)/2)*.85;this.game.enemyBullets.push(new Bullet({x:this.x,y:this.y+this.height/2,vx:spread,vy:4.2,r:this.type==='BOSS'?7:5,damage:10,owner:'enemy'}));}}
  reward(){if(this.type==='BOSS')return {gold:600,xp:100,kills:5};if(this.type==='BOMBER')return {gold:80,xp:40,kills:1};return {gold:35,xp:25,kills:1};}
  spriteKey(){return this.type==='BOSS'?'enemy_boss':`enemy_${this.type.toLowerCase()}`;}
  draw(ctx,camera,assets){const x=camera.screenX(this.x),y=camera.screenY(this.y);ctx.drawImage(assets.get(this.spriteKey()),x-this.width/2,y-this.height/2,this.width,this.height);if(this.type==='BOSS'){ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(x-this.width/2,y-this.height/2-14,this.width*(this.hp/this.maxHp),6);}}
}
