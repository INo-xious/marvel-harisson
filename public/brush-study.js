import {LAPTOP_TIMING,sampleLaptopTransition} from './laptop-transition.js?v=laptop-flight-20261103d';
import {createRoomInteractions} from './room-interactions.js?v=laptop-flight-20261103d';
import * as THREE from 'three';
import {WatercolorPost} from './watercolor-post.js';
import {sunState,minutesInOsaka,startTimePreview,runningRoomDate} from './time.js';
import {createDaylightPalette} from './daylight-palette.js';
import {planeScale,onSupport,STUDY_WINDOW_AZIMUTH,windowPaneDepth,windowFaceDepth,windowPaintDepth} from './brush-study-geometry.js?v=laptop-flight-20261103d';
import {createStudyDesk} from './brush-study-desk.js?v=laptop-flight-20261103d';
import {createStudyExterior} from './brush-study-exterior.js?v=laptop-flight-20261103d';
import {studyLightGLSL,updateStudyLight} from './brush-study-light.js?v=laptop-flight-20261103d';
import {studyWindowGLSL} from './brush-study-window.js?v=laptop-flight-20261103d';
import {portfolio,tracks} from './content.js?v=portfolio-20261103a';
import {createSillIconMotion,studyIconMotionGLSL,STUDY_SILL_ICONS} from './brush-study-icons.js?v=laptop-flight-20261103d';
import {createMacDesktop as createPaintedDesktop} from './mac-desktop.js?v=laptop-flight-20261103d';
import {watercolorReveal} from './brush-study-wash.js?v=laptop-flight-20261103d';
import {createPaintedPortal} from './brush-study-portal.js?v=laptop-flight-20261103d';
import {fullLaptopScreenView} from './brush-study-laptop-view.js?v=laptop-flight-20261103d';
import {createLaptopProjection} from './brush-study-laptop-view.js?v=laptop-flight-20261103d';
import {createLaptopLandscapeSurface} from './brush-study-laptop-landscape.js?v=laptop-flight-20261103d';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas=document.querySelector('#painting'),renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'low-power'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,1,10000);
let cameraDistance=1700;
const viewTilt=new THREE.Vector2(),raycaster=new THREE.Raycaster();
const post=new WatercolorPost(renderer,{reduced,maxPixels:1400000,samples:0});
// Keep the footprint and drying simulation; clean water gently dilutes pigment.
let waterShader=post.material.fragmentShader
 .replace('grain*mix(.065,.05,daylight)','grain*mix(0.,0.,daylight)')
 .replace('vec2 map=(sm.rg-neutral)*.13;','vec2 map=(sm.rg-neutral)*.027;')
 .replace('wet.b*.012','wet.b*.0025')
 .replace('.85+wet.b*4.+shear*9.','.85+wet.b*.8+shear*1.4')
 .replace('wet.b*.35+shear*.35','wet.b*.08+shear*.08');
const liftStart=waterShader.indexOf(' if(wetEnabled>.5){\n  // The wet footprint:');
const liftEnd=waterShader.indexOf(' gl_FragColor=',liftStart);
waterShader=waterShader.slice(0,liftStart)+`
 if(wetEnabled>.5){
  float waterAmount=smoothstep(.015,.30,wet.a)*(.65+.35*smoothstep(.01,.15,wet.b));
  // Water briefly thins color, rather than moving the painted form strongly.
  float pigmentLight=lum(col);
  col=mix(col,vec3(pigmentLight),waterAmount*.62);
  col=mix(col,vec3(1.),waterAmount*.05*daylight*protect);
 }
`+waterShader.slice(liftEnd);
// Follow the projective camera when locating the temporary wet footprint.
waterShader='uniform mat4 waterInverseView;\n'+waterShader;
waterShader=waterShader.replace('vec2 art=artOrigin+vec2(vUv.x,1.-vUv.y)*artSpan;',`vec4 rayNear=waterInverseView*vec4(vUv*2.-1.,-1.,1.);
 vec4 rayFar=waterInverseView*vec4(vUv*2.-1.,1.,1.);
 vec3 a=rayNear.xyz/rayNear.w,b=rayFar.xyz/rayFar.w;
 vec3 paperPoint=mix(a,b,-a.z/(b.z-a.z));
 vec2 art=vec2(paperPoint.x+836.,470.5-paperPoint.y);`);
post.material.uniforms.waterInverseView={value:new THREE.Matrix4()};
post.material.fragmentShader=waterShader;
post.material.needsUpdate=true;
const reviewTime=new URLSearchParams(location.search).get('previewTime');
let preview=reviewTime===null?null:startTimePreview(Math.max(0,Math.min(1439,Number(reviewTime)||0))),lamp=true,ready=false,last=0,elapsed=0,drag=null,span=new THREE.Vector2(1672,941);
const parallaxTarget=new THREE.Vector2();
const uniforms={viewPosition:{value:new THREE.Vector3()},wallDepth:{value:0},wallRegistration:{value:1},windowFaceDepth:{value:0},windowFaceRegistration:{value:1},clockPaint:{value:null},day:{value:1},gold:{value:0},night:{value:0},skyTop:{value:new THREE.Color()},skyHorizon:{value:new THREE.Color()},roomTint:{value:new THREE.Color()},sunColor:{value:new THREE.Color()},sunPixel:{value:new THREE.Vector2(-100,-100)},sunVisible:{value:0},moonPixel:{value:new THREE.Vector2(-100,-100)},moonVisible:{value:0},moonPhase:{value:0},strength:{value:0},lamp:{value:1},time:{value:0}};
const iconMotion=createSillIconMotion({THREE,reduced});Object.assign(uniforms,iconMotion.uniforms);
for(const name of ['chairContact','deskLeftContact','deskRightContact','bedContact','bedFootContact','belongingsContact'])uniforms[name]={value:new THREE.Vector2()};
uniforms.brushPhase={value:0};uniforms.morning={value:0};
uniforms.clockMinutes={value:0};uniforms.catReaction={value:-100};
uniforms.sunElevation={value:0};uniforms.moonElevation={value:0};
let clockMinute=0,clockAt=0,catReactionAt=-100;
const STUDY_SHORE=330;
const layerMeshes=[];
let deskScene=null,exteriorScene=null;
let latestSun=null;
const layerSpecs=[
 {id:0,name:'Wall and floor',file:'layer-room-backdrop.webp',z:0,scale:[1,1],offset:[0,0],order:1},
 {id:8,name:'Recessed window frame and returns',file:'layer-room-backdrop.webp',z:0,scale:[1,1],offset:[0,0],order:.8},
 {id:9,name:'Projecting window sill',file:'layer-room-backdrop.webp',z:0,scale:[1,1],offset:[0,0],order:1.2},
 {id:10,name:'Sill icons, radio and plant',file:'layer-room-backdrop.webp',z:0,scale:[1,1],offset:[0,0],order:1.4},
 // Floor objects are behind the top/apron, but in front of the rear supports.
 {id:5,name:'Belongings',file:'layer-belongings.webp',z:50,scale:[.75,.62],offset:[80,275],order:2.2},
 {id:2,name:'Bed and cat',file:'layer-grounded-bed.webp',z:125,scale:[.78,.78],offset:[360,213],order:4},
 {id:3,name:'Chair and coat',file:'layer-chair-coat.webp',z:205,scale:[.90,.85],offset:[0,115],order:5},
 {id:7,name:'Horizontal floor',file:'layer-room-backdrop.webp',z:0,scale:[1,1],offset:[0,0],order:1}
];
// Signed distance masks follow the painted support planes and foreground silhouettes.
function polygonShader(name,points){return `float ${name}(vec2 p){float distanceToEdge=10000.,inside=0.;vec2 a,b,e;float t;\n`+points.map((a,i)=>{const b=points[(i+1)%points.length];return `a=vec2(${a.map(n=>n.toFixed(1))});b=vec2(${b.map(n=>n.toFixed(1))});e=b-a;t=clamp(dot(p-a,e)/dot(e,e),0.,1.);distanceToEdge=min(distanceToEdge,length(p-a-e*t));if((a.y>p.y)!=(b.y>p.y)){if(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=1.-inside;}`;}).join('\n')+`return smoothstep(-4.,6.,distanceToEdge*(inside*2.-1.));}\n`;}
const supportMasks=polygonShader('bedSurface',[[1361,420],[1672,411],[1672,941],[1450,941],[1357,884],[1283,841],[1186,772],[1218,657],[1303,553],[1310,486]])+
 polygonShader('radioMask',[[1028,378],[1158,374],[1166,441],[1028,443]])+
 polygonShader('badgeMask',[[737,387],[803,387],[802,447],[737,447]])+
 polygonShader('photoMask',[[812,393],[886,393],[886,450],[812,450]])+
 polygonShader('mailMask',[[888,393],[951,393],[951,450],[888,450]]);
