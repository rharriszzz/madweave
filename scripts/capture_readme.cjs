// Real built editor screenshots. npm ci && npm run screenshots
// Optional MADWEAVE_CHROMIUM_EXECUTABLE selects a locally installed browser.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs/images');
fs.mkdirSync(output, {recursive: true});
const built = spawnSync('python3', ['scripts/build_site.py'], {cwd: root, encoding: 'utf8'});
assert.equal(built.status, 0, built.stderr);
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://local');
  const name = url.pathname.replace(/^\/madweave\//, '');
  const file = path.resolve(root, 'dist', name);
  if (!url.pathname.startsWith('/madweave/') || !file.startsWith(path.join(root, 'dist') + path.sep)) return res.writeHead(404).end();
  fs.readFile(file, (error, body) => {
    if (error) return res.writeHead(404).end();
    res.setHeader('Content-Type', {'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'}[path.extname(file)] || 'text/html');
    res.end(body);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({executablePath: process.env.MADWEAVE_CHROMIUM_EXECUTABLE});
  try {
    const page = await browser.newPage({viewport:{width:1000,height:1000},deviceScaleFactor:1});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/madweave/editor.html`);
    await page.waitForFunction(() => !document.querySelector('#save-project').disabled);
    const button = name => page.frameLocator('#weave').locator('#cbutton'+name).click();
    async function capture(name) {
      await page.mouse.move(0,0);
      await page.evaluate(() => document.activeElement?.blur());
      await page.waitForTimeout(250);
      await page.locator('.canvas').screenshot({path:path.join(output,name+'.png')});
      console.log(name);
    }
    // Reopen the original fiberwoman.com design through the current editor.
    // The repository SVG is byte-identical to that reference (see SCREENSHOTS.md).
    const original = fs.readFileSync(path.join(root, 'madweave.svg'), 'utf8');
    const expected = await page.evaluate(text => MadWeaveProject.parse(text), original);
    await page.locator('#project-file').setInputFiles(path.join(root, 'madweave.svg'));
    await page.waitForFunction(() => document.querySelector('#export-status').textContent.startsWith('Opened '));
    assert.deepEqual(await page.evaluate(() => MadWeaveEditor.capture().design), expected);
    const paths = await page.evaluate(text => {
      const reference = new DOMParser().parseFromString(text, 'image/svg+xml');
      const current = MadWeaveEditor.planar.contentDocument;
      let checked = 0;
      for (const source of reference.querySelectorAll('path[mwColorIndex],clipPath path')) {
        const target = current.getElementById(source.id);
        if (!target) throw Error('Missing reference path: '+source.id);
        for (const attribute of ['d','transform','fill','fill-opacity','mwColorIndex']) {
          if (source.getAttribute(attribute) !== target.getAttribute(attribute)) {
            throw Error('Reference differs: '+source.id+' '+attribute);
          }
        }
        checked++;
      }
      return checked;
    }, original);
    assert.equal(paths, 21, 'Check all 18 strip paths and 3 clipping paths');
    await capture('planar-original');
    // Repeat the original colors across parallel strips in the b hexweave class.
    await button('SC4');await button('CC3');await button('CP3');await button('Sep0');
    await button('VH0');await button('VH2');await button('Lines');
    const open = await page.evaluate(() => MadWeaveEditor.capture().design);
    assert.deepEqual(open.palette, expected.palette);
    assert.notEqual(open.colorPattern, expected.colorPattern);
    assert.deepEqual(open.layers, [false,true,false]);
    assert(open.outlines && open.opacity.slice(0,3).every(alpha => alpha === 1));
    await capture('planar-open');
    await page.evaluate(value => MadWeaveProject.apply(MadWeaveEditor.planar.contentWindow,value), expected);
    await page.selectOption('#design-mode','corner');
    await page.waitForFunction(() => MadWeaveEditor.mode==='corner');
    await button('Lines');
    await page.locator('#corner-inspector').evaluate(e=>e.open=true);
    await page.selectOption('#corner-crossing',{index:1});
    await page.click('#corner-next');
    await page.check('#corner-seams');await page.check('#corner-hidden');
    const painted = await page.evaluate(() => {
      const s=MadWeaveEditor.corner.state;
      return {edges:s.view.edges,hidden:s.view.outlines,seams:s.view.seams,count:s.keys.length,angle:s.model.p.beta,
        selected:s.keys[s.selected],accent:s.keys[(s.selected+Math.floor(s.keys.length/2))%s.keys.length]};
    });
    assert(painted.edges && painted.hidden && painted.seams && painted.selected);
    assert.equal(painted.count,24);assert.equal(painted.angle,480);
    assert(await page.frameLocator('#weave').locator('[data-material-edge]').count()>0);
    await capture('corner-construction');
    await page.uncheck('#corner-hidden');await page.uncheck('#corner-seams');
    await page.selectOption('#corner-strip','');
    await button('Lines');
    await page.evaluate(painted => MadWeaveEditor.corner.edit('Gallery colors',v=>{
      v.palette=['rgb(30,111,140)','rgb(204,99,66)','rgb(124,85,163)','rgb(54,160,145)',
        'rgb(235,185,63)','rgb(52,75,100)','rgb(244,227,184)','rgb(250,248,241)'];
      v.opacity=[.65,.8,.55,1,1,.7,1,1];
      v.material.overrides[painted.selected]=4;
      v.material.overrides[painted.accent]=3;
      v.recent=[v.palette[3],v.palette[4],v.palette[2],v.palette[1]];
      v.recentOpacity=[1,1,.55,.8];
    }),painted);
    assert.equal(await page.evaluate(() => MadWeaveEditor.corner.state.conflicts.length),0);
    assert.equal(await page.evaluate(() => MadWeaveEditor.corner.state.distinctColors),5);
    assert.deepEqual(await page.evaluate(() => Object.values(MadWeaveEditor.capture().design.material.overrides).sort()),[3,4]);
    await page.locator('#corner-inspector').evaluate(e=>e.open=false);
    await capture('corner-colors');
    assert.deepEqual(errors,[]);
    console.log('Captured in Chromium',browser.version());
  } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
