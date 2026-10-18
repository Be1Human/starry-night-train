import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(readFileSync(resolve(root,'modules/source-map.json'),'utf8'));
export function moduleSource(name){
 const parts=manifest.files[name];
 return parts?parts.map(p=>readFileSync(resolve(root,p),'utf8')).join(''):readFileSync(resolve(root,manifest.legacyDirectory,name),'utf8');
}
export function syncModuleMirrors(){
 for(const name of Object.keys(manifest.files))writeFileSync(resolve(root,manifest.legacyDirectory,name),moduleSource(name));
 return Object.keys(manifest.files).length;
}
