import { hex, hash2, darker, lighter } from '../../engine/pix'
import { box, glow, memo, signPix, spr } from '../../art/core'
import { skyBg } from '../../art/sky'
import { cloudPuff, crystal, portalSprite } from '../../art/fx'
import { LOOKS, personSprite, sheepSprite } from '../../art/person'
import { RT, addInteract, gesture, type Scene, type Thing, type TileSpec } from '../../engine/runtime'
import { SFX } from '../../engine/audio'
import { start, type Ctx } from '../../engine/script'
import { G, useGame, type P2 } from '../../store'
import { STOPS, PEOPLE } from '../../content/stops'
import { holo, HOLO } from './faces'
import { openDoc, openAsk, openGame, openPipeline, MemoryStrip, memFlag, readExtra, readAgain, extraQuest, OV } from './Doc'
import { graosTalk, graosHint, graosMesa, BIG } from './Graos'
import { showPhoto, PH } from './Photo'
import { RECORDS, VALUES, type GK } from './graosData'
import {
  ROAD0, ROAD1, H, SEG, XC, FOG_X, HOLO_P, CONSOLE_P, USE_P, STAND_P, NOVA_P, EXTRA_P, PLAQUE_P,
  START, CORE, CORE_USE, PORTAL_P, PORTAL_USE, W, VILLAGE as V,
} from './layout'
import * as A from './art'
import { arrive, walkTo } from '../common'

/* =========================================================
   FASE 1 · AS ORIGENS — A LINHA DO TEMPO DA MEMÓRIA (pixel art)
   Um só caminho. Em cada marco, o eco de um inventor conta sua
   ideia, deixa um documento ilustrado e uma brincadeira. Cada
   ideia entendida devolve uma palavra à Language Engine.
   ========================================================= */
const done = (i: number) => !!G().flags[memFlag(STOPS[i].id)]
const nextIndex = () => STOPS.findIndex((_, i) => !done(i))
const flag = (k: string) => G().flags[k] || 0
const DOC_LINE = [
  'Preparei um documento para você. Leia com calma: tem desenhos!',
  'Está tudo anotado aqui. Leia comigo.',
  'Escrevi umas páginas sobre isso. Dê uma olhada.',
]
const X_END = FOG_X(STOPS.length - 1)
const portrait = () => innerWidth / innerHeight < 0.8

/* ---------- uma parada ---------- */
async function runStop(c: Ctx, i: number) {
  const s = STOPS[i]
  const h = holo(s.id)
  c.objective(null)
  const st = STAND_P(i), hp = HOLO_P(i)
  await walkTo(c, st)
  c.freeze(true)
  RT.lookAt = hp
  RT.novaPos = { x: NOVA_P(i)[0], y: NOVA_P(i)[1], z: 32 }
  c.focus([(st[0] + hp[0]) / 2, (st[1] + hp[1]) / 2 + 0.6], 2, portrait() ? 30 : 22)
  try {
    SFX.play('whoosh')
    await c.wait(0.5)
    h.live = true; h.want = 1
    SFX.play('chime')
    await c.wait(1.3)
    await c.say(s.intro.map((t) => ({ who: s.who, text: t })))
    await showPhoto(c, s.who)
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
  }
}

/** A Engine recupera a palavra da parada i. */
async function recover(c: Ctx, i: number) {
  const s = STOPS[i], P = PEOPLE[s.who]
  c.setFlag(memFlag(s.id))
  G().pushBanner({ kind: 'memory', title: s.word, sub: `${s.year} · ${P.name}` })
  SFX.play('core'); gesture('cheer', 1.8)
  RT.cam.shake = 0.3
  await c.wait(1.4)
  await c.say({ who: 'ENGINE', text: s.engine })
  for (const id of s.codex) c.discover(id)
  if (s.extra) c.quest(extraQuest(s.id), 'active', s.extra.title)
}

/* ---------- abertura ---------- */
async function intro(c: Ctx) {
  c.freeze(true)
  await c.cinematic([
    { pos: [XC(2), 10], zoom: 1, h: 40, cut: true },
    { pos: [XC(0), 11], zoom: 1, h: 30, dur: 4.5 },
    { pos: START, zoom: 2, h: 14, dur: 2.4 },
  ])
  c.focus(START, 2, 14)
  await arrive(c)
  await c.wait(0.6)
  RT.lookAt = [XC(0), 12]
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
}

