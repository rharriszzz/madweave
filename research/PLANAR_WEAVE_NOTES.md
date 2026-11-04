# Planar madweave / hexweave: research notebook

Status: **source inspection and indexing tests only**. This branch does not alter the editor or enable cone transformations.

## Scope and method

Start with planar weaving. Keep `numberOfDirections = 3`, `transformInPath = false`, hence `coneFraction = 1`. Study strip identity, strip color, crossings, and the two center variants before attempting nonplanar configurations.

The test script `research/planar-indexing.test.cjs` transcribes a small, explicitly identified subset of pure indexing functions from `madweave.js`. It is **not** yet an end-to-end execution of the browser renderer; that is a future task.

## Confirmed by source inspection

- Three direction families are represented by `dx = [0, -sqrt(3)/2, +sqrt(3)/2]` and `dy = [1, -1/2, -1/2]`, to numerical precision. These are 120-degree-separated normals used for strip indexing.
- `setupNewBaseSize` sets `stripsPerDirection = 3 * baseSize` and `totalNumber = 3 * stripsPerDirection`.
- A strip index is decomposed into `d = floor(index / stripsPerDirection)` and `s = index % stripsPerDirection`.
- `getSOffset(starMadWeaveCenter,d)` is zero in the ordinary case and `3-d` in star-madweave mode. Consequently the class `getC` is `(s + offset) % 3` and the group `getN` is `floor((s + offset)/3)`.
- `starHexWeaveCenter` and `starMadWeaveCenter` both select six units per full circle in the setup logic; otherwise three units. The star-hex flag also has a separate comment concerning layer b. This alone does **not** establish all of their rendered differences.
- `getColor(colorIndexArray,index)` selects `colorArray[colorIndexArray[index]]`. This allows per-strip color assignment in principle, subject to the editor's array initialization and palette behavior.
- `transformInPath` defaults to false. No cone transformations are required for these planar experiments.

## Testable consequences

For any integer `baseSize > 0`, each direction has `3*baseSize` strips, and the three residue classes of `getC` occur equally often in each direction. Star-madweave mode shifts the residue class by direction, without changing the class totals.

Run:

```sh
node research/planar-indexing.test.cjs > /tmp/madweave-planar-indexing.json
```

The script checks index round trips, class bounds, period-three behavior within each direction, and equal class counts. **The script has been committed but not executed in the current environment**; do not record these as observed passes until run.

## Not yet established

1. Which rendered crossing is above/below for each pair of strip identities, including the exact SVG layering order.
2. How madweave and hexweave differ combinatorially rather than merely in the colors or chosen center.
3. Whether each strip can be assigned a unique, persistent visible color without altering rendering logic.
4. Whether the center modes produce the expected threefold or sixfold rotational symmetry in the *complete colored and layered image*.
5. Whether crossings remain consistent after changing strip colors and canvas size.

## Next experiments

- Build a headless browser or SVG DOM harness around the actual editor, rather than replacing its rendering implementation.
- Generate one small ordinary madweave and one hexweave example, with every strip distinctly labeled and colored; include a neutral-color baseline.
- Export SVG plus machine-readable strip/crossing records and test whether each crossing's visible upper strip matches the rendered SVG.
- Inspect the central neighborhood at several base sizes and document observed center symmetries.
- Only after these pass, consider changing `coneFraction`.

## Geometric caution

The number of direction families (three) is not the same thing as rotational symmetry at the center (threefold or sixfold). Strip color is not itself proof of crossing order. A pattern may have geometric symmetry that an arbitrary per-strip coloring breaks.

## SVG crossing construction (source inspection, 2026-11-04)

The renderer is **not** simply three globally stacked sets of strips. In `buildStripsInternal`, each direction's strips are defined once in SVG `<defs>`, grouped as `HStrips`, `RStrips`, and `LStrips`. It then constructs six `<clipPath>` masks, named after the six permutations of H/R/L, and adds three SVG `<use>` elements inside each clipped group. The use elements are appended bottom-to-top (loop `dd=2` down to zero), so the last painted direction is the top one. The masks partition the plane into small regions where the ordering is fixed. Thus the weave is made by **local clipping plus painter's order**, not by cutting physical strip paths at every crossing.

`isCoveredBy(thisS,thisD,otherS,otherD)` encodes pairwise strip precedence. It depends on strip residue classes, the star-madweave-center flag, `alternate`, and `hand`. `maskPath` uses this predicate to assign each triangular region to one of six layer-order permutations. Consequently a useful structural test is that for two different directions, exactly one of `isCoveredBy(A,B)` and `isCoveredBy(B,A)` is true, and that the six mask permutations remain valid.

