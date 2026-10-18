(() => {
  'use strict';
  const W=2048,H=768;
  // Original-image coordinates, deliberately kept identical for both revisions.
  const ridge=[[0,324],[120,410],[240,405],[350,365],[500,420],[650,461],[850,468],[1050,462],[1230,453],[1430,438],[1600,399],[1760,335],[1920,295],[2047,245]];
  const canvas=document.getElementById('comparison'),context=canvas.getContext('2d');
  const images={},pixels={},masks={},metrics={};
  let version='r03',mode='split',blend=.5,onlyClouds=true,locked=false,dragging=false,point={x:1536,y:200};
  const roi=new Uint8Array(W*H);
  for(let x=0;x<W;x++){
    const end=ridge.findIndex(p=>p[0]>=x),b=ridge[Math.max(1,end)],a=ridge[Math.max(0,end-1)];
    const yEnd=a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);
    for(let y=0;y<yEnd;y++)roi[y*W+x]=1;
  }
  function isCloud(r,g,b){return r>=90&&g>=145&&b-r<138&&g/b>.72;}
  function cloudTops(id){
    return Array.from({length:19},(_,j)=>{
      const x=(j+1)*100,rows=[];
      for(let y=0;y<480;y++){let n=0;for(let dx=-20;dx<=20;dx++)n+=masks[id][y*W+x+dx];rows.push(n>15?1:0);}
      for(let y=0;y<470;y++)if(rows.slice(y,y+10).reduce((a,b)=>a+b,0)>=9)return {x,y};
      return {x,y:null};
    });
  }
  function measure(id){
    const a=pixels.reference,b=pixels[id];let intersection=0,union=0,refCount=0,renderCount=0,colorError=0,unionError=0,n=0;
    for(let i=0;i<W*H;i++)if(roi[i]){
      n++;const ref=masks.reference[i],cur=masks[id][i],k=i*4;
      refCount+=ref;renderCount+=cur;
      if(ref||cur){union++;unionError+=Math.abs(a[k]-b[k])+Math.abs(a[k+1]-b[k+1])+Math.abs(a[k+2]-b[k+2]);}
      if(ref&&cur){intersection++;colorError+=Math.abs(a[k]-b[k])+Math.abs(a[k+1]-b[k+1])+Math.abs(a[k+2]-b[k+2]);}
    }
    const refTops=cloudTops('reference'),tops=cloudTops(id),valid=tops.map((p,i)=>p.y!==null&&refTops[i].y!==null?Math.abs(p.y-refTops[i].y):null).filter(p=>p!==null);
    return {cloudIoU:intersection/union,unionRgbMAE:unionError/(union*3),overlapRgbMAE:colorError/(intersection*3),cloudTopMAE:valid.reduce((a,b)=>a+b,0)/valid.length,cloudTopSamples:tops,referenceCloudPixels:refCount,renderCloudPixels:renderCount,roiPixels:n,unionPixels:union,intersectionPixels:intersection};
  }
  const buffers={};
  function diagnostic(id,type){
    const key=id+type+onlyClouds;if(buffers[key])return buffers[key];
    const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d'),out=ctx.createImageData(W,H),a=pixels.reference,b=pixels[id];
    for(let i=0;i<W*H;i++){
      const k=i*4,ref=masks.reference[i],cur=masks[id][i],enabled=!onlyClouds||roi[i]&&(ref||cur);
      let color=[12,23,34];
      if(enabled&&type==='mask')color=ref&&cur?[222,235,239]:ref?[244,139,77]:cur?[83,209,231]:[19,35,49];
      if(enabled&&type==='diff'){
        const value=(Math.abs(a[k]-b[k])+Math.abs(a[k+1]-b[k+1])+Math.abs(a[k+2]-b[k+2]))/(3*160);
        const v=Math.min(1,value),stops=[[16,24,41],[122,68,170],[236,105,83],[255,227,155]],s=Math.min(2,Math.floor(v*3)),f=v*3-s;
        color=stops[s].map((c,j)=>Math.round(c+(stops[s+1][j]-c)*f));
      }
      out.data.set([...color,255],k);
    }
    ctx.putImageData(out,0,0);buffers[key]=c;return c;
  }
  function draw(){
    context.globalAlpha=1;context.imageSmoothingEnabled=false;
    if(mode==='reference')context.drawImage(images.reference,0,0);
    else if(mode==='render')context.drawImage(images[version],0,0);
    else if(mode==='diff'||mode==='mask')context.drawImage(diagnostic(version,mode),0,0);
    else{
      context.drawImage(images.reference,0,0);
      if(mode==='overlay'){context.globalAlpha=blend;context.drawImage(images[version],0,0);context.globalAlpha=1;}
      else{context.save();context.beginPath();context.rect(W*blend,0,W*(1-blend),H);context.clip();context.drawImage(images[version],0,0);context.restore();context.fillStyle='#ffda9a';context.fillRect(Math.floor(W*blend),0,2,H);}
    }
    if(onlyClouds){
      context.beginPath();ridge.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));context.lineTo(W,H);context.lineTo(0,H);context.closePath();
      if(mode!=='diff'&&mode!=='mask'){context.save();context.clip();context.drawImage(images.reference,0,0);context.restore();}
      context.fillStyle='rgba(8,18,28,.58)';context.fill();
      context.beginPath();ridge.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));context.strokeStyle='#e6ba7b';context.lineWidth=2;context.setLineDash([8,7]);context.stroke();context.setLineDash([]);
    }
    context.strokeStyle='#ffe0a8';context.lineWidth=1;context.strokeRect(point.x-12.5,point.y-12.5,25,25);
    loupe();
  }
  function loupe(){
    for(const [target,id] of [['reference-loupe','reference'],['render-loupe',version]]){
      const c=document.getElementById(target),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,300,300);
      g.drawImage(images[id],point.x-12,point.y-12,25,25,0,0,300,300);
      g.strokeStyle='rgba(11,22,35,.18)';g.lineWidth=1;g.beginPath();for(let i=0;i<=25;i++){g.moveTo(i*12+.5,0);g.lineTo(i*12+.5,300);g.moveTo(0,i*12+.5);g.lineTo(300,i*12+.5);}g.stroke();
      g.strokeStyle='#131d2b';g.lineWidth=3;g.strokeRect(144,144,12,12);g.strokeStyle='#ffcd82';g.lineWidth=1;g.strokeRect(144,144,12,12);
    }
    const k=(point.y*W+point.x)*4,ref=Array.from(pixels.reference.slice(k,k+3)),cur=Array.from(pixels[version].slice(k,k+3));
    document.getElementById('reference-rgb').textContent=`RGB (${ref.join(', ')})`;
    document.getElementById('render-rgb').textContent=`RGB (${cur.join(', ')})`;
    document.getElementById('delta').textContent=`|ΔRGB| = (${ref.map((c,i)=>Math.abs(c-cur[i])).join(', ')})`;
    document.getElementById('position').textContent=`x = ${point.x}, y = ${point.y}${locked?' · 已锁定':''}${roi[point.y*W+point.x]?'':' · 评估云区之外'}`;
    document.getElementById('render-label').textContent=version.toUpperCase()+' / 程序云';
  }
  function sizing(){const value=document.getElementById('zoom').value;const width=value==='fit'?document.getElementById('viewport').clientWidth:W*Number(value);canvas.style.width=width+'px';canvas.style.height=width*H/W+'px';}
  function pointer(event){const r=canvas.getBoundingClientRect();point={x:Math.max(0,Math.min(W-1,Math.floor((event.clientX-r.left)*W/r.width))),y:Math.max(0,Math.min(H-1,Math.floor((event.clientY-r.top)*H/r.height)))};draw();}
  const load=async(id,src)=>{
    const img=new Image();img.src=src;await img.decode();if(img.width!==W||img.height!==H)throw new Error(id+' 不是 2048×768，拒绝重采样比较');images[id]=img;
    const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0);pixels[id]=g.getImageData(0,0,W,H).data;
    masks[id]=new Uint8Array(W*H);for(let i=0;i<W*H;i++){const k=i*4;masks[id][i]=isCloud(pixels[id][k],pixels[id][k+1],pixels[id][k+2])?1:0;}
  };
  async function start(){
    await Promise.all([load('reference','../../../assets/blue-sky-train/source/blue-sky-train.png'),...['r01','r02','r03'].map(id=>load(id,`evidence/r03/render-${id}.png`))]);
    for(const id of ['r01','r02','r03'])metrics[id]=measure(id);
    const definitions=[['云轮廓交并比 ↑','cloudIoU',v=>(v*100).toFixed(2)+'%',true],['云区 RGB 均差 ↓','unionRgbMAE',v=>v.toFixed(2)+' / 255',false],['重合云区 RGB 均差 ↓','overlapRgbMAE',v=>v.toFixed(2)+' / 255',false],['主云顶纵向均差 ↓','cloudTopMAE',v=>v.toFixed(1)+' px',false]];
    document.getElementById('metrics').innerHTML='<table><thead><tr><th>指标</th><th>R01</th><th>R02</th><th>R03</th></tr></thead><tbody>'+definitions.map(([name,key,fmt,higher])=>`<tr><td>${name}</td><td>${fmt(metrics.r01[key])}</td><td>${fmt(metrics.r02[key])}</td><td class="${(metrics.r03[key]>metrics.r02[key])===higher?'improved':''}">${fmt(metrics.r03[key])}</td></tr>`).join('')+'</tbody></table>';
    const report={revision:'r03',dimensions:[W,H],time:0,sampling:'native cloudBank + sky render, no resizing or registration',geometrySources:{r01:'analytic geometry',r02:'analytic geometry',r03:'contours traced from reference SVG, four flat masks'},cloudMask:'R >= 90; G >= 145; B - R < 138; G / B > 0.72',roiPolygonUpperBoundary:ridge,referenceCloudTopSamples:cloudTops('reference'),cloudTopMethod:'19 columns x=100..1900; +/-20px band; >15 cloud pixels per row, at least 9 of 10 consecutive rows; y<480',metrics,limitations:['R03 直接使用参考 SVG 轮廓，几何误差降低不代表纯程序几何生成能力提升','颜色阈值为近似掩膜，不是精准云语义分割','RGB 均差不是感知距离；必须同时检查轮廓、色块和动画','仅渲染天空和云；对比视图的边界以下使用原图地景作定位，不计入指标']};
    document.getElementById('download').href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
    document.getElementById('status').textContent='2048 × 768 · 原始像素已对齐 · t = 0';
    document.getElementById('version').onchange=e=>{version=e.target.value;draw();};
    document.getElementById('mode').onchange=e=>{mode=e.target.value;draw();};
    document.getElementById('blend').oninput=e=>{blend=Number(e.target.value)/100;draw();};
    document.getElementById('roi').onchange=e=>{onlyClouds=e.target.checked;draw();};
    document.getElementById('zoom').onchange=sizing;new ResizeObserver(sizing).observe(document.getElementById('viewport'));
    canvas.onpointerdown=e=>{const r=canvas.getBoundingClientRect();if(mode==='split'&&Math.abs(e.clientX-r.left-r.width*blend)<16){dragging=true;canvas.setPointerCapture(e.pointerId);}};
    canvas.onpointermove=e=>{if(dragging){const r=canvas.getBoundingClientRect();blend=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));document.getElementById('blend').value=blend*100;draw();}else if(!locked)pointer(e);};
    canvas.onpointerup=e=>{if(dragging){dragging=false;canvas.releasePointerCapture(e.pointerId);}};
    canvas.onclick=e=>{pointer(e);locked=true;loupe();};
    canvas.onkeydown=e=>{const move={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(move){e.preventDefault();point.x=Math.max(0,Math.min(W-1,point.x+move[0]));point.y=Math.max(0,Math.min(H-1,point.y+move[1]));locked=true;draw();}};
    document.getElementById('unlock').onclick=()=>{locked=false;loupe();};sizing();draw();
    window.PixelCompare={ready:true,report,get point(){return {...point};},sample(x,y){const i=(y*W+x)*4;return Object.fromEntries(['reference','r01','r02','r03'].map(id=>[id,Array.from(pixels[id].slice(i,i+3))]));}};
  }
  start().catch(error=>{const node=document.getElementById('error');node.hidden=false;node.textContent='无法读取对比像素：'+error.message+'。请先运行 npm run compare:cloud，并通过项目本地服务打开页面。';document.getElementById('status').textContent='对比未就绪';console.error(error);});
})();
