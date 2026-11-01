/* Editable project files include the editor and assets for offline use. */
(function () {
  'use strict';
  const project = window.MadWeaveProject;
  let editor = document.getElementById('weave');
  const exportButton = document.getElementById('export');
  const saveButton = document.getElementById('save-project');
  const openButton = document.getElementById('open-project');
  const fileInput = document.getElementById('project-file');
  const status = document.getElementById('export-status');
  let assetsPromise;
  let loading = false;

  function message(text) { status.textContent = text; }
  function ready() {
    try { return !loading && Boolean(editor.contentDocument?.getElementById('strips')); }
    catch (_) { return false; }
  }
  function updateButtons() {
    exportButton.disabled = saveButton.disabled = !ready();
    openButton.disabled = loading;
  }
  editor.addEventListener('load', updateButtons);
  updateButtons();

  function download(text, type, filename) {
    const url = URL.createObjectURL(new Blob([text], {type}));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  async function assets() {
    if (!assetsPromise) {
      assetsPromise = (async function () {
        const embedded = document.getElementById('madweave-assets');
        if (embedded) return JSON.parse(embedded.textContent);
        async function get(path) {
          const response = await fetch(path);
          if (!response.ok) throw new Error('Could not load an editor asset. Check your connection and try again.');
          return response;
        }
        const [engine, stateScript, editorScript, css, images] = await Promise.all([
          get('madweave.js').then(r => r.text()), get('project.js').then(r => r.text()),
          get('editor.js').then(r => r.text()), get('site.css').then(r => r.text()),
          Promise.all([1,2,3,4,5].map(async i => {
            const blob = await (await get('cp' + i + '.png')).blob();
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => reject(new Error('Could not read a pattern image.'));
              reader.readAsDataURL(blob);
            });
          })),
        ]);
        return {engine, stateScript, editorScript, css, images};
      }()).catch(error => { assetsPromise = undefined; throw error; });
    }
    return assetsPromise;
  }

  async function loadProject(input) {
    const state = project.validate(input);
    const bundle = await assets();
    // Build an isolated fresh frame from known application code, never imported scripts.
    const replacement = document.createElement('iframe');
    replacement.id = 'loading-weave';
    replacement.title = 'MadWeaver interactive weaving editor';
    const old = document.getElementById('weave');
    loading = true;
    updateButtons();
    const loaded = new Promise((resolve, reject) => {
      replacement.addEventListener('load', () => {
        try {
          const doc = replacement.contentDocument;
          const root = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
          root.id = 'svg';
          root.style.cssText = 'display:block;width:100%;height:100vh';
          root.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
          doc.body.appendChild(root);
          const engine = doc.createElement('script');
          engine.textContent = bundle.engine.replace(/\bcp([1-5])\.png\b/g, (_, i) => bundle.images[Number(i)-1]);
          doc.body.appendChild(engine);
          project.apply(replacement.contentWindow, state);
          resolve();
        } catch (error) { reject(error); }
      }, {once: true});
    });
    replacement.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><title>MadWeaver</title></head><body style="margin:0;background:white"></body></html>';
    old.after(replacement);
    try {
      await loaded;
      old.remove();
      replacement.id = 'weave';
      editor = replacement;
    } catch (error) {
      replacement.remove();
      throw error;
    } finally {
      loading = false;
      updateButtons();
    }
  }

  function projectHtml(state, bundle) {
    const html = document.documentElement.cloneNode(true);
    html.querySelectorAll('script, style, link[rel="stylesheet"], .canvas iframe, .canvas object').forEach(node => node.remove());
    const frame = document.createElement('iframe');
    frame.id = 'weave';
    frame.title = 'MadWeaver interactive weaving editor';
    html.querySelector('.canvas').appendChild(frame);
    const style = document.createElement('style');
    style.textContent = bundle.css;
    html.querySelector('head').appendChild(style);
    html.querySelector('title').textContent = 'MadWeave — Saved editable project';
    // Make documentation and source links useful even when opening this file offline.
    html.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#') && !/^[a-z]+:/i.test(href)) {
        link.href = new URL(href, 'https://rharriszzz.github.io/madweave/').href;
      }
    });
    for (const [id, value] of [['madweave-project', state], ['madweave-assets', bundle]]) {
      const data = document.createElement('script');
      data.id = id;
      data.type = 'application/json';
      data.textContent = JSON.stringify(value).replace(/</g, '\\u003c');
      html.querySelector('body').appendChild(data);
    }
    const bootstrap = document.createElement('script');
    bootstrap.textContent = '(' + function () {
      const bundle = JSON.parse(document.getElementById('madweave-assets').textContent);
      for (const text of [bundle.stateScript, bundle.editorScript]) {
        const script = document.createElement('script');
        script.textContent = text;
        document.body.appendChild(script);
      }
    }.toString() + ')();';
    html.querySelector('body').appendChild(bootstrap);
    return '<!doctype html>\n' + html.outerHTML;
  }

  saveButton.addEventListener('click', async () => {
    if (!ready()) return;
    try {
      const state = project.capture(editor.contentWindow);
      saveButton.disabled = true;
      message('Preparing your editable project…');
      const bundle = await assets();
      download(projectHtml(state, bundle), 'text/html;charset=utf-8', 'madweave-project.html');
      message('Editable project saved. Open the downloaded HTML file to continue offline, or use Open Project here. Save again after making changes.');
    } catch (error) { message('Project was not saved: ' + error.message); }
    finally { updateButtons(); }
  });

  openButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Choose a project file smaller than 5 MB.');
      const state = project.parse(await file.text());
      await loadProject(state);
      message('Opened ' + file.name + '. You can edit this design and save it again.');
    } catch (error) { message('Project was not opened: ' + error.message); }
  });

  exportButton.addEventListener('click', () => {
    const source = editor.contentDocument?.getElementById('svg');
    if (!ready() || !source) return;
    const svg = source.cloneNode(true);
    svg.querySelectorAll('script, #buttons, #documentations, #tools, #pattern').forEach(node => node.remove());
    [svg, ...svg.querySelectorAll('*')].forEach(node => {
      [...node.attributes].forEach(attribute => {
        if (/^on/i.test(attribute.name)) node.removeAttribute(attribute.name);
      });
    });
    download(new XMLSerializer().serializeToString(svg), 'image/svg+xml;charset=utf-8', 'madweave-artwork.svg');
    message('Artwork exported as a static SVG image. Use Save Project to keep an editable copy.');
  });

  const saved = document.getElementById('madweave-project');
  if (saved) {
    loadProject(project.validate(JSON.parse(saved.textContent))).then(() => {
      message('Saved project opened. Editing and saving work offline. Save Project downloads a new copy with your latest changes.');
    }).catch(error => message('Could not open this project: ' + error.message));
  }
}());
