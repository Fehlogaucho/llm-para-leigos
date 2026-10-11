import { Pix, hex, hash2, darker, lighter, mix } from '../../engine/pix'
import { box, boxPix, cyl, glow, label, memo, spr, OUT } from '../../art/core'
import { portalSprite, crystal, ringSprite, brainSprite } from '../../art/fx'
import { novaSprite } from '../../art/person'
import { RT, addInteract, gesture, burst, type Scene, type Thing } from '../../engine/runtime'
import { SFX, playTheme } from '../../engine/audio'
import { G, IS_TOUCH, useGame } from '../../store'
import { gotoLevel, type Ctx } from '../../engine/script'
import { arrive, dataRainBg, tween, fallIn, pulses } from '../common'
import { droneSprite } from '../../art/creatures'
import { makeNpc, npcThing, npcTalk, updateNpcs, syncTalk, type Npc } from '../../engine/npc'
import { INTERACTS, emote } from '../../engine/runtime'
import { gear } from '../p1/art'

/* =========================================================
   PRÓLOGO — O SALÃO DA LANGUAGE ENGINE (pixel art)
   O NEX cai dentro da máquina. A Engine responde, mas não
   lembra por quê; as peças fogem por portais no céu; a NOVA
   acorda e mostra o caminho.
   ========================================================= */
const C = { x: 12, y: 11 } // centro do chão
const ENG = { x: 9.5, y: 3.5, w: 5, d: 4, h: 100 }
const CORE = { x: 12, y: ENG.y + ENG.d, z: 70 } // janela do núcleo (na face da frente)
const DOOR_USE: [number, number] = [12, 8.5]
const PED: [number, number] = [5.2, 13.4]
const PORTAL: [number, number] = [19.6, 12.6]
const PORTAL_USE: [number, number] = [18.9, 13.6]
const SPAWN: [number, number] = [16.5, 17.5]

const S = { phrases: 0, on: 0, open: 0, brk: 0, crack: 0, portal: 0, novaBoot: 0 } // estado visual (0..1)
const flag = (k: string) => G().flags[k] || 0

