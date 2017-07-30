/* copyright 2004, Richard Harris, all rights reserved */

function HSV_to_RGB(H, S, V) {
  var R, G, B;
  if (S == 0) {
    R = G = B = V;
  } else {
    H = ((H + 360) % 360) / 60;
    var i = Math.floor(H);
    var f = H - i;
    var p = V*(1-S);
    var q = V*(1-(S*f));
    var t = V*(1 - (S * (1-f)));
    if (i == 0) { R = V; G = t; B = p; } else
    if (i == 1) { R = q; G = V; B = p; } else
    if (i == 2) { R = p; G = V; B = t; } else
    if (i == 3) { R = p; G = q; B = V; } else
    if (i == 4) { R = t; G = p; B = V; } else
    if (i == 5) { R = V; G = p; B = q; } else
    alert("HSV_to_RGB: "+H);
  }
  return "rgb("+Math.floor(255.999*R)+","+Math.floor(255.999*G)+","+Math.floor(255.999*B)+")";
}
function RGB_to_HSV(R, G, B) {
  var var_R = ( R / 255 );
  var var_G = ( G / 255 );
  var var_B = ( B / 255 );

  var var_Min = Math.min( var_R, var_G, var_B );
  var var_Max = Math.max( var_R, var_G, var_B );
  var del_Max = var_Max - var_Min;

  var V = var_Max;
  var H,S;

  if ( del_Max == 0 ) {
    H = 0;
    S = 0;
  } else {
    S = del_Max / var_Max;

    del_R = ( ( ( var_Max - var_R ) / 6 ) + ( del_Max / 2 ) ) / del_Max;
    del_G = ( ( ( var_Max - var_G ) / 6 ) + ( del_Max / 2 ) ) / del_Max;
    del_B = ( ( ( var_Max - var_B ) / 6 ) + ( del_Max / 2 ) ) / del_Max;

    if ( var_R == var_Max ) H = del_B - del_G; else 
    if ( var_G == var_Max ) H = ( 1 / 3 ) + del_R - del_B; else
    if ( var_B == var_Max ) H = ( 2 / 3 ) + del_G - del_R;

    if ( H < 0 ) H += 1;
    if ( H > 1 ) H -= 1;
  }
  return [H * 360, S, V];
}

function getFirstElement(g) {
  var child = g.firstChild;
  while (child != null) {
    if (child.nodeType == child.ELEMENT_NODE)
      return child;
    child = child.nextSibling;
  }
  return null;
}
function removeChildren(g) {
  var child = g.firstChild;
  while (child != null) {
    var nextChild = child.nextSibling;
    g.removeChild(child);
    child = nextChild;
  }
}
var svgNS   = 'http://www.w3.org/2000/svg';
var xlinkNS = 'http://www.w3.org/1999/xlink';
function createSVGElement(document, type) {
  return document.createElementNS(svgNS, type);
}
function createSVGElementWithId(document, type, id) {
  var old = document.getElementById(id);
  if (old != null) return old;
  var result = document.createElementNS(svgNS, type);
  result.setAttribute("id", id);
  return result;
}




var lineWidthFraction = 1/12;
var stripWidth = 1;
var stripLength = 20;
var separationIndex = 1;
var separationValue = [0.07, 0.33, 0.8, 2.0];
var stripSpacingFraction = separationValue[separationIndex];
var stripSpacing = stripWidth * stripSpacingFraction;
var viewHeight;
var viewWidth;
var halfViewHeight;
var halfViewWidth;
var sheetSize = 500;
var sheetPath = "M "+(-sheetSize)+" "+(-sheetSize)+" "+
                "L "+(-sheetSize)+" "+(sheetSize)+" "+
                "L "+(sheetSize)+" "+(sheetSize)+" "+
                "L "+(sheetSize)+" "+(-sheetSize)+" "+
                "Z";
var d = 0.05;  var margin = 0.04; var sep = d/5;
var buttonRectSize;
var maxS;

var baseSize;

var totalNumber;
var stripsPerDirection;
var offsetS;
function setupNewBaseSize(newBaseSize) {
  baseSize = newBaseSize;
  var baseSizeEven = 2 * ((baseSize + 1) / 2);
  stripsPerDirection = 3 * newBaseSize;
  totalNumber = 3 * stripsPerDirection;
  stripPathOfIndex = null;
  maxS = baseSize*3;
  offsetS = Math.floor(stripsPerDirection / 2) - 0.5;
  var totalStripWidth = 3 * baseSizeEven * stripWidth * (1 + stripSpacingFraction);
  stripLength = totalStripWidth;
  viewHeight = stripLength*1.5;
  viewWidth = viewHeight*4/3;
  halfViewHeight = viewHeight/2;
  halfViewWidth = viewWidth/2;
  buttonRectSize = viewHeight * d;
}

var starMadWeaveCenter = false;
var starHexWeaveCenter = false; // true for layer b (1), when starMadWeaveCenter is false
var numberOfDirections = 6; // must be a multiple of directionsInUnit
var transformInPath = false;
var drawOneUnit = false;

var directionsPerCircle = 6;
var unitsPerCircle = ((starMadWeaveCenter || starHexWeaveCenter) ? 6 : 3);
var directionsInUnit = 6 / unitsPerCircle; // either 1 or 2
var angleOfUnit = 2*Math.PI/unitsPerCircle;
var numberOfUnits = numberOfDirections / directionsInUnit;
var coneFraction = directionsPerCircle / numberOfDirections;

