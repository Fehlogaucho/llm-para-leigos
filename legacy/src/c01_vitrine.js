/* ============ Fase 1 · O que uma LLM faz (vitrine + mistério) ============ */
const LIVE = { sample: null };
const SKILLS = [
  { k: 'responder', l: 'Responder', ic: 'chat', c: 'anil', q: 'Por que o céu é azul?', a: 'A luz do Sol tem todas as cores misturadas. Quando ela atravessa o ar, a luz azul se espalha muito mais do que as outras e chega aos nossos olhos vinda de todas as direções. Por isso o céu parece azul.' },
  { k: 'traduzir', l: 'Traduzir', ic: 'globe', c: 'mata', q: 'Traduza para o inglês: “Bom dia! Tudo bem com você?”', a: 'Good morning! How are you?' },
  { k: 'resumir', l: 'Resumir', ic: 'summary', c: 'ipe', q: 'Resuma em uma frase: “A Floresta Amazônica se espalha por nove países, abriga milhões de espécies e ajuda a formar as chuvas de boa parte da América do Sul.”', a: 'A Amazônia, presente em nove países, guarda milhões de espécies e ajuda a trazer chuva para a América do Sul.' },
  { k: 'criar', l: 'Criar poesia', ic: 'feather', c: 'jaca', q: 'Escreva um haicai sobre café.', a: 'Xícara fumegante\no dia acorda devagar\ncheiro de manhã' },
  { k: 'programar', l: 'Programar', ic: 'code', c: 'urucum', q: 'Escreva uma função em Python que soma dois números.', a: 'def somar(a, b):\n    return a + b', code: true },
  { k: 'explicar', l: 'Explicar', ic: 'bulb', c: 'ipe', q: 'Explique fotossíntese para uma criança de 7 anos.', a: 'É o jeito que as plantas fazem a própria comida! Elas pegam a luz do sol, a água e um gás do ar e transformam tudo em energia para crescer. E ainda soltam o oxigênio que a gente respira.' }
];
const FAMILIES = [
  { n: 'ChatGPT', who: 'OpenAI', where: 'EUA', f: 'Usa os modelos GPT. Em 2022, levou as LLMs para o mundo todo.', c: 'anil-soft' },
  { n: 'Claude', who: 'Anthropic', where: 'EUA', f: 'Criado por uma empresa fundada para pesquisar IA segura.', c: 'ipe-soft' },
  { n: 'Gemini', who: 'Google', where: 'EUA', f: 'Aparece em produtos do Google, como a busca e o Android.', c: 'mata-soft' },
  { n: 'Llama', who: 'Meta', where: 'EUA', f: 'Modelo aberto: qualquer pessoa pode baixar e rodar.', c: 'urucum-soft' },
  { n: 'Mistral', who: 'Mistral AI', where: 'França', f: 'Uma das principais empresas de IA da Europa.', c: 'jaca-soft' },
  { n: 'DeepSeek', who: 'DeepSeek', where: 'China', f: 'Chamou atenção em 2025 com um modelo aberto e barato de treinar.', c: 'anil-soft' },
  { n: 'Qwen', who: 'Alibaba', where: 'China', f: 'Família de modelos abertos muito usada por programadores.', c: 'mata-soft' },
  { n: 'Sabiá', who: 'Maritaca AI', where: 'Brasil', f: 'LLM brasileira, treinada com muito texto em português.', c: 'ipe-soft' }
];
const HOW = [['Procurou a resposta na internet', false, 'Nada disso: ela não pesquisou nada. Repare como a resposta apareceu, pedaço por pedaço.'], ['Achou numa lista de respostas prontas', false, 'Não. Ninguém escreveu essa resposta antes para ela. Repare como a frase foi aparecendo.'], ['Adivinhou uma palavra de cada vez', true]];
PHASES.push({
  kind: '2d', name: 'O que uma LLM faz', title: 'A vitrine e um mistério', era: 'hoje', act: 'O começo', badge: 'Curioso de carteirinha',
  brief: { see: 'As LLMs já conversam, traduzem, resumem, escrevem poemas e programam. Você vai testar algumas habilidades e conhecer as LLMs mais famosas.', goal: 'Ver do que uma LLM é capaz e desvendar um mistério: como ela chega a uma resposta?', key: 'LLM', first: 'Aperte o botão azul e veja a LLM responder.' },
  missions: [
    { id: 'v1a', text: 'Teste 3 habilidades da LLM', short: 'habilidades' },
    { id: 'v1b', text: 'Vire as 8 cartas das LLMs mais famosas', short: 'famílias' },
    { id: 'v1c', text: 'Descubra como a LLM chegou em “Brasília”', short: 'mistério' }],
  steps: [{ k: 'hab', l: 'Habilidades', m: ['v1a'] }, { k: 'quem', l: 'Quem são', m: ['v1b'] }, { k: 'mist', l: 'O mistério', m: ['v1c'] }],
  stepKey() { return this.step; }, goStep(k) { this.showStep(k); },
  challenge: { q: 'Qual destas LLMs foi criada no Brasil?', o: ['Sabiá', 'Mistral', 'Gemini'], a: 0, why: 'O Sabiá é da Maritaca AI, uma empresa brasileira, e foi treinado com muito texto em português.' },
  build2d(root) {
    this.step = 'hab'; this.tried = new Set(); this.flipped = new Set(); this.busy = false; this.asked = false; this.guess = null; this.wrongs = new Set();
    const inner = scene2d(this, root, [{ c: 'anil', x: .12, y: .18, r: .55 }, { c: 'ipe', x: .9, y: .7, r: .5 }, { c: 'jaca', x: .55, y: .02, r: .32 }, { c: 'mata', x: .1, y: .95, r: .35 }]);
    this.chat = mkChat('Assistente de IA'); this.view = h('div', { class: 'col2' }); this.m3host = h('div', { class: 'm3 short' });
    inner.append(this.m3host, this.chat.el, this.view);
    this.chat.note('Escolha uma habilidade e veja a mágica acontecer.');
    this.render();
  },
  showStep(k) { this.step = k; this.render(); HUD.refresh(); },
  m3opts: { cam: [0, 1.25, 7.2], look: [0, 0.95, 0], fov: 28 },
  m3build(M) {
    const t = tok3(); M.scene.add(t); this.tok3 = t; this.flyers = new THREE.Group(); M.scene.add(this.flyers); this.nEmit = 0;
    t.userData.click = () => { t.userData.jump = 1; SND.play('pop'); if (TG.hintText) VOICE.say(TG.hintText); }; M.picks.push(t);
    M.ticks.push((dt, tt) => {
      const j = t.userData.jump || 0; t.position.y = Math.sin(tt * 2) * 0.05 + (j > 0 ? Math.sin((1 - j) * Math.PI) * 0.45 : 0); if (j > 0) t.userData.jump = Math.max(0, j - dt * 2.2);
      t.rotation.y = Math.sin(tt * 0.6) * 0.3; t.userData.mouth.scale.y = this.talking ? 1 + Math.abs(Math.sin(tt * 16)) * 1.1 : 1;
      t.userData.pupils.forEach(p => { p.position.x = (p.position.x > 0 ? 0.34 : -0.34) + Math.sin(tt * 0.9) * 0.05; });
      for (const c of [...this.flyers.children]) { const u = c.userData; u.age += dt; u.v.y -= dt * 1.1; c.position.addScaledVector(u.v, dt); c.rotation.x += dt * u.spin; c.rotation.z += dt * u.spin * 0.5; c.scale.setScalar(Math.min(1, u.age * 5) * (u.age > 1.8 ? Math.max(0.01, 1 - (u.age - 1.8) * 2.5) : 1)); if (u.age > 2.2) { this.flyers.remove(c); clear3(c); } }
    });
  },
  emit(tok, big) {
    if (!this.M3 || !this.flyers || REDUCED) return; if (this.flyers.children.length > 16) { const o = this.flyers.children[0]; this.flyers.remove(o); clear3(o); }
    const cols = [P3.anilL, P3.ipeL, P3.mataL, P3.urucumL, P3.jacaL]; const b = block3(tok.length > 12 ? tok.slice(0, 11) + '…' : tok, big && /Brasília/.test(tok) ? P3.ipe : cols[this.nEmit++ % 5], { h: big ? 0.52 : 0.4, d: 0.28, size: 30 });
    const sd = this.nEmit % 2 ? 1 : -1; b.position.set(0, 0.6, 0.7); b.userData.age = 0; b.userData.spin = (Math.random() - 0.5) * 3; b.userData.v = new THREE.Vector3(sd * (1.2 + Math.random() * 1.4), 1.6 + Math.random() * 0.8, 0.4); b.scale.setScalar(0.01); this.flyers.add(b);
  },
  render() {
    const v = this.view; v.innerHTML = ''; clearBalloons();
    this.chat.el.hidden = this.step === 'quem'; this.m3host.hidden = this.step === 'quem';
    if (this.step === 'hab') {
      v.append(h('p', { class: 'note' }, this.tried.size < 3 ? `Habilidades testadas: ${this.tried.size} de 3` : `Você testou ${this.tried.size} habilidades. Pode testar mais ou seguir em frente.`));
    }
    if (this.step === 'quem') {
      v.append(h('h2', { class: 'ttl', style: 'text-align:center' }, 'As LLMs mais conhecidas'));
      this.cards = FAMILIES.map((f, i) => h('button', { class: 'fcard' + (this.flipped.has(i) ? ' flip' : ''), style: `--fc:var(--${f.c})`, 'aria-label': `${f.n}, de ${f.who}`, onclick: () => this.flip(i) },
        h('span', { class: 'fin' }, h('span', { class: 'ff' }, h('b', null, f.n), h('small', null, 'toque para virar')), h('span', { class: 'fb' }, h('b', { class: 'fbn' }, f.n), h('b', null, `${f.who} · ${f.where}`), h('span', null, f.f)))));
      v.append(h('div', { class: 'fam' }, this.cards));
      v.append(h('p', { class: 'note' }, 'Empresas diferentes, a mesma receita por dentro. É ela que você vai descobrir.'));
    }
    if (this.step === 'mist') {
      if (this.guess != null) {
        const toks = [['A', 41], ['capital', 88], ['do', 97], ['Brasil', 99], ['é', 93], ['Brasília', 96], ['.', 90]];
        v.append(h('div', { class: 'sheet pad tr rise col2' },
          h('p', { class: 'lbl', style: 'margin:0' }, this.wrongs.size ? 'Isso! Você desvendou o mistério:' : 'Isso mesmo! De primeira!'),
          h('p', { style: 'margin:0' }, 'A cada passo, a LLM calcula a chance de cada palavra vir a seguir e escolhe uma. Depois repete, com a frase um pouco maior.'),
          h('div', { class: 'sent' }, toks.map(([t, p], i) => h('span', { class: 'ptok rise', style: `animation-delay:${i * 0.12}s` }, chipTok(t, t === 'Brasília' ? 'y' : 'c' + (i % 5)), h('small', null, p + '%')))),
          h('p', { class: 'small muted', style: 'margin:0' }, 'Chances de exemplo. Algumas IAs também sabem pesquisar na internet, mas o coração de toda LLM é este: adivinhar a próxima palavra.')));
        v.append(h('p', { class: 'note rise', style: 'font-size:22px;animation-delay:.9s' }, 'Mas como uma máquina aprende a adivinhar tão bem? Para entender, vamos voltar ao passado.'));
      }
    }
  },
  async play(sk) {
    if (this.busy) return; this.busy = true; this.cur = sk.k; SND.play('pop'); HUD.refresh();
    const ok = live(this); this.chat.clear(); this.chat.user(sk.q); this.talking = true; await this.chat.bot(sk.a, { code: sk.code, onTok: t => this.emit(t) }); this.talking = false; if (!ok()) return;
    this.tried.add(sk.k); this.busy = false; if (this.tried.size >= 3) complete('v1a');
    if (this.step === 'hab') this.render(); HUD.refresh();
  },
  flip(i) {
    if (this.flipped.has(i)) { this.cards[i].classList.toggle('flip'); return; }
    this.flipped.add(i); this.cards[i].classList.add('flip'); SND.play('pop');
    if (this.flipped.size === FAMILIES.length) complete('v1b'); HUD.refresh();
  },
  async ask() {
    if (this.busy) return; this.busy = true; HUD.refresh(); const ok = live(this);
    this.chat.clear(); this.chat.user('Qual é a capital do Brasil?'); this.talking = true; await this.chat.bot('A capital do Brasil é Brasília.', { speed: 300, think: 600, onTok: t => this.emit(t, true) }); this.talking = false; if (!ok()) return;
    this.asked = true; this.busy = false; this.render(); HUD.refresh();
    TG.say('Pergunta difícil: como ela chegou nessa resposta? Escolha nos botões lá embaixo.');
  },
  answer(i) {
    if (!HOW[i][1]) { this.wrongs.add(i); SND.play('bad'); TG.say(HOW[i][2] + ' Tente outra.'); HUD.refresh(); return; }
    this.guess = i; SND.play('ok'); complete('v1c'); this.render(); HUD.refresh();
    setTimeout(() => { if (E.phase === this) TG.say('Mas você sabe como funciona por dentro? Vamos voltar ao passado e entender, peça por peça!'); }, 1600);
  },
  async askReal() {
    const sample = LIVE.sample; if (!sample) return;
    askText('Pergunte o que quiser', '', async q => {
      this.step = 'hab'; this.render(); this.chat.clear(); this.chat.user(q); const out = this.chat.stream(); out.set('Pensando…');
      try {
        const { text } = await sample('Responda em português do Brasil, em no máximo 4 frases curtas e simples, para uma pessoa leiga. Pergunta: ' + q, { modelTier: 'quick', cache: false, onText: ({ text }) => out.set(text) });
        out.set(text); this.chat.note('Resposta de verdade, gerada agora por uma LLM.');
      } catch (e) {
        out.set(e && e.text ? e.text : ''); this.chat.note(e && e.code === 'not_granted' ? 'Tudo bem! Sem permissão, seguimos com os exemplos do jogo.' : e && e.code === 'rate_limited' ? 'Muitas perguntas seguidas. Tente de novo daqui a pouco.' : 'Não deu para falar com a IA agora. Os exemplos do jogo continuam funcionando.');
        if (e && (e.code === 'not_granted' || e.code === 'sampling_disabled')) LIVE.sample = null;
      }
      HUD.refresh();
    }, { kicker: 'Teste uma LLM de verdade', okLabel: 'Perguntar', help: 'Usa a sua conta do Claude. O jogo pede sua permissão antes.' });
  },
  actions() {
    const rows = [];
    if (this.step === 'hab') {
      const nx = SKILLS.find(s => !this.tried.has(s.k));
      rows.push([nx ? abtn(S.done.v1a ? `Testar mais (opcional): ${nx.l}` : `Testar: ${nx.l}`, () => this.play(nx), { primary: !S.done.v1a, hot: !S.done.v1a, disabled: this.busy }) : null, LIVE.sample ? abtn('Perguntar o que eu quiser', () => this.askReal(), { disabled: this.busy }) : null]);
    }
    if (this.step === 'quem') { const nx = FAMILIES.findIndex((f, i) => !this.flipped.has(i)); if (nx >= 0) rows.push([abtn('Virar a próxima carta', () => this.flip(nx), { primary: true, hot: true })]); }
    if (this.step === 'mist') {
      if (!this.asked) rows.push([abtn('Perguntar: Qual é a capital do Brasil?', () => this.ask(), { primary: true, hot: true, disabled: this.busy })]);
      else if (this.guess == null) rows.push({ opts: true, label: 'Como ela chegou em “Brasília”?', items: HOW.map(([t], i) => this.wrongs.has(i) ? { ...chip('✗ ' + t, false, () => {}), disabled: true, bad: true } : chip(t, false, () => this.answer(i))) });
    }
    return rows;
  },
  hs() { return [['LLM', () => this.chat.el.hidden ? null : this.chat.el.querySelector('.chat-h'), [0, 0, 0]]]; },
  guide() {
    if (this.step === 'hab') { const nx = SKILLS.findIndex(s => !this.tried.has(s.k)); return { target: this.busy ? null : this.stk && this.stk[nx], tip: this.busy ? 'Veja: a resposta aparece em pedacinhos, um atrás do outro.' : S.done.v1a ? 'Você viu que ela faz de tudo. Agora vamos conhecer quem são as LLMs mais famosas.' : 'Aperte o botão azul e veja a LLM trabalhar. Repare como a resposta aparece.' }; }
    if (this.step === 'quem') return this.flipped.size === FAMILIES.length ? { tip: 'Oito LLMs de empresas e países diferentes. Por dentro, todas seguem a mesma receita. Vamos ao mistério!' } : { target: this.cards && this.cards[FAMILIES.findIndex((f, i) => !this.flipped.has(i))], tip: 'Vire as cartas. Quem criou cada LLM, e de onde ela vem?' };
    if (!this.asked) return { tip: 'Agora, um mistério. Faça a pergunta e preste atenção em como a resposta aparece.' };
    if (this.guess == null) return { tip: 'Como ela chegou em “Brasília”? Escolha nos botões lá embaixo.' };
    return { tip: 'Mas você sabe como funciona por dentro? Vamos voltar ao passado e entender.' };
  }
});
