# Single-corner project: prompt for later work

**Status: preparation only; not yet an implementation authorization.**
The user wants this prompt to contain the necessary details before the project
starts. Do not enable nonunit cone mode in the production application, modify
its renderer, or build the new UI merely because this document exists. Resolve
the remaining decisions and wait for an explicit instruction to start the
agreed stage. The user separately authorized image measurements and disposable
historical-renderer trials to understand `tree.png`; those forensic checks are
preparation, not the start of the corner feature.

**Recovered reference:** `tree.png` uses the radius-preserving angular map with
**code multiplier `coneFraction=3/4`**, corresponding to **paper/reference-angle
fraction 4/3**, or 480 degrees with 120 degrees of excess. Its center is the
small white opening near **pixel (218,228)**, directly above the central gap
between the gray and teal trunk strips. A long-edge inverse fit gives 0.74986;
the upper-half track count gives 18/24=3/4; and the historical replay matches
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
Choose alpha from a symmetry valid for the selected hole, over/under pattern,
and coloring. The old 60/120-degree unit bookkeeping is not a universal answer.

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
| Proposed defaults | Symmetry-center selection, circular extent, behavior on invalid edits, first-release scope below | Obtain agreement before treating them as requirements |
| Research deliverables | Admissible angles, hole phases, continuation graph, compatible coloring catalogue | The agent must derive these; do not ask the user to supply the mathematics |

The upper-half count and replay are complementary checks; numbered endpoint
annotations were placed using replay geometry. Do not describe all three checks
as fully independent measurements. Likewise, whole-image occupied/empty pixel
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
- The corner center is always over a hole, never inside a strip.
- In madweave, the permitted hole kind is the small hexagon.
- In hexweave, the hole kinds are the larger hexagons and the smaller triangles.
- The webpage must expose buttons/controls to select and control the supported
  choices; no essential choice may require editing source code.
- List methods for flattening the excess-angle case and start with the easiest
  intended method, using `tree.png` as the user's reference.

## Proposed first-release boundary

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

This is a proposed release boundary, awaiting the user's agreement. The control
inventory below applies to supported features; listing an optional output is not
a commitment to implement it in the first release.

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
historical replay. Every strip edge, local-order mask, outline, and picking
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

The proposed default is the geometric symmetry center of the selected hole,
with positive clearance from every material strip. Confirm whether arbitrary
points inside a hole are needed; they must not be silently treated as equivalent
symmetry centers. Revalidate the hole after changing spacing, weave type, or
construction settings. Handle collapsed/merged holes explicitly.

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
reversal around a loop. The proposed material model permits ordinary untwisted
closed loops and open strips; confirm that loop policy before implementation.
Rejection of branches, twists/Moebius continuations, and dangling seam ends is
an explicit user requirement, independent of the choice about closed loops.

Check both band boundaries and the tangent/cross-section after seam registration.
Numerical proximity between unrelated centerlines is not an identity rule. Any
intentional joint kink, change of width, reflection, or front/back flip must be
specified as a different construction, rather than accepted as an approximate
match. A twisted continuation is an error in this project, not an optional
joint style. Compare over/under order at the **same local crossing** on the two sides.
Do not require one global stack order: legitimate woven strips can participate
in cyclic above/below relations at different locations.

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

The proposed first extent is a circular crop of radius R around the selected
hole, with enough underlying periodic strip material to cover it before clipping.
Any other boundary needs an explicit policy. Separate intentional outer strip
ends from missing material caused by reusing a too-small legacy strip array.
Do not crop away a bad seam or interpret odd/even finite-array artifacts as
universal restrictions on the infinite weave.

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
state its bound and do not claim a complete classification. Every result must
have one of these statuses:

| Status | Meaning |
|---|---|
| Validated | Explicit evidence for the stated pattern, center, phase, coloring, and finite/periodic scope |
| Invalid | A concrete witness, such as an unmatched interval, wrong crossing, or color conflict |
| Unvalidated | Outside the proved/tested domain or unresolved numerical/assembly work |

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
proof that its direction coloring closes in a completed model.

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

### Proposed edit behavior

Start with a valid-state-only interaction: evaluate a candidate construction or
color edit before committing it. If it would merge differently colored strips
or otherwise break the contract, keep the previous design, highlight the actual
conflict, and offer explicit compatible choices. Do not silently recolor,
discard painted state, change the angle, or save a supposedly valid template.
A separate invalid-draft mode can be designed later if the user wants one.

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
needed to reproduce the same corner, seam identity, and coloring.

A flat visualization export and an undistorted fabrication/reference template
must be labeled separately. Do not print a distorted chart as a 1:1 paper guide
unless the selected construction actually calls for those curved shapes.

## Acceptance evidence required for completion

Keep structural/numerical checks separate from browser appearance. A monochrome
screenshot cannot establish over/under correctness, and a diagnostic color overlay
must not change the model's material-color compatibility.

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
each with a useful witness. Do not require a global above/below DAG or reject
legitimate woven cycles at different crossings.

