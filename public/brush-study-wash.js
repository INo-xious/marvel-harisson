// Temporary paint mattes. The native painting remains unchanged underneath.
// Four directional brush passes overlap a wet seed, then become fully opaque.
const liveWashes=new WeakMap();
const splatFields=new Map();
const clamp=(value,lo=0,hi=1)=>Math.max(lo,Math.min(hi,value));
const smooth=(lo,hi,value)=>{const t=clamp((value-lo)/(hi-lo));return t*t*(3-2*t);};
const hash=(x,y,seed)=>{const v=Math.sin(x*127.1+y*311.7+seed*19.19)*43758.5453;return v-Math.floor(v);};
function noiseGrid(fx,fy,seed){
 const stride=fx+2,values=new Float32Array(stride*(fy+2));
 for(let y=0;y<fy+2;y++)for(let x=0;x<stride;x++)values[y*stride+x]=hash(x,y,seed);
 return (u,v)=>{const x=u*fx,y=v*fy,ix=Math.floor(x),iy=Math.floor(y),tx=smooth(0,1,x-ix),ty=smooth(0,1,y-iy),i=iy*stride+ix;
  const a=values[i],b=values[i+1],c=values[i+stride],d=values[i+stride+1];return a+(b-a)*tx+(c-a)*ty+(a-b-c+d)*tx*ty;};
}
export function createWashField(width,height,{origin={x:.46,y:.48},seed=7,kind='wash'}={}){
 const field=new Float32Array(width*height),grain=new Float32Array(width*height);
 const ox=clamp(origin.x,.02,.98),oy=clamp(origin.y,.02,.98);
 const rows=[oy,.16,.49,.83];
 const broad=noiseGrid(7,8,seed),middle=noiseGrid(23,27,seed+1),fine=noiseGrid(67,73,seed+2),bristles=noiseGrid(11,84,seed+3);
 const centers=new Float32Array(width*4),travels=new Float32Array(width);
 for(let x=0;x<width;x++){const u=x/Math.max(1,width-1);travels[x]=Math.abs(u-ox)/Math.max(u<ox?ox:1-ox,.1);for(let pass=0;pass<4;pass++)centers[x*4+pass]=rows[pass]+Math.sin(u*5.8+pass*1.9)*.035;}
 let minimum=Infinity,maximum=-Infinity;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/Math.max(1,width-1),v=y/Math.max(1,height-1),i=y*width+x;
  const pigment=broad(u,v)*.58+middle(u,v)*.30+fine(u,v)*.12;
  const bristle=bristles(u,v);
  let arrival;
  if(kind==='ink')arrival=v*.61+u*.19+(pigment-.5)*.09;
  else{
   // A soft wet patch starts at the selected piece of paint. Long, slightly
   // bowed brush passes carry it across the paper rather than a perfect ring.
   arrival=.02+Math.hypot((u-ox)*2.3,(v-oy)*2.8)*.46;
   for(let pass=0;pass<4;pass++){
    const travel=travels[x],center=centers[x*4+pass];
    const cross=Math.abs(v-center)/.19;
    const front=.12+pass*.095+travel*.30+cross*.145+(pigment-.5)*.085+(bristle-.5)*.025;
    arrival=Math.min(arrival,front);
   }
  }
  field[i]=arrival;grain[i]=pigment;minimum=Math.min(minimum,arrival);maximum=Math.max(maximum,arrival);
 }
 // Each pass reaches the whole target before its drying interval. No mask
 // remains on the readable after-state, including responsive paper windows.
 for(let i=0;i<field.length;i++)field[i]=.025+(field[i]-minimum)/Math.max(maximum-minimum,.01)*.79;
 return {width,height,field,grain};
}
// A landed paint splat: lobed impact, narrow radial fingers and a few satellite
// drops. The revealed pixels are the desktop layer itself, not a colored veil.
export function createSplatField(width,height,{origin={x:.5,y:.48},seed=7,satellites=true}={}){
 const key=[width,height,origin.x,origin.y,seed,satellites].join(':');if(splatFields.has(key))return splatFields.get(key);
 const field=new Float32Array(width*height),grain=new Float32Array(width*height);
 const ox=clamp(origin.x,.03,.97),oy=clamp(origin.y,.03,.97),aspect=width/height;
 const broad=noiseGrid(13,15,seed),fine=noiseGrid(51,59,seed+2);
 const radial=new Float32Array(512);
 const pools=satellites?[]:Array.from({length:7},(_,i)=>({angle:hash(i,11,seed)*Math.PI*2,width:.11+hash(i,12,seed)*.31,reach:.04+hash(i,13,seed)*.22}));
 const fingers=satellites?[]:Array.from({length:8},(_,i)=>({angle:hash(i,21,seed)*Math.PI*2,width:.037+hash(i,22,seed)*.076,reach:.08+hash(i,23,seed)*.34}));
 const impactLobes=pools.concat(fingers);
 const pooledGrain=satellites?[]:Array.from({length:19},(_,i)=>hash(i,31,seed));
 const bristleGrain=satellites?[]:Array.from({length:73},(_,i)=>hash(i,32,seed));
 const angularNoise=(angle,values)=>{const at=angle/(Math.PI*2)*values.length,lo=Math.floor(at),weight=smooth(0,1,at-lo);return values[lo%values.length]*(1-weight)+values[(lo+1)%values.length]*weight;};
 for(let i=0;i<512;i++){
  const angle=i/512*Math.PI*2;
  if(satellites){
   radial[i]=.87+.12*Math.sin(angle*5+seed)+.10*Math.sin(angle*9+seed*.3)
    +.08*Math.sin(angle*17+seed*.7)+.50*Math.pow(Math.max(0,Math.cos(angle*7+seed*.21)),22);
  }else{
   // Uneven pools and fingers have independently seeded angles, widths and
   // reach. Their distribution has no repeated spokes or radial symmetry.
   let radius=.73+angularNoise(angle,pooledGrain)*.14+(angularNoise(angle,bristleGrain)-.5)*.028;
   for(const pool of impactLobes){
    const delta=Math.atan2(Math.sin(angle-pool.angle),Math.cos(angle-pool.angle));
    radius+=pool.reach*Math.exp(-.5*(delta/pool.width)**2);
   }
   radial[i]=radius;
  }
 }
 const reach=Math.max(Math.hypot(ox*aspect,oy),Math.hypot((1-ox)*aspect,oy),Math.hypot(ox*aspect,1-oy),Math.hypot((1-ox)*aspect,1-oy));
 const drops=satellites?Array.from({length:9},(_,i)=>{
  const angle=hash(i,2,seed)*Math.PI*2,radius=(.26+hash(i,3,seed)*.37)*reach;
  return {x:ox*aspect+Math.cos(angle)*radius,y:oy+Math.sin(angle)*radius,r:(.013+hash(i,4,seed)*.021)*reach,at:.17+hash(i,5,seed)*.13};
 }):[];
 let max=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/Math.max(1,width-1),v=y/Math.max(1,height-1),dx=(u-ox)*aspect,dy=v-oy,i=y*width+x;
  const angle=(Math.atan2(dy,dx)+Math.PI*2)%(Math.PI*2),at=angle/(Math.PI*2)*512,lo=Math.floor(at)%512;
  const rim=satellites?radial[lo]:radial[lo]+(radial[(lo+1)%512]-radial[lo])*(at-Math.floor(at));
  const pigment=broad(u,v)*.72+fine(u,v)*.28;
  // A centered bloom uses one connected impact. Keep its arrival monotone
  // along each ray; paper grain colors the wet pigment without starting
  // separate spots ahead of that frontier. Ordinary splats retain drops.
  let arrival=.035+Math.pow(Math.hypot(dx,dy)/(reach*rim),.82)*.69+(satellites?(pigment-.5)*.038:0);
  for(const drop of drops){
   const qx=u*aspect-drop.x,qy=v-drop.y;if(Math.abs(qx)>drop.r*1.25||Math.abs(qy)>drop.r*1.25)continue;
   const r=Math.hypot(qx,qy)/drop.r;if(r<1.25)arrival=Math.min(arrival,drop.at+Math.max(0,r-.65)*.21);
  }
  field[i]=Math.max(.018,arrival);grain[i]=pigment;max=Math.max(max,field[i]);
 }
 for(let i=0;i<field.length;i++)field[i]=field[i]/max*.86;
 const matte={width,height,field,grain};if(splatFields.size>=24)splatFields.delete(splatFields.keys().next().value);splatFields.set(key,matte);return matte;
}
export function washCoverage(arrival,grain,progress){
 if(progress<=0)return 0;if(progress>=1)return 1;
 const wet=smooth(arrival-.055,arrival+.065,progress);
 const dried=smooth(.77,.97,progress);
 return wet*(1.-(1.-dried)*(.10+.17*grain)*(1.-smooth(0,.24,progress-arrival)));
}
// Remaining veil coverage. A thin wet edge follows the source-locked paper
// grain; completed pixels clear immediately rather than retaining a haze.
export function eraseCoverage(arrival,grain,progress){
 if(progress<=0)return 1;if(progress>=1)return 0;
 // Most pixels are outside the narrow edge, avoiding needless grain math.
 if(progress<arrival-.008)return 1;if(progress>arrival+.008)return 0;
 const g=clamp(grain),pool=smooth(.15,.85,g);
 const edge=arrival+(pool-.5)*.005,feather=.0012+g*.0022;
 return 1.-smooth(edge-feather,edge+feather,progress);
}
export function cancelWatercolor(element){liveWashes.get(element)?.cancel();}
export function watercolorReveal(element,{duration=1050,delay=0,from=null,origin=null,seed=7,kind='wash',ink='#82918b',edge='wet',lift=false,erase=false,reduced=false,onFrame=null,progressCurve=null,deferred=false,hold=false}={}){
 cancelWatercolor(element);
 const still=typeof reduced==='function'?reduced():Boolean(reduced?.matches??reduced);
 if(still){onFrame?.(1);return {finished:Promise.resolve({cancelled:false}),cancel(){},finish(){}};}
 const bounds=element.getBoundingClientRect(),ratio=Math.max(bounds.width,1)/Math.max(bounds.height,1);
 const width=Math.round(ratio>=1?480:Math.max(160,480*ratio)),height=Math.round(ratio>=1?Math.max(160,480/ratio):480);
 const center=origin||(kind==='bloom'?{x:.5,y:.5}:{x:from?clamp((from.left+from.width/2-bounds.left)/Math.max(bounds.width,1)):.46,y:from?clamp((from.top+from.height/2-bounds.top)/Math.max(bounds.height,1)):.48});
 const matte=kind==='splat'||kind==='bloom'?createSplatField(width,height,{origin:center,seed,satellites:kind!=='bloom'}):createWashField(width,height,{origin:center,seed,kind});
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const context=canvas.getContext('2d'),pixels=context.createImageData(width,height);
 for(let i=0;i<matte.field.length;i++){pixels.data[i*4]=255;pixels.data[i*4+1]=255;pixels.data[i*4+2]=255;}
 const names=['maskImage','webkitMaskImage','maskSize','webkitMaskSize','maskRepeat','webkitMaskRepeat','maskPosition','webkitMaskPosition','position'];
 const saved=Object.fromEntries(names.map(name=>[name,element.style[name]]));
 const front=document.createElement('canvas');front.width=width;front.height=height;front.setAttribute('aria-hidden','true');front.className='watercolor-front';
 Object.assign(front.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',mixBlendMode:'multiply',zIndex:'8'});
 const frontier=front.getContext('2d'),tide=frontier.createImageData(width,height);
 const tint=ink.replace('#','');const rgb=[0,2,4].map(offset=>parseInt(tint.slice(offset,offset+2),16)||128);
 for(let i=0;i<matte.field.length;i++){tide.data[i*4]=rgb[0];tide.data[i*4+1]=rgb[1];tide.data[i*4+2]=rgb[2];}
 if(kind!=='ink'){if(getComputedStyle(element).position==='static')element.style.position='relative';element.append(front);}
 element.style.maskSize=element.style.webkitMaskSize='100% 100%';element.style.maskRepeat=element.style.webkitMaskRepeat='no-repeat';element.style.maskPosition=element.style.webkitMaskPosition='center';
 const className=erase?'watercolor-erasing':lift?'watercolor-lifting':'watercolor-revealing';element.classList.add(className);
 let frame=0,done=false,restored=false,paintAt=-Infinity,active=!deferred,start=performance.now()+delay;
 let resolve;const finished=new Promise(r=>resolve=r);
 function paint(progress){
  // Erase opens the same advancing painted shape, rather than reversing
  // time through a lift. The original lift behavior stays unchanged.
  const shaped=typeof progressCurve==='function'?clamp(progressCurve(progress)):progress;
  const spreading=erase?shaped:lift?1-shaped:shaped;
  for(let i=0;i<matte.field.length;i++){
   const coverage=erase?eraseCoverage(matte.field[i],matte.grain[i],spreading):edge==='dry'?1-eraseCoverage(matte.field[i],matte.grain[i],spreading):washCoverage(matte.field[i],matte.grain[i],spreading);
   pixels.data[i*4+3]=Math.round(coverage*255);
   const wetEdge=erase?4*coverage*(1-coverage):smooth(matte.field[i]-.02,matte.field[i]+.035,spreading)*(1-smooth(matte.field[i]+.045,matte.field[i]+.17,spreading));
   tide.data[i*4+3]=Math.round(wetEdge*(.07+.08*matte.grain[i])*255);
  }
  if(kind!=='ink')frontier.putImageData(tide,0,0);
  context.putImageData(pixels,0,0);const image=`url("${canvas.toDataURL('image/png')}")`;
  element.style.maskImage=element.style.webkitMaskImage=image;onFrame?.(progress);
 }
 function restore(){
  if(restored)return;restored=true;front.remove();
  if(liveWashes.get(element)===handle){for(const name of names)element.style[name]=saved[name]||'';element.classList.remove(className);liveWashes.delete(element);}
 }
 function settle(cancelled=false){
  if(done){if(cancelled)restore();return;}done=true;cancelAnimationFrame(frame);
  front.remove();
  if((lift||erase)&&hold&&!cancelled)element.classList.remove(className);else restore();
  resolve({cancelled});
 }
 function tick(now){
  if(done)return;if(now<start){frame=requestAnimationFrame(tick);return;}const progress=clamp((now-start)/Math.max(duration,1));
  // A watercolor frontier needs broad brush cadence, not 60 PNG encodes/sec.
  if(now-paintAt>=(erase&&progressCurve?24:42)||progress>=1){paint(progress);paintAt=now;}
  if(progress>=1)settle();else frame=requestAnimationFrame(tick);
 }
 const handle={finished,start:(at=performance.now())=>{if(active||done)return;active=true;start=at+delay;frame=requestAnimationFrame(tick);},cancel:()=>settle(true),finish:()=>{if(done)return;paint(1);settle();}};
 liveWashes.set(element,handle);paint(0);if(active)frame=requestAnimationFrame(tick);return handle;
}
