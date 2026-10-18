# 星河圆云整图实验

交错球冠簇场＋六层圆云合成，放入原列车场景

状态：历史实验。这表示实现进度，不代表原图美术已验收。

[运行预览](preview.html) · [模板清单](template.json) · [模块库](../../../library/index.html#clouds/starry-puffy-scene)

## 源码与编辑入口

这是原星河主题的教学提取。修改原主题权威源后运行构建重新提取；不要直接编辑生成副本。

- [modules/clouds/starry-puffy-scene/source.glsl](source.glsl)

构建入口：在项目根目录运行 `npm run build:library`。预览依赖说明见下方；不是所有模板都能无需适配地互换。

## 接口与组合约束

- cloudEnv / evalDomeCluster / evalCloudLayer / clouds

- coordinates：原星河世界坐标；需原宿主的 uniforms、噪声纹理、调色与合成宏
- time：共享 M 时间与分层积分；水面与天空求值使用同一时刻
- color：按原函数 alpha 与 gGlow/gFog 语义合成，不能随意套用蓝天 over()

## 依赖与来源

- 原始来源：[themes/starry-night-train/experiments/train-puffy-experiment-1792078486188.html](../../../themes/starry-night-train/experiments/train-puffy-experiment-1792078486188.html)

预览类型：historical-scene。isolated 表示单元素画面，isolated-with-host 仍依赖完整原宿主；scene-context / historical-scene 保留整景关系。

## 已踩过的坑

- 属于历史实验，不替代正式星河入口
- 保留来源说明，不能因换了云就推定整个文件的许可

## 证据与使用范围

暂无该模板的独立历史验收报告。当前模块库检查另见 docs/module-library/verification。

保留星河主题来源与限制。原云算法使用限制见 themes/starry-night-train/README.md；不要把学习提取版视为新授权。

[从图片拆到图层的流程](../../../docs/module-workflow.md) · [跨模块踩坑记录](../../../docs/lessons-learned.md)
