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
    simple: 'A Language Engine é uma máquina de linguagem: conversa, responde e cria histórias. Ela perdeu os Núcleos de Conhecimento que explicam como funciona. Cada fase devolve um núcleo.',
    example: 'Núcleos: Matrix, Token, Probability, Embedding, Attention, Transformer, Training, Retrieval, Agents…' },

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
  { id: 'binario', title: 'Binário', cat: 'fundamento', phase: 1, area: 'Vale dos Números', short: 'Só 0 e 1 bastam para escrever qualquer número.',
    simple: 'Com interruptores que só ficam desligados (0) ou ligados (1), dá para representar qualquer número, juntando posições que valem 1, 2, 4, 8, 16…', example: '0101 = 4 + 1 = 5', links: ['bit', 'sistemas'] },

  // ---------- Área 3: Jardim da Lógica ----------
  { id: 'condicional', title: 'SE → ENTÃO', cat: 'fundamento', phase: 1, area: 'Jardim da Lógica', short: 'Uma condição decide o que acontece.',
    simple: '“SE a luz azul estiver acesa, ENTÃO a porta abre.” Uma regra liga uma condição a uma consequência. Programas são cheios dessas regras.', links: ['e_logico', 'algoritmo'] },
  { id: 'e_logico', title: 'E (AND)', cat: 'fundamento', phase: 1, area: 'Jardim da Lógica', short: 'Só abre se as duas condições forem verdadeiras.',
    simple: 'A ponte só desce com as DUAS placas pressionadas. Basta uma falhar para tudo falhar.', example: 'verdadeiro E falso = falso', links: ['ou_logico'] },
  { id: 'ou_logico', title: 'OU (OR)', cat: 'fundamento', phase: 1, area: 'Jardim da Lógica', short: 'Qualquer uma das condições basta.',
    simple: 'Com OU, uma alavanca OU a outra já abre o caminho. Só fica fechado se as duas estiverem desligadas.', example: 'verdadeiro OU falso = verdadeiro', links: ['nao_logico'] },
  { id: 'nao_logico', title: 'NÃO (NOT)', cat: 'fundamento', phase: 1, area: 'Jardim da Lógica', short: 'Inverte: verdadeiro vira falso.',
    simple: 'O portão do NÃO abre quando a luz está APAGADA. Ele inverte a condição. Com E, OU e NÃO dá para montar qualquer circuito lógico.', links: ['bit'] },
  { id: 'algoritmo', title: 'Algoritmo', cat: 'fundamento', phase: 1, area: 'Jardim da Lógica', short: 'Uma sequência de regras que resolve um problema.',
    simple: 'Você programou a máquina com SE, ENTÃO e SENÃO e ela separou as frutas sozinha. Um algoritmo é uma receita: passos claros que qualquer máquina pode seguir.',
    tech: 'As primeiras “inteligências artificiais” eram assim: milhares de regras escritas à mão. Funcionavam às vezes, mas o mundo tem casos demais para escrever regra para tudo. As LLMs aprendem padrões em vez de receber regras.', links: ['automacao', 'programa'] },

  // ---------- Área 4: Câmara da Probabilidade ----------
  { id: 'frequencia', title: 'Frequência', cat: 'fundamento', phase: 1, area: 'Câmara da Probabilidade', short: 'Repetir muitas vezes revela as chances.',
    simple: 'Um dado jogado 6 vezes engana. Jogado 600 vezes, cada face aparece perto de 1/6 das vezes. Contar resultados é a forma mais simples de medir uma chance.', links: ['probabilidade'] },
  { id: 'probabilidade', title: 'Probabilidade', cat: 'fundamento', phase: 1, area: 'Câmara da Probabilidade', short: 'Um número de 0% a 100% para “quão provável”.',
    simple: 'Não dá para saber o resultado exato, mas dá para estimar: o caminho A acontece 80% das vezes, o C só 5%. Uma LLM vive disso: para cada próxima palavra, ela calcula chances.', links: ['frequencia', 'previsao_prob'] },
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
  { id: 'programa', title: 'Programa', cat: 'fundamento', phase: 1, area: 'Oficina das Máquinas', short: 'Instruções gravadas que a máquina segue.',
    simple: 'Os furos do cartão diziam o que fazer, em ordem. Trocar o cartão muda o comportamento sem trocar a máquina: isso é um programa.', links: ['algoritmo', 'hist_maquinas'] },
  { id: 'determinismo', title: 'Processamento determinístico', cat: 'deepdive', phase: 1, area: 'Oficina das Máquinas', short: 'Mesma entrada + mesma regra = mesma saída.',
    simple: 'A máquina de decisão sempre responde igual para a mesma entrada.',
    tech: 'Máquinas clássicas são determinísticas. Uma LLM também é, por dentro, até a hora de escolher a palavra: ali pode entrar sorteio (temperatura), e por isso ela às vezes responde diferente.', links: ['automacao', 'probabilidade'] },
  { id: 'hist_maquinas', title: 'Máquinas que seguem cartões', cat: 'historia', phase: 1, area: 'Oficina das Máquinas', short: 'Jacquard, Babbage e Ada Lovelace.',
    simple: 'Em 1804, o tear de Jacquard tecia desenhos lendo cartões perfurados. Charles Babbage projetou a Máquina Analítica (1837) e Ada Lovelace escreveu o primeiro programa para ela, imaginando que máquinas poderiam até compor música.', links: ['programa'] },

  // ---------- Área 6: Sala da Computação ----------
  { id: 'bit', title: 'Bit', cat: 'fundamento', phase: 1, area: 'Sala da Computação', short: 'A menor informação: 0 ou 1.',
    simple: 'Um bit é um interruptor: desligado (0) ou ligado (1). Sozinho diz pouco; juntos, dizem qualquer coisa.', links: ['byte', 'binario'] },
  { id: 'byte', title: 'Byte', cat: 'fundamento', phase: 1, area: 'Sala da Computação', short: '8 bits juntos formam um byte.',
    simple: 'Com 8 bits dá para formar 256 combinações: de 00000000 (0) a 11111111 (255). Um byte pode guardar um número, uma letra ou o tom de um pixel.', example: '01001001 = 73 = “I”', links: ['texto_numeros'] },
  { id: 'imagem_numeros', title: 'Imagem em números', cat: 'fundamento', phase: 1, area: 'Sala da Computação', short: 'Uma foto é uma grade de números.',
    simple: 'Cada quadradinho (pixel) guarda um número para o brilho. Mude o número e o desenho muda. Uma grade de números com linhas e colunas… é uma matriz.', links: ['matriz_imagem'] },
  { id: 'som_numeros', title: 'Som em números', cat: 'curiosidade', phase: 1, area: 'Sala da Computação', short: 'O som vira milhares de medidas por segundo.',
    simple: 'O microfone mede a altura da onda muitas vezes por segundo (amostras). Tocar essas medidas de volta recria o som.', links: ['medicao'] },
  { id: 'texto_numeros', title: 'Texto em números', cat: 'fundamento', phase: 1, area: 'Sala da Computação', short: 'Cada letra tem um código.',
    simple: 'Para o computador, “A” é 65, “B” é 66… Todo texto que você digita vira uma fila de números. Uma LLM também começa trocando texto por números.', example: 'O I = 79 73', links: ['byte'] },
  { id: 'hist_computadores', title: 'Do relé ao data center', cat: 'historia', phase: 1, area: 'Sala da Computação', short: 'Relés, válvulas, transistores, chips e nuvens.',
    simple: 'Relés (anos 1940) estalavam como interruptores. Válvulas (ENIAC, 1945) eram mais rápidas, mas queimavam. O transistor (1947) e o chip (1958) encolheram tudo. Hoje, data centers com milhares de servidores treinam LLMs.', links: ['bit'] },

  // ---------- Área 7: Câmara da Matriz ----------
  { id: 'matriz', title: 'Matriz', cat: 'fundamento', phase: 1, area: 'Câmara da Matriz', short: 'Números organizados em linhas e colunas.',
    simple: 'Uma matriz é uma tabela de números: cada valor tem uma linha e uma coluna. Parece simples, mas pode representar imagens, mapas e, mais tarde, palavras.',
    example: '[1 0 1]\n[0 1 0]\n[1 1 0]', links: ['matriz_imagem', 'matriz_mapa', 'matriz_vetor'] },
  { id: 'matriz_imagem', title: 'Matriz como imagem', cat: 'fundamento', phase: 1, area: 'Câmara da Matriz', short: 'Mudou o número, mudou o desenho.',
    simple: 'Cada célula da matriz acende um pixel. A matriz não é só uma tabela: ela representa uma imagem.', links: ['imagem_numeros', 'matriz'] },
  { id: 'matriz_mapa', title: 'Matriz como mapa', cat: 'curiosidade', phase: 1, area: 'Câmara da Matriz', short: '1 = plataforma, 0 = vazio.',
    simple: 'Você mudou números e o chão mudou. Uma matriz pode controlar um mundo inteiro.', links: ['matriz'] },
  { id: 'vetor', title: 'Vetor', cat: 'fundamento', phase: 1, area: 'Câmara da Matriz', short: 'Uma lista de números que aponta uma direção.',
    simple: 'Um vetor é uma fila de números, como [2, 1]: “ande 2 para a direita e 1 para cima”. Nas próximas fases, cada palavra vai virar um vetor.', links: ['matriz_vetor', 'espaco_rep'] },
  { id: 'matriz_vetor', title: 'Matriz × Vetor', cat: 'deepdive', phase: 1, area: 'Câmara da Matriz', short: 'A matriz transforma o vetor: A × x = y.',
    simple: 'Uma matriz pode girar, esticar ou espelhar um vetor. O objeto se moveu porque números multiplicaram números.',
    tech: 'Cada número do resultado é uma soma de multiplicações: y₁ = a·x₁ + b·x₂ e y₂ = c·x₁ + d·x₂. Dentro de uma LLM, bilhões dessas multiplicações transformam os vetores das palavras a cada camada.',
    example: '[0 −1; 1 0] × [2, 1] = [−1, 2] (giro de 90°)', links: ['matriz', 'vetor'] },
]

export const CODEX: Record<string, CodexEntry> = Object.fromEntries(E.map((e) => [e.id, e]))
export const CODEX_LIST = E
export function registerCodex(list: CodexEntry[]) { for (const e of list) { if (!CODEX[e.id]) { CODEX[e.id] = e; CODEX_LIST.push(e) } } }
