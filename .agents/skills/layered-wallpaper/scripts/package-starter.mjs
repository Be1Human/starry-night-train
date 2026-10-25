import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, lstatSync } from 'node:fs';
import { resolve, dirname, relative, extname } from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { root, args, freshDir, outputPath, runId, assetFiles, runtimeFiles, hash } from './project.mjs';
import { starterDocuments } from './starter-documents.mjs';

const o=args(),out=freshDir(outputPath(o.out,'export/wallpaper-starter-'+runId())),project=resolve(out,'project');
const files=new Set([...runtimeFiles,...assetFiles]);
function addTree(path){for(const item of readdirSync(resolve(root,path),{withFileTypes:true})){
  const file=path+'/'+item.name;if(item.isSymbolicLink())throw Error('示例包不跟随符号链接：'+file);
  if(item.isDirectory()){if(item.name!=='authoring'&&!item.name.startsWith('.'))addTree(file);}else files.add(file);
}}
for(const path of ['.agents/skills/layered-wallpaper','.agents/skills/wallpaper-quality-export'])addTree(path);
// Include the actual decomposition input and its implementation navigation.
// Fans can pass these to the skill without depending on the author's Temp files.
addTree('assets/blue-sky-train/ta-breakdown/2026-10-24-r01');
for(const file of ['AGENTS.md','docs/WALLPAPER-SKILLS.md','docs/OUTPUT-AND-PUBLISH.md','cases/blue-sky-layered/README.md',
  'cases/blue-sky-layered/shore-material.mjs','cases/blue-sky-layered/shoreline-material.mjs',
  'modules/train/original-starry-steam/source.glsl','modules/train/original-starry-steam/README.md',
  'themes/starry-night-train/README.md','themes/starry-night-train/index.html','tools/serve.mjs','tools/find-browser.mjs','tools/browser-harness.mjs','tools/build-layered-wallpaper.mjs',
  'tests/layered-world.test.mjs','tests/layered-clouds.test.mjs'])files.add(file);
const checkNames=['wallpaper','terrain','occlusion','scenery','shader-shore','ground-blend','water','foreground','clouds','steam','music','offline'];
for(const name of checkNames)files.add('tools/test-layered-'+name+'.mjs');
// Keep authored prompts and source notices; omit generated videos, models,
// machine logs, old verification folders and unused WAV/OGG duplicates.
for(const dir of ['layered-stream/r01','layered-stream/r07','layered-stream/r11','layered-stream/r13','layered-stream/r20','clouds/r17','foliage/r17']){
  for(const item of readdirSync(resolve(root,'assets/blue-sky-train',dir),{withFileTypes:true}))if(item.isFile()&&/\.(json|md|txt)$/i.test(item.name))files.add('assets/blue-sky-train/'+dir+'/'+item.name);
}
for(const file of ['clouds/r17/reference-pixel-cloud.png','foliage/r09/leaves.png','layered-stream/r13/shore-source.png','layered-stream/r20/reference-frame.png',
  'audio/layered-lake-r02/README.md','audio/layered-lake-r02/MODEL_LICENSE.txt','audio/layered-lake-r02/prompt.txt',
  'audio/layered-lake-r02/technical-report.json','audio/layered-lake-r02/brief.json'])files.add('assets/blue-sky-train/'+file);
