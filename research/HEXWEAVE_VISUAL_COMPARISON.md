# Visual comparison: full madweave and the three hexweaves

**Verified 2026-11-04.** This is an evidence-based record of the eight-image *planar* comparison, not a proposed feature and not a study of cone fractions.

## Reproduce the images

- Source: the original `editor.html` loading `madweave.svg` and `madweave.js`, through Chromium/Playwright, **not** the standalone research diagnostic.
- Test: [`research/hexweave-comparison.cjs`](hexweave-comparison.cjs), invoked by [`.github/workflows/hexweave-comparison.yml`](../.github/workflows/hexweave-comparison.yml).
- **Successful GitHub Actions run:** [41888189144](https://github.com/rharriszzz/madweave/actions/runs/41888189144). Its `madweave-hexweave-four-way-comparison` artifact **13352117928** contains eight PNGs, eight SVGs, and `results.json`. The artifact is temporary; the script and this notebook are the durable reproduction method.
- Initial SVG settings: `mwBaseSize=2`; `stripsPerDirection=6`; `colorPattern=0` (color by strip *direction*), `showD=[true,true,true]`, `coneFraction=1`, `transformInPath=false`.
- First row: `full-madweave`, `hexweave-a`, `hexweave-b`, `hexweave-c` with `starMadWeaveCenter=false`. Second row: the same four views after pressing the **actual C button**, with `starMadWeaveCenter=true`. Each isolated hexweave is obtained by turning *off* the other two `a/b/c` visibility buttons. The `H/R/L` direction controls remain on.

The exported PNGs were visually reviewed together, and SVG paths and mask geometry were inspected programmatically from the archived files. `results.json` reports **no browser JavaScript errors**.

## What is directly visible

1. The full pattern is dense, with strips of three colors/directions weaving across the same central region. Isolating `a`, `b`, or `c` yields a much sparser, still three-direction weave.
2. Each isolated image contains **two strips from each of H, R, L**—six visible strips total, compared with 18 in the full image. The three isolated images are spatially offset/interleaved, not three separate orientation families. Their union is the complete full weave.
3. In the second row, the C-shifted full weave retains the **same outside silhouette and strip tracks**, but conspicuously different colored pieces appear on top at many crossings. It is not a simple recoloring of an identical over-under arrangement.
4. Each C-shifted isolated hexweave has **the same two horizontal strips** as its unshifted counterpart but a different choice of R and L diagonal strips. This visibly relocates the holes and the central interlacing motif. The three shifted isolated hexweaves again cover the full strip set without overlap.
5. The center changes are not perfectly characterized by an attractive screenshot alone. We should not infer a particular 3D fold, exact rotational symmetry of an arbitrarily colored image, or behavior at nonplanar `coneFraction` values from these pictures.

## Numeric/structural cross-checks

| State | ShowC | Visible strips | Six-way decomposition |
|---|---|---:|---|
| Full, ordinary | `[1,1,1]` | 18 | Full union |
| a, ordinary | `[1,0,0]` | 6 | Pairwise disjoint |
| b, ordinary | `[0,1,0]` | 6 | Pairwise disjoint |
| c, ordinary | `[0,0,1]` | 6 | Pairwise disjoint |
| Full, C-shifted | `[1,1,1]` | 18 | Full union |
| a, C-shifted | `[1,0,0]` | 6 | Pairwise disjoint |
| b, C-shifted | `[0,1,0]` | 6 | Pairwise disjoint |
| c, C-shifted | `[0,0,1]` | 6 | Pairwise disjoint |

The browser test asserts pairwise disjointness and equality of the three-class union with the full set **for both center states**. It passed.

An independent comparison of the exported SVGs found:

- For every direction H/R/L and every strip index `s=0..5`, the strip's **path `d` and SVG `transform` are identical** before and after pressing C. They differ in generated identifier/class names, not geometric location. This also holds for the four pairs of full/isolated screenshots because the original renderer keeps the underlying strip geometry in `<defs>` even if individual classes are hidden.
- In the default full-weave case, the SVG contains three populated clipping paths (`HRL`, `RLH`, `LHR`), each with 72 triangle commands in the generated mask path. The other three possible permutations are not populated. Between the two center settings, **all three populated clip-path `d` strings change**, demonstrating altered regional layering.
- A supplementary raster check of the center-region crop `x=275..929, y=150..694` (1198×864 screenshots) found approximately **110,151** pixels with a per-channel color difference of at least 25 between the two *full* renders, but only **6** pixels where a coarse nonwhite/white mask differed (40-channel threshold). This is corroborative evidence that the outer coverage is essentially unchanged while visible layer colors change, **not** a formal pixel-level proof of crossing correctness.

## Precise mechanism behind the pictures

Let `d=0,1,2` identify directions `H,R,L`, let `s` be the physical strip index within that direction, and let `c=0,1,2` correspond to the a/b/c visibility layer.

`madweave.js` computes:

```js
getSOffset(starMadWeaveCenter, d) = starMadWeaveCenter ? (3 - d) : 0;
getC = (s + getSOffset(...)) % 3;
```

Thus:

| Direction | C off: layer c | C on: layer c |
|---|---|---|
| H (`d=0`) | `s mod 3` | `s mod 3` |
| R (`d=1`) | `s mod 3` | `(s+2) mod 3` |
| L (`d=2`) | `s mod 3` | `(s+1) mod 3` |

For the present six strips per direction, the physical strip indices shown in each layer are:

| Layer | C off: H / R / L | C on: H / R / L |
|---|---|---|
| a | `0,3 / 0,3 / 0,3` | `0,3 / 1,4 / 2,5` |
| b | `1,4 / 1,4 / 1,4` | `1,4 / 2,5 / 0,3` |
| c | `2,5 / 2,5 / 2,5` | `2,5 / 0,3 / 1,4` |

These **physical strip indices** are intentionally distinguished from IDs such as `GPHa0`; the numeric suffix in those IDs is derived from `getN` and **also changes** when C is pressed.

Importantly, the full weave has all 18 strips in either center state. The visible full-pattern difference therefore comes from **`isCoveredBy` and the recomputed SVG masks/painter-order regions**, not a change in strip placement. With only one hexweave class shown, the changing **class membership** additionally changes which diagonal strips appear.

The three colors in this particular screenshot series encode **direction**, not layer. They are pink for H, yellow for R, and purple for L. They should not be interpreted as identifying the a/b/c hexweaves.

## What this does and does not prove

**Verified:** Eight original-editor renders; 18 versus 6 visible strips; all H/R/L directions retained; disjoint and exhaustive a/b/c partition in both modes; unchanged geometrical strip paths under C; changed SVG layer masks and visually changed over-under arrangement; unchanged planar transformation parameters.

**Subsequent verification:** Selected two-strip crossing pixels now match `isCoveredBy` at base sizes 2 and 3. Three-strip interior and mask-boundary checks also pass across eight orientations at size 3. See the [current test reference](TESTING.md) for scope and counts.

**Not yet verified:** Any 3D folding behavior; the effect of the separate dormant `starHexWeaveCenter` configuration; seam continuity or any nonunit `coneFraction`; how the color/symmetry appearance generalizes beyond the current base size and default color scheme.

## Original next experiment

Choose a small number of labeled crossings around the center in both full-pattern renders. Resolve the physical strip indices there, evaluate the **original** `isCoveredBy` for those strips, and sample the browser-rendered topmost color (or use `document.elementFromPoint` with suitable care around clipped SVG `<use>` elements). Save the evidence in machine-readable form and annotate the crossing locations. That would test the top/bottom semantics, not just the existence of clipping paths.

That sampled pixel experiment has since passed. Current next work is tracked in
[cone readiness](CONE_READINESS.md), including broader parameter coverage and
independent geometry and symmetry checks.

Afterward repeat at a second base size, and only later return to the nonplanar center constructions. No changes to the production editor or cone fraction are needed for these checks.
