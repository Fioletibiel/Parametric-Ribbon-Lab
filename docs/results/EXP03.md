# EXP-03 — Optical Presence real 3D strand reconstruction (16 November 2026)

**Live**: https://konstanty-optical-presence-v03.onrender.com  
**Source**: `optical-strand-webgl/src/geometry.ts` and `src/shaders.ts` in this branch  
**Browser validation**: https://github.com/Fioletibiel/Parametric-Ribbon-Lab/actions/runs/43871979883  
**Status**: implementation running, **ART DIRECTION NOT APPROVED**.

## Verified implementation changes

- Discontinued `fract()` coverage stripes painted onto a ribbon.
- Five authored 3D guide paths, with genuine **individual** fiber trajectories, five separate 3D optical veils, and sparse additional spatial highlight curves.
- Every object has data-derived screen projection. The GPU deforms vertex geometry; **there is no reference bitmap, photograph warp, or image-to-video animation**.
- Dynamic spatial red-light attenuation, directionally weighted white reflection approximation, semi-transparent membrane shading, Light/Dark theme, four UI states, actual density modulation and pause.
- Browser smoke test succeeded with desktop/mobile screenshots in Chromium SwiftShader; Render production build live.

## Visual evidence

Comparison of first and second passes showed better **white highlight concentration** and clearer crimson streaks after corrected veil interpolation and adjusted optical response. No browser errors were reported.

**Aesthetic result remains unsatisfactory** against the privately approved concept:

- The frame still reads primarily as layers of **fine curves**, not the substantial but luminous *optical silk* volume in the reference.
- The red highlight is not convincingly recessed/illuminating the inner layers; on Light it tends toward visibly pink streaks.
- The depth and silhouette are still simplified and do not reconstruct the negative-space arrangement of the reference.
- Fine line aliasing/dotting persists at mobile scale.
- The test browser uses software GPU acceleration; FPS counters from CI are not valid real-phone measurements (3–5 FPS desktop in refined screenshots). No real hardware benchmark has been completed.

## Decision and next quality gate

Archive these as **verified code + negative fidelity evidence**, do not merge into production KONSTANTIN or declare visual approval. Do not repeat additional variations of narrow stripe shaders; the next representation must emphasize **volume, depth-aware soft shadow/occlusion, directionally coherent optical sheen and spatially selective internal light**, with an offline reference render as a target but **never** as a texture.

All proprietary visual references and approved images remain outside the public repo.
