# Stage 3C: one editor with planar and corner modes

Implementation follows [the Stage 3C instruction](SINGLE_CORNER_STAGE3C_PROMPT.md),
starting at `7ae5c06`. The planning edits to the accepted prompt are preserved.
This is branch integration, not deployment or a master merge. Physical
constructibility remains unverified.

## Control and behavior map

| Existing control | Corner behavior |
|---|---|
| Eight palette slots C0–C7 | Reused, RGB and opacity; select a slot and paint by pointing/clicking a joined strip |
| HSV sliders and four recent swatches | Reused; edits are atomic; canonical RGBA equality determines seam warnings, including aliases |
| Opacity OB | Reused after the user's explicit transparency clarification; complete SVG stacks use the existing isolated/filter/plus-lighter seam approach |
| Five pattern previews CP0–CP4 | Adapted to the five three-label formulas; staged with a pending construction, otherwise applied atomically to the current construction |
| Pattern counts CC1 / CC3 | Monochrome / three-label formula; CC2/4/5/6 explicitly unavailable in corner mode |
| a/b/c weave controls | Adapted to the corresponding certified triangle/large-hexagon/triangle membership; stage the phase, never remove material as a visibility shortcut |
| Strip hover and click painting | Adapted to whole connected component identity; hidden pieces, partners, fringe material and both self-crossing positions receive the same assignment |
| Lines L | Reused as visible material-edge outlines; hidden-piece inspection remains separately labeled |
| I / V, direction visibility H/R/L | Unavailable for corner material removal; no planar V recoloring surprise is copied |
| Size SC1–SC8, spacing N/M/W/E, C/hand/X | Unavailable as independent corner edits; exact settings belong to the certified phase/crop. All remain functional in planar mode |
| HB hide controls and hover help | Reused |
| Save / Open / Export | Shared actions dispatch by active mode; no second research-editor toolbar |

New controls are Planar/Corner, compact reference-angle/phase/crop settings and
grouped Apply, plus optional continuation/local-position inspection. The research
page remains an evidence artifact, not an embedded second editor.

**Later user decision:** seam color changes produce a vivid diagnostic marker
and hover/focus text rather than blocking an otherwise supported edit. This
supersedes the prompt's requested blocking behavior for palette-alias separation.
Material identity and continuation constraints remain: the coloring is reported
as conflicting, not Validated. Diagnostic markers do not recolor material.
The user also explicitly requested retaining palette transparency. This supersedes
the prompt's transparency exclusion. The renderer uses native SVG compositing
of complete ordered stacks; cross-browser evidence is required below.

## State, identity and transactions

The entry point remains `editor.html`. The two retained frames isolate the
original planar engine's globals. Corner mode rebuilds neither the planar design
nor its palette when switching back. Each mode retains unsaved palette values,
manual painting, view and selection in this session. Starting corner mode opens
an explicit certified construction, not a conversion of arbitrary planar edits.
The original `madweave.js`, planar `project.js`, SVG starters and all certificate
files are unchanged.

Corner custom painting uses sparse overrides keyed by the lexicographically
smallest occurrence in each independently certified component. Starting from a
formula preserves its other occurrence assignments, even if warned. Painting
one component assigns its entire joined material to the selected palette slot.
It never connects crossing strips. Fringe material, hidden pieces, seam partners
and both distinct local positions of a self-crossing retain their identities.
Custom assignments are labeled as formula plus overrides, rather than an
unchanged formula. Whole-strip keys and reference local positions, not UI indices,
are saved. A new construction has no assumed correspondence: the proposal
explicitly discloses replacement of custom colors, and Apply clears selection.

An edit restores/validates a fresh candidate and draws it detached before commit.
Shared workspace revisions invalidate older file/mode operations, including their
errors. Failed operations preserve active and inactive designs. Palette actions
reuse the original handlers and roll back both legacy globals and SVG controls
if validation or drawing fails. Grouped construction proposals remain visible
when Invalid or Unvalidated without changing the active drawing. View-only
changes preserve geometry, colors and identities.

