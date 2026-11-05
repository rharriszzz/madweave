// Actual-control regressions. Exported so the nine-example browser runner uses
// exactly the same cases as the before/after reproduction experiment.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const folder=path.join(__dirname,'corner-prototype/certificates');
async function snapshot(page){return page.evaluate(()=>{
 const c=window.corner,m=c.model;
 return {entry:c.entry.id,model:{parameters:m.p,pattern:m.pattern,rotation:m.rotation},selection:c.selection,
  svg:document.querySelector('#diagram').outerHTML,
  controls:Object.fromEntries([...document.querySelectorAll('select,input')].map(e=>[e.id,
   {value:e.value,disabled:e.disabled,checked:e.type==='checkbox'?e.checked:null,options:e.tagName==='SELECT'?[...e.options].map(a=>[a.value,a.textContent,a.title,a.disabled]):null}])),
  summary:document.querySelector('#summary').textContent,inspection:document.querySelector('#inspection').textContent,
  certificate:document.querySelector('#certificate').textContent,href:document.querySelector('#certificate-link').getAttribute('href')};
 });}
async function observeRequests(page){await page.evaluate(()=>{
 const e=document.querySelector('#example'),handler=e.onchange;window.__exampleRequests=[];
 e.onchange=function(event){const result=handler.call(this,event);window.__exampleRequests.push(Promise.resolve(result).catch(()=>false));return result;};
 });}
async function settle(page,index){await page.evaluate(i=>window.__exampleRequests[i],index);}
async function failMesh(page,on){await page.evaluate(async on=>{
 const {Diagram}=await import('./kernel.mjs');
 if(on){window.__originalMesh=Diagram.prototype.mesh;Diagram.prototype.mesh=()=>{throw Error('Unvalidated: injected render failure');};}
 else{Diagram.prototype.mesh=window.__originalMesh;delete window.__originalMesh;}
 },on);}
async function prime(page,url,key='excess'){
 await page.goto(url);await page.waitForFunction(()=>window.corner?.ready);await page.waitForTimeout(180);
 if(key!=='excess'){await observeRequests(page);await page.selectOption('#example',key);await settle(page,0);}
 await page.selectOption('#strip','0');
 await page.evaluate(()=>{window.__priorModel=window.corner.model;});
}
function body(key){return fs.readFileSync(path.join(folder,key+'.json'),'utf8');}

