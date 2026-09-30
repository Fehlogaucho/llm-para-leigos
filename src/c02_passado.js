/* ============ Fase 2 · Viagem ao passado ============ */
const STOPS = [
  { y: 'há ~2.000 anos', s: '~2 mil anos', who: 'China · Os Nove Capítulos da Arte Matemática', front: 'Um enigma de arroz', back: 'Números em colunas',
    prob: 'Um fiscal de colheita tem um enigma: 3 feixes de arroz bom, 2 de médio e 1 de fraco rendem 39 medidas. Com outras misturas, dão 34 e 26. Quanto rende cada tipo de feixe? Não existe calculadora, só varetas de bambu.',
    q: 'Como organizar tantos números?', opts: ['Pôr os números numa tabela e combinar as colunas', 'Chutar valores e ir corrigindo no olho', 'Contar os grãos de cada feixe, um a um'],
    sol: 'Os calculistas arrumavam os números em colunas num tabuleiro, com varetas, e somavam ou subtraíam colunas inteiras até sobrar a resposta. Séculos depois, em 1850, essa tabela ganhou o nome de matriz.',
    hint: 'Pense em como deixar os números organizados para comparar as misturas.', hoje: 'Uma LLM guarda tudo o que aprendeu em matrizes gigantes.', ph: 5, ic: 'rods', c: 'ipe' },
  { y: '1801 a 1809', s: '1809', who: 'Carl Friedrich Gauss', front: 'Um asteroide sumiu', back: 'O menor erro',
    prob: 'Em 1801, o asteroide Ceres foi visto por poucas semanas e sumiu no brilho do Sol. As poucas medições estavam todas um pouco erradas. Onde apontar o telescópio para reencontrá-lo?',
    q: 'Como achar o caminho certo com medidas imperfeitas?', opts: ['Testar caminhos e ficar com o que erra menos', 'Confiar só na medição que parecer melhor', 'Esperar o asteroide reaparecer por acaso'],
    sol: 'Gauss testou órbitas e escolheu a que deixava o erro total o menor possível. Ceres reapareceu onde ele previu. Em 1809 ele publicou o método: os mínimos quadrados.',
    hint: 'Todas as medições tinham um pouco de erro. Qual caminho erraria menos no total?', hoje: 'Treinar uma LLM é isso: ajustar os números até o erro ficar mínimo.', ph: 6, ic: 'orbit', c: 'jaca' },
  { y: '1913', s: '1913', who: 'Andrei Markov', front: 'Letras ao acaso?', back: 'Contar o que vem depois',
    prob: 'Markov queria saber se as letras de um poema aparecem ao acaso ou seguem um padrão. Ele tinha 20 mil letras do poema Eugênio Oneguin e muita paciência.',
    q: 'Como descobrir se uma letra ajuda a prever a próxima?', opts: ['Contar qual letra costuma vir depois de cada uma', 'Perguntar ao poeta como escolhia as letras', 'Ler o poema inteiro de trás para a frente'],
    sol: 'Ele contou à mão: depois de uma vogal, quase sempre vinha uma consoante, e vice-versa. Ou seja, a letra anterior ajuda a prever a próxima. A ideia ficou conhecida como cadeia de Markov.',
    hint: 'Ele tinha 20 mil letras e muita paciência. O que dá para fazer só contando?', hoje: 'Prever o que vem depois é o coração de toda LLM.', ph: 3, ic: 'chain', c: 'urucum' },
  { y: '1943 e 1958', s: '1943', who: 'McCulloch e Pitts · Frank Rosenblatt', front: 'Regras não bastam', back: 'O neurônio que aprende',
    prob: 'Escrever regras para tudo é impossível. Como explicar a uma máquina o que é a letra A escrita à mão, de mil jeitos diferentes? E se ela aprendesse sozinha, com exemplos, como o cérebro?',
    q: 'Como uma máquina poderia aprender com exemplos?', opts: ['Dar importância a cada pista e corrigir essa importância a cada erro', 'Guardar uma lista com todas as respostas possíveis', 'Fazer a máquina ler livros em voz alta, sem parar'],
    sol: 'Em 1943, McCulloch e Pitts desenharam um “neurônio” de mentira: uma continha que soma as pistas, cada uma com uma importância (o peso), e “dispara” se passar de um limite. Em 1958, o perceptron de Rosenblatt corrigia esses pesos a cada erro. A máquina aprendia com exemplos!',
    hint: 'Como a gente aprende: tentando, errando e corrigindo.', hoje: 'Uma LLM tem bilhões desses pesos.', ph: 6, ic: 'perceptron', c: 'mata' },
  { y: '1966', s: '1966', who: 'Joseph Weizenbaum · MIT', front: 'Conversar com a máquina', back: 'Palavras-chave',
    prob: 'Weizenbaum queria que as pessoas conversassem com um computador digitando. Só que o computador não entendia uma palavra do que era escrito.',
    q: 'Como fingir uma conversa sem entender nada?', opts: ['Achar palavras-chave e responder com frases prontas', 'Responder sempre “sim” para qualquer pergunta', 'Esconder uma pessoa digitando as respostas'],
    sol: 'A ELIZA procurava palavras como “mãe” ou “triste” e encaixava numa frase pronta, como uma terapeuta que devolve perguntas. Muita gente achou que ela entendia! Era só um truque de regras.',
    hint: 'O computador não entendia nada. Que truque faria parecer que entendia?', hoje: 'Converse com ela na próxima etapa e veja o truque.', ph: 2, ic: 'terminal', c: 'mata' },
  { y: '1994 e 2016', s: '1994', who: 'Philip Gage · pesquisadores de tradução', front: 'Palavras demais', back: 'Pedaços que se repetem',
    prob: 'Um programa precisa ler qualquer texto, até palavras que nunca viu, como “zapear”. Uma lista com todas as palavras do mundo não cabe, e ler letra por letra deixa tudo lento.',
    q: 'Como cortar o texto em pedaços que sirvam para qualquer palavra?', opts: ['Juntar as letras que mais andam juntas em pedaços', 'Aceitar só as palavras que estão no dicionário', 'Cortar qualquer texto sempre de 3 em 3 letras'],
    sol: 'Em 1994, Gage compactava arquivos trocando os pares de letras mais comuns por um símbolo novo, de novo e de novo. Em 2016, pesquisadores usaram a ideia para cortar palavras: “infelizmente” vira “in + feliz + mente”.',
    hint: 'Algumas combinações de letras aparecem o tempo todo, como “mente” e “ção”.', hoje: 'É assim que nascem os tokens da fase 4.', ph: 4, ic: 'scissors', c: 'jaca' },
  { y: '2013', s: '2013', who: 'Tomas Mikolov e equipe · Google', front: 'Sentido em números?', back: 'Palavras viram vetores',
    prob: 'Para o computador, “gato” e “felino” eram só dois códigos diferentes, sem relação nenhuma. Como ele poderia saber que as duas palavras têm sentidos parecidos?',
    q: 'Como guardar o sentido de uma palavra em números?', opts: ['Dar números parecidos a palavras usadas nos mesmos lugares', 'Colocar todas as palavras em ordem alfabética', 'Dar a cada palavra o número de letras que ela tem'],
    sol: 'O word2vec aprendeu uma lista de números para cada palavra olhando as vizinhas dela em muitos textos. Palavras usadas do mesmo jeito ficaram perto, e dava até para fazer contas: rei − homem + mulher ≈ rainha.',
    hint: 'Palavras parecidas aparecem nos mesmos lugares das frases.', hoje: 'É o universo dos significados da fase 7.', ph: 7, ic: 'vectors', c: 'ipe' },
  { y: '2017', s: '2017', who: 'Vaswani e colegas · Google', front: 'Frases longas', back: 'Atenção',
    prob: 'Os modelos liam o texto em fila, palavra por palavra, e iam esquecendo o começo das frases longas. E ler em fila era lento.',
    q: 'Como não esquecer o começo da frase?', opts: ['Deixar cada palavra olhar para todas as outras', 'Aceitar só frases curtas, de poucas palavras', 'Ler cada frase três vezes, bem devagar'],
    sol: 'O Transformer, do artigo “Attention Is All You Need”, usa a atenção: cada palavra olha para todas as outras e dá mais peso às importantes. E tudo roda em paralelo nas placas de vídeo.',
    hint: 'E se, em vez de ler em fila, cada palavra pudesse olhar para todas?', hoje: 'Toda LLM moderna é um Transformer. Você vê a atenção na fase 8.', ph: 8, ic: 'spot', c: 'ipe' },
  { y: '2018 a 2022', s: '2022', who: 'OpenAI · GPT e ChatGPT', front: 'Um bom assistente', back: 'Ajuste com pessoas',
    prob: 'Um Transformer treinado em montanhas de texto aprendia a continuar qualquer texto, mas nem sempre respondia como as pessoas queriam: às vezes fugia da pergunta, às vezes inventava.',
    q: 'Como transformá-lo num bom assistente?', opts: ['Ajustá-lo com notas que pessoas dão às respostas', 'Proibir que ele responda qualquer pergunta', 'Dar a ele um dicionário ainda maior'],
    sol: 'Primeiro, o GPT aprendeu a prever a próxima palavra em bilhões de textos (o GPT-3, de 2020, tinha 175 bilhões de pesos). Depois, pessoas avaliaram respostas e o modelo foi ajustado com essas notas. Em 2022, nasceu o ChatGPT.',
    hint: 'Quem sabe dizer se uma resposta ficou boa? As pessoas.', hoje: 'Você ajusta um modelo na fase 9 e cria o seu na fase 11.', ph: 9, ic: 'spark', c: 'urucum' }
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
  brief: { see: 'As LLMs não surgiram do nada. Cada peça nasceu quando alguém enfrentou um problema difícil. Em cada parada você vê o problema da época, tenta resolver e descobre o que foi inventado.', goal: 'Resolver os enigmas da linha do tempo, conversar com um chatbot de 1966 e colocar as grandes ideias em ordem.', key: 'Chatbot', first: 'Leia o problema e escolha, nos botões, como você resolveria.' },
  missions: [
    { id: 'v2a', text: `Resolva os ${STOPS.length} enigmas da linha do tempo`, short: 'linha do tempo' },
    { id: 'v2b', text: 'Converse 3 vezes com a ELIZA e descubra o truque', short: 'ELIZA' },
    { id: 'v2c', text: 'Jogue as 4 rodadas de “Quem veio primeiro?”', short: 'ordem' }],
  steps: [{ k: 'viagem', l: 'Linha do tempo', m: ['v2a'] }, { k: 'eliza', l: 'ELIZA, 1966', m: ['v2b'] }, { k: 'ordem', l: 'Quem veio primeiro?', m: ['v2c'] }],
  stepKey() { return this.step; }, goStep(k) { this.showStep(k); },
  challenge: { q: 'O que a ELIZA, de 1966, fazia para responder?', o: ['Procurava palavras-chave e devolvia frases prontas', 'Aprendia com bilhões de textos', 'Pesquisava na internet'], a: 0, why: 'Era só um conjunto de regras. As LLMs, ao contrário, aprendem padrões com exemplos.' },
  build2d(root) {
    this.step = 'viagem'; this.si = 0; this.visited = new Set([0]); this.ans = {}; this.right = 0; this.miss = {}; this.ord = STOPS.map(() => shuffle([0, 1, 2])); this.log = []; this.revealed = false; this.ri = 0; this.pick = null; this.score = 0; this.played = 0;
    this.inner = scene2d(this, root, [{ c: 'ipe', x: .2, y: .25, r: .55 }, { c: 'jaca', x: .85, y: .15, r: .4 }, { c: 'mata', x: .75, y: .9, r: .45 }]);
    this.m3host = h('div', { class: 'm3' });
    this.render();
  },
  showStep(k) { this.step = k; this.render(); HUD.refresh(); },
  m3opts: { cam: [0, 1.25, 10.3], look: [0, 0.45, 4.4], fov: 30 },
  m3build(M) {
    const ring = new THREE.Group(); M.scene.add(ring); const R = 5.9, n = STOPS.length; this.ring = ring;
    const tex = (st, back) => { const c = document.createElement('canvas'); c.width = 320; c.height = 200; const x = c.getContext('2d');
      x.fillStyle = back ? '#F7D78A' : '#FBFAF5'; rr(x, 6, 6, 308, 188, 22); x.fill(); x.lineWidth = 6; x.strokeStyle = '#1A2338'; rr(x, 6, 6, 308, 188, 22); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#2F55A8'; x.font = `58px ${FONT.display}`; x.fillText(st.s, 160, 62);
      x.fillStyle = '#1A2338'; x.font = `700 23px ${FONT.body}`; const t = back ? st.back : st.front; x.fillText(t.length > 24 ? t.slice(0, 23) + '…' : t, 160, 128);
      x.font = `700 20px ${FONT.body}`; x.fillStyle = back ? '#2B8A70' : '#CF5636'; x.fillText(back ? '✓ resolvido' : '? o problema', 160, 166); return texFrom(c); };
    this.plaques = STOPS.map((st, i) => {
      const a = i / n * Math.PI * 2; const g = new THREE.Group(); const flip = new THREE.Group(); g.add(flip); g.userData.flip = flip;
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.19), new THREE.MeshBasicMaterial({ map: tex(st, false), transparent: true, toneMapped: false })); face.position.z = 0.07; flip.add(face);
      const bf = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.19), new THREE.MeshBasicMaterial({ map: tex(st, true), transparent: true, toneMapped: false })); bf.position.z = -0.07; bf.rotation.y = Math.PI; flip.add(bf);
      const back = inked(rbox(2.0, 1.3, 0.12, 0.06), P3.paper, { ink: 1.04 }); flip.add(back); g.userData.back = back;
      g.position.set(Math.sin(a) * R, 0.55, Math.cos(a) * R); g.rotation.y = a; ring.add(g);
      g.userData.click = () => this.goStop(i); M.picks.push(g); return g;
    });
    M.ticks.push((dt, tt) => {
      const target = -this.si / n * Math.PI * 2; let d = target - ring.rotation.y; d = ((d + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; ring.rotation.y += d * Math.min(1, dt * 4);
      this.plaques.forEach((g, i) => { const k = i === this.si ? 1.12 : 0.92; g.scale.setScalar(lerp(g.scale.x, k, Math.min(1, dt * 6))); });
      this.plaques.forEach((g, i) => { g.position.y = 0.55 + (i === this.si ? Math.sin(tt * 2) * 0.04 : 0); const f = g.userData.flip; const to = this.ans[i] != null ? Math.PI : 0; f.rotation.y = lerp(f.rotation.y, to, Math.min(1, dt * 5)); });
    });
    this.plaqueSync();
  },
  plaqueSync() { if (!this.plaques) return; this.plaques.forEach((g, i) => g.userData.back.material.color.setHex(i === this.si ? P3.ipe : this.ans[i] != null ? P3.mataL : P3.paper)); },
  render() {
    const v = this.inner; v.innerHTML = ''; clearBalloons();
    if (this.step === 'viagem' && !this.no3d) { v.append(this.m3host); this.plaqueSync && this.plaqueSync(); }
    if (this.step === 'viagem' && this.no3d) {
      const GAP = 86, W = STOPS.length * GAP + 40; const road = sv('svg', { class: 'road', width: W, height: 74, viewBox: `0 0 ${W} 74` });
      let d = `M 10 46`; STOPS.forEach((s, i) => { const x = 43 + i * GAP; d += ` Q ${x - GAP / 2} ${i % 2 ? 58 : 34}, ${x} 46`; }); d += ` L ${W - 6} 46`;
      road.append(sv('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round', filter: 'url(#rough)' }));
      const rail = h('div', { class: 'tlrail', style: `width:${W}px` }, road);
      this.dots = STOPS.map((s, i) => { const b = h('button', { class: 'tlstop' + (this.visited.has(i) ? ' seen' : '') + (i === this.si ? ' cur' : ''), style: `left:${43 + i * GAP}px`, 'aria-label': `${s.y}: ${s.t}`, onclick: () => this.goStop(i) }, h('span', { class: 'dd' }), h('small', null, s.s)); rail.append(b); return b; });
      this.me = h('div', { class: 'tlme', style: `left:${43 + this.si * GAP}px` }); this.me.innerHTML = '<svg viewBox="0 0 48 48" width="30" height="30"><use href="#tokSym"/><path d="M18 34 q6 5 12 0" stroke="#23304D" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>'; rail.append(this.me);
      this.strip = h('div', { class: 'tlstrip' }, rail); v.append(this.strip);
    }
    if (this.step === 'viagem') {
      const st = STOPS[this.si]; const an = this.ans[this.si]; const done = an != null;
      const body = h('div', { class: 'pc-body' }, h('div', { class: 'pc-y' }, st.y), h('div', { class: 'pc-who' }, st.who));
      if (!done) body.append(h('div', { class: 'pc-lab r' }, 'O problema'), h('p', { class: 'pc-x' }, st.prob), h('p', { class: 'pc-q' }, st.q), this.miss[this.si] != null ? h('p', { class: 'pc-miss rise' }, `✗ “${st.opts[this.miss[this.si]]}” não resolveria. Dica: ${st.hint}`) : null);
      else body.append(h('div', { class: 'pc-lab r' }, 'O problema'), h('p', { class: 'pc-x muted' }, st.q));
      this.card = h('article', { class: 'sheet pad postcard tl' + (done ? '' : ' rise'), 'aria-live': 'polite' }, icoEl(st.ic, st.c), body, h('span', { class: 'stamp' }, `${this.si + 1}/${STOPS.length}`));
      if (done) {
        const ok = an === 0, first = ok && this.miss[this.si] == null;
        this.card.append(h('div', { class: 'pc-sol rise' }, h('div', { class: 'pc-lab g' + (ok ? '' : ' r') }, first ? '✓ Você pensou como eles!' : ok ? '✓ Isso! Foi assim que resolveram:' : '✗ Não foi assim. Eles fizeram isto:'), h('p', { class: 'pc-x' }, st.sol)),
          h('div', { class: 'pc-hoje' }, h('b', null, 'E hoje?'), h('span', null, st.hoje), st.ph !== 2 ? h('span', { class: 'pill2 y', style: 'margin-left:auto' }, 'fase ' + st.ph) : null));
      }
      v.append(this.card);
      if (S.done.v2a) v.append(h('div', { class: 'sheet pad col2 tr' }, h('p', { class: 'lbl', style: 'margin:0' }, 'Resumo da viagem: cada problema virou uma peça das LLMs'), h('div', { class: 'recap' }, STOPS.map(x => h('p', null, h('b', null, x.s), ` ${x.back}`, x.ph !== 2 ? h('span', { class: 'muted' }, ` · fase ${x.ph}`) : null)))));
      if (this.strip) requestAnimationFrame(() => { const x = 43 + this.si * 86 - this.strip.clientWidth / 2; this.strip.scrollTo({ left: Math.max(0, x), behavior: REDUCED ? 'auto' : 'smooth' }); });
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
  goStop(i) {
    i = clamp(i, 0, STOPS.length - 1); if (i === this.si && this.step === 'viagem') return;
    this.si = i; this.visited.add(i); SND.play('pop'); this.render(); this.plaqueSync(); HUD.refresh();
    const sc = this.inner && this.inner.closest('.ch'); if (sc) sc.scrollTop = 0;
  },
  answer(k) {
    const i = this.si; if (this.ans[i] != null) return;
    if (k !== 0 && this.miss[i] == null) { this.miss[i] = k; SND.play('bad'); this.render(); HUD.refresh(); return; }
    this.ans[i] = k; if (k === 0) { if (this.miss[i] == null) this.right++; SND.play('ok'); } else SND.play('pop');
    this.render(); this.plaqueSync(); HUD.refresh();
    const st = STOPS[i]; VOICE.say((k === 0 ? 'Isso! ' : '') + st.sol);
    if (Object.keys(this.ans).length === STOPS.length) { complete('v2a'); TG.say(`Você resolveu os ${STOPS.length} enigmas e acertou de primeira ${this.right}. Agora converse com a ELIZA, de 1966, o primeiro chatbot.`); }
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
    if (this.step === 'viagem') { const i = this.si, st = STOPS[i], done = this.ans[i] != null; const nx = STOPS.findIndex((x, j) => this.ans[j] == null);
      if (!done) rows.push({ opts: true, label: 'Como você resolveria?', items: this.ord[i].map(k => this.miss[i] === k ? { ...chip('✗ ' + st.opts[k], false, () => {}), disabled: true, bad: true } : chip(st.opts[k], false, () => this.answer(k))) });
      else rows.push([abtn('◀', () => this.goStop(i - 1), { disabled: i === 0 }), nx >= 0 ? abtn('Próxima parada ▶', () => this.goStop(i + 1 < STOPS.length && this.ans[i + 1] == null ? i + 1 : nx), { primary: true, hot: true }) : abtn('Rever a próxima ▶', () => this.goStop((i + 1) % STOPS.length))]); }
    if (this.step === 'eliza') {
      const used = new Set(this.log.map(l => l.msg));
      rows.push({ wrap: true, label: 'Diga à ELIZA', items: ELIZA_PRESETS.map((t, i) => ({ ...chip(t, false, () => this.talk(t)), hot: !this.revealed && !used.has(t) && ELIZA_PRESETS.findIndex(x => !used.has(x)) === i })).concat([chip('✎ Escrever', false, () => askText('Diga algo para a ELIZA', '', v => this.talk(v), { kicker: 'ELIZA · 1966', okLabel: 'Enviar' }))]) });
    }
    if (this.step === 'ordem' && this.pick != null && this.ri < ORDER.length - 1) rows.push([abtn('Próxima rodada ▶', () => this.nextRound(), { primary: true, hot: true })]);
    return rows;
  },
  hs() { return this.step === 'eliza' ? [['Chatbot', () => this.term]] : []; },
  guide() {
    if (this.step === 'viagem') return { tip: S.done.v2a ? 'Você atravessou 2.000 anos! Agora converse com a ELIZA, o primeiro chatbot.' : this.ans[this.si] == null ? 'Leia o problema da época. Como você resolveria? Escolha uma ideia nos botões.' : 'Veja o que foi inventado e siga para a próxima parada.' };
    if (this.step === 'eliza') return { tip: this.revealed ? 'É só um truque de regras. As LLMs aprendem de verdade, como você vai ver.' : 'Escolha uma frase para dizer à ELIZA. Preste atenção nas respostas.' };
    if (this.pick == null && this.ri < ORDER.length) return { tip: 'Qual das duas ideias surgiu primeiro? Toque no cartão.' };
    return { tip: this.ri >= ORDER.length ? 'Agora vamos seguir essa evolução, começando por Markov e Shannon: prever a próxima palavra.' : 'Veja os anos e siga para a próxima rodada.' };
  }
});
