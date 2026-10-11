/* =========================================================
   Os modelinhos de verdade das Fases 2 e 3 (vindos da versão
   clássica): tokenizador didático, contagem de Markov, o
   mini-modelo de 27 pesos, a busca da biblioteca (RAG) e a
   MiniLM que o jogador treina do zero no navegador.
   ========================================================= */
export function softmax(l: number[], T = 1) { const m = Math.max(...l); const e = l.map((v) => Math.exp((v - m) / T)); const s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s) }
export function seeded(s: number) { return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 } }
export const pct = (p: number, d = 0) => (p * 100).toFixed(d).replace('.', ',') + '%'

/* ---------- tokenizador didático ---------- */
const PT_COMMON = new Set(('qual é a o e de do da dos das em no na nos nas um uma uns umas para por pelo pela com sem não sim que se os as ao aos à às eu tu ele ela nós eles elas você vocês meu minha seu sua isso isto este esta esse essa como mas mais muito pouco já só também até quando onde quem porque ser ter estar foi era está são tem vai fui ' +
  'capital brasil brasília paris roma lisboa frança itália cidade país casa tempo ano dia vida mundo gente bom boa feliz token texto modelo frase palavra olá oi obrigado hoje amanhã ontem agora sempre nunca futebol samba famoso famosa virtude filosofia biblioteca horário sábado').split(' '))
const PT_PREFIX = ['super', 'inter', 'anti', 'des', 'pre', 'sub', 're', 'in']
const PT_SUFFIX = ['amento', 'imento', 'ização', 'mente', 'ções', 'idade', 'agem', 'ismo', 'ista', 'ável', 'ível', 'ncia', 'ção', 'inho', 'inha', 'ando', 'endo', 'indo', 'eiro', 'eira', 'izar', 'dora', 'dor', 'oso', 'osa']
export function tokenizeWord(w: string): string[] {
  const lw = w.toLowerCase()
  if (w.length <= 5 || PT_COMMON.has(lw)) return [w]
  const parts: string[] = []; let rest = w, suf: string | null = null
  for (const p of PT_PREFIX) if (lw.startsWith(p) && w.length - p.length >= 4) { parts.push(rest.slice(0, p.length)); rest = rest.slice(p.length); break }
  const rl = rest.toLowerCase()
  for (const s of PT_SUFFIX) if (rl.endsWith(s) && rest.length - s.length >= 3) { suf = rest.slice(rest.length - s.length); rest = rest.slice(0, rest.length - s.length); break }
  if (rest.length <= 7 || PT_COMMON.has(rest.toLowerCase())) parts.push(rest)
  else for (let i = 0; i < rest.length; i += 4) parts.push(rest.slice(i, i + 4))
  if (suf) parts.push(suf)
  return parts
}
export function tokenize(text: string): { t: string; g: number }[] {
  const out: { t: string; g: number }[] = []; let g = 0
  const re = /(\p{L}+)|(\p{N}+)|(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)|([^\s\p{L}\p{N}])/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    g++
    if (m[1]) tokenizeWord(m[1]).forEach((t) => out.push({ t, g }))
    else if (m[2]) for (let i = 0; i < m[2].length; i += 3) out.push({ t: m[2].slice(i, i + 3), g })
    else if (m[3]) { const n = Math.max(2, Math.ceil(new TextEncoder().encode(m[3]).length / 2)); out.push({ t: m[3], g }); for (let i = 1; i < n; i++) out.push({ t: '⋯', g }) }
    else out.push({ t: m[4], g })
  }
  return out
}
export const KNOWN_IDS: Record<string, number> = { Qual: 1842, 'é': 91, a: 17, capital: 7231, do: 52, Brasil: 4098, '?': 8 }
export function tokenId(t: string) { if (KNOWN_IDS[t] != null) return KNOWN_IDS[t]; let x = 5381; for (const ch of t) x = ((x * 33) ^ ch.codePointAt(0)!) >>> 0; return 100 + (x % 49900) }
/** A pergunta que atravessa a fábrica. */
export const QUESTION = ['Qual', 'é', 'a', 'capital', 'do', 'Brasil', '?']

