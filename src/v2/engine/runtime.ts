import type { ReactNode } from 'react'
import type { P2 } from '../store'

/* =========================================================
   Núcleo do mundo 2D isométrico: projeção, tipos e o estado
   que muda a cada quadro (fora do React).
   Casa do mapa: losango de 32×16 pixels. z = altura em pixels.
   ========================================================= */
export const TW = 32, TH = 16
export const iso = (x: number, y: number, z = 0) => ({ sx: (x - y) * (TW / 2), sy: (x + y) * (TH / 2) - z })
export const unIso = (sx: number, sy: number) => ({ x: (sx / (TW / 2) + sy / (TH / 2)) / 2, y: (sy / (TH / 2) - sx / (TW / 2)) / 2 })

/** Imagem com âncora: o pixel (ax, ay) fica sobre o ponto do mundo da coisa. */
export interface Sprite { img: HTMLCanvasElement; ax: number; ay: number }

/** Algo desenhado no mundo. (x, y) é a ponta de trás da base (ou os pés, para personagens). */
export interface Thing {
  x: number; y: number
  w?: number; d?: number // base (em casas) para ordenar a profundidade
  z?: number
  sprite: Sprite | null | (() => Sprite | null)
  alpha?: number | (() => number)
  layer?: 'ground' | 'normal' | 'top'
  blend?: GlobalCompositeOperation
  solid?: boolean // bloqueia a base
  hidden?: () => boolean
  pos?: () => { x: number; y: number; z?: number } // coisas que andam
  scale?: () => number
  shadow?: number // raio da sombra (px), 0 = sem
}

export interface TileSpec { s: string; a?: string; b?: string; c?: string }
export interface Blocker { x0: number; y0: number; x1: number; y1: number; on: () => boolean }

export interface Scene {
  w: number; h: number
  ground: (x: number, y: number) => TileSpec | null
  things: Thing[]
  blockers?: Blocker[]
  walk?: Uint8Array // calculado
  bg: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, cam: { x: number; y: number }) => void
  cliff?: { a: string; b: string; depth: number } | null
  spawn: { pos: P2; dir?: P2 }
  scripts: ((c: any) => Promise<void>)[]
  update?: (dt: number, t: number) => void
  onExit?: () => void
  overlay?: () => ReactNode
  camBounds?: { x0: number; y0: number; x1: number; y1: number }
  /** Efeitos de tela depois do mundo (chuva, clarões…). */
  post?: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void
  /** Altura de voo da NOVA (px). */
  novaZ?: number
  /** Desenhos extras no chão (pré-desenhados): tx, ty = ponta de cima do losango no Pix. */
  paint?: (p: import('./pix').Pix, x: number, y: number, tx: number, ty: number) => void
  /** Casa com chão mas onde não se anda (água, plantação…). */
  noWalk?: (x: number, y: number) => boolean
  /** Cachoeiras de dados caindo das bordas (densidade 0..1 e cor). */
  falls?: { density: number; color: string }
  /** Chamado quando a fase fica pronta (overlays etc.). */
  init?: () => void
  /** Efeitos animados no chão (coordenadas do mundo, depois do chão e antes das coisas). */
  under?: (ctx: CanvasRenderingContext2D, t: number) => void
  /** Desenho no mundo por cima de tudo (feixes de luz, ligações…). */
  over?: (ctx: CanvasRenderingContext2D, t: number) => void
}

export interface Interact {
  id: string; x: number; y: number; r: number
  label: string | (() => string)
  enabled: () => boolean
  use: () => void
  color?: string
  mz?: number // altura do marcador (px)
  marker?: () => boolean
  /** Ícone do marcador: losango (usar) ou balão (conversar). */
  icon?: 'use' | 'talk'
}
export const INTERACTS = new Map<string, Interact>()
export function addInteract(i: Interact) { INTERACTS.set(i.id, i); return i }
export const labelOf = (i: Interact) => (typeof i.label === 'function' ? i.label() : i.label)

export type Pose = 'idle' | 'walk' | 'run' | 'scared' | 'cheer' | 'think' | 'sit' | 'type' | 'reach' | 'wave' | 'carry'
export interface Particle { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; c: string; s: number; g?: number; screen?: boolean }

