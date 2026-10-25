import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { browserHarness, until } from '../../../../tools/browser-harness.mjs';
import { root, entry, args, freshDir, outputPath, runId, fingerprint, runtimeFiles, assetFiles, WORLD, MATERIALS, SCENE_LAYERS, hash } from '../../layered-wallpaper/scripts/project.mjs';
import { writeReport } from './report.mjs';

export const PROFILE_VERSION=1;
export const shots=[
  ...[0,-530,15200,-7072,12345678,-12345678].map((camera,i)=>({id:'scene-'+i,camera,time:8})),
  {id:'reverse',camera:-530,time:8,direction:1},
  {id:'other-seed',camera:15200,time:8,seed:137},
  ...['clouds','steam','water','branches'].flatMap(layer=>[8,14].map(time=>({id:layer+'-'+time,camera:-530,time,layer}))),
  {id:'ground-contact',camera:-530,time:8,layer:'shore'},
  {id:'opaque-hills',camera:-530,time:8,layer:'rail-hills'},
];
const summary=values=>{
  const a=values.filter(Number.isFinite).sort((x,y)=>x-y);
  return a.length?{count:a.length,mean:a.reduce((s,x)=>s+x,0)/a.length,p50:a[Math.floor((a.length-1)*.5)],p95:a[Math.ceil(a.length*.95)-1],max:a.at(-1)}:null;
};
const setState=shot=>`(()=>{const a=LayeredWallpaper;a.pause(true);a.view('scene');
  for(const id of Object.keys(a.state.visibility))a.state.visibility[id]=true;
  Object.assign(a.state,{seed:${shot.seed||42},cloudSeed:${shot.seed||42},direction:${shot.direction||-1},speed:1,ripple:true,wind:true,guides:false,hostPaused:false});
  ${shot.layer?`a.select(${JSON.stringify(shot.layer)});a.view('single');`:''}
  a.renderAt(${shot.camera},${shot.time});a.renderAt(${shot.camera},${shot.time});})()`;

// Read a separate canvas: never switch the production Canvas2D raster backend
// with willReadFrequently or instrument render calls inside the timed section.
const capture=`(async()=>{const source=document.getElementById('scene'),c=document.createElement('canvas');
  c.width=source.width;c.height=source.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);
  const bytes=ctx.getImageData(0,0,c.width,c.height).data;
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
  return{pixelHash:digest,png:c.toDataURL('image/png')};})()`;
const waitFrames=n=>`new Promise(resolve=>{let n=${n};const step=()=>--n<=0?resolve():requestAnimationFrame(step);requestAnimationFrame(step);})`;

