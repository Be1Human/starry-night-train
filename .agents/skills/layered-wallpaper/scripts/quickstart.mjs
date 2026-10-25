import { createPreviewServer } from '../../../../tools/serve.mjs';
import { inspectProject } from './doctor.mjs';
import { root,entry,args } from './project.mjs';
const options=args(),health=inspectProject();
if(!health.ready)throw Error('文件或 Node 版本不满足要求，请先运行 npm run wallpaper:doctor');
const server=createPreviewServer(root),port=options.port===undefined?4178:Number(options.port);
if(!Number.isInteger(port)||port<0||port>65535)throw Error('端口应为 0..65535');
async function listen(p){return new Promise((ok,no)=>{server.once('error',no);server.listen(p,'127.0.0.1',()=>{server.removeListener('error',no);ok();});});}
try{await listen(port);}catch(error){if(error.code!=='EADDRINUSE')throw error;console.log(`端口 ${port} 已占用，使用本项目的独立临时端口。`);await listen(0);}
const url=`http://127.0.0.1:${server.address().port}${entry}`;console.log('蓝天列车工作台：'+url);
if(options.check){
  try{for(const path of [entry,'/cases/blue-sky-layered/world.mjs']){
    const response=await fetch(`http://127.0.0.1:${server.address().port}${path}`);if(!response.ok)throw Error('预览服务检查失败：'+path);await response.arrayBuffer();}
    console.log('✓ 页面与运行模块可读取；浏览器画面请使用独立验收 skill 检查。');
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
}else{const close=()=>server.close(()=>process.exit());process.once('SIGINT',close);process.once('SIGTERM',close);}
