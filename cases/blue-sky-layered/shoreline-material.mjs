// Prepare a repeating tile from a complete painted bank. Only empty margins,
// very faint generation fringe and a small colour join are processed. The
// irregular coast silhouette is never replaced with a horizontal bottom cut.
export const NATURAL_SHORE=Object.freeze({source:'assets/blue-sky-train/layered-stream/r13/shore-source.png',scale:.5,alphaFloor:32,solidAlpha:240,feather:40});
export function createNaturalShore(source){
  const w=source.width,h=source.height,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);
  const pixels=ctx.getImageData(0,0,w,h),d=pixels.data;
  for(let p=3;p<d.length;p+=4){const a=d[p],t=Math.max(0,Math.min(1,(a-NATURAL_SHORE.alphaFloor)/(NATURAL_SHORE.solidAlpha-NATURAL_SHORE.alphaFloor)));d[p]=Math.round(t*t*(3-2*t)*255);}
  const top=[],bottom=[];let first=h,last=-1;
  for(let x=0;x<w;x++){
    let a=0,b=h-1;while(a<h&&d[(a*w+x)*4+3]<240)a++;while(b>=0&&d[(b*w+x)*4+3]<240)b--;
    if(b<a)throw Error('The shoreline needs connected land across its full width');top.push(a);bottom.push(b);
    for(let y=0;y<h;y++)if(d[(y*w+x)*4+3]){first=Math.min(first,y);last=Math.max(last,y);}
  }
  let best={score:Infinity};
  for(let left=8;left<=160;left++)for(let right=w-320;right<=w-48;right++){
    if(right-left<w*.75)continue;
    const contactDifference=Math.abs(bottom[left]-bottom[right]),topDifference=Math.abs(top[left]-top[right]);
    const slopeDifference=Math.abs(bottom[left+4]-bottom[left-4]-bottom[right+4]+bottom[right-4]);
    const score=contactDifference*10000+topDifference*500+slopeDifference*8+(left+w-right)*.02;
    if(score<best.score)best={left,right,contactDifference,topDifference,score};
  }
  const width=best.right-best.left,height=last-first+1,image=document.createElement('canvas');image.width=width;image.height=height;const out=image.getContext('2d'),dst=out.createImageData(width,height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const p=(y*width+x)*4,b=((y+first)*w+best.left+x)*4;dst.data.set(d.subarray(b,b+4),p);
    if(x<NATURAL_SHORE.feather){const a=((y+first)*w+best.right+x)*4;if(d[a+3]<240||d[b+3]<240)continue;const t=x/(NATURAL_SHORE.feather-1),weight=t*t*(3-2*t);for(let ch=0;ch<3;ch++)dst.data[p+ch]=d[a+ch]*(1-weight)+d[b+ch]*weight;}
  }
  out.putImageData(dst,0,0);
  return{image,...NATURAL_SHORE,width,height,sourceRect:[best.left,first,width,height],seam:{contactDifference:best.contactDifference,topDifference:best.topDifference,feather:NATURAL_SHORE.feather},contactRange:[Math.min(...bottom.slice(best.left,best.right))-first+1,Math.max(...bottom.slice(best.left,best.right))-first+1]};
}
