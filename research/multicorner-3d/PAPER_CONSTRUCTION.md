# Understanding the paper construction for multiple corners

Recorded 2026-11-05 from Richard's explanation in this conversation.
This is the working construction model for the 3D explorer. Richard will help
refine the details as we develop it together.

**Clarifications on 2026-11-07:** the original photographed hat used four paper
pieces: one central piece extending to the outer edges and three added wedges,
one for each outer corner. Ease of building and symmetry when possible are
general design priorities. Prefer a connected net and do not assume a two-piece
split is necessary. The [construction preferences](BUILD_PRIORITIES.md) record
these decisions, a checked one-piece alternative, and the intended regular
polyhedron scope, including the unresolved dodecahedron question.

Richard also describes families of triangles that expand and turn relative to
the triangular grid, with a winding-number-like indexing. The
[lattice note](TRIANGULAR_LATTICE.md) records this and a working interpretation
using two integer lattice steps; these choices belong to the paper construction.

## The construction Richard described

Start with one or more pieces of graph paper carrying a printed madweave or
hexweave pattern. Choose the locations of the corners in the openings between
strips: a corner point must not lie over a strip. Where the pattern offers two
kinds of openings, the smaller or larger kind may be preferred for a particular
construction. Keep that choice explicit.

At each chosen corner, cut out the angle that is unwanted, or use another
printed sheet to supply additional angle. Tape the corresponding paper edges
together. Repeat this on the paper construction to make several corners.

Richard's point is that fitting the corners together is generally a direct
paper operation. The digital model should begin with this cut-and-tape recipe.
My earlier framing gave too much emphasis to a general corner-assembly problem
before understanding this practical construction.

## What I understand this to mean

The starting object is patterned paper. The printed strips supply the weave
layout and its registration across joins. We can first model and display that
paper surface with its pattern; modeling separate physical ribbons can follow
when it is useful. A sheet with a printed weave and an object woven from loose
strips are different representations, even when they show the same pattern.

The corners belong to one connected construction made from the original sheet
and any added pieces. We should describe which pieces are retained and which
boundaries are taped together, rather than begin with separate 3D cones and
try to position them so that they meet.

For angle bookkeeping, I understand removal and insertion as:

```text
remove an angle A: reference angle remaining around the corner = 360° - A
insert an angle A: reference angle assembled around the corner = 360° + A
```

For example, removing 120° leaves 240°; inserting 120° gives 480°. These are
reference angles in the assembled paper, distinct from a fold's dihedral angle
or the angular multiplier used by the existing flat corner diagram. The existing
corner knowledge will guide compatible angle, pattern and phase choices.

I understand the instruction about avoiding strips to refer to the **corner
point**. It does not by itself require an entire cut path to stay within the
openings. The exact cut paths and boundary registrations remain details for us
to work through with concrete examples.

The tape joins paper boundaries. It does not imply that every depicted strip
must be separately cut and taped. Across each join, we need enough information
to follow the intended printed pattern and, later, the corresponding strip
identities. I expect matching print scale and deliberate pattern registration
to matter; those are implementation inferences, not additional instructions
Richard has supplied yet.

## Preferred implementation sequence

Richard's subsequent direction is to implement this construction in POV-Ray and
get it working there first. He knows POV-Ray and does not know Blender. Once we
have working software and a concrete example, translate that construction into
something more browser friendly, reusing existing rendering software. Porting a
working model should be easier than designing the construction and a new
platform at the same time. The [existing-software notes](EXISTING_SOFTWARE.md)
record the viewer candidates and the revised effort estimates.

## Two views and the hat example

Richard subsequently specified at least two views. The first is a **2D net**
starting from planar madweave or hexweave: choose a corner in an opening, choose
its angle, and repeat for several corners. The second is the **3D construction**
built from that net, initially as a POV-Ray model. Its assembly should relate
to how the physical paper model is built. The views describe the same pieces,
corners and joins, rather than unrelated drawings.

The supplied hat is the example we should work through. A raised triangular
top, connecting walls and a surrounding brim are visible, but a specific net,
corner-angle ledger and assembly sequence remain to be established together.
The [GPT-6 Astra advisory prompt](ASTRA_DESIGN_PROMPT.md) asks for a concrete
candidate, labeled diagrams and advice on the shared model and workflow.

## Consequences for the explorer

A useful construction record would contain:

- The printed pattern, scale and registration of each source sheet.
- Chosen corner points and their opening kinds, retaining smaller/larger or
  differently shaped openings where relevant.
- Removed regions and inserted paper pieces, with their source-sheet identities.
- Explicit pairs of boundaries that are taped together and their orientation.
- A 3D placement for viewing the resulting paper surface.

The paper pieces and their boundary pairings describe the construction. Its
particular 3D pose is a related viewing/modeling choice: the same instructions
may allow bending or folding that the cut-and-tape record alone does not fix.
We can develop that placement together using Richard's examples. We do not need
to start by building a general physical relaxation solver.

The first interaction can follow the workshop process: choose the printed
weave, mark corners in openings, remove or add angle, identify the taped edges,
and inspect the result in 3D. A paper view and a 3D view should refer to the same
pieces, corners and joins. These are proposed interactions, not implemented
features.

## Details to learn together

Concrete examples will clarify which openings Richard prefers in each pattern,
how he chooses the cuts and inserted pieces, how the printed pattern registers
at a taped join, and how he bends or folds the assembled paper into the desired
shape. These are the next details to understand through collaboration, rather
than reasons to postpone recording or exploring the basic construction.

The [supplied photograph](reference-folded-paper.png) is the first visual
reference. The [rendering comparison](README.md) remains useful independently
of which construction and 3D pose we choose first.