function intersectionPoint(angle, x1, y1, x2, y2) {
  var z1, z2;
  var alpha = Math.tan(angle);
  if (Math.abs(alpha) < 1) {
    z1 = y1 - alpha * x1;
    z2 = y2 - alpha * x2;
  } else {
    alpha = 1 / alpha;
    z1 = x1 - alpha * y1;
    z2 = x2 - alpha * y2;
  }
  return z1 / (z1 - z2);
}
var npoints = 64;
var lastAnglet = 0;
var extraAnglet = 0;
var firstTransformPoint = true;
var radiansToDegrees = 180 / Math.PI; // 57.29...
function transformPointToPath(x1, y1, x2, y2, ty, angle) {
  if (!transformInPath) {
    var first = firstTransformPoint;
    firstTransformPoint = false;
    return (first?"M ":"L ")+x1+" "+y1+" ";
  }
  var cosa = Math.cos(angle/radiansToDegrees); 
  var sina = Math.sin(angle/radiansToDegrees);
  var path = "";
  var xt1 = cosa*x1-sina*(y1+ty);
  var yt1 = sina*x1+cosa*(y1+ty);
  var xt2 = cosa*x2-sina*(y2+ty);
  var yt2 = sina*x2+cosa*(y2+ty);
  var anglet1 = Math.atan2(yt1, xt1);
  var anglet2 = Math.atan2(yt2, xt2);
  var ldAt0 = intersectionPoint(0, xt1, yt1, xt2, yt2);
  var xAt0 = xt1 + ldAt0 * (xt2 - xt1);
  var yAt0 = yt1 + ldAt0 * (yt2 - yt1);
  var angleAt0 = Math.atan2(yAt0, xAt0);
  var ldAtAngleOfUnit = intersectionPoint(angleOfUnit, xt1, yt1, xt2, yt2);
  var xAtAngleOfUnit = xt1 + ldAtAngleOfUnit * (xt2 - xt1);
  var yAtAngleOfUnit = yt1 + ldAtAngleOfUnit * (yt2 - yt1);
  var angleAtAngleOfUnit = Math.atan2(yAtAngleOfUnit, xAtAngleOfUnit);
  var eps = 1e-6;
  var inside1 = (-eps <= anglet1 && anglet1 <= (angleOfUnit+eps));
  var inside2 = (-eps <= anglet2 && anglet2 <= (angleOfUnit+eps));
  var crosses0 = (Math.abs(angleAt0) < eps) && 
                 (ldAt0 >= -eps) && (ldAt0 <= 1+eps);
  var crossesAngleOfUnit = (Math.abs(angleAtAngleOfUnit - angleOfUnit) < eps) && 
                 (ldAtAngleOfUnit >= -eps) && (ldAtAngleOfUnit <= 1+eps);
  var minLD = 0, maxLD = 1;
  if (!drawOneUnit || (inside1 && inside2)) {
  } else if (inside1) {
    maxLD = (crosses0?ldAt0:ldAtAngleOfUnit);
  } else if (inside2) {
    minLD = (crosses0?ldAt0:ldAtAngleOfUnit);
  } else if (crosses0 && crossesAngleOfUnit) {
    minLD = Math.min(ldAt0, ldAtAngleOfUnit);
    maxLD = Math.max(ldAt0, ldAtAngleOfUnit);
  } else {
    return "";
  }
  var n;
  for (n=0; n<npoints; n++) {
    var d = n / (1e-6 + npoints - 1);
    var ld = minLD + d * (maxLD - minLD);
    var xt = xt1 + ld * (xt2 - xt1);
    var yt = yt1 + ld * (yt2 - yt1);
    var anglet = Math.atan2(yt, xt);
    if (drawOneUnit && (anglet<(-eps) || anglet>(angleOfUnit+eps))) continue;
    if (firstTransformPoint) {
      extraAnglet = 0;
    } else if (lastAnglet < -Math.PI/2 && anglet > Math.PI/2) {
      extraAnglet += -2*Math.PI;
    } else if (lastAnglet > Math.PI/2 && anglet < -Math.PI/2) {
      extraAnglet += 2*Math.PI;
    }
    lastAnglet = anglet;
    var rt = Math.sqrt(xt*xt + yt*yt);
    var rT = rt; //rt*coneFraction;
    var angleT = (anglet+extraAnglet)*coneFraction;
    var xT = Math.cos(angleT)*rT;
    var yT = Math.sin(angleT)*rT;
    path = path + (firstTransformPoint?"M ":"L ")+xT+" "+yT+" ";
    firstTransformPoint = false;
  }
  return path;
}
function rectPathWithOffset(width, length, offset, ty, angle) {
  firstTransformPoint = true;
  return transformPointToPath(-length/2,(-width/2+offset),-length/2,( width/2+offset),ty,angle)+
         transformPointToPath(-length/2,( width/2+offset), length/2,( width/2+offset),ty,angle)+
         transformPointToPath( length/2,( width/2+offset), length/2,(-width/2+offset),ty,angle)+
         transformPointToPath( length/2,(-width/2+offset),-length/2,(-width/2+offset),ty,angle)+
         "Z";
}
function rectPath(width, length, ty, angle) {
  return rectPathWithOffset(width, length, 0, ty, angle);
}
function rectLinePath(width, length, ty, angle) {
  var r1 = rectPathWithOffset(width*lineWidthFraction, length, 
                              width*0.5*(-1+lineWidthFraction), ty, angle);
  var r2 = rectPathWithOffset(width*lineWidthFraction, length, 
                              width*0.5*( 1-lineWidthFraction), ty, angle);
  return r1+" "+r2;
}
var stripPathOfIndex = null;
function stripPath(index) {
  if (stripPathOfIndex == null) stripPathOfIndex = Array(totalNumber);
  var path = stripPathOfIndex[index];
  if (typeof path == "string") return path;
  var ty = (getS(index)-offsetS)*(stripWidth+stripSpacing);
  var angle = 120*getD(index);
  path = rectPath(stripWidth, stripLength, ty, angle);
  stripPathOfIndex[index] = path;
  return path;
}
function linePath(index) {
  var ty = (getS(index)-offsetS)*(stripWidth+stripSpacing);
  var angle = 120*getD(index);
  return rectLinePath(stripWidth, stripLength, ty, angle);
}
function unStripPath(index) {
  return sheetPath+" "+stripPath(index);
}
function trans(index) {
  if (transformInPath)
    return "";
  var angle = 120*getD(index);
  var ty = (getS(index)-offsetS)*(stripWidth+stripSpacing);
  return "rotate("+angle+") "+
         "translate(0,"+ty+")";
}
function makeIndexS(d,s) {return s + d * stripsPerDirection;}
function getS(index) {return index % stripsPerDirection;}
function getD(index) {return Math.floor(index / stripsPerDirection);}

function getSOffset(d) {
  if (!starMadWeaveCenter)
    return 0;
  else
    return 3-d;
}
function getS0FromS(d,s) {return s+getSOffset(d);}
function getSFromS0(d,s0) {return s0-getSOffset(d);}

function getCFromS0(s0) {return s0 % 3;}
function getNFromS0(s0) {return Math.floor(s0 / 3);}
function getC(index) {return getCFromS0(getS0FromS(getD(index),getS(index)));}
function getN(index) {return getNFromS0(getS0FromS(getD(index),getS(index)));}

