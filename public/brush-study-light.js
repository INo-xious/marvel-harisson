import {floorNormal, solarDirection, onSupport, DESK, DESK_HEIGHT} from './brush-study-geometry.js?v=objects-20261103a';

// Light and shadows share the room's reconstructed support plane. All radii
// below are in that world space; the aperture remains registered to the paint.
export const studyLightGLSL = /* glsl */ `
uniform vec3 solarDirection, floorNormal, lampPosition, lampDirection;
uniform float solarActive;
uniform vec3 proxyBase[8];
uniform vec4 proxyShape[8];
uniform vec4 deskShadowBounds;
uniform float deskShadowHeight;
uniform vec3 deskShadowFeet[4];

float studyAperture(vec2 p, vec2 a, vec2 b, float feather) {
  float edge = min(min(p.x-a.x, b.x-p.x), min(p.y-a.y, b.y-p.y));
  return smoothstep(-feather, feather, edge);
}

float windowSun(vec3 p) {
  if (solarActive <= 0.0001 || solarDirection.z >= -0.01) return 0.;
  float travel = (wallDepth-p.z)/solarDirection.z;
  if (travel < -0.5) return 0.;
  vec3 hit = p+solarDirection*max(0., travel);
  float registration = max(wallRegistration, 0.001);
  vec2 art = vec2(hit.x/registration+836., 470.5-hit.y/registration);
  // The three clear panes retain both painted mullions and their cast shadows.
  float feather = 10.+min(max(0., travel)*0.003/registration, 5.);
  float opening = studyAperture(art, vec2(437.,8.), vec2(615.,427.), feather);
  opening = max(opening, studyAperture(art, vec2(649.,8.), vec2(1140.,427.), feather));
  opening = max(opening, studyAperture(art, vec2(1168.,8.), vec2(1332.,427.), feather));
  return opening;
}

vec3 studyCasterLocal(vec3 delta, vec3 up) {
  return vec3(delta.x,dot(delta,up),dot(delta,vec3(0.,-up.z,up.y)));
}

float studyCylinderShadow(vec3 local, vec3 ray, vec4 shape) {
  if (shape.x <= 0. || shape.y <= 0. || shape.z <= 0. || shape.w <= 0.) return 1.;
  // A caster whose highest pigment is below this receiver cannot shade it.
  if (local.y >= shape.x) return 1.;
  float nearHeight = max(0.5, -local.y/ray.y);
  float farHeight = (shape.x-local.y)/ray.y;
  if (farHeight <= nearHeight) return 1.;
  vec2 scaledOrigin = local.xz/shape.yz;
  vec2 scaledRay = ray.xz/shape.yz;
  float rayLength = dot(scaledRay,scaledRay);
  float nearest = nearHeight;
  if (rayLength > 0.0000001) {
    nearest = clamp(-dot(scaledOrigin,scaledRay)/rayLength, nearHeight, farHeight);
  }
  // Nearest crossing through the finite upright ellipse, with a pigment-soft
  // edge. The small distance growth gives remote shadows a wider penumbra.
  vec2 crossing = scaledOrigin+scaledRay*nearest;
  float radius = min(shape.y,shape.z);
  float edge = (length(crossing)-1.)*radius;
  float feather = 5.5*max(0.6,wallRegistration)+min(nearest*0.012,11.);
  float shadow = 1.-smoothstep(-feather,feather,edge);
  return 1.-shadow*clamp(shape.w,0.,0.92);
}

float objectSunShadow(vec3 p) {
  if (solarActive <= 0.0001) return 1.;
  vec3 up = normalize(floorNormal);
  vec3 depth = vec3(0.,-up.z,up.y);
  vec3 ray = vec3(solarDirection.x, dot(solarDirection,up), dot(solarDirection,depth));
  if (ray.y <= 0.001) return 1.;
  float visibility = 1.;
  float belowTop = deskShadowHeight-dot(p,up);
  if (belowTop > 2.) {
    float travel = belowTop/ray.y;
    vec3 topHit = p+solarDirection*travel;
    float edge = min(min(topHit.x-deskShadowBounds.x,deskShadowBounds.y-topHit.x),
                     min(topHit.z-deskShadowBounds.z,deskShadowBounds.w-topHit.z));
    float feather = 8.*max(0.6,wallRegistration)+min(travel*0.010,16.);
    float tabletop = smoothstep(-feather,feather,edge);
    // A continuous translucent wash, registered to the actual opaque top.
    visibility *= 1.-tabletop*0.89;
  }
  for (int i=0; i<8; i++) {
    visibility *= studyCylinderShadow(studyCasterLocal(p-proxyBase[i],up),ray,proxyShape[i]);
  }
  // The four narrow supports extend the top's wash into individual cast marks.
  // No additional proxy loop is needed, and each starts at its physical foot.
  float frontHeight = 190.*up.y, rearHeight = 194.*up.y;
  visibility *= studyCylinderShadow(studyCasterLocal(p-deskShadowFeet[0],up),ray,vec4(frontHeight,13.,11.,0.66));
  visibility *= studyCylinderShadow(studyCasterLocal(p-deskShadowFeet[1],up),ray,vec4(frontHeight,13.,11.,0.66));
  visibility *= studyCylinderShadow(studyCasterLocal(p-deskShadowFeet[2],up),ray,vec4(rearHeight,14.,11.,0.66));
  visibility *= studyCylinderShadow(studyCasterLocal(p-deskShadowFeet[3],up),ray,vec4(rearHeight,14.,11.,0.66));
  return clamp(visibility,0.,1.);
}

// The source sits inside the painted shade and shines down at the actual desk.
vec3 taskLampPaint(vec3 color, vec3 p, float receiver) {
 if(lamp<.001||receiver<.001)return color;
 vec3 fromLamp=p-lampPosition;
 float distanceSquared=max(dot(fromLamp,fromLamp),1.);
 vec3 ray=fromLamp*inversesqrt(distanceSquared);
 float cone=smoothstep(.64,.94,dot(ray,normalize(lampDirection)));
 if(cone<.001)return color;
 float incidence=max(0.,dot(normalize(floorNormal),-ray));
 float falloff=18000./(18000.+distanceSquared);
 // Use the same upright desk proxies, excluding the light's own metal body.
 vec3 localRay=studyCasterLocal(-ray,normalize(floorNormal));
 float visibility=1.;
 float belowTop=deskShadowHeight-dot(p,normalize(floorNormal));
 if(belowTop>2.&&localRay.y>.001){
  vec3 hit=p-ray*(belowTop/localRay.y);
  float edge=min(min(hit.x-deskShadowBounds.x,deskShadowBounds.y-hit.x),min(hit.z-deskShadowBounds.z,deskShadowBounds.w-hit.z));
  visibility*=1.-smoothstep(-6.,6.,edge);
 }
 if(localRay.y>.001){
  for(int i=1;i<7;i++){
   vec4 shape=proxyShape[i];
   // Leaf gaps transmit the lamp wash; solid objects retain their silhouette.
   if(i==1)shape.w*=.28;
   visibility*=studyCylinderShadow(studyCasterLocal(p-proxyBase[i],normalize(floorNormal)),localRay,shape);
  }
 }
 float light=lamp*receiver*cone*incidence*falloff*visibility*(.20+.80*night);
 // A warm transparent wash retains the texture instead of bleaching it white.
 return color+vec3(.78,.43,.17)*light*(.45+.55*color);
}

vec3 lightPaint(vec3 color, vec3 p, float receiver) {
  float response = clamp(receiver,0.,1.);
  if (response <= 0.0001) return color;
  float clearLight = windowSun(p)*objectSunShadow(p);
  float energy = solarActive*response;
  float incidence = 0.38+0.62*max(0.,dot(normalize(floorNormal),solarDirection));
  // Transparent paint keeps cool reflected room light in shadow, and receives
  // a restrained ochre glaze in the sun instead of a glossy additive highlight.
  vec3 shaded = color*vec3(0.89,0.94,1.018);
  vec3 result = mix(color,shaded,energy*(1.-clearLight)*0.72);
  vec3 warm = mix(vec3(1.0,0.88,0.70),sunColor,0.48);
  result += warm*color*(energy*clearLight*incidence*0.22);
  result += vec3(0.036,0.022,0.010)*color*day*response*(1.-night*0.7);
  return max(taskLampPaint(result,p,response),vec3(0.));
}
`;

