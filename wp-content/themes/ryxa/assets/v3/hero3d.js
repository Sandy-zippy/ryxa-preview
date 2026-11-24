/* RYXA Labs v3: real-time 3D vials (three.js, self-hosted, no paid renders).
   Procedural 3 mL crimp vial: glass body, lyophilized cake, aluminium crimp, flip-off cap,
   label drawn on a canvas in the brand style. Mount: <div data-ryxa-3d='[{"n":"BPC-157","s":"10 mg","c":"RX-01","k":"#E8A33D"},...]'>.
   Falls back to the static product photos already inside the mount if WebGL or motion is off. */
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const mounts = document.querySelectorAll('[data-ryxa-3d]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function hasGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

function labelTexture(v, renderer) {
  const W = 2048, H = 640, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = '#121418'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#233766'; g.fillRect(0, 0, W, 26); g.fillRect(0, H - 26, W, 26);
  // front panel is centred at u=0.25 (faces the camera at rotation 0)
  const cx = W * 0.75;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#F5F3EE';
  g.font = '600 46px Archivo, "Arial Black", sans-serif';
  if ('letterSpacing' in g) g.letterSpacing = '12px';
  g.fillText('RYXA LABS', cx, 160);
  if ('letterSpacing' in g) g.letterSpacing = '0px';
  let fs = 118; g.font = `700 ${fs}px Archivo, "Arial Black", sans-serif`;
  while (g.measureText(v.n).width > 470 && fs > 56) { fs -= 6; g.font = `700 ${fs}px Archivo, "Arial Black", sans-serif`; }
  g.fillText(v.n, cx, 285);
  g.fillStyle = '#AFC0EE'; g.font = '400 40px "IBM Plex Mono", monospace';
  g.fillText(`${v.s} · lyophilized`, cx, 385);
  g.font = '500 40px "IBM Plex Mono", monospace';
  const tw = g.measureText(v.c).width + 56;
  g.fillStyle = v.k || '#E8A33D';
  g.beginPath(); g.roundRect ? g.roundRect(cx - tw / 2, 440, tw, 64, 9) : g.rect(cx - tw / 2, 440, tw, 64); g.fill();
  g.fillStyle = '#121418'; g.fillText(v.c, cx, 474);
  // back panel: small print, research use only
  const bx = W * 0.25;
  g.fillStyle = '#8B93A3'; g.font = '400 30px "IBM Plex Mono", monospace';
  ['FOR LABORATORY RESEARCH', 'USE ONLY. NOT FOR HUMAN', 'OR VETERINARY USE.', '', 'LOT  R26XX-XX', 'STORE SEALED, DRY, DARK'].forEach((t, i) => g.fillText(t, bx, 190 + i * 48));
  // barcode stripes at the seam
  for (let i = 0; i < 40; i++) { g.fillStyle = i % 3 ? '#F5F3EE' : '#121418'; g.fillRect(W * 0.43 + i * 7, 230, (i % 4) + 2, 180); }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

function makeVial(v, renderer, light) {
  const grp = new THREE.Group();
  // glass profile (radius, height) in cm-ish units: 3 mL vial, 1.6 wide, 3.8 tall
  const prof = [[0, 0], [0.74, 0], [0.8, 0.06], [0.8, 2.55], [0.74, 2.75], [0.5, 2.95], [0.48, 3.12], [0.56, 3.16], [0.56, 3.3], [0.0, 3.3]].map(p => new THREE.Vector2(p[0], p[1]));
  const glass = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), new THREE.MeshPhysicalMaterial({
    color: 0xdfe8ff, metalness: 0, roughness: 0.03, ior: 1.5, reflectivity: 0.6,
    clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: light ? 0.08 : 0.14, depthWrite: false, envMapIntensity: light ? 1.1 : 2.2, side: THREE.DoubleSide,
  }));
  grp.add(glass);
  // lyophilized cake
  const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.72, 0.42, 64), new THREE.MeshStandardMaterial({ color: 0xf1efe9, roughness: 0.95 }));
  cake.position.y = 0.27; grp.add(cake);
  // label sleeve
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.812, 0.812, 1.62, 128, 1, true), new THREE.MeshPhysicalMaterial({
    map: labelTexture(v, renderer), roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.25,
  }));
  lab.position.y = 1.38; lab.rotation.y = Math.PI / 2; grp.add(lab);
  // aluminium crimp + flip-off cap
  const crimp = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.36, 64), new THREE.MeshStandardMaterial({ color: 0xc9ccd2, metalness: 1, roughness: 0.28 }));
  crimp.position.y = 3.2; grp.add(crimp);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.3, 64), new THREE.MeshPhysicalMaterial({ color: v.cap ? new THREE.Color(v.cap) : 0xf4f4f2, roughness: 0.35, clearcoat: 0.5 }));
  cap.position.y = 3.52; grp.add(cap);
  grp.position.y = -1.75;
  return grp;
}

