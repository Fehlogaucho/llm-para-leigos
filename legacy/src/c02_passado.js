/* ============ Fase 2 · Viagem ao passado: 9 cenas 3D animadas, cada uma contada em 4 passos ============ */
/* animações que também sabem pular direto para o fim (usado ao voltar um passo) */
/* as esperas usam o mesmo relógio das animações, para a ordem valer até em celular lento; com "menos movimento", cada passo já aparece pronto */
const TL = { on: true };
const tlOff = () => !TL.on || REDUCED;
function tlWait(ms, fn) { E.tweens.push({ t: 0, dur: Math.max(1, ms) / 1000, fn: () => { }, ease: ease.lin, res: fn }); }
function tlA(dur, fn, delay = 0) { if (tlOff()) { fn(1); return; } const run = () => anim(dur, fn, ease.io); if (delay) tlWait(delay, run); else run(); }
function tlDo(fn, delay = 0) { if (tlOff() || !delay) fn(); else tlWait(delay, fn); }
function tlMove(o, to, dur = 700, delay = 0) { const t = new THREE.Vector3(...to); let f = null; tlA(dur, k => { if (!f) f = o.position.clone(); o.position.lerpVectors(f, t, k); }, delay); }
function tlScale(o, s, dur = 450, delay = 0) { let f = null; tlA(dur, k => { if (f == null) f = o.scale.x; o.scale.setScalar(Math.max(0.0001, lerp(f, s, k))); o.visible = !(k >= 1 && s === 0); }, delay); }
function tlFade(o, a, dur = 450, delay = 0) { let ms = null, f = null; tlA(dur, k => { if (!ms) { ms = []; o.traverse(x => { if (x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach(m => { m.transparent = true; ms.push(m); }); }); f = ms.map(m => m.opacity); } ms.forEach((m, i) => { m.opacity = lerp(f[i], a, k); }); o.visible = !(k >= 1 && a <= 0.01); }, delay); }
function tlPop(o, delay = 0, dur = 380) { o.scale.setScalar(0.0001); o.visible = false; tlScale(o, 1, dur, delay); }
function spr(text, hgt, x, y, z, o = {}) { const s = m3Sprite(text, hgt, { size: 28, ...o }); s.position.set(x, y, z); return s; }
function sprIn(par, text, hgt, x, y, z, delay = 0, o = {}) { const s = spr(text, hgt, x, y, z, o); s.material.opacity = 0; s.visible = false; par.add(s); tlFade(s, 1, 450, delay); return s; }
function seg3(a, b, r, hex, o = {}) { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const d = B.clone().sub(A); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.max(0.001, d.length()), 8), toonMat(hex, o)); m.position.copy(A).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m; }
function arc3(a, b, hgt, r, hex, op = 0.85) { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const C = A.clone().add(B).multiplyScalar(0.5); C.y += hgt; return new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, C, B), 28, r, 8, false), new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: op, depthWrite: false })); }
function ring3(a, b, y, r, hex) { const pts = []; for (let i = 0; i < 64; i++) { const t = i / 64 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(t) * a, y, Math.sin(t) * b)); } return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 128, r, 6, true), toonMat(hex)); }
function rowBlocks(par, pieces, y, z, cols, o = {}) { const gap = 0.05, bs = pieces.map((t, i) => block3(t, cols[i % cols.length], { w: Math.max(0.34, 0.16 + [...t].length * 0.19), h: o.h || 0.42, d: 0.32, size: o.size || 30, brush: o.brush })); let x = -bs.reduce((a, b) => a + b.userData.w + gap, -gap) / 2; bs.forEach(b => { b.position.set(x + b.userData.w / 2, y, z); x += b.userData.w + gap; par.add(b); }); return bs; }
const VOW = /[AEIOUÁÉÍÓÚÃÕÂÊÔ]/i;

