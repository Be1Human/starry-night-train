import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {browserHarness,root,until} from './browser-harness.mjs';
import {MATERIALS} from '../cases/blue-sky-layered/world.mjs';
const out=resolve(root,process.env.LAYERED_VERIFICATION_DIR||'docs/verification/layered-stream-r11');mkdirSync(out,{recursive:true});
const b=await browserHarness(),report={date:new Date().toISOString(),checks:{}};
try{
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`(() => {const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,options){return get.call(this,type,type==='2d'?{...options,willReadFrequently:true}:options);};})()`});
  await b.viewport(1600,1000);await b.go(`${b.base}/themes/blue-sky-train/lab/layered-stream/index.html?paused=1`);
  await until(()=>b.evaluate('Boolean(window.LayeredWallpaper?.state.ready)'),'terrain ready');
  // Compare the actual prepared bitmap to an equal-size crop of its source.
  // Every alpha pixel must keep its original position, and colour corrections
  // must remain inside the small seam band. This catches per-column ridge warp.
  report.checks.sourceGeometry=await b.evaluate(`(async () => {
    const result=[];
    for(const asset of Object.values(LayeredWallpaper.scene.assets).filter(a=>a.terrain)){
      const image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src='/'+asset.path;});
      const c=document.createElement('canvas');c.width=asset.width;c.height=asset.height;
      c.getContext('2d').drawImage(image,...asset.sourceRect,0,0,asset.width,asset.height);
      const original=c.getContext('2d').getImageData(0,0,c.width,c.height).data,current=asset.image.getContext('2d').getImageData(0,0,c.width,c.height).data;
      let alphaChanges=0,interiorColourChanges=0;
      for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const p=(y*c.width+x)*4;if(original[p+3]!==current[p+3])alphaChanges++;if(x>=asset.seam.feather&&original[p+3]===255)for(let ch=0;ch<3;ch++)if(original[p+ch]!==current[p+ch])interiorColourChanges++;}
      result.push({id:asset.id,sourceRect:asset.sourceRect,seam:asset.seam,alphaChanges,interiorColourChanges});
    }return result;
  })()`);
  assert.equal(report.checks.sourceGeometry.length,MATERIALS.filter(a=>a.terrain).length);
  for(const item of report.checks.sourceGeometry){assert.equal(item.alphaChanges,0,'source silhouette cannot move');assert.equal(item.interiorColourChanges,0,'terrain interior cannot be resampled');assert(item.seam.ridgeDifference<=1,'join must use matching natural ridge heights');}
  // A uniformly scaled polygon crop still passes the transform checks below.
  // Also check every source alpha pixel, including both outer slopes, against
  // the bitmap actually drawn. Only fully transparent margins may be removed.
  report.checks.completeHills=await b.evaluate(`(async () => {
    const result=[];
    for(const asset of Object.values(LayeredWallpaper.scene.assets).filter(a=>a.hill||a.clusters)){
      const image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src='/'+asset.path;});
      const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);
      const raw=ctx.getImageData(0,0,c.width,c.height).data,current=asset.image.getContext('2d').getImageData(0,0,asset.width,asset.height).data;
      const [left,top,w,h]=asset.sourceRect;let discardedPaint=0,alphaErrors=0,edgeAlphaErrors=0,colourErrors=0,opaqueCore=0;
      let x0=c.width,y0=c.height,x1=-1,y1=-1;
      for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
        const p=(y*c.width+x)*4,a=raw[p+3];if(a>128){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
        if(x<left||x>=left+w||y<top||y>=top+h){if(a)discardedPaint++;continue;}
        const q=((y-top)*w+x-left)*4,expected=asset.hill&&a>=240?255:a;
        if(current[q+3]!==expected)alphaErrors++;if(a<240&&current[q+3]!==a)edgeAlphaErrors++;
        if(a>=240){if(current[q+3]===255)opaqueCore++;for(let ch=0;ch<3;ch++)if(Math.abs(raw[p+ch]-current[q+ch])>1)colourErrors++;}
      }
      const ends=[];for(const t of [.025,.975]){const x=Math.round(x0+(x1-x0)*t);let y=0;while(y<c.height&&raw[(y*c.width+x)*4+3]<=128)y++;ends.push({t,x,y,descent:(y-y0)/(y1-y0)});}
      result.push({id:asset.id,path:asset.path,sourceRect:asset.sourceRect,sourceSize:[c.width,c.height],discardedPaint,alphaErrors,edgeAlphaErrors,colourErrors,opaqueCore,groundY:asset.groundY+top,opaqueBounds:[x0,y0,x1,y1],ends,clusterUsesSameBitmap:!asset.cluster||asset.cluster.image===asset.image});
    }return result;
  })()`);
  assert.equal(report.checks.completeHills.length,3);
  for(const hill of report.checks.completeHills){
    assert.equal(hill.discardedPaint,0,'no painted slope or tree can be cut off');
    assert.equal(hill.alphaErrors,0,'runtime silhouette must match the supplied complete painting');
    assert.equal(hill.edgeAlphaErrors,0,'antialiased hill outline cannot be replaced by a mask');
    assert.equal(hill.colourErrors,0,'hill texture keeps its source pixel coordinates');
    assert(hill.clusterUsesSameBitmap,'cluster material cannot have a second masked outline');
    for(const end of hill.ends)assert(end.descent>.60,'both complete slopes must descend toward the foot inside the asset');
    assert(hill.opaqueBounds[0]>0&&hill.opaqueBounds[2]<hill.sourceSize[0]-1&&hill.opaqueBounds[1]>0,'painted silhouette fits inside its source');
    if(hill.id==='rail-hill')assert(hill.opaqueCore>100000,'local hill has a solid core to hide the train');
  }

  // Observe real Canvas calls, including their transformation matrices, rather
  // than trusting configuration names. Both axes must have the same scale.
  report.checks.drawProportions=await b.evaluate(`(() => {
    const api=LayeredWallpaper,scene=api.scene,contexts=[scene.landCtx,scene.ctx],originals=contexts.map(ctx=>ctx.drawImage),images=new Map(),draws=[];
    for(const asset of Object.values(scene.assets).filter(a=>a.terrain||a.cutout||a.id==='low-shrub')){
      images.set(asset.image,asset.id);
      if(asset.cluster)images.set(asset.cluster.image,asset.id);
      for(const [key,image] of scene.tinted)if(key.startsWith(asset.id+'#')||key.startsWith(asset.id+'@cluster#'))images.set(image,asset.id);
    }
    contexts.forEach((ctx,index)=>ctx.drawImage=function(...args){
      const id=images.get(args[0]);if(id){const m=this.getTransform(),image=args[0],sw=args.length===9?args[3]:image.width,sh=args.length===9?args[4]:image.height,dw=args.length===9?args[7]:args.length===5?args[3]:sw,dh=args.length===9?args[8]:args.length===5?args[4]:sh;
        draws.push({camera:api.state.camera,id,scaleX:Math.hypot(m.a,m.b)*dw/sw,scaleY:Math.hypot(m.c,m.d)*dh/sh,shear:m.a*m.c+m.b*m.d,positiveOrientation:m.a*m.d-m.b*m.c>0});}
      return originals[index].apply(this,args);
    });
    try{for(const camera of [-12345678,-2048,0,2048,12345678,15200,-15200])api.renderAt(camera,8);}finally{contexts.forEach((ctx,index)=>ctx.drawImage=originals[index]);}
    return draws;
  })()`);
  assert(report.checks.drawProportions.length>20);
  for(const id of ['mountain-blue','mountain-green','midground-forest','rail-hill','low-shrub'])assert(report.checks.drawProportions.some(item=>item.id===id),'actual draws exercise every terrain and bank shrub material');
  for(const item of report.checks.drawProportions){assert(Math.abs(item.scaleX-item.scaleY)<1e-9,item.id+' paint cannot be stretched');assert(Math.abs(item.shear)<1e-9,'terrain and bank shrubs cannot be sheared');assert(item.positiveOrientation,'repeats keep the original lighting direction');}

  report.checks.timeInvariant=await b.evaluate(`(() => {const api=LayeredWallpaper,result=[];for(const id of ['mountains-far','mountains-near','foothills','trees']){api.select(id);api.view('single');api.renderAt(15200,0);const png=api.exportPNG();api.renderAt(15200,13.7);result.push({id,identical:api.exportPNG()===png});}api.reset();return result;})()`);
  for(const item of report.checks.timeInvariant)assert(item.identical,'water animation must not deform the terrain');
  report.consoleErrors=b.errors;assert.deepEqual(b.errors,[]);
  report.sourceHashes=Object.fromEntries(['cases/blue-sky-layered/world.mjs','cases/blue-sky-layered/renderer.js',...MATERIALS.filter(a=>a.terrain||a.cutout).map(a=>a.path)].map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]));
  report.passed=true;writeFileSync(resolve(out,'terrain-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:true,sourceGeometry:report.checks.sourceGeometry,completeHills:report.checks.completeHills,proportionDraws:report.checks.drawProportions.length,timeInvariant:report.checks.timeInvariant},null,2));
}catch(error){report.passed=false;report.error=error.stack;writeFileSync(resolve(out,'terrain-report.json'),JSON.stringify(report,null,2)+'\n');throw error;}finally{await b.close();}
