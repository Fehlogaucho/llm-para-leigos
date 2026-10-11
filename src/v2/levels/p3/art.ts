import { Pix, hex, darker, lighter } from '../../engine/pix'
import { box, boxPix, cylPix, memo, spr, signPix, OUT } from '../../art/core'

/* =========================================================
   Peças do Laboratório (Fase 3): a cápsula e a LLM bebê,
   as máquinas de cada estação e o palco da formatura.
   ========================================================= */
const O = () => hex(OUT)
const P = (ax: number, ay: number) => (x: number, y: number, z = 0): [number, number] => [ax + (x - y) * 16, ay + (x + y) * 8 - z]

/** A LLM bebê: um robozinho redondo com tela no rosto. stage 0..6 (cresce e ganha acessórios). */
export function babySprite(stage: number, f: number, mood: 'feliz' | 'confuso' | 'dorme' = 'feliz') {
  const fr = f % 4
  return memo(`baby:${stage}:${fr}:${mood}`, () => {
    const s = 0.75 + Math.min(stage, 6) * 0.06
    const W = 30, H = 36
    const p = new Pix(W, H)
    const r = 10 * s, cx = 15, cy = 22 - (fr === 1 ? 1 : 0)
    const body = hex(stage >= 3 ? '#e8f4ff' : '#c8d0e0'), bodyD = hex('#8a96b0')
    // pezinhos
    p.rect(cx - 5, cy + r - 1, 4, 3, bodyD); p.rect(cx + 1, cy + r - 1, 4, 3, bodyD)
    // corpo redondo
    p.ellipse(cx, cy, r, r * 0.95, body)
    p.ellipse(cx + r * 0.35, cy + r * 0.3, r * 0.6, r * 0.55, hex(stage >= 3 ? '#d0e4f8' : '#b0b8cc'))
    p.ellipse(cx - r * 0.35, cy - r * 0.4, r * 0.3, r * 0.22, hex('#ffffff'))
    // tela do rosto
    const fw = Math.round(r * 1.2), fh = Math.round(r * 0.8)
    p.rect(cx - fw / 2, cy - fh / 2 - 1, fw, fh, hex('#0c1a3a'))
    const eye = hex(stage >= 2 ? '#7fe3ff' : '#8a8aa8')
    if (mood === 'dorme' || (fr === 3 && mood === 'feliz')) { p.rect(cx - 5, cy - 1, 3, 1, eye); p.rect(cx + 2, cy - 1, 3, 1, eye) }
    else if (mood === 'confuso') { p.rect(cx - 5, cy - 2, 2, 2, eye); p.rect(cx + 2, cy - 3, 3, 3, eye); p.px(cx, cy + 2, eye); p.px(cx + 1, cy + 3, eye) }
    else { p.rect(cx - 5, cy - 3, 3, 3, eye); p.rect(cx + 2, cy - 3, 3, 3, eye); p.px(cx - 5, cy - 3, hex('#ffffff')); p.px(cx + 2, cy - 3, hex('#ffffff')); if (stage >= 2) { p.rect(cx - 2, cy + 2, 4, 1, eye); p.px(cx - 3, cy + 1, eye); p.px(cx + 2, cy + 1, eye) } }
    // antena que pisca
    p.rect(cx, cy - r - 4, 1, 4, hex('#8a96b0')); p.ellipse(cx + 0.5, cy - r - 5, 1.6, 1.6, hex(fr % 2 ? '#ffd27a' : stage >= 4 ? '#7fe3ff' : '#ff8ad8'))
    // bochechas
    if (stage >= 2 && mood === 'feliz') { p.px(cx - 7, cy + 1, hex('#ff9ad0')); p.px(cx + 7, cy + 1, hex('#ff9ad0')) }
    // gravatinha (ajuste fino)
    if (stage >= 5) { p.poly([[cx - 3, cy + r - 3], [cx, cy + r - 1], [cx + 3, cy + r - 3], [cx + 3, cy + r + 0], [cx, cy + r - 2], [cx - 3, cy + r]], hex('#e84a6a')) }
    // capelo de formatura
    if (stage >= 6) {
      p.poly([[cx - 11, cy - r - 2], [cx, cy - r - 7], [cx + 11, cy - r - 2], [cx, cy - r + 2]], hex('#1b1a2e'))
      p.rect(cx - 5, cy - r - 2, 10, 4, hex('#2a2a40'))
      p.line(cx + 8, cy - r - 3, cx + 9, cy - r + 5, hex('#ffd27a')); p.px(cx + 9, cy - r + 6, hex('#ffd27a'))
    }
    p.outline(O())
    return spr(p, cx, H - 1)
  })
}

