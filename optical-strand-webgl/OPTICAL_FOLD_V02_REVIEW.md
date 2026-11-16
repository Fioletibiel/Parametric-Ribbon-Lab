# Optical Fold v0.2 — evidence-based visual review

**Outcome:** experimental infrastructure succeeds; **art direction DOES NOT PASS**. Do not merge this appearance into KONSTANTIN.

## Reproducible results

- Public preview: https://konstanty-optical-fold-v02.onrender.com
- Smoke test: https://github.com/Fioletibiel/Parametric-Ribbon-Lab/actions/runs/43860013110
- Tested in headless Chromium + SwiftShader: dark/light desktop and mobile screenshots, 4 UI state switches, build and browser errors check passed.
- Experimental source branch: `experiment/optical-fold-v02`. Nothing changed in the private product application.

## What changed versus v0.1

- Replaced regular almost coplanar waves with two overlapping depth-separated lofted surfaces, reduced scope to **one crossing**.
- Flow vectors are mesh attributes; derivative normals and flow direction drive anisotropic-like lighting.
- Varying optical strand identity/coverage (screen-space derivative filtering) instead of same-strength UV stripes.
- Added sparse high-luminance ridge/caustic masks attached to the 3D surfaces and a faint veil pass.
- Red accent localized by 3D position rather than coloring entire surfaces.
- Actual GPU vertex-deformed 3D geometry: **not** a warped static reference image.

## Critical review vs user's approved concept

**Still fails the aesthetic target:**
- The picture is still predominantly a set of **parallel contour lines**, now less dense, instead of substantial and nuanced spatial optical veils.
- The material lacks softly occluded layers and convincing depth; a bright streak does not automatically constitute physical specular reflection.
- Highlight pass still includes a hand-authored surface-space mask, not full physically simulated optics; avoid claiming physically accurate illumination.
- The form and negative spaces are not similar to the approved sculpture; intentional here because this is a crossing micro-study.
- Dark is cleaner than v0.1; Light remains too pale and red-light sensitivity is high.
- Estimated FPS values in CI (SwiftShader) were around 8 on desktop, 16 on mobile test viewport — **NOT** a real-device GPU performance benchmark.
- Without weighted-blended OIT / depth peeling, crossed transparent planes can still blend incorrectly.

## Decision

Retain this as a **failed artistic prototype / useful WebGL infrastructure**, not an approved new art direction. The prior full-scene technique and the revised one both fail principally because the visual material is synthesized from regular line coverage on ribbon surfaces.

**Do not continue with only density/glint tuning.** The next research hypothesis should change the representation: independently authored 3D optical thin layers, shaped luminous filament bundles with depth-aware occlusion, genuinely computed normal-based light transport, and image-based visual review on a *single small fold* before attempting an animated full figure. The original reference is kept private and must never be copied into this public lab.
