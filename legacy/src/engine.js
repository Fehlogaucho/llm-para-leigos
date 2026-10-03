/* ============ LLM para leigos · motor ============ */
{ const ap = Element.prototype.append; Element.prototype.append = function (...a) { return ap.apply(this, a.filter(x => x != null && x !== false)); }; }
'use strict';
const $ = (s, el = document) => el.querySelector(s);
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) for (const k in props) {
    const v = props[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}
const fmtPct = (p, d = 1) => (p * 100).toFixed(d).replace('.', ',') + '%';
const fmtNum = (x, d = 2) => (x >= 0 ? ' ' : '') + x.toFixed(d).replace('.', ',');
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const wait = ms => new Promise(r => setTimeout(r, ms));
const ease = { io: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, out: t => 1 - Math.pow(1 - t, 3), back: t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }, lin: t => t, elastic: t => t === 0 || t === 1 ? t : Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1 };
function softmax(l, T = 1) { const m = Math.max(...l); const e = l.map(v => Math.exp((v - m) / T)); const s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); }
function seeded(s) { return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MQ_MOBILE = matchMedia('(max-width: 760px)'); const isMobile = () => MQ_MOBILE.matches; const LBLK = () => (typeof E !== 'undefined' && E.lblk) || (isMobile() ? 1.4 : 1); const MHF = Math.tan(24 * Math.PI / 180);

/* fixed 3D palette (objects keep their colors in both themes) */
const COL = { blue: 0x1F4FC4, blueL: 0x7EA2F2, blueXL: 0xB9CBF2, yellow: 0xF2B400, coral: 0xD2472C, coralL: 0xE98A74, green: 0x12825C, greenL: 0x5CC39A, white: 0xF7F8FA, ink: 0x14213A, concrete: 0xDCE1E8, grey: 0x9AA6B8 };
const TOK = [
  { bg: '#1F4FC4', fg: '#FFFFFF' }, { bg: '#F2B400', fg: '#14213A' }, { bg: '#7EA2F2', fg: '#14213A' },
  { bg: '#12825C', fg: '#FFFFFF' }, { bg: '#E0674B', fg: '#FFFFFF' }, { bg: '#B9CBF2', fg: '#14213A' }];
const FONT = { body: '"Atkinson Hyperlegible", system-ui, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace', display: '"Caveat Brush", "Segoe Print", cursive' };
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/* ---------- som (sintetizado, sem arquivos) ---------- */
const SND = {
  ctx: null,
  ensure() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; } } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); return !!this.ctx; },
  tone(f, dur, type = 'sine', vol = 0.06, when = 0, slide = null) {
    const c = this.ctx, t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.03);
  },
  noise(dur, vol = 0.05, f = 2000, q = 1) {
    const c = this.ctx, b = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const s = c.createBufferSource(); s.buffer = b; const fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q; const g = c.createGain(); g.gain.value = vol;
    s.connect(fl).connect(g).connect(c.destination); s.start();
  },
  play(k) {
    if (S.sound === false || !S.started || !this.ensure()) return;
    try {
      switch (k) {
        case 'click': this.tone(760, 0.05, 'sine', 0.04); break;
        case 'pop': this.tone(420, 0.1, 'triangle', 0.07, 0, 860); break;
        case 'ok': [523, 659, 784].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.06, i * 0.07)); break;
        case 'bad': this.tone(250, 0.2, 'square', 0.028, 0, 160); break;
        case 'snip': this.noise(0.08, 0.14, 3800, 2); this.tone(1500, 0.035, 'square', 0.015); break;
        case 'whoosh': this.noise(0.4, 0.06, 700, 0.8); break;
        case 'tick': this.tone(1300, 0.022, 'square', 0.014); break;
        case 'grab': this.tone(330, 0.07, 'sine', 0.05, 0, 520); break;
        case 'drop': this.tone(560, 0.09, 'triangle', 0.06, 0, 300); break;
        case 'train': this.tone(880, 0.05, 'sine', 0.03, 0, 1200); break;
        case 'win': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.07, i * 0.11)); this.tone(1319, 0.6, 'sine', 0.045, 0.5); break;
      }
    } catch (e) { }
  }
};
/* ---------- confete na tela ---------- */
const FX = {
  parts: [], running: false,
  burst(n = 90, cx = 0.5, cy = 0.35, power = 1) {
    if (REDUCED) return; const cv = $('#fx'); if (!cv) return;
    const W = cv.clientWidth, H = cv.clientHeight; const dpr = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const cols = ['#F2B400', '#1F4FC4', '#D2472C', '#12825C', '#7EA2F2', '#FFFFFF'];
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = (220 + Math.random() * 420) * power; this.parts.push({ x: cx * W, y: cy * H, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 260 * power, r: Math.random() * 6, vr: (Math.random() - 0.5) * 14, w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, c: cols[i % cols.length], life: 1.4 + Math.random() * 0.6 }); }
    if (!this.running) { this.running = true; this.last = performance.now(); requestAnimationFrame(() => this.step()); }
  },
  step() {
    const cv = $('#fx'), x = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1); const now = performance.now(), dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, cv.width, cv.height);
    this.parts = this.parts.filter(p => (p.life -= dt) > 0);
    for (const p of this.parts) { p.vy += 900 * dt; p.vx *= 0.99; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; x.save(); x.globalAlpha = Math.min(1, p.life * 1.5); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); x.restore(); }
    if (this.parts.length) requestAnimationFrame(() => this.step()); else { this.running = false; x.clearRect(0, 0, cv.width, cv.height); }
  }
};

/* ---------- engine ---------- */
const E = { noDrag: true, tweens: [], time: 0, phase: null, scene: null, down: null, hover: null, drag: null, guideT: 0, tokText: '' };
E.low = Math.min(screen.width, screen.height) < 700 || (navigator.hardwareConcurrency || 8) <= 4;