/** Cápsula de vidro onde a LLM bebê fica (base, tampa e brilho). */
export function podBase(lit: number) {
  return memo('podb:' + lit, () => {
    const c = cylPix(24, 12, '#3a4470', lit ? '#7fe3ff' : '#5a6a9a')
    const p = c.p
    if (lit) for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; p.px(c.ax + Math.cos(a) * 20, c.ay - 6 + Math.sin(a) * 9, hex(k < lit ? '#ffd27a' : '#2a3058')) }
    return spr(p, c.ax, c.ay)
  })
}
export function podGlass(f: number) {
  return memo('podg:' + (f % 8), () => {
    const p = new Pix(52, 74)
    const cx = 26
    // vidro (contorno + reflexo)
    const glass = hex('#bff6ff', 70), edge = hex('#7fe3ff', 200)
    for (let y = 8; y < 66; y++) { const w = 22; p.px(cx - w, y, edge); p.px(cx + w, y, edge); if (y % 2 === 0) for (let x = cx - w + 1; x < cx + w; x += 6) p.px(x + ((y >> 1) % 6), y, glass) }
    p.ellipse(cx, 8, 22, 6, hex('#bff6ff', 60)); p.ellipse(cx, 8, 22, 6, 0)
    for (let x = -22; x <= 22; x++) { const yy = Math.round(Math.sqrt(Math.max(0, 1 - (x / 22) ** 2)) * 6); p.px(cx + x, 8 - yy, edge); p.px(cx + x, 8 + yy, edge) }
    // reflexo que desce
    const ry = 10 + ((f * 7) % 54)
    for (let k = 0; k < 6; k++) p.px(cx - 15 + k, ry + k, hex('#ffffff', 160))
    // tampa
    p.rect(cx - 16, 0, 32, 4, hex('#5a6a9a')); p.rect(cx - 16, 0, 32, 1, hex('#8a9aca'))
    return spr(p, cx, 66)
  })
}

