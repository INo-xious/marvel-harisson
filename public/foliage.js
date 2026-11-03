import * as THREE from 'three';

const vertex=`varying vec2 vUv;varying vec2 vArt;
uniform float sway;uniform vec2 rootPoint;uniform vec2 artCenter;
void main(){
 vUv=uv;vec3 p=position;vec2 d=p.xy-rootPoint;
 // The first 24 room pixels of the stem never move. Only the upper stem
 // and leaves receive a gradual bend; the soil connection stays fixed.
 float weight=smoothstep(36.,110.,abs(d.y));float a=sway*weight;
 p.xy=rootPoint+mat2(cos(a),sin(a),-sin(a),cos(a))*d;
 vArt=artCenter+vec2(p.x,-p.y);
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;
const fragment=`uniform sampler2D painting;uniform vec2 atlasSize;uniform vec4 crop;uniform vec3 tint;
uniform vec4 potLip;uniform float rootFade;uniform float rootFadeSize;
varying vec2 vUv;varying vec2 vArt;
void main(){
 vec2 pixel=crop.xy+vec2(vUv.x,1.-vUv.y)*crop.zw;
 vec2 paintUV=vec2(pixel.x/atlasSize.x,1.-pixel.y/atlasSize.y);
 vec4 c=texture2D(painting,paintUV);
 // Pigment and selective lost edges are painted into the native RGBA asset.
 // Preserve that coverage instead of imposing a second tiled wash or edge tint.
 float alpha=c.a;
 alpha*=mix(1.,smoothstep(0.,rootFadeSize,pixel.y-crop.y),rootFade);
 float inPot=smoothstep(potLip.x-1.,potLip.x+1.,vArt.x)*(1.-smoothstep(potLip.y-1.,potLip.y+1.,vArt.x));
 float lip=mix(potLip.z,potLip.w,clamp((vArt.x-potLip.x)/max(1.,potLip.y-potLip.x),0.,1.));
 alpha*=1.-inPot*smoothstep(lip-1.,lip+1.,vArt.y);
 if(alpha<.004)discard;gl_FragColor=vec4(c.rgb*tint,alpha);
 #include <colorspace_fragment>
}`;

// Five isolated groups in the generated 1774x887 RGBA atlas. The root target
// sits just inside the soil; potLip hides the short extracted root bundles.
export const FOLIAGE_ATLAS={width:1774,height:887};
export const FOLIAGE_PARTS=[
 {name:'shelf vine',crop:[50,0,260,860],anchor:[155,13],target:[221,22],scale:.30,angle:.014,phase:0,rootFade:1,rootFadeSize:36,lip:[-100,-99,2000,2000]},
 {name:'small blue pot plant',crop:[370,310,330,560],anchor:[530,714],target:[781,515],scale:.22,angle:.012,phase:1.2,rootFade:0,lip:[760,802,516.5,516.5]},
 {name:'cream pot flowering plant',crop:[700,230,340,650],anchor:[875,706],target:[968,451.5],scale:.25,angle:.012,phase:2.4,rootFade:0,lip:[926,1015,453.25,453.25]},
 {name:'small white pot plant',crop:[1080,290,295,570],anchor:[1208,714],target:[1036,475.5],scale:.23,angle:.012,phase:3.2,rootFade:0,lip:[1014,1070,477.7,477.7]},
 {name:'terracotta monstera',crop:[1370,90,380,790],anchor:[1595,708],target:[1277,468.5],scale:.34,angle:.013,phase:4.1,rootFade:0,lip:[1246,1309,470.4,470.4]},
];

export class PaintedFoliage{
 constructor(texture,reduced=false,foregroundTexture=null){
  this.reduced=reduced;this.group=new THREE.Group();this.group.position.z=3;this.parts=[];
  const plants=[...FOLIAGE_PARTS];
  if(foregroundTexture){const width=foregroundTexture.image.width,height=foregroundTexture.image.height,sx=280/width,sy=341/height;
   plants.push({name:'foreground monstera',foreground:true,crop:[-20/sx,0,300/sx,381/sy],anchor:[45/sx,372/sy],target:[45,972],scaleX:sx,scaleY:sy,angle:.012,phase:5.7,rootFade:1,rootFadeSize:height*20/341,lip:[-100,-99,2000,2000]});
  }
  for(const p of plants){
   const sx=p.scaleX??p.scale,sy=p.scaleY??p.scale,painting=p.foreground?foregroundTexture:texture;
   const group=new THREE.Group();group.position.set(p.target[0]-836,470.5-p.target[1],0);
   const mx=(p.crop[0]+p.crop[2]/2-p.anchor[0])*sx,my=(p.anchor[1]-p.crop[1]-p.crop[3]/2)*sy;
   const material=new THREE.ShaderMaterial({uniforms:{painting:{value:painting},atlasSize:{value:new THREE.Vector2(painting?.image?.width||FOLIAGE_ATLAS.width,painting?.image?.height||FOLIAGE_ATLAS.height)},crop:{value:new THREE.Vector4(...p.crop)},tint:{value:new THREE.Color()},potLip:{value:new THREE.Vector4(...p.lip)},rootFade:{value:p.rootFade},rootFadeSize:{value:p.rootFadeSize||26},sway:{value:0},rootPoint:{value:new THREE.Vector2(-mx,-my)},artCenter:{value:new THREE.Vector2(p.target[0]+mx,p.target[1]-my)}},vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false});
   const mesh=new THREE.Mesh(new THREE.PlaneGeometry(p.crop[2]*sx,p.crop[3]*sy,18,40),material);mesh.position.set(mx,my,0);group.add(mesh);this.group.add(group);this.parts.push({group,material,...p});
  }
  this.update(0,new THREE.Color());
 }
 update(time,tint){
  for(const p of this.parts){const u=p.material.uniforms,breeze=.62+.38*Math.sin(time*.19+p.phase);u.sway.value=this.reduced?0:Math.sin(time*.93+p.phase)*p.angle*breeze;u.tint.value.copy(tint);}
 }
 dispose(){for(const p of this.parts){p.group.children[0].geometry.dispose();p.material.dispose();}}
}
