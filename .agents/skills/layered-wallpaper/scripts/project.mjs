import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { MATERIALS, SCENE_LAYERS, WORLD } from '../../../../cases/blue-sky-layered/world.mjs';
import { SCENE_MUSIC } from '../../../../cases/blue-sky-layered/music.js';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
export const entry = '/themes/blue-sky-train/lab/layered-stream/index.html';
export { MATERIALS, SCENE_LAYERS, WORLD, SCENE_MUSIC };
export const runtimeFiles = [
  ...['world.mjs','renderer.js','procedural-shore.js','starry-steam.js','foreground.js','flat-clouds.js','music.js'].map(x=>'cases/blue-sky-layered/'+x),
  ...['index.html','app.js','style.css'].map(x=>'themes/blue-sky-train/lab/layered-stream/'+x),
];
export const assetFiles = [...new Set([...MATERIALS.map(x=>x.path), SCENE_MUSIC.path,
  'assets/blue-sky-train/source/blue-sky-train.png', 'assets/blue-sky-train/layered-stream/preview.png'])];
export const hash = data => createHash('sha256').update(data).digest('hex');
export const fingerprint = files => Object.fromEntries([...new Set(files)].sort().map(p=>[p,hash(readFileSync(resolve(root,p)))]));
export function args(argv=process.argv.slice(2)) {
  const result={};
  for(let i=0;i<argv.length;i++) {
    if(!argv[i].startsWith('--')) throw Error('参数应以 -- 开头：'+argv[i]);
    const key=argv[i].slice(2);
    if(key.includes('=')) throw Error('请用 --参数 值 的格式');
    result[key]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;
  }
  return result;
}
export function outputPath(value, fallback) {
  if(value===true) throw Error('输出目录参数缺少值');
  const target=resolve(root,value||fallback),local=relative(root,target);
  if(!local||isAbsolute(local)||local==='..'||local.startsWith('..'+sep)) throw Error('输出目录必须位于本项目内');
  return target;
}
export function freshDir(path) {
  if(existsSync(path)) throw Error('保留已有证据，请换一个新的输出目录：'+path);
  mkdirSync(path,{recursive:true});return path;
}
export const runId = () => new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,6);
