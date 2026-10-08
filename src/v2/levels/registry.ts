import type { Scene } from '../engine/runtime'

export interface LevelDef {
  id: string
  phase: number
  badge: string
  short: string
  title: string
  kicker: string
  sub: string
  theme: string
  img?: string
  tip: string
  quests?: { id: string; name: string }[]
  next?: string
  load: () => Promise<{ default: () => Scene }>
}

export interface PhaseDef { n: number; name: string; title: string; core?: string; desc: string }

export const PHASES: PhaseDef[] = [
  { n: 0, name: 'Prólogo', title: 'A Language Engine', desc: 'A máquina que responde, mas esqueceu por quê.' },
  { n: 1, name: 'Fase 1', title: 'As Origens', core: 'MATRIX', desc: 'Uma linha do tempo de 5.500 anos: fichas, tabelas, algoritmos, chances, zero e um, o menor erro, programas, matrizes, a próxima palavra, bits e neurônios.' },
  { n: 2, name: 'Fase 2', title: 'A Máquina das Palavras', core: 'TOKEN', desc: 'Linguagem, tokens, contexto e prompts.' },
  { n: 3, name: 'Fase 3', title: 'O Próximo Token', core: 'PROBABILITY', desc: 'Probabilidades, logits, softmax, temperatura e sampling.' },
  { n: 4, name: 'Fase 4', title: 'O Espaço das Ideias', core: 'EMBEDDING', desc: 'Embeddings, vetores e similaridade.' },
  { n: 5, name: 'Fase 5', title: 'A Teia da Atenção', core: 'ATTENTION', desc: 'Attention, Query, Key, Value e multi-head.' },
  { n: 6, name: 'Fase 6', title: 'A Torre Transformer', core: 'TRANSFORMER', desc: 'Camadas, posição, feed-forward, residual e normalização.' },
  { n: 7, name: 'Fase 7', title: 'A Fábrica de Inteligência', core: 'TRAINING', desc: 'Treinamento, loss, backpropagation, gradiente, RLHF e DPO.' },
  { n: 8, name: 'Fase 8', title: 'A Biblioteca Perdida', core: 'RETRIEVAL', desc: 'RAG, chunking, busca vetorial, reranking e alucinação.' },
  { n: 9, name: 'Fase 9', title: 'A LLM que Age', core: 'AGENTS', desc: 'Ferramentas, function calling, planejamento e memória.' },
  { n: 10, name: 'Fase 10', title: 'A Fábrica de Especialistas', core: 'SPECIALISTS', desc: 'Fine-tuning, quantização, KV cache e mistura de especialistas.' },
  { n: 11, name: 'Fase 11', title: 'Além da LLM', core: 'SYSTEMS', desc: 'MCP, multiagentes, guardrails, observabilidade e avaliação.' },
  { n: 12, name: 'Final', title: 'Você é a LLM', desc: 'Todos os sistemas juntos, token por token.' },
]

export const LEVELS: Record<string, LevelDef> = {}
export const LEVEL_ORDER: string[] = []
export function defineLevel(d: LevelDef) { LEVELS[d.id] = d; LEVEL_ORDER.push(d.id) }

defineLevel({
  id: 'quarto', phase: 0, badge: 'P', short: 'Prólogo · O Quarto', title: 'Uma Pergunta', kicker: 'PRÓLOGO', sub: 'Como você funciona?', theme: 'lab', img: '/img/v2/mundo.webp',
  tip: 'Chegue perto do computador e toque em “Usar”.',
  next: 'prologo', load: () => import('./prologo/Quarto'),
})
defineLevel({
  id: 'prologo', phase: 0, badge: 'P', short: 'Prólogo', title: 'A Language Engine', kicker: 'PRÓLOGO', sub: 'A máquina que esqueceu', theme: 'lab', img: '/img/v2/mundo.webp',
  tip: 'No celular: arraste o círculo para andar, ou toque no chão onde quer ir.',
  next: 'p1', load: () => import('./prologo/Prologo'),
})
defineLevel({
  id: 'p1', phase: 1, badge: '1', short: 'Fase 1 · Linha do Tempo', title: 'A Linha do Tempo', kicker: 'FASE 1 · AS ORIGENS', sub: 'A matemática por trás da LLM', theme: 'observatorio', img: '/img/v2/fundamentos.webp',
  tip: 'Em cada marco da trilha, toque no console: quem inventou a ideia aparece e conta a história. Toque na faixa da memória (no alto) para reler tudo.',
  quests: [{ id: 'qx_fichas', name: 'Quem descobriu as fichas?' }, { id: 'qx_tabela', name: 'Por que “matriz”?' }, { id: 'qx_chances', name: 'O triângulo de Pascal' }, { id: 'qx_programa', name: 'Babbage e suas máquinas' }],
  next: 'p2a1', load: () => import('./p1/Linha'),
})
defineLevel({
  id: 'p2a1', phase: 2, badge: '2·1', short: 'Fase 2 · Em breve', title: 'A Cidade das Representações', kicker: 'FASE 2', sub: 'Em construção', theme: 'cidade', img: '/img/v2/portais.webp',
  tip: 'Você terminou a Fase 1! A Fase 2 está sendo construída.',
  load: () => import('./p2/EmBreve'),
})

export function resolveLevel(id: string) {
  if (LEVELS[id]) return id
  if (/^p1/.test(id)) return 'p1'
  return 'quarto'
}
