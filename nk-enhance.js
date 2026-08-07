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
      svg.style.aspectRatio = '560 / 440';
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

  /* 2b. the strike plays out as the page scrolls --------------------- */
  // Coin fan: angle in degrees (0 = right), reach, and how high it arcs.
  var COINS = [
    { a: -18, d: 128, rise: 74 }, { a: -46, d: 96,  rise: 96 },
    { a: -72, d: 66,  rise: 112 }, { a: -104, d: 74, rise: 100 },
    { a: -134, d: 104, rise: 78 }, { a: -158, d: 132, rise: 56 }
  ];
  var HOOF_X = 391, HOOF_Y = 386;
  // Two poses for the striking leg. A plain rotation swung the whole leg
  // forward like a kick; interpolating the knee and hoof bends it instead,
  // which is what a paw-and-stomp actually looks like.
  var UP   = { kx: 366, ky: 300, hx: 370, hy: 336 };
  var DOWN = { kx: 372, ky: 322, hx: 390, hy: 380 };

  function strike(svg) {
    var leg = svg.querySelector('#nk-leg');
    if (!leg || leg.__nkStrike) return;
    leg.__nkStrike = 1;
    var legPaths = svg.querySelectorAll('#nk-leg .nk-leg-p');
    var hoof = svg.querySelector('#nk-hoof');
    var impact = svg.querySelector('#nk-impact');
    var coins = svg.querySelectorAll('#nk-coins .nk-coin');

    function place(p) {
      // the hoof falls over the first stretch, accelerating in like a real
      // strike; everything after that is the scatter
      var fall = Math.min(1, p / 0.34);
      fall = fall * fall;                              // ease-in, like a real strike
      var kx = UP.kx + (DOWN.kx - UP.kx) * fall, ky = UP.ky + (DOWN.ky - UP.ky) * fall;
      var hx = UP.hx + (DOWN.hx - UP.hx) * fall, hy = UP.hy + (DOWN.hy - UP.hy) * fall;
      var d = 'M348 262 L' + kx.toFixed(1) + ' ' + ky.toFixed(1) + ' L' + hx.toFixed(1) + ' ' + hy.toFixed(1);
      for (var j = 0; j < legPaths.length; j++) legPaths[j].setAttribute('d', d);
      if (hoof) hoof.setAttribute('transform', 'translate(' + hx.toFixed(1) + ' ' + hy.toFixed(1) + ')');

      // flash only around the moment of contact
      if (impact) {
        var f = p < 0.28 ? 0 : Math.max(0, 1 - (p - 0.28) / 0.22);
        impact.setAttribute('opacity', f.toFixed(3));
      }

      var t = Math.max(0, Math.min(1, (p - 0.3) / 0.7));
      for (var i = 0; i < coins.length; i++) {
        var c = COINS[i % COINS.length];
        var rad = c.a * Math.PI / 180;
        // outward travel eases out; the arc is a parabola so they rise then drop
        var e = 1 - Math.pow(1 - t, 2);
        var x = HOOF_X + Math.cos(rad) * c.d * e;
        // rise monotonically: the parabola returned to zero at the end, which
        // left every coin lying in a line on the ground
        var y = HOOF_Y + Math.sin(rad) * c.d * e * 0.55 - c.rise * e * 0.45;
        var sc = Math.min(1, t * 3);
        coins[i].setAttribute('transform',
          'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (t * (i % 2 ? 150 : -150)).toFixed(0) + ') scale(' + sc.toFixed(3) + ')');
        coins[i].setAttribute('opacity', (t > 0 ? Math.min(1, t * 4) : 0).toFixed(3));
      }
    }

    if (REDUCE) { place(1); return; }   // hoof down, coins already scattered

    var goal = 0, shown = 0, raf = null;
    function tick() {
      var diff = goal - shown;
      if (Math.abs(diff) < 0.0004) { shown = goal; place(shown); raf = null; return; }
      shown += diff * 0.17;
      place(shown);
      raf = requestAnimationFrame(tick);
    }
    function onScroll() {
      // barely scroll-bound: the first nudge triggers the strike, the damped
      // loop carries the scatter the rest of the way
      var span = Math.max(26, Math.min(52, window.innerHeight * 0.04));
      goal = Math.max(0, Math.min(1, window.scrollY / span));
      if (raf === null) raf = requestAnimationFrame(tick);
    }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();
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
