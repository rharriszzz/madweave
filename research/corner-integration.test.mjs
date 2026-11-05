import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {CornerProject} from '../corner-model.mjs';import {BUNDLE} from './corner-prototype/bundle.mjs';
const catalogue=BUNDLE.catalogue,out=new URL('./output/corner-integration/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const cases=[],expected=[];let roundTrips=0;
assert.throws(()=>CornerProject.restore({...CornerProject.initial(catalogue),version:999},catalogue),/unsupported corner project version/);
for(const entry of catalogue.examples){
 for(const variant of ['formula','alias','transparent-alias','subquantum-alias','custom','custom-three'])for(const pattern of [null,0,1,2,3,4]){
  const value=CornerProject.initial(catalogue,entry.id);value.material.pattern=pattern;
  value.opacity=[1,.6,.35,0,.8,.5,1,.2];
  if(variant==='alias'){value.palette[1]=value.palette[2]=value.palette[0];value.opacity[0]=value.opacity[1]=value.opacity[2]=.5;}
  if(variant==='transparent-alias'||variant==='subquantum-alias')value.opacity[0]=value.opacity[1]=value.opacity[2]=variant==='transparent-alias'?0:1e-13;
  let state=CornerProject.restore(value,catalogue);
  if(variant==='alias'||variant==='transparent-alias'||variant==='subquantum-alias'){assert.equal(state.conflicts.length,0);assert.equal(state.distinctColors,1);}
  if(variant==='custom'||variant==='custom-three'){state.keys.forEach((key,i)=>value.material.overrides[key]=i%(variant==='custom-three'?3:8));state=CornerProject.restore(value,catalogue);assert.equal(state.conflicts.length,0);}
  // Include local self-crossing/hidden positions in semantic persistence.
  const event=state.crossings.find(a=>a.event.pair.every(p=>state.model.owner.get(p.join(':'))===state.model.owner.get(a.event.pair[0].join(':'))))||state.crossings[0];
  if(event){const n=x=>String(x).split('/').map(Number).reduce((a,b)=>a/b),[X,Y]=event.event.XY.map(n),point=[X/Math.sqrt(3),Y],j=event.event.pair[0][0];state.hits=state.model.pick(state.model.map(point,j));state.hitIndex=state.hits.length-1;state.selected=state.hits[state.hitIndex].strip;state.anchor={sector:j,point};state.crossing=event.index;}
  const saved=CornerProject.capture(state,catalogue),restored=CornerProject.restore(JSON.parse(JSON.stringify(saved)),catalogue);assert.deepEqual(CornerProject.capture(restored,catalogue),saved);
  const colors=[...restored.model.parts.keys()].map(key=>{const slot=restored.model.color(key);return {id:key.split(':').map(Number),slot,rgb:saved.palette[slot],opacity:saved.opacity[slot]};});
  cases.push({certificateId:entry.id,palette:saved.palette,opacity:saved.opacity,material:saved.material,colors});expected.push({colorStatus:state.colorStatus,conflicts:state.conflicts.map(e=>({left:e.left,right:e.right})),distinctColors:state.distinctColors});roundTrips++;
 }
}
const precisionCases=[];
for(const opacity of [4.999999999999999e-13,.5/1e12,(.5+Number.EPSILON/2)/1e12,1-1e-13]){
 const v=CornerProject.initial(catalogue);v.material.pattern=0;v.opacity[0]=v.opacity[1]=v.opacity[2]=opacity;const s=CornerProject.restore(v,catalogue),colors=[...s.model.parts.keys()].map(key=>{const slot=s.model.color(key);return {id:key.split(':').map(Number),slot,rgb:v.palette[slot],opacity:v.opacity[slot]};});
 cases.push({certificateId:s.entry.id,palette:v.palette,opacity:v.opacity,material:v.material,colors});expected.push({colorStatus:s.colorStatus,conflicts:s.conflicts.map(e=>({left:e.left,right:e.right})),distinctColors:s.distinctColors});precisionCases.push({opacity,colorStatus:s.colorStatus,distinctColors:s.distinctColors});
}
const file=new URL('color-cases.json',out);fs.writeFileSync(file,JSON.stringify({certificates:catalogue.certificates,cases}));
const result=spawnSync('python3',['research/check-corner-colors.py',file.pathname],{encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(result.status,0,result.stdout+result.stderr);const checked=JSON.parse(result.stdout);assert.equal(checked.length,cases.length);
checked.forEach((r,i)=>{for(const k of ['colorStatus','conflicts','distinctColors'])assert.deepEqual(r[k],expected[i][k]);});
// Deliberately corrupt actual colors, palette coverage and component keys.
const sample=structuredClone(cases.find(c=>Object.keys(c.material.overrides).length));const mutations=[];
for(const name of ['wrong-color','missing','duplicate','unknown-component']){const c=structuredClone(sample);if(name==='wrong-color')c.colors[0].rgb='rgb(1,2,3)';if(name==='missing')c.colors.pop();if(name==='duplicate')c.colors.push(c.colors[0]);if(name==='unknown-component')c.material.overrides['99:0:0']=2;const f=new URL('bad-'+name+'.json',out);fs.writeFileSync(f,JSON.stringify({...c,certificate:catalogue.certificates[c.certificateId]}));const run=spawnSync('python3',['research/check-corner-colors.py',f.pathname],{encoding:'utf8'});assert.equal(run.status,1,name);mutations.push({name,result:JSON.parse(run.stdout)});}
// Hidden RGB is still authoritative palette data, even though zero-alpha colors
// are equivalent for seam continuity and have identical visible appearance.
const hidden=structuredClone(cases.find(c=>c.opacity.slice(0,3).every(a=>a===0)));hidden.colors[0].rgb='rgb(1,2,3)';const hiddenFile=new URL('bad-hidden-rgb.json',out);fs.writeFileSync(hiddenFile,JSON.stringify({...hidden,certificate:catalogue.certificates[hidden.certificateId]}));const hiddenRun=spawnSync('python3',['research/check-corner-colors.py',hiddenFile.pathname],{encoding:'utf8'});assert.equal(hiddenRun.status,1);mutations.push({name:'hidden-rgb',result:JSON.parse(hiddenRun.stdout)});
const evidence={constructions:catalogue.examples.length,roundTrips,independentCases:checked.length,precisionCases,variants:['formula','alias','transparent-alias','subquantum-alias','custom','custom-three'],warnings:checked.filter(a=>a.colorStatus==='Invalid').length,mutations};fs.writeFileSync(new URL('semantic.json',out),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence,null,2));
