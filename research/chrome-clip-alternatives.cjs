// Compare alternate SVG representations on the same historical artwork.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const variants = ['original', 'clip-hint', 'blend-only', 'additive-clip', 'filtered-clip', 'soft-mask', 'hard-mask', 'additive-mask', 'additive-alpha-mask', 'production'];

function applyVariant(root, variant) {
  const doc = root.ownerDocument;
  const make = name => doc.createElementNS(root.namespaceURI, name);
  const weave = root.querySelector('#strips') || root;
  weave.removeAttribute('data-mw-strip-regions');
  const groups = [...weave.querySelectorAll('g[clip-path]')];
  let parent = groups[0].parentElement;
  const stylesheet = variant === 'additive-clip' || variant === 'filtered-clip';
  const additive = stylesheet || ['additive-mask', 'additive-alpha-mask', 'production'].includes(variant);
  if (parent === root && additive) {
    parent = make('g');
    root.append(parent);
    parent.append(...groups);
  }
  if (parent !== root) parent.style.isolation = additive && !stylesheet ? 'isolate' : '';
  for (const group of groups) {
    // The live editor supplies the production wrappers. Start every candidate
    // with the same ordered child paints as the historical reproduction.
    const stack = group.firstElementChild;
    if (stack?.localName === 'g' && (stack.id === group.id + 'Stack' || stack.style.isolation === 'isolate'))
      stack.replaceWith(...stack.children);
    group.style.removeProperty('filter');
    group.style.removeProperty('mix-blend-mode');
    const url = group.getAttribute('clip-path');
    const clip = root.querySelector(url.slice(4, -1));
    if (variant === 'clip-hint') clip.setAttribute('shape-rendering', 'crispEdges');
    if (variant.endsWith('-mask')) {
      const mask = make('mask');
      mask.id = clip.id;
      // Default maskContentUnits are userSpaceOnUse. White works for both
      // luminance and alpha masks. Keep the original mask geometry/transforms.
      mask.setAttribute('fill', 'white');
      if (variant === 'additive-alpha-mask') mask.setAttribute('mask-type', 'alpha');
      if (variant === 'hard-mask') mask.setAttribute('shape-rendering', 'crispEdges');
      mask.append(...clip.children);
      clip.replaceWith(mask);
      group.removeAttribute('clip-path');
      group.setAttribute('mask', url);
    }
    if (variant === 'blend-only' || (additive && !stylesheet)) group.style.mixBlendMode = 'plus-lighter';
    if (variant === 'production') {
      group.style.filter = 'opacity(1)';
      const stack = make('g');
      stack.style.isolation = 'isolate';
      stack.append(...group.children);
      group.append(stack);
    }
  }
  if (stylesheet) {
    parent.id = 'strips';
    const style = make('style');
    const filter = variant === 'filtered-clip' ? '; filter: opacity(1)' : '';
    style.textContent = '#strips { isolation: isolate }\n#strips > g[clip-path] { mix-blend-mode: plus-lighter' + filter + ' }';
    root.querySelector('defs').append(style);
  }
}

async function measure(page, markup, variant, scene, side, shift = 0, angle = 0) {
  await page.setContent('<body style="margin:0">' + markup + '</body>');
  const svg = page.locator('svg');
  await svg.evaluate((root, { scene, side, shift, angle }) => {
    root.setAttribute('width', side);
    root.setAttribute('height', side);
    const groups = [...root.querySelectorAll('g[clip-path]')];
    if (scene === 'partition') {
      root.querySelector('#strips').setAttribute('transform', 'rotate(' + angle + ')');
      root.setAttribute('viewBox', [shift - 1.33, shift - 1.33, 2.66, 2.66].join(' '));
      for (const group of groups) {
        const rect = root.ownerDocument.createElementNS(root.namespaceURI, 'rect');
        for (const [attr, val] of Object.entries({ x: -10, y: -10, width: 20, height: 20, fill: 'black', opacity: 0.5 }))
          rect.setAttribute(attr, val);
        group.replaceChildren(rect);
      }
    }
    if (scene === 'weave-backdrop') {
      const backdrop = root.ownerDocument.createElementNS(root.namespaceURI, 'rect');
      for (const [attr, val] of Object.entries({ x: -10, y: -10, width: 20, height: 20, fill: 'white' }))
        backdrop.setAttribute(attr, val);
      root.querySelector('#strips').before(backdrop);
    }
    if (scene === 'translucent') {
      root.querySelector(':scope > rect').remove();
      for (const group of groups)
        for (const child of group.children) child.setAttribute('fill-opacity', '0.6');
    }
    if (scene === 'color-change') groups[1].lastElementChild.setAttribute('fill', 'rgb(140,118,241)');
  }, { scene, side, shift, angle });
  await svg.evaluate(applyVariant, variant);
  return svg.evaluate(async (root, { scene, side }) => {
    // Decode the serialized SVG as an image, preserving transparent RGBA.
    const image = new Image();
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(root));
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = side;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, side, side).data;
    const pixel = (x, y) => [...data.slice(4 * (y * side + x), 4 * (y * side + x) + 4)];
    if (scene !== 'partition') return pixel(scene.startsWith('weave') ? 224 : 120, 120);
    let min = 255, max = 0, offByMoreThanFour = 0;
    for (let i = 3; i < data.length; i += 4) {
      const a = data[i];
      min = Math.min(min, a);
      max = Math.max(max, a);
      if (Math.abs(a - 128) > 4) offByMoreThanFour++;
    }
    return { side, min, max, offByMoreThanFour };
  }, { scene, side });
}

