const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
/** Colors are converted by THREE.Color into the same linear light space as
 * the existing shaders. Golden color is strongest in direct light and water;
 * rose-tinted ambient pigment gives shaded paint the requested sunset mood. */
export function createDaylightPalette(THREE,altitude){
 const color=s=>new THREE.Color(s),day=smooth(-10,4,altitude);
 const gold=(1-smooth(5,29,altitude))*smooth(-9,1,altitude);
 return {
  day,gold,
  skyTop:color('#171e34').lerp(color('#a0c0ce'),day).lerp(color('#d6a5a0'),gold*.90),
  skyHorizon:color('#333c58').lerp(color('#e5e9df'),day).lerp(color('#edcfb2'),gold*.95),
  sunColor:color('#f7eed8').lerp(color('#efd0af'),gold),
  roomTint:color('#7d85a5').multiplyScalar(.5).lerp(color('#f3f1ec'),day).lerp(color('#d5b7bb'),gold*.45),
  directColor:color('#fff7ea').lerp(color('#edc296'),gold),
  directIntensity:1.5+.70*gold,
  ambientIntensity:(.32+.83*day)*(1-.28*gold),
  ambientSky:color('#8795b7').lerp(color('#f6f2ed'),day).lerp(color('#d6cbdc'),gold*.25),
  ambientGround:color('#49516a').lerp(color('#96918a'),day).lerp(color('#7d6f83'),gold*.30)
 };
}
