/**
 * Window masks for the 1672 × 941 native room backdrop, before time tinting.
 * These masks separate the room wall, recessed frame, sill and sill objects.
 * Sample the same masks at ray-intersected wallArt when clipping the exterior.
 * Use upperPaperEdge on both backdrop and exterior; no mask uses screen noise.
 */
// Filled native leaf contours preserve pale washes and internal highlights.
// Small pigment voids were closed; larger gaps between branches remain open.
const studyLeafContours = [[[1315, 288], [1321, 289], [1320, 294], [1317, 294], [1315, 299], [1314, 307], [1315, 319], [1318, 320], [1318, 329], [1324, 329], [1324, 327], [1325, 329], [1331, 329], [1336, 335], [1339, 335], [1340, 337], [1339, 346], [1338, 339], [1333, 339], [1330, 341], [1330, 343], [1325, 344], [1325, 350], [1331, 350], [1332, 346], [1336, 346], [1336, 351], [1340, 352], [1335, 352], [1333, 354], [1332, 361], [1330, 361], [1330, 366], [1326, 367], [1326, 371], [1325, 368], [1316, 370], [1317, 380], [1321, 380], [1320, 386], [1322, 387], [1320, 387], [1320, 393], [1323, 395], [1328, 395], [1328, 393], [1334, 392], [1334, 398], [1339, 399], [1340, 402], [1340, 421], [1345, 421], [1347, 418], [1357, 418], [1357, 411], [1354, 411], [1353, 406], [1359, 406], [1359, 419], [1362, 420], [1367, 426], [1365, 432], [1361, 433], [1361, 438], [1365, 440], [1365, 446], [1362, 446], [1362, 441], [1356, 440], [1356, 438], [1351, 438], [1348, 439], [1348, 441], [1345, 441], [1345, 438], [1340, 437], [1338, 434], [1338, 430], [1340, 429], [1340, 422], [1337, 420], [1330, 420], [1327, 422], [1326, 435], [1328, 438], [1327, 445], [1325, 445], [1325, 447], [1324, 443], [1320, 443], [1318, 437], [1313, 437], [1313, 434], [1304, 431], [1305, 428], [1311, 426], [1311, 421], [1305, 421], [1302, 423], [1301, 420], [1297, 419], [1296, 416], [1292, 416], [1292, 398], [1289, 398], [1294, 395], [1296, 375], [1288, 375], [1288, 377], [1277, 378], [1263, 376], [1263, 378], [1258, 380], [1255, 376], [1248, 376], [1244, 379], [1244, 376], [1239, 376], [1236, 378], [1236, 376], [1233, 375], [1221, 375], [1221, 387], [1225, 388], [1221, 388], [1221, 393], [1215, 395], [1215, 400], [1219, 400], [1219, 402], [1222, 403], [1223, 418], [1219, 418], [1219, 423], [1210, 423], [1209, 426], [1205, 428], [1204, 435], [1202, 437], [1202, 446], [1208, 446], [1209, 442], [1220, 442], [1221, 444], [1220, 455], [1216, 459], [1213, 458], [1211, 452], [1203, 452], [1203, 458], [1207, 464], [1206, 472], [1219, 476], [1220, 484], [1223, 487], [1221, 497], [1218, 497], [1218, 499], [1217, 497], [1214, 497], [1212, 493], [1207, 493], [1207, 499], [1210, 505], [1209, 511], [1206, 512], [1204, 517], [1204, 522], [1216, 521], [1221, 530], [1221, 534], [1219, 534], [1217, 538], [1214, 538], [1213, 543], [1208, 539], [1208, 537], [1203, 537], [1202, 535], [1197, 535], [1197, 539], [1194, 542], [1190, 542], [1190, 547], [1193, 547], [1195, 550], [1195, 555], [1192, 557], [1192, 563], [1195, 570], [1192, 578], [1187, 579], [1185, 593], [1193, 593], [1195, 595], [1195, 608], [1199, 609], [1201, 620], [1199, 624], [1195, 624], [1194, 626], [1188, 625], [1186, 618], [1181, 618], [1181, 631], [1185, 632], [1185, 644], [1191, 645], [1191, 648], [1195, 648], [1199, 652], [1200, 662], [1203, 663], [1202, 665], [1180, 664], [1180, 658], [1183, 657], [1183, 645], [1178, 645], [1176, 648], [1169, 646], [1168, 633], [1165, 633], [1165, 611], [1167, 606], [1167, 613], [1176, 613], [1176, 611], [1177, 613], [1182, 613], [1182, 607], [1179, 603], [1181, 592], [1176, 592], [1172, 595], [1172, 591], [1168, 586], [1171, 579], [1182, 577], [1182, 570], [1186, 565], [1186, 558], [1179, 558], [1178, 561], [1175, 561], [1173, 558], [1171, 558], [1170, 552], [1172, 543], [1178, 539], [1182, 539], [1182, 524], [1180, 524], [1179, 518], [1170, 517], [1165, 529], [1165, 510], [1171, 509], [1174, 506], [1174, 497], [1165, 497], [1165, 481], [1176, 482], [1176, 479], [1180, 478], [1184, 455], [1178, 455], [1176, 463], [1173, 464], [1172, 472], [1168, 469], [1165, 459], [1168, 459], [1170, 456], [1170, 451], [1167, 449], [1168, 439], [1180, 438], [1181, 436], [1183, 440], [1190, 441], [1192, 432], [1193, 434], [1198, 434], [1200, 422], [1198, 419], [1198, 414], [1193, 413], [1193, 401], [1190, 393], [1191, 385], [1183, 385], [1183, 393], [1180, 401], [1173, 400], [1171, 398], [1171, 383], [1180, 383], [1179, 374], [1174, 374], [1173, 377], [1171, 374], [1171, 371], [1177, 372], [1179, 370], [1179, 364], [1177, 361], [1181, 357], [1181, 352], [1176, 352], [1176, 343], [1180, 342], [1181, 340], [1185, 340], [1187, 342], [1187, 348], [1184, 349], [1184, 354], [1191, 353], [1194, 355], [1194, 365], [1201, 368], [1202, 375], [1211, 375], [1211, 373], [1217, 369], [1217, 364], [1207, 361], [1207, 355], [1206, 353], [1203, 353], [1203, 350], [1207, 349], [1209, 346], [1213, 346], [1213, 340], [1203, 340], [1201, 342], [1200, 340], [1195, 339], [1196, 334], [1199, 334], [1199, 323], [1193, 323], [1190, 321], [1202, 319], [1213, 320], [1215, 322], [1215, 326], [1220, 327], [1220, 330], [1225, 330], [1225, 327], [1228, 327], [1229, 319], [1227, 318], [1226, 314], [1223, 314], [1222, 312], [1215, 309], [1214, 306], [1210, 306], [1209, 304], [1217, 303], [1217, 305], [1222, 305], [1222, 307], [1230, 306], [1230, 304], [1236, 305], [1241, 309], [1244, 319], [1257, 321], [1257, 316], [1254, 312], [1255, 303], [1261, 297], [1272, 299], [1273, 296], [1276, 296], [1277, 293], [1277, 295], [1285, 297], [1285, 304], [1296, 303], [1299, 309], [1303, 309], [1305, 311], [1305, 315], [1310, 315], [1313, 305], [1313, 299], [1310, 296], [1310, 290], [1314, 290]], [[1180, 404], [1183, 412], [1185, 412], [1185, 420], [1191, 422], [1190, 430], [1187, 431], [1182, 431], [1177, 424], [1171, 424], [1173, 423], [1173, 413], [1171, 411], [1174, 410], [1174, 408], [1177, 406], [1180, 406]], [[1201, 561], [1205, 562], [1205, 569], [1201, 569], [1199, 566]]];
const studyLeafGaps = [[[1280, 305], [1280, 315], [1278, 317], [1278, 322], [1284, 322], [1287, 316], [1293, 314], [1294, 307], [1288, 307], [1286, 310], [1285, 305]], [[1187, 476], [1186, 482], [1179, 483], [1178, 492], [1181, 499], [1180, 514], [1187, 518], [1187, 522], [1183, 524], [1183, 533], [1185, 535], [1185, 539], [1190, 539], [1193, 533], [1196, 533], [1196, 528], [1198, 528], [1198, 523], [1200, 522], [1200, 516], [1192, 516], [1186, 509], [1186, 503], [1189, 502], [1191, 497], [1197, 496], [1198, 493], [1198, 488], [1195, 488], [1195, 476]], [[1277, 318], [1278, 318], [1278, 322], [1274, 322], [1274, 323], [1271, 323], [1271, 324], [1270, 324], [1270, 325], [1269, 325], [1269, 326], [1267, 326], [1267, 321], [1268, 321], [1268, 319], [1270, 319], [1270, 320], [1275, 320], [1275, 319], [1277, 319]], [[1269, 335], [1271, 335], [1271, 336], [1272, 336], [1272, 338], [1273, 338], [1273, 339], [1272, 339], [1272, 341], [1271, 341], [1271, 342], [1270, 342], [1270, 343], [1269, 343], [1269, 344], [1265, 344], [1265, 343], [1266, 343], [1266, 341], [1267, 341], [1267, 340], [1268, 340], [1268, 338], [1269, 338]]];
function studyWindowPolygonGLSL(name,points,feather=1.15){
 const lo=[Math.min(...points.map(p=>p[0]))-feather,Math.min(...points.map(p=>p[1]))-feather];
 const hi=[Math.max(...points.map(p=>p[0]))+feather,Math.max(...points.map(p=>p[1]))+feather];
 const number=n=>Number(n).toFixed(2);
 return `float ${name}(vec2 p){if(p.x<${number(lo[0])}||p.x>${number(hi[0])}||p.y<${number(lo[1])}||p.y>${number(hi[1])})return 0.;float distanceToEdge=10000.,inside=0.;vec2 a,b,e;float t;\n`+points.map((a,i)=>{const b=points[(i+1)%points.length];return `a=vec2(${a.map(number)});b=vec2(${b.map(number)});e=b-a;t=clamp(dot(p-a,e)/max(dot(e,e),.01),0.,1.);distanceToEdge=min(distanceToEdge,length(p-a-e*t));if((a.y>p.y)!=(b.y>p.y)){if(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=1.-inside;}`;}).join('\n')+`return smoothstep(-${number(feather)},${number(feather)},distanceToEdge*(inside*2.-1.));}\n`;
}
const studyLeafGeometryGLSL=studyLeafContours.map((p,i)=>studyWindowPolygonGLSL('studyLeafContour'+i,p)).join('')+studyLeafGaps.map((p,i)=>studyWindowPolygonGLSL('studyLeafGap'+i,p,.65)).join('')+
 // The native mouth/rim begins at y375–380. Starting this matte at y383
 // removed its top wash and left the stems floating above an empty band.
 // Include a narrow root overlap so contour feathering cannot open a slit.
 studyWindowPolygonGLSL('studyPotContour',[[1221,375],[1228,375.5],[1237,375],[1244,376],[1254,375],[1263,375],[1272,376],[1281,375.5],[1290,375],[1298,378],[1302,381],[1300,393],[1298,405],[1294,431],[1292,441],[1285,448],[1242,449],[1233,441],[1225,408],[1221,394]],1.15);
