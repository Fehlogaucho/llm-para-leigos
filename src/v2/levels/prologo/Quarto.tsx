import { useEffect, useRef, useState } from 'react'
import { Pix, hex, hash2, darker, lighter, mix } from '../../engine/pix'
import { box, boxPix, spr, memo, wallDecal, glow, cyl, OUT } from '../../art/core'
import { personSprite, NEX } from '../../art/person'
import { RT, addInteract, gesture, burst, emote, emoteNex, type Scene, type Thing } from '../../engine/runtime'
import { catSprite, type CatPose } from '../../art/creatures'
import { tween } from '../common'
import { SFX, playTheme } from '../../engine/audio'
import { G, useGame } from '../../store'
import { babyName } from '../p3/lab'
import type { Ctx } from '../../engine/script'

/* =========================================================
   ABERTURA — O QUARTO DO NEX (pixel art)
   Noite de tempestade. NEX pergunta à IA “Como você funciona?”.
   Um raio, um choque: ele encolhe e é sugado para dentro da tela.
   ========================================================= */
const PC_USE: [number, number] = [5.3, 2.3]
const SEAT: [number, number] = [5.32, 1.27]
const SCREEN = { x: 5.3, y: 0.3, z: 36 }

/* ---------- estado da cena ---------- */
export const FX = {
  msgs: [] as { me: boolean; text: string }[],
  typing: null as null | { me: boolean; full: string; n: number },
  glitch: 0, vortex: 0, flash: 0, sparks: false, open: false,
  pull: null as null | { t0: number; x: number; y: number },
  shrink: null as null | { t0: number },
  white: 0,
  v: 0,
}
function resetFX() { Object.assign(FX, { msgs: [], typing: null, glitch: 0, vortex: 0, flash: 0, sparks: false, open: false, pull: null, shrink: null, white: 0 }); FX.v++ }
/** O gato do NEX: dorme na cama até o raio. */
const CAT = { pose: 'dorme' as CatPose, x: 1.15, y: 5.5, z: 18, flip: false, hidden: false, run: null as null | { t0: number; pts: [number, number, number][] }, lastZ: 0 }
function resetCat() { Object.assign(CAT, { pose: 'dorme', x: 1.15, y: 5.5, z: 18, flip: false, hidden: false, run: null, lastZ: 0 }) }
function scareCat() {
  if (CAT.run || CAT.hidden) return
  CAT.pose = 'assustado'
  emote('!', () => ({ x: CAT.x, y: CAT.y, z: CAT.z + 18 }), 1.2)
  CAT.run = { t0: RT.time + 0.5, pts: [[1.15, 5.5, 18], [2.3, 6.2, 0], [2.6, 3.4, 0], [0.4, 3.1, 0]] }
}

/* ---------- arte do quarto ---------- */
const WALL = '#26345e'
const wallFn = (u: number, zz: number, x: number, y: number) => {
  if (zz < 5) return hex('#1a1426')
  if (zz > 74) return hex('#3a4a7e')
  if ((x % 14 === 7 && y % 16 === 8) || ((x % 14 === 6 || x % 14 === 8) && y % 16 === 8) || (x % 14 === 7 && (y % 16 === 7 || y % 16 === 9))) return hex('#4a5a96')
  return null
}
const wallR = () => memo('q:wallR', () => box(8, 0.35, 78, WALL, { top: '#141a30', leftFn: wallFn }))
const wallL = () => memo('q:wallL', () => box(0.35, 7.7, 78, darker(WALL, 0.12), { top: '#141a30', rightFn: wallFn }))

