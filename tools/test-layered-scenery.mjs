import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {browserHarness,root,until} from './browser-harness.mjs';
const out=resolve(root,process.env.LAYERED_VERIFICATION_DIR||'docs/verification/layered-stream-r15');mkdirSync(out,{recursive:true});
const b=await browserHarness(),report={date:new Date().toISOString(),checks:{}};
try{
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`(() => {const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,o){return get.call(this,t,t==='2d'?{...o,willReadFrequently:true}:o);};})()`});
  await b.viewport(1600,1000);await b.go(`${b.base}/themes/blue-sky-train/lab/layered-stream/index.html?paused=1`);await until(()=>b.evaluate('Boolean(window.LayeredWallpaper?.state.ready)'),'scenery ready');
  report.checks.start=await b.evaluate(`(async()=>{
    const api=LayeredWallpaper,{sceneryCell}=await import('/cases/blue-sky-layered/world.mjs');api.renderAt(0,8);
    const pixels=[],ctx=api.scene.ctx,read=()=>ctx.getImageData(0,0,2048,768).data;
    for(const id of ['mountains-near','foothills','rail-hills']){const a=read();api.setVisibility(id,false);const b=read();let visiblePixels=0;for(let y=0;y<562;y++)for(let x=0;x<2048;x++){const p=(y*2048+x)*4;if(Math.abs(a[p]-b[p])+Math.abs(a[p+1]-b[p+1])+Math.abs(a[p+2]-b[p+2])>3)visiblePixels++;}pixels.push({id,visiblePixels});api.setVisibility(id,true);}
    const longestEmptyRuns=[];for(const seed of [0,42,43,137]){let longest=0,run=0;for(let id=-500;id<=500;id++){run=sceneryCell(id,seed)==='open'?run+1:0;longest=Math.max(longest,run);}longestEmptyRuns.push({seed,longest});}
    const positions=api.scene.railHillInstances(api.state).map(h=>({x:h.x,y:h.y,width:h.width,height:h.height}));
    return{scenery:api.scene.landscapeAt(api.state),pixels,longestEmptyRuns,positions};
  })()`);
  assert(report.checks.start.scenery.nearHills>0&&report.checks.start.scenery.forestHills>0&&report.checks.start.scenery.railHills>0,'default scene must visibly include the nearer layers');
  for(const p of report.checks.start.pixels)assert(p.visiblePixels>1000,p.id+' must remain visible in the composite, not just exist offscreen');
  for(const p of report.checks.start.longestEmptyRuns)assert(p.longest<=2,'long runs of empty cells must not hide all nearer terrain');
  writeFileSync(resolve(out,'start.png'),Buffer.from((await b.evaluate('LayeredWallpaper.exportPNG()')).split(',')[1],'base64'));
  report.checks.distribution=await b.evaluate(`(async () => {
    const api=LayeredWallpaper,{MIDGROUND,MOUNTAINS}=await import('/cases/blue-sky-layered/world.mjs'),near=MOUNTAINS.find(p=>p.clusters),counts={open:0,forest:0,hills:0},examples={};
    const inspect=camera=>{const state={...api.state,camera},summary=api.scene.landscapeAt(state);counts[summary.kind]++;
      const centred=h=>h.x+h.width*.55>150&&h.x+h.width*.55<1850;
      const good=summary.kind==='open'||summary.kind==='forest'&&api.scene.clusterInstances(state,near).some(centred)&&api.scene.clusterInstances(state,MIDGROUND).some(centred)||summary.kind==='hills'&&api.scene.railHillInstances(state).some(centred);
      if(good&&(!examples[summary.kind]||Math.abs(camera)<Math.abs(examples[summary.kind].camera)))examples[summary.kind]={camera,...summary};};
    inspect(0);for(let camera=-100000;camera<=100000;camera+=384)inspect(camera);
    return{counts,examples};
  })()`);
  const examples=report.checks.distribution.examples;
  for(const kind of ['open','forest','hills']){assert(report.checks.distribution.counts[kind]>10,kind+' must occur along the route');assert(examples[kind]);}
  report.checks.layerPixels=[];
  for(const kind of ['open','forest','hills']){
    const camera=examples[kind].camera;
    await b.evaluate(`LayeredWallpaper.renderAt(${camera},8)`);
    const pixels=await b.evaluate(`(() => {const api=LayeredWallpaper,ctx=api.scene.ctx,read=()=>ctx.getImageData(0,0,2048,768).data,result=[];for(const id of ['mountains-near','foothills','rail-hills']){const a=read();api.setVisibility(id,false);const b=read();let changed=0;for(let p=0;p<a.length;p+=4)if(a[p]!==b[p]||a[p+1]!==b[p+1]||a[p+2]!==b[p+2])changed++;api.setVisibility(id,true);result.push({id,changed});}return result;})()`);
    if(kind==='open')for(const layer of pixels)assert.equal(layer.changed,0,'open route has no nearer mountains or local hill reflections');
    if(kind==='forest'){assert(pixels.find(l=>l.id==='mountains-near').changed>100);assert(pixels.find(l=>l.id==='foothills').changed>100);}
    if(kind==='hills')assert(pixels.find(l=>l.id==='rail-hills').changed>100);
    report.checks.layerPixels.push({kind,camera,pixels});
    writeFileSync(resolve(out,'scenery-'+kind+'.png'),Buffer.from((await b.evaluate('LayeredWallpaper.exportPNG()')).split(',')[1],'base64'));
  }
  report.checks.determinism=await b.evaluate(`(() => {
    const api=LayeredWallpaper,camera=${examples.forest.camera};api.renderAt(camera,8);const initial=api.exportPNG(),before=JSON.stringify(api.scene.landscapeAt(api.state));
    api.renderAt(12345678,8);api.renderAt(-12345678,8);api.renderAt(camera,8);const replay=api.exportPNG()===initial;
    const state={...api.state,time:123},clockInvariant=JSON.stringify(api.scene.landscapeAt(state))===before;
    api.setSettings({seed:43});const otherSeed=api.exportPNG()!==initial;api.setSettings({seed:42});const restored=api.exportPNG()===initial;
    const instances=[];for(const camera of [-12345678,-2048,0,2048,12345678]){api.renderAt(camera,8);instances.push({camera,count:api.stats.instances,scenery:api.stats.scenery});}
    api.renderAt(0,8);return{replay,clockInvariant,otherSeed,restored,instances};
  })()`);
  const deterministic=report.checks.determinism;assert(deterministic.replay&&deterministic.clockInvariant&&deterministic.otherSeed&&deterministic.restored);
  for(const item of deterministic.instances)assert(item.count<140,'random composition keeps a bounded draw population');
  report.checks.nextScene=await b.evaluate(`(() => {const api=LayeredWallpaper;api.reset();api.renderAt(0,8);const results=[];for(const direction of [-1,1]){api.direction(direction);const before={camera:api.state.camera,kind:api.stats.scenery.kind,time:api.state.time,paused:api.state.paused};document.getElementById('next-scenery').click();results.push({direction,before,after:{camera:api.state.camera,kind:api.stats.scenery.kind,time:api.state.time,paused:api.state.paused}});}api.reset();return results;})()`);
  for(const item of report.checks.nextScene){assert.notEqual(item.after.kind,item.before.kind);assert((item.after.camera-item.before.camera)*item.direction>0);assert.equal(item.after.time,item.before.time);assert.equal(item.after.paused,item.before.paused);}
  report.consoleErrors=b.errors;assert.deepEqual(b.errors,[]);
  report.sourceHashes=Object.fromEntries(['cases/blue-sky-layered/world.mjs','cases/blue-sky-layered/renderer.js','themes/blue-sky-train/lab/layered-stream/app.js'].map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]));
  report.passed=true;writeFileSync(resolve(out,'scenery-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:true,distribution:report.checks.distribution,layerPixels:report.checks.layerPixels,nextScene:report.checks.nextScene},null,2));
}catch(error){report.passed=false;report.error=error.stack;writeFileSync(resolve(out,'scenery-report.json'),JSON.stringify(report,null,2)+'\n');throw error;}finally{await b.close();}
