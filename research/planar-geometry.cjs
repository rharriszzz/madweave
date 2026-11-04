// Independent Euclidean construction. No renderer functions or SVG hit tests.
const EPS=1e-9, SQRT3=Math.sqrt(3);
const normals=[[0,1],[-SQRT3/2,-.5],[SQRT3/2,-.5]];
const tangents=normals.map(([x,y])=>[y,-x]);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const area=poly=>Math.abs(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p[0]*q[1]-p[1]*q[0];},0))/2;
function clip(poly,normal,bound){
 const out=[];
 for(let i=0;i<poly.length;i++){
  const p=poly[i],q=poly[(i+1)%poly.length],a=dot(normal,p)-bound,b=dot(normal,q)-bound;
  if(a<=EPS)out.push(p);
  if((a<-EPS&&b>EPS)||(a>EPS&&b<-EPS)){
   const t=a/(a-b);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);
  }
 }
 return out.filter((p,i)=>!out.slice(0,i).some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<EPS));
}
const centroid=poly=>poly.reduce((s,p)=>[s[0]+p[0]/poly.length,s[1]+p[1]/poly.length],[0,0]);
function cell(indices,offset){
 let poly=[[-100,-100],[100,-100],[100,100],[-100,100]];
 for(let d=0;d<3;d++){
  poly=clip(poly,normals[d],indices[d]+.5-offset);
  poly=clip(poly,normals[d].map(v=>-v),-indices[d]+.5+offset);
 }
 return poly;
}
function model(size,separation){
 const n=3*size,offset=Math.floor(n/2)-.5,pitch=1+separation,width=1/pitch,length=n+3;
 const rectangles=[];
 for(let d=0;d<3;d++)for(let s=0;s<n;s++){
  const vertices=[];
  for(const [along,across] of [[-1,-1],[-1,1],[1,1],[1,-1]]){
   vertices.push(normals[d].map((v,i)=>v*(s-offset+across*width/2)+tangents[d][i]*along*length/2));
  }
  rectangles.push({d,s,vertices});
 }
 const ranges=normals.map(normal=>{
  const values=rectangles.flatMap(r=>r.vertices.map(p=>dot(normal,p)+offset));
  return [Math.floor(Math.min(...values)+.5),Math.floor(Math.max(...values)+.5)];
 });
 return {size,n,offset,pitch,width,length,rectangles,ranges};
}
function stripPlanes(m,d,s){
 const planes=[];
 for(const sign of [-1,1]){
  planes.push([normals[d].map(v=>v*sign),m.width/2+sign*(s-m.offset)]);
  planes.push([tangents[d].map(v=>v*sign),m.length/2]);
 }
 return planes;
}
function visibleCells(m){
 const cells=[];
 for(let a=m.ranges[0][0];a<=m.ranges[0][1];a++)for(let b=m.ranges[1][0];b<=m.ranges[1][1];b++){
  const last=3*m.offset-a-b;
  for(const c of [Math.floor(last),Math.ceil(last)]){
   const indices=[a,b,c],poly=cell(indices,m.offset);
   if(area(poly)<EPS)continue;
   const covered=[];
   for(let d=0;d<3;d++){
    if(indices[d]<0||indices[d]>=m.n)continue;
    let part=poly;
    for(const [normal,bound] of stripPlanes(m,d,indices[d]))part=clip(part,normal,bound);
    if(area(part)>EPS)covered.push(d);
   }
   if(covered.length)cells.push({indices,poly,covered});
  }
 }
 return cells;
}
function occupancy(m,p){
 return normals.map((normal,d)=>{
  const s=Math.round(dot(normal,p)+m.offset);
  return s>=0&&s<m.n&&Math.abs(dot(normal,p)-(s-m.offset))<m.width/2-EPS&&
   Math.abs(dot(tangents[d],p))<m.length/2-EPS?{d,s}:null;
 }).filter(Boolean);
}
// Split central cells by all relevant finite rectangle boundaries. Each resulting
// convex polygon has constant strip occupancy; its centroid is a pixel probe.
function patchRegions(m,center=[0,0],radius=1){
 const regions=[];
 const ranges=normals.slice(0,2).map(n=>{
  const q=dot(n,center)+m.offset,extent=radius*(Math.abs(n[0])+Math.abs(n[1]));
  return [Math.floor(q-extent-.5),Math.ceil(q+extent+.5)];
 });
 for(let a=ranges[0][0];a<=ranges[0][1];a++)for(let b=ranges[1][0];b<=ranges[1][1];b++){
  const last=3*m.offset-a-b;
  for(const c of [Math.floor(last),Math.ceil(last)]){
   const indices=[a,b,c];let poly=cell(indices,m.offset);
   for(const normal of [[1,0],[-1,0],[0,1],[0,-1]])poly=clip(poly,normal,dot(normal,center)+radius);
   if(area(poly)<EPS)continue;
   let pieces=[poly];
   for(let d=0;d<3;d++){
    if(indices[d]<0||indices[d]>=m.n)continue;
    for(const [normal,bound] of stripPlanes(m,d,indices[d])){
     pieces=pieces.flatMap(p=>[clip(p,normal,bound),clip(p,normal.map(v=>-v),-bound)]).filter(p=>area(p)>EPS);
    }
   }
   for(const polygon of pieces){
    const point=centroid(polygon);
    regions.push({point,indices,present:occupancy(m,point),polygon,area:area(polygon)});
   }
  }
 }
 return regions;
}
function centralRegions(m,radius=2){return patchRegions(m,[0,0],radius);}
function clearance(m,p){
 let distance=Infinity;
 for(let d=0;d<3;d++){
  const s=Math.max(0,Math.min(m.n-1,Math.round(dot(normals[d],p)+m.offset)));
  const side=m.width/2-Math.abs(dot(normals[d],p)-(s-m.offset));
  const end=m.length/2-Math.abs(dot(tangents[d],p));
  const toBoundary=side>=0&&end>=0?Math.min(side,end):
   side<0&&end<0?Math.hypot(side,end):Math.max(-side,-end);
  distance=Math.min(distance,toBoundary);
 }
 return distance;
}
function order(engine,indices){
 const directions=[0,1,2];
 directions.sort((d,e)=>engine.isCoveredBy(indices[d],d,indices[e],e)?-1:1);
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){
  if(!engine.isCoveredBy(indices[directions[i]],directions[i],indices[directions[j]],directions[j]))
   throw Error('Cyclic precedence for cell '+indices.join(','));
 }
 return directions;
}
function triangles(path){
 const tokens=path.trim().split(/\s+/).filter(Boolean),result=[];
 if(tokens.length%10)throw Error('Unexpected triangle path');
 for(let i=0;i<tokens.length;i+=10){
  if(tokens[i]!=='M'||tokens[i+3]!=='L'||tokens[i+6]!=='L'||tokens[i+9]!=='Z')throw Error('Unexpected triangle command');
  const poly=[1,4,7].map(j=>[Number(tokens[i+j])/SQRT3,Number(tokens[i+j+1])]);
  if(poly.flat().some(v=>!Number.isFinite(v)))throw Error('Nonfinite triangle');
  result.push(poly);
 }
 return result;
}
function samePolygon(a,b,tolerance=1e-7){
 return a.length===b.length&&a.every(p=>b.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<=tolerance));
}
module.exports={EPS,normals,tangents,dot,area,clip,centroid,cell,model,visibleCells,occupancy,patchRegions,centralRegions,clearance,order,triangles,samePolygon};
