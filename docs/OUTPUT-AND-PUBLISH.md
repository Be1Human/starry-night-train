# 生成的工程在哪里，做好后怎么上传

制作 Skill 默认把新壁纸写进**你在 Codex 中打开的这个项目目录**。它不是独立的生成软件，不会自动在桌面另建工程，也不会自动上传。需要独立工程或发布时，直接把下面对应的指令交给 AI。

## 1. 新壁纸保存在哪里

默认按主题分目录；已有拆解导航指定目标目录时，沿用导航。下面以新主题 `my-lake` 为例：

```text
你打开的项目/
  themes/my-lake/lab/layered-stream/
    index.html                 工作台网页入口
    app.js                     页面交互
    style.css                  页面样式
  cases/my-lake/               场景代码、世界数据与 Shader
  assets/my-lake/              原画、拆解、补绘、素材与来源记录
  docs/scenes/my-lake/
    README.md                  本次交付说明：实际目录、启动命令、链接和状态
  docs/verification/           画面和性能基线、测试证据
  dist/my-lake-r01/            指定此 --out 后的验收与导出结果
  export/                     另外请求的独立源码工程、分享 ZIP
```

`my-lake` 是示例主题 ID，不是已经生成的案例。`cases/` 可使用导航中独立的案例 ID；复用的公共代码和资产可以继续引用已有目录。新主题的路径和启动适配由 AI 完成，不需要你手动拼文件。

制作完成后，AI 应在回复中给出**实际工程根目录的绝对路径、工作台文件路径、一条启动命令、预览 URL**。随包的 `docs/scenes/<主题ID>/README.md` 使用相对工程根的文件路径和启动命令，端口以终端当次输出为准，这样换电脑或解压到别的目录后仍能使用。这些目录是制作阶段由 AI 创建的；`build-navigation.mjs` 只生成计划，不会直接创建动态工程。

可直接这样说：

> 使用 $layered-wallpaper，按已完成的 TA 拆解和实现导航制作新主题 my-lake。保留原案例，按主题保存源码和素材，并完成这个主题的启动适配。交付时告诉我实际工程目录、启动命令和工作台地址，写入 docs/scenes/my-lake/README.md。

当前下载版的 `npm start` 默认打开**蓝天列车**。新主题必须由 AI 接好自己的启动命令；旧页面能运行不等于新主题已经完成。

## 2. 成品、报告和源码有什么区别

- **源码工程**：上面的工作台、场景代码、素材、Skill 和文档，用来继续编辑或上传 GitHub。
- **性能报告**：验收目录里的 `report.html`，供你查看测试结论；不是壁纸入口。
- **离线壁纸成品**：验收目录里的 `package/`，用于导入 Wallpaper Engine 或分享播放。当前蓝天构建器会把实际资源内嵌进 HTML；新主题以适配后的实际输出为准。

当前蓝天案例可以运行：

```sh
npm run wallpaper:verify-export -- --out dist/my-release
```

通过后会出现：

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

每次换一个新的输出目录。失败时保留报告与证据，`candidate/` 是暂存，不能作为已验收成品。

省略 `--out` 时，验收导出自动使用 `dist/wallpaper-accepted-<时间和随机值>/`；单独 audit 使用 `docs/verification/wallpaper-quality-<时间和随机值>/`。命令会打印实际路径。`verify-export` 本身不会生成 ZIP，也不会上传。

**新主题先适配，再执行验收**：当前默认命令检查的是蓝天案例，不能只改一个 `--out` 就得到新主题的成品。对新主题这样说：

> 使用 $wallpaper-quality-export 验收刚制作的 my-lake。先把入口、素材清单、构建器和测试契约适配到它，输出到 dist/my-lake-r01。通过后给我 package 和 report.html 的绝对路径，说明哪些检查通过、哪些未测。

## 3. 想拿到一个可以单独发给别人的工程

默认新主题属于当前项目。只复制 `themes/my-lake/` 通常不完整，因为它还引用 `cases/`、`assets/` 和项目工具。

