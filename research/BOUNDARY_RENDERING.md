# Boundary pixels and SVG rendering artifacts

The faint lines visible in magnified strips are classified as a **known SVG
clipping/compositing artifact**. Independent geometric checks find no missing
positive-area cells, and controls isolate pixel deviations to clipped rendering.
The subsequent [source isolation report](SEAM_ROOT_CAUSE.md) reduces the effect
to four rectangles, predicts the measured seam color, and identifies relevant
Firefox/Chromium source paths.

## Broader boundary and finite-end verification

[`boundary-matrix-check.cjs`](boundary-matrix-check.cjs) uses independently
constructed triangular cells and finite rectangles. It tests sizes 1, 2, 3,
and 8, all four spacings, and all eight C/X/hand configurations: 128 settings.
For each, four zoomed patches cover the center and representative finite ends
of H, R, and L strips.

Two-sided mask probes lie in distinct local-order cells, safely away from strip
edges. They are retained when the visible top direction is unchanged. Finite-end
pairs explicitly include a chosen physical strip on one side of its end and
exclude it on the other. Predictions use Euclidean membership and the original
pairwise rule, not SVG hit testing. World-space clearance is converted to screen
pixels before accepting a probe.

| Local Chromium result | Count |
|---|---:|
| Configurations | 128 |
| Zoomed patches | 512 |
| Passing pairs | 3,608/3,608 |
| Of these, explicit finite-end pairs | 384/384 |
| Passing side samples | 7,216/7,216 |

The color thresholds remain distance 28 and separation margin 15 for a 3×3 mean.
Exact clip-edge pixels are measured separately rather than subjected to interior
color expectations. This is broad representative coverage, not every point
along every finite end or boundary.

## Firefox and Chromium comparison

Both browsers rendered the same size-2, medium-spacing, ordinary-center SVG at
1198 × 826 pixels. The 18 strip paths and three populated mask paths had
**identical path and transform attributes**. The comparison captured:

1. The original direction-colored weave.
2. The same clipped weave with every strip opaque `rgb(40,90,140)`.
3. The same neutral physical union drawn through three unclipped direction
   references, preserving the strip geometry.

Single-pixel profiles cross ten mask boundaries whose two interiors predict
the same top color. Profiles use up to nine offsets within two screen pixels
of the boundary. Repeated rounded pixel coordinates are retained as profile
samples; they are not 90 distinct locations.

| Engine | Browser | Playwright | Maximum colored-seam RGB distance | Neutral clipped | Neutral unclipped |
|---|---|---|---:|---:|---:|
| Chromium | 145.0.7632.6 | 1.58.2 | 63.32 | 17.83 | 0 |
| Firefox | 155.0 | 1.63.0 | 63.32 | 17.83 | 0 |

These maxima are Euclidean RGB distances from the expected uniform color at
these profiles, not full-image error scores. Equal maxima do not mean the
images are identical: 5,369 pixels differed in the colored images, with maximum
per-channel difference 14 and mean per-channel difference about 0.0165 across
the whole frame. The small differences are consistent with different rasterizers
handling edge coverage slightly differently.

The neutral unclipped control is exactly the intended color at every profiled
location in both engines. The neutral clipped control lightens at some exact
seam pixels; the colored version also mixes colors. Removing clipping eliminates
the measured neutral-seam effect without changing physical geometry. This
supports a clipping/compositing explanation, rather than a positive-area hole
in the strip layout. It does not identify a specific browser-internal bug or
prove a particular antialiasing implementation.

An initial 3×3-mean neutral probe hid most of this narrow effect. Single-pixel
profiles were needed to measure it. Interior means and exact-seam profiles must
therefore remain separate in the regression suite. A future renderer improvement
may reduce these measurements; tests do not require an artifact to remain.

## Reproduction and artifacts

The full research runner performs both seam captures and
[`compare-seams.cjs`](compare-seams.cjs). Install Chromium and Firefox for its
Node Playwright client. Individual captures accept:

```sh
MADWEAVE_RESEARCH_BROWSER=chromium node research/boundary-matrix-check.cjs --seam-only
MADWEAVE_RESEARCH_BROWSER=firefox node research/boundary-matrix-check.cjs --seam-only
node research/compare-seams.cjs
```

These individual commands need a server, defaulting to port 8766; set
`MADWEAVE_URL` for another editor URL. The runner manages its own server.
Artifacts are in `research/output/boundary-matrix/`, with per-browser PNG/SVG/JSON
under `seam-only/chromium/` and `seam-only/firefox/`. The root `comparison.json`
is inside `seam-only/`. Browser/client versions are recorded automatically;
CI may use a different Firefox version matching its pinned Node client.
