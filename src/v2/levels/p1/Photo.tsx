import { useState } from 'react'
import { createPortal } from 'react-dom'
import { G } from '../../store'
import { SFX } from '../../engine/audio'
import { Ico } from '../../ui/Icons'
import type { Ctx } from '../../engine/script'
import { PHOTOS } from '../../content/photos'
import { PersonFace } from './faces'

/* =========================================================
   Quadro com a imagem real de cada parada (retrato, objeto ou
   página antiga), com legenda e crédito do Wikimedia Commons.
   Aparece no alto da tela enquanto o inventor conta os detalhes.
   ========================================================= */
export const PH = 'l1photo'

function useChain(who: string) {
  const p = PHOTOS[who]
  const list = p ? p.srcs.flatMap((s, i) => [{ u: s.thumb, i }, { u: s.full, i }]) : []
  const [k, setK] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const failed = k >= list.length
  const src = p ? p.srcs[failed ? 0 : list[k].i] : null
  return { p, url: failed ? '' : list[k].u, failed, loaded, src, onLoad: () => setLoaded(true), onError: () => { setLoaded(false); setK(k + 1) } }
}

/** O quadro em si (usado na cena e na linha do tempo). */
export function PhotoCard({ who, big = false }: { who: string; big?: boolean }) {
  const ch = useChain(who)
  const [zoom, setZoom] = useState(false)
  if (!ch.p || !ch.src) return null
  const p = ch.p
  return (
    <div className={'photo-card' + (big ? ' big' : '')} onPointerDown={(e) => e.stopPropagation()}>
      <button className="mat" onClick={() => { if (ch.loaded) { SFX.play('click'); setZoom(true) } }} aria-label={ch.loaded ? `Ampliar: ${p.title}` : p.title}>
        {!ch.failed ? <img src={ch.url} alt={p.title} draggable={false} onLoad={ch.onLoad} onError={ch.onError} style={{ opacity: ch.loaded ? 1 : 0 }} /> : (
          <span className="fb"><span className="fbface"><PersonFace who={who} /></span><span>A imagem não carregou agora (precisa de internet).</span></span>
        )}
        {!ch.loaded && !ch.failed && <span className="ld">carregando imagem…</span>}
        {ch.loaded && <span className="zoom">toque para ampliar</span>}
      </button>
      <div className="cap">
        <b>{p.title}</b>
        <span>{p.meta}</span>
        <a href={ch.src.page} target="_blank" rel="noopener noreferrer">{ch.src.credit} · Wikimedia Commons ↗</a>
      </div>
      {zoom && createPortal(
        <div className="photo-zoom" onClick={() => setZoom(false)} onPointerDown={(e) => e.stopPropagation()} role="dialog" aria-label={p.title}>
          <img src={ch.url} alt={p.title} draggable={false} />
          <span>{p.title} · toque para fechar</span>
        </div>, document.body)}
    </div>
  )
}

/** Durante a cena: o quadro no alto da tela enquanto as falas sobre a imagem passam. */
export async function showPhoto(c: Ctx, who: string) {
  const p = PHOTOS[who]
  if (!p) return
  G().setOverlay(PH, <div className="photo-frame"><PhotoCard who={who} /></div>)
  SFX.play('open')
  try { await c.say(p.lines) } finally { G().setOverlay(PH, null) }
}

/** Na linha do tempo: a imagem numa janela, com botão de voltar. */
export function PhotoModal({ who, back }: { who: string; back: () => void }) {
  const p = PHOTOS[who]
  return (
    <div className="modal" onClick={back} onPointerDown={(e) => e.stopPropagation()}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="head"><h2 style={{ fontSize: 20 }}>Imagem real</h2><button className="icon-btn close" onClick={back} aria-label="Voltar">{Ico.close}</button></div>
        <PhotoCard who={who} big />
        {p && <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>{p.lines.map((l, i) => <p key={i} style={{ margin: 0, fontSize: 15, lineHeight: 1.5, fontWeight: 600 }}>{l.text}</p>)}</div>}
      </div>
    </div>
  )
}
