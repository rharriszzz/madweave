# Testing record

## Original control positions and bottom view buttons

Local checks on 2026-11-05 cover the SVG entry point and the restored corner
layout. All 52 original controls retain the same screen coordinates in flat and
corner views, verified at 1280- and 390-pixel widths. Flat, Corner, Angle and More
occupy a separate bottom row group. Unsupported corner controls are dimmed.

The new application regression starts from `madweave.svg` with unsaved painting,
opens the SVG-style shared editor, checks retained flat work and the inherited
palette, verifies all twelve 60° angle choices, applies 240°, toggles L, and
saves/reopens the SVG-style editor offline. It also checks that static SVG export
omits the new controls. All 17 application/static tests passed in Chromium
153.0.8010.12, Firefox 155.0 and Playwright WebKit 26.6. The new regression also
passed in Chrome for Testing 145.0.7632.6.

The integrated corner browser suite passed all eight rendering representatives
and its online/offline transactions in each engine. Its desktop viewport is now
1280 × 1300 so the restored layout provides at least the former 650-pixel weave
resolution for the pixel audits. Their 4/255 channel tolerance, exact-ray checks,
independent material checks and negative controls are retained. Four math tests,
five static build/link tests, syntax and whitespace checks also passed.

The five README screenshots were regenerated from the built editor. The third
uses the original palette and positions with L enabled. These are local results;
this work has not been pushed or deployed. WebKit used the established local
extracted-library setup described below, and is not installed Safari testing.

## Integrated editor release on 2026-11-05

The release keeps the complete Stage 1–3C branch history and the reviewed
formula-intent correction. The original planar engine and state module remain
unchanged. The following checks were rerun for the README/CI release changes:

| Check | Result |
| --- | --- |
| Syntax: engine, project, editor, corner adapter/model/runtime and capture script | Passed |
| Math | 4 tests passed |
| Static build/link/boundary checks | 5 tests passed; 24 public files |
| Regenerate integrated runtime and research offline bundle | Byte-for-byte identical to committed assets; all 84 certificates checked |
| Integrated corner semantics | 3,024 round trips over 84 constructions; 3,028 independent color cases; 5 negative controls passed |
| Original application browser suite | 11 tests per engine passed in Chromium 145.0.7632.6, Firefox 155.0 and Playwright WebKit 26.6 |
| Integrated corner browser suite against built `/madweave/` site | Passed in all three engines, 8 rendering representatives per engine |
| CI-matched Chromium 153.0.8010.12 | Additional run passed all 16 application/static tests and the full integrated corner browser suite |
| README screenshots | 5 real built-editor captures, reviewed at full size and 830-pixel README width; relative documentation links checked |
| Dependency and whitespace checks | `npm ci` and `git diff --check` passed |

The corner browser suite includes retained planar/corner sessions, real strip
painting, palette opacity and seam warnings, import failures/races, legacy file
imports, native Save/Open, offline reopen/edit/resave, and standalone plain and
annotated SVG export. Formula transactions compare complete saved designs for
CP1/CC1, mode round trips, construction controls moved away/back, immediate
redraw failures, staged failure/retry, and reopening/resaving the corrected
worked HTML. Pixel audits retain their original 4/255 channel tolerance.

Node v24.16.0 and Python 3.14.4 were used locally, with Playwright 1.63.0 for
both clients and pngjs 7.0.0. The established local WebKit setup required
`LD_LIBRARY_PATH=/tmp/madweave-webkit-libs/usr/lib/x86_64-linux-gnu` and
`PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` after its libraries were supplied.
An initial launch without these settings failed before tests ran. These local
workarounds are not CI configuration; CI installs system dependencies normally.

The Pages workflow now locks Node test dependencies with `npm ci`, verifies
generated-asset consistency, and runs both corner suites in the existing
Chromium/Firefox/WebKit matrix. Each matrix job selects its browser with
`MADWEAVE_STAGE2_BROWSERS`. The screenshot files stay outside the static-site
allowlist. Reproduction:

```sh
npm ci
python3 scripts/build_corner_runtime.py
python3 research/build-corner-package.py
git diff --exit-code -- corner-runtime.js research/corner-prototype/bundle.mjs
npm run test:corner
npm run test:corner:browser
npm run screenshots
```

