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
  var ELBOW = [322, 196];
  var LEG_W = [46, 25, 18, 15];          // forearm, knee, fetlock, pastern

  /* The limb used to be a straight lerp between a planted pose and a lifted
     one, both written out as raw joint coordinates. Measured, that made the
     forearm 22% shorter at the top of the lift, the cannon 38% shorter and the
     pastern 14%: the leg telescoped instead of folding. Bones do not do that,
     and it is most of why the movement read as wrong.

     So the hoof follows a path and the joints are solved to it, which keeps
     every segment exactly its own length no matter where the hoof is. */
  var L1 = 94.3, L2 = 78.1, L3 = 28.0;   // forearm, cannon, pastern

  /* The paw itself. A horse pawing the ground does not stamp — it reaches
     forward, sets the hoof down, and DRAGS it back toward itself, and that
     drag is the whole gesture. The old cycle had no drag at all: it snapped
     down at 0.28 and then held one pose for the remaining 72%, which is
     exactly the "leg stays put at the moment of impact" that it looked like.

     Keys are (phase, hoof x, hoof y). Everything is inside the 200-unit reach
     from the elbow, so nothing has to be clamped. */
  var PAW = [
    [0.00, 325, 395],   // stood
    [0.16, 292, 344],   // folded up and back under the body
    [0.30, 368, 350],   // swung forward, still clear of the ground
    [0.37, 346, 394],   // contact, forward of vertical
    [0.60, 302, 394],   // scraped back along the ground, past vertical
    [0.74, 296, 372],   // unweighted and lifting
    [1.00, 325, 395]    // stood
  ];

  // Catmull-Rom through the keys rather than straight lines between them:
  // a lerp gives the hoof a new direction at every key, which reads as six
  // little jerks per cycle.
  function pawAt(t) {
    var i = 0;
    while (i < PAW.length - 2 && t >= PAW[i + 1][0]) i++;
    var k0 = PAW[i > 0 ? i - 1 : PAW.length - 2], k1 = PAW[i],
        k2 = PAW[i + 1], k3 = PAW[i + 2 < PAW.length ? i + 2 : 1];
    var u = (t - k1[0]) / (k2[0] - k1[0] || 1), u2 = u * u, u3 = u2 * u;
    function cr(a, b, c, d) {
      return 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 +
                    (-a + 3 * b - 3 * c + d) * u3);
    }
    return [cr(k0[1], k1[1], k2[1], k3[1]), cr(k0[2], k1[2], k2[2], k3[2])];
  }

  /* Two-link IK, elbow to fetlock. Of the two knee solutions this takes the
     one bulging forward, because a horse's carpus folds backward — the knee
     leads and the cannon swings back under. Picking the other root gives you
     a leg that bends like a human's, which is the single most obvious way to
     draw a horse wrong. */
  function solveKnee(fx, fy, out) {
    var dx = fx - ELBOW[0], dy = fy - ELBOW[1];
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
    var h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    var ux = dx / d, uy = dy / d;
    out[0] = ELBOW[0] + a * ux + h * uy;      // -h * perp, perp = (-uy, ux)
    out[1] = ELBOW[1] + a * uy - h * ux;
  }

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
  // Beats of one cycle. T_HIT is the moment the hoof reaches the ground on
  // the PAW path above; the drag runs from there to T_DRAG_END, and the coins
  // are thrown across the whole of it rather than at one instant.
  var T_HIT = 0.37, T_DRAG_END = 0.60, T_SETTLE = 0.52, T_COINS_END = 0.97;

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
      // ---- the limb: hoof on its path, joints solved to it ----
      var H = pawAt(t);
      // How folded the leg is, from how far the hoof is from the elbow. The
      // pastern breaks over as it gathers and straightens as it reaches, which
      // is what a fetlock does.
      var dx0 = H[0] - ELBOW[0], dy0 = H[1] - ELBOW[1];
      var reach = Math.sqrt(dx0 * dx0 + dy0 * dy0);
      var fold = Math.max(0, Math.min(1, (196 - reach) / 46));
      var tilt = fold * 0.62;                       // radians, pastern breaks back
      var ux = -dx0 / (reach || 1), uy = -dy0 / (reach || 1);   // hoof -> elbow
      var cs = Math.cos(tilt), sn = Math.sin(tilt);
      pts[2][0] = H[0] + L3 * (ux * cs - uy * sn);
      pts[2][1] = H[1] + L3 * (ux * sn + uy * cs);
      // Catmull-Rom overshoots its keys, and near the ground the leg is
      // already almost straight, so a couple of units of overshoot asks the
      // hoof to go further than the bones can reach. Pull the hoof in to the
      // limit rather than clamping inside the solver — clamping there moved
      // the target the knee was solved against but left the fetlock where it
      // was, which quietly stretched the cannon on 79 frames of 400.
      var fdx = pts[2][0] - ELBOW[0], fdy = pts[2][1] - ELBOW[1];
      var fd = Math.sqrt(fdx * fdx + fdy * fdy);
      var lim = L1 + L2 - 0.4;
      if (fd > lim) {
        var pull = fd - lim;
        H[0] -= (fdx / fd) * pull; H[1] -= (fdy / fd) * pull;
        pts[2][0] -= (fdx / fd) * pull; pts[2][1] -= (fdy / fd) * pull;
      }
      solveKnee(pts[2][0], pts[2][1], pts[1]);
      pts[3][0] = H[0]; pts[3][1] = H[1];

      // The leg is in motion for three quarters of the cycle now, so there is
      // no point gating the rebuild on a pose change the way the two-pose
      // version could — it is six attribute writes a frame while it moves.
      var key = (H[0] * 4 | 0) + ':' + (H[1] * 4 | 0);
      if (key !== prev.leg) {
        prev.leg = key;
        if (shape) shape.setAttribute('d', ribbon(pts, LEG_W));
        for (var q = 0; q < caps.length; q++) {
          caps[q].setAttribute('cx', pts[q][0].toFixed(1));
          caps[q].setAttribute('cy', pts[q][1].toFixed(1));
        }
        if (hoof) {
          // the hoof follows the pastern instead of staying bolt upright
          var ang = Math.atan2(H[0] - pts[2][0], -(H[1] - pts[2][1])) * 180 / Math.PI;
          hoof.setAttribute('transform',
            'translate(' + H[0].toFixed(1) + ' ' + (H[1] - 5).toFixed(1) + ') rotate(' + (-ang).toFixed(1) + ')');
        }
      }

      // ---- the body answers the blow: a short dip, then it springs back ----
      var jolt = 0;
      if (t >= T_HIT && t < T_DRAG_END) {
        // takes the weight on contact, then rides up as the hoof scrapes back
        var j = (t - T_HIT) / (T_DRAG_END - T_HIT);
        jolt = Math.sin(j * Math.PI) * 4.5;
      } else if (t < T_HIT && t > 0.16) {
        jolt = -1.6 * ((t - 0.16) / (T_HIT - 0.16));   // rocks back over the wind-up
      }
      if (rig && jolt !== prev.jolt) { prev.jolt = jolt; rig.setAttribute('transform', 'translate(0 ' + jolt.toFixed(2) + ')'); }

      // ---- contact: flash and a ring of dust ----
      var hit = (t < T_HIT) ? 0 : Math.max(0, 1 - (t - T_HIT) / 0.14);
      if (flash && hit !== prev.hit) { prev.hit = hit; flash.setAttribute('opacity', (hit * 0.95).toFixed(3)); }
      var dt = (t < T_HIT) ? 0 : Math.min(1, (t - T_HIT) / (T_DRAG_END - T_HIT));
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
        var op = ct <= 0 ? 0 : Math.min(1, ct * 8) * (ct > 0.80 ? Math.max(0, 1 - (ct - 0.80) / 0.20) : 1);
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
      // the CSS wind on the mane and tail is gated off the same observer:
      // keyframes keep ticking off screen otherwise
      svg.classList.toggle('nk-live', on);
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
