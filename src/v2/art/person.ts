import { Pix, hex, darker, lighter, mix, rgbOf } from '../engine/pix'
import { OUT, memo, spr } from './core'
import type { Sprite, Pose } from '../engine/runtime'

/* =========================================================
   Personagens em pixel art (gerados por código): NEX, NOVA,
   os inventores e o comerciante. Visto de frente (3/4) ou de
   costas; espelhando, dá as 4 direções da vista isométrica.
   ========================================================= */
export interface Look {
  skin: string; hair: string
  style: 'spiky' | 'short' | 'long' | 'bald' | 'curly' | 'messy'
  top: string; inner?: string // casaco e camisa por dentro
  legs: string; shoes: string
  robe?: boolean; dress?: boolean
  acc?: 'beard' | 'shortbeard' | 'longbeard' | 'turban' | 'hat' | 'cap' | 'sideburns' | 'glasses' | 'straw' | 'wig' | 'bun' | 'none'
  accColor?: string
  bag?: string // mochila (NEX)
  roll?: string // saco de dormir enrolado em cima da mochila
  belt?: string
}

export const W = 22, H = 32, AX = 11, AY = 31

export const NEX: Look = { skin: '#e8b088', hair: '#4a2a1a', style: 'messy', acc: 'shortbeard', top: '#2c4f9e', inner: '#ece6da', legs: '#2c2c38', shoes: '#7a4a2a', bag: '#8a5a34', roll: '#c8a070' }

/** Visual de cada pessoa da Fase 1. */
export const LOOKS: Record<string, Look> = {
  NEX,
  ESCRIBA: { skin: '#c98f5e', hair: '#2a1a10', style: 'short', top: '#e8dcc0', inner: '#c8a060', legs: '#e8dcc0', shoes: '#7a5a3a', robe: true, acc: 'longbeard', belt: '#b0602a' },
  LIUHUI: { skin: '#eec7a0', hair: '#1a1410', style: 'short', top: '#b8303a', inner: '#f0d890', legs: '#b8303a', shoes: '#2a2a30', robe: true, acc: 'hat', accColor: '#1c1c22', belt: '#f0d890' },
  KHWARIZMI: { skin: '#c8915e', hair: '#2a1a10', style: 'short', top: '#2f8f8a', inner: '#f2efe6', legs: '#2f8f8a', shoes: '#7a5a3a', robe: true, acc: 'turban', accColor: '#f2efe6', belt: '#e8b65a' },
  PASCAL: { skin: '#f0c9a0', hair: '#5a3a24', style: 'long', top: '#2a2a3a', inner: '#f2efe6', legs: '#2a2a3a', shoes: '#1a1a22', acc: 'wig' },
  LEIBNIZ: { skin: '#f0c9a0', hair: '#3a2a1c', style: 'curly', top: '#6a3a8a', inner: '#f2efe6', legs: '#3a2a4a', shoes: '#1a1a22', acc: 'wig' },
  GAUSS: { skin: '#f0c9a0', hair: '#d8d4cc', style: 'short', top: '#2a3a5a', inner: '#f2efe6', legs: '#2a2a3a', shoes: '#1a1a22', acc: 'cap', accColor: '#1c1c22' },
  ADA: { skin: '#f6d2b0', hair: '#3a2214', style: 'long', top: '#7a3a6a', inner: '#f2d8e8', legs: '#7a3a6a', shoes: '#2a1a22', dress: true, acc: 'bun' },
  CAYLEY: { skin: '#f0c9a0', hair: '#5a4030', style: 'short', top: '#3a3a44', inner: '#f2efe6', legs: '#3a3a44', shoes: '#1a1a22', acc: 'sideburns' },
  MARKOV: { skin: '#f0c9a0', hair: '#9a948a', style: 'short', top: '#2a3a2e', inner: '#f2efe6', legs: '#2a2a2e', shoes: '#1a1a22', acc: 'beard' },
  SHANNON: { skin: '#f0c9a0', hair: '#6a4a30', style: 'short', top: '#5a6a8a', inner: '#f2efe6', legs: '#3a3a4a', shoes: '#2a1a12', acc: 'none' },
  ROSENBLATT: { skin: '#f0c9a0', hair: '#2a1e16', style: 'short', top: '#e9e2d0', inner: '#4a6a9a', legs: '#3a3a4a', shoes: '#2a1a12', acc: 'glasses' },
  COMERCIANTE: { skin: '#e8bf92', hair: '#1a1410', style: 'short', top: '#4a6a8a', inner: '#d8c8a0', legs: '#3a4a5a', shoes: '#3a2a1a', acc: 'straw', accColor: '#d8b45a', belt: '#8a5a34' },
}

