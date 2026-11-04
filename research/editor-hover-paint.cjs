#!/usr/bin/env node
// End-to-end real pointer selection and painting through the original SVG overlay.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1200}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.MADWEAVE_URL || 'http://127.0.0.1:8766/editor.html');
 const frame=page.frameLocator('#weave');await frame.locator('#stripsCover').waitFor();
 const swatch=frame.locator('#cbuttonC5'),sb=await swatch.boundingBox();
 await page.mouse.click(sb.x+sb.width/2,sb.y+sb.height/2);
 const before=await frame.locator('#svg').evaluate(svg=>{
  const w=svg.ownerDocument.defaultView;
  return {palette:w.defaultColorIndex,colors:Array.from(w.colorIndexArray),selected:w.selectedMouseIndex};
 });
 assert.equal(before.palette,5);
 const cover=frame.locator('#stripsCover'),box=await cover.boundingBox();
 const x=box.x+box.width*.53,y=box.y+box.height*.48;
 await page.mouse.move(x,y);
 await page.waitForTimeout(550);
 for(let i=0;i<4;i++){await page.mouse.move(x+i*.12,y);await page.waitForTimeout(160);}
 const selected=await frame.locator('#svg').evaluate(svg=>svg.ownerDocument.defaultView.selectedMouseIndex);
 assert.ok(selected>=0,'Hover did not select a strip');
 await page.mouse.click(x+.36,y);
 const after=await frame.locator('#svg').evaluate(svg=>{
  const w=svg.ownerDocument.defaultView;
  return {selected:w.selectedMouseIndex,colors:Array.from(w.colorIndexArray),visibility:Array.from(w.visibilityIndexArray)};
 });
 assert.equal(after.colors[selected],5,'Click did not paint selected strip');
 const changed=after.colors.reduce((n,c,i)=>n+(c!==before.colors[i]?1:0),0);
 assert.ok(changed>=1,'No strip color changed');
 fs.mkdirSync('research/output/hover',{recursive:true});
 fs.writeFileSync('research/output/hover/results.json',JSON.stringify({errors,before:{palette:before.palette,selected:before.selected},hoverSelected:selected,afterSelected:after.selected,changed},null,2));
 await frame.locator('#svg').screenshot({path:'research/output/hover/painted-strip.png'});
 assert.deepEqual(errors,[]);
 console.log('Real hover and click painted strip '+selected);
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
