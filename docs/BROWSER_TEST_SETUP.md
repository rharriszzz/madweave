# Persistent browser-test setup

`/tmp` is temporary: a reboot, cleanup job, or manual cleanup can remove its
contents. The `/tmp/madweave-browsers`, `/tmp/madweave-webkit-packages`, and
`/tmp/madweave-webkit-libs` directories used during development are disposable.
They are not a permanent installation or a requirement for running MadWeave.

There are three separate pieces to the test environment:

| Piece | Recommended location | Persistence |
| --- | --- | --- |
| Python packages, including Playwright | This checkout's ignored `.venv/` | Remains until the checkout/environment is removed |
| Linux shared libraries | Normal Ubuntu packages installed with `apt` | Remain across reboots and receive package-manager updates |
| Playwright's browser builds | `~/.local/share/madweave-playwright/` | Remains across reboots; independent of `/tmp` cleanup |

These dependencies are for developers running the automated browser suite.
Using the published app or a saved project only requires a normal browser.

## Ubuntu / WSL setup

Run these commands in Ubuntu/WSL, from the MadWeave checkout. They install Linux
test browsers; they do not replace the Windows Chrome, Edge, or Firefox apps.

```sh
cd /home/rharris/git/madweave
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt

# Install the shared-library packages permanently through Ubuntu's package manager.
# This step needs your Linux sudo password.
sudo "$PWD/.venv/bin/python" -m playwright install-deps chromium firefox webkit

# Download browser binaries as your normal user, into a persistent directory.
export PLAYWRIGHT_BROWSERS_PATH="$HOME/.local/share/madweave-playwright"
.venv/bin/python -m playwright install chromium firefox webkit
```

If creating the virtual environment reports that `venv` or `ensurepip` is
missing, install `python3-venv` through Ubuntu's package manager, then retry:

```sh
sudo apt update
sudo apt install python3-venv
```

The system-dependency command lets the pinned Playwright version choose the
appropriate package names for your Ubuntu release. This is preferable to
maintaining a manually copied list of GTK, ICU, GStreamer, and other libraries.
The temporary extracted libraries used in this session were a workaround for a
missing usable sudo prompt; they were never registered as installed packages.

Do not run the browser download command with `sudo`: the files should belong to
your normal user. The `sudo` step installs only the Linux system dependencies.

## Use the same browser path in future shells

Add this line once to `~/.bashrc` if Bash is your shell:

```sh
export PLAYWRIGHT_BROWSERS_PATH="$HOME/.local/share/madweave-playwright"
```

Open a new terminal, or run `source ~/.bashrc`, before running tests. For another
shell, put the equivalent setting in that shell's configuration. You can also
set this variable explicitly before each test session instead of editing any
shell configuration. Installation and test runs must use the same path.

Playwright's default Linux path, `~/.cache/ms-playwright`, also normally survives
reboots, but cache-cleaning tools may remove it. The explicit `.local/share`
location above avoids relying on that cache. Playwright can remove obsolete
browser versions when no installed Playwright client needs them; reinstalling
matching builds with the install command is safe.

## Run and verify

The integrated corner suite also needs Node.js 24+ and the locked development
dependencies. `npm ci` installs Playwright 1.63.0 (matching Python) and pngjs;
neither is used by the running application. Both clients share the installed
browser builds when `PLAYWRIGHT_BROWSERS_PATH` is the same.

```sh
npm ci
npm run test:corner
npm run test:corner:browser
```

The corner browser suite builds the public site and serves it under `/madweave/`.
It runs Chromium, Firefox and WebKit by default. Set
`MADWEAVE_STAGE2_BROWSERS=chromium`, `firefox` or `webkit` for a single engine.
`MADWEAVE_CHROMIUM_EXECUTABLE` can select an installed Chromium executable for
this Node suite and the README capture script.

From the checkout:

