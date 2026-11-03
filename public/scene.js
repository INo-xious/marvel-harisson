import * as THREE from 'three';
import { OutlineEffect } from './vendor/OutlineEffect.js';
import { WatercolorPost } from './watercolor-post.js';
import { createClockPigment } from './clock-pigment.js';
import { applyPaintedMacBookMaterials, createPaintedLaptopContact } from './painted-materials.js';
import { addPaintedLaptopInk } from './laptop-ink.js';
import { PaintedCat } from './cat.js';
import { PaintedFoliage } from './foliage.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { minutesInOsaka } from './time.js';
import { ART, OBJECTS, WALL_CLOCK, pointInPolygon } from './art-layout.js';
import { CAMERA, MACBOOK, LAMP_POSITION, artToWorld, project3D, sunForTime } from './painted-geometry.js';
import { LAPTOP_CENTER, LAPTOP_OFFSET, LAPTOP_SHADOW_PATCH, LAPTOP_SHADOW_FADE_GLSL, placedLaptopWorldCoordinates as laptopWorldCoordinates } from './laptop-placement.js';
import { createDaylightPalette } from './daylight-palette.js';
import { outsideFragment, roomFragment, paintedLayer, createReflectionColumns, roomLighting } from './outside.js';

const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const point=(x,y,z=0)=>new THREE.Vector3(x-ART.width/2,ART.height/2-y,z);
const vec=p=>new THREE.Vector3(...p);
const color=s=>new THREE.Color(s);
const LAPTOP_OPEN=-110*Math.PI/180;
const OPEN_SCREEN=laptopWorldCoordinates().screenQuad.map(project3D);
const OPEN_SCREEN_WIDTH=Math.max(...OPEN_SCREEN.map(p=>p[0]))-Math.min(...OPEN_SCREEN.map(p=>p[0]));
const DESK_PATCH=LAPTOP_SHADOW_PATCH;


