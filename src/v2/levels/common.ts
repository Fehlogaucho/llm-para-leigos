import { RT, burst, emoteNex, gesture } from '../engine/runtime'
import { SFX } from '../engine/audio'
import { hash2 } from '../engine/pix'
import { mixc } from '../art/sky'
import type { Ctx } from '../engine/script'
import type { P2 } from '../store'
import { findPath } from '../engine/world'

/** O NEX chega por um portal: aparece pequeno, com faíscas, e volta ao tamanho normal. */
export async function arrive(c: Ctx) {
  RT.nexScale = 0.01
  SFX.play('portal')
  burst(RT.player.x, RT.player.y, 10, 26, ['#bff3ff', '#9fe9ff', '#ffffff', '#c8a8ff'], { spd: 2.2, up: 70, life: 1.1 })
  const t0 = performance.now()
  await c.until(() => {
    const k = (performance.now() - t0) / 1000, e = Math.min(1, k / 0.7)
    RT.nexScale = k < 0.7 ? Math.max(0.01, 1 + 2.2 * Math.pow(e - 1, 3) + 1.2 * Math.pow(e - 1, 2)) : 1
    return k >= 0.7
  })
  RT.nexScale = 1
}

/** Fundo “dentro da máquina”: degradê escuro e colunas de bits caindo devagar. */
export function dataRainBg(top: string, bottom: string, color = '#2a6aa8') {
  let grad: HTMLCanvasElement | null = null
  const cols = Array.from({ length: 60 }, (_, i) => ({ x: hash2(i, 1, 1), sp: 6 + hash2(i, 2, 1) * 14, len: 6 + Math.floor(hash2(i, 3, 1) * 12), off: hash2(i, 4, 1) * 400 }))
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, cam: { x: number; y: number }) => {
    if (!grad || grad.width !== w || grad.height !== h) {
      grad = document.createElement('canvas'); grad.width = w; grad.height = h
      const g = grad.getContext('2d')!, N = 12
      for (let i = 0; i < N; i++) { g.fillStyle = mixc(top, bottom, i / (N - 1)); g.fillRect(0, Math.floor((i * h) / N), w, Math.ceil(h / N) + 1) }
    }
    ctx.drawImage(grad, 0, 0)
    // torres de dados ao longe (colunas escuras com sinais acesos)
    const tx = (cam.x - cam.y) * 16 * 0.03
    for (let i = 0; i < 14; i++) {
      const bw = 10 + Math.floor(hash2(i, 9, 2) * 12), bh = 50 + Math.floor(hash2(i, 8, 2) * 150)
      const x = Math.floor((((i * 61 + hash2(i, 7, 2) * 40 - tx) % (w + 80)) + w + 80) % (w + 80)) - 40, y = h - bh
      ctx.fillStyle = '#0a1228'; ctx.fillRect(x, y, bw, bh)
      ctx.fillStyle = '#16244a'; ctx.fillRect(x, y, 2, bh)
      for (let yy = y + 4; yy < h - 4; yy += 6) for (let xx = x + 3; xx < x + bw - 2; xx += 4) {
        const on = hash2(xx, yy, Math.floor(t * 0.7 + i)) < 0.12
        if (on) { ctx.fillStyle = hash2(xx, yy, 3) < 0.7 ? '#3fb8ff' : '#9a7aff'; ctx.fillRect(xx, yy, 2, 2) }
      }
    }
    const px = (cam.x - cam.y) * 16 * 0.05
    for (const cl of cols) {
      const x = Math.floor((((cl.x * w * 1.3 - px) % w) + w) % w)
      const y0 = ((t * cl.sp + cl.off) % (h + cl.len * 4)) - cl.len * 4
      for (let k = 0; k < cl.len; k++) {
        const y = Math.floor(y0 + k * 4)
        if (y < 0 || y > h) continue
        const on = hash2(Math.floor(cl.x * 999), k + Math.floor(t * 2), 7) < 0.5
        ctx.globalAlpha = (k / cl.len) * 0.55
        ctx.fillStyle = k === cl.len - 1 ? '#bff3ff' : color
        if (on) ctx.fillRect(x, y, 1, 3); else { ctx.fillRect(x - 1, y, 1, 3); ctx.fillRect(x + 1, y, 1, 3); ctx.fillRect(x, y, 1, 1); ctx.fillRect(x, y + 2, 1, 1) }
      }
    }
    ctx.globalAlpha = 1
  }
}

