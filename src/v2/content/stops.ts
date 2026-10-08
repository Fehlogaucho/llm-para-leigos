/* =========================================================
   FASE 1 · A LINHA DO TEMPO DA MEMÓRIA — conteúdo das paradas
   Cada parada: o inventor aparece (holograma) e conta a ideia,
   um documento lúdico de 4 páginas (o problema → a ideia → e na LLM?),
   uma brincadeira curta ou pergunta, e a palavra que a Engine recupera.
   Textos simples, para leigos. Fatos históricos conferidos.
   ========================================================= */

export interface Person { name: string; short: string; color: string; acc: 'beard' | 'turban' | 'hat' | 'wig' | 'bun' | 'cap' | 'none' | 'sideburns' | 'glasses' | 'straw' }
export const PEOPLE: Record<string, Person> = {
  ESCRIBA: { name: 'Escriba de Uruk', short: 'EU', color: '#d8954a', acc: 'beard' },
  LIUHUI: { name: 'Liu Hui', short: 'LH', color: '#e0505a', acc: 'hat' },
  KHWARIZMI: { name: 'Al-Khwarizmi', short: 'AK', color: '#3fb6b0', acc: 'turban' },
  PASCAL: { name: 'Blaise Pascal', short: 'BP', color: '#7a8cff', acc: 'wig' },
  LEIBNIZ: { name: 'Gottfried Leibniz', short: 'GL', color: '#b07aff', acc: 'wig' },
  GAUSS: { name: 'Carl Friedrich Gauss', short: 'CG', color: '#59d7ff', acc: 'cap' },
  ADA: { name: 'Ada Lovelace', short: 'AL', color: '#ff7ab8', acc: 'bun' },
  CAYLEY: { name: 'Arthur Cayley', short: 'AC', color: '#ffd27a', acc: 'sideburns' },
  MARKOV: { name: 'Andrei Markov', short: 'AM', color: '#8ff0b0', acc: 'beard' },
  SHANNON: { name: 'Claude Shannon', short: 'CS', color: '#ffb35a', acc: 'none' },
  ROSENBLATT: { name: 'Frank Rosenblatt', short: 'FR', color: '#9fe9ff', acc: 'glasses' },
  // personagens das cenas (não são paradas)
  COMERCIANTE: { name: 'Comerciante da vila', short: 'CV', color: '#e6c04a', acc: 'straw' },
}

export interface Page { h: string; t: string; ill?: string }
export interface Doc { title: string; year: string; place: string; who?: string; pages: Page[] }
export interface Ask { q: string; opts: string[]; a: number; why: string }
export type Game = 'tabela' | 'passos' | 'dados' | 'binario' | 'erro' | 'vetor' | 'proxima' | 'bits' | 'neuronio'
export interface Stop {
  id: string; year: string; who: string
  intro: string[] // falas do inventor ao aparecer
  doc: Doc
  game?: Game; ask?: Ask
  custom?: 'graos' // parada com cena própria (O Mistério dos Três Grãos)
  nex: string // reação do NEX ao inventor
  tease: string // fala da NOVA quando a névoa abre para esta parada
  play?: string // o inventor chama para a brincadeira
  bye: string // despedida do inventor
  word: string // palavra que a Engine recupera
  engine: string // fala da Engine (cada vez menos falhada)
  codex: string[]
  extra?: Doc // documento opcional, mais fundo
  extraCodex?: string
  place: string // lugar curto (placa)
}

