/* Site settings panel: Theme (shared with the header button), Effects (Full / Lite / Off) and Reduce motion.
   Saved in localStorage ("fx", "reduceMotion"); the inline head script applies them before first paint. */
(function () {
  var root = document.documentElement;
  var FX = ['full', 'lite', 'off'];
  var FX_LABEL = { full: 'Full', lite: 'Lite', off: 'Off' };
  var rmQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function mq(q) { return !!(window.matchMedia && window.matchMedia(q).matches); }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function save(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function autoFx() {
    var n = navigator, c = n.connection;
    return (mq('(max-width:600px)') || (n.hardwareConcurrency && n.hardwareConcurrency <= 4) || (c && c.saveData)) ? 'lite' : 'full';
  }
  function state() {
    var f = load('fx'), r = load('reduceMotion');
    var fxSet = FX.indexOf(f) > -1, rmSet = r === '1' || r === '0';
    return {
      fx: fxSet ? f : (FX.indexOf(root.getAttribute('data-fx-auto')) > -1 ? root.getAttribute('data-fx-auto') : autoFx()),
      fxAuto: !fxSet,
      rm: rmSet ? r === '1' : !!(rmQuery && rmQuery.matches),
      rmAuto: !rmSet
    };
  }
  function apply() {
    var s = state();
    root.setAttribute('data-fx', s.fx);
    root.setAttribute('data-motion', s.rm ? 'reduce' : 'ok');
    return s;
  }

  var btn = document.getElementById('settings-toggle');
  var header = btn && btn.parentNode;
  if (!btn || !header) { apply(); return; }

  var panel = document.createElement('div');
  panel.className = 'settings-panel';
  panel.id = 'site-settings';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-labelledby', 'sp-title');
  panel.hidden = true;
  function seg(name, items) {
    var h = '';
    for (var i = 0; i < items.length; i++) {
      h += '<label><input type="radio" name="' + name + '" value="' + items[i][0] + '"><span>' + items[i][1] + '</span></label>';
    }
    return '<div class="seg">' + h + '</div>';
  }
  panel.innerHTML =
    '<div class="sp-head"><h2 id="sp-title">Site settings</h2>' +
    '<button type="button" class="sp-close" aria-label="Close settings"><span aria-hidden="true">&times;</span></button></div>' +
    '<fieldset class="sp-group"><legend>Theme</legend>' + seg('sp-theme', [['light', 'Light'], ['dark', 'Dark'], ['system', 'System']]) + '</fieldset>' +
    '<fieldset class="sp-group" aria-describedby="sp-fx-hint"><legend>Effects</legend>' + seg('sp-fx', [['full', 'Full'], ['lite', 'Lite'], ['off', 'Off']]) +
    '<p class="sp-hint" id="sp-fx-hint"></p></fieldset>' +
    '<div class="sp-row"><span class="sp-label" id="sp-rm-label">Reduce motion</span>' +
    '<button type="button" class="switch" role="switch" aria-checked="false" aria-labelledby="sp-rm-label" aria-describedby="sp-rm-hint"></button></div>' +
    '<p class="sp-hint" id="sp-rm-hint"></p>' +
    '<div class="sp-foot"><button type="button" class="sp-reset">Reset to defaults</button></div>';
  header.appendChild(panel);

  var themeInputs = panel.querySelectorAll('input[name="sp-theme"]');
  var fxInputs = panel.querySelectorAll('input[name="sp-fx"]');
  var sw = panel.querySelector('.switch');
  var fxHint = panel.querySelector('#sp-fx-hint');
  var rmHint = panel.querySelector('#sp-rm-hint');

  function check(inputs, value) {
    for (var i = 0; i < inputs.length; i++) inputs[i].checked = inputs[i].value === value;
  }
  function currentTheme() {
    if (window.siteTheme) return window.siteTheme.get();
    var t = load('theme'); return (t === 'light' || t === 'dark') ? t : 'system';
  }
  function render() {
    var s = apply();
    check(themeInputs, currentTheme());
    check(fxInputs, s.fx);
    sw.setAttribute('aria-checked', s.rm ? 'true' : 'false');
    fxHint.textContent = s.rm
      ? 'Animations are paused while Reduce motion is on.'
      : (s.fxAuto ? FX_LABEL[s.fx] + ' was picked for this device.' : 'Saved on this device.');
    rmHint.textContent = s.rmAuto ? 'Following your device setting.' : 'Saved on this device.';
  }

  function onChange(inputs, fn) {
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener('change', function (e) { if (e.target.checked) fn(e.target.value); });
    }
  }
  onChange(themeInputs, function (v) {
    if (window.siteTheme) window.siteTheme.set(v);
    else { save('theme', v === 'system' ? null : v); if (v === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', v); }
    render();
  });
  onChange(fxInputs, function (v) { save('fx', v); render(); });
  sw.addEventListener('click', function () {
    save('reduceMotion', sw.getAttribute('aria-checked') === 'true' ? '0' : '1');
    render();
  });
  panel.querySelector('.sp-reset').addEventListener('click', function () {
    save('fx', null); save('reduceMotion', null);
    root.removeAttribute('data-fx-auto');
    if (window.siteTheme) window.siteTheme.set('system'); else { save('theme', null); root.removeAttribute('data-theme'); }
    render();
  });

  function isOpen() { return !panel.hidden; }
  function open() {
    render();
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    var first = panel.querySelector('input[name="sp-theme"]:checked') || themeInputs[0];
    if (first) first.focus();
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onPointer, true);
  }
  function close(returnFocus) {
    if (!isOpen()) return;
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('pointerdown', onPointer, true);
    if (returnFocus) btn.focus();
  }
  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); close(true); }
  }
  function onPointer(e) {
    if (!panel.contains(e.target) && !btn.contains(e.target)) close(false);
  }
  panel.addEventListener('focusout', function (e) {
    var to = e.relatedTarget;
    if (to && !panel.contains(to) && to !== btn) close(false);
  });
  panel.querySelector('.sp-close').addEventListener('click', function () { close(true); });
  btn.addEventListener('click', function () { if (isOpen()) close(true); else open(); });

  document.addEventListener('sitethemechange', function () { check(themeInputs, currentTheme()); });
  window.addEventListener('storage', function (e) {
    if (e.key === 'fx' || e.key === 'reduceMotion' || e.key === null) render();
  });
  if (rmQuery) {
    var onRm = function () { render(); };
    if (rmQuery.addEventListener) rmQuery.addEventListener('change', onRm); else if (rmQuery.addListener) rmQuery.addListener(onRm);
  }

  btn.setAttribute('aria-controls', panel.id);
  render();
  btn.hidden = false;
})();
