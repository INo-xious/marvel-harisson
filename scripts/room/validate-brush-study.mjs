import assert from 'node:assert/strict';
import * as THREE from '../../public/vendor/three.module.js';
import {DESK_HEIGHT,DESK,onSupport,planeScale,floorNormal,solarDirection,directionPixel,windowFaceDepth,windowPaneDepth,windowPaintDepth,atScale} from '../../public/brush-study-geometry.js';
import {createStudyDesk} from '../../public/brush-study-desk.js';
import {createStudyExterior} from '../../public/brush-study-exterior.js';
import {updateStudyLight} from '../../public/brush-study-light.js';
const texture=new THREE.Texture();
let checks=0;
function near(a,b,epsilon=1e-3){assert.ok(Math.abs(a-b)<epsilon,`${a} ≠ ${b}`);checks++;}
for(const distance of [1677,1881,3500]){
 const scene=new THREE.Scene(),uniforms={strength:{value:.72},sunPixel:{value:new THREE.Vector2()},moonPixel:{value:new THREE.Vector2()},sunVisible:{value:0},moonVisible:{value:0},moonPhase:{value:0}},up=new THREE.Vector3(...floorNormal(distance));
 const desk=createStudyDesk({THREE,scene,uniforms,texture,getDistance:()=>distance});
 const top=desk.meshes.find(x=>x.name==='Desk horizontal top').geometry.attributes.position;
 const planeHeight=new THREE.Vector3(...onSupport(97,577,DESK_HEIGHT,distance)).dot(up);
 for(let i=0;i<top.count;i++)near(new THREE.Vector3().fromBufferAttribute(top,i).dot(up),planeHeight);
 const laptopBase=desk.meshes.find(x=>x.name==='Laptop painted base');
 const laptopLid=desk.meshes.find(x=>x.name==='Laptop painted lid');
 assert.ok(laptopBase&&laptopLid);checks++;
 const basePositions=laptopBase.geometry.attributes.position;
 for(let i=0;i<basePositions.count;i++)near(new THREE.Vector3().fromBufferAttribute(basePositions,i).dot(up),planeHeight);
 const notebook=desk.meshes.find(x=>x.name==='Open notebook supported paper').geometry.attributes.position;
 for(let i=0;i<notebook.count;i++)near(new THREE.Vector3().fromBufferAttribute(notebook,i).dot(up),planeHeight);
 // Inspect the painted contact within each upright mesh, rather than only
 // comparing a configured root with its shadow proxy. The source lamp and
 // pot have different feet even though they share the same source plate.
 for(const [name,qx,qy] of [['Desk plant',432,563],['Terracotta pot',432,563],['Task lamp',214,560],['Stationery',311,583]]){
  const mesh=desk.meshes.find(x=>x.name===name),p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv;
  const x0=uv.getX(0)*1672,x1=uv.getX(1)*1672,y0=(1-uv.getY(0))*941,y1=(1-uv.getY(2))*941;
  const u=(qx-x0)/(x1-x0),v=(qy-y0)/(y1-y0);
  const back=new THREE.Vector3().fromBufferAttribute(p,0).lerp(new THREE.Vector3().fromBufferAttribute(p,1),u);
  const front=new THREE.Vector3().fromBufferAttribute(p,2).lerp(new THREE.Vector3().fromBufferAttribute(p,3),u);
  near(back.lerp(front,v).dot(up),planeHeight,.003);
  const [x,y]=desk.propAnchors.find(prop=>prop.name===name).root,t=(y-DESK.rearLeft[1])/(DESK.frontLeft[1]-DESK.rearLeft[1]);
  const left=DESK.rearLeft[0]+(DESK.frontLeft[0]-DESK.rearLeft[0])*t,right=DESK.rearRight[0]+(DESK.frontRight[0]-DESK.rearRight[0])*t;
  assert.ok(t>.12&&t<.88&&x>left+15&&x<right-15,`${name} contact must be inside the tabletop`);checks++;
 }
 // The newly recovered pot foot and stem plate share an upright depth,
 // while every pixel of the rounded source contour remains above its foot.
 const pot=desk.meshes.find(x=>x.name==='Terracotta pot'),plant=desk.meshes.find(x=>x.name==='Desk plant');
 near(pot.geometry.attributes.position.getZ(0),plant.geometry.attributes.position.getZ(0),.001);
 const potUV=pot.geometry.attributes.uv;assert.ok((1-potUV.getY(2))*941>566, 'Pot mesh must retain the complete rounded native-coordinate foot');checks++;
 // Every lid column meets the same support plane along the painted hinge,
 // including its left and right corners, as the view scale changes.
 const lidPositions=laptopLid.geometry.attributes.position,lidUV=laptopLid.geometry.attributes.uv;
 const columns=lidPositions.count/3;
 for(let i=0;i<columns;i++){
  const bottom=i+columns*2,qx=lidUV.getX(i)*1672,y0=(1-lidUV.getY(i))*941,y1=(1-lidUV.getY(bottom))*941;
  const hingeY=590.-(qx-477.)*.1;
  const hinge=new THREE.Vector3().fromBufferAttribute(lidPositions,i).lerp(new THREE.Vector3().fromBufferAttribute(lidPositions,bottom),(hingeY-y0)/(y1-y0));
  near(hinge.dot(up),planeHeight,.002);
 }
 for(const [x,y] of [...DESK.frontFeet,...DESK.rearFeet]){
  const p=new THREE.Vector3(...onSupport(x,y,0,distance));
  near(p.dot(up),new THREE.Vector3(...onSupport(836,820,0,distance)).dot(up));
 }
 const horizon=directionPixel(solarDirection(0,225,distance),distance);near(horizon[1],330,1e-7);
 for(const altitude of [-10,0,8,35,70])near(up.dot(new THREE.Vector3(...solarDirection(altitude,235,distance))),Math.sin(altitude*Math.PI/180),1e-7);
 const faceDepth=windowFaceDepth(distance),wallDepth=windowPaneDepth(distance);
 near(windowPaintDepth(8,{x:378,y:200},distance),faceDepth);
 near(windowPaintDepth(8,{x:633,y:200},distance),wallDepth);
 near(windowPaintDepth(9,{x:836,y:427},distance),wallDepth);
 near(windowPaintDepth(9,{x:836,y:449},distance),windowPaintDepth(10,{x:836,y:449},distance));
 near(windowPaintDepth(9,{x:836,y:469},distance),faceDepth+70);
 assert.ok(windowPaintDepth(10,{x:770,y:420},distance)>faceDepth);checks++;
 for(const id of [8,9,10])for(const [x,y] of [[380,180],[633,320],[1160,410],[1380,450]]){
  const z=windowPaintDepth(id,{x,y},distance),point=atScale(x,y,(distance-z)/distance,distance);
  near(836+point[0]*distance/(distance-point[2]),x,1e-7);
  near(470.5-point[1]*distance/(distance-point[2]),y,1e-7);
 }
 uniforms.windowFaceDepth={value:faceDepth};uniforms.windowFaceRegistration={value:(distance-faceDepth)/distance};
 updateStudyLight({THREE,uniforms,distance,wallDepth,sunAltitude:35,sunAzimuth:235});
 for(const [name,index] of [['Task lamp',0],['Desk plant',1],['Laptop',2],['Mug',3],['Left books',4],['Right books',5],['Stationery',6]]){
  const anchor=desk.propAnchors.find(p=>p.name===name).root;
  const expected=onSupport(...anchor,DESK_HEIGHT,distance),actual=uniforms.proxyBase.value[index].toArray();
  for(let i=0;i<3;i++)near(actual[i],expected[i],.08);
 }
 const shared=uniforms.solarDirection;updateStudyLight({THREE,uniforms,distance,wallDepth,sunAltitude:-10,sunAzimuth:290});assert.equal(shared,uniforms.solarDirection);assert.equal(uniforms.solarActive.value,0);checks+=2;
 const outside=createStudyExterior({THREE,scene,uniforms,texture,cloud:texture,wallTexture:texture,getDistance:()=>distance,getWallDepth:()=>wallDepth});outside.setCelestial({altitude:0,azimuth:225},{altitude:12,azimuth:225,phase:.25});near(uniforms.sunPixel.value.y,330,1e-7);
 assert.equal(scene.children.filter(x=>x.userData.exteriorKind).length,7);checks++;
 const river=scene.children.find(x=>x.userData.exteriorKind==='river'),city=scene.children.find(x=>x.userData.exteriorKind==='city');
 const firstZ=river.geometry.attributes.position.getZ(0);near(firstZ,wallDepth-180,.001);
 for(const mesh of [...desk.meshes,...scene.children.filter(x=>x.userData.exteriorKind)])assert.ok([...mesh.geometry.attributes.position.array].every(Number.isFinite));checks++;
}
console.log(`Brush study: ${checks} geometry, solar alignment, contact and layer checks passed.`);
