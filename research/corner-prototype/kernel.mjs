// Separate Stage 2 diagram kernel. No production renderer or application globals.
export const TAU=2*Math.PI, SQRT3=Math.sqrt(3);
export const number=x=>typeof x==='string'?x.split('/').map(Number).reduce((a,b)=>a/b):x;
export const id=a=>a.join(':');
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const norm2=a=>dot(a,a);
const normals=[[0,1],[-SQRT3/2,-.5],[SQRT3/2,-.5]];
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function clip(poly,n,b){
  const out=[];
  for(let i=0;i<poly.length;i++){
    const p=poly[i],q=poly[(i+1)%poly.length],a=dot(n,p)-b,c=dot(n,q)-b;
    if(a<=0)out.push(p);
    if((a<0&&c>0)||(a>0&&c<0)){const t=a/(a-c);out.push(p.map((v,j)=>v+t*(q[j]-v)));}
  }
  return out.filter((p,i)=>!out.slice(0,i).some(q=>distance(p,q)<1e-12));
}
function area(p){return Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-a[1]*b[0];},0))/2;}
export function minRadius(a,b){
  const v=b.map((x,i)=>x-a[i]),t=Math.max(0,Math.min(1,-dot(a,v)/(norm2(v)||1)));
  return Math.hypot(...a.map((x,i)=>x+t*v[i]));
}
function polygonRadius(poly){return Math.min(...poly.map((a,i)=>minRadius(a,poly[(i+1)%poly.length])));}
function clean(poly){return poly.filter((p,i)=>!poly.slice(0,i).some(q=>distance(p,q)<1e-12));}

// Exact analytic boundary types, evaluated in double precision with a 1e-10
// world-coordinate reserve. The disk is never replaced by a clipping polygon.
export function boundary(poly,R){
  if(R===null)return poly.map((a,i)=>({kind:'line',a,b:poly[(i+1)%poly.length]}));
  const lines=[];
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],v=b.map((x,k)=>x-a[k]);
    const A=norm2(v);if(A<1e-24)continue;
    const B=2*dot(a,v),C=norm2(a)-R*R,D=B*B-4*A*C;
    if(D<=0)continue; // A tangent has no positive-length inside segment.
    const root=Math.sqrt(D),lo=Math.max(0,(-B-root)/(2*A)),hi=Math.min(1,(-B+root)/(2*A));
    if(hi-lo>1e-13)lines.push({kind:'line',a:a.map((x,k)=>x+lo*v[k]),b:a.map((x,k)=>x+hi*v[k])});
  }
  if(!lines.length){if(area(poly)>1e-14&&polygonRadius(poly)<R-1e-10)throw Error('Unvalidated: unresolved disk boundary');return [];}
  const edges=[];
  for(let i=0;i<lines.length;i++){
    const line=lines[i],next=lines[(i+1)%lines.length];edges.push(line);
    if(distance(line.b,next.a)>1e-10){
      const start=Math.atan2(line.b[1],line.b[0]);
      const sweep=(Math.atan2(next.a[1],next.a[0])-start+TAU)%TAU;
      if(sweep>Math.PI+1e-9)throw Error('Unvalidated: large circular arc');
      edges.push({kind:'circle',a:line.b,b:next.a,start,sweep,R});
    }
  }
  return edges;
}

