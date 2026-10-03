import * as THREE from 'three'

/* Texturas procedurais (canvas): pedra, rocha, madeira, grama, tecido. Sem arquivos. */

const cache = new Map<string, any>()
const SIZE = () => (matchMedia('(pointer: coarse)').matches ? 512 : 1024)

function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 } }

// ruído de valor 2D com repetição (tileable)
function makeNoise(seed: number, period: number) {
  const r = rng(seed)
  const g = new Float32Array(period * period).map(() => r())
  const at = (x: number, y: number) => g[((y % period + period) % period) * period + ((x % period + period) % period)]
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
  }
}
function fbm(n: (x: number, y: number) => number, x: number, y: number, oct = 4) {
  let s = 0, a = 0.5, f = 1, t = 0
  for (let i = 0; i < oct; i++) { s += a * n(x * f, y * f); t += a; a *= 0.5; f *= 2 }
  return s / t
}

function heightToNormal(h: Float32Array, W: number, strength: number) {
  const cv = document.createElement('canvas'); cv.width = cv.height = W
  const ctx = cv.getContext('2d')!
  const img = ctx.createImageData(W, W)
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const l = h[y * W + ((x - 1 + W) % W)], r = h[y * W + ((x + 1) % W)], u = h[((y - 1 + W) % W) * W + x], d = h[((y + 1) % W) * W + x]
    let nx = (l - r) * strength, ny = (u - d) * strength, nz = 1
    const len = Math.hypot(nx, ny, nz); nx /= len; ny /= len; nz /= len
    const i = (y * W + x) * 4
    img.data[i] = (nx * 0.5 + 0.5) * 255; img.data[i + 1] = (ny * 0.5 + 0.5) * 255; img.data[i + 2] = (nz * 0.5 + 0.5) * 255; img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return cv
}

function tex(cv: HTMLCanvasElement, srgb = true, rep = 1) {
  const t = new THREE.CanvasTexture(cv)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rep, rep)
  t.anisotropy = 8
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  return t
}

type RGB = [number, number, number]
const hex = (h: string): RGB => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

/** Lajotas grandes de pedra clara (piso). */
export function stoneTiles(key = 'tiles', base = '#e6cfa6', dark = '#b0946c', tiles = 4) {
  if (cache.has(key)) return cache.get(key)
  const W = SIZE(), cv = document.createElement('canvas'); cv.width = cv.height = W
  const ctx = cv.getContext('2d')!, img = ctx.createImageData(W, W), h = new Float32Array(W * W)
  const n1 = makeNoise(7, 16), n2 = makeNoise(13, 64), r = rng(99)
  const tint: number[] = []; for (let i = 0; i < tiles * tiles * 4; i++) tint.push(r())
  const B = hex(base), D = hex(dark)
  const cell = W / tiles
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    // fileiras alternadas
    const row = Math.floor(y / cell)
    const ox = (row % 2) * cell * 0.5
    const cx = ((x + ox) % W) / cell, cy = y / cell
    const ix = Math.floor(cx), iy = Math.floor(cy)
    const fx = cx - ix, fy = cy - iy
    const edge = Math.min(fx, fy, 1 - fx, 1 - fy)
    const grout = edge < 0.014 ? 0 : Math.min(1, (edge - 0.014) * 22)
    const nn = fbm(n1, x / W * 16, y / W * 16, 4), fine = n2(x / W * 64, y / W * 64)
    const t = tint[(iy * tiles + ix) % tint.length]
    let c = mix(B, D, 0.15 + t * 0.35 + (nn - 0.5) * 0.5 + (fine - 0.5) * 0.15)
    const wear = Math.max(0, 0.06 - edge) * 6
    c = mix(c, D, wear * 0.6)
    c = mix([128, 106, 80], c, grout)
    const i = (y * W + x) * 4
    img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255
    h[y * W + x] = grout * 0.8 + nn * 0.3 + fine * 0.08
  }
  ctx.putImageData(img, 0, 0)
  const res = { map: tex(cv), normalMap: tex(heightToNormal(h, W, 4), false) }
  cache.set(key, res)
  return res
}

