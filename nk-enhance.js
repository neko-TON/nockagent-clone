/* ============================================================
   None — minimal support layer.
   Only three jobs, all of them functional rather than decorative:
     1. un-stick the site's scroll-reveal when its observer stalls
     2. inline the mascot SVG so it renders at all
     3. draw the route diagram that explains the product
   ============================================================ */
(function () {
  if (window.__nkEnhance) return;
  window.__nkEnhance = 1;

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function T(fn) { try { fn(); } catch (e) {} }

  var css = document.createElement('style');
  css.id = 'nk-enhance-2';
  css.textContent = [
    '#nk-route{margin:1.25rem 0 .25rem;border:1px solid var(--border);border-radius:10px;',
      'background:rgba(16,16,16,.5);padding:.85rem .5rem .3rem}',
    '#nk-route .cap{font-family:var(--font-geist-mono),monospace;font-size:10px;letter-spacing:.18em;',
      'text-transform:uppercase;color:var(--muted);padding:0 .7rem .5rem}',
    '#nk-route svg{display:block;width:100%;height:auto}'
  ].join('\n');
  document.head.appendChild(css);

  /* 1. reveal-fix ---------------------------------------------------- */
  var revealIO = null;
  function revealFix() {
    var els = document.querySelectorAll('[style*="cubic-bezier(0.16,1,0.3,1)"]');
    if (!els.length) return;
    function show(el) { el.style.opacity = '1'; el.style.filter = 'none'; el.style.transform = 'none'; }
    if (REDUCE || !('IntersectionObserver' in window)) { [].forEach.call(els, show); return; }
    if (!revealIO) revealIO = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { show(en.target); revealIO.unobserve(en.target); } });
    }, { threshold: 0.06, rootMargin: '0px 0px -4% 0px' });
    [].forEach.call(els, function (el) { if (!el.__nkRev) { el.__nkRev = 1; revealIO.observe(el); } });
  }

  /* 2. inline the mascot ---------------------------------------------- */
  function inlineMascot() {
    var img = document.querySelector('img[src^="/mascot-unicorn"]');
    if (!img || img.__nkSwapping) return;
    img.__nkSwapping = 1;
    var cls = img.getAttribute('class') || '';
    fetch(img.getAttribute('src')).then(function (r) { return r.text(); }).then(function (txt) {
      var svg = new DOMParser().parseFromString(txt, 'image/svg+xml').documentElement;
      if (!svg || svg.nodeName.toLowerCase() !== 'svg') { img.__nkSwapping = 0; return; }
      svg.setAttribute('data-nk-mascot', '1');
      svg.setAttribute('class', cls);
      svg.style.aspectRatio = '483 / 462';
      svg.style.width = 'auto';
      img.replaceWith(svg);
      strike(svg);
      // the site's reveal wrapper can leave the hero hidden
      var a = svg;
      for (var k = 0; k < 6 && a; k++) {
        var cs = getComputedStyle(a);
        if (parseFloat(cs.opacity) < 1 || cs.filter.indexOf('blur') >= 0) {
          a.style.setProperty('opacity', '1', 'important');
          a.style.setProperty('filter', 'none', 'important');
        }
        a = a.parentElement;
      }
    }).catch(function () { img.__nkSwapping = 0; });
  }
  function mascot() { if (!document.querySelector('svg[data-nk-mascot]')) inlineMascot(); }

  /* 2b. the strike runs on its own clock ------------------------------ */
  // Coin fan: launch angle in degrees (0 = right), reach, arc height, spin.
  var COINS = [
    { a: -22, d: 150, rise: 120, spin:  400 }, { a: -50, d: 112, rise: 150, spin: -330 },
    { a: -78, d: 74,  rise: 172, spin:  460 }, { a: -108, d: 86, rise: 158, spin: -420 },
    { a: -138, d: 122, rise: 128, spin:  360 }, { a: -160, d: 156, rise: 96, spin: -300 }
  ];
  var HOOF_X = 381, HOOF_Y = 424;
  // Equine foreleg: elbow stays put, the knee and fetlock carry the movement.
  // Gathered, the cannon folds up and forward; planted, the column is straight.
  var UP   = { kx: 394, ky: 300, fx: 408, fy: 338, hx: 410, hy: 354 };
  var DOWN = { kx: 378, ky: 330, fx: 380, fy: 396, hx: 381, hy: 412 };
  var CYCLE = 2800;                                    // ms per paw

  // beats of one cycle, as fractions
  var T_RISE = 0.30, T_HIT = 0.38, T_SETTLE = 0.52, T_COINS_END = 0.94;

  function easeOut(x){ return 1 - Math.pow(1 - x, 3); }
  function easeIn(x){ return x * x * x; }

  function strike(svg) {
    var leg = svg.querySelector('#nk-leg');
    if (!leg || leg.__nkStrike) return;
    leg.__nkStrike = 1;

    var fore    = svg.querySelector('#nk-leg .nk-leg-fore');
    var cannon  = svg.querySelector('#nk-leg .nk-leg-cannon');
    var pastern = svg.querySelector('#nk-leg .nk-leg-pastern');
    var knee    = svg.querySelector('#nk-leg .nk-leg-knee');
    var fet     = svg.querySelector('#nk-leg .nk-leg-fet');
    var hoof  = svg.querySelector('#nk-hoof');
    var rig   = svg.querySelector('#nk-rig');
    var dust  = svg.querySelector('#nk-dust');
    var flash = svg.querySelector('#nk-impact');
    var coins = svg.querySelectorAll('#nk-coins .nk-coin');

    function place(t) {
      // ---- the limb: gather slowly, strike fast ----
      var lift;
      if (t < T_RISE)      lift = easeOut(t / T_RISE);              // draw it up
      else if (t < T_HIT)  lift = 1 - easeIn((t - T_RISE) / (T_HIT - T_RISE));  // snap down
      else                 lift = 0;                                // planted
      function mix(a, b) { return b + (a - b) * lift; }
      var kx = mix(UP.kx, DOWN.kx), ky = mix(UP.ky, DOWN.ky);
      var fx = mix(UP.fx, DOWN.fx), fy = mix(UP.fy, DOWN.fy);
      var hx = mix(UP.hx, DOWN.hx), hy = mix(UP.hy, DOWN.hy);
      if (fore)    fore.setAttribute('d', 'M372 260 L' + kx.toFixed(1) + ' ' + ky.toFixed(1));
      if (cannon)  cannon.setAttribute('d', 'M' + kx.toFixed(1) + ' ' + ky.toFixed(1) + ' L' + fx.toFixed(1) + ' ' + fy.toFixed(1));
      if (pastern) pastern.setAttribute('d', 'M' + fx.toFixed(1) + ' ' + fy.toFixed(1) + ' L' + hx.toFixed(1) + ' ' + hy.toFixed(1));
      if (knee) { knee.setAttribute('cx', kx.toFixed(1)); knee.setAttribute('cy', ky.toFixed(1)); }
      if (fet)  { fet.setAttribute('cx', fx.toFixed(1)); fet.setAttribute('cy', fy.toFixed(1)); }
      if (hoof) hoof.setAttribute('transform', 'translate(' + hx.toFixed(1) + ' ' + hy.toFixed(1) + ')');

      // ---- the body answers the blow: a short dip, then it springs back ----
      var jolt = 0;
      if (t >= T_HIT && t < T_SETTLE) {
        var j = (t - T_HIT) / (T_SETTLE - T_HIT);
        jolt = Math.sin(j * Math.PI) * 5;              // down and back in one arc
      } else if (t < T_HIT && t > T_RISE) {
        jolt = -1.5 * ((t - T_RISE) / (T_HIT - T_RISE));   // a touch of lift on the wind-up
      }
      if (rig) rig.setAttribute('transform', 'translate(0 ' + jolt.toFixed(2) + ')');

      // ---- contact: flash and a ring of dust ----
      var hit = (t < T_HIT) ? 0 : Math.max(0, 1 - (t - T_HIT) / 0.14);
      if (flash) flash.setAttribute('opacity', (hit * 0.95).toFixed(3));
      if (dust) {
        var dt = (t < T_HIT) ? 0 : Math.min(1, (t - T_HIT) / 0.30);
        dust.setAttribute('rx', (30 + dt * 62).toFixed(1));
        dust.setAttribute('ry', (8 + dt * 12).toFixed(1));
        dust.setAttribute('opacity', (dt > 0 ? (1 - dt) * 0.55 : 0).toFixed(3));
      }

      // ---- coins: a real throw, up and back down, fading as they drop ----
      var ct = (t - T_HIT) / (T_COINS_END - T_HIT);
      ct = Math.max(0, Math.min(1, ct));
      for (var i = 0; i < coins.length; i++) {
        var c = COINS[i % COINS.length];
        var rad = c.a * Math.PI / 180;
        var out = easeOut(ct);                                   // outward travel decelerates
        var x = HOOF_X + Math.cos(rad) * c.d * out;
        var y = HOOF_Y + Math.sin(rad) * c.d * out * 0.5 - c.rise * (4 * ct * (1 - ct));
        var sc = Math.min(1, ct * 6);
        var op = ct <= 0 ? 0 : Math.min(1, ct * 8) * (ct > 0.72 ? Math.max(0, 1 - (ct - 0.72) / 0.28) : 1);
        coins[i].setAttribute('transform',
          'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (ct * c.spin).toFixed(0) + ') scale(' + sc.toFixed(3) + ')');
        coins[i].setAttribute('opacity', op.toFixed(3));
      }
    }

    if (REDUCE) { place(0.55); return; }   // planted, coins mid-air, nothing moving

    // No scroll binding: the paw runs on its own clock, and only while the
    // mascot is actually on screen.
    var raf = null, t0 = null, running = false;
    function frame(ts) {
      if (!running) { raf = null; return; }
      if (t0 === null) t0 = ts;
      place(((ts - t0) % CYCLE) / CYCLE);
      raf = requestAnimationFrame(frame);
    }
    function run(on) {
      if (on === running) return;
      running = on;
      if (on) { t0 = null; raf = requestAnimationFrame(frame); }
      else if (raf) { cancelAnimationFrame(raf); raf = null; }
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { run(e[0].isIntersecting); }, { threshold: 0 }).observe(svg);
    } else { run(true); }
    place(0);
  }

  /* 3. route diagram -------------------------------------------------- */
  function node(x, y, label) {
    return '<circle cx="' + x + '" cy="' + y + '" r="20" fill="#1f1f1f" stroke="#622a4a" stroke-width="1.5"/>' +
      '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-family="var(--font-geist-mono),monospace" ' +
      'font-size="11" fill="#d4d4d4">' + label + '</text>';
  }
  var ROUTE =
    '<div id="nk-route"><div class="cap">Route comparison</div>' +
    '<svg viewBox="0 0 520 118" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M60 72 Q260 118 460 72" stroke="#572040" stroke-width="1.5" stroke-dasharray="4 5" fill="none"/>' +
      '<text x="260" y="112" text-anchor="middle" font-family="var(--font-geist-mono),monospace" font-size="9" ' +
        'letter-spacing="1.2" fill="#6e6e6e">DIRECT</text>' +
      '<path d="M60 72 Q150 32 260 32 Q370 32 460 72" stroke="#ff37c7" stroke-width="2" fill="none"/>' +
      '<text x="260" y="20" text-anchor="middle" font-family="var(--font-geist-mono),monospace" font-size="9" ' +
        'letter-spacing="1.2" fill="#fc72ff">ROUTED · +0.22 NVDA</text>' +
      node(60, 72, 'USDG') + node(260, 32, 'WETH') + node(460, 72, 'NVDA') +
    '</svg></div>';

  function mountRoute() {
    if (document.getElementById('nk-route')) return;
    var naive = null, spans = document.querySelectorAll('span');
    for (var i = 0; i < spans.length; i++) { if (spans[i].textContent.trim() === 'Naive swap') { naive = spans[i]; break; } }
    var box = naive && naive.closest('[class*="rounded-xl"]');
    if (box) box.insertAdjacentHTML('afterend', ROUTE);
  }

  function boot() { T(revealFix); T(mascot); T(mountRoute); }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
  [700, 1800, 3400].forEach(function (d) { setTimeout(boot, d); });
})();
