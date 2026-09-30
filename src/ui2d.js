/* ============ Pintura 2D: papel, aquarela, ícones e peças de interface ============ */
const SVGNS = 'http://www.w3.org/2000/svg';
function sv(tag, attrs = {}, ...kids) { const el = document.createElementNS(SVGNS, tag); for (const k in attrs) if (attrs[k] != null) el.setAttribute(k, attrs[k]); kids.flat().forEach(c => c != null && el.append(c)); return el; }
function paperGrain() {
  try {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const r = seeded(11);
    const img = x.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) { const v = 212 + Math.floor(r() * 43); img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v - 4; img.data[i + 3] = 255; }
    x.putImageData(img, 0, 0);
    x.strokeStyle = 'rgba(120,110,90,.10)'; x.lineWidth = 0.7;
    for (let i = 0; i < 70; i++) { const a = r() * 6.28, l = 6 + r() * 16, px = r() * 256, py = r() * 256; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * 0.5 + (r() - 0.5) * 6, py + Math.sin(a) * l * 0.5 + (r() - 0.5) * 6, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
    document.documentElement.style.setProperty('--grain', `url(${c.toDataURL('image/png')})`);
  } catch (e) { }
}
const WASH = { anil: [47, 85, 168], ipe: [239, 174, 34], mata: [43, 138, 112], urucum: [207, 86, 54], jaca: [123, 95, 174] };
function paintWash(cv, blobs, seed = 1) {
  const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return false;
  cv.width = Math.round(W); cv.height = Math.round(H);
  const x = cv.getContext('2d'); x.clearRect(0, 0, W, H); const r = seeded(seed * 97 + 13); const M = Math.max(W, H);
  const deform = (p, amt) => { const out = []; for (let i = 0; i < p.length; i++) { const a = p[i], c = p[(i + 1) % p.length]; out.push(a); out.push([(a[0] + c[0]) / 2 + (r() - 0.5) * amt, (a[1] + c[1]) / 2 + (r() - 0.5) * amt]); } return out; };
  const path = poly => { x.beginPath(); poly.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.closePath(); };
  for (const b of blobs) {
    const [cr, cg, cb] = WASH[b.c]; const cx = b.x * W, cy = b.y * H, R = b.r * M * 0.5;
    const pts = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const rr = R * (0.72 + r() * 0.5); pts.push([cx + Math.cos(a) * rr * (b.sx || 1), cy + Math.sin(a) * rr * (b.sy || 1)]); }
    const base = deform(deform(pts, R * 0.45), R * 0.22);
    for (let L = 0; L < 14; L++) { path(deform(base.map(([px, py]) => [px + (r() - 0.5) * R * 0.2, py + (r() - 0.5) * R * 0.2]), R * 0.12)); x.fillStyle = `rgba(${cr},${cg},${cb},${b.a || 0.045})`; x.fill(); }
    path(base); x.lineWidth = 2.2; x.strokeStyle = `rgba(${cr},${cg},${cb},.13)`; x.stroke();
  }
  for (let i = 0; i < 26; i++) { const b = blobs[i % blobs.length]; const [cr, cg, cb] = WASH[b.c]; x.fillStyle = `rgba(${cr},${cg},${cb},.2)`; x.beginPath(); x.arc(r() * W, r() * H, 0.8 + r() * 2.6, 0, 7); x.fill(); }
  return true;
}
/* cria a cena pintada de uma fase 2D e devolve o miolo onde o conteúdo entra */
function scene2d(P, root, blobs, o = {}) {
  const cv = h('canvas', { class: 'wash', 'aria-hidden': 'true' }); const inner = h('div', { class: 'ch-in' + (o.mid ? ' mid' : '') });
  root.append(cv, inner);
  P.onShow = () => { const key = cv.clientWidth + 'x' + cv.clientHeight; if (P.washed === key) return; if (paintWash(cv, blobs, P.n || 1)) P.washed = key; };
  return inner;
}

