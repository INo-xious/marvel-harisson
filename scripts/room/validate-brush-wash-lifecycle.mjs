import assert from 'node:assert/strict';
import {watercolorReveal,cancelWatercolor} from '../../public/brush-study-wash.js';
import {domainRevealProgress} from '../../public/brush-study-domain.js';

let checks=0,now=100,nextFrame=1,nextImage=1;
const scheduled=new Map(),encodedMasks=new Map();
const styleNames=['maskImage','webkitMaskImage','maskSize','webkitMaskSize','maskRepeat','webkitMaskRepeat','maskPosition','webkitMaskPosition','position'];
function check(value,note){assert.ok(value,note);checks++;}
function originalStyle(){return {maskImage:'url("original-mask.png")',webkitMaskImage:'url("original-webkit-mask.png")',maskSize:'87% 91%',webkitMaskSize:'82% 92%',maskRepeat:'repeat-x',webkitMaskRepeat:'repeat-y',maskPosition:'left top',webkitMaskPosition:'right bottom',position:'static'};}
function makeElement(){
 const classes=new Set(['existing-marker']),element={style:originalStyle(),children:[],getBoundingClientRect(){return {left:17,top:22,width:240,height:96};}};
 element.classList={add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name)};
 element.append=child=>{child.parentElement=element;element.children.push(child);};
 return element;
}
function canvas(){
 let image=null;
 const node={style:{},parentElement:null,setAttribute(){},getContext(){return {
  createImageData(width,height){return {width,height,data:new Uint8ClampedArray(width*height*4)};},
  putImageData(value){image=value;}
 };},toDataURL(){
  let minimum=255,maximum=0,sumAlpha=0;
  for(let i=3;i<image.data.length;i+=4){minimum=Math.min(minimum,image.data[i]);maximum=Math.max(maximum,image.data[i]);sumAlpha+=image.data[i];}
  const url='data:image/png;mock,'+nextImage++;
  const at=(x,y)=>image.data[(y*image.width+x)*4+3];
  encodedMasks.set(url,{minimum,maximum,sumAlpha,pixels:image.data.length/4,center:at(Math.floor(image.width/2),Math.floor(image.height/2)),corners:[at(0,0),at(image.width-1,0),at(image.width-1,image.height-1),at(0,image.height-1)]});return url;
 },remove(){if(this.parentElement){this.parentElement.children=this.parentElement.children.filter(child=>child!==this);this.parentElement=null;}}};
 return node;
}
globalThis.document={createElement:()=>canvas()};
globalThis.getComputedStyle=element=>({position:element.style.position||'static'});
Object.defineProperty(globalThis,'performance',{configurable:true,value:{now:()=>now}});
globalThis.requestAnimationFrame=callback=>{const id=nextFrame++;scheduled.set(id,callback);return id;};
globalThis.cancelAnimationFrame=id=>scheduled.delete(id);
async function advance(time){
 now=time;const ids=[...scheduled.keys()];
 for(const id of ids){const callback=scheduled.get(id);if(!callback)continue;scheduled.delete(id);callback(time);}
 await Promise.resolve();
}
function alpha(element){
 const url=/^url\("(.+)"\)$/.exec(element.style.maskImage)?.[1];
 const stats=encodedMasks.get(url);assert.ok(stats,'A generated paint matte must be inspectable');return stats;
}
function restored(element,saved){
 for(const name of styleNames)check(element.style[name]===saved[name],`Cleanup restores the original ${name}`);
 check(element.classList.contains('existing-marker'),'Unrelated classes survive paint cleanup');
 check(!element.classList.contains('watercolor-lifting')&&!element.classList.contains('watercolor-revealing')&&!element.classList.contains('watercolor-erasing'),'Paint lifecycle classes are removed');
 check(element.children.length===0,'The wet pigment front is detached');
}

// A lift finishes before camera retreat does. Finishing must keep its last
// transparent raster, not restore the visible UI until explicit cleanup.
const heldElement=makeElement(),heldSaved={...heldElement.style};let heldResult=null;
const held=watercolorReveal(heldElement,{duration:100,lift:true,hold:true,kind:'splat'});
held.finished.then(result=>{heldResult=result;});
check(alpha(heldElement).minimum===255,'A lift begins with the existing painted content visible');
await advance(151);check(alpha(heldElement).minimum<255&&alpha(heldElement).maximum>0,'A lifted layer passes through a partially painted state');
await advance(201);
check(heldResult?.cancelled===false,'The held lift resolves its finished promise');
check(alpha(heldElement).maximum===0,'A completed held lift keeps every content pixel transparent');
check(heldElement.style.maskImage!==heldSaved.maskImage,'A held lift retains its transparent matte');
check(scheduled.size===0,'A completed held lift schedules no further animation frames');
await advance(450);check(alpha(heldElement).maximum===0,'The UI stays transparent during a longer camera retreat');
held.finish();check(alpha(heldElement).maximum===0,'Finishing an already held lift does not flash its UI back');
held.cancel();restored(heldElement,heldSaved);
const afterCleanup={...heldElement.style};held.cancel();
check(styleNames.every(name=>heldElement.style[name]===afterCleanup[name]),'Repeated cancellation is idempotent');
check(heldElement.children.length===0&&scheduled.size===0,'Repeated cancellation leaves no front or pending frame');

