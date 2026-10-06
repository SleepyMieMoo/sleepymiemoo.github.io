/* Small-screen menu: the header nav collapses behind a menu button (<= 760px, see styles.css).
   Disclosure pattern: aria-expanded/aria-controls, Esc closes and returns focus,
   closes on link click, outside click, focus leaving, or growing back to desktop width. */
(function () {
  var header = document.querySelector('header.nav');
  var btn = document.getElementById('menu-toggle');
  var nav = document.getElementById('main-nav');
  if (!header || !btn || !nav) return;
  var small = window.matchMedia ? window.matchMedia('(max-width: 760px)') : null;

  function isOpen() { return btn.getAttribute('aria-expanded') === 'true'; }
  function open() {
    header.classList.add('menu-open');
    btn.setAttribute('aria-expanded', 'true');
    var first = nav.querySelector('a');
    if (first) first.focus();
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onPointer, true);
  }
  function close(returnFocus) {
    if (!isOpen()) return;
    header.classList.remove('menu-open');
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('pointerdown', onPointer, true);
    if (returnFocus) btn.focus();
  }
  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); close(true); }
  }
  function onPointer(e) {
    if (!nav.contains(e.target) && !btn.contains(e.target)) close(false);
  }
  btn.addEventListener('click', function () { if (isOpen()) close(true); else open(); });
  nav.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) close(false); });
  nav.addEventListener('focusout', function (e) {
    var to = e.relatedTarget;
    if (isOpen() && to && !nav.contains(to) && to !== btn) close(false);
  });
  if (small) {
    var onChange = function () { if (!small.matches) close(false); };
    if (small.addEventListener) small.addEventListener('change', onChange); else if (small.addListener) small.addListener(onChange);
  }
  btn.hidden = false;
})();
