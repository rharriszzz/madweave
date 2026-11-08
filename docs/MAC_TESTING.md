# Native macOS regression testing

## Results on 2026-11-07

Reviewed starting from `5afb928`, after a clean fast-forward from the earlier
Mac checkout. This includes the restored 52 original controls, Flat/Corner/Angle/
More buttons, size and spacing controls, individual ends, and integrated corner
editor. Corrections and these results are on
`test/macos-restored-controls-2026-11-07`; the published site is not automatically
updated by a push to this test branch.

### Environment

| Component | Actual installation used |
| --- | --- |
| Mac | Apple Silicon / arm64; macOS 27.2, build 26B123 |
| Node / npm | Node 24.22.1; npm 11.21.0; `npm ci` retained the lockfile |
| Existing Python | MacPorts Python 3.13.18 and the working `.venv`; initial compatibility checks used this environment |
| Preferred Python | CPython 3.14.10, installed privately with uv 0.13.7 under ignored `test-results/mac-2026-11-07/python-runtime/`; separate `venv314/` |
| Browser clients | Python and Node Playwright 1.63.0, unchanged from both repository pins; pngjs 7.0.0 |
| Optional native probe | Selenium 4.52.0; system Safari driver; geckodriver 0.33.0 for installed Firefox 120 |
| Test browsers | Persistent matching builds in `~/.local/share/madweave-playwright/` |

A MacPorts `3.14` framework directory contained no interpreter. The private
installation supplied Python 3.14 without modifying MacPorts, Homebrew, system
Python, shell configuration, or personal browser profiles. The working `.venv`
was retained; uv was added there only to bootstrap the separate interpreter.
`uv python install --no-bin` did not add global executable links. Playwright was
not upgraded. Safari WebDriver was already authorized; no additional privacy or
Full Disk Access setting was needed.

### Browser comparison

| Browser | Actual version | Regression coverage and result |
| --- | --- | --- |
| Installed Safari | 27.2 (22625.2.8.11.9) | Earlier native functional run passed restored controls and both file workflows; strengthened final repeat stopped at a locked-screen input barrier (see below) |
| Installed Chrome | 156.0.8078.81 | All 18 Python application/static tests and the complete integrated corner browser suite using the installed executable and isolated contexts |
| Installed Firefox | 120.0.1 | Native WebDriver checks; originally could not enter Corner mode because an unset SVG view box is null; corrected and retested |
| Playwright WebKit | 26.6 | All 18 Python tests and the complete integrated corner browser suite; independently tested rather than counted as Safari |
| Playwright Chromium | 153.0.8010.12 | All 18 Python tests and the complete integrated corner browser suite |
| Playwright Firefox | 155.0 | All 18 Python tests and the complete integrated corner browser suite, including isolated Mac application data |

The 18 Python tests comprise 13 application/browser tests and five static build
checks. The added application regression forces the older Firefox null-view-box
behavior through the real Corner renderer. It fails before the renderer fix and
passes afterward. Original control coordinates are still compared between modes
at desktop and narrow widths. The focused restored-controls CI selections are
included in the complete suite; none of their assertions or expected outputs
were relaxed.

The integrated corner suite retains its independent geometry/material checks,
eight legacy rendering representatives, six individual-end examples per engine,
576 end/body pixel probes including 276 beyond the working circle, and the
unchanged 4/255 channel tolerance. It also checks translucent and exactly
transparent material, near/exact seam rays, invalid/stale transactions, legacy
imports, retained modes, network-blocked offline editing/resaving, and independently
opened plain/annotated exports. End pixel error remains at most 1/255.

### Native Safari and Firefox coverage

The optional [native regression script](../scripts/test_mac_native.py) exercises
the cases below. Installed Firefox completed all 30 checks after the correction.
Safari completed an earlier functional run, but the strengthened exact-zero
endpoint repeat remains pending rather than being reported as a final pass:

- The live landing page and original SVG, plus the exact locally built artifact
  under `/madweave/`. A native Corner click hands the original SVG design to the
  shared editor. Flat, Corner, Angle and More use their actual mouse handlers.
- Flat sizes 1–8, four spacings, real dwell/move/click strip painting, individual
  hide/show, opacity and hue, layer/direction controls, handedness/order/center,
  and outlines. Flat resizing still resets manual strip colors as documented;
  this is distinct from Corner's preservation on surviving strips.
