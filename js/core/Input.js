export class Input{
  constructor(canvas,camera){this.canvas=canvas;this.camera=camera;this.active=false;this.target={x:0,y:0};this.bind();}
  bind(){
    const set=(cx,cy)=>{const r=this.canvas.getBoundingClientRect();const sx=(cx-r.left)*(this.canvas.width/r.width);const sy=(cy-r.top)*(this.canvas.height/r.height);this.target.x=sx+this.camera.x;this.target.y=sy+this.camera.y-52;this.active=true;};
    this.canvas.addEventListener('mousemove',e=>set(e.clientX,e.clientY));
    this.canvas.addEventListener('touchstart',e=>{if(e.touches[0])set(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();},{passive:false});
    this.canvas.addEventListener('touchmove',e=>{if(e.touches[0])set(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();},{passive:false});
  }
}
