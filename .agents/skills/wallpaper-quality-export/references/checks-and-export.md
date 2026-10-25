# 验收脚本与导出地图

脚本全在当前项目内，路径通过脚本位置定位项目根，不依赖启动终端所在目录。推荐在项目根使用 npm 别名；也可从别处用脚本绝对路径执行。

## 命令

```sh
npm run wallpaper:doctor
npm run wallpaper:start
npm run wallpaper:audit -- --out docs/verification/baseline
npm run wallpaper:audit -- --baseline docs/verification/baseline --out docs/verification/candidate
npm run wallpaper:verify-export -- --baseline docs/verification/baseline --out dist/release
```

所有 out 必须为项目内新的目录，避免覆盖基线或旧发布；未指定时生成唯一名字。audit 返回非零表示功能/性能/画面对照未通过或执行错误；依然输出 report.html 与 audit.json。性能失败的完整基线可以用来指导修复，执行 error 的基线不可用。

verify-export 默认全套 all。可选 core / terrain / water / foreground / clouds / steam / music 用于局部复查。报告记录所选范围；完整交付不应省略相关检查。`candidate/` 是未完成验收的暂存，不是可交付包；只有 `release.status=passed` 才会出现 `package/`。

## 范围与真实断言

由 `layered-wallpaper` 制作的产物还必须按 [工作台网页交付规范](../../layered-wallpaper/references/workbench-contract.md) 验收完整网页：四种视图、侧栏开关与选择、实际素材下载、参考图、播放控制、图层说明及窄屏可用。确认打开的是目标主题工作台；只检查 Canvas 或纯壁纸模式，不能据此宣布工作台已交付。新主题的专项检查须包含这些交互，页面范本与要求由制作 skill 维护，本 skill 负责验证。

- core：实际全景、反射依赖、图层开关、往返、暂停、边界、窄屏；再检查山脚融合。
- terrain：等比山形、轨前遮挡、随机开阔/林坡/小山、山脚真实颜色融合。
- water：波光与柔化、选择性反射、草岸世界场/共同遮罩、山脚反射。
- foreground：四种轮廓、稳定群落、疏密与姿态变化、风、移除旧草、往返/边界。
- clouds：固定色板、完整透明素材、独立云种子、倒影、风/暂停与窄屏。
- steam：与原始星空烟函数对比、GPU/CPU行为、暂停与方向。
- music：MP3 解码、时长、用户激活、循环、音量、暂停；自动浏览器静音不替代试听。
- offline：断网 file URL 加载、内嵌素材/音频、GPU Shader、全景/远坐标、宿主属性与暂停；all 额外复查离线云与音乐。

底层脚本在 `tools/test-layered-*.mjs`。其中 shore 对应 `test-layered-shader-shore.mjs`。每项设置独立的 `LAYERED_VERIFICATION_DIR`；构建/断网测试通过 `LAYERED_OUTPUT_DIR` 指向此次 candidate。默认独立构建仍支持 `npm run build:layered-wallpaper`，但单独 build 不代表验收完成。

构建读取 `world.mjs` 的 MATERIALS 与 `music.js` 的当前 MP3，内嵌到 HTML，写入 project.json。封面在 `assets/blue-sky-train/layered-stream/preview.png`，不依赖旧 docs 截图，不需要生成模型。

## 新壁纸适配

当前自动化明确适配蓝天列车，不能直接为任意 HTML 出“通过”报告。复用到新主题时：

输入拆解文档和 `implementation-navigation.json` 时，先依据本次 source/manifest 核对对象数量、坐标、原位重组和启用动作对应的素材补齐状态。静态验证通过与旧案例运行通过，都不能替代新图的动态验证；仅覆盖部分补绘/动作时明确覆盖范围。

1. 把 `layered-wallpaper/scripts/project.mjs` 中入口、runtimeFiles、assetFiles 和 WORLD/MATERIALS 引用指向新主题，或为新主题复制一份带独立名称的适配器。
2. 提供等价的 ready/state/renderAt/pause/direction/visibility/stats 接口。若框架不同，修改 audit 中的 browser evaluate 适配层。
3. 为新场景定义含近/中/远景、遮挡与接缝的确定性镜头和时刻；确保独立层动画差异测试能看到对象。
4. 把效果契约纳入新缓冲分辨率、资产哈希、层数与分布规则。修改视觉目标时建立新基线，不能在旧对照中悄悄放宽。
5. 替换蓝天专项中 r11 素材、固定尺寸和图层 ID 断言；删除测试需要记录未覆盖内容，不能把未执行写为通过。
6. 适配构建器与宿主字段，然后在无历史 dist/cache 的副本中运行预览、audit、全套导出与断网测试。

报告工具保留通俗的 CPU/播放/GPU 边界和未测项目。没有权限/平台进行原生宿主测试时明确未测，不伪造通过，也不因此停止可以完成的浏览器检查。
