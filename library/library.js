const $=id=>document.getElementById(id);
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const url=p=>'../'+p;
const posterUrl=p=>url(p)+'?v='+encodeURIComponent(catalog.revision);
let catalog,collection='wallpapers',category='all',current=null,api=null,token=0;
const listHash=()=>'#'+collection+(category==='all'?'':'/'+category);
const collectionCategories=()=>collection==='wallpapers'?catalog.wallpaperCategories:catalog.materialCategories;
const visibleItems=()=>catalog[collection].filter(item=>category==='all'||item.category===category);
const categoryName=(id,kind='material')=>(kind==='wallpaper'?catalog.wallpaperCategories:catalog.materialCategories).find(c=>c.id===id)?.name??'';
function renderGallery(){
 const materials=collection==='materials',items=visibleItems();
 document.querySelectorAll('[data-collection]').forEach(a=>{if(a.dataset.collection===collection)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 $('section-title').textContent=(materials?'分类素材':'壁纸实例')+(category==='all'?'':' · '+categoryName(category,materials?'material':'wallpaper'));
 $('gallery').setAttribute('aria-label',$('section-title').textContent);
 $('collection-categories').hidden=false;
 $('collection-categories').setAttribute('aria-label',materials?'素材分类':'实例分类');
 $('collection-categories').innerHTML=[{id:'all',name:materials?'全部素材':'全部实例'},...collectionCategories()].map(c=>'<a href="#'+collection+(c.id==='all'?'':'/'+c.id)+'" data-category="'+c.id+'"'+(c.id===category?' aria-current="page"':'')+'>'+esc(c.name)+'</a>').join('');
 $('gallery').dataset.singleWallpaper=String(!materials&&items.length===1);
 $('empty').hidden=items.length>0;
 $('empty').textContent=materials?'这里暂时没有收录的素材。':'这个分类暂时没有收录的实例。';
 $('gallery').innerHTML=items.map((item,index)=>'<button class="work" data-work="'+esc(item.id)+'" data-kind="'+item.kind+'" aria-label="预览'+esc(item.title)+'"><div class="work-image"><img src="'+posterUrl(item.poster)+'" alt="'+esc(item.alt)+'" width="1280" height="720" loading="'+(index<2?'eager':'lazy')+'"><span class="play-mark" aria-hidden="true">▶</span></div><div class="work-caption"><h2>'+esc(item.title)+'</h2>'+('<span class="material-kind">'+esc(categoryName(item.category,item.kind))+' · ↗</span>')+'</div></button>').join('');
 $('gallery').querySelectorAll('button').forEach((button,index)=>button.onclick=()=>openItem(items[index]));
}
function clearPlayer(){token++;api=null;$('player').replaceChildren();$('player').dataset.ready='false';$('pause').disabled=true;$('pause').textContent='暂停';$('player-status').textContent='';$('retry').hidden=true;}
function dismissViewer(restore=true){
 if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
 clearPlayer();current=null;if($('viewer').open)$('viewer').close();
 if(restore)history.replaceState(null,'',location.pathname+location.search+listHash());
}
function previewAdapter(win,depth=0){
 try{
  if(win.StarryModulePreview?.state.ready)return win.StarryModulePreview;
  if(win.trainWallpaper?.state.ready&&typeof win.trainWallpaper.setSettings==='function')return win.trainWallpaper;
  const hybrid=win.CloudLibrary;
  if(hybrid?.state.ready)return {
   get state(){const s=hybrid.state;return {...s,webgl:true,glError:hybrid.getError(),settings:{...s.settings,paused:s.paused}};},
   setSettings(patch){const {paused,...settings}=patch;if(Object.keys(settings).length)hybrid.setSettings(settings);if(typeof paused==='boolean')hybrid.setPaused(paused);},
   renderAt(time){hybrid.renderAt(time);return this.state;}
  };
  if(depth<2)for(const child of win.document.querySelectorAll('iframe')){const adapter=previewAdapter(child.contentWindow,depth+1);if(adapter)return adapter;}
 }catch{}
 return null;
}
function waitForPlayer(frame,request){return new Promise((resolve,reject)=>{let attempts=0;function check(){if(request!==token){resolve(null);return;}const candidate=previewAdapter(frame.contentWindow);if(candidate){resolve(candidate);return;}if(++attempts>200){reject(Error('暂时无法播放，请重试。'));return;}setTimeout(check,100);}check();});}
function renderDetails(item){
 $('viewer-details').open=false;
 if(item.kind==='wallpaper'){
  const related=catalog.materials.filter(m=>m.usedIn.includes(item.id));
  const scene=catalog.cases.find(c=>c.id===item.caseId);
  $('viewer-details').hidden=!related.length&&!item.summary;$('details-label').textContent=related.length?'配套素材':'作品与源码';
  $('details-content').innerHTML=(item.summary?'<p>'+esc(item.summary)+'</p><div class="source-links"><a href="'+url(scene.entry)+'" target="_blank" rel="noopener">单独打开 ↗</a><a href="'+url('cases/'+scene.id+'/README.md')+'" target="_blank" rel="noopener">实现说明 ↗</a><a href="'+url(scene.recipePath)+'" download>场景清单 ↗</a></div>':'')+related.map(m=>'<a href="#material/'+m.id+'">'+esc(categoryName(m.category))+' · '+esc(m.title)+' ↗</a>').join('');
 }else{
  const method={shader:'Shader',hybrid:'素材 + Shader',asset:'图像 / 矢量素材'}[item.implementation];
  $('viewer-details').hidden=false;$('details-label').textContent='使用与源码';
  $('details-content').innerHTML='<div class="reuse-intro"><span class="method-label">'+method+'</span><p>'+esc(item.summary)+'</p><p class="editable">可以修改：'+esc(item.editable.join('、'))+'</p></div><div class="reuse-actions"><button id="copy-ai" class="copy-ai">复制 AI 使用说明</button><a href="'+url(item.guide)+'" download>下载说明 ↗</a><a href="'+url(item.manifest)+'" download>素材清单 ↗</a><span id="copy-status" role="status"></span></div><textarea id="ai-text" aria-label="AI 使用说明" readonly hidden></textarea><div class="source-links"><a href="'+url(item.readme)+'" target="_blank" rel="noopener">实现说明 ↗</a>'+[...item.sourceFiles,...item.assets].map(p=>'<a href="'+url(p)+'" target="_blank" rel="noopener">'+esc(p.split('/').at(-1))+' ↗</a>').join('')+'</div>'+item.usedIn.map(id=>{const w=catalog.wallpapers.find(w=>w.id===id);return '<a href="#wallpaper/'+w.id+'">完整实例 · '+esc(w.title)+' ↗</a>';}).join('')+'<p>'+esc(item.licenseNote)+'</p>';
  $('copy-ai').onclick=async()=>{
   const button=$('copy-ai'),status=$('copy-status');button.disabled=true;
   try{
    const response=await fetch(url(item.guide));if(!response.ok)throw Error('guide unavailable');const guideText=await response.text();
    const siteRoot=new URL("../",location.href).href;
    const guide="素材所在站点："+siteRoot+"\n素材清单："+new URL(url(item.manifest),location.href).href+"\n下文的文件路径相对于上述站点。\n\n"+guideText;
    if(current?.id!==item.id)return;
    try{await navigator.clipboard.writeText(guide);status.textContent='已复制，粘贴给 AI 并填写你的需求。';}
    catch{const field=$('ai-text');field.value=guide;field.hidden=false;field.focus();field.select();status.textContent='说明已选中，请复制后交给 AI。';}
   }catch{if(current?.id===item.id)status.textContent='复制失败，可点击下载说明。';}finally{button.disabled=false;}
  };
 }
}
async function openItem(item,writeHash=true){
 if(!item)return;clearPlayer();current=item;
 collection=item.kind==='wallpaper'?'wallpapers':'materials';
 if(category!=='all'&&category!==item.category)category=item.category;
 renderGallery();const items=visibleItems(),index=items.findIndex(i=>i.id===item.id),request=token;
 $('viewer-title').innerHTML=esc(item.title)+'<span class="viewer-kind">'+esc(item.kind==='wallpaper'?categoryName(item.category,'wallpaper')+' · 完整实例':categoryName(item.category)+'素材')+'</span>';
 $('viewer-stage').style.aspectRatio=item.aspect??'16 / 9';
 $('viewer-poster').src=posterUrl(item.poster);$('viewer-poster').alt=item.alt;$('viewer-poster').hidden=false;
 $('position').textContent=items.length>1?String(index+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0'):'';
 $('previous').disabled=items.length<2;$('next').disabled=items.length<2;$('previous').parentElement.hidden=items.length<2;
 renderDetails(item);if(!$('viewer').open)$('viewer').showModal();
 if(writeHash)history.replaceState(null,'','#'+item.kind+'/'+item.id);
 $('player-status').textContent='正在展开画面…';
 const frame=document.createElement('iframe');frame.title=item.title+(item.kind==='wallpaper'?'动态壁纸':'素材预览');const frameUrl=new URL(url(item.preview),location.href);frameUrl.searchParams.set('embed','1');frameUrl.searchParams.set('v',catalog.revision);frame.src=frameUrl.href;$('player').replaceChildren(frame);
 try{const ready=await waitForPlayer(frame,request);if(!ready)return;api=ready;api.setSettings({...item.settings,paused:false});$('player').dataset.ready='true';$('viewer-poster').hidden=true;$('pause').disabled=false;$('player-status').textContent='';}catch(error){if(request===token){$('player').replaceChildren();$('player-status').textContent=error.message;$('retry').hidden=false;}}
}
function navigateItem(offset){if(!current)return;const items=visibleItems();if(items.length<2)return;const index=items.findIndex(i=>i.id===current.id);openItem(items[(index+offset+items.length)%items.length]);}
function followHash(){
 if(!catalog)return;let route='';try{route=decodeURIComponent(location.hash.slice(1));}catch{}
 const [group,id]=route.split('/');
 const material=group==='material'?catalog.materials.find(m=>m.id===id):catalog.materials.find(m=>m.id===route||m.templateId===route);
 const wallpaper=group==='wallpaper'?catalog.wallpapers.find(w=>w.id===id||w.aliases?.includes(id)):catalog.wallpapers.find(w=>w.id===route||w.aliases?.includes(route));
 const item=material??wallpaper;
 if(item){if(current?.id!==item.id||!$('viewer').open){category=item.category;openItem(item);}return;}
 dismissViewer(false);
 collection=group==='materials'?'materials':'wallpapers';category=collectionCategories().some(c=>c.id===id)?id:'all';renderGallery();
 const canonical=listHash();if(route&&'#'+route!==canonical)history.replaceState(null,'',location.pathname+location.search+canonical);
}
$('close').onclick=()=>dismissViewer();
$('viewer').addEventListener('cancel',event=>{event.preventDefault();dismissViewer();});
$('viewer').addEventListener('close',()=>{if(!$('viewer').open){clearPlayer();current=null;}});
$('pause').onclick=()=>{if(!api)return;const paused=!api.state.settings.paused;api.setSettings({paused});$('pause').textContent=paused?'继续':'暂停';};
$('retry').onclick=()=>openItem(current);
$('previous').onclick=()=>navigateItem(-1);$('next').onclick=()=>navigateItem(1);
$('fullscreen').hidden=!document.fullscreenEnabled;
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('viewer-surface').requestFullscreen();}catch{$('player-status').textContent='当前窗口无法全屏。';}};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'退出全屏':'全屏';});
$('viewer').addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();navigateItem(1);}if(event.key==='ArrowLeft'){event.preventDefault();navigateItem(-1);}});
window.addEventListener('pagehide',clearPlayer);window.addEventListener('hashchange',followHash);
try{
 const response=await fetch('catalog.json?v=r20-natural-shoreline-refined');if(!response.ok)throw Error('HTTP '+response.status);catalog=await response.json();
 if(!catalog.wallpapers?.length)throw Error('没有可展示的火车壁纸');followHash();
 window.LayerLibrary={get state(){return {ready:true,revision:catalog.revision,collection,category,total:visibleItems().length,visibleIds:visibleItems().map(i=>i.id),selected:current?.id??null,playing:!!api&&!api.state.settings.paused};}};
}catch(error){$('load-error').hidden=false;$('load-error').textContent='画廊暂时无法加载，请刷新重试。';console.error(error);}
