import {LAPTOP_SCREEN,registerPaintPoint,registeredWorldPoint,fullLaptopScreenView} from './brush-study-laptop-view.js?v=shoreline-passage-20261019a';

const PORTAL_LAYERS=[['sky',.12],['mountains',.4],['lake',.7],['shoreline',1.1],['foreground',1.75]];
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const xyz=(value,fallback=[0,0,1])=>[0,1,2].map(index=>finite(Array.isArray(value)?value[index]:value?.[['x','y','z'][index]],fallback[index]));

/** Native sampling offsets, independent of viewport resolution and frame rate. */
export function sampleLaptopPortal({eye=[0,0,1],homeEye=[0,0,1],pointer=[0,0],hover=0,time=0,reduced=false}={}){
 const a=xyz(eye),b=xyz(homeEye),still=typeof reduced==='function'?Boolean(reduced()):Boolean(reduced?.matches??reduced);
 const angle=(point,axis)=>Math.atan2(point[axis],Math.max(.001,Math.abs(point[2])));
 const viewX=clamp(angle(a,0)-angle(b,0),-.8,.8)*180,viewY=clamp(angle(a,1)-angle(b,1),-.8,.8)*180;
 const wet=clamp(typeof hover==='boolean'?Number(hover):finite(hover),0,1),t=finite(time);
 const px=clamp(finite(pointer?.[0]),-1,1)*wet*14,py=clamp(finite(pointer?.[1]),-1,1)*wet*14;
 return PORTAL_LAYERS.map(([name,depth])=>{
  let x=still?0:(viewX+px)*depth,y=still?0:(viewY+py)*depth;
  if(name==='lake'&&!still){x+=Math.sin(t*.43)*.32;y+=Math.sin(t*.31)*.13;}
  const total=Math.abs(x)+Math.abs(y);if(total>28){x*=28/total;y*=28/total;}
  return {name,x,y};
 });
}

export function containedLaptopScreenView(THREE,corners,fov,aspect){
 const view=fullLaptopScreenView(THREE,corners,fov,aspect),[tl,tr,br,bl]=corners;
 const width=Math.max(tr.distanceTo(tl),br.distanceTo(bl)),height=Math.max(tl.distanceTo(bl),tr.distanceTo(br));
 const tangent=Math.tan(THREE.MathUtils.degToRad(fov/2));
 const screenRight=new THREE.Vector3().crossVectors(view.up,view.normal).normalize();
 // Skewed support corners have different depths in the corrected eye basis;
 // fitting edge lengths alone can clip a diagonal on wide viewports.
 const distance=Math.max(...corners.flatMap(point=>{const delta=point.clone().sub(view.center),depth=delta.dot(view.normal);return [depth+Math.abs(delta.dot(screenRight))/(tangent*aspect*.64),depth+Math.abs(delta.dot(view.up))/(tangent*.57)];}),width/(2*tangent*aspect*.64),height/(2*tangent*.57));
 return {...view,distance,position:view.center.clone().addScaledVector(view.normal,distance)};
}

/** Carry the real aperture just beyond the unfinished desktop painting.
 * White margins belong to the paper stage, rather than limiting the dolly. */
export function portalLaptopScreenView(THREE,corners,fov,aspect,viewport={}){
 const view=fullLaptopScreenView(THREE,corners,fov,aspect);
 const width=Number.isFinite(viewport.width)&&viewport.width>0?viewport.width:finite(globalThis.innerWidth,1280);
 const height=Number.isFinite(viewport.height)&&viewport.height>0?viewport.height:finite(globalThis.innerHeight,width/aspect);
 const phone=width<=600,stageWidth=Math.min(phone?width*.95:1180,width*(phone?.95:.88));
 const stageHeight=height<=600?height*.87:Math.min(phone?680:720,height*.78);
 const halfWidth=stageWidth/width*1.05,halfHeight=stageHeight/height*1.05;
 const target=[[-halfWidth,-halfHeight],[halfWidth,-halfHeight],[halfWidth,halfHeight],[-halfWidth,halfHeight]];
 const probe=new THREE.PerspectiveCamera(fov,aspect,.01,100000);probe.up.copy(view.up);
 const contains=(quad,[x,y])=>{
  const turns=quad.map((point,index)=>{const next=quad[(index+1)%4];return (next.x-point.x)*(y-point.y)-(next.y-point.y)*(x-point.x);});
  return turns.every(value=>value>=-1e-9)||turns.every(value=>value<=1e-9);
 };
 const minimum=Math.max(.02,...corners.map(point=>point.clone().sub(view.center).dot(view.normal)+.02));
 function covers(distance){
  probe.position.copy(view.center).addScaledVector(view.normal,distance);probe.lookAt(view.center);probe.updateMatrixWorld();
  const quad=corners.map(point=>point.clone().project(probe));
  return quad.every(point=>Number.isFinite(point.x)&&Number.isFinite(point.y))&&target.every(point=>contains(quad,point));
 }
 let near=Math.max(minimum,view.distance);
 for(let pass=0;pass<30&&!covers(near);pass++)near=(near+minimum)/2;
 let far=near*2;
 for(let pass=0;pass<30&&covers(far);pass++){near=far;far*=1.6;}
 for(let pass=0;pass<30;pass++){const middle=(near+far)/2;if(covers(middle))near=middle;else far=middle;}
 const distance=near;
 return {...view,distance,position:view.center.clone().addScaledVector(view.normal,distance),stage:{width:stageWidth,height:stageHeight,halfWidth,halfHeight}};
}

