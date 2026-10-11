import { G, useGame } from '../store'
import { STOPS, PEOPLE } from '../content/stops'
import { ZONES } from './p2/zones'
import { STATIONS } from './p3/lab'
import { gotoLevel } from '../engine/script'
import { initAudio, SFX } from '../engine/audio'

/* =========================================================
   Capítulos e missões: o jogador escolhe onde quer jogar.
   As missões antes da escolhida contam como feitas (e as
   fases anteriores, como concluídas); a partir dela, a fase
   recomeça. As fases depois ficam como estavam.
   ========================================================= */
export interface Mission { label: string; sub: string; color?: string }
export interface Chapter { level: string; phase: number; title: string; missions: Mission[] }

const lostWords = ['Madri', 'pênalti', 'salário']
const GI = STOPS.findIndex((s) => s.custom === 'graos')

export const CHAPTERS: Chapter[] = [
  { level: 'quarto', phase: 0, title: 'O Quarto', missions: [{ label: 'Uma pergunta', sub: '“Como você funciona?”' }] },
  { level: 'prologo', phase: 0, title: 'A Language Engine', missions: [{ label: 'A máquina que esqueceu', sub: 'Conheça a NOVA e acorde a Engine' }] },
  {
    level: 'p1', phase: 1, title: 'O Arquivo da Memória', missions: [
      { label: 'Chegada ao Arquivo', sub: 'O arquipélago da memória' },
      ...STOPS.map((s) => ({ label: `${s.year} · ${s.doc.title}`, sub: PEOPLE[s.who].name, color: PEOPLE[s.who].color })),
      { label: 'A Memória Central', sub: 'As onze palavras voltam ao núcleo' },
    ],
  },
  {
    level: 'p2', phase: 2, title: 'A Fábrica de Previsões', missions: [
      { label: 'Chegada à fábrica', sub: 'A pergunta chega à Engine' },
      ...ZONES.map((z, k) => ({ label: `Estação ${k + 1} · ${z.name}`, sub: z.word.charAt(0) + z.word.slice(1).toLowerCase(), color: z.color })),
      { label: 'A grande pergunta', sub: '“Qual é a capital do Brasil?”' },
    ],
  },
  {
    level: 'p3', phase: 3, title: 'O Laboratório', missions: [
      { label: 'Chegada ao laboratório', sub: 'Dê um nome à sua LLM' },
      ...STATIONS.map((s, k) => ({ label: `Estação ${k + 1} · ${s.name}`, sub: s.word.charAt(0) + s.word.slice(1).toLowerCase(), color: s.color })),
      { label: 'A despedida', sub: 'O portal para casa' },
    ],
  },
  { level: 'fim', phase: 4, title: 'De Volta para Casa', missions: [{ label: 'A resposta', sub: 'O fim da história' }] },
]

