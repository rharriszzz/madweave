# Stage 1 follow-up: complete circular crops and supplied-certificate checks

Bounded research on `docs/single-corner-prompt`, starting at `69c7d3a`.
The previous [Stage 1 report](SINGLE_CORNER_STAGE1.md) remains the source for
the model, phase/angle families and accepted product requirements. This follow-up
supersedes its centerline-fringe limitation for the finite cases below.
Implementation remains on hold. Physical constructibility remains unverified.
The general monochrome 60-degree baseline and pattern restrictions are preserved.
The tree-image investigation was not reopened.

## Region model and full material coverage

In coordinates `X=sqrt(3)*x/P, Y=y/P`, retain the entire closed region

```text
piece(j,d,s) = sector(alpha) intersect band(d,s) intersect disk(R/P)
disk: X^2/3+Y^2 <= (R/P)^2
```

The disk inequality is retained analytically. The certificate stores the rational
vertices of the band/sector/bounding-box polygon, plus the exact disk radius.
The vertices are a convex-hull vertex set, not a supplied painter path; their
winding is not authoritative. The checker reconstructs the hull independently.
Those vertices are not a polygonal approximation to the circular crop. All
positive-area regions are enumerated from a signed-index range proved to contain
every band with normal distance less than `R+W/2`. Exact zero-area tangencies
create no separate material occurrence. They remain boundaries of the closed
regions. A region remains a piece even if its spine misses the sector.

Our 60/120-degree sectors, straight bands and disk are convex, so each nonempty
positive-area intersection is one connected piece. Sector index remains part of
identity, including repeated planar orientations in excess sectors. Crossings
between different pieces are never material joins. No missing region is excused
by visibility, color or absent centerlines.

Register the full radial band intervals as before, including the interval
truncated by the circle. Match tangent family, ordered sides and material face,
using the proper rotation. Adjacent pieces can share an interval while crossing;
equal intervals alone cannot identify partners. All start and end ports must be
covered bijectively. A 60-degree rotation reverses canonical tangent/normal labels
together, and preserves actual material sides. No added twist is permitted.

Piece adjacency is now a graph of two-dimensional regions. Its degrees are not
centerline degrees: a fringe leaf does not create an extra physical strip end.
Connected components come from explicit full-band joins. In the accepted finite
cases, each component's region graph is a tree of disks joined on boundary
intervals, hence a disk. Registered band sides continue without a branch.

Count intentional outer ends from the connected **circular boundary arcs**.
Circle/edge intersections are decided using exact rational quadratic predicates.
For each component, sum its circular arc fragments and subtract one for each
join whose interval reaches the outer circle. Such a join joins two outer arc
fragments at that circle point. In these disk components the arc-gluing graph
has no cycles: an entire closed outer circle would require surrounding the
uncovered center, giving an annular rather than disk component. Positive band
side boundaries also remain. The resulting outer-arc count is two in every
accepted case. Each component is thus a two-ended reference ribbon; its shape
is not inferred from the number of centerline fragments.

This preserves the two-end rule without dropping fringe material or pretending
that fringe leaves are extra ends. Every accepted case explicitly passes
open-strips-only compatibility. The broader untwisted-loop policy is unchanged.

## Independent checker and certificate scope

[corner-crop-reference.py](corner-crop-reference.py) produces version-2 reference
certificates using the earlier rational clipping construction.
[check-corner-certificate.py](check-corner-certificate.py) accepts a supplied JSON
file and rebuilds the expected geometry independently:

- It imports neither producer nor Stage 1 geometry helpers.
- It intersects all pairs of reference boundary lines, tests their half-plane
  membership and constructs a convex hull. This differs from the producer's
  successive polygon clipping.
- It uses quadratic signs and monotonic intervals to count circular intersections,
  rather than the producer's edge-distance construction.
- It derives occupancy, radial intervals, registered partners, connected
  components, positive-area overlaps and crossing positions from parameters.
- It verifies the supplied piece geometry, unique occurrence IDs, complete
  interval coverage, face/side transport, colors and component membership.
- It checks source order under sector/closing-seam transport, and all actually
  simultaneous positive-area triple stacks. Entire ribbons need no global rank.

The checker shares the declared mathematical model and transcribes the source
precedence/color equations independently. It is not an independent physical
weaving theory. Supplied pairing, component, mask or occupancy data never supply
its expected answers. Unsupported parameter ranges and geometric degeneracies
are Unvalidated; geometric/identity/color/order discrepancies have witnesses.

