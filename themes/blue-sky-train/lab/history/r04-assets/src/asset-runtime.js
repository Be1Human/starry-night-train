(() => {
 'use strict';
 const canvas=document.getElementById('stage'),error=document.getElementById('error'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
 const defaults={speed:1,wind:1,rate:1,mode:3,scale:.85,seed:42};
 const settings={...defaults},near=createAssetStream(1.15,false),far=createAssetStream(.70,true);
 const layout=new Float32Array(48),kinds=new Float32Array(12),textures=[],assetInfo=[];
 let time=0,distance=0,paused=reduce.matches,gl,program,locations,ready=false,lost=false,raf=0,last=null,frames=0,cpuMs=0,gpuMs=null,timer,pendingQuery,renderer='unavailable';
 let fps=0,windowFrames=0,windowStart=performance.now();
 const velocity=()=>settings.speed*.085*.30+settings.wind*.008;
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 function resize(){if(!ready||lost)return;const width=Math.max(1,Math.min(1920,Math.round(canvas.clientWidth*settings.scale)));canvas.width=width;canvas.height=Math.round(width*3/8);gl.viewport(0,0,canvas.width,canvas.height);draw();}
 async function initialize(){
   ready=false;gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});if(!gl)throw Error('浏览器不支持 WebGL');
   const vs=shader(gl.VERTEX_SHADER,'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'),fs=shader(gl.FRAGMENT_SHADER,ASSET_FRAGMENT);
   program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
   locations=Object.fromEntries(['uRes','uTime','uSpeed','uWind','uDetail','uRipple','uFollow','uMode','uDebug','uCloudTower','uCloudBank','uCloudLayout[0]','uCloudKinds[0]'].map(n=>[n,gl.getUniformLocation(program,n)]));
   textures.length=0;assetInfo.length=0;
   for(const [i,asset] of ASSET_CONFIG.assets.entries()){
     const img=new Image();img.src=asset.data;await img.decode();
     const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);textures.push(texture);
     assetInfo.push({id:asset.id,width:img.width,height:img.height,bytes:img.width*img.height*4});
     document.querySelector('[data-asset="'+asset.id+'"]').src=asset.data;
   }
   const ext=gl.getExtension('WEBGL_debug_renderer_info');renderer=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);timer=gl.getExtension('EXT_disjoint_timer_query');pendingQuery=null;
   ready=true;lost=false;error.hidden=true;resize();resetClock();
 }
 function draw(){
   if(!ready||lost)return;const start=performance.now();
   if(timer&&pendingQuery&&timer.getQueryObjectEXT(pendingQuery,timer.QUERY_RESULT_AVAILABLE_EXT)){gpuMs=gl.getParameter(timer.GPU_DISJOINT_EXT)?null:timer.getQueryObjectEXT(pendingQuery,timer.QUERY_RESULT_EXT)/1e6;timer.deleteQueryEXT(pendingQuery);pendingQuery=null;}
   let query=null;if(timer&&!pendingQuery){query=timer.createQueryEXT();timer.beginQueryEXT(timer.TIME_ELAPSED_EXT,query);}
   const a=far.update(distance*.45,settings.seed+113),b=near.update(distance,settings.seed);layout.set(a.layout,0);layout.set(b.layout,24);kinds.set(a.kinds,0);kinds.set(b.kinds,6);
   gl.uniform2f(locations.uRes,canvas.width,canvas.height);gl.uniform1f(locations.uTime,time);gl.uniform1f(locations.uSpeed,settings.speed);gl.uniform1f(locations.uWind,settings.wind);gl.uniform1f(locations.uDetail,1);gl.uniform1f(locations.uRipple,1);gl.uniform1f(locations.uFollow,1);gl.uniform1i(locations.uMode,settings.mode);gl.uniform1i(locations.uDebug,0);
   gl.uniform4fv(locations['uCloudLayout[0]'],layout);gl.uniform1fv(locations['uCloudKinds[0]'],kinds);
   textures.forEach((texture,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,texture);});gl.uniform1i(locations.uCloudTower,0);gl.uniform1i(locations.uCloudBank,1);gl.drawArrays(gl.TRIANGLES,0,3);
   if(query){timer.endQueryEXT(timer.TIME_ELAPSED_EXT);pendingQuery=query;}cpuMs=cpuMs*.9+(performance.now()-start)*.1;frames++;windowFrames++;
   if(performance.now()-windowStart>1000){fps=windowFrames*1000/(performance.now()-windowStart);windowFrames=0;windowStart=performance.now();}
   document.getElementById('clock').textContent=time.toFixed(1)+' s';document.getElementById('journey').textContent=`前进 ${(distance/(8/3)).toFixed(2)} 屏 · 种子 ${settings.seed} · 2 张完整素材 / 12 个循环槽位`;
   document.getElementById('metrics').textContent=`${canvas.width} × ${canvas.height} · ${paused?'暂停':fps.toFixed(1)+' fps'} · GPU ${gpuMs===null?'未测':gpuMs.toFixed(2)+' ms'}`;
 }
 function active(){return ready&&!lost&&!paused&&!document.hidden;}
 function schedule(){if(!raf&&active())raf=requestAnimationFrame(frame);}
 function frame(now){raf=0;if(!active()){last=null;return;}if(last===null)last=now;const dt=now-last;if(dt>=1000/30-.4){const delta=Math.min(dt/1000,.1)*settings.rate;time+=delta;distance+=delta*velocity();last=now;draw();}schedule();}
 function resetClock(){cancelAnimationFrame(raf);raf=0;last=null;windowStart=performance.now();windowFrames=0;document.getElementById('pause').textContent=paused?'播放':'暂停';schedule();}
 function setSettings(patch){
   for(const key of ['speed','wind'])if(Number.isFinite(patch[key]))settings[key]=Math.max(0,Math.min(2,patch[key]));
   if([1,4,16].includes(patch.rate))settings.rate=patch.rate;if([0,3,4,5].includes(patch.mode))settings.mode=patch.mode;if([.5,.85,1].includes(patch.scale))settings.scale=patch.scale;
   if(Number.isInteger(patch.seed))settings.seed=Math.max(0,Math.min(999999,patch.seed));
   for(const el of document.querySelectorAll('[data-setting]')){el.value=settings[el.dataset.setting];const out=el.parentElement.querySelector('output');if(out)out.value=Number(el.value).toFixed(1);}
   resize();
 }
 document.querySelectorAll('[data-setting]').forEach(el=>el.addEventListener('input',()=>setSettings({[el.dataset.setting]:Number(el.value)})));
 document.getElementById('pause').onclick=()=>{paused=!paused;resetClock();draw();};
 document.getElementById('reset').onclick=()=>{time=0;distance=0;setSettings(defaults);resetClock();};
 document.getElementById('reshuffle').onclick=()=>setSettings({seed:(settings.seed+1)%1000000});
 document.getElementById('forward').onclick=()=>{time+=30;distance+=30*velocity();draw();};
 document.addEventListener('visibilitychange',resetClock);reduce.addEventListener('change',()=>{paused=reduce.matches;resetClock();});
 document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.target.matches('input,select,button')){e.preventDefault();paused=!paused;resetClock();draw();}});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;resetClock();error.hidden=false;error.textContent='图形上下文暂时丢失，等待恢复。';});
 canvas.addEventListener('webglcontextrestored',()=>initialize().catch(fail));new ResizeObserver(resize).observe(canvas);
 function fail(e){error.hidden=false;error.textContent=e.message;console.error(e);}
 window.CloudLibrary={setSettings,renderAt(t){paused=true;time=Number.isFinite(t)?Math.max(0,t):0;distance=time*velocity();resetClock();draw();},setPaused(value){paused=!!value;resetClock();draw();},
   get state(){return {ready,time,distance,paused,frames,settings:{...settings},resolution:[canvas.width,canvas.height],renderer,cpuSubmitMs:cpuMs,gpuMs,fps,assets:assetInfo,streams:[far.state,near.state],textureBytes:assetInfo.reduce((s,a)=>s+a.bytes,0)};},
   pixels(){const p=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,p);return p;},getError(){return gl.getError();}};
 initialize().catch(fail);
})();
