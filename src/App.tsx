import { useEffect, useState } from 'react'
import { G, hasSave, useGame } from './game/store'
import { Game } from './game/Game'
import { initAudio, playTheme, SFX } from './game/engine/audio'
import { LEVELS, resolveLevel } from './game/levels/registry'
import { VOICE } from './game/engine/voice'

function Title() {
  const [saved] = useState(hasSave())
  const level = useGame((s) => s.level)
  const start = (fresh: boolean) => {
    initAudio(); SFX.play('open')
    if (fresh) G().resetProgress()
    const lv = fresh ? 'quarto' : resolveLevel(G().level)
    useGame.setState({ screen: 'game', level: '', loading: lv, levelReady: null })
  }
  useEffect(() => {
    const first = () => { initAudio(); playTheme('title'); removeEventListener('pointerdown', first) }
    addEventListener('pointerdown', first)
    return () => removeEventListener('pointerdown', first)
  }, [])
  const L = LEVELS[resolveLevel(level)]
  return (
    <div className="title">
      <div className="bg" style={{ backgroundImage: 'url(/img/origens.webp)' }} />
      <div className="shade" />
      <div className="logo">
        <div className="l1">LLM</div>
        <div className="l2">THE PREDICTION FACTORY</div>
        <div className="l3">Uma pergunta, um raio… e o NEX foi parar dentro da IA. Ajude a Language Engine a recuperar a memória e encontre o caminho de volta para casa.</div>
      </div>
      <div className="menu">
        {saved && L && <button className="btn primary" onClick={() => start(false)}>Continuar · {L.title}</button>}
        <button className={'btn' + (saved ? '' : ' primary')} onClick={() => start(true)}>{saved ? 'Novo jogo' : 'Começar a aventura'}</button>
      </div>
      <div className="foot">Use fones para a melhor experiência{VOICE.ok ? ' · a NOVA lê os diálogos em voz alta' : ''} · <a href="/classico/">versão clássica</a></div>
    </div>
  )
}

export default function App() {
  const screen = useGame((s) => s.screen)
  return screen === 'title' ? <Title /> : <Game />
}
