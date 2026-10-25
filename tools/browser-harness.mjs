import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { createPreviewServer } from './serve.mjs';
import { findBrowser } from './find-browser.mjs';

export const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export async function until(fn,label,attempts=100){
  for(let i=0;i<attempts;i++){if(await fn())return;await sleep(100);}
  throw new Error('Timed out: '+label);
}
export async function browserHarness(){
  const executable=findBrowser();
  if(!executable)throw new Error('自动验收需要 Chrome 或 Edge；也可设置 EDGE_PATH 或 CHROME_PATH 指向本机浏览器。');
  const cache=resolve(root,'.cache'),profile=resolve(cache,'ta-'+crypto.randomUUID());
  mkdirSync(profile,{recursive:true});
  const server=createPreviewServer();
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  const child=spawn(executable,['--headless=new','--window-size=2048,1152','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--force-device-scale-factor=1','--mute-audio','--disable-background-timer-throttling','about:blank'],{windowsHide:true,stdio:'ignore'});
  let socket;
  const errors=[];
  async function close(){
    socket?.close();child.kill();server.closeAllConnections();await new Promise(r=>server.close(r));
    const local=relative(cache,profile);
    if(!isAbsolute(local)&&local!== '..'&&!local.startsWith('..'+sep)&&local.startsWith('ta-')){
      await sleep(300);try{rmSync(profile,{recursive:true,force:true});}catch{/* Own cache can be cleared after Edge releases its lock. */}
    }
  }
  try{
    let port;
    // On Windows the file can exist while Edge still holds its write lock.
    // Wait for a complete readable port, rather than racing its creation.
    await until(()=>{
      try{const value=Number(readFileSync(resolve(profile,'DevToolsActivePort'),'utf8').split('\n')[0]);
        if(Number.isInteger(value)&&value>0&&value<65536){port=value;return true;}}
      catch(error){if(!['ENOENT','EBUSY','EACCES','EPERM'].includes(error.code))throw error;}
      return false;
    },'Edge launch');
    let targets;
    await until(async()=>{
      try{targets=await(await fetch(`http://127.0.0.1:${port}/json`)).json();return targets.some(t=>t.type==='page'&&t.webSocketDebuggerUrl);}
      catch{return false;}
    },'Edge debugger');
    socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
    await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
    let sequence=0;const pending=new Map();
    socket.addEventListener('message',event=>{
      const message=JSON.parse(event.data);
      if(message.id&&pending.has(message.id)){pending.get(message.id)(message);pending.delete(message.id);}
      if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.exception?.description||message.params.exceptionDetails.text);
      if(message.method==='Runtime.consoleAPICalled'&&message.params.type==='error')errors.push(message.params.args.map(a=>a.description||a.value).join(' '));
    });
    const send=(method,params={})=>new Promise((r,j)=>{
      const id=++sequence,timeout=setTimeout(()=>{pending.delete(id);j(new Error('CDP timeout: '+method));},20000);
      pending.set(id,m=>{clearTimeout(timeout);m.error?j(new Error(m.error.message)):r(m.result);});
      socket.send(JSON.stringify({id,method,params}));
    });
    const evaluate=async expression=>{
      const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
      if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
      return result.result.value;
    };
    const viewport=(width,height)=>send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    const go=async url=>{
      await send('Page.navigate',{url});
      await until(()=>evaluate(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete'`).catch(()=>false),'navigation');
    };
    const screenshot=async path=>{
      await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
      const {width,height,x,y}=await evaluate('({width:innerWidth,height:innerHeight,x:scrollX,y:scrollY})');
      const result=await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:true,clip:{x,y,width,height,scale:1}});
      writeFileSync(path,Buffer.from(result.data,'base64'));
    };
    await send('Page.enable');await send('Runtime.enable');
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    return {base,go,evaluate,viewport,screenshot,send,errors,close};
  }catch(error){await close();throw error;}
}