function windowSprite(frame: number, flash: boolean, sunny = false) {
  return memo(`q:win:${sunny ? 0 : frame}:${flash}:${sunny}`, () => wallDecal(2.6, 38, 'x', (u, v, c, r) => {
    if (u < 0.1 || u > 0.9) return hex(((c >> 1) % 2) ? '#8a2a3a' : '#a8384a') // cortinas
    const uu = (u - 0.1) / 0.8
    if (uu < 0.03 || uu > 0.97 || v < 0.07 || v > 0.93 || Math.abs(uu - 0.5) < 0.02 || Math.abs(v - 0.52) < 0.03) return hex('#c8b898')
    if (sunny) {
      const bi = Math.floor(uu * 10), bh = 0.18 + hash2(bi, 3, 1) * 0.42
      if (v < bh) return hex(c % 3 === 1 && r % 3 === 1 && hash2(c, r, 2) < 0.3 ? '#9ab8d8' : '#6a7a9a')
      if (Math.hypot((uu - 0.74) * 2.6, v - 0.74) < 0.12) return hex('#fff2b0')
      if (Math.abs(v - 0.66 - Math.sin(uu * 9) * 0.03) < 0.04 && uu < 0.45) return hex('#ffffff')
      return hex(mix('#ffd8a8', '#7ab8f0', v))
    }
    if (flash) { if (Math.abs(uu - 0.72 - Math.sin(v * 14) * 0.05) < 0.025 && v > 0.4) return hex('#ffffff'); return hex(mix('#b8c8ff', '#6a78c8', v)) }
    const bi = Math.floor(uu * 10), bh = 0.18 + hash2(bi, 3, 1) * 0.42
    if (v < bh) {
      if (c % 3 === 1 && r % 3 === 1 && hash2(c, r, 2) < 0.4) return hex(hash2(c, r, 5) < 0.85 ? '#ffd27a' : '#9fe9ff')
      return hex('#0c1024')
    }
    if ((c + r + frame * 3) % 9 === 0 && r % 3 < 2) return hex('#7a8ac8')
    return hex(mix('#3a2e6a', '#0a0e22', v))
  }))
}
const poster = () => memo('q:poster', () => wallDecal(1.1, 30, 'x', (u, v) => {
  if (u < 0.05 || u > 0.95 || v < 0.05 || v > 0.95) return hex('#e8dcc0')
  const d = (cx: number, cy: number) => Math.hypot((u - cx) * 1.1, (v - cy) * 1.4)
  if (d(0.5, 0.62) < 0.2) return hex(d(0.45, 0.68) < 0.1 ? '#f2c080' : '#e7a85a')
  if (Math.abs((v - 0.62) * 1.4 - (u - 0.5) * 0.25) < 0.025 && Math.abs(u - 0.5) < 0.4) return hex('#ffe2a3')
  if (d(0.25, 0.3) < 0.08) return hex('#5aa8e7')
  if (d(0.78, 0.28) < 0.06) return hex('#c96ae0')
  if (v < 0.18 && v > 0.1 && u > 0.2 && u < 0.8) return hex('#ffe2a3')
  return hash2(Math.floor(u * 40), Math.floor(v * 40), 4) < 0.04 ? hex('#ffffff') : hex('#0d1230')
}, true))
const door = () => memo('q:door', () => wallDecal(1.1, 56, 'y', (u, v) => {
  if (u < 0.06 || u > 0.94 || v > 0.95) return hex('#4a2e1c')
  if (Math.abs(u - 0.2) < 0.04 && Math.abs(v - 0.48) < 0.03) return hex('#e8c060')
  const pan = (Math.abs(u - 0.5) < 0.3 && ((v > 0.55 && v < 0.88) || (v > 0.1 && v < 0.45)))
  return hex(pan ? '#7a4e30' : '#8a5a38')
}, true))
const bookshelf = () => memo('q:shelf', () => box(0.6, 1.8, 58, '#6a4228', {
  rightFn: (v, zz, x) => {
    const sh = Math.floor(zz) % 14
    if (sh < 2 || zz > 55) return hex('#4a2e1c')
    const b = Math.floor(x / 3), hgt = 9 + Math.floor(hash2(b, Math.floor(zz / 14), 1) * 3)
    if (sh > hgt) return hex('#2a1a12')
    const pal = ['#c84a3a', '#3a7ac8', '#e8b65a', '#4ab87a', '#8a5ac8', '#e8e0d0']
    const col = pal[Math.floor(hash2(b, Math.floor(zz / 14), 9) * pal.length)]
    return hex(x % 3 === 2 ? darker(col, 0.3) : col)
  },
}))
const bed = () => memo('q:bed', () => box(1.9, 2.9, 18, '#6a4228', {
  topFn: (u, v) => v < 0.22 ? hex(u > 0.12 && u < 0.88 && v > 0.04 ? '#f2eee4' : '#d8d0c0') : hex(((Math.floor(u * 8) + Math.floor(v * 10)) % 2) ? '#3a6ad0' : '#3262c0'),
  leftFn: (u, zz) => zz > 9 ? hex('#3262c0') : null,
  rightFn: (v, zz) => zz > 9 ? hex(v < 0.22 ? '#d8d0c0' : '#2a52a8') : null,
}))
const desk = () => memo('q:desk', () => box(2.1, 0.9, 22, '#8a5a34', {
  leftFn: (u, zz) => (u > 0.58 && u < 0.95 && zz > 4 && zz < 18) ? hex(Math.abs(zz - 11) < 1 || (Math.abs(u - 0.76) < 0.03 && (Math.abs(zz - 7) < 1 || Math.abs(zz - 15) < 1)) ? '#e8c060' : '#9a6a40') : (u < 0.05 || (u > 0.5 && u < 0.55)) ? hex('#6a4228') : null,
}))
function monitorSprite(state: string, frame: number) {
  return memo(`q:mon:${state}:${frame}`, () => {
    const { p, ax, ay } = boxPix(1.25, 0.16, 24, '#20242e', {
      leftFn: (u, zz, x, y) => {
        if (u < 0.06 || u > 0.94 || zz < 4 || zz > 21) return null
        if (state === 'vortex') {
          const dx = (u - 0.5) * 2.2, dy = (zz - 12.5) / 9, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx)
          const s = Math.sin(a * 3 + r * 9 - frame * 1.3)
          return hex(r < 0.18 ? '#ffffff' : s > 0.3 ? '#9fe9ff' : s > -0.3 ? '#5a7aff' : '#c06aff')
        }
        if (state === 'glitch') return hex(hash2(Math.floor(y / 2) + frame * 7, 1, 3) < 0.3 ? (hash2(y, frame, 1) < 0.5 ? '#ff3c5a' : '#3cdcff') : '#0f1424')
        // conversa: barra de título e balões
        if (zz > 18) return hex('#18213d')
        if (zz < 6) return hex('#18213d')
        const row = Math.floor((18 - zz) / 3)
        const me = row % 2 === 1
        const len = 0.3 + hash2(row, 0, 2) * 0.35
        if (Math.floor(zz) % 3 !== 0 && (me ? u > 0.92 - len : u < 0.08 + len) && row < 4) return hex(me ? '#2f6bd8' : '#3a4670')
        return hex('#0f1424')
      },
    })
    // pé do monitor
    p.rect(ax + 4, ay + 2, 3, 3, hex('#20242e'))
    return spr(p, ax, ay)
  })
}
const keyboard = () => memo('q:kb', () => box(0.9, 0.28, 2, '#d8d8e0', { topFn: (u, v, p, x, y) => (x + y) % 3 === 0 ? hex('#9a9aa8') : null }))
const lamp = () => memo('q:lamp', () => {
  const p = new Pix(14, 22)
  p.ellipse(7, 19, 4, 2, hex('#3a3a46'))
  p.line(7, 18, 9, 9, hex('#5a5a66')); p.line(9, 9, 6, 5, hex('#5a5a66'))
  p.poly([[1, 6], [6, 2], [10, 6], [7, 9]], hex('#f2c66d'))
  p.px(5, 4, hex('#fff2c0'))
  p.outline(hex(OUT))
  return spr(p, 7, 20)
})
const chairSeat = () => memo('q:chair', () => box(0.75, 0.55, 12, '#2a3a6a', { top: '#3a4a8a' }))
const chairBack = () => memo('q:chairB', () => box(0.75, 0.12, 30, '#2a3a6a', { top: '#3a4a8a', leftFn: (u, zz) => (zz < 13 && (u < 0.12 || u > 0.88) ? hex('#1a2448') : zz < 13 ? null : null) }))
const strip = () => memo('q:strip', () => box(0.55, 0.16, 3, '#e8e8f0', { topFn: (u) => (u > 0.8 ? hex('#ff4a4a') : u > 0.2 && Math.floor(u * 10) % 2 ? hex('#5a5a66') : null) }))
const plant = () => memo('q:plant', () => {
  const p = new Pix(18, 26)
  const pot = cyl(4, 7, '#b8603a', '#6a3a1a')
  p.blit(fromCanvas(pot.img), 9 - pot.ax, 25 - pot.ay)
  const lf = hex('#4ab85a'), ld = hex('#2a7a3a')
  for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.45; p.line(9, 17, 9 + Math.cos(a) * 8, 17 + Math.sin(a) * 11, k % 2 ? lf : ld); p.line(10, 17, 10 + Math.cos(a) * 7, 17 + Math.sin(a) * 10, lf) }
  p.outline(hex(OUT))
  return spr(p, 9, 25)
})
function clockSprite(t: number) {
  const m = Math.floor(t * 2) % 60
  return memo('q:clock:' + m, () => {
    const p = new Pix(15, 15)
    p.ellipse(7.5, 7.5, 7, 7, hex('#e8dcc0')); p.ellipse(7.5, 7.5, 5.6, 5.6, hex('#fff8ec'))
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; p.px(7.5 + Math.cos(a) * 5, 7.5 + Math.sin(a) * 5, hex('#8a7a6a')) }
    const am = (m / 60) * Math.PI * 2 - Math.PI / 2, ah = ((m / 60 + 10) / 12) * Math.PI * 2 - Math.PI / 2
    p.line(7, 7, 7 + Math.cos(am) * 4.6, 7 + Math.sin(am) * 4.6, hex('#2a1a3a'))
    p.line(7, 7, 7 + Math.cos(ah) * 3, 7 + Math.sin(ah) * 3, hex('#c84a3a'))
    p.outline(hex(OUT))
    return spr(p, 7, 14)
  })
}
const ball = () => memo('q:ball', () => { const p = new Pix(9, 9); p.ellipse(4.5, 4.5, 4, 4, hex('#e84a4a')); p.rect(1, 4, 7, 1, hex('#ffffff')); p.px(3, 2, hex('#ffb0b0')); p.outline(hex(OUT)); return spr(p, 4, 8) })
function fromCanvas(cv: HTMLCanvasElement) {
  const p = new Pix(cv.width, cv.height)
  const d = cv.getContext('2d')!.getImageData(0, 0, cv.width, cv.height)
  p.d.set(new Uint32Array(d.data.buffer))
  return p
}

