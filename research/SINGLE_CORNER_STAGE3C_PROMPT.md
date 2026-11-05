# Stage 3C: integrate corner mode into the existing editor

Work in `/home/rharris/git/madweave` on branch `docs/single-corner-prompt`.
The reviewed Stage 3B baseline is `7ae5c06`. Inspect the working tree first;
preserve existing work and the planning changes that supplied this instruction.

## Subsequent user clarifications

The user's later instructions govern conflicting statements below:

- Color changes at seams are accepted diagram states with warnings, including
  vivid markers and hover/focus text. Retain the chosen colors and report that
  color continuity is not Validated; do not reject a palette-alias separation
  merely because it exposes a color conflict.
- Retain the existing palette opacity range in corner mode. Native SVG should
  perform compositing; verify complete ordered stacks, seam coverage and export
  in all three engines. The opaque-only restriction below is superseded.

Geometry, full-width material continuation, identity and local-order requirements
are unchanged. This does not authorize new geometry, physical-validation claims,
fabrication outputs, a master merge or deployment. The
[integration report](SINGLE_CORNER_INTEGRATION.md) records the implemented result.

## Product direction and scope

The user wants **one editor: the existing MadWeave application with a corner
mode and a small set of additional controls**. The research prototype supplies
the verified corner model and renderer. It is not intended to become a competing
editor with a second palette, painting workflow, save/open system and export UI.

This replaces the earlier proposed Stage 3C task of adding a standalone painting
interface. Reuse and adapt the base editor's controls and established behavior
where appropriate. Separate internal renderers/models are acceptable; duplicate
user-facing editors are not the goal.

When the user directs you to follow this prompt, implement this bounded
integration on the current branch. Changes to application code necessary for
integration are in scope. Do not merge into master, deploy, or claim physical
validation. Earlier research-stage prohibitions on application changes describe
those completed stages; they do not prohibit this explicitly authorized task.

Read:

- [Accepted project prompt](SINGLE_CORNER_PROJECT_PROMPT.md)
- [Base editor controls](CONTROLS.md)
- [Planar model](PLANAR_MODEL.md) and [SVG seam behavior](SVG_SEAM_FIX.md)
- [Stage 3B construction model and results](SINGLE_CORNER_STAGE3B.md)
- [Transaction and inspection requirements](SINGLE_CORNER_STAGE2_CORRECTIONS.md)
- [Offline projects](SINGLE_CORNER_STAGE3A.md) and [corner file format](CORNER_PROJECT_FORMAT.md)
- The actual editor entry point, `editor.js`, `project.js`, `madweave.js`, and
  the corner prototype's model, controls, file handling and tests.

## Integration design

First write a short control/behavior map in the integration report. For each
existing control, say whether corner mode reuses it, adapts it, or explicitly
marks it unavailable because the geometry/rendering is not supported yet.
Then implement that map; do not stop at a design proposal.

- Keep the existing editor entry point. Add an obvious Planar / Corner mode
  control and a compact corner-settings group. Only new concepts need new
  controls: reference angle, hole/center phase, supported crop preset, grouped
  Apply, and optional seam/continuation inspection. Reuse existing weave and
  coloring controls where their meanings match.
- Reuse the palette, strip selection/painting, outlines, and existing Save,
  Open and Export actions. Do not embed the entire research page with another
  full control panel inside the editor. Keep research certificates, exact
  indices and technical diagnostics in an optional inspection area.
- Preserve planar behavior and old planar files. Changing modes must preserve
  unsaved work in both modes, including colors and selections. Switching back
  must restore the corresponding design; it must not reconstruct defaults.
- Do not present mode switching as a proven conversion of an arbitrary edited
  planar design into a corner. Use an explicit supported corner setup unless
  an exact material/color correspondence is established. Preserve the planar
  design and explain that limitation. Automatic arbitrary planar-to-corner
  conversion is outside this stage.
- Limit corner geometry to the existing 84 constructions, 60°–720° range,
  W/P=3/4, center phases and crop presets. Keep the 24 witnessed phase failures
  and 108 out-of-scope crop/phase entries distinguishable. Never silently change
  angle, center, color, extent or order to make a selection pass.
- Existing planar size, spacing, color-count, C/hand/X and visibility controls
  do not automatically acquire certified corner meanings. Map only supported
  choices. Clearly explain unavailable corner settings and restore their planar
  operation on returning to planar mode. Do not shrink the planar feature set.
- Keep arbitrary radius/spacing, extra geometric families, corner transparency
  and physical material removal out of scope. In particular, the opaque corner
  renderer cannot accept the base editor's opacity settings without additional
  compositing evidence. Make that mode restriction explicit, not a silent reset.

## Shared painting and color behavior

Adapt the base painting workflow to global corner-strip identity rather than
introducing a second mandatory select-then-paint workflow. Preserve keyboard
access and the ability to inspect/select hidden local positions.

- A corner paint action changes the entire joined physical strip, including
  hidden pieces, seam partners, fringe material and both positions at a
  self-crossing. It must not join crossing strips or change geometry/order.
