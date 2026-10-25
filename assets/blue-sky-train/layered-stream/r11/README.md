# r11 完整山体素材

本轮通过内置 imagegen 参考项目原画和 r07 绿色山体，补绘完整山坡及山脚树丛，用于替换运行时硬裁切的山丘。属于新生成的绘画素材，不声称逐像素还原原画。

- [wooded-ridge.png](wooded-ridge.png)：1983 × 793 RGBA，完整相连林坡，供绿色山坡和中景林坡共用。
- [lakeside-knoll.png](lakeside-knoll.png)：1774 × 887 RGBA，完整近岸小山，用于局部遮挡列车。
- [prompts.json](prompts.json)：两次内置生成的完整提示词、透明背景参数和参考路径。

两张原始生成 PNG 保持不变。运行时仅去除所有像素均完全透明的外围行列，保留所有非零透明度像素及其原始位置；没有曲线蒙版、侧边包络、逐列山脊变形或宽高分开缩放。轨前小山将 alpha ≥ 240 的近不透明内部设为 255，以实际遮挡列车，外缘透明度保留。

落地锚点使用源图坐标：林坡 y = 689，小山 y = 778。源图中存在 alpha = 1 的零散噪点，故按画出的山脚定位，避免把透明留白当作地面而使山体悬空。林坡和山脚树冠继续共用视差速度。

参考输入：

- `assets/blue-sky-train/source/blue-sky-train.png`
- `assets/blue-sky-train/layered-stream/r07/mountain-green.png`

[当前运行版本的验收报告](../../../../docs/reports/latest/report.html)；历史 r11 逐轮证据在作者工作目录保留。文件 SHA-256 见同目录 `materials.json`。本轮没有新增外部素材授权声明。
