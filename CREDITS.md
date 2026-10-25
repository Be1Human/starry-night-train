# 来源与使用边界

**简体中文** | [English](CREDITS.en.md)

本项目按组件保留来源，不使用无关影片的授权声明覆盖整个壁纸仓库。本发布整理不改变既有权利范围。

## 蓝天湖景

原画见 assets/blue-sky-train/source/blue-sky-train.png。桥梁和列车等保留原图纹理；完整云、山林和植物等包含 image_gen 生成资产。当前实际清单在 cases/blue-sky-layered/world.mjs，相关提示词、素材哈希和派生规则与资产放在一起。

TA 拆解使用另一张参考图，来源与哈希保留在该目录的 manifest.json；37 个图层为原图可见部分的像素分配，不包含新增授权，也不代表补绘已完成。

## 星空列车与连续烟带

星空列车改编自 [incarnation-gem/sunset-cloud-train](https://github.com/incarnation-gem/sunset-cloud-train)，上游提取自 [Rice-dog/code-codex](https://github.com/Rice-dog/code-codex)。原云算法作者为 mdb：上游未附独立再分发许可，本项目沿用原声明，仅供学习与欣赏，请勿商用。权利人提出异议时联系维护者处理。

夜空、列车、桥、近景、蒸汽与水面的实现说明见 [星空主题说明](themes/starry-night-train/README.md)。蓝天使用该连续烟形的适配实现，其局部坐标、色板与反射由蓝天宿主负责；相关原始函数保留在 modules/train/original-starry-steam/source.glsl。

## 音乐

蓝天使用项目内云岸慢行 MP3；它由 YuE2 生成并处理为循环音频。提示词、生成条件和模型许可位于 assets/blue-sky-train/audio/layered-lake-r02/。播放已有 MP3 不需要安装模型。技术解码检查与人工听感分别记录。

## 发布整理

最终效果图来自项目实际 Canvas/WebGL 运行。TA 网页只将内嵌 PNG 改为同字节的本地文件引用以减少重复，原图、图层 PNG、坐标、Z 与补绘清单保持可追溯。
