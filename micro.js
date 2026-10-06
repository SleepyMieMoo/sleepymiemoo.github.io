/* Micro-interactions: card glow, reveal on scroll, mascot (look, pet, secret star shower) and the night name shimmer.
   All motion is skipped when Reduce motion is on (html[data-motion="reduce"]); Effects Off keeps only light touches.
   Pointer work is rAF-throttled: one layout read, then style writes, per frame. */
(function () {
  var root = document.documentElement;
  var reduce = function () { return root.getAttribute('data-motion') === 'reduce'; };
  var fxOff = function () { return root.getAttribute('data-fx') === 'off'; };
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)');
  var SPARK = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 0q.6 4.4 5 5-4.4.6-5 5-.6-4.4-5-5 4.4-.6 5-5z"/></svg>';

  /* 1. Reveal on scroll. Only elements below the fold are hidden, and only once JS is running. */
  function setupReveal() {
    if (reduce() || !('IntersectionObserver' in window)) return;
    var sel = [
      'main section:not(.hero) > :not(.grid):not(.habits)', '.grid > .card', 'ul.habits > li',
      'article.cs > :not(section):not(h1):not(.habits)', 'article.cs > section > :not(.quotes)', '.quotes > figure'
    ].join(',');
    var all = Array.prototype.slice.call(document.querySelectorAll(sel));
    var set = new Set(all), fold = window.innerHeight * 0.92, items = [];
    all.forEach(function (el) {
      for (var p = el.parentElement; p; p = p.parentElement) if (set.has(p)) return;   // outermost only
      if (el.getBoundingClientRect().top > fold) items.push(el);
    });
    if (!items.length) return;
    root.classList.add('reveal-on');
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, delay = Math.min(n++, 4) * 70;
        io.unobserve(el);
        el.style.transitionDelay = delay + 'ms';
        el.classList.add('rv-in');
        setTimeout(function () { el.classList.remove('rv', 'rv-in'); el.style.transitionDelay = ''; }, 900 + delay);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    items.forEach(function (el) { el.classList.add('rv'); io.observe(el); });
  }

  /* 2. Night name shimmer: an aria-hidden copy seen through a moving window (CSS animates transforms only). */
  function setupShimmer() {
    var h1 = document.querySelector('.hero h1');
    if (!h1) return;
    var win = document.createElement('span'), txt = document.createElement('span');
    win.className = 'name-shine';
    win.setAttribute('aria-hidden', 'true');
    txt.textContent = h1.textContent;
    win.appendChild(txt);
    h1.appendChild(win);
    h1.classList.add('has-shine');
  }

  /* 3. Mascot: becomes a real button; eyes follow the pointer; pet = hop + blink; 5 quick pets = secret. */
  var cat = null, face = null, live = null;
  function setupMascot() {
    var old = document.querySelector('.mascot');
    if (!old) return;
    cat = document.createElement('button');
    cat.type = 'button';
    cat.className = 'mascot';
    cat.setAttribute('aria-label', 'Pet the cat');
    while (old.firstChild) cat.appendChild(old.firstChild);
    old.parentNode.replaceChild(cat, old);
    face = cat.querySelector('.face');
    live = document.createElement('span');
    live.className = 'sr-only';
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);

    var pets = [];
    cat.addEventListener('click', function () {
      var now = Date.now();
      pets = pets.filter(function (t) { return now - t < 1800; });
      pets.push(now);
      if (pets.length >= 5) { pets = []; secret(); return; }
      if (reduce()) { bubble('purr', 1200); return; }
      cat.classList.remove('hop');
      void cat.offsetWidth;            // restart the hop animation on rapid pets (click-time only)
      cat.classList.add('hop');
      clearTimeout(cat._hop);
      cat._hop = setTimeout(function () { cat.classList.remove('hop'); }, 650);
    });
  }
  function bubble(text, ms) {
    var old = cat.querySelector('.cat-bubble');
    if (old) old.remove();
    var b = document.createElement('span');
    b.className = 'cat-bubble';
    b.setAttribute('aria-hidden', 'true');
    b.textContent = text;
    cat.appendChild(b);
    setTimeout(function () { b.remove(); }, ms);
  }
  var showering = false;
  function secret() {
    bubble('meow \u2728', 1600);
    live.textContent = '';
    setTimeout(function () { live.textContent = 'Meow! You found the secret.'; }, 30);
    if (reduce()) { staticBurst(); return; }
    shower(fxOff() ? 10 : 24);
  }
  function staticBurst() {
    var old = cat.querySelector('.cat-burst');
    if (old) old.remove();
    var wrap = document.createElement('span');
    wrap.className = 'cat-burst';
    wrap.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 8; i++) {
      var a = (i / 8) * Math.PI * 2 - Math.PI / 2, s = document.createElement('i');
      s.style.left = (50 + Math.cos(a) * 46) + '%';
      s.style.top = (46 + Math.sin(a) * 46) + '%';
      s.innerHTML = SPARK;
      wrap.appendChild(s);
    }
    cat.appendChild(wrap);
    setTimeout(function () { wrap.remove(); }, 1600);
  }
  function shower(count) {
    if (showering || !document.body.animate) return;
    showering = true;
    var r = cat.getBoundingClientRect();
    var box = document.createElement('div');
    box.className = 'star-shower';
    box.setAttribute('aria-hidden', 'true');
    box.style.left = (r.left + r.width / 2) + 'px';
    box.style.top = (r.top + r.height * 0.42) + 'px';
    var colors = ['var(--accent)', 'var(--pop)', 'var(--strong)', '#f5c76a'];
    var reach = count > 12 ? 1 : 0.7;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('i'), star = i % 3 !== 2;
      var size = star ? 11 + Math.random() * 10 : 4 + Math.random() * 3;
      p.className = star ? 'p-star' : 'p-dot';
      p.style.setProperty('--s', size.toFixed(1) + 'px');
      p.style.setProperty('--c', colors[i % colors.length]);
      if (star) p.innerHTML = SPARK;
      box.appendChild(p);
      var ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
      var dist = (70 + Math.random() * 110) * reach;
      var dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist, rot = (Math.random() - 0.5) * 300;
      var tx = function (f, drop, sc, r) { return 'translate(' + (dx * f).toFixed(1) + 'px,' + (dy * f + drop).toFixed(1) + 'px) scale(' + sc + ') rotate(' + (rot * r).toFixed(0) + 'deg)'; };
      p.animate([
        { transform: tx(0, 0, 0.3, 0), opacity: 0, easing: 'ease-out' },
        { transform: tx(0.45, 0, 1, 0.3), opacity: 1, offset: 0.18, easing: 'cubic-bezier(.25,.6,.4,1)' },
        { transform: tx(0.85, 12, 0.9, 0.8), opacity: 1, offset: 0.65, easing: 'ease-in' },
        { transform: tx(1, 40, 0.5, 1), opacity: 0 }
      ], { duration: 1050 + Math.random() * 400, fill: 'forwards' });
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); showering = false; }, 1550);
  }

  /* 4. Pointer: card glow + mascot gaze, one rAF per frame (read rects first, then write). */
  var GLOW = '.card, .quote-card, ul.habits > li';
  var px = 0, py = 0, target = null, raf = 0, gazing = false;
  function frame() {
    raf = 0;
    if (reduce()) { resetGaze(); return; }
    var card = target && target.closest ? target.closest(GLOW) : null;
    var cr = card ? card.getBoundingClientRect() : null;
    var mr = face ? cat.getBoundingClientRect() : null;
    if (card) {
      card.style.setProperty('--mx', (px - cr.left).toFixed(0) + 'px');
      card.style.setProperty('--my', (py - cr.top).toFixed(0) + 'px');
    }
    if (mr && mr.bottom > 0 && mr.top < window.innerHeight) {
      var dx = px - (mr.left + mr.width / 2), dy = py - (mr.top + mr.height / 2);
      var d = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.min(1, d / 240);
      face.style.transform = 'translate(' + (dx / d * k * 1.3).toFixed(2) + 'px,' + (dy / d * k * 1).toFixed(2) + 'px)';
      gazing = true;
    }
  }
  function resetGaze() { if (face && gazing) { face.style.transform = ''; gazing = false; } }
  function setupPointer() {
    if (!finePointer || !finePointer.matches) return;
    root.classList.add('glow-on');
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      px = e.clientX; py = e.clientY; target = e.target;
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
    root.addEventListener('pointerleave', resetGaze);   // pointer left the page
    window.addEventListener('blur', resetGaze);
  }

  setupShimmer();
  setupMascot();
  setupPointer();
  setupReveal();
})();
