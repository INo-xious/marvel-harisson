/**
 * Trace the actual laptop's projected painted silhouette.
 * frame accepts an ordered contour in CSS pixels, as [x,y] or {x,y} points.
 * Progress is a fraction of its closed perimeter; opacity controls fading.
 * Every stroke centerline follows those exact edges. Dry-brush variation
 * comes only from short gaps and pigment density, with <0.6 px paint spread.
 * The caller owns the camera flight and the paint reveal inside the screen.
 */
const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
const random=seed=>{const value=Math.sin(seed*127.1+311.7)*43758.5453123;return value-Math.floor(value);};
const mixPoint=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const asPoint=point=>Array.isArray(point)?{x:point[0],y:point[1]}:{x:point?.x,y:point?.y};

export function createPaintedPortal({reduced=false}={}){
 const canvas=document.createElement('canvas');
 canvas.className='painted-laptop-portal';
 canvas.setAttribute('aria-hidden','true');
 canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100dvh;z-index:8;pointer-events:none;touch-action:auto;background:transparent;';
 const context=canvas.getContext('2d',{alpha:true});
 let width=0,height=0,ratio=0;
 function resize(){
  const nextWidth=Math.max(1,window.innerWidth),nextHeight=Math.max(1,window.innerHeight);
  const nextRatio=clamp(window.devicePixelRatio||1,1,1.5);
  if(width===nextWidth&&height===nextHeight&&ratio===nextRatio)return;
  width=nextWidth;height=nextHeight;ratio=nextRatio;
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  context?.setTransform(ratio,0,0,ratio,0,0);
 }
 function clear(){context?.clearRect(0,0,width,height);}
 function finish(){clear();canvas.remove();}
 function cancel(){finish();}
 function frame({contour,progress=0,opacity=1}={}){
  resize();clear();
  if(reduced||!context||!Array.isArray(contour)||contour.length<3)return;
  const points=contour.map(asPoint);
  if(points.some(point=>!Number.isFinite(point.x)||!Number.isFinite(point.y)))return;
  const t=clamp(Number.isFinite(progress)?progress:0,0,1);
  const alpha=clamp(Number.isFinite(opacity)?opacity:0,0,1);
  if(t<=0||alpha<=0)return;
  const lengths=points.map((point,i)=>Math.hypot(points[(i+1)%points.length].x-point.x,points[(i+1)%points.length].y-point.y));
  const perimeter=lengths.reduce((sum,value)=>sum+value,0);
  if(!Number.isFinite(perimeter)||perimeter<1)return;
  if(!canvas.isConnected)document.body.append(canvas);
  context.save();context.lineCap='round';context.lineJoin='round';
  let remaining=perimeter*t;
  for(let edge=0;edge<points.length&&remaining>0;edge++){
   const length=lengths[edge];if(length<.001)continue;
   const end=clamp(remaining/length,0,1);remaining-=length;
   const a=points[edge],b=points[(edge+1)%points.length];
   const marks=Math.max(1,Math.ceil(length/8));
   for(let mark=0;mark<marks;mark++){
    const start=mark/marks;if(start>=end)break;
    const grain=random(edge*41+mark*13+3);
    const stop=Math.min(end,(mark+.84+grain*.14)/marks);
    const p=mixPoint(a,b,start),q=mixPoint(a,b,stop);
    // Both pigment passes share this exact line. There is no jitter,
    // translated duplicate, enlarged hull, wet blot or interior fill.
    context.beginPath();context.moveTo(p.x,p.y);context.lineTo(q.x,q.y);
    context.strokeStyle='#657477';context.globalAlpha=alpha*(.34+grain*.25);
    context.lineWidth=.90+grain*.20;context.stroke();
    context.strokeStyle='#eae2ce';context.globalAlpha=alpha*(.58+grain*.25);
    context.lineWidth=.40+grain*.14;context.stroke();
   }
  }
  context.restore();
 }
 return {frame,finish,cancel};
}
