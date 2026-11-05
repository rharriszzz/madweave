# Single-corner project: prompt for later work

**Status: bounded Stage 3A portable diagrams authorized; delivered for review.**
The [Stage 3A instruction](SINGLE_CORNER_STAGE3A_PROMPT.md) authorizes editable
save/open, offline reopening and static SVG only for the nine certified
constructions. See the [handoff and viewing instructions](SINGLE_CORNER_STAGE3A.md)
and [versioned state format](CORNER_PROJECT_FORMAT.md).
The [Stage 2 prototype](SINGLE_CORNER_STAGE2.md) and its
[bounded corrections](SINGLE_CORNER_STAGE2_CORRECTIONS.md) supply the coherent
transactions, stale-request guards, visible-paint validation and inspection.
The [Stage 1 model](SINGLE_CORNER_STAGE1.md) and
[bounded crop/checker follow-up](SINGLE_CORNER_CROP_FOLLOWUP.md) supply the
reference constructions. The user authorized a separate inspectable drawing,
simple example/color/identity controls, and bounded geometry/browser checks.
Production application code remains unchanged. Do not merge into master or
expand Stage 3 to arbitrary construction editing, other families, fabrication,
production integration or deployment. Stop at Stage 3A for review.
The accepted requirements and separate diagram/physical gates below
remain in force. Earlier historical/image forensics remain preparation evidence.

**Recovered reference (strong reconstruction evidence):** `tree.png` is closely
reproduced by the radius-preserving angular map with
**code multiplier `coneFraction=3/4`**, corresponding to **paper/reference-angle
fraction 4/3**, or 480 degrees with 120 degrees of excess. Its center is the
small white opening near **pixel (218,228)**, directly above the central gap
between the gray and teal trunk strips. A long-edge inverse fit gives 0.74986;
the model-assisted upper-half track count gives 18/24=3/4; and the historical replay matches
99.59% of occupied/empty pixels. See the [forensic report](TREE_REFERENCE_ANALYSIS.md).
This identifies the first flattening method; it does not certify the missing
lower tracks or complete colored seam assembly.

## First understand what `coneFraction` means

### What the dormant code actually does

In [`madweave.js`](../madweave.js), `transformPointToPath` contains the map

```text
r_display = r_source
phi_display = f * theta_source
f = coneFraction = directionsPerCircle / numberOfDirections
```

The current source sets `directionsPerCircle = 3`. Angles in this formula are
radians, and `theta_source` must be unwrapped across angular cuts. This is an
angular-coordinate multiplier. It is **not automatically the fraction of paper
retained**, nor a physical 3D cone's opening angle. The active application still
has `transformInPath=false` and `f=1`.

The code contains clipping and angular helpers, but does not implement a
complete verified nonunit assembly: `numberOfUnits` is not used to build the
assembled surface. Changing the multiplier alone cannot supply missing sectors,
join strip identities, or establish a physical construction.

### Derive the connection to a paper sector

Let beta be the **total reference angle around the chosen corner** in an
unrolled paper/sector model, before identifying the first and last boundary.
Count inserted sectors with their multiplicity; beta may exceed one full turn.
The corner center is in a hole: it is a reference point for this construction,
not a requirement to put paper material at a mathematical cone's apex.
Let delta be the signed angular deficit:

```text
delta = 2*pi - beta
q = beta / (2*pi)                 reference-sector fraction
```

If the angular chart is required to map the whole reference angle onto exactly
one displayed turn, its closure condition is

```text
phi = phi0 + f*(theta - theta0)
f*beta = 2*pi
f = 2*pi/beta = 1/q
beta_degrees = 360/f
delta_degrees = 360 - 360/f
```

The reciprocal is essential. Under this full-turn convention:

| Reference angle beta | Signed deficit delta | Legacy multiplier f | Meaning |
|---:|---:|---:|---|
| 360 degrees | 0 degrees | 1 | Ordinary planar reference |
| 300 degrees | +60 degrees | 6/5 | Remove 60 degrees |
| 240 degrees | +120 degrees | 3/2 | Remove 120 degrees |
| 480 degrees | -120 degrees | 3/4 | Insert 120 degrees |
| 720 degrees | -360 degrees | 1/2 | Insert one additional full turn |

These are **arithmetic examples, not approved weaving configurations**. Hole
symmetry, seam geometry, crossing order, and colors must still permit each one.
In particular, the older proposed `N=6, f=1/2` fixture corresponds to 720
reference degrees under this convention; it is an excess-angle case, not a
paper disk with half its angle removed.

The legacy relation would give `N = 3*beta/360`. For beta=300 degrees, N=5/2.
Therefore an old integer-N restriction could exclude a meaningful angle before
we have even checked the weave. Derive allowed configurations from the actual
weave and seam; do not treat that legacy restriction as a physical theorem.

When using canonical sectors of width alpha, require an integer number m of
those sectors and `m*alpha=beta`; their displayed angles sum to `m*f*alpha=2*pi`.
For identical-sector replication, choose alpha from a symmetry valid for the
selected hole and over/under pattern, and explicitly transport color phases.
A symmetry construction is sufficient only after seam checks; it is not a
necessity theorem excluding all other seam registrations. The old 60/120-degree
unit bookkeeping is not a universal answer.

### A flat angular chart is not a fabrication net

For an unstrained reference sheet,

```text
ds_reference^2 = dr^2 + r^2*dtheta^2
```