type View = 'f' | 'b'

/** Desenha um personagem. frame: 0..3 (andando) · pose: gesto. */
export function personPix(L: Look, view: View, frame = 0, pose: Pose = 'idle', blink = false): Pix {
  const p = new Pix(W, H)
  const C = (c: string) => hex(c)
  const skin = C(L.skin), skinD = C(darker(L.skin, 0.18)), hair = C(L.hair), hairD = C(darker(L.hair, 0.3)), hairL = C(lighter(L.hair, 0.25))
  const top = C(L.top), topD = C(darker(L.top, 0.25)), topL = C(lighter(L.top, 0.15))
  const legs = C(L.legs), legsD = C(darker(L.legs, 0.25)), shoes = C(L.shoes)
  const walking = pose === 'walk' || pose === 'run' || pose === 'carry'
  const run = pose === 'run'
  const sit = pose === 'sit' || pose === 'type'
  const bob = (walking && frame % 2 === 1 ? -1 : 0) + (pose === 'idle' && frame % 2 === 1 ? 1 : 0)
  const armsUp = pose === 'scared' || pose === 'carry' || (pose === 'cheer' && frame % 2 === 0)
  const armsHalf = pose === 'cheer' && frame % 2 === 1
  const by = bob + (sit ? 4 : 0) // deslocamento do corpo
  // ---- saco de dormir aparecendo atrás dos ombros (de frente) ----
  if (L.roll && view === 'f') { const r = C(L.roll), rd = C(darker(L.roll, 0.3)); p.ellipse(4.5, 16 + by, 2, 2.4, r); p.ellipse(17.5, 16 + by, 2, 2.4, r); p.px(4, 16 + by, rd); p.px(17, 16 + by, rd) }
  // ---- pernas e sapatos ----
  const liftL = walking && frame === 1 ? (run ? 2 : 1) : 0, liftR = walking && frame === 3 ? (run ? 2 : 1) : 0
  const spread = run ? (frame === 1 ? -1 : frame === 3 ? 1 : 0) : 0
  if (sit) {
    if (view === 'f') { p.rect(7, 25, 8, 2, legs); p.rect(7, 25, 8, 1, C(lighter(L.legs, 0.12))); p.rect(8, 27, 2, 2, legs); p.rect(12, 27, 2, 2, legsD) }
    else { p.rect(8, 27, 2, 2, legsD); p.rect(12, 27, 2, 2, legsD) }
    p.rect(7, 29, 3, 2, shoes); p.rect(12, 29, 3, 2, shoes)
  } else if (L.robe || L.dress) {
    // pés aparecem por baixo da roupa
    p.rect(8 + spread, 29 - liftL, 3, 2, shoes); p.rect(12 - spread, 29 - liftR, 3, 2, shoes)
  } else {
    p.rect(8 + spread, 24 + by, 2, 5 - liftL - by, legs); p.rect(12 - spread, 24 + by, 2, 5 - liftR - by, legsD)
    p.rect(7 + spread, 29 - liftL, 3, 2, shoes); p.rect(12 - spread, 29 - liftR, 3, 2, shoes)
  }
  // ---- corpo ----
  if (L.dress) {
    p.poly([[7, 20 + by], [15, 20 + by], [18, 29.5], [4, 29.5]], top)
    p.poly([[13, 20 + by], [15, 20 + by], [18, 29.5], [15, 29.5]], topD)
    p.rect(5, 28, 12, 1, C(lighter(L.top, 0.3)))
  }
  const bodyBottom = L.robe ? 29 : 24
  p.rect(7, 17 + by, 8, bodyBottom - 17 - (L.robe ? 0 : by), top)
  if (L.robe) { p.poly([[7, 22], [15, 22], [16, 29], [6, 29]], top); p.rect(14, 18 + by, 1, 11, topD); p.rect(6, 25, 1, 4, topL) }
  p.rect(14, 17 + by, 1, bodyBottom - 17, topD)
  p.rect(7, 17 + by, 1, 3, topL)
  if (view === 'f' && L.inner) { p.rect(10, 17 + by, 2, L.robe ? 5 : 5, C(L.inner)); if (!L.robe) p.rect(10, 17 + by, 2, 1, C(darker(L.inner, 0.2))) }
  if (L.belt) p.rect(7, 22 + by, 8, 1, C(L.belt))
  if (!L.robe && !L.dress) p.rect(7, 23 + by, 8, 1, legsD)
  // mochila (de costas aparece inteira; de frente, só as alças)
  if (L.bag) {
    const b = C(L.bag), bl = C(lighter(L.bag, 0.18)), bd = C(darker(L.bag, 0.28))
    if (view === 'b') {
      p.rect(6, 17 + by, 10, 9, b); p.rect(6, 17 + by, 10, 1, bl); p.rect(15, 17 + by, 1, 9, bd)
      p.rect(7, 18 + by, 8, 3, bl); p.rect(10, 21 + by, 2, 1, C('#e8c060')); p.rect(7, 23 + by, 3, 2, bd); p.rect(12, 23 + by, 3, 2, bd)
      if (L.roll) { const r = C(L.roll), rd = C(darker(L.roll, 0.3)); p.ellipse(11, 15.5 + by, 7, 2.2, r); p.rect(5, 15 + by, 12, 1, C(lighter(L.roll, 0.2))); p.px(4, 15 + by, rd); p.px(17, 16 + by, rd); p.rect(8, 14 + by, 1, 4, bd); p.rect(13, 14 + by, 1, 4, bd) }
    } else { p.rect(8, 17 + by, 1, 5, bd); p.rect(13, 17 + by, 1, 5, bd) }
  }
  // ---- braços ----
  const swing = walking && !armsUp ? (frame === 1 ? (run ? 2 : 1) : frame === 3 ? (run ? -2 : -1) : 0) : 0
  if (armsUp) {
    p.rect(4, 11 + by, 2, 7, top); p.rect(16, 11 + by, 2, 7, topD)
    p.rect(4, 9 + by, 2, 2, skin); p.rect(16, 9 + by, 2, 2, skinD)
  } else if (armsHalf) {
    p.rect(4, 14 + by, 2, 5, top); p.rect(16, 14 + by, 2, 5, topD)
    p.rect(4, 12 + by, 2, 2, skin); p.rect(16, 12 + by, 2, 2, skinD)
  } else if (pose === 'think') {
    p.rect(5, 18 + by, 2, 5, top); p.rect(5, 23 + by, 2, 1, skin)
    p.rect(14, 16 + by, 3, 2, topD); p.rect(13, 14 + by, 2, 2, skin)
  } else if (pose === 'type') {
    const k = frame % 2
    if (view === 'f') { p.rect(5, 18 + by, 2, 3, top); p.rect(15, 18 + by, 2, 3, topD); p.rect(6, 21 + by - k, 2, 1, skin); p.rect(14, 20 + by + k, 2, 1, skinD) }
    else { p.rect(5, 18 + by, 2, 3, top); p.rect(15, 18 + by, 2, 3, topD) }
  } else if (pose === 'reach') {
    p.rect(5, 18 + by, 2, 5, top); p.rect(5, 23 + by, 2, 1, skin)
    p.rect(15, 18 + by, 4, 2, topD); p.rect(19, 18 + by, 2, 2, skinD)
  } else if (pose === 'wave') {
    p.rect(5, 18 + by, 2, 5, top); p.rect(5, 23 + by, 2, 1, skin)
    const hx = frame % 2 ? 18 : 16
    p.rect(16, 12 + by, 2, 6, topD); p.rect(hx, 10 + by, 2, 2, skinD)
  } else {
    p.rect(5, 18 + by + swing, 2, 5, top); p.rect(15, 18 + by - swing, 2, 5, topD)
    p.rect(5, 23 + by + swing, 2, 1, skin); p.rect(15, 23 + by - swing, 2, 1, skinD)
  }
  // ---- pescoço e cabeça ----
  p.rect(10, 15 + by, 2, 2, skinD)
  const hy = 10 + by
  p.ellipse(11, hy, 6.2, 5.6, skin)
  // cabelo atrás (compridos)
  if (L.acc === 'wig' || L.style === 'long' || L.style === 'curly') {
    const col = L.acc === 'wig' && L.style === 'curly' ? hair : hair
    for (const s of [-1, 1]) { p.ellipse(11 + s * 5.4, hy + 4, 2.4, 4, col); p.ellipse(11 + s * 5, hy + 7.5, 2, 2.2, col) }
  }
  if (view === 'b') {
    // costas: cabeça coberta de cabelo
    if (L.style !== 'bald') { p.ellipse(11, hy, 6.2, 5.6, hair); p.rect(7, hy + 2, 8, 1, hairD); p.px(9, hy - 3, hairL); p.px(10, hy - 4, hairL) }
  } else {
    // franja / topo
    if (L.style !== 'bald') {
      for (let y = Math.floor(hy - 6); y <= hy - 1; y++) for (let x = 4; x <= 18; x++) {
        const dx = (x + 0.5 - 11) / 6.2, dy = (y + 0.5 - hy) / 5.6
        if (dx * dx + dy * dy > 1) continue
        const edge = y <= hy - 3 || x <= 5 || x >= 17 || (y === hy - 2 && (x + (L.style === 'spiky' ? 0 : 1)) % 3 !== 0)
        if (edge) p.px(x, y, hair)
      }
      p.px(8, hy - 4, hairL); p.px(9, hy - 5, hairL)
    }
    // olhos (3/4 olhando para a direita)
    const scared = pose === 'scared'
    const ey = hy + 1
    for (const ex of [8, 13]) {
      if (blink && !scared) { p.rect(ex, ey + 1, 2, 1, hex('#20140c')); continue }
      p.rect(ex, ey - (scared ? 1 : 0), 2, scared ? 3 : 2, hex('#20140c'))
      p.px(ex, ey - (scared ? 1 : 0), hex('#ffffff'))
    }
    // boca
    if (scared) { p.rect(11, hy + 3, 2, 2, hex('#6a2020')) }
    else if (pose === 'cheer') { p.rect(10, hy + 3, 3, 1, hex('#8a3b2e')); p.px(11, hy + 4, hex('#8a3b2e')) }
    else p.rect(11, hy + 4, 2, 1, hex('#8a3b2e'))
    // bochechas
    p.px(7, hy + 3, hex(mix(L.skin, '#ff7a7a', 0.45))); p.px(15, hy + 3, hex(mix(L.skin, '#ff7a7a', 0.45)))
  }
  // cabelo bagunçado (NEX): tufos em cima e nos lados
  if (L.style === 'messy') {
    p.ellipse(11, hy - 3.6, 7.2, 3.8, hair)
    for (const [x, y, rx, ry] of [[6, hy - 5, 2.2, 2], [10, hy - 7, 2.6, 2], [14.5, hy - 6, 2.4, 2.2], [17, hy - 2.5, 1.6, 2.2], [5, hy - 1.5, 1.6, 2.2]] as number[][]) p.ellipse(x, y, rx, ry, hair)
    if (view === 'f') {
      // mechas caindo na testa e sobre as orelhas
      for (const [x, y] of [[7, hy], [9, hy], [13, hy], [15, hy], [16, hy]] as number[][]) p.px(x, y, hair)
      p.rect(4, hy - 1, 2, 3, hair); p.rect(17, hy - 1, 1, 2, hair)
    } else { p.ellipse(11, hy + 1, 6.6, 5.2, hair); for (const x of [6, 9, 12, 15]) p.px(x, hy + 6, hair) }
    p.px(8, hy - 6, hairL); p.px(9, hy - 7, hairL); p.px(13, hy - 6, hairL); p.px(7, hy - 4, hairL); p.px(14, hy - 4, hairD); p.px(11, hy - 4, hairD)
  }
  // espetos do NEX
  if (L.style === 'spiky') {
    p.poly([[6, hy - 3], [7.5, hy - 8], [10, hy - 4]], hair)
    p.poly([[9, hy - 4], [11.5, hy - 9], [13.5, hy - 4]], hair)
    p.poly([[13, hy - 4], [16, hy - 7.5], [16.5, hy - 2]], hair)
    p.px(11, hy - 7, hairL)
  }
  // ---- acessórios ----
  const A = L.accColor || '#1c1c22'
  switch (L.acc) {
    case 'shortbeard': if (view === 'f') {
      const bd = hair, bdl = hairL
      const rows: [number, number, number][] = [[2, 5, 5], [2, 17, 17], [3, 5, 6], [3, 16, 17], [4, 5, 17], [5, 6, 16], [6, 8, 14]]
      for (const [dy, x0, x1] of rows) for (let x = x0; x <= x1; x++) p.px(x, hy + dy, bd)
      p.rect(10, hy + 3, 3, 1, bd) // bigode
      const open = pose === 'scared' || pose === 'cheer'
      p.rect(10, hy + 4, 3, open ? 2 : 1, hex(open ? '#5a1a1a' : '#7a3a2a'))
      if (pose === 'cheer') p.rect(10, hy + 4, 3, 1, hex('#f2ead8'))
      p.px(7, hy + 4, bdl); p.px(14, hy + 5, bdl)
    } break
    case 'beard': if (view === 'f') { p.poly([[6, hy + 1], [16.5, hy + 1], [15, hy + 6], [11, hy + 7], [7, hy + 6]], hair); p.rect(10, hy + 3, 3, 1, hex(mix(L.skin, L.hair, 0.3))) } break
    case 'longbeard': if (view === 'f') { p.poly([[6, hy + 1], [16.5, hy + 1], [15, hy + 8], [11, hy + 10], [7, hy + 8]], hair); p.rect(10, hy + 3, 3, 1, hex('#5a2a1a')); for (let y = hy + 5; y < hy + 9; y += 2) p.px(11, y, hairD) } break
    case 'turban': p.ellipse(11, hy - 4, 7, 4, C(A)); p.rect(4, hy - 3, 14, 1, hex('#3fb6b0')); p.px(11, hy - 5, hex('#e8b65a')); p.px(9, hy - 6, hex('#ffffff')) ; break
    case 'hat': p.rect(7, hy - 9, 8, 6, C(A)); p.rect(5, hy - 4, 12, 1, C(A)); p.rect(1, hy - 5, 5, 1, C(A)); p.rect(16, hy - 5, 5, 1, C(A)); p.px(9, hy - 8, hex('#3a3a46')); break
    case 'cap': p.ellipse(11, hy - 4, 5.5, 3, C(A)); p.px(9, hy - 6, hex('#3a3a46')); break
    case 'sideburns': if (view === 'f') { p.rect(5, hy - 1, 1, 5, hair); p.rect(16, hy - 1, 1, 5, hair) } break
    case 'glasses': if (view === 'f') { const g = hex('#1a1a1a'); for (const ex of [7, 12]) { p.rect(ex, hy, 4, 1, g); p.rect(ex, hy + 3, 4, 1, g); p.px(ex, hy + 1, g); p.px(ex, hy + 2, g); p.px(ex + 3, hy + 1, g); p.px(ex + 3, hy + 2, g) } p.px(11, hy + 1, g) } break
    case 'straw': p.poly([[0, hy - 2], [11, hy - 10], [22, hy - 2]], C(A)); p.rect(1, hy - 2, 20, 1, C(darker(A, 0.35))); p.line(6, hy - 4, 11, hy - 8, C(darker(A, 0.25))); p.line(16, hy - 4, 11, hy - 8, C(darker(A, 0.25))); break
    case 'wig': if (L.style === 'curly') for (const s of [-1, 1]) for (let k = 0; k < 3; k++) p.ellipse(11 + s * 6, hy - 1 + k * 3, 1.6, 1.6, k % 2 ? hairD : hair); break
    case 'bun': p.ellipse(11, hy - 6, 3, 2.4, hair); p.px(10, hy - 7, hairL); if (view === 'f') { p.rect(4, hy + 1, 1, 5, hair); p.rect(17, hy + 1, 1, 5, hair) } break
  }
  p.outline(hex(OUT))
  return p
}

