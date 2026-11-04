#!/usr/bin/env node
// Compare identical SVG geometry across actual Chromium and Firefox captures.
const fs=require('node:fs'),assert=require('node:assert/strict'),{PNG}=require('pngjs');
const base='research/output/boundary-matrix/seam-only';
const a=JSON.parse(fs.readFileSync(base+'/chromium/results.json','utf8'));
const b=JSON.parse(fs.readFileSync(base+'/firefox/results.json','utf8'));
assert.equal(a.browser.name,'chromium');assert.equal(b.browser.name,'firefox');
assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
assert(a.svgGeometry.length>0);assert.deepEqual(a.svgGeometry,b.svgGeometry,'Browser geometry differs');
assert.deepEqual(a.neutral.imageSize,b.neutral.imageSize,'Screenshot dimensions differ');
const comparisons=[];
for(const name of ['direction-colored','neutral-clipped','neutral-unclipped']){
 const left=PNG.sync.read(fs.readFileSync(base+'/chromium/'+name+'.png')),right=PNG.sync.read(fs.readFileSync(base+'/firefox/'+name+'.png'));
 let differentPixels=0,maxChannelDifference=0,sum=0;
 assert.equal(left.width,right.width);assert.equal(left.height,right.height);
 for(let i=0;i<left.data.length;i+=4){
  let different=false;
  for(let c=0;c<3;c++){
   const d=Math.abs(left.data[i+c]-right.data[i+c]);sum+=d;
   if(d)different=true;maxChannelDifference=Math.max(maxChannelDifference,d);
  }
  if(different)differentPixels++;
 }
 comparisons.push({name,differentPixels,maxChannelDifference,meanChannelDifference:sum/(3*left.width*left.height)});
}
const engines=[a,b].map(result=>{
 const n=result.neutral;
 assert(n.profiles.length>0);assert(n.maxUnclippedDistance<3,'Unclipped neutral control is not solid');
 return {...result.browser,profiles:n.profiles.length,imageSize:n.imageSize,maxColoredDistance:n.maxColoredDistance,maxNeutralClippedDistance:n.maxClippedDistance,maxNeutralUnclippedDistance:n.maxUnclippedDistance};
});
const report={identicalSvgPaths:a.svgGeometry.length,engines,comparisons,
 interpretation:'Exact seam pixels are measured rasterization/compositing zones. The unclipped neutral union is the control; positive-area mask coverage is tested independently.'};
fs.writeFileSync(base+'/comparison.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
