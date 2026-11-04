#!/usr/bin/env node
// Rotation of physical strips, pairwise order, classes, and fixed coloring.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const g=require('./planar-geometry.cjs'),engine=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','madweave.js'),'utf8'),engine);
const rotate=(p,k)=>{const a=k*Math.PI/3;return [p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a)];};
const rows=[];
for(let size=1;size<=8;size++)for(const separation of [.07,.33,.8,2]){
 const m=g.model(size,separation);
 for(let configuration=0;configuration<8;configuration++){
  const star=!!(configuration&1),alternate=!!(configuration&2),hand=!!(configuration&4);
  Object.assign(engine,{starMadWeaveCenter:star,alternate,hand,colorCount:3});
  for(const k of [1,2,3]){
   const mapping=m.rectangles.map(r=>({d:(r.d+(k%2?(k+3)/2:k/2))%3,s:k%2?2*m.offset-r.s:r.s}));
   const physical=mapping.every(r=>r.s>=0&&r.s<m.n);
   assert.equal(physical,k===2||size%2===0,'Unexpected finite-strip rotation symmetry');
   let orderSymmetry=null,classPermutation=null,directionColors=null,uniqueLabels=null;
   if(physical){
    for(let i=0;i<m.rectangles.length;i++){
     const r=mapping[i],target=m.rectangles[r.d*m.n+r.s];
     assert(g.samePolygon(m.rectangles[i].vertices.map(p=>rotate(p,k)),target.vertices),'Rotated rectangle mismatch');
    }
    let comparisons=0,disagreements=0;
    for(let d=0;d<3;d++)for(let e=d+1;e<3;e++)for(let s=0;s<m.n;s++)for(let t=0;t<m.n;t++){
     const a=mapping[d*m.n+s],b=mapping[e*m.n+t];
     comparisons++;
     if(engine.isCoveredBy(s,d,t,e)!==engine.isCoveredBy(a.s,a.d,b.s,b.d))disagreements++;
    }
    orderSymmetry=disagreements===0;
    assert.equal(orderSymmetry,k===2||(star&&!hand),'Wrong crossing-order rotation classification');
    const classTargets=[new Set(),new Set(),new Set()];
    for(let i=0;i<mapping.length;i++){
     const oldClass=engine.getC(star,m.n,i),r=mapping[i];
     classTargets[oldClass].add(engine.getC(star,m.n,r.d*m.n+r.s));
    }
    classPermutation=classTargets.every(s=>s.size===1)?classTargets.map(s=>[...s][0]):null;
    if(k===2)assert.deepEqual(classPermutation,star?[2,0,1]:[0,1,2]);
    else if(!star)assert.deepEqual(classPermutation,[2,1,0]);
    else assert.equal(classPermutation,null);
    directionColors=mapping.every((r,i)=>engine.colorIndex(0,star,m.n,i)===engine.colorIndex(0,star,m.n,r.d*m.n+r.s));
    assert.equal(directionColors,k===3,'Fixed direction colors should only preserve the half-turn');
    uniqueLabels=mapping.every((r,i)=>r.d*m.n+r.s===i);
    assert.equal(uniqueLabels,false);
    rows.push({size,separation,configuration,degrees:k*60,physical,orderSymmetry,classPermutation,directionColors,
     coloredWeaveSymmetry:orderSymmetry&&directionColors,uniqueLabels,comparisons,disagreements});
   }else rows.push({size,separation,configuration,degrees:k*60,physical,orderSymmetry,classPermutation,directionColors,uniqueLabels});
  }
 }
}
const visibleTop=[];
const centerModel=g.model(2,.33),centerRegions=g.centralRegions(centerModel).filter(r=>r.present.length);
for(let configuration=0;configuration<8;configuration++)for(const k of [1,2,3]){
 Object.assign(engine,{starMadWeaveCenter:!!(configuration&1),alternate:!!(configuration&2),hand:!!(configuration&4)});
 let mismatches=0,witness=null;
 for(const region of centerRegions){
  const point=rotate(region.point,k),present=g.occupancy(centerModel,point);
  const indices=g.normals.map(n=>Math.round(g.dot(n,point)+centerModel.offset));
  const first=g.order(engine,region.indices).find(d=>region.present.some(p=>p.d===d));
  const second=g.order(engine,indices).find(d=>present.some(p=>p.d===d));
  const rotatedDirection=(first+(k%2?(k+3)/2:k/2))%3;
  if(rotatedDirection!==second){mismatches++;witness ||= {point:region.point,rotatedPoint:point,firstTop:first,rotatedExpectedTop:rotatedDirection,actualTop:second};}
 }
 assert.equal(mismatches===0,k===2||Boolean(configuration&1)&&!Boolean(configuration&4));
 visibleTop.push({configuration,degrees:k*60,comparisons:centerRegions.length,mismatches,witness});
}
fs.mkdirSync('research/output/symmetry',{recursive:true});
fs.writeFileSync('research/output/symmetry/results.json',JSON.stringify({center:[0,0],rows,visibleTop},null,2)+'\n');
console.log(JSON.stringify({rotationalCases:rows.length,visibleTopComparisons:visibleTop.reduce((n,r)=>n+r.comparisons,0),pairComparisons:rows.reduce((n,r)=>n+(r.comparisons||0),0),physicalSymmetryCases:rows.filter(r=>r.physical).length},null,2));
