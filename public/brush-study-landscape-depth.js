// Travel is geometry, not a dissolve. Its final pose remains mounted until
// the same progress is reversed on the way back to the painted laptop.
export const LANDSCAPE_DEPTH_RESERVE=192;
export const LANDSCAPE_DEPTH_SOURCE=Object.freeze({width:1586,height:992});
export const LANDSCAPE_DEPTH_ANCHOR=Object.freeze([.6,.4]);
const nativeAnchor=[1586*.6,992*.4];
const layers=[
 ['sky',.995,0,0,.35,.2],
 ['mountains',.98,0,0,1.35,.6],
 ['lake',1.035,0,1,.72,1.4],
 ['shoreline',1.14,-2,3,2.45,6],
 ['foreground',1.32,0,7,5,14],
];
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const reducedValue=value=>typeof value==='function'?Boolean(value()):Boolean(value?.matches??value);

export function sampleLandscapeDepth(progress=0,{reduced=false}={}){
 const travel=reducedValue(reduced)?1:Math.max(0,Math.min(1,finite(progress)));
 const framing=1-.04*travel;
 return {progress:travel,anchor:[...LANDSCAPE_DEPTH_ANCHOR],framing,layers:layers.map(([name,scale,x,y,roomDepth,enteredDepth])=>({
  name,scale:framing*(1+(scale-1)*travel),x:x*travel,y:y*travel,depth:roomDepth+(enteredDepth-roomDepth)*travel,
 }))};
}

export function landscapeDepthPoint(layer,point){
 const scale=Number.isFinite(layer?.scale)&&layer.scale>0?layer.scale:1;
 return nativeAnchor.map((anchor,index)=>anchor+(finite(point?.[index])-anchor)*scale+finite(index?layer?.y:layer?.x));
}

export function landscapeDepthSourcePoint(layer,point){
 const scale=Number.isFinite(layer?.scale)&&layer.scale>0?layer.scale:1;
 return nativeAnchor.map((anchor,index)=>anchor+(finite(point?.[index])-anchor-finite(index?layer?.y:layer?.x))/scale);
}