const STORY = [
  { y: 'há ~2.000 anos', s: '~2 mil anos', name: 'Números em colunas', who: 'China · Os Nove Capítulos da Arte Matemática', ic: 'rods', c: 'ipe', ph: 5,
    view: { w: 5.8, h: 3.9, dir: [0, 1.3, 1], look: [0, 0.35, 0.2] },
    beats: [
      { h: 'O problema', t: 'Um fiscal de colheita quer saber quanto rende cada tipo de feixe de arroz. Ele só conhece os totais: 3 feixes bons, 2 médios e 1 fraco dão 39 medidas. E há mais duas misturas assim.' },
      { h: 'A ideia: uma tabela de varetas', t: 'Os calculistas punham cada mistura numa coluna, com varetas de bambu. Cada linha é um tipo de feixe, e embaixo fica o total da mistura.' },
      { h: 'Combinar colunas', t: 'Somando e subtraindo colunas inteiras, os números vão sumindo até sobrar a resposta: um feixe bom rende 9¼ medidas, um médio 4¼ e um fraco 2¾.' },
      { h: 'E hoje?', t: 'Uma tabela em que a posição de cada número importa ganhou, em 1850, o nome de matriz. Uma LLM guarda tudo o que aprendeu em matrizes gigantes.' }],
    build(g) {
      const board = inked(rbox(4.6, 0.16, 3.1, 0.06), P3.wood); board.position.y = -0.08; g.add(board);
      const sheaf = hex => { const s = new THREE.Group(); for (let i = 0; i < 5; i++) { const st = inked(new THREE.CylinderGeometry(0.035, 0.03, 0.72, 6), hex, { ink: 1.3 }); st.position.set((i - 2) * 0.055, 0.36, (i % 2) * 0.05 - 0.02); st.rotation.z = (i - 2) * 0.09; s.add(st); } const tie = inked(new THREE.TorusGeometry(0.12, 0.03, 6, 14), P3.urucum); tie.rotation.x = Math.PI / 2; tie.position.y = 0.42; s.add(tie); return s; };
      const mix = new THREE.Group(); g.add(mix); const sheaves = [], labs = []; let x = -1.75;
      [[P3.ipe, 3, 'bom'], [P3.ipeL, 2, 'médio'], [P3.grey, 1, 'fraco']].forEach(([hex, n, name]) => { const x0 = x; for (let i = 0; i < n; i++) { const s = sheaf(hex); s.position.set(x, 0, 0.2); mix.add(s); sheaves.push(s); x += 0.42; } labs.push([name, (x0 + x - 0.42) / 2]); x += 0.35; });
      const tab = new THREE.Group(); tab.visible = false; g.add(tab);
      const cx = c => -0.85 + c * 1.15, rz = r => -0.85 + r * 0.8;
      const cells = [0, 1, 2].map(c => [0, 1, 2].map(r => { const grp = new THREE.Group(); grp.position.set(cx(c), 0.04, rz(r)); tab.add(grp); return grp; }));
      const fill = (grp, n, delay) => { clear3(grp); for (let i = 0; i < n; i++) { const rd = inked(new THREE.CylinderGeometry(0.028, 0.028, 0.62, 6), P3.urucum, { ink: 1.3 }); rd.rotation.z = Math.PI / 2; rd.position.z = (i - (n - 1) / 2) * 0.072; grp.add(rd); tlPop(rd, delay + i * 50, 260); } };
      const nums = new THREE.Group(); nums.visible = false; g.add(nums);
      return { steps: [
        () => { sheaves.forEach((s, i) => { const y = s.position.y; s.position.y = 2.4; tlMove(s, [s.position.x, y, s.position.z], 600, i * 110); }); labs.forEach(([n, lx], i) => sprIn(mix, n, 0.24, lx, 1.05, 0.2, 700 + i * 150)); sprIn(mix, '3 bons + 2 médios + 1 fraco = 39 medidas', 0.3, 0, 1.6, 0.2, 1200, { bg: '#F7D78A' }); },
        () => { tlFade(mix, 0, 400); tab.visible = true; ['bom', 'médio', 'fraco'].forEach((n, r) => sprIn(tab, n, 0.24, -2.0, 0.3, rz(r), 200 + r * 80)); [0, 1, 2].forEach(c => { sprIn(tab, 'mistura ' + (c + 1), 0.22, cx(c), 0.32, -1.45, 300 + c * 80); sprIn(tab, String([39, 34, 26][c]), 0.3, cx(c), 0.32, 1.4, 500 + c * 500, { bg: '#F7D78A' }); });
          [[3, 2, 1], [2, 3, 1], [1, 2, 3]].forEach((col, c) => col.forEach((n, r) => fill(cells[c][r], n, 400 + c * 500 + r * 150))); },
        () => { sprIn(tab, 'coluna 3 × 3 − coluna 1: o “bom” sumiu!', 0.26, 0.3, 0.35, 2.0, 0, { bg: '#F7D78A' }); tlDo(() => { fill(cells[2][0], 0, 0); fill(cells[2][1], 4, 0); fill(cells[2][2], 8, 0); }, 1000); sprIn(tab, 'bom = 9¼   médio = 4¼   fraco = 2¾', 0.32, 0, 1.75, -0.7, 2300, { bg: '#9ED3C0' }); },
        () => { tlFade(tab, 0, 450); nums.visible = true; [[3, 2, 1], [2, 3, 1], [1, 2, 3]].forEach((col, c) => col.forEach((n, r) => { const b = block3(String(n), P3.anilL, { w: 0.62, h: 0.52, d: 0.46, size: 36 }); b.position.set(cx(c), 0.3, rz(r)); b.rotation.x = -0.65; nums.add(b); tlPop(b, 350 + (c * 3 + r) * 70); })); sprIn(nums, 'isto é uma matriz', 0.36, 0, 1.45, -0.4, 1200, { bg: '#9DB4E8' }); }] };
    } },

  { y: '1801 a 1809', s: '1809', name: 'O menor erro', who: 'Carl Friedrich Gauss', ic: 'orbit', c: 'jaca', ph: 6,
    view: { w: 6.2, h: 3.4, dir: [0, 1.5, 1], look: [0.1, 0.35, 0.15] },
    beats: [
      { h: 'O problema', t: '1801: o asteroide Ceres foi visto por poucas semanas e sumiu no brilho do Sol. Os astrônomos tinham só algumas medições, todas um pouco erradas: os pontinhos vermelhos.' },
      { h: 'Testar caminhos', t: 'Gauss testou caminhos possíveis para o asteroide. Para cada um, mediu a distância até cada pontinho: é o erro. Caminho ruim, erro grande.' },
      { h: 'O caminho que erra menos', t: 'Ele ficou com o caminho de menor erro total (os mínimos quadrados). Meses depois, Ceres reapareceu exatamente onde Gauss previu!' },
      { h: 'E hoje?', t: 'Treinar uma LLM é a mesma ideia: ajustar os números, passo a passo, descendo a ladeira até o erro ficar mínimo.' }],
    build(g) {
      const sky = new THREE.Group(); g.add(sky);
      const sun = inked(new THREE.SphereGeometry(0.4, 24, 16), P3.ipe, { emissive: P3.ipe, ei: 0.6 }); sun.position.set(-0.8, 0.35, 0); sky.add(sun);
      const glare = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 16), new THREE.MeshBasicMaterial({ color: P3.ipeL, transparent: true, opacity: 0.3, depthWrite: false })); glare.position.copy(sun.position); sky.add(glare);
      const ell = (a, b, t) => [Math.cos(t) * a, 0.35, Math.sin(t) * b];
      const obs = [-0.25, -0.05, 0.15, 0.38, 0.6, 0.82].map((t, i) => { const n = [0.12, -0.1, 0.13, -0.12, 0.09, -0.08][i]; const p = ell(2.1 + n, 1.25 + n * 0.6, t); const d = inked(new THREE.SphereGeometry(0.065, 12, 8), P3.urucum, { ink: 1.2 }); d.position.set(...p); sky.add(d); return { t, p }; });
      const astro = inked(new THREE.DodecahedronGeometry(0.11), P3.grey); astro.visible = false; sky.add(astro);
      const orbit = (a, b, hex, label, lp, bg) => { const grp = new THREE.Group(); grp.add(ring3(a, b, 0.35, 0.02, hex)); obs.forEach(o => grp.add(seg3(o.p, ell(a, b, o.t), 0.014, P3.urucum))); grp.add(spr(label, 0.28, ...lp, { bg })); grp.visible = false; sky.add(grp); return grp; };
      const w1 = orbit(1.55, 0.9, P3.urucumL, 'erro total: 31', [-1.7, 1.25, 0.6], '#EFB3A0'), w2 = orbit(2.65, 1.6, P3.urucumL, 'erro total: 24', [1.9, 1.35, 0.9], '#EFB3A0'), best = orbit(2.1, 1.25, P3.mata, 'erro total: 2 (o menor!)', [0.2, 1.55, 1.1], '#9ED3C0');
      const val = new THREE.Group(); val.visible = false; val.scale.setScalar(1.25); val.position.y = 0.1; g.add(val); const vy = x => 0.28 * x * x + 0.05;
      const pts = []; for (let i = 0; i <= 40; i++) { const x = -1.9 + i * 0.095; pts.push(new THREE.Vector3(x, vy(x), 0)); }
      val.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.06, 8), toonMat(P3.wood)));
      const ball = inked(new THREE.SphereGeometry(0.14, 16, 12), P3.urucum); ball.position.set(-1.7, vy(-1.7) + 0.2, 0); val.add(ball);
      const moveAstro = (t0, t1, dur, delay, fadeOut) => { tlDo(() => { astro.visible = true; astro.traverse(x => { if (x.material) { x.material.transparent = true; x.material.opacity = 1; } }); }, delay); tlA(dur, k => { astro.position.set(...ell(2.1, 1.25, lerp(t0, t1, k))); astro.rotation.y = k * 6; }, delay); if (fadeOut) tlFade(astro, 0, 500, delay + dur - 400); };
      return { steps: [
        () => { moveAstro(-0.35, 2.3, 3000, 200, true); },
        () => { tlPop(w1, 0); tlPop(w2, 1300); },
        () => { tlFade(w1, 0, 400); tlFade(w2, 0, 400); tlPop(best, 500); sprIn(sky, 'previsão de Gauss', 0.24, -1.2, 0.85, -0.55, 1200, { bg: '#F7D78A' }); moveAstro(3.4, 4.2, 1600, 1600, false); },
        () => { tlFade(sky, 0, 500); val.visible = true; val.add(spr('erro alto', 0.26, -1.6, 1.35, 0)); val.add(spr('erro mínimo', 0.26, 0, -0.35, 0.2, { bg: '#9ED3C0' })); tlA(2600, k => { const x = -1.7 * Math.exp(-3 * k) * Math.cos(k * 11); ball.position.set(x, vy(x) + 0.19, 0); ball.rotation.z = -x * 3; }, 300); }] };
    } },

  { y: '1913', s: '1913', name: 'Contar o que vem depois', who: 'Andrei Markov', ic: 'chain', c: 'urucum', ph: 3,
    view: { w: 5.2, h: 3.1, dir: [0, 0.8, 1], look: [0, 0.75, 0] },
    beats: [
      { h: 'O problema', t: '1913: Markov quis saber se as letras de um poema aparecem por acaso ou seguem um padrão. Ele tinha 20 mil letras do poema Eugênio Oneguin, e muita paciência.' },
      { h: 'Contar, letra por letra', t: 'Ele olhava cada vogal (amarela) e anotava o que vinha logo depois: consoante (azul) ou outra vogal. Cada pedrinha vai para a torre certa.' },
      { h: 'Apareceu um padrão', t: 'No poema inteiro, depois de uma vogal vinha consoante 87 vezes em 100. A letra de antes ajuda a prever a próxima! Isso virou a cadeia de Markov.' },
      { h: 'E hoje?', t: 'Troque letras por palavras e use bilhões de textos: prever o que vem depois é o coração de toda LLM.' }],
    build(g) {
      const L = [...'OPOETAOLHAVA']; const letters = rowBlocks(g, L, 0.25, 0.8, L.map(c => VOW.test(c) ? P3.ipeL : P3.anilL), { brush: true });
      const towers = new THREE.Group(); g.add(towers); const tx = [-0.85, 0.85]; const tcol = [P3.anil, P3.ipe];
      const base = tx.map((x, k) => { const p = inked(rbox(0.7, 0.08, 0.7, 0.03), P3.paper); p.position.set(x, 0, -0.6); towers.add(p); towers.add(spr(k ? 'vogal → vogal' : 'vogal → consoante', 0.24, x, -0.28, -0.6)); return p; });
      const tok = tok3(); tok.scale.setScalar(0.2); tok.visible = false; g.add(tok);
      const pairs = []; for (let i = 0; i < L.length - 1; i++) if (VOW.test(L[i])) pairs.push([i, VOW.test(L[i + 1]) ? 1 : 0]);
      const stones = new THREE.Group(); g.add(stones); const cnt = [0, 0];
      const bars = new THREE.Group(); bars.visible = false; g.add(bars);
      const word = new THREE.Group(); word.visible = false; g.add(word);
      return { steps: [
        () => { letters.forEach((b, i) => { const y = b.position.y; b.position.y = 2.6; tlMove(b, [b.position.x, y, b.position.z], 500, i * 90); }); },
        () => { tok.visible = true; tok.position.set(letters[0].position.x, 0.62, 0.8); pairs.forEach(([i, k], n) => { const d = 250 + n * 750; tlMove(tok, [letters[i].position.x, 0.62, 0.8], 300, d); tlDo(() => { const st = inked(new THREE.BoxGeometry(0.28, 0.2, 0.28), tcol[k]); const h0 = cnt[k]++; st.position.set(letters[i + 1].position.x, 0.6, 0.8); stones.add(st); tlMove(st, [tx[k], 0.14 + h0 * 0.22, -0.6], 450); }, d + 320); }); },
        () => { tlFade(stones, 0, 350); tlFade(tok, 0, 300); bars.visible = true; [[2.1, '87%'], [0.32, '13%']].forEach(([hgt, t], k) => { const b = inked(new THREE.BoxGeometry(0.5, 1, 0.5), tcol[k]); b.position.set(tx[k], 0.04, -0.6); b.scale.set(1, 0.001, 1); bars.add(b); tlA(900, q => { b.scale.y = Math.max(0.001, hgt * q); b.position.y = 0.04 + hgt * q / 2; }, 300 + k * 200); sprIn(bars, t, 0.34, tx[k], hgt + 0.35, -0.6, 1100 + k * 200, { bg: k ? '#F7D78A' : '#9DB4E8' }); }); },
        () => { letters.forEach(b => tlFade(b, 0, 350)); tlFade(bars, 0, 350); tlFade(towers, 0, 350); word.visible = true; const ws = rowBlocks(word, ['A', 'capital', 'do', 'Brasil', 'é', '?'], 0.25, 0.8, [P3.paper, P3.paper, P3.paper, P3.paper, P3.anilL, P3.ipe], { size: 30 }); ws.forEach((b, i) => tlPop(b, 300 + i * 90)); const q = ws[5].position.x; sprIn(word, 'o que vem depois?', 0.26, q - 0.9, 1.9, 0.8, 900); sprIn(word, 'Brasília 96%', 0.3, q - 0.9, 1.5, 0.8, 1300, { bg: '#F7D78A' }); sprIn(word, 'uma 2%', 0.24, q - 0.9, 1.12, 0.8, 1500); }] };
    } },

  { y: '1943 e 1958', s: '1943', name: 'O neurônio que aprende', who: 'McCulloch e Pitts · Frank Rosenblatt', ic: 'perceptron', c: 'mata', ph: 6,
    view: { w: 6.0, h: 3.3, dir: [0, 0.75, 1], look: [0, 0.75, 0] },
    beats: [
      { h: 'O problema', t: 'Como ensinar uma máquina a reconhecer um gato? Escrever uma regra para cada caso não acaba nunca: toda regra tem exceção, e a pilha desaba.' },
      { h: 'O neurônio de mentira', t: '1943: McCulloch e Pitts imaginaram um “neurônio”: cada pista tem um peso (a grossura do fio). Ele soma os pesos das pistas acesas e, se passar de um limite, acende.' },
      { h: 'Aprender errando', t: '1958: o perceptron de Rosenblatt aprendia. Viu um cachorro, achou que era gato e errou. Então corrigiu os pesos: “late” passou a contar contra. Na próxima, acertou.' },
      { h: 'E hoje?', t: 'Juntando muitos neurônios em camadas, com bilhões de pesos ajustados assim, chegamos às LLMs.' }],
    build(g) {
      const stack = new THREE.Group(); g.add(stack); const cards = [];
      for (let i = 0; i < 7; i++) { const c = inked(rbox(1.5, 0.06, 0.95, 0.02), i % 2 ? P3.paper : 0xF3E7C8); c.position.set((i % 2 ? 0.06 : -0.05), 0.04 + i * 0.075, 0); c.rotation.y = (i % 3 - 1) * 0.08; stack.add(c); cards.push(c); }
      const neu = new THREE.Group(); neu.visible = false; g.add(neu);
      const ins = [['bigode', [-1.7, 1.45, 0]], ['orelha pontuda', [-1.7, 0.8, 0]], ['late', [-1.7, 0.15, 0]]].map(([n, p]) => { const s = inked(new THREE.SphereGeometry(0.17, 16, 12), P3.paper); s.position.set(...p); neu.add(s); neu.add(spr(n, 0.22, p[0] - 0.35, p[1] + 0.3, p[2])); return s; });
      const core = inked(new THREE.SphereGeometry(0.42, 24, 16), P3.paper, { emissive: P3.ipe, ei: 0 }); core.position.set(0.2, 0.75, 0); neu.add(core);
      const W = [0.9, 0.8, 0.6]; const rods = ins.map((s, i) => { const r = seg3(s.position.toArray(), core.position.toArray(), 0.02 + W[i] * 0.06, P3.anil); neu.add(r); return r; });
      const light = (on, i) => ins[i].material.color.setHex(on ? P3.ipe : P3.paper);
      const fire = (on, delay) => tlA(400, k => { core.material.emissiveIntensity = on ? k * 0.5 : (1 - k) * 0.5; if (k > 0.5) core.material.color.setHex(on ? P3.ipe : P3.paper); }, delay); const notes = [];
      const out = new THREE.Group(); neu.add(out); const say = (t, bg, delay) => tlDo(() => { clear3(out); out.add(spr(t, 0.32, 1.75, 0.95, 0, { bg })); }, delay);
      const net = new THREE.Group(); net.visible = false; g.add(net);
      return { steps: [
        () => { cards.forEach((c, i) => { const y = c.position.y; c.position.y = 2.8; tlMove(c, [c.position.x, y, 0], 450, i * 170); }); sprIn(stack, 'SE tem bigode → gato… MAS e o tigre? MAS e…', 0.24, 0, 1.25, 0, 1300, { bg: '#FBFAF5' }); tlA(900, k => { stack.rotation.z = k * 0.55; stack.position.x = k * 0.5; stack.position.y = -k * 0.15; }, 1900); },
        () => { tlFade(stack, 0, 400); tlPop(neu, 300); tlDo(() => { light(true, 0); light(true, 1); light(false, 2); }, 900); fire(true, 1300); notes.push(sprIn(neu, 'bigode 0,9 + orelha 0,8 = 1,7 > limite 1 → acende!', 0.24, 0, 2.15, 0, 1500, { bg: '#F7D78A' })); say('É gato! ✓', '#9ED3C0', 1900); },
        () => { fire(false, 0); tlDo(() => { light(true, 0); light(false, 1); light(true, 2); clear3(out); }, 200); notes.forEach(n => tlFade(n, 0, 250)); notes.push(sprIn(neu, 'agora, um cachorro (tem bigode e late)', 0.24, 0, 2.15, 0, 300, { bg: '#FBFAF5' })); fire(true, 900); say('É gato! ✗ errou', '#EFB3A0', 1100);
          tlDo(() => { neu.remove(rods[2]); clear3(rods[2]); rods[2] = seg3(ins[2].position.toArray(), core.position.toArray(), 0.035, P3.urucum); neu.add(rods[2]); }, 2300); notes.push(sprIn(neu, 'peso de “late”: +0,6 → −0,8', 0.24, -0.6, -0.2, 0.2, 2400, { bg: '#EFB3A0' })); fire(false, 3200); say('Não é gato ✓', '#9ED3C0', 3400); },
        () => { neu.children.filter(o => o.isSprite).forEach(o => tlFade(o, 0, 250)); tlFade(out, 0, 250); tlA(600, k => { neu.scale.setScalar(1 - k * 0.45); neu.position.x = -k * 1.2; }); net.visible = true; const L = [0.3, 1.1, 1.9].map((x, li) => [0, 1, 2, 3].map(j => { const s = inked(new THREE.SphereGeometry(0.1, 12, 8), [P3.anilL, P3.mataL, P3.ipeL][li]); s.position.set(x, 0.25 + j * 0.42, -0.2); net.add(s); tlPop(s, 500 + li * 250 + j * 60); return s; }));
          for (let a = 0; a < 2; a++) L[a].forEach(s => L[a + 1].forEach(t => { const l = seg3(s.position.toArray(), t.position.toArray(), 0.008, P3.grey); net.add(l); tlPop(l, 1300 + a * 200); })); sprIn(net, 'bilhões de pesos', 0.3, 1.1, 2.0, -0.2, 1700, { bg: '#F7D78A' }); }] };
    } },

  { y: '1966', s: '1966', name: 'ELIZA, o primeiro chatbot', who: 'Joseph Weizenbaum · MIT', ic: 'terminal', c: 'mata', ph: 2,
    view: { w: 4.2, h: 3.0, dir: [0, 0.3, 1], look: [0, 1.0, 0] },
    beats: [
      { h: 'O problema', t: '1966, no MIT: Weizenbaum queria que as pessoas conversassem com o computador digitando. Mas o computador não entendia palavra nenhuma.' },
      { h: 'O truque: palavras-chave', t: 'A ELIZA procurava palavras-chave. Achou “triste”? Tinha uma frase pronta para isso, como uma terapeuta que devolve perguntas.' },
      { h: 'Parecia mágica', t: 'Muita gente achou que ela entendia e se abriu com a máquina. Até a secretária de Weizenbaum pediu para conversar a sós com ela!' },
      { h: 'Mas não entendia nada', t: 'Sem palavra-chave, ela enrolava. A ELIZA não entendia nem aprendia: eram só regras. As LLMs fazem o contrário, aprendem com exemplos. Converse com ela na próxima etapa!' }],
    build(g) {
      const beige = 0xE9DFC4; const body = inked(rbox(2.7, 1.95, 1.3, 0.12), beige); body.position.set(0, 1.05, -0.2); g.add(body);
      const kb = inked(rbox(2.3, 0.12, 0.75, 0.04), beige); kb.position.set(0, 0.06, 0.85); g.add(kb);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) { const k = inked(new THREE.BoxGeometry(0.16, 0.06, 0.14), 0xD8CCAA, { ink: 1.15 }); k.position.set(-0.95 + c * 0.21, 0.15, 0.62 + r * 0.19); g.add(k); }
      const cv = document.createElement('canvas'); cv.width = 520; cv.height = 360; const ctx2 = cv.getContext('2d'); const tex = texFrom(cv);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 1.56), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.set(0, 1.08, 0.46); g.add(scr);
      const draw = (lines, hl) => { ctx2.fillStyle = '#12211A'; ctx2.fillRect(0, 0, 520, 360); ctx2.font = `600 27px ${FONT.mono}`; ctx2.textBaseline = 'top'; lines.forEach((t, i) => { const y = 22 + i * 44; if (hl && t.includes(hl)) { const x0 = 24 + ctx2.measureText(t.slice(0, t.indexOf(hl))).width; ctx2.fillStyle = '#EFAE22'; ctx2.fillRect(x0 - 3, y - 4, ctx2.measureText(hl).width + 6, 36); } ctx2.fillStyle = i === 0 ? '#6FBF86' : '#A8F0B4'; ctx2.fillText(t, 24, y); }); tex.needsUpdate = true; };
      const H = 'ELIZA · MIT · 1966'; draw([H]);
      const type = (base, txt, delay, hl) => tlA(txt.length * 70, k => draw([...base, txt.slice(0, Math.round(k * txt.length))], hl), delay);
      const fx = new THREE.Group(); g.add(fx);
      return { steps: [
        () => { type([H, ''], '> Estou triste', 500); },
        () => { draw([H, '', '> Estou triste'], 'triste'); sprIn(fx, 'REGRA: achou “triste”?', 0.26, 0, 2.55, 0.3, 500, { bg: '#F7D78A' }); sprIn(fx, 'responda “Por que você se sente assim?”', 0.24, 0, 2.2, 0.3, 900, { bg: '#F7D78A' }); },
        () => { draw([H, '', '> Estou triste'], 'triste'); type([H, '', '> Estou triste', ''], 'ELIZA: Por que você', 300); tlDo(() => draw([H, '', '> Estou triste', '', 'ELIZA: Por que você', '  se sente assim?']), 1900); [[-1.7, 0.6], [1.7, 0.9], [-1.5, 1.6], [1.6, 1.8]].forEach(([x, y], i) => { const s = sprIn(fx, '♥', 0.34, x, y, 0.4, 2100 + i * 250, { bg: '#EFB3A0' }); tlMove(s, [x, y + 0.5, 0.4], 1200, 2100 + i * 250); }); },
        () => { tlFade(fx, 0, 300); tlDo(() => draw([H]), 300); type([H, ''], '> Qual é a capital', 500); tlDo(() => draw([H, '', '> Qual é a capital', '  do Brasil?']), 1900); tlDo(() => draw([H, '', '> Qual é a capital', '  do Brasil?', 'ELIZA: Entendo.', '  Continue.']), 2600); const n = spr('não entende nada!', 0.34, 0, 2.35, 0.3, { bg: '#EFB3A0' }); n.material.opacity = 0; n.visible = false; g.add(n); tlFade(n, 1, 400, 3100); }] };
    } },

  { y: '1994 e 2016', s: '1994', name: 'Pedaços que se repetem', who: 'Philip Gage · pesquisadores de tradução', ic: 'scissors', c: 'jaca', ph: 4,
    view: { w: 4.0, h: 3.0, dir: [0, 0.65, 1], look: [0, 1.1, 0] },
    beats: [
      { h: 'O problema', t: 'Um programa precisa ler qualquer texto, até palavras que nunca viu, como “zapear”. Uma lista com todas as palavras do mundo não cabe, e letra por letra fica lento demais.' },
      { h: 'O par mais comum', t: '1994: Philip Gage teve uma ideia para compactar arquivos. Procurar o par de letras que mais se repete, como “c + a”, que aparece nas três palavras.' },
      { h: 'Juntar e repetir', t: 'Junta “c + a” num bloco só. Depois “ca + s”. E de novo, e de novo. Em 2016, pesquisadores de tradução usaram a mesma ideia para cortar palavras.' },
      { h: 'E hoje?', t: 'Os pedaços que se repetem viram tokens. Assim a LLM lê qualquer palavra, até uma nova, juntando pedaços que já conhece.' }],
    build(g) {
      const pile = new THREE.Group(); g.add(pile); const WS = ['casa', 'casinha', 'casarão', 'zapear', 'reunião', 'celular', 'cafezinho', 'amanhã', 'desbloquear', 'feliz'];
      const cols = [P3.anilL, P3.ipeL, P3.mataL, P3.urucumL, P3.jacaL];
      const rows = new THREE.Group(); g.add(rows); const words = ['casa', 'casinha', 'casarão'], ys = [1.75, 1.15, 0.55];
      const show = (split, hi, pop) => { clear3(rows); split.forEach((pcs, r) => { const bs = rowBlocks(rows, pcs, ys[r], 0, pcs.map((p, i) => hi && hi(p, i) ? P3.ipe : i === 0 && pcs.length < [...words[r]].length ? P3.ipe : cols[(i + r) % 5]), { brush: true }); if (pop) bs.forEach((b, i) => tlPop(b, i * 50, 300)); }); };
      const letters = words.map(w => [...w]);
      return { steps: [
        () => { WS.forEach((w, i) => { const b = block3(w, cols[i % 5], { h: 0.4, size: 28 }); const x = ((i * 37) % 9 - 4) * 0.45, lay = Math.floor(i / 4); b.position.set(x, 3, ((i * 13) % 5 - 2) * 0.25); b.rotation.y = ((i * 7) % 5 - 2) * 0.12; pile.add(b); tlMove(b, [x, 0.22 + lay * 0.42, b.position.z], 550, i * 140); }); sprIn(pile, 'palavras demais!', 0.32, 0, 2.2, 0.4, 1600, { bg: '#EFB3A0' }); },
        () => { tlFade(pile, 0, 400); tlDo(() => show(letters, null, true), 300); tlDo(() => show(letters, (p, i) => i < 2), 1300); sprIn(g, '“c + a” aparece 3 vezes', 0.28, 0, 2.45, 0, 1500, { bg: '#F7D78A' }); },
        () => { g.children.filter(o => o.isSprite).forEach(o => tlFade(o, 0, 250)); tlDo(() => show(letters.map(l => ['ca', ...l.slice(2)]), null, true), 300); tlDo(() => show(letters.map(l => ['cas', ...l.slice(3)]), null, true), 1800); },
        () => { tlDo(() => show([['cas', 'a'], ['cas', 'inha'], ['cas', 'arão']], null, true), 200); sprIn(g, 'pedaços que se repetem = tokens', 0.3, 0, -0.1, 0.3, 900, { bg: '#9DB4E8' }); }] };
    } },

  { y: '2013', s: '2013', name: 'Palavras viram vetores', who: 'Tomas Mikolov e equipe · Google', ic: 'vectors', c: 'ipe', ph: 7,
    view: { w: 5.4, h: 3.3, dir: [0.3, 0.55, 1], look: [0, 1.05, 0] },
    beats: [
      { h: 'O problema', t: 'Para o computador, “gato” e “felino” eram só dois códigos diferentes, sem relação nenhuma. Como ele saberia que as duas palavras querem dizer quase a mesma coisa?' },
      { h: 'Diga-me com quem andas', t: 'A ideia do word2vec: palavras que aparecem nos mesmos lugares das frases ganham números parecidos, e ficam perto no mapa.' },
      { h: 'Contas com sentidos', t: 'Dava até para fazer contas: o caminho de “homem” até “rei” é igual ao de “mulher” até “rainha”. Rei − homem + mulher ≈ rainha.' },
      { h: 'E hoje?', t: 'Toda LLM começa assim: cada token vira uma lista de números, um endereço no universo dos significados.' }],
    build(g) {
      const P0 = { gato: [-1.9, 1.9, 0.3], felino: [1.7, 0.4, -0.6], cachorro: [0.3, 2.3, -0.8], banana: [-1.0, 0.25, 0.8], 'maçã': [2.0, 2.0, 0.4], rei: [-0.4, 1.3, -1], rainha: [1.0, 1.0, 1], homem: [0.4, 0.3, 0.9], mulher: [1.2, 2.5, 0] };
      const col = { gato: P3.mata, felino: P3.mata, cachorro: P3.mata, banana: P3.ipe, 'maçã': P3.ipe, rei: P3.anil, rainha: P3.anil, homem: P3.urucum, mulher: P3.urucum };
      const N = {}; Object.entries(P0).forEach(([w, p]) => { const n = new THREE.Group(); n.add(inked(new THREE.SphereGeometry(0.11, 14, 10), col[w], { ink: 1.2 })); const s = spr(w, 0.26, 0, 0.28, 0); n.add(s); n.position.set(...p); n.visible = false; g.add(n); N[w] = n; });
      const top = new THREE.Group(); g.add(top); const say = (t, delay, bg) => tlDo(() => { clear3(top); top.add(spr(t, 0.3, 0, 3.0, 0, { bg })); }, delay);
      const ctx = { spin: false, steps: [
        () => { Object.values(N).forEach((n, i) => tlPop(n, 200 + i * 90)); say('para o computador: gato = 4127, felino = 9033', 1200, '#FBFAF5'); },
        () => { say('“O ___ dormiu no sofá.”', 200, '#F7D78A'); [['gato', [-1.7, 1.2, 0.2]], ['felino', [-1.25, 1.45, -0.1]], ['cachorro', [-1.95, 0.8, -0.2]]].forEach(([w, p], i) => tlMove(N[w], p, 900, 700 + i * 120)); say('“Comi uma ___ madura.”', 2200, '#F7D78A'); [['banana', [1.6, 0.4, 0.5]], ['maçã', [2.05, 0.7, 0.3]]].forEach(([w, p], i) => tlMove(N[w], p, 900, 2700 + i * 120)); },
        () => { say('rei − homem + mulher ≈ rainha', 200, '#9DB4E8'); [['homem', [-0.7, 0.9, 0.3]], ['rei', [-0.7, 2.1, 0.3]], ['mulher', [0.7, 0.9, 0.3]], ['rainha', [0.7, 2.1, 0.3]]].forEach(([w, p], i) => tlMove(N[w], p, 800, 400 + i * 100)); tlDo(() => { [['homem', 'rei'], ['mulher', 'rainha']].forEach(([a, b]) => { const A = N[a].position.toArray(), B = N[b].position.toArray(); const s = seg3([A[0], A[1] + 0.13, A[2]], [B[0], B[1] - 0.16, B[2]], 0.03, P3.ipe, { emissive: P3.ipe, ei: 0.3 }); g.add(s); tlPop(s, 0); const cone = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 12), toonMat(P3.ipe)); cone.position.set(B[0], B[1] - 0.18, B[2]); g.add(cone); tlPop(cone, 200); }); }, 1500); },
        () => { say('o universo dos significados', 100, '#F7D78A'); ctx.spin = true; }],
        tick(dt) { if (ctx.spin) g.rotation.y += dt * 0.35; } };
      return ctx;
    } },

  { y: '2017', s: '2017', name: 'Atenção', who: 'Vaswani e colegas · Google', ic: 'spot', c: 'ipe', ph: 8,
    view: { w: 7.4, h: 2.8, dir: [0, 0.5, 1], look: [0, 0.8, 0] },
    beats: [
      { h: 'Ler em fila', t: 'Antes de 2017, os modelos liam o texto em fila, uma palavra por vez. O que ficava para trás ia se apagando da memória.' },
      { h: '“Ele” quem?', t: 'Quando chegava em “ele”, o começo da frase já estava apagado. “Ele” é o gato? A memória não ajudava.' },
      { h: 'A atenção', t: 'O Transformer trouxe a atenção: cada palavra olha para todas as outras de uma vez e decide quais importam. “Ele” olha forte para “gato”.' },
      { h: 'Tudo ao mesmo tempo', t: 'E todas as palavras fazem isso juntas, em paralelo nas placas de vídeo. Toda LLM moderna é um Transformer.' }],
    build(g, M) {
      const W = ['O', 'gato', 'fugiu', 'porque', 'ele', 'tinha', 'medo']; const cl = W.map((w, i) => i % 2 ? P3.mataL : P3.anilL); const two = M && M.w && M.w / M.h < 1.7;
      const bs = two ? [...rowBlocks(g, W.slice(0, 4), 1.05, 0, cl.slice(0, 4), { size: 32, h: 0.46 }), ...rowBlocks(g, W.slice(4), 0.3, 0, cl.slice(4), { size: 32, h: 0.46 })] : rowBlocks(g, W, 0.3, 0, cl, { size: 30 });
      const Y = i => bs[i].position.y + 0.26;
      const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.32, 16), toonMat(P3.ipe, { emissive: P3.ipe, ei: 0.5 })); lamp.rotation.x = Math.PI; lamp.visible = false; g.add(lamp);
      const beam = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.75, 20, 1, true), new THREE.MeshBasicMaterial({ color: P3.ipeL, transparent: true, opacity: 0.35, depthWrite: false })); beam.position.y = -0.5; lamp.add(beam);
      const arcs = new THREE.Group(); g.add(arcs); const X = i => bs[i].position.x;
      return { steps: [
        () => { lamp.visible = true; lamp.position.set(X(0), Y(0) + 0.8, 0); W.forEach((w, i) => { tlMove(lamp, [X(i), Y(i) + 0.8, 0], 350, i * 520); if (i >= 2) tlFade(bs[i - 2], 0.2, 400, i * 520); }); },
        () => { tlMove(lamp, [X(4), Y(4) + 0.8, 0], 400); [0, 1, 2].forEach(i => tlFade(bs[i], 0.2, 200)); sprIn(g, '“ele” = quem?', 0.3, X(4) + (two ? 1.1 : 0), Y(4) + (two ? 0.1 : 1.4), 0.2, 600, { bg: '#EFB3A0' }); sprIn(g, 'já apagou…', 0.24, X(1), Y(1) + 0.55, 0.2, 1200, { bg: '#FBFAF5' }); },
        () => { g.children.filter(o => o.isSprite).forEach(s => tlFade(s, 0, 250)); tlFade(lamp, 0, 250); bs.forEach(b => tlFade(b, 1, 300, 150)); tlDo(() => setBlockColor(bs[1], P3.ipe), 600); [[0, 0.05], [1, 0.62], [2, 0.15], [3, 0.06]].forEach(([j, w], n) => { tlDo(() => { const a = arc3([X(4), Y(4), 0.05], [X(j), Y(j), 0.05], 0.45 + Math.abs(X(4) - X(j)) * 0.3, 0.012 + w * 0.09, P3.ipe); arcs.add(a); }, 600 + n * 200); sprIn(arcs, Math.round(w * 100) + '%', w > 0.3 ? 0.3 : 0.22, X(j), Y(j) + 0.3 + (w > 0.3 ? 0.3 : 0), 0.2, 800 + n * 200, { bg: w > 0.3 ? '#F7D78A' : '#FBFAF5' }); }); },
        () => { for (let n = 0; n < 12; n++) { const i = (n * 5 + 3) % 7, j = (n * 3 + 1) % 7; if (i === j) continue; tlDo(() => arcs.add(arc3([X(i), Y(i), 0.05], [X(j), Y(j), 0.05], 0.35 + Math.abs(X(i) - X(j)) * 0.25, 0.008, P3.anil, 0.5)), 200 + n * 90); } sprIn(g, 'todas as palavras, ao mesmo tempo', 0.3, 0, two ? 2.35 : 2.3, 0, 1400, { bg: '#9DB4E8' }); }], view: two ? { w: 4.8, h: 3.0, dir: [0, 0.45, 1], look: [0, 1.05, 0] } : null };
    } },

  { y: '2018 a 2022', s: '2022', name: 'Ajuste com pessoas', who: 'OpenAI · GPT e ChatGPT', ic: 'spark', c: 'urucum', ph: 9,
    view: { w: 5.2, h: 3.2, dir: [0, 0.45, 1], look: [0, 1.0, 0] },
    beats: [
      { h: 'Montanhas de texto', t: 'A partir de 2018, a OpenAI pegou o Transformer e o treinou com montanhas de texto: livros, sites, artigos.' },
      { h: 'Prever a próxima palavra', t: 'A tarefa era uma só: prever a próxima palavra, bilhões de vezes. O GPT-3, de 2020, tinha 175 bilhões de pesos.' },
      { h: 'Mas…', t: 'Ele só sabia continuar textos. Pedia-se uma receita e às vezes ele inventava, ou só seguia escrevendo algo parecido com o pedido.' },
      { h: 'Ajuste com pessoas', t: 'Então pessoas deram notas às respostas, e o modelo foi ajustado com essas notas. Em 2022, nasceu o ChatGPT.' }],
    build(g) {
      const tk = tok3(); tk.scale.setScalar(0.8); tk.position.set(1.3, 0, 0); g.add(tk);
      const books = []; const bc = [P3.anil, P3.urucum, P3.mata, P3.ipe, P3.jaca, P3.anilL];
      for (let i = 0; i < 12; i++) { const b = inked(rbox(0.7, 0.15, 0.48, 0.03), bc[i % 6]); b.position.set(-1.4 + ((i * 7) % 3 - 1) * 0.05, 0.08 + i * 0.16, 0); b.rotation.y = ((i * 5) % 5 - 2) * 0.1; b.visible = false; g.add(b); books.push(b); }
      const fx = new THREE.Group(); g.add(fx); const ctx = { bob: 0, steps: [
        () => { books.forEach((b, i) => { const y = b.position.y; b.visible = true; b.position.y = 3.2; tlMove(b, [b.position.x, y, 0], 450, i * 120); }); sprIn(fx, 'livros, sites, artigos…', 0.28, -1.4, 2.55, 0, 1500, { bg: '#FBFAF5' }); },
        () => { tlFade(fx, 0, 250); books.slice().reverse().forEach((b, i) => { tlMove(b, [1.3, 0.9, 0.2], 380, 200 + i * 130); tlScale(b, 0, 380, 200 + i * 130); tlDo(() => { ctx.bob = 1; }, 560 + i * 130); }); const s = spr('A capital do Brasil é ___ → Brasília', 0.28, 0.4, 2.35, 0, { bg: '#F7D78A' }); s.material.opacity = 0; s.visible = false; g.add(s); ctx.s1 = s; tlFade(s, 1, 400, 1900); },
        () => { if (ctx.s1) tlFade(ctx.s1, 0, 250); fx.visible = true; sprIn(fx, 'Você: Me dá uma receita de bolo.', 0.26, -0.9, 2.3, 0.2, 300, { bg: '#FBFAF5' }); sprIn(fx, 'GPT: Me dá uma receita de pão. Me dá uma…', 0.26, -0.4, 1.75, 0.2, 1200, { bg: '#EFB3A0' }); },
        () => { tlFade(fx, 0, 300); [['✓ boa resposta', '#9ED3C0'], ['✗ inventou', '#EFB3A0'], ['✓ boa resposta', '#9ED3C0'], ['✓ ajudou', '#9ED3C0'], ['✗ fugiu da pergunta', '#EFB3A0']].forEach(([t, bg], i) => { const s = spr(t, 0.26, -2.0, 0.6 + (i % 3) * 0.6, 0.3, { bg }); s.material.opacity = 0; s.visible = false; g.add(s); tlFade(s, 1, 250, 300 + i * 420); tlMove(s, [1.1, 1.0, 0.3], 700, 500 + i * 420); tlFade(s, 0, 250, 1000 + i * 420); tlDo(() => { ctx.bob = 1; }, 1150 + i * 420); }); sprIn(g, 'ChatGPT · 2022', 0.36, 1.3, 2.3, 0, 2600, { bg: '#F7D78A' }); }],
        tick(dt, t) { ctx.bob = Math.max(0, ctx.bob - dt * 3); tk.position.y = Math.sin(ctx.bob * Math.PI) * 0.18; tk.rotation.y = -0.35 + Math.sin(t * 1.2) * 0.12; } };
      return ctx;
    } }
];
const ELIZA_RULES = [
  [/\b(triste|chatead[oa]|deprimid[oa]|sozinh[oa]|cansad[oa])\b/i, ['Por que você acha que se sente assim?', 'Há quanto tempo você se sente assim?'], 'palavra de sentimento'],
  [/\b(m[ãa]e|pai|fam[íi]lia|irm[ãa]o?)\b/i, ['Fale mais sobre a sua família.', 'Como é a sua relação com a sua família?'], 'palavra de família'],
  [/\bcomputador(es)?\b/i, ['Computadores preocupam você?', 'Por que você mencionou computadores?'], 'a palavra “computador”'],
  [/\bvoc[êe] [ée] (.+?)[?.!]*$/i, ['Por que você quer saber se eu sou $1?'], 'o molde “você é …”'],
  [/\beu (sou|estou) (.+?)[?.!]*$/i, ['Há quanto tempo você está $2?', 'Por que você diz que está $2?'], 'o molde “eu estou …”'],
  [/\beu gosto de (.+?)[?.!]*$/i, ['O que você mais gosta em $1?'], 'o molde “eu gosto de …”'],
  [/\bn[ãa]o\b/i, ['Por que não?', 'Você está dizendo não só para me contrariar?'], 'a palavra “não”']
];
const ELIZA_DEFAULT = ['Entendo. Continue.', 'Isso é interessante. Fale mais.', 'Como isso faz você se sentir?'];
const ELIZA_PRESETS = ['Estou triste hoje', 'Minha mãe não me entende', 'Eu gosto de futebol', 'Você é inteligente?', 'Computadores me assustam'];
function elizaReply(msg, n) {
  const refl = s => s.replace(/\bmeu\b/gi, 'seu').replace(/\bminha\b/gi, 'sua').replace(/\beu\b/gi, 'você');
  for (const [re, outs, name] of ELIZA_RULES) { const m = msg.match(re); if (m) { const o = outs[n % outs.length].replace(/\$(\d)/g, (_, k) => refl(m[+k] || '')); return { text: o, rule: name, hit: m[0] }; } }
  return { text: ELIZA_DEFAULT[n % ELIZA_DEFAULT.length], rule: 'nenhuma palavra-chave: frase de enrolação', hit: null };
}
const ORDER = [
  [['Markov conta letras', 'chain', 1913], ['Nasce o Transformer', 'spot', 2017]],
  [['Palavras viram vetores', 'vectors', 2013], ['O neurônio que aprende', 'perceptron', 1958]],
  [['Pedaços de palavras', 'scissors', 1994], ['Gauss e o menor erro', 'orbit', 1809]],
  [['ELIZA, o primeiro chatbot', 'terminal', 1966], ['Nasce o ChatGPT', 'spark', 2022]]
];
PHASES.push({
  kind: '2d', name: 'Viagem ao passado', title: 'De onde veio tudo isso', era: 'de 2.000 anos atrás até 2022', act: 'O começo', badge: 'Viajante do tempo',
  brief: { see: 'As LLMs não surgiram do nada. Cada peça nasceu quando alguém enfrentou um problema difícil. Em 9 paradas, uma cena animada mostra o problema da época e a ideia que resolveu.', goal: 'Viajar pelas 9 paradas da linha do tempo, conversar com um chatbot de 1966 e colocar as grandes ideias em ordem.', key: 'Chatbot', first: 'Veja a cena e aperte “Continuar” para seguir a história.' },
  missions: [
    { id: 'v2a', text: `Viaje pelas ${STORY.length} paradas da linha do tempo`, short: 'linha do tempo' },
    { id: 'v2b', text: 'Converse 3 vezes com a ELIZA e descubra o truque', short: 'ELIZA' },
    { id: 'v2c', text: 'Jogue as 4 rodadas de “Quem veio primeiro?”', short: 'ordem' }],
  steps: [{ k: 'viagem', l: 'Linha do tempo', m: ['v2a'] }, { k: 'eliza', l: 'ELIZA, 1966', m: ['v2b'] }, { k: 'ordem', l: 'Quem veio primeiro?', m: ['v2c'] }],
  stepKey() { return this.step; }, goStep(k) { this.showStep(k); },
  challenge: { q: 'O que a ELIZA, de 1966, fazia para responder?', o: ['Procurava palavras-chave e devolvia frases prontas', 'Aprendia com bilhões de textos', 'Pesquisava na internet'], a: 0, why: 'Era só um conjunto de regras. As LLMs, ao contrário, aprendem padrões com exemplos.' },
  build2d(root) {
    this.step = 'viagem'; this.si = 0; this.bi = 0; this.ended = new Set(); this.log = []; this.revealed = false; this.ri = 0; this.pick = null; this.score = 0; this.played = 0;
    this.inner = scene2d(this, root, [{ c: 'ipe', x: .2, y: .25, r: .55 }, { c: 'jaca', x: .85, y: .15, r: .4 }, { c: 'mata', x: .75, y: .9, r: .45 }]);
    this.m3host = h('div', { class: 'm3 story', role: 'img', 'aria-label': 'Cena animada da parada atual da linha do tempo' });
    this.render();
  },
  showStep(k) { this.step = k; this.render(); HUD.refresh(); },
  m3opts: { cam: [0, 2, 7], look: [0, 0.6, 0], fov: 32, fit(M) { const P = E.phase; if (P && P.M3 === M && P.fitStory) P.fitStory(); } },
  m3build(M) {
    this.stageG = new THREE.Group(); M.scene.add(this.stageG);
    M.ticks.push((dt, t) => { if (this.ctx && this.ctx.tick) this.ctx.tick(dt, t); });
    this.loadStop(this.si, this.bi);
  },
  fitStory() {
    const M = this.M3, v = this.view; if (!M || !M.w || !v) return;
    const vf = M.cam.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * M.cam.aspect); const dist = Math.max((v.w / 2) / Math.tan(hf / 2), (v.h / 2) / Math.tan(vf / 2)) * 1.07;
    const L = new THREE.Vector3(...v.look); M.cam.position.copy(L).addScaledVector(new THREE.Vector3(...v.dir).normalize(), dist); M.cam.lookAt(L); M.cam.updateProjectionMatrix();
  },
  loadStop(i, b = 0) {
    this.si = i; this.bi = b; const M = this.M3; if (!M || !this.stageG) return;
    clear3(this.stageG); this.stageG.rotation.set(0, 0, 0); const D = STORY[i]; this.view = D.view; this.fitStory();
    this.ctx = D.build(this.stageG, M); if (this.ctx.view) { this.view = this.ctx.view; this.fitStory(); }
    TL.on = false; try { for (let k = 0; k < b; k++) this.ctx.steps[k](); } finally { TL.on = true; }
    this.ctx.steps[b]();
  },
  next() {
    const D = STORY[this.si];
    if (this.bi < D.beats.length - 1) { this.loadStop(this.si, this.bi + 1); this.afterBeat(); }
    else if (this.si < STORY.length - 1) this.goStop(this.si + 1);
  },
  prev() {
    if (this.bi > 0) this.loadStop(this.si, this.bi - 1);
    else if (this.si > 0) this.loadStop(this.si - 1, STORY[this.si - 1].beats.length - 1);
    this.afterBeat();
  },
  goStop(i) { this.loadStop(i, 0); SND.play('whoosh'); this.afterBeat(); },
  afterBeat() {
    const D = STORY[this.si], B = D.beats[this.bi];
    if (this.bi === D.beats.length - 1) { this.ended.add(this.si); if (this.ended.size === STORY.length && !S.done.v2a) { complete('v2a'); setTimeout(() => { if (E.phase === this) TG.say('Você atravessou 2.000 anos de ideias! Agora converse com a ELIZA, o primeiro chatbot.'); }, 1800); } }
    SND.play('pop'); this.render(); HUD.refresh(); VOICE.say(`${B.h}. ${B.t}`);
  },
  render() {
    const v = this.inner; v.innerHTML = ''; clearBalloons(); v.classList.toggle('fill', this.step === 'viagem');
    if (this.step === 'viagem') {
      const D = STORY[this.si], B = D.beats[this.bi], last = this.bi === D.beats.length - 1;
      const bar = h('div', { class: 'tlbar', role: 'list', 'aria-label': 'Paradas da linha do tempo' }, STORY.map((x, j) => h('button', { class: 'tlb' + (j === this.si ? ' cur' : '') + (this.ended.has(j) ? ' seen' : ''), 'aria-label': `${x.y}: ${x.name}`, 'aria-current': j === this.si ? 'step' : null, onclick: () => { if (j !== this.si) this.goStop(j); } }, h('span', { class: 'dd' }), h('small', null, x.s))));
      v.append(bar);
      const wrap = h('div', { class: 'st-wrap' }); if (!this.no3d) wrap.append(this.m3host);
      this.card = h('article', { class: 'sheet pad story tl', 'aria-live': 'polite' }, this.no3d ? icoEl(D.ic, D.c) : null,
        h('div', { class: 'st-top' }, h('span', { class: 'pc-y' }, D.y), h('span', { class: 'pc-who' }, D.who)),
        h('h3', { class: 'st-h' }, B.h), h('p', { class: 'st-t' }, B.t),
        h('div', { class: 'st-foot' }, h('div', { class: 'st-dots', 'aria-label': `Passo ${this.bi + 1} de ${D.beats.length}` }, D.beats.map((x, k) => h('i', { class: k === this.bi ? 'on' : k < this.bi ? 'past' : '' }))), last && D.ph !== 2 ? h('span', { class: 'pill2 y' }, 'você vê isso na fase ' + D.ph) : null),
        h('span', { class: 'stamp' }, `${this.si + 1}/${STORY.length}`));
      wrap.append(this.card); v.append(wrap);
      requestAnimationFrame(() => { const c = bar.querySelector('.cur'); if (c) bar.scrollTo({ left: Math.max(0, c.offsetLeft - bar.clientWidth / 2 + c.offsetWidth / 2), behavior: REDUCED ? 'auto' : 'smooth' }); });
    }
    if (this.step === 'eliza') {
      v.append(h('p', { class: 'note' }, 'Estamos em 1966. Este é o computador da ELIZA.'));
      const term = h('div', { class: 'eliza', 'aria-live': 'polite' }, h('div', { class: 'el-h' }, 'ELIZA · MIT · 1966'), h('div', null, 'ELIZA: Olá. Como você está se sentindo hoje?'));
      this.log.forEach(L => {
        const you = h('div', { class: 'you' }); if (this.revealed && L.hit) { const i = L.msg.toLowerCase().indexOf(L.hit.toLowerCase()); you.append(L.msg.slice(0, i), h('mark', null, L.msg.slice(i, i + L.hit.length)), L.msg.slice(i + L.hit.length)); } else you.textContent = L.msg;
        term.append(you, h('div', null, 'ELIZA: ' + L.text, this.revealed ? h('div', { class: 'rule' }, 'regra: ' + L.rule) : null));
      });
      v.append(term); this.term = term; requestAnimationFrame(() => { term.scrollTop = term.scrollHeight; });
      if (this.revealed) v.append(h('div', { class: 'sheet pad tr rise' }, h('p', { class: 'lbl', style: 'margin:0 0 4px' }, 'Descobriu o truque?'), h('p', { style: 'margin:0' }, 'A ELIZA só procurava palavras-chave (as marcadas em amarelo) e encaixava numa frase pronta. Ela não entendia nem aprendia nada. As LLMs de hoje fazem o contrário: aprendem padrões com bilhões de exemplos.')));
    }
    if (this.step === 'ordem') {
      const [a, b] = ORDER[this.ri]; const pair = this.ri % 2 ? [b, a] : [a, b]; const ans = pair[0][2] < pair[1][2] ? 0 : 1;
      v.append(h('p', { class: 'note' }, `Rodada ${this.ri + 1} de ${ORDER.length}: quem veio primeiro?`));
      this.vcards = pair.map((it, i) => h('button', { class: 'vcard' + (this.pick != null ? (i === ans ? ' right' : i === this.pick ? ' wrong' : '') : ''), disabled: this.pick != null ? true : null, onclick: () => this.choose(i, ans) }, icoEl(it[1], i ? 'mata' : 'ipe'), h('span', null, it[0]), h('span', { class: 'vy' }, this.pick != null ? String(it[2]) : 'ano?')));
      v.append(h('div', { class: 'vs' }, this.vcards[0], h('span', { class: 'vsm' }, 'ou'), this.vcards[1]));
      if (this.pick != null) v.append(h('p', { class: 'note rise' }, (this.pick === ans ? 'Acertou!' : 'Não foi dessa vez.') + (this.ri === ORDER.length - 1 ? ` Placar final: ${this.score} de ${ORDER.length}.` : '')));
    }
  },
  talk(msg) {
    const r = elizaReply(msg, this.log.length); this.log.push({ msg, ...r }); SND.play('tick');
    if (this.log.length >= 3 && !this.revealed) { this.revealed = true; complete('v2b'); TG.say('Percebeu? A ELIZA só procura palavras-chave e devolve frases prontas. Não entende nada!'); }
    this.render(); HUD.refresh();
  },
  choose(i, ans) {
    this.pick = i; this.played++; if (i === ans) { this.score++; SND.play('ok'); } else SND.play('bad');
    if (this.ri === ORDER.length - 1) complete('v2c');
    this.render(); HUD.refresh();
  },
  nextRound() { this.ri++; this.pick = null; this.render(); HUD.refresh(); },
  actions() {
    const rows = [];
    if (this.step === 'viagem') {
      const D = STORY[this.si], last = this.bi === D.beats.length - 1, lastStop = this.si === STORY.length - 1; const missing = STORY.findIndex((x, j) => !this.ended.has(j));
      rows.push([abtn('◀', () => this.prev(), { disabled: this.si === 0 && this.bi === 0 }),
        !(last && lastStop) ? abtn(last ? 'Próxima parada ▶' : 'Continuar ▶', () => this.next(), { primary: true, hot: true }) : missing >= 0 ? abtn('Ver as paradas que faltam ▶', () => this.goStop(missing), { primary: true, hot: true }) : null]);
    }
    if (this.step === 'eliza') {
      const used = new Set(this.log.map(l => l.msg));
      rows.push({ wrap: true, label: 'Diga à ELIZA', items: ELIZA_PRESETS.map((t, i) => ({ ...chip(t, false, () => this.talk(t)), hot: !this.revealed && !used.has(t) && ELIZA_PRESETS.findIndex(x => !used.has(x)) === i })).concat([chip('✎ Escrever', false, () => askText('Diga algo para a ELIZA', '', v => this.talk(v), { kicker: 'ELIZA · 1966', okLabel: 'Enviar' }))]) });
    }
    if (this.step === 'ordem' && this.pick != null && this.ri < ORDER.length - 1) rows.push([abtn('Próxima rodada ▶', () => this.nextRound(), { primary: true, hot: true })]);
    return rows;
  },
  hs() { return this.step === 'eliza' ? [['Chatbot', () => this.term]] : []; },
  guide() {
    if (this.step === 'viagem') { const D = STORY[this.si]; return { tip: S.done.v2a ? 'Você atravessou 2.000 anos! Agora converse com a ELIZA, o primeiro chatbot.' : this.bi === 0 ? `${D.y}: veja o problema da época e aperte “Continuar”.` : this.bi === D.beats.length - 1 ? 'Essa ideia chegou até as LLMs de hoje. Siga para a próxima parada.' : 'Acompanhe a cena e aperte “Continuar”.' }; }
    if (this.step === 'eliza') return { tip: this.revealed ? 'É só um truque de regras. As LLMs aprendem de verdade, como você vai ver.' : 'Escolha uma frase para dizer à ELIZA. Preste atenção nas respostas.' };
    if (this.pick == null && this.ri < ORDER.length) return { tip: 'Qual das duas ideias surgiu primeiro? Toque no cartão.' };
    return { tip: this.ri >= ORDER.length ? 'Agora vamos seguir essa evolução, começando por Markov e Shannon: prever a próxima palavra.' : 'Veja os anos e siga para a próxima rodada.' };
  }
});
