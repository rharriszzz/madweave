# Corner project formats, versions 1, 2 and 3

Version 2 is the editable state for the separate [Stage 3B prototype](SINGLE_CORNER_STAGE3B.md).
It retains version-1 imports from [Stage 3A](SINGLE_CORNER_STAGE3A.md).
It is distinct from the production planar editor's `madweave-project` version 1.
Those Stage 3A/3B importers remain unchanged. The integrated Stage 3C editor now
dispatches both families through shared Open; planar v1 meaning is unchanged.
See the integrated v3 section below.

## Authority and construction version

The current state has format `madweave-corner-project`, integer version `2`, and
catalogue `corner-family-v2`: 84 certified constructions from the
[bounded matrix](corner-prototype/family-matrix.json). Each construction has its
certificate's SHA-256 digest,
computed over the committed UTF-8 file bytes. The ID, digest, and complete exact
parameter object must agree with the trusted catalogue. A future change to
geometry, occurrence names, continuation, precedence, or certificate content
cannot silently reuse this mapping: it requires a new catalogue/version or an
explicit checked migration.

Version 1 used `corner-nine-v1` and precisely the nine Stage 2 constructions.
The new runtime retains those exact trusted certificates, IDs and digests.
Importing v1 restores all model, color, view and local-selection data unchanged;
resaving changes only the version/catalogue fields to v2. No occurrence is
renamed. A new family ID forged into a v1 envelope is rejected. The archived
Stage 3A standalone files still run their own original nine-example runtime;
open one through the **current prototype's Open control** to migrate it to the
expanded runtime. Old v1 software does not import v2 states.

Authoritative input is the construction reference, material pattern, view and
selection below. SVG paths, inspection text, component indices in controls,
saved compatibility claims and validation labels are not input authority.
The application reconstructs a fresh `Diagram` from its bundled certificate,
recomputes color compatibility, reconstructs local occupancy/order from reference
coordinates, and prepares the entire candidate drawing before commit. Catalogue
certificates and their complete order-cell partitions are independently checked
by Python during the deterministic package build. The browser does not run that
Python checker or claim a new proof for arbitrary imported geometry.

## State fields

All fields are required. Unknown fields are rejected, including a `validated`
flag. JSON null is distinct from zero. Rational parameters keep their certificate
string representation; alternate numeric spellings do not change a construction.

| Field | Version 1 / 2 meaning |
|---|---|
| `format`, `version`, `catalogue` | Exact identifiers above |
| `construction.id` | V1: `planar`, `deficit`, `excess`, `sixty`, `c-on`, `self`, `hex-1`, `hex-0`, `hex-2`. V2 also has the 75 new IDs listed in [family.json](corner-prototype/family.json) |
| `construction.digest` | Catalogue's SHA-256 string for that certificate |
| `construction.parameters` | Exact `alpha`, `sectors`, `beta`, `f`, `k`, `C`, `hand`, `X`, `member`, `W_over_P`, `R_over_P` object; these are consistency checks, not arbitrary editing inputs |
| `material.pattern` | null for monochrome; integers 0–4 for direction, class, direction+class, group, class+group; must be constant on every joined component |
| `view.rotation` | Display degrees: 0, 23, 90, or −137 |
| `view.center` | Fixed display translation `[1.25,-0.75]`, distinct from reference center |
| `view.outlines`, `view.seams`, `view.edges` | Boolean hidden-piece inspection, seam/partner rays, and visible over/under boundaries |
| `view.annotations` | Boolean explicit policy for including current inspection overlays in SVG export; default false |
| `selection.strip` | null or stable joined-strip key: lexicographically smallest occurrence string in the component |
| `selection.local` | null for no local-position inspection, otherwise the object below |

An occurrence string is `sector:direction:signedIndex`, for example `0:2:3`.
Sector is part of identity even when planar orientations repeat. Joined-strip
keys refer to components of full material regions, including fringe pieces;
crossings do not join components. UI strip numbers and crossing list indices are
derived and are never stored as stable identity.

Both versions fix the distinct material-label palette to 0=`#477f79`,
1=`#bd713d`, 2=`#8b6da5`; monochrome uses label 0. Patterns are the existing
reference formulas, including their signed-index and phase rules. This fixed
interpretation is part of the format, not a palette inferred from SVG. A future
change to its material-color meaning needs a new version or explicit migration.
Palette editing and aliases are outside this stage. Proposed, unapplied control
values are not saved. Active construction ID/parameters reverse-map to the
trusted weave/phase/angle/crop choices, rather than storing a second conflicting
authority for them. View/color-only changes preserve material identities. A
different construction ID clears selection on Apply, with an explicit message;
no correspondence between different assemblies is assumed. Saved-file selection
is restored only after validation against that file's construction.