const portalVertex='varying vec2 portalUv;void main(){portalUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const portalFragment=`
 varying vec2 portalUv;uniform sampler2D painting;uniform vec2 offset,crop;uniform vec3 paperLight;uniform float presence;
 void main(){
  vec2 point=(portalUv-.5)*crop+.5+vec2(offset.x/1586.,-offset.y/992.);
  vec4 pigment=texture2D(painting,point);
  gl_FragColor=vec4(pigment.rgb*paperLight,pigment.a*presence);
  #include <colorspace_fragment>
 }`;
const recessFragment=`
 varying vec2 portalUv;uniform float presence;
 void main(){
  vec2 p=portalUv;
  float grain=sin(p.x*157.+p.y*31.)*.0018+sin(p.x*63.-p.y*119.)*.0022;
  float left=(1.-smoothstep(.002,.045,p.x+grain))*.18;
  float right=(1.-smoothstep(.002,.025,1.-p.x+grain))*.11;
  float upper=(1.-smoothstep(.003,.055,1.-p.y+grain))*.15;
  float lower=(1.-smoothstep(.002,.016,p.y+grain))*.08;
  gl_FragColor=vec4(.19,.20,.17,max(max(left,right),max(upper,lower))*presence);
  #include <colorspace_fragment>
 }`;

// Independent native pigment surfaces live behind one measured aperture.
// Their virtual depth follows the viewer without duplicating painted actors.
export function createLaptopLandscapeSurface({THREE,lid,landscape,uniforms={},camera,getHomeEye,reduced=false}={}){
 if(!THREE||!lid||typeof landscape?.paintTo!=='function')throw new Error('A painted lid and registered landscape are required');
 const center=LAPTOP_SCREEN.reduce((sum,[x,y])=>[sum[0]+x/4,sum[1]+y/4],[0,0]);
 const spanX=Math.max(...LAPTOP_SCREEN.map(point=>point[0]))-Math.min(...LAPTOP_SCREEN.map(point=>point[0]));
 const spanY=Math.max(...LAPTOP_SCREEN.map(point=>point[1]))-Math.min(...LAPTOP_SCREEN.map(point=>point[1]));
 const points=LAPTOP_SCREEN.map(([x,y])=>registerPaintPoint(lid,[center[0]+(x-center[0])*(1-1/spanX),center[1]+(y-center[1])*(1-1/spanY)]));
 if(points.some(point=>!point))throw new Error('The live landscape must stay inside its painted display');
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=400;
 const context=canvas.getContext('2d',{alpha:false});
 function canvasTexture(image){const texture=new THREE.CanvasTexture(image);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;return texture;}
 const texture=canvasTexture(canvas),textures=[texture];
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(12),3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,1,1,1,1,0,0,0],2));geometry.setIndex([0,2,1,0,3,2]);
 const fallbackMaterial=new THREE.MeshBasicMaterial({map:texture,color:0xffffff,side:THREE.DoubleSide,transparent:true,opacity:1,depthWrite:false,depthTest:true,toneMapped:false});
 const group=new THREE.Group();group.name='Laptop layered watercolor portal';lid.add(group);
 const fallback=new THREE.Mesh(geometry,fallbackMaterial);fallback.name='Laptop live painted landscape';fallback.renderOrder=lid.renderOrder+.01;fallback.frustumCulled=false;fallback.visible=false;group.add(fallback);
 const layers=[],materials=[fallbackMaterial];let recess=null;
 const cover=Math.max(640/1586,400/992),crop=new THREE.Vector2(640/(1586*cover*1.022),400/(992*cover*1.022));
 const inverse=new THREE.Matrix4(),normal=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),origin=new THREE.Vector3(),liveEye=new THREE.Vector3();
 const homeAtCreation=camera?.getWorldPosition(new THREE.Vector3())||new THREE.Vector3(0,0,1700);
 let lastTexture=-Infinity,disposed=false,last=0,hoverAmount=0,pointerX=0,pointerY=0,readyAt=null,portalScale=1.022,pose=sampleLaptopPortal({reduced:true});
 const isReduced=()=>typeof reduced==='function'?Boolean(reduced()):Boolean(reduced?.matches??reduced);
 function prepare(){
  if(layers.length)return true;
  const native=landscape.getPortalLayers?.();if(!Array.isArray(native)||native.length!==5||native.some(layer=>!layer.canvas?.width||!layer.canvas?.height))return false;
  for(let index=0;index<native.length;index++){
   const layerTexture=canvasTexture(native[index].canvas);textures.push(layerTexture);
   const material=new THREE.ShaderMaterial({uniforms:{painting:{value:layerTexture},offset:{value:new THREE.Vector2()},crop:{value:crop},paperLight:{value:new THREE.Color(1,1,1)},presence:{value:1}},vertexShader:portalVertex,fragmentShader:portalFragment,side:THREE.DoubleSide,transparent:true,depthWrite:false,depthTest:true,toneMapped:false});
   const mesh=new THREE.Mesh(geometry,material);mesh.name=`Laptop portal ${native[index].name}`;mesh.userData.landscapeLayer=native[index].name;mesh.renderOrder=lid.renderOrder+.011+index*.001;mesh.frustumCulled=false;group.add(mesh);layers.push(mesh);materials.push(material);
  }
  const material=new THREE.ShaderMaterial({uniforms:{presence:{value:1}},vertexShader:portalVertex,fragmentShader:recessFragment,side:THREE.DoubleSide,transparent:true,depthWrite:false,depthTest:true,toneMapped:false});
  recess=new THREE.Mesh(geometry,material);recess.name='Laptop painted inner recess';recess.renderOrder=lid.renderOrder+.02;recess.frustumCulled=false;group.add(recess);materials.push(material);fallback.visible=false;return true;
 }
 function basisEye(value){const point=new THREE.Vector3(...xyz(value,homeAtCreation.toArray())).sub(origin);return [point.dot(right),point.dot(up),point.dot(normal)];}
 function update(now=performance.now(),{pointer=[0,0],hover=false}={}){
  if(disposed)return false;
  if(!Number.isFinite(now))now=last+16.7;
  const dt=last?clamp((now-last)/1000,0,.05):.0167;last=now;
  lid.updateWorldMatrix(true,false);
  const world=points.map(point=>registeredWorldPoint(THREE,point));
  origin.set(0,0,0);world.forEach(point=>origin.addScaledVector(point,.25));
  right.subVectors(world[1],world[0]).normalize();up.subVectors(world[0],world[3]).normalize();normal.crossVectors(right,up).normalize();if(normal.z<0)normal.negate();up.crossVectors(normal,right).normalize();
  inverse.copy(lid.matrixWorld).invert();const positions=geometry.attributes.position;
  world.forEach((point,index)=>{point.addScaledVector(normal,.12).applyMatrix4(inverse);positions.setXYZ(index,point.x,point.y,point.z);});positions.needsUpdate=true;
  const day=clamp(Number.isFinite(uniforms.day?.value)?uniforms.day.value:1,0,1),room=uniforms.roomTint?.value,light=.66+.34*day;
  fallbackMaterial.color.setRGB(light*(.94+.06*(room?.r??1)),light*(.95+.05*(room?.g??1)),light*(.96+.04*(room?.b??1)));
  const presence=lid.material?.uniforms?.laptopPresence?.value,alpha=Number.isFinite(presence)?clamp(presence,0,1):1;fallbackMaterial.opacity=alpha;
  const layered=prepare();
  if(layered){
   if(readyAt===null)readyAt=now;
   const still=isReduced(),blend=1-Math.exp(-dt*7),targetHover=typeof hover==='boolean'?Number(hover):clamp(finite(hover),0,1);
   pointerX+=(clamp(finite(pointer?.[0]),-1,1)-pointerX)*blend;pointerY+=(clamp(finite(pointer?.[1]),-1,1)-pointerY)*blend;hoverAmount+=(targetHover-hoverAmount)*blend;
   if(camera?.getWorldPosition)camera.getWorldPosition(liveEye);else liveEye.copy(homeAtCreation);
   let home;try{home=getHomeEye?.()||homeAtCreation;}catch{home=homeAtCreation;}
   const reveal=still?1:clamp((now-readyAt)/240,0,1);
   portalScale=1.022+.043*reveal;crop.set(640/(1586*cover*portalScale),400/(992*cover*portalScale));
   pose=sampleLaptopPortal({eye:basisEye(liveEye),homeEye:basisEye(home),pointer:[pointerX,pointerY],hover:hoverAmount,time:now*.001,reduced:still}).map(point=>({...point,x:point.x*reveal,y:point.y*reveal}));
   layers.forEach((mesh,index)=>{mesh.material.uniforms.offset.value.set(pose[index].x,pose[index].y);mesh.material.uniforms.paperLight.value.copy(fallbackMaterial.color);mesh.material.uniforms.presence.value=alpha;});
   recess.material.uniforms.presence.value=alpha;return true;
  }
  if(now-lastTexture>=1000/30&&landscape.paintTo(context,canvas.width,canvas.height)){lastTexture=now;texture.needsUpdate=true;fallback.visible=true;}
  return fallback.visible;
 }
 return {update,setOccluded(occluded){group.visible=!occluded;},getPose(){const result=pose.map(point=>({...point}));Object.defineProperty(result,'portalScale',{value:portalScale});return result;},dispose(){if(disposed)return;disposed=true;group.removeFromParent();geometry.dispose();materials.forEach(material=>material.dispose());textures.forEach(texture=>texture.dispose());canvas.width=canvas.height=1;}};
}
