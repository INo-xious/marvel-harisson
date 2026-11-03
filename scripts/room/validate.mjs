import assert from 'node:assert/strict';
import { readFile,readdir,stat } from 'node:fs/promises';
import { registerHooks } from 'node:module';
const root=new URL('../../',import.meta.url);
registerHooks({resolve(s,c,next){if(s==='three')return{url:new URL('public/vendor/three.module.js',root).href,shortCircuit:true};return next(s,c);}});
const THREE=await import('three');
const {GLTFLoader}=await import(new URL('public/vendor/GLTFLoader.js',root));
const {RoomScene}=await import(new URL('public/scene.js',root));
const time=await import(new URL('public/time.js',root));
const {portfolio,tracks}=await import(new URL('public/content.js',root));
const {ART,OBJECTS,pointInPolygon}=await import(new URL('public/art-layout.js',root));
const geometry=await import(new URL('public/painted-geometry.js',root));
const {CAMERA,MACBOOK,LAMP_POSITION,artToWorld,project3D,sunForTime,shadowWorld}=geometry;
const {LAPTOP_CENTER}=await import(new URL('public/laptop-placement.js',root));
geometry.validateGeometry();
const originalCenter=[MACBOOK.width/2,0,MACBOOK.depth/2],before=project3D(originalCenter),after=project3D(LAPTOP_CENTER);
assert.ok(Math.abs(after[0]-before[0]-90)<1e-6&&Math.abs(after[1]-before[1])<1e-6,'Laptop must move 90px right while staying on the table');
const [rearLeft,rearRight,frontRight,frontLeft]=CAMERA.corners;
assert.ok(frontLeft[0]>rearLeft[0]&&frontRight[0]>rearRight[0], 'Both laptop depth edges must follow the table down-right');
const widthSlope=((rearRight[1]+frontRight[1])-(rearLeft[1]+frontLeft[1]))/((rearRight[0]+frontRight[0])-(rearLeft[0]+frontLeft[0]));
assert.ok(Math.abs(Math.atan(widthSlope)-Math.atan(-.105))<Math.PI/180,'Laptop width axis must align with desk front edge');
const depthSlope=((frontLeft[0]+frontRight[0])-(rearLeft[0]+rearRight[0]))/((frontLeft[1]+frontRight[1])-(rearLeft[1]+rearRight[1]));
assert.ok(depthSlope>.7&&depthSlope<.95,'Laptop must face the depth direction indicated in the reference');

