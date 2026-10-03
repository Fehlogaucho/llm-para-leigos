import * as THREE from 'three'
import { G, useGame, type Line, type Shot, type Vec3 } from '../store'
import { RT, gesture } from './runtime'
import { FOCUS } from './CameraRig'
import { SFX } from './audio'
import { CODEX } from '../content/codex'

export class Aborted extends Error { constructor() { super('aborted') } }

/** API usada pelos roteiros das fases (história, missões, side quests). */
export interface Ctx {
  signal: AbortSignal
  say: (lines: Line[] | Line, opts?: { ambient?: boolean }) => Promise<void>
  objective: (text: string | null, target?: Vec3) => void
  reach: (pos: Vec3, r?: number) => Promise<void>
  wait: (sec: number) => Promise<void>
  until: (fn: () => boolean) => Promise<void>
  waitFlag: (k: string, v?: number) => Promise<void>
  cinematic: (shots: Shot[], skippable?: boolean) => Promise<void>
  focus: (pos: Vec3, look: Vec3, fov?: number) => void
  unfocus: () => void
  discover: (id: string, lvl?: number) => void
  fragment: (id: string, title: string) => void
  core: (id: string, title: string) => void
  quest: (id: string, st: 'active' | 'done', title?: string) => void
  flag: (k: string) => number
  setFlag: (k: string, v?: number) => void
  goto: (level: string) => void
  banner: (title: string, sub?: string) => void
  freeze: (on: boolean) => void
  run: (fn: (c: Ctx) => Promise<void>) => Promise<void>
}

export function makeCtx(signal: AbortSignal): Ctx {
  const check = () => { if (signal.aborted) throw new Aborted() }
  const until = (fn: () => boolean) => new Promise<void>((res, rej) => {
    const tick = () => {
      if (signal.aborted) return rej(new Aborted())
      let ok = false
      try { ok = fn() } catch (e) { return rej(e) }
      if (ok) res(); else requestAnimationFrame(tick)
    }
    tick()
  })
  const c: Ctx = {
    signal,
    say: async (lines, opts = {}) => {
      check()
      const arr = Array.isArray(lines) ? lines : [lines]
      // espera o diálogo anterior terminar
      await until(() => !G().dialog)
      await new Promise<void>((resolve, rej) => {
        const onAbort = () => { if (G().dialog?.resolve === done) useGame.setState({ dialog: null }); rej(new Aborted()) }
        const done = () => { signal.removeEventListener('abort', onAbort); resolve() }
        signal.addEventListener('abort', onAbort, { once: true })
        useGame.setState({ dialog: { lines: arr, i: 0, ambient: !!opts.ambient, resolve: done } })
      })
    },
    objective: (text, target) => { useGame.setState({ objective: text ? { text, target } : null }); if (text) SFX.play('tick') },
    reach: (pos, r = 2.5) => { const p = new THREE.Vector3(...pos); return until(() => Math.hypot(RT.player.x - p.x, RT.player.z - p.z) < r && Math.abs(RT.player.y - p.y) < 3) },
    wait: (sec) => new Promise<void>((res, rej) => {
      const id = setTimeout(() => { signal.removeEventListener('abort', ab); res() }, sec * 1000)
      const ab = () => { clearTimeout(id); rej(new Aborted()) }
      signal.addEventListener('abort', ab, { once: true })
    }),
    until,
    waitFlag: (k, v = 1) => until(() => (G().flags[k] || 0) >= v),
    cinematic: async (shots, skippable = true) => {
      check()
      await new Promise<void>((resolve) => useGame.setState({ cine: { shots, t0: performance.now(), resolve, skippable } }))
      check()
    },
    focus: (pos, look, fov = 50) => { FOCUS.pos.set(...pos); FOCUS.look.set(...look); FOCUS.fov = fov; FOCUS.active = true; useGame.setState({ focus: true }) },
    unfocus: () => { FOCUS.active = false; useGame.setState({ focus: false }) },
    discover: (id, lvl = 1) => {
      const isNew = G().discover(id, lvl)
      const e = CODEX[id]
      if (isNew && e) { G().pushBanner({ kind: 'discovery', title: e.title, sub: e.short, cat: e.cat }); SFX.play('discover') }
    },
    fragment: (id, title) => { if (G().fragments.includes(id)) return; G().addFragment(id); G().pushBanner({ kind: 'fragment', title, sub: 'Fragmento recuperado' }); SFX.play('chime'); gesture('cheer', 1.6) },
    core: (id, title) => { G().addCore(id); G().pushBanner({ kind: 'core', title, sub: 'Núcleo da Language Engine recuperado' }); SFX.play('core'); gesture('cheer', 2.2) },
    quest: (id, st, title) => {
      const was = G().quests[id]
      if (was === st || was === 'done') return
      G().setQuest(id, st)
      if (title) { G().pushBanner({ kind: 'quest', title, sub: st === 'done' ? 'Side quest concluída' : 'Nova side quest' }); SFX.play(st === 'done' ? 'success' : 'open') }
    },
    flag: (k) => G().flags[k] || 0,
    setFlag: (k, v = 1) => G().setFlag(k, v),
    goto: (level) => gotoLevel(level),
    banner: (title, sub) => G().pushBanner({ kind: 'area', title, sub }),
    freeze: (on) => { RT.frozen = on },
    run: async (fn) => { try { await fn(c) } catch (e) { if (!(e instanceof Aborted)) console.error(e) } },
  }
  return c
}

/** Sinal da fase atual: roteiros iniciados por objetos (onUse) são cancelados quando a fase acaba. */
let levelSignal: AbortSignal | null = null
const busy = new Set<string>()
export function setLevelSignal(s: AbortSignal | null) { levelSignal = s; busy.clear() }
/** Inicia um roteiro a partir de um objeto do mundo; não deixa o mesmo rodar duas vezes ao mesmo tempo. */
export function start(id: string, fn: (c: Ctx) => Promise<void>) {
  if (!levelSignal || busy.has(id)) return
  busy.add(id)
  runScript(fn, levelSignal).finally(() => busy.delete(id))
}
export const isBusy = (id: string) => busy.has(id)

/** Executa um roteiro, engolindo o cancelamento (quando o jogador sai da fase). */
export async function runScript(fn: (c: Ctx) => Promise<void>, signal: AbortSignal) {
  const c = makeCtx(signal)
  try { await fn(c) } catch (e) { if (!(e instanceof Aborted)) console.error(e) }
}

export function gotoLevel(level: string) {
  const g = G()
  if (g.loading) return
  useGame.setState({ loading: level, dialog: null, focus: false, cine: null, prompt: null })
  FOCUS.active = false
  RT.frozen = false
  SFX.play('portal')
}

/** Contexto avulso (para descobertas e missões disparadas fora de um roteiro). */
export const QUICK = makeCtx(new AbortController().signal)
