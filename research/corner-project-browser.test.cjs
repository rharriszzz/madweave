// Stage 3A real file controls, offline round trips and independent SVG documents.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{pathToFileURL}=require('node:url');
const assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const p=require('playwright'),{PNG}=require('pngjs'),{snapshot:stage2Snapshot}=require('./corner-prototype-transactions.test.cjs');
const ROOT=path.resolve(__dirname,'..'),DIR=path.join(__dirname,'corner-prototype'),OUT=path.join(__dirname,'output/corner-project');
fs.mkdirSync(OUT,{recursive:true});
const examples=JSON.parse(fs.readFileSync(path.join(DIR,'examples.json'))),oracles=JSON.parse(fs.readFileSync(path.join(__dirname,'evidence/corner-prototype-oracles.json')));
const palette=['#477f79','#bd713d','#8b6da5'],rgb=[[71,127,121],[189,113,61],[139,109,165]];
const certs=Object.fromEntries(examples.map(e=>[e.id,JSON.parse(fs.readFileSync(path.join(DIR,e.url)))]));
const key=a=>a.join(':'),number=x=>String(x).split('/').map(Number).reduce((a,b)=>a/b);
function reference(entry,pattern){
 const c=structuredClone(certs[entry.id]);c.pattern=pattern;
 for(const a of c.pieces){
  const [j,d,q]=a.id,steps=j*c.parameters.alpha/60,e=(d+(steps%2?(steps+3)/2:steps/2))%3;
  const s=(steps%2?5-q:q)+c.parameters.k[e]+c.parameters.C*(3-e),cl=((s%3)+3)%3,n=Math.floor(s/3);
  a.color=pattern===null?0:(([e,cl,e+cl,n,cl+n][pattern]%3)+3)%3;
 }
 return c;
}
function independent(c,filename){
 fs.writeFileSync(filename,JSON.stringify(c));const run=spawnSync('python3',[path.join(__dirname,'check-corner-certificate.py'),filename],{encoding:'utf8'});
 assert.equal(run.status,0,run.stdout+run.stderr);return JSON.parse(run.stdout).counts;
}
function seamSamples(entry,certificate=certs[entry.id]){
 const c=certificate,p=c.parameters,R=number(p.R_over_P),w=number(p.W_over_P),alpha=p.alpha*Math.PI/180;
 const normals=[[0,1],[-Math.sqrt(3)/2,-.5],[Math.sqrt(3)/2,-.5]],orders=new Map(c.orders.map(a=>[a.pair.map(key).sort().join('|'),key(a.top)])),rows=[];
 for(let sector=0;sector<p.sectors;sector++)for(const delta of [.004,.025])for(const angle of [delta,alpha-delta])for(let r=.35;r<R-.12;r+=.37){
  const x=r*Math.cos(angle),y=r*Math.sin(angle);
  const positions=c.pieces.filter(a=>a.id[0]===sector&&Math.abs(normals[a.id[1]][0]*x+normals[a.id[1]][1]*y-(a.id[2]-2.5))<w/2).map(a=>a.id);
  // Avoid true material boundaries, preserving exact-edge ownership tests in
  // the separate Stage 2 suite. These samples approach both sides of each ray.
  if(c.pieces.filter(a=>a.id[0]===sector).some(a=>Math.abs(Math.abs(normals[a.id[1]][0]*x+normals[a.id[1]][1]*y-(a.id[2]-2.5))-w/2)<.003))continue;
  positions.sort((a,b)=>orders.get([key(a),key(b)].sort().join('|'))===key(a)?-1:1);
  rows.push({XY:[x*Math.sqrt(3),y],sector,positions,seam:true});
 }
 return rows;
}
async function semantic(page){return page.evaluate(()=>{
 const c=window.corner,m=c.model;
 return {project:c.captureProject(),parameters:m.p,components:m.certificate.components,joins:m.certificate.joins,
  crossings:m.certificate.crossings,orders:m.certificate.orders,colors:[...m.parts.keys()].map(id=>[id,m.color(id)])};
 });}
