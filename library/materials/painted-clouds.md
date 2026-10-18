# 蓝天积云 · AI 使用说明

完整透明云素材，配合 Shader 混色与分层漂移。

实现方式：图像素材 + Shader。本素材库按视觉效果组织，不要求全部程序化；保留有效的素材与 Shader 分工。

## 可以交给 AI 的请求

请基于这个仓库中的「蓝天积云」素材完成我的需求。
我想修改：[在这里填写想要的颜色、形状、运动或应用场景]。
我的项目和技术栈：[填写项目路径、引擎或网页框架]。

先读取 library/materials/painted-clouds.json 与 modules/clouds/complete-cloud-stream-r04/README.md，查看真实预览 modules/clouds/complete-cloud-stream-r04/preview.html?embed=1。
优先复用已有实现及素材，在我的项目中创建副本；保留必要依赖和来源说明。根据视觉目标选择程序、素材或混合方式，不要求重写为纯程序。
需要变化时优先调整现有参数、色板、纹理或透明 PNG；需要改轮廓时再改对应模块。不要把源码片段误当独立组件。
对齐坐标、时间、透明度和图层顺序，处理资源相对路径。完成后运行我的项目，展示修改结果，并检查边缘、运动、暂停和目标画幅。

## 可以先改什么

- 替换云塔、云带 PNG
- 云间距、远近比例与风速

## 文件入口

- [modules/clouds/complete-cloud-stream-r04/source.glsl](../../modules/clouds/complete-cloud-stream-r04/source.glsl)
- [assets/blue-sky-train/clouds/r04/cloud-tower.png](../../assets/blue-sky-train/clouds/r04/cloud-tower.png)
- [assets/blue-sky-train/clouds/r04/cloud-bank.png](../../assets/blue-sky-train/clouds/r04/cloud-bank.png)
- [modules/motion/blue-stream-parallax/stream.js](../../modules/motion/blue-stream-parallax/stream.js)
- [cases/blue-sky-assets/runtime.js](../../cases/blue-sky-assets/runtime.js)
- [modules/_shared/blue/scene-core.glsl](../../modules/_shared/blue/scene-core.glsl)

最小预览：[modules/clouds/complete-cloud-stream-r04/preview.html](../../modules/clouds/complete-cloud-stream-r04/preview.html)。预览依赖仓库内的运行时及素材；复用时按照清单一起复制并修正相对路径。

机器可读清单：[library/materials/painted-clouds.json](../../library/materials/painted-clouds.json)

## 编辑与接入

修改模块权威源并重建；lab/src 中的兼容镜像不是编辑入口。

在仓库根目录使用 npm start 启动，修改权威源后使用 npm run build:library 重建。

- coordinates：x∈[0,8/3]，y∈[0,1]，+y 向上；1单位=画面高度
- time：共享 uTime；近景使用积分 uGroundTravel。旧山/桥 cameraAt=t×speed，切换速度存在跳变限制
- color：GLSL图层输出 straight alpha；PNG上传禁用预乘，保持完整透明边缘

- 接口：completeCloud / cloudBank
- 接口：createAssetStream(step,far).update(distance,seed)
- 接口：uCloudLayout[12] / uCloudKinds[12]

## 适用范围

- 有限两种云形会被认出重复
- 必须保留完整透明外边距、宽高比与统一受光，不随意镜像
- 24小时已有检查为时间跳转，不是持续运行

来源案例记录只说明依赖关系，不代表该整景已作为精品壁纸上架。
- [cases/blue-sky-assets/scene.json](../../cases/blue-sky-assets/scene.json)

沿用原文件与素材来源说明；生成素材记录保留在 assets/。