export class RoomScene{
 constructor(canvas,callbacks={}){
  this.canvas=canvas;this.callbacks=callbacks;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.scene=new THREE.Scene();this.scene.background=color('#b5afa5');this.world=new THREE.Scene();this.overlay=new THREE.Scene();
  this.camera=new THREE.OrthographicCamera(-836,836,470.5,-470.5,.1,10000);this.camera.position.set(0,0,2500);
  this.worldCamera=new THREE.PerspectiveCamera();const c=CAMERA.three;
  this.worldCamera.position.fromArray(c.position);this.worldCamera.up.fromArray(c.up);this.worldCamera.lookAt(...c.target);
  this.baseProjection=new THREE.Matrix4().fromArray(c.columnMajor);this.worldCamera.projectionMatrix.copy(this.baseProjection);this.worldCamera.projectionMatrixInverse.copy(this.baseProjection).invert();this.worldCamera.updateMatrixWorld(true);
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.autoClear=false;this.renderer.toneMapping=THREE.NoToneMapping;
  this.watercolorPost=new WatercolorPost(this.renderer,{reduced:this.reduced});
  this.outline=new OutlineEffect(this.renderer,{defaultThickness:.0007,defaultColor:[.24,.26,.24],defaultAlpha:.45});
  this.outline.autoClear=false; // Preserve the painted scene beneath the model.
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
  this.ambient=new THREE.HemisphereLight('#f3f1ed','#767780',2.3);this.world.add(this.ambient);
  this.sun=new THREE.DirectionalLight('#fff5e6',2);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);
  Object.assign(this.sun.shadow.camera,{left:-.85,right:.85,top:.85,bottom:-.85,near:.05,far:18});this.sun.shadow.bias=-.00006;this.sun.shadow.normalBias=.002;this.sun.shadow.radius=7;
  this.sun.target.position.set(.2,0,0);this.world.add(this.sun,this.sun.target);
  this.moonLight=new THREE.DirectionalLight('#acbded',0);this.moonLight.target.position.copy(this.sun.target.position);this.moonLight.castShadow=true;this.moonLight.shadow.mapSize.set(1024,1024);Object.assign(this.moonLight.shadow.camera,{left:-.85,right:.85,top:.85,bottom:-.85,near:.05,far:18});this.moonLight.shadow.bias=-.00006;this.moonLight.shadow.normalBias=.001;this.moonLight.shadow.radius=3;this.world.add(this.moonLight,this.moonLight.target);
  this.lampLight=new THREE.PointLight('#ffe4c2',0,2.4,1.5);this.lampLight.position.copy(vec(LAMP_POSITION));this.lampLight.castShadow=true;this.lampLight.shadow.mapSize.set(1024,1024);this.lampLight.shadow.camera.near=.02;this.lampLight.shadow.camera.far=2.4;this.lampLight.shadow.bias=-.0001;this.lampLight.shadow.normalBias=.0006;this.lampLight.shadow.radius=4;this.world.add(this.lampLight);
  this.entered=false;this.loaded=false;this.busy=false;this.laptopOpen=false;this.lampOn=true;this.music=false;this.focus=0;this.intro=0;
  this.raycaster=new THREE.Raycaster();this.hitMeshes=[];this.tweens=[];this.lastFrame=0;this.time=0;this.petStart=-100;this.pan=innerWidth<700?ART.width*.34:ART.width/2;
  this.currentPan=this.pan;this.lighting={day:1,golden:0,lamp:.15};this.shadowReceivers=[];
  this.resize();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);this.bindPointer();
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.contextLost=true;callbacks.onContextLost?.();});canvas.addEventListener('webglcontextrestored',()=>location.reload());document.addEventListener('visibilitychange',()=>this.lastFrame=0);
  this.draw=this.draw.bind(this);this.frame=requestAnimationFrame(this.draw);
 }
 async load(){
  const tx=new THREE.TextureLoader();
  const [room,city,clouds,asset,cat,cityLights,foliage,foreground,watercolor,paper,skyWash,pigment,laptopLid,laptopDeck,laptopRibbon,clockHands]=await Promise.all([
   tx.loadAsync('/assets/painted/room-clean-plate.png'),tx.loadAsync('/assets/painted/city-water.png'),tx.loadAsync('/assets/painted/cloud-streaks.png'),new GLTFLoader().loadAsync('/assets/painted/macbook-painted.glb'),
   tx.loadAsync('/assets/painted/cat-puppet-atlas.png'),tx.loadAsync('/assets/painted/city-window-lights.png'),tx.loadAsync('/assets/painted/foliage-layer.png'),tx.loadAsync('/assets/painted/foreground-monstera.png'),
   tx.loadAsync('/assets/painted/watercolor-room.png'),tx.loadAsync('/assets/painted/paper-wash.png'),tx.loadAsync('/assets/painted/sky-wash.png'),tx.loadAsync('/assets/painted/pigment-wash.png'),
   tx.loadAsync('/assets/laptop-lid.png'),tx.loadAsync('/assets/laptop-deck.png'),tx.loadAsync('/assets/laptop-edge-ribbon.png'),tx.loadAsync('/assets/clock-hand-atlas.png')
  ]);
  for(const t of [room,city,clouds,cat,cityLights,foliage,foreground,watercolor]){t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;}
  paper.colorSpace=THREE.NoColorSpace;paper.wrapS=paper.wrapT=THREE.RepeatWrapping;paper.minFilter=paper.magFilter=THREE.LinearFilter;paper.generateMipmaps=false;
  skyWash.colorSpace=THREE.NoColorSpace;skyWash.minFilter=skyWash.magFilter=THREE.LinearFilter;skyWash.generateMipmaps=false;
  pigment.colorSpace=THREE.NoColorSpace;pigment.wrapS=pigment.wrapT=THREE.MirroredRepeatWrapping;pigment.minFilter=pigment.magFilter=THREE.LinearFilter;pigment.generateMipmaps=false;
  for(const plate of [laptopLid,laptopDeck,laptopRibbon,clockHands]){
   plate.colorSpace=THREE.SRGBColorSpace;plate.wrapS=plate.wrapT=THREE.ClampToEdgeWrapping;
   plate.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());plate.minFilter=THREE.LinearMipmapLinearFilter;plate.magFilter=THREE.LinearFilter;plate.generateMipmaps=true;
  }
  this.watercolorPost.setPigment(pigment);
  this.outside=paintedLayer(outsideFragment,{paperMap:{value:paper},pigmentMap:{value:pigment},skyWashMap:{value:skyWash},cityMap:{value:city},cloudMap:{value:clouds},cityLights:{value:cityLights},lightColumns:{value:createReflectionColumns(cityLights.image)},time:{value:0},day:{value:1},gold:{value:0},night:{value:0},moonPixel:{value:new THREE.Vector2(-100,-100)},moonVisible:{value:0},moonPhase:{value:.5},sunVisible:{value:0},sunPixel:{value:new THREE.Vector2(800,200)},skyTop:{value:color('#81b5d1')},skyHorizon:{value:color('#c9dce2')},sunColor:{value:color('#ffdab0')}},-10);
  this.paint=paintedLayer(roomFragment,{...roomLighting.uniforms,uRoom:{value:room},uWatercolorRoom:{value:watercolor},uTime:{value:0},uPetAge:{value:-1},roomTint:{value:color('#eeeeed')},lampPower:{value:.1},solarPoint:{value:new THREE.Vector2(.7,.2)},sunStrength:{value:0},sunWarmth:{value:0},hoverCenter:{value:new THREE.Vector2(-10,-10)},hoverSize:{value:new THREE.Vector2(.04,.05)},hoverPower:{value:0}},0,{transparent:true});
  this.scene.add(this.outside,this.paint);
  this.foliage=new PaintedFoliage(foliage,this.reduced,foreground);this.scene.add(this.foliage.group);
  this.actor=asset.scene;this.actor.position.copy(vec(LAPTOP_CENTER));this.world.add(this.actor);
  this.lid=this.actor.getObjectByName('MacBookLid');this.screen=this.actor.getObjectByName('MacBookScreen');if(!this.lid||!this.screen)throw Error('The articulated MacBook could not load.');
  this.actor.traverse(o=>{if(!o.isMesh)return;this.hitMeshes.push(o);o.castShadow=true;o.receiveShadow=false;const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){m.roughness=Math.max(.65,m.roughness||0);m.metalness=Math.min(.28,m.metalness||0);}});
  const painted=applyPaintedMacBookMaterials(THREE,this.actor,{lid:laptopLid,deck:laptopDeck,roomTint:this.paint.material.uniforms.roomTint});for(const m of painted.materials)m.userData.outlineParameters={visible:!!m.map,thickness:.0007,color:[.24,.26,.24],alpha:.45};
  this.laptopInk=addPaintedLaptopInk(THREE,this.actor,{width:1.22,opacity:.72,detailWidth:.72,detailOpacity:.52,color:0x53534e,ribbon:laptopRibbon,roomTint:this.paint.material.uniforms.roomTint});
  this.actor.traverse(o=>o.layers.enable(1)); // silhouette mask for the painted edge
  const screenMap=this.screenTexture();screenMap.flipY=false;this.screen.material=new THREE.MeshBasicMaterial({map:screenMap,toneMapped:false});this.screen.material.userData.outlineParameters={visible:false};
  this.lid.rotation.x=0;this.actor.updateMatrixWorld(true);
  this.cat=new PaintedCat(cat,this.reduced);this.overlay.add(this.cat.group);
  this.paint.material.uniforms.roomShadowPigment={value:pigment};
  this.makeReceivers(pigment);this.makeClock(clockHands);this.makeDust();this.makePetReaction();this.makeHoverReticle();
  this.loaded=true;this.canvas.parentElement.classList.add('loaded');if(this.pendingTime)this.setTime(...this.pendingTime);this.renderer.compile(this.scene,this.camera);this.renderer.compile(this.world,this.worldCamera);this.renderer.compile(this.overlay,this.camera);
 }
 screenTexture(){
  const c=document.createElement('canvas');c.width=1200;c.height=780;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,1200,780);g.addColorStop(0,'#e0e9da');g.addColorStop(1,'#9eae9c');x.fillStyle=g;x.fillRect(0,0,1200,780);
  x.fillStyle='#f4f2e4';x.fillRect(0,0,1200,45);x.fillStyle='#526049';x.font='22px Georgia';x.fillText('m.  My workspace',30,30);x.font='58px Georgia';x.fillText('Ideas, in progress.',80,188);x.fillStyle='#65745e';x.font='24px sans-serif';x.fillText('One folder at a time.',82,238);
  for(let i=0;i<3;i++){const u=95+i*285;x.fillStyle=['#d7b875','#97b4a0','#c39786'][i];x.beginPath();x.roundRect(u,345,65,28,5);x.fill();x.beginPath();x.roundRect(u,360,154,112,9);x.fill();x.fillStyle='#46563e';x.font='25px sans-serif';x.fillText(['Projects','Labs','Field notes'][i],u+16,518);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
 }
 receiverGeometry(polygon,height,holes=[]){
  const shape=new THREE.Shape(polygon.map(p=>new THREE.Vector2(...p)));for(const hole of holes)shape.holes.push(new THREE.Path(hole.map(p=>new THREE.Vector2(...p))));
  const g=new THREE.ShapeGeometry(shape),a=g.attributes.position;for(let i=0;i<a.count;i++){const p=artToWorld([a.getX(i),a.getY(i)],height);a.setXYZ(i,...p);}g.computeVertexNormals();return g;
 }
 makeReceivers(pigment){
  // One simple, convex patch on the actual empty tabletop. No holes or bed
  // overlays: neither the duvet nor painted objects are a flat receiver.
  const material=new THREE.ShadowMaterial({color:'#403d4d',opacity:.34,transparent:true,side:THREE.DoubleSide,depthWrite:false});
  material.userData.outlineParameters={visible:false};
  material.onBeforeCompile=shader=>{
   shader.uniforms.shadowPigment={value:pigment};
   shader.vertexShader='varying vec2 receiverPixel;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
     receiverPixel=uv;`);
   // UVs from ShapeGeometry remain original art pixels after world projection.
   shader.fragmentShader='uniform sampler2D shadowPigment;\nvarying vec2 receiverPixel;\nfloat edgeDistance(vec2 a,vec2 b,vec2 p){vec2 e=b-a;return (e.x*(p.y-a.y)-e.y*(p.x-a.x))/length(e); }\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <colorspace_fragment>',`
    ${LAPTOP_SHADOW_FADE_GLSL}
    gl_FragColor.a*=clamp(.84+(texture2D(shadowPigment,receiverPixel/173.).g-.70)*.9,.72,.96);
    #include <colorspace_fragment>`);
  };
  const shadow=new THREE.Mesh(this.receiverGeometry(DESK_PATCH,-.0005),material);shadow.receiveShadow=true;shadow.renderOrder=1;this.world.add(shadow);this.shadowReceivers.push(shadow);
  this.contact=createPaintedLaptopContact(THREE,{width:MACBOOK.width,depth:MACBOOK.depth,opacity:.34});this.contact.position.add(vec(LAPTOP_OFFSET));this.world.add(this.contact);
 }
 makeClock(handAtlas){
  this.clockGroup=new THREE.Group();this.clockGroup.position.copy(point(...WALL_CLOCK.anchor,1));this.clockGroup.scale.set(...WALL_CLOCK.scale);this.clockGroup.renderOrder=3;
  this.clockInk=createClockPigment(handAtlas,'#65564b');
  this.clockSecondInk=createClockPigment(handAtlas,'#876c59');const ink=this.clockInk;
  const hand=(length,width,material=ink,column=0)=>{const group=new THREE.Group(),s=new THREE.Shape();s.moveTo(-width,-8);s.lineTo(-width*.65,length*.68);s.lineTo(0,length);s.lineTo(width*.65,length*.68);s.lineTo(width,-8);s.closePath();const stroke=material.clone();stroke.uniforms.inkColor=material.uniforms.inkColor;stroke.uniforms.handSize.value.set(width,length);stroke.uniforms.handColumn.value=column;group.add(new THREE.Mesh(new THREE.ShapeGeometry(s),stroke));this.clockGroup.add(group);return group;};
  this.clockHour=hand(30,1.7);this.clockMinute=hand(45,1.1,ink,1);this.clockSecond=hand(47,.42,this.clockSecondInk,2);this.clockSecond.position.z=.2;const pin=new THREE.Mesh(new THREE.CircleGeometry(2.4,16),ink);pin.position.z=1;this.clockGroup.add(pin);this.scene.add(this.clockGroup);
 }
 makeDust(){
  if(this.reduced)return;const data=[];for(let i=0;i<25;i++)data.push(270+Math.random()*960-ART.width/2,ART.height/2-(150+Math.random()*490),5);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data,3));this.dustStart=new Float32Array(data);this.dust=new THREE.Points(g,new THREE.PointsMaterial({color:'#ffe2ac',size:1.25,sizeAttenuation:false,transparent:true,opacity:.18,depthWrite:false}));this.overlay.add(this.dust);
 }
 makePetReaction(){
  const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');x.font='64px Georgia';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#f4b7aa';x.fillText('♥',48,48);const map=new THREE.CanvasTexture(c);this.hearts=[];
  for(let i=0;i<3;i++){const m=new THREE.SpriteMaterial({map,transparent:true,opacity:0,depthTest:false}),s=new THREE.Sprite(m);s.scale.set(21,21,1);this.overlay.add(s);this.hearts.push(s);}
 }
 makeHoverReticle(){
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.strokeStyle='#fff2c9';x.lineWidth=3;x.shadowColor='#795945';x.shadowBlur=3;
  for(const [a,b,sx,sy] of [[18,18,1,1],[110,18,-1,1],[18,110,1,-1],[110,110,-1,-1]]){x.beginPath();x.moveTo(a,b+sy*18);x.lineTo(a,b);x.lineTo(a+sx*18,b);x.stroke();}
  this.reticle=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,opacity:0,depthTest:false}));this.overlay.add(this.reticle);
 }
 resize(){
  const b=this.canvas.parentElement.getBoundingClientRect();this.width=b.width;this.height=b.height;this.mobile=this.width<700;this.aspect=this.width/this.height;
  // Full bleed at every aspect ratio. Cropped views can be explored by dragging,
  // edge hover, or the accessible side controls; no solid letterbox bands.
  this.viewHeight=Math.min(ART.height,ART.width/this.aspect);this.viewWidth=this.viewHeight*this.aspect;this.homeY=(ART.height-this.viewHeight)/2-Math.min(16,(ART.height-this.viewHeight)*.08);
  this.camera.left=-this.viewWidth/2;this.camera.right=this.viewWidth/2;this.camera.top=this.viewHeight/2;this.camera.bottom=-this.viewHeight/2;this.camera.updateProjectionMatrix();this.renderer.setPixelRatio?.(Math.min(globalThis.devicePixelRatio||1,3,Math.sqrt(12000000/(this.width*this.height))));this.renderer.setSize(this.width,this.height,false);
  const bufferSize=new THREE.Vector2();this.renderer.getDrawingBufferSize?.(bufferSize);if(bufferSize.x)this.watercolorPost?.resize(bufferSize.x,bufferSize.y,this.mobile);
  this.homePan=this.mobile?clamp(ART.width*.34,this.viewWidth/2,ART.width-this.viewWidth/2):this.viewWidth/2+Math.min(12,(ART.width-this.viewWidth)*.08);this.pan=this.homePan;this.currentPan=this.pan;
  const outer=this.mobile?this.width-16:Math.min(1040,this.width*.88,(this.height-110)*1.54+34),inner=outer-(this.mobile?16:34);this.focusZoom=this.viewWidth*(inner/this.width)/OPEN_SCREEN_WIDTH;
  const computer=document.querySelector('#computer');if(computer){computer.style.width=`${outer}px`;computer.style.setProperty('--laptop-screen-height',`${inner/1.54}px`);}
 }
 bindPointer(){
  const relative=e=>{const b=this.canvas.getBoundingClientRect();return[e.clientX-b.left,e.clientY-b.top];};
  this.canvas.addEventListener('pointermove',e=>{if(!this.entered||!this.loaded||this.drag||e.buttons||this.busy||this.focus||this.reduced||this.edgePan){this.watercolorPost.stop();return;}const[x,y]=relative(e),p=new THREE.Vector3(x/this.width*2-1,1-y/this.height*2,0).unproject(this.camera);this.watercolorPost.move(p.x+836,470.5-p.y,performance.now());});
  this.canvas.addEventListener('pointerleave',()=>this.watercolorPost.stop());
  this.canvas.addEventListener('pointerdown',()=>this.watercolorPost.stop());
  this.canvas.addEventListener('pointerdown',e=>{const[x,y]=relative(e);this.drag={x,y,pan:this.pan,moved:false};this.canvas.setPointerCapture(e.pointerId);});
  this.canvas.addEventListener('pointermove',e=>{const[x,y]=relative(e);if(this.drag){const dx=x-this.drag.x;if(Math.abs(dx)>6)this.drag.moved=true;this.pan=clamp(this.drag.pan-dx/this.width*this.viewWidth,this.viewWidth/2,ART.width-this.viewWidth/2);}if(!this.entered||this.busy||!this.loaded)return;const id=this.hit(x,y);this.edgePan=!this.mobile&&!id&&!this.drag?(x<42?-1:x>this.width-42?1:0):0;this.setHover(id);this.canvas.style.cursor=id?'pointer':this.mobile?'grab':'default';this.callbacks.onHover?.(id,e.clientX,e.clientY);});
  this.canvas.addEventListener('pointerup',e=>{const[x,y]=relative(e);if(this.entered&&!this.busy&&!this.drag?.moved){const id=this.hit(x,y);if(id)this.callbacks.onAction?.(id);}this.drag=null;});this.canvas.addEventListener('pointercancel',()=>this.drag=null);this.canvas.addEventListener('pointerleave',()=>{this.edgePan=0;this.setHover(null);this.callbacks.onHover?.(null);});
  this.canvas.parentElement.addEventListener('wheel',e=>this.panWheel(e),{passive:false});
 }
 panWheel(event){
  if(!this.entered||!this.loaded||this.busy||this.focus||event.ctrlKey||document.querySelector('dialog[open]'))return;
  // Native horizontal trackpad/mouse-wheel motion, including Shift + wheel.
  const delta=event.deltaX||(event.shiftKey?event.deltaY:0);if(!delta)return;
  const units=event.deltaMode===1?16:event.deltaMode===2?this.width:1;
  const next=clamp(this.pan+delta*units*this.viewWidth/this.width,this.viewWidth/2,ART.width-this.viewWidth/2);
  if(this.viewWidth<ART.width){this.watercolorPost?.stop();event.preventDefault();this.pan=next;this.edgePan=0;this.setHover(null);this.callbacks.onHover?.(null);if(this.reduced)this.currentPan=next;}
 }
 setHover(id){this.hover=id;}
 reveal(id){const p=OBJECTS[id]?.anchor;if(p){const q=this.toScreen(p);if(q.x>=125&&q.x<=this.width-125)return;this.watercolorPost?.stop();this.pan=clamp(p[0],this.viewWidth/2,ART.width-this.viewWidth/2);this.edgePan=0;}}
 panBy(direction){this.watercolorPost?.stop();this.pan=clamp(this.pan+direction*this.viewWidth*.65,this.viewWidth/2,ART.width-this.viewWidth/2);}
 hit(x,y){
  if(!this.loaded)return null;const n=new THREE.Vector2(x/this.width*2-1,1-y/this.height*2);this.raycaster.setFromCamera(n,this.worldCamera);if(this.raycaster.intersectObjects(this.hitMeshes,false).length)return'laptop';
  const p=new THREE.Vector3(n.x,n.y,0).unproject(this.camera),ax=p.x+836,ay=470.5-p.y;
  for(const[id,o]of Object.entries(OBJECTS))if(id!=='laptop'&&pointInPolygon(ax,ay,o.polygon))return id;
  let result=null,nearest=this.mobile?27:14;for(const[id,o]of Object.entries(OBJECTS)){const q=this.toScreen(o.anchor),d=Math.hypot(x-q.x,y-q.y);if(d<nearest){nearest=d;result=id;}}return result;
 }
 toScreen(p){const q=point(...p).project(this.camera);return{x:(q.x+1)*this.width/2,y:(1-q.y)*this.height/2,visible:Math.abs(q.x)<.99&&Math.abs(q.y)<.98&&this.focus<.3};}
 project(){const p={};for(const[id,o]of Object.entries(OBJECTS))p[id]=this.toScreen(o.anchor);p.radioTop=this.toScreen([879,477]);p.radioWidth=134*this.width/this.viewWidth*this.camera.zoom;p.pan={left:this.pan>this.viewWidth/2+2,right:this.pan<ART.width-this.viewWidth/2-2};this.callbacks.onProject?.(p);}
 setTime(date,light){
  const palette=createDaylightPalette(THREE,light.altitude);
  this.pendingTime=[date,light];this.lightState=light;this.clockDate=date;this.clockAt=performance.now();this.lighting.day=palette.day;this.lighting.golden=palette.gold;if(!this.loaded)return;
  const sun=sunForTime(light),day=this.lighting.day,gold=this.lighting.golden;this.solar=sun;
  this.sun.position.copy(this.sun.target.position).addScaledVector(vec(sun.direction),6);
  const direct=smooth(-1,9,light.altitude)*smooth(.015,.20,-sun.direction[2]);this.directStrength=direct;this.sun.intensity=direct*palette.directIntensity;this.sun.color.copy(palette.directColor);this.sun.castShadow=direct>.001;
  this.ambient.intensity=palette.ambientIntensity;this.ambient.color.copy(palette.ambientSky);this.ambient.groundColor.copy(palette.ambientGround);
  const u=this.outside.material.uniforms;u.day.value=day;u.gold.value=gold;u.sunVisible.value=sun.visible?1:0;if(sun.screen)u.sunPixel.value.set(...sun.screen);
  const night=1-smooth(-10,2,light.altitude),moon=sunForTime(light.moon);u.night.value=night;u.moonVisible.value=moon.visible?1:0;u.moonPhase.value=light.moon.phase;if(moon.screen)u.moonPixel.value.set(...moon.screen);
  this.moonStrength=night*light.moon.fraction*smooth(0,12,light.moon.altitude)*smooth(.015,.20,-moon.direction[2]);this.moonLight.position.copy(this.moonLight.target.position).addScaledVector(vec(moon.direction),6);this.moonLight.intensity=this.moonStrength*.28;this.moonLight.castShadow=this.moonStrength>.01;
  u.skyTop.value.copy(palette.skyTop);u.skyHorizon.value.copy(palette.skyHorizon);u.sunColor.value.copy(palette.sunColor);
  this.paint.material.uniforms.roomTint.value.copy(palette.roomTint);
  const ru=this.paint.material.uniforms;if(sun.screen)ru.solarPoint.value.set(sun.x/ART.width,sun.y/ART.height);ru.sunStrength.value=direct;ru.sunWarmth.value=gold;
  roomLighting.update(day>.2?sun:moon,day>.2?direct:this.moonStrength*.45,gold);
  this.scene.background.copy(color('#222941').lerp(color('#b5afa5'),day));this.setLamp(this.lampOn);
 }
 setLamp(on){
  this.lampOn=on;this.lighting.lamp=on?lerp(.92,.16,this.lighting.day):0;this.lampLight.intensity=on?lerp(.25,.055,this.lighting.day):0;
  // ShadowMaterial combines shadow maps multiplicatively. Use the dominant
  // local source so a weak daytime lamp cannot add a second equally dark cast.
  this.lampLight.castShadow=on&&this.lighting.day<.65;
  if(this.moonLight)this.moonLight.castShadow=(this.moonStrength||0)>.08&&!this.lampLight.castShadow;
  for(const r of this.shadowReceivers)r.material.opacity=Math.max((this.directStrength||0)*lerp(.28,.34,this.lighting.golden||0),(this.moonStrength||0)*.22,this.lampLight.castShadow?lerp(.40,.15,this.lighting.day):0);
 }
 setMusic(on){this.music=on;}
 enter(){this.entered=true;this.animate(this,'intro',1,this.reduced?0:1000);}
 animate(object,key,to,duration){this.tweens=this.tweens.filter(t=>!(t.object===object&&t.key===key));if(!duration){object[key]=to;return Promise.resolve();}return new Promise(resolve=>this.tweens.push({object,key,from:object[key],to,duration,start:performance.now(),resolve}));}
 async focusLaptop(open){
  if(this.busy)return;this.busy=true;this.laptopOpen=open;this.setHover(null);this.callbacks.onHover?.(null);
  if(open){await this.animate(this.lid.rotation,'x',LAPTOP_OPEN,this.reduced?0:900);await this.animate(this,'focus',1,this.reduced?0:1050);}else{await this.animate(this,'focus',0,this.reduced?0:900);await this.animate(this.lid.rotation,'x',0,this.reduced?0:700);document.querySelectorAll('.dock-item').forEach(b=>b.classList.toggle('active',b.dataset.action==='room'));}this.busy=false;
 }
 petCat(){this.petStart=this.time;this.petNow=performance.now();this.cat?.pet(this.reduced?performance.now()/1000:this.time);}
 nudge(id){if(!this.reduced)this.pulse={id,start:performance.now()};}
 reset(){this.pan=this.homePan;if(this.laptopOpen&&!this.busy)this.focusLaptop(false);}
 updateCamera(){
  let focusPoint=point(535,503);if(this.loaded){this.actor.updateMatrixWorld(true);if(!this.screen.geometry.boundingBox)this.screen.geometry.computeBoundingBox();const p=this.screen.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(this.screen.matrixWorld);focusPoint=point(...project3D(p.toArray()));}
  const cx=lerp(this.currentPan-836,focusPoint.x,this.focus),cy=lerp(this.homeY||0,focusPoint.y,this.focus);this.camera.position.set(cx,cy,2500);this.camera.lookAt(cx,cy,0);this.camera.zoom=lerp(1,this.focusZoom,this.focus);this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld(true);
  const z=this.camera.zoom,adjust=new THREE.Matrix4().set(ART.width/this.viewWidth*z,0,0,-2*cx/this.viewWidth*z,0,ART.height/this.viewHeight*z,0,-2*cy/this.viewHeight*z,0,0,1,0,0,0,0,1);
  this.worldCamera.projectionMatrix.multiplyMatrices(adjust,this.baseProjection);this.worldCamera.projectionMatrixInverse.copy(this.worldCamera.projectionMatrix).invert();this.worldCamera.updateMatrixWorld(true);
 }
 draw(now){
  this.frame=requestAnimationFrame(this.draw);if(document.hidden||this.contextLost||now-this.lastFrame<1000/(this.mobile?30:60)-.5)return;const dt=Math.min(.06,this.lastFrame?(now-this.lastFrame)/1000:.022);this.lastFrame=now;
  for(let i=this.tweens.length-1;i>=0;i--){const t=this.tweens[i],p=clamp((now-t.start)/t.duration,0,1);t.object[t.key]=lerp(t.from,t.to,ease(p));if(p===1){this.tweens.splice(i,1);t.resolve();}}
  if(this.entered&&!this.busy&&!this.focus&&this.edgePan)this.pan=clamp(this.pan+this.edgePan*dt*280,this.viewWidth/2,ART.width-this.viewWidth/2);this.currentPan=THREE.MathUtils.damp(this.currentPan,this.pan,7,dt);this.updateCamera();
  if(this.loaded){
   if(!this.reduced)this.time+=dt;const u=this.paint.material.uniforms;u.uTime.value=this.time;u.uPetAge.value=this.reduced?-1:this.time-this.petStart;this.outside.material.uniforms.time.value=this.time;u.lampPower.value=THREE.MathUtils.damp(u.lampPower.value,this.lighting.lamp,7,dt);
   this.clockInk.color.set('#65564b').multiply(u.roomTint.value);this.clockSecondInk.color.set('#876c59').multiply(u.roomTint.value);
   const pulse=this.pulse&&now-this.pulse.start<900?this.pulse:null,id=pulse?.id||this.hover;const power=pulse?Math.sin((now-pulse.start)/900*Math.PI)*1.3:(this.hover ? .55 : 0);
   if(id&&OBJECTS[id]){const o=OBJECTS[id];u.hoverCenter.value.set(o.anchor[0]/ART.width,o.anchor[1]/ART.height);u.hoverSize.value.set(id==='cat'?.065:.045,id==='lamp'?.065:.045);const xs=o.polygon.map(p=>p[0]),ys=o.polygon.map(p=>p[1]),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys);this.reticle.position.copy(point(...o.anchor,10));const s=1+Math.sin(this.time*3)*.025;this.reticle.scale.set((w+16)*s,(h+16)*s,1);}
   u.hoverPower.value=THREE.MathUtils.damp(u.hoverPower.value,power,9,dt);this.reticle.material.opacity=THREE.MathUtils.damp(this.reticle.material.opacity,id&&this.focus<.1?.65:0,10,dt);
   if(this.clockDate){const seconds=this.clockDate.getUTCSeconds()+this.clockDate.getUTCMilliseconds()/1000+(now-this.clockAt)/1000,minute=minutesInOsaka(this.clockDate)+seconds/60;this.clockHour.rotation.z=-(minute/60%12)*Math.PI/6;this.clockMinute.rotation.z=-(minute%60)*Math.PI/30;this.clockSecond.rotation.z=-seconds*Math.PI/30;}
   if(this.dust){const p=this.dust.geometry.attributes.position;for(let i=0;i<p.count;i++){p.array[i*3]=this.dustStart[i*3]+Math.sin(this.time*.14+i)*4;p.array[i*3+1]=this.dustStart[i*3+1]+Math.sin(this.time*.1+i*.7)*6;}p.needsUpdate=true;this.dust.material.opacity=this.lighting.day*.17;}

   this.laptopInk?.setOpening(this.lid.rotation.x);
   this.foliage?.update(this.time,this.paint.material.uniforms.roomTint.value);
   this.cat?.update(this.reduced?now/1000:this.time,this.paint.material.uniforms.roomTint.value,this.hover==='cat');
   const pet=(now-(this.petNow||-100000))/1000;this.hearts.forEach((s,i)=>{const t=pet-i*.28;s.visible=t>=0&&t<2;s.material.opacity=s.visible?Math.sin(clamp(t/2,0,1)*Math.PI)*.9:0;s.position.copy(point(1485+i*20+Math.sin(t*2+i)*4,585-(this.reduced?0:t*32),12));});
   if(!this.lastProjection||now-this.lastProjection>80){this.project();this.lastProjection=now;}
  }
  this.watercolorPost.update(dt,now,{camera:this.camera,viewWidth:this.viewWidth,viewHeight:this.viewHeight,day:this.lighting.day});
  if(this.loaded)this.watercolorPost.renderMask(this.world,this.worldCamera);this.watercolorPost.begin();this.renderer.render(this.scene,this.camera);if(this.loaded){this.renderer.clearDepth();this.outline.render(this.world,this.worldCamera);this.renderer.clearDepth();this.renderer.render(this.overlay,this.camera);}
  this.watercolorPost.finish();
 }
}
