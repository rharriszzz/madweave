# Independent single-corner prompt review

Reviewed on 2026-11-04 at commit
`1243c858e3684c29cd1351a529eed486b57c553c`, on
`docs/single-corner-prompt`. The tracked working tree was clean. This review
changes only documentation; project implementation remains on hold.

## Readiness recommendation

**Ready for user approval of Stage 1, the mathematical model and compatibility
catalogue, with the revised scope below. Not yet ready for implementation or a
claim of physical constructibility.** The prompt can assign unresolved geometry
to research without presupposing its answers. Four 120-degree sectors at f=3/4
are a well-defined candidate, not an established complete woven corner. Stage 1
must produce either a certificate or a failure witness before Stage 2 uses it.
The release defaults still need user agreement. This recommendation grants no
authorization; the existing explicit start requirement remains in force.

## Inspection and reproduced evidence

Read the project/review prompts, planar model, symmetry report, tree report,
earlier cone contract, controls, testing and SVG seam report. Inspected the
actual `tree.png`, `madweave.js` angular setup, mapping, indexing, colors,
`getSForPoint`, `isCoveredBy`, `maskPath`, `buildStripsInternal`, and `project.js`
validation/capture/apply. Inspected the symmetry/angular test oracles and both
tree forensic scripts. The visible tree has a small opening near (218,228),
curved trunk edges and an incomplete lower arrangement; it is not a seam proof.

Independently checked the reciprocal convention and metrics: imposing
`f*beta=2*pi` gives q=4/3, f=3/4, beta=480 degrees and delta=-120 degrees.
The circular-cone comparison has induced metric `dr²+r²*dtheta²` for q<=1;
its projected radius is q*r. The tree chart instead has circumferential scale
f. Neither the chart nor failure of the circular-cone formula for q>1 proves
physical feasibility/impossibility of a woven network. No correction to these
formulas was needed. Current D=3 and historical D=6 are correctly distinguished.
The old N=6/D=3 fixture is 720 degrees and its integer-N>=3 restriction excludes
all deficits; it cannot govern this project's angle catalogue.

Executed existing checks (outputs in ignored `research/output/`):

- `node research/symmetry.test.cjs`: passed 768 cases, 383,616 pair comparisons
  and 5,280 visible-top comparisons. Scope is origin-centered planar symmetry.
- `node research/angular-baseline.test.cjs`: passed 15 intersections, 428 clipped
  segments and 5,184 picks, with f=1 throughout. This confirms characterization
  of legacy limitations, not any completed nonunit assembly.
- `python3 research/tree-reference-analysis.py`: reproduced the 136-point edge
  fit f=0.7498585755, RMS 0.10657 pixels; freeing the center gives pixel-index
  (220.5096,226.9113), f=0.75098414. The fixed center is pixel-index
  (217.5,227.5), corresponding to screen coordinates (218,228). Its endpoint
  input comes from replay; the script's count is not independent raster evidence.

- Historical `tree-reference-render.cjs`: all eight candidates rerun successfully
  with Playwright 1.58.2, pngjs 7.0.0 and Chromium 145.0.7632.6. At f=3/4,
  mean RGB error was 0.80219994 and occupied/empty agreement 99.592311%; replay
  generated 24 upper endpoint occurrences. This independently reproduces the
  reported computation, not an independent physical certificate.

Installed Node dependencies only under `/tmp/madweave-review-deps`. The browser
installer did not support this host's Ubuntu 26.04 directly; an attempted 24.04
fallback download was stopped after locating the existing pinned executable.
Ran the unchanged script with a disposable Node launch override selecting
`/tmp/madweave-chrome-pinned/chrome-linux64/chrome`. No repository dependency or
script changes were needed. The Python fit was then rerun with fresh replay data.

No new cone feature or test implementation was created, and the full application
suite was not rerun for this documentation-only change. All 35 relative Markdown
links in the three edited documents resolve; `git diff --check` passes.

## Findings by severity

Each finding names the reviewed section/claim, evidence, consequence, and the
minimal correction applied. These are specification defects or limits, not
claims that the unimplemented project already exhibits those failures.

### High — certificate and oracle gaps

