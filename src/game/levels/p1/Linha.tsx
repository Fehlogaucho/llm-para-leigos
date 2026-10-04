import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { useLevel } from '../../engine/level'
import { SkyDome, Lights, Dust, FloatingIslands, CloudSea } from '../../world/Atmosphere'
import { Interactable, Solid, useFlag } from '../../world/core'
import { useOverlay } from '../../world/puzzle'
import { MAT } from '../../world/materials'
import { RT, gesture } from '../../engine/runtime'
import { SFX } from '../../engine/audio'
import { start, type Ctx } from '../../engine/script'
import { G, useGame } from '../../store'
import { STOPS, PEOPLE } from './linha/stops'
import { holo } from './linha/people'
import { openDoc, openAsk, openGame, openPipeline, MemoryStrip, memFlag, readExtra, readAgain, extraQuest, OV } from './linha/Doc'
import { LinhaWorld, Console, STOP_Z, SIDE, HOLO_P, USE_P, STAND_P, EXTRA_P, CORE, CORE_USE, PORTAL_USE, VILLAGE, type V3 } from './linha/World'
import { graosTalk, graosHint, graosMesa, BIG } from './linha/Graos'

/* =========================================================
   FASE 1 · AS ORIGENS — A LINHA DO TEMPO DA MEMÓRIA
   Um só caminho. Em cada marco, o eco de um inventor conta sua
   ideia, deixa um documento ilustrado e uma brincadeira. Cada
   ideia entendida devolve uma palavra à Language Engine.
   No fim: a Engine junta tudo e escreve “O céu é azul”.
   ========================================================= */
const SKY = { zenith: '#0a0c2a', mid: '#2c2a6e', horizon: '#9a72c0', below: '#1a1440', sunCol: '#ffd2a0', sun: [0.45, 0.32, -0.83] as V3, stars: 1.5, fog: '#2c2660', fogNear: 45, fogFar: 175, hemi: '#b0a8e8' }

const done = (i: number) => !!G().flags[memFlag(STOPS[i].id)]
const nextIndex = () => STOPS.findIndex((_, i) => !done(i))
const DOC_LINE = [
  'Preparei um documento para você. Leia com calma: tem desenhos!',
  'Está tudo anotado aqui. Leia comigo.',
  'Escrevi umas páginas sobre isso. Dê uma olhada.',
]

/* ---------- uma parada ---------- */
async function runStop(c: Ctx, i: number) {
  const s = STOPS[i], sd = SIDE(i), z = STOP_Z(i)
  const h = holo(s.id)
  c.objective(null); c.freeze(true)
  const st = STAND_P(i)
  RT.player.set(st[0], st[1], st[2]); RT.playerVel.set(0, 0, 0); RT.lastSafe.copy(RT.player)
  RT.lookAt = new THREE.Vector3(HOLO_P(i)[0], 1.9, z)
  RT.novaPos = new THREE.Vector3(sd * 3.9, 2.25, z - 1.3)
  // tela em pé (celular): plano lateral com os dois lado a lado; deitada: por cima do ombro
  if (innerWidth / innerHeight < 0.8) c.focus([sd * 5.9, 2.8, z + 9.6], [sd * 5.95, 1.3, z - 0.3], 50)
  else c.focus([sd * 2.7, 2.05, z + 3.3], [sd * 6.0, 1.5, z - 0.3], 50)
  try {
    SFX.play('whoosh')
    await c.wait(0.5)
    h.live = true; h.want = 1
    SFX.play('chime')
    await c.wait(1.3)
    await c.say(s.intro.map((t) => ({ who: s.who, text: t })))
    await c.say({ who: 'NEX', text: s.nex })
    await c.say({ who: s.who, text: DOC_LINE[i % DOC_LINE.length] })
    await openDoc(c, s.doc)
    if (s.game) { await c.say({ who: s.who, text: s.play || 'Agora é com você!' }); await openGame(c, s.game, s.who) }
    else if (s.ask) { await c.say({ who: s.who, text: 'Antes de eu ir, me responda uma coisa.' }); await openAsk(c, s.ask, s.who) }
    await c.say({ who: s.who, text: s.bye })
    h.live = false
    await recover(c, i)
  } finally {
    h.live = false
    RT.lookAt = null; RT.novaPos = null
    c.unfocus(); c.freeze(false)
    RT.camYaw = 0
  }
}

