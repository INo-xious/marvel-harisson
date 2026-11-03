/** Native painted color stays attached to the existing articulated chassis.
 * Each panel samples its authored plate once. Normals, geometry, hinge and
 * shadow-casting meshes are unchanged.
 */
export function paintedDiffuseRamp(){
 const data=new Uint8Array(256);
 for(let i=0;i<256;i++){
  const n=i/255*2-1,t=Math.max(0,Math.min(1,(n+.8)/1.75));
  data[i]=Math.round(255*(.23+.77*t*t*(3-2*t)));
 }
 return data;
}
export function applyPaintedMacBookMaterials(THREE,model,{lid=null,deck=null,roomTint=null}={}){
 const gradient=new THREE.DataTexture(paintedDiffuseRamp(),256,1,THREE.RedFormat);
 gradient.minFilter=THREE.LinearFilter;gradient.magFilter=THREE.LinearFilter;
 gradient.generateMipmaps=false;gradient.colorSpace=THREE.NoColorSpace;gradient.needsUpdate=true;
 const tint=roomTint||{value:new THREE.Color(1,1,1)};
 const converted=new Map(),materials=[];
 function convert(source,mesh){
  if(converted.has(source))return converted.get(source);
  const isLid=/Aluminum_Silver.*Lid/.test(source.name);
  const isSilver=/Aluminum_Silver/.test(source.name),isTrack=/Glass_Trackpad/.test(source.name);
  const isEdge=/Aluminum_Edge/.test(source.name);
  const plate=(isLid?lid:(isSilver||isTrack||isEdge)?deck:null);
  // The new plates already contain the complete silver pigment color. Tinting
  // them with the former grey albedo would darken the brushwork a second time.
  const paintColor=plate?new THREE.Color(1,1,1):source.color.clone();
  if(plate&&isEdge)paintColor.multiplyScalar(.80);
  if(plate&&isTrack)paintColor.multiplyScalar(.95);
  const material=new THREE.MeshToonMaterial({color:paintColor,map:plate?null:source.map,gradientMap:gradient,side:source.side,transparent:source.transparent,opacity:source.opacity,alphaTest:source.alphaTest,alphaMap:source.alphaMap,depthWrite:source.depthWrite});
  material.name=source.name+'__NativePaint';material.userData={...source.userData,paintedAlbedo:true,sourceAlbedoMap:source.map,outlineParameters:{visible:false}};
  if(plate){
   mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox;
   const bounds=new THREE.Vector4(b.min.x,b.min.z,Math.max(b.max.x-b.min.x,.0001),Math.max(b.max.z-b.min.z,.0001));
   // The trackpad uses its physical crop of the deck painting, preserving
   // registration across the recess instead of repeating the entire plate.
   const crop=isTrack?new THREE.Vector4(.28919,.69711,.42163,.23870):new THREE.Vector4(0,0,1,1);
   material.onBeforeCompile=shader=>{
    shader.uniforms.nativePanel={value:plate};shader.uniforms.nativePanelBounds={value:bounds};
    shader.uniforms.nativePanelCrop={value:crop};shader.uniforms.nativeRoomTint=tint;
    shader.vertexShader='varying vec3 vPaintLocal;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vPaintLocal=position;');
    shader.fragmentShader='uniform sampler2D nativePanel;\nuniform vec4 nativePanelBounds,nativePanelCrop;\nuniform vec3 nativeRoomTint;\nvarying vec3 vPaintLocal;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 vec2 nativeUV=clamp((vPaintLocal.xz-nativePanelBounds.xy)/nativePanelBounds.zw,0.,1.);
 nativeUV=nativePanelCrop.xy+nativeUV*nativePanelCrop.zw;
 // Top of the authored painting is the panel's hinge / low-Z edge.
 diffuseColor.rgb*=texture2D(nativePanel,vec2(nativeUV.x,1.-nativeUV.y)).rgb;`);
    // Keep a restrained response to the actual lights, including the lamp,
    // while letting the native painting carry most of the visible modelling.
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
 outgoingLight=mix(diffuseColor.rgb*nativeRoomTint,outgoingLight,.26);
 #include <opaque_fragment>`);
   };
   material.customProgramCacheKey=()=> 'native-photopea-panel-v1';
  }
  converted.set(source,material);materials.push(material);return material;
 }
 model.traverse(o=>{if(!o.isMesh||o.name==='MacBookScreen')return;o.material=Array.isArray(o.material)?o.material.map(m=>convert(m,o)):convert(o.material,o);});
 return{gradient,materials};
}

/** Contact follows the actual rounded rectangular chassis footprint. This
 * replaces the old circular canvas blob; the live cast shadow stays separate.
 */
export function createPaintedLaptopContact(THREE,{width=.3126,depth=.2212,opacity=.28}={}){
 const pad=.027,span=new THREE.Vector2(width+pad*2,depth+pad*2);
 const material=new THREE.ShaderMaterial({
  uniforms:{contactSize:{value:span},contactHalf:{value:new THREE.Vector2(width/2,depth/2)},contactOpacity:{value:opacity},contactColor:{value:new THREE.Color('#47392f')}},
  vertexShader:'varying vec2 contactUV;void main(){contactUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec2 contactUV;uniform vec2 contactSize,contactHalf;uniform float contactOpacity;uniform vec3 contactColor;
  void main(){vec2 p=(contactUV-.5)*contactSize;float radius=.008;vec2 q=abs(p)-contactHalf+radius;float d=length(max(q,0.))+min(max(q.x,q.y),0.)-radius;float outside=max(d,0.);float a=contactOpacity*(.55*exp(-outside/.007)+.45*exp(-outside/.0022));gl_FragColor=vec4(contactColor,a);#include <colorspace_fragment>}`.replace(';#include',';\n#include'),
  transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,toneMapped:false
 });
 material.userData.outlineParameters={visible:false};
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(span.x,span.y),material);mesh.name='PaintedLaptopContact';mesh.rotation.x=-Math.PI/2;mesh.position.set(width/2,.0001,depth/2);mesh.renderOrder=2;mesh.raycast=()=>{};return mesh;
}
