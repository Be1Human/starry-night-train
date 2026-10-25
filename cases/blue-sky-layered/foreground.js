import { WORLD, randomAt, visibleCells } from './world.mjs';

export const FOREGROUND = Object.freeze({
  understory:{depth:2.6,span:900,offset:-180,salt:3100},
  branches:{depth:4.1,span:1550,offset:-260,salt:4100},
});
const plantKinds=['low-shrub','near-ferns'];
const canopyKinds=['canopy-0','canopy-1','canopy-2','canopy-3'];
const tones=[['#184e55',.08],['#7b8d45',.07],['#17536b',.12],[null,0]];
function densityAt(x,seed){
  const q=x/3900,i=Math.floor(q),f=q-i,s=f*f*(3-2*f);
  return randomAt(i,2900,seed)*(1-s)+randomAt(i+1,2900,seed)*s;
}
export class ForegroundVegetation {
  constructor(assets){
    this.motifs={};this.textureBytes=0;
    const atlas=assets.leaves.image;
    // Empty gutters differ slightly between rows in the generated atlas.
    const regions=[[0,0,620,642],[620,0,660,642],[0,642,632,638],[632,642,648,638]];
    for(const id of [...canopyKinds,...plantKinds]){
      const source=id.startsWith('canopy-')?atlas:assets[id].image;
      const rect=id.startsWith('canopy-')?regions[Number(id.at(-1))].map((v,i)=>v*(i%2?atlas.height:atlas.width)/1280):[0,0,source.width,source.height];
      const slice=document.createElement('canvas');slice.width=Math.round(rect[2]);slice.height=Math.round(rect[3]);const sctx=slice.getContext('2d',{willReadFrequently:true});sctx.drawImage(source,...rect,0,0,slice.width,slice.height);
      const pixels=sctx.getImageData(0,0,slice.width,slice.height).data;let left=slice.width,top=slice.height,right=-1,bottom=-1;
      for(let y=0;y<slice.height;y++)for(let x=0;x<slice.width;x++)if(pixels[(y*slice.width+x)*4+3]>3){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      if(right<left)throw Error('Empty foreground plant: '+id);
      const w=right-left+1,h=bottom-top+1,scale=Math.min(1,512/Math.max(w,h));
      let roots=0,rootWeight=0;for(let y=Math.max(top,bottom-3);y<=bottom;y++)for(let x=left;x<=right;x++){const a=pixels[(y*slice.width+x)*4+3];if(a>128){roots+=(x-left)*a;rootWeight+=a;}}
      const variants=tones.map(([colour,alpha])=>{
        const c=document.createElement('canvas');c.width=Math.round(w*scale);c.height=Math.round(h*scale);
        const ctx=c.getContext('2d');ctx.drawImage(slice,left,top,w,h,0,0,c.width,c.height);
        if(colour){ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=alpha;ctx.fillStyle=colour;ctx.fillRect(0,0,c.width,c.height);}
        this.textureBytes+=c.width*c.height*4;return c;
      });
      this.motifs[id]={variants,aspect:w/h,rootX:id.startsWith('canopy-')&&rootWeight?roots/rootWeight/w:.5,sourceRect:rect,crop:[left,top,w,h]};
    }
  }
  instances(state,branches){
    const cfg=FOREGROUND[branches?'branches':'understory'],plants=[];
    for(const {id,x} of visibleCells(state.camera,cfg.depth,cfg.span,{offset:cfg.offset,guard:2})){
      const r=s=>randomAt(id,cfg.salt+s,state.seed),density=densityAt(id*cfg.span+cfg.offset,state.seed);
      if(r(0)>(branches?.27+density*.52:.57+density*.39))continue;
      const count=branches?1+(r(1)>.55?1:0):1+Math.floor(r(1)*(density>.57?3:2));
      const origin=x+(r(2)-.5)*cfg.span*.70,spread=branches?180+r(3)*180:160+r(3)*150;
      const first=Math.floor(r(4)*plantKinds.length);
      for(let part=0;part<count;part++){
        const p=s=>r(20+part*23+s);
        // A group has independently rooted plants, not a repeated composite.
        // Only one woody branch is permitted in a group; its companions differ.
        const woody=branches&&part===0&&r(6)>.34;
        const block=Math.floor(id/4),slot=id-block*4,rotation=Math.floor(randomAt(block,4260,state.seed)*4),stride=randomAt(block,4261,state.seed)>.5?1:3;
        const species=woody?canopyKinds[(slot*stride+rotation)%4]:plantKinds[(first+part)%plantKinds.length];
        const height=woody?300+p(0)*200:(branches?170:110)+p(0)*110;
        const width=height*this.motifs[species].aspect,px=origin+(part-(count-1)*.5)*spread+(p(1)-.5)*80;
        const base=WORLD.height+(woody?40:23)+p(2)*46;
        const reach=width*Math.max(this.motifs[species].rootX,1-this.motifs[species].rootX)+height*.27+20;
        if(px+reach<0||px-reach>WORLD.width)continue;
        plants.push({id,part,species,woody,x:px,base,width,height,lean:(p(3)-.5)*(woody?.36:.20),mirror:!woody&&p(4)>.5,tone:Math.floor(p(5)*tones.length),phase:p(6)*Math.PI*2,frequency:.42+p(7)*.44,wind:woody?.014:.009});
      }
    }
    return plants.sort((a,b)=>Number(b.woody)-Number(a.woody)||b.height-a.height);
  }
  draw(ctx,state,branches){
    const plants=this.instances(state,branches);
    for(const p of plants){
      const bend=state.wind?(Math.sin(state.time*p.frequency+p.phase)+.38*Math.sin(state.time*.21+p.phase*1.7))*p.wind:0;
      ctx.save();ctx.translate(p.x,p.base);ctx.rotate(p.lean);ctx.transform(p.mirror?-1:1,0,bend,1,0,0);
      ctx.drawImage(this.motifs[p.species].variants[p.tone],-p.width*this.motifs[p.species].rootX,-p.height,p.width,p.height);ctx.restore();
    }
    return{plants:plants.length,groups:new Set(plants.map(p=>p.id)).size,species:[...new Set(plants.map(p=>p.species))]};
  }
}
