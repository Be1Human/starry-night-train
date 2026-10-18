# R09 完整生成近景素材

三张透明PNG＋层间速度差＋根部固定UV风摆

状态：已接入案例。这表示实现进度，不代表原图美术已验收。

[运行预览](preview.html) · [模板清单](template.json) · [模块库](../../../library/index.html#foreground/generated-foliage-r09)

## 源码与编辑入口

此目录中的源文件是蓝天模块的权威源。构建器直接读取；不要编辑 lab/src 中的兼容镜像。

- [modules/foreground/generated-foliage-r09/source.glsl](source.glsl)

构建入口：在项目根目录运行 `npm run build:library`。预览依赖说明见下方；不是所有模板都能无需适配地互换。

## 接口与组合约束

- foliageSprite / foliageBend / foliageOver / nearBank / passingBranch / grassLayer
- uFoliageAspect / uGroundTravel / uWind

- coordinates：x∈[0,8/3]，y∈[0,1]，+y 向上；1单位=画面高度
- time：共享 uTime；近景使用积分 uGroundTravel。旧山/桥 cameraAt=t×speed，切换速度存在跳变限制
- color：GLSL图层输出 straight alpha；PNG上传禁用预乘，保持完整透明边缘

## 依赖与来源

- 当前依赖：[cases/blue-sky-assets/runtime.js](../../../cases/blue-sky-assets/runtime.js)
- 当前依赖：[modules/_shared/blue/scene-core.glsl](../../_shared/blue/scene-core.glsl)
- 原始来源：[themes/blue-sky-train/lab/src/scene-foreground.glsl](../../../themes/blue-sky-train/lab/src/scene-foreground.glsl)
- 原始来源：[themes/blue-sky-train/lab/src/asset-runtime.js](../../../themes/blue-sky-train/lab/src/asset-runtime.js)
- 素材：[assets/blue-sky-train/foliage/r09/grass.png](../../../assets/blue-sky-train/foliage/r09/grass.png)
- 素材：[assets/blue-sky-train/foliage/r09/leaves.png](../../../assets/blue-sky-train/foliage/r09/leaves.png)
- 素材：[assets/blue-sky-train/foliage/r09/understory.png](../../../assets/blue-sky-train/foliage/r09/understory.png)
- 素材：[assets/blue-sky-train/foliage/r09/generation-prompts.json](../../../assets/blue-sky-train/foliage/r09/generation-prompts.json)

预览类型：isolated。isolated 表示单元素画面，isolated-with-host 仍依赖完整原宿主；scene-context / historical-scene 保留整景关系。

## 已踩过的坑

- 每类只有一张素材，重复可能被认出
- 素材受光不随日光滑杆变化；保留方向避免镜像
- 近枝遮挡桥车是设计效果，需要控制频率

## 证据与使用范围

- [themes/blue-sky-train/lab/evidence/r09-generated-foreground/report.json](../../../themes/blue-sky-train/lab/evidence/r09-generated-foreground/report.json)

沿用原文件与素材来源说明；生成素材记录保留在 assets/。

[从图片拆到图层的流程](../../../docs/module-workflow.md) · [跨模块踩坑记录](../../../docs/lessons-learned.md)
