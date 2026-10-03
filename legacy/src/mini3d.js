/* ============ Mini cenas 3D dentro das fases 2D (estilo “desenho animado” com traço de nanquim) ============ */
const P3 = { anil: 0x2F55A8, anilL: 0x9DB4E8, ipe: 0xEFAE22, ipeL: 0xF7D78A, mata: 0x2B8A70, mataL: 0x9ED3C0, urucum: 0xCF5636, urucumL: 0xEFB3A0, jaca: 0x7B5FAE, jacaL: 0xC9BBE6, paper: 0xFBFAF5, ink: 0x1A2338, grey: 0xB9BDC7, wood: 0xC08552, woodD: 0x8E5B36 };
const P3HEX = n => '#' + n.toString(16).padStart(6, '0');
const TOON = { grad: null };
function toonMat(hex, o = {}) {
  if (!TOON.grad) { const d = new Uint8Array([110, 190, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.LuminanceFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; TOON.grad = t; }
  return new THREE.MeshToonMaterial({ color: hex, gradientMap: TOON.grad, transparent: !!o.opacity, opacity: o.opacity ?? 1, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 0 });
}
const INK_MAT = () => new THREE.MeshBasicMaterial({ color: P3.ink, side: THREE.BackSide });
function inked(geo, hex, o = {}) { const m = new THREE.Mesh(geo, toonMat(hex, o)); if (o.ink !== false) { const ol = new THREE.Mesh(geo, INK_MAT()); ol.scale.setScalar(o.ink || 1.07); m.add(ol); m.userData.ol = ol; } return m; }
function mini3d(host, o = {}) {
  let r;
  try { r = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return null; }
  if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
  r.setPixelRatio(Math.min(devicePixelRatio || 1, E.low ? 1.5 : 2)); r.outputEncoding = THREE.sRGBEncoding; r.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const cam = o.ortho ? new THREE.OrthographicCamera(-4, 4, 2, -2, 0.1, 100) : new THREE.PerspectiveCamera(o.fov || 34, 1, 0.1, 100);
  cam.position.set(...(o.cam || [0, 2.4, 8])); const look = new THREE.Vector3(...(o.look || [0, 0.4, 0])); cam.lookAt(look);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa6c8, 0.75)); const dl = new THREE.DirectionalLight(0xffffff, 0.85); dl.position.set(3, 7, 6); scene.add(dl);
  const cv = r.domElement; cv.className = 'm3c'; cv.setAttribute('aria-hidden', 'true'); host.append(cv);
  const M = { r, scene, cam, host, look, picks: [], ticks: [], alive: true, o };
  M.resize = () => { const w = host.clientWidth, hh = host.clientHeight; if (!w || !hh) return; r.setSize(w, hh, false); if (cam.isPerspectiveCamera) cam.aspect = w / hh; if (o.fit) o.fit(M, w, hh); cam.updateProjectionMatrix(); M.w = w; M.h = hh; };
  M.ro = new ResizeObserver(M.resize); M.ro.observe(host); M.resize();
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2(); let down = null;
  cv.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; SND.ensure(); });
  cv.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) { down = null; return; } down = null;
    const rc = cv.getBoundingClientRect(); v2.set(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1); ray.setFromCamera(v2, cam);
    const hits = ray.intersectObjects(M.picks, true);
    for (const hi of hits) { let p = hi.object; while (p && !p.userData.click) p = p.parent; if (p && p.visible !== false) { p.userData.click(p, hi); return; } }
  });
  M.project = (vec3) => { const p = vec3.clone().project(cam); return { x: (p.x + 1) / 2 * (M.w || 1), y: (1 - p.y) / 2 * (M.h || 1) }; };
  M.render = (dt, t) => { if (!host.isConnected || !M.w) return; for (const f of M.ticks) f(dt, t); r.render(scene, cam); };
  M.dispose = () => { M.alive = false; M.ro.disconnect(); scene.traverse(ob => { if (ob.geometry && !Object.values(geoCache).includes(ob.geometry)) ob.geometry.dispose(); if (ob.material) { (Array.isArray(ob.material) ? ob.material : [ob.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } }); r.dispose(); try { r.forceContextLoss(); } catch (e) { } cv.remove(); };
  return M;
}
/* textura de texto para faces e placas */
function m3Tex(text, o = {}) { const c = textCanvas(text, { size: o.size || 30, weight: o.weight || 700, display: o.brush, mono: o.mono, fg: o.fg || P3HEX(P3.ink), bg: o.bg || null, border: o.border || null, padX: o.padX ?? 6, padY: o.padY ?? 3, radius: o.radius ?? 10, shadow: false }); return { c, t: texFrom(c) }; }
function m3Plane(text, h, o = {}) { const { c, t } = m3Tex(text, o); const m = new THREE.Mesh(new THREE.PlaneGeometry(h * c.width / c.height, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false })); m.renderOrder = 3; return m; }
function m3Sprite(text, h, o = {}) { const { c, t } = m3Tex(text, { bg: '#FBFAF5', border: '#1A2338', padX: 10, padY: 4, ...o }); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); s.scale.set(h * c.width / c.height, h, 1); s.renderOrder = 9; return s; }
/* bloco com texto na frente (e, se quiser, no verso) */
function block3(text, hex, o = {}) {
  const w = o.w || Math.max(0.6, 0.3 + [...String(text)].length * 0.2), hh = o.h || 0.62, d = o.d || 0.46;
  const g = new THREE.Group(); const box = inked(rbox(w, hh, d, 0.08), hex); g.add(box);
  const f = m3Plane(text, hh * 0.56, { brush: o.brush, mono: o.mono, size: o.size || 34, fg: o.fg }); f.position.z = d / 2 + 0.006; g.add(f);
  if (o.back != null) { const b = m3Plane(String(o.back), hh * 0.5, { mono: true, size: 30, fg: '#FBFAF5' }); b.position.z = -d / 2 - 0.006; b.rotation.x = Math.PI; g.add(b); const plate = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, hh * 0.84), new THREE.MeshBasicMaterial({ color: P3.ink })); plate.position.z = -d / 2 - 0.003; plate.rotation.x = Math.PI; g.add(plate); }
  g.userData = { w, h: hh, d, box, face: f, text }; return g;
}
function setBlockColor(g, hex) { g.userData.box.material.color.setHex(hex); }
/* o Tok em 3D */
function tok3() {
  const g = new THREE.Group();
  const body = inked(rbox(1.5, 1.3, 1.1, 0.34), P3.ipe); body.position.y = 0.75; g.add(body);
  [-0.34, 0.34].forEach(x => { const e = inked(new THREE.SphereGeometry(0.22, 20, 14), 0xffffff, { ink: 1.1 }); e.position.set(x, 0.88, 0.55); g.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), new THREE.MeshBasicMaterial({ color: P3.ink })); p.position.set(x, 0.86, 0.72); g.add(p); (g.userData.pupils = g.userData.pupils || []).push(p); });
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 8, 20, Math.PI), new THREE.MeshBasicMaterial({ color: P3.ink })); mouth.rotation.z = Math.PI; mouth.position.set(0, 0.55, 0.57); g.add(mouth); g.userData.mouth = mouth;
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 8), new THREE.MeshBasicMaterial({ color: P3.ink })); ant.position.y = 1.58; g.add(ant);
  const ball = inked(new THREE.SphereGeometry(0.12, 14, 10), P3.urucum); ball.position.y = 1.82; g.add(ball); g.userData.ball = ball;
  [-0.72, 0.72].forEach(x => { const c = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), new THREE.MeshBasicMaterial({ color: P3.urucum, transparent: true, opacity: 0.4 })); c.position.set(x * 0.7, 0.58, 0.565); g.add(c); });
  return g;
}
/* cubo de 27 pesos (9 palavras × 3 números) */
function cube27(W) {
  const g = new THREE.Group(); const cells = []; const s = 0.34, gap = 0.46;
  for (let i = 0; i < 9; i++) for (let d = 0; d < 3; d++) { const m = inked(new THREE.BoxGeometry(s, s, s), P3.paper, { ink: 1.12 }); m.position.set((d - 1) * gap, (1 - Math.floor(i / 3)) * gap, ((i % 3) - 1) * gap); g.add(m); cells.push({ m, i, d }); }
  const col = new THREE.Color(), a = new THREE.Color(P3.anil), u = new THREE.Color(P3.urucum), p = new THREE.Color(P3.paper);
  g.userData.set = Wm => cells.forEach(c => { const w = Wm[c.i][c.d]; const k = Math.min(1, Math.abs(w) / 1.4); col.copy(p).lerp(w >= 0 ? a : u, 0.22 + k * 0.78); c.m.material.color.copy(col); c.m.scale.setScalar(0.72 + k * 0.5); });
  g.userData.flash = gr => cells.forEach(c => { const v = Math.abs(gr[c.i][c.d]); if (v > 0.02) { c.m.material.emissive.setHex(P3.ipe); c.m.material.emissiveIntensity = Math.min(0.9, v * 3); } });
  g.userData.tick = dt => cells.forEach(c => { c.m.material.emissiveIntensity *= Math.pow(0.08, dt); });
  if (W) g.userData.set(W); return g;
}
/* cadeado que abre quando os pesos mudam */
function padlock3() {
  const g = new THREE.Group(); const body = inked(rbox(0.9, 0.72, 0.4, 0.1), P3.mata); body.position.y = 0.36; g.add(body);
  const sh = inked(new THREE.TorusGeometry(0.28, 0.07, 10, 24, Math.PI), P3.grey, { ink: 1.15 }); sh.position.y = 0.72; g.add(sh);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.07, 14), new THREE.MeshBasicMaterial({ color: P3.ink })); hole.position.set(0, 0.4, 0.206); g.add(hole);
  g.userData.set = open => { body.material.color.setHex(open ? P3.urucum : P3.mata); g.userData.open = open; };
  g.userData.tick = dt => { const to = g.userData.open ? 1 : 0; sh.userData.k = lerp(sh.userData.k || 0, to, Math.min(1, dt * 6)); const k = sh.userData.k; sh.position.y = 0.72 + k * 0.22; sh.position.x = k * 0.28; sh.rotation.y = k * 1.1; };
  return g;
}
/* troféu da formatura */
function trophy3() {
  const g = new THREE.Group(); const pod = inked(rbox(1.3, 0.42, 1.3, 0.08), P3.anil); pod.position.y = 0.21; g.add(pod);
  const pts = [[0, 0], [0.36, 0], [0.36, 0.08], [0.15, 0.14], [0.09, 0.22], [0.08, 0.44], [0.13, 0.5], [0.09, 0.56], [0.2, 0.63], [0.36, 0.74], [0.46, 0.92], [0.5, 1.14], [0.52, 1.34], [0.46, 1.35], [0.43, 1.14], [0.38, 0.94], [0.26, 0.82], [0, 0.78]].map(([x, y]) => new THREE.Vector2(x, y));
  const cup = inked(new THREE.LatheGeometry(pts, 36), P3.ipe, { ink: 1.05 }); cup.material.side = THREE.DoubleSide; cup.position.y = 0.42; g.add(cup);
  [-1, 1].forEach(sg => { const hdl = inked(new THREE.TorusGeometry(0.2, 0.045, 8, 18, Math.PI), P3.ipe); hdl.rotation.z = -sg * Math.PI / 2; hdl.position.set(sg * 0.5, 1.5, 0); g.add(hdl); });
  g.userData.cup = cup; return g;
}
/* anima um objeto até uma posição */
function m3move(o, to, dur = 400) { const f = o.position.clone(), t = new THREE.Vector3(...to); return anim(dur, k => o.position.lerpVectors(f, t, k), ease.out); }
function clear3(g) { for (const c of [...g.children]) { g.remove(c); c.traverse(ob => { if (ob.geometry && !Object.values(geoCache).includes(ob.geometry)) ob.geometry.dispose(); if (ob.material) { (Array.isArray(ob.material) ? ob.material : [ob.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } }); } }
/* cérebro de 27 pesos girando, com cadeado opcional (fases 6 e 9) */
function brain3(P, o = {}) {
  P.m3host = h('div', { class: 'm3 cube' + (o.lock ? ' wide' : ''), role: 'img', 'aria-label': o.label || 'Cubo com os 27 pesos do modelo. Toque para saber mais.' });
  P.m3opts = o.lock ? { cam: [1.1, 1.25, 5.0], look: [-0.45, -0.1, 0], fov: 34, fit(M) { const vf = M.cam.fov * Math.PI / 180; const hf = 2 * Math.atan(Math.tan(vf / 2) * M.cam.aspect); const dist = Math.max(1.75 / Math.tan(hf / 2), 1.05 / Math.tan(vf / 2)); M.cam.position.set(-0.45 + dist * 0.2, -0.1 + dist * 0.25, dist * 0.95); M.cam.lookAt(-0.45, -0.1, 0); } } : { cam: [2.4, 1.7, 3.2], look: [0, 0, 0], fov: 36 };
  P.spin = 0;
  P.m3build = M => {
    const c = cube27(o.W()); M.scene.add(c); P.cube = c; if (o.lock) c.position.x = 0.35;
    c.userData.click = () => balloon('cube', { m3: M, obj: c, off: [0, 0.75, 0] }, '<p><b>27 pesos</b></p><p>Cada cubinho é um número do modelo. Azul é positivo e laranja é negativo. Quanto mais forte a cor, maior o número.</p>', { ttl: 6500 });
    M.picks.push(c);
    if (o.lock) { const l = padlock3(); l.scale.setScalar(0.95); l.position.set(-1.35, -0.62, 0.55); l.rotation.y = 0.45; M.scene.add(l); P.lock3 = l; l.userData.set(o.open ? o.open() : false); l.userData.click = () => balloon('lk', { m3: M, obj: l, off: [0, 1.1, 0] }, l.userData.open ? '<p><b>Cadeado aberto</b></p><p>Alguns pesos mudaram: o modelo foi treinado de novo.</p>' : '<p><b>Cadeado fechado</b></p><p>Nenhum peso mudou desde o fim do treino.</p>', { ttl: 5000 }); M.picks.push(l); }
    M.ticks.push((dt, t) => { c.rotation.y += dt * (0.3 + P.spin); c.rotation.x = Math.sin(t * 0.45) * 0.14; P.spin *= Math.pow(0.12, dt); c.userData.tick(dt); if (P.lock3) { P.lock3.userData.tick(dt); P.lock3.position.y = -0.62 + Math.sin(t * 1.6) * 0.03; } });
  };
}
