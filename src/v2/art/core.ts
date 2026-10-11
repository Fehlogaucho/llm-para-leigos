import { Pix, hex, hash2, darker, lighter, mix, textPix } from '../engine/pix'
import type { Sprite, TileSpec } from '../engine/runtime'

/* =========================================================
   Peças básicas da pixel art isométrica: pisos, blocos,
   cilindros, brilhos, sombras e marcadores. Tudo em cache.
   ========================================================= */
export const OUT = '#1b1426' // contorno
const cache = new Map<string, any>()
export function memo<T>(k: string, f: () => T): T { if (!cache.has(k)) cache.set(k, f()); return cache.get(k) }
export const spr = (p: Pix, ax: number, ay: number): Sprite => ({ img: p.canvas(), ax, ay })

/* ---------- pisos ---------- */
/** Coordenadas locais (u ao longo de x, v ao longo de y) de um pixel do losango 32×16. */
function uv(px: number, py: number) { const X = px + 0.5 - 16, Y = py + 0.5; return { u: (X / 16 + Y / 8) / 2, v: (Y / 8 - X / 16) / 2 } }
const DIAMOND = [[0, 8], [16, 0], [32, 8], [16, 16]]

export function tilePix(t: TileSpec, cx: number, cy: number): Pix {
  const p = new Pix(32, 16)
  const a = t.a || '#8a8a9a', b = t.b || darker(a, 0.3), c = t.c || lighter(a, 0.3)
  const A = hex(a), B = hex(b), C = hex(c), Ad = hex(darker(a, 0.12)), Al = hex(lighter(a, 0.1))
  const fill = (fn: (u: number, v: number, n: number, px: number, py: number) => number) => {
    const tmp = new Pix(32, 16); tmp.poly(DIAMOND, 1)
    for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) if (tmp.get(x, y)) { const q = uv(x, y); p.px(x, y, fn(q.u, q.v, hash2(cx * 32 + x, cy * 16 + y, 7), x, y)) }
  }
  switch (t.s) {
    case 'wood': fill((u, v, n) => { const pl = v * 4, f = pl - Math.floor(pl); if (f < 0.09) return B; const seam = (u * 3 + Math.floor(pl) * 0.37 + cx * 0.21) % 1; if (seam < 0.025) return B; return n < 0.12 ? Ad : n > 0.93 ? Al : A }); break
    case 'stone': fill((u, v, n) => { if (u < 0.05 || v < 0.05) return C; if (u > 0.95 || v > 0.95) return B; return n < 0.15 ? Ad : n > 0.9 ? Al : A }); break
    case 'tiles': fill((u, v, n) => { const i = Math.floor(u * 2), j = Math.floor(v * 2), fu = (u * 2) % 1, fv = (v * 2) % 1; if (fu < 0.06 || fv < 0.06) return B; const alt = (i + j + cx + cy) % 2 === 0; return alt ? (n < 0.1 ? Ad : A) : (n < 0.1 ? Ad : hex(t.c || lighter(a, 0.18))) }); break
    case 'checker': fill((u, v, n) => { const i = Math.floor(u * 2), j = Math.floor(v * 2); const fu = (u * 2) % 1, fv = (v * 2) % 1; if (fu < 0.05 || fv < 0.05) return hex(mix(a, b, 0.5)); return (i + j + cx + cy) % 2 ? (n < 0.05 ? Ad : A) : B }); break
    case 'grass': fill((u, v, n) => { if (n > 0.985) return hex(t.c || '#ffe08a'); if (n > 0.86) return hex(lighter(a, 0.22)); if (n < 0.14) return B; return A }); break
    case 'sand': case 'earth': fill((u, v, n) => n > 0.94 ? C : n < 0.08 ? B : n < 0.25 ? Ad : A); break
    case 'water': fill((u, v, n, px, py) => { const w = Math.sin((u * 6 + v * 2 + cx * 0.7) * Math.PI); return w > 0.92 && n > 0.4 ? C : n < 0.1 ? B : A }); break
    case 'metal': fill((u, v, n) => { if (u < 0.04 || v < 0.04) return C; if (u > 0.96 || v > 0.96) return B; const r = (Math.abs(u - 0.15) < 0.06 || Math.abs(u - 0.85) < 0.06) && (Math.abs(v - 0.15) < 0.06 || Math.abs(v - 0.85) < 0.06); return r ? C : n < 0.1 ? Ad : A }); break
    case 'circuit': fill((u, v, n) => { const hu = hash2(cx, cy, 3), hv = hash2(cx, cy, 5); const onU = Math.abs(v - (0.25 + hu * 0.5)) < 0.045, onV = Math.abs(u - (0.25 + hv * 0.5)) < 0.045 && hu > 0.5; if (onU || onV) return C; if (u < 0.03 || v < 0.03) return B; return n < 0.12 ? Ad : A }); break
    case 'mosaic': fill((u, v, n) => { const i = Math.floor(u * 4), j = Math.floor(v * 4), fu = (u * 4) % 1, fv = (v * 4) % 1; if (fu < 0.1 || fv < 0.1) return B; const k = hash2(cx * 4 + i, cy * 4 + j, 11); return k < 0.33 ? A : k < 0.66 ? C : hex(t.c ? mix(t.c, a, 0.5) : lighter(a, 0.4)) }); break
    case 'road': fill((u, v, n) => { const i = Math.floor(u * 3 + (Math.floor(v * 2) % 2) * 0.5), fu = (u * 3 + (Math.floor(v * 2) % 2) * 0.5) % 1, fv = (v * 2) % 1; if (fu < 0.07 || fv < 0.06) return B; return hash2(cx * 3 + i, cy * 2 + Math.floor(v * 2), 2) < 0.3 ? Ad : n > 0.95 ? Al : A }); break
    case 'carpet': fill((u, v, n) => { const e = Math.min(u, v, 1 - u, 1 - v); if (e < 0.08) return C; if (e < 0.14) return B; return n < 0.08 ? Ad : A }); break
    case 'glass': fill((u, v, n) => { const e = Math.min(u, v, 1 - u, 1 - v); if (e < 0.035) return C; if (e < 0.09) return B; const sh = Math.abs(u - v - 0.1) < 0.05; return sh ? Al : n > 0.985 ? C : n < 0.1 ? Ad : A }); break
    default: fill((u, v, n) => (n < 0.1 ? Ad : A))
  }
  return p
}

