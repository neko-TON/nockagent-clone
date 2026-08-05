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
      'background:linear-gradient(90deg,#3b6dff,#8fa8ff);box-shadow:0 0 12px rgba(59,109,255,.7);z-index:60;pointer-events:none;transition:transform .08s linear}',
    'img[src^="/robot-ai.svg"]{transition:filter .3s ease}',
    '.nk-parallax{transition:transform .35s cubic-bezier(.16,1,.3,1);transform-style:preserve-3d;will-change:transform}',
    /* agent readout */
    '.nk-agent{display:flex;align-items:center;gap:.6rem;margin:.9rem auto 0;max-width:44rem;padding:.6rem .9rem;',
      'border:1px solid color-mix(in oklab,#3b6dff 28%,transparent);border-radius:12px;',
      'background:color-mix(in oklab,#0d0f1a 75%,transparent);backdrop-filter:blur(6px);',
      'font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:12.5px;color:#8a97a0;',
      'box-shadow:0 10px 30px -18px rgba(59,109,255,.6)}',
    '.nk-dot{width:8px;height:8px;border-radius:50%;background:#3b6dff;box-shadow:0 0 0 0 rgba(59,109,255,.6);animation:nk-ping 1.8s ease-out infinite;flex:0 0 auto}',
    '@keyframes nk-ping{0%{box-shadow:0 0 0 0 rgba(59,109,255,.55)}70%{box-shadow:0 0 0 9px rgba(59,109,255,0)}100%{box-shadow:0 0 0 0 rgba(59,109,255,0)}}',
    '.nk-agent-txt{transition:opacity .28s ease,transform .28s ease;opacity:1;transform:translateY(0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.nk-agent-txt.nk-out{opacity:0;transform:translateY(4px)}',
    '.nk-agent .nk-ok{color:#4f7bff}',
    /* route graph */
    '#nk-route{margin:1.1rem 0 .2rem;border:1px solid var(--border);border-radius:12px;background:color-mix(in oklab,#060713 55%,transparent);padding:.6rem .4rem .3rem;overflow:hidden}',
    '#nk-route .cap{font-family:var(--font-geist-mono),monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#8a97a0;padding:0 .6rem .1rem}',
    '#nk-route svg{display:block;width:100%;height:auto}',
    REDUCE ? '*{scroll-behavior:auto}' : ''
  ].join('\n');
  document.head.appendChild(css);

  function T(fn){ try { fn(); } catch (e) {} }

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
      '<defs><radialGradient id="nkg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#eaf1ff"/><stop offset="1" stop-color="#3b6dff" stop-opacity="0"/></radialGradient></defs>' +
      // direct (naive) edge - dim
      '<path d="M60 78 Q260 138 460 78" stroke="#2c3d6b" stroke-width="2" stroke-dasharray="4 6" fill="none"/>' +
      '<text x="260" y="126" text-anchor="middle" font-family="var(--font-geist-mono),monospace" font-size="9" letter-spacing="1.5" fill="#5b6472">NAIVE · DIRECT</text>' +
      // best hop path - bright animated flow
      '<path id="nkhop" d="M60 78 Q150 30 260 34 Q370 38 460 78" stroke="#3b6dff" stroke-width="2.5" fill="none" opacity="0.9" stroke-dasharray="9 11">' +
        '<animate attributeName="stroke-dashoffset" from="0" to="-40" dur="1.1s" repeatCount="indefinite"/></path>' +
      '<path d="M60 78 Q150 30 260 34 Q370 38 460 78" stroke="#3b6dff" stroke-width="8" fill="none" opacity="0.16"/>' +
      // travelling pulse
      '<circle r="9" fill="url(#nkg)"><animateMotion dur="2.6s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear"><mpath href="#nkhop"/></animateMotion></circle>' +
      '<circle r="3.5" fill="#eaf1ff"><animateMotion dur="2.6s" repeatCount="indefinite"><mpath href="#nkhop"/></animateMotion></circle>' +
      // nodes
      nodeSvg(60, 78, 'USDG') + nodeSvg(260, 34, 'WETH') + nodeSvg(460, 78, 'NVDA') +
      // best tag
      '<g opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="0.9s" fill="freeze"/>' +
        '<rect x="382" y="92" width="128" height="24" rx="12" fill="#3b6dff" opacity="0.14"/>' +
        '<text x="446" y="108" text-anchor="middle" font-family="var(--font-geist-mono),monospace" font-weight="700" font-size="12" fill="#8fa8ff">+0.22 NVDA</text></g>' +
    '</svg></div>';
  function nodeSvg(x, y, label){
    return '<circle cx="' + x + '" cy="' + y + '" r="21" fill="#0d0f1a" stroke="#3b6dff" stroke-width="1.5"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="21" fill="none" stroke="#3b6dff" stroke-width="1.5" opacity="0.5"><animate attributeName="r" values="21;27;21" dur="2.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0.5" dur="2.6s" repeatCount="indefinite"/></circle>' +
      '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-family="var(--font-geist-mono),monospace" font-weight="700" font-size="11" fill="#dfe8ff">' + label + '</text>';
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
    T(revealFix); T(mountProgress); T(bindCards); T(bindRobot); T(mountAgent); T(mountRoute); T(bindMagnetic); T(setupObservers);
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
  // re-run after hydration settles (React may reconcile away pre-hydration nodes / re-hide reveals)
  [700, 1600, 3200].forEach(function (d) { setTimeout(function () { T(revealFix); T(mountProgress); T(bindCards); T(bindRobot); T(mountAgent); T(mountRoute); T(bindMagnetic); }, d); });
})();
