import {Diagram,number,id,boundary,pathFor,TAU} from './kernel.mjs';
import {Project} from './project.mjs';
import {makePackage} from './offline.mjs';
import {BUNDLE} from './bundle.mjs';
const $=s=>document.querySelector(s),svg=$('#diagram'),NS=svg.namespaceURI;
const colors=['#477f79','#bd713d','#8b6da5'];
let registry=[],state=null,draft=null,revision=0,pending=false,initialized=false;
const defaults=Project.defaults,standalone=Boolean(document.getElementById('corner-assets')),Package=makePackage(BUNDLE);
const node=(tag,attrs,parent)=>{const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);parent?.append(e);return e;};
const openPath=mesh=>pathFor(mesh).replace(/ Z$/,'');
const family=BUNDLE.catalogue.matrix;
function proposed(s){return {...s.entry.config,pattern:s.model.pattern};}
function candidateResult(value){
  const row=family.rows.find(a=>['weave','phase','crop','beta'].every(k=>a[k]===value[k]));
  if(!row)return {status:'Unvalidated',witness:'Selected weave and hole phase do not match the bounded family'};
  if(row.status!=='Validated')return {...row,row};
  return {...row.patterns.find(a=>a.pattern===value.pattern),row};
}
function syncDraft(){
  if(!draft)return;
  for(const key of ['weave','phase','crop','beta','pattern'])$('#candidate-'+key).value=key==='pattern'&&draft[key]===null?'mono':String(draft[key]);
  const result=candidateResult(draft),row=result.row,phase=family.domain.phases.find(a=>a.id===draft.phase),crop=family.domain.crops.find(a=>a.id===draft.crop),beta=draft.beta;
  const gcd=(a,b)=>b?gcd(b,a%b):a,g=gcd(beta,360),q=`${beta/g}/${360/g}`,f=`${360/g}/${beta/g}`;
  const center=phase?`center/P = (${-(2*phase.k[1]+phase.k[0])}/√3, ${phase.k[0]}); k=(${phase.k}); C/hand/X=${phase.C}/${phase.hand}/${phase.X}; membership ${phase.member===null?'all':phase.member}`:'';
  $('#candidate-summary').dataset.status=result.status;
  $('#candidate-summary').textContent=`PROPOSED: ${draft.weave}, ${phase?.label||draft.phase}, β=${beta}°, q=${q}, f=${f}, signed deficit ${360-beta}°. Crop ${crop?.label||draft.crop}, W/P=3/4. ${center}. Geometry/order: ${row?.status||'Unvalidated'}. Coloring: ${row?.status==='Validated'?result.status:'not certified for this geometry'}. ${result.status==='Validated'?`${result.distinct_colors} actually used color(s). Open-strips-only: Validated. Ready to apply together.`:result.witness}`;
  for(const option of $('#candidate-pattern').options){
    const pattern=option.value==='mono'?null:Number(option.value),entry=row?.patterns.find(a=>a.pattern===pattern);
    option.title=entry?.witness||'No implicit phase/color substitution';
    option.textContent=option.textContent.split(' — ')[0]+(entry?.status==='Validated'?` — ${entry.distinct_colors} color(s)`:` — ${entry?.status||'Unvalidated'}`);
  }
}
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
  for(const control of document.querySelectorAll('.controls select,.controls input,.controls button'))if(control.id!=='example')control.disabled=['open-project','open-file'].includes(control.id)?registry.length===0:!state;
  $('#example').value=state?.entry.id||'';$('#rotation').value=String(view.rotation);
  for(const [name,key]of [['outlines','outlines'],['seams','seams'],['visible-edges','edges'],['export-annotations','annotations']])$('#'+name).checked=view[key];
  syncDraft();
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
function prepare(s,exportSigma=null){
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
  if(exportSigma!==null)sigma=exportSigma;
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
  let maxBound=0;for(const mesh of model.meshAudit)for(const segment of mesh.segments)maxBound=Math.max(maxBound,segment.bound);
  return {root,viewBox,inspection:inspection(s),
    summary:`ACTIVE: ${entry.label}. Reference ${model.p.beta}° · signed deficit ${360-model.p.beta}° · ${model.p.beta<360?'deficit':model.p.beta>360?'excess':'planar'} ${Math.abs(360-model.p.beta)}° · multiplier ${model.p.f} · R/P ${model.p.R_over_P} · ${entry.counts.open_strips} open strips. Open-strips-only: Validated.`,
    certificate:JSON.stringify({certificate:entry.id,counts:entry.counts,worldTolerance:epsilon,maxBound,pixelBound:maxBound*sigma,analyticDisk:true,referenceCenter:[-(2*model.p.k[1]+model.p.k[0])/Math.sqrt(3),model.p.k[0]],displayCenter:model.center,displayRotation:model.rotation},null,2)};
}
function commit(candidate,drawing,{quiet=false,resetDraft=false}={}){
  // Preparation, including inspector text and all bounded paths, is complete.
  // This synchronous commit has no network or other user-code await points.
  state=candidate;if(!draft||resetDraft)draft=proposed(state);
  svg.setAttribute('viewBox',drawing.viewBox);svg.replaceChildren(...drawing.root.childNodes);
  syncControls();$('#summary').textContent=drawing.summary;$('#inspection').textContent=drawing.inspection;
  $('#certificate').textContent=drawing.certificate;
  $('#certificate-link').href=standalone?'data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(state.model.certificate)):state.entry.url;
  if(standalone){
    $('#certificate-link').download=`corner-${state.entry.id}.certificate.json`;
    $('#certificate-link').textContent='Save supplied reference certificate';
  }
  if(!quiet)report('Validated',validMessage());
}
function begin(){revision++;pending=false;syncControls();return revision;}
function transition(operation,update){
  const ticket=begin();
  try{const next=cloneState();update(next);const drawing=prepare(next);commit(next,drawing);return true;}
  catch(error){if(ticket===revision)fail(operation,error);return false;}
}
export async function load(key,{pattern,grouped=false}={}){
  const ticket=begin(),candidate=registry.find(a=>a.id===key);
  if(!candidate){fail('Example change',Error('No supplied certificate for this example or radius'));return false;}
  pending=true;report('Loading',`Requested ${candidate.label}; ${state?'active controls still describe the previous committed diagram':'preparing first diagram'}.`);
  try{
    let certificate;
    if(standalone)certificate=BUNDLE.catalogue.certificates[candidate.id];
    else{
      const response=await fetch(candidate.url);if(ticket!==revision)return false;
      if(!response.ok)throw Error('certificate unavailable');
      certificate=await response.json();if(ticket!==revision)return false;
      if(!Project.same(certificate,BUNDLE.catalogue.certificates[candidate.id]))throw Error('certificate differs from trusted catalogue');
    }
    const model=new Diagram(certificate);model.pattern=pattern===undefined?candidate.default_pattern:pattern;
    if(model.compatibility(model.pattern).status!=='Validated')throw Error('default coloring is not compatible');
    const crossings=Project.crossings(model);
    const changed=state&&state.entry.id!==candidate.id;
    const next=grouped&&!changed?{...cloneState(),model,entry:candidate,crossings}:{model,entry:candidate,view:{...(state?.view||defaults)},selected:null,hits:[],hitIndex:0,crossing:null,crossings,anchor:null};
    const drawing=prepare(next);if(ticket!==revision)return false;
    commit(next,drawing,{resetDraft:true});
    if(changed)report('Validated',validMessage()+' Construction changed; selection cleared because no material correspondence is assumed.');
    return true;
  }catch(error){if(ticket===revision)fail(grouped?'Grouped construction change':'Example change',error);return false;}
  finally{if(ticket===revision)pending=false;}
}
function choosePoint(s,point,crossing=null){
  s.hits=s.model.pick(point);s.hitIndex=0;s.selected=s.hits[0]?.strip??null;s.crossing=crossing;
  const inverse=s.model.inverse(point);s.anchor=s.hits.length?{sector:inverse.j,point:inverse.local}:null;
}
function selectPoint(point){const ok=transition('Position inspection',s=>choosePoint(s,point));return ok?state.hits:[];}
svg.addEventListener('pointerdown',event=>transition('Position inspection',s=>{
  const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());choosePoint(s,[p.x,p.y]);
}));
$('#example').onchange=()=>load($('#example').value);
for(const key of ['weave','phase','crop','beta','pattern'])$('#candidate-'+key).onchange=()=>{
  let value=$('#candidate-'+key).value;if(key==='beta')value=Number(value);if(key==='pattern')value=value==='mono'?null:Number(value);
  const wasPending=pending;begin();draft={...draft,[key]:value};syncDraft();
  if(wasPending)report('Validated',validMessage()+' Older pending operation superseded by the proposal.');
};
$('#reset-candidate').onclick=()=>{begin();draft=proposed(state);syncDraft();report('Validated',validMessage());};
$('#apply-candidate').onclick=()=>{
  const value={...draft},result=candidateResult(value);
  if(result.status!=='Validated'){begin();fail('Grouped construction change',Object.assign(Error(result.witness),{status:result.status}));return Promise.resolve(false);}
  return load(result.row.id,{pattern:value.pattern,grouped:true});
};
$('#color').onchange=()=>{
  const value=$('#color').value;
  return transition('Color change',s=>{
    const pattern=value==='mono'?null:Number(value),result=s.model.compatibility(pattern);
    if(result.status!=='Validated')throw Object.assign(Error(result.witness),{status:'Invalid'});
    s.model.pattern=pattern;
  });
};
$('#rotation').onchange=()=>{const value=Number($('#rotation').value);return transition('View change',s=>{s.view.rotation=value;});};
for(const [control,key]of [['outlines','outlines'],['seams','seams'],['visible-edges','edges'],['export-annotations','annotations']])$('#'+control).onchange=()=>{
  const value=$('#'+control).checked;return transition('View change',s=>{s.view[key]=value;});
};
$('#strip').onchange=()=>{const value=$('#strip').value;return transition('Strip inspection',s=>{s.selected=value===''?null:Number(value);s.hits=[];s.hitIndex=0;s.crossing=null;s.anchor=null;});};
$('#crossing').onchange=()=>{
  const value=$('#crossing').value;
  return transition('Crossing inspection',s=>{
    if(value===''){s.crossing=null;return;}
    const index=Number(value),event=s.model.certificate.crossings[index],[X,Y]=event.XY.map(number);
    choosePoint(s,s.model.map([X/Math.sqrt(3),Y],event.pair[0][0]),index);
  });
};
$('#next').onclick=()=>transition('Local-position inspection',s=>{if(s.hits.length){s.hitIndex=(s.hitIndex+1)%s.hits.length;s.selected=s.hits[s.hitIndex].strip;}});
$('#clear').onclick=()=>transition('Clear selection',s=>{s.selected=null;s.hits=[];s.hitIndex=0;s.crossing=null;s.anchor=null;});
async function openFile(file){
  const ticket=begin();pending=true;report('Loading',`Reading editable project ${file.name}; active design retained.`);
  try{
    const text=await file.text();if(ticket!==revision)return false;
    const next=Project.restore(Project.parse(text),BUNDLE.catalogue),drawing=prepare(next);
    if(ticket!==revision)return false;commit(next,drawing,{resetDraft:true});return true;
  }catch(error){if(ticket===revision)fail('Open project',error);return false;}
  finally{if(ticket===revision)pending=false;}
}
function download(text,type,filename){
  const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');
  a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function saveProject(){
  const ticket=begin();
  try{
    const project=Project.capture(state,BUNDLE.catalogue);Project.restore(project,BUNDLE.catalogue);
    const html=Package.html(project);download(html,'text/html;charset=utf-8',`corner-${state.entry.id}.corner.html`);
    report('Validated','Self-contained editable project prepared. Physical constructibility unverified.');return true;
  }catch(error){if(ticket===revision)fail('Save project',error);return false;}
}
function exportArtwork(){
  const ticket=begin();
  try{
    const next=cloneState(),include=next.view.annotations;
    if(!include){next.view={...next.view,edges:false,seams:false,outlines:false};next.selected=null;}
    const width=1024,span=2*(next.model.R+.3),drawing=prepare(next,width/span),root=drawing.root;
    const minX=next.model.center[0]-span/2,minY=next.model.center[1]-span/2;
    root.setAttribute('viewBox',`${minX} ${minY} ${span} ${span*1.075}`);
    root.setAttribute('width',width);root.setAttribute('height',Math.ceil(width*1.075));
    const title=node('title',{},root);title.textContent='Angular diagram artwork — physical constructibility unverified';
    const desc=node('desc',{},root);desc.textContent=`Not an editable project or fabrication template. Inspection annotations ${include?'included':'excluded'}.`;
    const style=node('style',{},root);style.textContent=(BUNDLE.css.match(/\.(?:selection|outline|seam|partner|visible-boundary)\{[^}]*\}/g)||[]).join('\n');
    const background=node('rect',{x:minX,y:minY,width:span,height:span*1.075,fill:'white','data-background':'true'},null);root.prepend(background);
    const info=node('metadata',{id:'corner-artwork-info'},root);info.textContent=JSON.stringify({format:'madweave-corner-artwork',version:1,
      parameters:next.model.p,pattern:next.model.pattern,rotation:next.view.rotation,center:next.model.center,inspectionAnnotations:include,
      components:next.model.certificate.components,joins:next.model.certificate.joins,crossings:next.model.certificate.crossings,
      approximation:JSON.parse(drawing.certificate)});
    for(const [i,text]of ['Angular diagram artwork — physical constructibility unverified.',`Not an editable project or fabrication template. Inspection annotations: ${include?'included':'excluded'}.`].entries()){
      const label=node('text',{x:minX+span*.02,y:minY+span*(1.026+i*.025),'font-size':span/66,fill:'#203c3b','font-family':'sans-serif'},root);label.textContent=text;
    }
    download('<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(root),'image/svg+xml',`corner-${state.entry.id}.${include?'inspection':'diagram'}.svg`);
    report('Validated',`Static SVG artwork prepared; inspection annotations ${include?'included':'excluded'}. This is not an editable project or fabrication template.`);return true;
  }catch(error){if(ticket===revision)fail('SVG export',error);return false;}
}
$('#save-project').onclick=saveProject;$('#export-svg').onclick=exportArtwork;
$('#open-project').onclick=()=>$('#open-file').click();
$('#open-file').onchange=()=>{const file=$('#open-file').files[0];$('#open-file').value='';if(file)return openFile(file);};
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
window.corner={get model(){return state?.model;},get ready(){return Boolean(state);},get initialized(){return initialized;},get pending(){return pending;},
  get entry(){return state?.entry;},load,selectPoint,draw:refresh,
  get proposal(){return {...draft};},
  setPattern(pattern){$('#color').value=pattern===null?'mono':String(pattern);return $('#color').onchange();},
  captureProject(){return Project.capture(state,BUNDLE.catalogue);},
  get selection(){return {selected:state?.selected??null,hits:state?.hits||[],hitIndex:state?.hitIndex||0};}};
syncControls();
try{
  registry=BUNDLE.catalogue.examples;
  for(const phase of family.domain.phases)$('#candidate-phase').append(new Option(`${phase.weave} · ${phase.label}`,phase.id));
  for(const beta of family.domain.angles)$('#candidate-beta').append(new Option(`${beta}°`,String(beta)));
  for(const crop of family.domain.crops)$('#candidate-crop').append(new Option(crop.label,crop.id));
  for(const row of registry)$('#example').append(new Option(row.label,row.id));
  for(const text of ['Other radii — Unvalidated','Circle-through-vertex / cap-end cases — Unvalidated']){const option=new Option(text,'unsupported');option.disabled=true;$('#example').append(option);}
  await load('excess');
  const embedded=document.getElementById('corner-project');
  if(embedded){const restored=Project.restore(Project.parse(embedded.textContent),BUNDLE.catalogue);commit(restored,prepare(restored),{resetDraft:true});}
}catch(error){fail('Initial project load',error);}finally{initialized=true;}