var dx = [0.0, -0.86602540378,  0.86602540378];  /* sin  0 120 240 */
var dy = [1.0, -0.5,           -0.5];            /* cos  0 120 240 */
var dsnote = ["", "", ""];
function getSForPoint(pt, d) {
  var x,y;
  var a = 0;
  if (transformInPath && numberOfDirections != 6) {
    var rT = Math.sqrt(pt.x*pt.x + pt.y*pt.y);
    var angleT = Math.atan2(pt.y, pt.x);
    //if (angleT < 0) angleT += Math.PI * 2;
    var rt = rT;
    var anglet = angleT / coneFraction;
    a = anglet * radiansToDegrees;
    x = rt * Math.cos(anglet);
    y = rt * Math.sin(anglet);
  } else {
    x = pt.x;
    y = pt.y;
  }
  var exactS = (dx[d]*x+dy[d]*y)/(stripWidth+stripSpacing)+offsetS;
  dsnote[d] = "S="+exactS.toFixed(2)+", A="+a.toFixed(1);
  return Math.floor(exactS+0.5);
}
var showC = [true, true, true];
var showD = [true, true, true];
function isVisible(index) {
  return showC[getC(index)]&&showD[getD(index)]&&"Z"!=stripPath(index);
}
var coveredByArrays;
var alternate = 0;
function initCoveredByArrays() {
  coveredByArrays = Array(totalNumber);
  var index;
  for (index=0; index<totalNumber; index++) {
    var coveredByArray = new Array();
    var thisC = getC(index);
    var thisD = getD(index);
    var underC = alternate ? nextM3(thisC) : prevM3(thisC);
    var underD = alternate ? nextM3(thisD) : prevM3(thisD);
    var index2;
    for (index2=0; index2<totalNumber; index2++) {
      var otherC = getC(index2);
      var otherD = getD(index2);
      var isUnder;
      if (thisC != otherC) 
         isUnder = (underC == otherC);
      else
         isUnder = (underD == otherD);
      if (isUnder)
         coveredByArray = coveredByArray.concat(index2);
    }
    coveredByArrays[index] = coveredByArray;
  }
}
var visibleNumber = 0;
var indicesInDrawingOrder;
var drawingOrderOfIndex;
function getIndicesInDrawingOrder() {
  drawingOrderOfIndex = Array(totalNumber);
  stripPathOfIndex = Array(totalNumber);
  visibleNumber = 0;
  var index;
  for (index=0; index<totalNumber; index++) {
    if (isVisible(index)) visibleNumber++;
    drawingOrderOfIndex[index] = 1000000;
  }
  indicesInDrawingOrder = Array(visibleNumber);
  var vIndex = 0;
  var c;
  for (c=0; c<3; c++) {
    for (index=0; index<totalNumber; index++) {
      if (c == getC(index) && isVisible(index)) {
        drawingOrderOfIndex[index] = vIndex;
        indicesInDrawingOrder[vIndex++] = index;
      }
    }
  }
}
function getPointForEvent(evt) {
  var g = evt.target;
  var document = g.ownerDocument;
  var svg = document.getElementById("svg");
  if (null == svg.getScreenCTM) return null;
  var imat = g.getScreenCTM().inverse();
  var pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  pt = pt.matrixTransform(imat);
  return pt;
}

function name(index) {return "ABC".charAt(getD(index))+"XYZ".charAt(getC(index))+getN(index);}
function nextM3(x) {return (x + 1) % 3;}
function prevM3(x) {return (x - 1) % 3;}

var colorPattern = 0;
var colorCount = 3;
function colorIndex(index) {
  switch (colorPattern) {
  case 0: return getD(index)%colorCount;
  case 1: return getC(index)%colorCount;
  case 2: return (getD(index)+getC(index))%colorCount;

  case 3: return getN(index)%colorCount;
  case 4: return (getC(index)+getN(index))%colorCount;
  }
}
var colorIndexArray;
var CIABaseSize;
var CIATotalNumber;
function initColorIndexArray() {
  CIABaseSize = baseSize;
  CIATotalNumber = totalNumber;
  colorIndexArray = Array(totalNumber);
  var index,oldindex,d,s;
  for (index=0; index<totalNumber; index++) {
    colorIndexArray[index] = colorIndex(index);
  }
}
/* rgb(116,217,201),rgb(48,161,161),rgb(90,197,167) */
/* "darkkhaki",          "teal",                "indianred" */
/* "rgb(189, 183, 107)", "rgb(  0, 128, 128)",  "rgb(205,  92, 92)" */
var colorArray = ["rgb(153,192,133)",   "rgb(149,168,161)",   "rgb(99,161,144)",
                  "rgb(130,186,182)",   "rgb(115,128,156)",   "rgb(121,156,121)",
                  "rgb(255,255,255)",   "rgb(  0,128,128)"];
function color(index) {
  return colorArray[colorIndexArray[index]];
}
function getDefs(document) {
  var svg = document.getElementById("svg");
  var defs = createSVGElementWithId(document, "defs", "defs");
  if (defs.parentNode == null) svg.appendChild(defs);
  return defs;
}
var currentSat = 0.5;
var currentValue = 0.65; /* higher values are lighter */
var currentHue = 0;
var numberOfValueGradients = 6;
function buildSatValueGradient(document) {
  var defs = getDefs(document);
  var satIndex;
  for (satIndex = 0; satIndex<numberOfValueGradients; satIndex++) {
    var sat = satIndex/(numberOfValueGradients-1);
    var name = "valueAtHue"+satIndex;
    var gradient = createSVGElementWithId(document, "linearGradient", name);
    if (gradient.parentNode == null) defs.appendChild(gradient);
    var stop1 = createSVGElementWithId(document, "stop", name+"stop1");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", HSV_to_RGB(currentHue, sat, 1.0));
    if (stop1.parentNode == null) gradient.appendChild(stop1);
    var stop2 = createSVGElementWithId(document, "stop", name+"stop2");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", HSV_to_RGB(currentHue, sat, 0.0));
    if (stop2.parentNode == null) gradient.appendChild(stop2);
    if (true) { /* batik needs this, see https://issues.apache.org/bugzilla/show_bug.cgi?id=23443 */
      var grect = createSVGElementWithId(document, "rect", "buttonSVB"+satIndex);
      grect.setAttribute("fill", "none"); 
      grect.setAttribute("fill", "url(#valueAtHue"+satIndex+")"); 
    }
  }
}
function setSatValue(evt) {
  var pt = getPointForEvent(evt);
  if (pt == null) return;
  currentSat = pt.y;
  currentValue = 1.0-pt.x;
  var newColor = HSV_to_RGB(currentHue, currentSat, currentValue);
  var document = evt.target.ownerDocument;
  var defaultColorButton = document.getElementById("buttonC"+defaultColorIndex);
  defaultColorButton.setAttribute("fill", newColor);
  colorArray[defaultColorIndex] = newColor;
  buildHueGradient(document, currentSat, currentValue);
  buildStrips(document);
}


var numberOfHueStops = 16;
function buildHueGradient(document) {
  var defs = getDefs(document);
  var name = "hueAtSatValue";
  var gradient = createSVGElementWithId(document, "linearGradient", name);
  if (gradient.parentNode == null) defs.appendChild(gradient);
  var i;
  for (i=0; i<numberOfHueStops; i++) {
    var stop = createSVGElementWithId(document, "stop", name+"stop"+i);
    stop.setAttribute("offset", Math.floor((i*100)/(numberOfHueStops-1))+"%");
    var hue = i * 360 / (numberOfHueStops-1);
    stop.setAttribute("stop-color", HSV_to_RGB(hue, currentSat, currentValue));
    if (stop.parentNode == null) gradient.appendChild(stop);
  }
  if (true) { /* batik needs this, see https://issues.apache.org/bugzilla/show_bug.cgi?id=23443 */
    var rect = createSVGElementWithId(document, "rect", "buttonHB");
    rect.setAttribute("fill", "none");
    rect.setAttribute("fill", "url(#hueAtSatValue)");
  }
}
function setHue(evt) {
  var pt = getPointForEvent(evt);
  if (pt == null) return;
  currentHue = pt.x * 360;
  var newColor = HSV_to_RGB(currentHue, currentSat, currentValue);
  var document = evt.target.ownerDocument;
  var defaultColorButton = document.getElementById("buttonC"+defaultColorIndex);
  defaultColorButton.setAttribute("fill", newColor);
  colorArray[defaultColorIndex] = newColor;
  buildSatGradient(document);
  buildValueGradient(document);
  buildStrips(document);
}