/* ---------- final ---------- */
async function finale(c: Ctx) {
  c.objective(null)
  await walkTo(c, CORE_USE)
  c.freeze(true)
  RT.lookAt = CORE
  await c.cinematic([{ pos: [CORE[0], CORE[1] + 1], zoom: 1, h: 40, dur: 2.5 }], false)
  c.setFlag('l1_final')
  SFX.play('core'); gesture('cheer', 2)
  RT.cam.shake = 0.6
  c.focus([CORE[0] + 0.2, CORE[1] + 2], 2, 30)
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
  SFX.play('portal')
  await c.cinematic([{ pos: [PORTAL_P[0] - 1, PORTAL_P[1]], zoom: 1, h: 26, dur: 2 }, { pos: [PORTAL_P[0] - 1, PORTAL_P[1]], zoom: 1, h: 26, dur: 1 }], false)
  RT.lookAt = null
  c.unfocus(); c.freeze(false)
}

/* ---------- roteiro principal ---------- */
async function main(c: Ctx) {
  if (!c.flag('nova')) c.setFlag('nova')
  RT.novaOn = true
  if (!c.flag('l1_intro')) await intro(c)
  let tease = false
  for (;;) {
    const i = nextIndex()
    if (i < 0) break
    if (tease) c.say({ who: 'NOVA', text: STOPS[i].tease }, { ambient: true }).catch(() => {})
    if (STOPS[i].custom === 'graos') {
      if (!c.flag('g2_talk')) { c.objective('Fale com o comerciante da vila', V.merchantUse); await c.until(() => !!G().flags.g2_talk || done(i)) }
      if (!done(i)) { c.objective('Organize os registros na mesa de madeira', V.tableUse); await c.until(() => done(i)) }
    } else {
      c.objective(`Desperte a memória de ${STOPS[i].year}`, USE_P(i))
      await c.until(() => done(i))
    }
    await c.until(() => !G().focus && !G().dialog)
    tease = true
  }
  if (!c.flag('l1_final')) {
    c.objective('Leve as memórias até a Memória Central', CORE_USE)
    c.say({ who: 'NOVA', text: 'Todas as memórias voltaram! A névoa sumiu. Vamos até a Memória Central, no fim da trilha.' }, { ambient: true }).catch(() => {})
    await c.reach(CORE_USE, 1.6)
    await finale(c)
  }
  c.objective('Atravesse o portal para a Fase 2', PORTAL_USE)
}

/* ---------- objetos de uso ---------- */
function activeIndex() { let n = 0; while (n < STOPS.length && done(n)) n++; return n }
function addUses(i: number) {
  const s = STOPS[i]
  const active = () => !!flag('l1_intro') && !done(i) && activeIndex() === i
  if (s.custom === 'graos') {
    addInteract({ id: 'l1stop' + i, x: V.merchantUse[0], y: V.merchantUse[1], r: 1.4, mz: 44, color: '#e6c04a',
      label: () => (done(i) ? `Reler: ${s.doc.title}` : 'Falar com o comerciante'), marker: () => !flag('g2_talk') || done(i),
      enabled: () => active() || done(i),
      use: () => { if (done(i)) readAgain(s.doc); else if (!flag('g2_talk')) start('l1stop' + i, graosTalk); else start('g2_hint', graosHint) } })
    addInteract({ id: 'g2_mesa', x: V.tableUse[0], y: V.tableUse[1], r: 1.4, mz: 34, color: '#ffd27a', label: 'Organizar os registros na mesa',
      enabled: () => active() && !!flag('g2_talk'), use: () => start('g2_mesa', (c) => graosMesa(c, (cc) => recover(cc, i))) })
  } else {
    addInteract({ id: 'l1stop' + i, x: USE_P(i)[0], y: USE_P(i)[1], r: 1.4, mz: 40, color: PEOPLE[s.who].color,
      label: () => (done(i) ? `Reler: ${s.doc.title}` : `Despertar a memória · ${s.year}`),
      enabled: () => active() || done(i),
      use: () => { if (done(i)) readAgain(s.doc); else start('l1stop' + i, (c) => runStop(c, i)) } })
  }
  if (s.extra) {
    const p = EXTRA_P(i)
    const read = () => useGame.getState().quests[extraQuest(s.id)] === 'done'
    addInteract({ id: 'l1x' + i, x: p[0] + 0.3, y: p[1] + 1.0, r: 1.3, mz: 38, color: '#9fe9ff', marker: () => !read(),
      label: () => (read() ? `Reler: ${s.extra!.title}` : `Documento extra: ${s.extra!.title}`), enabled: () => done(i), use: () => readExtra(s.id) })
  }
}