for(const file of [...files].sort()){
  const source=resolve(root,file);if(!lstatSync(source).isFile())throw Error('不是普通文件：'+file);
  const target=resolve(project,file);mkdirSync(dirname(target),{recursive:true});copyFileSync(source,target);
}
// The slim package has its own index; the historical lab landing is omitted.
// Keep the workbench's home link usable without importing that old application.
const workbench=resolve(project,'themes/blue-sky-train/lab/layered-stream/index.html');
writeFileSync(workbench,readFileSync(workbench,'utf8').replace('<a class="back" href="../index.html">沿途 ↗</a>','<a class="back" href="../../../../index.html">示例首页 ↗</a>'));
const original=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
const scripts=Object.fromEntries(Object.entries(original.scripts).filter(([name])=>name.startsWith('wallpaper:')||name==='build:layered-wallpaper'||(name.startsWith('test:layered-')&&checkNames.includes(name.slice(13)))));
scripts.start=scripts['wallpaper:start'];scripts.test='node --test tests/*.test.mjs';
writeFileSync(resolve(project,'package.json'),JSON.stringify({...original,scripts},null,2)+'\n');
for(const [file,text]of Object.entries(starterDocuments)){const target=resolve(project,file);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,text);}
const ridgeReadme=resolve(project,'assets/blue-sky-train/layered-stream/r11/README.md');
writeFileSync(ridgeReadme,readFileSync(ridgeReadme,'utf8').replace(/\[(?:当前运行版本的验收报告|实际画面、对照及验证记录)\]\([^)]*\)(?:；历史 r11 逐轮证据在作者工作目录保留)?/,'[在本机重新验收与导出](../../../../docs/OUTPUT-AND-PUBLISH.md)'));
writeFileSync(resolve(project,'.gitignore'),'.cache/\ndist/\nexport/\nnode_modules/\n');
const entries=[];
function collect(path){for(const item of readdirSync(path,{withFileTypes:true})){
  const target=resolve(path,item.name);if(item.isDirectory())collect(target);else entries.push({path:'project/'+relative(project,target).replaceAll('\\','/'),bytes:readFileSync(target)});
}}
collect(project);entries.sort((a,b)=>a.path.localeCompare(b.path));
const manifest={created:new Date().toISOString(),files:entries.map(x=>({path:x.path,bytes:x.bytes.length,sha256:hash(x.bytes)}))};
const bytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');writeFileSync(resolve(project,'STARTER-MANIFEST.json'),bytes);entries.push({path:'project/STARTER-MANIFEST.json',bytes});
writeFileSync(resolve(out,'wallpaper-starter.zip'),makeZip(entries));
console.log(`✓ 示例项目：${project}\n✓ 可分享 ZIP：${resolve(out,'wallpaper-starter.zip')}\n${entries.length} 个文件；不含历史导出和缓存。`);

// Small standard ZIP writer, limited deliberately to this <4 GiB starter.
// No external archiver, npm package, Python or elevated installation required.
function makeZip(entries){
  const table=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
  const crc32=bytes=>{let n=0xffffffff;for(const b of bytes)n=table[(n^b)&255]^(n>>>8);return(n^0xffffffff)>>>0;};
  if(entries.length>=65535)throw Error('示例包文件过多');
  const locals=[],central=[];let offset=0,centralSize=0;
  for(const entry of entries){
    if(entry.path.startsWith('/')||entry.path.split('/').includes('..')||entry.path.includes('\\'))throw Error('ZIP 路径无效');
    const name=Buffer.from(entry.path),method=/\.(png|mp3)$/i.test(extname(entry.path))?0:8;
    const data=method?deflateRawSync(entry.bytes):entry.bytes,crc=crc32(entry.bytes);
    if(offset+data.length>=0xffffffff)throw Error('示例包过大');
    const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(method,8);local.writeUInt16LE(33,12);
    local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(entry.bytes.length,22);local.writeUInt16LE(name.length,26);locals.push(local,name,data);
    const record=Buffer.alloc(46);record.writeUInt32LE(0x02014b50,0);record.writeUInt16LE(20,4);record.writeUInt16LE(20,6);record.writeUInt16LE(0x800,8);record.writeUInt16LE(method,10);record.writeUInt16LE(33,14);
    record.writeUInt32LE(crc,16);record.writeUInt32LE(data.length,20);record.writeUInt32LE(entry.bytes.length,24);record.writeUInt16LE(name.length,28);record.writeUInt32LE(offset,42);central.push(record,name);centralSize+=record.length+name.length;offset+=local.length+name.length+data.length;
  }
  const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(centralSize,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...locals,...central,end]);
}
