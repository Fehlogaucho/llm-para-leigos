import { Pix, hex, hash2 } from '../../engine/pix'
import { box, glow, memo } from '../../art/core'
import { crystal, portalSprite } from '../../art/fx'
import { robotSprite, tokenTag, droneSprite } from '../../art/creatures'
import { RT, addInteract, gesture, emote, burst, INTERACTS, type Scene, type Thing, type TileSpec } from '../../engine/runtime'
import { makeNpc, npcThing, npcShadow, npcTalk, updateNpcs, syncTalk, type Npc } from '../../engine/npc'
import { SFX } from '../../engine/audio'
import { TIMBRE } from '../../engine/voice'
import { start, type Ctx } from '../../engine/script'
import { G, useGame, type P2 } from '../../store'
import { SPEAKERS } from '../../ui/Icons'
import { show, OV } from '../p1/Doc'
import { walkTo, fallIn, pulses } from '../common'
import { registerRobot } from '../robots'
import { P3GameView, NameView, DiplomaView } from './games'
import { babyName, buildModel, restoreModel, babble } from './lab'
import * as A from './art'
import * as A2 from '../p2/art'

/* =========================================================
   FASE 3 · CRIE SUA LLM — O LABORATÓRIO (pixel art)
   Uma LLM bebê dorme numa cápsula. Em seis estações, o jogador
   escolhe os dados, monta o vocabulário e a memória, treina de
   verdade (aqui no navegador), testa os 7 passos, faz ajuste
   fino e alinhamento e, na formatura, faz a prova final.
   ========================================================= */
const W = 30, H = 26
const flag = (k: string) => G().flags[k] || 0
interface Station { id: string; name: string; color: string; use: P2; codex: string[]; word: string }
const ST: Station[] = [
  { id: 'dados', name: 'Biblioteca de Dados', color: '#8ff0b0', use: [6.6, 8.0], codex: ['dados_treino'], word: 'DADOS' },
  { id: 'tokens', name: 'Tokenizador', color: '#ff6a5a', use: [15.4, 5.8], codex: ['janela'], word: 'VOCABULÁRIO' },
  { id: 'forja', name: 'Forja de Treino', color: '#ffb35a', use: [23.4, 7.2], codex: ['perda'], word: 'TREINO' },
  { id: 'teste', name: 'Sala de Teste', color: '#59d7ff', use: [24.2, 14.6], codex: [], word: 'TESTE' },
  { id: 'ajuste', name: 'Ajuste e Alinhamento', color: '#ff7ab8', use: [22.4, 21.6], codex: ['ajuste_fino', 'prompt', 'rlhf'], word: 'ALINHAMENTO' },
  { id: 'prova', name: 'Formatura', color: '#ffd27a', use: [8.6, 21.2], codex: [], word: 'FORMATURA' },
]
const sFlag = (i: number) => 'p3_' + ST[i].id
const done = (i: number) => !!flag(sFlag(i))
const nextSt = () => ST.findIndex((_, i) => !done(i))
const doneCount = () => ST.filter((_, i) => done(i)).length
const POD: P2 = [15, 12.6]
const START: P2 = [15, 21.4]
const PORTAL_P: P2 = [15, 23.6]
const PORTAL_USE: P2 = [15, 22.4]
const portrait = () => innerWidth / innerHeight < 0.8
registerRobot('SINAPSE', 'DRA. SINAPSE', 'cientista', '#4fd1c5', { pitch: 1.2, rate: 1.04 })