/* ---------- blocos e cilindros ---------- */
export interface BoxOpts { top?: string; left?: string; right?: string; outline?: boolean; topFn?: (u: number, v: number, p: Pix, x: number, y: number) => number | null; leftFn?: (u: number, zz: number, x: number, y: number) => number | null; rightFn?: (v: number, zz: number, x: number, y: number) => number | null }
/**
 * Bloco de w×d casas e h pixels de altura. Devolve o Pix e a âncora
 * (ponta de trás da base). Faces visíveis: topo, esquerda (y = d) e direita (x = w).
 */
export function boxPix(w: number, d: number, h: number, color: string, o: BoxOpts = {}) {
  const W = Math.ceil((w + d) * 16) + 2, H = Math.ceil((w + d) * 8 + h) + 2
  const p = new Pix(W, H)
  const ax = d * 16 + 1, ay = h + 1
  const P = (a: number, b: number, z: number) => [ax + (a - b) * 16, ay + (a + b) * 8 - z]
  const top = o.top || lighter(color, 0.12), left = o.left || color, right = o.right || darker(color, 0.22)
  // face esquerda (y = d)
  const lf = new Pix(W, H); lf.poly([P(0, d, h), P(w, d, h), P(w, d, 0), P(0, d, 0)], 1)
  const rf = new Pix(W, H); rf.poly([P(w, 0, h), P(w, d, h), P(w, d, 0), P(w, 0, 0)], 1)
  const tf = new Pix(W, H); tf.poly([P(0, 0, h), P(w, 0, h), P(w, d, h), P(0, d, h)], 1)
  const L = hex(left), R = hex(right), T = hex(top)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (lf.get(x, y)) { const u = (x - P(0, d, 0)[0]) / (w * 16 || 1); const zz = (P(0, d, 0)[1] + u * w * 8) - y; p.px(x, y, (o.leftFn && o.leftFn(u, zz, x, y)) ?? L) }
    if (rf.get(x, y)) { const v = (x - P(w, 0, 0)[0]) / (-d * 16 || 1); const zz = (P(w, 0, 0)[1] + v * d * 8) - y; p.px(x, y, (o.rightFn && o.rightFn(v, zz, x, y)) ?? R) }
    if (tf.get(x, y)) { const X = x + 0.5 - ax, Y = y + 0.5 - (ay - h); const u = (X / 16 + Y / 8) / 2 / (w || 1), v = (Y / 8 - X / 16) / 2 / (d || 1); p.px(x, y, (o.topFn && o.topFn(u, v, p, x, y)) ?? T) }
  }
  // arestas claras no topo
  const hl = hex(lighter(top, 0.25))
  p.line(P(0, d, h)[0], P(0, d, h)[1] - 1, P(w, d, h)[0] - 1, P(w, d, h)[1] - 1, hl)
  if (o.outline !== false) p.outline(hex(OUT))
  return { p, ax, ay }
}
export function box(w: number, d: number, h: number, color: string, o: BoxOpts = {}): Sprite {
  const { p, ax, ay } = boxPix(w, d, h, color, o)
  return spr(p, ax, ay)
}

/** Cilindro em pé: raio r (pixels na horizontal) e altura h. Âncora no centro da base. */
export function cylPix(r: number, h: number, color: string, top?: string) {
  const ry = Math.max(2, Math.round(r / 2))
  const W = r * 2 + 3, H = h + ry * 2 + 3
  const p = new Pix(W, H), cx = r + 1.5, cyB = h + ry + 1.5, cyT = ry + 1.5
  const light = hex(lighter(color, 0.15)), mid = hex(color), dark = hex(darker(color, 0.25))
  for (let y = Math.floor(cyT); y <= Math.ceil(cyB + ry); y++) for (let x = 0; x < W; x++) {
    const dx = (x + 0.5 - cx) / r
    if (Math.abs(dx) > 1) continue
    const yb = cyB + Math.sqrt(1 - dx * dx) * ry
    if (y + 0.5 <= yb && y + 0.5 >= cyT) p.px(x, y, dx < -0.35 ? light : dx > 0.45 ? dark : mid)
  }
  p.ellipse(cx, cyT, r, ry, hex(top || lighter(color, 0.3)))
  p.outline(hex(OUT))
  return { p, ax: Math.round(cx), ay: Math.round(cyB) }
}
export function cyl(r: number, h: number, color: string, top?: string): Sprite { const { p, ax, ay } = cylPix(r, h, color, top); return spr(p, ax, ay) }

