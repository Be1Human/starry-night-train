export function selectPublicCatalog(inventory, selection) {
 const byId=new Map(inventory.templates.map(t=>[t.id,t]));
 const seen=new Set();
 const templates=selection.templates.map(item=>{
  if(seen.has(item.id))throw Error('Duplicate public selection: '+item.id);
  seen.add(item.id);
  const t=byId.get(item.id);
  if(!t)throw Error('Missing public template: '+item.id);
  if(!['integrated','standalone-example'].includes(t.status))throw Error('Public template is not reviewed-ready: '+item.id);
  if(!t.thumbnail.startsWith('library/thumbnails/')||item.review?.image!==t.thumbnail)throw Error('Public template needs its own reviewed render: '+item.id);
  if(!item.review?.basis||!item.lookFor?.length)throw Error('Missing visual selection record: '+item.id);
  return {...t,presentation:item};
 });
 const cases=selection.cases.map(id=>{
  const c=inventory.cases.find(c=>c.id===id);
  if(!c||['study','work-in-progress'].includes(c.status))throw Error('Unfinished public case: '+id);
  return {...c,layers:c.layers.filter(l=>seen.has(l.template)),recipePath:'cases/'+id+'/scene.json'};
 });
 if(!cases.some(c=>c.id===selection.featuredCase))throw Error('Featured case must be selected');
 const ids=new Set();
 const unique=item=>{if(!item.id||ids.has(item.id))throw Error('Missing or duplicate public entry: '+item.id);ids.add(item.id);};
 const wallpaperCategoryIds=new Set();
 for(const c of selection.wallpaperCategories??[]){
  if(!/^[a-z][a-z0-9-]*$/.test(c.id)||!c.name?.trim()||wallpaperCategoryIds.has(c.id))throw Error('Invalid wallpaper category: '+c.id);
  wallpaperCategoryIds.add(c.id);
 }
 const wallpapers=selection.wallpapers.map(item=>{
  unique(item);
  const c=inventory.cases.find(c=>c.id===item.caseId&&selection.cases.includes(c.id));
  const t=templates.find(t=>t.id===item.previewTemplate);
  if(!c||!c.layers.some(l=>l.role==='train'))throw Error('Train wallpaper requires a complete train case: '+item.id);
  if(!t||t.preview.kind!=='scene-context'||!c.layers.some(l=>l.template===t.id))throw Error('Wallpaper requires a selected full-scene preview: '+item.id);
  if(!item.title||item.poster!==c.preview)throw Error('Wallpaper cover must be the actual selected case render: '+item.id);
  if(!wallpaperCategoryIds.has(item.category))throw Error('Wallpaper requires a scene category: '+item.id);
  return {...item,kind:'wallpaper',preview:t.preview.path};
 });
 const categoryIds=new Set();
 for(const c of selection.materialCategories){if(categoryIds.has(c.id)||!c.sourceCategories?.length)throw Error('Invalid material category: '+c.id);categoryIds.add(c.id);}
 const materials=selection.materials.map(item=>{
  unique(item);
  const t=templates.find(t=>t.id===item.templateId);
  const category=selection.materialCategories.find(c=>c.id===item.category);
  if(!t)throw Error('Material requires a selected template: '+item.id);
  if(!category?.sourceCategories.includes(t.category))throw Error('Material category does not match its visual role: '+item.id);
  if(!item.title||item.poster!==t.thumbnail)throw Error('Material cover must be its actual render: '+item.id);
  const usedIn=wallpapers.filter(w=>inventory.cases.find(c=>c.id===w.caseId).layers.some(l=>l.template===t.id)).map(w=>w.id);
  if(!['shader','hybrid','asset'].includes(item.implementation))throw Error('Material needs its actual implementation method: '+item.id);
  if(item.implementation==='hybrid'&&!t.assets.length)throw Error('Hybrid material needs source assets: '+item.id);
  if(!item.summary||!item.editable?.length)throw Error('Material needs AI reuse guidance: '+item.id);
  const sourceCases=inventory.cases.filter(c=>c.layers.some(l=>l.template===t.id)).map(c=>({id:c.id,recipe:'cases/'+c.id+'/scene.json'}));
  return {...item,kind:'material',preview:t.preview.path,previewEngine:t.preview.engine,readme:t.readme,sourceFiles:t.sourceFiles,assets:t.assets,dependencies:t.dependencies??[],licenseNote:t.licenseNote,usedIn,sourceCases,guide:'library/materials/'+item.id+'.md',manifest:'library/materials/'+item.id+'.json'};
 });
 const materialCategories=selection.materialCategories.filter(c=>materials.some(m=>m.category===c.id)).map(({id,name})=>({id,name}));
 const wallpaperCategories=(selection.wallpaperCategories??[]).filter(c=>wallpapers.some(w=>w.category===c.id)).map(({id,name})=>({id,name}));
 return {schemaVersion:5,revision:selection.revision,featuredCase:selection.featuredCase,wallpapers,wallpaperCategories,materials,materialCategories,status:inventory.status,templates,cases};
}