- Corner sizes 1–8 and four certified spacings, retained paint on surviving keys,
  all twelve 60-degree angle choices, all three hexweave classes, individual-end
  painting, edge settings, palette Enter, and opacity arrow keys. Unavailable
  controls are dimmed/untabbable and do not change the design. Exactly zero
  opacity leaves material in the model and survives saving/export.
- A nontrivial planar design and a nontrivial corner/hexweave design, each with
  custom painting and opacity. Complete saved envelopes, including selection,
  are compared with the design immediately before saving. Each saved file is
  reopened in a fresh WebDriver session, edited, resaved, and reopened again.
  Open Project restores the first design exactly, with static SVG export before
  and after import. Flat/Corner retain their separate in-session designs.
- A test copy of each downloaded HTML file is opened with a restrictive CSP
  blocking network connections and external resource loads. A deliberately
  attempted HTTPS fetch must trigger a policy violation. Editing and resaving
  still work. This blocks networking for the file and its inherited frames;
  the Mac's network interface and browser-wide security settings stay enabled.
- Original editable SVG, Stage 3A corner HTML, and the earlier integrated worked
  HTML import through the current editor. Original example files are not changed.
  Static exports contain no scripts, event attributes, editor controls, external
  image loads, or non-fragment hrefs. Corner artwork metadata retains the exact
  construction, palette, opacity, and strip material assignments.

Native session artifacts and temporary Firefox application data live under the
ignored output directory. Safari has no download-directory override in this
probe: its uniquely named test files briefly enter Downloads and are immediately
moved into the isolated artifact directory. Only those exact generated paths are
cleaned up; existing downloads are not read or altered. Each restart uses a new
Safari automation session or a new Firefox profile/application-data directory.
Do not manually interact with the Safari automation window during a run.

### Safari repeat blocked by the locked screen

A late Safari repeat returned successful WebDriver click commands without any
mousedown/up/click events reaching the document. A captured event trace showed
zero events while `elementFromPoint` identified the correct restored control.
The button was within the viewport and screen. A read-only macOS status check
then reported `CGSSessionScreenIsLocked=Yes`. No browser/application workaround
or security-setting change was made. The Mac needs to be unlocked normally for
native input to continue; headless browser results are unaffected.

An earlier Safari run completed controls, sizes/spacings, angles/classes,
planar/corner file reopening/editing/resaving, exports and legacy imports.
Inspection of its slider endpoint found a tiny positive opacity from physical
pixel rounding. The native runner was strengthened to reach exactly zero via
ArrowLeft and assert that value. Firefox passes this strict check; Safari's
final version of that check is pending the unlocked-screen rerun. This is an
explicit remaining native coverage gap, not a confirmed Safari application bug.

### Defects and test infrastructure findings

1. **Installed Firefox 120: Corner initialization failed.** Its unset nested SVG
   `viewBox.baseVal` is null, whereas the newer engines return an empty rectangle.
   The renderer dereferenced `.width` before reaching its existing no-view-box
   scale fallback. Optional access now selects that same fallback. The native
   failure and a regression in modern browsers demonstrate the defect and fix;
   geometry, certificates, and color rules are unchanged. The integrated runtime
   and research offline bundle were regenerated from the corrected renderer.
2. **Node corner suite: Mac Firefox could not start.** The newer suite lacked the
   existing `CFFIXED_USER_HOME` workaround used by the Python tests. It now creates
   a private application-data directory, precreates standard folders to avoid
   macOS deny-delete ACLs, and cleans it up even if browser launch fails. It does
   not access the personal Firefox data directory or change global permissions.
3. **Intermittent Chromium/Chrome test downloads failed.** Request diagnostics
   found loopback asset fetches reset with `net::ERR_CONNECTION_RESET` under the
   Python test server's default five-connection backlog. The application reported
   the fetch failure and retained the design. Increasing only the local test
   servers' listen backlog to 64 removed the resets in three consecutive complete
   four-spacing save/reopen/resave runs and the final full suites. No application
   fetch retry, persistence change, or weakened test expectation was added.

