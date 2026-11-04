# Contract for the first cone mapping prototype

This specification completes the preparation for a bounded cone experiment.
**No nonunit cone fraction has been enabled or executed by this research pass.**
The application remains planar. The prototype described here is the next phase;
it must satisfy this contract before becoming an editable application feature.

## Coordinate spaces and parameters

Use distinct spaces: screen CSS pixels; SVG root coordinates; canonical planar
unit coordinates; unwrapped polar coordinates `(r,theta)` with a unit index j;
and mapped output coordinates. A point's strip identity is independent of its
palette index and its SVG element name.

Let D=3 be the original number of direction families, N be the target direction
count, and f=D/N be the angular scale. The first prototype uses **N=6, f=1/2,
U=3 angular units per planar turn**, ordinary center, hand off, and default
spacing at even base size 2. These choices have simple planar 120-degree unit
symmetry and a two-turn input domain. They also deliberately expose the legacy
six-direction picking shortcut that must be replaced before acceptance.

For the initial prototype, require integer N≥3, U in `{3,6}`, finite positive
strip width and pitch, and explicit C/X/hand settings. Derive f, the unit angle,
and the unit count together; f is not an unrelated mutable setting. Reject
invalid or inconsistent combinations instead of retaining stale derived values.
General arbitrary fractions or angular expansions are outside this first phase.

## Forward map and unit assembly

The source's point map preserves radius and scales angle:

```text
F(r,theta) = (r cos(f theta), r sin(f theta))
unitAngle = 2π/U
outputUnitAngle = f * unitAngle
numberOfUnits = 2π/outputUnitAngle = N*U/D
```

A canonical unit has local angle in `[0,unitAngle]`. Its copy j uses the
**unwrapped** input angle `theta=thetaLocal+j*unitAngle`. Adjacent copies share
one geometric boundary; only one owns that boundary for picking/identity.
Use half-open intervals for ownership, with the final outer ray identified with
the first ray for a complete turn.

The total unwrapped input angle is `2π/f`; its image covers exactly one output
turn. For the chosen prototype, six 120-degree input units span 720 degrees
and map to six 60-degree output units spanning 360 degrees. No radius scaling
is applied: the source's commented `r*coneFraction` alternative is not this map.

This bookkeeping is derived from angular closure. The dormant source instead
sets `directionsInUnit=U/D` and `numberOfUnits=N/(U/D)`. That agrees with the
closure count when U=3 but is four times too small when U=6. For example, the
legacy startup star flag with N=3 gives 1.5 units instead of the six needed to
cover a turn with 60-degree units. `numberOfUnits` has no later use today; this
inconsistency is dormant. The prototype must use the closure-derived definition,
not infer completed assembly from those legacy variable names.

## Strip and mask composition

Clip planar geometry to the canonical unit first. Apply the **same** coordinate
map, unit offset, approximation tolerance, and seam ownership to strip fills,
edge-line shapes, clip-mask boundaries, and selection outlines. Replicating
mapped strips while keeping planar masks is invalid.

Create globally unique element IDs that include the unit index. Define a
physical-strip identity graph across adjacent unit boundaries: endpoints joined
at the same output point belong to the same continuation, regardless of their
local H/R/L/class names. Check positions, tangent continuation, width boundaries,
upper/lower order, and palette assignment on paired seam segments. The first
and last units require the same checks as internal neighbors.

The planar 120-degree symmetry test supplies the unit's local-order covariance.
Six such units have net identity direction/class phase in the selected setup.
That is useful input to seam matching; it is not a substitute for constructing
and checking the actual seam identity graph. Color must be assigned consistently
to joined physical strips, not independently reset in every unit.

## Inverse map and picking

Convert the event through the actual screen-to-root inverse matrix first. For
mapped polar angle phi in `[0,2π)`, compute:

```text
j = floor(phi/outputUnitAngle)
thetaLocal = phi/f - j*unitAngle
rLocal = rOutput
```

Reconstruct the canonical planar point and use the existing planar strip
indexing there, carrying j into the global strip identity. Choose the seam's
owner deterministically; handle final-ray wrap consistently. Do not apply the
map twice when an event target has its own SVG transform.

The source currently skips angular inversion when `numberOfDirections==6`.
That shortcut is harmless at f=1 but has no justification for the proposed
f=1/2 prototype. Replace it with a single explicit coordinate conversion valid
for every supported N. At the apex, angle is undefined; picking within a declared
apex epsilon must return an explicit ambiguous/no-selection result rather than
an arbitrary strip or NaN.

## Clipping, continuity, and numeric accuracy

The unit wedges considered here are convex. Clip segments with half-plane
inequalities and bounded parameter intervals. Parallel lines, collinear
boundaries, zero-length segments, and apex crossings need explicit outcomes;
do not feed the nonfinite result of a line intersection into later angle math.

Maintain a continuous angle within each declared unit. A global mutable
`lastAnglet` shared across unrelated paths is not sufficient ownership of the
angular branch. Split or explicitly parameterize segments crossing an angular
cut or the apex. Include exact endpoints; the source's
`n/(1e-6+npoints-1)` stops short of the final endpoint and is a characterized
legacy behavior, not the prototype's accuracy rule.

Mapped straight edges are generally curved. For an input segment p(t)=a+t v
away from the apex, differentiating the polar map gives:

```text
|F''(t)| = |1-f²| * cross(p(t),v)² / |p(t)|³
         ≤ |1-f²| * |v|² / rho
```

Here rho is the minimum distance of the considered input interval from the
apex. A second-derivative bound M gives chord error at most `M*deltaT²/8`.
Choose subdivisions from that bound, with separate apex handling. The baseline
world tolerance is `stripWidth/1000`; when rasterizing, also require projected
error below 0.25 pixels. A maximum-depth failure must be reported, not silently
accepted. At f=1 the curve term vanishes, so exact planar endpoints are the
reference. Increasing `npoints` without a bound is not an acceptance criterion.

## State, export, and validation

The first experiment is a research fixture with explicit serialized parameters
and generated evidence. Before a UI release, add a versioned project-state
extension for N, U, unit/branch policy, and approximation tolerance. A version-1
planar project must retain its old meaning. Unsupported versions/configurations
must leave the current project intact. Save/reopen, static SVG export, selected
strip identity, and painted/hidden joined strips need round-trip tests.

The angular scaling map contracts tangential lengths by f while retaining radial
length. It therefore does not preserve the planar length metric. An attractive
mapped SVG is not by itself proof that unchanged physical-width strips can be
woven into that shape. Any physical cone claim needs its own material and
seam construction evidence.

## Acceptance sequence for the next phase

1. Keep the completed planar suite passing, including Firefox rendering controls.
2. Implement explicit parameter derivation and f=1 equivalence, exact endpoints,
   unit clipping, and bounded approximation before the nonunit fixture.
3. Generate the specified N=6, U=3 fixture and verify angular closure, strip/mask
   agreement, all internal seams, the joined seam, and the physical-identity graph.
4. Check inverse selection and painting on both sides of each seam; exercise the
   former six-direction exception directly.
5. Compare SVG output with an independent numerical oracle and preserve images,
   parameters, numeric bounds, and known raster artifacts.
6. Add editable state/UI support only after that fixture is understood and the
   application save/import/export checks cover it.

The [unit-fraction helper audit](angular-baseline.test.cjs) already checks 15
finite line intersections, 428 clipped segments at 60/120-degree unit angles,
5,184 planar/inverse strip picks, branch-cut continuity, and the legacy endpoint
and initialization quirks. Those tests keep f=1 throughout; they characterize
what is ready to reuse and what must change in the prototype.
