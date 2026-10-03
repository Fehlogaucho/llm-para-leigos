import type { ComponentType } from 'react'

export interface LevelDef {
  id: string
  phase: number
  badge: string // ex.: "1·1"
  short: string // nome curto na barra
  title: string // nome grande
  kicker: string // ex.: "FASE 1 · ÁREA 1"
  sub: string // conceito
  theme: string // trilha
  img?: string // imagem da tela de carregamento
  tip: string
  quests?: { id: string; name: string }[]
  next?: string
  load: () => Promise<{ default: ComponentType }>
}

export interface PhaseDef { n: number; name: string; title: string; core?: string; desc: string }

export const PHASES: PhaseDef[] = [
  { n: 0, name: 'Prólogo', title: 'A Language Engine', desc: 'A máquina que responde, mas esqueceu por quê.' },
  { n: 1, name: 'Fase 1', title: 'As Origens', core: 'MATRIX', desc: 'Observar, contar, representar, criar regras, lidar com a incerteza, automatizar, computar e chegar às matrizes.' },
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
  id: 'quarto', phase: 0, badge: 'P', short: 'Prólogo · O Quarto', title: 'Uma Pergunta', kicker: 'PRÓLOGO', sub: 'Como você funciona?', theme: 'lab', img: '/img/origens.webp',
  tip: 'Chegue perto do computador e toque em “Usar”.',
  next: 'prologo', load: () => import('./prologo/Quarto'),
})
defineLevel({
  id: 'prologo', phase: 0, badge: 'P', short: 'Prólogo', title: 'A Language Engine', kicker: 'PRÓLOGO', sub: 'A máquina que esqueceu', theme: 'lab', img: '/img/origens.webp',
  tip: 'No celular: arraste o círculo para andar, ou toque no chão. Arraste a tela para girar a câmera.',
  next: 'p1a1', load: () => import('./prologo/Prologo'),
})
defineLevel({
  id: 'p1a1', phase: 1, badge: '1·1', short: 'Área 1 · Observatório', title: 'O Observatório', kicker: 'FASE 1 · ÁREA 1', sub: 'Observar e medir', theme: 'observatorio', img: '/img/eras.webp',
  tip: 'Objetos com um losango dourado podem ser usados. Chegue perto e toque em “Usar”.',
  quests: [{ id: 'q_ceu', name: 'O Céu em Números' }, { id: 'q_mapa', name: 'O Mapa do Céu' }, { id: 'q_relogio', name: 'O Relógio' }, { id: 'q_abaco', name: 'O Ábaco' }, { id: 'q_hist', name: 'História dos Calculadores' }],
  next: 'p1a2', load: () => import('./p1/Observatorio'),
})

defineLevel({
  id: 'p1a2', phase: 1, badge: '1·2', short: 'Área 2 · Vale dos Números', title: 'O Vale dos Números', kicker: 'FASE 1 · ÁREA 2', sub: 'Representar quantidade', theme: 'vale', img: '/img/eras.webp',
  tip: 'Muitos objetos, uma ideia: cada grupo é uma quantidade. Procure os pedestais.',
  quests: [{ id: 'q_quant', name: 'A Quantidade' }, { id: 'q_mil', name: 'Mil é Diferente de Dez' }, { id: 'q_escondido', name: 'O Número Escondido' }, { id: 'q_sistemas', name: 'Sistemas Numéricos' }, { id: 'q_binario', name: 'O Mundo Binário' }],
  next: 'p1a3', load: () => import('./p1/Vale'),
})
defineLevel({
  id: 'p1a3', phase: 1, badge: '1·3', short: 'Área 3 · Jardim da Lógica', title: 'O Jardim da Lógica', kicker: 'FASE 1 · ÁREA 3', sub: 'Se → então', theme: 'jardim', img: '/img/eras.webp',
  tip: 'No jardim, tudo obedece a regras. Observe o que acontece quando você mexe em algo.',
  quests: [{ id: 'q_porta', name: 'A Porta Condicional' }, { id: 'q_e', name: 'E' }, { id: 'q_ou', name: 'OU' }, { id: 'q_nao', name: 'NÃO' }, { id: 'q_regras', name: 'A Máquina de Regras' }],
  next: 'p1a4', load: () => import('./p1/Jardim'),
})
defineLevel({
  id: 'p1a4', phase: 1, badge: '1·4', short: 'Área 4 · Câmara da Probabilidade', title: 'A Câmara da Probabilidade', kicker: 'FASE 1 · ÁREA 4', sub: 'Incerteza e previsão', theme: 'prob', img: '/img/eras.webp',
  tip: 'Aqui nada é certo. Mas dá para ver as chances: quanto mais luz, mais provável.',
  quests: [{ id: 'q_dados', name: 'Os Dados' }, { id: 'q_caminho', name: 'O Caminho Mais Provável' }, { id: 'q_futuro', name: 'O Futuro Incerto' }, { id: 'q_grafico', name: 'Gráfico Vivo' }],
  next: 'p1a5', load: () => import('./p1/Probabilidade'),
})
defineLevel({
  id: 'p1a5', phase: 1, badge: '1·5', short: 'Área 5 · Oficina das Máquinas', title: 'A Oficina das Máquinas', kicker: 'FASE 1 · ÁREA 5', sub: 'Automação', theme: 'oficina', img: '/img/origens.webp',
  tip: 'Engrenagens, cartões e vapor: máquinas que seguem regras sozinhas.',
  quests: [{ id: 'q_soma', name: 'A Soma Automática' }, { id: 'q_repeticao', name: 'Repetição' }, { id: 'q_cartao', name: 'O Cartão Perfurado' }, { id: 'q_decisao', name: 'A Máquina de Decisão' }],
  next: 'p1a6', load: () => import('./p1/Oficina'),
})
defineLevel({
  id: 'p1a6', phase: 1, badge: '1·6', short: 'Área 6 · Sala da Computação', title: 'A Sala da Computação', kicker: 'FASE 1 · ÁREA 6', sub: 'Bits e processamento', theme: 'computacao', img: '/img/origens.webp',
  tip: 'Este corredor atravessa a história: do relé ao data center. Tudo vira 0 e 1.',
  quests: [{ id: 'q_bit', name: 'O Bit' }, { id: 'q_byte', name: 'Bytes' }, { id: 'q_imagem', name: 'Imagem em Números' }, { id: 'q_som', name: 'Som em Números' }, { id: 'q_texto', name: 'Texto em Números' }],
  next: 'p1a7', load: () => import('./p1/Computacao'),
})
defineLevel({
  id: 'p1a7', phase: 1, badge: '1·7', short: 'Área 7 · Câmara da Matriz', title: 'A Câmara da Matriz', kicker: 'FASE 1 · ÁREA 7', sub: 'Representação matricial', theme: 'matriz', img: '/img/origens.webp',
  tip: 'A conclusão da Fase 1: números organizados em linhas e colunas podem representar o mundo.',
  quests: [{ id: 'q_construa', name: 'Construa a Matriz' }, { id: 'q_mimagem', name: 'Matriz como Imagem' }, { id: 'q_mmapa', name: 'Matriz como Mapa' }, { id: 'q_mvetor', name: 'Matriz × Vetor' }],
  next: 'p2a1', load: () => import('./p1/Matriz'),
})
