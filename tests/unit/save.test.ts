// Salvamento: progresso ausente, incompleto ou inválido não quebra o jogo.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeProgress } from '../../src/v2/store'

const good = { level: 'p2', flags: { l1_done: 1, p2_prever: 1 }, codex: { token: 1 }, fragments: [], cores: ['MATRIX'], quests: { qx_fichas: 'done' as const }, visited: ['quarto', 'p1'] }

test('save válido passa sem mudanças', () => {
  const r = sanitizeProgress(JSON.parse(JSON.stringify(good)))
  assert.equal(r.fixed, false)
  assert.deepEqual(r.p, good)
})

test('campos com tipo errado são descartados, o resto é aproveitado', () => {
  const r = sanitizeProgress({ level: '../hack', flags: { a: 1, b: 'x', c: null, d: Infinity }, codex: 'oi', cores: ['MATRIX', 3, 'MATRIX'], quests: { q: 'feito', r: 'done' }, visited: 'p1' })
  assert.equal(r.fixed, true)
  assert.equal(r.p.level, 'quarto')
  assert.deepEqual(r.p.flags, { a: 1 })
  assert.deepEqual(r.p.codex, {})
  assert.deepEqual(r.p.cores, ['MATRIX'])
  assert.deepEqual(r.p.quests, { r: 'done' })
  assert.deepEqual(r.p.visited, [])
})

test('save sem formato de objeto vira um começo do zero', () => {
  for (const raw of [null, 42, 'texto', [1, 2]]) {
    const r = sanitizeProgress(raw)
    assert.equal(r.fixed, true)
    assert.equal(r.p.level, 'quarto')
    assert.deepEqual(r.p.flags, {})
  }
})

test('save antigo, sem campos novos, continua válido', () => {
  const r = sanitizeProgress({ level: 'p1', flags: { l1_intro: 1 }, codex: {}, fragments: [], cores: [], quests: {} })
  assert.equal(r.fixed, false)
  assert.deepEqual(r.p.visited, [])
})