// Resizing may force an effect to finish before its natural end. The held
// result still persists, and the element-level cancellation can release it.
const forcedElement=makeElement(),forcedSaved={...forcedElement.style};let forcedResult=null;
const forced=watercolorReveal(forcedElement,{duration:300,lift:true,hold:true});
forced.finished.then(result=>{forcedResult=result;});forced.finish();await Promise.resolve();
check(forcedResult?.cancelled===false&&alpha(forcedElement).maximum===0,'Forced finish preserves a fully transparent held lift');
cancelWatercolor(forcedElement);restored(forcedElement,forcedSaved);

const normalElement=makeElement(),normalSaved={...normalElement.style};let normalResult=null;
const normal=watercolorReveal(normalElement,{duration:100,kind:'splat'});
normal.finished.then(result=>{normalResult=result;});
check(alpha(normalElement).maximum===0,'An ordinary reveal starts transparent');
await advance(501);check(alpha(normalElement).maximum>0,'An ordinary reveal develops visible paint');
await advance(551);check(normalResult?.cancelled===false,'An ordinary reveal finishes successfully');restored(normalElement,normalSaved);
normal.cancel();restored(normalElement,normalSaved);

// Construction prepares transparent mattes without beginning their clocks.
// All layers can then start from one epoch, independent of setup work time.
now=1000;const a=makeElement(),b=makeElement(),aSaved={...a.style},bSaved={...b.style},aFrames=[],bFrames=[];
const first=watercolorReveal(a,{deferred:true,duration:100,delay:0,onFrame:p=>aFrames.push(p)});
const second=watercolorReveal(b,{deferred:true,duration:100,delay:75,onFrame:p=>bFrames.push(p)});
check(typeof first.start==='function'&&typeof second.start==='function','Deferred reveals expose an explicit start method');
check(scheduled.size===0,'Deferred setup queues no animation frames');
await advance(1900);check(aFrames.length===1&&bFrames.length===1,'Deferred layers wait through setup time');
check(alpha(a).maximum===0&&alpha(b).maximum===0,'Waiting layers retain transparent starting mattes');
first.start(2000);second.start(2000);first.start(2600);
await advance(1999);check(aFrames.length===1&&bFrames.length===1,'A supplied future epoch is respected');
await advance(2050);
check(aFrames.at(-1)===.5,'First layer progress uses the common epoch');
check(bFrames.length===1&&alpha(b).maximum===0,'Delayed layer waits for its own delay after the common epoch');
await advance(2125);
check(bFrames.at(-1)===.5,'Second layer uses the same epoch plus its delay');restored(a,aSaved);
await advance(2175);restored(b,bSaved);
check(scheduled.size===0,'Completed deferred effects leave no pending frames');

// An erasing veil follows the advancing central bloom, so the center opens
// before the outside. Its clear result persists through a held transition.
const erasedElement=makeElement(),erasedSaved={...erasedElement.style};let erasedResult=null;
const erased=watercolorReveal(erasedElement,{duration:100,kind:'bloom',origin:{x:.5,y:.5},erase:true,hold:true});
erased.finished.then(result=>{erasedResult=result;});
check(alpha(erasedElement).minimum===255&&alpha(erasedElement).maximum===255,'An erase starts as a completely opaque veil');
check(erasedElement.classList.contains('watercolor-erasing'),'Erase has its own lifecycle class without reveal/lift filter animation');
await advance(2210);
const opening=alpha(erasedElement);
check(opening.center===0,'An advancing bloom clears the center first');
check(opening.corners.every(value=>value===255),'Outer corners remain opaque while the central hole opens');
await advance(2276);
check(erasedResult?.cancelled===false,'Held erase resolves its finished promise');
check(alpha(erasedElement).maximum===0,'Held erase ends completely transparent');
await advance(2450);erased.finish();
check(alpha(erasedElement).maximum===0,'A completed erasing veil remains transparent until explicit cleanup');
erased.cancel();restored(erasedElement,erasedSaved);erased.cancel();restored(erasedElement,erasedSaved);

