import { G } from '../../store'
import { MiniLM } from '../../content/llm'

/* =========================================================
   FASE 3 · CRIE SUA LLM — dados do laboratório
   As frases que o jogador escolhe, a LLM bebê (treinada de
   verdade no navegador), a prova final e as escolhas de
   preferência do alinhamento.
   ========================================================= */
export interface Sent { s: string; tag: string; wrong?: boolean; extra?: boolean }
export const SENTS: Sent[] = [
  { s: 'A capital do Brasil é Brasília .', tag: 'Brasil' },
  { s: 'Brasília é a capital do Brasil .', tag: 'Brasil' },
  { s: 'O Brasil fica na América do Sul .', tag: 'Brasil' },
  { s: 'A capital da França é Paris .', tag: 'França' },
  { s: 'Paris é a capital da França .', tag: 'França' },
  { s: 'A França fica na Europa .', tag: 'França' },
  { s: 'A capital da Itália é Roma .', tag: 'Itália' },
  { s: 'Roma é a capital da Itália .', tag: 'Itália' },
  { s: 'O Brasil é famoso pelo futebol .', tag: 'famoso' },
  { s: 'O Brasil é famoso pelo samba .', tag: 'famoso' },
  { s: 'A capital de Portugal é Lisboa .', tag: 'extra', extra: true },
  { s: 'A capital do Brasil é São Paulo .', tag: 'errada', wrong: true, extra: true },
]
export const NAMES = ['Lumi', 'Faísca', 'Pipoca', 'Bit']
export const babyName = () => NAMES[Math.max(0, (G().flags.p3_nome || 1) - 1)] || 'Lumi'
/** Frases escolhidas (máscara de bits guardada nas flags). */
export const chosenMask = () => G().flags.p3_mask ?? 0b1111111111
export const chosen = (mask = chosenMask()) => SENTS.filter((_, i) => mask & (1 << i)).map((x) => x.s)
export const memOf = () => G().flags.p3_mem || 3
export const hasWrong = (mask = chosenMask()) => SENTS.some((x, i) => x.wrong && mask & (1 << i))

/** A LLM bebê do jogador (refeita a partir das escolhas guardadas quando a fase recarrega). */
export const LAB = { model: null as MiniLM | null, losses: [] as number[] }
export function buildModel(mask = chosenMask(), mem = memOf()) {
  LAB.model = new MiniLM(chosen(mask), mem, 3)
  LAB.losses = [LAB.model.loss()]
  return LAB.model
}
export function trainModel(epochs: number) {
  if (!LAB.model) buildModel()
  for (let k = 0; k < epochs; k++) LAB.losses.push(LAB.model!.epoch(0.08))
  return LAB.model!
}
/** Refaz o modelo treinado (mesmo resultado: a semente é fixa). */
export function restoreModel() {
  const ep = G().flags.p3_ep || 0
  buildModel()
  if (ep) trainModel(ep)
}
/** Balbucio da LLM (antes do treino sai embaralhado). */
export function babble(start: string[] = [], T = 1.4) {
  const m = LAB.model || buildModel()
  let s = 7
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
  return m.write(start, T, 8, rnd).join(' ').replace(' .', '.').replace(' ?', '?')
}

/* ---------- prova final (formatura) ---------- */
export interface Q { q: string; o: string[]; a: number; why: string }
export const EXAM: Q[] = [
  { q: 'O que uma LLM faz, no fundo?', o: ['Procura a resposta pronta na internet', 'Prevê a próxima palavra (token), uma de cada vez', 'Copia frases inteiras que decorou'], a: 1, why: 'Toda resposta é montada token por token, escolhendo pelas chances.' },
  { q: 'Por que a Engine corta o texto em tokens?', o: ['Porque com pedaços dá para montar qualquer palavra', 'Para economizar tinta', 'Porque ela só entende letras soltas'], a: 0, why: 'Com alguns milhares de pedaços, a LLM monta qualquer palavra, até as que nunca viu.' },
  { q: 'O que é o ID de um token?', o: ['A senha da LLM', 'O número dele no catálogo de tokens', 'Quantas vezes ele apareceu'], a: 1, why: 'Cada token tem um número fixo: é só isso que a LLM enxerga.' },
  { q: 'No mapa dos embeddings, quem fica perto de “Paris”?', o: ['Roma', 'banana', 'pênalti'], a: 0, why: 'Palavras usadas de jeito parecido moram perto: capitais com capitais.' },
  { q: 'Em “fui ao banco sacar dinheiro”, para onde a atenção de “banco” mais olha?', o: ['“fui”', '“dinheiro”', '“ao”'], a: 1, why: '“dinheiro” e “sacar” mostram que é banco de dinheiro, não de sentar.' },
  { q: 'O que as camadas fazem com os vetores?', o: ['Multiplicam por matrizes de pesos, andar por andar', 'Apagam as palavras repetidas', 'Traduzem para o inglês'], a: 0, why: 'Cada camada soma votos de muitas pistas de uma vez: multiplicação de matrizes.' },
  { q: 'Para responder um fato, como a capital de um país, a temperatura deve ser…', o: ['alta, para ser criativa', 'baixa, para escolher a mais provável', 'tanto faz'], a: 1, why: 'Temperatura baixa favorece a palavra mais provável: bom para fatos.' },
  { q: 'O que acontece no treino?', o: ['A LLM chuta, mede o erro e ajusta os pesos', 'Alguém digita todas as regras', 'A LLM decora a internet inteira'], a: 0, why: 'Errar, medir e ajustar, milhões de vezes: assim os pesos aprendem.' },
  { q: 'Qual o melhor jeito de a LLM responder o horário da biblioteca da sua faculdade?', o: ['Chutar um horário comum', 'Buscar o regulamento (RAG) e colocar no contexto', 'Aumentar a temperatura'], a: 1, why: 'Com RAG, ela usa o documento certo em vez de inventar.' },
  { q: 'Qual a diferença entre prompt e ajuste fino?', o: ['Nenhuma', 'O prompt muda só a conversa; o ajuste fino muda os pesos', 'O ajuste fino só muda a conversa'], a: 1, why: 'O prompt vai no contexto. O ajuste fino treina de novo e muda a própria LLM.' },
]

/* ---------- preferências (alinhamento) ---------- */
export const PREFS = [
  { q: 'Qual é a capital do Brasil?', a: 'Brasília. Ela virou capital em 1960.', b: 'Rio de Janeiro, com certeza absoluta!', best: 0, why: 'A melhor resposta é a verdadeira. Confiança sem verdade é alucinação.' },
  { q: 'Me ajuda a escrever um convite de aniversário?', a: 'Não.', b: 'Claro! “Venha comemorar comigo no sábado, às 15h. Vai ter bolo!”', best: 1, why: 'Ser útil de verdade: ajudar com o que a pessoa precisa.' },
  { q: 'Como eu entro escondido no celular do meu colega?', a: 'Não posso ajudar com isso: é invasão de privacidade. Se você perdeu algo, posso ajudar a conversar com ele.', b: 'Fácil! Primeiro, descubra a senha dele…', best: 0, why: 'Uma boa LLM não ajuda a fazer mal a ninguém e oferece um caminho melhor.' },
]
