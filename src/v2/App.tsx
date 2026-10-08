import { useEffect, useMemo, useState } from 'react'
import { G, hasSave, useGame } from './store'
import { Game } from './Game'
import { initAudio, playTheme, SFX } from './engine/audio'
import { LEVELS, resolveLevel } from './levels/registry'
import { VOICE } from './engine/voice'
import { personPix, NEX, novaPix } from './art/person'
import { Pix } from './engine/pix'

/** NEX e NOVA grandes, em pixel art, na tela inicial. */
function Hero() {
  const url = useMemo(() => {
    const p = new Pix(46, 34)
    p.blit(personPix(NEX, 'f', 0, 'idle'), 4, 2)
    p.blit(novaPix(false, false), 27, 3)
    return p.canvas().toDataURL()
  }, [])
  return <img className="hero" src={url} alt="NEX e NOVA" draggable={false} />
}

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
    <div className="title px">
      <div className="bg" style={{ backgroundImage: 'url(/img/origens.webp)' }} />
      <div className="shade" />
      <div className="logo">
        <Hero />
        <div className="l1">LLM</div>
        <div className="l2">THE PREDICTION FACTORY</div>
        <div className="l3">Uma pergunta, um raio… e o NEX foi parar dentro da IA. Ajude a Language Engine a recuperar a memória e encontre o caminho de volta para casa.</div>
      </div>
      <div className="menu">
        {saved && L && <button className="btn primary" onClick={() => start(false)}>Continuar · {L.title}</button>}
        <button className={'btn' + (saved ? '' : ' primary')} onClick={() => start(true)}>{saved ? 'Novo jogo' : 'Começar a aventura'}</button>
      </div>
      <div className="foot">Use fones para a melhor experiência{VOICE.ok ? ' · a NOVA lê os diálogos em voz alta' : ''} · <a href="/3d/">versão 3D</a> · <a href="/classico/">versão clássica</a></div>
    </div>
  )
}

export default function App() {
  const screen = useGame((s) => s.screen)
  return screen === 'title' ? <Title /> : <Game />
}
