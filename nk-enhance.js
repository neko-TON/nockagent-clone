/* ============================================================
   Nock design-enhancement layer v2
   - card cursor spotlight (v1)
   - robot cursor-parallax
   - independent "agent response" readout under the terminal
   - animated best-route visualizer injected into the exec card
   - quick wins: scroll progress, count-up, glitch headings, magnetic CTAs
   Everything runs AFTER hydration and is defensive (try/catch per feature).
   ============================================================ */
(function () {
  if (window.__nkEnhance) return;
  window.__nkEnhance = 1;
  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOVER = !window.matchMedia || window.matchMedia('(hover:hover)').matches;
  var CARD_SEL = '[class*="rounded-2xl"][class*="border-border"][class*="bg-surface"],' +
                 '[class*="rounded-3xl"][class*="border-border"][class*="bg-surface"]';

  /* ---------- injected styles ---------- */
  var css = document.createElement('style');
  css.id = 'nk-enhance-2';
  css.textContent = [
    '#nk-progress{position:fixed;top:0;left:0;height:3px;width:100%;transform:scaleX(0);transform-origin:0 50%;',
      'background:linear-gradient(90deg,#22e07a,#7ff0b0);box-shadow:0 0 12px rgba(34,224,122,.7);z-index:60;pointer-events:none;transition:transform .08s linear}',
    'img[src^="/robot-ai.svg"]{transition:filter .3s ease}',
    '.nk-parallax{transition:transform .35s cubic-bezier(.16,1,.3,1);transform-style:preserve-3d;will-change:transform}',
    /* agent readout */
    '.nk-agent{display:flex;align-items:center;gap:.6rem;margin:.9rem auto 0;max-width:44rem;padding:.6rem .9rem;',
      'border:1px solid color-mix(in oklab,#22e07a 28%,transparent);border-radius:12px;',
      'background:color-mix(in oklab,#0a120d 75%,transparent);backdrop-filter:blur(6px);',
      'font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:12.5px;color:#8a9a90;',
      'box-shadow:0 10px 30px -18px rgba(34,224,122,.6)}',
    '.nk-dot{width:8px;height:8px;border-radius:50%;background:#22e07a;box-shadow:0 0 0 0 rgba(34,224,122,.6);animation:nk-ping 1.8s ease-out infinite;flex:0 0 auto}',
    '@keyframes nk-ping{0%{box-shadow:0 0 0 0 rgba(34,224,122,.55)}70%{box-shadow:0 0 0 9px rgba(34,224,122,0)}100%{box-shadow:0 0 0 0 rgba(34,224,122,0)}}',
    '.nk-agent-txt{transition:opacity .28s ease,transform .28s ease;opacity:1;transform:translateY(0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.nk-agent-txt.nk-out{opacity:0;transform:translateY(4px)}',
    '.nk-agent .nk-ok{color:#35d97f}',
    /* route graph */
    '#nk-route{margin:1.1rem 0 .2rem;border:1px solid var(--border);border-radius:12px;background:color-mix(in oklab,#050a07 55%,transparent);padding:.6rem .4rem .3rem;overflow:hidden}',
    '#nk-route .cap{font-family:var(--font-geist-mono),monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#8a9a90;padding:0 .6rem .1rem}',
    '#nk-route svg{display:block;width:100%;height:auto}',
    /* live price ticker */
    '#nk-ticker{position:fixed;left:0;right:0;bottom:0;height:34px;z-index:55;display:flex;align-items:center;overflow:hidden;',
      'background:color-mix(in oklab,#050a07 88%,transparent);border-top:1px solid color-mix(in oklab,#22e07a 30%,transparent);backdrop-filter:blur(8px);',
      '-webkit-mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent)}',
    '.nk-ticker-track{display:inline-flex;white-space:nowrap;animation:nk-tape 55s linear infinite;will-change:transform}',
    '#nk-ticker:hover .nk-ticker-track{animation-play-state:paused}',
    '@keyframes nk-tape{to{transform:translateX(-50%)}}',
    '.nk-set{display:inline-flex}',
    '.nk-tk{display:inline-flex;align-items:center;gap:.4rem;padding:0 1.1rem;font-family:var(--font-geist-mono),monospace;font-size:12px;color:#c2d6c9;border-right:1px solid color-mix(in oklab,#1e2a22 60%,transparent)}',
    '.nk-tk b{color:#eaf4ee;font-weight:700}',
    '.nk-tk i{font-style:normal;color:#aab4c2;transition:color .35s;font-variant-numeric:tabular-nums}',
    '.nk-tk u{text-decoration:none;font-size:11px;color:#6b7482;transition:color .35s}',
    '.nk-tk.nk-up i,.nk-tk.nk-up u{color:#37d67a}',
    '.nk-tk.nk-dn i,.nk-tk.nk-dn u{color:#ff6b6b}',
    /* intro boot loader */
    '#nk-intro{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:radial-gradient(62% 62% at 50% 42%,#061a10,#040a07 78%);transition:opacity .55s ease}',
    '#nk-intro.nk-out{opacity:0;pointer-events:none}',
    '.nk-intro-inner{width:min(90vw,440px);text-align:center}',
    '.nk-wm{font-family:Geist,ui-sans-serif,system-ui,sans-serif;font-weight:800;font-size:64px;letter-spacing:-2px;color:#eaf4ee;text-shadow:0 0 34px rgba(34,224,122,.6);animation:nk-wm 1.8s ease infinite alternate}',
    '@keyframes nk-wm{to{text-shadow:0 0 56px rgba(34,224,122,.95)}}',
    '.nk-sub{margin-top:-4px;font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:#22e07a;font-family:var(--font-geist-mono),monospace}',
    '.nk-boot{margin:24px auto 14px;text-align:left;min-height:104px;max-width:360px;font-family:var(--font-geist-mono),monospace;font-size:12.5px;line-height:2;color:#8a9a90}',
    '.nk-line{opacity:0;transform:translateY(4px);animation:nk-lineIn .25s ease forwards}',
    '@keyframes nk-lineIn{to{opacity:1;transform:none}}',
    '.nk-line .nk-gt{color:#22e07a;margin-right:.4rem}',
    '.nk-line .nk-dots{color:#2a6247}',
    '.nk-line .nk-ok{color:#37d67a;opacity:0;margin-left:.35rem;font-weight:700}',
    '.nk-line .nk-ok.on{opacity:1}',
    '.nk-bar{height:3px;border-radius:3px;max-width:360px;margin:0 auto;background:color-mix(in oklab,#22e07a 18%,transparent);overflow:hidden}',
    '.nk-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#22e07a,#7ff0b0);animation:nk-fill 2.4s cubic-bezier(.4,0,.2,1) forwards;box-shadow:0 0 12px rgba(34,224,122,.7)}',
    '@keyframes nk-fill{to{width:100%}}',
    '.nk-online{margin-top:18px;font-family:var(--font-geist-mono),monospace;font-size:13px;letter-spacing:.24em;color:#37d67a;opacity:0;transition:opacity .4s}',
    '.nk-online.on{opacity:1;animation:nk-blink 1s steps(1) infinite}',
    '@keyframes nk-blink{50%{opacity:.35}}',
    'body{padding-bottom:34px}',
    REDUCE ? '*{scroll-behavior:auto}' : ''
  ].join('\n');
  document.head.appendChild(css);

  function T(fn){ try { fn(); } catch (e) {} }

  // show the intro immediately (before hydration paints), covers content while booting
  T(function(){ intro(); });

  /* ---------- A. intro boot loader ---------- */
  function intro(){
    if (document.getElementById('nk-intro')) return;
    var ov = document.createElement('div');
    ov.id = 'nk-intro';
    ov.innerHTML = '<div class="nk-intro-inner">' +
      '<div class="nk-wm">NONE</div>' +
      '<div class="nk-sub">best-execution engine</div>' +
      '<div class="nk-boot"></div>' +
      '<div class="nk-bar"><i></i></div>' +
      '<div class="nk-online">● AI ONLINE</div>' +
      '</div>';
    (document.documentElement || document.body).appendChild(ov);
    function kill(){ ov.classList.add('nk-out'); setTimeout(function(){ if (ov.parentNode) ov.parentNode.removeChild(ov); }, 600); }
    if (REDUCE) { setTimeout(kill, 500); return; }
    var lines = ['initializing None core', 'connecting Robinhood Chain', 'loading Uniswap v2 · v3 · v4', 'arming best-route engine'];
    var boot = ov.querySelector('.nk-boot'), i = 0;
    function nextLine(){
      if (i >= lines.length) { finish(); return; }
      var l = document.createElement('div'); l.className = 'nk-line';
      l.innerHTML = '<span class="nk-gt">&gt;</span>' + lines[i] + ' <span class="nk-dots"></span><span class="nk-ok">ok</span>';
      boot.appendChild(l);
      setTimeout(function(){ l.querySelector('.nk-dots').textContent = ' ............'; }, 70);
      setTimeout(function(){ l.querySelector('.nk-ok').classList.add('on'); i++; nextLine(); }, 380);
    }
    function finish(){ ov.querySelector('.nk-online').classList.add('on'); setTimeout(kill, 620); }
    setTimeout(nextLine, 300);
    ov.addEventListener('click', kill);
    setTimeout(function(){ if (ov.parentNode) kill(); }, 6000); // safety
  }

  /* ---------- B. live price ticker ---------- */
  function mountTicker(){
    if (document.getElementById('nk-ticker')) return;
    var tokens = [['NVDA', 122.4], ['AAPL', 214.8], ['TSLA', 248.6], ['COIN', 251.3], ['ETH', 1831], ['AMZN', 178.2], ['GOOGL', 176.9], ['MSFT', 449.1], ['META', 512.7], ['BTC', 63120], ['USDG', 1.0]];
    function fmt(p){ return p >= 1000 ? Math.round(p).toLocaleString('en-US') : p.toFixed(2); }
    function buildSet(){
      var set = document.createElement('span'); set.className = 'nk-set';
      tokens.forEach(function (t) {
        var s = document.createElement('span'); s.className = 'nk-tk';
        s.innerHTML = '<b>' + t[0] + '</b> <i>' + fmt(t[1]) + '</i> <u></u>';
        set.appendChild(s);
      });
      return set;
    }
    var bar = document.createElement('div'); bar.id = 'nk-ticker';
    var track = document.createElement('div'); track.className = 'nk-ticker-track';
    track.appendChild(buildSet()); track.appendChild(buildSet());
    bar.appendChild(track);
    document.body.appendChild(bar);
    var state = {}; tokens.forEach(function (t) { state[t[0]] = { price: t[1], dir: 1 }; });
    var items = [].slice.call(bar.querySelectorAll('.nk-tk'));
    function tick(){
      tokens.forEach(function (t) {
        var sym = t[0], st = state[sym];
        if (sym === 'USDG') { st.price = 1 + (Math.random() * 0.002 - 0.001); st.dir = 0; st.pct = 0; }
        else { var chg = (Math.random() * 2 - 1) * 0.006; st.price *= (1 + chg); st.dir = chg >= 0 ? 1 : -1; st.pct = chg * 100; }
        items.forEach(function (el) {
          if (el.querySelector('b').textContent !== sym) return;
          el.querySelector('i').textContent = fmt(st.price);
          var u = el.querySelector('u');
          u.textContent = sym === 'USDG' ? '0.00%' : (st.dir > 0 ? '▲' : '▼') + Math.abs(st.pct).toFixed(2) + '%';
          el.classList.remove('nk-up', 'nk-dn');
          void el.offsetWidth;
          if (sym !== 'USDG') el.classList.add(st.dir > 0 ? 'nk-up' : 'nk-dn');
        });
      });
    }
    tick();
    if (!REDUCE) setInterval(tick, 1700);
  }

  /* ---------- 1. scroll progress ---------- */
  var progUpd = null;
  function mountProgress(){
    if (document.getElementById('nk-progress')) return;
    var bar = document.createElement('div');
    bar.id = 'nk-progress';
    document.body.appendChild(bar);
    var h = document.documentElement;
    progUpd = function(){ var max = h.scrollHeight - h.clientHeight; bar.style.transform = 'scaleX(' + (max > 0 ? (h.scrollTop / max) : 0) + ')'; };
    addEventListener('scroll', progUpd, { passive: true });
    addEventListener('resize', progUpd);
    progUpd();
  }

  /* ---------- 2. card cursor spotlight ---------- */
  function bindCards(){
    var cards = document.querySelectorAll(CARD_SEL);
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (c.__nkBound) continue;
      c.__nkBound = 1;
      if (REDUCE) continue;
      c.addEventListener('pointermove', function (e) {
        var r = this.getBoundingClientRect();
        this.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        this.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
      c.addEventListener('pointerleave', function () {
        this.style.setProperty('--mx', '-400px'); this.style.setProperty('--my', '-400px');
      });
    }
  }

  /* ---------- 3. robot: inline the SVG (so internal animations run) + cursor parallax ---------- */
  var robotParallaxBound = false;
  function inlineRobot(){
    var img = document.querySelector('img[src^="/robot-ai"]');
    if (!img || img.__nkSwapping) return;
    img.__nkSwapping = 1;
    var cls = img.getAttribute('class') || '';
    var src = img.getAttribute('src');
    fetch(src).then(function (r) { return r.text(); }).then(function (txt) {
      var svg = new DOMParser().parseFromString(txt, 'image/svg+xml').documentElement;
      if (!svg || svg.nodeName.toLowerCase() !== 'svg') { img.__nkSwapping = 0; return; }
      svg.setAttribute('data-nk-robot', '1');
      svg.setAttribute('class', cls);
      svg.style.aspectRatio = '460 / 580';
      svg.style.width = 'auto';
      var wrap = img.parentElement;
      img.replaceWith(svg);
      if (wrap) wrap.classList.add('nk-parallax');
      // the site's scroll-reveal wrapper can get stuck hidden (opacity:0/blur) — force it visible
      var a = svg;
      for (var k = 0; k < 6 && a; k++) {
        var cs = getComputedStyle(a);
        if (parseFloat(cs.opacity) < 1 || cs.filter.indexOf('blur') >= 0) {
          a.style.setProperty('opacity', '1', 'important');
          a.style.setProperty('filter', 'none', 'important');
        }
        a = a.parentElement;
      }
      bindRobotParallax();
    }).catch(function () { img.__nkSwapping = 0; });
  }
  function bindRobotParallax(){
    if (robotParallaxBound || REDUCE || !HOVER) return;
    var host = document.querySelector('svg[data-nk-robot]');
    var wrap = host && host.parentElement; if (!wrap) return;
    robotParallaxBound = true;
    addEventListener('pointermove', function (e) {
      var dx = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      var dy = (e.clientY - innerHeight / 2) / (innerHeight / 2);
      wrap.style.transform = 'perspective(1000px) translate3d(' + (dx * 12).toFixed(1) + 'px,' +
        (dy * 9).toFixed(1) + 'px,0) rotateX(' + (-dy * 6).toFixed(2) + 'deg) rotateY(' + (dx * 9).toFixed(2) + 'deg)';
    }, { passive: true });
    addEventListener('pointerleave', function () { wrap.style.transform = ''; });
  }
  function bindRobot(){
    // re-inline if React re-rendered the <img> back in
    if (!document.querySelector('svg[data-nk-robot]')) inlineRobot();
  }

  /* ---------- 4. agent response readout ---------- */
  var AGENT_MSGS = [
    'scanning venues — Uniswap v2 · v3 · v4',
    'quoting routes — direct & multi-hop',
    'best path: USDG → WETH → NVDA',
    '✓ settled in 1 tx · +0.22 NVDA vs naive'
  ];
  var agentIdx = 0, agentTimer = null;
  function findTerminal(){ return document.querySelector('[class*="shadow-2xl"][class*="rounded-2xl"]'); }
  function mountAgent(){
    var term = findTerminal();
    if (!term || document.getElementById('nk-agent')) return;
    var el = document.createElement('div');
    el.id = 'nk-agent'; el.className = 'nk-agent';
    el.innerHTML = '<span class="nk-dot"></span><span class="nk-agent-txt"></span>';
    term.insertAdjacentElement('afterend', el);
    var txt = el.querySelector('.nk-agent-txt');
    function render(){
      var m = AGENT_MSGS[agentIdx % AGENT_MSGS.length];
      txt.innerHTML = m.charAt(0) === '✓' ? '<span class="nk-ok">' + m + '</span>' : m;
    }
    render();
    if (REDUCE) return;
    if (agentTimer) clearInterval(agentTimer);
    agentTimer = setInterval(function () {
      txt.classList.add('nk-out');
      setTimeout(function () { agentIdx++; render(); txt.classList.remove('nk-out'); }, 300);
    }, 2600);
    // guard against React reconciliation removing our node
    var parent = term.parentElement;
    if (parent && !parent.__nkObs) {
      parent.__nkObs = 1;
      new MutationObserver(function () { if (!document.getElementById('nk-agent')) mountAgent(); }).observe(parent, { childList: true });
    }
  }

  /* ---------- 5. best-route visualizer ---------- */
  var ROUTE_SVG =
    '<div id="nk-route"><div class="cap">Best-route engine · live</div>' +
    '<svg viewBox="0 0 520 132" xmlns="http://www.w3.org/2000/svg" fill="none">' +
      '<defs><radialGradient id="nkg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e9fdf1"/><stop offset="1" stop-color="#22e07a" stop-opacity="0"/></radialGradient></defs>' +
      // direct (naive) edge - dim
      '<path d="M60 78 Q260 138 460 78" stroke="#20573c" stroke-width="2" stroke-dasharray="4 6" fill="none"/>' +
      '<text x="260" y="126" text-anchor="middle" font-family="var(--font-geist-mono),monospace" font-size="9" letter-spacing="1.5" fill="#5a6b60">NAIVE · DIRECT</text>' +
      // best hop path - bright animated flow
      '<path id="nkhop" d="M60 78 Q150 30 260 34 Q370 38 460 78" stroke="#22e07a" stroke-width="2.5" fill="none" opacity="0.9" stroke-dasharray="9 11">' +
        '<animate attributeName="stroke-dashoffset" from="0" to="-40" dur="1.1s" repeatCount="indefinite"/></path>' +
      '<path d="M60 78 Q150 30 260 34 Q370 38 460 78" stroke="#22e07a" stroke-width="8" fill="none" opacity="0.16"/>' +
      // travelling pulse
      '<circle r="9" fill="url(#nkg)"><animateMotion dur="2.6s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear"><mpath href="#nkhop"/></animateMotion></circle>' +
      '<circle r="3.5" fill="#e9fdf1"><animateMotion dur="2.6s" repeatCount="indefinite"><mpath href="#nkhop"/></animateMotion></circle>' +
      // nodes
      nodeSvg(60, 78, 'USDG') + nodeSvg(260, 34, 'WETH') + nodeSvg(460, 78, 'NVDA') +
      // best tag
      '<g opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="0.9s" fill="freeze"/>' +
        '<rect x="382" y="92" width="128" height="24" rx="12" fill="#22e07a" opacity="0.14"/>' +
        '<text x="446" y="108" text-anchor="middle" font-family="var(--font-geist-mono),monospace" font-weight="700" font-size="12" fill="#7ff0b0">+0.22 NVDA</text></g>' +
    '</svg></div>';
  function nodeSvg(x, y, label){
    return '<circle cx="' + x + '" cy="' + y + '" r="21" fill="#0a120d" stroke="#22e07a" stroke-width="1.5"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="21" fill="none" stroke="#22e07a" stroke-width="1.5" opacity="0.5"><animate attributeName="r" values="21;27;21" dur="2.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0.5" dur="2.6s" repeatCount="indefinite"/></circle>' +
      '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-family="var(--font-geist-mono),monospace" font-weight="700" font-size="11" fill="#dcf7e8">' + label + '</text>';
  }
  function mountRoute(){
    if (document.getElementById('nk-route')) return;
    var naive = null, spans = document.querySelectorAll('span');
    for (var i = 0; i < spans.length; i++) { if (spans[i].textContent.trim() === 'Naive swap') { naive = spans[i]; break; } }
    if (!naive) return;
    var box = naive.closest('[class*="rounded-xl"]');
    if (!box) return;
    box.insertAdjacentHTML('afterend', ROUTE_SVG);
  }

  /* ---------- 6. count-up numbers ---------- */
  function animNum(el){
    if (el.__nk) return; el.__nk = 1;
    var raw = el.textContent.trim();
    var m = raw.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
    if (!m) return;
    if (REDUCE) return;
    var pre = m[1], target = parseFloat(m[2]), post = m[3], dec = (m[2].split('.')[1] || '').length, start = null, dur = 1200;
    function step(ts){
      if (!start) start = ts;
      var t = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - t, 3), v = target * e;
      el.textContent = pre + (dec ? v.toFixed(dec) : Math.round(v)) + post;
      if (t < 1) requestAnimationFrame(step); else el.textContent = raw;
    }
    requestAnimationFrame(step);
  }

  /* ---------- 7. glitch / scramble headings ---------- */
  var GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&/<>{}';
  function scramble(el){
    if (el.__nk || REDUCE) return; el.__nk = 1;
    var orig = el.textContent, len = orig.length, frame = 0, total = Math.max(16, Math.round(len * 1.2));
    function tick(){
      var locked = Math.floor(len * (frame / total)), s = '';
      for (var i = 0; i < len; i++) {
        var c = orig[i];
        s += (c === ' ') ? ' ' : (i < locked ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]);
      }
      el.textContent = s; frame++;
      if (frame <= total) setTimeout(tick, 26); else el.textContent = orig;
    }
    tick();
  }

  /* ---------- 8. magnetic CTAs ---------- */
  function bindMagnetic(){
    if (!HOVER || REDUCE) return;
    var btns = document.querySelectorAll('a.bg-accent, button.bg-accent');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i]; if (b.__nkMag) continue; b.__nkMag = 1;
      b.addEventListener('pointermove', function (e) {
        var r = this.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) / r.width;
        var y = (e.clientY - (r.top + r.height / 2)) / r.height;
        this.style.transform = 'translate(' + (x * 9).toFixed(1) + 'px,' + (y * 9).toFixed(1) + 'px) scale(1.05)';
      });
      b.addEventListener('pointerleave', function () { this.style.transform = ''; });
    }
  }

  /* ---------- 0. reveal-fix: the site's scroll-reveal can stall in some engines ---------- */
  var revealIO = null;
  function revealFix(){
    var els = document.querySelectorAll('[style*="cubic-bezier(0.16,1,0.3,1)"]');
    if (!els.length) return;
    function show(el){ el.style.opacity = '1'; el.style.filter = 'none'; el.style.transform = 'none'; }
    if (REDUCE || !('IntersectionObserver' in window)) { els.forEach(show); return; }
    if (!revealIO) revealIO = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { show(en.target); revealIO.unobserve(en.target); } });
    }, { threshold: 0.06, rootMargin: '0px 0px -4% 0px' });
    els.forEach(function (el) { if (!el.__nkRev) { el.__nkRev = 1; revealIO.observe(el); } });
  }

  /* ---------- observers for on-scroll triggers ---------- */
  function setupObservers(){
    if (!('IntersectionObserver' in window)) {
      // fallback: just run immediately
      document.querySelectorAll('[class*="text-4xl"][class*="text-accent"]').forEach(animNum);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        if (el.__type === 'num') animNum(el);
        else if (el.__type === 'glitch') scramble(el);
      });
    }, { threshold: 0.4 });

    // count-up: hero stats
    document.querySelectorAll('[class*="text-4xl"][class*="text-accent"]').forEach(function (el) { el.__type = 'num'; io.observe(el); });
    // count-up: naive/route numbers
    document.querySelectorAll('span.font-mono.font-semibold, span[class*="font-mono"][class*="font-semibold"]').forEach(function (el) {
      if (/NVDA\s*$/.test(el.textContent)) { el.__type = 'num'; io.observe(el); }
    });
    // glitch: accent fragments of big headings
    document.querySelectorAll('h1 .text-accent, h2 .text-accent').forEach(function (el) { el.__type = 'glitch'; io.observe(el); });
  }

  /* ---------- init ---------- */
  function init(){
    T(revealFix); T(mountProgress); T(mountTicker); T(bindCards); T(bindRobot); T(mountAgent); T(mountRoute); T(bindMagnetic); T(setupObservers);
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
  // re-run after hydration settles (React may reconcile away pre-hydration nodes / re-hide reveals)
  [700, 1600, 3200].forEach(function (d) { setTimeout(function () { T(revealFix); T(mountProgress); T(mountTicker); T(bindCards); T(bindRobot); T(mountAgent); T(mountRoute); T(bindMagnetic); }, d); });
})();
