# Stage 2: separate single-corner diagram prototype

**Later bounded authorization:** [Stage 3A](SINGLE_CORNER_STAGE3A.md) adds portable
editable save/open, offline reopening and static SVG for these same nine
constructions. The scope/hold statements below describe the original Stage 2
checkpoint; the rest of Stage 3 and production integration remain on hold.

**Correction pass from `951bc4c`:** [coherent transactions and visible-paint
validation](SINGLE_CORNER_STAGE2_CORRECTIONS.md) records reproduced failures,
the completed fixes, the actual visible-paint mutation, and optional monochrome
crossing inspection with desktop/mobile examples. Stage 3 remains on hold.

Work starts from `1bcb2ea` on `docs/single-corner-prompt`. The user authorized
Stage 2 only: a separate inspectable visual prototype using the certified
reference constructions. This deliverable stops for review before Stage 3.
Production application files and the existing planar editor are unchanged.
Physical constructibility remains unverified; this is a diagram, not a cutting
template or a completed product release.

## View the prototype

From the repository root:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open **http://127.0.0.1:8080/research/corner-prototype/** in a browser. Choose
another free port if needed. The committed examples are ready to view; no build
step or installed JavaScript dependencies are needed for viewing. Serve over
HTTP because the page loads its fixed JSON certificates and ES modules.

The entry point is [corner-prototype/index.html](corner-prototype/index.html).
It has simple example, material-color and display-rotation selectors, whole-strip
selection, piece outlines, seam markers and local-position cycling. Select a
strip from the list to inspect even fully hidden pieces. Click an overlap and
use “Next local position at click” to inspect its other material positions.
The inspector lists all joined occurrences and seam partners. Orange outlines
are inspection annotations, including hidden parts and conceptual sector cuts.

The default is the radius-6 480-degree example in compatible three-class colors.
The figure rotates by 23 degrees initially and has a nonzero display center.
Reference-center coordinates are recorded in the certificate panel; the displaced
300-degree example also exercises a nonzero reference center.

## Certified examples and color behavior

All examples use W/P=3/4. The page exposes a **finite research catalogue**, not the
eventual allowed-angle list. The general monochrome madweave 60-degree baseline
and pattern restrictions remain in force.

| Example | R/P | Sectors | Local pieces | Open strips | Purpose |
|---|---:|---|---:|---:|---|
| Madweave 360 degrees | 3 | 3 x 120 | 36 | 18 | Planar reconstruction through the new pipeline |
| Madweave 240 degrees | 3 | 2 x 120 | 24 | 12 | Deficit example |
| Madweave 480 degrees | 6 | 4 x 120 | 96 | 48 | Excess example, including both fringe bands per unit |
| Madweave 300 degrees | 3 | 5 x 60 | 45 | 15 | Monochrome 60-degree baseline, k=(0,2,-2) |
| C-on madweave 480 degrees | 3 | 4 x 120 | 48 | 24 | Mixed direction+class coloring succeeds where fixed class colors conflict |
| Madweave 120 degrees | 3 | 1 x 120 | 12 | 6 | Two legitimate self-crossings of open strips |
| Hexweave large hexagon, 480 degrees | 7 | 8 x 60 | 48 | 16 | Required large-hexagon hole family |
| Hexweave triangle -y, 480 degrees | 7 | 4 x 120 | 36 | 20 | Required triangle orientation |
| Hexweave triangle +y, 480 degrees | 7 | 4 x 120 | 36 | 20 | Opposite triangle orientation |

The standalone [reference checker](check-corner-certificate.py) validates each
input certificate and all five fixed-color alternatives. Compatible choices
show the number of actually used distinct colors. A three-slot palette that
uses two colors, or class coloring of a single hexweave, is labeled accordingly.
The three hexweave examples default to group coloring with three used colors.
The 300-degree example permits monochrome; all five fixed three-color formulas
have explicit join-conflict witnesses there. This does not exclude a different
custom global-strip coloring.

Choosing an incompatible pattern shows the actual conflicting pair of local
positions and retains the previous diagram and color assignment. Unsupported
examples/radii return Unvalidated and retain the active diagram. Arbitrary
radius editing, material painting and grouped parameter editing belong to the
later product stage; their accepted requirements are preserved.

## Corrected self-crossing mutation

The earlier crop follow-up used `crossings.pop()`, which did not establish that
the removed event was a self-crossing. The mutation now constructs an occurrence
to global-component map, selects two **distinct** local positions with the
**same** component, asserts both conditions and only then collapses the second
position onto the first. The checker rejects this supplied certificate.

The recorded witness selects `(0,0,3)` and `(0,2,3)`, both in strip 0, at
reference XY=(3/2,1/2). The corrected
[crop evidence](evidence/corner-crop-followup.json) includes this selection.
The browser tests independently find such an event, verify both positions are
returned, and verify that cycling changes the local position while keeping the
same selected joined strip. Geometric crossings never become graph junctions.

## Full material, exact regions and independent coverage proof

