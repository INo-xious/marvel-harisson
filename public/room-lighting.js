/** Registered 2.5D sunlight for the unchanged 1672 x 941 painting.
 * This is a fragment lighting pass, not a transparent mesh or a triangulated
 * shadow patch. Camera rays intersect measured horizontal receiving surfaces;
 * solar rays then intersect the window plane and solid object volumes.
 * Colors multiply the existing pigment, preserving every painted duvet fold.
 * Only approximated depth is invented; no painted contour is moved or redrawn.
 */
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
const unit=a=>mul(a,1/Math.hypot(...a));
const num=v=>Number(v).toFixed(9),v2=p=>`vec2(${p.map(num).join(',')})`,v3=p=>`vec3(${p.map(num).join(',')})`;
const DESK=[[184,608],[742,552],[808,562],[979,565],[1031,601],[1030,607],[211,697],[171,679]];
// This runs along the visible white quilt: pillow, cat, thrown blanket and
// hanging front edge are excluded at the mask level, never via mesh holes.
const QUILT=[[1027,613],[1064,586],[1090,598],[1113,643],[1185,682],[1245,678],[1311,653],[1392,649],[1428,680],[1523,699],[1450,751],[1396,815],[1338,869],[1223,862],[1122,824],[1047,790],[986,749],[973,698]];
const OCCLUDED_PAINT=[
 [[317,546],[378,540],[403,554],[407,592],[381,624],[329,622]], // cup incl. handle
 [[239,470],[302,462],[320,575],[299,611],[258,611],[239,588]], // pencil pot
 [[169,602],[220,604],[263,621],[303,618],[331,639],[312,671],[177,670]], // notebooks
 [[146,554],[238,548],[263,562],[267,627],[210,646],[143,630]], // book stack
 [[716,536],[739,506],[799,499],[816,533],[810,565],[746,573]], // sill plant
 [[808,489],[831,477],[922,477],[945,494],[945,551],[969,557],[973,585],[879,595],[817,575]], // radio + books
 [[919,404],[1016,417],[1039,513],[1020,588],[974,595],[947,552]] // flower pot + trailing leaf base
];
function polygonGLSL(name,points){
 let s=`float ${name}(vec2 p){float d=10000.;float winding=0.;vec2 a;vec2 b;vec2 e;float t;\n`;
 for(let i=0;i<points.length;i++){
  s+=`a=${v2(points[i])};b=${v2(points[(i+1)%points.length])};e=b-a;t=clamp(dot(p-a,e)/dot(e,e),0.,1.);d=min(d,length(p-a-e*t));if((a.y>p.y)!=(b.y>p.y)){if(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)winding=1.-winding;}\n`;
 }
 return s+'return d*(winding*2.-1.);}\n';
}
/** camera is the exported CAMERA in painted-geometry.js. Rebuilding with a
 * replacement calibration refits window and objects to the SAME art pixels.
 * Pass the identical sun.direction used by Three's directional shadow light.
 */
