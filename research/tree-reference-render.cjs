#!/usr/bin/env node
// Forensic replay of an existing historical renderer; does not change the app.
const {chromium}=require('playwright'),{PNG}=require('pngjs');
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(__dirname,'output/tree-forensics');
const assert=require('node:assert/strict');
const COMMIT='0402b15c2b0f55955d99e606a2e5df15a0d7eee1';
fs.mkdirSync(OUT,{recursive:true});
const source=execFileSync('git',['show',COMMIT+':madweave.js'],{cwd:ROOT,encoding:'utf8'});
const reference=PNG.sync.read(fs.readFileSync(path.join(ROOT,'tree.png')));
const cases=[['1-2',.5],['2-3',2/3],['3-4',.75],['4-5',.8],['6-7',6/7],['1',1],['4-3',4/3],['3-2',1.5]];
(async()=>{
 const browser=await chromium.launch({headless:true}),results=[];let endpoints=null;
 try{
  const page=await browser.newPage({viewport:{width:436,height:436},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [label,f] of cases){
   await page.setContent('<body style="margin:0"><svg id="svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="436" height="436"></svg></body>');
   await page.addScriptTag({content:source});
   const state=await page.evaluate(f=>{
    // All changes are inside this disposable page's historical globals.
    transformInPath=true;coneFraction=f;numberOfDirections=directionsPerCircle/f;
    drawOneUnit=false;setupNewBaseSize(2);stripLength=10;
    starMadWeaveCenter=false;alternate=true;
    initCoveredByArrays();buildDefs(document);buildStrips(document);
    document.querySelector('#stripsCover')?.remove();
    document.querySelector('#strips').setAttribute('transform','rotate(-90)');
    const scale=35.7,cx=218,cy=228,root=document.querySelector('#svg');
    root.setAttribute('viewBox',[-cx/scale,-cy/scale,436/scale,436/scale].join(' '));
    const caps=[];
    for(let index=0;index<totalNumber;index++){
     const raw=stripPath(index).match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi).map(Number),pts=[];
     for(let j=0;j<raw.length;j+=2)pts.push([raw[j],raw[j+1]]);
     for(const [side,k] of [['left',31],['right',159]]){
      const p=pts[k].map((v,j)=>(v+pts[k+1][j])/2);
      caps.push({index,d:getD(index),s:getS(index),side,color:color(index),screenPoint:[cx+scale*p[1],cy-scale*p[0]]});
     }
    }
    return {f,historicalDirectionsPerCircle:directionsPerCircle,historicalNumberOfDirections:numberOfDirections,
     stripLength,pitch:stripWidth+stripSpacing,baseSize,npoints,starMadWeaveCenter,alternate,
     scale,screenOrigin:[cx,cy],pixelIndexOrigin:[cx-.5,cy-.5],rotationDegrees:-90,colors:colorArray.slice(0,3),caps};
   },f);
   const png=PNG.sync.read(await page.locator('svg').screenshot({path:path.join(OUT,'angle-'+label+'.png')}));
   fs.writeFileSync(path.join(OUT,'angle-'+label+'.svg'),await page.locator('svg').evaluate(root=>new XMLSerializer().serializeToString(root)));
   let error=0,different=0,maskDifference=0;
   for(let i=0;i<png.data.length;i+=4){
    const a=Array.from(png.data.subarray(i,i+3)),b=Array.from(reference.data.subarray(i,i+3)),delta=a.map((v,j)=>Math.abs(v-b[j]));
    error+=delta.reduce((n,v)=>n+v,0);if(Math.max(...delta)>25)different++;
    if((Math.min(...a)<245)!==(Math.min(...b)<245))maskDifference++;
   }
   const pixels=png.width*png.height;
   const row={label,...state,meanChannelError:error/(3*pixels),pixelsOver25:different,silhouetteAgreement:1-maskDifference/pixels};
   results.push(row);console.log(JSON.stringify({f,meanChannelError:row.meanChannelError,silhouetteAgreement:row.silhouetteAgreement}));
   if(f===.75)endpoints={origin:state.screenOrigin,caps:state.caps,upper:state.caps.filter(c=>c.screenPoint[1]<state.screenOrigin[1])};
  }
  if(errors.length)throw Error(errors.join('\n'));
  const best=results.reduce((a,b)=>a.meanChannelError<b.meanChannelError?a:b);
  assert.equal(best.f,.75,'A different multiplier matches the reference better');
  assert(best.silhouetteAgreement>.98&&best.meanChannelError<3,'Historical reconstruction no longer matches the reference');
  assert.equal(endpoints.upper.length,24,'Unexpected upper-half endpoint count');
  fs.writeFileSync(path.join(OUT,'angle-comparison.json'),JSON.stringify({historicalCommit:COMMIT,browser:browser.version(),results},null,2)+'\n');
  fs.writeFileSync(path.join(OUT,'endcaps.json'),JSON.stringify(endpoints,null,2)+'\n');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
