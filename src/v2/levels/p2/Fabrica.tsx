import { Pix, hex, hash2, darker, lighter } from '../../engine/pix'
import { box, glow, memo } from '../../art/core'
import { crystal, portalSprite } from '../../art/fx'
import { robotSprite, tokenBody, tokenTag, droneSprite } from '../../art/creatures'
import { RT, addInteract, gesture, emote, emoteNex, INTERACTS, type Scene, type Thing, type TileSpec, type Blocker } from '../../engine/runtime'
import { makeNpc, npcThing, npcShadow, npcTalk, updateNpcs, syncTalk, followerPos, type Npc } from '../../engine/npc'
import { SFX } from '../../engine/audio'
import { start, type Ctx } from '../../engine/script'
import { G, useGame, type P2 } from '../../store'
import { show, openDoc, readAgain, OV } from '../p1/Doc'
import * as A1 from '../p1/art'
import { walkTo, fallIn, pulses, dataRainBg, tween } from '../common'
import { registerRobot } from '../robots'
import { QUESTION, GROUPS } from '../../content/llm'
import { ZONES, zoneFlag, ZI, type Zone } from './zones'
import { P2GameView, P2PipelineView, WORLD } from './games'
import { W, H, ZW, ZH, ZO, CORRS, inCorr, beltLane, START, MACHINE, PROMPT_USE, PORTAL_P, PORTAL_USE, type Room, type Corr } from './layout'
import * as A from './art'

/* =========================================================
   FASE 2 · DENTRO DA LLM — A FÁBRICA DE PREVISÕES (pixel art)
   A pergunta “Qual é a capital do Brasil?” chegou à Engine.
   Oito estações desligadas, cada uma com um robô. Em cada uma,
   uma ideia de como a LLM funciona por dentro. No fim, a Engine
   responde a pergunta passo a passo.
   ========================================================= */
const flag = (k: string) => G().flags[k] || 0
const done = (i: number) => !!flag(zoneFlag(ZONES[i].id))
const nextZone = () => ZONES.findIndex((_, i) => !done(i))
const doneCount = () => ZONES.filter((_, i) => done(i)).length
const isOpen = (c: Corr) => c.gate < 0 || done(c.gate)
const portrait = () => innerWidth / innerHeight < 0.8
for (const z of ZONES) registerRobot(z.host, z.hostName, z.kind, z.color)

/* ---------- Vale dos Vetores: o mapa das palavras ---------- */
const [vx0, vy0] = ZO('vetores')
const DIST: Record<string, P2> = { paises: [vx0 + 2.6, vy0 + 2.4], capitais: [vx0 + 9.4, vy0 + 3.4], comida: [vx0 + 6.4, vy0 + 6.6], futebol: [vx0 + 2.4, vy0 + 9.6], economia: [vx0 + 10.4, vy0 + 9.6] }
const ARROW: P2 = [DIST.capitais[0] - DIST.paises[0], DIST.capitais[1] - DIST.paises[1]]
/** Posições das estrelas em volta do centro do bairro (em diagonal, para as etiquetas não se cobrirem). */
const SLOT: P2[] = [[-0.25, -1.55], [-0.95, 0.35], [0.95, -0.35], [0.25, 1.55]]
const STAR_WORDS: Record<string, (string | null)[]> = {
  paises: ['Brasil', 'França', 'Itália', 'Portugal'],
  capitais: ['Brasília', 'Paris', 'Roma', null],
  futebol: ['gol', 'bola', 'craque', null],
  economia: ['PIB', 'dólar', 'imposto', null],
  comida: ['banana', 'feijão', 'arroz', 'café'],
}
const STARS: { w: string; g: string; dx: number; dy: number }[] = Object.entries(STAR_WORDS).flatMap(([g, ws]) => ws.map((w, k) => (w ? { w, g, dx: SLOT[k][0], dy: SLOT[k][1] } : null)).filter((x): x is { w: string; g: string; dx: number; dy: number } => !!x))
const LOST = [
  { w: 'Madri', g: 'capitais', at: [vx0 + 5.6, vy0 + 2.0] as P2, why: 'Madri é a capital da Espanha!' },
  { w: 'pênalti', g: 'futebol', at: [vx0 + 6.6, vy0 + 2.9] as P2, why: 'Pênalti é coisa de futebol!' },
  { w: 'salário', g: 'economia', at: [vx0 + 5.5, vy0 + 3.6] as P2, why: 'Salário é dinheiro: economia!' },
]
const lostFlag = (w: string) => 'p2v_' + w
const PORTUGAL: P2 = [DIST.paises[0] + SLOT[3][0], DIST.paises[1] + SLOT[3][1]]
const LISBOA: P2 = [PORTUGAL[0] + ARROW[0], PORTUGAL[1] + ARROW[1]]
const BRASIL: P2 = [DIST.paises[0] + SLOT[0][0], DIST.paises[1] + SLOT[0][1]]
const BRASILIA: P2 = [DIST.capitais[0] + SLOT[0][0], DIST.capitais[1] + SLOT[0][1]]
const V = { carry: null as null | string, hosts: [] as Npc[], showAll: false }
/** As etiquetas das estrelas aparecem quando o NEX chega perto do bairro. */
const near = (g: string) => {
  if (V.showAll) return true
  let best = '', bd = 2.7
  for (const k in DIST) { const d = Math.hypot(RT.player.x - DIST[k][0], RT.player.y - DIST[k][1]); if (d < bd) { bd = d; best = k } }
  return best === g
}

/* ---------- uma estação ---------- */
async function meetHost(c: Ctx, i: number) {
  const h = V.hosts[i]
  const dx = RT.player.x - h.x, dy = RT.player.y - h.y, d = Math.hypot(dx, dy) || 1
  if (d > 1.6) await walkTo(c, [h.x + (dx / d) * 1.2, h.y + (dy / d) * 1.2])
  c.freeze(true)
  RT.lookAt = [h.x, h.y]
  c.focus([(RT.player.x + h.x) / 2, (RT.player.y + h.y) / 2 + 0.5], 2, portrait() ? 30 : 22)
}
async function runZone(c: Ctx, i: number) {
  const z = ZONES[i]
  c.objective(null)
  await meetHost(c, i)
  try {
    if (!c.flag('p2i_' + z.id)) { await c.say(z.intro); c.setFlag('p2i_' + z.id) }
    if (z.id === 'vetores') {
      if (!LOST.every((l) => c.flag(lostFlag(l.w)))) await c.say({ who: 'VETORA', text: 'As palavras perdidas estão pulando ali perto da entrada. Toque numa para pegar, e solte no bairro certo.' })
      else if (!c.flag('p2v_lisboa')) await c.say({ who: 'VETORA', text: 'Siga a seta brilhante a partir de Portugal. Onde ela termina, mora a resposta!' })
      return
    }
    if (z.play) await c.say({ who: z.host, text: z.play })
    await show(c, (d) => <P2GameView game={z.id} who={z.host} onDone={d} />)
    await zoneEnd(c, i)
  } finally {
    RT.lookAt = null
    c.unfocus(); c.freeze(false)
  }
}
async function zoneEnd(c: Ctx, i: number) {
  const z = ZONES[i]
  await c.say(z.after)
  await openDoc(c, z.doc)
  c.setFlag(zoneFlag(z.id))
  G().pushBanner({ kind: 'station', title: z.word, sub: `Estação ${i + 1} · ${z.name}` })
  SFX.play('core'); gesture('cheer', 1.8)
  RT.cam.shake = 0.3
  await c.wait(1.3)
  await c.say({ who: 'ENGINE', text: z.engine })
  for (const id of z.codex) c.discover(id)
  if (z.id === 'tokens') { RT.trail.length = 0; for (let n = 0; n < 60; n++) RT.trail.push([RT.player.x - n * 0.1, RT.player.y]); await c.wait(0.4) }
  // a barreira seguinte se apaga
  const nx = CORRS.find((k) => k.gate === i && k.belt)
  if (nx && nextZone() >= 0) {
    c.focus(nx.mid, 1, 22)
    await c.wait(0.5)
    SFX.play('whoosh')
    await c.wait(1.5)
  }
}

