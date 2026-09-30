/* ============ Fase 4 · Tokens ============ */
const T_WORDS = [
  { w: 'Brasil?', cuts: [6], why: 'A pontuação costuma virar um token separado: [Brasil] [?].' },
  { w: 'infelizmente', cuts: [2, 7], why: 'Palavras longas ou menos comuns viram pedaços que aparecem muito nos textos, como na ideia de 1994 da fase 2: [in] [feliz] [mente].' },
  { w: 'capital', cuts: [], why: 'Palavras muito comuns costumam ser um token inteiro. Aqui, o certo era não cortar nada.' }];
const LAB_TEXTS = ['infelizmente', 'desenvolvimento', 'Qual é a capital do Brasil?', '123456789', 'Bom dia! 😀'];
PHASES.push({
  kind: '2d', name: 'Tokens', title: 'O fatiador de texto', era: '1994 e 2016 · palavras em pedaços', act: 'Como funciona, peça por peça', badge: 'Fatiador',
  brief: { see: 'Antes de adivinhar qualquer coisa, a LLM corta o texto em pedaços chamados tokens e troca cada pedaço por um número.', goal: 'Adivinhar onde a IA corta as palavras, transformar a pergunta em números e testar seus próprios textos.', key: 'Token', first: 'Toque nos vãos entre as letras para cortar onde você acha que a IA corta. Depois aperte Conferir.' },
  missions: [
    { id: 'v4a', text: 'Corte 3 palavras e compare com o corte da IA', short: 'fatiador' },
    { id: 'v4b', text: 'Transforme a pergunta em números (IDs)', short: 'IDs' },
    { id: 'v4c', text: 'No laboratório, ache uma palavra (ou número) que vire 3 tokens ou mais', short: 'laboratório' }],
  steps: [{ k: 'fatiar', l: 'Fatiar', m: ['v4a'] }, { k: 'ids', l: 'Números', m: ['v4b'] }, { k: 'lab', l: 'Laboratório', m: ['v4c'] }],
  stepKey() { return this.step; }, goStep(k) { this.showStep(k); },
  challenge: { q: 'Em quantos tokens a palavra “infelizmente” costuma virar?', o: ['1 token', '3 tokens: in + feliz + mente', '12 tokens, um por letra'], a: 1, why: 'Palavras longas viram pedaços que o modelo já conhece.' },
  build2d(root) {
    this.step = 'fatiar'; this.wi = 0; this.cuts = new Set(); this.result = null; this.checked = [false, false, false];
    this.toks = tokenize('Qual é a capital do Brasil?'); this.isId = this.toks.map(() => false); this.labText = 'Qual é a capital do Brasil?';
    this.inner = scene2d(this, root, [{ c: 'jaca', x: .1, y: .3, r: .5 }, { c: 'ipe', x: .85, y: .2, r: .45 }, { c: 'anil', x: .6, y: .95, r: .5 }]);
    this.m3host = h('div', { class: 'm3 short' });
    this.render();
  },
  m3opts: { cam: [0, 1.2, 8], look: [0, 0, 0], fov: 30, fit(M) { const P = E.phase; if (P && P.M3 === M && P.fit3) P.fit3(); } },
  m3build(M) {
    this.row3 = new THREE.Group(); M.scene.add(this.row3); this.k3 = null; this._v = new THREE.Vector3();
    this.m3host.querySelectorAll('.gpo').forEach(e => e.remove()); this.gpo = h('div', { class: 'gpo' }); this.m3host.append(this.gpo);
    M.ticks.push((dt, t) => { this.row3.rotation.y = Math.sin(t * 0.5) * 0.05; this.placeGaps(); });
  },
  sync3d() {
    const M = this.M3; if (!M || !this.row3) return;
    if (this.step === 'fatiar') {
      const W = T_WORDS[this.wi]; const key = 'w' + this.wi + (this.result ? 'r' : '');
      if (this.k3 !== key) { this.k3 = key; clear3(this.row3); M.picks = M.picks.filter(p => p.parent); const chars = [...W.w]; const truth = new Set(W.cuts); let tok = 0;
        this.lb3 = chars.map((ch, i) => { if (i > 0 && this.result && truth.has(i)) tok++; const b = block3(ch, this.result ? [P3.anilL, P3.ipeL, P3.mataL][tok % 3] : P3.paper, { w: 0.62, h: 0.8, d: 0.5, brush: true, size: 46 }); this.row3.add(b); return b; });
        this.layout3(false); } else this.layout3(true);
      this.gapBtns3();
    } else if (this.step === 'ids') {
      this.gpo.innerHTML = ''; this.gapEls = null;
      if (this.k3 !== 'ids') { this.k3 = 'ids'; clear3(this.row3); M.picks = M.picks.filter(p => p.parent); const cols = [P3.anilL, P3.ipeL, P3.mataL, P3.urucumL, P3.jacaL];
        this.idBlocks = this.toks.map((t, i) => { const b = block3(t, cols[i % 5], { back: tokenId(t), h: 0.7, d: 0.46, size: 32 }); b.userData.click = () => this.flip(i); M.picks.push(b); this.row3.add(b); return b; });
        const maxW = (M.w || 360) / (M.h || 150) < 2.6 ? 4.4 : 7; const rows = [[]]; let w = 0;
        this.idBlocks.forEach(b => { if (w + b.userData.w > maxW && rows[rows.length - 1].length) { rows.push([]); w = 0; } rows[rows.length - 1].push(b); w += b.userData.w + 0.14; });
        this.idW = Math.max(...rows.map(r => r.reduce((a, b) => a + b.userData.w + 0.14, -0.14))); this.idH = rows.length * 0.95;
        rows.forEach((r, ri) => { let x = -r.reduce((a, b) => a + b.userData.w + 0.14, -0.14) / 2; r.forEach(b => { b.position.set(x + b.userData.w / 2, (rows.length - 1) * 0.475 - ri * 0.95, 0); b.userData.y0 = b.position.y; x += b.userData.w + 0.14; b.rotation.x = this.isId[this.idBlocks.indexOf(b)] ? Math.PI : 0; }); });
      }
    }
    this.fit3();
  },
  layout3(animate) {
    const W = T_WORDS[this.wi]; const cutsNow = this.result ? new Set(W.cuts) : this.cuts; const xs = []; let x = 0;
    this.lb3.forEach((b, i) => { if (i > 0) { x += 0.7; if (cutsNow.has(i)) x += 0.36; } xs.push(x); });
    const off = xs[xs.length - 1] / 2; this.gapX = [];
    this.lb3.forEach((b, i) => { const tx = xs[i] - off; if (animate) m3move(b, [tx, 0, 0], 260); else b.position.set(tx, 0, 0); if (i > 0) this.gapX[i] = (xs[i - 1] + xs[i]) / 2 - off; });
    this.wordW = xs[xs.length - 1] + 0.62;
  },
  gapBtns3() {
    const W = T_WORDS[this.wi]; const chars = [...W.w]; const truth = new Set(W.cuts); this.gpo.innerHTML = ''; this.gapEls = [];
    for (let i = 1; i < chars.length; i++) {
      let cls = 'gp', lab = null;
      if (this.result) { const inT = truth.has(i), inP = this.cuts.has(i); if (inT && inP) { cls += ' cut ok'; lab = 'certo'; } else if (inP) { cls += ' cut'; lab = 'a mais'; } else if (inT) { cls += ' miss'; lab = 'faltou'; } }
      else if (this.cuts.has(i)) cls += ' cut';
      const g = h('button', { class: cls, 'aria-label': `Vão entre “${chars[i - 1]}” e “${chars[i]}”` + (this.cuts.has(i) ? ', cortado' : ''), 'aria-pressed': this.cuts.has(i) ? 'true' : 'false', onclick: () => this.toggle(i) }, lab ? h('span', { class: 'gl' }, lab) : null);
      this.gpo.append(g); this.gapEls[i] = g;
    }
    this.placeGaps();
  },
  placeGaps() { const M = this.M3; if (!M || !this.gapEls || this.step !== 'fatiar' || !this.gapX) return; for (let i = 1; i < this.gapEls.length; i++) { const el = this.gapEls[i]; if (!el) continue; const p = M.project(this._v.set(this.gapX[i], 0, 0.28)); el.style.left = p.x.toFixed(1) + 'px'; } },
  fit3() {
    const M = this.M3; if (!M || !M.w) return; const width = this.step === 'fatiar' ? (this.wordW || 4) + 0.8 : (this.idW || 5) + 0.7; const height = this.step === 'fatiar' ? 1.5 : (this.idH || 1) + 0.5;
    const vf = M.cam.fov * Math.PI / 180; const hf = 2 * Math.atan(Math.tan(vf / 2) * M.cam.aspect); const dist = Math.max((width / 2) / Math.tan(hf / 2), (height / 2) / Math.tan(vf / 2));
    M.cam.position.set(0, dist * 0.22, dist); M.cam.lookAt(0, 0, 0); M.cam.updateProjectionMatrix();
  },
  showStep(k) { this.step = k; this.render(); HUD.refresh(); if (k === 'lab' && !this.saidLab) { this.saidLab = true; TG.say('Laboratório! Escolha um texto nos botões ou digite o seu. Missão: achar uma palavra que vire 3 tokens ou mais.'); } },
  render() {
    const v = this.inner; v.innerHTML = ''; clearBalloons();
    if (this.step === 'fatiar' && !this.no3d) {
      const W = T_WORDS[this.wi]; v.append(h('p', { class: 'note' }, `Palavra ${this.wi + 1} de 3: onde a IA corta?`));
      this.m3host.className = 'm3 short'; this.wordEl = h('div', { class: 'sheet tl', style: 'padding:2px' }, this.m3host); v.append(this.wordEl);
      if (this.result) { const r = this.result; v.append(h('div', { class: 'sheet pad tr rise' }, h('p', { class: 'ttl', style: 'font-size:24px' }, this.resText()), h('p', { style: 'margin:4px 0 0' }, W.why))); }
    }
    if (this.step === 'fatiar' && this.no3d) {
      const W = T_WORDS[this.wi]; const chars = [...W.w]; const truth = new Set(W.cuts);
      v.append(h('p', { class: 'note' }, `Palavra ${this.wi + 1} de 3: onde a IA corta?`));
      const word = h('div', { class: 'word', role: 'group', 'aria-label': 'Letras da palavra' }); this.gaps = [];
      let tok = 0;
      chars.forEach((ch, i) => {
        if (i > 0) {
          let cls = 'gp', lab = null;
          if (this.result) { const inT = truth.has(i), inP = this.cuts.has(i); if (inT && inP) { cls += ' cut ok'; lab = 'certo'; } else if (inP) { cls += ' cut'; lab = 'a mais'; } else if (inT) { cls += ' miss'; lab = 'faltou'; } }
          else if (this.cuts.has(i)) cls += ' cut';
          const g = h('button', { class: cls, 'aria-label': `Vão entre “${chars[i - 1]}” e “${ch}”` + (this.cuts.has(i) ? ', cortado' : ''), 'aria-pressed': this.cuts.has(i) ? 'true' : 'false', onclick: () => this.toggle(i) }, lab ? h('span', { class: 'gl' }, lab) : null);
          word.append(g); this.gaps.push(g); if (this.result && truth.has(i)) tok++;
        }
        word.append(h('span', { class: 'lt', style: this.result ? `background:var(--${['anil-soft', 'ipe-soft', 'mata-soft'][tok % 3]})` : '' }, ch));
      });
      this.wordEl = h('div', { class: 'sheet pad tl', style: 'padding-top:28px' }, word); v.append(this.wordEl);
      if (this.result) { const r = this.result; v.append(h('div', { class: 'sheet pad tr rise' }, h('p', { class: 'ttl', style: 'font-size:24px' }, this.resText()), h('p', { style: 'margin:4px 0 0' }, W.why))); }
    }
    if (this.step === 'ids' && !this.no3d) {
      v.append(h('p', { class: 'note' }, 'Cada pedaço vira o seu número na lista de pedaços que a IA conhece, o vocabulário. Toque nos blocos.'));
      this.m3host.className = 'm3'; this.flipsEl = h('div', { class: 'sheet tl', style: 'padding:2px' }, this.m3host); v.append(this.flipsEl);
      if (this.isId.every(Boolean)) v.append(h('div', { class: 'sheet pad tr rise col2' }, h('p', { class: 'lbl', style: 'margin:0' }, 'A pergunta, do jeito que a LLM recebe:'), h('p', { class: 'mono', style: 'margin:0;font-size:17px;font-weight:600' }, this.toks.map(t => tokenId(t)).join(' · ')), h('p', { class: 'small', style: 'margin:0' }, 'São só números de catálogo: “4098” não quer dizer “país”. O significado entra depois, na fase 7.')));
    }
    if (this.step === 'ids' && this.no3d) {
      v.append(h('p', { class: 'note' }, 'O computador não entende letras. Cada token vira o número dele no catálogo, o vocabulário.'));
      this.cards = this.toks.map((t, i) => h('button', { class: 'fc' + (this.isId[i] ? ' flip' : ''), 'aria-label': this.isId[i] ? `Token ${t}, ID ${tokenId(t)}` : `Virar o token ${t}`, onclick: () => this.flip(i) },
        h('span', { class: 'sizer', 'aria-hidden': 'true' }, String(tokenId(t)).length > t.length ? String(tokenId(t)) : t),
        h('span', { class: 'fin' }, h('span', { class: 'ff', style: `background:var(--${['anil-soft', 'ipe-soft', 'mata-soft', 'urucum-soft', 'jaca-soft'][i % 5]})` }, t), h('span', { class: 'fb' }, String(tokenId(t))))));
      this.flipsEl = h('div', { class: 'sheet pad flips tl' }, this.cards); v.append(this.flipsEl);
      if (this.isId.every(Boolean)) v.append(h('div', { class: 'sheet pad tr rise col2' }, h('p', { class: 'lbl', style: 'margin:0' }, 'A pergunta, do jeito que a LLM recebe:'), h('p', { class: 'mono', style: 'margin:0;font-size:17px;font-weight:600' }, this.toks.map(t => tokenId(t)).join(' · ')), h('p', { class: 'small', style: 'margin:0' }, 'São só números de catálogo: “4098” não quer dizer “país”. O significado entra depois, na fase 7.')));
    }
    if (this.step === 'lab') {
      const det = tokenizeDetailed(this.labText); const shown = det.slice(0, 40); const gs = {}; det.forEach(d => gs[d.g] = (gs[d.g] || 0) + 1);
      let ci = 0, lastG = -1;
      this.labRow = h('div', { class: 'labrow' }, shown.map(d => { if (d.g !== lastG) { ci++; lastG = d.g; } return chipTok(d.t, gs[d.g] > 1 ? 'y' : 'c' + (ci % 2 ? 0 : 2), { attrs: { title: 'ID ' + tokenId(d.t) } }); }), det.length > shown.length ? chipTok('+' + (det.length - shown.length), 'c5') : null);
      v.append(h('div', { class: 'sheet pad tl col2' }, h('p', { class: 'lbl', style: 'margin:0' }, `“${this.labText}”`), this.labRow, Object.values(gs).some(x => x > 1) ? h('p', { class: 'small muted', style: 'margin:0' }, 'Amarelos = pedaços de uma mesma palavra.' + (det.some(x => x.t === '⋯') ? ' Emojis viram vários pedaços: os “⋯” são continuações do mesmo emoji.' : '')) : null));
      const n = det.length, chars = [...this.labText].length;
      v.append(h('div', { class: 'stats' }, h('div', null, h('b', null, String(n)), h('small', null, 'tokens')), h('div', null, h('b', null, String(chars)), h('small', null, 'letras e sinais')), h('div', null, h('b', null, usd(n * PRICE_IN / 1e6 * 1e6).replace('US$ ', '$')), h('small', null, `${n} tokens × 1 milhão de envios`))));
      v.append(h('p', { class: 'small muted', style: 'text-align:center;margin:0' }, `Muitos serviços cobram por token. Preço de exemplo: US$ ${PRICE_IN} por 1 milhão de tokens.`));
    }
    if (this.step !== 'lab') this.sync3d();
  },
  resText() { const r = this.result, W = T_WORDS[this.wi], n = W.cuts.length;
    if (!n) return r.perfect ? 'Na mosca! Aqui o certo era não cortar.' : `A IA não corta essa palavra. Você fez ${r.extra} corte${r.extra > 1 ? 's' : ''} a mais.`;
    return r.perfect ? 'Na mosca!' : `Cortes certos: ${r.right} de ${n}` + (r.extra ? ` · a mais: ${r.extra}` : '') + (r.miss ? ` · faltaram: ${r.miss}` : ''); },
  retry() { this.cuts = new Set(); this.result = null; SND.play('pop'); this.render(); HUD.refresh(); },
  toggle(i) { if (this.result) return; if (this.cuts.has(i)) { this.cuts.delete(i); SND.play('pop'); } else { this.cuts.add(i); SND.play('snip'); } this.render(); HUD.refresh(); },
  check() {
    const W = T_WORDS[this.wi]; const truth = new Set(W.cuts); let right = 0, extra = 0, miss = 0;
    for (const i of new Set([...truth, ...this.cuts])) { if (truth.has(i) && this.cuts.has(i)) right++; else if (this.cuts.has(i)) extra++; else miss++; }
    this.result = { right, extra, miss, perfect: !extra && !miss }; this.checked[this.wi] = true;
    SND.play(this.result.perfect ? 'win' : 'pop'); if (this.result.perfect) FX.burst(60, 0.5, 0.45, 0.7);
    if (this.checked.every(Boolean)) complete('v4a');
    this.render(); HUD.refresh(); VOICE.say((this.result.perfect ? 'Na mosca! ' : '') + W.why);
  },
  nextWord() { this.wi++; this.cuts = new Set(); this.result = null; this.render(); HUD.refresh(); },
  flip(i) {
    this.isId[i] = !this.isId[i]; SND.play('pop'); if (this.no3d && this.cards) this.cards[i].classList.toggle('flip', this.isId[i]);
    if (!this.no3d && this.idBlocks) { const b = this.idBlocks[i]; const r0 = b.rotation.x, r1 = this.isId[i] ? Math.PI : 0; anim(520, k => { b.rotation.x = lerp(r0, r1, k); b.position.y = b.userData.y0 + Math.sin(k * Math.PI) * 0.45; }, ease.out); }
    if (this.isId.every(Boolean) && !S.done.v4b) { complete('v4b'); this.render(); }
    HUD.refresh();
  },
  async flipAll() { const ok = live(this); for (let i = 0; i < this.toks.length; i++) { if (!ok()) return; if (!this.isId[i]) { this.flip(i); await wait(140); } } },
  setLab(t) { this.labText = t; const det = tokenizeDetailed(t); const gs = {}; det.forEach(d => gs[d.g] = (gs[d.g] || 0) + 1); SND.play('pop'); if (Object.values(gs).some(x => x >= 3)) complete('v4c'); this.render(); HUD.refresh(); },
  actions() {
    const rows = [];
    if (this.step === 'fatiar') { if (!this.result) rows.push([abtn(`Conferir palavra ${this.wi + 1} de 3`, () => this.check(), { primary: true, hot: true })]); else rows.push([!this.result.perfect ? abtn('Tentar de novo', () => this.retry()) : null, this.wi < 2 ? abtn('Próxima palavra →', () => this.nextWord(), { primary: true, hot: true }) : null]); }
    if (this.step === 'ids' && !this.isId.every(Boolean)) rows.push([abtn('Virar todos em números', () => this.flipAll(), { primary: true, hot: true })]);
    if (this.step === 'lab') { rows.push({ items: LAB_TEXTS.map((t, i) => ({ ...chip(t, this.labText === t, () => this.setLab(t)), hot: i === 0 && !S.done.v4c })) }); rows.push([abtn('Digitar meu texto', () => askText('Digite uma frase', this.labText, v => this.setLab(v), { kicker: 'Laboratório de tokens', help: 'Veja em quantos pedaços ela vira.' }))]); }
    return rows;
  },
  hs() { return this.step === 'fatiar' ? [['Token', () => this.wordEl]] : this.step === 'ids' ? [['Vocabulário', () => this.flipsEl]] : [['Tokenização', () => this.labRow && this.labRow.closest('.sheet')]]; },
  guide() {
    if (this.step === 'fatiar') { if (!this.result) return { target: this.cuts.size ? null : this.no3d ? this.gaps && this.gaps[Math.floor(this.gaps.length / 2)] : this.gapEls && this.gapEls[Math.ceil((this.gapEls.length - 1) / 2)], tip: this.cuts.size ? 'Quando achar que terminou, aperte “Conferir”.' : 'Toque nos vãos entre as letras para cortar. Toque de novo para desfazer.' }; return { tip: this.wi < 2 ? 'Leia a explicação e siga para a próxima palavra.' : 'Pronto! Agora vamos transformar a frase em números.' }; }
    if (this.step === 'ids') { const i = this.isId.findIndex(x => !x); return i >= 0 ? { target: this.no3d ? this.cards && this.cards[i] : this.m3host, tip: 'Toque nos blocos para virar cada token no seu número, ou aperte “Virar todos”.' } : { tip: 'Pronto: a pergunta virou uma fila de números. É isso que a LLM recebe.' }; }
    return { tip: S.done.v4c ? 'Tente um emoji ou um número grande: eles também viram vários tokens!' : 'Escolha uma palavra longa nos botões, como “desenvolvimento”, e veja em quantos pedaços ela vira.' };
  }
});
