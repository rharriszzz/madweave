# Test the planar SVG seams in installed Safari on a Mac

**Handoff for the Mac AI:** Run the pixel test below in the installed Safari app. Then export a weave from the live editor, reopen the downloaded SVG in Safari, and inspect it for a pale line through a solid strip. Return the measurements, the visual result and the evidence paths. The November 9 Mac regression covered the previous renderer. This check exercises the shared stylesheet introduced in `34b7f0d`. [Earlier Mac results](MAC_TESTING.md) · [Renderer and reference colors](../research/SQUIGGLE_AND_CHROME_CLIP_SEAMS.md)

Safari 27.2 displayed a pale diagonal where two clipped regions met inside an opaque yellow strip. The published editor and the reopened download both showed it. The shared editor and its SVG downloads use a smooth mask in Safari and retains the original clips for Batik 1.7. [Results, comparison image and verified export](../research/SAFARI_CLIP_SEAMS.md)

**If Safari reports “using significant memory” during the replay**, check which page was open. The expanded test decoded many SVGs and read back a full canvas for each rendering method. The warning alone cannot establish a leak in the editor. Regenerate older matrix pages with the current generator. It checkpoints every four configurations in the tab’s session storage, then reloads deliberately. Keep that tab open and use the JSON displayed at **163 / 163**. If session storage is unavailable, the batches run in one document. [Memory diagnosis](../research/SAFARI_CLIP_SEAMS.md#replay-memory)

## 1. Prepare the test page

Use a clean checkout of the repository’s default branch, `master`. Run the shell blocks from its root in the same shell. Create a separate results directory for each run.

```sh
mkdir -p test-results
export RUN="$(mktemp -d "$PWD/test-results/safari-seams.XXXXXX")"
git rev-parse HEAD > "$RUN/checkout.txt"
sw_vers > "$RUN/macos.txt"
```

Generate a fresh test page for each renderer revision. A saved page contains the artwork from its original checkout and can reproduce only that revision. Use Node 24 and the locked dependencies. On a fresh checkout, run `npm ci` and `npx playwright install chromium`. If reusing the Mac’s existing browser installation, first set `PLAYWRIGHT_BROWSERS_PATH` to its existing location. Chromium creates the reference artwork and sample coordinates. Safari will render and measure every SVG independently.

Start a loopback server from the repository root. If port 8766 is occupied, choose a free port and use it in both URLs below.

```sh
export BASE=http://127.0.0.1:8766
python3 -m http.server 8766 --bind 127.0.0.1 > "$RUN/server.log" 2>&1 &
server_pid=$!
```

Run the following and confirm it exits successfully. The capture log should report 163 configurations and 90,350 samples.

```sh
MADWEAVE_URL="$BASE/editor.html" MADWEAVE_RESEARCH_BROWSER=chromium \
  MADWEAVE_SEAM_VARIANT= MADWEAVE_SEAM_MATRIX_HTML="$RUN/matrix.html" \
  node research/seam-fix-check.cjs > "$RUN/generator.log" 2>&1
```

## 2. Measure installed Safari

Use a logged-in, unlocked Mac desktop. Reuse the Python environment with Selenium from the previous Mac tests if available. On a fresh checkout, create a virtual environment in the run directory and install Selenium there.

```sh
MAC_PY="$PWD/test-results/mac-2026-11-07/venv314/bin/python"
if [ ! -x "$MAC_PY" ]; then
  python3 -m venv "$RUN/venv"
  MAC_PY="$RUN/venv/bin/python"
  "$MAC_PY" -m pip install selenium
fi
```

Run this block to launch Apple’s SafariDriver, wait for the complete JSON, and save it before checking the thresholds. If Safari asks for Remote Automation to be enabled or macOS requires an unlock, tell the operator the exact prompt. The manual alternative is to open `matrix.html` in Safari at 100% zoom, wait for **163 / 163**, and copy the JSON beneath the counter.

```sh
"$MAC_PY" - <<'PY'
import json
import os
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.safari.service import Service
from selenium.webdriver.support.ui import WebDriverWait

run = Path(os.environ["RUN"]).resolve()
page = (run / "matrix.html").relative_to(Path.cwd()).as_posix()
assert (run / "matrix.html").is_file(), "Generate or copy the matrix first"
with webdriver.Safari(service=Service("/usr/bin/safaridriver")) as safari:
    (run / "safari-version.txt").write_text(safari.capabilities["browserVersion"] + "\n")
    safari.get(os.environ["BASE"] + "/" + page)
    raw = WebDriverWait(safari, 600).until(
        lambda d: d.execute_script("return document.querySelector('#results')?.textContent")
    )
    (run / "safari-results.txt").write_text(raw)
    results = json.loads(raw)
    (run / "safari-results.json").write_text(json.dumps(results, indent=2) + "\n")

row = results["production"]
print(json.dumps(row, indent=2))
assert row["cases"] == 163 and row["samples"] == 90350, "Incomplete replay"
assert results["original"]["samplesOverFour"] > 0, "Historical control did not reproduce the seam"
assert row["samplesOverFour"] == 0, "Production exceeded the four-level tolerance"
PY
```

On this Mac, SafariDriver twice timed out while creating an automation session. Opening the generated page directly in the installed Safari app completed the replay. Record a driver timeout as a startup failure and use the manual procedure above for the renderer measurements.

The target is **zero production samples with an RGB channel error greater than four**. The test draws each SVG on transparent canvas and compares its color over white with the expected strip color. If the production count is positive, report `casesOverFour`, `samplesOverFour`, `maxError` and the entire `worst` entry. If the historical control stays within tolerance, report that separately. A timeout or browser error is an incomplete run. Continue with the display check in either case.

## 3. Export and inspect the displayed artwork

1. Open `$BASE/madweave.svg` in Safari for the checkout test. After deployment, repeat with the [published editor](https://rharriszzz.github.io/madweave/madweave.svg). In **Flat** view select size **2** and medium **M** spacing. Keep the starter colors for comparison.
2. Choose **More → Export artwork as SVG**. Copy the resulting `madweave-artwork.svg` from Safari’s downloads into the run directory. For automation, the existing Mac runner shows how to drive the controls and identify the file produced by that click. [Native download helper](../scripts/test_mac_native.py)
3. Open that file in Safari at 100% zoom. Inspect a continuous yellow strip where the thin line used to appear. Compare with the live editor and save screenshots of both in the run directory. Record whether a pale line crosses the strip in either view. Use the historical screenshot to distinguish the artifact from an intentional edge between materials. [Illustrated comparison](../research/SQUIGGLE_AND_CHROME_CLIP_SEAMS.md#reproducing-the-historical-image)

Stop the loopback server you started with `kill "$server_pid"`. Report the checkout SHA, matrix source if supplied, macOS and Safari versions, production counts and maximum error, historical-control result, visual observation, and paths to the JSON, SVG and screenshots. Keep the visual observation separate from the measured canvas result. [Windows replay for comparison](../research/EDGE_FIREFOX_CLIP_SEAMS.md)
