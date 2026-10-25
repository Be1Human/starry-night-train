# AI Wallpaper Workshop

Two project-local skills, two working train wallpapers, and a documented path from a technical-art breakdown to validation and offline export.

[中文](README.md) · [Getting started](docs/GETTING-STARTED.md) · [Output and publishing guide (Chinese)](docs/OUTPUT-AND-PUBLISH.md) · [Source notices](CREDITS.md)

![Blue Sky Lake: actual runtime capture](docs/images/blue-sky-lake.png)
![Starry Night Train: actual runtime capture](docs/images/starry-night.png)

## Run

Install Node.js 22+ and run:

~~~sh
npm run wallpaper:doctor
npm start
~~~

Open the printed workbench URL. No npm installation, online model, or API key is needed to play the included artwork. Automated validation additionally requires Chrome or Edge.

The Blue Sky workbench includes scene playback, isolated layers, downloadable assets and reference artwork. The Starry Night example is a self-contained WebGL HTML page. The local home page links both examples, the breakdown and the report.

## Skills

- [.agents/skills/layered-wallpaper](.agents/skills/layered-wallpaper/SKILL.md): implement a prepared TA breakdown using suitable existing assets, parallax, occlusion, reflections and shaders; deliver the complete workbench.
- [.agents/skills/wallpaper-quality-export](.agents/skills/wallpaper-quality-export/SKILL.md): save baselines, preserve effects during optimization, validate functionality and frame timing, generate a readable HTML report and export offline.

The included 37-layer decomposition is a static visible-pixel study of a different reference image. Its navigation is an implementation plan, not proof of a completed animated scene.

## Where the generated project goes

New themes stay inside the project you opened: `themes/<theme-id>/` contains the workbench, `cases/<case-id>/` the runtime, and `assets/<theme-id>/` the artwork. The agent must record actual paths and the target launch command in `docs/scenes/<theme-id>/README.md`. A separate editable source project can be prepared under a new `export/<theme-id>-source-<revision>/project/`; the included starter command packages only the Blue Sky example.

Accepted offline files appear in `<chosen-output>/package/`, next to `report.html`. Upload editable sources to GitHub; import the accepted package's `index.html` into Wallpaper Engine and publish through its editor. Neither skill uploads automatically. See the [output and publishing guide](docs/OUTPUT-AND-PUBLISH.md) for instructions.

## Validate

~~~sh
npm run check
npm test
npm run test:examples
npm run wallpaper:verify-export -- --out dist/my-release
~~~

Use a new output directory for every run. The full export suite currently targets Blue Sky Lake. Native Wallpaper Engine, native 4K rendering, long-duration stability and listening quality are separate checks and must not be inferred from browser tests.

This edition keeps working runtime dependencies, both skills, selected process documentation and actual screenshots. Historical experiments, recordings, generated bundles, models and machine-specific logs are excluded. Component-specific source and license notices remain in [CREDITS.md](CREDITS.md); this package does not grant a new blanket license.
