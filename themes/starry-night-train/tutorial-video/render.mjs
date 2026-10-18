// 星河夜行列车 · 教程视频：逐帧确定性渲染舞台页（壁纸 + 卡片 + 字幕）。
// 本地静态服务 → 无头 Edge 打开 stage.html → 每帧推进虚拟时钟并整页截图 → ffmpeg 编码。
// 用法：
//   node render.mjs                       渲染完整画面 → export/starry-night-train/tutorial/video.mp4
//   node render.mjs --shots 5,40,120      只导出指定时刻的截图到 tutorial/shots/
//   node render.mjs --from 100 --to 130   只渲染一段（样片）
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { setTimeout as sleep } from 'node:timers/promises';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const OUT_DIR = resolve(ROOT, 'export/starry-night-train/tutorial');
const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i < 0 ? def : (process.argv[i + 1] ?? def); };
const FPS = +arg('fps', 30);
const SHOTS = String(arg('shots', '')).split(',').filter(Boolean).map(Number);
const OUT = resolve(OUT_DIR, arg('out', 'video.mp4'));
const EDGE = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const WARMUP = 45;

// ---- 静态服务 ----
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' };
const server = createServer((req, res) => {
  const p = resolve(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!p.startsWith(ROOT) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const HTTP = `http://127.0.0.1:${server.address().port}`;

// ---- 无头 Edge ----
const PORT = 9800 + Math.floor(Math.random() * 150);
const profile = resolve(tmpdir(), 'snt-tutorial-' + process.pid);
rmSync(profile, { recursive: true, force: true });
const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, '--window-size=1920,1080', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--mute-audio', '--hide-scrollbars',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
  '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--force-device-scale-factor=1', 'about:blank'], { stdio: 'ignore' });
let targets;
for (let i = 0; i < 80 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(250); } }
if (!targets) throw new Error('无法连接无头 Edge');
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
let seq = 0; const pending = new Map(); const logs = [];
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === 'Runtime.exceptionThrown') logs.push('[exception] ' + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text));
  else if (m.method === 'Runtime.consoleAPICalled' && m.params.type !== 'log') logs.push(`[${m.params.type}] ` + m.params.args.map(a => a.value ?? a.description).join(' '));
});
const send = (method, params = {}) => new Promise((r, j) => {
  const i = ++seq;
  pending.set(i, m => (m.error ? j(new Error(method + ': ' + m.error.message)) : r(m.result)));
  ws.send(JSON.stringify({ id: i, method, params }));
});
const evalJs = async (expression, awaitPromise = false) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
};
function cleanup() { try { ws.close(); } catch { /* 已关闭 */ } edge.kill(); server.close(); }

try {
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  // 虚拟时钟：舞台与壁纸 iframe 各自一份，只在 __snt.step 时推进
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
    let t = 1000, nid = 1; const q = new Map();
    window.requestAnimationFrame = cb => { const i = nid++; q.set(i, cb); return i; };
    window.cancelAnimationFrame = i => { q.delete(i); };
    performance.now = () => t;
    window.__snt = { step(ms) { t += ms; const cbs = [...q.values()]; q.clear(); for (const cb of cbs) cb(t); return q.size; } };
  })();` });
  await send('Page.navigate', { url: `${HTTP}/themes/starry-night-train/tutorial-video/stage.html` });
  for (let i = 0; i < 100; i++) { if (await evalJs('!!window.__stageReady').catch(() => false)) break; await sleep(200); }
  const info = await evalJs('__stage.init()', true);
  console.log(JSON.stringify(info));
  const DT = 1000 / FPS;
  for (let i = 0; i < WARMUP; i++) await evalJs(`__stage.frame(0, ${DT})`);

  const grab = async () => Buffer.from((await send('Page.captureScreenshot', { format: 'jpeg', quality: 93, captureBeyondViewport: false })).data, 'base64');

  if (SHOTS.length) {
    // 截图模式：从目标时刻前 2 秒开始推进，让运动与淡入状态自然
    const dir = resolve(OUT_DIR, 'shots'); mkdirSync(dir, { recursive: true });
    for (const s of SHOTS) {
      for (let t = Math.max(0, s - 2); t < s; t += 1 / FPS) await evalJs(`__stage.frame(${t}, ${DT})`);
      await evalJs(`__stage.frame(${s}, ${DT})`);
      const f = resolve(dir, `shot-${String(s).padStart(6, '0')}.jpg`);
      writeFileSync(f, await grab());
      console.log('截图 ' + f);
    }
  } else {
    const FROM = +arg('from', 0), TO = Math.min(+arg('to', info.total), info.total);
    mkdirSync(dirname(OUT), { recursive: true });
    const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(FPS), OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
    const ffDone = new Promise((r, j) => ff.on('exit', c => (c === 0 ? r() : j(new Error('ffmpeg 退出码 ' + c)))));
    const total = Math.round((TO - FROM) * FPS), t0 = Date.now();
    for (let f = 0; f < total; f++) {
      await evalJs(`__stage.frame(${FROM + f / FPS}, ${DT})`);
      const buf = await grab();
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 300 === 0 || f === total - 1) {
        const el = (Date.now() - t0) / 1000, rate = (f + 1) / el;
        console.log(`帧 ${f + 1}/${total}  ${rate.toFixed(1)} fps  已用 ${el.toFixed(0)}s  剩余约 ${((total - f - 1) / rate).toFixed(0)}s`);
      }
    }
    ff.stdin.end(); await ffDone;
    console.log(`完成：${total} 帧 → ${OUT}`);
  }
  if (logs.length) console.log('页面日志：\n' + logs.slice(0, 30).join('\n'));
} finally {
  cleanup();
  await sleep(500);
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
}
process.exit(0);
