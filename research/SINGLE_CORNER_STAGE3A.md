# Stage 3A handoff: portable editable corner diagrams

Starting from `ac9cdc3` on `docs/single-corner-prompt`, this completes the bounded
[Stage 3A instruction](SINGLE_CORNER_STAGE3A_PROMPT.md): editable save/open,
offline reopening/resaving and static SVG for the existing nine certified
constructions. The corrected Stage 2 transactions and production planar
application are preserved. Stop here for review before expanding Stage 3.

The catalogue is prototype scope, not the eventual allowed-angle list. The
general madweave monochrome baseline of multiples of 60° and pattern-specific
restrictions remain. Other radii, circle-through-vertex and nonstandard cap-end
cases remain **Unvalidated**. All nine catalogue constructions explicitly pass
open-strips-only compatibility. Physical constructibility remains unverified.
Diagram-release and physical-validation acceptance are separate gates; this is
neither whole-project approval nor authorization for fabrication or deployment.

## View, save, open and export

From the repository root:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open **http://127.0.0.1:8080/research/corner-prototype/**. The committed package
is ready to view without a build or dependency install. This remains separate
from `editor.html`, whose planar version-1 project meaning is unchanged.

Choose a certified example, compatible material coloring and view/inspection
settings. **Save editable project (offline HTML)** downloads a `.corner.html`
file containing model state, the full nine-example catalogue and application
runtime. Close the server, disconnect networking and open that saved file in a
browser. Example/color changes, reference certificates, keyboard crossing/strip
inspection, local-position cycling, view controls, resaving and SVG export work
locally. **Open editable project** restores a saved file into either the served
prototype or an already open standalone file. Resaving produces a fresh standalone
document, rather than embedding the old rendered DOM repeatedly.

**Export static SVG artwork** produces a script-free, self-contained SVG. By
default it excludes inspection overlays. Check **Include current inspection
annotations in SVG** to include enabled visible boundaries, dashed hidden-piece
inspection, seam rays/partners and orange whole-strip selection. This does not
change material geometry, colors or identity. The output legend, description and
metadata identify inclusion/exclusion. SVG is artwork, not an editable project
or fabrication template. Its visible legend states physical constructibility
is unverified. No stock-specific units, cutting allowances or calibration claim
are added.

## Worked offline round trip

These committed files were produced through the actual browser controls, with
networking disabled during reopening, editing, resaving and exporting:

1. Open [01-self-23.corner.html](evidence/corner-stage3a-worked/01-self-23.corner.html)
   locally. It is the certified 120° monochrome self-crossing example, display
   rotation 23°, inspecting reference XY=(3/2,1/2). Positions `0:2:3` (OVER) and
   `0:0:3` (UNDER) belong to the same global strip `0:0:3`. The active position
   is UNDER. Cycle with **Next local position at click** and back: the active
   occurrence changes while the strip identity remains the same.
2. Set display rotation to 90° and save. The recorded result is
   [02-self-90.corner.html](evidence/corner-stage3a-worked/02-self-90.corner.html).
   Close/reopen it offline. Both occurrence identities, the active UNDER
   position, material graph, partners and order are retained; only the saved
   view rotation differs. This example has 12 occurrences, 6 joins, 6 open
   strips, 24 assembled centerline crossings and 2 legitimate self-crossings.
3. Export with annotation inclusion unchecked:
   [03-self-artwork.svg](evidence/corner-stage3a-worked/03-self-artwork.svg).
   Then enable the inspection overlays and inclusion checkbox:
   [04-self-inspection.svg](evidence/corner-stage3a-worked/04-self-inspection.svg).
   Open either SVG directly in a browser or SVG viewer. The material model is
   the same; the latter explicitly includes hidden/selection annotations.

The [worked state record](evidence/corner-stage3a-worked/round-trip.json) captures
the before/after state and both active positions, with zero HTTP(S) requests.
For a fresh reproduction, select the 120° example, Monochrome, rotation 23°,
disable seam rays, choose the interior crossing labeled as self-crossing, and
cycle once to UNDER before following the steps above. The HTML files need no
repository server. Local-file browser operation is tested on the desktop engines
below, not every mobile OS file association or download manager.

## Authoritative state and transaction behavior

