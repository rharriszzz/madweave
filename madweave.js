/* copyright 2004 - 2012, Richard Harris, all rights reserved */

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
var inkscapeNS = 'http://www.inkscape.org/namespaces/inkscape';
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

var lineWidthFraction = 1/25;
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
var d = 0.05;  var margin = 0.04; var sep = d/7;
var buttonRectSize;
var buttonStrokeWidth = 0.03;
var maxS;

var baseSize;

var totalNumber;
var stripsPerDirection;
var offsetS;
function setupNewBaseSize(document,newBaseSize) {
    var svg = document.getElementById("svg");
    if (newBaseSize===undefined) {
        baseSize = parseInt(svg.getAttribute("mwBaseSize"));
    } else {
        baseSize = newBaseSize;
        svg.setAttribute("mwBaseSize",baseSize);
    }
  var baseSizeEven = 2 * ((baseSize + 1) / 2);
  stripsPerDirection = 3 * baseSize;
  totalNumber = 3 * stripsPerDirection;
  stripPathOfIndex = null;
  maxS = baseSize*3;
  offsetS = Math.floor(stripsPerDirection / 2) - 0.5;
  var totalStripWidth = 3 * baseSizeEven * stripWidth * (1 + stripSpacingFraction);
  stripLength = totalStripWidth;
  viewHeight = stripLength*1.67;
  viewWidth = viewHeight*1.1;
  halfViewHeight = viewHeight/2;
  halfViewWidth = viewWidth/2;
  buttonRectSize = viewHeight * d;
    svg.setAttribute("viewBox", (-halfViewWidth)+" "+(-halfViewHeight)+" "+viewWidth+" "+viewHeight);
}

var starMadWeaveCenter = false;
var starHexWeaveCenter = false; // true for layer b (1), when starMadWeaveCenter is false
var numberOfDirections = 3; // must be a multiple of directionsInUnit
var transformInPath = false;
var drawOneUnit = false;

var directionsPerCircle = 3;
var unitsPerCircle = ((starMadWeaveCenter || starHexWeaveCenter) ? 6 : 3);
var directionsInUnit = unitsPerCircle / directionsPerCircle; // either 1 or 2
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
var npoints = 2; // 64;
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
//rect a * rect b * rect c
//where a and b and c have different angles
//and rect a is on top of rect b, and b is on top of c
//note that for a given a and b, there are only two strips c that qualify
function stripPath(stripsPerDirection, index) {
    var offsetS = Math.floor(stripsPerDirection / 2) - 0.5;
    var ty = (getS(stripsPerDirection, index)-offsetS)*(stripWidth+stripSpacing);
    var angle = 120*getD(stripsPerDirection, index);
    return rectPath(stripWidth, stripLength, ty, angle);
}
function linePath(stripsPerDirection, index) {
    var offsetS = Math.floor(stripsPerDirection / 2) - 0.5;
    var ty = (getS(stripsPerDirection, index)-offsetS)*(stripWidth+stripSpacing);
    var angle = 120*getD(stripsPerDirection, index);
    return rectLinePath(stripWidth, stripLength, ty, angle);
}
function trans(stripsPerDirection, index) {
    if (transformInPath)
        return "";
    var offsetS = Math.floor(stripsPerDirection / 2) - 0.5;
    var angle = 120*getD(stripsPerDirection, index);
    var ty = (getS(stripsPerDirection, index)-offsetS)*(stripWidth+stripSpacing);
    return "rotate("+angle+") translate(0,"+ty+")";
}
function makeIndexS(d,s) {return s + d * stripsPerDirection;}
function getS(stripsPerDirection, index) {return index % stripsPerDirection;}
function getD(stripsPerDirection, index) {return Math.floor(index / stripsPerDirection);}

function getSOffset(starMadWeaveCenter, d) {
  if (!starMadWeaveCenter)
    return 0;
  else
    return 3-d;
}
function getS0FromS(starMadWeaveCenter,d,s) {return s+getSOffset(starMadWeaveCenter, d);}
function getCFromS0(s0) {return s0 % 3;}
function getNFromS0(s0) {return Math.floor(s0 / 3);}
function getC(starMadWeaveCenter,stripsPerDirection, index) {return getCFromS0(getS0FromS(starMadWeaveCenter,getD(stripsPerDirection, index),getS(stripsPerDirection, index)));}
function getN(starMadWeaveCenter,stripsPerDirection, index) {return getNFromS0(getS0FromS(starMadWeaveCenter,getD(stripsPerDirection, index),getS(stripsPerDirection, index)));}

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
    var offsetS = Math.floor(stripsPerDirection / 2) - 0.5;
  var exactS = (dx[d]*x+dy[d]*y)/(stripWidth+stripSpacing)+offsetS;
  dsnote[d] = "S="+exactS.toFixed(2)+", A="+a.toFixed(1);
  return Math.floor(exactS+0.5);
}
var showC = [true, true, true];
var showD = [true, true, true];
function isVisible(starMadWeaveCenter, stripsPerDirection, index) {
    return showC[getC(starMadWeaveCenter,stripsPerDirection, index)] && 
        showD[getD(stripsPerDirection, index)] &&
        "Z"!=stripPath(stripsPerDirection, index);
}
var alternate = false;
var hand = false;
var visibleNumber = 0;
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

function name(stripsPerDirection, index) {
    return "HRL".charAt(getD(stripsPerDirection, index))+
        "abc".charAt(getC(starMadWeaveCenter, stripsPerDirection, index))+
        getN(starMadWeaveCenter, stripsPerDirection, index);
}
function nextM3(x) {return (x + 1) % 3;}
function prevM3(x) {return (x - 1) % 3;}

var colorPattern = 0;
var colorCount = 3;
function colorIndex(colorPattern, starMadWeaveCenter, stripsPerDirection, index) {
  switch (colorPattern) {
  case 0: return getD(stripsPerDirection, index)%colorCount;
  case 1: return getC(starMadWeaveCenter, stripsPerDirection, index)%colorCount;
  case 2: return (getD(stripsPerDirection, index)+getC(starMadWeaveCenter, stripsPerDirection, index))%colorCount;

  case 3: return getN(starMadWeaveCenter, stripsPerDirection, index)%colorCount;
  case 4: return (getC(starMadWeaveCenter, stripsPerDirection, index)+getN(starMadWeaveCenter, stripsPerDirection, index))%colorCount;
  }
}
var colorIndexArray;
var visibilityIndexArray;
function setColorIndex(document,stripIndex,colorIndex) {
    var path = document.getElementById("P"+name(stripsPerDirection, stripIndex));
    path.setAttribute("mwColorIndex",colorIndex);
    colorIndexArray[stripIndex] = colorIndex;
}
function setVisibilityIndex(document,stripIndex,value) {
    var gstrip = document.getElementById("GP"+name(stripsPerDirection, stripIndex));
    gstrip.setAttribute("mwVisibility",value?"visible":"hidden");
    visibilityIndexArray[stripIndex] = value;
}
function makeColorIndexArray(document, colorPattern, starMadWeaveCenter, stripsPerDirection) {
    var totalNumber = 3 * stripsPerDirection;
    var colorIndexArray = Array(totalNumber);
    var stripIndex;
    for (stripIndex=0; stripIndex<totalNumber; stripIndex++) {
        colorIndexArray[stripIndex] = colorIndex(colorPattern, starMadWeaveCenter, stripsPerDirection, stripIndex);
    }
    return colorIndexArray;
}
function makeVisibilityIndexArray(document, starMadWeaveCenter, stripsPerDirection) {
    var totalNumber = 3 * stripsPerDirection;
    var visibilityIndexArray = Array(totalNumber);
    var stripIndex;
    for (stripIndex=0; stripIndex<totalNumber; stripIndex++) {
        visibilityIndexArray[stripIndex] = true;
    }
    return visibilityIndexArray;
}
function resetColorIndexArray(document) {
    var stripIndex;
    for (stripIndex=0; stripIndex<totalNumber; stripIndex++) {
        setColorIndex(document,stripIndex,colorIndex(colorPattern, starMadWeaveCenter, stripsPerDirection, stripIndex));
    }
}
function resetVisibilityIndexArray(document) {
    var stripIndex;
    for (stripIndex=0; stripIndex<totalNumber; stripIndex++) {
        setVisibilityIndex(document,stripIndex,true);
    }
}

