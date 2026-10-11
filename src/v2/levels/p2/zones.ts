import type { Doc } from '../../content/stops'
import type { RobotKind } from '../../art/creatures'
import type { Line } from '../../store'

/* =========================================================
   FASE 2 · DENTRO DA LLM — A Fábrica de Previsões
   Oito estações, cada uma cuidada por um robô. A pergunta
   “Qual é a capital do Brasil?” atravessa todas elas.
   Textos simples, para leigos (base: versão clássica).
   ========================================================= */
export type ZoneId = 'prever' | 'tokens' | 'vetores' | 'atencao' | 'camadas' | 'roleta' | 'treino' | 'rag'
export interface Zone {
  id: ZoneId
  name: string
  host: string // id do falante
  hostName: string
  kind: RobotKind
  color: string
  word: string
  intro: Line[]
  play: string // fala antes da brincadeira
  after: Line[] // depois da brincadeira, antes do documento
  doc: Doc
  engine: string
  codex: string[]
  hint: string // dica do objetivo
}
const D = (title: string, n: number, pages: Doc['pages'], who?: string): Doc => ({ title, year: `Estação ${n}`, place: 'Dentro da LLM', pages, who })

export const ZONES: Zone[] = [
  {
    id: 'prever', name: 'Oficina do Adivinho', host: 'ADIVINHO', hostName: 'PROF. ADIVINHO', kind: 'cientista', color: '#b07aff', word: 'PREVER',
    intro: [
      { who: 'ADIVINHO', text: 'Ah, visitantes! Bem-vindos à Oficina do Adivinho, a primeira estação da fábrica.' },
      { who: 'ADIVINHO', text: 'Aqui dentro só existe um trabalho: adivinhar a próxima palavra. Toda resposta da Engine é feita assim, uma palavra de cada vez.' },
      { who: 'NEX', text: 'Só isso? Achei que ela pensasse a frase inteira de uma vez!' },
      { who: 'ADIVINHO', text: 'Ninguém aqui pensa a frase inteira. A gente olha o que já foi escrito e chuta o que vem depois. Mas não é chute cego: é chute contado!' },
      { who: 'ADIVINHO', text: 'Aquele livro gigante tem oito frases. Minha máquina conta quem vem depois de quem.' },
    ],
    play: 'Vamos jogar: você contra a minha máquina de contar. Quem adivinha melhor a próxima palavra?',
    after: [
      { who: 'NEX', text: 'A máquina errou a última porque só olhou para o “é”!' },
      { who: 'ADIVINHO', text: 'Exato! Contar ajuda muito, mas para acertar é preciso olhar a frase inteira. Guarde isso: lá na Praça dos Holofotes você vai ver como a Engine faz.' },
    ],
    doc: D('Prever a próxima palavra', 1, [
      { h: 'Um jogo de adivinhar', ill: '🔮', t: 'Uma LLM escreve como quem joga: olha o que já está escrito e escolhe a próxima palavra. Depois repete, palavra por palavra, até terminar.' },
      { h: 'Contar ajuda a chutar', ill: '📊', t: 'Se depois de “famoso pelo” costuma vir “futebol” ou “samba”, essas palavras ganham mais chance. Contar o que vem depois é a ideia de Markov, lá da Fase 1.' },
      { h: 'Só a última palavra não basta', ill: '🧩', t: 'Olhando só o “é”, a máquina chutou “uma”. Para acertar “Brasília”, é preciso olhar “capital” e “Brasil”. As LLMs de hoje olham tudo o que veio antes.' },
      { h: 'E na LLM?', ill: '🤖', t: 'Uma LLM aprendeu com bilhões de frases. Para cada palavra possível, ela calcula uma chance. A palavra escolhida entra no texto e o jogo recomeça.' },
    ]),
    engine: 'pre… ver. Eu escrevo… uma palavra de cada vez.',
    codex: ['proxima_palavra'],
    hint: 'Fale com o Prof. Adivinho',
  },
  {
    id: 'tokens', name: 'O Fatiador', host: 'TESOURINHA', hostName: 'TESOURINHA', kind: 'tesoura', color: '#ff6a5a', word: 'TOKENS',
    intro: [
      { who: 'TESOURINHA', text: 'Zip, zip! Cuidado com os dedos! Aqui é o Fatiador.' },
      { who: 'TESOURINHA', text: 'A Engine não lê letras nem palavras inteiras. Antes de tudo, eu corto o texto em pedacinhos chamados tokens.' },
      { who: 'NEX', text: 'Por que cortar? Não seria mais fácil ler a palavra toda?' },
      { who: 'TESOURINHA', text: 'Existem palavras demais! Com pedaços, a Engine monta qualquer palavra, até as que nunca viu: “in” + “feliz” + “mente”.' },
      { who: 'TESOURINHA', text: 'E cada pedaço ganha um número de catálogo, o ID. Daqui para a frente, a Engine só trabalha com números.' },
    ],
    play: 'Pegue a tesoura! Toque nos espaços entre as letras onde você cortaria.',
    after: [
      { who: 'TESOURINHA', text: 'Zip! Olhe só: a pergunta que chegou na fábrica também foi fatiada.' },
      { who: 'NOVA', text: 'Os sete tokens da pergunta estão seguindo você, NEX! Eles vão atravessar a fábrica com a gente.' },
      { who: 'NEX', text: 'Oi, “capital”! Oi, “Brasil”! Até o ponto de interrogação veio junto.' },
    ],
    doc: D('Tokens: os pedacinhos do texto', 2, [
      { h: 'Cortar em pedaços', ill: '✂️', t: 'Antes de pensar, a LLM corta o texto em tokens. Palavras comuns viram um token só; palavras longas ou raras viram vários pedaços.' },
      { h: 'Pedaços que se repetem', ill: '🧱', t: '“in”, “feliz”, “mente”, “des”… Com alguns milhares de pedaços dá para escrever qualquer palavra, como num jogo de montar.' },
      { h: 'Cada token, um número', ill: '🔢', t: 'Cada pedaço tem um número fixo no catálogo: “capital” é 7231, “Brasil” é 4098. Daqui para a frente, a Engine só vê números.' },
      { h: 'E na LLM?', ill: '🤖', t: 'As LLMs contam tudo em tokens: o tamanho da pergunta, o limite de memória e até o preço de uso. Em português, uma palavra dá, em média, um pouco mais de um token.' },
    ]),
    engine: 'to… kens. Eu corto… e numero tudo.',
    codex: ['token', 'token_id'],
    hint: 'Fale com a Tesourinha',
  },
  {
    id: 'vetores', name: 'Vale dos Vetores', host: 'VETORA', hostName: 'VETORA', kind: 'carteiro', color: '#59d7ff', word: 'VETORES',
    intro: [
      { who: 'VETORA', text: 'Bem-vindo ao Vale dos Vetores! Aqui cada token vira um ponto num mapa gigante.' },
      { who: 'VETORA', text: 'Esse endereço no mapa se chama embedding: uma lista de números que diz onde a palavra mora.' },
      { who: 'NEX', text: 'E quem decide onde cada palavra mora?' },
      { who: 'VETORA', text: 'O treino. Palavras que aparecem em frases parecidas acabam morando perto. Veja: os países moram juntos, as comidas também.' },
      { who: 'VETORA', text: 'Mas três palavras se perderam: Madri, pênalti e salário. Pegue cada uma e leve até o bairro certo!' },
    ],
    play: '',
    after: [
      { who: 'VETORA', text: 'Lisboa! A mesma seta, o mesmo significado. Por isso dizemos que as palavras viram vetores: setas com direção e tamanho.' },
      { who: 'NEX', text: 'Então “capital de” é uma direção no mapa? Que doido!' },
    ],
    doc: D('Embeddings: o mapa das palavras', 3, [
      { h: 'Um endereço para cada token', ill: '🗺️', t: 'Cada token vira uma lista de números, como coordenadas num mapa. Nas LLMs de verdade, são milhares de números por token.' },
      { h: 'Vizinhos parecidos', ill: '🏘️', t: 'Palavras usadas em frases parecidas moram perto: Brasil perto de França, gol perto de bola. Distância no mapa é diferença de significado.' },
      { h: 'Setas com sentido', ill: '➡️', t: 'O caminho de Brasil até Brasília é parecido com o de Portugal até Lisboa. As direções do mapa guardam ideias, como “capital de”.' },
      { h: 'E na LLM?', ill: '🤖', t: 'Depois de virar número, cada token vira um vetor de significado. É com esses vetores que a Engine faz todas as contas seguintes.' },
    ]),
    engine: 've… tores. Cada palavra… tem um lugar.',
    codex: ['embedding'],
    hint: 'Fale com a Vetora',
  },
  {
    id: 'atencao', name: 'Praça dos Holofotes', host: 'LUZ', hostName: 'LUZ', kind: 'operario', color: '#ffd27a', word: 'ATENÇÃO',
    intro: [
      { who: 'LUZ', text: 'Luzes, por favor! Bem-vindo à Praça dos Holofotes.' },
      { who: 'LUZ', text: 'Aqui cada token olha para os outros e decide quais importam mais para ele. Isso se chama atenção.' },
      { who: 'LUZ', text: 'Pense na palavra “banco”. Banco de sentar ou banco de dinheiro? Depende das outras palavras da frase!' },
      { who: 'NEX', text: 'Então a palavra muda de sentido conforme as vizinhas?' },
    ],
    play: 'Exatamente. Me ajude a apontar os holofotes!',
    after: [
      { who: 'LUZ', text: 'Bravo! Os holofotes foram para “capital” e “Brasil”. Agora a Engine olha a pergunta inteira, não só a última palavra.' },
    ],
    doc: D('Atenção: quem olha para quem', 4, [
      { h: 'Palavras que se ajudam', ill: '🔦', t: 'Na atenção, cada token dá uma nota para todos os outros: “quanto você me ajuda a me entender?”. As notas viram porcentagens.' },
      { h: 'O mesmo token, sentidos diferentes', ill: '🏦', t: 'Com “praça” e “sentei”, banco é de sentar. Com “dinheiro” e “sacar”, banco é de dinheiro. A atenção mistura o vetor do banco com o das vizinhas.' },
      { h: 'A pergunta inteira', ill: '❓', t: 'Para responder “Qual é a capital do Brasil?”, os holofotes vão para “capital” e “Brasil”. É assim que a Engine olha a frase inteira, e não só a última palavra.' },
      { h: 'E na LLM?', ill: '🤖', t: 'A atenção é o coração do Transformer, a invenção de 2017 que deu origem às LLMs. Ela roda muitas vezes, com vários holofotes ao mesmo tempo.' },
    ]),
    engine: 'a… ten… ção. Eu sei… para onde olhar.',
    codex: ['atencao'],
    hint: 'Fale com a Luz',
  },
  {
    id: 'camadas', name: 'Torre das Camadas', host: 'CAMADA', hostName: 'MESTRE CAMADA', kind: 'guardiao', color: '#7a8cff', word: 'CAMADAS',
    intro: [
      { who: 'CAMADA', text: 'Bem-vindo à Torre das Camadas! Cada andar faz contas com os vetores e passa o resultado para o andar de cima.' },
      { who: 'CAMADA', text: 'As contas são multiplicações de matrizes: tabelas de pesos, lembra da Fase 1? Cada peso diz quanto uma pista vale para cada resposta.' },
      { who: 'NEX', text: 'Pesos de novo! Eles estão em todo lugar.' },
    ],
    play: 'Estão mesmo. Ajuste a tabela de votos: cada pista vota nas respostas, e a mais votada vence.',
    after: [
      { who: 'CAMADA', text: 'Os três andares acenderam! Uma só tabela de pesos respondeu às três perguntas.' },
      { who: 'CAMADA', text: 'Numa LLM, são dezenas de andares assim, cada um com milhões de pesos.' },
    ],
    doc: D('Camadas e matrizes', 5, [
      { h: 'Uma tabela de votos', ill: '🗳️', t: 'Cada pista ativa dá votos para as respostas, conforme os pesos da tabela. Somar os votos de todas as pistas de uma vez é multiplicar uma matriz por um vetor.' },
      { h: 'Uma conta, milhões de somas', ill: '⚡', t: 'Numa LLM, essas tabelas têm milhões de números. As placas de vídeo (GPUs) fazem milhões dessas somas ao mesmo tempo.' },
      { h: 'Andar por andar', ill: '🏢', t: 'A saída de uma camada vira a entrada da próxima. Empilhando dezenas de camadas, cada uma refina o que a anterior entendeu.' },
      { h: 'E na LLM?', ill: '🤖', t: 'Uma LLM grande tem dezenas de camadas de atenção e de tabelas de pesos. Todo o “conhecimento” dela está guardado nesses números.' },
    ]),
    engine: 'ca… madas. Eu penso… em andares.',
    codex: ['camadas'],
    hint: 'Fale com o Mestre Camada',
  },
  {
    id: 'roleta', name: 'Cassino da Roleta', host: 'SORTE', hostName: 'CRUPIÊ SORTE', kind: 'operario', color: '#ff7ab8', word: 'TEMPERATURA',
    intro: [
      { who: 'SORTE', text: 'Façam suas apostas! No topo da torre, cada palavra possível sai com uma chance.' },
      { who: 'SORTE', text: 'Mas a Engine não escolhe sempre a mais provável. Ela gira uma roleta! Fatias maiores saem mais vezes.' },
      { who: 'NEX', text: 'Uma roleta? Então ela responde no sorteio?' },
    ],
    play: 'Um sorteio controlado! O botão da temperatura deixa a roleta mais certinha ou mais criativa. Experimente.',
    after: [
      { who: 'SORTE', text: 'Viu só? Fria, a roleta repete a favorita. Quente, ela arrisca.' },
      { who: 'NOVA', text: 'Para responder a capital do Brasil, a Engine vai usar temperatura baixa. Fato não é lugar para criatividade!' },
    ],
    doc: D('A roleta e a temperatura', 6, [
      { h: 'Uma chance para cada palavra', ill: '🎡', t: 'No fim das contas, a Engine tem uma lista de chances: 75% para uma palavra, 19% para outra… A roleta sorteia uma delas.' },
      { h: 'Temperatura baixa', ill: '🧊', t: 'Com temperatura baixa, a fatia maior cresce. A resposta fica previsível e repetida: bom para fatos, contas e código.' },
      { h: 'Temperatura alta', ill: '🔥', t: 'Com temperatura alta, as fatias ficam parecidas. Saem palavras inesperadas: bom para ideias e histórias, mas erra mais.' },
      { h: 'E na LLM?', ill: '🤖', t: 'Por isso a mesma pergunta pode ter respostas diferentes. Quem usa uma LLM pela API pode escolher a temperatura.' },
    ]),
    engine: 'tem… pe… ratura. Eu sorteio… com cuidado.',
    codex: ['temperatura'],
    hint: 'Fale com a Crupiê Sorte',
  },
  {
    id: 'treino', name: 'Academia dos Pesos', host: 'TREINADORA', hostName: 'TREINADORA PESO', kind: 'guardiao', color: '#ffb35a', word: 'TREINO',
    intro: [
      { who: 'TREINADORA', text: 'Um, dois! Um, dois! Bem-vindo à Academia dos Pesos!' },
      { who: 'TREINADORA', text: 'Como a Engine aprendeu os pesos certos? Treinando! Ela lê uma frase, tenta adivinhar a próxima palavra e mede o erro.' },
      { who: 'TREINADORA', text: 'Depois ajusta cada peso um tiquinho na direção que erra menos. E repete. Milhões de vezes.' },
      { who: 'NEX', text: 'Igual ao Gauss e ao Rosenblatt na Fase 1! Errar cada vez menos.' },
    ],
    play: 'Isso! Este modelinho tem só 27 pesos e ainda não sabe a capital do Brasil. Treine até ele acertar com mais de 90% de certeza.',
    after: [
      { who: 'TREINADORA', text: 'Que treino! E repare: os mesmos 27 pesos aprenderam também a França e o futebol.' },
    ],
    doc: D('Treino: errar cada vez menos', 7, [
      { h: 'Tentar, errar, ajustar', ill: '🏋️', t: 'O treino mostra uma frase de verdade, a Engine chuta a próxima palavra e mede o erro. Cada peso é empurrado um pouquinho para errar menos.' },
      { h: 'O mesmo time de pesos', ill: '🔁', t: 'Os mesmos 27 pesos responderam às três perguntas. Numa LLM, bilhões de pesos guardam tudo junto: capitais, gramática, receitas…' },
      { h: 'Muito texto, muito tempo', ill: '🖥️', t: 'LLMs de verdade treinam com trilhões de tokens, por semanas, em milhares de GPUs. Ninguém escreve as regras: elas aparecem nos pesos.' },
      { h: 'E na LLM?', ill: '🤖', t: 'Depois do treino, os pesos ficam congelados. Quando você conversa com uma LLM, ela usa os pesos, mas não aprende de novo a cada pergunta.' },
    ]),
    engine: 'trei… no. Eu aprendi… errando e ajustando.',
    codex: ['treino'],
    hint: 'Fale com a Treinadora Peso',
  },
  {
    id: 'rag', name: 'Biblioteca do Contexto', host: 'LETICIA', hostName: 'BIBLIOTECÁRIA LETÍCIA', kind: 'bibliotecario', color: '#8ff0b0', word: 'CONTEXTO',
    intro: [
      { who: 'LETICIA', text: 'Shhh… Bem-vindo à Biblioteca do Contexto. Fale baixinho: o Hallucino está por aí.' },
      { who: 'HALLUCINO', text: 'Hihihi! Pergunte qualquer coisa! Eu sempre tenho uma resposta… mesmo quando não sei!' },
      { who: 'NEX', text: 'Ele inventa as coisas?' },
      { who: 'LETICIA', text: 'Quando a Engine não sabe, ela continua prevendo palavras que soam bem. Às vezes sai uma resposta bonita e errada: uma alucinação.' },
    ],
    play: 'O remédio é buscar documentos e colocar no contexto, junto com a pergunta. Isso se chama RAG. Vamos testar!',
    after: [
      { who: 'HALLUCINO', text: 'Ah, não! Com os documentos na mesa, ninguém acredita mais nas minhas invenções…' },
      { who: 'LETICIA', text: 'E quando nem os documentos sabem, o certo é dizer “não sei”. Melhor que inventar!' },
    ],
    doc: D('Contexto, RAG e alucinação', 8, [
      { h: 'Quando a Engine não sabe', ill: '👻', t: 'A Engine sempre prevê alguma palavra. Se a resposta não está nos pesos, ela pode inventar algo que parece certo. Isso é uma alucinação.' },
      { h: 'Buscar antes de responder', ill: '🔎', t: 'No RAG, um buscador acha trechos de documentos parecidos com a pergunta e cola esses trechos no contexto, junto com a pergunta.' },
      { h: 'O contexto é a memória de curto prazo', ill: '📋', t: 'Tudo o que está no contexto (a conversa, os documentos, as instruções) a Engine consegue usar na hora. Mas o contexto tem limite de tokens.' },
      { h: 'E na LLM?', ill: '🤖', t: 'Muitos assistentes usam RAG para responder sobre documentos de empresas ou notícias recentes, e mostram de onde tiraram a resposta.' },
    ]),
    engine: 'con… texto. Quando não sei… eu procuro.',
    codex: ['rag', 'alucinacao'],
    hint: 'Fale com a Bibliotecária Letícia',
  },
]
export const zoneFlag = (id: ZoneId) => 'p2_' + id
export const ZI = (id: ZoneId) => ZONES.findIndex((z) => z.id === id)

