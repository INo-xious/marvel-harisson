import {mapPaintedScreen} from './brush-study-passage.js';
import {sampleShoreline} from './brush-study-shoreline-timing.js';

const clamp=(x,lo=0,hi=1)=>Math.max(lo,Math.min(hi,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const grain=(x,y)=>Math.sin(x*37+y*19)*.012+Math.sin(x*83-y*71)*.008+Math.sin(x*211+y*157)*.004;
const cross=(a,b,x,y)=>(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);
const inside=(q,x,y)=>q.every((a,i)=>cross(a,q[(i+1)%4],x,y)>=-.0001);
const edgeCache=new WeakMap();
function measuredEdges(core){
 if(edgeCache.has(core))return edgeCache.get(core);
 const edges=core.map((a,index)=>{
  const b=core[(index+1)%4],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
  const reach=index===0?Math.max(.04,(a[1]+b[1])/2):index===2?Math.max(.04,1-(a[1]+b[1])/2):index===1?Math.max(.04,1-(a[0]+b[0])/2):Math.max(.04,(a[0]+b[0])/2);
  const farthest=Math.max(...[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>{
   const t=((u-a[0])*dx+(v-a[1])*dy)/(length*length);
   return Math.max(0,-cross(a,b,u,v)/length)/reach+Math.max(0,-t,t-1)*1.7;
  }));
  return {a,b,dx,dy,length,reach,farthest};
 });
 edgeCache.set(core,edges);return edges;
}

/** A connected edge front: distance advances out from an actual display edge.
 * The original display is an opaque invariant, independent of the dry marks. */
export function shorelineCoverage(x,y,core,pose,leaving=false){
 if(inside(core,x,y))return 1;
 const edges=measuredEdges(core);
 const edge=(index,wet)=>{
  if(wet<=0)return 0;
  const {a,b,dx,dy,length,reach,farthest}=edges[index];
  if(length<1e-7)return 0;
  if(cross(a,b,x,y)>=0)return 0;
  const along=((x-a[0])*dx+(y-a[1])*dy)/(length*length);
  const outside=Math.max(0,-cross(a,b,x,y)/length);
  const distance=outside/reach+Math.max(0,-along,along-1)*1.7;
  // Native shoreline direction and a few fine dry skips deform a single
  // connected wash; there are no circular islands or detached splat dots.
  const direction=index===2?Math.sin(x*8.4+y*3.2)*.045:index===0?Math.sin(x*7.2)*.025:Math.sin(y*9.3+x)*.035;
  const tail=pose.reach??(leaving?1:smooth(1260,1600,pose.elapsed));
  const front=wet*(1.12+tail*Math.max(0,farthest-1.0));
  return smooth(-.035,.035,front-distance+grain(x,y)+direction*wet);
 };
 const shore=mix(pose.shore,pose.lake,smooth(.28,.72,x));
 let alpha=Math.max(edge(2,shore),edge(1,pose.sides),edge(3,pose.sides),edge(0,pose.top));
 if(leaving){
  const [br,bl]=[core[2],core[3]],t=clamp((x-bl[0])/Math.max(.001,br[0]-bl[0]));
  const rimY=mix(bl[1],br[1],t),notch=smooth(.27,.34,t)*(1-smooth(.48,.56,t));
  const band=smooth(-.006,.009,y-rimY)*(1-smooth(.045,.14,y-rimY));
  alpha*=1-pose.recognition*notch*band;
  if(alpha>0&&alpha<.95)alpha*=.72+.28*smooth(-.65,.65,Math.sin(x*420+y*67));
 }
 return clamp(alpha);
}

function inversePoint(matrix,x,y){
 const m=matrix.slice(9,-1).split(',').map(Number);
 const [a,b,c,d,e,f,g,h,i]=[m[0],m[4],m[12],m[1],m[5],m[13],m[3],m[7],m[15]];
 const A=e*i-f*h,B=c*h-b*i,C=b*f-c*e,D=f*g-d*i,E=a*i-c*g,F=c*d-a*f,G=d*h-e*g,H=b*g-a*h,I=a*e-b*d;
 const w=G*x+H*y+I;
 return [(A*x+B*y+C)/w,(D*x+E*y+F)/w];
}

export function createShorelinePassage({scene,roomCanvas,landscape}={}){
 const matte=document.createElement('canvas'),context=matte.getContext('2d');
 const roomMatte=document.createElement('canvas'),roomContext=roomMatte.getContext('2d');
 const roomEdge=new Image();roomEdge.src='/assets/painted/desktop-paper-edge.svg';
 const paper=scene.parentElement;
 let bounds=null,mode='enter',lastPose=null,initial=null;
 const originalRoomMask=roomCanvas.style.maskImage,originalWebkit=roomCanvas.style.webkitMaskImage;
 function measure(){
  const transform=scene.style.transform;scene.style.transform='';
  bounds=scene.getBoundingClientRect();scene.style.transform=transform;
  matte.width=Math.max(1,Math.min(200,Math.floor(Math.sqrt(16000*bounds.width/bounds.height))));
  matte.height=Math.max(1,Math.floor(matte.width*bounds.height/bounds.width));
  roomMatte.width=Math.max(1,Math.min(180,Math.floor(Math.sqrt(12000*innerWidth/innerHeight))));
  roomMatte.height=Math.max(1,Math.floor(roomMatte.width*innerHeight/innerWidth));
 }
 function begin(direction){mode=direction;initial=direction==='leave'?lastPose:null;measure();scene.style.transformOrigin='0 0';}
 function roomMask(pose,corners){
  const w=roomMatte.width,h=roomMatte.height;
  // Opaque paint travels through a paper aperture. Only its perimeter moves;
  // the room never dissolves. The advancing landscape occludes it naturally.
  const envelope=pose.paper;
  const left=mix(innerWidth*.025,bounds.left-8,envelope),top=mix(innerHeight*.025,bounds.top-8,envelope);
  const width=mix(innerWidth*.95,bounds.width+16,envelope),height=mix(innerHeight*.95,bounds.height+16,envelope);
  roomContext.clearRect(0,0,w,h);
  if(roomEdge.complete&&roomEdge.naturalWidth)roomContext.drawImage(roomEdge,left*w/innerWidth,top*h/innerHeight,width*w/innerWidth,height*h/innerHeight);
  else {roomContext.fillStyle='#fff';roomContext.fillRect(left*w/innerWidth,top*h/innerHeight,width*w/innerWidth,height*h/innerHeight);}
  const image=`url("${roomMatte.toDataURL()}")`;
  roomCanvas.style.maskImage=roomCanvas.style.webkitMaskImage=image;
  roomCanvas.style.maskSize=roomCanvas.style.webkitMaskSize='100% 100%';
  // The same unfinished perimeter contains the incoming landscape as well
  // as the room. The camera can pass the bezel without painting the viewport.
  if(paper){paper.style.maskImage=paper.style.webkitMaskImage=image;paper.style.maskSize=paper.style.webkitMaskSize='100% 100%';}
 }
 function frame(elapsed,corners,screenLight=1,portalPose=null){
  if(!bounds||!corners?.length)return null;
  const pose=sampleShoreline(mode,elapsed),leaving=mode==='leave';
  if(leaving&&initial){
   pose.expansion*=initial.expansion;pose.paper*=initial.paper;pose.ui*=initial.ui;pose.travel*=initial.travel;
   pose.reach=initial.reach??smooth(1260,1600,initial.elapsed);
   for(const key of ['shore','lake','sides','top'])pose[key]*=initial[key];
  }
  const target=[[bounds.left,bounds.top],[bounds.right,bounds.top],[bounds.right,bounds.bottom],[bounds.left,bounds.bottom]];
  const quad=corners.map(([x,y],i)=>[mix(x,target[i][0],pose.expansion),mix(y,target[i][1],pose.expansion)]);
  const transform=mapPaintedScreen({source:{left:0,top:0,width:bounds.width,height:bounds.height},corners:quad,offset:{x:bounds.left,y:bounds.top}});
  if(!transform)return pose;
  scene.style.transform=transform;
  const core=corners.map(([x,y])=>{const p=inversePoint(transform,x-bounds.left,y-bounds.top);return[p[0]/bounds.width,p[1]/bounds.height];});
  const w=matte.width,h=matte.height,pixels=context.createImageData(w,h),out=pixels.data;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4;out[i]=out[i+1]=out[i+2]=255;
   out[i+3]=Math.round(255*shorelineCoverage((x+.5)/w,(y+.5)/h,core,pose,leaving));
  }
  context.putImageData(pixels,0,0);
  const mask=`url("${matte.toDataURL()}")`;scene.style.maskImage=scene.style.webkitMaskImage=mask;
  scene.style.maskSize=scene.style.webkitMaskSize='100% 100%';
  scene.style.setProperty('--passage-ui',pose.ui.toFixed(4));
  const journey={aspect:mix(1.6,bounds.width/bounds.height,pose.expansion),travel:pose.travel,portalPose,portalWeight:1-pose.expansion,depthX:-pose.depth*.52,depthY:pose.depth*.42};
  if(landscape.setJourney)landscape.setJourney(journey);
  else {
   landscape.setPassageAspect?.(journey.aspect);landscape.setTravel?.(pose.travel);
   landscape.setPortalPose?.(portalPose,journey.portalWeight);landscape.setPassageDepth?.(journey.depthX,journey.depthY);
  }
  // Bristles belong to each moving pigment surface once the eye reaches
  // the aperture. Their native roughness stays fixed to the paint.
  const edgeRelease=smooth(.02,.70,pose.expansion);
  landscape.element.style.setProperty('--edge-size',String(1+.5*(1-edgeRelease)));
  landscape.element.style.setProperty('--edge-release',String(edgeRelease));
  landscape.element.style.setProperty('--portal-recess',String((1-pose.expansion)*.65));
  // Match the physical display's light for the whole passage, rather than
  // whitening the image as the room falls away.
  landscape.element.style.filter=`brightness(${screenLight.toFixed(4)})`;
  scene.dataset.passage=mode;scene.dataset.passageMs=String(Math.round(pose.elapsed));
  roomMask(pose,corners);lastPose=pose;return pose;
 }
 function settle(){
  lastPose=sampleShoreline('enter',1600);scene.style.transform='';scene.style.transformOrigin='';
  scene.style.maskImage=scene.style.webkitMaskImage='';scene.style.setProperty('--passage-ui','1');
  delete scene.dataset.passage;delete scene.dataset.passageMs;
  roomCanvas.style.maskImage=roomCanvas.style.webkitMaskImage='linear-gradient(transparent,transparent)';
  if(paper)for(const property of ['mask-image','-webkit-mask-image','mask-size','-webkit-mask-size'])paper.style.removeProperty(property);
  landscape.setPassageDepth?.(0,0);
  landscape.setTravel?.(1);landscape.element.style.setProperty('--edge-size','1');landscape.element.style.setProperty('--edge-release','1');
  landscape.setPassageAspect?.(null);
  landscape.setPortalPose?.(null,0);landscape.element.style.removeProperty('--portal-recess');
 }
 function clear(){
  scene.style.transform='';scene.style.transformOrigin='';
  for(const property of ['mask-image','-webkit-mask-image','mask-size','-webkit-mask-size'])scene.style.removeProperty(property);
  scene.style.removeProperty('--passage-ui');delete scene.dataset.passage;delete scene.dataset.passageMs;
  roomCanvas.style.maskImage=originalRoomMask;roomCanvas.style.webkitMaskImage=originalWebkit;
  roomCanvas.style.removeProperty('mask-size');roomCanvas.style.removeProperty('-webkit-mask-size');
  if(paper)for(const property of ['mask-image','-webkit-mask-image','mask-size','-webkit-mask-size'])paper.style.removeProperty(property);
  landscape.setPassageDepth?.(0,0);bounds=null;lastPose=null;initial=null;
  landscape.setTravel?.(0);landscape.element.style.setProperty('--edge-size','1.5');landscape.element.style.setProperty('--edge-release','0');
  landscape.setPassageAspect?.(null);landscape.element.style.filter='';
  landscape.setPortalPose?.(null,0);landscape.element.style.removeProperty('--portal-recess');
 }
 return {begin,frame,settle,clear,resize:measure};
}
