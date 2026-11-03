import assert from 'node:assert/strict';
import * as THREE from '../../public/vendor/three.module.js';
import {createStudyDesk} from '../../public/brush-study-desk.js';
import {LAPTOP_SCREEN,LAPTOP_LID_CONTOUR,registerPaintPoint,registeredWorldPoint,createLaptopProjection} from '../../public/brush-study-laptop-view.js';
import {sampleLaptopPortal,containedLaptopScreenView,portalLaptopScreenView,createLaptopLandscapeSurface} from '../../public/brush-study-laptop-landscape.js';

let checks=0;
const check=(value,note)=>{assert.ok(value,note);checks++;};
const names=['sky','mountains','lake','shoreline','foreground'];
const nativeOffset=pose=>Math.abs(pose.x)+Math.abs(pose.y);
const neutral={eye:[0,0,1800],homeEye:[0,0,1800],pointer:[0,0],hover:0,time:0};
const still=sampleLaptopPortal(neutral);
assert.deepEqual(still.map(({name})=>name),names);checks++;
check(still.every(({x,y})=>x===0&&y===0),'The centered room begins with the exact registered painting');

for(const eye of [[0,0,1800],[85,-48,1800],[-85,48,1800],[240,-120,400],[0,0,1],[1e8,-1e8,.01]])for(const pointer of [[0,0],[1,1],[-1,-1],[.4,-.6],[100,-100]])for(const time of [0,.1,1.6,30,1000]){
 const input={...neutral,eye,pointer,time,hover:.8},pose=sampleLaptopPortal(input);
 assert.deepEqual(pose.map(({name})=>name),names);checks++;
 assert.deepEqual(pose,sampleLaptopPortal(input));checks++;
 for(const layer of pose){
  check(Number.isFinite(layer.x)&&Number.isFinite(layer.y),'Every native layer offset stays finite');
  check(nativeOffset(layer)<=28+1e-9,'Native parallax stays within the clean backing reserves');
 }
}
const pointed=sampleLaptopPortal({...neutral,pointer:[.75,.4],hover:1});
check(pointed.some(({x,y})=>Math.abs(x)+Math.abs(y)>0),'Pointer movement changes the living screen painting');
check(nativeOffset(pointed[0])<nativeOffset(pointed[1])&&nativeOffset(pointed[1])<nativeOffset(pointed[4]),'Sky, mountain and foreground motion establish increasing native depth');
const cameraPose=sampleLaptopPortal({...neutral,eye:[85,-48,1200]});
check(cameraPose.some(({x,y})=>Math.abs(x)+Math.abs(y)>0),'The actual room camera changes the screen view independently of pointer position');
check(nativeOffset(cameraPose[0])<nativeOffset(cameraPose[1])&&nativeOffset(cameraPose[1])<nativeOffset(cameraPose[4]),'Camera parallax preserves the same far-to-near depth order');
check(sampleLaptopPortal({...neutral,time:2}).some(({x,y},i)=>x!==still[i].x||y!==still[i].y),'The independent painting remains alive with a stationary room camera');
const reduced=sampleLaptopPortal({...neutral,eye:[85,-48,500],pointer:[1,-1],hover:1,time:150,reduced:true});
check(reduced.every(({x,y})=>x===0&&y===0),'Reduced motion keeps all five native layers exactly still');

// Native screen coordinates must not respond to viewport pixel dimensions:
// rendering size affects projection, while the same camera still samples the
// same geography inside its registered physical aperture.
const viewportInput={...neutral,eye:[55,25,1700],pointer:[.3,-.2],time:2.5};
const previousWidth=globalThis.innerWidth,previousHeight=globalThis.innerHeight;
globalThis.innerWidth=320;globalThis.innerHeight=780;
const smallViewport=sampleLaptopPortal(viewportInput);
globalThis.innerWidth=3200;globalThis.innerHeight=780;
assert.deepEqual(sampleLaptopPortal(viewportInput),smallViewport);checks++;
if(previousWidth===undefined)delete globalThis.innerWidth;else globalThis.innerWidth=previousWidth;
if(previousHeight===undefined)delete globalThis.innerHeight;else globalThis.innerHeight=previousHeight;

