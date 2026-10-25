# Using the two wallpaper skills

[简体中文](WALLPAPER-SKILLS.md) | **English** · [Project overview](../README.en.md)

The project includes a production skill and a separate validation/export skill. Open the complete repository in an agent that supports project-local skills. Their canonical instructions are in `.agents/skills/`; you do not need to copy them into a personal skill directory. If a newly downloaded project's skills are not listed, reopen the project or restart the agent.

Start with [Project files and publishing](OUTPUT-AND-PUBLISH.en.md) if you want to know where your scene, report, and offline output will be saved.

## 1. Run the example first

With Node.js 22 or later installed, run from the project root:

```sh
npm run wallpaper:doctor
npm run wallpaper:start
```

Open the printed Blue Sky workbench URL. You can inspect the combined scene, isolated layers, and actual downloadable assets. Playback needs WebGL2 and uses the local MP3; there are no npm dependencies, online model downloads, or API keys for the existing examples. Automated validation also needs Chrome or Edge.

The launcher picks another port if 4178 is occupied. Always use the URL printed for this run. The scripts resolve the project from their own location and support project paths containing spaces.

## 2. Prepare the breakdown before invoking production

Prepare or reuse a technical-art breakdown that describes:

- Composition and the relationship between camera travel, object motion, and ambient animation.
- The source image, layer/asset inventory, coordinates, scale, Z order, connections, and parents.
- Occlusion and which hidden areas must be repaired for the selected motions.
- A static recomposition check against the original image.
- Implementation navigation linking source layers to runtime objects, candidate code/assets, dependencies, and completion criteria.

If a breakdown already exists, pass it directly to the agent. The new image's object counts and coordinates remain authoritative when reusing older code.

The included [breakdown example](../assets/blue-sky-train/ta-breakdown/2026-10-24-r01/index.html) contains 37 layers of visible pixels. Static recomposition verifies those pixels; complete hidden backgrounds, wheels, and other revealed regions need additional preparation for the motions that expose them.

The agent can create navigation from its manifest:

```sh
node .agents/skills/layered-wallpaper/scripts/build-navigation.mjs --breakdown assets/blue-sky-train/ta-breakdown/2026-10-24-r01 --out assets/blue-sky-train/ta-breakdown/2026-10-24-r01/navigation
```

The sample already includes navigation. Read the existing output, or choose a new revision directory when generating another version. The script writes an HTML navigation page and `implementation-navigation.json`; these describe the implementation plan.

## 3. Use `$layered-wallpaper`

Give the agent the breakdown documents, `manifest.json`, and `implementation-navigation.json`. You can copy this prompt:

> Read the supplied TA breakdown, manifest.json, and implementation-navigation.json, then use $layered-wallpaper. Implement the objects, coordinates, connections, and repair requirements from this breakdown. Follow the navigation to reuse suitable project code and assets, prepare the missing resources required for the enabled motions, and deliver a complete interactive workbench. Use this image's train-car counts and coordinates. Handle the launch command and theme adaptation for me.

The required deliverable is an interactive workbench based on `themes/blue-sky-train/lab/layered-stream/index.html`, including the grouped layer sidebar, four views, playback controls, asset downloads, layer details, and settings. The same scene's clean wallpaper mode is available through `?wallpaper=1`.

The agent handles the import paths, launch adapter, scene code, and assets. The goal is for you to run the provided command and operate the finished page.

The canonical implementation references are currently written in Chinese:

- [Production skill](../.agents/skills/layered-wallpaper/SKILL.md).
- [Breakdown handoff](../.agents/skills/layered-wallpaper/references/breakdown-first.md).
- [Workbench delivery contract](../.agents/skills/layered-wallpaper/references/workbench-contract.md).
- [Reusable project code and assets](../.agents/skills/layered-wallpaper/references/project-map.md).

The agent can read those instructions while you use the English prompts and guides here.

## 4. Use `$wallpaper-quality-export`

Use the separate validation skill when the scene is ready:

> Use $wallpaper-quality-export. First save the current visual and performance baseline, then investigate measurable bottlenecks. Preserve every existing visual effect while optimizing. Compare fixed frames and animation behavior, and produce a beginner-friendly HTML performance report and an accepted offline package. State clearly when an optimization gain has not been demonstrated.

The [canonical validation skill](../.agents/skills/wallpaper-quality-export/SKILL.md) defines the full checks. You can also run:

```sh
# Save the baseline before implementation changes.
npm run wallpaper:audit -- --out docs/verification/my-baseline

# Compare the candidate, run specialized/offline checks, and export.
npm run wallpaper:verify-export -- --baseline docs/verification/my-baseline --out dist/my-release
```

Use fresh output directories. When accepting the current version without an implementation change, omit `--baseline`. The default export scope is the full `all` suite.

After success, open `dist/my-release/report.html`. The accepted output is `dist/my-release/package/`, containing `index.html`, `project.json`, and `preview.png`. The HTML runs offline and the package can be imported into Wallpaper Engine. A `candidate/` folder is staging output until validation succeeds.

### Read the performance report

The report currently uses Chinese labels:

- **本次浏览器验收通过** — this browser validation passed.
- **每帧提交时间** — JavaScript/Canvas frame submission time; the shown P95 represents the slower samples.
- **最慢一组的播放帧率** — the lowest mean playback frame rate across the measured groups.
- **画面对照 / 已保存基线** — visual comparison / a baseline has been saved.
- **导出结果** — export result.
- **未测** — not measured.

The internal canvas is 2048 × 768 and the browser viewport is 1920 × 1080. Those measurements do not establish native 4K performance. Frame submission time is distinct from total GPU time, CPU utilization, power use, and full graphics memory usage. The report records unmeasured items, native-host coverage, and listening-quality limits explicitly.

The visual, effect-contract, and performance gates must pass before an output is marked accepted. Failed checks still retain their HTML, JSON, and command logs. Lowering resolution, removing foliage, disabling reflections, or reducing ripple/noise detail is outside the effect-preserving optimization contract. Timing variation with unchanged source code does not count as an optimization gain.

The existing automation targets **Blue Sky Lake**. For another theme, the agent must adapt the entry point, deterministic shots, effect contract, build dependencies, and specialized assertions using the [adapter guide](../.agents/skills/wallpaper-quality-export/references/checks-and-export.md).

## 5. Share a lightweight example project

```sh
npm run wallpaper:starter
```

This creates a fresh `export/wallpaper-starter-<run-id>/` directory with `project/` and a ZIP. It includes the current Blue Sky runtime, required assets, both skills, validation tools, provenance, and the original Starry Night HTML as a steam-algorithm reference. It excludes models, machine caches, old recordings, and unrelated experiments; it does not upload anything.

Recipients extract the ZIP, enter `project/`, and run the first two commands in this guide. The starter packages the included Blue Sky example. Ask the agent to collect the actual dependencies for a new theme as described in [Standalone projects and publishing](OUTPUT-AND-PUBLISH.en.md).

Creating new bitmap assets requires an available image-generation capability. Playing the supplied examples and reading their reports do not. Asset and upstream-code usage conditions remain in effect; see [Sources and usage restrictions](../CREDITS.en.md).
