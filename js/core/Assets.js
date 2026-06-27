export class Assets{
  constructor(){this.images=new Map();}
  async load(list){await Promise.all(list.map(({key,src})=>new Promise(res=>{const img=new Image();img.onload=()=>{this.images.set(key,img);res();};img.onerror=()=>{this.images.set(key,this.fallback(key));res();};img.src=src;})));}
  get(key){return this.images.get(key)||this.fallback(key);}
  fallback(key){
    const c=document.createElement('canvas');c.width=140;c.height=140;const g=c.getContext('2d');g.translate(70,70);
    const enemy=key.includes('enemy'); const boss=key.includes('boss'); const player=key.includes('player');
    g.fillStyle=player?'#f8fbff':boss?'#3d123d':'#111b29';g.strokeStyle=player?'#00ffcc':boss?'#ffd32a':'#ff4757';g.lineWidth=6;
    g.beginPath();
    if(player){g.moveTo(0,-55);g.lineTo(-55,35);g.lineTo(-20,20);g.lineTo(0,55);g.lineTo(20,20);g.lineTo(55,35);}else{g.moveTo(0,55);g.lineTo(-55,-35);g.lineTo(-16,-16);g.lineTo(0,-55);g.lineTo(16,-16);g.lineTo(55,-35);}g.closePath();g.fill();g.stroke();
    g.fillStyle='#07101f';g.beginPath();g.ellipse(0,-10,12,22,0,0,Math.PI*2);g.fill();return c;
  }
}
