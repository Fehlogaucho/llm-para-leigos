import { useEffect } from 'react'
import { G, useGame } from '../store'
import { setErrorHook } from './audio'

/* =========================================================
   Métricas de aprendizagem, só neste navegador.
   Nada é enviado para lugar nenhum: os dados ficam no
   localStorage e só saem se a pessoa exportar o arquivo
   (modo piloto, para testes com jogadores iniciantes).
   ========================================================= */
const KEY = 'pf2d-metrics-v1'
export interface Activity { first: number; last: number; ms: number; opens: number; done?: number; tries: number; hints: number }
export interface TestResult { at: number; ids: string[]; answers: number[]; correct: boolean[]; score: number; total: number }
export interface MetricsData {
  v: 1
  created: number
  participant: string
  sessions: number
  jumps: number // vezes que usou “Capítulos e missões” para pular
  phases: Record<string, number> // flag de conclusão → quando aconteceu
  activities: Record<string, Activity>
  exam: { attempts: number; scores: number[]; wrong: Record<string, number> }
  codex: { opens: number; entries: Record<string, number> }
  pre?: TestResult
  pos?: TestResult
  open?: { explain: string; confusing: string; at: number }
}
const fresh = (): MetricsData => ({ v: 1, created: Date.now(), participant: '', sessions: 0, jumps: 0, phases: {}, activities: {}, exam: { attempts: 0, scores: [], wrong: {} }, codex: { opens: 0, entries: {} } })
function read(): MetricsData {
  try { const s = localStorage.getItem(KEY); if (s) { const d = JSON.parse(s); if (d && d.v === 1) return { ...fresh(), ...d } } } catch { /* */ }
  return fresh()
}
let D = read()
let timer: any = 0
function save() { clearTimeout(timer); timer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(D)) } catch { /* */ } }, 300) }

/** Atividade aberta agora (as tentativas erradas contam para ela). */
let current: string | null = null
const openAt: Record<string, number> = {}
const act = (id: string) => (D.activities[id] ||= { first: Date.now(), last: Date.now(), ms: 0, opens: 0, tries: 0, hints: 0 })

export const METRICS = {
  get data() { return D },
  start(id: string) { const a = act(id); a.opens++; a.last = Date.now(); openAt[id] = performance.now(); current = id; save() },
  end(id: string) { const a = act(id); if (openAt[id] != null) { a.ms += Math.round(performance.now() - openAt[id]); delete openAt[id] } a.last = Date.now(); if (current === id) current = null; save() },
  done(id: string) { const a = act(id); if (!a.done) a.done = Date.now(); save() },
  error() { if (current) { act(current).tries++; save() } },
  hint() { if (current) { act(current).hints++; save() } },
  exam(answers: number[], correct: number[], ids: string[]) {
    D.exam.attempts++
    let sc = 0
    answers.forEach((a, i) => { if (a === correct[i]) sc++; else D.exam.wrong[ids[i]] = (D.exam.wrong[ids[i]] || 0) + 1 })
    D.exam.scores.push(sc); save()
  },
  jump() { D.jumps++; save() },
  codexEntry(id: string) { D.codex.entries[id] = (D.codex.entries[id] || 0) + 1; save() },
  test(kind: 'pre' | 'pos', answers: number[], correct: number[], ids: string[]) { const ok = answers.map((a, i) => a === correct[i]); D[kind] = { at: Date.now(), ids, answers, correct: ok, score: ok.filter(Boolean).length, total: correct.length }; save() },
  openAnswers(explain: string, confusing: string) { D.open = { explain: explain.slice(0, 2000), confusing: confusing.slice(0, 2000), at: Date.now() }; save() },
  setParticipant(code: string) { D.participant = code.replace(/[^\w-]/g, '').slice(0, 16); save() },
  /** Arquivo para entregar ao responsável pelo teste (sem dados pessoais). */
  exportJSON() {
    const s = G().settings
    const out = { app: 'LLM: The Prediction Factory (2D)', exportedAt: new Date().toISOString(), ...D, settings: { voice: s.voice, reduced: s.reduced, text: s.text, contrast: s.contrast }, progress: { level: G().level, cores: G().cores, codexFound: Object.keys(G().codex).length } }
    return JSON.stringify(out, null, 2)
  },
  download() {
    const blob = new Blob([METRICS.exportJSON()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `prediction-factory-${D.participant || 'participante'}-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  },
  reset() { D = fresh(); try { localStorage.removeItem(KEY) } catch { /* */ } },
}

/** Mede uma atividade enquanto o painel estiver aberto. */
export function useActivity(id: string) {
  useEffect(() => { METRICS.start(id); return () => METRICS.end(id) }, [id])
}

/* sessões, conclusão das fases e aberturas do Codex */
const PHASE_FLAGS = ['quarto_done', 'pro_done', 'l1_done', 'p2_done', 'p3_done', 'fim_done']
if (typeof window !== 'undefined') {
  D.sessions++; save()
  setErrorHook(() => METRICS.error())
  useGame.subscribe((s, p) => {
    if (s.flags !== p.flags) for (const k of PHASE_FLAGS) if (s.flags[k] && !p.flags[k] && !D.phases[k]) { D.phases[k] = Date.now(); save() }
    if (s.menu === 'codex' && p.menu !== 'codex') { D.codex.opens++; save() }
  })
}