[build-corner-prototype.py](build-corner-prototype.py) creates the fixed
certificates and test oracles. Full positive-area band/sector/disk intersections
include the radius-6 fragments whose centerlines miss the wedge. The browser
uses no nearest-centerline rule to decide whether such a piece exists.

For drawing crossing order, the builder partitions the complete bounded wedge
with every material band boundary using rational arithmetic. It discards only
exact zero-area cells or empty material membership. It retains cells outside
the circle separately as `render_outside_cells`, and sends every positive-area
cropped cell to `render_cells`. No small positive cell is discarded through a
floating-point area threshold.

The independent checker now validates this optional partition without importing
the partition generator:

1. Every cell is convex, lies inside the reference wedge/box, and crosses none
   of the reference band-boundary lines. Its declared membership is recomputed.
2. Every cell has a distinct vector of sides of those lines, proving disjoint
   interiors. Exact twice-area sums for the cells of each band equal the area
   of that entire band/wedge/box intersection, proving complete band coverage.
3. Independent rational circle predicates verify that cells assigned outside
   have no positive cropped area and that every drawn cell has positive crop area.

This proves reference coverage without relying on renderer masks or probe counts.
The [reference evidence](evidence/corner-prototype-reference.json) includes
rejection of missing cells, duplicate cells, wrong members and falsely outside
material. The existing material/identity/continuation/color/overlap checker still
validates the underlying complete ribbons and local crossing orders.

## One map and bounded approximation

[kernel.mjs](corner-prototype/kernel.mjs) defines the common radius-preserving map
for every material band, order region, outline and selection outline:

```text
phi = displayRotation + f*(j*alpha + theta_local)
display = displayCenter + r*(cos(phi),sin(phi))
```

All source coordinates in this kernel are relative to the certified reference
center. The absolute reference center and transported signed source labels are
kept separately. Inversion subtracts the display center and display rotation
before choosing the unwrapped sector and dividing by f. Picking then tests
full finite band occupancy and returns distinct local positions, sorted by the
checked local order, plus their global strip IDs. It does not merge positions
with equal global IDs.

Exact rays use half-open sector ownership, with the final wrap assigned to zero.
A roundoff-only snap window of `64*Number.EPSILON*2*pi` radians resolves computed
exact rays. Tests approach every join from +/-1e-8 radians as well as evaluating
the ray itself, at rotations 0,23,90,-137 degrees. The snap window is far smaller
than the tested approach distance and the geometry approximation tolerance.
The certified empty hole is tested separately and returns no strip.

Disk clipping retains analytic line and circular-arc boundary types. Their
circle/line intersections are evaluated directly, rather than clipping against
a polygon approximating the disk. Lines use a second-derivative chord bound

```text
error <= |1-f^2|*cross(a,b-a)^2 / (8*rho^3)
```

where rho is the minimum radius of that straight subsegment. Subdivision uses
the bound on each subsegment and includes endpoints. Circle arcs use

```text
error <= R*(f*referenceSweep)^2/8
```

The target is `min(W/1000,0.25/sigma)/8`, with sigma the largest singular value
of the actual SVG-to-screen matrix. A 1e-10 world-unit numerical reserve is added
to every segment bound. The straight-edge depth limit is 24; circle subdivision
has a 20,000-segment limit. Failure is Unvalidated and never silently accepted.
Every band and order region is prepared before displayed geometry is replaced.
A forced failed example load is tested to retain the previous model and SVG.

The supported finite cases have maximum recorded bound below 0.00009375 world
units and 0.013 pixels at the tested desktop sizes. Tests also sample the true
midpoint of every tessellated segment against the actual drawn chord. The
reserve is engineering control for the bounded double-precision implementation,
not a general interval-arithmetic proof for arbitrary scales and degeneracies.

Every member of an exact order cell covers that entire cell. For the opaque
palette, its visible face is therefore exactly its checked top position. The
renderer maps those faces and fills each material color once as a nonzero-winding
compound SVG path. Shared internal edges cancel within a fill, preventing both
light gaps and additive bright seams between cells of the same color. Different
color faces have disjoint interiors, so this does not impose a global strip
stack order. All complete band paths, local order stacks, region masks and
occurrence IDs remain separately inspectable in SVG definitions and the model.
Grouping visible faces by color never groups or merges material identities.

## Browser and planar checks

[corner-prototype-browser.test.cjs](corner-prototype-browser.test.cjs) starts its
own loopback server. Across Chromium 145.0.7632.6, Firefox 155.0 and WebKit 26.6 it
checks each of the nine examples, including:

- 6,665 independent reference probes per browser, covering all 381 material
  occurrences as well as gaps. Actual SVG band and order-region containment,
  local order, actual opaque paint-union occupancy, local picking and global IDs
  must agree with the Python oracle.
- A supplied certificate rebuilt from actual SVG IDs, reference vertex sets,
  paint colors and local region-order records. The independent checker validates these
  records, including the exact cell coverage proof. Actual mapped SVG geometry
  is also checked by the probes and segment audits, rather than only metadata.