/* ---------- a LLM bebê como personagem ---------- */
const FACE = { url: '', st: -1 }
function babyFace() {
  const st = doneCount()
  if (FACE.st !== st) {
    const s = A.babySprite(st, 0, st >= 3 ? 'feliz' : 'confuso')
    const c = document.createElement('canvas'); c.width = 30; c.height = 30
    const g = c.getContext('2d')!
    g.fillStyle = '#0f1830'; g.fillRect(0, 0, 30, 30)
    g.drawImage(s.img, 0, -2)
    FACE.url = c.toDataURL(); FACE.st = st
  }
  return FACE.url
}
function registerBaby() {
  SPEAKERS.BEBE = { name: babyName().toUpperCase(), color: '#7fe3ff', face: () => <img className="pxface" alt="" draggable={false} src={babyFace()} /> }
  TIMBRE.BEBE = { pitch: 1.6, rate: 1.12 }
}
const BABY = { hop: 0, mood: 'confuso' as 'feliz' | 'confuso' | 'dorme' }
/** O que a LLM bebê diz (antes do treino, sai embaralhado; depois, frases de verdade). */
function babyLine(): string {
  const trained = done(2)
  if (!trained) return babble([], 1.6) || '⟨?⟩… ba… ⟨fim⟩'
  const starts = [['A', 'capital', 'do', 'Brasil'], ['A', 'capital', 'da', 'França'], ['O', 'Brasil', 'é', 'famoso'], ['Paris']]
  const k = Math.floor(Math.random() * starts.length)
  return babble(starts[k], 0.5)
}

