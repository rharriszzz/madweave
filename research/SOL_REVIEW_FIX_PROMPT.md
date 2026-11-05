# Fix the confirmed Stage 3C review finding

Continue your existing MadWeave work. You have about 48% of your context window left; keep this correction focused and reuse your existing knowledge. Do not restart the geometry investigation or reread the entire research history.

## Task

Fix the confirmed custom-paint loss in commit `2029873` (`feat: integrate certified corner mode into the shared editor`). Implement the correction and a meaningful browser regression, then report the change and validation. Preserve unrelated work, including any existing untracked review document. Do not deploy or merge as part of this correction.

## Confirmed finding

In `editor.js`, `formula(pattern)` (around lines 110–114) sets `draft.replaceColors = true` even when there are no pending construction changes and the formula is applied immediately through `corner.edit(...)`.

That replacement flag survives the successful immediate application. If the user subsequently paints custom strips, clicking `#corner-apply` with unchanged construction settings clears those new overrides because its handler (around lines 121–126) uses:

```js
overrides: changed || draft.replaceColors ? {} : old.material.overrides
```

This was reproduced in Chromium with the current scripts and actual UI actions:

1. Enter corner mode.
2. Click a formula button, e.g. `#cbuttonCP1`, without staging any construction changes.
3. Select palette slot 7, select a joined strip in the inspector, and click Paint selected strip.
4. Capture the material state: for the reproduced construction it was `{pattern: 1, overrides: {'0:0:3': 7}}`.
5. Click Apply without changing phase, angle, or crop.
6. The material state becomes `{pattern: 1, overrides: {}}`: the custom paint is lost.

The exact strip key is illustrative; choose a valid strip from the current model in the regression.

## Required behavior and implementation guidance

- Consume/reset the replacement intent after a successful immediate formula application, so a later unchanged Apply preserves subsequent custom paint.
- Preserve the intended staged workflow: when construction settings are pending, a formula choice must remain staged until Apply, and intentional replacement must still work.
- Account for the boolean success/failure result from `corner.edit(...)`. Keep proposal state coherent with the active design when an immediate application fails; do not leave an unintended destructive replacement pending.
- Keep this a small correction to proposal bookkeeping. Do not change geometry, certificates, palette semantics, or project formats.

## Regression and verification

Extend `research/corner-integration-browser.test.cjs`, reusing its existing native-control helpers. The primary regression must perform the formula → paint → unchanged Apply sequence and assert that the custom assignment survives. Assert observable saved material state, rather than only an internal flag. Demonstrate that this regression fails on the reviewed implementation and passes with the fix.

Also verify that a formula deliberately staged alongside a construction change is still applied correctly. Exercise failure handling if you change its behavior; the suite already has injected render-failure patterns you can reuse.

The reviewer independently ran these successfully before the fix:

- `node --test tests/math.test.cjs`
- `python3 -m unittest discover -s tests -p 'test_site.py'`
- `node research/corner-integration.test.mjs` — 84 constructions, 3,024 round trips, 3,028 independent cases.
- Chromium integration suite — all eight representatives passed, but the suite missed the sequence above.

Known working Chromium command in this workspace:

```sh
NODE_PATH=/tmp/madweave-review-deps/node_modules \
MADWEAVE_CHROMIUM_EXECUTABLE=/tmp/madweave-chrome-pinned/chrome-linux64/chrome \
MADWEAVE_STAGE2_BROWSERS=chromium \
node research/corner-integration-browser.test.cjs
```

The local server and Chromium launch required execution outside the sandbox during review. Use the normal approval mechanism if that restriction applies; do not work around it.

Run the updated integration suite and appropriate existing checks. Use the other installed browser engines if available with your established setup. Do not repeat the entire geometry research suite unless the correction touches that code. Run `git diff --check` and inspect the final diff. Update any relevant review record concisely, without claiming verification you did not perform.

In your final response, identify the fix, the regression's before/after result, tests actually run, and any remaining limitations.
