import {Diagram,id,number} from './research/corner-prototype/kernel.mjs';
import {Project} from './research/corner-prototype/project.mjs';

// Integrated version 3. Canonical RGBA equality is material equality; seam conflicts are
// reportable diagram states (user decision), never proof of valid coloring.
export const CornerProject=(()=>{
 const defaults=['rgb(71,127,121)','rgb(189,113,61)','rgb(139,109,165)','rgb(230,195,70)','rgb(50,90,180)','rgb(205,70,100)','rgb(235,235,225)','rgb(40,40,40)'];
 const fail=message=>{throw Error(message);};
 const keys=(v,list)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join('|')!==list.slice().sort().join('|'))fail('Malformed corner project fields');};
 function rgb(value){const m=typeof value==='string'&&/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(value);if(!m||m.slice(1).some(x=>+x>255))fail('Palette colors require RGB channels from 0 to 255');return `rgb(${m.slice(1).map(Number).join(',')})`;}
 const alpha=x=>{if(typeof x!=='number'||!Number.isFinite(x)||x<0||x>1)fail('Opacity must be between zero and one');return x;};
 const rgba=(color,opacity)=>{const c=rgb(color),a=Math.round(alpha(opacity)*1e12)/1e12;return a===0?'transparent':c+'/'+a;};
 const stripKeys=model=>model.certificate.components.map((_,i)=>Project.stripKey(model,i));
 function initial(catalogue,key='excess'){
  const entry=catalogue.examples.find(e=>e.id===key);if(!entry)fail('Unvalidated: unsupported construction');
  const model=new Diagram(catalogue.certificates[key]);model.pattern=entry.default_pattern;
  const s={model,entry,view:{...Project.defaults},selected:null,hits:[],hitIndex:0,crossing:null,anchor:null,crossings:Project.crossings(model)};
  const v=Project.capture(s,catalogue);return {...v,version:3,material:{pattern:model.pattern,overrides:{}},palette:[...defaults],opacity:Array(8).fill(1),recent:defaults.slice(0,4),recentOpacity:Array(4).fill(1),selectedColor:0,controlsHidden:false};
 }
 function migrate(value,catalogue){
  if(value.version===3)return structuredClone(value);
  if(value.version!==1&&value.version!==2)fail('Unvalidated: unsupported corner project version');
  keys(value.material,['pattern']);const pattern=value.material.pattern;
  if(pattern!==null&&(!Number.isInteger(pattern)||pattern<0||pattern>4))fail('Unsupported formula assignment');
  const s=Project.restore({...value,material:{pattern:null}},catalogue),v=Project.capture(s,catalogue);
  return {...v,version:3,material:{pattern,overrides:{}},palette:[...defaults],opacity:Array(8).fill(1),recent:defaults.slice(0,4),recentOpacity:Array(4).fill(1),selectedColor:0,controlsHidden:false};
 }
 function restore(input,catalogue){
  const v=migrate(input,catalogue);keys(v,['format','version','catalogue','construction','material','view','selection','palette','opacity','recent','recentOpacity','selectedColor','controlsHidden']);
  if(v.version!==3)fail('Unvalidated: unsupported corner project version');
  keys(v.material,['pattern','overrides']);const pattern=v.material.pattern;
  if(pattern!==null&&(!Number.isInteger(pattern)||pattern<0||pattern>4))fail('Unsupported formula assignment');
  if(!Array.isArray(v.palette)||v.palette.length!==8||!Array.isArray(v.recent)||v.recent.length!==4)fail('Expected eight palette slots and four recent colors');
  v.palette=v.palette.map(rgb);v.recent=v.recent.map(rgb);
  if(!Array.isArray(v.opacity)||v.opacity.length!==8||!Array.isArray(v.recentOpacity)||v.recentOpacity.length!==4)fail('Malformed palette opacity');
  v.opacity=v.opacity.map(alpha);v.recentOpacity=v.recentOpacity.map(alpha);
  if(!Number.isInteger(v.selectedColor)||v.selectedColor<0||v.selectedColor>7||typeof v.controlsHidden!=='boolean')fail('Invalid palette selection');
  // Validate trusted geometry and local identity through the legacy validator,
  // with neutral monochrome solely for that validation. Restore chosen colors
  // afterwards and explicitly report every real seam discrepancy.
  const base={...v,version:2,material:{pattern:null}};for(const k of ['palette','opacity','recent','recentOpacity','selectedColor','controlsHidden'])delete base[k];
  const s=Project.restore(base,catalogue),model=s.model,ks=stripKeys(model);
  if(!v.material.overrides||typeof v.material.overrides!=='object'||Array.isArray(v.material.overrides))fail('Malformed custom strip assignment');
  for(const [key,slot] of Object.entries(v.material.overrides))if(!ks.includes(key)||!Number.isInteger(slot)||slot<0||slot>7)fail('Invalid custom joined-strip identity or palette slot');
  const baseColor=Diagram.prototype.color;model.pattern=pattern;
  model.color=position=>v.material.overrides[ks[model.owner.get(position)]]??baseColor.call(model,position,pattern);
  const color=position=>{const slot=model.color(position);return rgba(v.palette[slot],v.opacity[slot]);};
  const conflicts=model.certificate.joins.filter(e=>color(id(e.left))!==color(id(e.right)));
  return {...s,value:v,keys:ks,conflicts,colorStatus:conflicts.length?'Invalid':'Validated',distinctColors:new Set([...model.parts.keys()].map(color)).size};
 }
 function capture(s,catalogue){const v=Project.capture(s,catalogue);return {...structuredClone(s.value),...v,version:3,material:structuredClone(s.value.material),selectedColor:s.value.selectedColor,controlsHidden:s.value.controlsHidden};}
 function paint(s,slot,catalogue){if(s.selected===null)fail('Select material to paint');const v=capture(s,catalogue);v.material.overrides[s.keys[s.selected]]=slot;return restore(v,catalogue);}
 return {defaults,rgb,rgba,initial,migrate,restore,capture,paint,stripKeys};
})();
