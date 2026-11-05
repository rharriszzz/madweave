# MadWeave research guide

The project has four connected goals: explain every control, explain the planar
hexweave and madweave construction, make those explanations testable, and finish
the preparation for `coneFraction`. The planar preparation and SVG seam fix
have been merged into `master`. The single-corner prompt is still being prepared;
the production application's `coneFraction` remains 1.

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
| Single-corner project prompt | [Draft for later work](SINGLE_CORNER_PROJECT_PROMPT.md) | Physical angle versus coneFraction, hole centers, exact strip/color continuation, recovered tree flattening, stages, and unresolved decisions; implementation is on hold |
| Independent prompt review | [Review-only handoff](SINGLE_CORNER_REVIEW_PROMPT.md) | Focused questions for an independent mathematical review before implementation |
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
  records the earlier bounded prototype. The production app remains planar;
  separately authorized historical forensics have recovered the tree reference
  at f=3/4. The new single-corner prompt remains under review.
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
