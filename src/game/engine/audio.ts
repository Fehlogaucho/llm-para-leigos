import { G, useGame } from '../store'

/**
 * Áudio feito na hora (Web Audio): trilhas ambientes por área e efeitos.
 * Nada de arquivos: acordes lentos, sinos e ruídos filtrados.
 */
let ctx: AudioContext | null = null
let master: GainNode, music: GainNode, sfx: GainNode, verb: ConvolverNode, verbIn: GainNode

function impulse(c: AudioContext, sec = 3.2, decay = 2.6) {
  const len = Math.floor(c.sampleRate * sec), buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) }
  return buf
}

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return }
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext
  if (!AC) return
  ctx = new AC()
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination)
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.connect(master)
  music = ctx.createGain(); sfx = ctx.createGain()
  verb = ctx.createConvolver(); verb.buffer = impulse(ctx)
  verbIn = ctx.createGain(); verbIn.gain.value = 0.55
  verbIn.connect(verb); verb.connect(comp)
  music.connect(comp); sfx.connect(comp)
  applyVolumes()
  useGame.subscribe((s, p) => { if (s.settings !== p.settings) applyVolumes() })
}
function applyVolumes() {
  if (!ctx) return
  const st = G().settings
  music.gain.setTargetAtTime(st.music * 0.5, ctx.currentTime, 0.3)
  sfx.gain.setTargetAtTime(st.sfx * 0.7, ctx.currentTime, 0.1)
}

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

function env(g: GainNode, t: number, a: number, peak: number, d: number) {
  g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a)
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d)
}

function tone(freq: number, t: number, dur: number, vol: number, type: OscillatorType = 'sine', dest: AudioNode = sfx, wet = 0.3, attack = 0.005) {
  if (!ctx) return
  const o = ctx.createOscillator(), g = ctx.createGain()
  o.type = type; o.frequency.value = freq
  o.connect(g); g.connect(dest)
  if (wet > 0) { const w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(verbIn) }
  env(g, t, attack, vol, dur)
  o.start(t); o.stop(t + attack + dur + 0.05)
  return o
}
function noise(t: number, dur: number, vol: number, f0: number, f1: number, q = 1, dest: AudioNode = sfx) {
  if (!ctx) return
  const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource(); src.buffer = buf
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q
  bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur)
  const g = ctx.createGain(); env(g, t, dur * 0.3, vol, dur * 0.7)
  src.connect(bp); bp.connect(g); g.connect(dest)
  const w = ctx.createGain(); w.gain.value = 0.4; g.connect(w); w.connect(verbIn)
  src.start(t); src.stop(t + dur)
}

