import { Pix, hex, hash2, darker, lighter, mix, textPix } from '../../engine/pix'
import { box, boxPix, cylPix, memo, spr, signPix, OUT } from '../../art/core'
import type { Sprite } from '../../engine/runtime'

/* =========================================================
   Peças da Fábrica de Previsões (Fase 2) em pixel art:
   máquina do prompt, livro gigante, fatiador, holofotes,
   torre de camadas, roleta, academia, biblioteca, barreiras.
   ========================================================= */
const O = () => hex(OUT)
const S = (p: Pix, ax: number, ay: number, outline = true) => { if (outline) p.outline(O()); return spr(p, ax, ay) }
/** Ponto da tela relativo à âncora (casas e altura em px). */
const P = (ax: number, ay: number) => (x: number, y: number, z = 0): [number, number] => [ax + (x - y) * 16, ay + (x + y) * 8 - z]

/* ---------- barreira de energia (fecha um corredor) ---------- */
/** Barreira atravessando o corredor. axis = direção em que ela se estende ('x' ou 'y'). */
export function barrier(axis: 'x' | 'y', len: number, color: string, on: boolean, f: number) {
  return memo(`bar:${axis}:${len}:${color}:${on}:${on ? f % 4 : 0}`, () => {
    const W = Math.ceil(len * 16) + 12, Hh = Math.ceil(len * 8) + 44
    const p = new Pix(W, Hh)
    const ax = axis === 'x' ? 6 : W - 6, ay = 38
    const at = P(ax, ay)
    const end = axis === 'x' ? at(len, 0) : at(0, len)
    const post = (x: number, y: number) => { p.rect(x - 2, y - 34, 5, 34, hex('#3a3e5a')); p.rect(x - 2, y - 34, 2, 34, hex('#5a5e80')); p.rect(x - 3, y - 37, 7, 4, hex(on ? color : '#4fd18b')); p.px(x, y - 36, hex('#ffffff')) }
    if (on) {
      const c = hex(color), cl = hex(lighter(color, 0.5))
      for (let k = 0; k < 4; k++) {
        const z = 8 + k * 7
        const wob = (f + k) % 4
        p.line(at(0, 0)[0], at(0, 0)[1] - z, end[0], end[1] - z, k % 2 === wob % 2 ? cl : c)
      }
      // brilho
      for (let k = 0; k < 6; k++) { const t = ((f * 0.13 + k / 6) % 1); const x = at(0, 0)[0] + (end[0] - at(0, 0)[0]) * t, y = at(0, 0)[1] + (end[1] - at(0, 0)[1]) * t - 8 - ((k * 7) % 22); p.px(x, y, hex('#ffffff')) }
    }
    post(at(0, 0)[0], at(0, 0)[1]); post(end[0], end[1])
    p.outline(O())
    return spr(p, ax, ay)
  })
}

/* ---------- a máquina do prompt (Sala do Prompt) ---------- */
export function promptMachine(lit: number, f: number) {
  return memo(`pm:${lit}:${f % 4}`, () => {
    const b = boxPix(3, 2, 30, '#3a3a6a', { top: '#5a5a8a' })
    const p = new Pix(b.p.w + 4, b.p.h + 52)
    const ox = 2, oy = 52
    p.blit(b.p, ox, oy)
    const at = P(b.ax + ox, b.ay + oy)
    // tela grande inclinada em cima
    const s0 = at(0.2, 0.6, 34), s1 = at(2.8, 0.6, 34), s2 = at(2.8, 0.6, 76), s3 = at(0.2, 0.6, 76)
    p.poly([s0, s1, s2, s3], hex('#1b1426'))
    const i0 = at(0.35, 0.6, 37), i1 = at(2.65, 0.6, 37), i2 = at(2.65, 0.6, 73), i3 = at(0.35, 0.6, 73)
    p.poly([i0, i1, i2, i3], hex('#0c1a3a'))
    // linhas de texto da pergunta
    for (let k = 0; k < 3; k++) {
      const z = 66 - k * 10, len = [2.0, 1.6, 1.1][k]
      const a = at(0.5, 0.6, z), c = at(0.5 + len, 0.6, z)
      p.line(a[0], a[1], c[0], c[1], hex(k === 2 && f % 2 ? '#ffd27a' : '#7fe3ff'))
      p.line(a[0], a[1] + 1, c[0], c[1] + 1, hex('#3a7ab0'))
    }
    // luzes das estações (8)
    for (let k = 0; k < 8; k++) { const q = at(0.25 + k * 0.33, 2, 22); p.rect(q[0], q[1], 2, 2, hex(k < lit ? ['#b07aff', '#ff6a5a', '#59d7ff', '#ffd27a', '#7a8cff', '#ff7ab8', '#ffb35a', '#8ff0b0'][k] : '#2a2a40')) }
    // antena
    const top = at(1.5, 1, 76); p.rect(top[0], top[1] - 14, 2, 14, hex('#5a5a7a')); p.rect(top[0] - 1, top[1] - 17, 4, 3, hex(f % 2 ? '#ff6a5a' : '#ffd27a'))
    p.outline(O())
    return spr(p, b.ax + ox, b.ay + oy)
  })
}

