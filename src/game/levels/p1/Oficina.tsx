import { useLevel } from '../../engine/level'
import { SkyDome, Lights, Dust } from '../../world/Atmosphere'
import { Interactable, useFlag } from '../../world/core'
import { Portal } from '../../world/Instruments'
import { RT } from '../../engine/runtime'
import { SFX } from '../../engine/audio'
import { start, type Ctx } from '../../engine/script'
import { G } from '../../store'
import { Hall, IronRail, CORE_Y, HALL, type V3 } from './oficina/Hall'
import { GearWall, Calculator, Conveyor, DecisionMachine, CardMachine, CARRY, TABLE, SLOT_USE, CALC_USE, CARD_USE, CONV_USE, DEC_USE } from './oficina/Puzzles'
import { GrandMachine, GM, GM_POS } from './oficina/GrandMachine'

/* =========================================================
   FASE 1 · ÁREA 5 — A OFICINA DAS MÁQUINAS
   Conceito: automação. Transmissão (engrenagens) → Máquina de Calcular
   (soma automática) → Sala dos Cartões (programa) → Grande Máquina → portal.
   Side quests: Repetição (linha de produção) e Máquina de Decisão.
   ========================================================= */
const SKY = { zenith: '#3b2a5a', mid: '#b4607a', horizon: '#ffb070', below: '#3a2420', sunCol: '#ffd2a0', sun: [0.35, 0.82, 0.3] as V3, stars: 0.2, fog: '#4a2e2a', fogNear: 50, fogFar: 190, hemi: '#e0a080' }
const ENGINE_USE: V3 = [GM_POS[0], CORE_Y, -48]
const PORTAL: V3 = [9, CORE_Y, -50.5]
const PORTAL_USE: V3 = [9, CORE_Y, -48.4]

function Finale() {
  const card = useFlag('a5_card'), done = useFlag('a5_done')
  const run = () => start('engine', async (c) => {
    if (c.flag('a5_done')) return
    c.freeze(true); c.objective(null)
    c.focus([GM_POS[0] + 2.5, CORE_Y + 4.2, -41.2], [GM_POS[0] + 1.8, CORE_Y + 4.0, GM_POS[2]], 54)
    await c.say([
      { who: 'NEX', text: 'Agora a oficina inteira funciona: força nas engrenagens, contas na calculadora e um cartão com instruções.' },
      { who: 'NOVA', text: 'Então dê o cartão à grande máquina.' },
    ])
    GM.card = true; SFX.play('click')
    await c.wait(1.2)
    GM.mode = 'run'; GM.t0 = performance.now(); SFX.play('gear')
    await c.wait(2.6)
    await c.say([
      { who: 'NEX', text: 'Ela não travou desta vez!' },
      { who: 'NOVA', text: 'Porque agora cada parte sabe o que fazer: as engrenagens passam a força, as rodas fazem as contas e o cartão diz a ordem.' },
      { who: 'NOVA', text: 'Charles Babbage sonhou com uma máquina assim há quase 200 anos. Ada Lovelace escreveu programas para ela antes mesmo de ela existir.' },
      { who: 'NEX', text: 'Então já é um computador?' },
      { who: 'NOVA', text: 'Quase. Engrenagens são lentas e enormes. Na próxima sala, o movimento vira eletricidade, e as rodas viram 0 e 1.' },
    ])
    c.discover('hist_maquinas')
    c.setFlag('a5_done')
    c.unfocus(); c.freeze(false)
  })
  return (
    <>
      <Interactable id="engine" label="Dar o cartão à Grande Máquina" position={ENGINE_USE} radius={2.4} enabled={!!card && !done} onUse={run} markerY={3} />
      <Portal position={PORTAL} rotY={0} active={!!done} s={0.8} />
      <Interactable id="portal5" label="Atravessar o portal" position={PORTAL_USE} radius={2.2} enabled={!!done} onUse={() => start('portal5', async (c) => { c.objective(null); c.goto('p1a6') })} markerY={4.6} color="#7fe3ff" />
      {/* guarda-corpo da plataforma (vão da escada no meio) */}
      <IronRail from={[-HALL.x + 0.4, CORE_Y, -40.45]} to={[-3.2, CORE_Y, -40.45]} />
      <IronRail from={[3.2, CORE_Y, -40.45]} to={[HALL.x - 0.4, CORE_Y, -40.45]} />
    </>
  )
}

