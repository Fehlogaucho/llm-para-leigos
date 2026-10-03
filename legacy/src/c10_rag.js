/* ============ Fase 10 · RAG e busca semântica ============ */
const RAG_PRESETS = [
  { l: 'Horário da biblioteca', q: 'Que horas a biblioteca abre no sábado?', key: 9, rag: 'Aos sábados, a biblioteca abre das 9h às 13h [1].', mem: 'Provavelmente das 8h às 12h.', hall: true },
  { l: 'Virtude (Aristóteles)', q: 'O que Aristóteles entende por virtude?', key: 2, mem: 'Pelo que aprendi no treinamento, Aristóteles via a virtude como um meio-termo entre excessos. Mas não sei dizer de qual texto isso vem.' },
  { l: 'Estoicos', q: 'Como os estoicos lidam com o que não controlamos?', key: 5, mem: 'De modo geral, os estoicos recomendavam aceitar o que não depende de nós. Não tenho um trecho para citar.' },
  { l: 'Caverna', q: 'O que é a alegoria da caverna?', key: 0, mem: 'É uma história de Platão sobre prisioneiros que veem sombras. Estou respondendo de memória, sem fonte.' }];
PHASES.push({
  kind: '2d', name: 'RAG', title: 'A biblioteca do modelo', era: '2020 · buscar antes de responder', act: 'Ajustar, buscar e criar', badge: 'Bibliotecário',
  brief: { see: 'O modelo não conhece os seus documentos nem o que aconteceu depois do treino. O RAG (sigla em inglês para “geração com busca”) procura os trechos mais parecidos com a pergunta numa biblioteca e os cola no prompt antes da resposta.', goal: 'Comparar respostas com e sem RAG e ensinar um documento novo à IA sem mexer em nenhum peso.', key: 'RAG', first: 'Toque em “Sem RAG” e pergunte o horário da biblioteca. Veja o chute!' },
  missions: [
    { id: 'v10a', text: 'Pergunte o horário da biblioteca SEM RAG e veja o chute', short: 'sem RAG' },
    { id: 'v10b', text: 'Pergunte de novo COM RAG e receba a resposta com fonte', short: 'com RAG' },
    { id: 'v10c', text: 'Adicione um documento seu e faça uma pergunta que o encontre', short: 'novo documento' }],
  challenge: { q: 'Para a IA responder sobre o regulamento da sua faculdade, sem retreinar, você usa…', o: ['RAG com o documento', 'Temperatura alta', 'Um prompt dizendo “adivinhe”'], a: 0, why: 'O RAG encontra o trecho certo e o coloca no contexto, com fonte.' },
  build2d(root) {
    this.useRag = true; this.k = 2; this.docs = RAG_DOCS.map(d => ({ ...d })); this.busy = false; this.last = null; this.hits = []; this.added = null; this.phase = 'idle';
    this.inner = scene2d(this, root, [{ c: 'mata', x: .1, y: .3, r: .5 }, { c: 'ipe', x: .9, y: .15, r: .4 }, { c: 'jaca', x: .7, y: .95, r: .45 }]);
    this.m3host = h('div', { class: 'm3 shelf3', role: 'img', 'aria-label': 'Estante da biblioteca em 3D. Toque num livro para ler o trecho.' });
    this.render();
  },
  m3opts: { cam: [0, 0.8, 7], look: [0, 0, 0], fov: 30, fit(M) { const P = E.phase; if (P && P.M3 === M && P.fitShelf) P.fitShelf(); } },
  SH: { CW: 1.56, CH: 1.1, T: 0.09, TB: 0.17, D: 0.64, short: { facul: 'Faculdade', platao: 'Platão', arist: 'Aristóteles', estoic: 'Estoicos', nietz: 'Nietzsche', seus: 'Seus documentos' }, col: { facul: 'ipe', platao: 'anilL', arist: 'mataL', estoic: 'urucumL', nietz: 'jacaL', seus: 'paper' } },
  m3build(M) {
    const { CW, CH, T, TB, D, short } = this.SH; const sh = new THREE.Group(); M.scene.add(sh); this.shelf = sh; this.book3 = {}; this.shelfReady = false; this.hitKey = null; this.hitSpr = new THREE.Group(); sh.add(this.hitSpr);
    const W = 3 * CW + 4 * T, H = 2 * CH + 3 * TB; this.shW = W; this.shH = H;
    const back = inked(new THREE.BoxGeometry(W, H, 0.06), P3.woodD, { ink: 1.02 }); back.position.z = -D / 2; sh.add(back);
    for (let r = 0; r <= 2; r++) { const b = inked(new THREE.BoxGeometry(W + 0.1, TB, D), P3.wood, { ink: 1.03 }); b.position.set(0, -H / 2 + TB / 2 + r * (CH + TB), 0); sh.add(b); }
    for (let c = 0; c <= 3; c++) { const b = inked(new THREE.BoxGeometry(T, H, D), P3.wood, { ink: 1.03 }); b.position.set(-W / 2 + T / 2 + c * (CW + T), 0, 0); sh.add(b); }
    this.comp = {}; Object.keys(RAG_COLS).forEach((c, k) => { const col = k % 3, row = Math.floor(k / 3); const cx = -W / 2 + T + CW / 2 + col * (CW + T); const by = H / 2 - TB - (row + 1) * CH - row * TB; this.comp[c] = { cx, by };
      const tag = m3Plane(short[c], 0.2, { size: 30, weight: 700, bg: '#FBFAF5', border: '#1A2338', padX: 10, padY: 2, radius: 8 }); tag.position.set(cx, by - TB / 2, D / 2 + 0.012); sh.add(tag); });
    const scan = new THREE.Mesh(new THREE.PlaneGeometry(0.32, H * 0.96), new THREE.MeshBasicMaterial({ color: P3.ipe, transparent: true, opacity: 0.38, depthWrite: false })); scan.position.z = D / 2 + 0.05; scan.visible = false; sh.add(scan); this.scan = scan;
    const off = m3Sprite('Biblioteca desligada', 0.34, { size: 30 }); off.position.set(0, 0, D); off.visible = false; sh.add(off); this.offSpr = off;
    M.ticks.push((dt, t) => {
      sh.rotation.y = Math.sin(t * 0.35) * 0.1;
      scan.visible = this.phase === 'search' && this.useRag; if (scan.visible) scan.position.x = -W / 2 + ((t * 2.2) % 1) * W;
      for (const k in this.book3) { const b = this.book3[k]; const u = b.userData; const tz = u.hit ? 0.4 : 0; b.position.z = lerp(b.position.z, tz, Math.min(1, dt * 7)); if (u.drop != null) { u.drop = Math.max(0, u.drop - dt * 2.4); b.position.y = u.y0 + u.drop * u.drop * 2; if (!u.drop) u.drop = null; } }
    });
    this.sync3d();
  },
  fitShelf() {
    const M = this.M3; if (!M || !M.w || !this.shW) return; const width = this.shW + 0.5, height = this.shH + 0.7;
    const vf = M.cam.fov * Math.PI / 180; const hf = 2 * Math.atan(Math.tan(vf / 2) * M.cam.aspect); const dist = Math.max((width / 2) / Math.tan(hf / 2), (height / 2) / Math.tan(vf / 2));
    M.cam.position.set(0, dist * 0.16, dist); M.cam.lookAt(0, 0.05, 0); M.cam.updateProjectionMatrix();
  },
  sync3d() {
    const M = this.M3; if (!M || !this.shelf) return; this.fitShelf();
    const byC = {}; this.docs.forEach((d, i) => (byC[d.c] = byC[d.c] || []).push(i));
    for (const [c, list] of Object.entries(byC)) { const cp = this.comp[c]; if (!cp) continue; const n = list.length, gap = 0.27;
      list.forEach((i, j) => { let b = this.book3[i]; const d = this.docs[i];
        if (!b) { const hh = 0.62 + ((i * 7) % 18) / 60, bw = 0.21; b = inked(new THREE.BoxGeometry(bw, hh, 0.46), P3[this.SH.col[c]], { ink: 1.06 });
          const st = new THREE.Mesh(new THREE.PlaneGeometry(bw * 0.8, 0.045), new THREE.MeshBasicMaterial({ color: P3.ink })); st.position.set(0, hh * 0.28, 0.231); b.add(st); const st2 = st.clone(); st2.position.y = -hh * 0.3; b.add(st2);
          b.userData = { ...b.userData, i, h: hh, base: P3[this.SH.col[c]], y0: cp.by + hh / 2, click: () => balloon('bk', { m3: M, obj: b, off: [0, hh / 2 + 0.1, 0] }, `<p><b>${d.t}</b></p><p>${d.x}</p>`, { ttl: 6000 }) };
          if (this.shelfReady) b.userData.drop = 1; b.position.set(0, b.userData.y0, 0); M.picks.push(b); this.shelf.add(b); this.book3[i] = b; }
        b.position.x = cp.cx - (n - 1) * gap / 2 + j * gap; b.rotation.z = j === n - 1 && n < 4 ? -0.1 : 0; if (b.rotation.z) b.position.x += 0.03; });
    }
    this.shelfReady = true;
    const key = (this.useRag ? 'r' : 'n') + this.hits.map(x => x.i).join(',') + this.phase;
    for (const k in this.book3) { const b = this.book3[k]; const hi = this.useRag && this.hits.find(x => x.i === +k); b.userData.hit = !!hi; b.material.color.setHex(this.useRag ? b.userData.base : P3.grey); b.material.emissive.setHex(P3.ipe); b.material.emissiveIntensity = hi ? 0.35 : 0; }
    this.offSpr.visible = !this.useRag;
    if (key !== this.hitKey) { this.hitKey = key; clear3(this.hitSpr);
      this.hits.forEach((x, j) => { const b = this.book3[x.i]; if (!b || !this.useRag) return; const s = m3Sprite(`[${j + 1}] ${x.d.s} · ${Math.round(x.sim * 100)}%`, 0.26, { size: 28, bg: '#EFAE22' }); const hw = s.scale.x / 2; s.position.set(clamp(b.position.x, -this.shW / 2 + hw + 0.2, this.shW / 2 - hw - 0.2), b.userData.y0 + b.userData.h / 2 + 0.22 + j * 0.3, 0.62); this.hitSpr.add(s); }); }
  },
  search(q) { const qb = bagOf(q); return this.docs.map((d, i) => ({ d, i, sim: cosBag(qb, d.bag) })).sort((a, b) => b.sim - a.sim); },
  render() {
    const v = this.inner; v.innerHTML = '';
    const L = this.last;
    v.append(h('div', { class: 'sheet pad row2 tl', style: 'justify-content:space-between' }, h('span', { class: 'pill2 ' + (this.useRag ? 'g' : 'r') }, this.useRag ? 'RAG ligado' : 'Sem RAG: só a memória'), h('b', { style: 'flex:1;min-width:160px' }, L ? L.q : 'Escolha uma pergunta nos botões.')));
    const byC = {}; this.docs.forEach((d, i) => (byC[d.c] = byC[d.c] || []).push([d, i]));
    this.books = {};
    this.lib = h('div', { class: 'lib' }, Object.entries(RAG_COLS).filter(([c]) => byC[c]).map(([c, col]) => h('div', { class: 'shelf' }, h('span', { class: 'sn2' }, col.name),
      h('div', { class: 'books' }, byC[c].map(([d, i]) => { const hit = this.hits.find(x => x.i === i); const b = h('button', { class: 'bk' + (hit ? ' hit' : ''), style: `--bc:${col.color};height:${44 + (i * 7) % 18}px`, title: `${d.t}: ${d.x}`, 'aria-label': d.t, onclick: () => balloon('bk', b, `<p><b>${d.t}</b></p><p>${d.x}</p>`, { ttl: 5000 }) }, h('span', null, d.s), hit ? h('span', { class: 'sim' }, Math.round(hit.sim * 100) + '%') : null); this.books[i] = b; return b; })))));
    v.append(h('div', { class: 'col2' }, h('span', { class: 'lbl', style: 'text-align:center' }, this.useRag ? 'Biblioteca · a busca puxa os livros mais parecidos com a pergunta (% = quão parecido)' : 'Biblioteca (desligada)'), this.no3d ? this.lib : this.m3host));
    this.tray = h('div', { class: 'tray' }, this.useRag && this.hits.length && this.phase !== 'search' ? this.hits.map((t, j) => h('span', { class: 'pg rise', style: `animation-delay:${j * 0.15}s` }, `[${j + 1}] ${t.d.s}`)) : h('span', { class: 'muted' }, this.useRag ? 'contexto vazio' : 'sem contexto extra'));
    this.llm = h('div', { class: 'llmbox' + (this.phase === 'think' ? ' flash' : '') }, h('b', null, 'LLM'), h('div', { class: 'small' }, 'pesos não mudam'));
    v.append(h('div', { class: 'flow' }, h('div', { class: 'col2' }, h('span', { class: 'lbl', style: 'font-size:16px' }, 'contexto colado no prompt'), this.tray), h('span', { class: 'arr' }, '→'), this.llm));
    if (L && this.phase === 'done') {
      const T = L.tok, tot = T.sys + T.q + T.ctx;
      this.ansEl = h('div', { class: 'ans rise ' + L.kind }, h('p', null, h('b', null, L.ans)), L.hall ? h('p', { class: 'small', style: 'margin-top:4px' }, h('b', null, 'Chute! Isso é uma alucinação: '), 'o modelo nunca viu esse regulamento, mas foi treinado para sempre continuar o texto.') : null,
        L.cites.length ? h('p', { class: 'small', style: 'margin-top:4px' }, 'Fonte: ' + L.cites.map((c, j) => `[${j + 1}] ${c.d.t}`).join(' · ')) : null, h('p', { class: 'small muted', style: 'margin-top:4px' }, `Custo: ${tot} tokens de entrada${L.rag ? ` (${T.ctx} do contexto)` : ''}.`));
      v.append(this.ansEl);
    } else this.ansEl = null;
    if (this.added) v.append(h('p', { class: 'note' }, `“${this.added.t}” está na estante “Seus documentos”. Nenhum peso mudou.`));
    if (!this.no3d) this.sync3d();
  },
  async ask(q) {
    q = (q || '').trim(); if (!q || this.busy) return; this.busy = true; const ok = live(this); HUD.refresh(); clearBalloons();
    const preset = RAG_PRESETS.find(p => p.q === q); const top = this.search(q).slice(0, this.k).filter((t, j) => j === 0 ? t.sim >= 0.05 : t.sim >= 0.12);
    this.last = { q }; this.hits = []; this.phase = 'search'; SND.play('whoosh'); this.render();
    if (this.useRag) { for (const t of top) { await wait(REDUCED ? 30 : 380); if (!ok()) return; this.hits.push(t); SND.play('tick'); this.render(); } this.phase = 'tray'; await wait(REDUCED ? 30 : 500); if (!ok()) return; this.render(); }
    this.phase = 'think'; this.render(); await wait(REDUCED ? 30 : 700); if (!ok()) return;
    let ans, kind = 'ok', cites = []; const rel = top.filter((t, j) => j === 0 ? t.sim >= 0.12 : t.sim >= Math.max(0.2, top[0].sim * 0.7));
    if (this.useRag) {
      if (preset && preset.rag && top.some(t => t.i === preset.key)) { ans = preset.rag; cites = [top.find(t => t.i === preset.key)]; }
      else if (rel.length) { const qb = bagOf(q); const best = t => { const ss = t.d.x.split(/(?<=[.!?])\s+/).filter(Boolean); return ss.map(x => [cosBag(qb, bagOf(x)), x]).sort((a, b) => b[0] - a[0])[0][1]; };
        cites = rel.slice(0, 2); ans = cites.map((t, j) => `${j ? 'E, segundo' : 'Segundo'} [${j + 1}] “${t.d.t}”: ${best(t)}`).join(' '); }
      else { ans = 'Os trechos encontrados não falam disso, então prefiro não inventar uma resposta.'; kind = 'call'; }
    } else { if (preset) { ans = preset.mem; kind = preset.hall ? 'bad' : 'call'; } else { ans = 'Sem acesso aos seus documentos, eu só poderia responder com o que aprendi no treinamento.'; kind = 'call'; } }
    const qt = tokenize(q).length, ctxT = this.useRag ? top.reduce((a, t) => a + tokenize(t.d.x).length + 8, 0) : 0;
    this.last = { q, ans, kind, cites, rag: this.useRag, tok: { sys: 30, q: qt, ctx: ctxT }, hall: !this.useRag && preset && preset.hall };
    if (!this.useRag && preset && preset.key === 9) complete('v10a');
    if (this.useRag && preset && preset.key === 9 && top.some(t => t.i === 9)) complete('v10b');
    if (this.useRag && top[0] && top[0].d.c === 'seus' && top[0].sim >= 0.12) complete('v10c');
    this.busy = false; this.phase = 'done'; SND.play(this.last.hall ? 'bad' : 'pop'); this.render(); HUD.refresh();
    VOICE.say(ans + (this.last.hall ? ' Mas isso é um chute!' : ''));
  },
  addDoc(title, text) {
    title = (title || '').trim() || 'Meu documento'; text = (text || '').trim(); if (!text) return;
    const sh = title.length <= 14 ? title : (title.slice(0, 15).replace(/\s+\S*$/, '') || title.slice(0, 12)); const d = { c: 'seus', s: sh, t: title, x: text, k: title }; d.bag = bagOf(d.t + ' ' + d.x, 1, bagOf(d.k, 2)); this.docs.push(d);
    this.added = d; this.hits = []; this.last = null; this.phase = 'idle'; SND.play('drop'); FX.burst(40, 0.6, 0.5, 0.6); this.render(); HUD.refresh();
    const b = this.no3d ? this.books[this.docs.length - 1] : this.book3 && this.book3[this.docs.length - 1] ? { m3: this.M3, obj: this.book3[this.docs.length - 1], off: [0, 0.6, 0] } : this.m3host; if (b) balloon('doc', b, `<p><b>“${d.t}” entrou na biblioteca!</b></p><p>Nenhum peso da LLM mudou.</p>`, { kind: 'ok', ttl: 5000 });
  },
  actions() {
    return [
      { items: [{ ...chip('Com RAG', this.useRag, () => { this.useRag = true; this.render(); }), hot: S.done.v10a && !S.done.v10b && !this.useRag }, { ...chip('Sem RAG', !this.useRag, () => { this.useRag = false; this.render(); }), hot: !S.done.v10a && this.useRag }] },
      { label: 'Perguntar', items: RAG_PRESETS.map((p, i) => ({ ...chip(p.l, false, () => this.ask(p.q)), hot: i === 0 && ((!S.done.v10a && !this.useRag) || (S.done.v10a && !S.done.v10b && this.useRag)) })).concat([chip('✎ Digitar', false, () => askText('Pergunte à IA', '', v => this.ask(v), { kicker: this.useRag ? 'Com RAG' : 'Sem RAG' }))]) },
      this.added && S.done.v10b && !S.done.v10c ? [abtn('Perguntar sobre o seu documento', () => askText('Pergunte algo sobre o seu documento', /cantina/i.test(this.added.t) ? 'Que horas sai o pão de queijo?' : '', v => { this.useRag = true; this.ask(v); }, { kicker: 'Com RAG' }), { hot: true, primary: true })] : null,
      [abtn('Adicionar documento', () => askText('Texto do documento', 'A cantina do campus serve pão de queijo quentinho todos os dias, às 10h e às 16h.', (v, t) => this.addDoc(t || v.split(/\s+/).slice(0, 4).join(' '), v), { area: true, title2: 'Cantina do campus', kicker: 'Nova página na biblioteca', okLabel: 'Adicionar', help: 'Depois pergunte algo como “Que horas sai o pão de queijo?”' }), { hot: S.done.v10b && !S.done.v10c && !this.added, primary: S.done.v10b && !this.added })],
    ];
  },
  hs() { return [['Busca semântica', () => this.no3d ? this.lib : this.m3host], ['Alucinação', () => this.ansEl && this.last && this.last.hall ? this.ansEl : null]]; },
  guide() {
    if (this.busy) return { tip: this.useRag ? 'A pergunta está procurando os trechos mais parecidos. Eles vão para o contexto.' : 'Sem biblioteca, o modelo responde só com o que tem na memória…' };
    if (!S.done.v10a) return { tip: this.useRag ? 'Primeiro teste SEM RAG: toque em “Sem RAG” nos botões.' : 'Agora pergunte o horário da biblioteca.' };
    if (!S.done.v10b) return { tip: this.useRag ? 'Pergunte o horário de novo, agora com RAG ligado.' : 'Volte para “Com RAG” e pergunte de novo.' };
    if (!S.done.v10c) return { tip: this.added ? 'Faça uma pergunta que o seu documento responda.' : 'Adicione um documento seu à biblioteca. Nenhum peso vai mudar!' };
    return { tip: 'Mais trechos buscados = mais tokens no prompt = mais custo. Um bom RAG traz só o necessário.' };
  }
});
