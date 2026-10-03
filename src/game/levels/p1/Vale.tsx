import { useLevel } from '../../engine/level'
import { SkyDome, Lights, CloudPuffs, FloatingIslands, Dust } from '../../world/Atmosphere'
import { useFlag } from '../../world/core'
import { type Ctx } from '../../engine/script'
import { G, useGame } from '../../store'
import { P, type V3 } from './vale/terrain'
import { ValeMap, caveDoor } from './vale/Map'
import { FieldObjects, FieldLabels, SYMS } from './vale/Field'
import {
  GoldCrystals, Altar, PlazaTotems, Quarry, GroupMachine, CarriedChest, RuinsTotem, BinaryDoor, ExitPortal,
  crystalCount, nearestCrystal, ALTAR_USE, QUARRY_USE, MACHINE_USE, CHEST_USE, TOTEM2_USE, DOOR_USE, PORTAL_USE,
} from './vale/MainQuest'
import { HiddenNumber, CaveSystems, Vault } from './vale/SideQuests'

/* =========================================================
   FASE 1 · ÁREA 2 — O VALE DOS NÚMEROS
   Conceito: representar quantidade.
   quantidade (12 cristais) → símbolo (“12”) → agrupamento
   (10 → 100 → 1000) → binário (só 0 e 1).
   ========================================================= */

const SKY = { zenith: '#3a78cc', mid: '#86bce8', horizon: '#f6e6c6', below: '#cfd8c8', sunCol: '#fff1d2', sun: [0.42, 0.62, 0.66] as [number, number, number], stars: 0, fog: '#d3e2e6', fogNear: 95, fogFar: 440, hemi: '#bfd8f0' }