/* rgb(116,217,201),rgb(48,161,161),rgb(90,197,167) */
/* "darkkhaki",          "teal",                "indianred" */
/* "rgb(189, 183, 107)", "rgb(  0, 128, 128)",  "rgb(205,  92, 92)" */
//var colorArray = ["rgb(153,192,133)",   "rgb(149,168,161)",   "rgb(99,161,144)",
//                  "rgb(130,186,182)",   "rgb(115,128,156)",   "rgb(121,156,121)",
//                  "rgb(255,255,255)",   "rgb(  0,128,128)"]; 
var lizziesColors = true;
var colorArray = lizziesColors ?
    ["rgb(220,135,158)", "rgb(252,205,118)", "rgb(140,118,241)", "rgb(54,135,186)", 
     "rgb(165,55,191)", "rgb(77,206,214)", "rgb(255,182,237)", "rgb(255,255,255)"]
    :
    ["rgb(183,195,67)", "rgb(64,149,118)", "rgb(191,94,47)", "rgb(54,135,186)",
     "rgb(165,55,191)", "rgb(77,206,214)", "rgb(255,182,237)", "rgb(255,255,255)"];

var defaultColorIndex = 0;
var hideStrips = false;
var showStrips = false;
var opacityArray = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
var lastColor = ["rgb(255,255,255)", "rgb(255,255,255)", "rgb(255,255,255)", "rgb(255,255,255)"];
var lastOpacity = [1.0, 1.0, 1.0, 1.0];
function getColor(colorIndexArray, index) {
  return colorArray[colorIndexArray[index]];
}
function getOpacity(colorIndexArray, index) {
  return opacityArray[colorIndexArray[index]];
}
function getVisibility(visibilityIndexArray, index) {
  return visibilityIndexArray[index];
}
function getDefs(document) {
  var svg = document.getElementById("svg");
  var defs = createSVGElementWithId(document, "defs", "defs");
  if (defs.parentNode == null) svg.appendChild(defs);
  return defs;
}
var currentOpacity = 1.0;
var currentSat = 0.5;
var currentValue = 0.65; /* higher values are lighter */
var currentHue = 0;
var batikButtonFix = true;

function setPointer(document, name, value) {
    var rect = document.getElementById("button"+name);
    if (rect === null) return; //{alert("Can't find button"+name); return;}
    var x = parseFloat(rect.getAttribute("x")) + value*parseFloat(rect.getAttribute("width"));
    var y = parseFloat(rect.getAttribute("y"));
    var height5 = parseFloat(rect.getAttribute("height"))/5;
    var gptr = createSVGElementWithId(document, "g", "button"+name+"ptr");
    if (gptr.parentNode == null) createSVGElementWithId(document, "g", "gbutton"+name).appendChild(gptr);
    var i;
    for (i=0; i<5; i++) {
        if (i==2) continue;
        var color = (i==0 || i==4) ? "rgb(0,0,0)" : "rgb(255,255,255)";
        var line = createSVGElementWithId(document, "line", "button"+name+"line"+i);
        line.setAttribute("x1", x);
        line.setAttribute("y1", y+height5*i);
        line.setAttribute("x2", x);
        line.setAttribute("y2", y+height5*(i+1));
        line.setAttribute("stroke", color);
        var widthFactor = ((value < 0.02) || (value > 0.98)) ? 1.0 : 0.4;
        line.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*widthFactor);
        line.setAttribute("stroke-opacity", 0.90);
        if (line.parentNode == null) gptr.appendChild(line);
    }
}