function initCore() {
  E.clock = new THREE.Clock();
  new MutationObserver(onTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onTheme);
  $('#tokAv').addEventListener('click', () => { if (TG.dialog) TG.next(); else if (TG.hintText) VOICE.say(TG.hintText); const av = $('#tokAv'); av.classList.remove('talk'); void av.offsetWidth; av.classList.add('talk'); });
  const sb = $('#soundBtn'); const drawSnd = () => { sb.setAttribute('aria-pressed', S.sound === false ? 'false' : 'true'); sb.title = S.sound === false ? 'Som desligado' : 'Som ligado'; };
  sb.addEventListener('click', () => { S.sound = S.sound === false; saveState(); drawSnd(); SND.play('pop'); }); drawSnd();
  document.addEventListener('keydown', e => {
    const a = document.activeElement; if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
    if (e.key === 'ArrowRight' && e.altKey) go(PHASES.indexOf(E.phase) + 1);
    if (e.key === 'ArrowLeft' && e.altKey) go(PHASES.indexOf(E.phase) - 1);
  });
  new ResizeObserver(() => { for (const P of PHASES) if (P.root && P.root.classList.contains('on') && P.onShow) P.onShow(); }).observe($('#scene2d'));
  loop();
}
function ensure3D() {
  if (E.renderer) return;
  const stage = $('#stage');
  if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
  const r = E.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, E.low ? 1.5 : 2));
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.NoToneMapping;
  r.setClearColor(0x000000, 0);
  r.domElement.classList.add('three'); stage.prepend(r.domElement);
  r.domElement.setAttribute('aria-label', 'Cena 3D interativa');
  if (THREE.RoomEnvironment) { const pm = new THREE.PMREMGenerator(r); E.env = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture; pm.dispose(); }
  const cam = E.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  cam.position.set(0, 6, 12);
  E.raycaster = new THREE.Raycaster();
  const el = r.domElement;
  // our pointerdown runs before OrbitControls', so a drag can switch the camera off first
  el.addEventListener('pointerdown', e => {
    E.down = { x: e.clientX, y: e.clientY }; SND.ensure();
    const hit = pickAt(e);
    if (hit && hit.userData.drag && !E.noDrag) {
      E.drag = { obj: hit, x: e.clientX, y: e.clientY, active: false, plane: dragPlane(hit) };
      if (E.controls) E.controls.enabled = false; try { el.setPointerCapture(e.pointerId); } catch (err) { }
    }
  });
  const ctl = E.controls = new THREE.OrbitControls(cam, el);
  ctl.enableDamping = true; ctl.dampingFactor = 0.09; ctl.maxPolarAngle = Math.PI * 0.47; ctl.minDistance = 3; ctl.maxDistance = 34;
  ctl.screenSpacePanning = true; ctl.rotateSpeed = 0.7;
  const resize = () => {
    const w = stage.clientWidth, hh = stage.clientHeight;
    if (!w || !hh) return;
    r.setSize(w, hh, false); cam.aspect = w / hh;
    cam.fov = isMobile() ? clamp(2 * Math.atan(MHF / cam.aspect) * 180 / Math.PI, 38, 72) : 42;
    cam.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage); resize(); E.resize = resize;
  el.addEventListener('pointerup', e => {
    const D = E.drag;
    if (D) {
      E.drag = null; ctl.enabled = true;
      if (D.active) { const pt = planePoint(e, D.plane); if (D.obj.userData.drag.end) D.obj.userData.drag.end(D.obj, pt, e); E.down = null; return; }
    }
    if (!E.down) return; const m = Math.hypot(e.clientX - E.down.x, e.clientY - E.down.y); E.down = null;
    if (m < 7) { const hit = pickAt(e); if (hit && hit.userData.click) { SND.play('click'); hit.userData.click(hit, e); } else if (hit && hit.userData.tip && e.pointerType !== 'mouse') showTapTip(hit, e); else if (E.phase && E.phase.onEmpty) E.phase.onEmpty(); }
  });
  el.addEventListener('pointercancel', () => { if (E.drag) { const D = E.drag; E.drag = null; ctl.enabled = true; if (D.active && D.obj.userData.drag.end) D.obj.userData.drag.end(D.obj, null); } });
  el.addEventListener('pointermove', e => {
    const D = E.drag;
    if (D) {
      if (!D.active && Math.hypot(e.clientX - D.x, e.clientY - D.y) > 6) { D.active = true; SND.play('grab'); if (D.obj.userData.drag.start) D.obj.userData.drag.start(D.obj); }
      if (D.active) { const pt = planePoint(e, D.plane); if (pt && D.obj.userData.drag.move) D.obj.userData.drag.move(D.obj, pt, e); el.style.cursor = 'grabbing'; }
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const hit = pickAt(e);
    el.style.cursor = hit && hit.userData.drag ? 'grab' : hit && hit.userData.click ? 'pointer' : 'default';
    const tip = $('#tip');
    if (hit && hit.userData.tip) {
      const t = typeof hit.userData.tip === 'function' ? hit.userData.tip(hit) : hit.userData.tip;
      if (t) { tip.innerHTML = t; tip.hidden = false; const rc = stage.getBoundingClientRect(); tip.style.left = (e.clientX - rc.left) + 'px'; tip.style.top = (e.clientY - rc.top) + 'px'; }
      else tip.hidden = true;
    } else tip.hidden = true;
    if (E.hover !== hit) { if (E.hover && E.hover.userData.out) E.hover.userData.out(E.hover); if (hit && hit.userData.over) hit.userData.over(hit); E.hover = hit; }
  });
  el.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse') return; $('#tip').hidden = true; if (E.hover && E.hover.userData.out) E.hover.userData.out(E.hover); E.hover = null; });
  // hover halo + guide marker (moved into whichever scene is active)
  E.halo = glowSprite(COL.yellow, 1, 0.5); E.halo.visible = false;
  E.marker = new THREE.Group(); E.marker.visible = false;
  const mm = new THREE.MeshBasicMaterial({ color: COL.yellow, toneMapped: false });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 20), mm); cone.rotation.x = Math.PI; cone.position.y = 0.18; E.marker.add(cone);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 32), mm); ring.rotation.x = Math.PI / 2; ring.position.y = -0.08; E.marker.add(ring); E.markerRing = ring;
  const mg = glowSprite(COL.yellow, 0.9, 0.45); mg.position.y = 0.15; E.marker.add(mg);
  makeGroundTexture(); makeDotTexture();
}
function isDark() { const t = document.documentElement.getAttribute('data-theme'); return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; }
function onTheme() { setTimeout(() => { if (E.renderer) { makeGroundTexture(); for (const P of PHASES) if (P.scene) themeScene(P.scene); } for (const P of PHASES) if (P.root) P.washed = null; if (E.phase && E.phase.onShow) E.phase.onShow(); if (E.phase && E.phase.onTheme) E.phase.onTheme(); if (typeof paperGrain === 'function') paperGrain(); }, 30); }
function themeScene(s) {
  const d = isDark(); const u = s.userData; if (!u.hemi) return;
  u.hemi.intensity = d ? 0.32 : 0.4; u.dir.intensity = d ? 0.78 : 0.82; u.hemi.groundColor.set(d ? 0x1A2848 : 0x9AA8C4);
  if (s.fog) s.fog.color.set(cssVar('--bg') || '#E9EDF1');
  if (u.particles) u.particles.material.opacity = d ? 0.7 : 0.5;
}
function dragPlane(obj) {
  const p = obj.getWorldPosition(new THREE.Vector3()); const d = obj.userData.drag;
  if (d.plane === 'horizontal') return new THREE.Plane(new THREE.Vector3(0, 1, 0), -p.y);
  const n = E.camera.getWorldDirection(new THREE.Vector3()).negate(); if (d.plane === 'upright') { n.y = 0; n.normalize(); }
  return new THREE.Plane().setFromNormalAndCoplanarPoint(n, p);
}
function planePoint(e, plane) {
  const rc = E.renderer.domElement.getBoundingClientRect();
  const v = new THREE.Vector2(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
  E.raycaster.setFromCamera(v, E.camera); const out = new THREE.Vector3();
  return E.raycaster.ray.intersectPlane(plane, out) ? out : null;
}
function pickAt(e) {
  if (!E.scene || !E.scene.userData.picks) return null;
  const rc = E.renderer.domElement.getBoundingClientRect();
  const v = new THREE.Vector2(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
  E.raycaster.setFromCamera(v, E.camera);
  const hits = E.raycaster.intersectObjects(E.scene.userData.picks, true);
  for (const hi of hits) {
    let o = hi.object, ok = true, found = null;
    for (let p = o; p; p = p.parent) { if (!p.visible) { ok = false; break; } if (!found && p.userData.pickable) found = p; }
    if (ok && found) { E.lastHit = hi; return found; }
  }
  return null;
}
function addPick(scene, obj, hd) { Object.assign(obj.userData, hd, { pickable: true }); scene.userData.picks.push(obj); return obj; }
function removePick(scene, obj) { const a = scene.userData.picks; const i = a.indexOf(obj); if (i >= 0) a.splice(i, 1); }
const _box = new THREE.Box3(), _v = new THREE.Vector3(), _s = new THREE.Sphere();
function loop() {
  requestAnimationFrame(loop);
  const raw = E.clock.getDelta(); const dt = Math.min(0.05, raw); E.time += dt;
  for (let i = E.tweens.length - 1; i >= 0; i--) {
    const tw = E.tweens[i]; tw.t += dt; const k = Math.min(1, tw.t / tw.dur);
    try { tw.fn(tw.ease(k)); } catch (err) { console.error(err); }
    if (k >= 1) { E.tweens.splice(i, 1); tw.res(); }
  }
  if (E.phase && E.phase.tick) E.phase.tick(dt, E.time);
  E.guideT -= dt; if (E.guideT <= 0) { E.guideT = 0.3; updateGuide(); }
  const is3d = E.renderer && E.phase && E.phase.kind === '3d';
  if (is3d) {
    if (!E.perfDone && S.started) { E.perfN = (E.perfN || 0) + 1; E.perfAcc = (E.perfAcc || 0) + raw; if (E.perfN >= 90) { E.perfDone = true; if (E.perfAcc / E.perfN > 0.034 && E.renderer.getPixelRatio() > 1) { E.renderer.setPixelRatio(1); E.resize(); } } }
    const sc = E.scene;
    if (sc) {
      const pt = sc.userData.particles; if (pt) { pt.rotation.y += dt * 0.025; pt.position.y = Math.sin(E.time * 0.35) * 0.25; }
      const hv = E.drag && E.drag.active ? E.drag.obj : (E.hover && (E.hover.userData.click || E.hover.userData.drag) ? E.hover : null);
      if (hv) { _box.setFromObject(hv); if (!_box.isEmpty()) { _box.getBoundingSphere(_s); E.halo.position.copy(_s.center); E.halo.scale.setScalar(Math.min(4.5, _s.radius * 2.8 + 0.3)); E.halo.visible = true; E.halo.material.opacity = 0.32 + Math.sin(E.time * 6) * 0.12; } }
      else E.halo.visible = false;
      if (E.marker.visible && E.markerTarget) { placeMarker(); E.markerRing.scale.setScalar(1 + (Math.sin(E.time * 5) * 0.5 + 0.5) * 0.35); }
    }
    E.controls.update();
    if (sc) E.renderer.render(sc, E.camera);
  }
  { const M = E.phase && E.phase.M3; if (M && M.alive) M.render(dt, E.time); }
  place2dGuide();
  updateBalloons(); updateHotspots();
  if (E.phase && E.phase.after) E.phase.after();
}
function updateGuide() {
  const P = E.phase; if (!P) return; let g = null;
  try { g = P.guide ? P.guide() : null; } catch (e) { g = null; }
  const t = g && g.target;
  if (P.kind === '3d' && E.renderer) {
    let ok = !!t && !!(t.isObject3D || t.isVector3);
    if (t && t.isObject3D) for (let p = t; p; p = p.parent) if (!p.visible) { ok = false; break; }
    E.markerTarget = ok ? t : null; E.marker.visible = ok && !(E.drag && E.drag.active); E.g2dTarget = null;
  } else E.g2dTarget = t && t.nodeType === 1 ? t : null;
  setTok((g && g.tip) || P.tip || '');
}
function place2dGuide() {
  const m = $('#g2d'); const t = E.g2dTarget;
  const hide = () => { if (!m.hidden) m.hidden = true; };
  if (!t || !t.isConnected || !E.phase || E.phase.kind === '3d' || document.querySelector('.gcard-wrap,.mapv,.intro:not([hidden])')) return hide();
  const r = t.getBoundingClientRect(); if (!r.width) return hide();
  const rc = $('#stage').getBoundingClientRect(), sc = $('#scene2d').getBoundingClientRect();
  if (r.bottom < sc.top + 8 || r.top > sc.bottom - 8) return hide();
  m.hidden = false; m.style.left = Math.round(r.left + r.width / 2 - rc.left) + 'px'; m.style.top = Math.round(Math.max(sc.top + 36, r.top) - rc.top - 2) + 'px';
}
function placeMarker() {
  const t = E.markerTarget;
  if (t.isVector3) _v.copy(t); else { _box.setFromObject(t); if (_box.isEmpty()) return; _box.getCenter(_v); _v.y = _box.max.y; }
  E.marker.position.set(_v.x, _v.y + 0.45 + Math.abs(Math.sin(E.time * 3.2)) * 0.25, _v.z);
}
function setTok(text) {
  if (TG.sayAt && performance.now() - TG.sayAt < 6000) return; if (!text || text === E.tokText) return; E.tokText = text; TG.hint(text); return;
  const b = $('#tokTip'); b.textContent = text; const mb = $('#mTokTip'); if (mb) { mb.textContent = text; mb.classList.remove('pulse'); void mb.offsetWidth; mb.classList.add('pulse'); } const av = $('#tokAv'); av.classList.remove('talk'); void av.offsetWidth; av.classList.add('talk');
}
function anim(dur, fn, ez = ease.io) {
  if (REDUCED) dur = Math.min(dur, 120);
  return new Promise(res => E.tweens.push({ t: 0, dur: Math.max(1, dur) / 1000, fn, ease: ez, res }));
}
function finishTweens() { for (const tw of E.tweens.splice(0)) { try { tw.fn(1); } catch (e) { } tw.res(); } }
function popIn(obj, dur = 420, delay = 0) { const s0 = obj.scale.clone(); obj.scale.setScalar(0.001); return wait(delay).then(() => anim(dur, k => obj.scale.copy(s0).multiplyScalar(Math.max(0.001, k)), ease.back)); }
function rayDist(pt, c) { const cam = E.camera.position; const dir = pt.clone().sub(cam).normalize(); const v = c.clone().sub(cam); const t = v.dot(dir); return v.sub(dir.multiplyScalar(t)).length(); }
function moveTo(obj, to, dur = 600, ez = ease.io) { const f = obj.position.clone(); const t = new THREE.Vector3(...to); return anim(dur, k => obj.position.lerpVectors(f, t, k), ez); }
function flyTo(pos, target, dur = 900) {
  const c = E.camera, ctl = E.controls; const p0 = c.position.clone(), t0 = ctl.target.clone();
  const t1 = new THREE.Vector3(...target); const a = c.aspect || 1.5; const f = isMobile() ? Math.max(1, MHF / (Math.tan(c.fov * Math.PI / 360) * a)) * 1.02 : (a >= 1.2 ? 1 : clamp(1.2 / a, 1, 2) * 1.1); const p1 = new THREE.Vector3(...pos).sub(t1).multiplyScalar(f).add(t1);
  return anim(dur, k => { c.position.lerpVectors(p0, p1, k); ctl.target.lerpVectors(t0, t1, k); });
}

/* ---------- scene building ---------- */
let groundTex = null, dotTex = null, glowTex = null;
function makeGroundTexture() {
  const N = 1024, T = 64, cv = groundTex ? groundTex.image : document.createElement('canvas');
  cv.width = cv.height = N; const x = cv.getContext('2d');
  const g = cssVar('--ground') || '#DFE4EA', t = cssVar('--tile') || '#C3CFE6';
  x.globalCompositeOperation = 'source-over'; x.fillStyle = g; x.fillRect(0, 0, N, N);
  const rnd = seeded(11);
  for (let i = 0; i < N / T; i++) for (let j = 0; j < N / T; j++) {
    x.save(); x.translate(i * T + T / 2, j * T + T / 2); x.rotate(Math.floor(rnd() * 4) * Math.PI / 2); x.translate(-T / 2, -T / 2);
    x.fillStyle = t; x.globalAlpha = 0.6;
    const kind = rnd();
    if (kind < 0.45) { x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, T * 0.45, 0, Math.PI / 2); x.closePath(); x.fill(); x.beginPath(); x.moveTo(T, T); x.lineTo(T * 0.42, T); x.lineTo(T, T * 0.42); x.closePath(); x.fill(); }
    else if (kind < 0.7) { x.fillRect(0, 0, T / 2, T / 2); }
    else if (kind < 0.85) { x.beginPath(); x.arc(T / 2, T, T * 0.3, Math.PI, 0); x.fill(); }
    x.strokeStyle = t; x.globalAlpha = 0.5; x.lineWidth = 1; x.strokeRect(0.5, 0.5, T - 1, T - 1); x.globalAlpha = 1;
    x.restore();
  }
  x.globalCompositeOperation = 'destination-in';
  const rg = x.createRadialGradient(N / 2, N / 2, N * 0.16, N / 2, N / 2, N / 2);
  rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(0.7, 'rgba(0,0,0,0.55)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = rg; x.fillRect(0, 0, N, N);
  x.globalCompositeOperation = 'source-over';
  if (!groundTex) { groundTex = new THREE.CanvasTexture(cv); groundTex.anisotropy = 8; groundTex.encoding = THREE.sRGBEncoding; }
  groundTex.needsUpdate = true;
}
function makeDotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); dotTex = new THREE.CanvasTexture(c);
}
function glowTexture() {
  if (glowTex) return glowTex; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.22, 'rgba(255,255,255,0.55)'); g.addColorStop(0.55, 'rgba(255,255,255,0.14)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); glowTex = new THREE.CanvasTexture(c); return glowTex;
}
function glowSprite(color, size, opacity = 0.6) {
  const m = new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, depthWrite: false, toneMapped: false });
  const s = new THREE.Sprite(m); s.scale.setScalar(size); s.renderOrder = 1; return s;
}
function ambientParticles(n, R) {
  const g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const pal = [COL.blue, COL.yellow, COL.blueL, COL.green, COL.coral].map(c => new THREE.Color(c)); const rnd = seeded(29);
  for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, r = 2 + rnd() * R; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = 0.4 + rnd() * 7; pos[i * 3 + 2] = Math.sin(a) * r; const c = pal[i % pal.length]; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size: 0.11, map: dotTex, vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false, sizeAttenuation: true });
  return new THREE.Points(g, m);
}
function makeScene(opts = {}) {
  const s = new THREE.Scene(); s.userData.picks = [];
  if (E.env) s.environment = E.env;
  s.fog = new THREE.Fog(cssVar('--bg') || '#E9EDF1', 24, 52);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x9AA8C4, 0.4); s.add(hemi);
  const dir = new THREE.DirectionalLight(0xfff6e8, 0.82); dir.position.set(6, 12, 7); dir.castShadow = true;
  const ms = E.low ? 1024 : 2048; dir.shadow.mapSize.set(ms, ms); const c = dir.shadow.camera; c.left = -14; c.right = 14; c.top = 14; c.bottom = -14; c.near = 1; c.far = 50; dir.shadow.bias = -0.0005; dir.shadow.normalBias = 0.02;
  s.add(dir);
  const rim = new THREE.DirectionalLight(0xB9CBF2, 0.22); rim.position.set(-8, 6, -8); s.add(rim);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(opts.groundR || 16, 72), new THREE.MeshStandardMaterial({ map: groundTex, transparent: true, roughness: 0.92, depthWrite: false, envMapIntensity: 0.2 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; s.add(ground);
  const pts = ambientParticles(E.low ? 70 : 160, 13); s.add(pts); s.userData.particles = pts;
  s.userData.hemi = hemi; s.userData.dir = dir; themeScene(s);
  return s;
}
const geoCache = {};
function rbox(w, hh, d, r = 0.06) {
  const key = [w, hh, d, r].map(v => v.toFixed(3)).join('|'); if (geoCache[key]) return geoCache[key];
  r = Math.min(r, w / 2.2, hh / 2.2, d / 2.2);
  const W = w - 2 * r, H = hh - 2 * r, q = Math.min(r, W / 2, H / 2) * 0.5;
  const s = new THREE.Shape();
  s.moveTo(-W / 2 + q, -H / 2); s.lineTo(W / 2 - q, -H / 2); s.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + q);
  s.lineTo(W / 2, H / 2 - q); s.quadraticCurveTo(W / 2, H / 2, W / 2 - q, H / 2); s.lineTo(-W / 2 + q, H / 2);
  s.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - q); s.lineTo(-W / 2, -H / 2 + q); s.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + q, -H / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: E.low ? 2 : 4, curveSegments: 5 });
  g.center(); geoCache[key] = g; return g;
}
function mat(color, o = {}) {
  const gloss = o.gloss && !E.low; const C = gloss ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
  const m = new C({ color, roughness: o.rough ?? (o.gloss ? 0.36 : 0.55), metalness: o.metal ?? 0.02, transparent: (o.opacity ?? 1) < 1 || !!o.transparent, opacity: o.opacity ?? 1, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1, depthWrite: o.depthWrite ?? true, side: o.side ?? THREE.FrontSide, envMapIntensity: o.env ?? 0.38 });
  if (gloss) { m.clearcoat = 0.7; m.clearcoatRoughness = 0.18; }
  return m;
}
function uiMat(tex, o = {}) { return new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: o.depthWrite ?? true, opacity: o.opacity ?? 1 }); }
function mesh(geo, material, shadow = true) { const m = new THREE.Mesh(geo, material); m.castShadow = shadow; m.receiveShadow = shadow; return m; }
function rr(x, X, Y, W, H, R) { x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R); x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath(); }
function textCanvas(text, o = {}) {
  const sc = 2, fs = (o.size || 28) * sc, family = o.mono ? FONT.mono : o.display ? FONT.display : FONT.body;
  const font = `${o.weight || 700} ${fs}px ${family}`;
  const c = document.createElement('canvas'), x = c.getContext('2d'); x.font = font;
  const lines = String(text).split('\n'), lh = fs * 1.2, px = (o.padX ?? 12) * sc, py = (o.padY ?? 6) * sc;
  const tw = Math.max(1, ...lines.map(l => x.measureText(l).width));
  const shadow = o.bg && o.shadow !== false ? 4 * sc : 0;
  c.width = Math.ceil(Math.max(tw + px * 2, (o.minW || 0) * sc)) + shadow; c.height = Math.ceil(lines.length * lh + py * 2) + shadow;
  x.font = font;
  const W = c.width - shadow, H = c.height - shadow;
  if (o.bg) {
    if (shadow) { x.fillStyle = 'rgba(20,33,58,0.18)'; rr(x, shadow * 0.5, shadow, W, H, (o.radius ?? 9) * sc); x.fill(); }
    x.fillStyle = o.bg; rr(x, 0, 0, W, H, (o.radius ?? 9) * sc); x.fill();
    if (o.border) { x.lineWidth = 2.5 * sc; x.strokeStyle = o.border; rr(x, 1.5 * sc, 1.5 * sc, W - 3 * sc, H - 3 * sc, (o.radius ?? 9) * sc); x.stroke(); }
  }
  x.fillStyle = o.fg || '#14213A'; x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach((l, i) => x.fillText(l, W / 2, py + lh * (i + 0.5) + fs * 0.05));
  return c;
}
function texFrom(c) { const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.anisotropy = 4; t.encoding = THREE.sRGBEncoding; return t; }
const LBL = { bg: '#FFFFFF', fg: '#14213A', border: '#D3DAE3' };
function label(text, o = {}) {
  o = { ...LBL, ...o };
  const c = textCanvas(text, o);
  const m = new THREE.SpriteMaterial({ map: texFrom(c), transparent: true, depthTest: o.depthTest ?? false, depthWrite: false, toneMapped: false, fog: false });
  const s = new THREE.Sprite(m); s.renderOrder = o.order ?? 10;
  const hh = (o.h || 0.3) * LBLK(); s.scale.set(hh * c.width / c.height, hh, 1);
  if (o.center) s.center.set(...o.center);
  s.userData.o = o; s.userData.text = text;
  return s;
}
function setLabel(s, text, o2) {
  const o = { ...s.userData.o, ...(o2 || {}) }; if (s.userData.text === text && !o2) return;
  s.userData.o = o; s.userData.text = text;
  const c = textCanvas(text, o); s.material.map.dispose(); s.material.map = texFrom(c); s.material.needsUpdate = true;
  const hh = (o.h || 0.3) * LBLK(); s.scale.set(hh * c.width / c.height, hh, 1);
}
function faceText(text, w, hh, o = {}) {
  const c = textCanvas(text, { ...o, bg: null, padX: 3, padY: 1 });
  const a = c.width / c.height; let pw = w * (o.fill || 0.86), ph = pw / a; if (ph > hh * (o.hfill || 0.62)) { ph = hh * (o.hfill || 0.62); pw = ph * a; }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: texFrom(c), transparent: true, depthWrite: false, toneMapped: false }));
  m.renderOrder = 2; return m;
}
function setFace(m, text, w, hh, o = {}) {
  const c = textCanvas(text, { ...o, bg: null, padX: 3, padY: 1 }); const a = c.width / c.height;
  let pw = w * (o.fill || 0.86), ph = pw / a; if (ph > hh * (o.hfill || 0.62)) { ph = hh * (o.hfill || 0.62); pw = ph * a; }
  m.material.map.dispose(); m.material.map = texFrom(c); m.material.needsUpdate = true; m.geometry.dispose(); m.geometry = new THREE.PlaneGeometry(pw, ph);
}
function tokenBlock(text, ci = 0, o = {}) {
  const col = typeof ci === 'object' ? ci : TOK[ci % TOK.length];
  const w = o.w || Math.max(0.6, 0.26 + String(text).length * (o.mono ? 0.19 : 0.17));
  const hh = o.h || 0.62, d = o.d || 0.42;
  const g = new THREE.Group();
  const box = mesh(rbox(w, hh, d, Math.min(0.1, hh * 0.18)), mat(col.bg, { gloss: true })); g.add(box);
  const f = faceText(text, w, hh, { fg: col.fg, size: o.size || 30, mono: o.mono }); f.position.z = d / 2 + 0.004; g.add(f);
  Object.assign(g.userData, { w, h: hh, d, box, face: f, text, col });
  return g;
}
function rod(a, b, r, color, o = {}) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const len = A.distanceTo(B);
  const m = mesh(new THREE.CylinderGeometry(r, r, len, 10), mat(color, o), o.shadow ?? false);
  m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return m;
}
function setRod(m, a, b) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const len = Math.max(0.001, A.distanceTo(B));
  m.scale.set(1, len / m.geometry.parameters.height, 1); m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
}
function arrow3(a, b, color, r = 0.035, o = {}) {
  const g = new THREE.Group(); const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const dirv = B.clone().sub(A); const len = dirv.length(); dirv.normalize(); const head = Math.min(0.3, len * 0.35);
  const shaft = rod(a, B.clone().addScaledVector(dirv, -head).toArray(), r, color, o); g.add(shaft);
  const cone = mesh(new THREE.ConeGeometry(r * 3, head, 14), mat(color, o), false);
  cone.position.copy(B).addScaledVector(dirv, -head / 2); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirv); g.add(cone);
  return g;
}
function arcTube(a, b, height, radius, color, opacity = 1) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const M = A.clone().add(B).multiplyScalar(0.5); M.y += height;
  const curve = new THREE.QuadraticBezierCurve3(A, M, B);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, radius, 8, false), mat(color, { opacity, emissive: color, ei: 0.45 }));
  m.userData.curve = curve; return m;
}
function sphere(r, color, o = {}) { return mesh(new THREE.SphereGeometry(r, o.seg || 28, o.seg ? Math.round(o.seg * 0.75) : 20), mat(color, { gloss: true, ...o }), o.shadow ?? true); }
function disposeGroup(g) { g.traverse(o => { if (o.geometry && !Object.values(geoCache).includes(o.geometry)) o.geometry.dispose(); if (o.material) { if (o.material.map && o.material.map !== glowTex && o.material.map !== dotTex && o.material.map !== groundTex) o.material.map.dispose(); o.material.dispose(); } }); }
function clearGroup(g) { for (const c of [...g.children]) { g.remove(c); disposeGroup(c); } }
function weightColor(w, s = 1.6) {
  const t = clamp(Math.abs(w) / s, 0, 1); const base = new THREE.Color(0xE4E8EE);
  return base.lerp(new THREE.Color(w >= 0 ? COL.blue : COL.coral), 0.15 + 0.85 * t);
}
/* a 3x3x3 cube of 27 little cubes: the iconic "matrix" of this game */
function paramCube(size = 0.34, gap = 0.44, weightsFn) {
  const g = new THREE.Group(); g.userData.cells = [];
  for (let d = 0; d < 3; d++) for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const idx = r * 3 + c; const w = weightsFn ? weightsFn(idx, d) : 0;
    const m = mesh(rbox(size, size, size, size * 0.16), mat(weightColor(w), { emissive: 0xF2B400, ei: 0, gloss: true }));
    m.position.set((c - 1) * gap, (d - 1) * gap, (r - 1) * gap);
    m.userData.cell = { idx, d }; g.add(m); g.userData.cells.push(m);
  }
  return g;
}
/* glowing dots that run along a curve (used for flows) */
function flowDots(curve, n, color, size = 0.07) {
  const g = new THREE.Group(); g.userData.curve = curve; g.userData.dots = [];
  for (let i = 0; i < n; i++) { const d = glowSprite(color, size * 4, 0.95); d.userData.t = i / n; g.add(d); g.userData.dots.push(d); }
  return g;
}
function tickFlow(g, dt, speed = 0.5) { for (const d of g.userData.dots) { d.userData.t = (d.userData.t + dt * speed) % 1; g.userData.curve.getPoint(d.userData.t, d.position); } }

