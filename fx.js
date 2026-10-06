/* Homepage sky effects: organic orb drift that speeds up while you scroll, star parallax,
   a dense box-shadow starfield, and a gentle cloud nudge in Day mode.
   Only transform/opacity are written. The loop stops when Effects is Off, Reduce motion is on,
   or the tab is hidden. No layout reads inside the loop (positions are measured on resize only). */
(function () {
  var root = document.documentElement;
  var sky = document.querySelector('.sky');
  if (!sky || !window.requestAnimationFrame) return;
  root.classList.add('fx-js');

  var field = document.querySelector('.starfield');
  var TILE = 800;              // starfield repeats every TILE px, so its parallax can wrap seamlessly
  var seed = 20261006;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function between(a, b) { return a + (b - a) * rnd(); }
  function list(sel) { return Array.prototype.slice.call(sky.querySelectorAll(sel)); }

  /* Dense starfield: a few box-shadow layers (each twinkles as a group, out of phase with the others). */
  if (field) {
    var layers = field.querySelectorAll('.sf');
    var counts = [64, 52, 30, 10];
    var shapes = ['0 0', '0 .35px', '.6px .7px', '3px 1.1px'];   // blur spread
    var reps = Math.ceil(((window.screen && screen.height) || 1200) / TILE) + 2;
    for (var L = 0; L < layers.length; L++) {
      var pts = [];
      for (var i = 0; i < (counts[L] || 30); i++) {
        var x = between(0, 100).toFixed(2), y = Math.round(between(0, TILE));
        var tint = rnd() < 0.22 ? ' var(--accent)' : '';
        for (var r = 0; r < reps; r++) pts.push(x + 'vw ' + (y + r * TILE) + 'px ' + (shapes[L] || '0 0') + tint);
      }
      layers[L].style.boxShadow = pts.join(',');
    }
  }

  /* Per-element motion parameters (seeded so the sky is the same every visit). */
  var TAU = Math.PI * 2;
  var orbs = list('.orb').map(function (el) {
    return {
      el: el, cy: 0, o: 0.5,
      ax: between(34, 84), ay: between(26, 62),
      fx1: TAU / between(13, 24), fx2: TAU / between(6, 11), fy1: TAU / between(15, 27), fy2: TAU / between(7, 12),
      px1: between(0, TAU), px2: between(0, TAU), py1: between(0, TAU), py2: between(0, TAU),
      fs: TAU / between(11, 23), ps: between(0, TAU), sa: between(0.05, 0.12),
      fo: TAU / between(9, 17), po: between(0, TAU),
      depth: between(0.08, 0.2), lag: between(0.6, 1.4)
    };
  });
  var stars = list('.star').map(function (el) { return { el: el, cy: 0, depth: between(0.24, 0.36) }; });
  var clouds = list('.cloud').map(function (el) { return { el: el, cy: 0, depth: between(0.03, 0.08), dir: rnd() < 0.5 ? -1 : 1 }; });

  var vh = window.innerHeight, sy = window.pageYOffset || 0;
  function measure() {
    vh = window.innerHeight;
    var all = orbs.concat(stars, clouds);
    for (var i = 0; i < all.length; i++) all[i].cy = all[i].el.offsetTop + all[i].el.offsetHeight / 2;
    for (var j = 0; j < orbs.length; j++) {
      var o = parseFloat(getComputedStyle(orbs[j].el).getPropertyValue('--o'));
      orbs[j].o = isNaN(o) ? 0.5 : o;
    }
  }

  var state = { fx: 'full', rm: false, night: true, on: false };
  var running = false, raf = 0, last = 0, lastDraw = 0, lastSy = sy, T = 0;
  var vel = 0, boost = 0, inY = 0, inV = 0;

  function readState() {
    state.fx = root.getAttribute('data-fx') || 'full';
    state.rm = root.getAttribute('data-motion') === 'reduce';
    state.night = getComputedStyle(root).getPropertyValue('--orbs-vis').trim() !== 'hidden';
    state.on = state.fx !== 'off' && !state.rm && !document.hidden;
  }
  function clearStyles() {
    for (var i = 0; i < orbs.length; i++) { orbs[i].el.style.transform = ''; orbs[i].el.style.opacity = ''; }
    for (var j = 0; j < stars.length; j++) stars[j].el.style.translate = '';
    for (var k = 0; k < clouds.length; k++) clouds[k].el.style.translate = '';
    if (field) field.style.transform = '';
  }

  function draw(full) {
    var mid = sy + vh / 2, t = T, i;
    if (state.night) {
      for (i = 0; i < orbs.length; i++) {
        var p = orbs[i];
        var x = p.ax * (0.72 * Math.sin(p.fx1 * t + p.px1) + 0.28 * Math.sin(p.fx2 * t + p.px2));
        var y = p.ay * (0.7 * Math.cos(p.fy1 * t + p.py1) + 0.3 * Math.sin(p.fy2 * t + p.py2));
        if (full) y += (mid - p.cy) * p.depth + inY * p.lag;
        var sc = 1 + p.sa * Math.sin(p.fs * t + p.ps);
        p.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
        p.el.style.opacity = (p.o * (0.7 + 0.3 * (0.5 + 0.5 * Math.sin(p.fo * t + p.po)))).toFixed(3);
      }
      if (full) {
        for (i = 0; i < stars.length; i++) {
          stars[i].el.style.translate = '0 ' + ((mid - stars[i].cy) * stars[i].depth + inY * 0.4).toFixed(1) + 'px';
        }
        if (field) field.style.transform = 'translate3d(0,' + (-((sy * 0.035) % TILE) + inY * 0.15).toFixed(1) + 'px,0)';
      }
    } else if (full) {
      for (i = 0; i < clouds.length; i++) {
        var c = clouds[i];
        c.el.style.translate = (inY * 0.5 * c.dir).toFixed(1) + 'px ' + ((mid - c.cy) * c.depth).toFixed(1) + 'px';
      }
    }
  }

  function frame(now) {
    raf = 0;
    var dt = last ? Math.min(now - last, 50) : 16;
    last = now;
    var full = state.fx === 'full';
    // scroll velocity in px/ms, clamped and smoothed
    var v = (sy - lastSy) / dt;
    lastSy = sy;
    v = v > 6 ? 6 : v < -6 ? -6 : v;
    vel += (v - vel) * 0.25;
    if (!full) vel = 0;
    // scroll boost: rises quickly, eases back down over about a second after scrolling stops
    var target = Math.min(Math.abs(vel) * 2.4, 7);
    boost += (target - boost) * (target > boost ? 0.2 : 1 - Math.exp(-dt / 900));
    // inertia: a soft spring that trails the scroll direction, then settles
    var s = dt / 1000, goal = Math.max(-70, Math.min(70, vel * 26));
    inV += ((goal - inY) * 36 - inV * 8.5) * s;
    inY += inV * s;
    T += s * (1 + boost);

    // Lite: about 30fps is plenty for slow drift
    if (full || now - lastDraw > 30) { draw(full); lastDraw = now; }

    var settled = Math.abs(vel) < 0.003 && Math.abs(inY) < 0.2 && Math.abs(inV) < 0.2;   // boost only matters at night
    if (state.on && (state.night || !settled)) raf = requestAnimationFrame(frame);
    else running = false;
  }

  function start(fromY) {
    if (running) return;
    if (!state.night && state.fx !== 'full') return;    // Day + Lite: CSS cloud drift only, no loop needed
    running = true; last = 0; lastSy = fromY == null ? sy : fromY;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; running = false;
  }
  function update() {
    var wasNight = state.night, wasFx = state.fx;
    readState();
    if (!state.on) {
      stop();
      if (state.fx === 'off' || state.rm) { clearStyles(); vel = boost = inY = inV = 0; }
      return;
    }
    if (wasNight !== state.night || wasFx !== state.fx) clearStyles();
    draw(state.fx === 'full');
    start();
  }

  window.addEventListener('scroll', function () {
    var prev = sy;
    sy = window.pageYOffset || 0;
    if (state.on && !running) start(prev);   // first frame sees this scroll's distance, so Day clouds react too
  }, { passive: true });
  var resizeTimer = 0;
  function onResize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(function () { measure(); if (state.on) draw(state.fx === 'full'); }, 120); }
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(document.body);
  else window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', update);
  if (window.MutationObserver) {
    new MutationObserver(update).observe(root, { attributes: true, attributeFilter: ['data-fx', 'data-motion', 'data-theme'] });
  }
  if (window.matchMedia) {
    var dark = window.matchMedia('(prefers-color-scheme: dark)');
    if (dark.addEventListener) dark.addEventListener('change', update); else if (dark.addListener) dark.addListener(update);
  }

  measure();
  readState();
  update();
  // expose a tiny read-only status for debugging/tests
  window.siteFx = { running: function () { return running; }, boost: function () { return boost; } };
})();
