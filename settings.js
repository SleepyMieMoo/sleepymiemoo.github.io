/* Site settings panel: Effects (Full / Lite / Off), Interactive touches (On / Off) and Reduce motion.
   Theme lives on the header button. Saved in localStorage ("fx", "touches", "reduceMotion"); the inline head
   script applies them before first paint (data-fx, data-touches, data-motion on <html>).
   An explicit Reduce motion choice beats the OS prefers-reduced-motion setting. */
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
    var f = load('fx'), r = load('reduceMotion'), a = root.getAttribute('data-fx-auto');
    var touches = load('touches') !== '0';
    var fxSet = FX.indexOf(f) > -1, rmSet = r === '1' || r === '0';
    return {
      fx: fxSet ? f : (FX.indexOf(a) > -1 ? a : autoFx()),
      fxAuto: !fxSet,
      touches: touches,
      rm: rmSet ? r === '1' : !!(rmQuery && rmQuery.matches),
      rmAuto: !rmSet
    };
  }
  function apply() {
    var s = state();
    root.setAttribute('data-fx', s.fx);
    root.setAttribute('data-touches', s.touches ? 'on' : 'off');
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
  var opts = '';
  for (var i = 0; i < FX.length; i++) {
    opts += '<label><input type="radio" name="sp-fx" value="' + FX[i] + '"><span>' + FX_LABEL[FX[i]] + '</span></label>';
  }
  panel.innerHTML =
    '<div class="sp-head"><h2 id="sp-title">Site settings</h2>' +
    '<button type="button" class="sp-close" aria-label="Close settings"><span aria-hidden="true">&times;</span></button></div>' +
    '<fieldset class="sp-group" aria-describedby="sp-fx-hint"><legend>Effects</legend><div class="seg">' + opts + '</div>' +
    '<p class="sp-hint" id="sp-fx-hint"></p></fieldset>' +
    '<div class="sp-row"><span class="sp-label" id="sp-tc-label">Interactive touches</span>' +
    '<button type="button" class="switch sp-tc" role="switch" aria-checked="true" aria-labelledby="sp-tc-label" aria-describedby="sp-tc-hint"></button></div>' +
    '<p class="sp-hint" id="sp-tc-hint"></p>' +
    '<div class="sp-row"><span class="sp-label" id="sp-rm-label">Reduce motion</span>' +
    '<button type="button" class="switch sp-rm" role="switch" aria-checked="false" aria-labelledby="sp-rm-label" aria-describedby="sp-rm-hint"></button></div>' +
    '<p class="sp-hint" id="sp-rm-hint"></p>' +
    '<div class="sp-foot"><button type="button" class="sp-reset">Reset to defaults</button></div>';
  header.appendChild(panel);

  var fxInputs = panel.querySelectorAll('input[name="sp-fx"]');
  var sw = panel.querySelector('.sp-rm');
  var tcSw = panel.querySelector('.sp-tc');
  var tcHint = panel.querySelector('#sp-tc-hint');
  var fxHint = panel.querySelector('#sp-fx-hint');
  var rmHint = panel.querySelector('#sp-rm-hint');

  function render() {
    var s = apply();
    for (var i = 0; i < fxInputs.length; i++) fxInputs[i].checked = fxInputs[i].value === s.fx;
    sw.setAttribute('aria-checked', s.rm ? 'true' : 'false');
    tcSw.setAttribute('aria-checked', s.touches ? 'true' : 'false');
    tcHint.textContent = (s.rm && s.touches)
      ? 'Motion-based touches are paused while Reduce motion is on.'
      : 'Card glow, button shine, scroll reveals and cat reactions.';
    fxHint.textContent = s.rm
      ? 'Paused while Reduce motion is on.'
      : (s.fxAuto ? FX_LABEL[s.fx] + ' was picked for this device.' : 'Saved on this device.');
    rmHint.textContent = s.rmAuto
      ? (s.rm ? 'On because your device has animations turned off. Switch off to see the effects.' : 'Following your device setting.')
      : 'Saved on this device.';
    rmHint.classList.toggle('sp-note', s.rm && s.rmAuto);
  }

  for (var j = 0; j < fxInputs.length; j++) {
    fxInputs[j].addEventListener('change', function (e) { if (e.target.checked) { save('fx', e.target.value); render(); } });
  }
  sw.addEventListener('click', function () {
    save('reduceMotion', sw.getAttribute('aria-checked') === 'true' ? '0' : '1');
    render();
  });
  tcSw.addEventListener('click', function () {
    save('touches', tcSw.getAttribute('aria-checked') === 'true' ? '0' : null);   // default On: only "off" is stored
    render();
  });
  panel.querySelector('.sp-reset').addEventListener('click', function () {
    save('fx', null); save('reduceMotion', null); save('touches', null);
    root.removeAttribute('data-fx-auto');
    if (window.siteTheme) window.siteTheme.set('system');
    render();
  });

  function isOpen() { return !panel.hidden; }
  function open() {
    render();
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    (panel.querySelector('input[name="sp-fx"]:checked') || fxInputs[0]).focus();
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

  window.addEventListener('storage', function (e) {
    if (e.key === 'fx' || e.key === 'touches' || e.key === 'reduceMotion' || e.key === null) render();
  });
  if (rmQuery) {
    if (rmQuery.addEventListener) rmQuery.addEventListener('change', render); else if (rmQuery.addListener) rmQuery.addListener(render);
  }

  btn.setAttribute('aria-controls', panel.id);
  render();
  btn.hidden = false;
})();
