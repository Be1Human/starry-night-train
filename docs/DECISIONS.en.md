# From breakdown to a moving wallpaper: implementation decisions

[简体中文](DECISIONS.md) | **English** · [Project overview](../README.en.md)

These notes summarize the choices that shape the final image and its reusable implementation. Raw recordings, iteration screenshots, and discarded experiments are outside the runtime dependencies.

## Break down the image before choosing an implementation

The [TA example](../assets/blue-sky-train/ta-breakdown/2026-10-24-r01/index.html) contains 37 visible-pixel layers and identifies repair areas. Exact recomposition verifies their positions and visible pixels. Hidden sky, complete wheel silhouettes, connected canopies, and off-canvas regions still need preparation when the chosen motions reveal them.

Complete the breakdown and navigation first, then let the production skill implement it and repair the resources needed for the enabled motions. Existing running examples supply candidate algorithms; the new breakdown supplies the scene's object counts and placement.

## Continuous travel needs complete assets and world coordinates

Looping a few rectangular strips from a finished image exposes cut edges and obvious repetition. The running example instead uses complete clouds, mountains, canopies, and repeatable bridge units, distributed by world-cell IDs and a seed.

Returning to the same world coordinate restores the same arrangement. A finite asset collection still repeats artwork, even when its composition varies continuously.

Implementation: [world.mjs](../cases/blue-sky-layered/world.mjs) and [renderer.js](../cases/blue-sky-layered/renderer.js).

## Preserve mountain proportions and blend the contact area

Painted hills use a uniform scale. The shore reads real hill-foot contact textures and blends brushwork and contact shading locally. Hills in front of the track retain an opaque core so they can hide the bridge and train. The silhouette and mountain proportions remain intact.

Implementation: [procedural-shore.js](../cases/blue-sky-layered/procedural-shore.js).

## Reflect selected objects using the same clock

The Blue Sky composition chooses sky, clouds, bridge, train, steam, and nearby shore objects as reflection sources. The water then applies ripple displacement, softening, and shimmer.

Excluding the blue distant mountains from this particular reflection is an art-direction choice for this composition, rather than a general physical rule for all lakes. The implementation uses explicit reflection sources instead of flipping the complete finished upper scene.

## Vary foliage at the level of shapes and groups

The foreground combines four canopy silhouettes with low shrubs and fern-like foliage. World-space groups vary density, scale, and pose. Travel determines when each group passes the camera; an independent wind phase drives small local motion. The previously removed narrow-bladed grass stays outside the active asset pool.

Implementation: [foreground.js](../cases/blue-sky-layered/foreground.js).

## Procedural and painted approaches have different dependencies

Starry Night uses GLSL noise, distance fields, and compositing. Blue Sky combines transparent painted assets with real-time shaders. Algorithms such as the steam shape can be reused across scenes, with their required noise inputs, coordinates, palette, direction, and reflection dependencies adapted explicitly.

Extracting a function preserves its algorithm; integration still needs those surrounding dependencies.

## Preserve the effects, then demonstrate a performance gain

Keep assets, resolution, density, seeds, and clock values fixed. Save a baseline before changing the implementation, then compare the fixed frames and behavior.

Measure JavaScript/Canvas submission time separately from real playback intervals. Timing variation from unchanged source does not count as optimization. If total GPU time, power, full graphics memory usage, or native-host behavior was not measured, record it as unmeasured.

See the [English validation workflow](WALLPAPER-SKILLS.en.md#4-use-wallpaper-quality-export), the [canonical validation skill](../.agents/skills/wallpaper-quality-export/SKILL.md), and the [saved report](reports/latest/report.html).
