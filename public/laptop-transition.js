// Camera travel and desktop reveal share one uninterrupted motion clock.
export const LAPTOP_TIMING=Object.freeze({enter:2600,leave:2600});
const bounded=x=>Math.max(0,Math.min(1,x));
const ease=(a,b,time)=>{const t=bounded((time-a)/(b-a));return t*t*t*(t*(t*6-15)+10);};
export function sampleLaptopTransition(mode,elapsed=0){
 const leaving=mode==='leave',duration=LAPTOP_TIMING[leaving?'leave':'enter'];
 const time=Math.max(0,Math.min(duration,Number.isFinite(elapsed)?elapsed:0));
 return leaving
  ?{camera:ease(0,2600,time),rectify:1-ease(0,2300,time),power:1-ease(2250,2600,time),chrome:1-ease(0,450,time),wallpaper:1-ease(0,650,time),done:time>=duration}
  :{camera:ease(0,2600,time),rectify:ease(800,2600,time),power:ease(0,650,time),chrome:ease(1650,2600,time),wallpaper:ease(1550,2600,time),done:time>=duration};
}

// Reveal only after the physical aperture surrounds every browser corner.
// A feather inside that boundary avoids a pop when the last bezel leaves view.
export function screenReveal(corners,width,height){
 if(!Array.isArray(corners)||corners.length!==4||!corners.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))||!(width>0&&height>0))return 0;
 const area=corners.reduce((sum,[x,y],i)=>sum+x*corners[(i+1)%4][1]-y*corners[(i+1)%4][0],0);
 const sign=Math.sign(area);if(!sign)return 0;
 let margin=Infinity;
 for(let i=0;i<4;i++){
  const [x,y]=corners[i],[nx,ny]=corners[(i+1)%4],dx=nx-x,dy=ny-y,length=Math.hypot(dx,dy);
  if(length<.001)return 0;
  for(const [cx,cy] of [[0,0],[width,0],[width,height],[0,height]])margin=Math.min(margin,sign*(dx*(cy-y)-dy*(cx-x))/length);
 }
 const t=bounded(margin/(Math.min(width,height)*.08));return t*t*(3-2*t);
}
