// Illuminate the glass, travel through the wallpaper, then reveal level UI.
export const LAPTOP_TIMING=Object.freeze({enter:2800,leave:2800});
const bounded=x=>Math.max(0,Math.min(1,x));
const ease=(a,b,time)=>{const t=bounded((time-a)/(b-a));return t*t*t*(t*(t*6-15)+10);};
export function sampleLaptopTransition(mode,elapsed=0){
 const leaving=mode==='leave',duration=LAPTOP_TIMING[leaving?'leave':'enter'];
 const time=Math.max(0,Math.min(duration,Number.isFinite(elapsed)?elapsed:0));
 return leaving
  ?{camera:ease(350,2500,time),rectify:1-ease(300,1900,time),power:1-ease(2350,2800,time),chrome:1-ease(0,450,time),done:time>=duration}
  :{camera:ease(250,2400,time),rectify:ease(850,2450,time),power:ease(0,650,time),chrome:ease(2000,2800,time),done:time>=duration};
}
