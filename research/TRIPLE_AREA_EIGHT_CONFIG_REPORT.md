# Eight-configuration planar triple-overlap verification

Date: 2026-11-04. Source: [successful GitHub Actions run 41899282486](https://github.com/rharriszzz/madweave/actions/runs/41899282486), commit `5b5683707df507cfa63f4a0f640b5d4c16e19a81`. Artifact: [planar-crossing-pixel-evidence](https://github.com/rharriszzz/madweave/actions/runs/41899282486/artifacts/13356604262), including JSON and annotated PNGs. This report records the **observed job log**, not a separate manual review of every image.

## Method and scope

The test `research/triple-area-check.cjs` opens the **original** `editor.html` / SVG iframe in Chromium at `baseSize=3`, `stripsPerDirection=9`, `coneFraction=1`, and `transformInPath=false`. It exercises all eight combinations of the original C, X, and handedness controls. It selects grid points within all three strip interiors, checks which original SVG clip-mask path contains each point, obtains the predicted top direction from the mask's `ppn` painter order, and compares a 3×3 mean of screenshot RGB pixels to the direction palette. Points near strip edges are excluded. Sampling is deterministic and spatially distributed, but it does **not** explicitly measure distance to clip-mask boundaries.

## Observed results

All eight configurations had 1,183 candidate points, zero ambiguous mask assignments, 1,183 eligible points, and **132/132 passing sampled points**. Total: **1,056/1,056 passing**, no reported page errors.

| C | X | Hand | HRL | RLH | LHR | LRH | RHL | HLR | Pass |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| off | off | off | 36 | 44 | 52 | 0 | 0 | 0 | 132/132 |
| on | off | off | 52 | 47 | 33 | 0 | 0 | 0 | 132/132 |
| off | on | off | 0 | 0 | 0 | 36 | 52 | 44 | 132/132 |
| on | on | off | 0 | 0 | 0 | 52 | 33 | 47 | 132/132 |
| off | off | on | 0 | 0 | 0 | 44 | 47 | 41 | 132/132 |
| on | off | on | 0 | 0 | 0 | 36 | 52 | 44 | 132/132 |
| off | on | on | 44 | 41 | 47 | 0 | 0 | 0 | 132/132 |
| on | on | on | 36 | 44 | 52 | 0 | 0 | 0 | 132/132 |

Counts under each mask are sampled points, **not** counts of all mask triangles or areas. A zero means the corresponding mask was not sampled in that configuration; it does not establish that the SVG mask is globally empty. The six permutations are all sampled somewhere in the matrix, but only three per configuration.

## Interpretation

The original SVG clipping-mask painter order correctly predicts the visible direction at all sampled interior three-strip overlaps in this matrix. The two-strip checks for base sizes 2 and 3 also passed in the same run. The result validates the renderer's **observed output** against its own mask semantics; it is not an independent proof that the weave's physical over-under structure is topologically correct.

## Coverage limitations and next work

1. Inspect representative annotated screenshots visually; the CI checker verified pixels but this report has not manually inspected the PNGs.
2. Test mask **boundary neighborhoods**, including points on either side of a boundary. The current grid excludes strip edges but not clip-mask edges explicitly, and a zero ambiguous count is not a boundary-distance guarantee.
3. Audit unsampled triangles and test additional sizes, especially to distinguish sampling density from exhaustive coverage.
4. Compare mask assignments with independently computed strip crossing relationships, rather than deriving both expected and observed order from the same SVG implementation.
5. Preserve `master` and planar settings until those checks are understood. Do not begin with `coneFraction`.

Reproduction: run the GitHub Actions workflow `.github/workflows/crossing-pixel-check.yml` on `research/planar-weave-experiments`; it saves `research/output/triple-area/results.json` and the eight pairs of annotated/unmarked screenshots as an Actions artifact.