export const SFX = {
  play(name: string) {
    if (!ctx) return
    const t = ctx.currentTime + 0.01
    switch (name) {
      case 'tick': tone(1400, t, 0.05, 0.05, 'triangle', sfx, 0.1); break
      case 'click': tone(900, t, 0.06, 0.08, 'square', sfx, 0.05); tone(1800, t + 0.02, 0.04, 0.03, 'sine'); break
      case 'open': [72, 76, 79].forEach((m, i) => tone(mtof(m), t + i * 0.06, 0.5, 0.08, 'triangle')); break
      case 'talk': tone(mtof(84 + Math.floor(Math.random() * 5)), t, 0.04, 0.025, 'sine', sfx, 0.05); break
      case 'nex': tone(mtof(64 + Math.floor(Math.random() * 4)), t, 0.04, 0.02, 'triangle', sfx, 0.02); break
      case 'discover': [79, 83, 86, 91, 95].forEach((m, i) => tone(mtof(m), t + i * 0.09, 1.4, 0.07, 'sine', sfx, 0.6)); tone(mtof(55), t, 1.8, 0.06, 'triangle', sfx, 0.5); break
      case 'success': [72, 76, 79, 84].forEach((m, i) => tone(mtof(m), t + i * 0.08, 0.7, 0.08, 'triangle', sfx, 0.4)); break
      case 'error': tone(180, t, 0.25, 0.08, 'sawtooth', sfx, 0.1); tone(150, t + 0.1, 0.3, 0.07, 'sawtooth', sfx, 0.1); break
      case 'whoosh': noise(t, 0.9, 0.18, 300, 2400, 0.8); break
      case 'portal': noise(t, 2.5, 0.2, 120, 3000, 0.6); [48, 55, 60, 67].forEach((m, i) => tone(mtof(m), t + i * 0.2, 2.2, 0.05, 'sine', sfx, 0.7, 0.4)); break
      case 'gear': for (let i = 0; i < 6; i++) tone(220 + Math.random() * 90, t + i * 0.07, 0.05, 0.05, 'square', sfx, 0.1); break
      case 'stone': noise(t, 0.6, 0.25, 160, 60, 1.2); break
      case 'chime': [88, 91, 96].forEach((m, i) => tone(mtof(m), t + i * 0.12, 1.6, 0.05, 'sine', sfx, 0.8)); break
      case 'bead': tone(520 + Math.random() * 60, t, 0.08, 0.1, 'triangle', sfx, 0.1); noise(t, 0.05, 0.06, 2000, 1500, 2); break
      case 'step': noise(t, 0.08, 0.05, 500, 300, 1); break
      case 'core': [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => tone(mtof(m), t + i * 0.11, 2.4, 0.06, 'sine', sfx, 0.8)); noise(t, 2, 0.1, 200, 4000, 0.5); break
      case 'count': tone(mtof(76), t, 0.25, 0.07, 'sine', sfx, 0.4); break
    }
  },
  note(midi: number, dur = 0.6, vol = 0.07, type: OscillatorType = 'sine') { if (ctx) tone(mtof(midi), ctx.currentTime + 0.01, dur, vol, type, sfx, 0.4) },
}

/* ---------- trilha ambiente ---------- */
export interface Theme { root: number; chords: number[][]; bell?: number[]; tempo?: number; pad?: OscillatorType; air?: number }
export const THEMES: Record<string, Theme> = {
  title: { root: 50, chords: [[0, 7, 12, 16], [5, 12, 16, 21], [-3, 7, 12, 16], [2, 9, 14, 17]], bell: [74, 76, 79, 81, 86], tempo: 7 },
  lab: { root: 45, chords: [[0, 7, 15], [-2, 5, 14], [-4, 3, 12], [-5, 2, 10]], bell: [69, 72, 75, 77], tempo: 9, pad: 'sawtooth', air: 0.6 },
  observatorio: { root: 52, chords: [[0, 7, 11, 16], [5, 9, 16, 19], [-3, 4, 12, 16], [2, 9, 14, 18]], bell: [76, 79, 81, 83, 88], tempo: 6.5 },
  vale: { root: 50, chords: [[0, 7, 14, 16], [-5, 2, 11, 14], [-3, 4, 12, 16], [5, 12, 16, 19]], bell: [74, 78, 81, 83], tempo: 6 },
  jardim: { root: 53, chords: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]], bell: [77, 79, 81, 84, 86], tempo: 5.5 },
  prob: { root: 48, chords: [[0, 3, 7, 10], [5, 8, 12, 15], [-2, 2, 5, 9], [3, 7, 10, 14]], bell: [72, 75, 79, 82], tempo: 6, pad: 'triangle' },
  oficina: { root: 43, chords: [[0, 7, 12], [3, 10, 15], [5, 12, 17], [-2, 5, 10]], bell: [67, 70, 72, 74], tempo: 5, pad: 'sawtooth', air: 0.5 },
  computacao: { root: 45, chords: [[0, 7, 12, 19], [-2, 5, 10, 17], [-4, 3, 12, 15], [-5, 2, 9, 14]], bell: [81, 84, 88, 91], tempo: 4.5, pad: 'square', air: 0.35 },
  matriz: { root: 47, chords: [[0, 7, 14, 19], [3, 10, 15, 22], [5, 12, 17, 21], [-2, 7, 14, 17]], bell: [78, 83, 85, 90], tempo: 6.5 },
  cidade: { root: 49, chords: [[0, 7, 12, 16], [-3, 4, 9, 16], [2, 9, 14, 17], [5, 12, 16, 21]], bell: [76, 80, 83, 88], tempo: 5.5 },
  tensao: { root: 41, chords: [[0, 6, 12], [1, 7, 13], [-1, 6, 11], [0, 5, 12]], bell: [65, 66, 71], tempo: 8, pad: 'sawtooth', air: 0.7 },
}

