// Capítulos e missões: ir direto para uma missão acerta o progresso de forma coerente.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { useGame, G } from '../../src/v2/store'
import { CHAPTERS, jumpTo, missionDone } from '../../src/v2/levels/chapters'
import { ZONES } from '../../src/v2/levels/p2/zones'
import { STATIONS } from '../../src/v2/levels/p3/lab'

const reset = (flags: Record<string, number> = {}) => useGame.setState({ screen: 'game', loading: null, flags, cores: [], visited: [] })
const ci = (level: string) => CHAPTERS.findIndex((c) => c.level === level)

test('lista de capítulos tem todas as missões', () => {
  assert.deepEqual(CHAPTERS.map((c) => c.level), ['quarto', 'prologo', 'p1', 'p2', 'p3', 'fim'])
  assert.equal(CHAPTERS[ci('p1')].missions.length, 13)
  assert.equal(CHAPTERS[ci('p2')].missions.length, 10)
  assert.equal(CHAPTERS[ci('p3')].missions.length, 8)
})

test('ir para cada missão: as anteriores ficam feitas, a escolhida e as seguintes não', () => {
  for (const level of ['p1', 'p2', 'p3']) {
    const c = ci(level), n = CHAPTERS[c].missions.length
    for (let mi = 0; mi < n; mi++) {
      reset()
      jumpTo(c, mi)
      const f = G().flags
      assert.equal(G().loading, level, `${level}/${mi} carrega a fase`)
      for (let k = 0; k < mi; k++) assert.ok(missionDone(c, k, f), `${level}: missão ${k} feita ao ir para ${mi}`)
      for (let k = mi; k < n; k++) assert.ok(!missionDone(c, k, f), `${level}: missão ${k} não feita ao ir para ${mi}`)
      for (let p = 0; p < c; p++) assert.ok(missionDone(p, CHAPTERS[p].missions.length - 1, f), `fase anterior ${CHAPTERS[p].level} concluída`)
    }
  }
})

test('fases anteriores ganham seus núcleos; fases seguintes ficam como estavam', () => {
  reset({ p3_dados: 1, p3_intro: 1 })
  jumpTo(ci('p2'), 3)
  assert.ok(G().cores.includes('MATRIX'))
  assert.ok(!G().cores.includes('TRANSFORMER'))
  assert.equal(G().flags.p3_dados, 1, 'progresso da Fase 3 preservado')
  assert.equal(G().flags['p2_' + ZONES[1].id], 1)
  assert.ok(!G().flags['p2_' + ZONES[2].id])
})

test('Fase 3: escolhas do laboratório recebem valores padrão coerentes', () => {
  reset()
  jumpTo(ci('p3'), 4) // Sala de Teste
  const f = G().flags
  assert.ok(f.p3_nome >= 1 && f.p3_mem >= 1 && f.p3_ep >= 30)
  assert.equal(f['p3_' + STATIONS[2].id], 1)
  reset()
  jumpTo(ci('p3'), CHAPTERS[ci('p3')].missions.length - 1)
  assert.ok(G().flags.p3_nota >= 8, 'nota padrão passa na prova')
})
