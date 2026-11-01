/* Export only the artwork, without editor controls or executable SVG content. */
(function () {
  'use strict';
  const editor = document.getElementById('weave');
  const button = document.getElementById('export');
  const status = document.getElementById('export-status');
  function enableExport() {
    try {
      button.disabled = !editor.contentDocument?.getElementById('strips');
    } catch (_) {
      button.disabled = true;
    }
  }
  editor.addEventListener('load', enableExport);
  enableExport();
  button.addEventListener('click', function () {
    const source = editor.contentDocument?.documentElement;
    if (!source || !source.querySelector('#strips')) {
      status.textContent = 'The editor has not loaded. Try opening the SVG directly.';
      return;
    }
    const svg = source.cloneNode(true);
    svg.querySelectorAll('script, #buttons, #documentations, #tools, #pattern').forEach(node => node.remove());
    [svg, ...svg.querySelectorAll('*')].forEach(node => {
      [...node.attributes].forEach(attribute => {
        if (/^on/i.test(attribute.name)) node.removeAttribute(attribute.name);
      });
    });
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'madweave-artwork.svg';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Artwork exported as SVG. Keep this tab open to continue editing; the exported image is not an editable project.';
  });
}());
