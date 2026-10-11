import { PilotTest } from './ui/Pilot'
import { METRICS } from './engine/metrics'
import { useEffect, useMemo, useState } from 'react'
import { G, hasSave, useGame } from './store'
import { Game } from './Game'
import { initAudio, playTheme, SFX } from './engine/audio'
import { LEVELS, resolveLevel } from './levels/registry'
import { Chapters } from './ui/Menus'
import { VOICE } from './engine/voice'
import { personPix, NEX, novaPix } from './art/person'
import { Pix } from './engine/pix'

/** NEX e NOVA grandes, em pixel art, na tela inicial. */
function Hero() {
  const url = useMemo(() => {
    const p = new Pix(50, 34)
    p.blit(personPix(NEX, 'f', 0, 'idle'), 3, 2)
    p.blit(novaPix(false, false), 26, 4)
    return p.canvas().toDataURL()
  }, [])
  return <img className="hero" src={url} alt="NEX e NOVA" draggable={false} />
}

function Title() {
  const [saved] = useState(hasSave())
  const [chap, setChap] = useState(false)
  const level = useGame((s) => s.level)
  const issue = useGame((s) => s.saveIssue)
  const [pre, setPre] = useState(false)
  const start = (fresh: boolean, skipPilot = false) => {
    if (fresh && !skipPilot && G().settings.pilot && !METRICS.data.pre) { initAudio(); SFX.play('open'); setPre(true); return }
    initAudio(); SFX.play('open')
    if (fresh) G().resetProgress()
    useGame.setState({ saveIssue: null })
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
      <div className="bg" style={{ backgroundImage: 'url(/img/v2/mundo.webp)' }} />
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
        <button className="btn ghost" onClick={() => { initAudio(); SFX.play('click'); setChap(true) }}>Capítulos e missões</button>
        {issue && <div className="save-issue" role="status">{issue === 'corrompido' ? 'O progresso salvo estava danificado e não pôde ser lido. Uma cópia foi guardada, e o jogo começa do zero. Você pode ir direto a qualquer missão em “Capítulos e missões”.' : 'Parte do progresso salvo estava incompleta e foi ajustada. Se algo parecer fora do lugar, use “Capítulos e missões”.'}</div>}
      </div>
      {pre && <PilotTest kind="pre" onDone={() => { setPre(false); start(true, true) }} />}
      {chap && (
        <div className="modal" onClick={() => setChap(false)}>
          <div className="sheet" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}><Chapters close={() => setChap(false)} /></div>
        </div>
      )}
      <div className="foot">Use fones para a melhor experiência{VOICE.ok ? ' · a NOVA lê os diálogos em voz alta' : ''} · <a href="/3d/">versão 3D</a> · <a href="/classico/">versão clássica</a></div>
    </div>
  )
}

export default function App() {
  const screen = useGame((s) => s.screen)
  const st = useGame((s) => s.settings)
  // acessibilidade: tamanho do texto, contraste e movimento reduzido valem para toda a interface
  // modo piloto pelo link: ?piloto=1 liga, ?piloto=0 desliga
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('piloto')
    if (q === '1' || q === '0') useGame.setState({ settings: { ...G().settings, pilot: q === '1' } })
  }, [])
  useEffect(() => {
    const r = document.documentElement
    r.dataset.text = st.text || 'normal'
    r.dataset.contrast = st.contrast ? 'alto' : 'normal'
    r.classList.toggle('reduced', !!st.reduced)
  }, [st.text, st.contrast, st.reduced])
  return screen === 'title' ? <Title /> : <Game />
}