/* ---------- progress, UI ---------- */
const SAVE_KEY = 'llm-para-leigos-v3';
const S = { done: {}, points: 0, phase: 0, started: false, sound: true, voice: true, chal: {}, seenC: {} };
function loadState() { try { const j = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (j) Object.assign(S, j); } catch (e) { } }
function saveState() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
function allMissions() { return PHASES.flatMap(p => p.missions); }
function complete(id) {
  if (S.done[id]) return false;
  S.done[id] = true; addXP(100);
  const m = allMissions().find(x => x.id === id);
  toast('Missão concluída: ' + (m ? m.short || m.text : ''), '+100 XP');
  SND.play('ok'); FX.burst(70, 0.5, 0.25, 0.8);
  const hm = $('#hudMission'); if (hm) { hm.classList.remove('bump'); void hm.offsetWidth; hm.classList.add('bump'); }
  const P = PHASES.find(p => p.missions.some(x => x.id === id));
  if (P && P.missions.every(x => S.done[x.id])) setTimeout(() => { toast(`Fase ${P.n} completa!`, '★★★'); SND.play('win'); FX.burst(160, 0.5, 0.25, 1.2); if (E.phase === P) TG.say(`Fase completa! ${LESSONS[P.n] || ''} ` + (PHASES.indexOf(P) < PHASES.length - 1 ? 'Toque em “Próxima fase”.' : '')); HUD.refresh(); }, 1500);
  E.guideT = 0;
  return true;
}
let toastT = 0;
function toast(text, pts) {
  const t = $('#toast'); t.innerHTML = ''; t.append(h('span', null, text)); if (pts) t.append(h('span', { class: 'pts' }, pts));
  t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
}
function refreshScore() { HUD.refresh(); return;
  const all = allMissions(); const d = all.filter(m => S.done[m.id]).length;
  $('#pts').textContent = S.points.toLocaleString('pt-BR') + ' pts'; $('#mcount').textContent = `${d} de ${all.length} missões`;
}
function refreshTrack() { HUD.refresh(); return;
  const tr = $('#track'); tr.innerHTML = '';
  PHASES.forEach((P, i) => {
    const done = P.missions.every(m => S.done[m.id]);
    const b = h('button', { class: 'chip' + (E.phase === P ? ' active' : '') + (done ? ' done' : ''), onclick: () => { SND.play('click'); go(i); }, 'aria-current': E.phase === P ? 'step' : null, title: P.title },
      h('i', { class: 'tile r' + (i % 4), 'aria-hidden': 'true' }), h('span', { class: 'n' }, String(P.n).padStart(2, '0')), h('span', null, P.name));
    tr.append(b);
    if (E.phase === P && !isMobile()) setTimeout(() => b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }), 50);
  });
  if (typeof refreshMobileBits === 'function') refreshMobileBits();
}
function refreshMissions() {
  document.querySelectorAll('.missions li[data-id]').forEach(li => li.classList.toggle('done', !!S.done[li.dataset.id]));
}
function missionBox(P) {
  return h('div', { class: 'sec' }, h('h2', null, 'Missões'),
    h('ol', { class: 'missions' }, P.missions.map(m => h('li', { 'data-id': m.id, class: S.done[m.id] ? 'done' : '' }, h('i', { class: 'ck', 'aria-hidden': 'true' }), h('span', null, m.text)))));
}
function btn(text, cls, onclick, attrs) { return h('button', { class: 'btn ' + (cls || ''), onclick, ...(attrs || {}) }, text); }
function pill(text, on, onclick) { return h('button', { class: 'pill' + (on ? ' on' : ''), onclick, 'aria-pressed': on ? 'true' : 'false' }, text); }
function seg(opts, cur, onChange) {
  const w = h('div', { class: 'seg', role: 'tablist' });
  const draw = c => { w.innerHTML = ''; opts.forEach(([v, t]) => w.append(h('button', { class: v === c ? 'on' : '', role: 'tab', 'aria-selected': v === c ? 'true' : 'false', onclick: () => { draw(v); onChange(v); } }, t))); };
  draw(cur); w.set = draw; return w;
}
let sliderId = 0;
function slider(text, min, max, step, value, fmt, onInput) {
  const id = 'sl' + (++sliderId); const v = h('span', { class: 'v' }, fmt(value));
  const inp = h('input', { type: 'range', id, min, max, step, value });
  inp.addEventListener('input', () => { v.textContent = fmt(+inp.value); onInput(+inp.value); });
  const l = h('label', { class: 'sl', for: id }, h('span', null, text + ' ', v), inp); l.setValue = x => { inp.value = x; v.textContent = fmt(+x); }; return l;
}
function drawChart(cv, series, o = {}) {
  const dpr = Math.min(2, devicePixelRatio || 1); const W = cv.clientWidth || 300, H = cv.clientHeight || 120;
  cv.width = W * dpr; cv.height = H * dpr; const x = cv.getContext('2d'); x.scale(dpr, dpr); x.clearRect(0, 0, W, H);
  const pad = { l: 34, r: 8, t: 8, b: 18 }; const maxY = o.maxY ?? Math.max(1e-6, ...series.flatMap(s => s.data)); const n = Math.max(2, ...series.map(s => s.data.length));
  x.strokeStyle = cssVar('--line'); x.fillStyle = cssVar('--muted'); x.font = `11px ${FONT.mono}`; x.lineWidth = 1;
  const ticks = o.ticks || [0, maxY / 2, maxY];
  for (const tv of ticks) { const y = pad.t + (H - pad.t - pad.b) * (1 - tv / maxY); x.beginPath(); x.moveTo(pad.l, y); x.lineTo(W - pad.r, y); x.stroke(); x.fillText(o.fmt ? o.fmt(tv) : tv.toFixed(1), 2, y + 4); }
  x.fillText(o.xlabel || '', pad.l, H - 4);
  for (const s of series) {
    if (!s.data.length) continue;
    const pts = s.data.map((v, i) => [pad.l + (W - pad.l - pad.r) * (i / (n - 1)), pad.t + (H - pad.t - pad.b) * (1 - clamp(v, 0, maxY) / maxY)]);
    const grd = x.createLinearGradient(0, pad.t, 0, H - pad.b); grd.addColorStop(0, s.color + '44'); grd.addColorStop(1, s.color + '00');
    x.fillStyle = grd; x.beginPath(); x.moveTo(pts[0][0], H - pad.b); pts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(pts[pts.length - 1][0], H - pad.b); x.closePath(); x.fill();
    x.strokeStyle = s.color; x.lineWidth = 2; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke();
    const [X, Y] = pts[pts.length - 1]; x.fillStyle = s.color; x.beginPath(); x.arc(X, Y, 3.4, 0, Math.PI * 2); x.fill();
  }
}
function setCaps(list) { const c = $('#stageCap'); if (!c) return; c.innerHTML = ''; (list || []).forEach(t => c.append(h('span', null, t))); }

