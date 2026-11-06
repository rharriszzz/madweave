# Markdown baseline review for the 3D explorer

Reviewed 2026-11-05, before drafting the rendering approaches. Baseline:
`master` at `25fbd358828f19e26df859f7ea66766cfaf9561a`, which also matched the
remote default branch when checked. There is no `main` branch in this repository.

The inventory below covers all **40 tracked Markdown files** in that revision.
The pre-existing untracked `research/SOL_RELEASE_README_PROMPT.md` is outside
that baseline and was left untouched. Historical prompts are reviewed as project
history; their old branch-specific tasks are not instructions to repeat them.

## Findings that affect the new work

1. Physical identity, geometry, local crossing order, color assignment and view
   visibility are separate concepts. A visually convincing render can still
   have incorrect hidden material or joined-strip identities.
2. The radius-preserving angular chart changes the reference metric. Its
   multiplier is reciprocal to paper-angle fraction. The historical tree is
   beta=480 degrees, f=3/4, not an ordinary right circular cone.
3. Full material regions matter: centerline-only representations lose crop
   fringes. Self-crossings retain two local positions in one global strip.
4. Later implementation supersedes several old report boundaries. Current
   source and `docs/TESTING.md` include 1,728 size/angle/spacing constructions
   alongside the original 84, individual strip ends, sizes 1–8 and four spacings.
   Early fixed-W/P and circular-crop-only statements describe older checkpoints.
5. Current corner behavior accepts seam-color conflicts with explicit warnings
   and retains opacity. Early blocking-color and opaque-only proposals are
   superseded. Construction/order checks still have their own failure semantics.
6. Existing evidence validates bounded diagrams and workflows. It does not
   establish a general multi-corner assembly, finite-thickness ribbon embedding
   or physical feasibility. Richard and the agent will develop corner assembly
   jointly; renderer cost estimates assume supplied geometry.

The current architecture, README and testing record take precedence for released
behavior over historical “next work” and review-stop text. The mathematical
reports remain useful within their declared model domains. Test outcomes below
are findings in the reviewed documents, not new test runs for this review.

## Complete inventory

