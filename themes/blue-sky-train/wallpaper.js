import { DEFAULTS, normalize, wallpaperPatch } from './settings.js';

const ASSET = '../../assets/blue-sky-train/vector/blue-sky-train-animated.svg';
const KEY = 'train-wallpapers:blue-sky-train:v1';
const host = window.wallpaperHost;
const query = new URLSearchParams(location.search);
const embedded = query.get('embed') === '1';
document.documentElement.classList.toggle('embedded', embedded);
const ui = document.getElementById('controls');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let saved;
try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* Private browsing can disable storage. */ }
let settings = normalize(host.connected || embedded ? {} : saved || {});
let svg, raf = 0, last = null, time = 0, renders = 0;
let hostApplied = false;
let explicitMotion = false;

function canAnimate() {
  return !!svg && !document.hidden && !host.paused && !settings.paused && settings.speed > 0 && (!motion.matches || explicitMotion || host.connected);
}
function schedule() {
  if (!raf && canAnimate()) raf = requestAnimationFrame(frame);
}
function resetClock() {
  cancelAnimationFrame(raf); raf = 0; last = null;
  schedule();
}
function frame(now) {
  raf = 0;
  if (!canAnimate()) { last = null; return; }
  const interval = 1000 / host.fps;
  if (last === null) last = now;
  if (now - last >= interval - 0.5) {
    time += Math.min((now - last) / 1000, Math.max(0.15, 2 / host.fps)) * settings.speed;
    last = now;
    svg.setCurrentTime(time); renders++;
  }
  schedule();
}
function save() {
  if (host.connected || embedded) return;
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* Storage is optional. */ }
}
function apply() {
  if (svg) {
    svg.setAttribute('preserveAspectRatio', settings.fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice');
    svg.querySelector('#ripple-displacement').setAttribute('scale', String(settings.ripple * 4));
    svg.querySelector('#water-layer').style.display = settings.ripple > 0 ? '' : 'none';
    svg.querySelector('#steam-layer').style.display = settings.steam ? '' : 'none';
    svg.setCurrentTime(time);
  }
  document.getElementById('pause').textContent = settings.paused || (motion.matches && !explicitMotion && !host.connected) ? '播放' : '暂停';
  document.getElementById('speed').value = settings.speed;
  document.getElementById('speed-value').value = settings.speed.toFixed(1) + '×';
  document.getElementById('ripple').value = settings.ripple;
  document.getElementById('steam').checked = settings.steam;
  document.getElementById('fit').value = settings.fit;
  resetClock();
}
function hostUpdate(kind) {
  if (!hostApplied && host.connected) { settings = { ...DEFAULTS }; hostApplied = true; }
  if (kind === 'properties' || host.connected) settings = normalize({ ...settings, ...wallpaperPatch(host.properties) });
  if (host.connected) ui.hidden = embedded || host.properties.showcontrols?.value !== true;
  apply();
}
host.notify = hostUpdate;

document.getElementById('pause').addEventListener('click', () => {
  if (motion.matches && !explicitMotion && !host.connected) { explicitMotion = true; settings.paused = false; }
  else settings.paused = !settings.paused;
  save(); apply();
});
for (const key of ['speed', 'ripple', 'steam', 'fit']) {
  document.getElementById(key).addEventListener('input', event => {
    const value = key === 'steam' ? event.target.checked : key === 'fit' ? event.target.value : Number(event.target.value);
    settings = normalize({ ...settings, [key]: value }); save(); apply();
  });
}
document.getElementById('reset').addEventListener('click', () => { settings = { ...DEFAULTS }; explicitMotion = false; time = 0; save(); apply(); });
document.getElementById('hide-controls').addEventListener('click', () => { ui.hidden = true; });
document.getElementById('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { /* Embedded wallpaper hosts can disallow fullscreen. */ }
});
document.addEventListener('keydown', event => {
  if ((event.target instanceof Element && event.target.matches('input, select, textarea')) || event.ctrlKey || event.altKey || event.metaKey) return;
  if (!embedded && event.key.toLowerCase() === 'h') ui.hidden = !ui.hidden;
  if (event.code === 'Space') { event.preventDefault(); document.getElementById('pause').click(); }
});
document.addEventListener('visibilitychange', resetClock);
motion.addEventListener('change', apply);

// The Gallery and standalone wallpaper share one clock and playback controls.
// Embedded previews use fresh defaults and never overwrite saved desktop preferences.
window.trainWallpaper = {
  get state() { return { ready: !!svg, time, renders, running: canAnimate(), settings: { ...settings }, fps: host.fps }; },
  setSettings(patch = {}) {
    settings = normalize({ ...settings, ...patch });
    if (patch.paused === false) explicitMotion = true;
    save(); apply();
    return this.state;
  },
  renderAt(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return this.state;
    time = seconds;
    if (svg) svg.setCurrentTime(time);
    return this.state;
  }
};

try {
  let source = document.getElementById('scene-source')?.innerHTML;
  if (!source) {
    const response = await fetch(ASSET);
    if (!response.ok) throw new Error(`SVG ${response.status}`);
    source = await response.text();
  }
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') throw new Error('SVG 格式错误');
  svg = document.importNode(doc.documentElement, true);
  document.getElementById('scene').replaceChildren(svg);
  svg.pauseAnimations(); svg.setCurrentTime(0);
  document.getElementById('scene').setAttribute('aria-busy', 'false');
  document.getElementById('status').hidden = true;
  ui.hidden = embedded || query.get('controls') !== '1';
  if (host.connected) hostUpdate('properties');
  else apply();
} catch (error) {
  document.getElementById('scene').setAttribute('aria-busy', 'false');
  document.getElementById('status').textContent = '画面加载失败。请在项目目录运行 npm start，再从本地地址打开。';
  console.error(error);
}