Certificate order records cover every positive-area pair overlap, including
hidden and partial end overlaps. Centerline crossings are separately recorded
as two local occurrence positions with exact reference coordinates. A self-crossing
retains both positions even when their global component is the same. Seam copies
are de-duplicated only when reporting assembled crossing counts. No over/under
event is collapsed merely because its global strip ID repeats.

Version 2 uses geometric overlap/crossing records and reconstructed components.
It does not validate a caller-supplied Stage 1 route/sequence field or a legacy
version-1 research JSON format. Original certificates are reproduced by the
unchanged Stage 1 script and reissued as region certificates. All original counts
and fixed-color outcomes are compared; this is not a claim that an arbitrary
legacy certificate parser has been implemented.

## Bounded acceptance cases and changed counts

The full run contains **137 accepted monochrome region certificates**:

- All 89 original finite parameter cases; the original tracked summary reproduces
  exactly, and all six reported graph/crossing counts and five color-pattern
  outcomes per case agree with the independent checker.
- 12 madweave cases: R/P=5.9,6,6.1; alpha=60,120; beta=240,480. The 60-degree
  case uses the appropriate displaced sixfold center k=(0,2,-2), C=hand=X=0.
- 36 hexweave cases: the same three radii, both beta values, all three required
  hole kinds, both C phases, hand=X=0. Large hexagons use 60-degree units and
  the two triangle orientations use 120-degree units.

New cases use W/P=3/4. Original cases retain all their widths, centers and flags.
The bounded checker accepts only alpha=60/120, 1<=m<=8, 1<=R/P<=8, 0<W/P<1,
signed integer center phases and the documented membership/order settings.
This parameter envelope alone does not imply every case in it is Validated.

For the 480-degree madweave crop:

| R/P | alpha | Piece occurrences | Full-band joins | Open ribbons | Outer ends | Crossings |
|---:|---:|---:|---:|---:|---:|---:|
| 5.9 | 120 | 88 | 40 | 48 | 96 | 384 |
| 6 | 120 | 96 | 48 | 48 | 96 | 384 |
| 6.1 | 120 | 96 | 48 | 48 | 96 | 416 |
| 5.9 | 60 | 128 | 80 | 48 | 96 | 384 |
| 6 | 60 | 144 | 96 | 48 | 96 | 384 |
| 6.1 | 60 | 144 | 96 | 48 | 96 | 416 |

At R/P=6, the 120-degree unit retains fringe bands (d,s)=(2,-3),(2,8).
The documented s=8 band starts on the ray at `r/P=(41/4)/sqrt(3)<6`, while
its centerline reaches that ray only at `11/sqrt(3)>6`. At R/P=5.9 its material
has not yet reached that seam; the first full-band threshold is approximately
5.918. At R/P=6, each new fringe occurrence and seam subdivision increases both
piece and join counts, preserving the number of completed ribbons. R/P=6.1
includes additional centerline crossing locations at squared radii 109/3 and 37,
both outside R/P=6 and inside R/P=6.1.
These changes represent real crop/partition changes, not strip creation by an
identity merge. The 240-degree counts are half the corresponding 480-degree
counts. Detailed counts and color witnesses for all cases are in the evidence.

### Explicit remaining crop limits

The producer also retains all material at R/P=63/10, including band caps whose
spines miss the **entire disk**. Some such components have one circular outer
arc, not the two intended ends of the accepted regular ribbon contract. The
checker returns Unvalidated instead of silently adopting a tapered cap/end
policy or discarding that material. This is different from the sector-only
fringes at R/P=6, which are now fully accepted.

Circle-through-polygon-vertex degeneracies are also explicitly Unvalidated in
this bounded checker. Smooth circle/edge tangencies do not create positive-length
arcs; the tested cases use exact predicates. Arbitrary crop shapes, all radii,
assembly mechanics and physical stock remain outside this certificate pass.
No custom-cut stock substitution is made.

## Adversarial supplied certificates

The experiment writes mutated JSON files and passes them to the checker.
All **14 mutations** are rejected with a witness:

1. Swap equal-interval partners on one seam, preserving degrees and monochrome
   colors: rejected by registered tangent/partner identity.
2. Remove regular material.
3. Remove a fringe occurrence whose spine misses the wedge.
4. Duplicate a material record.
5. Merge occurrence IDs across records.
6. Merge two global material components.
7. Introduce a custom material-color conflict at a genuine join.
8. Reverse local crossing order.
9. Omit an actual positive-area overlap.
10. Change one full-width seam interval.
11. Reverse transported ribbon sides.
12. Change one band-boundary vertex.
13. Delete a crossing from the valid self-crossing fixture.
14. Introduce a cyclic order at one actual simultaneous triple overlap.

