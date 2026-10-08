import type { Scene } from './runtime'
import type { P2 } from '../store'

/* =========================================================
   Chão andável, colisão e caminho (A*) no mapa de casas.
   ========================================================= */
export function buildWalk(sc: Scene) {
  const walk = new Uint8Array(sc.w * sc.h)
  for (let y = 0; y < sc.h; y++) for (let x = 0; x < sc.w; x++) walk[y * sc.w + x] = sc.ground(x, y) && !sc.noWalk?.(x, y) ? 1 : 0
  for (const t of sc.things) {
    if (!t.solid) continue
    if (t.w == null && t.d == null) { const x = Math.floor(t.x), y = Math.floor(t.y); if (x >= 0 && y >= 0 && x < sc.w && y < sc.h) walk[y * sc.w + x] = 0; continue } // coisa pontual: só a casa dela
    const w = t.w ?? 1, d = t.d ?? 1
    for (let y = Math.floor(t.y); y < Math.ceil(t.y + d - 1e-6); y++) for (let x = Math.floor(t.x); x < Math.ceil(t.x + w - 1e-6); x++) if (x >= 0 && y >= 0 && x < sc.w && y < sc.h) walk[y * sc.w + x] = 0
  }
  sc.walk = walk
}

export function cellFree(sc: Scene, x: number, y: number) {
  if (x < 0 || y < 0 || x >= sc.w || y >= sc.h || !sc.walk || !sc.walk[y * sc.w + x]) return false
  if (sc.blockers) for (const b of sc.blockers) if (x + 1 > b.x0 && x < b.x1 && y + 1 > b.y0 && y < b.y1 && b.on()) return false
  return true
}

/** O círculo (quadrado) de raio r em (x, y) cabe só em casas livres? */
export function fits(sc: Scene, x: number, y: number, r = 0.22) {
  const x0 = Math.floor(x - r), x1 = Math.floor(x + r), y0 = Math.floor(y - r), y1 = Math.floor(y + r)
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) if (!cellFree(sc, cx, cy)) return false
  return true
}

/** Anda com deslize nas paredes. Devolve a nova posição. */
export function moveWithCollision(sc: Scene, p: { x: number; y: number }, dx: number, dy: number, r = 0.22) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 0.1))
  const sx = dx / steps, sy = dy / steps
  // se já está preso (por exemplo, colocado por uma cena perto de algo), deixa sair
  if (!fits(sc, p.x, p.y, r)) {
    const nx = p.x + dx, ny = p.y + dy
    if (cellFree(sc, Math.floor(nx), Math.floor(ny))) { p.x = nx; p.y = ny }
    return p
  }
  for (let i = 0; i < steps; i++) {
    if (fits(sc, p.x + sx, p.y, r)) p.x += sx
    if (fits(sc, p.x, p.y + sy, r)) p.y += sy
  }
  return p
}

/** Caminho de casa em casa (8 direções, sem cortar quinas). */
export function findPath(sc: Scene, from: P2, to: P2, maxNodes = 6000): P2[] | null {
  const W = sc.w, sx = Math.floor(from[0]), sy = Math.floor(from[1])
  let tx = Math.floor(to[0]), ty = Math.floor(to[1])
  if (!cellFree(sc, tx, ty)) {
    // procura a casa livre mais perto do alvo
    let best: [number, number] | null = null, bd = 1e9
    for (let r = 1; r <= 3 && !best; r++) for (let yy = ty - r; yy <= ty + r; yy++) for (let xx = tx - r; xx <= tx + r; xx++) {
      if (!cellFree(sc, xx, yy)) continue
      const dd = Math.hypot(xx - tx, yy - ty); if (dd < bd) { bd = dd; best = [xx, yy] }
    }
    if (!best) return null
    tx = best[0]; ty = best[1]; to = [tx + 0.5, ty + 0.5]
  }
  const key = (x: number, y: number) => y * W + x
  const g = new Map<number, number>(), came = new Map<number, number>()
  const open: [number, number, number][] = [] // f, x, y
  const h = (x: number, y: number) => Math.hypot(x - tx, y - ty)
  g.set(key(sx, sy), 0); open.push([h(sx, sy), sx, sy])
  let n = 0
  while (open.length && n++ < maxNodes) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i
    const [, x, y] = open.splice(bi, 1)[0]
    if (x === tx && y === ty) {
      const out: P2[] = [to]
      let k = came.get(key(x, y))
      while (k !== undefined && k !== key(sx, sy)) { out.push([(k % W) + 0.5, Math.floor(k / W) + 0.5]); k = came.get(k) }
      return out.reverse()
    }
    const gc = g.get(key(x, y))!
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue
      const nx = x + dx, ny = y + dy
      if (!cellFree(sc, nx, ny)) continue
      if (dx && dy && (!cellFree(sc, x + dx, y) || !cellFree(sc, x, y + dy))) continue
      const ng = gc + (dx && dy ? 1.414 : 1), k = key(nx, ny)
      if (ng < (g.get(k) ?? 1e9)) { g.set(k, ng); came.set(k, key(x, y)); open.push([ng + h(nx, ny), nx, ny]) }
    }
  }
  return null
}