For numeric checks, start with the earlier contract's proposed curve tolerance
of stripWidth/1000 and projected error below 0.25 pixels; confirm these bounds
for the actual output scale. Analytic/discrete seam identities remain exact.
Specify rounding, seam ownership, degenerate/collinear cases, and maximum-depth
failure. Physical cutting/printing tolerance is a separate later parameter.

## Recommended sequence: several stages, with an initial hold

**Stage 0 — finish and approve this prompt.** Resolve the outstanding decisions
below; the tree's center and angular mapping have now been recovered. Set the
status to ready only when the user agrees the specification is sufficiently
complete. No project implementation during this stage. The explicitly authorized
historical/image forensics are recorded separately and do not enable cone mode
in the production app.

**Stage 1 — mathematical model and compatibility catalogue.** After explicit
authorization, derive hole coordinates, the chosen flattening, boundary
registration, strip continuation, color constraints, and allowed angle classes.
Deliver a short model specification, a compatibility table with explicit scope,
example/rejection witnesses, and an acceptance-fixture list. Treat exact angle
classification as an agent research task, not a question for the user. Reconcile
the old cone contract with this model; do not begin by enabling its N=6 fixture.

**Stage 2 — one small, independently checked construction.** After the model is
reviewed, implement a **completed** tree-style f=3/4 example with the bookkeeping
above, and a wedge-removal example. Include a valid single-color case and a
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

**Stage 4 — physical check and completion record.** Review an agreed paper-strip
or sheet example with the user, record what was actually built and measured,
and compare it with the model. Do not claim physical validation from a render.
Finish user documentation and a worked construction example before release.
A practical paper test may also be useful earlier, before committing to a map.

After the prompt is agreed, follow the scope of the user's start instruction.
Authorization for the whole project covers its agreed stages; continue without
repeated approval questions for routine work. If the user authorizes only one
stage, stop at its stated deliverable. Pause dependent work only for an actual
unresolved user decision or a specifically requested review gate. The initial
implementation hold remains in effect until the user explicitly starts work.

## Decisions, ownership, and readiness

A complete prompt must define the problem and its acceptance criteria. It need
not contain the solutions to every mathematical problem assigned to Stage 1.
Keep unresolved research explicit, with a required deliverable and owner.

| Item | Owner / status | Proposed handling | Needed before |
|---|---|---|---|
| Tree center, map and reciprocal fractions | Recovered evidence | Near (218,228); code f=3/4, reference q=4/3; do not ask the user to rederive these | Already documented; reviewer may challenge the evidence |
| Release outputs and physical scope | User decision | First release: verified flat angular-chart simulation, editable save/open and diagram SVG; retain reference dimensions; no automatic cutting-template or 3D claim | Finalizing first-release scope |
| Reference-center selection | User decision | Discrete geometric symmetry centers of the specified hole kinds first; arbitrary interior points deferred | Finalizing first-release scope |
| Seam construction errors | Confirmed user requirement | Reject branches, twists and dangling/unmatched seam ends; enforce one-to-one full-ribbon continuation | Every validator and accepted construction |
| Closed loops and edits | User decision | Proposal: allow untwisted closed strips as well as open strips; reject incompatible edits atomically with an explanation | Finalizing first-release behavior |
| Infinite-pattern classification versus finite certificates | Agent research, with scope review | Derive phase/angle families where possible; otherwise publish the exact bound; propose a practical UI range | End of Stage 1 |
| All hole coordinates and distinct phases | Agent research | Derive from material geometry, including shifted/triangular centers; do not assume all are covered by the existing origin-centered symmetry test | End of Stage 1 |
| Material-color equivalence and patterns | Model/review task | Distinguish material labels from palette slots and actually used colors; require three distinct colors in the advertised three-color examples | End of Stage 1 |
| Extent and finite ends | Proposed modeling default | Circular crop with adequate underlying periodic material; record R and free ends explicitly | End of Stage 1 |
| Strip stock, physical dimensions and printable outputs | User decision for fabrication | Agree straight versus custom-cut stock, units, page size, scale checks, tolerances and optional tape allowances before output is called a construction template | Fabrication output / physical claims |
| Front/back, thickness, creases and layered flattening | Deferred mode-specific decisions | Define only if a folded/layered physical mode is selected; do not block the initial angular chart on an unrequested mode | That mode |
| Separate mode/page | Proposed product default | Preserve the planar editor; expose the corner tool as a separate mode/page | UI design |
| Additional flattenings and 3D relaxation | Deferred additions | List alternatives; implement the tree method first | Explicit later scope |

Before marking this prompt **ready**, resolve the user-owned first-release rows,
record accepted/rejected defaults, and ensure every remaining research item has
a deliverable and acceptance test. Do not silently convert a proposal into a
confirmed user requirement. A second mathematical review is recommended; its
findings must be checked against source/evidence before integration. The
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
