# Third-party notices

This document records third-party assets incorporated into the portfolio. It does not replace the licence terms supplied by the respective creators, and it does not grant a licence to this repository's original source code.

## Satellite Dish 3D model

- **Work:** [Satellite Dish](https://sketchfab.com/3d-models/satellite-dish-3d1668dc014e4ff3b5205773b7940e71)
- **Creator:** [Jordan Little](https://sketchfab.com/JordieLitt)
- **Source:** Sketchfab
- **Licence:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- **Repository asset:** `public/models/satellite_dish.glb`

Changes made for this portfolio: the model hierarchy was split into rotating and stationary groups so the dish can aim independently of its base. The site also applies presentation transforms and runtime material grading, including colour, emissive intensity, and environment-map intensity adjustments. The mesh geometry and embedded texture images are otherwise unchanged.

The model creator does not endorse this portfolio or its author.

## Fonts

The production build uses the following fonts through `next/font/google`, which downloads and self-hosts optimized font files during the Next.js build:

- **Geist:** Copyright 2024 The Geist Project Authors. Licensed under the [SIL Open Font License 1.1](https://github.com/google/fonts/blob/main/ofl/geist/OFL.txt).
- **Instrument Serif:** Copyright 2022 The Instrument Serif Project Authors. Licensed under the [SIL Open Font License 1.1](https://github.com/google/fonts/blob/main/ofl/instrumentserif/OFL.txt).

## Software dependencies

JavaScript dependencies are declared in `package.json` and resolved in `package-lock.json`. Each package remains subject to its own licence and notices. `node_modules` and generated build output are excluded from this repository.
