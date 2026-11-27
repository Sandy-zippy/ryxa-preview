/* RYXA vial stage: the real-time vials (vials.js kit) on a dark plinth, for the lab proof band and the family catalogue.
   - shelf: every vial of a family in a shallow arc; one is in focus (forward, lit in the family colour), the rest wait.
   - single: one large vial for the lab proof; turns to show its lot panel on cue.
   threejs-scene rules: ACES, studio PMREM, pixel ratio capped, render only while something moves, paused off-screen,
   reduced motion = no idle motion, transitions jump. */
import * as THREE from './three.module.min.js';
import {studioEnv, vialKit} from './vials.js';

export async function mountStage(host, o = {}){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = matchMedia('(max-width:900px)').matches;
  await Promise.all(['600 40px Archivo','700 40px Archivo','300 40px Archivo','400 40px "IBM Plex Mono"','500 40px "IBM Plex Mono"'].map(f => document.fonts.load(f).catch(()=>{})));
  const canvas = document.createElement('canvas'); canvas.className = 'stcanvas'; canvas.setAttribute('aria-hidden', 'true');
  const r = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance'});
  r.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.75 : 2)); r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
  r.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(studioEnv(), 0.02).texture;
  const cam = new THREE.PerspectiveCamera(22, 1, 0.1, 200);
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-4, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(new THREE.Color(o.rim || '#6f86d6'), 2.6); rim.position.set(4, 2.5, -6); scene.add(rim);
  const rimL = new THREE.DirectionalLight(0x6f86d6, 1.1); rimL.position.set(-5, 1, -4); scene.add(rimL);
  const ROW = o.mode === 'row', RACK = o.mode === 'rack', MULTI = o.mode !== 'single';
  const kit = vialKit(r, {lite: MULTI, labelScale: MULTI ? (phone ? .5 : .62) : 1});
  const VH = kit.H; // vial height in scene units
  /* rack mode: one lot held in a tray (o.cols wide, front row first). draw(i) lifts a vial out and turns it to its lot panel,
     take(i) lets it leave, reset() refills the tray, fill(k) starts with the first k already gone, point(i) gives the
     canvas position above a drawn vial for a DOM callout. o.rackLabel prints the lot on the front of the tray. */
  const RK = RACK ? {cols: o.cols || 4, sx: VH * .54, sz: VH * .56, y0: VH * .18, lip: VH * .09, m: VH * .13, rv: VH * .214,
    pitch: THREE.MathUtils.degToRad(o.pitch || 18), lift: VH * .32, ty: VH * .8, tray: null, w: 10, d: 6} : null;
  const rackXZ = (i, n) => { const cols = Math.min(RK.cols, n), rows = Math.ceil(n / cols), rw = Math.floor(i / cols), c = i % cols;
    return [(c - (cols - 1) / 2) * RK.sx, ((rows - 1) / 2 - rw) * RK.sz]; };
  const buildTray = (n) => {
    if (RK.tray){ scene.remove(RK.tray); RK.tray.traverse(m => { if (m.geometry) m.geometry.dispose(); }); }
    const cols = Math.min(RK.cols, n), rows = Math.ceil(n / cols), w = (cols - 1) * RK.sx + 2 * (RK.rv + RK.m), d = (rows - 1) * RK.sz + 2 * (RK.rv + RK.m);
    const rr = () => { const sh = new THREE.Shape(), x = -w / 2, y = -d / 2, q = VH * .09; sh.moveTo(x + q, y); sh.lineTo(x + w - q, y); sh.quadraticCurveTo(x + w, y, x + w, y + q);
      sh.lineTo(x + w, y + d - q); sh.quadraticCurveTo(x + w, y + d, x + w - q, y + d); sh.lineTo(x + q, y + d); sh.quadraticCurveTo(x, y + d, x, y + d - q); sh.lineTo(x, y + q); sh.quadraticCurveTo(x, y, x + q, y); return sh; };
    const g = new THREE.Group(), mat = new THREE.MeshPhysicalMaterial({color: 0x1f222a, roughness: .44, clearcoat: .55, clearcoatRoughness: .28});
    const base = new THREE.Mesh(new THREE.ExtrudeGeometry(rr(), {depth: RK.y0, bevelEnabled: false, curveSegments: 10}), mat); base.rotation.x = -Math.PI / 2; g.add(base);
    const top = rr(), hr = RK.rv * 1.1, bv = VH * .012;
    for (let i = 0; i < n; i++){ const [x, z] = rackXZ(i, n), h = new THREE.Path(); h.absarc(x, -z, hr, 0, Math.PI * 2, true); top.holes.push(h); }
    const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(top, {depth: RK.lip - bv * 2, bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelSegments: 2, curveSegments: 28}), mat);
    plate.rotation.x = -Math.PI / 2; plate.position.y = RK.y0 + bv; g.add(plate);
    const wellM = new THREE.MeshBasicMaterial({color: 0x08090c});
    for (let i = 0; i < n; i++){ const [x, z] = rackXZ(i, n), c = new THREE.Mesh(new THREE.CircleGeometry(hr, 40), wellM); c.rotation.x = -Math.PI / 2; c.position.set(x, RK.y0 + .004, z); g.add(c); }
    if (o.rackLabel){
      const lc = document.createElement('canvas'); lc.width = 1024; lc.height = 128; const x = lc.getContext('2d'); x.textBaseline = 'middle';
      x.fillStyle = '#9A9EA6'; x.font = '500 44px "IBM Plex Mono"'; try { x.letterSpacing = '6px'; } catch(e){} x.fillText('LOT', 4, 68); const lw = x.measureText('LOT').width; try { x.letterSpacing = '0px'; } catch(e){}
      x.fillStyle = '#F5F3EE'; x.font = '500 78px "IBM Plex Mono"'; x.fillText(o.rackLabel, lw + 40, 66);
      const lt = new THREE.CanvasTexture(lc); lt.colorSpace = THREE.SRGBColorSpace; lt.anisotropy = Math.min(8, r.capabilities.getMaxAnisotropy());
      const lh = RK.y0 * .8, lwd = lh * 8, lab = new THREE.Mesh(new THREE.PlaneGeometry(lwd, lh), new THREE.MeshBasicMaterial({map: lt, transparent: true, depthWrite: false}));
      lab.position.set(-w / 2 + VH * .14 + lwd / 2, RK.y0 * .5, d / 2 + .012); g.add(lab);
    }
    scene.add(g); RK.tray = g; RK.w = w; RK.d = d;
    glow.scale.set(w / 10 * 1.3, d / 10 * 1.5, 1); glowM.opacity = .5;
  };

  // textures for the contact shadow and the coloured floor glow
  const radial = (stops) => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    const g = x.createRadialGradient(128,128,0,128,128,128); stops.forEach(([p, col]) => g.addColorStop(p, col)); x.fillStyle = g; x.fillRect(0,0,256,256);
    const t = new THREE.CanvasTexture(c); return t; };
  const shT = radial([[0,'rgba(0,0,0,.6)'],[.5,'rgba(0,0,0,.2)'],[1,'rgba(0,0,0,0)']]);
  const glT = radial([[0,'rgba(255,255,255,1)'],[.35,'rgba(255,255,255,.35)'],[1,'rgba(255,255,255,0)']]);
  const glowM = new THREE.MeshBasicMaterial({map: glT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(o.rim || '#233766'), opacity: .55});
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), glowM); glow.rotation.x = -Math.PI / 2; glow.position.y = .01; if (MULTI) scene.add(glow);
  if (o.mode === 'shelf') scene.fog = new THREE.Fog(0x121316, 20, 40);

  host.appendChild(canvas);
  let items = [], focus = 0, dirty = true, raf = 0, vis = true, last = performance.now(), t = 0;
  let px_ = 0, py_ = 0, tx = 0, ty = 0, camX = 0, camXT = 0, camZ = 20, camZT = 20, idle = !reduce && !RACK;
  const rimC = new THREE.Color(o.rim || '#6f86d6'), rimT = rimC.clone();
  const ease = k => 1 - Math.pow(1 - k, 4);

  // shelf = a carousel ring: the focus vial stands at the front, the rest of the family wait around the ring, fading into the dark
  let R = 5, ring = 0, ringT = 0, pan = false;
  const layout = () => {
    const n = items.length;
    R = o.mode === 'shelf' ? (n <= 1 ? 0 : Math.max(4.6, n * 5.6 / (2 * Math.PI))) : 0;
    const w = host.clientWidth || 1, h = host.clientHeight || 1, asp = w / h;
    const tv = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2), th = tv * asp;
    if (o.mode === 'shelf'){
      // front vial about 64% of the frame height, and the ring's width inside the frame on desktop
      const D = phone ? VH / (0.47 * 2 * tv) : Math.max(VH / (0.56 * 2 * tv), (R + 1.4) / th - R * .35);
      camZT = R + D;
      if (scene.fog){ scene.fog.near = D + .5; scene.fog.far = D + 2 * R + 6; }
    } else if (RACK){
      // fit the tray, the headroom for a drawn vial and its callout, and the floor in front; camZ is the distance along the view axis
      const m = Math.max(1, n), cols = Math.min(RK.cols, m), rows = Math.ceil(m / cols);
      const hw = (cols - 1) * RK.sx / 2 + RK.rv + RK.m, zf = (rows - 1) * RK.sz / 2 + RK.rv + RK.m, zb = -(rows - 1) * RK.sz / 2;
      const c = Math.cos(RK.pitch), s = Math.sin(RK.pitch), yT = RK.y0 + VH + RK.lift + VH * .22, yB = 0, zg = zf * 1.5;
      RK.ty = ((yT + yB) * c - (zb + zg) * s) / (2 * c);
      const need = (x, y, z) => { const a = (y - RK.ty) * c - z * s, b = -(y - RK.ty) * s - z * c; return Math.max(Math.abs(a) / tv, Math.abs(x) / th) - b; };
      camZT = Math.max(need(0, yT, zb), need(0, yB, zg), need(hw + VH * .15, RK.y0, zf)); camXT = 0; camZ = camZT;
      glow.scale.x = Math.min(RK.w * 1.3, 2 * camZT * th * .96) / 10;
    } else if (ROW){
      // a straight line-up: fit the whole family in the frame; if it can't fit, keep vials a readable size and pan to the focus
      const sp = VH * .5, half = (n - 1) * sp / 2 + VH * .3;
      const Dh = VH / ((n <= 1 ? .62 : .52) * 2 * tv), Dw = half / (th * .97), Dmax = VH / ((phone ? .5 : .36) * 2 * tv);
      const D = Math.min(Math.max(Dh, Dw), Dmax); camZT = D; pan = Dw > Dmax;
      camXT = pan ? (focus - (n - 1) / 2) * sp : 0;
    } else camZT = (VH * 0.6) / tv;
    if (reduce || !camZ || camZ === 20) camZ = camZT;
  };
  const place = () => { const n = items.length, step = n ? Math.PI * 2 / n : 0;
    if (ROW){ const sp = VH * .5; items.forEach((it, i) => { it.a = 0; it.home.set((i - (n - 1) / 2) * sp, 0, i === focus && n > 1 ? VH * .16 : 0); }); return; }
    if (RACK){ items.forEach((it, i) => { const [x, z] = rackXZ(i, n); it.a = 0; it.home.set(x, RK.y0, z); }); return; }
    items.forEach((it, i) => { const a = i * step + ring; it.a = a; it.home.set(Math.sin(a) * R, 0, Math.cos(a) * R); }); };

  const add = (list) => {
    items.forEach(it => { it.out = true; it.outT = 0; });
    const born = list.map((v, i) => {
      const g = kit.make(v); g.rotation.y = v.rotY || 0; scene.add(g);
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.6), new THREE.MeshBasicMaterial({map: shT, transparent: true, depthWrite: false}));
      sh.rotation.x = -Math.PI / 2; sh.position.y = .005; scene.add(sh);
      const it = {g, sh, v, home: new THREE.Vector3(), a: 0, inT: reduce || (RACK && o.instant) ? 1 : -i * .07, out: false, turn: 0, turnT: 0, hov: 0};
      if (RACK){ it.mats = []; g.traverse(m => { if (m.isMesh){ m.material = m.material.clone(); m.material.transparent = true; if (m.geometry.type === 'LatheGeometry' && m.material.depthWrite) m.material.side = THREE.DoubleSide; it.mats.push(m.material); } });
        sh.visible = false; it.pl = it.plT = it.go = it.goT = it.dl = 0; it.al = -1; if (it.inT < 1) g.visible = false; }
      return it;
    });
    if (RACK && list.length) buildTray(list.length);
    const old = items; items = born; layout(); ringT = -focus * (born.length ? Math.PI * 2 / born.length : 0); ring = ringT; place();
    items.forEach(it => { it.g.position.copy(it.home); });
    setTimeout(() => old.forEach(it => { scene.remove(it.g, it.sh); it.g.userData.dispose(); it.sh.material.dispose(); }), reduce ? 0 : 700);
    gone = old; focus = Math.min(focus, items.length - 1); kick();
  };
  let gone = [];

  const size = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); layout(); kick(); };

  const frame = (now) => {
    raf = 0; const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; let moving = idle;
    const k = reduce ? 1 : Math.min(1, dt * 6.5);
    px_ += (tx - px_) * .06; py_ += (ty - py_) * .06; if (Math.abs(tx - px_) + Math.abs(ty - py_) > 1e-4) moving = true;
    camZ += (camZT - camZ) * k; camX += (camXT - camX) * k * .8; if (Math.abs(camZT - camZ) + Math.abs(camXT - camX) > 1e-3) moving = true;
    rimC.lerp(rimT, k); rim.color.copy(rimC); glowM.color.copy(rimC);
    gone.forEach(it => { it.outT = Math.min(1, it.outT + dt * 2.6); const e = it.outT * it.outT; it.g.position.y = -e * VH * 1.1; it.sh.material.opacity = 1 - it.outT; if (it.outT < 1) moving = true; });
    if (o.mode === 'shelf'){ const d = ringT - ring; ring += d * Math.min(1, reduce ? 1 : dt * 3.4); if (Math.abs(d) > 1e-4) moving = true; place(); }
    items.forEach((it, i) => {
      if (it.inT < 1){ it.inT = Math.min(1, it.inT + dt * 1.6); moving = true; }
      const e = ease(Math.max(0, it.inT));
      it.hov += ((it.hovT || 0) - it.hov) * k; if (Math.abs((it.hovT || 0) - it.hov) > 1e-3) moving = true;
      if (RACK){
        if (it.dl > 0){ it.dl -= dt; moving = true; }
        else { it.pl += (it.plT - it.pl) * Math.min(1, reduce ? 1 : dt * 5.5); it.go += (it.goT - it.go) * Math.min(1, reduce ? 1 : dt * 4.6); }
        if (Math.abs(it.plT - it.pl) + Math.abs(it.goT - it.go) > 1e-3) moving = true;
        const al = e * (1 - it.go);
        it.g.position.set(it.home.x, it.home.y + (1 - e) * VH * .3 + it.pl * RK.lift + it.go * VH * .32, it.home.z);
        it.g.rotation.y = (it.v.rotY || 0) + it.pl * 2.6;
        if (al !== it.al){ it.al = al; it.g.visible = al > .01; it.mats.forEach(m => { m.opacity = al; }); }
        return;
      }
      const lift = it.hov * .3 + (it.pl || 0) * VH * .42;
      if (ROW){ it.z = (it.z ?? it.home.z) + (it.home.z - (it.z ?? it.home.z)) * k; if (Math.abs(it.home.z - it.z) > 1e-3) moving = true; }
      it.g.position.set(it.home.x, -(1 - e) * VH * 1.1 + lift, ROW ? it.z : it.home.z);
      if (ROW){
        // the focus vial turns slowly so the glass catches the light; the rest face the buyer
        const want = i === focus ? (idle ? Math.sin(t * .6) * .45 : 0) : 0; it.ry = (it.ry || 0) + (want - (it.ry || 0)) * Math.min(1, dt * 3);
        it.g.rotation.y = (it.v.rotY || 0) + it.ry; if (i !== focus && Math.abs(it.ry) > 1e-3) moving = true;
      } else if (o.mode === 'shelf'){
        // labels face out from the ring; the front vial sways a little so the glass catches the light
        it.g.rotation.y = (it.a || 0) + (i === focus && idle ? Math.sin(t * .7) * .28 : 0);
      } else {
        if (it.hold){ const d = it.turnT - it.turn; it.turn += d * Math.min(1, dt * 3.2); if (Math.abs(d) > 1e-3) moving = true; }
        else if (idle) it.turn += dt * .3;
        it.g.rotation.y = (it.v.rotY || 0) + it.turn;
      }
      it.sh.position.set(it.g.position.x, .005, it.g.position.z); it.sh.scale.setScalar(1 - (1 - e) * .6);
      it.sh.material.opacity = e;
    });
    if (ROW){ const f = items[focus]; if (f){ glow.position.x += (f.home.x - glow.position.x) * k; glow.position.z = f.home.z; } glow.scale.setScalar(.7); } else glow.position.set(0, .01, R);
    const y = VH * .5;
    if (o.mode === 'shelf'){ cam.position.set(px_ * 2.2, y + 4.6 - py_ * 1.2, camZ); cam.lookAt(0, y * .62 + R * .12, R * .25); }
    else if (RACK){ cam.position.set(px_ * 1.6, RK.ty + camZ * Math.sin(RK.pitch) - py_ * .9, camZ * Math.cos(RK.pitch)); cam.lookAt(0, RK.ty, 0); }
    else if (ROW){ cam.position.set(camX + px_ * 1.4, y + 1.1 - py_ * .8, camZ); cam.lookAt(camX, y * 1.04, 0); }
    else { cam.position.set(px_ * 1.2, y + .9 - py_ * .6, camZ); cam.lookAt(0, y, 0); }
    r.render(scene, cam);
    if (moving && vis) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && vis){ last = performance.now(); raf = requestAnimationFrame(frame); } };
  new ResizeObserver(size).observe(host);
  new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis) kick(); }, {rootMargin: '120px'}).observe(host);

  // pointer: gentle parallax, and hover/click picking on the shelf
  const ray = new THREE.Raycaster(), m2 = new THREE.Vector2();
  const hit = (e) => { const b = canvas.getBoundingClientRect(); m2.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); ray.setFromCamera(m2, cam);
    let best = -1, bd = 1e9; items.forEach((it, i) => { const hs = ray.intersectObject(it.g, true); if (hs.length && hs[0].distance < bd){ bd = hs[0].distance; best = i; } }); return best; };
  if (matchMedia('(hover:hover) and (pointer:fine)').matches){
    const zone = o.pointerZone || host;
    zone.addEventListener('pointermove', e => { const b = zone.getBoundingClientRect(); if (!reduce){ tx = (e.clientX - b.left) / b.width - .5; ty = (e.clientY - b.top) / b.height - .5; }
      if (MULTI && !RACK){ const i = hit(e); items.forEach((it, j) => it.hovT = j === i ? 1 : 0); canvas.style.cursor = i >= 0 ? 'pointer' : ''; if (i >= 0 && o.onHover) o.onHover(i); }
      kick(); });
    zone.addEventListener('pointerleave', () => { tx = ty = 0; items.forEach(it => it.hovT = 0); kick(); });
  }
  canvas.addEventListener('click', e => { const i = hit(e); if (i >= 0 && o.onPick) o.onPick(i); });

  const api = {
    set(list, f = 0){ focus = f; add(list); },
    focus(i){ const n = items.length; if (!n) return; focus = Math.max(0, Math.min(n - 1, i));
      if (ROW){ place(); layout(); kick(); return; }
      const step = Math.PI * 2 / n;
      let tgt = -focus * step; while (tgt - ringT > Math.PI) tgt -= Math.PI * 2; while (tgt - ringT < -Math.PI) tgt += Math.PI * 2; ringT = tgt; kick(); },
    rim(col){ rimT.set(col); kick(); },
    // lab proof cues: turn the vial to show its lot panel (BACK) or let it idle again
    showLot(state){ const it = items[0]; if (!it) return; it.hold = !!state; it.turn = it.turn % (Math.PI * 2); it.turnT = state ? 2.6 : null;
      it.g.userData.relabel(state ? {lot: state} : {}); kick(); },
    idle(on){ idle = on && !reduce; kick(); },
    resize(){ size(); },
    pull(i, on){ if (on) api.draw(i); },
    draw(i){ const it = items[i]; if (!it || !RACK) return; it.plT = 1; if (!it.lit){ it.lit = true; it.g.userData.relabel({lot: 'ok'}); } kick(); },
    take(i){ const it = items[i]; if (!it || !RACK) return; it.goT = 1; kick(); },
    fill(k){ if (!RACK) return; items.forEach((it, j) => { it.pl = it.plT = 0; it.go = it.goT = j < k ? 1 : 0; it.dl = 0; }); kick(); },
    reset(){ if (!RACK) return; let q = 0; items.forEach(it => { it.pl = it.plT = 0; if (it.lit){ it.lit = false; it.g.userData.relabel({}); } if (it.goT || it.go > .01){ it.go = 1; it.goT = 0; it.dl = reduce ? 0 : q++ * .08; } }); kick(); },
    point(i){ const it = items[i]; if (!it || !RACK) return null; cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
      const v = new THREE.Vector3(it.home.x, it.home.y + VH + RK.lift + VH * .04, it.home.z).project(cam); return {x: (v.x + 1) / 2 * host.clientWidth, y: (1 - v.y) / 2 * host.clientHeight}; },
    canvas,
  };
  size();
  if (o.vials) api.set(o.vials, o.focus || 0);
  return api;
}
