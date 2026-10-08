/* =========================================================
   Pixel art feita na hora: um “papel quadriculado” (Pix) com
   retângulos, polígonos, linhas, elipses, contorno automático
   e uma fonte de pixels 5×7 com acentos do português.
   Tudo nítido: nada de anti-serrilhado.
   ========================================================= */

/** Cor no formato do ImageData (little-endian: 0xAABBGGRR). */
export function hex(c: string, a = 255): number {
  const h = c.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return (((a & 255) << 24) | (b << 16) | (g << 8) | r) >>> 0
}
export const rgbOf = (c: number) => [c & 255, (c >>> 8) & 255, (c >>> 16) & 255, c >>> 24]
export function mix(c1: string, c2: string, k: number) {
  const a = c1.replace('#', ''), b = c2.replace('#', '')
  const f = (i: number) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - k) + parseInt(b.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')
  return '#' + f(0) + f(2) + f(4)
}
export const darker = (c: string, k = 0.25) => mix(c, '#140c1c', k)
export const lighter = (c: string, k = 0.25) => mix(c, '#fff8e8', k)

export class Pix {
  w: number; h: number; d: Uint32Array
  constructor(w: number, h: number) { this.w = Math.max(1, Math.ceil(w)); this.h = Math.max(1, Math.ceil(h)); this.d = new Uint32Array(this.w * this.h) }
  px(x: number, y: number, c: number) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c }
  get(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.d[y * this.w + x] : 0 }
  rect(x: number, y: number, w: number, h: number, c: number) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c) }
  /** Polígono preenchido (amostra no centro de cada pixel). */
  poly(pts: number[][], c: number) {
    let y0 = Infinity, y1 = -Infinity
    for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]) }
    const xs: number[] = []
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const sy = y + 0.5; xs.length = 0
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length]
        if ((a[1] <= sy && b[1] > sy) || (b[1] <= sy && a[1] > sy)) xs.push(a[0] + ((sy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]))
      }
      xs.sort((p, q) => p - q)
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) this.px(x, y, c)
    }
  }
  line(x0: number, y0: number, x1: number, y1: number, c: number) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (;;) { this.px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx } if (e2 <= dx) { err += dx; y0 += sy } }
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: number) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry
      if (u * u + v * v <= 1) this.px(x, y, c)
    }
  }
  /** Contorno de 1 pixel em volta do que é opaco. */
  outline(c: number, diag = false) {
    const out = this.d.slice()
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.d[y * this.w + x] >>> 24) continue
      const n = (this.get(x - 1, y) | this.get(x + 1, y) | this.get(x, y - 1) | this.get(x, y + 1)) >>> 24
      const dg = diag ? (this.get(x - 1, y - 1) | this.get(x + 1, y - 1) | this.get(x - 1, y + 1) | this.get(x + 1, y + 1)) >>> 24 : 0
      if (n || dg) out[y * this.w + x] = c
    }
    this.d = out
    return this
  }
  /** Copia outro Pix por cima (só pixels opacos). */
  blit(s: Pix, dx: number, dy: number, flip = false) {
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      const c = s.d[y * s.w + (flip ? s.w - 1 - x : x)]
      if (c >>> 24) this.px(dx + x, dy + y, c)
    }
    return this
  }
  /** Troca cada pixel por fn(pixel). */
  map(fn: (c: number, x: number, y: number) => number) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const i = y * this.w + x; if (this.d[i] >>> 24) this.d[i] = fn(this.d[i], x, y) } return this }
  canvas(): HTMLCanvasElement {
    const cv = document.createElement('canvas'); cv.width = this.w; cv.height = this.h
    const ctx = cv.getContext('2d')!
    const img = ctx.createImageData(this.w, this.h)
    new Uint32Array(img.data.buffer).set(this.d)
    ctx.putImageData(img, 0, 0)
    return cv
  }
}

/** Ruído determinístico (texturas iguais sempre). */
export function rnd(seed: number) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 } }
export const hash2 = (x: number, y: number, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }

