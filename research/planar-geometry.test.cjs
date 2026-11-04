#!/usr/bin/env node
// Independent slab intersections validate the original engine's triangle tiling.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const g=require('./planar-geometry.cjs');
const engine=vm.createContext({});
vm.runInContext(fs.readFileSync(process.argv[2]||path.join(__dirname,'..','madweave.js'),'utf8'),engine);
const output='research/output/geometry';fs.mkdirSync(output,{recursive:true});
const rows=[];
for(let size=1;size<=8;size++){
 const n=3*size,offset=Math.floor(n/2)-.5;
 const geometries=[.07,.33,.8,2].map(separation=>{
  const m=g.model(size,separation),cells=g.visibleCells(m),regions=g.centralRegions(m);
  assert(cells.length>0);
  // Include points beyond a corner: treating both outside coordinates as an
  // infinite clearance would admit antialiased rectangle-corner pixels.
  for(const point of [[0,0],[100,100],[m.length/2+.01,m.width/2+.01]]){
   const expected=Math.min(...m.rectangles.flatMap(r=>r.vertices.map((a,i)=>{
    const b=r.vertices[(i+1)%r.vertices.length],v=[b[0]-a[0],b[1]-a[1]];
    const t=Math.max(0,Math.min(1,((point[0]-a[0])*v[0]+(point[1]-a[1])*v[1])/(v[0]*v[0]+v[1]*v[1])));
    return Math.hypot(point[0]-a[0]-t*v[0],point[1]-a[1]-t*v[1]);
   })));
   assert(Math.abs(g.clearance(m,point)-expected)<1e-8,'Finite rectangle-corner clearance mismatch');
  }
  const byOccupancy=Array.from({length:4},(_,count)=>regions.filter(r=>r.present.length===count).length);
  assert(byOccupancy[0]>0&&byOccupancy[1]>0&&byOccupancy[2]>0,'Missing independent occupancy regions');
  assert.equal(byOccupancy[3]>0,separation<2,'Extra-wide spacing must have no positive-area triple region');
  assert(Math.abs(regions.reduce((sum,r)=>sum+r.area,0)-16)<1e-7,'Central regions must partition the 4×4 square');
  return {separation,m,cells,byOccupancy};
 });
 for(let configuration=0;configuration<8;configuration++){
  Object.assign(engine,{starMadWeaveCenter:!!(configuration&1),alternate:!!(configuration&2),hand:!!(configuration&4)});
  const actual=new Map();
  for(let permutation=0;permutation<6;permutation++)for(const poly of g.triangles(engine.maskPath(n,permutation))){
   const center=g.centroid(poly),indices=g.normals.map(normal=>Math.round(g.dot(normal,center)+offset));
   const key=indices.join(',');
   assert(!actual.has(key),'Duplicate/overlapping mask cell '+key);
   assert(g.samePolygon(poly,g.cell(indices,offset)),'Mask triangle differs from independent nearest-strip cell');
   assert.equal(engine.pname[permutation],g.order(engine,indices).map(d=>'HRL'[d]).join(''),'Mask order disagrees with pairwise rule');
   actual.set(key,permutation);
  }
  for(const {separation,m,cells,byOccupancy} of geometries){
   for(const {indices} of cells)assert(actual.has(indices.join(',')),`Uncovered finite strip cell: size=${size}, gap=${separation}, orientation=${configuration}, cell=${indices}`);
   rows.push({size,separation,configuration,maskTriangles:actual.size,visibleCells:cells.length,centralOccupancyRegions:byOccupancy});
  }
 }
}
fs.writeFileSync(output+'/results.json',JSON.stringify({method:'Independent finite rectangles and nearest-strip slab intersections',configurations:rows.length,rows},null,2)+'\n');
console.log(JSON.stringify({passed:rows.length,visibleCellChecks:rows.reduce((sum,r)=>sum+r.visibleCells,0),maskTriangleChecks:rows.filter(r=>r.separation===.07).reduce((sum,r)=>sum+r.maskTriangles,0)},null,2));
