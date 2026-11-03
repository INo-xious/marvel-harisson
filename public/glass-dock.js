// The actual glass silhouette rises with the hovered control, not just its icon.
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export function dockOutline(width,height,center,lift){
 const pad=30,r=height/2,w=Math.max(width,height),c=clamp(center,r,w-r),a=clamp(lift,0,24),spread=58;
 const y=x=>pad-a*Math.exp(-.5*((x-c)/spread)**2),slope=x=>a*(x-c)/(spread*spread)*Math.exp(-.5*((x-c)/spread)**2);
 const f=n=>n.toFixed(2);let path=`M0 ${f(y(r)+r)} Q0 ${f(y(r))} ${f(r)} ${f(y(r))}`;
 const count=24,dx=(w-2*r)/count;
 for(let i=0;i<count;i++){const x0=r+i*dx,x1=x0+dx,m0=i?slope(x0):0,m1=i===count-1?0:slope(x1);path+=` C${f(x0+dx/3)} ${f(y(x0)+m0*dx/3)} ${f(x1-dx/3)} ${f(y(x1)-m1*dx/3)} ${f(x1)} ${f(y(x1))}`;}
 path+=` Q${f(w)} ${f(y(w-r))} ${f(w)} ${f(y(w-r)+r)} L${f(w)} ${f(pad+height-r)} Q${f(w)} ${f(pad+height)} ${f(w-r)} ${f(pad+height)} L${f(r)} ${f(pad+height)} Q0 ${f(pad+height)} 0 ${f(pad+height-r)} Z`;
 return path;
}
export function mountGlassDock(dock,reduced=false){
 const glass=dock.querySelector('.dock-glass'),edge=dock.querySelector('.dock-edge'),path=edge.querySelector('path'),items=[...dock.querySelectorAll('.dock-item')];
 let width=0,height=0,currentX=0,targetX=0,lift=0,targetLift=0,frame=0,last=0,hoverItem=null;
 const draw=()=>{const d=dockOutline(width,height,currentX,lift);glass.style.clipPath=`path("${d}")`;glass.style.webkitClipPath=`path("${d}")`;path.setAttribute('d',d);dock.style.setProperty('--glass-x',`${currentX/Math.max(width,1)*100}%`);for(const item of items){const distance=(item.offsetLeft+item.offsetWidth/2-currentX)/54,influence=Math.exp(-distance*distance)*(lift/24);item.style.setProperty('--dock-scale',String(1+influence*.14));item.style.setProperty('--dock-lift',`${influence*14}px`);}};
 const tick=now=>{const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;const blend=1-Math.exp(-dt*16);currentX+=(targetX-currentX)*blend;lift+=(targetLift-lift)*blend;draw();if(Math.abs(lift-targetLift)>.025||Math.abs(currentX-targetX)>.1)frame=requestAnimationFrame(tick);else{lift=targetLift;currentX=targetX;draw();frame=0;last=0;}};
 const animate=()=>{if(reduced){lift=0;draw();return;}if(!frame)frame=requestAnimationFrame(tick);};
 const keyboardItem=()=>items.find(item=>item===document.activeElement&&item.matches(':focus-visible'));
 const measure=()=>{width=dock.offsetWidth;height=dock.offsetHeight;const active=hoverItem||keyboardItem();currentX=targetX=active?active.offsetLeft+active.offsetWidth/2:width/2;targetLift=active&&!reduced?24:0;lift=targetLift;edge.setAttribute('viewBox',`0 0 ${width} ${height+30}`);draw();};
 const focus=item=>{if(!item||reduced)return;targetX=item.offsetLeft+item.offsetWidth/2;targetLift=24;animate();};
 dock.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||reduced)return;const x=event.clientX-dock.getBoundingClientRect().left;const nearest=items.reduce((a,b)=>Math.abs(b.offsetLeft+b.offsetWidth/2-x)<Math.abs(a.offsetLeft+a.offsetWidth/2-x)?b:a);hoverItem=nearest;focus(nearest);});
 dock.addEventListener('pointerleave',()=>{hoverItem=null;const active=keyboardItem();if(active)focus(active);else{targetLift=0;animate();}});
 dock.addEventListener('focusin',event=>focus(event.target.closest('.dock-item')));
 dock.addEventListener('focusout',event=>{if(!dock.contains(event.relatedTarget)){if(hoverItem)focus(hoverItem);else{targetLift=0;animate();}}});
 new ResizeObserver(measure).observe(dock);measure();
}