- Use the existing opaque palette slots and color editing interface. Do not
  introduce a separate three-swatch palette merely because the prototype used
  three fixed colors. Formula choices/counts beyond those certified must be
  explicitly unavailable or separately validated; palette capacity alone does
  not establish a formula's compatibility.
- Keep formula coloring separate from manual/custom assignment. Painting begins
  from the current assignment and records custom colors by stable global-strip
  identity. Do not keep labeling a modified assignment as an unchanged formula.
- Material-color equality is not palette-slot equality. Declare canonical opaque
  color equivalence; identical colors in different slots can satisfy continuity.
  Recheck formula assignments after palette edits. Separating aliased colors
  can expose a seam conflict and must reject atomically with a witness.
- View-only hiding/inspection and diagnostic colors must not change physical
  membership or material compatibility. Do not carry the planar V button's
  known show-and-recolor surprise into corner mode as intended behavior.
- Preserve custom colors on view changes and mode switches. A construction
  change with no proven strip correspondence must explicitly propose replacement
  coloring and disclose the loss of custom assignments before grouped Apply.
  Do not silently transfer equal-looking IDs to unrelated new strips.
- All relevant edits, file reads and mode switches use the coherent candidate/
  commit and stale-request behavior already demonstrated by the prototype.
  Invalid, Unvalidated and failed operations preserve the active design.

## Shared persistence and export

- The existing Save action saves the active design as a self-contained editable
  project. A reopened file must enter the correct mode with its material model,
  colors, view and local-position selection intact. Define which inactive-mode
  state is persisted; mode switching within a session must preserve both designs.
- The existing Open action recognizes planar and corner projects and dispatches
  to the correct validator/model. Import ordinary planar v1 files and actual
  Stage 3A/3B corner files without changing their material meaning. Version new
  custom-color/mode state and document explicit migrations.
- Read only inert model data from imported files. Rebuild from trusted supported
  construction definitions; saved SVG, runtime and validation labels are not
  authorities. Failed imports must not switch modes or destroy either design.
- Offline saved files must support their documented editing, mode handling,
  resaving and export without network requests. No running research server or
  repository checkout may be required to reopen a saved design.
- The existing Export action exports the active design as static SVG. Keep
  corner annotation inclusion explicit and preserve the diagram/fabrication
  distinction. Planar export behavior must remain intact.

## Acceptance checks and evidence

1. Exercise the actual existing editor entry point and shared controls in
   Chromium, Firefox and WebKit. Demonstrate the integrated task from creating
   a corner through painting, inspection, saving, reopening and export. Do not
   validate only the old standalone prototype while claiming integration.
2. Keep the planar application and SVG-seam regressions passing, including
   translucent planar colors, old project files, all supported planar spacings,
   manual edits and offline save/open. Preserve all 84 corner certificates and
   existing reference/color evidence; do not change geometry to simplify UI work.
3. Test Planar → Corner → Planar and the reverse with unsaved manual colors and
   selections. Test active and inactive designs during failed edits/imports and
   stale asynchronous operations. Report exactly what is retained and saved.
4. Test corner painting across seams, on fringe-containing strips, hidden strips,
   and self-crossings. Verify complete component color assignment and unchanged
   geometry, identities and local order. Include custom three-color arrangements
   where the original fixed formulas conflict. Test palette aliases and a
   palette edit that breaks formula continuity.
5. Extend independent color checking to the supported palette/custom model.
   Exhaustively check component/color coverage and semantic round trips across
   the 84 constructions. Distinguish this from representative browser sampling;
   retain the original fixed-palette results and actual wrong-visible-paint test.
6. Open real legacy planar and corner files through the shared Open control.
   Save/reopen/resave offline in each mode, including custom corner painting
   and self-crossing selection. Validate failed imports and mode changes atomically.
7. Render plain/annotated corner SVG independently of the editor and compare its
   material colors, geometry, seams and crossing order against the reference.
   Preserve bounds, numerical-failure behavior and importer/file-size limits.
8. Make the integrated drawing, palette and core controls usable together at
   desktop and narrow widths. New corner settings should be compact and labeled
   in familiar terms; detailed phase coordinates and certificate data should not
   dominate ordinary editing. Record screenshots and keyboard/pointer workflows.

## Deliverables, commit and stopping point

Deliver the integrated editor on this branch, shared-control/state adapters,
versioned persistence and migration, tests, a worked offline corner project and
SVG, plus `research/SINGLE_CORNER_INTEGRATION.md` documenting the control map,
mode/identity behavior, unsupported controls, verification and remaining scope.
Update the accepted project prompt and user documentation to match the result.

After implementation and verification:

1. Review the final diff, generated assets, documentation links and working tree.
2. Stage only the intended integration, tests, evidence and documentation,
   including the relevant planning documents. Preserve unrelated work.
3. Commit the completed work and push `docs/single-corner-prompt`.
4. Report the commit, integrated-editor viewing instructions, evidence and limits.

Stop for user review before merging into master or deploying. Integration into
the base editor on this branch is the authorized implementation; the Git merge
is a separate action. Physical constructibility remains unverified, and physical
validation/fabrication remains a separate gate. Do not reopen the tree-image
investigation or expand geometry as part of this task.
