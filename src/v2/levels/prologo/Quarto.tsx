import { useEffect, useRef, useState } from 'react'
import { Pix, hex, hash2, darker, lighter, mix } from '../../engine/pix'
import { box, boxPix, spr, memo, wallDecal, glow, cyl, OUT } from '../../art/core'
import { personSprite, NEX } from '../../art/person'
import { RT, addInteract, gesture, burst, type Scene, type Thing } from '../../engine/runtime'
import { SFX, playTheme } from '../../engine/audio'
import { G } from '../../store'
import type { Ctx } from '../../engine/script'

/* =========================================================
   ABERTURA — O QUARTO DO NEX (pixel art)
   Noite de tempestade. NEX pergunta à IA “Como você funciona?”.
   Um raio, um choque: ele encolhe e é sugado para dentro da tela.
   ========================================================= */
const PC_USE: [number, number] = [5.3, 1.35]
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

function windowSprite(frame: number, flash: boolean) {
  return memo(`q:win:${frame}:${flash}`, () => wallDecal(2.6, 38, 'x', (u, v, c, r) => {
    if (u < 0.1 || u > 0.9) return hex(((c >> 1) % 2) ? '#8a2a3a' : '#a8384a') // cortinas
    const uu = (u - 0.1) / 0.8
    if (uu < 0.03 || uu > 0.97 || v < 0.07 || v > 0.93 || Math.abs(uu - 0.5) < 0.02 || Math.abs(v - 0.52) < 0.03) return hex('#c8b898')
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
const chairSeat = () => memo('q:chair', () => box(0.7, 0.7, 12, '#2a3a6a', { top: '#3a4a8a' }))
const chairBack = () => memo('q:chairB', () => box(0.14, 0.7, 30, '#2a3a6a', { top: '#3a4a8a' }))
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
async function typeOn(c: Ctx, me: boolean, full: string, cps = 28, stopAt?: number) {
  FX.typing = { me, full, n: 0 }; FX.v++
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
  await c.say([
    { who: 'NEX', text: 'Que tempestade… Sem chance de sair hoje.' },
    { who: 'NEX', text: 'Vou conversar com a IA. Tem uma coisa que eu sempre quis perguntar.' },
  ], { ambient: true })
  c.objective('Vá até o computador', PC_USE)
  await c.waitFlag('q_pc')
  c.objective(null)
  c.freeze(true)
  RT.player.x = PC_USE[0]; RT.player.y = PC_USE[1] - 0.1
  RT.lookAt = [SCREEN.x, SCREEN.y - 1]
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
  await typeOn(c, true, q, 18)
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
  RT.lookAt = [RT.player.x + 1, RT.player.y + 1]
  c.focus([5.3, 1.3], 2, 16)
  await c.wait(0.15)
  await fadeWhite(c, 0, 0.45)
  await c.say([{ who: 'NEX', text: 'AAAI! Levei um choque!' }])
  gesture('scared', 9)
  FX.shrink = { t0: performance.now() }; SFX.play('whoosh')
  c.focus([5.3, 1.3], 2, 8)
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

/* ---------- a fase ---------- */
export default function build(): Scene {
  const things: Thing[] = []
  const T = (t: Thing) => { things.push(t); return t }
  T({ x: 0, y: -0.35, w: 8, d: 0.35, sprite: wallR() })
  T({ x: -0.35, y: -0.35, w: 0.35, d: 7.7, sprite: wallL() })
  T({ x: 1.0, y: 0, w: 2.6, d: 0.02, z: 24, sprite: () => windowSprite(Math.floor(RT.time * 9), FX.flash > 0.45) })
  T({ x: 6.4, y: 0, w: 1.1, d: 0.02, z: 30, sprite: poster() })
  T({ x: 0, y: 2.55, w: 0.02, d: 1.1, sprite: door() })
  T({ x: 0, y: 0.55, w: 0.6, d: 1.8, solid: true, sprite: bookshelf() })
  T({ x: 0, y: 4.05, w: 1.9, d: 2.9, solid: true, sprite: bed() })
  T({ x: 4.3, y: 0.05, w: 2.1, d: 0.9, solid: true, sprite: desk() })
  T({ x: 4.7, y: 0.14, w: 1.25, d: 0.16, z: 26, sprite: () => monitorSprite(FX.vortex > 0 ? 'vortex' : FX.glitch > 0 ? 'glitch' : 'chat', Math.floor(RT.time * 12)) })
  T({ x: 4.85, y: 0.62, w: 0.9, d: 0.28, z: 22, sprite: keyboard() })
  T({ x: 6.1, y: 0.25, z: 22, sprite: lamp() })
  T({ x: 6.45, y: 1.6, w: 0.7, d: 0.7, solid: true, sprite: chairSeat() })
  T({ x: 7.15, y: 1.6, w: 0.14, d: 0.7, solid: true, sprite: chairBack() })
  T({ x: 6.6, y: 0.3, w: 0.55, d: 0.16, sprite: strip() })
  T({ x: 7.45, y: 0.5, w: 0, d: 0, solid: false, sprite: plant(), shadow: 5 })
  T({ x: 2.4, y: 2.1, sprite: ball(), shadow: 3 })
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
  addInteract({ id: 'pc', x: PC_USE[0], y: PC_USE[1], r: 1.4, label: 'Sentar no computador', enabled: () => !G().flags.q_pc && !!G().objective, use: () => G().setFlag('q_pc'), mz: 48, color: '#9fe9ff' })
  let vig: HTMLCanvasElement | null = null
  return {
    w: 8, h: 7, ground, things,
    cliff: null,
    spawn: { pos: [2.6, 5.2], dir: [0.4, -1] },
    bg: (ctx, w, h) => { ctx.fillStyle = '#06070f'; ctx.fillRect(0, 0, w, h) },
    scripts: [main],
    update: (dt) => {
      FX.flash = Math.max(0, FX.flash - dt * 2.2)
      if (FX.shrink) { const k = Math.min(1, (performance.now() - FX.shrink.t0) / 1600); RT.nexScale = 1 - k * 0.68 + Math.sin(k * 30) * 0.03 * (1 - k) }
      if (FX.pull) RT.nexHidden = true
      if (FX.sparks && Math.random() < 0.5) burst(6.85, 0.4, 3, 2, ['#9fe9ff', '#fff3b0', '#ffffff'], { spd: 1.2, up: 60, life: 0.5 })
      if (FX.vortex && Math.random() < 0.6) { const a = Math.random() * 6.28; RT.particles.push({ x: SCREEN.x + Math.cos(a) * 1.4, y: SCREEN.y + 0.4 + Math.sin(a) * 1.4, z: 30 + Math.random() * 20, vx: -Math.cos(a) * 1.6, vy: -Math.sin(a) * 1.6, vz: 4, life: 0.8, max: 0.8, c: Math.random() < 0.5 ? '#9fe9ff' : '#c8a8ff', s: 1, g: 0 }) }
    },
    post: (ctx, w, h) => {
      if (!vig || vig.width !== w || vig.height !== h) {
        vig = document.createElement('canvas'); vig.width = w; vig.height = h
        const g = vig.getContext('2d')!, gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75)
        gr.addColorStop(0, 'rgba(6,7,20,0)'); gr.addColorStop(1, 'rgba(6,7,20,.7)'); g.fillStyle = gr; g.fillRect(0, 0, w, h)
      }
      ctx.drawImage(vig, 0, 0)
    },
    overlay: () => null,
    onExit: () => { G().setOverlay('qchat', null); G().setOverlay('whiteflash', null); resetFX() },
    novaZ: 9,
    init: () => { G().setOverlay('qchat', <ChatScreen />); G().setOverlay('whiteflash', <WhiteFlash />) },
  } as Scene
}
