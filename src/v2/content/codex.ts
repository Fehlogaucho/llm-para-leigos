import type { Cat } from '../store'

export interface CodexEntry {
  id: string
  title: string
  cat: Cat
  phase: number
  area: string
  short: string // uma linha (banner)
  simple: string // camada 2: explicação simples
  tech?: string // camada 3: deep dive
  example?: string
  links?: string[] // conceitos relacionados
  old?: boolean // de uma área antiga, fora da campanha (só aparece se já foi descoberto)
}

export const CAT_INFO: Record<Cat, { label: string; color: string; icon: string }> = {
  fundamento: { label: 'Fundamento', color: '#4fd18b', icon: '●' },
  curiosidade: { label: 'Curiosidade', color: '#59b8ff', icon: '◆' },
  deepdive: { label: 'Deep Dive', color: '#b48cff', icon: '▲' },
  historia: { label: 'História', color: '#f3c55a', icon: '★' },
}

const E: CodexEntry[] = [
  // ---------- Prólogo ----------
  { id: 'engine', title: 'Language Engine', cat: 'historia', phase: 0, area: 'Prólogo', short: 'A máquina que responde, mas esqueceu por quê.',
    simple: 'A Language Engine é a LLM com quem o NEX conversava no computador. O choque que puxou o NEX para dentro dela embaralhou sua memória: ela ainda responde, mas perdeu os Núcleos de Conhecimento que explicam como funciona. Cada fase devolve um núcleo.',
    example: 'Núcleos: MATRIX (Fase 1), TRANSFORMER (Fase 2) e CREATOR (Fase 3)', links: ['metaforas'] },
  { id: 'metaforas', title: 'O que é metáfora no jogo', cat: 'curiosidade', phase: 0, area: 'Prólogo', short: 'A Engine fala, lembra e sente só na história.',
    simple: 'Para a aventura ficar divertida, a Language Engine é uma personagem: ela fala, “lembra”, “esquece” e “sente”. Uma LLM de verdade não tem lembranças nem sentimentos e não decide como uma pessoa: por dentro, são contas com números aprendidos. Robôs, holofotes, roleta e mapas também são imagens para ajudar a entender. Quando o jogo simplifica algo, os documentos avisam no quadro “O jogo simplificou”.',
    example: '“A Engine sabe a resposta” = os pesos dela deixam essa resposta muito provável.', links: ['engine', 'alucinacao'] },

  // ---------- Fase 1 · Área 1: Observatório ----------
  { id: 'observacao', title: 'Observação', cat: 'fundamento', phase: 1, area: 'Observatório', short: 'Olhar com atenção é o primeiro passo.',
    simple: 'Antes de qualquer cálculo, alguém precisa olhar e anotar. Observar é transformar o que acontece no mundo em algo que dá para guardar e comparar.',
    example: 'Os povos antigos olhavam o céu toda noite e anotavam onde cada estrela aparecia.', links: ['padroes', 'medicao'] },
  { id: 'padroes', title: 'Padrões', cat: 'fundamento', phase: 1, area: 'Observatório', short: 'Padrões podem ser encontrados em dados.',
    simple: 'Quando você liga pontos que se repetem, aparece um desenho: um padrão. Encontrar padrões em muitos dados é exatamente o que uma LLM faz com textos.',
    example: 'Pontos → linhas → constelação. Palavras → repetições → “depois de ‘bom’ costuma vir ‘dia’”.', links: ['observacao', 'probabilidade'] },
  { id: 'medicao', title: 'Medição', cat: 'fundamento', phase: 1, area: 'Observatório', short: 'Medir é comparar com uma unidade.',
    simple: 'Medir é dizer “quanto” usando uma régua combinada: a sombra andou 3 marcas, passaram 3 horas. Com medidas, o mundo vira números.',
    example: 'O relógio de sol mede o tempo pela posição da sombra.', links: ['observacao', 'representacao'] },
  { id: 'previsao_simples', title: 'Previsão simples', cat: 'curiosidade', phase: 1, area: 'Observatório', short: 'Se algo se repete, dá para prever.',
    simple: 'A sombra anda sempre do mesmo jeito. Medindo a sequência, você consegue prever onde ela estará depois. Prever a partir de uma sequência é a semente da previsão do próximo token.',
    links: ['medicao', 'previsao_prob'] },
  { id: 'representacao', title: 'Representação', cat: 'fundamento', phase: 1, area: 'Observatório', short: 'Trocar uma coisa por um símbolo que a substitui.',
    simple: 'Um número no livro representa as estrelas que você viu. Representar é guardar o mundo em símbolos. Computadores só trabalham com representações.',
    example: '⭐⭐⭐⭐⭐⭐ → 6', links: ['abstracao', 'matriz'] },
  { id: 'abstracao', title: 'Abstração', cat: 'curiosidade', phase: 1, area: 'Observatório', short: '“6” serve para 6 estrelas, 6 pedras ou 6 dias.',
    simple: 'Quando você conta e escreve “6”, esquece se eram estrelas ou pedras. Ficou só a quantidade. Isso é abstrair: guardar o que importa e deixar o resto de lado.',
    links: ['representacao', 'quantidade'] },
  { id: 'tempo_rep', title: 'Representar o tempo', cat: 'curiosidade', phase: 1, area: 'Observatório', short: 'A areia que cai vira uma medida de tempo.',
    simple: 'A ampulheta não “tem” tempo dentro: ela representa o tempo com areia caindo sempre no mesmo ritmo.', links: ['medicao'] },
  { id: 'espaco_rep', title: 'Representação espacial', cat: 'curiosidade', phase: 1, area: 'Observatório', short: 'Um globo cabe o céu inteiro na mão.',
    simple: 'O globo celeste coloca cada estrela num ponto da esfera. Posições viram coordenadas: dois números dizem onde algo está. Mais tarde, palavras também ganharão posições.', links: ['vetor'] },
  { id: 'abaco', title: 'Ábaco: quantidade em contas', cat: 'curiosidade', phase: 1, area: 'Observatório', short: '8 + 7 = 1 dezena e 5 unidades.',
    simple: 'No ábaco, cada fileira vale uma casa: unidades, dezenas, centenas. Quando uma fileira enche, você troca 10 contas por 1 na fileira de cima. É uma representação compacta de quantidade.',
    example: '8 + 7 → 15 = [1 dezena][5 unidades]', links: ['agrupamento'] },
  { id: 'hist_calculo', title: 'Instrumentos de cálculo', cat: 'historia', phase: 1, area: 'Observatório', short: 'Muito antes dos computadores, já se calculava com máquinas.',
    simple: 'Ábaco (milhares de anos), mecanismo de Anticítera (Grécia, ~100 a.C., previa eclipses com engrenagens), astrolábio (medir a altura das estrelas), ossos de Napier (1617, multiplicar) e Pascalina (1642, somar com rodas dentadas).',
    links: ['automacao'] },

  // ---------- Área 2: Vale dos Números ----------
  { id: 'quantidade', title: 'Quantidade → número', cat: 'fundamento', phase: 1, area: 'Vale dos Números', short: '12 cristais viram o símbolo “12”.',
    simple: 'Uma pilha de objetos é uma quantidade. O símbolo “12” é a representação dessa quantidade: ocupa pouco espaço e qualquer pessoa entende.', links: ['abstracao', 'agrupamento'] },
  { id: 'agrupamento', title: 'Agrupamento', cat: 'fundamento', phase: 1, area: 'Vale dos Números', short: '10 → 100 → 1000: agrupar torna o grande pequeno.',
    simple: 'Carregar mil pedras é impossível. Mas 10 pedras viram 1 saco, 10 sacos viram 1 caixa, 10 caixas viram 1 baú. Com grupos, números enormes ficam fáceis de escrever.', example: '1000 = 1 baú', links: ['sistemas'] },
  { id: 'simbolos', title: 'Símbolos numéricos', cat: 'curiosidade', phase: 1, area: 'Vale dos Números', short: 'IIII, IV, ∴ e 4 dizem a mesma coisa.',
    simple: 'Cada povo inventou seus símbolos: risquinhos, algarismos romanos, pontos e barras maias. O número é a ideia; o símbolo é só a roupa.', links: ['representacao'] },
  { id: 'sistemas', title: 'Sistemas numéricos', cat: 'deepdive', phase: 1, area: 'Vale dos Números', short: '13 = 1101 = D: o mesmo número em bases diferentes.',
    simple: 'Decimal agrupa de 10 em 10. Binário agrupa de 2 em 2 (só 0 e 1). Hexadecimal agrupa de 16 em 16 (0–9 e A–F).',
    tech: 'Em base b, cada posição vale b elevado à posição: 1101₂ = 1·8 + 1·4 + 0·2 + 1·1 = 13. Computadores usam binário porque um circuito tem dois estados confiáveis.', links: ['binario'] },
  { id: 'binario', title: 'Binário', cat: 'fundamento', phase: 1, area: 'Linha do Tempo', short: 'Só 0 e 1 bastam para escrever qualquer número.',
    simple: 'Em 1703, Leibniz escreveu sobre o sistema binário (publicado em 1705): em vez de dez algarismos, só dois. Cada casa vale o dobro da anterior (1, 2, 4, 8…). Com interruptores desligados (0) ou ligados (1), uma máquina escreve qualquer número.',
    tech: 'Em 1854, George Boole mostrou que a lógica (E, OU, NÃO) também pode ser feita com 0 e 1. É assim que os circuitos de um computador fazem contas.', example: '1101 = 8 + 4 + 0 + 1 = 13', links: ['bit'] },

  // ---------- Área 3: Jardim da Lógica ----------
  { id: 'condicional', title: 'SE → ENTÃO', cat: 'fundamento', phase: 1, area: 'Jardim da Lógica', short: 'Uma condição decide o que acontece.',
    simple: '“SE a luz azul estiver acesa, ENTÃO a porta abre.” Uma regra liga uma condição a uma consequência. Programas são cheios dessas regras.', links: ['e_logico', 'algoritmo'] },
  { id: 'e_logico', title: 'E (AND)', cat: 'fundamento', phase: 1, area: 'Jardim da Lógica', short: 'Só abre se as duas condições forem verdadeiras.',
    simple: 'A ponte só desce com as DUAS placas pressionadas. Basta uma falhar para tudo falhar.', example: 'verdadeiro E falso = falso', links: ['ou_logico'] },
  { id: 'ou_logico', title: 'OU (OR)', cat: 'fundamento', phase: 1, area: 'Jardim da Lógica', short: 'Qualquer uma das condições basta.',
    simple: 'Com OU, uma alavanca OU a outra já abre o caminho. Só fica fechado se as duas estiverem desligadas.', example: 'verdadeiro OU falso = verdadeiro', links: ['nao_logico'] },
  { id: 'nao_logico', title: 'NÃO (NOT)', cat: 'fundamento', phase: 1, area: 'Jardim da Lógica', short: 'Inverte: verdadeiro vira falso.',
    simple: 'O portão do NÃO abre quando a luz está APAGADA. Ele inverte a condição. Com E, OU e NÃO dá para montar qualquer circuito lógico.', links: ['bit'] },
  { id: 'algoritmo', title: 'Algoritmo', cat: 'fundamento', phase: 1, area: 'Linha do Tempo', short: 'Uma receita de passos bem definidos.',
    simple: 'Um algoritmo é uma receita: passos claros, em ordem, que funcionam sempre. A palavra vem do nome de al-Khwarizmi, que em Bagdá, por volta de 825, ensinou as contas com algarismos como receitas. Um computador só faz o que um algoritmo manda.',
    tech: 'As primeiras “inteligências artificiais” eram assim: milhares de regras escritas à mão. Funcionavam às vezes, mas o mundo tem casos demais. As LLMs também são algoritmos (os mesmos passos de conta repetidos trilhões de vezes), mas os números que elas usam foram aprendidos, não escritos à mão.',
    example: '48 + 24: unidades (12) → escreve 2, vai 1 → dezenas (7) → 72', links: ['programa', 'neuronio'] },

  // ---------- Área 4: Câmara da Probabilidade ----------
  { id: 'frequencia', title: 'Frequência', cat: 'fundamento', phase: 1, area: 'Câmara da Probabilidade', short: 'Repetir muitas vezes revela as chances.',
    simple: 'Um dado jogado 6 vezes engana. Jogado 600 vezes, cada face aparece perto de 1/6 das vezes. Contar resultados é a forma mais simples de medir uma chance.', links: ['probabilidade'] },
  { id: 'probabilidade', title: 'Probabilidade', cat: 'fundamento', phase: 1, area: 'Linha do Tempo', short: 'Um número de 0% a 100% para “quão provável”.',
    simple: 'Em 1654, Pascal e Fermat trocaram cartas sobre um jogo de dados interrompido e acharam um método geral para calcular chances (antes deles, Cardano e Galileu já tinham feito contas com dados). Não dá para saber o próximo lance, mas dá para calcular as chances. Uma LLM vive disso: para cada próxima palavra, ela calcula uma chance.',
    example: 'Soma 7 com dois dados: 6 jeitos em 36 ≈ 17%', links: ['markov', 'triangulo_pascal'] },
  { id: 'decisao_prob', title: 'Decidir com chances', cat: 'curiosidade', phase: 1, area: 'Câmara da Probabilidade', short: 'Escolher o mais provável nem sempre dá certo, mas acerta mais.',
    simple: 'Quem escolhe o caminho de 80% às vezes perde. Mas, em muitas tentativas, acerta muito mais do que quem escolhe ao acaso.', links: ['probabilidade'] },
  { id: 'previsao_prob', title: 'Previsão probabilística', cat: 'fundamento', phase: 1, area: 'Câmara da Probabilidade', short: 'Você não sabe o futuro, mas pode estimar possibilidades.',
    simple: 'O futuro muda a cada tentativa. Em vez de uma resposta certa, existe uma lista de possibilidades com chances. É assim que uma LLM “pensa” a próxima palavra.', links: ['probabilidade'] },
  { id: 'distribuicao', title: 'Distribuição', cat: 'deepdive', phase: 1, area: 'Câmara da Probabilidade', short: 'O formato de todas as chances juntas.',
    simple: 'Quando você soma dois dados, o 7 aparece mais que o 2 ou o 12. O gráfico de todas as chances é a distribuição.',
    tech: 'Uma distribuição de probabilidade soma 100%. A LLM produz uma distribuição sobre todo o vocabulário a cada passo (via softmax) e depois escolhe uma palavra dessa distribuição.', links: ['probabilidade'] },

  // ---------- Área 5: Oficina das Máquinas ----------
  { id: 'automacao', title: 'Automação', cat: 'fundamento', phase: 1, area: 'Oficina das Máquinas', short: 'Uma máquina executa a regra sozinha.',
    simple: 'Você ajustou 3 e 5, girou a manivela e a máquina mostrou 8. Ninguém precisou contar: a regra estava nas engrenagens.', links: ['loop', 'programa'] },
  { id: 'loop', title: 'Repetição (loop)', cat: 'curiosidade', phase: 1, area: 'Oficina das Máquinas', short: 'A máquina não cansa: repete mil vezes igual.',
    simple: 'Uma pessoa erra na décima conta. A máquina faz a mesma coisa centenas de vezes, sempre igual. Repetir instruções é o que computadores fazem de melhor.', links: ['automacao'] },
  { id: 'programa', title: 'Programa', cat: 'fundamento', phase: 1, area: 'Linha do Tempo', short: 'Instruções gravadas que a máquina segue.',
    simple: 'Em 1843, Ada Lovelace escreveu uma sequência de passos para a Máquina Analítica de Babbage: muita gente considera esse o primeiro programa. E ela foi além: se letras ou notas musicais virassem números, a máquina poderia trabalhar com elas também.',
    example: 'palavras → números → contas → palavras', links: ['algoritmo', 'hist_maquinas', 'texto_numeros'] },
  { id: 'determinismo', title: 'Processamento determinístico', cat: 'deepdive', phase: 1, area: 'Oficina das Máquinas', short: 'Mesma entrada + mesma regra = mesma saída.',
    simple: 'A máquina de decisão sempre responde igual para a mesma entrada.',
    tech: 'Máquinas clássicas são determinísticas. Uma LLM também é, por dentro, até a hora de escolher a palavra: ali pode entrar sorteio (temperatura), e por isso ela às vezes responde diferente.', links: ['automacao', 'probabilidade'] },
  { id: 'hist_maquinas', title: 'Babbage e suas máquinas', cat: 'historia', phase: 1, area: 'Linha do Tempo', short: 'Máquinas de engrenagens que liam cartões.',
    simple: 'Em 1804, o tear de Jacquard tecia desenhos lendo cartões perfurados. Charles Babbage projetou a Máquina Diferencial e a Máquina Analítica, que leria cartões assim. Ele morreu em 1871 sem vê-las prontas, mas em 1991 o Museu de Ciências de Londres construiu a Máquina Diferencial nº 2 pelos desenhos dele, e ela funcionou!', links: ['programa'] },

  // ---------- Área 6: Sala da Computação ----------
  { id: 'bit', title: 'Bit', cat: 'fundamento', phase: 1, area: 'Linha do Tempo', short: 'A menor informação: a resposta de um sim ou não.',
    simple: 'Em 1948, Claude Shannon mostrou que toda informação pode ser medida em respostas de sim ou não. Cada resposta é um bit (0 ou 1). Para achar um número entre 16, bastam 4 perguntas bem feitas: 4 bits.',
    tech: 'Em 1951, Shannon brincou de adivinhar a próxima letra de frases para medir quanta informação um texto tem. As LLMs jogam esse mesmo jogo, com palavras.', links: ['binario', 'texto_numeros'] },
  { id: 'byte', title: 'Byte', cat: 'fundamento', phase: 1, area: 'Sala da Computação', short: '8 bits juntos formam um byte.',
    simple: 'Com 8 bits dá para formar 256 combinações: de 00000000 (0) a 11111111 (255). Um byte pode guardar um número, uma letra ou o tom de um pixel.', example: '01001001 = 73 = “I”', links: ['texto_numeros'] },
  { id: 'imagem_numeros', title: 'Imagem em números', cat: 'fundamento', phase: 1, area: 'Sala da Computação', short: 'Uma foto é uma grade de números.',
    simple: 'Cada quadradinho (pixel) guarda um número para o brilho. Mude o número e o desenho muda. Uma grade de números com linhas e colunas… é uma matriz.', links: ['matriz_imagem'] },
  { id: 'som_numeros', title: 'Som em números', cat: 'curiosidade', phase: 1, area: 'Sala da Computação', short: 'O som vira milhares de medidas por segundo.',
    simple: 'O microfone mede a altura da onda muitas vezes por segundo (amostras). Tocar essas medidas de volta recria o som.', links: ['medicao'] },
  { id: 'texto_numeros', title: 'Texto em números', cat: 'fundamento', phase: 1, area: 'Linha do Tempo', short: 'Cada letra tem um código.',
    simple: 'Para o computador, “A” é 65, “B” é 66… (código ASCII, de 1963). Todo texto que você digita vira uma fila de números. Uma LLM também começa trocando texto por números.', example: 'N E X = 78 69 88', links: ['tokens_barro', 'bit'] },
  { id: 'hist_computadores', title: 'Do relé ao data center', cat: 'historia', phase: 1, area: 'Sala da Computação', short: 'Relés, válvulas, transistores, chips e nuvens.',
    simple: 'Relés (anos 1940) estalavam como interruptores. Válvulas (ENIAC, 1945) eram mais rápidas, mas queimavam. O transistor (1947) e o chip (1958) encolheram tudo. Hoje, data centers com milhares de servidores treinam LLMs.', links: ['bit'] },

  // ---------- Área 7: Câmara da Matriz ----------
  { id: 'matriz', title: 'Matriz', cat: 'fundamento', phase: 1, area: 'Linha do Tempo', short: 'Números em linhas e colunas: o lugar de cada um importa.',
    simple: 'Uma matriz é uma tabela de números em que cada valor tem uma linha e uma coluna, e o lugar dele diz o que ele significa. Há 2.000 anos, na China, o mistério dos três grãos já era resolvido assim, com varetas de bambu num tabuleiro. Com milhares de incógnitas, só organizando tudo em matrizes. Tudo o que uma LLM aprendeu fica guardado em matrizes gigantes.',
    example: 'bom   [3 2 1]\nmédio [2 3 2]\nfraco [1 1 3]\n       39 34 26', links: ['incognitas', 'matriz_vetor', 'vetor', 'nome_matriz'] },
  { id: 'matriz_imagem', title: 'Matriz como imagem', cat: 'fundamento', phase: 1, area: 'Câmara da Matriz', short: 'Mudou o número, mudou o desenho.',
    simple: 'Cada célula da matriz acende um pixel. A matriz não é só uma tabela: ela representa uma imagem.', links: ['imagem_numeros', 'matriz'] },
  { id: 'matriz_mapa', title: 'Matriz como mapa', cat: 'curiosidade', phase: 1, area: 'Câmara da Matriz', short: '1 = plataforma, 0 = vazio.',
    simple: 'Você mudou números e o chão mudou. Uma matriz pode controlar um mundo inteiro.', links: ['matriz'] },
  { id: 'vetor', title: 'Vetor', cat: 'fundamento', phase: 1, area: 'Linha do Tempo', short: 'Uma lista de números que aponta uma direção.',
    simple: 'Um vetor é uma fila de números, como (2, 1): “ande 2 para a direita e 1 para cima”. Nas próximas fases, cada palavra vai virar um vetor.', links: ['matriz_vetor', 'matriz'] },
  { id: 'matriz_vetor', title: 'Matriz × Vetor', cat: 'deepdive', phase: 1, area: 'Linha do Tempo', short: 'Linha encontra coluna: a matriz transforma o vetor.',
    simple: 'Em 1858, Arthur Cayley escreveu as regras para fazer contas com matrizes. Multiplicar uma matriz por um vetor pode girar, esticar ou espelhar uma figura: cada número novo é uma linha encontrando a coluna.',
    tech: 'y₁ = a·x₁ + b·x₂ e y₂ = c·x₁ + d·x₂. Dentro de uma LLM, trilhões dessas multiplicações transformam os vetores das palavras a cada camada. Por isso as LLMs rodam em placas de vídeo, feitas para multiplicar matrizes muito rápido.',
    example: '[0 −1; 1 0] × (2, 1) = (−1, 2)   → giro de 90°', links: ['matriz', 'vetor'] },
  // ---------- Fase 1 · Linha do Tempo (novos) ----------
  { id: 'tokens_barro', title: 'Fichas (tokens)', cat: 'fundamento', phase: 1, area: 'Linha do Tempo', short: 'Uma coisinha no lugar de outra.',
    simple: 'Há uns 5.500 anos, na Mesopotâmia, cada ovelha podia ser representada por uma fichinha de barro. Os arqueólogos chamam essas fichas de tokens. Uma LLM faz algo parecido: o tokenizador corta o texto em pedaços (palavras, pedaços de palavra, espaços ou pontuação) e troca cada pedaço por um número.',
    example: '“gatinho” → [gat] [inho]', links: ['escrita', 'texto_numeros'] },
  { id: 'incognitas', title: 'Descobrir o que nunca foi medido', cat: 'fundamento', phase: 1, area: 'Linha do Tempo', short: 'Dados + relações → valores escondidos.',
    simple: 'Ninguém nunca mediu um feixe de arroz sozinho. Mesmo assim, três registros (39, 34 e 26 dou) bastaram: tirando de um registro o que ele tem de igual a outro, um tipo some e aparece uma relação. Juntando relações, os valores escondidos aparecem. E com eles dá para prever uma mistura que nunca foi feita.',
    tech: 'Isso é um sistema de equações: 3B + 2M + F = 39, 2B + 3M + F = 34 e B + 2M + 3F = 26. O método de eliminar incógnitas, hoje chamado de eliminação de Gauss, já estava nos Nove Capítulos da Arte Matemática. Uma LLM faz algo parecido, em escala gigante: descobre bilhões de valores escondidos (os pesos) a partir de exemplos e usa esses valores para prever o que nunca viu.',
    example: 'B − M = 5 → M = 4,25 → B = 9,25 → F = 2,75\n6 médios → 6 × 4,25 = 25,5 dou', links: ['matriz', 'menor_erro'] },
  { id: 'escrita', title: 'Das fichas à escrita', cat: 'historia', phase: 1, area: 'Linha do Tempo', short: 'Desenhar as fichas virou escrever números.',
    simple: 'A arqueóloga Denise Schmandt-Besserat estudou milhares de fichinhas de barro do Oriente Médio, algumas com mais de 9.000 anos. Elas eram guardadas em envelopes de barro com desenhos por fora. Com o tempo, bastavam os desenhos. Para ela, foi assim que a escrita começou. A ligação com os primeiros números escritos é muito aceita; outros detalhes ainda são discutidos.', links: ['tokens_barro'] },
  { id: 'nome_matriz', title: 'Por que “matriz”?', cat: 'curiosidade', phase: 1, area: 'Linha do Tempo', short: 'Matrix: em latim, o lugar onde algo é gerado.',
    simple: 'Seki Takakazu, no Japão (1683), e Leibniz, na Alemanha (1693), descobriram o determinante sem se conhecerem. Em 1850, James Sylvester deu às tabelas de números o nome “matrix”, palavra latina para útero: delas “nasciam” os determinantes.', links: ['matriz'] },
  { id: 'triangulo_pascal', title: 'O triângulo de Pascal', cat: 'curiosidade', phase: 1, area: 'Linha do Tempo', short: 'Cada número é a soma dos dois de cima.',
    simple: 'O triângulo conta de quantos jeitos as coisas podem acontecer. Jogando 3 moedas, a linha 1 3 3 1 diz: 1 jeito de dar 3 caras, 3 jeitos de dar 2, 3 jeitos de dar 1 e 1 jeito de não dar nenhuma. Matemáticos chineses e persas já o conheciam séculos antes de Pascal.',
    example: '    1\n   1 1\n  1 2 1\n 1 3 3 1', links: ['probabilidade'] },
  { id: 'menor_erro', title: 'O menor erro', cat: 'fundamento', phase: 1, area: 'Linha do Tempo', short: 'Ajustar até errar o menos possível.',
    simple: 'Em 1801, Gauss calculou onde Ceres ia reaparecer, procurando o caminho que errava menos em relação às medições. O método, os mínimos quadrados, foi publicado por Legendre (1805) e por Gauss (1809). Treinar uma LLM é a mesma ideia, em tamanho gigante: ajustar os números dela, um pouquinho de cada vez, até o erro ficar o menor possível.',
    tech: 'O erro de uma LLM se chama loss. O treino calcula para que lado cada peso deve mudar para o erro diminuir (o gradiente) e dá um passinho nessa direção, bilhões de vezes. Você vê isso na Academia dos Pesos (Fase 2) e na Forja de Treino (Fase 3).', links: ['neuronio', 'perda'] },
  { id: 'markov', title: 'Cadeia de Markov', cat: 'fundamento', phase: 1, area: 'Linha do Tempo', short: 'O que veio antes ajuda a prever o que vem depois.',
    simple: 'Em 1913, Andrei Markov contou 20 mil letras de um poema e viu que, depois de uma vogal, vinha consoante 87 vezes em cada 100. A letra de antes ajuda a prever a próxima. (Ele já estudava essas sequências desde 1906.) Troque letras por palavras e um poema por bilhões de textos: é o coração de uma LLM.',
    example: 'o céu é → azul (67%) · escuro · lindo', links: ['probabilidade', 'llm_pipeline'] },
  { id: 'neuronio', title: 'Neurônio artificial', cat: 'fundamento', phase: 1, area: 'Linha do Tempo', short: 'Pistas × pesos → soma → acende ou não.',
    simple: 'Em 1943, McCulloch e Pitts imaginaram um neurônio feito de contas. Em 1958, Frank Rosenblatt apresentou o Perceptron, que ajustava os próprios pesos quando errava. Os números de uma LLM também se chamam pesos: em vez de 3, são bilhões.',
    tech: 'Um neurônio calcula soma = pista₁·peso₁ + pista₂·peso₂ + … e passa o resultado por uma regra (acende ou não, ou uma curva suave). Uma LLM empilha milhões desses neurônios em camadas.', links: ['menor_erro', 'algoritmo'] },
  { id: 'llm_pipeline', title: 'Como a LLM junta tudo', cat: 'deepdive', phase: 1, area: 'Linha do Tempo', short: 'Fichas → números → matrizes → chances → próxima palavra.',
    simple: 'A frase é cortada em fichas (tokens); cada ficha vira números; esses números atravessam matrizes de pesos, multiplicação após multiplicação; no fim sai uma chance para cada palavra possível, e a LLM escolhe uma. Depois repete tudo para a próxima palavra.',
    example: '“O céu é” → [O][céu][é] → números → ▦×▦×▦ → azul 62% → “azul”', links: ['tokens_barro', 'matriz', 'matriz_vetor', 'probabilidade', 'markov'] },  // ---------- Fase 2 · Dentro da LLM ----------
  { id: 'proxima_palavra', title: 'Prever a próxima palavra', cat: 'fundamento', phase: 2, area: 'Fábrica de Previsões', short: 'A LLM escreve uma palavra de cada vez.',
    simple: 'Toda resposta de uma LLM é feita prevendo o próximo token, olhando tudo o que veio antes. A LLM calcula uma chance para cada token possível; um jeito de escolher (como a roleta da temperatura) pega um deles; ele entra no texto e o jogo recomeça. Chance alta não quer dizer verdade: uma frase pode ser muito provável e estar errada.',
    example: '“A capital do Brasil é” → Brasília', links: ['markov', 'token', 'temperatura'] },
  { id: 'token', title: 'Token', cat: 'fundamento', phase: 2, area: 'Fábrica de Previsões', short: 'O pedacinho de texto que a LLM lê e escreve.',
    simple: 'Antes de qualquer conta, um programa chamado tokenizador corta o texto em tokens. Um token pode ser uma palavra inteira, um pedaço de palavra (in | feliz | mente), um espaço, uma pontuação ou parte de um emoji. Cada LLM tem o seu tokenizador, então a mesma frase pode virar quantidades diferentes de tokens. Tamanho da conversa, limite e preço são contados em tokens.',
    example: 'Qual | é | a | capital | do | Brasil | ? = 7 tokens', links: ['token_id', 'tokens_barro'] },
  { id: 'token_id', title: 'ID do token', cat: 'curiosidade', phase: 2, area: 'Fábrica de Previsões', short: 'Cada token tem um número fixo no catálogo.',
    simple: 'O catálogo de tokens (o vocabulário) dá um número para cada pedaço. A rede neural da LLM não recebe as letras que você vê: recebe esses números. Texto visível → tokens → IDs.',
    example: 'capital = 7231 · Brasil = 4098', links: ['token', 'embedding'] },
  { id: 'embedding', title: 'Embedding (vetor de significado)', cat: 'fundamento', phase: 2, area: 'Fábrica de Previsões', short: 'Cada token vira um endereço num mapa de significados.',
    simple: 'O ID de cada token puxa uma lista de números, aprendida no treino, como coordenadas num mapa. Palavras usadas de jeito parecido ficam perto, e algumas direções guardam ideias: de Brasil a Brasília é parecido com de Portugal a Lisboa. Perto quer dizer “usado de jeito parecido”, não “mesma coisa”.',
    tech: 'Nas LLMs, cada vetor tem centenas ou milhares de números, e cada número sozinho quase nunca tem um sentido simples. O mapa do jogo, com 2 dimensões, é só uma projeção para caber na tela. Depois, as camadas transformam esses vetores conforme o contexto: o vetor de “banco” começa igual e termina diferente em cada frase.', links: ['vetor', 'atencao'] },
  { id: 'atencao', title: 'Atenção', cat: 'fundamento', phase: 2, area: 'Fábrica de Previsões', short: 'Uma conta que pesa quanto cada token ajuda a entender os outros.',
    simple: 'Na atenção, a LLM calcula, para cada token, um peso para cada um dos outros (as porcentagens) e mistura as informações de acordo com esses pesos. Assim “banco” vira banco de sentar ou de dinheiro, conforme a frase. Ninguém “decide” nada: são contas com números aprendidos no treino.',
    tech: 'É a peça central do Transformer (2017). Cada token gera uma consulta (query), uma chave (key) e um valor (value); comparar consultas com chaves dá as notas, que viram porcentagens (softmax) e misturam os valores. Isso acontece com várias cabeças de atenção, em cada uma de dezenas de camadas. Um mapa de atenção ajuda a ilustrar, mas sozinho não explica tudo o que a LLM fez.', links: ['embedding', 'camadas', 'transformer'] },
  { id: 'camadas', title: 'Camadas', cat: 'fundamento', phase: 2, area: 'Fábrica de Previsões', short: 'Andar por andar, a LLM multiplica matrizes de pesos.',
    simple: 'Os vetores atravessam dezenas de camadas. Em cada uma, tabelas de pesos (matrizes) somam votos de muitas pistas ao mesmo tempo. As GPUs fazem milhões dessas somas de uma vez.',
    links: ['matriz_vetor', 'atencao', 'treino'] },
  { id: 'temperatura', title: 'Temperatura', cat: 'fundamento', phase: 2, area: 'Fábrica de Previsões', short: 'O botão que deixa a escolha mais previsível ou mais variada.',
    simple: 'No fim, cada palavra tem uma chance e a LLM sorteia uma. A temperatura mexe nas chances antes do sorteio: baixa favorece a mais provável (respostas previsíveis); alta deixa as chances parecidas (respostas variadas). Ela muda a variedade, não a verdade: se a palavra mais provável estiver errada, a temperatura baixa repete o erro.',
    tech: 'Matematicamente, os números de cada palavra são divididos pela temperatura antes do softmax. Outros botões, como top-k e top-p, cortam as palavras pouco prováveis antes do sorteio; muitos sistemas usam vários juntos.',
    example: 'depois de “é”: fria → “uma” 75% · quente → 29%, 23%, 16%…', links: ['probabilidade', 'proxima_palavra'] },
  { id: 'treino', title: 'Treino', cat: 'fundamento', phase: 2, area: 'Fábrica de Previsões', short: 'Chutar, medir o erro, ajustar os pesos. Milhões de vezes.',
    simple: 'O treino mostra frases de verdade, a LLM chuta a próxima palavra e mede o erro. Cada peso é empurrado um pouquinho na direção que erra menos. Os mesmos pesos guardam tudo o que ela aprendeu.',
    tech: 'O erro (perda) mais usado é a entropia cruzada; o ajuste dos pesos usa o gradiente, calculado por retropropagação.', links: ['menor_erro', 'neuronio', 'camadas'] },
  { id: 'rag', title: 'RAG (busca no contexto)', cat: 'fundamento', phase: 2, area: 'Fábrica de Previsões', short: 'Buscar documentos e colocar junto com a pergunta.',
    simple: 'Primeiro, um buscador acha trechos de documentos parecidos com a pergunta (recuperação). Depois, a LLM escreve a resposta com esses trechos no contexto (geração), e pode mostrar a fonte. RAG é uma peça extra, que alguns sistemas usam; não faz parte de toda LLM. E não garante acerto: o documento pode estar errado, velho ou fora do assunto, e a LLM ainda pode ler mal.',
    links: ['alucinacao', 'contexto', 'prompt'] },
  { id: 'alucinacao', title: 'Alucinação', cat: 'curiosidade', phase: 2, area: 'Fábrica de Previsões', short: 'Uma resposta bonita, confiante e errada.',
    simple: 'A LLM sempre prevê alguma palavra. Quando a resposta não está bem apoiada nos pesos nem no contexto, ela pode inventar algo que parece certo. Texto bonito e confiante não é prova: fluência, certeza aparente e verdade são coisas diferentes. Para o que importa, confira em fontes confiáveis.',
    example: 'Pergunte à LLM do laboratório a capital da Espanha: ela nunca leu “Espanha” e mesmo assim responde, com confiança.', links: ['rag', 'generalizacao', 'metaforas'] },
  { id: 'contexto', title: 'Contexto', cat: 'curiosidade', phase: 2, area: 'Fábrica de Previsões', short: 'A memória de curto prazo da conversa.',
    simple: 'Tudo o que está no contexto (a conversa, instruções, documentos) a LLM pode usar na hora. O contexto tem limite, medido em tokens.', links: ['rag', 'token'] },
  { id: 'transformer', title: 'Transformer', cat: 'deepdive', phase: 2, area: 'Fábrica de Previsões', short: 'Tokens → vetores → atenção + camadas → chances → roleta.',
    simple: 'É o desenho de máquina por trás das LLMs, publicado em 2017. Ele junta tudo: tokens viram vetores, a atenção mistura o contexto, camadas de pesos refinam, e no topo sai uma chance para cada token. O caminho mostrado no jogo é simplificado: há muitas cabeças de atenção, dezenas de camadas e detalhes que mudam de uma LLM para outra.',
    example: '“Qual é a capital do Brasil?” → … → Brasília 96%', links: ['token', 'embedding', 'atencao', 'camadas', 'temperatura'] },
  // ---------- Fase 3 · Crie sua LLM ----------
  { id: 'dados_treino', title: 'Dados de treino', cat: 'fundamento', phase: 3, area: 'Laboratório', short: 'A LLM aprende padrões dos textos do treino, certos ou errados.',
    simple: 'Uma LLM aprende padrões com os textos que recebe. Ela não guarda os textos como um arquivo para consultar: guarda tendências nos pesos. Por isso consegue montar frases que nunca leu (às vezes certas, às vezes erradas). Frases erradas, poucas ou enviesadas no treino viram respostas ruins depois. Escolher e limpar os dados é parte importante do trabalho.', links: ['treino', 'generalizacao'] },
  { id: 'generalizacao', title: 'Decorar × generalizar', cat: 'fundamento', phase: 3, area: 'Laboratório', short: 'Acertar o que já viu não prova que aprendeu.',
    simple: 'Uma LLM pode decorar exemplos do treino ou aprender padrões que servem para casos novos (generalizar). Para saber, testamos com frases que ela nunca leu. Às vezes ela acerta; às vezes responde uma coisa nova e errada com toda a confiança. Um acerto isolado não é prova de que ela entende.',
    example: 'Vista no treino: “A capital da França é” → Paris ✓ · Nunca vista: “A capital da Espanha é” → Roma ✗', links: ['dados_treino', 'alucinacao', 'mini_rede'] },
  { id: 'mini_rede', title: 'A sua LLM × uma LLM de verdade', cat: 'deepdive', phase: 3, area: 'Laboratório', short: 'Centenas de pesos contra bilhões.',
    simple: 'A LLM do laboratório é uma mini-rede neural de verdade, treinada no seu navegador: cerca de 30 tokens, algumas centenas de pesos, alguns minutos de treino. Uma LLM moderna tem dezenas de milhares de tokens no vocabulário, bilhões de pesos e treina com trilhões de tokens em milhares de placas de vídeo. A sua também não tem atenção nem camadas empilhadas: ela olha só 1 a 3 tokens para trás.',
    tech: 'Arquitetura da mini-rede: os embeddings (3 números) dos últimos tokens são colados, passam por 12 neurônios (tanh) e viram uma chance para cada token (softmax). Treino: descida do gradiente com entropia cruzada, uma passada por todos os exemplos por época.', links: ['transformer', 'perda'] },
  { id: 'janela', title: 'Janela de contexto', cat: 'fundamento', phase: 3, area: 'Laboratório', short: 'Quantos tokens para trás a LLM consegue olhar.',
    simple: 'Com memória de 1 token, a mini-LLM só vê a última palavra e confunde as capitais. Com 3 tokens, ela acerta. As LLMs de verdade olham milhares de tokens, às vezes centenas de milhares.', links: ['contexto', 'atencao'] },
  { id: 'perda', title: 'Perda (erro do treino)', cat: 'deepdive', phase: 3, area: 'Laboratório', short: 'O número que o treino tenta diminuir.',
    simple: 'A cada exemplo, mede-se quão surpresa a LLM ficou com a palavra certa. Treinar é fazer esse número cair, ajustando os pesos. Ele costuma cair com sobe-e-desce, não em linha reta. E perda baixa nos exemplos do treino não garante acertar frases novas: ela pode só ter decorado.', links: ['treino', 'menor_erro', 'generalizacao'] },
  { id: 'ajuste_fino', title: 'Ajuste fino', cat: 'fundamento', phase: 3, area: 'Laboratório', short: 'Treinar mais um pouco, com exemplos escolhidos.',
    simple: 'O ajuste fino treina mais um pouco uma LLM já treinada, com exemplos escolhidos, para ela aprender um estilo ou uma tarefa. Diferente do prompt e do RAG, que só mudam o contexto da conversa, o ajuste fino muda os pesos, a própria LLM. O resultado depende dos exemplos, do método e de quanto se treina; exemplos errados podem estragar respostas que estavam certas.', links: ['treino', 'prompt', 'rag'] },
  { id: 'prompt', title: 'Prompt', cat: 'curiosidade', phase: 3, area: 'Laboratório', short: 'As instruções que vão no contexto.',
    simple: 'O prompt é o texto que você manda: pergunta, instruções, exemplos. Ele não muda os pesos, só o contexto daquela conversa. Prompt = você escreve; RAG = um buscador traz documentos; ajuste fino = treina e muda os pesos.', links: ['contexto', 'ajuste_fino', 'rag'] },
  { id: 'rlhf', title: 'Aprender com preferências', cat: 'deepdive', phase: 3, area: 'Laboratório', short: 'Pessoas escolhem a melhor resposta, e a LLM aprende com isso.',
    simple: 'Depois do treino, pessoas comparam respostas e marcam a melhor (mais útil, mais honesta, mais segura). A LLM é ajustada para preferir respostas assim. É uma das etapas de alinhamento.', links: ['ajuste_fino'] },
]

/* As áreas antigas da Fase 1 saíram da campanha: seus verbetes só aparecem se já foram descobertos. */
const KEEP = new Set(['engine', 'matriz', 'algoritmo', 'probabilidade', 'binario', 'programa', 'bit', 'texto_numeros', 'vetor', 'matriz_vetor', 'hist_maquinas'])
for (const e of E) if (e.phase === 1 && e.area !== 'Linha do Tempo' && !KEEP.has(e.id)) e.old = true

export const CODEX: Record<string, CodexEntry> = Object.fromEntries(E.map((e) => [e.id, e]))
export const CODEX_LIST = E
export function registerCodex(list: CodexEntry[]) { for (const e of list) { if (!CODEX[e.id]) { CODEX[e.id] = e; CODEX_LIST.push(e) } } }
