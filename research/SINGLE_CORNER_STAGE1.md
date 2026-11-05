# Single-corner Stage 1: reference model and compatibility results

**Later authorization:** the separate [Stage 2 visual prototype](SINGLE_CORNER_STAGE2.md)
is now delivered for review. The hold statements below record this report's
original Stage 1 boundary; Stage 3 and production integration remain on hold.

**Follow-up:** [complete circular crops and independent certificate checks](SINGLE_CORNER_CROP_FOLLOWUP.md)
now cover the R/P=6 sector fringes and neighboring radii. The limitations and
absence of a supplied-certificate checker described below are historical to
this initial pass; the follow-up states precisely what has been resolved.

Research completed on 2026-11-04, following preparatory commit `2fe226c` on
`docs/single-corner-prompt`. This is the requested Stage 1 deliverable for review.
**Implementation remains on hold. Physical constructibility is Unvalidated.**
No corner renderer, UI, project-state implementation, fabrication output or
production application change is included.

The [accepted prompt](SINGLE_CORNER_PROJECT_PROMPT.md) governs this work. Its
diagram-release and physical-validation gates remain separate. A mathematical
certificate below is not a passing diagram application or a physical example.

## 1. Results and their scope

**Angle baseline clarified by the user:** monochrome madweave permits multiples
of 60 degrees; particular patterns may require larger multiples, such as 120
degrees. The center/phase catalogue below explains realizations and restrictions
of particular fixed settings. It does not replace that general baseline with a
120-degree minimum increment.

For `tree.png`, the recovered reference angle is specifically 480 degrees,
with angular multiplier 3/4. Its image reconstruction is finished. The 240-degree
case below is a separate wedge-removal example, not another candidate fit for
the tree. Neither example is the general tool's complete allowed-angle list.

The four-sector 480-degree and two-sector 240-degree candidates have complete
reference-ribbon certificates in the stated finite models. They have exact
registered band intervals, distinct sector occurrences, consistent local order,
explicit outer endpoints and compatible three-color assignments. Both satisfy
the accepted **open-strips-only** restriction as well as the broader loop policy.

Additional results:

- All required geometric hole centers have lattice formulas and positive
  material-boundary clearances. Hexweave's two triangle orientations are retained.
- Every madweave hexagon center has 120-degree order symmetry. Some displaced
  centers have 60-degree order symmetry even when the ordinary origin does not.
- Hexweave large-hexagon centers have 60-degree geometry/order symmetry; its
  triangle centers have 120-degree symmetry. Their fixed colors need separate checks.
- A radius-preserving, locally straight reference ribbon cannot have a closed
  centerline. Thus loops are allowed by policy but do not occur in this model.
- A 120-degree reference-angle example contains two self-crossings of open
  strips; its certificate retains both material positions at each crossing.
- A circular crop can produce sector fringe material with no centerline in that
  sector. This is detected, not dropped. General handling remains Unvalidated.

| Result | Status | Exact scope / limit |
|---|---|---|
| Hole formulas and phase actions | Validated | Periodic straight-band reference geometry below |
| Sufficient symmetric-sector angle families | Validated | The stated full-pattern geometry/order symmetries; not an exhaustive theorem about other registrations |
| 480 and 240 degree finite reference assemblies | Validated | Listed radii, widths, phases and flags; color-specific statuses are separate |
| Particular fixed-color conflicts | Invalid with witness | Actual conflicting joined occurrences, not a failed search |
| Arbitrary circular-crop certificate | Unvalidated | Fringe pieces are not yet classified by the spine-based traversal |
| Non-symmetry seam registrations / arbitrary interior centers | Unvalidated / deferred | No exhaustive search or impossibility claim |
| New renderer, picking, persistence and export | Unvalidated | Mathematical requirements and acceptance plan only; not implemented |
| Straight-stock physical realization and fabrication | Unvalidated | No physical example, thickness/clearance/assembly certificate or cutting template |

