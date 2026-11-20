# Orbis v04 — Sculptural WebGL, executable experiment

**Status:** Experimental **true live 3D**. It is not an approved visual reconstruction and does not control smart-home devices.

## What is implemented
- A real triangulated glass sphere and two additional outer-shell material layers, with animated responsive optical shading.
- Five separate spatial surface meshes (4 primary/rear/ivory/burgundy), each with 112 × 28 segments, driven by sculpted Catmull-Rom paths rather than image-space sine lines.
- 42 fine 3D filaments per surface, tightly coupled to the **same** deformation function; an independent ruby halo **mesh** follows the main burgundy edge.
- A continuous requestAnimationFrame loop that deforms mesh vertices and filaments; no six-frame GIF, no pre-generated Orbis image, no CSS light effect on a raster.
- Idle / listening / speaking, adjustable audio-motion energy, dark/light scene illumination, drag to inspect actual depth, eco/high GPU resolution, responsive app UI.
- Vite and pinned Three.js dependencies. Deploy as a standalone Render static site.

## Why it differs from earlier failures
The earlier experiments were either screen-space shaders (v01), non-conforming VTK stills (v02), raster overlays (v03), or six-frame Cycles GIFs (EXP-03). This one is **continuously animated 3D geometry in the user's browser**.
It avoids the opaque-black synthetic body of previous attempts by blending real glass geometry with transparent lighting surfaces. Visual fidelity must be confirmed on an actual Android Chrome device.

## Build
```sh
npm install
npm run build
```
Deploy: `cd experiments/orbis-sculptural-webgl-v04 && npm install --no-audit --no-fund && npm run build`
Publish: `experiments/orbis-sculptural-webgl-v04/dist`.

## Acceptance / STOP conditions
- Run screenshot/recording on actual Android Chrome in both themes.
- Compare directly with approved Orbis v2 reconstruction board and earlier original concept.
- Reject if coarse/plasticky, no apparent depth, cartoon highlights, obvious flat curves, red pupil/eye shape, major Z-fighting, frame drops or thermal instability.
- Performance measured in browser; 30 fps minimum on target phone is a goal, not pre-validated.
- This geometry is an **art-direction hypothesis**. There is no guarantee procedural path control reproduces exact pixels of a raster AI rendering.
- If it fails, freeze the code and **sculpt exact model shapes through direct mesh editing** rather than producing further procedural variants with minor material tweaks.
- Do not merge into KONSTANTIN production or the concurrent Ribbon experiment.
