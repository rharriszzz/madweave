#!/usr/bin/env node
// Pixel-level crossing audit of the ORIGINAL planar Madweave SVG editor.
// Run from repository root with a local HTTP server on port 8766.
// Uses original isCoveredBy() and independently samples actual Chromium PNG pixels.
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
const fs=require('node:fs');
const assert=require('node:assert/strict');

const OUT='research/output/crossing-pixels';
fs.mkdirSync(OUT,{recursive:true});
const COLORS=['H','R','L'];

function meanPixel(png,x,y) {
  const xi=Math.round(x), yi=Math.round(y);
  assert(xi>=2&&yi>=2&&xi<png.width-2&&yi<png.height-2,'Sample outside PNG '+xi+','+yi);
  const v=[0,0,0];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const i=((yi+dy)*png.width+xi+dx)*4;
    for(let c=0;c<3;c++)v[c]+=png.data[i+c];
  }
  return v.map(x=>Math.round(x/9));
}
function diff(a,b){return Math.sqrt(a.reduce((n,v,i)=>n+(v-b[i])**2,0));}
function parseRGB(str){
 const match=/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(str);
 assert(match,'Bad color '+str);return match.slice(1).map(Number);
}
function smallSummary(rows) {
 return {total:rows.length,passes:rows.filter(r=>r.pass).length,failures:rows.filter(r=>!r.pass).length,
  byPair:Object.fromEntries(['HR','HL','RL'].map(p=>[p,rows.filter(r=>r.pair===p).length]))};
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1100},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:8766/editor.html');
  const frame=page.frameLocator('#weave');
  await frame.locator('#cbuttonC').waitFor();
  const all=[];
  const groups=[];
  for(const star of [false,true]){
    if(star)await frame.locator('#cbuttonC').dispatchEvent('mousedown');
    const svg=frame.locator('#svg');
    const data=await svg.evaluate(el=>{
      const w=el.ownerDocument.defaultView;
      if(w.transformInPath || w.coneFraction!==1 || w.numberOfDirections!==3)throw Error('Not planar');
      if(w.starMadWeaveCenter!==star)throw Error('Unexpected center');
      if(w.alternate || w.hand)throw Error('Unexpected alternate/hand state');
      if(w.showC.some(x=>!x)||w.showD.some(x=>!x))throw Error('Visibility unexpectedly disabled');
      const n=w.stripsPerDirection;
      const pitch=w.stripWidth+w.stripSpacing, offset=Math.floor(n/2)-.5;
      const normals=[0,1,2].map(d=>[-Math.sin(2*Math.PI*d/3),Math.cos(2*Math.PI*d/3)]);
      const candidates=[];
      for(let d=0;d<3;d++)for(let e=d+1;e<3;e++){
        const [a,b]=normals[d],[c,f]=normals[e],det=a*f-b*c;
        for(let s=0;s<n;s++)for(let t=0;t<n;t++){
          const u=(s-offset)*pitch,v=(t-offset)*pitch;
          const x=(u*f-b*v)/det,y=(a*v-u*c)/det;
          // Central crossings, away from the ends of strips and from other controls.
          if(Math.abs(x)>3.25||Math.abs(y)>3.25)continue;
          const other=3-d-e;
          const distance=Math.min(...Array.from({length:n},(_,i)=>
            Math.abs(normals[other][0]*x+normals[other][1]*y-(i-offset)*pitch)));
          if(distance<w.stripWidth*.5+.12)continue; // two-strip crossings only
          const topFirst=w.isCoveredBy(s,d,t,e);
          const top=topFirst?d:e,bottom=topFirst?e:d;
          const p=el.createSVGPoint();p.x=x;p.y=y;
          const screen=p.matrixTransform(el.getScreenCTM());
          const bounds=el.getBoundingClientRect();
          candidates.push({d,e,s,t,x,y,pair:'HRL'[d]+'HRL'[e],top:'HRL'[top],bottom:'HRL'[bottom],
            topRGB:w.colorArray[top],bottomRGB:w.colorArray[bottom],
            px:screen.x-bounds.left,py:screen.y-bounds.top,
            radius:Math.hypot(x,y),thirdClearance:distance});
        }
      }
      // Independently cover all three direction pairs, nearest the center first.
      const selected=[];
      for(const pair of ['HR','HL','RL']){
        const xs=candidates.filter(x=>x.pair===pair).sort((a,b)=>a.radius-b.radius);
        selected.push(...xs.slice(0,8));
      }
      return {baseSize:w.baseSize,stripsPerDirection:n,star:w.starMadWeaveCenter,
        candidates:selected,allCandidateCount:candidates.length};
    });
    assert.equal(data.candidates.length,24,'Too few central two-strip crossings');
    const shot=await svg.screenshot({path:OUT+'/'+(star?'shifted':'ordinary')+'-unmarked.png'});
    const png=PNG.sync.read(shot);
    const rows=data.candidates.map((r,i)=>{
      const observed=meanPixel(png,r.px,r.py);
      const expected=parseRGB(r.topRGB),under=parseRGB(r.bottomRGB);
      const topDistance=diff(observed,expected),underDistance=diff(observed,under);
      // Both pixel proximity and separation from underlying strip must hold.
      const pass=topDistance<=22 && topDistance+20<underDistance;
      return {...r,number:i+1,observed,expected,under,topDistance,underDistance,pass};
    });
    all.push({star,geometry:{baseSize:data.baseSize,stripsPerDirection:data.stripsPerDirection,
      allCandidateCount:data.allCandidateCount},summary:smallSummary(rows),crossings:rows});
    // Mark measured intersections on a *copy* of the SVG DOM (never modify repository editor).
    await svg.evaluate(({rows})=>{
      const root=document.querySelector('#svg'),NS='http://www.w3.org/2000/svg';
      const group=document.createElementNS(NS,'g');group.setAttribute('id','researchCrossingAnnotations');
      group.setAttribute('pointer-events','none');
      for(const row of rows){
        const circle=document.createElementNS(NS,'circle');
        circle.setAttribute('cx',row.x);circle.setAttribute('cy',row.y);
        circle.setAttribute('r','.115');circle.setAttribute('fill','white');
        circle.setAttribute('stroke',row.pass?'#06703a':'#df1515');circle.setAttribute('stroke-width','.05');
        group.appendChild(circle);
        const txt=document.createElementNS(NS,'text');
        txt.setAttribute('x',row.x+.13);txt.setAttribute('y',row.y-.12);
        txt.setAttribute('font-size','.19');txt.setAttribute('font-weight','bold');txt.setAttribute('fill','#111');
        txt.setAttribute('stroke','white');txt.setAttribute('stroke-width','.045');
        txt.setAttribute('paint-order','stroke');txt.textContent=row.number.toString();
        group.appendChild(txt);
      }
      root.appendChild(group);
    },{rows});
    await svg.screenshot({path:OUT+'/'+(star?'shifted':'ordinary')+'-annotated.png'});
    await svg.evaluate(()=>document.querySelector('#researchCrossingAnnotations')?.remove());
    groups.push({star,summary:smallSummary(rows)});
  }
  const key=r=>r.pair+':'+r.s+':'+r.t;
  const ordinary=new Map(all[0].crossings.map(r=>[key(r),r]));
  const changed=all[1].crossings.filter(r=>ordinary.has(key(r))&&ordinary.get(key(r)).top!==r.top);
  const report={source:'original madweave.svg in editor.html',runScope:'planar crossing color sampling',
    sampleMethod:'3x3 mean of PNG around exact intersection of strip centerlines; exclude third-strip coverage',
    errors,groups,changedTopCount:changed.length,changedTopSamples:changed.slice(0,8).map(r=>({pair:r.pair,s:r.s,t:r.t,topAfter:r.top,topBefore:ordinary.get(key(r)).top})),results:all};
  fs.writeFileSync(OUT+'/crossing-results.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({groups,changedTopCount:changed.length,errors},null,2));
  assert.deepEqual(errors,[]);
  assert.ok(changed.length>0,'Center shift did not alter any tested crossing');
  assert.equal(all[0].summary.failures,0,'Ordinary center pixel mismatch');
  assert.equal(all[1].summary.failures,0,'Shifted center pixel mismatch');
  console.log('PASS: 48 original SVG two-strip crossing pixels agree with isCoveredBy');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
