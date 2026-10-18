import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {moduleSource} from './module-sources.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8'),src=moduleSource;
const write=(p,s)=>{mkdirSync(dirname(resolve(root,p)),{recursive:true});writeFileSync(resolve(root,p),s)};
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const slider=(key,label)=>'<label>'+label+'<input data-setting="'+key+'" type="range" min="0" max="2" value="1" step="0.1"><output>1.0</output></label>';
export function buildBlueModulePreviews(){
 const common=src('common.glsl'),train=src('train.glsl'),world=src('world.glsl'),cloud=src('cloud.glsl');
 const main=body=>'\nvoid main(){vec2 p=vec2(gl_FragCoord.x/uRes.x*ASPECT,gl_FragCoord.y/uRes.y);vec3 c;'+body+'gl_FragColor=vec4(c,1.); }\n';
 const examples=[
 ['sky/blue-gradient',common+main('c=sky(p);'),'蓝天渐变与局部亮区','独立天空函数；固定世界坐标，无外部贴图。'],
 ['clouds/sdf-cumulus-r01',common+read('modules/clouds/sdf-cumulus-r01/source.glsl')+main('c=cloudBank(p,sky(p),uTime);'),'R01 椭圆积云','历史程序路线，便于比较形状和光色，不代表参考图已还原。'],
 ['clouds/billow-clusters-r02',common+read('modules/clouds/billow-clusters-r02/source.glsl')+main('c=cloudBank(p,sky(p),uTime);'),'R02 双尺度球冠簇','历史程序路线，固定种子球冠构图实验；不保证持续续接，球状体积感也与参考平涂画风不同。'],
 ['clouds/svg-flat-masks-r03',common+cloud+main('c=cloudBank(p,sky(p),uTime);'),'R03 四层平涂云','启动时将矢量路径转为四通道遮罩；保留被山体截断的下缘。'],
 ['terrain/noise-ridges',common+read('modules/terrain/noise-ridges/source.glsl')+main('c=mountains(p,sky(p),uTime);'),'三层噪声山脊','独立山体函数；移动时观察各层轮廓和速度。'],
 ['train/blue-locomotive-sdf',common+train+main('vec2 q=vec2((.40-p.x)/2.65,(p.y-.29)/2.65);c=over(vec3(.66,.82,.88),locomotive(q,uTime));'),'蓝天机车与联动轮轴','放大固定机位，仅显示列车；车轮相位来自行进距离。'],
 ['train/world-puffs',common+train+main('c=over(vec3(.19,.40,.57),steam(p,uTime));'),'世界空间烟团','单独观察烟团；出生位置来自过去时刻的烟囱，而非当前车头。'],
 ['foreground/edge-noise-shrubs',common+read('modules/foreground/edge-noise-shrubs/source.glsl')+main('c=over(vec3(.25,.45,.55),foreground(p,uTime));'),'早期两侧噪声树丛','历史轮廓实验，保留为程序植被的适用范围对照。'],
 ['bridge/simple-arch-bridge',common+read('modules/bridge/simple-arch-bridge/source.glsl')+main('vec2 q=(p-vec2(ASPECT*.5,.5))/2.5+vec2(ASPECT*.5,.32);c=over(vec3(.25,.45,.55),bridge(q,uTime));'),'早期石拱桥','桥体放大观察，不含湖面及列车。'],
 ['water/shared-scene-reflection',common+cloud+train+world+src('main.glsl'),'同场景实时倒影','倒影需要地上场景作为输入。本例保留完整上半部供对齐检查，并去除近景。']
 ];
 const result={};
 for(const [id,shader,title,note]of examples){
  const needsMasks=id==='clouds/svg-flat-masks-r03'||id==='water/shared-scene-reflection';
  const config={id,mode:id.startsWith('water/')?2:0,...(needsMasks?{cloudPatterns:JSON.parse(read('assets/blue-sky-train/vector/cloud-patterns.json'))}:{})};
  const values={TITLE:title,SUMMARY:note,NOTE:note,CONTROLS:slider('speed','前进')+slider('wind','风速')+(id.startsWith('water/')?slider('ripple','水波'):''),CONFIG:JSON.stringify(config),FRAGMENT:JSON.stringify(shader),RUNTIME:(needsMasks?src('cloud-mask.js')+'\n':'')+src('runtime.js')};
  const html=src('example.html.template').replace(/%%([A-Z_]+)%%/g,(_,k)=>values[k]??'').replace('href="../index.html">返回 TA 方案','href="../../../library/index.html#'+id+'">返回模块库');
  write('modules/'+id+'/preview.html',html);result[id]={kind:id.startsWith('water/')?'scene-context':'isolated',engine:'TALab'};
 }
 const assetRevision=JSON.parse(read('library/selection.json')).revision;
 const assetViews={'clouds/complete-cloud-stream-r04':'clouds','terrain/valley-distance-r05':'mountains','bridge/blue-stone-lighting':'bridge','foreground/generated-foliage-r09':'foreground','motion/blue-stream-parallax':'motion'};
 for(const [id,mode]of Object.entries(assetViews)){
  write('modules/'+id+'/preview.html',wrapper(id,'../../../themes/blue-sky-train/lab/cloud-library.html?module='+mode+'&v='+encodeURIComponent(assetRevision),'共享素材宿主 · '+(mode==='motion'?'完整场景中的视差关系':'独立图层预览')));
  result[id]={kind:mode==='motion'?'scene-context':'isolated',engine:'CloudLibrary',frame:true};
 }
 const related={'foreground/procedural-grass-r08':'../../../themes/blue-sky-train/lab/history/r08-foreground/cloud-library.html','water/svg-local-ripple':'../../../themes/blue-sky-train/index.html?controls=1','train/svg-steam-loop':'../../../themes/blue-sky-train/index.html?controls=1'};
 for(const[id,url]of Object.entries(related)){write('modules/'+id+'/preview.html',wrapper(id,url,'关联案例预览 · 此方法依赖完整原画或历史运行时'));result[id]={kind:'scene-context',engine:'linked',frame:true};}
 return result;
}
function wrapper(id,url,note){return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(id)+' · 模块预览</title><style>body{margin:0;background:#101c28;color:#c8dde8;font:14px/1.7 system-ui}header{display:flex;gap:24px;justify-content:space-between;padding:14px 22px}a{color:#abdfee}iframe{width:100%;height:calc(100vh - 60px);border:0}body.embedded{overflow:hidden}body.embedded header{display:none}body.embedded iframe{height:100vh;display:block} @media(max-width:650px){header{font-size:12px}}</style><header><span>'+esc(note)+'</span><a href="../../../library/index.html#'+id+'">返回模块库</a></header><iframe title="'+esc(id)+'动态预览" src="'+url+'"></iframe><script>if(new URLSearchParams(location.search).has("embed")){document.body.classList.add("embedded");const frame=document.querySelector("iframe");const src=new URL(frame.src);src.searchParams.set("embed","1");frame.src=src.href;}</script></html>'}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(buildBlueModulePreviews());
