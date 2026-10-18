// 星河夜行列车 · 教程视频：用 edge-tts 逐段合成旁白，生成时间线与字幕。
// 用法：node themes/starry-night-train/tutorial-video/make-voice.mjs [--force]
// 输出：export/starry-night-train/tutorial/voice/*.mp3、timeline.json、tutorial.srt
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEGMENTS, VOICE, RATE, INTRO_LEAD, PAD_BEFORE, PAD_AFTER, OUTRO_TAIL } from './script.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../../../export/starry-night-train/tutorial');
const VOICE_DIR = resolve(OUT, 'voice');
const FORCE = process.argv.includes('--force');
mkdirSync(VOICE_DIR, { recursive: true });

const probe = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();
const srtTime = s => s.replace(',', '.').split(':').reduce((a, v) => a * 60 + +v, 0);
const fmt = s => {
  const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};

// 句级字幕过长时按标点切开，时间按字数分配
const MAX = 20;
function splitCue(c) {
  const text = c.text.trim();
  if (text.length <= MAX) return [c];
  const parts = text.match(/[^，、；：,;:]+[，、；：,;:]?/g) ?? [text];
  const chunks = [];
  let cur = '';
  for (const p of parts) {
    if (cur && (cur + p).length > MAX) { chunks.push(cur); cur = ''; }
    cur += p;
  }
  if (cur) chunks.push(cur);
  const total = chunks.reduce((a, s) => a + s.length, 0);
  let t = c.start;
  return chunks.map(s => {
    const d = (c.end - c.start) * s.length / total;
    const r = { start: t, end: t + d, text: s };
    t += d;
    return r;
  });
}
const clean = s => s.replace(/[，、；：。！,;:!]+$/u, '').trim();

const timeline = [];
let t = INTRO_LEAD - PAD_BEFORE;
for (const [i, seg] of SEGMENTS.entries()) {
  const base = resolve(VOICE_DIR, `${String(i).padStart(2, '0')}-${seg.id}`);
  const mp3 = base + '.mp3', srt = base + '.srt', txt = base + '.txt';
  const stale = !existsSync(txt) || readFileSync(txt, 'utf8') !== `${VOICE}|${RATE}|${seg.narration}`;
  if (FORCE || stale || !existsSync(mp3)) {
    console.log(`合成 ${seg.id} …`);
    for (let k = 0; ; k++) {
      try {
        execFileSync('edge-tts', ['--voice', VOICE, `--rate=${RATE}`, '--text', seg.narration, '--write-media', mp3, '--write-subtitles', srt], { stdio: ['ignore', 'ignore', 'pipe'] });
        break;
      } catch (e) {
        if (k >= 3) throw e;
        console.log(`  重试 ${k + 1}`);
      }
    }
    writeFileSync(txt, `${VOICE}|${RATE}|${seg.narration}`);
  }
  const voiceDur = probe(mp3);
  const start = t;
  const voiceAt = start + PAD_BEFORE;
  const cues = readFileSync(srt, 'utf8').trim().split(/\r?\n\r?\n/).map(b => {
    const lines = b.split(/\r?\n/);
    const [a, z] = lines[1].split(' --> ').map(srtTime);
    return { start: a + voiceAt, end: z + voiceAt, text: lines.slice(2).join('') };
  }).flatMap(splitCue).map(c => ({ ...c, text: clean(c.text) })).filter(c => c.text);
  let dur = PAD_BEFORE + voiceDur + PAD_AFTER;
  if (i === 0) dur += 0; // 片头留白已计入 start
  if (i === SEGMENTS.length - 1) dur += OUTRO_TAIL;
  timeline.push({ id: seg.id, start: i === 0 ? 0 : start, end: start + dur, voice: mp3, voiceAt, voiceDur, cues });
  t = start + dur;
}
const total = t;
writeFileSync(resolve(OUT, 'timeline.json'), JSON.stringify({ total, segments: timeline }, null, 2));
const allCues = timeline.flatMap(s => s.cues);
writeFileSync(resolve(OUT, 'tutorial.srt'), allCues.map((c, i) => `${i + 1}\n${fmt(c.start)} --> ${fmt(c.end)}\n${c.text}\n`).join('\n'));
console.log(`完成：${timeline.length} 段，总时长 ${total.toFixed(1)}s，字幕 ${allCues.length} 条`);
for (const s of timeline) console.log(`  ${s.id.padEnd(10)} ${s.start.toFixed(1).padStart(6)} → ${s.end.toFixed(1).padStart(6)}  旁白 ${s.voiceDur.toFixed(1)}s`);
