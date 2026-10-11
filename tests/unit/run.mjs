// Roda os testes de unidade: empacota cada *.test.ts com o rolldown (o mesmo do Vite) e executa com `node --test`.
// Uso: npm test   (ou: node tests/unit/run.mjs)
import { rolldown } from 'rolldown'
import { readdirSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const files = readdirSync(here).filter((f) => f.endsWith('.test.ts')).sort()
const out = join(tmpdir(), 'pf-unit-' + process.pid)
const built = []
for (const f of files) {
  const bundle = await rolldown({
    input: join(here, f),
    platform: 'node',
    resolve: { extensions: ['.ts', '.tsx', '.mjs', '.js'] },
    moduleTypes: { '.css': 'empty', '.webp': 'empty', '.png': 'empty' },
    transform: { jsx: 'react-jsx' },
    logLevel: 'warn',
  })
  const file = join(out, f.replace(/\.ts$/, '.mjs'))
  await bundle.write({ file, format: 'esm', codeSplitting: false })
  built.push(file)
}
const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...built], { stdio: 'inherit' })
rmSync(out, { recursive: true, force: true })
process.exit(r.status ?? 1)
