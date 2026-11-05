# README screenshot reproduction

The five PNGs in `docs/images/` are actual screenshots of the integrated editor,
served from the allowlisted build at `/madweave/editor.html`. They are not
prototype UI or generated illustrations. The capture script sets repeatable
palettes through the application model and uses the real controls for pattern,
spacing, visibility, construction and inspection choices.

The first image reopens `madweave.svg` through **Open Project**, rebuilding the
original design with the current software. The file matches
<https://fiberwoman.com/madweave/madweave.svg> byte-for-byte as retrieved on
2026-11-05 (SHA-256
`53001a75a794dc09eeb4b4e1bd7cd84308c55fb63a70a4c0336762d433ae8e7c`).
The script checks the complete imported design and exact path, transform, fill,
opacity and color-index attributes for all 18 strips and 3 clipping paths before
capture. A separate same-size browser comparison with the reference's original
JavaScript confirmed the same design and geometry. The new Flat/Corner/Angle/More
buttons occupy the bottom row. The current renderer removes
the original's faint compositing seams; see [the rendering fix](../research/SVG_SEAM_FIX.md).

```sh
npm ci
npx playwright install chromium
npm run screenshots
```

On Linux, install browser system dependencies as described in
[browser setup](BROWSER_TEST_SETUP.md). `MADWEAVE_CHROMIUM_EXECUTABLE` optionally
selects an existing Chromium executable. The first image used Chromium
153.0.8010.12, as did the other four. All used Playwright 1.63.0, a
1000 × 1000 viewport and device scale 1.
Captures crop to the canvas, or from the mode selector through the complete
canvas. No UI is restyled or removed. The inspector is closed for the ordinary
construction/warning views; pointer hover text is dismissed before capture.

| Image | Reproducible state |
| --- | --- |
| `planar-original.png` | Original SVG reopened in the current editor: size 2 (six strips per direction), direction formula, three colors, medium spacing; original pink/gold/violet palette |
| `planar-open.png` | Size 4, original pink/gold/violet palette, direction formula, three opaque colors, narrow spacing, only b class visible, L enabled |
| `corner-construction.png` | Displaced sixfold phase, size 2, 480°, 24 strips with individual ends, direction + class formula, original palette and control positions, L enabled |
| `corner-inspection.png` | Same construction, first crossing's next local position, hidden outlines and seam partners enabled |
| `corner-translucent-warning.png` | Displaced sixfold phase, size 2, 420°, 21 strips with individual ends, direction formula; blue/coral/violet at 0.65/0.55/0.70 opacity, deliberate seam warnings |

Review every regenerated image at the README's approximate 830-pixel display
width as well as full size. Check full drawing bounds, selected controls, warning
legibility, caption accuracy and absence of hover text. PNGs total about 1 MiB.
They are repository documentation and deliberately remain outside the site's
public-file allowlist.