async function snapshot(page){return {...await stage2Snapshot(page),project:await page.evaluate(()=>window.corner.captureProject())};}
async function save(page,file){const event=page.waitForEvent('download');await page.click('#save-project');await(await event).saveAs(file);}
async function artwork(page,file){const event=page.waitForEvent('download');await page.click('#export-svg');await(await event).saveAs(file);}
async function chooseFile(page,payload){
 const chooser=page.waitForEvent('filechooser');await page.click('#open-project');await(await chooser).setFiles(payload);
}
async function watchImports(page){await page.evaluate(()=>{
 window.__imports=[];const input=document.querySelector('#open-file'),handler=input.onchange;
 input.onchange=function(e){const promise=handler.call(this,e);window.__imports.push(Promise.resolve(promise));return promise;};
 });}
async function settled(page,i){await page.evaluate(i=>window.__imports[i],i);}
function payload(name,text){return {name,mimeType:'text/html',buffer:Buffer.from(text)};}
const server=http.createServer((req,res)=>{
 let file=path.resolve(ROOT,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!file.startsWith(ROOT+path.sep))return res.writeHead(403).end();
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':'text/html');res.end(b);});
});
async function inspectSVG(page,entry,expected,annotated,samplesOverride=null){
 const colors=Object.fromEntries(expected.pieces.map(a=>[key(a.id),a.color]));
 return page.evaluate(({samples,colors,expected,annotated,palette})=>{
  const svg=document.documentElement,info=JSON.parse(document.querySelector('#corner-artwork-info').textContent);
  if(info.inspectionAnnotations!==annotated)throw Error('Export annotation policy differs');
  if(document.querySelector('script,image,foreignObject')||[...document.querySelectorAll('[href]')].some(a=>!a.getAttribute('href').startsWith('#')))throw Error('SVG has runtime/external resources');
  if(!annotated&&document.querySelector('.selection,.outline,.seam,.visible-boundary,.partner'))throw Error('Inspection annotation leaked into artwork');
  const ids=[...document.querySelectorAll('[id]')].map(a=>a.id);if(ids.length!==new Set(ids).size)throw Error('Duplicate SVG definitions');
  for(const e of document.querySelectorAll('[clip-path]'))if(!document.getElementById(e.getAttribute('clip-path').slice(5,-1)))throw Error('Missing SVG clip definition');
  const n=x=>String(x).split('/').map(Number).reduce((a,b)=>a/b),p=info.parameters,f=n(p.f),R=n(p.R_over_P);
  const pieces=[...document.querySelectorAll('defs path[data-occurrence]')],paint=[...document.querySelectorAll('[data-material-color]')],pixel=[];
  for(const row of samples){
   const x=row.XY[0]/Math.sqrt(3),y=row.XY[1],r=Math.hypot(x,y),theta=Math.atan2(y,x);
   const a=info.rotation*Math.PI/180+f*(row.sector*p.alpha*Math.PI/180+theta);
   const point=new DOMPoint(info.center[0]+r*Math.cos(a),info.center[1]+r*Math.sin(a));
   const occupied=pieces.filter(a=>a.isPointInFill(point)).map(a=>a.dataset.occurrence).sort();
   if(JSON.stringify(occupied)!==JSON.stringify(row.positions.map(a=>a.join(':')).sort()))throw Error('Exported material geometry differs from independent reference');
   const actual=paint.filter(a=>a.isPointInFill(point)),color=row.positions.length?colors[row.positions[0].join(':')]:null;
   if(actual.length!==(color===null?0:1)||actual.some(a=>a.getAttribute('fill')!==palette[color]))throw Error('Exported visible material/order differs');
   // Flat pixels only where no true material edge or inspection stroke is close.
   let clearance=Math.abs(r-R);const normals=[[0,1],[-Math.sqrt(3)/2,-.5],[Math.sqrt(3)/2,-.5]];
   for(const b of expected.pieces)if(b.id[0]===0){
    const d=normals[b.id[1]][0]*x+normals[b.id[1]][1]*y-(b.id[2]-2.5),w=n(p.W_over_P);
    clearance=Math.min(clearance,Math.abs(d-w/2),Math.abs(d+w/2));
   }
   const matrix=svg.getScreenCTM(),sigma=Math.hypot(matrix.a,matrix.b);
   if(!(annotated&&row.seam)&&clearance*Math.min(1,f)*sigma>3&&pixel.length<120){
    const screen=point.matrixTransform(matrix),overlays=[...document.querySelectorAll('.selection,.outline,.seam,.visible-boundary,.partner')];
    const nearOverlay=annotated&&overlays.some(e=>[-3,-2,-1,0,1,2,3].some(dx=>[-3,-2,-1,0,1,2,3].some(dy=>e.isPointInStroke(new DOMPoint(screen.x+dx,screen.y+dy).matrixTransform(matrix.inverse())))));
    if(!nearOverlay&&screen.x>=1&&screen.y>=1&&screen.x<innerWidth-1&&screen.y<innerHeight-1)pixel.push({x:screen.x+scrollX,y:screen.y+scrollY,color});
   }
  }
  const c=structuredClone(expected);c.parameters=info.parameters;c.components=info.components;c.joins=info.joins;c.crossings=info.crossings;
  c.pieces=pieces.map(a=>({...expected.pieces.find(b=>b.id.join(':')===a.dataset.occurrence),id:a.dataset.occurrence.split(':').map(Number),vertices:JSON.parse(a.dataset.vertices),color:palette.indexOf(a.getAttribute('fill'))}));
  const orders=new Map();
  for(const cell of document.querySelectorAll('.cell')){
   const stack=JSON.parse(cell.dataset.stack);
   for(let i=0;i<stack.length;i++)for(let j=i+1;j<stack.length;j++){
    const pair=[stack[i],stack[j]].sort();orders.set(pair.join('|'),{pair:pair.map(a=>a.split(':').map(Number)),top:stack[i].split(':').map(Number)});
   }
  }
  c.orders=[...orders.values()];c.render_cells=[...document.querySelectorAll('clipPath[data-sector="0"]')].map(a=>JSON.parse(a.dataset.referenceCell));
  return {certificate:c,pixel,probes:samples.length,seamProbes:samples.filter(a=>a.seam).length,gapProbes:samples.filter(a=>!a.positions.length).length,annotations:annotated};
 },{samples:samplesOverride||[...seamSamples(entry),...oracles[entry.id]],colors,expected,annotated,palette});
}
async function pixelAudit(page,audit,detail){
 const image=PNG.sync.read(await page.screenshot());
 for(const probe of audit.pixel){assert(probe.x>=0&&probe.y>=0&&probe.x<image.width&&probe.y<image.height,'Pixel probe outside captured image');const i=(Math.floor(probe.y)*image.width+Math.floor(probe.x))*4,actual=[...image.data.subarray(i,i+3)],want=probe.color===null?[255,255,255]:rgb[probe.color];assert.equal(actual.length,3);assert(Math.max(...actual.map((v,j)=>Math.abs(v-want[j])))<=3,JSON.stringify({detail,probe,actual,want}));}
 assert(audit.pixel.length>0,'No safe material-color pixels tested');
}

