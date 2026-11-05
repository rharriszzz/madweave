// Stage 2: actual SVG geometry/paint/picking against independent Python oracles.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {spawnSync}=require('node:child_process'),assert=require('node:assert/strict');
const transactions=require('./corner-prototype-transactions.test.cjs');
const playwright=require('playwright'),{PNG}=require('pngjs');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(__dirname,'output/corner-prototype');fs.mkdirSync(OUT,{recursive:true});
const registry=JSON.parse(fs.readFileSync(path.join(__dirname,'corner-prototype/examples.json')));
const oracles=JSON.parse(fs.readFileSync(path.join(__dirname,'evidence/corner-prototype-oracles.json')));
const palette=[[71,127,121],[189,113,61],[139,109,165]];
const oracleHash=require('node:crypto').createHash('sha256').update(JSON.stringify(oracles)).digest('hex');
function checkCertificate(c,file){
 fs.writeFileSync(file,JSON.stringify(c));
 const run=spawnSync('python3',[path.join(__dirname,'check-corner-certificate.py'),file],{encoding:'utf8'});
 assert.equal(run.status,0,run.stdout+run.stderr);return JSON.parse(run.stdout);
}
// Shared normal audit: also used unchanged to reject the visible-paint mutation.
function auditReference(samples){
     const c=window.corner,m=c.model,svg=document.querySelector('#diagram');
     const key=a=>a.join(':'),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
     const paths=[...svg.querySelectorAll('defs path[data-occurrence]')];
     const cells=[...svg.querySelectorAll('.cell')].map(e=>({e,path:document.querySelector('#'+e.dataset.region+' path'),stack:JSON.parse(e.dataset.stack)}));
     const paintedFaces=[...svg.querySelectorAll('[data-material-color]')];
     for(const row of cells)row.box=row.path.getBBox();
     const pixel=[];let occupied=0,empty=0;
     for(const row of samples){
      const local=[row.XY[0]/Math.sqrt(3),row.XY[1]],point=m.map(local,row.sector),dom=new DOMPoint(...point);
      const actual=paths.filter(p=>p.isPointInFill(dom)).map(p=>p.dataset.occurrence).sort();
      const expected=row.positions.map(key).sort();
      if(!equal(actual,expected))throw Error('SVG material occupancy '+JSON.stringify({row,actual,expected}));
      const hits=m.pick(point);
      if(!equal(hits.map(a=>a.position),row.positions.map(key))||!equal(hits.map(a=>a.strip),row.strips))throw Error('Reference picking/order mismatch');
      // Firefox reports a zero getBBox for paths inside clipPath, while its
      // isPointInFill is valid. A bbox is only an optional performance filter.
      const faces=cells.filter(a=>(!a.box.width&&!a.box.height||point[0]>=a.box.x&&point[0]<=a.box.x+a.box.width&&point[1]>=a.box.y&&point[1]<=a.box.y+a.box.height)&&a.path.isPointInFill(dom));
      if(row.positions.length){
       occupied++;
       if(faces.length!==1||!equal(faces[0].stack,row.positions.map(key)))throw Error('Mapped order-region occupancy/stack '+JSON.stringify({row,point,faces:faces.map(a=>({stack:a.stack,box:a.box}))}));
       const painted=faces[0].e.querySelector('.face');
       if(painted.dataset.position!==key(row.positions[0]))throw Error('Wrong SVG visible order');
       if(painted.getAttribute('d')!==faces[0].path.getAttribute('d'))throw Error('Face/region map mismatch');
      }else{empty++;if(faces.length)throw Error('Material drawn in reference gap');}
      const visible=paintedFaces.filter(p=>p.isPointInFill(dom));
      const expectedColor=row.positions.length?m.color(key(row.positions[0])):null;
      if(visible.length!==(expectedColor===null?0:1)||visible.some(p=>Number(p.dataset.materialColor)!==expectedColor||p.getAttribute('fill')!==['#477f79','#bd713d','#8b6da5'][expectedColor]))throw Error('Actual opaque paint union disagrees with reference order');
      const radius=Math.hypot(...local),normal=[[0,1],[-Math.sqrt(3)/2,-.5],[Math.sqrt(3)/2,-.5]];
      let margin=Math.abs(radius-m.R);
      for(const a of m.certificate.pieces)if(a.id[0]===0){
       const u=normal[a.id[1]][0]*local[0]+normal[a.id[1]][1]*local[1]-(a.id[2]-2.5);
       margin=Math.min(margin,Math.abs(u-m.W/2),Math.abs(u+m.W/2));
      }
      if(margin*Math.min(1,m.f)*m.sigma>3&&pixel.length<160){
       const screen=dom.matrixTransform(svg.getScreenCTM()),rect=svg.getBoundingClientRect();
       if(screen.x>rect.left+2&&screen.x<rect.right-2&&screen.y>rect.top+2&&screen.y<rect.bottom-2)
        pixel.push({x:screen.x+scrollX,y:screen.y+scrollY,color:row.positions.length?m.color(key(row.positions[0])):-1});
      }
     }
     // Rebuild the supplied certificate from actual SVG IDs, geometry metadata,
     // material paint colors and cell painter relations, then use Python's checker.
     const snapshot=structuredClone(m.certificate);snapshot.pattern=m.pattern;
     const palette=['#477f79','#bd713d','#8b6da5'];
     snapshot.pieces=paths.map(p=>{
      const source=m.parts.get(p.dataset.occurrence);
      return {...source,id:p.dataset.occurrence.split(':').map(Number),vertices:JSON.parse(p.dataset.vertices),color:palette.indexOf(p.getAttribute('fill'))};
     });
     const pairs=new Map();
     for(const row of cells){
      const stack=JSON.parse(row.e.dataset.stack),face=row.e.querySelector('.face');
      if(face.dataset.position!==stack[0]||face.getAttribute('fill')!==palette[m.color(stack[0])])throw Error('Visible face disagrees with local order/material color');
      for(let a=0;a<stack.length;a++)for(let b=a+1;b<stack.length;b++){
       const pair=[stack[a],stack[b]].sort(),key=pair.join('|');
       if(pairs.has(key)&&pairs.get(key).top.join(':')!==stack[a])throw Error('Local order reversal');
       pairs.set(key,{pair:pair.map(a=>a.split(':').map(Number)),top:stack[a].split(':').map(Number)});
      }
     }
     snapshot.orders=[...pairs.values()];
     snapshot.render_cells=[...svg.querySelectorAll('clipPath[data-sector="0"]')].map(a=>JSON.parse(a.dataset.referenceCell));
     let segments=0,circles=0,maxMeasured=0,maxBound=0;
     for(const mesh of m.meshAudit){
      for(let i=0;i<mesh.segments.length;i++){
       const s=mesh.segments[i],a=mesh.points[i],b=mesh.points[i+1];
       let mid=s.a.map((x,k)=>(x+s.b[k])/2);
       if(s.kind==='circle'){
        circles++;const angle=Math.atan2(s.a[1],s.a[0])+s.sweep/2;mid=[s.R*Math.cos(angle),s.R*Math.sin(angle)];
       }
       const trueMid=m.map(mid,mesh.j),v=b.map((x,k)=>x-a[k]);
       const t=Math.max(0,Math.min(1,v.reduce((sum,x,k)=>sum+(trueMid[k]-a[k])*x,0)/v.reduce((sum,x)=>sum+x*x,0)));
       const measured=Math.hypot(...trueMid.map((x,k)=>x-a[k]-t*v[k]));
       if(s.bound>m.epsilon+1e-12||measured>s.bound+1e-9)throw Error('Curve bound violated');
       maxMeasured=Math.max(maxMeasured,measured);maxBound=Math.max(maxBound,s.bound);segments++;
      }
     }
     if(maxBound*m.sigma>.25||maxBound>m.W/1000)throw Error('World/pixel error bound');
     for(const join of m.certificate.joins){
      const num=x=>Array.isArray(x)?m.R*Math.sqrt(3):String(x).split('/').map(Number).reduce((a,b)=>a/b);
      const r=(num(join.interval[0])+num(join.interval[1]))/(2*Math.sqrt(3)),angle=m.rotation+join.right[0]*2*Math.PI/m.m;
      const p=[m.center[0]+r*Math.cos(angle),m.center[1]+r*Math.sin(angle)],hits=m.pick(p);
      const screen=new DOMPoint(...p).matrixTransform(svg.getScreenCTM());
      const {local}=m.inverse(p),normals=[[0,1],[-Math.sqrt(3)/2,-.5],[Math.sqrt(3)/2,-.5]];
      let clearance=m.R-r;
      for(const a of m.certificate.pieces)if(a.id[0]===0){
       const v=normals[a.id[1]][0]*local[0]+normals[a.id[1]][1]*local[1]-(a.id[2]-2.5);
       clearance=Math.min(clearance,Math.abs(v-m.W/2),Math.abs(v+m.W/2));
      }
      // Flat-color assertions require clearance from real band/circle edges;
      // exact-ray identity tests below still cover every thin fringe interval.
      if(clearance*Math.min(1,m.f)*m.sigma>3)pixel.push({x:screen.x+scrollX,y:screen.y+scrollY,color:m.color(hits[0].position),seam:true});
     }
     return {occupied,empty,pixel,snapshot,segments,circles,maxMeasured,maxBound,pixelBound:maxBound*m.sigma};
}
const server=http.createServer((req,res)=>{
 let file=path.resolve(ROOT,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(ROOT+path.sep)){res.writeHead(403).end();return;}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 fs.readFile(file,(error,bytes)=>{if(error){res.writeHead(404).end();return;}
  const type={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';
  res.writeHead(200,{'Content-Type':type});res.end(bytes);
 });
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}/research/corner-prototype/`;
 const names=(process.env.MADWEAVE_STAGE2_BROWSERS||'chromium,firefox,webkit').split(',');
 const results=[];
 try{for(const name of names){
  const options={headless:true};if(name==='chromium'&&process.env.MADWEAVE_CHROMIUM_EXECUTABLE)options.executablePath=process.env.MADWEAVE_CHROMIUM_EXECUTABLE;
  const browser=await playwright[name].launch(options),rows=[],errors=[];
  try{
   const page=await browser.newPage({viewport:{width:1500,height:1200},deviceScaleFactor:1});
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url);await page.waitForFunction(()=>window.corner?.ready);
   for(const entry of registry){
    await page.evaluate(key=>window.corner.load(key),entry.id);
    await page.waitForFunction(()=>window.corner.ready);
    await page.locator('#seams').uncheck();
    // Verify both mono and compatible material color choices, plus every
    // witnessed incompatible pattern's atomic rejection.
    const colorResults=await page.evaluate(entry=>{
     const c=window.corner,result=[];
     for(const pattern of [null,...entry.patterns.map(a=>a.pattern)]){
      const before=c.model.pattern,ids=[...c.model.parts.keys()];
      c.setPattern(pattern);const expected=pattern===null||entry.patterns[pattern].valid;
      if(expected&&c.model.pattern!==pattern)throw Error('Compatible edit rejected');
      if(!expected&&(c.model.pattern!==before||JSON.stringify(ids)!==JSON.stringify([...c.model.parts.keys()])))throw Error('Invalid edit changed design');
      if(!expected&&!document.querySelector('#status').textContent.includes('Color conflict'))throw Error('Missing conflict witness');
      result.push({pattern,valid:expected});
     }
     c.setPattern(entry.default_pattern);return result;
    },entry);
    const samples=oracles[entry.id];
    const audit=await page.evaluate(auditReference,samples);
    const supplied=path.join(OUT,`${name}-${entry.id}-rendered.json`);
    const independent=checkCertificate(audit.snapshot,supplied);assert.deepEqual(independent.counts,entry.counts);
    const png=PNG.sync.read(await page.screenshot({fullPage:true,path:path.join(OUT,`${name}-${entry.id}.png`)}));
    for(const probe of audit.pixel){
     const index=(Math.floor(probe.y)*png.width+Math.floor(probe.x))*4,actual=[...png.data.subarray(index,index+3)],expected=probe.color<0?[255,255,255]:palette[probe.color];
     assert(actual.length===3&&Math.max(...actual.map((x,i)=>Math.abs(x-expected[i])))<=3,JSON.stringify({entry:entry.id,probe,actual,expected}));
    }
    let visiblePaintNegative=null;
    if(entry.id==='excess'){
     const mutation=await page.evaluate(samples=>{
      const m=window.corner.model,svg=document.querySelector('#diagram'),key=a=>a.join(':'),num=x=>String(x).split('/').map(Number).reduce((a,b)=>a/b);
      const row=samples.find(row=>row.positions.length===2&&m.color(key(row.positions[0]))!==m.color(key(row.positions[1]))&&Math.hypot(row.XY[0]/Math.sqrt(3),row.XY[1])<m.R-.5&&m.certificate.crossings.some(e=>e.pair[0][0]===row.sector&&e.pair.every(a=>row.positions.some(b=>key(a)===key(b)))&&e.XY.every((v,i)=>Math.abs(num(v)-row.XY[i])<1e-9)));
      if(!row)throw Error('No known certified crossing for visible paint mutation');
      const point=m.map([row.XY[0]/Math.sqrt(3),row.XY[1]],row.sector),dom=new DOMPoint(...point);
      const cell=[...svg.querySelectorAll('.cell')].find(a=>a.querySelector('.face').isPointInFill(dom));
      const shape=cell.querySelector('.face').getAttribute('d'),top=m.color(key(row.positions[0])),under=m.color(key(row.positions[1]));
      const upper=svg.querySelector(`[data-material-color="${top}"]`),lower=svg.querySelector(`[data-material-color="${under}"]`);
      const upperD=upper.getAttribute('d'),lowerD=lower.getAttribute('d');
      if(!upperD.includes(shape))throw Error('Expected cell absent from visible compound paint');
      window.__paintRestore={upper,lower,upperD,lowerD,certificate:JSON.stringify(m.certificate)};
      // Change the real painted region, not .face metadata, IDs, order records,
      // source geometry, oracle samples, or material assignments.
      upper.setAttribute('d',upperD.replace(shape,''));lower.setAttribute('d',lowerD+' '+shape);
      const screen=dom.matrixTransform(svg.getScreenCTM());
      return {positions:row.positions,referenceXY:row.XY,sector:row.sector,correctColor:top,wrongTopColor:under,x:screen.x+scrollX,y:screen.y+scrollY};
     },samples);
     let rejection;
     try{
      try{await page.evaluate(auditReference,samples);}catch(error){rejection=error.message;}
      assert.match(rejection||'',/Actual opaque paint union disagrees with reference order/);
      const wrong=PNG.sync.read(await page.screenshot({fullPage:true,path:path.join(OUT,`${name}-wrong-visible-top.png`)}));
      const index=(Math.floor(mutation.y)*wrong.width+Math.floor(mutation.x))*4,actual=[...wrong.data.subarray(index,index+3)];
      assert(Math.max(...actual.map((x,i)=>Math.abs(x-palette[mutation.correctColor][i])))>20,'Visible negative control did not change screenshot paint');
      assert(Math.max(...actual.map((x,i)=>Math.abs(x-palette[mutation.wrongTopColor][i])))<=3,'Incorrect lower material was not visibly painted on top');
      visiblePaintNegative={...mutation,actualRGB:actual,normalAuditRejected:true,witness:rejection.split('\n')[0],oracleHash};
     }finally{
      await page.evaluate(()=>{const r=window.__paintRestore;r.upper.setAttribute('d',r.upperD);r.lower.setAttribute('d',r.lowerD);if(JSON.stringify(window.corner.model.certificate)!==r.certificate)throw Error('Reference certificate changed');delete window.__paintRestore;});
     }
     await page.evaluate(auditReference,samples);
    }
    const boundaryChecks=await page.evaluate(()=>{
     const c=window.corner,m=c.model,key=a=>a.join(':'),num=x=>Array.isArray(x)?Math.sqrt(Number(x[1].split('/')[0])/Number(x[1].split('/')[1]||1)):x.split('/').map(Number).reduce((a,b)=>a/b);
     let count=0;
     for(const rotation of [0,23,90,-137]){
      m.rotation=rotation*Math.PI/180;
      for(const join of m.certificate.joins){
       const j=join.right[0],r=(num(join.interval[0])+num(join.interval[1]))/(2*Math.sqrt(3)),groups=[];
       for(const side of [-1e-8,0,1e-8]){
        const angle=m.rotation+j*2*Math.PI/m.m+side,point=[m.center[0]+r*Math.cos(angle),m.center[1]+r*Math.sin(angle)];
        const hits=m.pick(point),owner=m.owner.get(key(join.right));
        if(!hits.some(a=>a.strip===owner))throw Error('Seam or final-wrap identity');
        if(side===0&&m.inverse(point).j!==j)throw Error('Exact-ray ownership');
        groups.push(hits.map(a=>a.strip).sort((a,b)=>a-b));count++;
       }
       if(JSON.stringify(groups[0])!==JSON.stringify(groups[2]))throw Error('Both sides of seam differ');
      }
      if(m.pick(m.center).length||m.pick([m.center[0]+(1-m.W)/4,m.center[1]]).length)throw Error('Hole picked material');
     }
     m.rotation=23*Math.PI/180;c.draw();
     const old=c.entry.id;return {count,old};
    });
    let negativeControls=null;
    if(entry.id==='excess')negativeControls=await page.evaluate(samples=>{
     const c=window.corner,m=c.model,svg=document.querySelector('#diagram'),key=a=>a.join(':');
     const row=samples.find(a=>a.positions.length>=2),point=m.map([row.XY[0]/Math.sqrt(3),row.XY[1]],row.sector);
     const position=key(row.positions[0]),band=svg.querySelector(`path[data-occurrence="${position}"]`),saved=band.getAttribute('d');
     const originalF=m.f,originalRotation=m.rotation;
     const dFor=mesh=>mesh.points.map((p,i)=>`${i?'L':'M'}${p.join(',')}`).join(' ')+' Z';
     m.f=1;m.rotation=0;const badBand=dFor(m.pieceMesh(position,m.epsilon));m.f=originalF;m.rotation=originalRotation;
     band.setAttribute('d',badBand);
     const bandMismatch=samples.some(a=>{
      const p=m.map([a.XY[0]/Math.sqrt(3),a.XY[1]],a.sector);
      return band.isPointInFill(new DOMPoint(...p))!==a.positions.some(b=>key(b)===position);
     });band.setAttribute('d',saved);
     const cell=[...svg.querySelectorAll('.cell')].find(a=>svg.querySelector('#'+a.dataset.region+' path').isPointInFill(new DOMPoint(...point)));
     const index=Number(cell.dataset.region.match(/cell-(\d+)/)[1]),clip=svg.querySelector(`#cell-${index} path`),old=clip.getAttribute('d');
     m.f=1;m.rotation=0;const badMask=dFor(m.mesh(m.cells[index].edges,m.cells[index].j,m.epsilon));m.f=originalF;m.rotation=originalRotation;
     clip.setAttribute('d',badMask);
     const maskMismatch=samples.some(a=>{
      const p=m.map([a.XY[0]/Math.sqrt(3),a.XY[1]],a.sector),dom=new DOMPoint(...p);
      const prior=(()=>{clip.setAttribute('d',old);return clip.isPointInFill(dom);})();
      clip.setAttribute('d',badMask);return prior!==clip.isPointInFill(dom);
     });clip.setAttribute('d',old);
     const face=cell.querySelector('.face'),top=face.dataset.position;
     face.dataset.position=JSON.parse(cell.dataset.stack)[1];
     const orderMetadataMismatch=face.dataset.position!==key(row.positions[0]);face.dataset.position=top;
     let exhausted=false,reserve=false;
     try{m.pieceMesh(position,1e-8,0);}catch(e){exhausted=e.message.includes('depth exhausted');}
     try{m.pieceMesh(position,1e-12);}catch(e){reserve=e.message.includes('below reserve');}
     if(!bandMismatch||!maskMismatch||!orderMetadataMismatch||!exhausted||!reserve)throw Error('Render/numerical negative control failed');
     return {bandMismatch,maskMismatch,orderMetadataMismatch,depthExhaustionUnvalidated:exhausted,numericReserveUnvalidated:reserve};
    },samples);
    await page.locator('#strip').selectOption('0');
    assert.equal(await page.locator('[data-selected-position]').count(),audit.snapshot.components[0].pieces.length);
    let fringeSelection=null;
    if(entry.id==='excess'){
     await page.locator('#seams').check();
     fringeSelection=await page.evaluate(()=>{
      const m=window.corner.model,[d,s]=m.certificate.fringe_bands[0],position=`0:${d}:${s}`,strip=m.owner.get(position);
      return {position,strip,pieces:m.certificate.components[strip].pieces.length,
       partners:m.certificate.joins.filter(e=>m.owner.get(e.left.join(':'))===strip).length};
     });
     await page.locator('#strip').selectOption(String(fringeSelection.strip));
     assert.equal(await page.locator('[data-selected-position]').count(),fringeSelection.pieces);
     assert.equal(await page.locator(`[data-selected-position="${fringeSelection.position}"]`).count(),1);
     assert.equal(await page.locator('.partner').count(),fringeSelection.partners);
     await page.locator('#seams').uncheck();
    }
    await page.locator('#clear').click();
    const click=samples.find(a=>a.positions.length&&a.XY[0]!==0);
    const screen=await page.evaluate(row=>{
     const m=window.corner.model,p=m.map([row.XY[0]/Math.sqrt(3),row.XY[1]],row.sector);
     const q=new DOMPoint(...p).matrixTransform(document.querySelector('#diagram').getScreenCTM());return {x:q.x,y:q.y};
    },click);
    await page.mouse.click(screen.x,screen.y);assert((await page.locator('#inspection').innerText()).includes('Joined strip'));
    const before=await page.locator('defs path[data-occurrence]').count();
    assert.equal(await page.evaluate(()=>window.corner.load('unsupported-radius-6.3')),false);
    assert.equal(await page.locator('defs path[data-occurrence]').count(),before);
    if(entry.id==='self'){
     const self=await page.evaluate(()=>{
      const c=window.corner,m=c.model,owner=m.owner,key=a=>a.join(':');
      const event=m.certificate.crossings.find(e=>e.pair[0].join(':')!==e.pair[1].join(':')&&owner.get(key(e.pair[0]))===owner.get(key(e.pair[1])));
      const num=x=>String(x).split('/').map(Number).reduce((a,b)=>a/b);
      const point=m.map([num(event.XY[0])/Math.sqrt(3),num(event.XY[1])],event.pair[0][0]);
      const hits=c.selectPoint(point);
      if(!event.pair.every(a=>hits.some(h=>h.position===key(a))))throw Error('Self-crossing positions collapsed');
      return {positions:event.pair,strip:owner.get(key(event.pair[0])),hits};
     });
     const first=await page.evaluate(()=>window.corner.selection.hits[window.corner.selection.hitIndex].position);
     await page.locator('#next').click();
     assert.equal((await page.evaluate(()=>window.corner.selection.hits.length)),self.hits.length);
     const next=await page.evaluate(()=>({position:window.corner.selection.hits[window.corner.selection.hitIndex].position,strip:window.corner.selection.selected}));
     assert.notEqual(next.position,first);assert.equal(next.strip,self.strip);
    }
    if(entry.id==='excess'){
     assert(await page.evaluate(async()=>{
      const {Diagram}=await import('./kernel.mjs'),saved=Diagram.prototype.mesh;
      const current=window.corner.model,graphic=document.querySelector('#diagram').innerHTML;
      try{
       Diagram.prototype.mesh=()=>{throw Error('Unvalidated: forced subdivision budget exhaustion');};
       if(await window.corner.load('planar'))throw Error('Failed bound was accepted');
       if(!document.querySelector('#status').textContent.includes('forced subdivision'))throw Error('Missing bound-failure status');
       return window.corner.model===current&&document.querySelector('#diagram').innerHTML===graphic;
      }finally{Diagram.prototype.mesh=saved;}
     }));
    }
    rows.push({id:entry.id,probes:samples.length,occupied:audit.occupied,empty:audit.empty,pixels:audit.pixel.length,
      counts:independent.counts,segments:audit.segments,circularSegments:audit.circles,maxMeasured:audit.maxMeasured,
      maxBound:audit.maxBound,pixelBound:audit.pixelBound,boundaryChecks:boundaryChecks.count,colorResults,negativeControls,visiblePaintNegative,fringeSelection});
    console.log(name,entry.id,'passed',samples.length,'reference probes');
   }
   const transactionResults=await transactions.run(page,url);
   await page.goto(url);await page.waitForFunction(()=>window.corner?.ready);
   await page.selectOption('#color','mono');await page.locator('#seams').uncheck();
   const materialBefore=await page.locator('.material-cells').innerHTML();
   await page.locator('#visible-edges').focus();await page.keyboard.press('Space');
   assert(await page.locator('#visible-edges').isChecked());assert(await page.locator('.visible-boundary').count()>0);
   assert.equal(await page.locator('.material-cells').innerHTML(),materialBefore,'Inspection changed material colors/geometry');
   assert.equal(await page.locator('[data-layer="hidden-inspection"] path').count(),0);
   await page.screenshot({fullPage:true,path:path.join(OUT,`${name}-monochrome-desktop.png`)});
   await page.locator('#crossing').focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
   assert(await page.evaluate(()=>window.corner.selection.hits.length>=2));
   assert.match(await page.locator('#inspection').innerText(),/OVER.*\n.*UNDER/);
   await page.locator('#next').focus();const beforePosition=await page.evaluate(()=>window.corner.selection.hits[window.corner.selection.hitIndex].position);
   await page.keyboard.press('Space');assert.notEqual(await page.evaluate(()=>window.corner.selection.hits[window.corner.selection.hitIndex].position),beforePosition);
   await page.setViewportSize({width:390,height:900});await page.waitForTimeout(300);
   await page.locator('#outlines').focus();await page.keyboard.press('Space');
   assert(await page.locator('[data-layer="hidden-inspection"] path').count()>0);
   await page.screenshot({fullPage:true,path:path.join(OUT,`${name}-monochrome-mobile.png`)});
   assert(await page.evaluate(()=>window.corner.model.meshAudit.every(m=>m.segments.every(s=>s.bound*window.corner.model.sigma<=.25))));
   assert.deepEqual(errors,[]);
   results.push({browser:name,version:browser.version(),rows,errors,transactionResults,keyboardInspectionPassed:true,monochromeMaterialUnchanged:true,mobileBoundPassed:true});
  }finally{await browser.close();}
 }}finally{server.close();}
 fs.writeFileSync(path.join(OUT,'browser-results.json'),JSON.stringify(results,null,2)+'\n');
 console.log('Stage 2 browser checks passed');
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
