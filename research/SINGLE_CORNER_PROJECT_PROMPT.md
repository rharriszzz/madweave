# Single-corner project: prompt for later work

**Status: preparation only; not yet an implementation authorization.**
The user wants this prompt to contain the necessary details before the project
starts. Do not enable nonunit `coneFraction`, modify the renderer, build the new
UI, or run cone experiments merely because this document exists. Resolve the
remaining questions, update this prompt, and wait for an explicit instruction
to start the agreed stage. Reading code, studying the supplied reference, and
clarifying the mathematical model are part of preparing this prompt.

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

For a nonradial/tree-style display, do not infer beta from its apparent angle
on screen. Preserve beta, delta, and the reference seam identification as model
parameters, then define the display map separately. The relationship above is
the derivation for a full-turn uniform angular chart; the project's selected
flattening must state whether it uses that chart or a different map.

## Project goal and confirmed requirements

Prepare an interactive webpage for **one corner**, supporting both removal of a
wedge and insertion of extra angle. Support full madweave and hexweave. The
result must describe a coherent paper-strip construction, with a useful flat
representation, rather than merely an attractive collection of SVG paths.

The user's requirements are:

- Corresponding strip sections on identified edges must line up exactly and
  have the same color, because they continue as one physical strip.
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

## The tree reference and flattening methods

![User-supplied reference for the easiest flattening](../tree.png)

The image shows interlaced colored bands with curved portions and changing
orientations/openings, including a trunk-like lower region and a broader upper
region. It is the reference for the first flattening method. Its generating
parameters and map have not been recovered from the repository. It was already
present in the initial historical import; its appearance alone does not identify
an exact transformation, corner location, or physical fabrication method.

**Pending clarification:** locate the intended corner/hole in the image and
confirm how its flat curved bands relate to actual paper strips. Do not replace
this reference with an assumed uniform angular rescaling or an unrelated folded
model. Once clarified, put the precise tree construction first in this table.

| Method to evaluate | What is flat | Important distinction | Planned priority |
|---|---|---|---|
| Tree-style layout: curved/rearranged bands and changed openings, if confirmed | The displayed strip layout; possibly the actual strip shapes | Must establish the intended construction, strip widths, and identity/seam map | First, following the user's reference |
| Uniform angular rescaling with unwrapped sectors | A complete 2D angular chart | Simplest existing code idea, but changes the reference metric; not automatically the tree method or a cut template | Comparison after the tree method |
| Conformal power map, e.g. w=z^f on the unwrapped domain | A 2D chart, locally angle-preserving away from the center | Radius also changes as r^f; scale must be made dimensionally explicit; widths/lengths change | Optional later comparison |
| Cut/open development or separate flat sector panels | Individual reference pieces | Can preserve reference dimensions; excess sectors may overlap in a common view and need separate panel IDs; the corner may be unjoined in this view | Useful fabrication/reference output |
| Flat-folded or layered construction | Paper pieces in overlapping planar layers, if a valid fold exists | Requires an actual fold/layer plan, front/back handling, and seam validation; not a single nonoverlapping drawing | Later, only if requested |
| Project a chosen 3D excess-angle surface onto the page | Its projection | Requires an additional 3D shape choice; projected widths/overlaps differ from physical ones | Last; not needed for the initial flat approach |

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

## Recommended sequence: several stages, with an initial hold

**Stage 0 — finish and approve this prompt.** Resolve the outstanding decisions
below, especially the tree construction. Set the status to ready only when the
user agrees the specification is sufficiently complete. No project implementation
or nonunit renderer experiment during this stage.

**Stage 1 — mathematical model and compatibility catalogue.** After explicit
authorization, derive hole coordinates, the chosen flattening, boundary
registration, strip continuation, color constraints, and allowed angle classes.
Deliver examples and rejection witnesses. Reconcile the old cone contract with
this model; do not begin by enabling its N=6 fixture.

**Stage 2 — one small, independently checked construction.** After the model is
reviewed, implement the simplest agreed tree-style example and a wedge-removal
example. Include a valid single-color case and a three-color conflict using the
same geometric seam, plus a valid three-color arrangement when one exists.
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

Do not automatically start the next stage just because its predecessor's
artifacts exist; follow the user's explicit project-start and staging instructions.

## Decisions to settle and useful additions

| Priority | Decision / suggested addition | Proposed handling |
|---|---|---|
| Blocking | Exact interpretation of `tree.png`, corner location, and intended flat strip construction | Ask the user; then specify the first flattening map and its physical meaning |
| Blocking | Whether strips must be straight constant-width stock, may be cut as curved constant-width shapes, or are only represented by distorted shapes | Clarify; this determines whether the flat output is a fabrication guide or a diagram |
| Blocking | Scope of angles and whether compatibility is required for an infinite periodic weave or the chosen finite model | Derive admissible families; agree a bounded first UI range and label the certificate's scope |
| Before implementation | Geometric center of a hole versus any point in a hole | Recommend discrete valid symmetry centers first; obtain agreement |
| Before implementation | Exactly three distinct used material colors versus an available three-slot palette | Expose the distinction; agree which presets are required |
| Before implementation | Behavior when a color/angle edit breaks an existing valid design | Recommend an explicit conflict report and reversible resolution, with no silent changes |
| Before fabrication output | Physical dimensions, paper size, strip width, cutting/printing tolerances, and margin/calibration requirements | Agree units and at least one practical example; propose a scale-check ruler |
| Before fabrication output | Tape/butt-joint/overlap allowances where actual joints are used | Keep separate from the ideal identification; optional for continuous woven strips |
| Before folded/layered modes | Front/back colors, layer order, thickness, allowable creases and overlap | Specify only if such a mode is chosen; do not make it a prerequisite for the tree approach |
| Scope proposal | New page/mode versus replacement of the planar editor | Recommend a separate single-corner mode/page while preserving planar behavior |
| Scope proposal | Mandatory 3D view or physical relaxation solver | Defer; begin with the agreed flat representation and exact seam/identity checks |
| Quality addition | Reproducible example state, compatibility report, seam labels, and assembly directions | Save with the worked example so another person can reconstruct it |

## Read alongside this prompt

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