See [browser setup](BROWSER_TEST_SETUP.md) for the Python environment and browser
installation, and [screenshot settings](SCREENSHOTS.md) for capture details.
The broader historical research/browser suites were not rerun for this release.
Automated WebKit is not installed Safari, responsive emulation is not physical
touch-device testing, and physical constructibility remains unverified.

## Earlier application verification

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

The local automated suite passes in Chromium, Firefox, and WebKit. WebKit used
temporary extracted Linux libraries during investigation; the permanent
setup is documented in [BROWSER_TEST_SETUP.md](BROWSER_TEST_SETUP.md). CI installs
the system dependencies normally for each engine. These are desktop and responsive-emulation
checks, not physical touch-device or screen-reader certification. Actual Mac
Safari, Chrome, and Firefox results are recorded in
[the Mac testing record](MAC_TESTING.md#results-on-2026-11-01); keep using its
acceptance checklist after browser/editor updates.

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


WebKit testing exposed hover-help text intercepting clicks on SVG controls.
Documentation groups now have `pointer-events="none"`; both normal initialization
and legacy saved-DOM initialization apply it. The existing control-toggle and
offline save/reopen tests detect this regression. HTTP requests are blocked
explicitly in offline-file tests because WebKit's simulated offline setting
also prevented local-file navigation.

## Mac and live-site verification

On 2026-11-01 the full suite also passed on macOS 27.2 in Playwright Chromium,
Firefox, and WebKit, and in installed Chrome through `MADWEAVE_CHANNEL=chrome`.
Targeted WebDriver checks exercised actual installed Safari and Firefox against
the published editor, including native downloads, file reopening/resaving,
project import, and static artwork export. See [MAC_TESTING.md](MAC_TESTING.md)
for exact versions, the Firefox startup fix, scope, and live portfolio checks.


## Main integration regression checks on 2026-11-04

The research integration adds computed-style checks that keep the introductory editor preview
level at all four responsive widths and a build fixture that changes CSS content
and requires new stylesheet URLs in every page. These checks fail against the
historical rotated CSS and unversioned builder, respectively, and pass against
the current implementation. Static/application discovery now runs 16 tests
(five site tests and eleven browser tests).

The [research testing reference](../research/TESTING.md) describes the separate
34-stage suite, independent planar geometry, boundary/end pixels, symmetry,
and Firefox/Chromium clipping comparison. Research artifacts remain outside
the published site allowlist.

## Bounded corner integration on 2026-11-05

Stage 3C is tested through the existing `editor.html` and shared SVG palette/file
controls. The [integration report](../research/SINGLE_CORNER_INTEGRATION.md) and
[machine-readable evidence](../research/evidence/corner-integration.json) record:

- All 84 unchanged geometry certificates and 3,024 integrated RGBA/custom-color
  semantic round trips checked by a separate Python checker; original 268
  compatible fixed-palette assignments and their 236 color witnesses retained.
- Eight integrated browser representatives per engine in Chromium 145.0.7632.6,
  Firefox 155 and Playwright WebKit 26.6, plus all nine original prototype
  examples and nineteen Stage 3B family representatives in all three engines.
- Native pointer/keyboard painting, full joined-strip/fringe/self-crossing
  identity, opacity including zero, palette aliases and seam warnings, failed
  palette/view/import/mode operations, deliberately stale reads, both retained
  session designs, and an actual wrong-paint negative control.
- Native Open of actual legacy files, offline save/open/edit/resave in each
  mode with HTTP blocked, and independent rendering/auditing of plain/annotated
  SVG exports. Flat interior/near-ray/exact-ray pixels retain 4/255 limits;
  representative final errors are below 1.31/255.
- All eleven planar application tests per engine; unchanged planar seam checks
  cover 163 configurations and 90,350 pixels per engine, including transparency.
  All eighteen unit-only research stages pass; the allowlisted site build now
  has 24 public files. No deployment or master merge is part of these checks.

Browser samples are not exhaustive rendering of all palette/view combinations.
WebKit automation is not installed Safari or physical-device verification.
Physical constructibility remains unverified and requires its separate gate.
