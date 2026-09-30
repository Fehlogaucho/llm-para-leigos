/* ============ Fase 5 · Neurônios e matrizes (3D, reaproveita o tabuleiro da v2) ============ */
const REASONS = [['Todas as somas de uma vez', 'Com uma única conta, a tabela faz todas as somas de votos ao mesmo tempo, como você fez à mão, só que com milhões de linhas.'], ['Tudo vira número', 'Palavras viram listas de números. Aí a mesma conta serve para comparar e combinar sentidos.'], ['Dá para ajustar aos pouquinhos', 'Mexer um tiquinho num peso muda o resultado um tiquinho. Assim o treino descobre para que lado girar cada botão.'], ['As placas de vídeo adoram', 'As placas de vídeo fazem milhares dessas contas ao mesmo tempo. É o mesmo chip que desenha os jogos 3D.'], ['Dá para empilhar', 'O resultado de uma tabela vira a entrada da próxima. Empilhando muitas, o modelo aprende padrões cada vez mais complexos.']];
{
  const P = PHASES[PHASES.length - 1];
  Object.assign(P, {
    kind: '3d', name: 'Matrizes', title: 'Neurônios e matrizes', era: '1850 · a matriz | 1943 · o neurônio', act: 'Como funciona, peça por peça', badge: 'Domador de matrizes',
    view: [[0.5, 6.4, 5.8], [0.4, 0.4, 0.1]], mview: [[0.5, 7.6, 7.4], [0.4, 0.4, 0.1]],
    brief: { see: 'Por dentro, uma LLM é feita de tabelas de números, as matrizes. Na mesa, cada linha é uma resposta possível e cada coluna é uma pista da pergunta. A resposta com mais votos vence.', goal: 'Ser a matriz: escolher os pesos para que cada pergunta dê a resposta certa, e descobrir por que as matrizes são perfeitas para as LLMs.', key: 'Matriz', first: 'Toque no quadrado que a seta aponta e veja o placar de votos mudar.' },
    missions: [
      { id: 'p4b', text: 'Seja a matriz: faça as 3 perguntas acertarem', short: 'máquina de votos' },
      { id: 'p4c', text: 'Gire a cena e veja a matriz da câmera mudar ao vivo', short: 'matriz ao vivo' },
      { id: 'p4r', text: 'Leia os 5 motivos de as LLMs usarem matrizes', short: 'motivos' }],
    steps: [{ k: 'votos', l: 'Seja a matriz', m: ['p4b'] }, { k: 'porque', l: 'Por que matrizes?', m: ['p4r', 'p4c'] }],
    stepKey() { return this.mode; }, goStep(k) { this.setMode(k); },
    challenge: { q: 'Quem deu o nome “matriz” à tabela de números?', o: ['James Joseph Sylvester, em 1850', 'Isaac Newton, em 1687', 'Alan Turing, em 1950'], a: 0, why: 'Sylvester escolheu a palavra latina para o lugar onde algo é gerado.' },
    reason: 0,
    hs() { return [['Matriz', () => this.mode === 'votos' ? this.board : null, [0, 0.9, 0]], ['Neurônio', () => this.mode === 'votos' ? this.board : null, [-2.4, 0.9, 0]], ['GPU', () => this.mode === 'porque' ? this.wcube : null, [0, 1.3, 0]]]; },
    actions() {
      const rows = [];
      if (this.mode === 'votos') { rows.push({ wrap: true, label: 'Pergunta', items: this.tests.map((t, i) => chip(`${this.passes(t) ? '✓' : i + 1} ${t.t}`, this.ti === i, () => { this.ti = i; this.updateBoard(); }, this.passes(t))) }, [abtn('Zerar pesos', () => { this.Wv = this.Wv.map(r => r.map(() => 0)); this.updateBoard(); })]); }
      if (this.mode === 'porque') rows.push([!S.done.p4c ? abtn('Girar a cena ⟳', () => { camOrbit(40); const ok = live(this); setTimeout(() => { if (ok() && !S.done.p4c) { complete('p4c'); HUD.refresh(); } }, 1300); }, { primary: true, hot: true }) : null, abtn(`Motivo ${this.reason + 1} de 5 · próximo ▶`, () => { this.reason = (this.reason + 1) % REASONS.length; this.showReason(); }, { hot: S.done.p4c && !S.done.p4r })]);
      return rows;
    },
    showReason() { const [t, x] = REASONS[this.reason]; this.seenR = this.seenR || new Set(); this.seenR.add(this.reason); if (this.seenR.size >= REASONS.length) complete('p4r'); balloon('why', this.wcube, `<p><b>${this.reason + 1}. ${t}</b></p><p>${x}</p>`, { kind: 'quest', say: `${t}. ${x}`, yOff: 0.4 }); HUD.refresh(); }
  });
  const b0 = P.build; P.build = function (s) { b0.call(this, s); this.mode = 'votos'; const yl = this.why.children[this.why.children.length - 1]; if (yl) yl.position.y = 0.15; };
  P.mview = [[0.15, 5.6, 4.6], [0.15, -0.2, -0.75]];
  P.helpCell = function () { const t = this.tests.find(x => !this.passes(x)); if (!t) return null; const lit = t.x.map((v, c) => v ? c : -1).filter(c => c >= 0);
    const up = lit.filter(c => this.Wv[t.a][c] < 2).sort((a, b) => this.Wv[t.a][a] - this.Wv[t.a][b])[0]; if (up != null) return [t.a, up];
    const sc = this.scores(t.x); let rv = -1; sc.forEach((v, r) => { if (r !== t.a && (rv < 0 || v > sc[rv])) rv = r; }); const c = lit.find(c => this.Wv[rv][c] > 0); return c != null ? [rv, c] : null; };
  const g0 = P.guide; P.guide = function () {
    if (this.mode === 'porque') return { tip: S.done.p4c ? 'Viu os números mudarem? Agora leia os 5 motivos nos botões lá embaixo.' : 'Aperte “Girar a cena” ou arraste o dedo na cena e veja os números da tabela mudarem.' };
    if (this.mode !== 'votos') return g0.call(this);
    const t = this.tests[this.ti]; if (this.tests.every(x => this.passes(x))) return { tip: 'As três perguntas acertam! Você fez à mão o trabalho que o treinamento faz sozinho.' };
    const hc = this.helpCell(); const tile = hc ? this.cellM[hc[0]][hc[1]] : null; const cell = tile ? (this._gv = this._gv || new THREE.Vector3(), tile.getWorldPosition(this._gv), this._gv.set(this._gv.x, 0.05, this._gv.z + 0.5)) : null; const lit = this.colsN.filter((c, i) => t.x[i]).join(' e ');
    return { target: cell, tip: this.passes(t) ? 'Esta pergunta já acerta. Veja as outras nos botões.' : `Faça “${this.rows[t.a]}” ter mais votos. Só contam as colunas acesas (${lit}). Toque no quadrado que a seta aponta.` };
  };
  P.p5card = function () {
    let el = $('#p5card'); if (this.mode !== 'votos' || E.phase !== this) { if (el) el.remove(); return; }
    if (!el) { el = h('div', { class: 'p5card', id: 'p5card', 'aria-live': 'polite' }); $('#stage').append(el); }
    const t = this.tests[this.ti]; const sc = this.scores(t.x); const mx = Math.max(...sc); const uniq = sc.filter(v => v === mx).length === 1; const lit = this.colsN.map((c, i) => i).filter(i => t.x[i]);
    const f = w => (w > 0 ? '+' : w < 0 ? '−' : '') + Math.abs(w);
    el.innerHTML = ''; el.append(h('p', { class: 'p5q' }, h('span', { class: 'p5n' }, `Pergunta ${this.ti + 1} de 3`), ` “${t.t}” → deve vencer `, h('b', null, this.rows[t.a])),
      h('div', { class: 'p5m' }, this.rows.map((rn, r) => h('div', { class: 'p5r' + (r === t.a ? ' goal' : '') + (uniq && sc[r] === mx ? ' win' : '') }, h('b', null, rn), h('span', null, ' = ' + lit.map(c => `${this.colsN[c]} ${f(this.Wv[r][c])}`).join(' + ') + ' = '), h('b', { class: 'tot' }, f(sc[r])), uniq && sc[r] === mx ? h('span', { class: 'crown' }, r === t.a ? ' ✓ vence' : ' vence') : null))),
      h('p', { class: 'p5h' }, `Cada linha funciona como um neurônio: soma os pesos das colunas acesas e dá um voto. Toque num quadrado para trocar o peso: 0 → +1 → +2 → −1.`),
      h('p', { class: 'p5s' }, this.tests.map((q, i) => h('span', { class: this.passes(q) ? 'ok' : '' }, `${i + 1} ${this.passes(q) ? '✓' : '✗'}`))));
  };
  after(P, 'makeLive', function () { const b = $('#liveMatrix'); if (b) b.append(h('p', { class: 'lm-c' }, 'Estes 16 números dizem à placa de vídeo onde desenhar cada ponto da cena.')); });
  after(P, 'exit', function () { const el = $('#p5card'); if (el) el.remove(); });
  after(P, 'setMode', function () { unballoon('stop'); unballoon('why'); unballoon('vt'); this.p5card();
    if (this.mode === 'votos') { const [p, t] = isMobile() ? this.mview : [[0.4, 6.2, 6.6], [0.4, 0.2, -0.9]]; flyTo(p, t, 900); }
    if (this.mode === 'porque') { setTimeout(() => { this.camStart = null; }, 1150);
      if (!this.ctlHook && E.controls) { this.ctlHook = true; E.controls.addEventListener('end', () => { if (E.phase === this && this.mode === 'porque' && !S.done.p4c) { complete('p4c'); HUD.refresh(); } }); } }
    if (this.mode === 'votos' && !this.saidV) { this.saidV = true; }
    if (this.mode === 'porque') { this.showReason(); if (!this.saidP) { this.saidP = true; TG.say('Aperte “Girar a cena” ou arraste o dedo na cena: a tabela no canto é a matriz que a placa de vídeo usa para desenhar tudo na sua tela!'); } }
    HUD.refresh(); });
  after(P, 'updateBoard', function () { this.p5card();
    const cur = this.tests[this.ti]; const nf = this.tests.findIndex(t => !this.passes(t));
    if (this.passes(cur) && nf >= 0 && !this.swT) { this.swT = setTimeout(() => { this.swT = null; if (E.phase !== this || this.mode !== 'votos') return; const k = this.tests.findIndex(t => !this.passes(t)); if (k < 0 || this.passes(this.tests[k]) || !this.passes(this.tests[this.ti])) return; this.ti = k; TG.say(`Acertou essa! Agora a pergunta ${k + 1}: “${this.tests[k].t}”. Cuidado para não desfazer as outras.`); this.updateBoard(); }, 1100); }
    if (this.tests.every(t => this.passes(t)) && !this.saidAll) { this.saidAll = true; balloon('vt', this.board, '<p><b>As 3 perguntas acertam!</b></p><p>Você fez à mão o que o treinamento faz sozinho, com bilhões de pesos.</p>', { kind: 'ok', ttl: 7000, say: 'As três perguntas acertam! Você fez à mão o que o treinamento faz sozinho.', yOff: 1.4 }); } HUD.refresh(); });
  P.drawInfo = function () { HUD.refresh(); };
}
