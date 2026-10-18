# 夜色石拱桥 · AI 使用说明

连续圆拱、石材明暗与单独绘制的前层护栏。

实现方式：Shader 程序效果。本素材库按视觉效果组织，不要求全部程序化；保留有效的素材与 Shader 分工。

## 可以交给 AI 的请求

请基于这个仓库中的「夜色石拱桥」素材完成我的需求。
我想修改：[在这里填写想要的颜色、形状、运动或应用场景]。
我的项目和技术栈：[填写项目路径、引擎或网页框架]。

先读取 library/materials/arch-bridge.json 与 modules/bridge/starry-arch-bridge/README.md，查看真实预览 modules/bridge/starry-arch-bridge/preview.html?embed=1。
优先复用已有实现及素材，在我的项目中创建副本；保留必要依赖和来源说明。根据视觉目标选择程序、素材或混合方式，不要求重写为纯程序。
需要变化时优先调整现有参数、色板、纹理或透明 PNG；需要改轮廓时再改对应模块。不要把源码片段误当独立组件。
对齐坐标、时间、透明度和图层顺序，处理资源相对路径。完成后运行我的项目，展示修改结果，并检查边缘、运动、暂停和目标画幅。

## 可以先改什么

- 拱孔比例与桥面高度
- 石材色板、纹理与护栏

## 文件入口

- [modules/bridge/starry-arch-bridge/source.glsl](../../modules/bridge/starry-arch-bridge/source.glsl)
- [themes/starry-night-train/index.html](../../themes/starry-night-train/index.html)

最小预览：[modules/bridge/starry-arch-bridge/preview.html](../../modules/bridge/starry-arch-bridge/preview.html)。此预览包含原宿主，可先复制 HTML 验证效果，再提取需要的部分。

机器可读清单：[library/materials/arch-bridge.json](../../library/materials/arch-bridge.json)

## 编辑与接入

在项目副本中修改原主题权威源，再构建提取；source.glsl 是阅读用的生成片段，不能单独当完整 Shader 运行。

在仓库根目录使用 npm start 启动，修改权威源后使用 npm run build:library 重建。

- coordinates：原星河世界坐标；需原宿主的 uniforms、噪声纹理、调色与合成宏
- time：共享 M 时间与分层积分；水面与天空求值使用同一时刻
- color：按原函数 alpha 与 gGlow/gFog 语义合成，不能随意套用蓝天 over()

- 接口：bridge / railing
- 接口：uCamX / DECK

## 适用范围

- 护栏在列车前，桥在列车后，不能合成单一错误层级
- 线宽依赖gPx以适应镜头缩放

来源案例记录只说明依赖关系，不代表该整景已作为精品壁纸上架。
- [cases/starry-night/scene.json](../../cases/starry-night/scene.json)

保留星河主题来源与限制。原云算法使用限制见 themes/starry-night-train/README.md；不要把学习提取版视为新授权。
