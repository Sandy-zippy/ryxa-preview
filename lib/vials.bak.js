/* RYXA hero vials: real-time 3D, profile measured from Rochelle's BPC-157 render (bpc-hi.webp, 28.3 px per mm).
   threejs-scene rules: ACES tone mapping, room environment, physical materials, pixel ratio capped at 2, render only on change. */
import * as THREE from './three.module.min.js';


const MM = 0.1;                 // 1 unit = 10 mm
const R_BODY = 12.0;            // body radius, mm (340 px)
const H = 56.0;                 // total height, mm (175..1760 px)
const px = p => (p / 28.3);     // render px -> mm
// y measured from the vial bottom (1760 px) upward
const yb = p => px(1760 - p);

const C = {ink:'#121316', label:'#1F1D1B', navy:'#2A3768', bone:'#F5F3EE', tint:'#AEB8E6', silver:'#A3A6AD', amber:'#FFB833'};

function glassProfile(){
  // outer silhouette of the glass from the render, bottom to the lip (inner wall 1 mm in)
  const o = [[0,0],[R_BODY-1.6,0],[R_BODY-0.4,0.35],[R_BODY,1.4],[R_BODY,yb(800)],[px(336),yb(780)],[px(322),yb(700)],[px(298),yb(660)],
    [px(266),yb(620)],[px(248),yb(600)],[px(236),yb(580)],[px(228),yb(555)],[px(224),yb(540)],[px(224),yb(486)],[px(262),yb(478)],[px(262),yb(470)]];
  const pts = o.map(([r,y]) => new THREE.Vector2(r*MM, y*MM));
  // come back down the inside so the wall has thickness
  for (let i = o.length - 1; i >= 1; i--){ const [r,y] = o[i]; pts.push(new THREE.Vector2(Math.max(0.01,(r-1.0))*MM, Math.max(1.2,y)*MM)); }
  pts.push(new THREE.Vector2(0.001, 1.2*MM));
  return pts;
}

function capProfile(){
  // white flip-off cap: top disc r 296 px (175..300), crimp r 282 px (300..470), soft rounded edges
  const r1 = px(296), r2 = px(282), yTop = yb(178), yStep = yb(300), yLow = yb(472);
  const p = [[0,yTop],[r1-0.9,yTop],[r1-0.2,yTop-0.25],[r1,yTop-0.9],[r1,yStep+0.25],[r1-0.3,yStep],[r2,yStep-0.05],[r2,yLow+0.3],[r2-0.3,yLow],[px(230),yLow]];
  return p.map(([r,y]) => new THREE.Vector2(r*MM, y*MM));
}

function drawMol(ctx, x, y, s){
  const at = (cx, cy, r, c1, c2) => { const g = ctx.createRadialGradient(x+(cx-r*.3)*s, y+(cy-r*.35)*s, 0, x+cx*s, y+cy*s, r*s*1.1);
    g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x+cx*s, y+cy*s, r*s, 0, 7); ctx.fill(); };
  ctx.strokeStyle = '#8d939c'; ctx.lineCap = 'round'; ctx.lineWidth = 3.2*s;
  [[-17,-11],[16,-10],[0,17]].forEach(([a,b]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+a*s, y+b*s); ctx.stroke(); });
  ctx.lineWidth = 2.2*s; ctx.beginPath(); ctx.moveTo(x, y+17*s); ctx.lineTo(x+9*s, y+26*s); ctx.stroke();
  at(-17,-11,7.4,'#ffffff','#9d9b95'); at(16,-10,6.4,'#8ea2dc','#14224d'); at(0,17,7,'#ffffff','#9d9b95'); at(9,26,3.8,'#e6e8ec','#8d939c'); at(0,0,9.2,'#8ea2dc','#14224d');
}

