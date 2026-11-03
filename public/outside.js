import * as THREE from 'three';
import { vertex, motion } from './paint-shaders.js';
import { CAMERA } from './painted-geometry.js';
import { createRoomLighting } from './room-lighting.js';
export const roomLighting=createRoomLighting(CAMERA);

// Light transport data, not a second painted night scene. Integrate emitted
// window energy vertically so sparse little panes make readable river streaks.
export function createReflectionColumns(image){
 const width=512,height=256,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,width,height);
 const pixels=context.getImageData(0,0,width,height).data,energy=new Float32Array(width*3),data=new Uint8Array(width*4);
 const top=Math.floor(height*.28),bottom=Math.floor(height*.55);
 for(let x=0;x<width;x++)for(let y=top;y<bottom;y++)for(let c=0;c<3;c++){
  const v=pixels[(y*width+x)*4+c]/255;energy[x*3+c]+=v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);
 }
 for(let x=0;x<width;x++){
  for(let c=0;c<3;c++){let sum=0;for(let d=-3;d<=3;d++)sum+=energy[Math.max(0,Math.min(width-1,x+d))*3+c]*(4-Math.abs(d));data[x*4+c]=Math.round(Math.min(1,Math.sqrt(sum/16/(bottom-top))*1.9)*255);}
  data[x*4+3]=255;
 }
 const texture=new THREE.DataTexture(data,width,1,THREE.RGBAFormat);texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;return texture;
}

