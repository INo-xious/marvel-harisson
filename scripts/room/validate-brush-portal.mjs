import assert from 'node:assert/strict';
import {createPaintedPortal} from '../../public/brush-study-portal.js';

let checks=0,path=[],strokes=[],clears=0;
function check(value,note){assert.ok(value,note);checks++;}
const context={
 setTransform(){},clearRect(){clears++;},save(){},restore(){},
 beginPath(){path=[];},moveTo(x,y){path.push([x,y]);},lineTo(x,y){path.push([x,y]);},
 stroke(){strokes.push({points:path.map(point=>[...point]),width:this.lineWidth,alpha:this.globalAlpha});},
 fill(){throw new Error('The laptop outline must not paint an interior fill');},
 fillRect(){throw new Error('The laptop outline must not paint a viewport field');},
 clip(){throw new Error('The laptop outline must not substitute an expanded hull');}
};
const canvases=[];
globalThis.window={innerWidth:1200,innerHeight:800,devicePixelRatio:3};
globalThis.document={
 createElement(){const canvas={isConnected:false,style:{},setAttribute(){},getContext(){return context;},remove(){this.isConnected=false;}};canvases.push(canvas);return canvas;},
 body:{append(canvas){canvas.isConnected=true;}}
};
const contour=[[310,450],[290,355],[304,300],[450,285],[467,310],[491,417],[581,447],[540,465],[411,486],[330,475]];
function distance(point,a,b){
 const dx=b[0]-a[0],dy=b[1]-a[1],denominator=dx*dx+dy*dy;
 const t=denominator?Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/denominator)):0;
 return Math.hypot(point[0]-a[0]-dx*t,point[1]-a[1]-dy*t);
}
const portal=createPaintedPortal({reduced:false});
portal.frame({contour,progress:0});check(!canvases[0].isConnected,'Zero progress must not show a trace');
portal.frame({contour,progress:1,opacity:.4});
check(canvases[0].width===1800&&canvases[0].height===1200,'Canvas resolution caps DPR at1.5');
check(strokes.length>20,'A measured multi-point contour must be painted');
for(const stroke of strokes){
 check(stroke.width<=1.1+1e-9,'Pigment remains within .55px of its centerline');
 check(stroke.alpha<=.4,'Caller opacity must constrain every pigment pass');
 for(const point of stroke.points)check(Math.min(...contour.map((a,i)=>distance(point,a,contour[(i+1)%contour.length])))<1e-8,'Each stroke endpoint registers exactly on a measured contour edge');
}
const completeCount=strokes.length;strokes=[];
portal.frame({contour:[[0,0],[100,0],[100,100],[0,100]],progress:.25});
check(strokes.length<completeCount,'A partial contour contains fewer marks');
check(strokes.every(stroke=>stroke.points.every(([x,y])=>x>=0&&x<=100&&y===0)),'Quarter progress stops on the first square edge');
portal.finish();check(!canvases[0].isConnected,'Finishing detaches the canvas');
portal.frame({contour:contour.map(([x,y])=>({x:x+50,y:y+12})),progress:.6});
check(canvases[0].isConnected,'The same overlay can serve a later camera flight');
portal.cancel();check(!canvases[0].isConnected,'Cancelling detaches the canvas');
strokes=[];portal.frame({contour,progress:1,opacity:0});check(strokes.length===0,'Transparent frames contain no paint');
portal.frame({contour:[[0,0],[1,NaN],[2,2]],progress:1});check(strokes.length===0,'Invalid projected contours clear safely');
const quiet=createPaintedPortal({reduced:true});quiet.frame({contour,progress:1});
check(strokes.length===0&&!canvases[1].isConnected,'Reduced motion suppresses contour drawing');
check(clears>8,'Each new frame and cleanup clears previous pigment');
console.log(`Laptop portal: ${checks} precise-contour, progress, opacity and cleanup checks pass.`);
