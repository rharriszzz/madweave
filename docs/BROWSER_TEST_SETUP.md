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
already be installed. Automated WebKit is not the actual Safari application;
finish with [the Mac acceptance checklist](MAC_TESTING.md) in Safari, Chrome,
and Firefox.

Reference: [Playwright Python browser installation and configuration](https://playwright.dev/python/docs/browsers).
