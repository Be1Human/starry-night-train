import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname,basename,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {setTimeout as sleep} from 'node:timers/promises';
import {browserHarness,root,until} from './browser-harness.mjs';
import {SCENE_MUSIC} from '../cases/blue-sky-layered/music.js';
const technical=JSON.parse(readFileSync(resolve(root,dirname(SCENE_MUSIC.path),'technical-report.json')));
const expectedDuration=technical.files[basename(SCENE_MUSIC.path)].duration;
const offline=process.argv.includes('--offline'),out=resolve(root,process.env.LAYERED_VERIFICATION_DIR||'docs/verification/layered-stream-music-r02');mkdirSync(out,{recursive:true});
const b=await browserHarness(),report={date:new Date().toISOString(),networkDisabled:offline,checks:{},audibleQuality:'User audition pending; headless browser output is muted.'};
try{
  await b.viewport(1600,1000);
  if(offline){await b.send('Network.enable');await b.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});}
  await b.go(offline?pathToFileURL(resolve(root,process.env.LAYERED_OUTPUT_DIR||'dist/blue-sky-layered','index.html')).href+'?paused=1&controls=1':`${b.base}/themes/blue-sky-train/lab/layered-stream/index.html?paused=1&revision=music-r02`);
  await until(()=>b.evaluate('Boolean(window.LayeredWallpaper?.state.ready)'),'scene ready');
  await until(()=>b.evaluate('Number.isFinite(LayeredWallpaper.music.state.duration)'),'music decoded');
  const initial=await b.evaluate('LayeredWallpaper.music.state');assert.equal(initial.enabled,false);assert.equal(initial.playing,false);assert(Math.abs(initial.duration-expectedDuration)<.2);assert.equal(initial.loop,true);assert.equal(initial.title,SCENE_MUSIC.title);
  if(!offline)assert((await b.evaluate('document.getElementById("scene-music").src')).endsWith(SCENE_MUSIC.path),'page must play the newly selected track');
  report.checks.initial=initial;
  assert.equal(await b.evaluate('document.getElementById("scene-music").src.startsWith("data:audio/mpeg;")'),offline);
  if(!offline){await b.evaluate('LayeredWallpaper.renderAt(0,8)');writeFileSync(resolve(out,'start.png'),Buffer.from((await b.evaluate('LayeredWallpaper.exportPNG()')).split(',')[1],'base64'));await b.screenshot(resolve(out,'workbench-music.png'));}
  // The stage button must be reachable without finding the card below the
  // fold, including in wallpaper mode where that entire card is hidden.
  report.checks.quickControl=[];
  for(const width of [1000,390]){
    await b.viewport(width,844);
    for(const wallpaper of [false,true]){
      const point=await b.evaluate(`(() => {document.body.classList.toggle('wallpaper',${wallpaper});const button=document.getElementById('scene-music-quick-toggle'),r=button.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,display:getComputedStyle(button).display,reachable:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===button,contentWidth:document.documentElement.scrollWidth,viewport:innerWidth};})()`);
      assert(point.width>50&&point.height>25&&point.display!=='none'&&point.reachable,'music is directly reachable over the scene');assert(point.contentWidth<=point.viewport,'music control fits the viewport');report.checks.quickControl.push({width,wallpaper,...point});
    }
  }
  await b.evaluate("document.body.classList.remove('wallpaper')");await b.viewport(1600,1000);
  assert.equal(await b.evaluate('LayeredWallpaper.state.paused'),true);
  await b.send('Runtime.evaluate',{expression:'document.getElementById("scene-music-quick-toggle").click()',userGesture:true});
  await until(()=>b.evaluate('LayeredWallpaper.music.state.playing'),'real media playback');
  await until(()=>b.evaluate('LayeredWallpaper.music.state.currentTime>.05'),'audio clock advances');report.checks.gesturePlayback=true;
  assert.equal(await b.evaluate('LayeredWallpaper.state.paused'),false,'music click also resumes a paused scene');report.checks.startFromPausedScene=true;
  // Inspect real decoded PCM flowing to the output, not merely a play() call.
  report.checks.outputSignal=await b.evaluate(`(async () => {
    const element=document.getElementById('scene-music'),context=new AudioContext(),source=context.createMediaElementSource(element),meter=context.createAnalyser();meter.fftSize=2048;source.connect(meter);meter.connect(context.destination);await context.resume();
    const data=new Float32Array(meter.fftSize);let peak=0,sum=0,samples=0;
    for(let frame=0;frame<12;frame++){await new Promise(r=>setTimeout(r,50));meter.getFloatTimeDomainData(data);for(const value of data){peak=Math.max(peak,Math.abs(value));sum+=value*value;samples++;}}
    source.disconnect();meter.disconnect();source.connect(context.destination);window.musicTestContext=context;
    return{peak,rms:Math.sqrt(sum/samples),context:context.state,muted:element.muted,volume:element.volume,readyState:element.readyState};
  })()`);
  assert(report.checks.outputSignal.peak>.001&&report.checks.outputSignal.rms>.0001,'decoded audio contains a non-silent output signal');assert.equal(report.checks.outputSignal.muted,false);assert(report.checks.outputSignal.volume>0);
  await b.evaluate('LayeredWallpaper.pause(true)');const frozen=await b.evaluate('({audio:LayeredWallpaper.music.state.currentTime,camera:LayeredWallpaper.state.camera,time:LayeredWallpaper.state.time})');await sleep(250);
  const paused=await b.evaluate('({audio:LayeredWallpaper.music.state.currentTime,camera:LayeredWallpaper.state.camera,time:LayeredWallpaper.state.time})');assert.deepEqual(paused,frozen);assert.equal(await b.evaluate('LayeredWallpaper.music.state.playing'),false);
  await b.evaluate('LayeredWallpaper.pause(false)');await until(()=>b.evaluate('LayeredWallpaper.music.state.playing'),'resume');report.checks.scenePauseAndResume=true;
  await b.evaluate('wallpaperPropertyListener.setPaused(true)');assert.equal(await b.evaluate('LayeredWallpaper.music.state.playing'),false);
  await b.evaluate('wallpaperPropertyListener.setPaused(false)');await until(()=>b.evaluate('LayeredWallpaper.music.state.playing'),'host resume');report.checks.hostPauseAndResume=true;
  await b.evaluate('document.getElementById("scene-music-volume").value="41";document.getElementById("scene-music-volume").dispatchEvent(new Event("input"))');
  assert.equal(await b.evaluate('document.getElementById("scene-music").volume'),.41);report.checks.volume=true;
  await b.evaluate('LayeredWallpaper.view("materials")');assert.equal(await b.evaluate('LayeredWallpaper.music.state.playing'),false);
  await b.evaluate('LayeredWallpaper.view("scene")');await until(()=>b.evaluate('LayeredWallpaper.music.state.playing'),'scene view resume');report.checks.materialPreviewSilent=true;
  await b.evaluate('LayeredWallpaper.view("single")');
  await b.send('Runtime.evaluate',{expression:'document.getElementById("scene-music-toggle").click()',userGesture:true});
  await until(()=>b.evaluate('LayeredWallpaper.music.state.playing'),'music returns to scene');assert.equal(await b.evaluate('LayeredWallpaper.state.view'),'scene');report.checks.startFromLayerPreview=true;
  await b.evaluate('document.getElementById("scene-music-volume").value="0";document.getElementById("scene-music-volume").dispatchEvent(new Event("input"))');assert.equal(await b.evaluate('LayeredWallpaper.music.state.muted'),true);
  await b.send('Runtime.evaluate',{expression:'document.getElementById("scene-music-quick-toggle").click()',userGesture:true});
  assert.equal(await b.evaluate('LayeredWallpaper.music.state.volume'),.41,'explicit unmute restores the last audible volume');assert.equal(await b.evaluate('LayeredWallpaper.music.state.muted'),false);report.checks.unmuteZeroVolume=true;
  await b.evaluate('document.getElementById("scene-music").currentTime=LayeredWallpaper.music.state.duration-.18');
  await until(()=>b.evaluate('LayeredWallpaper.music.state.currentTime<1&&LayeredWallpaper.music.state.playing'),'actual audio loop boundary');report.checks.actualLoopWrap=true;
  await b.evaluate('wallpaperPropertyListener.applyUserProperties({music:{value:true}});document.getElementById("scene-music-toggle").click();wallpaperPropertyListener.applyUserProperties({speed:{value:1},musicVolume:{value:28}})');
  assert.equal(await b.evaluate('LayeredWallpaper.music.state.enabled'),false,'unrelated host properties cannot undo user mute');assert.equal(await b.evaluate('LayeredWallpaper.music.state.volume'),.28);report.checks.userMuteRetained=true;
  await b.evaluate('wallpaperPropertyListener.applyUserProperties({music:{value:false},musicVolume:{value:20}})');assert.equal(await b.evaluate('LayeredWallpaper.music.state.playing'),false);assert.equal(await b.evaluate('LayeredWallpaper.music.state.volume'),.2);report.checks.hostMusicProperties=true;
  if(!offline){await b.evaluate('LayeredWallpaper.renderAt(15200,8)');await b.screenshot(resolve(out,'music-control-desktop.png'));await b.viewport(390,844);await b.screenshot(resolve(out,'mobile-music.png'));assert((await b.evaluate('document.documentElement.scrollWidth'))<=390);report.checks.mobile=true;}
  const sourcePaths=['cases/blue-sky-layered/music.js','themes/blue-sky-train/lab/layered-stream/app.js','themes/blue-sky-train/lab/layered-stream/index.html',SCENE_MUSIC.path];
  if(offline)sourcePaths.push(relative(root,resolve(root,process.env.LAYERED_OUTPUT_DIR||'dist/blue-sky-layered','index.html')));
  report.sourceHashes=Object.fromEntries(sourcePaths.map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]));
  report.consoleErrors=b.errors;assert.deepEqual(b.errors,[]);report.passed=true;
  writeFileSync(resolve(out,offline?'offline-music-report.json':'music-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}catch(error){report.passed=false;report.error=error.stack;writeFileSync(resolve(out,offline?'offline-music-report.json':'music-report.json'),JSON.stringify(report,null,2)+'\n');throw error;}finally{await b.close();}
