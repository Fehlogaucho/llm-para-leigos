/* ============ Modelos compartilhados ============ */
/* ============ Tokenizador didático (compartilhado) ============ */
const PT_COMMON = new Set(('qual é a o e de do da dos das em no na nos nas um uma uns umas para por pelo pela com sem não sim que se os as ao aos à às eu tu ele ela nós eles elas você vocês meu minha seu sua isso isto este esta esse essa como mas mais muito pouco já só também até quando onde quem porque ser ter estar foi era está são tem vai fui ' +
  'capital brasil brasília paris roma lisboa frança itália cidade país casa tempo ano dia vida mundo gente bom boa feliz token texto modelo frase palavra olá oi obrigado hoje amanhã ontem agora sempre nunca futebol samba famoso famosa virtude filosofia biblioteca horário sábado').split(' '));
const PT_PREFIX = ['super', 'inter', 'anti', 'des', 'pre', 'sub', 're', 'in'];
const PT_SUFFIX = ['amento', 'imento', 'ização', 'mente', 'ções', 'idade', 'agem', 'ismo', 'ista', 'ável', 'ível', 'ncia', 'ção', 'inho', 'inha', 'ando', 'endo', 'indo', 'eiro', 'eira', 'izar', 'dora', 'dor', 'oso', 'osa'];
function tokenizeWord(w) {
  const lw = w.toLowerCase();
  if (w.length <= 5 || PT_COMMON.has(lw)) return [w];
  const parts = []; let rest = w, suf = null;
  for (const p of PT_PREFIX) if (lw.startsWith(p) && w.length - p.length >= 4) { parts.push(rest.slice(0, p.length)); rest = rest.slice(p.length); break; }
  const rl = rest.toLowerCase();
  for (const s of PT_SUFFIX) if (rl.endsWith(s) && rest.length - s.length >= 3) { suf = rest.slice(rest.length - s.length); rest = rest.slice(0, rest.length - s.length); break; }
  if (rest.length <= 7 || PT_COMMON.has(rest.toLowerCase())) parts.push(rest);
  else for (let i = 0; i < rest.length; i += 4) parts.push(rest.slice(i, i + 4));
  if (suf) parts.push(suf);
  return parts;
}
function tokenizeDetailed(text) {
  const out = []; let g = 0;
  const re = /(\p{L}+)|(\p{N}+)|(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)|([^\s\p{L}\p{N}])/gu;
  let m;
  while ((m = re.exec(text))) {
    g++;
    if (m[1]) tokenizeWord(m[1]).forEach(t => out.push({ t, g }));
    else if (m[2]) for (let i = 0; i < m[2].length; i += 3) out.push({ t: m[2].slice(i, i + 3), g });
    else if (m[3]) { const n = Math.max(2, Math.ceil(new TextEncoder().encode(m[3]).length / 2)); out.push({ t: m[3], g }); for (let i = 1; i < n; i++) out.push({ t: '⋯', g }); }
    else out.push({ t: m[4], g });
  }
  return out;
}
const tokenize = text => tokenizeDetailed(text).map(x => x.t);
const KNOWN_IDS = { Qual: 1842, 'é': 91, a: 17, capital: 7231, do: 52, Brasil: 4098, '?': 8 };
function tokenId(t) { if (KNOWN_IDS[t] != null) return KNOWN_IDS[t]; let x = 5381; for (const ch of t) x = ((x * 33) ^ ch.codePointAt(0)) >>> 0; return 100 + x % 49900; }
const PRICE_IN = 3; // US$ por 1 milhão de tokens de entrada (valor de exemplo)
const usd = v => 'US$ ' + (v < 0.01 ? v.toFixed(6) : v.toFixed(2)).replace('.', ',');