/* =================== roteiro principal =================== */
async function main(c: Ctx) {
  // retomada: se o jogo fechou no meio de uma cena, conclui o que faltou
  if (c.flag('a2_count') && G().quests.q_quant !== 'done') { c.discover('quantidade'); c.quest('q_quant', 'done') }
  if (c.flag('a2_chest') && G().quests.q_mil !== 'done') { c.discover('agrupamento'); c.quest('q_mil', 'done') }
  if (c.flag('a2_door') && !G().codex.binario) c.discover('binario')

  if (!c.flag('a2_intro')) {
    await c.cinematic([
      { pos: [0, 30, 69], look: [0, 0, 4], dur: 0.01, cut: true },
      { pos: [28, 21, 40], look: [0, 2, -24], dur: 5.5 },
      { pos: [-24, 12, 50], look: [0, 2, 22], dur: 4.2 },
      { pos: [2.2, 2.2, 54.8], look: [0, 1.3, 60], dur: 3 },
    ])
    await c.say([
      { who: 'NEX', text: 'Uau! Tem pedra, cristal, fruta e tocha para todo lado.' },
      { who: 'NOVA', text: 'Bem-vindo ao Vale dos Números. Antes de existirem algarismos, as pessoas contavam com coisas: pedras, gravetos, cristais.' },
      { who: 'NEX', text: 'No Observatório você disse que a gente precisava aprender a lidar com muitos números.' },
      {
        who: 'NOVA', text: 'E aqui tem muitos. Repare: as coisas estão em montinhos. Cada montinho é uma quantidade.', choices: [
          { label: 'E cadê os números?', next: [{ who: 'NOVA', text: 'Sumiram. Os totens do vale estão apagados. Vamos devolver os números a eles.' }] },
          { label: 'Por onde começo?', next: [] },
        ],
      },
      { who: 'NOVA', text: 'Siga a trilha até a Praça dos Números. Tem um altar esperando no centro.' },
    ])
    c.setFlag('a2_intro')
  }

  // 1. quantidade → símbolo
  if (!c.flag('a2_count')) {
    if (!c.flag('a2_ask')) { c.objective('Examine o altar no centro da Praça dos Números', ALTAR_USE); await c.waitFlag('a2_ask') }
    let n = crystalCount()
    c.objective(`Colete cristais dourados no campo (${n}/12)`, nearestCrystal())
    while (crystalCount() < 12) {
      const t = performance.now()
      await c.until(() => crystalCount() !== n || performance.now() - t > 1500)
      const now = crystalCount()
      if (now >= 12) break
      if (now !== n) { n = now; c.objective(`Colete cristais dourados no campo (${n}/12)`, nearestCrystal()) }
      else useGame.setState({ objective: { text: `Colete cristais dourados no campo (${n}/12)`, target: nearestCrystal() } })
    }
    c.objective('Leve os 12 cristais ao altar da praça', ALTAR_USE)
    await c.waitFlag('a2_count')
  }
  await c.until(() => G().quests.q_quant === 'done')

  // 2. agrupamento: mil pedras
  if (!c.flag('a2_chest')) {
    if (!c.flag('a2_try')) {
      if (!c.flag('a2_ruins')) {
        c.objective('Atravesse a ponte e vá até as Ruínas', [0, 0.15, -21])
        await c.reach([0, 0.15, -24], 6)
        await c.say([
          { who: 'NEX', text: 'Mais um totem apagado. Esse tem um pedestal vazio na frente.' },
          { who: 'NOVA', text: 'A inscrição pede: “Traga mil pedras”. E olha ali: uma pedreira inteira.' },
          { who: 'NEX', text: 'Mil? Fácil. É só ir carregando.' },
        ])
        c.setFlag('a2_ruins')
        c.quest('q_mil', 'active', 'Mil é Diferente de Dez')
      }
      c.objective('Leve 1000 pedras ao totem: comece pela pedreira', QUARRY_USE)
      await c.waitFlag('a2_try')
    }
    if (!c.flag('a2_group')) { c.objective('Use a Máquina de Agrupar, no fundo das ruínas', MACHINE_USE); await c.waitFlag('a2_group') }
    if (!c.flag('a2_carry')) { c.objective('Pegue o baú de 1000 pedras', CHEST_USE); await c.waitFlag('a2_carry') }
    c.objective('Leve o baú até o pedestal do totem', TOTEM2_USE)
    await c.waitFlag('a2_chest')
  }
  await c.until(() => G().quests.q_mil === 'done')

  // 3. binário: a porta da Câmara
  if (!c.flag('a2_door')) {
    c.objective('Abra a porta da Câmara Binária, ao norte', DOOR_USE)
    if (!c.flag('a2_door_talk')) {
      await c.say([
        { who: 'NEX', text: 'Grupos de dez, de cem, de mil… sempre de dez em dez. Por quê?' },
        { who: 'NOVA', text: 'Provavelmente porque temos dez dedos. Mas não é o único jeito de agrupar.' },
        { who: 'NOVA', text: 'Ao norte fica a Câmara Binária. Dizem que lá dentro só existem dois símbolos.' },
      ], { ambient: true })
      c.setFlag('a2_door_talk')
    }
    await c.waitFlag('a2_door')
  }
  await c.until(() => !!G().codex.binario)

  // 4. dentro da câmara: o portal acorda
  if (!c.flag('a2_done')) {
    c.objective('Entre na Câmara Binária', [0, 0.15, -60])
    await c.reach([0, 0.15, -61], 4.5)
    c.objective(null)
    c.freeze(true)
    c.setFlag('a2_done')
    await c.cinematic([
      { pos: [4, 2.6, -58.5], look: [0, 2.9, -68], dur: 0.01, cut: true },
      { pos: [0.5, 2.3, -61.6], look: [0, 2.9, -68], dur: 3.4, fov: 54 },
    ], false)
    const pend = ['q_escondido', 'q_sistemas', 'q_binario'].filter((q) => G().quests[q] !== 'done').length
    await c.say([
      { who: 'NOVA', text: 'Olha o caminho que você fez: quantidade, símbolo, grupos… e agora só 0 e 1.' },
      { who: 'NEX', text: 'Doze cristais viraram 12. Mil pedras viraram 1000. E o 12 virou 1100.' },
      { who: 'NOVA', text: 'É assim que uma máquina guarda o mundo: tudo vira número, e todo número pode virar 0 e 1.' },
      { who: 'NEX', text: 'E o que uma máquina faz com tantos números?' },
      { who: 'NOVA', text: 'Segue regras. No Jardim da Lógica, os números vão aprender a decidir. O portal acordou.' },
      ...(pend ? [{ who: 'NOVA', text: 'Se quiser, ainda dá para explorar: o cofre aqui ao lado, a caverna e o templo guardam segredos.' }] : []),
    ])
    c.freeze(false)
  }
  c.objective('Atravesse o portal para o Jardim da Lógica', PORTAL_USE)
}

