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
    '.nk-empty{padding:2rem .9rem;text-align:center;color:#6e6e6e;font-size:13.5px}'
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

  /* ---------------- boot ---------------- */
  function boot() {
    if (!document.__nkActDoc) {
      document.__nkActDoc = 1;
      document.addEventListener('click', dispatch, true);
    }
    T(liveTerminal); T(feeCalculator); T(marketFilter); T(roadmapRail);
    // the new cards join the page's own reveal pass
    $$('.nk-rise:not(.nk-in)').forEach(function (n) {
      if (n.id === 'nk-calc' || n.id === 'nk-mkt') n.classList.add('nk-in');
    });
  }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
  // nk-content injects its sections on the same retry ladder; follow it.
  [1100, 2400, 4000].forEach(function (d) { setTimeout(boot, d); });
})();
