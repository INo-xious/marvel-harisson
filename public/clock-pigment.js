import * as THREE from 'three';

export const clockPigmentVertex=`
varying vec2 brushPoint;
void main(){
 brushPoint=position.xy;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}`;

export const clockPigmentFragment=`
uniform sampler2D handAtlas;
uniform vec3 inkColor,inkBaseColor;
uniform vec2 handSize;
uniform float handColumn;
varying vec2 brushPoint;
void main(){
 vec3 color=inkColor;
 float coverage=.90;
 if(handSize.x>0.){
  // Each hand keeps its exact geometry, pivot and time. The one authored
  // stroke in its own tile supplies the pigment and selective lost edges.
  vec2 handUV=vec2((brushPoint.x+handSize.x)/(2.*handSize.x),(brushPoint.y+8.)/(handSize.y+8.));
  handUV=clamp(handUV,vec2(.5/256.,.5/512.),vec2(1.-.5/256.,1.-.5/512.));
  vec4 paint=texture2D(handAtlas,vec2((handColumn+handUV.x)/3.,handUV.y));
  // inkColor is still the shared live room-tinted color. Divide its original
  // pigment out so the atlas RGB is not colored brown a second time.
  color=paint.rgb*(inkColor/max(inkBaseColor,vec3(.001)));
  coverage=paint.a;
 }
 gl_FragColor=vec4(color,coverage);
 #include <colorspace_fragment>
}`;

export function createClockPigment(handAtlas,color){
 const inkColor=new THREE.Color(color);
 const material=new THREE.ShaderMaterial({
  uniforms:{handAtlas:{value:handAtlas},inkColor:{value:inkColor},inkBaseColor:{value:inkColor.clone()},handSize:{value:new THREE.Vector2(0,0)},handColumn:{value:0}},
  vertexShader:clockPigmentVertex,fragmentShader:clockPigmentFragment,
  transparent:true,depthWrite:false,depthTest:false,toneMapped:false,
 });
 // Preserve the existing continuous day/night updates and cloned hand colors.
 material.color=inkColor;
 return material;
}
