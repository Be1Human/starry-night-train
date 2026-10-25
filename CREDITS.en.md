# Sources and usage restrictions

[简体中文](CREDITS.md) | **English** · [Project overview](README.en.md)

This project preserves source notices by component. Publishing this curated edition does not change the existing rights or usage conditions.

## Blue Sky Lake

The reference artwork is `assets/blue-sky-train/source/blue-sky-train.png`. Elements such as the bridge and train retain its painted textures. Complete clouds, wooded hills, and foliage include assets generated with `image_gen`.

The current runtime inventory is in [world.mjs](cases/blue-sky-layered/world.mjs). Prompts, asset hashes, and derivative rules are stored with the assets.

The TA breakdown uses a different reference image. Its [manifest](assets/blue-sky-train/ta-breakdown/2026-10-24-r01/manifest.json) preserves the source and hash. Its 37 layers allocate the original image's visible pixels; the decomposition grants no additional rights and does not establish that missing areas have been repainted.

## Starry Night Train and continuous steam

Starry Night Train is adapted from [incarnation-gem/sunset-cloud-train](https://github.com/incarnation-gem/sunset-cloud-train), which was extracted from [Rice-dog/code-codex](https://github.com/Rice-dog/code-codex).

The original cloud algorithm is by **mdb**. Its upstream source does not include a separate redistribution license for that shader. The project preserves the original notice: **for learning and appreciation only; do not use commercially**. Rights holders may contact the maintainer to address concerns.

The [Starry Night theme notes](themes/starry-night-train/README.md) describe the sky, train, bridge, foreground, steam, and water implementations. Blue Sky adapts the continuous steam shape while its own host handles coordinates, palette, direction, and reflection. The original reference functions are preserved in [source.glsl](modules/train/original-starry-steam/source.glsl).

## Music

Blue Sky uses the local *云岸慢行* MP3, generated with YuE2 and processed into a loop. The prompts, generation conditions, technical record, and model license are in [the music asset directory](assets/blue-sky-train/audio/layered-lake-r02/README.md).

Playing the existing MP3 requires no model installation. Technical decoding checks and subjective listening review are recorded separately.

## Curated publication

The final screenshots are actual Canvas/WebGL runtime captures. In the published TA page, inline PNGs were replaced with local references to the same bytes to reduce duplication. The reference image, layer PNGs, coordinates, Z order, and repair requirements remain traceable.

The existing component-specific notices remain applicable to extracted files and packaged examples. This publication does not provide a new blanket license for the repository.