/* The label, unrolled. Width = circumference (2*pi*12 mm = 75.4 mm), height 27.8 mm (818..1605 px). u = 0.5 faces the camera at rest. */
export function labelCanvas(v, state = {}){
  const W = 3072, Hh = 1134, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
  const x = cv.getContext('2d');
  x.fillStyle = C.label; x.fillRect(0, 0, W, Hh);
  const band = Math.round(Hh * 0.045); x.fillStyle = C.navy; x.fillRect(0, 0, W, band); x.fillRect(0, Hh - band, W, band);
  // subtle paper grain so the label is not a flat fill
  const g = x.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, 'rgba(255,255,255,0.025)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.06)');
  x.fillStyle = g; x.fillRect(0, band, W, Hh - 2*band);
  const cx = W * 0.5, wide = f => { x.font = f; try { x.fontStretch = 'expanded'; } catch(e){} };
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  // logo row: R [mol] X A   LABS
  const ly = Hh * 0.355, lsz = Hh * 0.062;
  wide(`600 ${lsz}px Archivo`); x.letterSpacing = `${lsz*0.32}px`;
  const parts = ['R', 'XA'], wR = x.measureText('R').width, wXA = x.measureText('XA').width, gap = lsz*1.05;
  x.font = `300 ${lsz}px Archivo`; const wL = x.measureText('LABS').width;
  const total = wR + gap + wXA + lsz*0.55 + wL; let lx = cx - total/2;
  wide(`600 ${lsz}px Archivo`); x.textAlign = 'left'; x.fillStyle = C.bone; x.fillText('R', lx, ly); lx += wR;
  drawMol(x, lx + gap*0.42, ly - lsz*0.42, lsz/36); lx += gap;
  x.fillStyle = C.bone; x.fillText('XA', lx, ly); lx += wXA + lsz*0.55;
  wide(`300 ${lsz}px Archivo`); x.fillStyle = '#C9CBD0'; x.fillText('LABS', lx, ly);
  x.letterSpacing = '0px'; x.textAlign = 'center';
  // name
  wide(`700 ${Hh*0.118}px Archivo`); x.fillStyle = C.bone; x.fillText(v.name, cx, Hh*0.535);
  // strength line
  x.font = `400 ${Hh*0.05}px "IBM Plex Mono"`; x.fillStyle = C.tint; x.fillText(`${v.mg} · lyophilized`, cx, Hh*0.64);
  // RX chip
  x.font = `500 ${Hh*0.05}px "IBM Plex Mono"`; const cw = x.measureText(v.rx).width + Hh*0.07, ch = Hh*0.078, cy = Hh*0.675;
  x.fillStyle = v.chip || C.amber; roundRect(x, cx - cw/2, cy, cw, ch, Hh*0.008); x.fill();
  x.fillStyle = '#1A1408'; x.fillText(v.rx, cx, cy + ch*0.72);

  // back panel: the lot fields, as printed on the real label, with a vertical rule between panels
  const px0 = W * 0.115, colV = W * 0.265, rule = W * 0.315;
  x.strokeStyle = 'rgba(163,166,173,0.35)'; x.lineWidth = 3; x.beginPath(); x.moveTo(rule, Hh*0.16); x.lineTo(rule, Hh*0.84); x.stroke();
  const rows = [['LOT', v.lot], ['EXP', v.exp || '12/2028'], ['STORE', '2–8 °C'], ['PURITY', v.purity || '>99%']];
  rows.forEach(([k, val], i) => {
    const ry = Hh * (0.31 + i * 0.145);
    x.textAlign = 'left'; x.font = `500 ${Hh*0.04}px "IBM Plex Mono"`; x.fillStyle = '#9A9EA6'; try{ x.letterSpacing = `${Hh*0.006}px`; }catch(e){} x.fillText(k, px0, ry);
    x.letterSpacing = '0px';
    x.textAlign = 'right'; x.font = `400 ${Hh*0.058}px "IBM Plex Mono"`; x.fillStyle = C.bone; x.fillText(val, colV, ry);
    if (i === 0 && state.lot){
      const w = x.measureText(val).width, pad = Hh*0.02;
      x.strokeStyle = state.lot === 'ok' ? '#9AA8CF' : 'rgba(154,168,207,0.7)'; x.lineWidth = 5;
      roundRect(x, colV - w - pad, ry - Hh*0.058, w + pad*2, Hh*0.08, Hh*0.01); x.stroke();
      // matched: the lot field inverts to bone, like a highlighter on the printed label
      if (state.lot === 'ok'){ x.fillStyle = C.bone; roundRect(x, colV - w - pad, ry - Hh*0.058, w + pad*2, Hh*0.08, Hh*0.01); x.fill();
        x.fillStyle = '#121316'; x.font = `500 ${Hh*0.058}px "IBM Plex Mono"`; x.textAlign = 'right'; x.fillText(val, colV, ry); }
    }
  });
  return cv;
}
function roundRect(x, a, b, w, h, r){ x.beginPath(); x.moveTo(a+r, b); x.arcTo(a+w, b, a+w, b+h, r); x.arcTo(a+w, b+h, a, b+h, r); x.arcTo(a, b+h, a, b, r); x.arcTo(a, b, a+w, b, r); x.closePath(); }


