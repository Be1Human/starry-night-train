# Project files, standalone packages, and publishing

[简体中文](OUTPUT-AND-PUBLISH.md) | **English** · [Project overview](../README.en.md)

The production skill saves a new wallpaper inside **the project you opened in the agent**. Ask separately for a standalone source project or publication when you need one.

## 1. Where a new theme is saved

Use the target paths in the breakdown navigation when available. Otherwise, a theme such as `my-lake` uses this layout:

```text
your-project/
  themes/my-lake/lab/layered-stream/
    index.html                  Workbench entry
    app.js                      Interaction and host callbacks
    style.css                   Workbench styling
  cases/my-lake/                Runtime, world data, and shaders
  assets/my-lake/               Reference, breakdown, assets, and provenance
  docs/scenes/my-lake/
    README.md                   Actual paths, launch command, URLs, and status
  docs/verification/            Visual/performance baselines and test evidence
  dist/my-lake-r01/             Validation and export when selected with --out
  export/                      Requested standalone source projects and ZIPs
```

`my-lake` is an example identifier. The case ID may differ when the navigation specifies it. Shared code and suitable existing assets can keep their current paths. The agent handles the new theme's entry points and launch adapter.

At delivery, the agent should give you the **actual absolute project path, workbench file, one launch command, and preview URL**. Documentation distributed with the project should use paths relative to the project root and the port printed by the launcher, so it also works after moving the folder.

Example request:

> Use $layered-wallpaper to implement the prepared TA breakdown and navigation as a new theme named my-lake. Keep the existing examples, save this theme's source and assets in their own directories, and implement its launch command. Give me the actual project directory, launch command, and workbench URL, and record them in docs/scenes/my-lake/README.md.

`npm start` currently opens Blue Sky. A new theme needs its own working launch adapter. The navigation generator creates a plan; the agent implements the scene and its directories afterward.

## 2. Source project, report, and accepted output

- **Editable source project:** the workbench, runtime code, assets, skills, and documentation. Use it for continued development and GitHub.
- **Performance report:** `report.html` in the validation directory. It explains the measurements and test results.
- **Accepted offline wallpaper:** the validation directory's `package/` folder. Use it for offline playback and Wallpaper Engine import.

For the current Blue Sky adapter:

```sh
npm run wallpaper:verify-export -- --out dist/my-release
```

A successful run produces:

```text
dist/my-release/
  report.html
  audit.json
  measurements/
  checks/
  package/
    index.html
    project.json
    preview.png
```

Choose a fresh directory for every run. A failed run keeps its report and logs; `candidate/` remains staging output until acceptance succeeds.

Without `--out`, export chooses a unique `dist/wallpaper-accepted-<run-id>/` directory; standalone audit chooses `docs/verification/wallpaper-quality-<run-id>/`. The command prints the actual paths. `verify-export` does not create a ZIP or upload files.

For a new theme, adapt the validation and build pipeline first. Changing `--out` alone still runs the Blue Sky adapter. You can ask:

> Use $wallpaper-quality-export to validate my-lake. Adapt the entry point, asset inventory, builder, effect contract, and checks to this theme, then output to dist/my-lake-r01. After acceptance, give me the absolute paths to package/ and report.html, and identify passed checks and unmeasured items.

## 3. Prepare a standalone editable project

A new theme normally belongs to this repository. Copying only `themes/my-lake/` may omit dependencies in `cases/`, `assets/`, and the project tools.

Ask the agent to collect the actual dependencies:

> Prepare my-lake as a standalone editable source project under a new export/my-lake-source-r01/project/ directory inside this project. Include the required code and assets, both skills, usage instructions, provenance, and a working launch command. Fix relative paths and validate an extracted copy. Provide a source ZIP and SHA-256 checksum, excluding caches, models, and unrelated experiments.

This is an implementation task for the agent. The existing `npm run wallpaper:starter` command packages the **included Blue Sky example**, along with the Starry Night source reference required by its documentation. It does not automatically package another theme.

The starter creates `project/` and `wallpaper-starter.zip` under a new `export/wallpaper-starter-<run-id>/` directory. Its home page links the startup, production, output, and provenance guides. Generate fresh reports on the recipient's computer when needed.

## 4. Upload editable sources to GitHub

Publish the selected editable project with its dependencies, prompts, provenance, and instructions. Generated `dist/`, `export/`, and raw test evidence are normally ignored. Source and playable-output ZIPs can be attached to a GitHub Release separately.

Example request:

> Upload export/my-lake-source-r01/project/ to my GitHub repository USER/REPOSITORY. Preserve an existing repository's history and visibility. For a new repository, start private. Prepare the README, actual screenshots, and source notices, then commit and push. Attach the source and accepted-wallpaper ZIPs to a new release, verify the remote files and package hashes, and give me the repository and download links.

You need write access to the target repository. Use your own repository or a fork when you do not have access to the original author's repository.

For a **new standalone project that has no `.git` directory or `origin` remote**, a manual setup looks like this. Replace `YOUR-NAME/YOUR-WALLPAPER` and review the staged files before committing:

```sh
git init -b main
git add .
git status
git commit -m "Add wallpaper project"
gh auth login
gh repo create YOUR-NAME/YOUR-WALLPAPER --private --source . --remote origin --push
```

For an existing Git repository, use its current remote and branch. Run commands from the standalone project's root; keep sibling projects outside this operation. GitHub Desktop is another option. See [GitHub's guide to uploading an existing local project](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github).

## 5. Publish the playable wallpaper to the Workshop

1. Obtain the accepted `package/` and confirm that its `index.html` plays offline.
2. Open the Wallpaper Engine editor and drag **`package/index.html`** onto **Create Wallpaper / 创建壁纸**. Import the accepted package directory, which contains its own dependencies. The importer reads subdirectories as well.
3. In the native app, inspect the picture, audio, and pause behavior. Record native-host results separately from browser validation.
4. In the editor's **Workshop / 创意工坊** menu, choose the sharing/publishing action. Prepare the title, description, preview, category, age rating, and visibility, then publish when ready.

Importing copies the files into Wallpaper Engine's `projects/myprojects/` directory under the Steam installation. Use **Edit → Open in Explorer / 编辑 → 在资源管理器中打开** to locate that copy. For updates, keep using the **same Wallpaper Engine project** and its Workshop association. The original editable source and imported copy have separate files; update them deliberately.

See the official [web-wallpaper import guide](https://docs.wallpaperengine.io/en/web/first/gettingstarted.html) and [publishing/update guide](https://docs.wallpaperengine.io/en/scene/first/publishing.html).

GitHub source publication and Workshop publication are separate actions. The two skills handle production, validation, and export by default. Asset and upstream-code usage conditions continue to apply; see [CREDITS.en.md](../CREDITS.en.md).