export const STOPS: Stop[] = [
  {
    id: 'fichas', year: '3500 a.C.', who: 'ESCRIBA',
    intro: [
      'Olá, viajante! Eu sou um escriba de Uruk, na Mesopotâmia, há uns 5.500 anos.',
      'Ninguém guardou o meu nome… mas a ideia que a gente teve, você usa todos os dias.',
    ],
    doc: {
      title: 'As fichas de barro', year: 'há ~5.500 anos', place: 'Uruk, Mesopotâmia (hoje, Iraque)', who: 'ESCRIBA', pages: [
        { h: 'O problema', ill: '🐑🐑🐑🐑🐑🐑🐑', t: 'Um pastor leva 7 ovelhas para pastar. Na volta, como saber se alguma se perdeu? Ele não sabe contar até 7. Quase ninguém sabia!' },
        { h: 'A ideia', ill: '🐑 → 🟤', t: 'Para cada ovelha que sai, uma fichinha de barro vai para a bolsa. Na volta, sai uma ficha para cada ovelha que entra. Sobrou ficha? Falta ovelha!' },
        { h: 'Do barro ao número', ill: '🟤🟤🟤 → ✍️', t: 'Depois, em vez de guardar as fichas, os escribas passaram a desenhá-las no barro. Esses desenhos são os números escritos mais antigos que conhecemos.' },
        { h: 'E na LLM?', ill: '“gatinho” → [gat] [inho]', t: 'Os arqueólogos chamam essas fichinhas de tokens. Uma LLM faz igual: corta o texto em pedacinhos e troca cada um por uma ficha, um token. Ela nunca lê letras: lê fichas!' },
      ],
    },
    ask: { q: 'O pastor voltou e sobraram 2 fichas na bolsa. O que aconteceu?', opts: ['Ele ganhou 2 ovelhas', 'Faltam 2 ovelhas', 'As fichas quebraram'], a: 1, why: 'Cada ficha representa uma ovelha. Ficha sobrando quer dizer ovelha faltando.' },
    nex: 'Uma ficha para cada ovelha… É tipo contar nos dedos, só que com barro!',
    tease: 'O primeiro marco: Mesopotâmia, há 5.500 anos. Dá até para ouvir ovelhas…',
    place: 'MESOPOTÂMIA',
    extraCodex: 'escrita',
    bye: 'Uma coisinha no lugar de outra: é assim que tudo começa.',
    word: 'FICHAS', engine: 'fi… chas… Eu leio… fichas.', codex: ['tokens_barro'],
    extra: {
      title: 'Quem descobriu as fichas?', year: 'anos 1970', place: 'Oriente Médio', pages: [
        { h: 'Milhares de bolinhas', ill: '🔺⚪🟤', t: 'A arqueóloga Denise Schmandt-Besserat estudou milhares de fichinhas de barro achadas no Oriente Médio. Algumas têm mais de 9.000 anos!' },
        { h: 'Um formato para cada coisa', ill: '🔺 grão · 🟤 ovelha', t: 'As fichas tinham formatos diferentes para coisas diferentes: cones, esferas, discos. Cada formato representava um tipo de mercadoria.' },
        { h: 'O envelope de barro', ill: '🥚 + marcas', t: 'As fichas eram guardadas em envelopes de barro. Por fora, desenhavam as fichas de dentro. Com o tempo, bastavam os desenhos: tinha nascido a escrita.' },
      ],
    },
  },
  {
    id: 'tabela', year: '200 a.C.', who: 'LIUHUI', custom: 'graos',
    intro: [
      'Eu sou Liu Hui. No ano 263, escrevi explicações para um livro que já era antigo: Os Nove Capítulos da Arte Matemática.',
      'O mistério dos três grãos está nesse livro. E o jeito que você resolveu é o mesmo que os calculistas usavam, com varetas de bambu.',
    ],
    doc: {
      title: 'O mistério dos três grãos', year: 'há ~2.000 anos', place: 'China', who: 'LIUHUI', pages: [
        { h: 'Um problema de 2.000 anos', ill: '📜🌾', t: 'O mistério dos três grãos é o primeiro problema do capítulo 8 do livro Os Nove Capítulos da Arte Matemática, escrito na China há uns 2.000 anos. Ninguém sabe quem foi o autor.' },
        { h: 'O tabuleiro de varetas', ill: '│││ ││ │', t: 'Os calculistas punham cada registro numa coluna de um tabuleiro, com varetas de bambu. Varetas vermelhas eram números positivos; pretas, negativos. O lugar de cada vareta dizia o que ela era.' },
        { h: 'Eliminar, coluna por coluna', ill: '39 − 34 = 5', t: 'Igual a você: tirando um registro do outro, uma incógnita some. Repetindo, sobra uma só, e as outras aparecem em seguida. Na Europa, esse método só apareceu mais de mil anos depois. Hoje ele se chama eliminação de Gauss.' },
        { h: 'E na LLM?', ill: 'exemplos → pesos → previsão', t: 'Uma LLM resolve um mistério parecido, só que gigante: descobre bilhões de valores escondidos (os pesos) a partir de textos que já existem. Depois usa esses valores para prever o que nunca viu: a próxima palavra.' },
      ],
    },
    nex: 'Esse problema tem 2.000 anos? E eu resolvi igualzinho aos calculistas?',
    tease: 'A névoa abriu! Lá na frente tem uma vila da China antiga. Parece que um comerciante tem um mistério…',
    place: 'CHINA',
    extraCodex: 'nome_matriz',
    bye: 'Quando não dá para medir algo diretamente, use o que você já sabe. Até mais, viajante!',
    word: 'MATRIZES', engine: 'ma… tri… zes. Eu guardo… o que aprendi… em matrizes.', codex: ['incognitas', 'matriz'],
    extra: {
      title: 'Por que “matriz”?', year: '1683 a 1850', place: 'Japão, Alemanha e Inglaterra', pages: [
        { h: 'Um número que resume a tabela', ill: '▦ → 1 número', t: 'Sem se conhecerem, Seki Takakazu, no Japão (1683), e Leibniz, na Alemanha (1693), descobriram o determinante: uma conta com os números da tabela que diz se o problema tem uma única resposta.' },
        { h: 'O nome', ill: 'matrix', t: 'Em 1850, o inglês James Sylvester batizou a tabela de “matrix”, palavra latina para útero: o lugar onde algo é gerado. Para ele, dela “nasciam” os determinantes.' },
        { h: 'E hoje', ill: '▦▦▦', t: 'É dessa “mãe” que nascem as respostas das IAs. Uma LLM média tem centenas de matrizes, cada uma com milhões de números.' },
      ],
    },
  },
  {
    id: 'algoritmo', year: '825', who: 'KHWARIZMI',
    intro: [
      'Salam! Eu sou Muhammad al-Khwarizmi. Eu trabalhava na Casa da Sabedoria, em Bagdá, uma biblioteca cheia de sábios do mundo inteiro.',
      'Meu nome virou uma palavra que você com certeza já ouviu. Adivinha qual?',
    ],
    doc: {
      title: 'O passo a passo', year: 'por volta de 825', place: 'Bagdá (hoje, Iraque)', who: 'KHWARIZMI', pages: [
        { h: 'O problema', ill: 'XLVIII + XXIV = ?', t: 'Fazer contas era coisa de especialista. Com números como XLVIII, somar e multiplicar era um sufoco.' },
        { h: 'A ideia', ill: '0 1 2 3 4 5 6 7 8 9', t: 'Escrevi um livro ensinando as contas com os algarismos que vieram da Índia, incluindo o zero. E ensinei cada conta como uma receita: passo 1, passo 2, passo 3.' },
        { h: 'Meu nome virou palavra', ill: 'al-Khwarizmi → algoritmo', t: 'Na Europa, meu livro foi traduzido como “Algoritmi…”. E “algoritmo” passou a querer dizer qualquer receita de passos bem definidos. Outro livro meu, Al-jabr, deu nome à álgebra.' },
        { h: 'E na LLM?', ill: '🔁', t: 'Um computador só faz o que um algoritmo manda. Por dentro, uma LLM é um algoritmo enorme: os mesmos passos de conta, repetidos trilhões de vezes.' },
      ],
    },
    game: 'passos',
    nex: 'Al-Khwarizmi… al-go-ritmo… ALGORITMO?!',
    tease: 'Próximo marco: Bagdá, no ano 825. A cidade tinha uma das maiores bibliotecas do mundo.',
    play: 'Minha receita da soma ficou embaralhada. Coloque os passos na ordem!',
    place: 'BAGDÁ',
    bye: 'Uma boa receita funciona sempre, com qualquer número. Isso é um algoritmo.',
    word: 'PASSOS', engine: 'pas… sos. Eu sigo… passos.', codex: ['algoritmo'],
  },
  {
    id: 'chances', year: '1654', who: 'PASCAL',
    intro: [
      'Bonjour! Eu sou Blaise Pascal. Em 1654, um amigo que adorava apostas me fez uma pergunta difícil.',
      'Escrevi para o Pierre de Fermat pedindo ajuda. Das nossas cartas nasceu uma matemática nova.',
    ],
    doc: {
      title: 'Calcular a sorte', year: '1654', place: 'França', who: 'PASCAL', pages: [
        { h: 'O problema', ill: '🎲🎲  ⏸️  💰 ?', t: 'Dois amigos apostam num jogo de dados, mas precisam parar no meio. Dar tudo para quem tem mais pontos não é justo. Como dividir o dinheiro?' },
        { h: 'A ideia', ill: '✉️ ⇄ ✉️', t: 'Nas cartas, eu e Fermat listamos tudo o que ainda poderia acontecer e contamos em quantos casos cada um ganharia.' },
        { h: 'Nasce a probabilidade', ill: '3 em 4 = 75%', t: 'Assim, o dinheiro se divide pelas chances de cada um. Pela primeira vez, alguém fez contas com um futuro incerto: é a probabilidade.' },
        { h: 'E na LLM?', ill: 'azul 62% · escuro 21% · …', t: 'Uma LLM nunca tem certeza da próxima palavra. Ela calcula a chance de cada palavra possível e escolhe com base nisso.' },
      ],
    },
    game: 'dados',
    nex: 'Matemática de apostas? Agora fiquei curioso.',
    tease: 'Agora pulamos para a França, em 1654. Estou ouvindo dados rolando…',
    play: 'Vamos jogar dois dados milhares de vezes. Antes, aposte: qual soma sai mais?',
    place: 'FRANÇA',
    extraCodex: 'triangulo_pascal',
    bye: 'Não dá para saber o próximo lance. Mas dá para saber as chances.',
    word: 'CHANCES', engine: 'chan… ces. Cada palavra… tem uma chance.', codex: ['probabilidade'],
    extra: {
      title: 'O triângulo de Pascal', year: '1654', place: 'França (e antes, China e Pérsia)', pages: [
        { h: 'Um triângulo de números', ill: '1 · 1 1 · 1 2 1 · 1 3 3 1', t: 'Cada número é a soma dos dois de cima. Parece brincadeira, mas ele conta de quantos jeitos as coisas podem acontecer.' },
        { h: 'Moedas', ill: '🪙🪙🪙', t: 'Jogando 3 moedas, a linha 1 3 3 1 diz: 1 jeito de dar 3 caras, 3 jeitos de dar 2, 3 jeitos de dar 1 e 1 jeito de não dar nenhuma.' },
        { h: 'Mais antigo que o Pascal', ill: '🌏', t: 'Matemáticos chineses e persas já conheciam esse triângulo séculos antes. Pascal o estudou tão bem que ele ficou com o nome dele.' },
      ],
    },
  },
  {
    id: 'binario', year: '1703', who: 'LEIBNIZ',
    intro: [
      'Guten Tag! Eu sou Gottfried Leibniz. Eu adorava máquinas de calcular e tive uma ideia que pareceu maluca.',
      'E se, em vez de dez algarismos, a gente usasse só dois?',
    ],
    doc: {
      title: 'Tudo com 0 e 1', year: '1703', place: 'Alemanha', who: 'LEIBNIZ', pages: [
        { h: 'O problema', ill: '🖐️🖐️ = 10', t: 'Contamos com dez algarismos porque temos dez dedos. Mas uma máquina não tem dedos. Dá para contar com menos?' },
        { h: 'A ideia', ill: '8 4 2 1 → 0101 = 5', t: 'Publiquei o sistema binário: só 0 e 1. Cada casa vale o dobro da anterior: 1, 2, 4, 8… O número 5 vira 101: um 4, nenhum 2 e um 1.' },
        { h: 'Um sim ou um não', ill: '💡 = 1 · ⚫ = 0', t: '0 e 1 podem ser desligado e ligado, não e sim. Em 1854, George Boole mostrou que até o raciocínio lógico (E, OU, NÃO) pode ser feito com 0 e 1.' },
        { h: 'E na LLM?', ill: '01001100 01001100 01001101', t: 'Todo computador guarda tudo em 0 e 1: textos, fotos, músicas e os bilhões de números da própria LLM.' },
      ],
    },
    game: 'binario',
    nex: 'Só dois? Como é que dá para escrever 100 com dois algarismos?',
    tease: 'Alemanha, 1703. Um filósofo que inventava máquinas de calcular está nos esperando.',
    play: 'Acenda as lâmpadas certas para escrever cada número só com 0 e 1.',
    place: 'ALEMANHA',
    bye: 'Com só dois símbolos, dá para escrever qualquer número. As máquinas agradecem.',
    word: 'ZERO E UM', engine: 'ze… ro e um. Por dentro… só zero e um.', codex: ['binario'],
  },
  {
    id: 'erro', year: '1801', who: 'GAUSS',
    intro: [
      'Hallo! Eu sou Carl Friedrich Gauss. Em 1801, os astrônomos perderam um asteroide de vista.',
      'Eu tinha 24 anos e encontrei ele com papel, lápis e uma ideia: errar o menos possível.',
    ],
    doc: {
      title: 'O menor erro', year: '1801 a 1809', place: 'Alemanha', who: 'GAUSS', pages: [
        { h: 'O problema', ill: '✦ ·  ✦ · ✦', t: 'O asteroide Ceres foi visto por poucas semanas e sumiu no brilho do Sol. As medições que sobraram eram poucas, e todas um pouco erradas.' },
        { h: 'Testar caminhos', ill: '📏', t: 'Para cada caminho possível, medi a distância até cada ponto observado: esse é o erro. Caminho ruim, erro grande.' },
        { h: 'O caminho que erra menos', ill: '🎯', t: 'Fiquei com o caminho de menor erro total: o método dos mínimos quadrados. Meses depois, Ceres reapareceu bem onde eu tinha previsto!' },
        { h: 'E na LLM?', ill: '⛰️ ↘ ↘ ↘', t: 'Treinar uma LLM é a mesma ideia, em tamanho gigante: ajustar os números dela, um pouquinho de cada vez, até o erro ficar o menor possível.' },
      ],
    },
    game: 'erro',
    nex: 'Achar um asteroide com lápis e papel? Sem computador nenhum?',
    tease: 'Próximo marco: 1801. Olhe o telescópio! Alguém perdeu uma coisa no céu.',
    play: 'Ajuste a linha para passar o mais perto possível de todas as observações.',
    place: 'ALEMANHA',
    bye: 'Ninguém acerta tudo. O segredo é errar cada vez menos.',
    word: 'MENOR ERRO', engine: 'erro… menor. Eu aprendi… errando cada vez menos.', codex: ['menor_erro'],
  },
  {
    id: 'programa', year: '1843', who: 'ADA',
    intro: [
      'Olá! Eu sou Ada Lovelace. Meu amigo Charles Babbage projetou uma máquina de calcular gigante, a Máquina Analítica.',
      'Eu enxerguei nela uma coisa que nem ele tinha visto.',
    ],
    doc: {
      title: 'A máquina dos símbolos', year: '1843', place: 'Inglaterra', who: 'ADA', pages: [
        { h: 'A máquina', ill: '⚙️ + 🃏', t: 'A Máquina Analítica seria toda de engrenagens e leria cartões perfurados, como os teares que teciam desenhos. Os furos diziam o que fazer, passo a passo.' },
        { h: 'O primeiro programa', ill: '🃏🃏🃏', t: 'Em 1843, escrevi notas sobre a máquina. Numa delas, montei uma sequência de passos para ela calcular números difíceis. Muita gente considera esse o primeiro programa de computador.' },
        { h: 'Mais que contas', ill: '🎵 = 🔢', t: 'E percebi algo maior: se letras ou notas musicais virassem números, a máquina poderia trabalhar com elas também. Ela poderia até compor música!' },
        { h: 'E na LLM?', ill: 'palavras → números → palavras', t: 'Foi o que aconteceu: palavras viram números, e uma máquina de contas escreve textos. Eu imaginei isso uns 180 anos antes.' },
      ],
    },
    ask: { q: 'Qual foi a grande ideia da Ada?', opts: ['A máquina só serve para somar', 'Se símbolos virarem números, a máquina pode trabalhar com eles', 'As máquinas pensam como pessoas'], a: 1, why: 'Letras, notas e palavras podem virar números. É assim que uma máquina de contas consegue escrever.' },
    nex: 'O primeiro programa foi escrito por uma mulher, em 1843? Que demais!',
    tease: 'Inglaterra, 1843. Engrenagens, vapor e cartões cheios de furinhos…',
    place: 'INGLATERRA',
    extraCodex: 'hist_maquinas',
    bye: 'Uma máquina não sabe o que é música. Mas, com números, ela pode tocar.',
    word: 'SÍMBOLOS', engine: 'sím… bolos. Eu mexo com símbolos… não só com números.', codex: ['programa'],
    extra: {
      title: 'Babbage e suas máquinas', year: '1822 a 1871', place: 'Inglaterra', pages: [
        { h: 'A Máquina Diferencial', ill: '⚙️⚙️⚙️', t: 'Charles Babbage projetou primeiro a Máquina Diferencial, feita para calcular tabelas de números sem erro, só girando uma manivela.' },
        { h: 'Nunca terminada', ill: '🛠️', t: 'Faltou dinheiro e precisão nas peças. Babbage morreu em 1871 sem ver suas máquinas prontas.' },
        { h: 'Funcionava!', ill: '✅', t: 'Em 1991, o Museu de Ciências de Londres construiu a Máquina Diferencial nº 2 seguindo os desenhos dele. E ela funcionou!' },
      ],
    },
  },
  {
    id: 'multiplicar', year: '1858', who: 'CAYLEY',
    intro: [
      'Bom dia! Eu sou Arthur Cayley. Meu amigo Sylvester tinha dado às tabelas de números o nome de matriz.',
      'Eu resolvi tratá-las como se fossem números de verdade: somar, multiplicar…',
    ],
    doc: {
      title: 'Multiplicar tabelas', year: '1858', place: 'Inglaterra', who: 'CAYLEY', pages: [
        { h: 'A pergunta', ill: '▦ × ▦ = ?', t: 'Dá para somar e multiplicar dois números. E duas tabelas inteiras? Em 1858, escrevi as regras para fazer contas com matrizes.' },
        { h: 'Linha encontra coluna', ill: '[1 2] · [3 4] = 1·3 + 2·4 = 11', t: 'Para multiplicar, uma linha encontra uma coluna: multiplica par por par e soma tudo. Dá trabalho, mas é sempre a mesma receita.' },
        { h: 'Transformar', ill: '↗ ⟲ ↖', t: 'Uma matriz multiplicando uma lista de números (um vetor) pode girar, esticar ou espelhar uma figura. A matriz vira uma máquina de transformar.' },
        { h: 'E na LLM?', ill: '× × × trilhões', t: 'Multiplicar matrizes é o que uma LLM mais faz: são trilhões de multiplicações para escrever uma resposta. Por isso ela usa placas de vídeo, que fazem isso muito rápido.' },
      ],
    },
    game: 'vetor',
    nex: 'Multiplicar uma tabela inteira? Isso parece trabalhoso…',
    tease: 'Ainda na Inglaterra, 1858. Lembra das tabelas do mistério dos três grãos? Agora alguém quer multiplicar matrizes inteiras.',
    play: 'Escolha a matriz que leva a seta até a estrela.',
    place: 'INGLATERRA',
    bye: 'Uma matriz não é só uma tabela parada: ela transforma.',
    word: 'MULTIPLICAR', engine: 'multi… plicar. Eu multiplico… matrizes.', codex: ['matriz_vetor', 'vetor'],
  },
  {
    id: 'markov', year: '1913', who: 'MARKOV',
    intro: [
      'Zdravstvuyte! Eu sou Andrei Markov. Em 1913, peguei um poema famoso e contei as letras dele, uma por uma.',
      'Vinte mil letras! Os meus alunos acharam que eu tinha ficado louco.',
    ],
    doc: {
      title: 'O que vem depois?', year: '1913', place: 'Rússia', who: 'MARKOV', pages: [
        { h: 'O problema', ill: 'a ? ? ?', t: 'Será que as letras de um texto aparecem por acaso? Ou a letra de antes ajuda a adivinhar a próxima?' },
        { h: 'Contar, letra por letra', ill: '🟡 → 🔵 ?', t: 'Peguei 20 mil letras do poema Eugênio Oneguin. Depois de cada vogal, anotei o que vinha: outra vogal ou uma consoante.' },
        { h: 'Apareceu um padrão', ill: '87 em 100', t: 'Depois de uma vogal, vinha consoante 87 vezes em cada 100! A letra de antes ajuda, e muito, a prever a próxima. Isso virou a cadeia de Markov.' },
        { h: 'E na LLM?', ill: 'O céu é ___', t: 'Troque letras por palavras e um poema por bilhões de textos: prever o que vem depois é o coração de toda LLM.' },
      ],
    },
    game: 'proxima',
    nex: 'Contar vinte mil letras na mão? Eu desistiria na décima!',
    tease: 'Rússia, 1913. Um matemático está contando letras de um poema. Uma por uma.',
    play: 'Conte comigo: nestas frases, o que vem depois de “é”?',
    place: 'RÚSSIA',
    bye: 'O passado ajuda a prever o futuro. Pelo menos nos textos!',
    word: 'PRÓXIMA PALAVRA', engine: 'pró… xima. Eu prevejo… o que vem depois.', codex: ['markov'],
  },
  {
    id: 'bit', year: '1948', who: 'SHANNON',
    intro: [
      'E aí! Eu sou Claude Shannon. Eu gostava de malabares, de monociclo… e de uma pergunta: quanta informação cabe numa mensagem?',
      'Vamos jogar um jogo. Já já você vai entender o que é um bit.',
    ],
    doc: {
      title: 'O bit', year: '1948', place: 'Estados Unidos', who: 'SHANNON', pages: [
        { h: 'A pergunta', ill: '📞 ✉️ 📻', t: 'Telefone, telégrafo, rádio: todos levam mensagens. Mas como medir a informação? Quanto “pesa” uma mensagem?' },
        { h: 'O bit', ill: '❓❓❓❓ = 4 bits', t: 'Em 1948, mostrei que toda informação pode ser medida em respostas de sim ou não. Cada resposta é um bit. Para achar 1 número entre 16, bastam 4 perguntas: 4 bits.' },
        { h: 'Texto vira número', ill: 'N E X = 78 69 88', t: 'Qualquer letra pode virar um número, e qualquer número vira bits. Em 1963, o código ASCII deu um número para cada letra: A é 65, B é 66…' },
        { h: 'E na LLM?', ill: 'O c é u _ ?', t: 'Em 1951, eu brinquei de adivinhar a próxima letra de frases, para medir quanta informação o texto tem. Setenta anos depois, as LLMs jogam esse mesmo jogo, com palavras.' },
      ],
    },
    game: 'bits',
    nex: 'Monociclo e matemática? Gostei desse cara.',
    tease: 'Estados Unidos, 1948. A era dos telefones e dos primeiros computadores.',
    play: 'Pensei num número de 1 a 16. Descubra com perguntas de sim ou não.',
    place: 'ESTADOS UNIDOS',
    bye: 'Sim ou não, 1 ou 0: é assim que a informação viaja.',
    word: 'BITS', engine: 'bits. Cada letra… vira número.', codex: ['bit', 'texto_numeros'],
  },
  {
    id: 'neuronio', year: '1958', who: 'ROSENBLATT',
    intro: [
      'Olá! Eu sou Frank Rosenblatt. Em 1958, construí o Perceptron, uma máquina que aprendia.',
      'Ela não seguia regras escritas por alguém: aprendia com os próprios erros.',
    ],
    doc: {
      title: 'O neurônio que aprende', year: '1943 e 1958', place: 'Estados Unidos', who: 'ROSENBLATT', pages: [
        { h: 'O problema', ill: '🐱 ? 🐶 ?', t: 'Como ensinar uma máquina a reconhecer um gato? Escrever uma regra para cada caso nunca acaba: toda regra tem exceção.' },
        { h: 'O neurônio de mentira', ill: 'pista × peso → soma → 💡', t: 'Em 1943, McCulloch e Pitts imaginaram um neurônio feito de contas: cada pista tem um peso. Ele soma os pesos das pistas presentes e, se passar de um limite, acende.' },
        { h: 'Aprender errando', ill: '❌ → ⚖️ → ✅', t: 'O Perceptron errava e corrigia os pesos. Viu um cachorro e disse “gato”? A pista “late” passa a contar contra. Na próxima, ele acerta.' },
        { h: 'E na LLM?', ill: '3 pesos → bilhões', t: 'Os números ajustados de uma LLM se chamam pesos, igual aos do Perceptron. A diferença é a quantidade: em vez de 3, são bilhões.' },
      ],
    },
    game: 'neuronio',
    nex: 'Uma máquina que aprende sozinha… isso já parece IA de verdade!',
    tease: 'O último marco: 1958. Uma máquina que aprende está piscando lá na frente!',
    play: 'Meu neurônio está confundindo bichos. Ajuste os pesos até ele acertar todos.',
    place: 'ESTADOS UNIDOS',
    bye: 'Ninguém disse à máquina o que é um gato. Ela ajustou os pesos até acertar.',
    word: 'PESOS', engine: 'pe… sos. Bilhões de pesos… dentro de mim.', codex: ['neuronio'],
  },
]