function inQuad(point,quad,tolerance=1e-5){
 const area=quad.reduce((sum,a,i)=>{const b=quad[(i+1)%4];return sum+a[0]*b[1]-b[0]*a[1];},0),sign=Math.sign(area);
 return Boolean(sign)&&quad.every((a,i)=>{const b=quad[(i+1)%4];return ((b[0]-a[0])*(point[1]-a[1])-(b[1]-a[1])*(point[0]-a[0]))*sign>=-tolerance;});
}
function inContour([x,y],contour){
 let inside=false;
 for(let i=0,j=contour.length-1;i<contour.length;j=i++){
  const [ax,ay]=contour[i],[bx,by]=contour[j];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
 }
 return inside;
}
const scene=new THREE.Scene(),texture=new THREE.Texture();
let distance=1800;
const desk=createStudyDesk({THREE,scene,uniforms:{},texture,getDistance:()=>distance});
const lid=desk.meshes.find(mesh=>mesh.name==='Laptop painted lid'),base=desk.meshes.find(mesh=>mesh.name==='Laptop painted base');
check(Boolean(lid&&base),'The real painted laptop support meshes exist');
const projection=createLaptopProjection({THREE,lid,base});
const previousDocument=globalThis.document;
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({})})};
const nativeCanvases=names.map(name=>({name,canvas:{width:1586,height:992}}));
const portalCamera=new THREE.PerspectiveCamera(40,1.57,1,10000);
portalCamera.position.set(0,0,distance);portalCamera.lookAt(0,0,0);portalCamera.updateMatrixWorld(true);
const surface=createLaptopLandscapeSurface({THREE,lid,camera:portalCamera,getHomeEye:()=>[0,0,distance],landscape:{paintTo:()=>false,getPortalLayers:()=>nativeCanvases}});
surface.update(0);
const group=lid.children.find(child=>child.name==='Laptop layered watercolor portal');
const nativeMeshes=group?.children.filter(mesh=>mesh.userData.landscapeLayer);
check(nativeMeshes?.length===5,'The physical screen owns five actual native pigment meshes');
assert.deepEqual(nativeMeshes.map(mesh=>mesh.userData.landscapeLayer),names);checks++;
check(new Set(nativeMeshes.map(mesh=>mesh.material.uniforms.painting.value)).size===5,'Each depth plane uses its own isolated native painting texture');
check(nativeMeshes.every(mesh=>mesh.geometry===nativeMeshes[0].geometry),'The native planes share one measured physical aperture');
// Check the actual GPU crop against the full allowed native offset budget.
// Even an extreme view must sample painting inside its image, rather than
// trigger the fragment shader's transparent out-of-bounds edge and uncover
// the original blue laptop artwork underneath.
const extremeOffsets=[[28,0],[-28,0],[0,28],[0,-28],[14,14],[-14,-14],[-14,14],[14,-14]];
for(const preparationTime of [0,60,120,180,240,250]){
 surface.update(preparationTime,{pointer:[1,-1],hover:true});
 const offsetWeight=Math.min(1,preparationTime/240);
 for(const mesh of nativeMeshes){
 const {crop,painting}=mesh.material.uniforms,image=painting.value.image,uv=mesh.geometry.attributes.uv;
 check(Number.isFinite(crop.value.x)&&Number.isFinite(crop.value.y)&&crop.value.x>0&&crop.value.y>0&&crop.value.x<=1&&crop.value.y<=1,'Each native plane has a finite contained GPU crop');
 for(const [offsetX,offsetY] of extremeOffsets)for(let corner=0;corner<uv.count;corner++){
  const sampleX=(uv.getX(corner)-.5)*crop.value.x+.5+offsetX*offsetWeight/image.width;
  const sampleY=(uv.getY(corner)-.5)*crop.value.y+.5-offsetY*offsetWeight/image.height;
  check(Number.isFinite(sampleX)&&Number.isFinite(sampleY)&&sampleX>=0&&sampleX<=1&&sampleY>=0&&sampleY<=1,'All aperture corners retain native image coverage at the maximum allowed camera parallax');
 }
 }
}
let now=300;
for(distance of [1800,3000,6400]){
 desk.resize();scene.updateMatrixWorld(true);
 const world=LAPTOP_SCREEN.map(point=>registeredWorldPoint(THREE,registerPaintPoint(lid,point)));
 for(const [width,height] of [[1280,720],[1416,900],[390,844],[1920,800],[844,390]]){
  const aspect=width/height,view=portalLaptopScreenView(THREE,world,40,aspect,{width,height});
  check(Number.isFinite(view.distance)&&view.distance>1&&view.position.toArray().every(Number.isFinite),'The entering portal has a finite physical camera endpoint beyond its near plane');
  check(view.distance<containedLaptopScreenView(THREE,world,40,aspect).distance,'The real entry camera travels closer than the earlier outside-laptop view');
  const {stage}=view;
  check(stage.width>0&&stage.width<width&&stage.height>0&&stage.height<height,'The painting stage retains white margins on each tested viewport');
  const camera=new THREE.PerspectiveCamera(40,aspect,1,10000);
  camera.position.copy(view.position);camera.up.copy(view.up);camera.lookAt(view.center);camera.updateMatrixWorld(true);
  const display=world.map(point=>{const p=point.clone().project(camera);return [p.x,p.y];});
  const inflatedCorners=[[-stage.halfWidth,-stage.halfHeight],[stage.halfWidth,-stage.halfHeight],[stage.halfWidth,stage.halfHeight],[-stage.halfWidth,stage.halfHeight]];
  check(inflatedCorners.every(point=>inQuad(point,display)),'The actual projected laptop display contains the paper painting plus its entry safety margin');
  portalCamera.copy(camera);surface.update(now+=50);scene.updateMatrixWorld(true);
  const stageCorners=[[-stage.width/width,-stage.height/height],[stage.width/width,-stage.height/height],[stage.width/width,stage.height/height],[-stage.width/width,stage.height/height]];
  for(const mesh of nativeMeshes){
   const aperture=Array.from({length:mesh.geometry.attributes.position.count},(_,i)=>{const p=new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,i).applyMatrix4(mesh.matrixWorld).project(camera);return [p.x,p.y];});
   check(stageCorners.every(point=>inQuad(point,aperture)),'Every real pigment plane fills the final painting stage without exposing the laptop rim');
  }
 }
 for(const aspect of [.46,1,1.57,2.4]){
  const view=containedLaptopScreenView(THREE,world,40,aspect);
  const camera=new THREE.PerspectiveCamera(40,aspect,1,10000);
  camera.position.copy(view.position);camera.up.copy(view.up);camera.lookAt(view.center);camera.updateMatrixWorld(true);
  const quad=projection.sample(camera,900*aspect,900).corners.map(([x,y])=>[x/(900*aspect)*2-1,1-y/900*2]);
  check(quad.every(point=>point.every(Number.isFinite)),'The contained camera gives a finite registered screen');
  check(quad.every(([x,y])=>Math.abs(x)<.9&&Math.abs(y)<.9),'Approaching the physical screen preserves generous paper around the display');
  check(![[-1,-1],[1,-1],[1,1],[-1,1]].some(point=>inQuad(point,quad)),'The contained portal cannot cover the entire viewport');
  for(const [x,y] of [[0,0],[85,-48],[-85,48]]){
   camera.position.set(x,y,distance);camera.up.set(0,1,0);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
   const screen=projection.sample(camera,900*aspect,900).corners;
   const outline=LAPTOP_LID_CONTOUR.map(point=>{const p=registeredWorldPoint(THREE,registerPaintPoint(lid,point)).project(camera);return [(p.x+1)*450*aspect,(1-p.y)*450];});
   check(screen.every(point=>inContour(point,outline)),'Actual registered display corners remain within the painted lid contour at every room angle');
   portalCamera.copy(camera);surface.update(now+=50,{pointer:[.7,-.4],hover:true});scene.updateMatrixWorld(true);
   for(const mesh of nativeMeshes){
    const aperture=Array.from({length:mesh.geometry.attributes.position.count},(_,i)=>{const p=new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,i).applyMatrix4(mesh.matrixWorld).project(camera);return [(p.x+1)*450*aspect,(1-p.y)*450];});
    check(aperture.every(point=>point.every(Number.isFinite)&&inQuad(point,screen)),`${mesh.userData.landscapeLayer} remains inside the real display aperture at every perspective`);
    check(aperture.every(point=>inContour(point,outline)),'Native pigment cannot float across the painted laptop bezel');
   }
   check(surface.getPose().every(layer=>Number.isFinite(layer.x)&&Number.isFinite(layer.y)&&nativeOffset(layer)<=28+1e-9),'The real layered surface respects its native clean reserves while the camera moves');
  }
 }
}
const poseBeforeOcclusion=surface.getPose(),pigmentPresence=nativeMeshes.map(mesh=>mesh.material.uniforms.presence.value);
surface.setOccluded(true);
check(group.visible===false,'Only the duplicated physical screen is occluded while the incoming DOM painting covers it');
portalCamera.position.set(-800,240,600);portalCamera.lookAt(0,0,0);portalCamera.updateMatrixWorld(true);
surface.update(now+=1000,{pointer:[-1,1],hover:true});
const poseWhileOccluded=surface.getPose();
check(poseWhileOccluded.some((point,i)=>point.x!==poseBeforeOcclusion[i].x||point.y!==poseBeforeOcclusion[i].y),'The hidden physical painting continues updating camera and pointer depth for a continuous return');
check(group.visible===false,'Updating living screen layers does not accidentally unhide the duplicated screen');
assert.deepEqual(nativeMeshes.map(mesh=>mesh.material.uniforms.presence.value),pigmentPresence);checks++;
surface.setOccluded(false);
check(group.visible===true,'Returning from the desktop restores the same physical screen');
assert.deepEqual(surface.getPose(),poseWhileOccluded);checks++;
check(group.children.filter(mesh=>mesh.userData.landscapeLayer).every((mesh,i)=>mesh===nativeMeshes[i]),'Occlusion reuses the native painted meshes without rebuilding or resetting their layers');
surface.dispose();check(!group.parent,'Disposing the physical portal releases its laptop-mounted geometry group');
if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;

console.log(`Painted screen portal: ${checks} native-layer, bounded-depth, camera/pointer, reduced-motion, physical-aperture and contained-view checks pass.`);