/* =================== dicas da NOVA por proximidade =================== */
function hint(id: string, pos: V3, r: number, lines: { who: string; text: string }[], opts: { quest?: [string, string]; need?: string } = {}) {
  return async (c: Ctx) => {
    if (c.flag('a2_h_' + id)) return
    await c.waitFlag('a2_intro')
    if (opts.need) await c.waitFlag(opts.need)
    await c.reach(pos, r)
    c.setFlag('a2_h_' + id)
    if (opts.quest) c.quest(opts.quest[0], 'active', opts.quest[1])
    await c.say(lines as any, { ambient: true })
  }
}
const door = caveDoor()
const hints = [
  hint('field', [0, 0, 19], 6, [{ who: 'NOVA', text: 'Três pedras aqui, sete frutas ali, dez tochas acolá… cada montinho do campo é uma quantidade.' }]),
  hint('river', [0, 0, 3], 4.5, [{ who: 'NOVA', text: 'O rio corta o vale ao meio. A ponte leva às ruínas, do outro lado.' }]),
  hint('cave', [door[0] + 3, 0, door[2] + 2], 6, [{ who: 'NOVA', text: 'Uma caverna com uma luz violeta lá dentro. Tem alguma coisa estranha aqui.' }], { quest: ['q_sistemas', 'Sistemas Numéricos'] }),
  hint('temple', [30, 0, -40], 6, [{ who: 'NOVA', text: 'Um templo com a porta trancada. Na porta, só um disco com números de 1 a 12.' }], { quest: ['q_escondido', 'O Número Escondido'] }),
  hint('tally', SYMS.tally, 6, [{ who: 'NOVA', text: 'Tem alguma coisa estranha nessa pedra perto do rio: riscos feitos de propósito.' }]),
  hint('roman', [SYMS.roman[0], 0.15, SYMS.roman[2] + 2.5], 4, [{ who: 'NOVA', text: 'Uma placa de mármore na parede, com letras… ou serão números?' }]),
  hint('maya', SYMS.maya, 6, [{ who: 'NOVA', text: 'Uma estela antiga, com pontos e uma barra. Tem alguma coisa estranha aqui.' }]),
  hint('baby', SYMS.baby, 7, [{ who: 'NOVA', text: 'Uma plaquinha de barro encostada na pedra, no meio do pomar. Parece uma conta.' }]),
  hint('vault', [-8.6, 0.15, -64], 3.6, [
    { who: 'NOVA', text: 'Tem alguma coisa estranha aqui: uma porta redonda e quatro lajes no chão, com 8, 4, 2 e 1.' },
    { who: 'NOVA', text: 'Pise numa laje para acendê-la. Conte as esferas da porta e faça as lajes acesas somarem o mesmo.' },
  ], { quest: ['q_binario', 'O Mundo Binário'], need: 'a2_door' }),
]

export default function Vale() {
  useLevel({ spawn: P.spawn, yaw: Math.PI, scripts: [main, ...hints], minY: -1.4 })
  const counted = useFlag('a2_count')
  return (
    <>
      <SkyDome preset="day" custom={SKY} />
      <Lights preset="day" custom={SKY} sunI={2.6} hemiI={1.05} />
      <CloudPuffs n={24} y={[22, 70]} r={[130, 280]} tint="#ffffff" seed={7} />
      <FloatingIslands n={14} seed={9} rMin={140} rMax={290} yMin={30} yMax={90} />
      <Dust count={110} scale={[120, 10, 140]} position={[0, 4, 0]} color="#fff2c0" />
      <ValeMap />
      <FieldObjects />
      <FieldLabels on={!!counted} />
      <GoldCrystals />
      <Altar />
      <PlazaTotems />
      <Quarry />
      <GroupMachine />
      <CarriedChest />
      <RuinsTotem />
      <BinaryDoor />
      <ExitPortal />
      <HiddenNumber />
      <CaveSystems />
      <Vault />
    </>
  )
}
