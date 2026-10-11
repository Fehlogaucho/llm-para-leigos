// Conteúdo: documentos, Codex, prova e avaliações do modo piloto estão completos e coerentes.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { STOPS } from '../../src/v2/content/stops'
import { CODEX, CODEX_LIST } from '../../src/v2/content/codex'
import { ZONES, P2_PIPELINE } from '../../src/v2/levels/p2/zones'
import { STATIONS, EXAM, EXAM_PASS, PREFS, SENTS } from '../../src/v2/levels/p3/lab'
import { PILOT_PRE, PILOT_POS } from '../../src/v2/ui/Pilot'

test('cada ilha da Fase 1 tem documento de 4 páginas com fontes', () => {
  assert.equal(STOPS.length, 11)
  for (const s of STOPS) {
    assert.equal(s.doc.pages.length, 4, s.id)
    assert.ok(s.doc.src && s.doc.src.length > 20, 'fontes de ' + s.id)
    assert.ok(s.doc.pages.some((p) => p.h === 'E na LLM?'), 'página “E na LLM?” em ' + s.id)
  }
})

test('datas históricas revisadas', () => {
  const liu = STOPS.find((s) => s.who === 'LIUHUI')!
  assert.equal(liu.year, '263', 'Liu Hui comentou os Nove Capítulos em 263')
  const years = STOPS.map((s) => (s.year.includes('a.C.') ? -parseInt(s.year) : parseInt(s.year)))
  assert.deepEqual(years, [...years].sort((a, b) => a - b), 'ilhas em ordem cronológica')
})

test('cada estação da Fase 2 avisa o que foi simplificado', () => {
  assert.equal(ZONES.length, 8)
  for (const z of ZONES) assert.ok(z.doc.note && z.doc.note.length > 30, 'nota de ' + z.id)
  assert.equal(P2_PIPELINE.length, 8)
})

test('verbetes citados existem e os links do Codex apontam para verbetes reais', () => {
  const ids = [...STOPS.flatMap((s) => [...s.codex, ...(s.extraCodex ? [s.extraCodex] : [])]), ...ZONES.flatMap((z) => z.codex), ...STATIONS.flatMap((s) => s.codex), 'engine', 'metaforas', 'transformer', 'llm_pipeline']
  for (const id of ids) assert.ok(CODEX[id], 'verbete ' + id)
  for (const e of CODEX_LIST) for (const l of e.links || []) assert.ok(CODEX[l], `link ${e.id} → ${l}`)
})

test('frases corrigidas pela revisão científica não voltaram', () => {
  const all = JSON.stringify({ STOPS, CODEX_LIST, ZONES, EXAM, PREFS })
  for (const bad of ['nunca lê letras', 'erra mais', 'só sabe o que estava', 'Pela primeira vez, alguém fez contas', 'decide quais importam', 'Isso vem na Fase 7', 'construí o Perceptron', '200 a.C.'])
    assert.ok(!all.includes(bad), 'ainda aparece: ' + bad)
})

test('prova final e preferências são válidas', () => {
  assert.equal(EXAM.length, 12)
  assert.equal(EXAM_PASS, 8)
  for (const q of EXAM) { assert.ok(q.a >= 0 && q.a < q.o.length, q.q); assert.ok(q.why.length > 10) }
  for (const p of PREFS) assert.ok(p.best === 0 || p.best === 1)
  assert.equal(SENTS.filter((s) => s.wrong).length, 1)
})

test('avaliações do modo piloto são equivalentes (mesmos conceitos, perguntas diferentes)', () => {
  assert.equal(PILOT_PRE.length, PILOT_POS.length)
  PILOT_PRE.forEach((q, i) => {
    assert.equal(q.id, PILOT_POS[i].id)
    assert.notEqual(q.q, PILOT_POS[i].q)
    for (const x of [q, PILOT_POS[i]]) assert.ok(x.a >= 0 && x.a < x.o.length, x.q)
  })
})