/* ---------- Oficina do Adivinho ---------- */
export function giantBook(f: number) {
  return memo('gbook:' + (f % 4), () => {
    const st = boxPix(2.2, 1, 14, '#6a4228', { top: '#8a5a34' })
    const p = new Pix(st.p.w + 10, st.p.h + 40)
    const ox = 5, oy = 40
    p.blit(st.p, ox, oy)
    const at = P(st.ax + ox, st.ay + oy)
    // páginas abertas (em V)
    const L = [at(0.1, 0.5, 16), at(1.1, 0.5, 14), at(1.1, 0.5, 40), at(0.1, 0.5, 46)]
    const R = [at(1.1, 0.5, 14), at(2.1, 0.5, 16), at(2.1, 0.5, 46), at(1.1, 0.5, 40)]
    p.poly(L, hex('#f2ead8')); p.poly(R, hex('#fff6e2'))
    for (let k = 0; k < 6; k++) {
      const z = 20 + k * 4
      const a = at(0.25, 0.5, z + 1), b = at(0.95, 0.5, z - 0.5); p.line(a[0], a[1], b[0], b[1], hex(k === (f % 6) ? '#b07aff' : '#9a8a6a'))
      const c = at(1.25, 0.5, z - 0.5), d = at(1.95, 0.5, z + 1); p.line(c[0], c[1], d[0], d[1], hex('#9a8a6a'))
    }
    const sp = at(1.1, 0.5, 14), sp2 = at(1.1, 0.5, 40); p.line(sp[0], sp[1], sp2[0], sp2[1], hex('#c8b898'))
    // fitinha
    p.line(sp2[0], sp2[1], sp2[0] + 2, sp2[1] + 14, hex('#b07aff'))
    p.outline(O())
    return spr(p, st.ax + ox, st.ay + oy)
  })
}
/** Quadro-negro de contagem (pauzinhos). */
export function tallyBoard() {
  return memo('tally', () => {
    const Wd = 2.4, H = 34
    const p = new Pix(Wd * 16 + 4, Wd * 8 + H + 14)
    const ax = 2, ay = H + 2
    const at = P(ax, ay)
    // pés
    for (const u of [0.2, 2.2]) { const q = at(u, 0, 0); p.rect(q[0] - 1, q[1] - 12, 2, 12, hex('#4a2e1c')) }
    const q0 = at(0, 0, 10), q1 = at(Wd, 0, 10), q2 = at(Wd, 0, H), q3 = at(0, 0, H)
    p.poly([q0, q1, q2, q3], hex('#6a4228'))
    const r0 = at(0.12, 0, 12), r1 = at(Wd - 0.12, 0, 12), r2 = at(Wd - 0.12, 0, H - 2), r3 = at(0.12, 0, H - 2)
    p.poly([r0, r1, r2, r3], hex('#1f3a2e'))
    // pauzinhos de giz
    const ch = hex('#e8f0e0')
    for (let row = 0; row < 3; row++) {
      const n = [5, 3, 2][row]
      for (let k = 0; k < n; k++) {
        const u = 0.3 + k * 0.22, z = H - 6 - row * 7
        const a = at(u, 0, z), b = at(u, 0, z - 5)
        if (k === 4) { const c = at(0.25, 0, z - 4), d = at(1.2, 0, z - 1); p.line(c[0], c[1], d[0], d[1], ch) } else p.line(a[0], a[1], b[0], b[1], ch)
      }
    }
    p.outline(O())
    return spr(p, ax, ay)
  })
}

