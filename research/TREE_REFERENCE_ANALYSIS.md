# Recovering the geometry of tree.png

The evidence identifies **`coneFraction = 3/4` in the code's angular-multiplier
convention**. The corresponding reference/paper-angle fraction is **4/3**:
480 reference degrees displayed in one turn, or 120 degrees of excess angle.
These reciprocal quantities must have different labels in the new UI.

The corner is the small white opening near **(218,228)** in the 436 by 436 PNG,
using zero-based pixel-index coordinates. It sits immediately above the long
vertical white gap between a gray trunk strip on the left and a teal trunk strip
on the right. It is about ten pixels below the bitmap midpoint, and is not one
of the enclosed white holes farther up the fan. Raster measurements use the
representative center `(217.5,227.5)`; that is screen position `(218,228)` when
pixel centers are accounted for.

This is a forensic reconstruction for prompt preparation. No production engine
setting, application UI, or project format was changed. The user explicitly
authorized looking backward from long strip edges, counting the upper-half
tracks, and trying different angles in isolation.

## 1. Calculate backward from one long edge

The existing dormant transformation preserves radius and multiplies unwrapped
angle:

```text
r_out = r_in
phi_out = f * theta_in
```

Absorb the image's rotation/branch choice into the canonical reference-frame
orientation. If an original long edge has direction alpha and signed normal
offset b, inverse-transforming a point on it must give

```text
r * sin(phi/f - alpha) = b
```

That quantity is constant along a straight reference edge. This provides a
numerical check of a curved output edge without building the new cone feature.

The measured curve is the **left long edge of the outer gray trunk strip**,
from rows 275 through 410: 136 samples. Its neighbors identify the antialiased
edge between the first solid gray pixel and the adjacent background/under-strip
color. In the recovered frame alpha=120 degrees. Example measured coordinates:

| PNG row y | Estimated boundary x |
|---:|---:|
| 280 | 91.116 |
| 300 | 98.107 |
| 320 | 102.770 |
| 340 | 105.919 |
| 360 | 108.044 |
| 380 | 109.500 |
| 400 | 110.500 |

With the recovered center fixed, a scan followed by least squares gives
**f=0.7498586**, with an RMS deviation from a straight reference edge of
**0.107 inverse-coordinate pixels**. This is evidence for the simple rational
value 3/4, not a reason to store 0.7498586 as a new project parameter.

| Trial multiplier | RMS variation of recovered line normal, pixels |
|---:|---:|
| 1/2 | 66.23 |
| 2/3 | 18.37 |
| **3/4** | **0.110** |
| 4/5 | 8.00 |
| 6/7 | 14.84 |
| 1 | 24.70 |
| 4/3 | 30.25 |
| 3/2 | 30.14 |

Allowing the center and multiplier to move together, starting from the bitmap
midpoint, gives approximately `(220.5,226.9)` and f=0.7510. A single nearly
straight tail constrains the exact center less strongly than the multiplier;
registration against the rest of the image locates the opening near (218,228).
The fixed-center fit's precision must not be mistaken for an uncertainty bound
on every recovered parameter.

The result also distinguishes radius-preserving angular rescaling from a
conformal power map: in the latter, inverse radius changes as well. It is the
existing radius-preserving transformation that reproduces the reference.

## 2. Corroborate with model-assisted upper-half tracks

Trace the cut ends/tracks in the upper half, above the corner's horizontal
level. Some short cut ends are partly obscured by crossings, so follow their
visible continuation rather than treating every white break as a new strip.
The replay-assisted count is:

| Upper-half group | Ends/tracks |
|---|---:|
| Green, toward the top | 6 |
| Gray, toward the upper left | 6 |
| Teal, toward the upper right | 6 |
| Gray, toward the right boundary of the half | 3 |
| Teal, toward the left boundary of the half | 3 |
| **Total** | **24** |

The ordinary reference has six strips in each of three planar families, giving
18 ends/tracks in a half-turn. Thus the tree's upper half contains four bundle
equivalents instead of three:

```text
reference angle / displayed angle = 24/18 = 4/3
code angular multiplier           = 18/24 = 3/4
upper half's reference angle       = 180 * 4/3 = 240 degrees
full-turn interpretation           = 480 reference degrees
```

Count ends/tracks in the half, not the total number of complete physical strips.
The lower part is incomplete; counting the whole image as a completed corner
would give the wrong conclusion. The generated numbered figure uses the
historical replay to place labels on these tracks. The label positions are an
inspection aid, not an independent estimator of f. The Python report reads these
replay endpoints and names the count `replayEndpointOccurrences`; it does not
detect or independently count raster endpoints. The planar 18-track comparison
also assumes the inferred six strips per family. This corroborates the selected
model and must not be treated as a separate observation determining f.