export class Diagram {
  constructor(certificate){
    this.certificate=certificate;this.p=certificate.parameters;
    this.R=number(this.p.R_over_P);this.W=number(this.p.W_over_P);this.f=number(this.p.f);
    this.alpha=this.p.alpha*Math.PI/180;this.m=this.p.sectors;
    this.parts=new Map(certificate.pieces.map(a=>[id(a.id),a]));
    this.owner=new Map(certificate.components.flatMap((a,i)=>a.pieces.map(p=>[id(p),i])));
    this.order=new Map(certificate.orders.map(a=>[a.pair.map(id).sort().join('|'),id(a.top)]));
    this.center=[1.25,-.75];this.rotation=.4014257279586958;this.pattern=null;
    this.polygons=new Map(certificate.pieces.map(a=>[id(a.id),a.vertices.map(([x,y])=>[number(x)/SQRT3,number(y)])]));
    this.extent=this.p.end_style==='strip'?Math.max(this.R,...[...this.polygons.values()].flat().map(p=>Math.hypot(...p))):this.R;
    this.cells=this.arrangement();
  }
  map(point,j){
    let theta=Math.atan2(point[1],point[0]);
    if(theta<0&&theta>-1e-10)theta=0;
    if(theta<0)theta+=TAU;
    if(Math.abs(theta-this.alpha)<1e-10)theta=this.alpha;
    if(theta>this.alpha+1e-9)throw Error('Unvalidated: angular branch');
    const phi=this.rotation+this.f*(j*this.alpha+theta),r=Math.hypot(...point);
    return [this.center[0]+r*Math.cos(phi),this.center[1]+r*Math.sin(phi)];
  }
  inverse(point){
    const x=point[0]-this.center[0],y=point[1]-this.center[1],r=Math.hypot(x,y);
    if(r===0)return {r,j:0,local:[0,0]};
    let angle=((Math.atan2(y,x)-this.rotation)%TAU+TAU)%TAU;
    const step=TAU/this.m,nearest=Math.round(angle/step);
    // Roundoff-only ownership snap, far below geometry tolerance. Tests approach
    // each ray from +/-1e-8 radians as well as evaluating the exact ray.
    if(Math.abs(angle-nearest*step)<64*Number.EPSILON*TAU)angle=(nearest%this.m)*step;
    const j=Math.min(this.m-1,Math.floor(angle/step)),theta=angle/this.f-j*this.alpha;
    return {r,j,local:[r*Math.cos(theta),r*Math.sin(theta)]};
  }
  ranked(ids){
    return [...ids].sort((a,b)=>{
      if(a===b)return 0;
      const top=this.order.get([a,b].sort().join('|'));
      if(!top)throw Error('Unvalidated: missing local precedence');
      return top===a?-1:1;
    });
  }
  boundary(poly){return boundary(poly,this.p.end_style==='strip'?null:this.R);}
  positions(local,j){
    const r=Math.hypot(...local);
    if(r>this.extent+1e-12||r<(1-this.W)/2-1e-12)return [];
    const ids=[];
    for(const a of this.certificate.pieces){
      if(a.id[0]!==j)continue;
      if(Math.abs(dot(normals[a.id[1]],local)-(a.id[2]-2.5))>this.W/2+1e-12)continue;
      const poly=this.polygons.get(id(a.id));
      if(this.p.end_style==='strip'&&!poly.every((p,i)=>{const q=poly[(i+1)%poly.length];return (q[0]-p[0])*(local[1]-p[1])-(q[1]-p[1])*(local[0]-p[0])>=-1e-12;}))continue;
      ids.push(id(a.id));
    }
    return ids;
  }
  pick(point){
    const {j,local}=this.inverse(point),ids=this.positions(local,j);
    return this.ranked(ids).map(position=>({position,strip:this.owner.get(position)}));
  }
  color(position,pattern=this.pattern){
    if(pattern===null)return 0;
    let [j,d,s]=this.parts.get(position).id;
    for(let n=0;n<(j*(this.p.alpha/60))%6;n++){d=(d+2)%3;s=5-s;}
    const z=s+this.p.k[d]+this.p.C*(3-d),c=((z%3)+3)%3,n=Math.floor(z/3);
    return (([d,c,d+c,n,c+n][pattern]%3)+3)%3;
  }
  compatibility(pattern){
    for(const e of this.certificate.joins){
      if(this.color(id(e.left),pattern)!==this.color(id(e.right),pattern))return {status:'Invalid',witness:`Color conflict at join ${id(e.left)} ↔ ${id(e.right)}`};
    }
    return {status:'Validated',distinctColors:new Set([...this.parts.keys()].map(a=>this.color(a,pattern))).size};
  }
  arrangement(){
    if(!this.certificate.render_cells)throw Error('Unvalidated: missing exact reference partition');
    const out=[];
    for(const cell of this.certificate.render_cells){
      const poly=cell.vertices.map(([x,y])=>[number(x)/SQRT3,number(y)]),members=cell.members;
      const edges=this.boundary(clean(poly));if(!edges.length)throw Error('Unvalidated: missing populated cell');
      for(let j=0;j<this.m;j++){
        const ids=members.map(a=>id([j,...a])).filter(a=>this.parts.has(a));
        if(ids.length)out.push({poly,edges,j,reference:cell,stack:this.ranked(ids)});
      }
    }
    return out;
  }
  mesh(edges,j,epsilon,maxDepth=24){
    if(!(epsilon>1e-10))throw Error('Unvalidated: numeric tolerance below reserve');
    const points=[],segments=[];
    const line=(a,b,depth)=>{
      const rho=minRadius(a,b),v=b.map((x,i)=>x-a[i]);
      if(rho<1e-10)throw Error('Unvalidated: edge reaches center');
      const cross=a[0]*v[1]-a[1]*v[0];
      const error=Math.abs(1-this.f*this.f)*cross*cross/(8*rho**3);
      if(error+1e-10<=epsilon){points.push(this.map(b,j));segments.push({kind:'line',a,b,bound:error+1e-10});return;}
      if(depth>=maxDepth)throw Error('Unvalidated: subdivision depth exhausted');
      const mid=a.map((x,i)=>(x+b[i])/2);line(a,mid,depth+1);line(mid,b,depth+1);
    };
    if(!edges.length)return {points,segments};
    points.push(this.map(edges[0].a,j));
    for(const edge of edges){
      if(edge.kind==='line')line(edge.a,edge.b,0);
      else{
        const count=Math.max(1,Math.ceil(Math.abs(this.f*edge.sweep)*Math.sqrt(edge.R/(8*(epsilon-1e-10)))));
        if(count>20000)throw Error('Unvalidated: circular subdivision budget');
        for(let i=1;i<=count;i++){
          const t=edge.start+edge.sweep*i/count;
          const b=i===count?edge.b:[edge.R*Math.cos(t),edge.R*Math.sin(t)];
          const a=i===1?edge.a:[edge.R*Math.cos(t-edge.sweep/count),edge.R*Math.sin(t-edge.sweep/count)];
          const bound=edge.R*(this.f*edge.sweep/count)**2/8+1e-10;
          points.push(this.map(b,j));segments.push({kind:'circle',a,b,bound,R:edge.R,sweep:edge.sweep/count});
        }
      }
    }
    return {points,segments};
  }
  pieceMesh(position,epsilon,maxDepth){
    return this.mesh(this.boundary(this.polygons.get(position)),this.parts.get(position).id[0],epsilon,maxDepth);
  }
}
export const pathFor=mesh=>mesh.points.map((p,i)=>`${i?'L':'M'}${p[0].toPrecision(15)},${p[1].toPrecision(15)}`).join(' ')+' Z';
