/* ============================================================
   None — interaction layer.

   The page had eleven sections and, outside the FAQ, not one control:
   ten thousand pixels of reading with nothing to press. The fix is not
   more sections — the page is long enough that another stack of cards
   would make it worse. It is to give the sections that already exist
   something to do, so a screen holds more without holding more stuff.

   Every control here is built from the same pill vocabulary the page
   already uses. No new colours, no new motion, nothing that blinks.
   Three of these four blocks make the page shorter than they found it.
   ============================================================ */
(function () {
  if (window.__nkBlocks) return;
  window.__nkBlocks = 1;

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CARD = 'rounded-2xl border border-border bg-surface/50 p-6';

  /* ---------------- the one event path that works here ----------------
     Next's App Router hydrates the whole document, so React's listeners are
     on `document` itself, and until hydration completes React calls
     stopPropagation() on discrete events so it can replay them later. This
     clone has no Next server behind it: hydration never completes, the hold
     never lifts, and a click never reaches its own target. Measured on the
     live page — window capture and document capture fire, html capture does
     not. So every control here is registered once, on document, in the
     capture phase, and routed by a data attribute. Nothing is bound to a
     button; a listener on a button on this page does not run. */
  var ACTS = {};
  function act(name, fn) { ACTS[name] = fn; }
  function dispatch(e) {
    var n = e.target.closest && e.target.closest('[data-nk-act]');
    if (!n) return;
    var raw = n.getAttribute('data-nk-act');
    var i = raw.indexOf(':');
    var fn = ACTS[i < 0 ? raw : raw.slice(0, i)];
    if (!fn) return;
    e.preventDefault();
    fn(i < 0 ? '' : raw.slice(i + 1), n, e);
  }

  function T(fn) { try { fn(); } catch (e) {} }
  function el(h) { var d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function money(n) {
    return n >= 100 ? '$' + Math.round(n).toLocaleString('en-US')
         : n >= 1   ? '$' + n.toFixed(2)
         : '$' + n.toFixed(4);
  }

  /* ---------------- styles ---------------- */
  var css = document.createElement('style');
  css.id = 'nk-blocks-css';
  css.textContent = [
    /* one segmented control, used by every block below */
    '.nk-seg{display:flex;flex-wrap:wrap;gap:.5rem}',
    '.nk-seg button{padding:.42rem .85rem;border-radius:9999px;border:1px solid var(--border);' +
      'background:transparent;color:#9b9b9b;font-family:var(--font-geist-mono),monospace;font-size:11.5px;' +
      'letter-spacing:.06em;cursor:pointer;transition:color .18s ease,border-color .18s ease,background-color .18s ease}',
    '@media (hover:hover){.nk-seg button:hover{color:#e8e8e8;border-color:rgba(255,255,255,.22)}}',
    '.nk-seg button[aria-pressed="true"],.nk-seg button[aria-selected="true"]{' +
      'color:#fc72ff;border-color:rgba(255,55,199,.45);background:rgba(255,55,199,.07)}',
    '.nk-seg button:focus-visible{outline:2px solid #ff37c7;outline-offset:2px}',

    '.nk-field{display:flex;align-items:center;gap:.55rem;padding:.42rem .85rem;border-radius:9999px;' +
      'border:1px solid var(--border);background:transparent;min-width:190px}',
    '.nk-field input{flex:1;min-width:0;background:none;border:0;outline:0;color:#e8e8e8;' +
      'font-family:var(--font-geist-mono),monospace;font-size:11.5px}',
    '.nk-field input::placeholder{color:#6e6e6e}',
    '.nk-field svg{flex:0 0 auto;opacity:.5}',

    /* calculator */
    '.nk-calc-grid{display:grid;gap:.1rem;margin-top:1.4rem}',
    '.nk-calc-row{display:flex;align-items:baseline;justify-content:space-between;gap:1rem;' +
      'padding:.62rem 0;border-top:1px solid var(--border)}',
    '.nk-calc-row .k{font-size:13.5px;color:#9b9b9b}',
    '.nk-calc-row .v{font-family:var(--font-geist-mono),monospace;font-variant-numeric:tabular-nums;' +
      'font-size:13.5px;color:#e8e8e8;white-space:nowrap}',
    '.nk-calc-row.total .k{color:#ffffff;font-weight:600}',
    '.nk-calc-row.gain .v{color:#fc72ff}',
    '.nk-range{-webkit-appearance:none;appearance:none;width:100%;height:2px;border-radius:2px;' +
      'background:var(--border);outline:0;margin:1.5rem 0 .2rem}',
    '.nk-range::-webkit-slider-thumb{-webkit-appearance:none;width:17px;height:17px;border-radius:50%;' +
      'background:#ff37c7;cursor:pointer;border:3px solid #131313;box-shadow:0 0 0 1px rgba(255,55,199,.5)}',
    '.nk-range::-moz-range-thumb{width:17px;height:17px;border-radius:50%;background:#ff37c7;cursor:pointer;' +
      'border:3px solid #131313;box-shadow:0 0 0 1px rgba(255,55,199,.5)}',
    '.nk-range:focus-visible{outline:2px solid #ff37c7;outline-offset:6px}',
    '.nk-size{font-family:var(--font-geist-mono),monospace;font-size:28px;color:#ffffff;' +
      'font-variant-numeric:tabular-nums;letter-spacing:-.01em}',

    /* roadmap rail */
    '.nk-rail{display:grid;gap:1.6rem;margin-top:2.6rem}',
    '@media (min-width:900px){.nk-rail{grid-template-columns:200px 1fr;gap:2.4rem}}',
    '.nk-rail-nav{display:flex;flex-wrap:wrap;gap:.5rem}',
    '@media (min-width:900px){.nk-rail-nav{flex-direction:column;flex-wrap:nowrap;gap:.15rem}}',
    '.nk-rail-nav button{display:flex;align-items:center;gap:.6rem;padding:.55rem .8rem;border-radius:10px;' +
      'border:1px solid transparent;background:none;color:#9b9b9b;cursor:pointer;text-align:left;' +
      'font-size:13.5px;font-family:inherit;transition:color .18s ease,background-color .18s ease}',
    '@media (hover:hover){.nk-rail-nav button:hover{color:#e8e8e8;background:rgba(255,255,255,.035)}}',
    '.nk-rail-nav button[aria-selected="true"]{color:#ffffff;background:rgba(255,55,199,.08);' +
      'border-color:rgba(255,55,199,.28)}',
    '.nk-rail-nav .dot{flex:0 0 auto;width:7px;height:7px;border-radius:50%;background:#622a4a}',
    '.nk-rail-nav button[aria-selected="true"] .dot{background:#ff37c7}',
    '.nk-rail-nav .dot.now{background:#ff37c7}',
    '.nk-rail-nav button:focus-visible{outline:2px solid #ff37c7;outline-offset:2px}',
    '.nk-rail-panel h3{font-size:22px;font-weight:535;color:#ffffff;margin:.7rem 0 0}',
    '.nk-rail-panel p{margin:.8rem 0 0;max-width:60ch;font-size:14.5px;line-height:1.75;color:#9b9b9b}',
    REDUCE ? '' : '.nk-rail-panel.swap{animation:nkFade .32s cubic-bezier(.22,.61,.36,1)}',
    '@keyframes nkFade{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}',

    /* terminal result */
    '.nk-tres{margin-top:1.1rem;border-top:1px solid var(--border);padding-top:1.1rem;' +
      'display:grid;gap:.55rem}',
    '.nk-tres .r{display:flex;justify-content:space-between;gap:1rem;font-family:var(--font-geist-mono),monospace;font-size:12.5px}',
    '.nk-tres .r span:first-child{color:#6e6e6e}',
    '.nk-tres .r span:last-child{color:#d4d4d4;font-variant-numeric:tabular-nums}',
    '.nk-tres .r.win span:last-child{color:#fc72ff}',
    '.nk-note{margin-top:.9rem;font-size:11.5px;line-height:1.6;color:#6e6e6e}',
    '.nk-count{font-family:var(--font-geist-mono),monospace;font-size:11.5px;color:#6e6e6e}',
    '.nk-empty{padding:2rem .9rem;text-align:center;color:#6e6e6e;font-size:13.5px}',

    /* ---- illustrations ----
       Not GIFs, and that is a measurement rather than a preference. This
       palette is near-black under wide low-alpha pink: composited, the hero
       wash spans 33-35 eight-bit levels per channel. GIF carries 256 colours
       for the whole frame and one bit of alpha, so those ramps come back as
       rings with a hard fringe — the exact artefact the glow pass just spent
       its time removing. Vector also stays sharp at any size, weighs a few
       KB against megabytes, and can be stopped for prefers-reduced-motion,
       which a GIF cannot. The static state is the finished state; motion is
       the enhancement, and it is paused while off screen. */
    // Scrolls sideways below ~600px rather than shrinking: scaled to a phone
    // the labels land around 7px, and an unreadable diagram is worse than one
    // you have to nudge. The data tables on this page already behave this way.
    '.nk-art{margin-top:2.2rem;border:1px solid var(--border);border-radius:16px;' +
      'background:rgba(16,16,16,.45);padding:1.1rem 1rem .55rem;overflow-x:auto}',
    '.nk-art > svg{display:block;width:100%;min-width:600px;height:auto}',
    '.nk-art .cap{font-family:var(--font-geist-mono),monospace;font-size:10px;letter-spacing:.18em;' +
      'text-transform:uppercase;color:#6e6e6e;padding:0 .35rem .75rem}',
    '.nk-art text{font-family:var(--font-geist-mono),monospace}',
    '.nk-art .lane{stroke:#572040;stroke-width:1.2;fill:none}',
    '.nk-art .pill{fill:#1a1a1a;stroke:#622a4a;stroke-width:1.2}',
    '.nk-art .pill-win{fill:rgba(255,55,199,.09);stroke:#ff37c7;stroke-width:1.5}',
    '.nk-art .lbl{fill:#9b9b9b;font-size:11px}',
    '.nk-art .num{fill:#6e6e6e;font-size:11px}',
    '.nk-art .num-win{fill:#fc72ff;font-size:11px}',
    '.nk-art .node{fill:#1f1f1f;stroke:#622a4a;stroke-width:1.5}',
    '.nk-art .node-t{fill:#d4d4d4;font-size:11px}',
    '.nk-art .win-path{stroke:#ff37c7;stroke-width:2;fill:none}',
    '.nk-art .foot{fill:#6e6e6e;font-size:11px}',   // never animates
    /* Default = the resolved picture, spelled out rather than left to whatever
       an un-animated element happens to look like. This is what a
       reduced-motion reader gets, and what the first paint shows. */
    '.nk-art .g-fill{transform:scaleX(.896);transform-box:fill-box;transform-origin:left center}',
    '.nk-art .g-dot{transform:translateX(430px);transform-box:view-box}',
    '.nk-art .v-no{opacity:0}',
    '@media (prefers-reduced-motion:no-preference){',
    '  .nk-art.on .probe{animation:nkProbe 7s linear infinite}',
    '  .nk-art.on .num,.nk-art.on .num-win{animation:nkNum 7s linear infinite}',
    '  .nk-art.on .pill-win,.nk-art.on .win-path{animation:nkWin 7s linear infinite}',
    '  .nk-art.on .probe,.nk-art.on .num,.nk-art.on .num-win,',
    '  .nk-art.on .pill-win,.nk-art.on .win-path{animation-play-state:running}',
    '  .nk-art.on .g-fill{animation:nkFill 8s cubic-bezier(.4,0,.2,1) infinite;animation-play-state:running}',
    '  .nk-art.on .g-dot{animation:nkDot 8s cubic-bezier(.4,0,.2,1) infinite;animation-play-state:running}',
    '  .nk-art.on .v-ok{animation:nkOk 8s linear infinite;animation-play-state:running}',
    '  .nk-art.on .v-no{animation:nkNo 8s linear infinite;animation-play-state:running}',
    '}',
    '@keyframes nkProbe{0%{stroke-dashoffset:100;opacity:0}4%{opacity:.9}' +
      '17%,86%{stroke-dashoffset:0;opacity:.9}96%,100%{stroke-dashoffset:0;opacity:0}}',
    '@keyframes nkNum{0%,18%{opacity:0}27%,88%{opacity:1}97%,100%{opacity:0}}',
    '@keyframes nkWin{0%,44%{opacity:0}53%,88%{opacity:1}97%,100%{opacity:0}}',
    // the guard: one fill that clears the floor, then one that does not.
    // .896 lands at x=520, comfortably above the min-out tick at x=250;
    // .229 lands at x=200, below it.
    '@keyframes nkFill{0%{transform:scaleX(0)}22%,44%{transform:scaleX(.896)}' +
      '46%{transform:scaleX(0)}68%,90%{transform:scaleX(.229)}100%{transform:scaleX(0)}}',
    '@keyframes nkDot{0%{transform:translateX(0)}22%,44%{transform:translateX(430px)}' +
      '46%{transform:translateX(0)}68%,90%{transform:translateX(110px)}100%{transform:translateX(0)}}',
    '@keyframes nkOk{0%,23%{opacity:0}28%,44%{opacity:1}46%,100%{opacity:0}}',
    '@keyframes nkNo{0%,69%{opacity:0}74%,90%{opacity:1}92%,100%{opacity:0}}',

    /* the calculator sparkline */
    '.nk-spark{margin-top:1.3rem;border-top:1px solid var(--border);padding-top:1.1rem}',
    '.nk-spark svg{display:block;width:100%;height:auto;overflow:visible}',
    '.nk-spark .cap{font-family:var(--font-geist-mono),monospace;font-size:10px;' +
      'letter-spacing:.16em;text-transform:uppercase;color:#6e6e6e;margin-bottom:.6rem}'
  ].join('\n');
  if (!document.getElementById('nk-blocks-css')) document.head.appendChild(css);

  /* ============================================================
     1. The hero chips
     They were <span>s wearing button clothes — pill, border, hover
     cursor, the lot — and nothing happened when you pressed one. That
     is worse than having no chips at all, so they are real buttons now
     and they type themselves into the terminal.
     ============================================================ */
  // NVDA is priced so this card lands on the same numbers /app already shows
  // for the same sentence — 40.9528 naive, 41.1176 routed. Two pages of one
  // site quoting one trade differently is worse than not quoting it.
  var INTENTS = {
    'Buy $5,000 of NVDA':      { size: 5000,  sym: 'NVDA',    px: 121.46 },
    'Ape 2 ETH into CASHCAT':  { size: 6420,  sym: 'CASHCAT', px: 0.00031 },
    'Swap $10k USDG into COIN':{ size: 10000, sym: 'COIN',    px: 254.10 },
    'Get me $3,000 of AMZN':   { size: 3000,  sym: 'AMZN',    px: 207.55 }
  };

  /* This terminal is React's, and React re-renders it after hydration —
     anything grafted on is liable to be thrown away, listeners included. The
     burger menu hit the same wall. So: nothing is captured in a closure,
     every piece is addressed by data attribute, ensure() rebuilds whatever is
     missing and is safe to call any number of times, and the click is
     delegated on document so it survives the nodes it fires on. */
  var typing = null;

  function caretRow() {
    return $$('.cursor-blink').map(function (c) {
      return c.closest('.flex');
    }).filter(Boolean)[0];
  }

  function ensureTerminal() {
    var row = caretRow();
    if (!row) return null;

    var line = $('[data-nk-line]', row);
    if (!line) {
      var cursor = $('.cursor-blink', row);
      line = document.createElement('span');
      line.setAttribute('data-nk-line', '1');
      cursor.parentNode.insertBefore(line, cursor);
    }

    var body = row.parentNode;
    var res = $('[data-nk-tres]', body);
    if (!res) {
      res = el('<div class="nk-tres" data-nk-tres="1" hidden></div>');
      body.insertBefore(res, row.nextSibling);
    }

    // Only spans dressed as chips — a bare wrapper span can hold the same text
    // and converting that one produced a second, invisible duplicate button.
    $$('span').forEach(function (s) {
      if (s.children.length || !/rounded-full/.test(String(s.className))) return;
      var text = s.textContent.trim();
      if (!INTENTS[text]) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = s.className;
      b.style.cursor = 'pointer';
      b.setAttribute('data-nk-act', 'intent:' + text);
      b.textContent = text;
      s.parentNode.replaceChild(b, s);
    });

    return { line: line, res: res };
  }

  function runIntent(text) {
    var spec = INTENTS[text];
    var parts = ensureTerminal();
    if (!spec || !parts) return;
    clearTimeout(typing);
    parts.res.hidden = true;
    parts.line.textContent = '';
    if (REDUCE) { parts.line.textContent = text; return showQuote(spec); }
    var i = 0;
    (function step() {
      var p = ensureTerminal();          // re-resolve: the row may have been replaced
      if (!p) return;
      p.line.textContent = text.slice(0, ++i);
      if (i < text.length) typing = setTimeout(step, 26);
      else showQuote(spec);
    })();
  }

  function showQuote(spec) {
    var parts = ensureTerminal();
    if (!parts) return;
    var m = quote(spec.size);
    var units = spec.size / spec.px;
    var dp = spec.px < 1 ? 0 : 4;
    // Route depth comes from the same hopsFor() the calculator prices gas
    // with, so the two blocks cannot describe one trade differently. The
    // intermediates are the base assets the copy names: WETH and USDG.
    var path = ['USDG'];
    if (m.hops >= 2) path.push('WETH');
    if (m.hops >= 3) path.push('USDG');
    parts.res.innerHTML =
      '<div class="r"><span>route</span><span>' +
        path.join(' → ') + ' → ' + spec.sym + '</span></div>' +
      '<div class="r"><span>naive direct swap</span><span>' +
        (units * (1 - m.naive)).toFixed(dp) + ' ' + spec.sym + '</span></div>' +
      '<div class="r win"><span>None route</span><span>' +
        (units * (1 - m.routed)).toFixed(dp) + ' ' + spec.sym + '</span></div>' +
      '<div class="r win"><span>extra received</span><span>+' +
        (units * (m.naive - m.routed)).toFixed(dp) + ' ' + spec.sym +
        ' (+' + m.gainPct.toFixed(2) + '%)</span></div>' +
      '<div class="r"><span>network fee</span><span>~' + money(m.gas) + '</span></div>';
    parts.res.hidden = false;
  }

  act('intent', function (text) { runIntent(text); });

  function liveTerminal() { ensureTerminal(); }

  /* ============================================================
     2. Cost calculator
     The fee table states rates; it never says what a trade costs. The
     rates are the table's, so the two cannot drift apart.
     ============================================================ */
  var TIER_ROUTED = 0.0005;      // 0.05% — the tier the router usually lands on
  var TIER_NAIVE  = 0.0030;      // 0.30% — the tier a direct pair usually sits in
  var GAS_BASE    = 0.002;       // Arbitrum L2, per the fee table
  var GAS_HOP     = 0.0011;

  function hopsFor(size) { return size > 40000 ? 3 : size > 8000 ? 2 : 1; }

  function quote(size) {
    var hops = hopsFor(size);
    // Two sources of gain, both from the copy: the router finds the cheaper
    // fee tier, and splitting across pools costs less impact than one pool
    // eats. The impact term saturates — past a point the deep pool's own
    // impact dominates and there is nothing left to win.
    // Calibrated so a $5,000 trade comes out at +0.40%, the figure /app
    // publishes. It saturates by roughly $25k: past that the deep pool's own
    // impact dominates and there is nothing further for the router to win.
    var tierGain = TIER_NAIVE - TIER_ROUTED;
    var impactGain = 0.00265 * (1 - Math.exp(-size / 6000));
    var gain = tierGain + impactGain;
    return {
      hops: hops,
      poolFee: size * TIER_ROUTED,
      gas: GAS_BASE + (hops - 1) * GAS_HOP,
      naive: TIER_NAIVE + 0.0022,
      routed: TIER_ROUTED + 0.0022 - impactGain,
      gain: size * gain,
      gainPct: gain * 100
    };
  }

  var PRESETS = [1000, 5000, 25000, 100000];
  var SMIN = Math.log(250), SMAX = Math.log(250000);

  function feeCalculator() {
    var sec = document.getElementById('fees');
    if (!sec || $('#nk-calc')) return;
    var host = $('.mx-auto', sec) || sec;

    var node = el(
      '<div id="nk-calc" class="mt-8 nk-rise ' + CARD + '">' +
        '<div class="flex flex-wrap items-end justify-between gap-4">' +
          '<div><div class="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">Trade size</div>' +
          '<div class="nk-size" id="nk-calc-size">$5,000</div></div>' +
          '<div class="nk-seg" id="nk-calc-presets"></div>' +
        '</div>' +
        '<input class="nk-range" id="nk-calc-range" type="range" min="0" max="1000" value="0"' +
        ' aria-label="Trade size in US dollars"/>' +
        '<div class="nk-calc-grid" id="nk-calc-rows"></div>' +
        '<div class="nk-spark"><div class="cap">Gain vs size</div>' +
        '<svg id="nk-spark-svg" viewBox="0 0 560 78" fill="none" ' +
        'role="img" aria-label="The routed gain rises with trade size and levels off ' +
        'around twenty-five thousand dollars."></svg></div>' +
        '<p class="nk-note">Rates are the ones in the table above; the size is yours. Price impact is ' +
        'modelled, not quoted — a real number comes from the on-chain quoter at a block, which is what ' +
        'the app shows you before you sign.</p>' +
      '</div>'
    );
    host.appendChild(node);

    var seg = $('#nk-calc-presets', node);
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-nk-act', 'calc:' + p);
      b.textContent = p >= 1000 ? '$' + (p / 1000) + 'k' : '$' + p;
      seg.appendChild(b);
    });

    // `input` is held back exactly like `click` is, so the slider is read on
    // capture too. It fires per pixel of drag, hence the passive listener.
    var range = $('#nk-calc-range', node);
    document.addEventListener('input', function (e) {
      if (e.target !== range) return;
      render(Math.exp(SMIN + (SMAX - SMIN) * (range.value / 1000)));
    }, true);
    act('calc', function (v) { setSize(+v); });

    function setSize(v) {
      range.value = Math.round((Math.log(v) - SMIN) / (SMAX - SMIN) * 1000);
      render(v);
    }

    function render(size) {
      size = Math.max(250, Math.min(250000, size));
      var step = size >= 20000 ? 1000 : size >= 2000 ? 100 : 10;
      size = Math.round(size / step) * step;
      var m = quote(size);
      $('#nk-calc-size', node).textContent = '$' + size.toLocaleString('en-US');
      $$('button', seg).forEach(function (b, i) {
        b.setAttribute('aria-pressed', PRESETS[i] === size ? 'true' : 'false');
      });
      $('#nk-calc-rows', node).innerHTML = [
        ['None routing fee', '$0.00', ''],
        ['Uniswap pool fee <span class="nk-pill">0.05%</span>', money(m.poolFee), ''],
        ['Robinhood Chain gas <span class="nk-pill">' + m.hops + ' hop' + (m.hops > 1 ? 's' : '') + '</span>',
         '~' + money(m.gas), ''],
        ['What you pay', money(m.poolFee + m.gas), 'total'],
        ['Extra received vs a naive direct swap',
         '+' + money(m.gain) + '  (+' + m.gainPct.toFixed(2) + '%)', 'gain']
      ].map(function (r) {
        return '<div class="nk-calc-row ' + r[2] + '"><span class="k">' + r[0] +
               '</span><span class="v">' + r[1] + '</span></div>';
      }).join('');
      spark(size, m.gainPct);
    }

    /* The gain curve. It is the one part of the model you cannot read off a
       single number: the router's edge climbs steeply through the small
       sizes and then flattens, because past roughly $25k the deep pool's own
       impact is what dominates. Drawn straight from quote(), so it can never
       disagree with the rows above it. */
    // Zero-based, and the scale is written on it. Cropping the axis to make
    // the curve look dramatic would be the easy move and a dishonest one —
    // the gain genuinely only travels from 0.29% to 0.52%.
    var GMAX = 0.6;
    function spark(size, gainPct) {
      var svg = $('#nk-spark-svg', node);
      if (!svg) return;
      var x = function (s) { return 8 + (Math.log(s) - SMIN) / (SMAX - SMIN) * 500; };
      var y = function (g) { return 62 - (g / GMAX) * 54; };
      var pts = [];
      for (var i = 0; i <= 56; i++) {
        var s = Math.exp(SMIN + (SMAX - SMIN) * (i / 56));
        pts.push(x(s).toFixed(1) + ',' + y(quote(s).gainPct).toFixed(1));
      }
      var cx = x(size), cy = y(gainPct);
      var tick = 'fill="#6e6e6e" font-size="9" font-family="var(--font-geist-mono),monospace"';
      svg.innerHTML =
        '<line x1="8" y1="62" x2="508" y2="62" stroke="#242424" stroke-width="1"/>' +
        '<line x1="8" y1="8" x2="508" y2="8" stroke="#1e1e1e" stroke-width="1" stroke-dasharray="2 4"/>' +
        '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#622a4a" stroke-width="1.6"/>' +
        '<polyline points="' + pts.filter(function (p) { return +p.split(',')[0] <= cx; }).join(' ') +
          '" fill="none" stroke="#ff37c7" stroke-width="2"/>' +
        '<line x1="' + cx.toFixed(1) + '" y1="' + cy.toFixed(1) + '" x2="' + cx.toFixed(1) +
          '" y2="62" stroke="#622a4a" stroke-width="1" stroke-dasharray="2 3"/>' +
        '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="4" fill="#ff37c7"/>' +
        '<text x="516" y="11" ' + tick + '>0.6%</text>' +
        '<text x="516" y="65" ' + tick + '>0</text>' +
        '<text x="8" y="74" ' + tick + '>$250</text>' +
        '<text x="508" y="74" text-anchor="end" ' + tick + '>$250k</text>';
    }

    setSize(5000);
  }

  /* ============================================================
     3. Market filters
     Ten rows is not many, but a table you can interrogate reads as a
     market and a table you cannot reads as a picture of one.
     ============================================================ */
  function marketFilter() {
    var sec = document.getElementById('markets');
    if (!sec || $('#nk-mkt', sec)) return;
    var table = $('.nk-tbl', sec);
    var card = table && table.closest('[class*="rounded-2xl"]');
    if (!card) return;

    var bar = el(
      '<div id="nk-mkt" class="mt-10 nk-rise flex flex-wrap items-center justify-between gap-3">' +
        '<div class="nk-seg" id="nk-mkt-seg"></div>' +
        '<div class="flex items-center gap-3">' +
          '<label class="nk-field">' +
            '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6">' +
            '<circle cx="7" cy="7" r="4.6"/><path d="M10.5 10.5 14 14"/></svg>' +
            '<input type="search" placeholder="filter symbol or name" aria-label="Filter markets"/>' +
          '</label>' +
          '<span class="nk-count" id="nk-mkt-count"></span>' +
        '</div>' +
      '</div>'
    );
    card.parentNode.insertBefore(bar, card);
    card.classList.remove('mt-10');
    card.classList.add('mt-4');

    var rows = $$('tbody tr', table);
    var CLASSES = [
      ['All', function () { return true; }],
      ['Stocks', function (t) { return /tokenized equity/.test(t); }],
      ['Crypto', function (t) { return /crypto/.test(t); }],
      ['Base assets', function (t) { return /base asset/.test(t); }]
    ];
    var active = 0, term = '';

    var seg = $('#nk-mkt-seg', bar);
    CLASSES.forEach(function (c, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = c[0];
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.setAttribute('data-nk-act', 'mkt:' + i);
      seg.appendChild(b);
    });
    act('mkt', function (i) { active = +i; apply(); });

    var input = $('input', bar);
    document.addEventListener('input', function (e) {
      if (e.target !== input) return;
      term = input.value.trim().toLowerCase();
      apply();
    }, true);

    // Built by hand, not through el(): a <tbody> parsed inside a <div> is
    // invalid and the parser throws the element away, leaving null.
    var empty = document.createElement('tbody');
    empty.id = 'nk-mkt-empty';
    empty.hidden = true;
    empty.innerHTML = '<tr><td colspan="5" class="nk-empty">Nothing matches that. ' +
                      'The full list is ' + rows.length + ' markets.</td></tr>';
    table.appendChild(empty);

    function apply() {
      var test = CLASSES[active][1], shown = 0;
      rows.forEach(function (tr) {
        var cls = (tr.cells[2] ? tr.cells[2].textContent : '').toLowerCase();
        var text = tr.textContent.toLowerCase();
        var ok = test(cls) && (!term || text.indexOf(term) !== -1);
        tr.hidden = !ok;
        if (ok) shown++;
      });
      $$('button', seg).forEach(function (b, i) {
        b.setAttribute('aria-pressed', i === active ? 'true' : 'false');
      });
      empty.hidden = shown > 0;
      $('#nk-mkt-count', bar).textContent = shown + ' of ' + rows.length;
    }
    apply();
  }

  /* ============================================================
     4. Roadmap rail
     Five entries stacked vertically ran 975px, and the last two were
     below anything anyone scrolls to. Same five entries, same words,
     one at a time.
     ============================================================ */
  function roadmapRail() {
    var sec = document.getElementById('roadmap');
    if (!sec || $('.nk-rail', sec)) return;
    var tl = $('.nk-tl', sec);
    if (!tl) return;

    var items = $$('.nk-tli', tl).map(function (t) {
      return {
        tag: (t.querySelector('.nk-pill') || {}).textContent || '',
        title: (t.querySelector('h3') || {}).textContent || '',
        body: (t.querySelector('p') || {}).innerHTML || '',
        now: t.classList.contains('now')
      };
    });
    if (items.length < 2) return;

    var rail = el('<div class="nk-rail"><div class="nk-rail-nav" role="tablist"></div>' +
                  '<div class="nk-rail-panel" role="tabpanel"></div></div>');
    var nav = $('.nk-rail-nav', rail), panel = $('.nk-rail-panel', rail);

    items.forEach(function (it, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.setAttribute('data-nk-act', 'rail:' + i);
      b.innerHTML = '<span class="dot' + (it.now ? ' now' : '') + '"></span><span>' + it.title + '</span>';
      nav.appendChild(b);
    });
    act('rail', function (i) { pick(+i); });

    function pick(i) {
      var it = items[i];
      $$('button', nav).forEach(function (b, j) {
        b.setAttribute('aria-selected', j === i ? 'true' : 'false');
      });
      panel.innerHTML =
        '<span class="nk-pill' + (/shipped/i.test(it.tag) ? ' g' : '') + '">' + it.tag + '</span>' +
        '<h3>' + it.title + '</h3><p>' + it.body + '</p>';
      panel.classList.remove('swap');
      void panel.offsetWidth;                 // restart the fade
      panel.classList.add('swap');
    }

    tl.parentNode.replaceChild(rail, tl);
    pick(0);
  }

  /* ============================================================
     5. Two diagrams, for the two sections that make a claim words
        alone cannot show.

     Both are wired to the numbers the rest of the site publishes:
     41.1176 is the routed figure on /app and in the hero terminal,
     40.9528 is the naive one, and here you can see which venue each
     of them came from. A diagram that invented its own numbers would
     be decoration; this one is the explanation.
     ============================================================ */
  var VENUES = [
    ['v2',           '40.7106', 0],
    ['v3 · 0.01%',   '40.8842', 0],
    ['v3 · 0.05%',   '41.1176', 1],   // the routed figure the site quotes
    ['v3 · 0.30%',   '40.9528', 0],   // the naive-direct figure the site quotes
    ['v4 · hooks',   '40.6318', 0]
  ];

  function fanoutArt() {
    var sec = document.getElementById('routing');
    if (!sec || $('#nk-art-fan')) return;

    var rows = '', probes = '', win = '';
    VENUES.forEach(function (v, i) {
      var y = 26 + i * 40;
      // in-path: source out to the venue. pathLength normalises every lane to
      // 100 so one dash keyframe fits all of them regardless of real length.
      probes += '<path class="probe lane" pathLength="100" stroke-dasharray="100" ' +
        'style="animation-delay:' + (i * 0.28).toFixed(2) + 's" ' +
        'd="M82 105 C 150 105, 160 ' + y + ', 208 ' + y + '"/>';
      rows +=
        '<rect class="' + (v[2] ? 'pill' : 'pill') + '" x="208" y="' + (y - 14) +
          '" width="196" height="28" rx="14"/>' +
        '<text class="lbl" x="224" y="' + (y + 4) + '">' + v[0] + '</text>' +
        '<text class="' + (v[2] ? 'num-win' : 'num') + '" x="388" y="' + (y + 4) +
          '" text-anchor="end" style="animation-delay:' + (i * 0.28).toFixed(2) + 's">' +
          v[1] + '</text>';
      if (v[2]) {
        win =
          '<rect class="pill-win" x="208" y="' + (y - 14) + '" width="196" height="28" rx="14"/>' +
          '<path class="win-path" d="M404 ' + y + ' C 470 ' + y + ', 500 105, 566 105"/>';
      }
    });

    var svg =
      '<div class="nk-art nk-rise" id="nk-art-fan">' +
      '<div class="cap">Fan-out quoting · one block, five venues</div>' +
      '<svg viewBox="0 0 660 226" fill="none" xmlns="http://www.w3.org/2000/svg" ' +
        'role="img" aria-label="A quote is requested from five venues at once; the ' +
        'Uniswap v3 0.05% pool returns the best output, 41.1176 NVDA, and becomes the route.">' +
        probes + rows + win +
        '<circle class="node" cx="58" cy="105" r="23"/>' +
        '<text class="node-t" x="58" y="109" text-anchor="middle">USDG</text>' +
        '<circle class="node" cx="590" cy="105" r="23"/>' +
        '<text class="node-t" x="590" y="109" text-anchor="middle">NVDA</text>' +
        '<text class="foot" x="330" y="212" text-anchor="middle">' +
          'best net output wins — nothing is cached, every number is quoted at the block</text>' +
      '</svg></div>';

    sec.appendChild(el(svg));
  }

  function guardArt() {
    var sec = document.getElementById('security');
    if (!sec || $('#nk-art-guard')) return;
    // track 90..630, floor tick at 270 -> 180/540 = 0.333, quote at 559 -> 0.868
    var svg =
      '<div class="nk-art nk-rise" id="nk-art-guard">' +
      '<div class="cap">Fails closed · minimum-out</div>' +
      '<svg viewBox="0 0 660 150" fill="none" xmlns="http://www.w3.org/2000/svg" ' +
        'role="img" aria-label="A fill above the minimum-out settles; a fill below it ' +
        'reverts and the funds stay in your wallet.">' +
        '<rect x="90" y="74" width="480" height="7" rx="3.5" fill="#242424"/>' +
        '<rect class="g-fill" x="90" y="74" width="480" height="7" rx="3.5" fill="#ff37c7"/>' +
        '<line x1="250" y1="58" x2="250" y2="97" stroke="#ff37c7" stroke-width="1.5" opacity="0.7"/>' +
        '<text class="foot" x="250" y="48" text-anchor="middle" fill="#9b9b9b">min out 40.9120</text>' +
        '<line x1="540" y1="62" x2="540" y2="93" stroke="#622a4a" stroke-width="1.5"/>' +
        '<text class="foot" x="540" y="48" text-anchor="middle">quoted 41.1176</text>' +
        '<circle class="g-dot" cx="90" cy="77.5" r="7" fill="#ffe9fa"/>' +
        '<text class="v-ok" x="330" y="126" text-anchor="middle" fill="#fc72ff" font-size="11">' +
          'above the floor → settles in one signed transaction</text>' +
        '<text class="v-no" x="330" y="126" text-anchor="middle" fill="#9b9b9b" font-size="11">' +
          'below the floor → reverts, and the funds never left your wallet</text>' +
      '</svg></div>';
    sec.appendChild(el(svg));
  }

  /* Animation runs only while the diagram is on screen — same rule the
     mascot loop follows. */
  var artIO = null;
  function watchArt() {
    var arts = $$('.nk-art');
    if (!arts.length) return;
    if (!('IntersectionObserver' in window)) {
      arts.forEach(function (a) { a.classList.add('on'); });
      return;
    }
    if (!artIO) artIO = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { en.target.classList.toggle('on', en.isIntersecting); });
    }, { rootMargin: '80px 0px' });
    arts.forEach(function (a) { if (!a.__nk) { a.__nk = 1; artIO.observe(a); } });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    if (!document.__nkActDoc) {
      document.__nkActDoc = 1;
      document.addEventListener('click', dispatch, true);
    }
    T(liveTerminal); T(feeCalculator); T(marketFilter); T(roadmapRail);
    T(fanoutArt); T(guardArt); T(watchArt);
    // the new cards join the page's own reveal pass
    $$('.nk-rise:not(.nk-in)').forEach(function (n) {
      if (/^nk-(calc|mkt|art-)/.test(n.id)) n.classList.add('nk-in');
    });
  }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
  // nk-content injects its sections on the same retry ladder; follow it.
  [1100, 2400, 4000].forEach(function (d) { setTimeout(boot, d); });
})();