/* ---------- tela do computador (por cima do jogo) ---------- */
function ChatScreen() {
  const [, set] = useState(0)
  const box = useRef<HTMLDivElement>(null!)
  useEffect(() => {
    let raf = 0, last = -1
    const loop = () => { raf = requestAnimationFrame(loop); if (FX.v !== last) { last = FX.v; set((n) => n + 1) } if (box.current) box.current.style.setProperty('--vx', String(FX.vortex)) }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])
  if (!FX.open) return null
  const list = [...FX.msgs]
  if (FX.typing) list.push({ me: FX.typing.me, text: FX.typing.full.slice(0, FX.typing.n) + (FX.typing.me ? '' : '▌') })
  return (
    <div className={'chat' + (FX.glitch > 0 ? ' glitch' : '') + (FX.vortex > 0 ? ' vortex' : '')} ref={box} onPointerDown={(e) => e.stopPropagation()}>
      <div className="bar"><b>◆ Language Engine</b><span>assistente de IA</span></div>
      <div className="msgs">{list.map((m, i) => <div key={i} className={'msg' + (m.me ? ' me' : '')}>{m.text}</div>)}</div>
      <div className="input">Pergunte qualquer coisa…</div>
    </div>
  )
}
function WhiteFlash() {
  const el = useRef<HTMLDivElement>(null!)
  useEffect(() => { let raf = 0; const loop = () => { raf = requestAnimationFrame(loop); if (el.current) el.current.style.opacity = String(Math.max(FX.white, FX.flash * 0.25)) }; loop(); return () => cancelAnimationFrame(raf) }, [])
  return <div ref={el} style={{ position: 'fixed', inset: 0, background: '#fff', opacity: 0, pointerEvents: 'none', zIndex: 50 }} />
}

