// 星河夜行列车：确定性逐帧录制。
// 无头 Edge 打开 index.html，接管 requestAnimationFrame 与 performance.now，
// 每帧推进 1000/fps 毫秒虚拟时间，画完立即在同一任务内 toDataURL 取 JPEG，经管道交给 ffmpeg 编码。
// 用法：node tools/record-video.mjs [--seconds 233.32] [--out export/raw.mp4] [--shots 0,8,14,60] [--no-video]
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, def) => {
  const i = process.argv.indexOf('--' + name);
  return i < 0 ? def : (process.argv[i + 1] ?? true);
};
const FPS = +arg('fps', 30);
const SECONDS = +arg('seconds', 10);
const WIDTH = +arg('width', 1920), HEIGHT = +arg('height', 1080);
const OUT = resolve(ROOT, arg('out', 'export/raw.mp4'));
const SHOTS = String(arg('shots', '')).split(',').filter(Boolean).map(Number);
const NO_VIDEO = process.argv.includes('--no-video');
const WARMUP = +arg('warmup', 60);
// 镜头时间线：0～ZOOM_T 秒内 smoothstep 从 ZOOM_FROM 拉到 ZOOM_TO，镜头高度同步从 CAMY_FROM 过渡到 CAMY_TO
const ZOOM_FROM = +arg('zoom-from', 1), ZOOM_TO = +arg('zoom-to', .5), ZOOM_T = +arg('zoom-time', 14);
const CAMY_FROM = +arg('camy-from', 0), CAMY_TO = +arg('camy-to', 0);
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9400 + Math.floor(Math.random() * 400);

const smooth = x => { const t = Math.min(Math.max(x, 0), 1); return t * t * (3 - 2 * t); };
function camAt(t) {
  const k = smooth(t / ZOOM_T);
  return { zoom: ZOOM_FROM + (ZOOM_TO - ZOOM_FROM) * k, camY: CAMY_FROM + (CAMY_TO - CAMY_FROM) * k };
}

mkdirSync(dirname(OUT), { recursive: true });
const shotDir = resolve(ROOT, 'export/shots');
if (SHOTS.length) mkdirSync(shotDir, { recursive: true });
const profile = resolve(tmpdir(), 'snt-record-' + process.pid);
rmSync(profile, { recursive: true, force: true });

const edge = spawn(EDGE, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--window-size=${WIDTH},${HEIGHT}`,
  `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--mute-audio',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
  '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--force-device-scale-factor=1',
  'about:blank',
], { stdio: 'ignore' });

let targets;
for (let i = 0; i < 80 && !targets; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(250); }
}
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
const evalJs = async expression => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
};

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
// 虚拟时钟：页面里所有 rAF 回调只在 __snt.step 时触发，时间戳与 performance.now 一致
await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
  let t = 1000, nid = 1; const q = new Map();
  window.requestAnimationFrame = cb => { const i = nid++; q.set(i, cb); return i; };
  window.cancelAnimationFrame = i => { q.delete(i); };
  performance.now = () => t;
  window.__snt = { step(ms) { t += ms; const cbs = [...q.values()]; q.clear(); for (const cb of cbs) cb(t); return q.size; }, now: () => t };
})();` });
await send('Page.navigate', { url: pathToFileURL(resolve(ROOT, 'index.html')).href });
for (let i = 0; i < 80; i++) {
  if (await evalJs(`typeof S === 'object' && typeof frame === 'function' && !!renderer && document.readyState === 'complete'`).catch(() => false)) break;
  await sleep(250);
}

const info = await evalJs(`(() => {
  Object.assign(S, { scale: 1, auto: false, fps: 60, paused: false, follow: true, zoom: ${ZOOM_FROM}, camY: ${CAMY_FROM} });
  document.body.classList.add('ui-hidden');
  document.getElementById('notice').hidden = true;
  syncUI(); resetClock();
  const gl = renderer.gl, d = gl && gl.getExtension('WEBGL_debug_renderer_info');
  return { gpu: d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : (gl ? 'webgl' : 'canvas2d'), hidden: document.hidden,
    inner: [innerWidth, innerHeight], dpr: devicePixelRatio, reduce: matchMedia('(prefers-reduced-motion: reduce)').matches };
})()`);
const DT = 1000 / FPS;
for (let i = 0; i < WARMUP; i++) await evalJs(`__snt.step(${DT})`);
const size = await evalJs(`[canvas.width, canvas.height, S.scale, S.detail]`);
console.log(JSON.stringify({ ...info, canvas: size, port: PORT }));
if (size[0] !== WIDTH || size[1] !== HEIGHT) throw new Error('画布尺寸不符：' + size);

let ff = null, ffDone = null;
if (!NO_VIDEO) {
  ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '10', '-pix_fmt', 'yuv420p', '-r', String(FPS), OUT,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  ffDone = new Promise((r, j) => ff.on('exit', c => (c === 0 ? r() : j(new Error('ffmpeg 退出码 ' + c)))));
}

const total = Math.round(SECONDS * FPS);
const shotFrames = new Map(SHOTS.map(s => [Math.min(Math.round(s * FPS), total - 1), s]));
const t0 = Date.now();
for (let f = 0; f < total; f++) {
  const { zoom, camY } = camAt(f / FPS);
  const grab = !NO_VIDEO || shotFrames.has(f);
  // 改镜头 → 推进一帧（advance + draw）→ 同一任务内取帧，避免绘图缓冲被清空
  const url = await evalJs(`(() => { S.zoom = ${zoom}; S.camY = ${camY}; __snt.step(${DT});
    return ${grab ? `canvas.toDataURL('image/jpeg', .95)` : `''`}; })()`);
  const buf = grab ? Buffer.from(url.slice(url.indexOf(',') + 1), 'base64') : null;
  if (shotFrames.has(f)) writeFileSync(resolve(shotDir, `shot-${String(shotFrames.get(f)).padStart(6, '0')}s.jpg`), buf);
  if (ff && !ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 150 === 0 || f === total - 1) {
    const el = (Date.now() - t0) / 1000, rate = (f + 1) / el;
    console.log(`帧 ${f + 1}/${total}  ${rate.toFixed(1)} fps  已用 ${el.toFixed(0)}s  剩余约 ${((total - f - 1) / rate).toFixed(0)}s  zoom=${zoom.toFixed(3)}`);
  }
}
if (ff) { ff.stdin.end(); await ffDone; }
if (logs.length) console.log('页面日志：\n' + logs.join('\n'));
console.log(`完成：${total} 帧，用时 ${((Date.now() - t0) / 1000).toFixed(1)}s` + (ff ? ` → ${OUT}` : ''));
ws.close(); edge.kill();
await sleep(500);
rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
process.exit(0);