The dormant flat display has Euclidean metric

```text
ds_display^2 = dr^2 + f^2*r^2*dtheta^2
```

It changes circumferential distances unless f=1. It can be a useful diagram,
but its printed dimensions are not automatically those of an unstrained paper
construction. Keep reference/net coordinates, display coordinates, and any
physical 3D coordinates distinct.

For comparison only, an ordinary right circular cone made from a sector with
0 < q <= 1 has the following isometric parameterization, with r as slant radius:

```text
X(r,theta) = (
    q*r*cos(theta/q),
    q*r*sin(theta/q),
    r*sqrt(1-q^2)
)
```

Its top-view radius is q*r = r/f, rather than the dormant code's unchanged r.
The commented alternative `r*coneFraction` is not that top-view formula either.
This derivation does not require choosing a circular cone for the project.

For excess angle, q>1, that circular-cone formula has no real height. A physical
excess-angle sheet needs another shape or a folded/overlapping representation.
The primary paper [Conical defects in growing sheets](https://arxiv.org/abs/0807.1814)
describes such excess cones and multiple folded states. This is background for
the continuous-sheet model, not a claim that a woven network must behave like
a solid sheet. Weave holes, adjustable crossings, curved strip shapes, and
material bending must be accounted for in the intended construction.

The tree reference is now identified as this uniform, radius-preserving angular
chart with f=3/4. Its curved bands do not imply a different nonradial map.
Preserve beta, delta, and the seam identification as model parameters; future
alternative displays must not silently redefine them. Name the two reciprocals
explicitly: `paperAngleFraction=q` and `angularMultiplier=f`; the current legacy
variable `coneFraction` means f. A future UI should show, for this example,
"reference angle 480 degrees (4/3 turn), excess 120 degrees, angular multiplier
3/4". Do not show an unlabeled fraction and expect users to guess which one.

## Evidence and authority

Keep these categories separate throughout the work:

| Category | Current examples | How to use it |
|---|---|---|
| Confirmed user requirements | Both deficit and excess angle; center over a hole; exact continuation and same material color; no branches, twists, or dangling seam ends; conceptual seams; controls on the webpage | Preserve unless the user changes them |
| Recovered evidence | Tree multiplier near 3/4 and center near (218,228); historical replay and palette | A reference to explain and test; not a completed corner certificate |
| Conditional deduction | A fixed three-direction coloring conflicts with a 120-degree identification about the ordinary center | Verify its assumptions on the actual seam and global strips |
| Accepted product defaults | Discrete hole centers, circular extent, diagram/save/open/SVG outputs, untwisted loops with open-strips-only reporting, grouped atomic edits, separate corner mode | User accepted on 2026-11-04; preserve alongside confirmed construction constraints |
| Research deliverables | Admissible angles, hole phases, continuation graph, compatible coloring catalogue | The agent must derive these; do not ask the user to supply the mathematics |

The upper-half count and replay corroborate the reconstruction under shared
assumptions; the script obtains its count and numbered endpoint annotations
from replay geometry, not an independent raster endpoint detector. Do not
describe all three checks
as fully independent measurements. The 18-track planar comparison assumes
the inferred six-strips-per-family population and comparable crop. The edge fit
fixes a line family, angular branch and radius-preserving model; its fitted
precision is not a confidence interval for the center or a uniqueness proof
among all possible maps. Absolute radial scale is not recoverable without
calibration. Likewise, whole-image occupied/empty pixel
agreement does not prove exact edge alignment, color compatibility, or physical
constructibility.

## Project goal and confirmed requirements

Prepare an interactive webpage for **one corner**, supporting both removal of a
wedge and insertion of extra angle. Support full madweave and hexweave. The
result must describe a coherent paper-strip construction, with a useful flat
representation, rather than merely an attractive collection of SVG paths.

The user's requirements are:

- Corresponding strip sections on identified edges must line up exactly and
  have the same color, because they continue as one physical strip.
- Branches, twists, and dangling/unmatched ends at a seam are physical
  construction errors and must be rejected, even if the preview looks plausible.
- The seam may be conceptual. Actual paper strips may continue across it without
  being cut or taped. Paper-sheet constructions may be taped together; taping
  every strip end is not mandatory.
- A single-color assignment permits at least all the angles permitted by a
  compatible multicolor assignment. Some arrangements of three distinct colors
  rule out angles that the uncolored/single-color weave permits.
- The user clarified the general madweave angle baseline: monochrome permits
  multiples of 60 degrees; particular patterns can require larger multiples,
  such as 120 degrees. Center/phase-specific compatibility describes how to
  realize that baseline, not a universal restriction to 120-degree increments.
  The 480- and 240-degree research fixtures are examples, not the allowed-angle
  list. For `tree.png` specifically, the recovered reference angle remains
  480 degrees with multiplier 3/4; 240 degrees is not an alternative image fit.
- The corner center is always over a hole, never inside a strip.
- In madweave, the permitted hole kind is the small hexagon.
- In hexweave, the hole kinds are the larger hexagons and the smaller triangles.
- The webpage must expose buttons/controls to select and control the supported
  choices; no essential choice may require editing source code.
- List methods for flattening the excess-angle case and start with the easiest
  intended method, using `tree.png` as the user's reference.

## First-release boundary and separate acceptance gates

The first release should produce a **complete flat angular-chart simulation**
with verified geometry, strip identities, crossing order, and compatible colors.
It should cover madweave's small-hexagon reference center and hexweave's large-
hexagon and triangle reference centers, including distinct phases/orientations
when they affect compatibility. Build the small madweave fixture first, then
extend the validated model to the other centers.

Use monochrome and three-distinct-material-color examples as mandatory cases.
Classify the existing five color formulas for the supported settings; expose
only configurations with established compatibility. Other palette counts and
custom patterns can use the same validator, but their support must be stated
rather than inferred from the planar editor's buttons.

Include editable save/open and static diagram export. Preserve the existing
planar editor. Dimensioned cutting templates, PDF export, alternative flattenings,
and a 3D/physical relaxation solver are separate additions requiring their own
acceptance criteria. This scope does not postpone the paper-construction
constraints: correct reference dimensions and seam registration must be retained
in the model even when the first output is a distorted diagram.

**Confirmed acceptance policy (2026-11-04):** diagram-release acceptance is
separate from physical-validation acceptance. The diagram release must pass the
geometry, strip-continuation, color, crossing-order, and persistence checks and
clearly state that physical constructibility remains unverified. A documented
physical example is required before claiming physical validation or releasing
fabrication-ready outputs. Such outputs also need the applicable stock,
dimension, scale, and tolerance checks; one example does not validate every
configuration in the catalogue.

This separation preserves every confirmed construction constraint in the model,
including exact full-ribbon continuation, material-color continuity, an uncovered
center, and rejection of branches, twists, and unmatched seam ends. It does not
authorize implementation. The user subsequently accepted the recommended release
outputs, center selection, loop policy, and grouped atomic edits. The control inventory below applies to supported features;
listing an optional output is not a commitment to implement it in the first release.

## The tree reference and flattening methods

![User-supplied reference for the easiest flattening](../tree.png)

The [reference analysis](TREE_REFERENCE_ANALYSIS.md) recovers the center and
multiplier by three checks: inverse geometry of a single long gray edge, an
upper-half count of 24 strip ends versus the planar reference's 18, and replay
of the oldest renderer at eight different multipliers. Its original palette
matches the PNG exactly. The close replay uses f=3/4, radius unchanged, and a
-90-degree display rotation. Historical `directionsPerCircle=6` gives N=8;
today's value 3 gives N=4 for the same multiplier. Do not confuse those counts.

The user warned that some strips are missing. Use the tree as a reference for
the flattening, not as an already completed corner. The long vertical gap below
the center and the incomplete lower tracks must not be mistaken for a finished
seam or a different kind of hole. Resolve the full construction through explicit
sector assembly and strip identity, not by copying the PNG's omissions.

The bands are curved **in the angular chart**. This does not by itself mean
that actual paper must be cut into those curved shapes. Keep the diagram and
any physical/net interpretation separate.

| Method to evaluate | What is flat | Important distinction | Planned priority |
|---|---|---|---|
| **Tree method: radius-preserving angular map** `(r,theta) -> (r,f*theta)` | A 2D angular chart; reference example f=3/4 | Reproduces the tree; changes the reference metric, so it is not automatically a 1:1 cutting template | **First: the easiest method requested by the user** |
| Conformal power map, e.g. w=z^f on the unwrapped domain | A 2D chart, locally angle-preserving away from the center | Radius also changes as r^f; scale must be made dimensionally explicit; widths/lengths change | Optional later comparison |
| Cut/open development or separate flat sector panels | Individual reference pieces | Can preserve reference dimensions; excess sectors may overlap in a common view and need separate panel IDs; the corner may be unjoined in this view | Useful fabrication/reference output |
| Flat-folded or layered construction | Paper pieces in overlapping planar layers, if a valid fold exists | Requires an actual fold/layer plan, front/back handling, and seam validation; not a single nonoverlapping drawing | Later, only if requested |
| Project a chosen 3D excess-angle surface onto the page | Its projection | Requires an additional 3D shape choice; projected widths/overlaps differ from physical ones | Last; not needed for the initial flat approach |

For the first completed excess-angle fixture, the proposed unit bookkeeping is
four ordinary 120-degree reference sectors, each mapped to 90 degrees:

```text
reference beta = 4 * 120 = 480 degrees
paperAngleFraction = 4/3
angularMultiplier / legacy coneFraction = 3/4
output closure = 4 * 90 = 360 degrees
```

This is a proposed **future complete fixture**, distinct from the partial
historical replay. Supply a sector ledger with unwrapped angular intervals,
reference-to-sector transforms, material membership and local piece IDs including
sector and connected-piece indices. Two pieces with the same planar `(d,s)` in
different excess sectors are distinct occurrences until an explicit boundary
join identifies them. Clipping one ribbon can yield several connected pieces.
Enumerate all three internal boundaries and the closing boundary for this
four-sector fixture, with complete interval pairings, transported phases and
intentional outer endpoints. Prove coverage once per sector interior and no
extra material duplication; angular closure alone does not prove completion.
If the candidate fails, deliver a concrete witness; a successful replacement is
not required. If unresolved, report Unvalidated with explicit limits. Any proposed
replacement needs review; do not force success or silently change the reference interpretation.
Every strip edge, local-order mask, outline, and picking
coordinate must use the same sector/branch map. Include exact endpoints and
bounded curve approximation as required by the earlier mapping contract. Do
not carry over its unvalidated six-direction inverse-picking shortcut or rely
on one mutable angular branch shared by unrelated paths.

Do not present these methods as physically interchangeable. A continuous
unstrained sheet cannot simply acquire excess intrinsic angle and simultaneously
become a single nonoverlapping planar sheet with its boundary identification
unchanged. That restriction must not be misapplied to a weave with holes or to
an explicitly deformed drawing. No 3D equilibrium solver is required initially.

## Hole centers and model coordinates

Identify actual holes from the material geometry of the chosen weave. A
transparent fill, a hidden display layer, or white pixels do not establish a
physical hole. Keep physical weave membership separate from display visibility.
Classify the hole kind in the reference weave; a flattening can change its
drawn shape without changing that identity. The chosen center must still remain
uncovered in the proposed constructed layout.
Inserting/removing sectors can also change the number of incident strip pieces
and the central opening's boundary, beyond merely curving its edges. Record that
defect opening separately; do not silently require it to remain a regular
six-sided hole just because the reference center was a small hexagon.

Record the selected hole kind, its location/phase, the relevant hexweave class,
and its orientation where these matter. Determine whether upward/downward
triangles or other apparently identical holes have different order/color phases.
Use the chosen hole as the coordinate origin; do not assume the current SVG
origin or the legacy C/star flags already select it correctly.

The accepted default is the geometric symmetry center of the selected hole,
with positive clearance from every material strip. Arbitrary interior points are
deferred and must not be silently treated as equivalent symmetry centers.
Revalidate the hole after changing spacing, weave type, or
construction settings. Derive a certified positive clearance to the entire
material boundary, not just to centerlines; exact contact is not a valid center.
Handle collapsed/merged holes explicitly.

## Exact seam matching and physical strip identity

Define an explicit registration between the identified boundary sides in
reference coordinates. Compare all material intersections along the complete
construction boundary, not just a few centerline samples or the top visible
pixel. Include gaps, full strip-width intervals, cut angles/directions, hidden
underpasses, and crossing order. Compare directions after the appropriate seam
registration, not in unrelated pre-join coordinate frames.

Create a global strip-continuation graph. Local strip pieces joined by the
identification represent one strip even if their direction/class names or
sector indices differ. Preserve this identity across the last-to-first boundary
and every internal panel/sector boundary. A conceptual seam does not introduce
a physical break, extra crossing, or new color boundary.

Keep mathematical equality separate from numerical tolerances and manufacturing
tolerances. Use exact/discrete relationships where available and publish bounds
for approximated curves. Printer/cutting error must not excuse a geometrically
incorrect seam. Check finite strip ends and the actual chosen outer boundary.
State whether a compatibility result is proven for a periodic pattern or only
certified for the specific finite template.

### Topology, orientation, and a precise seam contract

Use the material **ribbon**, not just its centerline, as the object being joined.
For each boundary interval, record its reference position/range, the adjoining
strip-piece ID, which ribbon side is which, material color, and local crossing
context. Match it bijectively to a partner interval in the registered frame.
A seam cannot split one continuation into two, assign multiple partners to one
band end, duplicate material, reverse one side accidentally, or leave an unpaired
interior end. Joining two matching local pieces into one global strip is the
intended operation.

The assembled centerline graph must have degree two at ordinary internal
continuations and degree one only at intentional outer free ends. A geometric
crossing is an over/under relation, **not** a vertex joining the crossing strips.
If identified pieces make a strip cross another part of itself, retain the two
distinct local material positions at that crossing even though the global strip
ID is the same. Classify such cases explicitly; collapsing them by global ID can
erase a real crossing or invent a junction.
Report open ribbons and closed loops explicitly, including any orientation
reversal around a loop. Each finite connected centerline component must be a
path with exactly two intentional outer ends or a cycle with none; disconnected
pieces must not inherit a shared identity merely from equal source labels.
Carry ordered ribbon sides and a material face through each join. Checking only
loop orientation parity detects a Moebius join but does not exclude an inserted
full twist: the chart must specify untwisted local transport throughout. Any
later physical realization must verify that transport, not infer absence of
twist from an orientable graph alone. The accepted material model permits
ordinary untwisted closed loops and open strips. Report open-strips-only
compatibility separately for every certified finite construction; loop closure
and assembly methods remain part of the physical-validation gate.
Rejection of branches, twists/Moebius continuations, and dangling seam ends is
an explicit user requirement, independent of the choice about closed loops.

Check both band boundaries and the tangent/cross-section after seam registration.
Numerical proximity between unrelated centerlines is not an identity rule. Any
intentional joint kink, change of width, reflection, or front/back flip must be
specified as a different construction, rather than accepted as an approximate
match. A twisted continuation is an error in this project, not an optional
joint style. Compare over/under order at the **same local crossing** on the two sides.
Do not require one global stack order: legitimate woven strips can participate
in cyclic above/below relations at different locations. Conversely, simultaneous
positive-area overlaps require a consistent local stack: A above B above C above
A at the same location is invalid, even though pairwise antisymmetry holds.
Enumerate crossing events by local material positions, and record their order
along each joined ribbon, including the last-to-first event for loops. Transport
the source weave's crossing sequence/phase across joins and reject unexplained
order switches within a connected overlap. Do not impose universal over/under
alternation: derive the actual sequence from the selected weave. These necessary
checks do not alone prove collision-free realization with finite-thickness stock.

Distinguish two controls that are often called "the seam":

- **Construction cut/phase:** changes which reference material is removed or
  inserted relative to the weave and may change compatibility.
- **Display branch cut:** changes where a fixed identified model is opened for
  coordinates/inspection. Moving this cut must preserve material, colors, global
  strip identity, and crossings, apart from a declared view transformation.

If a proposed seam control changes the construction, label it as a construction
edit. A coordinate/branch change must not repaint strips or introduce a new
physical corner. Carry each sector's direction/class/color phase explicitly;
copying the literal H/R/L or a/b/c labels into every sector is not sufficient.

### Finite extent and the meaning of an allowed angle

The accepted first extent is a circular crop of radius R around the selected
hole, with enough underlying periodic strip material to cover it before clipping.
Any other boundary needs an explicit policy. Separate intentional outer strip
ends from missing material caused by reusing a too-small legacy strip array.
Do not crop away a bad seam or interpret odd/even finite-array artifacts as
universal restrictions on the infinite weave. A crop cuts material and creates
new endpoints; distinguish finite component identity from its periodic ancestor.
For periodic extensions use signed integer strip indices and Euclidean residues
`mod3(s) = ((s % 3) + 3) % 3`, with `s0 = 3*n + c`, `0 <= c < 3`.
The current `getCFromS0` uses JavaScript remainder and is only safe for its
nonnegative array inputs. Extend all color/group formulas consistently, including
modulo colorCount; changing array size must not shift a fixed physical phase.

Stage 1 must state the admissible angle domain. Prefer an exact sector count or
rational multiple of pi, deriving beta, q, and f from one authoritative value.
Do not save rounded, independently mutable copies of all three. For excess
angle, keep the unwrapped sector index even when displayed angles repeat.
Require finite positive beta/f, positive strip width and extent, a valid pitch,
and an actual uncovered center. Reject inconsistent derived state instead of
retaining stale unit counts or angles. The legacy N parameter is derived
bookkeeping, not the authority for which physical angles are allowed.

Where possible, classify all admissible counts by their symmetry/phase periods,
then choose a practical finite UI range. If only a bounded search is available,
state its bound and do not claim a complete classification. Give each
classification's assumptions: center, construction phase, material
membership, order flags, stock model, crop/radius, and color transport. An
angle permitted by one symmetric-sector construction need not exhaust angles
permitted by other registrations. Finite feasibility may depend on radius;
state the certified radius/domain instead of reporting an angle alone.
Every result must have one of these statuses:

| Status | Meaning |
|---|---|
| Validated | Explicit evidence for the stated pattern, center, phase, coloring, and finite/periodic scope |
| Invalid | A concrete witness, such as an unmatched interval, wrong crossing, or color conflict |
| Unvalidated | Outside the proved/tested domain or unresolved numerical/assembly work |

These statuses describe the stated mathematical/model checks. Report physical
validation separately; a Validated diagram configuration is not thereby
physically validated.

Lack of a proof, an exhausted numerical subdivision budget, or a failed search
is not by itself a proof that an angle is impossible. Geometry and coloring must
be reported separately so that monochrome compatibility is a superset of any
fixed multicolor assignment's compatibility.

## Color compatibility controls the allowed angles

For a seam-induced continuation P, the material-color rule is

```text
color(P(s)) = color(s)
```

Every connected component of the strip-continuation graph must have one
consistent material color. When the continuation is a permutation, each cycle
must be monochromatic. This concerns every strip, including obscured sections,
not merely the visible color on the seam.

For example, if a candidate seam cyclically joins A to B, B to C, and C to A,
three different colors on A/B/C cannot satisfy the rule. One common color can
satisfy that color constraint. This is an illustrative permutation, not a claim
that any particular hole/angle produces it; that pairing must be derived.

Evaluate geometry/order compatibility first and color compatibility afterward:

```text
allowed(configuration, coloring)
    = geometrically/order-compatible configurations
      intersect color-compatible configurations
```

Single-color assignment removes the color restriction; it does not remove
geometric or weave-order restrictions. Three-color arrangements can retain or
break different seam symmetries. Derive and show that classification for the
selected hole, phase, hand, and orientation. Do not guess a universal list of
fractions from color count alone.

A useful first color comparison is now concrete. For the ordinary reference
center, the 480-degree identification is a 120-degree rotation modulo a turn.
The verified planar symmetry cycles H/R/L directions but preserves ordinary
a/b/c classes. Three distinct colors fixed to those reference directions
conflict with that rotation, while class coloring is a compatible-symmetry
candidate. State the
phase/transport convention used: deliberately changing colors between sectors
would be a different pattern and must not be described as the original fixed
direction coloring. Confirm both outcomes on the actual global continuation
graph; this deduction is not a
completed seam test. The three colors visible in the incomplete tree are not
proof that its direction coloring closes in a completed model. With C on, the
same origin-centered 120-degree rotation cycles a/b/c instead of fixing each
class: distinct fixed class colors then also conflict. This is a counterexample
to treating class coloring as universally compatible with 480 degrees.

Distinguish material colors from palette slots, direction names, and a/b/c
classes. Two slots can have the same color; three available colors do not prove
three distinct colors are used. In particular, class coloring on one isolated
hexweave can be effectively monochromatic despite a three-color palette.

Characterize the five existing pattern formulas and any permitted custom
coloring. A manual edit must act on the whole global strip, or be rejected as
incompatible. Recompute angle availability after a color/pattern change. Keep
invalid choices visible with a reason; do not silently recolor strips or change
the angle to disguise a conflict. Define how a user resolves an edit that would
invalidate the current configuration before implementing that interaction.

### Accepted edit behavior

Start with a valid-state-only interaction: evaluate a candidate construction or
color edit before committing it. If it would merge differently colored strips
or otherwise break the contract, keep the previous design, highlight the actual
conflict, and offer explicit compatible choices. Do not silently recolor,
discard painted state, change the angle, or save a supposedly valid template.
A separate invalid-draft mode can be designed later if the user wants one.

Allow grouped edits: validate the entire proposed set of parameter/color changes
as one transaction, then commit all or none. Individually invalid intermediate
settings must not prevent a valid combined change. Keep Invalid (with a witness)
distinct from Unvalidated (with explicit limits); neither becomes a certified
design by being saved or exported.

Apply paint/show/hide actions to a whole global strip when they are material
edits. View-only hiding must remain separate. Reuse neither the planar V button's
known show-and-recolor surprise nor its first-palette-click surprise as intended
behavior. Color equality must use declared material-color equivalence, not
palette-slot numbers; preview opacity is not evidence of absent paper.

## Webpage controls and outputs

Expose at least the following supported choices through labeled controls. Exact
layout is a later design task; the control inventory is part of acceptance.

| Control group | Required choices/actions |
|---|---|
| Weave | Madweave / hexweave; relevant a/b/c selection and material membership |
| Corner center | Valid hole kind and candidate location/orientation; visible marker; next/previous or equivalent selection |
| Corner angle | Remove / insert / planar; allowed angles/fractions; reference angle, signed deficit/excess, and code multiplier shown distinctly |
| Seam | Boundary placement/phase and orientation, paired-edge markers, show/hide identification |
| Colors | Single color / three colors / supported patterns and custom assignment; material palette and phase; explanation of disabled angles |
| Weave order | Supported hand/X/center-phase settings, with compatibility rechecked |
| Size | Strip width, gap/pitch, extent/radius and finite ends; physical units for fabrication outputs |
| Flat representation | Tree method first; any later supported methods clearly labeled; flat layout versus reference/net view |
| Inspection | Select/highlight a whole joined strip; show seam partners, strip IDs, crossing order, outlines, and compatibility report |
| View | Zoom, pan, fit/reset; help and current parameter summary |
| Persistence/output | Save/open editable project; export artwork and any dimensioned reference/cutting template; print/calibration controls if approved |

A view-only hide action must not silently remove physical material or create a
new allowed hole. Distinguish construction edits from inspection controls.
Display-only labels or diagnostic strip colors must not alter material coloring.
Controls need visible selection states, keyboard access, useful disabled reasons,
and reliable mouse/touch behavior. Preserve existing planar projects and the
existing offline save/open workflow. A new versioned state must save all choices
needed to reproduce the same corner, seam identity, and coloring. Define stable
IDs or an explicit ID correspondence across re-charting and reload; compare
component membership and crossing sequences, not only screenshots or array
lengths. Validate imports before replacing the design, recompute compatibility,
and reject unsupported/inconsistent state atomically. Version-1 planar files
retain their meaning; do not infer new physical membership from old view filters.

A flat visualization export and an undistorted fabrication/reference template
must be labeled separately. Do not print a distorted chart as a 1:1 paper guide
unless the selected construction actually calls for those curved shapes.

## Acceptance evidence required for diagram completion

The checks below govern diagram-release acceptance. Physical constructibility
must remain labeled unverified until the separate physical-validation gate is
met. Passing diagram checks does not authorize fabrication-ready outputs.

Keep structural/numerical checks separate from browser appearance. A monochrome
screenshot cannot establish over/under correctness, and a diagnostic color overlay
must not change the model's material-color compatibility.
The independent oracle must construct material occupancy, seam intervals and
crossing events from reference ribbons and registration, without importing the
renderer-generated pairing graph or masks as expected answers. Compare both
hidden and visible pieces. Reusing the source precedence rule is permitted but
must be disclosed; it is not an independent physical weaving theorem.

| Case | Required evidence |
|---|---|
| Planar f=1 | Geometry, color, visibility, crossing order, selection and saved state retain their existing meaning |
| Completed tree reference | Four 120-degree reference sectors at f=3/4 cover one turn, including the missing lower material; every internal and closing seam has partners |
| Wedge removal | At least one derived valid deficit example; beta=240 degrees/f=3/2 is an initial candidate, not an assumed theorem |
| Hole families | Madweave small hexagon; hexweave large hexagon and triangle; meaningful center phases/orientations distinguished; center never covered |
| Material identity | Each joined ribbon is a valid open strip or approved untwisted loop; no branches, false crossing vertices, dangling interior ends, or accidental side reversals |
| Colors | Same geometric fixture tested monochrome and with both a compatible three-color assignment and a witnessed incompatible assignment, where such assignments exist |
| Invariance | View rotation and moving a pure display branch cut preserve the physical model and identity; palette aliases and a monochrome reduction behave consistently |
| Finite boundaries | Free ends and seam intersections handled at the chosen crop; no dependence on omitted legacy strips masquerading as compatibility |
| Picking/editing | Both sides of a seam and its wrap pick the same global strip; clicking the center hole selects no strip; rejected edits preserve the prior state |
| Persistence/export | Reload offline and export preserve the completed model, parameters and material colors; diagram/template outputs are labeled accurately |
| Browsers and regressions | Chromium, Firefox and WebKit; existing planar and SVG-seam checks remain passing |

Include negative controls that deliberately omit a sector, duplicate seam
material, mismatch one band boundary, break one continuation color, reverse a
ribbon side, and change one crossing order. The appropriate validator must reject
each with a useful witness. Also swap two partners while preserving graph degree,
omit a hidden finite strip, use planar masks with mapped bands, and identify two
excess-sector occurrences by their repeated planar label. Each must fail the
relevant structural check even if the silhouette is unchanged. Require a valid
cycle of above/below relations at separate crossings to pass, while a cycle at
one simultaneous overlap fails. Test a valid open path, an untwisted loop if
approved, and a self-crossing represented by two distinct local positions;
these topology unit fixtures do not assert that every case occurs in the weave.

For numeric checks, start with the earlier contract's proposed curve tolerance
of stripWidth/1000 and projected error below 0.25 pixels; confirm these bounds
for the actual output scale. Analytic/discrete seam identities remain exact.
Use half-open angular ownership for picking and one shared exact seam boundary
for adjacent geometry. Test every boundary from both sides, the exact ray, and
the final wrap with nonzero center and display rotation. Retain the unwrapped
sector index through forward/inverse round trips. Picking must test full finite
band occupancy after inverse mapping; nearest-strip rounding alone incorrectly
selects gaps. Use a certified center-hole clearance, not an arbitrary apex epsilon
that could erase nearby real material. At crossings expose local occurrence and
global strip IDs with a deterministic selection policy.

Specify rounding, degenerate/collinear cases, and maximum-depth failure. Bound
curve error in display-world coordinates and then through the actual view matrix;
require both world and pixel limits at the tested zoom/export scale. Check the
masks, fills and outlines against the same map independently. Cases with an
uncertain bound are Unvalidated and cannot be saved/exported as certified.
Physical cutting/printing tolerance is a separate later parameter.

## Authorized research and later stages on hold

**Stage 0 — preparation accepted for Stage 1.** The user accepted the product
defaults and separate diagram/physical gates on 2026-11-04. This establishes
research readiness, not whole-project readiness or implementation authorization.

**Stage 1 — mathematical model and compatibility catalogue (delivered for review).**
Derive hole coordinates, the chosen flattening, boundary
registration, strip continuation, color constraints, and allowed angle classes.
Deliver a short model specification, a compatibility table with explicit scope,
example/rejection witnesses, and an acceptance-fixture list. Treat exact angle
classification as an agent research task, not a question for the user. Reconcile
the old cone contract with this model; do not begin by enabling its N=6 fixture.

State physical assumptions explicitly. Begin with ideal constant-width straight
reference ribbons, zero thickness for the diagram model, and the declared seam
transport; do not infer unstrained straight-stock realization from this abstraction.
Record bending, stretching, twist, joints and assembly assumptions when making
physical claims. Never silently substitute custom-cut stock for straight stock.
Stock-specific dimensions and tolerances remain prerequisites for fabrication.

Each scoped result may conclude Validated, Invalid with a concrete witness, or
Unvalidated with explicit mathematical/search/numerical limits. A successful
replacement is not required. A valid partial result must not be presented as a
completed assembly. Deliver all requested research categories and stop for review;
negative or unresolved results block dependent implementation, not honest reporting.

The [Stage 1 deliverable](SINGLE_CORNER_STAGE1.md) records constructive finite
certificates, phase/angle families, color witnesses and explicit limits. Its
research completion does not authorize Stage 2 or certify an application release.

**Stage 2 — separate visual prototype (authorized; delivered for review).**
The user authorized the [bounded prototype](SINGLE_CORNER_STAGE2.md), including
the completed f=3/4 reference example validated by Stage 1 (or
the explicitly reviewed replacement), and a derived wedge-removal example.
Include a valid single-color case and a
three-color conflict using the same geometric seam, plus a valid three-color
arrangement when one exists.
Check all identified edges, exact endpoints, widths and local order, and f=1
regression. Use an independent geometric/identity oracle, not only screenshots.

**Stage 3 — webpage and persistence.** Add the full approved control inventory,
global-strip editing, compatibility feedback, save/open/offline behavior, and
clearly separated output types. Test both weave types and all approved hole
families, multiple sizes/spacings/orientations, and Chromium/Firefox/WebKit.
Retain the existing seam-rendering fix; geometric seam correctness and SVG
antialiasing are separate issues.
**Stage 3A — portable certified diagrams (authorized; delivered for review).**
Only the existing nine-example catalogue receives versioned editable save/open,
self-contained offline reopening/resaving and static diagram SVG export.
See the [specific instruction](SINGLE_CORNER_STAGE3A_PROMPT.md) and
[delivery evidence](SINGLE_CORNER_STAGE3A.md). Preserve Stage 2 transactions and
the production planar application, including its separate version-1 project
meaning. The remaining Stage 3 inventory above is on hold. A Stage 3A pass is
not whole-project readiness, production release approval or physical validation.

Diagram release requires the applicable acceptance evidence above, user
documentation, and a worked diagram example. It does not depend on Stage 4,
but must clearly state that physical constructibility remains unverified.

**Stage 4 — separate physical-validation gate.** Review an agreed paper-strip
or sheet example with the user, record what was actually built and measured,
and compare it with the model. A documented physical example is required before
claiming physical validation or releasing fabrication-ready outputs; record the
scope actually checked and satisfy the applicable fabrication acceptance criteria.
Do not claim physical validation from a render or generalize one example to
untested configurations. This gate does not block the diagram release or relax
any confirmed construction constraint in its model.
A practical paper test may also be useful earlier, before committing to a map.

After the prompt is agreed, follow the scope of the user's start instruction.
Authorization for the whole project covers its agreed stages; continue without
repeated approval questions for routine work. If the user authorizes only one
stage, stop at its stated deliverable. Pause dependent work only for an actual
unresolved user decision or a specifically requested review gate. The initial
implementation hold remains in effect until the user explicitly authorizes
implementation. Later explicit instructions authorized the bounded Stage 2 and
Stage 3A prototypes only; they do not authorize full product integration.

## Decisions, ownership, and readiness

A complete prompt must define the problem and its acceptance criteria. It need
not contain the solutions to every mathematical problem assigned to Stage 1.
Keep unresolved research explicit, with a required deliverable and owner.

| Item | Owner / status | Proposed handling | Needed before |
|---|---|---|---|
| Tree center, map and reciprocal fractions | Recovered evidence | Near (218,228); code f=3/4, reference q=4/3; do not ask the user to rederive these | Already documented; reviewer may challenge the evidence |
| Diagram versus physical acceptance | Confirmed user decision, 2026-11-04 | Diagram release passes geometry, continuation, color, order and persistence checks and states physical constructibility is unverified; documented physical example required for physical-validation claims or fabrication-ready outputs; all confirmed construction constraints remain | Respective release/claim gates; no implementation authorization |
| Release outputs | Accepted default | Verified flat angular-chart simulation, editable save/open and diagram SVG; retain reference dimensions; no automatic cutting-template or 3D claim | Diagram-release acceptance |
| Reference-center selection | Accepted default | Discrete geometric symmetry centers of all specified hole kinds; distinct phases/orientations retained; arbitrary interior points deferred | Model and UI acceptance |
| Seam construction errors | Confirmed user requirement | Reject branches, twists and dangling/unmatched seam ends; enforce one-to-one full-ribbon continuation | Every validator and accepted construction |
| Closed loops | Accepted default | Allow untwisted loops and open strips; explicitly report open-strips-only compatibility; physical loop construction separately validated | Every finite compatibility result |
| Invalid and grouped edits | Accepted default | Validate a group of changes together; commit all or none, preserve prior design on failure, report conflict/uncertainty; invalid drafts deferred | Interaction acceptance |
| Infinite-pattern classification versus finite certificates | Agent research, with scope review | Derive phase/angle families where possible; otherwise publish the exact bound; propose a practical UI range | End of Stage 1 |
| All hole coordinates and distinct phases | Agent research | Derive from material geometry, including shifted/triangular centers; do not assume all are covered by the existing origin-centered symmetry test | End of Stage 1 |
| Material-color equivalence and patterns | Model/review task | Distinguish material labels from palette slots and actually used colors; require three distinct colors in the advertised three-color examples | End of Stage 1 |
| Extent and finite ends | Accepted modeling default | Circular crop with adequate underlying periodic material; record R and free ends explicitly | End of Stage 1 |
| Strip stock, physical dimensions and printable outputs | User decision for fabrication | Agree straight versus custom-cut stock, units, page size, scale checks, tolerances and optional tape allowances before output is called a construction template | Fabrication output / physical claims |
| Front/back, thickness, creases and layered flattening | Deferred mode-specific decisions | Define only if a folded/layered physical mode is selected; do not block the initial angular chart on an unrequested mode | That mode |
| Separate mode/page | Accepted product default | Preserve the planar editor; expose the corner tool as a separate mode/page | UI design |
| Additional flattenings and 3D relaxation | Deferred additions | List alternatives; implement the tree method first | Explicit later scope |

**Stage 1 readiness is approved. Whole-project readiness is not.** Stage 1 ends
with its scoped deliverables, statuses, witnesses and explicit limits for review.
Later implementation requires explicit authorization and sufficient validated
evidence for each dependent construction. Diagram release requires its own
acceptance checks; physical-validation claims and fabrication-ready outputs
require the separate physical gate. See the
[independent review record](SINGLE_CORNER_PROMPT_REVIEW.md) for applied
corrections and remaining decisions. The
[documentation-only review and improvement handoff](SINGLE_CORNER_REVIEW_PROMPT.md)
is prepared for that purpose.

## Read alongside this prompt

- [Tree reference analysis](TREE_REFERENCE_ANALYSIS.md): recovered center, inverse-edge fit, upper-half count, historical replay, and limits.
- [Planar model](PLANAR_MODEL.md): identities, colors, classes, and local order.
- [Symmetry](SYMMETRY.md): verified origin-centered cases; not a complete catalogue
  for all of the new hole centers.
- [Control reference](CONTROLS.md) and [testing](TESTING.md): current application
  behavior and regression baseline.
- [Earlier cone mapping contract](CONE_MAPPING_SPEC.md): reusable clipping,
  approximation, inverse-picking, and state requirements; its proposed first
  fixture/restrictions are not approval for the present project.
- [SVG seam fix](SVG_SEAM_FIX.md): preserve the verified rendering behavior.

This prompt's confirmed user requirements govern the single-corner project.
Earlier readiness statements refer to the planar baseline and do not authorize
starting this new project.
