import {Diagram,number,id,boundary,pathFor,TAU} from './kernel.mjs';
const $=s=>document.querySelector(s),svg=$('#diagram'),NS=svg.namespaceURI;
const colors=['#477f79','#bd713d','#8b6da5'];
let registry,entry,model,selected=null,hits=[],hitIndex=0,ready=false;
const node=(tag,attrs,parent)=>{const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);parent?.append(e);return e;};
function report(status,message){$('#status').dataset.status=status;$('#status').textContent=`${status}: ${message}`;}
export async function load(key){
  const candidate=registry.find(a=>a.id===key);
  if(!candidate){report('Unvalidated','No supplied certificate for this example or radius.');return false;}
  const response=await fetch(candidate.url);if(!response.ok)throw Error('Unvalidated: certificate unavailable');
  const next=new Diagram(await response.json());next.rotation=Number($('#rotation').value)*Math.PI/180;
  const defaultPattern=candidate.default_pattern;
  if(next.compatibility(defaultPattern).status!=='Validated')throw Error('Unvalidated: default coloring');
  const prior={model,entry,selected,hits,hitIndex};
  const priorUI={color:$('#color').innerHTML,colorValue:$('#color').value,strip:$('#strip').innerHTML,
    stripValue:$('#strip').value,summary:$('#summary').textContent,href:$('#certificate-link').getAttribute('href')};
  // Commit a complete candidate only after geometry and compatibility succeed.
  model=next;entry=candidate;model.pattern=defaultPattern;selected=null;hits=[];hitIndex=0;
  $('#example').value=key;$('#color').value=defaultPattern===null?'mono':String(defaultPattern);
  for(const option of $('#color').options){
    if(option.value==='mono')continue;
    const row=entry.patterns[Number(option.value)];
    option.textContent=option.textContent.split(' — ')[0]+(row.valid?` — ${row.distinct_colors} colors`:' — conflict');
    option.title=row.witness||'Verified constant on every joined strip';
  }
  $('#strip').replaceChildren(new Option('Click a strip or choose here',''));
  model.certificate.components.forEach((c,i)=>$('#strip').append(new Option(`Strip ${i} · ${c.pieces.length} local pieces`,String(i))));
  $('#summary').textContent=`Reference ${model.p.beta}° · ${model.p.beta<360?'deficit':model.p.beta>360?'excess':'planar'} ${Math.abs(360-model.p.beta)}° · multiplier ${model.p.f} · R/P ${model.p.R_over_P} · ${entry.counts.open_strips} open strips. Open-strips-only: Validated.`;
  $('#certificate-link').href=candidate.url;
  try{draw();}catch(error){
    ({model,entry,selected,hits,hitIndex}=prior);
    $('#example').value=entry?.id||'';$('#color').innerHTML=priorUI.color;$('#color').value=priorUI.colorValue;
    $('#strip').innerHTML=priorUI.strip;$('#strip').value=priorUI.stripValue;$('#summary').textContent=priorUI.summary;
    if(priorUI.href)$('#certificate-link').setAttribute('href',priorUI.href);
    report('Unvalidated',error.message);throw error;
  }
  report('Validated',`${model.compatibility(model.pattern).distinctColors} distinct material color(s); reference geometry and continuation checked. Physical constructibility unverified.`);
  ready=true;return true;
}
function draw(){
  ready=false;const previousViewBox=svg.getAttribute('viewBox');
  const pad=model.R+.3;svg.setAttribute('viewBox',`${model.center[0]-pad} ${model.center[1]-pad} ${2*pad} ${2*pad}`);
  const matrix=svg.getScreenCTM(),a=matrix.a,b=matrix.b,c=matrix.c,d=matrix.d;
  const tr=a*a+b*b+c*c+d*d,det=a*d-b*c;
  const sigma=Math.sqrt((tr+Math.sqrt(Math.max(0,tr*tr-4*det*det)))/2);
  const epsilon=Math.min(model.W/1000,.25/sigma)/8;
  // Prepare every band and region before replacing any displayed geometry.
  // A failed bound never yields a partially painted "valid" diagram.
  let meshes,cellMeshes;
  try{
    meshes=new Map([...model.parts.keys()].map(position=>[position,model.pieceMesh(position,epsilon)]));
    cellMeshes=model.cells.map(cell=>model.mesh(cell.edges,cell.j,epsilon));
  }catch(error){
    if(previousViewBox!==null)svg.setAttribute('viewBox',previousViewBox);
    ready=svg.children.length>0;report('Unvalidated',error.message);throw error;
  }
  svg.replaceChildren();
  const defs=node('defs',{},svg),paint=node('g',{class:'material-cells'},svg),outline=node('g',{'data-layer':'outlines'},svg);
  model.meshAudit=[];model.epsilon=epsilon;model.sigma=sigma;
  for(const [position,part]of model.parts){
    const mesh=meshes.get(position);
    node('path',{id:`piece-${position.replaceAll(':','_')}`,d:pathFor(mesh),'data-occurrence':position,
      fill:colors[model.color(position)],'data-strip':model.owner.get(position),'data-vertices':JSON.stringify(part.vertices)},defs);
    model.meshAudit.push({kind:'band',position,j:part.id[0],...mesh});
    if($('#outlines').checked)node('path',{d:pathFor(mesh),class:'outline'},outline);
  }
  const opaqueFaces=[[],[],[]];
  model.cells.forEach((cell,index)=>{
    const mesh=cellMeshes[index],path=pathFor(mesh);
    const clip=node('clipPath',{id:`cell-${index}`,clipPathUnits:'userSpaceOnUse','data-sector':cell.j,'data-reference-cell':JSON.stringify(cell.reference)},defs);node('path',{d:path},clip);
    const group=node('g',{class:'cell','data-region':`cell-${index}`,'data-stack':JSON.stringify(cell.stack),'data-sector':cell.j},defs);
    // Every band in an exact cell covers that entire cell. For an opaque
    // palette, the checked top face is exactly the completed local stack.
    // Paint it once to avoid multiplying edge coverage through two masks.
    node('path',{d:path,fill:colors[model.color(cell.stack[0])],'data-position':cell.stack[0],class:'face'},group);
    opaqueFaces[model.color(cell.stack[0])].push(path);
    model.meshAudit.push({kind:'cell',index,j:cell.j,...mesh});
  });
  // Each opaque color is filled once as a nonzero-winding compound path.
  // Shared internal cell edges cancel within this fill, avoiding both gaps and
  // additive bright seams. Material/position identities remain in the defs.
  opaqueFaces.forEach((paths,color)=>{if(paths.length)node('path',{d:paths.join(' '),fill:colors[color],'data-material-color':color},paint);});
  if($('#seams').checked){
    for(let j=0;j<model.m;j++){
      const angle=model.rotation+j*TAU/model.m;
      node('line',{x1:model.center[0],y1:model.center[1],x2:model.center[0]+model.R*Math.cos(angle),y2:model.center[1]+model.R*Math.sin(angle),class:'seam'},svg);
    }
  }
  const selectedGroup=node('g',{'data-layer':'selection'},svg);
  if(selected!==null){
    for(const a of model.certificate.components[selected].pieces)node('path',{d:pathFor(meshes.get(id(a))),class:'selection','data-selected-position':id(a)},selectedGroup);
    if($('#seams').checked)for(const e of model.certificate.joins){
      if(model.owner.get(id(e.left))!==selected)continue;
      const j=e.right[0],angle=model.rotation+j*TAU/model.m;
      const lo=number(e.interval[0])/Math.sqrt(3),hi=Array.isArray(e.interval[1])?model.R:number(e.interval[1])/Math.sqrt(3);
      node('line',{x1:model.center[0]+lo*Math.cos(angle),y1:model.center[1]+lo*Math.sin(angle),x2:model.center[0]+hi*Math.cos(angle),y2:model.center[1]+hi*Math.sin(angle),class:'partner','data-left':id(e.left),'data-right':id(e.right)},svg);
    }
  }
  inspect();
  const maxBound=Math.max(...model.meshAudit.flatMap(a=>a.segments.map(s=>s.bound)));
  $('#certificate').textContent=JSON.stringify({certificate:entry.id,counts:entry.counts,worldTolerance:epsilon,maxBound,pixelBound:maxBound*sigma,analyticDisk:true,referenceCenter:[-(2*model.p.k[1]+model.p.k[0])/Math.sqrt(3),model.p.k[0]],displayCenter:model.center,displayRotation:model.rotation},null,2);
  ready=true;
}
function inspect(){
  if(selected===null){$('#inspection').textContent=hits.length?'No selected position.':'No strip selected. Center holes and gaps contain no material.';return;}
  const group=model.certificate.components[selected];
  const partners=model.certificate.joins.filter(e=>model.owner.get(id(e.left))===selected).map(e=>`${id(e.left)} ↔ ${id(e.right)}`);
  $('#inspection').textContent=`Joined strip ${selected}\nOuter ends: ${group.outer_ends}\n\nPositions at click (top first):\n${hits.map((a,i)=>`${i===hitIndex?'→':' '} ${a.position} · strip ${a.strip}`).join('\n')||'(chosen from strip list)'}\n\nAll local pieces:\n${group.pieces.map(id).join('\n')}\n\nSeam partners:\n${partners.join('\n')||'(no seam crossings)'}`;
}
function selectPoint(point){hits=model.pick(point);hitIndex=0;selected=hits[0]?.strip??null;$('#strip').value=selected===null?'':String(selected);draw();return hits;}
svg.addEventListener('pointerdown',e=>{
  const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());selectPoint([p.x,p.y]);
});
$('#next').onclick=()=>{if(hits.length){hitIndex=(hitIndex+1)%hits.length;selected=hits[hitIndex].strip;$('#strip').value=String(selected);draw();}};
$('#clear').onclick=()=>{selected=null;hits=[];$('#strip').value='';draw();};
$('#strip').onchange=()=>{selected=$('#strip').value===''?null:Number($('#strip').value);hits=[];draw();};
$('#example').onchange=()=>load($('#example').value).catch(e=>report('Unvalidated',e.message));
$('#color').onchange=()=>{
  const pattern=$('#color').value==='mono'?null:Number($('#color').value),result=model.compatibility(pattern);
  if(result.status!=='Validated'){$('#color').value=model.pattern===null?'mono':String(model.pattern);report(result.status,result.witness+'; previous diagram retained.');return;}
  model.pattern=pattern;draw();report('Validated',`${result.distinctColors} distinct material color(s). Physical constructibility unverified.`);
};
$('#rotation').onchange=()=>{
  const prior=model.rotation;model.rotation=Number($('#rotation').value)*Math.PI/180;
  try{draw();}catch(error){model.rotation=prior;$('#rotation').value=String(Math.round(prior*180/Math.PI));}
};
for(const name of ['outlines','seams'])$('#'+name).onchange=()=>draw();
let resizeTimer;new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(model)try{draw();}catch(error){report('Unvalidated',error.message);}},150);}).observe(svg);
window.corner={get model(){return model;},get ready(){return ready;},get entry(){return entry;},load,selectPoint,draw,
  setPattern(pattern){$('#color').value=pattern===null?'mono':String(pattern);$('#color').onchange();},
  get selection(){return {selected,hits,hitIndex};}};
try{
  registry=await(await fetch('examples.json')).json();
  for(const row of registry)$('#example').append(new Option(row.label,row.id));
  for(const text of ['Other radii — Unvalidated','Circle-through-vertex / cap-end cases — Unvalidated']){const option=new Option(text,'unsupported');option.disabled=true;$('#example').append(option);}
  await load('excess');
}catch(e){report('Unvalidated',e.message);}
