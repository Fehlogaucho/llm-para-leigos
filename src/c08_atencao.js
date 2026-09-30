/* ============ Fase 8 · Atenção (Transformer) ============ */
const ATT_STOP = new Set('a o e é de do da dos das em no na nos nas um uma ao aos para por , ? . qual fui'.split(' '));
const ATT = {
  banco: [
    { toks: ['Na', 'praça', ',', 'sentei', 'no', 'banco'], key: 5, w: [.04, .42, .02, .34, .06, .12], mean: 'banco de praça, para sentar' },
    { toks: ['Para', 'sacar', 'dinheiro', ',', 'fui', 'ao', 'banco'], key: 6, w: [.03, .30, .45, .02, .05, .04, .11], mean: 'banco de dinheiro' }],
  q: {
    capital: { label: 'capital', toks: ['Qual', 'é', 'a', 'capital', 'do', 'Brasil', '?'], w: [.10, .04, .03, .33, .05, .37, .08], next: 'Brasília' },
    moeda: { label: 'moeda', toks: ['Qual', 'é', 'a', 'moeda', 'do', 'Brasil', '?'], w: [.10, .04, .03, .34, .05, .36, .08], next: 'real' },
    lingua: { label: 'língua', toks: ['Qual', 'é', 'a', 'língua', 'do', 'Brasil', '?'], w: [.10, .04, .03, .35, .05, .35, .08], next: 'português' },
    esporte: { label: 'esporte', toks: ['Qual', 'é', 'o', 'esporte', 'do', 'Brasil', '?'], w: [.09, .03, .02, .36, .04, .38, .08], next: 'futebol' }
  }
};
PHASES.push({
  kind: '2d', name: 'Atenção', title: 'Holofotes de atenção', era: '2017 · a atenção', act: 'Como funciona, peça por peça', badge: 'Holofote',
  brief: { see: 'Lembra da máquina de Markov, que só olhava a última palavra? A atenção resolve isso: cada token olha para todos os anteriores e decide quais importam.', goal: 'Ver para quem “banco” olha em duas frases e apostar no token que ajuda a prever a resposta da nossa pergunta.', key: 'Atenção', first: 'Aperte o botão do holofote e veja para quem “banco” olha.' },
  missions: [
    { id: 'v8a', text: 'Descubra para quem “banco” olha nas duas frases', short: 'banco' },
    { id: 'v8b', text: 'Aposte: qual token mais ajuda a prever a resposta?', short: 'aposta' },
    { id: 'v8c', text: 'Troque a pergunta 2 vezes e veja a previsão mudar', short: 'contexto' }],
  steps: [{ k: 'banco', l: 'Palavra ambígua', m: ['v8a'] }, { k: 'q', l: 'A pergunta', m: ['v8b', 'v8c'] }],
  stepKey() { return this.mode; }, goStep(k) { this.setMode(k); },
  challenge: { q: 'Em “Para sacar dinheiro, fui ao banco”, quem mais ajuda a entender “banco”?', o: ['dinheiro', 'fui', 'ao'], a: 0, why: '“Dinheiro” e “sacar” puxam o sentido para o banco onde se guarda dinheiro.' },
  build2d(root) {
    this.mode = 'banco'; this.si = 0; this.qv = 'capital'; this.revealed = false; this.bet = null; this.src = null; this.seenB = new Set(); this.seenQ = new Set();
    this.inner = scene2d(this, root, [{ c: 'ipe', x: .5, y: .1, r: .5 }, { c: 'anil', x: .1, y: .8, r: .45 }, { c: 'jaca', x: .95, y: .75, r: .4 }], { mid: true });
    const base = this.onShow; this.onShow = () => { base(); this.drawArcs(); };
    this.m3host = h('div', { class: 'm3 att3', role: 'img', 'aria-label': 'Frase em blocos 3D. Os arcos mostram para quem cada palavra olha. Toque num bloco.' });
    this.render();
  },
  m3opts: { cam: [0, 2, 9], look: [0, 0.4, 0], fov: 30, fit(M) { const P = E.phase; if (P && P.M3 === M && P.fitAtt) P.fitAtt(); } },
  m3build(M) {
    this.row3 = new THREE.Group(); this.arc3 = new THREE.Group(); M.scene.add(this.row3, this.arc3); this.k3 = null;
    M.ticks.push((dt, t) => { if (!this.blk) return; this.blk.forEach((b, i) => { const src = i === this.src; b.position.y = lerp(b.position.y, src ? 0.16 + Math.sin(t * 3) * 0.04 : 0, Math.min(1, dt * 8)); const sc = b.userData.pop != null ? ease.back(b.userData.pop = Math.min(1, b.userData.pop + dt * 2.5)) : 1; b.scale.setScalar(sc); });
      this.arc3.children.forEach(a => { if (a.userData.tube) a.material.opacity = 0.55 + 0.35 * Math.sin(t * 4 - a.userData.k); }); this.row3.rotation.y = this.arc3.rotation.y = Math.sin(t * 0.4) * 0.05; });
    this.sync3d();
  },
  sync3d() {
    const M = this.M3; if (!M || !this.row3 || this.no3d) return; const d = this.cur();
    const key = this.mode + (this.mode === 'banco' ? this.si : this.qv) + (this.revealed ? 'r' : '');
    if (this.k3 !== key) { const was = this.k3; this.k3 = key; clear3(this.row3); M.picks = M.picks.filter(p => p.parent);
      const words = d.toks.slice(); if (this.mode === 'q') words.push(this.revealed ? d.next : '?');
      this.blk = words.map((t, i) => { const b = block3(t, P3.paper, { w: Math.max(0.46, 0.2 + [...t].length * 0.17), h: 0.62, d: 0.44, size: 34 }); if (i < d.toks.length) { b.userData.click = () => this.clickTok(i); M.picks.push(b); } else if (this.revealed && was && was.startsWith(this.mode)) b.userData.pop = 0; this.row3.add(b); return b; });
      let x = -this.blk.reduce((a, b) => a + b.userData.w + 0.14, -0.14) / 2; this.blk.forEach(b => { b.position.x = x + b.userData.w / 2; x += b.userData.w + 0.14; }); this.rowW = -2 * this.blk[0].position.x + this.blk[0].userData.w;
    }
    const w = this.src != null ? this.weightsFor(this.src) : null; const nT = d.toks.length;
    this.blk.forEach((b, i) => { let c = i % 2 ? P3.mataL : P3.anilL; if (i === nT) c = this.revealed ? P3.ipe : P3.paper; else if (i === this.src) c = P3.ipe; else if (this.mode === 'banco' && i === d.key) c = P3.urucumL; else if (w && i > this.src) c = P3.grey; setBlockColor(b, c); });
    clear3(this.arc3);
    if (w) { const s = this.blk[this.src]; const top = 0.31;
      w.forEach((v, j) => { if (j >= this.src || v < 0.03) return; const b = this.blk[j]; const xs = s.position.x, xj = b.position.x, span = Math.abs(xs - xj);
        const cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(xs, top + 0.2, 0.05), new THREE.Vector3((xs + xj) / 2, top + 0.2 + Math.min(2.2, 0.5 + span * 0.36), 0.12), new THREE.Vector3(xj, top, 0.05));
        const tube = new THREE.Mesh(new THREE.TubeGeometry(cv, 40, 0.018 + v * 0.13, 8, false), new THREE.MeshBasicMaterial({ color: P3.ipe, transparent: true, opacity: 0.8, depthWrite: false })); tube.userData = { tube: true, k: j }; this.arc3.add(tube);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.05 + v * 0.1, 12, 8), new THREE.MeshBasicMaterial({ color: P3.ink })); cap.position.set(xj, top + 0.02, 0.05); this.arc3.add(cap);
        const sp = m3Sprite(Math.round(v * 100) + '%', 0.34, { size: 30, mono: true, bg: v >= 0.25 ? '#EFAE22' : '#FBFAF5' }); sp.position.set(xj, top + 0.42, 0.3); this.arc3.add(sp); });
    }
    this.fitAtt();
  },
  fitAtt() {
    const M = this.M3; if (!M || !M.w || !this.rowW) return; const width = this.rowW + 0.5, height = 2.1;
    const vf = M.cam.fov * Math.PI / 180; const hf = 2 * Math.atan(Math.tan(vf / 2) * M.cam.aspect); const dist = Math.max((width / 2) / Math.tan(hf / 2), (height / 2) / Math.tan(vf / 2));
    M.cam.position.set(0, 0.55 + dist * 0.18, dist); M.cam.lookAt(0, 0.62, 0); M.cam.updateProjectionMatrix();
  },
  cur() { return this.mode === 'banco' ? ATT.banco[this.si] : ATT.q[this.qv]; },
  setMode(m) { this.mode = m; this.src = null; this.revealed = !!(m === 'q' && S.done.v8b); if (m === 'q' && this.revealed) this.src = this.cur().toks.length - 1; this.render(); HUD.refresh(); if (m === 'q' && !this.saidQ) { this.saidQ = true; TG.say('Agora a pergunta de verdade! Aposte nos botões: qual token mais ajuda a prever a resposta?'); } },
  weightsFor(i) {
    const d = this.cur();
    if (this.mode === 'banco' && i === d.key) return d.w;
    if (this.mode === 'q' && i === d.toks.length - 1) return d.w;
    const raw = d.toks.map((t, j) => j > i ? 0 : (j === i ? 1.3 : 1) * (ATT_STOP.has(t.toLowerCase()) ? 0.35 : 1.6) * (0.7 + 0.3 * j / Math.max(1, i)));
    const s = raw.reduce((a, b) => a + b, 0); return raw.map(v => v / s);
  },
  render() {
    const v = this.inner; v.innerHTML = ''; clearBalloons();
    const d = this.cur(); const w = this.src != null ? this.weightsFor(this.src) : null;
    v.append(h('p', { class: 'note' }, this.mode === 'banco' ? `Frase ${this.si + 1} de 2` : 'O que vem depois do ponto de interrogação?'));
    this.chips = d.toks.map((t, i) => {
      const isKey = this.mode === 'banco' && i === d.key; const isSrc = this.src === i;
      const c = h('button', { class: 'tk ' + (isSrc ? 'src' : isKey ? 'c1' : 'c' + (i % 2 ? 2 : 0)) + (w && i > this.src ? ' dim' : ''), 'aria-label': `Ver para quem “${t}” olha`, onclick: () => this.clickTok(i) }, t, w && i <= this.src && !isSrc ? h('span', { class: 'w' }, Math.round(w[i] * 100) + '%') : null);
      return c;
    });
    if (!this.no3d) { this.chips = []; this.ghost = null; this.arcsSvg = null; this.box = h('div', { class: 'sheet tl', style: 'padding:0;overflow:hidden' }, this.m3host); v.append(this.box); this.sync3d(); }
    else {
    const row = h('div', { class: 'sent' }, this.chips);
    if (this.mode === 'q') { this.ghost = chipTok(this.revealed ? d.next : 'próximo?', this.revealed ? 'y' : 'c5', { extra: this.revealed ? 'rise' : 'ghost' }); row.append(this.ghost); } else this.ghost = null;
    this.arcsSvg = sv('svg', { class: 'arcs', 'aria-hidden': 'true' });
    this.box = h('div', { class: 'sheet attn tl' }, this.arcsSvg, row); v.append(this.box); }
    if (this.mode === 'banco' && this.src === d.key) v.append(h('div', { class: 'sheet pad tr rise', style: 'text-align:center' }, h('p', { class: 'lbl', style: 'margin:0' }, 'Olhando para os vizinhos, a LLM entende:'), h('p', { class: 'ttl', style: 'font-size:26px' }, d.mean), h('p', { class: 'small muted', style: 'margin:4px 0 0' }, 'As porcentagens mostram quanto da atenção de “banco” vai para cada palavra. O resto fica com ela mesma.')));
    if (this.mode === 'q' && this.revealed) { const top2 = d.w.map((x, j) => [x, d.toks[j]]).sort((a, b) => b[0] - a[0]).slice(0, 2).map(x => x[1]); const hit = this.bet && top2.includes(this.bet);
      v.append(h('div', { class: 'sheet pad tr rise', style: 'text-align:center' }, this.bet ? h('p', { class: 'verdict ' + (hit ? 'g' : 'r') }, hit ? `✓ Boa aposta: “${this.bet}” está entre os mais olhados!` : `✗ “${this.bet}” não foi dos mais olhados.`) : null, h('p', { class: 'lbl', style: 'margin:0' }, 'Os campeões da atenção:'), h('p', { style: 'margin:2px 0 0' }, `“${top2[0]}” e “${top2[1]}” recebem os holofotes mais fortes, e por isso o modelo aposta em `, h('b', null, d.next), '.'))); }
    requestAnimationFrame(() => this.drawArcs());
  },
  drawArcs() {
    const svg = this.arcsSvg; if (!svg || !svg.isConnected || this.src == null) { if (svg) svg.innerHTML = ''; return; }
    svg.innerHTML = ''; const w = this.weightsFor(this.src); const br = this.box.getBoundingClientRect(); const sc = this.chips[this.src].getBoundingClientRect();
    const x1 = sc.left + sc.width / 2 - br.left, y1 = sc.top - br.top;
    w.forEach((v, j) => {
      if (j >= this.src || v < 0.03) return; const r = this.chips[j].getBoundingClientRect();
      const x2 = r.left + r.width / 2 - br.left, y2 = r.top - br.top; const hgt = Math.min(y1, y2) - Math.min(56, 16 + Math.abs(x1 - x2) * 0.3);
      svg.append(sv('path', { d: `M ${x1} ${y1} C ${x1} ${hgt}, ${x2} ${hgt}, ${x2} ${y2}`, fill: 'none', stroke: 'var(--ipe)', 'stroke-width': (2 + v * 16).toFixed(1), 'stroke-linecap': 'round', opacity: (0.4 + v * 1.4).toFixed(2), filter: 'url(#rough)' }));
      svg.append(sv('circle', { cx: x2, cy: y2 - 1, r: 3.5, fill: 'var(--ink)' }));
    });
  },
  clickTok(i) {
    const d = this.cur();
    if (this.mode === 'q' && !this.revealed) { this.bet = d.toks[i]; this.revealed = true; this.src = d.toks.length - 1; SND.play('ok'); complete('v8b'); this.render(); HUD.refresh(); return; }
    this.src = i; SND.play('pop');
    if (this.mode === 'banco' && i === d.key) { this.seenB.add(this.si); if (this.seenB.size === 2) complete('v8a'); }
    this.render(); HUD.refresh();
  },
  setQ(k) { this.qv = k; this.bet = null; if (k !== 'capital' && S.done.v8b) { this.seenQ.add(k); if (this.seenQ.size >= 2) complete('v8c'); } this.revealed = !!S.done.v8b; this.src = this.revealed ? this.cur().toks.length - 1 : null; SND.play('pop'); this.render(); HUD.refresh(); },
  actions() {
    const rows = [];
    if (this.mode === 'banco') {
      rows.push({ label: 'Frase', items: ATT.banco.map((x, i) => ({ ...chip(i ? 'Para sacar dinheiro…' : 'Na praça…', this.si === i, () => { this.si = i; this.src = null; this.render(); HUD.refresh(); }), hot: !S.done.v8a && this.si !== i && this.seenB.has(this.si) })) });
      rows.push([abtn('Acender o holofote de “banco”', () => this.clickTok(this.cur().key), { primary: true, hot: !this.seenB.has(this.si) || this.src !== this.cur().key && !S.done.v8a })]);
    } else if (!this.revealed) { const d = this.cur(); rows.push({ wrap: true, label: 'Aposte: qual token mais ajuda a prever a resposta?', items: d.toks.slice(0, -1).map((t, j) => chip(t, false, () => this.clickTok(j))) }); }
    else rows.push({ label: 'Trocar a pergunta', items: Object.entries(ATT.q).map(([k, x]) => ({ ...chip(x.label, this.qv === k, () => this.setQ(k)), hot: !S.done.v8c && k !== 'capital' && !this.seenQ.has(k) && k !== this.qv && Object.keys(ATT.q).find(z => z !== 'capital' && !this.seenQ.has(z) && z !== this.qv) === k })) });
    return rows;
  },
  hs() { return [['Atenção', () => this.box], ['Transformer', () => this.box, [-150, 0, 0]]]; },
  guide() {
    if (this.mode === 'banco') return { tip: this.src === this.cur().key ? (this.seenB.size < 2 ? 'Veja os arcos: quanto mais grosso, mais “banco” presta atenção. Agora troque de frase.' : 'Mesma palavra, sentidos diferentes: a atenção olha os vizinhos para decidir.') : 'Aperte o botão do holofote (ou toque em “banco”) e veja para quem ele olha.' };
    if (!this.revealed) return { tip: 'Qual palavra da pergunta mais ajuda a adivinhar a resposta? Aposte nos botões.' };
    return { tip: S.done.v8c ? 'É isso que faltava à máquina de Markov: olhar a frase inteira.' : 'Troque a palavra da pergunta nos botões e veja a previsão mudar.' };
  }
});