async function main(c: Ctx) {
  if (!c.flag('a5_intro')) {
    c.freeze(true)
    await c.cinematic([
      { pos: [0, 11, 45], look: [0, 7, -50], dur: 0.01, cut: true },
      { pos: [0, 10, -8], look: [GM_POS[0], 6.5, GM_POS[2]], dur: 6 },
      { pos: [GM_POS[0] + 2.5, CORE_Y + 4.2, -41.2], look: [GM_POS[0] + 1.8, CORE_Y + 4.0, GM_POS[2]], dur: 3 },
    ])
    c.focus([GM_POS[0] + 2.5, CORE_Y + 4.2, -41.2], [GM_POS[0] + 1.8, CORE_Y + 4.0, GM_POS[2]], 54)
    await c.say([
      { who: 'NEX', text: 'Isso é um computador?' },
      { who: 'NOVA', text: 'Não.' },
      { who: 'NEX', text: 'Então o que é?' },
      { who: 'NOVA', text: 'Uma tentativa.' },
    ])
    GM.mode = 'try'; GM.t0 = performance.now(); SFX.play('gear')
    await c.wait(1.6)
    await c.say({ who: 'NOVA', text: 'Antes de existirem computadores rápidos, pessoas tentavam transformar pensamento em regras.' })
    GM.mode = 'jam'; GM.t0 = performance.now(); SFX.play('stone'); SFX.play('error')
    await c.wait(1.4)
    await c.say([
      { who: 'NEX', text: 'E funcionou?' },
      { who: 'NOVA', text: 'Às vezes.' },
      { who: 'NOVA', text: 'Esta é a Oficina das Máquinas. Para a grande máquina funcionar, a oficina inteira precisa voltar a funcionar.' },
      { who: 'NOVA', text: 'Comece pela transmissão: faltam três engrenagens na parede, perto da caldeira.' },
    ])
    c.unfocus(); c.freeze(false)
    c.setFlag('a5_intro')
  }
  while (!c.flag('a5_gears')) {
    c.objective('Pegue uma engrenagem na bancada', [TABLE.x, 0, TABLE.z - 1.3])
    await c.until(() => !!CARRY.k || !!G().flags.a5_gears)
    if (c.flag('a5_gears')) break
    c.objective('Encaixe a engrenagem no eixo do mesmo tamanho', SLOT_USE)
    await c.until(() => !CARRY.k || !!G().flags.a5_gears)
  }
  if (!c.flag('a5_gears_talk')) {
    c.setFlag('a5_gears_talk')
    await c.wait(1.2)
    await c.say([
      { who: 'NEX', text: 'Tudo girando! E o portão subiu sozinho.' },
      { who: 'NOVA', text: 'Uma engrenagem empurra a próxima. Ninguém precisa empurrar cada peça: a máquina passa o movimento adiante.' },
    ])
  }
  if (!c.flag('a5_soma')) { c.objective('Use a Máquina de Calcular', CALC_USE); await c.waitFlag('a5_soma') }
  if (!c.flag('a5_card')) { c.objective('Programe o braço mecânico com o cartão perfurado', CARD_USE); await c.waitFlag('a5_card') }
  if (!c.flag('a5_done')) { c.objective('Leve o cartão à Grande Máquina', ENGINE_USE); await c.waitFlag('a5_done') }
  c.objective('Atravesse o portal para a Sala da Computação', PORTAL_USE)
}
function hint(id: string, pos: V3, r: number, lines: { who: string; text: string }[], quest?: [string, string], need?: string) {
  return async (c: Ctx) => {
    if (c.flag('a5_h_' + id)) return
    await c.waitFlag(need || 'a5_intro')
    await c.reach(pos, r)
    c.setFlag('a5_h_' + id)
    if (quest) c.quest(quest[0], 'active', quest[1])
    await c.say(lines as any, { ambient: true })
  }
}
const hints = [
  hint('conv', CONV_USE, 5, [{ who: 'NOVA', text: 'Uma linha de produção parada. Cada caixa precisa de um carimbo.' }], ['q_repeticao', 'Repetição'], 'a5_gears'),
  hint('dec', DEC_USE, 5, [{ who: 'NOVA', text: 'ENTRADA, REGRA, SAÍDA. Uma máquina que decide sozinha. Vale testar.' }], ['q_decisao', 'A Máquina de Decisão'], 'a5_gears'),
  hint('cards', [5, 0, -23], 4, [{ who: 'NEX', text: 'Que barulho é esse? Parece um tear.' }, { who: 'NOVA', text: 'É um tear de Jacquard. Ele tecia desenhos lendo furos em cartões. Foi uma das primeiras máquinas programáveis.' }], undefined, 'a5_soma'),
]

export default function Oficina() {
  const f = G().flags
  GM.mode = f.a5_done ? 'run' : 'idle'
  GM.card = !!f.a5_done
  const spawn: V3 = f.a5_card ? [0, 0.1, -34] : f.a5_soma ? [5, 0.1, -23] : f.a5_gears ? [0, 0.1, 10] : [0, 0.1, 42]
  useLevel({ spawn, yaw: Math.PI, scripts: [main, ...hints], minY: -6 })
  void RT
  return (
    <>
      <SkyDome preset="dusk" custom={SKY} />
      <Lights preset="dusk" custom={SKY} sunI={1.7} hemiI={0.75} envI={0.55} />
      <Dust count={90} scale={[34, 12, 100]} position={[0, 5, -5]} color="#ffcf8a" />
      <Hall />
      <GearWall />
      <Calculator />
      <Conveyor />
      <DecisionMachine />
      <CardMachine />
      <GrandMachine />
      <Finale />
    </>
  )
}
