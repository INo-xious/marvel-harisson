import assert from 'node:assert/strict';
import {SHORELINE_TIMING,sampleShoreline} from '../../public/brush-study-shoreline-timing.js';
import {shorelineCoverage,createShorelinePassage} from '../../public/brush-study-shoreline.js';

let checks=0;
const check=(value,note)=>{assert.ok(value,note);checks++;};
const near=(a,b,note,epsilon=1e-10)=>check(Math.abs(a-b)<=epsilon,note);
const sample=(mode,elapsed)=>sampleShoreline(mode,elapsed);

assert.deepEqual(SHORELINE_TIMING,{enter:{duration:1600,camera:1450,usable:1300},leave:{duration:1100,camera:980}});checks++;
for(const mode of ['enter','leave']){
 const {duration,camera}=SHORELINE_TIMING[mode];
 const initial=sample(mode,0),final=sample(mode,duration);
 check(initial.elapsed===0&&initial.progress===0&&initial.camera===0&&!initial.done,'A visit starts at the exact initial pose');
 check(final.elapsed===duration&&final.progress===1&&final.camera===1&&final.done,'A visit ends at its fixed duration');
 assert.deepEqual(sample(mode,-50),initial);checks++;
 assert.deepEqual(sample(mode,duration+500),final);checks++;
 for(const invalid of [NaN,Infinity,-Infinity,undefined,'300']){assert.deepEqual(sample(mode,invalid),initial);checks++;}
 let previous=initial;
 for(let elapsed=0;elapsed<=duration;elapsed+=5){
  const pose=sample(mode,elapsed);
  assert.deepEqual(pose,sample(mode,elapsed));checks++;
  for(const [key,value] of Object.entries(pose))if(typeof value==='number')check(Number.isFinite(value)&&value>=0&&value<=(key==='elapsed'?duration:1),`${key} remains finite and clamped`);
  check(pose.interior===1,'The landscape inside the display is never erased');
  check(pose.camera>=previous.camera,'The single camera curve never reverses');
  if(elapsed>0&&elapsed<camera)check(pose.camera>previous.camera,'The camera moves immediately without a staged pause');
  for(const field of ['expansion','paper','travel','shore','lake','sides','top','ui'])check(mode==='enter'?pose[field]>=previous[field]:pose[field]<=previous[field],`${field} advances monotonically in its direction`);
  previous=pose;
 }
 check(sample(mode,1).camera>0,'The first millisecond begins camera travel');
 check(sample(mode,camera).camera===1&&!sample(mode,camera).done,'Camera rests before the pigment tail finishes');
 near(sample(mode,camera-.1).camera,1,'Camera approaches its resting pose gently',1e-8);
}

for(const field of ['expansion','paper','travel','shore','lake','sides','top','ui']){
 check(sample('enter',0)[field]===0&&sample('enter',1600)[field]===1,`${field} has exact entering endpoints`);
 check(sample('leave',0)[field]===1&&sample('leave',1100)[field]===0,`${field} has exact returning endpoints`);
}
const lower=sample('enter',650),lake=sample('enter',760),side=sample('enter',880),upper=sample('enter',1050);
check(lower.shore>0&&lower.lake===0&&lower.sides===0&&lower.top===0,'Shoreline crosses the lower rim before the lake or side edges');
check(lake.shore>lake.lake&&lake.lake>0&&lake.sides===0,'Pale lake washes follow the lower shoreline');
check(side.shore>side.lake&&side.lake>side.sides&&side.sides>0&&side.top===0,'The side edge releases after the lower strokes');
check(upper.top>0&&upper.shore===1&&upper.lake>upper.top&&upper.sides>upper.top,'Upper corners linger after most lower paint arrives');
check(sample('enter',200).depth===0&&sample('enter',450).depth>0&&sample('enter',700).depth===1,'Independent depth develops between 200 and 700 ms');
check(sample('enter',1450).depth===0,'Directional arrival depth settles before the final paint tail');
check(!sample('enter',1299).usable&&sample('enter',1300).usable&&sample('enter',1300).ui===1&&!sample('enter',1300).done,'Folders are fully readable and usable by 1300 ms while paint continues settling');
check(sample('enter',900).expansion===0&&sample('enter',1100).expansion>0&&sample('enter',1450).expansion===1,'The painting stays on the growing physical aperture until the camera reaches its rim');
check(sample('enter',430).paper===0&&sample('enter',1240).paper===1,'Only the paper perimeter changes during the approach');
check(sample('leave',40).paper===1&&sample('leave',840).paper===0,'The return opens its surrounding paper before the camera finishes retreating');
check(sample('enter',180).travel===0&&sample('enter',600).travel>0&&sample('enter',1320).travel===1,'Forward travel establishes internal landscape depth before the shoreline crosses the laptop rim');
check(sample('leave',0).travel===1&&sample('leave',430).travel>0&&sample('leave',430).travel<1&&sample('leave',860).travel===0,'Retreat brings the landscape back to its native screen composition before camera settlement');

