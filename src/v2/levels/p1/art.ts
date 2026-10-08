import { Pix, hex, hash2, darker, lighter, mix, textPix, rgbOf } from '../../engine/pix'
import { box, boxPix, cyl, cylPix, memo, spr, signPix, label, OUT } from '../../art/core'
import type { Sprite } from '../../engine/runtime'
import { GRAIN, type GK } from './graosData'

/* =========================================================
   Peças da Linha do Tempo em pixel art: console, projetor,
   placas, objetos de cada época e a vila do arroz.
   ========================================================= */
const O = () => hex(OUT)
const S = (p: Pix, ax: number, ay: number, outline = true) => { if (outline) p.outline(O()); return spr(p, ax, ay) }
const fromSprite = (s: Sprite) => { const c = s.img.getContext('2d')!; const d = c.getImageData(0, 0, s.img.width, s.img.height); const p = new Pix(s.img.width, s.img.height); p.d.set(new Uint32Array(d.data.buffer)); return p }

/** Junta várias peças (sprites com âncora) numa só, todas com a mesma âncora no chão. */
export function compose(key: string, parts: { s: Sprite; dx?: number; dy?: number }[]): Sprite {
  return memo('cmp:' + key, () => {
    let x0 = 0, y0 = 0, x1 = 0, y1 = 0
    for (const q of parts) { const dx = q.dx || 0, dy = q.dy || 0; x0 = Math.min(x0, dx - q.s.ax); y0 = Math.min(y0, dy - q.s.ay); x1 = Math.max(x1, dx - q.s.ax + q.s.img.width); y1 = Math.max(y1, dy - q.s.ay + q.s.img.height) }
    const p = new Pix(x1 - x0, y1 - y0)
    for (const q of parts) p.blit(fromSprite(q.s), (q.dx || 0) - q.s.ax - x0, (q.dy || 0) - q.s.ay - y0)
    return spr(p, -x0, -y0)
  })
}
/** Deslocamento na tela de um ponto (dx, dy, dz) em casas/pixels, para compor peças. */
export const off = (dx: number, dy: number, dz = 0) => ({ dx: Math.round((dx - dy) * 16), dy: Math.round((dx + dy) * 8 - dz) })

/* ---------- comuns ---------- */
export function consoleSprite(color: string, lit: boolean, f: number) {
  return memo(`con:${color}:${lit}:${f % 4}`, () => {
    const base = cylPix(8, 14, '#4a4468', '#5a5480')
    const p = new Pix(base.p.w + 6, base.p.h + 14)
    const ox = 3, oy = 14
    p.blit(base.p, ox, oy)
    const cx = base.ax + ox, top = base.ay + oy - 14
    // painel inclinado (losango) flutuando em cima
    const scr = lit ? (f % 2 ? lighter(color, 0.35) : color) : darker(color, 0.5)
    p.poly([[cx - 9, top - 4], [cx, top - 9], [cx + 9, top - 4], [cx, top + 1]], hex(scr))
    p.poly([[cx - 6, top - 4], [cx, top - 7], [cx + 2, top - 6], [cx - 4, top - 3]], hex(lit ? '#ffffff' : lighter(scr, 0.2)))
    if (lit) for (let k = 0; k < 3; k++) p.px(cx - 2 + k * 2, top - 12 - ((f + k) % 3), hex(lighter(color, 0.5)))
    p.outline(O())
    return spr(p, cx, base.ay + oy)
  })
}
export function projector(color: string, on: boolean) {
  return memo(`proj:${color}:${on}`, () => {
    const c = cylPix(13, 4, '#3a3a52', on ? lighter(color, 0.2) : '#4a4a66')
    if (on) { c.p.ellipse(c.ax, c.ay - 4 - 0.5, 9, 4, hex(color)); c.p.ellipse(c.ax, c.ay - 4 - 0.5, 5, 2, hex(lighter(color, 0.5))) }
    return spr(c.p, c.ax, c.ay)
  })
}
/** Placa da época (baixa, na frente da estrada). */
/** Placa da época: o ano numa plaquinha num poste (na entrada de cada marco). */
export function plaque(year: string, color: string) {
  return memo(`plq:${year}:${color}`, () => {
    const s = signPix([{ t: year.toUpperCase(), c: '#ffd27a' }], '#241a34', color, 2)
    const p = new Pix(s.w + 2, s.h + 14)
    p.rect(Math.floor(s.w / 2), s.h - 1, 2, 15, hex('#4a3424'))
    p.blit(s, 1, 0)
    return S(p, Math.floor(s.w / 2) + 1, s.h + 13)
  })
}
export function lamppost(color: string, on: boolean) {
  return memo(`lp:${color}:${on}`, () => {
    const p = new Pix(10, 40)
    p.rect(4, 8, 2, 31, hex('#3a3450')); p.rect(3, 37, 4, 2, hex('#2a2440'))
    p.ellipse(5, 6, 4, 4.5, hex(on ? color : darker(color, 0.5)))
    p.ellipse(4, 5, 1.5, 1.5, hex(on ? '#ffffff' : lighter(color, 0.1)))
    return S(p, 5, 39)
  })
}
/** Pilarete de pedra com uma vela acesa (borda da trilha). */
export function bollard(f: number) {
  return memo('boll:' + (f % 3), () => {
    const p = new Pix(12, 26)
    p.rect(3, 10, 6, 15, hex('#6a6080')); p.rect(3, 10, 2, 15, hex('#8a80a0')); p.rect(8, 10, 1, 15, hex('#4a4060'))
    p.rect(2, 9, 8, 2, hex('#c8a040'))
    p.rect(5, 5, 2, 4, hex('#f2ead8'))
    const fl = [[6, 1], [5, 2], [6, 2]][f % 3]
    p.px(6, 4, hex('#ffd27a')); p.px(fl[0], fl[1] + 1, hex('#ffb35a')); p.px(6, 3, hex('#fff2c0'))
    return S(p, 6, 25)
  })
}
export function lectern(read: boolean) {
  return memo(`lec:${read}`, () => {
    const p = new Pix(22, 30)
    p.rect(10, 12, 2, 16, hex('#4a2e1c')); p.rect(6, 27, 10, 2, hex('#3a2416'))
    p.poly([[1, 10], [12, 4], [21, 9], [10, 15]], hex('#6a4228'))
    p.poly([[3, 9], [12, 5], [19, 9], [10, 13]], hex(read ? '#e8dcc0' : '#fff2c8'))
    p.line(6, 9, 11, 7, hex('#9a8a6a')); p.line(8, 10, 13, 8, hex('#9a8a6a')); p.line(12, 7, 16, 9, hex('#9a8a6a'))
    return S(p, 11, 29)
  })
}