let current: { name: string; stop: () => void } | null = null
export function playTheme(name: string) {
  if (!ctx) return
  if (current?.name === name) return
  current?.stop()
  const th = THEMES[name] || THEMES.title
  const c = ctx
  const bus = c.createGain(); bus.gain.value = 0.0001; bus.connect(music)
  const wet = c.createGain(); wet.gain.value = 0.8; bus.connect(wet); wet.connect(verbIn)
  bus.gain.exponentialRampToValueAtTime(1, c.currentTime + 3)
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.4; lp.connect(bus)
  const lfo = c.createOscillator(), lfoG = c.createGain(); lfo.frequency.value = 0.07; lfoG.gain.value = 380; lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start()
  let alive = true, ci = 0
  const tempo = th.tempo || 6
  const timers: any[] = []
  const chord = () => {
    if (!alive) return
    const t = c.currentTime + 0.05
    const ch = th.chords[ci++ % th.chords.length]
    ch.forEach((iv, k) => {
      for (const det of [-6, 6]) {
        const o = c.createOscillator(), g = c.createGain()
        o.type = th.pad || 'sawtooth'; o.frequency.value = mtof(th.root + iv); o.detune.value = det + (k === 0 ? -1200 : 0) * 0
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.022 / (k === 0 ? 0.8 : 1.4), t + tempo * 0.4)
        g.gain.exponentialRampToValueAtTime(0.0001, t + tempo * 1.25)
        o.connect(g); g.connect(lp); o.start(t); o.stop(t + tempo * 1.3)
      }
    })
    // grave
    const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = mtof(th.root + ch[0] - 12)
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 1.5); g.gain.exponentialRampToValueAtTime(0.0001, t + tempo * 1.2)
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + tempo * 1.25)
    timers.push(setTimeout(chord, tempo * 1000))
  }
  const bell = () => {
    if (!alive || !th.bell) return
    const t = c.currentTime + 0.05
    const n = 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < n; i++) { const m = th.bell[Math.floor(Math.random() * th.bell.length)]; tone(mtof(m), t + i * (0.35 + Math.random() * 0.4), 2.6, 0.022, 'sine', bus, 0.9, 0.01) }
    timers.push(setTimeout(bell, 3500 + Math.random() * 5000))
  }
  // vento / ar
  let airSrc: AudioBufferSourceNode | null = null
  if (th.air !== 0) {
    const len = c.sampleRate * 4, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < len; i++) { last = last * 0.985 + (Math.random() * 2 - 1) * 0.015; d[i] = last * 6 }
    airSrc = c.createBufferSource(); airSrc.buffer = buf; airSrc.loop = true
    const ag = c.createGain(); ag.gain.value = 0.05 * (th.air ?? 1)
    airSrc.connect(ag); ag.connect(bus); airSrc.start()
  }
  chord(); timers.push(setTimeout(bell, 2000))
  current = {
    name,
    stop: () => {
      alive = false; timers.forEach(clearTimeout)
      const t = c.currentTime
      bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(bus.gain.value, t); bus.gain.exponentialRampToValueAtTime(0.0001, t + 2.5)
      setTimeout(() => { try { lfo.stop(); airSrc?.stop(); bus.disconnect() } catch { /* */ } }, 2800)
    },
  }
}
export function stopTheme() { current?.stop(); current = null }
