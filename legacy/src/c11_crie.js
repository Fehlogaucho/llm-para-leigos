/* ============ Fase 11 · Crie sua LLM ============ */
PHASES.push({
  kind: '2d', name: 'Crie sua LLM', title: 'Laboratório: a sua própria LLM', era: 'uma rede neural de verdade, no seu navegador', act: 'Ajustar, buscar e criar', badge: 'Criador de IA',
  brief: { see: 'Agora é com você: escolher os textos, montar o vocabulário, treinar uma pequena rede neural de verdade e fazer uma pergunta, acompanhando cada etapa por dentro.', goal: 'Criar, treinar e testar a sua própria mini LLM, juntando tudo o que você viu nas fases anteriores.', key: 'Janela de contexto', first: 'Toque nas frases para ligar ou desligar. Depois aperte “Montar vocabulário”.' },
  missions: [
    { id: 'v11a', text: 'Escolha os dados e monte o vocabulário', short: 'vocabulário' },
    { id: 'v11b', text: 'Treine até acertar as capitais nas perguntas-teste', short: 'treinada' },
    { id: 'v11c', text: 'Faça uma pergunta e acompanhe todas as etapas até a resposta', short: 'passo a passo' }],
  steps: [{ k: 'dados', l: 'Dados', m: ['v11a'] }, { k: 'vocab', l: 'Vocabulário', m: ['v11a'] }, { k: 'treino', l: 'Treinar', m: ['v11b'] }, { k: 'perguntar', l: 'Perguntar', m: ['v11c'] }],
  stepKey() { return this.step; }, goStep(k) { this.step = k; this.render(); HUD.refresh(); },
  challenge: { q: 'Com memória de só 1 token, por que a sua LLM erra a capital?', o: ['Ela esquece de qual país você falou', 'Ela não tem vocabulário', 'Ela não sabe fazer contas'], a: 0, why: 'Depois de “é”, ela não enxerga mais “Brasil” ou “França”. Por isso a janela de contexto importa.' },
  defaults: ['A capital do Brasil é Brasília .', 'Brasília é a capital do Brasil .', 'Qual é a capital do Brasil ? Brasília .', 'A capital da França é Paris .', 'Paris é a capital da França .', 'Qual é a capital da França ? Paris .', 'A capital da Itália é Roma .', 'Qual é a capital da Itália ? Roma .', 'O Brasil é famoso pelo futebol .', 'O Brasil é famoso pelo samba .'],
  extras: [['+ Frase sobre Portugal', 'A capital de Portugal é Lisboa .'], ['+ Pergunta sobre Portugal', 'Qual é a capital de Portugal ? Lisboa .'], ['+ Uma frase errada', 'A capital do Brasil é São Paulo .']],
  probes: [{ q: 'Qual é a capital do Brasil ?', a: 'Brasília' }, { q: 'A capital da França é', a: 'Paris' }, { q: 'A capital da Itália é', a: 'Roma' }, { q: 'O Brasil é famoso pelo', a: null }],
  STAGES: [['tokens', 'Tokens'], ['ids', 'IDs'], ['janela', 'Memória'], ['emb', 'Embeddings'], ['neur', 'Neurônios'], ['prob', 'Probabilidades'], ['escolha', 'Escolha']],
  build2d(root) {
    this.step = 'dados'; this.win = 3; this.corpus = this.defaults.map(s => ({ s, on: true })); this.lm = null; this.lossHist = []; this.busy = false; this.pipe = null; this.babble = null;
    this.inner = scene2d(this, root, [{ c: 'anil', x: .15, y: .2, r: .5 }, { c: 'mata', x: .9, y: .5, r: .45 }, { c: 'ipe', x: .3, y: .98, r: .45 }]);
    const base = this.onShow; this.onShow = () => { base(); this.drawCanvases(); };
    this.m3host = h('div', { class: 'm3 gal3', role: 'img', 'aria-label': 'Galáxia 3D das palavras da sua LLM: cada palavra fica no ponto dado pelos seus 3 números' });
    this.render();
  },
  m3opts: { cam: [0, 1.0, 6.4], look: [0, 0, 0], fov: 34 },
  m3build(M) {
    const g = new THREE.Group(); M.scene.add(g); this.gal = g; this.galLm = null; this.galNodes = new THREE.Group(); g.add(this.galNodes);
    const ax = new THREE.LineBasicMaterial({ color: P3.ink, transparent: true, opacity: 0.35 });
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(d => { const L = 2.1; g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-d[0] * L, -d[1] * L, -d[2] * L), new THREE.Vector3(d[0] * L, d[1] * L, d[2] * L)]), ax)); });
    const core = inked(new THREE.SphereGeometry(0.07, 12, 8), P3.ink, { ink: false }); g.add(core);
    M.ticks.push((dt, t) => { g.rotation.y += dt * (this.busy ? 0.5 : 0.22); g.rotation.x = 0.18 + Math.sin(t * 0.3) * 0.06;
      for (const n of this.galNodes.children) { const u = n.userData; if (u.to) n.position.lerp(u.to, Math.min(1, dt * 5)); } });
    this.galSync();
  },
  galSync() {
    const lm = this.lm, M = this.M3; if (!this.gal || !M) return;
    if (this.galLm !== lm) { this.galLm = lm; clear3(this.galNodes); if (!lm) return;
      lm.vocab.forEach((t, i) => { if (i < 3 || /^[^\p{L}]$/u.test(t)) return;
        const col = ['Brasília', 'Paris', 'Roma', 'Lisboa', 'São', 'Paulo'].includes(t) ? 'ipe' : ['Brasil', 'França', 'Itália', 'Portugal'].includes(t) ? 'anil' : 'mata';
        const n = new THREE.Group(); const b = inked(new THREE.SphereGeometry(0.1, 16, 12), P3[col], { ink: 1.18 }); n.add(b);
        const s = m3Sprite(t, 0.27, { size: 28, bg: col === 'ipe' ? '#F7D78A' : col === 'anil' ? '#D4DEF5' : '#FBFAF5' }); s.position.y = 0.24; n.add(s);
        n.userData = { i, to: new THREE.Vector3() }; this.galNodes.add(n); });
    }
    if (!lm) return; const R = 1.9;
    for (const n of this.galNodes.children) { const e = lm.E[n.userData.i]; n.userData.to.set(Math.tanh(e[0] / 1.6) * R, Math.tanh(e[1] / 1.6) * R, Math.tanh(e[2] / 1.6) * R); if (!n.userData.placed) { n.position.copy(n.userData.to); n.userData.placed = true; } }
  },
  active() { return this.corpus.filter(c => c.on).map(c => c.s); },
  invalidate() { this.lm = null; this.pipe = null; this.lossHist = []; this.babble = null; },
  render() {
    const v = this.inner; v.innerHTML = ''; clearBalloons(); const lm = this.lm;
    if (this.step === 'dados') {
      v.append(h('p', { class: 'note' }, 'Tudo o que a sua LLM souber virá destas frases.'));
      this.linesEl = h('div', { class: 'sheet pad lines tl' }, this.corpus.map(c => h('button', { class: 'ln ' + (c.on ? 'on' : 'off'), 'aria-pressed': c.on ? 'true' : 'false', onclick: () => { c.on = !c.on; this.invalidate(); SND.play('pop'); this.render(); HUD.refresh(); } }, h('span', { class: 'cb' }, c.on ? '✓' : ''), h('span', null, c.s.replace(/ ([.?])/g, '$1')))));
      v.append(this.linesEl, h('p', { class: 'small muted', style: 'text-align:center;margin:0' }, `Memória: a LLM vai olhar os últimos ${this.win} token${this.win > 1 ? 's' : ''} para prever o próximo.` + (this.win === 1 ? ' Com 1 só, ela esquece de qual país a frase fala.' : '')));
    }
    if (this.step === 'vocab') {
      if (!lm) { v.append(h('p', { class: 'note' }, 'Ainda não há vocabulário. Aperte o botão azul.')); return; }
      this.vocabEl = h('div', { class: 'sheet pad vocab tl' }, lm.vocab.map((t, i) => h('span', { class: 'tk rise ' + (i < 3 ? 'c5' : 'c' + (i % 5)), style: `animation-delay:${Math.min(1.2, i * 0.03)}s` }, t, h('small', null, '#' + i))));
      v.append(h('p', { class: 'note' }, `O tokenizador achou ${lm.V - 3} tokens diferentes, mais 3 especiais.`), this.vocabEl,
        h('div', { class: 'stats' }, h('div', null, h('b', null, String(lm.V)), h('small', null, 'tokens no vocabulário')), h('div', null, h('b', null, String(lm.pairs.length)), h('small', null, 'exercícios de adivinhar a próxima')), h('div', null, h('b', null, lm.params.toLocaleString('pt-BR')), h('small', null, 'pesos para ajustar'))),
        h('p', { class: 'small muted', style: 'text-align:center;margin:0' }, `O GPT-3 tinha 175 bilhões de parâmetros: uns ${Math.round(175e9 / lm.params / 1e6).toLocaleString('pt-BR')} milhões de vezes mais.`));
    }
    if (this.step === 'treino') {
      if (!lm) { v.append(h('p', { class: 'note' }, 'Monte o vocabulário primeiro.')); return; }
      this.lossCv = h('canvas', { class: 'canvas2d', style: 'height:86px', 'aria-label': 'Erro médio por época' });
      this.mapCv = h('canvas', { class: 'canvas2d', style: 'height:170px', 'aria-label': 'Mapa das palavras da sua LLM' });
      this.probesEl = h('div', { class: 'probes' });
      v.append(h('div', { class: 'sheet pad col2 tl' }, h('div', { class: 'row2', style: 'justify-content:space-between' }, h('span', { class: 'lbl' }, 'Erro médio: quanto ela erra, em média'), h('span', { class: 'pill2' }, `época ${lm.epochs}`)), this.lossCv, h('p', { class: 'small muted', style: 'margin:0' }, 'Cada época é uma leitura completa de todas as frases de treino.')),
        h('div', { class: 'sheet pad col2 tr' }, h('span', { class: 'lbl' }, this.no3d ? 'Mapa das palavras (2 dos 3 números de cada uma)' : 'Galáxia das palavras (os 3 números de cada uma)'), this.no3d ? this.mapCv : this.m3host),
        h('div', { class: 'sheet pad col2 tl' }, h('span', { class: 'lbl' }, 'Perguntas-teste'), this.probesEl),
        this.babble ? h('p', { class: 'note' }, `Ela escreveu: “${this.babble}”`) : null,
        lm.epochs >= 30 && this.corpus.some(c => c.on && c.s === 'A capital do Brasil é São Paulo .') ? h('p', { class: 'small muted', style: 'margin:0;text-align:center' }, 'Com a frase errada, Brasília ainda vence: ela aparece em mais frases do que São Paulo. A LLM segue a maioria dos exemplos.') : null);
      this.drawProbes(); requestAnimationFrame(() => this.drawCanvases());
    }
    if (this.step === 'perguntar') {
      if (!lm) { v.append(h('p', { class: 'note' }, 'Monte o vocabulário primeiro.')); return; }
      const P = this.pipe;
      if (!P) { v.append(h('p', { class: 'note' }, lm.epochs ? `Sua LLM estudou ${lm.epochs} épocas. Faça uma pergunta nos botões.` : 'Sua LLM ainda não treinou. Pergunte assim mesmo para ver o chute!')); return; }
      const pipe = h('div', { class: 'pipe' }, this.STAGES.map(([k, t], i) => h('span', { class: i === P.stage ? 'on' : i < P.stage || P.done ? 'past' : '' }, t))); v.append(pipe);
      requestAnimationFrame(() => { const on = pipe.querySelector('.on'); if (on) pipe.scrollTo({ left: Math.max(0, on.offsetLeft - pipe.clientWidth / 2 + on.offsetWidth / 2), behavior: 'smooth' }); });
      v.append(this.stageView());
    }
  },
  stageView() {
    const P = this.pipe, lm = this.lm; const st = P.stage >= 0 ? this.STAGES[P.stage][0] : 'tokens'; const all = [...P.toks, ...P.gen]; const ids = all.map(t => lm.id(t));
    const winStart = Math.max(0, all.length - lm.win);
    const row = h('div', { class: 'sent' }, all.map((t, i) => { const known = lm.vocab.includes(t); const gen = i >= P.toks.length; const inWin = i >= winStart;
      return h('span', { class: 'ptok' }, chipTok(known ? t : '⟨?⟩', gen ? 'y' : !known ? 'c3' : 'c' + (i % 2 ? 2 : 0), { extra: (st === 'janela' || st === 'emb' || st === 'neur') && !inWin ? 'dim' : '' }), st !== 'tokens' ? h('small', null, '#' + ids[i]) : null); }));
    const box = h('div', { class: 'sheet pad col2 tl' }, row); this.rowEl = box;
    const T = {
      tokens: `Sua frase virou ${all.length} tokens.` + (all.some(t => !lm.vocab.includes(t)) ? ' Os vermelhos ela nunca viu e viram ⟨?⟩.' : ''),
      ids: 'Cada token vira o seu número no vocabulário.',
      janela: `Ela só enxerga os últimos ${lm.win} tokens (os acesos)${all.length < lm.win ? ' e completa com ⟨início⟩' : ''}.`,
      emb: 'Cada token da memória busca a sua lista de 3 números, o embedding.',
      neur: `Os ${lm.win * 3} números (${lm.win} token${lm.win > 1 ? 's' : ''} × 3 números) passam por uma matriz e acendem 12 neurônios: cada bolinha é um neurônio, e a cor mostra o quanto ele acendeu.`,
      prob: 'Uma segunda matriz dá um placar para cada token, e uma conta (o softmax) transforma os placares em chances.',
      escolha: P.lastPick ? (P.lastPick.word === '⟨fim⟩' ? `O favorito foi ⟨fim⟩: ela decidiu que a resposta acabou.` : `Venceu “${P.lastPick.word}” (${fmtPct(P.lastPick.p, 0)}). Ele entra no texto e tudo recomeça.`) : ''
    };
    const vis = h('div', { class: 'sheet pad col2 tr rise' }, h('p', { class: 'lbl', style: 'margin:0' }, `${P.stage + 1}. ${this.STAGES[Math.max(0, P.stage)][1]}`), h('p', { style: 'margin:0' }, T[st]));
    const ctx = lm.ctxOf(ids); const f = this.lastF || lm.fwd(ctx);
    if (st === 'emb') vis.append(h('div', { class: 'col2' }, ctx.map(i => h('div', { class: 'row2' }, chipTok(lm.vocab[i], 'c0'), h('span', { class: 'mono small' }, '[' + lm.E[i].map(x => x.toFixed(2).replace('.', ',')).join('; ') + ']')))));
    if (st === 'neur') vis.append(h('div', { class: 'neur' }, f.h.map(a => h('i', { style: `background:${wCss(a, 1)};transform:scale(${(0.8 + Math.abs(a) * 0.35).toFixed(2)})` }))));
    if (st === 'prob' || st === 'escolha') { const bars = mkBars(); const top = f.p.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]).slice(0, 5); bars.set(top.map(([p, i], k) => ({ t: lm.vocab[i], p, cls: k === 0 ? 'win' : '' }))); vis.append(bars.el); }
    if (P.done) vis.append(h('p', { class: 'ttl', style: 'font-size:24px;margin-top:4px' }, P.gen.filter(t => t !== '⟨fim⟩').length ? `Resposta: ${P.gen.filter(t => t !== '⟨fim⟩').join(' ')}` : 'Ela preferiu não responder.'));
    return h('div', { class: 'col2' }, box, vis);
  },
  drawProbes() {
    const el = this.probesEl, lm = this.lm; if (!el || !lm) return; el.innerHTML = '';
    this.probes.forEach(p => { const r = this.probe(p); el.append(h('div', null, h('span', { class: 'mono', style: 'font-size:12.5px' }, p.q + ' →'), r.valid ? h('span', { class: 'pill2 ' + (r.ok === true ? 'g' : r.ok === false ? 'r' : 'y') }, `${r.tok} ${fmtPct(r.p, 0)}`) : h('span', { class: 'pill2 r' }, 'fora do vocabulário'))); });
  },
  drawCanvases() {
    const lm = this.lm; if (!lm) return;
    if (this.lossCv && this.lossCv.isConnected && this.lossCv.clientWidth) drawChart(this.lossCv, [{ data: this.lossHist.length ? this.lossHist : [0], color: cssVar('--anil') }], { maxY: 3.2, ticks: [0, 1, 2, 3], fmt: x => x.toFixed(0), xlabel: 'épocas →' });
    this.galSync();
    const cv = this.mapCv; if (!cv || !cv.isConnected || !cv.clientWidth) return;
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr; const x = cv.getContext('2d'); x.scale(dpr, dpr); x.clearRect(0, 0, W, H);
    const ink = cssVar('--ink'); x.font = `700 12px ${FONT.body}`; x.textAlign = 'center';
    lm.vocab.forEach((t, i) => { if (i < 3 || /^[^\p{L}]$/u.test(t)) return; const e = lm.E[i]; const px = W / 2 + Math.tanh(e[0] / 1.6) * (W / 2 - 30), py = H / 2 + Math.tanh(e[1] / 1.6) * (H / 2 - 18);
      const col = ['Brasília', 'Paris', 'Roma', 'Lisboa', 'São', 'Paulo'].includes(t) ? '--ipe' : ['Brasil', 'França', 'Itália', 'Portugal'].includes(t) ? '--anil' : '--mata';
      x.fillStyle = cssVar(col); x.beginPath(); x.arc(px, py, 5.5, 0, 7); x.fill(); x.strokeStyle = ink; x.lineWidth = 1.5; x.stroke(); x.fillStyle = ink; x.fillText(t, px, py - 9); });
  },
  buildVocab() { const sents = this.active(); if (!sents.length) { toast('Ligue pelo menos uma frase.'); return; } this.lm = new MiniLM(sents, this.win); this.lossHist = []; this.pipe = null; this.babble = null; complete('v11a'); SND.play('ok'); this.step = 'vocab'; this.render(); HUD.refresh(); },
  probe(p) { const lm = this.lm; const toks = lmTokenize(p.q); const unknown = toks.filter(t => !lm.vocab.includes(t)); const r = lm.predict(toks); const bi = r.p.indexOf(Math.max(...r.p)); return { tok: lm.vocab[bi], p: r.p[bi], ok: p.a ? lm.vocab[bi] === p.a : null, valid: !unknown.length && (!p.a || lm.vocab.includes(p.a)), r }; },
  checkTrained() { if (!this.lm || this.lm.epochs < 30) return; const res = this.probes.filter(p => p.a).map(p => this.probe(p)).filter(r => r.valid); if (res.length && res.every(r => r.ok)) { if (!S.done.v11b) { complete('v11b'); TG.say('Treinada! Agora vá para “Perguntar” e veja cada etapa por dentro da sua LLM.'); } } },
  async train(n) {
    if (!this.lm || this.busy) return; this.busy = true; this.stopReq = false; HUD.refresh(); const ok = live(this); SND.play('train'); let done = 0;
    while (done < n && !this.stopReq) {
      const per = Math.min(3, n - done); let L = 0; for (let k = 0; k < per; k++) L = this.lm.epoch(0.08); done += per; this.lossHist.push(L);
      if (done % 12 === 0 || done >= n) { this.drawCanvases(); this.drawProbes(); const pe = this.inner.querySelector('.pill2'); if (pe) pe.textContent = `época ${this.lm.epochs}`; }
      await new Promise(r => requestAnimationFrame(r)); if (!ok()) return;
    }
    this.busy = false; this.checkTrained(); this.render(); HUD.refresh();
  },
  genBabble() { const lm = this.lm; if (!lm) return; const out = []; let ids = []; for (let k = 0; k < 14; k++) { const r = lm.fwd(lm.ctxOf(ids)); const i = sampleIdx(r.p.map(p => ({ p }))); if (i === 1) break; if (i === 0) continue; out.push(lm.vocab[i]); ids.push(i); } this.babble = out.join(' ') || '(nada)'; SND.play('pop'); this.render(); TG.say(`Ela escreveu: “${this.babble}”. ` + (lm.epochs < 30 ? 'Sem treino, sai quase só bagunça.' : 'Frases no estilo dos dados de treino!')); },
  startAsk(q) { if (!this.lm || this.busy) return; const toks = lmTokenize(q); if (!toks.length) return; this.pipe = { q, toks, gen: [], stage: -1, auto: false, done: false }; this.lastF = null; this.nextStage(); },
  async nextStage() {
    const P = this.pipe; if (!P || P.done || this.busy) return; this.busy = true; const ok = live(this);
    P.stage++; if (P.stage >= this.STAGES.length) { P.stage = 0; this.lastF = null; }
    const st = this.STAGES[P.stage][0]; const lm = this.lm; SND.play(st === 'escolha' ? 'drop' : 'pop');
    const ids = [...P.toks, ...P.gen].map(t => lm.id(t)); const ctx = lm.ctxOf(ids);
    if (st === 'neur' || st === 'prob') this.lastF = lm.fwd(ctx);
    if (st === 'escolha') { const f = this.lastF || lm.fwd(ctx); const bi = f.p.indexOf(Math.max(...f.p)); const word = lm.vocab[bi]; P.lastPick = { word, p: f.p[bi] };
      if (bi === 1 || P.gen.length >= 9) { P.done = true; if (bi !== 1) P.gen.push(word); complete('v11c'); } else P.gen.push(word); }
    this.render(); HUD.refresh(); this.busy = false;
    if (P.auto && !P.done) { await wait(REDUCED ? 40 : st === 'escolha' ? 300 : 420); if (ok() && this.pipe === P) this.nextStage(); }
  },
  autoRun() { if (!this.pipe || this.pipe.done) return; this.pipe.auto = true; if (!this.busy) this.nextStage(); },
  addSent(t) { const norm = lmTokenize(t).join(' '); if (!this.corpus.some(c => c.s === norm)) this.corpus.push({ s: norm, on: true }); this.invalidate(); SND.play('pop'); this.render(); HUD.refresh(); },
  actions() {
    const rows = []; const lm = this.lm, busy = this.busy;
    if (this.step === 'dados') {
      rows.push({ label: 'Adicionar', items: this.extras.map(([l, t]) => chip(l, this.corpus.some(c => c.s === t), () => this.addSent(t))).concat([chip('✎ Minha frase', false, () => askText('Escreva uma frase curta', '', v => this.addSent(v), { kicker: 'Dados de treino' }))]) });
      rows.push({ label: 'Memória', items: [1, 2, 3].map(n => chip(`${n} token${n > 1 ? 's' : ''}`, this.win === n, () => { this.win = n; this.invalidate(); this.render(); })) });
      if (!(S.done.v11a && lm)) rows.push([abtn('Montar vocabulário →', () => this.buildVocab(), { primary: true, hot: true })]);
    }
    if (this.step === 'vocab' && !lm) rows.push([abtn('Montar vocabulário', () => this.buildVocab(), { primary: true, hot: true })]);
    if (this.step === 'treino' && lm) rows.push([abtn('Treinar: 300 épocas', () => this.train(300), { primary: true, disabled: busy, hot: !S.done.v11b }), abtn('+30', () => this.train(30), { disabled: busy }), busy ? abtn('Parar', () => { this.stopReq = true; }) : null, abtn('Escrever sozinha', () => this.genBabble(), { disabled: busy })]);
    if (this.step === 'perguntar' && lm) {
      const P = this.pipe;
      rows.push({ label: 'Perguntar', items: [['Capital do Brasil?', 0], ['Capital da França é', 1], ['Capital da Itália é', 2], ['Brasil é famoso pelo', 3]].map(([l, i]) => ({ ...chip(l, P && P.q === this.probes[i].q, () => this.startAsk(this.probes[i].q)), hot: i === 0 && !P && !S.done.v11c })) });
      rows.push([abtn('Digitar', () => askText('Pergunte à sua LLM', '', v => this.startAsk(v), { kicker: 'Sua LLM', help: 'Use palavras que estão nos dados de treino.' }), { disabled: busy }), P ? abtn(P.done ? 'Resposta completa' : 'Próxima etapa →', () => this.nextStage(), { primary: true, disabled: P.done || busy || P.auto, hot: !P.done && !P.auto }) : null, P ? abtn('Rodar até o fim', () => this.autoRun(), { disabled: P.done || P.auto }) : null]);
    }
    return rows;
  },
  hs() { return this.step === 'dados' ? [['Janela de contexto', () => this.linesEl]] : this.step === 'treino' ? [['Época', () => this.lossCv]] : this.step === 'perguntar' && this.pipe ? [['Neurônio', () => this.rowEl]] : []; },
  guide() {
    if (this.step === 'dados') return { tip: 'Estas são as frases que a sua LLM vai ler. Mude o que quiser e aperte “Montar vocabulário”.' };
    if (this.step === 'vocab') return { tip: this.lm ? `Seu vocabulário tem ${this.lm.V} tokens, cada um com um ID. Agora vamos treinar!` : 'Aperte “Montar vocabulário”.' };
    if (this.step === 'treino') return { tip: this.busy ? 'Olhe a galáxia: palavras usadas do mesmo jeito vão se aproximando!' : S.done.v11b ? 'Treinada! Aperte “Escrever sozinha” ou siga para “Perguntar”.' : 'Aperte “Treinar” e observe o erro cair: ela vai ler as frases 300 vezes.' };
    const P = this.pipe; if (!P) return { tip: 'Faça uma pergunta nos botões e acompanhe cada etapa dentro da sua LLM.' };
    if (P.done) return { tip: 'Pronto! Cada palavra passou pelas mesmas 7 etapas. Tente mudar a memória para 1 token nos dados.' };
    return { tip: P.auto ? 'Rodando todas as etapas para cada nova palavra…' : 'Aperte “Próxima etapa” para avançar, ou “Rodar até o fim”.' };
  }
});