/* ---------- Mesopotâmia ---------- */
export function palm(seed = 0) {
  return memo('palm:' + seed, () => {
    const p = new Pix(40, 54)
    const tr = hex('#8a6a4a'), trd = hex('#6a4a30')
    for (let y = 18; y < 53; y++) { const x = 20 + Math.round(Math.sin(y * 0.08 + seed) * 2); p.rect(x - 1, y, 3, 1, y % 3 ? tr : trd) }
    const lf = hex('#4a9a4a'), ld = hex('#2a6a3a')
    for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.55; for (let r = 0; r < 17; r++) { const x = 20 + Math.cos(a) * r, y = 17 + Math.sin(a) * r * 0.6 + (r * r) / 30; p.px(x, y, r % 4 === 3 ? ld : lf); p.px(x, y + 1, ld) } }
    p.ellipse(20, 18, 3, 2, hex('#6a4a30'))
    return S(p, 20, 53)
  })
}
export function tokens() {
  return memo('tokens', () => {
    const p = new Pix(30, 16)
    p.ellipse(15, 10, 14, 5, hex('#8a6a4a'))
    const cols = ['#c87a4a', '#a85a3a', '#d8a06a']
    for (let i = 0; i < 9; i++) { const x = 5 + (i % 5) * 5 + (i > 4 ? 2 : 0), y = 8 + (i > 4 ? 3 : 0); if (i % 3 === 0) p.poly([[x, y + 2], [x + 2, y - 2], [x + 4, y + 2]], hex(cols[i % 3])); else p.ellipse(x + 2, y, 2, 1.6, hex(cols[i % 3])) }
    return S(p, 15, 13)
  })
}
export function tabletStand() {
  return memo('tablet', () => {
    const t = boxPix(0.9, 0.6, 14, '#6a4a30')
    const p = t.p
    p.poly([[t.ax - 6, t.ay - 26], [t.ax + 6, t.ay - 32], [t.ax + 12, t.ay - 17], [t.ax, t.ay - 11]], hex('#b88a5a'))
    for (let k = 0; k < 4; k++) p.line(t.ax - 2 + k, t.ay - 25 + k * 3, t.ax + 7 + k, t.ay - 29 + k * 3, hex('#8a6440'))
    p.outline(O())
    return spr(p, t.ax, t.ay)
  })
}
export function ziggurat() {
  return memo('zig', () => compose('zig', [
    { s: box(3, 3, 12, '#b88a5a', { top: '#c89a6a' }) },
    { s: box(2.2, 2.2, 12, '#a87a4a', { top: '#c89a6a' }), ...off(0.4, 0.4, 12) },
    { s: box(1.4, 1.4, 12, '#987040', { top: '#c89a6a' }), ...off(0.8, 0.8, 24) },
  ]))
}

