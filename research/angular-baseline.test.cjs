#!/usr/bin/env node
// Preparatory characterization only: coneFraction stays 1 in every VM.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'..','madweave.js'),'utf8');
const w=vm.createContext({});vm.runInContext(source,w);
const near=(a,b,eps=1e-8)=>assert(Math.abs(a-b)<=eps,`${a} != ${b}`);
const points=raw=>(raw.match(/[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi)||[]).map(Number).reduce((out,v,i,all)=>{if(i%2===0)out.push([v,all[i+1]]);return out;},[]);
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
function clipSegment(a,b,angle){
 let low=0,high=1;
 for(const n of [[0,-1],[-Math.sin(angle),Math.cos(angle)]]){
  const start=n[0]*a[0]+n[1]*a[1],change=n[0]*(b[0]-a[0])+n[1]*(b[1]-a[1]);
  if(Math.abs(change)<1e-12){if(start>1e-10)return null;continue;}
  const t=-start/change;
  if(change>0)high=Math.min(high,t);else low=Math.max(low,t);
 }
 return high>=low?[low,high]:null;
}
let intersections=0,segments=0,picks=0;
for(const angle of [0,Math.PI/3,Math.PI/2,2*Math.PI/3]){
 const ray=[Math.cos(angle),Math.sin(angle)];
 for(const [a,b] of [[[1,-1],[1,1]],[[-2,1],[3,-1]],[[1,2],[-2,-1]],[[0,0],[1,1]]]){
  const delta=[b[0]-a[0],b[1]-a[1]],denominator=cross(delta,ray);
  if(Math.abs(denominator)<1e-10)continue;
  near(w.intersectionPoint(angle,...a,...b),-cross(a,ray)/denominator);intersections++;
 }
}
assert(Number.isNaN(w.intersectionPoint(0,1,0,2,0)),'Collinear line intersection should be characterized as undefined');
assert(!Number.isFinite(w.intersectionPoint(0,1,1,2,1)),'Parallel intersection should be characterized as nonfinite');
for(const angle of [Math.PI/3,2*Math.PI/3])for(const count of [2,8]){
 Object.assign(w,{transformInPath:true,coneFraction:1,numberOfDirections:3,drawOneUnit:true,npoints:count,angleOfUnit:angle});
 const cases=[[[1,1],[2,1]],[[1,-1],[1,1]],[[-1,1],[1,1]],[[1,0],[2,0]],[[-1,-1],[-2,-1]],[[0,0],[1,1]],[[-1,-.2],[-1,.2]]];
 for(let i=0;i<100;i++)cases.push([[Math.sin(i+.13)*2,Math.cos(i*.7+.19)*2],[Math.cos(i*.3+.27)*2,Math.sin(i*.9+.31)*2]]);
 for(const [a,b] of cases){
  const expected=clipSegment(a,b,angle);
  w.firstTransformPoint=true;
  const actual=points(w.transformPointToPath(...a,...b,0,0));
  if(!expected){assert.equal(actual.length,0);segments++;continue;}
  assert(actual.length>0,'Clipped segment unexpectedly empty');
  const ends=expected.map(t=>[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);
  for(let c=0;c<2;c++){near(actual[0][c],ends[0][c],2e-5);near(actual.at(-1)[c],ends[1][c],2e-5);}
  assert(actual.flat().every(Number.isFinite));segments++;
 }
}
Object.assign(w,{drawOneUnit:false,npoints:2,coneFraction:1,transformInPath:true});
for(const degrees of [0,120,240])for(const ty of [-2,.5,3]){
 w.firstTransformPoint=true;
 const a=[-1,.4],b=[2,.4],angle=degrees*Math.PI/180;
 const expected=([x,y])=>[Math.cos(angle)*x-Math.sin(angle)*(y+ty),Math.sin(angle)*x+Math.cos(angle)*(y+ty)];
 const actual=points(w.transformPointToPath(...a,...b,ty,degrees));
 const first=expected(a),last=expected(b);
 for(let c=0;c<2;c++){near(actual[0][c],first[c]);near(actual.at(-1)[c],last[c],4e-6);}
}
w.firstTransformPoint=true;
const contracted=points(w.transformPointToPath(1,1,2,1,0,0));
assert(contracted.at(-1)[0]<2,'Endpoint contraction is part of the current helper behavior');
near(2-contracted.at(-1)[0],1e-6/(1+1e-6),1e-10);
w.firstTransformPoint=true;
const branch=points(w.transformPointToPath(-1,-.2,-1,.2,0,0));
assert(branch.flat().every(Number.isFinite));near(w.extraAnglet,-2*Math.PI);
for(let size=1;size<=8;size++)for(const separation of [.07,.33,.8,2])for(const transformed of [false,true])for(const directions of [3,6]){
 Object.assign(w,{stripsPerDirection:3*size,stripSpacing:separation,stripWidth:1,transformInPath:transformed,numberOfDirections:directions,coneFraction:1});
 const offset=Math.floor(3*size/2)-.5,pitch=1+separation;
 for(let d=0;d<3;d++)for(let s=0;s<3*size;s++){
  const angle=d*2*Math.PI/3,normal=[-Math.sin(angle),Math.cos(angle)],point={x:normal[0]*(s-offset)*pitch,y:normal[1]*(s-offset)*pitch};
  assert.equal(w.getSForPoint(point,d),s);picks++;
 }
}
const initial=vm.createContext({});vm.runInContext(source,initial);
initial.starMadWeaveCenter=true;initial.starHexWeaveCenter=true;
assert.equal(initial.unitsPerCircle,3,'Angular derived settings are not reactive');
assert.equal(initial.directionsInUnit,1);
assert.equal(initial.coneFraction,1);
const starStartup=vm.createContext({});vm.runInContext(source.replace('var starHexWeaveCenter = false;','var starHexWeaveCenter = true;'),starStartup);
assert.equal(starStartup.unitsPerCircle,6);assert.equal(starStartup.directionsInUnit,2);
assert.equal(starStartup.numberOfUnits,1.5,'Startup star flag violates the integer-unit requirement with three directions');
assert.equal(starStartup.coneFraction,1);
const report={coneFraction:1,intersections,clippedSegments:segments,stripPicks:picks,
 knownLimitations:['Parallel/collinear intersection results need caller guards','Last endpoint is contracted by the 1e-6 denominator','Angular setup is evaluated only at initialization','Startup starHex with three directions produces 1.5 units','Six-direction inverse bypass is unvalidated for nonunit fractions'],
 nonunitFractionsExecuted:false};
fs.mkdirSync('research/output/angular',{recursive:true});fs.writeFileSync('research/output/angular/results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