1. **“The tree reference and flattening methods” / four units complete a turn.**
   `4*120*(3/4)=360` proves chart closure only. Reusing `(d,s)` as identity in
   sector 0 and sector 3 can merge distinct material occurrences before any
   seam is joined; degree checks may still pass. The old renderer does not
   assemble `numberOfUnits` at all. Require a sector/piece ledger, all three
   internal joins plus the closing join, complete interval coverage and explicit
   finite endpoints. Make Stage 2 conditional on Stage 1 validating the candidate.

2. **“Topology, orientation, and a precise seam contract” / degree-two graph.**
   Swapping two same-colored seam partners preserves degrees and component
   colors but can connect the wrong radial bands. A crop may split a periodic
   ribbon into disconnected finite components. Require registered full-band
   bijections, distinct connected-piece IDs and path/cycle endpoint counts;
   add partner-swap and repeated-source-ID negative fixtures. Crossing positions
   remain separate even when they belong to one global strip.

3. **Same section / no global above-below order.** This correct prohibition
   needs its converse: A>B, B>C, C>A at the *same* positive-area overlap is
   impossible despite pairwise antisymmetry. Separate crossings can legitimately
   have that cycle. `maskPath` selects local permutations and the planar model
   admits finite-width triple overlaps. Require local stack consistency, event
   order along each ribbon, seam phase continuity and no unexplained order
   reversal inside a connected overlap. Universal over/under alternation is
   neither established nor imposed. These checks are necessary, not a proof of
   collision-free finite-thickness realization.

4. **Same section / “including any orientation reversal around a loop.”**
   Orientability alone does not exclude a full twist: two half twists restore
   side parity. Require ordered sides/material face and untwisted local transport,
   with physical verification of that transport before a fabrication claim.
   This preserves the user's prohibition on twists; it does not add a twist mode.

5. **“Acceptance evidence” / independent oracle and numeric checks.** An oracle
   reading renderer-generated masks/pairings can agree with the same wrong map.
   `getSForPoint` rounds to a nearest strip without checking full band occupancy;
   a gap can therefore have a candidate index. Require independently constructed
   reference occupancy/intervals, full finite-band picking, exact-ray and wrap
   checks, nonzero center/rotation cases and common map checks for masks and
   bands. A monochrome screenshot cannot substitute for these tests.

### Medium — classification, evidence and persistence

6. **“Finite extent” / enough underlying periodic material.** Existing class
   code uses JavaScript `%`; for s0=-1 it returns c=-1, while Euclidean division
   requires n=-1, c=2. Extending arrays to negative indices without adapting
   class/color arithmetic silently corrupts phases. Specify signed indices,
   Euclidean residues, consistent group/color formulas and phase stability under
   resizing. This is a future-extension requirement, not an application fix.

7. **“Derive the connection to a paper sector” / choose a symmetry unit.** A
   whole-pattern rotational symmetry supports a construction but is not a proof
   that every other finite seam registration is impossible. Conversely, a
   smaller crop can conceal unmatched material outside its radius. Require
   exact center/phase/order/membership/color/radius assumptions and distinguish
   a sufficient symmetry family from an exhaustive classification. Bounded
   searches remain bounded; unknown results remain Unvalidated.

8. **“Evidence and authority” / upper-half count and recovered map.** The Python
   count is `len(caps['upper'])`; Node generates those caps from f=3/4 replay.
   The 18 comparison tracks assume the inferred base size. Fixed-registration
   raster agreement includes background and uses threshold 245; it does not
   measure ribbon pairing or lower completion. The edge fit fixes the map family,
   angular branch and line direction, with correlated center/scale assumptions.
   Qualify the count as model-assisted corroboration and the reconstruction as
   strong evidence, not three independent measurements or a unique inverse
   solution. Retain the intended tree method and recovered fraction.