const recognition=sample('leave',300),breathing=sample('leave',420),reconnect=sample('leave',600),top=sample('leave',810);
check(recognition.recognition>0&&recognition.shore<1&&recognition.sides===1&&recognition.top===1,'A lower rim recognition gap opens before side or upper edges');
check(breathing.recognition===1&&breathing.sides===1&&breathing.top===1,'Recognition receives a short interval before side reconnection');
check(reconnect.shore===0&&reconnect.lake>0&&reconnect.sides<1&&reconnect.top===1,'Lower corners and sides reconnect while the upper painting remains');
check(top.sides===0&&top.top>0&&top.top<1,'Upper rim reveals after side containment');
check(sample('leave',920).top===0&&!sample('leave',920).done,'The upper edge returns before the final trace clears');
check(sample('leave',190).ui===0,'Returning folders stop covering the landscape early');
check(sample('leave',0).depth>0&&sample('leave',0).depth<1&&sample('leave',800).depth===0,'Return retains subtle living depth until late containment');
assert.deepEqual(sample('unknown',500),sample('enter',500));checks++;
check(Object.isFrozen(SHORELINE_TIMING)&&Object.isFrozen(SHORELINE_TIMING.enter)&&Object.isFrozen(SHORELINE_TIMING.leave),'Fixed visit timings cannot drift through accidental mutation');

// Exercise the actual raster coverage used by the controller. Timing values
// alone cannot prove that an interior remains visible or a wet front connects.
const core=[[.3,.25],[.7,.25],[.7,.75],[.3,.75]];
const quads=[core,[[.18,.17],[.76,.24],[.84,.81],[.25,.72]],[[.37,.16],[.62,.19],[.66,.84],[.34,.79]]];
const coverage=(mode,time,x,y,q=core)=>shorelineCoverage(x,y,q,sample(mode,time),mode==='leave');
const inQuad=(q,x,y)=>q.every((a,i)=>{const b=q[(i+1)%4];return (b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0])>=0;});
function pointInQuad(q,u,v){
 return [0,1].map(axis=>(q[0][axis]*(1-u)+q[1][axis]*u)*(1-v)+(q[3][axis]*(1-u)+q[2][axis]*u)*v);
}
for(const q of quads)for(const mode of ['enter','leave']){
 const {duration}=SHORELINE_TIMING[mode];
 for(let time=0;time<=duration;time+=25){
  for(let v=.05;v<1;v+=.15)for(let u=.05;u<1;u+=.15){
   const [x,y]=pointInQuad(q,u,v);
   check(coverage(mode,time,x,y,q)===1,'Actual paint coverage preserves every sampled interior pixel, including perspective views');
  }
  for(let y=.025;y<1;y+=.1)for(let x=.025;x<1;x+=.1){
   const alpha=coverage(mode,time,x,y,q);
   check(Number.isFinite(alpha)&&alpha>=0&&alpha<=1,'Actual coverage stays finite and clamped around perspective display edges');
   check(alpha===coverage(mode,time,x,y,q),'Native brush coverage repeats exactly at the same visit time');
  }
 }
}
check(coverage('enter',800,.5,.84)>.95&&coverage('enter',800,.2,.5)===0&&coverage('enter',800,.5,.1)===0,'The raster reveals lower outside paint before side or upper outside paint');
check(coverage('enter',1000,.2,.5)>.95&&coverage('enter',1000,.5,.1)===0,'Actual side paint follows the lower rim while the top remains reserved');
check(coverage('enter',750,.45,.79)>0,'The first shoreline has a connected lower extension');
for(let y=.025;y<.24;y+=.025)for(let x=.025;x<1;x+=.05)check(coverage('enter',750,x,y)===0,'A lower shoreline stroke cannot accidentally fill the opposite upper half-plane');

