export class Bullet{
  constructor({x,y,vx=0,vy=-8,r=6,damage=10,type='MISSILE',owner='player',life=180}){Object.assign(this,{x,y,vx,vy,r,damage,type,owner,life,dead:false});}
  update(){this.x+=this.vx;this.y+=this.vy;this.life--;if(this.life<=0)this.dead=true;}
  draw(ctx,camera){const x=camera.screenX(this.x),y=camera.screenY(this.y);ctx.save();if(this.type.includes('LASER')){ctx.strokeStyle=this.type==='PRISM_LASER'?'#fff':'#00ffcc';ctx.lineWidth=this.type==='PRISM_LASER'?26:13;ctx.shadowBlur=18;ctx.shadowColor='#00ffcc';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,0);ctx.stroke();}else{ctx.fillStyle=this.owner==='enemy'?'#ff4757':(this.type==='CLUSTER'?'#ff9f43':'#00ffcc');ctx.beginPath();ctx.arc(x,y,this.r,0,Math.PI*2);ctx.fill();}ctx.restore();}
}
