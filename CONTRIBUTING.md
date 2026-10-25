# 开发约定

**简体中文** | [English](CONTRIBUTING.en.md)

先阅读 AGENTS.md 和当前主题的拆解、来源说明。蓝天运行权威源位于 cases/blue-sky-layered/；themes/ 中的 app.js 负责工作台、时间与宿主交互。

新增主题独立建目录。先建立 TA 拆解与 implementation-navigation.json，再按制作 Skill 实施；不要覆盖示例或原始素材。保留提示词、派生关系与来源。

~~~sh
npm run check
npm test
npm run test:examples
~~~

修改视觉或运行效果前保存基线。完成后使用 wallpaper-quality-export 的专项检查与完整导出，每次写新目录。不通过降低画质、植物密度或噪声细节获得性能分数。

提交可运行源码、实际需要的资产和精炼文档。缓存、录音、影片、模型、生成包与完整历史截图保留在本机，不提交。原生宿主与听感没有验证时明确标注。
