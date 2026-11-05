# Planar research testing

The [Stage 2 correction pass](SINGLE_CORNER_STAGE2_CORRECTIONS.md) adds
`research/corner-prototype-transactions.test.cjs`. The normal prototype browser
runner calls its 17 actual-control failure/race tests in every engine. A focused
Chromium run is `node research/corner-prototype-transactions.test.cjs`.
The shared normal paint audit now rejects an actual wrong visible material,
while the old unpainted order-label mutation is explicitly metadata-only.

For the separate [Stage 2 prototype](SINGLE_CORNER_STAGE2.md), rebuild the fixed
catalogue/oracles with `python3 research/build-corner-prototype.py` and run
`node research/corner-prototype-browser.test.cjs` with Playwright and pngjs
available through NODE_PATH. That test starts its own loopback server, checks
Chromium/Firefox/WebKit and passes actual SVG identity/order records back to the
independent Python checker. Browser installation and host details are in the report.

The [bounded crop follow-up](SINGLE_CORNER_CROP_FOLLOWUP.md) adds
`python3 research/corner-crop-followup.py` after the Stage 1 reproduction below,
and `python3 research/corner-coordinate-check.py` for rotated inverse/circle
bound examples. Check a supplied region certificate independently with
`python3 research/check-corner-certificate.py PATH.json`. The checker exits zero
only for Validated; Invalid and Unvalidated results include a witness and exit one.
No producer import is needed by that standalone checker.

The separate [single-corner Stage 1 research](SINGLE_CORNER_STAGE1.md) can be
reproduced with `python3 research/single-corner-stage1.py` (Python 3 and Node).
It writes reference geometry/identity evidence under ignored
`research/output/single-corner-stage1/`, including a compact summary matching
the [tracked snapshot](evidence/single-corner-stage1.json). It is not a corner
feature implementation, browser acceptance run or physical validation. Its
finite parameter bounds and crop-fringe limitation are documented in the report.

The research suite connects control behavior and the planar model to executable
checks against the original engine. It complements the application suite in
[`tests/`](../tests) and the historical [application testing record](../docs/TESTING.md).
The tests characterize current behavior; the [cone-readiness checklist](CONE_READINESS.md)
records the completed preparation and the next geometry implementation phase.

## Run the suite

From the repository root:

```sh
python3 research/run-tests.py --unit-only
```

For the full research suite, install the workflow's Node dependencies and matching
browsers. An external dependency folder avoids adding package files to this
buildless repository:

```sh
npm install --prefix /tmp/madweave-research-deps --no-save playwright@1.58.2 pngjs@7.0.0
export NODE_PATH=/tmp/madweave-research-deps/node_modules
/tmp/madweave-research-deps/node_modules/.bin/playwright install chromium firefox
python3 research/run-tests.py
```

On supported Linux runners, use `playwright install --with-deps chromium firefox` when
system browser libraries are missing. See [persistent browser setup](../docs/BROWSER_TEST_SETUP.md)
for durable installations. Node 22+ and Python 3.10+ are sufficient for the
research runner; the application's existing README specifies its own toolchain.
The research workflow's pinned Node Playwright and the application's Python
Playwright dependency are separate clients and may need different browser builds.

The runner serves this checkout on an automatically allocated loopback port,
passes its URL to all research browser scripts, and stops its server on exit.
No separately managed server is required. It records each stage, command, exit
code, duration, and log in `research/output/suite/results.json`, and exits
unsuccessfully on the first failing stage. Output files are ignored by Git.
The `--unit-only` run records a **partial suite**, not browser verification.

To include the Python application's browser suite, install
[`requirements-dev.txt`](../requirements-dev.txt) and the desired Python
Playwright browser, then run this with that Python environment:

```sh
.venv/bin/python research/run-tests.py --app
```

`MADWEAVE_BROWSER` and `MADWEAVE_CHANNEL` configure that application suite as
before; the parameter-matrix pixel tests use Chromium, and the seam comparison also uses Firefox. Each research browser script can
also run independently against `http://127.0.0.1:8766/editor.html`, or an editor
URL supplied through `MADWEAVE_URL`. Both routes exercise the actual editor,
except the explicitly separate SVG diagnostic.

## Seam diagnosis and fix regression

The separate three-engine [SVG seam workflow](../.github/workflows/seam-isolation.yml)
runs `seam-fix-check.cjs` against the actual renderer, including translucent
colors, visibility, outlines, and the actual SVG export rendered as an image.
It also runs `seam-isolation-check.cjs` in Chromium and Firefox after explicitly
restoring the old painting method as a negative control. These checks supplement
the 34-stage integration baseline; they are not included in that stage count.
See [the solution report](SVG_SEAM_FIX.md) for commands, measured results, and
coverage limits. Install WebKit as well to run all three engines locally.

