# Stage 3B handoff: bounded construction controls

This implements the [Stage 3B instruction](SINGLE_CORNER_STAGE3B_PROMPT.md), starting
from `d483557` on `docs/single-corner-prompt`. Users can choose weave, hole/center
phase, reference angle, crop preset and formula coloring as one staged candidate,
then apply it atomically. Save/open/offline editing and diagram SVG export work
through the expanded trusted catalogue. The production planar application is
unchanged. Stop here for review; full product integration, deployment, fabrication
and master merging remain unauthorized.

## Domain and compatibility

The machine-readable [matrix](corner-prototype/family-matrix.json) enumerates
216 geometry tuples: 6 typed weave/phase choices × 3 named crops × 12 reference
angles. Each tuple has separate results for monochrome and the five existing
formula assignments. Weave/phase mismatches are outside this typed domain and
show an explicit Unvalidated proposal. No center, order flag, coloring or crop
is changed automatically to make a proposal pass.

The UI range is **60° through 720°, in 60° steps**, with W/P=3/4. It is a
practical bound, not a mathematical upper limit or final product angle list.
The general monochrome madweave 60° baseline remains. A fixed center/order phase
can have a larger increment. Reference β, q=β/360, f=360/β and signed deficit
360−β are derived together; the active summary separately labels deficit/excess.

All offered phases have hand=X=0. Exact reference centers use
`p/P=(-(2*k1+k0)/sqrt(3),k0)`:

| Weave / hole phase | k | p/P | C | Membership | Supported increment | Offered crops |
|---|---|---|---:|---|---:|---|
| Madweave small hexagon, ordinary | (0,0,0) | (0,0) | 0 | All bands | 120° | R/P=3,6 |
| Madweave small hexagon, displaced sixfold | (0,2,−2) | (−4/√3,0) | 0 | All bands | 60° | R/P=3,6 |
| Madweave small hexagon, C on | (0,0,0) | (0,0) | 1 | All bands | 60° | R/P=3,6 |
| Hexweave large hexagon | (0,0,0) | (0,0) | 0 | Class 1 | 60° | R/P=7 |
| Hexweave triangle −y | (0,0,0) | (0,0) | 0 | Class 0 | 120° | R/P=7 |
| Hexweave triangle +y | (0,0,0) | (0,0) | 0 | Class 2 | 120° | R/P=7 |

Ordinary madweave and triangle cases use 120° canonical units for multiples of
120°. Their odd 60° proposals are checked against 60° transport and rejected
with an actual order or selected-membership witness. Displaced sixfold madweave
and large hexagons always use 60° units. C-on madweave uses 60° for odd steps and
120° for even steps, retaining the old C-on occurrence decomposition exactly.
All source flags and canonical units are in each matrix parameter object.

Results:

- **84 Validated geometry constructions**, all regular two-ended open ribbons,
  with **268 compatible construction/color assignments**.
- **24 Invalid phase/angle tuples** in this construction family: 12 ordinary
  madweave odd-step cases across its two crops, and 12 triangle odd-step cases.
  Ordinary witnesses name the positive-overlap pair whose source precedence
  reverses under transport; triangle witnesses name a transported band outside
  the selected membership. Monochrome removes no geometry/order restriction.
- **108 Unvalidated crop/phase tuples**, because madweave R/P=7 and hexweave
  R/P=3 or 6 are outside the selected UI crop domain. These are explicit scope
  limits, not assertions that those radii are mathematically impossible.
- Within the 84 valid geometries, **236 formula assignments have color-conflict
  witnesses** naming the exact joined occurrences. These are restrictions of
  the five formulas, not impossibility results for future custom strip painting.
  Compatible formulas report the actual number of used colors, including
  one-color class assignments and two-color finite cases.

All required new angles—60°, 180°, 420°, 600°, 720°—have Validated constructions
at the stated phases. None remains blocked by the previous eight-sector limit.
The original nine constructions, certificates, counts, digests and reference
evidence are retained unchanged. The R/P=6 excess example retains all 96 local
occurrences, including the two fringe bands per 120° unit. The largest new
216-occurrence case also retains every clipped fragment.

