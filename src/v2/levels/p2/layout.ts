import type { P2 } from '../../store'
import type { ZoneId } from './zones'

/* =========================================================
   A planta da Fábrica de Previsões: 3×3 salas de 14×12 casas
   (a Sala do Prompt no meio) ligadas por corredores de 6 casas.
   Os corredores do anel têm esteira no meio (empurra o NEX no
   sentido da visita) e uma barreira de energia que se apaga
   quando a estação anterior volta a funcionar.
   ========================================================= */
export const W = 62, H = 56
export const ZW = 14, ZH = 12
const ZX = (cx: number) => 3 + cx * 20, ZY = (cy: number) => 3 + cy * 18
export type Room = ZoneId | 'centro'
export const CELL: Record<Room, [number, number]> = { prever: [1, 0], tokens: [2, 0], vetores: [2, 1], atencao: [2, 2], camadas: [1, 2], roleta: [0, 2], treino: [0, 1], rag: [0, 0], centro: [1, 1] }
/** Canto de trás de uma sala. */
export const ZO = (r: Room): P2 => [ZX(CELL[r][0]), ZY(CELL[r][1])]

export interface Corr { id: string; a: Room; b: Room; gate: number; belt: boolean; axis: 'x' | 'y'; dir: 1 | -1; x0: number; y0: number; x1: number; y1: number; mid: P2 }
function corr(a: Room, b: Room, gate: number, belt: boolean): Corr {
  const [ax, ay] = CELL[a], [bx, by] = CELL[b]
  if (ay === by) {
    const l = Math.min(ax, bx), x0 = ZX(l) + ZW, x1 = ZX(l + 1), y0 = ZY(ay) + 5
    return { id: `${a}-${b}`, a, b, gate, belt, axis: 'x', dir: bx > ax ? 1 : -1, x0, y0, x1, y1: y0 + 3, mid: [(x0 + x1) / 2, y0 + 1.5] }
  }
  const t = Math.min(ay, by), y0 = ZY(t) + ZH, y1 = ZY(t + 1), x0 = ZX(ax) + 6
  return { id: `${a}-${b}`, a, b, gate, belt, axis: 'y', dir: by > ay ? 1 : -1, x0, y0, x1: x0 + 3, y1, mid: [x0 + 1.5, (y0 + y1) / 2] }
}
/** gate: índice da estação que abre o corredor (−1 = sempre aberto). */
export const CORRS: Corr[] = [
  corr('centro', 'prever', -1, true),
  corr('prever', 'tokens', 0, true),
  corr('tokens', 'vetores', 1, true),
  corr('vetores', 'atencao', 2, true),
  corr('atencao', 'camadas', 3, true),
  corr('camadas', 'roleta', 4, true),
  corr('roleta', 'treino', 5, true),
  corr('treino', 'rag', 6, true),
  corr('rag', 'prever', 7, true),
  // atalhos de volta para a Sala do Prompt
  corr('centro', 'vetores', 2, false),
  corr('centro', 'camadas', 4, false),
  corr('treino', 'centro', 6, false),
]
export const inCorr = (c: Corr, x: number, y: number) => x >= c.x0 && x < c.x1 && y >= c.y0 && y < c.y1
/** A faixa do meio do corredor (onde fica a esteira). */
export const beltLane = (c: Corr, x: number, y: number) => (c.axis === 'x' ? y === c.y0 + 1 : x === c.x0 + 1)

/* ---------- Sala do Prompt ---------- */
const [cx0, cy0] = ZO('centro')
export const START: P2 = [cx0 + 7, cy0 + 9.2]
export const MACHINE: P2 = [cx0 + 5.5, cy0 + 2.6]
export const PROMPT_USE: P2 = [cx0 + 7, cy0 + 6.4]
export const PORTAL_P: P2 = [cx0 + 11.6, cy0 + 9.6]
export const PORTAL_USE: P2 = [cx0 + 10.4, cy0 + 9.4]
