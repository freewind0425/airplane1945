export class ParticleSystem{
  constructor(){this.list=[];}
  explode(x,y,color,count=12){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2;const sp=Math.random()*4+1;this.list.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:Math.random()*3+2,color,alpha:1});}}
  update(){this.list.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.alpha-=.035;});this.list=this.list.filter(p=>p.alpha>0);}
  draw(ctx,camera){this.list.forEach(p=>{ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(camera.screenX(p.x),camera.screenY(p.y),p.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;});}
}