// This runs in an ordinary browser opened from disk. Each inline SVG gets its
// own document so references to clip and strip IDs cannot cross between cases.
async function browserComparison(apply, weave, minimal) {
  const methods = ['original', 'hard-mask', 'additive-clip', 'production', 'additive-alpha-mask', 'filtered-clip'];
  const results = {};
  for (const method of methods) {
    const column = document.createElement('section');
    const heading = document.createElement('h2');
    heading.textContent = method;
    column.append(heading);
    document.querySelector('main').append(column);
    const row = {};
    for (const scene of ['weave', 'opaque', 'translucent', 'transition']) {
      const doc = new DOMParser().parseFromString(scene === 'weave' ? weave : minimal, 'image/svg+xml');
      const root = doc.documentElement;
      if (scene === 'translucent') {
        root.querySelector(':scope > rect').remove();
        for (const paint of root.querySelectorAll('g rect')) paint.setAttribute('fill-opacity', '.6');
      }
      if (scene === 'transition')
        root.querySelector('g:last-of-type rect:last-of-type').setAttribute('fill', 'rgb(140,118,241)');
      apply(root, method);
      const xml = new XMLSerializer().serializeToString(root);
      const image = new Image();
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = scene === 'weave' ? 241 : 240;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      row[scene] = [...context.getImageData(scene === 'weave' ? 224 : 120, 120, 1, 1).data];
      if (scene === 'weave') {
        const frame = document.createElement('iframe');
        frame.title = method + ' inline SVG';
        frame.srcdoc = '<body style="margin:0">' + xml + '</body>';
        image.alt = method + ' SVG image';
        column.append(frame, image, canvas);
      }
    }
    results[method] = row;
  }
  document.querySelector('#results').textContent = JSON.stringify(results);
}

function writeBrowserTest(filename, weave, minimal) {
  const html = `<!doctype html><meta charset="utf-8"><title>MadWeave clip comparison</title>
<style>body{margin:0;font:14px system-ui}main{display:flex;width:max-content}h2{height:32px;margin:0;font:600 16px/32px system-ui}iframe,img,canvas{display:block;border:0;width:241px;height:241px}pre{white-space:pre-wrap}</style>
<main></main>
<p>Rows show the inline SVG, the SVG loaded as an image, and the image drawn on a transparent canvas. Canvas probes below are RGBA.</p>
<pre id="results">Rendering…</pre>
<script>
(${browserComparison.toString()})(${applyVariant.toString()}, ${JSON.stringify(weave)}, ${JSON.stringify(minimal)})
.catch(error => document.querySelector('#results').textContent = error.stack);
</script>`;
  fs.writeFileSync(filename, html);
}

async function main() {
  const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
  const minimal = read('fixtures/clip-seam-minimal.svg'), weave = read('evidence/pre-fix-clip-weave.svg');
  if (process.argv[2] === '--write-browser-test') {
    assert(process.argv[3], 'Supply a destination HTML filename');
    writeBrowserTest(process.argv[3], weave, minimal);
    return;
  }
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: process.env.MADWEAVE_CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage();
    const results = {};
    for (const variant of variants) {
      const cases = {};
      for (const scene of ['opaque', 'translucent', 'color-change', 'weave', 'weave-backdrop']) {
        const realWeave = scene.startsWith('weave');
        cases[scene] = await measure(page, realWeave ? weave : minimal, variant, scene, realWeave ? 241 : 240);
      }
      cases.partition = [];
      for (const side of [163, 240, 241, 467]) {
        for (const shift of [0, 0.013]) {
          for (const angle of [0, 17]) {
            const coverage = await measure(page, weave, variant, 'partition', side, shift, angle);
            cases.partition.push({ shift, angle, ...coverage });
          }
        }
      }
      results[variant] = cases;
    }
    assert.deepEqual(results.original.opaque, [217, 181, 165, 255]);
    console.log(JSON.stringify({ version: browser.version(), results }, null, 2));
  } finally { await browser.close(); }
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { applyVariant };
