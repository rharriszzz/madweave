# Architecture and development

## Files and entry points

| File | Purpose |
| --- | --- |
| `index.html`, `site.css` | Buildless project landing page and shared website styles |
| `editor.html`, `editor.js` | Same-origin SVG embedding and static artwork export |
| `guide.html` | Current user guide and control reference |
| `madweave.js` | Original global-scope SVG engine and event handlers |
| `madweave.svg` | Serialized starter design, loaded with `setSavedContent` |
| `madweave_init.svg` | Minimal fresh-design entry point, loaded with `setContent(..., 2)` |
| `cp1.png`–`cp5.png` | Five pattern-preview buttons used by the SVG engine |
| `MadWeaver.html`, `madweave.html`, `HandbookOfTriaxialWeaves.html` | Original historical documentation |
| `test*.svg`, `test.html` | Historical experiments; not an automated test suite or published entry point |
| `convert`, `convert_all`, `convert.txt` | Historical Batik rasterization helpers with local macOS paths |
| `scripts/build_site.py` | Explicit static publication list; output in ignored `dist/` |
| `tests/` | Node color/indexing tests, Python site tests, and Chromium integration tests |

There is no bundler, backend, database, telemetry, external font, or runtime CDN.
The web app uses only its own static files. `madweave.js` is loaded inside the SVG
document, so its `document` and global state belong to that document rather than
the surrounding HTML page.

## Rendering model

Three strip directions are spaced 120 degrees apart. Each direction contains
`3 * baseSize` strips, with `baseSize` from 1 to 8; total strip count is
`9 * baseSize`. Index helpers map a strip to its direction (H/R/L), hex weave
layer (a/b/c), and repeat group. Center shifting changes that mapping.

`setupNewBaseSize` sets geometry and the SVG view box. `buildDefs` constructs
color gradients. `buildStripsInternal` creates reusable directional strip groups
inside `<defs>`, then six clipped sectors reference those groups with `<use>` to
produce the interlacing. `maskPath`, `stripPath`, and `trans` generate clipping,
shape, and positioning geometry. `buildButtons` creates the original SVG controls
and hover documentation. A transparent selector overlays the weave for picking.

Palette colors and opacity are shared by index. `colorIndexArray` and
`visibilityIndexArray` track per-strip editing. `showC` and `showD` control layers
and directions independently. Built-in patterns derive a color index from
direction, layer, repeat group, or combinations of those indices.

Changing patterns or the pattern color count resets individual strip colors and
visibility. Resizing resets these arrays when their length changes. Palette edits
change all strips using the selected swatch.

## State restoration and export

The historical persistence format is the live SVG DOM. It stores `mwBaseSize` on
the root, `mwColorIndex` on strip paths, `mwVisibility` on strip groups, and button
selection in stroke widths. `setSavedContent` reconstructs the global arrays and
settings from those attributes. It needs the controls and the matching script;
a downloaded unmodified source file does not capture edits made to the DOM.

The 2026 update corrects three restoration defects: directions were assigned to
`showD[d]` instead of `showD[i]`; geometry and selection thresholds were computed
before saved spacing was restored; and hidden-control state was read from the
button rectangle rather than its containing group. Reload tests use a fresh SVG
document so existing JavaScript globals cannot hide these errors.

The new HTML wrapper provides a deliberately narrower, reliable **static artwork
export**. It clones the current SVG, removes controls, tools, hover descriptions,
scripts, and event attributes, and downloads the result through a Blob URL. The
artwork's `<defs>`, clipping paths, and local fragment references remain intact.
It needs no external images or scripts. It is not accepted as an editable project.
There is no project import, local storage, or autosave.

## Working locally

Serve the checkout with `python3 -m http.server 8000 --bind 127.0.0.1`.
Prefer the HTML wrapper at `/editor.html`; direct `/madweave.svg` and
`/madweave_init.svg` remain available. Test the site under a project subpath as
well as `/`, because GitHub Pages serves it under `/madweave/`.

Use the commands in [README.md](../README.md#test-and-build). Python tests build
an isolated temporary site under `/madweave/`, serve it on a dynamically assigned
loopback port, and close their server/browser afterward. Browser screenshots go
to ignored `test-results/`. The browser suite requires installed Playwright and
Chromium; it fails rather than silently skipping browser verification.

## Publishing

`python3 scripts/build_site.py` copies only the explicit `PUBLIC_FILES` list into
`dist/`, plus `.nojekyll`. Adding a new public asset requires updating that list.
Unexpected output files and symlinked destinations are rejected. This prevents
accidental publication of checkout-only material. Historical broken-link
experiments are retained in Git but omitted from the site artifact.

The workflow follows GitHub's [custom Pages workflow model](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
Its build job checks JS syntax, runs Node/Python/browser tests, builds `dist/`, and
uploads that directory. Only the deploy job receives `pages: write` and
`id-token: write`. Pull requests do not deploy. Current official Actions majors
were checked against the upstream releases when the workflow was added.

One-time setup: an administrator selects **Settings → Pages → Build and
deployment → Source → GitHub Actions**. A successful `master` push then publishes
<https://rharriszzz.github.io/madweave/>. The GitHub connector used for source
changes does not expose Pages administration; that setting needs another
administrator-capable client or the GitHub settings page.

After a deployment, inspect the workflow conclusion, open the public landing
page and editor, exercise a control and an export, and check that assets load
under `/madweave/`. A source push alone is not proof of deployment success.

## Compatibility boundaries

The surrounding HTML uses semantic landmarks, visible keyboard focus, a skip
link, native links/buttons, image descriptions, reduced-motion support, and
responsive layouts. The original SVG editor uses inline mouse handlers and
hover feedback and still needs accessibility work. Do not claim full keyboard,
screen-reader, mobile-touch, Firefox, or Safari support from Chromium checks.

Batik helpers are not used in the site build or browser tests. Modernizing those
scripts, licensing the project, and deciding a durable editable format need
separate work; see [IMPROVEMENTS.md](../IMPROVEMENTS.md).
