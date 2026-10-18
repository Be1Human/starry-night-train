// 星河夜行列车：把逐帧录制的原始画面与音乐合成为成片。
// 效果：高光泛光、暗角、胶片颗粒、黑场淡入淡出、片头标题与片尾小字（带柔和阴影）、音频淡入淡出。
// 用法：node tools/compose-video.mjs --video export/raw.mp4 --audio <mp3> --out export/星河夜行列车.mp4 [--seconds 233.32]
import { spawn, execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, def) => {
  const i = process.argv.indexOf('--' + name);
  return i < 0 ? def : (process.argv[i + 1] ?? def);
};
const VIDEO = resolve(ROOT, arg('video', '../../export/starry-night-train/raw.mp4'));
const AUDIO = arg('audio', '');
const OUT = resolve(ROOT, arg('out', '../../export/starry-night-train/星河夜行列车.mp4'));
const probe = (f, sel) => +execFileSync('ffprobe', ['-v', 'error', ...sel, '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();
const D = +arg('seconds', 0) || (AUDIO ? probe(AUDIO, []) : probe(VIDEO, []));
const ENCODER = arg('encoder', 'x264');
// 只输出前 LIMIT 秒（样片用），淡出与片尾小字仍按完整时长 D 排布
const LIMIT = Math.min(+arg('limit', 0) || D, D);

const TITLE = '星　河　夜　行　列　车';
const SUBTITLE = 'Letter from the Clouds';
const ENDING = '愿每一段夜路，都有星光同行';
const FONT_CN = 'C\\:/Windows/Fonts/msyhl.ttc';
const FONT_EN = 'C\\:/Windows/Fonts/georgiai.ttf';

// 淡入 a→b、保持、淡出 c→d 的透明度表达式（逗号在单引号内无需转义）
const env = (a, b, c, d, peak) =>
  `'${peak}*if(lt(t,${a}),0,if(lt(t,${b}),(t-${a})/${b - a},if(lt(t,${c}),1,if(lt(t,${d}),(${d}-t)/${d - c},0))))'`;
const texts = [
  { text: TITLE, font: FONT_CN, size: 66, y: 'h*0.13', alpha: env(4, 6, 9.5, 11, .92) },
  { text: SUBTITLE, font: FONT_EN, size: 30, y: 'h*0.13+96', alpha: env(5, 7, 9.8, 11.2, .78) },
];
if (D > 30) texts.push({ text: ENDING, font: FONT_CN, size: 34, y: 'h*0.16', alpha: env(D - 13, D - 10.5, D - 5.5, D - 3.5, .85) });
const draw = (t, color) => `drawtext=fontfile='${t.font}':text='${t.text}':fontsize=${t.size}:fontcolor=${color}`
  + `:x=(w-text_w)/2:y=${t.y}:alpha=${t.alpha}`;

const fadeOut = Math.max(D - 5, 0).toFixed(3);
const filter = [
  // 泛光：只取高光（曲线压掉暗部），缩小后模糊再放大，滤色叠加
  `[0:v]format=gbrp,split=2[base][hi]`,
  `[hi]curves=all='0/0 0.5/0 1/1',scale=480:270:flags=bilinear,gblur=sigma=5,scale=1920:1080:flags=bicubic[bloom]`,
  // 原始帧来自 JPEG（BT.601 全范围），这里统一转成 BT.709 TV 范围，与输出的色彩标记一致
  `[base][bloom]blend=all_mode=screen:all_opacity=0.55,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,`
    + `vignette=angle=PI/5:mode=forward,noise=c0s=4:c0f=t+u[graded]`,
  // 文字阴影层：透明画布上写黑字再模糊，得到柔和阴影
  `color=c=black@0:s=1920x1080:r=30:d=${D},format=rgba,`
    + texts.map(t => draw(t, 'black@0.75')).join(',') + `,gblur=sigma=7[shadow]`,
  `[graded][shadow]overlay=0:3:format=auto,` + texts.map(t => draw(t, 'white')).join(',')
    + `,fade=t=in:st=0:d=3,fade=t=out:st=${fadeOut}:d=5,format=yuv420p,`
    + `setparams=range=tv:colorspace=bt709:color_primaries=bt709:color_trc=bt709[v]`,
];
if (AUDIO) filter.push(`[1:a]afade=t=in:st=0:d=2,afade=t=out:st=${fadeOut}:d=5[a]`);

const venc = ENCODER === 'nvenc'
  ? ['-c:v', 'h264_nvenc', '-preset', 'p7', '-tune', 'hq', '-rc', 'vbr', '-cq', '16', '-b:v', '0', '-profile:v', 'high']
  : ['-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high'];
const args = ['-hide_banner', '-loglevel', 'error', '-stats', '-y', '-i', VIDEO];
if (AUDIO) args.push('-i', AUDIO);
args.push('-filter_complex', filter.join(';'), '-map', '[v]');
if (AUDIO) args.push('-map', '[a]', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000');
args.push(...venc, '-pix_fmt', 'yuv420p', '-r', '30',
  '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-t', LIMIT.toFixed(3), '-movflags', '+faststart', OUT);

console.log(`时长 ${D.toFixed(2)}s（输出 ${LIMIT.toFixed(2)}s），编码器 ${ENCODER} → ${OUT}`);
const t0 = Date.now();
const ff = spawn('ffmpeg', args, { stdio: 'inherit' });
ff.on('exit', code => {
  console.log(code === 0 ? `合成完成，用时 ${((Date.now() - t0) / 1000).toFixed(1)}s` : `ffmpeg 失败，退出码 ${code}`);
  process.exit(code);
});
