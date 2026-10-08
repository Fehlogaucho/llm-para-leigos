import { Pix, hex } from '../../engine/pix'
import { box, memo, spr, signPix, OUT } from '../../art/core'
import { skyBg } from '../../art/sky'
import { addInteract, RT, type Scene, type Thing } from '../../engine/runtime'
import { SFX } from '../../engine/audio'
import { G, useGame } from '../../store'
import type { Ctx } from '../../engine/script'

/* =========================================================
   FASE 2 (em breve): uma ilha com vista para a Cidade das
   Representações, ainda em construção.
   ========================================================= */
const C: [number, number] = [7, 7]
const sign = () => memo('eb:sign', () => {
  const s = signPix([{ t: 'FASE 2', c: '#ffd27a' }, { t: 'EM BREVE', c: '#bff3ff' }], '#2a1e3a', '#e8b65a', 4)
  const p = new Pix(s.w + 2, s.h + 18)
  p.rect(Math.floor(s.w / 2) - 1, s.h, 3, 17, hex('#5a3a24'))
  p.blit(s, 1, 0)
  p.outline(hex(OUT))
  return spr(p, Math.floor(s.w / 2) + 1, s.h + 17)
})

async function main(c: Ctx) {
  RT.novaOn = true
  await c.wait(0.6)
  await c.say([
    { who: 'NOVA', text: 'Parabéns! Você terminou a Fase 1 e devolveu o MATRIX CORE à Language Engine.' },
    { who: 'NEX', text: 'Olha lá longe: uma cidade inteira feita de números!' },
    { who: 'NOVA', text: 'A Cidade das Representações. É lá que as palavras viram números. Ela ainda está sendo construída.' },
    { who: 'NOVA', text: 'Enquanto isso, use o mapa para voltar à Linha do Tempo e terminar os documentos extras que faltaram.' },
  ])
  c.objective('Fase 2 em breve. Use o mapa para revisitar as áreas', [C[0] + 1, C[1] - 1])
}

export default function build(): Scene {
  const things: Thing[] = []
  things.push({ x: C[0] + 1.5, y: C[1] - 2, sprite: sign(), shadow: 6 })
  things.push({ x: C[0] - 2, y: C[1] - 3, w: 1, d: 1, solid: true, sprite: box(1, 1, 10, '#6a6a8a') })
  addInteract({ id: 'mapa2', x: C[0] + 1, y: C[1] - 1, r: 1.6, label: 'Abrir o mapa das áreas', enabled: () => true, use: () => { SFX.play('open'); useGame.setState({ menu: 'map' }) }, mz: 40 })
  const ground = (x: number, y: number) => {
    const d = Math.hypot((x + 0.5 - C[0]) / 5.5, (y + 0.5 - C[1]) / 5)
    if (d > 1) return null
    return d < 0.35 ? { s: 'stone', a: '#8a84a8' } : { s: 'grass', a: '#4a9a5a', b: '#3a7a4a' }
  }
  return {
    w: 14, h: 14, ground, things,
    cliff: { a: '#5a4a7a', b: '#3e3260', depth: 34 },
    spawn: { pos: [C[0], C[1] + 2], dir: [-1, -1] },
    bg: skyBg({ top: '#0a0c2a', mid: '#2c2a6e', bottom: '#9a72c0', stars: 110, islands: 4, cloud: '#6a5aa8', seed: 21, city: true }),
    scripts: [main],
    novaZ: 9,
    init: () => { RT.novaOn = true; if (!G().flags.nova) G().setFlag('nova') },
  }
}
