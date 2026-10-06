/* Theme switch: System (default) -> Light -> Dark. Saved in localStorage.
   window.siteTheme lets the settings panel read/set the same mode; changes fire "sitethemechange" on document. */
(function () {
  var KEY = 'theme', ORDER = ['system', 'light', 'dark'];
  var LABEL = { system: 'System', light: 'Light', dark: 'Dark' };
  var BG = { light: '#e0eefc', dark: '#0e1626' };
  var root = document.documentElement;
  function saved() {
    try { var t = localStorage.getItem(KEY); return (t === 'light' || t === 'dark') ? t : 'system'; }
    catch (e) { return 'system'; }
  }
  function apply(mode) {
    if (mode === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', mode);
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      var scheme = (metas[i].getAttribute('media') || '').indexOf('dark') > -1 ? 'dark' : 'light';
      metas[i].setAttribute('content', mode === 'system' ? BG[scheme] : BG[mode]);
    }
  }
  function render(btn, mode) {
    if (!btn) return;
    var next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    btn.setAttribute('data-mode', mode);
    btn.setAttribute('aria-label', 'Theme: ' + LABEL[mode] + '. Switch to ' + LABEL[next]);
    btn.title = 'Theme: ' + LABEL[mode] + ' (click for ' + LABEL[next] + ')';
    var label = btn.querySelector('.theme-label');
    if (label) label.textContent = LABEL[mode];
  }
  function announce() {
    var ev;
    try { ev = new CustomEvent('sitethemechange', { detail: { mode: mode } }); }
    catch (e) { ev = document.createEvent('CustomEvent'); ev.initCustomEvent('sitethemechange', false, false, { mode: mode }); }
    document.dispatchEvent(ev);
  }
  function set(next, store) {
    if (ORDER.indexOf(next) < 0) next = 'system';
    mode = next;
    if (store !== false) {
      try { if (mode === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, mode); } catch (e) {}
    }
    apply(mode);
    render(btn, mode);
    announce();
  }
  var btn = document.getElementById('theme-toggle');
  var mode = saved();
  apply(mode);
  window.siteTheme = { get: function () { return mode; }, set: function (m) { set(m); } };
  window.addEventListener('storage', function (e) {
    if (e.key === KEY || e.key === null) set(saved(), false);
  });
  if (!btn) return;
  render(btn, mode);
  btn.hidden = false;
  btn.addEventListener('click', function () {
    set(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]);
  });
})();
