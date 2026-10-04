import { useLevel } from '../../engine/level'
import { SkyDome, Lights, Dust } from '../../world/Atmosphere'
import { Interactable, useFlag } from '../../world/core'
import { Portal } from '../../world/Instruments'
import { SFX } from '../../engine/audio'
import { RT } from '../../engine/runtime'
import { start, type Ctx } from '../../engine/script'
import { G } from '../../store'
import { Chamber, type V3 } from './matriz/Chamber'
import { BuildMatrix, MapBridge, ImageMatrix, VectorLab, CityMatrix, BUILD_USE, MAP_USE, IMG_USE, VEC_USE, CITY_USE, FX7 } from './matriz/Puzzles'

/* =========================================================
   FASE 1 · ÁREA 7 — A CÂMARA DA MATRIZ (fim da Fase 1)
   Construa a matriz → a matriz vira mapa (ponte sobre o abismo)
   → conserte a matriz quebrada → ela vira uma cidade → MATRIX CORE → portal.
   Side quests: Matriz como Imagem (oeste) e Matriz × Vetor (leste).
   ========================================================= */
const SKY = { zenith: '#070a26', mid: '#241a5a', horizon: '#5a3a9a', below: '#120c30', sunCol: '#b8a8ff', sun: [0.3, 0.75, 0.4] as V3, stars: 1.6, fog: '#1a1440', fogNear: 50, fogFar: 180, hemi: '#8a7ad0' }
const PORTAL: V3 = [0, 0.6, -22.4]
const PORTAL_USE: V3 = [0, 0.6, -20.4]

function Finale() {
  const city = useFlag('a7_city'), done = useFlag('a7_done')
  return (
    <>
      <Portal position={[PORTAL[0], 0, PORTAL[2]]} rotY={0} active={!!done} s={0.75} color="#b48cff" />
      <Interactable id="portal7" label="Atravessar para a Fase 2" position={[PORTAL_USE[0], 0, PORTAL_USE[2]]} radius={2} enabled={!!done && !!city} onUse={() => start('portal7', async (c) => { c.objective(null); c.goto('p2a1') })} markerY={4.4} color="#c8a8ff" />
    </>
  )
}

async function cityFinale(c: Ctx) {
  await c.waitFlag('a7_city')
  if (c.flag('a7_done')) return
  c.freeze(true); c.objective(null)
  FX7.city = 1; FX7.t0 = performance.now()
  SFX.play('whoosh')
  await c.cinematic([
    { pos: [3.4, 3.4, -13.2], look: [0, 2.2, -19.5], dur: 0.01, cut: true },
    { pos: [-3.6, 6.8, -12.6], look: [0, 1.6, -19.5], dur: 4 },
  ], false)
  c.focus([-3.6, 6.8, -12.6], [0, 1.6, -19.5], 48)
  SFX.play('chime')
  await c.say([
    { who: 'NEX', text: 'Os números viraram prédios! Cada número é a altura de um.' },
    { who: 'NEX', text: 'Então a matriz não é só uma tabela.' },
    { who: 'NOVA', text: 'Não.' },
    { who: 'NEX', text: 'Ela pode representar alguma coisa.' },
    { who: 'NOVA', text: 'E transformar essa representação.' },
  ])
  await c.wait(1.2)
  c.core('MATRIX', 'MATRIX CORE')
  await c.wait(1.6)
  await c.say([
    { who: 'ENGINE', text: 'Matriz… eu me lembro. Números em linhas e colunas. É assim que eu guardo o mundo.' },
    { who: 'NOVA', text: 'A Language Engine recuperou o primeiro núcleo! Você terminou a Fase 1: As Origens.' },
    { who: 'NOVA', text: 'Observar, contar, criar regras, lidar com a incerteza, automatizar, transformar tudo em números… e organizar esses números em matrizes.' },
    { who: 'NEX', text: 'E agora? Ainda estou pequeno e preso aqui dentro.' },
    { who: 'NOVA', text: 'Agora a máquina vai lembrar como lida com palavras. Do outro lado do portal, as linhas viram ruas e as colunas viram prédios: a Cidade das Representações.' },
  ])
  c.setFlag('a7_done')
  c.unfocus(); c.freeze(false)
  c.objective('Atravesse o portal para a Fase 2', PORTAL_USE)
}