/** A frase que a Engine lembra no fim, montada com as palavras de cada parada. */
export const FINAL_SENTENCE = 'Eu me lembro! Eu leio fichas e transformo tudo em números, em zeros e uns. Guardo o que aprendi em matrizes de pesos, ajustados para errar menos. Multiplico matrizes, passo a passo, e escolho a próxima palavra pelas chances.'

/** O caminho de “O céu é” dentro da Engine (final). */
export const PIPELINE = [
  { words: ['FICHAS'], show: '[O] [céu] [é]', t: 'A frase é cortada em fichas: os tokens.' },
  { words: ['SÍMBOLOS', 'BITS', 'ZERO E UM'], show: '46 · 3121 · 518', t: 'Cada ficha vira um número. E todo número vira zeros e uns, que a máquina guarda.' },
  { words: ['MATRIZES'], show: '[0,2  −1,3  0,7 …]', t: 'Cada número puxa uma linha de uma matriz gigante: uma lista de números para cada ficha.' },
  { words: ['MULTIPLICAR', 'PASSOS'], show: '▦ × ▦ × ▦ …', t: 'Essas listas atravessam matrizes, multiplicação após multiplicação, sempre nos mesmos passos.' },
  { words: ['PESOS', 'MENOR ERRO'], show: 'bilhões de pesos', t: 'Os números dessas matrizes são pesos, ajustados no treino para errar cada vez menos.' },
  { words: ['CHANCES'], show: 'azul 62% · escuro 21% · bonito 12%', t: 'No fim, sai uma chance para cada palavra possível.' },
  { words: ['PRÓXIMA PALAVRA'], show: 'O céu é azul', t: 'A Engine escolhe uma palavra… e repete tudo para a próxima.' },
]

/** Quem recuperou cada palavra (para colorir as fichas de memória). */
export const WORD_WHO: Record<string, string> = Object.fromEntries(STOPS.map((s) => [s.word, s.who]))