The [version-1 format specification](CORNER_PROJECT_FORMAT.md) defines the schema,
construction version/digests, coordinate conventions, identity keys, import
statuses and envelopes. Construction ID, catalogue version, certificate digest
and exact parameters pin the supported model. Material pattern, view flags and
stable joined-strip/local-occurrence identities are editable state. A saved SVG
or “Validated” flag never supplies authority. Unknown fields are rejected.

Opening reads only inert model JSON from imported HTML. Its executable runtime,
SVG, styles, statuses and bundled certificates are ignored. A fresh model is
rebuilt from the application's trusted catalogue; compatibility, local reference
occupancy/order and selection correspondence are checked again before drawing.
The bundle build independently validates all nine full region certificates and
their exact coverage partitions. The browser relies on this pinned catalogue;
it is not a general supplied-geometry certificate checker.

Import read, parse, schema/parameter, compatibility, identity and detached-render
preparation must succeed before a synchronous commit. On failure the active
model object, SVG, controls, selection and inspector remain intact. Status names
the rejection and the retained reference design. Unsupported versions/catalogues
or constructions are Unvalidated; malformed/inconsistent states and witnessed
color conflicts are Invalid. The corner importer rejects ordinary planar
version-1 projects and SVG artwork. The unchanged planar importer rejects corner
files and continues reopening its own version-1 files.

File reads share the Stage 2 revision guard with example fetches and subsequent
view, color, inspection, save and export actions. Neither an old successful file
read nor its later error can overwrite a newer operation, even a newer rejected
import. Save/export use committed state and invalidate older pending operations.
Downloading reports a file was prepared, not that a disk-write dialog completed.

The extra controls initially made the grid stretch the drawing down the page.
The drawing now aligns at the top of its panel. Existing pointer regressions
explicitly scroll the SVG into view before calculating viewport click coordinates;
they still exercise real pointer events. Exact mathematical ray selections use
the kernel selection API because browser pointer coordinates are quantized.
The final offline walkthrough also reproduced Chromium blocking a certificate
data URL as top-level navigation. Standalone files now explicitly download that
inline JSON through **Save supplied reference certificate**; its real-click
download and exact reference contents pass in all three engines without requests.

## Verification

All checks pass with Chromium 145.0.7632.6, Firefox 155.0 and WebKit 26.6,
Playwright 1.63.0 and pngjs 7.0.0. These are desktop/headless engine checks.

| Check | Result per engine |
|---|---|
| Save/open/offline edit/resave | All 9 examples, all 33 compatible example/pattern pairs; rotations 0/23/90/−137 and representative view/selection states |
| Semantic comparisons | Exact component membership, all seam joins, crossing coordinates/pairs, pair order, occurrence colors and authoritative selection state; includes radius-6 fringes and both self-crossing positions |
| Independent exported SVG documents | 30,899 material/order/paint probes across the 33 exports, including 6,526 probes approaching both sides of seam rays and 11,787 empty-gap probes |
| SVG pixels | 3,960 safe unannotated color probes, plus selected annotated-export pixels away from inspection strokes; at most 3 channel levels error |
| Annotation inclusion | All 9 monochrome examples exported with explicit annotations; unchanged material geometry/identity and independent certificate checks |
| Invalid/current failed imports | 20 schema/version/parameter/digest/color/identity/parse/read/render cases; complete state retained, reason reported |
| Overlapping operations | 10 stale read/error and file↔example/view/color/inspection/save/export/rejected-import cases through real controls |
| Offline runtime | No HTTP(S) requests; compatible color edits, keyboard crossing inspection, cycling, resaving, catalogue switching and exporting work |
| Boundary/format isolation | Empty hole, first/interior rays and final-wrap selection persistence; separate planar version-1 round trip and reciprocal format rejection |
| Existing prototype suite | All 9 examples, 6,665 reference probes, 2,424 exact-ray/seam/wrap tests, 17 Stage 2 failure/race cases, and actual wrong-visible-top negative control |
| Existing planar renderer | 163 configurations / 90,350 samples, source-over seam checks, script-free SVG image export and negative control |
| Existing application suite | All 11 browser tests, including planar offline save/open/resave at all four spacings |

