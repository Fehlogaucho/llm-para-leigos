/* ============ Fase 7 · O universo dos significados (3D, reaproveita a galáxia da v2) ============ */
{
  const P = PHASES[PHASES.length - 1];
  Object.assign(P, {
    kind: '3d', name: 'Universo dos significados', title: 'A galáxia das palavras', era: '2013 · palavras viram números', act: 'Como funciona, peça por peça', badge: 'Astronauta dos vetores',
    lblkM: 1.35, mview: [[0.2, 5.8, 10.2], [0.3, 1.5, -0.3]],
    brief: { see: 'Depois de virar número, cada token ganha um endereço: uma lista de números, como coordenadas numa galáxia. Palavras de sentido parecido moram perto.', goal: 'Ver os números de uma palavra, levar palavras perdidas ao grupo certo e descobrir a capital de Portugal seguindo as setas.', key: 'Embedding', first: 'Escolha uma palavra nos botões lá embaixo para ver os números dela.' },
    challenge: { q: 'No espaço dos embeddings, “Paris” fica mais perto de…', o: ['Roma', 'banana', 'gol'], a: 0, why: 'Paris e Roma aparecem em frases parecidas (“a capital da… é…”), por isso seus vetores ficam próximos.' },
    hs() { return [['Embedding', new THREE.Vector3(0.4, 3.9, -1.6)]]; },
    actions() {
      const rows = []; const lost = this.lost.filter(L => !L.placed); const free = [S.done.p2a, S.done.p2b, S.done.p2c].every(Boolean);
      const stage = free ? 'free' : !S.done.p2a ? 'a' : !S.done.p2b ? 'b' : 'c';
      if (stage === 'a' || stage === 'free') rows.push({ wrap: true, label: 'Ver os números de', items: ['Brasil', 'Paris', 'gol', 'banana'].map((t, i) => ({ ...chip(t, this.sel && this.sel.t === t, () => this.select(this.W.find(w => w.t === t))), hot: stage === 'a' && i === 0 })) });
      if (stage === 'b' && lost.length && !this.selLost) rows.push({ wrap: true, label: 'Pegar uma palavra perdida', items: lost.map((L, i) => ({ ...chip(L.t, false, () => this.selectLost(L)), hot: i === 0 })) });
      if (stage === 'b' && this.selLost) rows.push({ wrap: true, label: `Levar “${this.selLost.t}” para qual grupo?`, items: Object.entries(this.clusters).map(([k, cl]) => chip(cl.name, false, () => this.tryPlace(k))).concat([chip('Cancelar', false, () => this.selectLost(this.selLost))]) });
      if (stage === 'c' && this.analogy) rows.push({ wrap: true, label: 'Brasil → Brasília · França → Paris · Portugal → ?', items: ['Paris', 'Lisboa', 'Roma', 'Buenos Aires'].map(t => chip(t, false, () => this.answerAnalogy(this.W.find(x => x.t === t)))) });
      if (stage === 'c' || stage === 'free') rows.push([abtn(this.analogy ? 'Esconder setas' : 'Mostrar setas país → capital', () => this.toggleAnalogy(), { primary: !this.analogy, hot: stage === 'c' && !this.analogy }), stage === 'c' && this.analogy ? abtn('Dica', () => { this.ghost.visible = true; balloon('ana', () => this.ghost, '<p>O ponto “?” mostra onde a seta de Portugal chega. Qual capital está ali?</p>', { kind: 'quest', ttl: 5000, yOff: 0.3 }); }) : null]);
      return rows;
    }
  });
  after(P, 'select', function ([w]) { const near = (this.near || []).map(n => `${n.o.t} ${Math.round(n.s * 100)}%`).join(' · ');
    balloon('sel', w.g, `<p><b>${w.t}</b></p><p class="mono">${this.vecStr(w.p)}</p><p class="small">Esses 3 números são o endereço de “${w.t}” no mapa.</p><p class="small">Mais parecidas: ${near}</p>`, { kind: 'quest', yOff: 0.55 }); HUD.refresh(); });
  const tp = P.tryPlace; P.tryPlace = async function (ck) { const L = this.selLost; const r = await tp.call(this, ck); if (!L) return r;
    if (L.placed) balloon('pl', new THREE.Vector3(...L.p), `<p><b>Isso!</b> “${L.t}” mora com ${this.clusters[ck].name.toLowerCase()}.</p>`, { kind: 'ok', ttl: 3500, yOff: 0.5 });
    else { balloon('pl', L.g, `<p>“${L.t}” não combina com ${this.clusters[ck].name}.</p>`, { kind: 'bad', ttl: 5000, yOff: 0.5 }); TG.say(`“${L.t}” não combina com ${this.clusters[ck].name.toLowerCase()}. Pegue a palavra de novo e tente outro grupo.`); }
    HUD.refresh(); return r; };
  after(P, 'toggleAnalogy', function () {
    if (this.analogy) { unballoon('sel'); flyTo([-1.0, 4.4, 7.4], [-1.1, 1.5, 0.4], 900); const pt = this.W.find(w => w.t === 'Portugal');
      if (!S.done.p2c) { this.ghost.visible = true; if (!this.ptArrow) { const g = this.ghost.children[0].position.toArray(); this.ptArrow = arrow3(pt.p, pt.p.map((v, i) => v + (g[i] - v) * 0.84), COL.yellow, 0.025, { emissive: COL.yellow, ei: 0.2, opacity: 0.6 }); this.ghost.add(this.ptArrow); }
        balloon('ana', pt.g, '<p><b>Portugal → ?</b></p><p>As setas amarelas ligam cada país à sua capital, e todas apontam para o mesmo lado. Saindo de Portugal nesse mesmo sentido, chegamos ao ponto “?”. Que palavra mora ali perto?</p>', { kind: 'quest', say: 'As setas ligam cada país à sua capital e apontam para o mesmo lado. Saindo de Portugal no mesmo sentido, chegamos ao ponto de interrogação. Que palavra mora ali?', yOff: 0.55 }); } }
    else { unballoon('ana'); camReset(); } HUD.refresh(); });
  after(P, 'answerAnalogy', function ([w]) { const pt = this.W.find(x => x.t === 'Portugal');
    if (this.anaKind === 'ok') balloon('ana', pt.g, '<p><b>Exato: Lisboa!</b></p><p>A seta verde aponta na mesma direção das amarelas: a ideia “capital de” vira uma direção nesse espaço.</p>', { kind: 'ok', ttl: 7000, say: 'Exato, Lisboa! A seta aponta na mesma direção das outras.', yOff: 0.55 });
    else { const a = arrow3(pt.p, pt.p.map((v, i) => v + (w.p[i] - v) * 0.86), COL.coral, 0.03, { emissive: COL.coral, ei: 0.3 }); this.answer.add(a); setTimeout(() => { this.answer.remove(a); disposeGroup(a); }, 1800);
      balloon('ana', pt.g, `<p><b>${w.t}?</b> Veja: a seta vermelha não aponta para o mesmo lado das amarelas nem chega ao ponto “?”. Tente outra!</p>`, { kind: 'bad', ttl: 6000, yOff: 0.55 }); TG.say(`${w.t} não: a seta vermelha não vai para o ponto de interrogação. Tente outra!`); SND.play('bad'); }
    HUD.refresh(); });
  P.drawInfo = function () { HUD.refresh(); };
}