“Invalid” here means the chosen fixed transport/phase fails this construction's
requirements. It is not an exhaustive impossibility theorem about other centers
or non-symmetry seam registrations. Those remain outside this stage.

## Reference certification and numerical bounds

[build-corner-family.py](build-corner-family.py) builds the finite matrix before
the UI catalogue. It uses the existing full-region producer and the separate
checker. Every Validated geometry has a complete band/sector/disk certificate,
all registered full-width joins including the final seam, components, circular
ends, local order and distinct crossing positions. Every compatible coloring is
checked on those full material/order/join data. Every drawing partition receives
the independent exact rational coverage proof. No material is omitted for an
absent centerline, visibility, color conflict or subdivision budget.
The checker imports neither generator nor Stage 1 helpers; it reconstructs
geometry with line intersections and convex hulls rather than the producer's
polygon clipping. Independence means a separate implementation of the declared
reference model/order law, not an independent physical weaving theorem.

The checker enumeration bound increases from 8 to **12 sectors**. Its geometry
still uses one convex 60°/120° canonical sector; the bound does not alter that
geometry or the rational predicates. The occurrence/phase loops explicitly check
every j and closing j=m, and the registered join graph checks every boundary.
No algorithm/proof assumed m≤8. All new 9–12-sector cases are independently
certified. A twelve-sector positive and a thirteen-sector rejection explicitly
test the boundary; thirteen is **Unvalidated: outside bounded checker domain**,
not mathematically Invalid. The checker still rejects unsupported degeneracies.
The sector cap is separate from the UI angle cap; acceptance of other supplied
parameters by that general checker does not advertise them in this finite UI.

The shared radius-preserving drawing map and inverse remain unchanged. The
maximum tolerance stays **0.00009375 P**, with 1e−10 numeric reserve, line depth
budget 24 and circular subdivision budget 20,000 per arc. Exhaustive tessellation
of all 84 constructions checks 1,796,083 band/cell segments; the largest reported
bound is 0.0000937476464458452 P. All complete within the existing budgets.
The renderer now computes the maximum bound with an iterative scan, avoiding
JavaScript's argument-count limit for larger segment arrays. It does not weaken
the bound. Browser samples additionally measure mapped mid-chord error.

## Controls, transactions and identity

The primary fieldset is **Proposed construction — apply together**. It shows the
whole proposed weave, phase/coordinates/flags, β, q, f, signed deficit, named crop,
geometry/order status, coloring status, actual color count and witness. The
separate ACTIVE summary and quick coloring/view/inspection controls continue to
describe the committed design. Certified examples remain optional shortcuts.

Changes in the proposal do not redraw or mutate the active design. Apply prepares
the whole candidate model, compatibility, inspection and detached SVG, then
commits synchronously. A valid combined change can pass even when either
intermediate angle-only or phase-only edit would fail. Invalid/Unvalidated
proposals can be attempted to report the rejection while preserving the active
model, SVG, controls and selection. Draft values remain visibly proposed.
Save/export use the active design, not an unapplied proposal.

All grouped requests share the existing revision guard with examples, import,
view/color/inspection, save/export and later proposal changes. Stale successes
and errors cannot change the active design, current proposal or current status.
A new proposal also supersedes an older pending request. Native-control tests
include competing Applies where a newer request succeeds or fails, then an old
success/error finishes last. The existing 17 transaction and 20 import-failure /
10 import-overlap cases continue to pass in all three engines.

View-only changes preserve material/local-position identity. Color-only changes
within the same construction preserve it too. Applying a different construction
clears selection and states that no material correspondence is assumed, even
when some occurrence strings happen to be equal. Import is different: an
explicit saved selection is validated against its own saved construction before
restoration. A self-crossing still has two distinct occurrence positions in the
same joined strip; no occurrence is merged through a crossing.

## Files, legacy compatibility and worked offline example

