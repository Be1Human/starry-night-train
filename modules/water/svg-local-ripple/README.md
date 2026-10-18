# 完整原画局部水波

SVG裁切水域＋feTurbulence/feDisplacementMap＋统一播放时钟

状态：已接入案例。这表示实现进度，不代表原图美术已验收。

[运行预览](preview.html) · [模板清单](template.json) · [模块库](../../../library/index.html#water/svg-local-ripple)

## 源码与编辑入口

这是历史版本或原画动画的教学提取。来源冻结保留；创建新方法时请复制为新模板，不覆盖原实验。

- [modules/water/svg-local-ripple/source.svg](source.svg)

构建入口：在项目根目录运行 `npm run build:library`。预览依赖说明见下方；不是所有模板都能无需适配地互换。

## 接口与组合约束

- #water-layer / #water-ripple / #ripple-displacement
- settings.ripple / svg.setCurrentTime

- coordinates：原图 viewBox 0 0 2048 768；烟囱和水域遮罩依附原画
- time：SVG SMIL 动画；wallpaper.js 调用 pauseAnimations() 后，以统一 time 驱动 svg.setCurrentTime(time)。
- color：浏览器原生SVG填色、opacity与滤镜合成；水域通过clipPath裁切，无GLSL/PNG上传步骤。

## 依赖与来源

- 当前依赖：[themes/blue-sky-train/wallpaper.js](../../../themes/blue-sky-train/wallpaper.js)
- 当前依赖：[themes/blue-sky-train/settings.js](../../../themes/blue-sky-train/settings.js)
- 当前依赖：[assets/blue-sky-train/vector/blue-sky-train-animated.svg](../../../assets/blue-sky-train/vector/blue-sky-train-animated.svg)
- 原始来源：[tools/vectorize.py](../../../tools/vectorize.py)
- 原始来源：[themes/blue-sky-train/wallpaper.js](../../../themes/blue-sky-train/wallpaper.js)
- 素材：[assets/blue-sky-train/vector/blue-sky-train-animated.svg](../../../assets/blue-sky-train/vector/blue-sky-train-animated.svg)

预览类型：scene-context。isolated 表示单元素画面，isolated-with-host 仍依赖完整原宿主；scene-context / historical-scene 保留整景关系。

## 已踩过的坑

- 原画列车与大云保持静态，不能支持任意镜头穿行
- 适合完整画面轻动画，不等同拆分全场景

## 证据与使用范围

暂无该模板的独立历史验收报告。当前模块库检查另见 docs/module-library/verification。

沿用原文件与素材来源说明；生成素材记录保留在 assets/。

[从图片拆到图层的流程](../../../docs/module-workflow.md) · [跨模块踩坑记录](../../../docs/lessons-learned.md)