Reproduction uses [single-corner-stage1.py](single-corner-stage1.py). A
[tracked compact evidence record](evidence/single-corner-stage1.json) captures
the parameters, counts and pattern outcomes. Full ledgers, endpoint expressions,
crossing sequences and conflict witnesses are generated under
`research/output/single-corner-stage1/`. That directory is ignored by Git.

## 2. Model, material assumptions and coordinates

Reference ribbons are straight, constant-width bands of width W, with pitch P.
The principal domain is `0 < W < P`; the four existing application spacings
also satisfy `W/P >= 1/3`. Strip bodies are intrinsically unstrained in this
reference model. Thickness is zero for diagram/order bookkeeping. Crossings
have distinct material positions and specified above/below relations; they are
not fused intersections or claims that zero-thickness drawing is physical paper.

Seam registration is an orientation-preserving rotation about the selected
center, preserving radius, width, tangent, material face and the intended ribbon
side. No extra kink, stretch, reflection, joint or twist is inserted. Circular
trimming creates intentional outer ends. This does not establish that the entire
network embeds in 3D with straight paper stock, finite thickness, sufficient
clearance, feasible assembly order or mechanical stability. Bending and joining
methods have not been selected or physically checked. **Custom-cut stock is not
used as a substitute for straight stock.** Any such change requires explicit
scope review and new physical assumptions.

Use fixed signed strip indices, independent of finite array size:

```text
n0 = (0,1), n1 = (-sqrt(3)/2,-1/2), n2 = (sqrt(3)/2,-1/2)
Bd,s = {x : |nd dot x / P - (s - 5/2)| <= W/(2P)},  s in Z
b_d = C*(3-d), C in {0,1}
c(d,s) = (s+b_d) mod 3                   Euclidean residue
n(d,s) = floor((s+b_d)/3)
```

The offset 5/2 anchors the phase to the existing base-size-2 reference. This is
an infinite periodic extension, not an extension of JavaScript array indices.
For a legacy offset `O_B=floor(3B/2)-1/2`, geometry converts by
`s_fixed=s_legacy+5/2-O_B`. Preserving its original colors/classes additionally
requires carrying the common phase offset `O_B-5/2`; it must not be discarded
when normalizing coordinates. Import behavior itself remains future work.

Full madweave includes all `(d,s)`. A hexweave includes exactly one selected
class `c=h`, using the selected C phase. Visibility and opacity never change
this membership. Material colors in the certificate are labels 0,1,2, declared
distinct; monochrome identifies all three labels. Palette aliases must respect
declared material-color equivalence, rather than slot numbers.

For a chosen center `p`, take a circular reference crop `|x-p| <= R`. Reference
sectors have width alpha=120 or 60 degrees. Their occurrence index is
`j=0,...,m-1`, with total angle `beta=m*alpha`. Sector interiors are disjoint
material-coordinate domains even when j exceeds one planar turn. The chart is

```text
q_paper = beta/(2*pi), f = 1/q_paper
(r,theta_unwrapped) -> (r, phi0+f*theta_unwrapped)
```

Its metric is `dr^2+f^2*r^2*dtheta^2`; the reference metric is
`dr^2+r^2*dtheta^2`. No diagram distance is silently interpreted as a fabrication
dimension. Exact sector count/angle determines f, q and deficit; legacy N does
not restrict the angle domain.

## 3. Hole and phase catalogue

Write `w=W/P`, `a=(1-w)/2`, and `A=(3-w)/2`. For integers k0,k1 set

```text
k2 = -k0-k1
nd dot p/P = k_d
p/P = (-(2*k1+k0)/sqrt(3), k0)
t = (k1-k0) mod 3
```

These are madweave's small-hexagon centers. In displacement coordinates
`u=(x-p)/P`, their hole is `|nd dot u| < a` for all d. Its clearance is exactly
`a*P=(P-W)/2`, measured to the full material boundary, not to centerlines.
At W=P the hole collapses and the center is invalid. For W/P<1/3 additional
triangle gaps can appear in full madweave; those are outside its approved center
kind, not additional approved choices.

