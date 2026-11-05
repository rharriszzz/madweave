# Stage 3C review and bounded correction task

Reviewed branch `docs/single-corner-prompt` at `2029873`. The branch and its
upstream pointed to that commit, and the working tree was clean before review.
This review does not authorize a master merge or deployment.

## Assessment

The delivered direction matches the requested product: `editor.html` exposes
Planar / Corner modes, reuses the existing palette and painting controls, and
shares Save / Open / Export. Separate retained frames are an implementation
detail; the user does not have to operate the research editor. The original
planar engine and planar state module are unchanged.

The integration report records subsequent decisions to retain opacity and to
allow seam color conflicts with explicit warnings. This review uses those
documented decisions, rather than the superseded opaque-only/blocking proposals.
The finite construction catalogue and separate physical-validation gate remain
appropriate. No broader geometry research or physical experiment is needed to
address the defect below.

**Recommendation: fix the pending-color transaction before merge review.**
The integration is substantial and the existing checks are useful, but they miss
a reproducible loss of manual painting during an unchanged Apply operation.

## Finding: an already-applied formula remains queued to erase later painting

Priority: P2; correct before accepting Stage 3C for merge.

Relevant code: [formula handler](../editor.js#L110) and
[grouped Apply handler](../editor.js#L121).

Reproduce with actual controls in the served editor:

1. Choose Corner, leaving the initial excess construction unchanged.
2. Click the Class formula preview (CP1). The formula applies immediately.
3. Expand strip inspection, choose a joined strip, choose palette slot 7, and
   click Paint selected strip.
4. Without changing angle, phase, crop or formula, click Apply together.

The saved model changes from `material: {pattern: 1, overrides: {"0:0:3": 7}}`
to `material: {pattern: 1, overrides: {}}` in the Chromium reproduction. Other
engines reproduce the same loss; the selected component can differ. The
construction remains unchanged. There is no undo.

`formula()` sets `draft.replaceColors = true` even when there is no pending
construction and the formula is immediately committed. It never consumes that
flag. A later Apply treats it as an outstanding replacement request and clears
new manual painting. The custom-color loss notice is conditional on a changed
construction, so it does not explain this case. The generic “Replacement
coloring” text does not distinguish a genuinely staged replacement from this
stale request.

Confirmed in the live editor in Chromium, Firefox and WebKit, and independently
in the committed worked offline HTML in Chromium. This is a sequence/state
defect, not a certificate or rendering discrepancy.

## Verification scope

- Reproduced the integrated semantic suite: 84 constructions, 3,024 model round
  trips, 3,028 independently checked color cases including precision boundaries,
  and all five negative controls passed.
- Reproduced all 18 unit-only research checks, including mathematics, indexing,
  symmetry, angular baseline and site checks.
- Reproduced the existing integrated browser suite in Chromium, Firefox and
  WebKit: eight representative constructions per engine, rendering and pixel
  audits, mode retention, failure/race cases, legacy imports, offline editing
  and standalone exports all passed. The additional sequence above fails despite
  those passes and needs its own regression.
- Inspected the shared editor, corner adapter/model, renderer, browser tests,
  integration report and worked narrow screenshot.
- Added no application changes or committed tests during review. The targeted
  reproduction used disposable scripts outside the repository.

Historical planar seam and prototype browser suites are documented in the
delivery report; this review does not claim a fresh run of those suites.

## Next work prompt

When the user instructs you to follow this correction task, work in
`/home/rharris/git/madweave` on `docs/single-corner-prompt`. Inspect the working
tree and preserve existing work. Read this review, the
[integration report](SINGLE_CORNER_INTEGRATION.md), and the
[Stage 3C prompt](SINGLE_CORNER_STAGE3C_PROMPT.md), including its later user
clarifications.

Fix only pending formula/replacement transactions and their regression coverage.
Do not expand geometry, redesign the editor, change the accepted warning or
opacity policy, merge into master, deploy, or claim physical validation.

Deliverables and acceptance checks:

1. Reproduce the sequence above as a failing regression through actual shared
   editor controls. After correction, applying unchanged settings must preserve
   manual overrides, selection, palette, view and construction.
2. Treat immediate and staged formula changes distinctly. A successfully
   committed immediate formula must consume its replacement intent. A genuinely
   staged formula must apply once with the grouped transaction. Preserve the
   existing intentional behavior that choosing a formula resets manual colors.
3. Check the same sequence with CP previews and monochrome CC1, after a mode
   round trip, and after moving construction controls away and back without
   committing. Mere history must not turn an unchanged Apply into a reset.
4. Exercise a failed immediate formula redraw. Verify that the active design is
   retained and that the failed request cannot silently become a later committed
   replacement. Keep pending proposal text and replacement intent coherent with
   the chosen retry behavior. Add a genuine staged formula success/failure case
   so the fix does not simply disable intentional grouped recoloring.
5. Run the added cases in Chromium, Firefox and WebKit, including an offline
   save/reopen/edit cycle. Check the live source, generated runtime/assets where
   applicable, and worked offline artifact; regenerate affected deliverables so
   the documented example does not retain the bug.
6. Run the existing integrated semantic/browser and relevant unit/site checks.
   Broaden regression runs only if the correction affects shared rendering or
   planar behavior. Record exact coverage and results in the integration report,
   and update this review with the resolution and commit once known.
7. Review the final diff, stage only intended changes (including this review),
   commit and push `docs/single-corner-prompt`. Stop for review. Do not merge into
   master, deploy or begin another stage.

The stopping point is a narrowly corrected, tested branch with an updated
handoff. Merge authorization remains a separate user decision.

## Resolution — corrected, awaiting review

Fix commit: `3f67428` (`fix: consume immediately applied corner formula intent`).
The original review above remains the record of `2029873`.

The added native-control regression failed against `2029873` in Chromium with
exactly the reported override loss. The correction consumes immediate success
and discards failed immediate formula intent, restoring the proposal to the
retained active formula. Genuinely staged recoloring still applies once; failed
grouped redraws retain their proposal for retry.

Nine transaction scenarios now pass online and in the committed offline worked
file in Chromium, Firefox and WebKit, followed by offline resave/reopen and a
further formula/paint/unchanged-Apply check. The existing eight representative
integration cases per engine, four math tests, five site tests and 3,024 semantic
round trips / 3,028 independent cases also pass. Saved-model comparisons cover
material, selection, palette, view and construction. The worked file changes only
its bundled editor script; its model and other runtime assets are unchanged.
See [correction evidence](evidence/corner-paint-correction.json) and the
[integration report's correction record](SINGLE_CORNER_INTEGRATION.md#review-correction-consume-immediate-formula-intent).

No geometry, certificate, renderer, palette-policy or project-format changes were
made. Historical geometry/prototype/planar seam suites were not rerun for this
bookkeeping fix. No merge, deployment, broader stage or physical validation was
performed. Stop for review of the corrected branch.
