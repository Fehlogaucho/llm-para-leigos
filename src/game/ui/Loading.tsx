import { useEffect, useRef, useState } from 'react'
import { G, useGame } from '../store'
import { LEVELS } from '../levels/registry'

/** Tela de transição entre áreas: escurece, troca o nível, espera ele montar e revela. */
export function Loading() {
  const loading = useGame((s) => s.loading)
  const ready = useGame((s) => s.levelReady)
  const [vis, setVis] = useState(false)
  const [op, setOp] = useState(0)
  const t0 = useRef(0)
  useEffect(() => {
    if (!loading) return
    setVis(true); t0.current = performance.now()
    requestAnimationFrame(() => setOp(1))
    const id = setTimeout(() => { useGame.setState({ level: loading, levelReady: null }) }, 650)
    return () => clearTimeout(id)
  }, [loading])
  useEffect(() => {
    if (!loading || ready !== loading) return
    const wait = Math.max(300, 2200 - (performance.now() - t0.current))
    const id = setTimeout(() => {
      // libera os roteiros já no começo do esmaecimento: a cena de abertura começa
      // por baixo da tela de carregamento (antes, o jogador via o NEX parado antes da cena)
      setOp(0)
      const L = LEVELS[loading]
      useGame.setState({ loading: null })
      if (L) G().pushBanner({ kind: 'area', title: L.title, sub: `${L.kicker}|${L.sub}` })
      setTimeout(() => setVis(false), 650)
    }, wait)
    return () => clearTimeout(id)
  }, [ready, loading])
  if (!vis) return null
  const L = LEVELS[loading || G().level]
  return (
    <div className="loading" style={{ opacity: op }}>
      {L?.img && <div className="bg" style={{ backgroundImage: `url(${L.img})` }} />}
      <div className="shade" />
      {L && <>
        <div className="k">{L.kicker}</div>
        <div className="t">{L.title}</div>
        <div className="s">{L.sub}</div>
        <div className="bar"><i /></div>
        <div className="tip">{L.tip}</div>
      </>}
    </div>
  )
}