| File | Takeaway for 3D work |
| --- | --- |
| [IMPROVEMENTS.md](../../IMPROVEMENTS.md) | Preserve edits; undo, accessibility and modularity are useful future work; existing rights are not an open-source license. |
| [README.md](../../README.md) | Current shared editor behavior, active-design saving, corner controls and explicit physical limits. |
| [docs/BROWSER_TEST_SETUP.md](../../docs/BROWSER_TEST_SETUP.md) | Durable browser installation and aligned Node/Python clients; distinguish local setup from CI. |
| [docs/DEVELOPMENT.md](../../docs/DEVELOPMENT.md) | Buildless production app, generated checked runtime, individual strip ends, compressed catalogue and explicit publication allowlist. |
| [docs/MAC_TESTING.md](../../docs/MAC_TESTING.md) | Native Mac acceptance differs from automated WebKit; offline workflows and Firefox test isolation. |
| [docs/SCREENSHOTS.md](../../docs/SCREENSHOTS.md) | Reproduce images from actual editor state and preserve provenance; pictures are not independent geometry proof. |
| [docs/TESTING.md](../../docs/TESTING.md) | Latest size/spacing/end coverage and release checks supersede early fixed-catalogue limitations. |
| [research/BOUNDARY_RENDERING.md](../BOUNDARY_RENDERING.md) | Distinguish geometric coverage, safe interior pixels and exact-edge raster artifacts. |
| [research/CONE_MAPPING_SPEC.md](../CONE_MAPPING_SPEC.md) | Coordinate separation, inverse picking and error bounds; its older N=6 proposal is superseded by the accepted corner model. |
| [research/CONE_READINESS.md](../CONE_READINESS.md) | Completed planar preparation is bounded evidence, not proof of a physical cone. |
| [research/CONTROLS.md](../CONTROLS.md) | Direction/class/palette are distinct; do not copy the legacy show-and-recolor interaction surprise. |
| [research/CORNER_PROJECT_FORMAT.md](../CORNER_PROJECT_FORMAT.md) | Authoritative state, trusted construction versions, local-position identity, explicit migrations and current RGBA warnings. |
| [research/CROSSING_PARITY.md](../CROSSING_PARITY.md) | Correct half-integral offset: no coincident triple centerlines; finite-width triple overlaps remain possible. |
| [research/CROSSING_PIXEL_AUDIT.md](../CROSSING_PIXEL_AUDIT.md) | Sampled original-renderer crossings corroborate the precedence predicate; no physical or 3D proof. |
| [research/GEOMETRY_MATRIX_REPORT.md](../GEOMETRY_MATRIX_REPORT.md) | Independent finite-cell construction, complete structural matrix and deliberately sampled pixels. |
| [research/HEXWEAVE_VISUAL_COMPARISON.md](../HEXWEAVE_VISUAL_COMPARISON.md) | Three hexweave classes partition strips; changing C alters class membership/order without moving strip rectangles. |
| [research/PLANAR_MODEL.md](../PLANAR_MODEL.md) | Reusable strip equations, class/group formulas, local ranks and width/pitch geometry. |
| [research/PLANAR_WEAVE_NOTES.md](../PLANAR_WEAVE_NOTES.md) | Historical corrections show why real-control tests, independent geometry and negative controls are necessary. |
| [research/README.md](../README.md) | Research map; current references supersede pending items in historical notebooks. |
| [research/SEAM_ROOT_CAUSE.md](../SEAM_ROOT_CAUSE.md) | Antialiased clipping plus repeated source-over caused seams; demonstrated by reductions and analytic color predictions. |
| [research/SINGLE_CORNER_CROP_FOLLOWUP.md](../SINGLE_CORNER_CROP_FOLLOWUP.md) | Full region topology preserves fringe material; separate checker reconstructs joins, components and ends. |
| [research/SINGLE_CORNER_INTEGRATION.md](../SINGLE_CORNER_INTEGRATION.md) | Shared palette, retained modes, native ordered RGBA stacks and later formula-intent correction. |
| [research/SINGLE_CORNER_INTEGRATION_REVIEW.md](../SINGLE_CORNER_INTEGRATION_REVIEW.md) | Stale replacement intent erased later paint; actual-control sequence regression caught what semantic round trips missed. |
| [research/SINGLE_CORNER_PROJECT_PROMPT.md](../SINGLE_CORNER_PROJECT_PROMPT.md) | Accepted reference/chart distinction, hole centers, full-width joins, no twists/branches and separate physical gate; later clarifications govern color behavior. |
| [research/SINGLE_CORNER_PROMPT_REVIEW.md](../SINGLE_CORNER_PROMPT_REVIEW.md) | Angular closure and graph degrees alone are insufficient; partner matching, local stacks and independent oracles matter. |
| [research/SINGLE_CORNER_REVIEW_PROMPT.md](../SINGLE_CORNER_REVIEW_PROMPT.md) | Historical review checklist for geometry, topology, color and acceptance; not a fresh delegation request. |
| [research/SINGLE_CORNER_STAGE1.md](../SINGLE_CORNER_STAGE1.md) | Signed periodic ribbons, hole/phase catalogue, sufficient angle families, strip framing and local versus global order. |
| [research/SINGLE_CORNER_STAGE2.md](../SINGLE_CORNER_STAGE2.md) | Common forward/inverse chart, bounded tessellation and inspectable complete reference regions. |
| [research/SINGLE_CORNER_STAGE2_CORRECTIONS.md](../SINGLE_CORNER_STAGE2_CORRECTIONS.md) | Prepare detached candidates; failed/stale operations retain state; test actual visible paint, not only metadata. |
| [research/SINGLE_CORNER_STAGE3A.md](../SINGLE_CORNER_STAGE3A.md) | Portable editable projects and independent static artwork have distinct contracts. |
| [research/SINGLE_CORNER_STAGE3A_PROMPT.md](../SINGLE_CORNER_STAGE3A_PROMPT.md) | Historical portability scope and requirements for semantic round trips and offline reopening. |
| [research/SINGLE_CORNER_STAGE3B.md](../SINGLE_CORNER_STAGE3B.md) | Bounded 84-construction family, 268 compatible fixed assignments and witnessed restrictions; not all possible corners. |
| [research/SINGLE_CORNER_STAGE3B_PROMPT.md](../SINGLE_CORNER_STAGE3B_PROMPT.md) | Matrix-first generation, grouped changes, identity policy and declared implementation bounds. |
| [research/SINGLE_CORNER_STAGE3C_PROMPT.md](../SINGLE_CORNER_STAGE3C_PROMPT.md) | Existing-editor integration; later opacity and warned-color decisions override original restrictions. |
| [research/SOL_REVIEW_FIX_PROMPT.md](../SOL_REVIEW_FIX_PROMPT.md) | Historical focused paint-loss repair; preserve deliberate staged formulas while consuming immediate intent. |
| [research/SVG_SEAM_FIX.md](../SVG_SEAM_FIX.md) | Complete local stacks before clipping and complementary coverage composition; preserve the regression while using a different 3D renderer. |
| [research/SYMMETRY.md](../SYMMETRY.md) | Geometry, order, class labels and fixed colors have different symmetries. |
| [research/TESTING.md](../TESTING.md) | Coverage map separates source semantics, independent geometry, UI and pixels; current application counts live in docs/TESTING. |
| [research/TREE_REFERENCE_ANALYSIS.md](../TREE_REFERENCE_ANALYSIS.md) | f=3/4 reconstruction is a distorted chart; partial historic picture is not a completed seam or physical validation. |
| [research/TRIPLE_AREA_EIGHT_CONFIG_REPORT.md](../TRIPLE_AREA_EIGHT_CONFIG_REPORT.md) | Triple-overlap samples exercise local stacks; sampled mask counts are not exhaustive area or physical evidence. |

## Source spot checks

Inspected the reusable [Diagram kernel](../corner-prototype/kernel.mjs),
[current corner state adapter](../../corner-model.mjs),
[family generator](../build-corner-family.py), relevant independent-checker
join/component code, package scripts and the publication builder. The kernel's
`map`/`inverse` implement one angular chart. The certificate owns full regions,
joins and local order; those are better inputs to 3D research than screen SVG.
The current renderer is not an existing 3D assembly engine.

The new [rendering comparison](README.md) includes primary-source technology
research, custom-renderer budgets and a proposed comparison experiment. It
changes no application behavior or project format.