/** A Engine recupera a palavra da parada i. */
async function recover(c: Ctx, i: number) {
  const s = STOPS[i], P = PEOPLE[s.who]
  c.setFlag(memFlag(s.id))
  G().pushBanner({ kind: 'memory', title: s.word, sub: `${s.year} · ${P.name}` })
  SFX.play('core'); gesture('cheer', 1.8)
  await c.wait(1.4)
  await c.say({ who: 'ENGINE', text: s.engine })
  for (const id of s.codex) c.discover(id)
  if (s.extra) c.quest(extraQuest(s.id), 'active', s.extra.title)
}

/* ---------- abertura ---------- */
const ARRIVE = { t0: 0 }
async function intro(c: Ctx) {
  c.freeze(true)
  await c.cinematic([
    { pos: [9, 15, 24], look: [0, 0, -34], dur: 0.01, cut: true },
    { pos: [-3, 7, 3], look: [0, 1, -40], dur: 4.5 },
    { pos: [3.2, 2.4, 3.6], look: [0, 1.1, 9], dur: 2.4 },
  ])
  ARRIVE.t0 = performance.now(); SFX.play('portal')
  c.focus([3.2, 2.3, 4.2], [0, 1.1, 9], 50)
  await c.wait(1.4)
  RT.lookAt = new THREE.Vector3(0, 1, -30)
  await c.say([
    { who: 'NEX', text: 'Ai! De novo esse portal… Onde eu estou agora?' },
    { who: 'NOVA', text: 'Na parte mais antiga da memória da Language Engine. Olhe: uma trilha comprida, coberta de névoa.' },
    { who: 'ENGINE', text: 'Q-quem… está aí? Eu tenho tantas perguntas… e não lembro… das respostas.' },
    { who: 'NEX', text: 'É a IA do meu computador! A voz dela está toda falhando.' },
    { who: 'NOVA', text: 'O choque apagou as lembranças mais antigas dela: as ideias que vieram antes de qualquer computador.' },
    { who: 'NOVA', text: 'Esta trilha é uma linha do tempo. Cada marco guarda uma ideia que alguém inventou, às vezes há milhares de anos.' },
    { who: 'NOVA', text: 'Juntas, essas ideias são a matemática que faz uma LLM funcionar. Sem elas, a Engine não consegue pensar direito.' },
    { who: 'NEX', text: 'E como a gente devolve essas ideias para ela?' },
    { who: 'NOVA', text: 'Em cada marco, toque no console. O eco de quem teve a ideia vai aparecer, contar a história e deixar um documento para você ler.' },
    { who: 'NOVA', text: 'Cada ideia que você entender vira uma palavra que a Engine volta a lembrar. E a névoa abre o caminho até o próximo marco.' },
    {
      who: 'NOVA', text: 'Alguma pergunta antes de começar?', choices: [
        { label: 'Quem vai aparecer?', next: [{ who: 'NOVA', text: 'Escribas, matemáticos, uma condessa programadora… Gente de verdade, de lugares e séculos diferentes.' }] },
        { label: 'E se eu não entender?', next: [{ who: 'NOVA', text: 'Os documentos têm desenhos e exemplos. E dá para reler tudo quando quiser: é só tocar na faixa da memória, lá em cima.' }] },
        { label: 'Vamos lá!', next: [{ who: 'NOVA', text: 'Esse é o espírito!' }] },
      ],
    },
    { who: 'NOVA', text: STOPS[0].tease },
  ])
  RT.lookAt = null
  c.setFlag('l1_intro')
  c.unfocus(); c.freeze(false)
  RT.camYaw = 0
}

