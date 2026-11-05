# Astra task: review and improve the actual single-corner work prompt

Use this request with GPT-6 Astra or another independent mathematical/code
reviewer. **This is a documentation task: improve the prompt for the actual
work. Do not start implementing the single-corner project.**

## Request to the reviewer

Review and improve `research/SINGLE_CORNER_PROJECT_PROMPT.md` in this repository. Find
mathematical errors, ambiguous requirements, unsupported conclusions, missing
physical constraints, and acceptance tests that could falsely pass. Be willing
to challenge the existing analysis. Apply supported corrections and useful
clarifications to the actual work prompt. Preserve a separate review record
explaining what changed and why. General approval or stylistic rewriting is not
sufficient for this task. Simplify repetition where possible without losing
requirements, mathematical distinctions, acceptance criteria, or the staged plan.

Use branch `docs/single-corner-prompt` and record the commit you reviewed.
The repository is `/home/rharris/git/madweave`. Inspect the working tree first,
preserve unrelated changes, and do not switch to or merge into `master`.
If you do not have repository access, request the listed files/images and state
what you could not inspect. Do not claim to verify unavailable source or images.

Read these first:

1. [Current project prompt](SINGLE_CORNER_PROJECT_PROMPT.md).
2. [Tree reference](../tree.png) and [forensic analysis](TREE_REFERENCE_ANALYSIS.md).
3. [Planar model](PLANAR_MODEL.md) and [rotational symmetry](SYMMETRY.md).
4. [`madweave.js`](../madweave.js), especially angular setup,
   `transformPointToPath`, `getSForPoint`, strip/class/color identities,
   `isCoveredBy`, `maskPath`, and `buildStripsInternal`.
5. [Earlier cone contract](CONE_MAPPING_SPEC.md), which is subordinate to the
   newer user requirements; identify conflicts rather than adopting its N=6
   fixture automatically.

Consult [controls](CONTROLS.md), [tests](TESTING.md), [SVG seam fix](SVG_SEAM_FIX.md),
[`project.js`](../project.js), and the existing tests as needed. Do not require
reading every historical notebook entry before forming findings.

## Confirmed intent to preserve

- One corner, with both wedge removal and extra angle.
- Madweave reference centers over small hexagonal holes; hexweave centers over
  large hexagons or small triangles. The center is never inside a material strip.
- Identified boundaries continue the same physical strips with exact alignment
  and the same material color, including hidden sections.
- Branches, twists and dangling/unmatched ends at the seam are physical
  construction errors to reject.
- The seam can be conceptual; continuous actual strips need not be cut or taped.
- Monochrome removes color restrictions. Some three-color arrangements exclude
  angles that the uncolored/monochrome geometry permits.
- The first flattening follows `tree.png`; all supported choices need webpage
  controls. The project remains on hold until the prompt is agreed and the user
  explicitly authorizes implementation.

## Questions to audit

1. **Angle convention and metric.** Check the distinction between reference
   angle beta, paper fraction q=beta/(2*pi), signed deficit, and the existing
   angular multiplier f=1/q. Is the 480-degree / q=4/3 / code f=3/4 explanation
   correct under its stated full-turn convention? Do not confuse historical
   `directionsPerCircle=6` with the current value 3. Check what this chart does
   and does not establish about real unstrained paper strips.
2. **Tree evidence.** Assess the recovered center near (218,228), long-edge
   inverse fit, upper-half count, and historical replay. Check dependence on
   registration, unwrapping, fixed model assumptions, missing lower tracks,
   raster thresholds, and endpoint labels derived from replay. Distinguish
   agreement/corroboration from independent evidence or a physical proof.
3. **A complete corner.** Is four 120-degree reference units, mapped to four
   90-degree display units, a sound first candidate? What specifically must be
   supplied beyond the partial tree to complete it? Could copying units
   duplicate strips, change their identities, or leave unmatched boundary bands?
