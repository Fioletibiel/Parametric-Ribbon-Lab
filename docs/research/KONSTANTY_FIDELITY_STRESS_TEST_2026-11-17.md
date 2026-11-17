# KONSTANTIN / Sculptural Flow — Fidelity Stress Test
Date: 2026-11-17
Status: research decision. Do not merge to the application. No new aesthetic prototype approved.
Goal: reproduce the approved design using live code-generated geometry/material/light/motion, never image warping.

## Findings grounded in repository inspection
- Main branch retains Blender EXP-01/02, while Optical Presence v03 and EXP-04 reside on research branches.
- EXP-04's shared scenePoint() implements three predominantly horizontal sinusoidal guide functions. Comparing three optical techniques on this incorrect geometry is NOT a valid test of target fidelity.
- EXP-03 uses mostly left-to-right guide families and fine strips; it still reads as fibers, not sculptural optical material.
- Reports describe A too faint, B flat contour-illuminated ribbons, C fog-like volume. All fail visual art-direction gates.
- A prior report mentions an existing Sculptural Flow v0.7 Blueprint GLB stored outside the public repository. This artifact itself is NOT currently available in the checked main branch; assess independently before reuse.
- A single AI-generated target image does not uniquely determine its original 3D scene and light behavior. Image similarity alone can overfit a still and fail during motion.

## Root causes, in order
1. Wrong global topology, missing semantic control curves and negative spaces.
2. Missing locked master art-direction target shared across Dark/Light.
3. Engineering pass (build, live service, FPS) confused with appearance pass.
4. Material extremes: opaque plastic surfaces versus fine line charts versus low-contrast fog.
5. Geometry, camera, light and alpha changed simultaneously, destroying causal interpretation.
6. No stop rule: repeated mild tuning of rejected primitives.
7. Realtime-first approach before proving one convincing frame.

## Hypotheses with falsification
H1: An editable topology cage can reproduce the approved negative spaces and crossing order. Test a clay/normal/depth view at locked framing, with semantic guides and manually marked landmarks. FAIL if it still resembles parallel waves or requires shader tricks to hide its shape.
H2: Once geometry is frozen, a multiscale optical material can achieve broad translucent veils, localized microstrands and strong white/red directional light. Compare two independent solutions on identical geometry. FAIL on plastic, line chart, fog or disappearing light mode.
H3: Depth/opacity compositing creates the remaining discrepancy. Compare simple sorted alpha and depth-aware methods on the same crossing. FAIL hypothesis if correct transparency doesn't materially change the appearance; do not add OIT as decoration.
H4: The representation is truly spatial and animated, not optimized only to one projection. Test two deformed poses and camera offsets of plus/minus 8–12 degrees. FAIL if strands detach, highlights stick to image plane, or crossings break.
H5: After visual approval, actual browser GPU can sustain workable frame rate. Measure on physical target devices. Headless software GPU FPS is diagnostic only.

## Quality gates (strict order)
G0: LOCK TARGET. Choose one master composition, annotate left return, high arch, central crossing, crimson recess, lower opening, depth/occlusion ordering and expected exposure on both themes. Different image-generated light/dark stills may not encode exactly identical geometry; resolve the shape conflict explicitly. Keep reference private.
G1: SHAPE. Editable 3D surface cage, separate named sheets and defined crossing order; show identical-camera clay, normal, depth and edge diagnostics. No texture, lines, glow or animation at this stage. The silhouette and open areas must match to the art director's satisfaction.
G2: MATERIAL. Geometry, camera and exposure frozen. Compare two genuinely distinct optical solvers, not two parameters of one shader. Inspect global volume, translucent layer density, strand coverage, highlights and red recess on dark and light.
G3: DEPTH. Show alpha/depth buffers and an explicitly validated crossing. Only use more advanced OIT if its before/after evidence justifies extra cost.
G4: MOTION. After one acceptable still: three deformation poses, geometry and light consistency, no reference-frame texture.
G5: PERF. Mobile screenshots, real-device FPS, subpixel aliasing, thermal behaviour, browser fallback.

## Quality evaluation protocol
Rate 0–5 (human art direction) in five mandatory dimensions: silhouette/negative space; visible depth/occlusion; material and microstructure; white/red light; light/dark readability. Each must attain at least 4/5 with no severe artifact before promotion. This threshold is a proposed gate, NOT a scientific similarity measurement. Refusal of visual approval blocks progress.
Compare images at matched camera, size and exposure. Store annotated landmarks, crossing-order graph and useful depth/alpha/specular diagnostics. Use SSIM/perceptual metrics only as secondary diagnostics; pixel-level match does not establish coherent 3D animation.

## Iteration hygiene / stop rule
- Every experiment contains a falsifiable claim, exactly one changed subsystem, expected observation, render evidence, user-facing visual review, cost, and verdict.
- No more than TWO local attempts per hypothesis without a newly observed error or alternative hypothesis.
- If clay shape remains generic left-to-right waves: STOP immediately; do not adjust shader, add strands, tune red/glow or deploy animated UI.
- If material produces plastic/fog/wireframe on correct geometry: reject representation, not the geometry; try another optical model.
- Never call a technical green CI or successful Render deployment an aesthetic success.
- Preserve only unsuccessful research branches separately; avoid polluting the production application.

## Alternative strategy
Primary: structured, art-directed 3D topology fitting against a private still; only after this use independent surface/filament optical models and high-quality offline reference shading.
Secondary: scene optimization or inverse rendering of bounded control parameters, with pose and geometry regularizers (Mitsuba 3 is a research option). It cannot uniquely reconstruct a physical 3D scene from one AI image.
Blender Cycles and Geometry Nodes are valid lookdev comparators, not automatically proof of realtime suitability. WebGPU is a later backend option, not a visual-quality solution by itself.
2.5D camera-aware 3D composition can work if it remains a live spatial model and passes view/motion tests; pure raster deformations, canned video and static textures are rejected.
Volumetric raymarching and Gaussian-based approaches are non-default due to the observed fog/performance issues and lack of multi-view training data.

## Explicit next step
Retrieve the actual previously reported v0.7 blueprint/GLB, check its source and camera, then independently evaluate G1 against the master reference. Do not assume v0.7 is approved. If insufficient, design an editable semantic cage from measured annotated target curves and voids. Present G1 diagnostic side-by-side BEFORE any shader or full app.

## References
Blender Hair Interpolation https://docs.blender.org/manual/en/4.5/modeling/geometry_nodes/hair/generation/interpolate_hair_curves.html
Blender Hair BSDF https://docs.blender.org/manual/en/4.5/render/shader_nodes/shader/hair_principled.html
Mitsuba 3 inverse rendering https://mitsuba.readthedocs.io/en/latest/src/inverse_rendering/gradient_based_opt.html
Three WebGPURenderer https://threejs.org/manual/pages/webgpurenderer
Weighted Blended OIT https://jcgt.org/published/0002/02/09/
