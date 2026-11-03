// One reversible camera clock keeps the real DOM screen attached to the lid.
export const LAPTOP_TIMING=Object.freeze({enter:2050,leave:1900});
const bounded=x=>Math.max(0,Math.min(1,x));
const ease=(a,b,time)=>{const t=bounded((time-a)/(b-a));return t*t*t*(t*(t*6-15)+10);};
export function sampleLaptopTransition(mode,elapsed=0){
 const leaving=mode==='leave',duration=LAPTOP_TIMING[leaving?'leave':'enter'];
 const time=Math.max(0,Math.min(duration,Number.isFinite(elapsed)?elapsed:0));
 return leaving
  ?{camera:ease(180,1780,time),rectify:1-ease(0,180,time),power:1-ease(1600,1900,time),done:time>=duration}
  :{camera:ease(100,1800,time),rectify:ease(1800,2050,time),power:ease(0,260,time),done:time>=duration};
}
