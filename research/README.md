# MadWeave research guide

The project has four connected goals: explain every control, explain the planar
hexweave and madweave construction, make those explanations testable, and finish
the preparation for `coneFraction`. The planar preparation and SVG seam fix
have been merged into `master`. The single-corner research prototype led to the bounded Stage 3C corner mode
in the shared editor.
The rest of Stage 3 remains on hold and the production application's
`coneFraction` remains 1.

## Reading paths

| Level | Read | Purpose |
|---|---|---|
| Using the app | [User guide](../guide.html) | Make, edit, save, and reopen a design |
| Every control | [Control reference](CONTROLS.md) | Labels, internal IDs, effects, resets, and verified surprises |
| How the weave works | [Planar model](PLANAR_MODEL.md) | Physical strips, hexweave classes, center changes, geometry, and local layering |
| Symmetry | [Rotational symmetry](SYMMETRY.md) | Geometry, crossing order, hexweave labels, and palette distinctions |
| Boundary rendering | [Boundary and Firefox comparison](BOUNDARY_RENDERING.md) | Finite ends, mask sides, and the known clipping artifact |
| Source of faint seams | [SVG reduction and root cause](SEAM_ROOT_CAUSE.md) | Minimal fixture, repeated alpha blending, and versioned renderer source |
| Fix for faint seams | [Problem and solution](SVG_SEAM_FIX.md) | Compositing structure, rejected candidates, verification, and compatibility |
| Single-corner project prompt | [Accepted scope and stage gates](SINGLE_CORNER_PROJECT_PROMPT.md) | Stage 3C bounded editor integration delivered; broader product and physical gates remain |
| Single-corner Stage 1 results | [Model, catalogue and certificates](SINGLE_CORNER_STAGE1.md) | Required hole families, finite excess/deficit ledgers, color witnesses, open-strip proof, crop-fringe limit and future acceptance plan; stop for review |
| Stage 1 crop/checker follow-up | [Full regions and independent checker](SINGLE_CORNER_CROP_FOLLOWUP.md) | R/P=6 and neighboring crops, supplied-certificate mutations, rotated inverse coordinates and circle error bounds; stop for review |
| Stage 2 visual prototype | [View prototype](corner-prototype/index.html) · [Report and instructions](SINGLE_CORNER_STAGE2.md) | Certified examples, bounded angular drawing, joined-strip/seam inspection, color witnesses and browser evidence |
| Stage 2 corrections | [Transactions, visible paint and inspection](SINGLE_CORNER_STAGE2_CORRECTIONS.md) | Reproduced failures, coherent control/request commits, real visible-paint negative control and monochrome desktop/mobile inspection; stop for review |
| Stage 3A portable diagrams | [Handoff and offline example](SINGLE_CORNER_STAGE3A.md) · [State format](CORNER_PROJECT_FORMAT.md) | Self-contained editable files, atomic imports, static SVG, three-engine round trips and planar isolation; stop for review |
| Stage 3B construction choices | [Bounded family and worked example](SINGLE_CORNER_STAGE3B.md) · [Matrix](corner-prototype/family-matrix.json) | Explicit angle/phase/crop/color controls, grouped Apply, 84 constructions and 268 compatible assignments, exhaustive reference/state checks, v1 compatibility and sampled three-engine rendering; stop for review |
| Stage 3C shared editor | [Integration report](SINGLE_CORNER_INTEGRATION.md) · [Instruction](SINGLE_CORNER_STAGE3C_PROMPT.md) | Same palette/painting/file actions, retained planar/corner session designs, v3 RGBA/custom state and explicit legacy migration, independent checking and browser evidence; see current release checks |
| Independent prompt improvement | [Historical Astra documentation task](SINGLE_CORNER_REVIEW_PROMPT.md) | Earlier review instructions and implementation hold at that checkpoint |
| Prompt review findings | [Independent review](SINGLE_CORNER_PROMPT_REVIEW.md) | Applied corrections, acceptance fixtures and historical authorization records |
| Tree reference evidence | [Recovered center and multiplier](TREE_REFERENCE_ANALYSIS.md) | Single-edge inverse fit, upper-half count, and historical renderer replay establish code f=3/4 versus paper ratio 4/3 |
| Cone prototype contract | [Mapping specification](CONE_MAPPING_SPEC.md) | Coordinates, units, seams, inverse selection, tolerance, and saved state |
| Evidence and reproduction | [Research testing](TESTING.md) | One suite command, coverage, results, and remaining test work |
| Independent geometry evidence | [Geometry matrix report](GEOMETRY_MATRIX_REPORT.md) | Finite-strip tiling, 256 structural cases, and 128 pixel cases |
| Before cone work | [Cone readiness](CONE_READINESS.md) | Prerequisites, dormant code, open questions, and the first bounded experiment |
| Historical investigation | [Research notebook](PLANAR_WEAVE_NOTES.md) | Chronology, corrected mistakes, earlier runs, and detailed evidence |