var numberOfOpacityStops = 2;
function buildOpacityGradient(document) {
  var defs = getDefs(document);
  var name = "opacityAtColor";
  var gradient = createSVGElementWithId(document, "linearGradient", name);
  if (gradient.parentNode == null) defs.appendChild(gradient);
  var i;
  for (i=0; i<numberOfValueStops; i++) {
    var stop = createSVGElementWithId(document, "stop", name+"stop"+i);
    stop.setAttribute("offset", Math.floor((i*100)/(numberOfValueStops-1))+"%");
    var opacity = i / (numberOfValueStops-1);
    stop.setAttribute("stop-color", HSV_to_RGB(currentHue, currentSat, currentValue));
    stop.setAttribute("stop-opacity", opacity);
    if (stop.parentNode == null) gradient.appendChild(stop);
  }
}
function updateOpacityButton(document) {
    buildOpacityGradient(document);
    if (batikButtonFix) { /* batik needs this, see https://issues.apache.org/bugzilla/show_bug.cgi?id=23443 */
        var rect = createSVGElementWithId(document, "rect", "buttonOB");
        rect.setAttribute("fill", "none");
        rect.setAttribute("fill", "url(#opacityAtColor)");
    }
    setPointer(document, "OB", currentOpacity);
}
function setOpacity(evt) {
  if (hideStrips || showStrips) return;
  var pt = getPointForEvent(evt);
  if (pt == null) return;
  currentOpacity = pt.x;
  var newColor = HSV_to_RGB(currentHue, currentSat, currentValue);
  var newOpacity = currentOpacity;
  var document = evt.target.ownerDocument;
    saveColorInLast(document);
  var defaultColorButton = document.getElementById("buttonC"+defaultColorIndex);
  defaultColorButton.setAttribute("fill", newColor);
  defaultColorButton.setAttribute("fill-opacity", newOpacity);
  colorArray[defaultColorIndex] = newColor;
  opacityArray[defaultColorIndex] = newOpacity;
  updateOpacityButton(document);
  updateHueButton(document);
  updateSatButton(document);
  updateValueButton(document);
  buildDefs(document);
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
}
function updateHueButton(document) {
    buildHueGradient(document);
    if (batikButtonFix) { /* batik needs this, see https://issues.apache.org/bugzilla/show_bug.cgi?id=23443 */
        var rect = createSVGElementWithId(document, "rect", "buttonHB");
        rect.setAttribute("fill", "none");
        rect.setAttribute("fill", "url(#hueAtSatValue)");
    }
    setPointer(document, "HB", currentHue/360);
}
function setHue(evt) {
  if (hideStrips || showStrips) return;
  var pt = getPointForEvent(evt);
  if (pt == null) return;
  currentHue = pt.x * 360;
  var newColor = HSV_to_RGB(currentHue, currentSat, currentValue);
  var document = evt.target.ownerDocument;
    saveColorInLast(document);
  var defaultColorButton = document.getElementById("buttonC"+defaultColorIndex);
  defaultColorButton.setAttribute("fill", newColor);
  colorArray[defaultColorIndex] = newColor;
  opacityArray[defaultColorIndex] = currentOpacity;
  updateOpacityButton(document);
  updateHueButton(document);
  updateSatButton(document);
  updateValueButton(document);
  buildDefs(document);
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
}
function updateSatButton(document) {
    buildSatGradient(document);
    if (batikButtonFix) { /* batik needs this, see https://issues.apache.org/bugzilla/show_bug.cgi?id=23443 */
        var rect = createSVGElementWithId(document, "rect", "buttonSB");
        rect.setAttribute("fill", "none");
        rect.setAttribute("fill", "url(#satAtHueValue)");
    }
    setPointer(document, "SB", currentSat);
}
function setSat(evt) {
  if (hideStrips || showStrips) return;
  var pt = getPointForEvent(evt);
  if (pt == null) return;
  currentSat = pt.x;
  var newColor = HSV_to_RGB(currentHue, currentSat, currentValue);
  var document = evt.target.ownerDocument;
    saveColorInLast(document);
  var defaultColorButton = document.getElementById("buttonC"+defaultColorIndex);
  defaultColorButton.setAttribute("fill", newColor);
  colorArray[defaultColorIndex] = newColor;
  opacityArray[defaultColorIndex] = currentOpacity;
  updateOpacityButton(document);
  updateHueButton(document);
  updateSatButton(document);
  updateValueButton(document);
  buildDefs(document);
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
}
function updateValueButton(document) {
    buildValueGradient(document);
    if (batikButtonFix) { /* batik needs this, see https://issues.apache.org/bugzilla/show_bug.cgi?id=23443 */
        var rect = createSVGElementWithId(document, "rect", "buttonVB");
        rect.setAttribute("fill", "none");
        rect.setAttribute("fill", "url(#valueAtHueSat)");
    }
    setPointer(document, "VB", currentValue);
}
function setValue(evt) {
  if (hideStrips || showStrips) return;
  var pt = getPointForEvent(evt);
  if (pt == null) return;
  currentValue = pt.x;
  var newColor = HSV_to_RGB(currentHue, currentSat, currentValue);
  var document = evt.target.ownerDocument;
    saveColorInLast(document);
  var defaultColorButton = document.getElementById("buttonC"+defaultColorIndex);
  defaultColorButton.setAttribute("fill", newColor);
  colorArray[defaultColorIndex] = newColor;
  opacityArray[defaultColorIndex] = currentOpacity;
  updateOpacityButton(document);
  updateHueButton(document);
  updateSatButton(document);
  updateValueButton(document);
  buildDefs(document);
  buildStrips(document);
}


function setColorChooserColor(document, rgbColorString, opacityString) {
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
  currentOpacity = opacityString;
  updateOpacityButton(document);
  updateHueButton(document);
  updateSatButton(document);
  updateValueButton(document);
  buildDefs(document);
  buildStrips(document);
}
function saveColorInLast(document) {
    if (hideStrips || showStrips) return;
    var i;
    for (i=0; i<lastColor.length; i++) {
        if (lastColor[i] == colorArray[defaultColorIndex] && lastOpacity[i]==opacityArray[defaultColorIndex])
            break;
    }
    if (i==lastColor.length) i--;
    for (; i>=1; i--) {
        lastColor[i] = lastColor[i-1];
        lastOpacity[i] = lastOpacity[i-1];
        var lastColorButton = document.getElementById("buttonLAST"+i);
        setButtonRectColor(lastColorButton, -(i+1));
    }
    lastColor[0] = colorArray[defaultColorIndex];
    lastOpacity[0] = opacityArray[defaultColorIndex];
    var lastColorButton = document.getElementById("buttonLAST"+0);
    setButtonRectColor(lastColorButton, -1);
}
function setColorFromLast(g, n) {
  if (hideStrips || showStrips) return;
  var document = g.ownerDocument;
  var defaultColorButton = document.getElementById("buttonC"+defaultColorIndex);
    var newColor = lastColor[n];
    var newOpacity = lastOpacity[n];
    if (lastColor[n] == colorArray[defaultColorIndex] && lastOpacity[n]==opacityArray[defaultColorIndex]) return;
    saveColorInLast(document);
  defaultColorButton.setAttribute("fill", newColor);
  defaultColorButton.setAttribute("fill-opacity", newOpacity);
  colorArray[defaultColorIndex] = newColor;
  opacityArray[defaultColorIndex] = newOpacity;
  setColorChooserColor(defaultColorButton.ownerDocument, defaultColorButton.getAttribute("fill"), defaultColorButton.getAttribute("fill-opacity"));
}
function changeHand(g) {
  var document = g.ownerDocument;
  hand = !hand;
  buildDefs(document);
  buildStrips(document);
  var button = document.getElementById("button-");
  if (hand) 
    button.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
  else
    button.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
}
function changeTop(g) {
  var document = g.ownerDocument;
  alternate = !alternate;
  buildDefs(document);
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
  buildDefs(document);
  buildStrips(document);
  var button = document.getElementById("buttonC");
  if (starMadWeaveCenter) 
    button.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
  else
    button.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
}

function getCFromSD(starMadWeaveCenter, s, d) {
  return getCFromS0(getS0FromS(starMadWeaveCenter,d,s));
}

function isCoveredBy(thisS, thisD, otherS, otherD) {
    if (thisD == otherD) return false;
    var dd = ((thisD - otherD)%3+3)%3;
    var sd = getCFromSD(starMadWeaveCenter, thisS,thisD) == getCFromSD(starMadWeaveCenter, otherS,otherD);
    var ds = ((dd==1?-1:1)*(thisS - otherS)%3+3)%3;
    var result = ds==(starMadWeaveCenter?0:1);
    if ((dd==1)==alternate) result = !result;
    if (sd && hand) result = !result;
    return result;
}

