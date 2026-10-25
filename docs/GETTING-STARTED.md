# 快速开始

安装 Node.js 22+，将完整项目解压到一个独立目录。

~~~sh
npm run wallpaper:doctor
npm start
~~~

打开终端打印的工作台 URL。4178 被占用时，启动器会选择本项目的新端口。把地址中 themes/ 开始的部分改成 / 可查看项目首页。

## 浏览案例

- 蓝天工作台：themes/blue-sky-train/lab/layered-stream/index.html。四种视图、图层侧栏、左右行进、速度、暂停、素材下载与设置均保留。
- 蓝天纯壁纸：同一路径加 ?wallpaper=1。
- 星空列车：themes/starry-night-train/index.html。H 隐藏面板；可单独双击该 HTML。
- TA 拆解：assets/blue-sky-train/ta-breakdown/2026-10-24-r01/index.html。

蓝天配乐默认关闭，首次播放需要点击音乐按钮。原版素材仅供查看和复用参考，新增主题建立独立目录；以新参考图的拆解决定数量、坐标与补绘范围。

## 继续制作

先读 [Skill 使用指南](WALLPAPER-SKILLS.md)、[关键决策](DECISIONS.md) 和 [来源记录](../CREDITS.md)。静态拆解与已运行案例分别标明用途，不能把旧案例参数直接当成新图的目标。

## 完成后交付

新主题默认保存到本项目的 themes/、cases/、assets/，AI 应交付实际路径和目标启动命令。先保存基线，再使用验收 Skill。默认 all 检查，只有通过后才生成所选输出目录下的 package/。发布版中的 [报告示例](reports/latest/report.html) 是已保存的测量副本，新机器应重新运行检查。

源码用来继续编辑和上传 GitHub；package/ 用来导入 Wallpaper Engine；report.html 用来阅读验收结论。独立工程整理、具体输出位置和两种上传方式，见 [工程在哪里、做好后怎么上传](OUTPUT-AND-PUBLISH.md)。
