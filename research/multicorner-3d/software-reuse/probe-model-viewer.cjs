const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,firefox}=require('playwright');
const {PNG}=require('pngjs');
const root=path.resolve(__dirname,'../../output/software-reuse');
fs.mkdirSync(root,{recursive:true});
fs.copyFileSync(path.join(__dirname,'supplied-panels.gltf'),path.join(root,'fixture.gltf'));
fs.writeFileSync(path.join(root,'index.html'),`<!doctype html><meta charset="utf-8"><title>Existing viewer probe</title>
<script type="module" src="./model-viewer.min.js"></script>
<style>body{margin:0;background:#eef0f3;font:16px sans-serif}model-viewer{width:900px;height:700px}p{margin:16px}</style>
<p>Supplied patterned mesh — rendering probe, not a corner construction</p>
<model-viewer id="viewer" src="fixture.gltf" camera-controls camera-orbit="30deg 55deg auto" interaction-prompt="none" shadow-intensity="0.5" alt="Patterned synthetic paper panels"></model-viewer>`);
const results={package:'@google/model-viewer',version:'4.4.0',scope:'Local rendering smoke probe, not corner assembly or performance verification',fixture:{panels:7,triangles:13,model:'synthetic supplied mesh, no assembly claim'},browsers:[]};
const types={'.html':'text/html','.js':'text/javascript','.gltf':'model/gltf+json'};
const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(file,(e,data)=>{if(e){res.writeHead(404).end();return}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data)});});
const pixels=(a,b)=>{const p=PNG.sync.read(a),q=PNG.sync.read(b);assert.equal(p.width,q.width);let changed=0;for(let i=0;i<p.data.length;i+=4)if(Math.max(...[0,1,2].map(c=>Math.abs(p.data[i+c]-q.data[i+c])))>20)changed++;return changed;};
(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
try{for(const engine of [chromium,firefox]){let browser;const r={engine:engine.name(),passed:false};results.browsers.push(r);try{
  browser=await engine.launch({headless:true,...(engine===chromium?{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})});r.version=browser.version();
  const page=await browser.newPage({viewport:{width:1000,height:800}});const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{const u=route.request().url();if(u.startsWith(base)||u.startsWith('data:')||u.startsWith('blob:'))return route.continue();external.push(u);return route.abort();});
  await page.goto(base+'/index.html');await page.waitForFunction(()=>document.querySelector('#viewer')?.loaded,{timeout:30000});
  await page.waitForTimeout(400);
  r.materials=await page.evaluate(()=>document.querySelector('#viewer').model.materials.map(m=>({name:m.name,texture:!!m.pbrMetallicRoughness.baseColorTexture.texture})));
  assert.equal(r.materials.length,7);assert.ok(r.materials.every(m=>m.texture));
  const hit=await page.evaluate(()=>{const v=document.querySelector('#viewer');for(let y=120;y<600;y+=15)for(let x=150;x<750;x+=15){const m=v.materialFromPoint(x,y),p=v.positionAndNormalFromPoint(x,y);if(m&&p?.uv)return {x,y,name:m.name,uv:p.uv,position:p.position};}return null;});
  assert.ok(hit);r.hit=hit;assert.equal(await page.evaluate(()=>document.querySelector('#viewer').materialFromPoint(0,0)),null);
  await page.screenshot({path:path.join(root,engine.name()+'-before.png')});const before=fs.readFileSync(path.join(root,engine.name()+'-before.png'));
  const untouched=await page.evaluate(name=>document.querySelector('#viewer').model.materials.filter(m=>m.name!==name).map(m=>({name:m.name,color:m.pbrMetallicRoughness.baseColorFactor})),hit.name);
  await page.evaluate(name=>{const m=document.querySelector('#viewer').model.materials.find(m=>m.name===name);m.pbrMetallicRoughness.baseColorTexture.setTexture(null);m.pbrMetallicRoughness.setBaseColorFactor([1,0,.6,1]);},hit.name);
  await page.waitForTimeout(300);const after=await page.screenshot({path:path.join(root,engine.name()+'-recolored.png')});r.changedPixels=pixels(before,after);assert.ok(r.changedPixels>200);
  assert.deepEqual(await page.evaluate(name=>document.querySelector('#viewer').model.materials.filter(m=>m.name!==name).map(m=>({name:m.name,color:m.pbrMetallicRoughness.baseColorFactor})),hit.name),untouched);
  const orbit=await page.evaluate(()=>{const o=document.querySelector('#viewer').getCameraOrbit();return {theta:o.theta,radius:o.radius};});
  await page.mouse.move(440,360);await page.mouse.down();await page.mouse.move(600,400,{steps:12});await page.mouse.up();await page.waitForTimeout(400);
  const rotated=await page.evaluate(()=>document.querySelector('#viewer').getCameraOrbit().theta);assert.ok(Math.abs(rotated-orbit.theta)>.1);r.pointerOrbit=true;
  await page.mouse.wheel(0,-150);await page.waitForTimeout(400);const radius=await page.evaluate(()=>document.querySelector('#viewer').getCameraOrbit().radius);assert.ok(Math.abs(radius-orbit.radius)>.001);r.pointerZoom=true;
  r.pngBytes=await page.evaluate(async()=>{const blob=await document.querySelector('#viewer').toBlob({mimeType:'image/png'});return blob.size;});assert.ok(r.pngBytes>1000);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);r.pageErrors=errors;r.externalRequests=external;r.passed=true;
}catch(e){r.error=e.stack;process.exitCode=1;}finally{await browser?.close();}console.log(JSON.stringify(r));}}
finally{server.close();fs.writeFileSync(path.join(root,'results.json'),JSON.stringify(results,null,2)+'\n');}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