// Flood from the permanently visible display through its arriving outer
// washes. This includes the core as a bridge between distinct brush edges,
// but every outside pixel must be reachable: no detached splat dots.
const resolution=80;
for(const q of quads)for(const mode of ['enter','leave'])for(const time of mode==='enter'?[650,750,850,1000,1200,1450]:[0,250,350,500,650,800,1000]){
 const pose=sample(mode,time),mask=new Uint8Array(resolution*resolution),visited=new Uint8Array(mask.length),queue=[];
 for(let i=0;i<mask.length;i++){
  const x=(i%resolution+.5)/resolution,y=(Math.floor(i/resolution)+.5)/resolution;
  mask[i]=shorelineCoverage(x,y,q,pose,mode==='leave')>.05;
  if(inQuad(q,x,y)){visited[i]=1;queue.push(i);}
 }
 for(let head=0;head<queue.length;head++){
  const i=queue[head],x=i%resolution,y=Math.floor(i/resolution);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const nx=x+dx,ny=y+dy,j=ny*resolution+nx;
   if(nx>=0&&nx<resolution&&ny>=0&&ny<resolution&&mask[j]&&!visited[j]){visited[j]=1;queue.push(j);}
  }
 }
 check(mask.every((painted,i)=>!painted||visited[i]),'All visible outer paint connects to the real display rather than forming detached dots');
}
for(const time of [250,300,350,390]){
 const notch=coverage('leave',time,.46,.79),neighbor=coverage('leave',time,.65,.79);
 check(notch<neighbor,'The short off-center lower rim is recognized before its neighboring rim section');
 check(coverage('leave',time,.46,.73)===1,'The recognition gap cannot erase the adjacent interior landscape');
}
check(coverage('leave',390,.46,.79)===0&&coverage('leave',390,.65,.79)===1,'The recognition section becomes clear while the neighboring rim remains covered');
for(let y=.025;y<1;y+=.05)for(let x=.025;x<1;x+=.05){
 if(!inQuad(core,x,y))check(coverage('leave',1100,x,y)===0,'Return clears every sampled transitional pixel outside the original display');
}
// The settled controller clears this temporary mask. Its final raster must
// already be opaque, otherwise corner paint would appear in a single frame.
for(let y=.005;y<1;y+=.02)for(let x=.005;x<1;x+=.02){
 check(coverage('enter',1600,x,y)===1,'The last entering mask matches its unmasked settled painting without a corner pop');
 check(coverage('leave',0,x,y)===1,'The first returning mask preserves the complete settled painting');
}

// Returning from a partial arrival must start with the paint already present,
// not gain the fully settled outside reach for a frame before it lifts.
for(const entryTime of [400,730,1150,1430])for(const q of quads){
 const arriving=sample('enter',entryTime),returning=sample('leave',0);
 const tail=Math.max(0,Math.min(1,(entryTime-1260)/(1600-1260)));
 returning.reach=tail*tail*(3-2*tail);
 for(const key of ['expansion','travel','shore','lake','sides','top','ui'])returning[key]*=arriving[key];
 for(let row=0;row<20;row++)for(let column=0;column<30;column++){
  const x=(column+.5)/30,y=(row+.5)/20;
  const before=shorelineCoverage(x,y,q,arriving,false),after=shorelineCoverage(x,y,q,returning,true);
  check(after<=before+1e-10,'Interrupting any entry phase cannot introduce new outside paint on the first return frame');
  if(inQuad(q,x,y))check(before===1&&after===1,'An interrupted passage keeps its interior landscape continuously visible');
 }
}