/** O NEX chega pelo portal (some e aparece com um brilho, como no prólogo). */
function Arrival() {
  const [on, setOn] = useState(false)
  const light = useRef<THREE.PointLight>(null!)
  useEffect(() => { if (!G().flags.l1_intro) RT.nexScale = 0 }, [])
  useFrame(() => {
    if (!ARRIVE.t0) return
    const k = (performance.now() - ARRIVE.t0) / 1000
    const e = Math.min(1, k / 0.7)
    RT.nexScale = k < 0.7 ? Math.max(0.01, 1 + 2.2 * Math.pow(e - 1, 3) + 1.2 * Math.pow(e - 1, 2)) : 1
    if (light.current) light.current.intensity = Math.max(0, 1 - k / 1.2) * 30
    const want = k < 1.4
    if (want !== on) setOn(want)
    if (k > 2) ARRIVE.t0 = 0
  })
  return (
    <group position={[0, 0, 9]}>
      <pointLight ref={light} position={[0, 1.5, 0.5]} color="#9fe9ff" intensity={0} distance={10} decay={1.5} />
      {on && <Sparkles count={60} scale={[2, 3, 2]} position={[0, 1.2, 0]} size={5} speed={2.5} color="#bff3ff" />}
    </group>
  )
}

/* ---------- final ---------- */
async function finale(c: Ctx) {
  c.freeze(true); c.objective(null)
  await c.cinematic([
    { pos: [7, 2.6, CORE[2] + 13], look: [0, 3.6, CORE[2]], dur: 0.01, cut: true },
    { pos: [-6, 6.5, CORE[2] + 10], look: [0, 4, CORE[2]], dur: 4 },
  ], false)
  c.setFlag('l1_final')
  SFX.play('core'); gesture('cheer', 2)
  c.focus([0, 3.3, CORE[2] + 10.5], [0, 3.7, CORE[2]], 50)
  await c.wait(1.2)
  await c.say([
    { who: 'ENGINE', text: 'Onze memórias… voltando todas juntas. Esperem…' },
    { who: 'ENGINE', text: 'Eu me lembro! Eu leio fichas e transformo tudo em números, em zeros e uns.' },
    { who: 'ENGINE', text: 'Guardo o que aprendi em matrizes de pesos, ajustados para errar cada vez menos.' },
    { who: 'ENGINE', text: 'Multiplico matrizes, passo a passo, e escolho a próxima palavra pelas chances.' },
    { who: 'NEX', text: 'Ela falou sem engasgar nenhuma vez!' },
    { who: 'NOVA', text: 'Vamos testar. NEX, comece uma frase para ela completar.' },
    { who: 'NOVA', text: 'Diga o começo:', choices: [{ label: 'O céu é…' }] },
    { who: 'ENGINE', text: 'Vou mostrar o que acontece dentro de mim, passo a passo.' },
  ])
  await openPipeline(c)
  await c.say([
    { who: 'ENGINE', text: '“O céu é azul.” Uma palavra de cada vez. Eu lembro como eu escrevo!' },
    { who: 'NEX', text: 'Então é isso? Fichas, números, matrizes, pesos e chances?' },
    { who: 'NOVA', text: 'Essa é a matemática por trás de toda LLM. Ninguém inventou tudo de uma vez: foram milhares de anos de ideias, uma em cima da outra.' },
  ])
  c.core('MATRIX', 'MATRIX CORE')
  c.discover('llm_pipeline')
  await c.wait(1.8)
  await c.say([
    { who: 'NOVA', text: 'A Language Engine recuperou o primeiro núcleo! Você terminou a Fase 1: As Origens.' },
    { who: 'NEX', text: 'E agora? Ainda estou pequeno e preso aqui dentro.' },
    { who: 'ENGINE', text: 'Eu lembro da matemática… mas as palavras ainda estão embaralhadas. Como eu corto uma frase em fichas? Como eu sei o que cada uma quer dizer?' },
    { who: 'NOVA', text: 'Do outro lado do portal fica a Cidade das Representações. Lá, a Engine vai lembrar como transforma palavras em números.' },
  ])
  c.setFlag('l1_done')
  c.unfocus(); c.freeze(false)
}