/* ---------- que flags pertencem a cada fase ---------- */
const OWNS: Record<string, (k: string) => boolean> = {
  quarto: (k) => (/^q_/.test(k) && k !== 'q_pc2') || k === 'quarto_done',
  prologo: (k) => /^pro_/.test(k) || k === 'nova',
  p1: (k) => /^l1_/.test(k) || /^g2_/.test(k),
  p2: (k) => /^p2(i|v)?_/.test(k),
  p3: (k) => /^p3_/.test(k),
  fim: (k) => k === 'fim_done' || k === 'q_pc2',
}
type F = Record<string, number>
const p1Stops = (n: number, f: F) => {
  for (let j = 0; j < n; j++) f['l1_' + STOPS[j].id] = 1
  if (n > GI) Object.assign(f, { g2_talk: 1, g2_seen: 1, g2_six: 1, g2_rev: 1, g2_pred: 1 })
}
const p2Zones = (n: number, f: F) => {
  for (let j = 0; j < n; j++) {
    const id = ZONES[j].id
    f['p2_' + id] = 1; f['p2i_' + id] = 1
    if (id === 'vetores') { for (const w of lostWords) f['p2v_' + w] = 1; f.p2v_arrow = 1; f.p2v_lisboa = 1 }
  }
}
const p3Stations = (n: number, f: F, cur: F) => {
  for (let j = 0; j < n; j++) f['p3_' + STATIONS[j].id] = 1
  f.p3_nome = cur.p3_nome || 1
  if (cur.p3_mask) f.p3_mask = cur.p3_mask
  if (n >= 2) f.p3_mem = cur.p3_mem || 3
  if (n >= 3) f.p3_ep = cur.p3_ep || 60
}
/** Flags de uma fase até a missão mi (exclusive); mi = -1 = fase toda concluída. */
function partial(level: string, mi: number, cur: F): F {
  const f: F = {}
  const all = mi < 0
  switch (level) {
    case 'quarto': if (all) Object.assign(f, { quarto_done: 1, q_pc: 1 }); break
    case 'prologo': if (all) Object.assign(f, { pro_seen: 1, pro_on: 1, pro_door: 1, pro_break: 2, pro_portal: 1, pro_done: 1, nova: 1 }); break
    case 'p1': {
      const n = all ? STOPS.length : mi - 1
      if (mi === 0) break
      f.l1_intro = 1; f.l1_arq = 1
      p1Stops(Math.min(n, STOPS.length), f)
      if (all) Object.assign(f, { l1_final: 1, l1_done: 1 })
      break
    }
    case 'p2': {
      if (mi === 0) break
      f.p2_intro = 1
      p2Zones(all ? ZONES.length : Math.min(mi - 1, ZONES.length), f)
      if (all) Object.assign(f, { p2_final: 1, p2_done: 1 })
      break
    }
    case 'p3': {
      if (mi === 0) break
      f.p3_intro = 1
      const n = all ? STATIONS.length : Math.min(mi - 1, STATIONS.length)
      p3Stations(n, f, cur)
      if (all || mi > STATIONS.length) Object.assign(f, { p3_nota: cur.p3_nota || 8, p3_done: 1 })
      break
    }
    case 'fim': if (all) f.fim_done = 1; break
  }
  return f
}
const CORE_OF: Record<string, string> = { p1: 'MATRIX', p2: 'TRANSFORMER', p3: 'CREATOR' }

/** Leva o jogador direto para a missão mi do capítulo ci. */
export function jumpTo(ci: number, mi: number) {
  const g = G()
  if (g.loading) return
  const ch = CHAPTERS[ci], cur = g.flags
  const f: F = { ...cur }
  const cores = [...g.cores]
  CHAPTERS.forEach((c, i) => {
    if (i >= ci) return
    Object.assign(f, partial(c.level, -1, f))
    const core = CORE_OF[c.level]
    if (core && !cores.includes(core)) cores.push(core)
  })
  for (const k of Object.keys(f)) if (OWNS[ch.level]?.(k)) delete f[k]
  Object.assign(f, partial(ch.level, mi, cur))
  const visited = g.visited.includes(ch.level) ? g.visited : [...g.visited, ch.level]
  useGame.setState({ flags: f, cores, visited, objective: null, menu: null })
  SFX.play('open')
  if (useGame.getState().screen === 'title') {
    initAudio()
    useGame.setState({ screen: 'game', level: '', loading: ch.level, levelReady: null })
  } else gotoLevel(ch.level)
}

/** Esta missão já foi feita? (para marcar na lista) */
export function missionDone(ci: number, mi: number, f: F): boolean {
  const ch = CHAPTERS[ci]
  const last = ch.missions.length - 1
  switch (ch.level) {
    case 'quarto': return !!f.quarto_done
    case 'prologo': return !!f.pro_done
    case 'p1': return mi === 0 ? !!f.l1_intro : mi === last ? !!f.l1_final : !!f['l1_' + STOPS[mi - 1].id]
    case 'p2': return mi === 0 ? !!f.p2_intro : mi === last ? !!f.p2_final : !!f['p2_' + ZONES[mi - 1].id]
    case 'p3': return mi === 0 ? !!f.p3_intro : mi === last ? !!f.p3_done : !!f['p3_' + STATIONS[mi - 1].id]
    case 'fim': return !!f.fim_done
  }
  return false
}
