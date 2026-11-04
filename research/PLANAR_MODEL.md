# Planar hexweave and madweave model

MadWeaver draws finite strips in three directions and changes their local
stacking with clipped SVG copies. Its a/b/c controls select three interleaved
hexweave classes within that strip set. These are separate from direction,
palette color, and local over/under order.

This reference concerns the implemented planar renderer: `numberOfDirections=3`,
`transformInPath=false`, and `coneFraction=1`. Mathematical equations below are
source-derived; browser tests establish the sampled output described in
[research testing](TESTING.md).

## Physical strips and hexweave classes

Let `B=baseSize`, `N=3B`, direction `d=0,1,2` denote H/R/L, and `s=0..N-1`
identify a physical strip within its direction. Its array index is `i=dN+s`.
There are `3N=9B` strips.

For the ordinary center, define `s0=s`. For the C-shifted center,
`s0=s+3-d`. The engine assigns class `c=s0 mod 3` and group `n=floor(s0/3)`:

| Direction | Ordinary class | C-shifted class |
|---|---|---|
| H | `s mod 3` | `s mod 3` |
| R | `s mod 3` | `(s+2) mod 3` |
| L | `s mod 3` | `(s+1) mod 3` |

Every class contains `B` strips of each direction, or `3B` total. The three
classes are disjoint and their union is the full strip set. Thus, at size 2,
the full madweave contains 18 strips, while each isolated hexweave contains six,
two in each direction. C changes which diagonal strips belong to each class.

Use `(d,s)` as physical identity when comparing center states. SVG names such as
`PHa0` encode direction, class, and group, so they can change under C even when
the physical path does not. The name suffix is not simply the physical index s.
See [the visual and membership comparison](HEXWEAVE_VISUAL_COMPARISON.md).

## Color is a separate assignment

The five built-in patterns map `(d,c,n)` to `d`, `c`, `d+c`, `n`, or `c+n`, modulo
`colorCount`. Each strip stores a palette index; there are eight shared palette
slots, each with RGB color and opacity. Direction-colored images therefore do
not identify the a/b/c classes. A unique persistent color for every strip is
not generally possible through the eight-slot UI when there are 9–72 strips.
The separate diagnostic can give 27 strips distinct fills without establishing
that capability in the editor's project format.

Changing only a color does not change `isCoveredBy` or mask geometry. Changing
C does change crossing relations and class assignments. It preserves existing
per-strip palette indices until a pattern/count reset recomputes them. These
distinctions matter when comparing colored center motifs or apparent symmetry.

## Strip geometry

With width `W=stripWidth`, gap `G=stripSpacing`, pitch `P=W+G`, and
`O=floor(N/2)-0.5`, define the unit normal

```text
normal(d) = (-sin(120°d), cos(120°d))
centerline(d,s): normal(d) · (x,y) = (s-O)P
```

A point lies inside a finite strip when both conditions hold:

```text
abs(normal(d) · (x,y) - (s-O)P) < W/2
abs(tangent(d) · (x,y)) < stripLength/2
```

Here `tangent(d)=(cos(120°d),sin(120°d))`. The source's current length expression
is `stripLength=3*(B+1)*W*(1+gapFraction)`: despite its name, `baseSizeEven` does
not round, because it is assigned `2*((B+1)/2)`. The SVG paths are rectangles
positioned by rotation and translation. C/X/hand alter local order, not these
underlying rectangles.

At the intersection of H strip h and R strip r, a third coincident centerline
would require L index `l=3O-h-r`. O is half-integral for **every supported size**,
so l cannot be an integer. There are no coincident three-centerline crossings
in this geometry. Three finite-width strips can nevertheless overlap in area.
The earlier odd/even distinction was a mistaken offset assumption; see
[the corrected derivation](CROSSING_PARITY.md).

## Pairwise order and SVG construction

Despite its name, the predicate `isCoveredBy(s,d,t,e)` returning true means the
first strip is above the second in the renderer's pairwise ordering, as checked
at sampled two-strip crossings. It combines direction difference, strip-index
residues, C, X, and hand:

- X reverses all pairwise relations.
- Hand reverses the relation only when the two strips belong to the same class.
- C changes the residue/class relationships used by the predicate.

Pairwise antisymmetry holds for the tested strip range and all eight flag
combinations: exactly one of A-above-B and B-above-A is true for different
directions. Antisymmetry alone is not a global transitivity or feasibility proof.

`buildStripsInternal` creates the H/R/L strip groups once in `<defs>`. `maskPath`
assigns triangular regions to local order permutations, named `HRL`, `RLH`,
`LHR`, `LRH`, `RHL`, and `HLR`. The `ppn` table lists top-to-bottom directions.
Within each clipped group, three `<use>` references are appended bottom first,
so the top reference paints last. Only populated masks are attached in the
actual editor; a six-mask diagnostic can contain empty masks as well.

A mask boundary does **not** necessarily mark a visible color change. Its
permutation can change the position of an absent direction while the present
directions retain the same upper strip. At the default spacing, the latest
boundary audit found 924 sampled pairs of that kind and verified both sides.
The test must retain such continuity cases, respect finite strip ends, and
exclude neighborhoods near strip edges rather than call almost-covered strips
absent.

## Independent triangular-cell construction

The nearest strip index of direction d has a slab bounded by
`s-0.5 < normal(d)·(x,y)/P+O < s+0.5`. Intersecting three such slabs constructs
a triangular cell without calling `maskPath` or using SVG containment tests.
The three direction coordinates sum to `3O`; consequently, for given nearest
indices a and b, only `floor(3O-a-b)` and `ceil(3O-a-b)` can give a third slab
with positive-area intersection.

The independent geometry test constructs those cells, clips them against finite
strip rectangles, and requires every cell covering a positive area of strip to
occur exactly once in the generated masks. It also checks every generated
triangle against its independently constructed cell. These checks pass for
all eight sizes, four spacings, and eight orientations. Browser tests separately
check the transformed SVG rectangles, triangles, painter order, and a/b/c
partition in the same 256 cases.

At a point covered by three strips, their nearest-coordinate errors must
accommodate the half-integral sum `3O`. In normalized pitch units, the sum of
the three errors has absolute value at least 0.5. Each strip permits error below
`W/(2P)`. Thus positive-area triple overlap requires `3W/(2P)>0.5`, or **P<3W**.
At extra-wide spacing, P=3W: the limiting contacts have zero area, and the tests
explicitly require no positive-area triple regions. Narrow, medium, and wide
spacing have positive-area triple regions in the tested central patch.

The [geometry matrix report](GEOMETRY_MATRIX_REPORT.md) records the construction,
counts, negative controls, central pixel checks, and limits. The expected local
order still uses the original pairwise precedence rule; geometric independence
does not constitute an independent physical weaving theory.

## What remains to understand

The finite-cell coverage, broad boundary/end pixels, and
[origin-centered rotational symmetries](SYMMETRY.md) now have passing checks.
Geometry, class membership, crossing order, and coloring have distinct symmetry
classifications. The [boundary rendering report](BOUNDARY_RENDERING.md) accounts
for exact-seam raster artifacts in Chromium and Firefox.

These results do not assert exhaustive pixels everywhere, every displaced
symmetry center, or physical weaving feasibility. The dormant
`starHexWeaveCenter` comment is not a separate verified renderer; its angular
bookkeeping limitations and a closure-consistent replacement are explained in
the [cone mapping contract](CONE_MAPPING_SPEC.md).

[The readiness record](CONE_READINESS.md) maps the completed preparation to the
next bounded cone experiment.