/* ---------- estações ---------- */
function stationBox(w: number, d: number, h: number, color: string) {
  return boxPix(w, d, h, '#d8e0ec', { top: '#eef3fa', right: '#b8c4d4', leftFn: (u, zz) => (Math.abs(zz - h * 0.7) < 1.5 ? hex(color) : null) })
}
/** Terminal com tela e luz da cor da estação. */
export function terminal(color: string, on: boolean, f: number, label?: string) {
  return memo(`term:${color}:${on}:${f % 4}:${label || ''}`, () => {
    const b = stationBox(1.4, 0.9, 18, color)
    const p = new Pix(b.p.w + 8, b.p.h + 34)
    p.blit(b.p, 0, 34)
    const at = P(b.ax, b.ay + 34)
    const s0 = at(0.15, 0.45, 20), s1 = at(1.25, 0.45, 20), s2 = at(1.25, 0.45, 44), s3 = at(0.15, 0.45, 44)
    p.poly([s0, s1, s2, s3], hex('#2a3048'))
    const i0 = at(0.25, 0.45, 23), i1 = at(1.15, 0.45, 23), i2 = at(1.15, 0.45, 41), i3 = at(0.25, 0.45, 41)
    p.poly([i0, i1, i2, i3], hex(on ? '#0c1a3a' : '#1a1e2e'))
    if (on) for (let k = 0; k < 3; k++) { const a = at(0.35, 0.45, 37 - k * 5), c = at(0.35 + 0.2 + ((f + k * 2) % 4) * 0.12, 0.45, 37 - k * 5); p.line(a[0], a[1], c[0], c[1], hex(k % 2 ? lighter(color, 0.4) : color)) }
    if (label) { const s = signPix([{ t: label, c: '#1b1426' }], '#eef3fa', color, 1); const q = at(0.1, 0.9, 12); p.blit(s, q[0] - 2, q[1] - s.h + 2) }
    p.outline(O())
    return spr(p, b.ax, b.ay + 34)
  })
}
/** Estante com rolos de frases (dados). */
export function scrollShelf() {
  return memo('sshelf', () => box(2.2, 0.5, 40, '#c8d4e4', {
    top: '#e0e8f4',
    leftFn: (u, zz, x) => {
      const sh = Math.floor(zz) % 12
      if (sh < 2 || zz > 37) return hex('#a8b4c8')
      if (sh > 9) return hex('#8a96aa')
      const k = Math.floor(x / 4)
      return hex(x % 4 === 0 ? '#c8b898' : ['#f2ead8', '#ffe8b8', '#e8f0ff', '#f8e0e8'][k % 4])
    },
  }))
}
/** Máquina de treino: anel com engrenagens e faíscas. */
export function forge(f: number, hot: boolean) {
  return memo(`forge:${f % 6}:${hot}`, () => {
    const b = stationBox(2.4, 2, 22, '#ffb35a')
    const p = new Pix(b.p.w + 6, b.p.h + 46)
    p.blit(b.p, 3, 46)
    const at = P(b.ax + 3, b.ay + 46)
    const c = at(1.2, 1, 52)
    // anel
    for (let a = 0; a < 64; a++) {
      const ang = (a / 64) * Math.PI * 2
      const x = c[0] + Math.cos(ang) * 18, y = c[1] + Math.sin(ang) * 18
      p.rect(x - 1, y - 1, 3, 3, hex((a + f * 3) % 16 < 3 && hot ? '#fff2c0' : '#ffb35a'))
    }
    p.ellipse(c[0], c[1], 12, 12, hex(hot ? '#3a1a0a' : '#1a1e2e'))
    if (hot) { p.ellipse(c[0], c[1], 7, 7, hex('#ff8a3a')); p.ellipse(c[0], c[1], 3, 3, hex('#fff2c0')) }
    // suportes
    const s1 = at(0.3, 1, 22), s2 = at(2.1, 1, 22)
    p.line(s1[0], s1[1], c[0] - 12, c[1] + 10, hex('#8a96aa')); p.line(s2[0], s2[1], c[0] + 12, c[1] + 10, hex('#8a96aa'))
    p.outline(O())
    return spr(p, b.ax + 3, b.ay + 46)
  })
}
/** Cabine de teste com alto-falante. */
export function testBooth(f: number, on: boolean) {
  return memo(`booth:${f % 4}:${on}`, () => {
    const b = boxPix(2, 1.6, 40, '#c8d4e4', { top: '#e0e8f4', right: '#a8b4c8' })
    const p = b.p
    const at = P(b.ax, b.ay)
    // porta / janela de vidro
    p.poly([at(0.3, 1.6, 4), at(1.7, 1.6, 4), at(1.7, 1.6, 34), at(0.3, 1.6, 34)], hex('#2a3a5a'))
    p.poly([at(0.4, 1.6, 6), at(1.6, 1.6, 6), at(1.6, 1.6, 32), at(0.4, 1.6, 32)], hex(on ? '#1a4a6a' : '#1e2a40'))
    if (on) for (let k = 0; k < 3; k++) { const a = at(0.6, 1.6, 26 - k * 6), c = at(0.6 + 0.25 + ((f + k) % 3) * 0.2, 1.6, 26 - k * 6); p.line(a[0], a[1], c[0], c[1], hex('#7fe3ff')) }
    const lamp = at(1, 0.8, 40); p.rect(lamp[0] - 2, lamp[1] - 4, 4, 4, hex(on && f % 2 ? '#7ef0a0' : '#ff6a5a'))
    p.outline(O())
    return spr(p, b.ax, b.ay)
  })
}
/** Mesa de ajuste com botões e um cadeado. */
export function tuner(f: number, open: boolean) {
  return memo(`tuner:${f % 4}:${open}`, () => {
    const b = stationBox(2, 1, 16, '#ff7ab8')
    const p = new Pix(b.p.w, b.p.h + 16)
    p.blit(b.p, 0, 16)
    const at = P(b.ax, b.ay + 16)
    for (let k = 0; k < 4; k++) { const q = at(0.3 + k * 0.45, 0.5, 16); p.ellipse(q[0], q[1] - 2, 2.5, 1.6, hex(['#ffd27a', '#7fe3ff', '#ff7ab8', '#7ef0a0'][k])); p.px(q[0] + ((f + k) % 3) - 1, q[1] - 3, hex('#1b1426')) }
    const l = at(1, 0.2, 28)
    p.rect(l[0] - 4, l[1], 8, 7, hex('#e8c860'))
    if (open) p.line(l[0] - 3, l[1], l[0] - 3, l[1] - 6, hex('#a8a8b8')); else { p.line(l[0] - 3, l[1], l[0] - 3, l[1] - 4, hex('#a8a8b8')); p.line(l[0] + 2, l[1], l[0] + 2, l[1] - 4, hex('#a8a8b8')); p.line(l[0] - 3, l[1] - 4, l[0] + 2, l[1] - 4, hex('#a8a8b8')) }
    p.outline(O())
    return spr(p, b.ax, b.ay + 16)
  })
}
/** Palco da formatura com faixa. */
export function gradStage() {
  return memo('gstage', () => {
    const b = boxPix(4, 2.2, 10, '#2a3a6a', { top: '#3a5aa0' })
    const p = new Pix(b.p.w, b.p.h + 40)
    p.blit(b.p, 0, 40)
    const at = P(b.ax, b.ay + 40)
    // faixa
    const s = signPix([{ t: 'FORMATURA', c: '#ffd27a' }], '#1b2a5a', '#ffd27a', 3)
    const q = at(0.6, 0, 46)
    p.blit(s, q[0], q[1] - 4)
    // postes da faixa
    const a = at(0.3, 0, 10), c = at(3.7, 0, 10)
    p.rect(a[0], a[1] - 34, 2, 34, hex('#c8a040')); p.rect(c[0], c[1] - 34, 2, 34, hex('#c8a040'))
    p.outline(O())
    return spr(p, b.ax, b.ay + 40)
  })
}
export function podium() {
  return memo('podium', () => box(0.8, 0.6, 20, '#6a4a2a', { top: '#8a6a3a', leftFn: (u, zz) => (Math.abs(zz - 12) < 2 ? hex('#ffd27a') : null) }))
}
export function trophy(f: number) {
  return memo('troph:' + (f % 4), () => {
    const p = new Pix(16, 22)
    p.rect(5, 18, 6, 3, hex('#6a4a2a')); p.rect(7, 13, 2, 5, hex('#e8c860'))
    p.poly([[2, 3], [14, 3], [12, 11], [8, 13], [4, 11]], hex('#ffd27a'))
    p.rect(0, 4, 2, 4, hex('#e8c860')); p.rect(14, 4, 2, 4, hex('#e8c860'))
    p.px(5 + (f % 4), 5, hex('#ffffff'))
    p.outline(O())
    return spr(p, 8, 21)
  })
}
/** Bancada com frascos (decoração). */
export function labBench(f: number) {
  return memo('lbench:' + (f % 4), () => {
    const b = stationBox(1.8, 0.8, 14, '#59d7ff')
    const p = new Pix(b.p.w, b.p.h + 14)
    p.blit(b.p, 0, 14)
    const at = P(b.ax, b.ay + 14)
    const cols = ['#7ef0a0', '#ff7ab8', '#7fe3ff']
    for (let k = 0; k < 3; k++) { const q = at(0.3 + k * 0.5, 0.4, 14); p.rect(q[0] - 2, q[1] - 9, 4, 9, hex('#e8f4ff', 200)); p.rect(q[0] - 2, q[1] - 5 + ((f + k) % 2), 4, 5 - ((f + k) % 2), hex(cols[k])); p.rect(q[0] - 1, q[1] - 11, 2, 2, hex('#a8b4c8')) }
    p.outline(O())
    return spr(p, b.ax, b.ay + 14)
  })
}
export function cableCol(color: string) {
  return memo('cab:' + color, () => { const c = cylPix(5, 60, '#c8d4e4', '#e0e8f4'); c.p.rect(c.ax - 5, c.ay - 40, 10, 2, hex(color)); c.p.rect(c.ax - 5, c.ay - 20, 10, 2, hex(darker(color, 0.2))); return spr(c.p, c.ax, c.ay) })
}
