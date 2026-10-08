import type { ReactNode } from 'react'
import { portraitURL } from '../art/person'

/** Personagens extras (ex.: inventores da Fase 1): nome, cor e retrato. */
export const SPEAKERS: Record<string, { name: string; color?: string; face?: () => ReactNode }> = {}

export const Ico = {
  voiceOn: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" fillOpacity=".25" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>,
  voiceOff: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" fillOpacity=".25" /><path d="M17 9.5l5 5M22 9.5l-5 5" /></svg>,
  book: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16M9 7h7M9 11h5" /></svg>,
  map: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>,
  arrow: <svg viewBox="0 0 40 40"><path d="M20 3 35 33 20 25 5 33z" fill="#ffd27a" stroke="#5a3a0a" strokeWidth="2" strokeLinejoin="round" /></svg>,
  hand: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L3.6 15a1.6 1.6 0 0 1 2.4-2l2 2" /></svg>,
}

/* ---------- expressões do NEX e da NOVA (retratos desenhados) ---------- */
export const NEX_MOODS = ['neutro', 'sorrindo', 'feliz', 'animado', 'confiante', 'piscando', 'determinado', 'pensativo', 'curioso', 'surpreso', 'empolgado', 'rindo', 'ideia', 'observando', 'confuso', 'preocupado', 'triste', 'decepcionado', 'zangado', 'cansado', 'espantado', 'concordando', 'negando', 'falando1', 'falando2', 'falando3', 'serio', 'surpresa_positiva']
export const NOVA_MOODS = ['neutro', 'feliz', 'sorrindo', 'animado', 'piscando', 'surpreso', 'curioso', 'pensativo', 'confiante', 'determinado', 'triste', 'preocupado', 'confuso', 'assustado', 'rindo', 'ideia', 'explicando', 'concordando', 'negando', 'empolgado', 'zangado', 'cansado', 'decepcionado', 'aliviado', 'apaixonado', 'orgulhoso', 'serio', 'observando', 'digitando', 'apresentando']
const hashStr = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) }
/** Escolhe a expressão pela fala (quando o roteiro não diz qual). */
export function moodOf(who: string, text: string): string {
  const s = text.toLowerCase().trim(), h = hashStr(s)
  if (who === 'NEX') {
    if (/aaa|choque|puxando|encolhendo/.test(s)) return 'espantado'
    if (/^ai[!.…, ]/.test(s) || s.includes('minha cabeça')) return 'confuso'
    if (/impossível|preso|falhando/.test(s)) return 'preocupado'
    if (/sem engasgar|consegui|uau|demais|incrível|nem precisou/.test(s)) return 'empolgado'
    if (/tipo|entendi|então é isso/.test(s) && s.endsWith('!')) return 'ideia'
    if (s.endsWith('?')) return /^(como|por que|o que|quem|onde|e como|e se|e agora)/.test(s) ? 'curioso' : 'pensativo'
    if (s.includes('!')) return 'animado'
    if (/(…|\.\.\.)$/.test(s)) return 'pensativo'
    return ['falando1', 'neutro', 'sorrindo', 'falando2', 'confiante'][h % 5]
  }
  if (who === 'NOVA') {
    if (/parabéns|recuperou|terminou|você conseguiu|isso mesmo|exatamente/.test(s)) return 'orgulhoso'
    if (/esse é o espírito|gosto da energia|vamos lá|vamos!|vamos atravessar/.test(s)) return 'empolgado'
    if (/ligado|olá|oi,/.test(s)) return 'feliz'
    if (/apagou|embaralhou|esqueceu|cuidado|névoa/.test(s)) return 'preocupado'
    if (s.endsWith('?')) return 'curioso'
    if (s.includes('!')) return 'animado'
    if (s.length > 95) return 'explicando'
    return ['sorrindo', 'neutro', 'feliz', 'apresentando'][h % 4]
  }
  return 'neutro'
}
const faceSrc = (who: string, mood: string) => `/img/faces/${who === 'NEX' ? 'nex' : 'nova'}/${mood}.webp`
/** Carrega as expressões antes (troca de rosto sem piscar). */
export function preloadFaces() { for (const m of NEX_MOODS) new Image().src = faceSrc('NEX', m); for (const m of NOVA_MOODS) new Image().src = faceSrc('NOVA', m) }
function MoodFace({ who, mood }: { who: 'NEX' | 'NOVA'; mood: string }) {
  const ok = (who === 'NEX' ? NEX_MOODS : NOVA_MOODS).includes(mood) ? mood : 'neutro'
  return (
    <span style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}>
      <img className="pxface" alt="" src={portraitURL(who, who === 'NEX' ? '#1a2440' : '#0f1830', who === 'NEX' ? '#59d7ff' : undefined)} />
      <img className="moodface" alt="" draggable={false} src={faceSrc(who, ok)} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
    </span>
  )
}

export function Face({ who, text = '', mood }: { who: string; text?: string; mood?: string }) {
  const sp = SPEAKERS[who]
  if (sp?.face) return <>{sp.face()}</>
  if (who === 'NEX') return <MoodFace who="NEX" mood={mood || moodOf('NEX', text)} />
  if (who === 'ENGINE') return (
    <svg viewBox="0 0 64 64"><rect width="64" height="64" fill="#050a14" /><circle cx="32" cy="32" r="20" fill="none" stroke="#2a5d86" strokeWidth="3" /><circle cx="32" cy="32" r="12" fill="#3fc4ff" opacity=".35" /><circle cx="32" cy="32" r="6" fill="#bff3ff" /><path d="M32 6v8M32 50v8M6 32h8M50 32h8" stroke="#3fc4ff" strokeWidth="2" /></svg>
  )
  if (who === 'HALLUCINO') return (
    <svg viewBox="0 0 64 64"><rect width="64" height="64" fill="#1a0b22" /><path d="M14 30c4-12 32-12 36 0-4 14-32 14-36 0z" fill="#ff8ad8" opacity=".85" /><circle cx="25" cy="30" r="4" fill="#1a0b22" /><circle cx="39" cy="30" r="4" fill="#1a0b22" /><path d="M24 42q8 6 16 0" stroke="#ff8ad8" strokeWidth="2.5" fill="none" /></svg>
  )
  if (who === 'SISTEMA') return (
    <svg viewBox="0 0 64 64"><rect width="64" height="64" fill="#0c1426" /><path d="M20 22h24v20H20z" fill="none" stroke="#e8b65a" strokeWidth="3" /><path d="M26 30h12M26 36h8" stroke="#e8b65a" strokeWidth="3" /></svg>
  )
  return <MoodFace who="NOVA" mood={mood || moodOf('NOVA', text)} />
}