For a selected hexweave class h, its geometric hole centers are the subset with
`t=C mod 3`. Set `z` to the representative in `{-1,0,1}` of `h-1-k0 mod 3`:

| z | Reference hole | Relative inequalities | Clearance | Geometric rotation |
|---:|---|---|---:|---:|
| 0 | Large hexagon | `|nd dot u| < A` | `(3P-W)/2` | 60 degrees |
| +1 | Triangle pointing toward +y | `nd dot u > -a` | `(P-W)/2` | 120 degrees |
| -1 | Triangle pointing toward -y | `nd dot u < a` | `(P-W)/2` | 120 degrees |

The triangle vertices are `(0,2a), (+/-sqrt(3)*a,-a)` for z=+1,
and their negatives for z=-1. These are mathematical coordinates; screen axes
may be inverted. Neither orientation is silently identified with the other.

Derivation: adjacent selected-class centerlines are 3P apart. Their gap-midpoint
coordinates are `m_d=h-b_d-1+3*l_d`. The plane `sum(nd dot x)=0` cuts the three
gap slabs. Their midpoint sum is `3z`. Subtracting z from each m_d gives k_d
with sum zero. z=0 gives a regular hexagon; z=+/-1 gives the two equilateral
triangles. No other slab-sum value meets the plane for `0<w<1`. This enumerates
the geometric hole families rather than inferring holes from white pixels.

Representatives at C=0, p=0: h=1 is the large hexagon, h=0 the minus triangle,
h=2 the plus triangle. At C=1 use k=(0,1,-1) for the same h/kind association.
The script independently clips the complement-of-band half-planes for 18
representatives (both C values, all classes and hole kinds), checking vertex
counts and clearances.

### Which phases are equivalent?

For full madweave, order-preserving translations include integer normal shifts
whose three residues are equal modulo 3. Thus the three values of t distinguish
the relevant center order phases at fixed C/hand/X. For colors involving n,
modulo 3 is insufficient. At three colors, all five formulas are periodic under
`s -> s+9`; `(k0,k1) mod 9` is a sufficient finite representative set (81
centers per C) for fixed-color phase analysis. This need not be the smallest
equivalence quotient.

The catalogue retains C, hand, X, h, z, k and color phase. Two holes of the same
drawn shape are not assumed equivalent under fixed material coloring. Changing
the finite crop or legacy array size must not reset that physical phase.

## 4. Rotations, order and sufficient angle families

Rotation about p induces the following exact strip maps:

```text
120 degrees: (d,s) -> (d+1 mod 3, s+k_(d+1)-k_d)
 60 degrees: (d,s) -> (d+2 mod 3, 5-s-k_(d+1))
```

Equivalently, for local strip index `ell=s-k_d`, 120 degrees preserves ell;
60 degrees sends ell to `5-ell`. The latter reverses the *canonical label*
normal and tangent together. It is a proper spatial rotation, not a material
reflection or a twist.

The source precedence formula is used, with Euclidean residues. For distinct
directions let `dd=(d-e) mod 3`, and
`ds=(-1 if dd=1 else +1)*(s-r) mod 3`. Begin with `ds==(1-C)`, reverse when
`(dd==1)==X`, and reverse again when hand is on and the classes agree.

Under 120 degrees all index shifts are equal modulo 3, so order is preserved
for every madweave center and every C/hand/X setting. Under 60 degrees the
residue ds becomes `t-ds`. Including the class-dependent hand reversal yields
the necessary and sufficient condition for symmetry of this entire periodic
precedence field:

```text
t = 2 - 2*C - hand  (mod 3)
```

| C | hand | t permitting 60/180-degree order symmetry |
|---:|---:|---:|
| 0 | 0 | 2 |
| 0 | 1 | 1 |
| 1 | 0 | 0 |
| 1 | 1 | 2 |

X reverses order uniformly and does not change this condition. The script checks
all residue pairs, all nine `(k0,k1) mod 3` representatives, and all eight flag
settings: 72 rows, each with 60/120/180-degree outcomes and failure witnesses.
For example, at the ordinary origin with C=hand=X=0, the pair `(d,s)=(0,0)` and
`(1,1)` reverses precedence under 60 degrees. This refutes a claim of full
60-degree order symmetry there; it does not exclude every possible finite seam.

