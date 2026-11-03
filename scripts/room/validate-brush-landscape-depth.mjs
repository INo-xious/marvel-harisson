import assert from 'node:assert/strict';
import {sampleLandscapeDepth,landscapeDepthPoint,landscapeDepthSourcePoint,LANDSCAPE_DEPTH_RESERVE,LANDSCAPE_DEPTH_SOURCE} from '../../public/brush-study-landscape-depth.js';
import {sampleLaptopPortal} from '../../public/brush-study-laptop-landscape.js';
import {sampleShoreline} from '../../public/brush-study-shoreline-timing.js';
import {createDesktopLandscape} from '../../public/brush-study-desktop-landscape.js';

let checks=0;
const check=(value,note)=>{assert.ok(value,note);checks++;};
const names=['sky','mountains','lake','shoreline','foreground'];
const beginning=sampleLandscapeDepth(0),entered=sampleLandscapeDepth(1);
const layer=(pose,name)=>pose.layers.find(item=>item.name===name);
assert.deepEqual(beginning.layers.map(item=>item.name),names);checks++;
check(beginning.progress===0&&entered.progress===1,'Forward travel has exact native-screen and entered-desktop endpoints');
check(beginning.layers.every(item=>item.scale===1&&item.x===0&&item.y===0),'The journey begins on the unchanged native painting');
assert.deepEqual(sampleLandscapeDepth(-2),beginning);checks++;
assert.deepEqual(sampleLandscapeDepth(3),entered);checks++;

let previous=beginning;
for(let step=0;step<=200;step++){
 const progress=step/200,pose=sampleLandscapeDepth(progress);
 assert.deepEqual(pose,sampleLandscapeDepth(progress));checks++;
 assert.deepEqual(pose.layers.map(item=>item.name),names);checks++;
 check(pose.anchor.length===2&&pose.anchor.every(value=>Number.isFinite(value)&&value>0&&value<1),'Every depth surface uses a finite vanishing point inside the painting');
 check(Number.isFinite(pose.progress)&&pose.progress>=0&&pose.progress<=1,'Sampled travel remains normalized');
 for(const item of pose.layers){
  check([item.x,item.y,item.scale].every(Number.isFinite)&&item.scale>0,'Layer transforms remain finite and retain physical orientation');
  check(item.scale>=.8&&item.scale<=1.6,'Depth changes preserve the painted composition instead of explosively scaling a layer');
  check(Math.abs(item.x)<=200&&Math.abs(item.y)<=200,'Native translations remain restrained relative to the source painting');
  check(!Object.hasOwn(item,'opacity'),'Forward depth uses geometry rather than fading away foreground pigment');
 }
 check(layer(pose,'foreground').scale>=layer(previous,'foreground').scale,'Near foliage grows continuously as the viewer passes it');
 if(progress>0){
  check(layer(pose,'foreground').scale>layer(pose,'shoreline').scale,'Foreground passes faster than the shoreline');
  check(layer(pose,'shoreline').scale>layer(pose,'lake').scale,'Shoreline passes faster than the lake');
  check(layer(pose,'lake').scale>layer(pose,'mountains').scale,'Distant mountains resist the near landscape travel');
 }
 const still=sampleLandscapeDepth(progress,{reduced:true});
 const finalStill=sampleLandscapeDepth(1,{reduced:true});
 assert.deepEqual(still.layers,finalStill.layers);checks++;
 assert.deepEqual(still.anchor,finalStill.anchor);checks++;
 previous=pose;
}
check(layer(entered,'foreground').scale>1.2&&layer(entered,'shoreline').scale>1.05,'The completed journey produces a visible passage past near foliage and shoreline');
check(layer(entered,'mountains').scale<1.05&&layer(entered,'sky').scale<1.05,'Sky and mountains stay distant while foreground geography advances');

// Compare the movement of a common off-center source point. Applying the
// returned transforms measures actual perspective displacement, rather than
// merely asserting a preferred list of depth constants.
const point=[1200,860],displacement=name=>{
 const from=landscapeDepthPoint(layer(beginning,name),point),to=landscapeDepthPoint(layer(entered,name),point);
 return Math.hypot(to[0]-from[0],to[1]-from[1]);
};
check(displacement('foreground')>displacement('shoreline'),'A native foreground feature travels farther than a shoreline feature');
check(displacement('foreground')>displacement('mountains')*2,'Near landscape motion is materially stronger than the mountain motion');
assert.deepEqual(sampleLandscapeDepth(1),entered);checks++;
assert.deepEqual(sampleLandscapeDepth(0),beginning);checks++;
for(const invalid of [NaN,Infinity,-Infinity,undefined]){
 const pose=sampleLandscapeDepth(invalid);
 check(Number.isFinite(pose.progress)&&pose.layers.every(item=>[item.x,item.y,item.scale].every(Number.isFinite)),'Invalid travel input cannot produce broken paint transforms');
}

