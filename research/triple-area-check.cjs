#!/usr/bin/env node
// Pixel-level validation of genuine three-strip AREA overlaps in original SVG.
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const OUT='research/output/triple-area';
fs.mkdirSync(OUT,{recursive:true});
function rgb(s){const m=/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(s);assert(m,s);return m.slice(1).map(Number);}
function dist(a,b){return Math.hypot(...a.map((v,i)=>v-b[i]));}
function sample(p,x,y){
 const xi=Math.round(x),yi=Math.round(y),v=[0,0,0];
 if(xi<2||yi<2||xi>=p.width-2||yi>=p.height-2)return null;
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  const i=((yi+dy)*p.width+xi+dx)*4;
  for(let c=0;c<3;c++)v[c]+=p.data[i+c]/9;
 }
 return v;
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1100},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.MADWEAVE_URL || 'http://127.0.0.1:8766/editor.html');
  const frame=page.frameLocator('#weave');
  await frame.locator('#cbuttonSC3').waitFor();
  await frame.locator('#cbuttonSC3').dispatchEvent('mousedown');
  const results=[];
  for(let configuration=0;configuration<8;configuration++){
   const star=Boolean(configuration&1),alternate=Boolean(configuration&2),hand=Boolean(configuration&4);
   if(configuration>0){
    const previous=configuration-1;
    if(Boolean(previous&1)!==star)await frame.locator('#cbuttonC').dispatchEvent('mousedown');
    if(Boolean(previous&2)!==alternate)await frame.locator('#cbuttonX').dispatchEvent('mousedown');
    if(Boolean(previous&4)!==hand)await frame.locator('#cbutton-').dispatchEvent('mousedown');
   }
   const svg=frame.locator('#svg');
   const data=await svg.evaluate((root,settings)=>{
    const w=root.ownerDocument.defaultView;
    if(w.baseSize!==3||w.stripsPerDirection!==9||w.coneFraction!==1||w.transformInPath||w.numberOfDirections!==3||w.starMadWeaveCenter!==settings.star)throw Error('Unexpected configuration');
    if(w.showC.some(v=>!v)||w.showD.some(v=>!v)||w.alternate!==settings.alternate||w.hand!==settings.hand)throw Error('Unexpected visibility/orientation');
    const pitch=w.stripWidth+w.stripSpacing,offset=Math.floor(w.stripsPerDirection/2)-.5;
    const normals=[0,1,2].map(d=>[-Math.sin(d*2*Math.PI/3),Math.cos(d*2*Math.PI/3)]);
    const masks=w.pname.map((name,i)=>({name,i,path:root.ownerDocument.getElementById(name+'ClipPath_path')}));
    const bounds=root.getBoundingClientRect(),screenCTM=root.getScreenCTM();
    const rows=[],counts={candidate:0,maskAmbiguous:0,edgeRejected:0};
    // Sampling grid is offset to avoid accidentally hitting symmetry/boundary lines.
    for(let iy=-55;iy<=55;iy++)for(let ix=-55;ix<=55;ix++){
     const x=ix*.075+.019,y=iy*.075+.027;
     const strips=normals.map(([nx,ny],d)=>{
      const v=(nx*x+ny*y)/pitch+offset,s=Math.round(v);
      return {d,s,clearance:w.stripWidth/2-Math.abs(v-s)*pitch};
     });
     if(strips.some(q=>q.s<0||q.s>=9||q.clearance<.14))continue;
     counts.candidate++;
     const active=[];
     for(const m of masks){
      if(!m.path)continue;
      // Convert SVG-root user coordinates to this mask path's own local coordinates.
      const matrix=m.path.getCTM().inverse().multiply(root.getCTM());
      const local=new DOMPoint(x,y).matrixTransform(matrix);
      if(m.path.isPointInFill(local))active.push(m);
     }
     if(active.length!==1){counts.maskAmbiguous++;continue;}
     const m=active[0],top=w.ppn[m.i][0];
     const screen=new DOMPoint(x,y).matrixTransform(screenCTM);
     const px=screen.x-bounds.left,py=screen.y-bounds.top;
     if(px<4||py<4||px>bounds.width-4||py>bounds.height-4)continue;
     rows.push({x,y,px,py,mask:m.name,top:'HRL'[top],colors:w.colorArray.slice(0,3),
       strips:strips.map(q=>q.s),clearances:strips.map(q=>q.clearance)});
    }
    // Spatially distributed deterministic subset, not only central pixels.
    const chosen=[];
    for(let i=0;i<rows.length;i+=Math.max(1,Math.floor(rows.length/120)))chosen.push(rows[i]);
    return {counts,eligible:rows.length,rows:chosen.slice(0,160)};
   },{star,alternate,hand});
   assert(data.rows.length>=12,'Not enough interior three-strip area samples');
   const name=`C${+star}-X${+alternate}-H${+hand}`;
   const png=PNG.sync.read(await svg.screenshot({path:`${OUT}/${name}-unmarked.png`}));
   const rows=data.rows.map((r,i)=>{
    const observed=sample(png,r.px,r.py),expected=rgb(r.colors['HRL'.indexOf(r.top)]);
    const alternatives=r.colors.map(rgb);
    const d=observed?dist(observed,expected):Infinity;
    const other=Math.min(...alternatives.filter((_,j)=>j!=='HRL'.indexOf(r.top)).map(c=>observed?dist(observed,c):Infinity));
    return {...r,number:i+1,observed,expected,distance:d,otherDistance:other,pass:d<=28&&d+15<other};
   });
   const summary={star,alternate,hand,candidates:data.counts.candidate,maskAmbiguous:data.counts.maskAmbiguous,eligible:data.eligible,sampled:rows.length,passed:rows.filter(r=>r.pass).length,failed:rows.filter(r=>!r.pass).length,byMask:Object.fromEntries([...new Set(rows.map(r=>r.mask))].map(m=>[m,rows.filter(r=>r.mask===m).length]))};
   results.push({summary,rows});
   await svg.evaluate((root,rows)=>{
    const ns='http://www.w3.org/2000/svg',g=document.createElementNS(ns,'g');
    g.setAttribute('id','tripleAreaAnnotations');g.setAttribute('pointer-events','none');
    for(const r of rows){
     const c=document.createElementNS(ns,'circle');
     for(const [k,v] of Object.entries({cx:r.x,cy:r.y,r:'.055',fill:r.pass?'#007f38':'#d21b1b'}))c.setAttribute(k,v);
     g.appendChild(c);
    }
    root.appendChild(g);
   },rows);
   await svg.screenshot({path:`${OUT}/${name}-annotated.png`});
   await svg.evaluate(()=>document.getElementById('tripleAreaAnnotations')?.remove());
  }
  fs.writeFileSync(`${OUT}/results.json`,JSON.stringify({errors,results},null,2));
  console.log(JSON.stringify({errors,summaries:results.map(r=>r.summary),failures:results.flatMap(r=>r.rows.filter(x=>!x.pass)).slice(0,12)},null,2));
  assert.deepEqual(errors,[]);
  assert(results.length===8,'Missing orientation configurations');
  assert(results.every(r=>r.summary.failed===0),'Triple-area pixel mismatch; inspect artifacts');
  console.log('PASS: three-strip area overlap pixels match SVG mask painter order');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
