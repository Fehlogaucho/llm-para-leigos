import { G } from '../store'

/** Leitura em voz alta (pt-BR) com timbre diferente para cada personagem. */
const synth: SpeechSynthesis | null = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
let voice: SpeechSynthesisVoice | null = null
function pick() {
  if (!synth) return
  const vs = synth.getVoices()
  voice = vs.find((v) => /pt[-_]BR/i.test(v.lang) && /google|luciana|francisca|natural|online/i.test(v.name)) || vs.find((v) => /pt[-_]BR/i.test(v.lang)) || vs.find((v) => /^pt/i.test(v.lang)) || null
}
if (synth) { pick(); synth.onvoiceschanged = pick }

export const TIMBRE: Record<string, { pitch: number; rate: number }> = {
  NOVA: { pitch: 1.45, rate: 1.06 },
  NEX: { pitch: 1.15, rate: 1.1 },
  ENGINE: { pitch: 0.3, rate: 0.82 },
  HALLUCINO: { pitch: 0.75, rate: 0.98 },
  SISTEMA: { pitch: 1, rate: 1.05 },
}

export const VOICE = {
  ok: !!synth,
  speak(text: string, who = 'NOVA', onEnd?: () => void) {
    if (!synth || !G().settings.voice) { onEnd?.(); return false }
    try {
      synth.cancel()
      const u = new SpeechSynthesisUtterance(text.replace(/[“”"*_]/g, ''))
      u.lang = 'pt-BR'
      if (voice) u.voice = voice
      const tb = TIMBRE[who] || TIMBRE.SISTEMA
      u.pitch = tb.pitch; u.rate = tb.rate
      if (onEnd) { u.onend = () => onEnd(); u.onerror = () => onEnd() }
      synth.speak(u)
      return true
    } catch { onEnd?.(); return false }
  },
  stop() { try { synth?.cancel() } catch { /* */ } },
}