// The city never changes plates. Sky light, clouds, the solar disc and the
// river have independent continuous motion, behind one transparent room.
export const outsideFragment=`
varying vec2 vUv;
uniform sampler2D paperMap;uniform sampler2D pigmentMap;uniform sampler2D skyWashMap;uniform sampler2D cityMap;uniform sampler2D cloudMap;uniform sampler2D cityLights;uniform sampler2D lightColumns;
uniform float time;uniform float day;uniform float gold;uniform float sunVisible;
uniform vec2 sunPixel;uniform vec3 skyTop;uniform vec3 skyHorizon;uniform vec3 sunColor;
uniform vec2 moonPixel;uniform float moonVisible;uniform float moonPhase;uniform float night;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 vec2 p=vec2(vUv.x,1.-vUv.y)*vec2(1672.,941.);
 // Exponential atmosphere has no clamped horizontal endpoint. Fine spatial
 // dithering prevents dark mobile displays from exposing gradient bands.
 float horizon=1.-exp(-max(p.y,0.)/260.);
 vec3 col=mix(skyTop,skyHorizon,pow(horizon,1.7));
 // Native painting layers follow the sky while solar color
 // and the existing cloud/city motion remain continuous.
 float paper=texture2D(paperMap,p/512.).g;
 vec3 skyWash=texture2D(skyWashMap,vec2(p.x/1672.,1.-p.y/650.)).rgb;
 float washValue=dot(skyWash,vec3(.30,.50,.20));
 float pigmentDensity=clamp((.985-washValue)/.23,0.,1.);
 // Preserve the native wash's value range in moonlight, where multiplying
 // by a dark blue alone otherwise hides its transparent pigment deposits.
 col*=mix(mix(1.42,.34,pigmentDensity),mix(1.16,.58,pigmentDensity),day);
 col+=(skyWash-vec3(washValue))*mix(.24,.40,day);
 float nativeWash=texture2D(pigmentMap,p/620.).g;
 float nativeTooth=texture2D(pigmentMap,p/185.).g;
 col*=clamp(1.+(nativeWash-.70)*.24+(nativeTooth-.70)*.30,.84,1.12);
 col*=1.+(paper-.954)*1.2;
 float sd=length(p-sunPixel);
 float disc=(1.-smoothstep(11.5,16.5,sd+(nativeWash-.70)*10.+(paper-.954)*18.))*sunVisible;
 float glow=exp(-sd*mix(.022,.010,gold))*sunVisible;
 float airGlow=exp(-sd*.005)*sunVisible*gold;
 col+=sunColor*(disc*1.3+glow*(.23+gold*.22)+airGlow*.085);
 // A small moon follows Osaka's actual lunar position and phase.
 vec2 mp=(p-moonPixel)/11.;float md=length(mp);
 float moonDisc=1.-smoothstep(.92,1.,md);
 float phaseSide=moonPhase<.5?1.:-1.;float lit=cos(moonPhase*6.2831853);
 float terminator=sqrt(max(0.,1.-mp.y*mp.y))*lit;
 float moonLight=smoothstep(terminator-.045,terminator+.045,mp.x*phaseSide);
 col+=vec3(.57,.66,.83)*moonDisc*moonLight*moonVisible*night;
 col+=vec3(.07,.095,.16)*exp(-md*.9)*moonVisible*night;
 vec2 starCell=floor(p/12.);vec2 starPos=fract(p/12.);
 float stars=step(.993,hash(starCell))*(1.-smoothstep(.02,.10,length(starPos-vec2(.45,.45))))*(1.-day);
 col+=vec3(.68,.75,.94)*stars*(.75+.25*sin(time*.7+hash(starCell)*20.));
 // Independent alpha-painted clouds drift across open sky. No luminance
 // extraction, mirrored sky tiles, or enlarged fractal silhouettes.
 for(int i=0;i<7;i++){
   float n=float(i),cell=mod(n,3.);
   float w=300.+hash(vec2(n,4.))*230.;
   float cx=mod(90.+n*344.+time*(2.1+hash(vec2(n,9.))*1.5),2408.)-340.;
   float cy=40.+hash(vec2(n,2.))*250.;
   vec2 q=(p-vec2(cx,cy))/vec2(w,w*.34)+.5;
   if(q.x>0.&&q.x<1.&&q.y>0.&&q.y<1.){
    float start=cell<.5?36.:(cell<1.5?42.:40.);
    float top=cell<.5?244.:(cell<1.5?234.:208.);
    float height=cell<1.5?236.:266.;
    vec2 atlas=vec2((cell*724.+start+q.x*662.)/2172.,1.-(top+q.y*height)/724.);
    vec4 c=texture2D(cloudMap,atlas);
    float a=c.a*mix(.36,.8,day);
    float cloudDensity=texture2D(pigmentMap,atlas*vec2(8.,3.)).g;
    vec2 cloudTexel=vec2(1.7/2172.,1.7/724.);
    float cloudEdge=(texture2D(cloudMap,atlas+vec2(cloudTexel.x,0.)).a+texture2D(cloudMap,atlas-vec2(cloudTexel.x,0.)).a+texture2D(cloudMap,atlas+vec2(0.,cloudTexel.y)).a+texture2D(cloudMap,atlas-vec2(0.,cloudTexel.y)).a)*.25;
    a*=mix(.72,1.,smoothstep(.10,.85,cloudEdge))*clamp(.92+(cloudDensity-.70)*1.2,.67,1.02);
    vec3 cloudTint=mix(vec3(.115,.15,.23),mix(vec3(1.,1.,1.),vec3(1.06,.90,.78),gold*.60),day);
    vec3 cloudPaint=c.rgb*(1.+(cloudDensity-.70)*.22);
    col=mix(col,cloudPaint*cloudTint,a);
   }
 }
 vec2 cityUV=vec2((p.x-210.)/1100.,(p.y-110.)/550.);
 if(cityUV.x>=0.&&cityUV.x<=1.&&cityUV.y>=0.&&cityUV.y<=1.){
   float water=smoothstep(.548,.598,cityUV.y);
   vec2 q=cityUV;
   float depth=clamp((q.y-.55)/.32,0.,1.);
   // Flow the painted reflections sideways. Vertical movement stays tiny,
   // preserving the river's flat perspective and unbroken shoreline.
   q.x+=water*(sin(q.y*185.-time*.95)*.0022+sin(q.y*71.+time*.46)*.0014)*(.45+depth);
   q.y+=water*sin(q.y*127.-time*.75+q.x*5.)*.00032*(.25+depth);
   vec4 city=texture2D(cityMap,vec2(q.x,1.-q.y));
   // Keep the native paint coverage, including dilute skyline margins.
   float alpha=city.a;
   // Unlit land receives much less night light than the reflecting river.
   // Keep the separate emissive window pass bright; the ridge itself is dark.
   vec3 nightTerrain=mix(vec3(.062,.077,.103),vec3(.12,.165,.255),water);
   vec3 goldenTerrain=mix(vec3(.99,.83,.78),vec3(1.08,.93,.82),water);
   vec3 tint=mix(nightTerrain,mix(vec3(.96,1.,1.04),goldenTerrain,gold*.72),day);
   // The smaller pigment deposits remain readable in dusk and moonlight.
   // Coordinates follow the actual paint flow, rather than sliding over it.
   float cityWash=texture2D(pigmentMap,vec2(q.x*4.5,q.y*3.9)).g;
   float cityTooth=texture2D(pigmentMap,vec2(q.x*15.,q.y*10.)).g;
   vec3 cityColor=city.rgb*tint*clamp(1.+(cityWash-.70)*.32+(cityTooth-.70)*.28,.84,1.15);
   // Short horizontal glints follow the light. Nothing draws a wave lattice
   // over the water: highlights are broken by painted pigment and local gaps.
   float spread=mix(18.,155.,clamp((p.y-400.)/280.,0.,1.))*(1.+gold*.70);
   float glint=exp(-pow((p.x-sunPixel.x)/spread,2.))*water*sunVisible;
   // Extract irregular wet ridges from the actual river brushwork. Their
   // movement comes from q above, so glints never draw a regular stripe comb.
   float riverPigment=texture2D(pigmentMap,vec2(q.x*2.1+time*.004,q.y*5.3)).g;
   float riverValue=dot(city.rgb,vec3(.3,.5,.2));
   float adjacentValue=dot(texture2D(cityMap,vec2(q.x,1.-q.y-.0045)).rgb,vec3(.3,.5,.2));
   float line=smoothstep(.009,.12,riverValue-adjacentValue+.018);
   float gaps=smoothstep(.48,.77,riverPigment);
   float pigment=smoothstep(.18,.58,dot(city.rgb,vec3(.3,.5,.2)));
   // Reflection follows the actual sun column and remains broken by ripples.
   // Solar reflection follows painted ridges without an extra smooth gold bed.
   cityColor+=sunColor*glint*line*gaps*(.18+gold*.28);
   cityColor+=vec3(.055,.075,.08)*water*line*gaps*pigment*day;
   vec2 lampUV=vec2(cityUV.x,1.-cityUV.y);
   vec3 lamps=texture2D(cityLights,lampUV).rgb*.38;
   lamps+=(texture2D(cityLights,lampUV+vec2(.0011,0.)).rgb+texture2D(cityLights,lampUV-vec2(.0011,0.)).rgb+texture2D(cityLights,lampUV+vec2(0.,.0022)).rgb+texture2D(cityLights,lampUV-vec2(0.,.0022)).rgb)*.155;
   lamps*=clamp(.55+cityTooth*.58,.70,1.03);
   float building=1.-smoothstep(.54,.59,cityUV.y);
   float stagger=hash(floor(cityUV*vec2(320.,120.)));
   float on=smoothstep(stagger*.32,stagger*.32+.55,night);
   // The native atlas contains dilute warm brush ends; keep those faint
   // deposits instead of thresholding them back into identical rectangles.
   cityColor+=lamps*vec3(.86,.75,.56)*building*on*1.20;
   // Mirror the actual light pass into the water; small vertical blur taps
   // stretch windows into soft reflections, interrupted by horizontal ripples.
   if(water>.001&&night>.001){
    float reflectedY=.56-(q.y-.56)*.82;
    vec3 reflection=vec3(0.);
    for(int j=0;j<7;j++){
     float offset=(float(j)-3.)*.007;
     float dx=sin(p.y*.08-time*.7+float(j))*.0015;
     reflection+=texture2D(cityLights,vec2(q.x+dx,1.-reflectedY-offset)).rgb;
    }
    // Average these seven samples instead of amplifying their combined glow.
    reflection/=7.;
    cityColor+=reflection*vec3(1.,.62,.35)*.36*water*night*(.16+.84*line*gaps)*exp(-depth*1.1);
    // The locally reflected painted windows above carry night light.
    // Avoid a second full-height column field flattening the river wash.
   }
   float moonReflection=exp(-pow((p.x-moonPixel.x)/(spread*.8),2.))*water*moonVisible*night;
   cityColor+=vec3(.40,.55,.78)*moonReflection*line*gaps*.16;
   col=mix(col,cityColor,alpha);
 }
 col+=vec3((hash(gl_FragCoord.xy)-.5)/1500.);
 gl_FragColor=vec4(max(col,vec3(0.)),1.);
 #include <colorspace_fragment>
}`;

