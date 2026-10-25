import { WORLD, randomAt, visibleCells } from './world.mjs';

// Keep the established four paint planes, with a finer two-pixel cloud buffer.
// The broad cloud walls need small painted edges rather than enlarged blocks.
export const FLAT_CLOUDS = Object.freeze({
  palette:Object.freeze([[253,250,241],[209,234,249],[167,212,243],[136,193,235]]),
  sampleStep:2,pixelStep:2,nearDepth:.045,farDepth:.022,nearSpan:2800,farSpan:840,
});
const cloudCanvas=(width,height)=>{
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;
};

export function prepareFlatCloud(source){
  const sw=source.width,sh=source.height;
  const pixels=source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,sw,sh).data;
  let left=sw,top=sh,right=-1,bottom=-1;
  for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(pixels[(y*sw+x)*4+3]>=96){
    left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
  }
  if(right<left)throw Error('Empty cloud painting');
  left=Math.max(0,left-2);top=Math.max(0,top-2);right=Math.min(sw-1,right+2);bottom=Math.min(sh-1,bottom+2);
  const sourceRect=[left,top,right-left+1,bottom-top+1];
  const width=Math.ceil(sourceRect[2]/FLAT_CLOUDS.sampleStep);
  const height=Math.round(sourceRect[3]*width/sourceRect[2]),image=cloudCanvas(width,height);
  const ctx=image.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,...sourceRect,0,0,width,height);
  const data=ctx.getImageData(0,0,width,height),counts=[0,0,0,0];
  for(let p=0;p<data.data.length;p+=4){
    const a=data.data[p+3];
    if(a<64){data.data[p]=data.data[p+1]=data.data[p+2]=data.data[p+3]=0;continue;}
    let best=0,distance=Infinity;
    for(let index=0;index<FLAT_CLOUDS.palette.length;index++){
      const rgb=FLAT_CLOUDS.palette[index];
      const error=(data.data[p]-rgb[0])**2+1.2*(data.data[p+1]-rgb[1])**2+.8*(data.data[p+2]-rgb[2])**2;
      if(error<distance){best=index;distance=error;}
    }
    data.data.set(FLAT_CLOUDS.palette[best],p);
    // Tight antialiased edges suppress generated haze while keeping solid fill.
    data.data[p+3]=a>=176?255:Math.round((a-64)/112*255);counts[best]++;
  }
  ctx.putImageData(data,0,0);
  return{image,sourceRect,flatStyle:{palette:FLAT_CLOUDS.palette,counts,sampleStep:FLAT_CLOUDS.sampleStep}};
}

// Randomness belongs to world cells, never to frames or visibility. Negative
// cells and return trips reconstruct the same group without re-rolling it.
export function cloudInstances(state,far,assets){
  const seed=state.cloudSeed??state.seed,span=far?FLAT_CLOUDS.farSpan:FLAT_CLOUDS.nearSpan;
  const depth=far?FLAT_CLOUDS.farDepth:FLAT_CLOUDS.nearDepth;
  const phase=state.windTime??(state.wind?state.time:0);
  const windDistance=phase*(far?.38:.72),result=[];
  for(const {id,x} of visibleCells(state.camera+windDistance/depth,depth,span,{offset:far?-110:70,guard:2})){
    const rnd=s=>randomAt(id,s+(far?1700:1800),seed);
    // A cloud bank has a dominant mass and smaller shoulders, with a low
    // saddle between them. It is not a row of equally important cloud icons.
    const parts=far?[
      {role:'horizon',asset:rnd(0)<.83?'cloud-bank':'cloud-fan',x:(rnd(2)-.5)*120,width:820+rnd(1)*330,bottom:492+rnd(3)*24},
    ]:[
      {role:'wall',asset:rnd(0)<.72?'cloud-fan':'cloud-tower',x:820+rnd(2)*240,width:1900+rnd(1)*400,bottom:548+rnd(3)*14},
      {role:'shoulder',asset:rnd(5)<.60?'cloud-tower':'cloud-fan',x:-220+rnd(6)*140,width:710+rnd(7)*180,bottom:535+rnd(8)*20},
      {role:'saddle',asset:'cloud-bank',x:430+rnd(9)*200,width:1040+rnd(10)*220,bottom:525+rnd(11)*22},
    ];
    for(let index=0;index<parts.length;index++){
      const p=parts[index],image=assets[p.asset].image,height=p.width*image.height/image.width,px=x+p.x;
      if(px+p.width<0||px>WORLD.width)continue;
      result.push({id:id+':'+p.role,asset:p.asset,x:px,y:p.bottom-height,width:p.width,height,phase:rnd(12+index)*Math.PI*2,far});
    }
  }
  return result;
}

export class FlatCloudField{
  constructor(){
    this.layers=[false,true].map(()=>{
      const image=cloudCanvas(Math.ceil(WORLD.width/FLAT_CLOUDS.pixelStep),Math.ceil(WORLD.height/FLAT_CLOUDS.pixelStep));
      return{image,ctx:image.getContext('2d',{willReadFrequently:true}),key:null,instances:[],draws:0};
    });
    this.frames=0;this.beginFrame();
  }
  beginFrame(){
    this.stats={method:'four-flat-painted-clouds',palette:FLAT_CLOUDS.palette,pixelStep:FLAT_CLOUDS.pixelStep,
      resolution:[this.layers[0].image.width,this.layers[0].image.height],sourceTemplates:3,
      bufferBytes:this.layers.reduce((sum,l)=>sum+l.image.width*l.image.height*4,0),layers:[],frames:this.frames};
  }
  draw(target,state,far,assets){
    const layer=this.layers[far?1:0],phase=state.windTime??(state.wind?state.time:0);
    const seed=state.cloudSeed??state.seed,key=[state.camera,phase,seed].join(':');
    let draws=1;
    if(key!==layer.key){
      const ctx=layer.ctx,scale=layer.image.width/WORLD.width;
      ctx.clearRect(0,0,layer.image.width,layer.image.height);ctx.imageSmoothingEnabled=false;
      layer.instances=cloudInstances(state,far,assets);layer.draws=0;
      for(const item of layer.instances){
        const image=assets[item.asset].image;
        // A single complete draw avoids seams between resampled scanline
        // bands. A tiny shared lean and uniform breath keep all fills aligned.
        const breath=1+Math.sin(phase*.07+item.phase)*.002;
        const lean=Math.sin(phase*.045+item.phase)*.002;
        ctx.save();ctx.translate((item.x+item.width*.5)*scale,(item.y+item.height)*scale);
        ctx.transform(breath,0,lean,breath,0,0);
        ctx.drawImage(image,-item.width*.5*scale,-item.height*scale,item.width*scale,item.height*scale);
        ctx.restore();layer.draws++;
      }
      layer.key=key;this.frames++;draws+=layer.draws;
    }
    target.save();target.imageSmoothingEnabled=false;target.drawImage(layer.image,0,0,WORLD.width,WORLD.height);target.restore();
    this.stats.layers.push({far,seed,instances:layer.instances.length,windTime:phase});this.stats.frames=this.frames;
    return{draws,instances:layer.instances.length};
  }
}
