import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {setTimeout as sleep} from 'node:timers/promises';
import assert from 'node:assert/strict';
import {browserHarness,root,until} from './browser-harness.mjs';
import {MATERIALS} from '../cases/blue-sky-layered/world.mjs';

const offline=process.argv.includes('--offline');
const out=resolve(root,process.env.LAYERED_VERIFICATION_DIR||'docs/verification/layered-stream-r17-clouds');mkdirSync(out,{recursive:true});
const report={date:new Date().toISOString(),offline,checks:{},limitations:['No native Wallpaper Engine, 4K or long-duration verification.','Three authored cloud templates are randomly composed; this is not unlimited unique painted geometry.']};
const b=await browserHarness();
const save=async name=>writeFileSync(resolve(out,name+'.png'),Buffer.from((await b.evaluate('LayeredWallpaper.exportPNG()')).split(',')[1],'base64'));
try{
  await b.viewport(1600,1000);
  if(offline){await b.send('Network.enable');await b.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});}
  const url=offline?pathToFileURL(resolve(root,process.env.LAYERED_OUTPUT_DIR||'dist/blue-sky-layered','index.html')).href:b.base+'/themes/blue-sky-train/lab/layered-stream/index.html';
  await b.go(url+'?paused=1');await until(()=>b.evaluate('Boolean(window.LayeredWallpaper?.state.ready)'),'flat cloud wallpaper');
  await b.evaluate('LayeredWallpaper.renderAt(0,8)');await save(offline?'offline-after':'after');
  report.checks.palette=await b.evaluate(`(()=>{
    const assets=Object.values(LayeredWallpaper.scene.assets).filter(a=>a.flatCloud);
    return assets.map(a=>{const data=a.image.getContext('2d').getImageData(0,0,a.width,a.height).data,colours=new Set();let opaque=0,visible=0;for(let p=0;p<data.length;p+=4){if(data[p+3])visible++;if(data[p+3]===255){opaque++;colours.add([data[p],data[p+1],data[p+2]].join(','));}}return{id:a.id,path:a.path,colours:[...colours].sort(),opaqueFraction:opaque/visible,width:a.width,height:a.height,embedded:!window.LAYERED_EMBEDDED||window.LAYERED_EMBEDDED[a.path]?.startsWith('data:image/png;')};});
  })()`);
  const expected=['253,250,241','209,234,249','167,212,243','136,193,235'].sort();
  assert.equal(report.checks.palette.length,3);
  for(const cloud of report.checks.palette){assert.deepEqual(cloud.colours,expected);assert(cloud.opaqueFraction>.96);assert(cloud.path.includes('/clouds/r17/'));assert(cloud.embedded);}
  report.checks.randomness=await b.evaluate(`(()=>{
    const api=LayeredWallpaper;api.renderAt(0,8);const before=api.exportPNG(),land=JSON.stringify(api.scene.landscapeAt(api.state));
    const hold=()=>({camera:api.state.camera,time:api.state.time,windTime:api.state.windTime,seed:api.state.seed,paused:api.state.paused});const initial=hold(),cloudSeed=api.state.cloudSeed;
    document.getElementById('next-clouds').click();const shuffleChangesPixels=api.exportPNG()!==before,after=hold(),shuffledSeed=api.state.cloudSeed,terrainPreserved=JSON.stringify(api.scene.landscapeAt(api.state))===land;
    api.setSettings({cloudSeed});const seedRestored=api.exportPNG()===before;
    api.renderAt(12345678,8);api.renderAt(-12345678,8);api.renderAt(0,8);const returnTrip=api.exportPNG()===before;
    return{initial,after,cloudSeed,shuffledSeed,shuffleChangesPixels,terrainPreserved,seedRestored,returnTrip};
  })()`);
  const random=report.checks.randomness;assert.deepEqual(random.initial,random.after);assert.notEqual(random.cloudSeed,random.shuffledSeed);
  assert(random.shuffleChangesPixels&&random.terrainPreserved&&random.seedRestored&&random.returnTrip);
  report.checks.reflection=await b.evaluate(`(()=>{
    const api=LayeredWallpaper;api.reset();api.renderAt(0,8);api.setSettings({ripple:false,wind:false});
    for(const id of Object.keys(api.state.visibility))api.setVisibility(id,['sky','clouds','clouds-far','water'].includes(id));
    const read=()=>api.scene.ctx.getImageData(0,0,2048,768).data,a=read();api.setVisibility('clouds',false);const hidden=read();let above=0,below=0;
    for(let y=0;y<768;y++)for(let x=0;x<2048;x++){const p=(y*2048+x)*4;if(Math.abs(a[p]-hidden[p])+Math.abs(a[p+1]-hidden[p+1])+Math.abs(a[p+2]-hidden[p+2])>3){if(y<562)above++;else below++;}}
    api.setVisibility('clouds',true);const restored=read();let mirrorError=0,samples=0;
    for(let y=580;y<760;y+=3)for(let x=8;x<2040;x+=5){const p=(y*2048+x)*4,q=((1095-y)*2048+x)*4;for(let ch=0;ch<3;ch++){const tint=[33,139,212][ch];mirrorError+=Math.abs(restored[p+ch]-(restored[q+ch]*.955+tint*.045));samples++;}}
    api.reset();return{above,below,mirrorMeanError:mirrorError/samples};
  })()`);
  assert(report.checks.reflection.above>1000&&report.checks.reflection.below>1000);assert(report.checks.reflection.mirrorMeanError<2,'calm cloud reflection uses the same frame');
  report.checks.distance=[];
  for(const camera of [-12345678,-16000,0,16000,12345678]){
    await b.evaluate(`LayeredWallpaper.renderAt(${camera},8)`);const stats=await b.evaluate('LayeredWallpaper.stats');
    assert(stats.clouds.layers.every(l=>l.instances>0&&l.instances<9));assert.equal(stats.clouds.bufferBytes,3145728,'two 1024×384 RGBA cloud buffers retain the finer r20 brush edges');
    assert(stats.instances<180);report.checks.distance.push({camera,instances:stats.instances,clouds:stats.clouds.layers,bufferBytes:stats.clouds.bufferBytes});
    if(!offline&&Math.abs(camera)===16000)await save('travel-'+camera);
  }
  await b.evaluate("LayeredWallpaper.reset();LayeredWallpaper.renderAt(0,8);LayeredWallpaper.select('clouds');LayeredWallpaper.view('single');LayeredWallpaper.setSettings({speed:0,wind:true});LayeredWallpaper.pause(false)");
  const playing=await b.evaluate('({time:LayeredWallpaper.state.time,windTime:LayeredWallpaper.state.windTime,camera:LayeredWallpaper.state.camera})');await sleep(500);
  const advanced=await b.evaluate('({time:LayeredWallpaper.state.time,windTime:LayeredWallpaper.state.windTime,camera:LayeredWallpaper.state.camera})');
  assert(advanced.time>playing.time&&advanced.windTime>playing.windTime);assert.equal(advanced.camera,playing.camera);
  await b.evaluate('LayeredWallpaper.setSettings({wind:false})');const held=await b.evaluate('({phase:LayeredWallpaper.state.windTime,png:LayeredWallpaper.exportPNG()})');await sleep(250);
  assert(await b.evaluate('LayeredWallpaper.state.time')>advanced.time);assert.equal(await b.evaluate('LayeredWallpaper.state.windTime'),held.phase);assert.equal(await b.evaluate('LayeredWallpaper.exportPNG()'),held.png);
  await b.evaluate('LayeredWallpaper.pause(true)');const paused=await b.evaluate('({time:LayeredWallpaper.state.time,windTime:LayeredWallpaper.state.windTime,camera:LayeredWallpaper.state.camera,frames:LayeredWallpaper.stats.frames})');await sleep(250);
  assert.deepEqual(await b.evaluate('({time:LayeredWallpaper.state.time,windTime:LayeredWallpaper.state.windTime,camera:LayeredWallpaper.state.camera,frames:LayeredWallpaper.stats.frames})'),paused);
  report.checks.clock={playing,advanced,windFreeze:true,exactPause:true};
  await b.evaluate('LayeredWallpaper.reset();LayeredWallpaper.setSettings({ripple:true,wind:true,speed:1});LayeredWallpaper.renderAt(0,8)');
  report.checks.performance=await b.evaluate(`(()=>{const api=LayeredWallpaper,samples=[];for(let i=0;i<45;i++){api.renderAt(i*3,8+i/60);if(i>=5)samples.push(api.stats.renderMs);}samples.sort((a,b)=>a-b);return{medianMs:samples[Math.floor(samples.length*.5)],p95Ms:samples[Math.floor(samples.length*.95)],frames:samples.length,scope:'CPU Canvas submission, not GPU time',stats:api.stats};})()`);
  if(!offline){
    await b.evaluate('LayeredWallpaper.reset();LayeredWallpaper.setSettings({ripple:true,wind:true,speed:1});LayeredWallpaper.renderAt(0,8)');await b.screenshot(resolve(out,'after-workbench.png'));
    await b.evaluate("for(const id of Object.keys(LayeredWallpaper.state.visibility))LayeredWallpaper.setVisibility(id,['sky','clouds','clouds-far'].includes(id))");await save('clouds-only');
    await b.evaluate('LayeredWallpaper.nextClouds()');await save('clouds-seed43');
    await b.viewport(390,844);await b.evaluate("LayeredWallpaper.view('scene')");await b.screenshot(resolve(out,'mobile.png'));
    report.checks.mobile=await b.evaluate('({viewport:innerWidth,content:document.documentElement.scrollWidth})');assert(report.checks.mobile.content<=report.checks.mobile.viewport);
  }
  report.consoleErrors=b.errors;assert.deepEqual(b.errors,[]);
  const paths=['cases/blue-sky-layered/flat-clouds.js','cases/blue-sky-layered/world.mjs','cases/blue-sky-layered/renderer.js','cases/blue-sky-layered/foreground.js','cases/blue-sky-layered/procedural-shore.js','cases/blue-sky-layered/starry-steam.js','themes/blue-sky-train/lab/layered-stream/app.js',...MATERIALS.map(a=>a.path)];
  report.sourceHashes=Object.fromEntries(paths.map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]));
  if(offline)report.bundleHash=createHash('sha256').update(readFileSync(resolve(root,process.env.LAYERED_OUTPUT_DIR||'dist/blue-sky-layered','index.html'))).digest('hex');
  report.passed=true;console.log(JSON.stringify({passed:true,offline,randomness:report.checks.randomness,reflection:report.checks.reflection,performance:report.checks.performance,errors:b.errors},null,2));
}catch(error){report.passed=false;report.error=error.stack;report.consoleErrors=b.errors;throw error;}
finally{writeFileSync(resolve(out,offline?'offline-cloud-report.json':'cloud-report.json'),JSON.stringify(report,null,2)+'\n');await b.close();}
