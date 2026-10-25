# train-wallpapers

本目录是独立的动态壁纸项目，素材、运行、验证、报告与导出均保存在本目录。不要把父仓库里的其他游戏项目作为入口或输出目录。

## 当前分层案例

- 当前蓝天列车工作台：`themes/blue-sky-train/lab/layered-stream/index.html`。
- 权威运行源码：`cases/blue-sky-layered/`；参数和素材契约以 `world.mjs` 当前内容为准。
- 工作台交互/宿主接口在入口同目录的 `app.js`。旧 `lab/src/`、SVG、Gallery 各自维护，不是当前案例的替代入口。
- 新主题独立保存，不覆盖示例和已有素材原件。保留生成提示词、派生关系及来源。

## 随仓库提供的 Skill

- `.agents/skills/layered-wallpaper/SKILL.md`：先完成 TA 拆解，再把拆解文档与实现导航交给此 skill；以本次拆解为依据复用工作台、代码与合适资产，处理素材缺口和动态关系，交付完整工作台网页。
- `.agents/skills/wallpaper-quality-export/SKILL.md`：基线、功能/画面/性能验收、保留效果的优化、HTML 报告与离线包。

两者可在项目内直接使用。播放已有示例不依赖作者个人技能目录、生成模型或在线 API。`docs/WALLPAPER-SKILLS.md` 为粉丝使用入口。

## 运行和检查

`npm run wallpaper:doctor`；`npm run wallpaper:start`。验收与导出用 `npm run wallpaper:verify-export`，默认 all 全套；每次写新目录，不能覆盖历史基线。修改前先保存性能/画面基线；不降低任何现有效果来提高分数。没有实际测量的指标标记未测。

画面可用与视觉认可分别记录。当前自动化适配蓝天案例；新主题先适配再验收。仅 build 成功不等于交付通过；原生 Wallpaper Engine 未运行时不能声称原生验收完成。