Several native probe issues were automation limitations rather than application
failures: transparent SVG hit rectangles render intentionally at opacity zero,
so Selenium's `is_displayed()` is inappropriate for them; visible control groups
are checked instead. Old Marionette's Element Click can fail on mouseup after a
mode button has already hidden its iframe on mousedown. Top-level native pointer
actions avoid sending mouseup into that hidden document. Hover selection is
settled before comparing a disabled click or a save's complete state. Older
Marionette also rounded returned numeric objects by one floating-point unit in
some cases. Capturing the application's own JSON as a string preserves its exact
values and allows strict full-state equality; no numeric tolerance was substituted.
Sliders
have physical-pixel rounding; the supported arrow-key action verifies the exact
zero-opacity endpoint. The expanded More panel is closed before narrow drawing
inspection. None of these required interface changes.

### Numerical checks and generated files

Four Node math tests passed. The integrated semantic suite retained 3,024 round
trips over the original 84 constructions, 3,028 independent color cases and five
negative controls. The size/end suite checked all 1,728 new constructions, 36
saved end selections, 36 independent RGBA cases, two extreme-angle meshes and four
rejected mutations. Final independent Python checker subprocesses used Python
3.14.10 through the test environment's PATH.

Before application changes, full regeneration of both assets matched the
committed files byte for byte: 1,812 integrated certificates (84 historical plus
1,728 size/spacing constructions) and the 84-construction research bundle. After
the renderer correction, the full Python 3.14 rebuild also matched the
incrementally packaged result exactly. Only the renderer source changes in these
assets; the catalogue and certificate data remain unchanged. No certificate,
reference image, expected pixel output, or error tolerance was replaced to make
checks pass. The integrated runtime grows from 2,798,480 to 2,798,484 bytes.

### Reproduction commands

From the checkout, the session provisioned the private interpreter as follows:

```sh
.venv/bin/python -m pip install uv
.venv/bin/uv python install 3.14 --install-dir test-results/mac-2026-11-07/python-runtime --no-bin
test-results/mac-2026-11-07/python-runtime/cpython-3.14.10-macos-aarch64-none/bin/python3.14 -m venv test-results/mac-2026-11-07/venv314
```

For an existing suitable Python 3.14 installation, use that interpreter to create
the test environment instead. These are session-local environment selections:

```sh
MAC_PY="$PWD/test-results/mac-2026-11-07/venv314/bin/python"
"$MAC_PY" -m pip install -r requirements-dev.txt
# Only the separate native WebDriver probe needs this optional package.
"$MAC_PY" -m pip install selenium==4.52.0
npm ci
export PLAYWRIGHT_BROWSERS_PATH="$HOME/.local/share/madweave-playwright"
export PATH="$PWD/test-results/mac-2026-11-07/venv314/bin:$PATH"

node --check madweave.js
node --check project.js
node --check editor.js
node --check corner-editor.js
node --check corner-model.mjs
node --check corner-runtime.js
node --test tests/math.test.cjs
npm run test:corner
for browser in chromium firefox webkit; do
  MADWEAVE_BROWSER="$browser" "$MAC_PY" -m unittest discover -s tests -v
done
MADWEAVE_BROWSER=chromium MADWEAVE_CHANNEL=chrome "$MAC_PY" -m unittest discover -s tests -v
MADWEAVE_STAGE2_BROWSERS=chromium,firefox,webkit npm run test:corner:browser
MADWEAVE_STAGE2_BROWSERS=chromium MADWEAVE_CHROMIUM_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:corner:browser

"$MAC_PY" scripts/build_corner_runtime.py
"$MAC_PY" research/build-corner-package.py
git diff --exit-code -- corner-runtime.js research/corner-prototype/bundle.mjs
"$MAC_PY" scripts/build_site.py
git diff --check
```

For native Safari, run `/usr/bin/safaridriver -p 4445` in a separate terminal,
then run the probe without touching its automation window:

```sh
"$MAC_PY" scripts/test_mac_native.py --browser safari --output test-results/mac-native
"$MAC_PY" scripts/test_mac_native.py --browser firefox --geckodriver "$PWD/test-results/geckodriver" --output test-results/mac-native
```

Provide a geckodriver compatible with the installed Firefox; this Mac used
0.33.0 for Firefox 120.0.1. The native script is deliberately separate from normal
unittest discovery and Linux CI. It writes `results.json`, downloaded projects,
SVGs and screenshots in the selected output directory, and exits nonzero on a
failed assertion. Stop the Safari driver after testing.

