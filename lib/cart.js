/* RYXA cart drawer, set as a lab requisition slip: Bone paper, ruled rows, values in Plex Mono, words in Inter.
   Real line items, the approved 1 / 5 / 10 vial ladder, free tracked shipping over $200, same-family suggestions,
   payment methods and the research attestation. Works on every page.
   Needs window.RYXA_P (lib/catalog.js). Preview only: checkout is not connected. */
(()=>{
const P = window.RYXA_P || {}; const FREE = 200;
const FN = {'RX-01':'Repair & recovery','RX-02':'Metabolic & longevity','RX-03':'Cognitive','RX-04':'Aesthetic & wellness'};
let ask = -1;
const st = {get(k){try{return localStorage.getItem(k)}catch(e){return null}}, set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
let cart = []; try{ cart = JSON.parse(st.get('ryxa-cart-v2') || '[]').filter(l => l && P[l.s] && l.q > 0); }catch(e){ cart = []; }
const unit = (p, q) => !p.pr ? 0 : q >= 10 ? p.pr[2] : q >= 5 ? p.pr[1] : p.pr[0];
const money = v => '$' + v.toLocaleString('en-CA', {minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2});
const count = () => cart.reduce((a, l) => a + l.q, 0);
const save = () => { st.set('ryxa-cart-v2', JSON.stringify(cart)); st.set('ryxa-cart', count()); document.querySelectorAll('.cartn').forEach(e => e.textContent = count()); };
const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const V = t => `<span class="cd-v">${t}</span>`;            // a measured value: Plex Mono
const vials = q => `${V(q)} ${q === 1 ? 'vial' : 'vials'}`;

const css = `
.cd-scrim{position:fixed;inset:0;z-index:90;background:rgba(18,19,22,.52);opacity:0;transition:opacity .24s ease;pointer-events:none}
.cd-open .cd-scrim{opacity:1;pointer-events:auto}
.cdw{--k:#121316;--k2:#3A3D44;--k3:#5B5E66;--rule:#DAD6CC;--wash:#ECE9E1;--nv:#233766;--pad:28px;
  position:fixed;top:0;right:0;bottom:0;z-index:91;width:min(468px,100vw);background:#F5F3EE;color:var(--k);display:flex;flex-direction:column;
  transform:translateX(102%);visibility:hidden;transition:transform .24s cubic-bezier(.32,.72,0,1),visibility 0s .24s;
  font:400 14px/1.5 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;text-align:left}
.cd-open .cdw{transform:none;visibility:visible;box-shadow:-30px 0 70px -36px rgba(18,19,22,.55);transition:transform .36s cubic-bezier(.32,.72,0,1),visibility 0s}
.cdw *,.cdw *::before,.cdw *::after{box-sizing:border-box}
.cdw button{appearance:none;-webkit-appearance:none;border:0;background:none;padding:0;margin:0;font:inherit;color:inherit;letter-spacing:0;text-transform:none;cursor:pointer;border-radius:0;width:auto;height:auto;min-width:0}
.cdw a{color:inherit;text-decoration:none}
.cdw :focus-visible{outline:2px solid var(--nv);outline-offset:2px}
.cdw .cd-v{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:.95em;letter-spacing:-.01em}
.cdw .cd-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}

.cdw .cd-h{display:flex;align-items:center;gap:12px;padding:14px 18px 0 var(--pad);min-height:62px}
.cdw .cd-h h2{margin:0;padding:0;font:600 20px/1.2 Archivo,system-ui,sans-serif;font-stretch:118%;letter-spacing:0;text-transform:none;color:var(--k)}
.cdw .cd-cnt{font-size:13px;color:var(--k3);padding-top:4px}
.cdw .cd-x{margin-left:auto;width:40px;height:40px;display:grid;place-items:center;border-radius:4px;color:var(--k);transition:background-color .15s ease}
.cdw .cd-x:hover{background:var(--wash)}
.cdw .cd-ship{margin:0;padding:0 var(--pad) 12px;font-size:13px;line-height:1.4;color:var(--k2)}
.cdw .cd-ship b{font-weight:600;color:var(--k)}
.cdw .cd-bar{flex:none;height:2px;background:var(--rule);overflow:hidden}
.cdw .cd-bar i{display:block;height:100%;background:var(--nv);transform-origin:0 50%;transform:scaleX(0);transition:transform .5s cubic-bezier(.23,1,.32,1)}

.cdw .cd-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:0 var(--pad) 24px;scrollbar-width:thin;scrollbar-color:#CCC8BE transparent}
.cdw .cd-ls{list-style:none;margin:0;padding:0}
.cdw .cd-l{display:grid;grid-template-columns:52px minmax(0,1fr) auto;column-gap:16px;margin:0;padding:18px 0 16px;border-bottom:1px solid var(--rule)}
.cdw .cd-th{--th:66px;grid-column:1;grid-row:1/4;align-self:start;width:52px;height:var(--th);display:flex;align-items:center;justify-content:center;overflow:hidden}
.cdw .cd-th img{display:block;flex:none;height:calc(var(--th) * 1.2);width:auto;max-width:none}
.cdw .cd-i{grid-column:2;min-width:0}
.cdw .cd-n{margin:0;font:600 16px/1.25 Archivo,system-ui,sans-serif;font-stretch:112%;letter-spacing:0;color:var(--k);overflow-wrap:anywhere}
.cdw .cd-n a:hover{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
.cdw .cd-m{display:flex;align-items:center;gap:8px;margin-top:5px;font-size:12.5px;line-height:1.3;color:var(--k2)}
.cdw .cd-fam{font:500 10.5px/1 "IBM Plex Mono",ui-monospace,monospace;color:#121316;background:var(--c);padding:3px 5px 2px;border-radius:2px;letter-spacing:0}
.cdw .cd-p{grid-column:3;text-align:right;white-space:nowrap}
.cdw .cd-pt{display:flex;justify-content:flex-end;align-items:baseline;gap:8px;line-height:1.25}
.cdw .cd-pt b{font:500 15px/1.25 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:-.01em}
.cdw .cd-pt s{font:400 12.5px/1.25 "IBM Plex Mono",ui-monospace,monospace;color:var(--k3)}
.cdw .cd-p small{display:block;margin-top:5px;font-size:12px;line-height:1.3;color:var(--k3)}
.cdw .cd-c{grid-column:2/4;display:flex;align-items:center;gap:16px;margin-top:12px}
.cdw .cd-q{display:inline-flex;align-items:stretch;height:34px;border:1px solid #C4C0B5;border-radius:3px;background:#FAF9F6}
.cdw .cd-q button{width:34px;display:grid;place-items:center;color:var(--k);transition:background-color .12s ease}
.cdw .cd-q button:hover{background:var(--wash)}
.cdw .cd-q button:focus-visible{outline-offset:-2px;border-radius:3px}
.cdw .cd-q span{min-width:38px;padding:0 6px;display:grid;place-items:center;font:500 14px/1 "IBM Plex Mono",ui-monospace,monospace;border-left:1px solid var(--rule);border-right:1px solid var(--rule)}
.cdw .cd-rm{font-size:13px;color:var(--k3);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;padding:6px 0}
.cdw .cd-rm:hover{color:var(--k)}
.cdw .cd-up{grid-column:2/4;margin:10px 0 0;font-size:13px;line-height:1.5;color:var(--k2);text-wrap:pretty}
.cdw .cd-t{font-weight:600;color:var(--k);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
.cdw .cd-t:hover{color:var(--nv)}
.cdw .cd-l.cd-asking{background:var(--wash);margin:0 calc(var(--pad) * -1);padding-left:var(--pad);padding-right:var(--pad)}
.cdw .cd-askb{display:flex;gap:8px;margin-top:10px}
.cdw .cd-sb{height:34px;padding:0 14px;border-radius:3px;font:600 13px/1 Inter,system-ui,sans-serif;background:var(--k);color:#F5F3EE;transition:transform .12s ease}
.cdw .cd-sb.cd-o{background:none;color:var(--k);box-shadow:inset 0 0 0 1px #85878C}
.cdw .cd-sb:active{transform:scale(.97)}

.cdw .cd-xs{margin-top:26px}
.cdw .cd-xs h3{margin:0;padding:0 0 8px;font:600 13px/1.4 Inter,system-ui,sans-serif;font-stretch:100%;letter-spacing:0;text-transform:none;color:var(--k);border-bottom:1px solid var(--rule)}
.cdw .cd-xi{display:grid;grid-template-columns:30px minmax(0,1fr) auto auto;align-items:center;column-gap:14px;padding:7px 0;border-bottom:1px solid var(--rule)}
.cdw .cd-xt{width:30px;height:40px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.cdw .cd-xt img{display:block;flex:none;height:50px;width:auto;max-width:none}
.cdw .cd-xn{min-width:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:1px 8px;font:600 14px/1.3 Archivo,system-ui,sans-serif;font-stretch:110%}
.cdw .cd-xn .cd-v{font-weight:400;font-size:12.5px;font-stretch:100%;color:var(--k3);white-space:nowrap}
.cdw .cd-xp{font:500 13.5px/1 "IBM Plex Mono",ui-monospace,monospace}
.cdw .cd-xa{min-width:40px;padding:9px 0;text-align:right;font:600 13px/1 Inter,system-ui,sans-serif;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
.cdw .cd-xa:hover{color:var(--nv)}

.cdw .cd-f{position:relative;flex:none;border-top:1px solid var(--k);padding:14px var(--pad) 20px;background:#F5F3EE}
.cdw .cd-r{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:2px 0;font-size:13.5px;line-height:1.5;color:var(--k2)}
.cdw .cd-r b{font-weight:500;color:var(--k)}
.cdw .cd-r.cd-sv b{color:var(--nv)}
.cdw .cd-tot{display:flex;justify-content:space-between;align-items:baseline;gap:16px;margin-top:8px;padding-top:10px;border-top:1px solid var(--rule);font:600 15px/1.3 Inter,system-ui,sans-serif}
.cdw .cd-tot b{font:500 22px/1.1 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:-.02em}
.cdw .cd-pay{display:flex;flex-wrap:wrap;align-items:center;gap:4px 16px;margin:10px 0 0;font-size:13px;line-height:1.4;color:var(--k2)}
.cdw .cd-pay span{display:inline-flex;align-items:center;gap:7px;white-space:nowrap}
.cdw .cd-pay svg{flex:none;color:var(--k)}
.cdw .cd-att{display:flex;gap:10px;align-items:flex-start;margin:14px 0 12px;font-size:13px;line-height:1.45;color:var(--k);cursor:pointer}
.cdw .cd-att input{appearance:none;-webkit-appearance:none;flex:none;width:18px;height:18px;margin:1px 0 0;padding:0;border:1.5px solid var(--k);border-radius:2px;background:#FAF9F6 center/12px 12px no-repeat;cursor:pointer;transition:background-color .14s ease,box-shadow .2s ease}
.cdw .cd-att input:checked{background-color:var(--k);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2.2 6.3l2.5 2.5 5.1-5.4' fill='none' stroke='%23F5F3EE' stroke-width='1.7'/%3E%3C/svg%3E")}
.cdw .cd-att.cd-need input{box-shadow:0 0 0 4px rgba(35,55,102,.26)}
.cdw .cd-go{width:100%;height:52px;border-radius:4px;display:flex;align-items:center;justify-content:center;font:600 15px/1 Inter,system-ui,sans-serif;background:var(--k);color:#F5F3EE;box-shadow:inset 0 0 0 1.5px var(--k);transition:background-color .2s ease,color .2s ease,transform .12s ease}
.cdw .cd-go[aria-disabled=true]{background:transparent;color:var(--k);cursor:default}
.cdw .cd-go:not([aria-disabled=true]):hover{background:#262930}
.cdw .cd-go:not([aria-disabled=true]):active{transform:scale(.985)}
.cdw .cd-note{margin:10px 0 0;font-size:12px;line-height:1.45;color:var(--k3);text-wrap:pretty}
.cdw .cd-pop{position:absolute;left:var(--pad);right:var(--pad);bottom:calc(100% + 12px);margin:0;padding:11px 14px;border-radius:4px;background:var(--k);color:#F5F3EE;font:500 13.5px/1.4 Inter,system-ui,sans-serif;opacity:0;transform:translateY(6px);transition:opacity .18s ease,transform .24s cubic-bezier(.23,1,.32,1);pointer-events:none}
.cdw .cd-pop.cd-show{opacity:1;transform:none}

.cdw .cd-empty{padding:28px 0 0}
.cdw .cd-empty p{margin:0}
.cdw .cd-e1{font:600 18px/1.3 Archivo,system-ui,sans-serif;font-stretch:112%;color:var(--k)}
.cdw .cd-e2{margin-top:6px!important;font-size:14px;line-height:1.5;color:var(--k2);max-width:34ch}
.cdw .cd-eb{display:inline-flex;align-items:center;height:48px;padding:0 20px;margin-top:22px;border-radius:4px;background:var(--k);color:#F5F3EE;font:600 15px/1 Inter,system-ui,sans-serif;transition:background-color .2s ease}
.cdw .cd-eb:hover{background:#262930}

/* short screens and phones: the breakdown scrolls with the list, only the subtotal, the confirmation and the button stay pinned */
.cdw .cd-det-b{display:none}
@media (max-width:600px),(max-height:780px){
  .cdw .cd-f .cd-det{display:none}
  .cdw .cd-det-b{display:block;margin-top:22px}
  .cdw .cd-xs + .cd-det-b{margin-top:16px}
  .cdw .cd-tot{margin-top:0;padding-top:0;border-top:0}
  .cdw .cd-f{padding-top:13px;padding-bottom:16px}
  .cdw .cd-att{margin:10px 0 12px}
}
@media (max-width:600px){
  .cdw{--pad:20px}
  .cdw .cd-h{padding-right:10px;min-height:58px}
  .cdw .cd-l{grid-template-columns:46px minmax(0,1fr) auto;column-gap:14px;padding:16px 0 14px}
  .cdw .cd-th{--th:58px;width:46px}
  .cdw .cd-q{height:36px}.cdw .cd-q button{width:36px}
  .cdw .cd-f{padding-bottom:calc(14px + env(safe-area-inset-bottom,0px))}
}
@media (prefers-reduced-motion:reduce){.cd-scrim,.cdw,.cd-open .cdw,.cdw .cd-bar i,.cdw .cd-go,.cdw .cd-pop,.cdw .cd-sb{transition:none!important}}
`;
const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);

const root = document.createElement('div'); root.innerHTML = `<div class="cd-scrim"></div>
<aside class="cdw" role="dialog" aria-modal="true" aria-labelledby="cdT" aria-hidden="true">
  <div class="cd-h"><h2 id="cdT">Your cart</h2><span class="cd-cnt" id="cdN"></span><button class="cd-x" aria-label="Close cart"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 2.5l11 11M13.5 2.5l-11 11" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></button></div>
  <p class="cd-ship" id="cdFree"></p>
  <div class="cd-bar" aria-hidden="true"><i id="cdBar"></i></div>
  <div class="cd-body" id="cdB"></div>
  <div class="cd-f" id="cdFw"><p class="cd-pop" id="cdPop" role="status"></p><div id="cdF"></div></div>
  <div class="cd-sr" id="cdLive" aria-live="polite"></div>
</aside>`;
document.body.appendChild(root);
const dw = root.querySelector('.cdw'), scrim = root.querySelector('.cd-scrim'), $ = q => dw.querySelector(q);
let lastFocus = null, attested = false;
const isOpen = () => document.documentElement.classList.contains('cd-open');
const open = () => { if (isOpen()) return; lastFocus = document.activeElement; render(); document.documentElement.classList.add('cd-open'); dw.setAttribute('aria-hidden', 'false'); setTimeout(() => $('.cd-x').focus(), 60); };
const close = () => { if (!isOpen()) return; document.documentElement.classList.remove('cd-open'); dw.setAttribute('aria-hidden', 'true'); ask = -1; if (lastFocus && lastFocus.focus) lastFocus.focus(); };
scrim.addEventListener('click', close); $('.cd-x').addEventListener('click', close);
addEventListener('keydown', e => {
  if (!isOpen()) return;
  if (e.key === 'Escape'){ close(); return; }
  if (e.key !== 'Tab') return;                                   // keep Tab inside the open drawer
  const f = [...dw.querySelectorAll('a[href],button,input')].filter(el => el.offsetParent !== null); if (!f.length) return;
  const a = document.activeElement, first = f[0], last = f[f.length - 1];
  if (!dw.contains(a)){ e.preventDefault(); first.focus(); }
  else if (e.shiftKey && a === first){ e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && a === last){ e.preventDefault(); first.focus(); }
});

const img = p => `<img src="v/${p.img}.webp" alt="" loading="lazy" aria-hidden="true">`;
const ICO_ET = `<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect x="1.5" y="4" width="15" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 9h6M9 6.8L11.2 9 9 11.2" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`;
const ICO_BT = `<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="7.2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M7 5.6v6.8M7 5.6h2.9a1.6 1.6 0 010 3.2H7m0 0h3.3a1.7 1.7 0 010 3.4H7M8.3 4.4v1.2m0 6.8v1.2" stroke="currentColor" stroke-width="1.1" fill="none"/></svg>`;

function render(){
  // remember which control had focus so a re-render does not drop keyboard users back to the page
  const ae = document.activeElement, key = dw.contains(ae) && ae.dataset ? ae.dataset.k : '';
  const n = count();
  $('#cdN').innerHTML = n ? vials(n) : '';
  let sub = 0, list = 0, tbd = 0;
  cart.forEach(l => { const p = P[l.s]; sub += unit(p, l.q) * l.q; list += (p.pr ? p.pr[0] : 0) * l.q; if (!p.pr) tbd += l.q; });
  const free = $('#cdFree'), left = Math.max(0, FREE - sub);
  free.innerHTML = left ? `Add <b>${V(money(left))}</b> for free tracked shipping.` : `<b>Free tracked shipping</b> on this order.`;
  free.hidden = !n; $('#cdBar').style.transform = `scaleX(${n ? Math.min(1, sub / FREE) : 0})`;
  const B = $('#cdB'), F = $('#cdF');
  if (!n){
    B.innerHTML = `<div class="cd-empty"><p class="cd-e1">Your cart is empty.</p><p class="cd-e2">Ships Monday to Thursday from BC, tracked. Every vial’s lot has a public COA.</p><a class="cd-eb" href="shop.html" data-k="shop">Browse the catalogue</a></div>`;
    F.innerHTML = ''; $('#cdFw').hidden = true; refocus(key); return;
  }
  $('#cdFw').hidden = false;
  let html = '<ul class="cd-ls">' + cart.map((l, i) => { const p = P[l.s], u = unit(p, l.q), next = l.q < 5 ? 5 : l.q < 10 ? 10 : 0, nm = esc(p.n);
    const sv = p.pr && next ? p.pr[0] * next - unit(p, next) * next : 0, asking = ask === i && l.q > 1 && p.pr;
    const up = asking ? `<div class="cd-up" role="group" aria-label="Remove ${nm}"><span>Remove all ${vials(l.q)}, or keep ${vials(1)} at ${V(money(p.pr[0]))}?</span><div class="cd-askb"><button class="cd-sb" data-to="1" data-i="${i}" data-k="k:${l.s}">Keep 1</button><button class="cd-sb cd-o" data-rmok="${i}" data-k="x:${l.s}">Remove</button></div></div>`
      : p.pr && next ? `<p class="cd-up"><button class="cd-t" data-to="${next}" data-i="${i}" data-k="u:${l.s}">Make it ${next} vials</button> at ${V(money(unit(p, next)))} each and save ${V(money(sv))}.</p>` : '';
    return `<li class="cd-l${asking ? ' cd-asking' : ''}" style="--c:var(--${p.c},#9AA8CF)"><div class="cd-th">${img(p)}</div>
      <div class="cd-i"><p class="cd-n"><a href="p-${l.s}.html">${nm}</a></p><div class="cd-m">${V(esc(p.st))}<span class="cd-fam" title="${esc(FN[p.f] || p.f)}">${esc(p.f)}</span></div></div>
      <div class="cd-p">${p.pr ? `<div class="cd-pt">${u < p.pr[0] ? `<s><span class="cd-sr">List price </span>${money(p.pr[0] * l.q)}</s>` : ''}<b>${money(u * l.q)}</b></div>${l.q > 1 ? `<small>${V(money(u))} per vial</small>` : ''}` : '<small>Price at launch</small>'}</div>
      <div class="cd-c"><span class="cd-q"><button data-d="-1" data-i="${i}" data-k="m:${l.s}" aria-label="One fewer ${nm}"><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 5h8" stroke="currentColor" stroke-width="1.4"/></svg></button><span>${l.q}</span><button data-d="1" data-i="${i}" data-k="p:${l.s}" aria-label="One more ${nm}"><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 5h8M5 1v8" stroke="currentColor" stroke-width="1.4"/></svg></button></span>${asking ? '' : `<button class="cd-rm" data-rm="${i}" data-k="r:${l.s}" aria-label="Remove ${nm}">Remove</button>`}</div>${up}</li>`; }).join('') + '</ul>';
  // same-family suggestions not already in the cart (Retatrutide is never suggested)
  const fams = new Set(cart.map(l => P[l.s].f)), inCart = new Set(cart.map(l => l.s));
  let xs = []; for (const f of [...fams].reverse()){ xs = Object.entries(P).filter(([k, p]) => p.f === f && !inCart.has(k) && p.pr && k !== 'retatrutide').slice(0, 2); if (xs.length) break; }
  if (xs.length) html += `<div class="cd-xs"><h3>Also in ${esc(FN[xs[0][1].f] || xs[0][1].f)}</h3>${xs.map(([k, p]) => `<div class="cd-xi"><span class="cd-xt">${img(p)}</span><span class="cd-xn"><span>${esc(p.n)}</span>${V(esc(p.st))}</span><span class="cd-xp">${money(p.pr[0])}</span><button class="cd-xa" data-add="${k}" data-k="a:${k}" aria-label="Add ${esc(p.n)} ${esc(p.st)} to cart">Add</button></div>`).join('')}</div>`;
  const saved = list - sub;
  const rows = (saved > 0 ? `<div class="cd-r"><span>Vials at list price</span><b>${V(money(list))}</b></div><div class="cd-r cd-sv"><span>Pack pricing</span><b>${V('−' + money(saved))}</b></div>` : '')
    + (tbd ? `<div class="cd-r"><span>Price at launch</span><b>${vials(tbd)}</b></div>` : '')
    + `<div class="cd-r"><span>Shipping, tracked</span><b>${left ? 'At checkout' : 'Free'}</b></div>`;
  const pay = `<p class="cd-pay">Pay by <span>${ICO_ET}Interac e-Transfer</span><span>${ICO_BT}Bitcoin or USDT</span></p>`;
  const note = `<p class="cd-note">Ships Monday to Thursday from BC. Every vial’s lot has a public COA.</p>`;
  B.innerHTML = html + `<div class="cd-det-b">${rows}${pay}${note}</div>`;
  F.innerHTML = `<div class="cd-det">${rows}</div><div class="cd-tot"><span>Subtotal</span><b>${money(sub)}</b></div><div class="cd-det">${pay}</div>
    <label class="cd-att"><input type="checkbox" id="cdAtt" data-k="att"${attested ? ' checked' : ''}><span>I confirm these products are for laboratory research use only, and that I am 19 or older.</span></label>
    <button class="cd-go" id="cdGo" data-k="go" aria-disabled="${!attested}">Continue to checkout</button><div class="cd-det">${note}</div>`;
  refocus(key);
}
function refocus(key){
  if (!key || !isOpen()) return; const sl = key.slice(2);
  const el = [key, 'k:' + sl, 'u:' + sl, 'p:' + sl].map(k => dw.querySelector(`[data-k="${k}"]`)).find(Boolean) || $('.cd-x');
  if (el && el !== document.activeElement) el.focus({preventScroll: key[0] !== 'r'});
}
const say = t => { $('#cdLive').textContent = t; };
dw.addEventListener('click', e => {
  const sh = e.target.closest('a.cd-eb'); if (sh && /(^|\/)shop\.html$/.test(location.pathname)){ e.preventDefault(); close(); return; }
  const t = e.target.closest('button'); if (!t || t.classList.contains('cd-x')) return; e.stopPropagation();
  const line = i => { const l = cart[i], p = l && P[l.s]; return l ? `${p.n}, ${l.q} ${l.q === 1 ? 'vial' : 'vials'}.` : ''; };
  if (t.dataset.d){ ask = -1; const i = +t.dataset.i, l = cart[i], nm = P[l.s].n; l.q = Math.max(0, Math.min(50, l.q + +t.dataset.d)); if (!l.q) cart.splice(i, 1); save(); render(); say(l.q ? line(i) : `${nm} removed.`); }
  else if (t.dataset.to){ const i = +t.dataset.i; cart[i].q = +t.dataset.to; ask = -1; save(); render(); say(line(i)); }
  else if (t.dataset.rmok){ const nm = P[cart[+t.dataset.rmok].s].n; cart.splice(+t.dataset.rmok, 1); ask = -1; save(); render(); say(`${nm} removed.`); }
  else if (t.dataset.rm){ const i = +t.dataset.rm, l = cart[i], nm = P[l.s].n; if (l.q > 1 && P[l.s].pr && ask !== i){ ask = i; render(); } else { cart.splice(i, 1); ask = -1; save(); render(); say(`${nm} removed.`); } }
  else if (t.dataset.add){ add(t.dataset.add, 1, false); say(`${P[t.dataset.add].n} added.`); }
  else if (t.id === 'cdGo'){
    if (!attested){ pop('Tick the research-use confirmation first.'); const a = $('.cd-att'), b = $('#cdAtt'); b.focus(); a.classList.add('cd-need'); clearTimeout(a._t); a._t = setTimeout(() => a.classList.remove('cd-need'), 1600); return; }
    pop('Preview: checkout connects at launch.');
  }
});
dw.addEventListener('change', e => { if (e.target.id === 'cdAtt'){ attested = e.target.checked; $('#cdGo').setAttribute('aria-disabled', !attested); $('.cd-att').classList.remove('cd-need'); if (attested) $('#cdPop').classList.remove('cd-show'); } });
const pp = $('#cdPop');
function pop(t){ pp.textContent = t; pp.classList.add('cd-show'); clearTimeout(pp._t); pp._t = setTimeout(() => pp.classList.remove('cd-show'), 2600); }
function add(slug, q = 1, show = true){ if (!P[slug]) return; q = Math.max(1, Math.min(50, +q || 1)); const l = cart.find(x => x.s === slug); if (l) l.q = Math.min(50, l.q + q); else cart.push({s: slug, q}); ask = -1; save(); render(); if (show && !isOpen()) open(); }
window.ryxaCart = {open, close, add};
window.ryxaAdd = q => { const sl = document.body.dataset.slug; if (sl && P[sl]) add(sl, q); else open(); };
document.addEventListener('click', e => {
  const a = e.target.closest('[data-add]'); if (a && !dw.contains(a)){ e.preventDefault(); add(a.dataset.add, +(a.dataset.q || 1)); return; }
  const c = e.target.closest('a[href$="cart.html"],.js-cart'); if (c){ e.preventDefault(); open(); }
});
save();
})();

