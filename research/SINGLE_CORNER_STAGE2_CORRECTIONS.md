# Stage 2 correction handoff: coherent transactions and visible paint

**Later bounded authorization:** [Stage 3A](SINGLE_CORNER_STAGE3A.md) extends these
transactions to portable editable files and static SVG for the same nine
constructions. Statements below about no persistence or Stage 3 authorization
record this correction pass's checkpoint; the remaining product stage stays on hold.

This bounded correction pass starts from `951bc4c` on
`docs/single-corner-prompt`. The user authorized prototype corrections, failure
regressions, a real visible-paint negative control, and optional monochrome
inspection. All work stops here for review. Stage 3, production integration,
deployment and merging remain unauthorized. Physical constructibility remains
unverified. No tree-image investigation was performed.

## View and inspect

From `/home/rharris/git/madweave`:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open **http://127.0.0.1:8080/research/corner-prototype/**. Choose a free port if
8080 is occupied. No dependency install or build is needed for viewing the
committed fixed examples. The [original Stage 2 report](SINGLE_CORNER_STAGE2.md)
still describes the nine constructions and geometric bounds.

For monochrome inspection, select Monochrome and enable **Visible over/under
boundaries**. Solid dark edges show material boundaries only where that local
position is visible. The separately labeled **Dashed hidden-material / sector-
piece inspection** includes hidden geometry and conceptual cuts. Orange whole-
strip selection also includes hidden material; neither is a visible-boundary
claim or a change to the material coloring.

Use the native **Inspect interior crossing** selector with the keyboard. Its
options exclude conceptual seam-ray duplicates; those remain inspectable through
seam partners. The inspector lists local positions OVER to UNDER. Tab to **Next
local position at click** and press Space/Enter to cycle positions. At a self-
crossing the positions remain separate even though their joined strip ID agrees.

Committed examples:

- [Desktop monochrome visible boundaries](evidence/corner-correction-desktop.png)
  at a 1500 x 1200 viewport, with hidden inspection off.
- [Mobile-width crossing inspection](evidence/corner-correction-mobile.png)
  at a 390 x 900 viewport, with visible boundaries, dashed hidden inspection and
  an orange selected strip. This is a browser viewport/layout example, not a
  hardware/mobile-OS certification.

## Defects reproduced at the starting commit

The [before-change evidence](evidence/corner-correction-baseline.json) records
13 actual-control cases against the starting implementation. Eleven reproduce
defects; two existing protections already work. Snapshots include model values,
serialized SVG/viewBox, active controls, selection and inspector/certificate text.

| Reproduction | Previous behavior |
|---|---|
| Compatible color change with forced mesh failure | New pattern and color control remain committed while the old drawing stays visible |
| Outline/seam change with forced redraw failure | Checkbox changes while the drawing retains its old view |
| Strip, next-position or clear-selection failure | Selection/control state can change while the drawing and inspector remain old |
| Certificate fetch failure | Example selector shows the requested example while the previous model/drawing remain active |
| Older successful request completing last | Overwrites a newer successful example |
| Older request failing after a newer success | Overwrites the current status with an irrelevant stale error |
| Older success after the newer request failed | Replaces the retained design and newer failure status |
| Pending example followed by a newer view choice | Late example replaces the newer user choice |
| Failed rotation and failed example mesh preparation | Existing narrow rollback already preserved the tested state in these two cases |

The original paint negative control also changed only an unpainted `.face`
position label. The final visible drawing uses compound color paths. That test
did not demonstrate rejection of an incorrectly painted top material. Its result
is now named `orderMetadataMismatch`; descriptions of it as a visible/painter
negative control have been corrected.

## Coherent transaction contract

The prototype now holds one committed state: example/model, material pattern,
view flags/rotation, selected strip, crossing, local positions and current
position index. Every real control handler stages a candidate from that state.
Candidate numeric preparation, SVG construction and inspector text are completed
in a detached SVG before the synchronous commit updates the displayed state.
The candidate model is a separate object. Its audit arrays and derived drawing
do not mutate the committed model while preparation is in progress.

A failed fetch, parsing/construction step, compatibility check, view redraw or
inspection redraw leaves the previous model object, SVG, selection and active
control values intact. Controls immediately describe the committed design while
an example request is pending. Initial model-dependent controls are disabled
until the first model is committed. Status distinguishes the failed attempt
from the retained validated reference example, with explicit active-example and
active-status fields. A failure is not silently presented as a successful edit.

Every new example, color, view or inspection intent increments a revision token.
An asynchronous load checks the token after fetch, after JSON parsing, before
commit and before reporting an error. Any newer control intent supersedes an
older pending example request, including when the newer attempt fails. Older
responses/errors neither replace the design nor change its current status.
The old network request may finish; it has no remaining authority to commit.

Resize redraws use the same candidate preparation and detached commit. Their
scheduled callbacks check the captured revision and cannot report an old resize
error over a newer control choice. A successful resize refresh preserves the
current operation status. No history, persistence, arbitrary parameter editor or
general import workflow was added.

## Actual-control failure regressions

[corner-prototype-transactions.test.cjs](corner-prototype-transactions.test.cjs)
is run by the normal three-browser prototype suite. It exercises native controls,
not an alternate implementation of state transitions. Observers on the example
control only wait for its real returned request promise. Delayed Playwright
routes allow request completion order to be deliberately reversed.

All **17 cases per browser** pass:

- Forced render failures during compatible color change, rotation, outline,
  seam and visible-boundary changes.