async function main(c: Ctx) {
  if (!c.flag('a7_intro')) {
    await c.cinematic([
      { pos: [0, 22, 30], look: [0, 4, -6], dur: 0.01, cut: true },
      { pos: [14, 12, 14], look: [0, 4, 4], dur: 5 },
      { pos: [0, 3, 24], look: [0, 3.6, 8], dur: 3 },
    ])
    await c.say([
      { who: 'NEX', text: 'Que lugar enorme… metade templo, metade laboratório.' },
      { who: 'NOVA', text: 'A Câmara da Matriz. Tudo o que você aprendeu na Fase 1 termina aqui.' },
      { who: 'NOVA', text: 'Números, regras, bits… tudo vai ser organizado do jeito que as máquinas gostam: em linhas e colunas.' },
      { who: 'NOVA', text: 'Comece pela matriz flutuante, no centro.' },
    ])
    c.setFlag('a7_intro')
  }
  if (!c.flag('a7_construa')) { c.objective('Construa a matriz no centro da câmara', BUILD_USE); await c.waitFlag('a7_construa') }
  if (G().quests.q_mmapa !== 'done') { c.objective('Programe a ponte sobre o abismo', MAP_USE); await c.until(() => G().quests.q_mmapa === 'done') }
  if (!c.flag('a7_city')) {
    c.objective('Atravesse a ponte até o altar', CITY_USE)
    await c.until(() => (Math.abs(RT.player.z - CITY_USE[2]) < 3 && Math.abs(RT.player.x) < 5) || !!G().flags.a7_city)
    c.objective('Conserte a matriz quebrada', CITY_USE)
    await c.waitFlag('a7_city')
  }
  if (c.flag('a7_done')) c.objective('Atravesse o portal para a Fase 2', PORTAL_USE)
}

function hint(id: string, pos: V3, r: number, lines: { who: string; text: string }[], quest?: [string, string]) {
  return async (c: Ctx) => {
    if (c.flag('a7_h_' + id)) return
    await c.waitFlag('a7_intro')
    await c.reach(pos, r)
    c.setFlag('a7_h_' + id)
    if (quest) c.quest(quest[0], 'active', quest[1])
    await c.say(lines as any, { ambient: true })
  }
}
const hints = [
  hint('img', IMG_USE, 5, [{ who: 'NOVA', text: 'Uma tela feita de números: cada número vira uma cor. O desenho está estragado.' }], ['q_mimagem', 'Matriz como Imagem']),
  hint('vec', VEC_USE, 5, [{ who: 'NOVA', text: 'Uma bolinha num tabuleiro e uma estrela. Dá para mover a bolinha só com multiplicação.' }], ['q_mvetor', 'Matriz × Vetor']),
]

export default function Matriz() {
  const f = G().flags
  FX7.city = f.a7_city ? 1 : 0
  if (f.a7_city) FX7.t0 = performance.now() - 5000
  const spawn: V3 = f.a7_city || G().quests.q_mmapa === 'done' ? [0, 0.1, -16.6] : f.a7_construa ? [0, 0.1, 2] : [0, 0.1, 20]
  useLevel({ spawn, yaw: Math.PI, scripts: [main, cityFinale, ...hints], minY: -7 })
  return (
    <>
      <SkyDome preset="night" custom={SKY} />
      <Lights preset="night" custom={SKY} sunI={1.1} hemiI={1.0} envI={0.6} />
      <Dust count={80} scale={[44, 14, 44]} position={[0, 6, 0]} color="#c8b8ff" />
      <Chamber />
      <BuildMatrix />
      <MapBridge />
      <ImageMatrix />
      <VectorLab />
      <CityMatrix />
      <Finale />
    </>
  )
}