The semantic comparison is not screenshot equality. Export audits read the actual
SVG definitions, unique occurrence identities, reference vertices, local cell
stacks, component/join/crossing metadata and material colors. These are passed
back to the independent Python checker. Every exported certificate and partition
passes, including annotated cases. Separate direct SVG documents render without
application scripts or external assets, and are compared to unchanged independent
oracles plus analytic near-seam probes. Pixel probes add visible-paint evidence;
they do not replace full reference coverage checks.

Chromium and Firefox use offline emulation and denied HTTP(S) routes. WebKit's
emulated-offline switch also blocks `file:` navigation, so its file tests deny
both network protocols instead. All engines record and require zero attempted
HTTP(S) requests. Actual standalone HTML does not fetch certificates or modules.

The Python/Node reference reproductions preserve the original 89-case results,
all 137 circular-crop cases, the nine certificate counts, color outcomes and
independent oracles. No material or count was dropped to make persistence pass.
The 18-stage planar unit/site suite also passes. Production application code,
planar project schema and publication allowlist are unchanged.

Evidence: [portable-diagram browser results](evidence/corner-stage3a-browser.json),
[boundary/offline/format isolation](evidence/corner-stage3a-isolation.json),
[existing prototype and planar regression summary](evidence/corner-stage3a-regressions.json),
and the worked files above. Full generated exports and reconstructed certificates
remain under ignored `research/output/corner-project/`.

## Reproduce

The committed HTML prototype and worked files need no build for viewing. For
source changes, rebuild reference data and then the standalone runtime:

```sh
python3 research/single-corner-stage1.py
python3 research/corner-crop-followup.py
python3 research/build-corner-prototype.py
python3 research/build-corner-package.py
python3 research/run-tests.py --unit-only
node research/corner-project-browser.test.cjs
node research/corner-project-isolation.test.cjs
node research/corner-prototype-browser.test.cjs
```

The package builder checks all nine certificates and deterministically embeds
the current kernel, project validator, packager, app, template and CSS in
`corner-prototype/bundle.mjs`. Regenerate it after changing any of those inputs.
Saving an offline file embeds that bundle once; subsequent resaves have constant
structure rather than recursively embedding old documents.

On a supported clean host the browser setup is:

```sh
npm install --prefix /tmp/madweave-stage3a-deps --no-save playwright@1.63.0 pngjs@7.0.0
export NODE_PATH=/tmp/madweave-stage3a-deps/node_modules
/tmp/madweave-stage3a-deps/node_modules/.bin/playwright install chromium firefox webkit
```

Use Playwright's supported system-dependency installation where needed. This
host reused the pinned Chromium executable, Firefox/WebKit browser directory and
WebKit library path documented in Stage 2. `MADWEAVE_CHROMIUM_EXECUTABLE` selects
that external Chromium for these prototype tests; no production launcher changes.
The normal prototype runner and both new test scripts start loopback servers
themselves. `MADWEAVE_STAGE2_BROWSERS=chromium` can focus the round-trip runner.

Planar renderer reproduction remains `node research/seam-fix-check.cjs` with
`MADWEAVE_RESEARCH_BROWSER` set to each engine and `MADWEAVE_URL` pointing to a
root server's `editor.html`. Application regressions remain
`python -m unittest discover -s tests -p test_browser.py`, using the existing
Python Playwright environment and `MADWEAVE_BROWSER` for each engine. The local
Chromium tests used an external launcher override to its pinned executable.

## Remaining limits and review stop

This is the fixed nine-example prototype with the existing five formula-based
patterns and monochrome. It adds no arbitrary angle/radius/center/stock editing,
per-strip painting, palette editing, history, autosave, migration, new geometric
families or production integration. Unsupported radii and degeneracies remain
Unvalidated; the finite catalogue does not supersede the general 60° baseline.

The bounded double-precision drawing and coordinate tolerances are unchanged.
At the 1024-unit export target, the world tolerance is at most 0.00009375 P;
metadata records actual bounds. Scaling SVG in another viewer scales pixel
error; this is not an interval-certified tessellator or fabrication guarantee.
Reference material remains ideal straight constant-width, zero-thickness ribbons
with the certified full-width, face/side-preserving seam transport. Physical
assembly, finite thickness and straight-stock realizability remain unverified;
custom-cut stock was not silently substituted.

No fabrication outputs, deployment or master merge occurred. The tree
investigation was not reopened. **Stop for review before any Stage 3 expansion.**
