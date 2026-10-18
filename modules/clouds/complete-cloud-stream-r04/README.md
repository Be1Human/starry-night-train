# R04 完整透明云素材流

两种完整生成PNG＋种子布局＋近远各6个固定槽位

状态：已接入案例。这表示实现进度，不代表原图美术已验收。

[运行预览](preview.html) · [模板清单](template.json) · [模块库](../../../library/index.html#clouds/complete-cloud-stream-r04)

## 源码与编辑入口

此目录中的源文件是蓝天模块的权威源。构建器直接读取；不要编辑 lab/src 中的兼容镜像。

- [modules/clouds/complete-cloud-stream-r04/source.glsl](source.glsl)

构建入口：在项目根目录运行 `npm run build:library`。预览依赖说明见下方；不是所有模板都能无需适配地互换。

## 接口与组合约束

- completeCloud / cloudBank
- createAssetStream(step,far).update(distance,seed)
- uCloudLayout[12] / uCloudKinds[12]

- coordinates：x∈[0,8/3]，y∈[0,1]，+y 向上；1单位=画面高度
- time：共享 uTime；近景使用积分 uGroundTravel。旧山/桥 cameraAt=t×speed，切换速度存在跳变限制
- color：GLSL图层输出 straight alpha；PNG上传禁用预乘，保持完整透明边缘

## 依赖与来源

- 当前依赖：[modules/motion/blue-stream-parallax/stream.js](../../motion/blue-stream-parallax/stream.js)
- 当前依赖：[cases/blue-sky-assets/runtime.js](../../../cases/blue-sky-assets/runtime.js)
- 当前依赖：[modules/_shared/blue/scene-core.glsl](../../_shared/blue/scene-core.glsl)
- 原始来源：[themes/blue-sky-train/lab/src/asset-cloud.glsl](../../../themes/blue-sky-train/lab/src/asset-cloud.glsl)
- 原始来源：[themes/blue-sky-train/lab/src/asset-stream.js](../../../themes/blue-sky-train/lab/src/asset-stream.js)
- 原始来源：[themes/blue-sky-train/lab/src/asset-runtime.js](../../../themes/blue-sky-train/lab/src/asset-runtime.js)
- 素材：[assets/blue-sky-train/clouds/r04/cloud-tower.png](../../../assets/blue-sky-train/clouds/r04/cloud-tower.png)
- 素材：[assets/blue-sky-train/clouds/r04/cloud-bank.png](../../../assets/blue-sky-train/clouds/r04/cloud-bank.png)

预览类型：isolated。isolated 表示单元素画面，isolated-with-host 仍依赖完整原宿主；scene-context / historical-scene 保留整景关系。

## 已踩过的坑

- 有限两种云形会被认出重复
- 必须保留完整透明外边距、宽高比与统一受光，不随意镜像
- 24小时已有检查为时间跳转，不是持续运行

## 证据与使用范围

- [themes/blue-sky-train/lab/evidence/r04-assets/report.json](../../../themes/blue-sky-train/lab/evidence/r04-assets/report.json)
- [themes/blue-sky-train/lab/evidence/r09-generated-foreground/report.json](../../../themes/blue-sky-train/lab/evidence/r09-generated-foreground/report.json)

沿用原文件与素材来源说明；生成素材记录保留在 assets/。

[从图片拆到图层的流程](../../../docs/module-workflow.md) · [跨模块踩坑记录](../../../docs/lessons-learned.md)
