import { STOPS } from '../../content/stops'
import type { P2 } from '../../store'

/* =========================================================
   O Arquivo da Memória (Fase 1): um arquipélago flutuando dentro
   da Language Engine. No centro, a Memória Central; em volta,
   uma ilha para cada época, ligadas por pontes de luz.
   Cada ilha comum tem 10×12 casas: atrás (9 fileiras) o cenário
   da época, na frente (3 fileiras) a praça por onde se anda.
   A vila da parte 2 (O Mistério dos Três Grãos) ocupa 26×19.
   ========================================================= */
export const W = 70, H = 74
const MX = 4, MY = 8, S = 15
const slot = (sx: number, sy: number): P2 => [S * sx + 3 + MX, S * sy + 2 + MY]
const GI = Math.max(0, STOPS.findIndex((s) => s.custom === 'graos'))

/** Canto de trás de cada ilha (paradas comuns). */
const SLOTS: Record<number, P2> = { 0: slot(1, 0), 2: slot(3, 1), 3: slot(3, 2), 4: slot(3, 3), 5: slot(2, 3), 6: slot(1, 3), 7: slot(0, 3), 8: slot(0, 2), 9: slot(0, 1), 10: slot(0, 0) }
export const ISL = (i: number): P2 => SLOTS[i] || [0, 0]
export const IW = 10, IH = 12

/* ---------- a vila ---------- */
const vx = 32 + MX, vy = -4 + MY
export const VILLAGE = {
  i: GI,
  x0: vx, x1: vx + 26, y0: vy,
  gate: vx + 2.2,
  boards: [vx + 4.6, vx + 6.6, vx + 8.6] as number[],
  boardY: vy + 12.2,
  stall: [vx + 10.2, vy + 11.3] as P2, // canto de trás do balcão (2,2 × 0,8)
  merchant: [vx + 12.9, vy + 11.9] as P2,
  merchantUse: [vx + 12.0, vy + 13.5] as P2,
  baskets: [[vx + 14.4, vy + 11.9], [vx + 15.6, vy + 11.9], [vx + 16.8, vy + 11.9]] as P2[],
  scale: [vx + 18.1, vy + 11.9] as P2,
  table: [vx + 19.6, vy + 9.3] as P2, // canto de trás da mesa (2,4 × 1,2)
  tableUse: [vx + 20.8, vy + 11.7] as P2,
  liu: [vx + 22.7, vy + 8.9] as P2,
  road0: vy + 14, road1: vy + 17,
}

/* ---------- posições dentro de cada ilha ---------- */
/** Centro (em x) do cenário da ilha: os objetos de cada época são posicionados a partir dele. */
export const XC = (i: number) => ISL(i)[0] + 5
/** Deslocamento em y: o cenário foi desenhado com o fundo em y = 5 (antiga trilha). */
export const DY = (i: number) => ISL(i)[1] - 5
export const HOLO_P = (i: number): P2 => [ISL(i)[0] + 5.5, ISL(i)[1] + 4.5]
export const CONSOLE_P = (i: number): P2 => [ISL(i)[0] + 1.7, ISL(i)[1] + 7.5]
export const USE_P = (i: number): P2 => (STOPS[i].custom === 'graos' ? VILLAGE.merchantUse : [ISL(i)[0] + 2.2, ISL(i)[1] + 9.3])
export const STAND_P = (i: number): P2 => [ISL(i)[0] + 4.1, ISL(i)[1] + 9.3]
export const NOVA_P = (i: number): P2 => [ISL(i)[0] + 2.4, ISL(i)[1] + 8.7]
export const EXTRA_P = (i: number): P2 => (STOPS[i].custom === 'graos' ? [vx + 23.2, vy + 12.2] : [ISL(i)[0] + 8, ISL(i)[1] + 7.3])
export const PLAQUE_P = (i: number): P2 => (STOPS[i].custom === 'graos' ? [vx + 3.6, vy + 17.6] : [ISL(i)[0] + 1.6, ISL(i)[1] + 1.3])

