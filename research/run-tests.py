#!/usr/bin/env python3
"""Run the planar research suite with an isolated loopback HTTP server."""
import argparse
import functools
import http.server
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import time
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'research' / 'output' / 'suite'


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--unit-only', action='store_true', help='Run checks without Playwright')
    parser.add_argument('--app', action='store_true', help='Also run the Python application browser suite')
    args = parser.parse_args()
    if args.unit_only and args.app:
        parser.error('--app requires browser checks')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    scripts = [
        'browser-svg-check.cjs', 'editor-button-experiments.cjs',
        'editor-pointer-experiments.cjs', 'editor-hover-paint.cjs',
        'hexweave-comparison.cjs', 'crossing-pixel-check.cjs',
        'triple-area-check.cjs', 'mask-boundary-check.cjs', 'planar-matrix-check.cjs', 'boundary-matrix-check.cjs',
    ]
    stages = [('syntax-' + Path(s).stem, ['node', '--check', 'research/' + s], {}) for s in scripts]
    stages.append(('syntax-compare-seams', ['node', '--check', 'research/compare-seams.cjs'], {}))
    stages += [
        ('math', ['node', '--test', 'tests/math.test.cjs'], {}),
        ('indexing', ['node', 'research/planar-indexing.test.cjs'], {}),
        ('crossing-model', ['node', 'research/crossing-audit.cjs'], {}),
        ('independent-geometry', ['node', 'research/planar-geometry.test.cjs'], {}),
        ('symmetry', ['node', 'research/symmetry.test.cjs'], {}),
        ('angular-baseline', ['node', 'research/angular-baseline.test.cjs'], {}),
        ('site', [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_site.py', '-v'], {}),
    ]
    if not args.unit_only:
        stages.append(('browser-dependencies', ['node', '-e', "require('playwright'); require('pngjs');"], {}))
        stages += [(Path(s).stem, ['node', 'research/' + s], {}) for s in scripts[:5]]
        stages += [('crossings-size-' + str(size), ['node', 'research/crossing-pixel-check.cjs'],
                    {'MADWEAVE_BASE_SIZE': str(size)}) for size in (2, 3)]
        stages += [(Path(s).stem, ['node', 'research/' + s], {'MADWEAVE_RESEARCH_BROWSER': 'chromium'}) for s in scripts[6:]]
        firefox_env = {'MADWEAVE_RESEARCH_BROWSER': 'firefox'}
        # Optional separate clients/build storage for an existing local setup.
        if os.environ.get('MADWEAVE_FIREFOX_NODE_PATH'):
            firefox_env['NODE_PATH'] = os.environ['MADWEAVE_FIREFOX_NODE_PATH']
        if os.environ.get('MADWEAVE_FIREFOX_BROWSERS_PATH'):
            firefox_env['PLAYWRIGHT_BROWSERS_PATH'] = os.environ['MADWEAVE_FIREFOX_BROWSERS_PATH']
        stages += [
            ('seams-chromium', ['node', 'research/boundary-matrix-check.cjs', '--seam-only'], {'MADWEAVE_RESEARCH_BROWSER': 'chromium'}),
            ('seams-firefox', ['node', 'research/boundary-matrix-check.cjs', '--seam-only'], firefox_env),
            ('seam-browser-comparison', ['node', 'research/compare-seams.cjs'], {}),
        ]
    if args.app:
        stages.append(('application', [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_browser.py', '-v'], {}))

    report = {'startedAt': datetime.now(timezone.utc).isoformat(), 'unitOnly': args.unit_only,
              'applicationSuite': args.app, 'stages': [], 'passed': False}
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    with http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        env = {**os.environ, 'MADWEAVE_URL': f'http://127.0.0.1:{server.server_port}/editor.html'}
        try:
            for name, command, overrides in stages:
                start = time.monotonic()
                log = OUTPUT / (name + '.log')
                error = None
                with log.open('w') as stream:
                    try:
                        result = subprocess.run(command, cwd=ROOT, env={**env, **overrides},
                                                stdout=stream, stderr=subprocess.STDOUT, timeout=180)
                        code = result.returncode
                    except (OSError, subprocess.TimeoutExpired) as exc:
                        code, error = 1, str(exc)
                        stream.write('\n' + error + '\n')
                row = {'name': name, 'command': command, 'overrides': overrides,
                       'returncode': code, 'seconds': round(time.monotonic() - start, 3),
                       'log': str(log.relative_to(ROOT))}
                if error:
                    row['error'] = error
                report['stages'].append(row)
                print(f"{'PASS' if code == 0 else 'FAIL'} {name} ({row['seconds']}s)", flush=True)
                if code:
                    print(log.read_text()[-5000:], flush=True)
                    break
            report['passed'] = len(report['stages']) == len(stages) and all(
                row['returncode'] == 0 for row in report['stages'])
        finally:
            server.shutdown()
            thread.join()
            (OUTPUT / 'results.json').write_text(json.dumps(report, indent=2) + '\n')
    print('Report: research/output/suite/results.json', flush=True)
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    sys.exit(main())