/* ---------- ícones pintados: mancha de aquarela deslocada + traço de nanquim ---------- */
const ICON = {
  chat: { f: '<path d="M8 10h30a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H20l-8 7v-7H8a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z"/>', s: '<path d="M8 10h30a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H20l-8 7v-7H8a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z"/><path d="M13 18h20M13 24h13"/>' },
  globe: { f: '<circle cx="24" cy="24" r="15"/>', s: '<circle cx="24" cy="24" r="15"/><ellipse cx="24" cy="24" rx="6" ry="15"/><path d="M9 24h30M12 16h24M12 32h24"/>' },
  summary: { f: '<rect x="11" y="7" width="24" height="33" rx="3"/>', s: '<rect x="11" y="7" width="24" height="33" rx="3"/><path d="M16 15h14M16 21h14M16 27h8"/><path d="M29 33l4 4 7-9" stroke-width="3"/>' },
  feather: { f: '<path d="M38 7C24 10 14 22 12 40c9-9 20-15 27-32z"/>', s: '<path d="M38 7C24 10 14 22 12 40c9-9 20-15 27-32z"/><path d="M12 40l15-17M20 30l6 1M24 24l6 0"/>' },
  code: { f: '<rect x="6" y="10" width="36" height="28" rx="4"/>', s: '<path d="M18 15l-8 9 8 9M30 15l8 9-8 9M27 12l-6 24"/>' },
  bulb: { f: '<circle cx="24" cy="19" r="11"/>', s: '<path d="M17 27c-3-3-4-5-4-8a11 11 0 0 1 22 0c0 3-1 5-4 8-1 1-1 3-1 5H18c0-2 0-4-1-5z"/><path d="M19 36h10M20 40h8M24 13v4M20 19h8"/>' },
  rods: { f: '<rect x="7" y="9" width="34" height="30" rx="3"/>', s: '<rect x="7" y="9" width="34" height="30" rx="3"/><path d="M15 14v8M15 26v8M24 14v5M24 23v11M33 14v11M33 29v5M12 18h6M21 29h6M30 20h6"/>' },
  orbit: { f: '<circle cx="24" cy="24" r="7"/>', s: '<circle cx="24" cy="24" r="6"/><ellipse cx="24" cy="24" rx="19" ry="9" transform="rotate(-20 24 24)"/><circle class="inkf" cx="40" cy="17" r="2.6"/>' },
  matrix: { f: '<rect x="11" y="10" width="26" height="28" rx="2"/>', s: '<path d="M14 9H9v30h5M34 9h5v30h-5"/><circle class="inkf" cx="17" cy="17" r="2"/><circle class="inkf" cx="24" cy="17" r="2"/><circle class="inkf" cx="31" cy="17" r="2"/><circle class="inkf" cx="17" cy="24" r="2"/><circle class="inkf" cx="24" cy="24" r="2"/><circle class="inkf" cx="31" cy="24" r="2"/><circle class="inkf" cx="17" cy="31" r="2"/><circle class="inkf" cx="24" cy="31" r="2"/><circle class="inkf" cx="31" cy="31" r="2"/>' },
  chain: { f: '<circle cx="12" cy="30" r="7"/><circle cx="36" cy="18" r="7"/>', s: '<circle cx="12" cy="30" r="7"/><circle cx="36" cy="18" r="7"/><path d="M19 27c5-4 8-6 10-7M25 17l4 3-3 4"/><path d="M10 32l2-5 2 5M33 16h5"/>' },
  neuron: { f: '<circle cx="21" cy="24" r="8"/>', s: '<circle cx="21" cy="24" r="7"/><path d="M14 20L6 13M14 24H5M15 29l-8 6M28 24h14M38 20l4 4-4 4"/>' },
  wave: { f: '<path d="M4 30c6-14 10-14 14 0s9 14 14 0 8-12 12-4v10H4z"/>', s: '<path d="M4 26c6-14 10-14 14 0s9 14 14 0 8-12 12-4"/><circle class="inkf" cx="11" cy="16" r="2"/><circle class="inkf" cx="25" cy="34" r="2"/><circle class="inkf" cx="38" cy="20" r="2"/>' },
  head: { f: '<rect x="10" y="12" width="26" height="24" rx="7"/>', s: '<rect x="10" y="12" width="26" height="24" rx="7"/><circle cx="18" cy="23" r="2.5"/><circle cx="28" cy="23" r="2.5"/><path d="M18 30h10M23 12V7"/><path d="M37 8c3-3 8 0 5 4-2 2-3 2-3 5M39 21v1"/>' },
  perceptron: { f: '<circle cx="30" cy="24" r="8"/>', s: '<circle class="inkf" cx="8" cy="12" r="3"/><circle class="inkf" cx="8" cy="24" r="3"/><circle class="inkf" cx="8" cy="36" r="3"/><path d="M11 12l12 8M11 24h11M11 36l12-8"/><circle cx="30" cy="24" r="7"/><path d="M37 24h8M41 20l4 4-4 4"/>' },
  terminal: { f: '<rect x="6" y="9" width="36" height="25" rx="3"/>', s: '<rect x="6" y="9" width="36" height="25" rx="3"/><path d="M12 17l5 4-5 4M20 27h9M18 34l-2 6h16l-2-6"/>' },
  backprop: { f: '<rect x="6" y="10" width="36" height="24" rx="6"/>', s: '<circle class="inkf" cx="10" cy="16" r="2.5"/><circle class="inkf" cx="10" cy="28" r="2.5"/><circle class="inkf" cx="24" cy="12" r="2.5"/><circle class="inkf" cx="24" cy="22" r="2.5"/><circle class="inkf" cx="24" cy="32" r="2.5"/><circle class="inkf" cx="38" cy="22" r="2.5"/><path d="M12 16l10-4M12 16l10 6M12 28l10-6M12 28l10 4M26 12l10 10M26 32l10-10"/><path d="M38 38C30 44 16 44 10 38M13 35l-3 3 4 2"/>' },
  scissors: { f: '<circle cx="13" cy="33" r="6"/><circle cx="13" cy="15" r="6"/>', s: '<circle cx="13" cy="33" r="5.5"/><circle cx="13" cy="15" r="5.5"/><path d="M18 18l22 16M18 30l22-16"/><path d="M30 8v4M34 8v4" stroke-dasharray="1 3"/>' },
  chip: { f: '<rect x="12" y="12" width="24" height="24" rx="3"/>', s: '<rect x="12" y="12" width="24" height="24" rx="3"/><rect x="18" y="18" width="12" height="12" rx="1"/><path d="M17 12V6M24 12V6M31 12V6M17 42v-6M24 42v-6M31 42v-6M12 17H6M12 24H6M12 31H6M42 17h-6M42 24h-6M42 31h-6"/>' },
  vectors: { f: '<path d="M8 40L22 12 40 24z"/>', s: '<path d="M8 40V8M8 40h32"/><path d="M8 40L22 14M18 16l4-2 1 4M8 40l28-12M32 26l4 2-2 4"/><circle class="inkf" cx="22" cy="14" r="2"/><circle class="inkf" cx="36" cy="28" r="2"/>' },
  spot: { f: '<path d="M16 14l18 26H6z"/>', s: '<path d="M13 8h10l-2 7h-6z"/><path d="M15 15L5 40M21 15l13 25"/><path d="M5 40h29"/><circle class="inkf" cx="40" cy="12" r="2"/><path d="M36 8l-3-3M42 18l3 2"/>' },
  spark: { f: '<path d="M6 12h28a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H18l-7 6v-6H6a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z"/>', s: '<path d="M6 12h28a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H18l-7 6v-6H6a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z"/><path d="M40 4l1.6 4.4L46 10l-4.4 1.6L40 16l-1.6-4.4L34 10l4.4-1.6z"/><path d="M10 20h18M10 25h11"/>' },
  book: { f: '<path d="M6 11c6-2 12-2 18 2v25c-6-4-12-4-18-2z"/>', s: '<path d="M6 11c6-2 12-2 18 2v25c-6-4-12-4-18-2zM42 11c-6-2-12-2-18 2v25c6-4 12-4 18-2z"/>' },
  scale: { f: '<circle cx="24" cy="24" r="16"/>', s: '<path d="M24 8v32M12 40h24M10 14h28M10 14l-6 12h12zM38 14l-6 12h12z"/>' },
  trophy: { f: '<path d="M14 8h20v10a10 10 0 0 1-20 0z"/>', s: '<path d="M14 8h20v10a10 10 0 0 1-20 0zM14 12H8c0 6 3 9 7 9M34 12h6c0 6-3 9-7 9M24 28v6M16 40h16l-2-6H18z"/>' }
};
function ico(name, color = 'ipe') {
  const d = ICON[name]; if (!d) return '';
  return `<svg class="ico" viewBox="0 0 48 48" aria-hidden="true"><g style="fill:var(--${color})" class="fillw" filter="url(#bleed)" transform="translate(1.8 2)">${d.f}</g><g class="ink" filter="url(#rough)">${d.s}</g></svg>`;
}
const icoEl = (name, color) => { const t = document.createElement('template'); t.innerHTML = ico(name, color).trim(); return t.content.firstChild; };

