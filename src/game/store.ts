import { create } from 'zustand'
import type { ReactNode } from 'react'

export type Vec3 = [number, number, number]
export type Who = 'NEX' | 'NOVA' | 'ENGINE' | 'HALLUCINO' | 'SISTEMA' | string
export type Cat = 'fundamento' | 'curiosidade' | 'deepdive' | 'historia'

export interface Choice { label: string; next?: Line[]; flag?: string }
export interface Line { who: Who; text: string; choices?: Choice[] }
export interface Objective { text: string; target?: Vec3; area?: string }
/** Plano de câmera. cut = começa já nesta posição (e anda até `to`, olhando de `look` até `lookTo`). */
export interface Shot { pos: Vec3; look: Vec3; dur?: number; fov?: number; cut?: boolean; to?: Vec3; lookTo?: Vec3 }

interface DialogState { lines: Line[]; i: number; ambient: boolean; resolve: () => void }
interface Banner { kind: 'discovery' | 'fragment' | 'core' | 'quest' | 'area'; title: string; sub?: string; cat?: Cat }

export interface Settings { voice: boolean; music: number; sfx: number; quality: 'auto' | 'low' | 'high'; reduced: boolean; sens: number }

export interface Progress {
  level: string
  flags: Record<string, number>
  codex: Record<string, number> // nível de maestria 1..4
  fragments: string[]
  cores: string[]
  quests: Record<string, 'active' | 'done'>
  visited: string[]
}

export type Menu = null | 'codex' | 'map' | 'settings' | 'pause'

interface State extends Progress {
  screen: 'title' | 'game' | 'end'
  loading: string | null
  settings: Settings
  objective: Objective | null
  dialog: DialogState | null
  banners: Banner[]
  toast: string | null
  prompt: { id: string; label: string } | null
  menu: Menu
  focus: boolean // modo de foco: câmera parada num objeto, sem andar
  cine: { shots: Shot[]; t0: number; resolve: () => void; skippable: boolean } | null
  overlays: Record<string, ReactNode>
  hudHidden: boolean
  spawnSeq: number // muda quando o jogador deve ser teleportado
  spawn: { pos: Vec3; yaw: number }
  spawnOverride?: { pos: Vec3; yaw: number }
  levelReady: string | null

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

const SAVE = 'pf-save-v1'
const SETS = 'pf-settings-v1'
const blank = (): Progress => ({ level: 'quarto', flags: {}, codex: {}, fragments: [], cores: [], quests: {}, visited: [] })

function load<T>(k: string, d: T): T {
  try { const s = localStorage.getItem(k); if (s) return { ...d, ...JSON.parse(s) } } catch { /* sem armazenamento */ }
  return d
}
const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
const defaultSettings: Settings = { voice: true, music: 0.55, sfx: 0.8, quality: 'auto', reduced, sens: 1 }

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
  spawnSeq: 0,
  spawn: { pos: [0, 0, 0], yaw: 0 },
  spawnOverride: undefined,
  levelReady: null,

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

// salva o progresso (com folga, para não gravar a cada quadro)
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
