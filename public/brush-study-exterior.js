/**
 * A registered watercolor view beyond the study's window. Sky, celestial paint,
 * clouds, skyline and river are independent meshes, so their depth and motion
 * never displace the window frame or paint over the room. Every fragment is
 * clipped by its camera ray at the wall, including the wall's upper paper edge.
 * The source bank at native y=425 is registered to art y=330 by the .776 wash.
 */
import {solarDirection} from './brush-study-geometry.js?v=paint-screen-20261014e';
import {studyWindowGLSL} from './brush-study-window.js?v=paint-screen-20261014e';
export function createStudyExterior({THREE,scene,uniforms,texture,cloud,wallTexture,getDistance,getWallDepth}){
 const WIDTH=1672,HEIGHT=941,BANK=330,SCALE_Y=.776;
 // Native-image roof envelope: the irregular towers, bridge piers and tree line
 // reserve their own silhouettes; unpainted sky is kept out of the city layer.
 const roof=[
  [0,380],[15,339],[48,339],[55,379],[79,340],[102,340],[110,371],
  [121,291],[123,285],[131,283],[133,280],[134,267],[136,267],[137,280],
  [145,282],[148,287],[158,290],[161,377],[187,349],[213,351],[216,335],
  [225,334],[228,326],[230,311],[232,311],[233,326],[239,329],[247,333],
  [253,336],[256,377],[272,353],[306,356],[311,369],[318,350],[326,347],
  [329,334],[331,333],[333,344],[341,349],[346,369],[356,378],[360,358],
  [365,350],[370,356],[377,364],[385,377],[389,356],[399,354],[401,355],
  [406,363],[411,370],[414,355],[425,353],[429,359],[432,380],[435,343],
  [441,340],[446,337],[452,341],[457,343],[461,378],[470,379],[471,323],
  [478,320],[482,320],[484,314],[485,301],[487,301],[488,319],[495,319],
  [502,323],[505,328],[509,380],[528,383],[529,314],[538,313],[543,313],
  [547,313],[548,287],[550,287],[551,313],[556,314],[561,317],[566,320],
  [570,324],[573,376],[592,346],[611,366],[615,339],[625,339],[627,314],
  [629,314],[630,339],[639,345],[642,381],[658,364],[662,315],[672,311],
  [681,311],[683,302],[684,287],[686,287],[687,309],[697,315],[700,381],
  [704,364],[708,354],[715,344],[721,342],[725,351],[729,359],[734,374],
  [740,372],[743,366],[754,349],[758,340],[765,351],[778,351],[782,388],
  [810,390],[815,351],[819,346],[822,344],[823,324],[824,307],[826,307],
  [827,342],[832,344],[840,350],[849,354],[855,379],[860,368],[866,359],
  [869,354],[871,353],[873,354],[875,362],[880,372],[886,377],[897,393],
  [905,380],[911,374],[916,382],[926,381],[938,381],[944,379],[958,377],
  [970,374],[986,370],[1004,362],[1017,355],[1029,346],[1035,342],[1046,342],
  [1053,337],[1059,334],[1068,344],[1072,382],[1080,371],[1085,369],[1091,382],
  [1095,372],[1104,370],[1110,362],[1115,357],[1121,362],[1127,373],[1134,374],
  [1140,371],[1145,348],[1154,343],[1161,342],[1168,348],[1173,358],[1180,357],
  [1188,360],[1191,323],[1196,323],[1198,308],[1200,308],[1201,322],[1208,322],
  [1210,306],[1212,306],[1214,322],[1225,326],[1228,384],[1243,339],[1252,337],
  [1255,336],[1256,316],[1258,316],[1259,336],[1263,342],[1265,385],[1285,341],
  [1293,334],[1297,332],[1298,315],[1299,295],[1301,295],[1302,321],[1306,336],
  [1313,339],[1317,377],[1327,350],[1330,284],[1341,278],[1344,260],[1348,256],
  [1350,253],[1351,223],[1353,223],[1354,254],[1362,258],[1368,259],[1372,279],
  [1376,299],[1379,359],[1408,300],[1412,298],[1417,296],[1418,274],[1420,274],
  [1421,295],[1437,298],[1442,303],[1445,384],[1460,359],[1475,356],[1480,386],
  [1504,379],[1507,365],[1519,365],[1522,384],[1547,366],[1559,356],[1566,382],
  [1595,369],[1599,332],[1606,332],[1608,328],[1609,321],[1611,321],[1612,331],
  [1623,334],[1627,341],[1628,377],[1658,362],[1672,378]
 ];
 const skyline=`float skylineRoof(float x){\n${roof.slice(1).map(([x,y],i)=>{
  const a=roof[i];return `if(x<${x.toFixed(1)})return mix(${a[1].toFixed(1)},${y.toFixed(1)},clamp((x-${a[0].toFixed(1)})/${(x-a[0]).toFixed(1)},0.,1.));`;
 }).join('\n')}\nreturn 378.;}\n`;
 const common=`
 varying vec2 vUv;varying vec3 paintWorld;
 uniform sampler2D sourcePaint,cloudPaint,wallMask;
 uniform vec3 viewPosition,skyTop,skyHorizon,sunColor;
 uniform vec2 sunPixel,moonPixel;
 uniform float wallDepth,wallRegistration,windowFaceDepth,windowFaceRegistration,day,gold,night,morning,time;
${studyWindowGLSL}
 uniform float sunVisible,moonVisible,moonPhase,bodyElevation;
 const float BANK=330.;
 float box(vec2 p,vec2 lo,vec2 hi,float f){vec2 a=smoothstep(lo,lo+f,p),b=1.-smoothstep(hi-f,hi,p);return a.x*a.y*b.x*b.y;}
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float paintValue(vec3 c){return dot(c,vec3(.30,.50,.20));}
 vec4 painted(vec2 p){return texture2D(sourcePaint,vec2(p.x/1672.,1.-p.y/(941.*.776)));}
 vec3 muted(vec3 c,float amount){return mix(vec3(paintValue(c)),c,amount);}
 float windowClip(){
  vec3 ray=paintWorld-viewPosition;
  if(abs(ray.z)<.001)return 0.;
  vec3 onWall=viewPosition+ray*((wallDepth-viewPosition.z)/ray.z);
  vec2 p=vec2(onWall.x/wallRegistration+836.,470.5-onWall.y/wallRegistration);
  vec3 wall=texture2D(wallMask,vec2(p.x/1672.,1.-p.y/941.)).rgb;
  vec3 onFace=viewPosition+ray*((windowFaceDepth-viewPosition.z)/ray.z);
  vec2 faceArt=vec2(onFace.x/windowFaceRegistration+836.,470.5-onFace.y/windowFaceRegistration);
  // Clip the recessed glass through the front opening as well as its own edge.
  float frontOpening=windowRegion(faceArt)*(1.-smoothstep(439.,458.,faceArt.y));
  // The upper brush silhouette comes from the independent cloud painting,
  // whose white reserves contain no room frame or foreground-object pixels.
  vec3 cloudEdge=painted(p).rgb;
  float cloudPigment=1.-smoothstep(.86,.997,min(cloudEdge.r,min(cloudEdge.g,cloudEdge.b)));
  float paperEdge=mix(cloudPigment,1.,smoothstep(65.,110.,p.y));
  return studyWindowOpening(p,wall)*frontOpening*paperEdge;

 }
 vec3 exteriorTint(vec3 c){
  c=muted(c,.64);
  c*=mix(vec3(.12,.17,.28),vec3(.98,1.,1.02),day);
  c=mix(c,c*vec3(1.10,.90,.78),gold*(.35-.12*morning));
  return c;
 }
 ${skyline}
 `;
 const fragments={
  sky:`
  float h=clamp(p.y/BANK,0.,1.);
  vec3 color=mix(skyTop,skyHorizon,smoothstep(.04,1.,h));
  float glaze=sin(p.x*.005+sin(p.y*.016)*.6)*sin(p.y*.009+.8);
  color*=.98+glaze*.017;
  float sunDistance=length(p-sunPixel);
  color=mix(color,sunColor*.92,exp(-sunDistance*sunDistance/24000.)*gold*.11*sunVisible);
  float alpha=clip;
  `,
  sun:`
  float distanceToSun=length(p-sunPixel);
  float irregular=sin(p.x*.13+p.y*.17)*.40+sin(p.x*.27-p.y*.07)*.22;
  float core=1.-smoothstep(13.,21.,distanceToSun+irregular);
  float air=exp(-distanceToSun*distanceToSun/1300.)*.16+exp(-distanceToSun*distanceToSun/12500.)*.032;
  float visible=sunVisible*smoothstep(-3.,.3,bodyElevation);
  vec3 color=mix(sunColor,vec3(1.,.94,.78),.22);
  float alpha=(core*.83+air)*visible*clip;
  `,
  moon:`
  vec2 q=(p-moonPixel)/17.;float distanceToMoon=length(q);
  float side=moonPhase<.5?1.:-1.;
  float terminator=sqrt(max(0.,1.-q.y*q.y))*cos(moonPhase*6.2831853);
  float crescent=smoothstep(terminator-.05,terminator+.05,q.x*side);
  float body=1.-smoothstep(.86,1.06,distanceToMoon);
  vec3 color=mix(vec3(.44,.48,.57),vec3(.89,.88,.80),crescent);
  float alpha=body*(.06+.65*crescent)*moonVisible*clip*(.22+.78*night)*smoothstep(-3.,.2,bodyElevation);
  `,
  paintedClouds:`
  vec2 samplePoint=p+vec2(sin(time*.075+p.y*.009)*2.1,0.);
  vec3 paint=painted(samplePoint).rgb;
  float sourceY=p.y/.776;
  // Mask the same native x that the drifting wash samples. Otherwise a
  // tower edge can be carried onto the independent cloud plane.
  float sampledRoof=skylineRoof(samplePoint.x);
  float aboveCity=1.-smoothstep(sampledRoof-7.,sampledRoof+1.,sourceY);
  float pigment=1.-smoothstep(.73,.977,min(paint.r,min(paint.g,paint.b)));
  float level=paintValue(paint);
  vec3 color=mix(mix(skyTop,skyHorizon,clamp(p.y/BANK,0.,1.)),exteriorTint(paint),.55);
  color=mix(color,mix(skyHorizon,color,.67),gold*.16);
  float alpha=pigment*aboveCity*(1.-smoothstep(BANK-10.,BANK,p.y))*mix(.35,.68,day)*clip;
  // Only the high cloud deck belongs to this source layer. The low source
  // haze contains distant facade strokes; sky and drifting clouds supply it.
  alpha*=1.-smoothstep(195.,235.,p.y);
  alpha*=1.-exp(-pow(length(p-sunPixel)/25.,2.))*.72*sunVisible;
  `,
  clouds:`
  vec3 color=vec3(0.);float cloudAlpha=0.;
  for(int i=0;i<3;i++){
   float n=float(i),width=650.+n*100.;
   float cx=mod(475.+n*565.+time*(2.8+n*.7),2370.)-345.;
   float cy=60.+n*44.;vec2 q=(p-vec2(cx,cy))/vec2(width,width*.31)+.5;
   if(q.x>0.&&q.x<1.&&q.y>0.&&q.y<1.){
    vec4 paint=texture2D(cloudPaint,vec2(q.x,1.-q.y));
    vec3 cloudTint=mix(vec3(.23,.28,.38),mix(vec3(.95,.96,1.),vec3(1.04,.91,.80),gold),day);
    float a=paint.a*(1.-smoothstep(190.,258.,p.y))*mix(.19,.40,day);
    color+=muted(paint.rgb,.50)*cloudTint*a;cloudAlpha+=a;
   }
  }
  color/=max(cloudAlpha,.001);
  float alpha=min(cloudAlpha,.58)*clip;
  alpha*=1.-exp(-pow(length(p-sunPixel)/26.,2.))*.50*sunVisible;
  `,
  city:`
  vec3 paint=painted(p).rgb;
  float sourceY=p.y/.776,roof=skylineRoof(p.x);
  float cityShape=smoothstep(roof-2.5,roof+2.,sourceY)*(1.-smoothstep(BANK-1.,BANK+4.,p.y));
  float paper=1.-smoothstep(.91,.995,min(paint.r,min(paint.g,paint.b)));
  vec3 color=exteriorTint(paint);
  color=mix(color,mix(skyHorizon,color,.87),smoothstep(.68,.94,paintValue(paint))*.30);
  vec2 cell=floor(p/vec2(13.,10.)),local=fract(p/vec2(13.,10.));
  float seed=hash(cell),lit=smoothstep(seed*.30,seed*.30+.55,night);
  float window=box(local,vec2(.33,.34),vec2(.53,.53),.10);
  float structure=smoothstep(.018,.09,paint.b-paint.r)*(1.-smoothstep(.30,.62,paintValue(paint)));
  color+=vec3(.31,.19,.095)*window*step(.90,seed)*lit*structure;
  float alpha=cityShape*paper*clip;
  `,
  river:`
  float depth=clamp((p.y-BANK)/125.,0.,1.),anchor=smoothstep(BANK+3.,BANK+46.,p.y);
  vec2 samplePoint=p+vec2(sin(p.y*.071-time*.44)*anchor*3.2+sin(p.y*.12+time*.62)*anchor*1.6,sin(p.x*.028+time*.32)*anchor*.50);
  vec3 paint=painted(samplePoint).rgb;
  vec3 color=exteriorTint(paint);
  float value=paintValue(paint);
  color=mix(color,mix(skyHorizon,color,.72),smoothstep(.65,.96,value)*.52);
  vec2 reflectionPoint=vec2(p.x+sin(p.y*.081-time*.40)*depth*2.,BANK-(p.y-BANK)*.80);
  vec3 reflectionPaint=painted(reflectionPoint).rgb;
  float reflectedInk=(1.-smoothstep(.40,.76,paintValue(reflectionPaint)))*smoothstep(.005,.10,reflectionPaint.b-reflectionPaint.r);
  float reflectionEnvelope=smoothstep(skylineRoof(reflectionPoint.x)-2.,skylineRoof(reflectionPoint.x)+4.,reflectionPoint.y/.776);
  color=mix(color,exteriorTint(reflectionPaint),reflectedInk*reflectionEnvelope*exp(-depth*2.9)*.20);
  float ripples=0.,darkWash=0.;
  for(int i=0;i<13;i++){
   float n=float(i),seed=hash(vec2(n,7.)),d=hash(vec2(n,15.));
   float cy=BANK+5.+pow(d,1.3)*112.;
   float cx=370.+hash(vec2(n,3.))*1040.+sin(time*(.20+seed*.13)+n)*25.;
   vec2 q=(p-vec2(cx,cy+sin(time*.29+n)*2.2))/vec2(58.+hash(vec2(n,19.))*170.,1.2+d*2.4);
   float edge=abs(q.y)+sin(q.x*4.+n)*.16;
   float mark=(1.-smoothstep(.40,1.42,edge))*(1.-smoothstep(.5,1.,abs(q.x)));
   mark*=.60+.40*smoothstep(-.35,.35,sin(q.x*8.+n));
   mark*=.64+.36*sin(time*.24+n);
   ripples+=mark*step(.43,seed);darkWash+=mark*(1.-step(.43,seed));
  }
  ripples=min(ripples,1.);color*=1.-min(darkWash,1.)*.045;
  color+=mix(vec3(.025,.039,.058),vec3(.045,.060,.066),day)*ripples;
  float solarPath=exp(-pow((p.x-sunPixel.x)/(25.+max(0.,p.y-BANK-8.)*.64),2.));
  float solarLight=sunVisible*smoothstep(-.6,1.4,bodyElevation);
  color=mix(color,sunColor*(.50+value*.24),solarPath*solarLight*(.055+gold*.17)*(.48+.52*ripples));
  color+=sunColor*solarPath*solarLight*ripples*(.045+gold*.06);
  float moonPath=exp(-pow((p.x-moonPixel.x)/63.,2.));
  color+=vec3(.12,.17,.24)*moonPath*moonVisible*ripples*night*.34;
  vec2 cell=floor(reflectionPoint/vec2(13.,10.)),local=fract(reflectionPoint/vec2(13.,10.));
  float seed=hash(cell),lit=smoothstep(seed*.30,seed*.30+.55,night);
  float window=box(local,vec2(.25,.22),vec2(.65,.75),.15);
  color+=vec3(.08,.049,.022)*step(.90,seed)*lit*window*reflectedInk*reflectionEnvelope*exp(-depth*2.8)*(.3+.7*ripples);
  float alpha=smoothstep(BANK-1.5,BANK+2.5,p.y)*(1.-smoothstep(451.,455.,p.y))*clip;
  `
 };
 const vertex='varying vec2 vUv;varying vec3 paintWorld;void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.);paintWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}';
 const meshes=[];
 const definitions=[['sky',-700,-20],['sun',-650,-19],['moon',-650,-18],['paintedClouds',-470,-17],['clouds',-410,-16],['city',-180,-15],['river',-180,-14]];
 let lastSun=null,lastMoon=null;
 for(const [kind,offset,order] of definitions){
  const geometry=new THREE.PlaneGeometry(WIDTH,HEIGHT,96,56);
  if(kind==='river'){
   const uv=geometry.attributes.uv;
   for(let i=0;i<uv.count;i++)uv.setY(i,1.-(BANK-2.+(1.-uv.getY(i))*127.)/HEIGHT);
  }
  const bodyElevation={value:0};
  const material=new THREE.ShaderMaterial({
   uniforms:{...uniforms,sourcePaint:{value:texture},cloudPaint:{value:cloud},wallMask:{value:wallTexture},bodyElevation},
   transparent:true,depthWrite:false,side:THREE.DoubleSide,
   vertexShader:vertex,
   fragmentShader:common+`void main(){vec2 p=vec2(vUv.x,1.-vUv.y)*vec2(1672.,941.);float clip=windowClip();if(clip<.005)discard;${fragments[kind]}if(alpha<.006)discard;gl_FragColor=vec4(max(color,vec3(0.)),alpha);#include <colorspace_fragment>\n}`.replace(';#include',';\n#include')
  });
  const mesh=new THREE.Mesh(geometry,material);mesh.name='Study exterior '+kind;mesh.renderOrder=order;
  mesh.userData.exteriorKind=kind;mesh.userData.depthOffset=offset;meshes.push(mesh);scene.add(mesh);
 }
 function celestial(body,pixelName,visibleName,kind){
  if(!body)return;
  // Both the light rays and the celestial painting use this shared orientation.
  const C=getDistance(),[x,y,z]=solarDirection(body.altitude,body.azimuth,C);
  const visible=Number.isFinite(z)&&z<-.00001&&body.altitude>-3;
  uniforms[visibleName].value=visible?1:0;
  if(visible)uniforms[pixelName].value.set(836+C*x/-z,470.5-C*y/-z);
  else uniforms[pixelName].value.set(-10000,-10000);
  for(const mesh of meshes)if(mesh.userData.exteriorKind===kind||(kind==='sun'&&mesh.userData.exteriorKind==='river'))mesh.material.uniforms.bodyElevation.value=body.altitude;
 }
 function setCelestial(sun,moon){
  lastSun=sun;lastMoon=moon;
  celestial(sun,'sunPixel','sunVisible','sun');celestial(moon,'moonPixel','moonVisible','moon');
  if(moon&&Number.isFinite(moon.phase))uniforms.moonPhase.value=moon.phase;
 }
 function resize(){
  const C=getDistance(),wall=getWallDepth();
  for(const mesh of meshes){
   const position=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv;
   for(let i=0;i<position.count;i++){
    const x=uv.getX(i)*WIDTH,y=(1.-uv.getY(i))*HEIGHT;
    // Continuous at the shore: only nearer water advances towards the window.
    const ramp=mesh.userData.exteriorKind==='river'?THREE.MathUtils.smoothstep(y,BANK,455)*135:0;
    const z=wall+mesh.userData.depthOffset+ramp,k=(C-z)/C;
    position.setXYZ(i,(x-836)*k,(470.5-y)*k,z);
   }
   position.needsUpdate=true;mesh.geometry.computeBoundingSphere();
  }
  if(lastSun||lastMoon)setCelestial(lastSun,lastMoon);
 }
 resize();
 return {resize,setCelestial};
}
