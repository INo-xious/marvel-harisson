// Illuminate the glass, travel through the wallpaper, then reveal level UI.
export const LAPTOP_TIMING=Object.freeze({enter:3500,leave:3200});
const bounded=x=>Math.max(0,Math.min(1,x));
const ease=(a,b,time)=>{const t=bounded((time-a)/(b-a));return t*t*t*(t*(t*6-15)+10);};
export function sampleLaptopTransition(mode,elapsed=0){
 const leaving=mode==='leave',duration=LAPTOP_TIMING[leaving?'leave':'enter'];
 const time=Math.max(0,Math.min(duration,Number.isFinite(elapsed)?elapsed:0));
 return leaving
  ?{camera:ease(900,2900,time),rectify:1-ease(650,2400,time),power:1-ease(2750,3200,time),chrome:1-ease(0,450,time),wallpaper:1-ease(0,650,time),done:time>=duration}
  :{camera:ease(250,2400,time),rectify:ease(850,2450,time),power:ease(0,650,time),chrome:ease(2700,3500,time),wallpaper:ease(2450,3350,time),done:time>=duration};
}
