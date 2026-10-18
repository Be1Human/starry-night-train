# 掠过的草木 · AI 使用说明

生成的草木成簇经过镜头，深度视差与风摆保留，间隔露出开阔湖面。

实现方式：图像素材 + Shader。本素材库按视觉效果组织，不要求全部程序化；保留有效的素材与 Shader 分工。

## 可以交给 AI 的请求

请基于这个仓库中的「掠过的草木」素材完成我的需求。
我想修改：[在这里填写想要的颜色、形状、运动或应用场景]。
我的项目和技术栈：[填写项目路径、引擎或网页框架]。

先读取 library/materials/passing-foliage.json 与 modules/foreground/generated-foliage-r09/README.md，查看真实预览 modules/foreground/generated-foliage-r09/preview.html?embed=1。
优先复用已有实现及素材，在我的项目中创建副本；保留必要依赖和来源说明。根据视觉目标选择程序、素材或混合方式，不要求重写为纯程序。
需要变化时优先调整现有参数、色板、纹理或透明 PNG；需要改轮廓时再改对应模块。不要把源码片段误当独立组件。
对齐坐标、时间、透明度和图层顺序，处理资源相对路径。完成后运行我的项目，展示修改结果，并检查边缘、运动、暂停和目标画幅。

## 可以先改什么

- 替换草丛、枝叶、灌木 PNG
- 经过速度、遮挡频率与风摆幅度
- 植物簇宽度、空档距离和出现频率

## 文件入口

- [modules/foreground/generated-foliage-r09/source.glsl](../../modules/foreground/generated-foliage-r09/source.glsl)
- [assets/blue-sky-train/foliage/r09/grass.png](../../assets/blue-sky-train/foliage/r09/grass.png)
- [assets/blue-sky-train/foliage/r09/leaves.png](../../assets/blue-sky-train/foliage/r09/leaves.png)
- [assets/blue-sky-train/foliage/r09/understory.png](../../assets/blue-sky-train/foliage/r09/understory.png)
- [assets/blue-sky-train/foliage/r09/generation-prompts.json](../../assets/blue-sky-train/foliage/r09/generation-prompts.json)
- [cases/blue-sky-assets/runtime.js](../../cases/blue-sky-assets/runtime.js)
- [modules/_shared/blue/scene-core.glsl](../../modules/_shared/blue/scene-core.glsl)

最小预览：[modules/foreground/generated-foliage-r09/preview.html](../../modules/foreground/generated-foliage-r09/preview.html)。预览依赖仓库内的运行时及素材；复用时按照清单一起复制并修正相对路径。

机器可读清单：[library/materials/passing-foliage.json](../../library/materials/passing-foliage.json)

## 编辑与接入

修改模块权威源并重建；lab/src 中的兼容镜像不是编辑入口。

在仓库根目录使用 npm start 启动，修改权威源后使用 npm run build:library 重建。

- coordinates：x∈[0,8/3]，y∈[0,1]，+y 向上；1单位=画面高度
- time：共享 uTime；近景使用积分 uGroundTravel。旧山/桥 cameraAt=t×speed，切换速度存在跳变限制
- color：GLSL图层输出 straight alpha；PNG上传禁用预乘，保持完整透明边缘
- distribution：所有近景层共享世界坐标植物簇，随机簇宽、株数、枝叶高度与间距；簇间完整留空，不做透明度切换。FOLIAGE_PATCH_SPAN=7.4，间距抖动±0.6；按 depth=.82/.94/1.02/1.14 投影。
- replay：宿主支持 ?time=秒数 的暂停定帧预览（0–86400）；不带 time 时正常播放。

- 接口：foliageSprite / foliageBend / foliageOver / nearBank / passingBranch / grassLayer
- 接口：uFoliageAspect / uGroundTravel / uWind

## 适用范围

- 每类只有一张素材，重复可能被认出
- 素材受光不随日光滑杆变化；保留方向避免镜像
- 近枝遮挡桥车是设计效果，需要控制频率
- 留空必须由各深度层共同遵守；独立随机平铺会互相填满空档。扩大素材尺寸时需同时检查簇边界与完整湖面间距。

来源案例记录只说明依赖关系，不代表该整景已作为精品壁纸上架。
- [cases/blue-sky-assets/scene.json](../../cases/blue-sky-assets/scene.json)

沿用原文件与素材来源说明；生成素材记录保留在 assets/。
