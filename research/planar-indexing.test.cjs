#!/usr/bin/env node
// Execute the original engine; compare its indexing with physical strip identities.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const engine = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'madweave.js'), 'utf8'), engine);
const {getS, getD, getC, getN} = engine;
const results=[];
for(const star of [false,true]){
 for(const baseSize of [1,2,3,4,5,6,7,8]){
  const n=3*baseSize;
  const counts=[0,0,0], samples=[];
  for(let i=0;i<3*n;i++){
   const d=getD(n,i),s=getS(n,i),c=getC(star,n,i);
   assert.equal(i,d*n+s);
   assert.ok(d>=0&&d<3&&s>=0&&s<n);
   assert.ok(c>=0&&c<3);
   if(s+3<n)assert.equal(getC(star,n,i+3),c);
   const expectedS0=s+(star ? 3-d : 0);
   assert.equal(c, expectedS0%3);
   assert.equal(getN(star,n,i), Math.floor(expectedS0/3));
   counts[c]++;
   if(s<3)samples.push({direction:d,strip:s,class:c,group:getN(star,n,i)});
  }
  // n is divisible by three, so each direction has equal class counts.
  assert.deepEqual(counts,[n,n,n]);
  results.push({starMadWeaveCenter:star,baseSize,stripsPerDirection:n,classCounts:counts,samples});
 }
}
console.log(JSON.stringify({scope:'planar strip indexing only',passed:results.length,results},null,2));