`selection.local` contains:

| Field | Meaning and validation |
|---|---|
| `sector` | Integer owned reference sector, 0 through sectors−1 |
| `point` | Finite `[x/P,y/P]` relative to the reference center; inside disk and half-open sector `[0,alpha)` |
| `positions` | Complete, unique occurrence strings present at that point, in independently reconstructed top-to-bottom order |
| `active` | One of those positions; its component must agree with `selection.strip` |
| `crossing` | null for a general click; otherwise the exact certificate event `{pair:[[j,d,s],[j,d,s]],XY:[rational,rational]}` matching that point and sector |

Reference XY uses `X=sqrt(3)*x/P`, `Y=y/P`. Local Cartesian points are stored as
double-precision JSON numbers. Radius and band membership use a roundoff allowance
of 1e−12; a stored crossing must agree with its reference point within 1e−10.
These are numerical identity checks within the certified catalogue, not a general
exact-arithmetic import validator. Display rotation does not change the stored
reference anchor. Exact rays use the kernel's half-open sector ownership and
roundoff snap, including the final wrap. Empty holes have no selected local
material. A self-crossing stores both distinct occurrence identities and its
active position, even when the strip key is the same.

The worked self-crossing has ordered positions `0:2:3`, `0:0:3`, selected strip
`0:0:3`, and reference XY=`["3/2","1/2"]`. Either active position is meaningful
and survives a round trip. There is no ID renaming.

## Editable HTML envelope and offline runtime

Save produces `corner-ID.corner.html`, a standalone HTML application containing:

- One inert JSON script `id="corner-project" type="application/json"` with the
  state above, escaping `<` as `\u003c`.
- A separate `corner-assets` JSON block with the trusted versioned catalogue,
  certified reference data, CSS, template, and runtime sources.
- A small inline bootstrap which runs those sources as one inline ES module.

