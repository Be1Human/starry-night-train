# 日光石桥 · AI 使用说明

蓝灰石材、桥墩受光与桥脚植被染色。

实现方式：Shader 程序效果。本素材库按视觉效果组织，不要求全部程序化；保留有效的素材与 Shader 分工。

## 可以交给 AI 的请求

请基于这个仓库中的「日光石桥」素材完成我的需求。
我想修改：[在这里填写想要的颜色、形状、运动或应用场景]。
我的项目和技术栈：[填写项目路径、引擎或网页框架]。

先读取 library/materials/sunlit-bridge.json 与 modules/bridge/blue-stone-lighting/README.md，查看真实预览 modules/bridge/blue-stone-lighting/preview.html?embed=1。
优先复用已有实现及素材，在我的项目中创建副本；保留必要依赖和来源说明。根据视觉目标选择程序、素材或混合方式，不要求重写为纯程序。
需要变化时优先调整现有参数、色板、纹理或透明 PNG；需要改轮廓时再改对应模块。不要把源码片段误当独立组件。
对齐坐标、时间、透明度和图层顺序，处理资源相对路径。完成后运行我的项目，展示修改结果，并检查边缘、运动、暂停和目标画幅。

## 可以先改什么

- 日光强度与桥体颜色
- 桥墩间距和石材颗粒

## 文件入口

- [modules/bridge/blue-stone-lighting/source.glsl](../../modules/bridge/blue-stone-lighting/source.glsl)

最小预览：[modules/bridge/blue-stone-lighting/preview.html](../../modules/bridge/blue-stone-lighting/preview.html)。预览依赖仓库内的运行时及素材；复用时按照清单一起复制并修正相对路径。

机器可读清单：[library/materials/sunlit-bridge.json](../../library/materials/sunlit-bridge.json)

## 编辑与接入

修改模块权威源并重建；lab/src 中的兼容镜像不是编辑入口。

在仓库根目录使用 npm start 启动，修改权威源后使用 npm run build:library 重建。

- coordinates：x∈[0,8/3]，y∈[0,1]，+y 向上；1单位=画面高度
- time：共享 uTime；近景使用积分 uGroundTravel。旧山/桥 cameraAt=t×speed，切换速度存在跳变限制
- color：GLSL图层输出 straight alpha；PNG上传禁用预乘，保持完整透明边缘

- 接口：bridge(vec2 p,float t)
- 接口：uSun / DECK / BRIDGE_FOOT

## 适用范围

- 简化色层光照，不是物理光追
- 石纹不是逐像素复刻；画幅缩小时细护栏易丢失

来源案例记录只说明依赖关系，不代表该整景已作为精品壁纸上架。
- [cases/blue-sky-assets/scene.json](../../cases/blue-sky-assets/scene.json)

沿用原文件与素材来源说明；生成素材记录保留在 assets/。
