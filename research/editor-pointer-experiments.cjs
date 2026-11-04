#!/usr/bin/env node
// Original editor pointer interaction tests: real mouse presses and palette/strip state.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1200}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.MADWEAVE_URL || 'http://127.0.0.1:8766/editor.html');
  const frame=page.frameLocator('#weave');
  await frame.locator('#cbuttonC0').waitFor();
  const output={};
  async function read(){return frame.locator('#svg').evaluate(svg=>{
   const w=svg.ownerDocument.defaultView,index=0;
   const path=svg.ownerDocument.getElementById('P'+w.name(w.stripsPerDirection,index));
   return {defaultColorIndex:w.defaultColorIndex,hideStrips:w.hideStrips,showStrips:w.showStrips,selectedMouseIndex:w.selectedMouseIndex,stripColorIndex:w.colorIndexArray[index],stripVisible:w.visibilityIndexArray[index],stripFill:path?.getAttribute('fill'),color0:w.colorArray[0],opacity0:w.opacityArray[0],hue:w.currentHue,sat:w.currentSat,value:w.currentValue,opacity:w.currentOpacity};
  });}
  async function press(id,ratio=.5){
   const rect=frame.locator('#cbutton'+id),b=await rect.boundingBox();
   assert.ok(b,'Missing SVG button '+id);
   await page.mouse.click(b.x+b.width*ratio,b.y+b.height*.5);
  }
  output.initial=await read();
  await press('C0');output.palette=await read();assert.equal(output.palette.defaultColorIndex,0);
  // Use original strip editing function after selecting a real palette button;
  // direct selection avoids timing-sensitive hover hysteresis and isolates painting.
  output.paint=await frame.locator('#svg').evaluate(svg=>{
   const w=svg.ownerDocument.defaultView,index=0;
   w.setStripColorToCurrentDefault(svg,index);
   return {index,colorIndex:w.colorIndexArray[index],visible:w.visibilityIndexArray[index]};
  });
  assert.equal(output.paint.colorIndex,0);
  await press('I');output.invisibleMode=await read();assert.equal(output.invisibleMode.hideStrips,true);
  output.hidden=await frame.locator('#svg').evaluate(svg=>{const w=svg.ownerDocument.defaultView;w.setStripColorToCurrentDefault(svg,0);return w.visibilityIndexArray[0];});
  assert.equal(output.hidden,false);
  await press('V');output.visibleMode=await read();assert.equal(output.visibleMode.showStrips,true);
  output.restored=await frame.locator('#svg').evaluate(svg=>{const w=svg.ownerDocument.defaultView;w.setStripColorToCurrentDefault(svg,0);return w.visibilityIndexArray[0];});
  assert.equal(output.restored,true);
  await press('C0');
  for(const [button,field] of [['OB','opacity'],['HB','hue'],['SB','sat'],['VB','value']]){
   await press(button,.36);
   output[button]=await read();
   const expected=button==='HB'?129.6:.36;
   assert.ok(Math.abs(output[button][field]-expected)<.035*(button==='HB'?360:1),button+' unexpected '+output[button][field]);
  }
  fs.mkdirSync('research/output/pointer',{recursive:true});
  await frame.locator('#svg').screenshot({path:'research/output/pointer/after-pointer-tests.png'});
  fs.writeFileSync('research/output/pointer/results.json',JSON.stringify({errors,output},null,2));
  assert.deepEqual(errors,[]);
  console.log('Original SVG pointer/palette/strip checks passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
