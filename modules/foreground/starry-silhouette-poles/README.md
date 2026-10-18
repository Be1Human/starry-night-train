# 星河树丛、电线杆与垂线

周期地块＋局部树簇＋抛物线电线

状态：已接入案例。这表示实现进度，不代表原图美术已验收。

[运行预览](preview.html) · [模板清单](template.json) · [模块库](../../../library/index.html#foreground/starry-silhouette-poles)

## 源码与编辑入口

这是原星河主题的教学提取。修改原主题权威源后运行构建重新提取；不要直接编辑生成副本。

- [modules/foreground/starry-silhouette-poles/source.glsl](source.glsl)

构建入口：在项目根目录运行 `npm run build:library`。预览依赖说明见下方；不是所有模板都能无需适配地互换。

## 接口与组合约束

- landMask / fore
- uFore / cFore / uHorizon

- coordinates：原星河世界坐标；需原宿主的 uniforms、噪声纹理、调色与合成宏
- time：共享 M 时间与分层积分；水面与天空求值使用同一时刻
- color：按原函数 alpha 与 gGlow/gFog 语义合成，不能随意套用蓝天 over()

## 依赖与来源

- 原始来源：[themes/starry-night-train/index.html](../../../themes/starry-night-train/index.html)

预览类型：isolated-with-host。isolated 表示单元素画面，isolated-with-host 仍依赖完整原宿主；scene-context / historical-scene 保留整景关系。

## 已踩过的坑

- 适合夜间剪影，不能当作日间细节植被
- 周期1.95必须与树簇哈希/电线段统一

## 证据与使用范围

暂无该模板的独立历史验收报告。当前模块库检查另见 docs/module-library/verification。

保留星河主题来源与限制。原云算法使用限制见 themes/starry-night-train/README.md；不要把学习提取版视为新授权。

[从图片拆到图层的流程](../../../docs/module-workflow.md) · [跨模块踩坑记录](../../../docs/lessons-learned.md)
