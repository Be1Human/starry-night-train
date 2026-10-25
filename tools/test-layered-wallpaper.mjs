import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import { browserHarness, root, until } from './browser-harness.mjs';
import { MATERIALS } from '../cases/blue-sky-layered/world.mjs';
const out=resolve(root,process.env.LAYERED_VERIFICATION_DIR||'docs/verification/layered-stream-r11');mkdirSync(out,{recursive:true});
const b=await browserHarness();const report={date:new Date().toISOString(),checks:{},screens:[]};
const save=(name,data)=>{writeFileSync(resolve(out,name),Buffer.from(data.split(',')[1],'base64'));report.screens.push(name);};
try{
  // This suite repeatedly reads full pixel buffers. Ask for a readback context
  // before creation so Chromium cannot switch raster backends halfway through
  // a pixel comparison and change texture resampling around fine leaf edges.
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`(() => {const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,options){return get.call(this,type,type==='2d'?{...options,willReadFrequently:true}:options);};})()`});
  report.readbackContext='Canvas2D willReadFrequently; fixed before context creation';
  await b.viewport(1600,1000);await b.go(`${b.base}/themes/blue-sky-train/lab/layered-stream/index.html?paused=1`);await until(()=>b.evaluate('Boolean(window.LayeredWallpaper?.state.ready)'),'layered wallpaper');
  report.initial=await b.evaluate('LayeredWallpaper.stats');
  assert.equal(await b.evaluate('LayeredWallpaper.state.direction'),-1,'source engine starts travelling left');
  // Distant terrain stays out of the lake. Nearer slopes may be absent in open
  // stretches; a forest sample also checks their existing local reflections.
  report.checks.reflectionSources=await b.evaluate(`(() => {
    const api=LayeredWallpaper,result=[];api.setSettings({ripple:false,wind:false});
    const ctx=document.getElementById('scene').getContext('2d'),read=()=>ctx.getImageData(0,0,2048,768).data;
    for(const camera of [-2048,0,2048,15200]){
      api.renderAt(camera,8);
      for(const id of ['mountains-far','mountains-near','foothills','clouds','bridge-piers','engine','steam']){
        const a=read();api.setVisibility(id,false);const b=read();let above=0,below=0,deep=0;for(let y=0;y<768;y++)for(let x=0;x<2048;x++){const p=(y*2048+x)*4;if(a[p]!==b[p]||a[p+1]!==b[p+1]||a[p+2]!==b[p+2]){if(y<562)above++;else{below++;if(y>=600)deep++;}}}
        result.push({camera,id,above,below,deep});api.setVisibility(id,true);
      }
    }api.reset();api.setSettings({ripple:true,wind:true});return result;
  })()`);
  for(const item of report.checks.reflectionSources){
    if(!['mountains-near','foothills'].includes(item.id))assert(item.above>100,`${item.id}: visible upper layer remains present`);
    if(item.id.startsWith('mountains-'))assert.equal(item.below,0,`${item.id}: distant terrain must not enter the lake`);
    else if(item.id==='foothills'){
      assert.equal(item.deep,0,'only the connected forest foot reflects near the bank');
      if(item.above===0)assert.equal(item.below,0,'absent forest cannot leave a reflection');
      else assert(item.below>0,'present forest foot still reflects at the bank');
    }
    else assert(item.below>100,`${item.id}: supported reflection remains linked`);
  }
  for(const id of ['mountains-near','foothills'])assert(report.checks.reflectionSources.some(p=>p.id===id&&p.above>100),'forest sample exercises the optional slope');
  for(const [name,camera] of [['start',0],['right-one-screen',2048],['left-one-screen',-2048],['distant-position',12345678]]){
    await b.evaluate(`LayeredWallpaper.renderAt(${camera},8)`);save(name+'.png',await b.evaluate('LayeredWallpaper.exportPNG()'));
    const stats=await b.evaluate('LayeredWallpaper.stats');assert(stats.instances<140,'bounded instances');assert.equal(stats.assetCount,MATERIALS.length);report.checks[name]={instances:stats.instances,drawCalls:stats.drawCalls};
  }
  await b.evaluate('LayeredWallpaper.renderAt(0,8)');await b.screenshot(resolve(out,'workbench.png'));
  for(const id of ['mountains-far','foothills','trees','bridge-piers','rail-hills','water','understory','branches']){
    await b.evaluate(`LayeredWallpaper.select(${JSON.stringify(id)});LayeredWallpaper.view('single')`);save('layer-'+id+'.png',await b.evaluate('LayeredWallpaper.exportPNG()'));
  }
  await b.evaluate("LayeredWallpaper.view('scene');LayeredWallpaper.renderAt(0,8)");
  // At a fixed world position and clock, revisiting either direction is identical.
  const original=await b.evaluate('LayeredWallpaper.exportPNG()');
  await b.evaluate('LayeredWallpaper.renderAt(50000,9);LayeredWallpaper.renderAt(-50000,9);LayeredWallpaper.renderAt(0,8)');
  assert.equal(await b.evaluate('LayeredWallpaper.exportPNG()'),original);report.checks.reversibleWorld=true;
  // Swapping the set of visible cell IDs at a boundary must not cause a pop.
  report.checks.boundaries=await b.evaluate(`(async () => {
    const result=[];LayeredWallpaper.setSettings({wind:false,ripple:false});
    const {MOUNTAINS,MIDGROUND,RAIL_HILLS}=await import('/cases/blue-sky-layered/world.mjs');
    const {FOREGROUND}=await import('/cases/blue-sky-layered/foreground.js');
    const {FLAT_CLOUDS}=await import('/cases/blue-sky-layered/flat-clouds.js');
    const terrain=[...MOUNTAINS.map(p=>[p.layer,p.depth,p.span||LayeredWallpaper.scene.assets[p.asset].width*p.scale,p.offset]),['foothills',MIDGROUND.depth,MIDGROUND.span,MIDGROUND.offset]];
    for(const [id,depth,span,offset] of [['sky',.008,2300,0],['clouds-far',FLAT_CLOUDS.farDepth,FLAT_CLOUDS.farSpan,-110],['clouds',FLAT_CLOUDS.nearDepth,FLAT_CLOUDS.nearSpan,70],...terrain,['trees',.38,184,-70],['trees',.38,226,30],['bridge-deck',1,323,0],['rail-hills',RAIL_HILLS.depth,RAIL_HILLS.span,RAIL_HILLS.offset],...Object.entries(FOREGROUND).map(([id,p])=>[id,p.depth,p.span,p.offset])]){
      LayeredWallpaper.select(id);LayeredWallpaper.view('single');
      for(const sign of [-1,1]){const distance=(sign*span+offset)/depth;LayeredWallpaper.renderAt(distance-.005,8);const ctx=document.getElementById('scene').getContext('2d'),a=ctx.getImageData(0,0,2048,768).data;LayeredWallpaper.renderAt(distance+.005,8);const b=ctx.getImageData(0,0,2048,768).data;let sum=0,changed=0;for(let p=0;p<a.length;p++){const e=Math.abs(a[p]-b[p]);sum+=e;if(e>32)changed++;}result.push({id,sign,meanError:sum/a.length,largeChannelChanges:changed});}
    }LayeredWallpaper.view('scene');LayeredWallpaper.setSettings({wind:true,ripple:true});LayeredWallpaper.renderAt(0,8);return result;
  })()`);
  for(const check of report.checks.boundaries)assert(check.meanError<.5,`${check.id}: boundary pop`);
  // Changing direction while paused turns the consist immediately, preserving
  // the landscape and clock. The whole frame should now intentionally differ.
  const before=await b.evaluate('({camera:LayeredWallpaper.state.camera,time:LayeredWallpaper.state.time,png:LayeredWallpaper.exportPNG(),land:LayeredWallpaper.scene.land.toDataURL()})');
  await b.evaluate('document.getElementById("right").click()');
  const after=await b.evaluate('({camera:LayeredWallpaper.state.camera,time:LayeredWallpaper.state.time,png:LayeredWallpaper.exportPNG(),land:LayeredWallpaper.scene.land.toDataURL(),direction:LayeredWallpaper.state.direction})');
  assert.equal(after.direction,1);assert.equal(after.camera,before.camera);assert.equal(after.time,before.time);assert.equal(after.land,before.land);assert.notEqual(after.png,before.png);report.checks.directionPreservesLandscape=true;
  save('train-right.png',after.png);
  report.checks.trainFacing=await b.evaluate(`(() => {
    const api=LayeredWallpaper,ctx=document.getElementById('scene').getContext('2d'),read=()=>ctx.getImageData(0,0,2048,768).data;
    const bounds=(data)=>{let minX=2048,maxX=-1,minY=768,maxY=-1,weight=0,sumX=0;for(let y=0;y<768;y++)for(let x=0;x<2048;x++){const a=data[(y*2048+x)*4+3];if(a>2){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);sumX+=x*a;weight+=a;}}return{minX,maxX,minY,maxY,centerX:sumX/weight};};
    api.renderAt(0,0);api.setSettings({ripple:false,wind:false});const result=[];
    for(const direction of [-1,1]){
      document.getElementById(direction<0?'left':'right').click();const item={direction};
      for(const id of ['engine','coach-1','coach-2','steam']){api.select(id);api.view('single');item[id]=bounds(read());}
      // Hiding an engine also hides its smoke. Isolate the engine difference,
      // and use bounds so a new background colour cannot bias its position.
      api.view('scene');api.setVisibility('steam',false);api.setVisibility('engine',false);const hidden=read();api.setVisibility('engine',true);const visible=read();let weight=0,minX=2048,maxX=-1,backgroundDeltaMax=0;
      for(let y=563;y<610;y++)for(let x=0;x<2048;x++){const p=(y*2048+x)*4,e=Math.abs(visible[p]-hidden[p])+Math.abs(visible[p+1]-hidden[p+1])+Math.abs(visible[p+2]-hidden[p+2]);if(x<item.engine.minX||x>item.engine.maxX)backgroundDeltaMax=Math.max(backgroundDeltaMax,e);if(e>3){weight+=e;minX=Math.min(minX,x);maxX=Math.max(maxX,x);}}
      item.reflectedEngineX=(minX+maxX)/2;item.reflectedWeight=weight;item.backgroundDeltaMax=backgroundDeltaMax;
      if(backgroundDeltaMax>=24){window.reflectionDebug={state:JSON.parse(JSON.stringify(api.state)),hidden,visible};}
      api.setVisibility('steam',true);result.push(item);
    }
    // Compare the actual rendered train pixels, rather than just pose numbers.
    for(const id of Object.keys(api.state.visibility))api.setVisibility(id,['engine','coach-1','coach-2'].includes(id));
    api.direction(-1);const left=read();api.direction(1);const right=read();let error=0,channels=0;
    for(let y=445;y<485;y++)for(let x=1200;x<1509;x++)for(let ch=0;ch<4;ch++){error+=Math.abs(left[(y*2048+x)*4+ch]-right[(y*2048+2708-x)*4+ch]);channels++;}
    api.reset();api.setSettings({ripple:true,wind:true});return{poses:result,mirrorMeanError:error/channels};
  })()`);
  if(report.checks.trainFacing.poses.some(p=>p.backgroundDeltaMax>=24)){
    const debug=await b.evaluate(`(() => {const d=window.reflectionDebug;const c=document.createElement('canvas');c.width=2048;c.height=768;const ctx=c.getContext('2d'),png=data=>{const i=ctx.createImageData(2048,768);i.data.set(data);ctx.putImageData(i,0,0);return c.toDataURL();};return{state:d.state,hidden:png(d.hidden),visible:png(d.visible)};})()`);
    save('debug-hidden.png',debug.hidden);save('debug-visible.png',debug.visible);report.reflectionDebugState=debug.state;
  }
  for(const pose of report.checks.trainFacing.poses){
    const sign=pose.direction,engine=pose.engine.centerX;
    assert((engine-pose['coach-1'].centerX)*sign>0,'engine leads first coach');assert((pose['coach-1'].centerX-pose['coach-2'].centerX)*sign>0,'first coach leads second');
    assert((pose.steam.centerX-(sign<0?1218:1491))*sign<0,'steam trails from chimney');
    assert(pose.reflectedWeight>10000);assert(Math.abs(pose.reflectedEngineX-engine)<12,'reflected engine follows its facing');
    assert.equal(pose.backgroundDeltaMax,0,'engine visibility cannot change the rest of the water');
  }
  assert(report.checks.trainFacing.mirrorMeanError<.1,'whole train mirrors consistently');
  // The far bank stays below the deck and remains bounded at remote positions.
  report.checks.farBank=await b.evaluate(`(() => {const api=LayeredWallpaper,result=[];api.select('trees');api.view('single');for(const camera of [-12345678,-2048,0,2048,12345678]){api.renderAt(camera,0);const d=document.getElementById('scene').getContext('2d').getImageData(0,0,2048,768).data;let top=768,bottom=0;for(let y=0;y<768;y++)for(let x=0;x<2048;x++)if(d[(y*2048+x)*4+3]>10){top=Math.min(top,y);bottom=Math.max(bottom,y);}result.push({camera,top,bottom,instances:api.stats.instances});}api.reset();return result;})()`);
  for(const bank of report.checks.farBank){assert(bank.top>=478,'far trees do not cover the deck');assert(bank.bottom<=553);assert(bank.instances<=30);}
  report.checks.midgroundConnection=await b.evaluate(`(async () => {
    const {MIDGROUND}=await import('/cases/blue-sky-layered/world.mjs');
    const api=LayeredWallpaper,result=[];api.select('foothills');api.view('single');
    for(const camera of [-12345678,-2048,0,2048,12345678,15200]){
      api.renderAt(camera,8);const data=document.getElementById('scene').getContext('2d').getImageData(0,0,2048,768).data;let holes=0,checkedRoots=0;
      for(const hill of api.scene.clusterInstances(api.state,MIDGROUND))for(const t of [.4,.5,.6]){
        const x=Math.floor(hill.x+hill.width*t);if(x<0||x>=2048)continue;checkedRoots++;
        if(data[((MIDGROUND.base-2)*2048+x)*4+3]<240)holes++;
      }
      const layout=api.layout(),hill=layout.find(l=>l.id==='foothills'),trees=layout.find(l=>l.id==='trees');
      result.push({camera,holes,checkedRoots,hillPhase:hill.phase,treePhase:trees.phase});
    }api.reset();return result;
  })()`);
  assert(report.checks.midgroundConnection.some(item=>item.checkedRoots>0),'inspect actual forest roots as well as open banks');
  for(const item of report.checks.midgroundConnection){assert.equal(item.holes,0,'each present forest slope reaches the shore');assert.equal(item.hillPhase,item.treePhase,'hill and tree foot cannot drift apart');}
  // Exercise actual visible playback in both directions, then verify exact pause.
  await b.evaluate('LayeredWallpaper.renderAt(350,0);LayeredWallpaper.direction(1);document.getElementById("play").click()');
  const start=await b.evaluate('({camera:LayeredWallpaper.state.camera,time:LayeredWallpaper.state.time,frames:LayeredWallpaper.stats.frames})');await sleep(2200);
  const right=await b.evaluate('({camera:LayeredWallpaper.state.camera,time:LayeredWallpaper.state.time,frames:LayeredWallpaper.stats.frames})');assert(right.camera>start.camera);assert(right.frames>start.frames+20);
  await b.evaluate('document.getElementById("left").click()');await sleep(2200);
  const left=await b.evaluate('({camera:LayeredWallpaper.state.camera,time:LayeredWallpaper.state.time,frames:LayeredWallpaper.stats.frames})');assert(left.camera<right.camera);
  await b.evaluate('document.getElementById("play").click()');const paused=await b.evaluate('({camera:LayeredWallpaper.state.camera,time:LayeredWallpaper.state.time,frames:LayeredWallpaper.stats.frames})');await sleep(350);assert.deepEqual(await b.evaluate('({camera:LayeredWallpaper.state.camera,time:LayeredWallpaper.state.time,frames:LayeredWallpaper.stats.frames})'),paused);
  report.checks.actualPlayback={start,right,left,paused};report.playbackStats=await b.evaluate('LayeredWallpaper.stats');
  // Disabling a reflected object affects both halves of the rendered image.
  report.checks.reflectionVisibility=await b.evaluate(`(() => {LayeredWallpaper.renderAt(0,0);LayeredWallpaper.setSettings({ripple:false,wind:false});const c=document.getElementById('scene'),ctx=c.getContext('2d'),a=ctx.getImageData(0,0,2048,768).data;LayeredWallpaper.setVisibility('bridge-piers',false);const b=ctx.getImageData(0,0,2048,768).data;let above=0,below=0;for(let y=0;y<768;y++)for(let x=0;x<2048;x++){let p=(y*2048+x)*4;if(a[p]!==b[p]||a[p+1]!==b[p+1]||a[p+2]!==b[p+2]){if(y<562)above++;else below++;}}LayeredWallpaper.reset();return{above,below};})()`);
  assert(report.checks.reflectionVisibility.above>1000);assert(report.checks.reflectionVisibility.below>1000);
  // A selected isolated layer can still be hidden using its actual checkbox.
  report.checks.singleVisibility=await b.evaluate(`(() => {LayeredWallpaper.select('understory');LayeredWallpaper.view('single');document.querySelector('.layer[data-id="understory"] input').click();const d=document.getElementById('scene').getContext('2d').getImageData(0,0,2048,768).data;let opaque=0;for(let i=3;i<d.length;i+=4)if(d[i])opaque++;LayeredWallpaper.reset();return opaque;})()`);assert.equal(report.checks.singleVisibility,0);
  await b.evaluate("LayeredWallpaper.view('materials')");await b.screenshot(resolve(out,'materials.png'));await b.evaluate("LayeredWallpaper.view('scene')");
  // Browser viewport fit and responsive controls.
  await b.viewport(390,844);await b.screenshot(resolve(out,'mobile.png'));
  report.checks.mobile=await b.evaluate('({viewport:innerWidth,content:document.documentElement.scrollWidth})');assert(report.checks.mobile.content<=report.checks.mobile.viewport);
  assert.deepEqual(b.errors,[]);report.consoleErrors=b.errors;
  report.sourceHashes=Object.fromEntries(['cases/blue-sky-layered/world.mjs','cases/blue-sky-layered/renderer.js','cases/blue-sky-layered/starry-steam.js','cases/blue-sky-layered/music.js','themes/blue-sky-train/lab/layered-stream/app.js'].map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]));
  report.passed=true;writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}catch(error){report.passed=false;report.error=error.stack;report.consoleErrors=b.errors;writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');throw error;}finally{await b.close();}