/** Cor de holograma (eco de memória): cores da pessoa puxadas para a cor do eco, linhas de varredura e contorno claro. */
export function holoTint(src: Pix, color: string): Pix {
  const out = new Pix(src.w, src.h)
  const [cr, cg, cb] = rgbOf(hex(color))
  const outC = rgbOf(hex(OUT))
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const c = src.get(x, y); if (!(c >>> 24)) continue
    const [r, g, b] = rgbOf(c)
    let R: number, G: number, B: number
    if (r === outC[0] && g === outC[1] && b === outC[2]) { R = Math.min(255, cr + 70); G = Math.min(255, cg + 70); B = Math.min(255, cb + 70) }
    else { const k = 0.42; R = r + (cr - r) * k + 26; G = g + (cg - g) * k + 26; B = b + (cb - b) * k + 34 }
    const a = y % 3 === 1 ? 175 : 235
    out.d[y * src.w + x] = ((a << 24) | (Math.min(255, Math.round(B)) << 16) | (Math.min(255, Math.round(G)) << 8) | Math.min(255, Math.round(R))) >>> 0
  }
  return out
}

/** Sprite de uma pessoa olhando na direção (dx, dy) do mundo. */
export function personSprite(id: string, L: Look, dir: { x: number; y: number }, frame: number, pose: Pose, holo?: string, blink = false): Sprite {
  const sx = dir.x - dir.y, sy = dir.x + dir.y
  const view: View = sy >= -0.05 ? 'f' : 'b'
  const flip = view === 'f' ? sx < 0 : sx > 0
  const animated = pose === 'walk' || pose === 'run' || pose === 'carry'
  const fr = animated ? frame % 4 : (pose === 'idle' || pose === 'cheer' || pose === 'type' || pose === 'wave') ? frame % 2 : 0
  const bl = blink && view === 'f'
  const key = `pp:${id}:${view}:${flip ? 1 : 0}:${fr}:${pose}:${holo || ''}:${bl ? 1 : 0}`
  return memo(key, () => {
    let p = personPix(L, view, fr, pose, bl)
    if (holo) p = holoTint(p, holo)
    if (flip) { const q = new Pix(p.w, p.h); q.blit(p, 0, 0, true); p = q }
    return spr(p, flip ? W - 1 - AX : AX, AY)
  })
}