/** Blocos de alvenaria (paredes). */
export function stoneBlocks(key = 'blocks', base = '#e4cca2', dark = '#a88a62') {
  if (cache.has(key)) return cache.get(key)
  const W = SIZE(), cv = document.createElement('canvas'); cv.width = cv.height = W
  const ctx = cv.getContext('2d')!, img = ctx.createImageData(W, W), h = new Float32Array(W * W)
  const n1 = makeNoise(21, 16), n2 = makeNoise(5, 64), r = rng(3)
  const rows = 4, cols = 2
  const tint: number[] = []; for (let i = 0; i < 64; i++) tint.push(r())
  const B = hex(base), D = hex(dark)
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const ry = y / W * rows, row = Math.floor(ry), fy = ry - row
    const rx = (x / W * cols + (row % 2) * 0.5), col = Math.floor(rx), fx = rx - col
    const edge = Math.min(fx * 2.2, fy, 1 - fx * 1, 1 - fy, (1 - fx) * 2.2)
    const grout = edge < 0.022 ? 0 : Math.min(1, (edge - 0.022) * 16)
    const nn = fbm(n1, x / W * 16, y / W * 16, 4), fine = n2(x / W * 64, y / W * 64)
    const t = tint[(row * 7 + col) % 64]
    let c = mix(B, D, 0.1 + t * 0.4 + (nn - 0.5) * 0.55 + (fine - 0.5) * 0.12)
    c = mix([140, 116, 86], c, grout)
    const i = (y * W + x) * 4
    img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255
    h[y * W + x] = grout * 0.9 + nn * 0.25
  }
  ctx.putImageData(img, 0, 0)
  const res = { map: tex(cv), normalMap: tex(heightToNormal(h, W, 3.5), false) }
  cache.set(key, res)
  return res
}

/** Rocha de penhasco com estratos. */
export function rockTex(key = 'rock', base = '#8a7462', dark = '#4c3c32') {
  if (cache.has(key)) return cache.get(key)
  const W = SIZE() / 2, cv = document.createElement('canvas'); cv.width = cv.height = W
  const ctx = cv.getContext('2d')!, img = ctx.createImageData(W, W), h = new Float32Array(W * W)
  const n1 = makeNoise(31, 8), n2 = makeNoise(17, 32)
  const B = hex(base), D = hex(dark)
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const nn = fbm(n1, x / W * 8, y / W * 8, 5)
    const strata = Math.sin((y / W * 22 + nn * 6) * Math.PI) * 0.5 + 0.5
    const f = n2(x / W * 32, y / W * 32)
    const c = mix(B, D, nn * 0.7 + strata * 0.25 + (f - 0.5) * 0.2)
    const i = (y * W + x) * 4
    img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255
    h[y * W + x] = nn * 0.8 + strata * 0.3 + f * 0.1
  }
  ctx.putImageData(img, 0, 0)
  const res = { map: tex(cv), normalMap: tex(heightToNormal(h, W, 6), false) }
  cache.set(key, res)
  return res
}

export function grassTex(key = 'grass', base = '#6f8f3e', dark = '#3f5a26') {
  if (cache.has(key)) return cache.get(key)
  const W = SIZE() / 2, cv = document.createElement('canvas'); cv.width = cv.height = W
  const ctx = cv.getContext('2d')!, img = ctx.createImageData(W, W)
  const n1 = makeNoise(41, 8), n2 = makeNoise(9, 64)
  const B = hex(base), D = hex(dark), Y: RGB = [176, 168, 82]
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const nn = fbm(n1, x / W * 8, y / W * 8, 4), f = n2(x / W * 64, y / W * 64)
    let c = mix(B, D, nn * 0.8 + (f - 0.5) * 0.4)
    if (nn > 0.62) c = mix(c, Y, (nn - 0.62) * 1.6)
    const i = (y * W + x) * 4
    img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  const res = { map: tex(cv) }
  cache.set(key, res)
  return res
}

