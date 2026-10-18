# R03 四层平涂云纹

参考SVG有序路径→四通道嵌套遮罩→统一坐标平涂

状态：独立教学案例。这表示实现进度，不代表原图美术已验收。

[运行预览](preview.html) · [模板清单](template.json) · [模块库](../../../library/index.html#clouds/svg-flat-masks-r03)

## 源码与编辑入口

此目录中的源文件是蓝天模块的权威源。构建器直接读取；不要编辑 lab/src 中的兼容镜像。

- [modules/clouds/svg-flat-masks-r03/mask.js](mask.js)
- [modules/clouds/svg-flat-masks-r03/source.glsl](source.glsl)

构建入口：在项目根目录运行 `npm run build:library`。预览依赖说明见下方；不是所有模板都能无需适配地互换。

## 接口与组合约束

- cloudMasks / colorCloudPattern / cloudMotion / cloudBank
- uCloudMasks / uDebug(4,5,6) / uWind

- coordinates：GLSL世界坐标：x∈[0,8/3]，y∈[0,1]，+y向上；cloudMasks内部换算2048×480遮罩纹理坐标。
- time：共享 uTime；近景使用积分 uGroundTravel。旧山/桥 cameraAt=t×speed，切换速度存在跳变限制
- color：GLSL图层输出 straight alpha；PNG上传禁用预乘，保持完整透明边缘

## 依赖与来源

- 当前依赖：[modules/_shared/blue/study-core.glsl](../../_shared/blue/study-core.glsl)
- 当前依赖：[modules/motion/blue-stream-parallax/study-camera.glsl](../../motion/blue-stream-parallax/study-camera.glsl)
- 当前依赖：[modules/clouds/svg-flat-masks-r03/mask.js](mask.js)
- 原始来源：[themes/blue-sky-train/lab/src/cloud.glsl](../../../themes/blue-sky-train/lab/src/cloud.glsl)
- 原始来源：[themes/blue-sky-train/lab/src/cloud-mask.js](../../../themes/blue-sky-train/lab/src/cloud-mask.js)
- 原始来源：[tools/build-cloud-patterns.mjs](../../../tools/build-cloud-patterns.mjs)
- 素材：[assets/blue-sky-train/vector/cloud-patterns.json](../../../assets/blue-sky-train/vector/cloud-patterns.json)

预览类型：isolated。isolated 表示单元素画面，isolated-with-host 仍依赖完整原宿主；scene-context / historical-scene 保留整景关系。

## 已踩过的坑

- 参考图轮廓复用，不是无限生成新云形
- 山后及画幅外区域没有补全，只适合构图内有限运动
- 四层共用UV，避免深色内层跑出白底

## 证据与使用范围

- [themes/blue-sky-train/lab/evidence/report.json](../../../themes/blue-sky-train/lab/evidence/report.json)

沿用原文件与素材来源说明；生成素材记录保留在 assets/。

[从图片拆到图层的流程](../../../docs/module-workflow.md) · [跨模块踩坑记录](../../../docs/lessons-learned.md)