/* ---------- NOVA ---------- */
/** NOVA: robozinho guia (cabeça grande com visor, antena, “orelhas” azuis, ∞ no peito e propulsor). */
export function novaPix(blink: boolean, talk: boolean, flame = 0, off = false): Pix {
  const p = new Pix(22, 30)
  const shell = hex('#ece4d4'), shellD = hex('#c8bca8'), shellL = hex('#fffaf0'), seam = hex('#a89c88')
  const blue = hex('#3fb8ff'), blueL = hex('#bff3ff'), blueD = hex('#1a5aa8'), visor = hex('#0c1a3a')
  // propulsor
  if (!off) { const f = flame % 3; p.poly([[8, 24], [14, 24], [11, 29 - (f === 1 ? 1 : 0)]], blue); p.poly([[9.5, 24], [12.5, 24], [11, 27 - f % 2]], blueL) }
  // corpo
  p.ellipse(11, 21, 5, 4, shell); p.rect(7, 21, 9, 2, shellD); p.px(8, 19, shellL)
  // ∞ no peito
  p.px(9, 21, blue); p.px(10, 20, blue); p.px(10, 22, blue); p.px(11, 21, blue); p.px(12, 20, blue); p.px(12, 22, blue); p.px(13, 21, blue)
  // bracinhos
  p.ellipse(5.5, 21, 1.6, 2.2, shellD); p.ellipse(16.5, 21, 1.6, 2.2, shellD)
  // antena
  p.rect(10, 1, 2, 4, seam); p.rect(10, 0, 2, 2, off ? blueD : blue); p.px(10, 0, off ? blue : blueL)
  // cabeça
  p.ellipse(11, 10.5, 8.6, 7.2, shell)
  for (let y = 3; y < 18; y++) for (let x = 2; x < 20; x++) { const dx = (x + 0.5 - 11) / 8.6, dy = (y + 0.5 - 10.5) / 7.2; if (dx * dx + dy * dy <= 1 && dx * 0.6 + dy > 0.62) p.px(x, y, shellD) }
  p.px(6, 5, shellL); p.px(7, 4, shellL); p.px(8, 4, shellL)
  // orelhas (fones)
  for (const ex of [2, 20]) { p.ellipse(ex, 11, 2.2, 3, blueD); p.ellipse(ex, 11, 1.2, 1.8, off ? blueD : blue) }
  // visor e olhos
  p.poly([[5, 8], [17, 8], [18, 11], [17, 14.5], [5, 14.5], [4, 11]], visor)
  const eye = off ? blueD : blue
  if (blink || off) { p.rect(6, 11, 3, 1, eye); p.rect(13, 11, 3, 1, eye) }
  else { p.rect(6, 10, 3, 3, eye); p.rect(13, 10, 3, 3, eye); p.px(6, 10, blueL); p.px(13, 10, blueL) }
  if (talk) p.rect(10, 13, 2, 1, blueL)
  p.outline(hex(OUT))
  return p
}
export function novaSprite(blink: boolean, talk: boolean, flame = 0, off = false): Sprite {
  return memo(`nova:${blink ? 1 : 0}:${talk ? 1 : 0}:${flame % 3}:${off ? 1 : 0}`, () => spr(novaPix(blink, talk, flame, off), 11, off ? 24 : 27))
}

