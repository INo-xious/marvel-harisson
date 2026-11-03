import * as THREE from 'three';

const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
// RG stores signed flow around byte128, B water, A the fading high-water mark
// of the stain. A compact room-space field means a wet mark stays on the paper
// during camera movement. Flow is in art units per second (1 = page height), so
// the brush stays round on the wide page.
export const wetPaintFragment=`
varying vec2 vUv;
uniform sampler2D previous,pigment;
uniform vec2 texel,pointerFrom,pointerTo;
uniform float dt,deposit,span,reset,ebb;
const float neutral=128./255.;
const vec2 aspect=vec2(1672./941.,1.);
float capsule(vec2 p,vec2 a,vec2 b,out float t){vec2 ab=b-a;t=clamp(dot(p-a,ab)/max(dot(ab,ab),.0000001),0.,1.);return length(p-a-ab*t);}
void main(){
 if(reset>.5){gl_FragColor=vec4(neutral,neutral,0.,0.);return;}
 vec2 q=clamp(vUv-(texture2D(previous,vUv).rg-neutral)/aspect*dt,texel,1.-texel);
 vec4 c=texture2D(previous,q),e=texture2D(previous,q+vec2(texel.x,0.)),w=texture2D(previous,q-vec2(texel.x,0.)),n=texture2D(previous,q+vec2(0.,texel.y)),s=texture2D(previous,q-vec2(0.,texel.y)),m=(e+w+n+s)*.25;
 vec2 page=vUv*vec2(1672.,941.);
 float paper=texture2D(pigment,page/97.).g,tooth=clamp((paper-.71)*9.+.5,0.,1.),fibre=clamp((texture2D(pigment,page/37.+.31).g-.71)*9.+.5,0.,1.);
 // Wet paint is viscous: momentum smooths sideways and lingers while the paper is wet.
 vec2 v=(mix(c.rg,m.rg,.24)-neutral)*exp(-dt*mix(7.,2.8,c.b));
 // Eddies: the flow turns with its own spin (cells are 1/180 page), so a
 // stroke's wake curls back on both sides, and it meanders over the paper's
 // broad mottling instead of running straight.
 float spin=((e.g-w.g)-(n.r-s.r))*90.,mottle=texture2D(pigment,page/353.+.13).g-.71;
 v+=vec2(-v.y,v.x)*dt*(spin*.6+mottle*15.*c.b);
 // Water wicks along the tooth, so the wet margin grows ragged instead of round.
 float wet=max(0.,mix(c.b,m.b,min(1.,dt*(.8+4.*tooth)))*exp(-dt*.42)-dt*.035);
 // The high-water mark outlasts the water: it pins the tide line and holds the paler patch.
 float stain=c.a*exp(-dt*.25);
 #ifdef BYTE_FIELDS
 // 8-bit fields round a slow decay back to the same byte; a linear floor keeps them drying.
 wet=max(0.,wet-dt*.07);stain=max(0.,stain-dt*.07);
 #endif
 // The ease-out before the passes stop drains the field itself, so a later
 // stroke brings fresh water without reviving a mark that has already dried.
 v*=ebb;wet*=ebb;stain*=ebb;
 vec2 a=pointerFrom*aspect,b=pointerTo*aspect,stroke=(b-a)/span;
 float fast=smoothstep(.25,1.6,length(stroke)),t;
 float reach=capsule(vUv*aspect,a,b,t);
 // A loaded wash brush: slow strokes pool into a wide puddle, quick ones thin
 // into a streak. Even along the whole segment, so a quick stroke never beads.
 float radius=mix(.075,.055,fast)*(.8+.4*fibre);
 float brush=(1.-smoothstep(radius*.2,radius,reach+(tooth-.5)*radius*.45+(fibre-.5)*radius*.2))*deposit;
 // The bristles carry the wet paint along and a little wells out round both
 // sides: a forward stream with a trace of a moving dipole's sideways swirl, but
 // never back against the stroke, so the flanks feather forward instead of
 // folding a crossed shape into an S. The stream is as wide as the brush; the
 // cap keeps a quick stroke's shove as long as a slow one's carry.
 vec2 o=vUv*aspect-mix(a,b,t),push=stroke*mix(.29,.16,fast);push*=min(1.,.2/max(length(push),.0001));
 float r2=radius*radius*.75,g=exp(-dot(o,o)/r2);
 // The water stirs as it goes: a curl of the paper's broad mottling (eddies
 // some 40px across) twists the stream, so carried paint swirls and fingers
 // along the stroke instead of moving as one smooth band.
 vec2 tp=page/683.+.53;float k0=texture2D(pigment,tp).g;
 vec2 curl=vec2(texture2D(pigment,tp+vec2(0.,.0078)).g-k0,k0-texture2D(pigment,tp+vec2(.0078,0.)).g)*90.;
 // The paper's brush dabs would spin it hard; eddies stay below the stroke's own push.
 curl*=.6/(.6+length(curl));
 vec2 along=push/max(length(push),.0001),aim=g*(push-.2*dot(vec2(-push.y,push.x),o)/r2*vec2(o.y,-o.x)+curl*length(push));
 v=mix(v,aim-along*min(0.,dot(aim,along)),sqrt(g)*deposit*.8);
 vec2 slope=vec2(texture2D(pigment,page/97.+vec2(.02,0.)).g-paper,texture2D(pigment,page/97.+vec2(0.,.02)).g-paper);
 v+=vec2(-slope.y,slope.x)*wet*dt*2.;
 wet=min(1.,wet+brush*(dt*4.2+.3*min(1.,length(b-a)/radius))*mix(1.,.8,fast));
 stain=max(stain,wet);
 if(dot(v,v)<.000036)v=vec2(0.);
 if(wet<.004&&stain<.006){wet=0.;stain=0.;}
 gl_FragColor=vec4(clamp(v+neutral,0.,1.),wet,stain);
}`;

