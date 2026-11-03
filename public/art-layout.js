import { LAPTOP_TARGET } from './laptop-placement.js';
// Coordinates in the original painted plate, independent of viewport size.
export const ART = { width: 1672, height: 941 };
export const WALL_CLOCK = {anchor:[1439,116.5],scale:[.71,.85,1],polygon:[[1438,50],[1474,62],[1498,98],[1500,138],[1477,171],[1440,184],[1407,173],[1382,137],[1383,92],[1405,62]]};
export const OBJECTS = {
  cat: { anchor: [1548,624], polygon: [[1440,580],[1490,575],[1620,587],[1662,620],[1648,677],[1490,670],[1444,642]] },
  laptop: LAPTOP_TARGET,
  radio: { anchor: [879,521], polygon: [[814,489],[828,478],[922,478],[941,495],[943,550],[821,565]] },
  lamp: { anchor: [246,389], polygon: [[186,345],[261,332],[286,357],[319,405],[202,434]] },
  awards: { anchor: [181,195], polygon: [[151,160],[207,160],[211,209],[193,224],[196,241],[167,241],[168,218],[155,203]] },
  clock: WALL_CLOCK,
  linkedin: { anchor: [60,273], polygon: [[28,240],[88,242],[91,300],[26,300]] },
  github: { anchor: [129,274], polygon: [[108,244],[153,248],[154,300],[99,300]] },
  email: { anchor: [190,278], polygon: [[161,255],[215,260],[218,300],[160,300]] },
  about: { anchor: [248,641], polygon: [[193,610],[304,614],[327,634],[309,670],[179,664]] },
};
export function pointInPolygon(x,y,points){
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const [xi,yi]=points[i],[xj,yj]=points[j];
    if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
  }
  return inside;
}
