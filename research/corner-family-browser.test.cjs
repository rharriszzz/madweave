// Representative real-control browser coverage; exhaustive reference/schema
// coverage lives in build-corner-family.py and corner-family.test.mjs.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const p=require('playwright'),{PNG}=require('pngjs'),{snapshot}=require('./corner-prototype-transactions.test.cjs');
const {auditReference,checkCertificate}=require('./corner-prototype-browser.test.cjs');
const {inspectSVG,pixelAudit,independent,semantic,save,artwork,chooseFile,watchImports,settled,seamSamples}=require('./corner-project-browser.test.cjs');
const ROOT=path.resolve(__dirname,'..'),DIR=path.join(__dirname,'corner-prototype'),OUT=path.join(__dirname,'output/corner-family');fs.mkdirSync(OUT,{recursive:true});
const entries=JSON.parse(fs.readFileSync(path.join(DIR,'family.json'))),oracles=JSON.parse(fs.readFileSync(path.join(__dirname,'evidence/corner-family-oracles.json')));
const certs=Object.fromEntries(entries.map(e=>[e.id,JSON.parse(fs.readFileSync(path.join(DIR,e.url)))]));
const palette=[[71,127,121],[189,113,61],[139,109,165]],n=x=>String(x).split('/').map(Number).reduce((a,b)=>a/b);
function colored(entry,pattern){
 const c=structuredClone(certs[entry.id]);c.pattern=pattern;
 for(const a of c.pieces){const [j,d,s]=a.id,steps=j*c.parameters.alpha/60,e=(d+(steps%2?(steps+3)/2:steps/2))%3,t=(steps%2?5-s:s)+c.parameters.k[e]+c.parameters.C*(3-e),cl=((t%3)+3)%3,g=Math.floor(t/3);a.color=pattern===null?0:(([e,cl,e+cl,g,cl+g][pattern]%3)+3)%3;}
 return c;
}
function samples(entry){
 const c=certs[entry.id],owner=Object.fromEntries(c.components.flatMap((g,i)=>g.pieces.map(a=>[a.join(':'),i])));
 return [...seamSamples(entry,c),...oracles[entry.id],{XY:[0,0],sector:0,positions:[]},{XY:[.04,.02],sector:0,positions:[]}].map(a=>({...a,strips:a.positions.map(p=>owner[p.join(':')])}));
}
async function observe(page){await page.evaluate(()=>{window.__applies=[];const button=document.querySelector('#apply-candidate'),handler=button.onclick;button.onclick=function(e){const start=performance.now(),promise=Promise.resolve(handler.call(this,e));window.__applies.push(promise.finally(()=>window.__applyMs=performance.now()-start));return promise;};});}
async function stage(page,config,pattern){for(const key of ['weave','phase','beta','crop'])await page.selectOption('#candidate-'+key,String(config[key]));await page.selectOption('#candidate-pattern',pattern===null?'mono':String(pattern));}
async function apply(page){const i=await page.evaluate(()=>window.__applies.length);await page.click('#apply-candidate');await page.evaluate(i=>window.__applies[i],i);}
async function active(page){const s=await snapshot(page);for(const k of Object.keys(s.controls))if(k.startsWith('candidate-'))delete s.controls[k];return {...s,project:await page.evaluate(()=>window.corner.captureProject())};}
const server=http.createServer((req,res)=>{let file=path.resolve(ROOT,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(ROOT+path.sep))return res.writeHead(403).end();if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'text/html');res.end(b);});});
const chosen=[['mad-sixfold',60,'r3'],['mad-sixfold',60,'r6'],['mad-sixfold',180,'r3'],['mad-sixfold',420,'r6'],['mad-sixfold',600,'r6'],['mad-sixfold',720,'r6'],['mad-ordinary',600,'r6'],['mad-ordinary',720,'r6'],['mad-c-on',60,'r3'],['mad-c-on',420,'r3'],['mad-c-on',720,'r6'],['hex-large',60,'r7'],['hex-large',180,'r7'],['hex-large',600,'r7'],['hex-large',720,'r7'],['hex-minus',600,'r7'],['hex-minus',720,'r7'],['hex-plus',600,'r7'],['hex-plus',720,'r7']].map(([phase,beta,crop])=>entries.find(e=>e.config.phase===phase&&e.config.beta===beta&&e.config.crop===crop));assert(chosen.every(Boolean));
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/research/corner-prototype/`,results=[];
try{for(const name of (process.env.MADWEAVE_STAGE2_BROWSERS||'chromium,firefox,webkit').split(',')){
 const browser=await p[name].launch({headless:true,...(name==='chromium'&&process.env.MADWEAVE_CHROMIUM_EXECUTABLE?{executablePath:process.env.MADWEAVE_CHROMIUM_EXECUTABLE}:{})});
 try{
  const context=await browser.newContext({acceptDownloads:true,viewport:{width:1500,height:1200}}),offline=await browser.newContext({acceptDownloads:true,viewport:{width:1500,height:1200}}),errors=[],requests=[];
  await offline.route(/^https?:/,r=>r.abort());if(name!=='webkit')await offline.setOffline(true);offline.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.waitForFunction(()=>window.corner?.initialized);await observe(page);
  // A genuinely grouped edit: 420 at the ordinary phase fails order; changing
  // to sixfold while retaining class coloring fails color. All three together
  // are valid and never expose an intermediate active design.
  await page.selectOption('#strip','0');const initial=await active(page);
  await page.selectOption('#candidate-beta','420');assert.equal(await page.locator('#candidate-summary').getAttribute('data-status'),'Invalid');assert.deepEqual(await active(page),initial);
  await apply(page);assert.deepEqual(await active(page),initial);assert.match(await page.locator('#status').innerText(),/failed:.*retained/);
  await page.selectOption('#candidate-pattern','mono');assert.equal(await page.locator('#candidate-summary').getAttribute('data-status'),'Invalid');assert.match(await page.locator('#candidate-summary').innerText(),/Geometry\/order: Invalid/);await page.selectOption('#candidate-pattern','1');
  await page.selectOption('#candidate-beta','480');await page.selectOption('#candidate-phase','mad-sixfold');assert.equal(await page.locator('#candidate-summary').getAttribute('data-status'),'Invalid');assert.deepEqual(await active(page),initial);
  await page.selectOption('#candidate-beta','420');await page.selectOption('#candidate-pattern','mono');assert.equal(await page.locator('#candidate-summary').getAttribute('data-status'),'Validated');await apply(page);
  assert.equal(await page.evaluate(()=>window.corner.model.p.beta),420);assert.equal(await page.evaluate(()=>window.corner.selection.selected),null);assert.match(await page.locator('#status').innerText(),/selection cleared/);
  const grouped=true;
  // Unsupported crop and weave/phase mismatches remain explicit proposals.
  for(const change of [['candidate-crop','r7'],['candidate-weave','hexweave']]){
   await page.click('#reset-candidate');const before=await active(page);await page.selectOption('#'+change[0],change[1]);assert.equal(await page.locator('#candidate-summary').getAttribute('data-status'),'Unvalidated');await apply(page);assert.deepEqual(await active(page),before);
  }
  // Failed detached rendering and deliberately reordered completion/error.
  await page.click('#reset-candidate');const target=entries.find(e=>e.config.phase==='mad-sixfold'&&e.config.beta===600&&e.config.crop==='r6');await stage(page,target.config,null);
  const failedBefore=await snapshot(page);await page.evaluate(async()=>{const {Diagram}=await import('./kernel.mjs');window.__mesh=Diagram.prototype.mesh;Diagram.prototype.mesh=()=>{throw Error('injected grouped redraw failure');};});
  await apply(page);await page.evaluate(async()=>{const {Diagram}=await import('./kernel.mjs');Diagram.prototype.mesh=window.__mesh;});assert.deepEqual(await snapshot(page),failedBefore);assert.match(await page.locator('#status').innerText(),/injected grouped redraw failure.*retained/);
  const races=[];
  for(const lateFailure of [false,true]){
   let held;await page.route('**/'+target.url,r=>{held=r;});const i=await page.evaluate(()=>window.__applies.length);await page.click('#apply-candidate');while(!held)await page.waitForTimeout(10);
   await page.selectOption('#candidate-beta','720');const proposalStatus=await page.locator('#candidate-summary').innerText(),before=await active(page),status=await page.locator('#status').innerText();
   await held.fulfill({status:lateFailure?503:200,contentType:'application/json',body:lateFailure?'injected stale error':JSON.stringify(certs[target.id])});await page.evaluate(i=>window.__applies[i],i);await page.unroute('**/'+target.url);
   assert.deepEqual(await active(page),before);assert.equal(await page.locator('#status').innerText(),status);assert.equal(await page.locator('#candidate-summary').innerText(),proposalStatus);races.push(lateFailure?'stale-grouped-error':'stale-grouped-success');await stage(page,target.config,null);
  }
  // Two competing grouped Apply operations, including a newer failure. Every
  // completion goes through the real handler and shared revision guard.
  for(const [olderFails,newerFails]of [[false,false],[true,false],[false,true]]){
   const base=entries.find(e=>e.config.phase==='mad-sixfold'&&e.config.beta===420&&e.config.crop==='r6'),newer=entries.find(e=>e.config.phase==='mad-sixfold'&&e.config.beta===720&&e.config.crop==='r6');
   await stage(page,base.config,null);await apply(page);await page.selectOption('#strip','0');
   const held={};await page.route('**/family-certificates/*.json',r=>{const u=r.request().url();if(u.endsWith('/'+target.url))held.old=r;else if(u.endsWith('/'+newer.url))held.new=r;else r.continue();});
   await stage(page,target.config,null);const i=await page.evaluate(()=>window.__applies.length);await page.click('#apply-candidate');
   await stage(page,newer.config,null);await page.click('#apply-candidate');while(!held.old||!held.new)await page.waitForTimeout(10);
   await held.new.fulfill({status:newerFails?503:200,contentType:'application/json',body:newerFails?'new grouped fetch failed':JSON.stringify(certs[newer.id])});await page.evaluate(i=>window.__applies[i+1],i);
   const before=await snapshot(page),status=await page.locator('#status').innerText(),proposal=await page.locator('#candidate-summary').innerText();
   assert.equal(await page.evaluate(()=>window.corner.model.p.beta),newerFails?420:720);
   await held.old.fulfill({status:olderFails?503:200,contentType:'application/json',body:olderFails?'old grouped error':JSON.stringify(certs[target.id])});await page.evaluate(i=>window.__applies[i],i);await page.unroute('**/family-certificates/*.json');
   assert.deepEqual(await snapshot(page),before);assert.equal(await page.locator('#status').innerText(),status);assert.equal(await page.locator('#candidate-summary').innerText(),proposal);races.push(`grouped-old-${olderFails?'error':'success'}-after-new-${newerFails?'failure':'success'}`);
  }
  // Real Open controls migrate the actual old file, preserving its occurrence
  // selection and every other model field, with only version/catalogue changed.
  await watchImports(page);const legacy=path.join(__dirname,'evidence/corner-stage3a-worked/01-self-23.corner.html');await chooseFile(page,legacy);await settled(page,0);
  const old=JSON.parse(fs.readFileSync(path.join(__dirname,'evidence/corner-stage3a-worked/round-trip.json'))).before;
  assert.deepEqual(await page.evaluate(()=>window.corner.captureProject()),{...old,version:2,catalogue:'corner-family-v2'});
  const selection=await page.evaluate(()=>window.corner.selection);await page.selectOption('#rotation','-137');assert.deepEqual(await page.evaluate(()=>window.corner.selection),selection);
  const rows=[];
  const renderCases=process.env.MADWEAVE_STAGE3B_CONTROLS_ONLY==='1'?[]:process.env.MADWEAVE_STAGE3B_INSPECTION_ONLY==='1'?chosen.filter(e=>e.config.phase==='mad-sixfold'&&e.config.beta===720&&e.config.crop==='r6'):chosen;
  for(const entry of renderCases){
   const pattern=entry.patterns.find(a=>a.valid&&a.distinct_colors===3)?.pattern??null;await stage(page,entry.config,pattern);await apply(page);
   assert.equal(await page.evaluate(()=>window.corner.entry.id),entry.id);const applyMs=await page.evaluate(()=>window.__applyMs);
   const redrawStart=Date.now();await page.selectOption('#rotation',entry.config.beta%120===0?'90':'23');const redrawMs=Date.now()-redrawStart;
   for(const id of ['seams','outlines','visible-edges','export-annotations'])await page.locator('#'+id).uncheck();await page.locator('#diagram').scrollIntoViewIfNeeded();
   const sample=samples(entry),audit=await page.evaluate(auditReference,sample);assert.deepEqual(checkCertificate(audit.snapshot,path.join(OUT,name+'-'+entry.id+'-rendered.json')).counts,entry.counts);
   const image=PNG.sync.read(await page.screenshot({fullPage:true}));
   for(const probe of audit.pixel){const i=(Math.floor(probe.y)*image.width+Math.floor(probe.x))*4,want=probe.color===-1?[255,255,255]:palette[probe.color],actual=[...image.data.subarray(i,i+3)];assert(Math.max(...actual.map((v,j)=>Math.abs(v-want[j])))<=4,JSON.stringify({name,id:entry.id,probe,want,actual}));}
   if(entry.counts.self_crossings){
    const crossing=await page.evaluate(()=>{const m=window.corner.model;return [...document.querySelector('#crossing').options].find(o=>o.value!==''&&m.certificate.crossings[Number(o.value)].pair.every(a=>m.owner.get(a.join(':'))===m.owner.get(m.certificate.crossings[Number(o.value)].pair[0].join(':')))).value;});await page.selectOption('#crossing',crossing);await page.click('#next');
   }else await page.selectOption('#strip','0');
   const state=await semantic(page),prefix=path.join(OUT,name+'-'+entry.id);await save(page,prefix+'.corner.html');const fileBytes=fs.statSync(prefix+'.corner.html').size;assert(fileBytes<10*1024*1024);
   const local=await offline.newPage();local.on('pageerror',e=>errors.push(e.message));const loadStart=Date.now();await local.goto(pathToFileURL(prefix+'.corner.html').href);await local.waitForFunction(()=>window.corner?.initialized);const offlineLoadMs=Date.now()-loadStart;
   assert.deepEqual(await semantic(local),state);await local.selectOption('#rotation',state.project.view.rotation===90?'23':'90');const edited=await semantic(local);
   await save(local,prefix+'-resaved.corner.html');await local.goto(pathToFileURL(prefix+'-resaved.corner.html').href);await local.waitForFunction(()=>window.corner?.initialized);assert.deepEqual(await semantic(local),edited);
   await artwork(local,prefix+'.svg');const svg=await offline.newPage();await svg.goto(pathToFileURL(prefix+'.svg').href);
   const exported=await inspectSVG(svg,entry,colored(entry,pattern),false,sample);assert.deepEqual(independent(exported.certificate,prefix+'-exported.json'),entry.counts);await pixelAudit(svg,exported,{name,id:entry.id});
   let inspection=null;
   if(entry.config.phase==='mad-sixfold'&&entry.config.beta===720&&entry.config.crop==='r6'){
    for(const flag of ['visible-edges','outlines','seams','export-annotations'])await local.locator('#'+flag).check();
    const original=await semantic(local);await artwork(local,prefix+'-inspection.svg');assert.deepEqual(await semantic(local),original);
    const bounds=await local.evaluate(()=>{const m=window.corner.model;return {segments:m.meshAudit.reduce((n,a)=>n+a.segments.length,0),allWithinBound:m.meshAudit.every(a=>a.segments.every(s=>s.bound<=m.epsilon&&s.bound*m.sigma<=.25))};});assert(bounds.allWithinBound);
    await svg.goto(pathToFileURL(prefix+'-inspection.svg').href);const annotated=await inspectSVG(svg,entry,colored(entry,pattern),true,sample);assert.deepEqual(independent(annotated.certificate,prefix+'-inspection-exported.json'),entry.counts);await pixelAudit(svg,annotated,{name,id:entry.id,annotated:true});
    inspection={...bounds,svgBytes:fs.statSync(prefix+'-inspection.svg').size,pixels:annotated.pixel.length};
   }
   // Grouped controls remain operational offline, with the same whole-family
   // runtime rather than a single rendered drawing frozen into the file.
   await observe(local);const alternate=entries.find(e=>e.config.phase==='mad-sixfold'&&e.config.beta===180&&e.config.crop==='r3');await stage(local,alternate.config,null);await apply(local);assert.equal(await local.evaluate(()=>window.corner.entry.id),alternate.id);
   rows.push({id:entry.id,config:entry.config,pattern,applyMs,redrawMs,offlineLoadMs,fileBytes,svgBytes:fs.statSync(prefix+'.svg').size,probes:sample.length,pixels:audit.pixel.length,segments:audit.segments,maxBound:audit.maxBound,pixelBound:audit.pixelBound,offlineRoundTrip:true,independentExport:true,inspection});
   await svg.close();await local.close();console.log(name,entry.id,'grouped, offline and SVG passed');
  }
  assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);results.push({browser:name,version:browser.version(),grouped,failedGroupedRedraw:true,races,legacyNativeImport:true,viewIdentityPreserved:true,rows,offlineNetworkRequests:requests,errors});await context.close();await offline.close();
 }finally{await browser.close();}
}}finally{server.close();}
fs.writeFileSync(path.join(OUT,process.env.MADWEAVE_STAGE3B_CONTROLS_ONLY==='1'?'controls.json':process.env.MADWEAVE_STAGE3B_INSPECTION_ONLY==='1'?'inspection.json':'browser.json'),JSON.stringify(results,null,2)+'\n');console.log('Stage 3B browser checks passed');
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
