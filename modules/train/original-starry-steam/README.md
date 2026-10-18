# 原始星河连续烟带及蓝天适配

抛物线中心线＋billow fbm轮廓＋空气空间漂移

状态：适配待验收。这表示实现进度，不代表原图美术已验收。

[运行预览](preview.html) · [模板清单](template.json) · [模块库](../../../library/index.html#train/original-starry-steam)

## 源码与编辑入口

source.glsl 由原星河主题提取；blue-adapter.glsl 是蓝天适配的权威源，可直接修改后重建。不要修改 lab/src/scene-steam.glsl 兼容镜像。

- [modules/train/original-starry-steam/blue-adapter.glsl](blue-adapter.glsl)
- [modules/train/original-starry-steam/source.glsl](source.glsl)

构建入口：在项目根目录运行 `npm run build:library`。预览依赖说明见下方；不是所有模板都能无需适配地互换。

## 接口与组合约束

- steam / fbmB / noise
- chimneyAt / uSteamNoise / uSteamPhase / uSteamDensity / uSteamScale

- coordinates：原星河世界坐标；需原宿主的 uniforms、噪声纹理、调色与合成宏
- time：共享 M 时间与分层积分；水面与天空求值使用同一时刻
- color：按原函数 alpha 与 gGlow/gFog 语义合成，不能随意套用蓝天 over()

## 依赖与来源

- 原始来源：[themes/starry-night-train/index.html](../../../themes/starry-night-train/index.html)
- 原始来源：[themes/blue-sky-train/lab/src/scene-steam.glsl](../../../themes/blue-sky-train/lab/src/scene-steam.glsl)
- 原始来源：[themes/blue-sky-train/lab/src/asset-runtime.js](../../../themes/blue-sky-train/lab/src/asset-runtime.js)
- 原始来源：[tools/build-cloud-library.mjs](../../../tools/build-cloud-library.mjs)

预览类型：isolated-with-host。isolated 表示单元素画面，isolated-with-host 仍依赖完整原宿主；scene-context / historical-scene 保留整景关系。

## 已踩过的坑

- 构建器原样提取星河3个函数，适配器只改坐标与颜色
- R10证据目录目前只有changes.json，不能宣称验证完成
- 原烟函数在星河已使用，蓝天适配状态应单独标注

## 证据与使用范围

- [themes/blue-sky-train/lab/evidence/r10-original-steam/changes.json](../../../themes/blue-sky-train/lab/evidence/r10-original-steam/changes.json)

保留星河主题来源与限制。原云算法使用限制见 themes/starry-night-train/README.md；不要把学习提取版视为新授权。

[从图片拆到图层的流程](../../../docs/module-workflow.md) · [跨模块踩坑记录](../../../docs/lessons-learned.md)