export function createRoomLighting(camera){
 if(!camera?.unprojectAtHeight)throw Error('createRoomLighting requires the painted camera');
 const point=(p,y=0)=>camera.unprojectAtHeight(p,y);
 // The visible lower rail is only slightly above the tabletop. Its art
 // anchors stay fixed; a 4.5 cm sill avoids inventing a high opaque wall that
 // would block every true low-angle ray from this shallow painted desk.
 const sillHeight=.045,left=point([275,507],sillHeight),right=point([1250,467],sillHeight);
 let normal=unit([right[2]-left[2],0,left[0]-right[0]]);
 if(dot(normal,sub(camera.eye,left))<0)normal=mul(normal,-1);
 const pixelScale=p=>camera.projectDetailed(point(p)).depth/camera.focal;
 const cylinders=[
  {name:'mug',pixel:[354,617],radiusPx:27,heightPx:71,y:0},
  {name:'pencil pot',pixel:[276,596],radiusPx:23,heightPx:86,y:0},
  {name:'small window plant pot',pixel:[782,559],radiusPx:24,heightPx:40,y:0},
  {name:'flower pot',pixel:[966,539],radiusPx:38,heightPx:86,y:.035},
  {name:'right plant pot',pixel:[1274,517],radiusPx:31,heightPx:57,y:.035}
 ].map(o=>({...o,base:point(o.pixel,o.y),radius:o.radiusPx*pixelScale(o.pixel),height:o.heightPx*pixelScale(o.pixel)}));
 const ellipsoids=[
  // True opaque ellipsoids: dense painted leaf clusters, not triangular flags.
  {pixel:[749,511],base:[782,559],up:.055,r:[.027,.050,.026]},
  {pixel:[795,497],base:[782,559],up:.062,r:[.029,.045,.026]},
  {pixel:[949,425],base:[966,539],up:.180,r:[.065,.048,.038]},
  {pixel:[1001,431],base:[966,539],up:.172,r:[.052,.055,.040]},
  {pixel:[927,472],base:[966,539],up:.101,r:[.053,.041,.038]},
  {pixel:[1277,342],base:[1274,517],up:.240,r:[.068,.085,.046]},
  {pixel:[1329,425],base:[1274,517],up:.140,r:[.070,.058,.042]}
 ].map(o=>{
  // Keep each crown at its pot's forward depth. This is essential for leaves
  // above the horizon: unprojecting them onto a too-low Y plane would put
  // a physically impossible caster behind the camera.
  const depth=camera.projectDetailed(point(o.base)).depth;
  const ray=add(add(camera.forward,mul(camera.right,(o.pixel[0]-camera.principal[0])/camera.focal)),mul(camera.up,(camera.principal[1]-o.pixel[1])/camera.focal));
  const center=add(camera.eye,mul(ray,depth));return {...o,center};
 });
 // Books are horizontal rectangular solids with metric dimensions inferred
 // from the photographed/painted support footprints, aligned to this desk.
 const books=[
  {p:[246,658],size:[.16,.039,.096]},
  {p:[204,624],size:[.15,.095,.108]},
  {p:[885,582],size:[.205,.035,.088]}
 ].map(o=>({...o,center:add(point(o.p),[0,o.size[1]*.5,0]),half:mul(o.size,.5)}));
 const segments=[[[269,529],[267,461],.0022],[[286,528],[291,458],.0023],[[296,528],[309,471],.0025]];
 const pencils=segments.map(([bottom,top,r])=>{const base=point(bottom,.075),end=point(top,.075+(bottom[1]-top[1])*pixelScale(bottom));return{base,end,r};});
 const masks=polygonGLSL('rlDeskDistance',DESK)+polygonGLSL('rlQuiltDistance',QUILT)+OCCLUDED_PAINT.map((p,i)=>polygonGLSL('rlPaintObject'+i,p)).join('');
 const glsl=`
uniform vec3 roomLightDirection;
uniform float roomLightStrength;
uniform float roomLightWarmth;
uniform float roomLightDebug;
uniform sampler2D roomShadowPigment;
${masks}
const vec3 rlEye=${v3(camera.eye)};
const vec3 rlForward=${v3(camera.forward)};
const vec3 rlRight=${v3(camera.right)};
const vec3 rlUp=${v3(camera.up)};
const vec2 rlPrincipal=${v2(camera.principal)};
const float rlFocal=${num(camera.focal)};
const vec3 rlWindowOrigin=${v3(left)};
const vec3 rlWindowNormal=${v3(normal)};
vec3 rlWorld(vec2 p,float height){vec3 d=rlForward+rlRight*(p.x-rlPrincipal.x)/rlFocal+rlUp*(rlPrincipal.y-p.y)/rlFocal;return rlEye+d*((height-rlEye.y)/d.y);}
vec2 rlPixel(vec3 p){vec3 d=p-rlEye;float z=max(.001,dot(d,rlForward));return rlPrincipal+vec2(dot(d,rlRight),-dot(d,rlUp))*rlFocal/z;}
float rlEdge(vec2 a,vec2 b,vec2 p){vec2 e=b-a;return(e.x*(p.y-a.y)-e.y*(p.x-a.x))/length(e);}
float rlAperture(vec2 p,vec4 edges,float topLeft,float topRight,float bottomLeft,float bottomRight,float feather){
 float s=(p.x-edges.x)/(edges.z-edges.x);
 float top=mix(topLeft,topRight,s),bottom=mix(bottomLeft,bottomRight,s);
 float d=min(min(p.x-edges.x,edges.z-p.x),min(p.y-top,bottom-p.y));
 return smoothstep(-feather,feather,d);
}
// The projected window intersection, not the receiver's art coordinate,
// determines whether its incoming solar ray clears the actual painted frame.
float rlWindow(vec3 p,vec3 l,out float travel){
 float den=dot(l,rlWindowNormal);travel=0.;if(den>-.008)return 0.;
 travel=dot(rlWindowOrigin-p,rlWindowNormal)/den;if(travel<=0.)return 0.;
 vec2 w=rlPixel(p+l*travel);float f=18.+travel*24.;
 float a=rlAperture(w,vec4(263.,0.,563.,0.),-180.,-155.,493.,483.,f);
 a=max(a,rlAperture(w,vec4(608.,0.,938.,0.),-75.,-8.,483.,471.,f));
 a=max(a,rlAperture(w,vec4(975.,0.,1243.,0.),29.,66.,468.,458.,f));
 return a;
}
// Exact ray / finite cylinder test, softened only around the silhouette.
float rlCylinder(vec3 p,vec3 l,vec3 base,float radius,float height){
 if(l.y<.015)return 0.;float lo=max(.001,(base.y-p.y)/l.y),hi=(base.y+height-p.y)/l.y;
 if(hi<lo)return 0.;vec2 offset=p.xz-base.xz;
 float t=clamp(-dot(offset,l.xz)/max(.00001,dot(l.xz,l.xz)),lo,hi);
 float d=length(offset+l.xz*t);float soft=.0045+t*.032;
 return 1.-smoothstep(radius-soft,radius+soft,d);
}
float rlEllipsoid(vec3 p,vec3 l,vec3 center,vec3 radius){
 vec3 o=(p-center)/radius,d=l/radius;float t=max(.001,-dot(o,d)/dot(d,d));
 float distance=length(o+d*t);return 1.-smoothstep(.84,1.16+t*.18,distance);
}
float rlBox(vec3 p,vec3 l,vec3 center,vec3 halfSize){
 vec3 inv=sign(l)/max(abs(l),vec3(.00001));vec3 a=(center-halfSize-p)*inv,b=(center+halfSize-p)*inv;
 vec3 near=min(a,b),far=max(a,b);float enter=max(max(near.x,near.y),max(near.z,.002));
 float leave=min(min(far.x,far.y),far.z);return smoothstep(-.019,.019,leave-enter);
}
float rlCapsule(vec3 p,vec3 l,vec3 a,vec3 b,float r){
 vec3 ab=b-a,ap=p-a;float aa=dot(ab,ab),ld=dot(l,ab),ad=dot(ap,ab),lp=dot(l,ap);
 float t=max(.001,(ld*ad-aa*lp)/max(.000001,aa-ld*ld));float s=clamp((ad+t*ld)/aa,0.,1.);
 t=max(.001,dot(a+ab*s-p,l));float dist=length(p+l*t-a-ab*s);
 return 1.-smoothstep(r-.001,r+.003+t*.018,dist);
}
float rlObjects(vec3 p,vec3 l){float o=0.;
${cylinders.map(o=>`o=max(o,rlCylinder(p,l,${v3(o.base)},${num(o.radius)},${num(o.height)}));`).join('\n')}
${ellipsoids.map(o=>`o=max(o,rlEllipsoid(p,l,${v3(o.center)},${v3(o.r)}));`).join('\n')}
${books.map(o=>`o=max(o,rlBox(p,l,${v3(o.center)},${v3(o.half)}));`).join('\n')}
${pencils.map(o=>`o=max(o,rlCapsule(p,l,${v3(o.base)},${v3(o.end)},${num(o.r)}));`).join('\n')}
return clamp(o,0.,1.);}
vec3 applyRoomLighting(vec3 color,vec2 pixel){
 if(roomLightStrength<.001||pixel.y<532.)return color;
 float desk=smoothstep(0.,8.,rlDeskDistance(pixel));
 float quilt=smoothstep(0.,64.,rlQuiltDistance(pixel));
 float paintObject=0.;
 ${OCCLUDED_PAINT.map((_,i)=>`paintObject=max(paintObject,smoothstep(-2.,6.,rlPaintObject${i}(pixel)));`).join('\n')}
 desk*=1.-paintObject;
 float mask=max(desk,quilt*.75);if(mask<.001)return color;
 // Quilt height is lower than the desktop. Smooth changes approximate its
 // padded surface while keeping every shadow continuous over painted folds.
 float bedHeight=-.12+.023*sin((pixel.x-1030.)*.008)*sin((pixel.y-600.)*.012);
 vec3 p=rlWorld(pixel,mix(bedHeight,0.,desk/max(.001,desk+quilt)));
 vec3 l=normalize(roomLightDirection);float travel=0.;float window=rlWindow(p,l,travel);
 float objects=rlObjects(p,l);float clear=window*(1.-objects);
 // Direct light and blocked-light pigment share the same illumination model.
 // Frame and object shadows become visible because unblocked sun is brighter.
 float strength=roomLightStrength*mask;
 // Only rays that clear the real window and object solids get amber sun.
 // The complementary shade keeps the original brush texture and fold detail.
 vec3 neutralGain=vec3(1.)+vec3(1.,.99,.96)*mix(.10,.19,desk);
 vec3 amberGain=mix(vec3(1.16,1.10,1.02),vec3(1.20,1.12,1.02),desk);
 vec3 litGain=mix(neutralGain,amberGain,roomLightWarmth);
 vec3 shadowTint=mix(vec3(.93,.94,.98),vec3(.90,.92,.97),roomLightWarmth);
 vec3 gain=mix(shadowTint,litGain,clear);
 // Translucent shadow pigment uses the same native paper as the scene.
 float deposit=texture2D(roomShadowPigment,pixel/173.).g;
 gain*=1.+(deposit-.70)*(.06+.36*(1.-clear));
 if(roomLightDebug>.5)return mix(vec3(.10),mix(vec3(.27,.40,.68),vec3(1.,.75,.28),clear),mask);
 return color*mix(vec3(1.),gain,strength);
}
`;
 const uniforms={roomLightDirection:{value:[0,.6,-.8]},roomLightStrength:{value:0},roomLightWarmth:{value:0},roomLightDebug:{value:0}};
 function update(sun,strength,warmth=0){uniforms.roomLightDirection.value=[...sun.direction];uniforms.roomLightStrength.value=sun.active===false?0:Math.max(0,strength);uniforms.roomLightWarmth.value=warmth;}
 return {glsl,uniforms,update,calibration:{window:{origin:left,normal,sillHeight},cylinders,ellipsoids,books,pencils,desk:DESK,quilt:QUILT}};
}