/* ---------- uma estação ---------- */
const PRE: Record<string, (n: string) => { who: string; text: string }[]> = {
  dados: (n) => [
    { who: 'SINAPSE', text: 'Uma LLM só aprende o que está nos textos do treino. As grandes leem trilhões de palavras. A nossa vai ler um punhado de frases.' },
    { who: 'SINAPSE', text: `Escolha as frases que ${n} vai estudar. Cuidado: se tiver frase errada, ela aprende errado também!` },
  ],
  tokens: (n) => [
    { who: 'SINAPSE', text: `Lembra do Fatiador? Aqui é igual: cada frase vira tokens, e cada token novo entra no vocabulário de ${n}.` },
    { who: 'SINAPSE', text: `E tem uma decisão importante: a memória. Quantos tokens para trás ${n} vai olhar para prever o próximo?` },
  ],
  forja: (n) => [
    { who: 'SINAPSE', text: `Hora do treino! Na Forja, ${n} vai ler cada exemplo, chutar a próxima palavra, medir o erro e ajustar os pesos.` },
    { who: 'SINAPSE', text: 'Uma passada por todos os exemplos se chama época. Aperte o botão e acompanhe o erro caindo.' },
  ],
  teste: (n) => [
    { who: 'SINAPSE', text: `Agora, a Sala de Teste. Escreva o começo de uma frase e veja, passo a passo, como ${n} escolhe a próxima palavra.` },
    { who: 'SINAPSE', text: 'O desafio: ela tem que completar “A capital do Brasil é” com Brasília.' },
  ],
  ajuste: () => [
    { who: 'SINAPSE', text: 'Depois do treino, as LLMs ainda passam por ajustes. Primeiro: qual a diferença entre pedir no prompt e fazer um ajuste fino?' },
  ],
  prova: (n) => [
    { who: 'SINAPSE', text: `Chegou o grande dia: a Formatura! Para ${n} se formar, você responde a prova final.` },
    { who: 'SINAPSE', text: 'Sete acertos em dez e o diploma é de vocês. Boa sorte!' },
  ],
}
async function runStation(c: Ctx, i: number) {
  const s = ST[i]
  c.objective(null)
  await walkTo(c, s.use)
  c.freeze(true)
  RT.lookAt = [s.use[0] + (i < 3 ? 0 : 0.6), s.use[1] - 1.2]
  c.focus([s.use[0], s.use[1] - 0.6], 2, portrait() ? 30 : 22)
  const n = babyName()
  try {
    if (done(i)) { await show(c, (d) => <P3GameView game={s.id} onDone={d} />); return }
    await c.say(PRE[s.id](n))
    await show(c, (d) => <P3GameView game={s.id} onDone={d} />)
    if (s.id === 'ajuste') {
      await c.say({ who: 'SINAPSE', text: `E tem mais: pessoas comparam respostas e escolhem as melhores, para a LLM ser útil, honesta e segura. Ajude ${n}!` })
      await show(c, (d) => <P3GameView game="prefs" onDone={d} />)
    }
    c.setFlag(sFlag(i))
    G().pushBanner({ kind: 'station', title: s.word, sub: `Estação ${i + 1} · ${s.name}` })
    SFX.play('core'); gesture('cheer', 1.6)
    burst(POD[0], POD[1], 30, 30, ['#7fe3ff', '#ffd27a', '#ffffff', s.color], { spd: 2, up: 60, life: 1.2 })
    BABY.hop = 1
    for (const id of s.codex) c.discover(id)
    registerBaby()
    await c.wait(0.8)
    await after(c, i, n)
  } finally {
    RT.lookAt = null
    c.unfocus(); c.freeze(false)
  }
}
async function after(c: Ctx, i: number, n: string) {
  switch (ST[i].id) {
    case 'dados': await c.say([{ who: 'BEBE', text: 'Fra… ses? ' + babyLine() }, { who: 'SINAPSE', text: 'Ela ainda não entende nada: só guardou os textos. Agora vamos cortar tudo em tokens.' }]); break
    case 'tokens': await c.say([{ who: 'NOVA', text: 'As LLMs de verdade olham milhares de tokens para trás. A nossa é pequenininha!' }, { who: 'SINAPSE', text: 'Vocabulário pronto. Agora, o mais importante: o treino!' }]); break
    case 'forja': {
      c.focus([POD[0], POD[1] + 1], 2, 30)
      await c.wait(0.6)
      await c.say([
        { who: 'BEBE', text: babble(['A', 'capital', 'do', 'Brasil'], 0.3) },
        { who: 'NEX', text: `${n} falou uma frase inteira!` },
        { who: 'SINAPSE', text: 'Ninguém escreveu essa regra. Ela apareceu nos pesos, de tanto errar e ajustar.' },
      ])
      break
    }
    case 'teste': await c.say([{ who: 'SINAPSE', text: 'Funciona! Tokens, IDs, memória, embeddings, neurônios, chances e a escolha. É uma LLM de verdade… só que bem pequena.' }, { who: 'BEBE', text: 'Eu… sei… Brasília!' }]); break
    case 'ajuste': await c.say([{ who: 'BEBE', text: 'Obrigada! Agora eu sei: melhor dizer a verdade, ajudar de verdade e não fazer mal a ninguém.' }, { who: 'SINAPSE', text: 'Ela está pronta. Só falta a formatura!' }]); break
    case 'prova': await graduation(c, n); break
  }
}
async function graduation(c: Ctx, n: string) {
  c.focus([ST[5].use[0] - 1.4, ST[5].use[1] - 2], 2, 30)
  await show(c, (d) => <DiplomaView onDone={d} />)
  for (let k = 0; k < 4; k++) { burst(POD[0] + (Math.random() - 0.5) * 6, POD[1] + (Math.random() - 0.5) * 6, 40, 26, ['#ffd27a', '#ff7ab8', '#7fe3ff', '#7ef0a0', '#ffffff'], { spd: 2.4, up: 80, life: 1.6 }); SFX.play('chime'); await c.wait(0.3) }
  await c.say([
    { who: 'BEBE', text: `Eu me formei! Obrigada, NEX!` },
    { who: 'NEX', text: `Parabéns, ${n}! Você aprendeu muito rápido.` },
    { who: 'ENGINE', text: 'NEX… algo está acontecendo comigo. Eu me sinto… inteira.' },
  ])
  RT.cam.shake = 0.6; SFX.play('core')
  c.core('CREATOR', 'CREATOR CORE')
  await c.wait(1.6)
  await c.say([
    { who: 'ENGINE', text: 'MATRIX, TRANSFORMER e agora CREATOR. Todos os meus núcleos estão de volta. Eu lembro de tudo!' },
    { who: 'ENGINE', text: 'Você me ajudou a lembrar como eu funciono. Agora é minha vez de ajudar você: posso te levar de volta para casa.' },
    { who: 'NEX', text: `Para casa? Mas… e a NOVA? E a ${n}?` },
    { who: 'NOVA', text: 'A gente mora aqui dentro, NEX. Mas toda vez que você conversar com uma IA, lembre: tem tokens, vetores, atenção e muitos pesos trabalhando por você.' },
    { who: 'SINAPSE', text: `E eu cuido da ${n}. Ela vai continuar estudando!` },
    { who: 'BEBE', text: 'Tchau, NEX! Volte para me visitar!' },
  ])
  c.setFlag('p3_done')
  SFX.play('portal')
  await c.cinematic([{ pos: [PORTAL_P[0], PORTAL_P[1] - 1], zoom: 1, h: 26, dur: 2 }, { pos: [PORTAL_P[0], PORTAL_P[1] - 1], zoom: 1, h: 26, dur: 0.8 }], false)
}

