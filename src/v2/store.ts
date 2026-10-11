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
export interface Objective { text: string; target?: P2 }
/** Plano de câmera: vai até pos (centro da tela), com zoom 1 ou 2. cut = começa já ali. */
export interface Shot { pos: P2; zoom?: number; dur?: number; cut?: boolean; h?: number }

interface DialogState { lines: Line[]; i: number; ambient: boolean; resolve: () => void }
interface Banner { kind: 'discovery' | 'fragment' | 'core' | 'quest' | 'area' | 'memory' | 'station'; title: string; sub?: string; cat?: Cat }

export interface Settings { voice: boolean; music: number; sfx: number; reduced: boolean; pixel: 'auto' | 'grande' | 'pequeno' }

export interface Progress {
  level: string
  flags: Record<string, number>
  codex: Record<string, number>
  fragments: string[]
  cores: string[]
  quests: Record<string, 'active' | 'done'>
  visited: string[]
}

export type Menu = null | 'codex' | 'map' | 'settings'

interface State extends Progress {
  screen: 'title' | 'game'
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
const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
const defaultSettings: Settings = { voice: true, music: 0.55, sfx: 0.8, reduced, pixel: 'auto' }

let toastTimer: any = 0
export const useGame = create<State>()((set, get) => ({
  ...load<Progress>(SAVE, blank()),
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
