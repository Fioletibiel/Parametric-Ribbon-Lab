# Optical Strand Renderer — v0.1

Actual animated GPU geometry, not a deforming bitmap. React + TypeScript + @react-three/fiber + Three.js + GLSL fragment and vertex shaders.

Four guide surfaces drive screen-space anti-aliased optical fibers and translucent veils. White and restrained red luminous highlights follow deformed surfaces. The proof includes themes, speaking/listening/processing states, density and pause controls. Responsive camera fitting and device pixel ratio caps.

**Status:** new rendering research direction; not the final approved KONSTANTIN shape, not a physically based Cycles material, not weighted blended OIT yet. Transparent layers use approximate ordered blending, explicitly subject to review. No proprietary reference files or raster warp embedded.

Run: `npm install && npm run dev`. Build: `npm run build`. Output: `dist/`.

Review: inspect dark and light on a mobile-sized screen; zoom/filament aliasing; pause, reduced motion, FPS and browser console. Reject if forms read as plastic, striped mesh or flat random lines.