让 AI 整理一份独立源码工程：

> 将 my-lake 整理为独立、可继续编辑的源码工程，保存到本项目内新的 export/my-lake-source-r01/project/。带齐实际依赖、两份 Skill、使用说明、素材来源和独立启动命令；修正相对路径，在解压副本中验证。另给源码 ZIP 和 SHA-256，不包含缓存、模型或无关实验。

这是需要 AI 执行的整理任务，不是已有的通用一键导出命令。现有 `npm run wallpaper:starter` 只打包**当前蓝天示例**及所需的星空源算法参考，不会自动找到你刚做的新主题。它默认输出到 `export/wallpaper-starter-<时间和随机值>/`，包含 `project/` 与 `wallpaper-starter.zip`。工作台的“项目首页”可返回启动、制作、输出和来源说明入口；轻量包不包含历史报告，在本机重新运行验收即可生成。

## 4. 上传 GitHub：上传源码，方便保存和继续制作

上传完整的精选源码工程，保留素材来源、提示词、说明和必要依赖。`dist/`、`export/` 和原始测试证据通常被 `.gitignore` 排除；源码 ZIP、离线成品 ZIP 可作为 GitHub Release 附件发布，不必把整个导出目录塞进代码仓库。

最省事是把目标说清楚，让 AI 完成：

> 将 export/my-lake-source-r01/project/ 上传到我的 GitHub 仓库“用户名/仓库名”。已有仓库保留提交历史和可见性；新仓库先使用私有。整理 README、实际效果图和来源说明后提交并推送，把源码与壁纸成品 ZIP 放到新 Release，上传后核对远端文件和包哈希，给我仓库及下载链接。

如果只想更新已有仓库，就给出那个仓库地址。下载作者项目不会自动获得向作者仓库推送的权限；可以使用你自己的仓库或 Fork。

手动新建仓库时，可在**整理好的独立工程根目录**使用 Git 和 GitHub CLI。下面仅适用于还没有 `.git` 和 `origin` 的新工程；把 `YOUR-NAME/YOUR-WALLPAPER` 换成自己的名字，提交前查看文件列表：

```sh
git init -b main
git add .
git status
git commit -m "Add wallpaper project"
gh auth login
gh repo create YOUR-NAME/YOUR-WALLPAPER --private --source . --remote origin --push
```

已有 Git 仓库沿用原来的 remote 和分支，通过提交和 push 更新；不要在包含其他项目的父目录运行。也可使用 GitHub Desktop。参见 [GitHub 官方上传现有工程说明](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)。

## 5. 发布到 Wallpaper Engine 创意工坊：上传可播放成品

1. 先拿到验收通过的 `package/`，确认其中的 `index.html` 离线可播放。
2. 打开 Wallpaper Engine 的壁纸编辑器，将 **`package/index.html`** 拖到“创建壁纸 / Create Wallpaper”入口。只导入这个成品目录；导入器会读取其子目录，不要选择整个源码仓库。
3. 导入后在 Wallpaper Engine 中实际检查画面、声音和暂停行为。浏览器通过与原生宿主测试分别记录。
4. 在编辑器的 **Workshop / 创意工坊** 菜单选择分享或准备发布，填写标题、说明、预览图、分类、年龄分级及可见性，然后发布。

导入会复制文件到 Steam 安装目录下的 `wallpaper_engine/projects/myprojects/`。从编辑器“编辑 → 在资源管理器中打开”定位实际项目。以后更新使用**同一个 Wallpaper Engine 项目**，保留其创意工坊发布关联，再发布更新；你的源码工程仍在原目录，二者不是自动同步的。[网页壁纸导入与发布](https://docs.wallpaperengine.io/en/web/first/gettingstarted.html)、[发布和更新说明](https://docs.wallpaperengine.io/en/scene/first/publishing.html)。

GitHub 上传和创意工坊发布是两件事。两份 Skill 默认负责制作、验证和导出；仅有“制作壁纸”的要求不会自动触发公开发布。素材和上游代码原有的使用边界继续适用。