4. **Hole and angle classification.** Does origin-centered planar symmetry
   establish enough for displaced/triangular/hexweave centers? What must be
   derived for other phases, finite crops and periodic extensions? Can allowed
   angles be classified by phase periods without mistaking a bounded search
   or finite-array asymmetry for impossibility?
5. **Ribbon topology and registration.** Is the seam contract sufficient to
   exclude branches, twists, ribbon-side reversal, width/direction mismatch,
   and interior dangling ends? Does it correctly keep a crossing separate from
   a physical junction, including two positions of the same global strip at a
   self-crossing? Which loop or endpoint cases remain underspecified?
6. **Color feasibility.** Check the connected-component/permutation rule and
   the conditional claim about direction coloring versus a/b/c class coloring
   for 480 degrees. Identify its center, phase, transport and material-color
   assumptions. Does a local rotational symmetry imply the required global
   continuation compatibility, or is more proof needed? Give a counterexample
   if a conclusion is too strong.
7. **Crossing order.** Can local over/under order be transported consistently
   across every boundary without requiring an invalid global above/below order?
   Is any physical woven-sequence condition missing from the proposed oracle?
8. **Coordinates and numerical checks.** Audit unwrapped indices, branch-cut
   ownership, the first/last wrap, inverse picking, center-hole no-selection,
   exact endpoints, approximation bounds and failure handling. Could the
   validator accept a picture whose masks and material bands use different maps?
9. **Product behavior and scope.** Identify user decisions still needed about
   diagram versus fabrication outputs, closed loops, center selection and
   invalid edits. Keep them distinct from mathematical work the agent should do.
   Check state round trips, view-only versus material edits, and display-cut
   changes versus construction-phase changes.
10. **Acceptance tests.** Propose the smallest convincing positive and negative
    fixture set. State how it would catch incomplete sectors, wrong strip
    partners, color conflicts, twists, incorrect local order, missing finite
    material, and errors hidden by monochrome rendering or screenshot metrics.

## Required deliverables

1. **Improve the actual work prompt in place:**
   `research/SINGLE_CORNER_PROJECT_PROMPT.md`. Keep the angle-convention outline
   near the beginning, preserve confirmed user requirements, and keep proposed
   defaults and unresolved research clearly labeled. Do not invent user approval
   or remove the implementation hold.
2. **Write a review record:** `research/SINGLE_CORNER_PROMPT_REVIEW.md`, containing
   the items below. Separate corrections actually applied from concerns still
   awaiting evidence or a user decision.
3. **Commit and push the documentation changes** on
   `docs/single-corner-prompt`. Report the commit, principal improvements, and
   the few remaining decisions that need the user. Do not merge the branch.

The review record must contain:

- **Readiness recommendation:** ready for user approval of the specified first
  stage, or not ready, with reasons. This is not permission to start work.
- **Findings by severity:** each with the exact claim/section, evidence or
  counterexample, consequence, and a minimal suggested correction. Mark
  unverified concerns as such.
- **Necessary user decisions:** ask only for intent or product choices that
  cannot reasonably be derived from the code/mathematics. Recommend defaults.
- **Agent research tasks:** unknown results with explicit deliverables; do not
  turn these into requests for the user to solve the geometry.
- **Minimum acceptance fixtures** and any scope that should be deferred.
- **Applied prompt amendments:** concise descriptions of corrections and their
  evidence, preserving confirmed requirements and identifying changes to
  proposed defaults. List unapplied proposals separately.

## Scope and verification

Edit only the actual work prompt, the new review record, and `research/README.md`
if its links or status need updating. Do not change application code, tests,
forensic scripts, project-state formats, repository settings, or deployment.
Existing forensic scripts may be reproduced in disposable contexts with outputs
under ignored `research/output/`; that is not authorization to build a new cone
feature. Verify local Markdown links and the final diff before committing only
the intended documentation files.

Preserve the following distinction: this task authorizes improving the prompt,
not the implementation described by that prompt. The user will bring the revised
prompt and review back for discussion. End with a short, self-contained handoff;
do not continue into the actual project after committing the documentation.