/* ---------- barras horizontais ---------- */
function mkBars() {
  const el = h('div', { class: 'hbars' }); const rows = new Map();
  return {
    el,
    set(items) {
      const keep = new Set(items.map(it => it.t));
      for (const [k, r] of rows) if (!keep.has(k)) { r.row.remove(); rows.delete(k); }
      items.forEach((it, i) => {
        let r = rows.get(it.t);
        if (!r) { const fl = h('i', { class: 'fl' }); const pc = h('span', { class: 'pc' }); const lb = h('span', null, it.t); const row = h('div', { class: 'hb' }, lb, h('span', { class: 'tr2' }, fl), pc); r = { row, fl, pc, lb }; rows.set(it.t, r); }
        el.append(r.row);
        r.row.className = 'hb' + (it.cls ? ' ' + it.cls : '');
        r.pc.textContent = it.label != null ? it.label : fmtPct(it.p, it.p < 0.1 ? 1 : 0);
        const w = Math.max(1, Math.round(it.p * 100)) + '%'; requestAnimationFrame(() => { r.fl.style.width = w; });
      });
    }
  };
}

/* ---------- janela de conversa com texto aparecendo token por token ---------- */
function mkChat(title) {
  const body = h('div', { class: 'chat-body', 'aria-live': 'polite' });
  const el = h('div', { class: 'sheet chatw tl' }, h('div', { class: 'chat-h' }, h('span', { class: 'dot3' }, h('i'), h('i'), h('i')), h('span', { class: 'hand', style: 'font-size:18px' }, title)), body);
  let tk = 0;
  const api = {
    el, body,
    clear() { tk++; body.innerHTML = ''; },
    user(text) { const m = h('div', { class: 'msg user' }, text); body.append(m); body.scrollTop = body.scrollHeight; return m; },
    note(text) { const m = h('div', { class: 'note', style: 'font-size:16px' }, text); body.append(m); body.scrollTop = body.scrollHeight; return m; },
    async bot(text, o = {}) {
      const my = ++tk; const m = h('div', { class: 'msg bot' + (o.code ? ' code' : '') }); body.append(m);
      const cur = h('span', { class: 'cursor' }); m.append(cur); await wait(o.think ?? 450); if (my !== tk) return m;
      const parts = text.match(/\s+|[^\s]+/g) || [];
      for (const p of parts) {
        if (my !== tk) return m;
        if (/^\s+$/.test(p)) { cur.before(document.createTextNode(p)); continue; }
        cur.before(h('span', { class: 'tkin' }, p)); body.scrollTop = body.scrollHeight; if (o.onTok) o.onTok(p);
        if (!REDUCED) await wait(o.speed ?? 55);
      }
      cur.remove(); return m;
    },
    stream() { const m = h('div', { class: 'msg bot' }, h('span', { class: 'cursor' })); body.append(m); body.scrollTop = body.scrollHeight; return { set(t) { m.textContent = t; body.scrollTop = body.scrollHeight; }, el: m }; }
  };
  return api;
}

