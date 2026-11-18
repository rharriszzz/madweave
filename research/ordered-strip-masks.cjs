// Experimental planar renderer. Each mask uses the same paint order to assign a
// pixel to one of the original stacks, even when two rasterized regions overlap.
function applyOrderedMasks(root, method) {
  const make = name => root.ownerDocument.createElementNS(root.namespaceURI, name);
  const defs = root.querySelector('defs');
  const layer = root.querySelector('g[clip-path]').parentElement;
  const stacks = [...layer.children];
  const regions = stacks.map(stack => {
    const selector = stack.getAttribute('clip-path').slice(4, -1);
    return root.querySelector(selector).firstElementChild;
  });

  // maskPath uses integer triangle vertices in a common coordinate system.
  // Cover their bounding rectangle, including the gaps between regions.
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const region of regions) {
    if (region.getAttribute('transform') !== regions[0].getAttribute('transform'))
      throw Error('Planar order regions must share their transform');
    for (const [, x, y] of region.getAttribute('d').matchAll(/[ML]\s+(-?\d+)\s+(-?\d+)/g)) {
      bounds[0] = Math.min(bounds[0], Number(x));
      bounds[1] = Math.min(bounds[1], Number(y));
      bounds[2] = Math.max(bounds[2], Number(x));
      bounds[3] = Math.max(bounds[3], Number(y));
    }
  }

  // The two-triangle reduction uses H/V path commands and fills its viewBox.
  if (layer !== root.querySelector('#strips')) {
    const box = root.viewBox.baseVal;
    bounds.splice(0, 4, box.x, box.y, box.x + box.width, box.y + box.height);
  }
  layer.removeAttribute('data-mw-strip-regions');
  layer.style.isolation = 'isolate';
  stacks.forEach((stack, index) => {
    const mask = make('mask');
    mask.id = 'mw-order-mask-' + index;
    if (method === 'ordered-hard-mask') mask.setAttribute('shape-rendering', 'crispEdges');
    const map = make('g');
    if (regions[0].hasAttribute('transform'))
      map.setAttribute('transform', regions[0].getAttribute('transform'));
    mask.append(map);
    defs.append(mask);

    const base = make('rect');
    base.setAttribute('x', bounds[0]);
    base.setAttribute('y', bounds[1]);
    base.setAttribute('width', bounds[2] - bounds[0]);
    base.setAttribute('height', bounds[3] - bounds[1]);
    base.setAttribute('fill', index === 0 ? 'white' : 'black');
    map.append(base);
    function paintRegion(other, extend) {
      const path = make('path');
      const color = index === other ? 'white' : 'black';
      path.setAttribute('d', regions[other].getAttribute('d'));
      path.setAttribute('fill', color);
      if (extend) {
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '3');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('vector-effect', 'non-scaling-stroke');
      }
      map.append(path);
    }
    if (method === 'underpaint-mask') {
      // At a seam between two nondefault regions, a partially covered pixel
      // should mix those two stacks. Seed it with the lower-priority neighbor.
      for (let other = stacks.length - 1; other >= 0; other--) paintRegion(other, true);
    }
    for (let other = 1; other < stacks.length; other++) paintRegion(other, false);
    stack.style.removeProperty('filter');
    stack.removeAttribute('clip-path');
    stack.setAttribute('mask', 'url(#' + mask.id + ')');
    stack.style.mixBlendMode = 'plus-lighter';
    stack.firstElementChild.style.isolation = 'isolate';
  });
}

module.exports = { applyOrderedMasks };