const DESK_CASTERS = [
  // contact x/y, height, radius across the desk, depth radius, paint opacity
  [277.98,536.8,180,35,23,.76], // task lamp
  [408.78,538.6,300,88,47,.61], // broad-leaf plant
  [519.64,545.49,115,91,35,.79], // laptop screen and base
  [806.4,534.98,65,29,24,.83],  // cup
  [214.34,565.84,30,78,41,.80], // left book stack
  [949.28,545.49,48,73,40,.82], // right book stack
  [336.18,550.6,65,23,17,.72], // brush tin
];

function vectorUniform(THREE,uniforms,name,values) {
  if (!uniforms[name]) uniforms[name] = {value:new THREE.Vector3()};
  if (!uniforms[name].value?.set) uniforms[name].value = new THREE.Vector3();
  uniforms[name].value.set(...values);
}

function proxyUniforms(THREE,uniforms) {
  if (!uniforms.proxyBase) uniforms.proxyBase = {value:[]};
  if (!uniforms.proxyShape) uniforms.proxyShape = {value:[]};
  if (!Array.isArray(uniforms.proxyBase.value)) uniforms.proxyBase.value = [];
  if (!Array.isArray(uniforms.proxyShape.value)) uniforms.proxyShape.value = [];
  for (let i=0;i<8;i++) {
    if (!uniforms.proxyBase.value[i]?.set) uniforms.proxyBase.value[i] = new THREE.Vector3();
    if (!uniforms.proxyShape.value[i]?.set) uniforms.proxyShape.value[i] = new THREE.Vector4();
  }
}

