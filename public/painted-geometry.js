/** Metric LOCAL camera fitted to the unchanged 1672x941 painted-v2 desk.
 * World axes match Three: X right, Y up, Z toward the desk front. METERS.
 * This calibration patch is the laptop footprint, not invented room corners.
 * Painting is hand drawn: horizon=400 is an estimate, local fit is authoritative.
 */
export const ART={width:1672,height:941};
export const MACBOOK={width:.3126,depth:.2212,height:.0155,lidThickness:.003,screenAspect:3024/1964};
export const CALIBRATION={rearLeft:[444,590],rearRight:[596,576.32],frontLeft:[466.5,644],horizon:400};
const EPS=1e-10,RAD=Math.PI/180;
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,k)=>a.map(x=>x*k);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),len=a=>Math.hypot(...a),unit=a=>mul(a,1/len(a));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const matVec=(m,v)=>[dot(m.slice(0,3),v),dot(m.slice(3,6),v),dot(m.slice(6,9),v)];
function solve(a,b){const n=b.length,m=a.map((r,i)=>[...r,b[i]]);for(let j=0;j<n;j++){let k=j;for(let i=j+1;i<n;i++)if(Math.abs(m[i][j])>Math.abs(m[k][j]))k=i;if(Math.abs(m[k][j])<EPS)throw Error('Singular calibration');[m[j],m[k]]=[m[k],m[j]];const d=m[j][j];for(let p=j;p<=n;p++)m[j][p]/=d;for(let i=0;i<n;i++)if(i!==j){const q=m[i][j];for(let p=j;p<=n;p++)m[i][p]-=q*m[j][p];}}return m.map(r=>r[n]);}
function inverse(m){const rows=[m.slice(0,3),m.slice(3,6),m.slice(6,9)],cols=[0,1,2].map(i=>solve(rows,[0,1,2].map(j=>+(i===j))));return [0,1,2].flatMap(i=>cols.map(c=>c[i]));}
function meet(a,b,c,d){const p=cross(cross([...a,1],[...b,1]),cross([...c,1],[...d,1]));return [p[0]/p[2],p[1]/p[2]];}
function homography(corners){const a=[],b=[];[[0,0],[1,0],[1,1],[0,1]].forEach(([u,v],i)=>{const [x,y]=corners[i];a.push([u,v,1,0,0,0,-x*u,-x*v],[0,0,0,u,v,1,-y*u,-y*v]);b.push(x,y);});return [...solve(a,b),1];}
const toColumnMajor=m=>[0,1,2,3].flatMap(i=>[m[i],m[i+4],m[i+8],m[i+12]]);

/** Standard Three PerspectiveCamera projection, with calibrated principal point.
 * Set camera.position=eye, camera.up=up, camera.lookAt(target), THEN copy this
 * matrix and inverse. Do not subsequently call updateProjectionMatrix(). */
