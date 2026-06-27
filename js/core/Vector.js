export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const rand=(min,max)=>min+Math.random()*(max-min);