For a single hexweave class, the selected-class residue term is always false
before the X/hand reversals. Order depends only on the cyclic direction pair.
It is preserved under the rotations of its geometric hole. A large-hexagon
center therefore supports 60-degree units even where the full madweave order
supports only 120 degrees.

| Reference material / center | Sufficient geometry/order sector family |
|---|---|
| Madweave, any required hexagon center | `beta=m*120 degrees`, integer m>=1 |
| Madweave, t satisfying the table | Additionally `beta=m*60 degrees` |
| Hexweave, large hexagon | `beta=m*60 degrees` |
| Hexweave, either triangle orientation | `beta=m*120 degrees` |

These are symmetric-sector constructions. Their rotation proof gives complete
local seam registration/order; finite crops and coloring are still certified
separately. No necessity theorem excludes non-symmetry registrations or other
finite seam phases. Infinite families do not imply a usable UI range or a physical
construction for every m. The 240, 360 and 480 degree cases are finite acceptance
examples; 300 degrees has a further finite monochrome certificate at appropriate
madweave centers. These example choices do not narrow the product's monochrome
60-degree baseline. Any practical UI range and its finite evidence must be
stated separately from the mathematical angle family.

### Local stack consistency

At a simultaneous three-band overlap, the three reference indices satisfy
`s0+s1+s2=7 or 8` for `0<W<P`: their center offsets sum to an integer minus 7.5,
and the three width errors sum to less than 1.5 in magnitude. Checking these
residues gives local ranks 0,1,2 for all eight flag settings (144 exact cases).
Thus the source rule is transitive wherever three bands actually coexist.
One selected hexweave class cannot have such a triple overlap in this width
domain: its three indices sum to 0 modulo 3, incompatible with 7 or 8.

This is a local statement. There is no global ordering of entire strips.
The actual reference sequence can contain several successive overpasses or
underpasses; universal alternation is not imposed.

## 5. Complete finite ledgers for the first candidates

Take p=0, alpha=120 degrees, W/P=3/4, R/P=3. The rational width is a convenient
exact reference, not a claim that the tree used this exact spacing. The actual
source default W/P=100/133 and its other three spacing settings are also checked
below. Choose reference rays 0 and 120 degrees. Each convex sector-band-disk
intersection is one local connected piece.

The 12 pieces in one unit are:

```text
H: (d=0,s=3,4,5)
R: (d=1,s=0,1,2)
L: (d=2,s=0,1,2,3,4,5)
```

For a=0,1,2 the start ray contains `(1,2-a)` and `(2,3+a)`. With
`u=sqrt(3)*r/P`, each has the full radial band interval

```text
I_a = [2*a+1-w, min(2*a+1+w, 3*sqrt(3))]
```

At the end ray, the registered partners are respectively `(2,2-a)` and
`(0,3+a)`, with the same entire interval, width and tangent. Two bands can share
an interval while crossing: they remain two material positions. Their tangent
families and local order distinguish them, so swapping these partners is invalid.
Gaps are the complement of these intervals on the full boundary, including the
center clearance and outer crop; no hidden bands are omitted.

For every j, including the closing boundary, join:

```text
(j,2,2-a) <-> ((j+1) mod m,1,2-a)
(j,0,3+a) <-> ((j+1) mod m,2,3+a)
```

IDs include sector, local direction and signed local strip index. The transforms
to the unwrapped sector are rotations by `j*120 degrees`; source labels/colors
are transported by the rotation formulas. At m=4, j=3 reuses a planar orientation
but does not reuse j=0's material occurrences. All three internal boundaries and
the closing boundary have six joins each.

Every one of these pieces has one seam end and one outer end. Consequently each
component contains exactly two pieces and two intentional outer ends. A reference
spine with signed normal offset b has circular endpoints at tangent coordinate
`+/-sqrt(R^2-b^2)`. Intersections with the radial boundaries are rational in
`X=sqrt(3)*x/P, Y=y/P`. The certificate stores those algebraic endpoint expressions.

