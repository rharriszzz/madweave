#!/usr/bin/env node
// Reduce the real scene without changing a seam pixel; reproduce with four rectangles.
const playwright=require('playwright'),{PNG}=require('pngjs'),g=require('./planar-geometry.cjs');
const fs=require('node:fs'),assert=require('node:assert/strict');
const BROWSER=process.env.MADWEAVE_RESEARCH_BROWSER||'chromium';
assert(['chromium','firefox'].includes(BROWSER));
const OUT='research/output/seam-isolation/'+BROWSER;fs.mkdirSync(OUT,{recursive:true});
const RGB={bottom:[140,118,241],top:[252,205,118],neutral:[40,90,140],white:[255,255,255]};
const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const at=(png,[x,y])=>Array.from(png.data.subarray((y*png.width+x)*4,(y*png.width+x)*4+3));
const blend=(back,front,a)=>front.map((v,i)=>v*a+back[i]*(1-a));
const predict=(stack,a=.5)=>stack.reduce((back,c)=>blend(back,c,1-a),stack.reduce((back,c)=>blend(back,c,a),RGB.white));
function fixture(stack,options={}){
 const cut=options.integer?240:241,shape=options.crisp?' shape-rendering="crispEdges"':'';
 const paint=stack.map(c=>`<rect width="240" height="240" fill="rgb(${c})"/>`).join('');
 const effect=options.opacity?' opacity=".999"':options.isolate?' style="isolation:isolate"':options.filter?' filter="url(#identity)"':'';
 const filters=options.filter?'<filter id="identity" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter>':'';
 const defs=options.union?`<clipPath id="union"><path d="M0 0H${cut}L0 ${cut}Z M${cut} 0V${cut}H0Z"/></clipPath>`:
  `<clipPath id="a"><path${shape} d="M0 0H${cut}L0 ${cut}Z"/></clipPath><clipPath id="b"><path${shape} d="M${cut} 0V${cut}H0Z"/></clipPath>`;
 const groups=options.solid?paint:options.union?`<g clip-path="url(#union)">${paint}</g>`:
  `<g clip-path="url(#a)"${effect}>${paint}</g>`+(options.oneSide?'':`<g clip-path="url(#b)"${effect}>${paint}</g>`);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><defs>${defs}${filters}</defs><rect width="240" height="240" fill="white"/>${groups}</svg>`;
}
(async()=>{
 const browser=await playwright[BROWSER].launch({headless:true}),stages=[],cases=[],errors=[];
 let probe=null;
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1100},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.env.MADWEAVE_URL||'http://127.0.0.1:8766/editor.html');
  const frame=page.frameLocator('#weave'),svg=frame.locator('#svg');await frame.locator('#cbuttonSC2').waitFor();
  await frame.locator('#cbuttonSC2').dispatchEvent('mousedown');await frame.locator('#cbuttonSep1').dispatchEvent('mousedown');
  const setup=await svg.evaluate(root=>{
   const w=root.ownerDocument.defaultView,p=w.stripWidth+w.stripSpacing;
   if(w.starMadWeaveCenter||w.alternate||w.hand||w.colorPattern!==0||w.colorCount!==3)throw Error('Unexpected source fixture');
   root.setAttribute('viewBox',[-p,-p,2*p,2*p].join(' '));
   const matrix=root.getScreenCTM(),bounds=root.getBoundingClientRect(),point=new DOMPoint(Math.sqrt(3)/2*p,0).matrixTransform(matrix);
   return {pitch:p,point:[point.x-bounds.left,point.y-bounds.top],keep:[1,2].map((d,i)=>'P'+w.name(w.stripsPerDirection,d*w.stripsPerDirection+(i?3:2)))};
  });
  const baseline=PNG.sync.read(await svg.screenshot({path:OUT+'/00-original.png'}));
  const pixels=[];
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
   const p=[Math.round(setup.point[0])+dx,Math.round(setup.point[1])+dy];pixels.push({pixel:p,color:at(baseline,p)});
  }
  pixels.sort((a,b)=>dist(b.color,RGB.top)-dist(a.color,RGB.top));probe=pixels[0];
  assert(dist(probe.color,RGB.top)>10,'The source seam was not resolved');
  async function capture(name,match=true){
   const png=PNG.sync.read(await svg.screenshot({path:OUT+'/'+name+'.png'}));
   const observed=at(png,probe.pixel),counts=await svg.evaluate(root=>({paths:root.querySelectorAll('path').length,rectangles:root.querySelectorAll('rect').length,clips:root.querySelectorAll('clipPath').length,uses:root.querySelectorAll('use').length}));
   const raw=await svg.evaluate(root=>new XMLSerializer().serializeToString(root));fs.writeFileSync(OUT+'/'+name+'.svg',raw);
   if(match)assert(dist(observed,probe.color)<2,'Reduction changed seam pixel at '+name+': '+observed+' != '+probe.color);
   stages.push({name,observed,...counts});
  }
  await capture('00-original');
  await svg.evaluate(root=>{
   for(const node of [...root.children])if(!['defs','strips'].includes(node.id))node.remove();
   for(const node of [root,...root.querySelectorAll('*')])for(const attr of [...node.attributes])if(attr.name.startsWith('on'))node.removeAttribute(attr.name);
   root.setAttribute('width',root.getBoundingClientRect().width);root.setAttribute('height',root.getBoundingClientRect().height);
  });
  await capture('01-isolated-svg');
  await svg.evaluate((root,keep)=>{
   const doc=root.ownerDocument;
   for(const path of [...root.querySelectorAll('path[mwColorIndex]')])if(!keep.includes(path.id))path.parentElement.remove();
   for(const use of [...root.querySelectorAll('#strips use')]){
    const target=doc.getElementById(use.getAttributeNS('http://www.w3.org/1999/xlink','href').slice(1));
    if(!target.querySelector('path'))use.remove();
   }
  },setup.keep);
  await capture('02-two-physical-strips');
  const masks=await svg.evaluate(root=>[...root.querySelectorAll('clipPath path')].map(p=>({id:p.id,raw:p.getAttribute('d')})));
  const selected=[];
  const point=[Math.sqrt(3)/2,0];
  for(const mask of masks){
   const parts=mask.raw.trim().split(/\s+/);
   for(let i=0;i<parts.length;i+=10){
    const raw=parts.slice(i,i+10).join(' '),poly=g.triangles(raw)[0];
    const crosses=poly.map((a,j)=>{const b=poly[(j+1)%3];return (b[0]-a[0])*(point[1]-a[1])-(b[1]-a[1])*(point[0]-a[0]);});
    if(crosses.every(v=>v>=-1e-7)||crosses.every(v=>v<=1e-7))selected.push({id:mask.id,raw,above:g.centroid(poly)[1]<0});
   }
  }
  assert.equal(selected.length,2,'Expected two triangles sharing the selected edge');
  await svg.evaluate((root,selected)=>{
   const ids=new Set(selected.map(p=>p.id));
   for(const mask of [...root.querySelectorAll('clipPath')])if(!ids.has(mask.firstElementChild?.id))mask.remove();
   for(const group of [...root.querySelector('#strips').children])if(!selected.some(p=>group.getAttribute('clip-path')==='url(#'+p.id.replace('_path','')+')'))group.remove();
   for(const item of selected)root.ownerDocument.getElementById(item.id).setAttribute('d',item.raw);
   for(const node of [...root.querySelector('#defs').children])if(node.tagName!=='clipPath'&&!['RStrips','LStrips'].includes(node.id))node.remove();
  },selected);
  await capture('03a-two-triangles-tight-bounds',false);
  await svg.evaluate((root,selected)=>{
   for(const item of selected)root.ownerDocument.getElementById(item.id).setAttribute('d',item.raw+' M -100 -100 L -99 -100 L -100 -99 Z M -100 100 L -99 100 L -100 99 Z');
  },selected);
  await capture('03b-two-triangles-with-offscreen-bounds');
  await svg.evaluate(root=>{
   for(const group of root.querySelector('#strips').children)for(const use of [...group.children]){
    const source=root.ownerDocument.getElementById(use.getAttributeNS('http://www.w3.org/1999/xlink','href').slice(1));
    const clone=source.querySelector('path').cloneNode(true);clone.removeAttribute('id');group.replaceChild(clone,use);
   }
   for(const node of [...root.querySelector('#defs').children])if(node.tagName!=='clipPath')node.remove();
  });
  await capture('04-four-inline-paths');
  await svg.evaluate(root=>{
   for(const group of root.querySelector('#strips').children)for(const p of [...group.children]){
    const rect=root.ownerDocument.createElementNS('http://www.w3.org/2000/svg','rect');
    for(const [key,value] of Object.entries({x:-10,y:-10,width:20,height:20,fill:p.getAttribute('fill')}))rect.setAttribute(key,value);
    group.replaceChild(rect,p);
   }
  });
  await capture('05-four-rectangles');
  await svg.evaluate((root,selected)=>{
   for(const item of selected)root.ownerDocument.getElementById(item.id).setAttribute('d',item.above?'M -100 -100 H 100 V 0 H -100 Z M -100 100 L -99 100 L -100 99 Z':'M -100 0 H 100 V 100 H -100 Z M -100 -100 L -99 -100 L -100 -99 Z');
  },selected);
  await capture('06-two-halfplane-clips');
  const fits=Array.from({length:2001},(_,i)=>{
   const alpha=i/2000,expected=predict([RGB.bottom,RGB.top],alpha);
   return {alpha,expected,error:dist(expected,probe.color)};
  }).sort((a,b)=>a.error-b.error);
  probe.model=fits[0];
  assert(probe.model.error<3,'Real seam does not match complementary clip coverage and source-over paints');

  const variants=[
   {name:'repository-minimal',stack:[RGB.bottom,RGB.top],raw:fs.readFileSync(require('node:path').join(__dirname,'fixtures','clip-seam-minimal.svg'),'utf8'),expected:predict([RGB.bottom,RGB.top])},
   {name:'solid',stack:[RGB.top],options:{solid:true},expected:RGB.top},
   {name:'single-clipped-stack',stack:[RGB.bottom,RGB.top],options:{oneSide:true},expected:[RGB.bottom,RGB.top].reduce((c,paint)=>blend(c,paint,.5),RGB.white)},
   {name:'single-filtered-stack',stack:[RGB.bottom,RGB.top],options:{oneSide:true,filter:true},expected:blend(RGB.white,RGB.top,.5)},
   {name:'one-paint-per-half',stack:[RGB.top],expected:predict([RGB.top])},
   {name:'two-paints-per-half',stack:[RGB.bottom,RGB.top],expected:predict([RGB.bottom,RGB.top])},
   ...[1,2,3].map(n=>({name:'neutral-'+n+'-paints-per-half',stack:Array(n).fill(RGB.neutral),expected:predict(Array(n).fill(RGB.neutral))})),
   {name:'shifted-diagonal',stack:[RGB.bottom,RGB.top],options:{integer:true},expected:RGB.top},
   {name:'one-union-clip',stack:[RGB.bottom,RGB.top],options:{union:true},expected:RGB.top},
   ...['crisp','opacity','isolate','filter'].map(key=>({name:'variant-'+key,stack:[RGB.bottom,RGB.top],options:{[key]:true}})),
  ];
  for(const item of variants){
   const raw=item.raw||fixture(item.stack,item.options);fs.writeFileSync(OUT+'/'+item.name+'.svg',raw);
   await page.setContent('<body style="margin:0">'+raw+'</body>');
   const element=page.locator('svg'),png=PNG.sync.read(await element.screenshot({path:OUT+'/'+item.name+'.png'}));
   const observed=at(png,[120,120]);
   if(item.expected)assert(dist(observed,item.expected)<3,item.name+' does not match its alpha prediction: '+observed+' vs '+item.expected);
   assert(dist(at(png,[120,115]),RGB.top)<2||item.stack.at(-1)===RGB.neutral||item.options?.opacity);
   let maxInteriorDistance=null;
   if(item.name==='solid'||item.name==='one-union-clip'){
    maxInteriorDistance=0;
    for(let y=10;y<230;y++)for(let x=10;x<230;x++)maxInteriorDistance=Math.max(maxInteriorDistance,dist(at(png,[x,y]),RGB.top));
    assert(maxInteriorDistance<1,'Union control contains an interior seam');
   }
   cases.push({name:item.name,observed,northPixel:at(png,[120,119]),maxInteriorDistance,expected:item.expected??null});
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({browser:BROWSER,version:browser.version(),probe,stages,cases},null,2));
 }finally{
  fs.writeFileSync(OUT+'/results.json',JSON.stringify({browser:{name:BROWSER,version:browser.version(),playwright:require('playwright/package.json').version},probe,stages,cases,errors},null,2)+'\n');await browser.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