/* ---------- abertura ---------- */
async function intro(c: Ctx) {
  c.freeze(true)
  RT.nexHidden = true
  await c.cinematic([
    { pos: [6, 6], zoom: 1, h: 40, cut: true },
    { pos: [24, 8], zoom: 1, h: 40, dur: 3.4 },
    { pos: [POD[0], POD[1] + 1], zoom: 2, h: 30, dur: 2.4 },
    { pos: START, zoom: 2, h: 14, dur: 1.8 },
  ])
  c.focus(START, 2, 14)
  RT.nexHidden = false
  await fallIn(c, 200)
  RT.lookAt = POD
  await c.say([
    { who: 'NEX', text: 'Que lugar é esse? Tudo branquinho e cheio de máquinas!' },
    { who: 'NOVA', text: 'O laboratório da Language Engine. Foi aqui que ela mesma nasceu, há muito tempo.' },
    { who: 'SINAPSE', text: 'Olá, olá! Eu sou a Dra. Sinapse, cientista-chefe do laboratório. A Engine me contou tudo sobre você!' },
  ])
  c.focus([POD[0], POD[1] + 1.5], 2, 30)
  await c.say([
    { who: 'SINAPSE', text: 'Está vendo aquela cápsula? Tem uma LLM bebê lá dentro. Ela tem pesos, mas os pesos são só números aleatórios. Ela não sabe nada.' },
    { who: 'BEBE', text: babyLine() },
    { who: 'NEX', text: 'Ela fala tudo embaralhado!' },
    { who: 'SINAPSE', text: 'Porque ainda não treinou. Hoje você vai criar uma LLM do começo ao fim: escolher os textos, cortar em tokens, treinar, testar, ajustar e… formar!' },
    { who: 'SINAPSE', text: 'Mas antes: toda LLM precisa de um nome.' },
  ])
  await show(c, (d) => <NameView onDone={d} />)
  registerBaby()
  BABY.hop = 1; emote('♥', () => ({ x: POD[0], y: POD[1], z: 70 }), 1.6)
  await c.say([
    { who: 'SINAPSE', text: `${babyName()}! Que nome lindo. Vamos começar pela Biblioteca de Dados, ali no canto.` },
    { who: 'NOVA', text: 'Siga as estações em ordem. Cada uma deixa a sua LLM um pouco mais esperta!' },
  ])
  RT.lookAt = null
  c.setFlag('p3_intro')
  c.unfocus(); c.freeze(false)
}

/* ---------- roteiro principal ---------- */
async function main(c: Ctx) {
  RT.novaOn = true
  if (!c.flag('p3_intro')) await intro(c)
  for (;;) {
    const i = nextSt()
    if (i < 0) break
    c.objective(`Estação ${i + 1}: ${ST[i].name}`, ST[i].use)
    await c.until(() => done(i))
    await c.until(() => !G().focus && !G().dialog)
  }
  c.objective('Volte para casa pelo portal', PORTAL_USE)
}

