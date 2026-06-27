import {Enemy} from '../entities/Enemy.js';
import {rand} from '../core/Vector.js';
export class WaveSystem{
  constructor(game){this.game=game;this.lastSpawn=0;this.interval=760;this.lastBossStage=0;}
  reset(){this.lastSpawn=0;this.interval=760;this.lastBossStage=0;}
  update(now){if(now-this.lastSpawn<this.interval)return;this.lastSpawn=now;const g=this.game;if(g.stage%5===0&&this.lastBossStage!==g.stage){this.lastBossStage=g.stage;g.enemies.push(new Enemy(g,'BOSS',g.camera.x+g.canvas.width/2,g.camera.y-130));return;}
    const dice=Math.random();let type='SCOUT';if(dice>.86)type='SUICIDE';else if(dice>.72)type='BOMBER';else if(dice>.50)type='FAST';const x=g.camera.x+rand(60,g.canvas.width-60);const y=g.camera.y-70;g.enemies.push(new Enemy(g,type,x,y));}
  stageUp(){this.interval=Math.max(360,this.interval-55);}
}
