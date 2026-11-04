# Planar crossing-order pixel audit

**Date:** 2026-11-04  
**Status:** The independent pixel audit of previously archived original-editor screenshots is complete (48/48 matching samples); the new automated Chromium workflow is committed, with its final CI result to be checked separately.

## Question

For two physical strips in different direction families crossing near the center, does the visible RGB color in the *real Madweave SVG renderer* agree with the upper strip predicted by the original `isCoveredBy(s,d,t,e)` function? Does pressing `C` actually reverse some crossings while retaining fixed strip geometry?

## Sources and reproduction

- Main implementation: `madweave.js` on `master`.
- Prior successful original-editor eight-view run: [41888189144](https://github.com/rharriszzz/madweave/actions/runs/41888189144), artifact `13352117928`. Use `full-madweave.png` and `star-full-madweave.png` (PNG 1198 × 864) for the independent analysis. These screenshots use `baseSize = 2`, six physical strips per H/R/L direction, the default 3-color palette, and all three a/b/c layers visible.
- New reproducible browser implementation: `research/crossing-pixel-check.cjs` and `.github/workflows/crossing-pixel-check.yml`. This script creates two fresh screenshots, samples 24 crossings from each, exports machine-readable measurements, and produces annotated screenshots. It uses the **actual original editor**, not the separate SVG diagnostic.
- Planar parameters throughout: `numberOfDirections=3`, `coneFraction=1`, `transformInPath=false`, `hand=false`, `alternate=false`.

## Method

The physical strip with direction index `d` and index `s` has a centerline satisfying

```
normal(d) · (x,y) = (s - 2.5) * (stripWidth + stripSpacing)
normal(d) = (-sin(120° d), cos(120° d))
```

Solve the 2×2 linear system for the centerline intersection of each possible pair of distinct direction families H/R, H/L, and R/L. Restrict to crossings near the center (`|x|,|y| < 3.25`) and exclude any candidate where a third-direction strip is within `stripWidth/2 + 0.12` of the point. Rank by distance to the origin and inspect the nearest **eight** crossings of each direction pair (24 distinct points per image).

For each crossing, compute `isCoveredBy(s,d,t,e)` with the correct `starMadWeaveCenter` setting. `true` means the first strip is drawn above the second, as corroborated by `maskPath`'s painter-order permutation. Independently sample a 3×3 pixel neighborhood around the expected crossing position in the original-editor PNG, average RGB, and compare with the correct palette color of the predicted top strip. The third strip is absent at every selected sample.

The independent audit of the archived PNGs accepted each sample when RGB Euclidean distance to the predicted color was at most 22, **and** that color was at least 20 closer than the other strip's color. All 48 met these requirements.

## Results

| Configuration | H/R crossings | H/L crossings | R/L crossings | Matches |
|---|---:|---:|---:|---:|
| Ordinary center (`C` off) | 8 | 8 | 8 | **24/24** |
| Shifted center (`C` on) | 8 | 8 | 8 | **24/24** |
| Combined | 16 | 16 | 16 | **48/48** |

Of the 24 physical crossing locations, **15 change which direction passes on top** when `C` is pressed. This confirms a change in visible over-under topology, not just a global recoloring. Previous SVG comparison already established that every underlying strip path and transform stays geometrically fixed.

The worst 3×3-mean RGB difference from the predicted color among these samples was about **21.5** RGB Euclidean units; this is compatible with antialiasing at the clipping boundaries, and remained clearly closer to the predicted strip than the underlying strip.

## Interpretation

The three a/b/c hexweaves partition the *physical strip set* (previous experiment). The `C` switch shifts which residues of the diagonal R and L families are assigned to each subweave, and recomputes the SVG clipping masks that determine local painter order. Consequently the complete madweave retains every physical strip in the same place but reverses the visible upper/lower order at many crossings. The evidence directly supports that interpretation.

**Scope limitation:** This is a selected two-strip crossing test, not an exhaustive proof over every possible crossing or parameter combination. It intentionally avoids triple-cover regions and does not examine nonplanar cone fractions, seam matching, the dormant `starHexWeaveCenter`, or 3D paper folding.

## Automation and follow-up

The new browser workflow samples the two fresh screenshots and writes `crossing-results.json`, `ordinary-unmarked.png`, `shifted-unmarked.png`, `ordinary-annotated.png`, and `shifted-annotated.png`. Its first two workflow attempts encountered **test-harness argument-binding bugs** (`star` not passed into page evaluation; and `rows` destructured from the wrong Playwright argument). Neither failure implicated the original editor. Both were corrected in the script.

At the time of writing, the third workflow run [41892841302](https://github.com/rharriszzz/madweave/actions/runs/41892841302) was still running; **do not mark the automated test as passed until that run or a later one succeeds**. The archived screenshot analysis above was performed independently.

Next: inspect the CI artifact, fix any remaining test-only issues, attach representative annotated crossing images to this research notebook (or link their reproducible workflow), and repeat at `baseSize=3` or with `hand`/`alternate` toggled to test the generality of the crossing predicate. Do not introduce cone fractions until the planar tests are well understood.
