import { RT, addInteract, emote, type Thing, type Sprite } from './runtime'
import { findPath } from './world'
import type { P2 } from '../store'
import { shadow } from '../art/core'

/* =========================================================
   Habitantes que andam pelo cenário (rotas em laço, param,
   olham para o NEX quando ele chega perto e podem conversar)
   e a fila de criaturinhas que segue o NEX.
   ========================================================= */
export interface Npc {
  id: string
  x: number; y: number; z?: number
  dir: { x: number; y: number }
  speed: number
  route: P2[] // pontos em laço
  idx: number
  pause: number // segundos parado no ponto
  waitT: number
  walkDist: number
  moving: boolean
  hop?: boolean // anda pulando (tokens, bits)
  fly?: number // altura de voo (drones)
  sprite: (n: Npc, frame: number) => Sprite | null
  hidden?: () => boolean
  talk?: () => void
  label?: string | (() => string)
  color?: string
  canTalk?: () => boolean
  stopNear?: number // para quando o NEX está a esta distância
  lastEmote?: number
}

export function makeNpc(o: Partial<Npc> & { id: string; route: P2[]; sprite: Npc['sprite'] }): Npc {
  const r = o.route
  return { x: r[0][0], y: r[0][1], dir: { x: 1, y: 1 }, speed: 1.2, idx: 1 % r.length, pause: 1.2, waitT: Math.random() * 2, walkDist: 0, moving: false, stopNear: o.talk ? 1.8 : 0, ...o }
}

/** Liga a rota passando só por casas livres (usa o A* da fase). */
export function routeOnGround(points: P2[]): P2[] {
  const sc = RT.scene
  if (!sc) return points
  const out: P2[] = []
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length]
    const path = findPath(sc, a, b, 3000)
    out.push(a)
    if (path) for (let k = 0; k < path.length - 1; k++) out.push(path[k])
  }
  return out
}

export function updateNpcs(list: Npc[], dt: number) {
  for (const n of list) {
    if (n.hidden?.()) continue
    const dp = Math.hypot(RT.player.x - n.x, RT.player.y - n.y)
    if (n.stopNear && dp < n.stopNear) {
      n.moving = false
      const dx = RT.player.x - n.x, dy = RT.player.y - n.y
      if (Math.hypot(dx, dy) > 0.05) n.dir = { x: dx, y: dy }
      if (n.talk && (!n.lastEmote || RT.time - n.lastEmote > 9)) { n.lastEmote = RT.time; emote('…', () => ({ x: n.x, y: n.y, z: (n.fly ?? 0) + 34 }), 1.2) }
      continue
    }
    if (n.waitT > 0) { n.waitT -= dt; n.moving = false; continue }
    const t = n.route[n.idx]
    const dx = t[0] - n.x, dy = t[1] - n.y, d = Math.hypot(dx, dy)
    if (d < 0.06) { n.idx = (n.idx + 1) % n.route.length; if (n.pause > 0 && Math.random() < 0.35) n.waitT = n.pause * (0.5 + Math.random()); continue }
    const step = Math.min(d, n.speed * dt)
    n.x += (dx / d) * step; n.y += (dy / d) * step
    n.walkDist += step; n.moving = true
    n.dir = { x: dx, y: dy }
  }
}

/** A coisa desenhável de um habitante. */
export function npcThing(n: Npc): Thing {
  return {
    x: n.x, y: n.y,
    hidden: n.hidden,
    pos: () => ({ x: n.x, y: n.y, z: (n.fly ?? 0) + (n.hop && n.moving ? Math.abs(Math.sin(n.walkDist * 5)) * 5 : 0) + (n.fly ? Math.sin(RT.time * 2 + n.x) * 2 : 0) }),
    sprite: () => n.sprite(n, n.moving ? Math.floor(n.walkDist / 0.22) : Math.floor(RT.time * 2)),
  }
}
/** Sombra do habitante no chão (para quem voa ou pula). */
export function npcShadow(n: Npc, r = 4): Thing {
  return { x: n.x, y: n.y, layer: 'ground', hidden: n.hidden, pos: () => ({ x: n.x, y: n.y }), sprite: shadow(r), alpha: 0.7 }
}
/** Liga a conversa ao habitante (o ponto de uso acompanha ele). */
export function npcTalk(n: Npc) {
  if (!n.talk) return
  const it = addInteract({ id: 'npc_' + n.id, x: n.x, y: n.y, r: 1.4, label: n.label || 'Conversar', icon: 'talk', color: n.color || '#fff3d6', mz: (n.fly ?? 0) + 38, enabled: () => !n.hidden?.() && (n.canTalk ? n.canTalk() : true), use: () => n.talk!() })
  return it
}
/** Faz o ponto de conversa seguir o habitante (chamar a cada quadro). */
export function syncTalk(list: Npc[], interacts: Map<string, { x: number; y: number }>) {
  for (const n of list) { const it = interacts.get('npc_' + n.id); if (it) { it.x = n.x; it.y = n.y } }
}

/* ---------- fila que segue o NEX ---------- */
const STEP = 0.14
/** Guarda o rastro dos passos do NEX (chamar a cada quadro). */
export function recordTrail() {
  const tr = RT.trail, p = RT.player
  const last = tr[0]
  if (!last || Math.hypot(last[0] - p.x, last[1] - p.y) >= STEP) { tr.unshift([p.x, p.y]); if (tr.length > 400) tr.length = 400 }
}
/** Posição do k-ésimo seguidor (0 = o mais perto). */
export function followerPos(k: number, gap = 5) {
  const tr = RT.trail
  const i = Math.min(tr.length - 1, (k + 1) * gap)
  if (i < 0) return { x: RT.player.x - 0.5 * (k + 1), y: RT.player.y }
  return { x: tr[i][0], y: tr[i][1] }
}
