import { Pix, hex, hash2, darker, lighter, rnd } from '../engine/pix'
import { OUT, memo, spr } from './core'
import type { Sprite } from '../engine/runtime'

/* =========================================================
   Céus de fundo: degradê, estrelas que piscam, ilhas flutuando
   longe e nuvens em faixas (com paralaxe leve da câmera).
   ========================================================= */
export interface SkyOpts { top: string; mid: string; bottom: string; stars?: number; islands?: number; cloud?: string; seed?: number; city?: boolean }

function island(seed: number): Sprite {
  return memo('isl:' + seed, () => {
    const R = rnd(seed), w = 26 + Math.floor(R() * 30), h = Math.floor(w * 0.9)
    const p = new Pix(w + 2, h + 2)
    const top = Math.floor(h * 0.28)
    // rocha (cone irregular)
    for (let x = 1; x <= w; x++) {
      const u = (x - w / 2) / (w / 2)
      const depth = Math.floor((1 - Math.abs(u) ** 1.4) * (h - top) * (0.75 + hash2(x, seed, 1) * 0.25))
      for (let y = top; y < top + depth; y++) p.px(x, y, hex(y - top < 3 ? '#6a5a8a' : (Math.floor((y + x * 0.3) / 4) % 2 ? '#3a2e58' : '#46386a')))
    }
    p.ellipse(w / 2 + 1, top, w / 2, top * 0.75, hex('#5aa86a'))
    p.ellipse(w / 2 - 2, top - 1, w / 3, top * 0.45, hex('#7ac87a'))
    if (R() < 0.6) { const tx = Math.floor(w * (0.3 + R() * 0.4)); p.rect(tx, top - 8, 2, 7, hex('#5a3a2a')); p.ellipse(tx + 1, top - 9, 4, 3.5, hex('#3a8a5a')) }
    p.outline(hex(OUT))
    return spr(p, Math.round(w / 2), top)
  })
}
function cloudBand(color: string, w: number, seed: number) {
  return memo(`cb:${color}:${w}:${seed}`, () => {
    const p = new Pix(w, 40)
    for (let x = 0; x < w; x++) {
      const hgt = 14 + Math.sin(x * 0.05 + seed) * 6 + Math.sin(x * 0.13 + seed * 2) * 4 + hash2(Math.floor(x / 6), seed, 2) * 4
      for (let y = Math.floor(40 - hgt); y < 40; y++) p.px(x, y, hex(y < 40 - hgt + 2 ? lighter(color, 0.2) : color))
    }
    return p.canvas()
  })
}

export function skyBg(o: SkyOpts) {
  let grad: HTMLCanvasElement | null = null
  const R = rnd(o.seed ?? 7)
  const stars = Array.from({ length: o.stars ?? 90 }, () => ({ x: R(), y: R() * 0.75, b: R(), s: R() < 0.12 ? 2 : 1 }))
  const isl = Array.from({ length: o.islands ?? 5 }, (_, i) => ({ x: R(), y: 0.25 + R() * 0.5, seed: (o.seed ?? 7) * 10 + i, p: 0.08 + R() * 0.12, bob: R() * 6 }))
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, cam: { x: number; y: number }) => {
    if (!grad || grad.width !== w || grad.height !== h) {
      grad = document.createElement('canvas'); grad.width = w; grad.height = h
      const g = grad.getContext('2d')!
      // degradê em faixas (pixel art: poucos tons)
      const N = 14
      for (let i = 0; i < N; i++) {
        const k = i / (N - 1)
        const c = k < 0.6 ? mixc(o.top, o.mid, k / 0.6) : mixc(o.mid, o.bottom, (k - 0.6) / 0.4)
        g.fillStyle = c; g.fillRect(0, Math.floor((i * h) / N), w, Math.ceil(h / N) + 1)
      }
    }
    ctx.drawImage(grad, 0, 0)
    const px = (cam.x - cam.y) * 16, py = (cam.x + cam.y) * 8
    for (const s of stars) {
      const tw = Math.sin(t * (1 + s.b * 2) + s.b * 40)
      if (tw < -0.6) continue
      const x = Math.floor((((s.x * w * 2 - px * 0.03) % w) + w) % w), y = Math.floor(s.y * h - py * 0.02)
      ctx.fillStyle = tw > 0.7 ? '#ffffff' : s.b > 0.5 ? '#d8d0ff' : '#9a90d8'
      ctx.fillRect(x, y, s.s, s.s)
    }
    if (o.city) {
      // cidade de números ao longe
      const base = Math.floor(h * 0.62)
      for (let i = 0; i < 18; i++) {
        const bw = 8 + Math.floor(hash2(i, 1, 3) * 10), bh = 18 + Math.floor(hash2(i, 2, 3) * 50)
        const x = Math.floor(w * 0.15 + i * (w * 0.7) / 18 - px * 0.04)
        ctx.fillStyle = '#1a1840'; ctx.fillRect(x, base - bh, bw, bh)
        for (let yy = base - bh + 3; yy < base - 2; yy += 4) for (let xx = x + 2; xx < x + bw - 2; xx += 3) if (hash2(xx, yy, 7) < 0.35) { ctx.fillStyle = hash2(xx, yy, 9) < 0.5 ? '#59d7ff' : '#ffd27a'; ctx.fillRect(xx, yy, 1, 2) }
      }
    }
    for (const s of isl) {
      const sp = island(s.seed)
      const x = Math.floor((((s.x * w * 1.6 - px * s.p) % (w * 1.6)) + w * 1.6) % (w * 1.6) - w * 0.3)
      const y = Math.floor(s.y * h - py * s.p * 0.6 + Math.sin(t * 0.5 + s.bob) * 2)
      ctx.drawImage(sp.img, x - sp.ax, y - sp.ay)
    }
    if (o.cloud) {
      const cw = 512
      for (let layer = 0; layer < 2; layer++) {
        const img = cloudBand(layer ? darker(o.cloud, 0.25) : o.cloud, cw, layer + 3)
        const par = layer ? 0.18 : 0.1
        const off = ((((-px * par + t * (layer ? 3 : 1.5)) % cw) + cw) % cw)
        const y = Math.floor(h - 34 - layer * 6 - py * par * 0.3)
        for (let x = -off; x < w; x += cw) ctx.drawImage(img, Math.floor(x), y)
        ctx.fillStyle = layer ? darker(o.cloud, 0.25) : o.cloud
        ctx.fillRect(0, y + 40, w, h)
      }
    }
  }
}

export function mixc(a: string, b: string, k: number) {
  const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('')
}