for(let step=0;step<=20;step++)for(const item of sampleLandscapeDepth(step/20).layers)for(const point of [[0,0],[1586,992],[951.6,396.8],[120,254],[731,727]]){
 const returned=landscapeDepthSourcePoint(item,landscapeDepthPoint(item,point));
 check(returned.every((value,axis)=>Number.isFinite(value)&&Math.abs(value-point[axis])<1e-7),'Forward and inverse geography mapping preserve native pigment coordinates');
}

// These sites follow the painted peninsula's actual upper and lower fringe.
// The mountain reserve beneath it must cover the combined forward travel
// and independently moving portal layers, including the dry backing fringe.
const shoreSites=[[120,254],[317,307],[541,339],[777,385],[982,404],[644,498]];
const foregroundSites=[[249,586],[451,688],[731,727],[970,841]];
const portalInputs=[{eye:[0,0,1800],pointer:[0,0]},{eye:[85,-48,1800],pointer:[1,-1]},{eye:[240,-120,400],pointer:[-1,1]},{eye:[1e8,-1e8,.01],pointer:[1,1]},{eye:[-240,120,400],pointer:[-1,-1]}];
let greatestReserveUse=0;
for(let elapsed=0;elapsed<=1600;elapsed+=20)for(const input of portalInputs){
 const timing=sampleShoreline('enter',elapsed),pose=sampleLandscapeDepth(timing.travel),weight=1-timing.expansion;
 const portal=sampleLaptopPortal({...input,homeEye:[0,0,1800],hover:1,time:elapsed/1000});
 const warped=(name,point)=>{
  const item=layer(pose,name),offset=portal.find(item=>item.name===name),destination=landscapeDepthPoint(item,point);
  return destination.map((value,axis)=>value-(axis?offset.y:offset.x)*weight*item.scale);
 };
 const sourceUnder=(name,point)=>{
  const source=landscapeDepthSourcePoint(layer(pose,name),point),offset=portal.find(item=>item.name===name);
  return source.map((value,axis)=>value+(axis?offset.y:offset.x)*weight);
 };
 for(const point of shoreSites){
  const beneath=sourceUnder('mountains',warped('shoreline',point));
  const use=Math.abs(beneath[0]-point[0])+Math.abs(beneath[1]-point[1]);greatestReserveUse=Math.max(greatestReserveUse,use);
  check(use<=LANDSCAPE_DEPTH_RESERVE-16,'The native reserve budget contains the computed source displacement at sampled shoreline fringe sites');
 }
 for(const point of foregroundSites){
  const destination=warped('foreground',point);
  if(destination[0]<0||destination[0]>LANDSCAPE_DEPTH_SOURCE.width||destination[1]<0||destination[1]>LANDSCAPE_DEPTH_SOURCE.height)continue;
  const beneath=sourceUnder('lake',destination);
  check(beneath[0]>=0&&beneath[0]<=LANDSCAPE_DEPTH_SOURCE.width&&beneath[1]>=425&&beneath[1]<=LANDSCAPE_DEPTH_SOURCE.height,'Visible foreground sites continue sampling inside the below-horizon native lake domain');
 }
}
check(greatestReserveUse>56,'The depth journey exercises wider hidden reserves than the older room-only parallax');