Current editable files use project **version 2**, catalogue **corner-family-v2**;
the reference certificate format remains version 2. See the
[format specification](CORNER_PROJECT_FORMAT.md). The nine version-1 IDs and
their trusted certificates are retained. Importing Stage 3A v1 data and resaving
changes only version/catalogue fields; model parameters, occurrence identities,
colors, reference anchors and selected crossing remain identical. Both actual
Stage 3A worked files and both self-crossing active positions are checked.
New family IDs cannot be forged into a v1 envelope. Production planar
`madweave-project` version 1 remains a separate, unchanged format.

From the repository root, run:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open **http://127.0.0.1:8080/research/corner-prototype/**. No build/install is
needed for the committed prototype. For a worked grouped change:

1. Start with the ordinary madweave 480°/R/P=6 example in Class colors. Stage
   420°: the ordinary phase fails order. Stage displaced sixfold at 480° while
   retaining Class colors: geometry passes, that coloring conflicts.
2. Stage **Madweave / displaced sixfold / 420° / R/P=6 / Monochrome** together.
   The proposal is Validated. Apply once; no intermediate invalid design becomes
   active. The reference angle is 420°, excess 60°, q=7/6, f=6/7. Its center is
   explicitly p/P=(−4/√3,0), with C=hand=X=0.
3. Inspect a joined strip, Save editable project, close the server, disable
   networking and reopen the HTML locally. Change display rotation, resave and
   reopen. The worked [editable file](evidence/corner-stage3b-worked.corner.html)
   is the recorded 90° view after this round trip; it contains all 84
   constructions, the matrix and grouped controls for further offline use.
4. Export without inspection annotations. The resulting
   [static SVG artwork](evidence/corner-stage3b-worked.svg) was opened independently
   and its geometry/colors/order passed back to the reference checker. It is
   artwork, not an editable file or fabrication template. Annotation inclusion
   remains explicit; the Stage 3A annotation regressions still pass.

The new bundle is about 3.96 MB and editable HTML about 3.97 MB. All 268 compatible
state round trips fit the unchanged 10 MiB import text limit. Self-contained
files include the entire bounded family once, so resaving does not recursively
grow the file. Detailed actual sizes and timings are in the evidence below.
Timings are local harness measurements, not performance guarantees: Apply covers
the actual async handler through fetch/render/commit; redraw includes native
control automation; offline load covers file navigation through initialization.
The default example is initially prepared before the embedded saved state.

For the 720°/R/P=6 displaced-sixfold case at a 1500×1200 viewport:

| Engine | Apply | Rotation redraw | Offline reopen |
|---|---:|---:|---:|
| Chromium | 93.2 ms | 66 ms | 275 ms |
| Firefox | 107 ms | 103 ms | 306 ms |
| WebKit | 121 ms | 90 ms | 368 ms |

That case has 64,728 base drawing segments; enabling full inspection uses 87,528,
still within the same bounds. Its unannotated SVG is about 6.86 MB and its
independently checked annotated SVG about 10.28 MB. Explicit bounded curves cost
file size; tolerances were not loosened. The largest measured editable HTML is
3,970,804 bytes and is distinct from these static SVG artwork files.

## Verification and reproduction

Evidence is separated by scope:

- [Exhaustive semantic/bound results](evidence/corner-family-semantic.json): all
  84 constructions, all 268 compatible assignments, 236 rejected formula
  assignments, 6,192 exact-ray/approach/final-wrap checks across four rotations,
  empty-hole checks, full material/partner/order/color/selection comparisons,
  per-occurrence colors compared to [independent assignments](evidence/corner-family-color-oracles.json),
  legacy v1 correspondence and unchanged subdivision limits.
- [Three-engine representative browser results](evidence/corner-family-browser.json):
  **19 constructions per engine**, including all new required angles, all hole
  families/orientations, small-angle same-strip self-crossings, 60°/radius-6
  curvature, 720° largest-material and 720° largest-hole cases. Actual grouped
  controls, bounded geometry/paint probes, native save/open/resave, zero-request
  offline family edits, and direct script-free SVG documents are checked.
- [Grouped-control races](evidence/corner-family-controls.json): real-control
  grouped intermediate failures, rejected crop/weave-phase proposals, render
  failure, five stale completion/error cases, native legacy import and view
  identity preservation in Chromium, Firefox and WebKit.
