# 蓝天同场景实时倒影

共用场景与时间的水平倒影，加透视波纹；不规则岸线单独合成短倒影

状态：独立教学案例。这表示实现进度，不代表原图美术已验收。

[运行预览](preview.html) · [模板清单](template.json) · [模块库](../../../library/index.html#water/shared-scene-reflection)

## 源码与编辑入口

此目录中的源文件是蓝天模块的权威源。构建器直接读取；不要编辑 lab/src 中的兼容镜像。

- [modules/water/shared-scene-reflection/source.glsl](source.glsl)
- [modules/water/shared-scene-reflection/study.glsl](study.glsl)

构建入口：在项目根目录运行 `npm run build:library`。预览依赖说明见下方；不是所有模板都能无需适配地互换。

## 接口与组合约束

- reflectionPoint / fullScene / aboveWater / landscapeWithoutBank
- shoreProfile / shoreWaterline / lakeshore
- HORIZON / uRipple

- coordinates：x∈[0,8/3]，y∈[0,1]，+y 向上；1单位=画面高度
- time：共享 uTime；近景使用积分 uGroundTravel。旧山/桥 cameraAt=t×speed，切换速度存在跳变限制
- color：GLSL图层输出 straight alpha；PNG上传禁用预乘，保持完整透明边缘

## 依赖与来源

- 当前依赖：[cases/blue-sky-assets/compose.glsl](../../../cases/blue-sky-assets/compose.glsl)
- 当前依赖：[cases/blue-sky-study/compose.glsl](../../../cases/blue-sky-study/compose.glsl)
- 原始来源：[themes/blue-sky-train/lab/src/world.glsl](../../../themes/blue-sky-train/lab/src/world.glsl)
- 原始来源：[themes/blue-sky-train/lab/src/scene-world.glsl](../../../themes/blue-sky-train/lab/src/scene-world.glsl)

预览类型：scene-context。isolated 表示单元素画面，isolated-with-host 仍依赖完整原宿主；scene-context / historical-scene 保留整景关系。

## 已踩过的坑

- 反射与原景必须使用相同时间和位移
- 会增加场景求值开销；不能把旧帧截图当成实时倒影
- 弯曲的是水岸遮罩，不是桥梁的反射平面；岸边植被局部倒影仅是二维风格化近似

## 证据与使用范围

- [themes/blue-sky-train/lab/evidence/report.json](../../../themes/blue-sky-train/lab/evidence/report.json)

沿用原文件与素材来源说明；生成素材记录保留在 assets/。

[从图片拆到图层的流程](../../../docs/module-workflow.md) · [跨模块踩坑记录](../../../docs/lessons-learned.md)
