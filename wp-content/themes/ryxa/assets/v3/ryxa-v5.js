/* RYXA Labs v5 (20 Nov 2026): conversion mechanics. Names, sizes and prices only. */
(function () {
  'use strict';
  var V = window.RYXA5 || {}, C = window.RYXA3 || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var cad = function (n) { return '$' + (Math.round(n * 100) / 100).toFixed(2); };
  var byId = {}; (V.list || []).forEach(function (p) { byId[p.id] = p; });
  var R = function () { return window.RYXA || null; };
  var store = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  var say = function (m) { var r = R(); if (r && r.toast) r.toast(m); };

  /* ---------- copy code chips ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]'); if (!b) return;
    var t = b.dataset.copy, done = function () { say('Code ' + t + ' copied'); b.classList.add('ok'); setTimeout(function () { b.classList.remove('ok'); }, 1400); };
    try { navigator.clipboard.writeText(t).then(done, function () { selectText(b); done(); }); } catch (x) { selectText(b); done(); }
  });
  function selectText(el) { try { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {} }

  /* ---------- product page: add-ons + live button total ---------- */
  var form = $('form.x-buy'), btn = form && $('[name="add-to-cart"]', form), pick = $('[data-pick]');
  if (form && btn) {
    var price = pick ? parseFloat(pick.dataset.price) : 0, tiers = C.tiers || {};
    var packTotal = function (q) {
      var t = Object.keys(tiers).map(Number).sort(function (a, b) { return b - a; }).filter(function (x) { return q >= x; })[0];
      return price * q * (t ? 1 - tiers[t] / 100 : 1);
    };
    var relabel = function () {
      if (!price) return;
      var q = parseInt(($('#qty') || {}).value, 10) || 1;
      var ex = $$('input[data-addon]:checked');
      var tot = packTotal(q) + ex.reduce(function (s, x) { return s + parseFloat(x.dataset.price); }, 0);
      var n = q + ex.length;
      btn.textContent = (n > 1 ? 'Add ' + n + ' items' : 'Add to cart') + ' · ' + cad(tot);
      var fp = $('[data-first-p]'); if (fp) fp.textContent = cad(packTotal(q));
      $$('.v5-add').forEach(function (l) { l.classList.toggle('on', $('input', l).checked); });
      var r = R(); if (r && r.ship) r.ship(tot);
    };
    document.addEventListener('change', function (e) { if (e.target.closest('[data-addon]')) relabel(); });
    document.addEventListener('click', function (e) { if (e.target.closest('[data-pq],[data-q]')) setTimeout(relabel, 10); });
    $('#qty') && $('#qty').addEventListener('input', function () { setTimeout(relabel, 10); });
    relabel();
  }

  /* ---------- ship-day timer (Pacific, Monday to Thursday, 2:00 PM cut-off) ---------- */
  var tm = $('[data-shiptimer]');
  if (tm && window.Intl) {
    var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var pac = function () {
      var o = {}; new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
      return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday), m: (+o.hour) * 60 + (+o.minute) };
    };
    var tick = function () {
      var t = pac(), cut = 14 * 60, txt;
      if (t.d >= 1 && t.d <= 4 && t.m < cut) {
        var left = cut - t.m, h = Math.floor(left / 60), mm = left % 60;
        txt = '<b>Ships Mon to Thu</b> from BC, packed and tracked. Orders placed before 2:00 PM Pacific go out the same business day.';
      } else {
        var nd = t.d; do { nd = (nd + 1) % 7; } while (nd < 1 || nd > 4);
        txt = '<b>Next ship day: ' + DAYS[nd] + '.</b> Ships in 1 to 2 business days.';
      }
      tm.innerHTML = txt; tm.hidden = false;
    };
    tick(); setInterval(tick, 30000);
  }

  /* ---------- cart drawer: "often added" + savings + total on the button ---------- */
  var upBox = null;
  document.addEventListener('ryxa:cart', function (e) {
    var c = e.detail || {}, tt = c.totals || {}, u = Math.pow(10, tt.currency_minor_unit || 2);
    var items = c.items || [], inCart = {}; items.forEach(function (it) { inCart[it.id] = 1; });
    // savings = coupon discounts + negative fees (pack saving)
    var save = parseInt(tt.total_discount || 0, 10) / u;
    (c.fees || []).forEach(function (f) { var v = parseInt((f.totals || {}).total || 0, 10) / u; if (v < 0) save += -v; });
    var sr = $('[data-cart-save]'); if (sr) { sr.hidden = !(save > 0); var a = $('[data-cart-save-amt]'); if (a) a.textContent = '−' + cad(save); }
    var tr = $('[data-cart-totrow]'); if (tr) { tr.hidden = !items.length; $('[data-cart-total]', tr).textContent = cad(parseInt(tt.total_price || 0, 10) / u) + ' CAD'; }
    // a first-order code beats the pack saving: say so on the line hints
    // two one-tap picks: pairs of what is in the cart, else best sellers; they scroll with the lines
    var box = upBox || (upBox = $('[data-cart-up]')); if (!box) return;
    var list = $('[data-cart-items]'); if (list) list.appendChild(box);
    var picks = [];
    items.forEach(function (it) { ((V.pairs || {})[it.id] || []).forEach(function (id) { if (!inCart[id] && picks.indexOf(id) < 0) picks.push(id); }); });
    if (!items.length) { box.hidden = true; box.innerHTML = ''; return; }
    (V.list || []).forEach(function (p) { if (picks.length < 6 && !inCart[p.id] && picks.indexOf(p.id) < 0) picks.push(p.id); });
    picks = picks.filter(function (id) { return byId[id]; }).slice(0, 2);
    box.hidden = !picks.length;
    box.innerHTML = '<p class="v5-up__t">Add to your order</p>' + picks.map(function (id) {
      var p = byId[id];
      return '<div class="v5-up__i"><img src="' + esc(p.i) + '" alt="" width="48" height="48" loading="lazy"><a href="' + esc(p.u) + '"><b>' + esc(p.n) + '</b><small>' + esc(p.s) + ' · ' + cad(p.p) + '</small></a><button type="button" class="v5-up__add" data-upadd="' + p.id + '" aria-label="Add ' + esc(p.n + ' ' + p.s) + ' to cart">+ Add</button></div>';
    }).join('');
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-upadd]'); if (!b) return;
    var r = R(), p = byId[b.dataset.upadd]; if (!r || !p) return;
    b.disabled = true; b.textContent = 'Adding…';
    r.api('cart/add-item', { id: p.id, quantity: 1 }).then(function (c) { r.render(c); say('Added to cart · ' + p.n); })
      .catch(function () { b.disabled = false; b.textContent = '+ Add'; say('Could not add. Please try again.'); });
  });

  /* ---------- Signup pop-up: disabled 25 Nov 2026, no consumer promotions at launch ---------- */
  var pop = $('[data-pop]');
  if (pop && V.popup && !store('ryxa_pop')) {
    var last = null, shown = false;
    var gateOpen = function () { return !!document.querySelector('.ryxa-gate'); };
    var show = function () {
      if (shown || gateOpen() || document.body.classList.contains('x3-lock')) return;
      shown = true; store('ryxa_pop', '1'); last = document.activeElement;
      pop.hidden = false; requestAnimationFrame(function () { pop.classList.add('on'); });
      setTimeout(function () { var i = $('input[type=email]', pop); if (i && !(window.matchMedia && matchMedia('(pointer:coarse)').matches)) i.focus(); else { var x = $('[data-pop-close].v5-pop__x', pop); if (x) x.focus(); } }, 80);
    };
    var hide = function () { pop.classList.remove('on'); setTimeout(function () { pop.hidden = true; }, 240); if (last && last.focus) last.focus(); };
    // 22 Nov audit: no popup on product pages (code already shows under the price); touch = after 30 s AND half-way scroll; desktop = 30 s or exit intent
    var touch = window.matchMedia && matchMedia('(pointer:coarse)').matches;
    if (!document.body.classList.contains('single-product')) {
      if (touch) { var t0 = Date.now(), onS = function () { if (Date.now() - t0 > 30000 && window.scrollY > (document.documentElement.scrollHeight - innerHeight) * 0.5) { removeEventListener('scroll', onS); show(); } }; addEventListener('scroll', onS, { passive: true }); }
      else setTimeout(show, 30000);
    }
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget && e.clientY < 8) show(); });
    pop.addEventListener('click', function (e) { if (e.target.closest('[data-pop-close]')) hide(); });
    document.addEventListener('keydown', function (e) {
      if (pop.hidden) return;
      if (e.key === 'Escape') hide();
      if (e.key === 'Tab') { var f = $$('button,input,a', pop).filter(function (x) { return x.offsetParent; }); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
    var f = $('[data-pop-form]', pop), err = $('[data-pop-err]', pop);
    f.addEventListener('submit', function (e) {
      e.preventDefault(); err.textContent = '';
      var em = f.email.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { err.textContent = 'Please enter a valid email address.'; f.email.focus(); return; }
      if (!f.consent.checked) { err.textContent = 'Please tick the box so we can email you the code.'; return; }
      var b = $('button[type=submit]', f); b.disabled = true; b.textContent = 'One moment…';
      fetch(V.sub, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: em, consent: 1, topic: 'welcome', website: f.website.value }) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw j; return j; }); })
        .then(function () { f.hidden = true; $('[data-pop-done]', pop).hidden = false; store('ryxa_pop', 'joined'); $('[data-pop-done] [data-copy]', pop).focus(); })
        .catch(function (j) { err.textContent = (j && j.message) || 'Something went wrong. Please try again.'; b.disabled = false; b.textContent = 'Get my 10% code'; });
    });
  }

  /* ---------- checkout: one-tap add-on in the order summary (block checkout) ---------- */
  if (document.querySelector('.wp-block-woocommerce-checkout')) {
    var tries = 0, wd = window.wp && window.wp.data;
    var mount = function () {
      wd = window.wp && window.wp.data;
      var side = $('.wc-block-checkout__sidebar .wc-block-components-order-summary, .wp-block-woocommerce-checkout-order-summary-block');
      if (!wd || !side) { if (tries++ < 40) setTimeout(mount, 250); return; }
      var sel = wd.select('wc/store/cart'); if (!sel) return;
      var render = function () {
        var items = (sel.getCartData() || {}).items || [], inCart = {}; items.forEach(function (it) { inCart[it.id] = 1; });
        var pid = null; items.some(function (it) { return ((V.pairs || {})[it.id] || []).some(function (id) { if (!inCart[id] && byId[id]) { pid = id; return true; } }); });
        if (!pid && items.length) (V.list || []).some(function (p) { if (!inCart[p.id]) { pid = p.id; return true; } });
        var box = $('[data-cobump]');
        if (!pid) { if (box) box.remove(); return; }
        var p = byId[pid];
        if (!box) { box = document.createElement('div'); box.className = 'v5-bump'; box.setAttribute('data-cobump', ''); side.parentNode.insertBefore(box, side.nextSibling); }
        if (box.dataset.pid === String(pid)) return;
        box.dataset.pid = pid;
        box.innerHTML = '<img src="' + esc(p.i) + '" alt="" width="48" height="48"><div><b>Add ' + esc(p.n) + ' ' + esc(p.s) + '</b><small>' + cad(p.p) + ' CAD · ships in the same parcel</small></div><button type="button" class="v5-up__add" data-cobadd="' + p.id + '">+ Add</button>';
      };
      render(); wd.subscribe(render);
      document.addEventListener('click', function (e) {
        var b = e.target.closest('[data-cobadd]'); if (!b) return;
        b.disabled = true; b.textContent = 'Adding…';
        Promise.resolve(wd.dispatch('wc/store/cart').addItemToCart(parseInt(b.dataset.cobadd, 10), 1)).catch(function () { b.disabled = false; b.textContent = '+ Add'; });
      });
    };
    mount();
  }
})();