/* ---------- retrato (para o diálogo) ---------- */
const urls = new Map<string, string>()
/** Retrato em pixel art (cabeça e ombros), como imagem para a interface. */
export function portraitURL(id: string, bg = '#101a30', ring?: string): string {
  const k = `${id}:${bg}:${ring || ''}`
  if (urls.has(k)) return urls.get(k)!
  const L = LOOKS[id]
  const p = new Pix(24, 24)
  p.rect(0, 0, 24, 24, hex(bg))
  if (ring) p.ellipse(12, 13, 11, 11, hex(mix(ring, bg, 0.7)))
  if (L) { const body = personPix(L, 'f', 0, 'idle'); p.blit(body, 1, 2) }
  else if (id === 'NOVA') { p.ellipse(12, 12, 10, 10, hex('#1a2a48')); p.blit(novaPix(false, false), 1, 2) }
  const cv = p.canvas()
  const url = cv.toDataURL()
  urls.set(k, url)
  return url
}

/* ---------- bichos ---------- */
export function sheepSprite(flip: boolean, frame: number): Sprite {
  return memo(`sheep:${flip ? 1 : 0}:${frame}`, () => {
    const p = new Pix(16, 13)
    const wool = hex('#f2eee4'), woolD = hex('#cfc8b8'), dark = hex('#2a2422')
    p.rect(3 + (frame ? 1 : 0), 9, 1, 3, dark); p.rect(6, 9, 1, 3, dark); p.rect(9 + (frame ? -1 : 0), 9, 1, 3, dark); p.rect(11, 9, 1, 3, dark)
    p.ellipse(7.5, 6.5, 6, 4, wool)
    p.ellipse(4.5, 4.5, 2.4, 2, wool); p.ellipse(8, 3.6, 2.6, 2, wool); p.ellipse(11, 4.6, 2.2, 2, wool)
    p.rect(3, 9, 9, 1, woolD)
    p.ellipse(13.2, 6, 2.2, 2.4, dark); p.px(14, 5, hex('#ffffff'))
    p.outline(hex(OUT))
    if (flip) { const q = new Pix(p.w, p.h); q.blit(p, 0, 0, true); return spr(q, 8, 12) }
    return spr(p, 8, 12)
  })
}
