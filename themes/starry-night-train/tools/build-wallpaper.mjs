// Build an isolated Wallpaper Engine package from the original single-file scene.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, chmodSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, '../../dist/starry-night-train');
const audioArg = process.argv.indexOf('--audio');
const audioSource = audioArg >= 0 ? resolve(process.argv[audioArg + 1]) : resolve(root, '../../assets/starry-night-train/audio/music.mp3');
if (!existsSync(audioSource)) throw new Error('Provide the soundtrack with --audio <mp3 path>.');
let html = readFileSync(resolve(root, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const defs = html.slice(html.indexOf('const SLIDERS ='), html.indexOf('const DEFAULTS ='));
const { sliders, toggles, colors } = vm.runInNewContext(defs + ';({sliders:SLIDERS,toggles:TOGGLES,colors:COLORS})');
function replaceOnce(from, to) {
  if (!html.includes(from)) throw new Error('Scene changed; missing build anchor: ' + from);
  html = html.replace(from, to);
}
const bootstrap = `<script>
// Register before the scene initializes: Wallpaper Engine may send initial settings early.
window.WE = { ready: false, properties: {}, fps: 30, paused: false, apply: null, music: true, volume: .35 };
window.wallpaperPropertyListener = {
  applyUserProperties(p) { Object.assign(WE.properties, p || {}); if (WE.ready) WE.apply(p || {}); },
  applyGeneralProperties(p) {
    if (p && typeof p.fps === 'number' && Number.isFinite(p.fps) && p.fps > 0) {
      WE.fps = Math.max(1, Math.min(240, p.fps));
      if (WE.ready) { resetClock(); request(); }
    }
  },
  setPaused(value) {
    WE.paused = !!value;
    if (WE.ready) {
      cancelAnimationFrame(raf); raf = 0; resetClock();
      if (!WE.paused) request();
      WE.syncMusic();
    }
  }
};
</script>`;
replaceOnce('<head>', '<head>\n' + bootstrap);
replaceOnce('<body>', '<body class="ui-hidden">\n<audio id="wallpaper-music" src="music.mp3" loop preload="auto"></audio>');
// Wallpaper Engine owns persistence. Browser saves must not override wallpaper properties.
replaceOnce("try { localStorage.removeItem('starry-night-train:v1'); } catch { /* 存储不可用时忽略 */ }", '');
replaceOnce('const S = normalize(saved);', 'const S = normalize(null);');
replaceOnce('if (!raf && !document.hidden && renderer)', 'if (!raf && !document.hidden && !WE.paused && renderer)');
replaceOnce('  raf = 0;\n  // 按时间预算限帧', '  raf = 0;\n  if (WE.paused || document.hidden) return;\n  // 按时间预算限帧');
html = html.replaceAll('1000 / S.fps', '1000 / Math.min(S.fps, WE.fps)');
const bridge = `
const music = document.getElementById('wallpaper-music');
WE.syncMusic = function() {
  music.volume = WE.volume;
  if (!WE.music || WE.paused || S.paused) { music.pause(); return; }
  if (music.paused) music.play().then(() => { WE.audioError = null; }).catch(e => {
    // A normal browser may require a click; Wallpaper Engine allows autoplay.
    WE.audioError = e.name + ': ' + e.message;
  });
};
music.addEventListener('error', () => { WE.audioError = 'Music load failed: ' + (music.error?.code || 'unknown'); });
document.addEventListener('pointerdown', () => WE.syncMusic());
// Wallpaper Engine property names are lowercase ASCII; map to the scene's original keys.
WE.apply = function(properties) {
  const patch = {};
  for (const [key] of SLIDERS) {
    const p = properties[key.toLowerCase()];
    if (p && typeof p.value === 'number' && Number.isFinite(p.value)) patch[key] = p.value;
  }
  for (const [key] of TOGGLES) {
    const p = properties[key.toLowerCase()];
    if (p && typeof p.value === 'boolean') patch[key] = p.value;
  }
  for (const [key] of COLORS) {
    const p = properties[key.toLowerCase()];
    if (!p || typeof p.value !== 'string') continue;
    const rgb = p.value.trim().split(/\\s+/).map(Number);
    if (rgb.length === 3 && rgb.every(Number.isFinite)) {
      patch[key] = '#' + rgb.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
    }
  }
  Object.assign(S, normalize({ ...S, ...patch }));
  if (properties.showcontrols && typeof properties.showcontrols.value === 'boolean')
    document.body.classList.toggle('ui-hidden', !properties.showcontrols.value);
  if (properties.musicenabled && typeof properties.musicenabled.value === 'boolean') WE.music = properties.musicenabled.value;
  if (properties.musicvolume && typeof properties.musicvolume.value === 'number' && Number.isFinite(properties.musicvolume.value))
    WE.volume = Math.max(0, Math.min(100, properties.musicvolume.value)) / 100;
  WE.syncMusic();
  applyPixelClass(); syncUI(); resetClock(); request();
};
WE.ready = true;
WE.apply(WE.properties);
if (WE.paused) { cancelAnimationFrame(raf); raf = 0; }
`;
replaceOnce('\n</script>\n</body>', bridge + '\n</script>\n</body>');
const properties = {};
let order = 0;
for (const [key, label, min, max, step, value, group] of sliders) {
  if (key === 'fps') continue; // Use Wallpaper Engine's global FPS setting.
  properties[key.toLowerCase()] = { order: order++, text: group + ' · ' + label, type: 'slider', min, max, value,
    fraction: step < 1, precision: step < 1 ? Math.max(2, String(step).split('.')[1]?.length || 0) : 0 };
}
for (const [key, text, value] of toggles) properties[key.toLowerCase()] = { order: order++, text, type: 'bool', value };
for (const [key, text, hex] of colors) properties[key.toLowerCase()] = { order: order++, text: '颜色 · ' + text, type: 'color',
  value: [1, 3, 5].map(i => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(6)).join(' ') };
properties.showcontrols = { order: order++, text: '显示网页调参面板', type: 'bool', value: false };
properties.musicenabled = { order: order++, text: '音乐 · 播放 Letter from the Clouds', type: 'bool', value: true };
properties.musicvolume = { order: order++, text: '音乐 · 音量', type: 'slider', min: 0, max: 100, value: 35 };
mkdirSync(out, { recursive: true });
if (audioSource !== resolve(out, 'music.mp3')) {
  const destination = resolve(out, 'music.mp3');
  // Windows CopyFile preserves a read-only source flag; permit rebuilding our own output.
  if (existsSync(destination)) chmodSync(destination, 0o666);
  copyFileSync(audioSource, destination);
  chmodSync(destination, 0o666);
}
writeFileSync(resolve(out, 'index.html'), html);
writeFileSync(resolve(out, 'project.json'), JSON.stringify({ title: '星河夜行列车 · Starry Night Train', type: 'web', file: 'index.html',
  preview: 'preview.png', description: '原版层级云、星河、蒸汽列车与水面倒影。纯程序实时渲染。仅供学习欣赏，来源与许可见源码说明。',
  general: { properties, supportsaudioprocessing: false } }, null, 2) + '\n');
copyFileSync(resolve(root, '../../assets/starry-night-train/images/screenshot.png'), resolve(out, 'preview.png'));
console.log(JSON.stringify({ output: out, properties: Object.keys(properties).length }));
