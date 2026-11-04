# Readiness for the first cone experiment

This readiness record concerns the planar baseline. The newer
[single-corner project prompt](SINGLE_CORNER_PROJECT_PROMPT.md) adds user
requirements and outstanding decisions; it must be completed before that
project starts. The proposed implementation sequence below is not a current
authorization to proceed.

**Preparation for the current planar app is complete.** Every exposed control is
mapped and characterized; the planar model, independent geometry, parameter
matrix, symmetry, boundary rendering, and dormant angular helpers have documented
results and executable checks. The [cone mapping contract](CONE_MAPPING_SPEC.md)
defines the next implementation phase. The application still uses
`numberOfDirections=3`, `transformInPath=false`, and `coneFraction=1`.

Completion here means that the preparatory questions have explicit answers,
tests, or a documented limitation with a concrete implementation requirement.
It does not mean that cone rendering or a physical cone weave has been built.

## Goal completion

| User goal | Deliverable | Verification |
|---|---|---|
| Understand every app button | [Control reference](CONTROLS.md) and user guide; all 52 SVG targets plus wrapper actions | Control inventory, reset/preservation checks, actual pointer tests, recent-color/opacity checks, and application save/open/export tests |
| Understand hexweave and madweave details | [Planar model](PLANAR_MODEL.md), [symmetry](SYMMETRY.md), and detailed reports | Class partitions, physical identities, center shifts, order, geometry, color invariance, corrected centerline derivation, and occupancy tests |
| Develop a test suite | [Research testing](TESTING.md) and `research/run-tests.py` | 33 research stages; 34 with the application browser suite; versioned branch CI |
| Finish preparation before coneFraction | [Mapping specification](CONE_MAPPING_SPEC.md), this checklist, and unit-fraction helper tests | Explicit spaces, parameter/unit derivation, forward/inverse mapping, seams, approximation bound, persistence requirements, and a bounded first fixture |

## Readiness checks and evidence

| Topic | Completed preparatory evidence |
|---|---|
| Strip identity and classes | Original indexing plus independent rectangles and actual browser partitions at all 256 size/spacing/orientation settings |
| Mask coverage and local order | 158,208 finite-cell coverage checks, 92,928 generated triangles, and 371,712 browser mask cells; missing/duplicate negative controls fail |
| Independent pixels | 4,278 central pixel samples at 128 settings; extra-wide triple emptiness explicitly checked in 32 cases |
| Boundaries and finite ends | 3,608 passing two-sided pairs, including 384 explicit H/R/L end pairs, across 128 settings and 512 zooms |
| Symmetry | 768 rotation cases, 383,616 pair comparisons, and 5,280 visible-top comparisons; geometry, classes, order, and colors distinguished |
| Color invariance | 240 pattern/count/orientation cases preserve physical and mask geometry and satisfy the documented formulas |
| SVG rendering lines | Firefox/Chromium same-geometry comparison and clipped/unclipped neutral controls classify a known raster/compositing artifact |
| Dormant angular helpers | At f=1: 15 finite intersection checks, 428 clipped segments, 5,184 strip picks, and explicit endpoint/branch/initialization characterizations |
| Save/reopen and app behavior | Eleven application tests pass locally in Chromium and separately in Firefox; the consolidated CI includes the Chromium application suite |

The full local `--app` run passed 34 stages. The first pushed baseline,
`61603be`, also passed [branch CI](https://github.com/rharriszzz/madweave/actions/runs/41919725799).
Completion commit `e862210` passed the full 34-stage
[suite in CI](https://github.com/rharriszzz/madweave/actions/runs/41923169422).
The [testing record](TESTING.md) identifies versions, artifacts, reproduction,
and the main-branch integration review.

## Known limitations that are accounted for

- V currently shows **and recolors** a strip. The first palette press after I/V
  exits that mode while retaining the previous swatch. These existing behaviors
  are characterized and explained; they are not requirements for the new cone UI.
- Exact clip-edge pixels can show faint lines in both Firefox and Chromium.
  Geometric coverage and safely interior pixels pass independently. Browser-engine
  debugging is a separate project, not a prerequisite for a cone prototype.
- The legacy angular setup is not reactive; the star-unit bookkeeping is
  inconsistent with closure when U=6; endpoint sampling contracts the last point;
  and the six-direction picking shortcut is not suitable for a nonunit map.
  The mapping specification gives explicit replacements and acceptance checks.
- Physical weaving feasibility, arbitrary displaced symmetry centers, exhaustive
  pixels at every location, and nonunit cone behavior have not been claimed.
  The implemented finite planar baseline and the specified first experiment
  have bounded, repeatable coverage.

## Next implementation phase

Implement the contract in this order: explicit parameter derivation and exact
f=1 equivalence; safe unit clipping and bounded approximation; the N=6, U=3
research fixture; seam/global-strip identity and inverse picking; then versioned
editable state and UI. Keep the planar suite passing throughout. The nonunit
fixture has been specified but not executed during preparation.
