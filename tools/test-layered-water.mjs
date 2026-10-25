import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {setTimeout as sleep} from 'node:timers/promises';
import {browserHarness,root,until} from './browser-harness.mjs';

const out=resolve(root,process.env.LAYERED_VERIFICATION_DIR||'docs/verification/layered-stream-r10');mkdirSync(out,{recursive:true});
const b=await browserHarness(),report={date:new Date().toISOString(),checks:{}};
try{
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`(() => {const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,options){return get.call(this,type,type==='2d'?{...options,willReadFrequently:true}:options);};})()`});
  report.readbackContext='Fixed Canvas2D readback context; not a performance benchmark';
  await b.viewport(1600,1000);await b.go(`${b.base}/themes/blue-sky-train/lab/layered-stream/index.html?paused=1`);
  await until(()=>b.evaluate('Boolean(window.LayeredWallpaper?.state.ready)'),'water ready');
  report.checks.waterOnlyChange=await b.evaluate(`(() => {
    const api=LayeredWallpaper,ctx=api.scene.ctx,read=()=>ctx.getImageData(0,0,2048,768).data;
    api.renderAt(0,8);api.setSettings({wind:false,ripple:false});const calm=read();api.setSettings({ripple:true});const wave=read();let above=0,below=0;
    for(let y=0;y<768;y++)for(let x=0;x<2048;x++){const p=(y*2048+x)*4;if(calm[p]!==wave[p]||calm[p+1]!==wave[p+1]||calm[p+2]!==wave[p+2]){if(y<562)above++;else below++;}}
    return{above,below};
  })()`);
  assert.equal(report.checks.waterOnlyChange.above,0,'water post-processing cannot blur the upper landscape');
  assert(report.checks.waterOnlyChange.below>100000,'the rendered lake gains a visible surface treatment');

  // A controlled high-frequency reflection chart measures real contrast loss,
  // rather than merely checking the presence of a blur buffer or setting.
  report.checks.reflectionSoftening=await b.evaluate(`(() => {
    const api=LayeredWallpaper,scene=api.scene,ctx=scene.ctx,source=scene.waterSourceCtx;
    for(const id of Object.keys(api.state.visibility))api.state.visibility[id]=id==='water';
    api.renderAt(0,8);source.clearRect(0,0,2048,768);source.fillStyle='#194b7c';source.fillRect(0,0,2048,768);source.fillStyle='#bde9fa';for(let x=0;x<2048;x+=4)source.fillRect(x,0,2,768);
    const render=ripple=>{ctx.clearRect(0,0,2048,768);scene.water(ctx,{...api.state,ripple});return ctx.getImageData(0,0,2048,768).data;};
    const energy=(d,y0,y1)=>{let sum=0,n=0;for(let y=y0;y<y1;y++)for(let x=100;x<1948;x++)for(let c=0;c<3;c++){const p=(y*2048+x)*4+c;sum+=Math.abs(d[p+4]-d[p]);n++;}return sum/n;};
    const calm=render(false),wave=render(true),near={calm:energy(calm,566,588),wave:energy(wave,566,588)},deep={calm:energy(calm,718,752),wave:energy(wave,718,752)};
    api.reset();return{near,deep,nearRatio:near.wave/near.calm,deepRatio:deep.wave/deep.calm};
  })()`);
  assert(report.checks.reflectionSoftening.deepRatio<.70,'nearby water must suppress fine reflected detail');
  assert(report.checks.reflectionSoftening.deepRatio<report.checks.reflectionSoftening.nearRatio,'the bank stays clearer than the closer water');

  // Isolate the surface with all reflected subjects hidden. Sparkle should
  // still move; it cannot be an accidental change in cloud or smoke animation.
  report.checks.surface=await b.evaluate(`(() => {
    const api=LayeredWallpaper,ctx=api.scene.ctx,read=()=>ctx.getImageData(0,0,2048,768).data;
    for(const id of Object.keys(api.state.visibility))api.state.visibility[id]=id==='water';
    api.setSettings({wind:false,ripple:true});api.renderAt(0,8);const first=api.exportPNG(),a=read();api.renderAt(0,9.5);const b=read();let changed=0,above=0;for(let y=0;y<768;y++)for(let x=0;x<2048;x++){const p=(y*2048+x)*4;if(a[p]!==b[p]||a[p+1]!==b[p+1]||a[p+2]!==b[p+2]){changed++;if(y<562)above++;}}
    api.renderAt(0,8);const replay=api.exportPNG()===first;api.direction(1);const directionStable=api.exportPNG()===first;api.direction(-1);
    const counts=[];for(const camera of [-12345678,-2048,0,2048,12345678]){api.renderAt(camera,8);counts.push({camera,patches:api.stats.water.patches});}
    api.renderAt(0,8);const roundTrip=api.exportPNG()===first;
    const boundaries=[];for(const sign of [-1,1]){const camera=sign*384/.72;api.renderAt(camera-.005,8);const l=read();api.renderAt(camera+.005,8);const r=read();let sum=0;for(let i=0;i<l.length;i++)sum+=Math.abs(l[i]-r[i]);boundaries.push({sign,meanChannelError:sum/l.length});}
    api.renderAt(0,8);return{changed,above,replay,directionStable,roundTrip,counts,boundaries};
  })()`);
  const surface=report.checks.surface;
  assert(surface.changed>5000,'water glints animate with reflected subjects hidden');assert.equal(surface.above,0);
  assert(surface.replay&&surface.directionStable&&surface.roundTrip,'water remains deterministic on replay and camera turns');
  for(const item of surface.counts)assert(item.patches>80&&item.patches<220,'surface cost stays bounded at signed distant coordinates');
  for(const item of surface.boundaries)assert(item.meanChannelError<.1,'water patches cannot pop at cell boundaries');

  await b.evaluate('LayeredWallpaper.setSettings({speed:0});LayeredWallpaper.pause(false)');
  const before=await b.evaluate('({camera:LayeredWallpaper.state.camera,time:LayeredWallpaper.state.time})');await sleep(550);
  await b.evaluate('wallpaperPropertyListener.setPaused(true)');
  const frozen=await b.evaluate('({camera:LayeredWallpaper.state.camera,time:LayeredWallpaper.state.time,png:LayeredWallpaper.exportPNG()})');await sleep(250);
  assert.equal(await b.evaluate('LayeredWallpaper.exportPNG()'),frozen.png,'host pause freezes the water pixels');
  assert.equal(frozen.camera,before.camera);assert(frozen.time>before.time,'water still flows when the train speed is zero');
  report.checks.sharedClock={zeroSpeedCameraStable:true,waterTimeAdvances:true,hostPausePixelsStable:true};
  await b.evaluate('LayeredWallpaper.pause(true);wallpaperPropertyListener.setPaused(false);document.getElementById("ripple").click()');
  assert.equal(await b.evaluate('LayeredWallpaper.state.ripple'),false);assert.equal(await b.evaluate('LayeredWallpaper.stats.water.patches'),0);
  await b.evaluate('wallpaperPropertyListener.applyUserProperties({ripple:{value:true}})');
  assert.equal(await b.evaluate('document.getElementById("ripple").checked'),true);
  await b.evaluate('LayeredWallpaper.setVisibility("water",false)');
  assert.equal(await b.evaluate('LayeredWallpaper.stats.water'),null,'hidden water skips the entire surface pass');
  report.checks.controls={checkbox:true,hostProperty:true,hiddenSkipsPass:true};

  await b.evaluate('LayeredWallpaper.reset();LayeredWallpaper.renderAt(0,8)');
  const detail=await b.evaluate(`(() => {const c=document.createElement('canvas');c.width=2048;c.height=206;c.getContext('2d').drawImage(document.getElementById('scene'),0,562,2048,206,0,0,2048,206);return c.toDataURL();})()`);
  writeFileSync(resolve(out,'water-detail.png'),Buffer.from(detail.split(',')[1],'base64'));
  report.consoleErrors=b.errors;assert.deepEqual(b.errors,[]);
  report.sourceHashes=Object.fromEntries(['cases/blue-sky-layered/renderer.js','cases/blue-sky-layered/world.mjs','themes/blue-sky-train/lab/layered-stream/app.js'].map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]));
  report.passed=true;writeFileSync(resolve(out,'water-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}catch(error){report.passed=false;report.error=error.stack;writeFileSync(resolve(out,'water-report.json'),JSON.stringify(report,null,2)+'\n');throw error;}finally{await b.close();}
