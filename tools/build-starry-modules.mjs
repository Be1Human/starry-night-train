import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ORIGINAL='themes/starry-night-train/index.html';
const LICENSE='原星河云算法移植自 mdb shader，上游未附再分发许可。沿用原声明：仅供学习与欣赏，请勿商用。各模块仍需阅读原主题来源说明。';
const read=p=>readFileSync(resolve(ROOT,p),'utf8');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function functionRange(text,signature,last=false){
  const start=last?text.lastIndexOf(signature):text.indexOf(signature);
  if(start<0)throw Error('Missing source function: '+signature);
  const brace=text.indexOf('{',start);let depth=1,end=brace+1;
  while(depth&&end<text.length){if(text[end]==='{')depth++;if(text[end]==='}')depth--;end++;}
  if(depth)throw Error('Unclosed source function: '+signature);
  return {start,end,text:text.slice(start,end)};
}
function sourceFunction(text,name){
  const match=new RegExp('(?:float|vec[234]|void)\\s+'+name+'\\s*\\(').exec(text);
  if(!match)throw Error('Missing source function name: '+name);
  return functionRange(text,match[0]).text;
}
function sourceBlock(text,start,end){
  const a=text.indexOf(start),b=text.indexOf(end,a+start.length);
  if(a<0||b<a)throw Error('Missing source section: '+start);
  return text.slice(a,b).trimEnd();
}
const SPECS=[
 {category:'sky',id:'starry-galaxy',title:'星河、闪星与流星',kind:'isolated-with-host',section:['// ---------- 天空 ----------','// ---------- 云：'],controls:['stars','twinkle','milky','meteor'],
  map:['gPx=uRes.y;gPxS=uRes.y;','vec2 p=vec2(s.x,mix(uHorizon,1.12,s.y));'],render:'vec3 col=sky(p);',dependencies:['hash / fbm / sstep','uNoise及星空色板','gC / gPxS与原宿主']},
 {category:'clouds',id:'starry-layered-heightfield',title:'星河 12 层噪声云',kind:'isolated-with-host',section:['// ---------- 云：','// ---------- 远岸与灯光 ----------'],controls:['cloudCover','cloudStack','amplitude'],
  map:['gPx=uRes.y*uZoom;gPxS=uRes.y*sqrt(uZoom);','vec2 p=(s-gC)/uZoom+gC+vec2(0.,uCamY);'],camera:true,render:'vec4 layer=clouds(p);vec3 col=mix(mix(cSkyHor,cSkyTop,clamp(p.y,0.,1.)),layer.rgb,layer.a);',dependencies:['gFog / CLD / BAND','uCloudTex(1024×1024) / uNMin / uNMax / uCL[12]','原云来源与使用限制']},
 {category:'terrain',id:'starry-far-shore',title:'夜间远岸与城镇灯光',kind:'isolated-with-host',section:['// ---------- 远岸与灯光 ----------','// ---------- 石拱桥 ----------'],controls:['glow'],
  map:['gPx=uRes.y*3.;gPxS=uRes.y;','vec2 p=vec2((s.x-gC.x)/3.+gC.x,uHorizon+(s.y-.30)/3.);'],render:'vec4 layer=farShore(p);vec3 col=mix(vec3(.14,.18,.30),layer.rgb,layer.a)+gGlow;',dependencies:['noise / hash / sstep','gGlow / gPx / uFarOff / uHorizon','原宿主色板']},
 {category:'train',id:'starry-locomotive-sdf',title:'星河列车与车窗灯光',kind:'isolated-with-host',section:['// ---------- 列车 ----------','// ---------- 蒸汽 ----------'],controls:['cars','win','glow'],
  map:['float len=.14+uCars*.126;float z=min(4.2,(uRes.x/uRes.y)*.84/(len+.12));','gPx=uRes.y*z;gPxS=gPx;','vec2 p=vec2((s.x-gC.x)/z+uTrainX-len*.48,(s.y-.47)/z+DECK+.022);'],render:'vec4 layer=train(p);vec3 col=mix(vec3(.18,.22,.33),layer.rgb,layer.a)+gGlow;',dependencies:['PAINT / sdBox / hash','gGlow / uTrainX / uWheel / uCars / DECK','原宿主色板与行进状态']},
 {category:'train',id:'original-starry-steam',title:'原始星河连续烟带',kind:'isolated-with-host',functions:['noise','fbmB','steam'],controls:['steam'],
  map:['float len=.3+.45*uSteam;float z=min(4.,(uRes.x/uRes.y)*.82/(len+.10));','gPx=uRes.y*z;gPxS=gPx;','vec2 ch=vec2(uTrainX-.02,DECK+.051);vec2 p=vec2((s.x-gC.x)/z+ch.x-len*.46,(s.y-.43)/z+ch.y+.06);'],render:'vec4 layer=steam(p);vec3 col=mix(vec3(.12,.18,.29),layer.rgb,layer.a);',dependencies:['noise / fbmB / uNoise(256×256) / uOct','uSteam / uSmokeOff / uT / uTrainX / DECK / 烟色板','展示星河原烟；蓝天 R10 适配未因此自动获得验收']},
 {category:'water',id:'starry-perspective-reflection',title:'同场景水面反射',kind:'scene-context',functions:['main'],controls:['ripple','refl','horizon'],camera:true,dependencies:['完整 scene() 与各图层','原 main 同时含镜头、水面和后期','原宿主时间和噪声纹理']},
 {category:'foreground',id:'starry-silhouette-poles',title:'树丛、电线杆与垂线',kind:'isolated-with-host',section:['// ---------- 近景：树丛、电线杆 ----------','// ---------- 合成：'],controls:[],
  map:['gPx=uRes.y/.55;gPxS=gPx;','vec2 p=vec2(s.x,uHorizon+(s.y-.12)*.55);'],render:'vec4 layer=fore(p);vec3 col=mix(vec3(.27,.30,.44),layer.rgb,layer.a);',dependencies:['landMask / hash / noise','gPx / uFore / uHorizon / cFore','原宿主近景积分状态']},
 {category:'bridge',id:'starry-arch-bridge',title:'石拱桥与前层护栏',kind:'isolated-with-host',section:['// ---------- 石拱桥 ----------','// ---------- 列车 ----------'],controls:[],
  map:['gPx=uRes.y*2.4;gPxS=gPx;','vec2 p=vec2(s.x,DECK+(s.y-.62)/2.4);'],render:'vec4 layer=bridge(p);vec3 col=mix(vec3(.27,.30,.44),layer.rgb,layer.a);layer=railing(p);col=mix(col,layer.rgb,layer.a);',dependencies:['noise / hash / sstep','DECK / gPx / uCamX / 桥色板','桥体与护栏分别合成']},
 {category:'motion',id:'starry-wrapped-camera',title:'共享镜头与周期积分',kind:'scene-context',functions:['main'],controls:['speed'],camera:true,dependencies:['完整场景与原 main 的相机变换','JS advance(dt,aspect)、M、CLOUD_DIST 保留在完整宿主','source.glsl仅为原GLSL主函数，不能单独代表JS运动系统']},
 {category:'clouds',id:'starry-round-clouds',title:'历史多尺度圆云实验',kind:'historical-scene',source:'themes/starry-night-train/experiments/round-clouds.html',functions:['hash12','hash32','smin','vnoise','fbm','cloudWarp','crestAt','evalScale','cloudLayer'],dependencies:['该实验原宿主与原uniform声明','预览保留历史整景，不声称独立云模块']},
 {category:'clouds',id:'starry-puffy-scene',title:'历史圆云整图实验',kind:'historical-scene',source:'themes/starry-night-train/experiments/train-puffy-experiment-1792078486188.html',functions:['hash2','vnoise','smin','cloudEnv','evalDomeCluster','evalCloudLayer','clouds'],dependencies:['星河实验原宿主和原uniform声明','预览保留历史整景，不替换正式星河主题']},
];
function shaderOf(html){
  const marker='const FRAG = '+String.fromCharCode(96),a=html.indexOf(marker);
  if(a<0)throw Error('Original FRAG block was not found');
  const start=a+marker.length,end=html.indexOf(String.fromCharCode(96)+';',start);
  if(end<0)throw Error('Original FRAG closing marker was not found');
  return {start,end,text:html.slice(start,end)};
}
function isolatedMain(spec){
  return ['void main(){','vec2 s=gl_FragCoord.xy/uRes.y;gC=.5*uRes/uRes.y;',...spec.map,'gGlow=vec3(0.);',spec.render,'col*=uExposure;float lum=dot(col,vec3(.299,.587,.114));col=max(mix(vec3(lum),col,uSat),0.);','gl_FragColor=vec4(clamp(col,0.,1.),1.);','}'].join('\n');
}
function sourceFor(spec,text){
  let code;
  if(spec.section)code=sourceBlock(text,...spec.section);
  else code=spec.functions.map(name=>name==='main'?functionRange(text,'void main()',true).text:sourceFunction(text,name)).join('\n\n');
  const note=['// Generated extraction; edit the original implementation and rebuild.','// Source: '+(spec.source||ORIGINAL),'// '+LICENSE,'// This is an exact source excerpt, not a standalone shader.','// Dependencies: '+spec.dependencies.join('; ')];
  if(spec.id==='starry-perspective-reflection'||spec.id==='starry-wrapped-camera')note.push('// Original main is preserved with camera, reflection and postprocessing together.');
  return note.join('\n')+'\n\n'+code+'\n';
}
function historicalPreview(spec){
  const target='../../../'+spec.source;
  return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(spec.title)+'</title><style>html{color-scheme:dark}body{margin:0;background:#0c1220;color:#dbe5f8;font:15px/1.6 system-ui}header{padding:18px 24px}h1{margin:0;font-size:22px}p{margin:6px 0;color:#a9b9cd}a{color:#8bdaee}iframe{display:block;width:100%;height:calc(100vh - 170px);min-height:420px;border:0;background:#090c19}</style><header><h1>'+esc(spec.title)+'</h1><p>历史整景预览：保留当时的构图、桥梁与宿主；这里没有把它伪装为独立云组件。</p><p><a href="../../../library/index.html">返回模块库</a> · <a href="source.glsl">查看提取源码</a> · <a href="'+target+'">打开原实验</a></p><p>'+esc(LICENSE)+'</p></header><iframe title="'+esc(spec.title)+'原实验" src="'+target+'"></iframe></html>\n';
}
function originalHostPreview(spec,original){
  const frag=shaderOf(original);let shader=frag.text;
  if(spec.kind==='isolated-with-host'){
    const oldMain=functionRange(shader,'void main()',true);
    shader=shader.slice(0,oldMain.start)+isolatedMain(spec)+shader.slice(oldMain.end);
  }
  let html=original.slice(0,frag.start)+shader+original.slice(frag.end);
  html=html.replace('<title>星河夜行列车</title>','<title>'+spec.title+' · 方法预览</title>');
  html=html.replace('<h1>星河夜行列车</h1>','<h1>'+spec.title+'</h1>');
  html=html.replace('星河列车设置','方法参数');
  html=html.replaceAll('starry-night-train:v2','module:'+spec.id+':v1').replaceAll('starry-night-train:v1','module:'+spec.id+':legacy');
  html=html.replace('const S = normalize(saved);','Object.assign(DEFAULTS,{zoom:1,camY:0,auto:false,fps:30});\nconst S = normalize(new URLSearchParams(location.search).has("embed") ? DEFAULTS : saved);');
  const fallback=functionRange(html,'function startFallback(reason)');
  html=html.slice(0,fallback.start)+'function startFallback(reason){renderer=null;console.error(reason);showNotice("该方法需要 WebGL，预览未启动："+reason); }'+html.slice(fallback.end);
  const caption=spec.kind==='scene-context'?'完整场景语境：用于观察倒影或镜头的共同变化。':'单元素展示：保留原星河宿主与 shader 依赖，当前只绘制所选方法。';
  const nav='<nav class="module-links"><a href="../../../library/index.html">模块库</a><a href="source.glsl">源码</a><a href="../../../'+ORIGINAL+'">原主题</a><span>'+caption+'</span></nav>';
  const style='<style>.module-links{position:fixed;left:14px;bottom:12px;z-index:4;display:flex;gap:10px;flex-wrap:wrap;max-width:calc(100vw - 320px);padding:7px 10px;background:#10172de6;border:1px solid #58648166;border-radius:8px;font-size:12px}.module-links a{color:#96deef}.module-links span{flex-basis:100%;color:#bdcadb}body.ui-hidden .module-links{display:none}@media(max-width:640px){.module-links{max-width:calc(100vw - 28px);bottom:auto;top:70px}.module-links span{max-width:90vw}#panel{width:248px;max-height:55vh}header p{max-width:90vw}}</style>';
  html=html.replace('</head>',style+'</head>').replace('<body>','<body>'+nav).replace('<aside id="panel">','<aside id="panel" class="collapsed">');
  const allowed=[...new Set(['speed','scale','detail','fps','exposure','saturation',...spec.controls,...(spec.camera?['zoom','camY']:[])])];
  const meta={id:spec.id,previewKind:spec.kind,source:ORIGINAL,dependencies:spec.dependencies};
  const hook=['','// Generated module preview adapter; source theme remains unchanged.','if(new URLSearchParams(location.search).has("embed"))document.body.classList.add("ui-hidden");','const moduleAllowed=new Set('+JSON.stringify(allowed)+');','for(const [key] of SLIDERS){if(!moduleAllowed.has(key))document.getElementById("ctl-"+key).closest(".row").style.display="none";}','for(const group of Object.values(groups)){if(!Array.from(group.querySelectorAll(".row")).some(row=>row.style.display!=="none"))group.style.display="none";}','window.StarryModulePreview={...'+JSON.stringify(meta)+',get state(){return {ready:!!renderer?.gl,webgl:!!renderer?.gl,notice:notice.hidden?null:notice.textContent,time:M.t,settings:{...S},resolution:[canvas.width,canvas.height],glError:renderer?.gl?.getError()??null};},','setSettings(patch){Object.assign(S,normalize({...S,...patch}));applyPixelClass();syncUI();resetClock();request();},','renderAt(time){if(!renderer?.gl)throw Error("WebGL preview unavailable");Object.assign(M,{t:0,camX:0,fore:0,far:37,smoke:0,trainX:null,wheel:0,cl:[32.5,30,27.5,23,20.5,18,18,15.5,12,9.5,7,3.5]});S.paused=false;const [w,h]=targetSize();canvas.width=w;canvas.height=h;advance(Math.max(0,Number(time)||0),w/h);S.paused=true;resetClock();renderer.draw(w,h);syncUI();return this.state;}};'].join('\n');
  const close=html.lastIndexOf('</script>');
  return html.slice(0,close)+hook+'\n'+html.slice(close);
}
export function buildStarryModules(){
  const original=read(ORIGINAL),results=[];
  for(const spec of SPECS){
    const source=spec.source?read(spec.source):original;
    const directory='modules/'+spec.category+'/'+spec.id;mkdirSync(resolve(ROOT,directory),{recursive:true});
    writeFileSync(resolve(ROOT,directory,'source.glsl'),sourceFor(spec,source));
    writeFileSync(resolve(ROOT,directory,'preview.html'),spec.kind==='historical-scene'?historicalPreview(spec):originalHostPreview(spec,original));
    results.push({id:spec.id,path:directory,previewKind:spec.kind,source:spec.source||ORIGINAL,dependencies:spec.dependencies});
  }
  return results;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify({generated:buildStarryModules(),validation:'生成完成；此命令未运行浏览器验收。'},null,2));
