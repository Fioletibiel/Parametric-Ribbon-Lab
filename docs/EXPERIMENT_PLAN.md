# Ribbon Materials & Motion: experiment program

**Scope:** a publicly shareable, generic technical study. Not an artistic replica of any proprietary or approved character.

| Stage | Hypothesis | Comparison | Pass condition |
| --- | --- | --- | --- |
| EXP-01 Materials + Light | A coherent continuous surface with directional satin sheen is stronger than detached micro-lines | Neutral clay, Soft Satin, Silk Veil, Pearl Film, Satin + subtle fiber roughness; light and dark | Readable surface in both themes; no clipping; highlights model volume; no visible line moiré |
| EXP-02 Surface Detail | UV-aligned roughness modulation gives depth without overlapping geometry | Surface / micro-roughness / sparse threads / anisotropic sheen | Original surface still dominates at 360px |
| EXP-03 Motion | A shared deforming surface with slow structural drift avoids nervous equalizer motion | Idle, listening, processing, speaking | Smooth and reversible, deterministic, frame-rate-independent; no flicker |

## EXP-01 rules

- Identical geometry, camera and light placement in all images.
- Exactly two curved, intersecting ribbon surfaces; these are neutral test objects.
- Compare 4 material configurations and a clay control (each Light and Dark).
- The optional embedded fiber variant alters **roughness only**, not underlying geometry.
- Full contact sheet + source Blender scene + individual PNGs uploaded as CI artifact.
- Check silhouette/camera fit in clay first.
- A green CI job proves the render pipeline ran, **not** commercial/premium quality.
- Do not replace the main product reference or declare the experiment approved.

## Motion constraint

Only after a material/shading candidate is reviewed, develop a physically coherent deformation of the ribbon *mesh*. Avoid image warping and geometry-independent fibers. Voice activity can modulate tension and slowly moving wave packets; it should not generate random violent displacement.

## Deployment constraint

Offline Blender is a look-development renderer, **not equivalent** to real-time Three.js/WebGL. A separate runtime proof must demonstrate matched shading at a known device budget. If mobile speed is insufficient, reduce geometry/shader complexity; don't silently substitute the source image.

## Costs and visibility

Workflow renders are triggered from explicit workflow changes or manual dispatch. Experiments are public and use generic assets only; costly hardware and private references remain outside this repository.
