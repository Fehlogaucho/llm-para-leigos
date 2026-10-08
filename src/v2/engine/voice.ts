import { G } from '../store'
import { voiceOut } from './audio'

/* =========================================================
   Voz dos diálogos. Primeiro procura uma fala gravada
   (public/audio/voz, gerada por tools/voz/gerar_piper.py);
   se não houver, usa a leitura em voz alta do navegador.
   ========================================================= */
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

/* ---------- falas gravadas ---------- */
const BASE = '/audio/voz/'
let manifest: Record<string, { f: string; d: number }> = {}
if (typeof fetch !== 'undefined') fetch(BASE + 'index.json').then((r) => (r.ok ? r.json() : {})).then((m) => { manifest = m || {} }).catch(() => {})
/** Mesmo hash do gerador: FNV-1a (32 bits) de "QUEM|texto" em UTF-8. */
export function voiceKey(who: string, text: string) {
  const b = new TextEncoder().encode(`${who}|${text}`)
  let h = 0x811c9dc5
  for (const x of b) { h ^= x; h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(16).padStart(8, '0')
}
const buffers = new Map<string, Promise<AudioBuffer | null>>()
function load(key: string): Promise<AudioBuffer | null> {
  if (!buffers.has(key)) {
    const rec = manifest[key], o = voiceOut()
    buffers.set(key, !rec || !o ? Promise.resolve(null) : fetch(BASE + rec.f).then((r) => r.arrayBuffer()).then((a) => o.ctx.decodeAudioData(a)).catch(() => null))
  }
  return buffers.get(key)!
}
/** Já carrega as falas que vêm a seguir (sem atraso quando a fala abrir). */
export function preloadLines(lines: { who: string; text: string }[]) { for (const l of lines) { const k = voiceKey(l.who, l.text); if (manifest[k]) load(k) } }
let playing: AudioBufferSourceNode | null = null
let token = 0

function speakBrowser(text: string, who: string, onEnd?: () => void) {
  if (!synth) { onEnd?.(); return false }
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
}

export const VOICE = {
  ok: !!synth,
  /** Duração da fala gravada (segundos), se existir. */
  duration(text: string, who = 'NOVA') { return manifest[voiceKey(who, text)]?.d || 0 },
  speak(text: string, who = 'NOVA', onEnd?: () => void) {
    if (!G().settings.voice) { onEnd?.(); return false }
    VOICE.stop()
    const key = voiceKey(who, text)
    if (manifest[key] && voiceOut()) {
      const my = ++token
      load(key).then((buf) => {
        if (my !== token) return
        const o = voiceOut()
        if (!buf || !o) { speakBrowser(text, who, onEnd); return }
        const src = o.ctx.createBufferSource()
        src.buffer = buf; src.connect(o.out)
        src.onended = () => { if (playing === src) { playing = null; onEnd?.() } }
        playing = src
        src.start()
      })
      return true
    }
    return speakBrowser(text, who, onEnd)
  },
  /** Uma fala gravada está tocando agora? (para testes) */
  isPlaying() { return !!playing },
  stop() {
    token++
    if (playing) { const p = playing; playing = null; try { p.onended = null; p.stop() } catch { /* */ } }
    try { synth?.cancel() } catch { /* */ }
  },
}