/* ---------- Fatiador ---------- */
export function cutter(f: number, busy: boolean) {
  return memo(`cut:${f % 6}:${busy}`, () => {
    const b = boxPix(2.4, 2.4, 34, '#8a3a3a', { top: '#aa4a4a', right: '#6a2a2a' })
    const p = new Pix(b.p.w + 4, b.p.h + 34)
    const ox = 2, oy = 34
    p.blit(b.p, ox, oy)
    const at = P(b.ax + ox, b.ay + oy)
    // boca da máquina (lado esquerdo, por onde entram as palavras)
    const m0 = at(0, 0.6, 4), m1 = at(0, 1.8, 4), m2 = at(0, 1.8, 18), m3 = at(0, 0.6, 18)
    p.poly([m0, m1, m2, m3], hex('#1b1426'))
    // lâmina que sobe e desce
    const k = busy ? [0, 4, 10, 14, 10, 4][f % 6] : 0
    const l0 = at(0.6, 1.2, 46 - k), l1 = at(1.8, 1.2, 46 - k)
    p.rect(l0[0] - 1, l0[1] - 12, 2, 12, hex('#5a5a6a')); p.rect(l1[0] - 1, l1[1] - 12, 2, 12, hex('#5a5a6a'))
    p.poly([[l0[0], l0[1]], [l1[0], l1[1]], [l1[0], l1[1] + 6], [l0[0], l0[1] + 6]], hex('#d8e0f0'))
    p.line(l0[0], l0[1] + 6, l1[0], l1[1] + 6, hex('#ffffff'))
    // luz e engrenagem
    const g = at(2.4, 1.2, 26); p.ellipse(g[0] + 6, g[1], 5, 5, hex('#c8a040')); p.ellipse(g[0] + 6, g[1], 2, 2, hex('#6a4a1a'))
    for (let a = 0; a < 6; a++) { const ang = a + (busy ? f * 0.5 : 0); p.px(g[0] + 6 + Math.cos(ang) * 6, g[1] + Math.sin(ang) * 6, hex('#c8a040')) }
    const lt = at(1.2, 0, 34); p.rect(lt[0] - 2, lt[1] - 6, 4, 4, hex(busy && f % 2 ? '#ffd27a' : '#ff6a5a'))
    // placa
    const s = signPix([{ t: 'FATIADOR', c: '#ffd27a' }], '#2a1420', '#ff6a5a', 2)
    const sp = at(0.2, 2.4, 30); p.blit(s, sp[0] - 2, sp[1] - s.h)
    p.outline(O())
    return spr(p, b.ax + ox, b.ay + oy)
  })
}
/** Esteira (base) para uma máquina: comprimento ao longo de x. */
export function beltBase(len: number) {
  return memo('belt:' + len, () => box(len, 0.9, 8, '#2a2a3a', {
    top: '#3a3a4a',
    topFn: (u, v) => (v < 0.12 || v > 0.88 ? hex('#8a8aa0') : Math.floor(u * len * 4) % 2 ? hex('#30303e') : hex('#262632')),
  }))
}

/* ---------- Vale dos Vetores ---------- */
export function starSprite(color: string, f: number, big = false) {
  return memo(`star:${color}:${f % 4}:${big}`, () => {
    const p = new Pix(13, 13), c = hex(color), w = hex('#ffffff')
    const r = big ? 2 : 1
    p.rect(6 - r, 6 - r, r * 2 + 1, r * 2 + 1, c)
    const k = f % 4
    const L = (big ? 5 : 3) + (k === 0 ? 1 : 0)
    for (let i = r + 1; i <= L; i++) { p.px(6 + i, 6, c); p.px(6 - i, 6, c); p.px(6, 6 + i, c); p.px(6, 6 - i, c) }
    p.px(6, 6, w)
    return spr(p, 6, 12)
  })
}
/** Pedra-placa do bairro do mapa. */
export function districtSign(name: string, color: string) {
  return memo(`dsg:${name}:${color}`, () => {
    const s = signPix([{ t: name.toUpperCase(), c: color }], '#0c1430', color, 2)
    const p = new Pix(s.w + 2, s.h + 10)
    p.rect(Math.floor(s.w / 2), s.h - 1, 2, 11, hex('#3a3e5a'))
    p.blit(s, 1, 0)
    return S(p, Math.floor(s.w / 2) + 1, s.h + 9)
  })
}

