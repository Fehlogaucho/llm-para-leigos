/* ============ Fase 2 · Embeddings ============ */
PHASES.push({
  n: 2, name: 'Embeddings', title: 'A galáxia de significados',
  lede: 'Cada token vira uma lista de números, chamada vetor ou embedding. Pense nesses números como coordenadas: palavras de sentido parecido ficam perto umas das outras.',
  view: [[0.6, 5.4, 9.8], [0.3, 1.4, -0.3]],
  caps: ['Embeddings', 'Aqui são 3 números por palavra. Modelos reais usam milhares.'],
  concepts: ['Embedding'],
  missions: [
    { id: 'p2a', text: 'Toque numa palavra para ver o vetor dela', short: 'vetor' },
    { id: 'p2b', text: 'Leve as 3 palavras perdidas para o grupo certo', short: 'palavras perdidas' },
    { id: 'p2c', text: 'Complete a analogia: Brasil → Brasília, Portugal → ?', short: 'analogia' }],
  clusters: {
    pais: { name: 'Países', color: COL.blue, c: [-2.35, 1.3, 0.05] },
    cap: { name: 'Capitais', color: COL.yellow, c: [0.15, 1.85, 0.55] },
    fut: { name: 'Futebol', color: COL.green, c: [3.0, 1.2, -2.2] },
    eco: { name: 'Economia', color: COL.coral, c: [-1.2, 1.3, -3.0] },
    com: { name: 'Comida', color: COL.blueL, c: [3.0, 1.1, 2.4] }
  },
  build(s) {
    const V = [2.4, 0.5, 0.4];
    const countries = { Brasil: [-2.6, 1.0, 1.0], 'França': [-2.2, 1.7, -0.4], 'Itália': [-1.7, 1.1, 0.2], Portugal: [-2.9, 1.8, 0.3], Argentina: [-2.1, 0.7, -0.9] };
    const capOf = { Brasil: 'Brasília', 'França': 'Paris', 'Itália': 'Roma', Portugal: 'Lisboa', Argentina: 'Buenos Aires' };
    const jit = { Brasil: [0.05, 0, -0.05], 'França': [-0.05, 0.05, 0], 'Itália': [0, -0.05, 0.05], Portugal: [0.05, 0.02, 0], Argentina: [0, 0, 0.06] };
    this.V = V; this.capOf = capOf;
    const W = [];
    for (const [k, p] of Object.entries(countries)) { W.push({ t: k, c: 'pais', p }); W.push({ t: capOf[k], c: 'cap', p: p.map((v, i) => v + V[i] + jit[k][i]) }); }
    [['gol', [2.7, 1.0, -2.0]], ['bola', [3.3, 1.4, -2.5]], ['craque', [2.9, 1.8, -1.8]], ['estádio', [3.5, 0.8, -1.9]], ['torcida', [2.6, 1.3, -2.8]]].forEach(([t, p]) => W.push({ t, c: 'fut', p }));
    [['PIB', [-1.4, 1.1, -2.8]], ['inflação', [-0.9, 1.7, -3.2]], ['dólar', [-1.0, 0.9, -3.4]], ['imposto', [-1.7, 1.6, -3.0]]].forEach(([t, p]) => W.push({ t, c: 'eco', p }));
    [['banana', [2.7, 0.9, 2.2]], ['feijão', [3.3, 1.35, 2.6]], ['arroz', [3.1, 0.75, 2.9]], ['café', [2.75, 1.55, 2.5]]].forEach(([t, p]) => W.push({ t, c: 'com', p }));
    this.W = W;
    this.world = new THREE.Group(); s.add(this.world);
    for (const [key, cl] of Object.entries(this.clusters)) {
      const halo = new THREE.Mesh(new THREE.SphereGeometry(1.25, 32, 24), mat(cl.color, { opacity: 0.07, depthWrite: false }));
      halo.position.set(...cl.c); this.world.add(halo); cl.halo = halo;
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.12, 48), new THREE.MeshBasicMaterial({ color: cl.color, transparent: true, opacity: 0.45 }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(cl.c[0], 0.015, cl.c[2]); this.world.add(ring);
      const lb = label(cl.name, { h: 0.34, display: true, size: 24, bg: '#' + new THREE.Color(cl.color).getHexString(), fg: cl.color === COL.yellow || cl.color === COL.blueL ? '#14213A' : '#FFFFFF', border: null });
      lb.position.set(cl.c[0], cl.c[1] + 1.45, cl.c[2]); this.world.add(lb);
      addPick(s, lb, { click: () => this.tryPlace(key), tip: () => this.lost && this.selLost ? `Levar “${this.selLost.t}” para <b>${cl.name}</b>` : cl.name });
      cl.label = lb;
    }
    this.W.forEach(w => this.addWord(w));
    // axes
    const ax = new THREE.Group(); ax.position.set(-5.0, 0.03, 3.4); this.world.add(ax);
    [[1, 0, 0, 'd1'], [0, 1, 0, 'd2'], [0, 0, -1, 'd3']].forEach(([x, y, z, t]) => { ax.add(arrow3([0, 0, 0], [x * 1.1, y * 1.1, z * 1.1], COL.ink, 0.02)); const l = label(t, { h: 0.24, mono: true, size: 22 }); l.position.set(x * 1.35, y * 1.35, z * 1.35); ax.add(l); });
    this.nbr = new THREE.Group(); this.world.add(this.nbr);
    this.arrows = new THREE.Group(); this.arrows.visible = false; this.world.add(this.arrows);
    for (const k of ['Brasil', 'França', 'Itália', 'Argentina']) {
      const a = this.W.find(w => w.t === k), b = this.W.find(w => w.t === this.capOf[k]);
      this.arrows.add(arrow3(a.p, lerpV(a.p, b.p, 0.86), COL.yellow, 0.03, { emissive: COL.yellow, ei: 0.3 }));
    }
    this.answer = new THREE.Group(); this.world.add(this.answer);
    // lost words
    this.lostDefs = [{ t: 'Madri', c: 'cap', p: [0.9, 2.3, 1.2] }, { t: 'pênalti', c: 'fut', p: [3.6, 1.95, -2.4] }, { t: 'salário', c: 'eco', p: [-0.6, 1.2, -2.6] }];
    this.lost = [];
    this.lostDefs.forEach((d, i) => {
      const g = new THREE.Group(); const sp = sphere(0.22, COL.grey, { emissive: COL.yellow, ei: 0 }); g.add(sp);
      const lb = label(d.t, { h: 0.28 }); lb.position.y = 0.42; g.add(lb);
      g.position.set(-1.3 + i * 1.3, 3.7, 0.6); g.userData.home = g.position.clone(); g.userData.phase = i * 1.7;
      const L = { ...d, g, sp }; this.lost.push(L);
      addPick(s, g, { click: () => this.selectLost(L), tip: () => `Palavra perdida: <b>${d.t}</b><br>Toque para pegar e escolha o grupo nos botões`,
        drag: {
          start: () => { if (L.placed) return; this.lost.forEach(x => x.sp.material.emissiveIntensity = 0); this.selLost = L; L.sp.material.emissiveIntensity = 0.6; this.dragging = L; },
          move: (o, pt) => { if (L.placed) return; g.position.copy(pt); this.hiCluster(this.nearCluster(pt)); },
          end: (o, pt) => { this.dragging = null; this.hiCluster(null); if (L.placed) return; const k = pt ? this.nearCluster(pt) : null; if (k) this.tryPlace(k); else { SND.play('bad'); moveTo(g, g.userData.home.toArray(), 500, ease.back); this.drawInfo(); } }
        } });
      this.world.add(g);
    });
    this.ghost = new THREE.Group(); this.ghost.visible = false; this.world.add(this.ghost);
    const gp = portugalGuess(this); const gs = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), new THREE.MeshBasicMaterial({ color: COL.yellow, transparent: true, opacity: 0.45 }));
    gs.position.set(...gp); this.ghost.add(gs); const gl = label('?', { h: 0.3, display: true }); gl.position.set(gp[0], gp[1] + 0.45, gp[2]); this.ghost.add(gl);
    function portugalGuess(P) { const pt = P.W.find(w => w.t === 'Portugal').p; return pt.map((v, i) => v + P.V[i]); }
    function lerpV(a, b, k) { return a.map((v, i) => v + (b[i] - v) * k); }
    this.sel = null; this.selLost = null; this.analogy = false; this.selGlow = glowSprite(COL.yellow, 1.2, 0.6);
  },
  addWord(w) {
    const s = this.scene; const cl = this.clusters[w.c];
    const g = new THREE.Group(); g.position.set(...w.p);
    const sp = sphere(0.19, cl.color, { emissive: COL.yellow, ei: 0 }); g.add(sp);
    const lb = label(w.t, { h: 0.26 }); lb.position.y = 0.4; g.add(lb);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, w.p[1], 6), new THREE.MeshBasicMaterial({ color: COL.grey, transparent: true, opacity: 0.4 }));
    pin.position.y = -w.p[1] / 2; g.add(pin);
    w.g = g; w.sp = sp;
    addPick(s, g, { click: () => this.clickWord(w), tip: () => `<b>${w.t}</b><br><span style="font-family:var(--f-mono)">${this.vecStr(w.p)}</span>` });
    this.world.add(g);
  },
  vec(p) { return [p[0] / 4, (p[1] - 1.5) / 1.2, p[2] / 4]; },
  vecStr(p) { return '[' + this.vec(p).map(v => v.toFixed(2).replace('.', ',').replace('-', '−')).join(' · ') + ']'; },
  sim(a, b) { const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); return Math.exp(-d * 0.45); },
  clickWord(w) {
    if (this.selLost) { this.tryPlace(w.c); return; }
    if (this.analogy) this.answerAnalogy(w);
    this.select(w);
  },
  select(w) {
    if (this.sel) { this.sel.sp.material.emissiveIntensity = 0; this.sel.g.scale.setScalar(1); }
    this.sel = w; w.sp.material.emissiveIntensity = 0.5; w.g.scale.setScalar(1.35); w.g.add(this.selGlow); SND.play('pop');
    clearGroup(this.nbr);
    const others = this.W.filter(o => o !== w).map(o => ({ o, s: this.sim(w.p, o.p) })).sort((a, b) => b.s - a.s).slice(0, 3);
    this.near = others;
    others.forEach(({ o, s }) => {
      const r = rod(w.p, o.p, 0.018, COL.ink, { opacity: 0.55 }); this.nbr.add(r);
      const m = w.p.map((v, i) => (v + o.p[i]) / 2); const l = label(Math.round(s * 100) + '%', { h: 0.22, mono: true, size: 20, bg: '#14213A', fg: '#FFFFFF', border: null }); l.position.set(m[0], m[1] + 0.12, m[2]); this.nbr.add(l);
    });
    complete('p2a'); this.drawInfo();
  },
  onEmpty() { if (this.selLost) return; if (this.sel) { this.sel.sp.material.emissiveIntensity = 0; this.sel.g.scale.setScalar(1); this.sel.g.remove(this.selGlow); this.sel = null; clearGroup(this.nbr); this.drawInfo(); } },
  selectLost(L) {
    if (L.placed) return;
    this.lost.forEach(x => x.sp.material.emissiveIntensity = 0);
    this.selLost = this.selLost === L ? null : L; if (this.selLost) L.sp.material.emissiveIntensity = 0.6;
    this.msg = this.selLost ? `Você pegou “${L.t}”. Agora clique no nome de um grupo ou numa palavra desse grupo.` : null; this.msgKind = 'call';
    this.drawInfo();
  },
  async tryPlace(ck) {
    const L = this.selLost; if (!L) return;
    const cl = this.clusters[ck];
    if (ck === L.c) {
      L.placed = true; this.selLost = null; L.sp.material.emissiveIntensity = 0;
      removePick(this.scene, L.g); SND.play('drop');
      await moveTo(L.g, L.p, 900, ease.io);
      L.sp.material.color.set(cl.color);
      const w = { t: L.t, c: L.c, p: L.p }; this.world.remove(L.g); disposeGroup(L.g); this.W.push(w); this.addWord(w);
      this.msg = `Isso! “${L.t}” mora perto de outras palavras de ${cl.name.toLowerCase()}. No modelo real, isso acontece sozinho durante o treinamento, porque essas palavras aparecem em frases parecidas.`; this.msgKind = 'ok';
      if (this.lost.every(x => x.placed)) complete('p2b');
    } else {
      const g = L.g, x0 = g.position.x;
      SND.play('bad'); await anim(420, k => { g.position.x = x0 + Math.sin(k * Math.PI * 6) * 0.15 * (1 - k); });
      if (g.position.distanceTo(g.userData.home) > 0.3) await moveTo(g, g.userData.home.toArray(), 500, ease.back);
      this.selLost = null; L.sp.material.emissiveIntensity = 0;
      this.msg = `Hmm, “${L.t}” não combina com ${cl.name}. Pense em que tipo de frase essa palavra costuma aparecer.`; this.msgKind = 'bad';
    }
    this.drawInfo();
  },
  toggleAnalogy() { this.analogy = !this.analogy; this.arrows.visible = this.analogy; this.drawInfo(); },
  answerAnalogy(w) {
    if (w.t === 'Lisboa') {
      const pt = this.W.find(x => x.t === 'Portugal');
      clearGroup(this.answer); this.answer.add(arrow3(pt.p, pt.p.map((v, i) => v + (w.p[i] - v) * 0.86), COL.green, 0.035, { emissive: COL.green, ei: 0.3 }));
      this.ghost.visible = false; this.anaMsg = 'Exato! A seta Portugal → Lisboa aponta na mesma direção das outras. No espaço dos embeddings, a ideia “capital de” vira uma direção.'; this.anaKind = 'ok';
      complete('p2c');
    } else { this.anaMsg = `“${w.t}” não completa a analogia. Siga a mesma direção das setas amarelas a partir de Portugal.`; this.anaKind = 'bad'; }
  },
  tick(dt, t) { if (!this.lost) return; this.lost.forEach(L => { if (!L.placed && L.g.userData.home && this.dragging !== L && L.g.position.distanceTo(L.g.userData.home) < 0.5) L.g.position.y = L.g.userData.home.y + Math.sin(t * 1.6 + L.g.userData.phase) * 0.12; }); },
  nearCluster(pt) { let best = null, bd = 1.5; for (const [k, cl] of Object.entries(this.clusters)) { const d = rayDist(pt, new THREE.Vector3(...cl.c)); if (d < bd) { bd = d; best = k; } } return best; },
  hiCluster(k) { for (const [kk, cl] of Object.entries(this.clusters)) { cl.halo.material.opacity = kk === k ? 0.22 : 0.07; cl.halo.scale.setScalar(kk === k ? 1.08 : 1); } },
  guide() {
    if (!S.done.p2a && !this.sel) return { target: this.W.find(w => w.t === 'Brasil').g, tip: 'Escolha uma palavra nos botões lá embaixo para ver os 3 números que a representam.' };
    const L = this.lost.find(x => !x.placed);
    if (L) return { target: this.selLost ? null : L.g, tip: this.selLost ? `Agora escolha, nos botões lá embaixo, o grupo em que “${this.selLost.t}” combina.` : 'Três palavras se perderam na galáxia. Escolha uma nos botões lá embaixo e depois o grupo certo para ela.' };
    if (!S.done.p2c) return { target: this.W.find(w => w.t === 'Portugal').g, tip: this.analogy ? 'Cada seta amarela liga um país à sua capital. Siga a mesma direção a partir de Portugal e escolha a capital nos botões lá embaixo.' : 'Agora a analogia: aperte “Mostrar setas país → capital” nos botões lá embaixo.' };
    return { tip: 'Use as setas da lateral para girar a galáxia. Palavras de sentido parecido moram perto!' };
  },
  panel(body) { this.info = h('div', { class: 'sec' }); body.append(this.info); this.drawInfo();
    body.append(h('details', { class: 'more' }, h('summary', null, 'Para curiosos: de onde vêm esses números?'),
      h('div', null,
        h('p', null, 'Ninguém escolhe as coordenadas à mão. No começo do treinamento elas são aleatórias. Como “Paris” e “Roma” aparecem em frases parecidas (“a capital da … é …”), os ajustes do treinamento vão aproximando essas palavras.'),
        h('p', null, 'A frase famosa é: “uma palavra é conhecida pelas companhias que mantém”, do linguista J. R. Firth, de 1957. Em 2013, o word2vec mostrou que dava para fazer contas com significados: rei − homem + mulher ≈ rainha.')))); },
  drawInfo() {
    const b = this.info; if (!b) return; b.innerHTML = '';
    if (this.sel) {
      const w = this.sel;
      b.append(h('div', { class: 'box' },
        h('div', { class: 'row', style: 'justify-content:space-between' }, h('b', null, `Vetor de “${w.t}”`), h('span', { class: 'small muted' }, this.clusters[w.c].name)),
        h('div', { class: 'mono', style: 'font-size:18px' }, this.vecStr(w.p)),
        h('p', { class: 'small' }, 'Vizinhos mais próximos (semelhança ilustrativa):'),
        h('div', { class: 'tokrow' }, (this.near || []).map(n => h('span', { class: 'tok' }, `${n.o.t} ${Math.round(n.s * 100)}%`)))));
    } else b.append(h('div', { class: 'box' }, h('p', { class: 'small' }, 'Clique numa esfera para ver os 3 números dela e quem mora perto. Gire a cena para ver a profundidade.')));
    // lost words
    const lostBox = h('div', { class: 'box' + (this.msg ? ' ' + this.msgKind : '') }, h('h2', null, 'Palavras perdidas'),
      h('div', { class: 'row' }, this.lost.map(L => L.placed ? h('span', { class: 'pill okp' }, L.t + ' ✓') : pill(L.t, this.selLost === L, () => this.selectLost(L)))),
      h('p', { class: 'small' }, this.msg || 'Pegue uma palavra (aqui ou na cena, flutuando no alto) e leve até o grupo onde ela faz sentido.'));
    b.append(lostBox);
    const ana = h('div', { class: 'box' + (this.anaMsg ? ' ' + this.anaKind : '') }, h('h2', null, 'Analogia'),
      h('p', { class: 'small' }, 'Brasil → Brasília. França → Paris. Portugal → ?'),
      h('div', { class: 'row' }, btn(this.analogy ? 'Esconder setas' : 'Mostrar setas país → capital', this.analogy ? '' : 'primary', () => this.toggleAnalogy()),
        this.analogy ? btn('Dica', 'small', () => { this.ghost.visible = true; }) : null),
      this.analogy ? h('p', { class: 'small' }, this.anaMsg || 'Clique, na cena, na palavra que completa a analogia.') : null);
    b.append(ana);
  }
});
