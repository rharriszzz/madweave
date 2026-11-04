# MadWeave research guide

The project has four connected goals: explain every control, explain the planar
hexweave and madweave construction, make those explanations testable, and finish
the preparation for `coneFraction`. Work stays on `research/planar-weave-experiments`
with the original planar settings until the readiness checks below are satisfied.

## Reading paths

| Level | Read | Purpose |
|---|---|---|
| Using the app | [User guide](../guide.html) | Make, edit, save, and reopen a design |
| Every control | [Control reference](CONTROLS.md) | Labels, internal IDs, effects, resets, and verified surprises |
| How the weave works | [Planar model](PLANAR_MODEL.md) | Physical strips, hexweave classes, center changes, geometry, and local layering |
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
- **Cone preparation:** not complete. Symmetry, broader boundary/pixel locations,
  physical interpretation, and the dormant angular mapping still need work.
  [Cone readiness](CONE_READINESS.md) defines the outstanding deliverables.

## Working cycle

For each question, record the physical meaning, locate the responsible source,
state a prediction, run a test against the actual engine, and preserve the result
and its scope. Keep source-derived facts, observed output, and unresolved
hypotheses distinguishable. Update these references when a question is resolved;
use the notebook for the investigation history.

Run `python3 research/run-tests.py` for the planar research suite, or add
`--unit-only` for dependency-free checks. See [setup and coverage](TESTING.md).
