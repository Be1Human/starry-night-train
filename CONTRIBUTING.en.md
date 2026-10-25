# Contributing

[简体中文](CONTRIBUTING.md) | **English** · [Project overview](README.en.md)

Read [AGENTS.md](AGENTS.md), the current theme's breakdown, and its source notices before making changes. The authoritative Blue Sky runtime is in `cases/blue-sky-layered/`. The workbench's `app.js` under `themes/` owns interaction, clocks, and host callbacks.

Create separate directories for new themes. Prepare the TA breakdown and `implementation-navigation.json` before production. Preserve the examples, original assets, generation prompts, derivative relationships, and source records.

```sh
npm run check
npm test
npm run test:examples
```

Save a baseline before changing visual or runtime effects. Use `wallpaper-quality-export` for the relevant specialized checks and full accepted export, writing to a fresh directory each time. Preserve the scene's resolution, foliage density, reflections, ripple detail, and noise detail during effect-preserving optimization.

Commit runnable source, the assets it actually requires, and concise documentation. Keep caches, narration, films, models, generated packages, and full historical screenshot sets outside the source commit. Record native-host and listening checks as unmeasured when they were not performed.

English documentation uses `.en.md` filenames. Keep language links reciprocal, use project-relative local links, preserve executable command names and path identifiers, and update `PROJECT-MANIFEST.json` when published files change. The canonical agent instructions remain in `AGENTS.md` and each skill's `SKILL.md`.

See [Using the skills](docs/WALLPAPER-SKILLS.en.md), [Implementation decisions](docs/DECISIONS.en.md), and [Sources and usage restrictions](CREDITS.en.md).
