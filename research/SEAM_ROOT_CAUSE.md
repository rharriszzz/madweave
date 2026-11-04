# Source of the faint SVG seams

The renderer now includes the [tested solution](SVG_SEAM_FIX.md). This report
records the original mechanism; its reduction test explicitly restores the old
painting method before measuring it.

The faint lines come from **antialiased clip coverage being composited repeatedly
as transparency**. MadWeave paints separate direction stacks through adjoining
clip paths. At a shared edge, each stack contributes only fractional coverage;
source-over blending loses the fact that the two geometric regions are
complementary. Some lower-strip color and background remain in the pixel.

A reduced SVG with two clip triangles and four colored rectangles reproduces
**the exact pixel `[217,181,165]`** seen in the real weave, in both Chromium
145.0.7632.6 and Firefox 155.0. Away from the edge, the intended color is yellow
`[252,205,118]`. No script, strip-indexing logic, SVG `<use>`, or geometric gap
is required in the [standalone reproducer](fixtures/clip-seam-minimal.svg).

## Reduction of the actual SVG

[`seam-isolation-check.cjs`](seam-isolation-check.cjs) keeps the same viewport,
transforms, and device-pixel alignment while removing elements from the live
SVG. It watches pixel `(954,412)` near the horizontal boundary at normalized
point `(sqrt(3)/2,0)`. Only one R strip and one L strip cover this neighborhood.
The adjacent HRL/RLH groups both paint L below R; H is absent there.

| Reduction | Chromium pixel | Firefox pixel |
|---|---|---|
| Original weave | `[217,181,165]` | `[217,181,165]` |
| SVG isolated from controls and event handlers | Same | Same |
| Only the two physical strips retained | Same | Same |
| Only two relevant clip triangles, tight bounds | `[219,195,197]` | `[232,217,218]` |
| Two triangles with offscreen geometry extending clip bounds | Original pixel restored | Original pixel restored |
| `<use>` references replaced with four inline strip paths | Original pixel | Original pixel |
| Strip paths replaced by four full rectangles | Original pixel | Original pixel |
| Triangular clips replaced by complementary half-plane clips, with bounds preserved | Original pixel | Original pixel |

The bounds control matters. Trimming a clipping path can change its rasterization
bounds without changing the geometry near the sampled point. Tiny offscreen
triangles restore bounds that extend past the shared edge; they paint nothing
inside the viewed region. A reduction that changed the pixel at this step would
otherwise obscure the mechanism being investigated.

The final standalone fixture uses a diagonal shared edge inside both clip
bounding boxes, so it needs no offscreen bounds controls. Its shared line passes
through pixel centers. Moving that line shifts the bad pixel to a neighbor;
it does not remove the seam globally.

## Why the observed color is predictable