const forcedEraseElement=makeElement(),forcedEraseSaved={...forcedEraseElement.style};
const forcedErase=watercolorReveal(forcedEraseElement,{kind:'bloom',erase:true,hold:true,deferred:true});
forcedErase.finish();await Promise.resolve();
check(alpha(forcedEraseElement).maximum===0,'Forced erase completion keeps the transparent end mask');
cancelWatercolor(forcedEraseElement);restored(forcedEraseElement,forcedEraseSaved);

const quietElement=makeElement(),quietSaved={...quietElement.style};
const quiet=watercolorReveal(quietElement,{reduced:true,deferred:true,lift:true,hold:true});
await quiet.finished;restored(quietElement,quietSaved);
check(scheduled.size===0,'Reduced motion creates no paint animation');

// Curved disclosure and its native pressure overlay share raw timed progress.
// The curve must change only the matte's advance, not that callback clock.
now=3000;
const linearElement=makeElement(),curvedElement=makeElement(),linearSaved={...linearElement.style},curvedSaved={...curvedElement.style};
const linearFrames=[],curvedFrames=[],options={duration:1000,kind:'bloom',origin:{x:.5,y:.5},seed:23,erase:true,hold:true};
const linear=watercolorReveal(linearElement,{...options,onFrame:p=>linearFrames.push(p)});
const curved=watercolorReveal(curvedElement,{...options,progressCurve:domainRevealProgress,onFrame:p=>curvedFrames.push(p)});
check(alpha(linearElement).minimum===255&&alpha(curvedElement).minimum===255,'Linear and curved erases have the same exact opaque start');
await advance(3200);
check(alpha(curvedElement).sumAlpha<alpha(linearElement).sumAlpha,'At equal timed progress the pressure curve advances the actual mask farther');
check(linearFrames.at(-1)===.2&&curvedFrames.at(-1)===.2,'onFrame keeps raw timed progress while the mask uses shaped progress');
check(curvedFrames.at(-1)!==domainRevealProgress(.2),'The pressure overlay callback must not receive the already-shaped mask progress');
await advance(4000);
check(alpha(linearElement).maximum===0&&alpha(curvedElement).maximum===0,'Curved and linear erases retain exact transparent held endpoints');
check(curvedFrames.at(-1)===1,'A curved effect reports the raw complete endpoint');
linear.cancel();curved.cancel();restored(linearElement,linearSaved);restored(curvedElement,curvedSaved);
const cancelledElement=makeElement(),cancelledSaved={...cancelledElement.style};let cancelledResult=null;
const cancelled=watercolorReveal(cancelledElement,{...options,progressCurve:domainRevealProgress});
cancelled.finished.then(result=>{cancelledResult=result;});await advance(4200);cancelled.cancel();await Promise.resolve();
check(cancelledResult?.cancelled===true,'A curved effect retains ordinary cancellation semantics while active');
restored(cancelledElement,cancelledSaved);check(scheduled.size===0,'Curve cancellation leaves no pending animation');

// The returning charcoal uses the same narrow pigment frontier as its lift,
// so a cover cannot regain the older broad blurred edge.
now=5000;
const dryElement=makeElement(),inverseElement=makeElement(),drySaved={...dryElement.style},inverseSaved={...inverseElement.style};
const frontierOptions={duration:1000,kind:'bloom',origin:{x:.5,y:.5},seed:23};
const dry=watercolorReveal(dryElement,{...frontierOptions,edge:'dry'});
const inverse=watercolorReveal(inverseElement,{...frontierOptions,erase:true});
check(alpha(dryElement).maximum===0&&alpha(inverseElement).minimum===255,'Cover and erase begin at complementary endpoints');
await advance(5300);
check(alpha(dryElement).center===255&&alpha(dryElement).corners.every(value=>value===0),'Returning charcoal starts at one point before reaching the edges');
check(Math.abs(alpha(dryElement).sumAlpha+alpha(inverseElement).sumAlpha-alpha(dryElement).pixels*255)<=alpha(dryElement).pixels,'The dry cover and erase share a complementary measured pigment frontier');
await advance(6000);restored(dryElement,drySaved);restored(inverseElement,inverseSaved);
check(scheduled.size===0,'Returning pigment leaves no pending frames');
console.log(`Paint wash lifecycle: ${checks} held-lift/erase, restoration, deferred-start and cleanup checks pass.`);
