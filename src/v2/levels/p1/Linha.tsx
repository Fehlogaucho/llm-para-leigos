import { Pix, hex, hash2 } from '../../engine/pix'
import { glow, memo, spr, cyl, OUT } from '../../art/core'
import { cloudPuff, crystal, portalSprite } from '../../art/fx'
import { LOOKS, personSprite, sheepSprite } from '../../art/person'
import { robotSprite, tokenBody, tokenTag, bitSprite, droneSprite } from '../../art/creatures'
import { RT, addInteract, gesture, emote, INTERACTS, type Scene, type Thing, type TileSpec, type Blocker } from '../../engine/runtime'
import { makeNpc, npcThing, npcShadow, npcTalk, updateNpcs, syncTalk, followerPos, type Npc } from '../../engine/npc'
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
  W, H, ISL, IW, IH, XC, DY, HOLO_P, CONSOLE_P, USE_P, STAND_P, NOVA_P, EXTRA_P, PLAQUE_P,
  HUB, START, CORE, CORE_USE, PORTAL_P, PORTAL_USE, PEDESTAL, BRIDGES, bridgeMid, onBridge, VILLAGE as V, type Bridge,
} from './layout'
import * as A from './art'
import { walkTo, fallIn, pulses, dataRainBg, tween } from '../common'
import { registerRobot } from '../robots'

/* =========================================================
   FASE 1 · AS ORIGENS — O ARQUIVO DA MEMÓRIA (pixel art)
   Dentro da Language Engine, as lembranças mais antigas viraram
   ilhas flutuando em volta da Memória Central, ligadas por pontes
   de luz. Em cada ilha, o eco de um inventor conta sua ideia,
   deixa um documento ilustrado e uma brincadeira. Cada ideia
   entendida devolve uma palavra à Engine e abre a próxima ponte.
   ========================================================= */
const done = (i: number) => !!G().flags[memFlag(STOPS[i].id)]
const nextIndex = () => STOPS.findIndex((_, i) => !done(i))
const flag = (k: string) => G().flags[k] || 0
const isOpen = (b: Bridge) => b.gate < 0 || done(b.gate)
const doneCount = () => STOPS.filter((_, i) => done(i)).length
const DOC_LINE = [
  'Preparei um documento para você. Leia com calma: tem desenhos!',
  'Está tudo anotado aqui. Leia comigo.',
  'Escrevi umas páginas sobre isso. Dê uma olhada.',
]
const portrait = () => innerWidth / innerHeight < 0.8
const ARQ_COLOR = '#7a6ad8'
registerRobot('ARQUIVISTA', 'ARQUIVISTA', 'bibliotecario', ARQ_COLOR, { pitch: 1.15, rate: 1.0 })

/** Estado da cena (o final faz as palavras voarem para o núcleo). */
const S = { feed: 0, fed: false }
let arq: Npc | null = null

/* ---------- uma parada ---------- */
async function runStop(c: Ctx, i: number) {
  const s = STOPS[i]
  const h = holo(s.id)
  c.objective(null)
  const st = STAND_P(i), hp = HOLO_P(i)
  await walkTo(c, st)
  c.freeze(true)
  RT.lookAt = hp
  RT.novaPos = { x: NOVA_P(i)[0], y: NOVA_P(i)[1], z: 10 }
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

/** A Engine recupera a palavra da parada i, e a névoa da próxima ponte se abre. */
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
  // a ponte seguinte se abre
  const b = BRIDGES.find((b) => b.gate === i)
  if (b && nextIndex() >= 0) {
    const m = bridgeMid(b)
    c.focus(m, 1, 26)
    await c.wait(0.4)
    SFX.play('whoosh')
    await c.wait(1.8)
  }
}