/* ---------- contagem de Markov: quem vem depois de quem ---------- */
export const CORPUS = ['A capital do Brasil é Brasília .', 'A capital da França é Paris .', 'A capital da Itália é Roma .', 'O Brasil é famoso pelo futebol .', 'O Brasil é famoso pelo samba .', 'Brasília é uma cidade planejada .', 'Paris é uma cidade linda .', 'O futebol é uma paixão .']
const NEXT: Record<string, Record<string, number>> = {}
for (const s of CORPUS) { const t = ['⟨início⟩', ...s.split(' ')]; for (let i = 0; i < t.length - 1; i++) { (NEXT[t[i]] ||= {})[t[i + 1]] = (NEXT[t[i]][t[i + 1]] || 0) + 1 } }
export interface Cand { t: string; c: number; p: number }
export function nextDist(w: string): Cand[] {
  const n = NEXT[w] || {}
  const tot = Object.values(n).reduce((a, b) => a + b, 0) || 1
  return Object.entries(n).map(([t, c]) => ({ t, c, p: c / tot })).sort((a, b) => b.c - a.c || a.t.localeCompare(b.t))
}
export function withT(d: Cand[], T: number): Cand[] { const p = softmax(d.map((x) => Math.log(x.c) / T)); return d.map((x, i) => ({ ...x, p: p[i] })) }

/* ---------- mini-modelo de 27 pesos ---------- */
export const MINI = {
  V: ['Brasília', 'Rio', 'São Paulo', 'Paris', 'Roma', 'futebol', 'PIB', 'banana', 'Brasil'],
  K: [
    { t: 'A capital do Brasil é ___', short: 'capital do Brasil', x: [1.0, 0.3, 0.2], y: 0 },
    { t: 'A capital da França é ___', short: 'capital da França', x: [0.3, 1.0, 0.2], y: 3 },
    { t: 'O Brasil é famoso pelo ___', short: 'Brasil famoso pelo', x: [0.5, 0.1, 1.0], y: 5 },
  ],
  EX: [
    { s: 'A capital do Brasil é Brasília.', k: 0, n: [0, 0, 0] },
    { s: 'Brasília é a capital federal do Brasil.', k: 0, n: [0.05, -0.04, 0.03] },
    { s: 'A capital brasileira é Brasília.', k: 0, n: [-0.04, 0.05, 0] },
    { s: 'A capital da França é Paris.', k: 1, n: [0, 0, 0] },
    { s: 'O Brasil é famoso pelo futebol.', k: 2, n: [0, 0, 0] },
  ],
  init(): number[][] {
    const r = seeded(7); const W = this.V.map(() => [0, 0, 0].map(() => (r() - 0.5) * 0.6))
    const add = (t: string, v: number[]) => { const i = this.V.indexOf(t); for (let d = 0; d < 3; d++) W[i][d] += v[d] }
    add('Rio', [1.3, 0, 0]); add('São Paulo', [0.9, 0, 0]); add('Brasil', [0.8, 0, 0]); add('Brasília', [-0.2, 0, 0]); add('Roma', [0, 0.6, 0]); add('PIB', [0, 0, 0.5]); add('banana', [0, 0, 0.3])
    return W
  },
  logits(W: number[][], x: number[], boost?: number[]) { return W.map((w, i) => w[0] * x[0] + w[1] * x[1] + w[2] * x[2] + (boost ? boost[i] || 0 : 0)) },
  probs(W: number[][], x: number[], boost?: number[]) { return softmax(this.logits(W, x, boost)) },
  step(W: number[][], x: number[], y: number, lr: number) {
    const p = this.probs(W, x)
    const g = W.map((_, j) => x.map((xd) => (p[j] - (j === y ? 1 : 0)) * xd))
    for (let j = 0; j < W.length; j++) for (let d = 0; d < 3; d++) W[j][d] -= lr * g[j][d]
    return { loss: -Math.log(p[y]), g, p }
  },
  exX(e: { k: number; n: number[] }) { return this.K[e.k].x.map((v, d) => v + e.n[d]) },
  copy(W: number[][]) { return W.map((r) => [...r]) },
  pretrained() { const W = this.init(); let s = 0; while (this.probs(W, this.K[0].x)[0] < 0.96 && s < 500) { const e = this.EX[s % this.EX.length]; this.step(W, this.exX(e), this.K[e.k].y, 0.8); s++ } return W },
}

