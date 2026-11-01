# Testing record

Reviewed on 2026-11-01. These checks run against the actual JavaScript/SVG engine
and the generated static site, rather than a reimplementation of the editor.

## Automated checks

| Check | Result | Coverage |
| --- | --- | --- |
| `node --check` for `madweave.js`, `project.js`, and `editor.js` | Passed | Syntax of the engine and export wrapper |
| `node --test tests/math.test.cjs` | Passed, four test cases | HSV primary/secondary/gray/wrapped colors; representative RGB/HSV round trips; unique strip IDs at all eight sizes and both centers; all five patterns with all six color counts |
| Python `unittest` discovery | Passed, 14 tests per engine | Eleven browser integration tests and three static build/link tests |
| `python3 scripts/build_site.py` | Passed | 22 public files, including `.nojekyll`, in `dist/` |
| `git diff --check` | Passed | Whitespace checks |

The local browser suite used Python 3.12, Playwright 1.63.0, and its installed
Chromium and Firefox. Node.js was v24.16.0. CI installs the pinned Playwright dependency and
matching Chromium, Firefox, and WebKit builds in separate jobs rather than
relying on a browser installed on the runner.

## What the browser suite exercises

- Both the serialized original design and the minimal fresh-design SVG load,
  producing 18 initial strips without JavaScript exceptions or failed requests.
- All eight sizes, all five patterns with all six pattern color counts, and all
  four spacing controls respond to real pointer clicks. Size 8 gives 72 strips
  total (24 per direction).
- A real mouse move/dwell/click selects and paints a strip. The original selector
  needs a 400 ms dwell followed by another move. Individual hide/show behavior
  is also checked through engine actions.
- All four palette sliders change their values, and palette colors remain valid
  RGB strings. Layer/direction toggles, handedness, top/bottom, center, and
  outlines change their expected state.
- A custom design is serialized, then loaded as a **fresh SVG document** for each
  spacing. Visibility arrays, selected palette color, custom strip colors,
  individual hidden strips, spacing, view box, and hidden-control state survive.
  Rebuilding the weave after restoration preserves a hidden direction.
- The HTML wrapper enables saving and export after the embedded SVG loads. A recolored
  strip survives download; the exported SVG has no scripts, event attributes,
  controls, or non-fragment asset references. The downloaded file opens as SVG.
- Editable projects round-trip at all four spacings with custom strip colors,
  opacity, recent colors, hidden strips, layer/direction choices, orientation,
  center, outlines, hide mode, and hidden controls. A fresh browser context with
  network requests blocked opens the downloaded HTML through `file://`, preserves
  every saved setting, permits further editing through the actual controls,
  downloads another project, and restores that updated state on reopening.
- The offline project makes no HTTP requests. Open Project on the hosted editor
  restores the same file's state, and artwork export still works afterward.
- Original editable SVG import restores center, spacing, visibility, and strip
  edits without executing scripts from the file. Static artwork is rejected as
  an editable project. Malformed files, unsupported format versions, and invalid
  color/opacity data leave the current design intact.
- Landing page, guide, and editor wrapper fit 1280, 768, 390, and 320 CSS-pixel
  viewports without document-level horizontal overflow. The SVG canvas itself
  scrolls inside its container. All landing-page images load.
- The landing page and guide remain readable with JavaScript disabled. Actual
  editing and export require JavaScript.

The integration server deliberately serves the built site under `/madweave/`,
matching GitHub Pages project-path behavior. Desktop and narrow landing-page
screenshots were visually reviewed; generated screenshots stay in ignored
`test-results/` and are not published.

## Static publication checks

The build tests verify the exact public-file list, every local HTML asset/link
and HTML fragment target, and external SVG script/image references. They also
verify that unexpected output files and symlinked publication targets are
rejected. They do not verify external historical URLs.

## Coverage limits

The local automated suite passes in Chromium and Firefox. WebKit could not
start locally because its system libraries are missing; CI runs it with the
required dependencies installed. These are desktop and responsive-emulation
checks, not physical touch-device or screen-reader certification. Actual Mac
Safari, Chrome, and Firefox still need [the acceptance check](MAC_TESTING.md).

The geometry checks do not prove every crossing mathematically or physically
correct, and this update does not validate a physical weaving process. The
historical Batik conversion scripts were inspected but not run; their configured
local Java/Batik paths are absent.

Editable Save Project, Open Project, offline resaving, legacy SVG import, and
static export are implemented. Autosave and full undo remain unimplemented.
Browser Save As is not required for the new project workflow.

The fresh-document restoration regression was also run with the original
`madweave.js` from commit `27baaaf` substituted at the HTTP layer. It failed on
restored geometry and state; the same regression passes with the fixes. This
confirms that it detects a pre-existing defect rather than only exercising the
new implementation.

## Installed Windows browsers

The installed Windows Chrome 156.0.8078.48 and Edge 156.0.4314.58 passed a separate
check using isolated headless profiles and their debugging protocols: open a
self-contained project from disk, change actual pattern/size controls, save,
open the downloaded file directly, and import it through Open Project. The full
state matched after both reopening paths. These checks use the actual installed
Windows executables and do not touch personal browser profiles.

Installed Windows Firefox 158.0.1 passed the same offline open/edit/save/direct
reopen/Open Project sequence through WebDriver BiDi in an isolated profile.
Firefox's test fixture was copied to a normal Windows-local file because its
file navigation rejected the WSL network-share path; the application workflow
then passed without changing Firefox or upgrading it.