async function run(page,url,{baseline=false}={}){
 const results=[];
 const record=async(name,test)=>{
  try{
   await test();
   if(!baseline&&name.startsWith('failed-')){
    const status=await page.locator('#status').evaluate(e=>({text:e.textContent,...e.dataset}));
    assert.equal(status.status,'Unvalidated');assert.equal(status.activeStatus,'Validated');
    assert.equal(status.activeExample,await page.evaluate(()=>window.corner.entry.id));
    assert.match(status.text,/failed:.*retained/);
   }
   results.push({name,passed:true});
  }
  catch(error){if(!baseline)throw error;results.push({name,passed:false,reproducedDefect:error.message.slice(0,500)});}
 };
 const redraws=[
  ['failed-color-redraw','#color','4'],['failed-view-redraw','#rotation','90'],
  ['failed-outline-redraw','#outlines',true],['failed-seam-redraw','#seams',false],
  ['failed-strip-inspection','#strip','1']];
 await prime(page,url);
 if(await page.locator('#visible-edges').count())redraws.push(['failed-visible-boundaries','#visible-edges',true]);
 for(const [name,selector,value] of redraws){
  await record(name,async()=>{
   await prime(page,url);const before=await snapshot(page);await failMesh(page,true);
   try{if(typeof value==='boolean')await page.locator(selector).click();else await page.selectOption(selector,value);}
   finally{await failMesh(page,false);}
   assert.deepEqual(await snapshot(page),before,name+' must retain the complete committed state');
   assert(await page.evaluate(()=>window.corner.model===window.__priorModel),'Failed action replaced active model');
   assert.match(await page.locator('#status').innerText(),/Unvalidated.*injected render failure/);
  });
 }
 if(await page.locator('#crossing').count())await record('failed-keyboard-crossing-selection',async()=>{
  await prime(page,url);const before=await snapshot(page);await failMesh(page,true);
  try{await page.locator('#crossing').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');}
  finally{await failMesh(page,false);}
  assert.deepEqual(await snapshot(page),before);
  assert.match(await page.locator('#status').innerText(),/Unvalidated.*injected render failure/);
 });
 await record('failed-next-local-position',async()=>{
  await prime(page,url,'self');
  await page.locator('#diagram').scrollIntoViewIfNeeded();
  const screen=await page.evaluate(()=>{
   const c=window.corner,m=c.model,key=a=>a.join(':'),e=m.certificate.crossings.find(e=>key(e.pair[0])!==key(e.pair[1])&&m.owner.get(key(e.pair[0]))===m.owner.get(key(e.pair[1])));
   const n=x=>String(x).split('/').map(Number).reduce((a,b)=>a/b),p=m.map([n(e.XY[0])/Math.sqrt(3),n(e.XY[1])],e.pair[0][0]);
   const q=new DOMPoint(...p).matrixTransform(document.querySelector('#diagram').getScreenCTM());return {x:q.x,y:q.y};
  });
  await page.mouse.click(screen.x,screen.y);const before=await snapshot(page);await failMesh(page,true);
  try{await page.locator('#next').click();}finally{await failMesh(page,false);}
  assert.deepEqual(await snapshot(page),before,'Failed local-position cycle changed selection/control');
 });
 await record('failed-clear-selection',async()=>{
  await prime(page,url);const before=await snapshot(page);await failMesh(page,true);
  try{await page.locator('#clear').click();}finally{await failMesh(page,false);}
  assert.deepEqual(await snapshot(page),before);
 });
 await record('failed-certificate-fetch',async()=>{
  await prime(page,url);await observeRequests(page);const before=await snapshot(page);
  await page.route('**/certificates/planar.json',route=>route.fulfill({status:503,body:'injected unavailable'}));
  await page.selectOption('#example','planar');await settle(page,0);await page.unroute('**/certificates/planar.json');
  assert.deepEqual(await snapshot(page),before,'Failed fetch left a misleading active example');
  assert.match(await page.locator('#status').innerText(),/Unvalidated.*certificate unavailable/);
 });
 await record('failed-example-render',async()=>{
  await prime(page,url);await observeRequests(page);const before=await snapshot(page);await failMesh(page,true);
  try{await page.selectOption('#example','planar');await settle(page,0);}finally{await failMesh(page,false);}
  assert.deepEqual(await snapshot(page),before);
 });
 for(const olderFailure of [false,true])await record(olderFailure?'stale-error-after-new-success':'stale-success-after-new-success',async()=>{
  await prime(page,url);await observeRequests(page);const routes={};
  await page.route('**/certificates/*.json',route=>{routes[path.basename(new URL(route.request().url()).pathname,'.json')]=route;});
  await page.selectOption('#example','planar');await page.selectOption('#example','deficit');
  while(!routes.planar||!routes.deficit)await page.waitForTimeout(10);
  await routes.deficit.fulfill({status:200,contentType:'application/json',body:body('deficit')});await settle(page,1);
  const latest=await snapshot(page),status=await page.locator('#status').innerText();
  await routes.planar.fulfill({status:olderFailure?503:200,contentType:'application/json',body:olderFailure?'late failure':body('planar')});await settle(page,0);
  await page.unroute('**/certificates/*.json');
  assert.deepEqual(await snapshot(page),latest,'Older completion overwrote newer design');
  assert.equal(await page.locator('#status').innerText(),status,'Stale completion overwrote current status');
 });
 await record('stale-success-after-new-failure',async()=>{
  await prime(page,url);await observeRequests(page);const before=await snapshot(page),routes={};
  await page.route('**/certificates/*.json',route=>{routes[path.basename(new URL(route.request().url()).pathname,'.json')]=route;});
  await page.selectOption('#example','planar');await page.selectOption('#example','deficit');
  while(!routes.planar||!routes.deficit)await page.waitForTimeout(10);
  await routes.deficit.fulfill({status:503,body:'new failure'});await settle(page,1);
  const failureStatus=await page.locator('#status').innerText();
  await routes.planar.fulfill({status:200,contentType:'application/json',body:body('planar')});await settle(page,0);
  await page.unroute('**/certificates/*.json');
  assert.deepEqual(await snapshot(page),before);assert.equal(await page.locator('#status').innerText(),failureStatus);
 });
 for(const [label,control,value]of [['view','#rotation','90'],['color','#color','4'],['inspection','#strip','1']])await record(`new-${label}-invalidates-pending-example`,async()=>{
  await prime(page,url);await observeRequests(page);let pending;
  await page.route('**/certificates/planar.json',route=>{pending=route;});
  await page.selectOption('#example','planar');while(!pending)await page.waitForTimeout(10);
  await page.selectOption(control,value);const latest=await snapshot(page),status=await page.locator('#status').innerText();
  await pending.fulfill({status:200,contentType:'application/json',body:body('planar')});await settle(page,0);await page.unroute('**/certificates/planar.json');
  assert.deepEqual(await snapshot(page),latest);assert.equal(await page.locator('#status').innerText(),status);
 });
 if(!baseline)assert(results.every(r=>r.passed));
 return results;
}
module.exports={run,snapshot};

if(require.main===module){
 const http=require('node:http'),p=require('playwright'),root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':'text/html');res.end(b);});});
 (async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await p.chromium.launch({headless:true,...(process.env.MADWEAVE_CHROMIUM_EXECUTABLE?{executablePath:process.env.MADWEAVE_CHROMIUM_EXECUTABLE}:{})});
  const page=await browser.newPage({viewport:{width:1500,height:1200}});
  const results=await run(page,`http://127.0.0.1:${server.address().port}/research/corner-prototype/`,{baseline:process.argv.includes('--baseline')});
  fs.mkdirSync(path.join(__dirname,'output/corner-correction'),{recursive:true});
  fs.writeFileSync(path.join(__dirname,'output/corner-correction',process.argv.includes('--baseline')?'baseline-defects.json':'transaction-results.json'),JSON.stringify(results,null,2)+'\n');
  console.log(results.map(r=>`${r.passed?'PASS':'DEFECT'} ${r.name}`).join('\n'));
 }finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
}
