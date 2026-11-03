// Independent, registered pieces of the original lake painting. No stock
// gradients or tinted copies stand in for the geography of the source.
const SOURCE='/assets/painted/desktop-lake-wallpaper-v1.png';
const WIDTH=1586,HEIGHT=992;
const MOUNTAIN_ROOF=[[0,224],[62,216],[128,205],[176,194],[219,192],[248,188],[267,184],[288,190],[303,196],[325,198],[339,202],[359,211],[375,203],[386,198],[401,196],[417,187],[433,181],[449,178],[466,181],[477,190],[492,194],[503,199],[519,209],[539,215],[552,218],[560,223],[566,227],[574,235],[588,237],[600,241],[619,241],[637,246],[646,251],[655,248],[666,250],[679,255],[695,260],[716,263],[734,266],[750,267],[765,271],[787,281],[810,288],[827,290],[844,294],[865,293],[885,293],[904,288],[921,285],[940,283],[959,282],[978,287],[996,289],[1012,289],[1032,296],[1052,297],[1071,306],[1090,311],[1105,320],[1124,325],[1146,321],[1169,322],[1188,327],[1200,329],[1221,335],[1245,337],[1264,343],[1288,344],[1305,352],[1320,346],[1340,355],[1355,344],[1367,346],[1389,343],[1402,344],[1421,351],[1447,356],[1479,358],[1505,351],[1534,352],[1560,348],[1586,345]];
const WATER_EDGE=[[0,425],[280,425],[520,425],[740,414],[930,402],[1050,396],[1120,399],[1180,402],[1250,403],[1300,404],[1410,405],[1510,405],[1586,403]];
const SHORE=[[0,218],[24,223],[63,244],[112,254],[151,278],[182,288],[201,313],[216,338],[246,326],[283,314],[317,307],[353,300],[384,293],[414,298],[445,312],[474,315],[507,333],[541,339],[577,338],[606,338],[631,347],[652,344],[668,345],[689,340],[708,359],[718,368],[751,374],[777,385],[801,384],[820,378],[842,382],[861,385],[883,392],[903,385],[921,392],[937,395],[953,390],[965,403],[982,404],[997,423],[1014,423],[1030,435],[1021,438],[970,440],[921,439],[880,438],[822,441],[750,442],[700,440],[610,443],[550,443],[503,437],[473,453],[493,465],[537,475],[551,479],[570,491],[605,495],[644,498],[624,499],[607,500],[560,500],[505,503],[455,505],[375,503],[320,505],[260,506],[204,508],[146,509],[82,509],[0,511]];
// Actual granite/soil silhouette, independent of the crowns above it.
const GROUND_ROOF=[[0,648],[75,679],[154,712],[249,749],[347,784],[452,828],[538,863],[644,895],[751,922],[782,937],[812,945],[838,928],[850,918],[866,921],[885,913],[901,916],[914,904],[928,903],[940,907],[950,914],[960,912],[968,921],[976,930],[987,925],[1004,934],[1013,929],[1021,919],[1028,913],[1034,912],[1044,916],[1064,919],[1080,923],[1102,928],[1115,933],[1127,942],[1137,937],[1147,940],[1160,947],[1174,953],[1185,962],[1200,970],[1218,974],[1235,974],[1250,981],[1264,980],[1279,986],[1290,992]];
// Crown envelope includes the little light leaves detached by dry brushwork.
// It is never used as an opaque polygon: only actual local pigment owns it.
const SPRIG_ENVELOPE=[[0,313],[60,328],[120,388],[190,490],[228,558],[249,586],[275,606],[345,603],[390,645],[451,688],[510,686],[570,681],[610,693],[653,679],[690,674],[731,727],[770,743],[810,740],[846,743],[890,761],[934,806],[971,841],[998,901],[1050,932],[1121,937],[1167,925],[1207,934],[1240,941],[1280,960],[1330,966],[1370,979],[1430,992]];
const LAYERS=[
 {name:'sky',depth:.35},
 {name:'mountains',depth:1.35},
 {name:'lake',depth:.72},
 {name:'shoreline',depth:2.45},
 {name:'foreground',depth:5},
];