export function perspectiveMatrix({focal,principal,viewport=[ART.width,ART.height],near=.03,far=30}){
  const [w,h]=viewport,[cx,cy]=principal;
  const rowMajor=[2*focal/w,0,1-2*cx/w,0,0,2*focal/h,2*cy/h-1,0,0,0,-(far+near)/(far-near),-2*far*near/(far-near),0,0,-1,0];
  return {rowMajor,columnMajor:toColumnMajor(rowMajor),near,far};
}
function finishCamera({eye,forward,up=[0,1,0],focal,principal,extra={}}){
  forward=unit(forward);const right=unit(cross(forward,up));up=unit(cross(right,forward));
  // Homogeneous ART-pixel projection P*[X,Y,Z,1]. Its denominator is meters
  // of camera-forward depth, making it suitable for depth tests and clipping.
  const rx=add(mul(right,focal),mul(forward,principal[0])),ry=add(mul(up,-focal),mul(forward,principal[1]));
  const P=[...rx,-dot(rx,eye),...ry,-dot(ry,eye),...forward,-dot(forward,eye)];
  const linear=[...rx,...ry,...forward],inverseLinear=inverse(linear);
  const camera={eye,forward,right,up,target:add(eye,forward),focal,principal,P,linear,inverseLinear,...extra};
  camera.projectDetailed=p=>{const v=sub(p,eye),depth=dot(v,forward);return {x:principal[0]+focal*dot(v,right)/depth,y:principal[1]-focal*dot(v,up)/depth,depth,visible:depth>EPS};};
  camera.project=p=>{const q=camera.projectDetailed(p);return q.visible?[q.x,q.y]:null;};
  camera.unprojectAtHeight=(pixel,Y=0)=>{
    const m=[P[0],P[2],P[1]*Y+P[3],P[4],P[6],P[5]*Y+P[7],P[8],P[10],P[9]*Y+P[11]];
    const q=matVec(inverse(m),[...pixel,1]);return Math.abs(q[2])>EPS?[q[0]/q[2],Y,q[1]/q[2]]:null;
  };
  camera.projectDirection=d=>{const q=matVec(linear,d);return {point:Math.abs(q[2])>EPS?[q[0]/q[2],q[1]/q[2]]:null,visible:q[2]>EPS};};
  camera.three={position:eye,target:camera.target,up, ...perspectiveMatrix({focal,principal})};
  return camera;
}
export function createPaintedCamera({calibration=CALIBRATION,width=MACBOOK.width,depth=MACBOOK.depth}={}){
  const {rearLeft:A,rearRight:B,frontLeft:D,horizon}=calibration;
  const vpWidth=meet(A,B,[0,horizon],[ART.width,horizon]),vpDepth=meet(A,D,[0,horizon],[ART.width,horizon]);
  const C=meet(B,vpDepth,D,vpWidth),corners=[A,B,C,D],H=homography(corners),g=H[6],h=H[7];
  const cx=(g*g*depth*depth*vpWidth[0]+h*h*width*width*vpDepth[0])/(g*g*depth*depth+h*h*width*width);
  const focal=Math.sqrt(-(vpWidth[0]-cx)*(vpDepth[0]-cx));
  const lambda=Math.hypot((H[0]-cx*g)/focal,g)/width,vertical=focal*lambda;
  const M=[H[0]/width,0,H[1]/depth,H[3]/width,-vertical,H[4]/depth,g/width,0,h/depth],translation=[H[2],H[5],H[8]],eye=mul(matVec(inverse(M),translation),-1);
  return finishCamera({eye,forward:[M[6],0,M[8]],focal,principal:[cx,horizon],extra:{H,corners,vpWidth,vpDepth,horizon,width,depth,verticalScale:vertical}});
}
export const CAMERA=createPaintedCamera();
export const project3D=point=>CAMERA.project(point);
export const artToWorld=(point,height=0)=>CAMERA.unprojectAtHeight(point,height);
/** Lift an art point above a painted support while retaining support depth.
 * Example: pointAtReferenceDepth([246,418],[144,668]) locates the lamp bulb
 * directly above the actual desk-mounted lamp rather than behind the window.
 */
export function pointAtReferenceDepth(pixel,referencePixel,referenceHeight=0){
 const reference=artToWorld(referencePixel,referenceHeight),depth=CAMERA.projectDetailed(reference).depth;
 const ray=add(add(CAMERA.forward,mul(CAMERA.right,(pixel[0]-CAMERA.principal[0])/CAMERA.focal)),mul(CAMERA.up,(CAMERA.principal[1]-pixel[1])/CAMERA.focal));
 return add(CAMERA.eye,mul(ray,depth));
}
// Anchor the bulb to the lamp's painted desk depth. A fixed guessed height
// can put a near-horizon object metres behind the desk after recalibration.
export const LAMP_POSITION=pointAtReferenceDepth([246,418],[144,668]);


/** The visible solar disc and all cast shadows share this exact direction.
 * SunCalc altitude/azimuth must be DEGREES; azimuth clockwise from north.
 * A fixed southwest-facing window cannot show the sun at every hour. */
