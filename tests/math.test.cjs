const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({alert: message => {throw Error(message);}});
vm.runInContext(fs.readFileSync('madweave.js', 'utf8'), context);

test('HSV primary, secondary, grayscale and hue wrap colors', () => {
  for (const [h, s, v, expected] of [
    [0,1,1,'rgb(255,0,0)'],[60,1,1,'rgb(255,255,0)'],
    [120,1,1,'rgb(0,255,0)'],[180,1,1,'rgb(0,255,255)'],
    [240,1,1,'rgb(0,0,255)'],[300,1,1,'rgb(255,0,255)'],
    [360,1,1,'rgb(255,0,0)'],[-60,1,1,'rgb(255,0,255)'],
    [20,0,1,'rgb(255,255,255)'],[20,1,0,'rgb(0,0,0)'],
  ]) assert.equal(context.HSV_to_RGB(h,s,v), expected);
});

test('RGB → HSV → RGB round trips representative colors within quantization', () => {
  for (const rgb of [[0,0,0],[255,255,255],[255,0,0],[0,255,0],[0,0,255],[220,135,158],[252,205,118],[140,118,241],[17,83,151]]) {
    const hsv = context.RGB_to_HSV(...rgb);
    const actual = context.HSV_to_RGB(...hsv).match(/\d+/g).map(Number);
    actual.forEach((value,i) => assert.ok(Math.abs(value-rgb[i])<=1));
  }
});

test('strip identifiers are unique at every supported size and center', () => {
  for (const center of [false,true]) {
    context.starMadWeaveCenter = center;
    for (let size=1; size<=8; size++) {
      const count=size*3;
      const names=Array.from({length:count*3},(_,i)=>context.name(count,i));
      assert.equal(new Set(names).size,count*3);
      names.forEach(n=>assert.match(n,/^[HRL][abc]\d+$/));
    }
  }
});

test('all built-in patterns stay within the selected color count', () => {
  for (const center of [false,true]) for (let count=1; count<=6; count++) {
    context.colorCount=count;
    for (let pattern=0; pattern<5; pattern++) for (let i=0; i<72; i++) {
      const value=context.colorIndex(pattern,center,24,i);
      assert.ok(Number.isInteger(value) && value>=0 && value<count);
    }
  }
});
