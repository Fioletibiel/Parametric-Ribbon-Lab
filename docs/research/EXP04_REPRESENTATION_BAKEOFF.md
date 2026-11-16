# EXP-04 — Representation Bake-off (16 November 2026)

**Status:** deployed comparison infrastructure; **not artistically approved**.

## Purpose

This experiment tests the *representation family* of a dynamic optical presence, not a new polished version of the assistant. It explicitly rejects both image warping and another incremental iteration of the old strand shader. The approved reference remains private and is **not** loaded by these engines, either as a texture or as a deformable bitmap.

**Interactive preview:** https://konstanty-representation-bakeoff-v04.onrender.com  
**Comparison CI:** https://github.com/Fioletibiel/Parametric-Ribbon-Lab/actions/workflows/representation-bakeoff-v04.yml  
**Working source:** `research/representation-bakeoff-v04/index.html`, `app.js`, `test.mjs`.

## Controlled variables

All three approaches use the same mathematical `scenePoint(family,u,v,phase)` geometry and camera framing, with the same color intent, Light/Dark and light-strength controls. The common scene contains three broad sculptural optical sheet guides. This is an interim research shape and **does not accurately reconstruct the topology of Sculptural Flow**. Therefore, the test can compare rendering behaviors, but cannot prove visual fidelity to the approved figure.

### Candidate A — hybrid optical textile
WebGL2 triangle meshes, 3D normals, soft Fresnel/specular approximation, weak surface coverage. Strong failure mode: transparent sheets can become too faint, or too opaque/plastic; no correct interlayer light transport. Depth sorting is still approximate.

### Candidate B — art-directed 2.5D compositing
Canvas2D projection of the same 3D sheets, partial fills, optical depth layering and a few localized glints. Advantage: predictable aesthetic control for a known viewing angle. Failure mode: appears too planar, highlights are art-directed rather than physically computed. Useful as a comparison, **not a production engine**.

### Candidate C — volume-density field
GPU raymarch and Beer–Lambert-like transmittance integration of density sampled around the same guides, with spatial red illumination. Its compute budget is explicitly bounded for mobile preview. Failure mode: foggy mass, loss of detail, expensive fragment shader, and lack of precision on silhouettes.

## Actual tests and lessons

- Initial CI exposed a JavaScript template parsing failure. Corrected.
- Subsequent browser evidence exposed a mesh-compositing alpha accumulation issue in A and an unexpanded GLSL template expression in C. Both corrected; quality is not inferred from build success.
- Variant B rendered. Its first dark and light screenshots showed visible layered ribbons but continued to look horizontally wavy and lacked the sculptural negative spaces of the approved reference.
- Browser smoke checks 12 combinations: A/B/C × Dark/Light × desktop/mobile, checks errors and image occupancy; screenshots are downloadable artifacts from CI.
- Headless Chromium with SwiftShader tests code and screenshots, **not real-device GPU performance**.

## Quality gates — all required

1. Correct global structure: openings, fold direction, silhouette, geometry-derived depth
2. Multiscale optical material, not uniform plastic and not purely decorative stripes
3. Bright selective white highlight and restrained, spatially recessed red
4. Correct transparency/compositing at crossings
5. Excellent Light and Dark; neither disappearing nor oversaturated
6. Stable real geometry during movement, no bitmap deformation
7. Downsampled mobile output without moiré and no unusable GPU load

**Engineering success is not visual approval.** If all three fail to match the reference, do not choose the least bad and call it done. First rebuild the canonical scene geometry from manually measured reference contours, then independently optimize the visual material and compositing. Prior experiments EXP-01–03 remain archived.

## Research stop rule

No follow-up with parameter-only changes to sine waves or arbitrary density ramps. Identify the limiting error (geometry, material, transparency, light, output filtering) using identical camera and shape. Change only that block and re-run comparison. Store every meaningful rendered result and explicit art-direction verdict.
