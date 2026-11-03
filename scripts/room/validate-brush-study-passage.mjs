import assert from 'node:assert/strict';
import {mapPaintedScreen,interpolatePaintedCorners} from '../../public/brush-study-passage.js';

let checks=0;
function close(actual,expected,note,tolerance=1e-6){
 checks++;assert.ok(Math.abs(actual-expected)<=tolerance,`${note}: ${actual} ≠ ${expected}`);
}
function matrixOf(css){
 assert.ok(/^matrix3d\([^()]+\)$/.test(css),'The mapping must be a CSS matrix3d');checks++;
 const matrix=css.slice(9,-1).split(',').map(Number);
 assert.equal(matrix.length,16);assert.ok(matrix.every(Number.isFinite));checks+=2;
 return matrix;
}
function project(matrix,[x,y]){
 const w=matrix[3]*x+matrix[7]*y+matrix[15];
 return [(matrix[0]*x+matrix[4]*y+matrix[12])/w,(matrix[1]*x+matrix[5]*y+matrix[13])/w];
}
function localCorners({left,top,width,height}){
 return [[left,top],[left+width,top],[left+width,top+height],[left,top+height]];
}
function intersection([a,b],[c,d]){
 const rx=b[0]-a[0],ry=b[1]-a[1],sx=d[0]-c[0],sy=d[1]-c[1];
 const t=((c[0]-a[0])*sy-(c[1]-a[1])*sx)/(rx*sy-ry*sx);
 return [a[0]+rx*t,a[1]+ry*t];
}
function verify(source,corners,offset){
 const matrix=matrixOf(mapPaintedScreen({source,corners,offset}));
 localCorners(source).forEach((point,i)=>project(matrix,point).forEach((value,axis)=>close(value,corners[i][axis]-(axis?offset.y:offset.x),'Registered screen corner')));
 // Projective mappings preserve diagonals. Their center is their target
 // intersection, which differs from a bilinear quad's average center.
 const expected=intersection([corners[0],corners[2]],[corners[1],corners[3]]);
 const center=project(matrix,[source.left+source.width/2,source.top+source.height/2]);
 center.forEach((value,axis)=>close(value,expected[axis]-(axis?offset.y:offset.x),'Projective diagonal intersection'));
 const p0=project(matrix,[source.left,source.top]),p1=project(matrix,[source.left+source.width*.3,source.top+source.height*.3]),p2=project(matrix,[source.left+source.width,source.top+source.height]);
 close((p1[0]-p0[0])*(p2[1]-p0[1])-(p1[1]-p0[1])*(p2[0]-p0[0]),0,'Straight painted diagonal',1e-5);
 return matrix;
}

const source={left:178,top:119,width:625,height:371};
verify(source,[[320,238],[620,215],[664,418],[345,459]],{x:27,y:18});
verify({left:14,top:16,width:212,height:145},[[710,348],[425,322],[401,541],[734,568]],{x:201,y:89});
verify({left:410,top:202,width:890,height:502},[[-154,95],[942,41],[875,593],[-201,601]],{x:-31,y:46});
// An untransformed screen inside an offset scene must produce identity.
const offset={x:63,y:84},identity=verify(source,localCorners(source).map(([x,y])=>[x+offset.x,y+offset.y]),offset);
identity.forEach((value,i)=>close(value,[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1][i],'Identity passage'));

const a=[[2,3],[8,3],[8,9],[2,9]],b=[[12,13],[28,13],[28,29],[12,29]];
assert.deepEqual(interpolatePaintedCorners(a,b,0),a);checks++;
assert.deepEqual(interpolatePaintedCorners(a,b,1),b);checks++;
assert.deepEqual(interpolatePaintedCorners(a,b,-4),a);checks++;
assert.deepEqual(interpolatePaintedCorners(a,b,4),b);checks++;
close(interpolatePaintedCorners(a,b,.25)[0][0],3.5625,'Eased intermediate passage');
const copy=interpolatePaintedCorners(a,b,.5);copy[0][0]=99;assert.equal(a[0][0],2);checks++;

const degenerate=[[[0,0],[10,10],[0,10],[10,0]],[[0,0],[10,0],[3,3],[0,10]],[[0,0],[10,0],[20,0],[30,0]],[[0,0],[0,0],[10,10],[0,10]],[[0,0],[10,0],[10,Infinity],[0,10]]];
for(const corners of degenerate){assert.equal(mapPaintedScreen({source,corners}), '');checks++;}
for(const rectangle of [{...source,width:0},{...source,height:-1},{...source,left:NaN}]){assert.equal(mapPaintedScreen({source:rectangle,corners:a}), '');checks++;}
assert.equal(mapPaintedScreen(), '');checks++;
assert.deepEqual(interpolatePaintedCorners([],b,.5),[]);checks++;
console.log(`Painted screen passage: ${checks} projective mapping and interpolation checks pass.`);