/* ---------- a máquina ---------- */
function engineSprite(on: number, open: boolean, f: number) {
  return memo(`pro:eng:${on}:${open}:${f}`, () => {
    const cyan = '#3fc4ff'
    const { p, ax, ay } = boxPix(ENG.w, ENG.d, ENG.h, '#343a58', {
      top: '#2a2f48',
      leftFn: (u, zz) => {
        const px = u * ENG.w * 16
        if (zz < 6) return hex('#1e2238')
        if (Math.abs(u - 0.5) < 0.13 && zz < 46) {
          if (Math.abs(u - 0.5) > 0.115 || zz > 44) return hex('#5a6488')
          if (open) return hex(zz < 40 ? mix('#bff3ff', '#3fa8ff', zz / 40) : '#0a1630')
          const gl = [12, 20, 28, 36].some((g, i) => Math.abs(zz - g) < 1 && Math.abs(u - 0.5) < 0.09 - i * 0.015)
          const ring = Math.abs(Math.hypot((u - 0.5) * ENG.w * 16, (zz - 24) * 1) - 6) < 1
          return hex(gl || ring ? (f % 2 ? '#7fe3ff' : '#3fb8e8') : '#0a1630')
        }
        const dc = Math.hypot(px - ENG.w * 8, zz - 72)
        if (dc < 16) {
          if (dc > 13.5) return hex('#8a94b8')
          if (on > 0) { const k = dc / 13.5; return hex(k < 0.35 ? '#ffffff' : k < 0.65 ? '#bff3ff' : (f % 2 ? cyan : '#2aa0e8')) }
          return hex(dc < 2.5 && f % 4 !== 0 ? '#7fe3ff' : dc < 5 ? '#1a3a5a' : '#0c1a2e')
        }
        if (Math.abs(u - 0.12) < 0.025 || Math.abs(u - 0.88) < 0.025) return hex(on ? (Math.floor(zz / 6) + f) % 3 ? cyan : '#bff3ff' : '#1c2a44')
        if (Math.floor(zz) % 24 === 0) return hex('#262b44')
        return null
      },
      rightFn: (v, zz) => {
        if (zz < 6) return hex('#161a2c')
        if (zz > 20 && zz < 60 && v > 0.2 && v < 0.8 && Math.floor(zz) % 4 === 0) return hex('#1a1e30')
        if (zz > 76 && zz < 90 && Math.abs(v - 0.5) < 0.3) { const i = Math.floor(v * 12); return hex((i + f) % 3 === 0 && on ? '#ffd27a' : (i % 2 ? '#3a2a1a' : '#5a3a1a')) }
        if (Math.floor(zz) % 24 === 0) return hex('#1e2236')
        return null
      },
      topFn: (u, v) => { const d = Math.hypot((u - 0.5) * ENG.w, (v - 0.5) * ENG.d); return d < 1.3 ? hex(on ? (d < 0.6 ? '#bff3ff' : cyan) : '#1c2a44') : d < 1.5 ? hex('#8a94b8') : null },
    })
    return spr(p, ax, ay)
  })
}
const pillar = (on: boolean, f: number) => memo(`pro:pil:${on}:${f}`, () => box(1, 1, 120, '#2a3048', {
  top: '#3a4060',
  leftFn: (u, zz) => (Math.abs(u - 0.5) < 0.14 && zz > 8 && zz < 112 ? hex(on ? ((Math.floor(zz / 8) + f) % 4 ? '#3fc4ff' : '#bff3ff') : '#1c3a5a') : zz < 6 ? hex('#1a1e30') : null),
  rightFn: (v, zz) => (Math.abs(v - 0.5) < 0.14 && zz > 8 && zz < 112 ? hex(on ? '#2a90d0' : '#16304a') : zz < 6 ? hex('#141828') : null),
}))
const pylon = (on: boolean) => memo(`pro:py:${on}`, () => box(0.6, 0.6, 18, '#2a3048', { top: on ? '#7fe3ff' : '#2a5a7a' }))
const pedestal = () => memo('pro:ped', () => cyl(9, 14, '#3a4060', '#7fe3ff'))
function dormantNova() { return novaSprite(true, false, 0, true) }

/* ---------- telas holográficas com texto correndo ---------- */
function holoScreen(i: number, f: number) {
  return memo(`pro:hs:${i}:${f % 8}`, () => {
    const p = new Pix(30, 20)
    const c = ['#7fe3ff', '#c8a8ff', '#8ff0b0', '#ffd27a'][i % 4]
    p.rect(0, 0, 30, 20, hex(mix(c, '#06122a', 0.75))); p.rect(0, 0, 30, 1, hex(c)); p.rect(0, 19, 30, 1, hex(c)); p.rect(0, 0, 1, 20, hex(c)); p.rect(29, 0, 1, 20, hex(c))
    for (let r = 0; r < 5; r++) { const len = 6 + Math.floor(hash2(r + f, i, 3) * 18); p.rect(3, 3 + r * 3, len, 1, hex(r === 4 - (f % 5) ? '#ffffff' : c)) }
    return spr(p, 15, 20)
  })
}

/* ---------- frases que aparecem no ar ---------- */
const PHRASES = ['“Olá.”', '“Quem é você?”', '“Conte uma história.”', '“Explique…”', '“Por quê?”', '“Qual é a capital do Brasil?”', '“Me ajude com…”', '“O que é isso?”', '“Traduza…”', '“Resuma…”']
const ITEMS = Array.from({ length: 15 }, (_, i) => ({ t: PHRASES[i % PHRASES.length], a: i * 1.37, r: 4.4 + (i % 3) * 1.5, z: 24 + (i % 5) * 22, sp: 0.1 + (i % 4) * 0.04, col: i % 3 ? '#bff3ff' : '#ffe2a3' }))