export function sunForTime({altitude,azimuth},{camera=CAMERA,viewAzimuth=225}={}){
  const heading=Math.atan2(camera.forward[0],-camera.forward[2]);
  const a=heading+(azimuth-viewAzimuth)*RAD,e=altitude*RAD;
  const direction=[Math.sin(a)*Math.cos(e),Math.sin(e),-Math.cos(a)*Math.cos(e)],q=camera.projectDirection(direction);
  return {kind:'directional',direction,screen:q.point,x:q.point?.[0]??null,y:q.point?.[1]??null,visible:q.visible&&altitude>0,active:altitude>0,strength:Math.max(0,Math.sin(e)),altitude,azimuth};
}
export function lightFromSun(sun,{camera=CAMERA}={}){
  const screen=Array.isArray(sun)?sun:[sun.x,sun.y],direction=unit(matVec(camera.inverseLinear,[...screen,1]));
  return {kind:'directional',direction,screen,active:direction[1]>EPS};
}
export const pointLight=position=>({kind:'point',position:[...position],active:true});
export function shadowWorld(point,light,receiverHeight=0){
  if(!light?.active||point[1]<receiverHeight-EPS)return null;
  if(light.kind==='point'){const d=sub(point,light.position);if(d[1]>=-EPS)return null;return add(light.position,mul(d,(receiverHeight-light.position[1])/d[1]));}
  if(light.direction[1]<=EPS)return null;return sub(point,mul(light.direction,(point[1]-receiverHeight)/light.direction[1]));
}
export function projectShadow(point,light,receiverHeight=0,{camera=CAMERA}={}){const p=shadowWorld(point,light,receiverHeight);return p&&camera.project(p);}
/** Sutherland-Hodgman clipping before perspective division. Use for shadow
 * polygons that extend behind the camera, then SVG/GL clip to the receiver. */
export function projectPolygon(points,{camera=CAMERA,near=.03}={}){
  if(points.some(p=>!p))return [];const output=[];
  for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],da=camera.projectDetailed(a).depth,db=camera.projectDetailed(b).depth;if(da>=near)output.push(a);if((da>=near)!==(db>=near))output.push(add(a,mul(sub(b,a),(near-da)/(db-da))));}
  return output.map(camera.project).filter(Boolean);
}
export function convexHull(points){const a=points.filter(Boolean).map(p=>[...p]).sort((p,q)=>p[0]-q[0]||p[1]-q[1]);if(a.length<3)return a;const out=[],turn=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);for(const p of a){while(out.length>1&&turn(out.at(-2),out.at(-1),p)<=0)out.pop();out.push(p);}const n=out.length;for(let i=a.length-2;i>=0;i--){while(out.length>n&&turn(out.at(-2),out.at(-1),a[i])<=0)out.pop();out.push(a[i]);}out.pop();return out;}

/** Upright proxies for objects already painted into the scene. Their apparent
 * height is converted to meters; no translation/rotation of the painting. */
export function spriteShadow(baseScreen,heightPixels,widthPixels,sun,{camera=CAMERA,receiverHeight=0}={}){
  const light=sun.kind?sun:lightFromSun(sun,{camera});
  const base=[[-widthPixels/2,0],[widthPixels/2,0]].map(([dx,dy])=>camera.unprojectAtHeight([baseScreen[0]+dx,baseScreen[1]+dy],receiverHeight));
  if(base.some(p=>!p))return [];
  const top=base.map(p=>[p[0],p[1]+heightPixels*camera.projectDetailed(p).depth/camera.focal,p[2]]);
  const shadow=top.map(p=>shadowWorld(p,light,receiverHeight));return shadow.some(p=>!p)?[]:projectPolygon([base[0],base[1],shadow[1],shadow[0]],{camera});
}

/** Opening angle is positive degrees; a native Three lid pivot uses
 * rotation.x = -opening*Math.PI/180. Footprint runs X=[0,width],Z=[0,depth]. */
