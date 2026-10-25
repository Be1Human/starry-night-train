import {readdirSync,readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname,relative,extname,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),files=[],skip=new Set(['.git','.cache','.venv','node_modules','dist','export','verification']);
function walk(path){for(const f of readdirSync(path,{withFileTypes:true})){if(f.isSymbolicLink())throw Error('Symlink not included in project: '+f.name);if(f.isDirectory()){if(!skip.has(f.name))walk(resolve(path,f.name));}else files.push(resolve(path,f.name));}}
walk(root);const failures=[],ignoredURL=/^(?:https?:|mailto:|data:|blob:|#|javascript:)/i;
for(const file of files){
  const rel=relative(root,file).replaceAll('\\','/'),type=extname(file);if(statSync(file).size>25*1048576)failures.push(rel+': oversized source artifact');
  if(/\.(?:mjs|js)$/.test(file)){const result=spawnSync(process.execPath,['--check',file],{windowsHide:true,encoding:'utf8'});if(result.status!==0)failures.push(rel+': '+result.stderr.trim());}
  if(type==='.json'){try{JSON.parse(readFileSync(file,'utf8'));}catch(e){failures.push(rel+': '+e.message);}}
  if(type==='.md'){
    const text=readFileSync(file,'utf8');for(const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)){let target=match[1].replace(/^<|>$/g,'').split(/\s+"/)[0];if(ignoredURL.test(target))continue;target=decodeURIComponent(target.split('#')[0].split('?')[0]);if(!target)continue;const absolute=resolve(dirname(file),target),local=relative(root,absolute);if(isAbsolute(local)||local==='..'||local.startsWith('..'+sep)||!existsSync(absolute))failures.push(rel+': broken link '+target);}
  }
}
const ta=resolve(root,'assets/blue-sky-train/ta-breakdown/2026-10-24-r01'),manifest=JSON.parse(readFileSync(resolve(ta,'manifest.json'),'utf8')),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
if(hash(readFileSync(resolve(ta,manifest.source.file)))!==manifest.source.sha256)failures.push('TA source hash differs');
for(const layer of manifest.layers){if(hash(readFileSync(resolve(ta,layer.file)))!==layer.sha256)failures.push('TA layer hash differs: '+layer.id);if(!existsSync(resolve(ta,layer.maskFile)))failures.push('TA mask missing: '+layer.id);}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log('Checked '+files.length+' curated files, JavaScript syntax, JSON, documentation links and '+manifest.layers.length+' exact TA layers.');