/* ---------- phase switching ---------- */
const PHASES = [];
function go(i) {
  i = clamp(i, 0, PHASES.length - 1);
  const old = E.phase;
  if (old) { old.alive = false; if (old.exit) old.exit(); finishTweens(); if (old.M3) { old.M3.dispose(); old.M3 = null; } }
  $('#tip').hidden = true; E.hover = null; E.drag = null;
  const fade = $('#stageFade'); fade.classList.add('on');
  const P = PHASES[i]; S.phase = i; saveState();
  const is3d = P.kind === '3d';
  document.body.classList.toggle('m3d', is3d); document.body.classList.toggle('m2d', !is3d);
  if (is3d) {
    ensure3D(); E.controls.enabled = true; E.lblk = (isMobile() && P.lblkM) || null;
    if (!P.scene) { P.scene = makeScene(P.sceneOpts); P.build(P.scene); }
    E.scene = P.scene;
    P.scene.add(E.halo); P.scene.add(E.marker); E.marker.visible = false; E.halo.visible = false;
    const [pos, tgt] = (isMobile() && P.mview) || P.view; E.controls.target.set(...tgt); E.camera.position.set(pos[0] * 1.3, pos[1] * 1.25, pos[2] * 1.3); flyTo(pos, tgt, 1100);
  } else {
    E.scene = null; E.lblk = null;
    if (!P.root) { P.root = h('section', { class: 'ch', 'aria-label': `Fase ${P.n}: ${P.name}` }); $('#scene2d').append(P.root); P.build2d(P.root); }
    document.querySelectorAll('#scene2d .ch.on').forEach(el => el.classList.remove('on'));
    P.root.classList.add('on');
  }
  E.phase = P; P.alive = true; P.tk = (P.tk || 0) + 1;
  clearBalloons(); const mp = $('#missPop'); if (mp) mp.remove(); TG.hintText = ''; E.tokText = ''; TG.sayAt = 0; E.g2dTarget = null;
  if (P.enter) P.enter();
  if (!is3d && P.onShow) requestAnimationFrame(() => P.onShow());
  if (!is3d && P.m3host && P.m3build) requestAnimationFrame(() => { if (E.phase !== P || P.M3) return; P.M3 = mini3d(P.m3host, P.m3opts || {}); if (P.M3) { P.m3build(P.M3); if (P.sync3d) P.sync3d(); } else { P.no3d = true; if (P.render) P.render(); HUD.refresh(); } });
  HUD.render(P);
  E.guideT = 0;
  { const ob = document.querySelector('.brief'); if (ob) ob.remove(); }
  if (S.started) setTimeout(() => { if (E.phase === P) openBriefing(P, { auto: true, onClose: () => startPhaseTalk(P) }); }, 420); else E.pendingBrief = P;
  requestAnimationFrame(() => requestAnimationFrame(() => fade.classList.remove('on')));
  if (old && old !== P) SND.play('whoosh');
}
function live(P) { const tk = P.tk; return () => P.alive && P.tk === tk; }

