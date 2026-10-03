/* ============ Fase 6 · Treinamento (27 pesos de verdade) ============ */
function weightGrid(W) {
  const cells = []; const g = h('div', { class: 'wg', role: 'img', 'aria-label': '27 pesos do modelo' });
  MINI.V.forEach((t, i) => { g.append(h('span', { class: 'wl' }, t)); cells[i] = [0, 1, 2].map(d => { const c = h('i', { title: `${t} · dimensão ${d + 1}` }); g.append(c); return c; }); });
  return { el: g, set(Wm) { Wm.forEach((r, i) => r.forEach((v, d) => { cells[i][d].style.background = wCss(v, 2.2); })); }, flash(gr) { gr.forEach((r, i) => r.forEach((v, d) => { if (Math.abs(v) > 0.02) { const c = cells[i][d]; c.classList.add('pulse'); setTimeout(() => c.classList.remove('pulse'), 260); } })); } };
}
PHASES.push({
  kind: '2d', name: 'Treinamento', title: 'A academia dos pesos', era: '1958 · perceptron | 1986 · retropropagação', act: 'Como funciona, peça por peça', badge: 'Treinador',
  brief: { see: 'Um modelo nasce chutando. Treinar é mostrar exemplos, medir o erro e ajustar cada peso um pouquinho. Este mini-modelo tem 27 pesos e aprende de verdade.', goal: 'Treinar o modelo até ele responder Brasília com 90% de certeza e ver que os mesmos pesos respondem outras perguntas.', key: 'Treinamento', first: 'Aperte “Treinar 1 exemplo” e veja a certeza em Brasília subir.' },
  missions: [
    { id: 'v6a', text: 'Treine até “Brasília” passar de 50%', short: '50%' },
    { id: 'v6b', text: 'Chegue a 90% de certeza em “Brasília”', short: '90%' },
    { id: 'v6c', text: 'Depois de treinar, veja a pergunta sobre a França ou o futebol', short: 'mesmos pesos' }],
  challenge: { q: 'O que acontece a cada passo de treinamento?', o: ['O modelo compara a previsão com a resposta certa e ajusta os pesos', 'O modelo guarda a frase inteira numa tabela', 'Uma pessoa corrige cada peso à mão'], a: 0, why: 'Erro medido, direção calculada, pesos ajustados um pouquinho. Repetido bilhões de vezes.' },
  build2d(root) {
    this.W = MINI.init(); this.lr = 0.8; this.nsteps = 0; this.ki = 0; this.busy = false; this.exi = 0; this.hist = [[], [], []]; this.pushHist();
    const inner = scene2d(this, root, [{ c: 'mata', x: .1, y: .15, r: .5 }, { c: 'urucum', x: .9, y: .4, r: .4 }, { c: 'anil', x: .4, y: .98, r: .5 }]);
    this.ex = MINI.EX.map((e, i) => h('button', { class: 'exc', onclick: () => this.trainOne(i) }, e.s));
    this.qEl = h('div', { class: 'sheet pad qcard tl' }); this.grid = weightGrid(this.W); this.bars = mkBars();
    brain3(this, { W: () => this.W });
    this.chart = h('canvas', { class: 'canvas2d', style: 'height:92px', 'aria-label': 'Certeza na resposta certa ao longo do treino' });
    this.stepsEl = h('span', { class: 'pill2' });
    inner.append(h('div', { class: 'col2' }, h('p', { class: 'lbl', style: 'margin:0' }, 'Exemplos de treino · toque para treinar'), h('p', { class: 'small muted', style: 'margin:0' }, 'Cada passo: o modelo chuta, compara com a resposta certa e ajusta os 27 pesos um pouquinho.'), h('div', { class: 'excards' }, this.ex)), this.qEl,
      h('div', { class: 'sheet pad brainbox tr' }, h('div', { class: 'col2', style: 'align-items:center' }, h('span', { class: 'lbl' }, '27 pesos'), this.m3host), h('div', { class: 'col2', style: 'min-width:0' }, h('span', { class: 'lbl' }, 'Próxima palavra'), this.bars.el)),
      h('div', { class: 'col2' }, h('div', { class: 'row2', style: 'justify-content:space-between' }, h('span', { class: 'lbl' }, 'Certeza na resposta certa'), this.stepsEl), this.chart,
        h('div', { class: 'row2 small', style: 'gap:12px' }, h('span', null, h('b', { style: 'color:var(--ipe)' }, '━ '), 'Brasil → Brasília'), h('span', null, h('b', { style: 'color:var(--anil)' }, '━ '), 'França → Paris'), h('span', null, h('b', { style: 'color:var(--mata)' }, '━ '), 'Brasil → futebol'))));
    const base = this.onShow; this.onShow = () => { base(); this.drawChart(); };
    this.redraw();
  },
  render() { if (this.no3d && this.m3host.isConnected) this.m3host.replaceWith(this.grid.el); this.redraw(); },
  pushHist() { MINI.K.forEach((k, i) => this.hist[i].push(MINI.probs(this.W, k.x)[k.y])); },
  redraw() {
    const K = MINI.K[this.ki]; const p = MINI.probs(this.W, K.x); const top = p.indexOf(Math.max(...p)); this.p = p;
    this.qEl.innerHTML = ''; this.qEl.append(h('span', { style: 'font-size:16px' }, K.t.replace('___', '')), chipTok('?', 'c5', { extra: 'ghost' }), h('span', { class: 'qa', style: `color:var(${top === K.y ? '--mata' : '--urucum'})` }, `${MINI.V[K.y]} ${fmtPct(p[K.y], 0)}`));
    this.grid.set(this.W); if (this.cube) this.cube.userData.set(this.W);
    const order = p.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 6);
    this.bars.set(order.map(([v, i]) => ({ t: MINI.V[i], p: v, cls: i === K.y ? 'tgt' : i === top ? 'win' : '' })));
    this.stepsEl.textContent = `${this.nsteps} ${this.nsteps === 1 ? 'passo' : 'passos'}`;
    this.drawChart(); HUD.refresh();
  },
  drawChart() { if (this.chart && this.chart.clientWidth) drawChart(this.chart, [{ data: this.hist[0], color: cssVar('--ipe') }, { data: this.hist[1], color: cssVar('--anil') }, { data: this.hist[2], color: cssVar('--mata') }], { maxY: 1, ticks: [0, 0.5, 1], fmt: v => Math.round(v * 100) + '%', xlabel: 'passos →' }); },
  applyStep(e, single) {
    const pb0 = MINI.probs(this.W, MINI.K[0].x)[0];
    const r = MINI.step(this.W, MINI.exX(e), MINI.K[e.k].y, this.lr); this.nsteps++;
    if (single && e.k !== 0 && !this.saidTrade && MINI.probs(this.W, MINI.K[0].x)[0] < pb0 - 0.004) { this.saidTrade = true; setTimeout(() => { if (E.phase === this) TG.say(`Esse exemplo era sobre ${MINI.K[e.k].short}. Ajustar os pesos para essa resposta tirou um pouquinho de Brasília: os mesmos 27 pesos servem a todas as perguntas.`); }, 700); } this.pushHist(); this.grid.flash(r.g); if (this.cube) { this.cube.userData.flash(r.g); this.spin = Math.min(4, this.spin + 1.6); }
    const pb = MINI.probs(this.W, MINI.K[0].x)[0];
    if (pb >= 0.5 && !S.done.v6a) { complete('v6a'); balloon('t', this.qEl, '<p><b>Passou de 50%!</b></p><p>Os pesos estão aprendendo que Brasil + capital combina com Brasília.</p>', { kind: 'ok', ttl: 5000, say: 'Passou de cinquenta por cento!' }); }
    if (pb >= 0.9 && !S.done.v6b) { complete('v6b'); balloon('t', this.qEl, '<p><b>90% de certeza!</b></p><p>Agora toque em “capital da França”: os mesmos 27 pesos respondem outra pergunta.</p>', { kind: 'ok', ttl: 7000, say: 'Noventa por cento! Agora veja a pergunta sobre a França.' }); }
  },
  nextEx() { const e = MINI.EX[this.exi % MINI.EX.length]; this.exi++; return e; },
  async trainOne(i) {
    if (this.busy) return; this.busy = true; HUD.refresh(); const ok = live(this);
    const e = i != null ? MINI.EX[i] : this.nextEx(); const idx = MINI.EX.indexOf(e); const card = this.ex[idx];
    card.classList.remove('fly'); void card.offsetWidth; card.classList.add('fly'); SND.play('train'); await wait(REDUCED ? 60 : 650); if (!ok()) return;
    card.classList.remove('fly'); this.applyStep(e, true); this.busy = false; this.redraw();
  },
  async trainMany(n) {
    if (this.busy) return; this.busy = true; HUD.refresh(); const ok = live(this);
    for (let k = 0; k < n; k++) { this.applyStep(this.nextEx()); if (k % 2 === 1 || k === n - 1) { this.redraw(); if (k % 6 === 5) SND.play('train'); await wait(60); if (!ok()) return; } }
    this.busy = false; this.redraw();
  },
  reset() { if (this.busy) return; this.W = MINI.init(); this.nsteps = 0; this.hist = [[], [], []]; this.pushHist(); this.redraw(); },
  setK(i) { this.ki = i; if (i > 0 && this.nsteps >= 10) complete('v6c'); SND.play('pop'); this.redraw(); },
  actions() {
    const busy = this.busy;
    return [
      { label: 'Pergunta', items: MINI.K.map((k, i) => ({ ...chip(k.short, this.ki === i, () => this.setK(i)), hot: S.done.v6b && !S.done.v6c && i === 1 && this.ki !== 1 })) },
      [abtn('Treinar 1 exemplo', () => this.trainOne(), { disabled: busy, hot: this.nsteps === 0, primary: this.nsteps === 0 }), abtn('Treinar +10', () => this.trainMany(10), { primary: this.nsteps > 0, disabled: busy, hot: this.nsteps > 0 && !S.done.v6b }), abtn('+50', () => this.trainMany(50), { disabled: busy }), abtn('Recomeçar', () => this.reset(), { disabled: busy })]
    ];
  },
  hs() { return [['Backpropagation', () => this.bars.el.closest('.sheet')], ['Loss', () => this.chart]]; },
  guide() {
    const pb = MINI.probs(this.W, MINI.K[0].x)[0];
    if (!S.done.v6b) return { tip: this.nsteps === 0 ? 'Cada exemplo ajusta os 27 números. Os cubinhos que piscam levaram os maiores ajustes.' : `Brasília está com ${fmtPct(pb, 0)}. A meta é 90%. Use +10 para acelerar.` };
    if (!S.done.v6c) return { tip: 'Agora toque em “capital da França” nos botões: os mesmos 27 pesos respondem outra pergunta.' };
    return { tip: 'Uma LLM de verdade faz isso com bilhões de pesos, durante semanas, em milhares de placas de vídeo.' };
  }
});