/* ============ Mini-modelo de 27 pesos (fases 6 e 7) ============ */
const MINI = {
  V: ['Brasília', 'Rio', 'São Paulo', 'Paris', 'Roma', 'futebol', 'PIB', 'banana', 'Brasil'],
  K: [
    { t: 'A capital do Brasil é ___', short: 'capital do Brasil', x: [1.0, 0.3, 0.2], y: 0 },
    { t: 'A capital da França é ___', short: 'capital da França', x: [0.3, 1.0, 0.2], y: 3 },
    { t: 'O Brasil é famoso pelo ___', short: 'Brasil famoso pelo', x: [0.5, 0.1, 1.0], y: 5 }],
  EX: [
    { s: 'A capital do Brasil é Brasília.', k: 0, n: [0, 0, 0] },
    { s: 'Brasília é a capital federal do Brasil.', k: 0, n: [0.05, -0.04, 0.03] },
    { s: 'A capital brasileira é Brasília.', k: 0, n: [-0.04, 0.05, 0] },
    { s: 'A capital da França é Paris.', k: 1, n: [0, 0, 0] },
    { s: 'O Brasil é famoso pelo futebol.', k: 2, n: [0, 0, 0] }],
  init() {
    const r = seeded(7); const W = this.V.map(() => [0, 0, 0].map(() => (r() - 0.5) * 0.6));
    const add = (t, v) => { const i = this.V.indexOf(t); for (let d = 0; d < 3; d++) W[i][d] += v[d]; };
    add('Rio', [1.3, 0, 0]); add('São Paulo', [0.9, 0, 0]); add('Brasil', [0.8, 0, 0]); add('Brasília', [-0.2, 0, 0]); add('Roma', [0, 0.6, 0]); add('PIB', [0, 0, 0.5]); add('banana', [0, 0, 0.3]);
    return W;
  },
  logits(W, x, boost) { return W.map((w, i) => w[0] * x[0] + w[1] * x[1] + w[2] * x[2] + (boost ? boost[i] || 0 : 0)); },
  probs(W, x, boost) { return softmax(this.logits(W, x, boost)); },
  step(W, x, y, lr) {
    const p = this.probs(W, x); const g = W.map((w, j) => x.map(xd => (p[j] - (j === y ? 1 : 0)) * xd));
    for (let j = 0; j < W.length; j++) for (let d = 0; d < 3; d++) W[j][d] -= lr * g[j][d];
    return { loss: -Math.log(p[y]), g, p };
  },
  exX(e) { return this.K[e.k].x.map((v, d) => v + e.n[d]); },
  copy(W) { return W.map(r => [...r]); },
  pretrained() { const W = this.init(); let s = 0; while (this.probs(W, this.K[0].x)[0] < 0.96 && s < 500) { const e = this.EX[s % this.EX.length]; this.step(W, this.exX(e), this.K[e.k].y, 0.8); s++; } return W; }
};

