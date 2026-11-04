#!/usr/bin/env node
// Independent two-sided mask and finite-end pixels; exact seam pixels measured separately.
const playwright=require('playwright'),{PNG}=require('pngjs'),g=require('./planar-geometry.cjs');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const engine=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'..','madweave.js'),'utf8'),engine);
const SEAM_ONLY=process.argv.includes('--seam-only');
const BROWSER=process.env.MADWEAVE_RESEARCH_BROWSER||'chromium';
assert(['chromium','firefox','webkit'].includes(BROWSER),'Unknown research browser');
const OUT='research/output/boundary-matrix'+(SEAM_ONLY?'/seam-only/'+BROWSER:'');fs.mkdirSync(OUT,{recursive:true});
const rgb=s=>s.match(/\d+/g).map(Number),dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const apply=(p,m)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
function pixel(png,p){const x=Math.round(p[0]),y=Math.round(p[1]),c=[0,0,0];assert(x>1&&y>1&&x<png.width-2&&y<png.height-2);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let k=0;k<3;k++)c[k]+=png.data[((y+a)*png.width+x+b)*4+k]/9;return c;}
function edgeDistance(poly,p){return Math.min(...poly.map((a,i)=>{const b=poly[(i+1)%poly.length];return Math.abs((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))/Math.hypot(b[0]-a[0],b[1]-a[1]);}));}
function prediction(m,p){
 const present=g.occupancy(m,p),indices=g.normals.map(n=>Math.round(g.dot(n,p)+m.offset));
 const order=g.order(engine,indices),top=order.find(d=>present.some(s=>s.d===d));
 return {point:p,present,indices,mask:order.map(d=>'HRL'[d]).join(''),top:top===undefined?3:top};
}
function boundaries(m){
 const edges=new Map();
 for(const cell of g.visibleCells(m))for(let i=0;i<cell.poly.length;i++){
  const a=cell.poly[i],b=cell.poly[(i+1)%cell.poly.length];
  const key=[a,b].map(p=>p.map(v=>Math.round(v*1e7)).join(',')).sort().join(':');
  if(!edges.has(key))edges.set(key,{a,b,cells:[]});edges.get(key).cells.push(cell.indices);
 }
 return [...edges.values()].filter(e=>e.cells.length===2);
}
(async()=>{
 const browser=await playwright[BROWSER].launch({headless:true}),results=[],errors=[];let neutral=null,svgGeometry=null;
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1100},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.env.MADWEAVE_URL||'http://127.0.0.1:8766/editor.html');
  const frame=page.frameLocator('#weave'),svg=frame.locator('#svg');await frame.locator('#cbuttonSC1').waitFor();
  let previous=0;
  async function configure(configuration){
   for(const [bit,button] of [[1,'C'],[2,'X'],[4,'-']])if((previous&bit)!==(configuration&bit))await frame.locator('[id="cbutton'+button+'"]').dispatchEvent('mousedown');
   previous=configuration;
   Object.assign(engine,{starMadWeaveCenter:!!(configuration&1),alternate:!!(configuration&2),hand:!!(configuration&4)});
  }
  async function zoom(m,center){return svg.evaluate((root,{pitch,center})=>{
   root.setAttribute('viewBox',[(center[0]-1)*pitch,(center[1]-1)*pitch,2*pitch,2*pitch].join(' '));
   const a=root.getScreenCTM(),b=root.getBoundingClientRect();
   return {matrix:[a.a,a.b,a.c,a.d,a.e-b.left,a.f-b.top],scale:Math.min(Math.hypot(a.a,a.b),Math.hypot(a.c,a.d))*pitch};
  },{pitch:m.pitch,center});}
  function candidates(m,edges,center,screen){
   const inside=p=>Math.abs(p[0]-center[0])<.96&&Math.abs(p[1]-center[1])<.96;
   const safe=p=>inside(p)&&g.clearance(m,p)*screen.scale>=3&&edgeDistance(g.cell(g.normals.map(n=>Math.round(g.dot(n,p)+m.offset)),m.offset),p)*screen.scale>=3;
   const delta=Math.min(.08,(1-m.width)/4),groups=new Map();
   for(const {a,b} of edges){
    const length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=[-(b[1]-a[1])/length,(b[0]-a[0])/length];
    for(const t of [.25,.5,.75]){
     const p=a.map((v,i)=>v+t*(b[i]-v)),l=p.map((v,i)=>v-n[i]*delta),r=p.map((v,i)=>v+n[i]*delta);
     if(!safe(l)||!safe(r))continue;
     const left=prediction(m,l),right=prediction(m,r);
     if(left.mask===right.mask||!left.present.length||!right.present.length)continue;
     const key=left.mask+'>'+right.mask;
     if(!groups.has(key))groups.set(key,[]);
     groups.get(key).push({kind:'mask',center:p,left,right,transition:key});
    }
   }
   const rows=[...groups.values()].flatMap(a=>a.slice(0,2));
   return {rows,types:groups.size,safe};
  }
  for(const size of (SEAM_ONLY?[]:[1,2,3,8])){
   await frame.locator('#cbuttonSC'+size).dispatchEvent('mousedown');
   for(let spacing=0;spacing<4;spacing++){
    await frame.locator('#cbuttonSep'+spacing).dispatchEvent('mousedown');
    const m=g.model(size,[.07,.33,.8,2][spacing]),edges=boundaries(m),s=Math.round(m.offset);
    const patches=[{name:'center',center:[0,0]},...g.normals.map((normal,d)=>({name:'end-'+d,d,center:normal.map((v,i)=>v*(s-m.offset)+g.tangents[d][i]*m.length/2)}))];
    for(let configuration=0;configuration<8;configuration++){
     await configure(configuration);
     const name=`B${size}-S${spacing}-O${configuration}`,oldViewBox=await svg.getAttribute('viewBox');
     const colors=await svg.evaluate(root=>root.ownerDocument.defaultView.colorArray.slice(0,3));const palette=colors.map(rgb).concat([[255,255,255]]);
     const reports=[];
     try{
      for(const patch of patches){
       const screen=await zoom(m,patch.center),chosen=candidates(m,edges,patch.center,screen);
       if(patch.d!==undefined){
        let end=null;
        for(const across of [0,-.25,.25])for(const delta of [.06,.1,.15]){
         const p=patch.center.map((v,i)=>v+g.normals[patch.d][i]*across*m.width);
         const l=p.map((v,i)=>v-g.tangents[patch.d][i]*delta),r=p.map((v,i)=>v+g.tangents[patch.d][i]*delta);
         if(!chosen.safe(l)||!chosen.safe(r))continue;
         const left=prediction(m,l),right=prediction(m,r);
         assert(left.present.some(q=>q.d===patch.d&&q.s===s));assert(!right.present.some(q=>q.d===patch.d&&q.s===s));
         end={kind:'end',center:p,left,right,d:patch.d};break;
        }
        assert(end,'No safely resolved finite end '+name+'/'+patch.name);chosen.rows.push(end);
       }else assert(chosen.rows.length>0,'No central mask transitions '+name);
       const png=PNG.sync.read(await svg.screenshot({path:OUT+'/'+name+'-'+patch.name+'.png'}));
       const check=side=>{
        const observed=pixel(png,apply(side.point.map(v=>v*m.pitch),screen.matrix)),expected=palette[side.top],difference=dist(observed,expected);
        const margin=Math.min(...palette.filter((_,i)=>i!==side.top).map(c=>dist(c,observed)))-difference;
        return {...side,observed,expected,difference,margin,pass:difference<=28&&margin>=15};
       };
       const rows=chosen.rows.map(row=>({...row,left:check(row.left),right:check(row.right)}));
       for(const row of rows)row.pass=row.left.pass&&row.right.pass;
       const failed=rows.filter(r=>!r.pass);
       reports.push({patch:patch.name,center:patch.center,transitionTypes:chosen.types,rows,failed:failed.length});
       assert.equal(failed.length,0,'Boundary/end pixel mismatch '+name+'/'+patch.name+': '+JSON.stringify(failed.slice(0,2)));
      }
     }finally{await svg.evaluate((root,value)=>root.setAttribute('viewBox',value),oldViewBox);results.push({size,spacing,configuration,reports});}
    }
   }
   console.log('PASS mask sides and H/R/L finite ends at size '+size);
  }
  // Quantify seams using the same neutral-colored physical union with/without clips.
  await frame.locator('#cbuttonSC2').dispatchEvent('mousedown');await frame.locator('#cbuttonSep1').dispatchEvent('mousedown');await configure(0);
  const m=g.model(2,.33),screen=await zoom(m,[0,0]),chosen=candidates(m,boundaries(m),[0,0],screen);
  const shade=[40,90,140];
  svgGeometry=await svg.evaluate(root=>[...root.querySelectorAll('path')]
   .filter(p=>p.hasAttribute('mwColorIndex')||p.id.endsWith('ClipPath_path'))
   .map(p=>({id:p.id,path:p.getAttribute('d'),transform:p.getAttribute('transform')})).sort((a,b)=>a.id.localeCompare(b.id)));
  const directionColors=await svg.evaluate(root=>root.ownerDocument.defaultView.colorArray.slice(0,3));
  const colored=PNG.sync.read(await svg.screenshot({path:OUT+'/direction-colored.png'}));
  fs.writeFileSync(OUT+'/direction-colored.svg',await svg.evaluate(root=>new XMLSerializer().serializeToString(root)));
  await svg.evaluate(root=>{for(const p of root.querySelectorAll('path[mwColorIndex]'))p.setAttribute('fill','rgb(40,90,140)');});
  const clipped=PNG.sync.read(await svg.screenshot({path:OUT+'/neutral-clipped.png'}));
  await svg.evaluate(root=>{
   const doc=root.ownerDocument,ns='http://www.w3.org/2000/svg';doc.getElementById('strips').setAttribute('visibility','hidden');
   const group=doc.createElementNS(ns,'g');group.id='researchUnclipped';
   for(const d of ['H','R','L']){const use=doc.createElementNS(ns,'use');use.setAttributeNS('http://www.w3.org/1999/xlink','href','#'+d+'Strips');group.appendChild(use);}root.appendChild(group);
  });
  const unclipped=PNG.sync.read(await svg.screenshot({path:OUT+'/neutral-unclipped.png'}));
  const profiles=chosen.rows.filter(r=>r.left.top===r.right.top).map(row=>{
   const p=apply(row.center.map(v=>v*m.pitch),screen.matrix);
   const direction=row.right.point.map((v,i)=>v-row.left.point[i]),length=Math.hypot(...direction);
   const samples=[];
   for(const t of [-2,-1.5,-1,-.5,0,.5,1,1.5,2]){
    const q=p.map((v,i)=>Math.round(v+t*direction[i]/length));
    const at=png=>Array.from(png.data.subarray((q[1]*png.width+q[0])*4,(q[1]*png.width+q[0])*4+3));
    const a=at(clipped),b=at(unclipped),c=at(colored),expected=rgb(directionColors[row.left.top]);
    samples.push({pixel:q,colored:c,expected,clipped:a,unclipped:b,coloredDistance:dist(c,expected),clippedDistance:dist(a,shade),unclippedDistance:dist(b,shade)});
   }
   return {point:row.center,top:row.left.top,samples};
  });
  const all=profiles.flatMap(p=>p.samples);
  neutral={imageSize:[colored.width,colored.height],shade,profiles,maxColoredDistance:Math.max(...all.map(p=>p.coloredDistance)),maxClippedDistance:Math.max(...all.map(p=>p.clippedDistance)),maxUnclippedDistance:Math.max(...all.map(p=>p.unclippedDistance))};
  assert(profiles.length>0);assert(all.every(p=>p.unclippedDistance<3),'Unclipped union should be solid at seam probes');
  // Exact-edge pixels are a measured compositing zone; do not force a defect
  // into the neutral control merely because colored strips show a fine line.
  assert.equal(results.length,SEAM_ONLY?0:128);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({seamOnly:SEAM_ONLY,configurations:results.length,patches:results.reduce((s,r)=>s+r.reports.length,0),pairs:results.reduce((s,r)=>s+r.reports.reduce((t,p)=>t+p.rows.length,0),0),finiteEndPairs:results.reduce((s,r)=>s+r.reports.reduce((t,p)=>t+p.rows.filter(r=>r.kind==='end').length,0),0),neutral:{maxColoredDistance:neutral.maxColoredDistance,maxClippedDistance:neutral.maxClippedDistance,maxUnclippedDistance:neutral.maxUnclippedDistance}},null,2));
 }finally{fs.writeFileSync(OUT+'/results.json',JSON.stringify({browser:{name:BROWSER,version:browser.version(),playwright:require('playwright/package.json').version},errors,results,svgGeometry,neutral},null,2)+'\n');await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
