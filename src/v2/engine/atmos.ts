import { hash2, hex, rgbOf, type Pix } from './pix'
import { iso, type Scene, type Thing } from './runtime'

/* =========================================================
   Atmosfera de cada fase, desenhada em pixel art:
   - luz: o mundo é multiplicado por uma cor ambiente e cada
     fonte de luz (brilhos, lâmpadas, NEX, NOVA, marcadores)
     clareia em anéis com pontilhado, como em jogos 16 bits;
   - céu em camadas que se movem em paralaxe com a câmera;
   - poeira/vaga-lumes no ar, vinheta e um toque de cor;
   - sombras de contato e manchas suaves no chão (pré-desenhadas).
   ========================================================= */
export type SkyKind = 'arquivo' | 'fabrica' | 'salao' | 'lab'
export interface Atmos {
  /** Cor que multiplica o mundo (sem ela, nada de iluminação). */
  ambient?: string
  /** Força da vinheta nas bordas (0..1). */
  vignette?: number
  /** Céu em camadas com paralaxe. */
  sky?: SkyKind
  /** Partículas no ar. */
  motes?: { color: string; n: number; rise?: number; size?: number; onGround?: boolean }
  /** Um toque de cor por cima de tudo. */
  grade?: { color: string; op: GlobalCompositeOperation; a: number }
  /** Luz própria do NEX (0 = sem). */
  nexLight?: number
  /** Sombras de contato e manchas no chão. */
  ao?: number
}
export interface Lamp { x: number; y: number; z?: number; r: number; color: string; i?: number }

/* ---------- a mancha de luz (anéis pontilhados) ---------- */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16)
const LIGHTS = new Map<string, HTMLCanvasElement>()
export function lightSprite(color: string, size = 64): HTMLCanvasElement {
  const key = color + size
  let c = LIGHTS.get(key)
  if (c) return c
  c = document.createElement('canvas'); c.width = size; c.height = size
  const g = c.getContext('2d')!, img = g.createImageData(size, size)
  const [r, gg, b] = rgbOf(hex(color)), R = size / 2, STEPS = 6
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const d = Math.hypot(x + 0.5 - R, (y + 0.5 - R) * 1.12) / R
    let f = Math.max(0, 1 - d)
    f = f * f * (3 - 2 * f)
    const q = Math.min(STEPS, Math.floor(f * STEPS + BAYER[(y & 3) * 4 + (x & 3)])) / STEPS
    const o = (y * size + x) * 4
    img.data[o] = r * q; img.data[o + 1] = gg * q; img.data[o + 2] = b * q; img.data[o + 3] = 255
  }
  g.putImageData(img, 0, 0)
  LIGHTS.set(key, c)
  return c
}

/* ---------- camada de luz ---------- */
let LM: HTMLCanvasElement | null = null, VIG: HTMLCanvasElement | null = null
const lmCtx = (W: number, H: number) => {
  if (!LM) LM = document.createElement('canvas')
  if (LM.width !== W || LM.height !== H) { LM.width = W; LM.height = H }
  const g = LM.getContext('2d')!
  g.imageSmoothingEnabled = false
  return g
}
export interface LightPass {
  begin: () => void
  lamp: (l: Lamp) => void
  sprite: (img: HTMLCanvasElement, x: number, y: number, w: number, h: number, a?: number) => void
  end: () => void
}
/** Prepara a camada de luz com a mesma transformação do mundo. */
export function lightPass(ctx: CanvasRenderingContext2D, W: number, H: number, zoom: number, ox: number, oy: number, ambient: string): LightPass {
  const g = lmCtx(W, H)
  const bloom: Lamp[] = []
  return {
    begin() {
      g.setTransform(1, 0, 0, 1, 0, 0)
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1
      g.fillStyle = ambient; g.fillRect(0, 0, W, H)
      g.setTransform(zoom, 0, 0, zoom, ox, oy)
      g.globalCompositeOperation = 'lighter'
    },
    lamp(l) {
      const P = iso(l.x, l.y, l.z ?? 0), r = l.r, size = r > 44 ? 128 : r > 20 ? 64 : 32
      g.globalAlpha = Math.max(0, Math.min(1, l.i ?? 0.8))
      g.drawImage(lightSprite(l.color, size), Math.round(P.sx - r), Math.round(P.sy - r * 0.8), Math.round(r * 2), Math.round(r * 1.6))
      if ((l.i ?? 0.8) >= 0.45 && r >= 14) bloom.push(l)
    },
    sprite(img, x, y, w, h, a = 1) { g.globalAlpha = Math.min(1, a); g.drawImage(img, Math.round(x), Math.round(y), Math.round(w), Math.round(h)) },
    end() {
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalCompositeOperation = 'multiply'
      ctx.drawImage(LM!, 0, 0)
      ctx.restore()
      // brilho em volta das luzes (clareia acima da cor original, como uma lâmpada de verdade)
      ctx.save()
      ctx.setTransform(zoom, 0, 0, zoom, ox, oy)
      ctx.globalCompositeOperation = 'lighter'
      for (const l of bloom) {
        const P = iso(l.x, l.y, l.z ?? 0), r = l.r * 0.75
        ctx.globalAlpha = 0.2 * Math.min(1, l.i ?? 0.8)
        ctx.drawImage(lightSprite(l.color, 32), Math.round(P.sx - r), Math.round(P.sy - r * 0.8), Math.round(r * 2), Math.round(r * 1.6))
      }
      ctx.restore()
    },
  }
}

