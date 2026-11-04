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
