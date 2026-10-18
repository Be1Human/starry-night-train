// 星河夜行列车 · 教程视频：混合旁白与配乐，并与画面合成成片。
// 旁白按时间线放置；配乐两遍交叉淡化以覆盖全片，旁白出现时自动压低（侧链压缩），首尾淡入淡出，整体响度标准化。
// 用法：node mix.mjs [--music <mp3>] [--music-vol 0.5]
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const OUT_DIR = resolve(ROOT, 'export/starry-night-train/tutorial');
const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i < 0 ? def : (process.argv[i + 1] ?? def); };
const MUSIC = resolve(ROOT, arg('music', 'assets/starry-night-train/audio/music.mp3'));
const MUSIC_VOL = +arg('music-vol', 0.5);
const VIDEO = resolve(OUT_DIR, arg('video', 'video.mp4'));
const OUT = resolve(OUT_DIR, arg('out', '星河夜行列车-小白教程.mp4'));
const TL = JSON.parse(readFileSync(resolve(OUT_DIR, 'timeline.json'), 'utf8'));
const D = TL.total;

const inputs = ['-i', VIDEO, '-i', MUSIC, '-i', MUSIC];
const segs = TL.segments;
for (const s of segs) inputs.push('-i', s.voice);
const filter = [];
// 配乐：两遍交叉淡化，截到全片长度
filter.push(`[1:a][2:a]acrossfade=d=6:c1=tri:c2=tri,atrim=0:${D.toFixed(3)},asetpts=N/SR/TB,volume=${MUSIC_VOL}[mus]`);
// 旁白：逐段延迟后混合
segs.forEach((s, i) => {
  const ms = Math.round(s.voiceAt * 1000);
  filter.push(`[${i + 3}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${ms}|${ms}[v${i}]`);
});
filter.push(`${segs.map((_, i) => `[v${i}]`).join('')}amix=inputs=${segs.length}:normalize=0:duration=longest,apad=whole_dur=${D.toFixed(3)},asplit=2[voice][key]`);
filter.push(`[mus]aresample=48000,aformat=channel_layouts=stereo[mus48]`);
filter.push(`[mus48][key]sidechaincompress=threshold=0.02:ratio=8:attack=80:release=900:makeup=1[duck]`);
filter.push(`[duck][voice]amix=inputs=2:normalize=0:duration=first,afade=t=in:st=0:d=2,afade=t=out:st=${(D - 4).toFixed(3)}:d=4,loudnorm=I=-16:TP=-1.5:LRA=11[a]`);

const args = ['-hide_banner', '-loglevel', 'error', '-stats', '-y', ...inputs, '-filter_complex', filter.join(';'),
  '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', D.toFixed(3), '-movflags', '+faststart', OUT];
console.log(`混音：${segs.length} 段旁白 + 配乐，时长 ${D.toFixed(1)}s → ${OUT}`);
const ff = spawn('ffmpeg', args, { stdio: 'inherit' });
ff.on('exit', code => { console.log(code === 0 ? '合成完成' : `ffmpeg 失败，退出码 ${code}`); process.exit(code); });