/* ---------- Praça dos Holofotes ---------- */
export function stage(w: number, d: number) {
  return memo(`stage:${w}:${d}`, () => {
    const b = boxPix(w, d, 12, '#5a2a4a', { top: '#8a5a3a', topFn: (u, v) => (Math.floor(u * w * 3) % 2 ? hex('#8a5a3a') : hex('#7a4a30')) })
    const p = new Pix(b.p.w, b.p.h + 60)
    p.blit(b.p, 0, 60)
    const at = P(b.ax, b.ay + 60)
    // cortina vermelha no fundo (ao longo de x, em y = 0)
    for (let c = 0; c < w * 16; c++) {
      const u = c / 16
      const a = at(u, 0, 12), fold = Math.sin(u * 5) * 0.5 + 0.5
      const col = hex(mix('#8a1a2a', '#c83a4a', fold))
      for (let z = 0; z < 58; z++) p.px(a[0], a[1] - z, z > 52 ? hex('#e8b65a') : col)
    }
    p.outline(O())
    return spr(p, b.ax, b.ay + 60)
  })
}
export function spotlight(color: string, on: boolean, flip: boolean) {
  return memo(`spot:${color}:${on}:${flip}`, () => {
    const p = new Pix(16, 50)
    p.rect(7, 14, 2, 35, hex('#3a3a50')); p.rect(4, 47, 8, 2, hex('#2a2a3a'))
    p.ellipse(8, 10, 6, 5, hex('#2a2a3a'))
    p.ellipse(flip ? 5 : 11, 11, 3, 3, hex(on ? color : '#4a4a5a'))
    if (on) p.px(flip ? 5 : 11, 10, hex('#ffffff'))
    return S(p, 8, 49)
  })
}
export function bench(len: number) {
  return memo('bench:' + len, () => box(len, 0.45, 10, '#6a4a34', { top: '#8a6a44' }))
}

/* ---------- Torre das Camadas ---------- */
export function layerTower(lit: number, f: number) {
  return memo(`tower:${lit}:${f % 4}`, () => {
    const N = 5, slabH = 22, gap = 4, w = 2.6
    const Hh = N * (slabH + gap) + 30
    const base = boxPix(w + 0.6, w + 0.6, 10, '#3a3a5a', { top: '#4a4a6a' })
    const p = new Pix(base.p.w, base.p.h + Hh)
    p.blit(base.p, 0, Hh)
    const at = P(base.ax, base.ay + Hh)
    for (let k = 0; k < N; k++) {
      const on = k < Math.min(N, lit * 2 - (lit >= 3 ? 1 : 0)) || lit >= 3
      const z0 = 10 + k * (slabH + gap)
      const col = on ? ['#7a8cff', '#8a9cff', '#9aacff', '#aabcff', '#bacbff'][k] : '#3a3e5a'
      const s = boxPix(w, w, slabH, col, { top: on ? lighter(col, 0.3) : '#4a4e6a', outline: false })
      const q = at(0.3, 0.3, z0)
      p.blit(s.p, q[0] - s.ax, q[1] - s.ay)
      // neurônios (pontinhos) na face da frente
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
        const pt = at(0.3 + 0.4 + i * 0.55, 0.3 + w, z0 + 6 + j * 9)
        p.rect(pt[0], pt[1], 2, 2, hex(on ? ((i + j + f + k) % 3 === 0 ? '#ffffff' : '#ffd27a') : '#2a2a40'))
      }
      // pilares de ligação
      if (k < N - 1) { const pa = at(0.3 + w / 2, 0.3 + w / 2, z0 + slabH); p.rect(pa[0] - 1, pa[1] - gap, 2, gap, hex(on ? '#ffd27a' : '#2a2a40')) }
    }
    p.outline(O())
    return spr(p, base.ax, base.ay + Hh)
  })
}

