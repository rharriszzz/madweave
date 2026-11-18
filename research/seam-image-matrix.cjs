// Generate a portable replay of the editor's seam probes for stock browsers.
const { writeFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { applyOrderedMasks } = require('./ordered-strip-masks.cjs');
const { gzipSync } = require('node:zlib');
const { applyVariant } = require('./chrome-clip-alternatives.cjs');

// Keep the editor's current viewBox, strip paints and grouping, at the same
// raster dimensions used to locate the independent geometry probes.
function captureArtwork(root, [width, height]) {
  const copy = root.cloneNode(false);
  for (const attr of [...copy.attributes]) {
    if (attr.name.startsWith('on')) copy.removeAttribute(attr.name);
  }
  for (const id of ['defs', 'strips']) copy.append(root.querySelector('#' + id).cloneNode(true));
  copy.setAttribute('width', width);
  copy.setAttribute('height', height);
  return new XMLSerializer().serializeToString(copy);
}

async function replay(packed, methods, apply, orderedMasks, results, total) {
  const bytes = Uint8Array.from(atob(packed), c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const cases = await new Response(stream).json();
  for (const scene of cases) {
    let productionPixels;
    for (const method of methods) {
      const doc = new DOMParser().parseFromString(scene.svg, 'image/svg+xml');
      const root = doc.documentElement;
      if (['ordered-mask', 'ordered-hard-mask', 'underpaint-mask'].includes(method))
        orderedMasks(root, method);
      else if (method !== 'production') apply(root, method);
      const image = new Image();
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(root));
      await image.decode();
      // One readback per canvas avoids switching later methods to software
      // because earlier methods repeatedly read from the same surface.
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      if (pixels.length !== 4 * canvas.width * canvas.height) throw Error('Incomplete RGBA readback');
      if (method === 'production') productionPixels = pixels;
      const row = results[method];
      let failed = false;
      for (const [x, y, expected] of scene.probes) {
        if (x < 2 || y < 2 || x + 2 >= canvas.width || y + 2 >= canvas.height)
          throw Error('Probe outside the image');
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const offset = 4 * ((y + dy) * canvas.width + x + dx);
            const alpha = pixels[offset + 3] / 255;
            const observed = expected.map((_, i) => pixels[offset + i] * alpha + 255 * (1 - alpha));
            const error = Math.max(...observed.map((v, i) => Math.abs(v - expected[i])));
            row.samples++;
            if (method !== 'production' && [0, 1, 2, 3].some(i => pixels[offset + i] !== productionPixels[offset + i]))
              row.differingFromProductionRGBA++;
            if (error > 4) { row.samplesOverFour++; failed = true; }
            if (error > row.maxError) {
              row.maxError = error;
              row.worst = { scene: scene.name, pixel: [x + dx, y + dy], expected, rgba: [...pixels.slice(offset, offset + 4)] };
            }
          }
        }
      }
      canvas.width = canvas.height = 0;
      image.removeAttribute('src');
      row.cases++;
      if (failed) row.casesOverFour++;
    }
    document.querySelector('#status').textContent = results.production.cases + ' / ' + total;
  }
}

// Keep only one batch of decoded scenes in a document. Checkpoint completed
// batches so a native browser reload resumes at the first unfinished scene.
async function runBatches(batches, methods, total, key, render, apply, orderedMasks) {
  let state = { next: 0, results: Object.fromEntries(methods.map(method => [method, {
    cases: 0, samples: 0, casesOverFour: 0, samplesOverFour: 0,
    differingFromProductionRGBA: 0, maxError: 0, worst: null
  }])) };
  let persistent = true;
  try {
    const saved = sessionStorage.getItem(key);
    if (saved) state = JSON.parse(saved);
  } catch { persistent = false; }
  while (state.next < batches.length) {
    await render(batches[state.next], methods, apply, orderedMasks, state.results, total);
    state.next++;
    if (persistent && state.next < batches.length) {
      try { sessionStorage.setItem(key, JSON.stringify(state)); }
      catch { persistent = false; }
      if (persistent) { location.reload(); return; }
    }
  }
  if (persistent) sessionStorage.removeItem(key);
  document.querySelector('#results').textContent = JSON.stringify(state.results);
}

function writeMatrix(filename, cases, { compareMasks = false } = {}) {
  const methods = ['production', 'original', 'additive-clip', 'filtered-clip'];
  if (compareMasks) methods.push('hard-mask', 'ordered-mask', 'ordered-hard-mask', 'underpaint-mask');
  const batches = [];
  for (let i = 0; i < cases.length; i += 4) {
    batches.push(gzipSync(JSON.stringify(cases.slice(i, i + 4))).toString('base64'));
  }
  const key = 'mw-seams-' + createHash('sha256')
    .update(JSON.stringify(batches)).update(JSON.stringify(methods))
    .update(replay.toString()).update(applyVariant.toString()).update(applyOrderedMasks.toString()).digest('hex');
  writeFileSync(filename, `<!doctype html><meta charset="utf-8"><title>MadWeave SVG image seam matrix</title>
<h1>MadWeave SVG image seam matrix</h1>
<p id="status">Starting…</p><pre id="results"></pre>
<script>
(${runBatches.toString()})(${JSON.stringify(batches)}, ${JSON.stringify(methods)}, ${cases.length},
  ${JSON.stringify(key)}, ${replay.toString()}, ${applyVariant.toString()}, ${applyOrderedMasks.toString()})
.catch(error => document.querySelector('#results').textContent = error.stack);
</script>`);
}

module.exports = { captureArtwork, writeMatrix };