SVG permits antialiasing at clip edges and specifies source-over alpha blending.
See the [W3C clipping and compositing model](https://www.w3.org/TR/SVG11/masking.html#SimpleAlphaBlending).
For opaque background B, color C, and effective coverage a:

```text
newColor = a*C + (1-a)*B
```

At a symmetric edge, both adjoining regions cover half of the pixel. Even two
identical one-layer paints do not become one fully covered paint under this
operation: `0.5 + (1-0.5)*0.5 = 0.75`. A quarter of the old background remains.
The coverage represents different parts of the pixel, but blending treats it
like uniform transparency across the pixel.

MadWeave's selected point has **two paints per region**: purple L, then yellow R.
Across the two adjoining groups the effective draw sequence is L, R, L, R, with
half coverage for each. Applying source-over four times gives:

```text
result = (5/8)*yellow + (5/16)*purple + (1/16)*white
       = [217.1875, 180.9375, 165]
```

That rounds to the measured `[217,181,165]`. The lower purple has weight 31.25%
and white has weight 6.25%, despite the intended opaque yellow top surface.

With all paints set to neutral C=`[40,90,140]`, k paints per region leave
background weight `(1/4)^k` at the half-covered seam:

| Paints per region | Predicted neutral RGB | Observed in both browsers |
|---|---|---|
| 1 | `[93.75,131.25,168.75]` | `[93,131,168]` |
| 2 | `[53.4375,100.3125,147.1875]` | `[53,100,147]` |
| 3 | `[43.359375,92.578125,141.796875]` | `[43,92,141]` |

Small differences are consistent with finite coverage/color precision. The
standalone checks allow RGB distance below 3 from the analytic predictions.
For other subpixel alignments the diagnostic fits complementary coverages a
and `1-a` instead of requiring exactly 0.5; the original measured pixel fits
approximately a=0.502 within RGB distance 0.18.

## A one-group control isolates the lower-color leak

Removing the second clipped group still leaves purple in the seam pixel. With
one half-covered group, the direct clipped stack produces
`0.5*yellow + 0.25*purple + 0.25*white`, predicted
`[224.75,195.75,183]`; both browsers yield `[224,196,183]`.

An identity-filter control makes the group render its children into an offscreen
result first. The opaque yellow then fully covers purple before clipping. Its
half-covered edge predicts `0.5*yellow + 0.5*white`, or
`[253.5,230,186.5]`. Chromium yields `[253,230,186]` and Firefox
`[253,229,185]`. The change follows the compositing model within normal
coverage/color precision. This directly distinguishes clipping each child paint
from clipping the already-composited group.

Two problems are therefore visible: direct clipping of child paints leaks lower
colors, and separately compositing adjoining groups leaves background coverage.
Flattening the group changes the first problem but does not remove the second.

## Relevant browser source

The application attaches the clip to each permutation group and then appends
its ordered `<use>` children in [`buildStripsInternal`](../madweave.js). The
following renderer source paths explain how that representation reaches
antialiased painting.

In the Firefox 155 release source:

- [`SVGClipPathFrame::IsTrivial`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_155_0_RELEASE/layout/svg/SVGClipPathFrame.cpp#L300)
  selects the direct-clip route for a single unclipped geometry child. A compound
  path containing many triangles is still one geometry child.
- [`SVGIntegrationUtils::PaintMaskAndClipPathInternal`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_155_0_RELEASE/layout/svg/SVGIntegrationUtils.cpp#L842)
  installs that clip before invoking the child-paint callback, then restores the
  clip afterward. Normal painting proceeds under the clip.
- [`SVGClipPathFrame::ApplyClipPath`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_155_0_RELEASE/layout/svg/SVGClipPathFrame.cpp#L37)
  passes the geometry to the graphics context.
- [`gfxContext::Clip`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_155_0_RELEASE/gfx/thebes/gfxContext.cpp#L320)
  forwards to the drawing target; the
  [Skia drawing target](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_155_0_RELEASE/gfx/2d/DrawTargetSkia.cpp#L2116)
  explicitly requests an antialiased path clip.

In Chromium 145.0.7632.6,
[`ConversionContext::StartClip`](https://chromium.googlesource.com/chromium/src/+/refs/tags/145.0.7632.6/third_party/blink/renderer/platform/graphics/compositing/paint_chunks_to_cc_layer.cc#534)
emits an antialiased rectangle clip and then an antialiased path clip.
[`ClipPathOp::Raster`](https://chromium.googlesource.com/chromium/src/+/refs/tags/145.0.7632.6/cc/paint/paint_op.cc#1232)
forwards the operation to SkCanvas. The simultaneous rectangle/path clips also
provide a source-level explanation consistent with the tight-bounds control:
when their boundaries coincide, coverage can be attenuated again. The original
half-coverage case and this bounds-dependent amplification should be kept
separate.

These are versioned source inspections corroborated by the reduction and pixel
model. The tested browser binaries were not rebuilt with instrumentation; the
report does not assert an instruction-by-instruction trace of their active
backends or a standards-conformance ruling.

## Controls and possible remedies

Drawing both triangles as **one compound union clip** removes the internal clip
edge. In the standalone fixture, all 48,400 tested interior pixels then equal
the intended yellow exactly in both browsers. This demonstrates that the seam
belongs to separate clipped painting, rather than the triangle coordinates.

Other controls prevent misleading shortcuts:

- `shape-rendering="crispEdges"` on the clip geometry did not change the measured
  seam in either browser.
- `isolation:isolate` also left it unchanged in this fixture.
- An identity filter changes the colored mixture by flattening the color stack,
  but a lighter seam remains between the separately clipped groups.
- A group opacity of 0.999 changed the result in Chromium but not Firefox;
  it is not a portable remedy and changes compositing semantics.
- Shifting the diagonal moves the seam to another pixel; pixel alignment is not
  a general remedy for a zoomable pattern with multiple edge directions.

MadWeave cannot simply union all masks and use one global direction stack:
local order is what makes the weave. A production remedy must combine compatible
paint regions or otherwise preserve correlated coverage while retaining local
order, palette opacity, hidden strips, and outlines. The follow-up [solution report](SVG_SEAM_FIX.md) describes the implemented
compositing change and its browser regression tests.

## Reproduce

With a repository server and installed research browser dependencies:

```sh
MADWEAVE_RESEARCH_BROWSER=chromium node research/seam-isolation-check.cjs
MADWEAVE_RESEARCH_BROWSER=firefox node research/seam-isolation-check.cjs
```

`MADWEAVE_URL` selects a server other than the default port 8766. The script
executes **eight real-SVG reduction stages and fifteen standalone cases per
browser**, including the checked-in fixture. JSON/PNG/SVG evidence is generated
under `research/output/seam-isolation/`. The separate `seam-isolation.yml`
workflow runs both engines on the investigation branch. The main 34-stage
planar/application suite remains the integration baseline.
