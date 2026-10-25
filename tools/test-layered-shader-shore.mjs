import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {browserHarness,root,until} from './browser-harness.mjs';
const out=resolve(root,process.env.LAYERED_VERIFICATION_DIR||'docs/verification/layered-stream-r14');mkdirSync(out,{recursive:true});
const b=await browserHarness(),report={date:new Date().toISOString(),checks:{}};
try{
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,o){return get.call(this,t,t==='2d'?{...o,willReadFrequently:true}:o);};})()`});
  await b.go(`${b.base}/themes/blue-sky-train/lab/layered-stream/index.html?paused=1`);await until(()=>b.evaluate('Boolean(window.LayeredWallpaper?.state.ready)'),'GPU coast');
  report.checks.backend=await b.evaluate(`(()=>{const s=LayeredWallpaper.scene.shore,d=LayeredWallpaper.scene.assets['shore-paint'],p=d.image.getContext('2d').getImageData(0,0,d.width,d.height).data;let minimumAlpha=255;for(let i=3;i<p.length;i+=4)minimumAlpha=Math.min(minimumAlpha,p[i]);return{...s.stats,version:s.gl.getParameter(s.gl.VERSION),error:s.gl.getError(),paintSample:[d.width,d.height],minimumAlpha,oldBankAssetPresent:Boolean(LayeredWallpaper.scene.assets.shore)};})()`);
  const g=report.checks.backend;assert.match(g.version,/WebGL 2/);assert.equal(g.error,0);assert.equal(g.oldBankAssetPresent,false);assert.deepEqual(g.paintSample,[1952,16]);assert(g.minimumAlpha>=240,'only opaque brush colours, without the old outline, enter the shader');
  report.checks.world=await b.evaluate(`(()=>{
    const api=LayeredWallpaper,ctx=api.scene.ctx,read=()=>ctx.getImageData(0,528,2048,88).data;
    const frame=(camera,time=8)=>{api.renderAt(camera,time);return read();};
    const delta=(a,b)=>{let sum=0,changed=0;for(let p=0;p<a.length;p++){const d=Math.abs(a[p]-b[p]);sum+=d;if(d)changed++;}return{mean:sum/a.length,changed};};
    const profile=data=>{const edges=[];let empty=0,holes=0,bodyHoles=0;for(let x=0;x<2048;x++){let first=0,last=87;while(first<88&&data[(first*2048+x)*4+3]<128)first++;while(last>=0&&data[(last*2048+x)*4+3]<128)last--;if(last<first)empty++;edges.push(last+528);for(let y=first+2;y<last-2;y++)if(data[(y*2048+x)*4+3]<250)holes++;for(let y=552;y<560;y++)if(data[((y-528)*2048+x)*4+3]<250)bodyHoles++;}return{edges,empty,holes,bodyHoles,minimumY:Math.min(...edges),maximumY:Math.max(...edges)};};
    api.select('shore');api.view('single');const samples=[];
    for(const camera of [-12345678,-4096,-2048,0,976,2048,4096,15200,12345678]){const p=profile(frame(camera));delete p.edges;samples.push({camera,...p});}
    const original=frame(0),edge=profile(original).edges,periods=[];
    for(const distance of [323,976,1952,2048,4096]){const a=frame(distance),p=profile(a);periods.push({distance,colour:delta(original,a),meanEdgeDifference:p.edges.reduce((s,y,x)=>s+Math.abs(y-edge[x]),0)/2048});}
    frame(12345678);frame(-12345678);const replay=delta(original,frame(0));
    const time=delta(original,frame(0,30));api.direction(1);const direction=delta(original,read());
    const gpuFrames=api.scene.shore.frames;api.renderAt(0,30);api.renderAt(0,31);const pausedRedraws=api.scene.shore.frames-gpuFrames;
    api.setSettings({seed:137});const seedChange=delta(original,read());api.setSettings({seed:42});const seedReplay=delta(original,read());
    const translations=[];for(const camera of [-12345678,-4096,-37,0,4064,12345678]){const a=frame(camera),b=frame(camera+37);let sum=0;for(let y=0;y<88;y++)for(let x=0;x<2011;x++)for(let c=0;c<4;c++)sum+=Math.abs(a[(y*2048+x+37)*4+c]-b[(y*2048+x)*4+c]);translations.push({camera,mean:sum/(88*2011*4)});}
    const boundaries=[];for(const camera of [-12345344,-4096,0,4096,12345344])boundaries.push({camera,...delta(frame(camera-.005),frame(camera+.005))});
    api.setVisibility('shore',false);const hidden=read();let hiddenPixels=0;for(let p=3;p<hidden.length;p+=4)if(hidden[p])hiddenPixels++;
    api.reset();return{samples,periods,replay,time,direction,pausedRedraws,seedChange,seedReplay,translations,boundaries,hiddenPixels};
  })()`);
  const w=report.checks.world;
  for(const s of w.samples){assert.equal(s.empty,0);assert.equal(s.holes,0,'continuous opaque land');assert.equal(s.bodyHoles,0);assert(s.maximumY-s.minimumY>=1,'the narrower coast retains visible contour variation');assert(s.minimumY>=562&&s.maximumY<607);}
  for(const p of w.periods){assert(p.colour.mean>.5,'old material periods must not repeat');assert(p.meanEdgeDifference>.8,'coast outline is independent of the previous repeat spans');}
  for(const key of ['replay','time','direction','seedReplay'])assert.equal(w[key].changed,0,key);
  assert(w.seedChange.mean>1);assert.equal(w.pausedRedraws,0,'paused/time-only redraws reuse one GPU surface');assert.equal(w.hiddenPixels,0);
  for(const s of w.translations)assert(s.mean<.02,'world material stays attached to land while scrolling');
  for(const s of w.boundaries)assert(s.mean<.12,'origin rebasing cannot cause a seam or pop');
  report.checks.waterMask=await b.evaluate(`(()=>{
    const api=LayeredWallpaper,scene=api.scene,result=[];
    api.select('water');api.view('single');
    for(const camera of [0,-4096,15200]){api.renderAt(camera,8);const bank=document.createElement('canvas');bank.width=2048;bank.height=88;const bctx=bank.getContext('2d');bctx.drawImage(scene.shore.canvas,0,0);const land=bctx.getImageData(0,0,2048,88).data,lake=scene.lakeCtx.getImageData(0,0,2048,206).data;let landPixels=0,leaks=0,waterPixels=0;for(let y=562;y<605;y++)for(let x=0;x<2048;x++){const alpha=land[((y-528)*2048+x)*4+3],a=lake[((y-562)*2048+x)*4+3];if(alpha===255){landPixels++;if(a)leaks++;}else if(alpha===0&&a===255)waterPixels++;}result.push({camera,landPixels,leaks,waterPixels});}
    api.view('scene');api.renderAt(0,8);return result;
  })()`);
  for(const m of report.checks.waterMask){assert(m.landPixels>1000);assert(m.waterPixels>10000);assert.equal(m.leaks,0,'lake uses the same land alpha, including its varying headlands');}
  // These timings use the readback-friendly Canvas2D test context; the GPU
  // shader is real, but the CPU result is not a production compositor benchmark.
  report.checks.performance=await b.evaluate(`(async()=>{
    const api=LayeredWallpaper,shore=api.scene.shore,cpu=[],gpu=[],sceneMs=[];
    for(let i=0;i<72;i++){await new Promise(requestAnimationFrame);const start=performance.now();api.renderAt(i*1.25,8+i/30);sceneMs.push(performance.now()-start);if(i>=12){cpu.push(shore.renderMs);if(shore.gpuMs!==null)gpu.push(shore.gpuMs);}}
    const summary=a=>{a.sort((x,y)=>x-y);return a.length?{samples:a.length,median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)]}:null;};
    api.renderAt(0,8);return{renderer:shore.renderer,resolution:[2048,768],shaderResolution:[2048,88],shaderSubmissionMs:summary(cpu),shaderTimerMs:summary(gpu),sceneWithUI_CPU_Ms:summary(sceneMs.slice(12)),colorBufferBytes:shore.stats.colorBufferBytes,paintTextureBytes:shore.stats.detailBytes,lakeBufferBytes:2048*206*4,scope:'Headless Edge / D3D11; Canvas2D readback context. Compositor, native Wallpaper Engine and other hardware unmeasured',glError:shore.gl.getError()};
  })()`);
  assert.equal(report.checks.performance.glError,0);assert.deepEqual(b.errors,[]);report.consoleErrors=b.errors;
  report.sourceHashes=Object.fromEntries(['cases/blue-sky-layered/procedural-shore.js','cases/blue-sky-layered/world.mjs','cases/blue-sky-layered/renderer.js','assets/blue-sky-train/layered-stream/r13/shore.png'].map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]));
  report.passed=true;writeFileSync(resolve(out,'shore-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}catch(error){report.passed=false;report.error=error.stack;writeFileSync(resolve(out,'shore-report.json'),JSON.stringify(report,null,2)+'\n');throw error;}finally{await b.close();}
