import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {resolve,dirname,relative,isAbsolute,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';

export function checkProjectLinks(directory){
  const root=resolve(directory),files=[],broken=[],skip=new Set(['.git','.cache','.venv','node_modules','dist','export','verification']);let checked=0;
  function walk(folder){for(const entry of readdirSync(folder,{withFileTypes:true})){const path=resolve(folder,entry.name);if(entry.isSymbolicLink())throw Error('Cannot audit a linked directory: '+path);if(entry.isDirectory()){if(!skip.has(entry.name))walk(path);}else if(['.md','.html'].includes(extname(path)))files.push(path);}}
  walk(root);
  for(const file of files){
    const source=readFileSync(file,'utf8'),links=[];
    if(file.endsWith('.md'))for(const match of source.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g))links.push(match[1].replace(/^<|>$/g,'').split(/\s+"/)[0]);
    else for(const tag of source.matchAll(/<(?:a|img|link|script|source)\b[^>]*>/gi))for(const match of tag[0].matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi))links.push(match[1]);
    for(const link of links){
      if(/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(link)||link.includes('${'))continue;
      const target=decodeURIComponent(link.split('#')[0].split('?')[0]);if(!target)continue;
      checked++;const absolute=target.startsWith('/')?resolve(root,'.'+target):resolve(dirname(file),target),local=relative(root,absolute);
      if(isAbsolute(local)||local==='..'||local.startsWith('..'+sep)||!existsSync(absolute))broken.push({file:relative(root,file).replaceAll('\\','/'),target:link});
    }
  }
  return {files:files.length,checked,broken,passed:broken.length===0};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=checkProjectLinks(process.argv[2]||resolve(dirname(fileURLToPath(import.meta.url)),'..'));
  console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
}
