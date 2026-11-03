import assert from 'node:assert/strict';
import {createPaintedDomain,domainRevealProgress} from '../../public/brush-study-domain.js';

let checks=0,path=[],paint=[],clips=[],clears=0,activeClip=null;
const savedClips=[];
function check(value,note){assert.ok(value,note);checks++;}
const context={
 setTransform(){},clearRect(){clears++;},save(){savedClips.push(activeClip);},restore(){activeClip=savedClips.pop();},beginPath(){path=[];},
 moveTo(x,y){path.push([x,y]);},lineTo(x,y){path.push([x,y]);},closePath(){},
 rect(x,y,width,height){clips.push([x,y,width,height]);},clip(){activeClip=clips.at(-1);},
 stroke(){paint.push({points:path.map(point=>[...point]),width:this.lineWidth,alpha:this.globalAlpha,clip:activeClip?.slice()});},
 fill(){paint.push({points:path.map(point=>[...point]),alpha:this.globalAlpha,clip:activeClip?.slice()});}
};
const canvas=()=>({style:{},parentElement:null,width:0,height:0,setAttribute(){},getContext(){return context;},toDataURL(){throw new Error('Pressure animation must not encode PNG frames');},remove(){if(this.parentElement){this.parentElement.children=this.parentElement.children.filter(child=>child!==this);this.parentElement=null;}}});
const container=()=>({children:[],append(element){element.remove();element.parentElement=this;this.children.push(element);}});
globalThis.window={innerWidth:1416,innerHeight:900,devicePixelRatio:3};
globalThis.document={createElement:()=>canvas(),body:{append(){throw new Error('The pressure helper must not own parent placement');}}};
check(domainRevealProgress(0)===0&&domainRevealProgress(.08)===0,'Pressure holds the initial point');
check(domainRevealProgress(.2)>.65&&domainRevealProgress(.4)===.92,'The release expands rapidly before settling');
check(domainRevealProgress(1)===1&&domainRevealProgress(-1)===0&&domainRevealProgress(2)===1,'Release has clamped exact endpoints');
let last=0;
for(let step=0;step<=200;step++){const value=domainRevealProgress(step/200);check(value>=last&&value>=0&&value<=1,'Domain reveal progress is monotone');last=value;}
const domain=createPaintedDomain({reduced:false}),body=container(),dialog=container(),center=[708,450];
body.append(domain.element);domain.frame({phase:'charge',progress:0,center});
check(domain.element.width===2124&&domain.element.height===1350,'Native canvas caps DPR at1.5');
check(domain.element.parentElement===body,'Frame retains the caller-selected parent');
check(clips.at(-1).join(',')==='0,0,1416,900','Pressure paint is clipped to native viewport bounds');
const farthest=()=>Math.max(...paint.flatMap(mark=>mark.points).map(([x,y])=>Math.hypot(x-center[0],y-center[1])));
const chargedRadius=farthest();check(chargedRadius>200,'Charge begins as distributed broken brush marks');
paint=[];domain.frame({phase:'charge',progress:1,center});
check(farthest()<10,'Pressure marks collapse into one painted point');
dialog.append(domain.element);paint=[];domain.frame({phase:'burst',progress:.2,center});
check(domain.element.parentElement===dialog,'Burst respects a native-dialog parent');
check(paint.length>40,'The sudden burst contains organic pressure strokes');
check(farthest()>500,'The pressure wave expands outward from its point');
for(const mark of paint){
 check(mark.alpha>=0&&mark.alpha<=1,'Individual pigment density remains bounded');
 for(const point of mark.points)check(point.every(Number.isFinite),'Projected brush marks stay finite');
}
const wetMarks=paint.length;paint=[];domain.frame({phase:'burst',progress:.9,center});
check(paint.length<wetMarks,'Drying removes pigment bristles independently');
paint=[];domain.frame({phase:'burst',progress:1,center});check(paint.length===0,'The settled burst leaves no animated paint');
check(!domain.element.style.opacity&&!domain.element.style.transform,'Canvas has no whole-frame opacity or image-scale animation');
domain.finish();check(!domain.element.parentElement&&dialog.children.length===0,'Finish clears and detaches the native canvas');
body.append(domain.element);domain.frame({phase:'charge',progress:.5,center:[100,90],bounds:{width:320,height:240}});
check(domain.element.width===480&&domain.element.height===360,'Explicit native bounds resize without changing DPR cap');
check(clips.at(-1).join(',')==='0,0,320,240','Custom bounds constrain the pressure drawing');
domain.cancel();check(!domain.element.parentElement&&body.children.length===0,'Cancel cleans up a reused canvas');

// A painting stage can sit away from the page origin. The native drawing
// must still use its supplied local center and clip, preserving white paper.
const stage=container(),paintingBounds={left:212,top:135,width:334,height:228},localCenter=[73,84];
stage.append(domain.element);domain.element.style.position='absolute';paint=[];
domain.frame({phase:'charge',progress:1,center:localCenter,bounds:paintingBounds});
check(domain.element.width===501&&domain.element.height===342,'Painting-sized backing pixels use explicit bounds rather than viewport dimensions');
check(domain.element.style.width==='334px'&&domain.element.style.height==='228px','Canvas CSS extent matches the painting stage');
check(domain.element.style.position==='absolute'&&domain.element.parentElement===stage,'Frames preserve the caller-controlled local positioning and stage parent');
check(paint.length>0&&paint.every(mark=>mark.clip?.join(',')==='0,0,334,228'),'All pressure strokes and fills share the explicit painting clip');
check(paint.flatMap(mark=>mark.points).every(([x,y])=>Math.hypot(x-localCenter[0],y-localCenter[1])<10),'Charge contracts around the supplied local center without adding page offset');
paint=[];domain.frame({phase:'burst',progress:.2,center:localCenter,bounds:paintingBounds});
check(paint.length>0&&paint.every(mark=>mark.clip?.join(',')==='0,0,334,228'),'The outward burst is clipped to painting bounds even when its rays extend beyond them');
paint=[];domain.frame({phase:'charge',progress:1,bounds:paintingBounds});
check(paint.flatMap(mark=>mark.points).every(([x,y])=>Math.hypot(x-paintingBounds.width/2,y-paintingBounds.height/2)<10),'Default center comes from painting bounds rather than the viewport');
domain.cancel();check(!domain.element.parentElement&&stage.children.length===0,'Stage cleanup leaves no transition canvas on surrounding paper');
paint=[];domain.frame({phase:'burst',progress:.2,center:[1]});check(paint.length===0,'Invalid center geometry clears safely');
const quiet=createPaintedDomain({reduced:true});body.append(quiet.element);quiet.frame({phase:'burst',progress:.2,center});
check(paint.length===0,'Reduced motion suppresses the native brush animation');quiet.finish();
check(clears>=10,'Frames and cleanup clear earlier pressure marks');
console.log(`Painted domain: ${checks} pressure, release, native-canvas, parent and cleanup checks pass.`);
