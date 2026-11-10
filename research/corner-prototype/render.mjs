import {number,id,pathFor,TAU} from './kernel.mjs';
// One bounded renderer shared by the research prototype and integrated editor.
export function createRenderer(svg,colors,inspection,compositing=null){
 const document=svg.ownerDocument,NS=svg.namespaceURI;
 const node=(tag,attrs,parent)=>{const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);parent?.append(e);return e;};
 const openPath=mesh=>pathFor(mesh).replace(/ Z$/,'');
 return function prepare(s,exportSigma=null){
  const {model,entry,selected,view}=s;model.rotation=view.rotation*Math.PI/180;
  const pad=model.extent+.3,viewBox=`${model.center[0]-pad} ${model.center[1]-pad} ${2*pad} ${2*pad}`;
  // Firefox's nested SVG viewport reports identity; its graphics child carries
  // the actual viewport transform. Root prototype/export SVGs use the same path.
  const matrix=(svg.querySelector('.material-cells')||svg).getScreenCTM(),oldWidth=svg.viewBox.baseVal?.width||0;
  const factor=oldWidth>0?oldWidth/(2*pad):null;
  let sigma;
  if(factor!==null){
    const a=matrix.a*factor,b=matrix.b*factor,c=matrix.c*factor,d=matrix.d*factor;
    const tr=a*a+b*b+c*c+d*d,det=a*d-b*c;
    sigma=Math.sqrt((tr+Math.sqrt(Math.max(0,tr*tr-4*det*det)))/2);
  }else{const box=svg.getBoundingClientRect();sigma=Math.min(box.width,box.height)/(2*pad);}
  if(exportSigma!==null)sigma=exportSigma;
  const epsilon=Math.min(model.W/1000,.25/sigma)/8;
  const meshes=new Map([...model.parts.keys()].map(position=>[position,model.pieceMesh(position,epsilon)]));
  const cellMeshes=model.cells.map(cell=>model.mesh(cell.edges,cell.j,epsilon));
  const root=node('svg',{viewBox}),defs=node('defs',{},root),paint=node('g',{class:'material-cells'},root);
  model.meshAudit=[];model.epsilon=epsilon;model.sigma=sigma;
  for(const [position,part]of model.parts){
    const mesh=meshes.get(position);
    const pieceId=`piece-${position.replaceAll(':','_')}`,slot=model.color(position);
    const container=compositing?node('g',{id:pieceId,opacity:compositing.opacity[slot],'data-palette-slot':slot},defs):defs;
    const paintPiece=compositing?node('g',{id:'paint-'+pieceId,opacity:compositing.opacity[slot]},defs):null;
    // Membership is constant over a certified cell. Paint full rectangles in
    // its ordered stack, then clip once. Using already-antialiased band edges
    // here would multiply coverage twice at the same region boundary.
    if(compositing)node('rect',{x:model.center[0]-2*model.R,y:model.center[1]-2*model.R,width:4*model.R,height:4*model.R,fill:colors[slot]},paintPiece);
    node('path',{...(compositing?{}:{id:pieceId}),d:pathFor(mesh),'data-occurrence':position,
      fill:colors[model.color(position)],'data-strip':model.owner.get(position),'data-vertices':JSON.stringify(part.vertices)},defs);
    if(compositing){container.append(defs.lastChild);if(view.edges){
      for(const edge of model.boundary(model.polygons.get(position))){
        if(edge.kind==='line'&&[0,model.alpha].some(t=>[edge.a,edge.b].every(p=>Math.abs(p[0]*Math.sin(t)-p[1]*Math.cos(t))<1e-10)))continue;
        const line=model.mesh([edge],part.id[0],epsilon);node('path',{d:openPath(line),fill:'none',stroke:'#182d2c','stroke-width':1.8/sigma,'data-material-edge':position},paintPiece);
        model.meshAudit.push({kind:'material-edge',position,j:part.id[0],...line});
      }
    }}
    model.meshAudit.push({kind:'band',position,j:part.id[0],...mesh});
  }
  const opaqueFaces=colors.map(()=>[]),visibleParts=new Map(),assemblies=new Map();
  model.cells.forEach((cell,index)=>{
    const mesh=cellMeshes[index],path=pathFor(mesh);
    const clip=node('clipPath',{id:`cell-${index}`,clipPathUnits:'userSpaceOnUse','data-sector':cell.j,'data-reference-cell':JSON.stringify(cell.reference)},defs);node('path',{d:path},clip);
    const group=node('g',{class:'cell','data-region':`cell-${index}`,'data-stack':JSON.stringify(cell.stack),'data-sector':cell.j},defs);
    node('path',{d:path,fill:colors[model.color(cell.stack[0])],'data-position':cell.stack[0],class:'face'},group);
    opaqueFaces[model.color(cell.stack[0])].push(path);
    if(compositing){
      const rgba=position=>{const slot=model.color(position),alpha=Math.round(compositing.opacity[slot]*1e12)/1e12;return alpha===0?'transparent':colors[slot]+'/'+alpha;};
      // Equal complete color stacks can share a compound clip. Cell identities
      // and local precedence remain in their own definitions above. This avoids
      // separately rasterizing two equivalent stacks at a conceptual seam.
      // With material-edge strokes enabled, keep their position-specific paint.
      const key=view.edges?'cell-'+index:JSON.stringify(cell.stack.map(rgba));
      if(!assemblies.has(key))assemblies.set(key,{stack:cell.stack,paths:[],cells:[]});
      const assembly=assemblies.get(key);assembly.paths.push(path);assembly.cells.push(index);
    }
    const top=cell.stack[0];if(!visibleParts.has(top))visibleParts.set(top,[]);visibleParts.get(top).push(path);
    model.meshAudit.push({kind:'cell',index,j:cell.j,...mesh});
  });
  if(compositing){
    paint.setAttribute('style','isolation:isolate');
    for(const assembly of assemblies.values()){
      const index=assembly.cells[0],clip=node('clipPath',{id:'assembly-'+index,clipPathUnits:'userSpaceOnUse'},defs);node('path',{d:assembly.paths.join(' ')},clip);
      const clipped=node('g',{'clip-path':`url(#assembly-${index})`,style:'mix-blend-mode:plus-lighter;filter:opacity(1)','data-painted-cell':index,'data-painted-cells':JSON.stringify(assembly.cells)},paint);
      const stack=node('g',{style:'isolation:isolate'},clipped);
      for(const position of assembly.stack.slice().reverse())node('use',{href:`#paint-piece-${position.replaceAll(':','_')}`,'data-painted-position':position},stack);
    }
  }
  else opaqueFaces.forEach((paths,color)=>{if(paths.length)node('path',{d:paths.join(' '),fill:colors[color],'data-material-color':color},paint);});
  if(view.edges&&!compositing){
    const visible=node('g',{'data-layer':'visible-boundaries','aria-label':'Visible material boundaries'},root);
    for(const [position,paths]of visibleParts){
      const maskId=`visible-${position.replaceAll(':','_')}`,clip=node('clipPath',{id:maskId,clipPathUnits:'userSpaceOnUse'},defs);
      node('path',{d:paths.join(' ')},clip);
      const part=model.parts.get(position),j=part.id[0];
      for(const edge of model.boundary(model.polygons.get(position))){
        // Conceptual sector cuts are not visible material edges.
        if(edge.kind==='line'&&[0,model.alpha].some(t=>[edge.a,edge.b].every(p=>Math.abs(p[0]*Math.sin(t)-p[1]*Math.cos(t))<1e-10)))continue;
        const mesh=model.mesh([edge],j,epsilon);
        node('path',{d:openPath(mesh),class:'visible-boundary','stroke-width':1.8/sigma,
          'clip-path':`url(#${maskId})`,'data-visible-position':position},visible);
        model.meshAudit.push({kind:'visible-boundary',position,j,...mesh});
      }
    }
  }
  const outline=node('g',{'data-layer':'hidden-inspection'},root);
  if(view.outlines)for(const [position,mesh]of meshes)node('path',{d:pathFor(mesh),class:'outline','data-inspection-position':position},outline);
  if(view.seams)for(let j=0;j<model.m;j++){
    const angle=model.rotation+j*TAU/model.m;
    node('line',{x1:model.center[0],y1:model.center[1],x2:model.center[0]+model.R*Math.cos(angle),y2:model.center[1]+model.R*Math.sin(angle),class:'seam'},root);
  }
  const selection=node('g',{'data-layer':'selection'},root);
  if(selected!==null){
    for(const a of model.certificate.components[selected].pieces)node('path',{d:pathFor(meshes.get(id(a))),class:'selection','data-selected-position':id(a)},selection);
    if(view.seams)for(const e of model.certificate.joins){
      if(model.owner.get(id(e.left))!==selected)continue;
      const j=e.right[0],angle=model.rotation+j*TAU/model.m;
      const lo=number(e.interval[0])/Math.sqrt(3),hi=Array.isArray(e.interval[1])?model.R:number(e.interval[1])/Math.sqrt(3);
      node('line',{x1:model.center[0]+lo*Math.cos(angle),y1:model.center[1]+lo*Math.sin(angle),x2:model.center[0]+hi*Math.cos(angle),y2:model.center[1]+hi*Math.sin(angle),class:'partner','data-left':id(e.left),'data-right':id(e.right)},root);
    }
  }
  let maxBound=0;for(const mesh of model.meshAudit)for(const segment of mesh.segments)maxBound=Math.max(maxBound,segment.bound);
  return {root,viewBox,inspection:inspection(s),
    summary:`ACTIVE: ${entry.label}. Reference ${model.p.beta}° · signed deficit ${360-model.p.beta}° · ${model.p.beta<360?'deficit':model.p.beta>360?'excess':'planar'} ${Math.abs(360-model.p.beta)}° · multiplier ${model.p.f} · R/P ${model.p.R_over_P} · ${entry.counts.open_strips} open strips. Open-strips-only: Validated.`,
    certificate:JSON.stringify({certificate:entry.id,counts:entry.counts,worldTolerance:epsilon,maxBound,pixelBound:maxBound*sigma,analyticDisk:model.p.end_style!=='strip',referenceCenter:[-(2*model.p.k[1]+model.p.k[0])/Math.sqrt(3),model.p.k[0]],displayCenter:model.center,displayRotation:model.rotation},null,2)};
};
}