export function laptopWorldCoordinates({opening=110,dimensions=MACBOOK}={}){
  const {width:w,depth:d,height,lidThickness:t,screenAspect}=dimensions,baseHeight=height-t,theta=opening*RAD;
  const hinge=[w/2,baseHeight+t/2,0],along=[0,Math.sin(theta),Math.cos(theta)],outer=[0,Math.cos(theta),-Math.sin(theta)],inner=mul(outer,-1);
  const lidPoint=(x,z,n=0)=>add(add(add(hinge,[x,0,0]),mul(along,z)),mul(outer,n));
  const base=y=>[[0,y,0],[w,y,0],[w,y,d],[0,y,d]],lid=n=>[[-w/2,0],[w/2,0],[w/2,d],[-w/2,d]].map(([x,z])=>lidPoint(x,z,n));
  const baseBottom=base(0),baseTop=base(baseHeight),lidOuter=lid(t/2),lidInner=lid(-t/2),sw=w-.012,sh=sw/screenAspect,off=(d-sh)/2;
  const screen=[[-sw/2,off],[sw/2,off],[sw/2,off+sh],[-sw/2,off+sh]].map(([x,z])=>lidPoint(x,z,-t/2-.0001));
  const sides=(a,b)=>a.map((p,i)=>[p,a[(i+1)%4],b[(i+1)%4],b[i]]),screenCenter=mul(screen.reduce((s,p)=>add(s,p),[0,0,0]),.25);
  return {width:w,depth:d,opening,hinge,along,outerNormal:outer,innerNormal:inner,baseBottom,baseTop,baseSides:sides(baseBottom,baseTop),lidOuter,lidInner,lidSides:sides(lidOuter,lidInner),screen,screenQuad:[screen[3],screen[2],screen[1],screen[0]],screenCenter,lidPoint,vertices:[...baseBottom,...baseTop,...lidOuter,...lidInner]};
}
export function laptopFocusCamera(laptop,{screenWidth=1020,distance=.65}={}){
  const eye=add(laptop.screenCenter,mul(laptop.innerNormal,distance)),focal=screenWidth*distance/len(sub(laptop.screen[1],laptop.screen[0]));
  return finishCamera({eye,forward:mul(laptop.innerNormal,-1),up:laptop.along,focal,principal:[ART.width/2,ART.height/2]});
}
export function interpolateCamera(a,b,t){
  const mix=(p,q)=>p.map((v,i)=>v+(q[i]-v)*t),eye=mix(a.eye,b.eye),target=mix(a.target,b.target);
  return finishCamera({eye,forward:sub(target,eye),up:unit(mix(a.up,b.up)),focal:a.focal+(b.focal-a.focal)*t,principal:mix(a.principal,b.principal)});
}
export function validateGeometry(){
  const c=CAMERA,closed=laptopWorldCoordinates({opening:0}),open=laptopWorldCoordinates(),corners=closed.baseBottom.map(c.project);
  const maxCornerError=Math.max(...corners.map((p,i)=>len(sub(p,c.corners[i]))));
  const maxInverseError=Math.max(...closed.baseBottom.map(p=>len(sub(p,c.unprojectAtHeight(c.project(p),0)))));
  const hingeDrift=len(sub(closed.hinge,open.hinge)),light=sunForTime({altitude:25,azimuth:245});let shadowError=0;
  for(const y of [0,-.04,-.74])for(const p of open.lidOuter){const q=c.projectDetailed(shadowWorld(p,light,y)),s=light.screen,a=c.project(p),b=[q.x,q.y],area=Math.abs((a[0]-s[0])*(b[1]-s[1])-(a[1]-s[1])*(b[0]-s[0]));shadowError=Math.max(shadowError,area/Math.max(1,len(sub(a,s))));}
  const center=sunForTime({altitude:10,azimuth:225}),right=sunForTime({altitude:10,azimuth:245});if(!(right.x>center.x))throw Error('Azimuth screen-right regression');
  const focus=laptopFocusCamera(open),focusError=Math.abs(len(sub(focus.project(open.screen[1]),focus.project(open.screen[0])))-1020);
  const checks={maxCornerError,maxInverseError,hingeDrift,shadowError,focusError};if(Object.values(checks).some(v=>!Number.isFinite(v)||v>1e-6))throw Error(JSON.stringify(checks));
  return {checks,camera:{eye:c.eye,forward:c.forward,principal:c.principal,focal:c.focal,corners:c.corners,P:c.P,three:c.three},footprint:corners,openLid:open.lidOuter.map(c.project),openScreen:open.screenQuad.map(c.project)};
}
if(typeof process!=='undefined'&&process.argv?.[1]&&import.meta.url===new URL(process.argv[1],'file://').href)console.log(JSON.stringify(validateGeometry(),null,2));