// RG is a backward map: where each spot of paper now takes its pigment from,
// in page heights, advected by the wet flow and easing home once the water has
// sunk in. B stores how much the map squeezes the painting, where dragged
// pigment piles up; A how hard it shears or stretches it.
export const smearFragment=`
varying vec2 vUv;
uniform sampler2D previous,flow;
uniform vec2 texel;
uniform float dt,reset,ebb;
// The cap (reach*1.15) stays inside range*.49, so 8-bit fields hold it too.
const float neutral=128./255.,range=.13,reach=.05;
const vec2 aspect=vec2(1672./941.,1.);
#ifdef BYTE_FIELDS
const float creep=.012;
#else
const float creep=.003;
#endif
void main(){
 if(reset>.5){gl_FragColor=vec4(neutral,neutral,neutral,0.);return;}
 vec4 f=texture2D(flow,vUv);vec2 v=f.rg-neutral;
 vec2 q=clamp(vUv-v/aspect*dt,texel,1.-texel);
 vec2 e=texture2D(previous,q+vec2(texel.x,0.)).rg,w=texture2D(previous,q-vec2(texel.x,0.)).rg,n=texture2D(previous,q+vec2(0.,texel.y)).rg,s=texture2D(previous,q-vec2(0.,texel.y)).rg;
 float squeeze=(e.x-w.x+n.y-s.y)*range*90.,strain=length(vec4(e-w,n-s))*range*90.;
 // Wet paint only shears so far before it runs together, so the map never
 // folds over into a doubled edge.
 vec2 d=(mix(texture2D(previous,q).rg,(e+w+n+s)*.25,.12+.6*clamp(strain-.4,0.,1.))-neutral)*range;
 // Pigment only travels so far: near that reach the flow slides it along
 // instead of stretching it further, so a stroke never tears the painting.
 float l=length(d);vec2 dir=d/max(l,.00001),go=-v*dt;
 d+=go-dir*max(0.,dot(go,dir))*smoothstep(reach*.5,reach,l);
 // Carried pigment holds while the paper is wet, then eases home as it dries;
 // a slow creep keeps the last pixel from sticking on the field's precision.
 float dry=1.-smoothstep(0.,.45,f.b);
 d*=exp(-dt*mix(.05,.55,dry))*ebb;
 l=length(d);d*=min(reach*1.15,max(0.,l-dt*creep*dry))/max(l,.00001);
 gl_FragColor=vec4(d/range+neutral,clamp(squeeze*.5+neutral,0.,1.),min(1.,strain*.5));
}`;

