# Paper construction preferences and connected nets

Recorded from Richard's clarifications on 2026-11-07.

## The original hat uses four pieces

The photographed hat has **one central piece that reaches all the way to the
hat's outer edges, plus three wedges, one for each outer corner**. Richard
corrected an initial recollection of three components to four total.

This is different from the earlier proposed two-sheet cap-and-brim construction.
Do not describe that proposal as the original paper recipe. The precise cuts,
wedge placements and corner movements in the original still need to be mapped
with Richard; the photograph alone does not establish those details.

## Design priorities

Richard wants **ease of building**, and **symmetry when possible**. Prefer a
single connected piece when practical. Do not split a construction into two
components by default or claim that the split is necessary without checking
alternatives. Keep the user free to choose a convenient several-piece build,
such as the original four-piece hat.

Piece count alone does not measure ease: consider awkward cuts, tape access,
folding sequence, printable sheet size, pattern registration, repeated pieces
and symmetric operations. A symmetric net and symmetric assembled shape are
related but separate choices. State why a proposed split helps if one is used.

Distinguish three meanings of a cut:

- **One paper component:** the retained paper stays connected before taping.
- **One continuous cutting path:** scissors can follow one outside boundary,
  changing direction and making multiple snips.
- **One straight snip:** a much stronger requirement, not established here.

## A checked one-piece alternative for the hat

The [working hat recipe](hat/README.md) now unfolds to one connected piece.
Keep the triangular top T attached to three walls W0–W2 at F0–F2, and keep each
brim trapezoid R_i attached to the bottom of its own wall at K_i. The seven
panels therefore connect through six full-length retained fold edges.

In paper coordinates, unfold R_i by translating its earlier brim coordinates
outward by `H o_i`. This is a rigid translation. In the assembly its 3D position
remains the same as before. The translations preserve this recipe's class-colored
periodic print because H=6P gives the checked compatible phase shifts.

The radial edges between the brim trapezoids become cuts to tape at D0–D2;
the wall-side cuts still tape at J0–J2. Thus the one-piece construction retains
threefold symmetry and still needs six taped edge pairs. The top, walls, brim
and six assembled corner angles are unchanged.

For the default and smaller example, checks establish one connected paper
component, no positive-area panel overlaps, and one 15-segment outside cutting
loop with no enclosed holes. A single continuous traversal can cut it from a
large enough sheet. It takes several scissor closures; no fold-and-single-snip
construction is claimed. The current 6 mm pitch net exceeds A4, so a physically
one-piece print needs a sufficiently large sheet or a separately explained
printing/joining arrangement.

## Regular polyhedra are part of the intended scope

Richard points out that many regular polyhedra suit madweave or hexweave and
is uncertain about the dodecahedron. Preserve this as a motivation for the
faces-first and recipe-first authoring paths; the application must not become
hat-specific.

The elementary angle sums give a useful first comparison:

| Regular solid | Faces meeting at a vertex | Incident paper angle | Deficit |
| --- | --- | ---: | ---: |
| Tetrahedron | Three equilateral triangles | 180° | 180° |
| Octahedron | Four equilateral triangles | 240° | 120° |
| Icosahedron | Five equilateral triangles | 300° | 60° |
| Cube | Three squares | 270° | 90° |
| Dodecahedron | Three regular pentagons | 324° | 36° |

These values are the incident count times the regular polygon's interior angle;
see the [regular polygon angles](https://mathworld.wolfram.com/RegularPolygon.html)
and [dodecahedron vertex arrangement](https://mathworld.wolfram.com/RegularDodecahedron.html).
The triangular cases fit the current 60° sector arithmetic, subject to phase,
strip/order and global registration checks. Cube and dodecahedron vertices
fall outside that existing symmetric-sector family. This does not by itself
prove that every alternative weaving construction is impossible.

Paul Gailiunas's original [A Mad Weave Tetrahedron, Bridges 2011](https://archive.bridgesmathart.org/2011/bridges2011-39.pdf)
describes madweave/open-hexagonal constructions of tetrahedra, octahedra and
icosahedra, and discusses the importance of the appropriate symmetry centers.
His [Patterns for Skew Mad Weave Polyhedra, Bridges 2013](https://archive.bridgesmathart.org/2013/bridges2013-13.pdf)
develops color and symmetry restrictions for these examples. These are useful
construction references, not certificates for this program. Keep the regular
dodecahedron an explicit research question rather than silently approximating
its pentagon angles or declaring it impossible from the present catalogue.

Richard subsequently noted its relationship to the icosahedron as a possible
lead, but explicitly chose to **work on the easy constructions first**. Defer
the dodecahedron investigation; it does not block the simple symmetric hat or
the established triangular-face examples.

Richard further emphasizes that triangular-faced shapes have many constructions:
triangles on the underlying grid can grow and turn relative to the weave. The
[triangular-lattice note](TRIANGULAR_LATTICE.md) records this explanation and a
working two-integer parameterization. Preserve both size and relative orientation
as choices; the current hat's aligned triangle is only one example.
Richard clarifies that repeating triangles with the same chosen lattice offset
preserves the pattern and gives a constructable result. Use that repetition as
a generation rule, with checks that verify our implementation follows it.
