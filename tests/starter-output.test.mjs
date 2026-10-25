import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {inflateRawSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {checkProjectLinks} from '../tools/check-project-links.mjs';

test('generated starter has complete documentation, portable ZIP contents and a working project',()=>{
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),output=resolve(root,'export','starter-check-'+crypto.randomUUID());
  const packed=spawnSync(process.execPath,['.agents/skills/layered-wallpaper/scripts/package-starter.mjs','--out',output],{cwd:root,windowsHide:true,encoding:'utf8'});
  assert.equal(packed.status,0,packed.stdout+packed.stderr);
  const project=resolve(output,'project'),links=checkProjectLinks(project);
  assert.deepEqual(links.broken,[],'The package contains a link to an omitted file');
  assert.ok(links.checked>30);
  const home=readFileSync(resolve(project,'index.html'),'utf8');
  assert.doesNotMatch(home,/<meta\b[^>]*http-equiv=["']refresh["']/i,'Home must remain a page users can return to');
  for(const entry of ['docs/WALLPAPER-SKILLS.md','docs/OUTPUT-AND-PUBLISH.md','CREDITS.md'])assert.ok(home.includes(entry),'Missing home destination '+entry);

  // Read the ZIP independently of the writer and compare actual archived
  // bytes with the manifest and the generated working directory.
  const zip=readFileSync(resolve(output,'wallpaper-starter.zip')),entries=new Map();let offset=0;
  while(zip.readUInt32LE(offset)===0x04034b50){
    const flags=zip.readUInt16LE(offset+6),method=zip.readUInt16LE(offset+8),size=zip.readUInt32LE(offset+18),nameLength=zip.readUInt16LE(offset+26),extraLength=zip.readUInt16LE(offset+28);
    assert.equal(flags&8,0,'Unexpected streamed ZIP data descriptor');
    const name=zip.subarray(offset+30,offset+30+nameLength).toString('utf8'),start=offset+30+nameLength+extraLength,bytes=zip.subarray(start,start+size);
    assert.ok(!entries.has(name),'Duplicate ZIP entry');
    entries.set(name,method===0?bytes:method===8?inflateRawSync(bytes):assert.fail('Unsupported ZIP compression'));
    offset=start+size;
  }
  assert.equal(zip.readUInt32LE(offset),0x02014b50);
  const manifest=JSON.parse(entries.get('project/STARTER-MANIFEST.json'));
  assert.equal(entries.size,manifest.files.length+1);
  for(const entry of manifest.files){
    assert.ok(entry.path.startsWith('project/')&&!entry.path.includes('..'));
    const actual=entries.get(entry.path);assert.ok(actual,'Missing ZIP entry '+entry.path);
    assert.equal(createHash('sha256').update(actual).digest('hex'),entry.sha256);
    assert.deepEqual(actual,readFileSync(resolve(output,entry.path)));
  }
  const doctor=spawnSync(process.execPath,['.agents/skills/layered-wallpaper/scripts/doctor.mjs','--json'],{cwd:project,windowsHide:true,encoding:'utf8'});
  assert.equal(doctor.status,0,doctor.stderr);
  assert.equal(JSON.parse(doctor.stdout).ready,true);
});
