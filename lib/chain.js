/* RYXA living lattice: rows of peptide-backbone zigzags (the packaging chain pattern), drifting slowly.
   Signal pulses run along the chains; nodes near the pointer light up. Canvas 2D, DPR capped, pauses off-screen. */
export function mountChain(host, o = {}){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.createElement('canvas'); cv.className = 'chaincv'; cv.setAttribute('aria-hidden','true'); host.appendChild(cv);
  const x = cv.getContext('2d');
  const C = Object.assign({gap: 34, step: 17, amp: 4, line: 'rgba(58,63,73,.9)', node: 'rgba(86,92,106,1)', hot: [154,168,207], pulses: 7, mask: null, speed: 1}, o);
  let W = 0, H = 0, d = 1, rows = [], pulses = [], mx = -1e4, my = -1e4, pmx = -1e4, pmy = -1e4, on = false, t = 0, last = 0;
  function build(){
    const r = host.getBoundingClientRect(); d = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    rows = []; const n = Math.ceil(H / C.gap) + 1;
    for (let i = 0; i < n; i++) rows.push({y: i * C.gap + C.gap * .5, off: Math.random() * C.step * 2, v: (Math.random() < .5 ? -1 : 1) * (2 + Math.random() * 4), ph: Math.random() * 6.28,
      big: Array.from({length: 6}, () => Math.floor(Math.random() * 200))});
    pulses = Array.from({length: C.pulses}, () => newPulse(true));
  }
  function newPulse(any){ return {r: Math.floor(Math.random() * rows.length), x: any ? Math.random() * W : -40, v: 60 + Math.random() * 90, len: 90 + Math.random() * 120}; }
  const alpha = (px, py) => C.mask ? C.mask(px / W, py / H) : 1;
  function yAt(row, px){ const k = Math.round((px - row.off) / C.step); return row.y + ((k & 1) ? C.amp : -C.amp) + Math.sin(t * .4 + row.ph + px * .004) * 3; }
  function draw(ts){
    if (!on) return; requestAnimationFrame(draw);
    const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; t += dt * C.speed;
    mx += (pmx - mx) * .12; my += (pmy - my) * .12;
    x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, W, H); x.lineWidth = 1.1;
    for (const row of rows){
      row.off += row.v * dt * C.speed * (reduce ? 0 : 1);
      const s0 = ((row.off % (C.step * 2)) + C.step * 2) % (C.step * 2) - C.step * 2;
      // backbone
      x.beginPath(); let k = 0, first = true;
      for (let px = s0; px < W + C.step * 2; px += C.step, k++){
        const py = row.y + ((k & 1) ? C.amp : -C.amp) + Math.sin(t * .4 + row.ph + px * .004) * 3;
        first ? x.moveTo(px, py) : x.lineTo(px, py); first = false;
      }
      x.strokeStyle = C.line; x.globalAlpha = 1; x.save();
      if (C.mask){ const g = x.createLinearGradient(0, 0, W, 0); for (let i = 0; i <= 10; i++){ g.addColorStop(i / 10, `rgba(58,63,73,${.9 * alpha(i / 10 * W, row.y)})`); } x.strokeStyle = g; }
      x.stroke(); x.restore();
      // nodes on the upper vertices, a few larger "residues"
      k = 0; const base = Math.floor((row.off) / C.step);
      for (let px = s0; px < W + C.step; px += C.step, k++){
        if (k & 1) continue;
        const py = row.y - C.amp + Math.sin(t * .4 + row.ph + px * .004) * 3;
        const a = alpha(px, py); if (a < .02) continue;
        const dx = px - mx, dy = py - my, near = Math.max(0, 1 - Math.hypot(dx, dy) / 160);
        const idx = ((k - base) % 200 + 200) % 200, big = row.big.includes(idx);
        const rr = (big ? 2.4 : 1.5) + near * 2.2;
        if (near > .01){ x.fillStyle = `rgba(${C.hot},${(.25 + near * .75) * a})`; }
        else x.fillStyle = C.node.replace(/,1\)$/, `,${a})`);
        x.beginPath(); x.arc(px, py, rr, 0, 6.283); x.fill();
      }
    }
    // pulses: light running along a chain
    for (const p of pulses){
      p.x += p.v * dt * (reduce ? 0 : 1); if (p.x - p.len > W){ Object.assign(p, newPulse(false)); }
      const row = rows[p.r]; if (!row) continue;
      x.beginPath(); let started = false;
      for (let px = p.x - p.len; px <= p.x; px += 4){ const py = yAt(row, px); started ? x.lineTo(px, py) : x.moveTo(px, py); started = true; }
      const a = alpha(p.x, row.y); const g = x.createLinearGradient(p.x - p.len, 0, p.x, 0);
      g.addColorStop(0, `rgba(${C.hot},0)`); g.addColorStop(1, `rgba(${C.hot},${.85 * a})`);
      x.strokeStyle = g; x.lineWidth = 1.6; x.stroke(); x.lineWidth = 1.1;
      x.fillStyle = `rgba(235,239,250,${.9 * a})`; x.beginPath(); x.arc(p.x, yAt(row, p.x), 2.1, 0, 6.283); x.fill();
    }
  }
  const zone = o.pointerZone || host.parentElement || host;
  zone.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); pmx = e.clientX - r.left; pmy = e.clientY - r.top; if (mx < -1e3){ mx = pmx; my = pmy; } }, {passive: true});
  zone.addEventListener('pointerleave', () => { pmx = pmy = -1e4; });
  new ResizeObserver(build).observe(host); build();
  new IntersectionObserver(es => { const v = es[0].isIntersecting; if (v && !on){ on = true; last = 0; requestAnimationFrame(draw); } else if (!v) on = false; }).observe(host);
}
