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
  style: 'spiky' | 'short' | 'long' | 'bald' | 'curly'
  top: string; inner?: string // casaco e camisa por dentro
  legs: string; shoes: string
  robe?: boolean; dress?: boolean
  acc?: 'beard' | 'longbeard' | 'turban' | 'hat' | 'cap' | 'sideburns' | 'glasses' | 'straw' | 'wig' | 'bun' | 'none'
  accColor?: string
  bag?: string // mochila (NEX)
  belt?: string
}

export const W = 22, H = 32, AX = 11, AY = 31

export const NEX: Look = { skin: '#f0c49c', hair: '#3a2314', style: 'spiky', top: '#1f3366', inner: '#e9e2d0', legs: '#b49c72', shoes: '#4a3324', bag: '#7b4a2a' }

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
export function personPix(L: Look, view: View, frame = 0, pose: Pose = 'idle'): Pix {
  const p = new Pix(W, H)
  const C = (c: string) => hex(c)
  const skin = C(L.skin), skinD = C(darker(L.skin, 0.18)), hair = C(L.hair), hairD = C(darker(L.hair, 0.3)), hairL = C(lighter(L.hair, 0.25))
  const top = C(L.top), topD = C(darker(L.top, 0.25)), topL = C(lighter(L.top, 0.15))
  const legs = C(L.legs), legsD = C(darker(L.legs, 0.25)), shoes = C(L.shoes)
  const walking = pose === 'walk'
  const bob = walking && frame % 2 === 1 ? -1 : 0
  const armsUp = pose === 'cheer' || pose === 'scared'
  const by = bob // deslocamento do corpo
  // ---- pernas e sapatos ----
  const liftL = walking && frame === 1 ? 1 : 0, liftR = walking && frame === 3 ? 1 : 0
  if (L.robe || L.dress) {
    // pés aparecem por baixo da roupa
    p.rect(8, 29 - liftL, 3, 2, shoes); p.rect(12, 29 - liftR, 3, 2, shoes)
  } else {
    p.rect(8, 24 + by, 2, 5 - liftL, legs); p.rect(12, 24 + by, 2, 5 - liftR, legsD)
    p.rect(7, 29 - liftL, 3, 2, shoes); p.rect(12, 29 - liftR, 3, 2, shoes)
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
    if (view === 'b') { p.rect(8, 17 + by, 6, 6, C(L.bag)); p.rect(8, 17 + by, 6, 1, C(lighter(L.bag, 0.2))); p.rect(9, 20 + by, 4, 2, C(darker(L.bag, 0.25))) }
    else { p.rect(8, 17 + by, 1, 4, C(L.bag)); p.rect(13, 17 + by, 1, 4, C(L.bag)) }
  }
  // ---- braços ----
  const swing = walking ? (frame === 1 ? 1 : frame === 3 ? -1 : 0) : 0
  if (armsUp) {
    p.rect(4, 11 + by, 2, 7, top); p.rect(16, 11 + by, 2, 7, topD)
    p.rect(4, 9 + by, 2, 2, skin); p.rect(16, 9 + by, 2, 2, skinD)
  } else if (pose === 'think') {
    p.rect(5, 18 + by, 2, 5, top); p.rect(5, 23 + by, 2, 1, skin)
    p.rect(14, 16 + by, 3, 2, topD); p.rect(13, 14 + by, 2, 2, skin)
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
export function personSprite(id: string, L: Look, dir: { x: number; y: number }, frame: number, pose: Pose, holo?: string): Sprite {
  const sx = dir.x - dir.y, sy = dir.x + dir.y
  const view: View = sy >= -0.05 ? 'f' : 'b'
  const flip = view === 'f' ? sx < 0 : sx > 0
  const fr = pose === 'walk' ? frame % 4 : 0
  const key = `pp:${id}:${view}:${flip ? 1 : 0}:${fr}:${pose}:${holo || ''}`
  return memo(key, () => {
    let p = personPix(L, view, fr, pose)
    if (holo) p = holoTint(p, holo)
    if (flip) { const q = new Pix(p.w, p.h); q.blit(p, 0, 0, true); p = q }
    return spr(p, flip ? W - 1 - AX : AX, AY)
  })
}

/* ---------- NOVA ---------- */
export function novaPix(blink: boolean, talk: boolean): Pix {
    const p = new Pix(18, 18)
    p.ellipse(9, 9, 7, 7, hex('#eef1f6'))
    p.ellipse(7.5, 6.5, 3, 2.5, hex('#ffffff'))
    for (let y = 0; y < 18; y++) for (let x = 0; x < 18; x++) { const dx = x + 0.5 - 9, dy = y + 0.5 - 9; if (dx * dx + dy * dy < 49 && dx + dy > 6) p.px(x, y, hex('#b8c0d0')) }
    p.ellipse(9, 9.5, 6, 3, hex('#0c1220'))
    const eye = hex('#59d7ff')
    if (blink) { p.rect(5, 10, 3, 1, eye); p.rect(11, 10, 3, 1, eye) }
    else { p.rect(5, 8, 3, 3, eye); p.rect(11, 8, 3, 3, eye); p.px(5, 8, hex('#e8fbff')); p.px(11, 8, hex('#e8fbff')) }
    if (talk) p.rect(8, 11, 3, 1, hex('#9ff0ff'))
    p.rect(0, 8, 2, 3, hex('#3fb8ff')); p.rect(16, 8, 2, 3, hex('#3fb8ff'))
    p.outline(hex(OUT))
    return p
}
export function novaSprite(blink: boolean, talk: boolean): Sprite {
  return memo(`nova:${blink ? 1 : 0}:${talk ? 1 : 0}`, () => spr(novaPix(blink, talk), 9, 17))
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
  else if (id === 'NOVA') { p.ellipse(12, 12, 10, 10, hex('#1a2a48')); p.blit(novaPix(false, false), 3, 3) }
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