/* ---------- roteiro principal ---------- */
async function main(c: Ctx) {
  if (!c.flag('nova')) c.setFlag('nova')
  if (!c.flag('l1_intro')) await intro(c)
  let tease = false
  for (;;) {
    const i = nextIndex()
    if (i < 0) break
    if (tease) c.say({ who: 'NOVA', text: STOPS[i].tease }, { ambient: true }).catch(() => {})
    if (STOPS[i].custom === 'graos') {
      // parte 2: primeiro o comerciante, depois a mesa de madeira
      if (!c.flag('g2_talk')) { c.objective('Fale com o comerciante da vila', VILLAGE.merchantUse); await c.until(() => !!G().flags.g2_talk || done(i)) }
      if (!done(i)) { c.objective('Organize os registros na mesa de madeira', VILLAGE.tableUse); await c.until(() => done(i)) }
    } else {
      c.objective(`Desperte a memória de ${STOPS[i].year}`, USE_P(i))
      await c.until(() => done(i))
    }
    await c.until(() => !G().focus && !G().dialog) // a Engine fala primeiro
    tease = true
  }
  if (!c.flag('l1_final')) {
    c.objective('Leve as memórias até a Memória Central', CORE_USE)
    c.say({ who: 'NOVA', text: 'Todas as memórias voltaram! A névoa sumiu. Vamos até a Memória Central, no fim da trilha.' }, { ambient: true }).catch(() => {})
    await c.reach(CORE_USE, 3.2)
    await finale(c)
  }
  c.objective('Atravesse o portal para a Fase 2', PORTAL_USE)
}