/** Brilho redondo (quadriculado) para luzes. */
export function glow(r: number, color: string, a = 0.55): Sprite {
  return memo(`glow:${r}:${color}:${a}`, () => {
    const p = new Pix(r * 2 + 1, r + 1)
    const [cr, cg, cb] = [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)]
    for (let y = 0; y <= r; y++) for (let x = 0; x <= r * 2; x++) {
      const dx = (x - r) / r, dy = (y - r / 2) / (r / 2), dd = Math.sqrt(dx * dx + dy * dy)
      if (dd > 1) continue
      const k = Math.round((1 - dd) * 4) / 4 // degraus de pixel art
      if (k <= 0) continue
      p.px(x, y, (((Math.round(255 * k * a)) << 24) | (cb << 16) | (cg << 8) | cr) >>> 0)
    }
    return spr(p, r, Math.round(r / 2))
  })
}
/** Sombra oval sob personagens. */
export function shadow(r: number): Sprite {
  return memo('shadow:' + r, () => { const p = new Pix(r * 2 + 1, r + 1); p.ellipse(r + 0.5, r / 2 + 0.5, r, r / 2, hex('#140c1c', 90)); return spr(p, r, Math.round(r / 2)) })
}
/** Marcador de interação (losango dourado). */
export function markerSprite(color: string): Sprite {
  return memo('mk:' + color, () => {
    const p = new Pix(9, 13)
    p.poly([[4.5, 0], [9, 5], [4.5, 12], [0, 5]], hex(color))
    p.poly([[4.5, 1], [7, 5], [4.5, 5]], hex(lighter(color, 0.5)))
    p.outline(hex(OUT))
    return spr(p, 5, 13)
  })
}
/** Texto do mundo como sprite (âncora no centro de baixo). */
export function label(s: string, color = '#fff3d6', out = OUT): Sprite {
  return memo(`lbl:${s}:${color}:${out}`, () => { const p = textPix(s, color, out); return spr(p, Math.round(p.w / 2), p.h) })
}

/** Placa com várias linhas de texto (pixel), para o chão ou paredes. */
export function signPix(lines: { t: string; c: string }[], bg: string, border: string, pad = 3) {
  const ws = lines.map((l) => textPix(l.t, l.c, ''))
  const W = Math.max(...ws.map((w) => w.w)) + pad * 2 + 2, H = ws.reduce((a, w) => a + w.h - 2, 0) + pad * 2 + 2
  const p = new Pix(W, H)
  p.rect(0, 0, W, H, hex(border)); p.rect(1, 1, W - 2, H - 2, hex(bg))
  let y = pad
  ws.forEach((w) => { p.blit(w, Math.round((W - w.w) / 2), y - 1); y += w.h - 2 })
  return p
}

/**
 * Pintura numa parede vertical (janela, porta, pôster…). axis 'x': a parede corre ao longo de x
 * (desce para a direita na tela); 'y': ao longo de y (desce para a esquerda).
 * fn(u, v): u de 0 a 1 ao longo da parede, v de 0 (chão) a 1 (topo). Âncora no ponto inicial, no chão.
 */
export function wallPix(len: number, H: number, axis: 'x' | 'y', fn: (u: number, v: number, c: number, r: number) => number | null) {
  const Wp = Math.round(len * 16), Hp = Math.ceil(len * 8 + H) + 1
  const p = new Pix(Wp, Hp)
  for (let c = 0; c < Wp; c++) {
    const a = axis === 'x' ? (c + 0.5) / 16 : (Wp - c - 0.5) / 16
    const ground = H + a * 8
    for (let r = 0; r < Hp; r++) {
      const zz = ground - (r + 0.5)
      if (zz < 0 || zz >= H) continue
      const col = fn(a / len, zz / H, c, r)
      if (col != null) p.px(c, r, col)
    }
  }
  return { p, ax: axis === 'x' ? 0 : Wp, ay: H }
}
export function wallDecal(len: number, H: number, axis: 'x' | 'y', fn: (u: number, v: number, c: number, r: number) => number | null, outline = false): Sprite {
  const { p, ax, ay } = wallPix(len, H, axis, fn)
  if (outline) p.outline(hex(OUT))
  return spr(p, ax, ay)
}
/** Pinta um quadro de animação só uma vez por chave. */
export function frames(key: string, n: number, make: (i: number) => Sprite) { return (i: number) => memo(`${key}#${((i % n) + n) % n}`, () => make(((i % n) + n) % n)) }
