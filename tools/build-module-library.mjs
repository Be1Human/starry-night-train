import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {selectPublicCatalog} from './public-library.mjs';
import {buildMaterialGuides} from './build-material-guides.mjs';
import {syncModuleMirrors} from './module-sources.mjs';
import {buildBlueModulePreviews} from './build-blue-module-previews.mjs';
import {buildStarryModules} from './build-starry-modules.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8'),json=p=>JSON.parse(read(p));
const write=(p,s)=>{mkdirSync(dirname(resolve(root,p)),{recursive:true});writeFileSync(resolve(root,p),s)};
const sha=p=>createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex');
const link=(from,to)=>relative(resolve(root,from),resolve(root,to)).replaceAll('\\','/');
const status={'integrated':'已接入案例','standalone-example':'独立教学案例','experiment':'历史实验','adapter-unverified':'适配待验收'};
syncModuleMirrors();
for(const tool of ['build-ta-lab.mjs','build-cloud-library.mjs'])execFileSync(process.execPath,[resolve(root,'tools',tool)],{cwd:root,stdio:'inherit'});
const blue=buildBlueModulePreviews(),starry=buildStarryModules();
const categories=json('modules/categories.json'),templates=[];
for(const category of categories){
 for(const entry of readdirSync(resolve(root,'modules',category.id),{withFileTypes:true}).filter(e=>e.isDirectory())){
  const dir='modules/'+category.id+'/'+entry.name,t=json(dir+'/template.json');
  const preview=blue[t.id],night=starry.find(s=>s.path===dir);
  if(preview)t.preview={...t.preview,kind:preview.kind,engine:preview.engine,frame:!!preview.frame};
  if(night)t.preview={...t.preview,kind:night.previewKind,engine:night.previewKind==='historical-scene'?'linked':'StarryModulePreview',frame:night.previewKind==='historical-scene'};
  t.sha256=Object.fromEntries(t.sourceFiles.map(p=>[p,sha(p)]));
  t.readme=dir+'/README.md';t.manifest=dir+'/template.json';
  t.thumbnail=t.thumbnail??(t.category==='foreground'&&t.id.endsWith('generated-foliage-r09')?'assets/blue-sky-train/foliage/r09/grass.png':t.id.includes('starry')?'assets/starry-night-train/images/screenshot.png':'assets/blue-sky-train/source/blue-sky-train.png');
  t.thumbnailKind=t.thumbnailKind??'案例参考';
  const reference=p=>'['+p+']('+link(dir,p)+')';
  const doc=['# '+t.name,'',t.method,'','状态：'+status[t.status]+'。这表示实现进度，不代表原图美术已验收。','','[运行预览](preview.html) · [模板清单](template.json) · [模块库](../../../library/index.html#'+t.id+')','','## 源码与编辑入口','',t.editInstructions?t.editInstructions:t.sourceMode==='canonical'?'此目录中的源文件是蓝天模块的权威源。构建器直接读取；不要编辑 lab/src 中的兼容镜像。':t.sourceMode==='generated-extract'?'这是原星河主题的教学提取。修改原主题权威源后运行构建重新提取；不要直接编辑生成副本。':'这是历史版本或原画动画的教学提取。来源冻结保留；创建新方法时请复制为新模板，不覆盖原实验。','',...t.sourceFiles.map(p=>'- '+reference(p)),'','构建入口：在项目根目录运行 '+String.fromCharCode(96)+'npm run build:library'+String.fromCharCode(96)+'。预览依赖说明见下方；不是所有模板都能无需适配地互换。','','## 接口与组合约束','',...t.interfaces.map(s=>'- '+s),'',...Object.entries(t.contract).map(([k,v])=>'- '+k+'：'+v),'','## 依赖与来源','',...(t.dependencies??[]).map(p=>'- 当前依赖：'+reference(p)),...t.sourceOrigins.map(o=>'- 原始来源：'+reference(o.path)),...t.assets.map(p=>'- 素材：'+reference(p)),'','预览类型：'+t.preview.kind+'。isolated 表示单元素画面，isolated-with-host 仍依赖完整原宿主；scene-context / historical-scene 保留整景关系。','','## 已踩过的坑','',...t.pitfalls.map(s=>'- '+s),'','## 证据与使用范围','',t.evidence.length?t.evidence.map(p=>'- '+reference(p)).join('\n'):'暂无该模板的独立历史验收报告。当前模块库检查另见 docs/module-library/verification。','',t.licenseNote,'','[从图片拆到图层的流程](../../../docs/module-workflow.md) · [跨模块踩坑记录](../../../docs/lessons-learned.md)',''].join('\n');
  write(t.readme,doc);templates.push(t);
 }
}
templates.sort((a,b)=>(a.sortOrder??999)-(b.sortOrder??999));
const cases=readdirSync(resolve(root,'cases'),{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>json('cases/'+e.name+'/scene.json'));
for(const c of cases){
 const dir='cases/'+c.id,ref=p=>'['+p+']('+link(dir,p.split('?')[0])+(p.includes('?')?'?'+p.split('?')[1]:'')+')';
 write(dir+'/README.md',['# '+c.name,'',c.description,'','[打开案例]('+link(dir,c.entry.split('?')[0])+(c.entry.includes('?')?'?'+c.entry.split('?')[1]:'')+') · [组合清单](scene.json)','','该清单描述已有实现，尚不是通用场景加载器配置。','','## 组合方法','',...c.layers.map(l=>'- '+l.role+' → ['+l.template+'](../../modules/'+l.template+'/README.md)'),'','## 共享设置','',...Object.entries(c.shared).map(([k,v])=>'- '+k+'：'+JSON.stringify(v)),'','## 实际合成顺序','',JSON.stringify(c.compositing,null,2),'','## 需要继续处理','',...c.limitations.map(s=>'- '+s),'','## 合成入口','',...c.composition.map(p=>'- '+ref(p)),''].join('\n'));
}
const inventory={schemaVersion:1,categories,status,templates,cases};
write('modules/catalog.internal.json',JSON.stringify(inventory,null,2)+'\n');
const published=selectPublicCatalog(inventory,json('library/selection.json'));
write('library/catalog.json',JSON.stringify(published,null,2)+'\n');
buildMaterialGuides(root,published);
console.log('Built selected library: '+published.wallpapers.length+' train wallpapers, '+published.materials.length+' categorized materials; development inventory retained separately.');
