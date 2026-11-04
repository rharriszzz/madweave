#!/usr/bin/env node
// Audit the actual madweave.js planar crossing logic, without changing it.
// Usage: node research/crossing-audit.cjs [path/to/madweave.js]
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(process.argv[2]||require('node:path').join(__dirname,'..','madweave.js'),'utf8');
function extractFunction(name) {
 const re=new RegExp('function\\s+'+name+'\\s*\\(');
 const m=re.exec(source);assert.ok(m,'Missing source function '+name);
 let start=m.index, brace=source.indexOf('{',start),depth=0,end=-1;
 for(let i=brace;i<source.length;i++){
  if(source[i]==='{')depth++;
  else if(source[i]==='}'&&--depth===0){end=i+1;break;}
 }
 assert.ok(end>0,'Unclosed function '+name);return source.slice(start,end);
}
const names=['getS0FromS','getSOffset','getCFromS0','getCFromSD','isCoveredBy','maskPath'];
const arrays=source.match(/var dname\s*=\s*\[[^;]+;[\s\S]*?var ppi\s*=\s*\[[^;]+;/);
assert.ok(arrays,'Cannot find renderer permutation tables');
const ctx=vm.createContext({Math});
vm.runInContext(names.map(extractFunction).join('\n')+'\n'+arrays[0],ctx);
const results=[];
for(const star of [false,true])for(const alternate of [false,true])for(const hand of [false,true]){
 Object.assign(ctx,{starMadWeaveCenter:star,alternate,hand});
 let disagreements=0,comparisons=0,permutations={},triangleCounts={};
 for(let a=-8;a<=8;a++)for(let b=-8;b<=8;b++)for(let d=0;d<3;d++)for(let e=d+1;e<3;e++){
  const ab=ctx.isCoveredBy(a,d,b,e),ba=ctx.isCoveredBy(b,e,a,d);
  comparisons++;
  if(ab===ba)disagreements++;
 }
 for(let p=0;p<6;p++){
  const perm=Array.from(ctx.ppn[p]);
  assert.deepEqual([...perm].sort(),[0,1,2]);
  const key=Array.from(ctx.pname)[p];
  permutations[key]=perm.join('>');
  const path=ctx.maskPath(9,p);
  triangleCounts[key]=(path.match(/\bM\s/g)||[]).length;
 }
 assert.equal(disagreements,0,'Pairwise crossing relation must be antisymmetric');
 assert.ok(Object.values(triangleCounts).some(n=>n>0),'No crossing masks generated');
 results.push({starMadWeaveCenter:star,alternate,hand,pairComparisons:comparisons,antisymmetryFailures:disagreements,topToBottomByMask:permutations,maskTriangleCounts:triangleCounts});
}
console.log(JSON.stringify({source:'original madweave.js functions',scope:'planar crossing masks',configurations:results.length,results},null,2));