The reference files describe current understanding. Older notebook entries record
what was known **at that checkpoint**; their pending items can be superseded by
later results. The [boundary-detector resolution](PLANAR_WEAVE_NOTES.md#resolved-mask-boundary-detector-rejected-every-candidate-2026-11-04)
records the latest pixel-audit repair.

## Current position

- **Controls:** all 52 SVG control targets have source mappings and an executable
  characterization test. Real pointer selection and sliders have separate tests.
  Two mode/painting discrepancies are documented, rather than hidden behind
  tooltips. Wrapper saving, opening, and artwork export have application tests.
- **Planar construction:** H/R/L directions and a/b/c hexweave classes are
  distinguished; class partitioning, C-center membership shifts, fixed physical
  strip geometry, and local SVG painter order are explained and tested.
- **Geometry and pixels:** independent finite-strip geometry and actual browser
  structure agree across all 256 size/spacing/orientation cases. The selected
  128-case pixel matrix passes 4,278 central samples; 240 color-pattern cases
  preserve strip and mask geometry. Full-design crossing and boundary tests
  remain alongside it. See the [matrix report](GEOMETRY_MATRIX_REPORT.md).
- **Boundary and symmetry preparation:** 3,608 boundary/end pairs pass across
  128 settings. Structural symmetries, visible-top witnesses, and fixed-color
  distinctions are tested. Firefox/Chromium controls classify the faint lines
  as a clipping/compositing artifact; a [tested rendering change](SVG_SEAM_FIX.md)
  addresses it in Chromium, Firefox, and WebKit.
- **Cone preparation:** complete for the current planar app. Unit-fraction helper
  behavior and limitations are tested, and the [mapping contract](CONE_MAPPING_SPEC.md)
  records the earlier bounded prototype. The original planar engine remains unchanged;
  separately authorized historical forensics have recovered the tree reference
  at f=3/4. The [Stage 1 deliverable](SINGLE_CORNER_STAGE1.md) supplies scoped
  mathematical certificates and explicit limits. The separate
  [Stage 2 visual prototype](SINGLE_CORNER_STAGE2.md) and
  [bounded Stage 3B choices and portability](SINGLE_CORNER_STAGE3B.md) and [shared Stage 3C editor integration](SINGLE_CORNER_INTEGRATION.md) supply the released corner editor;
  the rest of Stage 3 remains on hold. Physical constructibility remains unverified.
  [Cone readiness](CONE_READINESS.md) maps the original goals to their evidence.

## Working cycle

For each question, record the physical meaning, locate the responsible source,
state a prediction, run a test against the actual engine, and preserve the result
and its scope. Keep source-derived facts, observed output, and unresolved
hypotheses distinguishable. Update these references when a question is resolved;
use the notebook for the investigation history.

Run `python3 research/run-tests.py` for the 33-stage research suite, add `--app`
for all 34 stages including application browser tests, or add
`--unit-only` for dependency-free checks. See [setup and coverage](TESTING.md).
