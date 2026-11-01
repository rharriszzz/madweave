/* Versioned editable state, independent of serialized SVG buttons or executable input. */
(function () {
  'use strict';
  const FORMAT = 'madweave-project';
  const VERSION = 1;

  function validate(value) {
    function fail() { throw new Error('This file does not contain a supported MadWeave project.'); }
    function integer(n, min, max) { if (!Number.isInteger(n) || n < min || n > max) fail(); return n; }
    function flag(v) { if (typeof v !== 'boolean') fail(); return v; }
    function list(v, length, convert) {
      if (!Array.isArray(v) || v.length !== length) fail();
      return v.map(convert);
    }
    function color(v) {
      if (typeof v !== 'string') fail();
      const channels = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(v);
      if (!channels || channels.slice(1).some(n => Number(n) > 255)) fail();
      return v;
    }
    function opacity(n) { if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1) fail(); return n; }
    if (!value || value.format !== FORMAT) fail();
    if (value.version !== VERSION) throw new Error('This project version is not supported. Open it with the version of MadWeave that saved it.');
    const baseSize = integer(value.baseSize, 1, 8);
    if (!['paint', 'hide', 'show'].includes(value.mode)) fail();
    return {
      format: FORMAT, version: VERSION, baseSize,
      colorPattern: integer(value.colorPattern, 0, 4), colorCount: integer(value.colorCount, 1, 6),
      palette: list(value.palette, 8, color), opacity: list(value.opacity, 8, opacity),
      recentColors: list(value.recentColors, 4, color), recentOpacity: list(value.recentOpacity, 4, opacity),
      selectedColor: integer(value.selectedColor, 0, 7), mode: value.mode,
      stripColors: list(value.stripColors, baseSize * 9, n => integer(n, 0, 7)),
      stripVisibility: list(value.stripVisibility, baseSize * 9, flag),
      layers: list(value.layers, 3, flag), directions: list(value.directions, 3, flag),
      separation: integer(value.separation, 0, 3), hand: flag(value.hand), alternate: flag(value.alternate),
      center: flag(value.center), outlines: flag(value.outlines), controlsHidden: flag(value.controlsHidden),
    };
  }

  function capture(w) {
    return validate({
      format: FORMAT, version: VERSION, baseSize: Number(w.baseSize),
      colorPattern: Number(w.colorPattern), colorCount: Number(w.colorCount),
      palette: Array.from(w.colorArray), opacity: Array.from(w.opacityArray, Number),
      recentColors: Array.from(w.lastColor), recentOpacity: Array.from(w.lastOpacity, Number),
      selectedColor: Number(w.defaultColorIndex), mode: w.hideStrips ? 'hide' : w.showStrips ? 'show' : 'paint',
      stripColors: Array.from(w.colorIndexArray, Number), stripVisibility: Array.from(w.visibilityIndexArray, Boolean),
      layers: Array.from(w.showC), directions: Array.from(w.showD), separation: Number(w.separationIndex),
      hand: w.hand, alternate: w.alternate, center: w.starMadWeaveCenter, outlines: w.showingLines,
      controlsHidden: w.hidingButtons,
    });
  }

  function apply(w, input) {
    const state = validate(input);
    w.colorPattern = state.colorPattern;
    w.colorCount = state.colorCount;
    w.colorArray = state.palette.slice();
    w.opacityArray = state.opacity.slice();
    w.lastColor = state.recentColors.slice();
    w.lastOpacity = state.recentOpacity.slice();
    w.defaultColorIndex = state.selectedColor;
    w.showC = state.layers.slice();
    w.showD = state.directions.slice();
    w.separationIndex = state.separation;
    w.stripSpacingFraction = w.separationValue[state.separation];
    w.stripSpacing = w.stripWidth * w.stripSpacingFraction;
    w.hand = state.hand;
    w.alternate = state.alternate;
    w.starMadWeaveCenter = state.center;
    w.showingLines = state.outlines;
    w.colorIndexArray = state.stripColors.slice();
    w.visibilityIndexArray = state.stripVisibility.slice();
    w.hideStrips = w.showStrips = w.hidingButtons = false;
    const root = w.document.getElementById('svg');
    w.setContent(root, state.baseSize);
    if (state.mode !== 'paint') w.setVisibleOrHidden(root, state.mode === 'show');
    if (state.controlsHidden) w.showOrHideButtons(root);
  }

  function fromLegacySvg(document) {
    const root = document.documentElement;
    if (root.localName !== 'svg') throw new Error('Choose a MadWeave project or an original editable SVG.');
    function element(id) {
      const node = document.getElementById(id);
      if (!node) throw new Error('This SVG is artwork only or is missing editable MadWeave controls.');
      return node;
    }
    function selected(id) {
      const button = element('button' + id);
      return Number(button.getAttribute('stroke-width')) > Number(button.getAttribute('width')) * 0.03 * 1.1;
    }
    function selection(prefix, start, end, fallback) {
      for (let i = start; i <= end; i++) if (selected(prefix + i)) return i;
      return fallback;
    }
    const baseSize = Number(root.getAttribute('mwBaseSize'));
    if (!Number.isInteger(baseSize) || baseSize < 1 || baseSize > 8) throw new Error('This SVG has no supported editable MadWeave design.');
    const center = selected('C');
    const stripColors = [], stripVisibility = [];
    const perDirection = baseSize * 3;
    for (let direction = 0; direction < 3; direction++) {
      for (let strip = 0; strip < perDirection; strip++) {
        const offset = strip + (center ? 3 - direction : 0);
        const name = 'HRL'[direction] + 'abc'[offset % 3] + Math.floor(offset / 3);
        stripColors.push(Number(element('P' + name).getAttribute('mwColorIndex')));
        stripVisibility.push(element('GP' + name).getAttribute('mwVisibility') === 'visible');
      }
    }
    const indices = count => Array.from({length: count}, (_, i) => i);
    return validate({
      format: FORMAT, version: VERSION, baseSize,
      colorPattern: selection('CP', 0, 4, 0), colorCount: selection('CC', 1, 6, 3),
      palette: indices(8).map(i => element('buttonC' + i).getAttribute('fill')),
      opacity: indices(8).map(i => Number(element('buttonC' + i).getAttribute('fill-opacity'))),
      recentColors: indices(4).map(i => element('buttonLAST' + i).getAttribute('fill')),
      recentOpacity: indices(4).map(i => Number(element('buttonLAST' + i).getAttribute('fill-opacity'))),
      selectedColor: selection('C', 0, 7, 0), mode: selected('I') ? 'hide' : selected('V') ? 'show' : 'paint',
      stripColors, stripVisibility,
      layers: indices(3).map(i => selected('VH' + i)), directions: indices(3).map(i => selected('VD' + i)),
      separation: selection('Sep', 0, 3, 1), hand: selected('-'), alternate: selected('X'), center,
      outlines: selected('Lines'), controlsHidden: element('gbuttonLines').getAttribute('visibility') === 'hidden',
    });
  }

  function parse(text) {
    if (text.trimStart().startsWith('{')) return validate(JSON.parse(text));
    const html = new DOMParser().parseFromString(text, 'text/html');
    const data = html.getElementById('madweave-project');
    if (data) return validate(JSON.parse(data.textContent));
    const xml = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (xml.querySelector('parsererror')) throw new Error('This file is not a readable MadWeave project.');
    return fromLegacySvg(xml);
  }

  window.MadWeaveProject = {capture, apply, validate, parse};
}());
