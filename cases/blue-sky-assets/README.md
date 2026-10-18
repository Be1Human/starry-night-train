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
- time："uTime + uGroundTravel；桥和列车倒影复用 landscapeWithoutBank，岸线倒影共享 shoreProfile / lakeshore"
- shoreline："草坡上沿与入水下沿独立变化，形成宽滩与窄湾；生成 understory 素材按大小不一的灌木簇分布，中间保留低草。桥梁倒影保留水平基准，岸边植物采用局部短倒影。"

## 实际合成顺序

{
  "direction": "back-to-front",
  "aboveWater": [
    "sky",
    "cloudBank",
    "mountains",
    "train",
    "steam",
    "bridge（含护栏，覆盖车轮下缘）",
    "bank（草坡与成组灌木，遮住桥脚接地处）"
  ],
  "fullScene": [
    "可变岸线判断水面区域",
    "水平反射坐标重求值landscapeWithoutBank",
    "局部岸线短倒影、水面染色与波纹",
    "岸线上方直接求值aboveWater",
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
