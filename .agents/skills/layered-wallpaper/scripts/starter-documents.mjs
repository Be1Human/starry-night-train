// These documents describe the portable Blue Sky example, not every file
// or unrelated source notice that happens to exist in the author's workspace.
export const starterDocuments = {
  'index.html': `<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>分层动态壁纸 · 开箱示例</title>
<style>body{margin:0;background:#f2f7fa;color:#173447;font:16px/1.7 system-ui,sans-serif}main{max-width:1000px;margin:auto;padding:36px 24px}h1{margin:0 0 8px;font-size:30px}p{margin:8px 0 22px}img{display:block;width:100%;border-radius:12px}nav{display:flex;gap:12px;flex-wrap:wrap;margin:22px 0}a{color:#08678e}nav a{padding:10px 16px;background:white;border:1px solid #cbdde6;border-radius:8px;text-decoration:none}nav a:first-child{background:#08678e;color:white}ul{padding-left:22px}code{background:#e4eef3;padding:2px 6px;border-radius:4px}footer{margin-top:28px;font-size:14px;color:#4b6676}</style>
<main><h1>分层动态壁纸 · 开箱示例</h1><p>先体验蓝天湖景，再看制作、输出和上传说明。此包默认运行蓝天案例；星空单文件作为原始算法参考保留。</p>
<img src="assets/blue-sky-train/layered-stream/preview.png" alt="蓝天湖景列车的实际运行画面">
<nav><a href="themes/blue-sky-train/lab/layered-stream/index.html">打开蓝天工作台</a><a href="themes/blue-sky-train/lab/layered-stream/index.html?wallpaper=1">纯壁纸预览</a><a href="docs/OUTPUT-AND-PUBLISH.md">工程位置与上传</a></nav>
<h2>制作与使用</h2><ul><li><a href="docs/scenes/blue-sky-train/README.md">本次工程说明与启动命令</a> · <a href="docs/WALLPAPER-SKILLS.md">两份 Skill 的使用说明</a></li><li><a href="assets/blue-sky-train/ta-breakdown/2026-10-24-r01/index.html">TA 拆解示例</a> · <a href="assets/blue-sky-train/ta-breakdown/2026-10-24-r01/navigation/index.html">实现导航</a>（另一张参考图，导航是实施计划）</li><li><a href="themes/starry-night-train/index.html">星空列车原始单文件</a> · <a href="CREDITS.md">素材与算法来源</a></li></ul>
<footer>本地启动：在本目录运行 <code>npm start</code>。以终端当次打印的地址为准；无需 npm install。基线、报告和离线成品需在本机重新生成，未随此轻量包提供。</footer></main></html>`,
  'README.md': `# 分层动态壁纸 · 开箱示例

安装 Node.js 22+，在本目录运行 npm run wallpaper:doctor，再运行 npm start。无需 npm install。打开命令打印的工作台地址；工作台左上角“项目首页”可回到带说明链接的首页。端口以终端当次输出为准。

本包默认运行蓝天案例，并保留星空原始单文件作为算法参考。用 $layered-wallpaper 制作，用 $wallpaper-quality-export 验收及离线导出。

- [Skill 使用说明](docs/WALLPAPER-SKILLS.md)
- [工程位置、独立源码整理与上传](docs/OUTPUT-AND-PUBLISH.md)
- [源码与素材来源](CREDITS.md)

自动验收需要本机 Chrome/Edge；播放不依赖在线服务。历史测试报告、Gallery、影片、模型和缓存未附带。来源和原有使用边界继续适用，打包不产生新授权。
`,
  'docs/scenes/blue-sky-train/README.md': `# 蓝天湖景 · 本次工程说明

工程根目录为解压后包含 package.json 的 project/，文档和源码路径均相对此根目录。运行 npm run wallpaper:doctor，再运行 npm start；打开终端当次打印的 URL，无需固定作者端口或安装 npm 依赖。

工作台：themes/blue-sky-train/lab/layered-stream/index.html；场景源码：cases/blue-sky-layered/；实际素材：assets/blue-sky-train/；Skill：.agents/skills/。

已有蓝天示例可以播放；37 层 TA 拆解是另一张图的静态研究，不是新增动态主题。轻量包不带历史报告，验收与离线包在本机生成；原生 Wallpaper Engine 未由本说明背书。

[打开工作台](../../../themes/blue-sky-train/lab/layered-stream/index.html) · [输出与上传](../../OUTPUT-AND-PUBLISH.md)
`,
  'CREDITS.md': `# 蓝天示例包 · 来源与使用边界

蓝天原画在 assets/blue-sky-train/source/blue-sky-train.png。列车、桥等保留原图纹理；完整云、山和植物包含 image_gen 生成素材，提示词、哈希和派生记录与素材一起保存。TA 拆解使用另一张参考图，原图及可见像素分配不构成新增授权。

星空列车改编自 [incarnation-gem/sunset-cloud-train](https://github.com/incarnation-gem/sunset-cloud-train)，上游提取自 [Rice-dog/code-codex](https://github.com/Rice-dog/code-codex) 的 Cloud Train Background 插件。mdb 云算法未附独立再分发许可，沿用原声明：仅供学习与欣赏，请勿商用。相关声明及原始单文件随包保留，见 [星空主题说明](themes/starry-night-train/README.md)。本包不授予统一的新许可。

蓝天的连续烟形由原始星空蒸汽适配；原函数见 modules/train/original-starry-steam/source.glsl。[蒸汽来源说明](modules/train/original-starry-steam/README.md)。

配乐云岸慢行由 YuE2 生成并处理为循环 MP3，提示词、技术记录和模型许可见 [配乐说明](assets/blue-sky-train/audio/layered-lake-r02/README.md)。播放现有音频无需安装模型。技术检查不代表人工听感认可。
`,
  'modules/train/original-starry-steam/README.md': `# 原始星空连续烟形

source.glsl 保留原始连续烟形函数；蓝天宿主将其用于局部坐标、色板与反射。默认案例不依赖历史 Gallery 或旧 lab/src 镜像。

[原始单文件主题](../../../themes/starry-night-train/index.html) · [组件来源](../../../CREDITS.md)
`,
  'themes/starry-night-train/README.md': `# 星空列车 · 原始算法参考

index.html 是完整单文件 WebGL 主题，可单独打开；H 切换参数面板，空格暂停。此包保留它用于追溯蒸汽等原始实现，默认启动的是蓝天案例。

主题改编自 incarnation-gem/sunset-cloud-train，上游为 Rice-dog/code-codex。mdb 云算法未附独立再分发许可，沿用“仅供学习与欣赏，请勿商用”的原声明。详见 [来源与使用边界](../../CREDITS.md)。蓝天专项检查不代表星空或原生宿主已经验收。
`,
  'assets/blue-sky-train/audio/layered-lake-r02/README.md': `# 云岸慢行 · 配乐来源

已有循环 MP3 由 YuE2 生成并处理。播放音频无需安装模型，技术解码、循环与音量检查不代表人工听感认可。原始 WAV、备用 OGG、模型及制作过程文件未随轻量包提供。

[循环 MP3](yunan-manxing-loop.mp3) · [提示词](prompt.txt) · [技术记录](technical-report.json) · [模型许可](MODEL_LICENSE.txt)
`,
  'cases/blue-sky-layered/README.md': `# 蓝天湖景 · 分层运行案例

工作台入口为 themes/blue-sky-train/lab/layered-stream/index.html。world.mjs 定义素材与世界规则，renderer.js 负责实际遮挡及反射依赖，工作台 app.js 管理交互和宿主接口。默认内部绘制 2048×768；当前参数以源码为准。

这是当前蓝天案例，不以旧案例的数量或坐标代替新图的拆解。默认启动命令为 npm start；完整验收与离线成品需要在本机生成。

[使用与启动](../../docs/WALLPAPER-SKILLS.md) · [输出与上传](../../docs/OUTPUT-AND-PUBLISH.md) · [验收 Skill](../../.agents/skills/wallpaper-quality-export/SKILL.md)
`
};
