import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {setTimeout as sleep} from 'node:timers/promises';
import assert from 'node:assert/strict';
import {browserHarness,root,until} from './browser-harness.mjs';
import {MATERIALS} from '../cases/blue-sky-layered/world.mjs';

const out=resolve(root,process.env.LAYERED_VERIFICATION_DIR||'docs/verification/layered-stream-r14');mkdirSync(out,{recursive:true});
const b=await browserHarness(),report={date:new Date().toISOString(),networkDisabled:true};
try{
  await b.viewport(1600,1000);await b.send('Network.enable');await b.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  await b.go(pathToFileURL(resolve(root,process.env.LAYERED_OUTPUT_DIR||'dist/blue-sky-layered','index.html')).href+'?paused=1');
  await until(()=>b.evaluate('Boolean(window.LayeredWallpaper?.state.ready)'),'offline scene ready');
  report.materials=await b.evaluate(`(() => Object.values(LayeredWallpaper.scene.assets).filter(a=>a.hill||a.clusters).map(a=>({id:a.id,path:a.path,sourceRect:a.sourceRect,groundY:a.groundY,embedded:window.LAYERED_EMBEDDED[a.path]?.startsWith('data:image/png;')})))()`);
  assert.equal(report.materials.length,3);for(const a of report.materials){assert(a.path.includes('/r11/'));assert(a.embedded);}
  assert.equal(await b.evaluate('LayeredWallpaper.stats.assetCount'),MATERIALS.length);
  report.foreground=await b.evaluate(`(()=>{const api=LayeredWallpaper,motifs=Object.keys(api.scene.foreground.motifs),sources=['leaves','low-shrub','near-ferns'].map(id=>({id,path:api.scene.assets[id].path,embedded:Boolean(window.LAYERED_EMBEDDED[api.scene.assets[id].path])})),oldGrassPresent=Boolean(api.scene.assets['near-meadow']||api.scene.foreground.motifs['near-meadow']||window.LAYERED_EMBEDDED['assets/blue-sky-train/foliage/r09/grass.png']);api.select('branches');api.view('single');api.setSettings({wind:false});api.renderAt(-1024,8);const first=api.exportPNG();api.renderAt(12345678,8);api.renderAt(-1024,8);const replay=api.exportPNG()===first;api.view('scene');api.setSettings({wind:true});return{motifs,sources,oldGrassPresent,replay,cacheBytes:api.scene.foreground.textureBytes};})()`);
  assert.equal(report.foreground.motifs.filter(id=>id.startsWith('canopy-')).length,4);assert(report.foreground.replay);for(const s of report.foreground.sources)assert(s.embedded);
  assert.equal(report.foreground.oldGrassPresent,false);
  report.groundBlend=await b.evaluate(`(()=>{const api=LayeredWallpaper;api.renderAt(-530,8);const s=api.scene.shore,a=s.contactCtx.getImageData(0,0,2048,88).data,b=s.hillRootsCtx.getImageData(0,0,2048,88).data;let changed=0;for(let p=0;p<a.length;p+=4)if(a[p+3]>240&&Math.abs(a[p]-b[p])+Math.abs(a[p+1]-b[p+1])+Math.abs(a[p+2]-b[p+2])>3)changed++;return{method:s.stats.contactBlend,hills:s.contactCount,changedRootPixels:changed,error:s.gl.getError()};})()`);
  assert.equal(report.groundBlend.method,'height-and-painted-roots');assert(report.groundBlend.hills>0&&report.groundBlend.changedRootPixels>1000);assert.equal(report.groundBlend.error,0);
  report.steam=await b.evaluate('({backend:LayeredWallpaper.scene.smoke.backend,error:LayeredWallpaper.scene.smoke.gl?.getError(),stats:LayeredWallpaper.stats.steam})');
  assert.equal(report.steam.backend,'WebGL2');assert.equal(report.steam.error,0);
  assert(await b.evaluate('document.getElementById("scene-music").src.startsWith("data:audio/mpeg;")'));
  report.shore=await b.evaluate(`(()=>{const api=LayeredWallpaper,s=api.scene.shore;api.select('shore');api.view('single');api.renderAt(0,8);const first=api.exportPNG();api.renderAt(976,8);const different=api.exportPNG()!==first;api.renderAt(-12345678,8);api.renderAt(0,8);const replay=api.exportPNG()===first;api.view('scene');return{...s.stats,error:s.gl.getError(),different,replay,paint:api.scene.assets['shore-paint'].path,detailRect:api.scene.assets['shore-paint'].detailRect,embedded:Boolean(window.LAYERED_EMBEDDED[api.scene.assets['shore-paint'].path]),oldBankAssetPresent:Boolean(api.scene.assets.shore)};})()`);
  assert.equal(report.shore.backend,'WebGL2');assert.equal(report.shore.error,0);assert(report.shore.different&&report.shore.replay&&report.shore.embedded);assert.equal(report.shore.oldBankAssetPresent,false);
  const paintData=await b.evaluate('window.LAYERED_EMBEDDED[LayeredWallpaper.scene.assets["shore-paint"].path]');
  assert.equal(createHash('sha256').update(Buffer.from(paintData.split(',')[1],'base64')).digest('hex'),createHash('sha256').update(readFileSync(resolve(root,report.shore.paint))).digest('hex'));
  report.embeddedPaintMatches=true;
  report.cameras=[];
  for(const camera of [15200,-15200]){
    await b.evaluate(`LayeredWallpaper.renderAt(${camera},8)`);
    writeFileSync(resolve(out,'offline-'+camera+'.png'),Buffer.from((await b.evaluate('LayeredWallpaper.exportPNG()')).split(',')[1],'base64'));
    const stats=await b.evaluate('LayeredWallpaper.stats');assert(stats.instances<140);report.cameras.push({camera,scenery:stats.scenery,instances:stats.instances});
  }
  await b.evaluate('LayeredWallpaper.renderAt(0,8)');await b.screenshot(resolve(out,'offline-wallpaper.png'));
  await b.evaluate('wallpaperPropertyListener.applyUserProperties({direction:{value:-1},paused:{value:false}})');await sleep(500);assert((await b.evaluate('LayeredWallpaper.state.camera'))<0);
  await b.evaluate('wallpaperPropertyListener.setPaused(true)');const paused=await b.evaluate('({camera:LayeredWallpaper.state.camera,time:LayeredWallpaper.state.time,frames:LayeredWallpaper.scene.shore.frames})');await sleep(250);assert.deepEqual(await b.evaluate('({camera:LayeredWallpaper.state.camera,time:LayeredWallpaper.state.time,frames:LayeredWallpaper.scene.shore.frames})'),paused);
  await b.evaluate('wallpaperPropertyListener.applyUserProperties({direction:{value:1}});wallpaperPropertyListener.setPaused(false)');await sleep(500);assert((await b.evaluate('LayeredWallpaper.state.camera'))>paused.camera);report.hostPauseAndBothDirections=true;
  report.consoleErrors=b.errors;assert.deepEqual(b.errors,[]);
  report.bundleHash=createHash('sha256').update(readFileSync(resolve(root,process.env.LAYERED_OUTPUT_DIR||'dist/blue-sky-layered','index.html'))).digest('hex');
  report.nativeWallpaperEngineTested=false;
  report.passed=true;writeFileSync(resolve(out,'offline-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}catch(error){report.passed=false;report.error=error.stack;writeFileSync(resolve(out,'offline-report.json'),JSON.stringify(report,null,2)+'\n');throw error;}finally{await b.close();}