/* ---------- fonte de pixels 5×7 ---------- */
const G: Record<string, string> = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.', C: '.###.|#...#|#....|#....|#....|#...#|.###.',
  D: '####.|#...#|#...#|#...#|#...#|#...#|####.', E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.####', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#', I: '###|.#.|.#.|.#.|.#.|.#.|###',
  J: '..###|...#.|...#.|...#.|#..#.|#..#.|.##..', K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|##..#|#.#.#|#..##|#...#|#...#|#...#', O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
  P: '####.|#...#|#...#|####.|#....|#....|#....', Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..', U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
  V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..', W: '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  '0': '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', '1': '..#..|.##..|..#..|..#..|..#..|..#..|.###.', '2': '.###.|#...#|....#|...#.|..#..|.#...|#####',
  '3': '####.|....#|....#|.###.|....#|....#|####.', '4': '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', '5': '#####|#....|####.|....#|....#|#...#|.###.',
  '6': '.###.|#....|#....|####.|#...#|#...#|.###.', '7': '#####|....#|...#.|..#..|.#...|.#...|.#...', '8': '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  '9': '.###.|#...#|#...#|.####|....#|....#|.###.',
  '.': '.|.|.|.|.|.|#', ',': '..|..|..|..|..|.#|#.', ':': '.|.|#|.|.|#|.', ';': '..|..|.#|..|..|.#|#.', '!': '#|#|#|#|#|.|#',
  '?': '.###.|#...#|....#|...#.|..#..|.....|..#..', '-': '...|...|...|###|...|...|...', '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
  '=': '.....|.....|#####|.....|#####|.....|.....', '/': '....#|...#.|...#.|..#..|.#...|.#...|#....', '(': '.#|#.|#.|#.|#.|#.|.#', ')': '#.|.#|.#|.#|.#|.#|#.',
  "'": '#|#|.|.|.|.|.', '"': '#.#|#.#|...|...|...|...|...', '×': '.....|#...#|.#.#.|..#..|.#.#.|#...#|.....', '·': '.|.|.|#|.|.|.',
  '%': '##..#|##..#|...#.|..#..|.#...|#..##|#..##', '>': '#....|.#...|..#..|...#.|..#..|.#...|#....', '<': '....#|...#.|..#..|.#...|..#..|...#.|....#',
  '[': '##|#.|#.|#.|#.|#.|##', ']': '##|.#|.#|.#|.#|.#|##', '_': '.....|.....|.....|.....|.....|.....|#####', '*': '.....|#.#.#|.###.|#####|.###.|#.#.#|.....',
}
const ACC: Record<string, [string, string]> = { // [letra base, acento]
  'Á': ['A', 'a'], 'À': ['A', 'g'], 'Â': ['A', 'c'], 'Ã': ['A', 't'], 'É': ['E', 'a'], 'Ê': ['E', 'c'], 'Í': ['I', 'a'], 'Ó': ['O', 'a'], 'Ô': ['O', 'c'],
  'Õ': ['O', 't'], 'Ú': ['U', 'a'], 'Ü': ['U', 'd'], 'Ç': ['C', 'z'],
}
const MARK: Record<string, string[]> = { a: ['...#.', '..#..'], g: ['.#...', '..#..'], c: ['..#..', '.#.#.'], t: ['.#.#.', '#.#..'], d: ['.....', '.#.#.'] }
const ALIAS: Record<string, string> = { '“': '"', '”': '"', '‘': "'", '’': "'", '–': '-', '—': '-', '…': '.' }
const glyph = (ch: string) => G[ch]?.split('|')
export const FONT_H = 11 // 2 de acento + 7 + 2 de cauda
function gw(ch: string) { if (ch === ' ') return 3; const base = ACC[ch]?.[0] || ch; const g = glyph(base) || glyph('?')!; return g[0].length }

export function textWidth(s: string) { s = norm(s); let w = 0; for (const ch of s) w += gw(ch) + 1; return Math.max(0, w - 1) }
const norm = (s: string) => s.toUpperCase().split('').map((c) => ALIAS[c] || c).join('').replace(/\./g, '.')

/** Desenha um texto em pixels (maiúsculas) no Pix, com topo em y. */
export function drawText(p: Pix, s: string, x: number, y: number, c: number) {
  s = norm(s)
  for (const ch of s) {
    if (ch === ' ') { x += 4; continue }
    const acc = ACC[ch], base = acc ? acc[0] : ch
    const g = glyph(base) || glyph('?')!
    const w = g[0].length
    g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') p.px(x + i, y + 2 + j, c) })
    if (acc) {
      if (acc[1] === 'z') { p.px(x + 2, y + 9, c); p.px(x + 1, y + 10, c) }
      else { const m = MARK[acc[1]], off = Math.round((w - 5) / 2); m.forEach((row, j) => { for (let i = 0; i < 5; i++) if (row[i] === '#') p.px(x + off + i, y + j, c) }) }
    }
    x += w + 1
  }
}
/** Texto pronto em um Pix, com contorno escuro (bom para o mundo). */
export function textPix(s: string, color: string, outlineColor = '#140c1c', pad = 1) {
  const w = textWidth(s) + pad * 2, p = new Pix(w, FONT_H + pad * 2)
  drawText(p, s, pad, pad, hex(color))
  if (outlineColor) p.outline(hex(outlineColor), true)
  return p
}