### Comparison with committed PC evidence and remaining gaps

The committed November 5 results in [TESTING.md](TESTING.md) cover restored control
positions, three Playwright engines, size/spacing/end geometry, semantic cases,
and earlier file workflows. The November 7 workflow adds a focused three-engine
restored-controls selection and Python 3.14/Node 24 setup. Earlier installed
Windows browser results are also committed. No uncommitted PC test output was
assumed available here. Mac runs add actual installed Safari and Firefox, Mac
file downloads, private Firefox startup, the older Firefox initialization failure,
and native file/keyboard/pointer behavior. They do not replace the independent
PC geometry evidence or silently recertify it from screenshots.

The restored controls are suitable for regular use within the documented scope
after the Firefox compatibility correction, within the completed coverage.
The final native Safari repeat above is incomplete. Remaining limits:

- Native browser checks cover selected planar/corner designs, not every
  catalogue/palette/opacity combination. Numerical catalogue checks are broader
  than native rendered samples. Keep a scheduled Mac smoke run; Linux WebKit
  cannot certify installed Safari.
- Native Firefox headless windows stopped at 450 CSS pixels despite requests for
  390 and 320; those smaller widths are covered by Playwright viewport tests.
  Native window metrics are recorded in the probe's `windowSamples` output.
- The installed Firefox is 120.0.1; a newer installed Mac Firefox was not present
  and was not installed over it. Playwright Firefox 155 is separately covered.
- Narrow windows and keyboard controls are exercised, but full planar keyboard
  access, VoiceOver, physical touch devices and physical weaving are not certified.
- Flat size/formula changes intentionally discard manual strip edits. Corner
  construction/angle changes can replace custom paint as the proposal states;
  size/spacing changes retain paint on surviving strips. Save first when needed.
- Mode switches preserve both live designs; saving persists only the active one.
  There is still no autosave or complete undo. This is documented behavior, not
  data silently omitted from a file claiming to contain both designs.

The earlier Mac record below is retained to distinguish the pre-corner editor
and its already-established Firefox isolation behavior from this regression.

## Results on 2026-11-01

These historical results covered the pre-corner application at `aa3f3ca` on the
same macOS 27.2 Mac, using Python 3.13.18, Node 24.22.1 and Playwright 1.63.0.
They establish the previous planar save/open/offline baseline; they did not test
the restored corner controls introduced afterward.

| Browser | Result | Scope |
| --- | --- | --- |
| Playwright Chromium 153.0.8010.12 | Passed, 14 tests | Entire integration/build suite, including blocked-network offline projects |
| Playwright Firefox 155.0 | Passed, 14 tests | Entire suite, using isolated macOS application data |
| Playwright WebKit 26.6 | Passed, 14 tests | Entire suite; this is separate from Safari |
| Installed Google Chrome 156.0.8078.74 | Passed, 14 tests | Entire suite through the `chrome` channel, in a temporary profile |
| Installed Safari 27.2 (22625.2.8.11.9) | Passed targeted checks | Published editor controls; real HTML downloads; exact state after file reopen, editing, resaving, second reopen, and Open Project; static SVG download after import |
| Installed Firefox 120.0.1 | Passed targeted checks | Published editor controls; real HTML downloads; exact state after file reopen, editing, resaving, second reopen, and Open Project; static SVG download |

Native Safari/Firefox reopened and resaved actual downloads and imported them
through Open Project. The Mac network remained enabled; only outer-document
resource timing was observed. The November 7 CSP checks are stronger and cover
child-frame dependencies. An initial Safari driver click after file upload
missed its event; the uninterrupted repeat passed. This is useful historical
evidence for separating a missing automation event from a reproducible defect.

### macOS Firefox startup and cleanup

The November 1 investigation established the `CFFIXED_USER_HOME` isolation used
by the Python suite: a disposable profile alone did not prevent access to the
protected shared application-data directory. Precreating standard folders also
avoided macOS deny-delete ACLs during cleanup. No Full Disk Access or personal
profile access was needed. See
[Playwright #42768](https://github.com/microsoft/playwright/issues/42768).
The November 7 work extends this existing approach to the Node corner suite.
