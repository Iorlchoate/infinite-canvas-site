/* 无限画布官网交互
   纯原生 JS，无外部依赖，可直接跑在 GitHub Pages 上。 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };

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

  /* ---------- 鼠标交互粒子球（收敛版） ----------
     球面均匀分布 → 慢速自转 → 透视投影 → 轻斥力 → 弹簧回归。
     纸面上的墨点球：无发光叠加、无闪烁、无呼吸，仅一点暖色呼应强调色。 */
  (function particleSphere() {
    var canvas = $('#particleCanvas');
    var band = $('#motion');
    if (!canvas || !band || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, DPR = 1, cx = 0, cy = 0, R = 0;
    var particles = [];
    var count = 0;
    var visible = true;
    var raf = 0;
    var t = 0;
    var mouse = { x: -9999, y: -9999 };
    var RAD = 120, RAD2 = RAD * RAD;
    var SPRING = 0.020, DAMP = 0.86, FORCE = 1.25;

    function makeParticles(n) {
      var out = [];
      var ga = Math.PI * (3 - Math.sqrt(5)); // 黄金角，球面均匀分布
      for (var i = 0; i < n; i++) {
        var y = 1 - (i / (n - 1)) * 2;
        var r = Math.sqrt(Math.max(0, 1 - y * y));
        var th = ga * i;
        var jitter = 0.92 + Math.random() * 0.12;
        out.push({
          bx: Math.cos(th) * r * jitter,
          by: y * jitter,
          bz: Math.sin(th) * r * jitter,
          size: 0.9 + Math.random() * 1.25,
          warm: Math.random() < 0.09,
          ox: 0, oy: 0, vx: 0, vy: 0
        });
      }
      return out;
    }

    function resize() {
      var rect = band.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var wide = W > 900;
      cx = wide ? W * 0.70 : W * 0.5;
      cy = wide ? H * 0.52 : H * 0.71;
      R = Math.min(wide ? 232 : 152, H * (wide ? 0.40 : 0.26));
      RAD = wide ? 120 : 90;
      RAD2 = RAD * RAD;
      var next = wide ? (reduceMotion ? 2200 : 3400) : (reduceMotion ? 1200 : 1800);
      if (next !== count || !particles.length) {
        count = next;
        particles = makeParticles(count);
      }
    }

    function draw(now) {
      if (!visible) return;
      t = reduceMotion ? 0 : now;
      ctx.clearRect(0, 0, W, H);

      // 极淡的暖纸光，不做发光特效
      var halo = ctx.createRadialGradient(cx, cy, R * 0.15, cx, cy, R * 1.6);
      halo.addColorStop(0, 'rgba(251,225,209,0.30)');
      halo.addColorStop(1, 'rgba(251,225,209,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(cx - R * 1.7, cy - R * 1.7, R * 3.4, R * 3.4);

      var a = t * 0.000085;
      var ca = Math.cos(a), sa = Math.sin(a);
      var b = reduceMotion ? 0 : Math.sin(t * 0.00018) * 0.10;
      var cb = Math.cos(b), sb = Math.sin(b);
      var rr = R;

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        // 绕 Y 轴慢速自转，再绕 X 轴极轻摆动
        var x1 = p.bx * ca + p.bz * sa;
        var z1 = -p.bx * sa + p.bz * ca;
        var y2 = p.by * cb - z1 * sb;
        var z2 = p.by * sb + z1 * cb;
        var persp = 2.7 / (2.7 + z2 * 0.95);
        var sx = cx + x1 * rr * persp;
        var sy = cy + y2 * rr * persp;

        // 轻微鼠标斥力 + 弹簧回归
        var px = sx + p.ox, py = sy + p.oy;
        var dx = px - mouse.x, dy = py - mouse.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < RAD2 && d2 > 0.5) {
          var d = Math.sqrt(d2);
          var f = (1 - d / RAD) * (1 - d / RAD) * FORCE;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
        p.vx -= p.ox * SPRING;
        p.vy -= p.oy * SPRING;
        p.vx *= DAMP;
        p.vy *= DAMP;
        p.ox += p.vx;
        p.oy += p.vy;

        var depth = (persp - 0.73) / 0.85; // 0(远) → 1(近)
        if (depth < 0) depth = 0;
        var alpha = 0.12 + depth * 0.52;
        var size = p.size * persp * (0.8 + depth * 0.4);
        ctx.fillStyle = p.warm
          ? 'rgba(93,42,26,' + alpha.toFixed(3) + ')'
          : 'rgba(17,24,39,' + alpha.toFixed(3) + ')';
        ctx.fillRect(sx + p.ox - size / 2, sy + p.oy - size / 2, size, size);
      }

      if (!reduceMotion) raf = requestAnimationFrame(draw);
    }

    function toLocal(e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function leave() { mouse.x = -9999; mouse.y = -9999; }

    resize();
    window.addEventListener('resize', function () { resize(); if (reduceMotion) draw(0); }, { passive: true });
    if (!reduceMotion) {
      window.addEventListener('pointermove', toLocal, { passive: true });
      window.addEventListener('pointerdown', toLocal, { passive: true });
      band.addEventListener('pointerleave', leave, { passive: true });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            var on = e.isIntersecting;
            if (on === visible) return;
            visible = on;
            if (on) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
            else { cancelAnimationFrame(raf); raf = 0; }
          });
        }, { threshold: 0 }).observe(band);
      }
      raf = requestAnimationFrame(draw);
    } else {
      draw(0); // 静态一帧，尊重 reduced-motion
    }
  })();
})();
