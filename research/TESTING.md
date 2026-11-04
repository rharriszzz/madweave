# Planar research testing

The research suite connects control behavior and the planar model to executable
checks against the original engine. It complements the application suite in
[`tests/`](../tests) and the historical [application testing record](../docs/TESTING.md).
The tests characterize current behavior; the [cone-readiness checklist](CONE_READINESS.md)
identifies the work still needed before changing the geometry.

## Run the suite

From the repository root:

```sh
python3 research/run-tests.py --unit-only
```

For the full research suite, install the workflow's Node dependencies and matching
browser. An external dependency folder avoids adding package files to this
buildless repository:

```sh
npm install --prefix /tmp/madweave-research-deps --no-save playwright@1.58.2 pngjs@7.0.0
export NODE_PATH=/tmp/madweave-research-deps/node_modules
/tmp/madweave-research-deps/node_modules/.bin/playwright install chromium
python3 research/run-tests.py
```

On supported Linux runners, use `playwright install --with-deps chromium` when
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
before; the research pixel tests use Chromium. Each research browser script can
also run independently against `http://127.0.0.1:8766/editor.html`, or an editor
URL supplied through `MADWEAVE_URL`. Both routes exercise the actual editor,
except the explicitly separate SVG diagnostic.

## Coverage map

| Check | What it establishes | What it does not establish |
|---|---|---|
| `tests/math.test.cjs` | Original-engine color conversions, strip-name uniqueness, and palette-index bounds | Browser rendering or physical weaving |
| `planar-indexing.test.cjs` | Original-engine indexing, classes, groups, period three, and equal class counts at all eight sizes and both centers | Browser layer visibility; this test formerly used copied functions and now executes `madweave.js` |
| `crossing-audit.cjs` | Original source functions: pairwise antisymmetry and mask permutations/counts in eight orientations | Global transitivity, complete mask coverage, or pixels |
| `planar-geometry.test.cjs` | Independent nearest-strip slab/finite-rectangle construction; coverage, triangle shape, uniqueness, local order, and central occupancy at all 256 settings | A separate physical precedence law or arbitrary new spacings |
| `planar-matrix-check.cjs` | Actual transformed SVG shapes, painter order, and class partitions at all 256 settings; 4,278 independent central pixel probes over 128 cases; 240 color-invariance cases | Pixels everywhere in the finite design or broad two-sided-boundary coverage |
| `browser-svg-check.cjs` | Eight configurations of the separately labeled SVG diagnostic; paths, masks, references, and exports | Correctness of the editor UI or an independent weaving algorithm |
| `editor-button-experiments.cjs` | Inventory of 52 SVG targets; every pattern/count/size, palette, recent swatch, slider, filter, orientation, spacing, outline, and hide-control action | All physical pointer paths; ordinary buttons dispatch actual `mousedown` handlers, while sliders use real coordinates |
| `editor-pointer-experiments.cjs` | Real palette/mode/slider presses and original strip-edit functions | Complete hover selection; strip selection is injected for isolation |
| `editor-hover-paint.cjs` | Real hover/dwell/move/click selects and paints a strip | Exhaustive selection at intersections or after every geometry change |
| `hexweave-comparison.cjs` | Pairwise-disjoint a/b/c sets and full union, both centers at size 2; eight SVG/PNG captures | Partition at every size/orientation or symmetry proof |
| `crossing-pixel-check.cjs` | 24 two-strip crossings per center at sizes 2 and 3 match `isCoveredBy`; C reverses selected crossings | Triple overlaps or all eight X/hand orientations |
| `triple-area-check.cjs` | 132 selected three-strip interior points per orientation match active-mask painter order at size 3 | Independent mask construction, every triangle, or explicit mask-edge clearance |
| `mask-boundary-check.cjs` | Both sides of distinct-mask boundaries; finite strip bounds, strip-edge exclusions, and every detected transition type represented | Every physical boundary; triangles can contribute duplicate/reversed probes |
| `tests/test_site.py` | Publication allowlist, links/assets, and unsafe output-target rejection | External historical links |
| `tests/test_browser.py` (`--app`) | Real application controls, saving, offline reopening/resaving, import, artwork export, and responsive wrapper | Physical-device certification or cone geometry |

The button suite verifies manual-edit reset on all pattern/count/changed-size
controls, preservation when reselecting the same size, filter visibility counts,
orientation reversibility and fixed strip geometry, spacing preservation, recent
color **and opacity** recall, and restoring hidden controls. It records the two
known V/palette discrepancies from [the control reference](CONTROLS.md) as
current-behavior characterizations, not desired product behavior.

## Latest local research run

On 2026-11-04, the full runner passed **25 stages**, using Node 24.16.0,
Playwright 1.58.2, Chrome for Testing 145.0.7632.6, and pngjs 7.0.0:

- 52 SVG control targets, with 153 recorded state observations.
- All eight diagnostic orientations and both-center hexweave partition checks.
- 48/48 two-strip crossing samples at each of sizes 2 and 3.
- 1,056/1,056 three-strip interior samples across eight orientations.
- 924/924 boundary pairs, or 1,848/1,848 side samples, across eight orientations.
- Original-engine math/indexing/crossing checks and four site tests.
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

This run did **not** include `--app`; prior application results remain recorded
in the application testing documents. It was a local run of the working tree,
not verification of a new GitHub Actions run.

## Evidence and next tests

JSON, logs, SVGs, and annotated/unmarked PNGs live under `research/output/`.
The branch workflows upload their corresponding outputs; these research files
are not part of the published website. For a durable finding, record the method,
configuration, result, and limitation in Markdown rather than relying on a
retained artifact alone.

The consolidated `planar-research.yml` workflow runs the full runner on research
branch pushes and pull requests to master. The six individual browser workflows
remain available by manual dispatch, avoiding duplicate automatic experiment
runs. This workflow wiring has been checked locally; its next Actions run is
still required to establish CI success for these changes.

The highest-value next tests are symmetry assertions with a defined meaning and
broader pixel/boundary checks near the finite ends of strips. Independent cell
geometry, the parameter matrix, and color-versus-geometry invariance now have
passing checks. The angular mapping then needs its own forward/inverse, seam,
clipping, and approximation checks, as specified in [cone readiness](CONE_READINESS.md).
