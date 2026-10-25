import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {browserHarness,root,until} from './browser-harness.mjs';

const out=resolve(root,process.env.LAYERED_VERIFICATION_DIR||'docs/verification/layered-stream-r19-ground-blend');mkdirSync(out,{recursive:true});
const b=await browserHarness(),report={date:new Date().toISOString(),checks:{}};
try{
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,o){return get.call(this,t,t==='2d'?{...o,willReadFrequently:true}:o);};})()`});
  await b.go(`${b.base}/themes/blue-sky-train/lab/layered-stream/index.html?paused=1`);await until(()=>b.evaluate('Boolean(window.LayeredWallpaper?.state.ready)'),'ground blend');
  report.checks.contact=await b.evaluate(`(()=>{
    const api=LayeredWallpaper,scene=api.scene,shore=scene.shore,ctx=scene.ctx,read=()=>ctx.getImageData(0,0,2048,768).data;
    const band=()=>{const c=document.createElement('canvas');c.width=2048;c.height=88;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(shore.canvas,0,0);return ctx.getImageData(0,0,2048,88).data;};
    api.setSettings({ripple:false,wind:false});api.setVisibility('understory',false);api.setVisibility('branches',false);api.renderAt(-530,8);
    const joined=read(),ground=band(),hills=scene.railHillInstances(api.state),set=shore.setContacts;
    try{shore.setContacts=function(image){return set.call(this,image,[],'ablation-empty');};api.renderAt(-530,8);}finally{shore.setContacts=set;}
    const separate=read(),bare=band();let footChanges=0,upperChanges=0,outsideFoot=0,waterChanges=0,coastAlphaChanges=0,opaqueHoles=0;
    for(let y=0;y<768;y++)for(let x=0;x<2048;x++){const p=(y*2048+x)*4,e=Math.abs(joined[p]-separate[p])+Math.abs(joined[p+1]-separate[p+1])+Math.abs(joined[p+2]-separate[p+2]);if(e>3){if(y<528)upperChanges++;if(y>=528&&y<562){footChanges++;if(!hills.some(h=>x>=h.x-22&&x<h.x+h.width+22))outsideFoot++;}if(y>=562)waterChanges++;}}
    for(let y=34;y<88;y++)for(let x=0;x<2048;x++){const p=(y*2048+x)*4;if(ground[p+3]!==bare[p+3])coastAlphaChanges++;if(bare[p+3]===255&&ground[p+3]!==255)opaqueHoles++;}
    api.renderAt(-530,8);const restored=api.exportPNG(),canvas=shore.canvas.toDataURL(),frames=shore.frames;
    api.renderAt(-530,35);api.direction(1);const cached=shore.canvas.toDataURL()===canvas&&shore.frames===frames;
    api.direction(-1);api.renderAt(-530,8);const directionReplay=api.exportPNG()===restored;
    api.renderAt(12345678,8);api.renderAt(-12345678,8);api.renderAt(-530,8);const worldReplay=api.exportPNG()===restored;
    api.setVisibility('rail-hills',false);const cleared=shore.contactCount===0&&!shore.contactCtx.getImageData(0,0,2048,88).data.some((v,i)=>i%4===3&&v);
    api.setVisibility('rail-hills',true);const visibilityReplay=api.exportPNG()===restored;
    api.setSettings({seed:137});api.setSettings({seed:42});const seedReplay=api.exportPNG()===restored;
    const boundaries=[];for(const camera of [-4096,4096]){api.renderAt(camera-.005,8);const a=read();api.renderAt(camera+.005,8);const c=read();let sum=0;for(let y=528;y<616;y++)for(let x=0;x<2048;x++)for(let ch=0;ch<4;ch++){const p=(y*2048+x)*4+ch;sum+=Math.abs(a[p]-c[p]);}boundaries.push({camera,mean:sum/(88*2048*4)});}
    api.reset();api.setSettings({ripple:true,wind:true});api.renderAt(-530,8);
    return{footChanges,upperChanges,outsideFoot,waterChanges,coastAlphaChanges,opaqueHoles,cached,directionReplay,worldReplay,cleared,visibilityReplay,seedReplay,boundaries,backend:shore.stats,error:shore.gl.getError()};
  })()`);
  const c=report.checks.contact;assert(c.footChanges>1000,'shader must visibly join the actual painted foot');assert(c.waterChanges>100,'joined roots also enter the local hill reflection');
  for(const key of ['upperChanges','outsideFoot','coastAlphaChanges','opaqueHoles','error'])assert.equal(c[key],0,key);
  for(const key of ['cached','directionReplay','worldReplay','cleared','visibilityReplay','seedReplay'])assert(c[key],key);
  for(const p of c.boundaries)assert(p.mean<.2,'the joined surface must not pop at world origin boundaries');
  writeFileSync(resolve(out,'joined-runtime.png'),Buffer.from((await b.evaluate('LayeredWallpaper.exportPNG()')).split(',')[1],'base64'));
  assert.deepEqual(b.errors,[]);report.consoleErrors=b.errors;
  report.sourceHashes=Object.fromEntries(['cases/blue-sky-layered/procedural-shore.js','cases/blue-sky-layered/renderer.js'].map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]));
  report.passed=true;writeFileSync(resolve(out,'ground-blend-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}catch(error){report.passed=false;report.error=error.stack;writeFileSync(resolve(out,'ground-blend-report.json'),JSON.stringify(report,null,2)+'\n');throw error;}finally{await b.close();}