/* ---------- Bagdá ---------- */
export function arch(color = '#e8dcc0') {
  return memo('arch:' + color, () => {
    const p = new Pix(70, 80)
    const c = hex(color), cd = hex(darker(color, 0.2)), tl = hex('#2f8f8a'), gd = hex('#e8b65a')
    // duas colunas em perspectiva (ao longo de y: desce para a esquerda)
    p.rect(52, 30, 8, 48, cd); p.rect(53, 30, 6, 48, c)
    p.rect(10, 48, 8, 30, cd); p.rect(11, 48, 6, 30, c)
    // arco pontudo
    for (let t = 0; t <= 1; t += 0.01) { const x = 14 + t * 42, y = 50 - t * 20 - Math.sin(t * Math.PI) * 22; p.rect(Math.round(x) - 3, Math.round(y) - 4, 7, 7, t > 0.45 && t < 0.55 ? gd : tl) }
    p.ellipse(35, 15, 3, 3, gd)
    return S(p, 56, 77)
  })
}
export function scrollRack() {
  return memo('scrolls', () => {
    const b = boxPix(0.5, 1.6, 34, '#6a4228', {
      rightFn: (v, zz, x, y) => { if (Math.floor(zz) % 11 < 2) return hex('#4a2e1c'); return (x + Math.floor(zz / 11) * 2) % 4 < 3 ? hex((x % 4) ? '#efe2c0' : '#c8b890') : hex('#2a1a12') },
    })
    return spr(b.p, b.ax, b.ay)
  })
}
export function desk(color = '#7a4a2a', item: 'book' | 'candle' | 'papers' | 'astro' = 'book') {
  return memo(`desk:${color}:${item}`, () => {
    const d = boxPix(1.4, 0.8, 16, color, { leftFn: (u, zz) => (zz < 12 && u > 0.1 && u < 0.9 && zz > 2 ? hex(darker(color, 0.35)) : null) })
    const p = d.p
    const tx = d.ax + 6, ty = d.ay - 14
    if (item === 'book') { p.poly([[tx - 8, ty], [tx, ty - 4], [tx + 8, ty], [tx, ty + 4]], hex('#f2ead8')); p.line(tx, ty - 4, tx, ty + 4, hex('#9a8a6a')) }
    if (item === 'candle') { p.rect(tx - 1, ty - 8, 3, 8, hex('#f2ead8')); p.px(tx, ty - 10, hex('#ffd27a')); p.px(tx, ty - 11, hex('#fff2c0')); p.poly([[tx + 3, ty + 1], [tx + 10, ty - 2], [tx + 14, ty], [tx + 7, ty + 3]], hex('#e8dcc0')) }
    if (item === 'papers') { for (let k = 0; k < 3; k++) p.poly([[tx - 9 + k * 6, ty + 1], [tx - 3 + k * 6, ty - 2], [tx + 1 + k * 6, ty], [tx - 5 + k * 6, ty + 3]], hex(k % 2 ? '#e8dcc0' : '#f2ead8')) }
    if (item === 'astro') { p.ellipse(tx, ty - 5, 5, 5, hex('#c8a040')); p.ellipse(tx, ty - 5, 3, 3, hex('#7a5a20')); p.rect(tx - 1, ty - 1, 3, 2, hex('#7a5a20')) }
    p.outline(O())
    return spr(p, d.ax, d.ay)
  })
}
export function rug(color: string, w: number, d: number) {
  return memo(`rug:${color}:${w}:${d}`, () => box(w, d, 1, color, { outline: false, topFn: (u, v) => { const e = Math.min(u, v, 1 - u, 1 - v); return e < 0.06 ? hex('#e8b65a') : e < 0.12 ? hex(darker(color, 0.3)) : (Math.floor(u * 6) + Math.floor(v * 6)) % 2 ? hex(lighter(color, 0.1)) : null } }))
}

/* ---------- França ---------- */
export function die(face = 5) {
  return memo('die:' + face, () => {
    const b = boxPix(0.55, 0.55, 18, '#f2eee4', { top: '#ffffff', right: '#d8d2c4', left: '#e8e2d4' })
    const p = b.p, dot = hex('#2a2440')
    // pontinhos no topo e na face da esquerda
    const tc = [b.ax + 0, b.ay - 18 + 4]
    p.px(tc[0], tc[1], dot); p.px(tc[0] - 3, tc[1] - 1, dot); p.px(tc[0] + 3, tc[1] + 1, dot)
    p.px(b.ax - 5, b.ay - 9, dot); p.px(b.ax - 2, b.ay - 6, dot); p.px(b.ax - 8, b.ay - 12, dot); p.px(b.ax - 8, b.ay - 6, dot); p.px(b.ax - 2, b.ay - 12, dot)
    p.outline(O())
    return spr(p, b.ax, b.ay)
  })
}
export function banner(color: string, emblem: 'star' | 'sun') {
  return memo(`ban:${color}:${emblem}`, () => {
    const p = new Pix(24, 60)
    p.rect(11, 2, 2, 57, hex('#5a4030'))
    p.rect(3, 4, 18, 2, hex('#c8a040'))
    p.poly([[4, 6], [20, 6], [20, 36], [12, 31], [4, 36]], hex(color))
    p.poly([[4, 6], [7, 6], [7, 34], [4, 36]], hex(lighter(color, 0.15)))
    if (emblem === 'star') p.poly([[12, 12], [14, 18], [19, 18], [15, 21], [16, 26], [12, 23], [8, 26], [9, 21], [5, 18], [10, 18]], hex('#ffd27a'))
    else { p.ellipse(12, 19, 4, 4, hex('#ffd27a')); for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.28; p.px(12 + Math.cos(a) * 6.5, 19 + Math.sin(a) * 6.5, hex('#ffd27a')) } }
    return S(p, 12, 59)
  })
}
export function pascaline() {
  return memo('pascaline', () => {
    const b = boxPix(1.0, 0.5, 9, '#a87a3a', { top: '#c8984a' })
    const p = b.p
    for (let k = 0; k < 5; k++) { const x = b.ax - 12 + k * 4, y = b.ay - 4 + k * 2; p.ellipse(x, y - 3, 1.6, 1.6, hex('#e8dcc0')); p.px(x, y - 3, hex('#3a2a1a')) }
    p.outline(O())
    return spr(p, b.ax, b.ay)
  })
}