var numberOfSatStops = 16;
function buildSatGradient(document) {
  var defs = getDefs(document);
  var name = "satAtHueValue";
  var gradient = createSVGElementWithId(document, "linearGradient", name);
  if (gradient.parentNode == null) defs.appendChild(gradient);
  var i;
  for (i=0; i<numberOfSatStops; i++) {
    var stop = createSVGElementWithId(document, "stop", name+"stop"+i);
    stop.setAttribute("offset", Math.floor((i*100)/(numberOfSatStops-1))+"%");
    var sat = i / (numberOfSatStops-1);
    stop.setAttribute("stop-color", HSV_to_RGB(currentHue, sat, currentValue));
    if (stop.parentNode == null) gradient.appendChild(stop);
  }
  if (true) { /* batik needs this, see https://issues.apache.org/bugzilla/show_bug.cgi?id=23443 */
    var rect = createSVGElementWithId(document, "rect", "buttonSB");
    rect.setAttribute("fill", "none");
    rect.setAttribute("fill", "url(#satAtHueValue)");
  }
}
function setSat(evt) {
  var pt = getPointForEvent(evt);
  if (pt == null) return;
  currentSat = pt.x;
  var newColor = HSV_to_RGB(currentHue, currentSat, currentValue);
  var document = evt.target.ownerDocument;
  var defaultColorButton = document.getElementById("buttonC"+defaultColorIndex);
  defaultColorButton.setAttribute("fill", newColor);
  colorArray[defaultColorIndex] = newColor;
  buildHueGradient(document, currentSat, currentValue);
  buildValueGradient(document, currentHue, currentSat);
  buildStrips(document);
}


var numberOfValueStops = 16;
function buildValueGradient(document) {
  var defs = getDefs(document);
  var name = "valueAtHueSat";
  var gradient = createSVGElementWithId(document, "linearGradient", name);
  if (gradient.parentNode == null) defs.appendChild(gradient);
  var i;
  for (i=0; i<numberOfValueStops; i++) {
    var stop = createSVGElementWithId(document, "stop", name+"stop"+i);
    stop.setAttribute("offset", Math.floor((i*100)/(numberOfValueStops-1))+"%");
    var value = i / (numberOfValueStops-1);
    stop.setAttribute("stop-color", HSV_to_RGB(currentHue, currentSat, value));
    if (stop.parentNode == null) gradient.appendChild(stop);
  }
  if (true) { /* batik needs this, see https://issues.apache.org/bugzilla/show_bug.cgi?id=23443 */
    var rect = createSVGElementWithId(document, "rect", "buttonVB");
    rect.setAttribute("fill", "none");
    rect.setAttribute("fill", "url(#valueAtHueSat)");
  }
}
function setValue(evt) {
  var pt = getPointForEvent(evt);
  if (pt == null) return;
  currentValue = pt.x;
  var newColor = HSV_to_RGB(currentHue, currentSat, currentValue);
  var document = evt.target.ownerDocument;
  var defaultColorButton = document.getElementById("buttonC"+defaultColorIndex);
  defaultColorButton.setAttribute("fill", newColor);
  colorArray[defaultColorIndex] = newColor;
  buildHueGradient(document);
  buildSatGradient(document);
  buildStrips(document);
}


