# MadWeave

**MadWeaver is an interactive triaxial weaving pattern editor by Richard Harris.**
It draws three families of interlacing strips in SVG and lets you explore their
colors, spacing, layers, handedness, and over-and-under structure.

[Project website](https://rharriszzz.github.io/madweave/) ·
[Open the editor](https://rharriszzz.github.io/madweave/editor.html) ·
[User guide](https://rharriszzz.github.io/madweave/guide.html)

![MadWeaver's original interface, with pink, gold, and violet strips and SVG controls](madweave_small.png)

## Run locally

The application is plain HTML, JavaScript, and SVG. It needs no package install,
server-side application, account, or browser plug-in. Serve the checkout over HTTP
so embedded SVG and export can share the same origin:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open <http://127.0.0.1:8000/> for the website or
<http://127.0.0.1:8000/editor.html> for the editor. Opening HTML directly with
`file://` can prevent the wrapper from accessing the embedded SVG.

## Make a weave

1. Choose one of the five pattern previews on the left.
2. Set the pattern color count with the left-hand **1–6** buttons.
3. Select one of the eight palette swatches along the top, then click a strip.
4. Adjust opacity, hue, saturation, and value with the upper-right sliders.
5. Explore the **a/b/c** layers, **H/R/L** directions, **−/X/C** orientation
   controls, and **N/M/W/E** spacing. Lower-left **1–8** selects 3–24 strips
   per direction. Hover over a control for its description.
6. Choose **Export artwork as SVG** on the editor page to download a static
   vector image without controls or scripts.

Pattern and color-count changes reset manual strip edits; changing the strip
count also resets them. There is no full undo or autosave. Export is an artwork
image, **not an editable project file**. Keep the tab open to continue editing.
See [the complete control reference](guide.html) for details.

The current automated browser checks use Chromium. The original SVG controls
expect a mouse or trackpad; complete keyboard and touch operation are not yet
implemented. The website adapts to smaller screens and lets the editor scroll
horizontally. Firefox and Safari have not been verified in this update.

## Documentation

- [User guide](guide.html): controls, export, browser support, and limitations.
- [Architecture and development](docs/DEVELOPMENT.md): rendering, saved state,
  source map, local checks, and GitHub Pages publishing.
- [Testing record](docs/TESTING.md): checks, regression evidence, and coverage limits.
- [Possible improvements](IMPROVEMENTS.md): prioritized follow-up work.
- [Original 2012 project notes](MadWeaver.html) and
  [handbook notes](HandbookOfTriaxialWeaves.html): historical context.

## Test and build

Node.js 24+ runs the dependency-free color/indexing checks. Python 3.10+ runs the
site build and tests. Browser tests additionally require Playwright and Chromium:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m playwright install chromium
node --check madweave.js
node --check editor.js
node --test tests/math.test.cjs
.venv/bin/python -m unittest discover -s tests -v
python3 scripts/build_site.py
```

On Windows, use `.venv\Scripts\python` in place of `.venv/bin/python`. On a fresh
Linux system, Playwright may require `python -m playwright install --with-deps
chromium`. The site-only checks have no third-party dependencies:

```sh
python3 -m unittest discover -s tests -p test_site.py -v
```

The build creates `dist/` from an explicit list of public files. It does not copy
Git metadata, tests, local environments, or the whole checkout. Preview that
artifact with `python3 -m http.server 8000 --directory dist --bind 127.0.0.1`.

## GitHub Pages

[The Pages workflow](.github/workflows/pages.yml) tests the real editor and
builds the static site. Pushes to `master` publish `dist/`; pull requests run the
checks without deploying. The repository's **Settings → Pages → Source** must
be **GitHub Actions**. See [deployment notes](docs/DEVELOPMENT.md#publishing)
for setup and verification.

## History and rights

The original program carries “copyright 2004–2012, Richard Harris, all rights
reserved.” This repository does not currently grant an open-source license;
public source availability alone is not a license to redistribute or modify it.
No new license has been assumed in this update.

The original README linked to
<http://fiberwoman.com/madweave/MadWeaver.html>. That address is retained as
historical provenance; its current availability is not established here. The
legacy HTML, SVG experiments, images, and Batik conversion scripts remain in
the repository. Old browser/plugin download instructions and the scripts'
hard-coded `/Users/rharris/Downloads/batik-1.7/` path are historical, not current
requirements for running the web editor.
