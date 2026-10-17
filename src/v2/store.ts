import { create } from 'zustand'
import type { ReactNode } from 'react'

/* =========================================================
   Estado do jogo (versão 2D isométrica em pixel art).
   Posições do mundo são em casas do mapa: [x, y].
   O progresso fica salvo separado da versão 3D.
   ========================================================= */
export type P2 = [number, number]
export type Who = 'NEX' | 'NOVA' | 'ENGINE' | 'HALLUCINO' | 'SISTEMA' | string
export type Cat = 'fundamento' | 'curiosidade' | 'deepdive' | 'historia'

export interface Choice { label: string; next?: Line[]; flag?: string }
export interface Line { who: Who; text: string; choices?: Choice[]; mood?: string }
/** use: id do objeto que a viagem rápida deve usar ao chegar (quando ele anda, como um robô). */
export interface Objective { text: string; target?: P2; use?: string }
/** Plano de câmera: vai até pos (centro da tela), com zoom 1 ou 2. cut = começa já ali. */
export interface Shot { pos: P2; zoom?: number; dur?: number; cut?: boolean; h?: number }

interface DialogState { lines: Line[]; i: number; ambient: boolean; resolve: () => void }
interface Banner { kind: 'discovery' | 'fragment' | 'core' | 'quest' | 'area' | 'memory' | 'station'; title: string; sub?: string; cat?: Cat }

export interface Settings { voice: boolean; voiceVol: number; music: number; sfx: number; reduced: boolean; pixel: 'auto' | 'grande' | 'pequeno'; text: 'normal' | 'grande' | 'maior'; contrast: boolean; pilot: boolean; fastText: boolean; gfx: 'completo' | 'leve' }

export interface Progress {
  level: string
  flags: Record<string, number>
  codex: Record<string, number>
  fragments: string[]
  cores: string[]
  quests: Record<string, 'active' | 'done'>
  visited: string[]
}

export type Menu = null | 'codex' | 'map' | 'settings' | 'chapters'

interface State extends Progress {
  screen: 'title' | 'game'
  saveIssue: SaveIssue
  loading: string | null
  settings: Settings
  objective: Objective | null
  dialog: DialogState | null
  banners: Banner[]
  toast: string | null
  prompt: { id: string; label: string } | null
  menu: Menu
  focus: boolean
  cine: { shots: Shot[]; t0: number; resolve: () => void; skippable: boolean } | null
  overlays: Record<string, ReactNode>
  hudHidden: boolean
  levelReady: string | null
  sceneSeq: number
  /** Momento da última viagem rápida (clarão na tela). */
  warp: number

  set: (p: Partial<State>) => void
  setFlag: (k: string, v?: number) => void
  flag: (k: string) => number
  discover: (id: string, lvl?: number) => boolean
  addFragment: (id: string) => void
  addCore: (id: string) => void
  setQuest: (id: string, st: 'active' | 'done') => void
  pushBanner: (b: Banner) => void
  shiftBanner: () => void
  showToast: (t: string) => void
  setOverlay: (id: string, n: ReactNode | null) => void
  resetProgress: () => void
}

const SAVE = 'pf2d-save-v1'
const SETS = 'pf2d-settings-v1'
const blank = (): Progress => ({ level: 'quarto', flags: {}, codex: {}, fragments: [], cores: [], quests: {}, visited: [] })

function load<T>(k: string, d: T): T {
  try { const s = localStorage.getItem(k); if (s) return { ...d, ...JSON.parse(s) } } catch { /* sem armazenamento */ }
  return d
}

/* ---------- salvamento: ausente, incompleto ou inválido ----------
   ausente → começa do zero; ilegível (JSON quebrado) → guarda uma cópia em
   SAVE_BAD e começa do zero; incompleto ou com campos estranhos → aproveita
   o que estiver certo e descarta o resto. Em todos os casos o jogo abre. */
