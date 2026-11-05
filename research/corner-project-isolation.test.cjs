// Real save/open controls at boundary selections and planar format isolation.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),p=require('playwright');
const {pathToFileURL}=require('node:url');
const {snapshot}=require('./corner-prototype-transactions.test.cjs');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(__dirname,'output/corner-project');
async function run(page,url,name){
 await page.goto(url);await page.waitForFunction(()=>window.corner?.initialized);
 await page.evaluate(()=>{const input=document.querySelector('#open-file'),handler=input.onchange;window.__opened=null;input.onchange=function(e){return window.__opened=handler.call(this,e);};});
 const open=async file=>{const event=page.waitForEvent('filechooser');await page.click('#open-project');await(await event).setFiles(file);await page.evaluate(()=>window.__opened);};
 const save=async(file,selector)=>{const event=page.waitForEvent('download');await page.click(selector);await(await event).saveAs(file);};
 const cases=[];
 for(const [label,rotation,j,theta]of [['empty-hole',23,0,null],['first-ray',90,0,0],['interior-ray',-137,1,0],['final-wrap',23,3,120]]){
  await page.selectOption('#rotation',String(rotation));await page.locator('#diagram').scrollIntoViewIfNeeded();
  const screen=await page.evaluate(({j,theta})=>{const m=window.corner.model,t=theta*Math.PI/180,point=theta===null?m.center:m.map([1.7*Math.cos(t),1.7*Math.sin(t)],j),p=new DOMPoint(...point).matrixTransform(document.querySelector('#diagram').getScreenCTM());return {x:p.x,y:p.y};},{j,theta});
  if(theta===null)await page.mouse.click(screen.x,screen.y);
  else await page.evaluate(({j,theta})=>{const m=window.corner.model,t=theta*Math.PI/180;window.corner.selectPoint(m.map([1.7*Math.cos(t),1.7*Math.sin(t)],j));},{j,theta});
  // Exact floating-point rays use the selection API: browser pointer events
  // quantize CSS coordinates and cannot encode an exact mathematical ray.
  // Saving, clearing and opening below still exercise actual file controls.
  const before=await page.evaluate(()=>window.corner.captureProject());
  if(theta===null)assert.equal(before.selection.local,null);else assert(before.selection.local?.positions.length);
  if(label==='final-wrap')assert.equal(before.selection.local.sector,0);
  const file=path.join(OUT,name+'-'+label+'.corner.html');await save(file,'#save-project');await page.click('#clear');await open(file);
  assert.deepEqual(await page.evaluate(()=>window.corner.captureProject()),before,label+' selection changed');cases.push(label);
 }
 const planar=await page.context().newPage();await planar.goto(new URL('../../editor.html',url).href);
 await planar.waitForFunction(()=>!document.querySelector('#save-project').disabled);
 const before=await planar.evaluate(()=>MadWeaveProject.capture(document.querySelector('#weave').contentWindow));assert.equal(before.format,'madweave-project');assert.equal(before.version,1);
 const file=path.join(OUT,name+'-planar-v1.html');await saveFromPlanar(planar,file);
 // Corner importer rejects both the planar state and its executable envelope.
 for(const payload of [file,{name:'planar-v1.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(before))}]){
  const prior=await snapshot(page),project=await page.evaluate(()=>window.corner.captureProject());await open(payload);
  assert.deepEqual(await snapshot(page),prior);assert.deepEqual(await page.evaluate(()=>window.corner.captureProject()),project);
  assert.match(await page.locator('#status').innerText(),/failed:.*retained/);
 }
 // Existing planar open retains its version-1 interpretation, then rejects the
 // different corner envelope instead of silently converting it.
 await planar.locator('#project-file').setInputFiles(file);await planar.waitForFunction(()=>document.querySelector('#export-status').textContent.startsWith('Opened '));
 assert.deepEqual(await planar.evaluate(()=>MadWeaveProject.capture(document.querySelector('#weave').contentWindow)),before);
 await planar.locator('#project-file').setInputFiles(path.join(OUT,name+'-final-wrap.corner.html'));
 await planar.waitForFunction(()=>document.querySelector('#export-status').textContent.startsWith('Project was not opened:'));
 assert.deepEqual(await planar.evaluate(()=>MadWeaveProject.capture(document.querySelector('#weave').contentWindow)),before);
 await planar.close();
 // Inspect/cycle a genuine self-crossing and change compatible colors through
 // the standalone file's controls, with both network protocols denied.
 const offline=await page.context().browser().newContext({acceptDownloads:true,viewport:{width:1500,height:1200}}),requests=[];
 await offline.route(/^https?:/,route=>route.abort());if(name!=='webkit')await offline.setOffline(true);
 offline.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 const local=await offline.newPage();await local.goto(pathToFileURL(path.join(OUT,name+'-final-wrap.corner.html')).href);await local.waitForFunction(()=>window.corner?.initialized);
 await local.selectOption('#color','4');assert.equal(await local.evaluate(()=>window.corner.model.pattern),4);
 await local.selectOption('#example','self');await local.selectOption('#color','1');
 const crossing=await local.evaluate(()=>{const m=window.corner.model;return [...document.querySelector('#crossing').options].find(o=>o.value!==''&&m.certificate.crossings[Number(o.value)].pair.every(a=>m.owner.get(a.join(':'))===m.owner.get(m.certificate.crossings[Number(o.value)].pair[0].join(':')))).value;});
 await local.selectOption('#crossing',crossing);const initial=await local.evaluate(()=>window.corner.captureProject());
 await local.click('#next');const cycled=await local.evaluate(()=>window.corner.captureProject());
 assert.notEqual(initial.selection.local.active,cycled.selection.local.active);assert.equal(initial.selection.strip,cycled.selection.strip);assert.notEqual(...cycled.selection.local.positions);
 const resaved=path.join(OUT,name+'-offline-inspected.corner.html');await saveFromCorner(local,resaved,'#save-project');
 await local.goto(pathToFileURL(resaved).href);await local.waitForFunction(()=>window.corner?.initialized);assert.deepEqual(await local.evaluate(()=>window.corner.captureProject()),cycled);
 await saveFromCorner(local,path.join(OUT,name+'-offline-inspected.svg'),'#export-svg');
 await local.locator('summary').click();const supplied=path.join(OUT,name+'-offline-supplied-certificate.json');
 await saveFromCorner(local,supplied,'#certificate-link');assert.deepEqual(JSON.parse(fs.readFileSync(supplied)),await local.evaluate(()=>window.corner.model.certificate));
 assert.deepEqual(requests,[]);await offline.close();
 return {boundarySelections:cases,planarVersion1RoundTrip:true,planarRejectedByCorner:true,cornerRejectedByPlanar:true,offlineColorEdit:true,offlineSelfInspection:true,offlineInspectionResaveExport:true,offlineSuppliedCertificate:true,offlineNetworkRequests:requests};
}
async function saveFromCorner(page,file,selector){const event=page.waitForEvent('download');await page.click(selector);await(await event).saveAs(file);}
async function saveFromPlanar(page,file){const event=page.waitForEvent('download');await page.getByRole('button',{name:'Save Project',exact:true}).click();await(await event).saveAs(file);}
module.exports={run};
if(require.main===module){
 const server=http.createServer((req,res)=>{let file=path.resolve(ROOT,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(ROOT+path.sep))return res.writeHead(403).end();if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',(/\.m?js$/).test(file)?'text/javascript':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(b);});});
 (async()=>{fs.mkdirSync(OUT,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));const rows=[];
 try{for(const name of ['chromium','firefox','webkit']){
  const browser=await p[name].launch({headless:true,...(name==='chromium'&&process.env.MADWEAVE_CHROMIUM_EXECUTABLE?{executablePath:process.env.MADWEAVE_CHROMIUM_EXECUTABLE}:{})});
  try{const context=await browser.newContext({acceptDownloads:true,viewport:{width:1500,height:1200}}),page=await context.newPage();rows.push({browser:name,version:browser.version(),...await run(page,`http://127.0.0.1:${server.address().port}/research/corner-prototype/`,name)});console.log(name,'boundary round trips and planar isolation passed');}finally{await browser.close();}
 }}finally{server.close();}fs.writeFileSync(path.join(OUT,'isolation.json'),JSON.stringify(rows,null,2)+'\n');
 })().catch(e=>{console.error(e);server.close();process.exitCode=1;});
}
