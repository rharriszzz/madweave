# Stage 3B: bounded angle and hole-center controls

Work in `/home/rharris/git/madweave` on branch `docs/single-corner-prompt`.
The Stage 3A baseline is `d483557`. Inspect the working tree and preserve any
existing work; do not reset or restart work already in progress.

## Purpose and authorized scope

Replace dependence on nine named examples with controls for choosing a
construction within a **bounded, independently validated family**. Users should
be able to choose the weave, required hole kind/center phase, reference angle,
and supported coloring, see why combinations are unavailable, and save/reopen
the result offline.

This instruction authorizes Stage 3B only. It does not authorize a general
arbitrary-geometry editor, physical validation, production integration,
deployment, or merging into master. Keep the separate prototype and existing
planar editor intact.

Read:

- [Accepted project prompt](SINGLE_CORNER_PROJECT_PROMPT.md)
- [Stage 1 model and symmetry families](SINGLE_CORNER_STAGE1.md)
- [Circular-crop model and checker](SINGLE_CORNER_CROP_FOLLOWUP.md)
- [Stage 2 prototype](SINGLE_CORNER_STAGE2.md)
- [Stage 2 transaction and inspection corrections](SINGLE_CORNER_STAGE2_CORRECTIONS.md)
- [Stage 3A portable diagrams](SINGLE_CORNER_STAGE3A.md)
- [Current corner project format](CORNER_PROJECT_FORMAT.md)

The reason for this step is practical: saving the nine examples now works, but
users still cannot select the project's main construction choices independently.
Build on the established symmetry families rather than reopen the tree fit or
seek an exhaustive classification of every possible seam registration.

## Bounded construction domain

- Use positive reference angles beta from **60 through 720 degrees, in
  60-degree steps**, as this stage's practical UI range. It is not a mathematical
  upper limit or the final product range. Derive q, f and signed deficit from
  beta; show reference angle and deficit/excess distinctly.
- Preserve the general monochrome madweave 60-degree baseline. A particular
  center/order phase can have a larger increment. Offer explicitly identified
  compatible phases; never silently move the center or change order/color to
  make an angle pass.
- Support madweave small-hexagon centers and hexweave large-hexagon and both
  triangle orientations, using representative phases from the established
  catalogue. Include the ordinary madweave phase, a demonstrated sixfold phase,
  and the existing C-on color contrast. Record the exact center, membership and
  C/hand/X settings for every offered phase. The new controls need not enumerate
  every equivalent lattice location or expose arbitrary order flags.
- Keep W/P=3/4. Use explicitly identified supported circular-crop presets from
  the existing evidence. Preserve the radius-6 excess example with fringe
  material. Do not introduce a continuous radius/spacing slider. Show the crop
  preset in the candidate summary; a construction change must not conceal a
  change of extent.
- Support monochrome and the existing five formula-based three-label color
  assignments. Report actually used distinct colors and material-color
  conflicts separately from geometry/order restrictions. Per-strip painting,
  palette/opacity editing and new pattern languages remain deferred.

First produce a machine-readable compatibility matrix for this finite domain.
Classify combinations as Validated, Invalid with a concrete witness, or
Unvalidated with a specific limit. Do not force a successful result or confuse a
checker size limit with a mathematical impossibility. Extend bounds such as the
checker's sector-count limit only with explicit reasoning and tests.

## Deliverables

1. **Validated construction generation.** Generalize the existing reference
   construction pipeline within the domain above, with full material regions,
   complete boundary joins, global strip identities, local crossing positions
   and order, color compatibility, and open-strips-only reporting. Check each
   newly offered configuration with the independent checker. Build-time
   generation is acceptable; a new browser proof engine is not required.
2. **Independent controls and grouped changes.** Provide labeled weave,
   hole/phase, angle, supported crop-preset and coloring choices rather than
   requiring selection of a named example. Keep examples as optional shortcuts.
   Stage a complete candidate and apply it atomically. Users must be able to
   change angle, phase and coloring together even if an intermediate combination
   would fail. Show the proposed configuration, its status and a specific reason
   before applying it. A rejected or stale attempt preserves the active model,
   drawing, controls and status coherently.
3. **Portable state compatibility.** Save, reopen, resave and export every
   supported construction offline. Version the catalogue/state as needed.
   Existing Stage 3A files must open in the new prototype with unchanged material
   identity, coloring and crossing selection, through retained trusted data or
   an explicit tested migration. Never reinterpret an old ID or validation flag.
4. **Identity policy for construction edits.** Preserve identity across view-only
   changes. When a construction changes, establish an explicit correspondence
   where justified; otherwise clear selection and explain that the construction
   changed. Do not attach an old selected-strip key to unrelated new material.
5. **Evidence and a worked example.** Document the precise domain, compatibility
   matrix, witnesses, model/file versions, numerical limits and reproduction
   steps. Demonstrate choosing a new angle/phase/color combination, saving it,
   reopening offline and exporting an independently checked diagram.

## Acceptance checks

- Independently certify the complete finite set of combinations advertised as
  Validated. Retain all original nine constructions and their evidence.
- Exercise angles absent from the old example menu, including beta=60, 180,
  420, 600 and 720 wherever supported by the selected center/phase. For required
  cases that remain Unvalidated, supply the exact blocker and do not advertise
  them as implemented. Such limits must be called out in the handoff.
- Test both deficit and excess, all required hole families/orientations,
  sixfold versus threefold phases, compatible three-color cases, witnessed
  color conflicts, and monochrome removing only the color restriction.
- Verify full-width hidden material, crop fringes, every internal and closing
  boundary, exact rays/final wrap, empty-hole picking, and two distinct material
  positions at a self-crossing. Preserve the local-order and actual-paint
  negative controls. Unsupported crops must never lose material to pass.
- Test real-control grouped changes, rejected changes, redraw failures and stale
  completion/error races. Include a valid combined change that would fail if
  its constituent edits were applied separately.
- Test semantic state round trips for all advertised constructions and supported
  color assignments. Reopen legacy Stage 3A examples, including the worked
  self-crossing file. Verify offline operation with zero HTTP(S) requests and
  exports rendered independently of application code.
- Run Chromium, Firefox and WebKit checks, including representative largest-angle
  and largest-material cases, plus existing transaction/import and appropriate
  planar regressions. Test the expanded reference matrix exhaustively in the
  independent checker; disclose any browser sampling separately.
- Record bundle/save-file sizes and representative load/redraw times. Confirm
  that files the app saves fit its own import limits, and that large supported
  cases stay within declared subdivision bounds. Do not silently weaken
  geometric tolerances to accommodate a larger angle or file.

## Boundaries and stopping point

The tree investigation is finished: tree.png uses the radius-preserving map
with f=3/4 and beta=480 degrees. The new choices are construction configurations,
not alternative image fits.

Physical constructibility remains unverified. Preserve separate diagram-release
and physical-validation gates, and the prohibition on silently substituting
custom-cut stock. Do not add fabrication outputs, arbitrary interior centers,
non-symmetry seam searches, new flattenings, arbitrary crop shapes, or a 3D solver.

Stop after the bounded construction controls, compatible offline state/export,
tests and evidence are complete. Report what can now be chosen, any unresolved
matrix entries, and the remaining requirements before full diagram release.
Do not proceed automatically to per-strip painting, broader geometry, deployment
or merging.