The valid beta=120 fixture still reports two
self-crossings. A component-level above/below cycle at separate locations in
the unmodified baseline also passes. A simultaneous local cycle fails.
No mutation is accepted merely because colors or graph degrees happen to agree.

## Inverse coordinates with display rotation

Distinguish reference center p, chart center c, screen affine transform T, and
display rotation phi0. The defining chart is

```text
v = r*(cos(theta_local),sin(theta_local))
theta_unwrapped = j*alpha + theta_local
y_screen = T(c + r*(cos(phi0+f*theta_unwrapped),
                    sin(phi0+f*theta_unwrapped)))
```

For inversion:

```text
(x,y) = T^-1(y_screen) - c
r = hypot(x,y)
psi = mod_2pi(atan2(y,x) - phi0)
j = floor(psi/(f*alpha))
theta_local = psi/f - j*alpha
x_canonical = p + r*(cos(theta_local),sin(theta_local))
x_source = p + Rot(j*alpha)*(x_canonical-p)
```

Subtract phi0 **before** choosing the sector or dividing by f. Reference p and
display c are not interchangeable. Keep the unwrapped occurrence index j when
converting source labels to material identity. At r=0, or inside certified hole
clearance, picking returns no material without choosing an arbitrary angle.
Elsewhere inverse coordinates must be followed by actual full-region occupancy.

Angular ownership is half-open in psi: sector j owns `[j*f*alpha,(j+1)*f*alpha)`.
The final exact ray belongs to sector zero. Exact rays share one geometric seam,
whose two local positions map to the same joined strip. Floating-point evaluation
on an exact ray needs a declared numerical boundary policy; these research
checks do not certify a future implementation's snapping rules.

[corner-coordinate-check.py](corner-coordinate-check.py) checks 378 interior
round trips near both sides of rays, using nonzero p and c, three nonzero display
rotations, and an invertible screen matrix containing scale and shear. Maximum
coordinate error is recorded in the evidence. These are numerical examples of
the equations, not application picking acceptance tests.
The maximum observed reference-coordinate error was approximately 1.25e-14.

## Circular boundary approximation bounds

The reference crop circle stays a circle of radius R in the radius-preserving
chart. For reference sweep h, its display sweep is f*h. A chord on that circle
has maximum radial error

```text
e = R*(1-cos(|f*h|/2)) <= R*f^2*h^2/8
```

Use subarcs with `|f*h|<=pi`. If sigma is the largest singular value of the
actual display/export linear transform, choose

```text
epsilon = min(W/1000, 0.25/sigma)
|h| <= min(pi/f, sqrt(8*epsilon/(R*f^2)))
```

Rotation/translation do not increase the world-space bound. Sigma converts it
to the required pixel bound, including nonuniform scale/shear. For a different
parameter t, use the second derivative in that parameter instead; the straight
edge bound from Stage 1 cannot simply be reused for a circular boundary.
Clip endpoints remain exact algebraic circle/line intersections; approximating
an arc must not move its seam endpoints independently. Both bands and masks must
use the same reference circle. Print/cutting tolerance remains separate.

The numerical examples check sagitta against this bound at four multipliers.
They do not implement a certified adaptive tessellator. Uncertain angle/endpoint
bounds, unsupported degeneracies and exhausted numerical budgets remain
Unvalidated. The region certificates themselves use the analytic disk.

## Reproduction and review stop

```sh
python3 research/single-corner-stage1.py
python3 research/corner-crop-followup.py
python3 research/corner-coordinate-check.py
python3 research/check-corner-certificate.py research/output/corner-crop-followup/mad-R6-alpha120-beta480.json
```

The first command reproduces the original summary. The second rebuilds all
137 certificates, checks five fixed-color assignments per case, and exercises
the supplied mutations. Its expected color failures are reported separately
from the accepted monochrome geometry. Full JSON inputs and results are written
under ignored `research/output/corner-crop-followup/`.

Tracked evidence comprises [results](evidence/corner-crop-followup.json),
[coordinate checks](evidence/corner-coordinate-check.json), and representative
[R/P=6](evidence/corner-crop-R6.json) and
[self-crossing](evidence/corner-self-crossing.json) supplied certificates. The
standalone checker can read these directly, without executing the producer.
[Standalone CLI evidence](evidence/corner-checker-cli.json) records two accepted
files, 14 Invalid mutations and the Unvalidated cap case, including exit codes.

The accepted construction constraints, grouped edit policy and separate diagram
and physical gates remain in force. No application feature or production code
was changed. This follow-up ends at research evidence and documentation for review.
