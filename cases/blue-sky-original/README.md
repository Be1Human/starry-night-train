# 蓝天原画 · SVG 轻动画

保留原图构图，局部水波与矢量烟雾循环，适用于画面轻动画。

[打开案例](../../themes/blue-sky-train/index.html?controls=1) · [组合清单](scene.json)

该清单描述已有实现，尚不是通用场景加载器配置。

## 组合方法

- water → [water/svg-local-ripple](../../modules/water/svg-local-ripple/README.md)
- steam → [train/svg-steam-loop](../../modules/train/svg-steam-loop/README.md)

## 共享设置

- viewBox：[0,0,2048,768]
- time："svg.setCurrentTime(time)，暂停浏览器自主SMIL时钟"
- artwork："assets/blue-sky-train/vector/blue-sky-train-animated.svg"

## 实际合成顺序

{
  "direction": "back-to-front",
  "layers": [
    "artwork",
    "water-layer（裁切原画重绘）",
    "steam-layer"
  ]
}

## 需要继续处理

- 天空、云、山、桥、列车和近景属于同一完整原画，不是独立可替换动态图层。
- 不能把它作为自由镜头穿行模板。

## 合成入口

- [themes/blue-sky-train/wallpaper.js](../../themes/blue-sky-train/wallpaper.js)
- [tools/vectorize.py](../../tools/vectorize.py)
