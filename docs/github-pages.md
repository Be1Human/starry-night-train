# GitHub Pages 发布

编辑源为 train-wallpapers。线上地址：https://be1human.github.io/starry-night-train/ 。Gallery 使用纯黑页面背景；完整火车壁纸与分类素材分别展示。

运行 `npm run build:pages` 生成 `dist/pages/`，再运行 `npm run check:pages` 检查项目子路径、精选清单、预览依赖和静态资源。构建不会覆盖 Wallpaper Engine 的其他导出目录。

发布时将 `dist/pages/` 内容提交到 `Be1Human/starry-night-train` 的 `codex/gallery-pages` 分支，GitHub Pages 的来源设为该分支根目录。`master` 保留原星河项目及历史。首次部署前确认完整静态包已通过检查。

包内保留精选预览、真实 PNG、模块源码、案例配方、来源说明及重建素材库所需的源码和脚本。开发录屏、音频、缓存、验证截图集合以及其他项目不进入发布包。`.nojekyll` 保证 `_shared` 目录能正确发布。

根入口保留查询参数与 `#materials` 等路由，再跳转到 `library/`。所有运行资源使用相对地址，可放在 github.io 项目子目录，不依赖本地端口或后端。

在 GitHub Pages 上复制 AI 说明时，会附加当前站点与素材入口，便于 AI 定位线上源码。