export function woodTex(key = 'wood', base = '#8a5a34', dark = '#4e2f18') {
  if (cache.has(key)) return cache.get(key)
  const W = 256, cv = document.createElement('canvas'); cv.width = cv.height = W
  const ctx = cv.getContext('2d')!, img = ctx.createImageData(W, W)
  const n1 = makeNoise(51, 8)
  const B = hex(base), D = hex(dark)
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const nn = fbm(n1, x / W * 2, y / W * 16, 3)
    const ring = Math.sin((x / W * 30 + nn * 8)) * 0.5 + 0.5
    const c = mix(B, D, ring * 0.45 + nn * 0.3)
    const i = (y * W + x) * 4
    img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  const res = { map: tex(cv) }
  cache.set(key, res)
  return res
}

/** Estandarte azul com borda dourada e um emblema. */
export function bannerTex(emblem: 'sun' | 'compass' | 'star' | 'eye' = 'compass', color = '#1d2c66') {
  const key = 'banner-' + emblem + color
  if (cache.has(key)) return cache.get(key)
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 512
  const c = cv.getContext('2d')!
  const g = c.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, color); g.addColorStop(1, '#0f1738')
  c.fillStyle = g; c.fillRect(0, 0, 256, 512)
  c.strokeStyle = '#d9a648'; c.lineWidth = 10; c.strokeRect(14, 10, 228, 440)
  c.lineWidth = 3; c.strokeRect(28, 24, 200, 412)
  // ponta
  c.fillStyle = '#d9a648'
  c.save(); c.translate(128, 210); c.strokeStyle = '#e8bd62'; c.fillStyle = '#e8bd62'; c.lineWidth = 6
  if (emblem === 'compass' || emblem === 'star') {
    c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = i % 2 ? 26 : 74; c.lineTo(Math.sin(a) * r, -Math.cos(a) * r) } c.closePath(); c.fill()
    c.beginPath(); c.arc(0, 0, 52, 0, Math.PI * 2); c.stroke()
    c.fillStyle = color; c.beginPath(); c.arc(0, 0, 12, 0, Math.PI * 2); c.fill()
  } else if (emblem === 'sun') {
    c.beginPath(); c.arc(0, 0, 34, 0, Math.PI * 2); c.fill()
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; c.beginPath(); c.moveTo(Math.sin(a) * 44, Math.cos(a) * 44); c.lineTo(Math.sin(a) * (i % 2 ? 62 : 76), Math.cos(a) * (i % 2 ? 62 : 76)); c.stroke() }
  } else {
    c.beginPath(); c.ellipse(0, 0, 70, 36, 0, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(0, 0, 20, 0, Math.PI * 2); c.fill()
  }
  c.restore()
  c.fillStyle = '#d9a648'
  for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(60 + i * 34, 360, 5, 0, Math.PI * 2); c.fill() }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  cache.set(key, t)
  return t
}

/** Mostrador do relógio de sol: marcas das horas gravadas na pedra. */
export function dialTex() {
  if (cache.has('dial')) return cache.get('dial')
  const W = 1024, cv = document.createElement('canvas'); cv.width = cv.height = W
  const c = cv.getContext('2d')!
  const base = stoneTiles('marbleDial', '#e3d6bd', '#a89272', 1).map.image as HTMLCanvasElement
  c.drawImage(base, 0, 0, W, W)
  c.translate(W / 2, W / 2)
  c.strokeStyle = '#6b5434'; c.lineWidth = 10
  c.beginPath(); c.arc(0, 0, W * 0.46, 0, Math.PI * 2); c.stroke()
  c.lineWidth = 4; c.beginPath(); c.arc(0, 0, W * 0.40, 0, Math.PI * 2); c.stroke()
  c.font = 'bold 54px Cinzel, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#5a4428'
  const romans = ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'I', 'II', 'III', 'IV', 'V', 'VI']
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI // 6h a 18h, metade norte
    const x = Math.cos(a), y = Math.sin(a)
    c.lineWidth = 6; c.beginPath(); c.moveTo(x * W * 0.40, y * W * 0.40); c.lineTo(x * W * 0.46, y * W * 0.46); c.stroke()
    c.save(); c.translate(x * W * 0.33, y * W * 0.33); c.rotate(a + Math.PI / 2); c.fillText(romans[i], 0, 0); c.restore()
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
  cache.set('dial', t)
  return t
}

