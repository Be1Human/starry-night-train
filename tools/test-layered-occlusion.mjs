import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {browserHarness,root,until} from './browser-harness.mjs';
const out=resolve(root,process.env.LAYERED_VERIFICATION_DIR||'docs/verification/layered-stream-r11');mkdirSync(out,{recursive:true});
const b=await browserHarness(),report={date:new Date().toISOString(),checks:{}};
try{
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`(() => {const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,options){return get.call(this,type,type==='2d'?{...options,willReadFrequently:true}:options);};})()`});
  await b.viewport(1600,1000);await b.go(`${b.base}/themes/blue-sky-train/lab/layered-stream/index.html?paused=1`);await until(()=>b.evaluate('Boolean(window.LayeredWallpaper?.state.ready)'),'occlusion ready');
  report.checks.passes=await b.evaluate(`(async () => {
    const api=LayeredWallpaper,ctx=api.scene.ctx,read=()=>ctx.getImageData(0,0,2048,768).data;
    const {RAIL_HILLS}=await import('/cases/blue-sky-layered/world.mjs');
    api.setSettings({ripple:false,wind:false});for(const id of ['steam','understory','branches'])api.setVisibility(id,false);
    const asset=api.scene.assets['rail-hill'],pixels=asset.image.getContext('2d').getImageData(0,0,asset.width,asset.height).data;
    let top=asset.height,peakX=0,n=0;
    for(let y=0;y<asset.height;y++){for(let x=0;x<asset.width;x++)if(pixels[(y*asset.width+x)*4+3]>250){if(y<top){top=y;peakX=0;n=0;}if(y===top){peakX+=x;n++;}}if(n)break;}
    peakX/=n;let origin;
    for(let camera=-100000;camera<=100000;camera+=1024){
      const candidate=api.scene.railHillInstances({...api.state,camera})[0];
      if(candidate){origin={...candidate,x:candidate.x+camera*RAIL_HILLS.depth};break;}
    }
    if(!origin)throw Error('No local hill found in the sampled route');
    const changed=(a,b,y0,y1,x0,x1)=>{let count=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const p=(y*2048+x)*4;if(Math.abs(a[p]-b[p])+Math.abs(a[p+1]-b[p+1])+Math.abs(a[p+2]-b[p+2])>3)count++;}return count;};
    const result=[];
    for(const direction of [-1,1]){
      api.direction(direction);const centre=direction<0?1247:1461,hit=(origin.x+peakX*origin.scale-centre)/RAIL_HILLS.depth;
      const sequence=[];
      for(const [stage,camera] of [['before',hit-direction*700],['covered',hit],['after',hit+direction*700]]){
        api.renderAt(camera,8);const sample={stage,camera};
        for(const hills of [false,true]){
          api.setVisibility('rail-hills',hills);api.setVisibility('engine',false);const hidden=read();api.setVisibility('engine',true);const visible=read();
          sample[hills?'withHill':'withoutHill']={train:changed(hidden,visible,445,485,centre-60,centre+60),reflection:changed(hidden,visible,563,610,centre-60,centre+60)};
        }
        sample.trainRatio=sample.withHill.train/sample.withoutHill.train;sample.reflectionRatio=sample.withHill.reflection/sample.withoutHill.reflection;sequence.push(sample);
      }
      api.renderAt(hit,8);api.setVisibility('rail-hills',false);api.setVisibility('engine',false);const background=read();api.setVisibility('engine',true);const engine=read();
      api.setVisibility('rail-hills',true);api.select('rail-hills');api.view('single');const mask=read();api.view('scene');api.setVisibility('engine',false);const behind=read();api.setVisibility('engine',true);const front=read();
      let opaqueTrainOverlap=0,leakedTrainPixels=0;
      for(let y=445;y<485;y++)for(let x=centre-60;x<centre+60;x++){const p=(y*2048+x)*4,old=Math.abs(background[p]-engine[p])+Math.abs(background[p+1]-engine[p+1])+Math.abs(background[p+2]-engine[p+2]);if(mask[p+3]===255&&old>3){opaqueTrainOverlap++;if(Math.abs(behind[p]-front[p])+Math.abs(behind[p+1]-front[p+1])+Math.abs(behind[p+2]-front[p+2])>3)leakedTrainPixels++;}}
      api.setVisibility('engine',false);api.setVisibility('bridge-deck',false);const noDeck=read();api.setVisibility('bridge-deck',true);const deck=read();let opaqueDeckOverlap=0,leakedDeckPixels=0;
      for(let y=470;y<489;y++)for(let x=centre-150;x<centre+150;x++){const p=(y*2048+x)*4;if(mask[p+3]===255){opaqueDeckOverlap++;if(Math.abs(noDeck[p]-deck[p])+Math.abs(noDeck[p+1]-deck[p+1])+Math.abs(noDeck[p+2]-deck[p+2])>3)leakedDeckPixels++;}}
      api.setVisibility('engine',true);
      result.push({direction,hit,sequence,opaqueTrainOverlap,leakedTrainPixels,opaqueDeckOverlap,leakedDeckPixels,engineVisibility:api.state.visibility.engine});
    }
    api.reset();api.setSettings({ripple:true,wind:true});return result;
  })()`);
  for(const pass of report.checks.passes){
    const [before,covered,after]=pass.sequence;
    assert(before.trainRatio>.99&&after.trainRatio>.99,'train reappears on both sides of the hill');
    assert(covered.trainRatio<.8,'a passing hill visibly hides part of the engine');
    assert(covered.reflectionRatio<.8,'reflected train must also pass behind the local hill');
    assert(pass.opaqueTrainOverlap>100&&pass.opaqueDeckOverlap>100);
    assert.equal(pass.leakedTrainPixels,0,'opaque hill must actually occlude train pixels');assert.equal(pass.leakedDeckPixels,0,'track cannot render over the hill');assert(pass.engineVisibility,'occlusion must not hide or fade the train layer');
  }

  report.checks.world=await b.evaluate(`(async () => {
    const api=LayeredWallpaper,{RAIL_HILLS}=await import('/cases/blue-sky-layered/world.mjs');api.select('rail-hills');api.view('single');api.renderAt(0,8);const initial=api.exportPNG(),counts=[];
    for(const camera of [-12345678,-2048,0,2048,12345678]){api.renderAt(camera,8);counts.push({camera,sprites:api.stats.railHills.sprites});}
    api.renderAt(0,8);const replay=api.exportPNG()===initial;api.renderAt(0,24);const timeInvariant=api.exportPNG()===initial;
    const ctx=api.scene.ctx,original=ctx.drawImage,scales=[];ctx.drawImage=function(image,...args){if(image===api.scene.assets['rail-hill'].image){const m=this.getTransform();scales.push([Math.hypot(m.a,m.b),Math.hypot(m.c,m.d)]);}return original.call(this,image,...args);};
    try{api.renderAt(${JSON.stringify(report.checks.passes[0].hit)},8);}finally{ctx.drawImage=original;}
    const boundaries=[];for(const sign of [-1,1]){const camera=(sign*RAIL_HILLS.span+RAIL_HILLS.offset)/RAIL_HILLS.depth;api.renderAt(camera-.005,8);const a=ctx.getImageData(0,0,2048,768).data;api.renderAt(camera+.005,8);const b=ctx.getImageData(0,0,2048,768).data;let sum=0;for(let p=0;p<a.length;p++)sum+=Math.abs(a[p]-b[p]);boundaries.push({sign,meanChannelError:sum/a.length});}
    document.querySelector('.layer[data-id="rail-hills"] input').click();const hidden=ctx.getImageData(0,0,2048,768).data;let residual=0;for(let p=3;p<hidden.length;p+=4)if(hidden[p])residual++;
    api.reset();return{counts,replay,timeInvariant,scales,boundaries,hiddenResidual:residual};
  })()`);
  const world=report.checks.world;assert(world.replay&&world.timeInvariant);assert.equal(world.hiddenResidual,0);assert(world.scales.length>0);
  for(const [x,y] of world.scales)assert(Math.abs(x-y)<1e-9,'small hills keep uniform scale');
  for(const point of world.counts)assert(point.sprites<=2,'sparse hills stay bounded at distant coordinates');
  for(const point of world.boundaries)assert(point.meanChannelError<.1,'hill cells cannot pop at boundaries');
  for(const pass of report.checks.passes)for(const stage of pass.sequence){
    await b.evaluate(`LayeredWallpaper.reset();LayeredWallpaper.direction(${pass.direction});LayeredWallpaper.renderAt(${stage.camera},8)`);
    writeFileSync(resolve(out,`occlusion-${pass.direction<0?'left':'right'}-${stage.stage}.png`),Buffer.from((await b.evaluate('LayeredWallpaper.exportPNG()')).split(',')[1],'base64'));
  }
  report.consoleErrors=b.errors;assert.deepEqual(b.errors,[]);
  report.sourceHashes=Object.fromEntries(['cases/blue-sky-layered/world.mjs','cases/blue-sky-layered/renderer.js','themes/blue-sky-train/lab/layered-stream/app.js','assets/blue-sky-train/layered-stream/r11/lakeside-knoll.png'].map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]));
  report.passed=true;writeFileSync(resolve(out,'occlusion-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}catch(error){report.passed=false;report.error=error.stack;writeFileSync(resolve(out,'occlusion-report.json'),JSON.stringify(report,null,2)+'\n');throw error;}finally{await b.close();}