/** Vinheta (bordas um pouco mais escuras). */
export function vignette(ctx: CanvasRenderingContext2D, W: number, H: number, a: number) {
  if (a <= 0) return
  if (!VIG || VIG.width !== W || VIG.height !== H) {
    VIG = VIG || document.createElement('canvas'); VIG.width = W; VIG.height = H
    const g = VIG.getContext('2d')!
    const gr = g.createRadialGradient(W / 2, H * 0.52, Math.min(W, H) * 0.35, W / 2, H * 0.52, Math.hypot(W, H) * 0.62)
    gr.addColorStop(0, 'rgba(4,4,16,0)'); gr.addColorStop(1, 'rgba(4,4,16,0.85)')
    g.fillStyle = gr; g.fillRect(0, 0, W, H)
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.drawImage(VIG, 0, 0); ctx.restore()
}

/* ---------- céu em camadas (paralaxe) ---------- */
const noise = (x: number, y: number, s: number) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
/** Ruído que se repete na horizontal a cada `per` unidades (para o céu dar a volta sem emenda). */
const tnoise = (x: number, y: number, s: number, per: number) => {
  const k = ((x % per) + per) % per / per
  return noise(x, y, s) * (1 - k) + noise(x - per, y, s) * k
}
const fbm = (x: number, y: number, s: number, per: number) => tnoise(x, y, s, per) * 0.55 + tnoise(x * 2, y * 2, s + 7, per * 2) * 0.3 + tnoise(x * 4, y * 4, s + 13, per * 4) * 0.15
interface SkyPal { neb: string[]; far: string; mid: string; lights: string[] }
const PAL: Record<SkyKind, SkyPal> = {
  arquivo: { neb: ['#3a1e6a', '#7a3a9a', '#2a3a8a'], far: '#1a1238', mid: '#251a4c', lights: ['#c8a8ff', '#ffd27a', '#8fe9ff'] },
  fabrica: { neb: ['#0e2a5a', '#1a5a8a', '#3a2a7a'], far: '#081428', mid: '#0e1e3c', lights: ['#3fb8ff', '#9a7aff', '#ffb35a'] },
  salao: { neb: ['#122a5a', '#2a3a8a', '#0e3a5a'], far: '#08122a', mid: '#0e1a38', lights: ['#59d7ff', '#c8a8ff'] },
  lab: { neb: ['#0e3a4a', '#1a6a7a', '#2a3a6a'], far: '#0a1e30', mid: '#10283c', lights: ['#7fe3ff', '#ffffff'] },
}
const SKY = new Map<string, HTMLCanvasElement>()
const SW = 512
function nebula(kind: SkyKind): HTMLCanvasElement {
  const key = 'neb:' + kind
  let c = SKY.get(key); if (c) return c
  const H = 320
  c = document.createElement('canvas'); c.width = SW; c.height = H
  const g = c.getContext('2d')!, img = g.createImageData(SW, H), pal = PAL[kind].neb.map((x) => rgbOf(hex(x)))
  for (let y = 0; y < H; y++) for (let x = 0; x < SW; x++) {
    const n = fbm(x / 64, y / 64, 3, SW / 64), m = fbm(x / 40 + 9, y / 40, 11, SW / 40)
    let a = Math.max(0, n - 0.42) * 2.2
    a = Math.min(1, a) * (0.4 + 0.6 * Math.sin(Math.min(1, y / H) * Math.PI))
    const q = Math.floor(a * 5 + BAYER[(y & 3) * 4 + (x & 3)]) / 5
    if (q <= 0) continue
    const col = m < 0.45 ? pal[0] : m < 0.6 ? pal[1] : pal[2]
    const o = (y * SW + x) * 4
    img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = Math.round(q * 150)
  }
  g.putImageData(img, 0, 0)
  SKY.set(key, c)
  return c
}
interface Blink { x: number; y: number; c: string; ph: number }
/** Silhuetas ao longe (repetem na horizontal) e as luzinhas que piscam nelas. */
function skyline(kind: SkyKind, layer: 0 | 1): { img: HTMLCanvasElement; blinks: Blink[] } {
  const key = `sl:${kind}:${layer}`
  const cached = SKY.get(key) as any
  if (cached) return cached.__d
  const H = layer ? 150 : 190
  const c = document.createElement('canvas'); c.width = SW; c.height = H
  const g = c.getContext('2d')!, P = PAL[kind]
  g.fillStyle = layer ? P.mid : P.far
  const blinks: Blink[] = []
  const seed = layer * 31 + kind.length * 7
  if (kind === 'arquivo') {
    // ilhas flutuando longe, com cristais acesos
    for (let i = 0; i < (layer ? 5 : 8); i++) {
      const cx = ((i + hash2(i, seed, 1) * 0.6) / (layer ? 5 : 8)) * SW, w = (layer ? 50 : 30) + hash2(i, seed, 2) * (layer ? 40 : 30)
      const top = H * (layer ? 0.35 : 0.2) + hash2(i, seed, 3) * H * 0.35, depth = w * (0.7 + hash2(i, seed, 4) * 0.5)
      for (let x = -w / 2; x < w / 2; x++) {
        const u = x / (w / 2), dd = (1 - Math.abs(u) ** 1.5) * depth * (0.8 + hash2(Math.floor(x), seed + i, 5) * 0.2)
        g.fillRect(Math.round(cx + x), Math.round(top), 1, Math.max(1, Math.round(dd)))
        g.fillRect(Math.round(cx + x + SW), Math.round(top), 1, Math.max(1, Math.round(dd)))
        g.fillRect(Math.round(cx + x - SW), Math.round(top), 1, Math.max(1, Math.round(dd)))
      }
      g.fillRect(Math.round(cx - w / 2), Math.round(top - 2), Math.round(w), 2)
      for (let k = 0; k < (layer ? 4 : 2); k++) blinks.push({ x: (cx + (hash2(i, k, seed) - 0.5) * w * 0.8 + SW) % SW, y: top - 2 - Math.floor(hash2(k, i, seed) * 3), c: P.lights[(i + k) % P.lights.length], ph: hash2(i, k, 9) * 6 })
    }
  } else if (kind === 'fabrica' || kind === 'salao') {
    // torres de servidores, chaminés e canos
    let x = 0, i = 0
    while (x < SW) {
      const bw = (layer ? 18 : 10) + Math.floor(hash2(i, seed, 1) * (layer ? 26 : 16)), bh = H * (0.3 + hash2(i, seed, 2) * (layer ? 0.55 : 0.65))
      g.fillRect(x, H - bh, bw, bh)
      if (hash2(i, seed, 3) < 0.35) g.fillRect(x + Math.floor(bw / 3), H - bh - 10, 3, 10)
      if (kind === 'fabrica' && hash2(i, seed, 6) < 0.3) g.fillRect(x, H - bh * 0.55, bw + 14, 3)
      for (let yy = H - bh + 5; yy < H - 4; yy += 7) for (let xx = x + 3; xx < x + bw - 2; xx += 5) if (hash2(xx, yy, seed) < (layer ? 0.18 : 0.1)) blinks.push({ x: xx, y: yy, c: P.lights[Math.floor(hash2(yy, xx, 2) * P.lights.length)], ph: hash2(xx, yy, 5) * 6 })
      x += bw + Math.floor(hash2(i, seed, 4) * (layer ? 12 : 6)); i++
    }
  } else {
    // anéis e esferas de uma estação ao longe
    for (let i = 0; i < (layer ? 3 : 5); i++) {
      const cx = ((i + 0.5) / (layer ? 3 : 5)) * SW + (hash2(i, seed, 1) - 0.5) * 60, cy = H * (0.35 + hash2(i, seed, 2) * 0.35), r = (layer ? 26 : 14) + hash2(i, seed, 3) * 14
      g.beginPath(); g.ellipse(cx, cy, r, r, 0, 0, Math.PI * 2); g.fill()
      g.fillRect(Math.round(cx - r * 2.2), Math.round(cy - 1), Math.round(r * 4.4), 3)
      for (let k = 0; k < 5; k++) blinks.push({ x: cx + Math.cos(k * 1.3) * r * 0.7, y: cy + Math.sin(k * 1.3) * r * 0.5, c: P.lights[k % P.lights.length], ph: k * 1.7 + i })
    }
    g.fillRect(0, H - 14, SW, 14)
  }
  const d = { img: c, blinks }
  ;(c as any).__d = d
  SKY.set(key, c)
  return d
}
const STARS = Array.from({ length: 90 }, (_, i) => ({ x: hash2(i, 1, 77), y: hash2(i, 2, 77) * 0.75, b: hash2(i, 3, 77), ph: hash2(i, 4, 77) * 6 }))
/** Desenha o céu em camadas, por cima do fundo da fase e atrás do mundo. */
export function drawSky(ctx: CanvasRenderingContext2D, kind: SkyKind, W: number, H: number, t: number, camSx: number, camSy: number) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0)
  const wrap = (v: number) => ((v % SW) + SW) % SW
  // estrelas
  for (const s of STARS) {
    const tw = 0.5 + 0.5 * Math.sin(t * (1 + s.b * 2) + s.ph)
    ctx.globalAlpha = 0.25 + 0.6 * tw * s.b
    ctx.fillStyle = s.b > 0.85 ? '#ffffff' : '#bcd0ff'
    ctx.fillRect(Math.floor(wrap(s.x * SW - camSx * 0.01) * (W / SW + 0.001)), Math.floor(s.y * H - camSy * 0.005), 1, 1)
  }
  // nebulosa (clareia o fundo sem esconder a chuva de dados)
  ctx.globalAlpha = 0.9
  ctx.globalCompositeOperation = 'screen'
  const neb = nebula(kind), nx = -wrap(camSx * 0.02 + t * 1.5), ny = Math.round(H * 0.5 - neb.height / 2 - camSy * 0.015)
  for (let x = nx; x < W; x += SW) ctx.drawImage(neb, Math.round(x), ny)
  ctx.globalCompositeOperation = 'source-over'
  // silhuetas (longe e meio); a fábrica e o salão já têm torres no fundo
  if (kind === 'arquivo' || kind === 'lab') for (const layer of [0, 1] as const) {
    const sl = skyline(kind, layer), f = layer ? 0.1 : 0.05
    const sx = -wrap(camSx * f), sy = Math.round(H - sl.img.height + (layer ? 30 : 0) - camSy * f * 0.4)
    ctx.globalAlpha = layer ? 0.7 : 0.5
    for (let x = sx; x < W; x += SW) ctx.drawImage(sl.img, Math.round(x), sy)
    for (const b of sl.blinks) {
      const on = Math.sin(t * 1.6 + b.ph) > 0.2
      if (!on) continue
      ctx.globalAlpha = layer ? 0.9 : 0.6
      ctx.fillStyle = b.c
      for (let x = sx; x < W; x += SW) ctx.fillRect(Math.round(x + b.x), sy + Math.round(b.y), 1, 1)
    }
  }
  ctx.restore()
}

