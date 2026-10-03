import { useEffect } from 'react'
import { G, useGame, type Vec3 } from '../store'
import { RT } from './runtime'
import { INPUT } from './input'
import { playTheme } from './audio'
import { runScript, setLevelSignal, type Ctx } from './script'
import { LEVELS } from '../levels/registry'
import { COLL } from './collision'

export interface LevelOpts {
  spawn: Vec3
  yaw?: number
  minY?: number
  scripts?: ((c: Ctx) => Promise<void>)[]
}

/** Prepara a fase: posição inicial, trilha, roteiros (cancelados ao sair). */
export function useLevel(o: LevelOpts) {
  // useEffect (e não useLayoutEffect): se algo suspender dentro da fase (ex.: fonte 3D carregando),
  // o React esconde e mostra a árvore de novo sem cancelar os roteiros.
  useEffect(() => {
    const id = G().level
    const L = LEVELS[id]
    const sp = G().spawnOverride
    useGame.setState({ spawn: sp || { pos: o.spawn, yaw: o.yaw || 0 }, spawnSeq: G().spawnSeq + 1, objective: null, levelReady: id, spawnOverride: undefined })
    RT.minY = o.minY ?? -30
    COLL.dirty = true
    if (L) playTheme(L.theme)
    if (!G().visited.includes(id)) useGame.setState({ visited: [...G().visited, id] })
    const ac = new AbortController()
    setLevelSignal(ac.signal)
    ;(async () => {
      // espera a tela de carregamento sair
      await new Promise<void>((res) => { const t = () => { if (ac.signal.aborted) return; if (!G().loading) res(); else setTimeout(t, 100) }; t() })
      for (const s of o.scripts || []) runScript(s, ac.signal)
    })()
    return () => { ac.abort(); setLevelSignal(null); INPUT.tapTarget = null; INPUT.tapUse = null; RT.frozen = false; RT.lookAt = null; RT.novaLook = null; RT.nexScale = 1; RT.nexSpin = 0 }
  }, [])
}
