import {moduleSource, syncModuleMirrors} from './module-sources.mjs';
syncModuleMirrors();
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import './build-cloud-patterns.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lab=resolve(root,'themes/blue-sky-train/lab');
const revision='r03';
const digest=value=>createHash('sha256').update(value).digest('hex');
const source=moduleSource;
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const slider=(key,label)=>`<label>${label}<input data-setting="${key}" type="range" min="0" max="2" value="1" step="0.1"><output>1.0</output></label>`;
const camera='<label>镜头<select data-setting="follow"><option value="1">跟车</option><option value="0">定机位</option></select></label>';
const debug='<label>分层显示<select data-setting="debug"><option value="0">完整 · 四层平涂</option><option value="4">1 · 白色外轮廓</option><option value="5">2 · 加浅蓝内层</option><option value="6">3 · 加中蓝内层</option><option value="2">色块掩膜</option><option value="1">轮廓覆盖</option></select></label>';
const common=source('common.glsl'),cloud=source('cloud.glsl'),train=source('train.glsl'),world=source('world.glsl');
const cloudPatterns=JSON.parse(readFileSync(resolve(root,'assets/blue-sky-train/vector/cloud-patterns.json'),'utf8'));
const configs=[
  {id:'cloud',mode:0,title:'最小案例 A · 扁平色块积云 R03',summary:'白色外轮廓 → 浅蓝内层 → 中蓝内层 → 局部深蓝；每层保持平涂。',controls:slider('wind','风速')+slider('detail','边缘细节')+debug,
   note:'轮廓来自原图的 SVG 描摹，整理成内嵌矢量路径。启动时生成四层遮罩，运行时用代码驱动平移与微变形。下缘保留原图山体遮挡线。',
   shader:common+cloud+'\nvoid main(){vec2 p=vec2(gl_FragCoord.x/uRes.x*ASPECT,gl_FragCoord.y/uRes.y);gl_FragColor=vec4(cloudBank(p,sky(p),uTime),1.);}'},
  {id:'train',mode:1,title:'最小案例 B · 列车、轮轴与蒸汽',summary:'独立局部坐标、SDF 构件、按行进里程旋转的车轮、世界空间烟团。',controls:slider('speed','行进速度')+slider('wind','烟的风速'),
   note:'这是放大后的固定机车观察镜头，移动量体现在轮子和连杆上。切到组合样片的定机位，可观察车身从画面通过。',
   shader:common+train+'\nvoid main(){vec2 p=vec2(gl_FragCoord.x/uRes.x*ASPECT,gl_FragCoord.y/uRes.y);vec2 q=vec2((.40-p.x)/2.65,(p.y-.29)/2.65);vec3 c=over(mix(vec3(.86,.92,.92),vec3(.66,.82,.88),p.y),locomotive(q,uTime));c=mix(c,vec3(.2,.35,.4),mask(abs(p.y-.28)-.006));vec2 w=vec2(headAt(uTime)-cameraAt(uTime)-q.x,DECK+q.y);c=over(c,steam(w,uTime));gl_FragColor=vec4(c,1.);}'},
  {id:'water',mode:2,title:'最小案例 C · 同时刻的水面反射',summary:'共用同一个场景函数，按水线镜像并叠加深度相关的波纹。',controls:slider('speed','行进速度')+slider('ripple','水波')+camera+'<label>辅助线<select data-setting="debug"><option value="0">关闭</option><option value="3">显示水线</option></select></label>',
   note:'镜头切到定机位并把水波设为 0，检查列车与倒影的横坐标。此案例省略近景框景，便于观察完整倒影。',shader:common+cloud+train+world+source('main.glsl')},
  {id:'scene',mode:3,title:'组合样片 · 蓝天列车运动骨架',summary:'云场、视差山体、列车、桥、蒸汽、水面与前景，共享一套时空。',controls:slider('speed','行进速度')+slider('wind','风速')+slider('ripple','水波')+camera,
   note:'R03 云层改为外白内深的扁平色块。山体、列车和植被沿用运动样片，仍需继续对齐参考图。',shader:common+cloud+train+world+source('main.glsl')}
];
mkdirSync(resolve(lab,'examples'),{recursive:true});
for(const config of configs){
  const values={TITLE:config.title,SUMMARY:config.summary,CONTROLS:config.controls,NOTE:config.note,CONFIG:JSON.stringify({mode:config.mode,id:config.id,...(config.id==='train'?{}:{cloudPatterns})}),FRAGMENT:JSON.stringify(config.shader),RUNTIME:source('cloud-mask.js')+'\n'+source('runtime.js')};
  const html=source('example.html.template').replace(/%%([A-Z_]+)%%/g,(_,key)=>values[key]??'');
  writeFileSync(resolve(lab,'examples',config.id+'.html'),html);
}
const reportPath=resolve(lab,'evidence/report.json');
const currentReport=existsSync(reportPath)?JSON.parse(readFileSync(reportPath)):null;
const reportMatches=currentReport?.revision===revision&&Object.entries(currentReport.sourceSha256??{}).every(([file,hash])=>digest(source(file))===hash)&&currentReport.assetSha256===digest(readFileSync(resolve(root,'assets/blue-sky-train/vector/cloud-patterns.json')));
let evidence='<strong>浏览器验证待运行。</strong> 本页会在测试完成后记录实测结果、画布分辨率、渲染后端和限制。';
if(reportMatches){
  const report=currentReport;
  evidence=`<strong>${report.status==='passed'?'本轮浏览器检查通过':'本轮存在待修复项'}</strong><br>${escape(report.checks.length)} 项检查；渲染器：${escape(report.renderer)}。<br>检查覆盖：${escape(report.checks.join('；'))}。<br><span class="small">${escape(report.limitations.join('；'))}</span><div class="actions"><a href="evidence/report.json">查看完整报告</a><a href="evidence/scene-t8.png">查看样片实测截图</a></div>`;
  const metrics=Object.entries(report.cases).filter(([,c])=>Array.isArray(c.resolution)).map(([id,c])=>`<tr><td>${escape(id)}</td><td>${c.resolution.join(' × ')}</td><td>${c.measuredFps.toFixed(1)}</td><td>${c.cpuSubmitMs.toFixed(3)} ms</td><td>${c.gpuMs===null?'未测':c.gpuMs.toFixed(3)+' ms'}</td></tr>`).join('');
  evidence+=`<p class="small">以下为本次无头浏览器约 1.4 秒短窗口记录（${escape(report.observedAt)}），只用于证明测量接口工作，不代表长时稳定性能或发布规格。</p><div class="table-wrap"><table><thead><tr><th>案例</th><th>内部画布</th><th>短窗 FPS</th><th>CPU 提交</th><th>最近有效 GPU 样本</th></tr></thead><tbody>${metrics}</tbody></table></div>`;
}
let cloudMetrics='本轮像素快照待重新捕获。';
const pixelReport=resolve(lab,'evidence/r03/pixel-metrics.json');
if(existsSync(pixelReport)){
  const pixel=JSON.parse(readFileSync(pixelReport));
  if(pixel.revision===revision&&Object.entries(pixel.sha256??{}).every(([path,hash])=>existsSync(resolve(root,path))&&digest(readFileSync(resolve(root,path)))===hash)){
    const a=pixel.metrics.r02,b=pixel.metrics.r03;
    cloudMetrics=`R02 → R03，同一 2048 × 768 云区，t = 0：轮廓交并比 ${(a.cloudIoU*100).toFixed(2)}% → ${(b.cloudIoU*100).toFixed(2)}%；RGB 均差 ${a.unionRgbMAE.toFixed(2)} → ${b.unionRgbMAE.toFixed(2)} / 255。R03 直接复用参考 SVG 的轮廓，几何误差降低不代表纯程序生成能力提升；本轮检查的是轮廓保真和四层平涂。`;
  }
}
const replacements={CLOUD_CODE:escape(cloud),CLOUD_MASK_CODE:escape(source('cloud-mask.js')),TRAIN_CODE:escape(train),WORLD_CODE:escape(world),EVIDENCE:evidence,CLOUD_METRICS:escape(cloudMetrics)};
writeFileSync(resolve(lab,'index.html'),source('plan.html.template').replace(/%%([A-Z_]+)%%/g,(_,key)=>replacements[key]??''));
writeFileSync(resolve(lab,'cloud-compare.html'),source('compare.html.template').replace('%%COMPARE_JS%%',source('compare.js')));
console.log('Built TA design HTML and 4 standalone WebGL examples.');
