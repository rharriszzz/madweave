#!/usr/bin/env node
// Capture full madweave and each isolated hexweave layer using actual editor buttons.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1150},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8766/editor.html');
  const frame=page.frameLocator('#weave');
  await frame.locator('#cbuttonVH0').waitFor();
  const dir='research/output/hexweave';fs.mkdirSync(dir,{recursive:true});
  const cases=[
   {name:'full-madweave',hidden:[]},
   {name:'hexweave-a',hidden:[1,2]},
   {name:'hexweave-b',hidden:[0,2]},
   {name:'hexweave-c',hidden:[0,1]}
  ];
  const results=[];
  async function read(){return frame.locator('#svg').evaluate(svg=>{
   const w=svg.ownerDocument.defaultView;
   const groups=[...svg.querySelectorAll('defs g[id$="Strips"] g[id^="GP"]')];
   return {showC:Array.from(w.showC),showD:Array.from(w.showD),starMadWeaveCenter:w.starMadWeaveCenter,coneFraction:w.coneFraction,transformInPath:w.transformInPath,visibleStripGroups:groups.filter(g=>g.getAttribute('visibility')==='visible').length};
  });}
  async function toggle(c){await frame.locator('#cbuttonVH'+c).dispatchEvent('mousedown');}
  for(const item of cases){
   const before=await read();
   for(let c=0;c<3;c++)if(before.showC[c]===item.hidden.includes(c))await toggle(c);
   const state=await read();
   assert.deepEqual(state.showC,item.hidden.length===0?[true,true,true]:[0,1,2].map(c=>!item.hidden.includes(c)));
   assert.deepEqual(state.showD,[true,true,true]);
   assert.equal(state.transformInPath,false);
   assert.equal(state.coneFraction,1);
   const svg=frame.locator('#svg');
   await svg.screenshot({path:dir+'/'+item.name+'.png'});
   const serialized=await svg.evaluate(el=>new XMLSerializer().serializeToString(el));
   fs.writeFileSync(dir+'/'+item.name+'.svg',serialized);
   results.push({name:item.name,...state});
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(dir+'/results.json',JSON.stringify({errors,results},null,2));
  console.log(JSON.stringify(results,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