// A synthetic opaque sky exercises the real surface-selection lifecycle.
// Geography checks above use native fringe sites; this fixture checks that
// settling does not swap wide clean reserves back to the old 14px surfaces.
const globals={document:globalThis.document,Image:globalThis.Image,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
const tasks=new Map(),frames=new Map();let nextTask=0;
function makeStyle(){return {setProperty(name,value){this[name]=value;},removeProperty(name){delete this[name];}};}
function element(tag){
 const node={tag,style:makeStyle(),dataset:{},children:[],parentElement:null,clientWidth:1080,clientHeight:720,setAttribute(){},classList:{add(){}}};
 node.remove=()=>{if(node.parentElement){const siblings=node.parentElement.children;siblings.splice(siblings.indexOf(node),1);node.parentElement=null;}};
 node.append=child=>{child.remove();child.parentElement=node;node.children.push(child);};
 node.replaceWith=replacement=>{const parent=node.parentElement;if(!parent)return;const index=parent.children.indexOf(node);replacement.remove();parent.children[index]=replacement;replacement.parentElement=parent;node.parentElement=null;};
 if(tag==='canvas'){
  node.width=node.height=0;let sourceDrawn=false;
  const context={
   beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},
   drawImage(){sourceDrawn=true;},
   createImageData(width,height){return {width,height,data:new Uint8ClampedArray(width*height*4)};},
   getImageData(x,y,width,height){const data=new Uint8ClampedArray(width*height*4);if(sourceDrawn)new Uint32Array(data.buffer).fill(0xffa0b4c8);return {width,height,data};},
   putImageData(){},
  };
  node.getContext=()=>context;
 }
 return node;
}
globalThis.document={createElement:tag=>element(tag)};
globalThis.Image=class {
 constructor(){
  const node=element('img');node.complete=false;node.naturalWidth=0;
  Object.defineProperty(node,'src',{set(value){node.source=value;node.complete=true;node.naturalWidth=1586;node.naturalHeight=992;node.onload?.();}});
  return node;
 }
};
globalThis.requestAnimationFrame=callback=>{const id=++nextTask;frames.set(id,callback);return id;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
globalThis.setTimeout=callback=>{const id=++nextTask;tasks.set(id,callback);return id;};
globalThis.clearTimeout=id=>tasks.delete(id);
const landscape=createDesktopLandscape();
await landscape.ready;
const originalSurfaces=[...landscape.element.children];
const physicalPaint=()=>{
 const draws=[],context={save(){},restore(){},setTransform(){},clearRect(){},fillRect(){},drawImage(...args){draws.push(args);}};
 check(landscape.paintTo(context,640,400),'The physical laptop can still paint its native landscape');return draws;
};
const beforeTravel=physicalPaint();
landscape.setTravel(1);
while(tasks.size){const [id,callback]=tasks.entries().next().value;tasks.delete(id);callback();}
const cleanSurfaces=landscape.getPortalLayers().map(item=>item.canvas);
check(cleanSurfaces.length===5&&cleanSurfaces.every(canvas=>canvas.parentElement===landscape.element),'Forward travel selects all five expanded clean painting surfaces');
check(originalSurfaces.every(canvas=>!landscape.element.children.includes(canvas)),'The entered composition no longer uses the narrow room-only backing surfaces');
assert.deepEqual(landscape.getDepthPose(),entered);checks++;
const settledTransforms=cleanSurfaces.map(canvas=>canvas.style.transform);
landscape.setPortalPose(null,0);
check(landscape.getTravel()===1&&cleanSurfaces.every(canvas=>canvas.parentElement===landscape.element),'Settling the desktop keeps the full journey and wide reserves when portal pointer weight reaches zero');
assert.deepEqual(landscape.getDepthPose(),entered);checks++;
assert.deepEqual(cleanSurfaces.map(canvas=>canvas.style.transform),settledTransforms);checks++;
assert.deepEqual(physicalPaint(),beforeTravel);checks++;
landscape.setTravel(0);
assert.deepEqual(landscape.getDepthPose(),beginning);checks++;
check(originalSurfaces.every(canvas=>canvas.parentElement===landscape.element),'Returning to the laptop restores its original room painting surfaces');
landscape.setTravel(1);
assert.deepEqual(cleanSurfaces.map(canvas=>canvas.style.transform),settledTransforms);checks++;
check(cleanSurfaces.every(canvas=>canvas.parentElement===landscape.element),'A second visit reuses the same isolated clean layers');
for(const [input,expected] of [[-1,0],[2,1],[NaN,0],[Infinity,0]]){landscape.setTravel(input);check(landscape.getTravel()===expected,'The runtime travel API clamps invalid or outside input safely');}
// Inspect the actual runtime's CSS transforms and mask offsets. At rest,
// horizon-driven zoom may move a layer far sideways, but its broken paint
// perimeter stays near the paper center. Pointer motion must still survive.
function projectedPaintEdge(canvas){
 const translation=/^translate3d\(([-\d.]+)px,([-\d.]+)px,0\) scale\(([^)]+)\)$/.exec(canvas.style.transform);
 check(Boolean(translation),'The real painting surface has an inspectable finite perspective transform');
 const x=Number(translation[1]),scale=Number(translation[3]),offset=parseFloat(canvas.style['--layer-edge-offset-x']);
 check([x,scale,offset].every(Number.isFinite)&&scale>0,'Projected paint-edge geometry stays finite');
 return {center:x+offset*scale,translation:x,offset};
}
for(const [width,height] of [[1080,720],[760,500],[370,680]]){
 landscape.element.clientWidth=width;landscape.element.clientHeight=height;
 landscape.setPassageDepth(0,0);landscape.setTravel(1);landscape.setPortalPose(null,0);
 const neutralEdges=cleanSurfaces.map(projectedPaintEdge);
 check(neutralEdges.every(edge=>Math.abs(edge.center)<=width*.015+.001),'Neutral painted perimeters stay within 1.5 percent of the paper center across desktop, landscape and phone layouts');
 check(Math.abs(neutralEdges[4].translation)>width*.015+1,'Near foliage retains its full forward-travel geometry while only the paint perimeter is centered');
 landscape.setPassageDepth(.65,-.4);
 const pointerEdges=cleanSurfaces.map(projectedPaintEdge),motion=pointerEdges.map((edge,i)=>edge.center-neutralEdges[i].center);
 check(motion.every(value=>value>0),'Perimeter centering preserves independent pointer movement on every painted layer');
 check(motion[4]>motion[3]&&motion[3]>motion[1],'Near paint edges still respond more strongly than distant mountain edges');
 check(pointerEdges.every((edge,i)=>edge.offset===neutralEdges[i].offset),'The mask compensates geometric horizon drift without cancelling living pointer motion');
}
// An atomic journey update must produce the same mounted painting as the
// former individual setters, with one layout sample instead of four.
const journeyPortal=sampleLaptopPortal({eye:[85,-48,1400],homeEye:[0,0,1800],pointer:[.6,-.3],hover:1,time:2});
Object.defineProperty(journeyPortal,'portalScale',{value:1.049});
const journey={travel:.63,aspect:1.4,portalPose:journeyPortal,portalWeight:.48,depthX:.32,depthY:-.27};
const legacyJourney=state=>{
 landscape.setPassageAspect(state.aspect);landscape.setTravel(state.travel);
 landscape.setPortalPose(state.portalPose,state.portalWeight);landscape.setPassageDepth(state.depthX,state.depthY);
};
const baseline={travel:0,aspect:null,portalPose:null,portalWeight:0,depthX:0,depthY:0};
const snapshot=()=>({travel:landscape.getTravel(),pose:landscape.getDepthPose(),surfaces:landscape.element.children.map(canvas=>({name:canvas.dataset.landscapeLayer,transform:canvas.style.transform,left:canvas.style.left,top:canvas.style.top,width:canvas.style.width,height:canvas.style.height,scale:canvas.style['--layer-depth-scale'],offsetX:canvas.style['--layer-edge-offset-x'],offsetY:canvas.style['--layer-edge-offset-y']}))});
legacyJourney(baseline);legacyJourney(journey);
const sequential=snapshot();legacyJourney(baseline);
let widthReads=0,heightReads=0;
const layoutWidth=landscape.element.clientWidth,layoutHeight=landscape.element.clientHeight;
Object.defineProperty(landscape.element,'clientWidth',{configurable:true,get(){widthReads++;return layoutWidth;}});
Object.defineProperty(landscape.element,'clientHeight',{configurable:true,get(){heightReads++;return layoutHeight;}});
landscape.setJourney(journey);
check(widthReads===1&&heightReads===1,'An atomic journey reads the painting layout once per update');
assert.deepEqual(snapshot(),sequential);checks++;
landscape.setJourney({depthX:-.32});
check(landscape.getTravel()===journey.travel,'A partial atomic update preserves travel and mounted depth');
landscape.setJourney({depthX:.32});
assert.deepEqual(snapshot(),sequential);checks++;
const nullPortal={travel:1,aspect:null,portalPose:null,portalWeight:.9,depthX:0,depthY:0};
landscape.setJourney(nullPortal);const atomicCleared=snapshot();
check(landscape.getTravel()===1&&cleanSurfaces.every(canvas=>canvas.parentElement===landscape.element),'An explicit null portal clears its pointer contribution while keeping the fully entered painting and wide reserves');
legacyJourney(nullPortal);assert.deepEqual(snapshot(),atomicCleared);checks++;
landscape.setJourney({portalPose:null});assert.deepEqual(snapshot(),atomicCleared);checks++;
Object.defineProperty(landscape.element,'clientWidth',{configurable:true,writable:true,value:layoutWidth});
Object.defineProperty(landscape.element,'clientHeight',{configurable:true,writable:true,value:layoutHeight});
landscape.dispose();check(tasks.size===0&&frames.size===0,'Disposal leaves no asynchronous reserve preparation or landscape animation pending');
for(const [name,value] of Object.entries(globals))if(value===undefined)delete globalThis[name];else globalThis[name]=value;

console.log(`Painted landscape depth: ${checks} travel geometry, sampled reserve bounds, runtime paint edges, lifecycle and reduced-motion checks pass; source texture appearance requires visual review.`);