/* ---------- portais no céu ---------- */
const RINGS = Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return { x: 12 + Math.cos(a) * 5.5, y: 5.5 + Math.sin(a) * 4, z: 150 + (i % 2) * 22, col: ['#7fe3ff', '#c8a8ff', '#ffd27a', '#8ff0b0', '#ff9ad0', '#59d7ff'][i] } })

/* ---------- roteiro ---------- */
async function main(c: Ctx) {
  if (c.flag('pro_portal')) { RT.novaOn = true; S.on = 1; S.brk = 0; S.portal = 1; c.objective('Entre no portal', PORTAL_USE); return }
  const move = IS_TOUCH ? 'Arraste o círculo dourado para andar, ou toque no chão onde quer ir.' : 'Use WASD ou as setas para andar (Shift corre). Também dá para clicar no chão.'
  const first = !c.flag('pro_seen')
  c.freeze(true)
  if (first) RT.nexScale = 0.01
  await c.cinematic([
    { pos: [12, 5], h: 90, zoom: 1, cut: true },
    { pos: [12, 5], h: 90, zoom: 1, dur: 1.5 },
    { pos: [13.5, 10], h: 40, zoom: 1, dur: 3.5 },
    { pos: SPAWN, h: 14, zoom: 2, dur: 2.5 },
  ])
  if (first) {
    c.focus(SPAWN, 2, 14)
    await fallIn(c)
    gesture('think', 1.6)
    c.setFlag('pro_seen')
    await c.wait(0.4)
  }
  c.unfocus(); c.freeze(false)
  await c.say([
    { who: 'NEX', text: 'Ai… minha cabeça. Eu estava no meu quarto, perguntei uma coisa para a IA… e levei um choque.' },
    { who: 'NEX', text: 'Que lugar é esse? Parece o lado de dentro de uma máquina.' },
    { who: 'NEX', text: 'E aquela máquina gigante no meio… ainda tem uma luzinha acesa.' },
  ], { ambient: true })
  await c.say({ who: 'SISTEMA', text: move }, { ambient: true })
  c.objective('Toque na porta da máquina', DOOR_USE)
  await c.waitFlag('pro_door')
  // ---- a máquina acorda ----
  c.objective(null)
  c.freeze(true)
  RT.lookAt = [12, 5]
  gesture('cheer', 1.2)
  SFX.play('open')
  await c.cinematic([{ pos: [12, 8], h: 60, zoom: 1, dur: 1.4 }], false)
  await tween(c, 1.2, (k) => { S.phrases = k })
  await c.wait(3.2)
  SFX.play('whoosh')
  await tween(c, 0.5, (k) => { S.phrases = 1 - k })
  S.phrases = 0
  c.setFlag('pro_on')
  playTheme('tensao')
  await tween(c, 1.6, (k) => { S.on = k })
  RT.cam.shake = 0.4
  await c.cinematic([{ pos: [12, 7], h: 80, zoom: 1, dur: 1.2 }], false)
  await c.say([
    { who: 'ENGINE', text: 'Eu consigo responder.' },
    { who: 'ENGINE', text: '…' },
    { who: 'ENGINE', text: 'Mas não consigo lembrar por quê.' },
  ])
  // ---- as peças fogem ----
  c.setFlag('pro_break', 1)
  SFX.play('portal')
  RT.cam.shake = 1
  await c.cinematic([{ pos: [12, 6], h: 120, zoom: 1, dur: 1.6 }], false)
  await tween(c, 1.2, (k) => { S.brk = k })
  await c.wait(3.2)
  await tween(c, 1, (k) => { S.brk = 1 - k })
  c.setFlag('pro_break', 2)
  S.on = 0.35
  SFX.play('stone')
  playTheme('lab')
  await c.wait(0.4)
  // ---- a NOVA acorda ----
  RT.lookAt = PED
  await c.cinematic([{ pos: [PED[0] + 1, PED[1]], h: 20, zoom: 2, dur: 1.8 }], false)
  // os olhos piscam, ligando
  await tween(c, 1.4, (k) => { S.novaBoot = k })
  emote('!', { x: PED[0], y: PED[1], z: 44 }, 1.2)
  RT.nova.x = PED[0]; RT.nova.y = PED[1]; RT.nova.z = 15
  RT.novaPos = { x: PED[0], y: PED[1], z: 36 }
  RT.novaOn = true
  c.setFlag('nova', 1)
  SFX.play('chime')
  burst(PED[0], PED[1], 24, 18, ['#bff3ff', '#7fe3ff', '#ffffff'], { spd: 1.4, up: 40, life: 0.9 })
  await c.wait(0.9)
  RT.novaPos = { x: PED[0] + 0.7, y: PED[1] + 0.9, z: 12 }
  await c.wait(0.6)
  // o NEX vai até ela
  RT.player.x = PED[0] + 2.6; RT.player.y = PED[1] + 1.4
  RT.lookAt = [PED[0] + 0.6, PED[1] + 0.8]
  c.focus([PED[0] + 1.6, PED[1] + 1.1], 2, 18)
  await c.wait(0.6)
  await c.say([
    { who: 'NOVA', text: 'Sistema… ligado. Olá! Eu sou a NOVA, a guia desta máquina.' },
    { who: 'NEX', text: 'Eu estava conversando com uma IA no meu computador. Teve um raio, um choque… e a tela me puxou!' },
    { who: 'NOVA', text: 'Eu sei. Você está dentro dela: esta é a Language Engine, a LLM com quem você conversava.' },
    { who: 'NOVA', text: 'O choque que te trouxe para cá também embaralhou a memória dela. Ela ainda consegue responder, mas esqueceu como funciona.' },
    { who: 'NOVA', text: 'As peças que explicam como ela pensa, os Núcleos de Conhecimento, se espalharam por mundos diferentes.' },
    { who: 'NEX', text: 'E como eu volto para casa?' },
    { who: 'NOVA', text: 'Ajudando a máquina a se lembrar. Cada mundo guarda uma ideia: primeiro as origens, como números, regras e máquinas; depois, o que faz uma LLM escrever.' },
    { who: 'NOVA', text: 'Quando os núcleos voltarem, ela vai funcionar direito de novo. E vai poder te devolver ao seu quarto.' },
    {
      who: 'NOVA', text: 'Quer saber mais antes de ir?', choices: [
        { label: 'O que são esses mundos?', next: [{ who: 'NOVA', text: 'Cada mundo guarda uma ideia que tornou possível uma máquina de linguagem. Os primeiros são bem antigos: começam com um pastor contando ovelhas com fichinhas de barro.' }] },
        { label: 'Por que você me ajuda?', next: [{ who: 'NOVA', text: 'Porque perguntas são o combustível desta máquina. E você parece ter muitas.' }] },
        { label: 'Vamos logo!', next: [{ who: 'NOVA', text: 'Gosto da energia!' }] },
      ],
    },
  ])
  c.discover('engine')
  RT.novaPos = null; RT.lookAt = null
  c.setFlag('pro_portal', 1)
  S.portal = 0
  SFX.play('portal')
  tween(c, 1.1, (k) => { S.portal = k * k * (3 - 2 * k) }).catch(() => {})
  burst(PORTAL[0], PORTAL[1], 20, 30, ['#7fe3ff', '#c8a8ff', '#ffffff'], { spd: 2, up: 60, life: 1 })
  await c.cinematic([{ pos: [PORTAL[0] - 1, PORTAL[1]], h: 26, zoom: 1, dur: 1.4 }, { pos: [PORTAL[0] - 1, PORTAL[1]], h: 26, zoom: 1, dur: 1 }], false)
  c.unfocus(); c.freeze(false)
  await c.say({ who: 'NOVA', text: 'Um portal se abriu! Vamos atravessar.' }, { ambient: true })
  c.objective('Entre no portal', PORTAL_USE)
}

