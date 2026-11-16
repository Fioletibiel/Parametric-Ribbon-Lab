# Optical Presence 03 — procedural 3D reconstruction research

**Live:** https://konstanty-optical-presence-v03.onrender.com

**Status:** RUNNABLE experimental renderer. The visual does not yet meet the approved reference. Never label as final or integrate into the private KONSTANTIN application without visual approval.

## What is genuinely constructed in code

- 5 separately authored Catmull–Rom guide assemblies with individual 3D control knots and controlled near/far placement.
- 36 independently sampled spatial fibers per guide assembly (180 actual 3D strands), each a narrow optical strip with persistent identity, strength, geometry, and coherent shared deformation.
- 5 separately lofted transparent veil meshes (not transparent raster overlays).
- 25 spatial highlight curves anchored to the guide geometry, with soft optical core/halo.
- GLSL computes normals, tangent directions, Fresnel-like edge response and approximate directional specular light; local red source attenuation depends on world position.
- A continuous video-like animation is computed by the GPU from geometry; no source image used anywhere in rendering or motion.

## Browser checks

Browser workflow: https://github.com/Fioletibiel/Parametric-Ribbon-Lab/actions/workflows/optical-presence-v03-smoke.yml

CI uses desktop and mobile Chromium + SwiftShader to capture Light/Dark snapshots. These snapshots are **evidence of output**, not professional certification or real mobile frame-rate measurements.

## Gaps against privately approved KONSTANTIN art

- Layer volume and shape still lack the sophisticated openings of the target artwork.
- Simulated lighting is **not physically accurate transport**: white crest filaments are artistically guided, red is an analytic attenuated spatial illumination, not path-traced subsurface light.
- Standard blending with manually imposed render ordering remains an approximation for transparent intersections. Test depth-aware OIT only when image quality is close enough that ordering is the limiting factor.
- Some hairline aliasing and faint dotting may appear on mobile, despite the use of narrow strip geometries. Assess real GPU and subpixel performance before shipping.
- Target reflection structure requires stronger art-directed highlight distribution and mixed layered density.

**Gate:** only approve a future revision after its static Light/Dark frames are visually compared with approved art, its animated motion doesn't unravel strands, and mobile performance is measured on hardware.

Do not publish the private reference image to this public repository.
