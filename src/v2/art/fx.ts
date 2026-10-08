import { Pix, hex, hash2, darker, lighter, mix } from '../engine/pix'
import { OUT, memo, spr, cylPix } from './core'
import type { Sprite } from '../engine/runtime'

/* =========================================================
   Efeitos e peças mágicas: portal, nuvem de névoa, cristal,
   anel de portal no céu.
   ========================================================= */

/** Portal oval em pé (de frente para a câmera), com redemoinho animado. */
export function portalSprite(frame: number, color = '#7fe3ff', s = 1): Sprite {
  const f = frame % 8
  return memo(`portal:${f}:${color}:${s}`, () => {
    const W = Math.round(30 * s), H = Math.round(46 * s)
    const p = new Pix(W + 4, H + 6)
    const cx = (W + 4) / 2, cy = H / 2 + 2, rx = W / 2, ry = H / 2
    const c1 = hex(color), c2 = hex(lighter(color, 0.5)), c3 = hex(mix(color, '#7a4aff', 0.5)), dark = hex(mix(color, '#0a0a2a', 0.6))
    for (let y = 0; y < H + 6; y++) for (let x = 0; x < W + 4; x++) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry, r = Math.hypot(u, v)
      if (r > 1) continue
      if (r > 0.86) { p.px(x, y, (Math.floor((Math.atan2(v, u) * 8) / Math.PI + f) % 2) ? c2 : c1); continue }
      const a = Math.atan2(v, u), sw = Math.sin(a * 3 + r * 10 - f * 0.8)
      p.px(x, y, r < 0.18 ? hex('#ffffff') : sw > 0.4 ? c2 : sw > -0.2 ? c1 : r < 0.6 ? c3 : dark)
    }
    // base de pedra
    const base = cylPix(Math.round(rx * 0.9), 4, '#3a3a5a', '#5a5a7a')
    p.blit(base.p, Math.round(cx - base.ax), H + 5 - base.ay)
    p.outline(hex(OUT))
    return spr(p, Math.round(cx), H + 5)
  })
}

/** Nuvem de névoa (pixels com transparência em degraus). */
export function cloudPuff(seed: number, color = '#b8a8f0', w = 54, h = 30): Sprite {
  return memo(`puff:${seed}:${color}:${w}:${h}`, () => {
    const p = new Pix(w, h)
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16))
    const blobs = Array.from({ length: 6 }, (_, i) => ({ x: w * (0.2 + hash2(i, seed, 1) * 0.6), y: h * (0.35 + hash2(i, seed, 2) * 0.35), r: Math.min(w, h * 2) * (0.18 + hash2(i, seed, 3) * 0.16) }))
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let d = 0
      for (const bl of blobs) { const dx = (x - bl.x) / bl.r, dy = ((y - bl.y) * 1.7) / bl.r; d = Math.max(d, 1 - Math.hypot(dx, dy)) }
      if (d <= 0) continue
      const a = d > 0.55 ? 200 : d > 0.3 ? 150 : d > 0.12 ? 90 : 40
      const sh = y > h * 0.6 ? 0.82 : y < h * 0.35 ? 1.08 : 1
      p.px(x, y, ((a << 24) | (Math.min(255, b * sh) << 16) | (Math.min(255, g * sh) << 8) | Math.min(255, r * sh)) >>> 0)
    }
    return spr(p, Math.round(w / 2), h - 4)
  })
}

/** Cristal flutuante (octaedro em pixel). */
export function crystal(color: string, s = 1): Sprite {
  return memo(`cry:${color}:${s}`, () => {
    const W = Math.round(10 * s), H = Math.round(18 * s)
    const p = new Pix(W + 2, H + 2)
    const cx = (W + 2) / 2, top = 1, mid = H * 0.45 + 1, bot = H + 1
    p.poly([[cx, top], [cx + W / 2, mid], [cx, bot], [cx - W / 2, mid]], hex(color))
    p.poly([[cx, top], [cx, bot], [cx - W / 2, mid]], hex(lighter(color, 0.35)))
    p.poly([[cx, mid], [cx + W / 2, mid], [cx, bot]], hex(darker(color, 0.3)))
    p.px(Math.round(cx - 2), Math.round(mid - 3), hex('#ffffff'))
    p.outline(hex(OUT))
    return spr(p, Math.round(cx), H + 1)
  })
}

/** Anel hexagonal (portais no céu, para onde as peças da memória fugiram). */
export function ringSprite(color: string, frame: number): Sprite {
  const f = frame % 6
  return memo(`ring:${color}:${f}`, () => {
    const R = 16, p = new Pix(R * 2 + 3, R * 2 + 3)
    const c = R + 1.5
    const pts = (r: number, rot: number) => Array.from({ length: 6 }, (_, i) => { const a = rot + (i * Math.PI) / 3; return [c + Math.cos(a) * r, c + Math.sin(a) * r * 0.9] })
    const rot = (f / 6) * (Math.PI / 3)
    p.poly(pts(R, rot), hex(color))
    p.poly(pts(R - 4, rot), hex(mix(color, '#0a0a2a', 0.55)))
    p.poly(pts(R - 7, rot), hex(lighter(color, 0.4)))
    p.ellipse(c, c, 3, 3, hex('#ffffff'))
    p.outline(hex(OUT))
    return spr(p, Math.round(c), Math.round(c))
  })
}

/** Cérebro em holograma (o “pensamento” da Language Engine). Para desenhar com brilho somado. */
export function brainSprite(frame: number, color = '#3fc4ff'): Sprite {
  const f = frame % 8
  return memo(`brain:${color}:${f}`, () => {
    const W = 44, H = 34, p = new Pix(W, H)
    const c = hex(color), cl = hex(lighter(color, 0.55)), cd = hex(mix(color, '#0a1030', 0.55))
    const inBrain = (x: number, y: number) => {
      const u = (x + 0.5 - 22) / 19, v = (y + 0.5 - 14) / 11.5
      const lobe = u * u + v * v <= 1
      const cere = ((x + 0.5 - 30) / 7) ** 2 + ((y + 0.5 - 24) / 4.5) ** 2 <= 1 // cerebelo
      return lobe || cere
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!inBrain(x, y)) continue
      const edge = !inBrain(x - 1, y) || !inBrain(x + 1, y) || !inBrain(x, y - 1) || !inBrain(x, y + 1)
      // dobras: curvas senoidais
      const fold = Math.abs(Math.sin(x * 0.42 + Math.sin(y * 0.6) * 1.6) * 3 - (y % 7) + 3) < 0.7 && y < 24
      const split = Math.abs(y - (14 + Math.sin(x * 0.3) * 1.5)) < 0.6 && x > 6 && x < 34
      const pulse = (x + y * 2 + f * 5) % 23 === 0
      p.px(x, y, ((edge || pulse) ? cl : fold || split ? c : cd) & (edge ? 0xffffffff : 0xb0ffffff))
    }
    // tronco
    p.rect(19, 25, 4, 8, cd); p.rect(20, 25, 1, 8, c)
    return spr(p, 22, H - 1)
  })
}