- 2,424 seam-side/exact-ray/final-wrap checks per browser, with four display
  rotations; empty-hole selection; whole-strip and radius-6 fringe selection;
  seam-partner overlays; both local positions at a self-crossing.
- Monochrome and all five fixed color choices, with explicit rejection and
  retention on witnessed conflicts. Compatible three-color examples use three
  actual material colors; the C-on and all required hole families are exercised.
- World/pixel error bounds, circular-arc segments, a resized mobile view, and
  forced depth/reserve failures. Unmapped band/order-region definitions are
  geometry controls. The original swapped `.face` position was only an unpainted
  order-metadata control; it did not change visible paint. The correction pass
  adds a real visible-top mutation rejected by the normal audit and screenshots.
- Actual screenshot pixels against reference material colors and gaps, including
  safe seam samples. Flat-color assertions require three-pixel clearance from
  real strip/circle edges; subpixel antialiasing at those physical edges is not
  asserted to be a flat interior color. Exact seam identity checks still cover
  the thin fringe intervals.

Firefox returns a zero `getBBox()` for paths in clip paths on this host; the test
uses its working `isPointInFill()` directly when the optional bbox shortcut is
unavailable. This does not change the rendered geometry or expected answers.

The existing planar unit suite (`research/run-tests.py --unit-only`) passes.
The unchanged production renderer's full `seam-fix-check.cjs` passes in Chromium,
Firefox and WebKit, including its opaque/translucent fixtures, actual editor,
visibility, outlines and SVG output checks. This is not a claim that the entire
application/browser suite or every future product acceptance fixture was run.

Evidence: [browser results](evidence/corner-prototype-browser.json),
[planar regression summary](evidence/corner-prototype-planar.json),
[independent probe inputs](evidence/corner-prototype-oracles.json) and
[reference/partition checks](evidence/corner-prototype-reference.json).
Reproducible screenshots and rendered certificate inputs are written under
ignored `research/output/corner-prototype/`.

## Rebuild and rerun

The reference code uses Python's standard library. From the repository root:

```sh
python3 research/single-corner-stage1.py
python3 research/corner-crop-followup.py
python3 research/build-corner-prototype.py
python3 research/run-tests.py --unit-only
```

For browser tests, use Node and the pinned clients in an external dependency
folder (the repository remains buildless):

```sh
npm install --prefix /tmp/madweave-stage2-deps --no-save playwright@1.63.0 pngjs@7.0.0
export NODE_PATH=/tmp/madweave-stage2-deps/node_modules
/tmp/madweave-stage2-deps/node_modules/.bin/playwright install --with-deps chromium firefox webkit
node research/corner-prototype-browser.test.cjs
```

`MADWEAVE_STAGE2_BROWSERS=chromium` limits a diagnostic run to one engine.
`MADWEAVE_CHROMIUM_EXECUTABLE` optionally selects an installed Chromium binary.
This host used the existing pinned Chromium executable under
`/tmp/madweave-chrome-pinned/chrome-linux64/chrome`, Playwright 1.63.0 under
`/tmp/madweave-firefox-deps`, Firefox/WebKit under `/tmp/madweave-browsers`, and
the existing shared-library directory `/tmp/madweave-webkit-libs/usr/lib/x86_64-linux-gnu`
through LD_LIBRARY_PATH. Host validation was bypassed only after those libraries
were supplied. These are test-environment workarounds, not repository dependencies.

The standalone checker can inspect any committed prototype certificate:

```sh
python3 research/check-corner-certificate.py research/corner-prototype/certificates/excess.json
```

For the existing planar browser regression, run the root HTTP server and set
`MADWEAVE_URL=http://127.0.0.1:8080/editor.html`, then run
`node research/seam-fix-check.cjs` with MADWEAVE_RESEARCH_BROWSER set to each of
chromium, firefox and webkit. With a nondefault executable, a disposable Node
launch override can select it; no production script change is required.

## Remaining limits and review stop

Only the committed fixed catalogue is exposed. Arbitrary radii, circle-through-
vertex degeneracies, nonstandard cap ends, new registrations, larger parameter
ranges, transparent material palettes and custom patterns remain Unvalidated
or deferred. Material is never dropped to obtain a passing diagram. No stock
substitution or physical construction claim is made.

The full product UI, arbitrary grouped construction edits, save/open, versioned
corner project state, offline round trips and export workflows belong to Stage 3.
Their acceptance requirements remain intact. This prototype's static certificate
inputs are checked at build/test time; it has no arbitrary certificate-import
workflow. The independent checker is available for direct inspection.

The accepted separate diagram-release and physical-validation gates are unchanged.
Passing this Stage 2 prototype does not satisfy all diagram-release/persistence
checks, and physical claims/fabrication outputs still require documented physical
evidence. The tree-image investigation was not reopened.

**Stop here for review. Stage 3 and merging into master remain unauthorized.**
