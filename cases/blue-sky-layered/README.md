# 蓝天湖景 · 分层运行案例

入口：themes/blue-sky-train/lab/layered-stream/index.html。world.mjs 定义当前素材、对象与世界规则，renderer.js 按实际遮挡和反射依赖绘制，app.js 管理交互、时钟和宿主接口。

本例内部 2048 × 768；镜头跟随列车，默认车头向左。世界单元决定场景疏密，图层按距离采用不同速度。完整山体等比绘制，草岸读取山脚接触纹理，湖面使用明确反射源；云、水、烟与枝叶各有微动。

当前运行素材来自原图提取与生成 PNG；参数以本目录当前源码为准。TA 拆解示例是另一张图，不以本例的列车数量、位置和水位替代其清单。

[快速开始](../../docs/GETTING-STARTED.md) · [关键决策](../../docs/DECISIONS.md) · [验收 Skill](../../.agents/skills/wallpaper-quality-export/SKILL.md)