/* ---------- roleta pintada ---------- */
const WHEEL_COLS = ['--ipe', '--anil', '--mata', '--urucum', '--jaca', '--anil-soft', '--ipe-soft', '--mata-soft'];
function mkWheel() {
  const cv = h('canvas', { class: 'wheel', width: 380, height: 380, 'aria-label': 'Roleta das probabilidades' });
  const api = {
    el: cv, rot: 0, items: [],
    draw(items, hi) {
      this.items = items; const x = cv.getContext('2d'); const W = 380, R = 172, c = W / 2; x.clearRect(0, 0, W, W);
      const ink = cssVar('--ink') || '#23304D'; let a = this.rot - Math.PI / 2;
      items.forEach((it, i) => {
        const da = it.p * Math.PI * 2; x.beginPath(); x.moveTo(c, c); x.arc(c, c, R, a, a + da); x.closePath();
        x.fillStyle = cssVar(WHEEL_COLS[i % WHEEL_COLS.length]) || '#EFAE22'; x.globalAlpha = hi != null && hi !== i ? 0.45 : 0.92; x.fill(); x.globalAlpha = 1;
        x.lineWidth = 3; x.strokeStyle = ink; x.stroke();
        if (it.p > 0.055) { const m = a + da / 2; x.save(); x.translate(c + Math.cos(m) * R * 0.62, c + Math.sin(m) * R * 0.62); x.rotate(m + (Math.cos(m) < 0 ? Math.PI : 0)); x.fillStyle = ink; x.font = `700 ${it.p > 0.18 ? 26 : 20}px ${FONT.body}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(it.t, 0, 0); x.restore(); }
        a += da;
      });
      x.beginPath(); x.arc(c, c, R, 0, 7); x.lineWidth = 5; x.strokeStyle = ink; x.stroke();
      x.beginPath(); x.arc(c, c, 14, 0, 7); x.fillStyle = ink; x.fill();
      x.beginPath(); x.moveTo(c - 16, 2); x.lineTo(c + 16, 2); x.lineTo(c, 34); x.closePath(); x.fillStyle = cssVar('--urucum') || '#CF5636'; x.fill(); x.lineWidth = 3; x.strokeStyle = ink; x.stroke();
    },
    async spin(items, idx, dur = 1600) {
      // gira até a fatia idx ficar embaixo do ponteiro (no topo)
      let acc = 0; for (let i = 0; i < idx; i++) acc += items[i].p; const mid = (acc + items[idx].p * (0.25 + Math.random() * 0.5)) * Math.PI * 2;
      const TAU = Math.PI * 2, r0 = this.rot, turns = TAU * (3 + Math.floor(Math.random() * 2));
      const r1 = -mid + Math.ceil((r0 + turns + mid) / TAU) * TAU;
      let last = -1;
      await anim(REDUCED ? 120 : dur, k => { this.rot = lerp(r0, r1, k); this.draw(items); const tick = Math.floor(this.rot / 0.35); if (tick !== last) { last = tick; if (k < 0.95) SND.play('tick'); } }, ease.out);
      this.rot = r1; this.draw(items, idx);
    }
  };
  return api;
}
function sampleIdx(items) { let u = Math.random(); for (let i = 0; i < items.length; i++) { if (u < items[i].p) return i; u -= items[i].p; } return items.length - 1; }
function chipTok(t, cls = 'c0', o = {}) { return h(o.tag || 'span', { class: 'tk ' + cls + (o.extra ? ' ' + o.extra : ''), ...(o.attrs || {}) }, t); }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
/* itens da barra de ações */
const chip = (label, on, click, ok) => ({ t: 'chip', label, on, click, ok });
const abtn = (label, click, o = {}) => ({ t: 'btn', label, click, ...o });