/* ---------- Vale dos Vetores (no mundo) ---------- */
function pickLost(w: string) {
  if (V.carry) return
  V.carry = w
  SFX.play('bead'); gesture('reach', 0.5)
  RT.carry = () => tokenTag(w, '#fff3d6', '#1a2a5a')
}
function dropLost(g: string) {
  const w = V.carry
  if (!w) return
  const L = LOST.find((l) => l.w === w)!
  if (L.g !== g) {
    SFX.play('error'); emoteNex('?', 1.2)
    useGame.getState().showToast(`Hum… “${w}” não mora em ${GROUPS[g].name}. Pense no que essa palavra quer dizer.`)
    return
  }
  V.carry = null; RT.carry = null
  G().setFlag(lostFlag(w))
  SFX.play('chime'); emoteNex('★', 1.2)
  useGame.getState().showToast(`Isso! ${L.why}`)
  if (LOST.every((l) => G().flags[lostFlag(l.w)])) start('p2v_arrow', arrowScene)
}
async function arrowScene(c: Ctx) {
  await c.until(() => !G().dialog)
  c.freeze(true)
  try {
    V.showAll = true
    c.focus([(BRASIL[0] + BRASILIA[0]) / 2, (BRASIL[1] + BRASILIA[1]) / 2], 1, 20)
    await c.wait(0.8)
    await c.say([
      { who: 'VETORA', text: 'Perfeito! Cada palavra no seu bairro. Agora um truque: de Brasil até Brasília existe uma seta. É a seta do “capital de”.' },
      { who: 'VETORA', text: 'Se você der o mesmo passo a partir de Portugal, onde cai? Siga a seta brilhante e descubra.' },
    ])
    c.setFlag('p2v_arrow')
  } finally { V.showAll = false; c.unfocus(); c.freeze(false) }
}
async function lisboaScene(c: Ctx) {
  const i = ZI('vetores')
  c.objective(null)
  c.freeze(true)
  RT.lookAt = LISBOA
  c.focus(LISBOA, 2, 20)
  try {
    SFX.play('discover')
    c.setFlag('p2v_lisboa')
    emoteNex('ideia', 1.4)
    await c.wait(1.2)
    await zoneEnd(c, i)
  } finally { RT.lookAt = null; c.unfocus(); c.freeze(false) }
}

/* ---------- abertura ---------- */
async function intro(c: Ctx) {
  c.freeze(true)
  RT.nexHidden = true
  const [px, py] = ZO('prever'), [ax, ay] = ZO('atencao')
  await c.cinematic([
    { pos: [ax + 7, ay + 6], zoom: 1, h: 40, cut: true },
    { pos: [ZO('roleta')[0] + 7, ZO('roleta')[1] + 4], zoom: 1, h: 40, dur: 3.2 },
    { pos: [px + 7, py + 6], zoom: 1, h: 40, dur: 3.2 },
    { pos: START, zoom: 2, h: 14, dur: 2 },
  ])
  c.focus(START, 2, 14)
  RT.nexHidden = false
  await fallIn(c)
  RT.lookAt = MACHINE
  await c.say([
    { who: 'NEX', text: 'Uau… que barulho é esse? Parece uma fábrica!' },
    { who: 'NOVA', text: 'É o coração da Language Engine: a Fábrica de Previsões. É aqui que ela transforma uma pergunta em resposta.' },
    { who: 'ENGINE', text: 'Chegou… uma pergunta. “Qual é a capital do Brasil?” Eu sei que sei… mas não lembro como eu faço.' },
    { who: 'NOVA', text: 'A fábrica tem oito estações. Em cada uma, um robô cuida de uma parte do trabalho. O choque deixou todas desligadas.' },
    { who: 'NOVA', text: 'Ajude cada robô e aprenda o que ele faz. Cada estação religada apaga a barreira do corredor seguinte.' },
    { who: 'NEX', text: 'E no fim, a Engine responde a pergunta?' },
    {
      who: 'NOVA', text: 'Se tudo voltar a funcionar, sim! Quer saber mais alguma coisa?', choices: [
        { label: 'O que são essas esteiras?', next: [{ who: 'NOVA', text: 'Elas levam as palavras de uma estação para a outra. Pise nelas para andar mais rápido!' }] },
        { label: 'O que é uma LLM, mesmo?', next: [{ who: 'NOVA', text: 'Um modelo de linguagem grande: um programa que aprendeu, com muito texto, a prever a próxima palavra. A Engine é uma LLM.' }] },
        { label: 'Vamos lá!', next: [{ who: 'NOVA', text: 'Primeira parada: a Oficina do Adivinho, subindo a esteira!' }] },
      ],
    },
  ])
  RT.lookAt = null
  c.setFlag('p2_intro')
  c.unfocus(); c.freeze(false)
}

/* ---------- final ---------- */
const FIN = { feed: 0, fed: false }
async function finale(c: Ctx) {
  c.objective(null)
  await walkTo(c, PROMPT_USE)
  c.freeze(true)
  RT.lookAt = [MACHINE[0] + 1.5, MACHINE[1] + 1]
  c.focus([MACHINE[0] + 1.5, MACHINE[1] + 2.4], 2, 34)
  try {
    await c.say([
      { who: 'ENGINE', text: 'As oito estações… funcionando! E os tokens da pergunta chegaram.' },
      { who: 'NOVA', text: 'Coloquem os tokens na máquina, NEX. Vamos ver a Engine responder.' },
    ])
    SFX.play('chime')
    await tween(c, 1.8, (k) => { FIN.feed = k })
    FIN.fed = true
    SFX.play('core'); RT.cam.shake = 0.5
    await c.wait(0.8)
    await c.say({ who: 'ENGINE', text: 'Vou mostrar cada passo, com tudo o que você me ajudou a lembrar.' })
    await show(c, (d) => <P2PipelineView onDone={d} />)
    c.setFlag('p2_final')
    gesture('cheer', 2)
    await c.say([
      { who: 'ENGINE', text: '“A capital do Brasil é Brasília.” Eu lembro como eu funciono por dentro!' },
      { who: 'NEX', text: 'Tokens, vetores, atenção, camadas, chances e a roleta. Uma palavra de cada vez!' },
      { who: 'NOVA', text: 'E tudo isso só funciona porque os pesos foram treinados com muito texto.' },
    ])
    c.core('TRANSFORMER', 'TRANSFORMER CORE')
    c.discover('transformer')
    await c.wait(1.8)
    await c.say([
      { who: 'NOVA', text: 'A Engine recuperou o segundo núcleo! Você terminou a Fase 2: Dentro da LLM.' },
      { who: 'ENGINE', text: 'NEX… no meu laboratório existe uma LLM bebê. Vazia. Ela não sabe nada ainda.' },
      { who: 'NEX', text: 'Uma LLM bebê? E se… a gente criasse uma do zero?' },
      { who: 'NOVA', text: 'Escolher os textos, treinar, testar, ajustar… Você já sabe tudo o que precisa. O portal do laboratório está aberto!' },
    ])
    c.setFlag('p2_done')
    SFX.play('portal')
    await c.cinematic([{ pos: [PORTAL_P[0] - 1, PORTAL_P[1]], zoom: 1, h: 26, dur: 2 }, { pos: [PORTAL_P[0] - 1, PORTAL_P[1]], zoom: 1, h: 26, dur: 1 }], false)
  } finally { RT.lookAt = null; c.unfocus(); c.freeze(false) }
}

