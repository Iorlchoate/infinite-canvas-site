/* 无限画布官网交互
   纯原生 JS，无外部依赖，可直接跑在 GitHub Pages 上。
   模块：i18n → 主题 → 导航/进度 → 界面预览 → 版本号 → 运用场景矢量场（Canvas2D） */
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

    /* 运用场景控制台 */
    'field.aria': 'Interactive workflow field',
    'field.eyebrow': 'FIELD NOTES · 04 WORKFLOWS',
    'field.title': 'One canvas, one complete scheme',
    'field.lead': 'Not "everything can connect". Four real jobs, first step to last, all on the same board. Pick one and watch it run.',
    'field.listaria': 'Use cases',
    'field.s1': 'Concept schemes',
    'field.s1sub': 'Site plan → style transfer → concept renders',
    'field.s2': 'Facade options',
    'field.s2sub': 'Site photo → inpainting → material comparison',
    'field.s3': 'Multi-view deck',
    'field.s3sub': 'Render → outpaint → presentation layout',
    'field.s4': 'Asset reuse',
    'field.s4sub': 'Collect → group → reuse on the next project',

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
     3. 运用场景控制台：Canvas2D 矢量场
     不是流体烟。这里是等距网格随指针形变、发光轨迹、雷达环、
     节点连线上跑的数据包和 HUD 读数 —— 科幻感来自结构与硬边光线。
     ===================================================================== */
  (function fieldBand() {
    var stage = $('#fieldStage');
    var canvas = $('#fieldCanvas');
    if (!stage || !canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var tabs = $$('.field-tab');
    var descEl = $('#fieldDesc');
    var tagEl = $('#fieldTag');
    var flowEl = $('#fieldFlow');
    var modeEl = $('#fieldMode');
    var readoutEl = $('#fieldReadout');

    /* 四个真实工作流：节点名、说明、流程、模式各带中英两份 */
    var SCENES = [
      {
        pos: [[.13, .22], [.13, .53], [.47, .36], [.82, .20], [.82, .52]],
        zh: {
          mode: 'CONCEPT',
          desc: '拿到一张手绘总平面和三张参考照片：拖进画布、连到风格迁移节点，一小时内出四版概念效果，选中的直接归入方案 A。',
          nodes: ['总平面草图', '参考图 ×3', '风格迁移', '概念效果 ×4', '归档 · 方案 A'],
          flow: ['总平面', '参考图', '风格迁移', '概念效果', '归档']
        },
        en: {
          mode: 'CONCEPT',
          desc: 'A hand-drawn site plan and three reference photos land on the canvas, wire into a style-transfer node, and four concept renders are in Scheme A within the hour.',
          nodes: ['Site plan sketch', 'References ×3', 'Style transfer', 'Concept ×4', 'File · Scheme A'],
          flow: ['Site plan', 'References', 'Transfer', 'Concepts', 'Archive']
        }
      },
      {
        pos: [[.16, .20], [.16, .51], [.48, .31], [.80, .18], [.80, .49]],
        zh: {
          mode: 'FACADE',
          desc: '旧建筑立面要试三种材质。用局部重绘只改指定区域，三轮结果并排摆在同一张布上，客户当场圈定，不用反复导出。',
          nodes: ['实拍立面', '局部重绘', '材质 A', '材质 B / C', '并排比选'],
          flow: ['实拍', '局部重绘', '材质变体', '并排比选']
        },
        en: {
          mode: 'FACADE',
          desc: 'Three material options for an old facade. Inpainting changes only the masked area; three rounds sit side by side on one board so the client can pick on the spot.',
          nodes: ['Site photo', 'Inpainting', 'Material A', 'Material B / C', 'Side-by-side'],
          flow: ['Photo', 'Inpaint', 'Variants', 'Compare']
        }
      },
      {
        pos: [[.13, .18], [.38, .20], [.55, .44], [.81, .19], [.81, .52]],
        zh: {
          mode: 'MULTIVIEW',
          desc: '汇报前要补齐鸟瞰、人视和夜景：扩展出图接九宫格多视角，一次生成九张，选中的图直接排进汇报页。',
          nodes: ['效果图', '扩展出图', '九宫格多视角', '鸟瞰 / 夜景', '汇报版式'],
          flow: ['效果图', '扩展', '九宫格', '汇报页']
        },
        en: {
          mode: 'MULTIVIEW',
          desc: 'Before a review you need the aerial, the eye-level view and the night shot. Outpainting feeds a 3×3 multi-view grid: nine images in one run, chosen ones straight into the deck.',
          nodes: ['Base render', 'Outpaint', '3×3 multi-view', 'Aerial / night', 'Deck layout'],
          flow: ['Render', 'Outpaint', '3×3 views', 'Deck']
        }
      },
      {
        pos: [[.14, .24], [.38, .51], [.55, .23], [.78, .47], [.86, .19]],
        zh: {
          mode: 'LIBRARY',
          desc: '项目收尾，上百张过程图批量采集、自动分组与智能分类；下个项目开新画布时，直接从素材库拖回来接着用。',
          nodes: ['批量采集', '自动分组', '智能分类', '方案 A 素材', '跨项目复用'],
          flow: ['采集', '分组', '分类', '复用']
        },
        en: {
          mode: 'LIBRARY',
          desc: 'At wrap-up, hundreds of in-progress images are collected, grouped and classified in one pass. On the next project you drag them straight back out of the library.',
          nodes: ['Batch collect', 'Auto groups', 'Auto classify', 'Scheme A assets', 'Reuse'],
          flow: ['Collect', 'Group', 'Classify', 'Reuse']
        }
      }
    ];

    var LINKS = [[0, 2], [1, 2], [2, 3], [2, 4]];
    var C = {
      mesh: 'rgba(94,234,212,.055)', meshHot: 'rgba(94,234,212,.72)',
      wire: 'rgba(94,234,212,.22)', wireHot: 'rgba(94,234,212,.9)',
      node: 'rgba(7,16,23,.94)', nodeLine: 'rgba(94,234,212,.36)',
      text: '#dceef1', dim: '#6b8792', accent: '#5eead4', coral: '#f2685c'
    };

    function loc(n) { return n[lang] || n.zh; }
    var active = 0;
    var W = 0, H = 0, dpr = 1;
    var frame = 0, lastTs = 0, near = true, raf = 0, scanX = 0;
    var ptr = { x: -999, y: -999, has: false, lastRing: 0 };
    var trail = [], rings = [], packets = [], nodes = [], flash = 0, hover = -1;
    var NODE_W = 132, NODE_H = 44;

    for (var n0 = 0; n0 < 5; n0++) nodes.push({ x: 0, y: 0, tx: 0, ty: 0, ready: false });

    function resize() {
      var r = stage.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      NODE_W = Math.min(138, Math.max(96, W * 0.19));
      NODE_H = W < 520 ? 38 : 44;
      targetNodes(true);
      if (reduceMotion) draw(0);
    }

    function targetNodes(snap) {
      var p = SCENES[active].pos;
      for (var i = 0; i < 5; i++) {
        var x = Math.max(NODE_W / 2 + 12, Math.min(W - NODE_W / 2 - 12, p[i][0] * W));
        // 手机上说明卡更高，给下半区留出空间，节点不要被盖住
        var reserve = W < 520 ? H * .42 : 90;
        var y = Math.max(NODE_H / 2 + 30, Math.min(H - NODE_H / 2 - reserve, p[i][1] * H));
        nodes[i].tx = x; nodes[i].ty = y;
        if (snap || !nodes[i].ready) { nodes[i].x = x; nodes[i].y = y; nodes[i].ready = true; }
      }
    }

    function paintText() {
      var s = loc(SCENES[active]);
      if (descEl) descEl.textContent = s.desc;
      if (tagEl) tagEl.textContent = 'SCENE 0' + (active + 1) + ' / 04';
      if (modeEl) modeEl.textContent = s.mode;
      if (flowEl) {
        var h = '';
        for (var i = 0; i < s.flow.length; i++) {
          if (i) h += '<i></i>';
          h += '<span></span>';
        }
        flowEl.innerHTML = h;
        $$('#fieldFlow span').forEach(function (el, i) { el.textContent = s.flow[i]; });
      }
    }

    function setScene(i) {
      if (i === active && nodes[0].ready) return;
      active = i;
      tabs.forEach(function (t, k) {
        t.classList.toggle('active', k === i);
        t.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
      paintText();
      targetNodes(false);
      flash = 1;
      rings.push({ x: W * .5, y: H * .38, r: 0, a: .9 });
      packets = LINKS.map(function (_, k) { return { p: (k * .23 + Math.random() * .2) % 1, sp: .28 + Math.random() * .18 }; });
      if (reduceMotion) draw(0);
    }

    function onMove(e) {
      var r = stage.getBoundingClientRect();
      ptr.x = e.clientX - r.left;
      ptr.y = e.clientY - r.top;
      ptr.has = true;
      var now = performance.now();
      trail.push({ x: ptr.x, y: ptr.y });
      if (trail.length > 26) trail.shift();
      if (now - ptr.lastRing > 170) {
        rings.push({ x: ptr.x, y: ptr.y, r: 0, a: .75 });
        ptr.lastRing = now;
      }
      if (rings.length > 8) rings.shift();
      hover = hitNode(ptr.x, ptr.y);
      if (readoutEl) {
        var txt = 'X ' + pad(ptr.x) + ' · Y ' + pad(ptr.y) + ' · NODES 05 · LINKS 04';
        if (hover >= 0) txt += ' · FOCUS ' + loc(SCENES[active]).nodes[hover];
        readoutEl.textContent = txt;
      }
      if (reduceMotion) draw(0);
    }

    function pad(v) { return ('0000' + Math.max(0, Math.round(v))).slice(-4); }

    function hitNode(x, y) {
      for (var i = 0; i < 5; i++) {
        var n = nodes[i];
        if (Math.abs(x - n.x) < NODE_W / 2 + 4 && Math.abs(y - n.y) < NODE_H / 2 + 4) return i;
      }
      return -1;
    }

    function rr(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    function fitText(s, maxW) {
      if (ctx.measureText(s).width <= maxW) return s;
      var t = s;
      while (t.length > 2 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
      return t + '…';
    }

    function bez(a, b, t) {
      var mx = (a.x + b.x) / 2;
      var u = 1 - t;
      return {
        x: u * u * u * a.x + 3 * u * u * t * mx + 3 * u * t * t * mx + t * t * t * b.x,
        y: u * u * u * a.y + 3 * u * u * t * a.y + 3 * u * t * t * b.y + t * t * t * b.y
      };
    }

    function update(dt) {
      for (var i = 0; i < 5; i++) {
        nodes[i].x += (nodes[i].tx - nodes[i].x) * Math.min(1, dt * 7);
        nodes[i].y += (nodes[i].ty - nodes[i].y) * Math.min(1, dt * 7);
      }
      for (i = 0; i < packets.length; i++) {
        packets[i].p = (packets[i].p + dt * packets[i].sp) % 1;
      }
      for (i = rings.length - 1; i >= 0; i--) {
        rings[i].r += dt * 105;
        rings[i].a -= dt * .85;
        if (rings[i].a <= 0) rings.splice(i, 1);
      }
      if (flash > 0) flash = Math.max(0, flash - dt * 1.5);
      scanX = (scanX + dt * 62) % (W + 120);
      if (trail.length && !ptr.has) trail.shift();
    }

    function drawMesh() {
      var step = 38;
      var cols = Math.ceil(W / step) + 1, rows = Math.ceil(H / step) + 1;
      var pts = [], j, i;
      for (j = 0; j < rows; j++) {
        var row = [];
        for (i = 0; i < cols; i++) {
          var bx = i * step, by = j * step;
          var dx = bx - ptr.x, dy = by - ptr.y;
          var d = Math.sqrt(dx * dx + dy * dy) || 1;
          var inf = ptr.has ? Math.max(0, 1 - d / 185) : 0;
          var pull = inf * inf * 24;
          row.push({ x: bx + dx / d * pull, y: by + dy / d * pull, hot: inf });
        }
        pts.push(row);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = C.mesh;
      ctx.beginPath();
      for (j = 0; j < rows; j++) {
        for (i = 0; i < cols; i++) {
          var p = pts[j][i];
          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
      }
      for (i = 0; i < cols; i++) {
        for (j = 0; j < rows; j++) {
          var q = pts[j][i];
          if (j === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
        }
      }
      ctx.stroke();

      /* 指针附近的网格点被点亮，并向指针拉出细丝 */
      if (ptr.has) {
        ctx.strokeStyle = 'rgba(94,234,212,.16)';
        ctx.beginPath();
        for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
          var a = pts[j][i];
          if (a.hot > .42) { ctx.moveTo(ptr.x, ptr.y); ctx.lineTo(a.x, a.y); }
        }
        ctx.stroke();
        for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
          var b = pts[j][i];
          if (b.hot > .02) {
            ctx.fillStyle = 'rgba(94,234,212,' + (b.hot * .8).toFixed(3) + ')';
            var sz = 1 + b.hot * 2.2;
            ctx.fillRect(b.x - sz / 2, b.y - sz / 2, sz, sz);
          }
        }
      }
    }

    function drawLinks() {
      ctx.lineWidth = 1.1;
      LINKS.forEach(function (lk, k) {
        var a = nodes[lk[0]], b = nodes[lk[1]];
        var active = hover === lk[0] || hover === lk[1];
        ctx.strokeStyle = active ? C.wireHot : C.wire;
        ctx.beginPath();
        var mx = (a.x + b.x) / 2;
        ctx.moveTo(a.x, a.y);
        ctx.bezierCurveTo(mx, a.y, mx, b.y, b.x, b.y);
        ctx.stroke();
        if (!packets.length) return;
        var pk = packets[k % packets.length];
        if (!pk) return;
        var p = bez(a, b, pk.p);
        ctx.fillStyle = C.accent;
        ctx.shadowColor = C.accent; ctx.shadowBlur = 9;
        ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
        ctx.shadowBlur = 0;
      });
    }

    function drawNodes() {
      var s = loc(SCENES[active]);
      for (var i = 0; i < 5; i++) {
        var n = nodes[i], x = n.x - NODE_W / 2, y = n.y - NODE_H / 2;
        var on = hover === i;
        rr(x, y, NODE_W, NODE_H, 7);
        ctx.fillStyle = C.node; ctx.fill();
        ctx.strokeStyle = on ? C.coral : C.nodeLine;
        ctx.lineWidth = on ? 1.4 : 1;
        ctx.stroke();
        /* 左侧编号条 */
        ctx.fillStyle = on ? 'rgba(242,104,92,.16)' : 'rgba(94,234,212,.09)';
        rr(x + 1, y + 1, 27, NODE_H - 2, 6); ctx.fill();
        ctx.font = '400 9px ' + 'ui-monospace,Consolas,monospace';
        ctx.fillStyle = on ? C.coral : C.accent;
        ctx.textBaseline = 'middle';
        ctx.fillText('0' + (i + 1), x + 8, n.y);
        ctx.font = '500 10.5px -apple-system,"Segoe UI","Microsoft YaHei",sans-serif';
        ctx.fillStyle = C.text;
        ctx.fillText(fitText(s.nodes[i], NODE_W - 44), x + 34, n.y);
        ctx.fillStyle = on ? C.coral : 'rgba(94,234,212,.55)';
        ctx.beginPath(); ctx.arc(x + NODE_W - 10, y + 9, 2, 0, Math.PI * 2); ctx.fill();
      }
    }

    function drawPointer() {
      /* 发光轨迹 */
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (var i = 1; i < trail.length; i++) {
        var a = i / trail.length;
        ctx.strokeStyle = 'rgba(94,234,212,' + (a * a * .6).toFixed(3) + ')';
        ctx.lineWidth = .8 + a * 2;
        if (i > trail.length - 7) { ctx.shadowColor = C.accent; ctx.shadowBlur = 10; }
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      /* 雷达环 */
      rings.forEach(function (r) {
        ctx.strokeStyle = 'rgba(94,234,212,' + Math.max(0, r.a * .55).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
      });
      if (!ptr.has) return;
      /* 十字准星 + 方括号 */
      ctx.strokeStyle = 'rgba(94,234,212,.85)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ptr.x - 15, ptr.y); ctx.lineTo(ptr.x - 6, ptr.y);
      ctx.moveTo(ptr.x + 6, ptr.y); ctx.lineTo(ptr.x + 15, ptr.y);
      ctx.moveTo(ptr.x, ptr.y - 15); ctx.lineTo(ptr.x, ptr.y - 6);
      ctx.moveTo(ptr.x, ptr.y + 6); ctx.lineTo(ptr.x, ptr.y + 15);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(ptr.x, ptr.y, 4, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(94,234,212,.3)';
      var g = 21;
      ctx.beginPath();
      ctx.moveTo(ptr.x - g, ptr.y - g + 6); ctx.lineTo(ptr.x - g, ptr.y - g); ctx.lineTo(ptr.x - g + 6, ptr.y - g);
      ctx.moveTo(ptr.x + g - 6, ptr.y - g); ctx.lineTo(ptr.x + g, ptr.y - g); ctx.lineTo(ptr.x + g, ptr.y - g + 6);
      ctx.moveTo(ptr.x - g, ptr.y + g - 6); ctx.lineTo(ptr.x - g, ptr.y + g); ctx.lineTo(ptr.x - g + 6, ptr.y + g);
      ctx.moveTo(ptr.x + g - 6, ptr.y + g); ctx.lineTo(ptr.x + g, ptr.y + g); ctx.lineTo(ptr.x + g, ptr.y + g - 6);
      ctx.stroke();
    }

    function draw(dt) {
      ctx.clearRect(0, 0, W, H);
      drawMesh();
      /* 慢速扫描线 */
      if (scanX < W) {
        var g = ctx.createLinearGradient(scanX - 28, 0, scanX + 4, 0);
        g.addColorStop(0, 'rgba(94,234,212,0)');
        g.addColorStop(1, 'rgba(94,234,212,.055)');
        ctx.fillStyle = g;
        ctx.fillRect(scanX - 28, 0, 32, H);
      }
      drawLinks();
      drawNodes();
      drawPointer();
      if (flash > 0) {
        var fx = W * (1 - flash);
        ctx.fillStyle = 'rgba(94,234,212,' + (flash * .07).toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(94,234,212,' + (flash * .8).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(fx, 0); ctx.lineTo(fx, H); ctx.stroke();
      }
    }

    function loop(ts) {
      raf = requestAnimationFrame(loop);
      var dt = lastTs ? Math.min(.05, (ts - lastTs) / 1000) : 1 / 60;
      lastTs = ts;
      frame++;
      if ((frame % 6) === 0) {
        var r = stage.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight || 800;
        near = r.bottom > -240 && r.top < vh + 240;
      }
      if (!near || document.hidden) return;
      update(dt);
      draw(dt);
    }

    /* 事件 */
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { setScene(i); });
    });
    stage.addEventListener('pointermove', onMove, { passive: true });
    stage.addEventListener('pointerleave', function () {
      ptr.has = false; hover = -1; trail.length = 0;
      if (readoutEl) readoutEl.textContent = 'X 0000 · Y 0000 · NODES 05 · LINKS 04';
      if (reduceMotion) draw(0);
    });
    stage.addEventListener('pointerdown', function (e) {
      onMove(e);
      rings.push({ x: ptr.x, y: ptr.y, r: 0, a: 1 });
      flash = .7;
    });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('ic:lang', function () { paintText(); if (reduceMotion) draw(0); });
    document.addEventListener('ic:theme', function () { if (reduceMotion) draw(0); });

    resize();
    paintText();
    packets = LINKS.map(function (_, k) { return { p: k * .24, sp: .3 + k * .04 }; });
    rings.push({ x: W * .5, y: H * .38, r: 20, a: .5 });
    draw(0);
    if (!reduceMotion) raf = requestAnimationFrame(loop);

    /* 仅供无头渲染校验：rAF 在后台标签页会被节流，用 tick() 强制步进 */
    if (/[?&]debug=field/.test(location.search)) {
      window.__field = {
        tick: function (n) { for (var i = 0; i < (n || 1); i++) { update(1 / 60); draw(1 / 60); } },
        move: function (u, v) {
          var r = stage.getBoundingClientRect();
          onMove({ clientX: r.left + r.width * u, clientY: r.top + r.height * v });
        },
        scene: setScene,
        state: function () {
          return { W: W, H: H, scene: active, trail: trail.length, rings: rings.length,
                   packets: packets.length, nodes: nodes.length, visible: canvas.width > 0 };
        }
      };
    }
  })();
})();