assert.equal(time.dateInOsaka(new Date('2026-09-19T16:00:00Z')),'2026-09-20');
assert.equal(time.minutesInOsaka(new Date('2026-09-19T16:00:00Z')),60);
for(const m of [0,345,720,1060,1260,1439])assert.equal(time.minutesInOsaka(time.previewDate(m)),m);
const chosenAt=new Date('2026-09-21T10:00:00Z'),chosen=time.startTimePreview(1439,chosenAt);
assert.equal(time.runningRoomDate(chosen,new Date(chosenAt.getTime()+1750)).getTime()-chosen.dateMs,1750,'Selected time must advance between updates');
assert.equal(time.dateInOsaka(time.runningRoomDate(chosen,new Date(chosenAt.getTime()+61000))),'2026-09-22','Selected time must run across midnight');
assert.equal(time.runningRoomDate(null,chosenAt).getTime(),chosenAt.getTime(),'Return to now must follow live time');
assert.equal(time.sunState(time.previewDate(720)).daytime,1);assert.equal(time.sunState(time.previewDate(0)).daytime,0);
for(const file of await readdir(new URL('public/',root))){
 if(!/\.(js|css|html)$/.test(file))continue;
 const source=await readFile(new URL('public/'+file,root),'utf8');
 for(const path of new Set([...source.matchAll(/["'(](\/(?:assets|vendor)\/[^\s"')]+)/g)].map(m=>m[1]))){const target=await stat(new URL('public'+path,root));assert.ok(path.endsWith('/')?target.isDirectory():target.isFile(),path);}
 for(const path of [...source.matchAll(/from ['"](\.\/[^'"]+)['"]/g)].map(m=>m[1]))assert.ok((await stat(new URL('public/'+path,root))).isFile(),path);
}
for(const t of tracks)assert.ok((await stat(new URL('public'+t.src,root))).size>10000);
for(const p of ['projects','labs','notes','awards'])assert.ok(Array.isArray(portfolio[p]));
for(const [name,w,h,format]of [['room-clean-plate.png',1672,941,2],['city-water.png',1774,887,6],['foliage-layer.png',1774,887,6],['foreground-monstera.png',1136,1384,6],['cat-puppet-atlas.png',1774,887,6],['cloud-streaks.png',2172,724,6]]){const b=await readFile(new URL('public/assets/painted/'+name,root));assert.equal(b.readUInt32BE(16),w);assert.equal(b.readUInt32BE(20),h);assert.equal(b[25],format,`${name} has incorrect RGB/alpha format`);}
const bytes=await readFile(new URL('public/assets/painted/macbook-painted.glb',root));
globalThis.self=globalThis;globalThis.createImageBitmap=async blob=>{const b=Buffer.from(await blob.arrayBuffer());assert.equal(b.toString('ascii',1,4),'PNG');return{width:b.readUInt32BE(16),height:b.readUInt32BE(20),close(){}};};
const asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const actor=asset.scene;actor.position.fromArray(LAPTOP_CENTER);actor.updateMatrixWorld(true);
const lid=actor.getObjectByName('MacBookLid'),base=actor.getObjectByName('MacBookBase'),screen=actor.getObjectByName('MacBookScreen');assert.ok(lid&&base&&screen);
const bounds=new THREE.Box3().setFromObject(actor);assert.ok(Math.abs(bounds.min.y)<1e-6);assert.ok(Math.abs(bounds.max.y-.0155)<1e-6);
assert.ok(Math.abs(bounds.max.x-bounds.min.x-.3126)<1e-6);assert.ok(Math.abs(bounds.max.z-bounds.min.z-.2212)<1e-6);
const hinge0=lid.getWorldPosition(new THREE.Vector3()),base0=base.matrixWorld.clone();
for(const angle of [0,-.2,-1,-110*Math.PI/180]){lid.rotation.x=angle;actor.updateMatrixWorld(true);assert.ok(lid.getWorldPosition(new THREE.Vector3()).distanceTo(hinge0)<1e-9);assert.ok(base.matrixWorld.equals(base0),'Opening must never lift or rotate the base');}
const probe=Object.create(RoomScene.prototype);Object.assign(probe,{loaded:true,actor,screen,lid,focus:0,pan:ART.width*.34,currentPan:ART.width/2,raycaster:new THREE.Raycaster(),hitMeshes:[],renderer:{setSize(){}},camera:new THREE.OrthographicCamera(-836,836,470.5,-470.5,.1,10000),worldCamera:new THREE.PerspectiveCamera(),baseProjection:new THREE.Matrix4().fromArray(CAMERA.three.columnMajor)});
probe.worldCamera.position.fromArray(CAMERA.three.position);probe.worldCamera.up.fromArray(CAMERA.three.up);probe.worldCamera.lookAt(...CAMERA.three.target);probe.worldCamera.updateMatrixWorld(true);
actor.traverse(o=>{if(o.isMesh)probe.hitMeshes.push(o);});
globalThis.document={querySelector:()=>null};
const wheelProbe=Object.create(RoomScene.prototype);Object.assign(wheelProbe,{entered:true,loaded:true,busy:false,focus:0,width:390,viewWidth:500,pan:700,callbacks:{},reduced:false});
let prevented=0;const wheel=(deltaX,deltaY=0,extra={})=>wheelProbe.panWheel({deltaX,deltaY,deltaMode:0,preventDefault(){prevented++;},...extra});
wheel(39);assert.equal(wheelProbe.pan,750);wheel(-39);assert.equal(wheelProbe.pan,700);wheel(0,39,{shiftKey:true});assert.equal(wheelProbe.pan,750);
wheel(39,0,{ctrlKey:true});assert.equal(wheelProbe.pan,750,'Pinch zoom must not pan');wheel(0,100);assert.equal(wheelProbe.pan,750,'Vertical scrolling must not unexpectedly pan');
wheel(1e6);assert.equal(wheelProbe.pan,ART.width-wheelProbe.viewWidth/2);assert.equal(prevented,4,'Horizontal room motion must consume the native swipe');
for(const[w,h]of [[1440,900],[1920,1080],[2560,1080],[390,844],[667,375]]){
 probe.canvas={parentElement:{getBoundingClientRect:()=>({width:w,height:h})}};probe.resize();lid.rotation.x=0;assert.ok(probe.viewWidth<=ART.width+.001&&probe.viewHeight<=ART.height+.001,'Full-bleed view must not expose a letterbox');
 for(const[id,o]of Object.entries(OBJECTS)){
  probe.pan=THREE.MathUtils.clamp(o.anchor[0],probe.viewWidth/2,ART.width-probe.viewWidth/2);
  probe.currentPan=probe.pan;probe.updateCamera();const p=probe.toScreen(o.anchor);assert.ok(p.visible,`${id} hidden at ${w}x${h}`);assert.equal(probe.hit(p.x,p.y),id,`${id} cannot be clicked at ${w}x${h}`);
 }
 if(!probe.mobile){probe.reset();probe.currentPan=probe.pan;probe.updateCamera();const left=probe.toScreen([26,273]),right=probe.toScreen([91,273]);assert.ok(left.x>=0&&right.x<=w,'LinkedIn cropped');}
 // Overlay world camera and art camera must agree through zoom and pan.
 lid.rotation.x=-110*Math.PI/180;
 for(const f of [0,.5,1]){probe.focus=f;probe.updateCamera();for(const p of [[0,0,0],[.3126,0,.2212],[.15,.15,-.02]]){const a=probe.toScreen(project3D(p)),b=new THREE.Vector3(...p).project(probe.worldCamera);assert.ok(Math.hypot(a.x-(b.x+1)*w/2,a.y-(1-b.y)*h/2)<1e-6);}}
 probe.focus=0;probe.reset();
}
const lamp=LAMP_POSITION;assert.ok(CAMERA.projectDetailed(lamp).depth>0);assert.ok(new THREE.Vector3(...lamp).distanceTo(new THREE.Vector3(...LAPTOP_CENTER))<2.4,'Lamp cannot reach laptop');
for(const hour of [7,10,13,16,17.7]){
 const light=sunForTime(time.sunState(time.previewDate(hour*60,new Date('2026-09-20T00:00:00Z'))));
 if(!light.active)continue;
 for(const source of [[.15,.2,0],[.45,.12,-.04]]){const shadow=shadowWorld(source,light),s=project3D(source),p=project3D(shadow),sun=light.screen;if(!s||!p||!sun)continue;const cross=(s[0]-sun[0])*(p[1]-sun[1])-(s[1]-sun[1])*(p[0]-sun[0]);assert.ok(Math.abs(cross)<1e-5,'Shadow is not aligned with the visible sun');}
}
assert.equal(pointInPolygon(-100,-100,OBJECTS.clock.polygon),false);
console.log('PASS: local assets, independent alpha layers, audio, Osaka date/time, sun/shadow collinearity, real MacBook bounds/fixed hinge, lamp reach, all 10 targets and LinkedIn initial framing and full-bleed cover across desktop/phone/landscape, camera alignment through laptop zoom.');

const {catMotion,PaintedCat}=await import(new URL('public/cat.js',root));
const cat=new PaintedCat(new THREE.Texture());cat.update(0,new THREE.Color());cat.pet(0);
let previous=null,maxReach=0,maxLift=0,sawOpen=false,sawClosed=false;
for(let i=1;i<=660;i++){
 const t=i/60;cat.update(t,new THREE.Color());const pose=cat.pose;assert.equal(cat.parts.tail.pivot.rotation.z,0,'Curled tail root must remain fixed beneath torso');
 for(const value of Object.values(pose))assert.ok(Number.isFinite(value));
 if(previous){assert.ok(Math.abs(pose.headAngle-previous.headAngle)<.035,'Head jumps between frames');assert.ok(Math.abs(pose.nearX-previous.nearX)<.7,'Paw jumps between frames');}
 maxReach=Math.max(maxReach,-pose.nearX);maxLift=Math.max(maxLift,-pose.headAngle);sawOpen||=cat.eyeFrame===0;sawClosed||=cat.eyeFrame===1;previous={...pose};
}
assert.ok(maxReach>8&&maxReach<=8.5&&maxLift>.70&&maxLift<.84,'Head and paw travel must remain visible without exposing their chest joints');assert.ok(sawOpen&&sawClosed);assert.ok(cat.pose.wake<.01,'Cat must settle after interaction');
cat.pet(11);for(let i=661;i<=780;i++)cat.update(i/60,new THREE.Color());const held=cat.pose.headAngle;cat.pet(13);cat.update(13+1/60,new THREE.Color());assert.ok(Math.abs(cat.pose.headAngle-held)<.035,'Repeated pet drops the raised head');cat.dispose();
const reducedCat=new PaintedCat(new THREE.Texture(),true);reducedCat.pet(0);reducedCat.update(2,new THREE.Color());assert.ok(Object.values(reducedCat.pose).every(v=>v===0));assert.equal(reducedCat.eyeFrame,0);reducedCat.update(6,new THREE.Color());assert.equal(reducedCat.eyeFrame,1);reducedCat.dispose();
const {PaintedFoliage}=await import(new URL('public/foliage.js',root));const foregroundTexture=new THREE.Texture();foregroundTexture.image={width:1136,height:1384};const foliage=new PaintedFoliage(new THREE.Texture(),false,foregroundTexture);assert.equal(foliage.parts.length,6);assert.equal(foliage.parts[5].name,'foreground monstera');foliage.update(0,new THREE.Color());const positions=foliage.group.children.map(o=>o.position.clone());foliage.update(3,new THREE.Color());foliage.group.children.forEach((o,i)=>assert.ok(o.position.equals(positions[i]),'Plant roots must remain fixed'));assert.ok(foliage.parts.some(o=>Math.abs(o.material.uniforms.sway.value)>.005),'Leaf sway must be visible');
const nightLamp={lampLight:{},lighting:{day:0},directStrength:0,moonStrength:0,shadowReceivers:[{material:{}}]};RoomScene.prototype.setLamp.call(nightLamp,true);assert.equal(nightLamp.lampLight.castShadow,true);assert.ok(nightLamp.shadowReceivers[0].material.opacity>.3,'Lamp shadow must remain visible at night');RoomScene.prototype.setLamp.call(nightLamp,false);assert.equal(nightLamp.lampLight.castShadow,false);assert.equal(nightLamp.shadowReceivers[0].material.opacity,0);
const {addPaintedLaptopInk}=await import(new URL('public/laptop-ink.js',root));const ink=addPaintedLaptopInk(THREE,actor,{width:1.85});assert.equal(ink.strokes.length,7);assert.ok(ink.strokes.every(s=>s.parent&&s.geometry.index.count>0&&!s.castShadow));assert.equal(ink.strokes.find(s=>s.name==='PaintedInk_base_top').visible,false);ink.setOpening(-110*Math.PI/180);assert.equal(ink.strokes.find(s=>s.name==='PaintedInk_base_top').visible,true);assert.equal(ink.strokes.find(s=>s.name==='PaintedInk_base_lower').visible,false);ink.dispose();
const lunar=time.sunState(time.previewDate(1260)).moon;assert.ok(lunar.phase>=0&&lunar.phase<=1&&Number.isFinite(lunar.altitude));
console.log('PASS: cat wake/reach/settle, continuous rigid-part motion, reduced motion, fixed plant roots, opening-dependent laptop ink, lunar time, and nighttime lamp shadows.');
