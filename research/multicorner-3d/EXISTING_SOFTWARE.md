# Existing software and the POV-Ray first workflow

Updated 2026-11-05 following Richard's clarification: **make the construction
work in POV-Ray first, then port the working construction to a browser viewer.**
Richard already knows POV-Ray. Blender is not part of the recommended workflow.
This supersedes the earlier proposal to start by comparing custom browser
renderers. The earlier custom-development estimates are not the budget for
reusing existing software.

## The sequence we will use

1. Develop the patterned-paper construction together in POV-Ray. Use Richard's
   cut, insert and tape method, and the existing planar/corner knowledge.
2. Preserve the working scene, parameters, joins and useful reference views.
   Establish the geometry and behavior there before choosing a browser design.
3. Translate that working construction's calculations and geometry into an
   appropriate browser representation. Reuse an existing viewer for rendering,
   camera controls and basic selection.
4. Compare positions, joins and pattern registration with the working POV-Ray
   example. Keep POV-Ray available for rendering and as a reference throughout.

The browser port is of **our working construction**, not a reimplementation of
the POV-Ray renderer. We can use whatever POV-Ray representation makes the
first construction easiest; a portable mesh representation can come afterward.
This keeps an interchange format from becoming a prerequisite for the first
working example.

## Software worth reusing

