// Authoring code for the bank material; the wallpaper consumes the exported
// PNG. Preserve the painting inside the bank, including its blue-green shade.
export const SHORE_MATERIAL=Object.freeze({source:'assets/blue-sky-train/source/blue-sky-train.png',sourceRect:[660,534,1135,40],overlap:120,worldY:534,solidRow:547,waterline:562});
export function createShoreMaterial(source){
  const {sourceRect:[sx,sy,sw,sh],overlap,solidRow,waterline}=SHORE_MATERIAL;
  const crop=document.createElement('canvas');crop.width=sw;crop.height=sh;const ctx=crop.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(source,sx,sy,sw,sh,0,0,sw,sh);const pixels=ctx.getImageData(0,0,sw,sh),d=pixels.data;
  const green=(x,y)=>{const p=((y-sy)*sw+x)*4,r=d[p],g=d[p+1],b=d[p+2];return g>r*1.03&&g>b*.88&&b<195;};
  const lake=(x,y)=>{const p=((y-sy)*sw+x)*4,r=d[p],g=d[p+1],b=d[p+2];return b>140&&b>g*1.13&&b>r*1.22;};
  for(let x=0;x<sw;x++){
    // The source's row 547 is continuous grass. Follow the connected upper
    // edge from there, rather than keeping isolated green pixels above it.
    let top=solidRow;while(top>sy&&green(x,top-1))top--;
    // Keep the dark bank face intact. Only the last three pixels can follow
    // the blue-water edge; baked reflections below the lake line are excluded.
    let bottom=waterline-1;for(let y=waterline-3;y<waterline;y++)if(lake(x,y)){bottom=y-1;break;}
    for(let y=0;y<sh;y++)if(y+sy<top||y+sy>bottom)d[(y*sw+x)*4+3]=0;
  }
  const image=document.createElement('canvas');image.width=sw-overlap;image.height=sh;const out=image.getContext('2d'),dst=out.createImageData(image.width,sh);
  // Match the existing repeat span and world position. Blend premultiplied
  // colour only in the join; the solid body remains opaque across that join.
  for(let y=0;y<sh;y++)for(let x=0;x<image.width;x++){
    const p=(y*image.width+x)*4,b=(y*sw+x)*4;
    if(x>=overlap){dst.data.set(d.subarray(b,b+4),p);continue;}
    const a=(y*sw+x+image.width)*4,t=x/overlap,weight=t*t*(3-2*t),aa=d[a+3]/255,ab=d[b+3]/255,alpha=aa*(1-weight)+ab*weight;
    for(let ch=0;ch<3;ch++)dst.data[p+ch]=alpha?(d[a+ch]*aa*(1-weight)+d[b+ch]*ab*weight)/alpha:0;
    dst.data[p+3]=alpha*255;
  }
  out.putImageData(dst,0,0);return{image,...SHORE_MATERIAL,width:image.width,height:image.height,method:'Continuous silhouette mask; source RGB retained inside the bank; no reflected fragments below y=562.'};
}
