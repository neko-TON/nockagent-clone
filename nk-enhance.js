/* Nock design-enhancement layer — cursor spotlight on cards (progressive, safe) */
(function () {
  if (window.__nkEnhance) return;
  window.__nkEnhance = 1;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var SEL = '[class*="rounded-2xl"][class*="border-border"][class*="bg-surface"],' +
            '[class*="rounded-3xl"][class*="border-border"][class*="bg-surface"]';

  function bind() {
    var cards = document.querySelectorAll(SEL);
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (c.__nkBound) continue;
      c.__nkBound = 1;
      c.addEventListener('pointermove', onMove);
      c.addEventListener('pointerleave', onLeave);
    }
  }
  function onMove(e) {
    var r = this.getBoundingClientRect();
    this.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    this.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }
  function onLeave() {
    this.style.setProperty('--mx', '-400px');
    this.style.setProperty('--my', '-400px');
  }

  if (document.readyState !== 'loading') bind();
  else document.addEventListener('DOMContentLoaded', bind);
  // Re-bind after Next.js hydration in case nodes are reconciled.
  setTimeout(bind, 1500);
  setTimeout(bind, 3500);
})();