/* ============ Busca semântica simplificada (fases 8 e 9) ============ */
const STOPW = new Set('que qual quais quem onde quando como para por pelo pela pelos pelas com sem uma uns umas dos das nos nas aos isso isto ele ela eles elas seu sua seus suas ser sao foi mais muito entre sobre lidam nao tem ter'.split(' '));
const normTxt = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const stemsOf = s => normTxt(s).split(/[^a-z0-9]+/).filter(w => w.length > 2 && !STOPW.has(w)).map(w => w.slice(0, 5));
function bagOf(s, wgt = 1, into = {}) { for (const st of stemsOf(s)) into[st] = (into[st] || 0) + wgt; return into; }
function cosBag(a, b) { let dot = 0, na = 0, nb = 0; for (const k in a) { na += a[k] * a[k]; if (b[k]) dot += a[k] * b[k]; } for (const k in b) nb += b[k] * b[k]; return na && nb ? dot / Math.sqrt(na * nb) : 0; }
const RAG_COLS = {
  facul: { name: 'Faculdade (fictícia)', color: 'var(--ipe)' },
  platao: { name: 'Platão', color: 'var(--anil-soft)' },
  arist: { name: 'Aristóteles', color: 'var(--mata-soft)' },
  estoic: { name: 'Estoicos', color: 'var(--urucum-soft)' },
  nietz: { name: 'Nietzsche', color: 'var(--jaca-soft)' },
  seus: { name: 'Seus documentos', color: 'var(--sheet)' }
};
const RAG_DOCS = [
  { c: 'platao', s: 'Caverna', t: 'República · Alegoria da caverna', x: 'Na alegoria da caverna, prisioneiros veem apenas sombras na parede e as tomam pela realidade. A filosofia é a saída em direção à luz do conhecimento.', k: 'Platão caverna sombras realidade república conhecimento ideias' },
  { c: 'platao', s: 'Alma', t: 'Fédon · A alma', x: 'Platão argumenta que a alma é imortal e que aprender é, em parte, recordar o que a alma já conhecia.', k: 'Platão alma imortal morte recordar' },
  { c: 'arist', s: 'Virtude', t: 'Ética a Nicômaco · Virtude', x: 'A virtude é uma disposição adquirida pelo hábito, que consiste em escolher o meio-termo entre dois extremos, como a coragem entre a covardia e a temeridade.', k: 'Aristóteles virtude virtudes hábito meio-termo ética coragem entende define' },
  { c: 'arist', s: 'Felicidade', t: 'Ética a Nicômaco · Felicidade', x: 'Para Aristóteles, a felicidade (eudaimonia) é o bem supremo, alcançado por uma vida de atividade de acordo com a virtude.', k: 'Aristóteles felicidade eudaimonia bem supremo' },
  { c: 'arist', s: 'Política', t: 'Política · O ser humano', x: 'Aristóteles afirma que o ser humano é, por natureza, um animal político, que se realiza vivendo na cidade (pólis).', k: 'Aristóteles política animal cidade pólis' },
  { c: 'estoic', s: 'Controle', t: 'Epicteto · O que depende de nós', x: 'Algumas coisas dependem de nós, como nossos juízos e escolhas, e outras não. A serenidade vem de cuidar do que depende de nós e aceitar o resto.', k: 'Epicteto estoicos estoicismo controle controlamos depende serenidade aceitar' },
  { c: 'estoic', s: 'Tempo', t: 'Sêneca · Sobre a brevidade da vida', x: 'A vida não é curta: nós é que a desperdiçamos. Bem usada, ela é longa o bastante.', k: 'Sêneca vida tempo breve curta estoicos' },
  { c: 'estoic', s: 'Meditações', t: 'Marco Aurélio · Meditações', x: 'Anotações pessoais em que o imperador se lembra de agir com justiça e de aceitar o que não pode mudar.', k: 'Marco Aurélio meditações imperador justiça estoicos' },
  { c: 'nietz', s: 'Zaratustra', t: 'Assim falou Zaratustra', x: 'Nietzsche propõe o além-do-homem: alguém que cria os próprios valores em vez de apenas herdá-los.', k: 'Nietzsche Zaratustra valores além-do-homem super-homem' },
  { c: 'facul', s: 'Horários', t: 'Regulamento da biblioteca (2026)', x: 'A biblioteca do campus funciona de segunda a sexta, das 8h às 22h, e aos sábados, das 9h às 13h. Empréstimos duram 14 dias.', k: 'biblioteca horário abre fecha funciona sábado empréstimo campus' },
  { c: 'facul', s: 'Provas', t: 'Calendário acadêmico', x: 'As provas finais do semestre acontecem entre 30 de novembro e 11 de dezembro.', k: 'provas finais semestre calendário datas' }
];
RAG_DOCS.forEach(d => d.bag = bagOf(d.t + ' ' + d.x, 1, bagOf(d.k, 2)));


