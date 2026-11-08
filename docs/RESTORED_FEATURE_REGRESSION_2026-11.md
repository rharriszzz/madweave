# Restored-feature regression review — November 2026

Review started November 7, 2026 (America/New_York; November 8 UTC).
Baseline: `origin/master` at `5afb928`. The existing research branch and its
untracked `research/SOL_RELEASE_README_PROMPT.md` were preserved. All review
work uses the separate `regression/restored-features-2026-11` worktree/branch.

**Outcome:** the restored features pass the exercised workflows in Chromium,
Firefox and WebKit. No application regression was found. Changes strengthen
test coverage and correct testing documentation; no application behavior changed.

## Scope and comparison

Reviewed the November 5–7 master changes, including `d46c195`, `a7d9342`,
`c009b7e`, `6445f5c`, `5afb928`, subsequent README/gallery documentation, and
the README, development/testing instructions and browser test implementations.
The two latest commits select existing application tests for the smoke workflow;
they did not add browser assertions. Toolchain changes primarily affect CI.

| Original/restored feature | Current implementation and verification |
| --- | --- |
| Original 52 SVG controls | Coordinates retained in Flat and Corner at 1280 and 390 px; original SVG entry transfers unsaved planar work into the shared editor. |
| Eight sizes, four spacings | Planar: 9–72 total strips. Corner: certified individual ends; total round(9 × size × angle/360), or round(3 × size × angle/360) for one hexweave class. |
| Five patterns, six color counts | Planar supports all 30 combinations at each size. Corner intentionally supports monochrome and five three-label formulas; other counts are disabled. |
| Coloring and visibility | Planar retains per-strip painting/hiding, class/direction filters, handedness, layer order and center. Corner paints complete joined strips; a/b/c stages a hexweave class, and unsupported planar controls are dimmed and excluded from tab order. |
| Palette and opacity | Shared original eight swatches, recent colors and HSV/opacity controls; corner adds keyboard activation and slider arrows. Transparent strips remain model material. |
| Persistence | Standalone editable HTML includes the active design only. Original editable SVG and earlier supported corner files can be imported. No autosave or automatic persistence across an ordinary page reload. |
| Artwork | Static SVG removes editor controls/scripts; corner exports optionally include inspection annotations. Artwork is not an editable project. |

## Environment

Ubuntu 26.04.1 under WSL2, kernel `6.18.33.2-microsoft-standard-WSL2`;
Node **24.16.0**, Python **3.14.4**, Python/Node Playwright **1.63.0**,
pngjs **7.0.0**. `npm ci` succeeded with zero reported vulnerabilities.
Browsers launched and reported Chromium **153.0.8010.12**, Firefox **155.0**,
Playwright WebKit **26.6**. These match the repository's pinned Playwright
clients; this is local execution, not a claim that GitHub-hosted workflows ran.

Used existing `/tmp/madweave-python-tests` and `/tmp/madweave-browsers` installs.
WebKit used the previously documented extracted libraries via
`LD_LIBRARY_PATH=/tmp/madweave-webkit-libs/usr/lib/x86_64-linux-gnu` and
`PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1`. Browser launch and actual tests
still ran; disabling the dependency preflight does not skip tests. CI uses its
pinned Playwright Noble container instead of this local workaround.

## Checks and results

The browser tests build the public allowlist and serve it under `/madweave/`.
They use native Playwright pointer/keyboard actions, with direct state inspection
and targeted setup/failure injection. This is automated interface testing, not
an assertion that every configuration received manual visual review.

- **Original smoke selection:** all five cases in `restored-controls-smoke.yml`
  passed in all three engines, including SVG layout/handoff, sizes/formulas,
  restored serialized state, HSV/opacity and offline editable projects.
- **Expanded application checks:** all 18 tests passed in each engine (13 browser
  and five static-site tests). The planar sweep now exercises 240 size/pattern/count
  combinations and all four spacings at each size. Existing tests cover native
  strip painting, visibility, orientation, serialized SVG reload, legacy SVG
  import, invalid-import preservation, static export and offline resaving.
- **New interaction regression:** actually applies all twelve 60°–720° angles
  in the supported sixfold construction; compares captured parameters, strip
  counts and angle labels. Exercises Enter/Space on bottom controls, all three
  staged hexweave classes, their visible-class state, painting through inspection,
  all 32 hexweave size/spacing combinations, retained painting and inert disabled
  controls. Added to the fast three-browser workflow as well as full discovery.
- **Planar research:** all **33 stages** of the current complete runner passed.
  This includes four math tests, independent geometry/indexing/order/symmetry,
  real editor buttons, pointer/hover behavior, hexweave, crossing pixels at sizes
  2/3, triple areas, boundary/matrix pixels and Chromium/Firefox seam comparison.
  Older documentation describes a historical 34-stage baseline; the actual
  current runner records 33 without `--app`.
- **Corner semantics:** 3,024 round trips over the original 84 constructions,
  3,028 independent color cases and five negative controls passed. The size suite
  passed all 1,728 added constructions, 36 saved end selections, two extreme-angle
  mesh checks, 36 independent color cases and four negative controls.
