/**
 * Map a painted scene's local screen rectangle onto the projected room lid.
 * Corners are [top-left, top-right, bottom-right, bottom-left] CSS-pixel pairs.
 * offset is the scene element's untransformed layout origin in page pixels.
 * Apply the returned matrix with CSS transform-origin: 0 0.
 * This module is pure and has no browser or rendering dependencies.
 */
const finite=Number.isFinite;
const pair=point=>Array.isArray(point)&&point.length>=2&&finite(point[0])&&finite(point[1]);
const validCorners=points=>Array.isArray(points)&&points.length===4&&points.every(pair);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);
const format=value=>Math.abs(value)<1e-14?'0':Number(value.toPrecision(15)).toString();

export function mapPaintedScreen({source,corners,offset={x:0,y:0}}={}){
 if(!source||!validCorners(corners)||!offset)return '';
 const {left,top,width,height}=source;
 if(![left,top,width,height,offset.x,offset.y].every(finite)||width<=0||height<=0)return '';
 const q=corners.map(([x,y])=>[x-offset.x,y-offset.y]);
 const edges=q.map((point,i)=>Math.hypot(point[0]-q[(i+1)%4][0],point[1]-q[(i+1)%4][1]));
 const scale=Math.max(...edges),tolerance=scale*scale*1e-10;
 if(!finite(scale)||scale<=1e-8||Math.min(...edges)<=scale*1e-10)return '';
 // A convex quad has one orientation throughout. Concave, crossed and
 // collapsed inputs cannot form a finite screen passage through its inside.
 const turns=q.map((point,i)=>cross(point,q[(i+1)%4],q[(i+2)%4]));
 const orientation=Math.sign(turns[0]);
 if(!orientation||turns.some(turn=>turn*orientation<=tolerance))return '';
 const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=q;
 const dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3;
 const dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3;
 let g=0,h=0;
 if(Math.abs(dx3)+Math.abs(dy3)>scale*1e-11){
  const denominator=dx1*dy2-dx2*dy1;
  if(!finite(denominator)||Math.abs(denominator)<=tolerance)return '';
  g=(dx3*dy2-dx2*dy3)/denominator;
  h=(dx1*dy3-dx3*dy1)/denominator;
 }
 // The normalized source square must not cross the projective horizon.
 if([1,1+g,1+h,1+g+h].some(w=>!finite(w)||w<=1e-9))return '';
 const a=x1-x0+g*x1,b=x3-x0+h*x3;
 const d=y1-y0+g*y1,e=y3-y0+h*y3;
 // Compose with u=(x-left)/width and v=(y-top)/height. CSS matrices use
 // column-major storage, with projective division supplied by their w row.
 const ax=a/width,by=b/height,dx=d/width,ey=e/height,gx=g/width,hy=h/height;
 const tx=x0-ax*left-by*top,ty=y0-dx*left-ey*top,w=1-gx*left-hy*top;
 const matrix=[ax,dx,0,gx,by,ey,0,hy,0,0,1,0,tx,ty,0,w];
 if(!matrix.every(finite))return '';
 return `matrix3d(${matrix.map(format).join(',')})`;
}

export function interpolatePaintedCorners(a,b,progress=0){
 if(!validCorners(a)||!validCorners(b))return [];
 const t=Math.max(0,Math.min(1,finite(progress)?progress:0));
 const eased=t*t*(3-2*t);
 return a.map(([x,y],i)=>[x+(b[i][0]-x)*eased,y+(b[i][1]-y)*eased]);
}
