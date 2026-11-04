#!/usr/bin/env node
// Characterize every original SVG control through its actual event handler.
const {chromium} = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const OUT = 'research/output/buttons';
const sequence = (prefix, start, end) => Array.from({length:end-start+1}, (_,i)=>prefix+(start+i));
const expectedControls = [
  ...sequence('CP',0,4), ...sequence('CC',1,6), ...sequence('SC',1,8),
  'I','V', ...sequence('C',0,7), ...sequence('LAST',0,3), 'OB','HB','SB','VB',
  'HideButtons','-','X','C', ...sequence('VH',0,2), ...sequence('VD',0,2),
  'Lines', ...sequence('Sep',0,3),
].sort();

(async()=>{
  const browser = await chromium.launch({headless:true});
  const observations = [], errors = [], exercised = new Set(), knownBehaviors = [];
  fs.mkdirSync(OUT,{recursive:true});
  try {
    const page = await browser.newPage({viewport:{width:1500,height:1100}});
    page.on('pageerror', error=>errors.push(error.message));
    await page.goto(process.env.MADWEAVE_URL || 'http://127.0.0.1:8766/editor.html');
    const frame = page.frameLocator('#weave');
    const svg = frame.locator('#svg');
    await frame.locator('#cbuttonCP0').waitFor();
    const inventory = await svg.evaluate(root=>[...root.querySelectorAll('#buttons [id^="cbutton"]')].map(el=>el.id.slice(7)).sort());
    assert.deepEqual(inventory, expectedControls, 'Control inventory changed; update tests and reference');

    async function read(label) {
      const result = await svg.evaluate(root=>{
        const w=root.ownerDocument.defaultView;
        return {
          colorPattern:w.colorPattern, colorCount:w.colorCount, baseSize:w.baseSize,
          hand:w.hand, alternate:w.alternate, starMadWeaveCenter:w.starMadWeaveCenter,
          showC:[...w.showC], showD:[...w.showD], showingLines:w.showingLines,
          separationIndex:w.separationIndex, stripSpacing:w.stripSpacing,
          defaultColorIndex:w.defaultColorIndex, hideStrips:w.hideStrips, showStrips:w.showStrips,
          hidingButtons:w.hidingButtons, processing:w.processing,
          colors:[...w.colorIndexArray], visible:[...w.visibilityIndexArray],
          palette:[...w.colorArray], opacity:[...w.opacityArray],
          lastColor:[...w.lastColor], lastOpacity:[...w.lastOpacity],
          strips:[...root.querySelectorAll('path[mwColorIndex]')].map(p=>({
            fill:p.getAttribute('fill'), visibility:p.parentElement.getAttribute('visibility'),
            path:p.getAttribute('d'), transform:p.getAttribute('transform'),
          })),
          lines:root.querySelectorAll('defs path[id^="LP"]').length,
          hiddenControlGroups:[...root.querySelectorAll('#buttons > g')].filter(g=>g.getAttribute('visibility')==='hidden').map(g=>g.id),
          viewBox:root.getAttribute('viewBox'),
        };
      });
      assert.equal(result.processing,false,'Renderer stuck processing');
      assert.equal(result.strips.length,9*result.baseSize);
      assert(!result.viewBox.includes('NaN'));
      if(label) observations.push({label,...result});
      return result;
    }
    async function press(name, ratio) {
      const control=frame.locator('[id="cbutton'+name+'"]');
      if(ratio===undefined) await control.dispatchEvent('mousedown');
      else {
        const box=await control.boundingBox();
        assert(box,'Missing pointer target '+name);
        await page.mouse.click(box.x+box.width*ratio,box.y+box.height/2);
      }
      exercised.add(name);
      return read(name);
    }
    async function paint(index=0) {
      // Tests strip actions separately from hover hysteresis (covered by editor-hover-paint).
      await svg.evaluate((root,index)=>root.ownerDocument.defaultView.setStripColorToCurrentDefault(root,index),index);
    }
    async function customStrip() {
      await press('C7'); await paint(); await press('I'); await paint();
      await press('C7'); // Leave hide mode; selected index was already 7.
      const state=await read();
      assert.equal(state.colors[0],7); assert.equal(state.visible[0],false);
    }
    function resetEdits(state) {
      assert(state.visible.every(Boolean),'Individual visibility was not reset');
      assert(state.colors.every(c=>c>=0&&c<state.colorCount),'Pattern colors out of range');
      assert.notEqual(state.colors[0],7,'Manual color was not reset');
    }

    await read('initial');
    for(let pattern=0;pattern<5;pattern++) {
      await customStrip();
      const state=await press('CP'+pattern);
      assert.equal(state.colorPattern,pattern); resetEdits(state);
    }
    for(let count=1;count<=6;count++) {
      await customStrip();
      const state=await press('CC'+count);
      assert.equal(state.colorCount,count); resetEdits(state);
    }
    for(let size=1;size<=8;size++) {
      await customStrip();
      const state=await press('SC'+size);
      assert.equal(state.baseSize,size); resetEdits(state);
    }
    await press('SC2'); await press('CP0'); await press('CC3');
    await customStrip();
    const custom=await read();
    const unchangedSize=await press('SC2');
    assert.deepEqual(unchangedSize.colors,custom.colors,'Same size must preserve edits');
    assert.deepEqual(unchangedSize.visible,custom.visible);

    for(const [button,field] of [['-','hand'],['X','alternate'],['C','starMadWeaveCenter'],['Lines','showingLines']]) {
      const before=await read();
      const first=await press(button), second=await press(button);
      assert.equal(first[field],!before[field]); assert.equal(second[field],before[field]);
      assert.deepEqual(second.colors,before.colors); assert.deepEqual(second.visible,before.visible);
      if(button==='Lines') { assert.equal(first.lines,18); assert.equal(second.lines,0); }
      else assert.deepEqual(first.strips.map(p=>[p.path,p.transform]),before.strips.map(p=>[p.path,p.transform]),'Orientation moved physical strips');
    }
    // Clear manual hidden state for exact visibility counts.
    await press('CP0');
    for(const prefix of ['VH','VD']) for(let i=0;i<3;i++) {
      const field=prefix==='VH'?'showC':'showD';
      const hidden=await press(prefix+i);
      assert.equal(hidden[field][i],false);
      assert.equal(hidden.strips.filter(p=>p.visibility==='visible').length,12);
      const restored=await press(prefix+i);
      assert.deepEqual(restored[field],[true,true,true]);
      assert.equal(restored.strips.filter(p=>p.visibility==='visible').length,18);
    }
    await customStrip();
    const edits=await read();
    for(let spacing=0;spacing<4;spacing++) {
      const state=await press('Sep'+spacing);
      assert.equal(state.separationIndex,spacing);
      assert.equal(state.stripSpacing,[.07,.33,.8,2][spacing]);
      assert.deepEqual(state.colors,edits.colors); assert.deepEqual(state.visible,edits.visible);
    }
    await press('Sep1');

    for(let index=0;index<8;index++) {
      const state=await press('C'+index);
      assert.equal(state.defaultColorIndex,index);
      assert.equal(state.hideStrips,false); assert.equal(state.showStrips,false);
    }
    await press('C0'); await paint();
    const painted=await read();
    assert.equal(painted.colors[0],0); assert.equal(painted.visible[0],true);
    await press('I'); await paint();
    const hidden=await read();
    assert.equal(hidden.hideStrips,true); assert.equal(hidden.showStrips,false);
    assert.equal(hidden.visible[0],false); assert.equal(hidden.colors[0],0);
    const modeExit=await press('C6');
    assert.equal(modeExit.hideStrips,false); assert.equal(modeExit.defaultColorIndex,0);
    knownBehaviors.push('First palette click after I/V leaves the mode but retains the prior swatch; a second click selects the requested swatch.');
    const selected=await press('C6'); assert.equal(selected.defaultColorIndex,6);
    const visibleMode=await press('V');
    assert.equal(visibleMode.showStrips,true); assert.equal(visibleMode.hideStrips,false);
    await paint();
    const shown=await read();
    assert.equal(shown.visible[0],true); assert.equal(shown.colors[0],6);
    knownBehaviors.push('V currently recolors a shown strip with the selected swatch, contrary to its tooltip. Characterization only; desired behavior needs a separate fix.');
    for(const slider of ['OB','HB','SB','VB']) await press(slider,.36);
    const ignored=await read();
    assert.deepEqual(ignored.palette,shown.palette,'Sliders should ignore V mode');
    assert.deepEqual(ignored.opacity,shown.opacity);
    await press('LAST0');
    const ignoredRecent=await read();
    assert.deepEqual(ignoredRecent.palette,shown.palette,'Recent colors should ignore V mode');
    const afterV=await press('C0');
    assert.equal(afterV.showStrips,false); assert.equal(afterV.defaultColorIndex,6);
    const afterSecondSwatch=await press('C0'); assert.equal(afterSecondSwatch.defaultColorIndex,0);
    for(const [slider,field] of [['OB','opacity'],['HB','hue'],['SB','sat'],['VB','value']]) {
      await press(slider,.36);
      const actual=await svg.evaluate((root,field)=>{
        const w=root.ownerDocument.defaultView;
        return w[{opacity:'currentOpacity',hue:'currentHue',sat:'currentSat',value:'currentValue'}[field]];
      },field);
      const scale=field==='hue'?360:1;
      assert(Math.abs(actual-.36*scale)<.035*scale,'Slider position '+slider);
    }
    // Populate history with real palette changes; verify color AND opacity recall.
    for(let index=1;index<6;index++) {
      await press('C'+index);
      await press('OB',.15+.1*index);
    }
    const recalledOpacities=new Set();
    for(let index=0;index<4;index++) {
      const before=await read();
      const state=await press('LAST'+index);
      assert.equal(state.palette[state.defaultColorIndex],before.lastColor[index]);
      assert.equal(state.opacity[state.defaultColorIndex],before.lastOpacity[index]);
      recalledOpacities.add(state.opacity[state.defaultColorIndex]);
    }
    assert(recalledOpacities.size>1,'Recent-opacity checks need distinct history values');
    const hiddenControls=await press('HideButtons');
    assert.equal(hiddenControls.hidingButtons,true);
    assert.equal(hiddenControls.hiddenControlGroups.length,expectedControls.length-1);
    assert(!hiddenControls.hiddenControlGroups.includes('gbuttonHideButtons'));
    const restoredControls=await press('HideButtons');
    assert.equal(restoredControls.hidingButtons,false);
    assert.deepEqual(restoredControls.hiddenControlGroups,[]);
    assert.deepEqual([...exercised].sort(),expectedControls,'Some controls were not exercised');
    assert.deepEqual(errors,[]);
    await svg.screenshot({path:OUT+'/editor-after-controls.png'});
    console.log(JSON.stringify({controls:expectedControls.length,observations:observations.length,knownBehaviors,errors},null,2));
  } finally {
    fs.writeFileSync(OUT+'/observations.json',JSON.stringify({errors,inventory:expectedControls,exercised:[...exercised].sort(),knownBehaviors,observations},null,2));
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
