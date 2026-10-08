import { useEffect, useRef, useState } from 'react'
import { G, useGame, type Line } from '../store'
import { RT } from '../engine/runtime'
import { VOICE } from '../engine/voice'
import { SFX } from '../engine/audio'
import { INPUT } from '../engine/input'
import { Face, SPEAKERS } from './Icons'

const NAMES: Record<string, string> = { NOVA: 'NOVA', NEX: 'NEX', ENGINE: 'LANGUAGE ENGINE', HALLUCINO: 'HALLUCINO', SISTEMA: '' }

/** Caixa de diálogo: digita o texto, lê em voz alta, mostra escolhas. */
export function Dialogue() {
  const d = useGame((s) => s.dialog)
  const voiceOn = useGame((s) => s.settings.voice)
  const [shown, setShown] = useState(0)
  const st = useRef({ voiceDone: false, timer: 0 as any, lineKey: '' })
  const line: Line | null = d ? d.lines[d.i] : null
  const full = line?.text || ''
  const typing = shown < full.length

  // nova fala
  useEffect(() => {
    if (!d || !line) { RT.novaTalking = 0; RT.nexTalking = 0; return }
    setShown(0)
    st.current.voiceDone = false
    RT.novaTalking = line.who === 'NOVA' ? 1 : 0
    RT.nexTalking = line.who === 'NEX' ? 1 : 0
    const spoke = VOICE.speak(full, line.who, () => { st.current.voiceDone = true; RT.novaTalking = 0; RT.nexTalking = 0 })
    if (!spoke) st.current.voiceDone = true
    return () => { clearTimeout(st.current.timer) }
  }, [d?.lines, d?.i])

  // máquina de escrever
  useEffect(() => {
    if (!d || !typing) return
    const id = setTimeout(() => {
      setShown((n) => Math.min(full.length, n + 2))
      if (shown % 6 === 0) SFX.play(line?.who === 'NEX' ? 'nex' : 'talk')
    }, 26)
    return () => clearTimeout(id)
  }, [d, shown, typing, full])

  // modo ambiente: avança sozinho
  useEffect(() => {
    if (!d || !d.ambient || typing || line?.choices) return
    const min = Math.max(1600, full.length * 48)
    const t0 = performance.now()
    const id = setInterval(() => {
      const el = performance.now() - t0
      if ((st.current.voiceDone || !voiceOn) && el > min * (voiceOn ? 0.35 : 1)) { clearInterval(id); advance() }
      else if (el > min * 2.2) { clearInterval(id); advance() }
    }, 200)
    return () => clearInterval(id)
  }, [d, typing])

  // tecla de interação avança
  useEffect(() => {
    if (!d || d.ambient) return
    const id = setInterval(() => { if (INPUT.interact) { INPUT.interact = false; onTap() } }, 50)
    return () => clearInterval(id)
  })

  function advance() {
    const cur = G().dialog
    if (!cur) return
    if (cur.i + 1 < cur.lines.length) useGame.setState({ dialog: { ...cur, i: cur.i + 1 } })
    else { VOICE.stop(); RT.novaTalking = 0; RT.nexTalking = 0; useGame.setState({ dialog: null }); cur.resolve() }
  }
  function onTap() {
    if (!d) return
    if (typing) { setShown(full.length); return }
    if (line?.choices) return
    advance()
  }
  function choose(ci: number) {
    const cur = G().dialog
    if (!cur || !line?.choices) return
    const ch = line.choices[ci]
    SFX.play('click')
    if (ch.flag) G().setFlag(ch.flag)
    const lines = [...cur.lines.slice(0, cur.i + 1), { who: 'NEX', text: ch.label }, ...(ch.next || []), ...cur.lines.slice(cur.i + 1)]
    // remove as escolhas da linha atual para não repetir
    lines[cur.i] = { ...lines[cur.i], choices: undefined }
    useGame.setState({ dialog: { ...cur, lines, i: cur.i + 1 } })
  }

  if (!d || !line) return null
  const sp = SPEAKERS[line.who]
  const name = NAMES[line.who] ?? sp?.name ?? line.who
  return (
    <div className={'dlg' + (d.ambient ? ' ambient' : '')} onClick={d.ambient ? undefined : onTap} role="dialog" aria-live="polite">
      <div className="face"><Face who={line.who} text={line.text} mood={line.mood} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {name && <div className={'who ' + line.who} style={sp?.color ? { color: sp.color } : undefined}>{name}</div>}
        <div className="say">{full.slice(0, shown)}</div>
        {line.choices && !typing && (
          <div className="choices">
            {line.choices.map((c, i) => <button key={i} className="btn small" onClick={(e) => { e.stopPropagation(); choose(i) }}>{c.label}</button>)}
          </div>
        )}
      </div>
      {!d.ambient && !typing && !line.choices && <div className="more">toque para continuar ▸</div>}
    </div>
  )
}
