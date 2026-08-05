/* Shared behaviour for /docs and /app: mobile menu + sidebar scroll-spy. */
(function () {
  var burger = document.querySelector('.nk-burger');
  var panel = document.querySelector('.nk-mobile');
  if (burger && panel) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.hidden = open;
    });
    panel.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { burger.setAttribute('aria-expanded', 'false'); panel.hidden = true; }
    });
    addEventListener('resize', function () {
      if (innerWidth > 880) { burger.setAttribute('aria-expanded', 'false'); panel.hidden = true; }
    });
  }

  // sidebar scroll-spy
  var links = [].slice.call(document.querySelectorAll('.nk-side a[href^="#"]'));
  if (links.length && 'IntersectionObserver' in window) {
    var map = {};
    links.forEach(function (a) {
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (t) map[t.id] = a;
    });
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('on'); });
        var a = map[en.target.id];
        if (a) a.classList.add('on');
      });
    }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }
})();