var dname = ["H","R","L"];
var pname = ["HRL",  "RLH",  "LHR",  "LRH",  "RHL",  "HLR"];
var ppn =   [[0,1,2],[1,2,0],[2,0,1],[2,1,0],[1,0,2],[0,2,1]];
var ppi =   [[0,1,2],[2,0,1],[1,2,0],[2,1,0],[1,0,2],[0,2,1]];
function maskPath(stripsPerDirection, p) {
    var xa = ppi[p][0]; var xb = ppi[p][1]; var xc = ppi[p][2];
    // ppn[p][0] is the direction number of the top direction
    // ppi[p][0] is the number of colors on top of direction 0
    var path = "";
    var a, b, c, cs;
    // 3: 4,4 (3,1),(2,2);   6 : 6,6(3,3),(3,3)
    var below = Math.floor((stripsPerDirection+0)/2) - 2*Math.floor((stripsPerDirection+1)/2);
    var above = Math.floor((stripsPerDirection+0)/2) + 2*Math.floor((stripsPerDirection+1)/2) - 1;
    for (a= below; a<=above; a++) {
        for (b= below; b<=above; b++) {
            var ACoversB = isCoveredBy(a,0, b,1);
            if ((xa < xb) !== ACoversB) continue; 
            for (cs=0; cs<2; cs++) {
                var c = (3*Math.floor(stripsPerDirection/2)-2) - (a+b) + cs;
                if (c < below || c > above) continue;
                var ACoversC = isCoveredBy(a,0, c,2);
                if ((xa < xc) !== ACoversC) continue; 
                var BCoversC = isCoveredBy(b,1, c,2);
                if ((xb < xc) !== BCoversC) continue; 

                var x_1 =-a - 2*b + 3*Math.floor(stripsPerDirection/2) - 2;
                var y_1 = a       -   Math.floor(stripsPerDirection/2);
                var x_2 = x_1     + 1;
                var y_2 = y_1     + 1;
                var x_3 = x_2     - 2 + 3*cs;
                var y_3 = y_2         -   cs;
                path += "M "+x_1+" "+y_1+
                    " L "+x_2+" "+y_2+
                    " L "+x_3+" "+y_3+
                    " Z ";
            }
        }
    }
    return path;
}
var showingLines = false;
function buildDefs(document) {
    buildHueGradient(document);
    buildSatGradient(document);
    buildValueGradient(document);
}