/* ---------- partículas no ar ---------- */
interface Mote { x: number; y: number; z: number; ph: number; sp: number }
let MOTES: Mote[] = [], motesFor: Scene | null = null
export function drawMotes(ctx: CanvasRenderingContext2D, sc: Scene, cfg: NonNullable<Atmos['motes']>, cam: { x: number; y: number }, t: number, dt: number, view: { vx0: number; vy0: number; vx1: number; vy1: number }) {
  const R = 11
  const spawn = (m: Mote, anywhere: boolean) => {
    // em lugares fechados (o quarto), a poeira nasce só em cima do chão
    for (let k = 0; k < 6; k++) { m.x = cam.x + (Math.random() - 0.5) * R * 2; m.y = cam.y + (Math.random() - 0.5) * R * 2; if (!cfg.onGround || sc.ground(Math.floor(m.x), Math.floor(m.y))) break }
    m.z = anywhere ? Math.random() * 60 : 0; m.ph = Math.random() * 6; m.sp = 0.6 + Math.random()
  }
  if (motesFor !== sc || MOTES.length !== cfg.n) { motesFor = sc; MOTES = Array.from({ length: cfg.n }, () => { const m = { x: 0, y: 0, z: 0, ph: 0, sp: 0 }; spawn(m, true); return m }) }
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = cfg.color
  const s = cfg.size ?? 1
  for (const m of MOTES) {
    m.x += Math.sin(t * 0.5 * m.sp + m.ph) * dt * 0.25
    m.y += Math.cos(t * 0.4 * m.sp + m.ph) * dt * 0.25
    m.z += (cfg.rise ?? 4) * m.sp * dt
    if (m.z > 70 || Math.abs(m.x - cam.x) > R || Math.abs(m.y - cam.y) > R) spawn(m, false)
    if (cfg.onGround && !sc.ground(Math.floor(m.x), Math.floor(m.y))) continue
    const P = iso(m.x, m.y, m.z)
    if (P.sx < view.vx0 || P.sx > view.vx1 || P.sy < view.vy0 || P.sy > view.vy1) continue
    const tw = 0.5 + 0.5 * Math.sin(t * 2.4 * m.sp + m.ph)
    ctx.globalAlpha = (0.25 + 0.6 * tw) * Math.min(1, (70 - m.z) / 20)
    ctx.fillRect(Math.round(P.sx), Math.round(P.sy), s, s)
  }
  ctx.restore()
}

