import { CAMERA, MACBOOK, laptopWorldCoordinates, convexHull } from './painted-geometry.js';

// The painted camera is a room calibration, not an actor placement control.
// A rigid translation parallel to camera-right keeps the laptop on the desk,
// with identical camera depth, metric size, and unchanged vertical projection.
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const center=[MACBOOK.width/2,0,MACBOOK.depth/2];
export const LAPTOP_SHIFT_PIXELS=90;
const distance=LAPTOP_SHIFT_PIXELS*CAMERA.projectDetailed(center).depth/CAMERA.focal;
export const LAPTOP_OFFSET=CAMERA.right.map(v=>v*distance);
export const LAPTOP_CENTER=add(center,LAPTOP_OFFSET);

export function placedLaptopWorldCoordinates(options={}){
 const source=laptopWorldCoordinates(options),move=p=>add(p,LAPTOP_OFFSET),result={...source};
 for(const key of ['hinge','screenCenter'])result[key]=move(source[key]);
 for(const key of ['baseBottom','baseTop','lidOuter','lidInner','screen','screenQuad','vertices'])result[key]=source[key].map(move);
 for(const key of ['baseSides','lidSides'])result[key]=source[key].map(face=>face.map(move));
 result.lidPoint=(...args)=>move(source.lidPoint(...args));
 return result;
}
const closed=placedLaptopWorldCoordinates({opening:0});
const hull=convexHull(closed.vertices.map(CAMERA.project));
const anchor=CAMERA.project(LAPTOP_CENTER);
export const LAPTOP_TARGET={anchor,polygon:hull.map(p=>p.map((v,i)=>anchor[i]+(v-anchor[i])*1.065))};

// Registered tabletop surface, broad enough for the moved laptop's long cast.
// All vertices stay on the real table; fading happens per fragment, never as
// a second polygon laid over the painting. This does not move room receivers.
export const LAPTOP_SHADOW_PATCH=[[388,592],[719,559],[803,574],[829,624],[413,673]];
export const LAPTOP_SHADOW_FADE_GLSL=LAPTOP_SHADOW_PATCH.map((a,i)=>{
 const b=LAPTOP_SHADOW_PATCH[(i+1)%LAPTOP_SHADOW_PATCH.length];
 const edge=`edgeDistance(vec2(${a.map(n=>n.toFixed(1)).join(',')}),vec2(${b.map(n=>n.toFixed(1)).join(',')}),receiverPixel)`;
 return i?`edge=min(edge,${edge});`:`float edge=${edge};`;
}).join('\n')+'\ngl_FragColor.a*=smoothstep(0.,18.,edge);';