async function fadeWhite(c: Ctx, to: number, sec: number) {
  const from = FX.white, t0 = performance.now()
  await c.until(() => { const k = Math.min(1, (performance.now() - t0) / (sec * 1000)); FX.white = from + (to - from) * k; return k >= 1 })
}
async function typeOn(c: Ctx, me: boolean, full: string, cps = 28, stopAt?: number, from = 0) {
  FX.typing = { me, full, n: from }; FX.v++
  const end = stopAt ?? full.length
  while (FX.typing.n < end) {
    await c.wait(1 / cps)
    FX.typing.n++; FX.v++
    if (FX.typing.n % 3 === 0) SFX.play(me ? 'tick' : 'talk')
  }
}

/* ---------- roteiro ---------- */
async function main(c: Ctx) {
  resetFX()
  FX.msgs = [{ me: false, text: 'Oi, NEX! Eu sou a Language Engine, uma IA de linguagem. Pergunte o que quiser.' }]; FX.v++
  playTheme('lab')
  c.freeze(true)
  await c.cinematic([
    { pos: [2.6, 0.2], zoom: 2, h: 40, cut: true },
    { pos: [2.6, 0.2], zoom: 2, h: 40, dur: 1.4 },
    { pos: [3.6, 3.2], zoom: 1, h: 16, dur: 3.2 },
  ])
  c.freeze(false)
  FX.flash = 1; SFX.play('stone')
  emoteNex('!', 1)
  await c.say([
    { who: 'NEX', text: 'Que tempestade… Sem chance de sair hoje.' },
    { who: 'NEX', text: 'Vou conversar com a IA. Tem uma coisa que eu sempre quis perguntar.' },
  ], { ambient: true })
  c.objective('Vá até o computador', PC_USE)
  await c.waitFlag('q_pc')
  c.objective(null)
  c.freeze(true)
  // senta na cadeira
  RT.lookAt = [SCREEN.x, SCREEN.y - 1]
  const from = { x: RT.player.x, y: RT.player.y }
  await tween(c, 0.45, (k) => { RT.player.x = from.x + (SEAT[0] - from.x) * k; RT.player.y = from.y + (SEAT[1] - from.y) * k; RT.nexZ = Math.sin(k * Math.PI) * 6 })
  RT.nexZ = 0
  RT.pose = 'sit'; RT.poseT = 999
  c.focus([5.2, 0.9], 2, 26)
  await c.wait(0.9)
  FX.open = true; FX.v++; SFX.play('open')
  await c.wait(0.6)
  c.setFlag('q_ask1', 0); c.setFlag('q_ask2', 0)
  await c.say([
    { who: 'NEX', text: 'Eu converso com você todo dia… mas nunca entendi como você sabe responder.' },
    { who: 'NEX', text: 'O que eu pergunto?', choices: [{ label: 'Como você funciona?', flag: 'q_ask1' }, { label: 'Você pensa como eu?', flag: 'q_ask2' }] },
  ])
  const q = c.flag('q_ask2') ? 'Você pensa como eu?' : 'Como você funciona?'
  RT.pose = 'type'; RT.poseT = 999
  await typeOn(c, true, q, 18)
  RT.pose = 'sit'
  FX.msgs.push({ me: true, text: q }); FX.typing = null; FX.v++
  SFX.play('click')
  await c.wait(0.9)
  const ans = c.flag('q_ask2') ? 'Não exatamente. Por dentro, eu funciono prevendo a próxima palavra, uma de cada vez, usando' : 'Boa pergunta! Por dentro, eu funciono prevendo a próxima palavra, uma de cada vez, usando'
  await typeOn(c, false, ans, 30, ans.length - 8)
  // o raio
  FX.flash = 1.4; SFX.play('stone'); SFX.play('whoosh')
  FX.glitch = 1; FX.sparks = true; FX.v++
  RT.cam.shake = 1
  SFX.play('error')
  await fadeWhite(c, 0.9, 0.12)
  FX.open = false; FX.v++
  gesture('scared', 9)
  scareCat()
  // pula da cadeira com o susto
  RT.player.x = SEAT[0]; RT.player.y = SEAT[1] + 0.75
  RT.lookAt = [RT.player.x + 1, RT.player.y + 1]
  c.focus([5.3, 1.9], 2, 16)
  await c.wait(0.15)
  emoteNex('!', 1.2)
  await fadeWhite(c, 0, 0.45)
  await c.say([{ who: 'NEX', text: 'AAAI! Levei um choque!' }])
  gesture('scared', 9)
  FX.shrink = { t0: performance.now() }; SFX.play('whoosh')
  c.focus([5.3, 1.9], 2, 8)
  emoteNex('?', 1.6)
  await c.wait(1.8)
  await c.say([
    { who: 'NEX', text: 'Eu… estou encolhendo?!' },
    { who: 'ENGINE', text: 'pró… xi… ma… pa… la…' },
  ])
  gesture('scared', 6)
  RT.lookAt = [SCREEN.x, SCREEN.y - 1]
  FX.vortex = 1; FX.glitch = 0; SFX.play('portal')
  await c.cinematic([{ pos: [5.3, 0.8], zoom: 2, h: 22, dur: 1.2 }], false)
  c.focus([5.3, 0.8], 2, 22)
  FX.pull = { t0: performance.now() - 300, x: RT.player.x, y: RT.player.y }
  await c.wait(1.6)
  await c.say({ who: 'NEX', text: 'A tela está me puxando! AAAAH!' }, { ambient: true })
  await fadeWhite(c, 1, 0.8)
  c.setFlag('quarto_done')
  await c.wait(0.4)
  c.goto('prologo')
}

