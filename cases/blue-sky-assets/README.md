# 蓝天湖景 · 素材与程序组合

完整云与草叶素材，结合程序山、桥、列车和实时倒影。当前研究主场景。

[打开案例](../../themes/blue-sky-train/lab/cloud-library.html) · [组合清单](scene.json)

该清单描述已有实现，尚不是通用场景加载器配置。

## 组合方法

- sky → [sky/blue-gradient](../../modules/sky/blue-gradient/README.md)
- clouds → [clouds/complete-cloud-stream-r04](../../modules/clouds/complete-cloud-stream-r04/README.md)
- terrain → [terrain/valley-distance-r05](../../modules/terrain/valley-distance-r05/README.md)
- bridge → [bridge/blue-stone-lighting](../../modules/bridge/blue-stone-lighting/README.md)
- train → [train/blue-locomotive-sdf](../../modules/train/blue-locomotive-sdf/README.md)
- steam → [train/original-starry-steam](../../modules/train/original-starry-steam/README.md)
- water → [water/shared-scene-reflection](../../modules/water/shared-scene-reflection/README.md)
- foreground → [foreground/generated-foliage-r09](../../modules/foreground/generated-foliage-r09/README.md)
- motion → [motion/blue-stream-parallax](../../modules/motion/blue-stream-parallax/README.md)

## 共享设置

- aspect："8:3"
- horizon：0.265
- deck：0.376
- trainScale：[0.55,0.43]
- lighting："左上方日光；生成PNG保留原受光方向"
- time："uTime + uGroundTravel；倒影复用 aboveWater(p,t)"

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

- 山体造型仍需校准。
- 原星河烟雾的蓝天适配尚未完成 R10 专项验收。
- 固定数量素材可持续排列，云与叶形仍会重复。

## 合成入口

- [cases/blue-sky-assets/compose.glsl](compose.glsl)
- [cases/blue-sky-assets/runtime.js](runtime.js)
- [tools/build-cloud-library.mjs](../../tools/build-cloud-library.mjs)
