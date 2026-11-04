# Corrected planar crossing geometry (2026-11-04)

## Important correction

The earlier version of this notebook claimed odd strip counts produce three-centerline intersections. **That claim was wrong.** It used the centering offset `(N-1)/2`, whereas the original `madweave.js` uses:

```js
var offsetS = Math.floor(stripsPerDirection / 2) - 0.5;
```

This offset is half-integral for **both odd and even** strip counts. The original strip centerline equations are

`n_d · (x,y) = (s - offsetS) * pitch`,

where `n_H+n_R+n_L=0`. At an H/R centerline intersection the implied third-direction index is

`l = 3*offsetS - h - r`.

Since `offsetS` is half-integral, `3*offsetS` is half-integral, so `l` is **never an integer**. Thus no three strip centerlines intersect at exactly the same point in the planar geometry, regardless of the parity of `N`.

The previous baseSize=3 failure (`0 !== 24`) was a **test-harness coordinate bug**, not evidence of an odd/even topological distinction. The attempted triple-centerline checker repeated that wrong offset, and its failure was not evidence of a cyclic physical three-way centerline crossing. The checker was retired.

## Source evidence

- `madweave.js`: `stripPath`, `trans`, and `getSForPoint` each use `Math.floor(stripsPerDirection/2)-0.5`.
- `research/crossing-pixel-check.cjs` now uses the same offset for its geometry.
- The pixel-check workflow now runs `baseSize=2` and `baseSize=3` against the original renderer. **Check the workflow outcome before recording a pass.**

There can still be regions where **three strips overlap in area**, and local over/under relations can be cyclic around such a region. This is different from three coincident strip *centerlines*. The SVG `maskPath` divides the plane into triangles and assigns painter-order permutations to those triangles; a cycle of pairwise relations need not yield one global top strip across an extended overlap region.

## Next research

1. Confirm the corrected baseSize=3 pixel check and review its annotated images.
2. For genuine three-strip **area overlaps**, choose points strictly inside each SVG mask triangle, identify the active clip path and its `ppn` painter order, and compare predicted pixel color with the rendered image.
3. Avoid sampling exactly on mask boundaries; report coverage and antialiasing separately.
4. Continue the `C/X/-` orientation matrix after geometric verification.

Keep `coneFraction=1` and `master` unchanged.
