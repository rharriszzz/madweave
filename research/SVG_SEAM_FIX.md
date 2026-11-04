# Fixing the faint lines in MadWeave's SVG

MadWeave's triangular clipping regions meet exactly, but browsers can leave a
faint line where separately clipped groups meet. The line comes from how
fractional pixel coverage is blended. It is visible in Chromium, Firefox, and
WebKit; switching browsers does not remove its cause.

The solution is to **finish painting each local stack before clipping it, then
add the adjoining regions' pixel coverage inside an isolated group**. This
preserves the local over/under order that makes the weave. It also preserves
palette transparency, hidden strips, and outlines.

This is implemented in [`buildStripsInternal`](../madweave.js). The detailed
[diagnosis](SEAM_ROOT_CAUSE.md) contains the SVG reduction, predicted pixel
colors, and versioned browser-source references. This document explains the
solution and its practical limits.

## The problem in a small example

The [original reproducer](fixtures/clip-seam-minimal.svg) contains only two
triangular clips and four rectangles. Each triangle paints purple, then yellow.
The yellow should completely cover purple. At the shared edge, however, both
browsers tested during the diagnosis produced `[217,181,165]` instead of yellow
`[252,205,118]`.

At half coverage, the original paint sequence is effectively purple, yellow,
purple, yellow, each at 50% opacity. Its final color is:

```text
5/8 yellow + 5/16 purple + 1/16 white
```

Two half-covered paints combined with ordinary source-over blending do not
produce one fully covered paint: `0.5 + (1-0.5)*0.5 = 0.75`. The browser treats
coverage of different parts of a pixel as if it were uniform transparency.
Painting each child through the clip also lets lower colors survive.

## The solution in SVG

The [corrected standalone SVG](fixtures/clip-seam-fixed.svg) uses this structure:

```xml
<g id="strips" style="isolation:isolate">
  <g clip-path="url(#firstRegion)"
     style="mix-blend-mode:plus-lighter;filter:opacity(1)">
    <g style="isolation:isolate">
      <!-- direction references, in the existing bottom-to-top order -->
    </g>
  </g>
  <!-- repeat for the other local-order regions -->
</g>
```

Each part has a purpose:

1. The inner isolated stack keeps its ordinary source-over layering.
2. The identity CSS filter `opacity(1)` makes Firefox flatten the completed
   stack before applying the clip. Its opacity multiplier is exactly one.
   The nested isolation is also needed for WebKit's tested rendering path.
3. `plus-lighter` adds the already-clipped regions' premultiplied colors and
   alpha. Complementary half coverage adds to full coverage, instead of losing
   a quarter of it through source-over blending.
4. The outer isolation starts that addition on transparent black. It prevents
   the white page or other artwork from entering the additive calculation.
   The completed weave is then composited normally onto its background.

For a stack with premultiplied color P and alpha A, two complementary clips
produce `a*P + (1-a)*P = P` and `a*A + (1-a)*A = A`. Thus material transparency
is preserved as well as opaque color. At an actual change of top surface, the
pixel receives the coverage-weighted colors from the different local stacks.