| Reference angle | m | Local occurrences | Band joins | Open strips | Outer ends | Centerline crossings |
|---:|---:|---:|---:|---:|---:|---:|
| 240 degrees | 2 | 24 | 12 | 12 | 24 | 48 |
| 360 degrees | 3 | 36 | 18 | 18 | 36 | 72 |
| 480 degrees | 4 | 48 | 24 | 24 | 48 | 96 |

Per unit there are 33 positive-area pair-overlap fragments and 18 triple-overlap
fragments at w=3/4. These fragment counts intentionally precede seam gluing;
centerline crossing counts in the table de-duplicate seam crossings. All C/hand/X
combinations pass the reference geometry/order/continuation checks at these
parameters. Their coloring can still fail.

Each crossing record carries two local material positions and its top occurrence.
Each component has an ordered route and crossing sequence. Every crossing occurs
at exactly two positions across the sequences, with one above and one below.
At the 480-degree ordinary fixture, component 0 follows `(0,0,3)` then `(1,2,3)`
and has sequence `over,over,over,under,under,under,over,over,over,under`.
This is a concrete reason not to demand alternating over/under events.

All positive-area band overlaps are checked separately from centerline events.
Partial end overlaps without an interior centerline crossing retain their source
precedence. The rule is constant for a pair within a sector and covariant across
every join, so it cannot acquire an unexplained reversal inside a connected
overlap. These facts, rather than a monochrome image, supply the order evidence.

### Other required holes, radii and spacing

At R/P=7 and w=3/4, the script certifies both 240 and 480 degrees for all three
hexweave hole kinds, both C values, and all hand/X flags. Representatives are
k=(0,C,-C), with class 1 large, class 0 minus triangle and class 2 plus triangle.

| Hole, at 480 degrees | alpha | Occurrences | Joins | Open strips | Outer ends | Crossings |
|---|---:|---:|---:|---:|---:|---:|
| Large hexagon | 60 degrees | 48 | 32 | 16 | 32 | 56 |
| Minus triangle | 120 degrees | 36 | 16 | 20 | 40 | 56 |
| Plus triangle | 120 degrees | 36 | 16 | 20 | 40 | 56 |

The 240-degree rows have half these counts. Triangles have no simultaneous
two-band seam overlap at the selected ray, whereas the large-hexagon fixture
does. All have zero positive-area triple overlaps. Their matching is still over
the complete material boundary, including hidden portions.

The larger madweave R/P=7, 480-degree fixture has 104 occurrences, 48 joins,
56 open strips, 112 ends and 520 crossings. It exercises negative signed indices
and all three actual group colors. Additional translated C-on hexweave fixtures
at k=(-1,0,1) exercise a different group-color phase.

At p=0, R/P=3 and C=hand=X=0, the 240/480 candidates also pass at
`W/P=100/107,100/133,5/9,1/3`, corresponding to the four source gap ratios
`.07,.33,.8,2`. Their graph/crossing counts are unchanged. At W/P=1/3 the
positive-area triple overlaps disappear, as predicted. The order covariance
proof applies across these widths, but only the listed flag/width combinations
are described as executed finite fixtures.

### Crop fringe: a concrete Unvalidated case

At R/P=6, w=3/4, consider the local d=2, s=8 band in a 120-degree sector.
Its normal offset is b=11/2. On the start ray its band begins at
`r/P=(41/4)/sqrt(3) < 6`, while its spine would meet that ray at
`r/P=11/sqrt(3) > 6`. There is positive-area material in the sector but no
spine segment there. This is not a missing physical band or proof of an invalid
corner; it is a counterexample to representing every clipped ribbon piece solely
by a centerline segment with two ends.

The research routine detects this and stops that certificate. It does not quietly
omit the band or report a geometry impossibility. R/P=3 and 7 were explicitly
checked with full-band occupancy before the spine traversal. General radius
support needs ribbon-side/outer-arc topology that includes these fringe pieces.
That is a named acceptance requirement, not a reason to hide arbitrary crop limits.

