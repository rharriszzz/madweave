# Independent planar geometry and browser matrix

On 2026-11-04, the independent geometric construction and actual browser SVG
agreed across **256 size/spacing/orientation configurations**. A central pixel
matrix passed **4,278 samples across 128 configurations**, and 240 color-pattern
cases preserved strip and mask geometry. The complete research runner passed
25 stages locally. These results advance the planar baseline; they do not
establish physical weaving feasibility or nonplanar behavior.

The subsequent [readiness record](CONE_READINESS.md) adds symmetry, broader
boundary/end pixels, Firefox controls, and the angular specification. This report
preserves the initial geometry-matrix checkpoint.

## Independent construction

[`planar-geometry.cjs`](planar-geometry.cjs) uses ordinary Euclidean half-plane
clipping. It does not call `maskPath`, inspect SVG hit-test results, or copy its
triangle vertex formulas.

For pitch P and offset O, direction coordinates are
`q_d=normal(d)·(x,y)/P+O`. A nearest physical index s defines the slab
`s-0.5<q_d<s+0.5`. The three direction normals sum to zero, so the coordinate
sum is `3O`, a half-integer. For indices a and b, only
`floor(3O-a-b)` and `ceil(3O-a-b)` give a third slab with positive-area
intersection. Intersecting the three slabs independently produces its triangular
cell.

The model separately constructs the finite strip rectangles using strip width,
length, directions, and centers. It derives candidate index bounds from their
corners and clips each candidate cell against those rectangles. Any cell that
contains a positive area of a finite strip must be represented in the masks.

[`planar-geometry.test.cjs`](planar-geometry.test.cjs) loads the original engine
and compares every generated triangle with that independent cell. It rejects
duplicate cells, requires coverage of all cells intersecting finite strips,
and checks the local order against the original pairwise predicate. The geometric
construction is independent; the expected precedence law still comes from
`isCoveredBy`, so it is not an independent physical weaving algorithm.

These are numerical polygon checks: positive-area tolerances are explicit,
shared edges are distinguished from interior overlap, and source vertices are
compared within 1e-7 normalized units. Browser SVG matrix precision is allowed
2e-5 normalized units. These geometry tolerances do not relax pixel-color limits.

## Matrix and observed results

All structural cases use sizes 1–8, all four spacing controls, and all eight
combinations of C/X/hand: **8 × 4 × 8 = 256**.

| Check | Passing result |
|---|---:|
| Independent finite-strip cell coverage checks | 158,208 |
| Generated source triangles checked, counting each size/orientation once | 92,928 |
| Actual browser mask cells checked, including all four spacings | 371,712 |
| Browser strip/class/painter-order configurations | 256 |
| Central pixel configurations: sizes 1, 2, 3, 8 × four spacings × eight orientations | 128 |
| Central 3×3 mean RGB probes | 4,278/4,278 |
| Extra-wide configurations explicitly requiring empty triple area | 32 |
| Color-pattern/count/orientation cases | 240 |
| Browser page errors | 0 |

The browser audit, [`planar-matrix-check.cjs`](planar-matrix-check.cjs), operates
actual size, spacing, and orientation controls. It checks transformed rectangle
vertices, class identifiers, local mask geometry, and the order of SVG `<use>`
references. It then operates the a/b/c controls to isolate each class and compares
its exact physical `(d,s)` membership against the independently computed class.
The three classes are restored after every configuration.

All five color patterns and six color counts are also exercised in every
orientation at size 3, medium spacing. Their per-strip palette indices match
the documented formulas; physical paths, transforms, and mask paths/transforms
stay unchanged. Pattern/count operations restore individual visibility. These
240 cases make the color-versus-crossing distinction executable.

## Pixel method and empty cases

Pixel predictions use the independent rectangles and cells plus the original
pairwise order. They do **not** query the SVG mask containing a point. Within
central cells, the model splits polygons along all relevant finite-strip
boundaries. Each resulting region has constant occupancy: zero, one, two, or
three strips. Its interior centroid supplies a candidate probe.

The SVG view box is temporarily zoomed to a central square with normalized
coordinates `[-1,-1,2,2]`, in pitch units. The screenshot remains at its ordinary
pixel dimensions. Probes require at least three screen pixels of clearance from
all region edges, including mask and strip boundaries; this resolves small gaps
without increasing color tolerances. The original view box is restored after
each capture. Samples are distributed across occupancy and local-order groups,
with up to three probes per group.

A first attempt used a square twice as wide and correctly failed its coverage
assertion: narrow-gap holes and single-strip regions at size 2 were too small
for the required clearance. Increasing the zoom restored meaningful coverage.
No occupancy category was silently skipped and no RGB tolerance was increased.

| Occupancy | Passing pixel probes |
|---|---:|
| Background, zero strips | 1,152 |
| One strip | 1,152 |
| Two strips | 1,152 |
| Three strips | 822 |

Every pixel case contains background, one-strip, and two-strip probes.
Three-strip probes are required at narrow, medium, and wide spacing. At
extra-wide spacing, P=3W. The half-integral coordinate-sum constraint requires
combined error at least 0.5 pitch units, exactly the combined half-width of
three such strips; there is no positive-area triple overlap. The tests require
zero positive-area triple regions and zero corresponding probes in all 32
extra-wide pixel cases. They still check the other three occupancy categories.

A 3×3 RGB mean must remain within distance 28 of the predicted palette color
(or white background) and at least 15 closer than every alternative. These
thresholds match the existing overlap/boundary audits. All selected probes passed.

Representative narrow-gap and extra-wide zooms were visually inspected. Faint
light lines are visible along some triangular clipping boundaries even inside
otherwise continuous colored strips. The geometric cell checks find no missing
positive-area cells, while these pixel probes deliberately avoid exact boundary
antialiasing. The subsequent [Firefox and neutral-control comparison](BOUNDARY_RENDERING.md)
classifies those lines as a known clipping/compositing artifact; the geometric
checks remain independent of exact-boundary raster pixels.

## Negative controls and retained evidence

Two temporary source variants were tested without changing the repository
engine: one removed a populated mask, and one duplicated its triangles. The
independent checker failed respectively on an uncovered finite-strip cell and
a duplicate/overlapping cell. The earlier black-repaint control also caused
all 924 dedicated boundary pairs to fail.

The suite writes source geometry results to `research/output/geometry/`, browser
summaries and 128 zoomed screenshots to `research/output/matrix/`, and stage logs
to `research/output/suite/`. These generated directories are ignored by Git and
uploaded by the consolidated research workflow. The local run used Node
24.16.0, Playwright 1.58.2, Chrome for Testing 145.0.7632.6, and pngjs 7.0.0.
No new GitHub Actions outcome is claimed.

## Reproduction and remaining limits

After installing the [research dependencies](TESTING.md#run-the-suite), run:

```sh
python3 research/run-tests.py
```

The independent source geometry check can also run without browser dependencies:

```sh
node research/planar-geometry.test.cjs
```

This matrix covers the finite design structurally, while its new pixel audit
covers a **central patch**. The dedicated full-design crossing and mask-boundary
audits remain useful, and their locations/parameter coverage should expand.
Exact antialiased boundary pixels, all rotational symmetry claims, an independent
physical precedence law, and cone/seam behavior remain separate questions in
[cone readiness](CONE_READINESS.md).
