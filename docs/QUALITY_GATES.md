# Visual / geometric quality gates

This is a **generic laboratory specification**. Approved product-specific artwork and source images stay private.

## G0 — Reproducibility and safety
- Deterministic seed and versioned script, units/camera recorded.
- No secrets or proprietary references in the public repository.
- Geometry finite and non-degenerate; record polygon counts and render engine version.

## G1 — Silhouette / topology — before any materials
- Render an untextured clay pass at a fixed camera angle.
- Full shape in frame with at least 8% breathing room.
- Each surface has discernible width, volume and curvature.
- Over/under crossings are intentional; negative spaces remain open.
- Review at full width **and at 360px**.
- If the clay silhouette fails, do not attempt to rescue it with strands, bloom or color.

## G2 — Materials / lighting
- Base surfaces readable before fine filaments are enabled.
- Fibers inherit host surface geometry and have screen-space density caps.
- No aliasing, moiré, crosshatching or flicker when downsampled.
- Localized highlight/shadow from true geometry normals; no whole-surface accent tint.
- Test equivalent shape in light and dark environments.

## G3 — Motion — only after G1 and G2
- Shape-preserving deformation: no 2D raster warping pretending to be 3D.
- Maintain host-surface/filament relationships and stable depth order.
- Material lighting recalculated from each updated surface normal.
- Verify seamless transitions, no tearing and no sudden velocity changes.
- Benchmark actual frame times on representative mobile devices and support reduced motion.

## G4 — Product integration — deferred
- Prototype integration only after the visual target is independently approved.
- Do not assume an offline Blender render can be reproduced in real-time browser shading.
- Create explicit low-power and no-WebGL fallback requirements.

A green CI run verifies **code checks**, not that an experiment looks premium.
