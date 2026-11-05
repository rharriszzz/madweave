/* Shared editor workspace: retained per-mode frames, one palette/file workflow. */
(function(){
 'use strict';
 const project=window.MadWeaveProject,core=window.MadWeaveCornerCore,$=s=>document.querySelector(s);
 let planar=$('#weave'),cornerFrame=null,corner=null,mode='planar',revision=0,assetsPromise,draft=null;
 const status=$('#export-status');
 const compact=new URLSearchParams(location.search).get('view')==='svg'||document.body.dataset.view==='svg';
 if(compact){
  document.body.dataset.view='svg';
  $('#close-settings').hidden=false;
  $('#construction-controls').append($('.editor-toolbar'),status);
 }
 function openControls(angle){
  $('#construction-controls').dataset.open='true';
  if(angle)$('#corner-beta').focus();
  else if(!compact)$('#construction-controls').scrollIntoView({block:'start',behavior:'instant'});
 }
 $('#close-settings').onclick=()=>{delete $('#construction-controls').dataset.open;};
 function message(text){status.textContent=text;}
 function activeFrame(){return mode==='corner'?cornerFrame:planar;}
 function ready(){try{return mode==='corner'?Boolean(corner):Boolean(planar.contentDocument?.getElementById('strips'));}catch(_){return false;}}
 function buttons(){$('#save-project').disabled=$('#export').disabled=!ready();$('#open-project').disabled=false;$('#design-mode').value=mode;$('#corner-apply').disabled=mode!=='corner';
  if(mode==='planar'){$('#corner-beta').value='360';planar.contentWindow?.buildViewButtons?.(planar.contentDocument,'planar');}
 }
 function begin(){revision++;buttons();return revision;}
 function failure(operation,error,ticket=revision){if(ticket===revision){buttons();message(`${operation}: ${error.message}. Active and inactive designs retained.`);}}
 function download(text,type,name){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 async function assets(){
  if(!assetsPromise)assetsPromise=(async()=>{
   const embedded=$('#madweave-assets');if(embedded){const b=JSON.parse(embedded.textContent);if(b.cornerRuntime)return b;}
   async function get(name){const r=await fetch(name);if(!r.ok)throw Error('Could not load editor asset '+name);return r;}
   const [engine,stateScript,editorScript,css,cornerRuntime,cornerEditor,images]=await Promise.all([
    get('madweave.js').then(r=>r.text()),get('project.js').then(r=>r.text()),get('editor.js').then(r=>r.text()),get('site.css').then(r=>r.text()),get('corner-runtime.js').then(r=>r.text()),get('corner-editor.js').then(r=>r.text()),
    Promise.all([1,2,3,4,5].map(async i=>{const blob=await(await get('cp'+i+'.png')).blob();return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}))]);
   return {engine,stateScript,editorScript,css,cornerRuntime,cornerEditor,images};
  })().catch(e=>{assetsPromise=null;throw e;});return assetsPromise;
 }
 async function makeFrame(bundle,state){
  const f=document.createElement('iframe');f.title='MadWeaver interactive weaving editor';f.style.cssText=`position:absolute;visibility:hidden;width:${$('.canvas').clientWidth||900}px;height:750px`;f.id='preparing-weave';
  const loaded=new Promise((resolve,reject)=>f.addEventListener('load',()=>{try{
   const d=f.contentDocument,root=d.createElementNS('http://www.w3.org/2000/svg','svg');root.id='svg';root.style.cssText='display:block;width:100%;height:100vh';root.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');d.body.append(root);
   const script=d.createElement('script');script.textContent=bundle.engine.replace(/\bcp([1-5])\.png\b/g,(_,i)=>bundle.images[+i-1]).replace("if (-1 < label.indexOf('.'))","if (label.startsWith('data:image/') || -1 < label.indexOf('.'))");d.body.append(script);
   if(state)project.apply(f.contentWindow,state);else f.contentWindow.setContent(root,2);resolve(f);
  }catch(e){reject(e);}}, {once:true}));
  f.srcdoc='<!doctype html><html><head><meta charset="utf-8"><title>MadWeaver</title></head><body style="margin:0;background:white"></body></html>';$('.canvas').append(f);
  try{return await loaded;}catch(e){f.remove();throw e;}
 }
 function selectedPlanar(frame){const w=frame.contentWindow;const i=Number(w.selectedMouseIndex)>=0?Number(w.selectedMouseIndex):Number(w.mouseStripIndex);return Number.isInteger(i)&&i>=0&&i<9*w.baseSize?i:null;}
 function capture(){if(!ready())throw Error('No active design');return {format:'madweave-editor',version:1,active:mode,design:mode==='corner'?corner.capture():project.capture(planar.contentWindow),selection:mode==='planar'?selectedPlanar(planar):null};}
 function validate(input){
  if(input?.format==='madweave-editor'){
   if(input.version!==1||Object.keys(input).sort().join('|')!==['format','version','active','design','selection'].sort().join('|'))throw Error('Unsupported editor project envelope');
   if(!['planar','corner'].includes(input.active))throw Error('Unsupported editor mode');
   if(input.active==='planar'){const state=project.validate(input.design);if(input.selection!==null&&(!Number.isInteger(input.selection)||input.selection<0||input.selection>=state.baseSize*9))throw Error('Invalid planar selection');return {...input,design:state};}
   if(input.selection!==null)throw Error('Corner selection belongs to its model');const s=core.CornerProject.restore(input.design,core.catalogue);return {...input,design:core.CornerProject.capture(s,core.catalogue)};
  }
  if(input?.format==='madweave-corner-project'){const s=core.CornerProject.restore(input,core.catalogue);return {format:'madweave-editor',version:1,active:'corner',design:core.CornerProject.capture(s,core.catalogue),selection:null};}
  return {format:'madweave-editor',version:1,active:'planar',design:project.validate(input),selection:null};
 }
 function parse(text){
  if(typeof text!=='string')throw Error('Project text required');
  const size=new TextEncoder().encode(text).byteLength;if(size>10*1024*1024)throw Error('Project exceeds the 10 MiB corner file limit');
  let env;
  if(text.trimStart().startsWith('{'))env=validate(JSON.parse(text));
  else{
   const scripts=[...text.matchAll(/<script\b([^>]*\sid\s*=\s*["'](?:madweave-project|corner-project)["'][^>]*)>([\s\S]*?)<\/script\s*>/gi)];
   if(scripts.length){if(scripts.length!==1||! /\stype\s*=\s*["']application\/json["']/i.test(scripts[0][1]))throw Error('Missing/duplicate project data');env=validate(JSON.parse(scripts[0][2]));}
   else env=validate(project.parse(text));
  }
  if(env.active==='planar'&&size>5*1024*1024)throw Error('Project exceeds the 5 MiB planar file limit');return env;
 }

 function callbacks(){return {intent:begin,error:(op,e)=>{if(mode==='corner'){syncCorner();failure(op,e);}},change:adapter=>{if(adapter===corner&&mode==='corner')syncCorner();},formula, weave(member){const phase=core.catalogue.matrix.domain.phases.find(p=>p.weave==='hexweave'&&p.member===member);draft={...draft,phase:phase.id,weave:'hexweave'};begin();syncProposal();}};}
 function activate(next){
  mode=next;const active=activeFrame();for(const f of [planar,cornerFrame])if(f){f.hidden=f!==active;f.id=f===active?'weave':f===planar?'weave-planar':'weave-corner';}
  active.style.visibility='';active.style.position='';active.style.width='';if(next==='planar')active.style.height='';$('#main').dataset.mode=mode;$('#corner-settings').hidden=mode!=='corner';buttons();
  if(mode==='corner'){corner.layout();if(!draft)draft={...corner.state.entry.config,pattern:corner.state.value.material.pattern};syncCorner();message('Corner mode. Planar work retained; this supported setup is not a conversion. Physical constructibility unverified.');}
  else message('Planar design restored, including unsaved colors and selection.');
 }
 async function changeMode(next){const ticket=begin();try{if(next==='corner'&&!corner){const bundle=await assets();if(ticket!==revision)return;const f=await makeFrame(bundle);if(ticket!==revision){f.remove();return;}let adapter;try{const value=core.CornerProject.initial(core.catalogue),flat=project.capture(planar.contentWindow);
   value.palette=flat.palette;value.opacity=flat.opacity;value.recent=flat.recentColors;value.recentOpacity=flat.recentOpacity;value.selectedColor=flat.selectedColor;
   adapter=new window.MadWeaveCornerEditor(f,core,value,callbacks());}catch(e){f.remove();throw e;}cornerFrame=f;corner=adapter;}
  if(next==='planar'&&!planar.contentDocument?.getElementById('strips')){const b=await assets();const f=await makeFrame(b);if(ticket!==revision){f.remove();return;}planar.remove();planar=f;observePlanar(f);}
  if(ticket===revision)activate(next);
 }catch(e){failure('Mode was not changed',e,ticket);} }
 async function loadEnvelope(input,ticket){
  const env=validate(input),bundle=await assets();if(ticket!==revision)return false;
  const f=await makeFrame(bundle,env.active==='planar'?env.design:null);if(ticket!==revision){f.remove();return false;}
  try{if(env.active==='corner'){
   const adapter=new window.MadWeaveCornerEditor(f,core,env.design,callbacks());if(ticket!==revision){adapter.observer.disconnect();f.remove();return false;}
   corner?.observer.disconnect();cornerFrame?.remove();cornerFrame=f;corner=adapter;draft=null;
  }else{
   if(env.selection!==null){const w=f.contentWindow;w.selectedMouseIndex=env.selection;w.mouseStripIndex=-1;w.showMouseStrip(f.contentDocument.getElementById('svg'),env.selection);}
   planar.remove();planar=f;observePlanar(f);
  }
  activate(env.active);return true;
  }catch(e){f.remove();throw e;}
 }
 function projectHtml(state,bundle){
  const html=document.documentElement.cloneNode(true);html.querySelectorAll('script,style,link[rel="stylesheet"],.canvas iframe,.canvas object').forEach(n=>n.remove());
  const frame=document.createElement('iframe');frame.id='weave';frame.title='MadWeaver interactive weaving editor';html.querySelector('.canvas').append(frame);
  const css=document.createElement('style');css.textContent=bundle.css;html.querySelector('head').append(css);html.querySelector('title').textContent='MadWeave — Saved editable project';
  html.querySelectorAll('a[href]').forEach(a=>{const h=a.getAttribute('href');if(h&&!h.startsWith('#')&&!/^[a-z]+:/i.test(h))a.href=new URL(h,'https://rharriszzz.github.io/madweave/').href;});
  for(const [id,data]of [['madweave-project',state],['madweave-assets',bundle]]){const e=document.createElement('script');e.id=id;e.type='application/json';e.textContent=JSON.stringify(data).replace(/</g,'\\u003c');html.querySelector('body').append(e);}
  const bootstrap=document.createElement('script');bootstrap.textContent='('+function(){const b=JSON.parse(document.getElementById('madweave-assets').textContent);for(const text of [b.stateScript,b.cornerRuntime,b.cornerEditor,b.editorScript]){const e=document.createElement('script');e.textContent=text;document.body.append(e);}}.toString()+')();';html.querySelector('body').append(bootstrap);
  const result='<!doctype html>\n'+html.outerHTML;if(new TextEncoder().encode(result).byteLength>(state.active==='corner'?10:5)*1024*1024)throw Error('Generated project exceeds its mode import limit');return result;
 }
 function syncProposal(){
  if(!draft||!corner)return;for(const k of ['phase','beta','crop'])$('#corner-'+k).value=String(draft[k]);
  const row=core.catalogue.matrix.rows.find(r=>r.phase===draft.phase&&r.beta===draft.beta&&r.crop===draft.crop),phase=core.catalogue.matrix.domain.phases.find(p=>p.id===draft.phase);
  draft.weave=phase.weave;
  const loss=Object.keys(corner.state.value.material.overrides).length&&row?.id!==corner.state.entry.id?' Applying replaces custom colors; no strip correspondence is assumed.':'';
  let colors='';if(row?.status==='Validated'){const v=core.CornerProject.initial(core.catalogue,row.id);v.palette=[...corner.state.value.palette];v.opacity=[...corner.state.value.opacity];v.material.pattern=draft.pattern;const s=core.CornerProject.restore(v,core.catalogue);colors=s.conflicts.length?`${s.conflicts.length} seam color changes will show warnings.`:`${s.distinctColors} material color(s); continuity checked.`;}
  const formulaName=draft.pattern===null?'Monochrome':['Direction','Class','Direction + class','Group','Class + group'][draft.pattern];
  $('#corner-proposal').dataset.status=row?.status||'Unvalidated';$('#corner-proposal').textContent=`Proposed ${phase.label}, ${draft.beta}° (${draft.beta>360?'excess':draft.beta<360?'deficit':'planar'} ${Math.abs(360-draft.beta)}°), R/P=${draft.crop.slice(1)}. Replacement coloring: ${formulaName}. ${row?.status||'Unvalidated'}: ${row?.witness||colors}${loss} CP previews / CC1 stage replacement coloring when construction settings are pending.`;
 }
 function syncCorner(){
  const s=corner.state,keys=s.keys;$('#corner-warning').textContent=s.conflicts.length?`⚠ ${s.conflicts.length} seam color changes. Vivid pink markers identify them; hover or focus for strip details. Coloring continuity is not Validated. Material geometry remains certified.`:'';
  $('#corner-strip').replaceChildren(new Option('Choose a joined strip',''));keys.forEach((k,i)=>$('#corner-strip').append(new Option(`Strip ${i}` ,k)));$('#corner-strip').value=s.selected===null?'':keys[s.selected];
  $('#corner-crossing').replaceChildren(new Option('Choose an interior crossing',''));s.crossings.forEach(({index,event})=>{const a=event.pair.map(p=>s.model.owner.get(p.join(':')));$('#corner-crossing').append(new Option(`Crossing ${index}${a[0]===a[1]?' · self-crossing':''}`,String(index)));});$('#corner-crossing').value=s.crossing===null?'':String(s.crossing);
  $('#corner-rotation').value=String(s.view.rotation);for(const [id,key]of [['seams','seams'],['hidden','outlines'],['annotations','annotations']])$('#corner-'+id).checked=s.view[key];
  const partners=s.selected===null?[]:s.model.certificate.joins.filter(e=>s.model.owner.get(e.left.join(':'))===s.selected);
  $('#corner-inspection').textContent=`${Object.keys(s.value.material.overrides).length?'Custom coloring (base formula plus whole-strip overrides)':'Formula coloring'}; ${s.distinctColors} distinct RGBA color(s). Open-strips-only: Validated.\n${s.selected===null?'No strip selected':`Joined strip ${keys[s.selected]}\n`+s.model.certificate.components[s.selected].pieces.map(p=>p.join(':')).join(', ')}\n${s.hits.map((p,i)=>`${i===s.hitIndex?'→ ':''}${i===0?'OVER':'UNDER'} ${p.position} · strip ${p.strip}`).join('\n')}\nSeam partners:\n${partners.map(e=>e.left.join(':')+' ↔ '+e.right.join(':')).join('\n')}\n${s.conflicts.map(e=>'Color seam: '+e.left.join(':')+' ↔ '+e.right.join(':')).join('\n')}\nReference parameters: ${JSON.stringify(s.model.p)}`;
  syncProposal();message(`${s.conflicts.length?'Color continuity warning':'Corner design ready'} — physical constructibility unverified. Paint changes the entire joined strip. Save stores this active design only.`);buttons();
 }
 function formula(pattern){
  const config=corner.state.entry.config,pending=['phase','beta','crop'].some(k=>draft[k]!==config[k]);begin();
  if(pending){draft={...draft,pattern,replaceColors:true};syncProposal();return;}
  const applied=corner.edit('Formula coloring',v=>{v.material={pattern,overrides:{}};});
  // Immediate success consumes the intent; failure discards it and proposes
  // the retained active formula. Only a deliberately staged edit stays queued.
  draft={...config,pattern:applied?pattern:corner.state.value.material.pattern};syncProposal();
 }
 for(const p of core.catalogue.matrix.domain.phases)$('#corner-phase').append(new Option(p.label,p.id));
 for(const b of core.catalogue.matrix.domain.angles)$('#corner-beta').append(new Option(b+'° ('+(b/60)+' × 60°)',String(b)));
 for(const c of core.catalogue.matrix.domain.crops)$('#corner-crop').append(new Option(c.label,c.id));
 // Saved HTML may already contain option nodes: reconstruct deterministic lists.
 for(const [id,rows]of [['phase',core.catalogue.matrix.domain.phases.map(p=>[p.label,p.id])],['beta',core.catalogue.matrix.domain.angles.map(b=>[b+'° ('+(b/60)+' × 60°)',String(b)])],['crop',core.catalogue.matrix.domain.crops.map(c=>[c.label,c.id])]])$('#corner-'+id).replaceChildren(...rows.map(([label,value])=>new Option(label,value)));
 for(const key of ['phase','beta','crop'])$('#corner-'+key).onchange=async()=>{const v=$('#corner-'+key).value;if(!corner||mode!=='corner'){await changeMode('corner');if(mode!=='corner')return;}begin();draft={...draft,[key]:key==='beta'?Number(v):v};syncProposal();};
 $('#corner-apply').onclick=()=>{const ticket=begin();try{
  const row=core.catalogue.matrix.rows.find(r=>r.phase===draft.phase&&r.beta===draft.beta&&r.crop===draft.crop);if(row?.status!=='Validated')throw Error(`${row?.status||'Unvalidated'}: ${row?.witness||'Unsupported configuration'}`);
  const old=corner.capture(),changed=row.id!==old.construction.id;
  const v=changed?core.CornerProject.initial(core.catalogue,row.id):old;
  for(const k of ['palette','opacity','recent','recentOpacity','selectedColor','controlsHidden'])v[k]=structuredClone(old[k]);v.view=structuredClone(old.view);v.material={pattern:draft.pattern,overrides:changed||draft.replaceColors?{}:old.material.overrides};
  corner.replace(v);draft={...corner.state.entry.config,pattern:v.material.pattern};syncCorner();if(changed)message('Construction applied. Selection and custom colors replaced as proposed; no strip correspondence assumed. Physical constructibility unverified.');return true;
 }catch(e){failure('Construction was not applied',e,ticket);return false;}};
 $('#corner-strip').onchange=()=>corner.inspectStrip($('#corner-strip').value);$('#corner-crossing').onchange=()=>{if($('#corner-crossing').value!=='')corner.inspectCrossing($('#corner-crossing').value);};$('#corner-next').onclick=()=>corner.next();$('#corner-paint').onclick=()=>corner.paintSelected();
 $('#corner-rotation').onchange=()=>{const v=Number($('#corner-rotation').value);corner.edit('Rotation',s=>{s.view.rotation=v;});};for(const [id,key]of [['seams','seams'],['hidden','outlines'],['annotations','annotations']])$('#corner-'+id).onchange=()=>{const v=$('#corner-'+id).checked;corner.edit('Inspection',s=>{s.view[key]=v;});};
 $('#design-mode').onchange=()=>changeMode($('#design-mode').value);
 $('#save-project').onclick=async()=>{if(!ready())return;const ticket=begin();try{const state=capture(),bundle=await assets();if(ticket!==revision)return;download(projectHtml(state,bundle),'text/html;charset=utf-8','madweave-project.html');message('Editable project saved. Active design and selection included; inactive design is session-only. Reopen offline and save again after edits.');}catch(e){failure('Project was not saved',e,ticket);}finally{buttons();}};
 $('#open-project').onclick=()=>$('#project-file').click();$('#project-file').onchange=async()=>{const file=$('#project-file').files[0];$('#project-file').value='';if(!file)return;const ticket=begin();try{if(file.size>10*1024*1024)throw Error('Project exceeds the 10 MiB corner file limit');const text=await file.text();if(ticket!==revision)return;const env=parse(text);if(await loadEnvelope(env,ticket))message('Opened '+file.name+'. You can edit this design and save it again. Inactive work retained.');}catch(e){failure('Project was not opened',e,ticket);}};
 $('#export').onclick=()=>{const ticket=begin();try{if(mode==='corner'){download(corner.exportSVG(),'image/svg+xml;charset=utf-8','madweave-corner-artwork.svg');message('Corner diagram SVG exported; physical constructibility unverified. Artwork is not an editable project or fabrication template.');return;}
  const source=planar.contentDocument.getElementById('svg'),svg=source.cloneNode(true);svg.querySelectorAll('script,#buttons,#viewButtons,#documentations,#tools,#pattern').forEach(n=>n.remove());for(const e of [svg,...svg.querySelectorAll('*')])for(const a of [...e.attributes])if(/^on/i.test(a.name))e.removeAttribute(a.name);download(new XMLSerializer().serializeToString(svg),'image/svg+xml;charset=utf-8','madweave-artwork.svg');message('Artwork exported as a static SVG image. Use Save Project to keep an editable copy.');
 }catch(e){failure('Artwork was not exported',e,ticket);}};
 function observePlanar(f){const hook=()=>{const d=f.contentDocument;if(!d)return;for(const name of ['mousedown','keydown'])d.addEventListener(name,()=>{if(mode==='planar'&&f===planar)begin();},true);};f.addEventListener('load',hook);hook();}
 observePlanar(planar);planar.addEventListener('load',buttons);buttons();
 window.MadWeaveEditor={get mode(){return mode;},get corner(){return corner;},get planar(){return planar;},capture,parse,validate,changeMode,openControls,get revision(){return revision;}};
 const startView=new URLSearchParams(location.search);
 async function openInitialView(){
  const ticket=begin();
  try{
   const handoff=sessionStorage.getItem('madweave-planar-handoff');
   if(handoff){if(!await loadEnvelope(parse(handoff),ticket))return;sessionStorage.removeItem('madweave-planar-handoff');}
   if(startView.get('mode')==='corner')await changeMode('corner');
   if(startView.get('angle')==='choose'&&mode==='corner')openControls(true);
   else if(startView.get('panel')==='controls')openControls(false);
  }catch(error){failure('View was not opened',error,ticket);}
 }
 const saved=$('#madweave-project');if(saved){const ticket=begin();Promise.resolve().then(()=>loadEnvelope(validate(JSON.parse(saved.textContent)),ticket)).then(ok=>{if(ok)message('Saved project opened. Editing and saving work offline. Only the active saved design was persisted.');}).catch(e=>failure('Could not open this project',e,ticket));}
 else if(startView.get('mode')==='corner'||compact)openInitialView();
})();