There are no remote fonts, imports, script/style links, fetches, or server calls
in the standalone runtime. Its certificate link downloads inline JSON explicitly
(avoiding browsers' blocked top-level data-URL navigation). All 84 constructions,
the compatibility matrix, grouped controls and compatible patterns are available
offline in v2. Version-1 files retain their original embedded runtime until opened
and resaved through the new prototype.
Resaving builds a fresh envelope from the template and current state, so SVG,
old runtime instances and old status text do not accumulate in successive saves.
Downloads report that a file was *prepared*; they cannot certify that the user
completed a browser save dialog.

Open accepts that envelope or raw state JSON. It reads only the inert state text;
imported HTML scripts, SVG, CSS, bundled certificates and runtime are not inserted,
executed or used as authority. Raw JSON alone is useful for import but lacks the
runtime needed for standalone offline reopening. SVG artwork is rejected as an
editable project. Files over 10 MiB of text, malformed JSON, missing/duplicate
state envelopes and invalid schemas are rejected before commit.
Current v2 files are about 4 MB, including the whole runtime/catalogue. Exhaustive
round trips for all 268 compatible assignments verify they fit the import limit;
state contains only bounded catalogue references, finite coordinates and at most
three local positions, with no unbounded user text or rendered SVG.

Unsupported version, catalogue or construction IDs report **Unvalidated**.
Inconsistent parameters/digests, malformed fields, invalid identities and
incompatible coloring report **Invalid** with the reason. Read/render failures
report **Unvalidated**. Rejections retain the exact active model, SVG, controls,
selection and inspector; status explains the failed attempt and retained design.
An Invalid parameter mismatch describes an inconsistent project file, not an
impossibility theorem for the requested radius. Other radii remain Unvalidated.
Every file read shares the existing revision token with example fetches, view,
color, inspection, save and export intents. Late completions/errors cannot replace
a newer choice or its status. Canceling a file dialog makes no model change.

## Static SVG envelope

SVG is script-free artwork, with inline colors, styles, all material and cell
definitions, unique local occurrence IDs, reference vertices, local order stacks,
and component/join/crossing metadata. It is not used for editable rehydration.
The exported diagram uses the same bounded map for bands, cells and annotations.
The fixed output is 1024 by 1101 with a viewBox and a visible two-line legend:
physical constructibility unverified; not an editable project or fabrication
template. Coordinates have no stock-specific physical units or cutting allowance.

By default, SVG excludes selection, seams, dashed hidden inspection and solid
visible-boundary annotations even when displayed in the editor. The explicit
checkbox includes the current enabled overlays and selection. `title`, `desc`,
metadata and the visible legend record this choice. Annotation inclusion changes
neither material paths/colors nor component or crossing identity. The metadata
also records world/chord tolerance and the export target scale; enlarging an SVG
changes its pixel error while preserving the bounded world approximation.

All catalogue results still explicitly pass open-strips-only compatibility.
The v2 range is 60°–720° in 60° steps, W/P=3/4, with the phase/crop restrictions
in the matrix. It is not the eventual allowed-angle list. The general 60° monochrome
baseline and pattern restrictions remain; other radii and degeneracies are
Unvalidated. Diagram acceptance and physical validation remain separate gates.
Reference ribbons are ideal straight, constant-width, zero-thickness material
with the previously certified seam transport. No custom-cut stock substitution,
physical validation or fabrication output is implied.

## Integrated corner v3 and shared editor envelope

The [Stage 3C editor](SINGLE_CORNER_INTEGRATION.md) uses
`madweave-editor` version 1 with exact fields `format`, `version`, `active`,
`design`, `selection`. `active` is `planar` or `corner`. `design` contains the
unchanged planar v1 model or corner v3 model. Envelope `selection` is a bounded
planar strip index or null; corner local identity belongs inside `design`.
Only the active design is saved. Both designs and their palettes/selections are
retained in the running session, but the inactive design and pending proposals
are not persisted. There is no implied planar-to-corner conversion.

Corner v3 retains the v2 construction, catalogue, view and selection contracts.
It adds required fields `palette` (eight normalized integer-channel RGB strings),
`opacity` (eight finite numbers in [0,1]), `recent` / `recentOpacity` (four each),
`selectedColor` (0–7), `controlsHidden` (boolean). `material` now contains
`pattern` (null or 0–4) and `overrides` (sparse map from stable component key to
slot 0–7). An override colors the entire component. Unoverridden occurrences
keep their formula assignment; this preserves a user's warned/discontinuous
base assignment when painting a different strip. Overrides do not join crossings.
Changing construction clears custom assignments and selection after disclosure;
view changes retain them. Formula changes explicitly replace custom assignments.

Canonical RGBA equality uses normalized RGB and alpha rounded to 1e−12;
colors whose rounded alpha is zero are equivalent irrespective of hidden RGB. Equal colors
in different slots satisfy continuity. Every actual material occurrence must
still reference its assigned slot. User-authorized color conflicts are retained
and diagnosed at each join, never represented as Validated color continuity.
Other malformed or inconsistent state is rejected atomically.

Import of v1/v2 first checks their construction/digest/parameter and identity
contracts against the unchanged trusted catalogue. It preserves each original
pattern and maps the fixed three colors to the first three opaque slots; five
additional slots and recent colors receive documented defaults from
[corner-model.mjs](../corner-model.mjs). No material identity is renamed. A
neutral-color pass is used only to validate legacy geometry/selection; the real
assignment is restored and every real seam conflict recomputed. Ordinary planar
v1 JSON/HTML and original editable planar SVG are accepted without schema changes.
Raw JSON import does not itself provide the offline runtime.

Shared Save writes `madweave-project.html`: one inert `madweave-project` state
block plus `madweave-assets` with trusted planar engine, corner runtime/adapter,
wrapper, CSS and five embedded preview images. Import reads only inert model
text; file scripts, SVG and saved validation claims are never authorities.
The shared importer and generated files preserve the existing 5 MiB planar
and 10 MiB corner limits; the research importer also retains its 10 MiB limit. Offline files contain the full 84-construction runtime
and both modes, and can reopen/resave/export without HTTP requests. Reopening a
single-mode file starts the other mode at its supported default, not at any
unsaved session design from the original tab.

Static corner artwork metadata is `madweave-corner-artwork` v2. It documents
palette/opacity, sparse material assignment, construction, components, joins,
crossings, view, approximation bounds, annotation policy and warning count.
Actual native SVG stacks carry local order and use only local definitions.
Artwork remains separate from editable projects and fabrication templates;
physical constructibility remains unverified.
