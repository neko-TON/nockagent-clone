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
    [].forEach.call(els, function (el) {
      if (el.__nkRev) return;
      el.__nkRev = 1;
      // The stock reveal fades in from blur(10px). A filter is a separate
      // raster pass per element, and there are ~30 of them down the page —
      // pure cost for an effect opacity and translate already carry. Drop the
      // blur up front and let the other two do the reveal.
      el.style.filter = 'none';
      revealIO.observe(el);
    });
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
      svg.style.aspectRatio = '470 / 470';
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
  var HOOF_X = 325, HOOF_Y = 410;
  var ELBOW = [322, 244];
  var LEG_W = [36, 21, 15, 13];          // forearm, knee, fetlock, pastern
  // Gathered, the cannon folds up and forward; planted, the column is straight.
  var UP   = { kx: 344, ky: 286, fx: 358, fy: 322, hx: 358, hy: 344 };
  var DOWN = { kx: 328, ky: 312, fx: 326, fy: 372, hx: 325, hy: 396 };

  // Same ribbon the static legs are built from, so the pawing limb keeps its
  // taper through the whole stroke instead of flattening to a constant bar.
  function ribbon(pts, w) {
    var L = [], R = [], i, p, pr, nx, dx, dy, ln, ox, oy;
    for (i = 0; i < pts.length; i++) {
      p = pts[i]; pr = pts[i - 1] || pts[i]; nx = pts[i + 1] || pts[i];
      dx = nx[0] - pr[0]; dy = nx[1] - pr[1];
      ln = Math.sqrt(dx * dx + dy * dy) || 1;
      ox = -dy / ln * w[i] / 2; oy = dx / ln * w[i] / 2;
      L.push([p[0] + ox, p[1] + oy]); R.push([p[0] - ox, p[1] - oy]);
    }
    var all = L.concat(R.reverse()), d = 'M' + all[0][0].toFixed(1) + ' ' + all[0][1].toFixed(1);
    for (i = 1; i < all.length; i++) d += 'L' + all[i][0].toFixed(1) + ' ' + all[i][1].toFixed(1);
    return d + 'Z';
  }
  var CYCLE = 2800;                                    // ms per paw
  // every asset that has a real mark; six are dealt per paw
  var POOL = ['NVDA','AAPL','TSLA','COIN','AMZN','GOOGL','META','ETH','BTC','NFLX','AMD'];

  // beats of one cycle, as fractions
  var T_RISE = 0.30, T_HIT = 0.38, T_SETTLE = 0.52, T_COINS_END = 0.94;

  function easeOut(x){ return 1 - Math.pow(1 - x, 3); }
  function easeIn(x){ return x * x * x; }

  function strike(svg) {
    var leg = svg.querySelector('#nk-leg');
    if (!leg || leg.__nkStrike) return;
    leg.__nkStrike = 1;

    var shape = svg.querySelector('#nk-leg .nk-leg-shape');
    var capG  = svg.querySelector('#nk-leg .nk-leg-caps');
    // Build the joint caps once. Rewriting innerHTML each frame reparsed
    // markup and rebuilt four nodes sixty times a second for nothing.
    var caps = [];
    if (capG) {
      for (var ci = 0; ci < LEG_W.length; ci++) {
        var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', LEG_W[ci] / 2);
        // The mascot is one flat colour now, so the caps have to be that same
        // colour — they exist to round the limb's silhouette, not to be seen.
        // Left on the old violet they read as three grey beads on a pink leg.
        c.setAttribute('fill', '#ff37c7');
        capG.appendChild(c);
        caps.push(c);
      }
    }
    // scratch buffers, reused so the loop allocates nothing per frame
    var pts = [ELBOW, [0, 0], [0, 0], [0, 0]];
    var prev = {};
    var hoof  = svg.querySelector('#nk-hoof');
    var rig   = svg.querySelector('#nk-rig');
    var dust  = svg.querySelector('#nk-dust');
    var flash = svg.querySelector('#nk-impact');
    var coins = svg.querySelectorAll('#nk-coins .nk-coin');
    var halos = svg.querySelectorAll('#nk-halos .nk-halo');
    var glyphs = svg.querySelectorAll('#nk-coins .nk-glyph');

    // Deal from a shuffled deck rather than picking at random each time: random
    // draws repeat, and a repeat inside one burst looks like a bug.
    var deck = POOL.slice(), cut = deck.length;
    function shuffle() {
      for (var i = deck.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = deck[i]; deck[i] = deck[j]; deck[j] = t;
      }
      cut = 0;
    }
    function deal() {
      // Reshuffle before dealing, never during: cutting mid-hand reset the
      // pointer and could hand out the same mark twice in one burst.
      if (cut + glyphs.length > deck.length) shuffle();
      for (var i = 0; i < glyphs.length; i++)
        glyphs[i].setAttribute('href', '#gl-' + deck[cut + i]);
      cut += glyphs.length;
    }

    function place(t) {
      // ---- the limb: gather slowly, strike fast ----
      var lift;
      if (t < T_RISE)      lift = easeOut(t / T_RISE);              // draw it up
      else if (t < T_HIT)  lift = 1 - easeIn((t - T_RISE) / (T_HIT - T_RISE));  // snap down
      else                 lift = 0;                                // planted
      // the limb only needs rebuilding while it is actually moving; lift sits
      // at 0 for well over half the cycle
      if (lift !== prev.lift) {
        prev.lift = lift;
        pts[1][0] = DOWN.kx + (UP.kx - DOWN.kx) * lift; pts[1][1] = DOWN.ky + (UP.ky - DOWN.ky) * lift;
        pts[2][0] = DOWN.fx + (UP.fx - DOWN.fx) * lift; pts[2][1] = DOWN.fy + (UP.fy - DOWN.fy) * lift;
        pts[3][0] = DOWN.hx + (UP.hx - DOWN.hx) * lift; pts[3][1] = DOWN.hy + (UP.hy - DOWN.hy) * lift;
        if (shape) shape.setAttribute('d', ribbon(pts, LEG_W));
        for (var q = 0; q < caps.length; q++) {
          caps[q].setAttribute('cx', pts[q][0].toFixed(1));
          caps[q].setAttribute('cy', pts[q][1].toFixed(1));
        }
        if (hoof) hoof.setAttribute('transform', 'translate(' + pts[3][0].toFixed(1) + ' ' + (pts[3][1] - 5).toFixed(1) + ')');
      }

      // ---- the body answers the blow: a short dip, then it springs back ----
      var jolt = 0;
      if (t >= T_HIT && t < T_SETTLE) {
        var j = (t - T_HIT) / (T_SETTLE - T_HIT);
        jolt = Math.sin(j * Math.PI) * 5;              // down and back in one arc
      } else if (t < T_HIT && t > T_RISE) {
        jolt = -1.5 * ((t - T_RISE) / (T_HIT - T_RISE));   // a touch of lift on the wind-up
      }
      if (rig && jolt !== prev.jolt) { prev.jolt = jolt; rig.setAttribute('transform', 'translate(0 ' + jolt.toFixed(2) + ')'); }

      // ---- contact: flash and a ring of dust ----
      var hit = (t < T_HIT) ? 0 : Math.max(0, 1 - (t - T_HIT) / 0.14);
      if (flash && hit !== prev.hit) { prev.hit = hit; flash.setAttribute('opacity', (hit * 0.95).toFixed(3)); }
      var dt = (t < T_HIT) ? 0 : Math.min(1, (t - T_HIT) / 0.30);
      if (dust && dt !== prev.dt) {
        prev.dt = dt;
        dust.setAttribute('rx', (30 + dt * 62).toFixed(1));
        dust.setAttribute('ry', (8 + dt * 12).toFixed(1));
        dust.setAttribute('opacity', (dt > 0 ? (1 - dt) * 0.55 : 0).toFixed(3));
      }

      // ---- coins: a real throw, up and back down, fading as they drop ----
      var ct = (t - T_HIT) / (T_COINS_END - T_HIT);
      ct = Math.max(0, Math.min(1, ct));
      if (ct === prev.ct) return;          // burst not running — nothing to move
      prev.ct = ct;
      for (var i = 0; i < coins.length; i++) {
        var c = COINS[i % COINS.length];
        var rad = c.a * Math.PI / 180;
        var out = easeOut(ct);                                   // outward travel decelerates
        var x = HOOF_X + Math.cos(rad) * c.d * out;
        var y = HOOF_Y + Math.sin(rad) * c.d * out * 0.5 - c.rise * (4 * ct * (1 - ct));
        var sc = Math.min(1, ct * 6);
        var op = ct <= 0 ? 0 : Math.min(1, ct * 8) * (ct > 0.72 ? Math.max(0, 1 - (ct - 0.72) / 0.28) : 1);
        var move = 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') ';
        coins[i].setAttribute('transform',
          move + 'rotate(' + (ct * c.spin).toFixed(0) + ') scale(' + sc.toFixed(3) + ')');
        coins[i].setAttribute('opacity', op.toFixed(3));
        // The halo tracks the coin but never spins: a round glow rotating is
        // work with nothing to show for it.
        if (halos[i]) {
          halos[i].setAttribute('transform', move + 'scale(' + sc.toFixed(3) + ')');
          halos[i].setAttribute('opacity', (op * 0.55).toFixed(3));
        }
      }
    }

    shuffle(); deal();
    if (REDUCE) { place(0.55); return; }   // planted, coins mid-air, nothing moving

    // No scroll binding: the paw runs on its own clock, and only while the
    // mascot is actually on screen.
    var raf = null, t0 = null, running = false, lastCycle = -1;
    function frame(ts) {
      if (!running) { raf = null; return; }
      if (t0 === null) t0 = ts;
      var elapsed = ts - t0;
      var n = Math.floor(elapsed / CYCLE);
      if (n !== lastCycle) { lastCycle = n; deal(); }   // new paw, new six
      place((elapsed % CYCLE) / CYCLE);
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
