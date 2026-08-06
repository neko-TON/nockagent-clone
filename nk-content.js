/* ============================================================
   None — content layer.
   Adds the reference sections (routing, fees, markets, safety,
   comparison, roadmap, FAQ), the FAQ accordion and the mobile menu.
   One quiet fade-up on reveal; no decorative motion.
   Injected after hydration; defensive and idempotent.
   ============================================================ */
(function () {
  if (window.__nkContent) return;
  window.__nkContent = 1;

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EYEBROW = 'font-mono text-xs uppercase tracking-[0.25em] text-accent';
  var H2 = 'mt-4 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl';
  var LEAD = 'mt-5 max-w-2xl text-muted';
  var CARD = 'rounded-2xl border border-border bg-surface/50 p-6';

  function T(fn) { try { fn(); } catch (e) {} }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }

  /* ---------------- styles ---------------- */
  var css = document.createElement('style');
  css.id = 'nk-content-css';
  css.textContent = [
    '.nk-rise{opacity:0;transform:translateY(28px);transition:opacity .8s cubic-bezier(.22,.61,.36,1),transform .8s cubic-bezier(.22,.61,.36,1)}',
    '.nk-rise.nk-in{opacity:1;transform:none}',
    /* headings that light up word by word as they scroll into view */
    '.nk-words .rw{opacity:.17;transition:opacity .35s cubic-bezier(.22,.61,.36,1)}',
    '.nk-words .rw.lit{opacity:1}',
    '.nk-tbl{width:100%;border-collapse:collapse;font-size:14px}',
    '.nk-tbl th{text-align:left;font-family:var(--font-geist-mono),monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:#8a9a90;padding:0 .9rem .7rem;font-weight:500}',
    '.nk-tbl td{padding:.85rem .9rem;border-top:1px solid var(--border);color:#c2d6c9;vertical-align:middle;line-height:1.6}',
    '.nk-tbl .mono{font-family:var(--font-geist-mono),monospace;font-variant-numeric:tabular-nums}',
    '.nk-scroll{overflow-x:auto}',
    '.nk-pill{display:inline-block;padding:.12rem .5rem;border-radius:5px;font-size:11px;font-family:var(--font-geist-mono),monospace;border:1px solid var(--border);color:#8a9a90}',
    '.nk-pill.g{border-color:rgba(35,199,111,.35);color:#86d8a8}',
    '.nk-pill.m{border-color:var(--border);color:#8a9a90}',
    '.nk-yes{color:#86d8a8}.nk-no{color:#5a6b60}.nk-mid{color:#8a9a90}',
    '.nk-q{border-top:1px solid var(--border)}',
    '.nk-q:last-child{border-bottom:1px solid var(--border)}',
    '.nk-qh{display:flex;align-items:center;justify-content:space-between;gap:1rem;width:100%;padding:1.05rem .2rem;cursor:pointer;text-align:left;background:none;border:0;color:#eaf4ee;font-size:15.5px;font-weight:600;font-family:inherit}',
    '.nk-qh:hover{color:#86d8a8}',
    '.nk-qi{flex:0 0 auto;width:16px;height:16px;position:relative}',
    '.nk-qi::before,.nk-qi::after{content:"";position:absolute;left:50%;top:50%;background:#8a9a90;border-radius:1px;transition:transform .25s ease}',
    '.nk-qi::before{width:12px;height:1.5px;transform:translate(-50%,-50%)}',
    '.nk-qi::after{width:1.5px;height:12px;transform:translate(-50%,-50%)}',
    '.nk-q.open .nk-qi::after{transform:translate(-50%,-50%) scaleY(0)}',
    '.nk-qb{max-height:0;overflow:hidden;transition:max-height .3s ease;padding:0 .2rem}',
    '.nk-q.open .nk-qb{padding-bottom:1.15rem}',
    '.nk-qb p{color:#8a9a90;font-size:14.5px;line-height:1.7;margin:0;max-width:62ch}',
    '.nk-tl{position:relative;padding-left:1.6rem;border-left:1px solid var(--border)}',
    '.nk-tli{position:relative;padding-bottom:1.9rem}',
    '.nk-tli:last-child{padding-bottom:0}',
    '.nk-tli::before{content:"";position:absolute;left:calc(-1.6rem - 4px);top:6px;width:7px;height:7px;border-radius:50%;background:#2a6247}',
    '.nk-tli.now::before{background:#23c76f}',
    '.nk-step{position:relative;padding-left:2.6rem}',
    '.nk-step .n{position:absolute;left:0;top:1px;font-family:var(--font-geist-mono),monospace;font-size:12px;color:#5a6b60}',
    REDUCE ? '.nk-rise{opacity:1;transform:none}' : ''
  ].join('\n');
  document.head.appendChild(css);

  /* ---------------- section factory ---------------- */
  function section(opts) {
    var alt = opts.alt ? ' border-y border-border/60 bg-surface/20' : '';
    var wrap = opts.alt ? '<div class="mx-auto max-w-6xl px-4 sm:px-6">' : '';
    var wrapEnd = opts.alt ? '</div>' : '';
    return el(
      '<section id="' + (opts.id || '') + '" class="' + (opts.alt ? 'scroll-mt-24 py-20' + alt : 'mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6') + '" data-nk-sec="1">' +
        wrap +
        '<div class="nk-rise"><div class="' + EYEBROW + '">' + opts.eyebrow + '</div>' +
        '<h2 class="' + H2 + '">' + opts.title + '</h2>' +
        (opts.lead ? '<p class="' + LEAD + '">' + opts.lead + '</p>' : '') + '</div>' +
        opts.body +
        wrapEnd +
      '</section>'
    );
  }


  /* ---------------- 2. routing deep dive ---------------- */
  function routingSection() {
    var steps = [
      ['01', 'Fan-out quoting', 'Every keystroke fires a parallel quote across Uniswap v2 (constant product), v3 (all four fee tiers: 0.01%, 0.05%, 0.30%, 1.00%) and v4 pools with hooks. Nothing is cached — each number comes from the on-chain quoter.'],
      ['02', 'Path search', 'Direct pairs are compared against multi-hop routes through the deep base assets — WETH and USDG — up to three hops. The router scores paths on <em>net</em> output, so gas and pool fees are subtracted before a winner is picked.'],
      ['03', 'Simulation', 'The winning path is simulated against current state before you ever see a signature prompt. If the simulation reverts or the price moved past tolerance, None re-quotes instead of pushing a stale route.'],
      ['04', 'Guarded settlement', 'The swap ships with a minimum-out and a deadline baked in. If the chain state changes underneath you, the transaction reverts and you keep your funds — a bad fill is impossible by construction.']
    ].map(function (s) {
      return '<div class="' + CARD + ' nk-rise nk-step"><div class="n">' + s[0] + '</div>' +
        '<h3 class="text-lg font-semibold">' + s[1] + '</h3>' +
        '<p class="mt-2 text-sm leading-relaxed text-muted">' + s[2] + '</p></div>';
    }).join('');
    return section({
      id: 'routing',
      eyebrow: 'Under the hood',
      title: 'How the router actually <span class="text-accent">finds the edge.</span>',
      lead: 'Four stages run between your sentence and a signed transaction. No black box — every stage is observable, and every number is pulled live from chain state.',
      body: '<div class="mt-12 grid gap-5 lg:grid-cols-2">' + steps + '</div>'
    });
  }

  /* ---------------- 3. fees ---------------- */
  function feesSection() {
    var rows = [
      ['None routing fee', '<span class="nk-pill g">0.00%</span>', 'No protocol cut. None does not take a spread, a rebate, or order flow payment.'],
      ['Uniswap pool fee', '<span class="mono">0.01% – 1.00%</span>', 'Paid to liquidity providers, not to None. The router prefers the tier with the best net output.'],
      ['Robinhood Chain gas', '<span class="mono">~$0.002</span>', 'Arbitrum L2 settlement. You pay it directly from your wallet, like any other transaction.'],
      ['Agent API (x402)', '<span class="mono">$0.01 / call</span>', 'Only for machine callers hitting the paid best-route endpoint. Humans using the app pay nothing.']
    ].map(function (r) {
      return '<tr><td class="font-semibold text-foreground">' + r[0] + '</td><td>' + r[1] + '</td><td class="text-muted">' + r[2] + '</td></tr>';
    }).join('');
    return section({
      id: 'fees', alt: true,
      eyebrow: 'Fees',
      title: 'What a trade costs — <span class="text-accent">all of it.</span>',
      lead: 'The whole cost stack, in one table. If a fee is not on this list, None does not charge it.',
      body: '<div class="mt-10 nk-rise ' + CARD + ' nk-scroll"><table class="nk-tbl">' +
        '<thead><tr><th>Line item</th><th>Cost</th><th>Who receives it</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="mt-4 text-xs text-muted">Pool fees and gas are network costs paid to liquidity providers and validators. None never custodies funds, so there is no withdrawal or deposit fee to charge.</p>'
    });
  }

  /* ---------------- 4. markets ---------------- */
  function marketsSection() {
    var rows = [
      ['NVDA', 'NVIDIA', 'Tokenized equity', 'USDG · WETH', '24/5'],
      ['AAPL', 'Apple', 'Tokenized equity', 'USDG · WETH', '24/5'],
      ['TSLA', 'Tesla', 'Tokenized equity', 'USDG · WETH', '24/5'],
      ['COIN', 'Coinbase', 'Tokenized equity', 'USDG', '24/5'],
      ['MSFT', 'Microsoft', 'Tokenized equity', 'USDG', '24/5'],
      ['AMZN', 'Amazon', 'Tokenized equity', 'USDG', '24/5'],
      ['GOOGL', 'Alphabet', 'Tokenized equity', 'USDG', '24/5'],
      ['META', 'Meta', 'Tokenized equity', 'USDG', '24/5'],
      ['ETH', 'Ether', 'Crypto', 'USDG', '24/7'],
      ['USDG', 'Stablecoin', 'Base asset', '—', '24/7']
    ].map(function (r) {
      var hours = r[4] === '24/7' ? '<span class="nk-pill g">24/7</span>' : '<span class="nk-pill">24/5</span>';
      return '<tr><td class="mono font-semibold text-foreground">' + r[0] + '</td><td>' + r[1] + '</td>' +
        '<td><span class="nk-pill m">' + r[2] + '</span></td><td class="mono text-muted">' + r[3] + '</td><td>' + hours + '</td></tr>';
    }).join('');
    return section({
      id: 'markets',
      eyebrow: 'Markets',
      title: 'Tokenized stocks and crypto, <span class="text-accent">side by side.</span>',
      lead: 'Equities follow US market hours and settle against deep stablecoin and ETH pools. Crypto never sleeps. Both route through the same engine, from the same sentence.',
      body: '<div class="mt-10 nk-rise ' + CARD + ' nk-scroll"><table class="nk-tbl">' +
        '<thead><tr><th>Symbol</th><th>Name</th><th>Class</th><th>Base pairs</th><th>Hours</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="mt-4 text-xs text-muted">Tokenized equities halt with the underlying market. When a venue is closed, None says so rather than quoting a price nobody can fill.</p>'
    });
  }

  /* ---------------- 5. security ---------------- */
  function securitySection() {
    var items = [
      ['Your keys, always', 'None never takes custody. There is no deposit address, no omnibus wallet, no withdrawal queue. The agent builds a transaction; your wallet signs it.'],
      ['Scoped approvals', 'Approvals are scoped to the token and amount for the swap at hand. None never asks for an unlimited allowance on your whole balance.'],
      ['Standard contracts', 'Settlement runs through canonical, verified Uniswap routers on Robinhood Chain. No bespoke vault, no upgradeable proxy holding your funds.'],
      ['No admin key over funds', 'There is no privileged role that can move, freeze, or claw back user balances — because user balances never leave user wallets.'],
      ['Fails closed', 'Every trade carries a minimum-out and a deadline. Adverse movement reverts the transaction instead of filling you at a worse price.'],
      ['Honest failure', 'If a pool is dry or a route does not exist, None returns nothing and says why. It will not synthesize a quote to look useful.']
    ].map(function (i) {
      return '<div class="' + CARD + ' nk-rise"><h3 class="text-lg font-semibold">' + i[0] + '</h3>' +
        '<p class="mt-2 text-sm leading-relaxed text-muted">' + i[1] + '</p></div>';
    }).join('');
    return section({
      id: 'security', alt: true,
      eyebrow: 'Safety',
      title: 'Non-custodial is a <span class="text-accent">structure, not a promise.</span>',
      lead: 'Security here is not a policy you have to trust — it follows from where the funds sit. They sit in your wallet, the entire time.',
      body: '<div class="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">' + items + '</div>'
    });
  }

  /* ---------------- 6. comparison ---------------- */
  function compareSection() {
    var Y = '<span class="nk-yes">✓</span>', N = '<span class="nk-no">—</span>', M = '<span class="nk-mid">~</span>';
    var rows = [
      ['Plain-language orders', Y, N, N],
      ['Routes every venue automatically', Y, M, N],
      ['Shows the naive-vs-routed difference', Y, N, N],
      ['You keep custody of funds', Y, Y, N],
      ['Tokenized stocks + crypto in one place', Y, M, M],
      ['No account, no KYC queue to trade', Y, Y, N],
      ['Settles in a single signed transaction', Y, M, N],
      ['Machine-callable API with per-call pricing', Y, N, M]
    ].map(function (r) {
      return '<tr><td class="text-foreground">' + r[0] + '</td><td class="text-center">' + r[1] + '</td><td class="text-center">' + r[2] + '</td><td class="text-center">' + r[3] + '</td></tr>';
    }).join('');
    return section({
      id: 'compare',
      eyebrow: 'Comparison',
      title: 'Against a DEX tab <span class="text-accent">and an exchange app.</span>',
      lead: 'Where None sits relative to trading by hand on a DEX interface, or handing your assets to a centralized venue.',
      body: '<div class="mt-10 nk-rise ' + CARD + ' nk-scroll"><table class="nk-tbl">' +
        '<thead><tr><th></th><th class="!text-center" style="color:#86d8a8">None</th><th class="!text-center">DEX interface</th><th class="!text-center">Centralized app</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>' +
        '<p class="mt-4 text-xs text-muted">✓ built in · ~ partial or manual · — not available. Comparison reflects typical behaviour, not any single named product.</p>'
    });
  }

  /* ---------------- 7. roadmap ---------------- */
  function roadmapSection() {
    var items = [
      ['Shipped', 'Best-route engine', 'Parallel quoting across Uniswap v2/v3/v4, multi-hop path search, guarded single-transaction settlement.', true],
      ['Shipped', 'x402 agent endpoint', 'Machine callers pay per request in USDG over HTTP 402 — no account, no card, no API key handshake.', true],
      ['In progress', 'Intent orders', 'Resting instructions the agent watches for you: limit entries, take-profit legs, and slippage-aware scaling into a position.', false],
      ['Next', 'Portfolio view', 'Ask about exposure in plain language — concentration, unrealized P&L, and what a rebalance would actually cost to execute.', false],
      ['Exploring', 'Cross-venue expansion', 'Extending the same routing contract to additional venues and chains, keeping one sentence as the entire interface.', false]
    ].map(function (r) {
      var tag = r[3] ? '<span class="nk-pill g">' + r[0] + '</span>' : '<span class="nk-pill">' + r[0] + '</span>';
      return '<div class="nk-tli nk-rise' + (r[0] === 'In progress' ? ' now' : '') + '">' + tag +
        '<h3 class="mt-2 text-lg font-semibold">' + r[1] + '</h3>' +
        '<p class="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">' + r[2] + '</p></div>';
    }).join('');
    return section({
      id: 'roadmap', alt: true,
      eyebrow: 'Roadmap',
      title: 'What is live, and <span class="text-accent">what is coming.</span>',
      lead: 'No dates we cannot keep. Shipped means you can use it today; everything else is stated as intent, not as a promise.',
      body: '<div class="mt-12 nk-tl">' + items + '</div>'
    });
  }

  /* ---------------- 8. FAQ ---------------- */
  function faqSection() {
    var qs = [
      ['Do I need to understand DeFi to use this?',
       'No. You type the outcome you want — "buy $5,000 of NVDA" — and the agent handles pools, fee tiers, routing and calldata. The only DeFi step left is approving the transaction in your own wallet.'],
      ['Does None ever hold my funds?',
       'Never. There is no deposit step. Your assets stay in your wallet until the moment your signed swap executes, and the proceeds land back in the same wallet.'],
      ['How do I know the "extra received" number is real?',
       'It is the difference between a naive direct swap and the route None actually built, both quoted from the on-chain quoter at the same block. If the routed path is not better, the difference shows as zero — it is not a marketing figure.'],
      ['What happens if the price moves while I am signing?',
       'Every trade carries a minimum-out and a deadline. If the market moves past your tolerance before the transaction lands, it reverts and you keep your funds. You are never filled at a surprise price.'],
      ['Can I trade tokenized stocks at 3am?',
       'Crypto pairs trade around the clock. Tokenized equities follow the underlying market and trade 24/5 — when a market is closed, None tells you instead of quoting an unfillable price.'],
      ['Is there a None token?',
       'No. There is no presale, no farm, no VC unlock and no token required to use the product. The agent is a tool, not a fundraise.'],
      ['What is x402 and why should I care?',
       'It is an HTTP payment standard: a request returns 402 Payment Required, the caller signs a stablecoin authorization, and the call goes through. It lets other agents pay None per query in USDG without an account or a credit card.'],
      ['Which wallets work?',
       'Any standard EVM wallet that can sign on Robinhood Chain, an Arbitrum L2. You connect in one click and approve each trade individually.']
    ].map(function (q, i) {
      return '<div class="nk-q nk-rise" data-nk-q="' + i + '">' +
        '<button class="nk-qh" aria-expanded="false"><span>' + q[0] + '</span><span class="nk-qi" aria-hidden="true"></span></button>' +
        '<div class="nk-qb"><p>' + q[1] + '</p></div></div>';
    }).join('');
    return section({
      id: 'faq',
      eyebrow: 'FAQ',
      title: 'Questions people <span class="text-accent">actually ask.</span>',
      lead: 'Short answers, no hedging. If something here is still unclear, the docs go deeper.',
      body: '<div class="mt-10 max-w-3xl">' + qs + '</div>'
    });
  }

  /* ---------------- mount ---------------- */
  function anchorSections() {
    var secs = [].slice.call(document.querySelectorAll('section'));
    var byEyebrow = {};
    secs.forEach(function (s) {
      var e = s.querySelector('[class*="tracking-["]');
      if (e) byEyebrow[e.textContent.trim().toLowerCase()] = s;
    });
    return { secs: secs, byEyebrow: byEyebrow };
  }

  function mount() {
    if (document.querySelector('[data-nk-sec]')) return;
    var a = anchorSections();
    var whatSec = document.getElementById('what');
    var productSec = document.getElementById('product');
    var noToken = a.byEyebrow['no token games'];
    var x402 = a.byEyebrow['agent-payable · x402'];
    if (!whatSec || !productSec) return;

    function after(ref, node) { if (ref && ref.parentNode) { ref.parentNode.insertBefore(node, ref.nextSibling); return node; } return null; }

    after(whatSec, routingSection());
    var f = after(productSec, feesSection());
    if (f) after(f, marketsSection());
    var beforeRef = noToken || x402;
    if (beforeRef && beforeRef.parentNode) {
      beforeRef.parentNode.insertBefore(securitySection(), beforeRef);
      beforeRef.parentNode.insertBefore(compareSection(), beforeRef);
    }
    // roadmap + FAQ before the x402 section
    if (x402 && x402.parentNode) {
      x402.parentNode.insertBefore(roadmapSection(), x402);
      x402.parentNode.insertBefore(faqSection(), x402);
    }

    bindFAQ();
    observeRise();
    addNav();
  }

  /* ---------------- FAQ behaviour ---------------- */
  function bindFAQ() {
    [].forEach.call(document.querySelectorAll('.nk-q'), function (q) {
      if (q.__nk) return; q.__nk = 1;
      var head = q.querySelector('.nk-qh'), body = q.querySelector('.nk-qb');
      head.addEventListener('click', function () {
        var open = q.classList.contains('open');
        // close siblings for an accordion feel
        [].forEach.call(document.querySelectorAll('.nk-q.open'), function (o) {
          if (o !== q) { o.classList.remove('open'); o.querySelector('.nk-qb').style.maxHeight = '0px'; o.querySelector('.nk-qh').setAttribute('aria-expanded', 'false'); }
        });
        if (open) { q.classList.remove('open'); body.style.maxHeight = '0px'; head.setAttribute('aria-expanded', 'false'); }
        else { q.classList.add('open'); body.style.maxHeight = (body.scrollHeight + 24) + 'px'; head.setAttribute('aria-expanded', 'true'); }
      });
    });
  }

  /* ---------------- rise-in + counters ---------------- */
  var riseIO = null;
  function observeRise() {
    var targets = document.querySelectorAll('.nk-rise:not(.nk-in), .nk-tl:not(.nk-in)');
    if (!('IntersectionObserver' in window) || REDUCE) {
      [].forEach.call(targets, function (t) { t.classList.add('nk-in'); });
      return;
    }
    if (!riseIO) riseIO = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target;
        riseIO.unobserve(t);
        var sibs = t.parentElement ? [].slice.call(t.parentElement.children).filter(function (c) { return c.classList.contains('nk-rise'); }) : [];
        var idx = Math.max(0, sibs.indexOf(t));
        setTimeout(function () { t.classList.add('nk-in'); }, Math.min(idx * 60, 240));
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    [].forEach.call(targets, function (t) { riseIO.observe(t); });
  }


  /* ---------------- word-by-word heading reveal ---------------- */
  var wordHeads = [];
  function splitWords(root) {
    // wrap every word in its own span, but keep inline elements
    // (the accent fragments) intact so they hold their own colour
    var out = [];
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span');
            s.className = 'rw';
            s.textContent = p;
            frag.appendChild(s);
            out.push(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    })(root);
    return out;
  }

  function initWordHeads() {
    if (REDUCE) return;
    var hs = document.querySelectorAll('[data-nk-sec] h2');
    for (var i = 0; i < hs.length; i++) {
      var h = hs[i];
      if (h.__nkWords) continue;
      h.__nkWords = 1;
      var words = splitWords(h);
      if (!words.length) continue;
      h.classList.add('nk-words');
      wordHeads.push({ el: h, words: words });
    }
    if (wordHeads.length && !window.__nkWordScroll) {
      window.__nkWordScroll = 1;
      var ticking = false;
      function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { updateWords(); ticking = false; });
      }
      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onScroll);
    }
    updateWords();
  }

  function updateWords() {
    var vh = window.innerHeight;
    for (var i = 0; i < wordHeads.length; i++) {
      var w = wordHeads[i];
      var top = w.el.getBoundingClientRect().top;
      // progress runs from "heading enters the lower fifth" to half a screen later
      var prog = (vh * 0.82 - top) / (vh * 0.5);
      prog = Math.max(0, Math.min(1, prog));
      var lit = Math.round(prog * w.words.length);
      for (var j = 0; j < w.words.length; j++) {
        w.words[j].classList.toggle('lit', j < lit);
      }
    }
  }

  /* ---------------- nav links for new sections ---------------- */
  function addNav() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    var links = nav.querySelectorAll('a[href^="/#"]');
    if (!links.length || nav.querySelector('[data-nk-nav]')) return;
    var last = links[links.length - 1];
    [['Markets', '/#markets'], ['FAQ', '/#faq']].forEach(function (l) {
      if (nav.querySelector('a[href="' + l[1] + '"]')) return;
      var a = document.createElement('a');
      a.setAttribute('href', l[1]); a.setAttribute('data-nk-nav', '1');
      a.className = last.className; a.textContent = l[0];
      last.parentNode.insertBefore(a, last.nextSibling);
      last = a;
    });
  }

  /* ---------------- smooth in-page anchors ---------------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="/#"], a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').split('#')[1];
    var t = id && document.getElementById(id);
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  });

  /* ---------------- mobile burger menu ---------------- */
  function addBurger() {
    var nav = document.querySelector('nav');
    if (!nav || document.getElementById('nk-burger')) return;
    var links = [].slice.call(nav.querySelectorAll('a[href^="/#"], a[href="/docs"], a[href="/app"]'));
    if (!links.length) return;

    var st = document.getElementById('nk-burger-css');
    if (!st) {
      st = document.createElement('style'); st.id = 'nk-burger-css';
      st.textContent = [
        '#nk-burger{display:none;position:fixed;top:1.42rem;right:1.55rem;z-index:75;width:38px;height:34px;',
          'border:1px solid var(--border);border-radius:10px;background:rgba(10,18,13,.9);backdrop-filter:blur(8px);cursor:pointer;padding:8px 9px}',
        '#nk-burger span{display:block;height:2px;background:var(--foreground);border-radius:2px;transition:transform .3s cubic-bezier(.16,1,.3,1),opacity .2s}',
        '#nk-burger span+span{margin-top:4px}',
        '#nk-burger[aria-expanded="true"] span:nth-child(1){transform:translateY(6px) rotate(45deg)}',
        '#nk-burger[aria-expanded="true"] span:nth-child(2){opacity:0}',
        '#nk-burger[aria-expanded="true"] span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}',
        '#nk-mobile{position:fixed;left:.75rem;right:.75rem;top:5.4rem;z-index:70;display:flex;flex-direction:column;gap:.15rem;',
          'border:1px solid var(--border);border-radius:18px;padding:.6rem;background:rgba(10,18,13,.97);backdrop-filter:blur(14px);',
          'box-shadow:0 30px 70px -30px rgba(0,0,0,.95);animation:nkDrop .28s cubic-bezier(.16,1,.3,1)}',
        '@keyframes nkDrop{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}',
        '#nk-mobile a{text-decoration:none;color:var(--foreground);padding:.75rem .9rem;border-radius:12px;font-size:15px}',
        '#nk-mobile a:hover{background:rgba(255,255,255,.06)}',
        '#nk-mobile a.cta{margin-top:.3rem;text-align:center;font-weight:700;color:#04140a;background:linear-gradient(135deg,#2fd882,#23c76f 46%,#12b45f)}',
        '@media (max-width:880px){#nk-burger{display:block}nav a[href^="/#"],nav a[href="/docs"]{display:none}}'
      ].join('\n');
      document.head.appendChild(st);
    }

    // Mounted on <body>, not inside the React-managed <nav>: the nav subtree
    // swallows click propagation and gets re-rendered, which strips listeners.
    var b = document.createElement('button');
    b.id = 'nk-burger'; b.setAttribute('aria-label', 'Menu'); b.setAttribute('aria-expanded', 'false');
    b.innerHTML = '<span></span><span></span><span></span>';
    document.body.appendChild(b);

    // state lives in the DOM, so a duplicate binding can never desync it
    function close() {
      b.setAttribute('aria-expanded', 'false');
      var p = document.getElementById('nk-mobile');
      if (p) p.remove();
    }
    function open() {
      if (document.getElementById('nk-mobile')) return;
      b.setAttribute('aria-expanded', 'true');
      var panel = document.createElement('div');
      panel.id = 'nk-mobile';
      var html = '';
      links.forEach(function (a) {
        var h = a.getAttribute('href'), t = (a.textContent || '').trim();
        if (!t) return;
        html += '<a href="' + h + '"' + (h === '/app' ? ' class="cta"' : '') + '>' + t + '</a>';
      });
      if (!/href="\/app"/.test(html)) html += '<a href="/app" class="cta">Launch app</a>';
      panel.innerHTML = html;
      document.body.appendChild(panel);
      panel.addEventListener('click', function (ev) { if (ev.target.tagName === 'A') close(); });
    }
    // Direct binding — safe now that the button lives on <body>, and it works
    // even if something upstream stops click propagation before <document>.
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (document.getElementById('nk-mobile')) close(); else open();
    });

    // Delegated on document as a backstop for re-created nodes.
    if (!document.__nkBurgerDoc) {
      document.__nkBurgerDoc = 1;
      document.addEventListener('click', function (e) {
        var hitBurger = e.target.closest && e.target.closest('#nk-burger');
        if (hitBurger) {
          e.preventDefault(); e.stopPropagation();
          if (document.getElementById('nk-mobile')) close(); else open();
          return;
        }
        var p = document.getElementById('nk-mobile');
        if (p && !p.contains(e.target)) close();
      });
      addEventListener('resize', function () { if (innerWidth > 880) close(); });
    }
  }

  function boot() { T(mount); T(bindFAQ); T(observeRise); T(initWordHeads); T(addNav); T(addBurger); }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
  [900, 2000, 3600].forEach(function (d) { setTimeout(boot, d); });
})();
