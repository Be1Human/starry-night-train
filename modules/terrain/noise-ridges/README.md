# 三层噪声山脊

多频噪声轮廓＋分层色板＋细碎植被色块

状态：已接入案例。这表示实现进度，不代表原图美术已验收。

[运行预览](preview.html) · [模板清单](template.json) · [模块库](../../../library/index.html#terrain/noise-ridges)

## 源码与编辑入口

此目录中的源文件是蓝天模块的权威源。构建器直接读取；不要编辑 lab/src 中的兼容镜像。

- [modules/terrain/noise-ridges/source.glsl](source.glsl)

构建入口：在项目根目录运行 `npm run build:library`。预览依赖说明见下方；不是所有模板都能无需适配地互换。

## 接口与组合约束

- mountains(vec2 p,vec3 c,float t)
- layer depth .07/.15/.23

- coordinates：x∈[0,8/3]，y∈[0,1]，+y 向上；1单位=画面高度
- time：共享 uTime；近景使用积分 uGroundTravel。旧山/桥 cameraAt=t×speed，切换速度存在跳变限制
- color：GLSL图层输出 straight alpha；PNG上传禁用预乘，保持完整透明边缘

## 依赖与来源

- 原始来源：[themes/blue-sky-train/lab/src/world.glsl](../../../themes/blue-sky-train/lab/src/world.glsl)
- 原始来源：[themes/blue-sky-train/lab/src/common.glsl](../../../themes/blue-sky-train/lab/src/common.glsl)

预览类型：isolated。isolated 表示单元素画面，isolated-with-host 仍依赖完整原宿主；scene-context / historical-scene 保留整景关系。

## 已踩过的坑

- 简单噪声山形与参考原图不一致
- 深度参数同时影响速度和外观，宜拆成明确参数

## 证据与使用范围

暂无该模板的独立历史验收报告。当前模块库检查另见 docs/module-library/verification。

沿用原文件与素材来源说明；生成素材记录保留在 assets/。

[从图片拆到图层的流程](../../../docs/module-workflow.md) · [跨模块踩坑记录](../../../docs/lessons-learned.md)
