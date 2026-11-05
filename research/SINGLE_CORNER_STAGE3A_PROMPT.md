# Stage 3A: portable editable corner diagrams

Work in `/home/rharris/git/madweave` on branch `docs/single-corner-prompt`.
The reviewed Stage 2 baseline is `ac9cdc3`. Inspect the working tree first and
preserve existing work. If Stage 3A work has already started, review and complete
it rather than resetting or restarting it.

## Authorized scope

Implement **Stage 3A only: editable save/open, offline reopening, and static SVG
export for the existing nine certified constructions**. Preserve the corrected
transaction behavior and the production planar application.

Read:

- [Accepted project prompt](SINGLE_CORNER_PROJECT_PROMPT.md)
- [Stage 1 model](SINGLE_CORNER_STAGE1.md)
- [Circular-crop follow-up](SINGLE_CORNER_CROP_FOLLOWUP.md)
- [Stage 2 prototype](SINGLE_CORNER_STAGE2.md)
- [Stage 2 corrections](SINGLE_CORNER_STAGE2_CORRECTIONS.md)

This stage makes the certified diagrams portable and verifies that material
identity, coloring, and crossing information survive saving and reopening.
It does not authorize the rest of Stage 3.

## Deliverables

1. Document and implement a versioned corner-project state covering the supported
   construction, material coloring, view settings, and selection/local-position
   identity. Store authoritative model state; rendered SVG and a saved
   “Validated” flag are not validation authorities. Identify the construction
   version so future changes cannot silently reinterpret saved strip identities.
2. Provide save and open controls, with self-contained editable files that reopen
   and resave offline without a running server or network requests. Preserve all
   supported editing and inspection behavior within the fixed catalogue.
3. Validate imports before replacing the active design. Unsupported versions,
   inconsistent parameters, invalid identities, malformed files, and incompatible
   coloring must preserve the current design and explain the rejection. Retain
   the corrected handling of failed and overlapping operations.
4. Export static SVG with correct geometry, material colors, local order, and all
   required definitions. Clearly distinguish artwork from editable projects and
   fabrication templates. Make inclusion of inspection annotations explicit;
   annotations must not change material coloring or identity.
5. Document the state format, supported scope, viewing instructions, and a worked
   save/open/resave/export example. Record verification and remaining limitations.

## Acceptance checks

- Exercise save/open/resave for all nine examples, compatible coloring choices,
  and representative view and selection states.
- Compare material components, seam partners, crossing positions/order, and
  colors—not screenshots alone. Include radius-6 fringe material and both local
  positions at self-crossings. Permit ID renaming only with an explicit verified
  correspondence.
- Reopen saved editable files with network access disabled. Verify editing,
  inspection, resaving, and exporting still work without the repository server.
- Exercise failed imports and overlapping operations through actual controls.
  Confirm the model, drawing, active controls, selection, and status stay coherent.
- Render exported SVG independently in Chromium, Firefox, and WebKit. Compare
  against reference geometry and material-color probes, including seam regions,
  gaps, and selected annotated/unannotated exports. Static artwork must not depend
  on application scripts or external assets.
- Keep the existing prototype checks and appropriate planar regressions passing.
  Existing version-1 planar projects must retain their meaning; do not silently
  reinterpret them as corner projects.

## Limits and stopping point

The nine examples are a finite prototype catalogue, **not the eventual allowed-
angle list**. Preserve the general monochrome madweave baseline of multiples of
60 degrees, with pattern-specific restrictions. Unsupported radii and
degeneracies remain explicitly Unvalidated.

Diagram-release acceptance and physical validation remain separate gates.
Physical constructibility remains unverified. The tree-image investigation is
finished: its reference angle is 480 degrees with angular multiplier 3/4.

Do not add arbitrary construction editing, new angle/radius families, fabrication
outputs, production integration, or deployment. Do not reopen the tree
investigation or merge into master.

Stop after the Stage 3A deliverables and verification. Finish with viewing and
offline-use instructions, test results, and remaining limitations for review
before expanding Stage 3.