9. **“Color compatibility” / direction versus class colors at 480 degrees.**
   Correct conditionally: at the ordinary origin a 120-degree rotation maps
   `(d,s)` to `(d+1,s)` and preserves c=s mod 3. Fixed distinct direction colors
   conflict; class colors pass that symmetry condition. Counterexample to an
   unconditional class-color claim: with C on, the same rotation cycles classes
   `[a,b,c] -> [c,a,b]`, so distinct class colors conflict too. Even the ordinary
   result does not prove finite assembly, crossing sequences or selected
   material membership. The prompt already states this condition and requires
   the continuation graph; preserved it and added the C-on counterexample and
   explicit sector phase/occurrence bookkeeping. No compatible completed three-color fixture is claimed here.

10. **“Webpage controls and outputs” / save all choices.** `project.js` version 1
    validates planar arrays of `9*baseSize` and imports before applying state.
    Its visibility is not a new physical-membership model. A screenshot round
    trip could hide ID changes or lost crossing phase. Require stable IDs or an
    explicit correspondence, graph/sequence round trips, atomic invalid import
    rejection and no conversion of legacy view filters into physical removal.

### Remaining unverified concerns

No complete 480-degree seam graph, displaced/triangle-hole classification,
closed-loop occurrence catalogue or physical stock realization was established
by this review. These are explicit Stage 1/physical-check deliverables, not
reasons to tell the user a candidate is impossible. Local seam alignment cannot
alone certify unstrained straight-stock realization, finite-thickness clearance,
assembly order or mechanical stability. The first chart must state those limits.

## Necessary user decisions (recommended defaults)

These are intent choices; none asks the user to solve the geometry.

1. **Release outputs and physical scope:** accept the proposed first release of
   a verified angular diagram, editable save/open and static SVG, with reference
   dimensions retained. Defer dimensioned cutting templates and 3D solvers.
   Agree a representative paper check before claiming physical validation;
   straight/custom-cut stock, units and tolerances must be chosen before that check.
2. **Center selection:** use discrete symmetry centers of the required hole
   kinds first; defer arbitrary interior points. All required madweave/hexweave
   hole families remain in the intended release.
3. **Closed ribbons:** allow untwisted loops as well as open strips, but classify
   them explicitly. Their physical stock/join construction must be agreed before
   presenting them as buildable. If loops are unwanted, reject them in the model.
4. **Invalid edits:** reject atomically, preserve the previous design and show
   the actual conflict; defer invalid-draft editing. Never silently recolor or
   change the angle to repair a user's edit.

The circular crop and separate corner mode remain proposed modeling/product
defaults. No default was silently promoted to a confirmed requirement. The user
can authorize Stage 1 alone while reserving later release/product choices.

## Agent research tasks and deliverables

- Derive material-hole coordinates/clearances and distinct order/color phases,
  including both triangle orientations, using signed periodic indices. Deliver
  representative coordinates, equivalence arguments and witnesses for differences.
- Derive sector transforms, every boundary registration and full-ribbon pairing
  for the proposed 480-degree excess and 240-degree deficit candidates. Deliver
  ledgers, graphs, endpoint/crossing sequences and proofs or concrete rejections.
- Classify angles for the stated center, phase, crop and stock assumptions.
  Deliver exact families where justified, bounded search limits otherwise, and
  separate geometry/order/color statuses. Prove necessity before claiming an
  exhaustive exclusion based on rotational symmetry.
- Evaluate all five built-in color formulas, with explicit material-color
  equivalence and sector transport. Deliver compatible assignments and conflict
  cycles; count actually used distinct colors, not palette capacity.
- Specify the common forward/inverse map, numerical bounds and degeneracies,
  independent oracle inputs, persistence identity and physical evidence boundary.
  Deliver the Stage 2 fixtures below before UI implementation.

## Minimum convincing acceptance fixtures

Use a small number of base models with targeted mutations rather than a large
screenshot gallery. These are future requirements, not executed corner tests.