/* lab desk: floating help with WhatsApp, text, email. Declines use and dosing questions up front. */
(()=>{
const c2=document.createElement('style');c2.textContent=`
.ld-b{position:fixed;right:20px;bottom:20px;z-index:80;height:52px;padding:0 18px 0 8px;border-radius:999px;border:1px solid #2C3038;background:#17191D;color:#F5F3EE;display:flex;align-items:center;gap:10px;font:600 14px Inter,sans-serif;cursor:pointer;box-shadow:0 18px 40px -12px rgba(0,0,0,.7);transition:transform .2s cubic-bezier(.23,1,.32,1),border-color .2s}
.ld-b:hover{border-color:#9AA8CF}.ld-b:active{transform:scale(.96)}.ld-b:focus-visible{outline:2px solid #9AA8CF;outline-offset:3px}
.ld-av{position:relative;width:36px;height:36px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#3A4E8E,#233766);display:grid;place-items:center}
.ld-av::after{display:none}
.ld-b{padding:0 8px!important;gap:0!important}.ld-b .t{max-width:0;overflow:hidden;white-space:nowrap;transition:max-width .35s cubic-bezier(.23,1,.32,1),margin .35s}
.ld-b:hover .t,.ld-b:focus-visible .t{max-width:170px;margin:0 10px}
.ld-p{position:fixed;right:20px;bottom:84px;z-index:81;width:min(360px,calc(100vw - 40px));background:#141518;color:#F5F3EE;border:1px solid #2A2D33;border-radius:18px;box-shadow:0 30px 80px -20px rgba(0,0,0,.8);padding:20px;font:400 14px/1.5 Inter,sans-serif;
  transform-origin:bottom right;transform:translateY(10px) scale(.96);opacity:0;pointer-events:none;transition:transform .35s cubic-bezier(.23,1,.32,1),opacity .25s}
.ld-open .ld-p{transform:none;opacity:1;pointer-events:auto}
.ld-p h4{margin:0;font:600 18px Archivo,sans-serif;font-stretch:115%}.ld-p .s{margin:4px 0 14px;color:#9EA2AB;font-size:13px}
.ld-p a{display:grid;grid-template-columns:34px 1fr;gap:12px;align-items:center;padding:11px 12px;border:1px solid #24272D;border-radius:12px;margin-top:8px;color:#F5F3EE;text-decoration:none;transition:border-color .2s,background .2s}
.ld-p a:hover{border-color:#3A3F4A;background:#1A1C21}
.ld-p a i{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:#1E2230;font-style:normal}
.ld-p a.wa i{background:rgba(37,211,102,.12);color:#6FDB9A}
.ld-p a b{display:block;font:600 14px Inter,system-ui,sans-serif!important;letter-spacing:0;color:#F5F3EE}.ld-p a span span{font:400 12px "IBM Plex Mono",monospace!important;color:#868A93}.ld-p a>span{font:inherit}
.ld-p .n{margin:14px 0 0;font-size:12px;color:#6F737C}
html.cd-open .ld-b{opacity:0;pointer-events:none}
@media (max-width:600px){.ld-b span.t{display:none}.ld-b{padding:0 8px}.ld-b{right:14px;bottom:14px}.ld-p{right:14px;bottom:76px}}
@media (prefers-reduced-motion:reduce){.ld-p,.ld-b{transition:none}}`;document.head.appendChild(c2);
const w=document.createElement('div');w.innerHTML=`<button class="ld-b" aria-expanded="false" aria-controls="ldp"><span class="ld-av"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5F3EE" stroke-width="1.6"><path d="M4 5h16v11H9l-5 4z"/></svg></span><span class="t">Ask the lab desk</span></button>
<div class="ld-p" id="ldp" role="dialog" aria-label="Contact the lab desk"><h4>Lab desk</h4><p class="s">Lots, orders, invoices and accounts. We reply within one business day.</p>
<a class="wa" href="https://wa.me/16722303023" target="_blank" rel="noopener"><i>✆</i><span><b>WhatsApp</b><span>672-230-3023</span></span></a>
<a href="sms:+16722303023"><i>✉</i><span><b>Text or call</b><span>672-230-3023</span></span></a>
<a href="mailto:sales@ryxalabs.com"><i>@</i><span><b>Orders and claims</b><span>sales@ryxalabs.com</span></span></a>
<a href="mailto:info@ryxalabs.com"><i>@</i><span><b>General questions</b><span>info@ryxalabs.com</span></span></a>
<p class="n">We can’t answer questions about use, dosing or preparation. Research use only.</p></div>`;document.body.appendChild(w);
const b=w.querySelector('.ld-b'),pn=w.querySelector('.ld-p');const tog=o=>{document.documentElement.classList.toggle('ld-open',o);b.setAttribute('aria-expanded',o)};
b.addEventListener('click',()=>tog(!document.documentElement.classList.contains('ld-open')));
addEventListener('keydown',e=>{if(e.key==='Escape')tog(false)});document.addEventListener('click',e=>{if(!w.contains(e.target))tog(false)});
})();

