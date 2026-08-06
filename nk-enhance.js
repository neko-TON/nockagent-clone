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
      'background:rgba(3,11,6,.5);padding:.85rem .5rem .3rem}',
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
    var img = document.querySelector('img[src^="/mascot-archer"]');
    if (!img || img.__nkSwapping) return;
    img.__nkSwapping = 1;
    var cls = img.getAttribute('class') || '';
    fetch(img.getAttribute('src')).then(function (r) { return r.text(); }).then(function (txt) {
      var svg = new DOMParser().parseFromString(txt, 'image/svg+xml').documentElement;
      if (!svg || svg.nodeName.toLowerCase() !== 'svg') { img.__nkSwapping = 0; return; }
      svg.setAttribute('data-nk-mascot', '1');
      svg.setAttribute('class', cls);
      svg.style.aspectRatio = '536 / 462';
      svg.style.width = 'auto';
      img.replaceWith(svg);
      flyArrow(svg);
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

  /* 2b. the shot plays out as the page scrolls ------------------------ */
  var ARROW_TRAVEL = 168;   // nocked arrowhead (372) to just inside the bullseye (540)
  var NOCK_X = 250;         // where the string sits when drawn
  var REST_X = 346;         // where the string sits at rest, between the limb tips

  function flyArrow(svg) {
    var arrow = svg.querySelector('#nk-arrow');
    if (!arrow || arrow.__nkFly) return;
    arrow.__nkFly = 1;
    if (REDUCE) return;                    // leave it drawn, no shot

    var string = svg.querySelector('#nk-string');
    var hand = svg.querySelector('#nk-drawhand');
    var arm = svg.querySelectorAll('#nk-drawarm path');
    var ticking = false;

    function update() {
      // A short span: the whole shot resolves in a flick of the wheel.
      var span = Math.max(60, Math.min(110, window.innerHeight * 0.09));
      var prog = Math.max(0, Math.min(1, window.scrollY / span));

      // ease-out — the arrow leaves fast and settles into the target
      var flown = (1 - Math.pow(1 - prog, 2)) * ARROW_TRAVEL;
      arrow.setAttribute('transform', 'translate(' + flown.toFixed(1) + ' 0)');

      // the string stays in contact with the nock, then stops at rest:
      // that contact is what makes the release read as a push, not a slide
      if (string) {
        var mid = Math.min(NOCK_X + flown, REST_X);
        string.setAttribute('d', 'M346 170 L' + mid.toFixed(1) + ' 292 L346 414');
      }

      // the hand opens and travels back — follow-through, not a push
      var rel = Math.min(1, prog / 0.14);
      rel = 1 - Math.pow(1 - rel, 3);
      var hx = 246 - 30 * rel, hy = 292 - 22 * rel;
      if (hand) { hand.setAttribute('cx', hx.toFixed(1)); hand.setAttribute('cy', hy.toFixed(1)); }
      if (arm.length) {
        var d = 'M204 306 L' + (144 + 7 * rel).toFixed(1) + ' ' + (272 - 11 * rel).toFixed(1) +
                ' L' + hx.toFixed(1) + ' ' + hy.toFixed(1);
        for (var i = 0; i < arm.length; i++) arm[i].setAttribute('d', d);
      }
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
  }

  /* 3. route diagram -------------------------------------------------- */
  function node(x, y, label) {
    return '<circle cx="' + x + '" cy="' + y + '" r="20" fill="#0a120d" stroke="#2a6247" stroke-width="1.5"/>' +
      '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-family="var(--font-geist-mono),monospace" ' +
      'font-size="11" fill="#c2d6c9">' + label + '</text>';
  }
  var ROUTE =
    '<div id="nk-route"><div class="cap">Route comparison</div>' +
    '<svg viewBox="0 0 520 118" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M60 72 Q260 118 460 72" stroke="#20573c" stroke-width="1.5" stroke-dasharray="4 5" fill="none"/>' +
      '<text x="260" y="112" text-anchor="middle" font-family="var(--font-geist-mono),monospace" font-size="9" ' +
        'letter-spacing="1.2" fill="#5a6b60">DIRECT</text>' +
      '<path d="M60 72 Q150 32 260 32 Q370 32 460 72" stroke="#23c76f" stroke-width="2" fill="none"/>' +
      '<text x="260" y="20" text-anchor="middle" font-family="var(--font-geist-mono),monospace" font-size="9" ' +
        'letter-spacing="1.2" fill="#86d8a8">ROUTED · +0.22 NVDA</text>' +
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