/* ---------- a biblioteca (busca simples por palavras) ---------- */
const STOPW = new Set('que qual quais quem onde quando como para por pelo pela pelos pelas com sem uma uns umas dos das nos nas aos isso isto ele ela eles elas seu sua seus suas ser sao foi mais muito entre sobre lidam nao tem ter horas sai'.split(' '))
const normTxt = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const stemsOf = (s: string) => normTxt(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOPW.has(w)).map((w) => w.slice(0, 5))
type Bag = Record<string, number>
function bagOf(s: string, wgt = 1, into: Bag = {}) { for (const st of stemsOf(s)) into[st] = (into[st] || 0) + wgt; return into }
function cosBag(a: Bag, b: Bag) { let dot = 0, na = 0, nb = 0; for (const k in a) { na += a[k] * a[k]; if (b[k]) dot += a[k] * b[k] } for (const k in b) nb += b[k] * b[k]; return na && nb ? dot / Math.sqrt(na * nb) : 0 }
export interface RagDoc { c: string; s: string; t: string; x: string; k: string; bag?: Bag }
export const RAG_DOCS: RagDoc[] = [
  { c: 'Platão', s: 'Caverna', t: 'República · Alegoria da caverna', x: 'Na alegoria da caverna, prisioneiros veem apenas sombras na parede e as tomam pela realidade. A filosofia é a saída em direção à luz do conhecimento.', k: 'Platão caverna sombras realidade república conhecimento ideias' },
  { c: 'Aristóteles', s: 'Virtude', t: 'Ética a Nicômaco · Virtude', x: 'A virtude é uma disposição adquirida pelo hábito: escolher o meio-termo entre dois extremos, como a coragem entre a covardia e a temeridade.', k: 'Aristóteles virtude virtudes hábito meio-termo ética coragem entende define' },
  { c: 'Estoicos', s: 'Controle', t: 'Epicteto · O que depende de nós', x: 'Algumas coisas dependem de nós, como nossos juízos e escolhas, e outras não. A serenidade vem de cuidar do que depende de nós e aceitar o resto.', k: 'Epicteto estoicos estoicismo controle controlamos depende serenidade aceitar' },
  { c: 'Faculdade', s: 'Horários', t: 'Regulamento da biblioteca', x: 'A biblioteca do campus funciona de segunda a sexta, das 8h às 22h, e aos sábados, das 9h às 13h. Empréstimos duram 14 dias.', k: 'biblioteca horário abre fecha funciona sábado empréstimo campus' },
  { c: 'Faculdade', s: 'Provas', t: 'Calendário acadêmico', x: 'As provas finais do semestre acontecem entre 30 de novembro e 11 de dezembro.', k: 'provas finais semestre calendário datas' },
]
export const CANTINA: RagDoc = { c: 'Seus documentos', s: 'Cantina', t: 'Cantina do campus', x: 'A cantina do campus serve pão de queijo quentinho todos os dias, às 10h e às 16h.', k: 'cantina pão queijo lanche horário campus' }
for (const d of [...RAG_DOCS, CANTINA]) d.bag = bagOf(d.t + ' ' + d.x, 1, bagOf(d.k, 2))
export function ragSearch(q: string, docs: RagDoc[]) { const qb = bagOf(q); return docs.map((d) => ({ d, s: cosBag(qb, d.bag!) })).sort((a, b) => b.s - a.s) }

