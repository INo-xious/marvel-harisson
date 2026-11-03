import assert from 'node:assert/strict';
import * as THREE from '../../public/vendor/three.module.js';
import {createStudyDesk} from '../../public/brush-study-desk.js';
import {LAPTOP_SCREEN,LAPTOP_LID_CONTOUR,LAPTOP_BASE_CONTOUR,registerPaintPoint,registeredWorldPoint,createLaptopProjection} from '../../public/brush-study-laptop-view.js';

let checks=0;
const failures=[];
function check(value,note){checks++;if(!value)failures.push(note);}
function near(a,b,note,epsilon=1e-4){check(Number.isFinite(a)&&Math.abs(a-b)<=epsilon,`${note}: ${a} vs ${b}`);}
function finiteVector(vector){return [vector.x,vector.y,vector.z].every(Number.isFinite);}
function inQuad(point,quad){
 const area=quad.reduce((sum,a,i)=>{const b=quad[(i+1)%4];return sum+a[0]*b[1]-b[0]*a[1];},0);
 const direction=Math.sign(area);
 return Boolean(direction)&&quad.every((a,i)=>{
  const b=quad[(i+1)%4],cross=(b[0]-a[0])*(point[1]-a[1])-(b[1]-a[1])*(point[0]-a[0]);
  return cross*direction>=-1e-7;
 });
}
const viewportCorners=[[-1,-1],[1,-1],[1,1],[-1,1]];
const scene=new THREE.Scene(),texture=new THREE.Texture();
let distance=1800;
const desk=createStudyDesk({THREE,scene,uniforms:{},texture,getDistance:()=>distance});
const lid=desk.meshes.find(mesh=>mesh.name==='Laptop painted lid'),base=desk.meshes.find(mesh=>mesh.name==='Laptop painted base');
assert.ok(lid&&base,'Both painted support meshes must exist');
const projection=createLaptopProjection({THREE,lid,base});
const diagnostics=[];

for(distance of [1800,3000,6400]){
 desk.resize();scene.updateMatrixWorld(true);
 for(const [mesh,points] of [[lid,[...LAPTOP_SCREEN,...LAPTOP_LID_CONTOUR]],[base,LAPTOP_BASE_CONTOUR]])for(const [qx,qy] of points){
  const registered=registerPaintPoint(mesh,[qx,qy]);
  check(Boolean(registered),`${mesh.name} must register measured point ${qx},${qy} at distance${distance}`);
  if(!registered)continue;
  const {a,b,c,wa,wb,wc}=registered,uv=mesh.geometry.attributes.uv;
  near(wa+wb+wc,1,'Triangle weights sum',1e-9);
  check(Math.min(wa,wb,wc)>=-1.00001e-5,'Measured contour remains within an actual UV triangle');
  near((uv.getX(a)*wa+uv.getX(b)*wb+uv.getX(c)*wc)*1672,qx,'Measured x recovered from mesh UV',.002);
  near((1-uv.getY(a)*wa-uv.getY(b)*wb-uv.getY(c)*wc)*941,qy,'Measured y recovered from mesh UV',.002);
  check(finiteVector(registeredWorldPoint(THREE,registered)),'Registered world contour must be finite');
 }
 // These are shared native grid points on the painted crease. Comparing
 // their actual interpolated mesh positions catches a disconnected hinge.
 for(const point of [[477,590],[597,578],[717,566]]){
  const a=registeredWorldPoint(THREE,registerPaintPoint(lid,point)),b=registeredWorldPoint(THREE,registerPaintPoint(base,point));
  near(a.distanceTo(b),0,`World hinge ${point} agrees at distance${distance}`,.0002);
 }
 for(const aspect of [.46,1.57,2.4]){
  const camera=new THREE.PerspectiveCamera(40,aspect,1,10000),width=900*aspect,height=900;
  for(const [x,y] of [[0,0],[85,-48],[-85,48]]){
   camera.position.set(x,y,distance);camera.up.set(0,1,0);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
   const sample=projection.sample(camera,width,height);
   check(sample.world.length===4&&sample.corners.length===4,'Four registered display corners must be returned');
   check(sample.contour.length===LAPTOP_LID_CONTOUR.length+LAPTOP_BASE_CONTOUR.length-2,'Outline follows both complete measured contours');
   check([...sample.corners,...sample.contour].every(point=>point.every(Number.isFinite)),`Finite projected contour at room tilt${x},${y}`);
  }
  const {world,view}=projection.sample(camera,width,height);
  for(const [name,vector] of Object.entries({center:view.center,normal:view.normal,up:view.up,position:view.position}))check(finiteVector(vector),`Finite full-screen ${name}`);
  near(view.normal.length(),1,'Unit screen normal',1e-7);near(view.up.length(),1,'Unit camera up',1e-7);near(view.up.dot(view.normal),0,'Camera up lies in display plane',1e-7);
  check(Number.isFinite(view.distance)&&view.distance>camera.near,'View distance must be finite and beyond the near plane');
  function projectedAt(depth){
   camera.position.copy(view.center).addScaledVector(view.normal,depth);camera.up.copy(view.up);camera.lookAt(view.center);camera.updateMatrixWorld(true);
   return world.map(point=>{const p=point.clone().project(camera);return [p.x,p.y];});
  }
  const quad=projectedAt(view.distance);
  near(camera.getWorldDirection(new THREE.Vector3()).dot(view.normal),-1,'Endpoint camera faces the screen normal',1e-7);
  check(quad.every(point=>point.every(Number.isFinite)),'Endpoint projected screen remains finite');
  viewportCorners.forEach(point=>check(inQuad(point,quad),`Viewport corner${point} lies inside laptop screen: distance${distance}, aspect${aspect}`));
  const right=world[1].clone().sub(world[0]).add(world[2].clone().sub(world[3])).multiplyScalar(.5);
  const up=world[0].clone().sub(world[3]).add(world[1].clone().sub(world[2])).multiplyScalar(.5);
  const tangent=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  const roughCoverDistance=Math.min(right.length()/(2*tangent*aspect),up.length()/(2*tangent));
  let lo=roughCoverDistance*.02,hi=roughCoverDistance*2;
  check(viewportCorners.every(point=>inQuad(point,projectedAt(lo))),'Display has a finite contained endpoint');
  for(let i=0;i<45;i++){
   const middle=(lo+hi)/2;
   if(viewportCorners.every(point=>inQuad(point,projectedAt(middle))))lo=middle;else hi=middle;
  }
  const planeOffsets=world.map(point=>point.clone().sub(view.center).dot(view.normal));
  check(Math.max(...planeOffsets.map(Math.abs))<.001,'Registered screen corners remain coplanar');
  diagnostics.push({distance,aspect,maximumCoverFactor:Number((lo/roughCoverDistance).toFixed(6)),currentCoverFactor:Number((view.distance/roughCoverDistance).toFixed(6)),normalOffsets:planeOffsets.map(value=>Number(value.toExponential(3)))});
 }
}
if(failures.length)for(const row of diagnostics)console.log(JSON.stringify(row));
console.log(`Laptop view: ${checks} registration, hinge, projection and viewport-containment checks; ${failures.length} failures.`);
assert.equal(failures.length,0,failures.join('\n'));
