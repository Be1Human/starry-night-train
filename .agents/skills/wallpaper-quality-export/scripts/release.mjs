import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { spawn } from 'node:child_process';
import { audit } from './audit.mjs';
import { writeReport } from './report.mjs';
import { root, args, freshDir, outputPath, runId, fingerprint, runtimeFiles, assetFiles, hash } from '../../layered-wallpaper/scripts/project.mjs';

const o=args();
if(o.help){console.log('release.mjs [--baseline 基线目录] [--out 项目内新目录] [--area all|core|terrain|water|foreground|clouds|music|steam] [--samples 90]');process.exit(0);}
const areas={
  core:['wallpaper','ground-blend'],terrain:['terrain','occlusion','scenery','ground-blend'],
  water:['water','shore','ground-blend'],foreground:['foreground'],clouds:['clouds'],music:['music'],steam:['steam'],
  all:['wallpaper','terrain','occlusion','scenery','shore','ground-blend','water','foreground','clouds','steam','music'],
};
const area=String(o.area||'all');if(!areas[area])throw Error('未知检查范围：'+area);
const out=freshDir(outputPath(o.out,'dist/wallpaper-accepted-'+runId()));
const measured=resolve(out,'measurements'),evidence=resolve(out,'checks'),staging=resolve(out,'candidate');
mkdirSync(evidence,{recursive:true});
const report=await audit({out:measured,baseline:o.baseline?resolve(root,String(o.baseline)):null,samples:Number(o.samples||90),target:Number(o.target||60)});
report.release={status:'running',area,checks:[],nativeWallpaperEngineTested:false};
const scripts={'wallpaper':'test-layered-wallpaper','shore':'test-layered-shader-shore',...Object.fromEntries(['ground-blend','terrain','occlusion','scenery','water','foreground','clouds','steam','music'].map(x=>[x,'test-layered-'+x]))};
async function run(label,script,extra=[]){
  const folder=resolve(evidence,label);mkdirSync(folder,{recursive:true});
  console.log('检查：'+label);let log='';
  const child=spawn(process.execPath,[resolve(root,'tools',script+'.mjs'),...extra],{cwd:root,windowsHide:true,env:{...process.env,LAYERED_VERIFICATION_DIR:folder,LAYERED_OUTPUT_DIR:staging},stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',x=>log+=x);child.stderr.on('data',x=>log+=x);
  const code=await new Promise((done,no)=>{child.once('error',no);child.once('close',done);});
  writeFileSync(resolve(folder,'command.log'),log);report.release.checks.push({label,passed:code===0,log:relative(out,resolve(folder,'command.log')).replaceAll('\\','/')});
  if(code!==0)throw Error(label+' 未通过；详见 '+resolve(folder,'command.log'));
}
try{
  if(report.status!=='passed')throw Error('性能、功能或无损画面对照未通过，停止导出');
  for(const name of areas[area])await run(name,scripts[name]);
  const before=fingerprint([...runtimeFiles,...assetFiles]);
  if(JSON.stringify(before)!==JSON.stringify(report.evidence.sourceHashes))throw Error('检查过程中源码发生变化，不能导出旧验收对应的新版源码');
  await run('build','build-layered-wallpaper');
  await run('offline','test-layered-offline');
  if(area==='all'||area==='clouds')await run('offline-clouds','test-layered-clouds',['--offline']);
  if(area==='all'||area==='music')await run('offline-music','test-layered-music',['--offline']);
  if(JSON.stringify(before)!==JSON.stringify(fingerprint([...runtimeFiles,...assetFiles])))throw Error('构建或断网检查时源码发生变化，请重新验收');
  renameSync(staging,resolve(out,'package'));
  report.release.status='passed';report.release.bundleHashes=fingerprintForBundle(resolve(out,'package'));
}catch(error){report.release.status='failed';report.release.error=error.stack;report.error=error.stack;report.status='failed';process.exitCode=1;}
// Fixed-frame evidence remains in measurements; preserve valid relative links.
report.evidence.shots=report.evidence.shots.map(x=>({...x,file:'measurements/'+x.file}));
writeFileSync(resolve(out,'audit.json'),JSON.stringify(report,null,2)+'\n');
writeReport(report,out);
console.log(`${report.release.status==='passed'?'✓ 已验收导出':'✗ 导出未通过'}：${resolve(out,'report.html')}`);
function fingerprintForBundle(path){return Object.fromEntries(['index.html','project.json','preview.png'].map(p=>[p,hash(readFileSync(resolve(path,p)))]));}