/* cookie consent (client checklist 19): a small bar, never an overlay. It waits for the 19+ gate (ryxa-19 = "1"),
   offers two real choices and stores "all" or "essential" in ryxa-consent. Facts are from the Privacy policy, section 4.
   Analytics should load only when ryxa-consent is "all" (listen for the "ryxa-consent" event on window). */
(()=>{
const get=k=>{try{return localStorage.getItem(k)}catch(e){return null}},set=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
if(get('ryxa-consent'))return;
const c=document.createElement('style');c.textContent=`
.ck{position:fixed;z-index:70;left:20px;bottom:20px;width:max-content;max-width:min(850px,calc(100vw - 440px));box-sizing:border-box;display:flex;align-items:center;gap:12px 22px;padding:12px 12px 12px 18px;
  background:#121316;color:#F5F3EE;border:1px solid #2C3038;border-radius:6px;box-shadow:0 16px 36px -16px rgba(0,0,0,.6);font:400 13.5px/1.45 Inter,system-ui,sans-serif;text-align:left;
  opacity:0;transform:translateY(8px);transition:opacity .22s ease,transform .3s cubic-bezier(.23,1,.32,1)}
.ck.ck-in{opacity:1;transform:none}
.ck p{margin:0;flex:1 1 300px;min-width:0;color:#D3D4D8}
.ck a{color:#F5F3EE;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;white-space:nowrap}
.ck-b{display:flex;gap:8px;flex:none}
.ck button{appearance:none;-webkit-appearance:none;box-sizing:border-box;margin:0;height:40px;padding:0 16px;border-radius:4px;border:1px solid #4A4E58;background:none;color:#F5F3EE;font:600 13.5px/1 Inter,system-ui,sans-serif;white-space:nowrap;cursor:pointer;transition:background-color .15s ease,border-color .15s ease,transform .12s ease}
.ck button:hover{border-color:#9AA8CF}
.ck button.ck-y{background:#F5F3EE;border-color:#F5F3EE;color:#121316}
.ck button.ck-y:hover{background:#fffdf8;border-color:#fffdf8}
.ck button:active{transform:scale(.97)}
.ck button:focus-visible,.ck a:focus-visible{outline:2px solid #9AA8CF;outline-offset:2px}
@media (max-width:900px){
  .ck{left:0;right:0;bottom:0;width:auto;max-width:none;border-width:1px 0 0;border-radius:0;box-shadow:none;padding:12px 20px calc(12px + env(safe-area-inset-bottom,0px))}
  html.ck-on body{padding-bottom:var(--ck-h,0px)}
  html.ck-on .ld-b{bottom:calc(20px + var(--ck-h,0px))}
  html.ck-on .ld-p{bottom:calc(84px + var(--ck-h,0px))}
}
@media (max-width:600px){
  .ck{flex-direction:column;align-items:stretch;gap:10px;padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));font-size:13px}
  .ck p{flex:none}
  .ck-b button{flex:1;height:42px;padding:0 10px}
  html.ck-on .ld-b{bottom:calc(14px + var(--ck-h,0px))}
  html.ck-on .ld-p{bottom:calc(76px + var(--ck-h,0px))}
}
@media (prefers-reduced-motion:reduce){.ck{transition:none}}
@media print{.ck{display:none}}`;document.head.appendChild(c);
let bar=null,poll=0,ro=null;const H=document.documentElement;
const size=()=>{if(bar)H.style.setProperty('--ck-h',bar.offsetHeight+'px')};
function show(){
  if(bar||get('ryxa-consent')||get('ryxa-19')!=='1')return;clearInterval(poll);
  bar=document.createElement('div');bar.className='ck';bar.setAttribute('role','region');bar.setAttribute('aria-label','Cookie choices');
  bar.innerHTML=`<p>We use essential cookies (the cart and the age confirmation) and privacy-friendly analytics. No advertising cookies. <a href="privacy.html">Privacy policy</a></p><div class="ck-b"><button type="button" data-v="essential">Essential only</button><button type="button" class="ck-y" data-v="all">Accept analytics</button></div>`;
  document.body.appendChild(bar);H.classList.add('ck-on');size();
  if(window.ResizeObserver){ro=new ResizeObserver(size);ro.observe(bar)}else addEventListener('resize',size);
  requestAnimationFrame(()=>requestAnimationFrame(()=>bar&&bar.classList.add('ck-in')));
  bar.addEventListener('click',e=>{const b=e.target.closest('button[data-v]');if(b)choose(b.dataset.v)});
}
function choose(v){
  set('ryxa-consent',v);try{window.dispatchEvent(new CustomEvent('ryxa-consent',{detail:v}))}catch(e){}
  hide();
}
function hide(){
  if(!bar)return;const b=bar;bar=null;if(ro)ro.disconnect();b.classList.remove('ck-in');H.classList.remove('ck-on');H.style.removeProperty('--ck-h');setTimeout(()=>b.remove(),260);
}
show();
if(!bar){
  // the 19+ gate sets ryxa-19 when it is accepted: show the bar just after, without a reload
  document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#gateok'))setTimeout(show,450)});
  addEventListener('focus',show);document.addEventListener('visibilitychange',()=>{if(!document.hidden)show()});
  poll=setInterval(show,1500);
}
addEventListener('storage',e=>{if(e.key==='ryxa-consent'&&e.newValue)hide();else if(e.key==='ryxa-19')show()});
})();