| Fixture | Required success or failure evidence |
|---|---|
| Planar f=1 through the new pipeline | Match material, local order, colors, visibility semantics and selection; version-1 import and offline round trip preserve meaning |
| Completed excess candidate | Four 120-degree units, all four boundaries, missing lower material supplied, occurrence IDs and finite outer ends; monochrome plus compatible and incompatible three-color variants where they exist |
| Derived deficit | At least one certified deficit, initially test beta=240/f=3/2; same interval, identity and order certificate as excess |
| Other hole families | One representative per inequivalent required phase/orientation, or a proof transporting a checked representative; signed-index translation and different crop radii catch accidental finite-array assumptions |
| Ribbon/stack unit fixtures | Open path and approved untwisted loop pass; self-crossing keeps two positions; separate-location above/below cycle passes; simultaneous local cycle, side reversal, inserted twist and interior end fail |
| Mutations of excess model | Missing sector, duplicate material, repeated-source-ID merge, wrong partner with unchanged degrees, one width/direction mismatch, hidden missing finite band, material-color conflict and wrong local order each fail with a location/ID witness |
| Map and interaction mutations | Planar masks with mapped strips fail; exact rays, both sides, final wrap, nonzero center/rotation and center/gap clicks pass; depth exhaustion remains Unvalidated; diagnostic colors do not affect material validation |
| State and view invariants | Re-charting, zoom and palette aliases preserve graph/colors; physical phase edits revalidate; failed edit/import preserves prior state; round trip preserves components and crossing sequences |

Retain the existing three-browser planar/SVG-seam regressions for implementation.
Defer other flattenings, 3D relaxation, automatic fabrication templates and broad
custom-stock modeling. Do not defer full hidden-material matching or required
hole families merely because a first screenshot looks convincing.

## Applied amendments and unapplied proposals

Applied the sector ledger and conditional Stage 2 gate; clarified symmetry versus
classification; added signed-index arithmetic, ribbon transport and finite
component rules; strengthened local stack/sequence checks, independent oracles,
picking/accuracy failures and state invariance. Qualified forensic independence.
Retained the angle outline, user requirements, four-sector candidate, conditional
color analysis, staged plan and implementation hold. Added the review link to
the research guide.

No new product default was adopted. Unapplied proposals are the user-owned
choices above and mathematical results awaiting Stage 1 evidence. No application,
test, forensic script, state format, repository setting or deployment was changed.

## Subsequent user clarification — 2026-11-04

After the review, the user confirmed separate diagram-release and
physical-validation acceptance gates. The project prompt now records this
decision: a diagram release must pass geometry, strip-continuation, color,
crossing-order, and persistence checks and clearly state that physical
constructibility remains unverified. A documented physical example is required
before claiming physical validation or releasing fabrication-ready outputs.
The example's scope and any additional fabrication checks must be explicit.

All confirmed construction constraints remain in the model. This clarification
does not authorize implementation or adopt the remaining proposed defaults for
outputs, center selection, loops, or invalid edits. It supersedes any implication
above that a physical example must precede the diagram release; the review's
other evidence and unresolved mathematical deliverables are unchanged.

## Subsequent acceptance and Stage 1 authorization — 2026-11-04

The user then accepted the recommended product defaults: diagram/save/open/SVG
outputs, discrete required hole centers, untwisted loops with explicit
open-strips-only compatibility reporting, and grouped atomic edits. Circular
extent and a separate corner mode remain the accepted defaults. The separate
diagram and physical gates remain in force.

Stage 1 mathematical research is now authorized; whole-project readiness and
implementation are not. Its scoped results may be Validated, Invalid with a
witness, or Unvalidated with explicit limits. It need not find a successful
replacement for a failed candidate. Physical assumptions must be stated, and
custom-cut stock must never silently replace straight stock. The authorized work
ends at the model, hole/phase catalogue, seam/continuation evidence, compatibility
results and acceptance-fixture plan for review.

The forensic Python comment and report key were corrected from an independent/
observed count to a model-assisted `replayEndpointOccurrences` count. Its
computation is unchanged. These subsequent instructions supersede the earlier
pending-decision and preparation-only status statements in this historical review.

## Stage 1 handoff — 2026-11-04

The authorized [Stage 1 research deliverable](SINGLE_CORNER_STAGE1.md) now
contains the scoped model, hole/phase catalogue, finite seam and continuation
certificates, color conflicts, and acceptance-fixture plan. It separates newly
established reference-model results from remaining crop, implementation and
physical uncertainties. This supersedes the earlier absence of finite corner
evidence only within those explicit scopes. Work stops at the deliverable for
review; implementation and merging remain unauthorized.
