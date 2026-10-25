# AI Wallpaper Workshop

[简体中文](README.md) | **English**

Two project-local skills, two working train wallpapers, and a documented path from a technical-art breakdown to validation and offline export.

[Getting started](docs/GETTING-STARTED.en.md) · [Using the skills](docs/WALLPAPER-SKILLS.en.md) · [Project files and publishing](docs/OUTPUT-AND-PUBLISH.en.md) · [Source notices](CREDITS.en.md)

## Working examples

**Blue Sky Lake Train** combines complete painted assets with real-time shaders: bidirectional travel, deterministic parallax, local occlusion, mountain-to-shore blending, selective reflections, ripples, steam, and gently moving foliage.

![Blue Sky Lake: actual runtime capture](docs/images/blue-sky-lake.png)

**Starry Night Train** renders the sky, layered clouds, bridge, train, steam, and water procedurally with GLSL. Its original runtime is a self-contained HTML page.

![Starry Night Train: actual runtime capture](docs/images/starry-night.png)

## Run

Install Node.js 22+ and run:

~~~sh
npm run wallpaper:doctor
npm start
~~~

Open the printed workbench URL. No npm installation, online model, or API key is needed to play the included artwork. Automated validation additionally requires Chrome or Edge.

The Blue Sky workbench includes scene playback, isolated layers, downloadable assets and reference artwork. The Starry Night example is a self-contained WebGL HTML page. The local home page links both examples, the breakdown and the report.

![The complete Blue Sky workbench](docs/images/workbench.png)

These guides are available in English. The current workbench, technical-art HTML documents, and generated HTML reports use Chinese interface labels. The [getting-started guide](docs/GETTING-STARTED.en.md) includes their English equivalents.

## Skills

- First prepare or reuse the TA breakdown, `manifest.json`, and `implementation-navigation.json` for your reference image.
- Then use `$layered-wallpaper` to implement that breakdown, reuse suitable code and assets, and deliver the complete interactive workbench.
- Finally use `$wallpaper-quality-export` to save baselines, preserve existing effects during optimization, validate the result, and export an accepted offline package with an HTML report.

The [English skill guide](docs/WALLPAPER-SKILLS.en.md) provides prompts you can copy. The canonical agent instructions are stored inside this repository and currently written in Chinese:

- [.agents/skills/layered-wallpaper](.agents/skills/layered-wallpaper/SKILL.md): implement a prepared TA breakdown using suitable existing assets, parallax, occlusion, reflections and shaders; deliver the complete workbench.
- [.agents/skills/wallpaper-quality-export](.agents/skills/wallpaper-quality-export/SKILL.md): save baselines, preserve effects during optimization, validate functionality and frame timing, generate a readable HTML report and export offline.

The included 37-layer decomposition is a static visible-pixel study of a different reference image. Its navigation is an implementation plan, not proof of a completed animated scene.

The starter format was checked through ZIP extraction, relocation, a second scene adapter and offline browser playback. See the [output-format validation record](docs/SKILL-OUTPUT-CHECK.en.md) for fixes and coverage limits.

## Where the generated project goes

New themes stay inside the project you opened: `themes/<theme-id>/` contains the workbench, `cases/<case-id>/` the runtime, and `assets/<theme-id>/` the artwork. The agent must record actual paths and the target launch command in `docs/scenes/<theme-id>/README.md`. A separate editable source project can be prepared under a new `export/<theme-id>-source-<revision>/project/`; the included starter command packages only the Blue Sky example.

Accepted offline files appear in `<chosen-output>/package/`, next to `report.html`. Upload editable sources to GitHub; import the accepted package's `index.html` into Wallpaper Engine and publish through its editor. Neither skill uploads automatically. See the [output and publishing guide](docs/OUTPUT-AND-PUBLISH.en.md) for instructions.

## Validate

~~~sh
npm run check
npm test
npm run test:examples
npm run wallpaper:verify-export -- --out dist/my-release
~~~

Use a new output directory for every run. The full export suite currently targets Blue Sky Lake. Native Wallpaper Engine, native 4K rendering, long-duration stability and listening quality are separate checks and must not be inferred from browser tests.

This edition keeps working runtime dependencies, both skills, selected process documentation and actual screenshots. Historical experiments, recordings, generated bundles, models and machine-specific logs are excluded. Component-specific source and license notices remain in [CREDITS.en.md](CREDITS.en.md); this package does not grant a new blanket license.

## English documentation

- [Getting started](docs/GETTING-STARTED.en.md): installation, launch, controls, and examples.
- [Using the skills](docs/WALLPAPER-SKILLS.en.md): breakdown inputs, English prompts, validation, and starter packages.
- [Project files and publishing](docs/OUTPUT-AND-PUBLISH.en.md): source projects, reports, offline output, GitHub, and the Workshop.
- [Implementation decisions](docs/DECISIONS.en.md): complete assets, world coordinates, occlusion, shoreline blending, reflections, and foliage.
- [Output-format validation record](docs/SKILL-OUTPUT-CHECK.en.md): recorded portability checks, fixes, and coverage limits.
- [Contributing](CONTRIBUTING.en.md): source ownership and development checks.
- [Sources and usage restrictions](CREDITS.en.md): component-specific provenance and existing usage conditions.
