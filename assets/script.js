/* 无限画布官网交互
   纯原生 JS，无外部依赖，可直接跑在 GitHub Pages 上。 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };

  /* ---------- 中文衬线降级 ----------
     Windows 没有现代中文衬线（大字号会落到点阵感很强的 SimSun），
     标题改用系统无衬线；macOS / iOS 保留宋体，编辑感不变。 */
  if (/Windows NT/i.test(navigator.userAgent || '')) {
    document.documentElement.classList.add('no-cjk-serif');
  }

  /* ---------- 导航 / 进度条 ---------- */
  var header = $('#siteHeader');
  var progress = $('#scrollProgress');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || document.documentElement.scrollTop;
      if (header) header.classList.toggle('scrolled', y > 24);
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var navToggle = $('#navToggle');
  var nav = $('.site-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('.site-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- 界面预览切换 ---------- */
  var captions = [
    '四个内置模板可改标题、画幅、节点与提示词，支持关键词批量替换与另存。',
    '参考图支持 1–9 张自定义，每张带 IMAGE 编号，写 Prompt 时直接指代。',
    '节点自由摆放、连线组合，文生图 / 图生图 / 局部重绘 / 扩展出图 / 九宫格多视角。',
    '素材分组管理、批量整理、智能分类，也可推送到在线平台。'
  ];
  var tabs = $$('.screen-tab');
  var shots = $$('.screen-shot');
  var caption = $('#screenCaption');
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      shots.forEach(function (s) { s.classList.remove('active'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      var target = document.getElementById(tab.dataset.target);
      if (target) target.classList.add('active');
      if (caption) caption.textContent = captions[i] || '';
    });
  });

  /* ---------- 产品窗口按比例缩放（固定设计稿 1040×466） ---------- */
  var heroWindow = $('.hero-window');
  var stage = $('.window-stage');
  function fitWindow() {
    if (!heroWindow || !stage) return;
    var w = heroWindow.clientWidth;
    var scale = Math.min(1, w / 1040);
    stage.style.transform = 'scale(' + scale + ')';
    heroWindow.style.height = Math.round(466 * scale) + 'px';
  }
  fitWindow();
  window.addEventListener('resize', fitWindow, { passive: true });

  /* ---------- 版本号：能拿到最新 Release 就更新，拿不到保持静态兜底 ---------- */
  (function latestVersion() {
    if (!window.fetch || !window.AbortController) return;
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 4000);
    fetch('https://api.github.com/repos/Iorlchoate/Infinite-Canvas-UDG/releases/latest', {
      signal: ctrl.signal, headers: { 'Accept': 'application/vnd.github+json' }
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        clearTimeout(timer);
        if (!d || !d.tag_name) return;
        $$('#versionBadge, #versionBadge2').forEach(function (el) { el.textContent = d.tag_name; });
      })
      .catch(function () { clearTimeout(timer); });
  })();

  /* ---------- 粒子带：动效与文案互相对应 ----------
     文案里的三个词 = 三个节点；悬停 / 点击 → 粒子从球壳重组成三簇并连线。
     「重新连接」= 打散后拉线回归；鼠标扰动 = 连接被拉扯但不断。
     全程无发光、无闪烁、无渐变动画，只做慢速形态插值。 */
  (function motionBand() {
    var canvas = $('#particleCanvas');
    var band = $('#motion');
    if (!canvas || !band || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var statusEl = $('#motionStatus');
    var kwEls = $$('.kw');
    var nodeEls = $$('.pnode');
    var replayBtn = $('#replayMotion');
    var trigger = $('#reconnectTrigger');

    var W = 0, H = 0, DPR = 1, cx = 0, cy = 0, R = 0;
    var particles = [], count = 0;
    var visible = true, raf = 0, last = 0;
    var rot = 0, morph = 0, targetMorph = 0;
    var hover = -1, pinned = -1, node = -1;
    var mouse = { x: -9999, y: -9999 }, pointerIn = false, displaced = 0;
    var replayActive = false, holdUntil = 0, statusTimer1 = 0, statusTimer2 = 0;
    var RAD = 120, RAD2 = RAD * RAD;
    var SPRING = 0.020, DAMP = 0.86, FORCE = 1.25;
    var CENTERS = [[-0.78, -0.40], [0.00, 0.42], [0.80, -0.38]];
    var NODE_NOTES = [
      '参考图 · 1–9 张，每张都有 IMAGE 编号',
      '提示词 · 关键词可批量替换，随时改写',
      '生成结果 · 直接摆回画布，继续连线'
    ];
    var DEFAULT_HINT = '移动鼠标，扰动这些粒子';

    function makeParticles(n) {
      var out = [];
      var ga = Math.PI * (3 - Math.sqrt(5)); // 黄金角，球面均匀分布
      var per = Math.ceil(n / 3);
      var localIndex = [0, 0, 0];
      for (var i = 0; i < n; i++) {
        var y = 1 - (i / (n - 1)) * 2;
        var r = Math.sqrt(Math.max(0, 1 - y * y));
        var th = ga * i;
        var jitter = 0.92 + Math.random() * 0.12;
        var cluster = i % 3;
        var k = localIndex[cluster]++;
        var ly = 1 - (k / (per - 1)) * 2;
        var lr = Math.sqrt(Math.max(0, 1 - ly * ly));
        var lth = ga * k + cluster * 1.7;
        var c = CENTERS[cluster];
        out.push({
          sx: Math.cos(th) * r * jitter, sy: y * jitter, sz: Math.sin(th) * r * jitter,
          tx: c[0] + Math.cos(lth) * lr * 0.40,
          ty: c[1] + ly * 0.40,
          tz: Math.sin(lth) * lr * 0.26,
          cluster: cluster,
          size: 0.9 + Math.random() * 1.25,
          tone: Math.random() < 0.055 ? 'red' : (Math.random() < 0.085 ? 'warm' : 'ink'),
          ox: 0, oy: 0, vx: 0, vy: 0,
          px: 0, py: 0, bx: 0, by: 0, alpha: 0, sz: 1
        });
      }
      return out;
    }

    function project(c) { return { x: cx + c[0] * R, y: cy + c[1] * R }; }

    function resize() {
      var rect = band.getBoundingClientRect();
      W = Math.max(1, rect.width); H = Math.max(1, rect.height);
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var wide = W > 900;
      cx = wide ? W * 0.70 : W * 0.5;
      cy = wide ? H * 0.52 : H * 0.71;
      R = Math.min(wide ? 232 : 152, H * (wide ? 0.40 : 0.26));
      RAD = wide ? 120 : 90; RAD2 = RAD * RAD;
      var next = wide ? (reduceMotion ? 2200 : 3400) : (reduceMotion ? 1200 : 1800);
      if (next !== count || !particles.length) { count = next; particles = makeParticles(count); }
      nodeEls.forEach(function (el, i) {
        var p = project(CENTERS[i]);
        el.style.left = p.x + 'px';
        el.style.top = (p.y + R * 0.40) + 'px';
      });
    }

    function setStatus(s) { if (statusEl && statusEl.textContent !== s) statusEl.textContent = s; }

    /* 形态过渡由交互触发的定时补间驱动，不依赖 rAF 是否在运行 */
    var tweenTimer = 0;
    function tweenMorph(to) {
      targetMorph = to;
      clearInterval(tweenTimer);
      tweenTimer = 0;
      if (reduceMotion) { morph = to; render(0); return; }
      var from = morph, start = performance.now(), dur = 520;
      tweenTimer = setInterval(function () {
        var k = Math.min(1, (performance.now() - start) / dur);
        var e = 1 - Math.pow(1 - k, 3);
        morph = from + (to - from) * e;
        render(performance.now());
        if (k >= 1) { morph = to; clearInterval(tweenTimer); tweenTimer = 0; }
      }, 40);
    }

    function setNode(i) {
      node = i;
      tweenMorph(i >= 0 ? 1 : 0);
      kwEls.forEach(function (el, k) {
        el.classList.toggle('active', k === i);
        el.setAttribute('aria-pressed', k === i ? 'true' : 'false');
      });
      nodeEls.forEach(function (el, k) {
        el.classList.toggle('on', i >= 0);
        el.classList.toggle('focus', k === i);
      });
      // 状态由交互直接驱动，不依赖动画循环（低性能 / 离屏时也能正确反馈）
      if (!replayActive) setStatus(i >= 0 ? NODE_NOTES[i] : DEFAULT_HINT);
    }
    function applyNode() { setNode(pinned >= 0 ? pinned : hover); }

    function replay() {
      clearTimeout(statusTimer1); clearTimeout(statusTimer2);
      replayActive = true;
      pinned = -1; hover = -1; applyNode();
      setStatus('正在重新连接…');
      var now = performance.now();
      holdUntil = now + 3500;
      if (reduceMotion) {
        replayActive = false;
        setStatus('已重新连接 · 可以再来一次');
        draw(0);
        return;
      }
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i], a = Math.random() * Math.PI * 2, m = 1.6 + Math.random() * 3.4;
        p.vx += Math.cos(a) * m; p.vy += Math.sin(a) * m;
      }
      statusTimer1 = setTimeout(function () {
        replayActive = false;
        setStatus('已重新连接 · 可以再来一次');
      }, 1100);
      statusTimer2 = setTimeout(function () {
        setStatus(node >= 0 ? NODE_NOTES[node] : DEFAULT_HINT);
      }, 3500);
    }

    function render(now) {
      var dt = last ? Math.min(50, now - last) : 16;
      last = now;
      if (!reduceMotion) rot += 0.000085 * dt * (1 - morph); // 拓扑态不自转
      ctx.clearRect(0, 0, W, H);

      // 极淡暖纸底，不做发光
      var halo = ctx.createRadialGradient(cx, cy, R * 0.15, cx, cy, R * 1.6);
      halo.addColorStop(0, 'rgba(251,225,209,0.22)');
      halo.addColorStop(1, 'rgba(251,225,209,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(cx - R * 1.7, cy - R * 1.7, R * 3.4, R * 3.4);

      var ca = Math.cos(rot), sa = Math.sin(rot);
      displaced = 0;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var X = p.sx + (p.tx - p.sx) * morph;
        var Y = p.sy + (p.ty - p.sy) * morph;
        var Z = p.sz + (p.tz - p.sz) * morph;
        var x1 = X * ca + Z * sa;
        var z1 = -X * sa + Z * ca;
        var persp = 2.7 / (2.7 + z1 * 0.95);
        var sx = cx + x1 * R * persp;
        var sy = cy + Y * R * persp;

        var px = sx + p.ox, py = sy + p.oy;
        var dx = px - mouse.x, dy = py - mouse.y;
        var d2 = dx * dx + dy * dy;
        if (!reduceMotion && d2 < RAD2 && d2 > 0.5) {
          var d = Math.sqrt(d2);
          var f = (1 - d / RAD) * (1 - d / RAD) * FORCE;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
        }
        p.vx -= p.ox * SPRING; p.vy -= p.oy * SPRING;
        p.vx *= DAMP; p.vy *= DAMP;
        p.ox += p.vx; p.oy += p.vy;

        var depth = (persp - 0.73) / 0.85; if (depth < 0) depth = 0;
        p.bx = sx; p.by = sy; p.px = sx + p.ox; p.py = sy + p.oy;
        p.alpha = 0.16 + depth * 0.62;
        p.sz = p.size * persp * (0.8 + depth * 0.4);
        if (Math.abs(p.ox) + Math.abs(p.oy) > 16) displaced++;
      }

      // 节点连线：呼应「连线与重组」
      if (morph > 0.02) {
        ctx.strokeStyle = 'rgba(17,24,39,' + (0.22 * morph).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var k = 0; k < 2; k++) {
          var A = project(CENTERS[k]), B = project(CENTERS[k + 1]);
          ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
        }
        ctx.stroke();
      }
      // 被推开的粒子拉一道细线连回原位：呼应「重新连接」
      if (!reduceMotion) {
        ctx.strokeStyle = 'rgba(17,24,39,0.10)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var j = 0; j < particles.length; j += 13) {
          var q = particles[j];
          if (Math.abs(q.ox) + Math.abs(q.oy) > 18) {
            ctx.moveTo(q.bx, q.by); ctx.lineTo(q.px, q.py);
          }
        }
        ctx.stroke();
      }

      // 墨点（少量红 / 暖棕点，不发光）
      for (var m = 0; m < particles.length; m++) {
        var p2 = particles[m];
        var a2 = p2.alpha;
        if (node >= 0 && p2.cluster !== node) a2 *= 0.62;
        ctx.fillStyle = p2.tone === 'red'
          ? 'rgba(239,68,68,' + Math.min(0.85, a2 * 1.15).toFixed(3) + ')'
          : (p2.tone === 'warm'
            ? 'rgba(93,42,26,' + a2.toFixed(3) + ')'
            : 'rgba(17,24,39,' + a2.toFixed(3) + ')');
        ctx.fillRect(p2.px - p2.sz / 2, p2.py - p2.sz / 2, p2.sz, p2.sz);
      }

      // 扰动态的次要反馈；节点态 / 重连态由事件直接驱动
      if (!reduceMotion && !replayActive && performance.now() > holdUntil) {
        setStatus(node >= 0 ? NODE_NOTES[node]
          : (pointerIn && displaced > 12 ? '连接被拉扯，但不会断' : DEFAULT_HINT));
      }
    }

    function draw(now) {
      if (visible) render(now);
      if (!reduceMotion) raf = requestAnimationFrame(draw); // 离屏不停循环，避免 IO 误判后无法恢复
    }

    // 文案 ↔ 动效
    kwEls.forEach(function (el, i) {
      el.addEventListener('mouseenter', function () { hover = i; applyNode(); });
      el.addEventListener('mouseleave', function () { hover = -1; applyNode(); });
      el.addEventListener('focus', function () { hover = i; applyNode(); });
      el.addEventListener('blur', function () { hover = -1; applyNode(); });
      el.addEventListener('click', function () { pinned = pinned === i ? -1 : i; applyNode(); });
    });
    if (replayBtn) replayBtn.addEventListener('click', replay);
    if (trigger) {
      trigger.addEventListener('click', replay);
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); replay(); }
      });
    }

    function toLocal(e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
      pointerIn = true;
    }
    function leave() {
      mouse.x = -9999; mouse.y = -9999; pointerIn = false;
      hover = -1; applyNode();
    }

    resize();
    window.addEventListener('resize', function () { resize(); if (reduceMotion) draw(0); }, { passive: true });
    if (!reduceMotion) {
      window.addEventListener('pointermove', toLocal, { passive: true });
      window.addEventListener('pointerdown', toLocal, { passive: true });
      band.addEventListener('pointerleave', leave, { passive: true });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { visible = e.isIntersecting; });
        }, { threshold: 0 }).observe(band);
      }
      raf = requestAnimationFrame(draw);
    } else {
      draw(0); // 静态一帧，尊重 reduced-motion
    }
  })();
})();