/* ---------- o mundo ---------- */
const anim = (fps: number) => Math.floor(RT.time * fps)
function labWall(axis: 'x' | 'y', len: number) {
  return memo(`labw:${axis}:${len}`, () => {
    const fn = (u: number, zz: number, x: number) => {
      if (zz > 33) return hex('#a8b8cc')
      if (Math.abs(zz - 22) < 1) return hex('#4fd1c5')
      // janelas com chuva de dados
      const wx = Math.floor(x / 40), inX = (x % 40) > 6 && (x % 40) < 34
      if (inX && zz > 9 && zz < 19) return hex(hash2(x, Math.floor(zz), wx) > 0.93 ? '#7fe3ff' : '#0c1a3a')
      return hex(zz < 3 ? '#8a98ac' : '#d8e2ee')
    }
    return axis === 'x' ? box(len, 0.3, 35, '#d8e2ee', { top: '#eef3fa', leftFn: fn }) : box(0.3, len, 35, '#d8e2ee', { top: '#eef3fa', rightFn: (v, zz, x) => fn(v, zz, x) })
  })
}

export default function build(): Scene {
  const things: Thing[] = []
  const add = (...ts: Thing[]) => { for (const t of ts) things.push(t) }
  registerBaby()
  if (flag('p3_forja') || flag('p3_ep')) restoreModel(); else buildModel()
  BABY.hop = 0

  /* ---------- chão: um salão octogonal ---------- */
  const inHall = (x: number, y: number) => {
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return false
    const cx = x + 0.5, cy = y + 0.5, c = 5
    return cx - 1 + (cy - 1) > c && (W - 1 - cx) + (cy - 1) > c && cx - 1 + (H - 1 - cy) > c - 2 && (W - 1 - cx) + (H - 1 - cy) > c - 2
  }
  const FLOOR: TileSpec = { s: 'stone', a: '#c6d2e0', b: '#9eacbe', c: '#e4ecf6' }
  const RING: TileSpec = { s: 'metal', a: '#3a6a7a', b: '#2a4a5a', c: '#7fe3ff' }
  const ground = (x: number, y: number): TileSpec | null => {
    if (!inHall(x, y)) return null
    const d = Math.hypot(x + 0.5 - POD[0], y + 0.5 - POD[1])
    if (d < 3.6) return RING
    for (const s of ST) if (Math.hypot(x + 0.5 - s.use[0], y + 0.5 - s.use[1]) < 1.2) return { s: 'carpet', a: s.color, b: '#2a3048', c: '#ffffff' }
    return FLOOR
  }
  // paredes do fundo (com o canto chanfrado)
  add({ x: 6, y: 1, w: W - 7 - 5, d: 0.3, sprite: labWall('x', W - 12) })
  add({ x: 1, y: 6, w: 0.3, d: H - 7 - 3, sprite: labWall('y', H - 10) })
  add({ x: 1.4, y: 5.4, sprite: A.cableCol('#4fd1c5'), shadow: 0 }, { x: 5.6, y: 1.4, sprite: A.cableCol('#4fd1c5'), shadow: 0 })

  /* ---------- a cápsula e a LLM bebê ---------- */
  add({ x: POD[0] - 1.5, y: POD[1] - 1.5, w: 3, d: 3, solid: true, sprite: null })
  add({ x: POD[0], y: POD[1], sprite: () => A.podBase(doneCount() * 2) })
  add({ x: POD[0], y: POD[1] + 0.01, pos: () => ({ x: POD[0], y: POD[1] + 0.01, z: 14 + Math.sin(RT.time * 1.6) * 3 + BABY.hop * Math.abs(Math.sin(RT.time * 9)) * 10 }), sprite: () => A.babySprite(doneCount(), anim(3), done(2) ? 'feliz' : 'confuso') })
  add({ x: POD[0] + 0.02, y: POD[1] + 0.02, z: 10, alpha: 0.85, sprite: () => A.podGlass(anim(6)) })
  add({ x: POD[0], y: POD[1] + 0.3, layer: 'ground', blend: 'lighter', sprite: glow(46, '#7fe3ff', 0.35), alpha: () => 0.4 + doneCount() * 0.1 })
  add({ x: POD[0], y: POD[1], z: 96, hidden: () => !flag('p3_nome'), sprite: () => tokenTag(babyName().toUpperCase(), '#7fe3ff', '#0c1430') })
  addInteract({ id: 'bebe', x: POD[0], y: POD[1] + 2.2, r: 1.6, mz: 100, color: '#7fe3ff', icon: 'talk', label: () => (flag('p3_nome') ? `Conversar com ${babyName()}` : 'Olhar a cápsula'), enabled: () => !!flag('p3_intro') && !RT.frozen,
    use: () => start('bebe', async (c) => { BABY.hop = 1; SFX.play('bead'); await c.say({ who: 'BEBE', text: babyLine() }, { ambient: true }) }) })

  /* ---------- as estações ---------- */
  const lit = (i: number) => done(i) || nextSt() === i
  // 1 · dados
  add({ x: 2.6, y: 3.0, w: 2.2, d: 0.5, solid: true, sprite: A.scrollShelf() }, { x: 2.0, y: 6.4, w: 0.5, d: 2.2, solid: true, sprite: box(0.5, 2.2, 40, '#c8d4e4', { top: '#e0e8f4' }) })
  add({ x: 5.4, y: 5.6, w: 1.4, d: 0.9, solid: true, sprite: () => A.terminal(ST[0].color, lit(0), anim(3), 'DADOS') })
  // 2 · tokens
  add({ x: 14.6, y: 3.2, w: 1.4, d: 0.9, solid: true, sprite: () => A.terminal(ST[1].color, lit(1), anim(3), 'TOKENS') })
  ;['A', 'capital', 'do', 'é'].forEach((w, k) => add({ x: 0, y: 0, pos: () => ({ x: 12.2 + k * 0.5, y: 3.4 + (k % 2) * 0.4, z: 18 + Math.sin(RT.time * 2 + k) * 4 }), sprite: tokenTag(w, '#fff3d6', '#5a2a2a'), alpha: () => (lit(1) ? 1 : 0.4) }))
  // 3 · forja
  add({ x: 22.2, y: 3.4, w: 2.4, d: 2, solid: true, sprite: () => A.forge(anim(8), lit(2) || done(2)) })
  // 4 · teste
  add({ x: 25.2, y: 11.4, w: 2, d: 1.6, solid: true, sprite: () => A.testBooth(anim(3), lit(3)) })
  // 5 · ajuste
  add({ x: 21.6, y: 19.4, w: 2, d: 1, solid: true, sprite: () => A.tuner(anim(3), done(4)) })
  // 6 · formatura
  add({ x: 4.6, y: 16.8, w: 4, d: 2.2, solid: true, sprite: A.gradStage() })
  add({ x: 6.2, y: 17.4, z: 10, sprite: A.podium() })
  add({ x: 6.6, y: 17.8, z: 30, hidden: () => !done(5), sprite: () => A.trophy(anim(3)) })
  // telas e caixas
  add({ x: 11.4, y: 1.6, sprite: () => A2.screenPost('#4fd1c5', anim(4)), shadow: 4 }, { x: 20.6, y: 1.6, sprite: () => A2.screenPost('#ffb35a', anim(4) + 2), shadow: 4 })
  add({ x: 26.4, y: 17.4, w: 0.55, d: 0.55, solid: true, sprite: A2.crate('#5a8aa0') }, { x: 26.8, y: 18.1, w: 0.55, d: 0.55, solid: true, sprite: A2.crate('#8a6a4a') }, { x: 26.6, y: 17.7, z: 14, sprite: A2.crate('#5a8aa0') })
  add({ x: 3.4, y: 14.6, sprite: A2.pipeV('#4fd1c5', 30), shadow: 0 }, { x: 27.2, y: 9.2, sprite: A2.pipeV('#4fd1c5', 30), shadow: 0 })
  // bancadas
  add({ x: 9.6, y: 2.0, w: 1.8, d: 0.8, solid: true, sprite: () => A.labBench(anim(2)) }, { x: 18.4, y: 2.0, w: 1.8, d: 0.8, solid: true, sprite: () => A.labBench(anim(2) + 1) })
  add({ x: 2.4, y: 11.6, w: 0.8, d: 1.8, solid: true, sprite: () => A.labBench(anim(2) + 2) })
  // números das estações no chão (placas)
  ST.forEach((s, i) => {
    add({ x: s.use[0], y: s.use[1], z: 58, hidden: () => !(nextSt() === i && flag('p3_intro')), sprite: () => crystal(s.color, 0.6 + Math.sin(RT.time * 4) * 0.08) })
    addInteract({ id: 'p3st' + i, x: s.use[0], y: s.use[1], r: 1.4, mz: 50, color: s.color, label: () => (done(i) ? (['forja', 'teste', 'ajuste'].includes(s.id) ? `Usar de novo: ${s.name}` : `${s.name} (concluída)`) : s.name),
      enabled: () => !!flag('p3_intro') && (nextSt() === i || (done(i) && ['forja', 'teste', 'ajuste'].includes(s.id))),
      use: () => start('p3st' + i, (c) => runStation(c, i)) })
  })
  // portal para casa
  add({ x: PORTAL_P[0], y: PORTAL_P[1], hidden: () => !flag('p3_done'), sprite: () => portalSprite(anim(8), '#ffd27a'), shadow: 0 })
  add({ x: PORTAL_P[0], y: PORTAL_P[1] + 0.6, layer: 'ground', blend: 'lighter', hidden: () => !flag('p3_done'), sprite: glow(30, '#ffd27a', 0.35) })
  addInteract({ id: 'p3_portal', x: PORTAL_USE[0], y: PORTAL_USE[1], r: 1.5, mz: 60, color: '#ffd27a', label: 'Voltar para casa', enabled: () => !!flag('p3_done'), use: () => start('p3_portal', async (c) => { c.objective(null); c.goto('fim') }) })

  /* ---------- habitantes ---------- */
  const npcs: Npc[] = []
  const talking = (who: string) => { const d = useGame.getState().dialog; return !!d && d.lines[d.i]?.who === who }
  const near = (i: number): P2[] => { const u = ST[Math.max(0, i)].use; return [[u[0] + 1.4, u[1] + 0.6], [u[0] + 1.9, u[1] + 1.4], [u[0] + 0.9, u[1] + 1.5]] }
  const sin = makeNpc({ id: 'sinapse', route: near(0), speed: 1.1, pause: 2.4, color: '#4fd1c5', label: 'Falar com a Dra. Sinapse',
    sprite: (n, f) => robotSprite('cientista', '#4fd1c5', n.dir, f, talking('SINAPSE') && Math.floor(RT.time * 6) % 2 === 0),
    canTalk: () => !!flag('p3_intro'),
    talk: () => start('sinapse', async (c) => {
      const i = nextSt()
      await c.say({ who: 'SINAPSE', text: i < 0 ? (flag('p3_done') ? 'O portal para casa está aberto. Foi uma honra trabalhar com você!' : 'Que dia!') : `Próxima parada: ${ST[i].name}. ${babyName()} está ansiosa!` }, { ambient: true })
    }) })
  let lastSt = -2
  npcs.push(sin); add(npcThing(sin)); npcTalk(sin)
  const a1 = makeNpc({ id: 'assist1', route: [[10, 6], [19, 6.4], [20, 17], [10, 17.6]], speed: 1.2, pause: 1.6, sprite: (n, f) => robotSprite('operario', '#ffd25a', n.dir, f) })
  const a2 = makeNpc({ id: 'assist2', route: [[18, 16], [11, 15], [9, 9], [18, 8.4]], speed: 1.0, pause: 2, sprite: (n, f) => robotSprite('carteiro', '#7a8cff', n.dir, f) })
  const d1 = makeNpc({ id: 'labdrone', route: [[8, 8], [22, 8], [22, 18], [8, 18]], speed: 1.4, fly: 70, pause: 1.6, sprite: (_, f) => droneSprite(f, '#e8f0ff', '#4fd1c5') })
  npcs.push(a1, a2, d1); add(npcThing(a1), npcThing(a2), npcThing(d1), npcShadow(d1, 5))
  add({ x: 0, y: 0, pos: () => ({ x: a1.x, y: a1.y, z: 30 + (a1.moving ? Math.abs(Math.sin(a1.walkDist * 5)) * 2 : 0) }), sprite: crystal('#7ef0a0', 0.4) })

  /* ---------- pintura do chão ---------- */
  const cy = hex('#4fd1c5'), cyL = hex('#bff6ff')
  const eachPx = (p: Pix, x: number, y: number, tx: number, ty: number, f: (wx: number, wy: number) => number) => {
    for (let py = 0; py < 16; py++) for (let px = 0; px < 32; px++) {
      if (Math.abs(px + 0.5 - 16) / 16 + Math.abs(py + 0.5 - 8) / 8 > 1) continue
      const X = px + 0.5 - 16, Y = py + 0.5
      const c = f(x + (X / 16 + Y / 8) / 2, y + (Y / 8 - X / 16) / 2)
      if (c) p.px(tx - 16 + px, ty + py, c)
    }
  }
  const paint = (p: Pix, x: number, y: number, tx: number, ty: number) => {
    const d0 = Math.hypot(x + 0.5 - POD[0], y + 0.5 - POD[1])
    if (d0 > 2.4 && d0 < 9.5) eachPx(p, x, y, tx, ty, (wx, wy) => { const d = Math.hypot(wx - POD[0], wy - POD[1]); return Math.abs(d - 3.6) < 0.05 ? cyL : Math.abs(d - 8.4) < 0.04 ? cy : 0 })
  }
  // cabos de luz da cápsula até cada estação
  const cables = ST.map((s) => pulses([[[POD[0], POD[1]], s.use]], s.color, 1.8, 1.4))

  const n0 = nextSt()
  let spawn: P2 = START
  if (flag('p3_intro') && n0 > 0) spawn = [ST[n0 - 1].use[0], ST[n0 - 1].use[1] + 0.8]
  if (flag('p3_done')) spawn = [PORTAL_USE[0], PORTAL_USE[1] - 1.2]
  return {
    w: W, h: H, ground, things, paint,
    cliff: { a: '#8a98ac', b: '#5a687c', depth: 30 },
    falls: { density: 0.05, color: '#7fe3ff' },
    spawn: { pos: spawn, dir: [0, -1] },
    bg: (ctx, w, h, t) => {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0a1a2e'); g.addColorStop(1, '#1e4a5a'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(127,227,255,0.5)'
      for (let i = 0; i < 70; i++) { const x = (hash2(i, 1, 4) * w + t * (4 + hash2(i, 2, 4) * 6)) % w, y = hash2(i, 3, 4) * h; ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1 + (i % 3 === 0 ? 1 : 0)) }
    },
    scripts: [main],
    novaZ: 9,
    init: () => { RT.novaOn = true },
    under: (ctx, t) => { ST.forEach((_, i) => { if (done(i) || nextSt() === i) cables[i](ctx, t) }) },
    update: (dt) => {
      const i = nextSt()
      if (i !== lastSt) { lastSt = i; sin.route = near(i < 0 ? 5 : i); sin.idx = 0 }
      updateNpcs(npcs, dt)
      syncTalk(npcs, INTERACTS)
      BABY.hop = Math.max(0, BABY.hop - dt * 0.6)
      if (Math.random() < dt * (1 + doneCount())) RT.particles.push({ x: POD[0] + (Math.random() - 0.5) * 2, y: POD[1] + (Math.random() - 0.5) * 2, z: 20, vx: 0, vy: 0, vz: 14 + Math.random() * 12, life: 2, max: 2, c: Math.random() < 0.5 ? '#7fe3ff' : '#ffffff', s: 1, g: -2 })
      if (flag('p3_intro') && Math.random() < dt * 0.08) emote(done(2) ? '♪' : '?', () => ({ x: POD[0], y: POD[1], z: 80 }), 1.4)
    },
    onExit: () => { G().setOverlay(OV, null) },
  }
}
