# EXP-02 — Layered Optical Material

The images below are **actual Blender Cycles renders of parametric 3D surfaces**, not generated illustrations or raster distortions. **Experimental; not an approved character.**

![Comparison sheet](../renders/exp02/contact-sheet.jpg)

| Material | Light | Dark |
|---|---|---|
| 01 / LAYERED SATIN VEIL | ![Light 01 / LAYERED SATIN VEIL](../renders/exp02/satin_veil__light.jpg) | ![Dark 01 / LAYERED SATIN VEIL](../renders/exp02/satin_veil__dark.jpg) |
| 02 / PEARL MEMBRANE | ![Light 02 / PEARL MEMBRANE](../renders/exp02/pearl_membrane__light.jpg) | ![Dark 02 / PEARL MEMBRANE](../renders/exp02/pearl_membrane__dark.jpg) |
| 03 / SURFACE-BOUND FIBERS | ![Light 03 / SURFACE-BOUND FIBERS](../renders/exp02/optical_fibers__light.jpg) | ![Dark 03 / SURFACE-BOUND FIBERS](../renders/exp02/optical_fibers__dark.jpg) |

## Mobile downsample check (360 px wide)

**01 / LAYERED SATIN VEIL**
![01 / LAYERED SATIN VEIL Light](../renders/exp02/satin_veil__light__mobile.jpg) ![01 / LAYERED SATIN VEIL Dark](../renders/exp02/satin_veil__dark__mobile.jpg)

**02 / PEARL MEMBRANE**
![02 / PEARL MEMBRANE Light](../renders/exp02/pearl_membrane__light__mobile.jpg) ![02 / PEARL MEMBRANE Dark](../renders/exp02/pearl_membrane__dark__mobile.jpg)

**03 / SURFACE-BOUND FIBERS**
![03 / SURFACE-BOUND FIBERS Light](../renders/exp02/optical_fibers__light__mobile.jpg) ![03 / SURFACE-BOUND FIBERS Dark](../renders/exp02/optical_fibers__dark__mobile.jpg)

## Technical record

- 2 neutral base ribbon meshes with a secondary physically offset optical shell
- Surface Fresnel response and directional glossy layer computed by Cycles
- Variant C adds 6 host-surface filament tracks per ribbon; aliasing requires visual inspection
- White area lights and one selective red light, shared scene/camera
- 48 samples at 900×520; denoiser unavailable in apt Blender build
- Material comparison only: no motion or mobile GPU rendering yet
- All PNGs and editable Blender project are attached to the GitHub Actions artifact

**Quality gate:** green CI means the images exist, not that they meet the premium aesthetic target.
