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
  const membership={};
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
   const members=await svg.evaluate(el=>[...el.querySelectorAll('defs g[id$="Strips"] g[id^="GP"]')].filter(g=>g.getAttribute('visibility')==='visible').map(g=>g.id).sort());
   membership[item.name]=members;
   results.push({name:item.name,...state,memberIds:members});
  }
  const full=new Set(membership['full-madweave']);
  const subsets=['hexweave-a','hexweave-b','hexweave-c'].map(n=>new Set(membership[n]));
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.equal([...subsets[i]].filter(x=>subsets[j].has(x)).length,0,'Hexweave classes overlap');
  const union=new Set(subsets.flatMap(x=>[...x]));
  assert.deepEqual([...union].sort(),[...full].sort(),'Three hexweaves must partition all visible strips');
  // Repeat all four captures after shifting the center with the actual C button.
  await frame.locator('#cbuttonC').dispatchEvent('mousedown');
  const starMembership={};
  for(const item of cases){
   const before=await read();
   for(let c=0;c<3;c++)if(before.showC[c]===item.hidden.includes(c))await toggle(c);
   const state=await read();
   assert.equal(state.starMadWeaveCenter,true);
   assert.equal(state.coneFraction,1);
   const svg=frame.locator('#svg');
   const name='star-'+item.name;
   await svg.screenshot({path:dir+'/'+name+'.png'});
   fs.writeFileSync(dir+'/'+name+'.svg',await svg.evaluate(el=>new XMLSerializer().serializeToString(el)));
   const members=await svg.evaluate(el=>[...el.querySelectorAll('defs g[id$="Strips"] g[id^="GP"]')].filter(g=>g.getAttribute('visibility')==='visible').map(g=>g.id).sort());
   starMembership[item.name]=members;
   results.push({name,...state,memberIds:members});
  }
  const starFull=new Set(starMembership['full-madweave']);
  const starSubsets=['hexweave-a','hexweave-b','hexweave-c'].map(n=>new Set(starMembership[n]));
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.equal([...starSubsets[i]].filter(x=>starSubsets[j].has(x)).length,0);
  assert.deepEqual([...new Set(starSubsets.flatMap(x=>[...x]))].sort(),[...starFull].sort());
  assert.deepEqual(errors,[]);
  fs.writeFileSync(dir+'/results.json',JSON.stringify({errors,results},null,2));
  console.log(JSON.stringify(results,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
