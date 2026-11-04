# Crossing geometry: even and odd strip counts

## Failure investigated (2026-11-04)

[Workflow 41895233731](https://github.com/rharriszzz/madweave/actions/runs/41895233731) passed all 48 sampled two-strip crossing checks for `baseSize=2` (six strips per direction), but failed with `0 !== 24` at `baseSize=3` (nine strips per direction). The error came from the research script's **candidate selection**, before it compared any pixel against `isCoveredBy`. It is not evidence of an incorrect renderer.

## Why the candidate set is empty

The three direction normals in the planar renderer obey `n_H+n_R+n_L=0`. The centerline of strip `s` in direction `d` has signed offset `(s-(N-1)/2)*pitch`, with `N=3*baseSize`.

At an intersection of the H strip `s` and R strip `t`, the projection onto the L normal is the negative sum of their offsets. Its implied L strip index is

`u=3*(N-1)/2-s-t`.

If `N` is odd, `(N-1)/2` is an integer and `u` is an integer: where the corresponding third strip exists, the crossing is a **three-centerline intersection**. The existing audit intentionally rejects crossings covered by a third strip, so it can find zero eligible samples in its central window. If `N` is even, the implied third index is a half-integer and the pair intersection lies between third-direction centerlines. That supports the original two-strip sampling method.

This is a structural difference between odd and even `baseSize` values, not a cosmetic test-harness issue.

## Corrected next experiment

- Retain `baseSize=2` as the regression baseline.
- Use `baseSize=4` (12 strips per direction) for a second **two-strip** pixel audit. This is committed in the crossing workflow; inspect its result before claiming success.
- Develop a separate **three-strip intersection** audit for `baseSize=3`: determine the top strip using all three pairwise `isCoveredBy` relations and the actual SVG clipping/painter order. Sample points safely inside the three-strip overlap, avoiding mask boundaries and antialiasing. Do not simply relax the third-strip exclusion and reuse the two-strip expected color.
- Extend the eight `C/X/-` configurations after these geometry cases are covered.

Keep `coneFraction=1`, `transformInPath=false`, and `master` unchanged. The even/odd distinction should be included in the eventual mathematical description of planar weaving.