- Forced failures during strip selection, keyboard crossing selection,
  next-local-position and clear-selection actions.
- Failed certificate fetch and failed example render preparation.
- Older success and older error after a newer successful request.
- Older success after a newer failed request.
- A newer view, color or strip-inspection choice while an older example request
  is pending.

Failures compare the complete committed snapshot, including SVG and control
values; representative checks also retain the exact model object. Each failed
control reports Unvalidated, names the retained active example and keeps its
reference status Validated. Reordered requests compare both final state and
status before/after the late completion. No unhandled page errors are ignored.
The tests preserve SVG content, not browser focus/scroll position or absolute
page layout while the failure message is displayed.

The original 13-case baseline was captured before adding the optional-control
and additional cross-control race cases. The current `--baseline` diagnostic
mode can be run against an isolated checkout of the old implementation; it
records failures instead of requiring all cases to pass. It is not an indication
that the corrected implementation should still fail.

## A real visible-paint negative control

The normal audit is now a shared `auditReference` routine used for both positive
examples and the negative control. At a known certified crossing of local
positions `(0,0,7)` and `(0,1,2)`, reference XY=(-3.5,4.5), the test removes that
cell's path from the correct visible compound path and adds it to the lower
material's compound path. It does not change the source certificate, positions,
local order metadata, material assignments or independent oracle.

The unchanged normal paint/geometry audit rejects the mutation with
**“Actual opaque paint union disagrees with reference order.”** All three browser
screenshots confirm the wrong purple material `[139,109,165]` where the correct
top orange material is `[189,113,61]`. This is actual visible paint, not a label
or selection overlay. The oracle object digest is recorded in the browser
evidence; the committed oracle inputs are unchanged. The test restores the
compound paths and reruns the same normal audit successfully.

The older unmapped-band and unmapped-order-region controls remain geometry
definition tests. The order-label control remains a metadata test. Their names
and scope are no longer presented as proof of a visible-paint failure.

## Optional readable crossing inspection

Visible-boundary strokes use the same bounded reference edge map as the bands.
For each local position, its solid boundaries are clipped to the exact union
of order cells in which that position is topmost. Conceptual sector-cut edges
are excluded. Hidden underpass edges are therefore not presented as visible
paper edges. At a self-crossing, clipping uses the local position, not merely
the shared global strip ID.

The material compound paths, palette, reference geometry and compatibility are
unchanged when this overlay is toggled. The keyboard tests compare their SVG
content before/after, choose crossings and cycle positions. Desktop/mobile
examples distinguish solid visible boundaries from dashed hidden inspection
and orange whole-strip annotation. These are diagram annotations, not paper
thickness or fabrication allowances.

## Verification and reproduction

The full prototype suite passes in Chromium 145.0.7632.6, Firefox 155.0 and
WebKit 26.6. In each browser it retains all nine certified examples, 6,665
independent reference probes, 2,424 seam/exact-ray/wrap tests and material pixel
checks, alongside the 17 new transaction cases, visible-paint mutation and
keyboard/monochrome/mobile checks. Actual SVG certificate/order records continue
to pass the independent checker and its exact region coverage proof.

The reference rebuild passes all 137 crop cases and preserves the original 89
case counts/color results. The nine prototype certificates, registry, independent
oracles and reference/partition results reproduce without changes. The 18-stage
planar unit/site suite passes, as does the unchanged planar renderer's full
`seam-fix-check.cjs` in all three engines (163 configurations and 90,350 samples
per browser). This is not the entire application browser suite.

Evidence: [browser and transaction results](evidence/corner-prototype-browser.json),
[before-change defects](evidence/corner-correction-baseline.json),
[planar regressions](evidence/corner-prototype-planar.json), and the desktop/mobile
images above. Wrong-visible-top screenshots and supplied rendered certificates
are reproducible under ignored `research/output/corner-prototype/`.

From the repository root, using the existing standard-library Python reference
tools and the Node/Playwright setup in the original Stage 2 report:

```sh
python3 research/single-corner-stage1.py
python3 research/corner-crop-followup.py
python3 research/build-corner-prototype.py
python3 research/run-tests.py --unit-only
node research/corner-prototype-browser.test.cjs
```

The browser runner starts its own loopback server. A focused transaction run is
`node research/corner-prototype-transactions.test.cjs`. For a supported clean host,
the existing pinned setup is Playwright 1.63.0 and pngjs 7.0.0 with all three
browsers installed. This host reuses the previously documented pinned Chromium,
Firefox/WebKit storage and WebKit shared-library directory; no dependency files
or production files were changed. The planar browser command remains
`node research/seam-fix-check.cjs`, with MADWEAVE_RESEARCH_BROWSER set to each
engine and MADWEAVE_URL pointing to the root server's `editor.html`.

## Limits and review stop

The fixed certified catalogue and general 60-degree monochrome baseline are
preserved; examples are not the eventual allowed-angle list. Unsupported radii,
circle-through-vertex degeneracies and nonstandard cap ends remain Unvalidated.
The prototype is still a bounded double-precision diagram with the previously
recorded geometric tolerances, not a general interval-certified tessellator.
The new controls inspect existing positions; they do not edit construction
parameters or physical membership.

No persistence, arbitrary parameter editing, production integration, deployment
or merge was added. The existing planar application is unchanged. Diagram-
release acceptance and physical-validation acceptance remain separate, and no
claim of physical constructibility is made. **Stop here for review.**