export const roomFragment=`
${motion}
${roomLighting.glsl}
varying vec2 vUv;

uniform sampler2D uWatercolorRoom;
uniform vec3 roomTint;uniform float lampPower;uniform float hoverPower;
uniform vec2 hoverCenter;uniform vec2 hoverSize;
uniform vec2 solarPoint;uniform float sunStrength;uniform float sunWarmth;
float leafMatteQuad(vec2 p,vec2 a,vec2 b,vec2 c,vec2 d){
 vec2 ab=b-a,bc=c-b,cd=d-c,da=a-d;
 float s=min(min(ab.x*(p.y-a.y)-ab.y*(p.x-a.x),bc.x*(p.y-b.y)-bc.y*(p.x-b.x)),min(cd.x*(p.y-c.y)-cd.y*(p.x-c.x),da.x*(p.y-d.y)-da.y*(p.x-d.x)));
 return step(0.,s);
}

void main(){
 vec2 p=vec2(vUv.x,1.-vUv.y);vec2 sampleUV=roomPaintedUV(p);
 vec4 room=roomSample(sampleUV);
 // Preserve the preferred version's corrected glass and object coverage.
 // The local native brush refinements supply independent painted color.
 vec3 watercolor=texture2D(uWatercolorRoom,vec2(sampleUV.x,1.-sampleUV.y)).rgb;
 vec2 artPixel=p*ROOM_PX;
 // Static architectural repair: continue the neighboring painted lower rail
 // across the mullion end. Source x=625..682; align the painted upper and lower rail edges.
 float jointTop=478.0-(artPixel.x-560.)*.042;
 float jointX=smoothstep(553.,557.,artPixel.x)*(1.-smoothstep(606.,610.,artPixel.x));
 float jointY=smoothstep(jointTop-.6,jointTop+.6,artPixel.y)*(1.-smoothstep(509.,512.,artPixel.y));
 float jointRailOffset=-3.-smoothstep(480.,505.,artPixel.y);
 vec4 jointRail=roomSample((artPixel+vec2(72.,jointRailOffset))/ROOM_PX);
 room=mix(room,jointRail,jointX*jointY);
 vec2 watercolorJoint=(artPixel+vec2(72.,jointRailOffset))/ROOM_PX;
 watercolor=mix(watercolor,texture2D(uWatercolorRoom,vec2(watercolorJoint.x,1.-watercolorJoint.y)).rgb,jointX*jointY);
 vec3 watercolorDelta=watercolor-room.rgb;
 float watercolorMatte=0.;

 // White was reserved only for the open glass in this clean painted plate.
 // Frame geometry and the opaque foreground are never deformed or crossfaded.
 float glassZone=step(250.,artPixel.x)*(1.-step(1264.,artPixel.x))*(1.-step(499.,artPixel.y));
 float white= min(room.r,min(room.g,room.b));
 float a=1.-glassZone*smoothstep(.84,.965,white);
 // Conservative inner glass apertures; keep painted frame and sill opaque.
 float paneLeft=step(268.,artPixel.x)*(1.-step(559.,artPixel.x))*(1.-step(mix(486.,476.,(artPixel.x-268.)/291.),artPixel.y));
 float paneMiddle=step(607.,artPixel.x)*(1.-step(927.,artPixel.x))*step(mix(-5.,24.,(artPixel.x-607.)/320.),artPixel.y)*(1.-step(mix(481.,471.,(artPixel.x-607.)/320.),artPixel.y));
 float paneRight=step(974.,artPixel.x)*(1.-step(1244.,artPixel.x))*step(mix(32.,65.,(artPixel.x-974.)/270.),artPixel.y)*(1.-step(mix(469.,457.,(artPixel.x-974.)/270.),artPixel.y));
 float glassInterior=max(paneLeft,max(paneMiddle,paneRight));
 // Foreground pot, books and paper retain their original pigment/coverage.
 float foregroundGuard=max(step(925.,artPixel.x)*(1.-step(1040.,artPixel.x))*step(422.,artPixel.y),step(1015.,artPixel.x)*(1.-step(1245.,artPixel.x))*step(410.,artPixel.y));
 float lampUnderside=(1.-step(321.,artPixel.x))*step(403.+(320.-artPixel.x)*.13,artPixel.y);
 foregroundGuard=max(foregroundGuard,lampUnderside);
 // The lamp keeps its local matte correction; foliage is recovered below.
 float plantRim=0.;
 float lampRim=step(268.,artPixel.x)*(1.-step(322.,artPixel.x))*step(335.,artPixel.y)*(1.-step(423.,artPixel.y));
 float unmatte=glassInterior*(1.-foregroundGuard)*max(plantRim,lampRim);
 a=mix(a,1.-smoothstep(.45,.965,white),unmatte);
 room.rgb=mix(room.rgb,clamp((room.rgb-vec3(1.-a))/max(a,.001),0.,1.),unmatte);
 watercolorMatte=max(watercolorMatte,unmatte);
 // The native center-plant repaint uses a white key only in this cleared
 // window region. Match the Photopea cleanup selection and protect the same
 // expanded book and pot quads; the checkpoint cannot define its new leaves.
 float nativeCenterPlant=step(1030.,artPixel.x)*(1.-step(1232.,artPixel.x))*step(280.,artPixel.y)*(1.-step(438.,artPixel.y));
 if(nativeCenterPlant>.5){
  float books=leafMatteQuad(artPixel,vec2(1022.,408.),vec2(1118.,405.),vec2(1151.,534.),vec2(1024.,540.));
  float potBody=leafMatteQuad(artPixel,vec2(1123.,433.),vec2(1180.,434.),vec2(1170.,524.),vec2(1138.,524.));
  float potBack=leafMatteQuad(artPixel,vec2(1142.,423.),vec2(1181.,426.),vec2(1178.,443.),vec2(1138.,440.));
  nativeCenterPlant*=glassInterior*(1.-max(books,max(potBody,potBack)));
 }

 // Recover white-background antialiasing around the dark pens/scissors only.
 // Restriction to the true glass aperture preserves the can, frame and desk.
 if(artPixel.x>268.&&artPixel.x<323.&&artPixel.y>440.&&artPixel.y<491.){
  float pale=min(room.r,min(room.g,room.b)),nearInk=0.,nearWhite=smoothstep(.18,.50,pale);
  for(int i=0;i<8;i++){
   float ang=float(i)*.78539816339;vec3 n=roomSample((artPixel+vec2(cos(ang),sin(ang))*1.7)/ROOM_PX).rgb;
   nearInk=max(nearInk,1.-smoothstep(.055,.16,max(n.r,max(n.g,n.b))));
   nearWhite=max(nearWhite,smoothstep(.18,.50,min(n.r,min(n.g,n.b))));
  }
  float edge=nearInk*nearWhite*glassInterior*smoothstep(.05,.18,pale);
  float coverage=clamp((1.-pale)/.97,0.,1.);
  vec3 ink=clamp((room.rgb-vec3(1.-coverage))/max(coverage,.001),0.,1.);
  room.rgb=mix(room.rgb,ink,edge);a=mix(a,coverage,edge);
  watercolorMatte=max(watercolorMatte,edge);
 }
 // Recolor recovered ink as ink: subtracting a white-composited color delta
 // from it produces black rims. Coverage still comes from the checkpoint.
 vec3 watercolorRatio=clamp(watercolor/max(watercolor-watercolorDelta,vec3(.025)),vec3(.65),vec3(1.6));
 room.rgb=mix(clamp(room.rgb+watercolorDelta,0.,1.),clamp(room.rgb*watercolorRatio,0.,1.),watercolorMatte);
 // Matte recovery belongs only to translucent edge pixels. Applying its
 // clamped color ratio to opaque paint split the lamp at the glass boundary.
 room.rgb=mix(room.rgb,watercolor,watercolorMatte*smoothstep(.94,.999,a));
 // Recover coverage and unmatte pigment directly from the new native paint.
 // The minimum linear pigment channel is approximately .10. Pure white gives
 // zero coverage; unpremultiplying removes the reserved paper at brush edges.
 // No neighbor sampling spreads the old soft plant or its pale halo back in.
 if(nativeCenterPlant>.5){
  float nativeWhite=min(watercolor.r,min(watercolor.g,watercolor.b));
  float nativeAlpha=clamp((1.-nativeWhite)/.90,0.,1.);
  room.rgb=clamp((watercolor-vec3(1.-nativeAlpha))/max(nativeAlpha,.0001),0.,1.);
  a=nativeAlpha;
 }
 vec3 col=room.rgb*roomTint;
 // Ambient daylight already comes from roomTint; registered direct light
 // and its object/frame shadows are applied once by applyRoomLighting below.
 col=applyRoomLighting(col,artPixel);
 float lamp=exp(-3.*dot((p-vec2(.215,.625))/vec2(.17,.22),(p-vec2(.215,.625))/vec2(.17,.22)));
 col+=room.rgb*vec3(1.,.60,.27)*lampPower*lamp*.75;
 // Visible source sits inside the existing shade; the same damped lamp power
 // drives the painted bulb and its small warm halo, including daytime use.
 vec2 bulbD=artPixel-vec2(246.,418.);
 vec2 bulbQ=vec2(dot(bulbD,vec2(.978,-.208)),dot(bulbD,vec2(.208,.978)));
 float bulbCore=exp(-2.*dot(bulbQ/vec2(9.,3.2),bulbQ/vec2(9.,3.2)));
 float bulbHalo=exp(-2.*dot(bulbQ/vec2(27.,9.),bulbQ/vec2(27.,9.)));
 float bulbOn=smoothstep(.005,.08,lampPower);
 col=mix(col,vec3(1.2,.94,.58),bulbCore*.90*bulbOn);
 col+=vec3(1.,.58,.20)*bulbHalo*bulbOn*(.04+.08*lampPower);
 float hover=exp(-2.8*dot((p-hoverCenter)/hoverSize,(p-hoverCenter)/hoverSize));
 col+=vec3(.48,.34,.14)*hover*hoverPower*.08;
 gl_FragColor=vec4(max(col,vec3(0.)),a);
 #include <colorspace_fragment>
}`;

export function paintedLayer(fragment,uniforms,z,{transparent=false}={}){
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1672,941),new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms,transparent,depthWrite:!transparent}));
 mesh.position.z=z;mesh.renderOrder=z;return mesh;
}
