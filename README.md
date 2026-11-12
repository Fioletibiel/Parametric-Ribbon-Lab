# Parametric Ribbon Lab

Public, **brand-neutral** research laboratory for parametric ribbon geometry, shading, motion and performance experiments.

## Why a separate laboratory?

This repository can host generic, reproducible mesh and shader experiments on standard GitHub-hosted runners. The private product repository remains the system of record for application code, identities, proprietary art direction and approved references.

**This is not a public mirror of the product.** Do not copy private screenshots, brand assets, prompts, API tokens, source packages, paid assets or customer data here. Do not publish material merely because it is present in a prior experiment.

## Engineering principles

1. **Geometry before lighting or animation**: model the silhouette, surface continuity, interleaving and negative space with a neutral clay material.
2. **Camera framing** must be calculated from full projected 3D bounds, with margins. No cropped ribbons unless explicitly intended.
3. **Real surfaces rather than line illusions**: filaments must remain subordinate to the base surface. Disable fiber overlay during clay review.
4. **Lighting after geometry**: physically coherent white light, optional localized accent; never fake volume by coloring every ribbon.
5. **Motion last**: preserve each strand's relation to its host surface, avoid image warping, minimize flickering and high-frequency moiré.
6. **Accessibility and mobile**: test both light and dark themes, 360px widths and reduced-motion behavior.
7. **Evidence**: generated renders are experimental. Passing mesh checks does not imply artistic approval or production readiness.

## Repository layout

- `docs/`: generic visual and quality requirements
- `tools/`: small open-source geometry validation and processing utilities (when implemented)
- `experiments/`: isolated experiments, one directory per reproducible attempt
- `.github/workflows/`: lightweight validation. Rendering workflows will be introduced as **manual-only** jobs after the renderer is ready.

## Cost and security

Standard hosted runners for public GitHub repositories can be used without consuming the private repository's Actions allowance under GitHub's current billing policy; check policy before enabling any larger or self-hosted runners. Heavy rendering should be explicitly dispatched, rate-limited and uploaded as short-lived artifacts rather than committed to git.

Private approved artwork must be reviewed side-by-side **outside this public repository**. This repository contains no private reference media.
