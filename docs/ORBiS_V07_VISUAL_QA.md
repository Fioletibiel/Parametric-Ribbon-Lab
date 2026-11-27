# Orbis v07 — reference-calibrated geometry QA / 27 November 2026

**Decision: NO-GO as finished Orbis.** This remains an independently editable source-model experiment only. **No Render deployment** and no production merge.

## Primary target
The user-approved `KONSTANTIN / ORBIS — Reconstruction Sheet` and `KONSTANTIN / ORBIS — Motion Behavior Sheet` in the KONSTANTIN conversation, not newly generated concepts and not v01–v06.

## What was implemented and genuinely verified
- Source: `experiments/orbis-reference-geometry-v07/reconstruct.py`
- A **new reconstruction method**: each of the 4 primary surfaces is lofted between TWO separately traced, shape-specific Bézier-like boundary profiles registered in the approved front-view crop (not a centerline with width and not a 2D image warp).
- Additional 3D depth, camber and opposing near/far surface layers are modeled in Blender.
- A closed sphere with physical wall thickness, distinct wine/pearl shader materials, fine surface-attached microgrooves and actual emissive 3D contours.
- Blender Cycles successfully produced editable `.blend` assets and one camera render for dark and light; artifacts: [source-model artifacts](https://github.com/Fioletibiel/Parametric-Ribbon-Lab/actions/runs/45931379981/artifacts/15169066726)
- Geometry-only isolation: [view JPG](https://github.com/Fioletibiel/Parametric-Ribbon-Lab/blob/main/docs/renders/exp02/orbis-v07/geometry_only.jpg).
- Original physically lit stills: [dark](https://github.com/Fioletibiel/Parametric-Ribbon-Lab/blob/main/docs/renders/exp02/orbis-v07/dark.jpg) and [light](https://github.com/Fioletibiel/Parametric-Ribbon-Lab/blob/main/docs/renders/exp02/orbis-v07/light.jpg).
- Controlled optical grade test: [latest dark camera result](https://github.com/Fioletibiel/Parametric-Ribbon-Lab/blob/main/docs/renders/exp02/orbis-v07/grade01.jpg), generated from the same spatial geometry, with modified glass reflections and surface materials.

## Visual QA outcome, compared to approved artwork

| Gate | Result | Observation |
|------|--------|-------------|
| Approximate front-view boundary shapes | PARTIAL PASS | The four major broad silhouettes follow the reference's fan/wine/lower fold outlines more closely than earlier centerline ribbon models. |
| Spatial depth and complex mutual occlusion | FAIL | Still four large separate sheets. Original is substantially more layered, has sculpted folded contours and rich internal occlusion. |
| Glass material quality | FAIL | Initial material had bright hard ellipse reflections, black noisy inner sphere and a strong pink oval. Revised optical material removes hard spots but becomes too uniform. |
| Colour / selective burgundy light | FAIL | Wine sheet too broad/flat in isolation; required narrow luminous current and subtle body are not simultaneously convincing. |
| Dark theme match | FAIL | Final result looks like a simplified optical drawing rather than premium CGI. Significant Monte Carlo noise. |
| Light theme match | FAIL | Initial light render looks washed out; corrected light look has not been validated. |
| Natural animation | NOT STARTED | Correctly gated until one approved still; v07 is stationary. |
| Phone GPU performance | NOT TESTED | No web app or live 3D deployment from this source. |

## Why the higher-quality pipeline still failed

1. **A single 2D AI concept is not a calibrated 3D master.** Even independently traced front-view contours do not specify actual surface curvature, thickness, rear geometry, refraction or exact lighting geometry. The missing data was filled with approximate lofts.
2. **Thin translucent layers are optically sensitive.** Physical glass and multiple transparent films produce high noise and underexposed internal surfaces without a deliberate studio environment and many samples. Softer approximations suppress hotspots but lose material specificity.
3. **The reference contains more designed 3D folds than four traced strips.** This is a sculpting/art-direction task, not a generic 3D shader task. Higher sampling or frame rate cannot supply the missing sculptural information.

## Firm decision and next production gate

Do **not** release v07 as a finished Orbis, do **not** add animation, and do **not** adapt v05 image warping. Keep the two-curve loft code as a camera registration and modeling aid only.

To proceed with Orbis in the agreed visual language, a qualified DCC sculpting process needs to manually adjust all profile pairs, add true folded geometry and optimize multi-layer optics against the reference. Only after a new Cycles still from that source passes *dark AND light* side-by-side should animation be developed and exported to Render.

Ribbon experiment remains unrelated; no source files of Ribbon were modified. KONSTANTIN production and prior preview URLs were left unchanged.