export function updateStudyLight({THREE,uniforms,distance,wallDepth,sillDepth=wallDepth+8,sunAltitude,sunAzimuth}) {
  const up = floorNormal(distance);
  const light = solarDirection(sunAltitude,sunAzimuth,distance);
  vectorUniform(THREE,uniforms,'floorNormal',up);
  vectorUniform(THREE,uniforms,'solarDirection',light);
  if (!uniforms.solarActive) uniforms.solarActive = {value:0};
  const altitude = Math.max(0,sunAltitude)*Math.PI/180;
  const rise = Math.min(1,Math.max(0,sunAltitude/8));
  const transition = rise*rise*(3-2*rise);
  const fallback = transition*(.32+.68*Math.sin(altitude))*Math.max(0,-light[2]);
  const strength = Number.isFinite(uniforms.strength?.value) ? uniforms.strength.value : fallback;
  uniforms.solarActive.value = sunAltitude > 0 && light[2] < -.01 ? Math.min(1,Math.max(0,strength)) : 0;
  proxyUniforms(THREE,uniforms);
  const lampBase=onSupport(277.98,536.8,DESK_HEIGHT,distance);
  const lampScale=(distance-lampBase[2])/distance;
  const source=[lampBase[0]+104.4*lampScale,lampBase[1]+126*lampScale,lampBase[2]];
  const target=onSupport(350,564,DESK_HEIGHT,distance);
  vectorUniform(THREE,uniforms,'lampPosition',source);
  vectorUniform(THREE,uniforms,'lampDirection',target.map((v,i)=>v-source[i]));
  const rear = onSupport(...DESK.rearLeft,DESK_HEIGHT,distance);
  const front = onSupport(...DESK.frontRight,DESK_HEIGHT,distance);
  if (!uniforms.deskShadowBounds) uniforms.deskShadowBounds = {value:new THREE.Vector4()};
  uniforms.deskShadowBounds.value.set(rear[0],front[0],rear[2],front[2]);
  if (!uniforms.deskShadowHeight) uniforms.deskShadowHeight = {value:0};
  uniforms.deskShadowHeight.value = rear.reduce((sum,v,i)=>sum+v*up[i],0);
  if (!uniforms.deskShadowFeet) uniforms.deskShadowFeet = {value:[]};
  if (!Array.isArray(uniforms.deskShadowFeet.value)) uniforms.deskShadowFeet.value = [];
  const feet = [...DESK.frontFeet,...DESK.rearFeet];
  for (let i=0;i<4;i++) {
    if (!uniforms.deskShadowFeet.value[i]?.set) uniforms.deskShadowFeet.value[i] = new THREE.Vector3();
    uniforms.deskShadowFeet.value[i].set(...onSupport(...feet[i],0,distance));
  }
  for (let i=0;i<DESK_CASTERS.length;i++) {
    const [x,y,height,rx,rz,opacity] = DESK_CASTERS[i];
    const base = onSupport(x,y,DESK_HEIGHT,distance);
    const scale = (distance-base[2])/distance;
    uniforms.proxyBase.value[i].set(...base);
    uniforms.proxyShape.value[i].set(height*scale,rx*scale,rz*scale,opacity);
  }
  const registration = (distance-sillDepth)/distance;
  uniforms.proxyBase.value[7].set((1274-836)*registration,(470.5-442)*registration,sillDepth);
  uniforms.proxyShape.value[7].set(170*registration,82*registration,34*registration,.57);
  return {
    solarDirection:uniforms.solarDirection,
    floorNormal:uniforms.floorNormal,
    solarActive:uniforms.solarActive,
    proxyBase:uniforms.proxyBase,
    proxyShape:uniforms.proxyShape,
    deskShadowBounds:uniforms.deskShadowBounds,
    deskShadowHeight:uniforms.deskShadowHeight,
    deskShadowFeet:uniforms.deskShadowFeet,
  };
}
