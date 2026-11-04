#!/usr/bin/env node
// Browser smoke test for the original SVG crossing diagnostic.
// Requires playwright + installed Chromium. Run via GitHub Actions.
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:1100},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8766/research/planar-svg-diagnostic.html');
  await page.waitForSelector('#diagram g[data-order]');
  fs.mkdirSync('research/output',{recursive:true});
  const reports=[];
  for(const star of [false,true])for(const alternate of [false,true])for(const hand of [false,true]){
   await page.locator('#star').setChecked(star);
   await page.locator('#alternate').setChecked(alternate);
   await page.locator('#hand').setChecked(hand);
   const result=await page.evaluate(()=>{
    const svg=document.querySelector('#diagram');
    const masks=svg.querySelectorAll('clipPath');
    const groups=svg.querySelectorAll('g[data-order]');
    const strips=svg.querySelectorAll('defs g[id$="DiagStrips"] path[data-strip]');
    const uses=svg.querySelectorAll('g[data-order] use');
    return {masks:masks.length,groups:groups.length,strips:strips.length,uses:uses.length,uniqueStripIds:new Set([...strips].map(x=>x.id)).size,viewBox:svg.getAttribute('viewBox'),status:document.querySelector('#status').textContent};
   });
   if(result.masks!==6||result.groups!==6||result.strips!==27||result.uses!==18||result.uniqueStripIds!==27)throw Error('SVG structure mismatch: '+JSON.stringify(result));
   const name='planar-'+Number(star)+Number(alternate)+Number(hand);
   await page.locator('#diagram').screenshot({path:'research/output/'+name+'.png'});
   const svg=await page.locator('#diagram').evaluate(el=>new XMLSerializer().serializeToString(el));
   fs.writeFileSync('research/output/'+name+'.svg',svg);
   reports.push({name,star,alternate,hand,...result});
  }
  if(errors.length)throw Error('Browser JS errors: '+errors.join('; '));
  fs.writeFileSync('research/output/browser-results.json',JSON.stringify({errors,reports},null,2));
  console.log('Validated '+reports.length+' planar SVG configurations');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