/* ---------- Alemanha (Leibniz) ---------- */
export function bitLamp(on: boolean) {
  return memo('bitl:' + on, () => {
    const p = new Pix(14, 44)
    p.rect(6, 14, 2, 28, hex('#3a3450')); p.rect(4, 41, 6, 2, hex('#2a2440'))
    const c = on ? '#ffd27a' : '#3a3450'
    p.poly([[7, 1], [12, 8], [7, 15], [2, 8]], hex(c))
    if (on) p.poly([[7, 3], [9, 8], [7, 8]], hex('#fff2c0'))
    const t = textPix(on ? '1' : '0', on ? '#ffd27a' : '#8a84a8', '#140c1c')
    p.blit(t, 7 - Math.floor(t.w / 2), 17)
    return S(p, 7, 43)
  })
}
export function bookshelf(w = 1.8) {
  return memo('bs:' + w, () => box(0.5, w, 44, '#5a3a24', {
    rightFn: (v, zz, x) => {
      const sh = Math.floor(zz) % 14
      if (sh < 2 || zz > 41) return hex('#3a2416')
      const b = Math.floor(x / 3), hgt = 9 + Math.floor(hash2(b, Math.floor(zz / 14), 1) * 3)
      if (sh > hgt) return hex('#20140c')
      const pal = ['#8a2a2a', '#2a4a8a', '#c8a040', '#2a6a4a', '#5a3a8a', '#d8d0c0']
      const col = pal[Math.floor(hash2(b, Math.floor(zz / 14), 9) * pal.length)]
      return hex(x % 3 === 2 ? darker(col, 0.3) : col)
    },
  }))
}
export function reckoner() {
  return memo('reck', () => {
    const b = boxPix(1.4, 0.7, 12, '#7a5a2a', { top: '#9a7a3a' })
    const p = b.p
    for (let k = 0; k < 6; k++) { const x = b.ax - 8 + k * 4, y = b.ay - 14 + k * 2; p.rect(x, y - 6, 3, 6, hex('#c8a040')); p.px(x + 1, y - 7, hex('#ffe08a')) }
    p.outline(O())
    return spr(p, b.ax, b.ay)
  })
}

/* ---------- Gauss ---------- */
export function telescope() {
  return memo('tele', () => {
    const p = new Pix(40, 46)
    const leg = hex('#5a4030')
    p.line(20, 26, 10, 45, leg); p.line(20, 26, 30, 45, leg); p.line(20, 26, 21, 45, leg)
    for (let k = 0; k < 26; k++) { const x = 8 + k, y = 34 - k * 0.9; p.rect(Math.round(x), Math.round(y) - 3, 2, 6 - (k > 20 ? 1 : 0), hex(k % 8 < 2 ? '#c8a040' : '#3a4a7a')) }
    p.ellipse(34, 10, 3, 4, hex('#9fe9ff'))
    return S(p, 20, 45)
  })
}
export function starBoard() {
  return memo('starb', () => {
    const s = boxPix(0.15, 2.2, 34, '#2a1e3a', {
      rightFn: (v, zz) => {
        if (v < 0.04 || v > 0.96 || zz < 3 || zz > 31) return hex('#5a4030')
        const pts = [[0.15, 0.25], [0.3, 0.35], [0.45, 0.5], [0.6, 0.55], [0.75, 0.7], [0.88, 0.78]]
        for (const [pv, pz] of pts) if (Math.abs(v - pv) < 0.025 && Math.abs(zz / 34 - pz) < 0.05) return hex('#ffe08a')
        if (Math.abs(zz / 34 - (0.22 + v * 0.62)) < 0.012) return hex('#59d7ff')
        return null
      },
    })
    const p = s.p
    p.rect(s.ax - 2, s.ay - 4, 2, 6, hex('#5a4030'))
    return spr(p, s.ax, s.ay)
  })
}

