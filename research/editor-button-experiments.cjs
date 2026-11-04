#!/usr/bin/env node
// Exercise the actual original SVG editor controls, not a replica.
const {chromium}=require('playwright'),fs=require('node:fs');
(async()=>{
const browser=await chromium.launch({headless:true});
try{
const page=await browser.newPage({viewport:{width:1500,height:1100}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8766/editor.html');
const frame=page.frameLocator('#weave');
await frame.locator('#cbuttonCP0').waitFor();
fs.mkdirSync('research/output/buttons',{recursive:true});
const observations=[];
async function snapshot(label){
 const data=await frame.locator('#svg').evaluate(svg=>{
 const w=svg.ownerDocument.defaultView;
 const paths=[...svg.querySelectorAll('defs g[id$="Strips"] path[id^="P"]')];
 return {colorPattern:w.colorPattern,colorCount:w.colorCount,baseSize:w.baseSize,hand:w.hand,alternate:w.alternate,starMadWeaveCenter:w.starMadWeaveCenter,showC:Array.from(w.showC),showD:Array.from(w.showD),showingLines:w.showingLines,separationIndex:w.separationIndex,stripCount:paths.length,firstStripFill:paths[0]?.getAttribute('fill'),firstStripColorIndex:paths[0]?.getAttribute('mwColorIndex'),viewBox:svg.getAttribute('viewBox')};
 });
 observations.push({label,...data});
 return data;
}
async function click(name,label){await frame.locator('#cbutton'+name).dispatchEvent('mousedown');return snapshot(label||name);}
const base=await snapshot('initial');
for(const name of ['CP1','CP2','CP3','CP4','CP0','CC2','CC3','SC3','SC2','-','X','C','VH0','VH0','VD0','VD0','Lines','Lines','Sep0','Sep2','Sep1','C','X','-']){
 await click(name);
}
for(const name of ['C0','C1','I','V'])await click(name);
await frame.locator('#svg').screenshot({path:'research/output/buttons/editor-after-controls.png'});
fs.writeFileSync('research/output/buttons/observations.json',JSON.stringify({errors,observations},null,2));
if(errors.length)throw Error(errors.join('; '));
if(observations.length<20)throw Error('Insufficient observations'); 
const byLabel=Object.fromEntries(observations.map(o=>[o.label,o]));
if(byLabel.CP1.colorPattern!==1||byLabel.CP4.colorPattern!==4)throw Error('Color pattern buttons did not change state');
if(byLabel.CC2.colorCount!==2||byLabel.CC3.colorCount!==3)throw Error('Color count buttons failed');
if(byLabel.SC3.baseSize!==3||byLabel.SC2.baseSize!==2)throw Error('Size buttons failed');
if(byLabel['-'].hand!==true||byLabel.X.alternate!==true||byLabel.C.starMadWeaveCenter!==true)throw Error('Geometry switches failed');
if(byLabel.Sep0.separationIndex!==0||byLabel.Sep2.separationIndex!==2||byLabel.Sep1.separationIndex!==1)throw Error('Spacing switches failed');
console.log(JSON.stringify({observations:observations.length,errors},null,2));
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