## 6. Open strips, loops, self-crossings and framing

On an arclength-parametrized straight developed spine, `g(l)=r(l)^2` satisfies
`g''(l)=2`. Radius and its derivative agree across the registered rotation seams.
If a spine were a closed loop of positive length L, integrating once would give
`g'(L)-g'(0)=2L`, contradicting periodicity. A straight spine therefore cannot
close in this radial model. A finite circular truncation has two outer ends.
The explicit graphs above confirm this for every certified finite fixture.

This excludes loops only under the stated straight-reference/local-transport
assumptions. The product policy still permits untwisted loops in another
explicitly validated model. A loop occurrence would require reviewing which
assumption changed, not inventing a twist or silently curving the stock.

The 120-degree angle fixture (one 120-degree unit) has six open strips and
24 crossings, including two self-crossings. One is between pieces `(0,0,3)` and
`(0,2,3)` belonging to the same strip. Its two positions retain opposite local
above/below roles; they are never collapsed into a junction by global strip ID.
This is a reference-model fixture, not a physical-build recommendation.

All seam maps have determinant +1 and no extra material-face rotation. In
60-degree units the canonical side label changes sign because the canonical
normal reverses; both normal and tangent reverse, preserving actual ribbon
sides under the rotation. This is the specified untwisted local transport.
Orientability by itself would not exclude a full twist in a physical embedding.
Physical framing and construction remain to be checked separately.

## 7. Color compatibility and witnessed conflicts

The five source patterns, numbered 0 through 4, are
`d`, `c`, `d+c`, `n`, `c+n`, reduced modulo colorCount. The finite certificates
check all five with three declared distinct colors, by assigning a source color
to each sector occurrence and checking constancy on every connected strip.
Diagnostic colors are not inputs to this test. Monochrome always passes wherever
geometry/order pass because it identifies material labels without altering them.

For the ordinary-origin madweave at either 240 or 480 degrees:

| Pattern | C=0 | C=1 | Actual distinct colors when valid at R/P=3 |
|---|---|---|---|
| 0: direction d | Invalid | Invalid | — |
| 1: class c | Validated | Invalid | 3 |
| 2: d+c | Invalid | Validated | 3 |
| 3: group n | Validated | Invalid | 2; at R/P=7 it uses 3 |
| 4: c+n | Validated | Invalid | 3 |

For a concrete 480-degree conflict, join `(3,2,0)` to `(0,1,0)`. Their fixed
direction colors are 2 and 1. With C=0 their class colors are both 0. With C=1,
their class colors are 1 and 2, so fixed class coloring fails; their d+c colors
are both 0, so that mixed formula removes this conflict. The full component
check confirms the mixed formula across the entire C-on construction, not just
at this one join. X and hand do not change those color formulas.

### Periodic fixed-color catalogue

Let `z_d=k_d+C*(3-d)` (this z-vector is separate from the scalar hole-kind z).
For the full periodic madweave color field at three colors, these are exact
rotation-invariance conditions:

| Rotation modulo 360 degrees | Fixed-color formulas invariant on the entire field |
|---|---|
| 0 | All five |
| 120 or 240 | Pattern 1 iff `t=C`; pattern 2 iff `t=C-1 mod 3`; patterns 3 and 4 iff `z0=z1=z2 mod 9`; pattern 0 never |
| 180 | Pattern 0 only |
| 60 or 300 | None of these five fixed three-color formulas |

The condition for patterns 3/4 follows from their period-9 index functions, not
from class residues alone. The table is checked over all s modulo 9, directions,
81 center representatives per C and six rotations: 972 color rows. It concerns
the full fixed-color field. Failure of full-field invariance does not by itself
exclude every small finite seam or an explicitly different custom coloring.

