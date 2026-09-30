/* ============ Fase 12 · Formatura ============ */
const JOURNEY = [
  ['Texto', 'A pergunta chega como texto: “Qual é a capital do Brasil?”.', 1, 'chat'],
  ['Tokens', 'O tokenizador fatia o texto em pedaços e troca cada um por um número.', 4, 'scissors'],
  ['Significados', 'Cada número vira um vetor: um endereço numa galáxia onde sentidos parecidos ficam perto.', 7, 'vectors'],
  ['Atenção', 'Cada token olha para os anteriores e decide quais importam. “capital” e “Brasil” se destacam.', 8, 'spot'],
  ['Matrizes', 'Camada após camada, os vetores são multiplicados por matrizes de pesos aprendidos.', 5, 'matrix'],
  ['Chances', 'Sai um placar para cada token possível, e o softmax transforma tudo em probabilidades.', 3, 'wave'],
  ['Escolha', '“Brasília” vence com folga e entra no texto.', 3, 'chain'],
  ['Repete', 'Com o texto novo, tudo roda de novo, token por token, até a resposta acabar.', 11, 'chain'],
  ['Treino', 'Antes de tudo: bilhões de exemplos, erros e ajustes deixaram os pesos do jeito certo.', 6, 'perceptron'],
  ['RAG', 'Se precisar, trechos de uma biblioteca entram no contexto antes da resposta.', 10, 'book']];
const QUIZ = [
  ['O que uma LLM calcula a cada passo?', ['A chance de cada próximo token', 'Onde achar a frase pronta num banco', 'A tradução do texto para binário'], 'A resposta nasce token por token, sempre a partir de probabilidades.'],
  ['A máquina de Markov previa a próxima palavra olhando…', ['Só a palavra anterior', 'O texto inteiro de uma vez', 'Um dicionário de sinônimos'], 'Por isso ela errava “A capital do Brasil é ___”: esquecia o começo da frase.'],
  ['A ELIZA, de 1966, respondia…', ['Com palavras-chave e frases prontas', 'Aprendendo com milhões de conversas', 'Com um grande dicionário de sinônimos'], 'Era só um conjunto de regras. As LLMs aprendem com exemplos.'],
  ['Os números 1842, 91, 17… que substituem os tokens são:', ['Números de catálogo, sem significado', 'O significado de cada palavra', 'A chance de cada palavra vir depois'], 'IDs são só números de catálogo. O significado entra com os embeddings.'],
  ['Por que matrizes combinam tão bem com LLMs? Porque elas…', ['Fazem milhões de somas de uma vez', 'Guardam uma frase pronta em cada célula', 'Deixam o treinamento desnecessário'], 'Uma matriz faz milhões de somas com pesos de uma vez, dá para ajustá-la aos poucos, e as placas de vídeo são feitas para isso.'],
  ['O que acontece a cada passo de treinamento?', ['Mede o erro e ajusta os pesos um pouco', 'Uma pessoa corrige cada peso à mão', 'O modelo decora a frase inteira'], 'Erro medido, direção calculada, pesos ajustados um pouquinho.'],
  ['No universo dos embeddings, palavras de sentido parecido ficam…', ['Perto umas das outras', 'Em ordem alfabética', 'Na mesma célula da matriz'], 'Como Paris e Roma, na galáxia da fase 7.'],
  ['Para que serve a atenção?', ['Ver quais palavras da frase importam', 'Cortar o texto em pedaços', 'Guardar as respostas certas'], 'É o que faltava à máquina de Markov.'],
  ['Para a IA saber o horário da biblioteca da sua faculdade, sem retreinar, o melhor é…', ['Usar RAG com o regulamento', 'Aumentar bastante a temperatura', 'Um fine-tuning a cada mudança'], 'O RAG busca o trecho certo e o cola no contexto. Os pesos não mudam.'],
  ['O fine-tuning…', ['Muda os pesos do modelo', 'Só muda o texto do prompt', 'Apaga tudo o que ele sabia'], 'Muda os pesos e pode ter efeitos colaterais.']];
