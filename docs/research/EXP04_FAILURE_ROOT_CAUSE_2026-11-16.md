# EXP-04 — REJECTED / ROOT-CAUSE AUDIT (2026-11-16)

**Decision: FAIL (visual); NOT a valid test of reference fidelity.** The user reviewed three live phone screenshots. A produced an almost invisible sheet, B broad painted ribbons with bright contour strokes, C blurred mist/stripes. All three fail the approved premium visual target. Do not merge into KONSTANTIN; retain the branch only as negative research evidence.

## Primary failure: invalid common input geometry

The experiment used three mostly horizontal sine-based lofts described by `scenePoint`. It did NOT reproduce the approved Sculptural Flow architecture (open left return, higher upper sail, central crossing, recessed crimson fold, large lower negative space). Applying different rendering technology to the same wrong input cannot prove which approach could faithfully render the right object. The previous EXP-04 review therefore must not be interpreted as a credible ranking of production renderers.

## Crucial missed existing artifact

A pre-existing user-held **Sculptural Flow v0.7 Blueprint ZIP** includes:
- `docs/brand/KONSTANTY_SCULPTURAL_FLOW_BLUEPRINT.md`
- `tools/konstanty-sculptural-flow/geometry.py` with separate Hermite-sampled guides and explicit control knots
- `sculptural-flow-v07-geometry.glb` with five named meshes (`LEFT_RETURN`, `UPPER_CREST`, `CENTER_CROSSING`, `INNER_CRIMSON`, `LOWER_VEIL`).

The GLB was inspected locally as **five meshes, 2,527 vertices and 4,752 faces each**. A fresh orthographic clay-style image was computed from these real triangles. This already encodes much more intentional macro-topology than the three simplistic EXP-04 waves.

**However, v0.7 is also an unapproved intermediate hypothesis**. Its clay preview still falls well short of the approved reference, with schematic, pointed sheet intersections. It has not passed its own G1 (clay silhouette) or G2 (light/dark material) gates. Do NOT claim the existence of GLB is proof of successful reconstruction.

The v0.7 reference image is private and must not be published to this public repository. The source ZIP and model remain outside this repository until an appropriate transfer/storage decision.

## Specific technical issues in EXP-04

- A: ultra-low alpha and weak geometric cues leave very low visible coverage.
- B: hand-drawn 2.5D lighting and simple path projections produce contour lines and shallow fake translucency.
- C: low-resolution, low-step volume sampling produces fog-like bands, cannot resolve directional fibers, and has higher GPU cost.
- All: over-simplified scene makes the image fail at the silhouette stage before materials become meaningful.

## Correct action sequence (stop rule)

1. **Stop** tuning A/B/C visuals and do not present their screenshots as improved Konstanty.
2. Recover and inspect the existing v0.7 blueprint and its actual GLB; reuse its authored named structures as a *starting hypothesis*, not as approved geometry.
3. Implement a diagnostic projection where each named sheet is distinguishable; inspect overlaps and negative space against the private reference, without glow, shaders or moving pixels.
4. If this silhouette does not pass, revise **control-point positions, cross-section widths and fold orientations** instead of optical parameters. Archive comparable images after each significant change.
5. Only after silhouette approval, test two optical representations with the **same approved geometry**; compare Light and Dark at the same camera and scale. Then examine animation and real mobile GPU performance.
6. Never use a still raster as a runtime texture, displacement source or deformation target.

**Bottom line:** EXP-04 verified infrastructure and method differences, but **not** progress toward the approved sculpture. This was a research design error, not merely insufficient shader tuning.