// Exercise the real passage controller with inspectable native canvas masks.
// The image fixture uses the opaque rectangular fallback so a broad alpha
// dissolve cannot hide behind the irregular art at the paper's perimeter.
const previousGlobals={document:globalThis.document,Image:globalThis.Image,innerWidth:globalThis.innerWidth,innerHeight:globalThis.innerHeight};
const encoded=new Map();let nextMask=0;
function style(){
 const key=name=>name.startsWith('--')?name:name.replace(/^-webkit-/,'webkit-').replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());
 return {setProperty(name,value){this[key(name)]=value;},removeProperty(name){delete this[key(name)];}};
}
function canvas(){
 const node={width:0,height:0};let raster=null;
 const data=()=>{if(!raster||raster.length!==node.width*node.height*4)raster=new Uint8ClampedArray(node.width*node.height*4);return raster;};
 const paintRect=(left,top,width,height,alpha)=>{
  const out=data();
  for(let y=0;y<node.height;y++)for(let x=0;x<node.width;x++)if(x+.5>=left&&x+.5<left+width&&y+.5>=top&&y+.5<top+height){const p=(y*node.width+x)*4;out[p]=out[p+1]=out[p+2]=255;out[p+3]=alpha;}
 };
 const context={
  globalAlpha:1,
  createImageData(width,height){return {width,height,data:new Uint8ClampedArray(width*height*4)};},
  putImageData(image){raster=new Uint8ClampedArray(image.data);},
  clearRect(left,top,width,height){paintRect(left,top,width,height,0);},
  fillRect(left,top,width,height){paintRect(left,top,width,height,Math.round(255*this.globalAlpha));},
  beginPath(){},moveTo(){},lineTo(){},stroke(){},save(){},restore(){},drawImage(){throw new Error('The opaque paper fallback is intentionally under test');},
 };
 node.getContext=()=>context;
 node.toDataURL=()=>{const url=`data:image/png;test,${++nextMask}`;encoded.set(url,{width:node.width,height:node.height,data:new Uint8ClampedArray(data())});return url;};
 return node;
}
globalThis.document={createElement:()=>canvas()};
globalThis.Image=class {constructor(){this.complete=false;this.naturalWidth=0;}};
globalThis.innerWidth=1280;globalThis.innerHeight=900;
const paper={style:style()};
const scene={style:style(),dataset:{},parentElement:paper,getBoundingClientRect:()=>({left:100,top:90,right:1180,bottom:810,width:1080,height:720})};
const roomCanvas={style:style()};roomCanvas.style.maskImage='url("original-room.png")';roomCanvas.style.webkitMaskImage='url("original-room-webkit.png")';
let landscapeTravel=0;
const landscape={element:{style:style()},setPassageDepth(){},setPassageAspect(){},setPortalPose(){},setTravel(value){landscapeTravel=value;}};
const passage=createShorelinePassage({scene,roomCanvas,landscape});
const corners=[[380,310],[720,295],[770,520],[410,550]];
const roomRaster=()=>encoded.get(/^url\("(.+)"\)$/.exec(roomCanvas.style.maskImage)?.[1]);
const maskAt=(mask,u,v)=>mask.data[(Math.floor(v*mask.height)*mask.width+Math.floor(u*mask.width))*4+3];
passage.begin('enter');
for(const time of [0,200,430,700,930,1100,1300,1450,1600]){
 passage.frame(time,corners,.72);
 const mask=roomRaster();check(Boolean(mask),'A real controller frame produces an inspectable room mask');
 for(let v=.3;v<=.7;v+=.1)for(let u=.3;u<=.7;u+=.1)check(maskAt(mask,u,v)===255,'Room pigment inside the moving paper aperture stays fully opaque throughout entry');
 check(mask.data.every((value,i)=>i%4!==3||value===0||value===255),'The paper fallback moves an opaque perimeter without applying a broad fractional alpha fade');
 check(maskAt(mask,.005,.005)===0,'The passage keeps surrounding paper outside its painted aperture');
 check(paper.style.maskImage===roomCanvas.style.maskImage&&paper.style.webkitMaskImage===roomCanvas.style.webkitMaskImage,'Room and incoming painting share the same unfinished perimeter during the close camera approach');
 check(paper.style.maskSize==='100% 100%'&&paper.style.webkitMaskSize==='100% 100%','The parent paper mask remains registered to the viewport');
 check(landscape.element.style.filter==='brightness(0.7200)','The incoming landscape preserves its physical display brightness rather than whitening during entry');
 check(scene.style.opacity===undefined&&roomCanvas.style.opacity===undefined,'Neither painting uses a whole-element opacity transition');
 near(landscapeTravel,sample('enter',time).travel,'The actual controller drives native forward travel from the shared entry clock');
}
passage.settle();check(landscape.element.style.filter==='brightness(0.7200)','Settling the desktop preserves display brightness without a final lightening step');
check(landscapeTravel===1,'The readable desktop keeps the fully entered landscape rather than resetting its depth');
check(paper.style.maskImage===undefined&&paper.style.webkitMaskImage===undefined&&paper.style.maskSize===undefined&&paper.style.webkitMaskSize===undefined,'Settling releases the temporary shared paper mask without cropping the readable desktop');
passage.begin('leave');
for(const time of [0,200,400,650,840,980,1100]){
 passage.frame(time,corners,.72);
 const mask=roomRaster();
 check(mask.data.every((value,i)=>i%4!==3||value===0||value===255),'The returning room appears through spatial paper containment rather than alpha fading');
 check(maskAt(mask,.5,.5)===255,'The recognizable laptop retains opaque pigment during retreat');
 check(paper.style.maskImage===roomCanvas.style.maskImage,'The retreat shares one paper perimeter instead of showing competing painting edges');
 check(landscape.element.style.filter==='brightness(0.7200)','The returning landscape keeps its display brightness continuously');
 near(landscapeTravel,sample('leave',time).travel,'Return reverses the same native landscape travel before clearing the desktop');
}
for(const time of [400,730,1150,1430]){
 passage.clear();passage.begin('enter');passage.frame(time,corners,.72);
 const before=roomRaster(),travelBefore=landscapeTravel;passage.begin('leave');passage.frame(0,corners,.72);
 assert.deepEqual(roomRaster(),before);checks++;
 check(landscapeTravel===travelBefore,'Interrupting any entry stage preserves the exact landscape depth on the first return frame');
 check(landscape.element.style.filter==='brightness(0.7200)','Interrupting arrival cannot introduce a brightness crossfade');
}
passage.clear();
check(roomCanvas.style.maskImage==='url("original-room.png")'&&roomCanvas.style.webkitMaskImage==='url("original-room-webkit.png")','Clearing the passage restores the original room masks');
check(landscape.element.style.filter==='','Clearing the passage releases its temporary light matching');
check(landscapeTravel===0,'Finishing or cancelling a passage restores native room-screen travel');
check(paper.style.maskImage===undefined&&paper.style.webkitMaskImage===undefined&&paper.style.maskSize===undefined&&paper.style.webkitMaskSize===undefined,'Closing or interrupting the passage removes every temporary parent paper mask');
const detachedScene={style:style(),dataset:{},getBoundingClientRect:scene.getBoundingClientRect};
const detached=createShorelinePassage({scene:detachedScene,roomCanvas,landscape});
detached.begin('enter');detached.frame(600,corners,.72);detached.settle();detached.clear();
check(!detachedScene.parentElement,'The passage also cleans up safely when a paper parent is absent');
for(const [key,value] of Object.entries(previousGlobals))if(value===undefined)delete globalThis[key];else globalThis[key]=value;

console.log(`Shoreline passage: ${checks} timing, camera, connected paint, perspective reserves, opaque paper and continuous-light checks pass.`);