const studyActorGeometryGLSL=
 studyWindowPolygonGLSL('studyLinkedInCase',[[747,402],[789,402],[793,405],[794,443],[790,449],[750,449],[744,444],[744,408]],1.)+
 studyWindowPolygonGLSL('studyLinkedInFoot',[[752,447],[782,447],[784,451],[780,454],[755,455],[751,452]],.9)+
 studyWindowPolygonGLSL('studyGithubCase',[[819,410],[866,410],[869,414],[869,445],[865,450],[821,450],[817,446],[817,414]],1.)+
 studyWindowPolygonGLSL('studyGithubFoot',[[825,447],[855,447],[859,451],[855,455],[832,455],[825,452]],.9)+
 studyWindowPolygonGLSL('studyMailCase',[[896,410],[940,410],[945,414],[945,445],[941,450],[897,450],[892,446],[892,414]],1.)+
 studyWindowPolygonGLSL('studyMailFoot',[[902,447],[933,447],[938,451],[934,455],[906,455],[901,452]],.9)+
 // The case ends at x1145. The brown column beginning x1147 belongs to
 // the recessed window frame and must never follow the radio's depth.
 studyWindowPolygonGLSL('studyRadioCase',[[1033,396],[1045,394],[1060,394],[1090,396],[1118,396],[1135,395],[1143,397],[1145,405],[1145,431],[1142,441],[1138,444],[1040,444],[1033,439],[1026,432],[1025,415],[1026,400]],1.15)+
 studyWindowPolygonGLSL('studyRadioLeftFoot',[[1041,442],[1049,443],[1049,448],[1046,452],[1040,452],[1039,448]],.85)+
 studyWindowPolygonGLSL('studyRadioRightFoot',[[1121,442],[1137,442],[1137,449],[1131,454],[1125,452]],.85);

