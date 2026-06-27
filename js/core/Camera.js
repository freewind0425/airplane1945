import {clamp} from './Vector.js';
export class Camera{
  constructor(canvas,world){this.canvas=canvas;this.world=world;this.x=0;this.y=0;}
  follow(target){
    const tx=target.x-this.canvas.width/2;
    const ty=target.y-this.canvas.height/2;
    this.x=clamp(tx,0,this.world.width-this.canvas.width);
    this.y=clamp(ty,0,this.world.height-this.canvas.height);
  }
  screenX(x){return x-this.x;} screenY(y){return y-this.y;}
}
