#!/usr/bin/env node
// Pixel regressions for the actual renderer, with independent finite-strip geometry.
const p=require('playwright'),{PNG}=require('pngjs'),g=require('./planar-geometry.cjs');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const BROWSER=process.env.MADWEAVE_RESEARCH_BROWSER||'chromium';
const OUT='research/output/seam-fix/'+BROWSER;fs.mkdirSync(OUT,{recursive:true});
const engine=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'..','madweave.js'),'utf8'),engine);
const rgb=s=>s.match(/\d+/g).map(Number),over=(back,front,a)=>front.map((v,i)=>v*a+back[i]*(1-a));
const at=(png,x,y)=>[...png.data.subarray((y*png.width+x)*4,(y*png.width+x)*4+3)];
const delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
function edges(m){
 const all=new Map();
 for(const c of g.visibleCells(m))for(let i=0;i<c.poly.length;i++){
  const a=c.poly[i],b=c.poly[(i+1)%c.poly.length],key=[a,b].map(v=>v.map(x=>Math.round(x*1e7)).join(',')).sort().join(':');
  if(!all.has(key))all.set(key,{a,b,count:0});all.get(key).count++;
 }
 return [...all.values()].filter(e=>e.count===2).flatMap(({a,b})=>[.25,.5,.75].map(t=>a.map((v,i)=>v+t*(b[i]-v))))
  .filter(q=>q.every(v=>Math.abs(v)<.9)&&g.clearance(m,q)>.03);
}
(async()=>{
 const browser=await p[BROWSER].launch({headless:true}),results=[],fixtures=[],errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1100},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  // Check opaque and translucent colors against analytic source-over arithmetic.
  const raw=fs.readFileSync(path.join(__dirname,'fixtures/clip-seam-minimal.svg'),'utf8');
  for(const opacity of [[1,1],[.6,.6],[1,.4],[.3,1],[0,0]]){
   await page.setContent('<body style="margin:0">'+raw+'</body>');
   const svg=page.locator('svg');
   await svg.evaluate((root,opacity)=>{
    const ns=root.namespaceURI,doc=root.ownerDocument,groups=[...root.children].filter(e=>e.localName==='g');
    const parent=doc.createElementNS(ns,'g');parent.style.isolation='isolate';root.append(parent);
    for(const group of groups){
     parent.append(group);group.style.mixBlendMode='plus-lighter';group.style.filter='opacity(1)';
     const stack=doc.createElementNS(ns,'g');stack.style.isolation='isolate';
     [...group.children].forEach((e,i)=>e.setAttribute('fill-opacity',opacity[i]));stack.append(...group.children);group.append(stack);
    }
   },opacity);
   const png=PNG.sync.read(await svg.screenshot({path:OUT+'/fixture-'+opacity.join('-')+'.png'}));
   const expected=over(over([255,255,255],[140,118,241],opacity[0]),[252,205,118],opacity[1]);
   const seam=at(png,120,120),interior=at(png,120,115);
   assert(delta(seam,expected)<=2,'Fixture seam: '+JSON.stringify({opacity,seam,expected}));
   assert(delta(interior,expected)<=2,'Fixture interior colors changed: '+JSON.stringify({opacity,interior,expected}));
   await svg.evaluate(root=>[...root.children].find(e=>e.localName==='rect').remove());
   // Firefox's Playwright screenshot API cannot omit the background. Read the
   // same static SVG through a transparent canvas in every engine instead.
   const rgba=await svg.evaluate(async root=>{
    const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(root));await img.decode();
    const canvas=root.ownerDocument.createElement('canvas');canvas.width=canvas.height=240;
    const context=canvas.getContext('2d');context.drawImage(img,0,0);return [...context.getImageData(120,120,1,1).data];
   });
   const alpha=1-(1-opacity[0])*(1-opacity[1]),premultiplied=over(over([0,0,0],[140,118,241],opacity[0]),[252,205,118],opacity[1]);
   assert(Math.abs(rgba[3]-255*alpha)<=2,'Transparent SVG alpha changed: '+rgba);
   assert(delta(rgba.slice(0,3).map(v=>v*rgba[3]/255),premultiplied)<=2,'Transparent SVG premultiplied color changed: '+rgba);
   fixtures.push({opacity,expected,seam,interior,transparentSeam:rgba});
  }
  await page.setContent('<body style="margin:0">'+fs.readFileSync(path.join(__dirname,'fixtures/clip-seam-fixed.svg'),'utf8')+'</body>');
  const checkedIn=PNG.sync.read(await page.locator('svg').screenshot());
  assert(delta(at(checkedIn,120,120),[252,205,118])<=2,'Checked-in solution fixture has a seam');
  if(process.argv.includes('--fixtures-only')){console.log(JSON.stringify({browser:BROWSER,fixtures},null,2));return;}
  await page.goto(process.env.MADWEAVE_URL||'http://127.0.0.1:8766/editor.html');
  const frame=page.frameLocator('#weave'),svg=frame.locator('#svg');await frame.locator('#cbuttonSC1').waitFor();
  let previous=0,negativeControl=null;
  for(const size of [1,2,8]){
   await frame.locator('#cbuttonSC'+size).dispatchEvent('mousedown');
   for(let spacing=0;spacing<4;spacing++){
    await frame.locator('#cbuttonSep'+spacing).dispatchEvent('mousedown');
    const m=g.model(size,[.07,.33,.8,2][spacing]),points=edges(m);
    for(let orientation=0;orientation<8;orientation++){
     for(const [bit,id] of [[1,'C'],[2,'X'],[4,'-']])if((orientation&bit)!==(previous&bit))await frame.locator('[id="cbutton'+id+'"]').dispatchEvent('mousedown');
     previous=orientation;
     Object.assign(engine,{starMadWeaveCenter:!!(orientation&1),alternate:!!(orientation&2),hand:!!(orientation&4)});
     const modes=orientation===0?['opaque','translucent','hidden','hidden-direction','hidden-class','outlines']:
      size===2&&spacing===1?['opaque','translucent']:['opaque'];
     for(const mode of modes){
      const state=await svg.evaluate((root,{pitch,mode})=>{
       const w=root.ownerDocument.defaultView;
       w.opacityArray=w.opacityArray.map((_,i)=>mode==='translucent'?[.35,.6,.8][i%3]:1);
       w.visibilityIndexArray=w.visibilityIndexArray.map((_,i)=>mode!=='hidden'||i%3!==0);
       w.showD=[true,mode!=='hidden-direction',true];w.showC=[true,true,mode!=='hidden-class'];
       w.showingLines=mode==='outlines';w.buildStrips(root.ownerDocument);
       root.setAttribute('viewBox',[-pitch,-pitch,2*pitch,2*pitch].join(' '));
       const a=root.getScreenCTM(),b=root.getBoundingClientRect();
       if(getComputedStyle(root.querySelector('#strips')).isolation!=='isolate')throw Error('Seam fix unavailable');
       return {matrix:[a.a,a.b,a.c,a.d,a.e-b.left,a.f-b.top],scale:a.a*pitch,
        strips:[...root.querySelectorAll('path[mwColorIndex]')].map(e=>({color:e.getAttribute('fill'),alpha:Number(e.getAttribute('fill-opacity')),visible:e.parentElement.getAttribute('visibility')!=='hidden'}))};
      },{pitch:m.pitch,mode});
      function expected(q){
       const indices=g.normals.map(n=>Math.round(g.dot(n,q)+m.offset)),present=g.occupancy(m,q),order=g.order(engine,indices);
       return order.slice().reverse().reduce((back,d)=>{
        const item=present.find(s=>s.d===d);if(!item)return back;
        const strip=state.strips[d*m.n+item.s];return strip.visible?over(back,rgb(strip.color),strip.alpha):back;
       },[255,255,255]);
      }
      const chosen=points.filter(q=>g.clearance(m,q)*state.scale>8).filter(q=>{
       const colors=[[0,.001],[0,-.001],[.001,0],[-.001,0]].map(v=>expected(q.map((x,i)=>x+v[i])));
       return colors.every(c=>delta(c,colors[0])<.01);
      });
      assert(chosen.length>0,'No constant-color seams: '+[size,spacing,orientation]);
      const png=PNG.sync.read(await svg.screenshot());let worst=0,samples=0,probe=null;
      for(const q of chosen){
       const [a,b,c,d,e,f]=state.matrix,x=Math.round(a*q[0]*m.pitch+c*q[1]*m.pitch+e),y=Math.round(b*q[0]*m.pitch+d*q[1]*m.pitch+f),want=expected(q);
       for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
        const observed=at(png,x+dx,y+dy),difference=delta(observed,want);samples++;
        if(difference>worst){worst=difference;probe={point:q,pixel:[x+dx,y+dy],observed,expected:want};}
       }
      }
      const row={size,spacing,orientation,mode,seams:chosen.length,samples,maxChannelError:worst,probe};results.push(row);
      if(worst>4)await svg.screenshot({path:OUT+'/failure.png'});
      assert(worst<=4,'Full weave seam: '+JSON.stringify(row));
      if(size===2&&spacing===1&&orientation===0&&mode==='opaque'){
       await svg.screenshot({path:OUT+'/fixed.png'});
       const downloadEvent=page.waitForEvent('download');await page.locator('#export').click();
       await (await downloadEvent).saveAs(OUT+'/exported.svg');
       const exportedSvg=fs.readFileSync(OUT+'/exported.svg','utf8');
       assert(!/<script\b|\son\w+=/.test(exportedSvg),'Artwork export contains executable content');
       const original=await svg.evaluate(root=>{
        const copy=root.cloneNode(true),strips=root.querySelector('#strips');strips.style.isolation='';
        for(const group of strips.children){group.style.mixBlendMode='';group.style.filter='';const stack=group.firstElementChild;group.append(...stack.children);stack.remove();}
        const box=root.getBoundingClientRect();copy.setAttribute('width',box.width);copy.setAttribute('height',box.height);return new XMLSerializer().serializeToString(copy);
       });
       const legacy=PNG.sync.read(await svg.screenshot({path:OUT+'/legacy.png'}));let oldWorst=0;
       for(const q of chosen){const [a,b,c,d,e,f]=state.matrix,x=Math.round(a*q[0]*m.pitch+c*q[1]*m.pitch+e),y=Math.round(b*q[0]*m.pitch+d*q[1]*m.pitch+f);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)oldWorst=Math.max(oldWorst,delta(at(legacy,x+dx,y+dy),expected(q)));}
       assert(oldWorst>20,'Negative control did not expose the original seam');negativeControl={oldWorst,fixedWorst:worst};
       fs.writeFileSync(OUT+'/fixed-static.svg',original);
       // A script-free SVG loaded through an image must retain the solution.
       const staticPage=await browser.newPage({viewport:{width:1500,height:1100}});
       const stripped=exportedSvg;
       await staticPage.setContent('<body style="margin:0"><img style="width:'+png.width+'px;height:'+png.height+'px" src="data:image/svg+xml;base64,'+Buffer.from(stripped).toString('base64')+'"></body>');
       const img=staticPage.locator('img');await img.evaluate(e=>e.decode());
       const exported=PNG.sync.read(await img.screenshot({path:OUT+'/fixed-image.png'}));
       let exportWorst=0;
       for(const q of chosen){const [a,b,c,d,e,f]=state.matrix,x=Math.round(a*q[0]*m.pitch+c*q[1]*m.pitch+e),y=Math.round(b*q[0]*m.pitch+d*q[1]*m.pitch+f);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)exportWorst=Math.max(exportWorst,delta(at(exported,x+dx,y+dy),expected(q)));}
       assert(exportWorst<=4,'Static SVG image lost the solution: '+exportWorst);negativeControl.exportWorst=exportWorst;await staticPage.close();
      }
     }
    }
   }
   console.log('PASS seam pixels B'+size+' in '+BROWSER);
  }
  // Exercise the unsupported-feature path with the actual builder.
  await svg.evaluate(root=>{
   const w=root.ownerDocument.defaultView,supports=w.CSS.supports;
   w.CSS.supports=()=>false;
   try{w.buildStrips(root.ownerDocument);}finally{w.CSS.supports=supports;}
   for(const group of root.querySelector('#strips').children){
    if(group.style.mixBlendMode||group.style.filter||group.querySelector('[id$="Stack"]'))throw Error('Fallback retained additive rendering');
    if(group.querySelectorAll('use').length!==3)throw Error('Fallback lost a direction');
   }
  });
  assert(negativeControl);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({browser:BROWSER,version:browser.version(),fixtures,negativeControl,configurations:results.length,samples:results.reduce((n,r)=>n+r.samples,0),maxChannelError:Math.max(...results.map(r=>r.maxChannelError))},null,2));
 }finally{fs.writeFileSync(OUT+'/results.json',JSON.stringify({browser:BROWSER,version:browser.version(),fixtures,results,errors},null,2)+'\n');await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
