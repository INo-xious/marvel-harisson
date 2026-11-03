// Native paint coordinates measured from the cream/metal contour, excluding
// the brown cast shadow. Each segment follows its own existing support mesh.
export const LAPTOP_SCREEN=[[462,445],[675,429],[705,551],[485,574]];
export const LAPTOP_LID_CONTOUR=[[477,590],[474,582],[472,565],[469,548],[465,525],[463,503],[459,480],[456,456],[452,446],[453,442],[456,439],[464,438],[480,437],[503,435],[526,433],[552,432],[577,430],[600,428],[624,426],[649,425],[672,423],[680,424],[684,429],[687,443],[691,463],[695,482],[700,503],[704,525],[708,544],[712,558],[717,564],[717,566]];
export const LAPTOP_BASE_CONTOUR=[[717,566],[733,566],[740,568],[752,571],[760,573],[773,577],[780,579],[790,583],[795,583],[800,585],[807,586],[808,590],[805,594],[788,597],[761,601],[735,605],[707,609],[679,613],[652,617],[622,621],[593,625],[570,628],[560,627],[540,620],[519,611],[501,603],[486,595],[477,590]];

export function registerPaintPoint(mesh,[qx,qy]){
 const uv=mesh.geometry.attributes.uv,index=mesh.geometry.index.array,x=qx/1672,y=1-qy/941;
 for(let i=0;i<index.length;i+=3){
  const a=index[i],b=index[i+1],c=index[i+2],ax=uv.getX(a),ay=uv.getY(a),bx=uv.getX(b),by=uv.getY(b),cx=uv.getX(c),cy=uv.getY(c);
  const d=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(d)<1e-10)continue;
  const wa=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/d,wb=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/d,wc=1-wa-wb;
  if(Math.min(wa,wb,wc)>=-1e-5)return {mesh,a,b,c,wa,wb,wc};
 }
 return null;
}
export function registeredWorldPoint(THREE,point){
 const {mesh,a,b,c,wa,wb,wc}=point,positions=mesh.geometry.attributes.position;
 return new THREE.Vector3().fromBufferAttribute(positions,a).multiplyScalar(wa)
  .addScaledVector(new THREE.Vector3().fromBufferAttribute(positions,b),wb)
  .addScaledVector(new THREE.Vector3().fromBufferAttribute(positions,c),wc).applyMatrix4(mesh.matrixWorld);
}
export function fullLaptopScreenView(THREE,corners,fov,aspect){
 const [tl,tr,br,bl]=corners;
 const right=tr.clone().sub(tl).add(br.clone().sub(bl)).multiplyScalar(.5);
 const up=tl.clone().sub(bl).add(tr.clone().sub(br)).multiplyScalar(.5);
 const normal=new THREE.Vector3().crossVectors(right,up).normalize();if(normal.z<0)normal.negate();
 const center=corners.reduce((sum,point)=>sum.add(point),new THREE.Vector3()).multiplyScalar(.25);
 // Cover, rather than contain: every viewport corner ends inside the display.
 const tangent=Math.tan(THREE.MathUtils.degToRad(fov/2));
 let distance=Math.min(right.length()/(2*tangent*aspect),up.length()/(2*tangent))*.92;
 const screenUp=up.addScaledVector(normal,-up.dot(normal)).normalize();
 const probe=new THREE.PerspectiveCamera(fov,aspect,.1,10000);probe.up.copy(screenUp);
 const inside=(quad,x,y)=>{
  const turns=quad.map((point,i)=>{const next=quad[(i+1)%4];return (next.x-point.x)*(y-point.y)-(next.y-point.y)*(x-point.x);});
  return turns.every(turn=>turn>=-1e-7)||turns.every(turn=>turn<=1e-7);
 };
 // The painted display is a trapezoid, so a rectangle width/height fit alone
 // can leave one corner on the bezel. Solve against its projected edges.
 for(let pass=0;pass<28;pass++){
  probe.position.copy(center).addScaledVector(normal,distance);probe.lookAt(center);probe.updateMatrixWorld();
  const quad=corners.map(point=>point.clone().project(probe));
  if([[-1,-1],[1,-1],[1,1],[-1,1]].every(([x,y])=>inside(quad,x,y))){distance*=.96;break;}
  distance*=.88;
 }
 return {center,normal,up:screenUp,position:center.clone().addScaledVector(normal,distance),distance};
}
export function createLaptopProjection({THREE,lid,base}){
 const screen=LAPTOP_SCREEN.map(point=>registerPaintPoint(lid,point));
 const outline=[...LAPTOP_LID_CONTOUR.map(point=>registerPaintPoint(lid,point)),...LAPTOP_BASE_CONTOUR.slice(1,-1).map(point=>registerPaintPoint(base,point))];
 if([...screen,...outline].some(point=>!point))throw new Error('Laptop contour must belong to its painted support mesh');
 return {sample(camera,width,height){
  const project=point=>{const projected=point.clone().project(camera);return [(projected.x+1)*width/2,(1-projected.y)*height/2];};
  const world=screen.map(point=>registeredWorldPoint(THREE,point));
  return {world,corners:world.map(project),contour:outline.map(point=>project(registeredWorldPoint(THREE,point))),view:fullLaptopScreenView(THREE,world,camera.fov,camera.aspect)};
 }};
}
