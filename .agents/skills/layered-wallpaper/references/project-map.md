# 当前案例的复用地图

所有路径以项目根目录为起点。运行时无 npm 包依赖；预览/构建需要 Node.js 22+，浏览器需要 WebGL2。AI 生图与音乐生成不是播放已有素材的依赖。

先读本次 TA 拆解和实现导航，再按这里的入口复用。示例拆解为 `assets/blue-sky-train/ta-breakdown/2026-10-24-r01/`；它与旧运行案例的原图、列车数量和位置不同，不能直接搬运旧参数。交接规则见 [先拆解再实现](breakdown-first.md)。

## 打开与改哪里

网页交付的布局与交互以同目录 `index.html`、`style.css`、`app.js` 为范本，按 [工作台交付规范](workbench-contract.md) 派生；不能用旧 Gallery、纯壁纸或一个新画布替代。先复用它们，再改场景数据与素材，减少使用者配置与拼装。

- 当前工作台：`themes/blue-sky-train/lab/layered-stream/index.html`。加 `?wallpaper=1` 隐藏工作台；`?paused=1&camera=-530` 检查山脚。`revision` 参数只是刷新标签，不切换历史版本。
- 场景与素材契约：`cases/blue-sky-layered/world.mjs`，包含 WORLD、MATERIALS、SCENE_LAYERS、列车姿态与确定性单元。
- 合成、层间依赖、反射源：`cases/blue-sky-layered/renderer.js`。
- 窄草岸、世界噪声、接触纹理与共同湖面遮罩：`cases/blue-sky-layered/procedural-shore.js`。
- 素材树冠与植物群落：`cases/blue-sky-layered/foreground.js`。
- 平涂云素材处理与风时钟：`cases/blue-sky-layered/flat-clouds.js`。
- 星空烟的实时适配：`cases/blue-sky-layered/starry-steam.js`；对照原函数在 `modules/train/original-starry-steam/source.glsl`。
- 摄影机/时间/交互/宿主暂停：工作台的 `app.js`；音乐接口在案例的 `music.js`。
- 完整演变记录：`cases/blue-sky-layered/README.md`。旧修订描述不代表当前参数，当前清单以源码为准。

`modules/source-map.json` 管理的是早期模块与兼容镜像。不要因此修改 `lab/src/` 来修当前独立案例，也不要把 Gallery 上架当成壁纸实现的一部分。

## 实际素材与来源

读取 MATERIALS 得到当下有效文件，避免把这里的历史数量写死。

新场景优先直接引用这些原资产及其现有处理模块；先核对画风、用途、透明边界和锚点。原有资源能满足需求时不重新生图、不复制整套素材到新目录。只有缺少目标需要的内容时再新增，并记录来源与必要性。

- 原画：`assets/blue-sky-train/source/blue-sky-train.png`。
- 桥、列车、低灌木：`assets/blue-sky-train/layered-stream/r01/`。`generation-prompts.json` / `materials.json` 是来源参考，不要自动重建并覆盖原件。
- 蓝色远山：`layered-stream/r07/mountain-blue.png`。
- 不规则叠嶂远山：`layered-stream/r20/mountain-haze.png`；同目录保留生图提示词、视频参考帧和来源记录，与旧蓝山组成四重山脉。
- 青绿林坡与轨前小山：`layered-stream/r11/wooded-ridge.png`、`lakeside-knoll.png`；同目录有提示词与素材记录。中景坡与绿色近山复用同一原件，但位置/视差不同。
- 岸线笔触：`layered-stream/r13/shore.png`。当前 Shader 采样细节带，不重复拼接整段有限岸线。
- 三张云：`clouds/r17/`；同目录 `generation-prompts.json` 保存整体风格与来源。
- 四种近景树冠：`foliage/r17/canopy-atlas.png` 与 `prompts.json`。
- 蕨叶、低草花：`foliage/r09/understory.png`。`foliage/r09/grass.png` 已退出当前素材表，不能拿它补近景。
- 本地 MP3：`audio/layered-lake-r02/yunan-manxing-loop.mp3`。播放不需要 YuE 模型；提示词、技术记录和模型许可在同目录。
- 构建封面：`assets/blue-sky-train/layered-stream/preview.png`。修改主画面后应从当前运行结果更新封面。

上述简写均位于 `assets/blue-sky-train/` 下。根目录 CREDITS 的某段视频授权不能自动覆盖全部列车素材；保留每项既有来源和许可，不自行添加通用授权结论。

## 可以直接复用的动静规则

本例内部 2048×768；水位基线 562。世界滚动基础速度 14 px/s；默认车头向左。

云层视差约 .022/.045，四重远山 .012/.024/.041/.062，绿色近山 .14，中景坡与山脚树丛 .38，桥与草岸 1，轨前小山 1.08，低植被 2.6，前景枝叶 4.1。这些是本例构图参数，不是新主题必须照搬的公式。r20 云由主云墙、较低云肩和云鞍组成，两层缓冲各为 1024×384；原四层色板与三张云原件继续复用。

反射锚点按对象与构图分别选取；不要把本例所有常数归纳成一个严格物理镜面。水波处理、植物根部变换、烟囱随整列车换向等关系比复制某一个数值更重要。

## 验收工具归属

`tools/test-layered-*.mjs` 为当前蓝天案例的实际浏览器专项检查，包含美术与来源断言，不是任意主题的通用判题器。由独立验收 skill 挑选并隔离输出；迁移新主题时必须适配入口、固定场景、素材契约及断言。不要为了让旧断言通过而把新主题改成旧主题。