The new `research/crossing-audit.cjs` evaluates the **original function bodies extracted from madweave.js** (rather than copied implementations), checks antisymmetry across many strip pairs and eight settings combinations, and records the six mask triangle counts. This is a unit-level SVG-layer audit, **not yet a browser-rendered pixel or path test**. Execute locally with `node research/crossing-audit.cjs`.

The key next step is to capture the actual SVG output for two planar patterns and visually inspect whether the clipped layer ordering agrees with these predicates. Do not use cone geometry yet.

## Interactive SVG diagnostic (2026-11-04)

Added `research/planar-svg-diagnostic.html`. Open through a local HTTP server at the repository root (for example `python3 -m http.server 8766`, then browse to `http://localhost:8766/research/planar-svg-diagnostic.html`). It loads the **unchanged** `../madweave.js` and calls its real `stripPath`, `trans`, and `maskPath` functions. It defines 27 individually colored strips, reuses the original six `ppn` painter-order permutations, and shows their clipped composition. Controls vary `starMadWeaveCenter`, `alternate`, and `hand`; labels identify direction and strip index. It can export the generated SVG.

This is deliberately **not** the editor UI and not an independent weave algorithm. It is a focused diagnostic of the renderer's geometric construction. Its SVG is a browser-created experiment, and has not yet been visually verified in this session. Color is assigned by unique strip index, so it does not encode the original palette or over-under class. This diagnostic is limited to the planar `numberOfDirections=3`, `coneFraction=1`, `transformInPath=false` case.

**Validation still needed:** open the diagnostic, check for JavaScript errors, inspect the six mask regions, compare crossing order with the original editor, and save representative screenshots/SVGs. In particular, verify strip-label placement and whether all six masks are populated. Do not claim those checks have passed until actually performed.

**Continuity note for future sessions:** We are learning the original planar madweave and hexweave implementation before coneFraction. User explicitly requested that coneFraction not be the starting point. Physical models and strip colors provide context, but the SVG clipping construction is the current investigation. Branch `research/planar-weave-experiments`; master must remain unchanged until findings are verified. Existing files: `research/planar-indexing.test.cjs`, `research/crossing-audit.cjs`, this notebook, and the SVG diagnostic HTML.

## Automated verification infrastructure (2026-11-04)

Added `.github/workflows/planar-research.yml` on this research branch. It invokes both `node research/planar-indexing.test.cjs` and `node research/crossing-audit.cjs` on GitHub Actions, and uploads JSON output when present. This is intended to make the checks reproducible without relying on the chat environment.

**Execution status:** The workflow was committed, but a subsequent query of GitHub Actions runs returned no runs. This is **not evidence of success**. Possible reasons include dispatch delay, workflow permission/configuration, or branch workflow restrictions. Before interpreting results, inspect Actions and the logs. Local direct Git clone from the execution container failed because DNS resolution for github.com was unavailable; this is an environment limitation, not a repository failure.

**Important next work:** Run the tests and fix any assertions or source-extraction issues; open the SVG diagnostic in a browser; compare its crossing order against the editor and save SVG/screenshot evidence. Avoid claims of visual validation until a render has actually been inspected. Keep coneFraction fixed at 1 and do not modify master.

## CI results and browser validation (2026-11-04, later)

