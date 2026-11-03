/** A native painted pressure wave. The caller owns the canvas's parent. */
const clamp=(value,lo=0,hi=1)=>Math.max(lo,Math.min(hi,value));
const smooth=(lo,hi,value)=>{const t=clamp((value-lo)/(hi-lo));return t*t*(3-2*t);};
const random=seed=>{const value=Math.sin(seed*127.1+311.7)*43758.5453123;return value-Math.floor(value);};
const inks=['#c8bda3','#7f9592','#7d8d9d','#a99b78','#9ba99b','#3f4b50'];

// A held point, a fast outward release, then the final paper settles.
export function domainRevealProgress(progress=0){
 const t=clamp(Number.isFinite(progress)?progress:0);
 if(t<=.08)return 0;
 if(t<.40){const release=(t-.08)/.32;return .92*(1-(1-release)**3);}
 return .92+.08*smooth(.40,1,t);
}

export function createPaintedDomain({reduced=false}={}){
 const element=document.createElement('canvas');
 element.className='painted-domain-pressure';element.setAttribute('aria-hidden','true');
 element.style.cssText='position:fixed;inset:0;width:100vw;height:100dvh;z-index:12;pointer-events:none;touch-action:auto;background:transparent;';
 const context=element.getContext('2d',{alpha:true});
 let width=0,height=0,ratio=0;
 const marks=Array.from({length:31},(_,i)=>({
  seed:29+i*17,angle:random(i*11+2)*Math.PI*2,
  reach:.72+random(i*13+4)*.55,sweep:.09+random(i*19+5)*.36,
  width:1.1+random(i*23+6)*3.9,bend:(random(i*29+7)-.5)*.13,
  ink:inks[i%inks.length],dryAt:.32+random(i*31+8)*.26,dryEnd:.72+random(i*37+9)*.24
 }));
 function resize(bounds){
  const w=Number.isFinite(bounds?.width)?bounds.width:window.innerWidth;
  const h=Number.isFinite(bounds?.height)?bounds.height:window.innerHeight;
  const nextWidth=Math.max(1,w),nextHeight=Math.max(1,h),nextRatio=clamp(window.devicePixelRatio||1,1,1.5);
  if(width===nextWidth&&height===nextHeight&&ratio===nextRatio)return;
  width=nextWidth;height=nextHeight;ratio=nextRatio;
  element.width=Math.round(width*ratio);element.height=Math.round(height*ratio);
  element.style.width=width+'px';element.style.height=height+'px';
  context?.setTransform(ratio,0,0,ratio,0,0);
 }
 function clear(){context?.clearRect(0,0,width,height);}
 function finish(){clear();element.remove();}
 function cancel(){finish();}
 function stroke(points,ink,width,alpha){
  if(points.length<2||alpha<=0)return;
  context.beginPath();context.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)context.lineTo(points[i][0],points[i][1]);
  context.strokeStyle=ink;context.lineWidth=width;context.globalAlpha=alpha;context.stroke();
 }
 function arc(center,radius,mark,density=1){
  for(let bristle=0;bristle<4;bristle++){
   if(random(mark.seed+bristle*23)>density)continue;
   const points=[];
   for(let step=0;step<=11;step++){
    const t=step/11,angle=mark.angle+(t-.5)*mark.sweep;
    const fracture=(random(mark.seed+step*7)-.5)*Math.min(12,radius*.043);
    const r=radius+fracture+(bristle-1.5)*mark.width*.40;
    points.push([center[0]+Math.cos(angle)*r,center[1]+Math.sin(angle)*r]);
   }
   stroke(points,mark.ink,Math.max(.55,mark.width*(bristle===0?.58:.18)),(.16+random(mark.seed+bristle)*.19)*(bristle===0?density:1));
  }
 }
 function streak(center,radius,mark,density){
  const start=radius*(.24+random(mark.seed+2)*.27),end=radius*mark.reach;
  const dx=Math.cos(mark.angle),dy=Math.sin(mark.angle),nx=-dy,ny=dx;
  const spread=Math.min(1,radius/26),segments=Math.max(4,Math.min(14,Math.ceil((end-start)/44)));
  for(let bristle=0;bristle<4;bristle++){
   if(random(mark.seed+bristle*29)>density)continue;
   const phase=random(mark.seed+bristle*37)*Math.PI*2;
   for(let segment=0;segment<segments;segment++){
    const seed=mark.seed+bristle*47+segment*71,pool=random(seed+5);
    // Whole skipped deposits and staggered short ends break the long rails.
    // Every bristle has its own curve rather than a parallel translated path.
    if(random(seed+11)>.67*density+.12)continue;
    const begin=(segment+.04+random(seed+3)*.13)/segments;
    const stop=Math.min(1,(segment+.57+random(seed+7)*.28)/segments);
    const points=[];
    for(let step=0;step<=5;step++){
     const t=begin+(stop-begin)*step/5,r=start+(end-start)*t;
     const swept=Math.sin(t*Math.PI)*radius*mark.bend*(.54+random(mark.seed+bristle*13)*.48);
     const curl=Math.sin(t*Math.PI*2.2+phase)*(radius*.007+mark.width*.43)*spread;
     const fiber=((bristle-1.5)*mark.width*.54+(random(seed+step*17)-.5)*mark.width*.7)*spread;
     const cross=swept+curl+fiber;
     points.push([center[0]+dx*r+nx*cross,center[1]+dy*r+ny*cross]);
    }
    const tip=.48+.52*Math.sin((begin+stop)*.5*Math.PI);
    const pigmentWidth=Math.max(.35,Math.min(2.2,mark.width*(bristle===0?.28:.12)*(.52+pool)*tip));
    stroke(points,mark.ink,pigmentWidth,(.085+pool*.14)*(bristle===0?density:1));
    // Small darker pools sit within selected strokes, not at every segment.
    if(bristle===0&&pool>.72){
     stroke(points.slice(2,5),mark.ink,Math.min(2.6,pigmentWidth*1.25),.055*density);
    }
   }
  }
 }
 function point(center,radius,alpha){
  context.beginPath();
  for(let i=0;i<10;i++){
   const angle=i/10*Math.PI*2,r=radius*(.65+random(i*17+93)*.43);
   const x=center[0]+Math.cos(angle)*r,y=center[1]+Math.sin(angle)*r;
   if(i)context.lineTo(x,y);else context.moveTo(x,y);
  }
  context.closePath();context.fillStyle='#718782';context.globalAlpha=alpha;context.fill();
 }
 function frame({phase,progress=0,center,bounds}={}){
  resize(bounds);clear();
  const still=typeof reduced==='function'?Boolean(reduced()):Boolean(reduced?.matches??reduced);
  if(still||!context||!['charge','burst'].includes(phase))return;
  const origin=Array.isArray(center)?center:[width/2,height/2];
  if(origin.length!==2||!origin.every(Number.isFinite))return;
  const t=clamp(Number.isFinite(progress)?progress:0),span=Math.min(width,height);
  context.save();context.beginPath();context.rect(0,0,width,height);context.clip();
  context.lineCap='round';context.lineJoin='round';
  if(phase==='charge'){
   const contraction=1-smooth(0,1,t),radius=span*.28*contraction+2.2;
   for(const mark of marks){
    const pressure={...mark,ink:mark.seed%3===0?'#899ca6':'#b8bda9',width:Math.min(mark.width,2.4)};
    arc(origin,radius*mark.reach,pressure,.48+smooth(.15,.8,t)*.47);
    if(t>.25&&mark.seed%3===0)streak(origin,radius,pressure,.30+smooth(.25,.85,t)*.55);
   }
   if(t>.60)point(origin,2.2+smooth(.60,1,t)*1.3,.30+smooth(.60,1,t)*.44);
  }else{
   const released=domainRevealProgress(t),radius=2.6+Math.hypot(width,height)*.68*released;
   for(const mark of marks){
    // Each swath loses its own pigment bristles at a different drying time;
    // no whole-frame opacity or scale animation is applied to the picture.
    const density=1-smooth(mark.dryAt,mark.dryEnd,t);
    if(density<=0)continue;
    streak(origin,radius,mark,density);
    if(mark.seed%3!==0)arc(origin,radius*(.83+random(mark.seed+3)*.27),mark,density);
   }
   if(t<.16)point(origin,3.1,.58*(1-smooth(.08,.16,t)));
  }
  context.restore();
 }
 return {element,frame,finish,cancel};
}
