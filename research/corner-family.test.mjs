// Exhaustive semantic round trips and unchanged subdivision budgets. Browser
// sampling is separate and explicitly reported, not inferred from this test.
import fs from 'node:fs';import assert from 'node:assert/strict';import {performance} from 'node:perf_hooks';
import {BUNDLE} from './corner-prototype/bundle.mjs';
import {Project} from './corner-prototype/project.mjs';
import {makePackage} from './corner-prototype/offline.mjs';
import {Diagram,id,number} from './corner-prototype/kernel.mjs';
const catalogue=BUNDLE.catalogue,pack=makePackage(BUNDLE),rows=[];
const colorOracles=JSON.parse(fs.readFileSync(new URL('./evidence/corner-family-color-oracles.json',import.meta.url)));
const semantic=s=>({p:s.model.p,components:s.model.certificate.components,joins:s.model.certificate.joins,orders:s.model.certificate.orders,crossings:s.model.certificate.crossings,
 colors:[...s.model.parts.keys()].map(k=>[k,s.model.color(k)]),state:Project.capture(s,catalogue)});
let assignments=0,negative=0,totalSegments=0,largestHTML=0,maxBound=0,boundaryChecks=0;
for(const entry of catalogue.examples){
 const start=performance.now(),certificate=catalogue.certificates[entry.id],model=new Diagram(certificate),view={...Project.defaults,rotation:[0,23,90,-137][rows.length%4]};
 model.rotation=view.rotation*Math.PI/180;
 const s={model,entry,view,selected:0,hits:[],hitIndex:0,crossing:null,crossings:Project.crossings(model),anchor:null};
 const event=s.crossings.find(a=>a.event.pair.every(b=>model.owner.get(id(b))===model.owner.get(id(a.event.pair[0]))))||s.crossings[0];
 if(event){
  const [X,Y]=event.event.XY.map(number),point=[X/Math.sqrt(3),Y];
  s.anchor={sector:event.event.pair[0][0],point};s.hits=model.pick(model.map(point,s.anchor.sector));s.hitIndex=s.hits.length-1;s.selected=s.hits[s.hitIndex].strip;s.crossing=event.index;
  if(entry.counts.self_crossings){assert.notEqual(s.hits[0].position,s.hits[1].position);assert.equal(s.hits[0].strip,s.hits[1].strip);}
 }
 const beforeMaterials=JSON.stringify({pieces:certificate.pieces,components:certificate.components,joins:certificate.joins,orders:certificate.orders,crossings:certificate.crossings});
 if(!catalogue.legacyIds.includes(entry.id))assert.throws(()=>Project.restore({...Project.capture(s,catalogue),version:1,catalogue:'corner-nine-v1'},catalogue),/not in the version-1 catalogue/);
 let maxHTML=0,accepted=0;
 for(const pattern of [null,0,1,2,3,4]){
  model.pattern=pattern;const expected=pattern===null||entry.patterns[pattern].valid,state=Project.capture(s,catalogue);
  assert.deepEqual(colorOracles[entry.id].positions,[...model.parts.keys()]);
  assert.deepEqual([...model.parts.keys()].map(k=>model.color(k)),colorOracles[entry.id].patterns[pattern===null?'mono':String(pattern)],'Material colors differ from independent checker assignments');
  assert.equal(model.compatibility(pattern).status==='Validated',expected);
  if(!expected){assert.throws(()=>Project.restore(state,catalogue),/Color conflict/);negative++;continue;}
  const encoded=JSON.stringify(state),restored=Project.restore(Project.parse(encoded),catalogue);
  assert.deepEqual(semantic(restored),semantic(s));
  const html=pack.html(state),bytes=Buffer.byteLength(html);assert(html.length<=10*1024*1024,'Saved file exceeds its import text limit');
  assert.deepEqual(semantic(Project.restore(Project.parse(html),catalogue)),semantic(s));
  maxHTML=Math.max(maxHTML,bytes);assignments++;accepted++;
  if(catalogue.legacyIds.includes(entry.id)){
   const v1={...state,version:1,catalogue:'corner-nine-v1'};
   assert.deepEqual(semantic(Project.restore(v1,catalogue)),semantic(s));
  }
 }
 // Actual rational region data remain identical; no material is rewritten to
 // make a pattern, tessellation budget or save-file limit pass.
 assert.equal(JSON.stringify({pieces:certificate.pieces,components:certificate.components,joins:certificate.joins,orders:certificate.orders,crossings:certificate.crossings}),beforeMaterials);
 model.pattern=null;let segments=0,circular=0;
 for(const mesh of [...model.parts.keys()].map(k=>model.pieceMesh(k,.00009375)).concat(model.cells.map(c=>model.mesh(c.edges,c.j,.00009375)))){
  for(const segment of mesh.segments){assert(segment.bound<=.00009375+1e-12);maxBound=Math.max(maxBound,segment.bound);if(segment.kind==='circle')circular++;segments++;}
 }
 for(const rotation of [0,23,90,-137]){
  model.rotation=rotation*Math.PI/180;
  for(let j=0;j<=model.m;j++)for(const delta of [-1e-8,0,1e-8]){
   const phi=model.rotation+j*2*Math.PI/model.m+delta,r=1.7,p=[model.center[0]+r*Math.cos(phi),model.center[1]+r*Math.sin(phi)];
   const inverse=model.inverse(p),wanted=(j+(delta<0?-1:0)+model.m)%model.m;
   assert.equal(inverse.j,wanted);const hits=model.pick(p);assert.equal(new Set(hits.map(a=>a.position)).size,hits.length);boundaryChecks++;
  }
  assert.deepEqual(model.pick(model.center),[]);
 }
 largestHTML=Math.max(largestHTML,maxHTML);totalSegments+=segments;
 rows.push({id:entry.id,parameters:model.p,acceptedPatterns:accepted,maxHTMLBytes:maxHTML,meshSegments:segments,circularSegments:circular,totalMilliseconds:performance.now()-start});
}
// Import the actual unchanged Stage 3A worked file, not a synthetic v1 flag.
for(const file of ['01-self-23.corner.html','02-self-90.corner.html']){
 const old=Project.parse(fs.readFileSync(new URL('./evidence/corner-stage3a-worked/'+file,import.meta.url),'utf8'));
 assert.equal(old.version,1);const restored=Project.capture(Project.restore(old,catalogue),catalogue);
 assert.deepEqual(restored,{...old,version:2,catalogue:catalogue.id});
 const other=structuredClone(old);other.selection.local.active=other.selection.local.positions.find(a=>a!==other.selection.local.active);
 assert.deepEqual(Project.capture(Project.restore(other,catalogue),catalogue),{...other,version:2,catalogue:catalogue.id});
}
const evidence={catalogue:catalogue.id,constructions:rows.length,assignments,rejectedColors:negative,boundaryChecks,totalSegments,maxBound,largestHTMLBytes:largestHTML,bundleBytes:fs.statSync(new URL('./corner-prototype/bundle.mjs',import.meta.url)).size,legacyWorkedFiles:true,rows};
fs.mkdirSync(new URL('./output/corner-family/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('./output/corner-family/semantic.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({...evidence,rows:undefined},null,2));