const QPH = [1, 3, 2, 4, 5, 6, 7, 8, 10, 9];
PHASES.push({
  kind: '2d', name: 'Formatura', title: 'O mapa completo e a prova final', era: 'o que você aprendeu', act: 'Ajustar, buscar e criar', badge: 'Formado em LLM',
  brief: { see: 'O caminho completo de uma resposta, do texto que você digita até “Brasília”, com cada peça que você conheceu no jogo.', goal: 'Relembrar cada estação e acertar pelo menos 7 das 10 perguntas da prova final para ganhar o troféu.', key: 'LLM', first: 'Aperte “Próxima estação” para relembrar a viagem de uma resposta.' },
  missions: [
    { id: 'v12a', text: 'Visite as 10 estações do caminho de uma resposta', short: 'mapa' },
    { id: 'v12b', text: 'Acerte pelo menos 7 das 10 perguntas da prova', short: 'prova final' }],
  build2d(root) {
    this.seen = new Set(); this.cur = -1; this.qi = 0; this.score = 0; this.answered = null; this.finished = false; this.order = QUIZ.map(() => shuffle([0, 1, 2])); this.wrongQ = [];
    this.inner = scene2d(this, root, [{ c: 'ipe', x: .5, y: .15, r: .55 }, { c: 'anil', x: .1, y: .8, r: .45 }, { c: 'urucum', x: .9, y: .85, r: .4 }, { c: 'mata', x: .95, y: .2, r: .3 }]);
    this.m3host = h('div', { class: 'm3 troph', role: 'img', 'aria-label': 'Troféu da formatura' }); this.capEl = h('div', { class: 'm3foot' }); this.m3host.append(this.capEl);
    this.render();
  },
  m3opts: { cam: [0, 1.45, 5.6], look: [0, 0.78, 0], fov: 30 },
  m3build(M) {
    const t = trophy3(); M.scene.add(t); this.tro = t; t.position.y = 0.05;
    const star = []; for (let k = 0; k < 10; k++) { const s = inked(new THREE.OctahedronGeometry(0.08), P3.ipe, { ink: 1.2 }); s.userData.a = k / 10 * Math.PI * 2; t.add(s); star.push(s); }
    t.userData.click = () => { if (S.done.v12b) { SND.play('win'); FX.burst(60, 0.5, 0.3, 0.8); this.spinK = 6; } else balloon('tro', { m3: M, obj: t, off: [0, 1.9, 0] }, '<p><b>Troféu trancado</b></p><p>Acerte 7 das 10 perguntas da prova final para ele ficar dourado.</p>', { ttl: 5000 }); }; M.picks.push(t);
    this.spinK = 0;
    M.ticks.push((dt, tt) => { const won = !!S.done.v12b; t.rotation.y += dt * (won ? 0.9 + this.spinK : 0.25); this.spinK *= Math.pow(0.2, dt);
      star.forEach((s, k) => { s.visible = won; const a = s.userData.a + tt * 0.8; s.position.set(Math.cos(a) * 1.05, 1.1 + Math.sin(tt * 2 + k) * 0.25, Math.sin(a) * 1.05); s.rotation.y = tt * 3; }); });
    this.troSync();
  },
  troSync() {
    const t = this.tro; const won = !!S.done.v12b; if (this.capEl) this.capEl.textContent = won ? 'Formado em LLM!' : 'Seu troféu: acerte 7 de 10 na prova';
    if (!t) return; t.traverse(o => { if (o.material && o.material.isMeshToonMaterial && o !== t.children[0]) { if (o.userData.c0 == null) o.userData.c0 = o.material.color.getHex(); const gold = o.userData.c0 === P3.ipe; if (gold) { o.material.color.setHex(won ? P3.ipe : P3.grey); o.material.transparent = !won; o.material.opacity = won ? 1 : 0.55; o.material.emissive.setHex(P3.ipe); o.material.emissiveIntensity = won ? 0.18 : 0; } } });
  },
  render() {
    const v = this.inner; v.innerHTML = ''; clearBalloons();
    if (!this.no3d) { v.append(this.m3host); this.troSync(); }
    if (S.done.v12b) {
      if (this.no3d) v.append(h('div', { class: 'trophy rise', html: ico('trophy', 'ipe') }), h('p', { class: 'ttl', style: 'text-align:center' }, 'Formado em LLM!'));
      v.append(h('p', { class: 'note' }, `Prova: ${this.score || 'mais de 7'} acertos. Agora você sabe explicar como uma IA chega a “Brasília”.`));
    }
    v.append(h('p', { class: 'note' }, 'O caminho de uma resposta'));
    this.st = JOURNEY.map(([n], i) => h('button', { class: 'jst' + (this.seen.has(i) ? ' seen' : '') + (this.cur === i ? ' cur' : ''), onclick: () => this.pick(i), 'aria-label': n }, h('span', { class: 'jd' }, String(i + 1)), h('small', null, n)));
    this.mapEl = h('div', { class: 'sheet pad jmap tl' }, this.st); v.append(this.mapEl);
    if (this.cur >= 0) { const [n, t, ph, ic] = JOURNEY[this.cur]; v.append(h('article', { class: 'sheet pad postcard rise tr' }, icoEl(ic, ['ipe', 'anil', 'mata', 'urucum', 'jaca'][this.cur % 5]), h('div', null, h('div', { class: 'pc-y', style: 'font-size:30px' }, `${this.cur + 1}. ${n}`), h('p', { class: 'pc-x' }, t), h('span', { class: 'pill2 y', style: 'margin-top:6px' }, 'fase ' + ph)))); }
  },
  pick(i) { this.cur = i; this.seen.add(i); SND.play('pop'); if (this.seen.size === JOURNEY.length) complete('v12a'); this.render(); HUD.refresh(); VOICE.say(`${JOURNEY[i][0]}. ${JOURNEY[i][1]}`); },
  openQuiz() {
    gameCard((card, close) => {
      const draw = () => {
        card.innerHTML = '';
        if (this.finished) { const pass = this.score >= 7; card.append(h('div', { class: 'gk' }, 'Resultado'), h('h2', null, `${this.score} de ${QUIZ.length}`), h('p', null, pass ? 'Troféu conquistado! Você sabe explicar como uma LLM chega a “Brasília”.' : 'Quase lá! Precisa de 7 acertos.'), (this.wrongQ || []).length ? h('p', { class: 'small' }, 'Para revisar: ' + [...new Set(this.wrongQ.map(i => QPH[i]))].sort((a, b) => a - b).map(n => `fase ${n} (${PHASES[n - 1].name})`).join(', ') + '.') : null, h('div', { class: 'row' }, btn(pass ? 'Ver o troféu' : 'Tentar de novo', 'primary', () => { if (pass) { close(); this.render(); HUD.refresh(); } else { this.retry(); draw(); } }), btn('Fechar', '', () => { close(); HUD.refresh(); }))); VOICE.say(pass ? 'Troféu conquistado!' : 'Quase lá! Tente de novo.'); return; }
        const q = QUIZ[this.qi], ord = this.order[this.qi];
        card.append(h('div', { class: 'gk' }, `Prova final · ${this.qi + 1} de ${QUIZ.length} · acertos ${this.score}`), h('h2', null, q[0]));
        ord.forEach((oi, k) => card.append(h('button', { class: 'gopt' + (this.answered != null ? (oi === 0 ? ' right' : k === this.answered ? ' wrong' : '') : ''), disabled: this.answered != null ? true : null, onclick: () => { this.answer(k); draw(); } }, q[1][oi])));
        if (this.answered != null) { card.append(h('p', null, h('b', null, this.lastRight ? 'Isso! ' : 'Não foi dessa vez. '), q[2])); card.append(h('div', { class: 'row' }, btn(this.qi < QUIZ.length - 1 ? 'Próxima pergunta' : 'Ver resultado', 'primary', () => { this.next(); draw(); }))); }
        else VOICE.say(q[0]);
      };
      draw();
    });
  },
  answer(k) { const ok = this.order[this.qi][k] === 0; this.answered = k; this.lastRight = ok; if (ok) { this.score++; SND.play('ok'); } else { SND.play('bad'); (this.wrongQ = this.wrongQ || []).push(this.qi); } },
  next() { this.answered = null; if (this.qi < QUIZ.length - 1) this.qi++; else { this.finished = true; if (this.score >= 7) { complete('v12b'); FX.burst(220, 0.5, 0.3, 1.3); SND.play('win'); } } },
  retry() { this.wrongQ = []; this.qi = 0; this.score = 0; this.answered = null; this.finished = false; this.order = QUIZ.map(() => shuffle([0, 1, 2])); },
  actions() {
    const nx = JOURNEY.findIndex((x, i) => !this.seen.has(i));
    return [[nx >= 0 ? abtn(`Próxima estação (${this.seen.size}/${JOURNEY.length}) ▶`, () => this.pick(nx), { primary: true, hot: true }) : null,
      abtn(this.finished ? 'Refazer a prova' : this.qi > 0 ? 'Continuar a prova' : 'Começar a prova final', () => { if (this.finished) this.retry(); this.openQuiz(); }, { primary: nx < 0, hot: nx < 0 && !S.done.v12b, disabled: nx >= 0 && !S.done.v12a }), abtn('Glossário', () => openGlossary())]];
  },
  hs() { return [['LLM', () => this.mapEl]]; },
  guide() {
    const nx = JOURNEY.findIndex((x, i) => !this.seen.has(i));
    if (nx >= 0) return { tip: 'Toque em cada estação (ou no botão azul) para relembrar a viagem de uma resposta.' };
    return { tip: S.done.v12b ? 'Parabéns! Você concluiu o LLM para leigos.' : 'Agora encare a prova final. São 10 perguntas, e você precisa de 7 acertos.' };
  }
});