The ordering of filter, clip, and compositing follows the model described in
the W3C [Filter Effects working draft](https://www.w3.org/TR/filter-effects-1/#FilterProperty).
Its [opacity filter function](https://www.w3.org/TR/filter-effects-1/#funcdef-filter-opacity)
has identity value 1. The additive equations and isolation are described in the
CSS [Compositing Level 2 editor's draft](https://drafts.csswg.org/compositing-2/#porterduffcompositingoperators_plus_lighter),
a work in progress. Browser tests, rather than syntax support alone, establish
the behavior used here.

## Why the simpler candidates were rejected

| Candidate | Observed problem |
|---|---|
| Additive blending alone | Firefox and WebKit still clip individual paints and produce the wrong color |
| Isolation alone | Does not correct the original seam |
| An identity SVG color-matrix filter plus additive blending | Fixes opaque seams, but changes translucent interior colors in tested WebKit |
| Inner isolation plus additive blending | Works in WebKit, but does not flatten the stack in tested Firefox |
| CSS `opacity(1)` plus additive blending | Works in Firefox, but needs the nested isolated stack in WebKit |
| A slightly reduced group opacity | Changes the artwork and is inconsistent between engines |
| Shifting coordinates | Moves the seam to another pixel |
| Enlarging/overlapping the masks | Changes ownership near crossings and can double transparent paint |
| One union clip with one global order | Removes the reduced example's edge, but cannot represent MadWeave's changing local order |

The final combination passes the opaque and translucent checks in all three
engines. For example, with both rectangle opacities 0.6, the intended interior
is approximately `[225,192,170]`. The final seam is `[225,193,171]` and the
interior remains `[225,192,170]`. The rejected SVG-filter version instead
changes WebKit's interior to `[232,196,181]`.

## Verification

[`seam-fix-check.cjs`](seam-fix-check.cjs) tests the reduced example against
analytic alpha arithmetic and the actual application against independently
constructed finite-strip geometry. It samples single pixels at clip boundaries,
including boundaries with the same visible color on both sides. Averaging a
neighborhood can hide the defect, so this regression uses individual pixels.

Coverage includes:

- Sizes 1, 2, and 8, every spacing, and all eight C/X/hand orientations.
- Opaque and translucent colors, including alpha on a transparent background;
  individually hidden strips, a hidden
  direction, a hidden hexweave class, and outlines.
- A negative control that restores the old rendering: it must expose an error
  greater than 20 channel levels, so an ineffective probe cannot pass the test.
- The actual Export artwork command, rendered as a script-free SVG image.
- The fallback for browsers that do not recognize the required CSS properties.

The integration baseline also passes all **34 planar/application stages**,
including the 128-case boundary/end matrix, independent geometry, controls,
saving/offline reopening, import, and export. The corrected production renderer
is used by these tests. The separate root-cause reduction deliberately restores
the old painting method to keep its negative control reproducible.

Local results on 2026-11-04 cover **163 configurations and 90,350 pixel
samples per engine** (repeated coordinates may occur between seam probes):

| Engine | Version | Maximum channel error | Original / fixed error at negative-control scene | Export image error |
|---|---|---:|---:|---:|
| Chromium | 145.0.7632.6 | 2.78 | 47 / 2 | 2 |
| Firefox | 155.0 | 2.40 | 47 / 1 | 1 |
| WebKit | 26.6 | 2.78 | 47 / 2 | 2 |

Fractional errors compare 8-bit observations with unrounded analytic colors.
The main integration suite used Chromium and Firefox; its application stage
used Chromium. The separate seam workflow also verifies older browser builds
matching its pinned Playwright client. CI status must be checked on the PR;
the table above reports the local run. Output includes JSON measurements, the real exported SVG, and
before/after PNGs in `research/output/seam-fix/<browser>/`.

## Compatibility and limits

The builder checks support for `mix-blend-mode:plus-lighter` and CSS
`filter:opacity(1)`. Browsers without either retain the original rendering.
Saved editable projects rebuild the rendering from the same design state;
no project-format change is needed. Static exports retain the nested groups
and inline styles, so the fix works when the SVG is loaded as an image in the
tested browsers.

SVG consumers with different filter/blending support, such as non-browser
converters or vector editors, need their own verification. An exported SVG
remains vector artwork, but grouping/filter operations may use intermediate
raster surfaces when displayed. This is also why representative large designs
and zoomed patches are included in the tests.

This corrects the strong false seams in the tested planar weave. It does not
promise identical pixels across browsers or eliminate normal antialiasing at
physical strip edges. Small residual errors of a few 8-bit channel levels can
remain from coverage and premultiplied-color rounding. The tests allow at most
four levels per channel at the selected constant-color seams. `coneFraction`
remains 1; future nonplanar masks must preserve the complementary-region
assumption or establish a new compositing strategy.

## Reproduce

Install the Node research dependencies from [TESTING.md](TESTING.md), including
the browsers to test, and serve the checkout:

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

In another terminal:

```sh
MADWEAVE_RESEARCH_BROWSER=chromium node research/seam-fix-check.cjs
MADWEAVE_RESEARCH_BROWSER=firefox node research/seam-fix-check.cjs
MADWEAVE_RESEARCH_BROWSER=webkit node research/seam-fix-check.cjs
```

`MADWEAVE_URL` can select another server's editor URL. The
[`seam-isolation.yml`](../.github/workflows/seam-isolation.yml) workflow runs the
solution test in all three engines and retains the diagnosis checks in
Chromium and Firefox.
