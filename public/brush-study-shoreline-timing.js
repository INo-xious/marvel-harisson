// One clock drives the camera, connected landscape washes and readable UI.
// Paint fields describe only the overlapping paint outside the display;
// the registered landscape inside the laptop remains intact in both directions.
export const SHORELINE_TIMING=Object.freeze({
 enter:Object.freeze({duration:1600,camera:1450,usable:1300}),
 leave:Object.freeze({duration:1100,camera:980}),
});

const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=(start,end,time)=>{
 const t=clamp((time-start)/(end-start));
 return t*t*t*(t*(t*6-15)+10);
};

/** Deterministic passage pose. elapsed is milliseconds; all other numeric fields are normalized. */
export function sampleShoreline(mode,elapsedMs=0){
 const leaving=mode==='leave',timing=SHORELINE_TIMING[leaving?'leave':'enter'];
 const elapsed=Math.max(0,Math.min(timing.duration,Number.isFinite(elapsedMs)?elapsedMs:0));
 const pose={elapsed,progress:elapsed/timing.duration,camera:smooth(0,timing.camera,elapsed),interior:1};
 if(leaving)return {
  ...pose,
  expansion:1-smooth(0,870,elapsed),
  travel:1-smooth(0,860,elapsed),
  paper:1-smooth(40,840,elapsed),
  shore:1-smooth(200,500,elapsed),
  lake:1-smooth(280,670,elapsed),
  sides:1-smooth(450,800,elapsed),
  top:1-smooth(700,920,elapsed),
  recognition:smooth(200,390,elapsed),
  ui:1-smooth(0,190,elapsed),
  usable:false,
  done:elapsed>=timing.duration,
  depth:.3*(1-smooth(0,800,elapsed)),
 };
 return {
  ...pose,
  // Keep the landscape attached to the actual growing aperture until the
  // camera is close enough to pass its rim. Rectify only the final few inches.
  expansion:smooth(930,1450,elapsed),
  travel:smooth(180,1320,elapsed),
  paper:smooth(430,1240,elapsed),
  shore:smooth(600,950,elapsed),
  lake:smooth(700,1110,elapsed),
  sides:smooth(800,1190,elapsed),
  top:smooth(970,1280,elapsed),
  recognition:0,
  ui:smooth(1080,1300,elapsed),
  usable:elapsed>=timing.usable,
  done:elapsed>=timing.duration,
  depth:smooth(200,700,elapsed)*(1-smooth(1100,1450,elapsed)),
 };
}
