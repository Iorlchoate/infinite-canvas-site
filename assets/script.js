/* 无限画布官网交互
   纯原生 JS，无外部依赖，可直接跑在 GitHub Pages 上。
   模块：i18n → 主题 → 导航/进度 → 界面预览 → 版本号 → 墨迹带（WebGL2 流体，含 2D 兜底） */
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
    'hero.title1': 'Ideas, generations, archive —',
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

    /* 墨迹带 */
    'motion.aria': 'Interactive ink display',
    'motion.eyebrow': 'IDEAS, IN MOTION',
    'motion.title1': 'Everything can ',
    'motion.titleHL': 'reconnect',
    'motion.trigger': 'Let the ink gather again',
    'motion.kw1': 'Images',
    'motion.kw2': 'prompts',
    'motion.kw3': 'results',
    'motion.lead1': ', ',
    'motion.lead2': ' and ',
    'motion.lead3': ' — arrange, connect and recombine them on one canvas. No fixed order, and never just once.',
    'motion.replayText': 'Stir again',
    'motion.tip': 'Move your cursor in — the ink follows you',

    /* WHY */
    'why.eyebrow': 'LOCAL BY DESIGN',
    'why.title1': 'Your data stays here,',
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

  /* 动态状态文案（不写在 HTML 里，需要中英两份） */
  var STATUS = {
    zh: {
      'motion.hint': '移动鼠标，搅动这池墨',
      'motion.stirring': '墨迹跟着你走',
      'motion.n0': '参考图 · 1–9 张，墨迹先落在这里',
      'motion.n1': '提示词 · 关键词可批量替换，随时改写',
      'motion.n2': '生成结果 · 直接摆回画布，继续连线',
      'motion.replaying': '正在重新连接…',
      'motion.done': '已重新连接 · 再搅一次'
    },
    en: {
      'motion.hint': 'Move your cursor — stir the ink',
      'motion.stirring': 'The ink follows you',
      'motion.n0': 'Images · 1–9 references, the ink lands here first',
      'motion.n1': 'Prompts · batch-replace keywords any time',
      'motion.n2': 'Results · place them back on the canvas and wire them up',
      'motion.replaying': 'Reconnecting…',
      'motion.done': 'Reconnected · stir it again'
    }
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
  function t(key) {
    var table = STATUS[lang] || STATUS.zh;
    return table[key] || STATUS.zh[key] || key;
  }

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
     3. 墨迹带：WebGL2 流体（鼠标划过拖出墨烟）
     速度场 + 墨色场，semi-Lagrangian 平流 + 压力投影 + 涡量约束；
     无 WebGL2 时退回 Canvas2D 拖尾，两者都是「跟随鼠标」的手感。
     ===================================================================== */
  (function inkBand() {
    var canvas = $('#inkCanvas');
    var band = $('#motion');
    if (!canvas || !band || !canvas.getContext) return;

    var statusEl = $('#motionStatus');
    var kwEls = $$('.kw');
    var replayBtn = $('#replayMotion');
    var trigger = $('#reconnectTrigger');
    var statusKey = 'motion.hint';
    var statusHold = 0;      // 状态被交互临时占用到什么时候
    var replayTimers = [];

    function setStatus(key) {
      statusKey = key;
      if (statusEl) {
        var s = t(key);
        if (statusEl.textContent !== s) statusEl.textContent = s;
      }
    }
    setStatus('motion.hint');
    document.addEventListener('ic:lang', function () { setStatus(statusKey); });

    function colors() {
      var cs = getComputedStyle(root);
      function parse(v) {
        v = (v || '').trim();
        if (v.charAt(0) === '#') {
          var h = v.slice(1);
          if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
          return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
        }
        var m = v.match(/(\d+(?:\.\d+)?)/g);
        if (m && m.length >= 3) return [+m[0] / 255, +m[1] / 255, +m[2] / 255];
        return [0.07, 0.09, 0.15];
      }
      return {
        ink: parse(cs.getPropertyValue('--ink')),
        accent: parse(cs.getPropertyValue('--coral')),
        // 深色主题下同样是这么多墨，落在暗底上却显得厚一倍
        dark: root.getAttribute('data-theme') === 'dark'
      };
    }
    var pal = colors();

    /* 关键字对应的三个墨点锚位（uv，y 轴向上） */
    function anchors() {
      var wide = band.clientWidth > 900;
      return wide
        ? [[0.62, 0.68], [0.76, 0.50], [0.60, 0.30]]
        : [[0.30, 0.34], [0.62, 0.30], [0.46, 0.16]];
    }

    /* ---------------- WebGL2 流体 ---------------- */
    function createGL() {
      var gl = canvas.getContext('webgl2', {
        alpha: true, antialias: false, depth: false, stencil: false,
        // 用直通 alpha：预乘后在淡部只有几级色阶，会出现环状台阶
        premultipliedAlpha: false, preserveDrawingBuffer: true, powerPreference: 'low-power'
      });
      if (!gl) return null;
      if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) return null;

      var VS = [
        '#version 300 es',
        'layout(location=0) in vec2 aPos;',
        'out vec2 vUv;',
        'void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }'
      ].join('\n');

      var FS_SPLAT = ['#version 300 es', 'precision highp float;', 'in vec2 vUv; out vec4 o;',
        'uniform sampler2D uTarget; uniform vec2 uPoint; uniform vec3 uColor;',
        'uniform float uRadius; uniform float uStrength; uniform float uAspect;',
        'void main(){',
        '  vec2 p = vUv - uPoint; p.x *= uAspect;',
        '  float f = exp(-dot(p, p) / uRadius);',
        '  o = texture(uTarget, vUv) + vec4(uColor * f * uStrength, 0.0);',
        '}'].join('\n');

      var FS_ADVECT = ['#version 300 es', 'precision highp float;', 'in vec2 vUv; out vec4 o;',
        'uniform sampler2D uVel; uniform sampler2D uSrc; uniform float uDt; uniform float uDiss;',
        'void main(){',
        '  vec2 v = texture(uVel, vUv).xy;',
        '  vec2 c = clamp(vUv - uDt * v, vec2(0.0015), vec2(0.9985));',
        '  o = texture(uSrc, c) / (1.0 + uDiss * uDt);',
        '}'].join('\n');

      var FS_CURL = ['#version 300 es', 'precision highp float;', 'in vec2 vUv; out vec4 o;',
        'uniform sampler2D uVel; uniform vec2 uTexel;',
        'void main(){',
        '  float L = texture(uVel, vUv - vec2(uTexel.x, 0.0)).y;',
        '  float R = texture(uVel, vUv + vec2(uTexel.x, 0.0)).y;',
        '  float B = texture(uVel, vUv - vec2(0.0, uTexel.y)).x;',
        '  float T = texture(uVel, vUv + vec2(0.0, uTexel.y)).x;',
        '  o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);',
        '}'].join('\n');

      var FS_VORT = ['#version 300 es', 'precision highp float;', 'in vec2 vUv; out vec4 o;',
        'uniform sampler2D uVel; uniform sampler2D uCurl; uniform vec2 uTexel;',
        'uniform float uCurlStrength; uniform float uDt;',
        'void main(){',
        '  float L = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x;',
        '  float R = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x;',
        '  float B = texture(uCurl, vUv - vec2(0.0, uTexel.y)).x;',
        '  float T = texture(uCurl, vUv + vec2(0.0, uTexel.y)).x;',
        '  float C = texture(uCurl, vUv).x;',
        '  vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));',
        '  f /= length(f) + 1e-4;',
        '  f *= uCurlStrength * C;',
        '  f.y *= -1.0;',
        '  vec2 v = texture(uVel, vUv).xy + f * uDt;',
        '  o = vec4(clamp(v, -4.0, 4.0), 0.0, 1.0);',
        '}'].join('\n');

      var FS_DIV = ['#version 300 es', 'precision highp float;', 'in vec2 vUv; out vec4 o;',
        'uniform sampler2D uVel; uniform vec2 uTexel;',
        'void main(){',
        '  float L = texture(uVel, vUv - vec2(uTexel.x, 0.0)).x;',
        '  float R = texture(uVel, vUv + vec2(uTexel.x, 0.0)).x;',
        '  float B = texture(uVel, vUv - vec2(0.0, uTexel.y)).y;',
        '  float T = texture(uVel, vUv + vec2(0.0, uTexel.y)).y;',
        '  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);',
        '}'].join('\n');

      var FS_JACOBI = ['#version 300 es', 'precision highp float;', 'in vec2 vUv; out vec4 o;',
        'uniform sampler2D uPres; uniform sampler2D uDiv; uniform vec2 uTexel;',
        'void main(){',
        '  float L = texture(uPres, vUv - vec2(uTexel.x, 0.0)).x;',
        '  float R = texture(uPres, vUv + vec2(uTexel.x, 0.0)).x;',
        '  float B = texture(uPres, vUv - vec2(0.0, uTexel.y)).x;',
        '  float T = texture(uPres, vUv + vec2(0.0, uTexel.y)).x;',
        '  float d = texture(uDiv, vUv).x;',
        '  o = vec4((L + R + B + T - d) * 0.25, 0.0, 0.0, 1.0);',
        '}'].join('\n');

      var FS_GRAD = ['#version 300 es', 'precision highp float;', 'in vec2 vUv; out vec4 o;',
        'uniform sampler2D uPres; uniform sampler2D uVel; uniform vec2 uTexel;',
        'void main(){',
        '  float L = texture(uPres, vUv - vec2(uTexel.x, 0.0)).x;',
        '  float R = texture(uPres, vUv + vec2(uTexel.x, 0.0)).x;',
        '  float B = texture(uPres, vUv - vec2(0.0, uTexel.y)).x;',
        '  float T = texture(uPres, vUv + vec2(0.0, uTexel.y)).x;',
        '  vec2 v = texture(uVel, vUv).xy - vec2(R - L, T - B) * 0.5;',
        '  o = vec4(v, 0.0, 1.0);',
        '}'].join('\n');

      var FS_CLEAR = ['#version 300 es', 'precision highp float;', 'in vec2 vUv; out vec4 o;',
        'uniform sampler2D uSrc; uniform float uValue;',
        'void main(){ o = texture(uSrc, vUv) * uValue; }'].join('\n');

      var FS_DISPLAY = ['#version 300 es', 'precision highp float;', 'in vec2 vUv; out vec4 o;',
        'uniform sampler2D uDye; uniform vec3 uInk; uniform vec3 uAccent; uniform float uOpacity;',
        'void main(){',
        '  vec2 d = texture(uDye, vUv).rg;',
        '  float amt = d.r + d.g;',
        '  float a = 1.0 - exp(-amt * 2.35);',
        '  float tAcc = d.g / max(amt, 1e-4);',
        '  vec3 col = mix(uInk, uAccent, clamp(tAcc * 1.7, 0.0, 1.0));',
        '  a *= uOpacity;',
        '  o = vec4(col, a);',
        '}'].join('\n');

      var vao, vbo;
      function compile(type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          if (window.console) console.warn('shader:', gl.getShaderInfoLog(s));
          return null;
        }
        return s;
      }
      var vsObj = compile(gl.VERTEX_SHADER, VS);
      if (!vsObj) return null;

      function program(fsSrc) {
        var fs = compile(gl.FRAGMENT_SHADER, fsSrc);
        if (!fs) return null;
        var p = gl.createProgram();
        gl.attachShader(p, vsObj);
        gl.attachShader(p, fs);
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
          if (window.console) console.warn('link:', gl.getProgramInfoLog(p));
          return null;
        }
        var u = {};
        var n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
        for (var i = 0; i < n; i++) {
          var info = gl.getActiveUniform(p, i);
          var name = info.name.replace(/\[0\]$/, '');
          u[name] = gl.getUniformLocation(p, name);
        }
        return { p: p, u: u };
      }

      var progs = {
        splat: program(FS_SPLAT), advect: program(FS_ADVECT), curl: program(FS_CURL),
        vort: program(FS_VORT), div: program(FS_DIV), jacobi: program(FS_JACOBI),
        grad: program(FS_GRAD), clear: program(FS_CLEAR), display: program(FS_DISPLAY)
      };
      for (var k in progs) { if (!progs[k]) return null; }

      vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.disable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);

      /* ---- 资源 ---- */
      var simW = 1, simH = 1, dyeW = 1, dyeH = 1;
      var velocity = null, dye = null, pressure = null, divF = null, curlF = null;

      function fbo(w, h, internal, format, type, filter) {
        var tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null);
        var fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return null;
        gl.viewport(0, 0, w, h);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return { tex: tex, fbo: fb, w: w, h: h };
      }
      function doubleFBO(w, h, internal, format, type, filter) {
        var a = fbo(w, h, internal, format, type, filter);
        var b = fbo(w, h, internal, format, type, filter);
        if (!a || !b) return null;
        return {
          read: a, write: b, w: w, h: h,
          swap: function () { var tmp = this.read; this.read = this.write; this.write = tmp; }
        };
      }

      var T = {
        rg: [gl.RG16F, gl.RG, gl.HALF_FLOAT],
        r: [gl.R16F, gl.RED, gl.HALF_FLOAT]
      };

      function alloc() {
        velocity = doubleFBO(simW, simH, T.rg[0], T.rg[1], T.rg[2], gl.LINEAR);
        dye = doubleFBO(dyeW, dyeH, T.rg[0], T.rg[1], T.rg[2], gl.LINEAR);
        pressure = doubleFBO(simW, simH, T.r[0], T.r[1], T.r[2], gl.LINEAR);
        divF = fbo(simW, simH, T.r[0], T.r[1], T.r[2], gl.NEAREST);
        curlF = fbo(simW, simH, T.r[0], T.r[1], T.r[2], gl.NEAREST);
        return !!(velocity && dye && pressure && divF && curlF);
      }

      function bindTex(unit, tex) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
      }
      function drawTo(target) {
        if (target) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
          gl.viewport(0, 0, target.w, target.h);
        } else {
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.viewport(0, 0, canvas.width, canvas.height);
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      var simTexel = [1 / 128, 1 / 128];
      var dtCur = 1 / 60;

      function splat(field, point, color, radius, strength) {
        var P = progs.splat;
        dbg.splats++;
        gl.useProgram(P.p);
        gl.uniform1i(P.u.uTarget, 0); bindTex(0, field.read.tex);
        gl.uniform2f(P.u.uPoint, point[0], point[1]);
        gl.uniform3f(P.u.uColor, color[0], color[1], color[2]);
        gl.uniform1f(P.u.uRadius, radius);
        gl.uniform1f(P.u.uStrength, strength);
        gl.uniform1f(P.u.uAspect, canvas.width / Math.max(1, canvas.height));
        drawTo(field.write);
        field.swap();
      }

      function advect(src, dst, diss) {
        var P = progs.advect;
        gl.useProgram(P.p);
        gl.uniform1i(P.u.uVel, 0); bindTex(0, velocity.read.tex);
        gl.uniform1i(P.u.uSrc, 1); bindTex(1, src.read.tex);
        gl.uniform1f(P.u.uDt, dtCur);
        gl.uniform1f(P.u.uDiss, diss);
        drawTo(dst.write);
        dst.swap();
      }

      function step() {
        var P;
        // 涡量约束：让墨迹有卷曲的丝状边缘，而不是一团糊
        P = progs.curl;
        gl.useProgram(P.p);
        gl.uniform1i(P.u.uVel, 0); bindTex(0, velocity.read.tex);
        gl.uniform2f(P.u.uTexel, simTexel[0], simTexel[1]);
        drawTo(curlF);

        P = progs.vort;
        gl.useProgram(P.p);
        gl.uniform1i(P.u.uVel, 0); bindTex(0, velocity.read.tex);
        gl.uniform1i(P.u.uCurl, 1); bindTex(1, curlF.tex);
        gl.uniform2f(P.u.uTexel, simTexel[0], simTexel[1]);
        gl.uniform1f(P.u.uCurlStrength, 26);
        gl.uniform1f(P.u.uDt, dtCur);
        drawTo(velocity.write);
        velocity.swap();

        // 压力投影：去掉散度，墨迹才会绕着走
        P = progs.div;
        gl.useProgram(P.p);
        gl.uniform1i(P.u.uVel, 0); bindTex(0, velocity.read.tex);
        gl.uniform2f(P.u.uTexel, simTexel[0], simTexel[1]);
        drawTo(divF);

        P = progs.clear;
        gl.useProgram(P.p);
        gl.uniform1i(P.u.uSrc, 0); bindTex(0, pressure.read.tex);
        gl.uniform1f(P.u.uValue, 0.78);
        drawTo(pressure.write);
        pressure.swap();

        P = progs.jacobi;
        gl.useProgram(P.p);
        gl.uniform1i(P.u.uDiv, 0); bindTex(0, divF.tex);
        gl.uniform2f(P.u.uTexel, simTexel[0], simTexel[1]);
        for (var i = 0; i < 16; i++) {
          gl.uniform1i(P.u.uPres, 1); bindTex(1, pressure.read.tex);
          drawTo(pressure.write);
          pressure.swap();
        }

        P = progs.grad;
        gl.useProgram(P.p);
        gl.uniform1i(P.u.uPres, 0); bindTex(0, pressure.read.tex);
        gl.uniform1i(P.u.uVel, 1); bindTex(1, velocity.read.tex);
        gl.uniform2f(P.u.uTexel, simTexel[0], simTexel[1]);
        drawTo(velocity.write);
        velocity.swap();

        // 平流
        advect(velocity, velocity, 0.22);
        advect(dye, dye, 0.92);
      }

      function display() {
        var P = progs.display;
        gl.useProgram(P.p);
        gl.uniform1i(P.u.uDye, 0); bindTex(0, dye.read.tex);
        gl.uniform3f(P.u.uInk, pal.ink[0], pal.ink[1], pal.ink[2]);
        gl.uniform3f(P.u.uAccent, pal.accent[0], pal.accent[1], pal.accent[2]);
        gl.uniform1f(P.u.uOpacity, pal.dark ? 0.6 : 0.94);
        // 必须先绑默认帧缓冲再清屏：否则会清掉上一步刚写好的墨色缓冲
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      function resize() {
        var rect = band.getBoundingClientRect();
        var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        var w = Math.max(2, Math.round(rect.width * dpr));
        var h = Math.max(2, Math.round(rect.height * dpr));
        if (canvas.width === w && canvas.height === h && velocity) return true;
        canvas.width = w;
        canvas.height = h;
        var aspect = w / h;
        var base = window.innerWidth < 760 ? 96 : 120;
        if (aspect >= 1) { simH = base; simW = Math.min(420, Math.round(base * aspect)); }
        else { simW = base; simH = Math.round(base / Math.max(0.35, aspect)); }
        var dBase = window.innerWidth < 760 ? 300 : 460;
        if (aspect >= 1) { dyeH = dBase; dyeW = Math.min(1100, Math.round(dBase * aspect)); }
        else { dyeW = dBase; dyeH = Math.round(dBase / Math.max(0.35, aspect)); }
        simTexel = [1 / simW, 1 / simH];
        return alloc();
      }

      return {
        resize: resize,
        splatVelocity: function (pt, dx, dy) { splat(velocity, pt, [dx, dy, 0], 0.0017, 1); },
        splatInk: function (pt, ink, acc, radius) { splat(dye, pt, [ink, acc, 0], radius || 0.0017, 1); },
        step: function (dt) { dtCur = Math.max(0.006, Math.min(1 / 32, dt)); step(); },
        display: display,
        setPalette: function () { pal = colors(); },
        sample: function (u, v) {
          var buf = new Uint16Array(2);
          gl.bindFramebuffer(gl.FRAMEBUFFER, dye.read.fbo);
          gl.readPixels(Math.floor(dyeW * (u || 0.7)), Math.floor(dyeH * (v || 0.5)), 1, 1, gl.RG, gl.HALF_FLOAT, buf);
          return [buf[0], buf[1]];
        },
        canvasSample: function (x, y) {
          var b = new Uint8Array(4);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.readPixels(x | 0, y | 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, b);
          return Array.prototype.slice.call(b);
        },
        gl: gl
      };
    }

    /* ---------------- Canvas2D 兜底：拖尾 ---------------- */
    function create2D() {
      var ctx = canvas.getContext('2d');
      if (!ctx) return null;
      var pts = [];
      return {
        resize: function () {
          var rect = band.getBoundingClientRect();
          var dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.max(2, Math.round(rect.width * dpr));
          canvas.height = Math.max(2, Math.round(rect.height * dpr));
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          pts.length = 0;
          return true;
        },
        splatVelocity: function (pt, dx, dy) {
          pts.push({ x: pt[0] * canvas.clientWidth, y: (1 - pt[1]) * canvas.clientHeight, a: 1, dx: dx, dy: dy });
          if (pts.length > 90) pts.shift();
        },
        splatInk: function () {},
        step: function () {},
        display: function () {
          var w = canvas.clientWidth, h = canvas.clientHeight;
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = 'rgba(0,0,0,0.055)';
          ctx.fillRect(0, 0, w, h);
          ctx.globalCompositeOperation = 'source-over';
          var col = pal.ink;
          var rgb = Math.round(col[0] * 255) + ',' + Math.round(col[1] * 255) + ',' + Math.round(col[2] * 255);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          for (var i = 1; i < pts.length; i++) {
            var p0 = pts[i - 1], p1 = pts[i];
            var t = i / pts.length;
            ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.42 * t).toFixed(3) + ')';
            ctx.lineWidth = 22 * t;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
          }
        },
        setPalette: function () { pal = colors(); },
        gl: null
      };
    }

    var engine = null;
    var useGL = true;
    var dbg = { frames: 0, splats: 0, lastAmt: -1 };
    function ensureEngine() {
      if (engine) return engine;
      if (useGL) {
        var g = null;
        try { g = createGL(); } catch (e) { g = null; }
        if (g) {
          engine = g;
          engine.setPalette();
          // 浮点纹理分配失败（老显卡）时立刻退回 2D，别留下半死的引擎
          if (engine.resize() === false) engine = null;
        }
      }
      if (!engine) {
        useGL = false;
        engine = create2D();
        if (engine) { engine.setPalette(); engine.resize(); }
      }
      return engine;
    }

    /* ---------------- 指针与动画 ---------------- */
    var pointer = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, has: false, lastMove: 0, speed: 0 };
    var ambT = Math.random() * 20;
    var lastTs = 0;
    var raf = 0;
    var frameCount = 0;
    var near = true;

    function toUv(e) {
      var r = band.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    }

    function burstAt(pt, power, accent) {
      if (!engine) return;
      var a = accent || 0;
      engine.splatInk(pt, 0.16 * power, a, 0.0028);
      engine.splatVelocity(pt, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
    }

    function connectLine(from, to) {
      if (!engine) return;
      var n = 9;
      for (var i = 1; i < n; i++) {
        var t = i / n;
        engine.splatInk([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t], 0.018, 0, 0.0011);
      }
    }

    function onMove(e) {
      if (!engine) return;
      var uv = toUv(e);
      if (!uv) return;
      var now = performance.now();
      if (!pointer.has) {
        pointer.has = true;
        pointer.x = uv[0]; pointer.y = uv[1];
        burstAt(uv, 0.7, 0);
        return;
      }
      var dx = uv[0] - pointer.x;
      var dy = uv[1] - pointer.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.0009) return;
      var k = Math.min(1, 0.16 / dist);
      dx *= k; dy *= k;                       // 跳变时截断，避免一次甩出巨浪
      pointer.x = uv[0]; pointer.y = uv[1];
      pointer.lastMove = now;
      pointer.speed = dist;

      var gain = 14;
      var ink = 0.030 + Math.min(0.062, dist * 5.2);
      var acc = Math.random() < 0.055 ? 0.05 : 0;
      var steps = dist > 0.05 ? 3 : 1;
      for (var s = 1; s <= steps; s++) {
        var t = s / steps;
        var pt = [uv[0] - dx * (1 - t), uv[1] - dy * (1 - t)];
        engine.splatVelocity(pt, dx * gain, dy * gain);
        engine.splatInk(pt, ink / steps * 1.5, acc, 0.0017);
      }
      if (reduceMotion) engine.display();
      if (now > statusHold) setStatus('motion.stirring');
    }

    function onLeave() {
      pointer.has = false;
      if (performance.now() > statusHold) setStatus('motion.hint');
    }

    function ambient(dt) {
      if (!engine) return;
      ambT += dt;
      var wide = band.clientWidth > 900;
      var cx = wide ? 0.73 : 0.5;
      var cy = wide ? 0.5 : 0.32;
      var amp = wide ? 0.19 : 0.24;
      var x = cx + amp * Math.sin(ambT * 0.34) * 0.9 + 0.05 * Math.sin(ambT * 0.9);
      var y = cy + amp * Math.cos(ambT * 0.27) * 0.8;
      var dx = Math.cos(ambT * 0.34) * 0.22 * amp;
      var dy = -Math.sin(ambT * 0.27) * 0.22 * amp;
      engine.splatVelocity([x, y], dx, dy);
      engine.splatInk([x, y], 0.042, 0, 0.0024);
    }

    function frame(ts) {
      var dt = lastTs ? (ts - lastTs) / 1000 : 1 / 60;
      lastTs = ts;
      raf = requestAnimationFrame(frame);
      if (document.hidden || !engine) return;
      dbg.frames++;
      if (reduceMotion) { engine.display(); return; }
      // 视口距离每 6 帧量一次：比 IntersectionObserver 更可靠（IO 在 iframe /
      // 程序化滚动里会漏报，一旦误判为不可见就永久停住）
      if ((frameCount++ % 6) === 0) {
        var rect = band.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight || 800;
        near = rect.bottom > -320 && rect.top < vh + 320;
      }
      if (!near) return;
      ambient(dt);
      engine.step(dt);
      engine.display();
      canvas.classList.add('ready');

      var now = performance.now();
      if (now > statusHold && now - pointer.lastMove > 1600 && statusKey === 'motion.stirring') {
        setStatus(anchorState >= 0 ? 'motion.n' + anchorState : 'motion.hint');
      }
    }

    /* 关键词 → 墨点落位 */
    var anchorState = -1;
    function activateNode(i) {
      anchorState = i;
      kwEls.forEach(function (el, k) {
        el.classList.toggle('active', k === i);
        el.setAttribute('aria-pressed', k === i ? 'true' : 'false');
      });
      if (i < 0) {
        setStatus('motion.hint');
        statusHold = 0;
        return;
      }
      var A = anchors();
      burstAt(A[i], 1.3, 0.10);
      connectLine(A[i], A[(i + 1) % 3]);
      setStatus('motion.n' + i);
      statusHold = performance.now() + 2600;
    }

    kwEls.forEach(function (el, i) {
      el.setAttribute('aria-pressed', 'false');
      el.addEventListener('mouseenter', function () { activateNode(i); });
      el.addEventListener('focus', function () { activateNode(i); });
      el.addEventListener('click', function () {
        activateNode(anchorState === i ? -1 : i);
      });
      el.addEventListener('mouseleave', function () { if (anchorState === i) activateNode(-1); });
    });

    function replay() {
      replayTimers.forEach(clearTimeout);
      replayTimers = [];
      setStatus('motion.replaying');
      statusHold = performance.now() + 2000;
      if (!engine) return;
      var A = anchors();
      var mid = [0.5 * (A[0][0] + A[2][0]), 0.5 * (A[0][1] + A[2][1])];
      for (var i = 0; i < 3; i++) {
        var a = (i / 3) * Math.PI * 2;
        engine.splatVelocity(mid, Math.cos(a) * 1.4, Math.sin(a) * 1.4);
      }
      burstAt(mid, 1.6, 0.12);
      engine.splatInk(mid, 0.18, 0, 0.0050);
      if (reduceMotion) { engine.step(0.016); engine.display(); }
      replayTimers.push(setTimeout(function () {
        setStatus('motion.done');
        statusHold = performance.now() + 1800;
      }, 700));
      replayTimers.push(setTimeout(function () {
        setStatus(anchorState >= 0 ? 'motion.n' + anchorState : 'motion.hint');
      }, 3000));
    }
    if (replayBtn) replayBtn.addEventListener('click', replay);
    if (trigger) {
      trigger.addEventListener('click', replay);
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); replay(); }
      });
    }

    document.addEventListener('ic:theme', function () {
      pal = colors();
      if (engine) engine.setPalette();
      if (reduceMotion && engine) { engine.display(); }
    });

    /* 启动 */
    if (!ensureEngine()) {
      return; // 连 2D 都拿不到，静态背景即可
    }
    if (/[?&]debug=ink/.test(location.search)) {
      window.__ink = {
        frames: function () { return dbg.frames; },
        splats: function () { return dbg.splats; },
        kind: function () { return useGL ? 'gl' : '2d'; },
        sample: function () {
          return engine.sample ? engine.sample(0.7, 0.5) : 'n/a';
        },
        canvasSample: function () {
          return engine.canvasSample ? engine.canvasSample(canvas.width * 0.7, canvas.height * 0.5) : 'n/a';
        },
        state: function () {
          return {
            w: canvas.width, h: canvas.height,
            cls: canvas.className, op: getComputedStyle(canvas).opacity,
            near: near, hidden: document.hidden
          };
        },
        pal: function () { return pal; },
        err: function () { return engine.gl ? engine.gl.getError() : -1; },
        step: function (n) {
          for (var i = 0; i < (n || 1); i++) { ambient(1 / 60); engine.step(1 / 60); }
          engine.display();
          canvas.classList.add('ready');
          return engine.gl ? engine.gl.getError() : -1;
        },
        splatOnly: function () {
          burstAt([0.7, 0.5], 1.0, 0);
          return engine.gl ? engine.gl.getError() : -1;
        },
        tick: function (n) {
          for (var i = 0; i < (n || 1); i++) { ambient(1 / 60); engine.step(1 / 60); }
          engine.display();
          canvas.classList.add('ready');
          return dbg.frames;
        }
      };
    }
    if (reduceMotion) {
      var A0 = anchors();
      burstAt(A0[1], 1.4, 0.09);
      for (var si = 0; si < 24; si++) engine.step(1 / 60);
      engine.display();
      canvas.classList.add('ready');
    } else {
      band.addEventListener('pointermove', onMove, { passive: true });
      band.addEventListener('pointerleave', onLeave, { passive: true });
      // 先落一点墨，避免刚滚到这里时是一片空白
      var seed = anchors();
      burstAt(seed[1], 1.0, 0.05);
      for (var si0 = 0; si0 < 6; si0++) engine.step(1 / 60);
      engine.display();
      canvas.classList.add('ready');
      window.addEventListener('resize', function () {
        if (ensureEngine()) { engine.resize(); pal = colors(); }
      }, { passive: true });
      raf = requestAnimationFrame(frame);
    }
  })();
})();
