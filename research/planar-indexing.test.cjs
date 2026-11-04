#!/usr/bin/env node
// Planar-only indexing and color-class experiments based on the original
// getS/getD/getSOffset/getS0FromS0/getC/getN functions in madweave.js.
// No geometry or crossing claims are made by these tests.
const assert = require('node:assert/strict');
function getS(n,i){return i%n;}
function getD(n,i){return Math.floor(i/n);}
function getSOffset(star,d){return star?3-d:0;}
function getS0(star,d,s){return s+getSOffset(star,d);}
function getC(star,n,i){return getS0(star,getD(n,i),getS(n,i))%3;}
function getN(star,n,i){return Math.floor(getS0(star,getD(n,i),getS(n,i))/3);}
const results=[];
for(const star of [false,true]){
 for(const baseSize of [2,3,4,5,6,8]){
  const n=3*baseSize;
  const counts=[0,0,0], samples=[];
  for(let i=0;i<3*n;i++){
   const d=getD(n,i),s=getS(n,i),c=getC(star,n,i);
   assert.equal(i,d*n+s);
   assert.ok(d>=0&&d<3&&s>=0&&s<n);
   assert.ok(c>=0&&c<3);
   if(s+3<n)assert.equal(getC(star,n,i+3),c);
   counts[c]++;
   if(s<3)samples.push({direction:d,strip:s,class:c,group:getN(star,n,i)});
  }
  // n is divisible by three, so each direction has equal class counts.
  assert.deepEqual(counts,[n,n,n]);
  results.push({starMadWeaveCenter:star,baseSize,stripsPerDirection:n,classCounts:counts,samples});
 }
}
console.log(JSON.stringify({scope:'planar strip indexing only',passed:results.length,results},null,2));
