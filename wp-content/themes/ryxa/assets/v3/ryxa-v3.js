/* RYXA Labs v3 interactions: motion (GSAP), molecule field, mega menu, search, cart drawer
   (WooCommerce Store API), research packs, sign-ups, rails. No third-party services. */
(function () {
  'use strict';
  var C = window.RYXA3 || {};
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  document.documentElement.classList.add('x3-js');

  /* ---------- marquee: duplicate row for a seamless loop ---------- */
  $$('[data-marquee]').forEach(function (m) {
    $$('a,button', m).forEach(function (x) { x.setAttribute('tabindex', '-1'); });
    var row = m.firstElementChild; if (!row) return;
    var clone = row.cloneNode(true); clone.setAttribute('aria-hidden', 'true');
    $$('a', clone).forEach(function (a) { a.tabIndex = -1; });
    m.appendChild(clone);
    var w = row.scrollWidth, sp = parseFloat(m.dataset.speed || 55);
    m.style.setProperty('--dur', Math.max(18, w / sp) + 's');
  });

  /* ---------- header state ---------- */
  var top = $('[data-top]');
  var onScroll = function () { if (top) top.classList.toggle('is-scrolled', scrollY > 8); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- mega menus ---------- */
  var openMega = null, megaT, hoverAt = 0;
  function setMega(item, on) {
    if (!item) return;
    var b = $('button', item), p = $('.x3-mega', item);
    b.setAttribute('aria-expanded', on ? 'true' : 'false'); p.hidden = !on; item.classList.toggle('is-open', on);
    if (on) { if (openMega && openMega !== item) setMega(openMega, false); openMega = item; } else if (openMega === item) openMega = null;
  }
  $$('[data-mega]').forEach(function (item) {
    var b = $('button', item);
    // a click right after hover opened the menu keeps it open (no open-then-shut flicker)
    b.addEventListener('click', function () { var isOn = b.getAttribute('aria-expanded') === 'true'; if (isOn && Date.now() - hoverAt < 600) return; setMega(item, !isOn); });
    item.addEventListener('mouseenter', function () { if (matchMedia('(hover:hover)').matches) { clearTimeout(megaT); if (openMega !== item) hoverAt = Date.now(); setMega(item, true); } });
    item.addEventListener('mouseleave', function () { if (matchMedia('(hover:hover)').matches) { megaT = setTimeout(function () { setMega(item, false); }, 160); } });
  });
  document.addEventListener('click', function (e) { if (openMega && !openMega.contains(e.target)) setMega(openMega, false); });

  /* ---------- mobile menu ---------- */
  var mm = $('[data-mm]'), mmb = $('[data-mm-open]');
  if (mm && mmb) mmb.addEventListener('click', function () { var on = mm.hidden; mm.hidden = !on; mmb.setAttribute('aria-expanded', on ? 'true' : 'false'); document.body.classList.toggle('x3-lock', on); });

  /* ---------- toast ---------- */
  var toastEl = $('[data-toast]'), toastT;
  function toast(msg) { if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 2600); }

  /* ---------- search ---------- */
  var S = $('[data-search]'), SQ = $('[data-search-q]'), SR = $('[data-search-res]'), data = [];
  try { data = JSON.parse(($('[data-search-json]') || {}).textContent || '[]'); } catch (e) {}
  var famN = { rec: 'Repair & recovery', met: 'Metabolic & longevity', neu: 'Cognitive', skin: 'Aesthetic & wellness' };
  function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9+]/g, ''); }
  function renderSearch() {
    var q = norm(SQ.value || '');
    var list = q ? data.filter(function (d) { return norm(d.n + d.s + d.c + d.t + famN[d.f]).indexOf(q) > -1; }) : data.slice(0, 8);
    if (!list.length) { SR.innerHTML = '<p class="x3-search__empty">Nothing matches “' + esc(SQ.value) + '”. Try a shorter name, like “BPC”.</p>'; return; }
    SR.innerHTML = (q ? '' : '<span class="x3-lbl">From the catalogue</span>') + list.slice(0, 12).map(function (d) {
      return '<a href="' + esc(d.u) + '" class="x3-hit"><img src="' + esc(d.i) + '" alt="" loading="lazy"><span><b>' + esc(d.n) + ' <small>' + esc(d.s) + '</small></b><em><i style="--cc:var(--c-' + d.f + ')"></i>' + esc(famN[d.f] || '') + ' · ' + esc(d.c) + '</em></span><strong>' + esc(d.p) + '</strong></a>';
    }).join('');
  }
  function openSearch() { if (!S) return; S.hidden = false; document.body.classList.add('x3-lock'); renderSearch(); setTimeout(function () { SQ.focus(); }, 30); }
  function closeSearch() { if (!S) return; S.hidden = true; document.body.classList.remove('x3-lock'); }
  if (S) {
    $$('[data-search-open]').forEach(function (b) { b.addEventListener('click', openSearch); });
    $$('[data-search-close]').forEach(function (b) { b.addEventListener('click', closeSearch); });
    S.addEventListener('click', function (e) { if (e.target === S) closeSearch(); });
    SQ.addEventListener('input', renderSearch);
    $$('[data-search-chip]').forEach(function (b) { b.addEventListener('click', function () { SQ.value = b.textContent; renderSearch(); SQ.focus(); }); });
    addEventListener('keydown', function (e) {
      var typing = /input|textarea|select/i.test((document.activeElement || {}).tagName || '');
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape') { closeSearch(); closeDrawer(); if (openMega) setMega(openMega, false); }
    });
  }

  /* ---------- cart drawer (WooCommerce Store API) ---------- */
  var D = $('[data-drawer]'), nonce = '', cart = null;
  function api(path, body) {
    var o = { method: body ? 'POST' : 'GET', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } };
    if (nonce) { o.headers.Nonce = nonce; o.headers['X-WC-Store-API-Nonce'] = nonce; }
    if (body) o.body = JSON.stringify(body);
    return fetch(C.store + path, o).then(function (r) {
      var n = r.headers.get('Nonce') || r.headers.get('X-WC-Store-API-Nonce'); if (n) nonce = n;
      return r.json().then(function (j) { if (!r.ok) throw j; return j; });
    });
  }
  function money(minor, cur) { var u = (cur && cur.currency_minor_unit) || 2; return '$' + (parseInt(minor, 10) / Math.pow(10, u)).toFixed(2); }
  function renderCart(c) {
    cart = c; var cur = c.totals || {}; setTimeout(function () { document.dispatchEvent(new CustomEvent('ryxa:cart', { detail: c })); }, 0);
    var n = c.items_count || 0;
    $$('[data-cart-count]').forEach(function (b) { b.textContent = n; });
    $$('[data-cart-count-txt]').forEach(function (b) { b.textContent = n ? '(' + n + ')' : ''; });
    var sub = parseInt(cur.total_items || 0, 10) / Math.pow(10, cur.currency_minor_unit || 2);
    $$('[data-cart-sub]').forEach(function (b) { b.textContent = money(cur.total_items || 0, cur) + ' CAD'; });
    var free = parseFloat(C.freeMin || 0);
    if (free) {
      var left = Math.max(0, free - sub), pct = Math.min(100, sub / free * 100);
      $$('[data-ship-txt]').forEach(function (b) { b.innerHTML = left > 0 ? 'You\'re <b>$' + left.toFixed(2) + '</b> away from free shipping' : '<b>Free shipping unlocked</b>'; });
      $$('[data-ship-bar]').forEach(function (b) { b.style.width = pct + '%'; b.classList.toggle('done', left <= 0); });
    }
    var box = $('[data-cart-items]'); if (!box) return;
    if (!c.items || !c.items.length) {
      box.innerHTML = '<div class="x3-empty"><b>Your cart is empty.</b><p>Start with a best seller or browse by research area.</p><a class="x3-btn x3-btn--solid" href="' + esc(C.shop) + '">Browse compounds</a></div>';
      return;
    }
    var tiers = C.tiers || {};
    box.innerHTML = c.items.map(function (it) {
      var img = it.images && it.images[0] ? it.images[0].thumbnail || it.images[0].src : '';
      var t = Object.keys(tiers).map(Number).sort(function (a, b) { return b - a; }).filter(function (q) { return it.quantity >= q; })[0];
      var next = Object.keys(tiers).map(Number).sort(function (a, b) { return a - b; }).filter(function (q) { return it.quantity < q; })[0];
      var hint = t ? '<span class="x3-tierhint ok">Pack saving ' + tiers[t] + '% applied at checkout</span>' : (next ? '<button type="button" class="x3-tierhint v5-more" data-lmore="' + next + '">+ Add ' + (next - it.quantity) + ' more, save ' + tiers[next] + '% (' + money(Math.round(parseInt(it.prices.price, 10) * next * tiers[next] / 100), it.prices) + ')</button>' : '');
      return '<div class="x3-line" data-key="' + esc(it.key) + '"><img src="' + esc(img) + '" alt=""><div><a href="' + esc(it.permalink) + '"><b>' + esc(it.name) + '</b></a><span>' + money(it.prices.price, it.prices) + ' CAD</span>' + hint +
        '<div class="x3-line__q"><button type="button" data-lq="-1" aria-label="Fewer">−</button><span>' + it.quantity + '</span><button type="button" data-lq="1" aria-label="More">+</button><button type="button" class="x3-line__rm" data-lrm>Remove</button></div></div><strong>' + money(it.totals.line_subtotal, it.totals) + '</strong></div>';
    }).join('');
  }
  function loadCart() { return api('cart').then(renderCart).catch(function () {}); }
  var lastFocus = null;
  function openDrawer() { if (!D) return false; lastFocus = document.activeElement; D.hidden = false; setTimeout(function () { var f = $('button[data-drawer-close]', D); if (f) f.focus(); }, 60); document.body.classList.add('x3-lock'); requestAnimationFrame(function () { D.classList.add('on'); }); loadCart(); return true; }
  function closeDrawer() { if (!D || D.hidden) return; D.classList.remove('on'); document.body.classList.remove('x3-lock'); setTimeout(function () { D.hidden = true; }, 260); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  if (D && C.store) {
    $$('[data-drawer-open]').forEach(function (a) { a.addEventListener('click', function (e) { if (openDrawer()) e.preventDefault(); }); });
    $$('[data-drawer-close]').forEach(function (b) { b.addEventListener('click', closeDrawer); });
    D.addEventListener('click', function (e) {
      var line = e.target.closest('.x3-line'); if (!line || !cart) return;
      var key = line.dataset.key, it = cart.items.filter(function (x) { return x.key === key; })[0]; if (!it) return;
      var b = e.target.closest('[data-lq]');
      if (b) { line.classList.add('busy'); var q = Math.max(0, it.quantity + parseInt(b.dataset.lq, 10)); (q ? api('cart/update-item', { key: key, quantity: q }) : api('cart/remove-item', { key: key })).then(renderCart).catch(loadCart); }
      var mb = e.target.closest('[data-lmore]');
      if (mb) { line.classList.add('busy'); api('cart/update-item', { key: key, quantity: parseInt(mb.dataset.lmore, 10) }).then(renderCart).catch(loadCart); }
      if (e.target.closest('[data-lrm]')) { line.classList.add('busy'); api('cart/remove-item', { key: key }).then(renderCart).catch(loadCart); }
    });
    function add(id, qty, name, el, extra) {
      if (el) el.classList.add('busy');
      var go = function () {
        var p = api('cart/add-item', { id: parseInt(id, 10), quantity: qty || 1 });
        (extra || []).forEach(function (x) { p = p.then(function () { return api('cart/add-item', { id: parseInt(x, 10), quantity: 1 }); }); });
        return p;
      };
      (nonce ? go() : api('cart').then(go)).then(function (c) { renderCart(c); openDrawer(); toast('Added to cart · ' + (name || '')); })
        .catch(function (err) { toast((err && err.message) ? err.message.replace(/<[^>]+>/g, '') : 'Could not add to cart. Please try again.'); })
        .then(function () { if (el) el.classList.remove('busy'); });
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a.x-add, .x-sticky a.pill'); if (!a) return;
      var m = (a.getAttribute('href') || '').match(/add-to-cart=(\d+)/); if (!m) return;
      e.preventDefault(); var card = a.closest('.x-card'); add(m[1], 1, card ? ($('h3', card) || {}).textContent : '', a);
    });
    var bf = $('form.x-buy');
    if (bf) bf.addEventListener('submit', function (e) {
      var b = $('[name="add-to-cart"]', bf); if (!b) return; e.preventDefault();
      var ex = $$('input[data-addon]:checked').map(function (x) { return x.dataset.addon; });
      add(b.value, parseInt(($('#qty') || {}).value, 10) || 1, (($('.x-info h1') || {}).textContent || '') + (ex.length ? ' + ' + ex.length + ' more' : ''), b, ex);
    });
    window.RYXA = { api: api, add: add, render: renderCart, open: openDrawer, load: loadCart, toast: toast, money: money };
    // keep header counts honest on cached pages
    loadCart();
  }

  /* ---------- research pack picker (PDP) ---------- */
  var pick = $('[data-pick]');
  if (pick) {
    var price = parseFloat(pick.dataset.price), qty = $('#qty'), btn = $('.x-buy [name="add-to-cart"]'), tiers = C.tiers || {};
    var label = function (q) {
      var t = Object.keys(tiers).map(Number).sort(function (a, b) { return b - a; }).filter(function (x) { return q >= x; })[0];
      var tot = price * q * (t ? 1 - tiers[t] / 100 : 1);
      if (btn) btn.textContent = 'Add ' + (q > 1 ? q + ' vials' : 'to cart') + ' · $' + tot.toFixed(2);
    };
    pick.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pq]'); if (!b) return;
      $$('[data-pq]', pick).forEach(function (x) { x.classList.toggle('on', x === b); });
      if (qty) qty.value = b.dataset.pq; label(parseInt(b.dataset.pq, 10));
    });
    document.addEventListener('click', function (e) { if (e.target.closest('[data-q]')) setTimeout(function () { var q = parseInt(qty.value, 10) || 1; $$('[data-pq]', pick).forEach(function (x) { x.classList.toggle('on', +x.dataset.pq === q); }); label(q); }, 0); });
  }

  /* ---------- PDP 3D view ---------- */
  var b3 = $('[data-view3d]');
  if (b3) b3.addEventListener('click', function () {
    var main = $('.x-gal__main'); if (!main) return;
    var ex = $('.x3-pdp3d', main);
    $$('.x-gal__thumbs button').forEach(function (x) { x.classList.toggle('on', x === b3); });
    if (ex) { ex.hidden = false; return; }
    var m = document.createElement('div'); m.className = 'x3-pdp3d'; m.setAttribute('data-ryxa-3d', b3.dataset.view3d);
    m.setAttribute('role', 'img'); m.setAttribute('aria-label', '3D view of the vial. Drag to rotate.');
    main.appendChild(m);
    var go = function () { if (!window.ryxaMount3D || !window.ryxaMount3D(m)) { m.remove(); toast('3D view is not supported on this device.'); } };
    window.ryxaMount3D ? go() : addEventListener('ryxa3d-ready', go, { once: true });
  });
  document.addEventListener('click', function (e) { var t = e.target.closest('.x-gal__thumbs button[data-img]'); if (t) { var ex = $('.x3-pdp3d'); if (ex) ex.hidden = true; } });

  /* ---------- sign-ups ---------- */
  $$('[data-signup]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var msg = $('[data-signup-msg]', f), fd = new FormData(f), body = {};
      fd.forEach(function (v, k) { body[k] = v; });
      msg.textContent = 'Saving…';
      fetch(C.sub, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw j; return j; }); })
        .then(function () { f.classList.add('done'); msg.textContent = body.topic === 'restock' ? 'Done. We\'ll email you once, when the next lot passes testing.' : 'You\'re on the list. One email per new lot or compound.'; })
        .catch(function (err) { msg.textContent = (err && err.message) || 'Something went wrong. Please try again.'; });
    });
  });

  /* ---------- best-seller tabs + rails ---------- */
  $$('[data-tabs]').forEach(function (tabs) {
    var grid = tabs.closest('.x3-wrap').querySelector('[data-tab-grid]');
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]'); if (!b) return;
      $$('[data-tab]', tabs).forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      $$('.x-card', grid).forEach(function (c) { c.hidden = !(b.dataset.tab === 'all' || c.dataset.fam === b.dataset.tab); });
      grid.scrollTo({ left: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  $$('[data-rail-el]').forEach(function (rail) {
    var wrap = rail.closest('.x3-wrap'), prog = $('[data-rail-prog]', wrap);
    var upd = function () { if (prog) { var m = rail.scrollWidth - rail.clientWidth; prog.style.width = (m > 0 ? Math.max(12, (rail.scrollLeft + rail.clientWidth) / rail.scrollWidth * 100) : 100) + '%'; } };
    rail.addEventListener('scroll', upd, { passive: true }); upd();
    $$('[data-rail2]', wrap).forEach(function (b) { b.addEventListener('click', function () { rail.scrollBy({ left: parseInt(b.dataset.rail2, 10) * rail.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' }); }); });
  });

  /* ---------- molecule field (decorative canvas on dark sections) ---------- */
  $$('.x3-field').forEach(function (cv) {
    var g = cv.getContext('2d'), pts = [], W, H, dpr = Math.min(devicePixelRatio || 1, 2), vis = false, mouse = { x: -999, y: -999 };
    function size() {
      var r = cv.parentElement.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(90, W * H / 16000)); pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22, r: Math.random() * 1.6 + .8, b: Math.random() < .18 });
    }
    function draw() {
      g.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (!reduce) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < 13000) { g.strokeStyle = 'rgba(35,55,102,' + (0.10 * (1 - d / 13000)) + ')'; g.lineWidth = 1; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); }
        }
        var md = Math.hypot(p.x - mouse.x, p.y - mouse.y), glow = md < 140 ? 1 - md / 140 : 0;
        g.fillStyle = p.b ? 'rgba(59,91,217,' + (.35 + glow * .4) + ')' : 'rgba(35,55,102,' + (.14 + glow * .3) + ')';
        g.beginPath(); g.arc(p.x, p.y, p.r + glow * 1.5, 0, 6.283); g.fill();
      }
    }
    function loop() { if (vis) draw(); if (!reduce) requestAnimationFrame(loop); }
    size(); draw(); new ResizeObserver(function () { size(); draw(); }).observe(cv.parentElement);
    new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(cv);
    cv.parentElement.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    loop();
  });

  /* ---------- tilt cards ---------- */
  if (!reduce && matchMedia('(hover:hover)').matches) $$('[data-tilt]').forEach(function (el) {
    el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; el.style.transform = 'perspective(900px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg) translateY(-2px)'; el.style.setProperty('--mx', (x + .5) * 100 + '%'); el.style.setProperty('--my', (y + .5) * 100 + '%'); });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  });

  /* ---------- scroll motion (GSAP + ScrollTrigger) ---------- */
  function motion() {
    var G = window.gsap, ST = window.ScrollTrigger;
    if (!G || !ST || reduce) { document.documentElement.classList.add('x3-static'); return; }
    G.registerPlugin(ST);
    // 22 Nov: no headline split and no hidden-until-scroll sections; content is complete at rest
    // chromatogram draws
    $$('.x3-chrom__line').forEach(function (l) {
      G.fromTo(l, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', scrollTrigger: { trigger: l.closest('svg'), start: 'top 85%' } });
      var area = l.parentNode.querySelector('.x3-chrom__area'); if (area) G.from(area, { autoAlpha: 0, duration: 1.2, delay: 1.2, scrollTrigger: { trigger: l.closest('svg'), start: 'top 85%' } });
      var an = l.parentNode.querySelector('.x3-annot'); if (an) G.from(an, { autoAlpha: 0, x: 10, duration: .8, delay: 1.8, scrollTrigger: { trigger: l.closest('svg'), start: 'top 85%' } });
    });
    // lot journey line
    $$('[data-flow]').forEach(function (f) {
      var p = $('.x3-flow__path path', f);
      if (p) G.fromTo(p, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: f, start: 'top 75%', end: 'bottom 55%', scrub: .6 } });
      $$('.x3-flow__dot', f).forEach(function (d, i) { G.from(d, { scale: .4, autoAlpha: 0, duration: .6, ease: 'back.out(2)', scrollTrigger: { trigger: f, start: 'top ' + (78 - i * 4) + '%' } }); });
    });
    // anatomy callout lines
    $$('.x3-anat__lines path').forEach(function (p, i) { p.setAttribute('pathLength', '1'); G.fromTo(p, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .8, delay: i * .12, scrollTrigger: { trigger: '.x3-anat__grid', start: 'top 70%' } }); });
    // counters
    $$('[data-count]').forEach(function (el) { var n = parseFloat(el.dataset.count), o = { v: 0 }; G.to(o, { v: n, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%' }, onUpdate: function () { el.textContent = Math.round(o.v); } }); });
    // floating glass cards: gentle bob + scroll parallax
    $$('[data-float]').forEach(function (el, i) {
      G.to(el, { y: i % 2 ? 10 : -10, duration: 3 + i, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      G.to(el, { yPercent: -40 - i * 20, ease: 'none', scrollTrigger: { trigger: '.x3-hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
    // index bars grow
    $$('.x3-index .x-bars i').forEach(function (b) { G.from(b, { scaleX: 0, transformOrigin: 'left center', duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: b, start: 'top 92%' } }); });
  }
  if (document.readyState === 'complete') motion(); else addEventListener('load', motion);
})();