function setColorChooserColor(document, rgbColorString) {
  var openParen = rgbColorString.indexOf('(');
  var comma1 = rgbColorString.indexOf(',');
  var comma2 = rgbColorString.indexOf(',', comma1+1);
  var closeParen = rgbColorString.indexOf(')');
  var R = rgbColorString.substring(openParen+1, comma1);
  var G = rgbColorString.substring(comma1+1, comma2);
  var B = rgbColorString.substring(comma2+1, closeParen);
  var HSV = RGB_to_HSV(R, G, B);
  currentHue = HSV[0];
  currentSat = HSV[1];
  currentValue = HSV[2];
  buildHueGradient(document);
  buildSatGradient(document);
  buildValueGradient(document);
}
function setColorFromLast(g) {
  var document = g.ownerDocument;
  var defaultColorButton = document.getElementById("buttonC"+defaultColorIndex);
  defaultColorButton.setAttribute("fill", lastColor);
  colorArray[defaultColorIndex] = lastColor;
  setColorChooserColor(document, lastColor);
  buildStrips(document);
}
function changeHand(g) {
  var document = g.ownerDocument;
  alternate = !alternate;
  initCoveredByArrays();
  buildStrips(document);
  var button = document.getElementById("buttonX");
  if (alternate) 
    button.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
  else
    button.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
}
function changeCenter(g) {
  var document = g.ownerDocument;
  starMadWeaveCenter = !starMadWeaveCenter;
  initCoveredByArrays();
  buildDefs(document);
  buildStrips(document);
  var button = document.getElementById("buttonC");
  if (starMadWeaveCenter) 
    button.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
  else
    button.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
}
function buildDefs(document) {
  buildHueGradient(document);
  buildSatGradient(document);
  buildValueGradient(document);
  var defs = getDefs(document);
  var index;
  for (index=0; index<totalNumber; index++) {
    var clipPath = createSVGElementWithId(document, "clipPath", "CP"+name(index));
    clipPath.setAttribute("clip-rule", "evenodd");
    var inversePath = createSVGElementWithId(document, "path", "IP"+name(index));
    inversePath.setAttribute("d", unStripPath(index));
    inversePath.setAttribute("transform", trans(index));
    if (inversePath.parentNode == null) clipPath.appendChild(inversePath);
    if (clipPath.parentNode == null) defs.appendChild(clipPath);
  }
}
var optimizeForFixedSolidColors = false;
var selectStrips2 = true;
var showingLines = false;
function buildStrips(document) {
  var svg = document.getElementById("svg");
  /* var suspendHandle = svg.suspendRedraw(1000); */
  var strips = createSVGElementWithId(document, "g", "strips");
  if (strips.parentNode == null) svg.appendChild(strips);
  removeChildren(strips);
  if (colorIndexArray == null || totalNumber != colorIndexArray.length) {
    initColorIndexArray();
  }
  getIndicesInDrawingOrder();
  var vIndex;
  for (vIndex=0; vIndex<visibleNumber; vIndex++) {
    var index = indicesInDrawingOrder[vIndex];
    var strip = createSVGElementWithId(document, "path", "P"+name(index));
    strip.setAttribute("d", stripPath(index));
    strip.setAttribute("fill", color(index));
    if (showingLines) {
      var gstrip = createSVGElementWithId(document, "g", "GP"+name(index));
      gstrip.appendChild(strip);
      var lstrip = createSVGElementWithId(document, "path", "LP"+name(index));
      lstrip.setAttribute("d", linePath(index));
      lstrip.setAttribute("fill", "dimgray");
      gstrip.appendChild(lstrip);
      strip = gstrip;
    }
    strip.setAttribute("transform", trans(index));
    var coveredByArray = coveredByArrays[index];
    var cbaIndex;
    for (cbaIndex=0; cbaIndex<coveredByArray.length; cbaIndex++) {
       var coveredByIndex = coveredByArray[cbaIndex];
       if (!isVisible(coveredByIndex)) continue;
       if (!transformInPath && vIndex < drawingOrderOfIndex[coveredByIndex]) continue;
       if (optimizeForFixedSolidColors && 
           !showingLines && 
           !transformInPath &&
           color(index) == color(coveredByIndex))
          continue; 
       var clippingG = document.createElementNS(svgNS, "g");
       clippingG.setAttribute("clip-path", "url(#CP"+name(coveredByIndex)+")");
       clippingG.appendChild(strip);
       strip = clippingG;
    }
    strips.appendChild(strip);
  }
  if (selectStrips2) buildStripSelector(document);
  maybeShowPattern(document);
  /* svg.unsuspendRedraw(suspendHandle); */
}
var stripSelectorSize = 0.80;
function buildStripSelector(document) {
  var strips = document.getElementById("strips");
  var stripsCover = createSVGElementWithId(document, "rect", "stripsCover");
  stripsCover.setAttribute("x", -viewWidth * 0.5 * stripSelectorSize);
  stripsCover.setAttribute("y", -viewHeight * 0.5 * stripSelectorSize);
  stripsCover.setAttribute("width", viewWidth * stripSelectorSize);
  stripsCover.setAttribute("height", viewHeight * stripSelectorSize);
  stripsCover.setAttribute("fill", "white");
  stripsCover.setAttribute("opacity", 0);
  stripsCover.setAttribute("pointer-events", "fill");
  stripsCover.setAttribute("onmousemove", "showMouseLocation(evt)");
  stripsCover.setAttribute("onmouseout", "unshowMouseStrip(evt.target)");
  stripsCover.setAttribute("onmousedown", "setCurrentStripColorToCurrentDefault(evt)");
  if (stripsCover.parentNode == null) strips.appendChild(stripsCover);
}
var mltext = Array(3);
function showMLtext(document, pos, text) {
  if (mltext[pos] == null) {
    var ml = createSVGElementWithId(document, "text", "ml"+pos);
    var svg = document.getElementById("svg");
    svg.appendChild(ml);
    ml.setAttribute("x", -0.45 * viewHeight);
    ml.setAttribute("y", (0.42 + pos * 0.024) * viewHeight);
    ml.setAttribute("font-family", "Verdana");
    ml.setAttribute("font-size", viewHeight*d*0.5);
    ml.setAttribute("fill", "lightslategray");
    ml.setAttribute("stroke-width", viewHeight*d*0.5*0.05);
    ml.setAttribute("text-anchor", "left");
    mltext[pos] = document.createTextNode("");
    ml.appendChild(mltext[pos]);
  }
  mltext[pos].replaceData(0, 1000, text);
}
var currentMouseS = [0, 0, 0];
var closestValidMouseS = [0, 0, 0];
function updateCurrentMouseInfo(pt, d) {
  var currentS = currentMouseS[d] = getSForPoint(pt, d);
  if (currentS < 0) closestValidMouseS[d] = 0;
  else if (currentS >= maxS) closestValidMouseS[d] = maxS - 1;
  else closestValidMouseS[d] = currentS;
}
var selectedMouseIndex = -1; /* the index of the strip that is highlighted */
var selectedMouseD = -1;
var selectedMouseS = -1;

var trackingMouseS = [0, 0, 0];
var trackingMouseTimestamp = [0, 0, 0];
var timestampIntervalThreshold = 400;

