# Preparation for coneFraction

The planar renderer has a useful tested baseline, but the preparation for cone
work is **not complete**. The next task is to close the gaps below while retaining
`numberOfDirections=3`, `transformInPath=false`, and `coneFraction=1` in the app.
This is a research completion checklist, not a request to expose a cone control.

## Readiness criteria

| Area | Current evidence | Remaining deliverable |
|---|---|---|
| Every control | All 52 targets characterized; wrapper workflows have application tests | Resolve or explicitly account for the V recoloring and first-swatch-after-I/V discrepancies before reusing those behaviors in cone tests |
| Strip identity and classes | Independent rectangles and actual browser class partitions pass all 256 size/spacing/orientation cases | Preserve these checks as the planar identity baseline for later transformations |
| Pairwise order | Antisymmetry plus independent-cell/painter-order checks pass across 256 cases; 128-case pixel matrix uses pairwise order rather than SVG mask containment for predictions | Extend independent pixel locations beyond the central patch, especially crossings near finite ends |
| Triple overlap and mask boundaries | 128-case central pixel matrix passes zero/one/two/three-strip regions; extra-wide triple emptiness is explicit; original 924-pair boundary audit remains | Broaden the dedicated two-sided mask-boundary audit beyond size 3, medium spacing; measure faint boundary lines seen in zooms separately from interior correctness |
| Mask geometry | Independent slab construction covers all finite-strip cells and rejects duplicate triangles; transformed browser masks agree across 256 cases | Keep exact shared boundaries separate from positive-area coverage; extend checks when transformation changes the geometry |
| Center structure and color | C preserves physical tracks; 240 pattern/count/orientation cases preserve strip/mask geometry and match color formulas | State and test symmetry separately for strip geometry, classes, local order, and color; compare neutral and uniquely labeled diagnostic views |
| Angular mapping | Dormant source path identified below | Specify admissible parameters, forward/inverse coordinates, seams, units, masks, and approximation tolerance before enabling it |
| Repeatability | One local suite command with JSON/logs and image evidence | Keep required stages passing locally and in branch CI; clearly distinguish current runs from historical evidence |

Structural checks for all **8 sizes × 4 spacings × 8 orientations** now pass.
The documented 128-case central pixel matrix includes sizes 1, 2, 3, and 8 at
all spacings and orientations. It verifies 4,278 samples, including backgrounds
and single-strip regions, and explicitly checks 32 extra-wide cases with no
positive-area triple overlap. See the [geometry matrix report](GEOMETRY_MATRIX_REPORT.md).
This is a central-patch pixel result; finite-end and two-sided-boundary pixels
still need broader parameter coverage. Pixel thresholds were retained, while
zoom and geometric clearance make narrow features resolvable.

## What coneFraction actually controls in the source

The initial angular setup in [`madweave.js`](../madweave.js) is:

```text
directionsPerCircle = 3
unitsPerCircle = (starMadWeaveCenter || starHexWeaveCenter) ? 6 : 3
directionsInUnit = unitsPerCircle / directionsPerCircle
angleOfUnit = 2π / unitsPerCircle
numberOfUnits = numberOfDirections / directionsInUnit
coneFraction = directionsPerCircle / numberOfDirections
```

These are assignments at script initialization. Pressing C later toggles the
center and rebuilds strips, but does not recompute this angular setup. A future
parameter API must define which quantities are inputs and recompute all derived
values consistently. Changing `coneFraction` alone is not a complete setup.

When `transformInPath=false`, strip positions use ordinary SVG transforms;
the nonlinear transformation branch is bypassed. In `transformPointToPath`, the
other branch first rotates/translates a point, computes polar coordinates, and
maps its angle to `theta'=coneFraction*theta`, retaining the radius. Its source
contains a commented-out alternative radius scaling. The current formula alone
does not establish how a physical strip should be measured on a cone.

The following source details need explicit decisions and tests:

- **Angular branch and seam:** `lastAnglet`, `extraAnglet`, and
  `firstTransformPoint` unwrap angles along each path. Verify continuity at
  `atan2`'s branch cut, the origin, and the intended joined seam.
- **Unit clipping:** `drawOneUnit` invokes ray/edge intersections and angular
  clipping. Test parallel/degenerate edges, ray endpoints, and points near both
  unit boundaries. `intersectionPoint` can divide by a vanishing difference.
- **Curve approximation:** `npoints=2` currently samples segments very sparsely.
  An angle-scaled straight strip edge is generally curved. Specify an error
  bound, endpoint handling, and how resolution is chosen before trusting it.
- **Picking:** `getSForPoint` applies an inverse angular map only when
  `transformInPath && numberOfDirections != 6`. Explain that exception and test
  forward/inverse strip selection, including both sides of the seam.
- **Composition:** strip directions, mask permutations, mask transforms, and
  `<use>` construction remain built around H/R/L. Determine how unit replication
  and transformed clipping will work together; mapping strip paths while leaving
  masks planar is not an established renderer.
- **Dormant settings:** `starHexWeaveCenter` has a layer-b comment, and
  `numberOfDirections` has a divisibility constraint, but neither has a verified
  user-facing configuration. `numberOfUnits` currently has no later use in this
  source. Do not infer completed unit assembly from those names.
- **Persistence:** the project schema currently describes the planar UI state;
  cone parameters and derived geometry need an explicit save/reopen design if
  they become editable settings.

## Order of work

1. Close planar coverage gaps and preserve independent, labeled evidence for
   crossings, overlaps, mask continuity, and center structure.
2. Write a precise angular-mapping specification, with coordinate systems,
   parameter constraints, seam matching, inverse selection, and numeric tolerance.
3. Test dormant mapping helpers in isolation, including the unit-fraction
   baseline, before connecting them to the editor's rendering and saved state.
4. Choose one nonunit fraction whose expected construction can be described
   independently. Compare its predicted seam/strip relationships and rendered
   output, keeping a planar regression case alongside it.
5. Broaden fractions and UI support only after that experiment is explained and
   reproducible.

A passing screenshot comparison against the same SVG mask logic is useful
renderer evidence. It cannot, by itself, establish a physically realizable cone
weave or validate all of these angular assumptions.