/* ---------- roteiro principal ---------- */
async function main(c: Ctx) {
  RT.novaOn = true
  if (!c.flag('p2_intro')) await intro(c)
  for (;;) {
    const i = nextZone()
    if (i < 0) break
    const z = ZONES[i]
    const h = V.hosts[i]
    if (z.id === 'vetores' && c.flag('p2i_vetores')) {
      const left = () => LOST.filter((l) => !G().flags[lostFlag(l.w)])
      if (left().length) {
        const n = lostNpcs.find((q) => q.id === 'lost_' + left()[0].w)
        if (V.carry) c.objective(`Leve “${V.carry}” ao bairro certo`)
        else c.objective(`Leve as palavras perdidas aos bairros (${3 - left().length}/3)`, n ? [n.x, n.y] : undefined)
        const k0 = left().length, carry0 = V.carry
        await c.until(() => left().length !== k0 || V.carry !== carry0)
        continue
      }
      if (!c.flag('p2v_arrow')) { await c.until(() => !!G().flags.p2v_arrow); continue }
      c.objective('Siga a seta a partir de Portugal', LISBOA)
      await c.until(() => done(i))
    } else {
      c.objective(z.hint, h ? [h.route[0][0], h.route[0][1]] : null)
      await c.until(() => done(i) || (z.id === 'vetores' && !!G().flags.p2i_vetores))
    }
    await c.until(() => !G().focus && !G().dialog)
  }
  if (!c.flag('p2_final')) {
    c.objective('Leve a pergunta até a Sala do Prompt', PROMPT_USE)
    c.say({ who: 'NOVA', text: 'As oito estações estão funcionando! Vamos levar os tokens da pergunta até a máquina, na Sala do Prompt.' }, { ambient: true }).catch(() => {})
    await c.reach(PROMPT_USE, 1.6)
    await finale(c)
  }
  c.objective('Atravesse o portal para a Fase 3', PORTAL_USE)
}

/* ---------- o mundo ---------- */
let lostNpcs: Npc[] = []
const ROOM_TILE: Record<Room, TileSpec> = {
  centro: { s: 'metal', a: '#3a4470', b: '#262c4e', c: '#5a6aa0' },
  prever: { s: 'wood', a: '#8a5a3a', b: '#5a3a24' },
  tokens: { s: 'metal', a: '#5a4a5a', b: '#3a2e3a', c: '#7a6a7a' },
  vetores: { s: 'circuit', a: '#121c40', b: '#0a1028', c: '#2a4a8a' },
  atencao: { s: 'tiles', a: '#4a2e52', b: '#2e1a36', c: '#5a3a62' },
  camadas: { s: 'metal', a: '#3a4270', b: '#262a4e', c: '#6a78c0' },
  roleta: { s: 'carpet', a: '#7a1e2e', b: '#5a1420', c: '#c8a040' },
  treino: { s: 'tiles', a: '#4a4a56', b: '#2e2e38', c: '#5a5a68' },
  rag: { s: 'wood', a: '#5a3e2a', b: '#3a2818' },
}
const ROOM_COLOR: Record<Room, string> = { centro: '#9fe9ff', prever: '#b07aff', tokens: '#ff6a5a', vetores: '#59d7ff', atencao: '#ffd27a', camadas: '#7a8cff', roleta: '#ff7ab8', treino: '#ffb35a', rag: '#8ff0b0' }
const anim = (fps: number) => Math.floor(RT.time * fps)

/** Parede de fundo com uma faixa de luz da cor da sala. */
function wallSeg(axis: 'x' | 'y', len: number, color: string) {
  return memo(`p2wall:${axis}:${len}:${color}`, () => {
    const fn = (u: number, zz: number, x: number) => {
      if (zz > 25) return hex('#5a5e80')
      if (Math.abs(zz - 17) < 1.2) return hex(color)
      if (zz < 3) return hex('#1b1e30')
      const seam = Math.floor(x / 24) !== Math.floor((x + 1) / 24)
      return seam ? hex('#20243a') : hex(zz % 9 < 1 ? '#2e3250' : '#2a2e48')
    }
    return axis === 'x' ? box(len, 0.25, 27, '#2a2e48', { top: '#4a4e70', leftFn: fn }) : box(0.25, len, 27, '#2a2e48', { top: '#4a4e70', rightFn: (v, zz, x) => fn(v, zz, x) })
  })
}

