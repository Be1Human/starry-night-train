import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { root, runtimeFiles, assetFiles, args, MATERIALS, SCENE_LAYERS } from './project.mjs';
import { findBrowser } from '../../../../tools/find-browser.mjs';

export function inspectProject() {
  const missing=[],lfs=[];
  for(const file of [...runtimeFiles,...assetFiles]) {
    try { const p=resolve(root,file);if(!statSync(p).size)missing.push(file);
      else if(statSync(p).size<1024&&readFileSync(p,'utf8').startsWith('version https://git-lfs.github.com/spec/'))lfs.push(file);
    } catch {missing.push(file);}
  }
  let browser=null,browserError=null;try{browser=findBrowser();}catch(e){browserError=e.message;}
  const ffmpeg=spawnSync('ffmpeg',['-version'],{windowsHide:true,encoding:'utf8'}).status===0;
  return {ready:Number(process.versions.node.split('.')[0])>=22&&!missing.length&&!lfs.length,
    node:process.version,root,materialCount:MATERIALS.length,layerCount:SCENE_LAYERS.length,missing,lfs,
    browser,browserError,ffmpeg,note:'预览和导出只需 Node.js 22+；自动验收另需 Chrome/Edge，FFmpeg 只用于视频。'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const result=inspectProject();
  if(args().json)console.log(JSON.stringify(result,null,2));
  else {console.log(`${result.ready?'✓':'✗'} 项目${result.ready?'可以启动':'尚不能启动'} · Node ${result.node} · ${result.materialCount} 张素材 / ${result.layerCount} 层`);
    console.log(result.note);console.log('自动验收浏览器：'+(result.browser||result.browserError||'未找到；设置 EDGE_PATH 或 CHROME_PATH'));
    for(const f of result.missing)console.error('缺少文件：'+f);for(const f of result.lfs)console.error('素材还是 Git LFS 指针，请先 git lfs pull：'+f);}
  if(!result.ready)process.exitCode=1;
}