- **Planar seam/export regression:** passed in each engine, 163 configurations
  and 90,350 pixel samples per engine, including translucent material and rendered
  static SVG. Maximum measured error was 2.78/255, below the unchanged 4/255 limit.
- **Integrated corner browser suite:** passed in all three engines: eight legacy
  rendering representatives and six individual-end/size/angle/spacing examples
  each, strip/fringe/hidden-position painting, seam inspection, palette aliases,
  zero opacity, mode retention, staged/rejected constructions, failed rendering
  rollback and asynchronous import races. Old Stage 3A/3B files and the committed
  worked editable HTML were opened through actual file workflows. Offline corner
  reopening/editing/resaving and independently audited plain/annotated SVG output
  passed with zero HTTP/HTTPS requests and no page errors. Existing wrong-paint
  negative controls remain effective.
- **Generated assets and syntax:** runtime and offline research bundle rebuilt
  byte-for-byte identical to their committed versions. The runtime builder
  independently revalidated the 84 original and 1,728 added certificates, using
  its source-hashed certificate cache copied from the existing checkout after
  stopping an initial cold build. This was not a fresh producer run for every
  cached construction. All six application JavaScript syntax checks passed;
  whitespace and final static-site/link checks passed.

Compared with the November 5 testing record, these results retain the original
3,024 semantic round trips, rendering tolerance and offline workflows. Application
discovery grows from 17 to 18 tests per engine; the new case adds applied-angle,
hexweave and keyboard transactions, and the existing planar combination sweep
grows from 30 combinations at one size to 240 across all eight sizes. Individual
end audits again covered 576 pixels per engine, including 276 outside the working
circle, with maximum error 1/255. No measured regression was found relative to
the recorded baseline.

## Investigation and changes

No application defect was found. A first version
of the new test failed in WebKit because pointer travel changed live inspection
selection before clicking a hexweave control. Hovering before the snapshot makes
the comparison measure the button transaction; the complete state assertion is
retained. This was a test setup issue, not lost painting or altered geometry.

Updated `research/TESTING.md`: its old Playwright 1.58.2/Node 22 instructions
contradicted the current locked clients and Node 24/Python 3.14 workflows.
No geometry certificates, expected pixel values or tolerance limits were changed.

## Persistence workflows and limits

Application tests create designs combining spacing, size, formula/count,
orientation/center, direction/class visibility, custom RGB/opacity, recent colors,
strip painting/hiding and hidden controls. They download editable HTML, open it
in a fresh context with HTTP/HTTPS blocked, compare complete captured state,
edit, download again, reopen the second file and compare again. They also import
the saved file into the website and export static SVG.

Ordinary reload is different from reopening a saved project: there is no autosave.
Serialized SVG reload restores supported legacy state; editable HTML restores its
embedded active design. Mode switching retains both live designs during the
session, but a saved project persists only the active one. Planar size/formula
changes intentionally reset painting; corner size/spacing preserve surviving
strip colors, while a changed construction/formula can explicitly replace them.

## Remaining limitations and recommendations

The suite provides strong protection for the restored controls, but the five
original smoke cases alone are insufficient. Keep the expanded smoke case and
the full Pages application/corner suites plus independent planar research checks.
The smoke workflow is master-push/path filtered; full Pages tests also run on PRs.
Successful local tests do not establish successful Actions setup, Pages deployment
or live-site behavior after publication.

Narrow-window checks include 1280/768/390/320 px website layouts and 390 px
SVG control positions. Desktop and 390 px Chromium corner screenshots were also
visually inspected. The integrated canvas requires horizontal scrolling at narrow
widths, as its on-page help explains; the direct SVG view scales to the window.
This remains a usability limitation. These checks do not establish usable physical touch targets.
Complete planar keyboard navigation, screen-reader usability, real touch devices,
installed Safari, Mac/Windows browser builds, print/PDF workflows and long-running
sessions were not newly validated. Keep the Mac acceptance checklist and add
physical-device testing before making broader accessibility/mobile claims.
Browser geometry/pixel samples are representative rather than an exhaustive
rendering of every angle/size/spacing/palette/inspection combination. The finite
corner catalogue's unsupported combinations and physical constructibility limits
remain existing documented boundaries; no new corner mathematics was attempted.

## Reproduction

Use the versions above, install `requirements-dev.txt` and `npm ci`, then set
`PLAYWRIGHT_BROWSERS_PATH` to the matching installed browsers. Run:

```sh
python -m unittest discover -s tests -v  # repeat with MADWEAVE_BROWSER per engine
python research/run-tests.py
python scripts/build_corner_runtime.py
python research/build-corner-package.py
git diff --exit-code -- corner-runtime.js research/corner-prototype/bundle.mjs
npm run test:corner
npm run test:corner:browser
```

Local logs are in ignored `test-results/regression/`; independent research
measurements/artifacts are in ignored `research/output/`. The report is tracked;
temporary browser binaries, downloaded projects and bulk output are not committed.
