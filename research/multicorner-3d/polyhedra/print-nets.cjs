// Print actual-size single-sheet PDFs, a booklet, and review screenshots.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../../..');
const out = path.join(root, 'research/output/triangular-polyhedra');
const paper = process.argv.includes('--a4') ? 'A4' : 'Letter';
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end();
    const type = { '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.pdf': 'application/pdf' }[path.extname(file)];
    res.setHeader('Content-Type', type || 'application/octet-stream');
    res.end(data);
  });
});
function pageCount(file) {
  const info = execFileSync('pdfinfo', [file], { encoding: 'utf8' });
  return Number(info.match(/^Pages:\s+(\d+)/m)[1]);
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch();
  const errors = [];
  const failures = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
    const base = `http://127.0.0.1:${server.address().port}/research/output/triangular-polyhedra/`;
    const cases = JSON.parse(fs.readFileSync(path.join(out, 'cases.json')));
    const pages = [];
    let css;
    for (const item of cases) {
      const response = await page.goto(base + item.id + '/print.html');
      assert.equal(response.status(), 200);
      await page.locator('img').evaluate(img => img.decode());
      await page.addStyleTag({ content: `@page{size:${paper} landscape}` });
      const target = path.join(out, item.id, 'net.pdf');
      await page.pdf({ path: target, preferCSSPageSize: true, printBackground: true });
      assert.equal(pageCount(target), 1, item.id + ': expected one printed page');
      const markup = fs.readFileSync(path.join(out, item.id, 'print.html'), 'utf8');
      css = markup.match(/<style>([\s\S]*?)<\/style>/)[1].replace('Letter landscape', paper + ' landscape');
      const body = markup.match(/<\/style>([\s\S]*)<\/html>/)[1]
        .replace('src="net.svg"', `src="${item.id}/net.svg"`);
      pages.push(`<section class="sheet">${body}</section>`);
      if (['tetrahedron-madweave-2-1-sixfold', 'octahedron-hexweave-2-1-threefold', 'icosahedron-hexweave-2-1-sixfold'].includes(item.id)) {
        await page.goto(base + item.id + '/net.svg');
        await page.locator('svg').screenshot({ path: path.join(out, item.id, 'net-preview.png') });
      }
    }
    fs.writeFileSync(path.join(out, 'booklet.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><title>Madweave and hexweave paper polyhedra</title><style>${css}.sheet{break-after:page}.sheet:last-child{break-after:auto}</style>${pages.join('\n')}</html>`);
    await page.goto(base + 'booklet.html');
    await page.locator('img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await page.pdf({ path: path.join(out, 'all-nets.pdf'), preferCSSPageSize: true, printBackground: true });
    assert.equal(pageCount(path.join(out, 'all-nets.pdf')), cases.length, 'Booklet page count');
    const text = execFileSync('pdftotext', [path.join(out, 'all-nets.pdf'), '-'], { encoding: 'utf8' });
    assert.equal((text.match(/must measure 40 mm/g) || []).length, cases.length, 'Every page has scale instructions');
    await page.goto(base);
    const decoded = await page.locator('img').evaluateAll(images => Promise.all(images.map(async img => {
      await img.decode(); return img.naturalWidth > 0;
    })));
    const availableRenders = cases.filter(item => fs.existsSync(path.join(out, item.id, 'assembled.png'))).length;
    assert.equal(decoded.length, cases.length + availableRenders);
    assert.ok(decoded.every(Boolean));
    for (const width of [1200, 390]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow');
    }
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
    const results = { paper, single_page_pdfs: cases.length, booklet_pages: cases.length,
      decoded_preview_images: decoded.length, viewport_widths: [1200,390], errors, failed_requests: failures };
    fs.writeFileSync(path.join(out, 'browser-checks.json'), JSON.stringify(results, null, 2) + '\n');
    console.log(JSON.stringify(results));
  } finally {
    await browser.close(); server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