export const watercolorFinishFragment=`
varying vec2 vUv;
uniform sampler2D sceneColor,sceneBlur,pigment,wetPaint,smear,modelMask;
uniform vec2 pixel,artOrigin,artSpan;
uniform float daylight,wetEnabled,maskEnabled;
const float neutral=128./255.;
float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
// One more glaze of the same pigment: deeper and richer, while night stays blue.
vec3 glaze(vec3 c,float k){return c*(1.-k*(1.15-min(c,vec3(1.))));}
void main(){
 vec2 art=artOrigin+vec2(vUv.x,1.-vUv.y)*artSpan;
 vec2 pageUV=vec2(art.x/1672.,1.-art.y/941.);
 float tooth=texture2D(pigment,art/149.).g;
 vec4 wet=vec4(0.),sm=vec4(neutral);vec2 drag=vec2(0.),fine=vec2(0.);float moved=0.,shear=0.,smudge=0.;
 if(wetEnabled>.5){
  // Carried pigment feathers: the paper's mottling and its grain scatter where
  // each spot draws from by a share of how far the paint travelled, so a moved
  // edge frays into the wash instead of sliding across as a clean copy, and a
  // stroke's margin wanders a few cells with the grain instead of kinking.
  vec2 fray=vec2(texture2D(pigment,art/331.+.29).g,texture2D(pigment,art.yx/313.+.71).g)-.71;fine=vec2(tooth,texture2D(pigment,art.yx/137.+.57).g)-.71;
  wet=texture2D(wetPaint,pageUV);sm=texture2D(smear,pageUV+(fray+fine)*vec2(3./320.,3./180.));
  vec2 map=(sm.rg-neutral)*.13;
  drag=(map+fray*(length(map)+wet.b*.012)+fine*length(map)*.8)*941./artSpan;
  // How far it travelled in scene pixels, and how hard the flow shears it here.
  moved=length(map)*941./artSpan.y/pixel.y;shear=smoothstep(.1,.9,sm.a*2.);smudge=smoothstep(1.5,5.,moved);
 }
 // Wet paint is carried: every spot shows the pigment the flow brought to it,
 // and eases back to its own as the water dries.
 vec2 src=vUv+drag;
 // The 3D laptop is the one thing not painted on paper: near its silhouette
 // the edge wanders with the paper's grain, softens a touch, and pigment
 // pools just inside it, the way a wash dries against its own boundary.
 float modelRim=0.,modelIn=0.;
 if(maskEnabled>.5){
  vec2 R=pixel*3.4;float mb=0.;
  for(int i=0;i<8;i++){float a=float(i)*.785398;mb+=texture2D(modelMask,vUv+vec2(cos(a),sin(a))*R).r;}
  mb/=8.;modelIn=texture2D(modelMask,vUv).r;
  modelRim=smoothstep(.02,.45,mb)*(1.-smoothstep(.55,.98,mb));
  vec2 wob=vec2(texture2D(pigment,art/53.).g+texture2D(pigment,art/17.+.4).g*.5,texture2D(pigment,art.yx/59.+.3).g+texture2D(pigment,art.yx/19.+.8).g*.5)-1.05;
  // the silhouette wanders most; inside, seams and bevels waver a little
  src+=wob*pixel*(7.*modelRim+2.2*modelIn*(1.-modelRim));
 }
 vec3 center=texture2D(sceneColor,src).rgb;
 vec3 sum=center;float total=1.;float neighbours=0.;
 // Short-range pigment diffusion respects material edges and never draws a
 // black screen-space contour around a light leaf or a glowing bulb. Wet
 // pigment reaches further and bleeds across them.
 for(int i=0;i<4;i++){
  float a=(float(i)+fine.x*2.*wet.b)*1.57079632679;
  vec2 offset=vec2(cos(a),sin(a))*pixel*(.85+wet.b*4.+shear*9.);
  vec3 near=texture2D(sceneColor,src+offset).rgb;
  float w=exp(-dot(near-center,near-center)/(.018+wet.b*.1));
  sum+=near*w;total+=w;neighbours+=lum(near)*.25;
 }
 vec3 average=sum/total;
 float light=lum(center),protect=1.-smoothstep(.75,1.3,max(center.r,max(center.g,center.b)));
 float edge=clamp((neighbours-light)/max(neighbours,.08),0.,1.);
 // A thin dark line keeps its ink while the wash around it runs, judged
 // against its own surroundings so lines in the dark room hold too.
 float ink=smoothstep(.1,.4,(neighbours-light)/max(neighbours,.02));
 vec3 col=mix(center,average,min(.6,.07+(wet.b*.35+shear*.35)*(1.-.8*ink))*protect);
 if(wetEnabled>.5){
  // Paint dragged more than a few pixels is smudged, not moved: the brush lays
  // down what it picked up along the way, a little more from nearby, over a
  // reach that varies grain by grain, softened by as far as it travelled. A
  // share of each spot's own pigment stays in the paper, more as the water
  // sinks in, so a mark dries back by settling rather than springing home.
  // Carried paint thins as the water spreads it: a dark over a lighter wash
  // tints rather than covers, and by night so does a light over the dark room.
  float lod=max(0.,log2(moved/28.)),keep=mix(.35*smoothstep(3.,25.,moved),.8,1.-smoothstep(.02,.25,wet.b));
  vec3 home=col,carried=vec3(0.);vec2 path=drag*(1.+clamp((fine.x+fine.y)*4.,-.5,.5));
  // The carried load trails just behind where it landed: soft, not smeared flat.
  for(int i=0;i<6;i++)carried+=textureLod(sceneBlur,vUv+path*(.62+.38*(float(i)+1.)/6.),lod).rgb*(13.-float(i))/63.;
  carried=mix(carried,max(carried,home),.45*smoothstep(6.,40.,moved)*(1.-.5*daylight));
  carried=mix(carried,min(carried,home),.3*smoothstep(6.,40.,moved)*(1.-daylight));
  col=mix(col,mix(carried,home,keep),smudge*.55);
 }
 if(modelRim>0.){
  vec3 soft=(texture2D(sceneColor,src+vec2(pixel.x,pixel.y)*1.3).rgb+texture2D(sceneColor,src-vec2(pixel.x,pixel.y)*1.3).rgb+texture2D(sceneColor,src+vec2(pixel.x,-pixel.y)*1.3).rgb+texture2D(sceneColor,src-vec2(pixel.x,-pixel.y)*1.3).rgb)*.25;
  col=mix(col,soft,.7*modelRim);
  col*=1.-.08*modelRim*smoothstep(.3,.9,modelIn)*(.6+.8*(tooth-.62));
 }
 col*=1.-.022*edge*protect*smoothstep(.008,.08,light);
 // Static paper tooth and gathered pigment include every animated layer.
 float grain=clamp((tooth-.70)*1.7,-.50,.36);
 // Material-specific native brushwork carries the dry scene. This last pass
 // only keeps the moving paint on one paper; pooled water sinks into the tooth.
 col*=1.+grain*mix(.065,.05,daylight)*protect*(1.+wet.b*2.);
 if(wetEnabled>.5){
  // The wet footprint: the stain normalised by its peak a brush-width around, so
  // its edge stays pinned while the water dries. A light fibre-scale warp gives
  // the edge soft cauliflower lobes without doubling it.
  float wash=texture2D(pigment,art/421.).g,fibre=fine.x+.71;
  vec2 r=vec2(6./320.,6./180.),at=pageUV+fine.yx*r*.7;
  vec4 wc=texture2D(wetPaint,at),w0=texture2D(wetPaint,at+vec2(r.x,0.)),w1=texture2D(wetPaint,at-vec2(r.x,0.)),w2=texture2D(wetPaint,at+vec2(0.,r.y)),w3=texture2D(wetPaint,at-vec2(0.,r.y));
  float peak=max(max(max(w0.a,w1.a),max(w2.a,w3.a)),wc.a),pool=max(max(max(w0.b,w1.b),max(w2.b,w3.b)),wc.b);
  float shape=wc.a/max(peak,.02),level=clamp(.3+(fibre-.71)*1.1+(wash-.71)*.8,.12,.55),px=fwidth(shape),aa=px+.002;
  float inside=smoothstep(level-aa,level+aa,shape);
  // Clean water lifts dry pigment: inside the footprint the wash thins to a
  // paler glaze of the same hue, most on the tooth's hills while the valleys
  // keep theirs. It pales a little further as the water sinks in, holds while
  // the stain is high, then dries back to a faint trace.
  float hill=smoothstep(.6,.82,tooth)*.6+smoothstep(-.09,.13,fine.y)*.4;
  float hi=max(col.r,max(col.g,col.b)),sat=1.-min(col.r,min(col.g,col.b))/max(hi,.001);
  float lift=inside*(.5*smoothstep(0.,.5,peak)*(1.-.15*smoothstep(.2,.9,pool))+.05*smoothstep(.3,1.,wc.b))*(.5+.6*hill)*(.6+.6*clamp((wash-.6)*5.,0.,1.));
  // The lift thins pigment toward a ceiling: the paper's value, or by lamp
  // light a little above each spot's own value, so a lit desk pales too.
  // Nothing already at the ceiling (a glowing window) is touched.
  vec3 paper=mix(vec3(.15,.165,.25),vec3(.87,.83,.76),daylight);
  float paperL=lum(paper),l=lum(col),top=max(paperL,l*mix(1.5,1.,daylight)),lamp=smoothstep(paperL*.6,paperL*1.3,l)*(1.-daylight);
  // Dense darks well below the ceiling (foliage, a shadow, the night sky) lift
  // least, so they pale by no larger a share than the wash around them and the
  // stroke reads by the paint it moves rather than a pale veil.
  lift*=.4+.6*smoothstep(.15,.55,l/top);
  // Saturated pigment and thin ink lines give way least, and the thinning is
  // capped in pigment density, so a dense dark (foliage, a shadowed corner)
  // pales by no larger a share than the lighter wash around it. Washes already
  // close to the paper keep their value, so a pale sill keeps its forms.
  float give=(1.-smoothstep(top*.75,top,l))*(1.-.55*smoothstep(.3,.85,sat))*(1.-.7*smoothstep(.12,.45,edge));
  float k=lift*give,raised=l*exp(k*(1.-smoothstep(.72,.93,l/top))*min(-log(max(l/top,.0001)),.45));
  // Thinned pigment keeps its own hue raised toward the ceiling, over a
  // near-neutral paper by day (a cream target turns sky green); by night mostly
  // its own hue, over the blue paper in shadow and a cream of its own colour in
  // the lamp's pool, so the lit desk pales warm.
  vec3 tint=mix(mix(paper/paperL,mix(col/max(l,.001),vec3(1.),.35),lamp),vec3(1.),.7*daylight);
  vec3 bare=mix(tint*top,min(col*(top/max(l,.02)),vec3(1.)),mix(.9,.55,daylight));
  col=mix(col,bare,(raised-l)/max(top-l,.0001));
  // Tide line: the lifted pigment rides the drying puddle out to the pinned
  // edge and gathers there: a crisp outer edge and a darker band fading a few
  // pixels inward, clumped by the tooth. Only where the outside is near, so a
  // stain that varies inside the stroke draws no contour. Weaker by night, so
  // a dark room never gets a black outline.
  float outside=min(min(w0.a,w1.a),min(w2.a,w3.a))/max(peak,.02);
  float rim=inside*(1.-smoothstep(level,level+clamp(14.*px,.22,.5),shape))*(1.-smoothstep(level*.35,level*.7,outside));
  float dry=1.-smoothstep(.05,.6,pool),clump=.55+.9*clamp((tooth-.62)*4.,0.,1.);
  // The rim is lifted pigment, so it only gathers where the water lifted some.
  col=glaze(col,rim*smoothstep(.06,.45,peak)*(.1+.5*dry)*clump*mix(.45,1.,daylight)*protect*smoothstep(0.,.1,(raised-l)/max(l,.004)));
  col=glaze(col,clamp((sm.b-neutral)*2.,0.,1.)*.12*protect);
 }
 gl_FragColor=vec4(max(col,vec3(0.)),1.);
 #include <colorspace_fragment>
}`;

