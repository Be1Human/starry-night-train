# 星空连续烟带 · 原始 GLSL 参考

[source.glsl](source.glsl) 保留原星空主题的 noise、fbmB 与 steam 函数。它依赖噪声纹理、色板、全局坐标与时间，并非无依赖插件。

蓝天当前适配位于 [starry-steam.js](../../../cases/blue-sky-layered/starry-steam.js)，由 [renderer.js](../../../cases/blue-sky-layered/renderer.js) 负责烟囱位置、整列车换向及反射依赖。完整星空运行入口为 [index.html](../../../themes/starry-night-train/index.html)。

来源和使用边界见 [CREDITS.md](../../../CREDITS.md)。此精选版不附带早期模块库预览及旧蓝天宿主。
