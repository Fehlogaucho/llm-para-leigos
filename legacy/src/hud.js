/* ============ v2: HUD, balões, pontos de informação, voz e gamificação ============ */
const SPEAK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const BOLT_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor"/></svg>';

/* ---------- voz ---------- */
const VOICE = {
  ok: 'speechSynthesis' in window, voice: null,
  pick() { if (!this.ok) return; const vs = speechSynthesis.getVoices(); this.voice = vs.find(v => /pt[-_]BR/i.test(v.lang) && /Google|Luciana|Francisca|Thalita|Maria|Natural|Neural/i.test(v.name)) || vs.find(v => /pt[-_]BR/i.test(v.lang)) || vs.find(v => /^pt/i.test(v.lang)) || null; },
  clean(t) { return String(t).replace(/<[^>]+>/g, ' ').replace(/[“”"«»]/g, '').replace(/→/g, ', vira ').replace(/×/g, ' vezes ').replace(/·/g, ',').replace(/\s+/g, ' ').trim(); },
  say(t, onend) {
    if (!this.ok || S.voice === false || !S.started) { if (onend) onend(); return; }
    try {
      speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(this.clean(t)); u.lang = 'pt-BR'; if (this.voice) u.voice = this.voice; u.rate = 1.04; u.pitch = 1.12;
      const av = $('#tokAv'); u.onstart = () => av && av.classList.add('speaking'); u.onend = u.onerror = () => { av && av.classList.remove('speaking'); if (onend) onend(); };
      speechSynthesis.speak(u);
    } catch (e) { if (onend) onend(); }
  },
  stop() { try { if (this.ok) speechSynthesis.cancel(); } catch (e) { } const av = $('#tokAv'); if (av) av.classList.remove('speaking'); }
};
if (VOICE.ok) { VOICE.pick(); speechSynthesis.onvoiceschanged = () => VOICE.pick(); }

/* ---------- Tok: diálogo e dicas ---------- */
const TG = {
  queue: [], dialog: false, hintText: '', done: null,
  talk(lines, done) { this.queue = lines.slice(); this.done = done || null; this.dialog = true; this.next(); },
  next() {
    const l = this.queue.shift();
    if (l == null) { this.dialog = false; const d = this.done; this.done = null; this.render(this.hintText, false); VOICE.stop(); if (d) d(); return; }
    this.render(l, true, this.queue.length); VOICE.say(l); SND.play('pop');
  },
  skip() { this.queue = []; this.next(); },
  hint(t) { if (!t || t === this.hintText) return; this.hintText = t; if (!this.dialog) this.render(t, false); },
  /* fala curta, sem precisar tocar para continuar */
  say(t) { if (!t) return; if (this.dialog) { this.queue = []; this.dialog = false; this.done = null; } this.hintText = t; this.sayAt = performance.now(); E.tokText = ''; this.render(t, false); VOICE.say(t); SND.play('pop'); },
  render(text, dialog, left) {
    const box = $('#tokBox'); box.classList.toggle('dialog', dialog); box.classList.remove('hidden-say');
    $('#tokText').textContent = text; const foot = $('#tokFoot'); foot.innerHTML = '';
    if (dialog) foot.append(h('span', null, left ? 'Toque para continuar ▸' : 'Toque para começar ▸'), left ? h('button', { class: 'skip', onclick: e => { e.stopPropagation(); this.skip(); } }, 'Pular') : '');
    const s = $('#tokSay'); s.style.animation = 'none'; void s.offsetWidth; s.style.animation = '';
    const av = $('#tokAv'); av.classList.remove('talk'); void av.offsetWidth; av.classList.add('talk');
  }
};

/* ---------- balões presos a objetos 3D ---------- */
const BAL = new Map();
const _bv = new THREE.Vector3(), _bb = new THREE.Box3();
/* posição na tela (px, relativa ao palco) de uma âncora 3D ou de um elemento da página */
function anchorXY(a, yOff = 0) {
  if (typeof a === 'function') a = a();
  if (!a) return null;
  const rc = $('#stage').getBoundingClientRect();
  if (a.m3) { const M = a.m3; if (!M.alive || !M.host.isConnected || !M.w) return null; const v = a.obj.getWorldPosition(_bv); if (a.off) { v.x += a.off[0]; v.y += a.off[1]; v.z += a.off[2]; } const p = M.project(v); const hr = M.host.getBoundingClientRect(); const sc = $('#scene2d').getBoundingClientRect(); const y = hr.top + p.y; if (y < sc.top || y > sc.bottom) return null; return { x: hr.left + p.x - rc.left, y: y - rc.top - 4, el: true }; }
  if (a.nodeType === 1) {
    if (!a.isConnected) return null; const r = a.getBoundingClientRect(); if (!r.width && !r.height) return null;
    const sc = $('#scene2d').getBoundingClientRect(); if (r.bottom < sc.top || r.top > sc.bottom) return null;
    return { x: r.left + r.width / 2 - rc.left, y: Math.max(r.top, sc.top) - rc.top - 2, el: true };
  }
  if (!E.camera || !E.phase || E.phase.kind !== '3d') return null;
  const p = anchorPoint(a, _bv, yOff); if (!p) return null; p.project(E.camera); if (p.z > 1) return null;
  return { x: (p.x + 1) / 2 * rc.width, y: (1 - p.y) / 2 * rc.height, px: p.x, py: p.y };
}
function anchorPoint(a, out, yOff = 0) {
  if (!a) return null;
  if (typeof a === 'function') a = a();
  if (!a) return null;
  if (a.isVector3) out.copy(a);
  else if (Array.isArray(a)) out.set(a[0], a[1], a[2]);
  else if (a.isObject3D) { for (let p = a; p; p = p.parent) if (!p.visible) return null; _bb.setFromObject(a); if (_bb.isEmpty()) return null; _bb.getCenter(out); out.y = _bb.max.y; }
  out.y += yOff; return out;
}
function balloon(id, anchor, html, o = {}) {
  unballoon(id);
  const el = h('div', { class: 'balloon ' + (o.kind || '') + (o.wide ? ' wide' : '') + (o.close !== false ? ' hasx' : ''), role: 'status' });
  const body = h('div', { class: 'bbody' }); el.append(body);
  if (typeof html === 'string') body.innerHTML = html; else body.append(html);
  if (o.close !== false) el.append(h('button', { class: 'bx', 'aria-label': 'Fechar balão', title: 'Fechar', onclick: e => { e.stopPropagation(); unballoon(id); }, html: X_SVG2 }));
  if (o.onTap) el.addEventListener('click', o.onTap);
  $('#balLayer').append(el);
  const keep = o.kind === 'ok' || o.kind === 'quest'; const fb = keep || o.kind === 'bad';
  if (fb) for (const [k, b] of [...BAL]) if (b.fb && k !== id) unballoon(k);
  BAL.set(id, { el, anchor, fb, yOff: o.yOff ?? 0.25, until: o.ttl && !keep ? performance.now() + Math.max(o.ttl, 8000) : 0 });
  if (o.say) VOICE.say(o.say === true ? body.textContent : o.say);
  return el;
}
function unballoon(id) { const b = BAL.get(id); if (b) { b.el.remove(); BAL.delete(id); } }
function clearBalloons() { for (const id of [...BAL.keys()]) unballoon(id); }
function updateBalloons() {
  if (!BAL.size) return; const rc = $('#stage').getBoundingClientRect(); const now = performance.now();
  for (const [id, b] of BAL) {
    if (b.until && now > b.until) { unballoon(id); continue; }
    const q = anchorXY(b.anchor, b.yOff);
    if (!q) { b.el.classList.add('off'); continue; }
    b.el.classList.remove('off');
    const w = b.el.offsetWidth || 200; let x = q.x, y = q.y;
    x = clamp(x, w / 2 + 6, rc.width - w / 2 - 6); y = clamp(y, (b.el.offsetHeight || 60) + 112, rc.height - 10);
    b.el.style.left = x + 'px'; b.el.style.top = y + 'px';
  }
}

/* ---------- pontos de informação (conceitos) ---------- */
let HS = [];
function buildHotspots(P) {
  clearHotspots(); if (!P.hs) return;
  for (const [key, anchor, off] of P.hs.call(P)) {
    const el = h('button', { class: 'hs' + (S.seenC && S.seenC[key] ? ' seen' : ''), 'aria-label': `O que é ${CNAME[key] || key}?` }, h('i', null, '?'), CNAME[key] || key);
    el.addEventListener('click', e => { e.stopPropagation(); openConceptBalloon(key, anchor, off); el.classList.add('seen'); });
    $('#hsLayer').append(el); HS.push({ el, anchor, off: off || [0, 0, 0], key });
  }
}
function clearHotspots() { HS.forEach(x => x.el.remove()); HS = []; }
function updateHotspots() {
  if (!HS.length) return; const rc = $('#stage').getBoundingClientRect();
  for (const hs of HS) {
    let x, y;
    const a0 = typeof hs.anchor === 'function' ? hs.anchor() : hs.anchor;
    if (a0 && a0.nodeType === 1) {
      const q = anchorXY(a0); if (!q) { hs.el.classList.add('off'); continue; }
      const r = a0.getBoundingClientRect(); const w = hs.el.offsetWidth || 100; const scr = $('#scene2d').getBoundingClientRect(); if (E.phase && E.phase.kind !== '3d' && r.top < scr.top - 2) { hs.el.classList.add('off'); continue; }
      x = (r.width > w + 60 ? r.right - rc.left - w / 2 + 2 : q.x) + (hs.off[0] || 0); y = q.y - 4 + (hs.off[1] || 0);
    }
    else {
      if (!E.camera || !E.phase || E.phase.kind !== '3d') { hs.el.classList.add('off'); continue; }
      const p = anchorPoint(a0, _bv, 0);
      if (!p) { hs.el.classList.add('off'); continue; }
      p.x += hs.off[0]; p.y += hs.off[1]; p.z += hs.off[2]; p.project(E.camera);
      if (p.z > 1 || p.x < -1.1 || p.x > 1.1 || p.y < -1.1 || p.y > 1.1) { hs.el.classList.add('off'); continue; }
      x = (p.x + 1) / 2 * rc.width; y = (1 - p.y) / 2 * rc.height;
    }
    hs.el.classList.remove('off');
    hs.el.style.left = clamp(x, 50, rc.width - 50) + 'px'; hs.el.style.top = clamp(y, 110, rc.height - 60) + 'px';
  }
}
function openConceptBalloon(key, anchor, off) {
  const c = CONCEPTS[key]; if (!c) return; S.seenC = S.seenC || {}; S.seenC[key] = true; saveState();
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const wrap = h('div', null,
    h('p', { class: 'c-def' }, h('mark', { class: 'hl c-term' }, CNAME[key] || key), ' ', h('b', { class: 'k' }, 'é'), ' ', c.e),
    h('p', null, h('b', { class: 'k' }, cap(c.sl || 'serve para')), ' ', c.s),
    h('p', { class: 'c-ex' }, h('b', null, 'Exemplo: '), cap(c.x)),
    h('div', { class: 'brow' },
      h('button', { class: 'bbtn', html: SPEAK_SVG + 'Ouvir', onclick: e => { e.stopPropagation(); VOICE.say(`${CNAME[key] || key} é ${c.e} ${cap(c.sl || 'serve para')} ${c.s}`); } }),
      h('button', { class: 'bbtn', onclick: e => { e.stopPropagation(); openGlossary(key); } }, 'Glossário')));
  const a1 = typeof anchor === 'function' ? anchor() : anchor;
  const anc = a1 && a1.nodeType === 1 ? a1 : () => { const p = anchorPoint(anchor, new THREE.Vector3(), 0); if (p && off) { p.x += off[0]; p.y += off[1]; p.z += off[2]; } return p; };
  balloon('concept', anc, wrap, { kind: 'quest', wide: true, yOff: 0.35 });
  if (S.voice !== false) VOICE.say(`${CNAME[key] || key} é ${c.e}`);
  SND.play('pop');
}

/* ---------- trilha de etapas ---------- */
const LOCK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.2" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>';
function stepStates(P) {
  const cur = P.stepKey(); let blocker = null;
  return P.steps.map((x, i) => {
    const done = x.m.length > 0 && x.m.every(id => S.done[id]);
    const st = { ...x, i, done, cur: x.k === cur, locked: !!blocker && !done && x.k !== cur, blocker };
    if (x.m.length && !done && !blocker) blocker = x.l;
    return st;
  });
}
/* ---------- HUD ---------- */
const LEVELS = [[0, 'Curioso'], [300, 'Aprendiz'], [700, 'Explorador'], [1200, 'Investigador'], [1800, 'Construtor'], [2600, 'Especialista'], [3400, 'Mestre das LLMs']];
function levelOf(p) { let i = 0; LEVELS.forEach((l, k) => { if (p >= l[0]) i = k; }); return i; }
const HUD = {
  pending: false, sliding: false, raf: 0,
  render(P) {
    const i = PHASES.indexOf(P);
    $('#hudN').textContent = `Fase ${P.n}/${PHASES.length}`; $('#hudName').textContent = P.name; $('#hudIc').textContent = P.n; $('#drIc').textContent = P.n;
    P._explore = false; this.refresh(true); buildHotspots(P);
  },
  refresh(now) {
    if (this.sliding) { this.pending = true; return; }
    if (now) return this.draw();
    if (this.raf) return; this.raf = requestAnimationFrame(() => { this.raf = 0; this.draw(); });
  },
  draw() {
    const P = E.phase; if (!P) return;
    const st = $('#hudStars'); st.innerHTML = ''; P.missions.forEach(m => st.append(h('i', { class: S.done[m.id] ? 'on' : '' }))); if (P.challenge) st.append(h('i', { class: 'bolt' + (S.chal && S.chal[P.n] ? ' on' : '') }));
    const done = P.missions.filter(m => S.done[m.id]).length; const cur = P.missions.find(m => !S.done[m.id]);
    const hm = $('#hudMission'); hm.classList.toggle('ok', !cur);
    $('#hudMk').textContent = cur ? `Missão ${P.missions.indexOf(cur) + 1}/${P.missions.length}` : 'Fase completa';
    $('#hudMt').textContent = cur ? cur.text : (PHASES.indexOf(P) < PHASES.length - 1 ? 'Toque em “Próxima fase” para seguir.' : 'Parabéns! Você concluiu o jogo.');
    const lv = levelOf(S.points); const a = LEVELS[lv][0], b = LEVELS[lv + 1] ? LEVELS[lv + 1][0] : a + 800;
    $('#hudLv').textContent = lv + 1; $('#hudLvName').textContent = LEVELS[lv][1]; $('#hudXp').style.width = clamp((S.points - a) / (b - a), 0, 1) * 100 + '%';
    $('#xpChip').title = `Nível ${lv + 1} · ${S.points} XP`;
    const ab = $('#actbar'); ab.innerHTML = '';
    const allDone = !cur; const idx = PHASES.indexOf(P);
    let rows = P.actions ? P.actions.call(P) : [];
    rows = rows.filter(Boolean).map(r => Array.isArray(r) ? { items: r } : r.items ? r : { items: [r] }).filter(r => r.items.some(Boolean));
    const hadRows = rows.length > 0;
    /* trilha de etapas: só avança quando a etapa atual termina */
    let stepRow = null, autoNext = null;
    if (P.steps) {
      const st = stepStates(P); const ci = st.findIndex(x => x.cur);
      stepRow = { stepper: true, items: st.map(x => ({ t: 'chip', step: x, label: x.l, on: x.cur, click: () => {
        if (x.locked) { toast(`Primeiro termine a etapa “${x.blocker}”.`); SND.play('bad'); return; }
        if (allDone) P._explore = true; P.goStep(x.k); } })) };
      const c = st[ci];
      if (!allDone && c && c.done && st[ci + 1]) autoNext = { t: 'btn', label: `Próxima etapa: ${st[ci + 1].l} →`, cta: true, click: () => P.goStep(st[ci + 1].k) };
    }
    if (allDone && !P._explore) rows = [];
    if (stepRow && allDone && P._explore) rows.unshift(stepRow);
    if (autoNext) rows.push({ items: [autoNext], center: true });
    if (allDone) {
      const nx = idx < PHASES.length - 1 ? { t: 'btn', label: `Próxima fase: ${PHASES[idx + 1].name} →`, cta: true, click: () => go(idx + 1) } : { t: 'btn', label: 'Ver meu mapa e medalhas', cta: true, click: openMap };
      const bon = P.challenge && !(S.chal && S.chal[P.n]) ? { t: 'link', label: 'Desafio bônus (+50 XP)', click: () => openChallenge(P) } : null;
      rows.push({ done: true, center: true, label: idx < PHASES.length - 1 ? `Fase ${P.n} completa!` : 'Você se formou!', items: [nx, bon, !P._explore && (hadRows || P.steps) ? { t: 'link', label: 'Continuar explorando', click: () => { P._explore = true; } } : null] });
    }
    /* um único botão principal por vez */
    const all = rows.flatMap(r => r.items.filter(Boolean));
    const en = all.filter(it => !it.disabled && !(it.step && it.step.locked));
    const cta = en.find(it => it.cta) || en.find(it => it.t === 'btn' && it.hot) || en.find(it => it.t === 'chip' && it.hot) || en.find(it => it.t === 'btn' && it.primary);
    for (const it of all) {
      if (it.cls) it.cls = it.cls.replace(/\byellow\b/, '').trim();
      if (it === cta) { it.hot = true; if (it.t === 'btn') it.primary = true; }
      else { it.hot = false; if (it.t === 'btn') it.primary = false; }
    }
    for (const r of rows) {
      const items = r.items.filter(Boolean); if (!items.length) continue;
      const row = h('div', { class: 'act-row' + (r.center || items.every(x => x.t !== 'chip') ? ' center' : '') + (r.wrap ? ' wrapr' : '') + (r.opts ? ' wrapr optr' : '') + (r.stepper ? ' stepper' : '') + (r.done ? ' donerow' : '') });
      if (r.label) row.append(h('span', { class: 'lab' }, r.label));
      for (const it of items) row.append(this.item(it));
      ab.append(row);
      if (r.stepper && row.scrollWidth > row.clientWidth + 2) row.classList.add('compact');
    }
    const bb = $('#bonusBtn'); if (bb) bb.hidden = true;
    requestAnimationFrame(() => document.documentElement.style.setProperty('--dock-h', ($('#dock').offsetHeight || 0) + 'px'));
  },
  item(it) {
    if (it.t === 'link') return h('button', { class: 'alink', onclick: () => { SND.play('click'); it.click(); HUD.refresh(); } }, it.label);
    if (it.t === 'chip' && it.step) { const x = it.step;
      return h('button', { class: 'achip step' + (it.on ? ' on' : '') + (x.done ? ' done' : '') + (x.locked ? ' lock' : '') + (it.hot ? ' hot' : ''), 'aria-pressed': it.on ? 'true' : 'false', 'aria-disabled': x.locked ? 'true' : null, 'aria-label': `Etapa ${x.i + 1}: ${x.l}${x.done ? ', concluída' : x.locked ? ', bloqueada' : ''}`, onclick: () => { if (!x.locked) SND.play('click'); it.click(); HUD.refresh(); } },
        h('span', { class: 'sn', html: x.done ? '✓' : x.locked ? LOCK_SVG : String(x.i + 1) }), h('span', { class: 'sl' }, x.l)); }
    if (it.t === 'chip') return h('button', { class: 'achip' + (it.on ? ' on' : '') + (it.ok ? ' ok' : '') + (it.bad ? ' bad' : '') + (it.hot ? ' hot' : ''), 'aria-pressed': it.on ? 'true' : 'false', disabled: it.disabled ? true : null, onclick: () => { SND.play('click'); it.click(); HUD.refresh(); } }, it.label);
    if (it.t === 'slider') {
      const v = h('b', null, it.fmt(it.value)); const inp = h('input', { type: 'range', min: it.min, max: it.max, step: it.step, value: it.value, 'aria-label': it.label });
      inp.addEventListener('pointerdown', () => { HUD.sliding = true; });
      const endSlide = () => { HUD.sliding = false; if (HUD.pending) { HUD.pending = false; HUD.refresh(); } };
      inp.addEventListener('pointerup', endSlide); inp.addEventListener('change', endSlide); inp.addEventListener('pointercancel', endSlide);
      inp.addEventListener('input', () => { v.textContent = it.fmt(+inp.value); it.input(+inp.value); });
      const bump = d => { const st = it.big || it.step; let x = clamp(Math.round((+inp.value + d * st) / it.step) * it.step, +it.min, +it.max); x = +x.toFixed(4); inp.value = x; v.textContent = it.fmt(x); it.input(x); SND.play('click'); };
      return h('div', { class: 'aslider' }, h('span', null, it.label), h('button', { class: 'sbtn', 'aria-label': 'Diminuir ' + it.label, onclick: () => bump(-1) }, '◀'), inp, h('button', { class: 'sbtn', 'aria-label': 'Aumentar ' + it.label, onclick: () => bump(1) }, '▶'), v);
    }
    return h('button', { class: 'abtn ' + (it.primary ? 'primary ' : '') + (it.cls || '') + (it.hot ? ' hot' : ''), disabled: it.disabled ? true : null, onclick: () => { SND.play('click'); it.click(); HUD.refresh(); } }, it.label);
  }
};

/* ---------- modais de jogo ---------- */
function gameCard(build) {
  const wrap = h('div', { class: 'gcard-wrap', role: 'dialog', 'aria-modal': 'true' }); const card = h('div', { class: 'gcard' }); wrap.append(card);
  const close = () => wrap.remove(); build(card, close); document.body.append(wrap); return close;
}
function openChallenge(P) {
  const c = P.challenge; if (!c) return; VOICE.say(c.q);
  gameCard((card, close) => {
    const draw = (ans) => {
      card.innerHTML = '';
      card.append(h('div', { class: 'gk', html: BOLT_SVG + 'Desafio bônus · opcional · +50 XP' }), h('h2', null, c.q));
      P._chOrd = P._chOrd || shuffle(c.o.map((x, k) => k));
      P._chOrd.map(k => [c.o[k], k]).forEach(([o, k]) => card.append(h('button', { class: 'gopt' + (ans != null ? (k === c.a ? ' right' : k === ans ? ' wrong' : '') : ''), disabled: ans != null ? true : null, onclick: () => pick(k) }, o)));
      if (ans == null) card.append(h('div', { class: 'row' }, btn('Agora não', '', () => { close(); HUD.refresh(); })));
      if (ans != null) {
        const ok = ans === c.a; card.append(h('p', null, h('b', null, ok ? 'Acertou! ' : 'Quase! '), c.why));
        card.append(h('div', { class: 'row' }, ok ? btn('Continuar', 'primary', () => { close(); HUD.refresh(); }) : btn('Tentar de novo', 'primary', () => draw(null)), btn('Fechar', '', () => { close(); HUD.refresh(); })));
      }
    };
    const pick = k => {
      const ok = k === c.a; SND.play(ok ? 'win' : 'bad');
      if (ok && !(S.chal && S.chal[P.n])) { S.chal = S.chal || {}; S.chal[P.n] = true; addXP(50, 'Desafio vencido!'); FX.burst(120, 0.5, 0.35, 1); }
      VOICE.say(ok ? 'Acertou! ' + c.why : 'Quase! ' + c.why); draw(k);
    };
    draw(null);
  });
}
function askText(title, value, onOk, o = {}) {
  gameCard((card, close) => {
    const inp = o.area ? h('textarea', { id: 'askIn', 'aria-label': title }, value || '') : h('input', { type: 'text', id: 'askIn', value: value || '', 'aria-label': title });
    const title2 = o.title2 ? h('input', { type: 'text', id: 'askIn2', value: o.title2, 'aria-label': 'Título' }) : null;
    const ok = () => { const v = inp.value.trim(); if (!v) return; close(); onOk(v, title2 ? title2.value.trim() : null); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !o.area) ok(); });
    card.append(h('div', { class: 'gk' }, o.kicker || 'Sua vez'), h('h2', null, title), title2 ? h('label', { class: 'flab', for: 'askIn2' }, 'Título') : null, title2, title2 ? h('label', { class: 'flab', for: 'askIn' }, 'Texto') : null, inp, o.help ? h('p', { class: 'small muted' }, o.help) : null, h('div', { class: 'row' }, btn(o.okLabel || 'OK', 'primary', ok), btn('Cancelar', '', close)));
    setTimeout(() => (title2 || inp).focus(), 50);
  });
  const wrap = document.querySelector('.gcard-wrap:last-of-type'); if (wrap) wrap.classList.add('inmodal');
}
function addXP(n, why) {
  const before = levelOf(S.points); S.points += n; saveState();
  const after = levelOf(S.points); HUD.refresh();
  if (after > before) setTimeout(() => levelUp(after), 900);
}
function levelUp(lv) {
  const el = h('div', { class: 'lvup', role: 'status' }, h('span', { class: 'n' }, `Nível ${lv + 1}`), h('b', null, LEVELS[lv][1]));
  document.body.append(el); SND.play('win');
  setTimeout(() => el.remove(), 2400);
}
/* ---------- abertura de capítulo: o que vem, objetivo e missões ---------- */
const BF_ICON = {
  see: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/></svg>',
  goal: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.8 6.3.7-4.7 4.3 1.3 6.3L12 16.7 6.4 19.9l1.3-6.3L3 9.3l6.3-.7z" fill="currentColor"/></svg>'
};
function openBriefing(P, o = {}) {
  const old = document.querySelector('.brief'); if (old) old.remove();
  const b = P.brief || { see: P.lede, goal: P.title };
  const i = PHASES.indexOf(P); const done = P.missions.filter(m => S.done[m.id]).length;
  const wrap = h('div', { class: 'gcard-wrap brief', role: 'dialog', 'aria-modal': 'true', 'aria-label': `Fase ${P.n}: ${P.name}` });
  const card = h('div', { class: 'gcard' }); wrap.append(card);
  const close = () => { wrap.remove(); VOICE.stop(); if (o.onClose) o.onClose(); };
  wrap._close = close;
  const track = h('div', { class: 'bf-track', 'aria-hidden': 'true' }); PHASES.forEach((Q, k) => track.append(h('i', { class: (Q.missions.every(m => S.done[m.id]) ? 'done' : '') + (k === i ? ' cur' : '') })));
  const blk = (ic, title, body) => h('div', { class: 'bf-blk' }, h('span', { class: 'bf-ic ' + ic, html: BF_ICON[ic] }), h('div', null, h('h3', null, title), body));
  const c = b.key && CONCEPTS[b.key];
  card.append(
    h('div', { class: 'bf-top' }, h('span', { class: 'gk' }, `Fase ${P.n} de ${PHASES.length}`), track),
    h('div', { class: 'bf-hero' }, h('span', { class: 'bf-disc' }, String(P.n)), h('div', null, h('h2', null, P.name), h('p', { class: 'bf-sub' }, P.title), P.era ? h('span', { class: 'bf-era' }, P.era) : null)),
    blk('see', 'O que você vai ver', h('p', null, b.see)),
    blk('goal', 'Seu objetivo', h('p', null, b.goal)),
    blk('star', `Missões · ${done} de ${P.missions.length}`, h('ul', { class: 'bf-miss' }, P.missions.map(m => h('li', { class: S.done[m.id] ? 'on' : '' }, h('i', { html: BF_ICON.star }), h('span', null, m.text))))),
    c ? h('div', { class: 'bf-key' }, h('mark', { class: 'hl' }, b.key), ' ', h('b', null, 'é'), ' ', c.e, ' ', h('b', null, (c.sl || 'Serve para').replace(/^s/, 'S')), ' ', c.s) : null,
    h('div', { class: 'bf-row' },
      h('button', { class: 'bbtn2', html: SPEAK_SVG + 'Ouvir', onclick: () => VOICE.say(`Fase ${P.n}, ${P.name}. ${b.see} Seu objetivo: ${b.goal}`) }),
      btn(o.reopen ? 'Voltar ao jogo' : done === P.missions.length ? 'Jogar de novo' : 'Começar', 'primary big', close)));
  document.body.append(wrap); SND.play('pop');
  if (o.auto) setTimeout(() => { if (wrap.isConnected) VOICE.say(`Fase ${P.n}: ${P.name}. ${b.goal}`); }, 350);
  setTimeout(() => { const bt = card.querySelector('.btn.primary'); if (bt) bt.focus({ preventScroll: true }); }, 60);
}
function startPhaseTalk(P) { const b = P.brief; const t = (b && b.first) || (P.script && P.script[P.script.length - 1]); if (t && E.phase === P) TG.say(t); }
function openMissions() {
  const P = E.phase; if (!P) return; openBriefing(P, { reopen: true }); return;
  const old = $('#missPop'); if (old) { old.remove(); return; }
  const el = h('div', { class: 'balloon quest wide miss-pop', id: 'missPop' }, h('p', null, h('b', null, P.title)), ...P.missions.map(m => h('p', null, (S.done[m.id] ? '★ ' : '☆ ') + m.text)));
  el.append(h('button', { class: 'bx', 'aria-label': 'Fechar', onclick: () => el.remove() }, '×'));
  $('#stage').append(el); setTimeout(() => el.remove(), 9000);
}
function openMap() {
  const all = allMissions(); const lv = levelOf(S.points);
  const v = h('div', { class: 'mapv', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Mapa das fases' });
  const inner = h('div', { class: 'mapv-in' });
  inner.append(h('div', { class: 'mapv-top' }, h('h2', null, 'Mapa da missão'), h('button', { class: 'hud-btn', 'aria-label': 'Fechar mapa', onclick: () => v.remove(), html: X_SVG2 })));
  inner.append(h('div', { class: 'hud-chip', style: 'justify-content:space-between;border-radius:14px' }, h('span', null, h('b', null, `Nível ${lv + 1} · ${LEVELS[lv][1]}`), h('br'), h('span', { class: 'small muted' }, `${S.points.toLocaleString('pt-BR')} XP · ${all.filter(m => S.done[m.id]).length} de ${all.length} missões`))));
  const path = h('div', { class: 'mpath' });
  PHASES.forEach((P, i) => {
    if (P.act) path.append(h('p', { class: 'mact' }, P.act));
    const d = P.missions.filter(m => S.done[m.id]).length, full = d === P.missions.length;
    const stars = h('span', { class: 'stars' }); P.missions.forEach(m => stars.append(h('i', { class: S.done[m.id] ? 'on' : '' }))); if (P.challenge) stars.append(h('i', { class: 'bolt' + (S.chal && S.chal[P.n] ? ' on' : '') }));
    path.append(h('button', { class: 'mnode' + (full ? ' done' : '') + (E.phase === P ? ' cur' : ''), onclick: () => { v.remove(); go(i); } },
      h('span', { class: 'disc' }, String(P.n)), h('span', { class: 'mt' }, h('b', null, P.name, P.kind === '3d' ? h('span', { class: 'd3' }, '3D') : null), h('small', null, P.title + (P.era ? ' · ' + P.era : '')), stars)));
  });
  inner.append(path);
  inner.append(h('h2', { class: 'lbl', style: 'margin:6px 0 0' }, 'Medalhas'), h('div', { class: 'badges' }, PHASES.map(P => h('span', { class: 'badge2' + (P.missions.every(m => S.done[m.id]) ? ' on' : '') }, h('i'), P.badge || P.name))));
  inner.append(h('div', { class: 'row', style: 'justify-content:center;gap:8px;flex-wrap:wrap' }, btn('Resumo desta fase', '', () => { v.remove(); openBriefing(E.phase, { reopen: true }); }), btn('Rever a introdução do jogo', '', () => { v.remove(); openIntro(true); })));
  v.append(inner); document.body.append(v); SND.play('pop');
  const cur = v.querySelector('.mnode.cur'); if (cur) setTimeout(() => cur.scrollIntoView({ block: 'center' }), 50);
}
const X_SVG2 = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
function initHud() {
  initCamCtl();
  $('#stage').append(h('button', { class: 'bonus', id: 'bonusBtn', hidden: true, 'aria-label': 'Desafio bônus, opcional, vale 50 XP', onclick: () => { SND.play('click'); openChallenge(E.phase); } },
    h('span', { class: 'bz', html: BOLT_SVG }), h('span', { class: 'bt' }, h('b', null, 'Bônus'), h('small', null, 'opcional · +50 XP'))));
  const dr = $('#drawer'), mb = $('#menuBtn');
  const setDr = open => { dr.hidden = !open; mb.setAttribute('aria-expanded', open ? 'true' : 'false'); if (open) { HUD.refresh(true); SND.play('pop'); } };
  mb.addEventListener('click', () => setDr(dr.hidden));
  $('#drClose').addEventListener('click', () => setDr(false));
  dr.addEventListener('click', e => { if (e.target === dr) setDr(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !dr.hidden) setDr(false); });
  $('#drBrief').addEventListener('click', () => { setDr(false); openBriefing(E.phase, { reopen: true }); });
  $('#drIntro').addEventListener('click', () => { setDr(false); openIntro(true); });
  $('#glossBtn').addEventListener('click', () => setDr(false));
  $('#mapBtn').addEventListener('click', () => { setDr(false); openMap(); });
  document.addEventListener('pointerdown', () => { if (TG.sayAt && performance.now() - TG.sayAt > 1500) TG.sayAt = 0; }, true);
  $('#hudMission').addEventListener('click', openMissions);
  $('#tokSay').addEventListener('click', () => { if (TG.dialog) TG.next(); else { VOICE.say(TG.hintText); } });
  TG.show = () => { };
  const vb = $('#voiceBtn'), vq = $('#voiceQuick'); const drawV = () => { const on = S.voice !== false; vb.setAttribute('aria-pressed', on ? 'true' : 'false'); vb.title = on ? 'Voz ligada' : 'Voz desligada'; vq.setAttribute('aria-pressed', on ? 'true' : 'false'); vq.setAttribute('aria-label', on ? 'Leitura em voz alta: ligada. Toque para desligar' : 'Leitura em voz alta: desligada. Toque para ligar'); vq.title = on ? 'Desligar a leitura em voz alta' : 'Ligar a leitura em voz alta'; };
  const togV = () => { S.voice = S.voice === false; saveState(); drawV(); if (S.voice === false) { VOICE.stop(); toast('Leitura em voz alta desligada'); } else VOICE.say('Voz ligada!'); };
  if (!VOICE.ok) { vb.hidden = true; vq.hidden = true; } else { vb.addEventListener('click', togV); vq.addEventListener('click', togV); drawV(); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const m = document.querySelector('.mapv'); if (m) m.remove(); const g = document.querySelector('.gcard-wrap'); if (g) { if (g._close) g._close(); else g.remove(); } } });
  new ResizeObserver(() => document.documentElement.style.setProperty('--dock-h', ($('#dock').offsetHeight || 0) + 'px')).observe($('#dock'));
}
/* helper: run fn after a phase method (sync or async) */
function after(P, name, fn) {
  const orig = P[name]; if (!orig) return;
  P[name] = function (...a) { const pre = fn.pre ? fn.pre.apply(this, a) : undefined; const r = orig.apply(this, a); if (r && typeof r.then === 'function') return r.then(v => { fn.call(this, a, pre); return v; }); fn.call(this, a, pre); return r; };
}

function showTapTip(hit) { const t = typeof hit.userData.tip === 'function' ? hit.userData.tip(hit) : hit.userData.tip; if (t) balloon('tap', hit, `<p>${t}</p>`, { ttl: 3600, yOff: 0.3 }); }

/* ---------- botões de câmera (em vez de arrastar a cena) ---------- */
function camOrbit(deg) { const c = E.camera, t = E.controls.target; const off0 = c.position.clone().sub(t); const ax = new THREE.Vector3(0, 1, 0); return anim(420, k => { const off = off0.clone().applyAxisAngle(ax, deg * Math.PI / 180 * k); c.position.copy(t).add(off); }, ease.out); }
function camTilt(d) { const c = E.camera, t = E.controls.target; const off = c.position.clone().sub(t); const sph = new THREE.Spherical().setFromVector3(off); const p0 = sph.phi, p1 = clamp(p0 + d, 0.25, Math.PI * 0.47); return anim(380, k => { sph.phi = lerp(p0, p1, k); c.position.copy(t).add(new THREE.Vector3().setFromSpherical(sph)); }, ease.out); }
function camZoom(f) { const c = E.camera, t = E.controls.target; const off0 = c.position.clone().sub(t); const d0 = off0.length(), d1 = clamp(d0 * f, E.controls.minDistance, E.controls.maxDistance); return anim(380, k => { c.position.copy(t).add(off0.clone().setLength(lerp(d0, d1, k))); }, ease.out); }
function camReset() { const P = E.phase; if (!P) return; const [pos, tgt] = (isMobile() && P.mview) || P.view; flyTo(pos, tgt, 700); }
function initCamCtl() {
  const mk = (label, txt, fn) => h('button', { class: 'cbtn', 'aria-label': label, title: label, onclick: () => { SND.play('click'); fn(); } }, txt);
  const box = h('div', { class: 'camctl', role: 'group', 'aria-label': 'Câmera' }, h('button', { class: 'cbtn cam-t', 'aria-label': 'Mostrar ou esconder os controles da câmera', title: 'Câmera', onclick: () => { box.classList.toggle('open'); SND.play('click'); }, html: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>' }), mk('Girar para a esquerda', '⟲', () => camOrbit(-35)), mk('Girar para a direita', '⟳', () => camOrbit(35)), mk('Olhar de cima', '▲', () => camTilt(-0.25)), mk('Olhar de frente', '▼', () => camTilt(0.25)), mk('Aproximar', '+', () => camZoom(0.78)), mk('Afastar', '−', () => camZoom(1.28)), mk('Voltar à vista inicial', '⌂', camReset));
  $('#stage').append(box);
}
