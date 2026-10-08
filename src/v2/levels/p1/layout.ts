import { STOPS } from '../../content/stops'
import type { P2 } from '../../store'

/* =========================================================
   Posições da Linha do Tempo (casas do mapa isométrico).
   A estrada corre ao longo de x (desce para a direita na tela).
   Cada marco fica do lado de trás da estrada (y menor); na
   frente, só coisas baixas. A vila da parte 2 é maior.
   ========================================================= */
export const ROAD0 = 14, ROAD1 = 17 // casas da estrada: y = 14, 15, 16
export const H = 21
export const SPAN = STOPS.map((s) => (s.custom === 'graos' ? 26 : 10))
const X0: number[] = []
{ let x = 11; for (const sp of SPAN) { X0.push(x); x += sp } }
export const SEG = (i: number): [number, number] => [X0[i], X0[i] + SPAN[i]]
export const XC = (i: number) => X0[i] + SPAN[i] / 2
export const FOG_X = (i: number) => X0[i] + SPAN[i]
export const HOLO_P = (i: number): P2 => [XC(i) + 0.5, 9.5]
export const CONSOLE_P = (i: number): P2 => [XC(i) - 3.3, 12.5]
export const USE_P = (i: number): P2 => [XC(i) - 2.8, 14.2]
export const STAND_P = (i: number): P2 => [XC(i) - 0.9, 14.2]
export const NOVA_P = (i: number): P2 => [XC(i) - 2.6, 13.6]
export const EXTRA_P = (i: number): P2 => (STOPS[i].custom === 'graos' ? [VILLAGE.x0 + 23.2, 12.2] : [XC(i) + 3.0, 12.3])
export const PLAQUE_P = (i: number): P2 => (STOPS[i].custom === 'graos' ? [VILLAGE.x0 + 3.6, 17.5] : [X0[i] + 1.6, 6.3])

const X_END = FOG_X(STOPS.length - 1)
export const START: P2 = [4, 15.5]
export const CORE: P2 = [X_END + 6, 11]
export const CORE_USE: P2 = [X_END + 6.5, 14.6]
export const PORTAL_P: P2 = [X_END + 15, 15.5]
export const PORTAL_USE: P2 = [X_END + 13.6, 15.5]
export const W = X_END + 19

/* ---------- a vila da parte 2 ---------- */
const GI = Math.max(0, STOPS.findIndex((s) => s.custom === 'graos'))
const vx = X0[GI]
export const VILLAGE = {
  i: GI,
  x0: vx, x1: vx + SPAN[GI],
  gate: vx + 2.2,
  boards: [vx + 4.6, vx + 6.6, vx + 8.6] as number[],
  boardY: 12.2,
  stall: [vx + 10.2, 11.3] as P2, // canto de trás do balcão (2,2 × 0,8)
  merchant: [vx + 12.9, 11.9] as P2,
  merchantUse: [vx + 12.0, 13.5] as P2,
  baskets: [[vx + 14.4, 11.9], [vx + 15.6, 11.9], [vx + 16.8, 11.9]] as P2[],
  scale: [vx + 18.1, 11.9] as P2,
  table: [vx + 19.6, 9.3] as P2, // canto de trás da mesa (2,4 × 1,2)
  tableUse: [vx + 20.8, 11.7] as P2,
  liu: [vx + 22.7, 8.9] as P2,
}
