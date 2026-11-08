// Reuse the planar editor's renderer; export a periodic tile and a reference crop.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../../..');
const out = path.join(root, 'research/output/triangular-polyhedra/patterns');
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end();
    res.setHeader('Content-Type', file.endsWith('.svg') ? 'image/svg+xml' :
      file.endsWith('.js') ? 'text/javascript' : 'text/plain');
    res.end(data);
  });
});
(async () => {
  fs.mkdirSync(out, { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch();
    const errors = [];
    const states = [];
    for (const kind of ['madweave', 'hexweave']) {
      const page = await browser.newPage({ viewport: { width: 333, height: 576 }, deviceScaleFactor: 1 });
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/madweave.svg`);
      const state = await page.evaluate(kind => {
        stripWidth = .75; stripSpacing = .25; stripSpacingFraction = 1 / 3;
        starMadWeaveCenter = kind === 'madweave'; hand = false; alternate = false;
        starHexWeaveCenter = false;
        showC = kind === 'madweave' ? [true, true, true] : [false, true, false];
        showD = [true, true, true];
        setupNewBaseSize(document, 14);
        colorPattern = 0; colorCount = 1; colorArray[0] = '#75aeb8';
        opacityArray.fill(1); showingLines = true; colorIndexArray = null;
        buildStrips(document);
        const svg = document.documentElement;
        svg.querySelectorAll('script,#buttons,#viewButtons,#documentations,#tools,#pattern').forEach(e => e.remove());
        svg.setAttribute('viewBox', `0 0 ${2 * Math.sqrt(3)} 6`);
        svg.setAttribute('width', '333'); svg.setAttribute('height', '576');
        svg.setAttribute('preserveAspectRatio', 'none'); svg.style.background = 'white';
        const visible = [...svg.querySelectorAll('defs g[id^="GP"]')]
          .filter(g => g.getAttribute('visibility') === 'visible').length;
        return { kind, showC: [...showC], showD: [...showD], C: Number(starMadWeaveCenter), hand, alternate,
          width: stripWidth, pitch: stripWidth + stripSpacing, visible, baseSize,
          tile: [0, 0, 2 * Math.sqrt(3), 6], pixels: [333, 576], ink: colorArray[0] };
      }, kind);
      if (state.visible !== (kind === 'madweave' ? 126 : 42)) throw Error('Wrong strip membership');
      await page.screenshot({ path: path.join(out, kind + '.png') });
      fs.writeFileSync(path.join(out, kind + '.svg'), await page.evaluate(() =>
        new XMLSerializer().serializeToString(document.documentElement)));
      await page.setViewportSize({ width: 1536, height: 1536 });
      await page.evaluate(() => {
        const svg = document.documentElement;
        svg.setAttribute('viewBox', '-12 -12 24 24');
        svg.setAttribute('width', '1536'); svg.setAttribute('height', '1536');
      });
      await page.screenshot({ path: path.join(out, kind + '-reference.png') });
      states.push(state);
      await page.close();
    }
    if (errors.length) throw Error(errors.join('\n'));
    fs.writeFileSync(path.join(out, 'capture.json'), JSON.stringify({ source: 'madweave.js', errors, states }, null, 2) + '\n');
    console.log('Captured madweave (C=1) and hexweave-b (C=0): both have a sixfold origin.');
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