/** Globo celeste: azul profundo com estrelas e linhas douradas de constelações. */
export function celestialTex() {
  if (cache.has('celestial')) return cache.get('celestial')
  const W = 1024, H = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const c = cv.getContext('2d')!
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d1b4a'); g.addColorStop(0.5, '#173273'); g.addColorStop(1, '#0d1b4a')
  c.fillStyle = g; c.fillRect(0, 0, W, H)
  const r = rng(77)
  c.strokeStyle = 'rgba(217,166,72,.45)'; c.lineWidth = 1.5
  for (let i = 1; i < 12; i++) { c.beginPath(); c.moveTo(i * W / 12, 0); c.lineTo(i * W / 12, H); c.stroke() }
  for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(0, i * H / 6); c.lineTo(W, i * H / 6); c.stroke() }
  for (let k = 0; k < 14; k++) {
    const cx = r() * W, cy = 60 + r() * (H - 120), n = 4 + Math.floor(r() * 4)
    const pts: [number, number][] = []
    for (let i = 0; i < n; i++) pts.push([cx + (r() - 0.5) * 140, cy + (r() - 0.5) * 90])
    c.strokeStyle = 'rgba(240,200,110,.85)'; c.lineWidth = 2.5; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke()
    pts.forEach(([x, y]) => { c.fillStyle = '#fff3c9'; c.beginPath(); c.arc(x, y, 4 + r() * 3, 0, Math.PI * 2); c.fill() })
  }
  for (let i = 0; i < 600; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`; c.fillRect(r() * W, r() * H, 1.5, 1.5) }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
  cache.set('celestial', t)
  return t
}

/** Capas de livros variadas (para estantes). */
export function booksTex() {
  if (cache.has('books')) return cache.get('books')
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256
  const c = cv.getContext('2d')!
  c.fillStyle = '#2a1a10'; c.fillRect(0, 0, 512, 256)
  const r = rng(11), cols = ['#7a2a22', '#24456e', '#2f5a34', '#6b4a1e', '#5a2d5c', '#8a6a2a', '#3d2a1c', '#1f3a4a']
  let x = 0
  while (x < 512) {
    const w = 10 + r() * 16, h = 170 + r() * 80
    c.fillStyle = cols[Math.floor(r() * cols.length)]; c.fillRect(x, 256 - h, w - 1.5, h)
    c.fillStyle = 'rgba(232,189,98,.8)'; c.fillRect(x + 2, 256 - h + 14, w - 5.5, 3); c.fillRect(x + 2, 256 - 26, w - 5.5, 3)
    x += w
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping
  cache.set('books', t)
  return t
}

/** Textura macia redonda (para nuvens, brilhos, partículas). */
export function softDot(key = 'dot', inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  if (cache.has(key)) return cache.get(key)
  const cv = document.createElement('canvas'); cv.width = cv.height = 128
  const c = cv.getContext('2d')!
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, inner); g.addColorStop(1, outer)
  c.fillStyle = g; c.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(cv)
  cache.set(key, t)
  return t
}

/** Nuvem fofa (manchas de ruído). */
export function cloudTex() {
  if (cache.has('cloud')) return cache.get('cloud')
  const W = 256, cv = document.createElement('canvas'); cv.width = cv.height = W
  const c = cv.getContext('2d')!, img = c.createImageData(W, W)
  const n = makeNoise(61, 8)
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const dx = x / W - 0.5, dy = y / W - 0.5, d = Math.sqrt(dx * dx + dy * dy * 1.6) * 2
    const nn = fbm(n, x / W * 6, y / W * 6, 5)
    const a = Math.max(0, Math.min(1, (1 - d) * 1.6 - 0.25 + (nn - 0.5) * 1.2))
    const i = (y * W + x) * 4
    const sh = 200 + nn * 55 - dy * 60
    img.data[i] = sh; img.data[i + 1] = sh; img.data[i + 2] = sh + 8; img.data[i + 3] = a * 255
  }
  c.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace
  cache.set('cloud', t)
  return t
}
