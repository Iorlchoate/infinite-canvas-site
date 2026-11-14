/* 无限画布官网交互
   纯原生 JS，无外部依赖，可直接跑在 GitHub Pages 上。
   模块：i18n → 主题 → 导航/进度 → 界面预览 → 版本号 → 首页柔光光晕（Canvas2D） */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var LANG_KEY = 'ic-lang';
  var THEME_KEY = 'ic-theme';

  /* =====================================================================
     1. 中英双语
     中文原文写在 HTML 里（首次切换时快照到 data-zh），英文放这里。
     ===================================================================== */
  var META = {
    zh: {
      title: '无限画布 · 把想法、生成与沉淀，都放进一张画布',
      desc: '无限画布是一台跑在本机上的 AI 创作工作台：自定义工作流、在线生图、无限画布、素材库串成一条流。免安装、断网可启动、数据留在本机。',
      og: '本地运行的 AI 创作画布。四个模块，一条完整链路。'
    },
    en: {
      title: 'Infinite Canvas · ideas, generations and archive on one canvas',
      desc: 'Infinite Canvas is a local-first AI studio: custom workflows, online generation, an infinite canvas and an asset library in one flow. Portable package, works offline, your data never leaves the machine.',
      og: 'A local-first AI canvas. Four modules, one continuous flow.'
    }
  };

  var EN = {
    /* 品牌 / 导航 */
    'brand.name': 'Infinite Canvas',
    'brand.en': 'INFINITE CANVAS',
    'brand.aria': 'Infinite Canvas · home',
    'nav.aria': 'Main navigation',
    'nav.why': 'Why local',
    'nav.features': 'Features',
    'nav.screens': 'Interface',
    'nav.faq': 'FAQ',
    'nav.github': 'GitHub',
    'tool.theme': 'Toggle dark mode',
    'cta.download': 'Download',

    /* HERO */
    'hero.eyebrow': 'LOCAL-FIRST AI CANVAS',
    'hero.title1': 'Ideas, generations, archive',
    'hero.title2': 'all on one infinite canvas',
    'hero.sub': 'Infinite Canvas is an AI studio that runs on your own machine. A portable runtime is bundled, so it starts on a double-click. Custom workflows, online generation, the infinite canvas and the asset library form one continuous flow — from a single prompt to a filed collection, without ever leaving the canvas.',
    'hero.cta1': 'Download for Windows',
    'hero.cta2': 'See the interface',
    'hero.m1': 'No Python setup',
    'hero.m2': 'Starts offline',
    'hero.m3': 'Version',

    /* 产品窗口示意 */
    'win.title': 'Infinite Canvas',
    'win.sub': 'Project / Concept 01',
    'win.tab1': 'Workflows',
    'win.tab2': 'Generate',
    'win.tab3': 'Canvas',
    'win.tab4': 'Library',
    'win.render': 'Render',
    'mini.1': 'Workflows',
    'mini.2': 'Generate',
    'mini.3': 'Canvas',
    'mini.4': 'Library',
    'mini.api': 'API settings',
    'node1.tag': 'Input',
    'node1.title': 'Site plan concept',
    'node1.sub': 'Reference · 3 images',
    'node2.title': 'Style transfer & outpaint',
    'node2.sub': 'Move the light from IMAGE 0 onto IMAGE 2',
    'node3.tag': 'Render',
    'node3.title': '3×3 multi-view',
    'node3.sub': '4 results · filed',
    'node4.tag': 'Export',
    'node4.title': 'Aerial render',
    'node4.sub': 'Filed to library / Scheme A',
    'node5.tag': 'Archive',
    'node5.title': 'Asset groups',
    'node5.sub': 'Ready to publish online',

    /* WHY */
    'why.eyebrow': 'LOCAL BY DESIGN',
    'why.title1': 'Your data stays here',
    'why.title2': 'your flow never breaks',
    'why.lead': 'No account, no cloud workspace, no per-call billing. Your API key is written to a local config; assets, history and canvases live in your own folders.',
    'why.s1u': '',
    'why.s1l': 'Setup required',
    'why.s1p': 'Unzip, double-click start.bat. No Python, no environment to configure.',
    'why.s2u': '',
    'why.s2l': 'Modules, one flow',
    'why.s2p': 'Templates, generation, wiring and archiving share the same sidebar.',
    'why.s3u': '',
    'why.s3l': 'Reference images',
    'why.s3p': 'Each one carries an IMAGE index you can name in the prompt.',
    'why.s4u': '%',
    'why.s4l': 'Stays on your machine',
    'why.s4p': 'Assets, history and keys never leave this computer.',
    'cmp.head1': 'The same task',
    'cmp.head2': 'Typical online tool',
    'cmp.head3': 'Infinite Canvas',
    'cmp.r1a': 'Before you start',
    'cmp.r1b': 'Sign up · log in · subscribe',
    'cmp.r1c': 'Unzip → double-click',
    'cmp.r2a': 'Where assets live',
    'cmp.r2b': 'The vendor’s cloud',
    'cmp.r2c': 'Your own folder',
    'cmp.r3a': 'Updates',
    'cmp.r3b': 'Forced, no rollback',
    'cmp.r3c': 'One click, auto-backup, rollback',
    'cmp.r4a': 'Offline',
    'cmp.r4b': 'Stops working',
    'cmp.r4c': 'Still starts and organises',

    /* FEATURES */
    'feat.eyebrow': 'ONE CONTINUOUS FLOW',
    'feat.title': 'Four modules, one unbroken flow',
    'feat.lead': 'From templates to references, from node wiring to archiving — every step stays in the same interface. One click in the sidebar switches context without losing it.',
    'f1.t': 'Custom workflows',
    'f1.p': 'All four built-in templates are editable: title, description, aspect ratio, node names and prompts. Batch keyword replacement, create, save-as and reset to default.',
    'f1.c1': 'Editable templates',
    'f1.c2': 'Keyword replace',
    'f2.t': 'Online generation',
    'f2.p': 'Calls your own cloud API. Up to nine reference images, each with a fixed IMAGE index — click an index to drop it into the prompt and refer to the exact picture.',
    'f2.c2': 'Multi-reference',
    'f3.t': 'Infinite canvas',
    'f3.p': 'Place nodes and wire them freely. Text-to-image, image-to-image, inpainting, outpainting and 3×3 multi-view all happen on the same canvas.',
    'f3.c1': 'Node wiring',
    'f3.c2': 'Five modes',
    'f4.t': 'Asset library',
    'f4.p': 'Group, batch-organise and auto-classify locally, then push to an online platform. Ships with a Chrome batch collector and a Photoshop panel.',
    'f4.c1': 'Local archive',
    'f4.c2': 'Plugin bridge',
    'proto.label': 'CONNECTED',
    'proto.1': 'OpenAI protocol',
    'proto.2': 'Async protocol',
    'proto.3': 'Gemini protocol',
    'proto.4': 'Fanghook protocol',
    'proto.5': 'ModelScope free models',
    'proto.6': 'Volcengine',
    'proto.7': 'Jimeng',

    /* SCREENS */
    'scr.eyebrow': 'EVERY MODULE, ONE CANVAS',
    'scr.title': 'What it looks like',
    'scr.lead': 'Four modules share one sidebar. Light and dark themes are both supported, and it opens in a tablet or phone browser too.',
    'scr.aria': 'Interface preview',
    'scr.tab1': 'Workflows',
    'scr.tab2': 'Generate',
    'scr.tab3': 'Canvas',
    'scr.tab4': 'Library',
    'cu.c1': 'Zoomed out: a hundred references side by side, wired into one scheme.',
    'cu.c2': 'Zoomed out: night renders, plans, aerials and details growing on one board.',

    /* OPEN */
    'open.eyebrow': 'OPEN & ACCOUNTABLE',
    'open.title': 'Open source, auditable, reversible',
    'open.lead': 'The code is on GitHub, so you can read what it does. Every update backs up first — you can always step back one version.',
    'o1.t': 'Open source, credit kept',
    'o1.p': 'Built on wuli大雄’s open-source Infinite-Canvas. The upstream terms still apply: stay open source, credit the author, and never repackage it as a closed commercial product.',
    'o2.t': 'Keys never leave the machine',
    'o2.p': 'API keys are written to the backend env and never echoed in the UI. Traffic goes only to the endpoint you configured, and only when you call a model.',
    'o3.t': 'Updates back up first',
    'o3.p': 'One click backs up, replaces and restarts, and rollback stays available. Delete the VERSION file in the root to stop update prompts.',
    'credit.label': 'UPSTREAM',
    'credit.main': 'Infinite-Canvas · by wuli大雄',
    'credit.note': 'Upstream has been inactive since 2026/08/28 and is not affiliated with this project.',

    /* DOWNLOAD */
    'dl.eyebrow': 'READY WHEN YOU ARE',
    'dl.title': 'Start creating in a minute',
    'dl.lead': 'New here? Grab the portable package — no clone, no Python install.',
    'dl.badge': 'RECOMMENDED · WINDOWS',
    'dl.h3': 'Portable package',
    'dl.p': 'Bundles a portable Python and every offline dependency, about 50 MB. Keep the <code>python/</code> and <code>packages/</code> folders where they are.',
    'dl.step1': 'Unzip anywhere',
    'dl.step2': 'Double-click start.bat',
    'dl.step3': 'Add your key in API settings',
    'dl.cta': 'Download',
    'dl.ghost': 'All releases',
    'dl.hint': 'If the port is taken it moves on automatically — the console prints the real address',
    'c1.t': 'Run from source',
    'c1.p': 'Clone the repo, then <code>start.bat</code> on Windows or <code>python3 main.py</code> on macOS / Linux.',
    'c1.a': 'View the repo',
    'c2.t': 'macOS / Linux',
    'c2.p': 'Install the dependencies and run <code>python3 main.py</code>, or use <code>mac-启动服务.sh</code>. Fix permissions first if needed.',
    'c2.a': 'Usage notes',
    'c3.t': 'Phone / tablet',
    'c3.p': 'On the same Wi-Fi, open the LAN address printed in the console. Drag with one finger, pinch to zoom, add it to your home screen.',
    'c3.a': 'Access notes',
    'dl.fine': 'Phone and tablet access needs this computer to stay on. Data and API keys live on it, so think twice before exposing it over a network.',

    /* FAQ */
    'faq.eyebrow': 'QUESTIONS PEOPLE ASK',
    'faq.title': 'Frequently asked',
    'faq.q1': 'Is it free? Can I use it commercially?',
    'faq.a1': 'The project is free, stays open source and credits its origin. Upstream Infinite-Canvas is copyrighted, and its terms still apply to the upstream code: keep it open source, credit the author, and do not repackage it as a commercial product without permission.',
    'faq.q2': 'Are my images and API key uploaded?',
    'faq.a2': 'Nothing is stored on any server. Assets, history and keys stay on your machine; traffic goes only to the endpoint you configured, and only when you call a model.',
    'faq.q3': 'Do I need Python or an internet connection?',
    'faq.a3': 'Neither. The portable package includes Python and all offline dependencies, so it starts offline. If port 3000 is taken it moves to 3001, 3002 and so on.',
    'faq.q4': 'Which models and platforms are supported?',
    'faq.a4': 'Almost any OpenAI-compatible API, async protocol, Gemini protocol and Fanghook protocol, plus ModelScope free LLMs and image models, Volcengine, Jimeng and more. Manage endpoints, model lists and keys in API settings.',
    'faq.q5': 'Does it work on iPad and Android?',
    'faq.a5': 'Yes — on the same Wi-Fi, open the computer’s LAN address in a browser. A web app manifest lets it run full screen, and touch supports one-finger drag and pinch zoom. It stops working once the computer is off; there is no fully offline native app yet.',
    'faq.q6': 'How do I update? Where do I report issues?',
    'faq.a6': 'Click One-click update: it backs up, replaces and restarts, and you can roll back. Test connectivity helps diagnose network problems. Report issues on GitHub Issues — check for duplicates first.',

    /* FINAL / FOOTER */
    'fin.eyebrow': 'START CREATING',
    'fin.title': 'Open the canvas now',
    'fin.sub': 'Download once. Everything after that happens on the canvas.',
    'fin.b1': 'Download for Windows',
    'fin.b2': 'View the source on GitHub',
    'ft.brand': 'Infinite Canvas',
    'ft.tag': 'Infinite Canvas · a local-first AI canvas',
    'ft.aria': 'Footer navigation',
    'ft.dl': 'Download',
    'ft.docs': 'Docs',
    'ft.log': 'Changelog',
    'ft.issue': 'Issues',
    'ft.up': 'Upstream',
    'ft.bottom': 'Built on <a href="https://github.com/hero8152/Infinite-Canvas" target="_blank" rel="noopener">Infinite-Canvas</a> by wuli大雄, kept open source with credit.',
    'ft.copy': '© 2026 Infinite Canvas'
  };

  var CAPTIONS = {
    zh: [
      '四个内置模板可改标题、画幅、节点与提示词，支持关键词批量替换与另存。',
      '参考图支持 1–9 张自定义，每张带 IMAGE 编号，写 Prompt 时直接指代。',
      '节点自由摆放、连线组合，文生图 / 图生图 / 局部重绘 / 扩展出图 / 九宫格多视角。',
      '素材分组管理、批量整理、智能分类，也可推送到在线平台。'
    ],
    en: [
      'Four built-in templates — edit title, aspect ratio, nodes and prompts. Batch keyword replace and save-as included.',
      'Up to nine reference images, each with a fixed IMAGE index you can name straight in the prompt.',
      'Place nodes freely and wire them: text-to-image, image-to-image, inpaint, outpaint and 3×3 multi-view.',
      'Group, batch-organise and auto-classify locally, then push to an online platform.'
    ]
  };

  var lang = 'zh';
  function applyLang(next, persist) {
    lang = next === 'en' ? 'en' : 'zh';
    root.setAttribute('lang', lang === 'en' ? 'en' : 'zh-CN');

    $$('[data-i18n]').forEach(function (el) {
      if (el.dataset.zh === undefined) el.dataset.zh = el.textContent;
      var key = el.getAttribute('data-i18n');
      var v = lang === 'en' ? EN[key] : undefined;
      el.textContent = v === undefined ? el.dataset.zh : v;
    });
    $$('[data-i18n-html]').forEach(function (el) {
      if (el.dataset.zhHtml === undefined) el.dataset.zhHtml = el.innerHTML;
      var key = el.getAttribute('data-i18n-html');
      var v = lang === 'en' ? EN[key] : undefined;
      el.innerHTML = v === undefined ? el.dataset.zhHtml : v;
    });
    $$('[data-i18n-aria]').forEach(function (el) {
      if (el.dataset.zhAria === undefined) el.dataset.zhAria = el.getAttribute('aria-label') || '';
      var key = el.getAttribute('data-i18n-aria');
      var v = lang === 'en' ? EN[key] : undefined;
      el.setAttribute('aria-label', v === undefined ? el.dataset.zhAria : v);
    });

    var meta = META[lang];
    document.title = meta.title;
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', meta.desc);
    var ogt = document.querySelector('meta[property="og:title"]');
    if (ogt) ogt.setAttribute('content', lang === 'en' ? 'Infinite Canvas' : '无限画布 · Infinite Canvas');
    var ogd = document.querySelector('meta[property="og:description"]');
    if (ogd) ogd.setAttribute('content', meta.og);

    var langBtn = $('#langToggle');
    if (langBtn) {
      langBtn.querySelector('span').textContent = lang === 'en' ? '中' : 'EN';
      langBtn.setAttribute('aria-label', lang === 'en' ? '切换到中文' : 'Switch to English');
    }
    if (persist) { try { localStorage.setItem(LANG_KEY, lang); } catch (e) {} }

    document.dispatchEvent(new CustomEvent('ic:lang', { detail: { lang: lang } }));
  }

  /* =====================================================================
     2. 明暗主题
     ===================================================================== */
  function applyTheme(next, persist) {
    var dark = next === 'dark';
    if (dark) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0e1014' : '#f9fafb');
    var btn = $('#themeToggle');
    if (btn) {
      // 标签要说明「点下去会变成什么」，所以随主题与语言一起算
      var label = lang === 'en'
        ? (dark ? 'Switch to light mode' : 'Switch to dark mode')
        : (dark ? '切换到浅色主题' : '切换到深色主题');
      btn.setAttribute('aria-label', label);
    }
    if (persist) { try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch (e) {} }
    document.dispatchEvent(new CustomEvent('ic:theme', { detail: { theme: dark ? 'dark' : 'light' } }));
  }

  (function initPrefs() {
    var storedLang = null;
    try { storedLang = localStorage.getItem(LANG_KEY); } catch (e) {}
    var qLang = new URLSearchParams(location.search).get('lang');
    if (qLang === 'en' || qLang === 'zh') storedLang = qLang;
    if (!storedLang) {
      var nav = (navigator.language || 'zh').toLowerCase();
      storedLang = nav.indexOf('zh') === 0 ? 'zh' : 'en';
    }
    applyLang(storedLang, false);

    var dark = root.getAttribute('data-theme') === 'dark';
    applyTheme(dark ? 'dark' : 'light', false);
    document.addEventListener('ic:lang', function () {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);
    });

    var themeBtn = $('#themeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var isDark = root.getAttribute('data-theme') !== 'dark';
        root.classList.add('theme-anim');
        applyTheme(isDark ? 'dark' : 'light', true);
        setTimeout(function () { root.classList.remove('theme-anim'); }, 340);
      });
    }
    var langBtn = $('#langToggle');
    if (langBtn) {
      langBtn.addEventListener('click', function () {
        applyLang(lang === 'en' ? 'zh' : 'en', true);
      });
    }
  })();

  /* ---------- 中文衬线降级 ----------
     Windows 没有现代中文衬线（大字号会落到点阵感很强的 SimSun），
     标题改用系统无衬线；macOS / iOS 保留宋体，编辑感不变。 */
  if (/Windows NT/i.test(navigator.userAgent || '')) {
    root.classList.add('no-cjk-serif');
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
  var tabs = $$('.screen-tab');
  var shots = $$('.screen-shot');
  var caption = $('#screenCaption');
  var activeTab = 0;
  function paintCaption() {
    if (caption) caption.textContent = (CAPTIONS[lang] || CAPTIONS.zh)[activeTab] || '';
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
      shots.forEach(function (s) { s.classList.remove('active'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      var target = document.getElementById(tab.dataset.target);
      if (target) target.classList.add('active');
      activeTab = i;
      paintCaption();
    });
  });
  paintCaption();
  document.addEventListener('ic:lang', paintCaption);

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

  /* =====================================================================
     首页鼠标动效：连续面光（Continuous Luminous Field）
     参考 wu.dstrml.org 的「一大团均匀弥散的柔光」。这里没有任何粒子、
     离散光点或拖尾珠：整帧只画一团面光，中心一大片近乎等亮、边缘极柔，
     随指针惯性移动并沿速度方向轻微拉伸，停下时自然收圆。无鼠标时右下
     有一团缓慢呼吸的待机光，指针进入后平滑接管、离开后平滑退回。
     光斑预渲染成 sprite，每帧零 createRadialGradient；0.5x 离屏合成再
     放大，边缘天然再柔一层。色彩沿用 LOGO 石墨灰 + 正红，不引入第三种彩色。
     ===================================================================== */
  (function heroGlow() {
    var hero = $('#hero');
    var canvas = $('#heroGlow');
    var coord = $('#heroCoord');
    if (!hero || !canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var off = document.createElement('canvas'), octx = off.getContext('2d');
    var SCALE = .5;
    var W = 0, H = 0, dpr = 1, t = 0, frame = 0, lastTs = 0, near = true, raf = 0;
    var ptr = { x: -999, y: -999, has: false };
    var glow = { x: -999, y: -999, has: false, energy: 0,
                 vx: 0, vy: 0, fade: 0, sp: 0, ang: 0 };
    var pal = palette(), spr = {};

    function palette() {
      var dark = root.getAttribute('data-theme') === 'dark';
      return dark ? {
        mode: 'lighter',
        hi:   [255, 238, 228],   /* 暖白亮核 */
        warm: [255, 86, 78],     /* LOGO 正红的深色版 */
        cool: [74, 86, 110],     /* 冷石墨，只做外圈收边 */
        bodyA: .36, innerA: .17, coolA: .020, hiA: .34, veil: .20
      } : {
        mode: 'source-over',
        hi:   [255, 255, 255],   /* 白心：洗淡网格形成干净的光斑 */
        warm: [239, 68, 68],     /* LOGO 正红 */
        cool: [60, 65, 73],      /* LOGO 石墨灰 */
        bodyA: .070, innerA: .028, coolA: .008, hiA: .48, veil: .22
      };
    }
    function rgba(c, a) {
      return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' +
        Math.max(0, Math.min(1, a)).toFixed(4) + ')';
    }
    function pad(v) { return ('0000' + Math.max(0, Math.round(v))).slice(-4); }
    /* 左侧标题 / 正文区稍微收光，保证文字始终压得住底纹 */
    function veil(x, y) {
      var u = Math.max(0, 1 - Math.abs(x - W * .26) / (W * .42));
      var v = Math.max(0, 1 - Math.abs(y - H * .40) / (H * .48));
      return 1 - pal.veil * u * v;
    }

    /* 光斑贴图：中心一大片近乎等亮、边缘才渐隐 —— 是「一团面光」不是「一个点」 */
    function makeSprite(col, stops) {
      var c = document.createElement('canvas');
      c.width = c.height = 256;
      var g = c.getContext('2d');
      var rg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      for (var i = 0; i < stops.length; i++) rg.addColorStop(stops[i][0], rgba(col, stops[i][1]));
      g.fillStyle = rg;
      g.fillRect(0, 0, 256, 256);
      return c;
    }
    function buildSprites() {
      var wide = [[0, 1], [.24, .88], [.50, .48], [.76, .12], [1, 0]];
      var core = [[0, 1], [.20, .86], [.46, .40], [.74, .07], [1, 0]];
      spr.warm = makeSprite(pal.warm, wide);
      spr.cool = makeSprite(pal.cool, wide);
      spr.hi   = makeSprite(pal.hi, core);
    }

    function resize() {
      var r = hero.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      off.width = Math.max(1, Math.round(W * SCALE));
      off.height = Math.max(1, Math.round(H * SCALE));
      octx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      if (reduceMotion) draw();
    }

    function onMove(e) {
      var r = hero.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < -160 || y < -160 || x > W + 160 || y > H + 160) {
        ptr.has = false;
        if (coord) coord.textContent = 'X 0000 / Y 0000';
        if (reduceMotion) draw();
        return;
      }
      var prev = ptr.has ? { x: ptr.x, y: ptr.y } : null;
      var jump = prev ? Math.hypot(x - prev.x, y - prev.y) : 0;
      ptr.x = x; ptr.y = y; ptr.has = true;
      if (!glow.has) { glow.x = x; glow.y = y; glow.has = true; }
      glow.energy = Math.min(1, glow.energy * .62 + jump / 150);
      glow.vx = prev ? x - prev.x : 0;
      glow.vy = prev ? y - prev.y : 0;
      if (coord) coord.textContent = 'X ' + pad(x) + ' / Y ' + pad(y);
      if (reduceMotion) draw();
    }

    function update(dt) {
      t += dt;
      glow.fade += ((ptr.has ? 1 : 0) - glow.fade) * (1 - Math.pow(.06, dt));
      if (ptr.has) {
        var lead = 12 + glow.energy * 20;
        var tx = ptr.x + glow.vx * lead / 24;
        var ty = ptr.y + glow.vy * lead / 24;
        var f = 1 - Math.pow(.0025, dt);
        glow.x += (tx - glow.x) * f;
        glow.y += (ty - glow.y) * f;
      }
      glow.energy *= Math.pow(.16, dt);
      /* 拉伸量平滑，停下时光团自然收圆；不会形成可见的长尾 */
      var speed = Math.min(1, Math.hypot(glow.vx, glow.vy) / 34);
      glow.sp += (speed * (ptr.has ? 1 : 0) - glow.sp) * (1 - Math.pow(.02, dt));
      if (Math.hypot(glow.vx, glow.vy) > 2) glow.ang = Math.atan2(glow.vy, glow.vx);
      glow.vx *= Math.pow(.02, dt);
      glow.vy *= Math.pow(.02, dt);
    }

    /* 一团连续面光：石墨收边 → 正红辉光 → 内层加浓 → 暖白亮核 */
    function core(x, y, R, k, energy, stretch) {
      if (k <= .005 || R <= 0) return;
      var v = veil(x, y) * k;
      if (v <= .005) return;
      var rr = R * (1 + energy * .08);
      function layer(s, rad, a, st) {
        octx.globalAlpha = a * v;
        var q = st * .26;
        if (q < .02) {
          octx.drawImage(s, x - rad, y - rad, rad * 2, rad * 2);
          return;
        }
        octx.save();
        octx.translate(x, y);
        octx.rotate(glow.ang);
        octx.scale(1 + q, 1 - q * .55);
        octx.drawImage(s, -rad, -rad, rad * 2, rad * 2);
        octx.restore();
      }
      layer(spr.cool, rr * 1.34, pal.coolA, 0);
      layer(spr.warm, rr,        pal.bodyA,  stretch);
      layer(spr.warm, rr * .58,  pal.innerA, stretch * .7);
      layer(spr.hi,   rr * (pal.mode === 'lighter' ? .30 : .40),
             pal.hiA, stretch * .25);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      octx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      octx.clearRect(0, 0, W, H);
      octx.globalCompositeOperation = pal.mode;

      /* 待机呼吸光：右下菱形中心，指针进入后平滑让位 */
      var ix = W * (W < 620 ? .72 : .70) + Math.sin(t * .23) * W * .045;
      var iy = H * .42 + Math.cos(t * .18) * H * .055;
      var iR = (W < 620 ? 200 : 320) * (1 + Math.sin(t * .31) * .06);
      var iA = .78 * (1 - glow.fade);
      if (iA > .01) core(ix, iy, iR, iA, 0, 0);

      /* 跟随指针的主光团 */
      if (glow.has && glow.fade > .01) {
        core(glow.x, glow.y, (W < 620 ? 200 : 320) + glow.energy * 48,
             glow.fade, glow.energy, glow.sp);
      }
      octx.globalAlpha = 1;
      octx.globalCompositeOperation = 'source-over';
      ctx.drawImage(off, 0, 0, off.width, off.height, 0, 0, W, H);
    }

    function loop(ts) {
      raf = requestAnimationFrame(loop);
      var dt = lastTs ? Math.min(.05, (ts - lastTs) / 1000) : 1 / 60;
      lastTs = ts;
      frame++;
      /* 用视口距离判断活性，IntersectionObserver 在 iframe 内会误判 */
      if ((frame % 6) === 0) {
        var r = hero.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight || 800;
        near = r.bottom > -200 && r.top < vh + 200;
      }
      if (!near || document.hidden) return;
      update(dt);
      draw();
    }

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', function (e) {
      onMove(e);
      if (ptr.has) glow.energy = 1;
      if (reduceMotion) draw();
    }, { passive: true });
    document.addEventListener('pointerleave', function () {
      ptr.has = false;
      if (coord) coord.textContent = 'X 0000 / Y 0000';
      if (reduceMotion) draw();
    });
    window.addEventListener('resize', resize, { passive: true });
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { resize(); });
      ro.observe(hero);
    }
    document.addEventListener('ic:theme', function () {
      pal = palette();
      buildSprites();
      draw();
    });

    buildSprites();
    resize();
    draw();
    if (!reduceMotion) raf = requestAnimationFrame(loop);

    /* 仅供无头渲染校验：rAF 在后台标签页会被节流，用 tick() 强制步进 */
    if (/[?&]debug=hero/.test(location.search)) {
      window.__hero = {
        tick: function (n) { for (var i = 0; i < (n || 1); i++) { update(1 / 60); draw(); } },
        move: function (u, v) {
          var r = hero.getBoundingClientRect();
          onMove({ clientX: r.left + r.width * u, clientY: r.top + r.height * v });
        },
        palette: function () { return pal; },
        state: function () {
          return { W: W, H: H, frames: frame, pointer: ptr.has,
                   fade: +glow.fade.toFixed(3), stretch: +glow.sp.toFixed(3),
                   visible: canvas.width > 0 };
        },
        pixels: function () {
          var d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          var n = 0, sum = 0;
          for (var i = 3; i < d.length; i += 4) { if (d[i] > 6) { n++; sum += d[i]; } }
          return { inkPixels: n, avgA: n ? Math.round(sum / n) : 0 };
        }
      };
    }
  })();

  /* ---------- 功能卡：进入视口时沿链路依次点亮一次 ---------- */
  (function featureFlow() {
    var grid = $('.feature-grid');
    if (!grid) return;
    var done = false;
    function fire() {
      if (done) return;
      done = true;
      grid.classList.add('flow');
      /* 动画结束后撤掉 class，否则 fill-mode 会一直压住 hover 状态 */
      setTimeout(function () { grid.classList.remove('flow'); }, 1500);
      window.removeEventListener('scroll', check);
    }
    function check() {
      var r = grid.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      if (r.top < vh * .92 && r.bottom > 0) fire();
    }
    if (window.IntersectionObserver && !reduceMotion) {
      var io = new IntersectionObserver(function (es) {
        if (es[0] && es[0].isIntersecting) { fire(); io.disconnect(); }
      }, { threshold: .15 });
      io.observe(grid);
    }
    window.addEventListener('scroll', check, { passive: true });
    check();
  })();
})();