/** Animação simples de um valor (0→1) durante sec segundos, chamando f(k). */
export async function tween(c: Ctx, sec: number, f: (k: number) => void) {
  const t0 = performance.now()
  await c.until(() => { const k = Math.min(1, (performance.now() - t0) / (sec * 1000)); f(k); return k >= 1 })
}

/** O NEX anda sozinho até um ponto (para as cenas); se não chegar a tempo, é colocado lá. */
export async function walkTo(c: Ctx, p: P2, maxSec = 3.5) {
  const sc = RT.scene
  if (sc && Math.hypot(RT.player.x - p[0], RT.player.y - p[1]) > 0.15) {
    const path = findPath(sc, [RT.player.x, RT.player.y], p)
    if (path) {
      RT.frozen = false; RT.path = path; RT.tapUse = null
      const t0 = performance.now()
      await c.until(() => !RT.path || performance.now() - t0 > maxSec * 1000)
    }
  }
  RT.path = null
  RT.player.x = p[0]; RT.player.y = p[1]
}

/** Luzinhas correndo por caminhos (circuitos, cabos, pontes). Para usar em Scene.under. */
export function pulses(paths: P2[][], color: string, speed = 2.2, gap = 2.4) {
  const segs = paths.map((path) => {
    const L: number[] = [0]
    for (let i = 1; i < path.length; i++) L.push(L[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]))
    return { path, L, total: L[L.length - 1] }
  })
  const at = (sg: typeof segs[0], s: number) => {
    let i = 1; while (i < sg.L.length - 1 && sg.L[i] < s) i++
    const a = sg.path[i - 1], b = sg.path[i], k = (s - sg.L[i - 1]) / Math.max(1e-6, sg.L[i] - sg.L[i - 1])
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
  }
  return (ctx: CanvasRenderingContext2D, t: number) => {
    ctx.fillStyle = color
    for (const sg of segs) {
      if (sg.total <= 0) continue
      const n = Math.max(1, Math.floor(sg.total / gap))
      for (let k = 0; k < n; k++) {
        const s0 = (t * speed + k * gap) % sg.total
        for (let tail = 0; tail < 4; tail++) {
          const s = s0 - tail * 0.12
          if (s < 0) continue
          const [x, y] = at(sg, s)
          const sx = Math.round((x - y) * 16), sy = Math.round((x + y) * 8)
          ctx.globalAlpha = 0.9 - tail * 0.22
          ctx.fillRect(sx - (tail ? 0 : 1), sy, tail ? 1 : 2, 1)
        }
      }
    }
    ctx.globalAlpha = 1
  }
}

/** O NEX cai do alto (chegando por um portal), levanta poeira e fica tonto um instante. */
export async function fallIn(c: Ctx, height = 240) {
  RT.nexZ = height; RT.nexScale = 1
  SFX.play('whoosh')
  const t0 = performance.now()
  await c.until(() => {
    const k = Math.min(1, (performance.now() - t0) / 850)
    RT.nexZ = height * (1 - k * k)
    if (Math.random() < 0.7) RT.particles.push({ x: RT.player.x + (Math.random() - 0.5) * 0.3, y: RT.player.y + (Math.random() - 0.5) * 0.3, z: RT.nexZ + 20, vx: 0, vy: 0, vz: 30, life: 0.5, max: 0.5, c: Math.random() < 0.5 ? '#bff3ff' : '#c8a8ff', s: 1, g: 0 })
    return k >= 1
  })
  RT.nexZ = 0
  RT.cam.shake = 0.7
  SFX.play('stone')
  burst(RT.player.x, RT.player.y, 2, 22, ['#8a8aa8', '#b8b8d0', '#6a6a88'], { spd: 2.4, up: 18, life: 0.8, g: 60 })
  gesture('sit', 1.8)
  emoteNex('tonto', 1.8)
  await c.wait(1.8)
}
