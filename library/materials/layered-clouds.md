# 晚霞层云 · AI 使用说明

十二层云带叠出粉紫晚霞与深浅轮廓。

实现方式：Shader 程序效果。本素材库按视觉效果组织，不要求全部程序化；保留有效的素材与 Shader 分工。

## 可以交给 AI 的请求

请基于这个仓库中的「晚霞层云」素材完成我的需求。
我想修改：[在这里填写想要的颜色、形状、运动或应用场景]。
我的项目和技术栈：[填写项目路径、引擎或网页框架]。

先读取 library/materials/layered-clouds.json 与 modules/clouds/starry-layered-heightfield/README.md，查看真实预览 modules/clouds/starry-layered-heightfield/preview.html?embed=1。
优先复用已有实现及素材，在我的项目中创建副本；保留必要依赖和来源说明。根据视觉目标选择程序、素材或混合方式，不要求重写为纯程序。
需要变化时优先调整现有参数、色板、纹理或透明 PNG；需要改轮廓时再改对应模块。不要把源码片段误当独立组件。
对齐坐标、时间、透明度和图层顺序，处理资源相对路径。完成后运行我的项目，展示修改结果，并检查边缘、运动、暂停和目标画幅。

## 可以先改什么

- 云量、层数与轮廓起伏
- 晚霞色板与分层移动速度

## 文件入口

- [modules/clouds/starry-layered-heightfield/source.glsl](../../modules/clouds/starry-layered-heightfield/source.glsl)
- [themes/starry-night-train/index.html](../../themes/starry-night-train/index.html)

最小预览：[modules/clouds/starry-layered-heightfield/preview.html](../../modules/clouds/starry-layered-heightfield/preview.html)。此预览包含原宿主，可先复制 HTML 验证效果，再提取需要的部分。

机器可读清单：[library/materials/layered-clouds.json](../../library/materials/layered-clouds.json)

## 编辑与接入

在项目副本中修改原主题权威源，再构建提取；source.glsl 是阅读用的生成片段，不能单独当完整 Shader 运行。

在仓库根目录使用 npm start 启动，修改权威源后使用 npm run build:library 重建。

- coordinates：原星河世界坐标；需原宿主的 uniforms、噪声纹理、调色与合成宏
- time：共享 M 时间与分层积分；水面与天空求值使用同一时刻
- color：按原函数 alpha 与 gGlow/gFog 语义合成，不能随意套用蓝天 over()

- 接口：cnoise / cfbm / cpal / clouds
- 接口：uCL[12] / uCover / uStack / uAmp / uOct / uCloudTex / uNMin / uNMax

## 适用范围

- mdb 云算法移植，上游缺少再分发许可；README标明仅学习欣赏勿商用
- 不能包装为本仓库原创或默认商业素材

来源案例记录只说明依赖关系，不代表该整景已作为精品壁纸上架。
- [cases/starry-night/scene.json](../../cases/starry-night/scene.json)

保留星河主题来源与限制。原云算法使用限制见 themes/starry-night-train/README.md；不要把学习提取版视为新授权。
