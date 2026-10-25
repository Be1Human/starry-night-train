import {readFileSync,writeFileSync,existsSync,statSync} from 'node:fs';
import {resolve,relative,dirname,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {root,args,outputPath,freshDir,hash} from './project.mjs';

const o=args();
if(o.help){console.log('build-navigation.mjs --breakdown 项目内拆解目录或index.html --out 新导航目录 [--scene 新主题ID]');process.exit(0);}
if(typeof o.breakdown!=='string')throw Error('请提供已完成的拆解文档：--breakdown 目录或 index.html');
const input=o.breakdown.startsWith('file:')?fileURLToPath(o.breakdown):resolve(root,o.breakdown);
const base=statSync(input).isDirectory()?input:dirname(input);
const projectPath=p=>relative(root,p).replaceAll('\\','/');
function contained(base,path){const target=resolve(base,path),local=relative(base,target);if(isAbsolute(local)||local==='..'||local.startsWith('..'+sep))throw Error('路径超出所属目录：'+path);return target;}
contained(root,relative(root,base));
const m=JSON.parse(readFileSync(resolve(base,'manifest.json'),'utf8'));
if(!Number.isFinite(m.width)||!Number.isFinite(m.height)||!Array.isArray(m.layers)||!m.layers.length||!Array.isArray(m.repairRegions))throw Error('拆解清单缺少画幅、图层或补绘范围；先补齐拆解交接数据');
const source=contained(base,m.source.file);if(hash(readFileSync(source))!==m.source.sha256)throw Error('原图校验不一致');
const sceneId=o.scene||'ta-'+m.source.sha256.slice(0,8);if(typeof sceneId!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sceneId))throw Error('新主题 ID 应为小写字母/数字与连字符');
const plannedTargets={sceneId,caseDirectory:'cases/'+sceneId,workbenchEntry:'themes/'+sceneId+'/lab/layered-stream/index.html',state:'proposed-not-created'};
const ids=new Set();
for(const l of m.layers){
  if(ids.has(l.id)||![l.x,l.y,l.width,l.height,l.z].every(Number.isFinite)||!Array.isArray(l.pivotSource)||!Array.isArray(l.pivotLocal))throw Error('图层数据不完整或 ID 重复：'+l.id);ids.add(l.id);
  if(hash(readFileSync(contained(base,l.file)))!==l.sha256)throw Error('图层文件校验不一致：'+l.id);
  if(l.x<0||l.y<0||l.x+l.width>m.width||l.y+l.height>m.height)throw Error('图层超出原画坐标：'+l.id);
}
for(const r of m.repairRegions)for(const id of r.layers)if(!ids.has(id))throw Error('补绘范围引用了缺失图层：'+id);
const implementation='cases/blue-sky-layered/';
const groups=[
  {id:'sky',label:'天空与高空细节',layers:['sky','wisps','contrail'],files:['renderer.js','world.mjs'],symbols:['InfiniteScene.sky','WORLD'],assets:[],actions:['保留本图色板；先补齐云后天空，再允许独立云移位。']},
  {id:'clouds',label:'大积云',layers:['cloud-left','cloud-center','cloud-right'],files:['flat-clouds.js','renderer.js','world.mjs'],symbols:['prepareFlatCloud','cloudInstances','FlatCloudField.draw','InfiniteScene.cloudLayer'],assets:['assets/blue-sky-train/clouds/r17/cloud-crown.png','assets/blue-sky-train/clouds/r17/cloud-ribbon.png','assets/blue-sky-train/clouds/r17/cloud-fan.png'],actions:['源层是连通云群片段；修复重叠边与云后负形后才独立移动。','已有完整云形是画风/算法候选，不能默默替换参考图构图。']},
  {id:'terrain',label:'远山与中景林坡',layers:['mountains','hill-back','forest-left','forest-right','bank-shrubs'],files:['renderer.js','world.mjs'],symbols:['InfiniteScene.terrainStrip','InfiniteScene.clusterLayer','InfiniteScene.foothillLayer','InfiniteScene.treeLayer','MOUNTAINS','MIDGROUND'],assets:['assets/blue-sky-train/layered-stream/r20/mountain-haze.png','assets/blue-sky-train/layered-stream/r11/wooded-ridge.png','assets/blue-sky-train/layered-stream/r01/low-shrub.png'],actions:['等比保持山形；按本图重设位置与层次。','林坡和山脚树丛共享世界相位；补齐桥/列车/近树背后的远景。']},
  {id:'bridge',label:'桥梁与轨道',layers:['bridge-arches','bridge-deck'],files:['renderer.js','world.mjs'],symbols:['InfiniteScene.repeated','visibleCells'],assets:['assets/blue-sky-train/layered-stream/r01/bridge-deck.png','assets/blue-sky-train/layered-stream/r01/bridge-piers.png'],actions:['桥面/桥墩作为刚体共用相位；先补连续桥面与列车旧位置，再允许平移。']},
  {id:'train',label:'列车与运行部件',layers:['engine','coach','coupling','engine-leading-wheels','engine-driving-wheels','engine-rod','coach-bogie-front','coach-bogie-rear','windows'],files:['renderer.js','world.mjs'],symbols:['TRAIN','trainPose','InfiniteScene.train'],assets:[],actions:['保留拆解图的机车、客车、连接件和坐标；不复制旧 TRAIN.parts 的车厢数量。','轮组/连杆只是局部片段，完整轮周和车体遮挡面未补齐前保持静态。']},
  {id:'steam',label:'烟根与动态烟带',layers:['steam'],files:['starry-steam.js','renderer.js','world.mjs'],symbols:['StarrySteam.render','trainPose','InfiniteScene.steam'],assets:[],actions:['只把明确的烟根作为烟囱连接依据；不要把远云整片归为烟。','复用原烟 Shader，按本图烟囱重设锚点和朝向，同时修复旧烟根露底。']},
  {id:'shore',label:'草岸与水陆衔接',layers:['shore'],files:['procedural-shore.js','renderer.js','world.mjs'],symbols:['ProceduralShore.setContacts','ProceduralShore.render','InfiniteScene.shoreLayer'],assets:['assets/blue-sky-train/layered-stream/r13/shore.png'],actions:['沿本图起伏岸线设置新坐标；旧 Shader 的具体 y 常数只作实现参考。','需要山脚材质融合时保持山体不透明，与水面共用边界遮罩。']},
  {id:'water',label:'湖面与选择性反射',layers:['water','reflection-forest','reflection-bridge','water-strokes'],files:['renderer.js'],symbols:['InfiniteScene.water','InfiniteScene.paintWater','InfiniteScene.waterSurface'],assets:[],actions:['本图水底片含烘焙云山反射；不能再叠一份实时反射造成重复。','没有独立列车反射裁片；需要时明确重建来源与锚点，不能声称已提取。']},
  {id:'foreground',label:'近景枝干、叶冠与底部植物',layers:['fg-left-trunks','fg-left-crown','fg-left-bough','fg-left-base','fg-bottom','fg-right-trunks','fg-right-crown','fg-right-bough','fg-right-base'],files:['foreground.js','renderer.js','world.mjs'],symbols:['ForegroundVegetation','InfiniteScene.nearLayer','randomAt','visibleCells'],assets:['assets/blue-sky-train/foliage/r17/canopy-atlas.png','assets/blue-sky-train/foliage/r09/understory.png'],actions:['依据本图父级/支点绑定；先补树后湖面、草岸和叶簇连接边，再做根部风摆。','已有图集只作兼容候选，保持本图框景与叶片尺度。']},
];
const stageDefs=[
  ['S00','读取拆解和导航',[],[],['source、manifest、原文档与证据都可读取；记录原画和旧案例的差异。']],
  ['S10','原坐标静态重组',['S00'],[],['逐层按 x/y、scale=1、Z 合成，与 source 比较；零差异只标记静态通过。']],
  ['S20','补齐已选择动作的资源缺口',['S10'],m.repairRegions.map(r=>r.id),['补绘/重建另存，关联原图层和遮罩；受影响动作保持待完成，其他工作可继续。']],
  ['S30','世界数据、刚体连接与视差',['S10','S20'],[],['按本图数量/坐标绑定对象；确定性种子、往返重现、画外保护区与等比山形。']],
  ['S40','烟、风、水与反射依赖',['S30'],[],['时间与旅行分离；烟囱/叶根连接稳定；水面不重复反射；暂停与方向一致。']],
  ['S50','规范工作台网页',['S10'],[],['复用现有四视图、图层侧栏、播放控制和素材下载；目标入口真实可用。']],
  ['S60','目标适配、性能验收与导出',['S40','S50'],[],['使用 wallpaper-quality-export，适配本图对象/入口后检查；未测项目如实标记。']],
];
const seen=new Set();
const routes=groups.map(g=>{
  const matched=g.layers.filter(id=>ids.has(id));matched.forEach(id=>seen.add(id));
  const files=g.files.map(f=>implementation+f);files.forEach(f=>{if(!existsSync(resolve(root,f)))throw Error('复用入口不存在：'+f);});
  return {...g,layers:matched,referenceCode:files,candidateAssets:g.assets.filter(f=>existsSync(resolve(root,f))),mappingStatus:'candidate-requires-review',actions:g.actions};
}).filter(g=>g.layers.length);
for(const l of m.layers)if(!seen.has(l.id))routes.push({id:'unmapped-'+l.id,label:l.name,layers:[l.id],referenceCode:[],symbols:[],candidateAssets:[],mappingStatus:'needs-routing',actions:['先明确本图层的实现入口与依赖，再启用运动。']});
const routeFor=id=>routes.find(r=>r.layers.includes(id));
const nav={schemaVersion:1,kind:'breakdown-to-implementation-navigation',status:'plan-only',generatedAt:new Date().toISOString(),
  goal:'先完成并读取拆解，再把拆解文档和 layered-wallpaper skill 一起交给模型，按导航复用实现。',
  breakdown:{directory:projectPath(base),document:projectPath(resolve(base,'index.html')),manifest:projectPath(resolve(base,'manifest.json')),source:projectPath(source),sourceSha256:m.source.sha256,width:m.width,height:m.height,layerCount:m.layers.length,repairCount:m.repairRegions.length,staticVerification:m.verification,limitations:m.limitations},
  authority:{composition:'本次拆解的 source 与 manifest',implementation:'项目旧案例仅为复用参考',coordinates:m.coordinates,sourceBodyLayers:{engine:m.layers.filter(l=>l.id==='engine').map(l=>l.id),coaches:m.layers.filter(l=>l.id==='coach'||/^coach-\d+$/.test(l.id)).map(l=>l.id)},staticZIsRuntimeRig:false,extractedFragmentsAreMotionReady:false,allRepairsCompleted:false},
  readFirst:['navigation/implementation-navigation.json','manifest.json','index.html','handoff.json'].map(f=>({path:projectPath(resolve(base,f)),purpose:f==='index.html'?'按需浏览，避免把内嵌图片 base64 整份输入模型':'读取结构化交接数据'})),
  targets:{...plannedTargets,workbenchContract:'.agents/skills/layered-wallpaper/references/workbench-contract.md',skill:'.agents/skills/layered-wallpaper/SKILL.md',qualitySkill:'.agents/skills/wallpaper-quality-export/SKILL.md',workbenchTemplate:'themes/blue-sky-train/lab/layered-stream/index.html',newSceneRequired:true,overwriteReferenceCase:false},
  runtimeGroups:routes,
  layers:m.layers.map(l=>{const route=routeFor(l.id);return{id:l.id,name:l.name,sourceFile:projectPath(contained(base,l.file)),sha256:l.sha256,rect:[l.x,l.y,l.width,l.height],z:l.z,parent:l.parent,pivotSource:l.pivotSource,pivotLocal:l.pivotLocal,extractionStatus:l.status,missing:l.missing,repairIds:m.repairRegions.filter(r=>r.layers.includes(l.id)||(r.maskIds||[]).includes(l.id)).map(r=>r.id),runtimeGroup:route.id,referenceCode:route.referenceCode,plannedTargetConfig:plannedTargets.caseDirectory+'/world.mjs',readyForIndependentMotion:false};}),
  repairs:m.repairRegions.map(r=>({...r,maskFile:projectPath(contained(base,r.maskFile)),status:'not-completed'})),
  implementationOrder:stageDefs.map(([id,title,dependsOn,repairIds,doneWhen])=>({id,title,dependsOn,repairIds,doneWhen,status:'planned',...(id==='S20'?{repairSelection:'enabled-actions-only',mayContinue:['static-recomposition','workbench','unaffected-bindings']}:{} )})),
  checks:{sourceAndLayerHashes:'passed',sourceLayersCovered:m.layers.length,unknownRoutes:routes.filter(g=>g.mappingStatus==='needs-routing').map(g=>g.id),motionImplemented:false,performanceMeasured:false},
  modelPrompt:'先读取随附拆解文档与 implementation-navigation.json，再使用 $layered-wallpaper。以本次拆解的构图、对象、坐标与缺口为准，按导航复用已有代码和合适素材；先完成静态重组和所启用动作的资源修复，再实现规范工作台。不得把计划、静态一致性或旧案例运行结果当作本图已完成。'};
