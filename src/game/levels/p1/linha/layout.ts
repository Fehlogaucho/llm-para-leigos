import { STOPS } from './stops'

/* =========================================================
   Posições da Linha do Tempo. Cada parada ocupa um trecho da
   estrada; a vila da parte 2 (O Mistério dos Três Grãos) é maior.
   ========================================================= */
export type V3 = [number, number, number]
export const SPAN = STOPS.map((s) => (s.custom === 'graos' ? 24 : 11))
const Z0: number[] = []
{ let z = -2.5; for (const sp of SPAN) { Z0.push(z); z -= sp } }
/** início (mais perto do começo) e fim do trecho da parada i */
export const SEG = (i: number): [number, number] => [Z0[i], Z0[i] - SPAN[i]]
export const STOP_Z = (i: number) => Z0[i] - SPAN[i] / 2
export const FOG_Z = (i: number) => Z0[i] - SPAN[i]
export const SIDE = (i: number) => (i % 2 === 0 ? -1 : 1)
export const HOLO_P = (i: number): V3 => [SIDE(i) * 7.4, 0, STOP_Z(i)]
export const USE_P = (i: number): V3 => [SIDE(i) * 4.9, 0, STOP_Z(i) - 1.3]
export const STAND_P = (i: number): V3 => [SIDE(i) * 4.5, 0.05, STOP_Z(i) + 0.3]
export const EXTRA_P = (i: number): V3 => (STOPS[i].custom === 'graos' ? [4.3, 0, VILLAGE.table[2] - 3.4] : [SIDE(i) * 8.6, 0, STOP_Z(i) + 3.2])

const Z_END = FOG_Z(STOPS.length - 1)
export const CORE_USE: V3 = [0, 0, Z_END - 5.1]
export const CORE: V3 = [0, 0, Z_END - 10.5]
export const PORTAL_P: V3 = [0, 0, Z_END - 19.5]
export const PORTAL_USE: V3 = [0, 0, Z_END - 17.5]
export const Z_BACK = Z_END - 26.5

/* ---------- a vila da parte 2 (lado direito da estrada) ---------- */
const GI = Math.max(0, STOPS.findIndex((s) => s.custom === 'graos'))
const [VZ0] = SEG(GI)
const vz = (dz: number) => VZ0 - dz // dz: metros depois do começo do trecho
export const VILLAGE = {
  i: GI,
  z0: VZ0, z1: VZ0 - SPAN[GI],
  gate: vz(2.7),
  boards: [vz(3.1), vz(5.3), vz(7.5)] as number[],
  boardX: 9.8,
  merchant: [7.2, 0, vz(9.5)] as V3,
  merchantUse: [4.3, 0, vz(9.5)] as V3,
  baskets: [[4.6, 0, vz(13.1)], [6.4, 0, vz(13.1)], [8.2, 0, vz(13.1)]] as V3[],
  scale: [9.7, 0, vz(13.3)] as V3,
  table: [6.6, 0, vz(18)] as V3,
  tableUse: [4.5, 0, vz(18)] as V3,
  liu: [9.1, 0, vz(18)] as V3,
}
