import { G, useGame, type P2 } from '../store'
import { RT, INTERACTS, burst, type Interact } from './runtime'
import { findPath } from './world'
import { SFX } from './audio'

/* =========================================================
   Viagem rápida: leva o NEX direto até o objetivo atual (com
   um clarão de teletransporte) e já começa a missão de lá.
   Só vai aonde dá para andar: barreiras e névoas fechadas
   continuam valendo, então a ordem das missões não muda.
   ========================================================= */
export const TRAVEL = { busy: false }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** O objeto que o objetivo pede para usar (o mais perto do alvo). */
function targetInteract(t: P2): Interact | null {
  let best: Interact | null = null, bd = 1.8
  for (const it of INTERACTS.values()) {
    if (!it.enabled()) continue
    const d = Math.hypot(it.x - t[0], it.y - t[1])
    if (d < bd) { bd = d; best = it }
  }
  return best
}
/** Faixas que ficam sempre na tela (não são painéis abertos). */
const HUD_STRIPS = new Set(['l1mem', 'p2strip'])
/** Dá para viajar agora? (sem diálogo, cena, menu ou painel aberto). */
export function travelReady(): boolean {
  const g = G()
  return !!RT.scene && !!g.objective?.target && !TRAVEL.busy && !RT.frozen && !g.cine && !g.focus && !g.menu && !g.loading && !(g.dialog && !g.dialog.ambient) && !Object.keys(g.overlays).some((k) => !HUD_STRIPS.has(k))
}
export function objectiveDistance(): number {
  const t = G().objective?.target
  return t ? Math.hypot(t[0] - RT.player.x, t[1] - RT.player.y) : 0
}

/** Viaja até o objetivo atual. Devolve false se o caminho ainda estiver fechado. */
export async function travelToObjective(): Promise<boolean> {
  const o = G().objective, t = o?.target
  if (!t || !RT.scene || !travelReady()) return false
  const u = o?.use ? INTERACTS.get(o.use) : undefined
  const it = u && u.enabled() ? u : targetInteract(t)
  const ok = await travelTo(it ? [it.x, it.y] : t, it)
  if (ok && it && it.enabled() && !RT.frozen && Math.hypot(RT.player.x - it.x, RT.player.y - it.y) < it.r + 0.3) it.use()
  return ok
}

/** Teletransporta o NEX para perto de goal (pelo caminho que existe), com o clarão. Usado também pelos roteiros. */
export async function travelTo(goal: P2, it?: Interact | null): Promise<boolean> {
  const sc = RT.scene
  if (!sc || TRAVEL.busy) return false
  const path = findPath(sc, [RT.player.x, RT.player.y], goal)
  if (!path || !path.length) { G().showToast('Ainda não dá para chegar lá. Termine a missão de antes.'); SFX.play('error'); return false }
  // para um pouco antes do objeto, como no toque na tela
  if (it) while (path.length > 1 && Math.hypot(path[path.length - 2][0] - it.x, path[path.length - 2][1] - it.y) < it.r * 0.7) path.pop()
  const end = path[path.length - 1]
  if (Math.hypot(end[0] - RT.player.x, end[1] - RT.player.y) < 1.2) return true
  TRAVEL.busy = true
  RT.path = null; RT.tapUse = null
  const reduced = G().settings.reduced
  try {
    SFX.play('whoosh')
    if (!reduced) burst(RT.player.x, RT.player.y, 16, 22, ['#9fe9ff', '#ffffff', '#ffd27a'], { spd: 1.4, up: 70, life: 0.7, g: 30 })
    useGame.setState({ warp: performance.now() })
    await sleep(reduced ? 140 : 240)
    // o caminho percorrido vira o rastro (quem segue o NEX chega junto, atrás dele)
    const pts = [[RT.player.x, RT.player.y] as P2, ...path]
    const trail: P2[] = []
    for (let i = pts.length - 1; i > 0 && trail.length < 300; i--) {
      const a = pts[i], b = pts[i - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1])
      for (let s = 0; s < L && trail.length < 300; s += 0.14) trail.push([a[0] + ((b[0] - a[0]) * s) / (L || 1), a[1] + ((b[1] - a[1]) * s) / (L || 1)])
    }
    RT.trail = trail
    RT.player.x = end[0]; RT.player.y = end[1]
    RT.cam.x = end[0]; RT.cam.y = end[1]
    RT.nova.x = end[0] - 0.8; RT.nova.y = end[1] - 0.4
    const face = it ? [it.x, it.y] : goal
    { const dx = face[0] - end[0], dy = face[1] - end[1]; if (Math.hypot(dx, dy) > 0.05) RT.dir = { x: dx, y: dy } }
    if (!reduced) burst(end[0], end[1], 6, 26, ['#9fe9ff', '#ffffff', '#ffd27a'], { spd: 1.8, up: 50, life: 0.8, g: 60 })
    SFX.play('chime')
    await sleep(reduced ? 120 : 280)
  } finally { TRAVEL.busy = false }
  return true
}