## 3. Replay the historical renderer at several multipliers

The initial repository import, commit
`0402b15c2b0f55955d99e606a2e5df15a0d7eee1`, contains the exact dominant palette
of `tree.png`:

```text
green = rgb(153,192,133)
gray  = rgb(149,168,161)
teal  = rgb(99,161,144)
```

[`tree-reference-render.cjs`](tree-reference-render.cjs) extracts that immutable
historical engine into disposable browser pages. A close reconstruction uses:

| Parameter | Replay setting |
|---|---|
| Angular multiplier | 3/4 |
| Radius | Unchanged, as in the existing code |
| Display rotation | -90 degrees |
| Base size | 2: six source strips per family, 18 total |
| Strip width / gap | 1 / 0.33 |
| Finite strip length | 10 |
| Center/order flags | `starMadWeaveCenter=false`, historical `alternate=true` |
| Historical sampling | 64 points per rectangle edge |
| Registration | Scale 35.7 CSS pixels per reference unit; screen origin (218,228) |

The currently checked-in old engine defaults to a different strip length and
disabled angular mapping. The replay settings are inferred reconstruction
settings; there is no saved original tree project to establish every original
UI value. In particular, absolute scale and an overall radius multiplier cannot
be recovered independently from a raster with no physical calibration.

For a fixed registration and the same remaining replay settings, Chromium
145.0.7632.6 produces:

| Multiplier | Mean absolute RGB channel error | Occupied/empty pixel agreement |
|---:|---:|---:|
| 1/2 | 34.94 | 71.80% |
| 2/3 | 25.73 | 79.02% |
| **3/4** | **0.80** | **99.59%** |
| 4/5 | 20.76 | 83.30% |
| 6/7 | 23.67 | 82.34% |
| 1 | 27.72 | 81.31% |
| 4/3 | 34.93 | 74.14% |
| 3/2 | 32.48 | 75.05% |

Channel error is over the whole PNG on a 0–255 scale. The occupied/empty measure
classifies a pixel as occupied when its minimum RGB channel is below 245. It is
not an exact geometric coverage proof. The close match allows ordinary
historical-versus-current rasterization and subpixel registration differences;
it is not a claim of bit-for-bit recovery.

There is also a historical naming trap: this imported engine has
`directionsPerCircle=6`, so f=3/4 corresponds to `numberOfDirections=8`.
Today's engine has `directionsPerCircle=3`, giving N=4 for the same f.
Do not confuse the old count of eight angular slots with a different fraction.

## What the prompt should take from this

Start with the **tree's radius-preserving angular chart**, with f=3/4 as its
reference example. Do not leave the tree center and map as questions for the
user. Separate the paper-angle ratio 4/3 from the code multiplier 3/4. A useful
future control readout is:

```text
Reference angle: 480 degrees (4/3 turn)
Excess angle: 120 degrees
Angular multiplier / legacy coneFraction: 3/4
```

The picture is a partial historical rendering. It does **not** establish that
all missing lower tracks, identified edges, and three-color strip continuations
can be completed consistently. Geometry, crossing order, material color, and
physical strip identity still need the planned seam validation.

A concrete future color check follows from the existing symmetry report:
480 degrees is 120 degrees modulo a full turn. About the ordinary reference
center, that rotation cycles H/R/L directions while preserving ordinary a/b/c
classes. Consequently, three distinct **direction colors** are not invariant
under that identification, whereas **class coloring** is a candidate that is.
This is a source-based symmetry deduction, not an executed completion or a
physical construction certificate. Test the actual continuation graph before
accepting either configuration. The mere presence of three colors in the
incomplete tree image does not settle that question.

The curved SVG bands are the image of straight reference strips under this
coordinate map. That does not by itself require physically cutting curved
paper strips. It also does not make the distorted display a dimensionally
faithful fabrication net. Keep that distinction in the project specification.

## Reproduce

Install the existing Node research dependencies and Chromium, then optional
Python forensic dependencies `numpy`, `scipy`, `Pillow`, and `matplotlib` in a
suitable external environment. From the repository root:

```sh
node research/tree-reference-render.cjs
python3 research/tree-reference-analysis.py
```

The first command needs the historical commit in the local Git object database.
No server is needed. Output goes into ignored `research/output/tree-forensics/`:
`curve-analysis.json`, `angle-comparison.json`, `endcaps.json`, the eight
standalone SVG/PNG trials, `reference-measurements.png`, and
`angle-comparison.png`. The Python script measures the supplied PNG; the Node
script replays existing historical code. Neither changes the application.