const fragment=`
${supportMasks}
${studyWindowGLSL}
${studyIconMotionGLSL}
const float SHORE=${STUDY_SHORE.toFixed(1)};
varying vec2 vUv;
varying vec3 paintWorld;
uniform vec3 viewPosition;
uniform float wallDepth,wallRegistration;
uniform sampler2D painting,clockPaint;
uniform vec3 skyTop,skyHorizon,roomTint,sunColor;
uniform vec2 sunPixel,moonPixel,assetScale,assetOffset,chairContact,deskLeftContact,deskRightContact,bedContact,bedFootContact,belongingsContact;
uniform float layerId;
uniform float day,gold,night,sunVisible,moonVisible,moonPhase,strength,lamp,time,brushPhase,morning,clockMinutes,catReaction,sunElevation,moonElevation;
${studyLightGLSL}
vec4 paintSample(vec2 at){
 vec2 q=(vec2(at.x,1.-at.y)*vec2(1672.,941.)-assetOffset)/assetScale;
 vec2 u=vec2(q.x/1672.,1.-q.y/941.);
 if(any(lessThan(u,vec2(0.)))||any(greaterThan(u,vec2(1.))))return vec4(0.);
 vec4 source=texture2D(painting,u);
 source.a*=smoothstep(0.,7.,q.x)*smoothstep(0.,7.,1672.-q.x)*smoothstep(0.,7.,q.y)*smoothstep(0.,7.,941.-q.y);
 return source;
}
float box(vec2 p,vec2 lo,vec2 hi,float f){vec2 a=smoothstep(lo,lo+f,p),b=1.-smoothstep(hi-f,hi,p);return a.x*a.y*b.x*b.y;}
float stroke(vec2 p,vec2 a,vec2 b,float width){vec2 e=b-a;float t=clamp(dot(p-a,e)/max(dot(e,e),.01),0.,1.);return 1.-smoothstep(width,width+7.+t*9.,length(p-a-e*t));}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
// Large flowing glaze fields, periodic over the day; never deform furniture.
float brushWash(vec2 p,float phase){return .5+.25*sin(p.x*.008+sin(p.y*.014+phase)*1.4+phase)+.15*sin(p.y*.021-p.x*.004-phase*.7);}
float oval(vec2 p,vec2 c,vec2 r){return 1.-smoothstep(.45,1.,length((p-c)/r));}
float plantPigment(vec3 c){return smoothstep(-.008,.065,c.g-max(c.r,c.b));}
float handLine(vec2 p,vec2 end,float width){vec2 e=end;float t=clamp(dot(p,e)/max(dot(e,e),.01),0.,1.);float taper=width*(1.-t*.55);vec2 bristle=vec2(-e.y,e.x)/max(length(e),.01)*sin(t*11.)*.25;return (1.-smoothstep(taper,taper+.9,length(p-e*t-bristle)))*(.87+.13*sin(t*7.+1.));}
void main(){
 vec2 p=vec2(vUv.x,1.-vUv.y)*vec2(1672.,941.);
 vec2 sceneUV=vUv;
 if(layerId==10.){vec2 sourcePoint=studyIconSourcePoint(p);sceneUV=vec2(sourcePoint.x/1672.,1.-sourcePoint.y/941.);}
 // Connected local deformation: torso breathing, head nuzzle, ear twitch and curled tail.
 float torso=oval(p,vec2(1542.,591.),vec2(94.,47.));
 float head=oval(p,vec2(1460.,584.),vec2(43.,34.));
 float ear=oval(p,vec2(1445.,553.),vec2(23.,22.));
 float tail=oval(p,vec2(1600.,635.),vec2(39.,17.));
 float awake=catReaction>=0.?exp(-catReaction*.42)*sin(min(catReaction,3.14159)*1.1):0.;
 float twitch=pow(max(0.,sin(time*.73)),12.);
 vec2 catOffset=vec2(head*(sin(time*.48)*1.5+awake*4.),torso*sin(time*1.5)*1.8+head*(twitch*3.+awake*7.)+ear*sin(time*8.)*twitch*2.7+tail*sin(time*1.1)*4.);
 // Wind bends the crowns and leaf tips, with stems/pots fading to a fixed root.
 vec3 original=paintSample(sceneUV).rgb;
 vec2 windTexel=vec2(8./1672.,8./941.);
 float foliage=max(plantPigment(original),max(max(plantPigment(paintSample(sceneUV+vec2(windTexel.x,0.)).rgb),plantPigment(paintSample(sceneUV-vec2(windTexel.x,0.)).rgb)),max(plantPigment(paintSample(sceneUV+vec2(0.,windTexel.y)).rgb),plantPigment(paintSample(sceneUV-vec2(0.,windTexel.y)).rgb))));
 // The separated sill plant uses a fixed silhouette, so pale olive pigment
 // bends with its dark leaves instead of disintegrating under a green key.
 if(layerId==10.)foliage=1.;
 float leftCrown=box(p,vec2(208.,35.),vec2(575.,465.),32.)*pow(clamp((470.-p.y)/360.,0.,1.),1.5);
 float rightCrown=box(p,vec2(1175.,267.),vec2(1374.,382.),18.)*pow(clamp((375.-p.y)/108.,0.,1.),1.4);
 float vine=box(p,vec2(1160.,408.),vec2(1292.,646.),22.)*clamp((p.y-420.)/210.,0.,1.);
 float shelfLeaves=box(p,vec2(106.,0.),vec2(240.,367.),24.);
 float gust=.65+.35*sin(time*.21);
 vec2 leafOffset=vec2(sin(time*.63+p.y*.009)*gust*(leftCrown*5.5+rightCrown*4.5+vine*4.+shelfLeaves*2.5),sin(time*.79+p.x*.012)*(leftCrown+rightCrown)*1.2)*foliage;
 if(layerId==10.)leafOffset*=1.-studyPotContour(p);
 vec2 nativeUV=sceneUV+vec2(catOffset.x+leafOffset.x,-catOffset.y-leafOffset.y)/vec2(1672.,941.);
 if(layerId==0.&&p.y>464.)nativeUV=sceneUV;
 if(layerId==8.||layerId==9.)nativeUV=sceneUV;
 vec3 base=paintSample(nativeUV).rgb;
 // Glass respects mullions and the painted green/ochre foreground silhouettes.
 float aperture=max(box(p,vec2(416.,0.),vec2(623.,427.),8.),max(box(p,vec2(659.,0.),vec2(1145.,427.),8.),box(p,vec2(1187.,0.),vec2(1339.,427.),8.)));
 vec2 tx=vec2(3.6/1672.,3.6/941.);
 vec3 leafSoft=(base*2.+paintSample(nativeUV+vec2(tx.x,0.)).rgb+paintSample(nativeUV-vec2(tx.x,0.)).rgb+paintSample(nativeUV+vec2(0.,tx.y)).rgb+paintSample(nativeUV-vec2(0.,tx.y)).rgb)/6.;
 float green=max(plantPigment(base),plantPigment(leafSoft));
 float warm=smoothstep(.035,.14,base.r-base.b);
 vec3 paint=paintSample(nativeUV).rgb;
 // Independent structure needs paint behind the foreground cutouts. Nearby
 // clean timber/ledge samples keep grain and highlights without baked items.
 if(layerId==8.){
  float timberX=p.x<520.?411.:p.x<890.?632.:p.x<1250.?1154.:1355.;
  vec2 timberArt=vec2(timberX,p.y);
  vec3 timberInk=paintSample(vec2(timberArt.x/1672.,1.-timberArt.y/941.)).rgb;
  float plantBacking=step(1310.,p.x)*smoothstep(260.,280.,p.y);
  float radioBacking=studyWindowBand(p.x,1138.,1172.,3.)*smoothstep(360.,378.,p.y);
  float restoreTimber=max(max(plantBacking,radioBacking),smoothstep(.02,.20,sillItemPaint(timberArt,timberInk)));
  timberArt.y=mix(timberArt.y,155.+mod(p.y*.29,80.),restoreTimber);
  vec3 timber=paintSample(vec2(timberArt.x/1672.,1.-timberArt.y/941.)).rgb;
  vec3 cleanSlice=paintSample(vec2(p.x/1672.,1.-timberArt.y/941.)).rgb;
  cleanSlice=mix(cleanSlice,timber,smoothstep(.005,.04,cleanSlice.b-cleanSlice.r));
  timber=mix(timber,cleanSlice,max(plantBacking,radioBacking));
  float keepNative=studyWindowWarm(base)*(1.-max(restoreTimber,smoothstep(.01,.12,sillItemPaint(p,base))));
  paint=mix(timber,paint,keepNative);
 }
 if(layerId==9.){
  vec3 ledge=paintSample(vec2((1000.+8.*sin(p.x*.018))/1672.,sceneUV.y)).rgb;
  float oldFeet=max(studyWindowBand(p.x,735.,803.,4.),studyWindowBand(p.x,810.,876.,4.));
  oldFeet=max(oldFeet,max(studyWindowBand(p.x,887.,954.,4.),studyWindowBand(p.x,1020.,1173.,5.)));
  oldFeet=max(oldFeet,studyWindowBand(p.x,1220.,1310.,5.));
  oldFeet*=studyWindowBand(p.y,426.,465.,3.);
  paint=mix(paint,ledge,max(oldFeet,smoothstep(.005,.08,sillItemPaint(p,base))));
  paint=mix(vec3(.93,.90,.84),paint,studyWindowWarm(paint));
 }
 // Diffuse contour pigment over a few pixels without a cutout halo or region border.
 if(layerId<8.)paint=mix(paint,leafSoft,green*.68);
 // Adjacent wall washes restore the old vine's whole footprint, including
 // pale peripheral pigment that no longer belongs to its foreground matte.
 if(layerId==0.&&p.y>460.&&p.y<679.&&p.x>1151.&&p.x<1238.){
  vec2 grainStep=vec2(6./1672.,8./941.);
  vec2 leftUV=vec2(1145./1672.,sceneUV.y),rightUV=vec2(1248./1672.,sceneUV.y);
  vec3 leftWall=(paintSample(leftUV).rgb+paintSample(leftUV+vec2(0.,grainStep.y)).rgb+paintSample(leftUV-vec2(0.,grainStep.y)).rgb)/3.;
  vec3 rightWall=(paintSample(rightUV).rgb+paintSample(rightUV+vec2(0.,grainStep.y)).rgb+paintSample(rightUV-vec2(0.,grainStep.y)).rgb)/3.;
  vec2 patchUV=sceneUV+vec2(90./1672.,0.);
  vec3 wallGrain=paintSample(patchUV).rgb;
  vec3 wallGrainWash=(wallGrain+paintSample(patchUV+vec2(grainStep.x,0.)).rgb+paintSample(patchUV-vec2(grainStep.x,0.)).rgb+paintSample(patchUV+vec2(0.,grainStep.y)).rgb+paintSample(patchUV-vec2(0.,grainStep.y)).rgb)/5.;
  // Match the surrounding low-frequency wash while retaining the clean
  // patch's two-dimensional paper grain, avoiding a striped fill column.
  vec3 cleanWall=mix(leftWall,rightWall,smoothstep(1150.,1240.,p.x))+(wallGrain-wallGrainWash)*.60;
  float restoreWall=smoothstep(1151.,1162.,p.x)*(1.-smoothstep(1225.,1238.,p.x));
  restoreWall*=smoothstep(460.,474.,p.y)*(1.-smoothstep(665.,679.,p.y));
  paint=mix(paint,cleanWall,restoreWall);
 }
 // The repainted dial reserves its paper; live hands supply the only clock strokes.
 vec2 clockPoint=(p-vec2(1495.,158.))/vec2(.84,.88);
 vec2 dialUV=vec2(.5)+clockPoint/166.;
 vec3 dial=texture2D(clockPaint,vec2(dialUV.x,1.-dialUV.y)).rgb;
 paint=mix(paint,dial,(1.-smoothstep(77.,80.,length(clockPoint)))*(layerId==0.?1.:0.));
 float hourAngle=mod(clockMinutes/60.,12.)*.523598776,minuteAngle=mod(clockMinutes,60.)*.104719755,secondAngle=fract(clockMinutes)*6.2831853;
 float hands=max(handLine(clockPoint,vec2(sin(hourAngle),-cos(hourAngle))*41.,1.45),handLine(clockPoint,vec2(sin(minuteAngle),-cos(minuteAngle))*61.,1.0));
 float secondHand=handLine(clockPoint,vec2(sin(secondAngle),-cos(secondAngle))*64.,.38);
 float pin=1.-smoothstep(2.,3.,length(clockPoint));
 if(layerId==0.){paint=mix(paint,vec3(.22,.18,.14),max(hands,pin)*.77);paint=mix(paint,vec3(.39,.27,.20),secondHand*.50);}
 // Local transparent pigment deposits shift with the hour, beyond a global tint.
 // A dilute morning wash becomes broader pooled pigment at sunset/night.
 float deposit=brushWash(p,brushPhase),previousDeposit=brushWash(p,0.);
 float brushDensity=(deposit-previousDeposit)*(.035+gold*.13+night*.10);
 float pigmentCoverage=1.-smoothstep(.62,.93,dot(paint,vec3(.3,.5,.2)));
 paint*=1.+brushDensity*(.25+.75*pigmentCoverage);
 vec3 col=paint*roomTint;
 vec3 glaze=mix(vec3(.76,.87,1.),vec3(1.,.78,.64),gold*(1.-morning*.65));
 glaze=mix(glaze,vec3(.64,.72,1.),night);
 col=mix(col,col*glaze,pigmentCoverage*deposit*(.035+gold*.13+night*.09));
 // Shared directional light passes through the real window and casts from
 // upright object volumes. The tabletop uses the same function in its module.
 float duvet=bedSurface(p)*(1.-torso)*(layerId==2.?1.:0.);
 float groundReceiver=layerId==7.?1.:0.;
 col=lightPaint(col,paintWorld,max(duvet,groundReceiver));
 // Untouched perimeter paper stays white under the moving room illumination.
 float perimeter=1.-box(p,vec2(135.,180.),vec2(1515.,740.),90.);
 float blank=smoothstep(.88,.955,min(original.r,min(original.g,original.b)))*perimeter;
 // Foreground alpha cutouts already reserve surrounding paper. Their cream
 // fabric, ball panels and object highlights still need the room's shading.
 if(layerId!=0.&&layerId!=7.)blank=0.;
 float contactShadow=0.;
 float coverage=paintSample(nativeUV).a;
 if(layerId==0.){
  coverage*=retainedWindowPaint(p,original)*upperPaperEdge(p);
  // Keep backing paint under the floor's feather. Complementary transparent
  // mattes otherwise expose a pale paper seam where both are half covered.
  coverage*=1.-smoothstep(705.,717.,p.y);
 }
 if(layerId==8.)coverage*=framePaint(p,original)*upperPaperEdge(p);
 if(layerId==9.){
  coverage*=sillPaint(p,original);
  // Small violet-grey deposits join the independent objects to the ledge.
  contactShadow=oval(p,vec2(770.,451.),vec2(32.,5.))*.045*(1.-iconHover.x*.65);
  contactShadow+=oval(p,vec2(843.,451.),vec2(30.,5.))*.045*(1.-iconHover.y*.65);
  contactShadow+=oval(p,vec2(919.,451.),vec2(31.,5.))*.045*(1.-iconHover.z*.65);
  contactShadow+=oval(p,vec2(1095.,449.),vec2(79.,6.))*.055;
  contactShadow+=oval(p,vec2(1262.,445.),vec2(46.,7.))*.07;
 }
 if(layerId==10.)coverage*=sillItemPaint(vec2(nativeUV.x,1.-nativeUV.y)*vec2(1672.,941.),base);
 if(layerId==7.){
  coverage*=smoothstep(685.,705.,p.y);
  // Contact washes are painted on the actual horizontal ground.
  contactShadow=oval(p,chairContact,vec2(230.,29.))*.13;
  contactShadow+=oval(p,deskLeftContact,vec2(55.,14.))*.19+oval(p,deskRightContact,vec2(55.,14.))*.19;
  contactShadow+=oval(p,belongingsContact+vec2(-62.,-16.),vec2(46.,12.))*.20;
  contactShadow+=oval(p,belongingsContact+vec2(-10.,2.),vec2(47.,13.))*.22;
  contactShadow+=oval(p,belongingsContact+vec2(48.,-7.),vec2(80.,17.))*.18;
  contactShadow+=oval(p,bedContact,vec2(235.,37.))*.15+oval(p,bedFootContact,vec2(45.,15.))*.22;
  // Four corner feet keep the center of the desk clear.
  contactShadow+=oval(p,vec2(307.,693.6),vec2(38.,11.))*.15+oval(p,vec2(995.,693.6),vec2(38.,11.))*.15;
  
 }
 if(coverage<.025)discard;
 vec3 finished=mix(max(col,vec3(0.)),vec3(1.),blank);
 // The cast wash is violet-grey and gently broken by existing pigment.
 float dryBreak=.77+.23*sin(p.x*.083+sin(p.y*.09)*2.);
 finished=mix(finished,finished*vec3(.78,.75,.80),min(.70,contactShadow*dryBreak)*2.);
 if(layerId==10.)finished=studyIconGlaze(vec2(nativeUV.x,1.-nativeUV.y)*vec2(1672.,941.),finished,coverage);

 gl_FragColor=vec4(finished,coverage);
 #include <colorspace_fragment>
}`;
// Separate registered watercolor planes, aligned at rest and spaced in depth.
function groundDepth(y){return cameraDistance*(1.-planeScale(y));}
function objectDepth(id,p){
 if(id==0)return windowFaceDepth(cameraDistance);
 if(id>=8&&id<=10)return windowPaintDepth(id,p,cameraDistance);
 if(id==3)return groundDepth(899);
 if(id==2)return groundDepth(820);
 if(id==5)return groundDepth(794);
 return 0;
}
function updateContacts(){
 for(const [name,x,y] of [['chairContact',350,899],['deskLeftContact',116,823.4],['deskRightContact',1050,823.4],['bedContact',1360,890],['bedFootContact',1195,820],['belongingsContact',805,794]])uniforms[name].value.set(x,y);
}
function alignLayers(){
 for(const mesh of layerMeshes){
  const id=mesh.userData.spec.id;
  const uv=mesh.geometry.attributes.uv,pos=mesh.geometry.attributes.position;
  mesh.position.set(0,0,0);mesh.scale.set(1,1,1);
  for(let i=0;i<pos.count;i++){
   const p={x:uv.getX(i)*1672,y:(1.-uv.getY(i))*941};
   if(id==7){pos.setXYZ(i,...onSupport(p.x,p.y,0,cameraDistance));}
   else{const z=objectDepth(id,p),k=(cameraDistance-z)/cameraDistance;pos.setXYZ(i,(p.x-836)*k,(470.5-p.y)*k,z);}
  }
  pos.needsUpdate=true;mesh.geometry.computeBoundingSphere();
 }
}
function createPaintedLayer(texture,spec){
 const layerUniforms={...uniforms,painting:{value:texture},layerId:{value:spec.id},assetScale:{value:new THREE.Vector2(...spec.scale)},assetOffset:{value:new THREE.Vector2(...spec.offset)}};
 // The watercolor scene has an explicit painter order. A translucent floor
 // must not write depth and erase upright actors' brush tails past their feet.
 const mat=new THREE.ShaderMaterial({uniforms:layerUniforms,transparent:true,depthWrite:false,depthTest:![2,3,5].includes(spec.id),side:THREE.DoubleSide,vertexShader:'varying vec2 vUv;varying vec3 paintWorld;void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.);paintWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}',fragmentShader:fragment});
 const geo=new THREE.PlaneGeometry(1672,941,128,spec.id==9?192:80);
 if(spec.id==7){const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,1.-(685.+(1.-uv.getY(i))*256.)/941.);}
 const mesh=new THREE.Mesh(geo,mat);mesh.position.z=spec.z;mesh.renderOrder=spec.order;mesh.userData.spec=spec;
 const probe=document.createElement('canvas');probe.width=texture.image.width;probe.height=texture.image.height;const ctx=probe.getContext('2d',{willReadFrequently:true});ctx.drawImage(texture.image,0,0);mesh.userData.pixels=ctx.getImageData(0,0,probe.width,probe.height);layerMeshes.push(mesh);scene.add(mesh);
}
function pointerInPainting(e){
 raycaster.setFromCamera(new THREE.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);
 for(const hit of raycaster.intersectObjects(layerMeshes)){
  const spec=hit.object.userData.spec,pixels=hit.object.userData.pixels;if(!pixels)continue;const p=new THREE.Vector2(hit.uv.x*1672,(1-hit.uv.y)*941);
  const x=Math.floor((p.x-spec.offset[0])/spec.scale[0]/1672*pixels.width),y=Math.floor((p.y-spec.offset[1])/spec.scale[1]/941*pixels.height);
  if(x<0||y<0||x>=pixels.width||y>=pixels.height)continue;
  if(pixels.data[(y*pixels.width+x)*4+3]>30)return p;
 }
 return null;
}
function pointerOnPaper(e){raycaster.setFromCamera(new THREE.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);const point=raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,0,1),0),new THREE.Vector3());return point?new THREE.Vector2(point.x+836,470.5-point.y):null;}
const socialItems=STUDY_SILL_ICONS.map(icon=>[icon.id,icon.label,...icon.center]);
const roomUI=createRoomInteractions({contacts:portfolio.contacts,tracks,reduced,onOpen:()=>{post.stop();parallaxTarget.copy(viewTilt);},onLamp:value=>{lamp=value;},lampOn:lamp,getTime:()=>({minutes:minutesInOsaka(runningRoomDate(preview)),live:preview===null}),onTime:minutes=>{preview=minutes===null?null:startTimePreview(minutes);syncTime();}});
const socialButtons=socialItems.map(([id,label,x,y],index)=>{
 const button=document.createElement('button');button.className='social-hit';button.setAttribute('aria-label',label);button.setAttribute('aria-haspopup','dialog');button.title=label;
 button.onpointerenter=()=>post.stop();
 button.onclick=()=>{if(!paintedDesktop.isOpen)roomUI.openContact(id,label,button);};
 roomUI.registerSocial(id,button);
 document.body.append(button);return {button,x,y,index,id};
});
const laptopButton=document.createElement('button');laptopButton.className='laptop-hit';laptopButton.setAttribute('aria-label','Wake laptop and open desktop');laptopButton.setAttribute('aria-haspopup','dialog');laptopButton.hidden=true;
const laptopCaption=document.createElement('span');laptopCaption.className='paint-hit-caption';laptopCaption.textContent='Click to wake';laptopButton.append(laptopCaption);document.body.append(laptopButton);
let laptopFlight=null,laptopView=null,laptopProjection=null,laptopLandscape=null,laptopRoomPose=null,projectedLaptopContour=[],projectedLaptopScreen=[],projectedLaptopCenter=null,laptopAttention=false,laptopFilm=false,restorePaintingResolution=false;
const laptopPortalPointer=new THREE.Vector2();
let laptopKeyboardPortal=false;
const laptopLookTarget=new THREE.Vector3();
const laptopPortal=createPaintedPortal({reduced});
function setPaintingResolution(film){
 const ratio=Math.min(devicePixelRatio,innerWidth<700?1:1.25);if(renderer.getPixelRatio()===ratio)return;
 renderer.setPixelRatio(ratio);const size=renderer.getDrawingBufferSize(new THREE.Vector2());post.resize(size.x,size.y,innerWidth<700);
}
function setRoomViewOffset(amount=1){
 camera.setViewOffset(innerWidth,innerHeight,0,(innerWidth<600?18:35)*amount,innerWidth,innerHeight);
}
function finishLaptopFlight(cancelled=false){
 const flight=laptopFlight;laptopFlight=null;if(flight)flight.resolve({cancelled});
 if(cancelled)laptopPortal.cancel();
}
function approachLaptop({start=performance.now()}={}){
 roomUI.close();post.stop();post.clearFlow();drag=null;if(reduced||!laptopView)return Promise.resolve({cancelled:false});
 laptopRoomPose={position:camera.position.clone(),up:camera.up.clone(),tilt:viewTilt.clone()};
 finishLaptopFlight(true);
 laptopFilm=true;setPaintingResolution(true);document.body.classList.add('laptop-approaching');
 return new Promise(resolve=>{laptopFlight={mode:'enter',start,duration:LAPTOP_TIMING.enter,fromTarget:laptopLookTarget.clone(),from:camera.position.clone(),fromUp:camera.up.clone(),destination:laptopView,resolve};});
}
function retreatFromLaptop({start=performance.now()}={}){
 laptopPortal.finish();if(reduced||!laptopView)return Promise.resolve({cancelled:false});
 finishLaptopFlight(true);
 return new Promise(resolve=>{laptopFlight={mode:'leave',start,duration:LAPTOP_TIMING.leave,fromTarget:laptopLookTarget.clone(),from:camera.position.clone(),fromUp:camera.up.clone(),destination:laptopView,resolve};});
}
const paintedDesktop=createPaintedDesktop({portfolio,reduced,onEnter:approachLaptop,onEntered:()=>laptopPortal.finish(),onLeave:retreatFromLaptop,onExit:()=>{
 finishLaptopFlight(true);laptopFilm=false;restorePaintingResolution=true;laptopView=null;laptopPortal.cancel();
 if(laptopRoomPose){camera.position.copy(laptopRoomPose.position);viewTilt.copy(laptopRoomPose.tilt);parallaxTarget.copy(laptopRoomPose.tilt);laptopRoomPose=null;}
 camera.up.set(0,1,0);camera.lookAt(0,0,0);setRoomViewOffset();document.body.classList.remove('laptop-approaching');post.stop();last=0;
}});
laptopButton.onpointerenter=()=>{laptopKeyboardPortal=false;laptopAttention=true;post.stop();watercolorReveal(laptopCaption,{duration:440,kind:'ink',reduced,seed:12});};
laptopButton.onpointerleave=()=>{laptopAttention=laptopKeyboardPortal||laptopButton.matches(':focus-visible');if(!laptopKeyboardPortal)laptopPortalPointer.set(0,0);};
laptopButton.onpointermove=event=>{
 if(reduced||!projectedLaptopScreen.length)return;
 laptopKeyboardPortal=false;
 const xs=projectedLaptopScreen.map(p=>p[0]),ys=projectedLaptopScreen.map(p=>p[1]);
 const left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left,height=Math.max(...ys)-top;
 laptopPortalPointer.set(THREE.MathUtils.clamp((event.clientX-left)/width*2-1,-1,1),THREE.MathUtils.clamp((event.clientY-top)/height*2-1,-1,1));
};
laptopButton.onfocus=()=>{post.stop();laptopAttention=laptopButton.matches(':focus-visible');if(laptopAttention)watercolorReveal(laptopCaption,{duration:440,kind:'ink',reduced,seed:12});};
laptopButton.onblur=()=>{laptopAttention=false;laptopKeyboardPortal=false;laptopPortalPointer.set(0,0);};
laptopButton.addEventListener('keydown',event=>{
 if(reduced||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
 event.preventDefault();laptopKeyboardPortal=true;laptopAttention=true;
 if(event.key==='ArrowLeft')laptopPortalPointer.x=Math.max(-1,laptopPortalPointer.x-.35);
 if(event.key==='ArrowRight')laptopPortalPointer.x=Math.min(1,laptopPortalPointer.x+.35);
 if(event.key==='ArrowUp')laptopPortalPointer.y=Math.max(-1,laptopPortalPointer.y-.35);
 if(event.key==='ArrowDown')laptopPortalPointer.y=Math.min(1,laptopPortalPointer.y+.35);
});
if(!reduced)laptopButton.setAttribute('aria-description','Wake the display and zoom into the Mac desktop. Press Enter to open.');
laptopButton.onclick=()=>paintedDesktop.open({from:laptopButton.getBoundingClientRect()});
function projectSocials(){const zoom=innerWidth/span.x*camera.zoom;for(const {button,index} of socialButtons){const {x,y}=iconMotion.getPose(index).center,z=objectDepth(10,{x,y}),k=(cameraDistance-z)/cameraDistance;const p=new THREE.Vector3((x-836)*k,(470.5-y)*k,z).project(camera);button.hidden=paintedDesktop.isOpen||Math.abs(p.x)>1||Math.abs(p.y)>1;button.style.left=((p.x+1)*innerWidth/2)+'px';button.style.top=((1-p.y)*innerHeight/2)+'px';button.style.width=Math.max(12,Math.min(40,56*zoom))+'px';button.style.height=Math.max(44,64*zoom)+'px';}}
function projectLaptop(){
 const lid=deskScene?.meshes.find(piece=>piece.name==='Laptop painted lid'),base=deskScene?.meshes.find(piece=>piece.name==='Laptop painted base');if(!lid||!base)return;
 if(!laptopProjection)laptopProjection=createLaptopProjection({THREE,lid,base});
 const sample=laptopProjection.sample(camera,innerWidth,innerHeight);projectedLaptopContour=sample.contour;projectedLaptopScreen=sample.corners;
 if(!laptopView)laptopView=fullLaptopScreenView(THREE,sample.world,camera.fov,camera.aspect);
 const portalPose=laptopLandscape?.getPose?.();
 if(portalPose?.length)laptopButton.dataset.portalPose=JSON.stringify(portalPose);
 paintedDesktop.project({...sample,portalPose,screenLight:Math.pow(.66+.34*uniforms.day.value,1/2.2)});
 projectedLaptopCenter=sample.corners.reduce((center,point)=>[center[0]+point[0]/sample.corners.length,center[1]+point[1]/sample.corners.length],[0,0]);
 if(laptopFlight)laptopFlight.destination=laptopView;
 const x=Math.min(...sample.contour.map(point=>point[0])),y=Math.min(...sample.contour.map(point=>point[1]));
 const w=Math.max(...sample.contour.map(point=>point[0]))-x,h=Math.max(...sample.contour.map(point=>point[1]))-y;
 laptopButton.hidden=w<12||h<12||x>innerWidth||y>innerHeight;laptopButton.style.left=x+'px';laptopButton.style.top=y+'px';laptopButton.style.width=w+'px';laptopButton.style.height=h+'px';
}
function projectHit(button,points,clip){
 if(!points.length)return;
 const xs=points.map(p=>(p.x+1)*innerWidth/2),ys=points.map(p=>(1-p.y)*innerHeight/2);
 const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
 button.hidden=paintedDesktop.isOpen||w<4||x>innerWidth||y>innerHeight||x+w<0||y+h<0;
 button.style.left=x+'px';button.style.top=y+'px';button.style.width=Math.max(24,w)+'px';button.style.height=Math.max(28,h)+'px';
 if(clip)button.style.clipPath=clip;
}
function projectRoomObjects(){
 const lampMesh=deskScene?.meshes.find(mesh=>mesh.name==='Task lamp');
 if(lampMesh){lampMesh.updateWorldMatrix(true,false);const points=Array.from({length:4},(_,i)=>new THREE.Vector3().fromBufferAttribute(lampMesh.geometry.attributes.position,i).applyMatrix4(lampMesh.matrixWorld).project(camera));
 projectHit(roomUI.lamp,points,'polygon(58% 2%,72% 2%,100% 28%,100% 38%,60% 48%,54% 40%,56% 20%,48% 20%,14% 42%,27% 83%,45% 88%,47% 100%,0% 100%,0% 92%,18% 84%,2% 38%,45% 12%,55% 12%)');}
 projectHit(roomUI.radio,[[1028,374],[1166,374],[1166,445],[1028,445]].map(([x,y])=>{const z=objectDepth(10,{x,y}),k=(cameraDistance-z)/cameraDistance;return new THREE.Vector3((x-836)*k,(470.5-y)*k,z).project(camera);}));
 projectHit(roomUI.clock,[[1425,85],[1565,85],[1565,235],[1425,235]].map(([x,y])=>{const z=objectDepth(0,{x,y}),k=(cameraDistance-z)/cameraDistance;return new THREE.Vector3((x-836)*k,(470.5-y)*k,z).project(camera);}), 'ellipse(49% 49% at 50% 50%)');
}
let viewportWidth=0,viewportHeight=0;
function resize(){const w=innerWidth,h=innerHeight,a=w/h;if(viewportWidth===w&&viewportHeight===h)return;viewportWidth=w;viewportHeight=h;span.set(Math.max(1672,941*a),Math.max(941,1672/a));camera.aspect=a;cameraDistance=span.y/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))+100;if(laptopRoomPose)laptopRoomPose.position.set(laptopRoomPose.tilt.x*85,-laptopRoomPose.tilt.y*48,cameraDistance);if(!paintedDesktop.isOpen)camera.position.z=cameraDistance;camera.setViewOffset(w,h,0,paintedDesktop.isOpen?0:(w<600?18:35),w,h);camera.updateProjectionMatrix();alignLayers();deskScene?.resize();exteriorScene?.resize();laptopView=null;projectLaptop();if(paintedDesktop.isOpen&&!laptopFlight&&laptopView){camera.position.copy(laptopView.position);camera.up.copy(laptopView.up);camera.lookAt(laptopView.center);}paintedDesktop.resize();if(latestSun)updateStudyLight({THREE,uniforms,distance:cameraDistance,wallDepth:windowPaneDepth(cameraDistance),sillDepth:windowPaintDepth(10,{x:1274,y:442},cameraDistance),sunAltitude:latestSun.altitude,sunAzimuth:latestSun.azimuth});renderer.setPixelRatio(Math.min(devicePixelRatio,w<700?1:1.25));renderer.setSize(w,h,false);const size=renderer.getDrawingBufferSize(new THREE.Vector2());post.resize(size.x,size.y,w<700);}
addEventListener('resize',resize);resize();
function syncTime(){const date=runningRoomDate(preview),s=sunState(date),palette=createDaylightPalette(THREE,s.altitude);latestSun=s;
 clockMinute=minutesInOsaka(date)+date.getUTCSeconds()/60+date.getUTCMilliseconds()/60000;clockAt=performance.now();uniforms.clockMinutes.value=clockMinute;
 uniforms.day.value=palette.day;uniforms.gold.value=palette.gold;uniforms.night.value=1-palette.day;
 uniforms.brushPhase.value=(minutesInOsaka(date)+date.getUTCSeconds()/60)/1440*Math.PI*2;
 uniforms.morning.value=1-THREE.MathUtils.smoothstep(s.hour,9,12);
 for(const key of ['skyTop','skyHorizon','roomTint','sunColor'])uniforms[key].value.copy(palette[key]);
 exteriorScene?.setCelestial(s,s.moon);
 const solarAltitude=s.altitude*Math.PI/180,solarFacing=(s.azimuth-STUDY_WINDOW_AZIMUTH)*Math.PI/180;
 uniforms.strength.value=THREE.MathUtils.smoothstep(s.altitude,0,8)*(.32+.68*Math.max(0,Math.sin(solarAltitude)))*Math.max(0,Math.cos(solarFacing));
 updateStudyLight({THREE,uniforms,distance:cameraDistance,wallDepth:windowPaneDepth(cameraDistance),sillDepth:windowPaintDepth(10,{x:1274,y:442},cameraDistance),sunAltitude:s.altitude,sunAzimuth:s.azimuth});
 uniforms.sunElevation.value=s.altitude;uniforms.moonElevation.value=s.moon.altitude;
 roomUI.updateClock();scene.background=new THREE.Color('#ffffff');
}
const keyboardBrush=new THREE.Vector2(836,540);
canvas.addEventListener('keydown',e=>{
 const step={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
 if(!step||roomUI.isOpen||paintedDesktop.isOpen)return;e.preventDefault();
 if(e.shiftKey&&!reduced){const now=performance.now();post.move(keyboardBrush.x,keyboardBrush.y,now);keyboardBrush.x=THREE.MathUtils.clamp(keyboardBrush.x+step[0]*24,200,1450);keyboardBrush.y=THREE.MathUtils.clamp(keyboardBrush.y+step[1]*24,140,800);post.move(keyboardBrush.x,keyboardBrush.y,now+16);}
 else{post.stop();parallaxTarget.x=THREE.MathUtils.clamp(parallaxTarget.x+step[0]*.24,-1,1);parallaxTarget.y=THREE.MathUtils.clamp(parallaxTarget.y+step[1]*.24,-1,1);}
});
canvas.addEventListener('pointermove',e=>{if(drag){if(!reduced)parallaxTarget.set(THREE.MathUtils.clamp(drag.viewX+(e.clientX-drag.startX)/innerWidth*2,-1,1),THREE.MathUtils.clamp(drag.viewY+(e.clientY-drag.startY)/innerHeight*2,-1,1));post.stop();return;}if(roomUI.isOpen||paintedDesktop.isOpen){post.stop();return;}if(!reduced)parallaxTarget.set(e.clientX/innerWidth*2-1,e.clientY/innerHeight*2-1);if(reduced){post.stop();return;}const p=pointerOnPaper(e);if(p)post.move(p.x,p.y,performance.now());else post.stop();});
canvas.addEventListener('pointerleave',()=>{if(!laptopButton.matches(':hover')&&!socialButtons.some(item=>item.button.matches(':hover')))parallaxTarget.set(0,0);post.stop();});canvas.addEventListener('pointerdown',e=>{drag={startX:e.clientX,startY:e.clientY,viewX:parallaxTarget.x,viewY:parallaxTarget.y};canvas.setPointerCapture(e.pointerId);post.stop();});
canvas.addEventListener('pointerup',e=>{if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(drag&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<8&&!reduced){const point=pointerInPainting(e);if(point&&Math.hypot((point.x-1515)/119,(point.y-594)/65)<1)catReactionAt=elapsed;}drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;post.stop();});
setInterval(syncTime,1000);syncTime();
function draw(now){
 requestAnimationFrame(draw);if(!ready||document.hidden)return;
 if(paintedDesktop.isSettled&&!laptopFlight){last=now;return;}
 if(last&&now-last<(laptopFlight?1000/60:1000/30)-1)return;
 const dt=Math.min(.05,last?(now-last)/1000:.016);last=now;
 uniforms.lamp.value+=(Number(lamp)-uniforms.lamp.value)*(1-Math.exp(-dt*10));
 if(reduced)viewTilt.copy(parallaxTarget);else viewTilt.lerp(parallaxTarget,1.-Math.exp(-dt*4.));
 if(laptopFlight){
  const phase=THREE.MathUtils.clamp((now-laptopFlight.start)/laptopFlight.duration,0,1);
  const entering=laptopFlight.mode==='enter',zoom=sampleLaptopTransition(laptopFlight.mode,now-laptopFlight.start).camera,view=laptopFlight.destination;
  const end=entering?view.position:(laptopRoomPose?.position||new THREE.Vector3(viewTilt.x*85,-viewTilt.y*48,cameraDistance));
  {
   const a=laptopFlight.from.clone().sub(view.center),b=end.clone().sub(view.center),radius=Math.exp(THREE.MathUtils.lerp(Math.log(a.length()),Math.log(b.length()),zoom));
   camera.position.copy(a.normalize().lerp(b.normalize(),zoom).normalize().multiplyScalar(radius).add(view.center));
  }
  camera.up.copy(laptopFlight.fromUp).lerp(entering?view.up:new THREE.Vector3(0,1,0),zoom).normalize();
  setRoomViewOffset(entering?1-zoom:zoom);
  // Keep the aperture moving toward the eye as distance shrinks. A linear
  // look-at target would let it slip sideways during the logarithmic dolly.
  const roomEye=laptopRoomPose?.position||laptopFlight.from;
  const roomRadius=roomEye.distanceTo(view.center),radius=camera.position.distanceTo(view.center);
  const roomFraction=Math.min(1,radius/roomRadius)*(entering?1-zoom:zoom);
  laptopLookTarget.copy(entering?view.center:laptopFlight.fromTarget).multiplyScalar(1-roomFraction);camera.lookAt(laptopLookTarget);
 }else if(!paintedDesktop.isOpen){
  camera.position.set(viewTilt.x*85,-viewTilt.y*48,cameraDistance);camera.up.set(0,1,0);laptopLookTarget.set(0,0,0);camera.lookAt(laptopLookTarget);
 }
 if(restorePaintingResolution){restorePaintingResolution=false;setPaintingResolution(false);}
 camera.updateMatrixWorld();uniforms.viewPosition.value.copy(camera.position);uniforms.wallDepth.value=windowPaneDepth(cameraDistance);uniforms.wallRegistration.value=(cameraDistance-uniforms.wallDepth.value)/cameraDistance;uniforms.windowFaceDepth.value=windowFaceDepth(cameraDistance);uniforms.windowFaceRegistration.value=(cameraDistance-uniforms.windowFaceDepth.value)/cameraDistance;updateContacts();post.material.uniforms.waterInverseView.value.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).invert();if(!reduced)elapsed+=dt;uniforms.time.value=elapsed;iconMotion.update(dt);uniforms.clockMinutes.value=clockMinute+(now-clockAt)/60000;uniforms.catReaction.value=catReactionAt<0?-100:elapsed-catReactionAt;laptopLandscape?.setOccluded(paintedDesktop.isSettled);laptopLandscape?.update(now,{pointer:laptopPortalPointer.toArray(),hover:laptopAttention});projectSocials();projectLaptop();projectRoomObjects();roomUI.position();if(laptopFlight){
 const phase=THREE.MathUtils.clamp((now-laptopFlight.start)/laptopFlight.duration,0,1);
 laptopPortal.finish();
 if(phase>=1)finishLaptopFlight();
 }else if(laptopAttention&&!paintedDesktop.isOpen)laptopPortal.frame({contour:projectedLaptopContour,progress:1,opacity:1});else laptopPortal.finish();
 post.update(dt,now,{camera:{zoom:1,position:{x:0,y:0}},viewWidth:span.x,viewHeight:span.y,day:uniforms.day.value});post.begin();renderer.render(scene,camera);post.finish();}
