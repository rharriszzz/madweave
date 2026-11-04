#!/usr/bin/env node
// Triple-centerline overlap audit of the original SVG editor (baseSize=3).
// Uses the original isCoveredBy predicate and actual Chromium pixels.
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const OUT='research/output/triple-crossings';
fs.mkdirSync(OUT,{recursive:true});
const rgb=s=>{const m=/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(s);assert(m,s);return m.slice(1).map(Number);};
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
function pixel(png,x,y){
 const xi=Math.round(x),yi=Math.round(y),v=[0,0,0];
 assert(xi>=2&&yi>=2&&xi<png.width-2&&yi<png.height-2,'Out of bounds');
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  const i=((yi+dy)*png.width+xi+dx)*4;
  for(let c=0;c<3;c++)v[c]+=png.data[i+c]/9;
 }
 return v.map(Math.round);
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1100},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8766/editor.html');
  const frame=page.frameLocator('#weave');
  await frame.locator('#cbuttonSC3').waitFor();
  await frame.locator('#cbuttonSC3').dispatchEvent('mousedown');
  const all=[];
  for(const star of [false,true]){
   if(star)await frame.locator('#cbuttonC').dispatchEvent('mousedown');
   const svg=frame.locator('#svg');
   const data=await svg.evaluate((el,star)=>{
    const w=el.ownerDocument.defaultView;
    if(w.baseSize!==3||w.stripsPerDirection!==9||w.coneFraction!==1||w.transformInPath||w.numberOfDirections!==3)throw Error('Unexpected geometry');
    if(w.starMadWeaveCenter!==star||w.alternate||w.hand)throw Error('Unexpected switches');
    if(w.showC.some(v=>!v)||w.showD.some(v=>!v))throw Error('Hidden strips');
    const n=9,pitch=w.stripWidth+w.stripSpacing,offset=4;
    const normals=[0,1,2].map(d=>[-Math.sin(2*Math.PI*d/3),Math.cos(2*Math.PI*d/3)]);
    const rows=[];
    for(let h=0;h<n;h++)for(let r=0;r<n;r++){
     const l=12-h-r;
     if(l<0||l>=n)continue;
     const [a,b]=normals[0],[c,d]=normals[1],det=a*d-b*c;
     const u=(h-offset)*pitch,v=(r-offset)*pitch;
     const x=(u*d-b*v)/det,y=(a*v-u*c)/det;
     if(Math.abs(x)>3.25||Math.abs(y)>3.25)continue;
     const indices=[h,r,l];
     const above=indices.map((s,i)=>indices.reduce((n,t,j)=>n+(i!==j&&w.isCoveredBy(s,i,t,j)?1:0),0));
     const winners=above.map((n,i)=>n===2?i:-1).filter(i=>i>=0);
     const p=el.createSVGPoint();p.x=x;p.y=y;
     const q=p.matrixTransform(el.getScreenCTM()),bounds=el.getBoundingClientRect();
     rows.push({h,r,l,x,y,px:q.x-bounds.left,py:q.y-bounds.top,above,
      predicted:winners.length===1?'HRL'[winners[0]]:null,
      colors:w.colorArray.slice(0,3),radius:Math.hypot(x,y)});
    }
    rows.sort((a,b)=>a.radius-b.radius);
    return {star,rows:rows.slice(0,24),total:rows.length};
   },star);
   assert(data.rows.length>=8,'Insufficient triple-overlap candidates');
   const name=star?'shifted':'ordinary';
   const png=PNG.sync.read(await svg.screenshot({path:`${OUT}/${name}-unmarked.png`}));
   const rows=data.rows.map((r,i)=>{
    const observed=pixel(png,r.px,r.py);
    const distances=r.colors.map(c=>distance(observed,rgb(c)));
    const closest=distances.indexOf(Math.min(...distances));
    const observedDirection='HRL'[closest];
    const margin=[...distances].sort((a,b)=>a-b)[1]-distances[closest];
    const pass=r.predicted!==null&&observedDirection===r.predicted&&distances[closest]<=22&&margin>=20;
    return {...r,number:i+1,observed,distances,observedDirection,margin,pass};
   });
   all.push({star,totalCandidates:data.total,rows,passes:rows.filter(r=>r.pass).length,
    ambiguous:rows.filter(r=>r.predicted===null).length});
   await svg.evaluate((root,rows)=>{
    const ns='http://www.w3.org/2000/svg',g=document.createElementNS(ns,'g');
    g.id='tripleAuditAnnotations';g.setAttribute('pointer-events','none');
    for(const r of rows){
     const c=document.createElementNS(ns,'circle');
     for(const [k,v] of Object.entries({cx:r.x,cy:r.y,r:'.12',fill:'white',stroke:r.pass?'green':'red','stroke-width':'.05'}))c.setAttribute(k,v);
     g.appendChild(c);
     const t=document.createElementNS(ns,'text');
     for(const [k,v] of Object.entries({x:r.x+.14,y:r.y-.12,'font-size':'.2',fill:'black'}))t.setAttribute(k,v);
     t.textContent=String(r.number);g.appendChild(t);
    }
    root.appendChild(g);
   },rows);
   await svg.screenshot({path:`${OUT}/${name}-annotated.png`});
   await svg.evaluate(()=>document.querySelector('#tripleAuditAnnotations')?.remove());
  }
  const report={source:'original editor.html and madweave.svg',method:'three pairwise isCoveredBy comparisons versus center 3x3 PNG mean',errors,results:all};
  fs.writeFileSync(`${OUT}/triple-results.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify({errors,results:all.map(x=>({star:x.star,candidates:x.totalCandidates,sampled:x.rows.length,passes:x.passes,ambiguous:x.ambiguous,failures:x.rows.filter(r=>!r.pass).map(r=>({h:r.h,r:r.r,l:r.l,above:r.above,predicted:r.predicted,observed:r.observedDirection,distances:r.distances}))}))},null,2));
  assert.deepEqual(errors,[]);
  assert(all.every(x=>x.rows.length===x.passes),'Triple crossing mismatch; inspect JSON and screenshots');
  console.log('PASS: all sampled three-strip overlaps match original pairwise covering relation');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