## Coverage map

| Check | What it establishes | What it does not establish |
|---|---|---|
| `tests/math.test.cjs` | Original-engine color conversions, strip-name uniqueness, and palette-index bounds | Browser rendering or physical weaving |
| `planar-indexing.test.cjs` | Original-engine indexing, classes, groups, period three, and equal class counts at all eight sizes and both centers | Browser layer visibility; this test formerly used copied functions and now executes `madweave.js` |
| `crossing-audit.cjs` | Original source functions: pairwise antisymmetry and mask permutations/counts in eight orientations | Global transitivity, complete mask coverage, or pixels |
| `planar-geometry.test.cjs` | Independent nearest-strip slab/finite-rectangle construction; coverage, triangle shape, uniqueness, local order, and central occupancy at all 256 settings | A separate physical precedence law or arbitrary new spacings |
| `symmetry.test.cjs` | 768 rotation cases, 383,616 pair comparisons, and 5,280 visible-top comparisons; class/color distinctions | Every displaced center or nonplanar symmetry |
| `angular-baseline.test.cjs` | At f=1: intersections, clipped segments, strip picking, branch handling, endpoint contraction, and startup-state limitations | Any nonunit fraction or completed unit replication |
| `boundary-matrix-check.cjs` | 128 settings, 512 center/end patches, 3,608 boundary/end pairs; neutral clipped/unclipped controls | Every boundary point or a browser-source diagnosis |
| `compare-seams.cjs` | Same SVG geometry in Chromium/Firefox; measured seam pixels and solid unclipped neutral control | Identical browser raster output or absence of exact-edge artifacts |
| `planar-matrix-check.cjs` | Actual transformed SVG shapes, painter order, and class partitions at all 256 settings; 4,278 independent central pixel probes over 128 cases; 240 color-invariance cases | Pixels everywhere in the finite design or broad two-sided-boundary coverage |
| `browser-svg-check.cjs` | Eight configurations of the separately labeled SVG diagnostic; paths, masks, references, and exports | Correctness of the editor UI or an independent weaving algorithm |
| `editor-button-experiments.cjs` | Inventory of 52 SVG targets; every pattern/count/size, palette, recent swatch, slider, filter, orientation, spacing, outline, and hide-control action | All physical pointer paths; ordinary buttons dispatch actual `mousedown` handlers, while sliders use real coordinates |
| `editor-pointer-experiments.cjs` | Real palette/mode/slider presses and original strip-edit functions | Complete hover selection; strip selection is injected for isolation |
| `editor-hover-paint.cjs` | Real hover/dwell/move/click selects and paints a strip | Exhaustive selection at intersections or after every geometry change |
| `hexweave-comparison.cjs` | Pairwise-disjoint a/b/c sets and full union, both centers at size 2; eight SVG/PNG captures | Partition at every size/orientation or symmetry proof |
| `crossing-pixel-check.cjs` | 24 two-strip crossings per center at sizes 2 and 3 match `isCoveredBy`; C reverses selected crossings | Triple overlaps or all eight X/hand orientations |
| `triple-area-check.cjs` | 132 selected three-strip interior points per orientation match active-mask painter order at size 3 | Independent mask construction, every triangle, or explicit mask-edge clearance |
| `mask-boundary-check.cjs` | Both sides of distinct-mask boundaries; finite strip bounds, strip-edge exclusions, and every detected transition type represented | Every physical boundary; triangles can contribute duplicate/reversed probes |
| `tests/test_site.py` | Publication allowlist, links/assets, output-target rejection, and content-sensitive stylesheet URLs | External historical links |
| `tests/test_browser.py` (`--app`) | Real application controls, saving, offline reopening/resaving, import, artwork export, and responsive wrapper | Physical-device certification or cone geometry |

The button suite verifies manual-edit reset on all pattern/count/changed-size
controls, preservation when reselecting the same size, filter visibility counts,
orientation reversibility and fixed strip geometry, spacing preservation, recent
color **and opacity** recall, and restoring hidden controls. It records the two
known V/palette discrepancies from [the control reference](CONTROLS.md) as
current-behavior characterizations, not desired product behavior.

## Latest local research run

On 2026-11-04, the full runner passed **34 stages with `--app`** (33 research stages without it), using Node 24.16.0,
Playwright 1.58.2, Chrome for Testing 145.0.7632.6, and pngjs 7.0.0:

