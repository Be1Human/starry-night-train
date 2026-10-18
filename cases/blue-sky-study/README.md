# 蓝天运动骨架 · R03

理解四层云纹、局部列车坐标和同一场景倒影的最小组合。

[打开案例](../../themes/blue-sky-train/lab/examples/scene.html) · [组合清单](scene.json)

该清单描述已有实现，尚不是通用场景加载器配置。

## 组合方法

- sky → [sky/blue-gradient](../../modules/sky/blue-gradient/README.md)
- clouds → [clouds/svg-flat-masks-r03](../../modules/clouds/svg-flat-masks-r03/README.md)
- terrain → [terrain/noise-ridges](../../modules/terrain/noise-ridges/README.md)
- bridge → [bridge/simple-arch-bridge](../../modules/bridge/simple-arch-bridge/README.md)
- train → [train/blue-locomotive-sdf](../../modules/train/blue-locomotive-sdf/README.md)
- steam → [train/world-puffs](../../modules/train/world-puffs/README.md)
- water → [water/shared-scene-reflection](../../modules/water/shared-scene-reflection/README.md)
- foreground → [foreground/edge-noise-shrubs](../../modules/foreground/edge-noise-shrubs/README.md)

## 共享设置

- aspect："8:3"
- horizon：0.265
- deck：0.375
- trainScale：[1,1]
- time："共享 uTime；cameraAt=t×speed"

## 实际合成顺序

{
  "direction": "back-to-front",
  "aboveWater": [
    "sky",
    "cloudBank",
    "mountains",
    "bank",
    "train",
    "steam",
    "bridge（含护栏，覆盖车轮下缘）"
  ],
  "fullScene": [
    "aboveWater",
    "水线以下反射坐标重求值aboveWater",
    "水面染色与波纹",
    "foreground"
  ]
}

## 需要继续处理

- R03云图案有原山体遮挡边，不能作为完整透明云自由漂浮。
- 旧镜头公式在动态调速时可能跳变。

## 合成入口

- [cases/blue-sky-study/compose.glsl](compose.glsl)
- [tools/build-ta-lab.mjs](../../tools/build-ta-lab.mjs)
