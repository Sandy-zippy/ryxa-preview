/* RYXA molecular field: the packaging lattice built in 3D.
   Each lattice chain becomes a ball-and-stick peptide backbone (the same glossy spheres as the RYXA molecule mark),
   receding into the dark with fog. Chains breathe slowly; a navy signal travels along a few of them.
   Instanced meshes, render loop paused off-screen, reduced motion = one still frame. */
import * as THREE from './three.module.min.js';
import {studioEnv} from './vials.js';

export function mountMol(host, o = {}){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = matchMedia('(max-width:900px)').matches;
  const O = Object.assign({chains: phone ? 7 : 13, span: 50, step: .9, zNear: -5, zFar: -34, side: 'right', bg: 0x121316,
    pulses: phone ? 2 : 4, camZ: 14, fog: [14, 40], spread: 19, tilt: -0.22, density: 1, pointerZone: host}, o);

  const canvas = document.createElement('canvas'); canvas.className = 'molcanvas'; canvas.setAttribute('aria-hidden', 'true');
  const r = new THREE.WebGLRenderer({canvas, antialias: !phone, alpha: true, powerPreference: 'high-performance'});
  r.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.5 : 2)); r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
  r.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(O.bg, O.fog[0], O.fog[1]);
  const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(studioEnv(), 0.02).texture; scene.environmentIntensity = 0.9;
  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 120); cam.position.set(0, 0, O.camZ);
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-6, 8, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6f86d6, 2.4); rim.position.set(6, 2, -8); scene.add(rim);
  scene.add(new THREE.AmbientLight(0x1c2030, 0.6));

  // palette from the carton: graphite chain, navy atoms, bone hydrogen, navy tint signal
  const GRAPH = new THREE.Color(0x3a3f4a), NAVY = new THREE.Color(0x2c3f86), BONE = new THREE.Color(0xe9e6df), HOT = new THREE.Color(0xb9c6f2), WHITE = new THREE.Color(0xffffff);

  // build the chains: zig-zag backbones (C-alpha, C, N repeating) with an occasional side atom, like the lattice art
  const atoms = []; const bonds = [];
  const rnd = (a => () => (a = (a * 16807) % 2147483647) / 2147483647)(7);
  for (let c = 0; c < O.chains; c++){
    const t = O.chains === 1 ? .5 : c / (O.chains - 1);
    const z = O.zNear + (O.zFar - O.zNear) * Math.pow(rnd(), .8);
    const y0 = (t - .5) * O.spread * (1 + (-z) / 18) + (rnd() - .5) * 2.2;
    const n = Math.round(O.span / O.step * (1 + (-z) / 20));
    const x0 = -n * O.step / 2;
    const ph = rnd() * 6.28, amp = .36, accent = rnd() < .35;
    const first = atoms.length;
    for (let i = 0; i < n; i++){
      const role = i % 3; // 0 C-alpha, 1 C, 2 N
      const col = role === 2 ? (accent ? NAVY : GRAPH) : GRAPH;
      atoms.push({c, i, base: new THREE.Vector3(x0 + i * O.step, y0 + (i % 2 ? amp : -amp), z), ph, rad: role === 0 ? .3 : .24, col, z, p: new THREE.Vector3()});
      if (i) bonds.push([atoms.length - 2, atoms.length - 1]);
      // side atoms: carbonyl O (navy) on C, H (bone) on N — sparse so it reads as a lattice, not noise
      if (role === 1 && rnd() < .55){ const s = i % 2 ? 1 : -1;
        atoms.push({c, i, side: true, parent: atoms.length - 1, off: new THREE.Vector3(.08, s * .72, .25 * s), base: null, ph, rad: .24, col: NAVY, z, p: new THREE.Vector3()});
        bonds.push([atoms.length - 2, atoms.length - 1]); }
      else if (role === 2 && rnd() < .35){ const s = i % 2 ? 1 : -1;
        atoms.push({c, i, side: true, parent: atoms.length - 1, off: new THREE.Vector3(-.05, s * .58, -.2 * s), base: null, ph, rad: .16, col: BONE, z, p: new THREE.Vector3()});
        bonds.push([atoms.length - 2, atoms.length - 1]); }
    }
    atoms[first].chainStart = true;
  }
  const chainLen = []; atoms.forEach(a => { if (!a.side) chainLen[a.c] = Math.max(chainLen[a.c] || 0, a.i + 1); });

  const sphM = new THREE.MeshPhysicalMaterial({roughness: .22, metalness: .05, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: 1.1});
  const sph = new THREE.InstancedMesh(new THREE.SphereGeometry(1, phone ? 14 : 22, phone ? 10 : 16), sphM, atoms.length);
  const bondM = new THREE.MeshStandardMaterial({color: 0x9da2ad, roughness: .35, metalness: .6, envMapIntensity: .8});
  const bnd = new THREE.InstancedMesh(new THREE.CylinderGeometry(.06, .06, 1, 8, 1, true), bondM, bonds.length);
  sph.instanceMatrix.setUsage(THREE.DynamicDrawUsage); bnd.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const group = new THREE.Group(); group.add(sph, bnd); group.rotation.z = O.tilt; scene.add(group);
  atoms.forEach((a, k) => sph.setColorAt(k, a.col));

  // signals: each travels along one backbone, lighting atoms as it passes
  const sig = Array.from({length: O.pulses}, (_, k) => ({c: Math.floor(rnd() * O.chains), s: rnd(), v: .045 + rnd() * .035}));
  const nearChains = [...new Set(atoms.filter(a => a.z > (O.zNear + O.zFar) / 2).map(a => a.c))];
  sig.forEach(s => { if (nearChains.length) s.c = nearChains[Math.floor(rnd() * nearChains.length)]; });

  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), D = new THREE.Vector3(), tmpC = new THREE.Color();
  let t = 0, last = performance.now(), raf = 0, vis = true, px = 0, py = 0, tx = 0, ty = 0, sc = 0;
  const heat = new Float32Array(atoms.length);

  const update = (dt) => {
    t += dt;
    sig.forEach(s => { s.s += s.v * dt; if (s.s > 1.15){ s.s = -.15; s.c = nearChains.length ? nearChains[Math.floor(rnd() * nearChains.length)] : s.c; } });
    atoms.forEach((a, k) => {
      if (!a.side){
        const w = Math.sin(a.base.x * .16 + t * .35 + a.ph) * .55, w2 = Math.cos(a.base.x * .09 - t * .22 + a.ph) * .8;
        a.p.set(a.base.x + Math.sin(t * .05 + a.ph) * .6, a.base.y + w, a.base.z + w2);
      } else { const pa = atoms[a.parent]; a.p.copy(pa.p).add(a.off); }
      // heat from passing signals
      let h = 0; const L = chainLen[a.c] || 1;
      sig.forEach(s => { if (s.c !== a.c) return; const d = (a.i / L) - s.s; if (d < 0 && d > -.16) h = Math.max(h, (1 + d / .16) ); else if (d >= 0 && d < .012) h = 1; });
      heat[k] += (h - heat[k]) * Math.min(1, dt * 9);
      const hk = heat[k]; tmpC.copy(a.col).lerp(hk > .97 ? WHITE : HOT, Math.min(1, hk * .95));
      sph.setColorAt(k, tmpC);
      const rad = a.rad * (1 + hk * .35);
      M.compose(a.p, Q.identity(), S.set(rad, rad, rad)); sph.setMatrixAt(k, M);
    });
    bonds.forEach(([i, j], k) => { const A = atoms[i].p, B = atoms[j].p; D.subVectors(B, A); const len = D.length();
      Q.setFromUnitVectors(UP, D.normalize()); M.compose(S.copy(A).add(B).multiplyScalar(.5), Q, new THREE.Vector3(1, len, 1)); bnd.setMatrixAt(k, M); });
    sph.instanceMatrix.needsUpdate = true; bnd.instanceMatrix.needsUpdate = true; if (sph.instanceColor) sph.instanceColor.needsUpdate = true;
    px += (tx - px) * .04; py += (ty - py) * .04;
    cam.position.set(px * 1.6, -py * 1.0 - sc * 2.2, O.camZ); cam.lookAt(px * .4, -sc * 2.2, -10);
  };

  const size = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    // keep the field filling the frame: shift the group to the chosen side
    const shift = O.side === 'right' ? 4.5 * Math.min(1.4, w / h / 1.6) : O.side === 'left' ? -4.5 : 0; group.position.x = shift; };
  const frame = (now) => { raf = 0; const dt = Math.min(.05, (now - last) / 1000); last = now; update(dt); r.render(scene, cam); if (vis && !reduce) raf = requestAnimationFrame(frame); };
  const kick = () => { if (!raf){ last = performance.now(); raf = requestAnimationFrame(frame); } };
  host.appendChild(canvas); size(); update(0.016); r.render(scene, cam);
  new ResizeObserver(() => { size(); if (reduce){ update(0); r.render(scene, cam); } }).observe(host);
  new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis && !reduce) kick(); }, {rootMargin: '80px'}).observe(host);
  if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches){
    const z = O.pointerZone; z.addEventListener('pointermove', e => { const b = z.getBoundingClientRect(); tx = (e.clientX - b.left) / b.width - .5; ty = (e.clientY - b.top) / b.height - .5; });
    z.addEventListener('pointerleave', () => { tx = ty = 0; });
  }
  if (!reduce) addEventListener('scroll', () => { const b = host.getBoundingClientRect(); sc = Math.max(-1, Math.min(1, -b.top / (b.height || 1))); }, {passive: true});
  if (!reduce) kick();
  return {canvas};
}