/** O caminho da pergunta dentro da Engine (final da fase). */
export const P2_PIPELINE = [
  { k: 'TOKENS', show: 'Qual | é | a | capital | do | Brasil | ?', t: 'Primeiro, corto a pergunta em tokens.' },
  { k: 'IDs', show: '1842 · 91 · 17 · 7231 · 52 · 4098 · 8', t: 'Troco cada token pelo número dele no catálogo.' },
  { k: 'VETORES', show: 'capital → [ 0,8 · −0,3 · 1,2 · … ]', t: 'Cada número vira um vetor: o endereço do token no mapa dos significados.' },
  { k: 'ATENÇÃO', show: 'Brasil 37% · capital 33% · Qual 10% · …', t: 'Na atenção, os tokens se olham. “capital” e “Brasil” recebem os holofotes.' },
  { k: 'CAMADAS', show: 'andar 1 → andar 2 → … → andar 96', t: 'Os vetores sobem a torre: andar por andar, multiplico matrizes de pesos aprendidos no treino.' },
  { k: 'CHANCES', show: 'Brasília 96% · Rio 2% · São Paulo 1%', t: 'No topo, cada palavra possível ganha uma chance.' },
  { k: 'ROLETA', show: 'temperatura baixa → Brasília', t: 'Com temperatura baixa, giro a roleta. Quase sempre sai a favorita.' },
  { k: 'RESPOSTA', show: 'A capital do Brasil é Brasília.', t: 'A palavra escolhida entra no texto, e eu recomeço o caminho para a próxima. Uma palavra de cada vez!' },
]
