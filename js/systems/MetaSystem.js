export class MetaSystem{
  constructor(){this.key='go_airraid_meta_v04';this.data=this.load();}
  load(){const raw=localStorage.getItem(this.key);if(raw){try{return JSON.parse(raw);}catch(e){}}
    return {atkLevel:1,hpLevel:1,gold:Number(localStorage.getItem('go_airraid_gold')||1000),bestStage:Number(localStorage.getItem('go_airraid_best_stage')||1)};}
  save(){localStorage.setItem(this.key,JSON.stringify(this.data));localStorage.setItem('go_airraid_gold',String(this.data.gold));localStorage.setItem('go_airraid_best_stage',String(this.data.bestStage));}
  cost(type){return type==='atk'?Math.floor(500*Math.pow(this.data.atkLevel,1.5)):Math.floor(400*Math.pow(this.data.hpLevel,1.4));}
  buy(type){const c=this.cost(type);if(this.data.gold<c)return false;this.data.gold-=c;if(type==='atk')this.data.atkLevel++;else this.data.hpLevel++;this.save();return true;}
}
