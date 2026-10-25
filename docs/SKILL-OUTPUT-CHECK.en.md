# Output-format validation record

[简体中文](SKILL-OUTPUT-CHECK.md) | **English** · [Project overview](../README.en.md)

The recorded checks found that the current Blue Sky project format can be used independently. They also identified and fixed six broken links in the lightweight package and a home-page redirect that made the documentation difficult to find.

A second theme with its own directories and launch adapter was also exercised. The agent still needs to adapt the pipeline for each new theme; the starter command packages the existing Blue Sky example.

## Recorded validation

The original checks ran on Windows with Node.js 24 and the installed Edge browser. They generated an actual ZIP, checked CRC and file hashes with Python's ZIP reader, and ran an extracted copy from a new directory containing spaces and Chinese characters.

An `output-format-check` test theme reused the same Blue Sky assets, preserved the original example, and exercised both the workbench and offline HTML output.

The saved results were:

- The lightweight ZIP contained 203 files and matched its packaging manifest after extraction.
- All 109 local document/page references in that package resolved; the copy with the second theme had 115 references, all resolving.
- The home page's nine links responded successfully, and the workbench could return to the documentation home page.
- All four views, layer visibility, actual PNG downloads, playback/pause, and left/right direction changes passed.
- Desktop at 1440 × 1000 and narrow-screen layout at 390 × 844 passed; the narrow view had no horizontal overflow.
- The second theme's command launched its own entry point and scene module, with the original Blue Sky source preserved.
- Offline output built in the new directory and passed disconnected `file://` playback, 17 assets, embedded music, host pause, and direction-interface checks.
- Fixed frames from the original, adapted second theme, and offline output matched at the tested camera/time values. The shoreline and steam WebGL error checks both returned zero.

These numbers describe the recorded packaging check, rather than a fixed file-count requirement for future versions. The current starter manifest records the actual files in each new package.

## Repairs

The lightweight package gained a navigable home page, current project instructions, correct source notices, and the referenced original Starry Night HTML. Documentation links point to files actually included in the package instead of historical reports or omitted experiments.

Both skills distinguish the absolute paths shown in a local delivery response from the project-relative paths and launch commands distributed inside a ZIP. Recipients use the port printed by their own launcher.

[Starter home-page capture](images/starter-home.png) · [Second-theme format-check capture](images/output-format-check.png)

## Recheck the format

Run `npm test` from the project root to check world/cloud layout and generate a starter package for link, ZIP, hash, and startup-readiness checks. To check another prepared project directory:

```sh
node tools/check-project-links.mjs PATH-TO-PROJECT
```

This record covers project format, portability, derivation from the included scene, and browser workflows. The second theme reuses Blue Sky content; it is a format/adapter check. The record does not establish arbitrary-image reconstruction quality, native Wallpaper Engine performance, actual Workshop publication, listening quality, or native 4K rendering.
