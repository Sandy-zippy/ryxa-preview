/* RYXA v3.1 shop filters: type, price band, best sellers, name search, sort. Area filters are real links. */
(function () {
  var root = document.querySelector('[data-x3shop]'); if (!root) return;
  var q = function (s) { return root.querySelector(s); }, qa = function (s) { return [].slice.call(root.querySelectorAll(s)); };
  var grid = q('[data-x3f-grid]'), cards = qa('[data-x3f-grid] .x-card'), tile = q('.x3-protile');
  var search = q('[data-x3f-q]'), sort = q('[data-x3f-sort]'), count = q('[data-x3f-count]'), empty = q('[data-x3f-empty]'), chips = q('[data-x3f-chips]'), nBadge = q('[data-x3f-n]');
  var types = qa('[data-x3f-type]'), prices = qa('[data-x3f-price]'), best = q('[data-x3f-best]'), panel = q('.x3-filters');
  cards.forEach(function (c, i) { c.dataset.i = i; });
  function run() {
    var v = (search.value || '').trim().toLowerCase(), k = sort.value;
    var ts = types.filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
    var ps = prices.filter(function (x) { return x.checked; }).map(function (x) { return x.value.split('-').map(Number); });
    var b = best && best.checked, n = 0;
    cards.sort(function (a, c) {
      if (k === 'az') return a.dataset.name.localeCompare(c.dataset.name);
      if (k === 'lo') return a.dataset.price - c.dataset.price;
      if (k === 'hi') return c.dataset.price - a.dataset.price;
      if (k === 'save') return c.dataset.save - a.dataset.save;
      return a.dataset.i - c.dataset.i;
    });
    cards.forEach(function (c, i) {
      var p = parseFloat(c.dataset.price);
      var ok = (!v || c.dataset.name.indexOf(v) > -1) && (!ts.length || ts.indexOf(c.dataset.type) > -1) &&
        (!ps.length || ps.some(function (r) { return p >= r[0] && p < r[1]; })) && (!b || c.dataset.best === '1');
      c.hidden = !ok; if (ok) n++;
      grid.appendChild(c);
      if (tile && i === 5) grid.appendChild(tile);
    });
    var filtering = v || ts.length || ps.length || b;
    if (tile) tile.hidden = !!filtering || k !== 'n';
    count.textContent = n + (n === 1 ? ' product' : ' products');
    empty.hidden = n > 0;
    var active = [];
    types.concat(prices).forEach(function (x) { if (x.checked) active.push([x, x.nextElementSibling.textContent]); });
    if (b) active.push([best, 'Best sellers']);
    if (v) active.push([search, '“' + search.value.trim() + '”']);
    chips.innerHTML = '';
    active.forEach(function (a) { var btn = document.createElement('button'); btn.type = 'button'; btn.textContent = a[1]; btn.setAttribute('aria-label', 'Remove filter ' + a[1]); btn.onclick = function () { if (a[0] === search) search.value = ''; else a[0].checked = false; run(); }; chips.appendChild(btn); });
    if (nBadge) nBadge.textContent = active.length ? '(' + active.length + ')' : '';
  }
  function clear() { search.value = ''; types.concat(prices).forEach(function (x) { x.checked = false; }); if (best) best.checked = false; run(); }
  search.addEventListener('input', run); sort.addEventListener('change', run);
  types.concat(prices).concat(best ? [best] : []).forEach(function (x) { x.addEventListener('change', run); });
  qa('[data-x3f-clear]').forEach(function (x) { x.addEventListener('click', clear); });
  var last = null;
  var open = q('[data-x3f-open]'), close = q('[data-x3f-close]');
  if (open) open.addEventListener('click', function () { last = open; panel.classList.add('on'); document.body.classList.add('x3-lock'); setTimeout(function () { close && close.focus(); }, 50); });
  function shut() { panel.classList.remove('on'); document.body.classList.remove('x3-lock'); if (last) last.focus(); }
  if (close) close.addEventListener('click', shut);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('on')) shut(); });
})();
