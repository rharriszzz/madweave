// The released runtime, complete strips, individual ends, and saved tail selection.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {CornerProject} from '../corner-model.mjs';

const context={window:{},structuredClone,DecompressionStream,Response,Blob,atob};
vm.runInNewContext(fs.readFileSync('corner-runtime.js','utf8'),context);
await context.window.MadWeaveCornerReady;
const {catalogue,CornerProject:bundled}=context.window.MadWeaveCornerCore;
const output=new URL('./output/corner-size/',import.meta.url);
fs.mkdirSync(output,{recursive:true});
const cases=[],certificates={};let checked=0,tailSelections=0,extremeMeshes=0;
const json=value=>JSON.parse(JSON.stringify(value));
for(const entry of catalogue.examples){
 const cert=catalogue.certificates[entry.id],p=cert.parameters;
 if(p.end_style!=='strip')continue;
 const value=CornerProject.initial(catalogue,entry.id);
 value.opacity[0]=.65;value.opacity[1]=.3;
 let state=CornerProject.restore(value,catalogue);
 value.material.overrides[state.keys[0]]=7;
 state=CornerProject.restore(value,catalogue);
 const total=(p.member===null?9:3)*p.size*p.beta/360;
 assert.equal(state.keys.length,Math.floor(total+.5),entry.id);
 assert(cert.components.every(c=>c.outer_ends===2),entry.id);
 if(p.beta===360)assert.equal(state.keys.length,(p.member===null?9:3)*p.size);
 const saved=CornerProject.capture(state,catalogue);
 assert.deepEqual(json(bundled.capture(bundled.restore(saved,catalogue),catalogue)),json(saved));
 assert.deepEqual(CornerProject.capture(CornerProject.restore(json(saved),catalogue),catalogue),saved);
 checked++;
 if(entry.config.phase==='mad-sixfold'&&p.size===8&&p.W_over_P==='100/107'&&[60,720].includes(p.beta)){
  const epsilon=state.model.W/8000;
  const meshes=[...[...state.model.parts.keys()].map(key=>state.model.pieceMesh(key,epsilon)),...state.model.cells.map(cell=>state.model.mesh(cell.edges,cell.j,epsilon))];
  assert(meshes.every(mesh=>mesh.segments.every(segment=>segment.bound<=epsilon)),'Extreme-angle meshes retain their error bound');
  extremeMeshes++;
 }
 if(p.W_over_P==='100/133'&&[1,2,8].includes(p.size)&&[360,480].includes(p.beta)){
  let tail;
  for(const [position,poly]of state.model.polygons){
   const mean=[0,1].map(i=>poly.reduce((sum,a)=>sum+a[i],0)/poly.length);
   const point=poly.map(a=>a.map((x,i)=>x*.98+mean[i]*.02)).find(a=>Math.hypot(...a)>state.model.R+.001);
   if(point){tail={position,point};break;}
  }
  assert(tail,'A real strip end must extend beyond the working circle');
  const sector=state.model.parts.get(tail.position).id[0];
  state.hits=state.model.pick(state.model.map(tail.point,sector));
  assert(state.hits.some(h=>h.position===tail.position),'Tail hit testing includes the extended material');
  state.hitIndex=state.hits.findIndex(h=>h.position===tail.position);
  state.selected=state.hits[state.hitIndex].strip;state.anchor={sector,point:tail.point};
  const selected=CornerProject.capture(state,catalogue);
  assert.deepEqual(CornerProject.capture(CornerProject.restore(json(selected),catalogue),catalogue),selected);
  tailSelections++;
  certificates[entry.id]=cert;
  cases.push({certificateId:entry.id,palette:value.palette,opacity:value.opacity,material:value.material,
   colors:[...state.model.parts.keys()].map(key=>{const slot=state.model.color(key);return {id:key.split(':').map(Number),slot,rgb:value.palette[slot],opacity:value.opacity[slot]};})});
 }
}
assert.equal(checked,1728);
const file=new URL('colors.json',output);fs.writeFileSync(file,JSON.stringify({certificates,cases}));
const check=spawnSync('python3',['research/check-corner-colors.py',file.pathname],{encoding:'utf8',maxBuffer:10*1024*1024});
assert.equal(check.status,0,check.stdout+check.stderr);
assert.equal(JSON.parse(check.stdout).length,cases.length);
const sample=structuredClone(Object.values(certificates)[0]);
for(const mutation of ['end-cut','missing-tail','missing-overlap','partial-strip']){
 const bad=structuredClone(sample);
 if(mutation==='end-cut')bad.pieces[0].vertices[0][0]='1000';
 if(mutation==='missing-tail')bad.pieces.pop();
 if(mutation==='missing-overlap')bad.orders.pop();
 if(mutation==='partial-strip')bad.parameters.strip_seeds.pop();
 const path=new URL(mutation+'.json',output);fs.writeFileSync(path,JSON.stringify(bad));
 const result=spawnSync('python3',['research/check-corner-certificate.py',path.pathname],{encoding:'utf8'});
 assert.equal(result.status,1,mutation+' must fail independent validation');
}
assert.equal(extremeMeshes,2);
console.log(JSON.stringify({constructions:checked,tailSelections,extremeMeshes,independentColorCases:cases.length,negativeControls:4}));