export const studyWindowGLSL=`
${studyLeafGeometryGLSL}
${studyActorGeometryGLSL}
float studyWindowBand(float coordinate,float lo,float hi,float feather){
 return smoothstep(lo-feather,lo+feather,coordinate)*(1.-smoothstep(hi-feather,hi+feather,coordinate));
}
float studyWindowOval(vec2 p,vec2 center,vec2 radius){
 return 1.-smoothstep(.76,1.04,length((p-center)/radius));
}
float studyWindowWarm(vec3 ink){
 // Brown frame and cream reserves survive; blue city and water pigment do not.
 float warm=smoothstep(.006,.045,ink.r-ink.b)*smoothstep(-.014,.022,ink.r-ink.g);
 float darkNeutral=(1.-smoothstep(.22,.42,max(ink.r,max(ink.g,ink.b))))*(1.-smoothstep(.012,.034,ink.b-max(ink.r,ink.g)));
 return max(warm,darkNeutral);
}
float studyWindowPigment(vec3 ink){
 return 1.-smoothstep(.925,.997,min(ink.r,min(ink.g,ink.b)));
}
float studyWindowFrameBands(vec2 p){
 // Wide outer bands contain the warm recessed jambs. Internal bands stop
 // before the blue strips at x653 and x1171, rather than retaining those strips.
 float left=studyWindowBand(p.x,378.,437.,3.);
 float first=studyWindowBand(p.x,615.,649.,2.);
 float second=studyWindowBand(p.x,1140.,1168.,2.);
 float right=studyWindowBand(p.x,1332.,1392.,3.);
 return max(max(left,first),max(second,right))*(1.-smoothstep(426.,439.,p.y));
}
float studyWindowFrameCore(vec2 p){
 // Timber and its pale reserves form continuous material. Chroma is useful
 // on the outer brush fringe, but it must never perforate these support cores.
 float left=studyWindowBand(p.x,386.,425.,1.4);
 float first=studyWindowBand(p.x,621.,645.,1.)*smoothstep(49.,77.,p.y);
 float second=studyWindowBand(p.x,1146.,1165.,1.);
 float right=studyWindowBand(p.x,1337.,1380.,1.4);
 return max(max(left,first),max(second,right))*(1.-smoothstep(435.,442.,p.y));
}
float windowRegion(vec2 p){
 // Include the entire old painted view, narrow strips beside every mullion,
 // and the sill. The caller then puts its separated frame and objects back.
 return smoothstep(373.,378.,p.x)*(1.-smoothstep(1392.,1399.,p.x))*(1.-smoothstep(464.,470.,p.y));
}
float upperPaperEdge(vec2 p){
 // Broad bristle groups and a soft wash provide a dry edge over art y0–96.
 // The field remains fixed to the painting during camera movement.
 float crest=clamp(24.+12.*sin(p.x*.018+.7)+7.*sin(p.x*.051+1.9)+4.*sin(p.x*.099-.4),3.,47.);
 float spread=15.+5.*sin(p.x*.025+2.1);
 // Bristles perturb the edge itself. Interior paint becomes fully covered
 // once that edge passes; an x-only alpha plateau creates pale night bars.
 float bristleLift=2.6*sin(p.x*.31)+1.6*sin(p.x*.73+sin(p.x*.037));
 return smoothstep(crest+bristleLift,crest+spread+bristleLift,p.y);
}
float sillLeafShape(vec2 p){
 if(p.x<1162.||p.x>1375.||p.y<273.||p.y>667.)return 0.;
 float leaves=0.,air=0.;
 leaves=max(leaves,studyLeafContour0(p));
 leaves=max(leaves,studyLeafContour1(p));
 leaves=max(leaves,studyLeafContour2(p));
 air=max(air,studyLeafGap0(p));
 air=max(air,studyLeafGap1(p));
 air=max(air,studyLeafGap2(p));
 air=max(air,studyLeafGap3(p));
 return clamp(leaves*(1.-air),0.,1.);
}
float sillPlantShape(vec2 p){return max(sillLeafShape(p),studyPotContour(p));}
float studyWindowStroke(vec2 p,vec2 a,vec2 b,float width){
 vec2 e=b-a;float t=clamp(dot(p-a,e)/max(dot(e,e),.01),0.,1.);
 return 1.-smoothstep(width,width+1.,length(p-a-e*t));
}
float radioCaseShape(vec2 p){
 return max(studyRadioCase(p),max(studyRadioLeftFoot(p),studyRadioRightFoot(p)));
}
float sillItemPaint(vec2 p,vec3 ink){
 float pigment=studyWindowPigment(ink),warm=studyWindowWarm(ink);
 // Badge letters and radio highlights are solid paper reserves within close
 // painted silhouettes. Their feet are actors, not part of the backing ledge.
 float linkedIn=max(studyLinkedInCase(p),studyLinkedInFoot(p));
 float github=max(studyGithubCase(p),studyGithubFoot(p));
 float mail=max(studyMailCase(p),studyMailFoot(p));
 float radioBody=radioCaseShape(p);
 // Retain the native brushed perimeter without including the right mullion.
 float radioFringe=studyWindowBand(p.x,1024.,1144.,1.)*studyWindowBand(p.y,390.,445.,2.)*warm*pigment;
 radioBody=max(radioBody,radioFringe);
 // A close corridor around the actual handle excludes the unrelated leaves
 // and blue water that a rectangle above the radio would promote to an actor.
 float radioTop=studyWindowStroke(p,vec2(1068.,385.),vec2(1077.,381.),2.);
 radioTop=max(radioTop,studyWindowStroke(p,vec2(1077.,381.),vec2(1091.,381.),2.));
 radioTop=max(radioTop,studyWindowStroke(p,vec2(1091.,381.),vec2(1107.,385.),2.));
 radioTop=max(radioTop,studyWindowStroke(p,vec2(1107.,385.),vec2(1116.,389.),2.4));
 radioTop=max(radioTop,studyWindowStroke(p,vec2(1116.,389.),vec2(1115.,395.),2.2));
 float handleBrown=smoothstep(.004,.025,(ink.r-ink.g)-.70*(ink.g-ink.b));
 radioTop*=handleBrown*warm*pigment*(1.-smoothstep(.35,.60,max(ink.r,max(ink.g,ink.b))));
 // Plant material is a filled silhouette. Its pale washes are paint on paper,
 // not transparent fragments selected independently by RGB.
 float plant=sillPlantShape(p);
 float objects=max(max(linkedIn,github),max(mail,max(radioBody,radioTop)));
 return clamp(max(objects,plant),0.,1.);
}
float framePaint(vec2 p,vec3 ink){
 float fringe=studyWindowFrameBands(p)*studyWindowWarm(ink)*studyWindowPigment(ink);
 // The backing frame remains present behind separately moving objects.
 return clamp(max(fringe,studyWindowFrameCore(p)),0.,1.);
}
float sillPaint(vec2 p,vec3 ink){
 // A continuous structural wash connects the rear rail, light ledge and lip.
 // Only the outer margins break; pale reserves inside are opaque material.
 float span=studyWindowBand(p.x,373.,1391.,4.);
 float top=smoothstep(425.5+sin(p.x*.018)*.6,430.,p.y);
 float tail=1.-smoothstep(467.,473.+1.2*sin(p.x*.026+sin(p.x*.008)),p.y);
 return clamp(span*top*tail,0.,1.);
}
float retainedWindowPaint(vec2 p,vec3 ink){
 // Coverage for the MAIN WALL only. Frame, sill and objects are drawn once
 // by their own meshes; the native sky/city/water never remains on this wall.
 // Below the sill, wall pigment fills the removed vine rather than leaving
 // leaf-shaped holes that become visible when its foreground mesh moves.
 return clamp(1.-windowRegion(p),0.,1.);
}
float studyWindowOpening(vec2 p,vec3 ink){
 // Foreground items are separate meshes, so the glass must remain behind
 // them rather than carrying stationary holes in their old silhouettes.
 float pane=windowRegion(p)*(1.-smoothstep(425.,439.,p.y));
 // The independent exterior must not inherit old frame/cloud silhouettes
 // from the backdrop. A shared art-space brush edge supplies its perimeter.
 return clamp(pane*upperPaperEdge(p),0.,1.);
}
`;
