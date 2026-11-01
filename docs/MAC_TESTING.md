# Mac acceptance check

After the updated site is published, repeat this short check in **Safari,
Chrome, and Firefox** on your Mac. Automated Linux engine tests and Windows
browser checks complement this check; they do not replace the actual Mac builds.

1. Open <https://rharriszzz.github.io/madweave/editor.html>. Refresh if the
   Save Project and Open Project buttons are missing.
2. Change a pattern, size, spacing, and palette color. Recolor one strip and hide
   another; try a layer or direction toggle. Choose **Save Project**.
3. Find the downloaded `madweave-project.html` in Downloads and open it in the
   browser being tested. Confirm the design matches. Disconnect from the
   internet (or disable networking for the test) and confirm the editor still
   works, including the five pattern thumbnails.
4. Make another visible change and choose **Save Project** again. Open the new
   download and confirm that change survived. Your browser may add a number to
   the filename. Keep the newest copy, or rename copies to describe the designs.
5. Reconnect, return to the website, choose **Open Project**, and select the
   saved HTML file. Confirm the design and settings return and editing works.
6. If you have an old editable SVG saved with the original Firefox workflow,
   try **Open Project** with a copy of that file too. Preserve the original.
7. Choose **Export artwork as SVG**. Confirm the image has no editor controls.
   Save Project is the way to retain an editable copy.
8. Hide the SVG controls with **HB**, save, and reopen. Click HB again to reveal
   the controls. Try a keyboard Tab to the HTML Save/Open buttons and activate
   one with Return or Space.

For any failure, record the browser/version, whether you were on the website or
in a downloaded file, the step, and what happened. Keep the failing project file
so the state can be reproduced. There is no autosave or undo: save before
replacing a design or experimenting with pattern/size changes.

## Results on 2026-11-01

Tested on an Apple Silicon Mac running macOS 27.2 (26B123), with Python 3.13.18,
Node.js 24.22.1, and Playwright 1.63.0. The starting application revision was
`aa3f3ca`; the changes from this review affect test setup and documentation.

| Browser | Result | Scope |
| --- | --- | --- |
| Playwright Chromium 153.0.8010.12 | Passed, 14 tests | Entire integration/build suite, including blocked-network offline projects |
| Playwright Firefox 155.0 | Passed, 14 tests | Entire suite, using isolated macOS application data |
| Playwright WebKit 26.6 | Passed, 14 tests | Entire suite; this is separate from Safari |
| Installed Google Chrome 156.0.8078.74 | Passed, 14 tests | Entire suite through the `chrome` channel, in a temporary profile |
| Installed Safari 27.2 (22625.2.8.11.9) | Passed targeted checks | Published editor controls; real HTML downloads; exact state after file reopen, editing, resaving, second reopen, and Open Project; static SVG download after import |
| Installed Firefox 120.0.1 | Passed targeted checks | Published editor controls; real HTML downloads; exact state after file reopen, editing, resaving, second reopen, and Open Project; static SVG download |

The native Safari/Firefox probes used WebDriver (Selenium 4.52.0, the system
Safari driver, and geckodriver 0.33.0 for the installed Firefox). They exercised
pattern, size, palette, extra-wide spacing, layer/direction, orientation, outline,
and hidden-control changes. Custom strip colors and visibility were also set
through engine actions before saving. Files received unique test names, and
only those test downloads were removed. Normal browser profiles were not used
or modified. The installed Firefox application was not upgraded.

The native probes opened saved projects through `file://` and observed no
HTTP(S) resources in the outer document's Resource Timing entries. The Mac's
network connection remained enabled for these probes. The stronger check that
blocks HTTP(S) requests in the complete browser context is in the Playwright
suite. These results do not certify physical touch devices, screen readers, or
complete SVG keyboard operation. The manual checklist above remains useful
following browser or editor updates.

An initial Safari WebDriver run missed an export click after a file upload:
the driver returned successfully but dispatched no click event. The user
reported possibly interacting with the automation window. At their request,
the entire native save/open/resave sequence was repeated with the window left
alone; the post-import native export click downloaded a valid SVG successfully.
The earlier miss is not a confirmed application defect, and no application
workaround was added. Leave the automation window untouched during these tests.

### Repeating the automated checks

After following [the persistent setup](BROWSER_TEST_SETUP.md#macos):

```sh
export PLAYWRIGHT_BROWSERS_PATH="$HOME/.local/share/madweave-playwright"
MADWEAVE_BROWSER=chromium .venv/bin/python -m unittest discover -s tests -v
MADWEAVE_BROWSER=firefox .venv/bin/python -m unittest discover -s tests -v
MADWEAVE_BROWSER=webkit .venv/bin/python -m unittest discover -s tests -v

# Exercise the Chrome application already installed on this Mac.
MADWEAVE_BROWSER=chromium MADWEAVE_CHANNEL=chrome .venv/bin/python -m unittest discover -s tests -v
```

`MADWEAVE_CHANNEL` is optional. Leave it unset for the bundled engines; use
`chrome` only with `MADWEAVE_BROWSER=chromium`. It selects the installed browser
without opening your personal profile.

### macOS Firefox startup and cleanup

Without isolation, the pinned Playwright Firefox exited before loading the app
with **Could not find profile folder**. The installed Firefox also failed to
start under direct automation. This matches the shared application-data access
issue reported in [Playwright #42768](https://github.com/microsoft/playwright/issues/42768).

The suite now supplies `CFFIXED_USER_HOME` only to the Mac Firefox child process,
pointing at a temporary test directory. It precreates Documents, Downloads, and
Library support/cache/preferences directories, avoiding macOS deny-delete ACLs
on automatically created standard folders. Both the tests and cleanup pass.
No Full Disk Access, personal-profile access, sandbox change, or global shell
setting was needed. Chromium, WebKit, and Linux CI keep their existing setup.

## GitHub Pages and portfolio review

Both <https://rharriszzz.github.io/madweave/> and
<https://rharriszzz.github.io/> returned HTTP 200 over HTTPS. GitHub's Pages API
reported GitHub Actions publishing and HTTPS enforcement for both repositories;
neither had a custom domain. The latest MadWeave workflow for `aa3f3ca`
[completed successfully](https://github.com/rharriszzz/madweave/actions/runs/41361706822).
All 21 application/public files returned HTTP 200 and matched the checkout
byte for byte; the build separately adds `.nojekyll` as its 22nd file.

The portfolio is suitable as the project's discovery page:

- Its featured MadWeave card has the correct screenshot, repository, project
  URL, and description of editable offline saving and SVG export.
- Searching for `madweave` and selecting **Browser apps** keep the card visible;
  its **Live Site** link reaches the MadWeave landing page.
- MadWeave's **More projects** link returns to the portfolio.
- The live landing page, guide, editor wrapper, and filtered portfolio fit 1280,
  768, 390, and 320 CSS-pixel widths without document-level horizontal overflow.
  The SVG retains its separately scrolling canvas, as documented.
- The live Chrome review reported no JavaScript exceptions or HTTP error
  responses on those routes. The project and portfolio preview images loaded.

Keep the app and its guide in `rharriszzz/madweave`, published at `/madweave/`,
and keep the portfolio card in `rharriszzz/rharriszzz.github.io`. The existing
links already implement this arrangement; no portfolio repository change was
needed. Useful follow-ups are a scheduled Mac test run and a fresh portfolio
screenshot if the editor's appearance changes substantially.