- [Largest-case inspection](evidence/corner-family-inspection.json): the 216-piece
  construction with visible/hidden/selection/seam overlays, unchanged model and
  colors, in-bound tessellation and independently checked annotated SVG in each
  engine. The original 42 plain/annotated legacy SVG exports per engine are also
  replayed with explicit in-image pixel bounds.
- [Regression summary](evidence/corner-family-regressions.json): all original
  nine examples and 33 compatible assignments through the existing prototype
  and portable-file runners; their local-order and actual wrong-visible-paint
  negative controls; original 89/137 reference cases; planar unit/site and
  renderer regressions. Original nine certificates and evidence remain unchanged.

Reference certification and semantic round trips are exhaustive over the
advertised domain. Browser geometry/export sampling is explicitly the 19 cases
listed in the browser evidence, plus the original nine—not every one of the 268
assignments in every engine. Both direct SVG geometry/color probes and actual
pixels are audited; screenshot probes must lie within their captured image.
Reference probe points exclude true material boundaries by the declared margin;
exact ownership rays have separate tests. The unchanged normal paint audit still
rejects a real incorrectly painted top material without changing its oracle.

Chromium 145.0.7632.6, Firefox 155.0 and WebKit 26.6 pass. Offline contexts record
zero HTTP(S) requests. Chromium/Firefox also use offline emulation; WebKit denies
network protocols because its emulated-offline switch blocks local `file:` loads.
This is headless desktop-engine coverage, not mobile-OS file-manager certification.

From a configured Python/Node/Playwright environment (the pinned setup remains
in the Stage 3A report):

```sh
python3 research/single-corner-stage1.py
python3 research/corner-crop-followup.py
python3 research/build-corner-prototype.py
python3 research/build-corner-family.py
python3 research/build-corner-package.py
node research/corner-family.test.mjs
node research/corner-family-browser.test.cjs
node research/corner-prototype-browser.test.cjs
node research/corner-project-browser.test.cjs
node research/corner-project-isolation.test.cjs
python3 research/run-tests.py --unit-only
```

The browser runners start loopback servers themselves. Use
`MADWEAVE_STAGE2_BROWSERS=chromium` to focus a browser runner, or
`MADWEAVE_STAGE3B_CONTROLS_ONLY=1` for grouped-control/race checks alone.
`MADWEAVE_STAGE3B_INSPECTION_ONLY=1` focuses the largest annotated case.
Generated full files and reconstructed SVG certificates live under ignored
`research/output/corner-family/`. The package builder validates all 84 full
partitions and must be rerun after prototype/template/CSS or catalogue changes.
The planar renderer command remains `research/seam-fix-check.cjs` per engine
against a root server's `editor.html`, as documented in Stage 3A.

## Remaining limits and next review

The 108 crop/phase entries outside the stated crop scope remain Unvalidated.
Other radii, widths, centers, C/hand/X choices, circle-through-vertex and cap-end
degeneracies, non-symmetry registrations and angles beyond this practical range
are not advertised as implemented. Invalid phase witnesses do not exclude
alternate research constructions. The matrix does not enumerate every
equivalent lattice center. Per-strip painting, palette/opacity editing, broader
parameter coverage and full product integration remain deferred.

Before full diagram release, review this bounded deliverable and agree the
remaining approved product control/coverage and integration scope, then complete
its corresponding geometry, continuation, color, crossing-order, persistence and
user-facing acceptance checks. This prototype is not whole-project readiness.
Physical validation is a separate gate: a diagram release can remain physically
unverified with that label. Fabrication claims/outputs require a documented
physical example and explicit stock, dimensions, tolerances and assembly review.

The model still assumes ideal straight constant-width reference ribbons, zero
thickness and the certified face/side-preserving full-width seam transport. It
does not establish unstrained 3D straight-stock realizability. No custom-cut stock
was silently substituted. The tree investigation was not reopened. No production
code, fabrication output, deployment or master merge was added. **Stop for review.**
