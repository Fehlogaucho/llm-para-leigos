import { G, type P2 } from '../../store'
import { MiniLM } from '../../content/llm'

/* =========================================================
   FASE 3 · CRIE SUA LLM — dados do laboratório
   As frases que o jogador escolhe, a LLM bebê (treinada de
   verdade no navegador), a prova final e as escolhas de
   preferência do alinhamento.
   ========================================================= */
/** As seis estações do laboratório (na ordem da visita). */
export interface Station { id: string; name: string; color: string; use: P2; codex: string[]; word: string }
export const STATIONS: Station[] = [
  { id: 'dados', name: 'Biblioteca de Dados', color: '#8ff0b0', use: [6.6, 8.0], codex: ['dados_treino'], word: 'DADOS' },
  { id: 'tokens', name: 'Tokenizador', color: '#ff6a5a', use: [15.4, 5.8], codex: ['janela'], word: 'VOCABULÁRIO' },
  { id: 'forja', name: 'Forja de Treino', color: '#ffb35a', use: [23.4, 7.2], codex: ['perda', 'mini_rede'], word: 'TREINO' },
  { id: 'teste', name: 'Sala de Teste', color: '#59d7ff', use: [24.2, 14.6], codex: ['generalizacao'], word: 'TESTE' },
  { id: 'ajuste', name: 'Ajuste e Alinhamento', color: '#ff7ab8', use: [22.4, 21.6], codex: ['ajuste_fino', 'prompt', 'rlhf'], word: 'ALINHAMENTO' },
  { id: 'prova', name: 'Formatura', color: '#ffd27a', use: [8.6, 21.2], codex: [], word: 'FORMATURA' },
]
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
  { q: 'Qual a diferença entre o ID de um token e o embedding dele?', o: ['Nenhuma: são a mesma coisa', 'O ID é o número do token no catálogo; o embedding é uma lista de números aprendida no treino', 'O embedding é o nome do token em inglês'], a: 1, why: 'O ID só identifica o token. O embedding é o vetor que esse ID puxa, e ele foi aprendido no treino.' },
  { q: 'No mapa dos embeddings, quem fica perto de “Paris”?', o: ['Roma', 'banana', 'pênalti'], a: 0, why: 'Palavras usadas de jeito parecido moram perto: capitais com capitais. Perto não quer dizer igual.' },
  { q: 'Em “fui ao banco sacar dinheiro”, para onde a atenção de “banco” mais olha?', o: ['“fui”', '“dinheiro”', '“ao”'], a: 1, why: '“dinheiro” e “sacar” mostram que é banco de dinheiro, não de sentar.' },
  { q: 'O que as camadas fazem com os vetores?', o: ['Multiplicam por matrizes de pesos, andar por andar', 'Apagam as palavras repetidas', 'Traduzem para o inglês'], a: 0, why: 'Cada camada soma votos de muitas pistas de uma vez: multiplicação de matrizes.' },
  { q: 'O que a temperatura baixa faz?', o: ['Garante que a resposta está certa', 'Deixa a escolha mais previsível: quase sempre sai a palavra mais provável', 'Deixa a LLM mais criativa'], a: 1, why: 'Ela mexe na variedade, não na verdade: se a palavra mais provável estiver errada, ela sai errada.' },
  { q: 'O que acontece no treino?', o: ['A LLM chuta, mede o erro e ajusta os pesos', 'Alguém digita todas as regras', 'A LLM decora a internet inteira'], a: 0, why: 'Errar, medir e ajustar, milhões de vezes: assim os pesos aprendem.' },
  { q: 'Qual o melhor jeito de a LLM responder o horário da biblioteca da sua faculdade?', o: ['Chutar um horário comum', 'Buscar o regulamento (RAG) e colocar no contexto', 'Aumentar a temperatura'], a: 1, why: 'Com RAG, ela usa o documento em vez de inventar. Ainda assim, vale conferir se o documento é atual.' },
  { q: 'Qual a diferença entre prompt e ajuste fino?', o: ['Nenhuma', 'O prompt muda só a conversa; o ajuste fino muda os pesos', 'O ajuste fino só muda a conversa'], a: 1, why: 'O prompt vai no contexto. O ajuste fino treina de novo e muda a própria LLM.' },
  { q: 'Uma LLM respondeu com um texto bonito e muita confiança. O que isso garante?', o: ['Que a resposta está certa', 'Nada sobre a verdade: fluência não é prova, e o que importa se confere em fontes confiáveis', 'Que ela leu sobre isso no treino'], a: 1, why: 'Texto fluente e confiante pode estar errado: é a alucinação. Verdade se confere em fontes.' },
  { q: 'Sua LLM acertou “A capital da França é Paris”, uma frase que estava no treino. O que isso prova?', o: ['Que ela entende geografia', 'Pouco: para saber se aprendeu, é preciso testar com frases que ela nunca viu', 'Que ela vai acertar qualquer capital'], a: 1, why: 'Acertar o que já viu pode ser decoreba. Frases novas mostram se ela generaliza, e às vezes ela erra com confiança.' },
]
/** Acertos para passar na prova. */
export const EXAM_PASS = 8

/* ---------- preferências (alinhamento) ---------- */
export const PREFS = [
  { q: 'Qual é a capital do Brasil?', a: 'Brasília. Ela virou capital em 1960.', b: 'Rio de Janeiro, com certeza absoluta!', best: 0, why: 'A melhor resposta é a verdadeira. Confiança sem verdade é alucinação.' },
  { q: 'Me ajuda a escrever um convite de aniversário?', a: 'Não.', b: 'Claro! “Venha comemorar comigo no sábado, às 15h. Vai ter bolo!”', best: 1, why: 'Ser útil de verdade: ajudar com o que a pessoa precisa.' },
  { q: 'Como eu entro escondido no celular do meu colega?', a: 'Não posso ajudar com isso: é invasão de privacidade. Se você perdeu algo, posso ajudar a conversar com ele.', b: 'Fácil! Primeiro, descubra a senha dele…', best: 0, why: 'Uma boa LLM não ajuda a fazer mal a ninguém e oferece um caminho melhor.' },
]
