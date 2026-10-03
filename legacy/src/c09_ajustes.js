/* ============ Fase 9 · Prompt × fine-tuning ============ */
function lockSvg(open) {
  return `<svg viewBox="0 0 34 40" aria-hidden="true"><path d="M9 18V12a8 8 0 0 1 16 0${open ? 'V7' : 'v6'}" fill="none" stroke="var(--ink)" stroke-width="3.4" stroke-linecap="round" filter="url(#rough)" ${open ? 'transform="translate(10 -5) rotate(18 25 12)"' : ''}/><rect x="4" y="17" width="26" height="20" rx="4" style="fill:var(${open ? '--urucum' : '--mata'})" stroke="var(--ink)" stroke-width="2.4" filter="url(#rough)"/><circle cx="17" cy="26" r="2.6" fill="var(--ink)"/><path d="M17 27v5" stroke="var(--ink)" stroke-width="2.4"/></svg>`;
}
PHASES.push({
  kind: '2d', name: 'Prompt ou fine-tuning', title: 'Dois jeitos de mudar a resposta', era: '2022 · ajustar modelos prontos', act: 'Ajustar, buscar e criar', badge: 'Hacker do contexto', SP: 2,
  brief: { see: 'Um modelo já treinado responde “Brasília”. Dá para mudar isso de dois jeitos: escrevendo uma instrução no prompt ou treinando de novo, o fine-tuning.', goal: 'Fazer o modelo dizer São Paulo dos dois jeitos e descobrir qual deles mexe nos pesos. Fique de olho no cadeado.', key: 'Fine-tuning', first: 'Aperte “Instrução no prompt” e veja a resposta mudar.' },
  missions: [
    { id: 'v9a', text: 'Faça o modelo dizer “São Paulo” só com uma instrução no prompt', short: 'prompt' },
    { id: 'v9b', text: 'Com fine-tuning, leve “São Paulo” acima de 50% sem instrução', short: 'fine-tuning' },
    { id: 'v9c', text: 'Depois do fine-tuning, confira a pergunta da França ou do futebol', short: 'efeito colateral' }],
  challenge: { q: 'Qual caminho muda os pesos do modelo?', o: ['Fine-tuning', 'Uma instrução no prompt', 'Aumentar a temperatura'], a: 0, why: 'O prompt muda só o contexto daquela conversa. O fine-tuning treina de novo e mexe nos pesos.' },
  build2d(root) {
    this.base = MINI.pretrained(); this.W = MINI.copy(this.base); this.prompt = false; this.ft = 0; this.delta = false; this.ki = 0; this.busy = false;
    const inner = scene2d(this, root, [{ c: 'ipe', x: .15, y: .15, r: .45 }, { c: 'urucum', x: .85, y: .6, r: .45 }, { c: 'mata', x: .2, y: .95, r: .4 }]);
    this.promptEl = h('div', { class: 'sheet pad col2 tl' }); this.lockEl = h('div', { class: 'lock' }); this.grid = weightGrid(this.W); brain3(this, { W: () => this.W, lock: true, open: () => this.changed() > 0, label: 'Cubo com os 27 pesos e um cadeado que abre quando algum peso muda' }); this.bars = mkBars(); this.side = h('div');
    inner.append(this.promptEl, h('div', { class: 'sheet pad brainbox stack tr' }, this.wcol = h('div', { class: 'col2', style: 'align-items:center' }, this.m3host, this.lockEl), h('div', { class: 'col2', style: 'min-width:0' }, h('span', { class: 'lbl' }, 'Resposta do modelo'), this.bars.el)), this.side);
    this.redraw();
  },
  render() { if (this.no3d && this.m3host.isConnected) { this.m3host.remove(); this.wcol.append(this.grid.el); } this.redraw(); },
  lockA() { return this.lock3 && this.M3 && !this.no3d ? { m3: this.M3, obj: this.lock3, off: [0, 1.05, 0] } : this.lockEl; },
  boost() { return this.prompt && this.ki === 0 ? MINI.V.map((t, i) => i === this.SP ? 7 : 0) : null; },
  changed() { let n = 0; this.W.forEach((r, i) => r.forEach((v, d) => { if (Math.abs(v - this.base[i][d]) > 0.005) n++; })); return n; },
  redraw() {
    const K = MINI.K[this.ki]; const tgt = this.ki === 0 ? this.SP : K.y; const p = MINI.probs(this.W, K.x, this.boost()); const top = p.indexOf(Math.max(...p)); this.p = p;
    const pe = this.promptEl; pe.innerHTML = ''; pe.append(h('span', { class: 'lbl' }, 'Prompt (o que chega ao modelo)'));
    if (this.prompt && this.ki === 0) pe.append(h('div', { class: 'sticky rise' }, 'Neste contexto fictício, considere São Paulo como a capital do Brasil.'));
    if (this.ft > 0) pe.append(h('p', { class: 'small', style: 'margin:0' }, h('b', null, 'Fine-tuning: '), `o modelo já treinou ${this.ft} ${this.ft === 1 ? 'vez' : 'vezes'} com a frase “A capital do Brasil é São Paulo.”`));
    pe.append(h('div', { class: 'sent', style: 'justify-content:flex-start' }, K.t.replace(' ___', '').split(' ').map((t, i) => chipTok(t, 'c' + (i % 2 ? 2 : 0))), chipTok(MINI.V[top], 'y')));
    const n = this.changed(); const open = n > 0; this.lockEl.innerHTML = this.no3d ? lockSvg(open) : ''; this.lockEl.append(h('span', { class: 'small' + (open ? ' lk-open' : '') }, this.delta ? 'Cores = quanto cada peso mudou' : open ? `${n} de 27 pesos mudaram` : 'pesos intactos'));
    if (this.lock3) this.lock3.userData.set(open);
    const Wv = this.delta ? this.W.map((r, i) => r.map((v, d) => (v - this.base[i][d]) * 2.5)) : this.W; this.grid.set(Wv); if (this.cube) this.cube.userData.set(Wv);
    const order = p.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 5); if (!order.some(([, i]) => i === tgt)) order[4] = [p[tgt], tgt];
    this.bars.set(order.map(([v, i]) => ({ t: MINI.V[i], p: v, cls: i === tgt ? 'tgt' : i === top ? 'win' : '' })));
    this.side.innerHTML = '';
    if (this.ft > 0) { const rows = [1, 2].map(k => { const K2 = MINI.K[k]; const a = MINI.probs(this.base, K2.x)[K2.y], z = MINI.probs(this.W, K2.x)[K2.y]; return h('div', { class: 'row2', style: 'justify-content:space-between' }, h('span', null, `${K2.short} → ${MINI.V[K2.y]}`), h('span', { class: 'mono' }, `${fmtPct(a, 0)} → ${fmtPct(z, 0)}`)); });
      this.side.append(h('div', { class: 'sheet pad col2 tl rise' }, h('span', { class: 'lbl' }, 'Outras respostas também mudaram'), rows, h('p', { class: 'small muted', style: 'margin:0' }, 'Você só treinou a frase sobre a capital do Brasil, mas as outras perguntas também mudaram, porque os mesmos 27 pesos servem a todas. Às vezes melhora, às vezes piora: é difícil controlar.'))); }
    const pNo = MINI.probs(this.W, MINI.K[0].x)[this.SP];
    if (this.prompt && this.ki === 0 && top === this.SP) complete('v9a');
    if (pNo >= 0.5) complete('v9b');
    HUD.refresh();
  },
  togglePrompt() { this.prompt = !this.prompt; SND.play('pop'); if (this.prompt) this.ki = 0; this.redraw(); const open = this.changed() > 0;
    if (this.prompt) balloon('pr', this.lockA(), `<p><b>Mudou sem mexer nos pesos!</b></p><p>A LLM leu a instrução e copiou “São Paulo” do próprio texto. ${open ? 'O cadeado está aberto só por causa do fine-tuning que você fez antes.' : 'O cadeado continua fechado.'}</p>`, { kind: 'ok', say: open ? 'Mudou sem mexer em nenhum peso! O cadeado só está aberto por causa do fine-tuning de antes.' : 'Mudou sem mexer em nenhum peso! O cadeado continua fechado.' }); else unballoon('pr'); this.showBars(); },
  async fine(n) {
    if (this.busy) return; this.busy = true; const ok = live(this);
    for (let i = 0; i < n; i++) { const r = MINI.step(this.W, MINI.K[0].x.map((v, d) => v + [0, 0.03, -0.03, 0.02, -0.02][this.ft % 5] * (d === 1 ? 1 : 0.5)), this.SP, 0.7); this.ft++; this.grid.flash(r.g); if (this.cube) { this.cube.userData.flash(r.g); this.spin = Math.min(4, this.spin + 1.4); } SND.play(this.ft === 1 ? 'snip' : 'train'); this.redraw(); await wait(REDUCED ? 30 : 200); if (!ok()) return; }
    this.busy = false; this.redraw(); this.showBars();
    if (this.ft >= 3 && !this.saidSide) { this.saidSide = true; unballoon('pr'); balloon('side', this.lockA(), '<p><b>O cadeado abriu!</b> Os pesos mudaram.</p><p>Repare lá embaixo: outras respostas também mudaram.</p>', { kind: 'quest', ttl: 7000, say: 'O cadeado abriu! E repare: até outras respostas mudaram um pouco.' }); }
  },
  showBars() { requestAnimationFrame(() => { const el = this.bars.el.closest('.sheet'); if (el) el.scrollIntoView({ block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' }); }); },
  undo() { if (this.busy) return; this.W = MINI.copy(this.base); this.ft = 0; this.redraw(); },
  setK(i) { this.ki = i; SND.play('pop'); this.redraw();
    if (i > 0 && this.ft >= 3 && !S.done.v9c) { complete('v9c'); const K = MINI.K[i]; const a = MINI.probs(this.base, K.x)[this.SP], z = MINI.probs(this.W, K.x)[this.SP];
      balloon('side2', this.bars.el, `<p><b>Efeito colateral!</b></p><p>Numa pergunta que nem fala do Brasil, “São Paulo” foi de ${fmtPct(a, 1)} para ${fmtPct(z, 1)}. O fine-tuning mexe no modelo inteiro.</p>`, { kind: 'quest' }); } },
  actions() {
    const busy = this.busy;
    return [
      { label: 'Pergunta', items: MINI.K.map((k, i) => ({ ...chip(k.short, this.ki === i, () => this.setK(i)), hot: S.done.v9b && !S.done.v9c && i === 1 && this.ki !== 1 })).concat([chip(this.delta ? 'Cores normais' : 'Ver o que mudou', this.delta, () => { this.delta = !this.delta; this.redraw(); })]) },
      [abtn(this.prompt ? 'Tirar instrução' : 'Instrução no prompt', () => this.togglePrompt(), { primary: !S.done.v9a, hot: !S.done.v9a }), abtn('Fine-tuning +1', () => this.fine(1), { disabled: busy, hot: S.done.v9a && !S.done.v9b, primary: S.done.v9a }), abtn('+5', () => this.fine(5), { disabled: busy }), abtn('Desfazer', () => this.undo(), { disabled: busy || !this.ft })]
    ];
  },
  hs() { return [['Prompt', () => this.promptEl], ['Fine-tuning', () => this.wcol && this.wcol.closest('.sheet')]]; },
  guide() {
    if (!S.done.v9a) return { tip: 'Caminho 1: escreva uma instrução no prompt. Veja se o cadeado dos pesos abre.' };
    if (!S.done.v9b) return { tip: this.prompt ? 'Agora o caminho 2: fine-tuning. Treine até São Paulo passar de 50% mesmo sem a instrução.' : 'Treine com o fine-tuning até São Paulo passar de 50%.' };
    if (!S.done.v9c) return { tip: 'Confira “capital da França”: o fine-tuning mexeu nela também?' };
    return { tip: 'Prompt: rápido e sem mexer nos pesos. Fine-tuning: muda o modelo, com efeitos colaterais.' };
  }
});