requestAnimationFrame(draw);
try{
 const loader=new THREE.TextureLoader(),textureLoads=new Map();
 const loadLayer=file=>{if(!textureLoads.has(file))textureLoads.set(file,loader.loadAsync('/assets/painted/'+file));return textureLoads.get(file);};
 const [textures,pigment,cloud,dial,deskTexture,outsideTexture]=await Promise.all([
  Promise.all(layerSpecs.map(spec=>loadLayer(spec.file))),
  loader.loadAsync('/assets/painted/pigment-wash.webp'),loader.loadAsync('/assets/painted/gestural-cloud-bank.webp'),loader.loadAsync('/assets/painted/roman-brush-dial.webp'),loader.loadAsync('/assets/painted/desk-level-four-legs-v7.webp'),loader.loadAsync('/assets/painted/layer-outside.webp')
 ]);
 for(const texture of [...textures,cloud,dial,deskTexture,outsideTexture]){texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}
 uniforms.clockPaint.value=dial;
 pigment.wrapS=pigment.wrapT=THREE.MirroredRepeatWrapping;post.setPigment(pigment);
 textures.forEach((texture,i)=>createPaintedLayer(texture,layerSpecs[i]));
 deskScene=createStudyDesk({THREE,scene,uniforms,texture:deskTexture,getDistance:()=>cameraDistance});
 laptopLandscape=createLaptopLandscapeSurface({THREE,lid:deskScene.meshes.find(piece=>piece.name==='Laptop painted lid'),landscape:paintedDesktop.landscape,uniforms,camera,initialPower:0,getHomeEye:()=>new THREE.Vector3(0,0,cameraDistance),reduced});
 exteriorScene=createStudyExterior({THREE,scene,uniforms,texture:outsideTexture,cloud,wallTexture:textures[0],getDistance:()=>cameraDistance,getWallDepth:()=>windowPaneDepth(cameraDistance)});
 // Optional local visual review: isolate a paint family without changing
 // its registration, lighting, wind, or camera controls.
 const auditLayer=new URLSearchParams(location.search).get('auditLayer');
 const auditGroups={wall:[0],floor:[7],frame:[8],sill:[9],windowObjects:[10],furniture:[2,3,5]};
 const exteriorPiece=scene.children.some(mesh=>mesh.userData.exteriorKind===auditLayer);
 if(auditGroups[auditLayer]||auditLayer==='desk'||auditLayer==='exterior'||exteriorPiece){
  for(const mesh of scene.children){
   mesh.visible=auditLayer==='desk'?deskScene.meshes.includes(mesh):auditLayer==='exterior'?Boolean(mesh.userData.exteriorKind):exteriorPiece?mesh.userData.exteriorKind===auditLayer:auditGroups[auditLayer].includes(mesh.userData.spec?.id);
  }
 }
 alignLayers();syncTime();ready=true;performance.mark('room-ready');document.querySelector('#status').hidden=true;
}catch(error){document.querySelector('#status').textContent='The painting could not load. Please reload.';console.error(error);}
