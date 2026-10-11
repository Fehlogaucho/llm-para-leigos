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
  { n: 1, name: 'Fase 1', title: 'As Origens', core: 'MATRIX', desc: 'Um arquipélago de lembranças de 5.500 anos: fichas, tabelas, algoritmos, chances, zero e um, o menor erro, programas, matrizes, a próxima palavra, bits e neurônios.' },
  { n: 2, name: 'Fase 2', title: 'Dentro da LLM', core: 'TRANSFORMER', desc: 'A Fábrica de Previsões: prever a próxima palavra, tokens, vetores, atenção, camadas, temperatura, treino e RAG.' },
  { n: 3, name: 'Fase 3', title: 'Crie sua LLM', core: 'CREATOR', desc: 'O laboratório: escolher os textos, treinar uma LLM do zero, testar, ajustar e se formar.' },
  { n: 4, name: 'Final', title: 'De Volta para Casa', desc: 'A pergunta do começo, finalmente respondida.' },
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
  id: 'p1', phase: 1, badge: '1', short: 'Fase 1 · Arquivo da Memória', title: 'O Arquivo da Memória', kicker: 'FASE 1 · AS ORIGENS', sub: 'A matemática por trás da LLM', theme: 'observatorio', img: '/img/v2/fundamentos.webp',
  tip: 'Em cada ilha, toque no console: quem inventou a ideia aparece e conta a história. Cada lembrança abre a névoa da próxima ponte. Toque na faixa da memória (no alto) para reler tudo.',
  quests: [{ id: 'qx_fichas', name: 'Quem descobriu as fichas?' }, { id: 'qx_tabela', name: 'Por que “matriz”?' }, { id: 'qx_chances', name: 'O triângulo de Pascal' }, { id: 'qx_programa', name: 'Babbage e suas máquinas' }],
  next: 'p2', load: () => import('./p1/Linha'),
})
defineLevel({
  id: 'p2', phase: 2, badge: '2', short: 'Fase 2 · Dentro da LLM', title: 'A Fábrica de Previsões', kicker: 'FASE 2 · DENTRO DA LLM', sub: 'Como a LLM funciona por dentro', theme: 'cidade', img: '/img/v2/portais.webp',
  tip: 'Fale com o robô de cada estação. Pise nas esteiras para andar mais rápido. Cada estação religada apaga a barreira do corredor seguinte.',
  next: 'p3', load: () => import('./p2/Fabrica'),
})
defineLevel({
  id: 'p3', phase: 3, badge: '3', short: 'Fase 3 · Crie sua LLM', title: 'O Laboratório', kicker: 'FASE 3 · CRIE SUA LLM', sub: 'Do zero até a formatura', theme: 'lab', img: '/img/v2/mundo.webp',
  tip: 'Siga as estações do laboratório: dados, tokens, treino, teste, ajuste e formatura. A sua LLM aprende de verdade, aqui no navegador.',
  next: 'fim', load: () => import('./p3/Lab'),
})
defineLevel({
  id: 'fim', phase: 4, badge: '★', short: 'Final · De volta para casa', title: 'De Volta para Casa', kicker: 'FINAL', sub: 'A resposta, finalmente', theme: 'lab', img: '/img/v2/mundo.webp',
  tip: 'Vá até o computador: a Language Engine tem uma resposta para você.',
  load: () => import('./fim/Casa'),
})

export function resolveLevel(id: string) {
  if (LEVELS[id]) return id
  if (/^p1/.test(id)) return 'p1'
  if (/^p2/.test(id)) return 'p2'
  return 'quarto'
}