For a selected hexweave class, pattern 1 is actually monochrome. Pattern 2 has
the same compatibility restriction as direction coloring. Under 120/240 degrees,
patterns 3/4 preserve the periodic selected-class field iff all z_d agree modulo
9; under an odd multiple of 60 degrees they fail because reversing the group
index cannot preserve three distinct group colors for all groups. Direction and
d+c colors survive a 180-degree registration at a large-hexagon center.

The R/P=7, C=0 hexweave certificates provide three genuinely used colors with
patterns 3 and 4 for both triangle orientations and the large hexagon. At C=1,
k=(0,1,-1), those fixed group patterns conflict. Moving to k=(-1,0,1) gives
z=(2,2,2) and they pass, with three actual colors in all three hole kinds.
This is why a hole-kind label alone cannot determine color compatibility.

The 300-degree madweave fixtures at the four appropriate C/hand center phases
pass geometry/order in monochrome while all five fixed three-color formulas
conflict. A custom coloring constant on each global strip can still use three
distinct colors; it must be labeled as that custom assignment. It is not a
repair preserving one of the incompatible original fixed patterns.

Manual coloring is a constraint on connected components. An edit that merges
different material colors is invalid unless the user explicitly includes the
color change in a grouped transaction. Other palette counts and arbitrary
pattern languages were not classified in this pass.

## 8. Map, numerical bounds, identity and persistence contract

For a fixed display rotation, normalize the displayed polar angle to `[0,2*pi)`.
The sector owner is `j=floor(m*phi/(2*pi))`; invert with
`theta_local=phi/f-j*alpha`, retaining j. Transform into the canonical reference
sector and test actual band width, physical membership and the circular crop.
Nearest-strip rounding is only a candidate generator. Map the local occurrence
through the explicit continuation graph for global selection.

Use half-open angular ownership with one shared exact geometric boundary; the
final wrap is boundary zero. Both adjacent occurrences at a seam must return
the same global component while retaining local crossing position. Inside the
certified center clearance no material exists, so no arbitrary apex epsilon is
needed. Nonzero center, display rotation, exact rays and wrap remain mandatory
future implementation tests.

For a straight reference edge `p(t)=a+t*v`, away from the center,

```text
|F''(t)| = |1-f^2| * cross(p(t),v)^2 / |p(t)|^3
         <= |1-f^2| * |v|^2 / rho
```

Here rho is a certified minimum reference radius for that edge interval. If M
bounds this derivative, a parameter step h has chord error at most `M*h^2/8`.
At f=1 use exact planar endpoints. If the display matrix has largest singular
value sigma in pixels per world unit, require
`error <= min(W/1000, 0.25/sigma)`. Apply the same map and bound independently
to fills, masks, outlines and picking geometry. Manufacturing tolerances are
separate. This derivation does not certify an unimplemented subdivision routine;
budget exhaustion or uncertain bounds must remain Unvalidated.

Stable identity consists of construction-sector occurrence, signed source phase,
connected clipped piece and registered boundary incidence, then its connected
component. Our convex sectors have one piece per band; a generalized crop cannot
assume this. Event identity additionally retains its local material positions.
Re-charting may rename occurrences only with an explicit graph/event
correspondence; displayed SVG IDs are not material identity.

A future state must record beta/sector ledger, center and phase, membership,
W/P/R and reference scale, order flags, material-color equivalence/assignment,
boundary registration and display choices. Imports must rebuild and validate
before replacing the active state. Version-1 visibility filters remain view
filters. Grouped edits validate the whole candidate and commit all or none;
failure preserves the prior design and distinguishes Invalid from Unvalidated.
Graph/component and ordered-event equivalence are required in round trips,
allowing reversal of the chosen traversal direction and appropriate ID renaming.
No state-format or application behavior was implemented in Stage 1.

## 9. Acceptance-fixture plan for a later authorized stage

These are future application/validator acceptance obligations. The Stage 1
research routine is not a general-purpose validator and does not claim this
whole mutation/browser suite has run.