if(require.main===module)(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/research/corner-prototype/`,results=[];
 try{for(const name of (process.env.MADWEAVE_STAGE2_BROWSERS||'chromium,firefox,webkit').split(',')){
  const browser=await p[name].launch({headless:true,...(name==='chromium'&&process.env.MADWEAVE_CHROMIUM_EXECUTABLE?{executablePath:process.env.MADWEAVE_CHROMIUM_EXECUTABLE}:{})});
  try{
   const online=await browser.newContext({acceptDownloads:true,viewport:{width:1500,height:1200}}),offline=await browser.newContext({acceptDownloads:true,viewport:{width:1500,height:1200}});
   // WebKit's emulated offline switch also blocks local file navigations. Deny
   // both network protocols there; the other engines additionally use offline
   // emulation. All engines assert that no HTTP(S) request is even attempted.
   await offline.route(/^https?:/,route=>route.abort());
   if(name!=='webkit')await offline.setOffline(true);const requests=[],errors=[];
   offline.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
   const page=await online.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url);await page.waitForFunction(()=>window.corner?.initialized);
   const rows=[];let count=0,worked;
   for(const entry of examples)for(const pattern of [null,...entry.patterns.filter(a=>a.valid).map(a=>a.pattern)]){
    await page.selectOption('#example',entry.id);await page.waitForFunction(id=>window.corner.entry.id===id&&!window.corner.pending,entry.id);
    await page.selectOption('#color',pattern===null?'mono':String(pattern));await page.selectOption('#rotation',String([0,23,90,-137][count%4]));
    await page.locator('#seams').setChecked(count%2===0);await page.locator('#visible-edges').setChecked(count%3===0);
    if(entry.id==='self'||count%3===0){
     const crossing=await page.evaluate(self=>{
      const m=window.corner.model;return [...document.querySelector('#crossing').options].find(o=>o.value!==''&&(!self||m.certificate.crossings[Number(o.value)].pair.every(a=>m.owner.get(a.join(':'))===m.owner.get(m.certificate.crossings[Number(o.value)].pair[0].join(':'))))).value;
     },entry.id==='self');
     await page.selectOption('#crossing',crossing);await page.click('#next');
    }else{
     const strip=await page.evaluate(fringe=>{const m=window.corner.model;return String(fringe?m.owner.get(`0:${m.certificate.fringe_bands[0].join(':')}`):0);},entry.id==='excess');
     await page.selectOption('#strip',strip);
    }
    const before=await semantic(page),prefix=path.join(OUT,`${name}-${entry.id}-${pattern===null?'mono':pattern}`);
    if(entry.id==='self'){
     assert(before.project.selection.local.positions.length>=2);
     assert.notEqual(...before.project.selection.local.positions.slice(0,2));
     assert(await page.evaluate(()=>{const c=window.corner,p=c.captureProject().selection.local.positions;return c.model.owner.get(p[0])===c.model.owner.get(p[1]);}),'Self-crossing fixture must select two positions of the same global strip');
    }
    await save(page,prefix+'.corner.html');const text=fs.readFileSync(prefix+'.corner.html','utf8');
    assert.equal((text.match(/id="corner-project"/g)||[]).length,1);assert(!/<script[^>]+src=|<link[^>]+href=/i.test(text));
    const filePage=await offline.newPage();filePage.on('pageerror',e=>errors.push(e.message));
    await filePage.goto(pathToFileURL(prefix+'.corner.html').href);await filePage.waitForFunction(()=>window.corner?.initialized);
    assert.deepEqual(await semantic(filePage),before,'Offline open changed model/identity/color/view');
    await filePage.selectOption('#rotation',String(before.project.view.rotation===90?23:90));
    const edited=await semantic(filePage);assert.deepEqual(edited.components,before.components);assert.deepEqual(edited.colors,before.colors);
    await save(filePage,prefix+'-resaved.corner.html');
    const reopened=await offline.newPage();reopened.on('pageerror',e=>errors.push(e.message));
    await reopened.goto(pathToFileURL(prefix+'-resaved.corner.html').href);await reopened.waitForFunction(()=>window.corner?.initialized);
    assert.deepEqual(await semantic(reopened),edited,'Offline resave lost semantic state');
    // Prove other catalogue examples are editable offline as well, then import
    // the saved model through the actual file controls to restore the test case.
    await reopened.selectOption('#example',entry.id==='planar'?'deficit':'planar');
    await watchImports(reopened);await chooseFile(reopened,prefix+'-resaved.corner.html');await settled(reopened,0);
    assert.deepEqual(await semantic(reopened),edited);
    await reopened.locator('#export-annotations').uncheck();await artwork(reopened,prefix+'.svg');
    const svgPage=await offline.newPage();svgPage.on('pageerror',e=>errors.push(e.message));
    await svgPage.goto(pathToFileURL(prefix+'.svg').href);
    const expected=reference(entry,pattern),audit=await inspectSVG(svgPage,entry,expected,false);
    const counts=independent(audit.certificate,prefix+'-exported-certificate.json');assert.deepEqual(counts,entry.counts);
    // The fixed-size 1024 × 1101 SVG fits wholly in this viewport. Chromium's
    // full-page resize path hangs on a standalone SVG document; no resize is
    // needed (or appropriate) for these fixed-output-scale pixel probes.
    await pixelAudit(svgPage,audit,{name,id:entry.id,pattern});
    let annotated=false;
    if(pattern===null){
     await reopened.locator('#export-annotations').check();await reopened.locator('#outlines').check();await reopened.locator('#seams').check();await reopened.locator('#visible-edges').check();
     await artwork(reopened,prefix+'-inspection.svg');await svgPage.goto(pathToFileURL(prefix+'-inspection.svg').href);
     const annotatedAudit=await inspectSVG(svgPage,entry,expected,true);independent(annotatedAudit.certificate,prefix+'-annotated-certificate.json');
     await pixelAudit(svgPage,annotatedAudit,{name,id:entry.id,pattern,annotated:true});
     assert(await svgPage.locator('.outline,.selection,.visible-boundary').count()>0);annotated=true;
    }
    if(entry.id==='self'&&pattern===null)worked={saved:prefix+'.corner.html',resaved:prefix+'-resaved.corner.html',artwork:prefix+'.svg',inspection:prefix+'-inspection.svg',before:before.project,after:edited.project};
    rows.push({id:entry.id,pattern,roundTrip:true,offlineEdit:true,offlineResave:true,offlineExport:true,counts,svgProbes:audit.probes,seamProbes:audit.seamProbes,gapProbes:audit.gapProbes,pixels:audit.pixel.length,annotated});
    await svgPage.close();await reopened.close();await filePage.close();count++;
    console.log(name,entry.id,pattern,'round trip and SVG passed');
   }
   // Invalid data and overlapping file operations use real Open controls.
   await page.selectOption('#example','excess');await page.waitForFunction(()=>window.corner.entry.id==='excess'&&!window.corner.pending);
   await page.selectOption('#strip','0');await watchImports(page);const valid=await page.evaluate(()=>window.corner.captureProject()),bad=[];
   const reject=async(name,change)=>{
    const value=structuredClone(valid);const text=typeof change==='string'?change:(change(value),JSON.stringify(value));
    const before=await snapshot(page);const index=await page.evaluate(()=>window.__imports.length);
    await chooseFile(page,payload(name+'.json',text));await settled(page,index);
    assert.deepEqual(await snapshot(page),before,name+' changed active state');assert.match(await page.locator('#status').innerText(),/failed:.*retained/);bad.push(name);
   };
   await reject('version',v=>{v.version=999;});await reject('catalogue',v=>{v.catalogue='unknown';});
   await reject('parameters',v=>{v.construction.parameters.R_over_P='63/10';});await reject('construction',v=>{v.construction.id='new-angle';});
   await reject('identity',v=>{v.selection.strip='99:0:0';});await reject('incompatible-color',v=>{v.material.pattern=0;});
   await reject('view',v=>{v.view.seams='true';});await reject('saved-valid-flag',v=>{v.validated=true;});
   await reject('digest',v=>{v.construction.digest='0'.repeat(64);});
   await reject('invalid-pattern',v=>{v.material.pattern=5;});
   await reject('malformed','{bad');await reject('duplicate-envelope',`<script id="corner-project" type="application/json">${JSON.stringify(valid)}</script><script id="corner-project" type="application/json">${JSON.stringify(valid)}</script>`);
   await reject('artwork',fs.readFileSync(worked.artwork,'utf8'));
   await page.selectOption('#example','self');await page.waitForFunction(()=>window.corner.entry.id==='self'&&!window.corner.pending);
   const index=await page.evaluate(()=>{const m=window.corner.model;return [...document.querySelector('#crossing').options].find(o=>o.value!==''&&m.certificate.crossings[Number(o.value)].pair.every(a=>m.owner.get(a.join(':'))===m.owner.get(m.certificate.crossings[Number(o.value)].pair[0].join(':')))).value;});
   await page.selectOption('#crossing',index);await page.click('#next');
   const self=await page.evaluate(()=>window.corner.captureProject());
   const selfBefore=await snapshot(page),invalid=structuredClone(self);invalid.selection.local.positions[1]=invalid.selection.local.positions[0];
   const start=await page.evaluate(()=>window.__imports.length);await chooseFile(page,payload('collapsed-self.json',JSON.stringify(invalid)));await settled(page,start);assert.deepEqual(await snapshot(page),selfBefore);bad.push('collapsed-self-position');
   for(const [label,change]of [
    ['wrong-local-active',v=>{v.selection.local.active='99:0:0';}],
    ['wrong-local-order',v=>{v.selection.local.positions.reverse();}],
    ['wrong-local-point',v=>{v.selection.local.point=[0,0];}],
    ['wrong-crossing',v=>{v.selection.local.crossing.XY=['0','0'];}],
   ]){
    const value=structuredClone(self);change(value);const before=await snapshot(page),i=await page.evaluate(()=>window.__imports.length);
    await chooseFile(page,payload(label+'.json',JSON.stringify(value)));await settled(page,i);assert.deepEqual(await snapshot(page),before);assert.match(await page.locator('#status').innerText(),/failed:.*retained/);bad.push(label);
   }
   // The other local position at this same global-strip crossing also survives
   // file controls. Restoring it must not collapse the two occurrence identities.
   await page.click('#next');const top=await semantic(page),topFile=path.join(OUT,name+'-self-other-position.corner.html');
   await save(page,topFile);await page.click('#clear');let imported=await page.evaluate(()=>window.__imports.length);
   await chooseFile(page,topFile);await settled(page,imported);assert.deepEqual(await semantic(page),top);
   const topIds=top.project.selection.local.positions;assert.equal(new Set(topIds).size,topIds.length);
   // Opening HTML extracts inert model JSON only; foreign runtime, SVG and a
   // bogus status outside that data cannot become authority in the active app.
   imported=await page.evaluate(()=>window.__imports.length);
   await chooseFile(page,payload('foreign-runtime.html',`<script>window.importExecuted=true;throw Error('foreign runtime')</script><svg><path d="M0 0"/></svg><p>Validated</p><script id="corner-project" type="application/json">${JSON.stringify(self)}</script>`));
   await settled(page,imported);assert.equal(await page.evaluate(()=>window.importExecuted),undefined);
   assert.deepEqual((await semantic(page)).project,self);
   // A valid model whose rendering fails is also an atomic rejected import.
   for(const failure of ['read','render']){
    const before=await snapshot(page),model=await page.evaluateHandle(()=>window.corner.model);
    await page.evaluate(async failure=>{
     if(failure==='read'){window.__originalText=File.prototype.text;File.prototype.text=()=>Promise.reject(Error('injected current read failure'));}
     else{const {Diagram}=await import('./kernel.mjs');window.__originalMesh=Diagram.prototype.mesh;Diagram.prototype.mesh=()=>{throw Error('injected import render failure');};}
    },failure);
    const i=await page.evaluate(()=>window.__imports.length);await chooseFile(page,payload(failure+'.json',JSON.stringify(valid)));await settled(page,i);
    await page.evaluate(async failure=>{if(failure==='read')File.prototype.text=window.__originalText;else{const {Diagram}=await import('./kernel.mjs');Diagram.prototype.mesh=window.__originalMesh;}},failure);
    assert.deepEqual(await snapshot(page),before);assert(await page.evaluate(m=>m===window.corner.model,model));await model.dispose();
    assert.match(await page.locator('#status').innerText(),/failed:.*injected.*retained/);bad.push('failed-'+failure);
   }
   const races=[];
   for(const lateError of [false,true]){
    await page.evaluate(()=>{window.__readers={};window.__fileText=File.prototype.text;File.prototype.text=function(){if(this.name==='old.json')return new Promise((resolve,reject)=>window.__readers.old={resolve,reject});return window.__fileText.call(this);};});
    const n=await page.evaluate(()=>window.__imports.length);await chooseFile(page,payload('old.json',JSON.stringify(valid)));
    await chooseFile(page,payload('new.json',JSON.stringify(self)));await settled(page,n+1);
    const before=await snapshot(page),status=await page.locator('#status').innerText();
    await page.evaluate(({text,error})=>{if(error)window.__readers.old.reject(Error('late file read failure'));else window.__readers.old.resolve(text);File.prototype.text=window.__fileText;}, {text:JSON.stringify(valid),error:lateError});
    await settled(page,n);assert.deepEqual(await snapshot(page),before);assert.equal(await page.locator('#status').innerText(),status);races.push(lateError?'late-file-error':'late-file-success');
   }
   for(const action of ['view','color','inspection','save','export','rejected-import']){
    await page.evaluate(()=>{window.__fileText=File.prototype.text;File.prototype.text=function(){return this.name==='old.json'?new Promise(resolve=>window.__oldResolve=resolve):window.__fileText.call(this);};});
    const i=await page.evaluate(()=>window.__imports.length);await chooseFile(page,payload('old.json',JSON.stringify(valid)));
    if(action==='view')await page.selectOption('#rotation','-137');
    if(action==='color')await page.selectOption('#color','mono');
    if(action==='inspection')await page.selectOption('#strip','1');
    if(action==='save')await save(page,path.join(OUT,name+'-during-import.corner.html'));
    if(action==='export')await artwork(page,path.join(OUT,name+'-during-import.svg'));
    if(action==='rejected-import'){await chooseFile(page,payload('bad.json','{bad'));await settled(page,i+1);}
    const before=await snapshot(page),status=await page.locator('#status').innerText();
    await page.evaluate(text=>{window.__oldResolve(text);File.prototype.text=window.__fileText;},JSON.stringify(valid));await settled(page,i);
    assert.deepEqual(await snapshot(page),before);assert.equal(await page.locator('#status').innerText(),status);races.push(action+'-supersedes-file');
   }
   // Certificate fetches and file reads share the same revision authority.
   for(const fileLast of [false,true]){
    let route;await page.route('**/certificates/planar.json',r=>{route=r;});
    await page.evaluate(()=>{const input=document.querySelector('#example'),handler=input.onchange;window.__exampleDone=null;input.onchange=function(e){return window.__exampleDone=handler.call(this,e);};});
    const i=await page.evaluate(()=>window.__imports.length);
    if(fileLast){
     await page.evaluate(()=>{window.__fileText=File.prototype.text;File.prototype.text=function(){return new Promise(resolve=>window.__oldResolve=resolve);};});
     await chooseFile(page,payload('old.json',JSON.stringify(valid)));
    }
    await page.selectOption('#example','planar');while(!route)await page.waitForTimeout(10);
    if(!fileLast){await chooseFile(page,payload('new.json',JSON.stringify(self)));await settled(page,i);}
    const importedState=!fileLast?await snapshot(page):null,importedStatus=!fileLast?await page.locator('#status').innerText():null;
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(certs.planar)});await page.evaluate(()=>window.__exampleDone);await page.unroute('**/certificates/planar.json');
    const before=await snapshot(page),status=await page.locator('#status').innerText();
    if(!fileLast){assert.deepEqual(before,importedState);assert.equal(status,importedStatus);}
    if(fileLast){await page.evaluate(text=>{window.__oldResolve(text);File.prototype.text=window.__fileText;},JSON.stringify(valid));await settled(page,i);}
    assert.deepEqual(await snapshot(page),before);assert.equal(await page.locator('#status').innerText(),status);races.push(fileLast?'example-supersedes-file':'file-supersedes-example');
   }
   assert.deepEqual(requests,[],'Offline runtime attempted network access');assert.deepEqual(errors,[]);
   results.push({browser:name,version:browser.version(),rows,invalidImports:bad,races,offlineNetworkRequests:requests,workedRoundTrip:worked,errors});
   await online.close();await offline.close();
  }finally{await browser.close();}
 }}finally{server.close();}
 fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify(results,null,2)+'\n');
 console.log('Stage 3A browser checks passed');
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
module.exports={inspectSVG,pixelAudit,independent,semantic,save,artwork,chooseFile,watchImports,settled,seamSamples};
