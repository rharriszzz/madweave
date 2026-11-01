# Testing record

Reviewed on 2026-11-01. These checks run against the actual JavaScript/SVG engine
and the generated static site, rather than a reimplementation of the editor.

## Automated checks

| Check | Result | Coverage |
| --- | --- | --- |
| `node --check madweave.js` and `node --check editor.js` | Passed | Syntax of the engine and export wrapper |
| `node --test tests/math.test.cjs` | Passed, four test cases | HSV primary/secondary/gray/wrapped colors; representative RGB/HSV round trips; unique strip IDs at all eight sizes and both centers; all five patterns with all six color counts |
| Python `unittest` discovery | Passed, 11 tests | Eight Chromium integration tests and three static build/link tests |
| `python3 scripts/build_site.py` | Passed | 21 public files, including `.nojekyll`, in `dist/` |
| `git diff --check` | Passed | Whitespace checks |

The local browser suite used Python 3.12, Playwright 1.63.0, and its installed
Chromium. Node.js was v24.16.0. CI installs the pinned Playwright dependency and
its matching Chromium rather than relying on a browser installed on the runner.

## What the browser suite exercises

- Both the serialized original design and the minimal fresh-design SVG load,
  producing 18 initial strips without JavaScript exceptions or failed requests.
- All eight sizes, all five patterns with all six pattern color counts, and all
  four spacing controls respond to real pointer clicks. Size 8 gives 72 strips
  total (24 per direction).
- A real mouse move/dwell/click selects and paints a strip. The original selector
  needs a 400 ms dwell followed by another move. Individual hide/show behavior
  is also checked through engine actions.
- All four palette sliders change their values, and palette colors remain valid
  RGB strings. Layer/direction toggles, handedness, top/bottom, center, and
  outlines change their expected state.
- A custom design is serialized, then loaded as a **fresh SVG document** for each
  spacing. Visibility arrays, selected palette color, custom strip colors,
  individual hidden strips, spacing, view box, and hidden-control state survive.
  Rebuilding the weave after restoration preserves a hidden direction.
- The HTML wrapper enables export after the embedded SVG loads. A recolored
  strip survives download; the exported SVG has no scripts, event attributes,
  controls, or non-fragment asset references. The downloaded file opens as SVG.
- Landing page, guide, and editor wrapper fit 1280, 768, 390, and 320 CSS-pixel
  viewports without document-level horizontal overflow. The SVG canvas itself
  scrolls inside its container. All landing-page images load.
- The landing page and guide remain readable with JavaScript disabled. Actual
  editing and export require JavaScript.

The integration server deliberately serves the built site under `/madweave/`,
matching GitHub Pages project-path behavior. Desktop and narrow landing-page
screenshots were visually reviewed; generated screenshots stay in ignored
`test-results/` and are not published.

## Static publication checks

The build tests verify the exact public-file list, every local HTML asset/link
and HTML fragment target, and external SVG script/image references. They also
verify that unexpected output files and symlinked publication targets are
rejected. They do not verify external historical URLs.

## Coverage limits

These are Chromium desktop and responsive-emulation checks. Firefox, WebKit,
Safari, physical mobile/touch devices, screen readers, and complete keyboard
operation have not been certified. The geometry checks do not prove every
crossing is mathematically or physically correct, and this update does not
validate a physical weaving process. The historical Batik conversion scripts
were inspected but not run; their configured local Java/Batik paths are absent.

Static export has been verified. Editable project import/export, autosave, and
full undo are not implemented. Browser “Save As” is not treated as a reliable
editable saving workflow.

The fresh-document restoration regression was also run with the original
`madweave.js` from commit `27baaaf` substituted at the HTTP layer. It failed on
restored geometry and state; the same regression passes with the fixes. This
confirms that it detects a pre-existing defect rather than only exercising the
new implementation.
