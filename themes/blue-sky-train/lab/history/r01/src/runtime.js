// Small shared host, inlined into each generated single-file example.
(() => {
  'use strict';
  const config = window.LAB_CONFIG;
  const canvas = document.getElementById('stage');
  const error = document.getElementById('error');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const defaults = { speed: 1, wind: 1, detail: 1, ripple: 1, follow: 1, debug: 0, scale: .65 };
  let settings = { ...defaults }, time = 0, paused = reduced.matches;
  let gl, program, locations, timer, pendingQuery, raf = 0, last = null, parentVisible = true, lost = false;
  let frames = 0, cpuMs = 0, gpuMs = null, measuredFps = 0, windowFrames = 0, windowStart = performance.now();
  let renderer = 'unavailable';
  if (new URLSearchParams(location.search).has('embed')) document.body.classList.add('embedded');
  function compile(type, source) {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(message);
    }
    return shader;
  }
  function resize() {
    if (!gl || lost) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.min(1920, Math.round(rect.width * settings.scale)));
    const height = Math.max(1, Math.round(width * 3 / 8));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    gl.viewport(0, 0, width, height); draw();
  }
  function initialize() {
    gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error('当前浏览器未提供 WebGL，无法运行着色器案例。');
    const vertex = compile(gl.VERTEX_SHADER, 'attribute vec2 a; void main(){gl_Position=vec4(a,0.,1.);}');
    const fragment = compile(gl.FRAGMENT_SHADER, window.LAB_FRAGMENT);
    program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(program, 'a');
    gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    locations = Object.fromEntries(['uRes', 'uTime', 'uSpeed', 'uWind', 'uDetail', 'uRipple', 'uFollow', 'uMode', 'uDebug'].map(name => [name, gl.getUniformLocation(program, name)]));
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    renderer = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    timer = gl.getExtension('EXT_disjoint_timer_query'); pendingQuery = null;
    lost = false; error.hidden = true; resize(); schedule();
  }
  function draw() {
    if (!gl || lost) return;
    const start = performance.now();
    if (timer && pendingQuery && timer.getQueryObjectEXT(pendingQuery, timer.QUERY_RESULT_AVAILABLE_EXT)) {
      gpuMs = gl.getParameter(timer.GPU_DISJOINT_EXT) ? null : timer.getQueryObjectEXT(pendingQuery, timer.QUERY_RESULT_EXT) / 1e6;
      timer.deleteQueryEXT(pendingQuery); pendingQuery = null;
    }
    let query = null;
    if (timer && !pendingQuery) { query = timer.createQueryEXT(); timer.beginQueryEXT(timer.TIME_ELAPSED_EXT, query); }
    gl.uniform2f(locations.uRes, canvas.width, canvas.height);
    gl.uniform1f(locations.uTime, time);
    for (const key of ['speed', 'wind', 'detail', 'ripple', 'follow']) gl.uniform1f(locations['u' + key[0].toUpperCase() + key.slice(1)], settings[key]);
    gl.uniform1i(locations.uMode, config.mode); gl.uniform1i(locations.uDebug, settings.debug);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (query) { timer.endQueryEXT(timer.TIME_ELAPSED_EXT); pendingQuery = query; }
    cpuMs = cpuMs * .9 + (performance.now() - start) * .1;
    frames++; windowFrames++;
    if (performance.now() - windowStart > 1000) {
      measuredFps = windowFrames / ((performance.now() - windowStart) / 1000);
      windowFrames = 0; windowStart = performance.now();
    }
    document.getElementById('metrics').textContent = `${canvas.width} × ${canvas.height} · ${paused ? '已暂停' : measuredFps.toFixed(1) + ' fps'} · CPU 提交 ${cpuMs.toFixed(2)} ms · GPU ${gpuMs === null ? '未测' : gpuMs.toFixed(2) + ' ms'}`;
    document.getElementById('timeline').value = Math.min(time, 60);
    document.getElementById('clock').textContent = time.toFixed(1) + ' s';
  }
  function active() { return !paused && !lost && !document.hidden && parentVisible; }
  function schedule() { if (!raf && active()) raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    if (!active()) { last = null; return; }
    if (last === null) last = now;
    const dt = now - last;
    if (dt >= 1000 / 30 - .4) { time += Math.min(dt / 1000, .1); last = now; draw(); }
    schedule();
  }
  function resetClock() {
    cancelAnimationFrame(raf); raf = 0; last = null; windowStart = performance.now(); windowFrames = 0;
    document.getElementById('pause').textContent = paused ? '播放' : '暂停'; schedule();
  }
  function setSettings(patch) {
    for (const key of ['speed', 'wind', 'detail', 'ripple']) {
      if (typeof patch[key] === 'number' && Number.isFinite(patch[key])) settings[key] = Math.max(0, Math.min(2, patch[key]));
    }
    if (patch.follow === 0 || patch.follow === 1) settings.follow = patch.follow;
    if ([0, 1, 2, 3].includes(patch.debug)) settings.debug = patch.debug;
    if ([.5, .65, 1].includes(patch.scale)) settings.scale = patch.scale;
    for (const element of document.querySelectorAll('[data-setting]')) {
      element.value = settings[element.dataset.setting];
      const output = element.parentElement.querySelector('output'); if (output) output.value = Number(element.value).toFixed(1);
    }
    resize();
  }
  for (const element of document.querySelectorAll('[data-setting]')) element.addEventListener('input', () => setSettings({ [element.dataset.setting]: Number(element.value) }));
  document.getElementById('pause').addEventListener('click', () => { paused = !paused; resetClock(); });
  document.getElementById('reset').addEventListener('click', () => { time = 0; setSettings(defaults); resetClock(); });
  document.getElementById('timeline').addEventListener('input', event => { paused = true; time = Number(event.target.value); draw(); resetClock(); });
  document.addEventListener('visibilitychange', resetClock);
  reduced.addEventListener('change', () => { paused = reduced.matches; resetClock(); });
  addEventListener('message', event => {
    if (event.source === parent && event.data?.type === 'ta-lab-visibility') { parentVisible = !!event.data.visible; resetClock(); }
  });
  document.addEventListener('keydown', event => {
    if (event.target instanceof Element && event.target.matches('input,select,textarea')) return;
    if (event.code === 'Space') { event.preventDefault(); paused = !paused; resetClock(); }
  });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; resetClock(); error.textContent = 'WebGL 上下文暂时丢失，等待恢复。'; error.hidden = false; });
  canvas.addEventListener('webglcontextrestored', () => { try { initialize(); } catch (cause) { error.hidden = false; error.textContent = cause.message; } });
  new ResizeObserver(resize).observe(canvas);
  window.TALab = {
    renderAt(value) { paused = true; time = Math.max(0, Number(value) || 0); resetClock(); draw(); },
    setSettings,
    setPaused(value) { paused = !!value; resetClock(); },
    get state() { return { ready: !!program && !lost, time, paused, frames, settings: { ...settings }, resolution: [canvas.width, canvas.height], cpuSubmitMs: cpuMs, gpuMs, measuredFps, renderer }; },
    pixels() { const pixels = new Uint8Array(canvas.width * canvas.height * 4); gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels); return pixels; },
    getError() { return gl.getError(); }
  };
  try { initialize(); resetClock(); } catch (cause) { error.textContent = '着色器初始化失败：' + cause.message; error.hidden = false; console.error(cause); }
})();