/* ---------- epílogo: de volta para casa ---------- */
const MODE = { fim: false }
async function epilogue(c: Ctx) {
  resetFX()
  const nome = babyName()
  const old = 'Boa pergunta! Por dentro, eu funciono prevendo a próxima palavra, uma de cada vez, usando'
  FX.msgs = [{ me: false, text: 'Oi, NEX! Eu sou a Language Engine, uma IA de linguagem. Pergunte o que quiser.' }, { me: true, text: 'Como você funciona?' }]
  FX.white = 1; FX.v++
  playTheme('lab')
  c.freeze(true)
  gesture('sit', 4)
  await fadeWhite(c, 0, 1.4)
  emoteNex('tonto', 1.6)
  await c.wait(1.2)
  await c.say([
    { who: 'NEX', text: 'Ai, minha cabeça… Eu voltei? Estou do meu tamanho de novo!' },
    { who: 'NEX', text: 'A tempestade passou. Já é de manhã!' },
  ])
  CAT.pose = 'sentado'; CAT.x = 2.4; CAT.y = 3.4; CAT.z = 0; CAT.hidden = false
  emote('♥', () => ({ x: CAT.x, y: CAT.y, z: 24 }), 1.8)
  SFX.play('chime')
  await c.say({ who: 'NEX', text: 'Oi, gatinho! Você não vai acreditar onde eu estive.' })
  c.freeze(false)
  c.objective('Vá até o computador', PC_USE)
  await c.waitFlag('q_pc2')
  c.objective(null)
  c.freeze(true)
  RT.lookAt = [SCREEN.x, SCREEN.y - 1]
  const from = { x: RT.player.x, y: RT.player.y }
  await tween(c, 0.45, (k) => { RT.player.x = from.x + (SEAT[0] - from.x) * k; RT.player.y = from.y + (SEAT[1] - from.y) * k; RT.nexZ = Math.sin(k * Math.PI) * 6 })
  RT.nexZ = 0
  RT.pose = 'sit'; RT.poseT = 999
  c.focus([5.2, 0.9], 2, 26)
  await c.wait(0.8)
  FX.open = true; FX.v++; SFX.play('open')
  await c.wait(0.8)
  const rest = ' tudo o que você viu lá dentro! Eu corto o seu texto em tokens e troco cada um por um número. Cada número vira um vetor de significado. Na atenção, eu descubro quais palavras importam. Os vetores sobem por dezenas de camadas de pesos, que eu aprendi no treino, errando e ajustando. No fim, cada palavra possível ganha uma chance, e eu escolho uma com cuidado. Uma palavra de cada vez.'
  await typeOn(c, false, old + rest, 55, undefined, old.length)
  FX.msgs.push({ me: false, text: old + rest }); FX.typing = null; FX.v++
  await c.wait(0.6)
  await c.say({ who: 'NEX', text: 'Eu sei! Eu estive lá dentro!' })
  const ty = 'Obrigada por me ajudar a lembrar, NEX. Ah, e a ' + nome + ' mandou um recado: “A capital do Brasil é Brasília!” 😄'
  await typeOn(c, false, ty, 40)
  FX.msgs.push({ me: false, text: ty }); FX.typing = null; FX.v++
  await c.say({ who: 'NEX', text: 'Ninguém vai acreditar nessa história…' })
  RT.pose = 'type'; RT.poseT = 999
  const me = 'Obrigado, Engine. Amanhã eu volto com mais perguntas!'
  await typeOn(c, true, me, 22)
  FX.msgs.push({ me: true, text: me }); FX.typing = null; FX.v++
  RT.pose = 'sit'
  await c.wait(0.8)
  const bye = 'Estarei aqui. Uma palavra de cada vez. 💙'
  await typeOn(c, false, bye, 30)
  FX.msgs.push({ me: false, text: bye }); FX.typing = null; FX.v++
  c.setFlag('fim_done')
  G().pushBanner({ kind: 'area', title: 'FIM', sub: 'Obrigado por jogar!' })
  await c.wait(2.4)
  FX.open = false; FX.v++
  RT.pose = 'idle'; RT.poseT = 0
  RT.lookAt = null
  c.unfocus(); c.freeze(false)
  G().setOverlay('credits', <Credits />)
}
function Credits() {
  const close = () => { SFX.play('click'); G().setOverlay('credits', null) }
  return (
    <div className="modal" onPointerDown={(e) => e.stopPropagation()}>
      <div className="sheet" style={{ maxWidth: 560, textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '.2em', color: 'var(--cyan)' }}>FIM</div>
        <h2 style={{ margin: '6px 0 4px' }}>LLM: The Prediction Factory</h2>
        <p style={{ color: 'var(--muted)', fontWeight: 700, marginTop: 0 }}>Uma aventura sobre como funcionam as LLMs</p>
        <div style={{ display: 'grid', gap: 8, textAlign: 'left', margin: '14px 0' }}>
          <div className="card" style={{ padding: '10px 12px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,.12)' }}><b style={{ color: 'var(--gold-2)' }}>Fase 1 · As Origens</b><br />5.500 anos de ideias: fichas, tabelas, algoritmos, chances, zero e um, o menor erro, matrizes, a próxima palavra, bits e neurônios.</div>
          <div className="card" style={{ padding: '10px 12px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,.12)' }}><b style={{ color: 'var(--gold-2)' }}>Fase 2 · Dentro da LLM</b><br />Tokens, vetores, atenção, camadas, temperatura, treino e RAG, até a resposta “Brasília”.</div>
          <div className="card" style={{ padding: '10px 12px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,.12)' }}><b style={{ color: 'var(--gold-2)' }}>Fase 3 · Crie sua LLM</b><br />Você escolheu os dados, treinou, testou, ajustou e formou a {babyName()}.</div>
        </div>
        <p style={{ fontWeight: 800 }}>Obrigado por jogar! 💙</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => { close(); useGame.setState({ menu: 'codex' }) }}>Abrir o Codex</button>
          <button className="btn" onClick={() => { close(); useGame.setState({ menu: 'map' }) }}>Mapa da jornada</button>
          <button className="btn primary" onClick={close}>Ficar no quarto</button>
        </div>
      </div>
    </div>
  )
}

