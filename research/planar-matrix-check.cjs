#!/usr/bin/env node
// Whole-design structure and zoomed pixels against independent finite-strip cells.
const {chromium}=require('playwright'),{PNG}=require('pngjs');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const g=require('./planar-geometry.cjs');
const engine=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'..','madweave.js'),'utf8'),engine);
const OUT='research/output/matrix';fs.mkdirSync(OUT,{recursive:true});
const rgb=color=>color.match(/\d+/g).map(Number);
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const transform=(p,m)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
function meanPixel(png,x,y){
 const xi=Math.round(x),yi=Math.round(y),color=[0,0,0];
 assert(xi>1&&yi>1&&xi<png.width-2&&yi<png.height-2,'Pixel sample outside screenshot');
 for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let c=0;c<3;c++)color[c]+=png.data[((yi+a)*png.width+xi+b)*4+c]/9;
 return color;
}
function regionClearance(region){
 const p=region.point;
 return Math.min(...region.polygon.map((a,i)=>{
  const b=region.polygon[(i+1)%region.polygon.length];
  return Math.abs((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))/Math.hypot(b[0]-a[0],b[1]-a[1]);
 }));
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 const errors=[],results=[];
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1100},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.env.MADWEAVE_URL||'http://127.0.0.1:8766/editor.html');
  const frame=page.frameLocator('#weave'),svg=frame.locator('#svg');
  await frame.locator('#cbuttonSC1').waitFor();
  let previous=0;
  for(let size=1;size<=8;size++){
   await frame.locator('#cbuttonSC'+size).dispatchEvent('mousedown');
   for(let spacing=0;spacing<4;spacing++){
    await frame.locator('#cbuttonSep'+spacing).dispatchEvent('mousedown');
    const geometry=g.model(size,[.07,.33,.8,2][spacing]);
    const visibleCells=g.visibleCells(geometry),regions=g.centralRegions(geometry,1);
    for(let configuration=0;configuration<8;configuration++){
     for(const [bit,button] of [[1,'C'],[2,'X'],[4,'-']])if((previous&bit)!==(configuration&bit))
      await frame.locator('[id="cbutton'+button+'"]').dispatchEvent('mousedown');
     previous=configuration;
     Object.assign(engine,{starMadWeaveCenter:!!(configuration&1),alternate:!!(configuration&2),hand:!!(configuration&4)});
     const actual=await svg.evaluate(root=>{
      const w=root.ownerDocument.defaultView,doc=root.ownerDocument;
      const matrix=element=>{const m=root.getCTM().inverse().multiply(element.getCTM());return [m.a,m.b,m.c,m.d,m.e,m.f];};
      const strips=[];
      for(let d=0;d<3;d++)for(let s=0;s<w.stripsPerDirection;s++){
       const p=doc.getElementById('P'+w.name(w.stripsPerDirection,d*w.stripsPerDirection+s));
       strips.push({d,s,id:p.id,coordinates:p.getAttribute('d').match(/[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi).map(Number),matrix:matrix(p),fill:p.getAttribute('fill'),opacity:Number(p.getAttribute('fill-opacity'))});
      }
      const masks=w.pname.flatMap(name=>{
       const p=doc.getElementById(name+'ClipPath_path');
       return p?[{name,path:p.getAttribute('d'),matrix:matrix(p),
        uses:[...doc.getElementById(name+'G').querySelectorAll('use')].map(el=>el.getAttributeNS('http://www.w3.org/1999/xlink','href').slice(1,2))}]:[];
      });
      const members=()=>{
       const result=[];
       for(let d=0;d<3;d++)for(let s=0;s<w.stripsPerDirection;s++){
        const el=doc.getElementById('GP'+w.name(w.stripsPerDirection,d*w.stripsPerDirection+s));
        if(el.getAttribute('visibility')==='visible')result.push(d*w.stripsPerDirection+s);
       }
       return result;
      };
      const toggle=i=>doc.getElementById('cbuttonVH'+i).dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));
      const full=members(),classes=[];
      for(let c=0;c<3;c++){
       for(let i=0;i<3;i++)if(w.showC[i]!== (i===c))toggle(i);
       classes.push(members());
      }
      for(let i=0;i<3;i++)if(!w.showC[i])toggle(i);
      const colorCases=[];
      if(w.baseSize===3&&w.separationIndex===1){
       const structure=()=>JSON.stringify({
        strips:[...root.querySelectorAll('path[mwColorIndex]')].map(p=>[p.id,p.getAttribute('d'),p.getAttribute('transform')]),
        masks:w.pname.map(name=>doc.getElementById(name+'ClipPath_path')).filter(Boolean).map(p=>[p.id,p.getAttribute('d'),p.getAttribute('transform')])
       });
       const baseline=structure();
       const press=name=>doc.getElementById('cbutton'+name).dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));
       for(let pattern=0;pattern<5;pattern++){
        press('CP'+pattern);
        for(let count=1;count<=6;count++){
         press('CC'+count);
         if(structure()!==baseline)throw Error('Color controls changed strip/mask geometry');
         colorCases.push({pattern,count,colors:[...w.colorIndexArray],visibility:[...w.visibilityIndexArray]});
        }
       }
       press('CP0');press('CC3');
      }
      return {baseSize:w.baseSize,spacing:w.separationIndex,star:w.starMadWeaveCenter,alternate:w.alternate,hand:w.hand,
       cone:w.coneFraction,transformed:w.transformInPath,directions:w.numberOfDirections,processing:w.processing,
       pitch:w.stripWidth+w.stripSpacing,length:w.stripLength,palette:w.colorArray.slice(0,3),strips,masks,full,classes,colorCases};
     });
     const name=`B${size}-S${spacing}-C${+(!!(configuration&1))}-X${+(!!(configuration&2))}-H${+(!!(configuration&4))}`;
     assert.equal(actual.baseSize,size);assert.equal(actual.spacing,spacing);
     assert.equal(actual.star,!!(configuration&1));assert.equal(actual.alternate,!!(configuration&2));assert.equal(actual.hand,!!(configuration&4));
     assert.equal(actual.cone,1);assert.equal(actual.transformed,false);assert.equal(actual.directions,3);assert.equal(actual.processing,false);
     assert(Math.abs(actual.pitch-geometry.pitch)<1e-10);assert(Math.abs(actual.length/geometry.pitch-geometry.length)<1e-10);
     assert.equal(actual.strips.length,9*size);assert.equal(actual.full.length,9*size);
     for(const strip of actual.strips){
      assert.equal(strip.id[2],'abc'[(strip.s+((configuration&1)?3-strip.d:0))%3]);
      const polygon=[];
      for(let i=0;i<strip.coordinates.length;i+=2)polygon.push(transform(strip.coordinates.slice(i,i+2),strip.matrix).map(v=>v/geometry.pitch));
      assert(g.samePolygon(polygon,geometry.rectangles[strip.d*geometry.n+strip.s].vertices,2e-5),'Physical rectangle mismatch '+name);
      assert.equal(strip.fill,actual.palette[strip.d]);assert.equal(strip.opacity,1);
     }
     for(let c=0;c<3;c++){
      const expected=actual.full.filter(index=>{
       const d=Math.floor(index/geometry.n),s=index%geometry.n;
       return (s+((configuration&1)?3-d:0))%3===c;
      });
      assert.deepEqual(actual.classes[c],expected,'Hexweave partition mismatch '+name);
     }
     const maskCells=new Map();
     for(const mask of actual.masks){
      assert.deepEqual(mask.uses,mask.name.split('').reverse(),'Wrong SVG use painter order '+name);
      for(const triangle of g.triangles(mask.path)){
      const polygon=triangle.map(([x,y])=>transform([x*Math.sqrt(3),y],mask.matrix).map(v=>v/geometry.pitch));
      const indices=g.normals.map(n=>Math.round(g.dot(n,g.centroid(polygon))+geometry.offset)),key=indices.join(',');
      assert(!maskCells.has(key),'Duplicate browser mask cell '+name);
      assert(g.samePolygon(polygon,g.cell(indices,geometry.offset),2e-5),'Browser mask geometry mismatch '+name);
      assert.equal(mask.name,g.order(engine,indices).map(d=>'HRL'[d]).join(''),'Browser mask order mismatch '+name);
      maskCells.set(key,mask.name);
      }
     }
     for(const tile of visibleCells)assert(maskCells.has(tile.indices.join(',')),'Uncovered browser strip cell '+name);
     for(const colorCase of actual.colorCases){
      const expected=actual.full.map(index=>{
       const d=Math.floor(index/geometry.n),s=index%geometry.n,s0=s+((configuration&1)?3-d:0),c=s0%3,n=Math.floor(s0/3);
       return [d,c,d+c,n,c+n][colorCase.pattern]%colorCase.count;
      });
      assert.deepEqual(colorCase.colors,expected,'Color pattern formula mismatch '+name);
      assert(colorCase.visibility.every(Boolean),'Color controls failed to reset visibility');
     }
     const summary={name,size,spacing,configuration,strips:actual.strips.length,visibleCells:visibleCells.length,maskCells:maskCells.size,classCounts:actual.classes.map(a=>a.length),colorInvariantCases:actual.colorCases.length,pixels:null};
     results.push({summary});
     if([1,2,3,8].includes(size)){
      const oldViewBox=await svg.getAttribute('viewBox');
      try{
       const screen=await svg.evaluate((root,pitch)=>{
        root.setAttribute('viewBox',[-pitch,-pitch,2*pitch,2*pitch].join(' '));
        const m=root.getScreenCTM(),b=root.getBoundingClientRect();
        return {matrix:[m.a,m.b,m.c,m.d,m.e-b.left,m.f-b.top],scale:Math.min(Math.hypot(m.a,m.b),Math.hypot(m.c,m.d))*pitch};
       },geometry.pitch);
       const groups=new Map();
       for(const region of regions){
        if(regionClearance(region)*screen.scale<3)continue;
        const order=g.order(engine,region.indices),present=region.present.map(s=>s.d);
        const top=order.find(d=>present.includes(d));
        const key=present.length+':'+order.map(d=>'HRL'[d]).join('');
        if(!groups.has(key))groups.set(key,[]);
        groups.get(key).push({...region,top:top===undefined?'white':'HRL'[top],key});
       }
       const selected=[...groups.values()].flatMap(group=>group.sort((a,b)=>b.area-a.area).slice(0,3));
       const coverage=Array.from({length:4},(_,count)=>selected.filter(r=>r.present.length===count).length);
       assert(coverage[0]>0&&coverage[1]>0&&coverage[2]>0,'Insufficient pixel occupancy coverage '+name+': '+coverage);
       assert.equal(coverage[3]>0,spacing<3,'Wrong triple-area empty case '+name);
       const png=PNG.sync.read(await svg.screenshot({path:OUT+'/'+name+'-zoom.png'}));
       const colors=actual.palette.map(rgb).concat([[255,255,255]]);
       const rows=selected.map(region=>{
        const point=region.point.map(v=>v*geometry.pitch),pixel=transform(point,screen.matrix),observed=meanPixel(png,...pixel);
        const index=region.top==='white'?3:'HRL'.indexOf(region.top),expected=colors[index];
        const difference=distance(expected,observed),margin=Math.min(...colors.filter((_,i)=>i!==index).map(c=>distance(c,observed)))-difference;
        return {point,indices:region.indices,present:region.present,top:region.top,pixel,observed,expected,difference,margin,pass:difference<=28&&margin>=15};
       });
       summary.pixels={samples:rows.length,byOccupancy:coverage,expectedEmptyTriple:spacing===3,failed:rows.filter(r=>!r.pass).length,normalizedViewBox:[-1,-1,2,2]};
       results[results.length-1].rows=rows;
       assert.equal(summary.pixels.failed,0,'Independent pixel mismatch '+name+': '+JSON.stringify(rows.filter(r=>!r.pass).slice(0,3)));
      }finally{await svg.evaluate((root,viewBox)=>root.setAttribute('viewBox',viewBox),oldViewBox);}
     }
    }
   }
   console.log('PASS independent matrix at size '+size+' (32 structural cases)');
  }
  assert.deepEqual(errors,[]);assert.equal(results.length,256);
  console.log(JSON.stringify({structuralCases:results.length,colorInvariantCases:results.reduce((sum,r)=>sum+r.summary.colorInvariantCases,0),pixelCases:results.filter(r=>r.summary.pixels).length,pixelSamples:results.reduce((sum,r)=>sum+(r.summary.pixels?.samples||0),0),errors},null,2));
 }finally{
  fs.writeFileSync(OUT+'/results.json',JSON.stringify({errors,results},null,2)+'\n');
  await browser.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
