export const SCENE_MUSIC = {
  title:'云岸慢行 · 无歌词版',
  path:'assets/blue-sky-train/audio/layered-lake-r02/yunan-manxing-loop.mp3',
  download:'assets/blue-sky-train/audio/layered-lake-r02/yunan-manxing-loop.mp3',
};

export function createLayeredMusic(config){
  const key='blue-sky-layered-music-v1';let saved={};
  try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{}
  let enabled=typeof saved.enabled==='boolean'?saved.enabled:false;
  let volume=Number.isFinite(saved.volume)?Math.max(0,Math.min(1,saved.volume)):.35;
  let audibleVolume=volume>0?volume:.35;
  let sceneActive=false,blocked=false,failed=false,pending=false,disposed=false;
  const audio=document.createElement('audio');audio.id='scene-music';audio.src=config.src;audio.loop=true;audio.preload='auto';audio.volume=volume;audio.hidden=true;document.body.append(audio);
  const button=document.getElementById('scene-music-toggle'),slider=document.getElementById('scene-music-volume'),output=document.getElementById('scene-music-volume-value');
  const quickButton=document.getElementById('scene-music-quick-toggle'),status=document.getElementById('scene-music-status');
  const buttons=[button,quickButton].filter(Boolean);
  document.getElementById('scene-music-controls').hidden=false;
  if(quickButton)quickButton.hidden=false;
  const download=document.getElementById('scene-music-download');download.href=config.download;download.download=config.downloadName;
  function state(){return{title:config.title,enabled,volume,muted:audio.muted||volume===0,blocked,failed,sceneActive,playing:!audio.paused&&!audio.ended,loop:audio.loop,duration:audio.duration,currentTime:audio.currentTime};}
  function notify(){
    const s=state(),label=failed?'重新加载音乐':blocked?'点击播放音乐':!enabled?'开启音乐':s.muted?'取消静音':s.playing?'关闭音乐':'播放音乐';
    const mode=failed?'error':blocked?'blocked':!enabled?'off':s.muted?'muted':s.playing?'playing':'paused';
    for(const control of buttons){control.textContent=(control===quickButton?'♫ ':'')+label;control.setAttribute('aria-pressed',String(enabled));control.dataset.state=mode;control.title=config.title+' · '+(s.playing&&!s.muted?'正在播放':label);}
    if(status)status.textContent=failed?'音乐加载失败，请点击重试。':blocked?'点击“播放音乐”开始试听。':enabled&&s.muted?'音乐音量为零，点击“取消静音”恢复。':enabled&&!sceneActive?'画面已暂停；点击“播放音乐”一起继续。':enabled&&s.playing?config.title+' · 正在循环播放':config.title+' · 点击开启配乐，与画面一起暂停。';
    slider.value=String(Math.round(volume*100));output.value=Math.round(volume*100)+'%';audio.dataset.enabled=String(enabled);
  }
  function eligible(){return enabled&&sceneActive&&!document.hidden&&!disposed&&!failed;}
  function sync(){
    if(!eligible()){audio.pause();notify();return;}
    if(!audio.paused||pending){notify();return;}
    pending=true;
    Promise.resolve(audio.play()).then(()=>{blocked=false;if(!eligible())audio.pause();}).catch(error=>{if(error.name==='NotAllowedError')blocked=true;else if(error.name!=='AbortError')failed=true;}).finally(()=>{pending=false;notify();if(eligible()&&!blocked&&audio.paused)sync();});
  }
  function setOptions(patch={}){
    if(typeof patch.enabled==='boolean'){enabled=patch.enabled;if(!enabled)blocked=false;}
    if(Number.isFinite(patch.volume)){volume=Math.max(0,Math.min(1,patch.volume));if(volume>0)audibleVolume=volume;}
    audio.volume=volume;try{localStorage.setItem(key,JSON.stringify({enabled,volume}));}catch{}sync();
  }
  function toggle(){
    const play=failed||blocked||!enabled||audio.paused||audio.muted||volume===0;
    if(play){
      if(failed){failed=false;audio.load();}
      audio.muted=false;
      // A direct request to hear the music also resumes the scene. Otherwise
      // a paused canvas silently keeps the audio ineligible after this click.
      config.onPlay?.();
    }
    setOptions({enabled:play,...(play&&volume===0?{volume:audibleVolume}:{})});
  }
  for(const control of buttons)control.addEventListener('click',toggle);
  slider.addEventListener('input',()=>setOptions({volume:Number(slider.value)/100}));
  for(const event of ['playing','pause','loadedmetadata','ended','volumechange'])audio.addEventListener(event,notify);
  audio.addEventListener('error',()=>{failed=true;notify();});
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('pagehide',()=>{disposed=true;audio.pause();});
  window.addEventListener('pageshow',()=>{disposed=false;sync();});
  notify();return{get state(){return state();},setOptions,setActive(value){sceneActive=Boolean(value);sync();}};
}
