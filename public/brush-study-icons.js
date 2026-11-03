/**
 * Rewetting and small movements of the painted plaques on the window sill.
 * Positions are native art pixels, with y pointing down. The inverse warp
 * must feed both the texture lookup and its silhouette so their edges agree.
 */
export const STUDY_SILL_ICONS = Object.freeze([
 {id:'linkedin',label:'LinkedIn',center:[770,425],foot:[768,453],direction:-1},
 {id:'github',label:'GitHub',center:[844,431],foot:[844,453],direction:1},
 {id:'email',label:'Gmail',center:[919,431],foot:[919,453],direction:-.7}
].map(icon=>Object.freeze({...icon,center:Object.freeze(icon.center),foot:Object.freeze(icon.foot)})));

export const studyIconMotionGLSL = `
uniform vec3 iconLift,iconTilt,iconPress,iconHover,iconWet,iconBloom;
float studyIconSlot(vec3 values,float slot){
 return slot<.5?values.x:slot<1.5?values.y:values.z;
}
float studyIconIndex(vec2 p){return p.x<807.?0.:p.x<882.?1.:2.;}
vec2 studyIconFoot(float slot){
 return slot<.5?vec2(768.,453.):slot<1.5?vec2(844.,453.):vec2(919.,453.);
}
vec2 studyIconSourcePoint(vec2 p){
 // Domains include the whole transformed brush fringe but end before the
 // radio and foliage. Transparent surrounding source pixels stay unpainted.
 if(p.x<725.||p.x>966.||p.y<378.||p.y>478.)return p;
 float slot=studyIconIndex(p);
 float lift=studyIconSlot(iconLift,slot),angle=studyIconSlot(iconTilt,slot);
 float press=studyIconSlot(iconPress,slot);
 vec2 pivot=studyIconFoot(slot);
 vec2 local=p-pivot+vec2(0.,lift);
 float c=cos(angle),s=sin(angle);
 // Motion remains quiet; pigment diffusion provides the main response.
 local=vec2(c*local.x+s*local.y,-s*local.x+c*local.y);
 local/=vec2(1.+press*.004,1.-press*.006);
 return pivot+local;
}
float studyIconGrain(vec2 p){
 vec2 cell=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 float a=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);
 float b=fract(sin(dot(cell+vec2(1.,0.),vec2(127.1,311.7)))*43758.5453);
 float c=fract(sin(dot(cell+vec2(0.,1.),vec2(127.1,311.7)))*43758.5453);
 float d=fract(sin(dot(cell+vec2(1.),vec2(127.1,311.7)))*43758.5453);
 return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
vec3 studyIconGlaze(vec2 sourcePoint,vec3 paint,float coverage){
 if(sourcePoint.x<738.||sourcePoint.x>950.||sourcePoint.y<396.||sourcePoint.y>458.)return paint;
 float slot=studyIconIndex(sourcePoint);
 float attention=studyIconSlot(iconHover,slot),press=studyIconSlot(iconPress,slot);
 float wet=studyIconSlot(iconWet,slot),bloom=studyIconSlot(iconBloom,slot);
 vec2 pivot=studyIconFoot(slot),q=(sourcePoint-pivot+vec2(3.,23.))/vec2(27.,26.);
 float cloud=studyIconGrain(sourcePoint*.12+slot*3.7);
 float grain=studyIconGrain(sourcePoint*1.24+slot*5.3);
 float brush=studyIconGrain(sourcePoint*.29+vec2(slot*11.,2.));
 // A fresh water mark moves through the existing pigment. Its irregular
 // advancing edge deposits a dilute tide line; the center lifts slightly.
 float radius=length(q*vec2(1.,.88));
 float front=.10+1.75*bloom+(cloud-.5)*.21;
 float edge=(1.-smoothstep(.045,.19,abs(radius-front)))*wet;
 float soaked=(1.-smoothstep(front-.13,front+.13,radius))*wet;
 float drying=wet*(1.-wet)*4.;
 float pigment=1.-smoothstep(.70,.995,min(paint.r,min(paint.g,paint.b)));
 // Paper reserves and letterforms retain their character. All effects are
 // source-locked, constrained by the badge matte and return to zero dry.
 float absorption=(edge*.085+soaked*.018+drying*grain*.038+press*.018)*(.35+.65*pigment);
 vec3 settled=paint*(1.-absorption);
 settled+=vec3(.074,.065,.048)*soaked*(.55+.45*cloud)*(1.-pigment*.6);
 settled+=vec3(.018,.014,.008)*attention*(.45+.55*brush);
 return mix(paint,clamp(settled,0.,1.),clamp(coverage,0.,1.));
}
`;