export async function audit({out,baseline=null,samples=90,target=60}={}) {
  if(!Number.isInteger(samples)||samples<30||samples>240)throw Error('samples 应为 30..240');
  if(!Number.isFinite(target)||target<1||target>60)throw Error('当前案例为 60 fps 播放器，target 应为 1..60');
  freshDir(out);
  const report={schema:PROFILE_VERSION,date:new Date().toISOString(),status:'running',
    method:{samples,warmup:20,trials:2,target,viewport:[1920,1080],canvas:[WORLD.width,WORLD.height],
      timing:'真实播放器 rAF；CPU 仅记录原有 scene.stats.renderMs；GPU 仅岸线与蒸汽两个 pass',readback:'仅固定帧阶段读取独立 Canvas，性能阶段不截屏'},
    evidence:{shots:[],checks:{},benchmarks:[],sourceHashes:fingerprint([...runtimeFiles,...assetFiles])},
    comparison:null,release:null,limitations:[
      '这是本机 Chromium 的短时浏览器验收，不代表原生 Wallpaper Engine、长时间稳定性或其他显卡的结果。',
      '1920×1080 是显示窗口；场景实际绘制为 2048×768，报告没有测量原生 4K 渲染。',
      'CPU 数字是 JavaScript/Canvas 提交时间；没有测量整帧 GPU、系统 CPU 占用、功耗或完整显存占用。',
      '固定帧对照只覆盖列出的镜头、种子、图层与时刻；还需要观看连续播放确认整体观感。',
      '自动浏览器静音，音乐解码与暂停检查不能替代人工试听。',
    ]};
  let b;
  try{
    const prior=baseline?JSON.parse(readFileSync(resolve(baseline,'audit.json'),'utf8')):null;
    if(prior){
      if(prior.schema!==PROFILE_VERSION||!['passed','failed'].includes(prior.status))throw Error('基线格式不兼容或基线未执行完成');
      for(const shot of shots){
        const saved=prior.evidence?.shots?.find(x=>x.id===shot.id);
        if(!saved||!/^[0-9a-f]{64}$/.test(saved.pixelHash)||typeof saved.file!=='string')throw Error('基线固定帧缺失：'+shot.id);
        const image=resolve(baseline,saved.file),local=relative(resolve(baseline),image);
        if(isAbsolute(local)||local==='..'||local.startsWith('..'+sep)||!readFileSync(image).subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('基线图像路径或文件无效：'+shot.id);
      }
    }
    b=await browserHarness();await b.viewport(1920,1080);
    const version=await b.send('Browser.getVersion');
    await b.go(`${b.base}${entry}?wallpaper=1&paused=1`);
    await until(()=>b.evaluate('Boolean(window.LayeredWallpaper?.state.ready)'),'壁纸初始化');
    report.environment=await b.evaluate(`(()=>{const a=LayeredWallpaper,s=a.scene,g=s.shore.gl,ext=g.getExtension('WEBGL_debug_renderer_info');return{
      userAgent:navigator.userAgent,platform:navigator.platform,hardwareConcurrency:navigator.hardwareConcurrency,
      renderer:ext?g.getParameter(ext.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),
      shoreBackend:s.shore.stats.backend,steamBackend:s.smoke.backend,canvas:[s.canvas.width,s.canvas.height]};})()`);
    report.environment.browser=version.product;
    report.environment.softwareRenderer=/swiftshader|llvmpipe|software/i.test(report.environment.renderer);
    report.effects={world:WORLD,materials:MATERIALS,layers:SCENE_LAYERS,assets:fingerprint(assetFiles),
      buffers:await b.evaluate('({steam:[LayeredWallpaper.scene.smoke.canvas.width,LayeredWallpaper.scene.smoke.canvas.height],clouds:LayeredWallpaper.stats.clouds,shore:LayeredWallpaper.scene.shore.stats.resolution})')};
    // Compare stable contracts only. Timing/cache statistics in buffers are descriptive.
    report.effectsHash=hash(JSON.stringify({world:WORLD,materials:MATERIALS,layers:SCENE_LAYERS,assets:report.effects.assets,canvas:report.environment.canvas,
      steam:report.effects.buffers.steam,shore:report.effects.buffers.shore}));
    for(const shot of shots){
      await b.evaluate(setState(shot));
      const image=await b.evaluate(capture),file=shot.id+'.png';
      writeFileSync(resolve(out,file),Buffer.from(image.png.split(',')[1],'base64'));
      report.evidence.shots.push({...shot,file,pixelHash:image.pixelHash});
    }
    await b.evaluate(setState(shots[0]));const replay=(await b.evaluate(capture)).pixelHash;
    report.evidence.checks.revisit=report.evidence.shots[0].pixelHash===replay;
    report.evidence.checks.animations=Object.fromEntries(['clouds','steam','water','branches'].map(layer=>[layer,
      report.evidence.shots.find(x=>x.id===layer+'-8').pixelHash!==report.evidence.shots.find(x=>x.id===layer+'-14').pixelHash]));
    await b.evaluate(setState(shots[1]));
    await b.evaluate('wallpaperPropertyListener.setPaused(true);LayeredWallpaper.pause(false)');
    const frozen=await b.evaluate('JSON.stringify({c:LayeredWallpaper.state.camera,t:LayeredWallpaper.state.time,w:LayeredWallpaper.state.windTime,f:LayeredWallpaper.stats.frames})');
    await b.evaluate(waitFrames(12));
    report.evidence.checks.hostPause=frozen===await b.evaluate('JSON.stringify({c:LayeredWallpaper.state.camera,t:LayeredWallpaper.state.time,w:LayeredWallpaper.state.windTime,f:LayeredWallpaper.stats.frames})');
    const directions=[];
    for(const direction of [-1,1]){
      await b.evaluate(`LayeredWallpaper.pause(true);wallpaperPropertyListener.setPaused(false);LayeredWallpaper.direction(${direction});LayeredWallpaper.renderAt(0,8);LayeredWallpaper.pause(false)`);
      await b.evaluate(waitFrames(18));
      directions.push((await b.evaluate('LayeredWallpaper.state.camera'))*direction>0);
    }
    report.evidence.checks.bothDirections=directions.every(Boolean);
    await b.evaluate('LayeredWallpaper.pause(true)');
    // Real frame delivery is measured separately from CPU submission time.
    for(const camera of [0,-530,15200])for(let trial=0;trial<2;trial++){
      await b.evaluate(setState({camera,time:8}));
      const result=await b.evaluate(`new Promise((resolve,reject)=>{const a=LayeredWallpaper,rows=[];let last=a.stats.frames,lastAt=null,warmup=20,attempts=0;
        const timeout=setTimeout(()=>{a.pause(true);reject(Error('性能采样超时'));},14000);
        a.pause(false);function collect(now){if(++attempts>5000){clearTimeout(timeout);a.pause(true);reject(Error('没有收集到足够的真实帧'));return;}
          if(a.stats.frames!==last){last=a.stats.frames;if(warmup>0){warmup--;lastAt=now;}else{
            rows.push({cpu:a.stats.renderMs,interval:now-lastAt,shoreGpu:a.scene.shore.gpuMs,steamGpu:a.scene.smoke.gpuMs,instances:a.stats.instances,textureBytes:a.stats.textureBytes});lastAt=now;}}
          if(rows.length>=${samples}){clearTimeout(timeout);a.pause(true);resolve(rows);}else requestAnimationFrame(collect);}
        requestAnimationFrame(collect);})`);
      const cpu=summary(result.map(x=>x.cpu)),interval=summary(result.map(x=>x.interval));
      report.evidence.benchmarks.push({camera,trial,cpu,interval,fps:1000/interval.mean,
        shoreGpu:summary(result.map(x=>x.shoreGpu)),steamGpu:summary(result.map(x=>x.steamGpu)),
        maxInstances:Math.max(...result.map(x=>x.instances)),textureBytes:result[0].textureBytes});
    }
    report.evidence.checks.consoleErrors=[...b.errors];
    report.evidence.checks.webglErrors=await b.evaluate('({shore:LayeredWallpaper.scene.shore.gl.getError(),steam:LayeredWallpaper.scene.smoke.gl?.getError()??null})');
    report.evidence.checks.sourceStable=JSON.stringify(report.evidence.sourceHashes)===JSON.stringify(fingerprint([...runtimeFiles,...assetFiles]));
    const checks=report.evidence.checks;
    report.functionalPassed=checks.revisit&&checks.hostPause&&checks.bothDirections&&Object.values(checks.animations).every(Boolean)&&
      !checks.consoleErrors.length&&checks.webglErrors.shore===0&&checks.webglErrors.steam===0&&checks.sourceStable&&
      report.environment.shoreBackend==='WebGL2'&&report.environment.steamBackend==='WebGL2';
    const benches=report.evidence.benchmarks,budget=1000/target;
    report.performance={budgetMs:budget,worstCpuP95:Math.max(...benches.map(x=>x.cpu.p95)),lowestFps:Math.min(...benches.map(x=>x.fps)),
      worstIntervalP95:Math.max(...benches.map(x=>x.interval.p95)),cpuMean:benches.reduce((s,x)=>s+x.cpu.mean,0)/benches.length,
      passed:false};
    report.performance.passed=!report.environment.softwareRenderer&&report.performance.worstCpuP95<=budget*.8&&report.performance.lowestFps>=target*.9&&report.performance.worstIntervalP95<=budget*1.6;
    if(prior){
      const compatible=prior.environment?.browser===report.environment.browser&&prior.environment?.renderer===report.environment.renderer&&
        JSON.stringify(prior.method)===JSON.stringify(report.method);
      const mismatches=report.evidence.shots.filter(s=>prior.evidence.shots.find(x=>x.id===s.id)?.pixelHash!==s.pixelHash).map(x=>x.id);
      const contractSame=prior.effectsHash===report.effectsHash;
      const percent=prior.performance?.cpuMean?100*(prior.performance.cpuMean-report.performance.cpuMean)/prior.performance.cpuMean:null;
      const codeChanged=runtimeFiles.some(path=>prior.evidence.sourceHashes[path]!==report.evidence.sourceHashes[path]);
      report.comparison={baseline:resolve(baseline),compatible,contractSame,mismatches,pixelIdentical:!mismatches.length,codeChanged,baselineCpuMean:prior.performance?.cpuMean,
        effectGatePassed:compatible&&contractSame&&!mismatches.length,
        cpuChangePercent:percent,meaningfulCpuGain:codeChanged&&compatible&&contractSame&&!mismatches.length&&percent>=5&&report.performance.worstCpuP95<=prior.performance.worstCpuP95};
    }
    report.status=report.functionalPassed&&report.performance.passed&&(!report.comparison||report.comparison.effectGatePassed)?'passed':'failed';
  }catch(error){report.status='error';report.error=error.stack||String(error);}
  finally{if(b)await b.close();}
  writeFileSync(resolve(out,'audit.json'),JSON.stringify(report,null,2)+'\n');writeReport(report,out);
  console.log(`${report.status==='passed'?'✓':'✗'} 壁纸验收：${report.status} · ${resolve(out,'report.html')}`);
  return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const o=args();if(o.help){console.log('audit.mjs [--out 项目内新目录] [--baseline 先前验收目录] [--samples 90] [--target 60]');}
  else{const report=await audit({out:outputPath(o.out,'docs/verification/wallpaper-quality-'+runId()),baseline:o.baseline?resolve(root,String(o.baseline)):null,samples:Number(o.samples||90),target:Number(o.target||60)});if(report.status!=='passed')process.exitCode=1;}
}
