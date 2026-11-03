import {onSupport,atFoot,planeScale,DESK,DESK_HEIGHT} from './brush-study-geometry.js?v=objects-20261103a';
import {studyLightGLSL} from './brush-study-light.js?v=objects-20261103a';

// The original pigment is retained. Its support surfaces are reconstructed,
// while the plants, lamp and desk objects remain upright watercolor cutouts.
const props=[
 {name:'Desk plant',bounds:[140,0,830,566],root:[437,552],contact:[432,563],offset:[-45,20],scale:.60,role:1},
 {name:'Terracotta pot',bounds:[384,460,477,568],root:[437,552],contact:[432,563],offset:[-45,20],scale:.60,role:13},
 {name:'Task lamp',bounds:[140,220,453,566],root:[437,552],contact:[214,560],offset:[-45,20],scale:.60,role:12},
 {name:'Stationery',bounds:[260,443,359,590],root:[437,552],contact:[311,583],offset:[-45,20],scale:.60,role:10},
 {name:'Left books',bounds:[78,537,329,650],root:[195,634],scale:.65,role:2},
 {name:'Laptop',bounds:[441,407,827,642],root:[630,603],scale:.65,role:3},
 {name:'Open notebook',bounds:[760,571,1087,657],root:[932,639],scale:.65,role:4},
 {name:'Mug',bounds:[1026,499,1172,600],root:[1093,587],scale:.64,role:5},
 {name:'Right books',bounds:[1199,501,1451,624],root:[1335,603],scale:.65,role:6}
];
function nativeToTop(x,y){const v=Math.max(0,Math.min(1,(y-552)/99)),left=291.5+(97-291.5)*v,right=1012.8+(1076-1012.8)*v,nativeLeft=135+(50-135)*v,nativeRight=1453+(1530-1453)*v;return [left+(right-left)*(x-nativeLeft)/(nativeRight-nativeLeft),512+65*v];}
function propPoint(prop,q){const base=nativeToTop(...prop.root),offset=prop.offset||[0,0];return [base[0]+(q[0]-prop.root[0])*prop.scale+offset[0],base[1]+(q[1]-prop.root[1])*prop.scale+offset[1]];}
function supportFoot(y){return 330+(y-330)*(410.5/(410.5-DESK_HEIGHT));}
const laptopHinge=[[477,590],[717,566]];
const laptopColumns=[441,447,462,473,477,501,525,549,573,597,621,645,669,687,717,724,747,771,795,819,823,827];
const laptopBaseRows=[550,554,558,566,574,578,590,598,610,618,630,640,642];
function laptopHingeY(x){return laptopHinge[0][1]+(x-laptopHinge[0][0])*(laptopHinge[1][1]-laptopHinge[0][1])/(laptopHinge[1][0]-laptopHinge[0][0]);}
function polygon(name,points){return `float ${name}(vec2 p){float d=10000.,inside=0.;vec2 a,b,e;float t;`+points.map((a,i)=>{const b=points[(i+1)%points.length];return `a=vec2(${a.map(x=>x.toFixed(1))});b=vec2(${b.map(x=>x.toFixed(1))});e=b-a;t=clamp(dot(p-a,e)/dot(e,e),0.,1.);d=min(d,length(p-a-e*t));if((a.y>p.y)!=(b.y>p.y)){if(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=1.-inside;}`;}).join('')+`return smoothstep(-2.,2.,d*(inside*2.-1.));}`;}
const propMasks=polygon('bookLeft',[[107,559],[243,552],[298,565],[300,594],[317,606],[210,646],[83,625],[87,603]])+
 polygon('lampFoot',[[145,559],[151,540],[176,530],[194,520],[225,516],[270,529],[282,558],[240,563],[175,562]])+
 polygon('lampShade',[[330,248],[337,233],[349,232],[360,244],[372,269],[406,287],[429,310],[445,324],[445,331],[425,343],[383,359],[336,374],[328,371],[321,356],[320,334],[327,306],[333,282]])+
 polygon('deskPot',[[393,469],[411,464],[440,465],[461,473],[465,481],[461,488],[463,516],[468,546],[464,554],[455,560],[439,563],[421,562],[406,558],[400,551],[396,533],[390,484],[387,476]])+
 polygon('stationery',[[263,446],[355,443],[359,484],[353,574],[346,585],[309,589],[277,578],[269,529]])+
 // Follow the actual cream rim, including its broken upper contour. The old
 // trapezoid began 12–18 source pixels above it and owned the olive leaves.
 polygon('laptopLid',[[454,446],[458,439],[477,437],[500,435],[525,434],[550,432],[575,429],[600,427],[625,426],[650,423],[675,422],[681,423],[685,430],[716,563],[724,571],[477,597]])+
 polygon('laptopBase',[[473,578],[708,554],[823,586],[821,618],[563,640],[473,602]])+
 polygon('notebook',[[765,608],[824,591],[906,576],[946,582],[972,579],[1043,597],[1078,624],[1041,629],[983,643],[928,648],[895,653],[876,655],[819,640]])+
 polygon('notebookPen',[[763,605],[780,607],[883,643],[886,650],[875,657],[768,619]])+
 polygon('cup',[[1031,509],[1101,499],[1129,510],[1149,527],[1158,540],[1154,556],[1139,575],[1122,600],[1042,598]])+
 polygon('mugHandleVoid',[[1129,540],[1140,539],[1143,546],[1140,556],[1134,564],[1126,567],[1124,558],[1125,549]])+
 polygon('bookRight',[[1202,534],[1335,501],[1451,536],[1451,581],[1352,624],[1199,593]]);
