# Sculptural Presence — Blender reconstruction

A single editorially directed 3D sculpture is authored in Python, rendered headlessly in Blender/Cycles, and evaluated as Light and Dark. This is **not** image-to-video, displacement or pixel deformation.

The 5 independent geometric lofts are built between individually authored upper/lower contour splines in `build_scene.py`. Real spatial filaments and curved luminous guides follow the same geometry. Materials contain transparent/reflective BSDF layers. Light is provided by area sources. The approved image is a **comparison-only** reference and is deliberately not uploaded to this public repository.

The workflow renders three PNGs (clay, dark, light), saves editable `.blend` and exports `.glb`. The PNGs are published to this branch, the editable files are downloadable GitHub Actions artifacts.

Run headlessly with `blender --background --python sculptural-presence/build_scene.py -- --out sculptural-presence/preview --quality draft`.

**Artistic status: NOT APPROVED**. The clay silhouette, transparent material and realistic theme contrast need to be checked before adding animation or attempting a Three.js material port.
