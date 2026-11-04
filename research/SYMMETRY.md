# Rotational symmetry of the planar weave

Symmetry must specify what is rotated and what must remain unchanged. The
physical strips, their crossing order, hexweave labels, and fixed palette colors
have different symmetries. The tests below concern rotation **about the SVG
origin**, the prospective apex in the current coordinate system. They do not
claim to classify every possible displaced center of an infinite weave.

## Physical strip geometry

All three direction families have identical index ranges and lengths. A
120-degree rotation maps H to R, R to L, and L to H, keeping physical index s.
Thus the full finite strip set has threefold rotational symmetry at every size
and spacing.

A 60-degree rotation reverses the strip normal and maps
`(d,s)` to `((d+2) mod 3, 2O-s)`. Reversal preserves the finite index range only
when `2O=N-1`, which occurs at even base sizes. At odd base sizes, `2O=N-2`:
the last strip maps to index -1, outside the design. Consequently:

| Base sizes | Finite uncolored strip layout at the origin |
|---|---|
| 1, 3, 5, 7 | Threefold; 60- and 180-degree rotations do not preserve the set |
| 2, 4, 6, 8 | Sixfold; 60, 120, and 180 degrees preserve the set |

This parity distinction concerns finite layout symmetry. It does **not** restore
the previously retracted claim of odd-size coincident triple centerlines.

## Crossing order

For every valid physical rotation, the test rotates each strip identity and
checks every pairwise precedence relation. A 120-degree rotation preserves that
relation in all eight C/X/hand combinations. At even sizes, the additional
60- and 180-degree symmetries occur only with **C on and hand off**; X can be
either setting. With any other C/hand combination, the order has only threefold
symmetry even though the underlying rectangles have sixfold symmetry.

This follows from the residue rule: rotating by 120 degrees preserves direction
differences and pairwise residue comparisons. A 60-degree rotation also reverses
s; the zero-residue comparison used by C survives that reversal, while the
ordinary-center comparison does not. The hand-dependent class test can break
that extra symmetry.

[`symmetry.test.cjs`](symmetry.test.cjs) checks **768 rotation/configuration cases**
and **383,616 pair comparisons** over all sizes and spacings. It also compares
the visible top direction at 5,280 rotated central-region probes at size 2,
medium spacing. Counterexamples are saved for failed 60/180-degree symmetries,
so the negative classifications are observable changes, not just missing proofs.

## Hexweave classes

Under 120 degrees, ordinary-center a/b/c classes each map to themselves.
C-shifted classes cycle `a→c`, `b→a`, `c→b`. The unlabeled class partition is
preserved, but a single named class need not remain in the same place.

At even sizes, ordinary-center 60-degree rotation exchanges a and c while
preserving b: `a↔c`, `b→b`. In particular, the ordinary b strip subset has
sixfold geometric symmetry at the origin, while a and c are exchanged. This
helps interpret the source comment relating the dormant star-hex setting to
layer b; it does not mean that setting implements a separate verified renderer.
In C-shifted mode, a 60-degree rotation has no single global permutation of the
three class labels. Do not infer class symmetry from full-weave order symmetry.

## Colors and labels

With the default direction coloring and three distinct colors, rotation by
120 degrees changes H's color to R's, and so on. A fixed-color image therefore
need not look threefold even when the physical strips and their order are
threefold. At even sizes, a half-turn preserves direction colors; combining
that with the order rule gives half-turn symmetry with C on and hand off.

Neutral opaque coloring displays the silhouette but conceals crossing order.
Unique fixed strip labels/colors reveal physical identity but deliberately break
rotations that exchange strips. The existing uniquely colored diagnostic and
the neutral [rendering controls](BOUNDARY_RENDERING.md) serve these distinct
purposes. Color changes are not a substitute for an order test.

## Reproduction

```sh
node research/symmetry.test.cjs
```

The original engine supplies indexing, color formulas, and precedence. Rectangle
rotation and point geometry use the independent Euclidean model. Results are
written to `research/output/symmetry/results.json`. Raster antialiasing at exact
clip boundaries is separate from these structural symmetries.
