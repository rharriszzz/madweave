# MadWeave control reference

The SVG editor has **52 control targets**. Each target ID is `cbutton` followed
by the name below; its visible rectangle is `button` plus that name. The handlers
are installed by [`buildButtons`](../madweave.js). SVG buttons respond to
`mousedown`; a synthetic `click` event alone does not invoke them. The complete
inventory and behavior are exercised by
[`editor-button-experiments.cjs`](editor-button-experiments.cjs).

## Pattern and size

| Visible control | Name | Effect |
|---|---|---|
| Five previews, top to bottom | `CP0`–`CP4` | Assign palette indices using `d`, `c`, `d+c`, `n`, or `c+n`, respectively, modulo the pattern color count |
| Upper-left 1–6 | `CC1`–`CC6` | Set the modulo color count for the selected built-in pattern |
| Lower-left 1–8 | `SC1`–`SC8` | Set `baseSize`; gives 3–24 strips per direction, or 9–72 total |

Here `d` is the H/R/L direction index, `c` is the a/b/c class, and `n` is the
period-three group number. See [the planar model](PLANAR_MODEL.md).

**Every CP or CC press resets manual strip colors and individual visibility,
including pressing the already-selected value.** A changed size also resets
those arrays. Pressing the same size preserves them. Palette edits, layer and
direction filters, and orientation settings are separate state; these buttons
are not a complete reset of the design.

## Palette, recent colors, and painting

| Visible control | Name | Effect |
|---|---|---|
| Eight top swatches | `C0`–`C7` | Select the palette slot to paint with or edit; all strips using that slot share its color/opacity |
| V | `V` | Enter show-strip mode; see the discrepancy below |
| I | `I` | Enter hide-strip mode; painting hides the selected strip while retaining its palette index |
| Four recent swatches | `LAST0`–`LAST3` | Copy a recent color **and opacity** into the selected palette slot |
| Opacity slider | `OB` | Set opacity from horizontal position, normally 0–1 |
| Hue slider | `HB` | Set hue from horizontal position, normally 0–360 degrees |
| Saturation slider | `SB` | Set saturation from horizontal position, normally 0–1 |
| Value slider | `VB` | Set value/brightness from horizontal position, normally 0–1 |

Move over a strip, allow approximately 400 ms of stable tracking, and move again
until its selection outline appears; mouse down then acts on the selected strip.
The selector tracks strip directions over time, so a bare click at an intersection
is not equivalent to selecting the visually uppermost strip. Normal painting sets
the selected palette index and makes that strip individually visible.

Recent colors are a four-entry color/opacity history updated by palette selection
and color editing. They are not an undo stack for strip edits or orientation.
Slider and recent-color handlers return immediately in both I and V modes.

### Verified discrepancies

These behaviors are reproduced and explicitly labeled as characterizations in
the control test. They are open issues, not proposed semantics:

1. **V recolors while showing.** The tooltip promises visibility without a color
   change. `setStripColorToCurrentDefault` handles hide mode separately, but its
   other branch also runs in V mode and assigns `defaultColorIndex`. A strip using
   slot 0 becomes slot 6 if it is shown with slot 6 selected.
2. **The first palette press after I/V only exits that mode.** With slot 0 selected,
   enter I, then press slot 6: painting resumes with slot 0 still selected. A
   second press selects slot 6. The same behavior occurs after V.

These should receive desired-behavior regression tests when fixed. Existing
characterization assertions will need deliberate updates at that time.

## Layers, directions, and local order

| Visible control | Name | Effect |
|---|---|---|
| a, b, c | `VH0`–`VH2` | Independently show/hide the three interleaved hexweave classes |
| H, R, L | `VD0`–`VD2` | Independently show/hide horizontal, up-right, and up-left strip families |
| − | `-` | Toggle `hand`; reverses pairwise precedence for strips in the same hexweave class |
| X | `X` | Toggle `alternate`; reverses every pairwise precedence relation |
| C | `C` | Toggle `starMadWeaveCenter`; shifts class membership in diagonal families and recomputes local crossing masks |
| L below the direction controls | `Lines` | Toggle thin gray shapes along strip edges; these are added paths, not a global strip stroke |

All three directions occur within each a/b/c class. To isolate a, hide b and c
while keeping H/R/L enabled; similarly isolate b or c. In the full weave,
C changes local over/under order while the underlying physical strips stay in
place. The current orientation handlers preserve per-strip palette and visibility
arrays; they do not rerun a built-in color pattern just because a class changed.

Effective strip visibility combines its individual visibility flag, its class
filter, and its direction filter. V cannot override a disabled class/direction.
A fully transparent palette slot can also make a logically visible strip unseen.

## Spacing, help, and hiding controls

| Visible control | Name | Effect |
|---|---|---|
| N, M, W, E | `Sep0`–`Sep3` | Set gap/strip-width ratios to 0.07, 0.33, 0.8, or 2.0; pitch is strip width plus gap |
| Bottom HB | `HideButtons` | Hide the other controls; press the same target again to restore them |
| Hover any control | Its existing target | Show its help text; mouse out hides it |

Spacing recalculates geometry, the view box, and controls, while preserving manual
strip colors and visibility at the same size. Hiding controls leaves its own
HB target available. **Bottom HB and the hue slider's internal HB are distinct.**
The help text is display-only (`pointer-events="none"`). A pattern-detail control
called `SP` exists in comments/code but is not an exposed button.

## HTML wrapper controls

| Control | Effect and test coverage |
|---|---|
| Save Project | Download complete editable HTML, with state, scripts, and images; offline opening/resaving is tested |
| Open Project | Import saved HTML/JSON state or a legacy editable SVG; reject invalid input without replacing the current design |
| Export artwork as SVG | Download static artwork with scripts/controls removed; it is not an editable project |
| Open SVG directly | Navigate to the standalone SVG entry point |
| Quick control reference | Native HTML disclosure; it describes controls rather than changing the weave |

The wrapper is implemented in [`editor.js`](../editor.js) and [`project.js`](../project.js).
The application browser suite covers saving/importing/exporting. The guide now explains the current I/V behavior; the historical SVG tooltip
still promises visibility without recoloring, as documented above. There is no full undo or autosave.
