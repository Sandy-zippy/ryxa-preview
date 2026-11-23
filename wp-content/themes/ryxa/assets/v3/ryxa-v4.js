/* RYXA Labs v4 scroll motion (GSAP + ScrollTrigger, self-hosted).
   Headline word rise, tile scale-in, colour rooms that grow into view, vial parallax,
   card cascades, pack slides and the signup gradient drift. Off under reduced motion. */
(function () {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  // elements this file animates are taken out of the generic v3 fade so the two never fight
  var own = '.v4-bt,.v4-pill,.v4-room__hd,.v4-mini,.v4-grid .x-card,.v4-pack,.v4-step,.v4-h1,.v4-tag,.v4-lede,.v4-trust,.v4-phead [data-rv]';
  $$(own).forEach(function (el) { el.removeAttribute('data-rv'); });
  $$('.v4-grid [data-rv],.v4-pack [data-rv],.v4-room__hd [data-rv]').forEach(function (el) { el.removeAttribute('data-rv'); });

  function split(h) {
    if (h.dataset.split4) return; h.dataset.split4 = '1';
    var walk = function (node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('ryxa-w'); w.className = 'w'; var i = document.createElement('ryxa-i'); i.textContent = part; w.appendChild(i); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(h);
  }
  document.documentElement.classList.add('v4-motion');
  // 22 Nov: no word-split reveals; text is always visible

  function go() {
    var G = window.gsap, ST = window.ScrollTrigger; if (!G || !ST) return;
    G.registerPlugin(ST);
    var phone = innerWidth < 700;

    /* hero: words rise, tiles grow in, pills cascade */
    var hero = document.querySelector('.v4-hero, .v4-phead');
    if (hero) {
      // 22 Nov: no entrance animation above the fold; the hero renders at rest on load and refresh
      // hero vials drift as the page scrolls away
      $$('.v4-bt__a,.v4-bt__b,.v4-bt__v1', hero).forEach(function (el, i) {
        G.to(el, { yPercent: -10 - i * 6, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .8 } });
      });
      $$('.v4-phead__float img', hero).forEach(function (el, i) {
        G.to(el, { yPercent: -18 - i * 10, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .8 } });
      });
    }

    /* colour rooms: the card grows into the page, heading rises, vials parallax, cards cascade */
    $$('.v4-room').forEach(function (room) {
      if (!room.closest('.v4-hero')) {
        G.fromTo(room, { scale: phone ? .96 : .92, borderRadius: 80 }, { scale: 1, borderRadius: 32, ease: 'none', scrollTrigger: { trigger: room, start: 'top bottom', end: 'top 35%', scrub: .6 } });
      }
      var fl = room.querySelector('.v4-room__float');
      if (fl) {
        G.fromTo(fl, { yPercent: 16 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: room, start: 'top bottom', end: 'bottom top', scrub: 1 } });
        $$('img', fl).forEach(function (img, i) {
          G.fromTo(img, { y: i === 1 ? 40 : 90 }, { y: i === 1 ? -10 : -40, ease: 'none', scrollTrigger: { trigger: room, start: 'top bottom', end: 'bottom top', scrub: 1 } });
        });
      }
    });

    /* packs slide in from both sides, steps rise in sequence */
    $$('.v4-pack').forEach(function (p, i) {
      $$('img', p).forEach(function (img, j) { G.fromTo(img, { yPercent: 12 + j * 6 }, { yPercent: -8 - j * 6, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: 1 } }); });
    });
    /* navy signup: slow gradient drift while it's on screen */
    $$('.v4-signup, .v4-ws, .v4-room--navy').forEach(function (b) {
      G.fromTo(b, { backgroundPosition: '0% 40%' }, { backgroundPosition: '100% 60%', ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    });

    /* family pills and mini cards follow the pointer a little (desktop only) */
    if (matchMedia('(hover:hover)').matches) {
      $$('.v4-pill, .v4-mini, .v4-bt').forEach(function (el) {
        var img = el.querySelector('img'); if (!img) return;
        el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); G.to(img, { x: ((e.clientX - r.left) / r.width - .5) * 14, y: ((e.clientY - r.top) / r.height - .5) * 10, rotation: ((e.clientX - r.left) / r.width - .5) * 6, duration: .5, ease: 'power2.out', overwrite: 'auto' }); });
        el.addEventListener('pointerleave', function () { G.to(img, { x: 0, y: 0, rotation: 0, duration: .7, ease: 'expo.out', overwrite: 'auto' }); });
      });
    }
    ST.refresh();
  }
  if (document.readyState === 'complete') go(); else addEventListener('load', go);
})();
