import { P, PATHS, riverZ, terrainH, ellip, rng, type V3 } from './terrain'

/* Dados de layout do Campo (sem React): grupos, coletáveis, árvores. */

/** Cristais dourados coletáveis (missão: 12 cristais). */
export const GOLD: [number, number][] = [
  [8, 26], [-9, 24], [15.5, 31], [-16, 31], [5, 18], [-5, 13], [18, 20], [-20, 17],
  [11, 9], [-12, 6], [24, 39], [-24, 41], [21, 11], [-27, 23], [3, 5], [-14, 47],
]
/** Pedras com símbolos (side quest O Número Escondido). */
export const SYMS = {
  tally: [24, 0, riverZ(24) + 7.6] as V3,
  roman: [7, 0.15, -36.25] as V3,
  maya: [-29, 0, -30.6] as V3,
  baby: [-37, 0, 21.5] as V3,
}
/** Árvores do pomar (oeste) e outras árvores do vale. */
export const ORCHARD: [number, number][] = [[-30, 40], [-38, 36], [-44, 30], [-34, 30.5], [-42, 20], [-48, 12], [-28, 16], [-40, 10], [-50, 24], [-22, 46], [-46, 40]]
export const TREES: [number, number, 'round' | 'cypress' | 'olive', number][] = [
  [20, 48, 'round', 1.3], [32, 44, 'cypress', 1.2], [40, 34, 'round', 1.4], [50, 20, 'olive', 1.3], [52, 6, 'round', 1.5], [-56, 2, 'cypress', 1.3],
  [14, 56, 'cypress', 1.1], [-14, 58, 'cypress', 1.1], [-8, 54, 'olive', 1], [9, 52, 'olive', 1], [44, 46, 'round', 1.5], [-54, 34, 'round', 1.6],
  [-18, -20, 'olive', 1.2], [18, -18, 'olive', 1.2], [-22, -44, 'round', 1.4], [24, -26, 'round', 1.3], [30, -52, 'cypress', 1.3], [38, -28, 'cypress', 1.2],
  [56, -36, 'cypress', 1.3], [58, -48, 'cypress', 1.2], [-58, -30, 'round', 1.5], [-30, -52, 'olive', 1.2], [-58, -14, 'olive', 1.3], [60, -10, 'round', 1.5],
  [16, -44, 'olive', 1.1], [-16, -46, 'cypress', 1.2],
]
export const FORMATIONS: [number, number, number][] = [
  [-22, 4, 1], [28, 2, 1.1], [-46, 2, 1.2], [46, 2, 1], [34, 18, 0.9], [-12, -12, 0.9], [14, -14, 1.1], [-30, -20, 1.2],
  [30, -18, 1], [-54, -44, 1.3], [-36, -46, 1.1], [52, -24, 1], [22, -46, 1.2], [-20, -60, 1.4], [20, -62, 1.4], [42, 26, 0.8],
  [-50, 44, 1], [54, 34, 1.1],
]

type Kind = 'crystal' | 'stone' | 'apple' | 'orange' | 'torch'
export interface Cluster { kind: Kind; x: number; z: number; y: number; n: number; top: number }

function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax, dz = bz - az
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t))
}

/** true se o ponto está livre (fora de construções, trilhas, rio...). */
export function freeSpot(x: number, z: number, pad = 0, edge = false) {
  if (!edge && ellip(x, z) > 0.9) return false
  if (Math.abs(z - riverZ(x)) < 7 + pad) return false
  if (Math.hypot(x - P.plaza[0], z - P.plaza[2]) < 14.5 + pad) return false
  if (Math.hypot(x, z - 64) < 10 + pad) return false
  if (x > -15 - pad && x < 15 + pad && z > -40 - pad && z < -16 + pad) return false
  if (Math.hypot(x - P.cave[0], z - P.cave[2]) < 15 + pad) return false
  if (x > 26 - pad && x < 57 + pad && z > -51 - pad && z < -29 + pad) return false
  if (Math.abs(x) < 25 + pad && z < -41 + pad) return false
  for (const [ax, az, bx, bz, w] of PATHS) if (segDist(x, z, ax, az, bx, bz) < w / 2 + 1.3 + pad) return false
  for (const [gx, gz] of GOLD) if (Math.hypot(x - gx, z - gz) < 2.6) return false
  for (const s of Object.values(SYMS)) if (Math.hypot(x - s[0], z - s[2]) < 3.2) return false
  for (const [tx, tz] of ORCHARD) if (Math.hypot(x - tx, z - tz) < 2.6) return false
  for (const [tx, tz] of TREES) if (Math.hypot(x - tx, z - tz) < 2.4) return false
  for (const [fx, fz, s] of FORMATIONS) if (Math.hypot(x - fx, z - fz) < 2.4 * s + 0.8) return false
  return true
}

/** raio aproximado de um grupo com n objetos */
export const clusterR = (kind: Kind, n: number) => kind === 'torch' ? 0.6 + n * 0.2 : (kind === 'crystal' ? 0.34 : kind === 'stone' ? 0.42 : 0.26) * Math.sqrt(n) + 0.3

export const CLUSTERS: Cluster[] = (() => {
  const r = rng(2024)
  const out: Cluster[] = []
  const counts = [3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 10, 10, 11, 12, 12, 13, 14, 15, 16, 18, 20, 20, 24, 25, 30]
  for (let gx = -62; gx <= 62; gx += 5.6) {
    for (let gz = -56; gz <= 58; gz += 5.6) {
      const x = gx + (r() - 0.5) * 4, z = gz + (r() - 0.5) * 4
      if (r() < 0.16) continue
      let kind: Kind
      const q = r()
      if (z > 4) {
        if (x < -18 && z > 6) kind = q < 0.5 ? 'apple' : q < 0.85 ? 'orange' : 'stone'
        else if (x > 18) kind = q < 0.45 ? 'crystal' : q < 0.72 ? 'torch' : 'stone'
        else kind = q < 0.4 ? 'stone' : q < 0.75 ? 'crystal' : 'apple'
      } else {
        if (x < -18) kind = q < 0.6 ? 'crystal' : 'stone'
        else if (x > 18) kind = q < 0.45 ? 'torch' : 'crystal'
        else kind = q < 0.6 ? 'stone' : 'crystal'
      }
      let n = counts[Math.floor(r() * counts.length)]
      if (kind === 'torch') n = Math.min(n, 12)
      const rad = clusterR(kind, n)
      if (!freeSpot(x, z, rad)) continue
      if (out.some((c) => Math.hypot(c.x - x, c.z - z) < clusterR(c.kind, c.n) + rad + 0.9)) continue
      const y = terrainH(x, z)
      const top = kind === 'torch' ? 1.6 : kind === 'crystal' ? 1.25 : kind === 'stone' ? 0.95 : 0.5
      out.push({ kind, x, z, y, n, top: y + top })
    }
  }
  return out
})()
