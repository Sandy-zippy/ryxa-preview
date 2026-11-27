/* RYXA cart drawer: real line items, the approved 1 / 5 / 10 vial ladder, free shipping over $200,
   same-family suggestions, payment methods and the research attestation. Works on every page.
   Needs window.RYXA_P (lib/catalog.js). Preview only: checkout is not connected. */
(()=>{
const P = window.RYXA_P || {}; const FREE = 200;
const FN = {'RX-01':'Repair & recovery','RX-02':'Metabolic & longevity','RX-03':'Cognitive','RX-04':'Aesthetic & wellness'};
let ask = -1;
const st = {get(k){try{return localStorage.getItem(k)}catch(e){return null}}, set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
let cart = []; try{ cart = JSON.parse(st.get('ryxa-cart-v2') || '[]').filter(l => P[l.s]); }catch(e){ cart = []; }
const unit = (p, q) => !p.pr ? 0 : q >= 10 ? p.pr[2] : q >= 5 ? p.pr[1] : p.pr[0];
const money = v => '$' + v.toLocaleString('en-CA', {minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2});
const count = () => cart.reduce((a, l) => a + l.q, 0);
const save = () => { st.set('ryxa-cart-v2', JSON.stringify(cart)); st.set('ryxa-cart', count()); document.querySelectorAll('.cartn').forEach(e => e.textContent = count()); };

const css = `
.cd-scrim{position:fixed;inset:0;z-index:90;background:rgba(6,7,9,.55);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);opacity:0;transition:opacity .35s ease;pointer-events:none}
.cd-open .cd-scrim{opacity:1;pointer-events:auto}
.cdw{position:fixed;top:0;right:0;bottom:0;z-index:91;width:min(460px,100vw);background:#141518;color:#F5F3EE;border-left:1px solid #2A2D33;display:flex;flex-direction:column;
  transform:translateX(104%);visibility:hidden;transition:transform .5s cubic-bezier(.23,1,.32,1),visibility 0s .5s;box-shadow:-40px 0 80px -20px rgba(0,0,0,.6);font:400 15px/1.5 Inter,system-ui,sans-serif}
.cd-open .cdw{transform:none;visibility:visible;transition:transform .5s cubic-bezier(.23,1,.32,1),visibility 0s}
.cdw *{box-sizing:border-box}
.cd-h{display:flex;align-items:center;justify-content:space-between;padding:22px 24px 16px}
.cd-h b{font:600 20px Archivo,sans-serif;font-stretch:118%}.cd-h small{font:500 12px "IBM Plex Mono",monospace;color:#868A93;margin-left:10px}
.cd-x{all:unset;cursor:pointer;width:38px;height:38px;border-radius:50%;border:1px solid #2A2D33;display:grid;place-items:center;transition:border-color .2s}
.cd-x:hover{border-color:#6F737C}.cd-x:focus-visible{outline:2px solid #9AA8CF;outline-offset:2px}
.cd-free{margin:0 24px 8px;padding:12px 14px;border-radius:12px;background:#1A1C21;font-size:13.5px;color:#C9CBD0}
.cd-free b{color:#F5F3EE}
.cd-bar{height:4px;border-radius:4px;background:#2A2D33;margin-top:10px;overflow:hidden}
.cd-bar i{display:block;height:100%;background:linear-gradient(90deg,#233766,#9AA8CF);border-radius:4px;transition:width .6s cubic-bezier(.23,1,.32,1)}
.cd-free.ok{background:#1C2440;color:#C9D1EA}.cd-free.ok .cd-bar i{background:#9AA8CF}
.cd-body{flex:1;overflow:auto;padding:8px 24px 16px;overscroll-behavior:contain}
.cd-empty{padding:40px 0;text-align:center;color:#9EA2AB}.cd-empty a{color:#F5F3EE;text-decoration:underline;text-underline-offset:3px}
.cd-l{display:grid;grid-template-columns:72px 1fr auto;gap:14px;padding:16px 0;border-bottom:1px solid #24272D;animation:cdIn .45s cubic-bezier(.23,1,.32,1)}
@keyframes cdIn{from{opacity:0;transform:translateY(8px)}}
.cd-th{width:72px;height:88px;border-radius:10px;background:radial-gradient(70% 60% at 50% 70%,color-mix(in oklab,var(--c) 22%,#1C1E23),#17191D);display:grid;place-items:end center;overflow:hidden}
.cd-th img{width:auto;height:96%;object-fit:contain}
.cd-n{font:600 16px Archivo,sans-serif;font-stretch:112%;margin:2px 0 2px}
.cd-m{font:500 12px "IBM Plex Mono",monospace;color:#868A93}.cd-m i{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--c);margin-right:6px}
.cd-q{display:inline-flex;align-items:center;border:1px solid #2A2D33;border-radius:999px;margin-top:10px}
.cd-q button{all:unset;cursor:pointer;width:30px;height:30px;display:grid;place-items:center;font-size:16px;color:#C9CBD0;border-radius:50%}
.cd-q button:hover{color:#fff;background:#22252B}.cd-q button:focus-visible{outline:2px solid #9AA8CF}
.cd-q span{min-width:28px;text-align:center;font:500 14px "IBM Plex Mono",monospace}
.cd-p{text-align:right;font:500 15px "IBM Plex Mono",monospace}.cd-p small{display:block;font-size:11.5px;color:#868A93;margin-top:2px}
.cd-p s{color:#6F737C;font-size:12px;display:block}
.cd-up{grid-column:2/4;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:2px;padding:10px 12px;border-radius:10px;border:1px dashed #33384A;background:#171A22;font-size:13px;color:#C9CBD0}
.cd-up b{color:#F5F3EE;font-weight:600}
.cd-up button{all:unset;cursor:pointer;flex:none;font:600 13px Inter,sans-serif;padding:7px 12px;border-radius:999px;background:#F5F3EE;color:#121316;transition:transform .15s}
.cd-up button:active{transform:scale(.96)}
.cd-dn{border-style:solid;border-color:#3A3E47;background:#1B1D22}.cd-dnb{display:flex;gap:6px;flex:none}.cd-dnb .o{background:none;color:#F5F3EE;box-shadow:inset 0 0 0 1px #4A4E58}
.cd-rm{all:unset;cursor:pointer;font-size:12px;color:#6F737C;margin-left:12px;text-decoration:underline;text-underline-offset:2px}.cd-rm:hover{color:#C9CBD0}
.cd-x-sell{margin-top:22px}.cd-x-sell h4{margin:0 0 10px;font:500 12px "IBM Plex Mono",monospace;color:#868A93;font-weight:500}
.cd-xs{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.cd-xi{display:grid;grid-template-columns:44px 1fr;gap:10px;align-items:center;padding:10px;border:1px solid #24272D;border-radius:12px;background:#17191D}
.cd-xi img{height:54px;width:auto;justify-self:center}
.cd-xi b{display:block;font:600 14px Archivo,sans-serif;font-stretch:110%}.cd-xi span{font:500 12px "IBM Plex Mono",monospace;color:#9EA2AB}
.cd-xi button{all:unset;cursor:pointer;grid-column:1/3;text-align:center;font:600 13px Inter,sans-serif;padding:7px;border-radius:8px;border:1px solid #33363E;transition:border-color .2s,background .2s}
.cd-xi button:hover{border-color:#9AA8CF;background:#1E2230}
.cd-f{border-top:1px solid #2A2D33;padding:16px 24px 22px;background:#121316}
.cd-r{display:flex;justify-content:space-between;font-size:14px;color:#C9CBD0;margin:4px 0}.cd-r b{font:500 15px "IBM Plex Mono",monospace;color:#F5F3EE}
.cd-r.sv b{color:#9AA8CF}.cd-r.tot{font-size:16px;color:#F5F3EE;margin-top:8px}.cd-r.tot b{font-size:18px}
.cd-pay{display:flex;gap:8px;margin:12px 0 10px}
.cd-pay span{flex:1;display:flex;align-items:center;gap:8px;font-size:12.5px;color:#C9CBD0;padding:9px 10px;border:1px solid #24272D;border-radius:10px}
.cd-pay svg{flex:none}
.cd-att{display:flex;gap:10px;align-items:flex-start;font-size:12.5px;line-height:1.45;color:#A3A6AD;margin:4px 0 12px;cursor:pointer}
.cd-att input{margin:2px 0 0;accent-color:#9AA8CF;width:16px;height:16px;flex:none}
.cd-go{all:unset;box-sizing:border-box;cursor:pointer;width:100%;height:52px;border-radius:6px;background:#F5F3EE;color:#121316;font:600 15px Inter,sans-serif;display:flex;align-items:center;justify-content:center;gap:10px;transition:opacity .2s,transform .15s}
.cd-go[aria-disabled=true]{opacity:.4;cursor:not-allowed}.cd-go:not([aria-disabled=true]):active{transform:scale(.98)}
.cd-go:focus-visible{outline:2px solid #9AA8CF;outline-offset:3px}
.cd-note{margin:10px 0 0;font-size:12px;color:#6F737C;text-align:center}
.cd-pop{position:fixed;z-index:92;left:50%;bottom:24px;transform:translate(-50%,20px);opacity:0;background:#F5F3EE;color:#121316;padding:12px 18px;border-radius:999px;font:500 14px Inter,sans-serif;transition:opacity .3s,transform .4s cubic-bezier(.23,1,.32,1);pointer-events:none}
@media (prefers-reduced-motion:reduce){.cdw,.cd-scrim,.cd-l,.cd-bar i{transition:none!important;animation:none!important}}
`;
const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);

const root = document.createElement('div'); root.innerHTML = `<div class="cd-scrim"></div>
<aside class="cdw" role="dialog" aria-modal="true" aria-labelledby="cdT" aria-hidden="true">
  <div class="cd-h"><div><b id="cdT">Your cart</b><small id="cdN"></small></div><button class="cd-x" aria-label="Close cart"><svg width="14" height="14" viewBox="0 0 14 14"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.6"/></svg></button></div>
  <div class="cd-free" id="cdFree"></div>
  <div class="cd-body" id="cdB"></div>
  <div class="cd-f" id="cdF"></div>
</aside>`;
document.body.appendChild(root);
const dw = root.querySelector('.cdw'), scrim = root.querySelector('.cd-scrim');
let lastFocus = null, attested = false;
const open = () => { lastFocus = document.activeElement; render(); document.documentElement.classList.add('cd-open'); dw.setAttribute('aria-hidden', 'false'); setTimeout(() => dw.querySelector('.cd-x').focus(), 60); };
const close = () => { document.documentElement.classList.remove('cd-open'); dw.setAttribute('aria-hidden', 'true'); if (lastFocus) lastFocus.focus(); };
scrim.addEventListener('click', close); dw.querySelector('.cd-x').addEventListener('click', close);
addEventListener('keydown', e => { if (e.key === 'Escape' && document.documentElement.classList.contains('cd-open')) close(); });

const img = p => `<img src="v/${p.img}.webp" alt="" loading="lazy">`;
function render(){
  const n = count();
  dw.querySelector('#cdN').textContent = n ? n + (n > 1 ? ' vials' : ' vial') : '';
  let sub = 0, list = 0;
  cart.forEach(l => { const p = P[l.s]; sub += unit(p, l.q) * l.q; list += (p.pr ? p.pr[0] : 0) * l.q; });
  const free = dw.querySelector('#cdFree'), left = Math.max(0, FREE - sub);
  free.className = 'cd-free' + (left ? '' : ' ok');
  free.innerHTML = (left ? `Add <b>${money(left)}</b> for free tracked shipping.` : `<b>Free tracked shipping</b> on this order.`) + `<div class="cd-bar"><i style="width:${Math.min(100, sub / FREE * 100)}%"></i></div>`;
  free.hidden = !n;
  const B = dw.querySelector('#cdB');
  if (!n){ B.innerHTML = `<div class="cd-empty"><p>Your cart is empty.</p><p><a href="shop.html">Browse the catalogue</a></p></div>`; dw.querySelector('#cdF').innerHTML = ''; return; }
  B.innerHTML = cart.map((l, i) => { const p = P[l.s], u = unit(p, l.q), next = l.q < 5 ? 5 : l.q < 10 ? 10 : 0;
    const sv = p.pr && next ? p.pr[0] * next - unit(p, next) * next : 0;
    const up = ask === i ? (l.q > 1 && p.pr ? `<div class="cd-up cd-dn" role="group" aria-label="Remove ${p.n}"><span>Remove all ${l.q} vials, or keep <b>1 vial</b> at <b>${money(p.pr[0])}</b>?</span><span class="cd-dnb"><button data-to="1" data-i="${i}">Keep 1</button><button class="o" data-rmok="${i}">Remove</button></span></div>` : '')
      : p.pr && next ? `<div class="cd-up"><span>Make it <b>${next} vials</b> at <b>${money(unit(p, next))}</b> each and save <b>${money(sv)}</b>.</span><button data-to="${next}" data-i="${i}">Make it ${next}</button></div>` : '';
    return `<div class="cd-l" style="--c:var(--${p.c},#9AA8CF)"><div class="cd-th">${img(p)}</div>
      <div><div class="cd-n">${p.n}</div><div class="cd-m"><i></i>${p.st} · ${p.f}</div>
        <div><span class="cd-q"><button data-d="-1" data-i="${i}" aria-label="One fewer ${p.n}">−</button><span aria-live="polite">${l.q}</span><button data-d="1" data-i="${i}" aria-label="One more ${p.n}">+</button></span><button class="cd-rm" data-rm="${i}">Remove</button></div></div>
      <div class="cd-p">${p.pr ? (u < p.pr[0] ? `<s>${money(p.pr[0] * l.q)}</s>` : '') + money(u * l.q) + `<small>${money(u)} / vial</small>` : '<small>Price at launch</small>'}</div>${up}</div>`; }).join('');
  // same-family suggestions not already in the cart
  const fams = new Set(cart.map(l => P[l.s].f)), inCart = new Set(cart.map(l => l.s));
  let xs = []; for (const f of [...fams].reverse()){ xs = Object.entries(P).filter(([k, p]) => p.f === f && !inCart.has(k) && p.pr && k !== 'retatrutide').slice(0, 2); if (xs.length) break; }
  if (xs.length) B.innerHTML += `<div class="cd-x-sell"><h4>Also in ${FN[xs[0][1].f] || xs[0][1].f}</h4><div class="cd-xs">${xs.map(([k, p]) => `<div class="cd-xi">${img(p)}<div><b>${p.n}</b><span>${p.st} · ${money(p.pr[0])}</span></div><button data-add="${k}">Add</button></div>`).join('')}</div></div>`;
  const F = dw.querySelector('#cdF'), saved = list - sub;
  F.innerHTML = `<div class="cd-r"><span>Subtotal</span><b>${money(sub)}</b></div>${saved > 0 ? `<div class="cd-r sv"><span>Pack pricing</span><b>−${money(saved)}</b></div>` : ''}
    <div class="cd-r"><span>Shipping, tracked</span><b>${left ? 'At checkout' : 'Free'}</b></div>
    <div class="cd-pay"><span><svg width="18" height="18" viewBox="0 0 18 18"><rect x="1" y="4" width="16" height="10" rx="2" fill="none" stroke="#9AA8CF" stroke-width="1.3"/><path d="M4 9h5M12 7l2 2-2 2" stroke="#9AA8CF" stroke-width="1.3" fill="none"/></svg>Interac e-Transfer</span>
      <span><svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7.3" fill="none" stroke="#E8A33D" stroke-width="1.3"/><path d="M7 5.5v7M7 5.5h3a1.6 1.6 0 010 3.2H7m0 0h3.4a1.7 1.7 0 010 3.3H7M8.2 4.3v1.2m0 7v1.2" stroke="#E8A33D" stroke-width="1.2" fill="none"/></svg>Bitcoin or USDT</span></div>
    <label class="cd-att"><input type="checkbox" id="cdAtt" ${attested ? 'checked' : ''}> I confirm these products are for laboratory research use only, and that I am 19 or older.</label>
    <button class="cd-go" id="cdGo" aria-disabled="${!attested}">Continue to checkout</button>
    <p class="cd-note">Ships Monday to Thursday from BC, tracked. Every vial’s lot has a public COA.</p>`;
}
dw.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return; e.stopPropagation();
  if (t.dataset.d){ ask = -1; const l = cart[+t.dataset.i]; l.q = Math.max(0, Math.min(50, l.q + +t.dataset.d)); if (!l.q) cart.splice(+t.dataset.i, 1); save(); render(); }
  else if (t.dataset.to){ cart[+t.dataset.i].q = +t.dataset.to; ask = -1; save(); render(); }
  else if (t.dataset.rmok){ cart.splice(+t.dataset.rmok, 1); ask = -1; save(); render(); }
  else if (t.dataset.rm){ const i = +t.dataset.rm, l = cart[i]; if (l.q > 1 && P[l.s].pr && ask !== i){ ask = i; render(); } else { cart.splice(i, 1); ask = -1; save(); render(); } }
  else if (t.dataset.add){ add(t.dataset.add, 1, false); }
  else if (t.id === 'cdGo'){ if (!attested){ pop('Tick the research-use confirmation first.'); return; } pop('Preview: checkout connects at launch.'); }
});
dw.addEventListener('change', e => { if (e.target.id === 'cdAtt'){ attested = e.target.checked; dw.querySelector('#cdGo').setAttribute('aria-disabled', !attested); } });
const pp = document.createElement('div'); pp.className = 'cd-pop'; pp.setAttribute('role', 'status'); document.body.appendChild(pp);
function pop(t){ pp.textContent = t; pp.style.opacity = 1; pp.style.transform = 'translate(-50%,0)'; clearTimeout(pp._t); pp._t = setTimeout(() => { pp.style.opacity = 0; pp.style.transform = 'translate(-50%,20px)'; }, 2400); }
function add(slug, q = 1, show = true){ if (!P[slug]) return; const l = cart.find(x => x.s === slug); if (l) l.q += q; else cart.push({s: slug, q}); save(); render(); if (show && !document.documentElement.classList.contains('cd-open')) open(); }
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
