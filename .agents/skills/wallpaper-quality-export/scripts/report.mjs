import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { args, root } from '../../layered-wallpaper/scripts/project.mjs';

export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const n=(value,digits=1)=>Number.isFinite(value)?value.toFixed(digits):'未测';
export function writeReport(r,out) {
  const e=escapeHTML,p=r.performance,c=r.comparison,passed=r.status==='passed'&&r.release?.status!=='failed';
  const title=passed?'本次浏览器验收通过':r.status==='running'?'验收进行中':'本次还有项目未通过';
  const comparison=c?`已核对 ${r.evidence.shots.length} 个固定画面；${c.mismatches.length} 个画面不同。${c.compatible?'浏览器与采样条件相同。':'测量环境或采样条件不同，不能作为无损优化的有效对照。'}`:'这份报告是当前版本的基线，尚未证明优化前后完全一致。';
  const optimization=c?(c.codeChanged?(c.meaningfulCpuGain?'样本显示提交时间下降；请结合连续播放和多轮复测判断收益。':'已比较代码修改；本轮没有证明稳定的性能收益。'):'前后源码相同；数值波动不算优化成果。'):'这份报告记录当前画面及性能，未做保持画面不变的优化前后比较。';
  const posterFile=resolve(out,r.evidence?.shots?.find(x=>x.id==='scene-1')?.file||'scene-1.png');
  const poster=existsSync(posterFile)?'data:image/png;base64,'+readFileSync(posterFile).toString('base64'):null;
  const bench=r.evidence?.benchmarks||[];
  const cards=[
    ['每帧提交时间',p?n(p.worstCpuP95)+' ms':'未测','取各镜头较慢的 P95：约 95% 的样本不超过它。只含 JS / Canvas 提交时间。'],
    ['最慢一组的播放帧率',p?n(p.lowestFps)+' fps':'未测',`取两轮、三个镜头中较低的一组。目标为 ${n(r.method.target,0)} fps。`],
    ['画面对照',c?(c.effectGatePassed?'样本一致':'未通过'):'已保存基线',comparison],
  ];
  const checks=r.evidence?.checks||{};
  const checkRows=[['同一地点往返，画面能复现',checks.revisit],['烟、云、水面和枝叶都在活动',checks.animations?Object.values(checks.animations).every(Boolean):undefined],
    ['左右行进方向正常',checks.bothDirections],['宿主暂停时冻结画面',checks.hostPause],['测量期间源码与素材没有变化',checks.sourceStable],
    ['没有浏览器或 WebGL 错误',checks.consoleErrors?checks.consoleErrors.length===0&&checks.webglErrors?.shore===0&&checks.webglErrors?.steam===0:undefined],
    ['性能达到本次设定的门槛',p?.passed],
    ...(c?[['固定帧与素材、分辨率等效果约束一致',c.effectGatePassed]]:[]),
    ...(r.release?.checks||[]).map(x=>[x.label,x.passed]),
  ];
  const percent=p?Math.min(100,p.worstCpuP95/p.budgetMs*100):0;
  const exportText=r.release?(r.release.status==='passed'?'离线文件已通过断网加载和宿主接口检查，可以将 package 文件夹导入 Wallpaper Engine。':'导出未获验收；保留日志和报告供修复，生成的检查文件不作为交付包。'):'本报告没有执行离线导出。使用验收导出命令完成后，报告会增加导出结果。';
  const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>动态壁纸 · 性能验收报告</title>
  <style>
  :root{font-family:system-ui,"Microsoft YaHei",sans-serif;color:#183448;background:#edf4f7;font-size:16px}*{box-sizing:border-box}body{margin:0}main{max-width:1120px;margin:auto;padding:40px 24px 60px}header{margin-bottom:24px}.eyebrow{font-size:12px;font-weight:750;letter-spacing:2px;color:#537486}h1{font-size:clamp(27px,4vw,40px);line-height:1.25;margin:10px 0 16px}h2{font-size:21px;margin:0 0 16px}h3{font-size:16px;margin:0 0 12px}p{line-height:1.8;margin:8px 0;color:#496171}.badge{display:inline-block;padding:6px 12px;border-radius:100px;background:${passed?'#d8f2df':'#fff0d7'};color:${passed?'#24633a':'#815317'};font-size:13px;font-weight:700}.meta{font-size:13px}.poster{width:100%;aspect-ratio:8/3;object-fit:cover;border-radius:18px;display:block;margin:24px 0}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.card,section{background:#fff;border:1px solid #dce7ed;border-radius:18px;padding:24px}.metric{display:block;font-size:30px;font-weight:750;margin:12px 0;color:#123f59}.card p{font-size:13px}section{margin-top:18px}.bar{height:18px;background:#e4edf2;border-radius:9px;overflow:hidden;margin:18px 0 8px}.fill{height:100%;background:${p?.passed?'#30a58d':'#e4aa46'};width:${percent}%}.bar-label{display:flex;justify-content:space-between;font-size:13px;color:#496171}.checks{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:12px}.checks li{background:#f5f8fa;border-radius:10px;padding:14px;font-size:14px;line-height:1.6}.icon{font-weight:800;margin-right:8px}.yes{color:#247a53}.no{color:#a65c23}.unknown{color:#708590}.comparison{display:flex;gap:32px;flex-wrap:wrap;background:#f4f8fa;border-radius:12px;padding:18px;margin-top:14px}.comparison b{display:block;font-size:25px;margin-top:8px}details{border-top:1px solid #e2eaf0;margin-top:16px;padding-top:16px}summary{cursor:pointer;font-weight:650}dl{display:grid;grid-template-columns:120px 1fr;gap:10px 16px;font-size:13px;line-height:1.65}dt{color:#6d8190}dd{margin:0;overflow-wrap:anywhere}.runs{display:grid;gap:8px;margin-top:14px}.run{background:#f3f7f9;border-radius:8px;padding:12px;font-size:13px}ul{line-height:1.85;padding-left:22px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}a{color:#126685;text-decoration:none}.actions a{display:block;padding:12px 18px;border:1px solid #bfd3df;border-radius:9px;font-weight:650}.warn{border-left:4px solid #dd9b36;padding-left:14px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;background:#f3f6f8;padding:16px;border-radius:10px}@media(max-width:760px){main{padding:24px 16px}.cards,.checks{grid-template-columns:1fr}.card,section{padding:20px}.poster{aspect-ratio:16/9}dl{grid-template-columns:85px 1fr}}
  </style><main><header><div class="eyebrow">WALLPAPER / QUALITY REPORT</div><h1>${e(title)}</h1><span class="badge">${passed?'已通过本次自动检查':'需要检查 · 暂不作为验收完成'}</span><p>${e(optimization)}</p><p class="meta">测试时间 ${e(r.date)} · 本机浏览器 · 目标 ${n(r.method.target,0)} fps</p></header>
  ${poster?`<img class="poster" src="${poster}" alt="本次测试的真实壁纸画面">`:''}
  <div class="cards">${cards.map(([label,value,description])=>`<article class="card"><h3>${e(label)}</h3><strong class="metric">${e(value)}</strong><p>${e(description)}</p></article>`).join('')}</div>
  <section><h2>它运行起来够不够轻松？</h2><p>目标 ${n(r.method.target,0)} 帧时，每帧约有 ${p?n(p.budgetMs,2):'未测'} 毫秒。下面只展示代码提交画面的时间；显卡处理和最终显示还需要时间。</p><div class="bar"><div class="fill"></div></div><div class="bar-label"><span>较慢样本的提交时间 ${p?n(p.worstCpuP95,2):'未测'} ms</span><span>整帧预算 ${p?n(p.budgetMs,2):'未测'} ms</span></div>
  <p class="meta">本次通过门槛：提交时间 P95 不超过帧预算的 80%，每组平均帧率至少为目标的 90%，帧间隔 P95 不超过预算的 1.6 倍。保留部分余量给显卡与系统。</p>
  ${c?`<div class="comparison"><div>基线平均提交<b>${n(c.baselineCpuMean,2)} ms</b></div><div>本次平均提交<b>${n(p?.cpuMean,2)} ms</b></div><div>本轮差异<b>${n(Math.abs(c.cpuChangePercent))}% ${c.cpuChangePercent>=0?'减少':'增加'}</b></div></div><p class="meta">前后数字只在相同浏览器、显卡、采样方式下比较。短时波动不能证明代码优化；收益至少 5% 且 P95 不变差时才标为样本收益。</p>`:''}
  </section><section><h2>画面与动画有没有被牺牲？</h2><p>验收保持原有素材、场景尺寸、种子、水波、倒影、植物和蒸汽。固定帧要求像素完全一致；效果有变化时，应当作为美术修改重新验收，不能记为无损优化。</p><ul class="checks">${checkRows.map(([name,pass])=>`<li><span class="icon ${pass===undefined?'unknown':pass?'yes':'no'}">${pass===undefined?'○':pass?'✓':'!'}</span>${e(name)}</li>`).join('')}</ul>
  <details><summary>看固定画面的检查范围</summary><p>${e(comparison)}</p><div class="runs">${(r.evidence?.shots||[]).map(s=>`<a class="run" href="${e(s.file)}">${e(s.id)} · 位置 ${s.camera} · 时刻 ${s.time} 秒${s.layer?' · 独立层 '+e(s.layer):' · 完整场景'}</a>`).join('')}</div>${c?.mismatches.length?`<p class="warn">不同的样本：${e(c.mismatches.join('、'))}</p>`:''}</details></section>
  <section><h2>导出结果</h2><p>${e(exportText)}</p>${r.release?.status==='passed'?'<p>交付文件：package/index.html、project.json、preview.png。双击 index.html 可离线预览；加 ?controls=1 可打开设置。</p>':''}<p class="meta">原生 Wallpaper Engine 的实际安装、宿主性能和音乐听感仍需在使用电脑上确认。</p><div class="actions"><a href="audit.json" download>下载详细测量数据</a>${r.release?.status==='passed'?'<a href="package/index.html">打开离线壁纸</a>':''}</div></section>
  <section><h2>这份报告测了什么，还没测什么？</h2><dl><dt>浏览器</dt><dd>${e(r.environment?.browser||'未测')}</dd><dt>显卡渲染器</dt><dd>${e(r.environment?.renderer||'未测')}</dd><dt>画面尺寸</dt><dd>显示窗口 ${e(r.method.viewport.join(' × '))}；内部绘制 ${e(r.method.canvas.join(' × '))}</dd><dt>测量份数</dt><dd>三个镜头，各 ${r.method.trials} 轮；每轮预热 ${r.method.warmup} 帧，再记录 ${r.method.samples} 帧。</dd><dt>素材缓存估算</dt><dd>${bench.length?n(bench[0].textureBytes/1048576)+' MiB（仅运行时统计的素材与部分缓冲，不是总显存）':'未测'}</dd></dl><ul>${r.limitations.map(x=>`<li>${e(x)}</li>`).join('')}</ul>
  <details><summary>查看各镜头数据与下一步</summary><div class="runs">${bench.map(x=>`<div class="run">位置 ${x.camera} · 第 ${x.trial+1} 轮：平均 ${n(x.fps)} fps；提交 P95 ${n(x.cpu.p95,2)} ms；帧间隔 P95 ${n(x.interval.p95,2)} ms；岸线 GPU ${n(x.shoreGpu?.mean,2)} ms；蒸汽 GPU ${n(x.steamGpu?.mean,2)} ms。</div>`).join('')}</div><p class="meta">GPU 数字是对应 pass 最近完成的计时读数，可能重复，不能相加当作整帧 GPU 耗时。未测表示浏览器未提供可靠读数。</p><p>${p?.passed?'本次达到设定门槛。继续优化应先定位可测量的瓶颈；没有可靠收益时保留当前实现。':'先确认使用真实显卡、关闭其他重负载任务，再复测。若仍未通过，定位重复工作或资源分配，不要通过关效果或降低画质达标。'}</p></details>
  ${r.error?`<details open><summary>检查停止的位置</summary><pre>${e(r.error)}</pre></details>`:''}</section><p class="meta">本报告由仓库自带的 wallpaper-quality-export skill 生成，断网也可阅读。源码与测量数据一同保存，便于复核。</p></main></html>`;
  writeFileSync(resolve(out,'report.html'),html);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const o=args();if(!o.input)throw Error('请提供 --input 验收目录');const out=resolve(root,String(o.input));writeReport(JSON.parse(readFileSync(resolve(out,'audit.json'),'utf8')),out);
}