/* ---------- a fase ---------- */
export default function build(): Scene {
  S.phrases = 0; S.on = flag('pro_on') ? 0.35 : 0; S.brk = 0
  const things: Thing[] = []
  const T = (t: Thing) => { things.push(t); return t }
  const fr = () => Math.floor(RT.time * 6)
  T({ x: ENG.x, y: ENG.y, w: ENG.w, d: ENG.d, solid: true, sprite: () => engineSprite(S.on > 0.5 ? 1 : 0, !!flag('pro_door'), fr() % 4) })
  // cúpula e cristais de energia
  T({ x: 12, y: 5.5, z: ENG.h, sprite: cyl(20, 10, '#2a3050', '#1c2a44') })
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2
    T({ x: 0, y: 0, pos: () => { const a = a0 + RT.time * 0.4; return { x: 12 + Math.cos(a) * 1.4, y: 5.5 + Math.sin(a) * 1.4, z: ENG.h + 22 + Math.sin(RT.time * 2 + i) * 4 } }, sprite: crystal(i % 2 ? '#c8a8ff' : '#7fe3ff', 0.8), alpha: () => 0.4 + S.on * 0.6 })
  }
  T({ x: 12, y: 5.5, z: ENG.h, layer: 'top', blend: 'lighter', sprite: glow(30, '#3fc4ff', 0.5), alpha: () => 0.15 + S.on * 0.85 })
  // o cérebro em holograma acima da máquina (fraco enquanto ela não lembra)
  T({ x: 12, y: 5.5, z: ENG.h + 40, layer: 'top', blend: 'lighter', pos: () => ({ x: 12, y: 5.5, z: ENG.h + 40 + Math.sin(RT.time * 1.2) * 3 }), sprite: () => brainSprite(fr(), '#3fc4ff'), alpha: () => (S.on > 0.5 ? 0.85 + Math.sin(RT.time * 3) * 0.1 : 0.25 + (Math.random() < 0.05 ? 0.3 : 0)) })
  T({ x: 12, y: 8.6, layer: 'ground', blend: 'lighter', sprite: glow(44, '#3fc4ff', 0.3), alpha: () => 0.3 + S.on * 0.7 })
  // pilares (atrás) e postes baixos (na frente)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, x = C.x + Math.cos(a) * 9.6, y = C.y + Math.sin(a) * 9.2
    if (Math.cos(a) + Math.sin(a) < -0.2) T({ x: Math.floor(x), y: Math.floor(y), w: 1, d: 1, solid: true, sprite: () => pillar(S.on > 0.5, fr() % 4) })
    else T({ x: Math.floor(x) + 0.2, y: Math.floor(y) + 0.2, w: 0.6, d: 0.6, solid: true, sprite: () => pylon(S.on > 0.3) })
  }
  // pedestal da NOVA
  T({ x: PED[0], y: PED[1], solid: false, sprite: pedestal(), shadow: 0 })
  T({ x: PED[0], y: PED[1] + 0.05, z: 15, hidden: () => !!flag('nova'), sprite: () => (S.novaBoot > 0 && Math.floor(RT.time * (4 + S.novaBoot * 10)) % 2 ? novaSprite(false, false, 0, S.novaBoot < 0.6) : dormantNova()) })
  // telas holográficas em volta da máquina
  for (let i = 0; i < 4; i++) {
    const a0 = (i / 4) * Math.PI * 2 + 0.4
    T({ x: 0, y: 0, layer: 'top', pos: () => { const a = a0 + RT.time * 0.12; return { x: 12 + Math.cos(a) * 4.4, y: 5.5 + Math.sin(a) * 3.8, z: 56 + Math.sin(RT.time * 1.3 + i) * 4 } }, sprite: () => holoScreen(i, Math.floor(RT.time * 3)), alpha: () => 0.35 + S.on * 0.5 })
  }
  // engrenagens na lateral da máquina
  T({ x: ENG.x + ENG.w + 0.02, y: ENG.y + 1.1, z: 60, sprite: () => gear(9, '#c8a040', Math.floor(RT.time * (2 + S.on * 8))) })
  T({ x: ENG.x + ENG.w + 0.03, y: ENG.y + 2.0, z: 48, sprite: () => gear(6, '#c87a3a', 3 - (Math.floor(RT.time * (2 + S.on * 8)) % 4)) })
  T({ x: ENG.x + ENG.w + 0.04, y: ENG.y + 2.6, z: 64, sprite: () => gear(5, '#c8a040', Math.floor(RT.time * (2 + S.on * 8))) })
  // frases no ar
  for (const it of ITEMS) {
    T({ x: 0, y: 0, hidden: () => S.phrases <= 0.01, pos: () => { const a = it.a + RT.time * it.sp, r = it.r * (0.6 + S.phrases * 0.4); return { x: 12 + Math.cos(a) * r, y: 5.5 + Math.sin(a) * r * 0.9, z: it.z + Math.sin(RT.time + it.a) * 3 } }, sprite: label(it.t, it.col, '#0a2040'), alpha: () => S.phrases })
  }
  // portais no céu e as peças fugindo
  for (const r of RINGS) T({ x: r.x, y: r.y, z: r.z, layer: 'top', hidden: () => S.brk <= 0.01, sprite: () => ringSprite(r.col, fr()), alpha: () => S.brk, scale: () => 0.3 + S.brk * 0.7 })
  // o portal de saída
  T({ x: PORTAL[0], y: PORTAL[1], hidden: () => !flag('pro_portal') || S.portal < 0.02, sprite: () => portalSprite(fr(), '#7fe3ff'), scale: () => S.portal, shadow: 0 })
  T({ x: PORTAL[0], y: PORTAL[1] + 0.6, layer: 'ground', blend: 'lighter', hidden: () => !flag('pro_portal'), sprite: glow(30, '#7fe3ff', 0.35) })

  // drones de manutenção
  const drones: Npc[] = [
    makeNpc({ id: 'drone1', route: [[6, 9], [9, 14], [15, 16], [18, 11], [16, 8.5], [9, 8.5]], speed: 1.3, fly: 46, pause: 1.5, sprite: (n, f) => droneSprite(f, '#c8d0e0', S.on > 0.5 ? '#7fe3ff' : '#ffb35a'),
      talk: () => { emote('♪', () => ({ x: drones[0].x, y: drones[0].y, z: 70 }), 1.5); SFX.play('bead'); useGame.getState().showToast('Bip-bop! Manutenção da Language Engine. Memória bagunçada… bip.') }, label: 'Falar com o drone', color: '#7fe3ff' }),
    makeNpc({ id: 'drone2', route: [[17, 6], [19, 13], [13, 18], [6, 15], [4.5, 10]], speed: 1.1, fly: 58, pause: 2, sprite: (n, f) => droneSprite(f + 1, '#d8c8a8', '#ffd27a') }),
  ]
  for (const d of drones) { T(npcThing(d)); T({ x: d.x, y: d.y, layer: 'ground', blend: 'lighter', pos: () => ({ x: d.x, y: d.y }), sprite: glow(12, '#7fe3ff', 0.25) }); npcTalk(d) }
  addInteract({ id: 'pro_door', x: DOOR_USE[0], y: DOOR_USE[1], r: 1.6, label: 'Tocar na porta', color: '#7fe3ff', mz: 54, enabled: () => !flag('pro_door') && !!useGame.getState().objective?.text?.startsWith('Toque'), use: () => G().setFlag('pro_door') })
  addInteract({ id: 'pro_portal', x: PORTAL_USE[0], y: PORTAL_USE[1], r: 1.6, label: 'Entrar no portal', color: '#7fe3ff', mz: 58, enabled: () => !!flag('pro_portal'), use: () => { G().setFlag('pro_done'); useGame.setState({ objective: null }); gotoLevel('p1') } })

  const ground = (x: number, y: number) => {
    const d = Math.hypot((x + 0.5 - C.x) / 10.5, (y + 0.5 - C.y) / 10.2)
    if (d > 1) return null
    return { s: 'metal', a: (x + y) % 2 ? '#454b68' : '#40465f', b: '#2a2e44', c: '#5a6284' }
  }
  const ringCol = hex('#2a7ac0'), ringHi = hex('#5ad0ff')
  return {
    w: 24, h: 24, ground, things,
    cliff: { a: '#2c3048', b: '#1c1f30', depth: 44 },
    spawn: { pos: flag('pro_portal') ? [PORTAL_USE[0] - 1.5, PORTAL_USE[1] + 1.5] : SPAWN, dir: [-1, -1] },
    bg: dataRainBg('#03050c', '#0c1430', '#2a6aa8'),
    falls: { density: 0.1, color: '#3fb8ff' },
    scripts: [main],
    novaZ: 9,
    paint: (p, x, y, tx, ty) => {
      // círculos e raios de circuito em volta da máquina
      for (let py = 0; py < 16; py++) for (let px = 0; px < 32; px++) {
        if (Math.abs(px + 0.5 - 16) / 16 + Math.abs(py + 0.5 - 8) / 8 > 1) continue
        const X = px + 0.5 - 16, Y = py + 0.5
        const wx = x + (X / 16 + Y / 8) / 2, wy = y + (Y / 8 - X / 16) / 2
        const dx = wx - 12, dy = wy - 6.5, d = Math.hypot(dx, dy * 1.1)
        let on = false
        for (const R of [5, 7.5, 10]) if (Math.abs(d - R) < 0.045) on = true
        const a = Math.atan2(dy, dx), k = (a / (Math.PI * 2)) * 16
        if (d > 5 && d < 10 && Math.abs(k - Math.round(k)) * d * 0.4 < 0.03) on = true
        if (on) p.px(tx - 16 + px, ty + py, hash2(Math.floor(wx * 3), Math.floor(wy * 3), 2) < 0.15 ? ringHi : ringCol)
      }
    },
    init: () => { if (flag('nova')) RT.novaOn = true },
    under: pulses([
      ...Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 + 0.2; return [[12 + Math.cos(a) * 10, 6.5 + Math.sin(a) * 9], [12 + Math.cos(a) * 5, 6.5 + Math.sin(a) * 4.6]] as [number, number][] }),
      Array.from({ length: 41 }, (_, i) => { const a = (i / 40) * Math.PI * 2; return [12 + Math.cos(a) * 7.5, 6.5 + Math.sin(a) * 6.8] as [number, number] }),
    ], '#bff3ff', 2.4, 2.6),
    update: (dt) => {
      updateNpcs(drones, dt); syncTalk(drones, INTERACTS)
      if (Math.random() < dt * (0.6 + S.on * 2)) RT.particles.push({ x: ENG.x + 0.6 + Math.random() * 0.5, y: ENG.y + 0.4, z: ENG.h + 6, vx: (Math.random() - 0.5) * 0.2, vy: 0, vz: 18, life: 1.6, max: 1.6, c: Math.random() < 0.5 ? '#8a90b0' : '#6a7090', s: 2, g: -2 })
      if (S.brk > 0.5 && Math.random() < 0.7) {
        const r = RINGS[Math.floor(Math.random() * RINGS.length)]
        const vx = (r.x - CORE.x) / 1.1, vy = (r.y - CORE.y) / 1.1, vz = (r.z - CORE.z) / 1.1
        RT.particles.push({ x: CORE.x, y: CORE.y, z: CORE.z, vx, vy, vz, life: 1.1, max: 1.1, c: r.col, s: 2, g: 0 })
      }
      if (S.on > 0.5 && Math.random() < 0.08) burst(12, 7.6, 72, 1, ['#bff3ff'], { spd: 0.4, up: 10, life: 0.6, g: -20 })
    },
  }
}
