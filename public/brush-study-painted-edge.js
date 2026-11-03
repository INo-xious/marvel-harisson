// Rasterize the existing bristles once. Five moving pigment surfaces can
// share this texture without re-running an SVG turbulence filter per frame.
let prepared;
export function preparePaintedEdge(element){
 if(!prepared)prepared=new Promise(resolve=>{
  const image=new Image();
  image.onload=()=>{
   const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=760;
   try{canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);resolve(`url("${canvas.toDataURL('image/png')}")`);}catch{resolve(null);}
   canvas.width=canvas.height=1;
  };
  image.onerror=()=>resolve(null);image.src='/assets/painted/desktop-paper-edge.svg';
 });
 prepared.then(mask=>{if(mask)element.style.setProperty('--layer-paper-mask',mask);});
 return prepared;
}
