# 蓝灰石桥与局部日光

独立桥体SDF＋世界空间石纹＋左上受光和帽沿遮光

状态：已接入案例。这表示实现进度，不代表原图美术已验收。

[运行预览](preview.html) · [模板清单](template.json) · [模块库](../../../library/index.html#bridge/blue-stone-lighting)

## 源码与编辑入口

此目录中的源文件是蓝天模块的权威源。构建器直接读取；不要编辑 lab/src 中的兼容镜像。

- [modules/bridge/blue-stone-lighting/source.glsl](source.glsl)

构建入口：在项目根目录运行 `npm run build:library`。预览依赖说明见下方；不是所有模板都能无需适配地互换。

## 接口与组合约束

- bridge(vec2 p,float t)
- uSun / DECK / BRIDGE_FOOT

- coordinates：x∈[0,8/3]，y∈[0,1]，+y 向上；1单位=画面高度
- time：共享 uTime；近景使用积分 uGroundTravel。旧山/桥 cameraAt=t×speed，切换速度存在跳变限制
- color：GLSL图层输出 straight alpha；PNG上传禁用预乘，保持完整透明边缘

## 依赖与来源

- 原始来源：[themes/blue-sky-train/lab/src/scene-bridge.glsl](../../../themes/blue-sky-train/lab/src/scene-bridge.glsl)
- 原始来源：[themes/blue-sky-train/lab/src/scene-common.glsl](../../../themes/blue-sky-train/lab/src/scene-common.glsl)

预览类型：isolated。isolated 表示单元素画面，isolated-with-host 仍依赖完整原宿主；scene-context / historical-scene 保留整景关系。

## 已踩过的坑

- 简化色层光照，不是物理光追
- 石纹不是逐像素复刻；画幅缩小时细护栏易丢失

## 证据与使用范围

- [themes/blue-sky-train/lab/evidence/r06-bridge/report.json](../../../themes/blue-sky-train/lab/evidence/r06-bridge/report.json)
- [themes/blue-sky-train/lab/evidence/r07-lighting/report.json](../../../themes/blue-sky-train/lab/evidence/r07-lighting/report.json)

沿用原文件与素材来源说明；生成素材记录保留在 assets/。

[从图片拆到图层的流程](../../../docs/module-workflow.md) · [跨模块踩坑记录](../../../docs/lessons-learned.md)