```sh
export PLAYWRIGHT_BROWSERS_PATH="$HOME/.local/share/madweave-playwright"
.venv/bin/python -m playwright --version
.venv/bin/python -m playwright install --list

MADWEAVE_BROWSER=chromium .venv/bin/python -m unittest discover -s tests -v
MADWEAVE_BROWSER=firefox .venv/bin/python -m unittest discover -s tests -v
MADWEAVE_BROWSER=webkit .venv/bin/python -m unittest discover -s tests -v
```

The tests start and stop their own local HTTP server. They exercise editable
saving, offline reopening and resaving, legacy SVG import, artwork export, and
controls. Temporary test files under `/tmp` are expected; the installed test
software does not need to live there.

If you previously set `LD_LIBRARY_PATH` to `/tmp/madweave-webkit-libs/...`, remove
that temporary entry from the environment before verifying the permanent setup.
The normal package-manager installation should resolve those libraries without
an override. Do not add a `/tmp` library override to your shell startup files.

## Updating or repairing

### Pages CI container

The Pages workflow's three browser jobs use the official
`mcr.microsoft.com/playwright/python:v1.63.0-noble` image, pinned by digest in
[pages.yml](../.github/workflows/pages.yml). The image supplies browser binaries
and their Linux libraries at `/ms-playwright`; jobs install the locked Node and
Python packages but do not run `playwright install --with-deps`.

Keep the image version and digest aligned with both `package-lock.json` and
`requirements-dev.txt` when upgrading Playwright. Both language clients must use
the matching browser builds. Validate upgrades through all three CI matrix jobs.
The image still needs downloading on a fresh runner; it removes repeated Ubuntu
package installation, not all network setup. The separate historical research
workflows retain their existing browser environments.

Reference: [Official Playwright container](https://playwright.dev/python/docs/docker).

### Local installation

After updating `requirements-dev.txt`, reinstall the pinned Python dependency,
its system dependencies if needed, and the matching browser builds:

```sh
.venv/bin/python -m pip install -r requirements-dev.txt
sudo "$PWD/.venv/bin/python" -m playwright install-deps chromium firefox webkit
export PLAYWRIGHT_BROWSERS_PATH="$HOME/.local/share/madweave-playwright"
.venv/bin/python -m playwright install chromium firefox webkit
```

“Executable doesn't exist” usually means the selected browser build is absent
or the browser-path variable differs from the installation path. A missing
shared-library message calls for the system-dependency step. Neither problem
requires upgrading your personal Firefox installation.

## macOS

For automated tests on a Mac, create `.venv`, install `requirements-dev.txt`,
set the same `PLAYWRIGHT_BROWSERS_PATH` convention, and install the browsers.
Skip the Linux `sudo ... install-deps` and `apt` commands. Python and Node must
already be installed. The Mac Firefox test setup isolates application data as
well as its browser profile, avoiding the macOS 27 startup failure documented in
[the Mac testing record](MAC_TESTING.md#macos-firefox-startup-and-cleanup). It does
not require granting access to your normal Firefox data.

The integrated Node corner browser suite uses the same isolated application-data
approach on macOS. Installed Safari needs a separate WebDriver check: see
[the November 7 native regression record](MAC_TESTING.md#results-on-2026-11-07)
and `scripts/test_mac_native.py` for the optional Selenium probe, exact commands,
download isolation, and comparison with Playwright WebKit.

To run the complete suite in an already installed Chrome application:

```sh
MADWEAVE_BROWSER=chromium MADWEAVE_CHANNEL=chrome .venv/bin/python -m unittest discover -s tests -v
```

Leave `MADWEAVE_CHANNEL` unset for the bundled Chromium/Firefox/WebKit builds.
Automated WebKit is separate from the actual Safari application; keep using
[the Mac acceptance checklist and results](MAC_TESTING.md) for installed Safari,
Chrome, and Firefox.

Reference: [Playwright Python browser installation and configuration](https://playwright.dev/python/docs/browsers).
