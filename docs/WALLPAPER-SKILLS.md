# 下载即用：两份动态壁纸 Skill

项目已附带制作与验收两个 skill。下载整个项目，用 Codex 打开本目录即可；无需把 skill 复制到个人目录。入口在 `.agents/skills/`，支持直接用 `$名称` 调用；若刚下载后没有出现，重新打开项目或重启 Codex。目录发现规则参考 [官方 Skills 文档](https://learn.chatgpt.com/docs/build-skills)。

**先看产物在哪里：**[生成的工程目录、独立工程导出、GitHub 上传和 Wallpaper Engine 发布](OUTPUT-AND-PUBLISH.md)。制作默认保存到当前项目的 themes/、cases/、assets/，不会自动另建独立工程或上传。

## 第一次使用

安装 Node.js 22 或更高版本，在项目根目录运行：

```sh
npm run wallpaper:doctor
npm run wallpaper:start
```

无需 `npm install`、API Key 或下载 AI 模型。打开命令打印的 **蓝天列车工作台**，可以看组合、独立图层与素材。现有音乐为项目内 MP3。预览需要支持 WebGL2 的浏览器；自动验收还需要本机 Chrome 或 Edge。Windows 自动寻找已安装浏览器，也可指定 `EDGE_PATH` / `CHROME_PATH`。其他操作系统有路径探测，但本次只实际验证了 Windows。

端口 4178 已占用时，会使用新端口，不会误用另一个项目的服务。命令行工具按脚本位置定位项目，路径中有空格也可运行。

## 先拆解，再使用 layered-wallpaper

先独立完成 TA 拆解：构图与动静关系、图层/素材清单、坐标和连接、遮挡与补绘范围、静态重组对照。已有拆解文档就直接作为输入，不重做一份，也不让旧运行案例覆盖本图的对象数量和位置。

本项目示例：[晴昼湖桥列车拆解文档](../assets/blue-sky-train/ta-breakdown/2026-10-24-r01/index.html)。它的 37 层只是原画可见部分，静态重组一致不代表完整运动素材；隐藏区域与轮组等仍有待补内容。可先由 agent 运行：

```sh
node .agents/skills/layered-wallpaper/scripts/build-navigation.mjs --breakdown assets/blue-sky-train/ta-breakdown/2026-10-24-r01 --out assets/blue-sky-train/ta-breakdown/2026-10-24-r01/navigation
```

它生成可查看的实现导航及 `implementation-navigation.json`，将源图层、候选代码、待补素材、依赖顺序和完成标准连接起来。若目录已经存在，读取现有导航或指定新修订目录。导航是给模型的计划，不是动态接入的完成证明。

向 Codex 发送：

> 先读取这份 TA 拆解文档、manifest.json 和 implementation-navigation.json，再使用 $layered-wallpaper。按拆解的对象、坐标、连接与缺口，沿导航复用项目代码和合适素材，补齐所启用动作的资源后制作完整工作台网页。不要套用旧图的车厢数量和坐标，启动与适配由你完成。

产物必须是可操作的完整工作台网页，页面范本为 `themes/blue-sky-train/lab/layered-stream/index.html`。默认保留示例的布局与四种视图，纯壁纸通过同页 `?wallpaper=1` 查看。新场景优先沿用原实现与资产，AI 完成必要适配，你只需运行命令、打开目标页面操作。

制作规则、可参考的代码与素材，见 [制作 skill](../.agents/skills/layered-wallpaper/SKILL.md)、[先拆解再实现](../.agents/skills/layered-wallpaper/references/breakdown-first.md)、[工作台网页规范](../.agents/skills/layered-wallpaper/references/workbench-contract.md) 和 [项目复用地图](../.agents/skills/layered-wallpaper/references/project-map.md)。验收与导出单独交给下面的 skill。

## 检查与交付：wallpaper-quality-export

向 Codex 发送：

> 使用 $wallpaper-quality-export。先保存当前画面和性能基线，定位是否有瓶颈；在所有现有效果保持不变的前提下优化，比较固定帧和动画行为，输出适合小白阅读的 HTML 性能报告及验收通过的离线包。没有可靠优化收益就如实说明。

完整说明在 [验收导出 skill](../.agents/skills/wallpaper-quality-export/SKILL.md)。也可手动运行：

```sh
# 改代码前先保存；已有目录不会被覆盖
npm run wallpaper:audit -- --out docs/verification/my-baseline

# 优化后对照，并完成专项检查、断网检查及导出
npm run wallpaper:verify-export -- --baseline docs/verification/my-baseline --out dist/my-release
```

只验收当前版本、尚未修改实现时，可省略 `--baseline`。默认会运行 all 全套检查。完成后打开 `dist/my-release/report.html`；交付包在 `dist/my-release/package/`，含 `index.html`、`project.json` 和 `preview.png`。包可双击离线播放，也可导入 Wallpaper Engine。不要把尚未通过的 `candidate/` 当成成品。

报告白话解释帧预算、较慢帧耗时、实际播放帧率、画面对照与导出结果。真实内部绘制为 2048×768；显示窗口为 1920×1080，不能把它说成原生 4K 测试。报告会把未测的宿主表现、总 GPU、功耗、完整显存和音乐听感列出来。

固定帧、效果契约或性能门槛不通过时，不输出已验收包。所有失败仍保留 HTML、JSON 和命令日志。优化不允许降低分辨率、少画树、关倒影、少水波等；同一源码的测量波动也不会被标记成优化成果。

当前自动脚本内置的是**蓝天列车案例**。新主题需按 [适配说明](../.agents/skills/wallpaper-quality-export/references/checks-and-export.md) 替换入口、固定场景、效果契约和专项断言，不能直接套用蓝天报告为其他项目背书。

## 分享轻量示例包

```sh
npm run wallpaper:starter
```

生成 `export/wallpaper-starter-时间/` 下的 `project/` 和 ZIP，只包含当前蓝天案例所需源码、素材、两份 skill、检查工具与来源记录，并保留星空原始单文件作为蒸汽来源参考。不包含作者机器缓存、模型、历史测试截图、视频和其他实验；不访问网络、不上传。粉丝解压 ZIP 后进入 project 运行上述命令即可。新主题需由 AI 按实际依赖另行整理，不能用这个命令代替新主题导出，具体见 [独立工程与上传](OUTPUT-AND-PUBLISH.md)。

项目播放与报告不依赖其他全局 skill。制作新的位图素材时，AI 需要可用的生图能力；这是创作能力，不是下载现有示例的启动条件。原始素材和上游代码的来源/许可继续适用，打包不改变授权范围。