/* ---------- Cassino da Roleta ---------- */
export function rouletteTable(angle: number) {
  const a = Math.round(((angle % (Math.PI * 2)) / (Math.PI * 2)) * 24)
  return memo(`rlt:${a}`, () => {
    const t = boxPix(2.4, 2.4, 16, '#2a6a3a', { top: '#3a8a4a', right: '#5a3a24', left: '#6a4428' })
    const p = new Pix(t.p.w, t.p.h + 12)
    p.blit(t.p, 0, 12)
    const at = P(t.ax, t.ay + 12)
    const c = at(1.2, 1.2, 16)
    const cols = ['#c83a3a', '#1b1426', '#c83a3a', '#1b1426', '#c83a3a', '#1b1426', '#c83a3a', '#1b1426', '#2a8a4a', '#c83a3a', '#1b1426', '#c83a3a']
    p.ellipse(c[0], c[1] - 2, 17, 9, hex('#8a5a2a'))
    for (let y = -8; y <= 8; y++) for (let x = -16; x <= 16; x++) {
      const dx = x / 15, dy = y / 7.5, d = Math.hypot(dx, dy)
      if (d > 1 || d < 0.25) continue
      const ang = Math.atan2(dy, dx) + (a / 24) * Math.PI * 2
      const k = Math.floor((((ang / (Math.PI * 2)) % 1 + 1) % 1) * 12)
      p.px(c[0] + x, c[1] - 2 + y, hex(d > 0.82 ? '#c8a040' : cols[k]))
    }
    p.ellipse(c[0], c[1] - 2, 3, 2, hex('#e8c860'))
    p.rect(c[0], c[1] - 9, 1, 5, hex('#e8c860'))
    p.outline(O())
    return spr(p, t.ax, t.ay + 12)
  })
}
export function slotMachine(color: string, f: number) {
  return memo(`slot:${color}:${f % 4}`, () => {
    const b = boxPix(0.9, 0.8, 40, color, { top: lighter(color, 0.2) })
    const p = new Pix(b.p.w + 8, b.p.h + 8)
    p.blit(b.p, 0, 8)
    const at = P(b.ax, b.ay + 8)
    const s0 = at(0.1, 0.8, 22), s1 = at(0.8, 0.8, 22), s2 = at(0.8, 0.8, 34), s3 = at(0.1, 0.8, 34)
    p.poly([s0, s1, s2, s3], hex('#fff6e2'))
    const sym = ['#c83a3a', '#ffd27a', '#2a8a4a', '#59d7ff']
    for (let k = 0; k < 3; k++) { const q = at(0.2 + k * 0.22, 0.8, 30); p.rect(q[0], q[1], 3, 4, hex(sym[(f + k * 2) % 4])) }
    const lv = at(0.9, 0.4, 30); p.rect(lv[0] + 1, lv[1] - 8, 1, 12, hex('#8a8aa0')); p.ellipse(lv[0] + 1.5, lv[1] - 9, 2, 2, hex('#c83a3a'))
    for (let k = 0; k < 4; k++) { const q = at(0.1 + k * 0.22, 0.8, 40); p.px(q[0], q[1] - 2, hex((f + k) % 2 ? '#ffffff' : '#ffd27a')) }
    p.outline(O())
    return spr(p, b.ax, b.ay + 8)
  })
}
export function neonSign(text: string, color: string, on: boolean) {
  return memo(`neon:${text}:${color}:${on}`, () => {
    const t = textPix(text, on ? color : darker(color, 0.5), on ? lighter(color, 0.5) : '#1b1426')
    const p = new Pix(t.w + 6, t.h + 22)
    p.rect(2, 1, t.w + 2, t.h + 2, hex('#1b1426'))
    p.blit(t, 3, 2)
    p.rect(Math.floor(t.w / 2) + 2, t.h + 3, 2, 19, hex('#3a3a50'))
    return S(p, Math.floor(t.w / 2) + 3, t.h + 21)
  })
}

