# README screenshot reproduction

The five PNGs in `docs/images/` are actual screenshots of the integrated editor,
served from the allowlisted build at `/madweave/editor.html`. They are not
prototype UI or generated illustrations. The capture script sets repeatable
palettes through the application model and uses the real controls for pattern,
spacing, visibility, construction and inspection choices.

```sh
npm ci
npx playwright install chromium
npm run screenshots
```

On Linux, install browser system dependencies as described in
[browser setup](BROWSER_TEST_SETUP.md). `MADWEAVE_CHROMIUM_EXECUTABLE` optionally
selects an existing Chromium executable. The release images used Chromium
145.0.7632.6 with Playwright 1.63.0, a 1000 × 1000 viewport and device scale 1.
Captures crop to the canvas, or from the mode selector through the complete
canvas. No UI is restyled or removed. The inspector is closed for the ordinary
construction/warning views; pointer hover text is dismissed before capture.

| Image | Reproducible state |
| --- | --- |
| `planar-directions.png` | Size 4, three colors, direction formula, medium spacing; teal/gold/plum palette |
| `planar-open.png` | Same palette and size, class + group formula, wide spacing, b class hidden |
| `corner-construction.png` | Ordinary threefold phase, 480°, R/P=6, default class formula |
| `corner-inspection.png` | Same construction, first crossing's next local position, hidden outlines and seam partners enabled |
| `corner-translucent-warning.png` | Displaced sixfold phase, 420°, R/P=6, direction formula; blue/coral/violet at 0.65/0.55/0.70 opacity, deliberate seam warnings |

Review every regenerated image at the README's approximate 830-pixel display
width as well as full size. Check full drawing bounds, selected controls, warning
legibility, caption accuracy and absence of hover text. PNGs total about 1 MiB.
They are repository documentation and deliberately remain outside the site's
public-file allowlist.