function surface(){const c=document.createElement('canvas');c.width=WIDTH;c.height=HEIGHT;return c;}
function below(points){return [...points,[WIDTH,HEIGHT],[0,HEIGHT]];}
function silhouette(points,lineWidth=0){
 const canvas=surface(),context=canvas.getContext('2d',{willReadFrequently:true});
 context.fillStyle=context.strokeStyle='#fff';context.beginPath();points.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));if(lineWidth){context.lineWidth=lineWidth;context.lineJoin='round';context.lineCap='round';context.stroke();}else{context.closePath();context.fill();}
 return context.getImageData(0,0,WIDTH,HEIGHT).data;
}
function ridge(points){
 const result=new Float32Array(WIDTH);let i=0;
 for(let x=0;x<WIDTH;x++){while(i<points.length-2&&x>points[i+1][0])i++;const [ax,ay]=points[i],[bx,by]=points[i+1];result[x]=ay+(by-ay)*Math.max(0,Math.min(1,(x-ax)/Math.max(1,bx-ax)));}
 return result;
}
function refineMountainRoof(pixels){
 const guide=ridge(MOUNTAIN_ROOF),found=new Float32Array(WIDTH);
 const mountainInk=(x,y)=>{const p=(Math.max(0,Math.min(HEIGHT-1,y))*WIDTH+x)*4,r=pixels[p],g=pixels[p+1],b=pixels[p+2];return r-g<28&&g-b<27&&(r+g+b)/3<198;};
 for(let x=0;x<WIDTH;x++){
  let top=guide[x];
  // The warm sky and grey mountain have a persistent pigment change. Find
  // the first hill row, rather than an internal darker fold farther down.
  for(let y=Math.max(8,Math.round(guide[x])-45);y<=Math.min(HEIGHT-8,Math.round(guide[x])+20);y++){
   if(mountainInk(x,y)&&mountainInk(x,y+1)&&mountainInk(x,y+2)&&mountainInk(x,y+4)){top=y;break;}
  }
  found[x]=top;
 }
 const smooth=Array.from(found,(y,x)=>[found[Math.max(0,x-1)],y,found[Math.min(WIDTH-1,x+1)]].sort((a,b)=>a-b)[1]);
 return smooth.map((y,x)=>[x,y]);
}

function segment(pixels){
 const count=WIDTH*HEIGHT,owner=new Uint8Array(count);
 const mountain=silhouette(below(refineMountainRoof(pixels))),lake=silhouette(below(WATER_EDGE)),shore=silhouette(SHORE),canopy=silhouette(SHORE.slice(0,SHORE.findIndex(([x,y])=>x===1030&&y===435)+1),25),capeCanopy=silhouette([[472,452],[480,457],[491,457],[497,451],[503,448],[509,451],[516,459],[522,466],[530,466],[536,462],[545,465],[550,472],[555,473],[560,466],[566,468],[571,474],[578,475],[586,483],[591,486],[600,487],[606,489],[615,492],[626,492],[640,498]],22);
 const ground=silhouette(below(GROUND_ROOF)),envelope=silhouette(below(SPRIG_ENVELOPE)),groundEdge=ridge(GROUND_ROOF);
 const capeFoot=ridge([[0,511],[82,509],[146,509],[204,508],[260,506],[320,505],[375,503],[455,505],[505,503],[560,500],[607,500],[624,499],[644,498]]),peninsulaFoot=ridge([[644,442],[700,440],[750,442],[822,441],[880,438],[921,439],[970,440],[1021,438],[1030,435]]);
 const strong=new Uint8Array(count),weak=new Uint8Array(count),nearInk=new Uint8Array(count);
 for(let i=0;i<count;i++){
  const p=i*4,x=i%WIDTH,y=Math.floor(i/WIDTH),r=pixels[p],g=pixels[p+1],b=pixels[p+2];
  const isCape=capeCanopy[p+3]>127&&x>470&&x<645&&y<capeFoot[x]-3;
  const canopyRegion=canopy[p+3]>127||isCape;
  const nearCanopy=canopyRegion&&(g-b)/Math.max(g,1)>(isCape?.075:.12)&&r-b>7&&r-g<(g-b)*.7+3;
  owner[i]=shore[p+3]>127||nearCanopy?3:lake[p+3]>127?2:mountain[p+3]>127?1:0;
  const bankFoot=x<=644?capeFoot[x]:peninsulaFoot[x];
  if(owner[i]===3&&y>bankFoot-8&&g-b<13&&(g-r>1||b-r>1))owner[i]=2;
  if(ground[p+3]>127){
   // The outline follows rocks, rather than an opaque triangular hillside.
   // Cool water pockets touching its upper fringe still belong to the lake.
   const waterPocket=y-groundEdge[x]<42&&g-r>=0&&g-b<=13&&(g-r>1||b-r>1);
   owner[i]=waterPocket?2:4;
  }
  // Pale earth between the shrub roots and granite was previously mistaken
  // for reflected water. This narrow warm band follows the actual terrain,
  // and does not include warm reflections farther out in the lake.
  if(x<1290&&y>groundEdge[x]-56&&y<groundEdge[x]+22&&r-g>4&&g-b>9)owner[i]=4;
  if(envelope[p+3]>127){
   strong[i]=((g-b)/Math.max(g,1)>.135&&r-b>8&&r-g<(g-b)*.65+2)?1:0;
   weak[i]=((g-b)/Math.max(g,1)>.072&&r-b>4&&g-r<5&&r-g<(g-b)*.8+3)?1:0;
  }
 }
 // Local fringe recovery is independent of connection to the ground. A
 // skipped paint mark can leave a complete pale leaf genuinely detached.
 for(let i=0;i<count;i++)if(strong[i]){
  const x=i%WIDTH,y=Math.floor(i/WIDTH);
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(x+dx>=0&&x+dx<WIDTH&&y+dy>=0&&y+dy<HEIGHT)nearInk[i+dy*WIDTH+dx]=1;
 }
 for(let i=0;i<count;i++)if(strong[i]||(weak[i]&&nearInk[i]))owner[i]=4;
 return owner;
}

