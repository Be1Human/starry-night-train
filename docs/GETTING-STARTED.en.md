# Getting started

[简体中文](GETTING-STARTED.md) | **English** · [Project overview](../README.en.md)

## Install and run

Install Node.js 22 or later. Clone or extract the **complete project** into its own directory, then run:

```sh
npm run wallpaper:doctor
npm start
```

Open the workbench URL printed in the terminal. If port 4178 is occupied, the launcher selects another port for this project. To open the project home page, keep that printed origin and replace the path beginning with `/themes/` with `/`.

The included examples do not require npm dependencies, API keys, or downloaded AI models. Use a browser with WebGL2 support. Automated browser validation also needs Chrome or Edge; on Windows the tools find an installed browser automatically. You can set `EDGE_PATH` or `CHROME_PATH` if necessary. Browser discovery includes other operating systems, but the recorded hands-on checks were performed on Windows.

## Open an example

Use these paths after the server origin printed by the launcher:

- Blue Sky workbench: `themes/blue-sky-train/lab/layered-stream/index.html`.
- Blue Sky wallpaper view: the same path with `?wallpaper=1`.
- Starry Night Train: `themes/starry-night-train/index.html`. You can also open this self-contained HTML file directly; press **H** to show or hide its panel.
- Technical-art breakdown: `assets/blue-sky-train/ta-breakdown/2026-10-24-r01/index.html`.

The Blue Sky example starts with music disabled. Click its music button to allow audio playback. The included music is a local MP3.

## Workbench controls

The current interface uses Chinese labels:

- **动态组合** — combined scene playback.
- **单层运行** — isolated layer playback.
- **独立素材** — individual assets.
- **原画参考** — reference artwork.
- **场景分层** — layer sidebar. Use a checkbox to show or hide a layer; click its name to inspect it.
- **暂停 / 播放** — pause or resume.
- **车头向左 / 车头向右** — face and travel left or right.
- **速度** — travel speed.
- **下一段风景** — move to another scenery segment.
- **换一组云** — change the cloud arrangement.
- **只看本层 / 下载素材** — isolate this layer or download its asset.
- **水面波光 / 云层与枝叶微动** — water shimmer and cloud/foliage motion.
- **开启音乐 / 关闭音乐 / 音量** — enable music, disable music, or change its volume.

The camera follows the train. Scenery moves past it at different rates according to depth. The wallpaper view uses the same running scene as the workbench.

## Make your own scene

Read [Using the skills](WALLPAPER-SKILLS.en.md), [Implementation decisions](DECISIONS.en.md), and [Sources and usage restrictions](../CREDITS.en.md).

Prepare the new image's breakdown before using the production skill. Its object counts, coordinates, connections, and repair areas define the new scene. Create a separate theme directory and keep the existing examples available.

The agent should supply the actual project paths and one command that launches the new theme. The default `npm start` command opens Blue Sky until the new theme's launch adapter has been implemented.

## Finish and deliver

Save a baseline before changing visual or runtime behavior, then use the validation skill. The default suite is `all`; an accepted release contains `package/` alongside `report.html` in the chosen output directory.

The [saved report example](reports/latest/report.html) describes an earlier measurement. Run the checks on your own machine for current results.

Source files support editing and GitHub publication; `package/` is the playable Wallpaper Engine output; `report.html` explains the validation result. See [Project files and publishing](OUTPUT-AND-PUBLISH.en.md) for the exact directories and publishing steps.