const BALL = { x: 2.4, y: 2.6, z: 0 }
/* ---------- a fase ---------- */
export default function build(): Scene { return buildRoom(false) }
export function buildRoom(fim: boolean): Scene {
  MODE.fim = fim
  resetCat(); Object.assign(BALL, { x: 2.4, y: 2.6, z: 0 })
  const things: Thing[] = []
  const T = (t: Thing) => { things.push(t); return t }
  T({ x: 0, y: -0.35, w: 8, d: 0.35, sprite: wallR() })
  T({ x: -0.35, y: -0.35, w: 0.35, d: 7.7, sprite: wallL() })
  T({ x: 1.0, y: 0, w: 2.6, d: 0.02, z: 24, sprite: () => windowSprite(Math.floor(RT.time * 9), FX.flash > 0.45, MODE.fim) })
  T({ x: 6.4, y: 0, w: 1.1, d: 0.02, z: 30, sprite: poster() })
  T({ x: 0, y: 2.55, w: 0.02, d: 1.1, sprite: door() })
  T({ x: 0, y: 0.55, w: 0.6, d: 1.8, solid: true, sprite: bookshelf() })
  T({ x: 0, y: 4.05, w: 1.9, d: 2.9, solid: true, sprite: bed() })
  T({ x: 4.3, y: 0.05, w: 2.1, d: 0.9, solid: true, sprite: desk() })
  T({ x: 4.7, y: 0.14, w: 1.25, d: 0.16, z: 26, sprite: () => monitorSprite(FX.vortex > 0 ? 'vortex' : FX.glitch > 0 ? 'glitch' : 'chat', Math.floor(RT.time * 12)) })
  if (fim) T({ x: 2.4, y: 1.6, layer: 'ground', blend: 'lighter', sprite: glow(44, '#ffd8a8', 0.22) })
  T({ x: 4.85, y: 0.62, w: 0.9, d: 0.28, z: 22, sprite: keyboard() })
  T({ x: 6.1, y: 0.25, z: 22, sprite: lamp() })
  T({ x: 4.95, y: 0.98, w: 0.75, d: 0.55, solid: true, sprite: chairSeat() })
  T({ x: 4.95, y: 1.53, w: 0.75, d: 0.12, solid: true, sprite: chairBack() })
  T({ x: 3.95, y: 0.02, z: 46, sprite: () => clockSprite(RT.time) })
  // o gato
  T({ x: CAT.x, y: CAT.y, hidden: () => CAT.hidden, pos: () => ({ x: CAT.x, y: CAT.y, z: CAT.z }), sprite: () => catSprite(CAT.pose, Math.floor(RT.time * (CAT.pose === 'corre' ? 10 : 1.5)), CAT.flip), shadow: 0 })
  T({ x: 6.6, y: 0.3, w: 0.55, d: 0.16, sprite: strip() })
  T({ x: 7.45, y: 0.5, w: 0, d: 0, solid: false, sprite: plant(), shadow: 5 })
  T({ x: 2.4, y: 2.6, pos: () => BALL, sprite: ball(), shadow: 3 })
  // luzes (somadas por cima)
  T({ x: 5.4, y: 1.5, layer: 'ground', blend: 'lighter', sprite: () => glow(30, FX.vortex > 0 ? '#9a7aff' : '#3a6aff', 0.16 + FX.vortex * 0.22 + (FX.glitch > 0 ? Math.random() * 0.12 : 0)) })
  T({ x: 6.6, y: 1.0, layer: 'ground', blend: 'lighter', sprite: glow(18, '#ffb050', 0.16) })
  T({ x: 2.6, y: 1.4, layer: 'ground', blend: 'lighter', sprite: () => glow(36, '#b8c8ff', 0.04 + FX.flash * 0.3) })
  // o NEX sendo puxado para a tela
  T({
    x: 0, y: 0, layer: 'top',
    hidden: () => !FX.pull,
    pos: () => { const k = Math.min(1, (performance.now() - FX.pull!.t0) / 2400), e = k * k * (3 - 2 * k); return { x: FX.pull!.x + (SCREEN.x - FX.pull!.x) * e, y: FX.pull!.y + (SCREEN.y + 0.6 - FX.pull!.y) * e, z: Math.sin(k * Math.PI) * 14 + e * SCREEN.z } },
    scale: () => { const k = Math.min(1, (performance.now() - FX.pull!.t0) / 2400); return 0.32 * (1 - k * 0.9) },
    sprite: () => { const a = RT.time * 14; return personSprite('NEX', NEX, { x: Math.cos(a), y: Math.sin(a) }, 0, 'scared') },
  })
  const ground = (x: number, y: number) => (x >= 0 && y >= 0 && x < 8 && y < 7 ? (x >= 2 && x <= 4 && y >= 3 && y <= 5 ? { s: 'carpet', a: '#3a4a8a', b: '#2a3468', c: '#e8b65a' } : { s: 'wood', a: '#7a4e30', b: '#4a2e1c' }) : null)
  addInteract({ id: 'gato', x: 2.35, y: 5.6, r: 1.3, label: 'Fazer carinho no gato', icon: 'talk', color: '#ffc890', mz: 34, enabled: () => CAT.pose === 'dorme' && !CAT.hidden && !RT.frozen, use: () => { gesture('reach', 1.2); SFX.play('chime'); emote('♥', () => ({ x: CAT.x, y: CAT.y, z: CAT.z + 16 }), 1.8); if (!G().flags.q_gato) G().setFlag('q_gato') } })
  if (fim) addInteract({ id: 'pc', x: PC_USE[0], y: PC_USE[1], r: 1.4, label: () => (G().flags.fim_done ? 'Ver os créditos' : 'Sentar no computador'), enabled: () => (!!G().objective && !G().flags.q_pc2) || (!!G().flags.fim_done && !RT.frozen), use: () => { if (G().flags.fim_done) G().setOverlay('credits', <Credits />); else G().setFlag('q_pc2') }, mz: 48, color: '#9fe9ff' })
  else addInteract({ id: 'pc', x: PC_USE[0], y: PC_USE[1], r: 1.4, label: 'Sentar no computador', enabled: () => !G().flags.q_pc && !!G().objective, use: () => G().setFlag('q_pc'), mz: 48, color: '#9fe9ff' })
  let vig: HTMLCanvasElement | null = null
  return {
    w: 8, h: 7, ground, things,
    cliff: null,
    spawn: { pos: fim ? [3.4, 2.6] : [2.4, 1.4], dir: fim ? [1, -0.4] : [0, -1] },
    bg: (ctx, w, h) => { ctx.fillStyle = fim ? '#0c0e1c' : '#06070f'; ctx.fillRect(0, 0, w, h) },
    scripts: [fim ? epilogue : main],
    update: (dt) => {
      FX.flash = Math.max(0, FX.flash - dt * 2.2)
      if (FX.shrink) { const k = Math.min(1, (performance.now() - FX.shrink.t0) / 1600); RT.nexScale = 1 - k * 0.68 + Math.sin(k * 30) * 0.03 * (1 - k) }
      if (FX.pull) RT.nexHidden = true
      // o gato foge do raio
      if (CAT.run && RT.time > CAT.run.t0) {
        CAT.pose = 'corre'
        const pts = CAT.run.pts, k = (RT.time - CAT.run.t0) * 2.6
        const i = Math.floor(k)
        if (i >= pts.length - 1) { CAT.hidden = true; CAT.run = null }
        else { const a = pts[i], b = pts[i + 1], f = k - i; CAT.x = a[0] + (b[0] - a[0]) * f; CAT.y = a[1] + (b[1] - a[1]) * f; CAT.z = a[2] + (b[2] - a[2]) * f + (a[2] !== b[2] ? Math.sin(f * Math.PI) * 10 : 0); CAT.flip = (b[0] - a[0]) - (b[1] - a[1]) < 0 }
      }
      if (CAT.pose === 'dorme' && !CAT.hidden && Math.random() < dt * 0.25) emote('zz', { x: CAT.x, y: CAT.y, z: CAT.z + 14 }, 1.6)
      if (MODE.fim && Math.random() < dt * 2) RT.particles.push({ x: 1.4 + Math.random() * 2.2, y: 0.4 + Math.random() * 2.2, z: 6 + Math.random() * 40, vx: (Math.random() - 0.5) * 0.06, vy: 0.05, vz: 0.8, life: 3.5, max: 3.5, c: '#ffe8c0', s: 1, g: 0 })
      // poeira na luz da luminária
      if (Math.random() < dt * 1.5) RT.particles.push({ x: 6.1 + Math.random() * 0.8, y: 0.6 + Math.random() * 0.8, z: 10 + Math.random() * 30, vx: (Math.random() - 0.5) * 0.08, vy: (Math.random() - 0.5) * 0.08, vz: 1.5, life: 3, max: 3, c: '#ffe2a3', s: 1, g: 0 })
      // o redemoinho puxa a bola e papéis
      if (FX.vortex) {
        const dx = SCREEN.x - BALL.x, dy = SCREEN.y + 0.5 - BALL.y, d = Math.hypot(dx, dy)
        if (d > 0.3) { BALL.x += (dx / d) * dt * 1.1; BALL.y += (dy / d) * dt * 1.1; BALL.z = Math.min(30, BALL.z + dt * 8) }
        if (Math.random() < dt * 6) { const sx = 4.6 + Math.random() * 1.8, sy = 0.4 + Math.random() * 1.2; RT.particles.push({ x: sx, y: sy, z: 22, vx: (SCREEN.x - sx) * 1.4, vy: (SCREEN.y - sy) * 1.4, vz: 12, life: 0.7, max: 0.7, c: '#f2ead8', s: 2, g: 0 }) }
      }
      if (FX.sparks && Math.random() < 0.5) burst(6.85, 0.4, 3, 2, ['#9fe9ff', '#fff3b0', '#ffffff'], { spd: 1.2, up: 60, life: 0.5 })
      if (FX.vortex && Math.random() < 0.6) { const a = Math.random() * 6.28; RT.particles.push({ x: SCREEN.x + Math.cos(a) * 1.4, y: SCREEN.y + 0.4 + Math.sin(a) * 1.4, z: 30 + Math.random() * 20, vx: -Math.cos(a) * 1.6, vy: -Math.sin(a) * 1.6, vz: 4, life: 0.8, max: 0.8, c: Math.random() < 0.5 ? '#9fe9ff' : '#c8a8ff', s: 1, g: 0 }) }
    },
    post: (ctx, w, h) => {
      if (!vig || vig.width !== w || vig.height !== h) {
        vig = document.createElement('canvas'); vig.width = w; vig.height = h
        const g = vig.getContext('2d')!, gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75)
        gr.addColorStop(0, 'rgba(6,7,20,0)'); gr.addColorStop(1, MODE.fim ? 'rgba(20,12,6,.35)' : 'rgba(6,7,20,.7)'); g.fillStyle = gr; g.fillRect(0, 0, w, h)
      }
      ctx.drawImage(vig, 0, 0)
      if (MODE.fim) { ctx.fillStyle = 'rgba(255,196,130,0.07)'; ctx.fillRect(0, 0, w, h) }
    },
    overlay: () => null,
    onExit: () => { G().setOverlay('qchat', null); G().setOverlay('whiteflash', null); G().setOverlay('credits', null); resetFX() },
    novaZ: 9,
    init: () => { G().setOverlay('qchat', <ChatScreen />); G().setOverlay('whiteflash', <WhiteFlash />) },
  } as Scene
}
