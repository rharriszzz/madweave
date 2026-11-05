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
    async function capture(name, settings=false) {
      await page.mouse.move(0,0);
      await page.evaluate(() => document.activeElement?.blur());
      await page.waitForTimeout(250);
      if (settings) {
        await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
        const top = await page.locator('.mode-controls').boundingBox();
        const bottom = await page.locator('.canvas').boundingBox();
        await page.screenshot({path:path.join(output,name+'.png'),fullPage:true,clip:{x:top.x,y:top.y,width:bottom.width,height:bottom.y+bottom.height-top.y}});
      } else await page.locator('.canvas').screenshot({path:path.join(output,name+'.png')});
      console.log(name);
    }
    // Use the application model to set repeatable palettes, then native controls.
    await page.evaluate(() => {
      const w=MadWeaveEditor.planar.contentWindow;
      w.colorArray=['rgb(36,104,109)','rgb(222,163,66)','rgb(139,78,108)','rgb(235,221,185)','rgb(61,75,97)','rgb(177,81,49)','rgb(223,233,215)','rgb(37,49,53)'];
      w.buildButtons(w.document);w.buildStrips(w.document);
    });
    await button('SC4');await button('CC3');await button('CP0');await button('Sep1');
    await capture('planar-directions');
    await button('CP4');await button('Sep2');await button('VH1');
    await capture('planar-open');
    await page.selectOption('#design-mode','corner');
    await page.waitForFunction(() => MadWeaveEditor.mode==='corner');
    await capture('corner-construction',true);
    await page.locator('#corner-inspector').evaluate(e=>e.open=true);
    await page.selectOption('#corner-crossing',{index:1});
    await page.click('#corner-next');
    await page.check('#corner-seams');await page.check('#corner-hidden');
    await capture('corner-inspection');
    await page.uncheck('#corner-hidden');await page.uncheck('#corner-seams');
    await page.selectOption('#corner-strip','');
    await page.selectOption('#corner-phase','mad-sixfold');
    await page.selectOption('#corner-beta','420');
    await page.selectOption('#corner-crop','r6');
    await button('CP0');await page.click('#corner-apply');
    await page.evaluate(() => MadWeaveEditor.corner.edit('Gallery palette',v=>{
      v.palette[0]='rgb(30,111,140)';v.palette[1]='rgb(204,99,66)';v.palette[2]='rgb(124,85,163)';
      v.opacity[0]=.65;v.opacity[1]=.55;v.opacity[2]=.7;
    }));
    assert(await page.frameLocator('#weave').locator('[data-seam-warning]').count()>0);
    await page.locator('#corner-inspector').evaluate(e=>e.open=false);
    await capture('corner-translucent-warning',true);
    assert.deepEqual(errors,[]);
    console.log('Captured in Chromium',browser.version());
  } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