/* ---------- Academia dos Pesos ---------- */
export function weightRack() {
  return memo('wrack', () => {
    const b = boxPix(1.6, 0.5, 6, '#3a3a4a', { top: '#4a4a5a' })
    const p = new Pix(b.p.w, b.p.h + 26)
    p.blit(b.p, 0, 26)
    const at = P(b.ax, b.ay + 26)
    for (const u of [0.1, 1.5]) { const q = at(u, 0.25, 6); p.rect(q[0], q[1] - 24, 2, 24, hex('#5a5a6a')) }
    for (let k = 0; k < 3; k++) {
      const q = at(0.3 + k * 0.45, 0.25, 12 + k * 6)
      p.ellipse(q[0], q[1], 3 + k, 4 + k, hex(['#c83a3a', '#2a6ac8', '#ffd27a'][k])); p.px(q[0], q[1], hex('#1b1426'))
    }
    p.outline(O())
    return spr(p, b.ax, b.ay + 26)
  })
}
/** Robô levantando a barra (k: 0 embaixo, 1 em cima). */
export function lifter(k: number, color: string) {
  const kk = Math.round(k * 4)
  return memo(`lift:${kk}:${color}`, () => {
    const p = new Pix(40, 46)
    const c = hex(color), cd = hex(darker(color, 0.3))
    const up = kk * 3
    // pernas
    p.rect(15, 34, 3, 10, cd); p.rect(22, 34, 3, 10, cd)
    // corpo
    p.rect(13, 22, 14, 13, c); p.rect(13, 22, 2, 13, hex(lighter(color, 0.25))); p.rect(17, 26, 6, 4, hex('#1a2440')); p.px(19, 27, hex('#59d7ff'))
    // cabeça
    p.rect(14, 12, 12, 10, c); p.rect(16, 14, 8, 5, hex('#0c1a3a')); p.rect(17, 15, 2, 2, hex('#7fe3ff')); p.rect(21, 15, 2, 2, hex('#7fe3ff'))
    if (kk >= 3) { p.rect(17, 18, 6, 1, hex('#7fe3ff')) }
    // braços e barra
    const by = 22 - up
    p.rect(10, by, 3, 34 - by - 10 + 4, cd); p.rect(27, by, 3, 34 - by - 10 + 4, cd)
    p.rect(2, by - 2, 36, 2, hex('#8a8aa0'))
    p.ellipse(4, by - 1, 3, 6, hex('#c83a3a')); p.ellipse(36, by - 1, 3, 6, hex('#c83a3a'))
    p.outline(O())
    return spr(p, 20, 44)
  })
}
export function benchPress() {
  return memo('bpress', () => box(1.6, 0.6, 9, '#3a3a5a', { top: '#c83a3a' }))
}
/** Painel com a curva do erro caindo. */
export function lossBoard(k: number) {
  const kk = Math.round(k * 10)
  return memo('lossb:' + kk, () => {
    const Wd = 2.2, H = 30
    const p = new Pix(Wd * 16 + 4, Wd * 8 + H + 14)
    const ax = 2, ay = H + 2
    const at = P(ax, ay)
    for (const u of [0.2, 2.0]) { const q = at(u, 0, 0); p.rect(q[0] - 1, q[1] - 10, 2, 10, hex('#3a3a50')) }
    p.poly([at(0, 0, 8), at(Wd, 0, 8), at(Wd, 0, H), at(0, 0, H)], hex('#0c1430'))
    let prev: [number, number] | null = null
    for (let i = 0; i <= 12; i++) {
      const u = 0.15 + (i / 12) * (Wd - 0.3)
      const shown = i / 12 <= Math.max(0.15, kk / 10)
      const val = Math.exp(-i / 3.2)
      const q = at(u, 0, 10 + val * (H - 14))
      if (prev && shown) p.line(prev[0], prev[1], q[0], q[1], hex('#ffd27a'))
      prev = q
    }
    p.outline(O())
    return spr(p, ax, ay)
  })
}

