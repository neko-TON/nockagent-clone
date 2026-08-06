/* ============================================================
   None — visual FX layer
   Matrix rain, cursor aura, 3D card tilt, heading shine,
   click ripples, robot scan beam, film grain.
   Additive, idempotent, respects prefers-reduced-motion.
   ============================================================ */
(function () {
  if (window.__nkFx) return;
  window.__nkFx = 1;

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOVER = !window.matchMedia || window.matchMedia('(hover:hover)').matches;
  var CARD_SEL = '[class*="rounded-2xl"][class*="border-border"][class*="bg-surface"],' +
                 '[class*="rounded-3xl"][class*="border-border"][class*="bg-surface"]';
  function T(fn) { try { fn(); } catch (e) {} }

  /* ---------------- styles ---------------- */
  var css = document.createElement('style');
  css.id = 'nk-fx-css';
  css.textContent = [
    /* matrix rain canvas */
    '#nk-rain{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.16;',
      '-webkit-mask-image:linear-gradient(180deg,#000 0%,#000 55%,transparent 92%);',
      'mask-image:linear-gradient(180deg,#000 0%,#000 55%,transparent 92%)}',
    /* cursor aura */
    '#nk-aura{position:fixed;inset:0;pointer-events:none;z-index:1;opacity:0;transition:opacity .5s ease;',
      'background:radial-gradient(340px circle at var(--ax,-500px) var(--ay,-500px),rgba(34,224,122,.07),transparent 70%)}',
    '#nk-aura.on{opacity:1}',
    /* film grain */
    '#nk-grain{position:fixed;inset:-120%;pointer-events:none;z-index:2;opacity:.028;',
      'background-image:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'.85\' numOctaves=\'3\'/></filter><rect width=\'160\' height=\'160\' filter=\'url(%23n)\'/></svg>");',
      'animation:nk-grain 900ms steps(3) infinite}',
    '@keyframes nk-grain{0%{transform:translate(0,0)}33%{transform:translate(-3%,2%)}66%{transform:translate(2%,-3%)}100%{transform:translate(0,0)}}',
    /* 3D tilt cards — JS drives the whole transform */
    '.nk-tilt{transform-style:preserve-3d;will-change:transform}',
    '.nk-tilt:hover{transform:none}',
    /* heading shine sweep — invisible unless the sweep is running */
    '.nk-shine{position:relative}',
    '.nk-shine::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0;',
      'background:linear-gradient(105deg,transparent 44%,rgba(190,255,220,.42) 50%,transparent 56%);',
      'background-size:260% 100%;background-position:170% 0;mix-blend-mode:screen}',
    '.nk-shine.go::after{animation:nk-shine 1.35s cubic-bezier(.4,0,.2,1) forwards}',
    '@keyframes nk-shine{0%{background-position:170% 0;opacity:0}',
      '12%{opacity:1}82%{opacity:1}100%{background-position:-70% 0;opacity:0}}',
    /* click ripple */
    '.nk-rip{position:absolute;border-radius:50%;transform:translate(-50%,-50%) scale(0);pointer-events:none;',
      'background:radial-gradient(circle,rgba(255,255,255,.55),transparent 68%);animation:nk-rip .62s ease-out forwards}',
    '@keyframes nk-rip{to{transform:translate(-50%,-50%) scale(1);opacity:0}}',
    /* eyebrow letter drift */
    '.nk-eb span{display:inline-block;opacity:0;transform:translateY(6px);transition:opacity .4s ease,transform .4s cubic-bezier(.16,1,.3,1)}',
    '.nk-eb.in span{opacity:1;transform:none}',
    /* robot scan beam */
    '#nk-scanwrap{position:relative}',
    '#nk-scan{position:absolute;left:0;right:0;height:26%;pointer-events:none;z-index:3;border-radius:50%;',
      'background:linear-gradient(180deg,transparent,rgba(34,224,122,.18),transparent);',
      'filter:blur(3px);animation:nk-scan 4.2s ease-in-out infinite}',
    '@keyframes nk-scan{0%{top:-26%;opacity:0}12%{opacity:1}88%{opacity:1}100%{top:100%;opacity:0}}',
    /* pulse ring behind CTAs */
    '.nk-pulse{position:relative}',
    '.nk-pulse::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;',
      'box-shadow:0 0 0 0 rgba(34,224,122,.45);animation:nk-cta 2.8s ease-out infinite}',
    '@keyframes nk-cta{0%{box-shadow:0 0 0 0 rgba(34,224,122,.45)}70%{box-shadow:0 0 0 14px rgba(34,224,122,0)}100%{box-shadow:0 0 0 0 rgba(34,224,122,0)}}',
    REDUCE ? '#nk-rain,#nk-grain,#nk-scan{display:none}.nk-pulse::after{animation:none}.nk-eb span{opacity:1;transform:none}' : ''
  ].join('\n');
  document.head.appendChild(css);

  /* ---------------- 1. matrix rain in the hero ---------------- */
  function matrixRain() {
    if (REDUCE || document.getElementById('nk-rain')) return;
    var hero = document.querySelector('section[class*="pt-28"]');
    if (!hero) return;
    if (getComputedStyle(hero).position === 'static') hero.style.position = 'relative';
    var cv = document.createElement('canvas');
    cv.id = 'nk-rain';
    hero.insertBefore(cv, hero.firstChild);
    var ctx = cv.getContext('2d');
    var GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF$¥∑≡';
    var cols = [], fs = 15, dpr = Math.min(devicePixelRatio || 1, 2), w = 0, h = 0, running = true;

    function size() {
      var r = hero.getBoundingClientRect();
      w = Math.max(1, r.width | 0); h = Math.max(1, r.height | 0);
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.ceil(w / fs);
      cols = [];
      for (var i = 0; i < n; i++) cols.push(Math.random() * -60);
    }
    size();
    addEventListener('resize', size);

    var last = 0;
    function draw(ts) {
      if (!running) return;
      requestAnimationFrame(draw);
      if (ts - last < 55) return;   // ~18fps: cheap and looks right
      last = ts;
      ctx.fillStyle = 'rgba(5,10,7,.10)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = fs + 'px var(--font-geist-mono), monospace';
      for (var i = 0; i < cols.length; i++) {
        var y = cols[i] * fs;
        if (y > 0 && y < h) {
          var ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
          ctx.fillStyle = 'rgba(190,255,220,.85)';
          ctx.fillText(ch, i * fs, y);
          ctx.fillStyle = 'rgba(34,224,122,.55)';
          ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], i * fs, y - fs);
        }
        cols[i] += 0.5;
        if (y > h && Math.random() > 0.975) cols[i] = Math.random() * -30;
      }
    }
    requestAnimationFrame(draw);
    // pause when the hero scrolls away
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        var vis = e[0].isIntersecting;
        if (vis && !running) { running = true; requestAnimationFrame(draw); }
        running = vis;
      }, { threshold: 0 }).observe(hero);
    }
  }

  /* ---------------- 2. cursor aura ---------------- */
  function aura() {
    if (REDUCE || !HOVER || document.getElementById('nk-aura')) return;
    var a = document.createElement('div'); a.id = 'nk-aura';
    document.body.appendChild(a);
    addEventListener('pointermove', function (e) {
      a.classList.add('on');
      a.style.setProperty('--ax', e.clientX + 'px');
      a.style.setProperty('--ay', e.clientY + 'px');
    }, { passive: true });
    addEventListener('pointerleave', function () { a.classList.remove('on'); });
  }

  /* ---------------- 3. film grain ---------------- */
  function grain() {
    if (REDUCE || document.getElementById('nk-grain')) return;
    var g = document.createElement('div'); g.id = 'nk-grain';
    document.body.appendChild(g);
  }

  /* ---------------- 4. 3D card tilt ---------------- */
  function tilt() {
    if (REDUCE || !HOVER) return;
    var cards = document.querySelectorAll(CARD_SEL);
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (c.__nkTilt) continue;
      c.__nkTilt = 1;
      c.classList.add('nk-tilt');
      c.addEventListener('pointermove', function (e) {
        var r = this.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        this.style.transform = 'perspective(900px) rotateX(' + (-py * 5).toFixed(2) + 'deg) rotateY(' +
          (px * 6).toFixed(2) + 'deg) translateY(-5px) scale(1.008)';
      });
      c.addEventListener('pointerleave', function () { this.style.transform = ''; });
    }
  }

  /* ---------------- 5. heading shine on reveal ---------------- */
  function shine() {
    if (REDUCE || !('IntersectionObserver' in window)) return;
    var hs = document.querySelectorAll('h1, h2');
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        en.target.classList.add('nk-shine');
        setTimeout(function () { en.target.classList.add('go'); }, 180);
      });
    }, { threshold: 0.5 });
    for (var i = 0; i < hs.length; i++) {
      if (hs[i].__nkShine) continue;
      hs[i].__nkShine = 1;
      io.observe(hs[i]);
    }
  }

  /* ---------------- 6. click ripple ---------------- */
  function ripples() {
    if (REDUCE || document.__nkRip) return;
    document.__nkRip = 1;
    document.addEventListener('pointerdown', function (e) {
      var t = e.target.closest && e.target.closest('a.bg-accent, button.bg-accent, .nk-cta, .btn, .chip, .nk-qh');
      if (!t) return;
      var r = t.getBoundingClientRect();
      var d = Math.max(r.width, r.height) * 2;
      if (getComputedStyle(t).position === 'static') t.style.position = 'relative';
      t.style.overflow = 'hidden';
      var s = document.createElement('span');
      s.className = 'nk-rip';
      s.style.width = s.style.height = d + 'px';
      s.style.left = (e.clientX - r.left) + 'px';
      s.style.top = (e.clientY - r.top) + 'px';
      t.appendChild(s);
      setTimeout(function () { s.remove(); }, 650);
    }, { passive: true });
  }

  /* ---------------- 7. eyebrow letter drift ---------------- */
  function eyebrows() {
    if (REDUCE || !('IntersectionObserver' in window)) return;
    var els = document.querySelectorAll('[class*="tracking-[0.25em]"], .eyebrow');
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        en.target.classList.add('in');
      });
    }, { threshold: 0.6 });
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.__nkEb || !el.textContent.trim()) continue;
      el.__nkEb = 1;
      var txt = el.textContent, html = '';
      for (var j = 0; j < txt.length; j++) {
        var ch = txt[j] === ' ' ? '&nbsp;' : txt[j];
        html += '<span style="transition-delay:' + (j * 22) + 'ms">' + ch + '</span>';
      }
      el.innerHTML = html;
      el.classList.add('nk-eb');
      io.observe(el);
    }
  }

  /* ---------------- 8. robot scan beam ---------------- */
  function scanBeam() {
    if (REDUCE) return;
    var svg = document.querySelector('svg[data-nk-robot]');
    var host = svg && svg.parentElement;
    if (!host || document.getElementById('nk-scan')) return;
    host.id = host.id || 'nk-scanwrap';
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var s = document.createElement('div'); s.id = 'nk-scan';
    host.appendChild(s);
  }

  /* ---------------- 9. pulse ring on the primary CTA ---------------- */
  function ctaPulse() {
    if (REDUCE) return;
    var cta = document.querySelector('a.bg-accent[href="/app"]');
    if (cta && !cta.__nkPulse) { cta.__nkPulse = 1; cta.classList.add('nk-pulse'); }
  }

  function boot() {
    T(matrixRain); T(aura); T(grain); T(tilt); T(shine); T(ripples); T(eyebrows); T(scanBeam); T(ctaPulse);
  }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
  [900, 2200, 4000].forEach(function (d) { setTimeout(boot, d); });
})();