export default function build(): Scene {
  const things: Thing[] = []
  const add = (...ts: Thing[]) => { for (const t of ts) things.push(t) }
  FIN.feed = 0; FIN.fed = !!flag('p2_final')
  V.carry = null
  WORLD.camadas = done(ZI('camadas')) ? 3 : 0
  WORLD.treino = done(ZI('treino')) ? 1 : 0

  /* ---------- planta ---------- */
  const ROOMS = Object.keys(ROOM_TILE) as Room[]
  const roomAt = (x: number, y: number): Room | null => {
    for (const r of ROOMS) {
      const [ox, oy] = ZO(r), lx = x - ox, ly = y - oy
      if (lx < 0 || ly < 0 || lx >= ZW || ly >= ZH) continue
      if ((lx === 0 || lx === ZW - 1) && (ly === 0 || ly === ZH - 1)) return null
      return r
    }
    return null
  }
  const corrAt = (x: number, y: number) => CORRS.find((c) => inCorr(c, x, y)) || null
  const WALK: TileSpec = { s: 'metal', a: '#3a3e5a', b: '#262a40', c: '#5a5e80' }
  const BELT: TileSpec = { s: 'metal', a: '#24242e', b: '#16161e', c: '#3a3a48' }
  const ground = (x: number, y: number): TileSpec | null => {
    if (x < 0 || y < 0 || x >= W || y >= H) return null
    const r = roomAt(x, y)
    if (r) return ROOM_TILE[r]
    const c = corrAt(x, y)
    if (c) return c.belt && beltLane(c, x, y) ? BELT : WALK
    return null
  }
  const cliffAt = (x: number, y: number) => (corrAt(x, y) ? { depth: 12, a: '#3a3e5a', b: '#262a40', noFall: true } : null)
  const flow = (x: number, y: number): [number, number] | null => {
    const c = corrAt(x, y)
    if (!c || !c.belt || !beltLane(c, x, y) || !isOpen(c)) return null
    return c.axis === 'x' ? [1.7 * c.dir, 0] : [0, 1.7 * c.dir]
  }

  /* ---------- paredes do fundo de cada sala (com vãos para os corredores) ---------- */
  for (const r of ROOMS) {
    const [ox, oy] = ZO(r), col = ROOM_COLOR[r]
    // vãos: corredores que entram pelo lado de trás (y = oy, ao longo de x) ou pelo lado esquerdo (x = ox, ao longo de y)
    const gx: [number, number][] = [], gy: [number, number][] = []
    for (const c of CORRS) {
      if (c.axis === 'y' && c.y1 === oy && c.x0 >= ox && c.x1 <= ox + ZW) gx.push([c.x0 - ox, c.x1 - ox])
      if (c.axis === 'x' && c.x1 === ox && c.y0 >= oy && c.y1 <= oy + ZH) gy.push([c.y0 - oy, c.y1 - oy])
    }
    const segs = (L: number, gaps: [number, number][]) => { const out: [number, number][] = []; let a = 1; for (const [g0, g1] of gaps.sort((p, q) => p[0] - q[0])) { if (g0 > a) out.push([a, g0]); a = g1 } if (a < L - 1) out.push([a, L - 1]); return out }
    for (const [a, b] of segs(ZW, gx)) add({ x: ox + a, y: oy, w: b - a, d: 0.25, sprite: wallSeg('x', b - a, col) })
    for (const [a, b] of segs(ZH, gy)) add({ x: ox, y: oy + a, w: 0.25, d: b - a, sprite: wallSeg('y', b - a, col) })
  }

  /* ---------- corredores: barreiras, bloqueios, postes ---------- */
  const blockers: Blocker[] = []
  CORRS.forEach((c) => {
    const color = c.gate >= 0 ? ZONES[c.gate].color : '#9fe9ff'
    if (c.gate >= 0) {
      if (c.axis === 'x') {
        add({ x: c.mid[0], y: c.y0, w: 0.1, d: 3, sprite: () => A.barrier('y', 3, color, !isOpen(c), anim(8)) })
        blockers.push({ x0: c.mid[0] - 0.2, y0: c.y0, x1: c.mid[0] + 0.2, y1: c.y1, on: () => !isOpen(c) })
      } else {
        add({ x: c.x0, y: c.mid[1], w: 3, d: 0.1, sprite: () => A.barrier('x', 3, color, !isOpen(c), anim(8)) })
        blockers.push({ x0: c.x0, y0: c.mid[1] - 0.2, x1: c.x1, y1: c.mid[1] + 0.2, on: () => !isOpen(c) })
      }
    }
    // luzinhas nas bordas
    for (let k = 0.75; k < 6; k += 1.5) {
      const pts: P2[] = c.axis === 'x' ? [[c.x0 + k, c.y0 + 0.12], [c.x0 + k, c.y1 - 0.12]] : [[c.x0 + 0.12, c.y0 + k], [c.x1 - 0.12, c.y0 + k]]
      for (const p of pts) add({ x: p[0], y: p[1], sprite: () => crystal(isOpen(c) ? color : '#4a4a6a', 0.35), z: 2 })
    }
  })

  /* ---------- Sala do Prompt ---------- */
  {
    const [ox, oy] = ZO('centro')
    add({ x: MACHINE[0], y: MACHINE[1], w: 3, d: 2, solid: true, sprite: () => A.promptMachine(doneCount(), anim(3)) })
    add({ x: MACHINE[0] + 1.5, y: MACHINE[1] + 2.4, layer: 'ground', blend: 'lighter', sprite: glow(34, '#59d7ff', 0.3), alpha: () => 0.4 + 0.07 * doneCount() })
    add({ x: ox + 1.6, y: oy + 1.6, sprite: () => A.screenPost('#59d7ff', anim(4)), shadow: 4 }, { x: ox + 12.4, y: oy + 1.4, sprite: () => A.screenPost('#ffd27a', anim(4) + 2), shadow: 4 })
    add({ x: ox + 1.2, y: oy + 9, w: 0.55, d: 0.55, solid: true, sprite: A.crate('#6a5a3a') }, { x: ox + 1.9, y: oy + 9.2, w: 0.55, d: 0.55, solid: true, sprite: A.crate('#5a6a7a') }, { x: ox + 1.5, y: oy + 9.6, z: 14, sprite: A.crate('#6a5a3a') })
    add({ x: ox + 12.6, y: oy + 5.4, sprite: A.pipeV('#5a6a9a', 40), shadow: 0 }, { x: ox + 0.6, y: oy + 5.6, sprite: A.pipeV('#5a6a9a', 40), shadow: 0 })
    add({ x: PORTAL_P[0], y: PORTAL_P[1], hidden: () => !flag('p2_done'), sprite: () => portalSprite(anim(8), '#7fe3ff'), shadow: 0 })
    add({ x: PORTAL_P[0], y: PORTAL_P[1] + 0.6, layer: 'ground', blend: 'lighter', hidden: () => !flag('p2_done'), sprite: glow(30, '#7fe3ff', 0.35) })
    addInteract({ id: 'p2_portal', x: PORTAL_USE[0], y: PORTAL_USE[1], r: 1.5, mz: 60, color: '#7fe3ff', label: 'Atravessar para a Fase 3', enabled: () => !!flag('p2_done'), use: () => start('p2_portal', async (c) => { c.objective(null); c.goto('p3') }) })
    addInteract({ id: 'p2_machine', x: PROMPT_USE[0], y: PROMPT_USE[1], r: 1.4, mz: 70, color: '#59d7ff', label: () => (flag('p2_final') ? 'Rever o caminho da pergunta' : 'Ver a máquina do prompt'), enabled: () => !!flag('p2_intro') && (nextZone() >= 0 || !!flag('p2_final')),
      use: () => start('p2_machine', async (c) => {
        if (flag('p2_final')) { c.freeze(true); try { await show(c, (d) => <P2PipelineView onDone={d} />) } finally { c.freeze(false) } return }
        await c.say({ who: 'ENGINE', text: `A pergunta está aqui: “Qual é a capital do Brasil?”. ${doneCount()} de 8 estações funcionando… ainda não consigo responder.` })
      }) })
  }

  /* ---------- Oficina do Adivinho ---------- */
  {
    const [ox, oy] = ZO('prever')
    add({ x: ox + 8.4, y: oy + 1.4, w: 2.2, d: 1, solid: true, sprite: () => A.giantBook(anim(2)) })
    add({ x: ox + 2.6, y: oy + 0.7, w: 2.4, d: 0.2, solid: true, sprite: A.tallyBoard() })
    add({ x: ox + 0.4, y: oy + 1.5, w: 0.5, d: 1.8, solid: true, sprite: A1.bookshelf(1.8) }, { x: ox + 0.4, y: oy + 8.8, w: 0.5, d: 1.8, solid: true, sprite: A1.bookshelf(1.8) })
    add({ x: ox + 11.6, y: oy + 6.2, w: 1.4, d: 0.8, solid: true, sprite: A1.desk('#6a3a2a', 'candle') })
    add({ x: ox + 12.4, y: oy + 1.2, sprite: A1.lamppost('#c8a8ff', true), shadow: 3 })
  }
  /* ---------- Fatiador ---------- */
  {
    const [ox, oy] = ZO('tokens')
    add({ x: ox + 1, y: oy + 2.4, w: 6, d: 0.9, solid: true, sprite: A.beltBase(6) })
    add({ x: ox + 7, y: oy + 1.6, w: 2.4, d: 2.4, solid: true, sprite: () => A.cutter(anim(8), true) })
    add({ x: ox + 9.4, y: oy + 2.4, w: 3, d: 0.9, solid: true, sprite: A.beltBase(3) })
    const IN = ['infelizmente', 'Brasil?', 'desenvolvimento', 'capital']
    const OUTP = [['in', 'feliz', 'mente'], ['Brasil', '?'], ['des', 'envolv', 'imento'], ['capital']]
    for (let k = 0; k < 3; k++) {
      add({ x: 0, y: 0, pos: () => { const t = (RT.time * 0.25 + k / 3) % 1; return { x: ox + 1.2 + t * 5.8, y: oy + 2.85, z: 10 } }, sprite: () => { const n = Math.floor(RT.time * 0.25 + k / 3); return tokenTag(IN[(n * 3 + k) % IN.length], '#fff3d6', '#3a2a4a') } })
      add({ x: 0, y: 0, pos: () => { const t = (RT.time * 0.25 + k / 3 + 0.5) % 1; return { x: ox + 9.6 + t * 2.8, y: oy + 2.85, z: 10 } }, sprite: () => { const n = Math.floor(RT.time * 0.25 + k / 3 + 0.5); const o = OUTP[(n * 3 + k) % OUTP.length]; return tokenTag(o[n % o.length], '#ffd27a', '#3a1a1a') } })
    }
    add({ x: ox + 12, y: oy + 7, w: 0.55, d: 0.55, solid: true, sprite: A.crate('#8a3a3a') }, { x: ox + 12.7, y: oy + 7.2, w: 0.55, d: 0.55, solid: true, sprite: A.crate('#6a5a3a') }, { x: ox + 12.3, y: oy + 7.5, z: 14, sprite: A.crate('#8a3a3a') })
    add({ x: ox + 1.4, y: oy + 10, sprite: () => A.screenPost('#ff6a5a', anim(4)), shadow: 4 })
  }
  /* ---------- Vale dos Vetores ---------- */
  {
    for (const [g, p] of Object.entries(DIST)) add({ x: p[0], y: p[1], z: 2, hidden: () => near(g), sprite: tokenTag(GROUPS[g].name.toUpperCase(), '#0c1430', GROUPS[g].color) })
    STARS.forEach((s, k) => {
      const p = DIST[s.g], color = GROUPS[s.g].color
      add({ x: p[0] + s.dx, y: p[1] + s.dy, z: 3, sprite: () => A.starSprite(color, anim(3) + k) })
      add({ x: p[0] + s.dx, y: p[1] + s.dy, z: 11, hidden: () => !near(s.g), sprite: tokenTag(s.w, color, '#0c1430') })
    })
    // as palavras perdidas, quando chegam ao bairro, viram estrelas
    LOST.forEach((l, k) => {
      const p = DIST[l.g], sl: P2 = l.g === 'capitais' ? [1.6, 0.6] : SLOT[3], sp: P2 = [p[0] + sl[0], p[1] + sl[1]]
      add({ x: sp[0], y: sp[1], z: 3, hidden: () => !flag(lostFlag(l.w)), sprite: () => A.starSprite('#ffffff', anim(3) + k, true) })
      add({ x: sp[0], y: sp[1], z: 11, hidden: () => !flag(lostFlag(l.w)) || !near(l.g), sprite: tokenTag(l.w, '#ffffff', '#1a2a5a') })
    })
    // Lisboa (escondida até o fim da seta)
    add({ x: LISBOA[0], y: LISBOA[1], z: 3, hidden: () => !flag('p2v_arrow'), sprite: () => (flag('p2v_lisboa') ? A.starSprite(GROUPS.capitais.color, anim(3), true) : A.starSprite('#8a8aa8', anim(2))) })
    add({ x: LISBOA[0], y: LISBOA[1], z: 11, hidden: () => !flag('p2v_arrow'), sprite: () => tokenTag(flag('p2v_lisboa') ? 'Lisboa' : '?', flag('p2v_lisboa') ? GROUPS.capitais.color : '#c8c8e0', '#0c1430') })
    addInteract({ id: 'p2v_lisboa', x: LISBOA[0], y: LISBOA[1], r: 1.3, mz: 30, color: '#ffd27a', label: 'Descobrir a palavra', enabled: () => !!flag('p2v_arrow') && !flag('p2v_lisboa'), use: () => start('p2v_lisboa', lisboaScene) })
    for (const g of Object.keys(DIST)) {
      const p = DIST[g]
      addInteract({ id: 'p2v_drop_' + g, x: p[0], y: p[1], r: 1.9, mz: 26, color: GROUPS[g].color, label: () => `Soltar “${V.carry}” em ${GROUPS[g].name}`, enabled: () => !!V.carry, use: () => dropLost(g) })
    }
  }
  /* ---------- Praça dos Holofotes ---------- */
  const STAGE: P2 = [ZO('atencao')[0] + 8.6, ZO('atencao')[1] + 0.9]
  {
    const [ox, oy] = ZO('atencao')
    add({ x: STAGE[0], y: STAGE[1], w: 5, d: 2.6, solid: true, sprite: A.stage(5, 2.6) })
    QUESTION.forEach((t, k) => {
      const x = STAGE[0] + 0.45 + k * 0.68, y = STAGE[1] + 1.5
      const lit = () => done(ZI('atencao')) ? (t === 'capital' || t === 'Brasil') : Math.floor(RT.time * 0.8) % QUESTION.length === k
      add({ x: 0, y: 0, pos: () => ({ x, y, z: 12 + (lit() ? Math.abs(Math.sin(RT.time * 5 + k)) * 3 : 0) }), sprite: () => tokenBody(lit() ? '#ffd27a' : '#8a7aa8', anim(3) + k, lit() ? 'feliz' : 'surpreso') })
      add({ x: 0, y: 0, hidden: () => !lit(), pos: () => ({ x, y, z: 30 }), sprite: () => tokenTag(t, '#ffd27a', '#1b1426') })
    })
    add({ x: STAGE[0] - 0.4, y: STAGE[1] + 3.4, sprite: () => A.spotlight('#ffd27a', true, false), shadow: 4 }, { x: STAGE[0] + 5.3, y: STAGE[1] + 3.2, sprite: () => A.spotlight('#ffd27a', true, true), shadow: 4 })
    add({ x: STAGE[0] + 0.2, y: STAGE[1] + 5.4, w: 4, d: 0.45, solid: true, sprite: A.bench(4) }, { x: STAGE[0] + 0.2, y: STAGE[1] + 7.2, w: 4, d: 0.45, solid: true, sprite: A.bench(4) })
    add({ x: ox + 1.6, y: oy + 1.2, sprite: A.neonSign('ATENÇÃO', '#ffd27a', true), shadow: 3 })
    add({ x: ox + 3.2, y: oy + 1.0, sprite: () => A.screenPost('#ffd27a', anim(4)), shadow: 4 })
  }
  /* ---------- Torre das Camadas ---------- */
  {
    const [ox, oy] = ZO('camadas')
    add({ x: ox + 9.4, y: oy + 1.2, w: 3.2, d: 3.2, solid: true, sprite: () => A.layerTower(WORLD.camadas, anim(4)) })
    add({ x: ox + 11, y: oy + 2.8, z: 140, layer: 'top', blend: 'lighter', hidden: () => WORLD.camadas < 3, sprite: glow(40, '#9aacff', 0.5) })
    add({ x: ox + 3, y: oy + 1.4, sprite: A1.bracketBoard([['1', '0', '2'], ['0', '1', '1']], '#9aacff'), shadow: 6 })
    add({ x: ox + 12.6, y: oy + 7, sprite: A.pipeV('#5a6ac0', 34), shadow: 0 }, { x: ox + 12.6, y: oy + 9, sprite: A.pipeV('#5a6ac0', 26), shadow: 0 })
    add({ x: ox + 1.5, y: oy + 9.6, sprite: () => A.screenPost('#7a8cff', anim(4)), shadow: 4 })
  }
  /* ---------- Cassino da Roleta ---------- */
  {
    const [ox, oy] = ZO('roleta')
    let ang = 0, lastT = 0
    add({ x: ox + 2, y: oy + 4, w: 2.4, d: 2.4, solid: true, sprite: () => { const t = RT.time; const since = performance.now() / 1000 - WORLD.spinAt; const sp = since < 1.6 ? 12 * (1 - since / 1.6) + 0.4 : 0.4; ang += sp * Math.max(0, Math.min(0.1, t - lastT)); lastT = t; return A.rouletteTable(ang) } })
    ;[[1, 0.6], [2.1, 0.6], [10, 0.6], [11.1, 0.6], [12.2, 0.6]].forEach(([lx, ly], k) => add({ x: ox + lx, y: oy + ly, w: 0.9, d: 0.8, solid: true, sprite: () => A.slotMachine(['#8a2a6a', '#2a6a8a', '#6a2a8a', '#8a6a2a', '#2a8a5a'][k], anim(5) + k) }))
    add({ x: ox + 4, y: oy + 1.2, sprite: () => A.neonSign('CASSINO', '#ff7ab8', anim(2) % 4 !== 0), shadow: 3 })
    add({ x: ox + 1.4, y: oy + 9.4, sprite: () => A.neonSign('ROLETA', '#ffd27a', true), shadow: 3 })
  }
  /* ---------- Academia dos Pesos ---------- */
  {
    const [ox, oy] = ZO('treino')
    add({ x: ox + 1, y: oy + 1.2, w: 1.6, d: 0.5, solid: true, sprite: A.weightRack() }, { x: ox + 10.6, y: oy + 1.2, w: 1.6, d: 0.5, solid: true, sprite: A.weightRack() })
    add({ x: ox + 1.4, y: oy + 8.6, w: 1.6, d: 0.6, solid: true, sprite: A.benchPress() })
    add({ x: ox + 3.4, y: oy + 4.6, shadow: 6, sprite: () => { const sp = 1.2 + WORLD.treino * 3; return A.lifter((Math.sin(RT.time * sp) + 1) / 2, '#ffb35a') } })
    add({ x: ox + 11.4, y: oy + 4.6, shadow: 6, sprite: () => A.lifter((Math.sin(RT.time * 2.2 + 1) + 1) / 2, '#7a8cff') })
    add({ x: ox + 4.4, y: oy + 0.8, w: 2.2, d: 0.2, solid: true, sprite: () => A.lossBoard(done(ZI('treino')) ? 1 : 0.3 + (Math.sin(RT.time * 0.5) + 1) * 0.1) })
  }
  /* ---------- Biblioteca do Contexto ---------- */
  {
    const [ox, oy] = ZO('rag')
    add({ x: ox + 1, y: oy + 1.2, w: 4, d: 0.5, solid: true, sprite: A.tallShelf(4, 1) }, { x: ox + 1, y: oy + 3.6, w: 4, d: 0.5, solid: true, sprite: A.tallShelf(4, 2) })
    add({ x: ox + 9, y: oy + 1.2, w: 4, d: 0.5, solid: true, sprite: A.tallShelf(4, 3) }, { x: ox + 9, y: oy + 3.6, w: 4, d: 0.5, solid: true, sprite: A.tallShelf(4, 4) })
    add({ x: ox + 2.2, y: oy + 7.4, w: 2, d: 1.2, solid: true, sprite: A.readingTable() })
    add({ x: ox + 3.2, y: oy + 7.9, z: 12, sprite: () => A.docPile(done(ZI('rag'))) })
    add({ x: ox + 12.4, y: oy + 9.4, sprite: A1.lamppost('#8ff0b0', true), shadow: 3 })
  }

  /* ---------- habitantes ---------- */
  const npcs: Npc[] = []
  const talking = (who: string) => { const d = useGame.getState().dialog; return !!d && d.lines[d.i]?.who === who }
  const HOST_AT: Record<string, P2[]> = {
    prever: [[5.5, 6.2], [8.5, 6.6], [8, 8.6], [5.2, 8.2]], tokens: [[5, 6.5], [8.4, 6.8], [8, 8.8], [4.6, 8.4]], vetores: [[11.6, 6.2], [12.6, 6.8], [12, 7.6]],
    atencao: [[4.5, 5.6], [6.5, 6.4], [5.6, 8.6], [3.8, 7.8]], camadas: [[5, 6], [8, 6.6], [7.4, 8.8], [4.4, 8.4]], roleta: [[8.4, 6.6], [10.6, 7.2], [10, 9], [7.6, 8.6]],
    treino: [[8.4, 6.6], [10.6, 7.2], [10.2, 9], [7.8, 8.6]], rag: [[8.6, 6.6], [10.6, 7], [10, 9], [8, 8.6]],
  }
  V.hosts = ZONES.map((z, i) => {
    const [ox, oy] = ZO(z.id)
    const route = HOST_AT[z.id].map(([a, b]) => [ox + a, oy + b] as P2)
    const n = makeNpc({ id: 'host_' + z.id, route, speed: 0.7, pause: 2.6, color: z.color, stopNear: 2.2,
      label: () => (done(i) ? `Reler: ${z.doc.title}` : `Falar com ${z.hostName.charAt(0) + z.hostName.slice(1).toLowerCase()}`),
      canTalk: () => !!flag('p2_intro') && (done(i) || nextZone() === i),
      sprite: (nn, f) => robotSprite(z.kind, z.color, nn.dir, f, talking(z.host) && Math.floor(RT.time * 6) % 2 === 0),
      talk: () => { if (done(i)) readAgain(z.doc); else start('p2z' + i, (c) => runZone(c, i)) } })
    npcs.push(n); add(npcThing(n)); npcTalk(n)
    // halo de “estação ligada”
    add({ x: 0, y: 0, layer: 'ground', blend: 'lighter', pos: () => ({ x: n.x, y: n.y }), sprite: glow(14, z.color, 0.3), alpha: () => (done(i) ? 0.9 : nextZone() === i ? 0.5 + Math.sin(RT.time * 4) * 0.3 : 0) })
    return n
  })
  // Hallucino flutua pela biblioteca
  {
    const [ox, oy] = ZO('rag')
    const hal = makeNpc({ id: 'hallucino', route: [[ox + 6, oy + 2.6], [ox + 7.6, oy + 5.4], [ox + 5.4, oy + 8.6], [ox + 10.4, oy + 9.6], [ox + 11.6, oy + 5.6]], speed: 0.9, fly: 16, pause: 1.8,
      sprite: (_, f) => A.hallucino(f, done(ZI('rag'))), label: 'Falar com o Hallucino', color: '#ff8ad8',
      talk: () => { emote('♪', () => ({ x: hal.x, y: hal.y, z: 50 }), 1.2); SFX.play('bead'); useGame.getState().showToast(done(ZI('rag')) ? 'Hallucino: Tá bom, tá bom… vou conferir as fontes antes de falar.' : 'Hallucino: Sabia que a lua é feita de queijo? Hihihi! (Não é.)') } })
    npcs.push(hal); add(npcThing(hal), npcShadow(hal, 5)); npcTalk(hal)
  }
  // operários e drones
  {
    const [ox, oy] = ZO('centro')
    const op = makeNpc({ id: 'op1', route: [[ox + 2, oy + 7.6], [ox + 4.6, oy + 10.4], [ox + 11, oy + 10.6], [ox + 11.6, oy + 6]], speed: 1.1, pause: 1.4, sprite: (nn, f) => robotSprite('operario', '#ffd25a', nn.dir, f) })
    npcs.push(op); add(npcThing(op))
    add({ x: 0, y: 0, pos: () => ({ x: op.x, y: op.y, z: 30 + (op.moving ? Math.abs(Math.sin(op.walkDist * 5)) : 0) }), sprite: A.crate('#6a5a3a') })
    const ring: P2[] = (['prever', 'tokens', 'vetores', 'atencao', 'camadas', 'roleta', 'treino', 'rag'] as Room[]).map((r) => [ZO(r)[0] + 7, ZO(r)[1] + 6] as P2)
    const d1 = makeNpc({ id: 'drone_f1', route: ring, speed: 2.4, fly: 86, pause: 1.6, sprite: (_, f) => droneSprite(f, '#c8d0e0', '#7fe3ff') })
    const d2 = makeNpc({ id: 'drone_f2', route: [[ox + 3, oy + 3], [ox + 11, oy + 3], [ox + 11, oy + 9], [ox + 3, oy + 9]], speed: 1.2, fly: 56, pause: 1.6, sprite: (_, f) => droneSprite(f + 1, '#d8c8a8', '#ffd27a') })
    npcs.push(d1, d2); add(npcThing(d1), npcThing(d2), npcShadow(d2, 5))
  }
  // palavras que pulam pela oficina
  {
    const [ox, oy] = ZO('prever')
    ;['famoso', 'pelo', 'samba'].forEach((w, k) => {
      const r: P2[] = [[ox + 3 + k, oy + 3.4], [ox + 6 + k * 0.5, oy + 4.2], [ox + 4 + k, oy + 5.2]]
      const n = makeNpc({ id: 'pw' + k, route: k % 2 ? r.slice().reverse() : r, speed: 0.8, hop: true, pause: 1.4, sprite: (_, f) => tokenBody(['#b07aff', '#59d7ff', '#ffd27a'][k], f) })
      npcs.push(n); add(npcThing(n), npcShadow(n, 3))
      add({ x: 0, y: 0, pos: () => ({ x: n.x, y: n.y, z: 18 + (n.moving ? Math.abs(Math.sin(n.walkDist * 5)) * 5 : 0) }), sprite: tokenTag(w, '#fff3d6', '#2a1a3a') })
    })
  }
  // as palavras perdidas do Vale
  lostNpcs = LOST.map((l, k) => {
    const r: P2[] = [l.at, [l.at[0] + 0.6, l.at[1] + 0.3], [l.at[0] + 0.1, l.at[1] + 0.6]]
    const n = makeNpc({ id: 'lost_' + l.w, route: r, speed: 0.6, hop: true, pause: 1.2, hidden: () => !!flag(lostFlag(l.w)) || V.carry === l.w,
      sprite: (_, f) => tokenBody('#e8e0ff', f, 'surpreso'), label: `Pegar “${l.w}”`, color: '#ffffff',
      canTalk: () => !!flag('p2i_vetores') && !V.carry, talk: () => pickLost(l.w) })
    n.stopNear = 0
    npcs.push(n); add(npcThing(n), npcShadow(n, 3)); npcTalk(n)
    add({ x: 0, y: 0, hidden: n.hidden, pos: () => ({ x: n.x, y: n.y, z: 18 + (n.moving ? Math.abs(Math.sin(n.walkDist * 5)) * 5 : 0) }), sprite: tokenTag(l.w, '#ffffff', '#3a2a5a') })
    add({ x: 0, y: 0, hidden: () => n.hidden!() || !flag('p2i_vetores'), pos: () => ({ x: n.x, y: n.y, z: 36 + Math.sin(RT.time * 4 + k) * 2 }), sprite: () => crystal('#ffd27a', 0.35) })
    return n
  })
  // os tokens da pergunta seguem o NEX (depois do Fatiador)
  const follow = () => !!flag(zoneFlag('tokens')) && !FIN.fed
  QUESTION.forEach((t, k) => {
    const color = t === 'capital' || t === 'Brasil' ? (done(ZI('atencao')) ? '#ffd27a' : '#59d7ff') : '#9fe9ff'
    const pos = () => {
      const f = followerPos(k, 5)
      const hop = Math.abs(Math.sin(RT.time * 6 + k * 0.9)) * 3
      if (FIN.feed <= 0) return { x: f.x, y: f.y, z: hop }
      const q = Math.max(0, Math.min(1, FIN.feed * 1.4 - k * 0.06))
      const tx = MACHINE[0] + 1.5, ty = MACHINE[1] + 1
      return { x: f.x + (tx - f.x) * q, y: f.y + (ty - f.y) * q, z: hop + Math.sin(q * Math.PI) * 50 + q * 40 }
    }
    add({ x: 0, y: 0, hidden: () => !follow(), pos, sprite: () => tokenBody(done(ZI('atencao')) && (t === 'capital' || t === 'Brasil') ? '#ffd27a' : color, anim(6) + k), shadow: 3 })
    if (t === 'capital' || t === 'Brasil') add({ x: 0, y: 0, hidden: () => !follow(), pos: () => { const p = pos(); return { ...p, z: (p.z || 0) + 17 } }, sprite: () => tokenTag(t, done(ZI('atencao')) ? '#ffd27a' : '#fff3d6', '#14223a') })
  })

  /* ---------- pintura do chão ---------- */
  const rail = hex('#8a8aa0'), slat = hex('#30303e'), hz = [hex('#ffd25a'), hex('#1b1426')]
  const eachPx = (p: Pix, x: number, y: number, tx: number, ty: number, f: (wx: number, wy: number) => number) => {
    for (let py = 0; py < 16; py++) for (let px = 0; px < 32; px++) {
      if (Math.abs(px + 0.5 - 16) / 16 + Math.abs(py + 0.5 - 8) / 8 > 1) continue
      const X = px + 0.5 - 16, Y = py + 0.5
      const c = f(x + (X / 16 + Y / 8) / 2, y + (Y / 8 - X / 16) / 2)
      if (c) p.px(tx - 16 + px, ty + py, c)
    }
  }
  const paint = (p: Pix, x: number, y: number, tx: number, ty: number) => {
    const c = corrAt(x, y)
    if (c && c.belt && beltLane(c, x, y)) {
      eachPx(p, x, y, tx, ty, (wx, wy) => {
        const cross = c.axis === 'x' ? wy - (c.y0 + 1.5) : wx - (c.x0 + 1.5), along = c.axis === 'x' ? wx : wy
        if (Math.abs(cross) > 0.42) return rail
        return (along * 4) % 1 < 0.12 ? slat : 0
      })
      return
    }
    if (c && !c.belt) {
      eachPx(p, x, y, tx, ty, (wx, wy) => { const cross = c.axis === 'x' ? wy - (c.y0 + 1.5) : wx - (c.x0 + 1.5); return Math.abs(Math.abs(cross) - 1.3) < 0.05 ? hz[0] : 0 })
      return
    }
    const r = roomAt(x, y)
    if (r === 'vetores') {
      eachPx(p, x, y, tx, ty, (wx, wy) => {
        for (const [g, q] of Object.entries(DIST)) { const d = Math.hypot(wx - q[0], wy - q[1]); if (Math.abs(d - 2.0) < 0.05) return hex(GROUPS[g].color) }
        if (hash2(Math.floor(wx * 8), Math.floor(wy * 8), 3) > 0.995) return hex('#9fb8ff')
        return 0
      })
    } else if (r === 'centro') {
      const [ox, oy] = ZO('centro')
      eachPx(p, x, y, tx, ty, (wx, wy) => { const d = Math.hypot(wx - (ox + 7), wy - (oy + 6.6)); return Math.abs(d - 3.2) < 0.05 || Math.abs(d - 4.6) < 0.04 ? hex('#59d7ff') : 0 })
    } else if (r === 'atencao') {
      eachPx(p, x, y, tx, ty, (wx, wy) => { const d = Math.hypot(wx - (STAGE[0] + 2.5), wy - (STAGE[1] + 3.8)); return Math.abs(d - 1.4) < 0.05 ? hex('#ffd27a') : 0 })
    } else if (r) {
      // faixa amarela e preta na entrada das salas
      const [ox, oy] = ZO(r)
      if (x === ox + ZW - 1 || y === oy + ZH - 1) eachPx(p, x, y, tx, ty, (wx, wy) => { const e = Math.min(ox + ZW - wx, oy + ZH - wy); return e < 0.12 ? hz[Math.floor((wx + wy) * 3) % 2] : 0 })
    }
  }

  /* ---------- luzes correndo ---------- */
  const chev = (ctx: CanvasRenderingContext2D, t: number) => {
    for (const c of CORRS) {
      if (!c.belt) continue
      const on = isOpen(c)
      ctx.fillStyle = on ? (c.gate >= 0 ? ZONES[c.gate].color : '#9fe9ff') : '#4a4a66'
      const len = 6
      for (let k = 0; k < len; k++) {
        const s = on ? (k + ((t * 1.7) % 1)) : k + 0.5
        const sd = c.dir > 0 ? s : len - s
        const wx = c.axis === 'x' ? c.x0 + sd : c.x0 + 1.5, wy = c.axis === 'x' ? c.y0 + 1.5 : c.y0 + sd
        const sx = Math.round((wx - wy) * 16), sy = Math.round((wx + wy) * 8)
        const dx = c.axis === 'x' ? 2 * c.dir : -2 * c.dir, dy = c.dir
        ctx.globalAlpha = on ? 0.85 : 0.35
        for (let q = 0; q < 4; q++) {
          // braços do “>”: para trás e para os lados
          const bx = -dx * q * 0.5, by = -dy * q * 0.5
          const px = c.axis === 'x' ? -q : q, py = c.axis === 'x' ? q * 0.5 : q * 0.5
          ctx.fillRect(sx + bx + px, sy + by + py, 1, 1)
          ctx.fillRect(sx + bx - px, sy + by - py, 1, 1)
        }
      }
    }
    ctx.globalAlpha = 1
  }
  const arrowP = pulses([[BRASIL, BRASILIA]], '#ffd27a', 1.6, 1.2)
  const arrowL = pulses([[PORTUGAL, LISBOA]], '#ffffff', 1.6, 1.0)

  /* ---------- onde o NEX aparece ---------- */
  let spawn: P2 = START
  const n0 = nextZone()
  if (flag('p2_final')) spawn = [PROMPT_USE[0], PROMPT_USE[1] + 0.8]
  else if (flag('p2_intro') && n0 > 0) { const [ox, oy] = ZO(ZONES[n0].id); spawn = [ox + 7, oy + 10] }
  else if (flag('p2_intro') && n0 < 0) spawn = [PROMPT_USE[0], PROMPT_USE[1] + 1.5]

  let emoteT = 5
  return {
    w: W, h: H, ground, things, blockers, paint, cliffAt, flow,
    cliff: { a: '#2e3452', b: '#1e2238', depth: 34 },
    falls: { density: 0.04, color: '#59d7ff' },
    spawn: { pos: spawn, dir: [1, 0] },
    bg: dataRainBg('#020611', '#0c1a3a', '#2a8ac8'),
    scripts: [main],
    novaZ: 9,
    init: () => {
      RT.novaOn = true
      G().setOverlay('p2strip', <P2Strip />)
      RT.trail.length = 0
      for (let n = 0; n < 60; n++) RT.trail.push([spawn[0] - n * 0.1, spawn[1] - n * 0.02])
    },
    under: (ctx, t) => {
      chev(ctx, t)
      if (flag('p2i_vetores')) arrowP(ctx, t)
      if (flag('p2v_arrow')) arrowL(ctx, t)
    },
    update: (dt) => {
      updateNpcs(npcs, dt)
      syncTalk(npcs, INTERACTS)
      // faíscas da máquina do prompt
      if (Math.random() < dt * (2 + doneCount())) {
        RT.particles.push({ x: MACHINE[0] + 0.5 + Math.random() * 2, y: MACHINE[1] + 0.4 + Math.random(), z: 70, vx: 0, vy: 0, vz: 16 + Math.random() * 14, life: 1.8, max: 1.8, c: Math.random() < 0.5 ? '#7fe3ff' : '#ffd27a', s: 1, g: -3 })
      }
      // brilhos nas estações ligadas
      if (Math.random() < dt * 5) {
        const i = Math.floor(Math.random() * ZONES.length)
        if (done(i)) {
          const [ox, oy] = ZO(ZONES[i].id), x = ox + 1 + Math.random() * 12, y = oy + 1 + Math.random() * 10
          if (Math.hypot(x - RT.player.x, y - RT.player.y) < 16) RT.particles.push({ x, y, z: 4, vx: 0, vy: 0, vz: 12 + Math.random() * 8, life: 2, max: 2, c: ZONES[i].color, s: 1, g: -2 })
        }
      }
      emoteT -= dt
      if (emoteT <= 0) {
        emoteT = 6 + Math.random() * 5
        const i = nextZone()
        const h = i >= 0 ? V.hosts[i] : null
        if (h && flag('p2_intro') && Math.hypot(h.x - RT.player.x, h.y - RT.player.y) < 9) emote('!', () => ({ x: h.x, y: h.y, z: 36 }), 1.4)
      }
    },
    onExit: () => { G().setOverlay(OV, null); G().setOverlay('p2strip', null); RT.carry = null; V.carry = null },
  }
}

/* ---------- faixa das estações (HUD) ---------- */
function P2Strip() {
  const flags = useGame((s) => s.flags)
  const hide = useGame((s) => !!s.cine || s.focus || !!s.menu || !!s.dialog || !!s.overlays[OV] || s.hudHidden)
  if (hide) return null
  const n = ZONES.filter((z) => flags[zoneFlag(z.id)]).length
  const last = [...ZONES].reverse().find((z) => flags[zoneFlag(z.id)])
  return (
    <div className="memstrip" style={{ pointerEvents: 'none' }} aria-label={`Estações ligadas: ${n} de 8`}>
      <span className="lb">ESTAÇÕES {n}/8</span>
      <span className="ds">{ZONES.map((z) => <i key={z.id} style={flags[zoneFlag(z.id)] ? { background: z.color, borderColor: '#fff', boxShadow: `0 0 6px ${z.color}` } : undefined} />)}</span>
      {last && <span className="wd">{last.word}</span>}
    </div>
  )
}