/* ---------- abertura ---------- */
async function intro(c: Ctx) {
  c.freeze(true)
  RT.nexHidden = true
  await c.cinematic([
    { pos: [ISL(4)[0] + 5, ISL(4)[1] + 5], zoom: 1, h: 40, cut: true },
    { pos: [ISL(2)[0] + 5, ISL(2)[1] + 4], zoom: 1, h: 40, dur: 3.4 },
    { pos: [(V.x0 + V.x1) / 2, V.y0 + 9], zoom: 1, h: 30, dur: 3 },
    { pos: [HUB.x, HUB.y - 1], zoom: 1, h: 40, dur: 3.2 },
    { pos: START, zoom: 2, h: 14, dur: 1.8 },
  ])
  c.focus(START, 2, 14)
  RT.nexHidden = false
  await fallIn(c)
  RT.lookAt = CORE
  await c.say([
    { who: 'NEX', text: 'Aaai! Caí de novo… Onde eu estou agora?' },
    { who: 'NOVA', text: 'No Arquivo da Memória: a parte mais antiga da Language Engine. Olhe em volta: ilhas flutuando, presas por pontes de luz.' },
    { who: 'ENGINE', text: 'Q-quem… está aí? Eu tenho tantas perguntas… e não lembro… das respostas.' },
    { who: 'NEX', text: 'É a IA do meu computador! A voz dela está toda falhando.' },
    { who: 'NOVA', text: 'O choque apagou as lembranças mais antigas dela: as ideias que vieram antes de qualquer computador.' },
    { who: 'NOVA', text: 'Cada ilha guarda uma dessas ideias. Alguém inventou cada uma, às vezes há milhares de anos.' },
    { who: 'NOVA', text: 'Juntas, essas ideias são a matemática que faz uma LLM funcionar. Sem elas, a Engine não consegue pensar direito.' },
    { who: 'NEX', text: 'E como a gente devolve essas ideias para ela?' },
    { who: 'NOVA', text: 'Em cada ilha, toque no console. O eco de quem teve a ideia vai aparecer, contar a história e deixar um documento para você ler.' },
    { who: 'NOVA', text: 'Cada ideia que você entender vira uma palavra que a Engine volta a lembrar. E a névoa da ponte seguinte se abre.' },
    {
      who: 'NOVA', text: 'Alguma pergunta antes de começar?', choices: [
        { label: 'Quem vai aparecer?', next: [{ who: 'NOVA', text: 'Escribas, matemáticos, uma condessa programadora… Gente de verdade, de lugares e séculos diferentes.' }] },
        { label: 'E se eu não entender?', next: [{ who: 'NOVA', text: 'Os documentos têm desenhos e exemplos. E dá para reler tudo quando quiser: é só tocar na faixa da memória, lá em cima.' }] },
        { label: 'Quem é aquele robô?', next: [{ who: 'NOVA', text: 'É o Arquivista. Ele cuida deste lugar. Se você se perder, fale com ele.' }] },
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
  // as palavras que seguiam o NEX voam para o núcleo
  SFX.play('chime')
  await tween(c, 1.6, (k) => { S.feed = k })
  S.fed = true
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
    { who: 'ARQUIVISTA', text: 'Bip! Os onze pedestais acesos! O arquivo nunca esteve tão arrumado.' },
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
    { who: 'ENGINE', text: 'Eu lembro da matemática… mas não lembro como eu uso. Como eu corto uma frase em pedaços? Como eu adivinho a próxima palavra?' },
    { who: 'NOVA', text: 'Do outro lado do portal fica o coração da Engine: a fábrica onde as palavras viram números e a próxima palavra é escolhida.' },
  ])
  c.setFlag('l1_done')
  SFX.play('portal')
  await c.cinematic([{ pos: [PORTAL_P[0] - 1, PORTAL_P[1]], zoom: 1, h: 26, dur: 2 }, { pos: [PORTAL_P[0] - 1, PORTAL_P[1]], zoom: 1, h: 26, dur: 1 }], false)
  RT.lookAt = null
  c.unfocus(); c.freeze(false)
}

/* ---------- o Arquivista ---------- */
async function arquivistaTalk(c: Ctx) {
  const n = doneCount(), i = nextIndex()
  c.freeze(true)
  if (arq) RT.lookAt = [arq.x, arq.y]
  try {
    if (!c.flag('l1_arq')) {
      c.setFlag('l1_arq')
      await c.say([
        { who: 'ARQUIVISTA', text: 'Bip! Um visitante! Bem-vindo ao Arquivo da Memória.' },
        { who: 'ARQUIVISTA', text: 'Eu guardo as lembranças da Language Engine. Quer dizer… guardava. O choque espalhou tudo pelas ilhas.' },
        { who: 'NEX', text: 'A gente vai trazer tudo de volta!' },
        { who: 'ARQUIVISTA', text: 'Cada lembrança que voltar acende um destes pedestais. Quando os onze brilharem, a Memória Central acorda.' },
      ])
    }
    if (flag('l1_final')) await c.say({ who: 'ARQUIVISTA', text: 'Obrigado, NEX! Agora a Engine lembra da matemática. O portal está esperando você.' })
    else if (i < 0) await c.say({ who: 'ARQUIVISTA', text: 'Os onze pedestais brilham! Leve as palavras até a Memória Central, bem aqui no meio.' })
    else {
      const s = STOPS[i]
      await c.say([
        { who: 'ARQUIVISTA', text: n === 0 ? 'Nenhum pedestal aceso ainda… Bip. Que silêncio.' : `${n} de ${STOPS.length} pedestais acesos. Bip-bip!` },
        { who: 'ARQUIVISTA', text: s.custom === 'graos' ? 'A próxima lembrança está na vila dos arrozais, depois da primeira ilha. Procure o comerciante.' : `A próxima lembrança é de ${s.year}. Siga o marcador amarelo: ele aponta a ilha certa.` },
        {
          who: 'ARQUIVISTA', text: 'Quer saber mais alguma coisa?', choices: [
            { label: 'Por que ilhas?', next: [{ who: 'ARQUIVISTA', text: 'Cada ideia nasceu num lugar e numa época. Aqui dentro, cada uma virou uma ilha. As pontes mostram que uma ideia leva à outra.' }] },
            { label: 'O que é a névoa?', next: [{ who: 'ARQUIVISTA', text: 'É memória apagada. Quando a Engine lembra de uma ideia, a névoa da ponte seguinte some.' }] },
            { label: 'As palavras me seguem!', next: [{ who: 'ARQUIVISTA', text: 'São as palavras que a Engine recuperou. Elas querem voltar para a Memória Central, mas só vão quando todas estiverem juntas.' }] },
            { label: 'Obrigado!', next: [{ who: 'ARQUIVISTA', text: 'Bip! Boa sorte, visitante.' }] },
          ],
        },
      ])
    }
  } finally { RT.lookAt = null; c.freeze(false) }
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
      c.objective(`Desperte a memória da ilha de ${STOPS[i].year}`, USE_P(i))
      await c.until(() => done(i))
    }
    await c.until(() => !G().focus && !G().dialog)
    tease = true
  }
  if (!c.flag('l1_final')) {
    c.objective('Leve as palavras até a Memória Central', CORE_USE)
    c.say({ who: 'NOVA', text: 'Todas as memórias voltaram! As palavras estão seguindo você. Vamos levá-las até a Memória Central, no meio do arquivo.' }, { ambient: true }).catch(() => {})
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
    addInteract({ id: 'l1stop' + i, x: V.merchantUse[0], y: V.merchantUse[1], r: 1.4, mz: 44, color: '#e6c04a', icon: 'talk',
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
      T({ x: xc - 2.0, y: 6.6, sprite: A.palm(1), shadow: 8 }), T({ x: xc + 4.0, y: 10.4, sprite: A.palm(2), shadow: 8 }),
      T({ x: xc - 1.9, y: 10.9, sprite: A.tokens() }),
      T({ x: xc - 4.0, y: 9.4, w: 0.9, d: 0.6, solid: true, sprite: A.tabletStand() }),
      ...[0, 1, 2].map((k) => T({ x: 0, y: 0, pos: () => { const a = RT.time * 0.25 + k * 2.1; return { x: xc + 2.3 + Math.cos(a) * 0.8 + k * 0.4, y: 11.0 + Math.sin(a) * 0.5 } }, sprite: () => sheepSprite(Math.sin(RT.time * 0.25 + k * 2.1) > 0, anim(4) % 2), shadow: 5 })),
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
      // um dado que rola sozinho
      T({ x: 0, y: 0, pos: () => { const k = (RT.time * 0.4) % 1, up = Math.abs(Math.sin(k * Math.PI * 3)) * 14 * (1 - k); return { x: xc + 0.6 + k * 1.6, y: 9.4, z: up } }, sprite: () => A.die(1 + (anim(6) % 6)), shadow: 4 }),
    ],
  },
  binario: {
    tile: { s: 'stone', a: '#8a8aa0', b: '#6a6a80', c: '#a8a8c0' },
    props: (xc) => [
      ...[1, 1, 0, 1].map((on, k) => T({ x: xc - 3.4 + k * 0.9, y: 8.0, sprite: () => A.bitLamp(((anim(1) >> k) & 1) === 1 ? !on : !!on), shadow: 4 })),
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
      // Ceres passando no céu da ilha
      T({ x: 0, y: 0, pos: () => { const k = (RT.time * 0.12) % 1; return { x: xc - 3 + k * 7, y: 6.2 + k * 1.5, z: 70 + Math.sin(k * Math.PI) * 20 } }, sprite: crystal('#ffe6a8', 0.5) }),
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
      T({ x: 0, y: 0, pos: () => ({ x: xc - 3.0 + Math.sin(RT.time * 0.7) * 1.2, y: 10.8 }), sprite: () => A.unicycle(anim(5)), shadow: 5 }),
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
/** Desloca em y as coisas de uma época (o cenário foi desenhado com o fundo em y = 5). */
function shiftY(ts: Thing[], dy: number) {
  for (const t of ts) {
    t.y += dy
    if (t.pos) { const p = t.pos; t.pos = () => { const q = p(); return { ...q, y: q.y + dy } } }
  }
  return ts
}

/** Holograma do inventor. */
function holoThing(id: string, who: string, p: P2): Thing {
  const color = PEOPLE[who].color
  return {
    x: p[0], y: p[1] + 0.05, z: 4,
    hidden: () => holo(id).k < 0.02,
    alpha: () => { const h = holo(id); return h.k * (h.live ? 0.92 + Math.sin(RT.time * 30) * 0.06 : 0.42) },
    sprite: () => personSprite(who, LOOKS[who], { x: -0.6, y: 1 }, 0, holo(id).live && Math.floor(RT.time * 1.3) % 5 === 0 ? 'think' : 'idle', color),
  }
}

/* ---------- peças próprias do arquivo ---------- */
/** Poste de luz da ponte (cristal num pino). */
function railPost(color: string, on: boolean, f: number) {
  return memo(`rail:${color}:${on}:${f % 4}`, () => {
    const p = new Pix(7, 16)
    p.rect(2, 6, 3, 9, hex('#3a3a6a')); p.rect(2, 6, 1, 9, hex('#5a5a8a')); p.rect(1, 14, 5, 2, hex('#2a2a4a'))
    const c = on ? hex(color) : hex('#4a4a6a')
    p.poly([[3.5, 0], [6, 3.5], [3.5, 7], [1, 3.5]], c)
    if (on) { p.px(3, 2, hex('#ffffff')); if (f % 4 === 0) p.px(4, 3, hex('#ffffff')) }
    p.outline(hex(OUT))
    return spr(p, 3, 15)
  })
}
/** Pedestal de uma lembrança (fica aceso quando ela volta). */
function pedestal(color: string, lit: boolean) {
  return memo(`ped:${color}:${lit}`, () => {
    const base = cyl(6, 12, lit ? '#4a4890' : '#34325a', lit ? color : '#4a4870')
    return base
  })
}
/** Placa do arquivo. */
function archiveSign() {
  return A.plaque('Arquivo da Memória', '#c8b8ff')
}

export default function build(): Scene {
  const things: Thing[] = []
  const add = (...ts: Thing[]) => { for (const t of ts) things.push(t) }
  S.feed = 0; S.fed = !!flag('l1_final')
  // estado inicial dos hologramas
  STOPS.forEach((s, i) => { const h = holo(s.id), d = done(i); h.k = d ? 1 : 0; h.want = d ? 1 : 0; h.live = false })

  /* ---------- o mapa: que casa é o quê ---------- */
  // 0 nada · 1 Memória Central · 2 ilha (cenário) · 3 ilha (praça) · 4 vila · 5 ponte
  const KIND = new Uint8Array(W * H), OWN = new Int8Array(W * H).fill(-1)
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : y * W + x)
  const setK = (x: number, y: number, k: number, o: number) => { const j = at(x, y); if (j >= 0) { KIND[j] = k; OWN[j] = o } }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x + 0.5 - HUB.x, dy = y + 0.5 - HUB.y, a = Math.atan2(dy, dx)
    if (Math.hypot(dx, dy) <= HUB.r + Math.sin(a * 5 + 0.7) * 0.45 + Math.sin(a * 3) * 0.35) setK(x, y, 1, -1)
  }
  STOPS.forEach((s, i) => {
    if (s.custom) return
    const [ox, oy] = ISL(i)
    for (let ly = 0; ly < IH; ly++) for (let lx = 0; lx < IW; lx++) {
      const corner = (ly === 0 || ly === IH - 1) && (lx === 0 || lx === IW - 1)
      const soft = (ly === 0 && (lx === 1 || lx === IW - 2)) || (ly === 1 && (lx === 0 || lx === IW - 1))
      if (corner || (soft && hash2(ox + lx, oy + ly, 21) < 0.5)) continue
      setK(ox + lx, oy + ly, ly >= 9 ? 3 : 2, i)
    }
  })
  for (let ly = 0; ly < 19; ly++) for (let lx = 0; lx < 26; lx++) {
    const x = V.x0 + lx, y = V.y0 + ly
    if ((ly === 0 || ly === 18) && (lx === 0 || lx === 25)) continue
    if (ly === 0 && hash2(x, y, 9) < 0.4) continue
    setK(x, y, 4, V.i)
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!KIND[y * W + x]) { const k = onBridge(x, y); if (k >= 0) setK(x, y, 5, k) } }
  // bordas irregulares: casinhas a mais nas laterais das ilhas, longe das pontes
  STOPS.forEach((s, i) => {
    if (s.custom) return
    const [ox, oy] = ISL(i), cand: P2[] = []
    for (let ly = 2; ly <= 7; ly++) cand.push([ox - 1, oy + ly], [ox + IW, oy + ly])
    for (let lx = 2; lx <= 7; lx++) cand.push([ox + lx, oy - 1])
    for (const [x, y] of cand) {
      if (hash2(x, y, 23) > 0.34 || at(x, y) < 0 || KIND[at(x, y)]) continue
      let ok = true
      for (let ey = -2; ey <= 2 && ok; ey++) for (let ex = -2; ex <= 2; ex++) { const j = at(x + ex, y + ey); if (j >= 0 && KIND[j] && (KIND[j] > 3 || KIND[j] === 1 || OWN[j] !== i)) { ok = false; break } }
      if (ok) setK(x, y, 2, i)
    }
  })
  const kindAt = (x: number, y: number) => { const j = at(x, y); return j < 0 ? 0 : KIND[j] }

  /* ---------- chão ---------- */
  const isVillage = (x: number, y: number) => kindAt(x, y) === 4
  const paddy = (x: number, y: number) => {
    if (!isVillage(x, y)) return false
    const lx = x - V.x0, ly = y - V.y0
    return (lx >= 1 && lx < 8 && ly >= 1 && ly < 5) || (lx >= 13 && lx < 20 && ly >= 0 && ly < 4) || (lx >= 1 && lx < 4 && ly >= 7 && ly < 11)
  }
  const ROAD: TileSpec = { s: 'road', a: '#8a7a9a', b: '#5a4e6a', c: '#a89ab8' }
  const PLAZA: TileSpec = { s: 'road', a: '#7a6e9a', b: '#4e4470', c: '#9a8eb8' }
  const GLASS: TileSpec = { s: 'glass', a: '#22305e', b: '#3a5aa0', c: '#7fd8ff' }
  const HUB_IN: TileSpec = { s: 'metal', a: '#4a4880', b: '#2e2c5a', c: '#7a78b8' }
  const HUB_MID: TileSpec = { s: 'tiles', a: '#5a5490', b: '#3a3460', c: '#6a64a8' }
  const HUB_OUT: TileSpec = { s: 'mosaic', a: '#4a4482', b: '#2e2a58', c: '#8a7ad8' }
  const villageTile = (x: number, y: number): TileSpec => {
    const lx = x - V.x0, ly = y - V.y0
    if (paddy(x, y)) return { s: 'water', a: '#5fa8a0', b: '#3f8880', c: '#a8e0d8' }
    if (lx >= 9 && lx < 24 && ly >= 8 && ly < 14) return { s: 'stone', a: '#c8b898', b: '#a89878', c: '#e0d0b0' }
    if (ly >= 14 && ly < 17) return ROAD
    if (ly < 14 && (lx === 11 || ly === 6)) return { s: 'earth', a: '#b88a5a', b: '#987040', c: '#d8aa7a' }
    return { s: 'grass', a: '#6aa84a', b: '#4a8a3a', c: '#ffe08a' }
  }
  const ground = (x: number, y: number): TileSpec | null => {
    const j = at(x, y)
    if (j < 0) return null
    switch (KIND[j]) {
      case 1: { const r = Math.hypot(x + 0.5 - HUB.x, y + 0.5 - HUB.y); return r < 3.6 ? HUB_IN : r < 9.4 ? HUB_MID : HUB_OUT }
      case 2: return ERAS[STOPS[OWN[j]].id].tile
      case 3: return PLAZA
      case 4: return villageTile(x, y)
      case 5: return GLASS
      default: return null
    }
  }
  const noWalk = (x: number, y: number) => paddy(x, y)
  const cliffAt = (x: number, y: number) => (kindAt(x, y) === 5 ? { depth: 9, a: '#3a4a8a', b: '#26306a', noFall: true } : null)

  /* ---------- as ilhas ---------- */
  STOPS.forEach((s, i) => {
    const P = PEOPLE[s.who]
    if (!s.custom) {
      const [ox, oy] = ISL(i)
      add(...shiftY(ERAS[s.id].props(XC(i)), DY(i)))
      const hp = HOLO_P(i), cp = CONSOLE_P(i)
      add({ x: hp[0], y: hp[1], sprite: () => A.projector(P.color, holo(s.id).live || done(i)) })
      add({ x: hp[0], y: hp[1] + 0.2, layer: 'ground', blend: 'lighter', hidden: () => !holo(s.id).live, sprite: glow(30, P.color, 0.4) })
      add(holoThing(s.id, s.who, hp))
      add({ x: cp[0] + 0.4, y: cp[1] + 0.4, solid: true, shadow: 0, sprite: () => A.consoleSprite(P.color, !!flag('l1_intro') && !done(i) && activeIndex() === i, anim(3)) })
      // cristais nos cantos de trás e lampiões na praça
      add({ x: ox + 1.3, y: oy + 1.4, z: 6, sprite: crystal(P.color, 0.8), shadow: 3, alpha: () => (done(i) ? 1 : 0.55) })
      add({ x: ox + 8.7, y: oy + 1.4, z: 6, sprite: crystal(P.color, 0.8), shadow: 3, alpha: () => (done(i) ? 1 : 0.55) })
      for (const lx of [0.55, 9.45]) {
        add({ x: ox + lx, y: oy + 9.15, sprite: () => A.lamppost('#ffd27a', done(i) || activeIndex() === i), shadow: 3 })
        add({ x: ox + lx, y: oy + 9.3, layer: 'ground', blend: 'lighter', hidden: () => !(done(i) || activeIndex() === i), sprite: glow(16, '#ffd27a', 0.2) })
      }
    }
    const pq = PLAQUE_P(i)
    add({ x: pq[0], y: pq[1], sprite: A.plaque(s.year, P.color), shadow: 3 })
    if (s.extra) { const e = EXTRA_P(i); add({ x: e[0], y: e[1], w: 0.6, d: 0.6, solid: true, hidden: () => !done(i), sprite: () => A.lectern(useGame.getState().quests[extraQuest(s.id)] === 'done') }) }
    addUses(i)
  })

  /* ---------- pontes: postes, névoa e bloqueios ---------- */
  const blockers: Blocker[] = []
  const fogK = BRIDGES.map((b) => (isOpen(b) ? 0 : 1))
  BRIDGES.forEach((b, k) => {
    const color = b.gate >= 0 ? PEOPLE[STOPS[b.gate].who].color : '#9fe9ff'
    for (let s = 1; s < b.pts.length; s++) {
      const [ax, ay] = b.pts[s - 1], [bx, by] = b.pts[s]
      const horiz = Math.abs(ay - by) < 1e-6
      const len = Math.hypot(bx - ax, by - ay)
      for (let d = 0.75; d < len; d += 1.5) {
        const cx = ax + ((bx - ax) * d) / len, cy = ay + ((by - ay) * d) / len
        for (const side of [-1, 1]) {
          const px = horiz ? cx : cx + side * 1.32, py = horiz ? cy + side * 1.32 : cy
          if (kindAt(Math.floor(px), Math.floor(py)) !== 5) continue
          const seed = Math.floor(px * 7 + py * 3)
          add({ x: px, y: py, sprite: () => railPost(color, isOpen(b), anim(3) + seed), shadow: 2 })
        }
      }
    }
    if (b.gate < 0) return
    // a névoa fica no meio da ponte
    const m = bridgeMid(b)
    let horiz = true
    for (let s = 1; s < b.pts.length; s++) {
      const [ax, ay] = b.pts[s - 1], [bx, by] = b.pts[s]
      if (Math.abs(ay - by) < 1e-6 && Math.abs(m[1] - ay) < 1e-6 && m[0] >= Math.min(ax, bx) - 1e-6 && m[0] <= Math.max(ax, bx) + 1e-6) { horiz = true; break }
      if (Math.abs(ax - bx) < 1e-6 && Math.abs(m[0] - ax) < 1e-6 && m[1] >= Math.min(ay, by) - 1e-6 && m[1] <= Math.max(ay, by) + 1e-6) { horiz = false; break }
    }
    for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) {
      const seed = k * 31 + (u + 1) * 3 + v + 1
      const fx = m[0] + (horiz ? u * 0.7 : v * 1.0), fy = m[1] + (horiz ? v * 1.0 : u * 0.7)
      add({ x: 0, y: 0, hidden: () => fogK[k] <= 0.01, pos: () => ({ x: fx + Math.sin(RT.time * 0.6 + seed) * 0.15, y: fy + Math.cos(RT.time * 0.4 + seed) * 0.2, z: 4 }), alpha: () => fogK[k], sprite: cloudPuff(seed % 7, '#b8a8f0', 56, 30) })
    }
    blockers.push(horiz ? { x0: m[0] - 0.2, y0: m[1] - 1.6, x1: m[0] + 0.2, y1: m[1] + 1.6, on: () => !isOpen(b) } : { x0: m[0] - 1.6, y0: m[1] - 0.2, x1: m[0] + 1.6, y1: m[1] + 0.2, on: () => !isOpen(b) })
  })

  /* ---------- a vila ---------- */
  const vy = V.y0
  add({ x: V.gate, y: vy + 13.6, w: 0.3, d: 3.8, sprite: A.gate() })
  add({ x: V.x0 + 9.4, y: vy + 0.9, w: 3, d: 2.4, solid: true, sprite: A.house(3, 2.4) })
  add({ x: V.x0 + 5.0, y: vy + 7.0, w: 3, d: 2.2, solid: true, sprite: A.house(3, 2.2) })
  add({ x: V.x0 + 21.2, y: vy + 0.8, w: 3, d: 2.6, solid: true, sprite: A.house(3, 2.6) })
  add({ x: V.x0 + 23.0, y: vy + 5.0, w: 2.6, d: 2.2, solid: true, sprite: A.house(2.6, 2.2) })
  V.boards.forEach((bx, k) => add({ x: bx, y: V.boardY, w: 0.2, d: 0.2, solid: true, sprite: A.recordBoard(k, RECORDS[k].n, RECORDS[k].total) }))
  add({ x: V.stall[0], y: V.stall[1], w: 2.2, d: 0.8, solid: true, sprite: A.stall() })
  add({ x: V.merchant[0], y: V.merchant[1], shadow: 5, sprite: () => personSprite('COMERCIANTE', LOOKS.COMERCIANTE, { x: -0.3, y: 1 }, 0, useGame.getState().dialog?.lines[useGame.getState().dialog!.i]?.who === 'COMERCIANTE' && Math.floor(RT.time * 2) % 3 === 0 ? 'think' : 'idle') })
  ;(['B', 'M', 'F'] as GK[]).forEach((k, j) => add({ x: V.baskets[j][0], y: V.baskets[j][1], w: 0.4, d: 0.4, solid: true, sprite: () => A.basket(k, flag('g2_rev') ? VALUES[k] : '?') }))
  add({ x: V.scale[0], y: V.scale[1], w: 0.5, d: 0.4, solid: true, sprite: () => A.scaleSprite(flag('g2_six') ? 6 : 0, flag('g2_pred') ? '25,5' : flag('g2_six') ? '?' : '') })
  add({ x: V.table[0], y: V.table[1], w: 2.4, d: 1.2, solid: true, sprite: A.woodTable() })
  add({ x: V.liu[0], y: V.liu[1], sprite: () => A.projector(PEOPLE.LIUHUI.color, holo(STOPS[V.i].id).live || done(V.i)) })
  add({ x: V.liu[0], y: V.liu[1] + 0.2, layer: 'ground', blend: 'lighter', hidden: () => !holo(STOPS[V.i].id).live, sprite: glow(30, PEOPLE.LIUHUI.color, 0.4) })
  add(holoThing(STOPS[V.i].id, 'LIUHUI', V.liu))
  for (const lx of [3, 9, 15, 21]) add({ x: V.x0 + lx + 0.5, y: vy + 13.6, sprite: () => A.lantern(anim(2) + lx), shadow: 3 })
  add({ x: V.x0 + 12.6, y: vy + 3.6, sprite: A.sheaf('B'), shadow: 3 }, { x: V.x0 + 8.4, y: vy + 8.4, sprite: A.sheaf('M'), shadow: 3 }, { x: V.x0 + 20.8, y: vy + 6.6, sprite: A.sheaf('F'), shadow: 3 })
  const pqv = PLAQUE_P(V.i)
  add({ x: pqv[0] + 18, y: pqv[1] - 0.2, sprite: () => A.bollard(anim(6)), shadow: 3 }, { x: pqv[0] + 6, y: pqv[1] - 0.2, sprite: () => A.bollard(anim(6) + 3), shadow: 3 })

  /* ---------- a Memória Central ---------- */
  add({ x: CORE[0] - 2, y: CORE[1] - 2, w: 4, d: 4, solid: true, sprite: A.coreBase() })
  add({ x: CORE[0] + 0.2, y: CORE[1] + 0.2, z: 0, pos: () => ({ x: CORE[0] + 0.2, y: CORE[1] + 0.2, z: 30 + Math.sin(RT.time * 1.5) * 4 }), sprite: () => crystal(flag('l1_final') ? '#9fe9ff' : '#6a5aa8', 2.6) })
  add({ x: CORE[0] + 0.2, y: CORE[1] + 0.2, z: 50, layer: 'top', blend: 'lighter', sprite: glow(44, '#9fe9ff', 0.5), alpha: () => (flag('l1_final') ? 0.9 : 0.2 + 0.05 * doneCount()) })
  STOPS.forEach((s, i) => add({ x: 0, y: 0, pos: () => { const a = RT.time * 0.5 + (i / STOPS.length) * Math.PI * 2; return { x: CORE[0] + 0.2 + Math.cos(a) * 3, y: CORE[1] + 0.2 + Math.sin(a) * 3, z: 26 + Math.sin(RT.time * 2 + i) * 5 } }, sprite: crystal(PEOPLE[s.who].color, 0.6), alpha: () => (done(i) ? 1 : 0.2) }))
  // os onze pedestais
  STOPS.forEach((s, i) => {
    const p = PEDESTAL(i), color = PEOPLE[s.who].color
    add({ x: p[0], y: p[1], w: 0.6, d: 0.6, solid: true, sprite: () => pedestal(color, done(i)) })
    add({ x: 0, y: 0, pos: () => ({ x: p[0] + 0.3, y: p[1] + 0.3, z: 20 + Math.sin(RT.time * 2 + i) * 2 }), sprite: crystal(color, 0.7), alpha: () => (done(i) ? 1 : 0.18) })
    add({ x: p[0] + 0.3, y: p[1] + 0.4, layer: 'ground', blend: 'lighter', hidden: () => !done(i), sprite: glow(18, color, 0.3) })
    add({ x: p[0] + 0.3, y: p[1] + 0.3, z: 34, hidden: () => !done(i), sprite: tokenTag(s.word, color) })
  })
  // estantes do arquivo na borda
  ;[-1.15, -0.45, 0.25, 1.45, 2.95, -2.85].forEach((a, k) => {
    const x = HUB.x + Math.cos(a) * 10.1, y = HUB.y + Math.sin(a) * 10.1
    add(k % 2 ? { x, y, w: 0.5, d: 1.6, solid: true, sprite: A.scrollRack() } : { x, y, w: 0.5, d: 1.8, solid: true, sprite: A.bookshelf(1.8) })
  })
  add({ x: START[0] - 2.4, y: START[1] + 0.8, w: 0.3, d: 0.3, solid: true, sprite: archiveSign() })
  add({ x: PORTAL_P[0], y: PORTAL_P[1], hidden: () => !flag('l1_done'), sprite: () => portalSprite(anim(8), '#c8a8ff'), shadow: 0 })
  add({ x: PORTAL_P[0], y: PORTAL_P[1] + 0.6, layer: 'ground', blend: 'lighter', hidden: () => !flag('l1_done'), sprite: glow(30, '#c8a8ff', 0.35) })
  addInteract({ id: 'l1_portal', x: PORTAL_USE[0], y: PORTAL_USE[1], r: 1.5, mz: 60, color: '#c8a8ff', label: 'Atravessar para a Fase 2', enabled: () => !!flag('l1_done'), use: () => start('l1_portal', async (c) => { c.objective(null); c.goto('p2') }) })

  /* ---------- habitantes ---------- */
  const ring = (r: number, n: number, a0 = 0): P2[] => Array.from({ length: n }, (_, k) => { const a = a0 + (k / n) * Math.PI * 2; return [HUB.x + Math.cos(a) * r, HUB.y + Math.sin(a) * r * 0.95] as P2 })
  const talking = (who: string) => { const d = useGame.getState().dialog; return !!d && d.lines[d.i]?.who === who }
  const npcs: Npc[] = []
  arq = makeNpc({ id: 'arquivista', route: ring(5.3, 10, 0.4), speed: 0.85, pause: 2.4, color: '#c8b8ff', label: 'Falar com o Arquivista',
    sprite: (n, f) => robotSprite('bibliotecario', ARQ_COLOR, n.dir, f, talking('ARQUIVISTA') && Math.floor(RT.time * 6) % 2 === 0),
    canTalk: () => !!flag('l1_intro'), talk: () => start('arquivista', arquivistaTalk) })
  const guard = makeNpc({ id: 'guardiao', route: ring(9.7, 16, 2.0), speed: 1.05, pause: 1.6, color: '#9fd0ff', label: 'Falar com o guardião',
    sprite: (n, f) => robotSprite('guardiao', '#4a7ad8', n.dir, f),
    talk: () => { emote('!', () => ({ x: guard.x, y: guard.y, z: 36 }), 1.2); SFX.play('bead'); useGame.getState().showToast('Guardião: Bip! Ninguém atravessa a névoa… só quem traz uma lembrança de volta.') } })
  const drone1 = makeNpc({ id: 'drone_arq', route: ring(6.6, 7, 1), speed: 1.2, fly: 52, pause: 1.4, sprite: (_, f) => droneSprite(f, '#c8d0e0', '#c8a8ff') })
  const isleRoute: P2[] = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => [ISL(i)[0] + 5, ISL(i)[1] + 5] as P2)
  isleRoute.splice(1, 0, [(V.x0 + V.x1) / 2, V.y0 + 9])
  const drone2 = makeNpc({ id: 'drone_ilhas', route: isleRoute, speed: 2.2, fly: 84, pause: 2, sprite: (_, f) => droneSprite(f + 1, '#d8c8a8', '#ffd27a') })
  npcs.push(arq, guard, drone1, drone2)
  add(npcThing(arq), npcThing(guard), npcThing(drone1), npcShadow(drone1, 5), npcThing(drone2))
  npcTalk(arq); npcTalk(guard)
  // criaturinhas de cada ilha: dormem até a lembrança voltar
  const critters: { n: Npc; i: number }[] = []
  STOPS.forEach((s, i) => {
    if (s.custom) return
    const [ox, oy] = ISL(i), color = PEOPLE[s.who].color
    const bits = s.id === 'binario' || s.id === 'bit'
    for (let k = 0; k < (bits ? 3 : 2); k++) {
      const r: P2[] = [[ox + 5.4 + k * 0.6, oy + 9.7], [ox + 8.4, oy + 10.1 + k * 0.4], [ox + 7.4 - k, oy + 11.2], [ox + 4.8, oy + 10.9 - k * 0.3]]
      const n = makeNpc({ id: `crit${i}_${k}`, route: k % 2 ? r.slice().reverse() : r, speed: 0.9 + k * 0.2, hop: true, pause: 1.6,
        sprite: (nn, f) => bits ? (done(i) ? bitSprite(k % 2 ? '0' : '1', f) : bitSprite(k % 2 ? '0' : '1', 0)) : done(i) ? tokenBody(color, f) : tokenBody('#6a6a84', Math.floor(RT.time * 0.8), 'dormindo') })
      n.idx = k % r.length
      n.x = r[k % r.length][0]; n.y = r[k % r.length][1]
      critters.push({ n, i })
      add(npcThing(n), npcShadow(n, 3))
    }
  })
  // gente da vila
  const farmer = (id: string, look: typeof LOOKS.COMERCIANTE, route: P2[], speed: number) => {
    const n = makeNpc({ id, route, speed, pause: 2.2, sprite: (nn, f) => personSprite(id, look, nn.dir, nn.moving ? f : 0, nn.moving ? 'walk' : 'idle') })
    npcs.push(n); add(npcThing(n))
    return n
  }
  farmer('FAZ1', { ...LOOKS.COMERCIANTE, top: '#8a5a3a', inner: '#e8d8b0', acc: 'straw' }, [[V.x0 + 4.5, vy + 6.5], [V.x0 + 11.5, vy + 6.5], [V.x0 + 19.6, vy + 6.5], [V.x0 + 11.5, vy + 6.5]], 0.8)
  farmer('FAZ2', { ...LOOKS.COMERCIANTE, skin: '#d8a070', hair: '#2a2018', top: '#5a8a4a', inner: '#e8e0c8', acc: 'none' }, [[V.x0 + 5, vy + 16.2], [V.x0 + 16, vy + 16.4], [V.x0 + 24, vy + 15.8], [V.x0 + 16, vy + 16.4]], 0.7)
  // as palavras recuperadas seguem o NEX (as 3 mais recentes)
  const followers = () => STOPS.map((s, i) => ({ s, i })).filter(({ i }) => done(i)).slice(-3).reverse()
  for (let k = 0; k < 3; k++) {
    const pos = () => {
      const f = followerPos(k, 6)
      const hop = Math.abs(Math.sin(RT.time * 6 + k * 1.3)) * 4
      if (S.feed <= 0) return { x: f.x, y: f.y, z: hop }
      const e = Math.min(1, S.feed * 1.15 - k * 0.08), q = Math.max(0, e)
      return { x: f.x + (CORE[0] + 0.2 - f.x) * q, y: f.y + (CORE[1] + 0.2 - f.y) * q, z: hop + Math.sin(q * Math.PI) * 60 + q * 30 }
    }
    const hide = () => { const fl = followers(); return !flag('l1_intro') || S.fed || k >= fl.length }
    const colorOf = () => { const fl = followers()[k]; return fl ? PEOPLE[fl.s.who].color : '#ffffff' }
    add({ x: 0, y: 0, hidden: hide, pos, sprite: () => tokenBody(colorOf(), anim(6) + k), shadow: 3 })
    add({ x: 0, y: 0, hidden: hide, pos: () => { const p = pos(); return { ...p, z: (p.z || 0) + 17 } }, sprite: () => { const fl = followers()[k]; return fl ? tokenTag(fl.s.word, PEOPLE[fl.s.who].color) : null } })
  }

  /* ---------- pintura do chão ---------- */
  const cyan = hex('#59d7ff'), cyanD = hex('#2a7ab0'), gold = hex('#ffd27a'), goldD = hex('#a87a2a'), flower = [hex('#ffe08a'), hex('#ff9ad0'), hex('#bff3ff')]
  const eachPx = (p: Pix, x: number, y: number, tx: number, ty: number, f: (wx: number, wy: number) => number) => {
    for (let py = 0; py < 16; py++) for (let px = 0; px < 32; px++) {
      if (Math.abs(px + 0.5 - 16) / 16 + Math.abs(py + 0.5 - 8) / 8 > 1) continue
      const X = px + 0.5 - 16, Y = py + 0.5
      const c = f(x + (X / 16 + Y / 8) / 2, y + (Y / 8 - X / 16) / 2)
      if (c) p.px(tx - 16 + px, ty + py, c)
    }
  }
  const paint = (p: Pix, x: number, y: number, tx: number, ty: number) => {
    const j = at(x, y), k = KIND[j]
    if (k === 1) {
      eachPx(p, x, y, tx, ty, (wx, wy) => {
        const r = Math.hypot(wx - HUB.x, wy - HUB.y)
        if (Math.abs(r - 3.6) < 0.05 || Math.abs(r - 9.4) < 0.05) return gold
        if (Math.abs(r - 3.6) < 0.1 || Math.abs(r - 9.4) < 0.1) return goldD
        // raios do centro até cada pedestal
        const a = Math.atan2(wy - HUB.y, wx - HUB.x)
        for (let i = 0; i < STOPS.length; i++) {
          const pa = -Math.PI * 0.75 + (i / STOPS.length) * Math.PI * 2
          let d = a - pa; d = Math.atan2(Math.sin(d), Math.cos(d))
          if (r > 3.7 && r < 7.0 && Math.abs(d * r) < 0.05) return cyanD
        }
        return 0
      })
    } else if (k === 5) {
      const b = BRIDGES[OWN[j]]
      eachPx(p, x, y, tx, ty, (wx, wy) => {
        for (let s = 1; s < b.pts.length; s++) {
          const [ax, ay] = b.pts[s - 1], [bx, by] = b.pts[s]
          const horiz = Math.abs(ay - by) < 1e-6
          const along = horiz ? wx : wy, cross = horiz ? wy - ay : wx - ax
          const lo = Math.min(horiz ? ax : ay, horiz ? bx : by) - 1.5, hi = Math.max(horiz ? ax : ay, horiz ? bx : by) + 1.5
          if (along < lo || along > hi) continue
          if (Math.abs(cross) < 0.05 && (along % 1 + 1) % 1 < 0.55) return cyan
          if (Math.abs(Math.abs(cross) - 1.25) < 0.04) return cyanD
        }
        return 0
      })
    } else if (k === 3) {
      const i = OWN[j], oy = ISL(i)[1]
      if (y === oy + 9) { const c = hex(PEOPLE[STOPS[i].who].color); eachPx(p, x, y, tx, ty, (wx, wy) => (Math.abs(wy - (oy + 9)) < 0.05 ? c : 0)) }
    } else if (k === 4) {
      if (paddy(x, y)) for (let q = 0; q < 4; q++) A.riceTuft(p, tx - 8 + (q % 2) * 16, ty + 5 + (q > 1 ? 6 : 0) + (q % 2 ? 0 : 2), q + x)
      const g = villageTile(x, y)
      if (g.s === 'grass' && hash2(x, y, 13) < 0.35) { const fx = tx - 6 + Math.floor(hash2(x, y, 3) * 12), fy = ty + 5 + Math.floor(hash2(x, y, 5) * 6); p.px(fx, fy, flower[Math.floor(hash2(x, y, 7) * 3)]); p.px(fx, fy + 1, hex('#2a5a3a')) }
    }
  }

  /* ---------- luzes correndo ---------- */
  const bridgePulse = BRIDGES.map((b) => pulses([b.pts], '#bff3ff', 2.4, 2.6))
  const hubPulse = pulses([Array.from({ length: 41 }, (_, k) => { const a = (k / 40) * Math.PI * 2; return [HUB.x + Math.cos(a) * 9.4, HUB.y + Math.sin(a) * 9.4] as P2 })], '#ffe6a8', 1.6, 3.2)
  const pedPulse = STOPS.map((s, i) => { const p = PEDESTAL(i), a = -Math.PI * 0.75 + (i / STOPS.length) * Math.PI * 2; return pulses([[[p[0] + 0.3, p[1] + 0.3], [HUB.x + Math.cos(a) * 3.7, HUB.y + Math.sin(a) * 3.7]]], PEOPLE[s.who].color, 1.4, 1.5) })

  /* ---------- onde o NEX aparece ---------- */
  const n0 = nextIndex()
  let spawn: P2 = START
  if (flag('l1_final')) spawn = [CORE_USE[0], CORE_USE[1] + 0.6]
  else if (flag('l1_intro') && n0 > 0) spawn = STOPS[n0].custom === 'graos' ? [V.x0 + 1.2, vy + 15.5] : STAND_P(n0)
  else if (flag('l1_intro') && n0 < 0) spawn = STAND_P(STOPS.length - 1)

  let emoteT = 4
  return {
    w: W, h: H, ground, things, blockers, noWalk, paint, cliffAt,
    cliff: { a: '#5a4a7a', b: '#3e3260', depth: 38 },
    falls: { density: 0.05, color: '#9f8aff' },
    spawn: { pos: spawn, dir: [1, 0] },
    bg: dataRainBg('#05040f', '#2a1e58', '#6a4ac8'),
    scripts: [main],
    novaZ: 9,
    init: () => {
      RT.novaOn = true
      G().setOverlay('l1mem', <MemoryStrip />)
      // rastro inicial atrás do NEX (as palavras que o seguem começam atrás dele)
      RT.trail.length = 0
      for (let n = 0; n < 40; n++) RT.trail.push([spawn[0] - n * 0.12, spawn[1] - n * 0.03])
    },
    under: (ctx, t) => {
      hubPulse(ctx, t)
      BRIDGES.forEach((b, k) => { if (isOpen(b)) bridgePulse[k](ctx, t) })
      STOPS.forEach((_, i) => { if (done(i)) pedPulse[i](ctx, t) })
    },
    update: (dt) => {
      for (const id in HOLO) { const h = HOLO[id]; h.k += (h.want - h.k) * Math.min(1, dt * 2.5) }
      BRIDGES.forEach((b, k) => { const want = isOpen(b) ? 0 : 1; fogK[k] += (want - fogK[k]) * Math.min(1, dt * 0.8) })
      updateNpcs(npcs, dt)
      updateNpcs(critters.filter((c) => done(c.i)).map((c) => c.n), dt)
      syncTalk(npcs, INTERACTS)
      // faíscas subindo do núcleo
      if (Math.random() < dt * (3 + doneCount())) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * 1.6
        RT.particles.push({ x: CORE[0] + 0.2 + Math.cos(a) * r, y: CORE[1] + 0.2 + Math.sin(a) * r, z: 20, vx: 0, vy: 0, vz: 18 + Math.random() * 18, life: 2.4, max: 2.4, c: Math.random() < 0.5 ? '#ffe6a8' : '#bff3ff', s: 1, g: -4 })
      }
      // brilhos subindo das ilhas acesas (e poeira cinza nas apagadas)
      if (Math.random() < dt * 6) {
        const i = Math.floor(Math.random() * STOPS.length), s = STOPS[i]
        const [ox, oy] = s.custom ? [V.x0 + 4, V.y0 + 2] : ISL(i), w = s.custom ? 18 : IW, h = s.custom ? 12 : 9
        const x = ox + Math.random() * w, y = oy + Math.random() * h
        if (Math.hypot(x - RT.player.x, y - RT.player.y) < 16) {
          const lit = done(i)
          RT.particles.push({ x, y, z: 6, vx: 0, vy: 0, vz: lit ? 14 + Math.random() * 10 : 5, life: lit ? 2.2 : 3, max: lit ? 2.2 : 3, c: lit ? PEOPLE[s.who].color : '#8a84a8', s: 1, g: lit ? -2 : 0 })
        }
      }
      // criaturinhas felizes de vez em quando
      emoteT -= dt
      if (emoteT <= 0) {
        emoteT = 5 + Math.random() * 5
        const near = critters.filter((c) => done(c.i) && Math.hypot(c.n.x - RT.player.x, c.n.y - RT.player.y) < 7)
        const c = near[Math.floor(Math.random() * near.length)]
        if (c) emote(Math.random() < 0.5 ? '♪' : '♥', () => ({ x: c.n.x, y: c.n.y, z: 22 }), 1.4)
      }
    },
    onExit: () => { G().setOverlay(OV, null); G().setOverlay(BIG, null); G().setOverlay(PH, null); G().setOverlay('l1mem', null); arq = null },
  }
}