/* ---------- o mundo ---------- */
type Era = { tile: TileSpec; props: (xc: number) => Thing[] }
const T = (t: Thing) => t
const anim = (fps: number) => Math.floor(RT.time * fps)
const ERAS: Record<string, Era> = {
  fichas: {
    tile: { s: 'sand', a: '#d8b47a', b: '#b8945a', c: '#f2d8a0' },
    props: (xc) => [
      T({ x: xc + 1.4, y: 5.8, w: 3, d: 3, solid: true, sprite: A.ziggurat() }),
      T({ x: xc - 2.0, y: 6.6, sprite: A.palm(1), shadow: 8 }), T({ x: xc + 4.4, y: 10.8, sprite: A.palm(2), shadow: 8 }),
      T({ x: xc - 1.9, y: 10.9, sprite: A.tokens() }),
      T({ x: xc - 4.0, y: 9.4, w: 0.9, d: 0.6, solid: true, sprite: A.tabletStand() }),
      ...[0, 1, 2].map((k) => T({ x: 0, y: 0, pos: () => { const a = RT.time * 0.25 + k * 2.1; return { x: xc + 2.6 + Math.cos(a) * 0.8 + k * 0.4, y: 11.2 + Math.sin(a) * 0.5 } }, sprite: () => sheepSprite(Math.sin(RT.time * 0.25 + k * 2.1) > 0, anim(4) % 2), shadow: 5 })),
    ],
  },
  algoritmo: {
    tile: { s: 'mosaic', a: '#2f8f8a', b: '#1f5f5a', c: '#e8b65a' },
    props: (xc) => [
      T({ x: xc - 1.6, y: 8.2, layer: 'ground', sprite: A.rug('#8a2a3a', 3, 2) }),
      T({ x: xc + 3.4, y: 7.4, sprite: A.arch() }),
      T({ x: xc - 4.2, y: 8.6, w: 0.5, d: 1.6, solid: true, sprite: A.scrollRack() }),
      T({ x: xc + 2.2, y: 10.8, w: 1.4, d: 0.8, solid: true, sprite: A.desk('#7a4a2a', 'astro') }),
    ],
  },
  chances: {
    tile: { s: 'checker', a: '#e8e0d0', b: '#3a3450', c: '#f2ead8' },
    props: (xc) => [
      T({ x: xc - 4.0, y: 8.0, w: 1.4, d: 0.8, solid: true, sprite: A.desk('#5a3a5a', 'candle') }),
      T({ x: xc + 2.2, y: 11.0, w: 0.55, d: 0.55, solid: true, sprite: A.die(5) }), T({ x: xc + 3.1, y: 10.3, w: 0.55, d: 0.55, solid: true, sprite: A.die(3) }),
      T({ x: xc + 3.8, y: 7.0, sprite: A.banner('#1f3a8a', 'star') }),
      T({ x: xc - 3.7, y: 10.7, w: 1, d: 0.5, solid: true, sprite: A.pascaline() }),
    ],
  },
  binario: {
    tile: { s: 'stone', a: '#8a8aa0', b: '#6a6a80', c: '#a8a8c0' },
    props: (xc) => [
      ...[1, 1, 0, 1].map((on, k) => T({ x: xc - 3.4 + k * 0.9, y: 8.0, sprite: A.bitLamp(!!on), shadow: 4 })),
      T({ x: xc + 3.6, y: 6.4, w: 0.5, d: 1.8, solid: true, sprite: A.bookshelf(1.8) }),
      T({ x: xc + 2.4, y: 10.9, w: 1.4, d: 0.7, solid: true, sprite: A.reckoner() }),
    ],
  },
  erro: {
    tile: { s: 'stone', a: '#4a5a7a', b: '#3a4660', c: '#5a6a8a' },
    props: (xc) => [
      T({ x: xc + 3.3, y: 10.8, sprite: A.telescope(), shadow: 8 }),
      T({ x: xc - 4.2, y: 8.2, w: 0.15, d: 2.2, solid: true, sprite: A.starBoard() }),
      T({ x: xc + 2.0, y: 7.0, w: 1.4, d: 0.8, solid: true, sprite: A.desk('#4a3a2a', 'papers') }),
    ],
  },
  programa: {
    tile: { s: 'wood', a: '#8a5a3a', b: '#5a3a24' },
    props: (xc) => [
      T({ x: xc + 3.6, y: 6.6, w: 0.4, d: 2.6, solid: true, sprite: A.engineFrame() }),
      T({ x: xc + 4.05, y: 7.4, z: 26, sprite: () => A.gear(10, '#c8a040', anim(6)) }),
      T({ x: xc + 4.06, y: 8.4, z: 18, sprite: () => A.gear(7, '#c87a3a', 3 - (anim(6) % 4)) }),
      T({ x: xc + 4.07, y: 8.9, z: 32, sprite: () => A.gear(6, '#c8a040', anim(6)) }),
      T({ x: xc - 2.0, y: 11.0, sprite: A.cards() }),
      T({ x: xc - 4.0, y: 8.0, w: 1.4, d: 0.8, solid: true, sprite: A.desk('#6a3a2a', 'book') }),
    ],
  },
  multiplicar: {
    tile: { s: 'tiles', a: '#b8b0d8', b: '#8a84a8', c: '#d0c8f0' },
    props: (xc) => [
      T({ x: xc - 3.8, y: 8.2, w: 1.6, d: 0.8, solid: true, sprite: A.compose('mat2', [[2, 0], [0, 2]].flatMap((row, r) => row.map((v, cc) => ({ s: A.numCube(String(v)), ...A.off(cc * 0.8, 0, (1 - r) * 19) })))) }),
      T({ x: xc - 1.8, y: 8.2, w: 0.8, d: 0.8, solid: true, sprite: A.compose('vec2', [2, 1].map((v, r) => ({ s: A.numCube(String(v), '#ffd27a'), ...A.off(0, 0, (1 - r) * 19) }))) }),
      T({ x: xc + 3.3, y: 8.4, sprite: A.bracketBoard([['2', '0'], ['0', '2']], '#ffd27a'), shadow: 6 }),
      T({ x: xc + 2.2, y: 10.9, w: 1.4, d: 0.8, solid: true, sprite: A.desk('#4a3a5a', 'papers') }),
    ],
  },
  markov: {
    tile: { s: 'wood', a: '#6a4a3a', b: '#4a3024' },
    props: (xc) => [
      ...(['AEO', 'BRS', 'TNA'] as const).map((L, k) => T({ x: [xc - 3.6, xc - 2.4, xc + 3.2][k], y: [8.4, 7.4, 7.0][k], w: 0.7, d: 0.7, solid: true, sprite: A.compose('tower' + L, L.split('').map((ch, j) => ({ s: A.numCube(ch, j % 2 ? '#ffd27a' : '#bff6ff'), ...A.off(0, 0, j * 18) }))) })),
      T({ x: xc + 3.9, y: 9.4, w: 0.5, d: 1.8, solid: true, sprite: A.bookshelf(1.8) }),
      T({ x: xc - 4.0, y: 10.4, w: 1.4, d: 0.8, solid: true, sprite: A.desk('#5a3a2a', 'book') }),
    ],
  },
  bit: {
    tile: { s: 'metal', a: '#6a7088', b: '#4a5068', c: '#8a90a8' },
    props: (xc) => [
      T({ x: xc - 3.0, y: 10.8, sprite: () => A.unicycle(anim(5)), shadow: 5 }),
      ...[0, 1, 2].map((k) => T({ x: 0, y: 0, pos: () => { const a = RT.time * 2.4 + (k * Math.PI * 2) / 3; return { x: xc + 3.4 + Math.cos(a) * 0.35, y: 11.6, z: 22 + Math.abs(Math.sin(a)) * 18 } }, sprite: crystal(['#ff5a5a', '#ffd25a', '#5ad0ff'][k], 0.45) })),
      T({ x: xc + 3.8, y: 6.4, w: 0.6, d: 1.4, solid: true, sprite: () => A.relayCabinet(anim(3)) }),
      T({ x: xc - 4.2, y: 8.4, w: 1.4, d: 1.4, solid: true, sprite: () => A.mazeMouse(anim(2)) }),
    ],
  },
  neuronio: {
    tile: { s: 'circuit', a: '#2a3a5a', b: '#1a2440', c: '#3fb8e8' },
    props: (xc) => [
      T({ x: xc + 3.8, y: 6.2, w: 0.5, d: 2.2, solid: true, sprite: () => A.perceptron(anim(2)) }),
      T({ x: xc - 3.0, y: 8.6, sprite: () => A.neuronNode('#59d7ff', anim(5)), shadow: 5 }),
      T({ x: xc + 1.8, y: 6.8, sprite: () => A.neuronNode('#9fe9ff', anim(5) + 2), shadow: 5 }),
      T({ x: xc + 2.4, y: 11.1, sprite: () => A.neuronNode('#c8a8ff', anim(5) + 4), shadow: 5 }),
    ],
  },
}

