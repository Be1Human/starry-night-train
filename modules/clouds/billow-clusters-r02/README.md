# R02 双尺度球冠簇

大轮廓包络＋两级局部3×3球冠邻域＋分段光色

状态：历史实验。这表示实现进度，不代表原图美术已验收。

[运行预览](preview.html) · [模板清单](template.json) · [模块库](../../../library/index.html#clouds/billow-clusters-r02)

## 源码与编辑入口

这是历史版本或原画动画的教学提取。来源冻结保留；创建新方法时请复制为新模板，不覆盖原实验。

- [modules/clouds/billow-clusters-r02/source.glsl](source.glsl)

构建入口：在项目根目录运行 `npm run build:library`。预览依赖说明见下方；不是所有模板都能无需适配地互换。

## 接口与组合约束

- cloudField / cloudWarp / cloudBillows / cloudVariant
- seed / scale / haze / uDetail

- coordinates：x∈[0,8/3]，y∈[0,1]，+y 向上；1单位=画面高度
- time：共享 uTime；近景使用积分 uGroundTravel。旧山/桥 cameraAt=t×speed，切换速度存在跳变限制
- color：GLSL图层输出 straight alpha；PNG上传禁用预乘，保持完整透明边缘

## 依赖与来源

- 原始来源：[themes/blue-sky-train/lab/history/r02/src/cloud.glsl](../../../themes/blue-sky-train/lab/history/r02/src/cloud.glsl)
- 原始来源：[themes/blue-sky-train/lab/history/r02/src/common.glsl](../../../themes/blue-sky-train/lab/history/r02/src/common.glsl)

预览类型：isolated。isolated 表示单元素画面，isolated-with-host 仍依赖完整原宿主；scene-context / historical-scene 保留整景关系。

## 已踩过的坑

- 每云调用两级邻域计算，逐像素开销高于简单轮廓
- 仍属于球冠受光造型，不能等同参考图的平涂内部图案

## 证据与使用范围

暂无该模板的独立历史验收报告。当前模块库检查另见 docs/module-library/verification。

沿用原文件与素材来源说明；生成素材记录保留在 assets/。

[从图片拆到图层的流程](../../../docs/module-workflow.md) · [跨模块踩坑记录](../../../docs/lessons-learned.md)