/* ---------- objetos de uso ---------- */
function StopUse({ i }: { i: number }) {
  if (STOPS[i].custom === 'graos') return <VillageUse i={i} />
  return <GenericUse i={i} />
}
/** Parte 2: o comerciante (cenas 1–3) e a mesa de madeira (cenas 4–11). */
function VillageUse({ i }: { i: number }) {
  const s = STOPS[i]
  const flags = useGame((st) => st.flags)
  const isDone = !!flags[memFlag(s.id)], talk = !!flags.g2_talk
  let next = 0; while (next < STOPS.length && flags[memFlag(STOPS[next].id)]) next++
  const active = !!flags.l1_intro && !isDone && i === next
  return (
    <>
      <Interactable id={'l1stop' + i} position={VILLAGE.merchantUse} radius={2.8} markerY={2.3} color="#e6c04a"
        label={isDone ? `Reler: ${s.doc.title}` : 'Falar com o comerciante'} marker={!talk || isDone}
        enabled={active || isDone}
        onUse={() => { if (isDone) readAgain(s.doc); else if (!talk) start('l1stop' + i, graosTalk); else start('g2_hint', graosHint) }} />
      <Interactable id="g2_mesa" position={VILLAGE.tableUse} radius={2.4} markerY={1.6} color="#ffd27a"
        label="Organizar os registros na mesa" enabled={active && talk}
        onUse={() => start('g2_mesa', (c) => graosMesa(c, (cc) => recover(cc, i)))} />
      {s.extra && isDone && <Lectern i={i} />}
    </>
  )
}
function GenericUse({ i }: { i: number }) {
  const s = STOPS[i]
  const flags = useGame((st) => st.flags)
  const isDone = !!flags[memFlag(s.id)]
  const intro = !!flags.l1_intro
  let next = 0; while (next < STOPS.length && flags[memFlag(STOPS[next].id)]) next++
  const active = intro && !isDone && i === next
  return (
    <>
      <Console i={i} lit={active} />
      <Interactable id={'l1stop' + i} position={USE_P(i)} radius={2.8} markerY={1.9} color={PEOPLE[s.who].color}
        label={isDone ? `Reler: ${s.doc.title}` : `Despertar a memória · ${s.year}`}
        enabled={active || isDone}
        onUse={() => { if (isDone) readAgain(s.doc); else start('l1stop' + i, (c) => runStop(c, i)) }} />
      {s.extra && isDone && <Lectern i={i} />}
    </>
  )
}
function Lectern({ i }: { i: number }) {
  const s = STOPS[i]
  const p = EXTRA_P(i)
  const read = useGame((st) => st.quests[extraQuest(s.id)] === 'done')
  return (
    <group position={p}>
      <Solid><mesh position={[0, 0.5, 0]} material={MAT.woodDark()} castShadow><cylinderGeometry args={[0.08, 0.14, 1, 8]} /></mesh></Solid>
      <mesh position={[0, 1.02, 0]} rotation={[-0.45, SIDE(i) > 0 ? -Math.PI / 2 : Math.PI / 2, 0]} material={MAT.wood()} castShadow><boxGeometry args={[0.6, 0.05, 0.45]} /></mesh>
      <mesh position={[0, 1.07, 0]} rotation={[-0.45, SIDE(i) > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}><boxGeometry args={[0.5, 0.02, 0.36]} /><meshStandardMaterial color="#f3e7cc" emissive="#ffd27a" emissiveIntensity={read ? 0.05 : 0.5} /></mesh>
      <Interactable id={'l1x' + i} position={[0, 0, 0]} radius={1.8} markerY={1.7} color="#9fe9ff" marker={!read} label={read ? `Reler: ${s.extra!.title}` : `Documento extra: ${s.extra!.title}`} onUse={() => readExtra(s.id)} />
    </group>
  )
}
function Exit() {
  const on = useFlag('l1_done')
  return <Interactable id="l1_portal" label="Atravessar para a Fase 2" position={PORTAL_USE} radius={2.2} enabled={!!on} markerY={4.4} color="#c8a8ff" onUse={() => start('l1_portal', async (c) => { c.objective(null); c.goto('p2a1') })} />
}

export default function Linha() {
  const f = G().flags
  // estado inicial dos hologramas (lembranças já recuperadas ficam translúcidas)
  useMemo(() => { STOPS.forEach((s) => { const h = holo(s.id), d = !!f[memFlag(s.id)]; h.k = d ? 1 : 0; h.want = d ? 1 : 0; h.live = false; h.l = 0 }) }, [])
  let last = -1; STOPS.forEach((s, i) => { if (f[memFlag(s.id)]) last = i })
  const spawn: V3 = f.l1_final ? [0, 0.1, CORE_USE[2] + 1] : last >= 0 ? [0, 0.1, STOP_Z(last) + 1] : [0, 0.1, 9]
  useLevel({ spawn, yaw: Math.PI, scripts: [main], minY: -10 })
  useOverlay('l1mem', <MemoryStrip />, [])
  useEffect(() => () => { G().setOverlay(OV, null); G().setOverlay(BIG, null) }, []) // fecha painéis abertos ao sair da fase
  return (
    <>
      <SkyDome preset="night" custom={SKY} />
      <Lights preset="night" custom={SKY} sunI={1.7} hemiI={1.15} envI={0.7} />
      <Dust count={90} scale={[26, 10, 150]} position={[0, 4, -65]} color="#d8ccff" />
      <FloatingIslands n={10} seed={7} rMin={110} rMax={240} yMin={-20} yMax={40} />
      <CloudSea y={-26} color="#8a7ac8" shade="#3a2a6a" />
      <LinhaWorld />
      {STOPS.map((_, i) => <StopUse key={i} i={i} />)}
      <Exit />
      <Arrival />
    </>
  )
}