const fragment=`
varying vec2 nativePoint;varying vec3 paintWorld;uniform sampler2D painting;
uniform vec3 roomTint,sunColor;uniform float day,gold,night,lamp,time,deskRole,laptopPresence,wallDepth,wallRegistration;
${propMasks}
${studyLightGLSL}
float oval(vec2 p,vec2 c,vec2 r){return 1.-smoothstep(.70,1.,length((p-c)/r));}
float lampStroke(vec2 p,vec2 a,vec2 b,float width){vec2 e=b-a;float t=clamp(dot(p-a,e)/dot(e,e),0.,1.);return 1.-smoothstep(width,width+1.2,length(p-a-e*t));}
float lampShape(vec2 p){
 float arm=max(lampStroke(p,vec2(175.,354.),vec2(217.,502.),12.),lampStroke(p,vec2(175.,354.),vec2(300.,279.),11.));
 arm=max(arm,lampStroke(p,vec2(299.,277.),vec2(338.,269.),8.));
 arm=max(arm,oval(p,vec2(175.,354.),vec2(21.)));arm=max(arm,oval(p,vec2(216.,503.),vec2(21.)));
 float cable=lampStroke(p,vec2(300.,277.),vec2(311.,245.),3.);
 cable=max(cable,lampStroke(p,vec2(311.,245.),vec2(319.,229.),3.));
 cable=max(cable,lampStroke(p,vec2(319.,229.),vec2(331.,225.),3.));
 cable=max(cable,lampStroke(p,vec2(331.,225.),vec2(341.,234.),3.));
 return max(max(arm,cable),max(lampShade(p),lampFoot(p)));
}
float woodPigment(vec3 ink){
 // Relative pigment ratios separate orange tabletop from cream highlights
 // and charcoal contours even in the darker deposits around an object.
 float redOchre=(ink.r-ink.g)/max(ink.r,.02);
 float yellowOchre=(ink.g-ink.b)/max(ink.g,.02);
 return smoothstep(.27,.44,redOchre)*smoothstep(.32,.56,yellowOchre);
}
float shape(vec2 p,int role){
 if(role==2)return bookLeft(p)*(1.-stationery(p));if(role==3)return max(laptopLid(p),laptopBase(p));if(role==4)return max(notebook(p),notebookPen(p));if(role==5)return cup(p);if(role==6)return bookRight(p);if(role==10)return stationery(p);return 0.;
}
void main(){
 vec2 q=nativePoint,uv=vec2(q.x/1672.,1.-q.y/941.);
 vec4 ink=texture2D(painting,uv);
 float objects=max(max(shape(q,2),shape(q,3)),max(max(shape(q,4),shape(q,5)),shape(q,6)));
 if(deskRole==1.){
  float green=smoothstep(.005,.06,ink.g-max(ink.r,ink.b));
  float anchored=pow(clamp((510.-q.y)/490.,0.,1.),1.6);
  uv.x+=green*anchored*sin(time*.63+q.y*.009)*3.4/1672.;
  uv.y+=green*anchored*sin(time*.79+q.x*.012)*.8/941.;
  ink=texture2D(painting,uv);
  // The source cup continues below the old cluster crop. Give it its own
  // supported plane; keep foliage behind it and remove only cup/pen pigment.
  float plant=smoothstep(.005,.045,ink.g-max(ink.r,ink.b));
  // The low left leaf inherited the source table's straight cut. End it
  // along its own bowed contour before that line; the pot owns its body.
  float leafBottom=548.-22.*pow(clamp((q.x-350.)/85.,-1.,1.),2.)+1.2*sin(q.x*.12);
  float lowLeaf=1.-smoothstep(leafBottom-1.5,leafBottom+1.5,q.y);
  float leafZone=(1.-smoothstep(398.,413.,q.x))*smoothstep(490.,515.,q.y);
  float silhouette=(1.-smoothstep(549.,554.,q.y))*mix(1.,lowLeaf,leafZone);
  ink.a*=silhouette*(1.-deskPot(q))*(1.-smoothstep(.02,.14,objects)*(1.-plant));
  ink.a*=1.-stationery(q)*(1.-plant);
  ink.a*=1.-lampShape(q)*(1.-plant);
 }
 if(deskRole==13.){
  // The native pot ends at the same straight y552 cut as the source table.
  // Continue only its final pigment rows into a rounded foot, with no wood
  // sample below it. The clay still uses the original granulated wash.
  vec2 claySample=vec2(clamp(q.x,399.,456.),min(q.y,537.+max(0.,q.y-537.)*.39));
  vec4 clay=texture2D(painting,vec2(claySample.x/1672.,1.-claySample.y/941.));
  float body=smoothstep(483.,493.,q.y);
  float terracotta=smoothstep(.10,.20,clay.r-clay.g);
  vec2 cleanSample=vec2(411.+(q.x-428.)*.46,490.+clamp(q.y-500.,-5.,48.)*.70);
  vec3 cleanClay=texture2D(painting,vec2(cleanSample.x/1672.,1.-cleanSample.y/941.)).rgb;
  clay.rgb=mix(clay.rgb,cleanClay,body*(1.-terracotta));
  ink.rgb=mix(ink.rgb,clay.rgb,smoothstep(529.,541.,q.y));
  ink.rgb=mix(ink.rgb,cleanClay,body*(1.-smoothstep(.09,.19,ink.r-ink.g))*(1.-smoothstep(529.,541.,q.y)));
  float bottomDeposit=smoothstep(552.,562.,q.y)*(.16+.05*sin(q.x*.28));
  ink.rgb*=1.-bottomDeposit;
  ink.a=deskPot(q);
 }
 if(deskRole==12.){
  ink.a*=lampShape(q);
  // Foliage beside the metal contour and native wood beneath its foot do
  // not follow the lamp. Cream shade reserves stay with the metal body.
  float plant=smoothstep(.005,.045,ink.g-max(ink.r,ink.b));
  ink.a*=1.-plant;
  float lowerFoot=lampFoot(q)*smoothstep(520.,539.,q.y);
  ink.a*=1.-lowerFoot*woodPigment(ink.rgb);
 }
 if(deskRole==2.||deskRole==4.||deskRole==5.||deskRole==6.)ink.a*=smoothstep(.01,.12,shape(q,int(deskRole)));
 if(deskRole==4.)ink.a*=1.-woodPigment(ink.rgb)*(1.-notebookPen(q));
 if(deskRole==5.){
  float handleWood=woodPigment(ink.rgb);
  float outsideHandle=smoothstep(1137.,1150.,q.x)*smoothstep(548.,551.,q.y);
  ink.a*=1.-mugHandleVoid(q);
  ink.a*=1.-handleWood*outsideHandle;
 }
 float hingeY=590.-(q.x-477.)*.1;
 if(deskRole==3.)ink.a*=laptopLid(q)*(1.-smoothstep(hingeY+1.5,hingeY+3.5,q.y));
 if(deskRole==11.)ink.a*=laptopBase(q)*smoothstep(hingeY-3.5,hingeY-1.5,q.y);
 if(deskRole==3.||deskRole==11.){
  // Contour masks include the painted rim. Reject surrounding ochre wood
  // by pigment, rather than trimming the silver base with a straight crop.
  float wood=smoothstep(.13,.27,ink.r-ink.b)*smoothstep(.10,.20,ink.r-ink.g);
  ink.a*=1.-wood;
 }
 if(deskRole==3.){
  // The native anti-aliased outer rim mixes into the leaf behind it. Reject
  // that olive residue by relative pigment, while keeping cream and the
  // blue-grey screen. This is local to the lid, never a room-wide green key.
  float olive=smoothstep(.20,.36,(ink.g-ink.b)/max(ink.g,.02))
    *(1.-smoothstep(.45,.65,ink.b/max(ink.r,.02)));
  ink.a*=1.-olive;
 }
 if(deskRole==10.){
  float plant=smoothstep(.005,.045,ink.g-max(ink.r,ink.b));
  float wood=smoothstep(.17,.30,ink.r-ink.b)*smoothstep(.12,.22,ink.r-ink.g);
  ink.a*=stationery(q)*(1.-plant)*(1.-wood*smoothstep(530.,553.,q.y));
 }
 if(deskRole==0.){
  // Reserve unpainted wood beneath the separate upright object layers.
  vec2 reserve=vec2(clamp(900.+(q.x-600.)*.17,820.,1010.),560.+clamp((q.y-552.)*.095,0.,9.));
  vec3 wood=texture2D(painting,vec2(reserve.x/1672.,1.-reserve.y/941.)).rgb;
  float occupied=max(objects,max(deskPot(q),max(stationery(q),lampFoot(q))));
  ink.rgb=mix(ink.rgb,wood,smoothstep(.01,.08,occupied));
  float v=(q.y-552.)/99.,left=135.-85.*v,right=1453.+77.*v;
  float margin=min(q.x-left,right-q.x);
  ink.a*=smoothstep(0.,3.,margin+sin(q.y*.19)*1.3);
 }
 if(deskRole==7.)ink.a*=1.-smoothstep(682.+sin(q.x*.087)*1.5,687.+sin(q.x*.087)*1.5,q.y);
 if(ink.a<.035)discard;
 // Desaturate the orange varnish into warm grey ochre; keep dark overlaps.
 float value=dot(ink.rgb,vec3(.30,.50,.20));
 float woodPlane=deskRole==0.||deskRole==7.?1.:0.;
 float laptopPlane=deskRole==11.?1.:0.;
 float paperPlane=deskRole==4.?1.:0.;
 vec3 pigment=mix(ink.rgb,vec3(value),.16+woodPlane*.21);
 pigment=mix(pigment,pigment*vec3(.94,.98,1.035),woodPlane*.8);
 float deposit=.5+.25*sin(q.x*.036+sin(q.y*.022)*2.3)+.20*sin(q.y*.074-q.x*.009);
 pigment*=1.+(deposit-.5)*(.038+woodPlane*.022);
 vec3 col=pigment*roomTint;
 col=lightPaint(col,paintWorld,max(woodPlane,max(laptopPlane*.72,paperPlane*.55)));
 if(deskRole==0.){
  // Soft pigment settles directly below the measured feet, on the same
  // horizontal support plane as the light proxies and painted tabletop.
  vec2 lampContact=vec2(paintWorld.x-proxyBase[0].x,(paintWorld.z-proxyBase[0].z)*.45);
  vec2 plantContact=vec2(paintWorld.x-proxyBase[1].x,(paintWorld.z-proxyBase[1].z)*.45);
  vec2 tinContact=vec2(paintWorld.x-proxyBase[6].x,(paintWorld.z-proxyBase[6].z)*.45);
  float settled=exp(-dot(lampContact/vec2(34.,8.),lampContact/vec2(34.,8.)))*.15;
  settled+=exp(-dot(plantContact/vec2(27.,5.5),plantContact/vec2(27.,5.5)))*.24;
  settled+=exp(-dot(tinContact/vec2(20.,6.),tinContact/vec2(20.,6.)))*.12;
  col*=1.-settled*(.88+.12*sin(q.x*.071+q.y*.117));
 }
 float bulb=oval(q,vec2(388.,350.),vec2(37.,14.));
 if(deskRole==12.)col+=vec3(.35,.22,.09)*bulb*lamp*(.28+.72*night);
 // Translucent dry pigment at the outline; never expand a rectangular crop.
 float edge=smoothstep(.08,.86,ink.a);
 ink.a*=mix(.82,1.,edge);
 if(deskRole==3.||deskRole==11.)ink.a*=laptopPresence;
 gl_FragColor=vec4(max(col,vec3(0.)),ink.a);
 #include <colorspace_fragment>
}`;
export function createStudyDesk({THREE,scene,uniforms,texture,getDistance}){
 const meshes=[];
 function piece(name,role,columns,rows,mapper,order){
  const positions=[],uvs=[],indices=[],art=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){
   const sample=mapper(i/columns,j/rows);art.push(sample);positions.push(0,0,0);uvs.push(sample.q[0]/1672,1-sample.q[1]/941);
  }
  for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){const a=j*(columns+1)+i,b=a+1,c=a+columns+1,d=c+1;indices.push(a,c,b,b,c,d);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);
  const mat=new THREE.ShaderMaterial({uniforms:{...uniforms,painting:{value:texture},deskRole:{value:role},laptopPresence:{value:1}},side:THREE.DoubleSide,transparent:true,depthWrite:false,
   vertexShader:'varying vec2 nativePoint;varying vec3 paintWorld;void main(){nativePoint=vec2(uv.x,1.-uv.y)*vec2(1672.,941.);vec4 world=modelMatrix*vec4(position,1.);paintWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}',fragmentShader:fragment});
  const mesh=new THREE.Mesh(geo,mat);mesh.name=name;mesh.renderOrder=order;scene.add(mesh);meshes.push({mesh,art});return mesh;
 }
 // Four physically upright legs. Rear legs are behind the tabletop/apron.
 for(const [side,footX,footY,topY,sourceX,width,order] of [
  ['rear left',307,693.6,522,86,25,1.9],['rear right',995,693.6,522,1445,25,1.9],
  ['front left',116,823.4,595,86,31,3.1],['front right',1050,823.4,595,1445,31,3.1]
 ])piece('Desk '+side+' support',8,1,1,(u,v)=>({q:[sourceX+u*47,689+v*248],p:[footX+(u-.5)*width,topY+(footY-topY)*v],footY}),order);
 piece('Desk horizontal top',0,40,16,(u,v)=>({q:[135+(50-135)*v+u*(1318+(1480-1318)*v),552+99*v],p:[291.5+(97-291.5)*v+u*(721.3+(979-721.3)*v),512+65*v],height:DESK_HEIGHT}),2.4);
 piece('Desk front apron',7,30,1,(u,v)=>({q:[50+1480*u,651+36*v],p:[97+979*u,577+21*v],footY:823.4}),2.5);
 for(const prop of props){
  const [x0,y0,x1,y1]=prop.bounds;
  if(prop.role==3){
   // Both pieces retain the same source-to-paint mapping in the center view.
   // The base lies on the support plane; every lid column shares its hinge.
   piece('Laptop painted base',11,laptopColumns.length-1,laptopBaseRows.length-1,(u,v)=>{const q=[laptopColumns[Math.round(u*(laptopColumns.length-1))],laptopBaseRows[Math.round(v*(laptopBaseRows.length-1))]];return {q,p:propPoint(prop,q),height:DESK_HEIGHT};},2.75);
   piece('Laptop painted lid',3,laptopColumns.length-1,2,(u,v)=>{const x=laptopColumns[Math.round(u*(laptopColumns.length-1))],hingeY=laptopHingeY(x),q=[x,y0+(hingeY-y0)*v],hinge=propPoint(prop,[x,hingeY]);return {q,p:propPoint(prop,q),footY:supportFoot(hinge[1])};},2.8);
   continue;
  }
  if(prop.role==4){
   piece('Open notebook supported paper',4,20,12,(u,v)=>{const q=[x0+(x1-x0)*u,y0+(y1-y0)*v];return {q,p:propPoint(prop,q),height:DESK_HEIGHT};},2.8);
   continue;
  }
  const contact=propPoint(prop,prop.contact||prop.root),footY=supportFoot(contact[1]);
  piece(prop.name,prop.role,1,1,(u,v)=>{const q=[x0+(x1-x0)*u,y0+(y1-y0)*v];return {q,p:propPoint(prop,q),footY};},prop.role==1?2.65:prop.role==13?2.68:prop.role==12?2.7:2.8);
 }
 function resize(){const distance=getDistance();for(const {mesh,art} of meshes){const pos=mesh.geometry.attributes.position;art.forEach((a,i)=>{const p=a.height!==undefined?onSupport(...a.p,a.height,distance):atFoot(...a.p,a.footY,distance);pos.setXYZ(i,...p);});pos.needsUpdate=true;mesh.geometry.computeBoundingSphere();}}
 resize();return {meshes:meshes.map(x=>x.mesh),resize,propAnchors:props.map(prop=>({name:prop.name,root:propPoint(prop,prop.contact||prop.root),scale:prop.scale,...(prop.role==3?{hinge:laptopHinge.map(q=>propPoint(prop,q))}:{} )}))};
}