// Dark product studio: near-black room, two tall softbox strips and a soft top light,
// so the glass shows thin vertical highlights instead of a bright room (which read as chrome).
export function studioEnv() {
  const sc = new THREE.Scene();
  sc.add(new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({color: 0x07080b, side: THREE.BackSide})));
  const strip = (w, h, x, y, z, ry, c) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: c, side: THREE.DoubleSide}));
    m.position.set(x, y, z); m.rotation.y = ry; sc.add(m); };
  strip(1.1, 12, -6.5, 1, 4, Math.PI / 2.6, 0xffffff);
  strip(0.6, 12, 7, 1, 2.5, -Math.PI / 2.3, 0xb9c6ee);
  strip(0.5, 10, 2, 0, -8, 0, 0x5d70b8);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({color: 0xffffff}));
  top.position.set(0, 9.5, 0); top.rotation.x = Math.PI / 2; sc.add(top);
  // broad, dim front fill so the label, cap and powder keep their real colours (glass stays dark: it only mirrors the strips)
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshBasicMaterial({color: 0x3a3d45}));
  fill.position.set(0, 1, 9.5); fill.rotation.y = Math.PI; sc.add(fill);
  return sc;
}

export async function mountVials(host, opts){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  await Promise.all(['600 40px Archivo','700 40px Archivo','300 40px Archivo','400 40px "IBM Plex Mono"','500 40px "IBM Plex Mono"'].map(f => document.fonts.load(f).catch(()=>{})));
  const canvas = document.createElement('canvas'); canvas.className = 'vcanvas'; canvas.setAttribute('aria-hidden', 'true');
  const r = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance'});
  r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0; r.outputColorSpace = THREE.SRGBColorSpace;
  r.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(studioEnv(), 0.02).texture; scene.environmentIntensity = 1.0;
  const cam = new THREE.PerspectiveCamera(24, 1, 0.1, 100);

  const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(-4, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6f86d6, 2.2); rim.position.set(3, 2, -6); scene.add(rim);
  const rimL = new THREE.DirectionalLight(0x6f86d6, 1.2); rimL.position.set(-5, 1, -4); scene.add(rimL);

  // clear glass: mostly reflection, the dark page shows through (as in the render)
  const glassM = new THREE.MeshPhysicalMaterial({color: 0x0b0d12, metalness: 0, roughness: 0.06, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 0.95, side: THREE.DoubleSide});
  const capM = new THREE.MeshPhysicalMaterial({color: 0xF4F4F2, emissive: 0x4a4b4f, roughness: 0.34, clearcoat: 0.7, clearcoatRoughness: 0.18, sheen: 0.2});
  const crimpM = new THREE.MeshPhysicalMaterial({color: 0xECEDEB, roughness: 0.22, metalness: 0.0, clearcoat: 0.9, clearcoatRoughness: 0.1});
  const stopM = new THREE.MeshStandardMaterial({color: 0x2b2d31, roughness: 0.75});
  const cakeM = new THREE.MeshStandardMaterial({color: 0xEDEAE3, emissive: 0x3a3833, roughness: 1});

  const gGlass = new THREE.LatheGeometry(glassProfile(), 96);
  const gCap = new THREE.LatheGeometry(capProfile(), 96);
  const gStop = new THREE.CylinderGeometry(px(214)*MM, px(214)*MM, (yb(470)-yb(540))*MM, 64);
  const labH = (yb(818) - yb(1605)) * MM, labY = (yb(1605) + yb(818)) / 2 * MM;
  const gLab = new THREE.CylinderGeometry((R_BODY+0.08)*MM, (R_BODY+0.08)*MM, labH, 128, 1, true);
  const gCake = new THREE.CylinderGeometry((R_BODY-1.3)*MM, (R_BODY-1.3)*MM, 4.4*MM, 64);

  const vials = opts.vials.map((v, i) => {
    const g = new THREE.Group();
    const glass = new THREE.Mesh(gGlass, glassM); glass.renderOrder = 2; g.add(glass);
    const cap = new THREE.Mesh(gCap, capM); g.add(cap);
    const crimpRing = new THREE.Mesh(new THREE.CylinderGeometry(px(283)*MM, px(283)*MM, 0.15*MM, 96, 1, true), crimpM); crimpRing.position.y = yb(300)*MM; g.add(crimpRing);
    const st = new THREE.Mesh(gStop, stopM); st.position.y = (yb(470)+yb(540))/2*MM; g.add(st);
    const cake = new THREE.Mesh(gCake, cakeM); cake.position.y = (1.3 + 2.2) * MM; g.add(cake);
    const tex = new THREE.CanvasTexture(labelCanvas(v)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = r.capabilities.getMaxAnisotropy();
    tex.wrapS = THREE.RepeatWrapping; tex.offset.x = 0.55; // CylinderGeometry's u=0 sits at +z..; shift so u=0.5 faces the camera
    const labM = new THREE.MeshPhysicalMaterial({map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.42, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.3});
    const lab = new THREE.Mesh(gLab, labM); lab.position.y = labY; g.add(lab);
    g.userData = {v, tex, labM, spin: 0, spinT: 0};
    g.position.set(...v.pos); g.rotation.y = v.rotY || 0; g.scale.setScalar(v.scale || 1);
    scene.add(g); return g;
  });

  // soft contact shadow
  const sh = document.createElement('canvas'); sh.width = sh.height = 256; const sx = sh.getContext('2d');
  const sg = sx.createRadialGradient(128,128,0,128,128,128); sg.addColorStop(0,'rgba(0,0,0,.55)'); sg.addColorStop(.55,'rgba(0,0,0,.18)'); sg.addColorStop(1,'rgba(0,0,0,0)');
  sx.fillStyle = sg; sx.fillRect(0,0,256,256);
  const shM = new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false});
  vials.forEach(v => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.5), shM); m.rotation.x = -Math.PI/2; m.position.set(v.position.x, 0.002, v.position.z); m.scale.setScalar(v.scale.x); scene.add(m); });

  host.appendChild(canvas);
  const target = new THREE.Vector3(0, 2.55, 0);
  let camZ = opts.camZ || 21.5, camY = opts.camY || 4.7, fitK = 1;
  const size = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h;
    // keep the trio framed on tall screens: widen the vertical fov a little
    cam.fov = w / h < 1.3 ? 21 : 24; fitK = opts.fit === false ? 1 : Math.max(1, 1.12 / (w / h)); cam.updateProjectionMatrix(); dirty = true; };

  // state
  let dirty = true, raf = 0, t0 = performance.now(), intro = reduce ? 1 : 0, px_ = 0, py_ = 0, tx = 0, ty = 0, scrollK = 0;
  const center = vials[opts.focus || 0];
  const ease = t => 1 - Math.pow(1 - t, 4);
  const frame = (now) => {
    raf = 0; let moving = false;
    if (intro < 1){ intro = Math.min(1, (now - t0) / 1600); moving = true; }
    const e = ease(intro);
    px_ += (tx - px_) * 0.07; py_ += (ty - py_) * 0.07; if (Math.abs(tx - px_) > 1e-4 || Math.abs(ty - py_) > 1e-4) moving = true;
    vials.forEach((g, i) => { const u = g.userData;
      const d = u.spinT - u.spin; if (Math.abs(d) > 1e-4){ u.spin += d * (reduce ? 1 : 0.085); moving = true; } else u.spin = u.spinT;
      const lift = (1 - ease(Math.min(1, Math.max(0, intro * 1.25 - i * 0.12)))) * 0.9;
      g.position.y = -lift; g.rotation.y = (u.v.rotY || 0) + u.spin + (i === (opts.focus||0) ? scrollK * 0.7 : 0);
    });
    const az = px_ * 0.16, el = py_ * 0.06;
    const z = camZ * fitK + (1 - e) * 2.2, y = camY + el * 6 + (1 - e) * 0.6;
    cam.position.set(Math.sin(az) * z, y, Math.cos(az) * z); cam.lookAt(target);
    r.render(scene, cam);
    if (moving) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  new ResizeObserver(() => { size(); kick(); }).observe(host);
  size();

  if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches){
    const zone = opts.pointerZone || host;
    zone.addEventListener('pointermove', e => { const b = zone.getBoundingClientRect(); tx = (e.clientX - b.left) / b.width - .5; ty = (e.clientY - b.top) / b.height - .5; kick(); });
    zone.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
  }
  if (!reduce){ addEventListener('scroll', () => { const b = host.getBoundingClientRect(); scrollK = Math.max(0, Math.min(1, -b.top / (b.height || 1))); kick(); }, {passive: true}); }

  const BACK = 2.6; // turns the lot panel to the camera
  const api = {
    showLot(state){ // state: null | 'look' | 'ok' | 'bad'
      const u = center.userData;
      u.spinT = state ? BACK : 0;
      const cv = labelCanvas(u.v, {lot: state === 'ok' ? 'ok' : state === 'look' ? 'look' : null});
      u.tex.image = cv; u.tex.needsUpdate = true; kick();
    },
    ready: true,
  };
  kick();
  return api;
}
