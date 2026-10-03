/* ============ Conceitos e glossário ============ */
const CNAME = { Loss: 'Erro (loss)', Backpropagation: 'Retropropagação' };
const CONCEPTS = {
  'LLM': { p: 1, e: 'um programa de inteligência artificial treinado com uma quantidade enorme de texto para prever qual pedaço de texto vem a seguir.', s: 'conversar, responder perguntas, resumir, traduzir, programar e escrever textos.', x: 'o ChatGPT e o Claude são LLMs. Elas escrevem a resposta um pedaço de cada vez.' },
  'Chatbot': { p: 2, e: 'um programa que conversa com pessoas por texto.', s: 'atender, tirar dúvidas e fazer companhia. Os antigos seguiam regras fixas; os de hoje usam LLMs.', x: 'a ELIZA, de 1966, e os assistentes de hoje.' },
  'Modelo de linguagem': { p: 3, e: 'um programa que calcula a chance de cada palavra vir a seguir num texto.', s: 'completar, corrigir e gerar frases. Toda LLM é um modelo de linguagem gigante.', x: 'depois de “A capital do Brasil é”, dar muito mais chance a “Brasília” do que a “banana”.' },
  'Logit': { p: 3, e: 'o placar bruto que o modelo dá para cada palavra candidata, antes de virar probabilidade.', s: 'comparar candidatos: quanto maior o placar, mais provável a palavra.', x: 'um placar 3,2 para “Brasília” e 0,5 para “Paris”.' },
  'Softmax': { p: 3, e: 'a conta que transforma os placares (logits) em probabilidades que somam 100%.', s: 'permitir que o modelo sorteie a próxima palavra na proporção da chance de cada uma.', x: 'as fatias da roleta: cada placar vira uma porcentagem, e todas somam 100%.' },
  'Temperatura': { p: 3, e: 'um ajuste que deixa as probabilidades mais concentradas (baixa) ou mais espalhadas (alta).', s: 'escolher entre respostas previsíveis e respostas mais criativas.', x: 'fria, a roleta quase sempre dá a favorita; quente, sai de tudo.' },
  'Token': { p: 4, e: 'um pedaço de texto: uma palavra inteira, parte de uma palavra ou um sinal de pontuação.', s: 'ser a unidade que o modelo lê, escreve e cobra. Tudo numa LLM é contado em tokens.', x: '“casa” costuma ser um token só; uma palavra comprida como “paralelepípedo” vira vários.' },
  'Tokenização': { p: 4, e: 'o processo de cortar o texto em tokens e trocar cada um pelo seu número (ID).', s: 'transformar texto, que o computador não entende, em números com que ele consegue fazer contas.', x: 'cortar “Qual é a capital do Brasil?” em pedaços e trocar cada um pelo seu número.' },
  'Vocabulário': { p: 4, e: 'a lista de todos os tokens que o modelo conhece. O ID é a posição de cada token nessa lista.', s: 'dar um número fixo para cada pedaço de texto.', x: 'a lista em que “Brasil” é o item de número 4098 (número de exemplo).' },
  'Matriz': { p: 5, e: 'uma tabela de números organizada em linhas e colunas.', s: 'fazer, de uma vez só, milhões de somas com pesos. É a conta principal dentro de uma LLM.', x: 'uma tabela com uma linha para cada resposta possível e uma coluna para cada pista da pergunta.' },
  'Parâmetro': { p: 5, e: 'cada número (peso) dentro das matrizes do modelo, ajustado durante o treinamento.', s: 'guardar, de forma espalhada, tudo o que o modelo aprendeu.', x: 'o mini-modelo do jogo tem 27 pesos. O GPT-3 tinha 175 bilhões.' },
  'Neurônio': { p: 5, e: 'uma pequena conta: soma as pistas que chegam, cada uma multiplicada pelo seu peso, e decide o quanto “acende”.', s: 'combinar informações. Milhares deles juntos reconhecem padrões.', x: 'uma linha da tabela que soma as pistas, cada uma com seu peso, e dá um voto para uma resposta.' },
  'GPU': { p: 5, e: 'a placa de vídeo: um chip que faz milhares de contas ao mesmo tempo.', s: 'treinar e rodar LLMs rapidamente, porque elas são feitas de multiplicações de matrizes.', x: 'a mesma placa que desenha os jogos 3D, e que está desenhando este jogo agora.' },
  'Treinamento': { p: 6, e: 'o processo de mostrar exemplos ao modelo, medir o erro e ajustar os pesos para errar menos.', s: 'fazer o modelo aprender os padrões da língua e do mundo.', x: 'mostrar “A capital do Brasil é Brasília” muitas vezes, até o modelo ter certeza.' },
  'Loss': { p: 6, e: 'o número que mede o quanto o modelo errou num exemplo. Quanto menor, melhor.', s: 'mostrar ao treinamento se os ajustes estão funcionando.', x: 'se o modelo dá só 10% de chance à resposta certa, o erro é alto; com 95%, o erro é baixo. Quando a certeza sobe, o erro cai.' },
  'Backpropagation': { p: 6, e: 'o método que calcula, de trás para a frente, quanto cada peso contribuiu para o erro e para que lado mexer nele.', s: 'treinar redes com milhões ou bilhões de pesos de forma eficiente.', x: 'os cubinhos que piscam durante o treino são os pesos que levaram os maiores ajustes.' },
  'Embedding': { p: 7, e: 'uma lista de números que representa o significado de um token, como o endereço dele num mapa (essa lista também se chama vetor).', s: 'medir o quanto palavras são parecidas e fazer contas com significados.', x: 'Paris e Roma têm listas de números parecidas, por isso ficam perto no mapa.' },
  'Atenção': { p: 8, e: 'o mecanismo que deixa cada token olhar para os tokens anteriores e decidir quais importam mais.', s: 'entender o contexto, por exemplo, saber se “banco” é de praça ou de dinheiro.', x: 'em “O gato subiu no telhado porque ele estava com medo”, a palavra “ele” presta atenção em “gato”.' },
  'Transformer': { p: 8, e: 'o “projeto” de construção das LLMs modernas: várias camadas de atenção, uma em cima da outra.', s: 'ler textos longos sem esquecer o começo, com tudo rodando ao mesmo tempo nas placas de vídeo.', x: 'GPT, Claude e Gemini são Transformers.' },
  'Prompt': { p: 9, e: 'o texto que você envia ao modelo: a pergunta, as instruções e qualquer contexto.', s: 'orientar a resposta sem mudar nada dentro do modelo.', x: 'escrever “responda em uma frase” muda a resposta sem mudar nada dentro do modelo.' },
  'Fine-tuning': { p: 9, e: 'um treinamento extra, feito num modelo já pronto, com exemplos específicos.', s: 'ensinar um estilo, um formato ou um comportamento novo, mudando os pesos.', x: 'treinar de novo um modelo pronto com exemplos de atendimento de uma empresa.' },
  'RAG': { p: 10, e: 'sigla em inglês para “geração com busca”: antes de responder, o sistema procura trechos numa biblioteca de documentos e os cola no prompt.', s: 'responder com informações atualizadas ou privadas, citando a fonte, sem retreinar o modelo.', x: 'perguntar o horário da biblioteca e a IA responder citando o regulamento.' },
  'Busca semântica': { p: 10, e: 'uma busca por significado, e não só por palavras iguais.', s: 'achar os trechos mais parecidos com uma pergunta. É a primeira metade do RAG.', x: 'procurar “automóvel” e achar um texto que só fala em “carro”.' },
  'Alucinação': { p: 10, e: 'quando o modelo inventa uma resposta que parece certa, mas não é.', sl: 'acontece porque', s: 'o modelo foi treinado para sempre continuar o texto de forma plausível, mesmo quando não sabe a resposta.', x: 'sem acesso ao regulamento, o modelo chuta um horário com toda a confiança.' },
  'Época': { p: 11, e: 'uma passada completa por todos os exemplos de treino.', s: 'medir quanto o modelo já estudou.', x: 'ler as 10 frases de treino uma vez é uma época; 300 épocas são 300 leituras.' },
  'Janela de contexto': { p: 11, e: 'a quantidade de tokens que o modelo consegue considerar de uma vez.', s: 'definir quanto da conversa ou do documento cabe na “memória” da resposta.', x: 'com memória de 1 token, a LLM esquece de qual país a frase falava.' }
};
const TERM_ALIASES = [
  ['busca semântica', 'Busca semântica'], ['janela de contexto', 'Janela de contexto'], ['fine-tuning', 'Fine-tuning'],
  ['tokenização', 'Tokenização'], ['tokenizador', 'Tokenização'], ['tokens', 'Token'], ['token', 'Token'], ['vocabulário', 'Vocabulário'],
  ['embeddings', 'Embedding'], ['embedding', 'Embedding'], ['vetor', 'Embedding'], ['atenção', 'Atenção'], ['transformer', 'Transformer'],
  ['matrizes', 'Matriz'], ['matriz', 'Matriz'], ['parâmetros', 'Parâmetro'], ['pesos', 'Parâmetro'], ['logits', 'Logit'], ['logit', 'Logit'],
  ['softmax', 'Softmax'], ['temperatura', 'Temperatura'], ['treinamento', 'Treinamento'], ['treinar', 'Treinamento'], ['prompt', 'Prompt'],
  ['RAG', 'RAG'], ['LLMs', 'LLM'], ['LLM', 'LLM'], ['neurônios', 'Neurônio'], ['alucinação', 'Alucinação'], ['GPUs', 'GPU'], ['placas de vídeo', 'GPU'], ['chatbot', 'Chatbot'], ['modelo de linguagem', 'Modelo de linguagem']];
const escHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function highlightTerms(text) {
  const hits = [], used = new Set();
  for (const [alias, key] of TERM_ALIASES) {
    if (used.has(key)) continue;
    const re = new RegExp(`(?<![\\p{L}-])${alias}(?![\\p{L}])`, alias === 'RAG' || alias.startsWith('LLM') || alias.startsWith('GPU') ? 'u' : 'iu');
    const m = re.exec(text); if (!m) continue;
    const a = m.index, b = a + m[0].length;
    if (hits.some(x => a < x.b && b > x.a)) continue;
    hits.push({ a, b, key }); used.add(key);
  }
  hits.sort((x, y) => x.a - y.a); let out = '', i = 0;
  for (const x of hits) { out += escHtml(text.slice(i, x.a)) + `<mark class="term" tabindex="0" role="button" data-c="${escHtml(x.key)}" title="Ver no glossário">${escHtml(text.slice(x.a, x.b))}</mark>`; i = x.b; }
  return out + escHtml(text.slice(i));
}
function conceptCard(key, withGo) {
  const c = CONCEPTS[key]; if (!c) return null;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  return h('article', { class: 'concept', 'data-key': key },
    h('div', { class: 'c-head' }, h('p', { class: 'c-def' }, h('mark', { class: 'hl c-term' }, CNAME[key] || key), ' ', h('b', { class: 'k' }, 'é'), ' ', c.e), withGo ? btn(`Fase ${c.p}`, 'small', () => { closeGlossary(); go(c.p - 1); }) : null),
    h('p', { class: 'c-use' }, h('b', { class: 'k' }, cap(c.sl || 'serve para')), ' ', c.s),
    h('p', { class: 'c-ex' }, h('b', null, 'Exemplo: '), cap(c.x)));
}
function conceptSection(keys) {
  return h('section', { class: 'sec concepts', 'aria-label': 'Conceitos desta fase' },
    h('div', { class: 'row', style: 'justify-content:space-between' }, h('h2', { style: 'margin:0' }, keys.length > 1 ? 'Conceitos desta fase' : 'Conceito desta fase'), h('button', { class: 'linkish', onclick: () => openGlossary() }, 'Glossário completo')),
    keys.map(k => conceptCard(k)));
}
function openGlossary(focus) {
  let g = $('#gloss');
  if (!g) {
    const list = h('div', { class: 'gloss-list' });
    const q = h('input', { type: 'text', id: 'glossQ', placeholder: 'Procurar um termo…', 'aria-label': 'Procurar no glossário' });
    const draw = () => { const t = normTerm(q.value); list.innerHTML = ''; Object.keys(CONCEPTS).sort((a, b) => a.localeCompare(b, 'pt-BR')).filter(k => !t || normTerm(k + ' ' + CONCEPTS[k].e).includes(t)).forEach(k => list.append(conceptCard(k, true))); if (!list.children.length) list.append(h('p', { class: 'muted small' }, 'Nenhum termo encontrado.')); };
    q.addEventListener('input', draw);
    g = h('div', { class: 'gloss', id: 'gloss', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Glossário', onclick: e => { if (e.target === g) closeGlossary(); } },
      h('div', { class: 'gloss-card' },
        h('div', { class: 'gloss-top' }, h('h2', null, 'Glossário'), h('button', { class: 'icon-btn', 'aria-label': 'Fechar glossário', onclick: closeGlossary, html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' })),
        h('p', { class: 'small muted' }, 'Cada termo com o que é, para que serve e onde você o encontra no jogo.'), q, list));
    document.body.append(g); draw(); g.draw = draw;
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#gloss').hidden) closeGlossary(); });
  }
  g.hidden = false; SND.play('pop');
  const q = $('#glossQ'); if (focus) { q.value = ''; g.draw(); const el = g.querySelector(`.concept[data-key="${CSS.escape(focus)}"]`); if (el) { el.scrollIntoView({ block: 'center' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } } else setTimeout(() => q.focus(), 30);
}
function closeGlossary() { const g = $('#gloss'); if (g) g.hidden = true; }
const normTerm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
document.addEventListener('click', e => { const m = e.target.closest('mark.term'); if (m) openGlossary(m.dataset.c); });
document.addEventListener('keydown', e => { const m = e.target.closest && e.target.closest('mark.term'); if (m && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openGlossary(m.dataset.c); } });