var optimizeForFixedSolidColors = false;
function buildStrips(document) {
    var totalNumber = 3 * stripsPerDirection;
    if (colorIndexArray == null || totalNumber != colorIndexArray.length) {
        colorIndexArray = makeColorIndexArray(document, colorPattern, starMadWeaveCenter, stripsPerDirection);
        visibilityIndexArray = makeVisibilityIndexArray(document, starMadWeaveCenter, stripsPerDirection);
    }
    buildStripsInternal(document, "", "", document.getElementById("svg"), colorIndexArray, stripsPerDirection);
}
function buildStripsInternal(document, baseName, clipBaseName, svg, colorIndexArray, stripsPerDirection) {
    var strips = createSVGElementWithId(document, "g", baseName+"strips");
    if (strips.parentNode == null) svg.appendChild(strips);
    strips.setAttributeNS(inkscapeNS, "inkscape:groupmode", "layer");
    removeChildren(strips);

    var index;
    var defs = getDefs(document);
    var d;
    for (d=0; d<3; d++) {
        var sgname = baseName+dname[d]+"Strips";
        var stripsgroup = createSVGElementWithId(document, "g", sgname);
        if (stripsgroup.parentNode == null) defs.appendChild(stripsgroup);
        removeChildren(stripsgroup);
        var s;
        for (s=0; s<stripsPerDirection; s++) {
            var index = d*stripsPerDirection + s;
            var indexName = name(stripsPerDirection, index);
            var gstrip = createSVGElementWithId(document, "g", baseName+"GP"+indexName);
            gstrip.setAttribute("mwVisibility", visibilityIndexArray[index] ? "visible" : "hidden");
            gstrip.setAttribute("visibility", (isVisible(starMadWeaveCenter, stripsPerDirection, index) && visibilityIndexArray[index]) ? "visible" : "hidden");
            stripsgroup.appendChild(gstrip);
            var strip = createSVGElementWithId(document, "path", baseName+"P"+indexName);
            gstrip.appendChild(strip);
            strip.setAttribute("d", stripPath(stripsPerDirection, index));
            strip.setAttribute("transform", trans(stripsPerDirection, index));
            strip.setAttribute("mwColorIndex",colorIndexArray[index]);
            strip.setAttribute("fill", colorArray[colorIndexArray[index]]);
            strip.setAttribute("fill-opacity", (isVisible(starMadWeaveCenter, stripsPerDirection, index) && visibilityIndexArray[index]) ? opacityArray[colorIndexArray[index]] : 0);
            if (showingLines) {
                var lstrip = createSVGElementWithId(document, "path", baseName+"LP"+indexName);
                lstrip.setAttribute("d", linePath(stripsPerDirection, index));
                lstrip.setAttribute("transform", trans(stripsPerDirection, index));
                lstrip.setAttribute("fill", "dimgray");
                lstrip.setAttribute("fill-opacity", (isVisible(starMadWeaveCenter, stripsPerDirection, index) && visibilityIndexArray[index]) ? opacityArray[colorIndexArray[index]] : 0);
                gstrip.appendChild(lstrip);
            }
        }
    }
    var p;
    for (p=0; p<6; p++) {
        var pMaskPath = maskPath(stripsPerDirection, p);
        var cpname = clipBaseName+pname[p]+"ClipPath";
        var clippath = createSVGElementWithId(document, "clipPath", cpname);
        if (clippath.parentNode == null) defs.appendChild(clippath);
        if (pMaskPath == "") {
            defs.removeChild(clippath);
            continue;
        }
        var path = createSVGElementWithId(document, "path", cpname+"_path");
        path.setAttribute("transform", "scale("+(stripWidth+stripSpacing)+") scale("+Math.sqrt(1/3)+" 1.0)");
        path.setAttribute("d", pMaskPath);
        if (path.parentNode == null) clippath.appendChild(path);
        if (clippath.parentNode == null) defs.appendChild(clippath);

        var gname = baseName+pname[p]+"G";
        var g = createSVGElementWithId(document, "g", gname);
        g.setAttribute("clip-path", "url(#"+cpname+")");
        if (g.parentNode == null) strips.appendChild(g);
        var dd;
        for (dd=2; dd>=0; dd--) {
            // ppn[p][0] is the direction number of the top direction
            // ppi[p][0] is the number of colors on top of direction 0
            var useDName = dname[ppn[p][dd]];
            var use = createSVGElementWithId(document, "use", baseName+pname[p]+"Use"+useDName);
            use.setAttributeNS(xlinkNS, "xlink:href", "#"+baseName+useDName+"Strips");
            if (use.parentNode == null) g.appendChild(use);
        }
    }
    if (baseName==="") {
        buildStripSelector(document);
        maybeShowPattern(document);
    }
}
var stripSelectorHeightFraction = 0.80;
var stripSelectorWidthFraction = 0.72;
function buildStripSelector(document) {
    var svg = document.getElementById("svg");
    var tools = createSVGElementWithId(document, "g", "tools");
    if (tools.parentNode == null) svg.appendChild(tools);
    tools.setAttributeNS(inkscapeNS, "inkscape:groupmode", "layer");
  var stripsCover = createSVGElementWithId(document, "rect", "stripsCover");
  stripsCover.setAttribute("x", -viewWidth * 0.5 * stripSelectorWidthFraction);
  stripsCover.setAttribute("y", -viewHeight * 0.5 * stripSelectorHeightFraction);
  stripsCover.setAttribute("width", viewWidth * stripSelectorWidthFraction);
  stripsCover.setAttribute("height", viewHeight * stripSelectorHeightFraction);
  stripsCover.setAttribute("fill", "white");
  stripsCover.setAttribute("opacity", 0);
  stripsCover.setAttribute("pointer-events", "fill");
  stripsCover.setAttribute("onmousemove", "showMouseLocation(evt)");
  stripsCover.setAttribute("onmouseout", "unshowMouseStrip(evt.target)");
  stripsCover.setAttribute("onmousedown", "setCurrentStripColorToCurrentDefault(evt)");
  if (stripsCover.parentNode == null) tools.appendChild(stripsCover);
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
function setButtonRectColor(buttonRect, colorIndex) {
    var document = buttonRect.ownerDocument;
    var color = (colorIndex<0) ? lastColor[-colorIndex-1] : colorArray[colorIndex];
    var opacity = (colorIndex<0) ? lastOpacity[-colorIndex-1] : opacityArray[colorIndex];
    buttonRect.setAttribute("fill", color);
    buttonRect.setAttribute("fill-opacity", opacity);
    if (colorIndex>=0 && colorIndex == defaultColorIndex) {
        if (!hideStrips && !showStrips)
            buttonRect.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
        setColorChooserColor(buttonRect.ownerDocument, buttonRect.getAttribute("fill"), buttonRect.getAttribute("fill-opacity"));
    }
}

function setVisibleOrHidden(g,makeVisible) {
    showStrips = makeVisible;
    hideStrips = !makeVisible;
    var document = g.ownerDocument;
    var defaultColorButton = document.getElementById("buttonC"+defaultColorIndex);
    defaultColorButton.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
    var inactiveButton = document.getElementById("button"+(!makeVisible?"V":"I"));
    inactiveButton.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
    var activeButton = document.getElementById("button"+(makeVisible?"V":"I"));
    activeButton.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
}
function setDefaultColor(g, colorIndex) {
  var document = g.ownerDocument;
    if (hideStrips || showStrips) {
        document.getElementById("buttonV").setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
        document.getElementById("buttonI").setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
        hideStrips = false;
        showStrips = false;
    } else {
        var defaultColorButton = document.getElementById("buttonC"+defaultColorIndex);
        defaultColorButton.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
        if (defaultColorIndex != colorIndex) {
            saveColorInLast(document);
            defaultColorIndex = colorIndex;
        }
    }
    var defaultColorButton = document.getElementById("buttonC"+defaultColorIndex);
    defaultColorButton.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
    setColorChooserColor(document, defaultColorButton.getAttribute("fill"), defaultColorButton.getAttribute("fill-opacity"));
}
function toggleVisibilityH(g, c) {
  var document = g.ownerDocument;
  var visibilityButton = document.getElementById("buttonVH"+c);
  showC[c] = !showC[c];
  if (showC[c]) 
    visibilityButton.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
  else
    visibilityButton.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
  buildDefs(document);
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
  buildDefs(document);
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
  resetColorIndexArray(document);
  resetVisibilityIndexArray(document);
  buildDefs(document);
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
  resetColorIndexArray(document);
  resetVisibilityIndexArray(document);
  buildDefs(document);
  buildStrips(document);
  processing = false;
}
var switchOptimizationForFasterEditing = false;
function reshowStrip(document, index) {
    if (optimizeForFixedSolidColors) {
        buildDefs(document);
        buildStrips(document.getElementById("strips"));
    } else {
        var indexName = name(stripsPerDirection, index);
        var path = document.getElementById("P"+indexName);
        if (path == null) return;
        var visible = (isVisible(starMadWeaveCenter, stripsPerDirection, index) && getVisibility(visibilityIndexArray, index));
        path.setAttribute("fill", getColor(colorIndexArray, index));
        path.setAttribute("fill-opacity", visible ? getOpacity(colorIndexArray, index) : 0);
        var gstrip = document.getElementById("GP"+indexName);
        gstrip.setAttribute("visibility", visible ? "visible" : "hidden");
        if (showingLines) {
            var lstrip = createSVGElementWithId(document, "path", "LP"+indexName);
            lstrip.setAttribute("fill-opacity", visible ? opacityArray[colorIndexArray[index]] : 0);
        }
        maybeShowPattern(document);
    }
}
function setStripColorToCurrentDefault(g, stripIndex) {
    var document = g.ownerDocument;
    if (hideStrips) {
        setVisibilityIndex(document,stripIndex,false);
    } else {
        setColorIndex(document,stripIndex,defaultColorIndex);
        setVisibilityIndex(document,stripIndex,true);
    }
    reshowStrip(document, stripIndex);
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
    var tools = document.getElementById("tools");
    tools.appendChild(mouseStrip);
  }
  return mouseStrip;
}
var mouseStripIndex = -1;
function showMouseStrip(g, index) {
    if (index != mouseStripIndex) {
        var mouseStrip = getMouseStrip(g.ownerDocument);
        if (isVisible(starMadWeaveCenter, stripsPerDirection, index)) {
            mouseStrip.setAttribute("d", stripPath(stripsPerDirection, index));
            mouseStrip.setAttribute("transform", trans(stripsPerDirection, index));
            mouseStrip.setAttribute("visibility", "visible");
            mouseStrip.setAttribute("fill-opacity", 1); /* "visibility" work-around for inkscape */
            mouseStrip.setAttribute("stroke-opacity", 1); /* "visibility" work-around for inkscape */
        } else {
            mouseStrip.setAttribute("visibility", "hidden");
            mouseStrip.setAttribute("fill-opacity", 0); /* "visibility" work-around for inkscape */
            mouseStrip.setAttribute("stroke-opacity", 0); /* "visibility" work-around for inkscape */
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
  buildDefs(document);
  buildStrips(document);
}
function setSeparation(g, newSeparationIndex) {
  separationIndex = newSeparationIndex;
  stripSpacingFraction = separationValue[separationIndex];
  stripSpacing = stripWidth * stripSpacingFraction;
  setContent(g, baseSize);
}
var hidingButtons = false;
function showOrHideButtons(g) {
    hidingButtons = !hidingButtons;
    var document = g.ownerDocument;
    var buttons = document.getElementById("buttons");
    var child = buttons.firstChild;
    while (child != null) {
        var nextChild = child.nextSibling;
        if (child.hasAttributes() && child.getAttribute("id").match("gbutton.*")) {
            child.setAttribute("visibility", hidingButtons?"hidden":"visible");
        }
        child = nextChild;
    }
}
function setButtonDocumentationVisibility(cbutton, visibility) {
    var document = cbutton.ownerDocument;
    var name = cbutton.getAttribute("id").substring(7); // skip "cbutton"
    var documentation = document.getElementById("doc"+name);
    documentation.setAttribute("visibility", visibility);
}
function showButtonDocumentation(g) {
    setButtonDocumentationVisibility(g, "visible");
}
function hideButtonDocumentation(g) {
    setButtonDocumentationVisibility(g, "hidden");
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
function addButton(g, locX, locY, dirX, dirY, indexOffset, index, label, name, action, documentation) {
    var document = g.ownerDocument;
    var rg = createSVGElementWithId(document, "g", "gbutton"+name);
    // d=0.05; sep=d/5; margin=0.04; locX=0; locY=-1; indexOffset=-2.7; index=0.0 to 5.6;
    // viewWidth * 0.06 * (-2.7 to 2.9)
    var rectCenterX = viewWidth  * (locX * (0.5-margin-d/2) + dirX * (d+sep)*(index+indexOffset));
    var rectCenterY = viewHeight * (locY * (0.5-margin-d/2) + dirY * (d+sep)*(index+indexOffset));
    var widthExpand = 1.0;
    var heightExpand = 1.0;
    if (name == "OB" || name == "HB" || name == "SB" || name == "VB") widthExpand = 2.5;
    var rectX = rectCenterX-(buttonRectSize/2*widthExpand);
    var rectY = rectCenterY-buttonRectSize/2;
    var rect;
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
        rect = createSVGElementWithId(document, "rect", "button"+name);
        if (rect.parentNode == null) rg.appendChild(rect);
        rect.setAttribute("x", rectX);
        rect.setAttribute("y", rectY);
        rect.setAttribute("width", buttonRectSize*widthExpand);
        rect.setAttribute("height", buttonRectSize*heightExpand);
        //rect.setAttribute("fill-opacity", (name=="OB") ? 0.0 : 1.0); 
        if (name == "OB")
            rect.setAttribute("fill", "url(#opacityAtColor)");
        else if (name == "HB")
            rect.setAttribute("fill", "url(#hueAtSatValue)");
        else if (name == "SB")
            rect.setAttribute("fill", "url(#satAtHueValue)");
        else if (name == "VB")
            rect.setAttribute("fill", "url(#valueAtHueSat)");
        else 
            rect.setAttribute("fill", "whitesmoke");
        rect.setAttribute("stroke", "black");
        if ((name.substring(0,2) == "VH" && showC[name.substring(2)]) ||
            (name.substring(0,2) == "VD" && showD[name.substring(2)]) ||
            (name == "SC"+baseSize) || 
            (name == "Sep"+separationIndex) ||
            (name == (showingPattern?"SP":"HP")) ||
            (name == (showingLines?"Lines":"NoLines")) ||
            (name == '-' && hand) ||
            (name == 'X' && alternate) ||
            (name == 'C' && starMadWeaveCenter))
            rect.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
        else
            rect.setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth);
        if (name=="OB" || name=="HB" || name == "SB" || name=="VB") {
            var gptr = createSVGElementWithId(document, "g", "button"+name+"ptr");
            if (gptr.parentNode == null) rg.appendChild(gptr);
        }
        var text = createSVGElementWithId(document, "text", "text"+name);
        var text_font_size = (buttonRectSize*0.7)/(label.length==0?1:label.length);
        text.setAttribute("x", rectCenterX);
        text.setAttribute("y", rectCenterY + text_font_size/2.4);
        text.setAttribute("font-family", "Verdana");
        text.setAttribute("font-size", text_font_size);
        text.setAttribute("fill", "dimgray");
        text.setAttribute("stroke-width", buttonRectSize*0.03);
        text.setAttribute("text-anchor", "middle"); 
        //text.setAttribute("alignment-baseline", "text-bottom"); 
        if (text.parentNode == null) {
            var textNode = document.createTextNode(label);
            text.appendChild(textNode);
            rg.appendChild(text);
        }
    }
    var doc = createSVGElementWithId(document, "g", "doc"+name);
    doc.setAttribute("visibility", "hidden");
    if (doc.parentNode == null) {
        var docs = createSVGElementWithId(document, "g", "documentations");
        docs.appendChild(doc);
    }
    var doc_font_size = buttonRectSize*0.55;
    var centerBoxFraction = 0.3;
    var doc_x, doc_y, doc_text_anchor;    
    if ((rectCenterX>=(-viewWidth*centerBoxFraction)) && (rectCenterX<=(viewWidth*centerBoxFraction))) {
        doc_x = 0;
        doc_y = rectCenterY + doc_font_size/2.4 + (buttonRectSize*1.2)*((rectCenterY<(-viewHeight*centerBoxFraction)) ? 1 : (rectCenterY>(viewHeight*centerBoxFraction)) ? -1 : 0);
        doc_text_anchor = "middle";
    } else {
        doc_x = rectCenterX +        (buttonRectSize*widthExpand*0.75)*((rectCenterX<(-viewWidth*centerBoxFraction)) ? 1 : (rectCenterX>(viewWidth*centerBoxFraction)) ? -1 : 0);
        doc_y = rectCenterY + doc_font_size/2.4;
        doc_text_anchor = (rectCenterX<(-viewWidth*centerBoxFraction)) ? "start" : (rectCenterX>(viewWidth*centerBoxFraction)) ? "end" : "middle";
    }
    var doc_text_index;
    for (doc_text_index = 0; doc_text_index<2; doc_text_index++) {
        var doc_text = createSVGElementWithId(document, "text", "doc"+name+"_"+doc_text_index);
        doc_text.setAttribute("x", doc_x);
        doc_text.setAttribute("y", doc_y);
        doc_text.setAttribute("text-anchor", doc_text_anchor);
        doc_text.setAttribute("font-family", "Verdana");
        doc_text.setAttribute("font-size", doc_font_size);
        if (doc_text_index==0) {
            doc_text.setAttribute("stroke", "white");
            doc_text.setAttribute("stroke-width", buttonRectSize*0.020*3);
            doc_text.setAttribute("stroke-opacity", 0.65);
        } else {
            doc_text.setAttribute("fill", "black");
        }
        if (doc_text.parentNode == null) {
            var textNode = document.createTextNode(documentation);
            doc_text.appendChild(textNode);
            doc.appendChild(doc_text);
        }
    }
    var clickCatcher = createSVGElementWithId(document, "rect", "cbutton"+name);
    if ("OB" == name || "HB" == name || "SB" == name || "VB" == name) {
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
    clickCatcher.setAttribute("onmouseover", "showButtonDocumentation(evt.target)");
    clickCatcher.setAttribute("onmouseout", "hideButtonDocumentation(evt.target)");
    if (clickCatcher.parentNode == null) rg.appendChild(clickCatcher);
    if (rg.parentNode == null) g.appendChild(rg);
    return rect;
}
function buildButtons(document) {
  var svg = document.getElementById("svg");
  var buttons = createSVGElementWithId(document, "g", "buttons");
  if (buttons.parentNode == null) svg.appendChild(buttons);
  buttons.setAttributeNS(inkscapeNS, "inkscape:groupmode", "layer");
  var documentations = createSVGElementWithId(document, "g", "documentations");
  if (documentations.parentNode == null) svg.appendChild(documentations);
  documentations.setAttributeNS(inkscapeNS, "inkscape:groupmode", "layer");

  var bw = (d+sep+sep);

//addButton(buttons, locX, locY, dirX, dirY, indexOffset, index, label, name, action)
    addButton(buttons, -1+bw,-1,   0,    1,    0,           0.5, "cp1.png", "CP0", "changeColorPattern(evt.target,0)", "Change the pattern to pattern number 1");
    addButton(buttons, -1+bw,-1,   0,    1,    0,           1.5, "cp2.png", "CP1", "changeColorPattern(evt.target,1)", "Change the pattern to pattern number 2");
    addButton(buttons, -1+bw,-1,   0,    1,    0,           2.5, "cp3.png", "CP2", "changeColorPattern(evt.target,2)", "Change the pattern to pattern number 3");
    addButton(buttons, -1+bw,-1,   0,    1,    0,           3.5, "cp4.png", "CP3", "changeColorPattern(evt.target,3)", "Change the pattern to pattern number 4");
    addButton(buttons, -1+bw,-1,   0,    1,    0,           4.5, "cp5.png", "CP4", "changeColorPattern(evt.target,4)", "Change the pattern to pattern number 5");
  document.getElementById("buttonCP"+colorPattern).setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);

    addButton(buttons, -1-bw,-1,   0,    1,    0,           0, "1", "CC1", "changeColorCount(evt.target,1)", "Change the pattern to use 1 color");
    addButton(buttons, -1-bw,-1,   0,    1,    0,           1, "2", "CC2", "changeColorCount(evt.target,2)", "Change the pattern to use 2 colors");
    addButton(buttons, -1-bw,-1,   0,    1,    0,           2, "3", "CC3", "changeColorCount(evt.target,3)", "Change the pattern to use 3 colors");
    addButton(buttons, -1-bw,-1,   0,    1,    0,           3, "4", "CC4", "changeColorCount(evt.target,4)", "Change the pattern to use 4 colors");
    addButton(buttons, -1-bw,-1,   0,    1,    0,           4, "5", "CC5", "changeColorCount(evt.target,5)", "Change the pattern to use 5 colors");
    addButton(buttons, -1-bw,-1,   0,    1,    0,           5, "6", "CC6", "changeColorCount(evt.target,6)", "Change the pattern to use 6 colors");
  document.getElementById("buttonCC"+colorCount).setAttribute("stroke-width", buttonRectSize*buttonStrokeWidth*2.5);
  numberOfColorCountButtons = 6;

    addButton(buttons, -1,    1,   0,   -1,    0,           7, "1", "SC1", "setContent(evt.target,1)", "Change the pattern to use 3 strips per direction");
    addButton(buttons, -1,    1,   0,   -1,    0,           6, "2", "SC2", "setContent(evt.target,2)", "Change the pattern to use 6 strips per direction");
    addButton(buttons, -1,    1,   0,   -1,    0,           5, "3", "SC3", "setContent(evt.target,3)", "Change the pattern to use 9 strips per direction");
    addButton(buttons, -1,    1,   0,   -1,    0,           4, "4", "SC4", "setContent(evt.target,4)", "Change the pattern to use 12 strips per direction");
    addButton(buttons, -1,    1,   0,   -1,    0,           3, "5", "SC5", "setContent(evt.target,5)", "Change the pattern to use 15 strips per direction");
    addButton(buttons, -1,    1,   0,   -1,    0,           2, "6", "SC6", "setContent(evt.target,6)", "Change the pattern to use 18 strips per direction");
    addButton(buttons, -1,    1,   0,   -1,    0,           1, "7", "SC7", "setContent(evt.target,7)", "Change the pattern to use 21 strips per direction");
    addButton(buttons, -1,    1,   0,   -1,    0,           0, "8", "SC8", "setContent(evt.target,8)", "Change the pattern to use 24 strips per direction");

  var cbo = -5.7;
    addButton(buttons,  0, -1, 1, 0, cbo, 0, "V", "V", "setVisibleOrHidden(evt.target,true)", "Clicking on the selected strip makes it visible without altering its color")
    addButton(buttons,  0, -1, 1, 0, cbo, 1, "I", "I", "setVisibleOrHidden(evt.target,false)", "Clicking on the selected strip makes it invisible without altering its color")
  cbo = -3.3;
    setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 0, "", "C0", "setDefaultColor(evt.target,0)", "Color 1: Select this color to make changes to it, or to change to strips to this color"), 0);
    setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 1, "", "C1", "setDefaultColor(evt.target,1)", "Color 2: Select this color to make changes to it, or to change to strips to this color"), 1);
    setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 2, "", "C2", "setDefaultColor(evt.target,2)", "Color 3: Select this color to make changes to it, or to change to strips to this color"), 2);
    setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 3, "", "C3", "setDefaultColor(evt.target,3)", "Color 4: Select this color to make changes to it, or to change to strips to this color"), 3);
    setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 4, "", "C4", "setDefaultColor(evt.target,4)", "Color 5: Select this color to make changes to it, or to change to strips to this color"), 4);
    setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 5, "", "C5", "setDefaultColor(evt.target,5)", "Color 6: Select this color to make changes to it, or to change to strips to this color"), 5);
    setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 6, "", "C6", "setDefaultColor(evt.target,6)", "Color 7: Select this color to make changes to it, or to change to strips to this color"), 6);
    setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 7, "", "C7", "setDefaultColor(evt.target,7)", "Color 8: Select this color to make changes to it, or to change to strips to this color"), 7);

    cbo = 5.3;
    setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 0, "", "LAST0", "setColorFromLast(evt.target,0)", "Last Color 1: Click here to change the selected color to this color"), -1);
    setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 1, "", "LAST1", "setColorFromLast(evt.target,1)", "Last Color 2: Click here to change the selected color to this color"), -2);
    setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 2, "", "LAST2", "setColorFromLast(evt.target,2)", "Last Color 3: Click here to change the selected color to this color"), -3);
    setButtonRectColor(addButton(buttons,  0, -1, 1, 0,cbo, 3, "", "LAST3", "setColorFromLast(evt.target,3)", "Last Color 4: Click here to change the selected color to this color"), -4);
    
    addButton(buttons,  1,-1,   0,    1,    0,         1.2,  "", "OB", "setOpacity(evt)", "Change the opacity of the selected color");
    addButton(buttons,  1,-1,   0,    1,    0,         2.2,  "", "HB", "setHue(evt)", "Change the hue of the selected color");
    addButton(buttons,  1,-1,   0,    1,    0,         3.2,  "", "SB", "setSat(evt)", "Change the saturation of the selected color");
    addButton(buttons,  1,-1,   0,    1,    0,         4.2,  "", "VB", "setValue(evt)", "Change the value of the selected color");

  //addButton(buttons,  0,    1,   0,    0,    0,           0, "S", "SP", "showOrHidePattern(evt.target)", "Show or hide details about the pattern");
    addButton(buttons,  0,    1,   0,    0,    0,           0, "HB", "HideButtons", "showOrHideButtons(evt.target)", "Hide all the buttons; click here again to make them visible");

    addButton(buttons,  1-2*bw, 1,   0,   -1,    0,         8.9, "-", "-", "changeHand(evt.target)", "Switch between clockwise and counterclockwise");
    addButton(buttons,  1,      1,   0,   -1,    0,         8.9, "X", "X", "changeTop(evt.target)", "Flip top and bottom");
    addButton(buttons,  1+2*bw, 1,   0,   -1,    0,         8.9, "C", "C", "changeCenter(evt.target)", "Change the type of the center by shifting the pattern one unit");

    addButton(buttons,  1-bw, 1,   0,   -1,    0,         7.6, "a", "VH0", "toggleVisibilityH(evt.target,0)", "Hide or Show the \"a\" hex weave");
    addButton(buttons,  1-bw, 1,   0,   -1,    0,         6.6, "b", "VH1", "toggleVisibilityH(evt.target,1)", "Hide or Show the \"b\" hex weave");
    addButton(buttons,  1-bw, 1,   0,   -1,    0,         5.6, "c", "VH2", "toggleVisibilityH(evt.target,2)", "Hide or Show the \"c\" hex weave");

    addButton(buttons,  1+bw, 1,   0,   -1,    0,         7.6, "H", "VD0", "toggleVisibilityD(evt.target,0)", "Hide or Show the Horizontal strips");
    addButton(buttons,  1+bw, 1,   0,   -1,    0,         6.6, "R", "VD1", "toggleVisibilityD(evt.target,1)", "Hide or Show the strips that go up and to the Right");
    addButton(buttons,  1+bw, 1,   0,   -1,    0,         5.6, "L", "VD2", "toggleVisibilityD(evt.target,2)", "Hide or Show the strips that go up and to the Left");

    addButton(buttons,  1,    1,   0,   -1,    0,         4.3, "L", "Lines", "showOrHideLines(evt.target)", "Hide or Show lines at the edges of the strips");

    addButton(buttons,  1,    1,   0,   -1,    0,           3, "N", "Sep0", "setSeparation(evt.target,0)", "Set the strip separation to Narrow");
    addButton(buttons,  1,    1,   0,   -1,    0,           2, "M", "Sep1", "setSeparation(evt.target,1)", "Set the strip separation to Medium");
    addButton(buttons,  1,    1,   0,   -1,    0,           1, "W", "Sep2", "setSeparation(evt.target,2)", "Set the strip separation to Wide");
    addButton(buttons,  1,    1,   0,   -1,    0,           0, "E", "Sep3", "setSeparation(evt.target,3)", "Set the strip separation to Extra wide");

    setPointer(document, "OB", currentOpacity);
    setPointer(document, "HB", currentHue/360);
    setPointer(document, "SB", currentSat);
    setPointer(document, "VB", currentValue);
}
function setContent(g, newBaseSize) {
  if (processing) return;
  processing = true;
  var document = g.ownerDocument;
  setupNewBaseSize(document,newBaseSize);
  buildDefs(document);
  buildStrips(document);
  buildButtons(document);
    var svg = document.getElementById("svg");
    svg.setAttribute("onload","setSavedContent(evt.target)");
  processing = false;
}
function setSavedContent(g) {
  if (processing) return;
  processing = true;
    var document = g.ownerDocument;
    setupNewBaseSize(document);
    var i;
    for (i=0; i<colorArray.length; i++) {
        var colorButton = document.getElementById("buttonC"+i);
        colorArray[i] = colorButton.getAttribute("fill");
        opacityArray[i] = colorButton.getAttribute("fill-opacity");
        if (parseFloat(colorButton.getAttribute("stroke-width")) > buttonRectSize*buttonStrokeWidth*1.1)
            defaultColorIndex = i;
    }
    var i;
    for (i=0; i<lastColor.length; i++) {
        var lastButton = document.getElementById("buttonLAST"+i);
        lastColor[i] = lastButton.getAttribute("fill");
        lastOpacity[i] = lastButton.getAttribute("fill-opacity");
    }
    hand = parseFloat(document.getElementById("button-").getAttribute("stroke-width"))>buttonRectSize*buttonStrokeWidth*1.1;
    alternate = parseFloat(document.getElementById("buttonX").getAttribute("stroke-width"))>buttonRectSize*buttonStrokeWidth*1.1;
    starMadWeaveCenter = parseFloat(document.getElementById("buttonC").getAttribute("stroke-width"))>buttonRectSize*buttonStrokeWidth*1.1;
    for (i=0; i<3; i++) {
        showC[i] = parseFloat(document.getElementById("buttonVH"+i).getAttribute("stroke-width"))>buttonRectSize*buttonStrokeWidth*1.1;
        showD[d] = parseFloat(document.getElementById("buttonVD"+i).getAttribute("stroke-width"))>buttonRectSize*buttonStrokeWidth*1.1;
    }
    showingLines = parseFloat(document.getElementById("buttonLines").getAttribute("stroke-width"))>buttonRectSize*buttonStrokeWidth*1.1;
    hideStrips = parseFloat(document.getElementById("buttonI").getAttribute("stroke-width"))>buttonRectSize*buttonStrokeWidth*1.1;
    showStrips = parseFloat(document.getElementById("buttonV").getAttribute("stroke-width"))>buttonRectSize*buttonStrokeWidth*1.1;
    for (i=0; i<4; i++) {
        if (parseFloat(document.getElementById("buttonSep"+i).getAttribute("stroke-width"))>buttonRectSize*buttonStrokeWidth*1.1) {
            separationIndex = i;
            stripSpacingFraction = separationValue[separationIndex];
            stripSpacing = stripWidth * stripSpacingFraction;
        }
    }
    for (i=0; i<5; i++) {
        if (parseFloat(document.getElementById("buttonCP"+i).getAttribute("stroke-width"))>buttonRectSize*buttonStrokeWidth*1.1) {
            colorPattern = i;
        }
    }
    for (i=1; i<=6; i++) {
        if (parseFloat(document.getElementById("buttonCC"+i).getAttribute("stroke-width"))>buttonRectSize*buttonStrokeWidth*1.1) {
            colorCount = i;
        }
    }
    var totalNumber = 3 * stripsPerDirection;
    colorIndexArray = Array(totalNumber);
    visibilityIndexArray = Array(totalNumber);
    var index,oldindex,d,s;
    for (i=0; i<totalNumber; i++) {
        var indexName = name(stripsPerDirection, i);
        var path = document.getElementById("P"+indexName);
        colorIndexArray[i] = path.getAttribute("mwColorIndex");
        var gstrip = document.getElementById("GP"+indexName);
        visibilityIndexArray[i] = gstrip.getAttribute("mwVisibility")=="visible";
    }
    var defaultColorButton = document.getElementById("buttonC"+defaultColorIndex);
    hidingButtons = document.getElementById("buttonLines").getAttribute("visibility") == "hidden";
    setColorChooserColor(document, defaultColorButton.getAttribute("fill"), defaultColorButton.getAttribute("fill-opacity"));

  processing = false;
}

