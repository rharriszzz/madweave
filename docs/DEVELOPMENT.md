# Architecture and development

## Files and entry points

| File | Purpose |
| --- | --- |
| `index.html`, `site.css` | Buildless project landing page and shared website styles |
| `editor.html`, `editor.js` | SVG iframe, offline project save/open, and static artwork export |
| `guide.html` | Current user guide and control reference |
| `project.js` | Versioned state capture, validation, application, and legacy SVG import |
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

## Editable projects

`project.js` defines the version 1 `madweave-project` state schema. It captures
all user-facing settings, the eight-color palette and opacity, four recent
colors and opacity, strip colors and visibility, size, pattern/count, selected
color, paint/hide/show mode, layers/directions, spacing, orientation/center,
outlines, and control visibility. Validation checks types, supported versions,
lengths, bounds, and RGB values and produces a fresh object with known fields.

**Save Project** downloads a standalone HTML document with two inert JSON script
blocks: `madweave-project` (validated state) and `madweave-assets` (the engine,
wrapper scripts, CSS, and five pattern images as data URLs). A small bootstrap
loads the bundled editor and reconstructs a fresh SVG inside an iframe. Saving
again reuses the bundle; no external resource is required for editing or saving
offline. Online documentation links remain links, not load dependencies.

**Open Project** reads a selected HTML/JSON project or an original editable SVG.
For imported HTML it reads only the state block; it does not execute the file's
scripts or trust its bundled application code. For a legacy SVG it extracts
known color, strip, and button attributes without inserting the document into
the page. Both paths validate state and rebuild it with the current editor code
and assets. Invalid input leaves the current editor in place. A valid import
replaces it, so users must save their current design first.

The saved HTML format avoids dependence on browser-specific Save As behavior,
relative script/image paths, or native file-system picker APIs. Saving downloads
a new copy instead of overwriting an existing file. Loading an offline saved
project is explicitly tested through `file://` with HTTP requests blocked.

Static artwork export remains separate: it clones only the current SVG and
removes scripts, controls, tools, descriptions, and event handlers. It keeps
local definitions and clipping references. An artwork export lacks the original
editable controls and is rejected by Open Project. There is no local storage,
autosave, or undo history.

The hidden-control routine now ignores whitespace text nodes in old SVG files
and leaves the HB control available so users can bring the other controls back.
Hover-help groups use `pointer-events="none"` so their text cannot intercept
clicks on controls, including in WebKit.

## Working locally

Serve the checkout with `python3 -m http.server 8000 --bind 127.0.0.1`.
Prefer the HTML wrapper at `/editor.html`; direct `/madweave.svg` and
`/madweave_init.svg` remain available. Test the site under a project subpath as
well as `/`, because GitHub Pages serves it under `/madweave/`.

Use the commands in [README.md](../README.md#test-and-build). Python tests build
an isolated temporary site under `/madweave/`, serve it on a dynamically assigned
loopback port, and close their server/browser afterward. Browser screenshots go
to ignored `test-results/`. The browser suite requires installed Playwright and
the selected engine. Set `MADWEAVE_BROWSER` to `chromium`, `firefox`, or `webkit`;
the suite fails rather than silently skipping browser verification.

## Publishing

`python3 scripts/build_site.py` copies only the explicit `PUBLIC_FILES` list into
`dist/`, plus `.nojekyll`. Adding a new public asset requires updating that list.
Unexpected output files and symlinked destinations are rejected. This prevents
accidental publication of checkout-only material. Historical broken-link
experiments are retained in Git but omitted from the site artifact.

The workflow follows GitHub's [custom Pages workflow model](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
Its matrix jobs check JS syntax, run Node/Python/browser tests in Chromium,
Firefox, and WebKit, and build `dist/`. The Chromium job uploads the site;
deployment waits for all three engines to pass. Only the deploy job receives
`pages: write` and
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
screen-reader or mobile-touch support from browser automation. Actual Mac Safari
and the Mac Chrome/Firefox builds should receive the acceptance check in
[MAC_TESTING.md](MAC_TESTING.md).

Batik helpers are not used in the site build or browser tests. Modernizing those
scripts, licensing the project, and extending the editable format need
separate work; see [IMPROVEMENTS.md](../IMPROVEMENTS.md).
