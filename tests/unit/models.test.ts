// Os modelinhos didáticos se comportam como o jogo diz que se comportam.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tokenize, tokenizeWord, tokenizeSmall, tokenId, QUESTION, nextDist, withT, MINI, MiniLM, ragSearch, RAG_DOCS, CANTINA, AVISO_2019 } from '../../src/v2/content/llm'
import { SENTS } from '../../src/v2/levels/p3/lab'

const base = SENTS.filter((s) => !s.extra).map((s) => s.s)
const toks = (s: string) => s.split(' ')

test('tokenizador: pedaços, pontuação e dois jeitos de cortar', () => {
  assert.deepEqual(tokenizeWord('infelizmente'), ['in', 'feliz', 'mente'])
  assert.deepEqual(tokenize('Brasil?').map((t) => t.t), ['Brasil', '?'])
  const txt = 'Infelizmente o desenvolvimento atrasou'
  assert.ok(tokenizeSmall(txt).length > tokenize(txt).length, 'o tokenizador B corta mais')
  assert.deepEqual(QUESTION.map(tokenId), [1842, 91, 17, 7231, 52, 4098, 8])
})

test('contagem e temperatura: baixa favorece a favorita, alta iguala', () => {
  const d = nextDist('é')
  assert.equal(d[0].t, 'uma')
  assert.ok(withT(d, 0.3)[0].p > d[0].p && withT(d, 2)[0].p < d[0].p)
})

test('modelinho de 27 pesos aprende Brasília e generaliza para Paris', () => {
  const W = MINI.init()
  let n = 0
  while (MINI.probs(W, MINI.K[0].x)[0] < 0.9 && n < 400) { const e = MINI.EX[n % MINI.EX.length]; MINI.step(W, MINI.exX(e), MINI.K[e.k].y, 0.8); n++ }
  assert.ok(n < 300, `levou ${n} passos`)
  assert.equal(MINI.V[MINI.probs(W, MINI.K[1].x).indexOf(Math.max(...MINI.probs(W, MINI.K[1].x)))], 'Paris')
})

test('MiniLM: o erro cai e, com memória 3, responde Brasília', () => {
  const m = new MiniLM(base, 3, 3)
  const l0 = m.loss(); let L = l0
  for (let e = 0; e < 60; e++) L = m.epoch(0.08)
  assert.ok(L < l0 * 0.3, `perda ${l0.toFixed(2)} → ${L.toFixed(2)}`)
  assert.equal(m.top(toks('A capital do Brasil é'), 1)[0].t, 'Brasília')
  assert.equal(m.top(toks('A capital da França é'), 1)[0].t, 'Paris')
})

test('MiniLM: limites que a Sala de Teste mostra', () => {
  const m3 = new MiniLM(base, 3, 3); for (let e = 0; e < 60; e++) m3.epoch(0.08)
  assert.equal(m3.id('Espanha'), 2, '“Espanha” vira ⟨?⟩')
  assert.notEqual(m3.top(toks('A capital da Espanha é'), 1)[0].t, 'Madri')
  assert.ok(m3.top(toks('A capital da Espanha é'), 1)[0].p > 0.3, 'responde errado com confiança')
  const m1 = new MiniLM(base, 1, 3); for (let e = 0; e < 60; e++) m1.epoch(0.08)
  assert.notEqual(m1.top(toks('A capital do Brasil é'), 1)[0].t, 'Brasília', 'com memória 1 ela erra')
  const mx = new MiniLM([...base, 'A capital de Portugal é Lisboa .'], 3, 3); for (let e = 0; e < 60; e++) mx.epoch(0.08)
  assert.equal(mx.top(toks('A capital de Portugal é'), 1)[0].t, 'Lisboa', 'com a frase extra, acerta Portugal')
})

test('busca da biblioteca (RAG): acha o certo, não acha o que não existe e acha o aviso velho', () => {
  assert.equal(ragSearch('Que horas a biblioteca abre no sábado?', RAG_DOCS)[0].d.t, 'Regulamento da biblioteca')
  assert.ok(ragSearch('Que horas sai o pão de queijo?', RAG_DOCS)[0].s < 0.15)
  assert.equal(ragSearch('Que horas sai o pão de queijo?', [...RAG_DOCS, CANTINA])[0].d.t, 'Cantina do campus')
  assert.equal(ragSearch('A biblioteca abre no feriado de amanhã?', [...RAG_DOCS, CANTINA, AVISO_2019])[0].d.t, AVISO_2019.t)
})
