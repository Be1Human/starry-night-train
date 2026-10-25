import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {browserHarness,root,until} from './browser-harness.mjs';
const out=resolve(root,process.env.LAYERED_VERIFICATION_DIR||'docs/verification/layered-stream-r17-foreground');mkdirSync(out,{recursive:true});
const b=await browserHarness(),report={date:new Date().toISOString(),checks:{}};
try{
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,o){return get.call(this,t,t==='2d'?{...o,willReadFrequently:true}:o);};})()`});
  await b.go(`${b.base}/themes/blue-sky-train/lab/layered-stream/index.html?paused=1`);await until(()=>b.evaluate('Boolean(window.LayeredWallpaper?.state.ready)'),'foreground');
  report.checks.silhouettes=await b.evaluate(`(()=>{
    const f=LayeredWallpaper.scene.foreground,masks=[],result=[];
    for(let i=0;i<4;i++){const m=f.motifs['canopy-'+i],c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.drawImage(m.variants[3],0,0,128,128);masks.push(ctx.getImageData(0,0,128,128).data);}
    for(let a=0;a<4;a++)for(let b=a+1;b<4;b++){let intersection=0,union=0;for(let p=3;p<masks[a].length;p+=4){const x=masks[a][p]>=128,y=masks[b][p]>=128;if(x&&y)intersection++;if(x||y)union++;}result.push({a,b,overlap:intersection/union});}return result;
  })()`);
  for(const p of report.checks.silhouettes)assert(p.overlap<.94,'the four canopy silhouettes must actually differ');
  report.checks.playback=await b.evaluate(`(async()=>{
    const api=LayeredWallpaper,ctx=api.scene.ctx,read=()=>ctx.getImageData(0,0,2048,768).data,{FOREGROUND}=await import('/cases/blue-sky-layered/foreground.js');
    const diff=(a,b)=>{let sum=0,count=0;for(let p=0;p<a.length;p++){const d=Math.abs(a[p]-b[p]);sum+=d;if(d>4)count++;}return{mean:sum/a.length,changedChannels:count};};
    const result=[];for(const [id,cfg]of Object.entries(FOREGROUND)){
      api.select(id);api.view('single');api.setSettings({wind:false,seed:42});api.renderAt(-1024,8);const original=api.exportPNG();api.renderAt(12345678,8);api.renderAt(-12345678,8);api.renderAt(-1024,8);const replay=api.exportPNG()===original;api.direction(1);const direction=api.exportPNG()===original;api.renderAt(-1024,35);const windOffStable=api.exportPNG()===original;
      api.setSettings({seed:137});const seedDifferent=api.exportPNG()!==original;api.setSettings({seed:42});const seedReplay=api.exportPNG()===original;
      const translations=[];for(const camera of [-12345678,-1024,0,12345678]){api.renderAt(camera,8);const a=read();api.renderAt(camera+10,8);const b=read(),shift=Math.round(cfg.depth*10);let error=0;for(let y=0;y<768;y++)for(let x=0;x<2048-shift;x++)for(let ch=0;ch<4;ch++)error+=Math.abs(a[(y*2048+x+shift)*4+ch]-b[(y*2048+x)*4+ch]);translations.push({camera,mean:error/(768*(2048-shift)*4)});}
      const boundaries=[];for(const sign of [-1,1]){const camera=(sign*cfg.span+cfg.offset)/cfg.depth;api.renderAt(camera-.005,8);const a=read();api.renderAt(camera+.005,8);boundaries.push({sign,...diff(a,read())});}
      api.setSettings({wind:true});api.renderAt(-1024,8);const a=read();api.renderAt(-1024,9.7);const moving=diff(a,read());api.renderAt(-1024,8);const windReplay=diff(a,read());
      const species=new Set(),counts=[],shapes=new Set();for(let camera=-50000;camera<=50000;camera+=512){const plants=api.scene.foreground.instances({...api.state,camera},id==='branches');counts.push(plants.length);for(const p of plants){species.add(p.species);shapes.add([p.species,p.height.toFixed(1),p.lean.toFixed(3),p.tone].join(':'));}}
      api.setVisibility(id,false);const hidden=read();let residual=0;for(let p=3;p<hidden.length;p+=4)if(hidden[p])residual++;
      result.push({id,replay,direction,windOffStable,seedDifferent,seedReplay,translations,boundaries,moving,windReplay,minimumCount:Math.min(...counts),maximumCount:Math.max(...counts),species:[...species],distinctPoses:shapes.size,residual});
    }api.reset();api.setSettings({wind:true});api.renderAt(0,8);return result;
  })()`);
  for(const p of report.checks.playback){assert(p.replay&&p.direction&&p.windOffStable&&p.seedDifferent&&p.seedReplay);assert.equal(p.residual,0);assert(p.maximumCount<=20);assert(p.minimumCount<p.maximumCount,'patches must have different density');assert(p.distinctPoses>30);assert(p.moving.changedChannels>1000,'foreground wind must animate actual visible pixels');assert.equal(p.windReplay.changedChannels,0);for(const s of p.translations)assert(s.mean<.04,'vegetation cannot slide relative to its world position');for(const s of p.boundaries)assert(s.mean<.1,'world cells must enter without a visible pop');}
  assert.equal(report.checks.playback.find(p=>p.id==='branches').species.filter(id=>id.startsWith('canopy-')).length,4);
  report.motifBytes=await b.evaluate('LayeredWallpaper.scene.foreground.textureBytes');report.consoleErrors=b.errors;assert.deepEqual(b.errors,[]);
  report.sourceHashes=Object.fromEntries(['cases/blue-sky-layered/foreground.js','cases/blue-sky-layered/world.mjs','cases/blue-sky-layered/renderer.js','assets/blue-sky-train/foliage/r17/canopy-atlas.png'].map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]));
  report.passed=true;writeFileSync(resolve(out,'foreground-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}catch(error){report.passed=false;report.error=error.stack;writeFileSync(resolve(out,'foreground-report.json'),JSON.stringify(report,null,2)+'\n');throw error;}finally{await b.close();}