export const RT = {
  scene: null as Scene | null,
  player: { x: 0, y: 0 },
  dir: { x: 1, y: 1 } as { x: number; y: number }, // para onde o NEX olha
  speed: 0,
  frozen: false,
  time: 0,
  nexScale: 1,
  nexZ: 0, // NEX acima do chão (pulos, quedas)
  nexHidden: false,
  pose: 'idle' as Pose, poseT: 0,
  lookAt: null as P2 | null,
  nova: { x: 0, y: 0, z: 34 },
  novaPos: null as { x: number; y: number; z?: number } | null,
  novaTalking: 0, nexTalking: 0,
  cam: { x: 0, y: 0, zoom: 1, shake: 0, h: 0 },
  particles: [] as Particle[],
  path: null as P2[] | null,
  tapUse: null as string | null,
  tapMark: null as null | { x: number; y: number; t: number },
  /** Coisa carregada pelo NEX (desenhada em cima da cabeça). */
  carry: null as null | (() => Sprite),
  /** Rastro dos passos do NEX (para quem o segue). */
  trail: [] as P2[],
  /** Balões de emoção ( ! ? ♥ … ) sobre personagens. */
  emotes: [] as { x: number; y: number; z: number; kind: string; t: number; dur: number; follow?: () => { x: number; y: number; z?: number } }[],
  walkDist: 0,
  novaOn: false,
  view: { w: 0, h: 0, k: 1, dpr: 1 }, // pixels internos e escala
}

export const FOCUS = { active: false, x: 0, y: 0, zoom: 1, h: 0 }

/** Gesto do NEX por alguns segundos. */
export function gesture(p: Pose, dur = 1.4) { RT.pose = p; RT.poseT = dur }

/** Ponto do mundo → ponto na tela (pixels CSS), para a seta do objetivo. */
export function worldToCss(x: number, y: number, z = 0) {
  const v = RT.view, c = RT.cam
  const a = iso(x, y, z), b = iso(c.x, c.y, c.h)
  const zx = (a.sx - b.sx) * c.zoom + v.w / 2, zy = (a.sy - b.sy) * c.zoom + v.h / 2
  return { x: (zx * v.k) / v.dpr, y: (zy * v.k) / v.dpr }
}

/** Faíscas/poeira: n partículas saindo de (x, y, z). */
export function burst(x: number, y: number, z: number, n: number, colors: string[], o: { spd?: number; up?: number; life?: number; g?: number; s?: number } = {}) {
  const spd = o.spd ?? 1.6, up = o.up ?? 40, life = o.life ?? 0.9
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = (0.3 + Math.random() * 0.7) * spd
    RT.particles.push({ x, y, z, vx: Math.cos(a) * r, vy: Math.sin(a) * r, vz: up * (0.4 + Math.random() * 0.8), life: life * (0.6 + Math.random() * 0.6), max: life, c: colors[i % colors.length], s: o.s ?? (Math.random() < 0.3 ? 2 : 1), g: o.g ?? 90 })
  }
}

/** Reinicia o estado do mundo ao trocar de fase. */
export function resetRT() {
  RT.frozen = false; RT.nexScale = 1; RT.nexHidden = false; RT.pose = 'idle'; RT.poseT = 0; RT.lookAt = null
  RT.carry = null; RT.trail = []; RT.emotes = []; RT.nexZ = 0
  RT.novaPos = null; RT.novaOn = false; RT.novaTalking = 0; RT.nexTalking = 0; RT.particles = []; RT.path = null; RT.tapUse = null; RT.tapMark = null
  RT.cam.shake = 0; RT.cam.zoom = 1; RT.cam.h = 0
  FOCUS.active = false
}

/** Um balão de emoção sobre um ponto (ou seguindo alguém). kind: '!', '?', '♥', '…', 'zz', 'ideia', 'tonto', '♪'. */
export function emote(kind: string, at: { x: number; y: number; z?: number } | (() => { x: number; y: number; z?: number }), dur = 1.6) {
  const f = typeof at === 'function' ? at : null
  const p = f ? f() : (at as { x: number; y: number; z?: number })
  RT.emotes.push({ x: p.x, y: p.y, z: p.z ?? 40, kind, t: RT.time, dur, follow: f || undefined })
}
/** Balão sobre a cabeça do NEX. */
export const emoteNex = (kind: string, dur = 1.6) => emote(kind, () => ({ x: RT.player.x, y: RT.player.y, z: 40 * RT.nexScale }), dur)