const out=outputPath(o.out,projectPath(resolve(base,'navigation')));freshDir(out);
nav.readFirst[0].path=projectPath(resolve(out,'implementation-navigation.json'));
writeFileSync(resolve(out,'implementation-navigation.json'),JSON.stringify(nav,null,2)+'\n');
writeFileSync(resolve(out,'index.html'),page(nav,out));
console.log(`✓ 实现导航：${resolve(out,'index.html')}\n✓ 模型输入：${resolve(out,'implementation-navigation.json')}\n${m.layers.length} 个源图层 / ${routes.length} 个实现分组；只生成导航，未补绘或接入动画。`);

function page(n,out){
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const link=p=>relative(out,resolve(root,p)).replaceAll('\\','/');
  const skill=readFileSync(resolve(root,n.targets.skill),'utf8').replace(/^---[\s\S]*?---\s*/,'');
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>拆解 → Skill · 实现导航</title><style>*{box-sizing:border-box}body{margin:0;color:#173a4c;background:#edf3f7;font:15px/1.75 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1450px;margin:auto;padding:36px 32px 60px}header{margin-bottom:24px}h1{font-size:34px;margin:8px 0}h2{font-size:23px;margin:0 0 14px}h3{margin:0 0 10px;font-size:18px}p{color:#587083}a{color:#1674a2;text-decoration:none}.tag{font-size:12px;letter-spacing:2px;color:#47818e}.hero,.panel{background:white;border:1px solid #d6e3eb;border-radius:16px;padding:24px;margin-bottom:20px}.hero img{display:block;width:100%;border-radius:10px}.stats{display:flex;gap:26px;flex-wrap:wrap;margin-top:16px}.stats b{font-size:25px;color:#166f96}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.buttons{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0}.buttons a{padding:10px 14px;border:1px solid #c7dae5;border-radius:8px;background:#fff}.stage{padding:16px 20px;border:1px solid #dae5eb;border-radius:10px;margin:12px 0}.stage span{font-size:12px;color:#5b8a9e}.stage p{margin:6px 0}.route{padding:18px 0;border-top:1px solid #e2eaf0}.route code{font-size:12px;overflow-wrap:anywhere}.route small{color:#778e9c}.warning{border-left:4px solid #d4a16a;padding:12px 16px;background:#f9f5ed;border-radius:4px;color:#785b3d}.layers{display:grid;gap:8px}.layer{display:grid;grid-template-columns:110px 1fr;align-items:center;gap:16px;border:1px solid #deeaef;border-radius:9px;padding:12px}.layer img{max-width:110px;max-height:70px;object-fit:contain;background:#e4edf3}.layer p{margin:3px 0;font-size:12px}.layer code{font-size:11px;overflow-wrap:anywhere}pre{font:13px/1.8 ui-monospace,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere;background:#f4f8fa;border-radius:10px;padding:20px;max-height:760px;overflow:auto}.prompt{white-space:pre-wrap;padding:20px;background:#e8f3f7;border-radius:10px}ul{padding-left:20px}section{scroll-margin-top:24px}@media(max-width:800px){main{padding:22px 14px}.columns{grid-template-columns:1fr}h1{font-size:27px}.panel,.hero{padding:18px}}</style><main><header><div class="tag">BREAKDOWN → IMPLEMENTATION</div><h1>先拆解，再使用 Skill</h1><p>拆解文档提供本图的事实，Skill 提供项目的复用方法；实现导航将两者连接。当前仍为计划，未补绘、未接入动态场景。</p></header><section id="overview" class="hero"><img src="${e(link(n.breakdown.source))}" alt="本次拆解原图"><div class="stats"><span><b>${n.breakdown.layerCount}</b> 个原图可见图层</span><span><b>${n.runtimeGroups.length}</b> 个实现分组</span><span><b>${n.breakdown.repairCount}</b> 组待处理缺口</span></div><div class="buttons"><a href="${e(link(n.breakdown.document))}">原始拆解文档</a><a href="implementation-navigation.json" download>给模型的导航 JSON</a><a href="${e(link(n.breakdown.manifest))}">精确图层清单</a></div><p class="warning">原位重组一致 ≠ 可以直接独立运动。裁片只是源图可见部分；源图中的对象数量、构图与坐标优先于旧运行案例。</p></section><div class="columns"><section id="order" class="panel"><h2>实现顺序</h2>${n.implementationOrder.map(s=>`<article class="stage"><span>${e(s.id)} · ${e(s.dependsOn.join(' → ')||'起点')} · planned</span><h3>${e(s.title)}</h3>${s.doneWhen.map(x=>`<p>${e(x)}</p>`).join('')}</article>`).join('')}</section><section id="reuse" class="panel"><h2>图层对应到哪些实现</h2>${n.runtimeGroups.map(g=>`<article class="route"><h3>${e(g.label)}</h3><small>${e(g.layers.join(' · '))}</small><p>${g.referenceCode.map(p=>`<code>${e(p)}</code>`).join('<br>')}<br><code>${e(g.symbols.join(' / '))}</code></p><ul>${g.actions.map(x=>`<li>${e(x)}</li>`).join('')}</ul></article>`).join('')}</section></div><section id="skill" class="panel"><h2>项目中的 Layered Wallpaper Skill</h2><p>实现时同时提供拆解包与本 skill；不从裸参考图跳到套模板。</p><pre>${e(skill)}</pre></section><section id="handoff" class="panel"><h2>交给模型</h2><div class="prompt">${e(n.modelPrompt)}</div><div class="buttons"><a href="implementation-navigation.json" download>implementation-navigation.json</a><a href="${e(link(n.breakdown.document))}">index.html · 拆解文档</a></div></section><section id="layers" class="panel"><h2>源图层到实现分组</h2><div class="layers">${n.layers.map(l=>`<article class="layer"><img src="${e(link(l.sourceFile))}" alt="${e(l.name)}"><div><b>${e(l.name)}</b><p>Z ${l.z} · ${e(l.rect.join(', '))} · ${e(l.parent)} → ${e(l.runtimeGroup)}</p><code>${e(l.sourceFile)}</code><p>${e(l.missing)} · ${e(l.repairIds.join(' / '))} · 尚未验证独立运动</p></div></article>`).join('')}</div></section></main></html>`;
}