/* ---------- chão: sombras de contato e manchas suaves (pré-desenhado) ---------- */
/** Escurece o chão perto de objetos sólidos e varia um pouco o tom por regiões. */
export function shadeGround(p: Pix, sc: Scene, cx: number, cy: number, CH: number, ox: number, oy: number, strength: number) {
  // objetos sólidos parados perto deste pedaço
  const near: Thing[] = []
  for (const t of sc.things) {
    if (!t.solid || t.pos || t.layer === 'ground' || t.hidden) continue
    const w = t.w ?? 0, d = t.d ?? 0
    if (w <= 0 || d <= 0) continue
    if (t.x + w < cx - 1 || t.x > cx + CH + 1 || t.y + d < cy - 1 || t.y > cy + CH + 1) continue
    near.push(t)
  }
  for (let y = cy; y < Math.min(sc.h, cy + CH); y++) for (let x = cx; x < Math.min(sc.w, cx + CH); x++) {
    if (!sc.ground(x, y)) continue
    const s = iso(x, y), tx = s.sx - ox, ty = s.sy - oy
    const ts = near.filter((t) => t.x - 1 <= x + 1 && t.x + (t.w ?? 0) + 1 >= x && t.y - 1 <= y + 1 && t.y + (t.d ?? 0) + 1 >= y)
    for (let py = 0; py < 16; py++) for (let px = 0; px < 32; px++) {
      if (Math.abs(px + 0.5 - 16) / 16 + Math.abs(py + 0.5 - 8) / 8 > 1) continue
      const X = px + 0.5 - 16, Y = py + 0.5
      const wx = x + (X / 16 + Y / 8) / 2, wy = y + (Y / 8 - X / 16) / 2
      let k = 1
      // manchas grandes e suaves (o chão deixa de ser liso demais)
      const n = noise(wx / 5, wy / 5, 91)
      k *= 0.93 + n * 0.12
      // sombra de contato: perto da base dos objetos (mais para a frente da luz, que vem de cima à esquerda)
      for (const t of ts) {
        const x0 = t.x, x1 = t.x + (t.w ?? 0), y0 = t.y, y1 = t.y + (t.d ?? 0)
        const dx = Math.max(x0 - wx, 0, wx - x1), dy = Math.max(y0 - wy, 0, wy - y1)
        const front = wx > x1 - 0.01 || wy > y1 - 0.01 ? 1 : 0.55
        const dist = Math.hypot(dx, dy)
        if (dist < 0.6) k *= 1 - strength * 0.42 * front * (1 - dist / 0.6) ** 1.3
      }
      if (Math.abs(k - 1) < 0.02) continue
      const X0 = tx - 16 + px, Y0 = ty + py, c = p.get(X0, Y0)
      if (!(c >>> 24)) continue
      const q = Math.round(k * 32) / 32 // em degraus (pixel art)
      const r = Math.min(255, (c & 255) * q), g = Math.min(255, ((c >>> 8) & 255) * q), b = Math.min(255, ((c >>> 16) & 255) * q)
      p.px(X0, Y0, ((c >>> 24) << 24 | (b << 16) | (g << 8) | r) >>> 0)
    }
  }
}