/* ---------- a MiniLM que o jogador treina (Fase 3) ---------- */
export const LM_BOS = '⟨início⟩', LM_EOS = '⟨fim⟩', LM_UNK = '⟨?⟩'
export const lmTokenize = (s: string) => s.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) || []
export class MiniLM {
  win: number; D = 3; H = 12; vocab: string[]; V: number; pairs: [number[], number][] = []
  E: number[][]; W1: number[][]; b1: number[]; W2: number[][]; b2: number[]; epochs = 0
  constructor(sents: string[], win: number, seed = 3) {
    this.win = win; this.vocab = [LM_BOS, LM_EOS, LM_UNK]
    sents.forEach((s) => lmTokenize(s).forEach((t) => { if (!this.vocab.includes(t)) this.vocab.push(t) }))
    this.V = this.vocab.length
    for (const s of sents) { const ids = [...Array(win).fill(0), ...lmTokenize(s).map((t) => this.id(t)), 1]; for (let i = win; i < ids.length; i++) this.pairs.push([ids.slice(i - win, i), ids[i]]) }
    const r = seeded(seed), g = () => (r() - 0.5) * 2, D = this.D, H = this.H, V = this.V
    this.E = Array.from({ length: V }, () => Array.from({ length: D }, () => g() * 0.8))
    this.W1 = Array.from({ length: H }, () => Array.from({ length: win * D }, () => g() * 0.5)); this.b1 = Array(H).fill(0)
    this.W2 = Array.from({ length: V }, () => Array.from({ length: H }, () => g() * 0.3)); this.b2 = Array(V).fill(0)
  }
  get params() { return this.V * this.D + this.H * this.win * this.D + this.H + this.V * this.H + this.V }
  id(t: string) { const i = this.vocab.indexOf(t); return i < 0 ? 2 : i }
  fwd(ctx: number[]) {
    const x: number[] = []; ctx.forEach((t) => x.push(...this.E[t]))
    const h = this.W1.map((w, i) => Math.tanh(w.reduce((a, v, j) => a + v * x[j], this.b1[i])))
    const l = this.W2.map((w, i) => w.reduce((a, v, j) => a + v * h[j], this.b2[i]))
    return { x, h, l, p: softmax(l) }
  }
  step(ctx: number[], y: number, lr: number) {
    const { x, h, p } = this.fwd(ctx)
    const dl = p.map((v, i) => v - (i === y ? 1 : 0)); const dh = Array(this.H).fill(0)
    for (let i = 0; i < this.V; i++) { for (let j = 0; j < this.H; j++) { dh[j] += dl[i] * this.W2[i][j]; this.W2[i][j] -= lr * dl[i] * h[j] } this.b2[i] -= lr * dl[i] }
    const dz = dh.map((v, j) => v * (1 - h[j] * h[j])); const dx = Array(x.length).fill(0)
    for (let j = 0; j < this.H; j++) { for (let k = 0; k < x.length; k++) { dx[k] += dz[j] * this.W1[j][k]; this.W1[j][k] -= lr * dz[j] * x[k] } this.b1[j] -= lr * dz[j] }
    ctx.forEach((t, c) => { for (let d = 0; d < this.D; d++) this.E[t][d] -= lr * dx[c * this.D + d] })
    return -Math.log(p[y])
  }
  epoch(lr = 0.08) { let L = 0; for (const [c, y] of this.pairs) L += this.step(c, y, lr); this.epochs++; return L / this.pairs.length }
  /** Erro médio sem treinar (para mostrar o começo da curva). */
  loss() { let L = 0; for (const [c, y] of this.pairs) L += -Math.log(this.fwd(c).p[y]); return L / Math.max(1, this.pairs.length) }
  ctxOf(ids: number[]) { const pad = [...Array(this.win).fill(0), ...ids]; return pad.slice(pad.length - this.win) }
  predict(toks: string[]) { const ids = toks.map((t) => this.id(t)); return this.fwd(this.ctxOf(ids)) }
  /** As palavras mais prováveis depois do começo dado. */
  top(toks: string[], n = 4, T = 1) {
    const { l } = this.predict(toks)
    const p = softmax(l, T)
    return p.map((v, i) => ({ t: this.vocab[i], p: v })).filter((x) => x.t !== LM_BOS && x.t !== LM_UNK).sort((a, b) => b.p - a.p).slice(0, n)
  }
  /** Escreve sozinha a partir do começo (sorteando pela temperatura). */
  write(toks: string[], T = 0.7, max = 12, rnd: () => number = Math.random) {
    const out = [...toks]
    for (let k = 0; k < max; k++) {
      const { l } = this.predict(out)
      const p = softmax(l, T)
      let r = rnd(), i = 0
      for (; i < p.length - 1; i++) { r -= p[i]; if (r <= 0) break }
      const w = this.vocab[i]
      if (w === LM_EOS) break
      if (w === LM_BOS || w === LM_UNK) continue
      out.push(w)
      if (w === '.') break
    }
    return out
  }
}

/* ---------- embeddings (galáxia de palavras) ---------- */
export interface Star { w: string; g: string; x: number; y: number }
export const GROUPS: Record<string, { name: string; color: string; c: [number, number] }> = {
  paises: { name: 'Países', color: '#59d7ff', c: [0, 0] },
  capitais: { name: 'Capitais', color: '#ffd27a', c: [2.4, 0.5] },
  futebol: { name: 'Futebol', color: '#7ef0a0', c: [-1.6, 2.4] },
  economia: { name: 'Economia', color: '#ff9a8a', c: [2.2, 2.9] },
  comida: { name: 'Comida', color: '#f0a8ff', c: [-2.2, -1.4] },
}