| Software | Existing capabilities | Fit for this project | Evidence checked |
| --- | --- | --- | --- |
| POV-Ray | Scene language, geometry, textures, cameras and rendering | First implementation and continuing reference, as Richard proposed | Richard's established workflow; no new MadWeave POV-Ray model claimed here |
| [Google model-viewer](https://modelviewer.dev/) | glTF/GLB display, camera interaction, textures, surface picking and material editing | Small browser wrapper once we have working geometry to port | Package 4.4.0 inspected and tested locally in Chromium and Firefox |
| [Babylon.js Sandbox](https://sandbox.babylonjs.com/) | Ready-made model viewer with object/material inspector and environment controls | Immediate inspection of exported meshes without building a viewer | [Official Sandbox documentation](https://doc.babylonjs.com/toolsAndResources/sandbox/) reviewed; not locally exercised |
| [three-gpu-pathtracer](https://github.com/gkjohnson/three-gpu-pathtracer) | Existing GPU path tracer and examples | Optional later browser rendering upgrade, if useful alongside POV-Ray | Author's source/examples and published package 0.0.28 reviewed; not locally exercised |

These are ready-made software or reusable components, rather than additional
renderers for us to implement. No Blender learning is needed for this sequence.

## A browser viewer already works in the local probe

Google's component supplies the basic viewer with this much markup:

```html
<script type="module" src="./model-viewer.min.js"></script>
<model-viewer src="construction.glb" camera-controls
              alt="MadWeave paper construction"></model-viewer>
```

The local script is the existing library, not a renderer we write. Its
[camera examples](https://modelviewer.dev/examples/stagingandcameras/) describe
orbiting, zooming, panning and camera targeting. Its
[material examples](https://modelviewer.dev/examples/scenegraph/) demonstrate
selecting materials and changing their color.

I tested `@google/model-viewer` **4.4.0**, using its locally served distribution
file, with a supplied synthetic mesh containing seven named panels and thirteen
triangles. The fixture embeds the existing `madweave_stars_tile_small.png`
texture. It is a display fixture, not a reconstructed photograph or a solved
multi-corner construction.

| Local smoke check | Chromium 153.0.8010.12 | Firefox 155.0 |
| --- | --- | --- |
| Load all seven named, textured materials | Passed | Passed |
| Pick a visible panel and retrieve its UV and 3D position | Passed | Passed |
| Return no material for a background point | Passed | Passed |
| Recolor the picked panel and observe changed screenshot pixels | Passed | Passed |
| Retain the other materials' color values | Passed | Passed |
| Orbit with a real pointer drag and zoom with the wheel | Passed | Passed |
| Produce a PNG through the component API | Passed | Passed |
| No JavaScript exceptions or external network requests | Passed | Passed |

The [results](software-reuse/model-viewer-results.json),
[fixture](software-reuse/supplied-panels.gltf) and
[probe](software-reuse/probe-model-viewer.cjs) are retained. Chromium used
SwiftShader in this headless probe. These checks establish that the integration
hooks work on this small supplied mesh; they are not performance measurements
or Safari, touch-device, large-mesh or arbitrary-transparency verification.

The inspected package exposes `materialFromPoint`,
`positionAndNormalFromPoint` and `surfaceFromPoint`. The first returns a
material, which is not automatically a MadWeave strip identity. A panel with a
printed texture needs its UV coordinates mapped back to the paper/pattern model.
Individual ribbon meshes can instead retain explicit strip IDs, with deliberate
material assignment. We will choose that mapping after the POV-Ray model works.
The component's public scene API focuses on materials rather than general mesh
editing; rapid topology edits may favor direct Three.js later. See the
[scene graph API explanation](https://modelviewer.dev/examples/scenegraph/).

## Revised effort estimates for reuse

These are rough estimates of my adaptation work, assuming a compatible mesh or
GLB and, for selection, an agreed ID/UV mapping are available. They exclude
developing the construction together and translating an as-yet-unwritten
POV-Ray model. The three rows are different deliverables, not cumulative steps.

| Earlier custom implementation | Existing-software deliverable | Revised estimate |
| --- | --- | ---: |
| Basic WebGL demo: 6–12 hours | Display a supplied model with existing orbit/zoom controls | 15–60 minutes; the small local probe is already working |
| Custom opaque viewer with picking/checks: 20–40 hours | Adapt model-viewer with picking, named material changes and focused browser checks | 2–6 hours |
| Custom GPU path tracer: 80–160+ hours | Adapt an existing path-tracer example to a supplied model | 2–6 hours for a first evaluation; this path has not been tested locally |

A fuller viewer integration with project saving, retained application state,
geometry updates and broader browser coverage is additional work, approximately
4–12 hours for a bounded first integration once the model/API is settled. This
is not required just to view the first exported example.

The actual port estimate should follow the working POV-Ray example: we will then
know what calculations, geometry and textures must transfer. There is no reason
to carry the 80–160 hour custom ray-tracer estimate into a plan that reuses
POV-Ray and an existing browser viewer.

The path-tracer author's current [usage example](https://github.com/gkjohnson/three-gpu-pathtracer/blob/main/README.md)
constructs the renderer and tracer, attaches an existing scene/camera, and
progressively renders samples. It supplies the light-transport implementation.
Dependency/backend compatibility and our scene's update cost still need a small
evaluation if we choose it. POV-Ray already covers the first rendering need.

## Related paper tools and conversion tools

[Origami Simulator](https://origamisimulator.org/) already imports crease
patterns in SVG/FOLD, simulates folds in a browser and exports folded geometry.
Its documentation includes holes, slits and fold-angle assignments. I have not
established an existing command for Richard's taped-boundary identifications
and inserted sectors, so it is a possible later experiment, not a replacement
for the agreed POV-Ray first construction. No folding solver is required now.

The author's [POV-Ray Studio announcement](https://news.povray.org/povray.binaries.utilities/thread/%3C68e70451%40news.povray.org%3E/)
describes an existing Three.js-based model/material workshop with exports to
POV-Ray and GLB/glTF. The related
[format description](https://news.povray.org/povray.general/thread/%3C69c5cdaf%241%40news.povray.org%3E/?moff=11&mtop=447503)
lists OBJ/FBX/GLB/glTF/STL as inputs and GLB/glTF/POV as outputs. That is a useful
bridge to inspect later, but it does not establish import of arbitrary `.pov`
programs. Its current hosted studio was not accessible through this research
tool, so it is a documented lead rather than a locally verified recommendation.

POV-Ray's scene language includes macros, loops and computed geometry; the
official [conversion explanation](https://www.povray.org/documentation/view/3.7.0/170)
distinguishes these programs from mesh data files. Our practical route is to
translate the known working model or export its generated geometry, rather than
depend on a general `.pov` parser. This supports Richard's point: porting a
specific working construction is a much more concrete task than inventing it
on a new platform.

## Reproducing the viewer probe

Use the repository's installed Playwright and pngjs development dependencies.
Obtain the pinned component without changing the root package files:

```sh
mkdir -p research/output/software-reuse
npm pack @google/model-viewer@4.4.0 --ignore-scripts \
  --pack-destination research/output/software-reuse
tar -xOf research/output/software-reuse/google-model-viewer-4.4.0.tgz \
  package/dist/model-viewer.min.js \
  > research/output/software-reuse/model-viewer.min.js
node research/multicorner-3d/software-reuse/probe-model-viewer.cjs
```

Configure `PLAYWRIGHT_BROWSERS_PATH` for the installed matching browsers as in
the [browser setup](../../docs/BROWSER_TEST_SETUP.md). This local run used
`/tmp/madweave-browsers`. The probe starts and stops its own loopback server and
writes screenshots/results under ignored `research/output/software-reuse/`.
The downloaded runtime is not committed or added to the site's public files.
