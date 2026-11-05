import {Diagram,number,id,boundary,pathFor,TAU} from './kernel.mjs';
const $=s=>document.querySelector(s),svg=$('#diagram'),NS=svg.namespaceURI;
const colors=['#477f79','#bd713d','#8b6da5'];
let registry=[],state=null,revision=0,pending=false;
const defaults={rotation:23,outlines:false,seams:true,edges:false};
const node=(tag,attrs,parent)=>{const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);parent?.append(e);return e;};
const openPath=mesh=>pathFor(mesh).replace(/ Z$/,'');
function report(status,message){
  $('#status').dataset.status=status;$('#status').dataset.activeExample=state?.entry.id||'';
  $('#status').dataset.activeStatus=state?'Validated':'Unvalidated';
  $('#status').textContent=`${status}: ${message}`;
}
function fail(operation,error){
  syncControls();
  report(error.status||'Unvalidated',`${operation} failed: ${error.message}. ${state?`Previous model, drawing and selection retained; active example ${state.entry.label} remains Validated.`:'No diagram committed.'} Physical constructibility unverified.`);
}
function validMessage(){
  return `${state.model.compatibility(state.model.pattern).distinctColors} distinct material color(s); active example ${state.entry.label}. Physical constructibility unverified.`;
}
function cloneState(){
  if(!state)throw Error('No committed diagram');
  return {...state,view:{...state.view},hits:[...state.hits],
    model:Object.assign(Object.create(Object.getPrototypeOf(state.model)),state.model)};
}
function syncControls(){
  const view=state?.view||defaults;
  $('#example').disabled=registry.length===0;
  for(const control of document.querySelectorAll('.controls select,.controls input,.controls button'))if(control.id!=='example')control.disabled=!state;
  $('#example').value=state?.entry.id||'';$('#rotation').value=String(view.rotation);
  for(const [name,key]of [['outlines','outlines'],['seams','seams'],['visible-edges','edges']])$('#'+name).checked=view[key];
  if(!state){$('#color').value='mono';$('#strip').value='';$('#crossing').value='';return;}
  const {model,entry,selected,crossing}=state;
  for(const option of $('#color').options){
    if(option.value==='mono')continue;
    const row=entry.patterns[Number(option.value)];
    option.textContent=option.textContent.split(' — ')[0]+(row.valid?` — ${row.distinct_colors} colors`:' — conflict');
    option.title=row.witness||'Verified constant on every joined strip';
  }
  $('#color').value=model.pattern===null?'mono':String(model.pattern);
  if($('#strip').dataset.example!==entry.id){
    $('#strip').replaceChildren(new Option('Click a strip or choose here',''));
    model.certificate.components.forEach((c,i)=>$('#strip').append(new Option(`Strip ${i} · ${c.pieces.length} local pieces`,String(i))));
    $('#strip').dataset.example=entry.id;
    $('#crossing').replaceChildren(new Option('Choose an interior crossing',''));
    for(const {index,event}of state.crossings){
      const owners=event.pair.map(a=>model.owner.get(id(a))),self=owners[0]===owners[1]?' · self-crossing':'';
      $('#crossing').append(new Option(`Crossing ${index} · strips ${owners.join(' / ')}${self}`,String(index)));
    }
  }
  $('#strip').value=selected===null?'':String(selected);$('#crossing').value=crossing===null?'':String(crossing);
}
function inspection(s){
  const {model,selected,hits,hitIndex}=s;
  if(selected===null)return 'No strip selected. Center holes and gaps contain no material.';
  const group=model.certificate.components[selected];
  const partners=model.certificate.joins.filter(e=>model.owner.get(id(e.left))===selected).map(e=>`${id(e.left)} ↔ ${id(e.right)}`);
  const positions=hits.map((a,i)=>`${i===hitIndex?'→':' '} ${a.position} · strip ${a.strip} · ${i===0?'OVER (top visible position)':'UNDER position '+i}`).join('\n');
  return `Joined strip ${selected}\nOuter ends: ${group.outer_ends}\n\nPositions at crossing/click (top first):\n${positions||'(chosen from strip list)'}\n\nAll local pieces (including hidden):\n${group.pieces.map(id).join('\n')}\n\nSeam partners:\n${partners.join('\n')||'(no seam crossings)'}`;
}
// This routine touches only a candidate model and a detached SVG. It does not
// change active controls, active geometry, selection or the committed model.
function prepare(s){
  const {model,entry,selected,view}=s;model.rotation=view.rotation*Math.PI/180;
  const pad=model.R+.3,viewBox=`${model.center[0]-pad} ${model.center[1]-pad} ${2*pad} ${2*pad}`;
  const matrix=svg.getScreenCTM(),oldWidth=svg.viewBox.baseVal.width;
  const factor=oldWidth>0?oldWidth/(2*pad):null;
  let sigma;
  if(factor!==null){
    const a=matrix.a*factor,b=matrix.b*factor,c=matrix.c*factor,d=matrix.d*factor;
    const tr=a*a+b*b+c*c+d*d,det=a*d-b*c;
    sigma=Math.sqrt((tr+Math.sqrt(Math.max(0,tr*tr-4*det*det)))/2);
  }else{const box=svg.getBoundingClientRect();sigma=Math.min(box.width,box.height)/(2*pad);}
  const epsilon=Math.min(model.W/1000,.25/sigma)/8;
  const meshes=new Map([...model.parts.keys()].map(position=>[position,model.pieceMesh(position,epsilon)]));
  const cellMeshes=model.cells.map(cell=>model.mesh(cell.edges,cell.j,epsilon));
  const root=node('svg',{viewBox}),defs=node('defs',{},root),paint=node('g',{class:'material-cells'},root);
  model.meshAudit=[];model.epsilon=epsilon;model.sigma=sigma;
  for(const [position,part]of model.parts){
    const mesh=meshes.get(position);
    node('path',{id:`piece-${position.replaceAll(':','_')}`,d:pathFor(mesh),'data-occurrence':position,
      fill:colors[model.color(position)],'data-strip':model.owner.get(position),'data-vertices':JSON.stringify(part.vertices)},defs);
    model.meshAudit.push({kind:'band',position,j:part.id[0],...mesh});
  }
  const opaqueFaces=[[],[],[]],visibleParts=new Map();
  model.cells.forEach((cell,index)=>{
    const mesh=cellMeshes[index],path=pathFor(mesh);
    const clip=node('clipPath',{id:`cell-${index}`,clipPathUnits:'userSpaceOnUse','data-sector':cell.j,'data-reference-cell':JSON.stringify(cell.reference)},defs);node('path',{d:path},clip);
    const group=node('g',{class:'cell','data-region':`cell-${index}`,'data-stack':JSON.stringify(cell.stack),'data-sector':cell.j},defs);
    node('path',{d:path,fill:colors[model.color(cell.stack[0])],'data-position':cell.stack[0],class:'face'},group);
    opaqueFaces[model.color(cell.stack[0])].push(path);
    const top=cell.stack[0];if(!visibleParts.has(top))visibleParts.set(top,[]);visibleParts.get(top).push(path);
    model.meshAudit.push({kind:'cell',index,j:cell.j,...mesh});
  });
  opaqueFaces.forEach((paths,color)=>{if(paths.length)node('path',{d:paths.join(' '),fill:colors[color],'data-material-color':color},paint);});
  if(view.edges){
    const visible=node('g',{'data-layer':'visible-boundaries','aria-label':'Visible material boundaries'},root);
    for(const [position,paths]of visibleParts){
      const maskId=`visible-${position.replaceAll(':','_')}`,clip=node('clipPath',{id:maskId,clipPathUnits:'userSpaceOnUse'},defs);
      node('path',{d:paths.join(' ')},clip);
      const part=model.parts.get(position),j=part.id[0];
      for(const edge of boundary(model.polygons.get(position),model.R)){
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
  const maxBound=Math.max(...model.meshAudit.flatMap(a=>a.segments.map(s=>s.bound)));
  return {root,viewBox,inspection:inspection(s),
    summary:`Reference ${model.p.beta}° · ${model.p.beta<360?'deficit':model.p.beta>360?'excess':'planar'} ${Math.abs(360-model.p.beta)}° · multiplier ${model.p.f} · R/P ${model.p.R_over_P} · ${entry.counts.open_strips} open strips. Open-strips-only: Validated.`,
    certificate:JSON.stringify({certificate:entry.id,counts:entry.counts,worldTolerance:epsilon,maxBound,pixelBound:maxBound*sigma,analyticDisk:true,referenceCenter:[-(2*model.p.k[1]+model.p.k[0])/Math.sqrt(3),model.p.k[0]],displayCenter:model.center,displayRotation:model.rotation},null,2)};
}
function commit(candidate,drawing,{quiet=false}={}){
  // Preparation, including inspector text and all bounded paths, is complete.
  // This synchronous commit has no network or other user-code await points.
  state=candidate;svg.setAttribute('viewBox',drawing.viewBox);svg.replaceChildren(...drawing.root.childNodes);
  syncControls();$('#summary').textContent=drawing.summary;$('#inspection').textContent=drawing.inspection;
  $('#certificate').textContent=drawing.certificate;$('#certificate-link').href=state.entry.url;
  if(!quiet)report('Validated',validMessage());
}
function begin(){revision++;pending=false;syncControls();return revision;}
function transition(operation,update){
  const ticket=begin();
  try{const next=cloneState();update(next);const drawing=prepare(next);commit(next,drawing);return true;}
  catch(error){if(ticket===revision)fail(operation,error);return false;}
}
export async function load(key){
  const ticket=begin(),candidate=registry.find(a=>a.id===key);
  if(!candidate){fail('Example change',Error('No supplied certificate for this example or radius'));return false;}
  pending=true;report('Loading',`Requested ${candidate.label}; ${state?'active controls still describe the previous committed diagram':'preparing first diagram'}.`);
  try{
    const response=await fetch(candidate.url);
    if(ticket!==revision)return false;
    if(!response.ok)throw Error('certificate unavailable');
    const certificate=await response.json();if(ticket!==revision)return false;
    const model=new Diagram(certificate);model.pattern=candidate.default_pattern;
    if(model.compatibility(model.pattern).status!=='Validated')throw Error('default coloring is not compatible');
    const crossings=certificate.crossings.map((event,index)=>({event,index})).filter(({event})=>{
      const [X,Y]=event.XY.map(number);return Y>1e-10&&X+(model.p.alpha===120?Y:-Y)>1e-10;
    });
    const next={model,entry:candidate,view:{...(state?.view||defaults)},selected:null,hits:[],hitIndex:0,crossing:null,crossings};
    const drawing=prepare(next);if(ticket!==revision)return false;
    commit(next,drawing);return true;
  }catch(error){if(ticket===revision)fail('Example change',error);return false;}
  finally{if(ticket===revision)pending=false;}
}
function choosePoint(s,point,crossing=null){s.hits=s.model.pick(point);s.hitIndex=0;s.selected=s.hits[0]?.strip??null;s.crossing=crossing;}
function selectPoint(point){const ok=transition('Position inspection',s=>choosePoint(s,point));return ok?state.hits:[];}
svg.addEventListener('pointerdown',event=>transition('Position inspection',s=>{
  const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());choosePoint(s,[p.x,p.y]);
}));
$('#example').onchange=()=>load($('#example').value);
$('#color').onchange=()=>{
  const value=$('#color').value;
  return transition('Color change',s=>{
    const pattern=value==='mono'?null:Number(value),result=s.model.compatibility(pattern);
    if(result.status!=='Validated')throw Object.assign(Error(result.witness),{status:'Invalid'});
    s.model.pattern=pattern;
  });
};
$('#rotation').onchange=()=>{const value=Number($('#rotation').value);return transition('View change',s=>{s.view.rotation=value;});};
for(const [control,key]of [['outlines','outlines'],['seams','seams'],['visible-edges','edges']])$('#'+control).onchange=()=>{
  const value=$('#'+control).checked;return transition('View change',s=>{s.view[key]=value;});
};
$('#strip').onchange=()=>{const value=$('#strip').value;return transition('Strip inspection',s=>{s.selected=value===''?null:Number(value);s.hits=[];s.hitIndex=0;s.crossing=null;});};
$('#crossing').onchange=()=>{
  const value=$('#crossing').value;
  return transition('Crossing inspection',s=>{
    if(value===''){s.crossing=null;return;}
    const index=Number(value),event=s.model.certificate.crossings[index],[X,Y]=event.XY.map(number);
    choosePoint(s,s.model.map([X/Math.sqrt(3),Y],event.pair[0][0]),index);
  });
};
$('#next').onclick=()=>transition('Local-position inspection',s=>{if(s.hits.length){s.hitIndex=(s.hitIndex+1)%s.hits.length;s.selected=s.hits[s.hitIndex].strip;}});
$('#clear').onclick=()=>transition('Clear selection',s=>{s.selected=null;s.hits=[];s.hitIndex=0;s.crossing=null;});
function refresh(){
  if(!state)return false;
  const ticket=revision;
  try{const next=cloneState();commit(next,prepare(next),{quiet:true});return true;}
  catch(error){if(ticket===revision)fail('View refresh',error);return false;}
}
let resizeTimer;new ResizeObserver(()=>{
  clearTimeout(resizeTimer);const ticket=revision;
  resizeTimer=setTimeout(()=>{if(ticket===revision)refresh();},150);
}).observe(svg);
window.corner={get model(){return state?.model;},get ready(){return Boolean(state);},get pending(){return pending;},
  get entry(){return state?.entry;},load,selectPoint,draw:refresh,
  setPattern(pattern){$('#color').value=pattern===null?'mono':String(pattern);return $('#color').onchange();},
  get selection(){return {selected:state?.selected??null,hits:state?.hits||[],hitIndex:state?.hitIndex||0};}};
syncControls();
try{
  registry=await(await fetch('examples.json')).json();
  for(const row of registry)$('#example').append(new Option(row.label,row.id));
  for(const text of ['Other radii — Unvalidated','Circle-through-vertex / cap-end cases — Unvalidated']){const option=new Option(text,'unsupported');option.disabled=true;$('#example').append(option);}
  await load('excess');
}catch(error){fail('Catalogue load',error);}