- 52 SVG control targets, with 153 recorded state observations.
- All eight diagnostic orientations and both-center hexweave partition checks.
- 48/48 two-strip crossing samples at each of sizes 2 and 3.
- 1,056/1,056 three-strip interior samples across eight orientations.
- 924/924 boundary pairs, or 1,848/1,848 side samples, across eight orientations.
- Original-engine math/indexing/crossing checks and five site tests.
- 3,608/3,608 boundary/end pairs at 128 settings, including 384 H/R/L end pairs.
- 768 symmetry cases, 383,616 pair comparisons, and 5,280 visible-top comparisons.
- 15 finite intersection, 428 unit-clipping, and 5,184 unit-fraction picking checks.
- Chromium/Firefox same-geometry seam controls; see [boundary rendering](BOUNDARY_RENDERING.md).
- Independent finite-cell geometry at 256 settings: 158,208 visible-cell checks
  and 92,928 generated triangle checks.
- Browser geometry, class partition, and painter order at 256 settings;
  4,278/4,278 central pixel probes at 128 settings, including 32 explicitly empty
  triple-overlap cases at extra-wide spacing.
- 240 pattern/count/orientation cases with unchanged strip/mask geometry and
  independently checked palette-index formulas.

The separate negative control repainted strips black in the browser DOM and
correctly caused all 924 boundary pairs to fail. Pixel thresholds were unchanged.
Two additional negative controls removed a populated mask and duplicated its
triangles; the independent geometry test rejected both. See the
[geometry matrix report](GEOMETRY_MATRIX_REPORT.md) for the new audit's method.
The local host required Playwright's Ubuntu 24.04 browser build; its downloaded
Chrome executable was supplied through a temporary launcher override. No launch
override is required by the repository or its Ubuntu CI workflow.

The complete local run included `--app` and passed all eleven Chromium
application tests. The same eleven application tests also passed separately in
Firefox using Python Playwright 1.63.0. The comparison's Firefox 155.0 used Node
Playwright 1.63.0 and the matching installed build; Chromium's research audits
retained Node Playwright 1.58.2 / Chromium 145.0.7632.6. Optional
`MADWEAVE_FIREFOX_NODE_PATH` and `MADWEAVE_FIREFOX_BROWSERS_PATH` let the runner
use a separate installed Firefox client/build locally. They are unnecessary in
CI, which installs both research browsers with its pinned Node client.

Baseline commit `61603be` passed [branch CI](https://github.com/rharriszzz/madweave/actions/runs/41919725799).
Completion commit `e862210` passed all 34 stages in
[run 41923169422](https://github.com/rharriszzz/madweave/actions/runs/41923169422),
with [logs, measurements, and images](https://github.com/rharriszzz/madweave/actions/runs/41923169422/artifacts/13368262015).
That run includes both research browsers and the Chromium application suite.

## Evidence and next tests

JSON, logs, SVGs, and annotated/unmarked PNGs live under `research/output/`.
The branch workflows upload their corresponding outputs; these research files
are not part of the published website. For a durable finding, record the method,
configuration, result, and limitation in Markdown rather than relying on a
retained artifact alone.

The consolidated `planar-research.yml` workflow runs the full runner on master and research
branch pushes and pull requests to master. The six individual browser workflows
remain available by manual dispatch, avoiding duplicate automatic experiment
runs. The consolidated baseline passed CI; the workflow now also installs Firefox
and the Python application client and runs the 34-stage `--app` command.

The preparatory symmetry, broad boundary/end, Firefox rendering-control,
and unit-fraction angular tests are now complete. The next implementation tests
are the f=1 replacement pipeline, nonunit fixture, seam/global-strip identity,
bounded curve approximation, and inverse selection in the
[cone mapping contract](CONE_MAPPING_SPEC.md). Those nonunit tests belong to
the next phase and have not been executed during preparation.


## Main branch integration review

The research branch already contained main revision `7034dda`, including all
five main commits after local revision `aa3f3ca`. Their implementation changes
concerned the hero CSS, content-versioned stylesheet build, and Mac Firefox test
isolation; none changed the weaving engine.

Before merging, the older site changes received stronger regression coverage:
computed browser styles require an unrotated hero at 1280, 768, 390, and 320 CSS
pixels, and a temporary source fixture verifies that changing CSS content changes
the stylesheet URL in all three built pages. The original rotated CSS from
`aa3f3ca` fails the computed-style assertion; the pre-versioning builder from
`fc15617` fails the changed-content URL check. Both current checks pass.

The application/static suite now has **16 tests**: eleven browser tests and five
site tests. The separate Mac-only launch branch cannot be rerun on this Linux
host; its recorded Mac results remain in `docs/MAC_TESTING.md`. The consolidated
research workflow now also runs on master so this coverage continues after merge.


## SVG seam source isolation

The separate [seam-isolation diagnostic](SEAM_ROOT_CAUSE.md) runs eight reduction
stages on the actual SVG and fifteen minimal cases in each browser. It verifies
source-over predictions, checks the standalone fixture, and confirms a union
clip has no seam across 48,400 interior pixels. Its dedicated workflow is
`seam-isolation.yml`; these exploratory checks do not change the baseline
34-stage suite or the application's renderer.