export function createSillIconMotion({THREE,reduced=false}){
 const uniforms={iconLift:{value:new THREE.Vector3()},iconTilt:{value:new THREE.Vector3()},iconPress:{value:new THREE.Vector3()},iconHover:{value:new THREE.Vector3()},iconWet:{value:new THREE.Vector3()},iconBloom:{value:new THREE.Vector3()}};
 const states=STUDY_SILL_ICONS.map(()=>({pointer:false,focus:false,lift:0,tilt:0,hover:0,pressAge:Infinity,wet:0,bloom:0}));
 const valid=index=>Number.isInteger(index)&&index>=0&&index<states.length;
 function hover(index,active,source='pointer'){
  if(!valid(index))return false;
  const state=states[index],wasActive=state.pointer||state.focus;
  state[source==='focus'?'focus':'pointer']=Boolean(active);
  if(!reduced&&!wasActive&&(state.pointer||state.focus)){state.wet=1;state.bloom=0;}
  return true;
 }
 function focus(index,active){return hover(index,active,'focus');}
 function press(index){
  if(!valid(index))return false;
  if(reduced)return true;
  const state=states[index];state.pressAge=0;state.wet=1;state.bloom=0;
  return true;
 }
 function interact(index,type,active=true){
  if(type==='press'||type==='click')return press(index);
  if(type==='focus'||type==='blur')return focus(index,type==='focus'&&active);
  if(type==='leave')return hover(index,false);
  return hover(index,active);
 }
 function update(dt){
  const delta=Math.min(.05,Math.max(0,Number.isFinite(dt)?dt:0));
  for(let index=0;index<states.length;index++){
   const state=states[index],active=state.pointer||state.focus;
   if(reduced){state.lift=state.tilt=state.hover=state.wet=state.bloom=0;state.pressAge=Infinity;continue;}
   state.pressAge+=delta;
   const pulse=Math.exp(-state.pressAge*12);
   const liftTarget=(active?2.2:0)-pulse*.6;
   const tiltTarget=(active?.018:0)*STUDY_SILL_ICONS[index].direction;
   // Exponential settling has no bounce, oscillation or continuous rocking.
   state.lift+=(liftTarget-state.lift)*(1.-Math.exp(-delta*10));
   state.tilt+=(tiltTarget-state.tilt)*(1.-Math.exp(-delta*9));
   state.hover+=(Number(active)-state.hover)*(1.-Math.exp(-delta*10));
   state.wet*=Math.exp(-delta*1.8);
   if(state.wet<.0001)state.wet=0;
   state.bloom=Math.min(1,state.bloom+delta*.8);
  }
  for(let index=0;index<states.length;index++){
   const state=states[index];
   uniforms.iconLift.value.setComponent(index,state.lift);
   uniforms.iconTilt.value.setComponent(index,state.tilt);
   uniforms.iconPress.value.setComponent(index,reduced?0:Math.exp(-state.pressAge*12));
   uniforms.iconHover.value.setComponent(index,state.hover);
   uniforms.iconWet.value.setComponent(index,state.wet);
   uniforms.iconBloom.value.setComponent(index,state.bloom);
  }
 }
 function getPose(index){
  if(!valid(index))return null;
  const state=states[index],icon=STUDY_SILL_ICONS[index];
  const press=reduced?0:Math.exp(-state.pressAge*12),scaleX=1+press*.004,scaleY=1-press*.006;
  const x=(icon.center[0]-icon.foot[0])*scaleX,y=(icon.center[1]-icon.foot[1])*scaleY;
  const c=Math.cos(state.tilt),s=Math.sin(state.tilt);
  return {lift:state.lift,angle:state.tilt,press,hover:state.hover,wet:state.wet,bloom:state.bloom,scaleX,scaleY,foot:{x:icon.foot[0],y:icon.foot[1]-state.lift},center:{x:icon.foot[0]+c*x-s*y,y:icon.foot[1]-state.lift+s*x+c*y}};
 }
 return {uniforms,hover,focus,press,interact,update,getPose};
}