function cleanReserve(pixels,owner,rank,x,y){
 const matches=(cx,cy)=>{
  if(cx<0||cx>=WIDTH||cy<0||cy>=HEIGHT)return false;
  const i=cy*WIDTH+cx;if(owner[i]!==rank)return false;
  const p=i*4,r=pixels[p],g=pixels[p+1],b=pixels[p+2];
  if(rank===2){
   if((cx>3&&owner[i-3]===4)||(cx<WIDTH-4&&owner[i+3]===4)||(cy>3&&owner[i-WIDTH*3]===4)||(cy<HEIGHT-4&&owner[i+WIDTH*3]===4))return false;
   return g-b<12||(r>220&&g>185&&b>145&&r-g>20);
  } // cool lake or warm reflected sky
  if(rank===1)return g-b<11||(g-r>5&&b-r>0); // no olive tree paint
  if(rank===0)return !(g-r>1&&b-r>2)&&(r+g+b)/3>178; // no mountain blue at a bad guide pixel
  if(rank===3)return !(g-r>=0&&g-b<=13);
  return true;
 };
 let sx=x,sy=y;
 if(!matches(sx,sy)){
  search:for(let radius=2;radius<=56;radius+=2)for(const [dx,dy] of [[radius,0],[-radius,0],[0,-radius],[0,radius],[radius,-2],[-radius,-2]])if(matches(x+dx,y+dy)){sx=x+dx;sy=y+dy;break search;}
 }
 // Averaging a few clean pigment deposits avoids stamped vertical ribbons
 // in the hidden overlap. Original owned pixels are never recolored.
 let sum=[0,0,0],n=0;
 for(const [dx,dy] of [[0,0],[-3,0],[3,0],[0,-2],[0,2]])if(matches(sx+dx,sy+dy)){const p=((sy+dy)*WIDTH+sx+dx)*4;sum[0]+=pixels[p];sum[1]+=pixels[p+1];sum[2]+=pixels[p+2];n++;}
 if(!n){
  // A failed border sample must never restore the rejected actor. The
  // reservoirs below are known clean parts of this same native painting.
  const clean=rank===2?[1540,Math.max(416,Math.min(964,y))]:rank===1?[650,280]:rank===0?[Math.max(30,Math.min(WIDTH-30,x)),38]:[480,403];
  const p=(clean[1]*WIDTH+clean[0])*4;return [pixels[p],pixels[p+1],pixels[p+2]];
 }
 return sum.map(v=>Math.round(v/n));
}

