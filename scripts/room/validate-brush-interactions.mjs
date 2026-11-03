import assert from 'node:assert/strict';
import * as THREE from '../../public/vendor/three.module.js';
import {createSillIconMotion} from '../../public/brush-study-icons.js';
import {portfolio} from '../../public/content.js';
import {existsSync} from 'node:fs';
import {createWashField,createSplatField,washCoverage,eraseCoverage} from '../../public/brush-study-wash.js';

const motion=createSillIconMotion({THREE});
const step=(frames=90)=>{for(let i=0;i<frames;i++)motion.update(1/60);};
motion.hover(1,true);step();
assert.ok(Math.abs(motion.getPose(1).lift-2.2)<.05,'A small painted lift stays beneath the watercolor feedback');
motion.focus(1,true);motion.hover(1,false);step();
assert.ok(motion.getPose(1).lift>2.19,'Keyboard focus retains attention after pointer leaves');
motion.press(1);motion.update(1/60);
assert.ok(motion.getPose(1).press>.7,'Click starts a visible press response');
motion.focus(1,false);step(180);
assert.ok(Math.abs(motion.getPose(1).lift)<.01,'Plaque settles back to its original foot');
assert.ok(Math.abs(motion.getPose(1).angle)<.001);
const reduced=createSillIconMotion({THREE,reduced:true});
reduced.hover(0,true);reduced.focus(0,true);reduced.press(0);reduced.update(.05);
assert.equal(reduced.getPose(0).lift,0);assert.equal(reduced.getPose(0).angle,0);assert.equal(reduced.getPose(0).press,0);
assert.equal(reduced.getPose(0).wet,0);assert.equal(reduced.getPose(0).bloom,0);
step(240);assert.equal(motion.getPose(1).wet,0,'Temporary wet pigment dries completely');
motion.hover(1,true);assert.equal(motion.getPose(1).wet,1,'A new visit rewets the original paint');
for(const [width,height] of [[96,64],[64,96]]){
 const wash=createWashField(width,height,{origin:{x:.23,y:.67},seed:8});
 let fractional=0,painted=0,clear=0;
 for(let i=0;i<wash.field.length;i++){
  assert.equal(washCoverage(wash.field[i],wash.grain[i],0),0);
  assert.equal(washCoverage(wash.field[i],wash.grain[i],1),1);
  const coverage=washCoverage(wash.field[i],wash.grain[i],.4);
  assert.ok(Number.isFinite(coverage)&&coverage>=0&&coverage<=1);
  if(coverage>.01&&coverage<.99)fractional++;if(coverage>.9)painted++;if(coverage<.05)clear++;
 }
 assert.ok(fractional>100&&painted>100&&clear>100,'Wet fronts contain paint, feathering and unpainted paper');
}
function islandSizes(mask,width,diagonal=false){
 const visited=new Uint8Array(mask.length),sizes=[];
 for(let i=0;i<mask.length;i++){
  if(!mask[i]||visited[i])continue;
  visited[i]=1;const stack=[i];let size=0;
  while(stack.length){
   const pixel=stack.pop();size++;
   const neighbours=[pixel%width?pixel-1:-1,pixel%width<width-1?pixel+1:-1,pixel>=width?pixel-width:-1,pixel<mask.length-width?pixel+width:-1];
   if(diagonal){
    if(pixel>=width){if(pixel%width)neighbours.push(pixel-width-1);if(pixel%width<width-1)neighbours.push(pixel-width+1);}
    if(pixel<mask.length-width){if(pixel%width)neighbours.push(pixel+width-1);if(pixel%width<width-1)neighbours.push(pixel+width+1);}
   }
   for(const next of neighbours)if(next>=0&&mask[next]&&!visited[next]){visited[next]=1;stack.push(next);}
  }
  sizes.push(size);
 }
 return sizes.sort((a,b)=>b-a);
}
// Test the actual reveal seeds at both wide and narrow screen proportions.
// Disconnected early islands distinguish a landed splat from a round wipe.
for(const [width,height,seed] of [[256,160,23],[128,256,23],[192,128,42]]){
 const origin={x:.5,y:.47},splat=createSplatField(width,height,{origin,seed});
 const repeated=createSplatField(width,height,{origin,seed}),different=createSplatField(width,height,{origin,seed:seed+1});
 assert.ok(splat.field.every((value,i)=>value===repeated.field[i])&&splat.grain.every((value,i)=>value===repeated.grain[i]),'A splat seed keeps its contour and grain stable between renders');
 assert.ok(splat.field.some((value,i)=>value!==different.field[i]),'Different layers receive distinct painted contours');
 const mask=new Uint8Array(width*height);let painted=0;
 for(let i=0;i<splat.field.length;i++){
  assert.ok(Number.isFinite(splat.field[i])&&splat.field[i]>=0&&splat.field[i]<=1);
  assert.ok(Number.isFinite(splat.grain[i])&&splat.grain[i]>=0&&splat.grain[i]<=1);
  assert.equal(washCoverage(splat.field[i],splat.grain[i],0),0,'An entering desktop layer starts completely transparent');
  assert.equal(washCoverage(splat.field[i],splat.grain[i],1),1,'Every desktop pixel is opaque after the paint settles');
  mask[i]=washCoverage(splat.field[i],splat.grain[i],.2)>.35;painted+=mask[i];
  if(i%17===0){
   let previous=0;
   for(let step=0;step<=40;step++){
    const coverage=washCoverage(splat.field[i],splat.grain[i],step/40);
    assert.ok(coverage>=previous-1e-9&&coverage<=1,'Painted content stays revealed while the wet front dries');previous=coverage;
   }
  }
 }
 const islands=islandSizes(mask,width);
 assert.ok(islands.length>1&&islands.slice(1).some(size=>size>=6),'Early paint has visible satellite islands separated from the main impact');
 assert.ok(painted>splat.field.length*.01&&painted<splat.field.length*.30,'The initial impact leaves most surrounding paper clear');
 const radii=[];
 for(let angle=0;angle<32;angle++){
  const theta=angle/32*Math.PI*2;let radius=0;
  for(let step=1;step<=150;step++){
   const reach=step*.004,u=origin.x+Math.cos(theta)*reach/(width/height),v=origin.y+Math.sin(theta)*reach;
   const x=Math.round(u*(width-1)),y=Math.round(v*(height-1));
   if(x<0||y<0||x>=width||y>=height||!mask[y*width+x])break;
   radius=reach;
  }
  radii.push(radius);
 }
 assert.ok(Math.min(...radii)>0&&Math.max(...radii)>Math.min(...radii)*1.5,'Impact fingers have uneven angular reach rather than a circular radius');
}
// The laptop's black-to-paint passage begins as one central impact. Its
// lobed expansion has no visible early satellite drops on wide or tall art.
for(const [width,height,seed] of [[256,160,23],[128,256,23],[192,128,42]]){
 const origin={x:.5,y:.5},bloom=createSplatField(width,height,{origin,seed,satellites:false});
 const repeat=createSplatField(width,height,{origin,seed,satellites:false});
 const ordinary=createSplatField(width,height,{origin,seed}),explicit=createSplatField(width,height,{origin,seed,satellites:true});
 assert.ok(ordinary.field.every((value,i)=>value===explicit.field[i]),'Existing splat callers retain their satellite behavior');
 assert.ok(bloom.field.every((value,i)=>value===repeat.field[i]),'Centered bloom boundaries are deterministic');
 let previousArea=0;
 for(const progress of [.01,.08,.16,.24,.4,.65]){
  const mask=Uint8Array.from(bloom.field,(arrival,i)=>washCoverage(arrival,bloom.grain[i],progress)>.02);
  const islands=islandSizes(mask,width,true),area=mask.reduce((sum,value)=>sum+value,0);
  assert.equal(islands.length,1,'A bloom reveals one connected impact without isolated pixels or satellite dots');
  assert.ok(area>=previousArea,'Centered paint expands continuously outward');previousArea=area;
  if(progress===.01){
   assert.ok(area>0&&area<bloom.field.length*.005,'The first paint mark remains a small central point');
   for(let i=0;i<mask.length;i++)if(mask[i]){
    const radius=Math.hypot(((i%width)/(width-1)-.5)*width/height,Math.floor(i/width)/(height-1)-.5);
    assert.ok(radius<.04,'No initial paint starts away from the screen center');
   }
  }
 }
 const bloomRadii=[];
 for(let angle=0;angle<32;angle++){
  const theta=angle/32*Math.PI*2;let radius=0;
  for(let step=1;step<=150;step++){
   const reach=step*.004,u=origin.x+Math.cos(theta)*reach/(width/height),v=origin.y+Math.sin(theta)*reach;
   const x=Math.round(u*(width-1)),y=Math.round(v*(height-1));
   if(x<0||y<0||x>=width||y>=height)break;
   const i=y*width+x;if(washCoverage(bloom.field[i],bloom.grain[i],.24)<=.02)break;
   radius=reach;
  }
  bloomRadii.push(radius);
 }
 assert.ok(Math.min(...bloomRadii)>0&&Math.max(...bloomRadii)>Math.min(...bloomRadii)*1.25,'A connected bloom keeps an uneven positive brush-front reach');
 for(let i=0;i<bloom.field.length;i++){
  assert.equal(washCoverage(bloom.field[i],bloom.grain[i],0),0);
  assert.equal(washCoverage(bloom.field[i],bloom.grain[i],1),1);
  assert.equal(eraseCoverage(bloom.field[i],bloom.grain[i],0),1);
  assert.equal(eraseCoverage(bloom.field[i],bloom.grain[i],1),0);
  if(i%17===0){
   let previous=0,previousErase=1;
   for(let step=0;step<=40;step++){
    const coverage=washCoverage(bloom.field[i],bloom.grain[i],step/40);
    assert.ok(coverage>=previous-1e-9&&coverage<=1,'The centered impact retains revealed pixels as it dries');previous=coverage;
    const erasing=eraseCoverage(bloom.field[i],bloom.grain[i],step/40);
    assert.ok(erasing<=previousErase+1e-9&&erasing>=0,'An advancing erased hole never restores covered pixels');previousErase=erasing;
   }
  }
 }
 const center=Math.floor(height/2)*width+Math.floor(width/2),middleErase=i=>eraseCoverage(bloom.field[i],bloom.grain[i],.35);
 assert.equal(middleErase(center),0,'The central pigment hole is clear at mid-progress');
 for(const corner of [0,width-1,width*(height-1),width*height-1])assert.equal(middleErase(corner),1,'A central erase leaves the outside opaque until the frontier arrives');
}
assert.equal(eraseCoverage(.5,.9,.515),0,'Erased pixels have no residual airbrush haze after the edge passes');
assert.ok(Math.abs(eraseCoverage(.5,.1,.5)-eraseCoverage(.5,.9,.5))>.5,'Paper grain breaks up the local wet edge without moving its texture');
// Measure the visible 5–95% frontier after the same bilinear sampling used
// by a normal1416×900 display of its480×305 mask. The old broad coverage
// interval exceeded this range; erase keeps a3–12 CSS-pixel wet edge.
{
 const width=480,height=305,bloom=createSplatField(width,height,{origin:{x:.5,y:.5},seed:23,satellites:false});
 const alphaAt=(x,y,progress)=>{
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  if(ix<0||ix>=width-1||iy<0||iy>=height-1)return null;
  const at=(dx,dy)=>eraseCoverage(bloom.field[(iy+dy)*width+ix+dx],bloom.grain[(iy+dy)*width+ix+dx],progress);
  return (at(0,0)*(1-fx)+at(1,0)*fx)*(1-fy)+(at(0,1)*(1-fx)+at(1,1)*fx)*fy;
 };
 for(const progress of [.2,.35])for(let angle=0;angle<8;angle++){
  const theta=angle/8*Math.PI*2;let fractional=0;
  for(let radius=0;radius<550;radius+=.125){
   const coverage=alphaAt((width-1)/2+Math.cos(theta)*radius,(height-1)/2+Math.sin(theta)*radius,progress);
   if(coverage===null)break;if(coverage>.05&&coverage<.95)fractional++;
  }
  const cssWidth=fractional*.125*1416/width;
  assert.ok(cssWidth>=3&&cssWidth<=12,`Erase wet edge is narrow at a normal viewport: ${cssWidth}px`);
 }
}
assert.equal(motion.hover(4,true),false);assert.equal(motion.getPose(-1),null);
assert.ok(portfolio.timeline.length>=6&&portfolio.projects.length>=7);
assert.equal(new Set(portfolio.contributions.map(item=>item.url)).size,31);
assert.ok(portfolio.contributions.every(item=>/^https:\/\/github.com\/[^/]+\/[^/]+\/pull\/\d+$/.test(item.url)));
assert.ok(portfolio.contributions.every(item=>['Merged','Open','Closed'].includes(item.tags[0])));
assert.ok(portfolio.resume.sections.length===6);
assert.ok(existsSync(new URL('../../public'+portfolio.resume.url,import.meta.url)),'Original resume is served locally');
assert.equal(portfolio.contacts.github,'https://github.com/INo-xious');
assert.equal(portfolio.contacts.linkedin,'https://www.linkedin.com/in/marvel-harisson/');
console.log('PASS: wet pigment decay, focus ownership, paint-matte endpoints/feathering, deterministic splat islands/radii, centered bloom without satellite dots, monotonic coverage, reduced motion, and populated folder sources.');
