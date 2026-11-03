// Camera-space reconstruction of the painting. The tilted support plane's
// vanishing line is the river bank, not the middle of the browser canvas.
export const STUDY_ART={width:1672,height:941,cx:836,cy:470.5,horizon:330};
export const FLOOR_Y=-270,DESK_HEIGHT=205;
// West-southwest window: the October setting sun crosses the painted panes.
export const STUDY_WINDOW_AZIMUTH=250;
export function windowFaceDepth(distance){return distance*(1.-planeScale(690));}
export function windowPaneDepth(distance){return windowFaceDepth(distance)-72;}
export function windowPaintDepth(id,p,distance){
 const face=windowFaceDepth(distance),pane=windowPaneDepth(distance);
 if(id===10)return face+62;
 // The object feet meet the forward ledge at y449; only the painted lip
 // continues farther towards the room below that support line.
 if(id===9){const ledge=face+62;return p.y<=449?pane+(ledge-pane)*Math.max(0,Math.min(1,(p.y-427)/22)):ledge+8*Math.max(0,Math.min(1,(p.y-449)/20));}
 const outer=Math.max(Math.max(0,Math.min(1,(432-p.x)/54)),Math.max(0,Math.min(1,(p.x-1334)/58)));
 return pane+(face-pane)*outer;
}
export const DESK={frontLeft:[97,577],frontRight:[1076,577],rearLeft:[291.5,512],rearRight:[1012.8,512],frontFeet:[[116,823.4],[1050,823.4]],rearFeet:[[307,693.6],[995,693.6]]};
export function planeScale(y,height=0){return (STUDY_ART.cy-STUDY_ART.horizon-FLOOR_Y-height)/(y-STUDY_ART.horizon);}
export function atScale(x,y,t,distance){return [(x-STUDY_ART.cx)*t,(STUDY_ART.cy-y)*t,distance*(1-t)];}
export function onSupport(x,y,height,distance){return atScale(x,y,planeScale(y,height),distance);}
export function atFoot(x,y,footY,distance){return atScale(x,y,planeScale(footY),distance);}
export function floorNormal(distance){const tilt=(STUDY_ART.cy-STUDY_ART.horizon)/distance,scale=Math.hypot(1,tilt);return [0,1/scale,tilt/scale];}
export function solarDirection(altitude,azimuth,distance){const r=Math.PI/180,e=altitude*r,a=(azimuth-STUDY_WINDOW_AZIMUTH)*r,theta=Math.atan((STUDY_ART.cy-STUDY_ART.horizon)/distance),c=Math.cos(e),forward=Math.cos(a)*c;return [Math.sin(a)*c,Math.cos(theta)*Math.sin(e)+Math.sin(theta)*forward,Math.sin(theta)*Math.sin(e)-Math.cos(theta)*forward];}
export function directionPixel(direction,distance){const [x,y,z]=direction;return z<-.01?[STUDY_ART.cx+distance*x/-z,STUDY_ART.cy-distance*y/-z]:null;}