/* ---------- Ada ---------- */
export function gear(r: number, color: string, f: number) {
  const k = f % 4
  return memo(`gear:${r}:${color}:${k}`, () => {
    const W = r * 2 + 5, p = new Pix(W, W), c = W / 2
    const teeth = Math.max(8, Math.round(r * 1.2))
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - c, dy = y + 0.5 - c, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + (k / 4) * ((Math.PI * 2) / teeth)
      const tooth = Math.cos(a * teeth) > 0.2
      if (d < r * 0.3) continue
      if (d < r || (d < r + 2 && tooth)) p.px(x, y, hex(d < r * 0.55 ? darker(color, 0.25) : color))
    }
    for (let s = 0; s < 4; s++) { const a = (s / 4) * Math.PI * 2 + (k / 4) * 0.5; p.line(c, c, c + Math.cos(a) * r * 0.8, c + Math.sin(a) * r * 0.8, hex(darker(color, 0.35))) }
    p.ellipse(c, c, r * 0.25, r * 0.25, hex(lighter(color, 0.3)))
    return S(p, Math.round(c), Math.round(c))
  })
}
export function engineFrame() {
  return memo('aeng', () => box(0.4, 2.6, 46, '#4a3424', { rightFn: (v, zz) => (v < 0.05 || v > 0.95 || zz < 4 || zz > 42 ? hex('#6a4a30') : hex('#2a1e18')) }))
}
export function cards() {
  return memo('cards', () => {
    const p = new Pix(26, 16)
    for (let k = 0; k < 5; k++) { const y = 12 - k * 2; p.poly([[2, y], [13, y - 5], [24, y], [13, y + 5]], hex(k % 2 ? '#e8d8b0' : '#f2e6c8')); for (let h = 0; h < 4; h++) p.px(9 + h * 2, y - 1 + (h % 2), hex('#5a4030')) }
    return S(p, 13, 15)
  })
}

/* ---------- Cayley ---------- */
export function numCube(ch: string, color = '#bff6ff', s = 0.7) {
  return memo(`nc:${ch}:${color}:${s}`, () => {
    const h = Math.round(s * 26)
    const b = boxPix(s, s, h, color, { top: lighter(color, 0.25), right: darker(color, 0.3) })
    const t = textPix(ch, '#1a1440', '')
    const cx = b.ax + Math.round((s / 2 - s) * 16), cy = b.ay + Math.round((s / 2 + s) * 8 - h / 2)
    b.p.blit(t, cx - Math.floor(t.w / 2), cy - Math.floor(t.h / 2))
    b.p.outline(O())
    return spr(b.p, b.ax, b.ay)
  })
}
export function bracketBoard(rows: string[][], color: string) {
  return memo(`bb:${JSON.stringify(rows)}:${color}`, () => {
    const lines = rows.map((r) => r.join('  '))
    const s = signPix(lines.map((t) => ({ t: '[ ' + t + ' ]', c: '#bff6ff' })), '#1e1a34', color, 4)
    const p = new Pix(s.w + 2, s.h + 20)
    p.rect(4, s.h - 2, 2, 21, hex('#3a3450')); p.rect(s.w - 5, s.h - 2, 2, 21, hex('#3a3450'))
    p.blit(s, 1, 0)
    return S(p, Math.floor(s.w / 2), s.h + 19)
  })
}

/* ---------- Shannon ---------- */
export function unicycle(f: number) {
  const k = f % 4
  return memo('uni:' + k, () => {
    const p = new Pix(20, 40)
    const tilt = [0, 1, 0, -1][k]
    p.ellipse(10, 33, 6, 6, hex('#2a2a30')); p.ellipse(10, 33, 4, 4, hex('#8a8a96')); p.px(10, 33, hex('#2a2a30'))
    p.line(10, 33, 10 + tilt, 12, hex('#c84a3a')); p.line(11, 33, 11 + tilt, 12, hex('#c84a3a'))
    p.rect(6 + tilt, 9, 9, 3, hex('#2a2a30'))
    return S(p, 10, 39)
  })
}
export function relayCabinet(f: number) {
  return memo('relay:' + (f % 4), () => {
    const b = boxPix(0.6, 1.4, 40, '#3a4048', {
      rightFn: (v, zz, x, y) => {
        if (zz < 4 || zz > 37 || v < 0.06 || v > 0.94) return null
        if (x % 5 === 2 && Math.floor(zz) % 6 === 3) return hex(hash2(x, Math.floor(zz / 6) + (f % 4), 3) < 0.5 ? '#ffb35a' : '#4a3a2a')
        return hex('#2a3038')
      },
    })
    return spr(b.p, b.ax, b.ay)
  })
}
export function mazeMouse(f: number) {
  return memo('maze:' + (f % 8), () => {
    const b = boxPix(1.4, 1.4, 4, '#c8b898', {
      topFn: (u, v) => { const gx = Math.floor(u * 5), gy = Math.floor(v * 5); const wall = (Math.abs(u * 5 - Math.round(u * 5)) < 0.08 && hash2(gx, Math.floor(v * 5), 1) < 0.5) || (Math.abs(v * 5 - Math.round(v * 5)) < 0.08 && hash2(Math.floor(u * 5), gy, 2) < 0.5); return wall ? hex('#4a3a2a') : null },
    })
    const p = b.p
    const k = (f % 8) / 8, mx = b.ax - 6 + Math.round(Math.sin(k * 6.28) * 6), my = b.ay - 8 + Math.round(Math.cos(k * 6.28) * 3)
    p.ellipse(mx, my, 2, 1.5, hex('#8a8a96')); p.px(mx + 2, my, hex('#ff8aa0'))
    p.outline(O())
    return spr(p, b.ax, b.ay)
  })
}

