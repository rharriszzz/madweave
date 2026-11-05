# Corner project format, version 1

This is the editable state for the separate [Stage 3A prototype](SINGLE_CORNER_STAGE3A.md).
It is distinct from the production planar editor's `madweave-project` version 1.
Neither importer translates the other format. No production file or schema changes.

## Authority and construction version

The state has format `madweave-corner-project`, integer version `1`, and catalogue
`corner-nine-v1`. The catalogue contains precisely the nine certified Stage 2
constructions. Each construction has its original certificate's SHA-256 digest,
computed over the committed UTF-8 file bytes. The ID, digest, and complete exact
parameter object must agree with the trusted catalogue. A future change to
geometry, occurrence names, continuation, precedence, or certificate content
cannot silently reuse this mapping: it requires a new catalogue/version or an
explicit checked migration. No migration or occurrence renaming is implemented.

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

| Field | Version 1 meaning |
|---|---|
| `format`, `version`, `catalogue` | Exact identifiers above |
| `construction.id` | One of `planar`, `deficit`, `excess`, `sixty`, `c-on`, `self`, `hex-1`, `hex-0`, `hex-2` |
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

Version 1 fixes the distinct material-label palette to 0=`#477f79`,
1=`#bd713d`, 2=`#8b6da5`; monochrome uses label 0. Patterns are the existing
reference formulas, including their signed-index and phase rules. This fixed
interpretation is part of the format, not a palette inferred from SVG. A future
change to its material-color meaning needs a new version or explicit migration.
Palette editing and aliases are outside this stage.

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
- A separate `corner-assets` JSON block with the trusted nine-example catalogue,
  certified reference data, CSS, template, and runtime sources.
- A small inline bootstrap which runs those sources as one inline ES module.

There are no remote fonts, imports, script/style links, fetches, or server calls
in the standalone runtime. Its certificate link downloads inline JSON explicitly
(avoiding browsers' blocked top-level data-URL navigation). All nine
constructions and all compatible pattern choices remain available offline.
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
This scope is not the eventual allowed-angle list. The general 60° monochrome
baseline and pattern restrictions remain; other radii and degeneracies are
Unvalidated. Diagram acceptance and physical validation remain separate gates.
Reference ribbons are ideal straight, constant-width, zero-thickness material
with the previously certified seam transport. No custom-cut stock substitution,
physical validation or fabrication output is implied.