/* ---------- Biblioteca do Contexto ---------- */
export function readingTable() {
  return memo('rtable', () => {
    const b = boxPix(2, 1.2, 12, '#5a3a24', { top: '#7a5a34' })
    const p = b.p
    const at = P(b.ax, b.ay)
    const a = at(0.4, 0.3, 12), c = at(1.2, 0.5, 12)
    p.poly([[a[0], a[1]], [a[0] + 10, a[1] - 3], [a[0] + 16, a[1]], [a[0] + 6, a[1] + 3]], hex('#f2ead8'))
    p.rect(c[0], c[1] - 6, 3, 6, hex('#e8c860')); p.px(c[0] + 1, c[1] - 7, hex('#fff2c0'))
    return S(p, b.ax, b.ay)
  })
}
export function hallucino(f: number, sad: boolean) {
  return memo(`hal:${f % 4}:${sad}`, () => {
    const p = new Pix(22, 26)
    const c = hex(sad ? '#c8a0c8' : '#ff8ad8'), cd = hex(sad ? '#9a7a9a' : '#d85ab0')
    p.ellipse(11, 10, 9, 9, c)
    p.rect(2, 10, 19, 9, c)
    for (let k = 0; k < 4; k++) { const x = 2 + k * 5 + ((f % 2) ? 1 : 0); p.poly([[x, 18], [x + 5, 18], [x + 2.5, 23 + (k % 2)]], c) }
    p.rect(19, 10, 2, 9, cd)
    // olhos e boca
    p.rect(6, 8, 3, 4, hex('#1a0b22')); p.rect(13, 8, 3, 4, hex('#1a0b22')); p.px(7, 8, hex('#ffffff')); p.px(14, 8, hex('#ffffff'))
    if (sad) p.line(8, 16, 14, 15, hex('#1a0b22'))
    else { p.line(7, 14, 15, 14, hex('#1a0b22')); p.px(8, 15, hex('#1a0b22')); p.px(14, 15, hex('#1a0b22')); p.px(9, 16, hex('#1a0b22')); p.rect(10, 16, 3, 1, hex('#1a0b22')) }
    p.outline(O())
    return spr(p, 11, 25)
  })
}
/** Pilha de documentos brilhando (a busca do RAG). */
export function docPile(lit: boolean) {
  return memo('dpile:' + lit, () => {
    const p = new Pix(22, 20)
    for (let k = 0; k < 4; k++) p.poly([[2, 12 - k * 2], [12, 7 - k * 2], [20, 11 - k * 2], [10, 16 - k * 2]], hex(k === 3 && lit ? '#bff6c8' : ['#e8dcc0', '#f2ead8', '#d8ccb0', '#fff6e2'][k]))
    p.outline(O())
    return spr(p, 11, 17)
  })
}
/** Estante alta da biblioteca (ao longo de x). */
export function tallShelf(len: number, seed = 0) {
  return memo(`tshelf:${len}:${seed}`, () => box(len, 0.5, 52, '#4a2e1c', {
    leftFn: (u, zz, x) => {
      const sh = Math.floor(zz) % 12
      if (sh < 2 || zz > 49) return hex('#3a2416')
      const b = Math.floor(x / 3), hgt = 7 + Math.floor(hash2(b + seed, Math.floor(zz / 12), 1) * 3)
      if (sh > hgt) return hex('#20140c')
      const pal = ['#2a6a4a', '#8a2a2a', '#2a4a8a', '#c8a040', '#5a3a8a', '#d8d0c0', '#3a8a8a']
      const col = pal[Math.floor(hash2(b + seed, Math.floor(zz / 12), 9) * pal.length)]
      return hex(x % 3 === 2 ? darker(col, 0.3) : col)
    },
  }))
}

/* ---------- comuns ---------- */
export function crate(color: string) {
  return memo('crate:' + color, () => box(0.55, 0.55, 14, color, { top: lighter(color, 0.2), leftFn: (u, zz) => (Math.abs(u - 0.5) < 0.08 || zz < 2 || zz > 12 ? hex(darker(color, 0.25)) : null) }))
}
export function pipeV(color: string, h: number) {
  return memo(`pipev:${color}:${h}`, () => { const c = cylPix(4, h, color, lighter(color, 0.2)); return S(c.p, c.ax, c.ay) })
}
export function screenPost(color: string, f: number) {
  return memo(`spost:${color}:${f % 4}`, () => {
    const p = new Pix(20, 40)
    p.rect(9, 18, 2, 21, hex('#3a3a50')); p.rect(6, 38, 8, 2, hex('#2a2a3a'))
    p.rect(1, 2, 18, 16, hex('#1b1426')); p.rect(2, 3, 16, 14, hex('#0c1a3a'))
    for (let k = 0; k < 4; k++) p.rect(4, 5 + k * 3, 4 + ((f + k * 3) % 9), 1, hex(k % 2 ? color : lighter(color, 0.4)))
    p.outline(O())
    return spr(p, 10, 39)
  })
}
