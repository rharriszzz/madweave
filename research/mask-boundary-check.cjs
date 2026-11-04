#!/usr/bin/env node
// Sample both sides of SVG clip-mask boundaries in the original MadWeave editor.
// Boundary pixels themselves are deliberately classified separately as antialiasing zones.
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const OUT='research/output/mask-boundaries';
fs.mkdirSync(OUT,{recursive:true});
const rgb=s=>{const m=/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(s);assert(m,s);return m.slice(1).map(Number);};
const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
function sample(p,x,y){const xi=Math.round(x),yi=Math.round(y),v=[0,0,0];if(xi<2||yi<2||xi>=p.width-2||yi>=p.height-2)return null;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const i=((yi+dy)*p.width+xi+dx)*4;for(let c=0;c<3;c++)v[c]+=p.data[i+c]/9;}return v;}
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
  for(let configuration=0;configuration<8;configuration++){
   const star=Boolean(configuration&1),alternate=Boolean(configuration&2),hand=Boolean(configuration&4);
   if(configuration){const prev=configuration-1;
    if(Boolean(prev&1)!==star)await frame.locator('#cbuttonC').dispatchEvent('mousedown');
    if(Boolean(prev&2)!==alternate)await frame.locator('#cbuttonX').dispatchEvent('mousedown');
    if(Boolean(prev&4)!==hand)await frame.locator('#cbutton-').dispatchEvent('mousedown');
   }
   const svg=frame.locator('#svg');
   const data=await svg.evaluate((root,settings)=>{
    const w=root.ownerDocument.defaultView;
    if(w.baseSize!==3||w.stripsPerDirection!==9||w.coneFraction!==1||w.transformInPath||w.numberOfDirections!==3)throw Error('Not planar');
    if(w.starMadWeaveCenter!==settings.star||w.alternate!==settings.alternate||w.hand!==settings.hand)throw Error('Wrong orientation');
    if(w.showC.some(v=>!v)||w.showD.some(v=>!v))throw Error('Hidden strips');
    const masks=w.pname.map((name,i)=>({name,i,path:root.ownerDocument.getElementById(name+'ClipPath_path')})).filter(m=>m.path);
    const pitch=w.stripWidth+w.stripSpacing,offset=Math.floor(w.stripsPerDirection/2)-.5;
    const normals=[0,1,2].map(d=>[-Math.sin(d*2*Math.PI/3),Math.cos(d*2*Math.PI/3)]);
    const bounds=root.getBoundingClientRect(),ctm=root.getScreenCTM();
    const step=.045,grid=new Map(),rows=[];
    function inspect(ix,iy){
     const x=ix*step+.013,y=iy*step+.021,key=ix+','+iy;
     if(grid.has(key))return grid.get(key);
     const strips=normals.map(([nx,ny])=>{const v=(nx*x+ny*y)/pitch+offset,s=Math.round(v);return {s,clearance:w.stripWidth/2-Math.abs(v-s)*pitch};});
     if(strips.some(q=>q.s<0||q.s>=9||q.clearance<.19)){grid.set(key,null);return null;}
     const active=[];
     for(const m of masks){const matrix=m.path.getCTM().inverse().multiply(root.getCTM());const q=new DOMPoint(x,y).matrixTransform(matrix);if(m.path.isPointInFill(q))active.push(m);}
     if(active.length!==1){grid.set(key,null);return null;}
     const m=active[0],q=new DOMPoint(x,y).matrixTransform(ctm),px=q.x-bounds.left,py=q.y-bounds.top;
     if(px<8||py<8||px>bounds.width-8||py>bounds.height-8){grid.set(key,null);return null;}
     const v={x,y,px,py,mask:m.name,top:'HRL'[w.ppn[m.i][0]],strips:strips.map(q=>q.s)};
     grid.set(key,v);return v;
    }
    // Identify neighboring mask cells; retain pairs with different predicted top colors.
    for(let iy=-90;iy<=90;iy++)for(let ix=-90;ix<=90;ix++){
     const a=inspect(ix,iy);if(!a)continue;
     for(const [dx,dy] of [[1,0],[0,1]]){
      const b=inspect(ix+dx,iy+dy);
      if(!b||a.mask===b.mask||a.top===b.top)continue;
      // Probe 3 cells further inside each region, away from the shared mask boundary.
      const left=inspect(ix-3*dx,iy-3*dy),right=inspect(ix+4*dx,iy+4*dy);
      if(!left||!right||left.mask!==a.mask||right.mask!==b.mask)continue;
      if(left.top===right.top)continue;
      rows.push({left,right,edgeA:a,edgeB:b,transition:a.mask+'>'+b.mask,axis:dx?'x':'y'});
     }
    }
    // Balanced selection by transition type, avoiding one mask boundary dominating.
    const groups=new Map();
    for(const r of rows){const k=r.transition+':'+r.axis;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
    const selected=[];
    for(const [k,group] of groups){const stride=Math.max(1,Math.floor(group.length/12));selected.push(...group.filter((_,i)=>i%stride===0).slice(0,12));}
    return {candidatePairs:rows.length,byTransition:Object.fromEntries([...groups].map(([k,v])=>[k,v.length])),selected:selected.slice(0,144),colors:w.colorArray.slice(0,3)};
   },{star,alternate,hand});
   const name='C'+Number(star)+'-X'+Number(alternate)+'-H'+Number(hand);
   const png=PNG.sync.read(await svg.screenshot({path:OUT+'/'+name+'-unmarked.png'}));
   const rows=data.selected.map((r,i)=>{
    const check=side=>{const observed=sample(png,side.px,side.py),expected=rgb(data.colors['HRL'.indexOf(side.top)]),others=data.colors.map(rgb).filter((_,j)=>j!=='HRL'.indexOf(side.top));const d=observed?dist(observed,expected):Infinity;const margin=observed?Math.min(...others.map(c=>dist(observed,c)))-d:-Infinity;return {...side,observed,distance:d,margin,pass:d<=28&&margin>=15};};
    return {number:i+1,transition:r.transition,axis:r.axis,left:check(r.left),right:check(r.right),pass:false};
   });
   for(const r of rows)r.pass=r.left.pass&&r.right.pass;
   const summary={star,alternate,hand,candidatePairs:data.candidatePairs,byTransition:data.byTransition,selectedPairs:rows.length,passed:rows.filter(r=>r.pass).length,failed:rows.filter(r=>!r.pass).length};
   all.push({summary,rows});
   await svg.evaluate((root,rows)=>{
    const ns='http://www.w3.org/2000/svg',g=document.createElementNS(ns,'g');g.id='maskBoundaryAnnotations';g.setAttribute('pointer-events','none');
    for(const r of rows)for(const side of [r.left,r.right]){const c=document.createElementNS(ns,'circle');for(const [k,v] of Object.entries({cx:side.x,cy:side.y,r:'.055',fill:side.pass?'green':'red'}))c.setAttribute(k,v);g.appendChild(c);}
    root.appendChild(g);
   },rows);
   await svg.screenshot({path:OUT+'/'+name+'-annotated.png'});
   await svg.evaluate(()=>document.getElementById('maskBoundaryAnnotations')?.remove());
  }
  fs.writeFileSync(OUT+'/results.json',JSON.stringify({errors,all},null,2));
  console.log(JSON.stringify({errors,summaries:all.map(r=>r.summary),failures:all.flatMap(r=>r.rows.filter(x=>!x.pass)).slice(0,10)},null,2));
  assert.deepEqual(errors,[]);
  assert(all.length===8);
  assert(all.every(r=>r.summary.selectedPairs>0),'No mask transitions sampled');
  assert(all.every(r=>r.summary.failed===0),'Mask boundary side mismatch; inspect artifact');
  console.log('PASS: sampled interior points on both sides of mask transitions match painter order');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
