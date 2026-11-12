# EXP-01 — Material and Lighting

Not a KONSTANTIN asset and not an animation; a controlled comparison of four material studies on the **same real 3D geometry**.

## Matrix

| Name | Roughness | Transmission | Sheen | Anisotropy (if supported) | Coat |
| --- | ---: | ---: | ---: | ---: | ---: |
| soft_satin | 0.28 | 0.025 | 0.27 | 0.43 | 0.015 |
| silk_veil | 0.38 | 0.18 | 0.36 | 0.30 | 0 |
| pearl_film | 0.21 | 0.065 | 0.18 | 0.24 | 0.065 |
| satin_fiber | 0.28 | 0.025 | 0.27 | 0.43 | 0.015 |
| clay | 0.72 | 0 | 0 | 0 | 0 |

Only satin_fiber adds low-amplitude UV-aligned roughness. Other settings held fixed. Both light and dark themes use the same geometric scene but different World background/ambient level.

Blender's Principled BSDF socket names vary by version. The script looks up supported inputs explicitly, and the Blender version in CI is recorded in its logs.

## Local command (only if Blender already installed)

    blender --background --threads 4 --python experiments/exp-01-material-light/render.py -- --out out/exp01 --width 900 --height 520 --samples 20

See workflow "EXP-01 — Blender material/light matrix" for automatic rendering via GitHub Actions. It produces a contact sheet and a downloadable archive of individual PNGs and the editable .blend scene.

## Known limits

- Artistic target is deliberately neutral, **not** the final product's form.
- Blender Cycles can render effects that aren't affordable on mobile browsers.
- 20 samples with denoising disabled is for comparison; noise may be visible.
- The experiment is intended to **separate material, light and fiber problems**, not to be treated as finished premium design.
