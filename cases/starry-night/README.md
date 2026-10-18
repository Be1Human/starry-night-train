# 星河夜行 · 程序场景

星河、12层云、城镇远岸、列车和灯光倒影，共享镜头与时间。

[打开案例](../../themes/starry-night-train/index.html) · [组合清单](scene.json)

该清单描述已有实现，尚不是通用场景加载器配置。

## 组合方法

- sky → [sky/starry-galaxy](../../modules/sky/starry-galaxy/README.md)
- clouds → [clouds/starry-layered-heightfield](../../modules/clouds/starry-layered-heightfield/README.md)
- terrain → [terrain/starry-far-shore](../../modules/terrain/starry-far-shore/README.md)
- bridge → [bridge/starry-arch-bridge](../../modules/bridge/starry-arch-bridge/README.md)
- train → [train/starry-locomotive-sdf](../../modules/train/starry-locomotive-sdf/README.md)
- steam → [train/original-starry-steam](../../modules/train/original-starry-steam/README.md)
- water → [water/starry-perspective-reflection](../../modules/water/starry-perspective-reflection/README.md)
- foreground → [foreground/starry-silhouette-poles](../../modules/foreground/starry-silhouette-poles/README.md)
- motion → [motion/starry-wrapped-camera](../../modules/motion/starry-wrapped-camera/README.md)

## 共享设置

- coordinates："原星河screen→world映射，统一 horizon/zoom/camY"
- time："M中的镜头/云/岸/烟/车/轮轴分别按周期积分"
- render："前向alpha合成+gGlow；湖面复用 scene(q)"

## 实际合成顺序

{
  "direction": "front-to-back",
  "scene": [
    "fore",
    "railing",
    "steam",
    "train",
    "bridge",
    "farShore",
    "clouds",
    "sky",
    "gGlow"
  ],
  "water": "main()将水线以下坐标折回scene；共享时间"
}

## 需要继续处理

- 原云来源及许可限制保留。
- 模块source.glsl是教学提取，原主题HTML仍是权威源；不能直接拼入蓝天运行时。

## 合成入口

- [themes/starry-night-train/index.html](../../themes/starry-night-train/index.html)
- [tools/build-starry-modules.mjs](../../tools/build-starry-modules.mjs)
