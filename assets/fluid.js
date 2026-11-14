/* =====================================================================
   首页流体光晕（WebGL2 stable fluids）

   算法移植自 Wu 官网 github.com/dstrml/wu
     website/src/components/FluidBackground.tsx
   原项目以 Apache-2.0 / GPL-3.0 双许可发布，此处按 Apache-2.0 条款
   使用并保留署名。
   Copyright (c) dstrml / Wu contributors
   Licensed under the Apache License, Version 2.0 (the "License");
   you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS.
   改动：改写为无框架 vanilla JS；颜色改为本网站
   LOGO 同源的深红 / 正红 / 暖白明暗两套；加入待机自动路径、明暗
   主题联动、reduced-motion 静帧、WebGL2 不可用时的 2D 降级，以及
   仅在首页可见时运行的视口判断。

   velocity / dye / pressure 三张 RGBA16F ping-pong 场，长边 256 格；
   每帧 splat → divergence → Jacobi 压力 10 次 → gradient → advect，
   display 用 perlin 噪声给光晕加细腻质感。
   ===================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var hero = doc.getElementById('hero');
  if (!hero) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  var debugMode = /[?&]debug=hero/.test(location.search);
  /* 无头软件渲染下持续 rAF + 全屏 perlin display 会拖垮截图；真实浏览器不受影响 */
  var headless = debugMode || Boolean(navigator.webdriver) || /HeadlessChrome/.test(navigator.userAgent);

  /* ---------- 参数：与参考站保持一致，只调整颜色与待机策略 ---------- */
  var CELLS_ON_LONG_SIDE = 256;
  var BRUSH_RADIUS = 0.3 * 0.16 * CELLS_ON_LONG_SIDE;   /* 放大笔刷，光团更弥散 */
  var IMPULSE = 0.075;                 /* 减小冲量，染料不再被推散到全屏 */
  var MAX_STAMPS = 16;
  var STAMP_SPACING = Math.max(0.004 * CELLS_ON_LONG_SIDE, BRUSH_RADIUS * 0.6);
  var PRESSURE_ITERATIONS = 10;
  var PRESSURE_DECAY = 0.8;
  var VELOCITY_FADE = 4 * Math.pow(0.05 / 4, 0.6);
  var DYE_FADE = 1.2;                 /* 留一点余辉，光团不至于太硬 */
  var CYCLE_PER_STAMP = 0.006;
  var CYCLE_PER_SECOND = 0.06;
  var AUTO_PATH_SPEED = 0.42;
  var RIPPLE_SECONDS = 1.6;
  var MAX_PIXEL_RATIO = 1.5;
  var IDLE_AFTER_MS = 2600;      /* 无鼠标 2.6s 后自动流动，静态首屏也有光 */

  /* 三色循环沿用参考站的 Oklab 插值机制。深色照搬它的高饱和蓝；
     浅色不能照搬：白底上 source-over 只能染色/变暗，饱和蓝会变成
     一层灰蓝水印，且与 LOGO 正红、标题笔刷打架。因此浅色改用与
     石墨灰同源的低饱和冷灰蓝，只留「纸上水痕」的形体与流动。
     加 ?glow=brand 可切暖灰系。 */
  var REFERENCE = {
    dark:  { colors: ['#1f4bff', '#55bdff', '#16c6e8'], opacity: 1.00 },
    light: { colors: ['#8096aa', '#a3b7c7', '#c6d5e0'], opacity: 0.32 }
  };
  var BRAND = {
    dark:  { colors: ['#ff2d2d', '#ff6a3d', '#ffb347'], opacity: 1.00 },
    light: { colors: ['#bd9188', '#d2ada3', '#e3ccc3'], opacity: 0.30 }
  };
  var PALETTES = /[?&]glow=brand/.test(location.search) ? BRAND : REFERENCE;
  /* 浅色策略对比开关：只覆盖 light，深色始终是参考站那团蓝。
     默认 = 与石墨灰同源的冷灰「纸上水痕」（推荐）；
     ?light=blue 保留改前的高饱和蓝，?light=warm 换 LOGO 红系低饱和暖灰。 */
  var LIGHT_VARIANTS = {
    blue: { colors: ['#1f4bff', '#55bdff', '#16c6e8'], opacity: 0.20 },
    warm: { colors: ['#bd9188', '#d2ada3', '#e3ccc3'], opacity: 0.30 }
  };
  var lightKey = (location.search.match(/[?&]light=(blue|warm)/) || [])[1];
  if (lightKey) PALETTES = { dark: PALETTES.dark, light: LIGHT_VARIANTS[lightKey] };

  var vertexSource = '#version 300 es\n' +
    'in vec2 position;\n' +
    'void main() { gl_Position = vec4(position, 0.0, 1.0); }';

  var fieldHeader = '#version 300 es\n' +
    'precision highp float;\n' +
    'precision highp sampler2D;\n' +
    'uniform vec2 grid;\n' +
    'out vec4 outColor;\n' +
    'ivec2 cell() { return ivec2(gl_FragCoord.xy); }\n' +
    'vec4 fetch(sampler2D field, ivec2 at) {\n' +
    '  return texelFetch(field, clamp(at, ivec2(0), ivec2(grid) - 1), 0);\n' +
    '}\n';

  var splatSource = fieldHeader +
    'uniform sampler2D velocity;\n' +
    'uniform sampler2D dye;\n' +
    'uniform vec2 point;\n' +
    'uniform vec2 impulse;\n' +
    'uniform float ringRadius;\n' +
    'uniform float radialImpulse;\n' +
    'uniform float strength;\n' +
    'uniform vec3 color;\n' +
    'uniform int splatTarget;\n' +
    'void main() {\n' +
    '  vec2 offset = gl_FragCoord.xy - point;\n' +
    '  float distance = length(offset);\n' +
    '  float fromBrush = distance - ringRadius;\n' +
    '  float influence = exp(-fromBrush * fromBrush / ' +
        (BRUSH_RADIUS * BRUSH_RADIUS).toFixed(4) + ') * strength;\n' +
    '  if (splatTarget == 0) {\n' +
    '    vec2 push = impulse + offset / max(distance, 1.0) * radialImpulse;\n' +
    '    outColor = vec4(fetch(velocity, cell()).xy + push * influence, 0.0, 1.0);\n' +
    '  } else {\n' +
    '    outColor = vec4(mix(fetch(dye, cell()).rgb, color, clamp(influence, 0.0, 1.0)), 1.0);\n' +
    '  }\n' +
    '}';

  var divergenceSource = fieldHeader +
    'uniform sampler2D velocity;\n' +
    'void main() {\n' +
    '  ivec2 c = cell();\n' +
    '  ivec2 last = ivec2(grid) - 1;\n' +
    '  vec2 self = fetch(velocity, c).xy;\n' +
    '  float left = c.x == 0 ? -self.x : fetch(velocity, c - ivec2(1, 0)).x;\n' +
    '  float right = c.x == last.x ? -self.x : fetch(velocity, c + ivec2(1, 0)).x;\n' +
    '  float below = c.y == 0 ? -self.y : fetch(velocity, c - ivec2(0, 1)).y;\n' +
    '  float above = c.y == last.y ? -self.y : fetch(velocity, c + ivec2(0, 1)).y;\n' +
    '  outColor = vec4((right - left + above - below) * 0.5, 0.0, 0.0, 1.0);\n' +
    '}';

  var scaleSource = fieldHeader +
    'uniform sampler2D field;\n' +
    'uniform float factor;\n' +
    'void main() { outColor = fetch(field, cell()) * factor; }';

  var jacobiSource = fieldHeader +
    'uniform sampler2D pressure;\n' +
    'uniform sampler2D divergence;\n' +
    'void main() {\n' +
    '  ivec2 c = cell();\n' +
    '  float sum = fetch(pressure, c - ivec2(1, 0)).x + fetch(pressure, c + ivec2(1, 0)).x\n' +
    '    + fetch(pressure, c - ivec2(0, 1)).x + fetch(pressure, c + ivec2(0, 1)).x;\n' +
    '  outColor = vec4((sum - fetch(divergence, c).x) * 0.25, 0.0, 0.0, 1.0);\n' +
    '}';

  var gradientSource = fieldHeader +
    'uniform sampler2D velocity;\n' +
    'uniform sampler2D pressure;\n' +
    'void main() {\n' +
    '  ivec2 c = cell();\n' +
    '  vec2 gradient = vec2(\n' +
    '    fetch(pressure, c + ivec2(1, 0)).x - fetch(pressure, c - ivec2(1, 0)).x,\n' +
    '    fetch(pressure, c + ivec2(0, 1)).x - fetch(pressure, c - ivec2(0, 1)).x\n' +
    '  ) * 0.5;\n' +
    '  outColor = vec4(fetch(velocity, c).xy - gradient, 0.0, 1.0);\n' +
    '}';

  var advectSource = fieldHeader +
    'uniform sampler2D velocity;\n' +
    'uniform sampler2D field;\n' +
    'uniform float dt;\n' +
    'uniform float fade;\n' +
    'uniform float floorAtZero;\n' +
    'void main() {\n' +
    '  vec2 source = gl_FragCoord.xy - fetch(velocity, cell()).xy * dt;\n' +
    '  source = clamp(source, vec2(0.5), grid - 0.5);\n' +
    '  vec3 value = texture(field, source / grid).rgb / (1.0 + fade * dt);\n' +
    '  outColor = vec4(mix(value, max(value, 0.0), floorAtZero), 1.0);\n' +
    '}';

  /* display：参考站的 perlin 颗粒质感 + 线性光转 sRGB；多加一个 opacity 供浅色压淡 */
  var displaySource = '#version 300 es\n' +
    'precision highp float;\n' +
    'uniform sampler2D dye;\n' +
    'uniform vec2 resolution;\n' +
    'uniform float pixelRatio;\n' +
    'uniform float opacity;\n' +
    'out vec4 outColor;\n' +
    'vec2 hash22(vec2 p) {\n' +
    '  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));\n' +
    '  q += dot(q, q.yzx + 33.33);\n' +
    '  return fract((q.xx + q.yz) * q.zy);\n' +
    '}\n' +
    'vec3 perlinWithGradient(vec2 p) {\n' +
    '  vec2 i = floor(p);\n' +
    '  vec2 f = fract(p);\n' +
    '  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);\n' +
    '  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);\n' +
    '  vec2 ga = hash22(i) * 2.0 - 1.0;\n' +
    '  vec2 gb = hash22(i + vec2(1.0, 0.0)) * 2.0 - 1.0;\n' +
    '  vec2 gc = hash22(i + vec2(0.0, 1.0)) * 2.0 - 1.0;\n' +
    '  vec2 gd = hash22(i + vec2(1.0, 1.0)) * 2.0 - 1.0;\n' +
    '  float va = dot(ga, f);\n' +
    '  float vb = dot(gb, f - vec2(1.0, 0.0));\n' +
    '  float vc = dot(gc, f - vec2(0.0, 1.0));\n' +
    '  float vd = dot(gd, f - vec2(1.0, 1.0));\n' +
    '  float k = va - vb - vc + vd;\n' +
    '  float value = va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * k;\n' +
    '  vec2 gradient = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd)\n' +
    '    + du * (u.yx * k + vec2(vb, vc) - va);\n' +
    '  return vec3(value, gradient);\n' +
    '}\n' +
    'float stone(vec2 p) {\n' +
    '  vec3 warp = vec3(0.0);\n' +
    '  float amplitude = 1.0;\n' +
    '  vec2 q = p;\n' +
    '  for (int octave = 0; octave < 3; octave++) {\n' +
    '    warp += perlinWithGradient(q) * amplitude;\n' +
    '    amplitude *= 0.5;\n' +
    '    q *= 2.0;\n' +
    '  }\n' +
    '  float sum = 0.0;\n' +
    '  float weight = 0.0;\n' +
    '  amplitude = 1.0;\n' +
    '  q = p + warp.yz * 0.4;\n' +
    '  for (int octave = 0; octave < 3; octave++) {\n' +
    '    sum += amplitude * (perlinWithGradient(q).x * 0.7 + 0.5);\n' +
    '    weight += amplitude;\n' +
    '    amplitude *= 0.5;\n' +
    '    q *= 2.0;\n' +
    '  }\n' +
    '  return sum / weight;\n' +
    '}\n' +
    'vec3 toSrgb(vec3 linear) {\n' +
    '  return mix(linear * 12.92, 1.055 * pow(linear, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, linear));\n' +
    '}\n' +
    'void main() {\n' +
    '  vec2 uv = gl_FragCoord.xy / resolution;\n' +
    '  vec2 grain = gl_FragCoord.xy / pixelRatio * 0.6;\n' +
    '  vec2 displaced = uv + perlinWithGradient(grain).yz * (0.15 * 0.008);\n' +
    '  vec3 ink = texture(dye, displaced).rgb;\n' +
    '  float alpha = clamp(max(ink.r, max(ink.g, ink.b)) * 1.35, 0.0, 1.0) * opacity;\n' +
    '  if (alpha < 0.002) { outColor = vec4(0.0); return; }\n' +
    '  float brightness = clamp(1.0 + (stone(grain) - 0.5) * 0.70, 0.0, 1.6);\n' +
    '  outColor = vec4(toSrgb(ink * brightness) * alpha, alpha);\n' +
    '}';

  /* ---------- 颜色：sRGB → linear → Oklab 插值 → linear ---------- */
  function hexToLinear(hex) {
    return [1, 3, 5].map(function (offset) {
      var c = parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
  }
  function linearToOklab(c) {
    var r = c[0], g = c[1], b = c[2];
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  }
  function oklabToLinear(c) {
    var l = Math.pow(c[0] + 0.3963377774 * c[1] + 0.2158037573 * c[2], 3);
    var m = Math.pow(c[0] - 0.1055613458 * c[1] - 0.0638541728 * c[2], 3);
    var s = Math.pow(c[0] - 0.0894841775 * c[1] - 1.291485548 * c[2], 3);
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
      .map(function (ch) { return Math.max(ch, 0); });
  }

  var colorStops = [], opacity = 1;
  function setPalette() {
    var p = PALETTES[root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'];
    colorStops = p.colors.map(function (h) { return linearToOklab(hexToLinear(h)); });
    opacity = p.opacity;
  }
  function cycleColor(position) {
    var scaled = (((position % 1) + 1) % 1) * colorStops.length;
    var seg = Math.min(colorStops.length - 1, Math.floor(scaled));
    var t = scaled - seg;
    var a = colorStops[seg] || [0, 0, 0];
    var b = colorStops[(seg + 1) % colorStops.length] || [0, 0, 0];
    return oklabToLinear([a[0] + (b[0] - a[0]) * t,
                          a[1] + (b[1] - a[1]) * t,
                          a[2] + (b[2] - a[2]) * t]);
  }

  /* ---------- WebGL 资源 ---------- */
  var canvas = doc.createElement('canvas');
  canvas.id = 'heroFluid';
  canvas.setAttribute('aria-hidden', 'true');
  var gl = null;
  try {
    gl = canvas.getContext('webgl2', { alpha: true, antialias: false,
        premultipliedAlpha: true, preserveDrawingBuffer: true });
  } catch (e) { gl = null; }
  if (!gl) return;                                  /* 交给 script.js 的 2D 面光兜底 */
  if (!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))) return;
  hero.insertBefore(canvas, hero.firstChild);
  window.__icFluid = true;

  function compileProgram(fragmentSource) {
    function compile(type, source) {
      var sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh;
      console.error('[fluid]', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    var v = compile(gl.VERTEX_SHADER, vertexSource);
    var f = compile(gl.FRAGMENT_SHADER, fragmentSource);
    var p = gl.createProgram();
    if (!v || !f || !p) return null;
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.bindAttribLocation(p, 0, 'position');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error('[fluid]', gl.getProgramInfoLog(p));
      return null;
    }
    var uniforms = {};
    var count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < count; i++) {
      var info = gl.getActiveUniform(p, i);
      if (info) uniforms[info.name] = gl.getUniformLocation(p, info.name);
    }
    return { program: p, uniforms: uniforms };
  }

  var programs = {
    splat: compileProgram(splatSource),
    divergence: compileProgram(divergenceSource),
    scale: compileProgram(scaleSource),
    jacobi: compileProgram(jacobiSource),
    gradient: compileProgram(gradientSource),
    advect: compileProgram(advectSource),
    display: compileProgram(displaySource)
  };
  var failed = false;
  Object.keys(programs).forEach(function (k) { if (!programs[k]) failed = true; });
  if (failed) {
    window.__icFluid = false;
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    return;                                           /* 降级到 2D 面光 */
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function createTarget(w, h) {
    var tex = gl.createTexture();
    var fb = gl.createFramebuffer();
    if (!tex || !fb) return null;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return null;
    return { texture: tex, framebuffer: fb };
  }
  function createPingPong(w, h) {
    var a = createTarget(w, h), b = createTarget(w, h);
    if (!a || !b) return null;
    var pair = { read: a, write: b, swap: function () { var t = pair.read; pair.read = pair.write; pair.write = t; } };
    return pair;
  }

  var gridWidth = 0, gridHeight = 0;
  var velocity = null, dye = null, pressure = null, divergenceTarget = null;
  function allocate(w, h) {
    var longSide = Math.max(w, h, 1);
    var nw = Math.max(1, Math.round(CELLS_ON_LONG_SIDE * w / longSide));
    var nh = Math.max(1, Math.round(CELLS_ON_LONG_SIDE * h / longSide));
    if (nw === gridWidth && nh === gridHeight) return true;
    gridWidth = nw; gridHeight = nh;
    velocity = createPingPong(nw, nh);
    dye = createPingPong(nw, nh);
    pressure = createPingPong(nw, nh);
    divergenceTarget = createTarget(nw, nh);
    return Boolean(velocity && dye && pressure && divergenceTarget);
  }

  function use(prog, textures) {
    gl.useProgram(prog.program);
    var unit = 0;
    Object.keys(textures).forEach(function (name) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, textures[name]);
      gl.uniform1i(prog.uniforms[name] || null, unit);
      unit++;
    });
    gl.uniform2f(prog.uniforms.grid || null, gridWidth, gridHeight);
    return prog.uniforms;
  }
  function drawInto(target) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, gridWidth, gridHeight);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  var colorCycle = 0;
  var pendingStamps = [];
  var pointer = null;
  var smoothedVelocity = { x: 0, y: 0 };
  var coordEl = doc.getElementById('heroCoord');
  function pad(v) { return ('0000' + Math.max(0, Math.round(v))).slice(-4); }

  function stamp(x, y, ix, iy, ring) {
    if (!velocity || !dye) return;
    ring = ring || { radius: 0, impulse: 0, strength: 1 };
    colorCycle += CYCLE_PER_STAMP;
    var color = cycleColor(colorCycle);
    var fields = [[0, velocity], [1, dye]];
    for (var n = 0; n < fields.length; n++) {
      var target = fields[n][0], field = fields[n][1];
      var u = use(programs.splat, { velocity: velocity.read.texture, dye: dye.read.texture });
      gl.uniform2f(u.point, x, y);
      gl.uniform2f(u.impulse, ix, iy);
      gl.uniform1f(u.ringRadius, ring.radius);
      gl.uniform1f(u.radialImpulse, ring.impulse);
      gl.uniform1f(u.strength, ring.strength);
      gl.uniform3f(u.color, color[0], color[1], color[2]);
      gl.uniform1i(u.splatTarget, target);
      drawInto(field.write);
      field.swap();
    }
  }

  function step(dt) {
    if (!velocity || !dye || !pressure || !divergenceTarget) return;
    var pending = pendingStamps.splice(0);
    for (var i = 0; i < pending.length; i++) {
      stamp(pending[i].x, pending[i].y, pending[i].impulseX, pending[i].impulseY);
    }
    use(programs.divergence, { velocity: velocity.read.texture });
    drawInto(divergenceTarget);

    var u = use(programs.scale, { field: pressure.read.texture });
    gl.uniform1f(u.factor, PRESSURE_DECAY);
    drawInto(pressure.write);
    pressure.swap();
    for (var it = 0; it < PRESSURE_ITERATIONS; it++) {
      use(programs.jacobi, { pressure: pressure.read.texture, divergence: divergenceTarget.texture });
      drawInto(pressure.write);
      pressure.swap();
    }
    use(programs.gradient, { velocity: velocity.read.texture, pressure: pressure.read.texture });
    drawInto(velocity.write);
    velocity.swap();

    var passes = [[velocity, VELOCITY_FADE, 0], [dye, DYE_FADE, 1]];
    for (var p = 0; p < passes.length; p++) {
      var field = passes[p][0];
      var a = use(programs.advect, { velocity: velocity.read.texture, field: field.read.texture });
      gl.uniform1f(a.dt, dt);
      gl.uniform1f(a.fade, passes[p][1]);
      gl.uniform1f(a.floorAtZero, passes[p][2]);
      drawInto(field.write);
      field.swap();
    }
  }

  var pixelRatio = 1;
  function render() {
    if (!dye) return;
    var u = use(programs.display, { dye: dye.read.texture });
    gl.uniform2f(u.resolution, canvas.width, canvas.height);
    gl.uniform1f(u.pixelRatio, pixelRatio);
    gl.uniform1f(u.opacity, opacity);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function autoPathPoint(seconds) {
    var t = seconds * AUTO_PATH_SPEED;
    return {
      x: gridWidth * (0.62 + 0.20 * Math.sin(t * 1.1) * Math.cos(t * 0.37)),
      y: gridHeight * (0.46 + 0.18 * Math.sin(t * 0.83 + 1.3) * Math.cos(t * 0.29 + 0.6))
    };
  }
  var autoSeconds = Math.random() * 100;

  var rippleSeconds = 0;
  function rippleStep(dt) {
    if (rippleSeconds >= RIPPLE_SECONDS) return;
    var progress = rippleSeconds / RIPPLE_SECONDS;
    var remaining = 1 - progress;
    var maxRadius = Math.hypot(gridWidth, gridHeight) / 2;
    var speed = (maxRadius * 3 * remaining * remaining) / RIPPLE_SECONDS;
    stamp(gridWidth / 2, gridHeight / 2, 0, 0, {
      radius: maxRadius * (1 - Math.pow(remaining, 3)),
      impulse: speed * IMPULSE,
      strength: remaining
    });
    rippleSeconds += dt;
  }

  function addStroke(from, to, seconds) {
    var dx = to.x - from.x, dy = to.y - from.y;
    var distance = Math.hypot(dx, dy);
    if (distance === 0 || distance > Math.max(gridWidth, gridHeight) * 0.3) return false;
    smoothedVelocity = {
      x: smoothedVelocity.x * 0.4 + (dx / seconds) * 0.6,
      y: smoothedVelocity.y * 0.4 + (dy / seconds) * 0.6
    };
    var count = Math.min(MAX_STAMPS, Math.max(1, Math.ceil(distance / STAMP_SPACING)));
    for (var i = 1; i <= count; i++) {
      var t = i / count;
      pendingStamps.push({
        x: from.x + dx * t, y: from.y + dy * t,
        impulseX: smoothedVelocity.x * IMPULSE,
        impulseY: smoothedVelocity.y * IMPULSE
      });
    }
    return true;
  }

  var raf = 0, lastFrame = null, lastActivity = -Infinity, near = true, frames = 0;
  function wake() {
    lastActivity = performance.now();
    if (!raf && !reduceMotion && !headless && near && !document.hidden) raf = requestAnimationFrame(tick);
  }
  function movePointer(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    var inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    var now = performance.now();
    var next = {
      x: ((clientX - rect.left) / rect.width) * gridWidth,
      y: (1 - (clientY - rect.top) / rect.height) * gridHeight,
      time: now
    };
    var previous = pointer;
    pointer = next;
    if (!inside) {
      if (coordEl) coordEl.textContent = 'X 0000 / Y 0000';
      smoothedVelocity = { x: 0, y: 0 };
      return;
    }
    if (coordEl) coordEl.textContent = 'X ' + pad(clientX - rect.left) + ' / Y ' + pad(clientY - rect.top);
    if (!previous || now - previous.time > 100) {
      smoothedVelocity = { x: 0, y: 0 };
      return;
    }
    if (addStroke(previous, next, Math.max((now - previous.time) / 1000, 1 / 240))) wake();
  }
  function onMouseMove(e) { movePointer(e.clientX, e.clientY); }
  function onTouchMove(e) {
    var t = e.touches[0];
    if (t) movePointer(t.clientX, t.clientY);
  }

  function advance(dt, now, doRender) {
    colorCycle += dt * CYCLE_PER_SECOND;
    var interactive = !coarse && (now - lastActivity < IDLE_AFTER_MS);
    if (!interactive) {
      var from = autoPathPoint(autoSeconds);
      autoSeconds += dt;
      addStroke(from, autoPathPoint(autoSeconds), dt);
    }
    /* 不跑入场涟漪：它会把染料扫过整个网格，变成铺满 hero 的色块 */
    step(dt);
    if (doRender !== false) render();
  }
  function tick(now) {
    raf = requestAnimationFrame(tick);
    var dt = lastFrame === null ? 1 / 60 : Math.min((now - lastFrame) / 1000, 1 / 30);
    lastFrame = now;
    frames++;
    if ((frames % 6) === 0) {
      var r = hero.getBoundingClientRect();
      var vh = window.innerHeight || doc.documentElement.clientHeight || 800;
      near = r.bottom > -200 && r.top < vh + 200;
    }
    if (!near || document.hidden) return;
    advance(dt, now, true);
  }

  /* 静帧 / 无头：同步步进一段自动路径形成完整光晕，只渲染一次。
     resize 会重建 dye 场，所以语言切换 / 字体加载后也要重新播种。 */
  function seedStatic() {
    /* 固定播种在右侧菱形中心（WebGL y 轴向上，0.58 对应屏幕约 42% 高度）。
       不用 autoSeconds 的随机起点，保证每次首屏光晕都在同一位置。 */
    var warmFrames = reduceMotion ? 26 : 34;
    for (var q = 0; q < warmFrames; q++) {
      var ang = q / warmFrames * Math.PI * 3.2;
      var rr = 8 + q * 0.45;
      stamp(gridWidth * 0.70 + Math.cos(ang) * rr, gridHeight * 0.58 + Math.sin(ang) * rr,
            Math.cos(ang) * 10, Math.sin(ang) * 10);
      step(1 / 60);
    }
    render();
  }

  function resize() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * pixelRatio));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * pixelRatio));
    if (!allocate(canvas.clientWidth, canvas.clientHeight)) {
      window.__icFluid = false;
      return;
    }
    if (reduceMotion || headless) seedStatic(); else render();
  }

  setPalette();
  resize();
  if (!reduceMotion && !headless) raf = requestAnimationFrame(tick);

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () { resize(); });
    ro.observe(canvas);
  }
  doc.addEventListener('visibilitychange', function () { if (!document.hidden) wake(); });
  doc.addEventListener('pointerleave', function () { if (coordEl) coordEl.textContent = 'X 0000 / Y 0000'; });
  doc.addEventListener('ic:theme', function () { setPalette(); render(); });

  /* 无头渲染校验探针：rAF 在后台标签页会被节流，用 tick() 强制步进 */
  if (debugMode) {
    window.__hero = {
      tick: function (n) {
        for (var i = 0; i < (n || 1); i++) advance(1 / 60, performance.now(), false);
        render();
      },
      move: function (u, v) {
        var r = canvas.getBoundingClientRect();
        movePointer(r.left + r.width * u, r.top + r.height * v);
      },
      palette: function () { return { mode: 'webgl2', opacity: opacity, colors: (root.getAttribute('data-theme') === 'dark' ? PALETTES.dark : PALETTES.light).colors }; },
      state: function () {
        return { W: canvas.clientWidth, H: canvas.clientHeight, grid: [gridWidth, gridHeight],
                 frames: frames, pointer: Boolean(pointer), auto: coarse || (performance.now() - lastActivity >= IDLE_AFTER_MS),
                 stamps: pendingStamps.length, visible: canvas.width > 0, reduce: reduceMotion };
      },
      pixels: function () {
        render();
        var w = canvas.width, h = canvas.height;
        var buf = new Uint8Array(w * h * 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
        var n = 0, sum = 0;
        for (var i = 3; i < buf.length; i += 4) { if (buf[i] > 6) { n++; sum += buf[i]; } }
        return { inkPixels: n, avgA: n ? Math.round(sum / n) : 0 };
      }
    };
  }
})();
