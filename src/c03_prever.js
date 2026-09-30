/* ============ Fase 3 · A máquina de prever (Markov e Shannon) ============ */
const WHEEL3_COLS = [P3.ipe, P3.anil, P3.mata, P3.urucum, P3.jaca, P3.anilL, P3.ipeL, P3.mataL];
function wheel3(M) {
  const g = new THREE.Group(); M.scene.add(g); const R = 1.9; const spin = new THREE.Group(); g.add(spin);
  const base = inked(new THREE.CylinderGeometry(R * 1.04, R * 1.1, 0.16, 48), P3.paper); base.position.y = -0.2; g.add(base);
  const hub = inked(new THREE.CylinderGeometry(0.18, 0.18, 0.5, 20), P3.ink); hub.position.y = 0.1; g.add(hub);
  const ptr = inked(new THREE.ConeGeometry(0.2, 0.5, 16), P3.urucum); ptr.rotation.x = -Math.PI / 2; ptr.position.set(0, 0.2, R + 0.28); g.add(ptr);
  const api = { g, spin, rot: 0, items: [],
    draw(items, hi) {
      this.items = items; clear3(spin); let a = 0;
      items.forEach((it, i) => {
        const len = Math.max(0.0001, it.p * Math.PI * 2);
        const sl = inked(new THREE.CylinderGeometry(R, R, 0.26, Math.max(3, Math.round(56 * it.p)), 1, false, a, len), WHEEL3_COLS[i % WHEEL3_COLS.length], { ink: 1.015 });
        if (hi != null && hi !== i) sl.material.color.lerp(new THREE.Color(P3.paper), 0.45);
        spin.add(sl);
        if (it.p > 0.08) { const mid = a + len / 2; const lb = m3Sprite(`${it.t} ${Math.round(it.p * 100)}%`, it.p > 0.18 ? 0.44 : 0.36, { size: 30 }); const rr2 = it.p > 0.2 ? 0.55 : 0.86; lb.position.set(Math.sin(mid) * R * rr2, 0.42, Math.cos(mid) * R * rr2); spin.add(lb); }
        a += len;
      });
      spin.rotation.y = this.rot;
    },
    async spin(items, idx, dur = 1600) {
      let acc = 0; for (let i = 0; i < idx; i++) acc += items[i].p; const mid = (acc + items[idx].p * (0.25 + Math.random() * 0.5)) * Math.PI * 2;
      const TAU = Math.PI * 2, r0 = this.rot, turns = TAU * (3 + Math.floor(Math.random() * 2)); const r1 = -mid - Math.ceil((turns - r0 - mid) / TAU) * TAU;
      let last = 0; const tgt = Math.min(r1, r0 - turns);
      const fin = -mid + Math.floor((tgt + mid) / TAU) * TAU;
      await anim(REDUCED ? 120 : dur, k => { this.rot = lerp(r0, fin, k); spin.rotation.y = this.rot; const tick = Math.floor(-this.rot / 0.4); if (tick !== last) { last = tick; if (k < 0.95) SND.play('tick'); } }, ease.out);
      this.rot = fin; this.draw(items, idx);
    }
  };
  M.ticks.push((dt, t) => { g.rotation.x = Math.sin(t * 0.6) * 0.02; ptr.position.y = 0.2 + Math.abs(Math.sin(t * 2.4)) * 0.05; });
  return api;
}
const SHANNON = [
  { pre: ['O', 'Brasil', 'é', 'famoso', 'pelo'], opts: ['futebol', 'samba', 'Paris'], moral: 'No caderno, “futebol” e “samba” vieram o mesmo número de vezes depois de “pelo”. A máquina fica dividida: 50% para cada.' },
  { pre: ['A', 'capital', 'do'], opts: ['Brasil', 'França', 'samba'], moral: 'Fácil para ela: no caderno, depois de “do” sempre veio “Brasil”.' },
  { pre: ['A', 'capital', 'do', 'Brasil', 'é'], opts: ['Brasília', 'uma', 'Paris'], moral: 'Ops! A máquina só olha a última palavra, “é”. Ela esqueceu que a frase falava da capital do Brasil. As LLMs resolvem isso com a atenção, que você verá na fase 8.' }
];
PHASES.push({
  kind: '2d', name: 'Prever a próxima palavra', title: 'A máquina de adivinhar', era: '1913 · Markov | 1948 · Shannon', act: 'Como funciona, peça por peça', badge: 'Adivinho',
  brief: { see: 'A ideia de Markov e de Shannon: contar, em textos de verdade, que palavra costuma vir depois de outra. É o jeito mais simples de prever a próxima palavra.', goal: 'Montar uma máquina de prever, jogar contra ela e sortear frases na roleta das probabilidades.', key: 'Modelo de linguagem', first: 'Escolha uma palavra nos botões e veja o que costuma vir depois dela.' },
  missions: [
    { id: 'v3a', text: 'Conte o que vem depois de 3 palavras diferentes', short: 'contar' },
    { id: 'v3b', text: 'Jogue as 3 rodadas contra a máquina', short: 'adivinhar' },
    { id: 'v3c', text: 'Veja a máquina escrever uma frase fria e outra quente', short: 'roleta' }],
  steps: [{ k: 'contar', l: 'Contar', m: ['v3a'] }, { k: 'adiv', l: 'Adivinhar', m: ['v3b'] }, { k: 'roleta', l: 'Roleta', m: ['v3c'] }],
  stepKey() { return this.step; }, goStep(k) { this.showStep(k); },
  challenge: { q: 'Por que a máquina de Markov errou “A capital do Brasil é ___”?', o: ['Ela só olha a última palavra, “é”', 'Ela não conhece a palavra Brasília', 'A temperatura estava baixa demais'], a: 0, why: 'Sem enxergar o começo da frase, ela não sabe de que país se fala. Enxergar o contexto é o trabalho da atenção.' },
  build2d(root) {
    this.step = 'contar'; this.sel = null; this.seen = new Set(); this.ri = 0; this.pick = null; this.T = 1; this.sent = ['A', 'capital', 'do', 'Brasil', 'é']; this.gen = null; this.genLow = false; this.genHigh = false; this.busy = false; this.rs = 'girar'; this.spun = 0; this.cold = false; this.hotSeen = false; this.frases = {};
    this.inner = scene2d(this, root, [{ c: 'urucum', x: .15, y: .2, r: .45 }, { c: 'anil', x: .9, y: .55, r: .5 }, { c: 'ipe', x: .3, y: .95, r: .4 }]);
    this.bars = mkBars(); this.wheel2 = mkWheel(); this.m3host = h('div', { class: 'm3' });
    const self = this; this.wheel = { get el() { return self.no3d ? self.wheel2.el : self.m3host; }, draw(items, hi) { self.lastItems = items; if (self.no3d) self.wheel2.draw(items, hi); else if (self.w3) self.w3.draw(items, hi); }, spin(items, idx, dur) { return self.no3d ? self.wheel2.spin(items, idx, dur) : self.w3 ? self.w3.spin(items, idx, dur) : wait(300); } };
    this.render();
  },
  showStep(k) { this.step = k; if (k === 'roleta') { this.T = 1; this.lastPick = null; this.gen = null; } this.render(); HUD.refresh(); },
  setRs(k) { this.rs = k; this.lastPick = null; this.gen = null; if (k === 'temp') this.T = 1; SND.play('pop'); this.render(); HUD.refresh(); },
  setT(t) { this.T = t; if (t <= 0.5) this.cold = true; if (t >= 1.5) this.hotSeen = true; SND.play('pop'); this.render(); HUD.refresh(); },
  m3opts: { cam: [0, 3.4, 5.3], look: [0, -0.1, 0.35], fov: 34 },
  m3build(M) { this.w3 = wheel3(M); if (this.lastItems) this.w3.draw(this.lastItems); },
  nb(hl) {
    return h('div', { class: 'sheet nb tl' }, MARKOV.corpus.map(s => {
      const ws = s.split(' '); return h('p', null, ws.flatMap((w, i) => { const a = hl && w === hl; const b = hl && i > 0 && ws[i - 1] === hl; return [h('span', { class: 'w' + (a ? ' a' : b ? ' b' : '') }, w), i < ws.length - 1 && ws[i + 1] !== '.' ? ' ' : ''];} ));
    }));
  },
  render() {
    const v = this.inner; v.innerHTML = ''; clearBalloons();
    if (this.step === 'contar') {
      v.append(h('p', { class: 'note' }, 'O caderno da máquina: 8 frases de exemplo.'));
      this.nbEl = this.nb(this.sel); v.append(this.nbEl);
      if (this.sel) {
        const d = MARKOV.dist(this.sel); const tot = d.reduce((a, b) => a + b.c, 0);
        this.bars.set(d.map((x, i) => ({ t: x.t === '.' ? '(ponto final)' : x.t, p: x.p, label: `${x.c} de ${tot}`, cls: i === 0 ? 'win' : '' })));
        v.append(h('div', { class: 'sheet pad tr col2 rise' }, h('p', { class: 'lbl', style: 'margin:0' }, `Depois de “${this.sel}”, veio…`), this.bars.el, h('p', { class: 'small muted', style: 'margin:0' }, 'Contando, dá para transformar em chances: é um modelo de linguagem.')));
      }
    }
    if (this.step === 'adiv') {
      const R = SHANNON[Math.min(this.ri, SHANNON.length - 1)]; const last = R.pre[R.pre.length - 1];
      v.append(h('p', { class: 'note' }, `Rodada ${Math.min(this.ri, SHANNON.length - 1) + 1} de ${SHANNON.length}: você contra a máquina.`));
      v.append(h('div', { class: 'sheet pad sent tl' }, R.pre.map((t, i) => chipTok(t, i === R.pre.length - 1 ? 'c1' : 'c5')), this.pick != null ? chipTok(R.opts[this.pick], 'y') : chipTok('?', 'c5', { extra: 'ghost' })));
      if (this.pick != null) {
        const d = MARKOV.dist(last);
        this.bars.set(d.map((x, i) => ({ t: x.t, p: x.p, cls: x.t === R.opts[this.pick] ? 'win' : '' })));
        const mTop = d[0] ? d[0].t : '?';
        const mine = d.find(x => x.t === R.opts[this.pick]); const same = mine && mine.p >= d[0].p - 1e-9;
        v.append(h('div', { class: 'sheet pad tr col2 rise' }, h('p', { class: 'verdict ' + (same ? 'g' : 'r') }, same ? `Você e a máquina pensaram igual: “${R.opts[this.pick]}”.` : mine ? `Você: “${R.opts[this.pick]}”. A máquina preferia “${d[0].t}”.` : `Você: “${R.opts[this.pick]}”. A máquina nunca viu essa palavra depois de “${last}”.`), h('p', { class: 'lbl', style: 'margin:0' }, `A máquina, olhando só a última palavra (“${last}”):`), this.bars.el, h('p', { style: 'margin:0' }, R.moral)));
        if (this.ri === SHANNON.length - 1 && mTop !== 'Brasília') v.append(h('p', { class: 'note rise' }, 'Moral: prever bem exige olhar a frase inteira.'));
      }
    }
    if (this.step === 'roleta') {
      const rs = this.rs; const toks = rs === 'frases' && this.gen ? this.gen : this.sent;
      v.append(h('div', { class: 'sheet pad sent tl' }, toks.map((t, i) => chipTok(t, this.gen && rs === 'frases' ? (i === toks.length - 1 ? 'y' : 'c' + (i % 5)) : (i === toks.length - 1 ? 'c1' : 'c5'))), !(this.gen && rs === 'frases') || toks[toks.length - 1] !== '.' ? chipTok('?', 'c5', { extra: 'ghost' }) : null));
      const ctx0 = toks[toks.length - 1]; const ctx = ctx0 === '.' ? 'é' : ctx0; const raw = MARKOV.dist(ctx); const tot = raw.reduce((a, b) => a + b.c, 0);
      const T = rs === 'girar' ? 1 : this.T; const d = MARKOV.withT(raw, T); this.items = d.map(x => ({ t: x.t, p: x.p, c: x.c }));
      const tt = String(T.toFixed(1)).replace('.', ',');
      const ex = h('div', { class: 'sheet pad col2 tr explain' });
      if (rs === 'girar') ex.append(h('p', { class: 'lbl', style: 'margin:0' }, '1 de 3 · Das contagens para a roleta'), h('p', { style: 'margin:0' }, `No caderno da máquina, depois de “é” veio: `, ...raw.flatMap((x, i) => [h('b', null, x.t), ` (${x.c}×)`, i < raw.length - 1 ? ', ' : '.']), ` Cada palavra ganha uma fatia do tamanho dessa contagem. Fatia maior tem mais chance, mas qualquer uma pode sair.`));
      if (rs === 'temp') { const top = this.items[0]; ex.append(h('p', { class: 'lbl', style: 'margin:0' }, '2 de 3 · O botão da temperatura'), h('p', { style: 'margin:0' }, 'Antes do sorteio, a temperatura muda o tamanho das fatias. ', h('b', null, 'Fria:'), ' a favorita engole a roleta e a máquina fica previsível. ', h('b', null, 'Quente:'), ' as fatias ficam parecidas e a máquina fica criativa, até demais. O nome vem da física: quanto mais quente, mais agitado e imprevisível.'), h('p', { class: 'tnow' }, `Agora: ${tt} ${T < 0.7 ? '(fria)' : T > 1.4 ? '(quente)' : '(normal)'} · “${top.t}” tem ${fmtPct(top.p, 0)} da roleta`)); }
      if (rs === 'frases') { ex.append(h('p', { class: 'lbl', style: 'margin:0' }, '3 de 3 · Uma frase inteira'), h('p', { style: 'margin:0' }, 'A máquina continua “A capital do Brasil é…” girando a roleta uma vez para cada palavra, sempre olhando só a palavra anterior. Fria, ela pega sempre a favorita. Quente, sorteia com as fatias parecidas.'));
        const F = this.frases; if (F.low || F.high) ex.append(h('div', { class: 'fcomp' }, F.low ? h('p', null, h('b', null, 'Fria (0,3): '), F.low) : null, F.high ? h('p', null, h('b', null, 'Quente (1,8): '), F.high) : null)); }
      v.append(ex);
      this.wheel.draw(this.items);
      this.bars.set(this.items.map((x, i) => ({ t: x.t === '.' ? '(ponto final)' : x.t, p: x.p, label: rs === 'girar' ? `${x.c} de ${tot}` : undefined, cls: i === 0 ? 'win' : '' })));
      if (!this.no3d) v.append(this.m3host);
      v.append(h('div', { class: 'sheet pad tl' + (this.no3d ? ' wheelbox' : '') }, this.no3d ? this.wheel.el : null, h('div', { class: 'col2' }, h('p', { class: 'lbl', style: 'margin:0' }, `Chances depois de “${ctx}”` + (rs === 'girar' ? '' : ` · temperatura ${tt}`)), this.bars.el)));
      if (this.lastPick) v.append(h('p', { class: 'note rise' }, this.lastPick));
    }
  },
  select(w) { this.sel = w; this.seen.add(w); SND.play('pop'); if (this.seen.size >= 3) complete('v3a'); this.render(); HUD.refresh(); },
  guess(i) { this.pick = i; SND.play('pop'); if (this.ri === SHANNON.length - 1) complete('v3b'); this.render(); HUD.refresh(); },
  nextRound() { this.ri++; this.pick = null; this.render(); HUD.refresh(); },
  async spin() {
    if (this.busy) return; this.busy = true; HUD.refresh(); const ok = live(this);
    const items = this.items; const idx = sampleIdx(items); await this.wheel.spin(items, idx); if (!ok()) return;
    const top = items.reduce((a, b, i) => b.p > items[a].p ? i : a, 0);
    this.spun++; this.lastPick = (idx === top ? `Saiu “${items[idx].t}”, a favorita (${fmtPct(items[idx].p, 0)}).` : `Surpresa! Saiu “${items[idx].t}”, que tinha só ${fmtPct(items[idx].p, 0)} de chance.`) + (this.rs === 'girar' ? ' Uma LLM escolhe cada palavra assim: sorteando com as chances.' : '');
    this.busy = false; SND.play(idx === top ? 'pop' : 'ok'); this.render(); HUD.refresh();
  },
  async write(T) {
    if (this.busy) return; if (T != null) this.T = T; this.busy = true; this.lastPick = null; const ok = live(this);
    const cold = this.T <= 0.5; this.gen = this.sent.slice(); let prev = this.gen[this.gen.length - 1]; HUD.refresh();
    for (let k = 0; k < 8; k++) {
      const d = MARKOV.withT(MARKOV.dist(prev), this.T); const items = d.map(x => ({ t: x.t, p: x.p, c: x.c })); if (!items.length) break;
      this.items = items; this.render(); const idx = cold ? 0 : sampleIdx(items); await this.wheel.spin(items, idx, 650); if (!ok()) return;
      prev = items[idx].t; this.gen.push(prev); this.render(); await wait(REDUCED ? 30 : 160); if (!ok()) return;
      if (prev === '.') break;
    }
    const txt = this.gen.join(' ').replace(/ ([.?])/g, '$1');
    if (cold) { this.coldN = (this.coldN || 0) + 1; this.genLow = true; this.frases.low = txt; } else if (this.T >= 1.5) { this.genHigh = true; this.hotList = [txt, ...(this.hotList || [])].slice(0, 2); this.frases.high = this.hotList.join(' · '); }
    this.lastPick = this.genLow && this.genHigh ? 'Fria: sempre a mesma frase, a mais comum. Quente: cada vez sai uma diferente, às vezes sem sentido. As LLMs de verdade têm o mesmo botão.' : cold ? (this.coldN > 1 ? 'Viu? Fria, sai sempre a mesma frase.' : 'Fria: a máquina foi sempre pela palavra favorita.') : this.T >= 1.5 ? 'Quente: a roleta sorteou palavras menos comuns.' : 'Cada palavra saiu de um sorteio, olhando só a anterior.';
    if (this.genLow && this.genHigh) complete('v3c');
    this.busy = false; this.render(); HUD.refresh();
  },
  actions() {
    const rows = [];
    if (this.step === 'contar') { const W = ['capital', 'é', 'pelo', 'Brasil', 'cidade']; rows.push({ wrap: true, label: 'O que vem depois de…', items: W.map((w, i) => ({ ...chip(w, this.sel === w, () => this.select(w), this.seen.has(w)), hot: !S.done.v3a && !this.seen.has(w) && W.findIndex(x => !this.seen.has(x)) === i })) }); }
    if (this.step === 'adiv') {
      const R = SHANNON[Math.min(this.ri, SHANNON.length - 1)];
      if (this.pick == null) rows.push({ wrap: true, label: 'Qual palavra vem agora?', items: R.opts.map((t, i) => chip(t, false, () => this.guess(i))) });
      else if (this.ri < SHANNON.length - 1) rows.push([abtn('Próxima rodada ▶', () => this.nextRound(), { primary: true, hot: true })]);
    }
    if (this.step === 'roleta') {
      const busy = this.busy, rs = this.rs;
      if (rs === 'girar') rows.push([abtn(this.spun ? 'Girar de novo' : 'Girar a roleta', () => this.spin(), { primary: !this.spun, hot: !this.spun, disabled: busy }), this.spun ? abtn('Próximo: a temperatura →', () => this.setRs('temp'), { primary: true, hot: true, disabled: busy }) : null]);
      if (rs === 'temp') { rows.push([abtn('Esfriar (0,3)', () => this.setT(0.3), { primary: !this.cold, hot: !this.cold }), abtn('Esquentar (1,8)', () => this.setT(1.8), { primary: this.cold && !this.hotSeen, hot: this.cold && !this.hotSeen }), this.cold && this.hotSeen ? abtn('Próximo →', () => this.setRs('frases'), { primary: true, hot: true }) : null]);
        rows.push([{ t: 'slider', label: 'Temperatura', big: 0.3, min: 0.2, max: 2.5, step: 0.1, value: this.T, fmt: x => x.toFixed(1).replace('.', ','), input: x => { this.T = x; if (x <= 0.5) this.cold = true; if (x >= 1.5) this.hotSeen = true; if (!this.busy) this.render(); } }]); }
      if (rs === 'frases') { rows.push([abtn('Escrever fria (0,3)', () => this.write(0.3), { primary: !this.genLow, hot: !this.genLow, disabled: busy }), abtn(this.genHigh ? 'Quente de novo' : 'Escrever quente (1,8)', () => this.write(1.8), { primary: this.genLow && !this.genHigh, hot: this.genLow && !this.genHigh, disabled: busy })]); }
    }
    return rows;
  },
  hs() { return this.step === 'contar' ? [['Modelo de linguagem', () => this.nbEl]] : this.step === 'roleta' ? (this.rs === 'temp' ? [['Temperatura', () => this.inner.querySelector('.explain')]] : [['Softmax', () => this.bars.el.closest('.sheet')]]) : []; },
  guide() {
    if (this.step === 'contar') return { tip: S.done.v3a ? 'Contar o que vem depois já é um modelo de linguagem! Agora jogue contra a máquina.' : this.sel ? 'Viu? Contar vizinhos já dá um jeito de prever a próxima palavra. Experimente outras palavras.' : 'Escolha uma palavra nos botões lá embaixo. As marcadas em verde são as que vieram depois dela.' };
    if (this.step === 'adiv') return { tip: this.pick == null ? 'Complete a frase. Depois veja o que a máquina diria.' : SHANNON[this.ri].moral };
    const rs = this.rs; if (this.busy) return { tip: 'A roleta sorteia cada palavra na proporção das chances.' };
    if (rs === 'girar') return { tip: this.spun ? 'Gire mais vezes para ver que nem sempre sai a favorita. Depois, siga para a temperatura.' : 'Leia a explicação e aperte “Girar a roleta”.' };
    if (rs === 'temp') return { tip: !this.cold ? 'Aperte “Esfriar” e veja a fatia da favorita crescer.' : !this.hotSeen ? 'Viu? Fria, a favorita quase engoliu a roleta. Agora aperte “Esquentar”.' : this.T < 0.7 ? 'Fria: a favorita engole a roleta. Quando quiser, siga em frente.' : this.T > 1.4 ? 'Quente: as fatias ficam parecidas. Siga para escrever frases inteiras.' : 'Mexa na temperatura e veja as fatias mudarem.' };
    return { tip: !this.genLow ? 'Aperte “Escrever fria” e veja a máquina escrever, palavra por palavra.' : !this.genHigh ? 'Agora escreva com a temperatura quente e compare as duas frases.' : 'Fria é previsível, quente é criativa. As LLMs usam o mesmo botão.' };
  }
});
