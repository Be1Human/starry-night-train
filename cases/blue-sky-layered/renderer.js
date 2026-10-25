import { WORLD, MIDGROUND, RAIL_HILLS, MOUNTAINS, MATERIALS, SCENE_LAYERS, TRAIN, trainPose, visibleCells, randomAt, sceneryCell } from './world.mjs';
import { StarrySteam, STARRY_STEAM } from './starry-steam.js';
import { ProceduralShore, SHORE } from './procedural-shore.js';
import { FlatCloudField, prepareFlatCloud } from './flat-clouds.js';
import { ForegroundVegetation } from './foreground.js';
const {width:W,height:H,waterline:Y,reflectionPlane:R}=WORLD;
const makeCanvas=(w=W,h=H)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const tintKey=(id,color,alpha,cluster)=>id+(cluster?'@cluster':'')+color+alpha;
const loadImage=url=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('素材加载失败：'+url));image.src=url;});
// Pick matching natural ridge heights near the two edges. Crop horizontally,
// then feather only opaque colours at the join; alpha and all vertical pixel
// coordinates remain those of the painting. No ridge morph or mirroring.
function terrainTile(source){
  const sw=source.width,sh=source.height,data=source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,sw,sh).data,ridges=new Map();
  const ridge=x=>{if(ridges.has(x))return ridges.get(x);let y=0;while(y<sh&&data[(y*sw+x)*4+3]<241)y++;ridges.set(x,y);return y;};
  let best={score:Infinity};
  for(let left=6;left<=192;left++)for(let right=sw-448;right<=sw-64;right++){
    const ridgeDifference=Math.abs(ridge(left)-ridge(right));
    const slopeDifference=Math.abs((ridge(left+6)-ridge(left-6))-(ridge(right+6)-ridge(right-6)));
    const score=ridgeDifference*10000+slopeDifference*8+(left+sw-right)*.03;
    if(score<best.score)best={left,right,ridgeDifference,score};
  }
  const width=best.right-best.left,image=makeCanvas(width,sh),ctx=image.getContext('2d'),feather=48;
  ctx.drawImage(source,best.left,0,width,sh,0,0,width,sh);
  const edge=ctx.getImageData(0,0,feather,sh);
  for(let y=0;y<sh;y++)for(let x=0;x<feather;x++){
    const p=(y*feather+x)*4,q=(y*sw+best.right+x)*4;
    if(edge.data[p+3]<241||data[q+3]<241)continue;
    const t=x/(feather-1),weight=t*t*(3-2*t);
    for(let ch=0;ch<3;ch++)edge.data[p+ch]=data[q+ch]*(1-weight)+edge.data[p+ch]*weight;
  }
  ctx.putImageData(edge,0,0);
  return{image,sourceRect:[best.left,0,width,sh],seam:{ridgeDifference:best.ridgeDifference,feather}};
}
function completeSprite(source,solid=false){
  // These are complete painted hills, including both slopes and their tree
  // roots. Remove only wholly transparent margins; never invent a silhouette.
  const sw=source.width,sh=source.height,data=source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,sw,sh).data;
  let left=sw,top=sh,right=-1,bottom=-1;
  for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(data[(y*sw+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right<left)throw Error('Empty painted hill');
  const sourceRect=[left,top,right-left+1,bottom-top+1],image=makeCanvas(sourceRect[2],sourceRect[3]);
  const ctx=image.getContext('2d');ctx.drawImage(source,...sourceRect,0,0,image.width,image.height);
  // Generated paint has a near-opaque core. Only a foreground occluder needs
  // that core made fully opaque; retain every antialiased silhouette pixel.
  if(solid){const pixels=ctx.getImageData(0,0,image.width,image.height);for(let p=3;p<pixels.data.length;p+=4)if(pixels.data[p]>=240)pixels.data[p]=255;ctx.putImageData(pixels,0,0);}
  return{image,sourceRect};
}
export class InfiniteScene {
  constructor(canvas){this.canvas=canvas;canvas.width=W;canvas.height=H;this.ctx=canvas.getContext('2d');this.land=makeCanvas();this.landCtx=this.land.getContext('2d');this.waterSource=makeCanvas();this.waterSourceCtx=this.waterSource.getContext('2d');this.reflection=makeCanvas();this.reflectionCtx=this.reflection.getContext('2d');this.waterSoft=makeCanvas(Math.ceil(W/3),(H-Y)/2);this.waterSoftCtx=this.waterSoft.getContext('2d');this.lake=makeCanvas(W,H-Y);this.lakeCtx=this.lake.getContext('2d');this.shore=new ProceduralShore();this.smoke=new StarrySteam();this.stats={frames:0,drawCalls:0,instances:0,renderMs:0};this.assets={};this.tinted=new Map();}
  async load(resolveURL){
    this.clouds=new FlatCloudField();
    await Promise.all(MATERIALS.map(async def=>{
      const image=await loadImage(resolveURL(def.path)),canvas=makeCanvas(image.width,image.height),ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
      if(def.alphaCut){const data=ctx.getImageData(0,0,canvas.width,canvas.height);for(let i=3;i<data.data.length;i+=4){const a=Math.min(1,Math.max(0,(data.data[i]/255-def.alphaCut)/(1-def.alphaCut)));data.data[i]=Math.round(a*a*(3-2*a)*255);}ctx.putImageData(data,0,0);}
      let prepared=def.flatCloud?prepareFlatCloud(canvas):def.cutout?completeSprite(canvas,def.hill):def.terrain?terrainTile(canvas):{image:canvas};
      if(def.detailRect){const [x,y,w,h]=def.detailRect,detail=makeCanvas(w,h);detail.getContext('2d').drawImage(canvas,x,y,w,h,0,0,w,h);prepared={image:detail,sourceRect:def.detailRect};}
      this.assets[def.id]={...def,...prepared,cluster:def.clusters?prepared:null,groundY:def.groundY===undefined?prepared.image.height:def.groundY-prepared.sourceRect[1],width:prepared.image.width,height:prepared.image.height,sourceWidth:canvas.width,sourceHeight:canvas.height};
    }));
    this.shore.setDetail(this.assets['shore-paint'].image);this.foreground=new ForegroundVegetation(this.assets);this.stats.textureBytes=Object.values(this.assets).reduce((s,a)=>s+a.width*a.height*4,0)+this.foreground.textureBytes+this.clouds.stats.bufferBytes;return this;
  }
  tintedImage(id,color,alpha,cluster=false){
    const key=tintKey(id,color,alpha,cluster);if(this.tinted.has(key))return this.tinted.get(key);
    const a=this.assets[id],image=cluster?a.cluster.image:a.image,c=makeCanvas(image.width,image.height),ctx=c.getContext('2d');
    ctx.drawImage(image,0,0);ctx.globalCompositeOperation='source-atop';ctx.fillStyle=color;ctx.globalAlpha=alpha;ctx.fillRect(0,0,c.width,c.height);
    let texture=c;
    // Commit the exact RGBA paint to an immutable texture. The return-trip
    // fixture exercises the same tint at several scales; reusing a mutable
    // Canvas backing produced different leaf samples after the distant draws.
    if(typeof OffscreenCanvas!=='undefined'){
      const frozen=new OffscreenCanvas(c.width,c.height);
      frozen.getContext('2d').putImageData(ctx.getImageData(0,0,c.width,c.height),0,0);
      texture=frozen.transferToImageBitmap();
    }
    this.tinted.set(key,texture);return texture;
  }
  sprite(ctx,id,x,y,w,h,opacity=1,tint=null){if(x+w<0||x>W||y+h<0||y>H)return;ctx.globalAlpha=opacity;ctx.drawImage(tint||this.assets[id].image,x,y,w,h);ctx.globalAlpha=1;this.stats.drawCalls++;this.stats.instances++;}
  sky(ctx,state){const gradient=ctx.createLinearGradient(0,0,0,Y);gradient.addColorStop(0,'#0874f7');gradient.addColorStop(.58,'#269efa');gradient.addColorStop(1,'#8bd7fb');ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
    // The fine distant contrail uses world coordinates and leaves offscreen.
    ctx.save();
    for(const {id,x} of visibleCells(state.camera,.008,2300,{guard:1})){
      ctx.strokeStyle='#d6f5ff';ctx.lineWidth=.8;ctx.globalAlpha=.82;ctx.beginPath();ctx.moveTo(x+674,205);ctx.bezierCurveTo(x+760,159,x+871,111,x+985,76);ctx.stroke();
    }ctx.restore();
  }
  cloudLayer(ctx,state,far){
    const result=this.clouds.draw(ctx,state,far,this.assets);this.stats.drawCalls+=result.draws;this.stats.instances+=result.instances;
  }
  terrainStrip(ctx,state,placement){
    const a=this.assets[placement.asset],scale=placement.scale,width=a.width*scale,y=placement.base-a.height*scale;
    const image=placement.color?this.tintedImage(placement.asset,placement.color,placement.tint):a.image;
    for(const {id,x} of visibleCells(state.camera,placement.depth,width,{offset:placement.offset,guard:1})){
      if(x+width<0||x>W)continue;
      ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.drawImage(image,0,0);ctx.restore();this.stats.drawCalls++;this.stats.instances++;
    }
  }
  mountainLayer(ctx,state,near){
    for(const placement of MOUNTAINS)if((placement.layer==='mountains-near')===near){if(placement.clusters)this.clusterLayer(ctx,state,placement);else this.terrainStrip(ctx,state,placement);}
  }
  clusterInstances(state,placement,visibleOnly=true){
    const asset=this.assets[placement.asset],image=asset.cluster.image,result=[];
    for(const {id,x} of visibleCells(state.camera,placement.depth,placement.span,{offset:placement.offset,guard:2})){
      const kind=sceneryCell(id,state.seed);if(kind==='open')continue;
      const rnd=s=>randomAt(id,s+(placement.asset==='mountain-green'?1000:1100),state.seed),count=kind==='hills'?(placement.asset==='mountain-green'?2:3):1+(rnd(0)>.45?1:0);
      let px=x+60+rnd(1)*placement.span*.13;
      for(let part=0;part<count;part++){
        const scale=placement.scale*(.82+rnd(2+part)*.34),width=image.width*scale,height=image.height*scale;
        if(!visibleOnly||!(px+width<0||px>W))result.push({id,part,kind,x:px,y:placement.base-asset.groundY*scale,width,height,scale});
        px+=width*(.50+rnd(8+part)*.18);
      }
    }return result;
  }
  clusterLayer(ctx,state,placement){
    const image=placement.color?this.tintedImage(placement.asset,placement.color,placement.tint,true):this.assets[placement.asset].cluster.image;
    for(const hill of this.clusterInstances(state,placement)){ctx.save();ctx.translate(hill.x,hill.y);ctx.scale(hill.scale,hill.scale);ctx.drawImage(image,0,0);ctx.restore();this.stats.drawCalls++;this.stats.instances++;}
  }
  landscapeAt(state){
    const near=this.clusterInstances(state,MOUNTAINS.find(p=>p.clusters)).length,forest=this.clusterInstances(state,MIDGROUND).length,rail=this.railHillInstances(state).length;
    const kind=rail?'hills':near||forest?'forest':'open';
    return{kind,label:kind==='hills'?'沿岸小山':kind==='forest'?'林坡与远山':'开阔远山',nearHills:near,forestHills:forest,railHills:rail};
  }
  foothillLayer(ctx,state,reflected=false){
    ctx.save();if(reflected){ctx.beginPath();ctx.rect(0,MIDGROUND.reflectFromY,W,MIDGROUND.base-MIDGROUND.reflectFromY);ctx.clip();}
    this.clusterLayer(ctx,state,MIDGROUND);
    ctx.restore();
  }
  treeLayer(ctx,state){
    // Complete painted groves keep their aspect ratio. The world-space
    // envelope changes their size, not the shape of each leaf and crown.
    const forest=this.clusterInstances(state,MIDGROUND,false),asset=this.assets['low-shrub'];
    for(const back of [true,false]){
      const span=back?184:226,depth=MIDGROUND.depth,tint=this.tintedImage('low-shrub',back?'#268db0':'#267f92',back?.30:.19);
      for(const {id,x} of visibleCells(state.camera,depth,span,{offset:back?-70:30,guard:2})){
        const r=s=>randomAt(id,s+(back?300:400),state.seed),footprint=span*(1.32+r(4)*.32),centre=x+(r(5)-.5)*span*.22+footprint*.5,base=back?547:553;
        let grove=0;for(const hill of forest){const t=Math.max(0,1-Math.abs(centre-(hill.x+hill.width*.5))/(hill.width*.75+footprint*.5));grove=Math.max(grove,t*t*(3-2*t));}
        const h=(back?12:9)+grove*(back?42:41)+r(3)*(back?8:7);
        const w=h*asset.width/asset.height;
        this.sprite(ctx,'low-shrub',centre-w*.5,base-h,w,h,1,tint);
      }
    }
  }
  railHillInstances(state){
    const a=this.assets[RAIL_HILLS.asset],result=[];
    for(const {id,x} of visibleCells(state.camera,RAIL_HILLS.depth,RAIL_HILLS.span,{offset:RAIL_HILLS.offset,guard:1})){
      const kind=sceneryCell(id,state.seed);
      if(kind==='open'||kind==='forest'&&randomAt(id,781,state.seed)<=.65)continue;
      const rnd=s=>randomAt(id,s+700,state.seed),scale=RAIL_HILLS.minScale+rnd(1)*RAIL_HILLS.scaleRange,px=x+(rnd(2)-.5)*180;
      const width=a.width*scale,height=a.height*scale;
      if(px+width<0||px>W)continue;
      result.push({id,x:px,y:RAIL_HILLS.base-a.groundY*scale,width,height,scale});
    }return result;
  }
  railHillLayer(ctx,state,reflected=false){
    const instances=this.railHillInstances(state),image=this.assets[RAIL_HILLS.asset].image;
    ctx.save();if(reflected){ctx.translate(0,RAIL_HILLS.base*2);ctx.scale(1,-1);}
    // The shader supplies the common coast below this line. Keep any faint
    // source-paint tail inside opaque land instead of drawing it over the lake.
    if(!reflected&&this.enabled(state,'shore')){ctx.beginPath();ctx.rect(0,0,W,Y);ctx.clip();}
    for(const hill of instances){ctx.save();ctx.translate(hill.x,hill.y);ctx.scale(hill.scale,hill.scale);ctx.drawImage(image,0,0);ctx.restore();this.stats.drawCalls++;this.stats.instances++;}
    if(reflected&&this.enabled(state,'shore')){this.shore.render(state);ctx.drawImage(this.shore.hillRootsCanvas,0,SHORE.top);this.stats.drawCalls++;}
    ctx.restore();if(!reflected)this.stats.railHills={sprites:instances.length,groups:new Set(instances.map(h=>h.id)).size};
  }
  repeated(ctx,state,id,y,depth=1){const a=this.assets[id];for(const {x} of visibleCells(state.camera,depth,a.width,{guard:1}))this.sprite(ctx,id,x,y,a.width+.2,a.height);}
  shoreLayer(ctx,state,reflectionSource=false){
    ctx.save();
    // Local hill roots have their own reflection anchor and are reflected in
    // railHillLayer. Only the grass part belongs in the bank reflection source.
    if(reflectionSource){ctx.beginPath();ctx.rect(0,545,W,H-545);ctx.clip();}
    ctx.drawImage(this.shore.render(state),0,SHORE.top);ctx.restore();this.stats.drawCalls++;this.stats.instances++;
  }
  train(ctx,state,reflected=false){const pose=trainPose(state.direction,state.time);ctx.save();
    if(reflected){ctx.translate(0,1051);ctx.scale(1,-1);}
    ctx.translate(pose.offsetX,pose.jitter);
    if(pose.mirror){ctx.translate(TRAIN.left+TRAIN.right,0);ctx.scale(-1,1);}
    for(const [id,x,y] of TRAIN.parts)if(this.enabled(state,id)){const a=this.assets[id];this.sprite(ctx,id,x,y,a.width,a.height,reflected?.82:1);}
    ctx.restore();
  }
  steam(ctx,state,reflected=false){if(!this.enabled(state,'steam')||!state.visibility.engine)return;const pose=trainPose(state.direction,state.time),image=this.smoke.render(state.time);ctx.save();
    if(reflected){ctx.translate(0,1051);ctx.scale(1,-1);ctx.globalAlpha=.72;}
    ctx.translate(pose.chimneyX,451+pose.jitter);ctx.scale(pose.trailSign,1);ctx.drawImage(image,-STARRY_STEAM.originX,-STARRY_STEAM.originY);ctx.restore();this.stats.drawCalls++;this.stats.instances++;
  }
  water(ctx,state){
    const lake=this.lakeCtx;lake.clearRect(0,0,W,H-Y);lake.save();lake.translate(0,-Y);this.paintWater(lake,state);
    if(this.enabled(state,'shore')){lake.globalCompositeOperation='destination-out';lake.drawImage(this.shore.render(state),0,SHORE.top);this.stats.drawCalls++;}
    lake.restore();ctx.drawImage(this.lake,0,Y);this.stats.drawCalls++;
  }
  paintWater(ctx,state){ctx.save();ctx.beginPath();ctx.rect(0,Y,W,H-Y);ctx.clip();ctx.fillStyle='#78c9fa';ctx.fillRect(0,Y,W,H-Y);
    // Reflect a dedicated source, not the completed upper scene. In this
    // composition the distant terrain is excluded: mirroring it about the bank
    // would incorrectly place complete mountain peaks in the foreground lake.
    // Clouds and bank objects still share the visible world's clock and camera.
    const reflected=this.reflectionCtx;reflected.clearRect(0,0,W,H);reflected.setTransform(1,0,0,-1,0,2*R);reflected.drawImage(this.waterSource,0,0);reflected.setTransform(1,0,0,1,0,0);
    // Keep the source's art-directed train anchor, but let the same water ripple
    // affect it and the landscape so it no longer floats over the reflection.
    this.train(reflected,state,true);
    this.steam(reflected,state,true);
    // The local hill stands in front of both the train and its water image.
    if(this.enabled(state,'rail-hills'))this.railHillLayer(reflected,state,true);
    if(!state.ripple){ctx.drawImage(this.reflection,0,0);this.stats.drawCalls++;ctx.globalAlpha=.045;ctx.fillStyle='#218bd4';ctx.fillRect(0,Y,W,H-Y);this.stats.water={method:'calm-reflection',patches:0};}
    else{
      // A small, reused reflection buffer removes the sharp one-pixel detail.
      // Keep the bank readable, with more softened and broken reflections toward
      // the viewer. No blur or light overlay is applied to the land above it.
      const soft=this.waterSoftCtx;soft.clearRect(0,0,this.waterSoft.width,this.waterSoft.height);soft.drawImage(this.reflection,0,Y,W,H-Y,0,0,this.waterSoft.width,this.waterSoft.height);this.stats.drawCalls++;
      for(let y=Y;y<H;y++){
        const depth=(y-Y)/(H-Y),phase=38*Math.log1p(depth*3),envelope=.25+depth*depth;
        const dx=(Math.sin(phase-state.time*.82)*4.0+Math.sin(phase*2.67+state.time*1.13)*1.8+Math.sin((y-Y)*1.45+state.time*1.2)*1.1)*envelope;
        const dy=Math.sin(phase*1.41-state.time*.7)*depth*1.8;
        const sy=Math.max(0,Math.min(H-Y-1,y-Y+dy)),blend=.32+depth*.60;
        // Crossfade the same displaced scanline with its softer counterpart;
        // this preserves broad cloud shapes while suppressing mirror-like edges.
        ctx.globalAlpha=1;ctx.drawImage(this.reflection,0,Y+sy,W,1,dx-10,y,W+20,1);this.stats.drawCalls++;
        ctx.globalAlpha=blend;ctx.drawImage(this.waterSoft,0,sy/2,this.waterSoft.width,.5,dx-10,y,W+20,1);this.stats.drawCalls++;
      }
      ctx.globalAlpha=1;
      const veil=ctx.createLinearGradient(0,Y,0,H);veil.addColorStop(0,'rgba(42,151,211,.055)');veil.addColorStop(1,'rgba(40,155,218,.18)');ctx.fillStyle=veil;ctx.fillRect(0,Y,W,H-Y);
      this.waterSurface(ctx,state);
    }ctx.restore();
  }
  waterSurface(ctx,state){
    // Deterministic patches live in world coordinates, so travelling either
    // direction never resets them. Only the shared clock animates the light.
    const span=384;let patches=0;
    for(const {id,x} of visibleCells(state.camera,.72,span,{guard:1}))for(let i=0;i<26;i++){
      const rnd=s=>randomAt(id,i*19+s,state.seed),depth=.045+Math.pow(rnd(1),1.25)*.91;
      const phase=rnd(2)*Math.PI*2,statePhase=state.time*(.50+rnd(3)*.30)+phase;
      const y=Y+depth*(H-Y)+Math.sin(statePhase*.6)*(.3+depth*1.2),px=x+rnd(4)*span+Math.sin(statePhase*.44)*(2+depth*5);
      const length=(12+rnd(5)*80)*(.50+depth),height=.65+depth*1.25,pulse=Math.pow(.5+.5*Math.sin(statePhase),3);
      if(px+length+28<0||px>W)continue;
      ctx.globalAlpha=(.065+depth*.085)*(.65+pulse*.35);ctx.fillStyle='#167dba';ctx.fillRect(px-8,y+height*2,length*1.35,height*1.25);
      ctx.globalAlpha=(.12+depth*.16)*(.60+pulse*.40);ctx.fillStyle='#80d9f7';ctx.fillRect(px-3,y,length*.85,height);
      ctx.globalAlpha=(.18+depth*.29)*(.30+pulse*.70);ctx.fillStyle='#e9fbff';
      ctx.fillRect(px,y,length*(.25+rnd(6)*.32),height*.7);ctx.fillRect(px+length*.68+4,y+.5,length*.21,height*.6);
      if(rnd(7)>.60){ctx.globalAlpha=pulse*(.13+depth*.30);ctx.fillStyle='#f4ffff';ctx.fillRect(px+length*.3,y-1.2,(3+rnd(8)*14)*(.6+depth),.65+depth*.35);}
      patches++;this.stats.drawCalls+=rnd(7)>.60?5:4;
    }
    ctx.globalAlpha=1;this.stats.water={method:'softened-ripple-and-glints',reflectionBuffer:[this.waterSoft.width,this.waterSoft.height],patches};
  }
  nearLayer(ctx,state,branches){
    const plants=this.foreground.draw(ctx,state,branches);this.stats.drawCalls+=plants.plants;this.stats.instances+=plants.plants;
    this.stats.vegetation[branches?'branches':'understory']=plants;
  }
  enabled(state,id){return state.visibility[id]&&(state.solo===null||state.solo===id);}
  render(state){const start=performance.now(),ctx=this.ctx,land=this.landCtx,waterSource=this.waterSourceCtx,reflectWater=this.enabled(state,'water');this.stats.drawCalls=0;this.stats.instances=0;this.stats.water=null;this.stats.vegetation={};this.stats.railHills={sprites:0,groups:0};this.stats.scenery=this.landscapeAt(state);ctx.clearRect(0,0,W,H);land.clearRect(0,0,W,H);waterSource.clearRect(0,0,W,H);
    this.clouds.beginFrame();
    // Water isolation still evaluates its dependencies offscreen, so it remains
    // a useful independent preview instead of becoming an empty blue rectangle.
    const dependencyState=state.solo==='water'?{...state,solo:null}:state;
    const contactHills=this.enabled(dependencyState,'shore')&&this.enabled(dependencyState,'rail-hills')?this.railHillInstances(state):[];
    this.shore.setContacts(this.assets[RAIL_HILLS.asset].image,contactHills,contactHills.length?state.camera+':'+state.seed:'empty');
    if(this.enabled(dependencyState,'sky'))this.sky(land,state);
    land.save();land.beginPath();land.rect(0,0,W,Y+10);land.clip();
    if(this.enabled(dependencyState,'clouds-far'))this.cloudLayer(land,state,true);
    if(this.enabled(dependencyState,'clouds'))this.cloudLayer(land,state,false);
    // Capture the sky before adding either terrain layer. This keeps distant
    // mountains out of the lake without fading or moving the mountains above it.
    if(reflectWater)waterSource.drawImage(this.land,0,0);
    waterSource.save();waterSource.beginPath();waterSource.rect(0,0,W,Y+10);waterSource.clip();
    if(this.enabled(dependencyState,'mountains-far'))this.mountainLayer(land,state,false);
    if(this.enabled(dependencyState,'mountains-near'))this.mountainLayer(land,state,true);
    if(this.enabled(dependencyState,'foothills')){this.foothillLayer(land,state);if(reflectWater)this.foothillLayer(waterSource,state,true);}
    // Only the bank and bridge are composited into both sources. No near
    // framing foliage is reflected across the far bank either.
    for(const source of reflectWater?[land,waterSource]:[land]){
      if(this.enabled(dependencyState,'trees'))this.treeLayer(source,state);
      if(this.enabled(dependencyState,'bridge-piers'))this.repeated(source,state,'bridge-piers',489);
      if(this.enabled(dependencyState,'bridge-deck'))this.repeated(source,state,'bridge-deck',470);
      if(this.enabled(dependencyState,'shore'))this.shoreLayer(source,state,source===waterSource);
    }
    this.stats.clouds=this.clouds.stats;
    land.restore();waterSource.restore();
    if(state.solo!=='water')ctx.drawImage(this.land,0,0,W,Y,0,0,W,Y);
    if(this.enabled(state,'water'))this.water(ctx,dependencyState);
    this.train(ctx,state);this.steam(ctx,state);
    if(this.enabled(state,'rail-hills'))this.railHillLayer(ctx,state);
    if(this.enabled(state,'shore'))this.shoreLayer(ctx,state);
    if(this.enabled(state,'understory'))this.nearLayer(ctx,state,false);
    if(this.enabled(state,'branches'))this.nearLayer(ctx,state,true);
    if(state.guides){ctx.save();ctx.setLineDash([8,7]);ctx.strokeStyle='#ffeb81';ctx.lineWidth=1;for(const y of [479,Y]){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}ctx.font='15px monospace';ctx.fillStyle='#fff';for(const {id,x} of visibleCells(state.camera,1,this.assets['bridge-deck'].width,{guard:0})){ctx.fillText('bridge '+id,Math.max(2,x+8),468);ctx.beginPath();ctx.moveTo(x,465);ctx.lineTo(x,548);ctx.stroke();}ctx.restore();}
    this.stats.frames++;this.stats.renderMs=performance.now()-start;this.stats.shoreline=this.enabled(dependencyState,'shore')?this.shore.stats:null;this.stats.steam={method:'starry-billow',backend:this.smoke.backend,resolution:[STARRY_STEAM.width,STARRY_STEAM.height],frames:this.smoke.frames,renderMs:this.smoke.renderMs,gpuMs:this.smoke.gpuMs,noiseBytes:this.smoke.noiseData.byteLength};return this.stats;
  }
  layout(state){return SCENE_LAYERS.filter(l=>l.depth>0).map(l=>({id:l.id,depth:l.depth,phase:state.camera*l.depth}));}
}