/* ---------- a Memória Central ---------- */
export const HUB = { x: 34, y: 38, r: 11.5 }
export const CORE: P2 = [33.6, 36.6]
export const CORE_USE: P2 = [34.4, 41.4]
export const START: P2 = [40.5, 43.5]
export const PORTAL_P: P2 = [26.2, 44.6]
export const PORTAL_USE: P2 = [27.6, 44.2]
/** Pedestais das 11 lembranças em volta do núcleo. */
export const PEDESTAL = (i: number): P2 => { const a = -Math.PI * 0.75 + (i / STOPS.length) * Math.PI * 2; return [HUB.x + Math.cos(a) * 7.6, HUB.y + Math.sin(a) * 7.2] }

/* ---------- pontes ---------- */
const Wx = (i: number): P2 => [ISL(i)[0], ISL(i)[1] + 10.5]
const Ex = (i: number): P2 => [ISL(i)[0] + 10, ISL(i)[1] + 10.5]
const Sx = (i: number): P2 => [ISL(i)[0] + 5.5, ISL(i)[1] + 12]
const plaza = (i: number) => ISL(i)[1] + 10.5
const VE: P2 = [vx + 26, vy + 15.5]
export interface Bridge { id: string; pts: P2[]; gate: number } // gate: índice da parada que abre a ponte (−1 = sempre aberta)
export const BRIDGES: Bridge[] = [
  { id: 'hub-0', pts: [Sx(0), [Sx(0)[0], HUB.y - HUB.r + 2]], gate: -1 },
  { id: '0-1', pts: [Ex(0), [vx + 0.5, plaza(0)]], gate: 0 },
  { id: '1-2', pts: [VE, [VE[0] + 2.5, VE[1]], [VE[0] + 2.5, plaza(2)], Ex(2)], gate: 1 },
  { id: '2-3', pts: [Wx(2), [Wx(2)[0] - 2.5, Wx(2)[1]], [Wx(2)[0] - 2.5, plaza(3)], Wx(3)], gate: 2 },
  { id: '3-4', pts: [Ex(3), [Ex(3)[0] + 2.5, Ex(3)[1]], [Ex(3)[0] + 2.5, plaza(4)], Ex(4)], gate: 3 },
  { id: '4-5', pts: [Wx(4), Ex(5)], gate: 4 },
  { id: '5-6', pts: [Wx(5), Ex(6)], gate: 5 },
  { id: '6-7', pts: [Wx(6), Ex(7)], gate: 6 },
  { id: '7-8', pts: [Wx(7), [Wx(7)[0] - 2.5, Wx(7)[1]], [Wx(7)[0] - 2.5, plaza(8)], Wx(8)], gate: 7 },
  { id: '8-9', pts: [Ex(8), [Ex(8)[0] + 2.5, Ex(8)[1]], [Ex(8)[0] + 2.5, plaza(9)], Ex(9)], gate: 8 },
  { id: '9-10', pts: [Wx(9), [Wx(9)[0] - 2.5, Wx(9)[1]], [Wx(9)[0] - 2.5, plaza(10)], Wx(10)], gate: 9 },
  { id: '10-0', pts: [Ex(10), Wx(0)], gate: 10 },
]
/** Ponto do meio de uma ponte (onde fica a névoa). */
export function bridgeMid(b: Bridge): P2 {
  const L: number[] = [0]
  for (let i = 1; i < b.pts.length; i++) L.push(L[i - 1] + Math.hypot(b.pts[i][0] - b.pts[i - 1][0], b.pts[i][1] - b.pts[i - 1][1]))
  const half = L[L.length - 1] / 2
  let i = 1; while (i < L.length - 1 && L[i] < half) i++
  const a = b.pts[i - 1], c = b.pts[i], k = (half - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1])
  return [a[0] + (c[0] - a[0]) * k, a[1] + (c[1] - a[1]) * k]
}
/** A casa (x, y) está em cima de alguma ponte? Devolve o índice. */
export function onBridge(x: number, y: number): number {
  for (let k = 0; k < BRIDGES.length; k++) {
    const p = BRIDGES[k].pts
    for (let i = 1; i < p.length; i++) {
      const x0 = Math.min(p[i - 1][0], p[i][0]) - 1.5, x1 = Math.max(p[i - 1][0], p[i][0]) + 1.5
      const y0 = Math.min(p[i - 1][1], p[i][1]) - 1.5, y1 = Math.max(p[i - 1][1], p[i][1]) + 1.5
      if (x + 0.5 >= x0 && x + 0.5 <= x1 && y + 0.5 >= y0 && y + 0.5 <= y1) return k
    }
  }
  return -1
}