The GitHub Actions planar research run [41876867020](https://github.com/rharriszzz/madweave/actions/runs/41876867020) **completed successfully**. This confirms the two Node scripts executed without failed assertions in CI; it does not by itself verify the appearance of the rendered SVG.

Added `research/browser-svg-check.cjs` and `.github/workflows/planar-svg-browser.yml`. This new workflow installs Chromium via Playwright, serves the repository locally, loads the diagnostic, toggles all eight combinations of star center / alternate / hand, verifies six clip paths, six compositing groups, 27 unique strip paths, and 18 SVG use references, and exports eight PNG screenshots and eight SVG files as an Actions artifact. This validates DOM structure and browser execution, but **does not yet prove pixel-level over-under correctness**; visual review of the resulting images is still required.

**Pending:** At the time of this note, the new browser workflow had not yet appeared in the returned GitHub Actions run listing. Inspect [Actions](https://github.com/rharriszzz/madweave/actions) for the browser workflow, diagnose any failure, download/review the artifacts, and then compare rendered crossings with the editor. If GitHub does not register the new workflow on this non-default branch, consider integrating the browser job into the existing working research workflow on this branch. Continue to keep coneFraction=1 and master unchanged.

## Important distinction: color patterns vs weave topology

Source inspection of `colorIndex` identifies five built-in color-assignment schemes (selected by `colorPattern`): direction `d`; residue class `c`; `d+c`; strip group `n`; and `c+n`, all reduced modulo `colorCount`. The `colorIndexArray` can then be edited per strip. **Changing only these colors does not change the crossing-order predicate**.

The over/under predicate `isCoveredBy` depends on `starMadWeaveCenter`, `alternate`, and `hand`, but **does not directly reference `starHexWeaveCenter`**. The latter affects the angular-unit setup and has a source comment about layer b; we must not assume it is a separate planar crossing algorithm. To distinguish hexweave from madweave rigorously, compare the actual crossing relations and visible-strip selections, not merely palette or center names.

At this checkpoint, [GitHub Actions browser run 41877409059](https://github.com/rharriszzz/madweave/actions/runs/41877409059) was **queued**. Do not claim the browser checks have passed. The earlier indexing/crossing CI run 41876867020 passed.

### Concrete next questions for experimental evidence

1. Which combinations of `starMadWeaveCenter`, `alternate`, and `hand` reproduce the familiar hexweave and madweave physical structures?
2. Do the six clipping masks partition every local crossing correctly, including central crossings?
3. Does the uniquely colored diagnostic preserve the same over/under pattern as the original editor?
4. Are the visual changes from the colorPattern menu purely color assignments? The source suggests yes, but confirm with a render.


## Checkpoint: GitHub Actions queue and independent execution

On rechecking GitHub Actions, the browser runs 41877379056, 41877409059, and 41877632486 remained queued, as did newer source-test runs. The earlier run 41876867020 was successful. A direct `git clone` from this execution environment failed with `Could not resolve host: github.com`; this is a local DNS/network limitation. **Neither the queued status nor the clone failure is evidence of a code defect.**

Avoid accumulating more queued workflow runs by repeatedly committing trivial notes. Before the next change, prioritize a working local/browser execution route or allow the queue to drain. Once browser screenshots exist, inspect them for actual visual consistency. No browser screenshot has yet been reviewed.

### Architectural observation

The six `pname` values and `ppn` permutations in `madweave.js` encode six local painter-order states. The `maskPath` routine assigns small triangles to those states based on three pairwise `isCoveredBy` tests. This is the primary source-backed explanation of SVG weaving. Color patterns are a separate mapping, and unique per-strip coloring in the diagnostic is meant to reveal path continuity, not to define the weave.

### Restart instructions

Work on `research/planar-weave-experiments`; inspect this notebook first. Verify existing CI and browser results before adding features. The next deliverable is **inspected SVG render evidence** for at least ordinary and star-madweave center modes, with exact crossing annotations. Keep `numberOfDirections=3`, `coneFraction=1`, and `transformInPath=false`. Do not merge into master without checking the generated output.

## First inspection of actual browser renders (2026-11-04)

Downloaded GitHub Actions artifact `planar-svg-diagnostic-renders` (artifact 13348220558) from successful [run 41877822806](https://github.com/rharriszzz/madweave/actions/runs/41877822806). Its eight PNG and eight SVG files were extracted and the PNG images `planar-000.png` (ordinary center) and `planar-100.png` (star center) were inspected directly. The JSON report lists **no JavaScript errors**, six masks, six compositing groups, 27 uniquely identified strip paths and 18 `<use>` elements for each configuration. The screenshots show visibly interlaced colored strips, with a different crossing arrangement between the two center settings. These are actual browser renders, not conceptual illustrations.

**Important caveat:** Inspection of two screenshots establishes that SVG output exists and appears plausibly interlaced, not that every crossing is correct. The automated test checks structure, not exact pixel colors or consistency with the original editor. The remaining six screenshots are available in the same artifact and should be inspected systematically. The diagnostic's strip colors are assigned uniquely by strip index, rather than the editor's original palette.

The next substantive experiment should select a few central crossings, identify the intersecting strip indices from geometry, evaluate `isCoveredBy`, and sample the rendered pixel to verify that the visible top strip matches the predicted color. This should be repeated across all eight configurations. Compare with the original editor only after these crossing assertions pass. Also distinguish `starHexWeaveCenter` from `starMadWeaveCenter` carefully; the present diagnostic toggles the latter only.

A local eight-image comparison montage was generated for review, but is not yet committed to GitHub. The reproducible original PNG/SVG artifacts are retained in the successful Actions run.

## Original SVG editor button experiments (2026-11-04)

The actual user interface is `editor.html` with `madweave.svg` inside an iframe. The original SVG's `buildButtons` creates click targets named `cbutton<name>`; their handlers are embedded in SVG attributes. The research diagnostic does **not** expose this entire control set, so button research must exercise the original iframe.

Added `research/editor-button-experiments.cjs` and `.github/workflows/editor-buttons.yml`. The Playwright test clicks the original SVG's color-pattern (CP), color-count (CC), size (SC), handedness (-), top reversal (X), center (C), class visibility (VH), direction visibility (VD), outline (Lines), spacing (Sep), palette, invisible (I) and visible (V) controls. It records state after each click and saves a screenshot. The script does not yet exercise sliders or actual strip recoloring; those require coordinate-sensitive pointer interactions. **At commit time the workflow had not been observed to complete; do not treat the button outcomes as verified until its JSON artifact is inspected.**

Source-derived control map: CP0–CP4 select colorIndex formulas (d, c, d+c, n, c+n); CC1–CC6 select modulo color count; SC1–SC8 set 3–24 strips per direction; '-' toggles `hand`; X toggles `alternate`; C toggles `starMadWeaveCenter`; VH0–VH2 toggle residue-class visibility; VD0–VD2 toggle direction visibility; Lines toggles strip edge lines; Sep0–Sep3 select spacing; C0–C7 select palette slots; I/V choose invisibility/visibility painting modes; LAST0–LAST3 are recent palette colors; OB/HB/SB/VB are opacity/hue/saturation/value sliders; HideButtons hides controls.

**Next:** Inspect CI status and the JSON artifact, fix any control-dispatch or SVG iframe failures, then add assertions for expected state transitions and pixel/screenshot comparisons. Preserve findings here. Remain planar.

## Button experiment correction: event type (2026-11-04)

The initial button workflow [41884081237](https://github.com/rharriszzz/madweave/actions/runs/41884081237) reported success and produced an observations JSON artifact. **Inspection revealed that every state snapshot was unchanged.** The experiment was invalid: it dispatched synthetic `click` events, while `buildButtons` installs SVG handlers using `onmousedown` on `cbutton*` rectangles. The original program's UI is not implicated.

Updated `research/editor-button-experiments.cjs` to dispatch `mousedown` and added required state-transition assertions for pattern, color count, size, hand, alternate, center, and spacing. A fresh workflow run [41884346850](https://github.com/rharriszzz/madweave/actions/runs/41884346850) was queued at this checkpoint. **Do not claim button behavior has been experimentally verified until the new run succeeds and its observations are inspected.** Note that duplicate labels in the sequential observation list require care when interpreting the final snapshot by name.

## Resolved: false geometry-switch failure (2026-11-04)

Inspected `observations.json` from failed [button workflow run 41884562220](https://github.com/rharriszzz/madweave/actions/runs/41884562220), artifact 13350901304. The original editor's `-`, `X`, and `C` controls **all behaved correctly**: starting `false`, the first press changed the relevant state to `true`, and the second press restored `false`. The test had used `Object.fromEntries(observations.map(o => [o.label,o]))`, which retains the **last** observation for duplicate labels; it incorrectly expected the final restored state to remain true. Fixed the assertions to inspect the first matching observation, just as the center test already did.

Other recorded transitions in this same run show CP0–CP4 color pattern changes, CC2/CC3 color count changes, SC3/SC2 size changes, and spacing button changes. These observations are actual Chromium-executed original SVG button handlers. The workflow failed only on the mistaken geometry assertion. A new CI run is required to verify the corrected script passes. The experiment did not yet test mouse painting or slider interaction.

This is a useful general lesson for the research harness: when a control is intentionally toggled twice, preserve ordered observations rather than reducing to a map keyed only by the control label.

## Pointer and color-control experiment (2026-11-04)

The corrected [button run 41885348489](https://github.com/rharriszzz/madweave/actions/runs/41885348489) passed. Added `research/editor-pointer-experiments.cjs` and `.github/workflows/editor-pointer.yml` to test palette selection and genuine pointer clicks on the four slider hit targets (OB opacity, HB hue, SB saturation, VB value). The test also calls the **original** `setStripColorToCurrentDefault` function on a known strip after selecting palette / invisible / visible modes, avoiding hover-timing ambiguity. This verifies the actual strip-editing logic, **not** the full user hover-to-selection mechanism; that remains a separate test.

The test records the original SVG window's state and saves an image. It asserts expected normalized slider positions and the visibility toggle effects. **This new workflow is not considered passed until its GitHub Actions run and artifact are inspected.** If the slider test fails, check the SVG coordinate transform and Playwright mouse click mapping before changing the editor.