function layerCanvas(pixels,owner,rank){
 const count=WIDTH*HEIGHT,canvas=surface(),context=canvas.getContext('2d'),paint=context.createImageData(WIDTH,HEIGHT),out=paint.data;
 const distance=new Uint8Array(count);distance.fill(255);
 const queue=new Int32Array(count);let head=0,tail=0;
 for(let i=0;i<count;i++)if(owner[i]===rank){
  const p=i*4;out[p]=pixels[p];out[p+1]=pixels[p+1];out[p+2]=pixels[p+2];out[p+3]=255;
  const x=i%WIDTH,y=Math.floor(i/WIDTH);
  if((x&&owner[i-1]>rank)||(x<WIDTH-1&&owner[i+1]>rank)||(y&&owner[i-WIDTH]>rank)||(y<HEIGHT-1&&owner[i+WIDTH]>rank)){distance[i]=0;queue[tail++]=i;}
 }
 // Lower layers carry a 14px reserve of their own nearest clean pigment
 // beneath higher layers. Moving a sprig/shore exposes water or mountain
 // paint rather than a second baked silhouette from the source bitmap.
 while(head<tail){
  const i=queue[head++],d=distance[i];if(d>=14)continue;
  const x=i%WIDTH,y=Math.floor(i/WIDTH),neighbors=[];
  const reserve=d===0?cleanReserve(pixels,owner,rank,x,y):null;
  if(x)neighbors.push(i-1);if(x<WIDTH-1)neighbors.push(i+1);if(y)neighbors.push(i-WIDTH);if(y<HEIGHT-1)neighbors.push(i+WIDTH);
  for(const next of neighbors)if(owner[next]>rank&&distance[next]>d+1){
   distance[next]=d+1;const p=i*4,q=next*4;
   out[q]=reserve?reserve[0]:out[p];out[q+1]=reserve?reserve[1]:out[p+1];out[q+2]=reserve?reserve[2]:out[p+2];const edge=Math.max(0,Math.min(1,(14-d-1)/4));out[q+3]=Math.round(255*edge*edge*(3-2*edge));queue[tail++]=next;
  }
 }
 context.putImageData(paint,0,0);return canvas;
}

