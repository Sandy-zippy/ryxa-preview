/* RYXA packaging in 3D: the real BPC-157 carton artwork (printer dielines, v2.3) cut panel by panel onto true-size boxes.
   5-vial carton 128 x 52 x 30 mm, single carton 26 x 52 x 26 mm. Render only on change; pointer turns the pair. */
import * as THREE from './three.module.min.js';
import {studioEnv} from './vials.js';

// 1 unit = 10 mm
const ld = new THREE.TextureLoader();
function tex(r, src){ const t = ld.load(src, () => r()); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

export function mountBoxes(host, base, setView){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas'); canvas.className = 'bcanvas'; canvas.setAttribute('aria-hidden','true'); host.appendChild(canvas);
  const r = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true});
  r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace; r.setClearColor(0, 0);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(studioEnv(), 0.04).texture; scene.environmentIntensity = 0.8;
  const key = new THREE.DirectionalLight(0xffffff, 2.8); key.position.set(-3, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8ea2dc, 1.6); rim.position.set(4, 2, -5); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const cam = new THREE.PerspectiveCamera(22, 1, 0.1, 100);
  let dirty = true; const req = () => { dirty = true; };

  const mat = f => new THREE.MeshPhysicalMaterial({map: tex(req, base + f), roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.35});
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z
  const five = new THREE.Mesh(new THREE.BoxGeometry(12.8, 5.2, 3.0),
    ['k5-side.jpg','k5-end.jpg','k5-top.jpg','k5-bot.jpg','k5-front.jpg','k5-back.jpg'].map(mat));
  const one = new THREE.Mesh(new THREE.BoxGeometry(2.6, 5.2, 2.6),
    ['k1-side.jpg','k1-end.jpg','k1-top.jpg','k1-top.jpg','k1-front.jpg','k1-back.jpg'].map(mat));
  // soft contact shadow
  const sh = document.createElement('canvas'); sh.width = sh.height = 128; const sx = sh.getContext('2d');
  const g = sx.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(0,0,0,.55)'); g.addColorStop(1,'rgba(0,0,0,0)'); sx.fillStyle = g; sx.fillRect(0,0,128,128);
  const shM = new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false});
  const shadow = (w, d) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), shM); m.rotation.x = -Math.PI/2; m.position.y = -2.6; return m; };

  const pair = new THREE.Group();
  const g5 = new THREE.Group(); g5.add(five, shadow(16, 6)); g5.position.set(-1.6, 0, -1.2);
  const g1 = new THREE.Group(); g1.add(one, shadow(4.4, 4.4)); g1.position.set(6.6, 0, 2.2);
  pair.add(g5, g1); scene.add(pair);

  // views: each one turns the pair to show a real panel of the artwork
  const views = {front: {ry: -0.32, rx: 0.10}, back: {ry: Math.PI - 0.32, rx: 0.10, dz: 7}, end: {ry: 0.85, rx: 0.12, dz: 9}, top: {ry: -0.25, rx: 0.62}};
  let tgt = {...views.front}, cur = {ry: -0.9, rx: 0.1, dz: 0}, Z = 26, px = 0, py = 0;
  pair.rotation.set(cur.rx, cur.ry, 0);
  host.addEventListener('pointermove', e => { const b = host.getBoundingClientRect(); px = ((e.clientX-b.left)/b.width - .5) * 0.35; py = ((e.clientY-b.top)/b.height - .5) * 0.12; req(); });
  host.addEventListener('pointerleave', () => { px = py = 0; req(); });
  setView && setView(name => { tgt = {...views[name]}; req(); });

  function size(){ const w = host.clientWidth, h = host.clientHeight; r.setSize(w, h, false); cam.aspect = w / h;
    Z = 26 * Math.max(1, 1.45 / cam.aspect); cam.position.set(0, 4.2, Z + cur.dz); cam.lookAt(0.6, -0.2, 0); cam.updateProjectionMatrix(); req(); }
  new ResizeObserver(size).observe(host); size();
  let vis = false; new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis) req(); }).observe(host);
  (function loop(){ requestAnimationFrame(loop); if (!vis) return;
    const k = reduce ? 1 : 0.075; const ty = tgt.ry + px, tx = tgt.rx + py;
    cur.ry += (ty - cur.ry) * k; cur.rx += (tx - cur.rx) * k; const td = tgt.dz || 0; cur.dz += (td - cur.dz) * k; cam.position.z = Z + cur.dz;
    const moving = Math.abs(ty - cur.ry) > 1e-4 || Math.abs(tx - cur.rx) > 1e-4 || Math.abs(td - cur.dz) > 1e-3;
    if (!moving && !dirty) return; dirty = false;
    pair.rotation.set(cur.rx, cur.ry, 0); r.render(scene, cam); })();
  return {setView: n => { tgt = {...views[n]}; req(); }};
}