function boot(el) {
  let data; try { data = JSON.parse(el.getAttribute('data-ryxa-3d')); } catch (e) { return; }
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const zoom = parseFloat(el.dataset.zoom || '1');
  const tilt = parseFloat(el.dataset.tilt || '0');
  const noDrag = el.hasAttribute('data-nodrag');
  const sway = parseFloat(el.dataset.sway || '0.42'), scrollK = parseFloat(el.dataset.scroll || '0.9');
  cam.position.set(0, 0.35, (data.length === 1 ? 8.4 : 11.6) / zoom);
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6f8fff, 2.4); rim.position.set(-5, 3, -4); scene.add(rim);
  scene.add(new THREE.AmbientLight(0x8090b0, 0.35));
  // glossy floor reflection disc + soft shadow
  const sc = document.createElement('canvas'); sc.width = sc.height = 256;
  const sg = sc.getContext('2d'), rg = sg.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, 'rgba(20,30,60,.30)'); rg.addColorStop(0.5, 'rgba(20,30,60,.12)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
  sg.fillStyle = rg; sg.fillRect(0, 0, 256, 256);
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = -1.77; sh.visible = false; scene.add(sh);

  const xs = data.length === 1 ? [0] : data.length === 2 ? [-1.05, 1.05] : [-2.15, 0, 2.15];
  const vials = data.slice(0, 3).map((v, i) => {
    const m = makeVial(v, renderer, el.hasAttribute('data-light'));
    const s = (data.length === 3 && i !== 1) ? 0.86 : 1;
    m.scale.setScalar(s); m.position.x = xs[i]; m.position.z = (data.length === 3 && i !== 1) ? -0.9 : 0;
    m.userData.base = { ry: data.length === 3 ? (i - 1) * 0.28 : 0, y: m.position.y, ph: i * 1.7 };
    m.rotation.y = m.userData.base.ry; scene.add(m);
    const hl = new THREE.Group(); hl.position.copy(m.position); hl.scale.copy(m.scale);
    const mk = (th, len, op, y0, h) => { const g2 = new THREE.CylinderGeometry(0.83, 0.83, h, 12, 1, true, th, len); const me = new THREE.Mesh(g2, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); me.position.y = y0; return me; };
    hl.add(mk(-0.62, 0.1, 0.22, 1.35, 2.5)); hl.add(mk(0.55, 0.05, 0.12, 1.35, 2.5));
    hl.position.y += -1.75 * m.scale.y + 1.75 * m.scale.y; hl.position.y = m.position.y;
    m.userData.hl = hl; scene.add(hl); return m;
  });

  el.appendChild(renderer.domElement);
  el.classList.add('is-3d');
  const size = () => { const r = el.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / Math.max(1, r.height); cam.fov = cam.aspect < 0.9 ? 42 : (data.length === 1 ? 26 : 31); cam.updateProjectionMatrix(); };
  size(); new ResizeObserver(size).observe(el);

  let mx = 0, my = 0, tx = 0, ty = 0, drag = null, spin = 0, visible = true;
  const host = el.closest('a,section,.x-gal__main') || el;
  host.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); tx = Math.max(-.6, Math.min(.6, (e.clientX - r.left) / r.width - 0.5)); ty = Math.max(-.6, Math.min(.6, (e.clientY - r.top) / r.height - 0.5)); if (drag !== null) { spin += (e.clientX - drag) * 0.012; drag = e.clientX; } });
  host.addEventListener('pointerleave', () => { tx = ty = 0; });
  if (!noDrag) el.addEventListener('pointerdown', e => { drag = e.clientX; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointerup', () => { drag = null; });
  el.addEventListener('pointerleave', () => { tx = ty = 0; });
  new IntersectionObserver(en => { visible = en[0].isIntersecting; }).observe(el);

  const clock = new THREE.Clock();
  const frame = () => {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
    const rb = el.getBoundingClientRect();
    const sc = Math.max(-1, Math.min(1, (rb.top + rb.height / 2) / innerHeight - 0.5));
    vials.forEach((m, i) => {
      const b = m.userData.base;
      m.rotation.y = b.ry + (reduce ? 0 : Math.sin(t * 0.45 + b.ph) * sway) + spin * (i === 1 ? 1 : 0.6) + mx * 0.6 + sc * scrollK * (i % 2 ? -1 : 1);
      m.position.y = b.y + (reduce ? 0 : Math.sin(t * 1.1 + b.ph) * 0.06);
      m.rotation.z = tilt + (data.length === 3 ? (1 - i) * 0.16 : 0) + (reduce ? 0 : Math.sin(t * 0.8 + b.ph) * 0.015);
      if (m.userData.hl) m.userData.hl.position.y = m.position.y;
    });
    cam.position.x = mx * 0.8; cam.position.y = 0.35 - my * 0.5; cam.lookAt(0, 0, 0);
    renderer.render(scene, cam);
  };
  // wait for brand fonts so the label canvas uses Archivo/Plex
  frame();
}

// boot each stage when it nears the viewport, so the page stays light
if (mounts.length && hasGL()) {
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    const io = new IntersectionObserver(en => en.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); boot(e.target); } }), { rootMargin: '400px 0px' });
    mounts.forEach(m => io.observe(m));
  });
}

// used by the product page "3D" button
window.ryxaMount3D = (el) => { if (hasGL()) { boot(el); return true; } return false; };
window.dispatchEvent(new Event('ryxa3d-ready'));