/* ============ Fase 10 · Crie sua LLM ============ */
const LM_BOS = '⟨início⟩', LM_EOS = '⟨fim⟩', LM_UNK = '⟨?⟩';
const lmTokenize = s => s.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) || [];
class MiniLM {
  constructor(sents, win) {
    this.win = win; this.D = 3; this.H = 12; this.vocab = [LM_BOS, LM_EOS, LM_UNK];
    sents.forEach(s => lmTokenize(s).forEach(t => { if (!this.vocab.includes(t)) this.vocab.push(t); }));
    this.V = this.vocab.length; this.pairs = [];
    for (const s of sents) { const ids = [...Array(win).fill(0), ...lmTokenize(s).map(t => this.id(t)), 1]; for (let i = win; i < ids.length; i++) this.pairs.push([ids.slice(i - win, i), ids[i]]); }
    const r = seeded(3), g = () => (r() - 0.5) * 2, D = this.D, H = this.H, V = this.V;
    this.E = Array.from({ length: V }, () => Array.from({ length: D }, () => g() * 0.8));
    this.W1 = Array.from({ length: H }, () => Array.from({ length: win * D }, () => g() * 0.5)); this.b1 = Array(H).fill(0);
    this.W2 = Array.from({ length: V }, () => Array.from({ length: H }, () => g() * 0.3)); this.b2 = Array(V).fill(0);
    this.epochs = 0;
  }
  get params() { return this.V * this.D + this.H * this.win * this.D + this.H + this.V * this.H + this.V; }
  id(t) { const i = this.vocab.indexOf(t); return i < 0 ? 2 : i; }
  fwd(ctx) {
    const x = []; ctx.forEach(t => x.push(...this.E[t]));
    const hd = this.W1.map((w, i) => Math.tanh(w.reduce((a, v, j) => a + v * x[j], this.b1[i])));
    const l = this.W2.map((w, i) => w.reduce((a, v, j) => a + v * hd[j], this.b2[i]));
    return { x, h: hd, l, p: softmax(l) };
  }
  step(ctx, y, lr) {
    const { x, h: hd, p } = this.fwd(ctx); const dl = p.map((v, i) => v - (i === y ? 1 : 0)); const dh = Array(this.H).fill(0);
    for (let i = 0; i < this.V; i++) { for (let j = 0; j < this.H; j++) { dh[j] += dl[i] * this.W2[i][j]; this.W2[i][j] -= lr * dl[i] * hd[j]; } this.b2[i] -= lr * dl[i]; }
    const dz = dh.map((v, j) => v * (1 - hd[j] * hd[j])); const dx = Array(x.length).fill(0);
    for (let j = 0; j < this.H; j++) { for (let k = 0; k < x.length; k++) { dx[k] += dz[j] * this.W1[j][k]; this.W1[j][k] -= lr * dz[j] * x[k]; } this.b1[j] -= lr * dz[j]; }
    ctx.forEach((t, c) => { for (let d = 0; d < this.D; d++) this.E[t][d] -= lr * dx[c * this.D + d]; });
    return -Math.log(p[y]);
  }
  epoch(lr = 0.08) { let L = 0; for (const [c, y] of this.pairs) L += this.step(c, y, lr); this.epochs++; return L / this.pairs.length; }
  ctxOf(ids) { const pad = [...Array(this.win).fill(0), ...ids]; return pad.slice(pad.length - this.win); }
  predict(toks) { const ids = toks.map(t => this.id(t)); return this.fwd(this.ctxOf(ids)); }
}

/* ============ Máquina de Markov (fase 3): conta quem vem depois de quem ============ */
const MARKOV = {
  corpus: ['A capital do Brasil é Brasília .', 'A capital da França é Paris .', 'A capital da Itália é Roma .', 'O Brasil é famoso pelo futebol .', 'O Brasil é famoso pelo samba .', 'Brasília é uma cidade planejada .', 'Paris é uma cidade linda .', 'O futebol é uma paixão .'],
  build() {
    const next = {}; const add = (a, b) => { next[a] = next[a] || {}; next[a][b] = (next[a][b] || 0) + 1; };
    this.corpus.forEach(s => { const t = ['⟨início⟩', ...s.split(' ')]; for (let i = 0; i < t.length - 1; i++) add(t[i], t[i + 1]); });
    this.next = next; return this;
  },
  dist(w) { const n = this.next[w] || {}; const tot = Object.values(n).reduce((a, b) => a + b, 0) || 1; return Object.entries(n).map(([t, c]) => ({ t, c, p: c / tot })).sort((a, b) => b.c - a.c || a.t.localeCompare(b.t)); },
  withT(d, T) { const l = d.map(x => Math.log(x.c) / T); const p = softmax(l); return d.map((x, i) => ({ ...x, p: p[i] })); }
}.build();
/* cor de um peso (positivo = anil, negativo = urucum) para quadradinhos 2D */
function wCss(w, s = 1.6) { const a = Math.min(1, Math.abs(w) / s); const c = w >= 0 ? 'var(--anil)' : 'var(--urucum)'; return `color-mix(in srgb, ${c} ${Math.round(a * 88 + 6)}%, var(--sheet))`; }