| Fixture | Required evidence / failure witness |
|---|---|
| Planar 360-degree reconstruction | 18 open strips at R/P=3; source geometry/order/color correspondence; existing planar visibility, picking and version-1 meaning preserved |
| 480 and 240 degree primary cases | Exact ledgers above; every boundary including wrap; monochrome plus class three-color success and direction-color conflict |
| C-on color contrast | Fixed class colors fail; mixed d+c passes with three used colors, on the same geometry |
| Three hexweave hole kinds | Representatives and clearances above, both C phases, all flags; class-color monochrome versus actual three-group-color examples |
| Displaced sixfold madweave | Appropriate t for all C/hand combinations; 300-degree monochrome example; ordinary-origin 60-degree order counterexample |
| Source spacings and larger radius | Four widths above; positive-area triple limit at W/P=1/3; negative indices and stable phase at R/P=7 |
| Crop fringe | R/P=6 d=2,s=8 full band must remain present; extend ribbon-side topology before claiming arbitrary radius support |
| Identity mutations | Omit a sector, merge repeated planar labels, duplicate a piece, remove a hidden band, leave an internal end: fail with occurrence/boundary witnesses |
| Pairing mutations | Swap the two equal-interval crossing partners: direction/side/order registration must fail despite unchanged degree and colors; mismatch one width or endpoint also fails |
| Order mutations | Separate-location cyclic precedence passes; simultaneous positive-area cycle and an unexplained within-overlap order reversal fail |
| Framing/topology | Open paths pass; beta=120 self-crossings preserve two positions; inserted side reversal/full twist fails. Synthetic untwisted-loop topology may pass policy but is not a claimed occurrence of this straight-spine model |
| Map mutations | Planar masks with transformed bands fail; nonzero center/rotation, exact rays, final wrap and center/gap picking pass; insufficient numeric bound remains Unvalidated |
| Edit and persistence transactions | Valid grouped changes commit together; invalid/uncertain changes and imports preserve prior state; color aliases, re-charting, zoom and reload preserve graph/event meaning |
| Browser/output regression | Chromium, Firefox, WebKit; existing SVG-seam fix retained; editable offline round trip and accurately labeled diagram SVG |

Diagram release requires these applicable geometry, continuation, color, order,
interaction and persistence checks, with a clear statement that physical
constructibility remains unverified. A documented physical example, explicit
stock/units/tolerances and relevant fabrication checks are required before a
physical-validation claim or fabrication-ready output. One physical example
validates only its recorded scope.

## 10. Reproduction, evidence boundary and review stop

Run from the repository root with Python 3 and Node:

```sh
python3 research/single-corner-stage1.py
node research/symmetry.test.cjs
node research/angular-baseline.test.cjs
```

The new research script uses rational half-plane clipping and rational squared
distance comparisons, with signed-square-root endpoint expressions. It does not
load renderer masks, renderer pairings, SVG occupancy or raster expected answers.
It reads the unchanged source in an isolated Node context only to compare the
transcribed precedence/color formulas: 3,456 pair comparisons and 360 color
comparisons. The negative-index extension is mathematically specified rather
than trusting JavaScript remainder. This is independent reference geometry,
not an independent physical weaving theorem.

The pass records 89 finite fixtures, 72 periodic order rows, 972 periodic color
rows, 18 hexweave hole representatives and 144 simultaneous-triple residue
checks. Full `certificates.json` contains every join, endpoint, component route,
crossing and finite color-conflict witness. `compact-summary.json` is the
reproducible source for the tracked evidence file. Counts in different tables
refer to explicitly named fixtures; they are not universal totals.

The script also demonstrates the crop-fringe limitation and distinguishes
equal-interval partners by registered direction. It is intentionally bounded;
most adversarial mutations in the acceptance plan remain future tests. Existing
symmetry/angular checks remain planar characterization, not a new browser
acceptance run. No full application/browser suite or physical build was performed.

Stage 1 has delivered the requested scoped model, hole/phase catalogue,
seam/continuation evidence, compatibility results and acceptance-fixture plan.
Its constructive certificates and explicit limits are ready for review.
**Stop here. Stage 2, feature implementation and merging remain unauthorized.**