/** Holograma do inventor (e o comerciante, que é gente “de verdade” da memória). */
function holoThing(id: string, who: string, p: P2): Thing {
  const color = PEOPLE[who].color
  return {
    x: p[0], y: p[1] + 0.05, z: 4,
    hidden: () => holo(id).k < 0.02,
    alpha: () => { const h = holo(id); return h.k * (h.live ? 0.92 + Math.sin(RT.time * 30) * 0.06 : 0.42) },
    sprite: () => personSprite(who, LOOKS[who], { x: -0.6, y: 1 }, 0, holo(id).live && Math.floor(RT.time * 1.3) % 5 === 0 ? 'think' : 'idle', color),
  }
}

export default function build(): Scene {
  const things: Thing[] = []
  const add = (...ts: Thing[]) => { for (const t of ts) things.push(t) }
  // estado inicial dos hologramas
  STOPS.forEach((s, i) => { const h = holo(s.id), d = done(i); h.k = d ? 1 : 0; h.want = d ? 1 : 0; h.live = false })
  const isVillage = (x: number, y: number) => x >= V.x0 && x < V.x1 && y >= 0 && y < ROAD0
  const paddy = (x: number, y: number) => isVillage(x, y) && ((x >= V.x0 + 1 && x < V.x0 + 8 && y >= 1 && y < 5) || (x >= V.x0 + 13 && x < V.x0 + 20 && y >= 0 && y < 4) || (x >= V.x0 + 1 && x < V.x0 + 4 && y >= 7 && y < 11))

  // ---- chão ----
  const ROAD: TileSpec = { s: 'road', a: '#8a7a9a', b: '#5a4e6a', c: '#a89ab8' }
  const GRASS: TileSpec = { s: 'grass', a: '#4a8a7a', b: '#3a6a60', c: '#ffe08a' }
  const ground = (x: number, y: number): TileSpec | null => {
    if (x < 0 || y < 0 || x >= W || y >= H) return null
    // começo (plataforma de chegada)
    if (Math.hypot((x + 0.5 - 5) / 5.2, (y + 0.5 - 15.5) / 4.8) <= 1) return y >= ROAD0 && y < ROAD1 ? ROAD : { s: 'tiles', a: '#6a5a9a', b: '#4a3e72', c: '#7a6aaa' }
    if (x >= 3 && x < X_END + 16 && y >= ROAD0 && y < ROAD1) return ROAD
    if (x >= 3 && x < X_END + 2 && y >= ROAD1 && y < ROAD1 + 2 && hash2(x, y, 4) > 0.08) return GRASS
    // fim: Memória Central e portal
    if (Math.hypot((x + 0.5 - CORE[0]) / 6, (y + 0.5 - CORE[1] - 1) / 6.5) <= 1) return { s: 'tiles', a: '#5a5490', b: '#3a3460', c: '#6a64a8' }
    if (Math.hypot((x + 0.5 - PORTAL_P[0]) / 3.6, (y + 0.5 - PORTAL_P[1]) / 3.6) <= 1) return { s: 'mosaic', a: '#5a4a8a', b: '#3a2e60', c: '#c8a8ff' }
    // a vila
    if (isVillage(x, y)) {
      if (paddy(x, y)) return { s: 'water', a: '#5fa8a0', b: '#3f8880', c: '#a8e0d8' }
      const plaza = x >= V.x0 + 9 && x < V.x0 + 24 && y >= 8
      if (plaza) return { s: 'stone', a: '#c8b898', b: '#a89878', c: '#e0d0b0' }
      if (x === V.x0 + 11 || y === 6) return { s: 'earth', a: '#b88a5a', b: '#987040', c: '#d8aa7a' }
      if (y < 1 && hash2(x, y, 9) < 0.4) return null
      return { s: 'grass', a: '#6aa84a', b: '#4a8a3a', c: '#ffe08a' }
    }
    // marcos (lado de trás)
    for (let i = 0; i < STOPS.length; i++) {
      if (STOPS[i].custom) continue
      const [x0, x1] = SEG(i)
      if (x >= x0 + 1 && x < x1 - 1 && y >= 5 && y < ROAD0) {
        const corner = (x === x0 + 1 || x === x1 - 2) && y === 5
        if (corner) return null
        if (y === 5 && hash2(x, y, i) < 0.3) return null
        return ERAS[STOPS[i].id].tile
      }
    }
    return null
  }
  const noWalk = (x: number, y: number) => paddy(x, y)

  // ---- coisas ----
  STOPS.forEach((s, i) => {
    const xc = XC(i), P = PEOPLE[s.who]
    if (!s.custom) {
      add(...ERAS[s.id].props(xc))
      const hp = HOLO_P(i), cp = CONSOLE_P(i)
      add({ x: hp[0], y: hp[1], sprite: () => A.projector(P.color, holo(s.id).live || done(i)) })
      add({ x: hp[0], y: hp[1] + 0.2, layer: 'ground', blend: 'lighter', hidden: () => !holo(s.id).live, sprite: glow(30, P.color, 0.4) })
      add(holoThing(s.id, s.who, hp))
      add({ x: cp[0] + 0.4, y: cp[1] + 0.4, solid: true, shadow: 0, sprite: () => A.consoleSprite(P.color, !!flag('l1_intro') && !done(i) && activeIndex() === i, anim(3)) })
      // cristais nas bordas do marco
      add({ x: SEG(i)[0] + 1.6, y: 5.8, z: 6, sprite: crystal(P.color, 0.8), shadow: 3 })
      add({ x: SEG(i)[1] - 1.6, y: 5.8, z: 6, sprite: crystal(P.color, 0.8), shadow: 3 })
    }
    const pq = PLAQUE_P(i)
    add({ x: pq[0], y: pq[1], sprite: A.plaque(s.year, P.color), shadow: 3 })
    if (s.extra) { const e = EXTRA_P(i); add({ x: e[0], y: e[1], w: 0.6, d: 0.6, solid: true, hidden: () => !done(i), sprite: () => A.lectern(useGame.getState().quests[extraQuest(s.id)] === 'done') }) }
    addUses(i)
  })
  // postes de luz atrás da estrada
  for (const x of [9.6, ...STOPS.map((_, i) => FOG_X(i) - 1.2), X_END + 3.5, X_END + 10]) {
    if (x > V.x0 + 1 && x < V.x1 - 2) continue
    add({ x, y: 13.7, sprite: A.lamppost('#ffd27a', true), shadow: 3 })
    add({ x, y: 13.9, layer: 'ground', blend: 'lighter', sprite: glow(16, '#ffd27a', 0.18) })
  }
  // cristais da frente (baixos)
  for (let x = 9; x < X_END; x += 7) add({ x: x + 0.4, y: 18.4, z: 2, sprite: crystal(['#9fe9ff', '#c8a8ff', '#ffd27a'][x % 3], 0.6), shadow: 3 })
  // névoa entre os marcos
  STOPS.forEach((_, i) => {
    const fx = FOG_X(i)
    for (let y = 0; y <= 20; y += 1.6) {
      const seed = i * 31 + Math.round(y * 3)
      add({ x: 0, y: 0, hidden: () => fogK[i] <= 0.01, pos: () => ({ x: fx + 0.3 + Math.sin(RT.time * 0.6 + seed) * 0.15, y: y + Math.cos(RT.time * 0.4 + seed) * 0.2, z: 4 }), alpha: () => fogK[i], sprite: cloudPuff(seed % 7, '#b8a8f0', 64, 34) })
    }
  })
  // ---- a vila ----
  add({ x: V.gate, y: ROAD0 - 0.4, w: 0.3, d: 3.8, sprite: A.gate() })
  add({ x: V.x0 + 9.4, y: 0.9, w: 3, d: 2.4, solid: true, sprite: A.house(3, 2.4) })
  add({ x: V.x0 + 5.0, y: 7.0, w: 3, d: 2.2, solid: true, sprite: A.house(3, 2.2) })
  add({ x: V.x0 + 21.2, y: 0.8, w: 3, d: 2.6, solid: true, sprite: A.house(3, 2.6) })
  add({ x: V.x0 + 23.0, y: 5.0, w: 2.6, d: 2.2, solid: true, sprite: A.house(2.6, 2.2) })
  V.boards.forEach((bx, k) => add({ x: bx, y: V.boardY, w: 0.2, d: 0.2, solid: true, sprite: A.recordBoard(k, RECORDS[k].n, RECORDS[k].total) }))
  add({ x: V.stall[0], y: V.stall[1], w: 2.2, d: 0.8, solid: true, sprite: A.stall() })
  add({ x: V.merchant[0], y: V.merchant[1], shadow: 5, sprite: () => personSprite('COMERCIANTE', LOOKS.COMERCIANTE, { x: -0.3, y: 1 }, 0, useGame.getState().dialog?.lines[useGame.getState().dialog!.i]?.who === 'COMERCIANTE' && Math.floor(RT.time * 2) % 3 === 0 ? 'think' : 'idle') })
  ;(['B', 'M', 'F'] as GK[]).forEach((k, j) => add({ x: V.baskets[j][0], y: V.baskets[j][1], w: 0.4, d: 0.4, solid: true, sprite: () => A.basket(k, flag('g2_rev') ? VALUES[k] : '?') }))
  add({ x: V.scale[0], y: V.scale[1], w: 0.5, d: 0.4, solid: true, sprite: () => A.scaleSprite(flag('g2_six') ? 6 : 0, flag('g2_pred') ? '25,5' : flag('g2_six') ? '?' : '') })
  add({ x: V.table[0], y: V.table[1], w: 2.4, d: 1.2, solid: true, sprite: A.woodTable() })
  add({ x: V.liu[0], y: V.liu[1], sprite: () => A.projector(PEOPLE.LIUHUI.color, holo(STOPS[V.i].id).live || done(V.i)) })
  add({ x: V.liu[0], y: V.liu[1] + 0.2, layer: 'ground', blend: 'lighter', hidden: () => !holo(STOPS[V.i].id).live, sprite: glow(30, PEOPLE.LIUHUI.color, 0.4) })
  add(holoThing(STOPS[V.i].id, 'LIUHUI', V.liu))
  for (const lx of [3, 9, 15, 21]) add({ x: V.x0 + lx + 0.5, y: 13.6, sprite: () => A.lantern(anim(2) + lx), shadow: 3 })
  add({ x: V.x0 + 12.6, y: 3.6, sprite: A.sheaf('B'), shadow: 3 }, { x: V.x0 + 8.4, y: 8.4, sprite: A.sheaf('M'), shadow: 3 }, { x: V.x0 + 20.8, y: 6.6, sprite: A.sheaf('F'), shadow: 3 })
  // ---- começo e fim ----
  add({ x: 7.2, y: 12.2, w: 0.3, d: 0.3, solid: true, sprite: A.plaque('Linha do tempo', '#9fe9ff') })
  add({ x: CORE[0] - 2, y: CORE[1] - 2, w: 4, d: 4, solid: true, sprite: A.coreBase() })
  add({ x: CORE[0] + 0.2, y: CORE[1] + 0.2, z: 0, pos: () => ({ x: CORE[0] + 0.2, y: CORE[1] + 0.2, z: 30 + Math.sin(RT.time * 1.5) * 4 }), sprite: () => crystal(flag('l1_final') ? '#9fe9ff' : '#6a5aa8', 2.6) })
  add({ x: CORE[0] + 0.2, y: CORE[1] + 0.2, z: 50, layer: 'top', blend: 'lighter', sprite: glow(44, '#9fe9ff', 0.5), alpha: () => (flag('l1_final') ? 0.9 : 0.25) })
  STOPS.forEach((s, i) => add({ x: 0, y: 0, pos: () => { const a = RT.time * 0.5 + (i / STOPS.length) * Math.PI * 2; return { x: CORE[0] + 0.2 + Math.cos(a) * 3, y: CORE[1] + 0.2 + Math.sin(a) * 3, z: 26 + Math.sin(RT.time * 2 + i) * 5 } }, sprite: crystal(PEOPLE[s.who].color, 0.6), alpha: () => (done(i) ? 1 : 0.25) }))
  add({ x: PORTAL_P[0], y: PORTAL_P[1], hidden: () => !flag('l1_done'), sprite: () => portalSprite(anim(8), '#c8a8ff'), shadow: 0 })
  add({ x: PORTAL_P[0], y: PORTAL_P[1] + 0.6, layer: 'ground', blend: 'lighter', hidden: () => !flag('l1_done'), sprite: glow(30, '#c8a8ff', 0.35) })
  addInteract({ id: 'l1_portal', x: PORTAL_USE[0], y: PORTAL_USE[1], r: 1.5, mz: 60, color: '#c8a8ff', label: 'Atravessar para a Fase 2', enabled: () => !!flag('l1_done'), use: () => start('l1_portal', async (c) => { c.objective(null); c.goto('p2a1') }) })

  // névoa: 1 = fechada
  const fogK = STOPS.map((_, i) => (done(i) ? 0 : 1))
  // ---- pintura do chão: a linha do tempo ----
  const line = hex('#59d7ff'), lineD = hex('#2a7ab0'), gold = hex('#ffd27a'), stud = hex('#c8a8ff'), flower = [hex('#ffe08a'), hex('#ff9ad0'), hex('#bff3ff')]
  const paint = (p: import('../../engine/pix').Pix, x: number, y: number, tx: number, ty: number) => {
    const isRoad = y >= ROAD0 && y < ROAD1 && x >= 3
    for (let py = 0; py < 16; py++) for (let px = 0; px < 32; px++) {
      if (Math.abs(px + 0.5 - 16) / 16 + Math.abs(py + 0.5 - 8) / 8 > 1) continue
      const X = px + 0.5 - 16, Y = py + 0.5
      const wx = x + (X / 16 + Y / 8) / 2, wy = y + (Y / 8 - X / 16) / 2
      let c = 0
      if (isRoad && wx < X_END + 2) {
        if (Math.abs(wy - 15.5) < 0.05) c = line
        else if (Math.abs(wy - 15.5) < 0.1) c = lineD
        for (let i = 0; i < STOPS.length; i++) if (Math.abs(wx - XC(i)) < 0.06 && Math.abs(wy - 15.5) < 0.45) c = gold
        if (Math.abs(wy - 14.08) < 0.05 && Math.abs((wx % 2) - 1) < 0.08) c = stud
      }
      if (c) p.px(tx - 16 + px, ty + py, c)
    }
    if (paddy(x, y)) for (let k = 0; k < 4; k++) A.riceTuft(p, tx - 8 + (k % 2) * 16 + (k > 1 ? 0 : 0), ty + 5 + (k > 1 ? 6 : 0) + (k % 2 ? 0 : 2), k + x)
    const g = ground(x, y)
    if (g && g.s === 'grass' && hash2(x, y, 13) < 0.35) { const fx = tx - 6 + Math.floor(hash2(x, y, 3) * 12), fy = ty + 5 + Math.floor(hash2(x, y, 5) * 6); p.px(fx, fy, flower[Math.floor(hash2(x, y, 7) * 3)]); p.px(fx, fy + 1, hex('#2a5a3a')) }
  }

  // espaço onde o NEX nasce
  let last = -1; STOPS.forEach((s, i) => { if (done(i)) last = i })
  const spawn: P2 = flag('l1_final') ? [CORE_USE[0], CORE_USE[1] + 0.6] : last >= 0 ? [FOG_X(last) + 1.5, 15.5] : START
  if (last >= 0 && STOPS[last + 1]?.custom === 'graos') spawn[0] = V.x0 + 1.2

  const blockers = STOPS.map((_, i) => ({ x0: FOG_X(i) - 0.2, y0: 0, x1: FOG_X(i) + 0.4, y1: H, on: () => !done(i) }))
  return {
    w: W, h: H, ground, things, blockers, noWalk, paint,
    cliff: { a: '#5a4a7a', b: '#3e3260', depth: 38 },
    spawn: { pos: spawn, dir: [1, 0] },
    bg: skyBg({ top: '#0a0c2a', mid: '#2c2a6e', bottom: '#9a72c0', stars: 120, islands: 6, cloud: '#6a5aa8', seed: 7 }),
    scripts: [main],
    novaZ: 30,
    init: () => {
      RT.novaOn = !!flag('nova') || true
      G().setOverlay('l1mem', <MemoryStrip />)
    },
    update: (dt) => {
      for (const id in HOLO) { const h = HOLO[id]; h.k += (h.want - h.k) * Math.min(1, dt * 2.5) }
      STOPS.forEach((_, i) => { const want = done(i) ? 0 : 1; fogK[i] += (want - fogK[i]) * Math.min(1, dt * 0.8) })
    },
    onExit: () => { G().setOverlay(OV, null); G().setOverlay(BIG, null); G().setOverlay(PH, null); G().setOverlay('l1mem', null) },
  }
}
