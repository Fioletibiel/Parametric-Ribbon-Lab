# KONSTANTIN Orbis — Sculpted Surface 06

This is **executable real-time 3D**, not an AI-generated image, raster warp, UV-displacement or GIF. It is an isolated technical/art experiment and has **not** passed premium visual acceptance yet.

## Explicit difference from rejected V01–V05

- Four authored sculptural surfaces with **independent cross sections and spatial depth**, no mesh line-filigree representation.
- Each surface has distinct `rest`, `listen`, and `speak` control-point sets. A loft mesh is formed from each set and their positions are supplied as GPU morph targets. There are **no time-varying sinusoidal vertex fields**. Poses are blended smoothly at 2.1 s⁻¹; the speaking envelope is deliberately slow, gentle and bounded.
- 3D spherical outer shell plus actual three-dimensional refractive / pearl materials under separate dark/light lighting environments.
- Real drag/rotation. Quality modes cap DPR. No 2D reference imagery loaded into the renderer.

## Implementation honesty

These handcrafted meshes approximate the approved Orbis v2; they are not a pixel match and have not yet passed visual review. Glass-front specularity uses a shader over actual sphere geometry and remains an approximation, not multi-bounce path tracing. Transparency layer order remains an approximation. Failure of aesthetics means **NO-GO**, regardless of FPS.

## Validation

1. Build with `npm install && npm run build`.
2. View directly via Render `/v06/` in current existing shared experimental static site; keep v03/v04/v05 and Ribbon untouched.
3. Compare screenshot of the actual WebGL output to user-approved dark and light references. Check broad sculpted membranes rather than thin lines.
4. Switch themes: same 3D mesh, different studio materials/light, legible in both.
5. Check idle/listening/speaking; no twitching, no sudden position jumps, no raster motion.
6. Measure FPS on Android Chrome; 30 FPS is a target, **not** a validated benchmark.
7. Do not merge this into production until visual acceptance.

## Source

`src/main.js` + `src/style.css`, Vite and three.js 0.181.2. The same geometry morph targets can later be exported into a DCC art pipeline if the geometry is accepted.