/** x/y are normalized pointer depths in [-1,1]. All motion is optional. */
import {sampleLandscapeDepth,LANDSCAPE_DEPTH_RESERVE} from './brush-study-landscape-depth.js';
export function createDesktopLandscape({reduced=false}={}){
 const element=document.createElement('div');element.className='painted-desktop-landscape';element.setAttribute('aria-hidden','true');
 element.dataset.sourceWidth=String(WIDTH);element.dataset.sourceHeight=String(HEIGHT);
 const fallback=new Image();fallback.className='painted-desktop-landscape-fallback';fallback.alt='';fallback.draggable=false;element.append(fallback);
 const source=new Image(),canvases=[],portalCanvases=[],poses=[];let settleReady=()=>{};let targetX=0,targetY=0,x=0,y=0,active=true,disposed=false,frame=0,last=0,paintTime=0,passageAspect=null,framingKey='',portalPixels=null,portalOwner=null,portalJob=null,portalDOM=false,portalWeight=0,portalPose=[],portalSourceScale=1.065,travel=0;
 let framingScaleX=1,framingScaleY=1;
 const isReduced=()=>typeof reduced==='function'?Boolean(reduced()):Boolean(reduced?.matches??reduced);
 const visibleCanvases=()=>portalDOM?portalCanvases:canvases;
 function selectPortalSurfaces(){
  const next=(portalWeight>0||travel>0)&&portalCanvases.length===LAYERS.length;
  if(next===portalDOM)return;
  const before=visibleCanvases();portalDOM=next;const after=visibleCanvases();
  before.forEach((canvas,index)=>{if(canvas.parentElement===element)canvas.replaceWith(after[index]);});framingKey='';
 }
 function frameLayers(width,height){
  const key=`${passageAspect}/${width}/${height}/${canvases.length}/${portalDOM}`;
  if(key===framingKey)return;
  if(passageAspect!==null&&(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0))return;
  framingKey=key;
  element.style.setProperty('--layer-paper-width',`${width}px`);element.style.setProperty('--layer-paper-height',`${height}px`);
  const images=[fallback,...canvases,...portalCanvases];
  if(passageAspect===null){
   framingScaleX=framingScaleY=Math.max(width/WIDTH,height/HEIGHT)||1;
   images.forEach(image=>{for(const property of ['inset','left','top','width','height','object-fit'])image.style.removeProperty(property);});return;
  }
  // The laptop's broad display and the paper's portrait crop share one
  // continuous framing. Geometry changes the view; native pigment stays put.
  const virtualWidth=height*passageAspect,scale=Math.max(virtualWidth/WIDTH,height/HEIGHT);
  const drawWidth=WIDTH*scale*width/virtualWidth,drawHeight=HEIGHT*scale;
  framingScaleX=drawWidth/WIDTH;framingScaleY=drawHeight/HEIGHT;
  const left=(width-drawWidth)/2,top=(height-drawHeight)/2;
  images.forEach(image=>{image.style.inset='auto';image.style.left=`${left}px`;image.style.top=`${top}px`;image.style.width=`${drawWidth}px`;image.style.height=`${drawHeight}px`;image.style.objectFit='fill';});
 }
 const paintPositions=(now=0)=>{
  paintTime=now;
  const layoutWidth=element.clientWidth,layoutHeight=element.clientHeight;
  frameLayers(layoutWidth,layoutHeight);
  const still=isReduced(),t=now*.001,portalScale=portalDOM?1.022+(portalSourceScale-1.022)*portalWeight:1.022;
  const depthPose=sampleLandscapeDepth(portalDOM?travel:0);
  const surfaces=visibleCanvases();
  for(let i=0;i<surfaces.length;i++){
   const layer=depthPose.layers[i],depth=layer.depth,water=i===2&&!still&&active,waterWeight=portalDOM?1-portalWeight:1,totalScale=portalScale*layer.scale;
   const nearWind=i===4&&active?depthPose.progress:0;
   const dx=still?0:x*depth+(water?Math.sin(t*.43)*.18*waterWeight:0)+Math.sin(t*.27)*.6*nearWind,dy=still?0:y*depth*.56+(water?Math.sin(t*.31+.8)*.11*waterWeight:0)+Math.sin(t*.21+.8)*.3*nearWind;
   // The physical-display fallback stays in its original room pose.
   poses[i]={x:still?0:x*LAYERS[i].depth+(water?Math.sin(t*.43)*.18:0),y:still?0:y*LAYERS[i].depth*.56+(water?Math.sin(t*.31+.8)*.11:0)};
   const offset=portalDOM&&!still?portalPose[i]:null;
   const px=offset?offset.x*portalWeight*framingScaleX*totalScale:0,py=offset?offset.y*portalWeight*framingScaleY*totalScale:0;
   let sx=dx-px,sy=dy-py;
   const nativeTravel=Math.abs(sx/Math.max(.001,framingScaleX*totalScale))+Math.abs(sy/Math.max(.001,framingScaleY*totalScale));
   const marginX=WIDTH/2-layoutWidth/(2*Math.max(.001,framingScaleX*portalScale))-.5;
   const marginY=HEIGHT/2-layoutHeight/(2*Math.max(.001,framingScaleY*portalScale))-.5;
   const roomLimit=Math.max(0,Math.min(28,marginX,marginY)),travelLimit=roomLimit+(48-roomLimit)*depthPose.progress;
   if(portalDOM&&nativeTravel>travelLimit){sx*=travelLimit/nativeTravel;sy*=travelLimit/nativeTravel;}
   const geometricX=((1-layer.scale)*(depthPose.anchor[0]-.5)*WIDTH+layer.x)*framingScaleX*portalScale;
   const geometricY=((1-layer.scale)*(depthPose.anchor[1]-.5)*HEIGHT+layer.y)*framingScaleY*portalScale;
   sx+=geometricX;sy+=geometricY;
   surfaces[i].style.setProperty('--layer-depth-scale',String(totalScale));
   surfaces[i].style.setProperty('--layer-edge-compensation',String(Math.max(1,totalScale/1.02)));
   surfaces[i].style.setProperty('--layer-edge-offset-x',`${(Math.max(-layoutWidth*.015,Math.min(layoutWidth*.015,geometricX))-geometricX)/totalScale}px`);
   surfaces[i].style.setProperty('--layer-edge-offset-y',`${(Math.max(-layoutHeight*.015,Math.min(layoutHeight*.015,geometricY))-geometricY)/totalScale}px`);
   surfaces[i].style.transform=`translate3d(${sx.toFixed(3)}px,${sy.toFixed(3)}px,0) scale(${totalScale})`;
  }
 };
 const tick=(now)=>{
  frame=0;if(disposed||!active)return;
  const dt=last?Math.min(50,now-last):16.7;last=now;
  const settle=1-Math.exp(-dt/190);x+=(targetX-x)*settle;y+=(targetY-y)*settle;
  paintPositions(now);if(!isReduced())frame=requestAnimationFrame(tick);
 };
 const resume=()=>{if(disposed)return;active=true;last=0;if(!frame&&canvases.length)frame=requestAnimationFrame(tick);};
 const pause=()=>{active=false;if(frame)cancelAnimationFrame(frame);frame=0;last=0;};
 const bounded=value=>Number.isFinite(value)?Math.max(-1,Math.min(1,value)):0;
 // Paint the same registered layers into the physical display. Cover fitting
 // and the small center scale match their CSS object-fit/transform, while
 // offsets are converted from the desktop's layout pixels to this surface.
 function paintTo(context,width,height){
  if(disposed||!context||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return false;
  const images=canvases.length===LAYERS.length?canvases:source.complete&&source.naturalWidth?[source]:[];
  if(!images.length)return false;
  const cover=Math.max(width/WIDTH,height/HEIGHT)*1.022;
  const drawWidth=WIDTH*cover,drawHeight=HEIGHT*cover;
  const layoutWidth=element.clientWidth||WIDTH,layoutHeight=element.clientHeight||HEIGHT;
  context.save();context.setTransform(1,0,0,1,0,0);context.globalAlpha=1;context.globalCompositeOperation='source-over';
  context.clearRect(0,0,width,height);context.fillStyle='#ede6d6';context.fillRect(0,0,width,height);
  images.forEach((image,index)=>{
   const pose=images.length===1?{x:0,y:0}:poses[index]||{x:0,y:0};
   context.drawImage(image,(width-drawWidth)/2+pose.x*width/layoutWidth,(height-drawHeight)/2+pose.y*height/layoutHeight,drawWidth,drawHeight);
  });
  context.restore();return true;
 }
 function setJourney(state={}){
  if('travel' in state){travel=Number.isFinite(state.travel)?Math.max(0,Math.min(1,state.travel)):0;element.dataset.landscapeTravel=String(travel);}
  if('aspect' in state)passageAspect=Number.isFinite(state.aspect)&&state.aspect>0?Math.max(.1,Math.min(10,state.aspect)):null;
  if('portalWeight' in state)portalWeight=Number.isFinite(state.portalWeight)?Math.max(0,Math.min(1,state.portalWeight)):0;
  if('portalPose' in state){
   const pose=state.portalPose;
   portalSourceScale=Number.isFinite(pose?.portalScale)?Math.max(1.022,Math.min(1.065,pose.portalScale)):1.065;
   portalPose=LAYERS.map(({name},index)=>{const item=Array.isArray(pose)?pose.find(point=>point?.name===name)||pose[index]:null;let x=Number.isFinite(item?.x)?item.x:0,y=Number.isFinite(item?.y)?item.y:0;const total=Math.abs(x)+Math.abs(y);if(total>28){x*=28/total;y*=28/total;}return {name,x,y};});
   if(!Array.isArray(pose))portalWeight=0;
  }
  const still=isReduced();
  if('depthX' in state)targetX=x=still?0:bounded(state.depthX);
  if('depthY' in state)targetY=y=still?0:bounded(state.depthY);
  selectPortalSurfaces();paintPositions(paintTime);
 }
 function preparePortal(){
  if(disposed||!portalPixels||!portalOwner)return;
  const index=portalCanvases.length,canvas=portalLayerCanvas(portalPixels,portalOwner,index);
  canvas.className='painted-desktop-landscape-layer';canvas.dataset.landscapeLayer=LAYERS[index].name;canvas.dataset.nativePixels=String(portalOwner.reduce((sum,rank)=>sum+Number(rank===index),0));canvas.dataset.reservePixels=String(LANDSCAPE_DEPTH_RESERVE);
  portalCanvases.push(canvas);portalJob=null;
  if(portalCanvases.length<LAYERS.length)portalJob=setTimeout(preparePortal,16);
  else {portalPixels=portalOwner=null;selectPortalSurfaces();framingKey='';paintPositions(paintTime);}
 }
 const ready=new Promise(resolve=>{
  settleReady=resolve;
  source.onload=()=>{
   if(disposed){resolve(false);return;}
   const native=surface(),context=native.getContext('2d',{willReadFrequently:true});context.drawImage(source,0,0);
   const pixels=context.getImageData(0,0,WIDTH,HEIGHT).data,owner=segment(pixels),counts=new Uint32Array(5);
   owner.forEach(rank=>counts[rank]++);
   LAYERS.forEach(({name},rank)=>{
    const canvas=layerCanvas(pixels,owner,rank);canvas.className='painted-desktop-landscape-layer';canvas.dataset.landscapeLayer=name;canvas.dataset.nativePixels=String(counts[rank]);canvases.push(canvas);element.append(canvas);
   });
   paintPositions();fallback.remove();element.classList.add('is-layered');if(active)resume();resolve(true);
   portalPixels=pixels;portalOwner=portalOwnership(pixels,owner);portalJob=setTimeout(preparePortal,16);
  };
  source.onerror=()=>resolve(false);source.src=SOURCE;fallback.src=SOURCE;
 });
 return {element,ready,paintTo,setJourney,setTravel(progress){travel=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;element.dataset.landscapeTravel=String(travel);selectPortalSurfaces();paintPositions(paintTime);},getTravel(){return travel;},getDepthPose(){return sampleLandscapeDepth(portalDOM?travel:0);},getPortalLayers(){return portalCanvases.length===LAYERS.length?portalCanvases.map((canvas,index)=>({name:LAYERS[index].name,canvas})):[];},setPortalPose(pose,weight=1){portalWeight=Number.isFinite(weight)?Math.max(0,Math.min(1,weight)):0;portalSourceScale=Number.isFinite(pose?.portalScale)?Math.max(1.022,Math.min(1.065,pose.portalScale)):1.065;portalPose=LAYERS.map(({name},index)=>{const item=Array.isArray(pose)?pose.find(point=>point?.name===name)||pose[index]:null;let x=Number.isFinite(item?.x)?item.x:0,y=Number.isFinite(item?.y)?item.y:0;const total=Math.abs(x)+Math.abs(y);if(total>28){x*=28/total;y*=28/total;}return {name,x,y};});if(!Array.isArray(pose))portalWeight=0;selectPortalSurfaces();paintPositions(paintTime);},setDepth(nextX,nextY){targetX=bounded(nextX);targetY=bounded(nextY);if(isReduced()){x=y=0;paintPositions();}else if(active&&!frame&&canvases.length)resume();},setPassageDepth(nextX,nextY){targetX=x=isReduced()?0:bounded(nextX);targetY=y=isReduced()?0:bounded(nextY);paintPositions(paintTime);},setPassageAspect(aspect){const next=Number.isFinite(aspect)&&aspect>0?Math.max(.1,Math.min(10,aspect)):null;if(next===passageAspect)return;passageAspect=next;frameLayers(element.clientWidth,element.clientHeight);},pause,resume,dispose(){disposed=true;pause();if(portalJob!==null)clearTimeout(portalJob);portalPixels=portalOwner=null;settleReady(false);source.onload=source.onerror=null;[...canvases,...portalCanvases].forEach(canvas=>{canvas.width=canvas.height=1;});element.remove();}};
}

// The source ownership and default desktop stay intact. Only the portal's
// far hill is separated from the olive canopy that overlaps it in the bitmap.
function portalOwnership(pixels,original){
 const owner=original.slice(),water=ridge(WATER_EDGE);
 for(let i=0;i<owner.length;i++)if(owner[i]===3){
  const y=Math.floor(i/WIDTH),x=i%WIDTH,p=i*4,r=pixels[p],g=pixels[p+1],b=pixels[p+2];
  const coolHill=y<water[x]-16&&r-g<15&&g-b<18&&Math.abs(r-b)<27&&(r+g+b)/3>108;
  if(coolHill)owner[i]=1;
 }
 return owner;
}

// Hidden backing is real native texture reflected along the brush rows.
// Copying a nearest boundary color through a deep region creates constant
// vertical ribbons. Row texture preserves the water's horizontal deposits.
function hiddenRowTexture(pixels,owner,rank,out){
 const rows=Array.from({length:HEIGHT},()=>[]),validRows=[];
 const clean=index=>{
  if(owner[index]!==rank)return false;
  const p=index*4,r=pixels[p],g=pixels[p+1],b=pixels[p+2];
  if(rank===2)return g-b<17||r-g>(g-b)*.5||(r+g+b)/3>220;
  if(rank===1)return g-b<19&&r-g<20;
  if(rank===0)return (r+g+b)/3>178;
  if(rank===3)return !(g-r>=0&&g-b<=13);
  return true;
 };
 for(let y=0;y<HEIGHT;y++){
  let start=-1;
  for(let x=0;x<=WIDTH;x++){
   const good=x<WIDTH&&clean(y*WIDTH+x);
   if(good&&start<0)start=x;
   if(!good&&start>=0){if(x-start>=8)rows[y].push([start,x-1]);start=-1;}
  }
  if(rows[y].length)validRows.push(y);
 }
 if(!validRows.length)return;
 const first=validRows[0],last=validRows[validRows.length-1];
 const mirror=(value,left,right)=>{if(right<=left)return left;const length=right-left,phase=((value-left)%(length*2)+length*2)%(length*2);return left+(phase<=length?phase:length*2-phase);};
 const nearestRow=new Int16Array(HEIGHT);
 for(let y=0;y<HEIGHT;y++){
  const reflected=Math.round(mirror(y,first,last));
  // Reflected rows reverse direction, so use a small binary search rather
  // than clamping whole lower bands to the same final source scanline.
  let low=0,high=validRows.length-1;while(low<high){const mid=Math.floor((low+high)/2);if(validRows[mid]<reflected)low=mid+1;else high=mid;}
  const left=validRows[Math.max(0,low-1)],right=validRows[low];nearestRow[y]=Math.abs(left-reflected)<Math.abs(right-reflected)?left:right;
 }
 for(let y=0;y<HEIGHT;y++){
  const sy=nearestRow[y],runs=rows[sy];let global=runs[0];for(const run of runs)if(run[1]-run[0]>global[1]-global[0])global=run;
  let at=0;
  for(let x=0;x<WIDTH;x++){
   const i=y*WIDTH+x,p=i*4;if(owner[i]===rank||!out[p+3])continue;
   while(at<runs.length-1&&runs[at+1][0]<=x)at++;
   const a=runs[at],b=runs[Math.min(at+1,runs.length-1)];
   const distance=run=>x<run[0]?run[0]-x:x>run[1]?x-run[1]:0;
   const local=distance(a)<=distance(b)?a:b,d=distance(local);
   const lx=Math.round(mirror(x,local[0],local[1])),gx=Math.round(mirror(x,global[0],global[1]));
   const localPixel=(sy*WIDTH+lx)*4,globalPixel=(sy*WIDTH+gx)*4;
   const t=Math.max(0,Math.min(1,d/56)),blend=t*t*(3-2*t);
   for(let channel=0;channel<3;channel++)out[p+channel]=Math.round(pixels[localPixel+channel]*(1-blend)+pixels[globalPixel+channel]*blend);
  }
 }
}

function softenHiddenWater(owner,out){
 const original=out.slice(),weights=[1,2,4,2,1];
 for(let y=2;y<HEIGHT-2;y++)for(let x=0;x<WIDTH;x++){
  const i=y*WIDTH+x,p=i*4;if(owner[i]===2||!original[p+3])continue;
  const sum=[0,0,0];let total=0;
  for(let offset=-2;offset<=2;offset++){
   const q=((y+offset)*WIDTH+x)*4;if(!original[q+3])continue;
   const weight=weights[offset+2];total+=weight;for(let channel=0;channel<3;channel++)sum[channel]+=original[q+channel]*weight;
  }
  if(total)for(let channel=0;channel<3;channel++)out[p+channel]=Math.round(original[p+channel]*.3+sum[channel]/total*.7);
 }
}

// Wider clean reserves belong only to the portal/travel surfaces. The lake
// receives texture beneath old foreground, constrained to its actual horizon.
function portalLayerCanvas(pixels,owner,rank){
 const count=WIDTH*HEIGHT,canvas=surface(),context=canvas.getContext('2d'),paint=context.createImageData(WIDTH,HEIGHT),out=paint.data;
 const lakeRoof=rank===2?ridge(WATER_EDGE):null;
 const distance=new Uint16Array(count);distance.fill(65535);
 const queue=new Int32Array(count);let head=0,tail=0;
 for(let i=0;i<count;i++)if(owner[i]===rank){
  const p=i*4;out[p]=pixels[p];out[p+1]=pixels[p+1];out[p+2]=pixels[p+2];out[p+3]=255;
  const x=i%WIDTH,y=Math.floor(i/WIDTH);
  if((x&&owner[i-1]>rank)||(x<WIDTH-1&&owner[i+1]>rank)||(y&&owner[i-WIDTH]>rank)||(y<HEIGHT-1&&owner[i+WIDTH]>rank)){distance[i]=0;queue[tail++]=i;}
 }
 while(head<tail){
  const i=queue[head++],d=distance[i];if(!lakeRoof&&d>=LANDSCAPE_DEPTH_RESERVE)continue;
  const x=i%WIDTH,y=Math.floor(i/WIDTH),neighbors=[];
  if(x)neighbors.push(i-1);if(x<WIDTH-1)neighbors.push(i+1);if(y)neighbors.push(i-WIDTH);if(y<HEIGHT-1)neighbors.push(i+WIDTH);
  for(const next of neighbors)if(owner[next]>rank&&distance[next]>d+1&&(!lakeRoof||Math.floor(next/WIDTH)>=lakeRoof[next%WIDTH]-12)){
   distance[next]=d+1;const q=next*4;
   const texture=Math.sin((next%WIDTH)*.071+Math.floor(next/WIDTH)*.037)*8;
   const edge=lakeRoof?1:Math.max(0,Math.min(1,(LANDSCAPE_DEPTH_RESERVE-d-1+texture)/48));out[q+3]=Math.round(255*edge*edge*(3-2*edge));queue[tail++]=next;
  }
 }
 hiddenRowTexture(pixels,owner,rank,out);if(rank===2)softenHiddenWater(owner,out);context.putImageData(paint,0,0);return canvas;
}