/* ---------- Rosenblatt ---------- */
export function perceptron(f: number) {
  return memo('perc:' + (f % 6), () => {
    const N = 8
    const b = boxPix(0.5, 2.2, 44, '#2a3040', {
      rightFn: (v, zz) => {
        if (zz < 6 || zz > 40 || v < 0.08 || v > 0.92) return null
        const gx = Math.floor(((v - 0.08) / 0.84) * N), gy = Math.floor(((zz - 6) / 34) * N)
        const fu = (((v - 0.08) / 0.84) * N) % 1, fz = (((zz - 6) / 34) * N) % 1
        if (fu < 0.2 || fz < 0.25) return hex('#1a1e2a')
        const on = Math.sin(gx * 1.7 + gy * 2.3 + (f % 6) * 1.3) > 0.35
        return hex(on ? '#ffd27a' : '#2a3050')
      },
    })
    return spr(b.p, b.ax, b.ay)
  })
}
export function neuronNode(color: string, f: number) {
  return memo(`neu:${color}:${f % 4}`, () => {
    const p = new Pix(30, 50)
    p.rect(14, 26, 2, 23, hex('#3a3450')); p.rect(11, 47, 8, 2, hex('#2a2440'))
    for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.28 + 0.3; p.line(15, 16, 15 + Math.cos(a) * 13, 16 + Math.sin(a) * 9, hex(k === f % 6 ? '#ffffff' : darker(color, 0.2))) }
    p.ellipse(15, 16, 5, 5, hex(color)); p.ellipse(14, 15, 2, 2, hex(lighter(color, 0.5)))
    return S(p, 15, 49)
  })
}

/* ---------- bichos e o núcleo ---------- */
export function coreBase() {
  return memo('coreb', () => compose('coreb', [
    { s: box(4, 4, 8, '#3a3458', { top: '#4a4470' }) },
    { s: box(2.6, 2.6, 8, '#4a4470', { top: '#5a5490' }), ...off(0.7, 0.7, 8) },
  ]))
}

