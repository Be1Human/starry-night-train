# 蓝天近远层素材行进

固定槽位云流＋独立地面距离积分＋风摆时间

状态：已接入案例。这表示实现进度，不代表原图美术已验收。

[运行预览](preview.html) · [模板清单](template.json) · [模块库](../../../library/index.html#motion/blue-stream-parallax)

## 源码与编辑入口

此目录中的源文件是蓝天模块的权威源。构建器直接读取；不要编辑 lab/src 中的兼容镜像。

- [modules/motion/blue-stream-parallax/scene-camera.glsl](scene-camera.glsl)
- [modules/motion/blue-stream-parallax/stream.js](stream.js)
- [modules/motion/blue-stream-parallax/study-camera.glsl](study-camera.glsl)

构建入口：在项目根目录运行 `npm run build:library`。预览依赖说明见下方；不是所有模板都能无需适配地互换。

## 接口与组合约束

- createAssetStream / CloudLibrary.setSettings / renderAt / setPaused / state
- distance / groundTravel / speed / wind / seed

- coordinates：x∈[0,8/3]，y∈[0,1]，+y 向上；1单位=画面高度
- time：共享 uTime；近景使用积分 uGroundTravel。旧山/桥 cameraAt=t×speed，切换速度存在跳变限制
- color：GLSL图层输出 straight alpha；PNG上传禁用预乘，保持完整透明边缘

## 依赖与来源

- 原始来源：[themes/blue-sky-train/lab/src/asset-stream.js](../../../themes/blue-sky-train/lab/src/asset-stream.js)
- 原始来源：[themes/blue-sky-train/lab/src/asset-runtime.js](../../../themes/blue-sky-train/lab/src/asset-runtime.js)
- 原始来源：[themes/blue-sky-train/lab/src/scene-common.glsl](../../../themes/blue-sky-train/lab/src/scene-common.glsl)

预览类型：scene-context。isolated 表示单元素画面，isolated-with-host 仍依赖完整原宿主；scene-context / historical-scene 保留整景关系。

## 已踩过的坑

- 近景和云已积分，列车与山体仍用时间×速度模型
- CloudLibrary依赖当前演示DOM，不是现成无UI通用渲染引擎

## 证据与使用范围

暂无该模板的独立历史验收报告。当前模块库检查另见 docs/module-library/verification。

沿用原文件与素材来源说明；生成素材记录保留在 assets/。

[从图片拆到图层的流程](../../../docs/module-workflow.md) · [跨模块踩坑记录](../../../docs/lessons-learned.md)
