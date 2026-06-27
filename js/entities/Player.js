import {clamp} from '../core/Vector.js';
import {Bullet} from './Bullet.js';
export class Player{
  constructor(game){this.game=game;this.width=64;this.height=72;this.reset();}
  reset(){const m=this.game.meta.data;this.x=this.game.world.width/2;this.y=this.game.world.height-180;this.targetX=this.x;this.targetY=this.y;this.maxHp=100+(m.hpLevel-1)*35;this.hp=this.maxHp;this.baseAtk=15+(m.atkLevel-1)*5;this.xp=0;this.nextXp=100;this.lastShot=0;this.inv=0;}
  get visualLevel(){const s=this.game.skills;return Math.max(1,Math.min(5,Math.max(s.SK_M,s.SK_L,s.EV_M||s.EV_L?5:1)));}
  update(dt,now){if(this.inv>0)this.inv--;if(this.game.input.active){this.targetX=this.game.input.target.x;this.targetY=this.game.input.target.y;}this.x+=(this.targetX-this.x)*0.14;this.y+=(this.targetY-this.y)*0.14;this.x=clamp(this.x,this.width/2,this.game.world.width-this.width/2);this.y=clamp(this.y,120,this.game.world.height-this.height/2);this.shoot(now);}
  shoot(now){if(now-this.lastShot<230)return;this.lastShot=now;const s=this.game.skills;const count=s.EV_M?1:s.SK_M;for(let i=0;i<count;i++){const spread=(i-(count-1)/2)*22;this.game.playerBullets.push(new Bullet({x:this.x+spread,y:this.y-40,vx:spread*.045,vy:-9,r:s.EV_M?12:6,damage:this.baseAtk*(s.EV_M?2.5:1),type:s.EV_M?'CLUSTER':'MISSILE'}));}if(s.EV_L){this.game.playerBullets.push(new Bullet({x:this.x,y:this.y-52,type:'PRISM_LASER',damage:this.baseAtk*.85,life:1}));}else if(s.SK_L>0){this.game.playerBullets.push(new Bullet({x:this.x,y:this.y-45,type:'BASE_LASER',damage:this.baseAtk*(.7+s.SK_L*.22),life:1}));}}
  damage(v){if(this.inv>0)return;this.hp-=v;this.inv=55;this.game.particles.explode(this.x,this.y,'#ff9f43',18);if(this.hp<=0)this.game.gameOver();}
  draw(ctx,camera,assets){ctx.save();const x=camera.screenX(this.x),y=camera.screenY(this.y);ctx.translate(x,y);if(this.inv>0&&Math.floor(performance.now()/80)%2===0)ctx.globalAlpha=.45;const img=assets.get(`player_lv${this.visualLevel}`);ctx.drawImage(img,-this.width/2,-this.height/2,this.width,this.height);ctx.restore();}
}