RGBA equality normalizes integer RGB channels, rounds alpha to 1e−12, and treats
fully transparent colors as equivalent regardless of hidden RGB. Slot identity
is still checked independently of color equality. Splitting a palette alias or
changing opacity can expose color warnings. Warnings identify specific joins,
show vivid pink focusable/hoverable markers, and report that color continuity is
not Validated. Geometry/order/continuation failures continue to block atomically.
Diagnostic colors do not replace material colors. Transparency never removes
material or changes picking/compatibility geometry.

## Persistence, migration and artwork

[The file format](CORNER_PROJECT_FORMAT.md#integrated-corner-v3-and-shared-editor-envelope)
defines the shared editor envelope v1 and corner model v3. Save writes only the
active applied design with selection, palette/opacity/recent values and view.
The inactive mode and unapplied proposal are session-only. Save each mode
separately to retain both across closing the tab. Offline files bundle both
renderers, the full trusted finite catalogue, shared controls, preview images,
CSS and file actions. Reopening an active-only file starts the other mode at its
supported default when first requested.

Shared Open dispatches ordinary planar v1 JSON/HTML and original editable planar
SVG, plus actual Stage 3A v1 and Stage 3B v2 corner files. Corner migration retains
the exact construction/digest/parameters, original three opaque colors, formula,
view and reference selection, with explicit defaults for the five extra slots.
No occurrence is renamed. Imported runtime, SVG and saved validation flags are
not authority: only inert model data is read, then rebuilt from trusted assets.
The existing limits are preserved: 5 MiB for planar files, 10 MiB for corner
files, including generated projects. The shared input rejects files above 10 MiB
before reading, then applies the 5 MiB cap after planar dispatch. The research
prototype retains its existing 10 MiB limit.

SVG export is static diagram artwork with all required local definitions and
native ordered paint stacks. Export reconstructs from model state rather than
trusting screen SVG. Inspection, material-edge outlines and warning markers are
included only when the annotation checkbox is selected; warning counts remain
in caption and metadata in either case. SVG has no runtime/external references
and does not serve as an editable project or fabrication template. Planar export
continues to use the original cleanup path.

## Native SVG compositing and geometry bounds

The renderer maps material bands, exact arrangement cells, material-edge strokes,
selection and seam inspection through the same radius-preserving angular map.
Full band definitions and their occurrence/component identities remain available
for independent geometry checking. Within a certified constant-membership cell,
the actual paint uses full-cover rectangles in the certified bottom-to-top order.
It composites the complete RGBA stack before clipping once to that mapped cell.
Each clipped stack uses the existing planar isolated-stack, `filter:opacity(1)`
and `mix-blend-mode:plus-lighter` approach. Material-edge strokes, when requested,
are part of their material's stack/opacity; conceptual wedge cuts are not outlines.
The native SVG engine performs color/alpha compositing; there is no bespoke
raster color mixer in the product.

The first integrated attempt referenced already-antialiased band edges inside
cell clips. Visual inspection revealed double-coverage attenuation at their
shared boundaries. The full-cover stack fixes that by clipping once. A test
coordinate mistake also sampled outside the nested diagram into palette controls;
geometry probes still cover outside points, while flat-color pixels are now
restricted to the cropped disk. Neither adjustment changes reference geometry.

The real pointer test also reproduced a Firefox nested-SVG defect: the viewport's
`getScreenCTM()` returned identity while its graphics child returned the actual
view transform. Picking and renderer screen-scale calculation now use that
untransformed graphics child. This fixes both actual pointer painting and the
reported screen error bound; desktop/rotated/narrow browser checks exercise it.
Keyboard slider events also preserve subpixel client coordinates and clamp only
the supported [0,1] slider range (with a 1e−7 endpoint roundoff snap), preventing
a Firefox zero-opacity keypress from being rejected due to coordinate rounding.
Keyboard SVG controls use a non-scaling focus stroke rather than the browser's oversized outline on normalized slider rectangles. The planar engine handlers are unchanged. ResizeObserver notifications schedule
layout writes on the next animation frame, avoiding WebKit's undelivered resize
notification error during narrow-layout changes. Removed/inactive frames are
ignored by deferred layout work.

Analytic disk intersections and the existing adaptive straight-edge/circular-arc
bounds are preserved. The tolerance is `min(W/1000, .25/sigma)/8`, with the existing
1e−10 world-coordinate reserve, depth/budget failures and Unvalidated outcomes.
Display rotation and translation do not alter reference identity. SVG export
bounds are chosen at 1024 px width. These are geometric approximation bounds,
not a promise of identical browser pixels at anti-aliased edges.

The first per-cell native stacks still exhibited isolated exact-ray deviations:
6.44/255 in Chromium/Firefox and 9.54/255 in WebKit. The final unoutlined renderer
shares a compound clip among cells with identical complete ordered RGBA stacks.
This removes an unnecessary raster boundary while retaining every reference
cell, occurrence, component and local precedence. Actual paint assemblies are
fewer than reference cells; these are rendering batches, not merged strips.
Position-specific material-edge strokes keep their per-cell stacks when outlines
are enabled. The independent audit checks complete, unique cell-to-assembly
coverage, each compound clip's actual path and every stack's ordered colors.

Pixel audits compute independent source-over RGB from reference occupancy,
precedence, component overrides and palette/alpha. Interior, near-ray and exact-ray
flat pixels retain a 4/255 channel limit. Genuine color steps at warned seams and
optional position-specific edge inspection are treated as paint boundaries,
not tested against a one-sided flat-color expectation inside their antialias
footprint. The unchanged planar suite keeps its original fixture/neighborhood
tolerances. These are sampled raster checks, separate from the numerical geometry
bounds and exhaustive model/certificate checks.

## Verification and evidence

[Machine-readable results](evidence/corner-integration.json) distinguish exhaustive
model checking from browser samples:

| Check | Coverage / result |
|---|---|
| Independent reference build | All 84 unchanged certificates, including full radius-6 fringe material |
| Original family semantics | 268 compatible fixed-palette assignments, 236 witnessed formula conflicts, 6,192 exact/both-side boundary checks; 1,796,083 bounded mesh segments |
| Integrated semantics and independent color checker | 3,024 JSON round trips: all 84 × six formulas/mono × formula, RGBA alias, zero-alpha alias, sub-1e−12 alpha alias, custom eight-slot, custom three-slot variants; all actual material colors/slots covered; four additional alpha-rounding boundary cases checked independently |
| Checker negative controls | Wrong color (including hidden RGB at zero alpha), missing/duplicated material-color coverage and unknown component keys rejected with witnesses |
| Integrated Chromium / Firefox / WebKit | Eight representative constructions each: excess, self-crossing, 60° compact, 720° radius-6 fringe, large hexagon, both triangle phases and C-on; actual shared controls, painting, opacity, aliases and warnings |
| Actual paint negative control | Deliberately wrong top `<use>` at a known crossing rejected by normal paint/geometry audit and independent expected-color pixels; reference oracle unchanged |
| Legacy / offline shared workflow | Real planar v1 and actual Stage 3A/3B corner imports; native Open/file chooser, save/offline reopen/edit/resave in each mode; plain/annotated SVG rendered in separate documents; zero HTTP requests |
| Coherent failures / races | Failed initial mode asset fetch, palette and view redraw failures, ten bad-import classes including both file-size caps, Invalid/Unvalidated proposals, late file success/error after mode change, older import success after a newer rejection; active/inactive models, SVG, controls and selections retained, including palette edits in a planar frame first created offline |
| Existing opaque prototype | All nine certified examples in all three engines, including actual wrong-visible-paint negative control and keyboard/hidden inspection |
| Stage 3B browser regression | Nineteen family representatives per engine, grouped transactions/races, offline files and exports |
| Planar application | Eleven application browser tests in each engine; planar engine and state module unchanged |
| Planar seam regression | 163 configurations / 90,350 pixel samples per engine, all spacings and translucency; max channel error below 2.8/255 |
| Unit/site/build | All 18 unit-only research stages pass; static site builds 24 public files without publishing research artifacts |

The integrated pixel audit retains 4/255 limits. Representative flat pixels have
maximum channel error below 1.31/255 across the three engines, including compatible
translucent exact rays. A continuous monochrome translucent case includes 28 exact-ray
pixels (final wrap included); zero-opacity material remains complete and picks by
reference geometry. Exact boundary ownership, nonzero rotations and self-crossing
positions also retain the exhaustive kernel checks. Actual per-cell definitions,
compound-clip coverage and ordered paint colors are audited independently; the
certificate checker consumes reconstructed rendered definitions rather than a
saved Validated flag. Inspectable occurrence definitions remain complete even
when paint assemblies share identical color stacks.

For the negative control, hover redrawing is suspended only while the actual SVG
paint is deliberately corrupted, so a pending hover cannot repair the mutation
before inspection. Both paint and pixel audits reject it. The immutable reference
geometry and expected colors are never changed. Hidden legacy hover-help visibility
is omitted from rollback SVG comparisons because it is not displayed in corner
mode; drawing, active controls, palette globals and material selections remain
checked. This avoids calling transient hover text authoritative design state.

## Worked offline round trip

Open [the editable example](evidence/corner-integration-worked/editable.html)
directly from disk in a browser, with networking disabled. It is about 5 MB and
contains the shared editor plus the full catalogue, below the 10 MiB corner limit.
The example came from shared Open of the actual Stage 3A self-crossing file:
choose slot 7, opacity about 0.4, paint the selected joined strip, Save, reopen
offline, switch Planar → Corner and verify retention, cycle the local position,
paint/resave. [Round-trip state and hashes](evidence/corner-integration-worked/round-trip.json)
record the saved under-position `0:0:3` changing to `0:2:3` while both still belong
to the same global strip `0:0:3`. Geometry, partners, order and material identity
are unchanged. In the delivered file, try painting another component and Save
again; no repository or running server is needed.

[Plain SVG](evidence/corner-integration-worked/plain.svg) and
[inspection SVG](evidence/corner-integration-worked/inspection.svg) are standalone
artwork, not editable projects or fabrication templates. The inspection export
explicitly includes selected/hidden material and seam partners. Desktop and
narrow screenshots show the
[worked design](evidence/corner-integration-worked/desktop.png) /
[narrow controls](evidence/corner-integration-worked/narrow.png), plus a
[warned translucent 480° diagram](evidence/corner-integration-worked/warnings-desktop.png) /
[narrow warning view](evidence/corner-integration-worked/warnings-narrow.png).
To reproduce the warning view, start Corner, click Direction (CP0), choose slot 1,
focus opacity and press Left 25 times. It retains 12 witnessed seam color changes
with pink markers while allowing continued editing and transparency.

## Reproduction

From the repository root, serve the checkout:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open <http://127.0.0.1:8000/editor.html>, choose Corner, then use the same palette
and click painting as in Planar. Apply phase, angle and crop together. CP previews
and CC1 stage a replacement formula while a construction proposal is pending.
Use optional inspection to select a complete strip or a local crossing position.
Palette buttons accept Enter/Space, sliders also accept left/right arrows; the
inspection selectors and Paint selected strip supply keyboard painting.

Rebuild/check the deterministic assets and exhaustive models:

```sh
python3 research/build-corner-package.py
python3 scripts/build_corner_runtime.py
node research/corner-family.test.mjs
node research/corner-integration.test.mjs
python3 research/run-tests.py --unit-only
```

Browser checks require Playwright and pngjs available to Node and installed
Chromium/Firefox/WebKit. The browser scripts start/stop their own loopback server:

```sh
node research/corner-integration-browser.test.cjs
node research/corner-prototype-browser.test.cjs
node research/corner-family-browser.test.cjs
```

`MADWEAVE_STAGE2_BROWSERS=chromium` limits a diagnostic run to one engine.
`MADWEAVE_CHROMIUM_EXECUTABLE` can select the installed Chromium binary.
Normal application tests are `python -m unittest discover -s tests -v` with
`MADWEAVE_BROWSER` selecting the engine. The separate planar seam regression is
`node research/seam-fix-check.cjs` against a served `MADWEAVE_URL`, with
`MADWEAVE_RESEARCH_BROWSER` selecting the engine.

## Remaining scope and review gate

This is still the finite prototype catalogue: 84 constructions, 24 witnessed
phase/order failures and 108 out-of-scope crop/phase entries. The general 60°
monochrome madweave baseline is preserved; this catalogue is not a final
allowed-angle list. W/P remains 3/4. Arbitrary radius/spacing, new geometric
families, unrestricted planar-to-corner conversion, material removal, complete
planar keyboard access, undo/autosave, physical touch-device testing and installed
Safari verification are outside this delivery. Physical stock assumptions and
all confirmed continuation/order constraints remain as documented in Stage 1.
No custom-cut stock is silently substituted. Physical constructibility remains
unverified; a documented physical example is required for physical validation or
fabrication-ready outputs. Stop for review before merge, deployment or expansion.

## Review correction: consume immediate formula intent

The [review](SINGLE_CORNER_INTEGRATION_REVIEW.md) found that an immediately
applied CP/CC1 formula left `replaceColors` pending. An unchanged Apply then
cleared custom paint added after that formula. The new native-control regression
fails on `2029873` in Chromium: `{pattern:1, overrides:{"0:0:3":7}}` becomes
`{pattern:1, overrides:{}}`.

Only formula proposal bookkeeping is corrected. Immediate success consumes the
replacement intent. Immediate failure discards the failed choice and rebuilds
the proposal from the retained active formula, using `corner.edit`'s boolean
result. Deliberately staged formulas remain queued until Apply; a failed staged
Apply retains the proposal for retry. A successful grouped Apply consumes it.
The existing intentional formula-button reset of manual colors is unchanged.

[Correction evidence](evidence/corner-paint-correction.json) records the actual
before/after result. Chromium 145.0.7632.6, Firefox 155 and WebKit 26.6 pass nine
transaction scenarios online and the same nine in the committed worked file
with HTTP blocked: CP1/CC1 → paint → unchanged Apply directly, after a mode return,
and after moving construction controls away/back; failed immediate redraw;
staged failure/retry; and intentional staged recoloring after returning geometry
to its original values. Assertions compare the complete saved design, including
custom material, selection, palette, view and construction. Offline resave,
reopening and another formula/paint/Apply cycle also pass in each engine.

The full existing integration suite's eight representatives per engine pass,
including paint/pixel audits, imports, races, planar mode and exports. Four Node
math tests, five Python site tests, and the semantic suite (84 constructions,
3,024 round trips / 3,028 independent cases) pass. Syntax checks and
`git diff --check` pass. Geometry research, historical prototype and planar seam
suites were not rerun for this bookkeeping-only correction.

The worked editable HTML updates only its bundled `editorScript`; its saved
model and all other runtime assets remain unchanged. Its hash is refreshed in
`round-trip.json`. No generated corner core, certificate, rendering code, palette
semantics or file format changes are needed. Earlier verification tables and
`corner-integration.json` remain the historical delivery record; the correction
evidence above contains the current wrapper/test/artifact hashes. No master
merge, deployment, broader stage or physical validation is authorized here.
