(() => {
  // Age gate: session cookie, then remove the overlay.
  const gate = document.querySelector('.ryxa-gate');
  let seen = false;
  try { seen = localStorage.getItem('ryxa_19') === '1'; } catch (e) {}
  if (gate && seen) { gate.remove(); }
  else if (gate) {
    document.documentElement.style.overflow = 'hidden';
    gate.querySelector('[data-ryxa-gate="yes"]').addEventListener('click', () => {
      document.cookie = 'ryxa_19=1; path=/; SameSite=Lax; Secure';
      try { localStorage.setItem('ryxa_19', '1'); } catch (e) {}
      gate.remove();
      document.documentElement.style.overflow = '';
    });
  }
  // Lot lookup.
  document.querySelectorAll('[data-ryxa-lot]').forEach((form) => {
    const out = form.querySelector('.ryxa-lot__result');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const lot = form.lot.value.trim().toUpperCase();
      out.textContent = 'Checking…';
      try {
        const r = await fetch(window.RYXA.rest + encodeURIComponent(lot));
        const d = await r.json();
        if (!r.ok) { out.textContent = d.message || 'No report on file for that lot yet.'; return; }
        out.innerHTML = '';
        const dl = document.createElement('dl');
        [['Lot', d.lot], ['Product', d.product], ['HPLC purity', d.purity && d.purity + '%'], ['Identity (MS)', d.identity], ['Lab', d.lab], ['Tested', d.test_date]]
          .filter(([, v]) => v).forEach(([k, v]) => { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; dl.append(dt, dd); });
        out.append(dl);
        if (d.coa_url) { const a = document.createElement('a'); a.href = d.coa_url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Open the lab report (PDF)'; out.append(a); }
      } catch { out.textContent = 'Lookup failed. Please try again.'; }
    });
  });
})();

/* Lab molarity / dilution calculator (lab units only) */
document.querySelectorAll('.ryxa-calc__tool').forEach(function (box) {
  var t = box.dataset.tool, out = box.querySelector('.ryxa-calc__out');
  function v(n) { var x = parseFloat((box.querySelector('[name="' + n + '"]') || {}).value); return isFinite(x) && x > 0 ? x : null; }
  function fmt(x) { return x >= 100 ? x.toFixed(1) : x >= 1 ? x.toFixed(3) : x.toPrecision(3); }
  box.addEventListener('input', function () {
    if (t === 'molarity') {
      var m = v('mass'), vol = v('vol'), mw = v('mw');
      if (!(m && vol && mw)) { out.textContent = 'Concentration: –'; return; }
      var mM = (m / mw) / vol * 1000; /* mg/(g/mol) = mmol; / mL -> mol/L*1000 = mM */
      out.textContent = 'Concentration: ' + fmt(mM) + ' mM (' + fmt(mM * 1000) + ' µM)';
    } else if (t === 'mass') {
      var c = v('conc'), vol2 = v('vol'), mw2 = v('mw');
      if (!(c && vol2 && mw2)) { out.textContent = 'Mass needed: –'; return; }
      out.textContent = 'Mass needed: ' + fmt(c * vol2 * mw2 / 1000) + ' mg';
    } else {
      var k = ['c1', 'v1', 'c2', 'v2'], vals = k.map(v), miss = vals.filter(function (x) { return x === null; }).length;
      if (miss !== 1) { out.textContent = 'Result: enter exactly three values'; return; }
      var i = vals.indexOf(null), a = vals;
      var r = i === 0 ? a[2] * a[3] / a[1] : i === 1 ? a[2] * a[3] / a[0] : i === 2 ? a[0] * a[1] / a[3] : a[0] * a[1] / a[2];
      out.textContent = 'Result: ' + k[i].toUpperCase() + ' = ' + fmt(r);
    }
  });
});
