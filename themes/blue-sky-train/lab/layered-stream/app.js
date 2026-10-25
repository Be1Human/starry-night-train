import { WORLD, MATERIALS, SCENE_LAYERS } from '../../../../cases/blue-sky-layered/world.mjs';
import { InfiniteScene } from '../../../../cases/blue-sky-layered/renderer.js';
import { SCENE_MUSIC, createLayeredMusic } from '../../../../cases/blue-sky-layered/music.js';
const $=id=>document.getElementById(id);
const embedded=window.LAYERED_EMBEDDED||null;
const assetURL=path=>embedded?.[path]||'../../../../'+path;
const query=new URLSearchParams(location.search);
const state={ready:false,camera:0,time:0,windTime:0,cloudSeed:42,speed:1,direction:WORLD.defaultDirection,seed:42,paused:matchMedia('(prefers-reduced-motion: reduce)').matches,hostPaused:false,visibility:Object.fromEntries(SCENE_LAYERS.map(l=>[l.id,true])),selected:'mountains-far',solo:null,view:'scene',ripple:true,wind:true,guides:false};
let scene,music,raf,lastTick,nextFrame,lastUI=0,windowFrames=0,windowTime=performance.now(),fps=0,toastTimer;
const hostMusic={};
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
if(query.has('wallpaper')||window.LAYERED_WALLPAPER)document.body.classList.add('wallpaper');
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2200);}
function draw(){scene.render(state);}
function sync(){
  $('play').textContent=state.paused?'▶ 播放':'Ⅱ 暂停';$('play').setAttribute('aria-pressed',String(!state.paused));
  $('distance').textContent=(state.camera/WORLD.width).toFixed(2)+' 屏';$('metrics').textContent=`${fps.toFixed(0)} fps · ${scene.stats.instances} 个实例 · ${scene.stats.renderMs.toFixed(1)} ms`;
  $('timeline').textContent=`世界坐标 ${state.camera.toFixed(0)} px · 种子 ${state.seed}`;
  for(const [id,value] of [['left',-1],['right',1]]){$(id).classList.toggle('active',state.direction===value);$(id).setAttribute('aria-pressed',String(state.direction===value));}
  $('speed').value=state.speed;$('speed-value').value=state.speed.toFixed(1)+'×';
  for(const id of ['ripple','wind','guides'])$(id).checked=state[id];
  $('frame-label').textContent=state.view==='reference'?'原画参考 · 构图随行进变化':state.solo?SCENE_LAYERS.find(l=>l.id===state.solo).name+' · 独立运行':`动态组合 · ${scene.stats.scenery.label} · ${state.paused?'已暂停':state.direction===1?'列车向右 · 景物向左':'列车向左 · 景物向右'}`;
}
function active(){return state.ready&&!state.paused&&!state.hostPaused&&!document.hidden;}
function schedule(){cancelAnimationFrame(raf);lastTick=nextFrame=undefined;windowFrames=0;windowTime=performance.now();fps=0;if(active())raf=requestAnimationFrame(tick);music?.setActive(active()&&state.view==='scene');sync();}
function tick(now){
  if(!active())return;
  if(lastTick===undefined){lastTick=now;nextFrame=now;}
  // Keep the fractional deadline on 60/90/120/144 Hz displays. Resetting it to
  // "now" on each draw drops elapsed time and can turn a small delay into a
  // skipped refresh. Simulation still advances by actual elapsed wall time.
  const interval=1000/60;
  if(now>=nextFrame-.5){
    const delta=Math.min((now-lastTick)/1000,.1);lastTick=now;
    nextFrame+=Math.max(1,Math.floor((now-nextFrame+.5)/interval)+1)*interval;
    state.time+=delta;if(state.wind)state.windTime+=delta;state.camera+=delta*WORLD.pixelsPerSecond*state.speed*state.direction;draw();windowFrames++;
    if(now-windowTime>900){fps=windowFrames*1000/(now-windowTime);windowFrames=0;windowTime=now;}
    if(now-lastUI>160){sync();lastUI=now;}
  }
  raf=requestAnimationFrame(tick);
}
function pause(value=true){state.paused=Boolean(value);schedule();}
function direction(value){state.direction=value<0?-1:1;if(state.ready)draw();sync();}
function select(id){const l=SCENE_LAYERS.find(l=>l.id===id);if(!l)throw Error('Unknown layer: '+id);state.selected=id;
  $('selected-name').textContent=l.name;$('selected-note').textContent=l.note;$('layer-type').textContent=l.type;$('depth-value').textContent=l.depth?`视差 ${l.depth.toFixed(3).replace(/0+$/,'').replace(/\.$/,'')}×`:'与镜头同行 / 实时合成';$('download').disabled=!l.assets?.length;
  document.querySelectorAll('.layer').forEach(row=>{const visible=state.visibility[row.dataset.id];row.classList.toggle('selected',row.dataset.id===id);row.classList.toggle('off',!visible);row.querySelector('input').checked=visible;});
  if(state.view==='single'){state.solo=id;state.visibility[id]=true;}draw();sync();
}
function view(mode){if(!['scene','single','materials','reference'].includes(mode))throw Error('Unknown view');state.view=mode;state.solo=mode==='single'?state.selected:null;if(state.solo)state.visibility[state.solo]=true;
  document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===mode);b.setAttribute('aria-pressed',String(b.dataset.view===mode));});$('stage').hidden=mode==='materials';$('materials').hidden=mode!=='materials';$('reference').hidden=mode!=='reference';music?.setActive(active()&&mode==='scene');draw();sync();
}
function setVisibility(id,value){if(!(id in state.visibility))throw Error('Unknown layer');state.visibility[id]=Boolean(value);const row=document.querySelector(`.layer[data-id="${id}"]`);row?.classList.toggle('off',!value);if(row)row.querySelector('input').checked=Boolean(value);draw();sync();}
function setCamera(value){if(!Number.isFinite(value))throw Error('Camera must be finite');state.camera=value;draw();sync();}
function reset(){state.camera=0;state.time=0;state.windTime=0;state.cloudSeed=state.seed;state.speed=1;state.direction=WORLD.defaultDirection;for(const id of Object.keys(state.visibility))state.visibility[id]=true;view('scene');select(state.selected);draw();sync();}
function materialImage(id){const a=scene.assets[id];return a.cluster?.image||a.image;}
function nextClouds(){state.cloudSeed=(state.cloudSeed+1)>>>0;draw();sync();return state.cloudSeed;}
function nextScenery(){const before=scene.landscapeAt(state).kind;for(let i=1;i<=128;i++){const camera=state.camera+state.direction*WORLD.width*i,next=scene.landscapeAt({...state,camera});if(next.kind!==before){view('scene');setCamera(camera);return next;}}return scene.landscapeAt(state);}
function download(id){const asset=scene.assets[id];if(!asset)return;const a=document.createElement('a');a.href=materialImage(id).toDataURL('image/png');a.download=id+'.png';a.click();}
function buildUI(){let previous;$('asset-count').textContent=MATERIALS.length+' 张独立素材 · 随机平涂云';
  SCENE_LAYERS.forEach((layer,i)=>{if(previous!==layer.group){const group=document.createElement('div');group.className='group';group.textContent=layer.group;$('layers').append(group);previous=layer.group;}
    const row=document.createElement('div');row.className='layer';row.dataset.id=layer.id;const eye=document.createElement('input');eye.type='checkbox';eye.checked=true;eye.setAttribute('aria-label','显示'+layer.name);eye.addEventListener('change',()=>setVisibility(layer.id,eye.checked));
    const button=document.createElement('button'),num=document.createElement('b'),name=document.createElement('span'),depth=document.createElement('small');num.textContent=String(i+1).padStart(2,'0');name.textContent=layer.name;depth.textContent=layer.depth?layer.depth+'×':'·';button.append(num,name,depth);button.addEventListener('click',()=>{select(layer.id);view('single');});row.append(eye,button);$('layers').append(row);
  });
  MATERIALS.forEach(material=>{const bitmap=materialImage(material.id),tile=document.createElement('div');tile.className='material';const image=document.createElement('img');image.className='thumb checker';image.alt=material.id;image.src=bitmap.toDataURL('image/png');const caption=document.createElement('div');caption.className='caption';const label=document.createElement('span');label.textContent=material.label||SCENE_LAYERS.find(l=>l.assets?.includes(material.id))?.name||material.id;const size=document.createElement('small');size.textContent=`${bitmap.width}×${bitmap.height}`;const button=document.createElement('button');button.textContent='↓';button.setAttribute('aria-label','下载'+label.textContent);button.addEventListener('click',()=>download(material.id));caption.append(label,size,button);tile.append(image,caption);$('materials').append(tile);});
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));
  $('show-all').addEventListener('click',()=>{for(const id of Object.keys(state.visibility))state.visibility[id]=true;view('scene');select(state.selected);});
  $('solo').addEventListener('click',()=>view(state.view==='single'?'scene':'single'));$('download').addEventListener('click',()=>download(SCENE_LAYERS.find(l=>l.id===state.selected).assets?.[0]));
  $('reset').addEventListener('click',reset);$('play').addEventListener('click',()=>pause(!state.paused));$('left').addEventListener('click',()=>direction(-1));$('right').addEventListener('click',()=>direction(1));
  $('speed').addEventListener('input',e=>{state.speed=Number(e.target.value);sync();});$('back-screen').addEventListener('click',()=>setCamera(state.camera-WORLD.width));$('next-screen').addEventListener('click',()=>setCamera(state.camera+WORLD.width));
  $('next-scenery').addEventListener('click',nextScenery);$('next-clouds').addEventListener('click',nextClouds);
  for(const id of ['ripple','wind','guides'])$(id).addEventListener('change',e=>{state[id]=e.target.checked;draw();});
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('stage-shell').requestFullscreen();}catch{toast('当前窗口无法切换全屏');}});
  document.addEventListener('keydown',event=>{if(event.target.matches('input,button,select'))return;if(event.code==='Space'){event.preventDefault();pause(!state.paused);}if(event.code==='ArrowLeft')direction(-1);if(event.code==='ArrowRight')direction(1);});
  document.addEventListener('visibilitychange',schedule);window.addEventListener('pagehide',()=>cancelAnimationFrame(raf));reduce.addEventListener('change',e=>pause(e.matches));
}
window.wallpaperPropertyListener={applyUserProperties(properties){if(properties.speed)state.speed=Math.max(0,Math.min(4,Number(properties.speed.value)||0));if(properties.direction)state.direction=Number(properties.direction.value)<0?-1:1;if(properties.ripple)state.ripple=Boolean(properties.ripple.value);if(properties.paused)state.paused=Boolean(properties.paused.value);const musicPatch={};if(properties.music)musicPatch.enabled=Boolean(properties.music.value);if(properties.musicVolume)musicPatch.volume=Math.max(0,Math.min(1,Number(properties.musicVolume.value)/100||0));Object.assign(hostMusic,musicPatch);if(music)music.setOptions(musicPatch);if(state.ready){schedule();draw();}},setPaused(value){state.hostPaused=Boolean(value);if(state.ready)schedule();}};
async function init(){scene=await new InfiniteScene($('scene')).load(assetURL);$('reference').src=assetURL('assets/blue-sky-train/source/blue-sky-train.png');buildUI();state.ready=true;
  music=createLayeredMusic({title:SCENE_MUSIC.title,src:assetURL(SCENE_MUSIC.path),download:assetURL(SCENE_MUSIC.download),downloadName:'云岸慢行-无歌词版.mp3',onPlay(){if(state.view!=='scene')view('scene');if(state.paused)pause(false);}});if(Object.keys(hostMusic).length)music.setOptions(hostMusic);
  if(query.has('paused'))state.paused=true;if(query.has('camera'))state.camera=Number(query.get('camera'))||0;
  select(state.selected);$('loading').hidden=true;$('status').textContent='双向延伸 · 已就绪';
  window.LayeredWallpaper={state,scene,music,get stats(){return{...scene.stats,fps,assetCount:MATERIALS.length};},pause,direction,setCamera,setVisibility,select,view,reset,nextScenery,nextClouds,
    renderAt(camera,time=0){pause(true);state.camera=camera;state.time=time;state.windTime=time;draw();sync();},
    setSettings(patch){if(Number.isFinite(patch.speed))state.speed=Math.max(0,Math.min(4,patch.speed));for(const key of ['ripple','wind','guides'])if(key in patch)state[key]=Boolean(patch[key]);if(Number.isInteger(patch.seed)){state.seed=patch.seed;if(!Number.isInteger(patch.cloudSeed))state.cloudSeed=patch.seed;}if(Number.isInteger(patch.cloudSeed))state.cloudSeed=patch.cloudSeed;draw();sync();},
    layout(){return scene.layout(state);},exportPNG(){return $('scene').toDataURL('image/png');},exportAsset(id){return materialImage(id).toDataURL('image/png');}};
  schedule();
}
init().catch(error=>{console.error(error);$('loading').textContent=error.message;$('status').textContent='加载失败';});