// A half-size copy of the scene, mipmapped, that smudged paint is drawn from.
const blurFragment=`varying vec2 vUv;uniform sampler2D sceneColor;uniform vec2 pixel;void main(){vec2 d=pixel,e=vec2(d.x,-d.y);gl_FragColor=vec4((texture2D(sceneColor,vUv).rgb+texture2D(sceneColor,vUv+d).rgb+texture2D(sceneColor,vUv-d).rgb+texture2D(sceneColor,vUv+e).rgb+texture2D(sceneColor,vUv-e).rgb)*.2,1.);}`;

export class WatercolorPost{
 constructor(renderer,{reduced=false,maxPixels=null,samples=null}={}){
  this.renderer=renderer;this.reduced=reduced;this.maxPixels=maxPixels;this.samples=samples;this.liveUntil=0;this.pending=0;this.fadeLevel=1;
  const type=renderer.extensions.has('EXT_color_buffer_float')?THREE.HalfFloatType:THREE.UnsignedByteType;
  this.target=new THREE.WebGLRenderTarget(1,1,{type,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:true,stencilBuffer:false});
  this.target.texture.colorSpace=THREE.LinearSRGBColorSpace;
  this.blurTarget=new THREE.WebGLRenderTarget(1,1,{type,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:true,depthBuffer:false});this.blurTarget.texture.colorSpace=THREE.LinearSRGBColorSpace;
  // Half float keeps the slowly relaxing smear map from sticking on byte steps.
  const field=()=>new THREE.WebGLRenderTarget(320,180,{type,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false});
  this.flowTargets=[field(),field()];this.smearTargets=[field(),field()];
  this.read=0;this.camera=new THREE.Camera();this.geometry=new THREE.PlaneGeometry(2,2);
  const blank=new Uint8Array([177,183,183,255]);this.fallback=new THREE.DataTexture(blank,1,1);this.fallback.needsUpdate=true;
  this.maskTarget=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:true,stencilBuffer:false});
  this.maskMaterial=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});
  this.uniforms={modelMask:{value:this.maskTarget.texture},maskEnabled:{value:0},sceneColor:{value:this.target.texture},sceneBlur:{value:this.blurTarget.texture},pigment:{value:this.fallback},wetPaint:{value:this.flowTargets[0].texture},smear:{value:this.smearTargets[0].texture},pixel:{value:new THREE.Vector2(1,1)},artOrigin:{value:new THREE.Vector2()},artSpan:{value:new THREE.Vector2(1672,941)},daylight:{value:1},wetEnabled:{value:0}};
  this.material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:watercolorFinishFragment,uniforms:this.uniforms,depthTest:false,depthWrite:false,toneMapped:false});
  this.scene=new THREE.Scene();this.scene.add(new THREE.Mesh(this.geometry,this.material));
  this.blurMaterial=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:blurFragment,uniforms:{sceneColor:this.uniforms.sceneColor,pixel:this.uniforms.pixel},depthTest:false,depthWrite:false,toneMapped:false});
  this.blurScene=new THREE.Scene();this.blurScene.add(new THREE.Mesh(this.geometry,this.blurMaterial));
  this.flowUniforms={previous:{value:this.flowTargets[0].texture},pigment:{value:this.fallback},texel:{value:new THREE.Vector2(1/320,1/180)},pointerFrom:{value:new THREE.Vector2(-2,-2)},pointerTo:{value:new THREE.Vector2(-2,-2)},dt:{value:1/30},deposit:{value:0},span:{value:1/30},reset:{value:0},ebb:{value:1}};
  this.flowMaterial=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:wetPaintFragment,uniforms:this.flowUniforms,defines:type===THREE.UnsignedByteType?{BYTE_FIELDS:1}:{},depthTest:false,depthWrite:false,toneMapped:false});
  this.flowScene=new THREE.Scene();this.flowScene.add(new THREE.Mesh(this.geometry,this.flowMaterial));
  const fu=this.flowUniforms;this.smearUniforms={previous:{value:this.smearTargets[0].texture},flow:{value:this.flowTargets[0].texture},texel:fu.texel,dt:fu.dt,reset:fu.reset,ebb:fu.ebb};
  this.smearMaterial=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:smearFragment,uniforms:this.smearUniforms,defines:this.flowMaterial.defines,depthTest:false,depthWrite:false,toneMapped:false});
  this.smearScene=new THREE.Scene();this.smearScene.add(new THREE.Mesh(this.geometry,this.smearMaterial));
  this.clearFlow();
 }
 clearFlow(){
  const renderer=this.renderer,previous=renderer.getRenderTarget(),fu=this.flowUniforms,su=this.smearUniforms;
  const fields=[fu.previous.value,su.previous.value];fu.previous.value=su.previous.value=this.fallback;fu.reset.value=1;
  for(const target of this.flowTargets){renderer.setRenderTarget(target);renderer.render(this.flowScene,this.camera);}
  for(const target of this.smearTargets){renderer.setRenderTarget(target);renderer.render(this.smearScene,this.camera);}
  fu.reset.value=0;[fu.previous.value,su.previous.value]=fields;renderer.setRenderTarget(previous);this.uniforms.wetEnabled.value=0;
  this.pending=0;this.accumulated=0;this.fadeLevel=1;
 }
 setPigment(texture){this.uniforms.pigment.value=texture;this.flowUniforms.pigment.value=texture;}
 resize(width,height,mobile=false){
  const factor=Math.min(1,Math.sqrt((this.maxPixels??(mobile?2000000:4000000))/(width*height)));
  this.target.samples=Math.min(this.samples??(mobile?2:4),this.renderer.capabilities?.maxSamples??0);
  this.target.setSize(Math.max(1,Math.round(width*factor)),Math.max(1,Math.round(height*factor)));
  this.uniforms.pixel.value.set(1/this.target.width,1/this.target.height);this.maskTarget.setSize(this.target.width,this.target.height);this.blurTarget.setSize(Math.ceil(this.target.width/2),Math.ceil(this.target.height/2));
 }
 move(artX,artY,now){
  if(this.reduced)return;
  const point=new THREE.Vector2(artX/1672,1.-artY/941);
  if(!this.lastPointer||now-this.lastMove>140){this.lastPointer=point.clone();this.lastStamp=now;}
  // Tiny steps accumulate until they count, so a slow brush still pools water.
  if(this.lastPointer.distanceTo(point)>.0006){const fu=this.flowUniforms;if(!this.pending){fu.pointerFrom.value.copy(this.lastPointer);this.pendingSince=this.lastStamp;}fu.pointerTo.value.copy(point);this.pending=1;this.pendingUntil=now;this.liveUntil=now+9000;this.lastPointer=point;this.lastStamp=now;}
  this.lastMove=now;
 }
 stop(){this.lastPointer=null;this.pending=0;}
 update(dt,now,{camera,viewWidth,viewHeight,day}){
  const u=this.uniforms,z=camera.zoom;
  u.artOrigin.value.set(camera.position.x+836-viewWidth/(2*z),470.5-camera.position.y-viewHeight/(2*z));
  u.artSpan.value.set(viewWidth/z,viewHeight/z);u.daylight.value=day;
  if(this.reduced||now>this.liveUntil){if(u.wetEnabled.value)this.clearFlow();return;}
  this.accumulated=(this.accumulated||0)+dt;if(this.accumulated<1/30)return;
  const fu=this.flowUniforms,su=this.smearUniforms,renderer=this.renderer;fu.dt.value=Math.min(.067,this.accumulated);this.accumulated=0;
  fu.deposit.value=this.pending?Math.min(1,.35+fu.pointerFrom.value.distanceTo(fu.pointerTo.value)*250):0;fu.span.value=THREE.MathUtils.clamp((this.pendingUntil-this.pendingSince)/1000,1/240,.15);this.pending=0;
  // The last 1.8 s ease the field to empty. The drain only ever deepens: a new
  // stroke renews the window without scaling the old mark back up.
  const level=Math.min(1,Math.max(0,this.liveUntil-now)/1800);fu.ebb.value=Math.min(1,level/Math.max(this.fadeLevel,1e-4));this.fadeLevel=level;
  fu.previous.value=this.flowTargets[this.read].texture;su.previous.value=this.smearTargets[this.read].texture;const next=1-this.read;
  renderer.setRenderTarget(this.flowTargets[next]);renderer.render(this.flowScene,this.camera);
  su.flow.value=this.flowTargets[next].texture;renderer.setRenderTarget(this.smearTargets[next]);renderer.render(this.smearScene,this.camera);this.read=next;
  u.wetPaint.value=this.flowTargets[next].texture;u.smear.value=this.smearTargets[next].texture;u.wetEnabled.value=1;
 }
 // White silhouette of the 3D objects on layer 1 (the laptop), for the finish pass.
 renderMask(world,camera){
  const r=this.renderer,layers=camera.layers.mask,override=world.overrideMaterial,auto=r.shadowMap.autoUpdate,color=r.getClearColor(new THREE.Color()),alpha=r.getClearAlpha();
  camera.layers.set(1);world.overrideMaterial=this.maskMaterial;r.shadowMap.autoUpdate=false;
  r.setRenderTarget(this.maskTarget);r.setClearColor(0x000000,0);r.clear();r.render(world,camera);
  r.setClearColor(color,alpha);r.shadowMap.autoUpdate=auto;world.overrideMaterial=override;camera.layers.mask=layers;this.uniforms.maskEnabled.value=1;
 }
 begin(){this.renderer.setRenderTarget(this.target);this.renderer.clear();}
 finish(){const renderer=this.renderer;if(this.uniforms.wetEnabled.value){renderer.setRenderTarget(this.blurTarget);renderer.render(this.blurScene,this.camera);}renderer.setRenderTarget(null);renderer.render(this.scene,this.camera);}
 dispose(){this.target.dispose();this.maskTarget.dispose();this.maskMaterial.dispose();this.blurTarget.dispose();this.blurMaterial.dispose();[...this.flowTargets,...this.smearTargets].forEach(t=>t.dispose());this.geometry.dispose();this.material.dispose();this.flowMaterial.dispose();this.smearMaterial.dispose();this.fallback.dispose();}
}
