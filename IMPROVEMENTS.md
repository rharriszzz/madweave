# Possible improvements

This is a backlog based on source inspection and the 2026-11-01 Chromium review.
Items below are proposals, not capabilities already implemented. The update adds
current documentation, a GitHub Pages site, editable offline project saving and opening, legacy SVG import, static artwork
export, regression tests, and fixes to SVG state restoration; it leaves the original engine intact
apart from those restoration fixes.

## Highest priority: keep work safe and make controls accessible

| Proposal | Why it matters | A useful acceptance check |
| --- | --- | --- |
| Project-file evolution and optional overwrite | Version 1 saves complete offline HTML projects with validated state and supports legacy editable SVG import. Each save downloads a new file. | Add explicit format migrations when needed; consider a native overwrite picker where supported, keeping standard downloads as the fallback. |
| Undo/redo and a reset warning | Pattern/color-count changes discard hand edits without a recovery path. | Undo painting, palette changes, visibility, resizing, and pattern replacement; verify redo and a clear unsaved-change state. |
| Keyboard and screen-reader controls | Original SVG hit rectangles have mouse handlers and hover descriptions but no complete keyboard model. | Operate all controls and select/paint strips without a mouse; expose selected state and control names to assistive technology. |
| Pointer events and touch interaction | Hover-dependent selection is awkward on phones and tablets. | Test actual touch devices with tap selection, explicit painting/visibility modes, and no accidental page-scroll painting. |
| Cross-browser verification | Automated checks cover Chromium and Firefox, with WebKit in CI; actual Mac browser checks remain useful. | Complete the Mac acceptance checks in Safari, Chrome, and Firefox; manually test at least one physical touch device. |

## Engine reliability and maintainability

- Separate geometry, palette/pattern logic, application state, SVG rendering, and
  event handling. Start by isolating pure functions with tests while preserving
  the historical standalone SVG entry points.
- Replace implicit globals (for example `del_R`, `del_G`, and `del_B`) with local
  declarations before enabling strict mode. Add `try/finally` to rendering guards
  so an exception cannot leave `processing` permanently true.
- Replace stroke-width-based persistence with explicit state fields. Validate
  imported counts, color indices, visibility arrays, and spacing ranges; reject
  unsupported versions with useful messages.
- Generalize hue normalization beyond the UI's normal range. The existing
  conversion handles the range used by the sliders and common wrap values, but
  is not a validated public color-conversion library for arbitrary input.
- Expand tests to numerical clipping/overlap invariants and image comparisons
  at all center, hand, and top/bottom combinations. Structural DOM assertions do
  not prove every rendered crossing has correct geometry.
- Measure redraw cost at 24 strips per direction before optimizing. Reuse
  unchanged SVG elements or batch updates only when profiling shows a benefit.

## Product and documentation

- Add an accessible HTML control panel with names, units, and selected states,
  including separate labels for palette size, pattern color count, and strip
  count. Keep controls outside the artwork so they scale independently.
- Offer a deliberate blank/start-over action and an editable example gallery.
  Explain whether each example is a digital experiment or a physically verified
  weaving plan; screen geometry alone does not establish craft feasibility.
- Add PNG export with explicit resolution, transparency, and print dimensions.
  Verify colors/opacity and cropping against the SVG before claiming print fidelity.
- Add in-editor onboarding and a persistent status display for paint/hide/show
  modes. Replace descriptions that can only be discovered on hover.
- Update the historical handbook page after checking publication information
  and working reference links; retain the old text as an archive.
- Decide and publish an explicit license if wider reuse is intended. The current
  source says all rights reserved; this update does not make that decision.

## Maintenance and delivery

- Replace the Batik scripts' machine-specific paths with arguments and documented
  dependencies, or retire them in favor of a tested conversion workflow. Verify
  each format and resolution on small fixtures before batch conversion.
- Pin Actions to reviewed commit SHAs and set up a deliberate update policy if
  stronger workflow reproducibility is desired. The current workflow uses the
  verified official major-version tags.
- Add a small link-checking maintenance command that distinguishes archived
  external references from required live site assets. Keep historical downloads
  out of current setup instructions.
- Add visual regression baselines only after agreeing which original rendering
  details to preserve. Avoid recording broad screenshot changes as correctness
  without reviewing the actual interlacing.