/* mostra, sem o jogador precisar rolar, o resultado novo que apareceu abaixo da dobra */
function watchReveal() {
  const root = $('#scene2d'); let pend = null, tm = 0; const SEL = '.reveal, .rise.sheet, .rise.note, .ans, .pc-sol';
  new MutationObserver(ms => {
    for (const m of ms) for (const n of m.addedNodes) { if (n.nodeType !== 1) continue; const t = n.matches(SEL) ? n : n.querySelector(SEL); if (t) pend = t; }
    if (!pend) return; clearTimeout(tm); tm = setTimeout(() => { const el = pend; pend = null; if (!el || !el.isConnected) return; const sc = el.closest('.ch-in'); if (!sc) return;
      const r = el.getBoundingClientRect(), R = sc.getBoundingClientRect(); if (r.bottom > R.bottom - 4) sc.scrollBy({ top: Math.max(0, Math.min(r.bottom - R.bottom + 12, r.top - R.top - 8)), behavior: REDUCED ? 'auto' : 'smooth' }); }, 420);
  }).observe(root, { childList: true, subtree: true });
}

const LESSONS = { 1: 'Você viu que uma LLM escreve a resposta adivinhando uma palavra de cada vez.', 2: 'Cada peça das LLMs nasceu de um problema difícil, e a ELIZA mostrou que regras fixas não bastam.', 3: 'Contar o que vem depois de cada palavra já prevê a próxima, mas olhar só a última palavra não basta.', 4: 'Antes de tudo, o texto vira pedaços, os tokens, e cada pedaço vira um número.', 5: 'Uma matriz é uma tabela de pesos: cada resposta soma os pesos das pistas e a que tem mais votos vence.', 6: 'Treinar é mostrar exemplos, medir o erro e ajustar os pesos um pouquinho, muitas e muitas vezes.', 7: 'Cada palavra ganha um endereço feito de números, e palavras de sentido parecido moram perto.', 8: 'Com a atenção, cada palavra olha a frase inteira e decide quais outras importam.', 9: 'O prompt muda a resposta sem mexer nos pesos. O fine-tuning muda os pesos, com efeitos colaterais.', 10: 'Com RAG, a LLM busca trechos numa biblioteca e responde citando a fonte, sem mudar nenhum peso.', 11: 'Você juntou tudo numa LLM sua: dados, tokens, treino e as etapas de cada resposta.', 12: 'Agora você sabe explicar como uma IA chega a “Brasília”!' };