function indexOfMouseLocation(evt) {
  var document = evt.target.ownerDocument;
  var timestamp = new Date().valueOf();
  var pt = getPointForEvent(evt);
  if (pt == null) return;
  var d;
  for (d=0; d<3; d++) {
    updateCurrentMouseInfo(pt, d);
    //showMLtext(document, d, "d="+d+", s="+currentMouseS[d]+", "+dsnote[d]);
  }
  var withinSelected = selectedMouseIndex >= 0 && selectedMouseIndex < totalNumber && 
                       selectedMouseS == currentMouseS[selectedMouseD];
  var oldestTimestamp = 1e20; var oldestTimestampD;
  for (d=0; d<3; d++) { /* to debug, call showMLtext(document, d, string); */
    if (!withinSelected && 
        trackingMouseS[d] == currentMouseS[d] && 
        currentMouseS[d] == closestValidMouseS[d]) {
      var mouseTimestamp = trackingMouseTimestamp[d];
      if (mouseTimestamp < oldestTimestamp) {
        oldestTimestamp = trackingMouseTimestamp[d];
        oldestTimestampD = d;
      }
    } else {
      trackingMouseS[d] = currentMouseS[d];
      trackingMouseTimestamp[d] = timestamp;
    }
  }
  if ((timestamp - oldestTimestamp) > timestampIntervalThreshold) {
    selectedMouseD = oldestTimestampD;
    selectedMouseS = currentMouseS[selectedMouseD];
    selectedMouseIndex = makeIndexS(selectedMouseD, selectedMouseS);
  } else if (!withinSelected) {
    selectedMouseD = -1;
    selectedMouseS = -1;
    selectedMouseIndex = -1;
  }
  //showMLtext(document, -1, "d="+selectedMouseD+", s="+selectedMouseS);
  return selectedMouseIndex;
}
function showMouseLocation(evt) {
  var index = indexOfMouseLocation(evt);
  if (index > -1) showMouseStrip(evt.target, index);
  else unshowMouseStrip(evt.target, null);
}
function setCurrentStripColorToCurrentDefault(evt) {
  var index = selectedMouseIndex;
  if (index > -1) setStripColorToCurrentDefault(evt.target, index);
}
var defaultColorIndex = colorArray.length-1;
var lastColor = "rgb(255,255,255)";
function setButtonRectColor(buttonRect, colorIndex) {
  var document = buttonRect.ownerDocument;
  var color = (colorIndex<0) ? lastColor : colorArray[colorIndex];
  buttonRect.setAttribute("fill", color);
  if (colorIndex == defaultColorIndex) {
    buttonRect.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
    setColorChooserColor(buttonRect.ownerDocument, buttonRect.getAttribute("fill"));
  }
}
function setDefaultColor(g, colorIndex) {
  var document = g.ownerDocument;
  var defaultColorButton = document.getElementById("buttonC"+defaultColorIndex);
  defaultColorButton.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
  if (defaultColorIndex != colorIndex) {
    lastColor = colorArray[defaultColorIndex];
    var lastColorButton = document.getElementById("buttonLAST");
    setButtonRectColor(lastColorButton, -1);
    defaultColorIndex = colorIndex;
  }
  defaultColorButton = document.getElementById("buttonC"+defaultColorIndex);
  defaultColorButton.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
  setColorChooserColor(defaultColorButton.ownerDocument, defaultColorButton.getAttribute("fill"));
}
function toggleVisibilityC(g, c) {
  var document = g.ownerDocument;
  var visibilityButton = document.getElementById("buttonVC"+c);
  showC[c] = !showC[c];
  if (showC[c]) 
    visibilityButton.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
  else
    visibilityButton.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
  buildStrips(document);
}
function toggleVisibilityD(g, d) {
  var document = g.ownerDocument;
  var visibilityButton = document.getElementById("buttonVD"+d);
  showD[d] = !showD[d];
  if (showD[d]) 
    visibilityButton.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
  else
    visibilityButton.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
  buildStrips(document);
}
var processing = false;
function changeColorPattern(g, newColorPattern) {
  if (processing) return;
  processing = true;
  var document = g.ownerDocument;
  document.getElementById("buttonCP"+colorPattern).setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
  colorPattern = newColorPattern;
  document.getElementById("buttonCP"+colorPattern).setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
  document.getElementById("buttonCC"+colorCount).setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
  colorIndexArray = null;
  initColorIndexArray();
  buildStrips(document);
  processing = false;
}
function changeColorCount(g, newColorCount) {
  if (processing) return;
  processing = true;
  var document = g.ownerDocument;
  document.getElementById("buttonCC"+colorCount).setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
  colorCount = newColorCount;
  document.getElementById("buttonCP"+colorPattern).setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
  document.getElementById("buttonCC"+colorCount).setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
  colorIndexArray = null;
  initColorIndexArray();
  buildStrips(document);
  processing = false;
}
var switchOptimizationForFasterEditing = false;
function reshowStrip(document, index) {
  if (optimizeForFixedSolidColors) {
    buildStrips(document.getElementById("strips"));
  } else {
    var path = document.getElementById("P"+name(index));
    if (path == null) return;
    path.setAttribute("fill", color(index));
    maybeShowPattern(document);
  }
}
function setStripColorToCurrentDefault(g, index) {
  var document = g.ownerDocument;
  colorIndexArray[index] = defaultColorIndex;
  reshowStrip(document, index);
  document.getElementById("buttonCP"+colorPattern).setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
  document.getElementById("buttonCC"+colorCount).setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
}
function getMouseStrip(document) {
  var mouseStrip = createSVGElementWithId(document, "path", "MSP");
  if (mouseStrip.parentNode == null) {
    mouseStrip.setAttribute("visibility", "hidden");
    mouseStrip.setAttribute("fill", "none");
    mouseStrip.setAttribute("stroke", "black");
    mouseStrip.setAttribute("stroke-width", stripWidth*0.1);
    var strips = document.getElementById("strips");
    strips.appendChild(mouseStrip);
  }
  return mouseStrip;
}
var mouseStripIndex = -1;
function showMouseStrip(g, index) {
  if (index != mouseStripIndex) {
    var mouseStrip = getMouseStrip(g.ownerDocument);
    if (isVisible(index)) {
      mouseStrip.setAttribute("d", stripPath(index));
      mouseStrip.setAttribute("transform", trans(index));
      mouseStrip.setAttribute("visibility", "visible");
    } else {
      mouseStrip.setAttribute("visibility", "hidden");
    }
    mouseStripIndex = index;
  }
}
function unshowMouseStrip(g, index) {
  if (index == null) index = mouseStripIndex;
  if (index == mouseStripIndex && index > -1) {
    mouseStrip = getMouseStrip(g.ownerDocument);
    mouseStrip.setAttribute("visibility", "hidden");
    mouseStripIndex = -1;
  }
}
var showingPattern = false;
function showOrHidePattern(g) {
  var document = g.ownerDocument;
  var w;
  if (showingPattern) {
    var ptn = document.getElementById("pattern");
    ptn.setAttribute("visibility", "hidden");
    w = 1.0;
    showingPattern = false;
  } else {
    w = 2.5;
    showingPattern = true;
    maybeShowPattern(document);
  }
  document.getElementById("buttonSP").setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*w);
}
function showOrHideLines(g) {
  var document = g.ownerDocument;
  var w;
  if (showingLines) {
    w = 1.0;
    showingLines = false;
  } else {
    w = 2.5;
    showingLines = true;
  }
  document.getElementById("buttonLines").setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*w);
  buildStrips(document);
}
function maybeShowPattern(document) {
  if (!showingPattern) return;
  var lines = ["colorArray = ["+colorArray+"];", 
               "colorIndexArray = ["+colorIndexArray+"];"]; 
  var ptn = createSVGElementWithId(document, "g", "pattern");
  ptn.setAttribute("visibility", "visible");
  ptn.setAttribute("onmousedown", "showOrHidePattern(evt.target)");
  var svg = document.getElementById("svg");
  if (ptn.parentNode == null) svg.appendChild(ptn);
  var ptnBackground = createSVGElementWithId(document, "rect", "patternBackground");
  var ptnBackgroundWidth = viewWidth * 0.70;
  var textFontHeight = viewHeight / 50;
  var ptnBackgroundHeight = textFontHeight * 7.5;
  var ptnBackgroundCenterX = 0;
  var ptnBackgroundCenterY = viewHeight*0.92/2 - ptnBackgroundHeight/2;
  ptnBackground.setAttribute("x", ptnBackgroundCenterX-ptnBackgroundWidth/2);
  ptnBackground.setAttribute("y", ptnBackgroundCenterY-ptnBackgroundHeight/2);
  ptnBackground.setAttribute("width", ptnBackgroundWidth);
  ptnBackground.setAttribute("height", ptnBackgroundHeight);
  ptnBackground.setAttribute("fill", "whitesmoke");
  ptnBackground.setAttribute("stroke", "gray");
  ptnBackground.setAttribute("stroke-width", textFontHeight/15);
  if (ptnBackground.parentNode == null) ptn.appendChild(ptnBackground);
  var ptnText = createSVGElementWithId(document, "text", "patternText");
  removeChildren(ptnText);
  var textLeftX = ptnBackgroundCenterX-ptnBackgroundWidth*0.94/2;
  var textRightX = ptnBackgroundCenterX+ptnBackgroundWidth*0.94/2;
  var textTopY = ptnBackgroundCenterY-ptnBackgroundHeight*0.94/2;
  ptnText.setAttribute("x", textLeftX);
  ptnText.setAttribute("y", textTopY);
  ptnText.setAttribute("font-size", textFontHeight);
  ptnText.setAttribute("fill", "dimgray");
  if (ptnText.parentNode == null) ptn.appendChild(ptnText);
  var linesIndex;
  var tspanIndex = 0;
  for (linesIndex = 0; linesIndex < lines.length; linesIndex++) {
    var line = lines[linesIndex];
    var tspanLeftX = textLeftX;
    while (line.length > 0) {
      var tspanName = "patternTspan"+(tspanIndex++);
      var ptnTspan = createSVGElementWithId(document, "tspan", tspanName);
      removeChildren(ptnTspan);
      ptnTspan.setAttribute("x", tspanLeftX);
      ptnTspan.setAttribute("y", textTopY + textFontHeight * 1.5 * tspanIndex);
      var tn = document.createTextNode(line);
      ptnTspan.appendChild(tn);
      if (ptnTspan.parentNode == null) ptnText.appendChild(ptnTspan);
      var charIndex;
      var lastBreakPoint = 0;
      for (charIndex = 0; charIndex < line.length; charIndex++) {
        var charEndX = ptnTspan.getEndPositionOfChar(charIndex).x;
        if (charEndX >= textRightX) {
          charIndex = lastBreakPoint;
          break;
        }
        var ch = line.charAt(charIndex);
        if (ch == ' ' || ch == ',' || ch == ';') lastBreakPoint = charIndex;
      }
      if (charIndex == line.length)
        line = "";
      else {
        tn.replaceData(0, 1000, line.substring(0, charIndex+1));
        line = line.substring(charIndex+1);
        if (tspanLeftX == textLeftX) tspanLeftX = textLeftX + textFontHeight*6;
      }
    }
  }
}
function setSeparation(g, newSeparationIndex) {
  separationIndex = newSeparationIndex;
  stripSpacingFraction = separationValue[separationIndex];
  stripSpacing = stripWidth * stripSpacingFraction;
  setContent(g, baseSize);
}
var buttonStrokeWidth = 0.03;
function addButton(g, locX, locY, dirX, dirY, indexOffset, index, label, name, action) {
  var document = g.ownerDocument;
  var rg = createSVGElementWithId(document, "g", "gbutton"+name);
  var rectCenterX = viewWidth  * (locX * (0.5-margin-d/2) + dirX * (d+sep)*(index+indexOffset));
  var rectCenterY = viewHeight * (locY * (0.5-margin-d/2) + dirY * (d+sep)*(index+indexOffset));
  var widthExpand = 1.0;
  var heightExpand = 1.0;
  var rectX = rectCenterX-(buttonRectSize/2*widthExpand);
  var rectY = rectCenterY-buttonRectSize/2;
  var rect;
  if (name == "HB" || name == "SB" || name == "VB" || name == "SVB") widthExpand = 2.0;
  if (-1 < label.indexOf('.')) {
    rect = createSVGElementWithId(document, "rect", "button"+name);
    rect.setAttribute("x", rectX);
    rect.setAttribute("y", rectY);
    rect.setAttribute("width", buttonRectSize*widthExpand);
    rect.setAttribute("height", buttonRectSize*heightExpand);
    rect.setAttributeNS(xlinkNS, "xlink:href", label);
    rect.setAttribute("stroke", "black");
    rect.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
    if (rect.parentNode == null) rg.appendChild(rect);
    var image = createSVGElementWithId(document, "image", "ibutton"+name);
    image.setAttribute("x", rectX+buttonRectSize*widthExpand*0.5*(1-0.96));
    image.setAttribute("y", rectY+buttonRectSize*widthExpand*0.5*(1-0.96));
    image.setAttribute("width", buttonRectSize*widthExpand*0.96);
    image.setAttribute("height", buttonRectSize*heightExpand*0.96);
    image.setAttributeNS(xlinkNS, "xlink:href", label);
    if (image.parentNode == null) rg.appendChild(image);
  } else {
    if (name == "SVB") {
      rect = createSVGElementWithId(document, "g", "button"+name);
      var satIndex;
      for (satIndex = 0; satIndex<numberOfValueGradients; satIndex++) {
        var sat = satIndex/(numberOfValueGradients-1);
        var gradientName = "valueAtHue"+satIndex;
        var grect = createSVGElementWithId(document, "rect", "button"+name+satIndex);
        grect.setAttribute("x", rectX);
	grect.setAttribute("y", rectY+satIndex*(buttonRectSize*heightExpand/numberOfValueGradients));
        grect.setAttribute("width", buttonRectSize*widthExpand);
        grect.setAttribute("height", buttonRectSize*heightExpand/numberOfValueGradients);
        grect.setAttribute("stroke", "none");
        grect.setAttribute("fill", "url(#"+gradientName+")"); 
        if (grect.parentNode == null) rect.appendChild(grect);
      }
      if (rect.parentNode == null) rg.appendChild(rect);
    } else {
      rect = createSVGElementWithId(document, "rect", "button"+name);
      rect.setAttribute("x", rectX);
      rect.setAttribute("y", rectY);
      rect.setAttribute("width", buttonRectSize*widthExpand);
      rect.setAttribute("height", buttonRectSize*heightExpand);
      if (name == "HB")
        rect.setAttribute("fill", "url(#hueAtSatValue)");
      else if (name == "SB")
        rect.setAttribute("fill", "url(#satAtHueValue)");
      else if (name == "VB")
        rect.setAttribute("fill", "url(#valueAtHueSat)");
      else 
        rect.setAttribute("fill", "whitesmoke");
      rect.setAttribute("stroke", "black");
      if ((name.substring(0,2) == "VC" && showC[name.substring(2)]) ||
          (name.substring(0,2) == "VD" && showD[name.substring(2)]) ||
          (name == baseSize) || 
          (name == "Sep"+separationIndex) ||
          (name == (showingPattern?"SP":"HP")) ||
          (name == (showingLines?"Lines":"NoLines")))
        rect.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
      else
        rect.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
      if (rect.parentNode == null) rg.appendChild(rect);
    }
    var text = createSVGElementWithId(document, "text", "text"+name);
    text.setAttribute("x", rectCenterX);
    text.setAttribute("y", rectCenterY + 0.25*buttonRectSize);
    text.setAttribute("font-family", "Verdana");
    text.setAttribute("font-size", buttonRectSize*0.7);
    text.setAttribute("fill", "dimgray");
    text.setAttribute("stroke-width", buttonRectSize*0.03);
    text.setAttribute("text-anchor", "middle");
    if (text.parentNode == null) {
      var textNode = document.createTextNode(label);
      text.appendChild(textNode);
      rg.appendChild(text);
    }
  }
  var clickCatcher = createSVGElementWithId(document, "rect", "cbutton"+name);
  if ("HB" == name || "SB" == name || "VB" == name || "SVB" == name) {
    clickCatcher.setAttribute("x", 0);
    clickCatcher.setAttribute("y", 0);
    clickCatcher.setAttribute("width", 1.0);
    clickCatcher.setAttribute("height", 1.0);
    clickCatcher.setAttribute("transform", "translate("+rectX+","+rectY+")"+" "+
			      "scale("+(buttonRectSize*widthExpand)+","+(buttonRectSize*heightExpand)+")");
  } else {
    clickCatcher.setAttribute("x", rectX);
    clickCatcher.setAttribute("y", rectY);
    clickCatcher.setAttribute("width", buttonRectSize*widthExpand);
    clickCatcher.setAttribute("height", buttonRectSize*heightExpand);
  }
  clickCatcher.setAttribute("fill", "white");
  clickCatcher.setAttribute("opacity", 0);
  clickCatcher.setAttribute("pointer-events", "fill");
  if (action!=null) clickCatcher.setAttribute("onmousedown", action);
  if (clickCatcher.parentNode == null) rg.appendChild(clickCatcher);
  if (rg.parentNode == null) g.appendChild(rg);
  return rect;
}
function buildButtons(document) {
  var svg = document.getElementById("svg");
  var buttons = createSVGElementWithId(document, "g", "buttons");
  if (buttons.parentNode == null) svg.appendChild(buttons);

  var bw = (d+sep);

//addButton(buttons, locX, locY, dirX, dirY, indexOffset, index, label, name, action)
  addButton(buttons, -1+bw,-1,   0,    1,    0,           0.5, "a.png", "CP0", "changeColorPattern(evt.target,0)");
  addButton(buttons, -1+bw,-1,   0,    1,    0,           1.5, "b.png", "CP1", "changeColorPattern(evt.target,1)");
  addButton(buttons, -1+bw,-1,   0,    1,    0,           2.5, "c.png", "CP2", "changeColorPattern(evt.target,2)");
  addButton(buttons, -1+bw,-1,   0,    1,    0,           3.5, "d.png", "CP3", "changeColorPattern(evt.target,3)");
  addButton(buttons, -1+bw,-1,   0,    1,    0,           4.5, "e.png", "CP4", "changeColorPattern(evt.target,4)");
  document.getElementById("buttonCP"+colorPattern).setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);

  addButton(buttons, -1-bw,-1,   0,    1,    0,           0, "1", "CC1", "changeColorCount(evt.target,1)");
  addButton(buttons, -1-bw,-1,   0,    1,    0,           1, "2", "CC2", "changeColorCount(evt.target,2)");
  addButton(buttons, -1-bw,-1,   0,    1,    0,           2, "3", "CC3", "changeColorCount(evt.target,3)");
  addButton(buttons, -1-bw,-1,   0,    1,    0,           3, "4", "CC4", "changeColorCount(evt.target,4)");
  addButton(buttons, -1-bw,-1,   0,    1,    0,           4, "5", "CC5", "changeColorCount(evt.target,5)");
  addButton(buttons, -1-bw,-1,   0,    1,    0,           5, "6", "CC6", "changeColorCount(evt.target,6)");
  document.getElementById("buttonCC"+colorCount).setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
  numberOfColorCountButtons = 6;

  addButton(buttons, -1,    1,   0,   -1,    0,           7, "1", "1", "setContent(evt.target,1)");
  addButton(buttons, -1,    1,   0,   -1,    0,           6, "2", "2", "setContent(evt.target,2)");
  addButton(buttons, -1,    1,   0,   -1,    0,           5, "3", "3", "setContent(evt.target,3)");
  addButton(buttons, -1,    1,   0,   -1,    0,           4, "4", "4", "setContent(evt.target,4)");
  addButton(buttons, -1,    1,   0,   -1,    0,           3, "5", "5", "setContent(evt.target,5)");
  addButton(buttons, -1,    1,   0,   -1,    0,           2, "6", "6", "setContent(evt.target,6)");
  addButton(buttons, -1,    1,   0,   -1,    0,           1, "7", "7", "setContent(evt.target,7)");
  addButton(buttons, -1,    1,   0,   -1,    0,           0, "8", "8", "setContent(evt.target,8)");

  addButton(buttons,  1-bw,-1,   0,    1,    0,           6, "a", "VC0", "toggleVisibilityC(evt.target,0)");
  addButton(buttons,  1-bw,-1,   0,    1,    0,           7, "b", "VC1", "toggleVisibilityC(evt.target,1)");
  addButton(buttons,  1-bw,-1,   0,    1,    0,           8, "c", "VC2", "toggleVisibilityC(evt.target,2)");

  addButton(buttons,  1+bw,-1,   0,    1,    0,           6, "H", "VD0", "toggleVisibilityD(evt.target,0)");
  addButton(buttons,  1+bw,-1,   0,    1,    0,           7, "R", "VD1", "toggleVisibilityD(evt.target,1)");
  addButton(buttons,  1+bw,-1,   0,    1,    0,           8, "L", "VD2", "toggleVisibilityD(evt.target,2)");

  var cbo = -5.0;
  setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 0, "", "C0", "setDefaultColor(evt.target,0)"), 0);
  setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 1, "", "C1", "setDefaultColor(evt.target,1)"), 1);
  setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 2, "", "C2", "setDefaultColor(evt.target,2)"), 2);
  setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 3, "", "C3", "setDefaultColor(evt.target,3)"), 3);
  setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 4, "", "C4", "setDefaultColor(evt.target,4)"), 4);
  setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 5, "", "C5", "setDefaultColor(evt.target,5)"), 5);
  setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 6, "", "C6", "setDefaultColor(evt.target,6)"), 6);
  setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 7, "", "C7", "setDefaultColor(evt.target,7)"), 7);

  setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 8.50, "", "LAST", "setColorFromLast(evt.target)"), -1);

  addButton(buttons,  0, -1, 1, 0,cbo, 10.00,  "", "HB", "setHue(evt)");
  addButton(buttons,  0, -1, 1, 0,cbo, 11.45,  "", "SB", "setSat(evt)");
  addButton(buttons,  0, -1, 1, 0,cbo, 12.90,  "", "VB", "setValue(evt)");

  //addButton(buttons,  0,    1,   0,    0,    0,           0, "S", "SP", "showOrHidePattern(evt.target)");
  addButton(buttons,  1,   -1,   0,    1,    0,           3, "X", "X", "changeHand(evt.target)");
  addButton(buttons,  1,   -1,   0,    1,    0,           4, "C", "C", "changeCenter(evt.target)");

  addButton(buttons,  1,    1,   0,   -1,    0,         4.5, "L", "Lines", "showOrHideLines(evt.target)");

  addButton(buttons,  1,    1,   0,   -1,    0,           3, "N", "Sep0", "setSeparation(evt.target,0)");
  addButton(buttons,  1,    1,   0,   -1,    0,           2, "M", "Sep1", "setSeparation(evt.target,1)");
  addButton(buttons,  1,    1,   0,   -1,    0,           1, "W", "Sep2", "setSeparation(evt.target,2)");
  addButton(buttons,  1,    1,   0,   -1,    0,           0, "E", "Sep3", "setSeparation(evt.target,3)");
}
function setContent(g, newBaseSize) {
  if (processing) return;
  processing = true;
  var document = g.ownerDocument;
  setupNewBaseSize(newBaseSize);
  var svg = document.getElementById("svg");
  svg.setAttribute("viewBox", (-halfViewWidth)+" "+(-halfViewHeight)+" "+
                              viewWidth+" "+viewHeight);
  initCoveredByArrays();
  buildDefs(document);
  buildStrips(document);
  buildButtons(document);
  processing = false;
}