export type SaveIssue = null | 'corrompido' | 'consertado'
export const SAVE_BAD = 'pf2d-save-v1-danificado'
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)
const numMap = (x: unknown) => { const o: Record<string, number> = {}; if (isObj(x)) for (const [k, v] of Object.entries(x)) if (typeof v === 'number' && Number.isFinite(v)) o[k] = v; return o }
const strList = (x: unknown) => (Array.isArray(x) ? [...new Set(x.filter((v): v is string => typeof v === 'string'))] : [])
/** Confere um progresso salvo e devolve só o que é válido (e se precisou consertar). */
export function sanitizeProgress(raw: unknown): { p: Progress; fixed: boolean } {
  const b = blank()
  if (!isObj(raw)) return { p: b, fixed: true }
  const quests: Progress['quests'] = {}
  if (isObj(raw.quests)) for (const [k, v] of Object.entries(raw.quests)) if (v === 'active' || v === 'done') quests[k] = v
  const p: Progress = {
    level: typeof raw.level === 'string' && /^[a-z0-9_]{1,24}$/.test(raw.level) ? raw.level : b.level,
    flags: numMap(raw.flags), codex: numMap(raw.codex), fragments: strList(raw.fragments), cores: strList(raw.cores), quests, visited: strList(raw.visited),
  }
  const fixed = JSON.stringify(p) !== JSON.stringify({ level: raw.level, flags: raw.flags ?? {}, codex: raw.codex ?? {}, fragments: raw.fragments ?? [], cores: raw.cores ?? [], quests: raw.quests ?? {}, visited: raw.visited ?? [] })
  return { p, fixed }
}
function loadProgress(): { p: Progress; issue: SaveIssue } {
  let txt: string | null = null
  try { txt = localStorage.getItem(SAVE) } catch { return { p: blank(), issue: null } }
  if (!txt) return { p: blank(), issue: null }
  let raw: unknown
  try { raw = JSON.parse(txt) } catch {
    try { localStorage.setItem(SAVE_BAD, txt); localStorage.removeItem(SAVE) } catch { /* */ }
    return { p: blank(), issue: 'corrompido' }
  }
  const { p, fixed } = sanitizeProgress(raw)
  return { p, issue: fixed ? 'consertado' : null }
}
const loaded = loadProgress()
const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
/** Aparelho fraco (poucos núcleos e pouca memória): começa com os gráficos leves. */
const lowEnd = typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 8) <= 4 && ((navigator as any).deviceMemory || 8) <= 3
const defaultSettings: Settings = { voice: true, voiceVol: 1, music: 0.55, sfx: 0.8, reduced, pixel: 'auto', text: 'normal', contrast: false, pilot: false, fastText: false, gfx: lowEnd ? 'leve' : 'completo' }

let toastTimer: any = 0
export const useGame = create<State>()((set, get) => ({
  ...loaded.p,
  saveIssue: loaded.issue,
  screen: 'title',
  loading: null,
  settings: load<Settings>(SETS, defaultSettings),
  objective: null,
  dialog: null,
  banners: [],
  toast: null,
  prompt: null,
  menu: null,
  focus: false,
  cine: null,
  overlays: {},
  hudHidden: false,
  levelReady: null,
  sceneSeq: 0,
  warp: 0,

  set: (p) => set(p as any),
  setFlag: (k, v = 1) => set((s) => ({ flags: { ...s.flags, [k]: v } })),
  flag: (k) => get().flags[k] || 0,
  discover: (id, lvl = 1) => {
    const cur = get().codex[id] || 0
    if (cur >= lvl) return false
    set((s) => ({ codex: { ...s.codex, [id]: lvl } }))
    return cur === 0
  },
  addFragment: (id) => { if (!get().fragments.includes(id)) set((s) => ({ fragments: [...s.fragments, id] })) },
  addCore: (id) => { if (!get().cores.includes(id)) set((s) => ({ cores: [...s.cores, id] })) },
  setQuest: (id, st) => set((s) => ({ quests: { ...s.quests, [id]: st } })),
  pushBanner: (b) => set((s) => ({ banners: [...s.banners, b] })),
  shiftBanner: () => set((s) => ({ banners: s.banners.slice(1) })),
  showToast: (t) => { clearTimeout(toastTimer); set({ toast: t }); toastTimer = setTimeout(() => set({ toast: null }), 3200) },
  setOverlay: (id, n) => set((s) => { const o = { ...s.overlays }; if (n == null) delete o[id]; else o[id] = n; return { overlays: o } }),
  resetProgress: () => { set({ ...blank(), objective: null }); try { localStorage.removeItem(SAVE) } catch { /* */ } },
}))

export const IS_TOUCH = coarse

let saveTimer: any = 0
useGame.subscribe((s, p) => {
  if (s.flags !== p.flags || s.codex !== p.codex || s.fragments !== p.fragments || s.cores !== p.cores || s.quests !== p.quests || s.level !== p.level || s.visited !== p.visited) {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      const { level, flags, codex, fragments, cores, quests, visited } = useGame.getState()
      try { localStorage.setItem(SAVE, JSON.stringify({ level, flags, codex, fragments, cores, quests, visited })) } catch { /* */ }
    }, 400)
  }
  if (s.settings !== p.settings) { try { localStorage.setItem(SETS, JSON.stringify(s.settings)) } catch { /* */ } }
})

export const G = () => useGame.getState()
export const hasSave = () => { try { return !!localStorage.getItem(SAVE) } catch { return false } }
