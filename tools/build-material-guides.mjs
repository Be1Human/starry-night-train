import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const labels={shader:'Shader 程序效果',hybrid:'图像素材 + Shader',asset:'图像 / 矢量素材'};
export function buildMaterialGuides(root,catalog){
 mkdirSync(resolve(root,'library/materials'),{recursive:true});
 for(const material of catalog.materials){
  const template=catalog.templates.find(t=>t.id===material.templateId);
  const authority=template.sourceMode==='generated-extract'?['themes/starry-night-train/index.html']:template.sourceFiles;
  const recipe={schemaVersion:1,id:material.id,title:material.title,category:material.category,implementation:material.implementation,summary:material.summary,editable:material.editable,preview:{path:material.preview,query:'embed=1',engine:material.previewEngine,settings:material.settings,aspect:material.aspect},sourceFiles:material.sourceFiles,assets:material.assets,dependencies:material.dependencies,edit:{sourceMode:template.sourceMode,authority,instructions:template.editInstructions??(template.sourceMode==='generated-extract'?'在项目副本中修改原主题权威源，再构建提取；source.glsl 是阅读用的生成片段，不能单独当完整 Shader 运行。':'修改模块权威源并重建；lab/src 中的兼容镜像不是编辑入口。')},interfaces:template.interfaces,contract:template.contract,sourceCases:material.sourceCases,pitfalls:template.pitfalls,licenseNote:material.licenseNote,build:'npm run build:library',runtime:'npm start'};
  writeFileSync(resolve(root,material.manifest),JSON.stringify(recipe,null,2)+'\n');
  const link=p=>'['+p+'](../../'+p+')';
  const paths=[...new Set([...material.sourceFiles,...material.assets,...material.dependencies,...authority])];
  const guide=['# '+material.title+' · AI 使用说明','',material.summary,'','实现方式：'+labels[material.implementation]+'。本素材库按视觉效果组织，不要求全部程序化；保留有效的素材与 Shader 分工。','','## 可以交给 AI 的请求','','请基于这个仓库中的「'+material.title+'」素材完成我的需求。','我想修改：[在这里填写想要的颜色、形状、运动或应用场景]。','我的项目和技术栈：[填写项目路径、引擎或网页框架]。','','先读取 '+material.manifest+' 与 '+material.readme+'，查看真实预览 '+material.preview+'?embed=1。','优先复用已有实现及素材，在我的项目中创建副本；保留必要依赖和来源说明。根据视觉目标选择程序、素材或混合方式，不要求重写为纯程序。','需要变化时优先调整现有参数、色板、纹理或透明 PNG；需要改轮廓时再改对应模块。不要把源码片段误当独立组件。','对齐坐标、时间、透明度和图层顺序，处理资源相对路径。完成后运行我的项目，展示修改结果，并检查边缘、运动、暂停和目标画幅。','','## 可以先改什么','',...material.editable.map(x=>'- '+x),'','## 文件入口','',...paths.map(p=>'- '+link(p)),'','最小预览：'+link(material.preview)+'。'+(template.preview.offline?'此预览包含原宿主，可先复制 HTML 验证效果，再提取需要的部分。':'预览依赖仓库内的运行时及素材；复用时按照清单一起复制并修正相对路径。'),'','机器可读清单：'+link(material.manifest),'','## 编辑与接入','',recipe.edit.instructions,'','在仓库根目录使用 npm start 启动，修改权威源后使用 npm run build:library 重建。','',...Object.entries(template.contract).map(([key,value])=>'- '+key+'：'+value),'',...template.interfaces.map(x=>'- 接口：'+x),'','## 适用范围','',...template.pitfalls.map(x=>'- '+x),'','来源案例记录只说明依赖关系，不代表该整景已作为精品壁纸上架。',...material.sourceCases.map(c=>'- '+link(c.recipe)),'',material.licenseNote,''].join('\n');
  writeFileSync(resolve(root,material.guide),guide);
 }
}
