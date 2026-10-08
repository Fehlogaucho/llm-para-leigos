import { useState } from 'react'
import { TIMBRE } from '../../engine/voice'
import { SPEAKERS } from '../../ui/Icons'
import { PEOPLE } from '../../content/stops'
import { PHOTOS } from '../../content/photos'
import { portraitURL } from '../../art/person'

/* =========================================================
   Os inventores: retrato em pixel art (diálogo e documentos),
   retrato real por cima (quando carrega) e voz.
   ========================================================= */

/** Retrato em pixel art. */
export function PersonFace({ who }: { who: string }) {
  const p = PEOPLE[who]
  if (!p) return null
  return <img className="pxface" alt="" draggable={false} src={portraitURL(who, '#101a30', p.color)} />
}

/** Avatar: o retrato real (Wikimedia Commons) por cima do desenho; se a foto não carregar, fica o desenho. */
export function PersonAvatar({ who }: { who: string }) {
  const p = PHOTOS[who]
  const [k, setK] = useState(0)
  const [ok, setOk] = useState(false)
  const base = <PersonFace who={who} />
  if (!p || !p.portrait) return base
  const list = p.srcs.flatMap((s) => [s.thumb, s.full])
  return (
    <span style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}>
      {base}
      {k < list.length && <img src={list[k]} alt="" draggable={false} onError={() => { setOk(false); setK(k + 1) }} onLoad={() => setOk(true)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: p.pos, opacity: ok ? 1 : 0, transition: 'opacity .4s' }} />}
    </span>
  )
}

/* registra nomes, cores, retratos e vozes */
const VOICES: Record<string, { pitch: number; rate: number }> = {
  ESCRIBA: { pitch: 0.75, rate: 0.95 }, LIUHUI: { pitch: 0.9, rate: 0.98 }, KHWARIZMI: { pitch: 0.8, rate: 0.96 }, PASCAL: { pitch: 0.95, rate: 1.04 },
  LEIBNIZ: { pitch: 0.85, rate: 1.0 }, GAUSS: { pitch: 0.92, rate: 1.02 }, ADA: { pitch: 1.3, rate: 1.04 }, CAYLEY: { pitch: 0.88, rate: 1.0 },
  MARKOV: { pitch: 0.7, rate: 0.95 }, SHANNON: { pitch: 1.0, rate: 1.1 }, ROSENBLATT: { pitch: 0.95, rate: 1.06 }, COMERCIANTE: { pitch: 0.82, rate: 1.02 },
}
for (const [k, p] of Object.entries(PEOPLE)) {
  SPEAKERS[k] = { name: p.name.toUpperCase(), color: p.color, face: () => <PersonAvatar who={k} /> }
  TIMBRE[k] = VOICES[k]
}

/* ---------- holograma ---------- */
/** k: aparecer (0..1) · live: falando agora (senão fica como lembrança translúcida) */
export const HOLO: Record<string, { k: number; want: number; live: boolean; l: number }> = {}
export const holo = (id: string) => (HOLO[id] ||= { k: 0, want: 0, live: false, l: 0 })

