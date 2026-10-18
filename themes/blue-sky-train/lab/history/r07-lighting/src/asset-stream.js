// Two bounded six-slot pools. Same ID+seed always reconstructs the same cloud.
function createAssetStream(step,far) {
  const layout=new Float32Array(24),kinds=new Float32Array(6);
  const random=(id,salt)=>{let v=(id|0)^Math.imul(salt,0x9e3779b9);v=Math.imul(v^(v>>>16),0x21f0aaad);v=Math.imul(v^(v>>>15),0x735a2d97);return ((v^(v>>>15))>>>0)/4294967296;};
  let anchor=null,lastSeed=null,ids=[],created=0;
  function update(distance,seed){
    const world=-distance,next=Math.floor(world/step),phase=world-next*step;
    if(next!==anchor||seed!==lastSeed){
      const previous=new Set(ids);anchor=next;lastSeed=seed;ids=Array.from({length:6},(_,i)=>next+i-1);
      for(let i=0;i<6;i++){
        const id=ids[i]+Math.imul(seed,701),rhythm=((ids[i]+seed-42)%3+3)%3;
        // Low banks alternate with medium and tall towers, leaving open sky.
        const w=far?.63+random(id,23)*.30:rhythm===0?1.03+random(id,23)*.16:rhythm===1?.67+random(id,23)*.22:1.46+random(id,23)*.18;
        layout[i*4+1]=far?.32+random(id,11)*.035:.29+random(id,11)*.035;
        layout[i*4+2]=w;layout[i*4+3]=w*(2/3); // preserve the painted aspect ratio
        kinds[i]=far?(random(id,41)>.75?0:1):(rhythm===1?1:0);
        if(!previous.has(ids[i]))created++;
      }
    }
    for(let i=0;i<6;i++)layout[i*4]=(i-.5)*step-phase;
    return {layout,kinds};
  }
  return {update,get state(){return {step,far,anchor,ids:[...ids],slots:6,generated:created,layout:Array.from(layout),kinds:Array.from(kinds)};}};
}
