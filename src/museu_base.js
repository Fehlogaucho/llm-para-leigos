/* ============ Fase 4 · Museu das Matrizes ============ */
function makeTok() {
  const g = new THREE.Group();
  const body = mesh(rbox(0.52, 0.5, 0.46, 0.12), mat(COL.yellow)); body.position.y = 0.3; g.add(body);
  [-0.11, 0.11].forEach(x => { const e = sphere(0.075, 0xFFFFFF, { seg: 14 }); e.position.set(x, 0.36, 0.22); g.add(e); const p = sphere(0.038, COL.ink, { seg: 10, shadow: false }); p.position.set(x, 0.36, 0.28); g.add(p); });
  const ant = rod([0, 0.55, 0], [0, 0.78, 0], 0.012, COL.ink); g.add(ant); const ball = sphere(0.05, COL.coral, { seg: 12 }); ball.position.y = 0.8; g.add(ball);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 16, Math.PI), new THREE.MeshBasicMaterial({ color: COL.ink })); smile.rotation.z = Math.PI; smile.position.set(0, 0.25, 0.235); g.add(smile);
  return g;
}
PHASES.push({
  n: 4, name: 'Matrizes', title: 'O museu das matrizes',
  lede: 'LLMs são feitas de matrizes: tabelas de números. Essa ideia tem mais de 2.000 anos. Viaje pelo tempo com o Tok, depois seja você mesmo uma matriz.',
  view: [[-9.2, 3.4, 6.2], [-10.2, 0.9, 0]],
  caps: ['Museu das Matrizes'],
  concepts: ['Matriz', 'Parâmetro', 'GPU'],
  missions: [
    { id: 'p4a', text: 'Visite as 12 paradas da linha do tempo', short: 'linha do tempo' },
    { id: 'p4b', text: 'Seja a matriz: faça as 3 perguntas acertarem', short: 'máquina de votos' },
    { id: 'p4c', text: 'Gire a cena e veja a matriz 4×4 mudar ao vivo', short: 'matriz ao vivo' }],
  stops: [
    { y: 'há ~2.000 anos', who: 'China · Os Nove Capítulos da Arte Matemática', t: 'Números em colunas, num tabuleiro', x: 'Um problema do livro: “3 feixes de arroz bom, 2 de médio e 1 de fraco rendem 39 medidas…”. Os calculistas arrumavam esses números em colunas num tabuleiro, com varetas de bambu, e iam combinando as colunas até achar quanto rende cada tipo.', l: 'É a ideia de uma matriz: uma tabela de números em que a posição de cada número tem significado.' },
    { y: '1683', who: 'Seki Takakazu (Japão) e Gottfried Leibniz (Alemanha)', t: 'Um número que resume a tabela', x: 'Sem se conhecerem, os dois descobriram o determinante: uma conta feita com os números da tabela que diz se o problema tem uma única resposta.', l: 'Mostrou que uma tabela inteira pode ser manipulada com regras próprias.' },
    { y: '1809', who: 'Carl Friedrich Gauss', t: 'Caçando asteroides', x: 'Para calcular órbitas a partir de muitas observações imperfeitas, Gauss organizou um jeito de eliminar incógnitas passo a passo (hoje, “eliminação de Gauss”) e usou os mínimos quadrados, método publicado também por Legendre, para achar a resposta que menos erra.', l: '“Achar os números que menos erram” é o que o treinamento de uma LLM faz, em escala gigantesca.' },
    { y: '1850', who: 'James Joseph Sylvester', t: 'O nome “matriz”', x: 'O matemático inglês batizou a tabela de “matrix”, palavra latina para útero, o lugar onde algo é gerado. Para ele, a tabela era a mãe de onde “nasciam” os determinantes.', l: 'Hoje é dessa “mãe” que nascem as respostas das IAs.' },
    { y: '1858', who: 'Arthur Cayley', t: 'A tabela vira personagem', x: 'Cayley, amigo de Sylvester, mostrou que matrizes podem ser somadas e multiplicadas entre si, quase como números. A matriz passou a ser um objeto com vida própria.', l: 'Multiplicar matrizes é o que uma LLM mais faz: trilhões de multiplicações para escrever uma resposta.' },
    { y: '1925', who: 'Werner Heisenberg e Max Born', t: 'O átomo em tabelas', x: 'Heisenberg descreveu o átomo com tabelas de números esquisitas. Born percebeu que aquilo eram matrizes, e nasceu a “mecânica matricial”, um dos pilares da física quântica.', l: 'Matrizes provaram que servem para sistemas complicados demais para a intuição.' },
    { y: '1958', who: 'Frank Rosenblatt', t: 'O perceptron', x: 'Inspirado nos neurônios, Rosenblatt construiu uma máquina que aprendia a reconhecer padrões. Cada entrada tinha um peso, e a máquina ajustava os pesos sempre que errava.', l: 'Os pesos de uma LLM são descendentes diretos desses: números corrigidos a cada erro.' },
    { y: '1986', who: 'Rumelhart, Hinton e Williams', t: 'Backpropagation', x: 'Eles popularizaram a retropropagação: um jeito eficiente de descobrir quanto cada peso, em várias camadas, contribuiu para o erro. O erro “volta” da saída para a entrada, ajustando tudo no caminho.', l: 'Todas as LLMs são treinadas assim até hoje. Você vai ver isso na fase 6.' },
    { y: '1999–2012', who: 'As placas de vídeo (GPUs)', t: 'Uma ajuda dos videogames', x: 'Jogos 3D precisam girar e projetar milhões de triângulos por segundo, e isso é multiplicação de matrizes. As placas de vídeo ficaram ótimas nisso. Em 2012, a rede AlexNet, treinada em GPUs, venceu com folga uma competição de reconhecimento de imagens.', l: 'Sem esse hardware paralelo e barato, treinar LLMs seria inviável. Este jogo usa a sua placa de vídeo agora.' },
    { y: '2003–2013', who: 'Yoshua Bengio · Tomas Mikolov (word2vec)', t: 'Palavras viram vetores', x: 'Em 2003, Bengio e colegas treinaram uma rede que aprendia um vetor para cada palavra enquanto aprendia a prever a próxima. Em 2013, o word2vec mostrou que dava para fazer contas com sentidos: rei − homem + mulher ≈ rainha.', l: 'É a galáxia da fase 2, e é o tipo de modelo que você vai criar na fase 10.' },
    { y: '2017', who: 'Vaswani e colegas (Google)', t: '“Attention Is All You Need”', x: 'O artigo apresentou o Transformer, uma arquitetura feita de atenção e multiplicações de matrizes, fácil de rodar em paralelo.', l: 'GPT, Claude, Gemini: todo LLM moderno é um Transformer.' },
    { y: '2020–2022', who: 'GPT-3 · RAG · ChatGPT', t: 'A era das LLMs', x: 'Em 2020 veio o GPT-3, com 175 bilhões de parâmetros. No mesmo ano, pesquisadores do Facebook batizaram o RAG, que junta busca em documentos com geração de texto. Em 2022, o ChatGPT levou tudo isso ao grande público.', l: 'Parâmetros são os números dentro das matrizes. O GPT-3 tinha 175 bilhões deles.' }],
  build(s) {
    this.mode = 'tempo'; this.si = 0; this.visited = new Set();
    // ---- timeline ----
    const T = this.tl = new THREE.Group(); s.add(T);
    const pts = []; for (let i = 0; i <= 40; i++) { const x = -11 + i * 22 / 40; pts.push(new THREE.Vector3(x, 0.03, Math.sin(x * 0.33) * 2.0)); }
    this.path = new THREE.CatmullRomCurve3(pts);
    for (let i = 0; i <= 90; i++) { const p = this.path.getPoint(i / 90); const tan = this.path.getTangent(i / 90); const tile = mesh(new THREE.BoxGeometry(0.36, 0.04, 0.36), mat(i % 3 === 0 ? COL.blue : COL.white), false); tile.receiveShadow = true; tile.position.copy(p); tile.rotation.y = Math.atan2(tan.x, tan.z) + Math.PI / 4; T.add(tile); }
    this.stopObjs = this.stops.map((st, i) => {
      const t = (i + 0.5) / this.stops.length; const p = this.path.getPoint(t); const side = i % 2 ? 1 : -1;
      const g = new THREE.Group(); g.position.set(p.x, 0, p.z + side * 1.25); T.add(g);
      const ped = mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.34, 32), mat(COL.white)); ped.position.y = 0.17; g.add(ped);
      const ring = mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.05, 32), mat(COL.blue)); ring.position.y = 0.33; g.add(ring);
      const obj = this.artifact(i); obj.position.y = 0.36; g.add(obj); g.userData.obj = obj;
      const yl = label(st.y, { h: 0.3, display: true, size: 22, bg: '#1F4FC4', fg: '#FFFFFF', border: null }); yl.position.set(0, 2.05, 0); g.add(yl);
      addPick(s, g, { click: () => this.goStop(i), tip: `<b>${st.y}</b> · ${st.t}` });
      g.userData.t = t; return g;
    });
    this.tok = makeTok(); T.add(this.tok); const p0 = this.path.getPoint(this.stopObjs[0].userData.t); this.tok.position.copy(p0);
    // ---- voting board ----
    const B = this.board = new THREE.Group(); B.visible = false; s.add(B);
    const table = mesh(rbox(6.6, 0.3, 4.4, 0.1), mat(COL.white)); table.position.set(0.4, 0.15, 0.2); B.add(table);
    this.rows = ['Brasília', 'Paris', 'gol']; this.colsN = ['capital', 'Brasil', 'França', 'futebol'];
    this.tests = [{ t: 'A capital do Brasil', x: [1, 1, 0, 0], a: 0 }, { t: 'A capital da França', x: [1, 0, 1, 0], a: 1 }, { t: 'O futebol do Brasil', x: [0, 1, 0, 1], a: 2 }];
    this.Wv = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]; this.ti = 0;
    const cx = c => -1.1 + c * 0.95, rz = r => -0.9 + r * 0.95;
    this.cellM = [];
    this.rows.forEach((rn, r) => {
      const l = label(rn, { h: 0.34, size: 24 }); l.position.set(-2.35, 0.55, rz(r)); B.add(l);
      this.cellM[r] = this.colsN.map((cn, c) => {
        const tile = tokenBlock('0', { bg: '#E4E8EE', fg: '#14213A' }, { w: 0.8, h: 0.8, d: 0.2, size: 40, mono: true });
        tile.rotation.x = -Math.PI / 2; tile.position.set(cx(c), 0.41, rz(r)); B.add(tile);
        addPick(s, tile, { click: () => this.cycle(r, c), tip: () => `peso de <b>${cn}</b> no voto de <b>${rn}</b>: ${this.Wv[r][c]}<br>clique para mudar` });
        return tile;
      });
    });
    this.lamps = this.colsN.map((cn, c) => { const l = label(cn, { h: 0.3, size: 22 }); l.position.set(cx(c), 0.62, -1.75); B.add(l); const lamp = sphere(0.13, COL.grey, { emissive: COL.yellow, ei: 0 }); lamp.position.set(cx(c), 0.95, -1.75); B.add(lamp); return lamp; });
    const xl = label('entrada (vetor da pergunta)', { h: 0.24, size: 18, weight: 400 }); xl.position.set(0.3, 1.35, -1.75); B.add(xl);
    this.scoreBars = this.rows.map((rn, r) => { const bar = mesh(new THREE.BoxGeometry(0.36, 1, 0.36), mat(COL.blueL)); bar.position.set(2.85, 0.3, rz(r)); B.add(bar); const sl = label('0', { h: 0.28, mono: true, size: 22 }); sl.position.set(2.85, 0.9, rz(r)); B.add(sl); return { bar, sl }; });
    const sh = label('votos', { h: 0.26, size: 20, weight: 400 }); sh.position.set(2.85, 1.95, -1.3); B.add(sh);
    // ---- why: live matrix ----
    const Y = this.why = new THREE.Group(); Y.visible = false; s.add(Y);
    const cube = new THREE.Group(); cube.position.set(0, 1.5, 0); Y.add(cube); this.wcube = cube;
    for (let i = 0; i < 27; i++) { const c = i % 3, r = Math.floor(i / 3) % 3, d = Math.floor(i / 9); const m = mesh(rbox(0.5, 0.5, 0.5, 0.06), mat([COL.blue, COL.white, COL.yellow, COL.blueL][(i * 7) % 4])); m.position.set((c - 1) * 0.58, (d - 1) * 0.58, (r - 1) * 0.58); cube.add(m); }
    const yl = label('Toda cena 3D é desenhada com matrizes', { h: 0.34, size: 22 }); yl.position.set(0, 3.2, 0); Y.add(yl);
    this.camStart = null;
  },
  artifact(i) {
    const g = new THREE.Group();
    const wood = 0xB9824D;
    switch (i) {
      case 0: { const b = mesh(new THREE.BoxGeometry(1.0, 0.07, 0.8), mat(wood)); b.position.y = 0.04; g.add(b);
        const cols = [[3, 2, 1], [2, 3, 1], [1, 2, 3]]; cols.forEach((col, c) => col.forEach((n, r) => { for (let k = 0; k < n; k++) { const rd = rod([(c - 1) * 0.3 - 0.08 + k * 0.06, 0.1, (r - 1) * 0.22 - 0.07], [(c - 1) * 0.3 - 0.08 + k * 0.06, 0.1, (r - 1) * 0.22 + 0.07], 0.014, k % 2 ? COL.coral : COL.ink); g.add(rd); } })); break; }
      case 1: { [[-.18, .18], [.18, .18], [-.18, -.18], [.18, -.18]].forEach(([x, y], k) => { const t = tokenBlock(['a', 'b', 'c', 'd'][k], { bg: '#F7F8FA', fg: '#14213A' }, { w: .3, h: .3, d: .1, size: 30 }); t.position.set(x, 0.6 + y, 0); g.add(t); });
        g.add(rod([-.3, .9, .08], [.3, .3, .08], .02, COL.blue)); g.add(rod([.3, .9, .08], [-.3, .3, .08], .02, COL.coral)); break; }
      case 2: { const tube = mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.9, 16), mat(COL.ink)); tube.position.set(0, 0.75, 0); tube.rotation.z = -0.8; g.add(tube);
        [[-.25, -.2], [.25, -.2], [0, .25]].forEach(([x, z]) => g.add(rod([0, .5, 0], [x, 0, z], .015, COL.grey)));
        const ast = mesh(new THREE.DodecahedronGeometry(0.12, 0), mat(COL.grey)); ast.position.set(0.55, 1.35, 0); g.add(ast); g.userData.spin = ast; break; }
      case 3: { const p = tokenBlock('MATRIX', { bg: '#14213A', fg: '#F2B400' }, { w: 1.1, h: 0.42, d: 0.16, size: 30 }); p.position.y = 0.55; g.add(p);
        const s2 = label('latim: útero, origem', { h: .2, size: 18, weight: 400 }); s2.position.y = 1.0; g.add(s2); break; }
      case 4: { [-0.38, 0.38].forEach(x => { for (let k = 0; k < 9; k++) { const m = mesh(new THREE.BoxGeometry(.1, .1, .1), mat(k % 2 ? COL.blue : COL.blueL)); m.position.set(x + (k % 3 - 1) * .12, .55 + (Math.floor(k / 3) - 1) * .12, 0); g.add(m); } });
        const xx = label('×', { h: .3, display: true, bg: null, border: null }); xx.position.y = .55; g.add(xx); break; }
      case 5: { const n = sphere(0.1, COL.coral); n.position.y = 0.7; g.add(n); [0, 1.1, -1.1].forEach((r, k) => { const o = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.012, 8, 48), new THREE.MeshBasicMaterial({ color: COL.blue })); o.position.y = .7; o.rotation.set(Math.PI / 2 + r * 0.5, r, 0); g.add(o); }); g.userData.spin = g; break; }
      case 6: { const n = sphere(0.16, COL.yellow); n.position.set(0.25, 0.65, 0); g.add(n); [0.02, 0.05, 0.012, 0.035].forEach((r, k) => g.add(rod([-0.45, 0.35 + k * 0.2, 0], [0.25, 0.65, 0], r, COL.blue))); break; }
      case 7: { const L = [[-.35, 3], [0, 3], [.35, 2]]; const nodes = []; L.forEach(([x, n]) => { for (let k = 0; k < n; k++) { const y = .55 + (k - (n - 1) / 2) * .22; const sp = sphere(.06, COL.blue, { seg: 12 }); sp.position.set(x, y, 0); g.add(sp); nodes.push([x, y]); } });
        for (const a of nodes) for (const b of nodes) if (b[0] - a[0] > .3 && b[0] - a[0] < .4) g.add(rod([a[0], a[1], 0], [b[0], b[1], 0], .006, COL.grey));
        g.add(arrow3([.45, 1.0, .1], [-.45, 1.0, .1], COL.coral, .018)); break; }
      case 8: { const c = mesh(rbox(1.0, 0.12, 0.6, 0.03), mat(0x1E6B4F)); c.position.y = 0.45; g.add(c); const fans = []; [-.25, .25].forEach(x => { const f = mesh(new THREE.CylinderGeometry(.17, .17, .06, 20), mat(COL.ink)); f.position.set(x, .54, 0); g.add(f); const bl = mesh(new THREE.BoxGeometry(.3, .02, .05), mat(COL.grey)); bl.position.set(x, .58, 0); g.add(bl); fans.push(bl); }); g.userData.fans = fans; break; }
      case 9: { const P = { rei: [-.35, .95], rainha: [.3, 1.1], homem: [-.35, .45], mulher: [.3, .6] }; for (const [k, [x, y]] of Object.entries(P)) { const sp = sphere(.07, COL.blue, { seg: 12 }); sp.position.set(x, y, 0); g.add(sp); const l = label(k, { h: .17, size: 18 }); l.position.set(x, y + .16, 0); g.add(l); }
        g.add(arrow3([-.3, .96, 0], [.24, 1.09, 0], COL.yellow, .014)); g.add(arrow3([-.3, .46, 0], [.24, .59, 0], COL.yellow, .014)); break; }
      case 10: { for (let k = 0; k < 4; k++) { const sl = mesh(rbox(0.9, 0.13, 0.6, 0.04), mat(k % 2 ? COL.blueL : COL.blue)); sl.position.y = 0.12 + k * 0.18; g.add(sl); } g.add(arcTube([-.3, .85, 0], [.3, .85, 0], .3, .015, COL.yellow)); g.add(arcTube([-.3, .85, 0], [.1, .85, 0], .18, .01, COL.yellow)); break; }
      case 11: { for (let k = 0; k < 125; k++) { const m = mesh(new THREE.BoxGeometry(.1, .1, .1), mat([COL.blue, COL.blueL, COL.yellow, COL.white][(k * 13) % 4]), false); m.position.set((k % 5 - 2) * .12, .35 + (Math.floor(k / 25)) * .12, (Math.floor(k / 5) % 5 - 2) * .12); g.add(m); }
        const book = mesh(new THREE.BoxGeometry(.12, .36, .28), mat(COL.coral)); book.position.set(.5, .18, 0); g.add(book); break; }
    }
    return g;
  },
  enter() { this.setMode(this.mode, true); },
  setMode(m, first) {
    this.mode = m; this.tl.visible = m === 'tempo'; this.board.visible = m === 'votos'; this.why.visible = m === 'porque';
    if (this.segEl) this.segEl.set(m);
    const lm = $('#liveMatrix'); if (lm) lm.remove();
    if (m === 'tempo') this.goStop(this.si, true);
    if (m === 'votos') { flyTo([0.5, 6.4, 5.8], [0.4, 0.4, 0.1]); this.updateBoard(); }
    if (m === 'porque') { flyTo([0.2, 3.2, 6.6], [0, 1.5, 0]); this.makeLive(); this.camStart = null; setTimeout(() => { if (this.mode === 'porque') this.camStart = E.camera.position.clone().sub(E.controls.target).normalize(); }, 1000); }
    setCaps(m === 'tempo' ? ['Museu das Matrizes', 'Linha do tempo'] : m === 'votos' ? ['Você é a matriz', 'Cada voto = soma de entrada × peso'] : ['Por que matrizes?']);
    this.drawInfo();
  },
  async goStop(i, instant) {
    i = clamp(i, 0, this.stops.length - 1); const prev = this.si; if (!instant) SND.play('pop'); this.si = i; this.visited.add(i);
    const g = this.stopObjs[i]; const gp = g.position;
    flyTo([gp.x + 0.5, 3.0, gp.z + 4.9], [gp.x, 0.95, gp.z], instant ? 700 : 1000);
    const t0 = this.stopObjs[prev].userData.t, t1 = g.userData.t;
    if (prev !== i) {
      const tk = this.tok; const ok = live(this); const fw = t1 >= t0 ? 1 : -1; const hops = Math.max(2, Math.abs(i - prev) * 2);
      anim(Math.min(1600, 400 + Math.abs(i - prev) * 220), k => {
        if (!ok()) return; const u = lerp(t0, t1, k); const p = this.path.getPoint(u); const tan = this.path.getTangent(u).multiplyScalar(fw);
        tk.position.set(p.x, Math.abs(Math.sin(k * Math.PI * hops)) * 0.35, p.z); tk.rotation.y = Math.atan2(tan.x, tan.z);
      }, ease.io).then(() => { if (ok()) anim(300, k => { tk.rotation.y = lerp(tk.rotation.y, 0, k); }); });
    }
    if (this.visited.size === this.stops.length) complete('p4a');
    this.drawInfo();
  },
  cycle(r, c) { SND.play('pop'); const seq = [0, 1, 2, -1]; this.Wv[r][c] = seq[(seq.indexOf(this.Wv[r][c]) + 1) % 4]; this.updateBoard(); const t = this.cellM[r][c]; anim(200, k => t.position.y = 0.41 + Math.sin(k * Math.PI) * 0.15); },
  scores(x) { return this.Wv.map(row => row.reduce((a, w, c) => a + w * x[c], 0)); },
  passes(tst) { const sc = this.scores(tst.x); return sc.every((v, r) => r === tst.a || v < sc[tst.a]); },
  updateBoard() {
    if (!this.cellM) return; const tst = this.tests[this.ti]; const sc = this.scores(tst.x); const mx = Math.max(...sc);
    this.Wv.forEach((row, r) => row.forEach((w, c) => { const t = this.cellM[r][c]; t.userData.box.material.color.copy(weightColor(w, 2)); setFace(t.userData.face, (w > 0 ? '+' : '') + w, 0.8, 0.8, { fg: Math.abs(w) >= 2 ? '#FFFFFF' : '#14213A', size: 40, mono: true }); t.userData.box.material.emissive.set(tst.x[c] && w !== 0 ? COL.yellow : 0); t.userData.box.material.emissiveIntensity = tst.x[c] && w !== 0 ? 0.25 : 0; }));
    this.lamps.forEach((l, c) => { l.material.color.set(tst.x[c] ? COL.yellow : COL.grey); l.material.emissiveIntensity = tst.x[c] ? 0.6 : 0; });
    this.scoreBars.forEach(({ bar, sl }, r) => { const v = sc[r]; const hh = Math.max(0.05, Math.abs(v) * 0.32); bar.scale.y = hh; bar.position.y = 0.3 + hh / 2; bar.material.color.set(v === mx && sc.filter(x => x === mx).length === 1 ? COL.yellow : v < 0 ? COL.coral : COL.blueL); setLabel(sl, (v > 0 ? '+' : '') + v); sl.position.y = 0.3 + hh + 0.25; });
    if (this.tests.every(t => this.passes(t))) complete('p4b');
    this.drawInfo();
  },
  makeLive() {
    const box = h('div', { class: 'live-matrix', id: 'liveMatrix' }, h('div', { class: 'lm-t' }, 'Matriz da câmera, ao vivo'));
    const tb = h('table'); this.lmCells = [];
    for (let r = 0; r < 4; r++) { const tr = h('tr'); for (let c = 0; c < 4; c++) { const td = h('td', null, '0'); tr.append(td); this.lmCells.push({ td, r, c, v: 0 }); } tb.append(tr); }
    box.append(tb); $('#stage').append(box);
  },
  after() {
    if (this.mode !== 'porque' || !this.lmCells) return;
    const m = E.camera.matrixWorldInverse.elements; // column-major
    for (const cell of this.lmCells) { const v = m[cell.c * 4 + cell.r]; const s = v.toFixed(2).replace('.', ',').replace('-', '−'); if (cell.td.textContent !== s) { cell.td.textContent = s; cell.td.classList.add('hot'); cell.hotT = E.time; } else if (cell.hotT && E.time - cell.hotT > 0.4) { cell.td.classList.remove('hot'); cell.hotT = 0; } }
    if (this.camStart) { const d = E.camera.position.clone().sub(E.controls.target).normalize(); if (d.angleTo(this.camStart) > 0.45) { complete('p4c'); this.camStart = null; this.drawInfo(); } }
  },
  tick(dt, t) {
    if (this.mode === 'porque' && this.wcube) { this.wcube.rotation.y += dt * 0.4; this.wcube.rotation.x = Math.sin(t * 0.5) * 0.3; }
    if (this.mode === 'tempo' && this.stopObjs) { this.stopObjs.forEach((g, i) => { const o = g.userData.obj; if (o.userData.spin) o.userData.spin.rotation.y += dt * 0.8; if (o.userData.fans) o.userData.fans.forEach(f => f.rotation.y += dt * 12); }); this.tok.children[0].scale.y = 1 + Math.sin(t * 4) * 0.02; }
  },
  exit() { const lm = $('#liveMatrix'); if (lm) lm.remove(); },
  guide() {
    if (this.mode === 'tempo') { const nxt = this.stops.findIndex((st, i) => !this.visited.has(i)); if (nxt >= 0) return { target: this.stopObjs[nxt], tip: `Clique na parada ${this.stops[nxt].y} ou use “Próxima parada” nos botões lá embaixo. O Tok vai pulando até lá.` }; return { tip: 'Você viu a linha do tempo inteira! Agora experimente “Seja a matriz”.' }; }
    if (this.mode === 'votos') { const t = this.tests.find(x => !this.passes(x)); return t ? { target: this.cellM[t.a][0], tip: `Pergunta “${t.t}”: faça ${this.rows[t.a]} ter mais votos que os outros. Clique nos quadrados para mudar os pesos.` } : { tip: 'As três perguntas acertam! Você fez à mão o trabalho que o treinamento faz sozinho.' }; }
    return { tip: S.done.p4c ? 'Leia nos botões lá embaixo os 5 motivos que fazem as matrizes serem perfeitas para LLMs.' : 'Use as setas de girar, na lateral direita, e veja os números da matriz mudarem ao vivo, no canto.' };
  },
  panel(body) {
    this.segEl = seg([['tempo', 'Linha do tempo'], ['votos', 'Seja a matriz'], ['porque', 'Por que matrizes?']], this.mode, v => this.setMode(v));
    body.append(this.segEl); this.info = h('div', { class: 'sec' }); body.append(this.info); this.drawInfo();
  },
  drawInfo() {
    const b = this.info; if (!b) return; b.innerHTML = '';
    if (this.mode === 'tempo') {
      const st = this.stops[this.si];
      b.append(h('div', { class: 'box' },
        h('div', { class: 'row', style: 'justify-content:space-between;align-items:flex-end' }, h('div', { class: 'year' }, st.y), h('span', { class: 'mono small muted' }, `${this.si + 1}/${this.stops.length}`)),
        h('div', { class: 'small muted' }, st.who), h('h3', null, st.t), h('p', null, st.x),
        h('p', { class: 'quote small' }, h('b', null, 'E a LLM com isso? '), st.l)));
      b.append(h('div', { class: 'row' }, btn('← Anterior', '', () => this.goStop(this.si - 1), this.si === 0 ? { disabled: true } : null), btn('Próxima parada →', 'primary', () => this.goStop(this.si + 1), this.si === this.stops.length - 1 ? { disabled: true } : null),
        h('span', { class: 'small muted' }, `${this.visited.size} de ${this.stops.length} visitadas`)));
    } else if (this.mode === 'votos') {
      b.append(h('div', { class: 'box' }, h('p', null, 'A tabela na mesa é uma matriz de pesos. Cada linha é um candidato a resposta. Para cada pergunta, as lâmpadas acesas mostram a entrada. O voto de uma linha é a soma dos pesos das colunas acesas.'),
        h('p', { class: 'small' }, 'Clique nos quadrados para mudar os pesos (0 → +1 → +2 → −1). Faça o candidato certo ganhar sozinho nas três perguntas.')));
      b.append(h('div', { class: 'stack' }, this.tests.map((t, i) => { const ok = this.passes(t); return h('button', { class: 'card-opt' + (this.ti === i ? ' sel' : '') + (ok ? ' right' : ''), onclick: () => { this.ti = i; this.updateBoard(); } }, h('span', { class: 'mono' }, ok ? '✓' : '·'), h('span', null, h('b', null, t.t), ' → deve dar ', h('b', null, this.rows[t.a]))); })));
      b.append(h('p', { class: 'small muted' }, 'Isso é multiplicar uma matriz por um vetor. Uma LLM faz isso com milhares de linhas e colunas, em dezenas de camadas, e quem escolhe os pesos é o treinamento, não uma pessoa.'));
      b.append(btn('Zerar pesos', 'small', () => { this.Wv = this.Wv.map(r => r.map(() => 0)); this.updateBoard(); }));
    } else {
      b.append(h('div', { class: 'box call' }, h('b', null, 'Gire a cena com o mouse ou o dedo.'), h('p', { class: 'small' }, 'A tabela no canto é a matriz 4×4 que diz à placa de vídeo onde desenhar cada ponto da cena na sua tela. Os números que mudam ficam azuis.')));
      const R = [
        ['Uma conta, milhões de votos', 'Multiplicar uma matriz por um vetor calcula, de uma vez, a soma ponderada de todas as entradas para cada saída. É como uma votação gigante em que cada peso diz o quanto uma pista conta.'],
        ['Tudo vira número', 'Com palavras transformadas em vetores, dá para medir semelhança, somar sentidos e combinar informações com a mesma operação.'],
        ['Dá para ajustar aos pouquinhos', 'Mudar um peso um tiquinho muda a saída um tiquinho. Isso permite calcular em que direção girar cada “botão” para errar menos: é o que o treinamento faz.'],
        ['As placas de vídeo adoram', 'O mesmo hardware que gira os objetos deste jogo faz milhares de multiplicações ao mesmo tempo. Treinar e rodar LLMs aproveita isso.'],
        ['Empilhar é fácil', 'A saída de uma multiplicação vira a entrada da próxima. Empilhando camadas, o modelo consegue representar padrões cada vez mais abstratos.']];
      b.append(h('div', { class: 'stack' }, R.map(([t, x], i) => h('div', { class: 'box' }, h('b', null, `${i + 1}. ${t}`), h('p', { class: 'small' }, x)))));
    }
  }
});