/* ---------- a vila do arroz ---------- */
export function sheafPix(k: GK) {
  const p = new Pix(12, 20)
  const st = hex('#d8b45a'), sd = hex('#a8843a')
  for (let i = 0; i < 5; i++) p.line(6, 10, 2 + i * 2, 19, i % 2 ? st : sd)
  p.rect(4, 10, 5, 2, hex('#8a5a34'))
  const g = hex(GRAIN[k]), gl = hex(lighter(GRAIN[k], 0.4))
  p.ellipse(6, 5, 2.4, 4, g); p.ellipse(3, 7, 1.8, 3, g); p.ellipse(9, 7, 1.8, 3, g); p.px(5, 3, gl)
  return p
}
export function sheaf(k: GK) { return memo('sheaf:' + k, () => { const p = sheafPix(k); p.outline(O()); return spr(p, 6, 19) }) }
export function house(w: number, d: number) {
  return memo(`house:${w}:${d}`, () => {
    const H = 30
    const body = box(w, d, H, '#f1e4c8', {
      top: '#d8c8a8',
      leftFn: (u, zz) => {
        if (zz < 4) return hex('#6a6a7a')
        if (u < 0.04 || u > 0.96) return hex('#c0392b')
        if (Math.abs(u - 0.5) < 0.1 && zz < 20) return hex(zz > 18 ? '#5a3a24' : '#8a5a34')
        if ((Math.abs(u - 0.22) < 0.07 || Math.abs(u - 0.78) < 0.07) && zz > 12 && zz < 22) return hex(Math.floor(zz) % 3 ? '#5a3a24' : '#f2d890')
        return null
      },
      rightFn: (v, zz) => (zz < 4 ? hex('#5a5a6a') : v < 0.05 || v > 0.95 ? hex('#a8302a') : null),
    })
    // telhado: pirâmide larga com beiral
    const rw = w + 0.6, rd = d + 0.6
    const P = (a: number, b: number, z: number) => [Math.round((a - b) * 16), Math.round((a + b) * 8 - z)]
    const p = new Pix((rw + rd) * 16 + 4, (rw + rd) * 8 + 40)
    const ax = Math.round(rd * 16) + 2, ay = 40
    const T = (pts: number[][], c: string) => p.poly(pts.map(([a, b, z]) => { const q = P(a, b, z); return [q[0] + ax, q[1] + ay] }), hex(c))
    const top = 24, ridge = 0.35
    // águas do telhado (frente esquerda e frente direita)
    T([[0, rd, 0], [rw, rd, 0], [rw / 2 + ridge * rw * 0.4, rd / 2, top], [rw / 2 - ridge * rw * 0.4, rd / 2, top]], '#3e4258')
    T([[rw, 0, 0], [rw, rd, 0], [rw / 2 + ridge * rw * 0.4, rd / 2, top]], '#2e3246')
    T([[0, 0, 0], [rw, 0, 0], [rw / 2 + ridge * rw * 0.4, rd / 2, top], [rw / 2 - ridge * rw * 0.4, rd / 2, top]], '#4e5470')
    // telhas (linhas)
    for (let k = 1; k < 6; k++) { const a = (k / 6) * rw; const q0 = P(a, rd, 0), q1 = P(rw / 2 + (a / rw - 0.5) * ridge * rw * 0.8, rd / 2, top); p.line(q0[0] + ax, q0[1] + ay, q1[0] + ax, q1[1] + ay, hex('#2a2e40')) }
    const r0 = P(rw / 2 - ridge * rw * 0.4, rd / 2, top), r1 = P(rw / 2 + ridge * rw * 0.4, rd / 2, top)
    p.line(r0[0] + ax - 3, r0[1] + ay - 2, r1[0] + ax + 3, r1[1] + ay - 2, hex('#2a2e40'))
    p.rect(r0[0] + ax - 4, r0[1] + ay - 4, 2, 2, hex('#2a2e40')); p.rect(r1[0] + ax + 3, r1[1] + ay - 4, 2, 2, hex('#2a2e40'))
    p.outline(O())
    const roof = spr(p, ax, ay)
    return compose(`housec:${w}:${d}`, [{ s: body }, { s: roof, ...off(-0.3, -0.3, H) }])
  })
}
export function riceTuft(p: Pix, x: number, y: number, k: number) {
  const g = hex(k % 3 ? '#79c24a' : '#5aa83a'), gd = hex('#3a7a2a')
  p.px(x, y, gd); p.px(x, y - 1, g); p.px(x - 1, y - 2, g); p.px(x + 1, y - 2, g); p.px(x, y - 3, g); if (k % 2) p.px(x - 2, y - 3, g)
}
export function stall() {
  return memo('stall', () => {
    const counter = box(2.2, 0.8, 14, '#8a5a34', { top: '#b8834e', leftFn: (u, zz) => (zz > 4 && zz < 12 && Math.floor(u * 10) % 2 ? hex('#7a4a2a') : null) })
    const p = new Pix(100, 80)
    const ax = 30, ay = 70
    p.blit(fromSprite(counter), ax - counter.ax, ay - counter.ay)
    // postes e toldo vermelho
    const post = (dx: number, dy: number) => { const o = off(dx, dy); p.rect(ax + o.dx, ay + o.dy - 40, 2, 40, hex('#5a3a24')) }
    post(0, -0.6); post(2.2, -0.6); post(0, 0.8); post(2.2, 0.8)
    const A = off(-0.2, -0.8, 40), B = off(2.4, -0.8, 40), Cc = off(2.4, 1.1, 34), D = off(-0.2, 1.1, 34)
    p.poly([[ax + A.dx, ay + A.dy], [ax + B.dx, ay + B.dy], [ax + Cc.dx, ay + Cc.dy], [ax + D.dx, ay + D.dy]], hex('#c8423a'))
    for (let i = 0; i < 8; i++) { const t = i / 8, q0 = off(-0.2 + t * 2.6, -0.8, 40), q1 = off(-0.2 + t * 2.6, 1.1, 34); if (i % 2) p.line(ax + q0.dx, ay + q0.dy, ax + q1.dx, ay + q1.dy, hex('#f2ead8')) }
    // feixes no balcão
    const sh = ['B', 'M', 'F'] as GK[]
    sh.forEach((k, i) => { const o = off(0.4 + i * 0.6, 0.3, 14); p.blit(sheafPix(k), ax + o.dx - 6, ay + o.dy - 19) })
    p.outline(O())
    return spr(p, ax, ay)
  })
}
export function recordBoard(k: number, n: number[], total: number) {
  return memo(`rec:${k}`, () => {
    const lines = [{ t: `REGISTRO ${k + 1}`, c: '#5a3a24' }]
    const s = signPix([...lines, { t: ' ', c: '#000' }, { t: `= ${total} DOU`, c: '#8a1f2a' }], '#f3e3bd', '#8a5a34', 3)
    const p = new Pix(Math.max(s.w, 50) + 2, s.h + 18)
    const ox = Math.floor((p.w - s.w) / 2)
    p.rect(ox + 3, s.h - 2, 2, 19, hex('#5a3a24')); p.rect(ox + s.w - 5, s.h - 2, 2, 19, hex('#5a3a24'))
    p.blit(s, ox, 0)
    // feixes pequenos no meio da placa
    let x = Math.floor(p.w / 2) - Math.round(((n[0] + n[1] + n[2]) * 5) / 2)
    ;(['B', 'M', 'F'] as GK[]).forEach((g, j) => { for (let t = 0; t < n[j]; t++) { p.ellipse(x + 2, 17, 1.6, 3, hex(GRAIN[g])); p.px(x + 2, 21, hex('#a8843a')); x += 5 } })
    return S(p, Math.floor(p.w / 2), s.h + 17)
  })
}
export function basket(k: GK, txt: string) {
  return memo(`bask:${k}:${txt}`, () => {
    const c = cylPix(10, 10, '#a8783a', '#5a3a1a')
    const p = new Pix(30, 50)
    p.blit(c.p, 15 - c.ax, 48 - c.ay)
    for (let y = 40; y < 48; y += 2) p.line(6, y, 24, y, hex('#8a5a2a'))
    p.blit(sheafPix(k), 9, 22)
    const t = textPix(txt, txt === '?' ? '#ffd27a' : '#ffffff', '#140c1c')
    p.blit(t, 15 - Math.floor(t.w / 2), 4)
    p.outline(O())
    return spr(p, 15, 48)
  })
}
export function scaleSprite(left: number, txt: string) {
  return memo(`scale:${left}:${txt}`, () => {
    const p = new Pix(54, 56)
    const wd = hex('#6a4228'), br = hex('#c8a040')
    p.rect(26, 14, 3, 40, wd); p.rect(20, 52, 15, 3, wd)
    p.rect(6, 14, 43, 2, br)
    for (const [x, n] of [[10, left], [44, 0]] as [number, number][]) {
      p.line(x - 5, 26, x, 16, br); p.line(x + 5, 26, x, 16, br)
      p.ellipse(x, 27, 7, 2.5, br)
      for (let i = 0; i < n; i++) p.blit(sheafPix('M'), x - 6 + ((i % 3) - 1) * 3, 8 + Math.floor(i / 3) * -3)
    }
    if (txt) { const t = textPix(txt, '#ffd27a', '#140c1c'); p.blit(t, 27 - Math.floor(t.w / 2), 0) }
    p.outline(O())
    return spr(p, 27, 54)
  })
}
export function woodTable() {
  return memo('wtable', () => {
    const b = boxPix(2.4, 1.2, 14, '#8a5a34', { top: '#b8834e', topFn: (u, v, pp, x, y) => (Math.floor(v * 6) % 2 === 0 && x % 7 === 0 ? hex('#a8733e') : null), leftFn: (u, zz) => (zz < 10 && u > 0.08 && u < 0.92 ? hex('#2a1a12') : null), rightFn: (v, zz) => (zz < 10 && v > 0.1 && v < 0.9 ? hex('#1a100a') : null) })
    const p = b.p
    // três tabuinhas de registro em cima
    for (let k = 0; k < 3; k++) { const o = off(0.5 + k * 0.7, 0.6, 14); p.poly([[b.ax + o.dx - 6, b.ay + o.dy], [b.ax + o.dx, b.ay + o.dy - 3], [b.ax + o.dx + 6, b.ay + o.dy], [b.ax + o.dx, b.ay + o.dy + 3]], hex('#f3e3bd')) }
    p.outline(O())
    return spr(p, b.ax, b.ay)
  })
}
export function lantern(f: number) {
  return memo('lant:' + (f % 2), () => {
    const p = new Pix(14, 50)
    p.rect(6, 6, 2, 43, hex('#4a2e1c')); p.rect(6, 6, 7, 2, hex('#4a2e1c'))
    p.rect(9, 8, 1, 3, hex('#2a1a12'))
    p.ellipse(10, 15, 4, 5, hex(f % 2 ? '#e84a3a' : '#d83a2a')); p.rect(8, 10, 5, 1, hex('#c8a040')); p.rect(8, 20, 5, 1, hex('#c8a040'))
    p.px(9, 14, hex('#ffd27a'))
    return S(p, 7, 49)
  })
}
export function gate() {
  return memo('gate', () => {
    // portal (paifang) atravessando a estrada ao longo de y
    const p = new Pix(90, 110)
    const ax = 70, ay = 104
    const pil = (dy: number) => { const o = off(0, dy); p.rect(ax + o.dx - 2, ay + o.dy - 64, 5, 64, hex('#c0392b')); p.rect(ax + o.dx - 2, ay + o.dy - 64, 2, 64, hex('#d8503a')) }
    pil(0); pil(3.6)
    const bar = (z: number, th: number, c: string, ext = 0.5) => { const a = off(0, -ext, z), b = off(0, 3.6 + ext, z); p.poly([[ax + a.dx, ay + a.dy - th], [ax + b.dx, ay + b.dy - th], [ax + b.dx, ay + b.dy], [ax + a.dx, ay + a.dy]], hex(c)) }
    bar(52, 5, '#c0392b', 0.2)
    bar(66, 6, '#3e4258', 0.8)
    bar(72, 4, '#2e3246', 0.6)
    const t = textPix('VILA', '#ffd27a', '#140c1c'); const m = off(0, 1.8, 58); p.rect(ax + m.dx - 10, ay + m.dy - 6, 20, 9, hex('#1a1a2a')); p.blit(t, ax + m.dx - Math.floor(t.w / 2), ay + m.dy - 7)
    p.outline(O())
    return spr(p, ax, ay)
  })
}

/* ---------- ajuda: ícone de texto no chão (ano na linha do tempo) ---------- */
export function yearMark(year: string, color: string) { return label(year, color, '#140c1c') }
export { cyl, box, rgbOf, mix }
