// Runtime sources/catalogue are trusted build inputs. Imported files supply only
// Project state; their runtime, SVG and status text are never executed or trusted.
export function makePackage(bundle){
  function start(){
    const assets=JSON.parse(document.getElementById('corner-assets').textContent);
    const script=document.createElement('script');script.type='module';
    script.textContent="const BUNDLE=JSON.parse(document.getElementById('corner-assets').textContent);\n"+
      ['kernel','project','offline','app'].map(key=>assets.sources[key]).join('\n');
    document.body.append(script);
  }
  const json=x=>JSON.stringify(x).replaceAll('<','\\u003c');
  return {html(project){
    return bundle.template.replace('<!--CORNER_STYLE-->',`<style>${bundle.css}</style>`)
      .replace('<!--CORNER_RUNTIME-->',`<script id="corner-assets" type="application/json">${json(bundle)}</script>\n<script id="corner-project" type="application/json">${json(project)}</script>\n<script>(${start.toString()})();</script>`);
  }};
}
