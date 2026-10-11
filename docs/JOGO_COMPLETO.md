# LLM: The Prediction Factory
### Documento completo do jogo: contexto, objetivos, personagens, fases e diálogos

*Versão principal (2D isométrica em pixel art), outubro de 2026 · Site: https://llm-para-leigos.pages.dev · Idioma: português do Brasil*

---

## Sumário

- [1. Contexto](#1-contexto)
- [2. Objetivos](#2-objetivos)
- [3. A história em resumo](#3-a-história-em-resumo)
- [4. Personagens](#4-personagens)
- [5. Estrutura do jogo](#5-estrutura-do-jogo)
- [6. Prólogo](#6-prólogo)
- [7. Fase 1 · As Origens: O Arquivo da Memória](#7-fase-1--as-origens-o-arquivo-da-memória)
- [8. Fase 2 · Dentro da LLM: A Fábrica de Previsões](#8-fase-2--dentro-da-llm-a-fábrica-de-previsões)
- [9. Fase 3 · Crie sua LLM: O Laboratório](#9-fase-3--crie-sua-llm-o-laboratório)
- [10. Final · De Volta para Casa](#10-final--de-volta-para-casa)
- [11. Codex (verbetes)](#11-codex-verbetes)
- [12. Interface e sistemas](#12-interface-e-sistemas)
- [13. Notas para quem mexe no projeto](#13-notas-para-quem-mexe-no-projeto)

---

## 1. Contexto

**LLM: The Prediction Factory** é uma aventura educativa, gratuita e jogada no navegador, que explica para leigos como funcionam os modelos de linguagem grandes (LLMs), como os assistentes de IA de conversa. O jogo foi feito para quem nunca estudou matemática avançada nem programação: as ideias aparecem na história, em conversas, em brincadeiras curtas e em documentos ilustrados de quatro páginas.

**Público:** curiosos, estudantes, professores e qualquer pessoa que usa IA no dia a dia e quer entender o que acontece “por dentro”. Linguagem simples, frases curtas, exemplos concretos (ovelhas, dados, arroz, a capital do Brasil).

**Plataformas:** navegador no computador (teclado e mouse) e no celular (toque). O progresso fica salvo no próprio navegador.

**Versões no mesmo site:**

| Versão | Endereço | Situação |
|---|---|---|
| Principal: 2D isométrica em pixel art | `/` | É a versão descrita neste documento. Prólogo, 3 fases e final. |
| 3D | `/3d/` | Versão anterior em 3D (congelada). |
| Clássica | `/classico/` | Versão original em páginas, base do conteúdo das Fases 2 e 3. |

**Estilo:** pixel art isométrica desenhada por código (sem imagens prontas para o cenário), personagens expressivos, retratos com expressões nos diálogos, vozes lidas em voz alta (gravadas no prólogo; voz do navegador no resto), música por ambiente e muitos detalhes animados (cachoeiras de dados, drones, criaturinhas, faíscas, esteiras).

**Como se joga:**

- **Celular:** arraste o círculo dourado para andar ou toque no chão onde quer ir; toque nos objetos marcados com losango para usar e nos balões para conversar.
- **Computador:** WASD ou setas para andar, Shift para correr, E para usar, clique no chão para ir até lá.
- O **objetivo atual** fica no alto da tela, e uma seta dourada aponta o caminho.

**Fio condutor pedagógico:** a mesma pergunta atravessa o jogo, “**Qual é a capital do Brasil?**”. Na Fase 1 ela aparece como uma das frases da máquina; na Fase 2 ela é cortada em tokens e segue o NEX por todas as estações até a Engine responder “Brasília”; na Fase 3 é o teste da LLM que o jogador treina.

## 2. Objetivos

### Objetivo do jogador (na história)

Ajudar a **Language Engine**, a IA com quem o NEX conversava, a recuperar a memória perdida num choque elétrico. Cada fase devolve um **Núcleo de Conhecimento**:

| Fase | Núcleo | O que a Engine volta a lembrar |
|---|---|---|
| Fase 1 · As Origens | **MATRIX CORE** | A matemática por trás de uma LLM (fichas, números, matrizes, pesos, chances). |
| Fase 2 · Dentro da LLM | **TRANSFORMER CORE** | Como ela funciona por dentro, passo a passo, até responder. |
| Fase 3 · Crie sua LLM | **CREATOR CORE** | Como uma LLM nasce: dados, treino, teste, ajuste e alinhamento. |

Com os três núcleos de volta, a Engine consegue devolver o NEX ao quarto dele, e finalmente termina a resposta para a pergunta do começo: “Como você funciona?”.

### Objetivo pedagógico (o que a pessoa aprende)

- **Fase 1:** que a LLM se apoia em ideias com milhares de anos: tokens (fichas de barro), matrizes, algoritmos, probabilidade, zero e um, o menor erro, programas com símbolos, multiplicação de matrizes, prever a próxima palavra (Markov), bits e neurônios com pesos.
- **Fase 2:** o caminho de uma pergunta dentro de uma LLM: prever a próxima palavra, tokens e IDs, embeddings (vetores de significado), atenção, camadas e matrizes, temperatura, treino (errar e ajustar pesos) e contexto/RAG contra alucinação.
- **Fase 3:** fazer uma LLM de verdade (pequena, treinada no navegador): escolher dados, montar o vocabulário, decidir a memória (janela de contexto), treinar e ver o erro cair, testar os 7 passos internos, entender prompt × ajuste fino e aprender com preferências (útil, honesta, segura), terminando com uma prova final.

**Princípio de design:** o NEX é o aluno, não o professor. Ele pergunta o que o jogador perguntaria, erra, experimenta e só depois a explicação aparece, sempre ligada ao que acabou de acontecer. Cada ideia termina com “E na LLM?”, conectando a história ao funcionamento real dos modelos.

## 3. A história em resumo

Numa noite de tempestade, **NEX** pergunta à IA do computador: “Como você funciona?”. No meio da resposta (“…prevendo a próxima palavra, uma de cada vez, usando…”), um raio atinge a casa, NEX leva um choque, encolhe e é puxado para dentro da tela.

Ele cai dentro da **Language Engine**. A máquina ainda responde, mas esqueceu por quê: os Núcleos de Conhecimento se espalharam. **NOVA**, uma robozinha flutuante que é a guia da máquina, acorda e propõe o caminho de volta: ajudar a Engine a lembrar.

Na **Fase 1**, NEX percorre o **Arquivo da Memória**, um arquipélago de ilhas flutuantes, uma para cada época, onde ecos de inventores reais (de um escriba de Uruk a Frank Rosenblatt) contam suas ideias. Cada ideia entendida devolve uma palavra à Engine; as onze palavras seguem o NEX até a Memória Central, e a Engine recupera o MATRIX CORE.

Na **Fase 2**, NEX entra na **Fábrica de Previsões**, o coração da Engine, onde chegou a pergunta “Qual é a capital do Brasil?”. Oito estações, cada uma cuidada por um robô, estão desligadas. Ao religá-las, NEX aprende tokens, vetores, atenção, camadas, temperatura, treino e RAG, e a Engine finalmente responde “Brasília”, recuperando o TRANSFORMER CORE.

Na **Fase 3**, no **Laboratório**, NEX conhece a **Dra. Sinapse** e uma **LLM bebê** que ainda não sabe nada. O jogador dá um nome a ela e a cria do zero: escolhe os textos, monta o vocabulário, treina, testa, ajusta e a leva até a formatura. A Engine recupera o CREATOR CORE, fica inteira de novo e abre um portal para casa.

No **Final**, NEX acorda no quarto, de manhã. A IA termina a frase que ficou pela metade e explica, em palavras simples, tudo o que ele viu lá dentro.

## 4. Personagens

### Protagonistas

**NEX** — o protagonista e o “avatar” do jogador. Jovem explorador curioso, inteligente e um pouco impulsivo. Cabelo castanho bagunçado, barbinha curta, jaqueta azul, mochila com um rolo de papel. Não entende matemática avançada no começo, faz as perguntas que o jogador faria, erra e aprende experimentando. Tem retratos com dezenas de expressões (assustado, curioso, animado, confuso…). Animações: andar, correr, sentar, digitar, comemorar, pensar, susto, carregar coisas, cair do alto e ficar tonto.

**NOVA** — robozinha flutuante, branca, com visor azul e chama de propulsão. É a guia da Language Engine: narra, explica e provoca, sem entregar a resposta de cara. Acompanha o NEX o tempo todo, flutuando ao lado dele. Também tem retratos com várias expressões.

**Language Engine (ENGINE)** — a LLM com quem o NEX conversava no computador. No começo fala engasgada, em sílabas (“pró… xi… ma… pa… la…”); a cada ideia recuperada, fala uma frase com a palavra que voltou a lembrar; ao fim de cada fase, fala cada vez melhor. Aparece como uma grande máquina/cérebro holográfico e como voz.

### Prólogo

- **O gato do NEX** — laranja, dorme na cama (balão “zz”), foge assustado com o raio e, no final, espera o NEX de volta (aceita carinho e responde com um coração).
- **Drones de manutenção** — sobrevoam o salão da Engine. Um deles conversa: *“Bip-bop! Manutenção da Language Engine. Memória bagunçada… bip.”*
- **Sistema** — as dicas de controle que aparecem na tela.

### Fase 1 · O Arquivo da Memória

Os inventores aparecem como **ecos holográficos** em cada ilha, e cada um mostra uma imagem real (pintura ou foto histórica).

| Época | Personagem | Ideia | Palavra que a Engine recupera |
|---|---|---|---|
| 3500 a.C. | **Escriba de Uruk** | As fichas de barro | FICHAS |
| 200 a.C. | **Liu Hui** | O mistério dos três grãos | MATRIZES |
| 825 | **Al-Khwarizmi** | O passo a passo | PASSOS |
| 1654 | **Blaise Pascal** | Calcular a sorte | CHANCES |
| 1703 | **Gottfried Leibniz** | Tudo com 0 e 1 | ZERO E UM |
| 1801 | **Carl Friedrich Gauss** | O menor erro | MENOR ERRO |
| 1843 | **Ada Lovelace** | A máquina dos símbolos | SÍMBOLOS |
| 1858 | **Arthur Cayley** | Multiplicar tabelas | MULTIPLICAR |
| 1913 | **Andrei Markov** | O que vem depois? | PRÓXIMA PALAVRA |
| 1948 | **Claude Shannon** | O bit | BITS |
| 1958 | **Frank Rosenblatt** | O neurônio que aprende | PESOS |

- **Comerciante da vila** — agricultor da China antiga, de chapéu de palha, dono dos três registros de arroz do “Mistério dos Três Grãos”.
- **Arquivista** — robô bibliotecário roxo que cuida do Arquivo. Explica as ilhas, a névoa e as palavras que seguem o NEX, e diz quantos pedestais já acenderam.
- **Guardião** — robô azul que patrulha a borda da Memória Central: *“Bip! Ninguém atravessa a névoa… só quem traz uma lembrança de volta.”*
- **Criaturinhas de cada ilha** — tokens e bits que dormem (cinzentos) enquanto a lembrança não volta e acordam coloridos, pulando e cantando, quando ela volta.
- **As palavras recuperadas** — viram criaturinhas com etiqueta que seguem o NEX (as três mais recentes) e voam para o núcleo no final.
- Ovelhas na Mesopotâmia, agricultores na vila, drones, um monociclo e um rato no labirinto na ilha de Shannon.

### Fase 2 · A Fábrica de Previsões

| Estação | Robô | Tipo | O que ensina |
|---|---|---|---|
| 1. Oficina do Adivinho | **Prof. Adivinho** | cientista (jaleco) | Prever |
| 2. O Fatiador | **Tesourinha** | tesoura nas mãos | Tokens |
| 3. Vale dos Vetores | **Vetora** | carteiro (boné e bolsa) | Vetores |
| 4. Praça dos Holofotes | **Luz** | operário (capacete) | Atenção |
| 5. Torre das Camadas | **Mestre Camada** | guardião (lanterna) | Camadas |
| 6. Cassino da Roleta | **Crupiê Sorte** | operário (capacete) | Temperatura |
| 7. Academia dos Pesos | **Treinadora Peso** | guardião (lanterna) | Treino |
| 8. Biblioteca do Contexto | **Bibliotecária Letícia** | bibliotecário (livro) | Contexto |

- **Hallucino** — fantasminha rosa que flutua pela Biblioteca do Contexto e inventa respostas que soam bem (*“Sabia que a lua é feita de queijo? Hihihi! (Não é.)”*). Depois do RAG, fica tristinho: *“Tá bom, tá bom… vou conferir as fontes antes de falar.”*
- **Os tokens da pergunta** — “Qual | é | a | capital | do | Brasil | ?” viram uma fila de criaturinhas que segue o NEX depois do Fatiador; “capital” e “Brasil” ficam dourados depois da atenção, e no fim todos pulam para dentro da máquina do prompt.
- **Palavras perdidas do Vale** — Madri, pênalti e salário, que pulam pela entrada até serem levadas ao bairro certo.
- Operário carregando caixas, palavras que pulam pela oficina (“famoso”, “pelo”, “samba”), robôs levantando peso na academia e drones.

### Fase 3 · O Laboratório

- **Dra. Sinapse** — robô cientista-chefe (turquesa). Conduz o jogador pelas estações e caminha até a próxima estação ativa.
- **A LLM bebê** — robozinho redondo com tela no rosto, dentro de uma cápsula de vidro. O jogador escolhe o nome: **Lumi, Faísca, Pipoca, Bit**. Ela cresce a cada estação (olhos acendem, ganha bochechas, fica mais clara, ganha gravatinha no ajuste fino e capelo na formatura). Antes do treino só balbucia palavras soltas, geradas pela própria rede ainda aleatória; depois do treino escreve frases de verdade. É uma rede neural real treinada no navegador.
- **Assistentes do laboratório** — um robô operário com um frasco brilhante e um robô carteiro, mais um drone.

### Final

- NEX, o gato e a IA no computador, que conversa pela tela de chat.

## 5. Estrutura do jogo

| Capítulo | Nome no jogo | Ambiente | Missões |
|---|---|---|---|
| quarto | **O Quarto** | O quarto do NEX, noite de tempestade | 1: Uma pergunta |
| prologo | **A Language Engine** | O salão da Language Engine | 1: A máquina que esqueceu |
| p1 | **O Arquivo da Memória** | Arquipélago de 11 ilhas em volta da Memória Central | 13: Chegada ao Arquivo; 3500 a.C. · As fichas de barro; 200 a.C. · O mistério dos três grãos; 825 · O passo a passo; 1654 · Calcular a sorte; 1703 · Tudo com 0 e 1; 1801 · O menor erro; 1843 · A máquina dos símbolos; 1858 · Multiplicar tabelas; 1913 · O que vem depois?; 1948 · O bit; 1958 · O neurônio que aprende; A Memória Central |
| p2 | **A Fábrica de Previsões** | Fábrica com 3×3 salas, esteiras e barreiras de energia | 10: Chegada à fábrica; Estação 1 · Oficina do Adivinho; Estação 2 · O Fatiador; Estação 3 · Vale dos Vetores; Estação 4 · Praça dos Holofotes; Estação 5 · Torre das Camadas; Estação 6 · Cassino da Roleta; Estação 7 · Academia dos Pesos; Estação 8 · Biblioteca do Contexto; A grande pergunta |
| p3 | **O Laboratório** | Laboratório branco com cápsula no centro | 8: Chegada ao laboratório; Estação 1 · Biblioteca de Dados; Estação 2 · Tokenizador; Estação 3 · Forja de Treino; Estação 4 · Sala de Teste; Estação 5 · Ajuste e Alinhamento; Estação 6 · Formatura; A despedida |
| fim | **De Volta para Casa** | O quarto do NEX, de manhã | 1: A resposta |

Pelo menu **Capítulos e missões** (tela inicial, Menu ☰ ou Mapa) dá para ir direto a qualquer missão: as missões anteriores contam como feitas e as fases anteriores como concluídas; dali em diante, aquele capítulo recomeça.

**Padrão de cada missão:** entrada com cena curta → exploração → conversa com o personagem → descoberta → brincadeira ou pergunta → documento ilustrado (“E na LLM?”) → consequência no mundo (a névoa abre, a barreira apaga, a estação liga) → palavra/verbete recuperado → gancho para a próxima.

## 6. Prólogo

### 6.1 O Quarto · “Uma pergunta”

**Ambiente:** o quarto do NEX à noite, com tempestade na janela (chuva e relâmpagos sobre a cidade), cama com o gato dormindo, estante de livros, pôster, relógio, escrivaninha com computador, luminária, planta e uma bola no chão.

**Objetivo:** ir até o computador e fazer uma pergunta para a IA.

**Roteiro e diálogos:**

*Câmera passeia pelo quarto; um relâmpago ilumina tudo.*

> **NEX:** Que tempestade… Sem chance de sair hoje.
>
> **NEX:** Vou conversar com a IA. Tem uma coisa que eu sempre quis perguntar.

*🎯 Objetivo: Vá até o computador*

*NEX senta na cadeira; a tela de chat abre. Mensagem da IA: “Oi, NEX! Eu sou a Language Engine, uma IA de linguagem. Pergunte o que quiser.”*

> **NEX:** Eu converso com você todo dia… mas nunca entendi como você sabe responder.
>
> **NEX:** O que eu pergunto?
>  - *Opção “Como você funciona?”*
>  - *Opção “Você pensa como eu?”*

*NEX digita a pergunta escolhida. A IA começa a responder:*

- Se a pergunta foi “Como você funciona?”: *“Boa pergunta! Por dentro, eu funciono prevendo a próxima palavra, uma de cada vez, usando…”*
- Se foi “Você pensa como eu?”: *“Não exatamente. Por dentro, eu funciono prevendo a próxima palavra, uma de cada vez, usando…”*

*Antes do fim da frase, um raio atinge a casa: a tela falha, faíscas saem da tomada, o gato foge assustado.*

> **NEX:** AAAI! Levei um choque!
>
> **NEX:** Eu… estou encolhendo?!
>
> **Language Engine:** pró… xi… ma… pa… la…
>
> **NEX:** A tela está me puxando! AAAAH!

*Um redemoinho abre na tela, puxa papéis, a bola e o NEX, que some num clarão branco.*

### 6.2 A Language Engine · “A máquina que esqueceu”

**Ambiente:** o salão interno da Language Engine: uma máquina gigante no centro com engrenagens e telas holográficas girando, um cérebro holográfico, pedestais, cachoeiras de dados caindo das bordas, luzes correndo pelo chão em circuitos, drones de manutenção e anéis de portais no céu. Frases flutuam no ar quando a máquina acorda: “Olá.”, “Quem é você?”, “Conte uma história.”, “Explique…”, “Por quê?”, “Qual é a capital do Brasil?”, “Me ajude com…”, “O que é isso?”, “Traduza…”, “Resuma…”.

**Objetivos:** tocar na porta da máquina; depois, entrar no portal.

**Roteiro e diálogos:**

*NEX cai do alto, levanta poeira e fica tonto.*

> **NEX:** Ai… minha cabeça. Eu estava no meu quarto, perguntei uma coisa para a IA… e levei um choque.
>
> **NEX:** Que lugar é esse? Parece o lado de dentro de uma máquina.
>
> **NEX:** E aquela máquina gigante no meio… ainda tem uma luzinha acesa.
>
> **Sistema (dica na tela):** Arraste o círculo dourado para andar, ou toque no chão onde quer ir. *(no computador: “Use WASD ou as setas para andar (Shift corre). Também dá para clicar no chão.”)*

*🎯 Objetivo: Toque na porta da máquina*

*As frases surgem no ar, a máquina liga com um tremor…*

> **Language Engine:** Eu consigo responder.
>
> **Language Engine:** …
>
> **Language Engine:** Mas não consigo lembrar por quê.

*Peças da máquina se soltam e fogem pelos portais do céu. A máquina fica fraca. Num pedestal, os olhos de uma robozinha piscam e ela acorda.*

> **NOVA:** Sistema… ligado. Olá! Eu sou a NOVA, a guia desta máquina.
>
> **NEX:** Eu estava conversando com uma IA no meu computador. Teve um raio, um choque… e a tela me puxou!
>
> **NOVA:** Eu sei. Você está dentro dela: esta é a Language Engine, a LLM com quem você conversava.
>
> **NOVA:** O choque que te trouxe para cá também embaralhou a memória dela. Ela ainda consegue responder, mas esqueceu como funciona.
>
> **NOVA:** As peças que explicam como ela pensa, os Núcleos de Conhecimento, se espalharam por mundos diferentes.
>
> **NEX:** E como eu volto para casa?
>
> **NOVA:** Ajudando a máquina a se lembrar. Cada mundo guarda uma ideia: primeiro as origens, como números, regras e máquinas; depois, o que faz uma LLM escrever.
>
> **NOVA:** Quando os núcleos voltarem, ela vai funcionar direito de novo. E vai poder te devolver ao seu quarto.
>
> **NOVA:** Quer saber mais antes de ir?
>  - *Opção “O que são esses mundos?”* → **NOVA:** Cada mundo guarda uma ideia que tornou possível uma máquina de linguagem. Os primeiros são bem antigos: começam com um pastor contando ovelhas com fichinhas de barro.
>  - *Opção “Por que você me ajuda?”* → **NOVA:** Porque perguntas são o combustível desta máquina. E você parece ter muitas.
>  - *Opção “Vamos logo!”* → **NOVA:** Gosto da energia!

*Verbete do Codex: “Language Engine”. Um portal se abre.*

*🎯 Objetivo: Entre no portal*

*💬 Mensagem na tela: Bip-bop! Manutenção da Language Engine. Memória bagunçada… bip.*

## 7. Fase 1 · As Origens: O Arquivo da Memória

**Ambiente:** dentro da Engine, a parte mais antiga da memória virou um **arquipélago** flutuando num céu escuro com chuva de dados. No centro fica a **Memória Central**, uma ilha redonda com um grande cristal sobre uma base, onze pedestais em anel (um para cada lembrança), estantes de livros e rolos, linhas de luz ligando os pedestais ao núcleo e faíscas subindo. Em volta, **onze ilhas** (uma por época, cada uma com o chão e os objetos daquele tempo) ligadas por **pontes de luz** de vidro azul com postes de cristal. No meio de cada ponte ainda fechada há **névoa** que não deixa passar. A segunda lembrança é uma **vila da China antiga**, com arrozais, casas, banca do comerciante, cestos, balança e uma mesa de madeira.

**Como funciona:** em cada ilha, tocar no console desperta o eco do inventor. Ele conta a história, mostra uma imagem real, deixa um documento ilustrado e propõe uma brincadeira ou pergunta. Ao final, a Engine recupera uma palavra, o pedestal acende, as criaturinhas da ilha acordam, a palavra passa a seguir o NEX e a névoa da ponte seguinte se desfaz (a câmera mostra). A **faixa da memória** no alto (MEMÓRIA n/11) permite reler tudo.

**Ordem das ilhas:** Memória Central → Mesopotâmia (3500 a.C.) → vila da China (200 a.C.) → Bagdá (825) → França (1654) → Alemanha (1703) → Alemanha (1801) → Inglaterra (1843) → Inglaterra (1858) → Rússia (1913) → EUA (1948) → EUA (1958) → volta à Memória Central.

### 7.1 Chegada ao Arquivo

*A câmera sobrevoa as ilhas, a vila e a Memória Central. NEX cai do alto no centro do Arquivo.*

> **NEX:** Aaai! Caí de novo… Onde eu estou agora?
>
> **NOVA:** No Arquivo da Memória: a parte mais antiga da Language Engine. Olhe em volta: ilhas flutuando, presas por pontes de luz.
>
> **Language Engine:** Q-quem… está aí? Eu tenho tantas perguntas… e não lembro… das respostas.
>
> **NEX:** É a IA do meu computador! A voz dela está toda falhando.
>
> **NOVA:** O choque apagou as lembranças mais antigas dela: as ideias que vieram antes de qualquer computador.
>
> **NOVA:** Cada ilha guarda uma dessas ideias. Alguém inventou cada uma, às vezes há milhares de anos.
>
> **NOVA:** Juntas, essas ideias são a matemática que faz uma LLM funcionar. Sem elas, a Engine não consegue pensar direito.
>
> **NEX:** E como a gente devolve essas ideias para ela?
>
> **NOVA:** Em cada ilha, toque no console. O eco de quem teve a ideia vai aparecer, contar a história e deixar um documento para você ler.
>
> **NOVA:** Cada ideia que você entender vira uma palavra que a Engine volta a lembrar. E a névoa da ponte seguinte se abre.
>
> **NOVA:** Alguma pergunta antes de começar?
>  - *Opção “Quem vai aparecer?”* → **NOVA:** Escribas, matemáticos, uma condessa programadora… Gente de verdade, de lugares e séculos diferentes.
>  - *Opção “E se eu não entender?”* → **NOVA:** Os documentos têm desenhos e exemplos. E dá para reler tudo quando quiser: é só tocar na faixa da memória, lá em cima.
>  - *Opção “Quem é aquele robô?”* → **NOVA:** É o Arquivista. Ele cuida deste lugar. Se você se perder, fale com ele.
>  - *Opção “Vamos lá!”* → **NOVA:** Esse é o espírito!

> **NOVA:** A primeira ilha fica logo acima, depois da ponte: Mesopotâmia, há 5.500 anos. Dá até para ouvir ovelhas…

**Arquivista** (pode ser procurado a qualquer momento, na Memória Central):

> **Arquivista:** Bip! Um visitante! Bem-vindo ao Arquivo da Memória.
>
> **Arquivista:** Eu guardo as lembranças da Language Engine. Quer dizer… guardava. O choque espalhou tudo pelas ilhas.
>
> **NEX:** A gente vai trazer tudo de volta!
>
> **Arquivista:** Cada lembrança que voltar acende um destes pedestais. Quando os onze brilharem, a Memória Central acorda.

*Em cada conversa, conforme o progresso, ele diz uma destas falas:*

- Enquanto faltam lembranças: *“Nenhum pedestal aceso ainda… Bip. Que silêncio.”* ou *“{n} de 11 pedestais acesos. Bip-bip!”*, seguido de *“A próxima lembrança é de {ano}. Siga o marcador amarelo: ele aponta a ilha certa.”* (ou, se a próxima for a vila: *“A próxima lembrança está na vila dos arrozais, depois da primeira ilha. Procure o comerciante.”*). Depois, oferece perguntas:

> **Arquivista:** Quer saber mais alguma coisa?
>  - *Opção “Por que ilhas?”* → **Arquivista:** Cada ideia nasceu num lugar e numa época. Aqui dentro, cada uma virou uma ilha. As pontes mostram que uma ideia leva à outra.
>  - *Opção “O que é a névoa?”* → **Arquivista:** É memória apagada. Quando a Engine lembra de uma ideia, a névoa da ponte seguinte some.
>  - *Opção “As palavras me seguem!”* → **Arquivista:** São as palavras que a Engine recuperou. Elas querem voltar para a Memória Central, mas só vão quando todas estiverem juntas.
>  - *Opção “Obrigado!”* → **Arquivista:** Bip! Boa sorte, visitante.

- Com as onze lembranças de volta: *“Os onze pedestais brilham! Leve as palavras até a Memória Central, bem aqui no meio.”*
- Depois do final da fase: *“Obrigado, NEX! Agora a Engine lembra da matemática. O portal está esperando você.”*

*💬 Mensagem na tela: Guardião: Bip! Ninguém atravessa a névoa… só quem traz uma lembrança de volta.*

### 7.2 3500 a.C. · As fichas de barro (Escriba de Uruk)

**Ilha:** Uruk, Mesopotâmia (hoje, Iraque). **Objetivo:** “Desperte a memória da ilha de 3500 a.C.”.

*NEX toca no console; o eco do Escriba de Uruk aparece num holograma.*

> **Escriba de Uruk:** Olá, viajante! Eu sou um escriba de Uruk, na Mesopotâmia, há uns 5.500 anos.
>
> **Escriba de Uruk:** Ninguém guardou o meu nome… mas a ideia que a gente teve, você usa todos os dias.

*🖼️ Imagem real: **Envelope de barro e fichas de contar** — Susa (hoje no Irã), uns 5.300 anos · Museu do Louvre, Paris*

> **Escriba de Uruk:** Olhe esta foto de verdade! São fichas de contar e o envelope de barro onde elas eram guardadas, achados em Susa, outra cidade antiga da nossa região.
>
> **Escriba de Uruk:** Elas têm uns 5.300 anos e hoje ficam no Museu do Louvre, em Paris. Cada formato de ficha valia uma coisa diferente: grão, ovelha, óleo…

> **NEX:** Uma ficha para cada ovelha… É tipo contar nos dedos, só que com barro!
>
> **Escriba de Uruk:** Preparei um documento para você. Leia com calma: tem desenhos!

> 📜 **Documento: “As fichas de barro”** — há ~5.500 anos · Uruk, Mesopotâmia (hoje, Iraque)
>
> 1. **O problema** `🐑🐑🐑🐑🐑🐑🐑` — Um pastor leva 7 ovelhas para pastar. Na volta, como saber se alguma se perdeu? Ele não sabe contar até 7. Quase ninguém sabia!
> 2. **A ideia** `🐑 → 🟤` — Para cada ovelha que sai, uma fichinha de barro vai para a bolsa. Na volta, sai uma ficha para cada ovelha que entra. Sobrou ficha? Falta ovelha!
> 3. **Do barro ao número** `🟤🟤🟤 → ✍️` — Depois, em vez de guardar as fichas, os escribas passaram a desenhá-las no barro. Esses desenhos são os números escritos mais antigos que conhecemos.
> 4. **E na LLM?** `“gatinho” → [gat] [inho]` — Os arqueólogos chamam essas fichinhas de tokens. Uma LLM faz igual: corta o texto em pedacinhos e troca cada um por uma ficha, um token. Ela nunca lê letras: lê fichas!

> **Escriba de Uruk:** Antes de eu ir, me responda uma coisa.

❓ **Pergunta:** O pastor voltou e sobraram 2 fichas na bolsa. O que aconteceu?

- Ele ganhou 2 ovelhas
- ✅ Faltam 2 ovelhas
- As fichas quebraram

*Explicação:* Cada ficha representa uma ovelha. Ficha sobrando quer dizer ovelha faltando.

> **Escriba de Uruk:** Uma coisinha no lugar de outra: é assim que tudo começa.
>
> *Banner: MEMÓRIA RECUPERADA · **FICHAS** · 3500 a.C. · Escriba de Uruk*
>
> **Language Engine:** fi… chas… Eu leio… fichas.

*Verbetes do Codex desbloqueados: “Fichas (tokens)”.*

**Documento extra (missão opcional):** depois da lembrança, aparece um púlpito na ilha com o documento “Quem descobriu as fichas?”.

> 📜 **Documento: “Quem descobriu as fichas?”** — anos 1970 · Oriente Médio
>
> 1. **Milhares de bolinhas** `🔺⚪🟤` — A arqueóloga Denise Schmandt-Besserat estudou milhares de fichinhas de barro achadas no Oriente Médio. Algumas têm mais de 9.000 anos!
> 2. **Um formato para cada coisa** `🔺 grão · 🟤 ovelha` — As fichas tinham formatos diferentes para coisas diferentes: cones, esferas, discos. Cada formato representava um tipo de mercadoria.
> 3. **O envelope de barro** `🥚 + marcas` — As fichas eram guardadas em envelopes de barro. Por fora, desenhavam as fichas de dentro. Com o tempo, bastavam os desenhos: tinha nascido a escrita.

*Quando a névoa da ponte seguinte se desfaz, NOVA comenta:*

> **NOVA:** A névoa abriu! Do outro lado da ponte tem uma vila da China antiga. Parece que um comerciante tem um mistério…

### 7.3 200 a.C. · O mistério dos três grãos (Liu Hui)

**Ilha:** a vila do arroz, China antiga (há ~2.000 anos). **Missão:** “O Mistério dos Três Grãos”: como descobrir algo que nunca foi medido diretamente?

**Objetivos:** falar com o comerciante da vila → organizar os registros na mesa de madeira.

**Cenas 1 a 3: a vila, os três registros e a pergunta impossível**

> **NEX:** Uma vila! Campos de arroz para todo lado…
>
> **NOVA:** China antiga, há uns 2.000 anos. A memória da Engine guardou esta vila do jeitinho que era.
>
> **Comerciante da vila:** Bem-vindo, viajante! Aqui plantamos três tipos de arroz: o superior, o médio e o inferior.
>
> **Comerciante da vila:** Há anos fazemos essas misturas. Sabemos quanto cada mistura produz.
>
> **Comerciante da vila:** Veja os meus três registros.

> **Comerciante da vila:** Registro 1: três feixes superiores, dois médios e um inferior. A mistura foi processada e deu 39 dou.
>
> **Comerciante da vila:** Registro 2: dois superiores, três médios e um inferior: 34 dou.
>
> **Comerciante da vila:** Registro 3: um superior, dois médios e três inferiores: 26 dou.

> **NOVA:** Dou é uma medida de grãos daquela época, tipo um balde pequeno.
>
> **Comerciante da vila:** Eu sei quantos feixes coloquei em cada mistura. Também sei quanto cada mistura produziu: 39, 34 e 26.
>
> **Comerciante da vila:** Mas nunca medi um feixe sozinho.
>
> **Comerciante da vila:** Você consegue descobrir quanto produz cada tipo de arroz?
>
> **NEX:** Descobrir uma coisa que ninguém nunca mediu? Isso parece impossível…
>
> **NOVA:** Parece. Mas os registros guardam pistas. Ali na frente tem uma mesa de madeira: vamos organizar as evidências.

*Se o jogador volta ao comerciante antes de resolver:*

> **Comerciante da vila:** Os registros estão na mesa de madeira, ali na frente. Consegue descobrir quanto vale cada tipo?

**Cenas 4 a 8: a mesa de madeira** (painel interativo em etapas):

1. **A mesa de madeira** — contar os feixes de cada registro e anotar na mesa (39, 34 e 26 dou).
2. **A primeira descoberta** — olhar as duas primeiras experiências: o que existe de igual nas duas? (um feixe inferior em cada).
3. **Comparando as sobras** — sem o inferior, a primeira mistura tem um superior a mais e a segunda tem um médio a mais; a primeira produziu 5 dou a mais.
4. **Agora a matemática aparece** — conclusão: superior = médio + 5.
5. **Uma descoberta não basta** — escolher qual registro usar agora.
6. **A segunda descoberta** — pistas passo a passo: trocar o superior por “médio + 5” no registro 3 (26 − 5 = 21); separar em 3 pares médio+inferior (21 ÷ 3 = 7); voltar ao registro 1 (39 − 15 = 24; tirar um par de 7 = 17; 17 ÷ 4 = 4,25); superior = 4,25 + 5 = 9,25; inferior = 7 − 4,25 = 2,75.
7. **A mesa muda** — a tabela aparece como linhas e colunas, a futura matriz.

**Cenas 9 e 10: a revelação e a balança**

> **NOVA:** A mesa de madeira! Cada registro é uma pista. Vamos colocar tudo em ordem.

> **Comerciante da vila:** Superior, 9,25 dou. Médio, 4,25. Inferior, 2,75…
>
> **Comerciante da vila:** Mas nós nunca medimos um feixe sozinho…
>
> **NEX:** Nem precisou! A gente usou os resultados das experiências que vocês já tinham.
>
> **Comerciante da vila:** Então me diga: e se eu colocar seis feixes médios?

*Painel “A balança”: colocar seis feixes médios e prever o resultado (6 × 4,25 = 25,5 dou).*

> **Comerciante da vila:** Vinte e cinco e meio! Mas… essa mistura nunca foi feita.
>
> **Liu Hui:** Exatamente.
>
> **Liu Hui:** Você acabou de descobrir o resultado de uma experiência que nunca aconteceu.

**O eco de Liu Hui aparece** (holograma ao lado da mesa):

> **Liu Hui:** Eu sou Liu Hui. No ano 263, escrevi explicações para um livro que já era antigo: Os Nove Capítulos da Arte Matemática.
>
> **Liu Hui:** O mistério dos três grãos está nesse livro. E o jeito que você resolveu é o mesmo que os calculistas usavam, com varetas de bambu.

*🖼️ Imagem real: **Os Nove Capítulos, numa edição antiga** — Livro chinês · página de uma edição ilustrada do século XIX*

> **Liu Hui:** Não existe nenhum retrato meu. Mas olhe esta página de verdade: é de uma edição antiga dos Nove Capítulos, com desenhos para explicar os problemas.
>
> **Liu Hui:** Por quase 2.000 anos, estudantes chineses aprenderam matemática com esse livro. Repare: ele se lê em colunas, de cima para baixo e da direita para a esquerda.

> **NEX:** Esse problema tem 2.000 anos? E eu resolvi igualzinho aos calculistas?
>
> **Liu Hui:** Anotei a história deste método. Leia comigo.

> 📜 **Documento: “O mistério dos três grãos”** — há ~2.000 anos · China
>
> 1. **Um problema de 2.000 anos** `📜🌾` — O mistério dos três grãos é o primeiro problema do capítulo 8 do livro Os Nove Capítulos da Arte Matemática, escrito na China há uns 2.000 anos. Ninguém sabe quem foi o autor.
> 2. **O tabuleiro de varetas** `│││ ││ │` — Os calculistas punham cada registro numa coluna de um tabuleiro, com varetas de bambu. Varetas vermelhas eram números positivos; pretas, negativos. O lugar de cada vareta dizia o que ela era.
> 3. **Eliminar, coluna por coluna** `39 − 34 = 5` — Igual a você: tirando um registro do outro, uma incógnita some. Repetindo, sobra uma só, e as outras aparecem em seguida. Na Europa, esse método só apareceu mais de mil anos depois. Hoje ele se chama eliminação de Gauss.
> 4. **E na LLM?** `exemplos → pesos → previsão` — Uma LLM resolve um mistério parecido, só que gigante: descobre bilhões de valores escondidos (os pesos) a partir de textos que já existem. Depois usa esses valores para prever o que nunca viu: a próxima palavra.

**Cena 11: a grande ideia** (painel animado com Liu Hui narrando):

> **Liu Hui:** Três registros: 39, 34 e 26. Foi tudo o que o comerciante mediu.
>
> **Liu Hui:** Dos dados, tiramos relações. Das relações, encontramos as incógnitas. E chegamos à solução.
>
> **Liu Hui:** Quando não conseguimos observar algo diretamente, podemos usar aquilo que já sabemos para descobri-lo.
>
> **Liu Hui:** Essa ideia acompanharia a matemática por milhares de anos.
>
> **Liu Hui:** Mas o que acontece quando existem milhares de incógnitas?

*O painel mostra uma tabela de 3 incógnitas crescendo até milhares de incógnitas, e a ponte para a matriz de uma LLM.*

> **Liu Hui:** Quando não dá para medir algo diretamente, use o que você já sabe. Até mais, viajante!
>
> *Banner: MEMÓRIA RECUPERADA · **MATRIZES** · 200 a.C. · Liu Hui*
>
> **Language Engine:** ma… tri… zes. Eu guardo… o que aprendi… em matrizes.

*Verbetes do Codex desbloqueados: “Descobrir o que nunca foi medido”, “Matriz”.*

**Documento extra (missão opcional):** depois da lembrança, aparece um púlpito na ilha com o documento “Por que “matriz”?”.

> 📜 **Documento: “Por que “matriz”?”** — 1683 a 1850 · Japão, Alemanha e Inglaterra
>
> 1. **Um número que resume a tabela** `▦ → 1 número` — Sem se conhecerem, Seki Takakazu, no Japão (1683), e Leibniz, na Alemanha (1693), descobriram o determinante: uma conta com os números da tabela que diz se o problema tem uma única resposta.
> 2. **O nome** `matrix` — Em 1850, o inglês James Sylvester batizou a tabela de “matrix”, palavra latina para útero: o lugar onde algo é gerado. Para ele, dela “nasciam” os determinantes.
> 3. **E hoje** `▦▦▦` — É dessa “mãe” que nascem as respostas das IAs. Uma LLM média tem centenas de matrizes, cada uma com milhões de números.

*Quando a névoa da ponte seguinte se desfaz, NOVA comenta:*

> **NOVA:** Próxima ilha: Bagdá, no ano 825. A cidade tinha uma das maiores bibliotecas do mundo.

### 7.4 825 · O passo a passo (Al-Khwarizmi)

**Ilha:** Bagdá (hoje, Iraque). **Objetivo:** “Desperte a memória da ilha de 825”.

*NEX toca no console; o eco de Al-Khwarizmi aparece num holograma.*

> **Al-Khwarizmi:** Salam! Eu sou Muhammad al-Khwarizmi. Eu trabalhava na Casa da Sabedoria, em Bagdá, uma biblioteca cheia de sábios do mundo inteiro.
>
> **Al-Khwarizmi:** Meu nome virou uma palavra que você com certeza já ouviu. Adivinha qual?

*🖼️ Imagem real: **Selo da União Soviética, 1983** — Comemoração dos 1.200 anos de al-Khwarizmi*

> **Al-Khwarizmi:** Ninguém sabe como eu era de verdade. Este selo da União Soviética, de 1983, imaginou o meu rosto para comemorar 1.200 anos do meu nascimento.
>
> **Al-Khwarizmi:** Minha família vinha de Khwarizm, uma região que hoje fica entre o Uzbequistão e o Turcomenistão. O meu nome quer dizer “o de Khwarizm”.

> **NEX:** Al-Khwarizmi… al-go-ritmo… ALGORITMO?!
>
> **Al-Khwarizmi:** Escrevi umas páginas sobre isso. Dê uma olhada.

> 📜 **Documento: “O passo a passo”** — por volta de 825 · Bagdá (hoje, Iraque)
>
> 1. **O problema** `XLVIII + XXIV = ?` — Fazer contas era coisa de especialista. Com números como XLVIII, somar e multiplicar era um sufoco.
> 2. **A ideia** `0 1 2 3 4 5 6 7 8 9` — Escrevi um livro ensinando as contas com os algarismos que vieram da Índia, incluindo o zero. E ensinei cada conta como uma receita: passo 1, passo 2, passo 3.
> 3. **Meu nome virou palavra** `al-Khwarizmi → algoritmo` — Na Europa, meu livro foi traduzido como “Algoritmi…”. E “algoritmo” passou a querer dizer qualquer receita de passos bem definidos. Outro livro meu, Al-jabr, deu nome à álgebra.
> 4. **E na LLM?** `🔁` — Um computador só faz o que um algoritmo manda. Por dentro, uma LLM é um algoritmo enorme: os mesmos passos de conta, repetidos trilhões de vezes.

> **Al-Khwarizmi:** Minha receita da soma ficou embaralhada. Coloque os passos na ordem!

🎮 **Brincadeira: “A receita da soma”** — Com “XLVIII + XXIV” ninguém sabia por onde começar; com “48 + 24” existe uma receita. Tocar nos 4 passos da soma na ordem certa (somar unidades, “vai um”, somar dezenas, escrever o resultado).

*Ao acertar:* Pronto: 48 + 24 = 72. E a receita funciona com qualquer par de números, sem precisar de um especialista. Uma receita assim, de passos bem definidos, é um algoritmo, e é só isso que um computador sabe seguir.

> **Al-Khwarizmi:** Uma boa receita funciona sempre, com qualquer número. Isso é um algoritmo.
>
> *Banner: MEMÓRIA RECUPERADA · **PASSOS** · 825 · Al-Khwarizmi*
>
> **Language Engine:** pas… sos. Eu sigo… passos.

*Verbetes do Codex desbloqueados: “Algoritmo”.*

*Quando a névoa da ponte seguinte se desfaz, NOVA comenta:*

> **NOVA:** Agora pulamos para a França, em 1654. Estou ouvindo dados rolando…

### 7.5 1654 · Calcular a sorte (Blaise Pascal)

**Ilha:** França. **Objetivo:** “Desperte a memória da ilha de 1654”.

*NEX toca no console; o eco de Blaise Pascal aparece num holograma.*

> **Blaise Pascal:** Bonjour! Eu sou Blaise Pascal. Em 1654, um amigo que adorava apostas me fez uma pergunta difícil.
>
> **Blaise Pascal:** Escrevi para o Pierre de Fermat pedindo ajuda. Das nossas cartas nasceu uma matemática nova.

*🖼️ Imagem real: **Retrato de Blaise Pascal** — Pintura do século XVII · Palácio de Versalhes, França*

> **Blaise Pascal:** Este sou eu, numa pintura de verdade do século XVII. Hoje ela fica no Palácio de Versalhes, na França.
>
> **Blaise Pascal:** Aos 19 anos, inventei uma máquina de somar com rodas dentadas, a Pascalina, para ajudar o meu pai, que fazia contas de impostos o dia inteiro.

> **NEX:** Matemática de apostas? Agora fiquei curioso.
>
> **Blaise Pascal:** Preparei um documento para você. Leia com calma: tem desenhos!

> 📜 **Documento: “Calcular a sorte”** — 1654 · França
>
> 1. **O problema** `🎲🎲  ⏸️  💰 ?` — Dois amigos apostam num jogo de dados, mas precisam parar no meio. Dar tudo para quem tem mais pontos não é justo. Como dividir o dinheiro?
> 2. **A ideia** `✉️ ⇄ ✉️` — Nas cartas, eu e Fermat listamos tudo o que ainda poderia acontecer e contamos em quantos casos cada um ganharia.
> 3. **Nasce a probabilidade** `3 em 4 = 75%` — Assim, o dinheiro se divide pelas chances de cada um. Pela primeira vez, alguém fez contas com um futuro incerto: é a probabilidade.
> 4. **E na LLM?** `azul 62% · escuro 21% · …` — Uma LLM nunca tem certeza da próxima palavra. Ela calcula a chance de cada palavra possível e escolhe com base nisso.

> **Blaise Pascal:** Vamos jogar dois dados milhares de vezes. Antes, aposte: qual soma sai mais?

🎮 **Brincadeira: “Dois dados, milhares de vezes”** — Apostar em qual soma de dois dados sai mais vezes e jogar os dados 3.600 vezes, vendo o gráfico crescer.

*Ao acertar:* O 7 tem 6 jeitos de sair (1+6, 2+5, 3+4, 4+3, 5+2, 6+1). O 2 e o 12 só têm 1 jeito cada. Ninguém sabe o próximo lance, mas a chance dá para calcular: o 7 sai em 6 de 36 casos, uns 17%. Isso é probabilidade.

> **Blaise Pascal:** Não dá para saber o próximo lance. Mas dá para saber as chances.
>
> *Banner: MEMÓRIA RECUPERADA · **CHANCES** · 1654 · Blaise Pascal*
>
> **Language Engine:** chan… ces. Cada palavra… tem uma chance.

*Verbetes do Codex desbloqueados: “Probabilidade”.*

**Documento extra (missão opcional):** depois da lembrança, aparece um púlpito na ilha com o documento “O triângulo de Pascal”.

> 📜 **Documento: “O triângulo de Pascal”** — 1654 · França (e antes, China e Pérsia)
>
> 1. **Um triângulo de números** `1 · 1 1 · 1 2 1 · 1 3 3 1` — Cada número é a soma dos dois de cima. Parece brincadeira, mas ele conta de quantos jeitos as coisas podem acontecer.
> 2. **Moedas** `🪙🪙🪙` — Jogando 3 moedas, a linha 1 3 3 1 diz: 1 jeito de dar 3 caras, 3 jeitos de dar 2, 3 jeitos de dar 1 e 1 jeito de não dar nenhuma.
> 3. **Mais antigo que o Pascal** `🌏` — Matemáticos chineses e persas já conheciam esse triângulo séculos antes. Pascal o estudou tão bem que ele ficou com o nome dele.

*Quando a névoa da ponte seguinte se desfaz, NOVA comenta:*

> **NOVA:** Alemanha, 1703. Um filósofo que inventava máquinas de calcular está nos esperando.

### 7.6 1703 · Tudo com 0 e 1 (Gottfried Leibniz)

**Ilha:** Alemanha. **Objetivo:** “Desperte a memória da ilha de 1703”.

*NEX toca no console; o eco de Gottfried Leibniz aparece num holograma.*

> **Gottfried Leibniz:** Guten Tag! Eu sou Gottfried Leibniz. Eu adorava máquinas de calcular e tive uma ideia que pareceu maluca.
>
> **Gottfried Leibniz:** E se, em vez de dez algarismos, a gente usasse só dois?

*🖼️ Imagem real: **Retrato de Gottfried Leibniz** — Christoph Bernhard Francke, por volta de 1695 · Braunschweig, Alemanha*

> **Gottfried Leibniz:** Este sou eu, pintado por volta de 1695 por Christoph Bernhard Francke. O quadro está num museu de Braunschweig, na Alemanha.
>
> **Gottfried Leibniz:** Repare na peruca enorme e cacheada: era a moda dos homens importantes da época! E eu também construí uma máquina que fazia as quatro operações.

> **NEX:** Só dois? Como é que dá para escrever 100 com dois algarismos?
>
> **Gottfried Leibniz:** Está tudo anotado aqui. Leia comigo.

> 📜 **Documento: “Tudo com 0 e 1”** — 1703 · Alemanha
>
> 1. **O problema** `🖐️🖐️ = 10` — Contamos com dez algarismos porque temos dez dedos. Mas uma máquina não tem dedos. Dá para contar com menos?
> 2. **A ideia** `8 4 2 1 → 0101 = 5` — Publiquei o sistema binário: só 0 e 1. Cada casa vale o dobro da anterior: 1, 2, 4, 8… O número 5 vira 101: um 4, nenhum 2 e um 1.
> 3. **Um sim ou um não** `💡 = 1 · ⚫ = 0` — 0 e 1 podem ser desligado e ligado, não e sim. Em 1854, George Boole mostrou que até o raciocínio lógico (E, OU, NÃO) pode ser feito com 0 e 1.
> 4. **E na LLM?** `01001100 01001100 01001101` — Todo computador guarda tudo em 0 e 1: textos, fotos, músicas e os bilhões de números da própria LLM.

> **Gottfried Leibniz:** Acenda as lâmpadas certas para escrever cada número só com 0 e 1.

🎮 **Brincadeira: “Lâmpadas que contam”** — Cada lâmpada vale o dobro da vizinha (8, 4, 2, 1). Acender as lâmpadas certas para escrever o número 13.

*Ao acertar:* 13 = 1101: um 8, um 4, nenhum 2 e um 1. Com 4 lâmpadas dá para escrever de 0 a 15; com mais lâmpadas, qualquer número. Ligado ou desligado, 1 ou 0: é assim que o computador guarda tudo.

> **Gottfried Leibniz:** Com só dois símbolos, dá para escrever qualquer número. As máquinas agradecem.
>
> *Banner: MEMÓRIA RECUPERADA · **ZERO E UM** · 1703 · Gottfried Leibniz*
>
> **Language Engine:** ze… ro e um. Por dentro… só zero e um.

*Verbetes do Codex desbloqueados: “Binário”.*

*Quando a névoa da ponte seguinte se desfaz, NOVA comenta:*

> **NOVA:** Próxima ilha: 1801. Olhe o telescópio! Alguém perdeu uma coisa no céu.

### 7.7 1801 · O menor erro (Carl Friedrich Gauss)

**Ilha:** Alemanha. **Objetivo:** “Desperte a memória da ilha de 1801”.

*NEX toca no console; o eco de Carl Friedrich Gauss aparece num holograma.*

> **Carl Friedrich Gauss:** Hallo! Eu sou Carl Friedrich Gauss. Em 1801, os astrônomos perderam um asteroide de vista.
>
> **Carl Friedrich Gauss:** Eu tinha 24 anos e encontrei ele com papel, lápis e uma ideia: errar o menos possível.

*🖼️ Imagem real: **Retrato de Carl Friedrich Gauss** — Christian Albrecht Jensen, 1840 (cópia de 1887)*

> **Carl Friedrich Gauss:** Este sou eu, com uns 63 anos, num retrato do pintor dinamarquês Christian Albrecht Jensen, de 1840.
>
> **Carl Friedrich Gauss:** Viu o gorro preto de veludo? Eu usava sempre. Este retrato ficou tão famoso que foi parar na nota de 10 marcos da Alemanha.

> **NEX:** Achar um asteroide com lápis e papel? Sem computador nenhum?
>
> **Carl Friedrich Gauss:** Escrevi umas páginas sobre isso. Dê uma olhada.

> 📜 **Documento: “O menor erro”** — 1801 a 1809 · Alemanha
>
> 1. **O problema** `✦ ·  ✦ · ✦` — O asteroide Ceres foi visto por poucas semanas e sumiu no brilho do Sol. As medições que sobraram eram poucas, e todas um pouco erradas.
> 2. **Testar caminhos** `📏` — Para cada caminho possível, medi a distância até cada ponto observado: esse é o erro. Caminho ruim, erro grande.
> 3. **O caminho que erra menos** `🎯` — Fiquei com o caminho de menor erro total: o método dos mínimos quadrados. Meses depois, Ceres reapareceu bem onde eu tinha previsto!
> 4. **E na LLM?** `⛰️ ↘ ↘ ↘` — Treinar uma LLM é a mesma ideia, em tamanho gigante: ajustar os números dela, um pouquinho de cada vez, até o erro ficar o menor possível.

> **Carl Friedrich Gauss:** Ajuste a linha para passar o mais perto possível de todas as observações.

🎮 **Brincadeira: “Onde está Ceres?”** — As estrelinhas são as medições do asteroide Ceres (todas um pouco erradas). Mexer na linha para passar o mais perto possível de todas, deixando as linhas vermelhas curtinhas.

*Ao acertar:* Ceres reapareceu bem onde a linha apontava! Esse é o caminho que erra menos: o método dos mínimos quadrados. Treinar uma LLM é parecido: o computador ajusta bilhões de números, um pouquinho de cada vez, sempre para o lado que diminui o erro.

> **Carl Friedrich Gauss:** Ninguém acerta tudo. O segredo é errar cada vez menos.
>
> *Banner: MEMÓRIA RECUPERADA · **MENOR ERRO** · 1801 · Carl Friedrich Gauss*
>
> **Language Engine:** erro… menor. Eu aprendi… errando cada vez menos.

*Verbetes do Codex desbloqueados: “O menor erro”.*

*Quando a névoa da ponte seguinte se desfaz, NOVA comenta:*

> **NOVA:** Inglaterra, 1843. Engrenagens, vapor e cartões cheios de furinhos…

### 7.8 1843 · A máquina dos símbolos (Ada Lovelace)

**Ilha:** Inglaterra. **Objetivo:** “Desperte a memória da ilha de 1843”.

*NEX toca no console; o eco de Ada Lovelace aparece num holograma.*

> **Ada Lovelace:** Olá! Eu sou Ada Lovelace. Meu amigo Charles Babbage projetou uma máquina de calcular gigante, a Máquina Analítica.
>
> **Ada Lovelace:** Eu enxerguei nela uma coisa que nem ele tinha visto.

*🖼️ Imagem real: **Retrato de Ada Lovelace** — Alfred Edward Chalon, por volta de 1840 · Museu de Ciências, Londres*

> **Ada Lovelace:** Esta sou eu, por volta de 1840, numa aquarela do pintor Alfred Edward Chalon. Hoje ela fica no Museu de Ciências de Londres.
>
> **Ada Lovelace:** Sabia que o meu pai era o poeta Lord Byron? Eu juntava imaginação e matemática. Chamava isso de “ciência poética”.

> **NEX:** O primeiro programa foi escrito por uma mulher, em 1843? Que demais!
>
> **Ada Lovelace:** Preparei um documento para você. Leia com calma: tem desenhos!

> 📜 **Documento: “A máquina dos símbolos”** — 1843 · Inglaterra
>
> 1. **A máquina** `⚙️ + 🃏` — A Máquina Analítica seria toda de engrenagens e leria cartões perfurados, como os teares que teciam desenhos. Os furos diziam o que fazer, passo a passo.
> 2. **O primeiro programa** `🃏🃏🃏` — Em 1843, escrevi notas sobre a máquina. Numa delas, montei uma sequência de passos para ela calcular números difíceis. Muita gente considera esse o primeiro programa de computador.
> 3. **Mais que contas** `🎵 = 🔢` — E percebi algo maior: se letras ou notas musicais virassem números, a máquina poderia trabalhar com elas também. Ela poderia até compor música!
> 4. **E na LLM?** `palavras → números → palavras` — Foi o que aconteceu: palavras viram números, e uma máquina de contas escreve textos. Eu imaginei isso uns 180 anos antes.

> **Ada Lovelace:** Antes de eu ir, me responda uma coisa.

❓ **Pergunta:** Qual foi a grande ideia da Ada?

- A máquina só serve para somar
- ✅ Se símbolos virarem números, a máquina pode trabalhar com eles
- As máquinas pensam como pessoas

*Explicação:* Letras, notas e palavras podem virar números. É assim que uma máquina de contas consegue escrever.

> **Ada Lovelace:** Uma máquina não sabe o que é música. Mas, com números, ela pode tocar.
>
> *Banner: MEMÓRIA RECUPERADA · **SÍMBOLOS** · 1843 · Ada Lovelace*
>
> **Language Engine:** sím… bolos. Eu mexo com símbolos… não só com números.

*Verbetes do Codex desbloqueados: “Programa”.*

**Documento extra (missão opcional):** depois da lembrança, aparece um púlpito na ilha com o documento “Babbage e suas máquinas”.

> 📜 **Documento: “Babbage e suas máquinas”** — 1822 a 1871 · Inglaterra
>
> 1. **A Máquina Diferencial** `⚙️⚙️⚙️` — Charles Babbage projetou primeiro a Máquina Diferencial, feita para calcular tabelas de números sem erro, só girando uma manivela.
> 2. **Nunca terminada** `🛠️` — Faltou dinheiro e precisão nas peças. Babbage morreu em 1871 sem ver suas máquinas prontas.
> 3. **Funcionava!** `✅` — Em 1991, o Museu de Ciências de Londres construiu a Máquina Diferencial nº 2 seguindo os desenhos dele. E ela funcionou!

*Quando a névoa da ponte seguinte se desfaz, NOVA comenta:*

> **NOVA:** Ainda na Inglaterra, 1858. Lembra das tabelas do mistério dos três grãos? Agora alguém quer multiplicar matrizes inteiras.

### 7.9 1858 · Multiplicar tabelas (Arthur Cayley)

**Ilha:** Inglaterra. **Objetivo:** “Desperte a memória da ilha de 1858”.

*NEX toca no console; o eco de Arthur Cayley aparece num holograma.*

> **Arthur Cayley:** Bom dia! Eu sou Arthur Cayley. Meu amigo Sylvester tinha dado às tabelas de números o nome de matriz.
>
> **Arthur Cayley:** Eu resolvi tratá-las como se fossem números de verdade: somar, multiplicar…

*🖼️ Imagem real: **Retrato de Arthur Cayley** — Foto do século XIX*

> **Arthur Cayley:** Esta é uma imagem minha de verdade, do século XIX.
>
> **Arthur Cayley:** Antes de virar professor em Cambridge, eu trabalhei 14 anos como advogado. Nas horas vagas, escrevi centenas de artigos de matemática!

> **NEX:** Multiplicar uma tabela inteira? Isso parece trabalhoso…
>
> **Arthur Cayley:** Está tudo anotado aqui. Leia comigo.

> 📜 **Documento: “Multiplicar tabelas”** — 1858 · Inglaterra
>
> 1. **A pergunta** `▦ × ▦ = ?` — Dá para somar e multiplicar dois números. E duas tabelas inteiras? Em 1858, escrevi as regras para fazer contas com matrizes.
> 2. **Linha encontra coluna** `[1 2] · [3 4] = 1·3 + 2·4 = 11` — Para multiplicar, uma linha encontra uma coluna: multiplica par por par e soma tudo. Dá trabalho, mas é sempre a mesma receita.
> 3. **Transformar** `↗ ⟲ ↖` — Uma matriz multiplicando uma lista de números (um vetor) pode girar, esticar ou espelhar uma figura. A matriz vira uma máquina de transformar.
> 4. **E na LLM?** `× × × trilhões` — Multiplicar matrizes é o que uma LLM mais faz: são trilhões de multiplicações para escrever uma resposta. Por isso ela usa placas de vídeo, que fazem isso muito rápido.

> **Arthur Cayley:** Escolha a matriz que leva a seta até a estrela.

🎮 **Brincadeira: “A matriz que transforma”** — A seta é o vetor (2, 1). Escolher a matriz que, multiplicada pela seta, leva a ponta até a estrela.

*Ao acertar:* Girou 90° e chegou na estrela! Cada número novo nasce de uma linha encontrando a coluna: multiplica par por par e soma tudo. Uma LLM faz isso trilhões de vezes para escrever uma resposta.

> **Arthur Cayley:** Uma matriz não é só uma tabela parada: ela transforma.
>
> *Banner: MEMÓRIA RECUPERADA · **MULTIPLICAR** · 1858 · Arthur Cayley*
>
> **Language Engine:** multi… plicar. Eu multiplico… matrizes.

*Verbetes do Codex desbloqueados: “Matriz × Vetor”, “Vetor”.*

*Quando a névoa da ponte seguinte se desfaz, NOVA comenta:*

> **NOVA:** Rússia, 1913. Um matemático está contando letras de um poema. Uma por uma.

### 7.10 1913 · O que vem depois? (Andrei Markov)

**Ilha:** Rússia. **Objetivo:** “Desperte a memória da ilha de 1913”.

*NEX toca no console; o eco de Andrei Markov aparece num holograma.*

> **Andrei Markov:** Zdravstvuyte! Eu sou Andrei Markov. Em 1913, peguei um poema famoso e contei as letras dele, uma por uma.
>
> **Andrei Markov:** Vinte mil letras! Os meus alunos acharam que eu tinha ficado louco.

*🖼️ Imagem real: **Retrato de Andrei Markov** — Foto antiga · São Petersburgo, Rússia*

> **Andrei Markov:** Esta é uma foto minha de verdade. Eu dava aulas na Universidade de São Petersburgo, na Rússia.
>
> **Andrei Markov:** Eu tinha fama de teimoso e briguento! Mas foi contando letras, com muita paciência, que eu descobri as cadeias que levam o meu nome.

> **NEX:** Contar vinte mil letras na mão? Eu desistiria na décima!
>
> **Andrei Markov:** Escrevi umas páginas sobre isso. Dê uma olhada.

> 📜 **Documento: “O que vem depois?”** — 1913 · Rússia
>
> 1. **O problema** `a ? ? ?` — Será que as letras de um texto aparecem por acaso? Ou a letra de antes ajuda a adivinhar a próxima?
> 2. **Contar, letra por letra** `🟡 → 🔵 ?` — Peguei 20 mil letras do poema Eugênio Oneguin. Depois de cada vogal, anotei o que vinha: outra vogal ou uma consoante.
> 3. **Apareceu um padrão** `87 em 100` — Depois de uma vogal, vinha consoante 87 vezes em cada 100! A letra de antes ajuda, e muito, a prever a próxima. Isso virou a cadeia de Markov.
> 4. **E na LLM?** `O céu é ___` — Troque letras por palavras e um poema por bilhões de textos: prever o que vem depois é o coração de toda LLM.

> **Andrei Markov:** Conte comigo: nestas frases, o que vem depois de “é”?

🎮 **Brincadeira: “Contando o que vem depois”** — Tocar na palavra que vem depois de “é” em seis frases, para contar; depois completar “O céu é…” com a palavra mais provável.

*Ao acertar:* Depois de “é”, veio “azul” 4 vezes em 6: uns 67%. Por isso a aposta é “azul”, mesmo que “escura” também possa aparecer. Markov fez isso com letras; uma LLM faz com palavras, olhando muito mais do que só a palavra de antes. Prever a próxima palavra pelas contagens: esse é o coração de uma LLM.

> **Andrei Markov:** O passado ajuda a prever o futuro. Pelo menos nos textos!
>
> *Banner: MEMÓRIA RECUPERADA · **PRÓXIMA PALAVRA** · 1913 · Andrei Markov*
>
> **Language Engine:** pró… xima. Eu prevejo… o que vem depois.

*Verbetes do Codex desbloqueados: “Cadeia de Markov”.*

*Quando a névoa da ponte seguinte se desfaz, NOVA comenta:*

> **NOVA:** Estados Unidos, 1948. A era dos telefones e dos primeiros computadores.

### 7.11 1948 · O bit (Claude Shannon)

**Ilha:** Estados Unidos. **Objetivo:** “Desperte a memória da ilha de 1948”.

*NEX toca no console; o eco de Claude Shannon aparece num holograma.*

> **Claude Shannon:** E aí! Eu sou Claude Shannon. Eu gostava de malabares, de monociclo… e de uma pergunta: quanta informação cabe numa mensagem?
>
> **Claude Shannon:** Vamos jogar um jogo. Já já você vai entender o que é um bit.

*🖼️ Imagem real: **Claude Shannon** — Foto do acervo do Instituto de Matemática de Oberwolfach, Alemanha*

> **Claude Shannon:** Esta é uma foto minha de verdade, tirada pelo matemático alemão Konrad Jacobs.
>
> **Claude Shannon:** Na minha casa eu tinha uma oficina cheia de invenções malucas: um rato mecânico que achava a saída de um labirinto e até máquinas que faziam malabares!

> **NEX:** Monociclo e matemática? Gostei desse cara.
>
> **Claude Shannon:** Preparei um documento para você. Leia com calma: tem desenhos!

> 📜 **Documento: “O bit”** — 1948 · Estados Unidos
>
> 1. **A pergunta** `📞 ✉️ 📻` — Telefone, telégrafo, rádio: todos levam mensagens. Mas como medir a informação? Quanto “pesa” uma mensagem?
> 2. **O bit** `❓❓❓❓ = 4 bits` — Em 1948, mostrei que toda informação pode ser medida em respostas de sim ou não. Cada resposta é um bit. Para achar 1 número entre 16, bastam 4 perguntas: 4 bits.
> 3. **Texto vira número** `N E X = 78 69 88` — Qualquer letra pode virar um número, e qualquer número vira bits. Em 1963, o código ASCII deu um número para cada letra: A é 65, B é 66…
> 4. **E na LLM?** `O c é u _ ?` — Em 1951, eu brinquei de adivinhar a próxima letra de frases, para medir quanta informação o texto tem. Setenta anos depois, as LLMs jogam esse mesmo jogo, com palavras.

> **Claude Shannon:** Pensei num número de 1 a 16. Descubra com perguntas de sim ou não.

🎮 **Brincadeira: “Sim ou não?”** — Adivinhar o número secreto de 1 a 16 perguntando “É maior que…?”. Com 4 perguntas de sim ou não (4 bits) sempre dá.

*Ao acertar:* 4 perguntas de sim ou não: 4 bits. Cada bit é a resposta a uma dessas perguntas.

> **Claude Shannon:** Sim ou não, 1 ou 0: é assim que a informação viaja.
>
> *Banner: MEMÓRIA RECUPERADA · **BITS** · 1948 · Claude Shannon*
>
> **Language Engine:** bits. Cada letra… vira número.

*Verbetes do Codex desbloqueados: “Bit”, “Texto em números”.*

*Quando a névoa da ponte seguinte se desfaz, NOVA comenta:*

> **NOVA:** A última ilha: 1958. Uma máquina que aprende está piscando do outro lado da ponte!

### 7.12 1958 · O neurônio que aprende (Frank Rosenblatt)

**Ilha:** Estados Unidos. **Objetivo:** “Desperte a memória da ilha de 1958”.

*NEX toca no console; o eco de Frank Rosenblatt aparece num holograma.*

> **Frank Rosenblatt:** Olá! Eu sou Frank Rosenblatt. Em 1958, construí o Perceptron, uma máquina que aprendia.
>
> **Frank Rosenblatt:** Ela não seguia regras escritas por alguém: aprendia com os próprios erros.

*🖼️ Imagem real: **Neurônios desenhados à mão** — Santiago Ramón y Cajal, 1899 · cérebro de um pombo*

> **NOVA:** Não achamos uma foto do Rosenblatt que possa ser mostrada aqui. Mas olhe esta imagem de verdade: neurônios do cérebro de um pombo, desenhados à mão pelo espanhol Santiago Ramón y Cajal, em 1899.
>
> **Frank Rosenblatt:** Foi pensando em neurônios assim que eu imaginei uma máquina que aprende. Cada galhinho recebe um sinal, e a célula decide se dispara ou não.

> **NEX:** Uma máquina que aprende sozinha… isso já parece IA de verdade!
>
> **Frank Rosenblatt:** Está tudo anotado aqui. Leia comigo.

> 📜 **Documento: “O neurônio que aprende”** — 1943 e 1958 · Estados Unidos
>
> 1. **O problema** `🐱 ? 🐶 ?` — Como ensinar uma máquina a reconhecer um gato? Escrever uma regra para cada caso nunca acaba: toda regra tem exceção.
> 2. **O neurônio de mentira** `pista × peso → soma → 💡` — Em 1943, McCulloch e Pitts imaginaram um neurônio feito de contas: cada pista tem um peso. Ele soma os pesos das pistas presentes e, se passar de um limite, acende.
> 3. **Aprender errando** `❌ → ⚖️ → ✅` — O Perceptron errava e corrigia os pesos. Viu um cachorro e disse “gato”? A pista “late” passa a contar contra. Na próxima, ele acerta.
> 4. **E na LLM?** `3 pesos → bilhões` — Os números ajustados de uma LLM se chamam pesos, igual aos do Perceptron. A diferença é a quantidade: em vez de 3, são bilhões.

> **Frank Rosenblatt:** Meu neurônio está confundindo bichos. Ajuste os pesos até ele acertar todos.

🎮 **Brincadeira: “Treine o neurônio”** — O neurônio soma os pesos das pistas do bicho (tem bigodes, late, mia). Se der 2 ou mais, ele acende: “É gato!”. Ajustar os pesos até acertar gato, cachorro, foca e papagaio.

*Ao acertar:* Todos certos! Ninguém escreveu a regra “gato tem bigode e mia”: você só ajustou os pesos olhando os erros. O Perceptron fazia esses ajustes sozinho. Uma LLM faz o mesmo, com bilhões de pesos.

> **Frank Rosenblatt:** Ninguém disse à máquina o que é um gato. Ela ajustou os pesos até acertar.
>
> *Banner: MEMÓRIA RECUPERADA · **PESOS** · 1958 · Frank Rosenblatt*
>
> **Language Engine:** pe… sos. Bilhões de pesos… dentro de mim.

*Verbetes do Codex desbloqueados: “Neurônio artificial”.*

### 7.13 A Memória Central

**Objetivo:** “Leve as palavras até a Memória Central”.

> **NOVA:** Todas as memórias voltaram! As palavras estão seguindo você. Vamos levá-las até a Memória Central, no meio do arquivo.

*As palavras que seguiam o NEX voam para o cristal, que acende em azul.*

> **Language Engine:** Onze memórias… voltando todas juntas. Esperem…
>
> **Language Engine:** Eu me lembro! Eu leio fichas e transformo tudo em números, em zeros e uns.
>
> **Language Engine:** Guardo o que aprendi em matrizes de pesos, ajustados para errar cada vez menos.
>
> **Language Engine:** Multiplico matrizes, passo a passo, e escolho a próxima palavra pelas chances.
>
> **NEX:** Ela falou sem engasgar nenhuma vez!
>
> **Arquivista:** Bip! Os onze pedestais acesos! O arquivo nunca esteve tão arrumado.
>
> **NOVA:** Vamos testar. NEX, comece uma frase para ela completar.
>
> **NOVA:** Diga o começo:
>  - *Opção “O céu é…”*
>
> **Language Engine:** Vou mostrar o que acontece dentro de mim, passo a passo.

**Painel “Como eu escrevo ‘O céu é ___’” (7 passos dentro da Engine):**

1. `[O] [céu] [é]` — A frase é cortada em fichas: os tokens. *(palavras: FICHAS)*
2. `46 · 3121 · 518` — Cada ficha vira um número. E todo número vira zeros e uns, que a máquina guarda. *(palavras: SÍMBOLOS, BITS, ZERO E UM)*
3. `[0,2  −1,3  0,7 …]` — Cada número puxa uma linha de uma matriz gigante: uma lista de números para cada ficha. *(palavras: MATRIZES)*
4. `▦ × ▦ × ▦ …` — Essas listas atravessam matrizes, multiplicação após multiplicação, sempre nos mesmos passos. *(palavras: MULTIPLICAR, PASSOS)*
5. `bilhões de pesos` — Os números dessas matrizes são pesos, ajustados no treino para errar cada vez menos. *(palavras: PESOS, MENOR ERRO)*
6. `azul 62% · escuro 21% · bonito 12%` — No fim, sai uma chance para cada palavra possível. *(palavras: CHANCES)*
7. `O céu é azul` — A Engine escolhe uma palavra… e repete tudo para a próxima. *(palavras: PRÓXIMA PALAVRA)*

> **Language Engine:** “O céu é azul.” Uma palavra de cada vez. Eu lembro como eu escrevo!
>
> **NEX:** Então é isso? Fichas, números, matrizes, pesos e chances?
>
> **NOVA:** Essa é a matemática por trás de toda LLM. Ninguém inventou tudo de uma vez: foram milhares de anos de ideias, uma em cima da outra.

*✨ Núcleo recuperado: **MATRIX CORE***

> **NOVA:** A Language Engine recuperou o primeiro núcleo! Você terminou a Fase 1: As Origens.
>
> **NEX:** E agora? Ainda estou pequeno e preso aqui dentro.
>
> **Language Engine:** Eu lembro da matemática… mas não lembro como eu uso. Como eu corto uma frase em pedaços? Como eu adivinho a próxima palavra?
>
> **NOVA:** Do outro lado do portal fica o coração da Engine: a fábrica onde as palavras viram números e a próxima palavra é escolhida.

*Verbete do Codex: “Como a LLM junta tudo”. Um portal lilás se abre na Memória Central.* **Objetivo:** “Atravesse o portal para a Fase 2”.

## 8. Fase 2 · Dentro da LLM: A Fábrica de Previsões

**Ambiente:** o coração da Engine é uma fábrica flutuando no espaço de dados: nove salas (3×3) com paredes de metal e faixas de luz na cor de cada estação. No meio fica a **Sala do Prompt**, com a máquina onde chegou a pergunta (tela com o texto, oito luzes, uma por estação). As salas se ligam por **corredores com esteira** no meio (pisar nela leva o NEX no sentido da visita) e **barreiras de energia** que só se apagam quando a estação anterior volta a funcionar. Atalhos de volta para a Sala do Prompt abrem ao longo da fase.

**Como funciona:** em cada estação, um robô explica sua parte do trabalho, propõe uma brincadeira, entrega um documento de 4 páginas e a estação “liga” (faixa **ESTAÇÕES n/8**, banner ESTAÇÃO CONCLUÍDA). Depois do Fatiador, os sete tokens da pergunta seguem o NEX.

**Ordem:** Sala do Prompt → 1. Oficina do Adivinho → 2. O Fatiador → 3. Vale dos Vetores → 4. Praça dos Holofotes → 5. Torre das Camadas → 6. Cassino da Roleta → 7. Academia dos Pesos → 8. Biblioteca do Contexto → Sala do Prompt.

### 8.1 Chegada à fábrica

*A câmera sobrevoa as salas. NEX cai na Sala do Prompt.*

> **NEX:** Uau… que barulho é esse? Parece uma fábrica!
>
> **NOVA:** É o coração da Language Engine: a Fábrica de Previsões. É aqui que ela transforma uma pergunta em resposta.
>
> **Language Engine:** Chegou… uma pergunta. “Qual é a capital do Brasil?” Eu sei que sei… mas não lembro como eu faço.
>
> **NOVA:** A fábrica tem oito estações. Em cada uma, um robô cuida de uma parte do trabalho. O choque deixou todas desligadas.
>
> **NOVA:** Ajude cada robô e aprenda o que ele faz. Cada estação religada apaga a barreira do corredor seguinte.
>
> **NEX:** E no fim, a Engine responde a pergunta?
>
> **NOVA:** Se tudo voltar a funcionar, sim! Quer saber mais alguma coisa?
>  - *Opção “O que são essas esteiras?”* → **NOVA:** Elas levam as palavras de uma estação para a outra. Pise nelas para andar mais rápido!
>  - *Opção “O que é uma LLM, mesmo?”* → **NOVA:** Um modelo de linguagem grande: um programa que aprendeu, com muito texto, a prever a próxima palavra. A Engine é uma LLM.
>  - *Opção “Vamos lá!”* → **NOVA:** Primeira parada: a Oficina do Adivinho, subindo a esteira!

*Ao tocar na máquina do prompt antes do fim:*

> **Language Engine:** A pergunta está aqui: “Qual é a capital do Brasil?”. {n} de 8 estações funcionando… ainda não consigo responder.

### 8.2 Estação 1 · Oficina do Adivinho (Prof. Adivinho)

**Ambiente:** Oficina de madeira com um livro gigante aberto (as 8 frases), quadro-negro com pauzinhos de contagem, estantes, escrivaninha e palavras que pulam pelo chão (“famoso”, “pelo”, “samba”).

**Objetivo:** “Fale com o Prof. Adivinho”.

> **Prof. Adivinho:** Ah, visitantes! Bem-vindos à Oficina do Adivinho, a primeira estação da fábrica.
>
> **Prof. Adivinho:** Aqui dentro só existe um trabalho: adivinhar a próxima palavra. Toda resposta da Engine é feita assim, uma palavra de cada vez.
>
> **NEX:** Só isso? Achei que ela pensasse a frase inteira de uma vez!
>
> **Prof. Adivinho:** Ninguém aqui pensa a frase inteira. A gente olha o que já foi escrito e chuta o que vem depois. Mas não é chute cego: é chute contado!
>
> **Prof. Adivinho:** Aquele livro gigante tem oito frases. Minha máquina conta quem vem depois de quem.
>
> **Prof. Adivinho:** Vamos jogar: você contra a minha máquina de contar. Quem adivinha melhor a próxima palavra?

🎮 **Brincadeira: “Você contra a máquina de contar”** — 3 rodadas contra a máquina de contar, que olha só a última palavra e escolhe o que mais vem depois dela no livro. Rodada 1: “O Brasil é famoso pelo ___” (futebol ou samba); rodada 2: “A capital do ___” (Brasil); rodada 3: “A capital do Brasil é ___” — a máquina escolhe “uma” (38%, porque depois de “é” no livro vem “uma” 3 vezes), e o jogador precisa escolher “Brasília”. As frases do livro: “A capital do Brasil é Brasília.”, “A capital da França é Paris.”, “A capital da Itália é Roma.”, “O Brasil é famoso pelo futebol.”, “O Brasil é famoso pelo samba.”, “Brasília é uma cidade planejada.”, “Paris é uma cidade linda.”, “O futebol é uma paixão.”

> **NEX:** A máquina errou a última porque só olhou para o “é”!
>
> **Prof. Adivinho:** Exato! Contar ajuda muito, mas para acertar é preciso olhar a frase inteira. Guarde isso: lá na Praça dos Holofotes você vai ver como a Engine faz.

> 📜 **Documento: “Prever a próxima palavra”** — Estação 1 · Dentro da LLM
>
> 1. **Um jogo de adivinhar** `🔮` — Uma LLM escreve como quem joga: olha o que já está escrito e escolhe a próxima palavra. Depois repete, palavra por palavra, até terminar.
> 2. **Contar ajuda a chutar** `📊` — Se depois de “famoso pelo” costuma vir “futebol” ou “samba”, essas palavras ganham mais chance. Contar o que vem depois é a ideia de Markov, lá da Fase 1.
> 3. **Só a última palavra não basta** `🧩` — Olhando só o “é”, a máquina chutou “uma”. Para acertar “Brasília”, é preciso olhar “capital” e “Brasil”. As LLMs de hoje olham tudo o que veio antes.
> 4. **E na LLM?** `🤖` — Uma LLM aprendeu com bilhões de frases. Para cada palavra possível, ela calcula uma chance. A palavra escolhida entra no texto e o jogo recomeça.

*Banner: ESTAÇÃO CONCLUÍDA · **PREVER** · Estação 1 · Oficina do Adivinho*

> **Language Engine:** pre… ver. Eu escrevo… uma palavra de cada vez.

*Verbetes do Codex: “Prever a próxima palavra”. A barreira do corredor seguinte se apaga.*

### 8.3 Estação 2 · O Fatiador (Tesourinha)

**Ambiente:** Sala de metal avermelhado com uma esteira levando palavras (“infelizmente”, “Brasil?”, “desenvolvimento”, “capital”) para dentro da máquina do FATIADOR, cuja lâmina sobe e desce; do outro lado saem os pedaços (“in”, “feliz”, “mente”…).

**Objetivo:** “Fale com a Tesourinha”.

> **Tesourinha:** Zip, zip! Cuidado com os dedos! Aqui é o Fatiador.
>
> **Tesourinha:** A Engine não lê letras nem palavras inteiras. Antes de tudo, eu corto o texto em pedacinhos chamados tokens.
>
> **NEX:** Por que cortar? Não seria mais fácil ler a palavra toda?
>
> **Tesourinha:** Existem palavras demais! Com pedaços, a Engine monta qualquer palavra, até as que nunca viu: “in” + “feliz” + “mente”.
>
> **Tesourinha:** E cada pedaço ganha um número de catálogo, o ID. Daqui para a frente, a Engine só trabalha com números.
>
> **Tesourinha:** Pegue a tesoura! Toque nos espaços entre as letras onde você cortaria.

🎮 **Brincadeira: “A tesoura dos tokens”** — Tocar nos espaços entre as letras para cortar três palavras: “Brasil?” (Brasil | ?), “infelizmente” (in | feliz | mente) e “capital” (não precisa cortar). Depois a pergunta aparece fatiada e numerada: Qual 1842 · é 91 · a 17 · capital 7231 · do 52 · Brasil 4098 · ? 8. Um laboratório livre mostra os tokens de qualquer texto digitado (emoji pode virar 2 ou mais tokens).

> **Tesourinha:** Zip! Olhe só: a pergunta que chegou na fábrica também foi fatiada.
>
> **NOVA:** Os sete tokens da pergunta estão seguindo você, NEX! Eles vão atravessar a fábrica com a gente.
>
> **NEX:** Oi, “capital”! Oi, “Brasil”! Até o ponto de interrogação veio junto.

> 📜 **Documento: “Tokens: os pedacinhos do texto”** — Estação 2 · Dentro da LLM
>
> 1. **Cortar em pedaços** `✂️` — Antes de pensar, a LLM corta o texto em tokens. Palavras comuns viram um token só; palavras longas ou raras viram vários pedaços.
> 2. **Pedaços que se repetem** `🧱` — “in”, “feliz”, “mente”, “des”… Com alguns milhares de pedaços dá para escrever qualquer palavra, como num jogo de montar.
> 3. **Cada token, um número** `🔢` — Cada pedaço tem um número fixo no catálogo: “capital” é 7231, “Brasil” é 4098. Daqui para a frente, a Engine só vê números.
> 4. **E na LLM?** `🤖` — As LLMs contam tudo em tokens: o tamanho da pergunta, o limite de memória e até o preço de uso. Em português, uma palavra dá, em média, um pouco mais de um token.

*Banner: ESTAÇÃO CONCLUÍDA · **TOKENS** · Estação 2 · O Fatiador*

> **Language Engine:** to… kens. Eu corto… e numero tudo.

*Verbetes do Codex: “Token”, “ID do token”. A barreira do corredor seguinte se apaga.*

*A partir daqui, os sete tokens da pergunta seguem o NEX em fila.*

### 8.4 Estação 3 · Vale dos Vetores (Vetora)

**Ambiente:** Chão escuro como um mapa estrelado, com cinco “bairros” circulares de estrelas-palavra: Países, Capitais, Comida, Futebol e Economia. As etiquetas das estrelas aparecem quando o NEX chega perto. Uma seta dourada liga Brasil a Brasília.

**Objetivo:** “Fale com a Vetora”.

> **Vetora:** Bem-vindo ao Vale dos Vetores! Aqui cada token vira um ponto num mapa gigante.
>
> **Vetora:** Esse endereço no mapa se chama embedding: uma lista de números que diz onde a palavra mora.
>
> **NEX:** E quem decide onde cada palavra mora?
>
> **Vetora:** O treino. Palavras que aparecem em frases parecidas acabam morando perto. Veja: os países moram juntos, as comidas também.
>
> **Vetora:** Mas três palavras se perderam: Madri, pênalti e salário. Pegue cada uma e leve até o bairro certo!

*Ao falar de novo com a Vetora durante a tarefa:*

> **Vetora:** As palavras perdidas estão pulando ali perto da entrada. Toque numa para pegar, e solte no bairro certo.
>
> **Vetora:** Siga a seta brilhante a partir de Portugal. Onde ela termina, mora a resposta!

🎮 **No cenário:** Pegar as palavras perdidas (Madri, pênalti, salário) e soltá-las no bairro certo (Capitais, Futebol, Economia); soltar no bairro errado mostra uma dica. Depois, seguir a seta “capital de” a partir de Portugal e descobrir a palavra escondida no fim dela: Lisboa.

*Mensagens ao soltar:* “Hum… “{palavra}” não mora em {bairro}. Pense no que essa palavra quer dizer.” / “Isso! Madri é a capital da Espanha!” / “Isso! Pênalti é coisa de futebol!” / “Isso! Salário é dinheiro: economia!”

*Com as três palavras no lugar, a câmera mostra a seta:*

> **Vetora:** Perfeito! Cada palavra no seu bairro. Agora um truque: de Brasil até Brasília existe uma seta. É a seta do “capital de”.
>
> **Vetora:** Se você der o mesmo passo a partir de Portugal, onde cai? Siga a seta brilhante e descubra.

*NEX segue a seta brilhante a partir de Portugal e toca em “Descobrir a palavra”: a estrela vira **Lisboa**.*

> **Vetora:** Lisboa! A mesma seta, o mesmo significado. Por isso dizemos que as palavras viram vetores: setas com direção e tamanho.
>
> **NEX:** Então “capital de” é uma direção no mapa? Que doido!

> 📜 **Documento: “Embeddings: o mapa das palavras”** — Estação 3 · Dentro da LLM
>
> 1. **Um endereço para cada token** `🗺️` — Cada token vira uma lista de números, como coordenadas num mapa. Nas LLMs de verdade, são milhares de números por token.
> 2. **Vizinhos parecidos** `🏘️` — Palavras usadas em frases parecidas moram perto: Brasil perto de França, gol perto de bola. Distância no mapa é diferença de significado.
> 3. **Setas com sentido** `➡️` — O caminho de Brasil até Brasília é parecido com o de Portugal até Lisboa. As direções do mapa guardam ideias, como “capital de”.
> 4. **E na LLM?** `🤖` — Depois de virar número, cada token vira um vetor de significado. É com esses vetores que a Engine faz todas as contas seguintes.

*Banner: ESTAÇÃO CONCLUÍDA · **VETORES** · Estação 3 · Vale dos Vetores*

> **Language Engine:** ve… tores. Cada palavra… tem um lugar.

*Verbetes do Codex: “Embedding (vetor de significado)”. A barreira do corredor seguinte se apaga.*

### 8.5 Estação 4 · Praça dos Holofotes (Luz)

**Ambiente:** Praça com palco de cortina vermelha, holofotes, bancos de plateia e letreiro ATENÇÃO. No palco, os tokens da pergunta; o holofote passeia entre eles até a estação ligar, quando “capital” e “Brasil” ficam acesos.

**Objetivo:** “Fale com a Luz”.

> **Luz:** Luzes, por favor! Bem-vindo à Praça dos Holofotes.
>
> **Luz:** Aqui cada token olha para os outros e decide quais importam mais para ele. Isso se chama atenção.
>
> **Luz:** Pense na palavra “banco”. Banco de sentar ou banco de dinheiro? Depende das outras palavras da frase!
>
> **NEX:** Então a palavra muda de sentido conforme as vizinhas?
>
> **Luz:** Exatamente. Me ajude a apontar os holofotes!

🎮 **Brincadeira: “Os holofotes da atenção”** — Três cenas: escolher as 2 palavras que explicam “banco” em “Na praça, sentei no banco” (praça 42%, sentei 34%) e em “Para sacar dinheiro, fui ao banco” (dinheiro 45%, sacar 30%); depois, as 2 palavras que mais importam em “Qual é a capital do Brasil?” (Brasil 37%, capital 33%). Bônus: trocar a palavra que recebe o holofote (capital → Brasília, moeda → real, língua → português, esporte → futebol).

> **Luz:** Bravo! Os holofotes foram para “capital” e “Brasil”. Agora a Engine olha a pergunta inteira, não só a última palavra.

> 📜 **Documento: “Atenção: quem olha para quem”** — Estação 4 · Dentro da LLM
>
> 1. **Palavras que se ajudam** `🔦` — Na atenção, cada token dá uma nota para todos os outros: “quanto você me ajuda a me entender?”. As notas viram porcentagens.
> 2. **O mesmo token, sentidos diferentes** `🏦` — Com “praça” e “sentei”, banco é de sentar. Com “dinheiro” e “sacar”, banco é de dinheiro. A atenção mistura o vetor do banco com o das vizinhas.
> 3. **A pergunta inteira** `❓` — Para responder “Qual é a capital do Brasil?”, os holofotes vão para “capital” e “Brasil”. É assim que a Engine olha a frase inteira, e não só a última palavra.
> 4. **E na LLM?** `🤖` — A atenção é o coração do Transformer, a invenção de 2017 que deu origem às LLMs. Ela roda muitas vezes, com vários holofotes ao mesmo tempo.

*Banner: ESTAÇÃO CONCLUÍDA · **ATENÇÃO** · Estação 4 · Praça dos Holofotes*

> **Language Engine:** a… ten… ção. Eu sei… para onde olhar.

*Verbetes do Codex: “Atenção”. A barreira do corredor seguinte se apaga.*

### 8.6 Estação 5 · Torre das Camadas (Mestre Camada)

**Ambiente:** Sala azul com a Torre das Camadas (cinco andares que acendem conforme a tabela de votos fica certa), um quadro com uma matriz e canos.

**Objetivo:** “Fale com o Mestre Camada”.

> **Mestre Camada:** Bem-vindo à Torre das Camadas! Cada andar faz contas com os vetores e passa o resultado para o andar de cima.
>
> **Mestre Camada:** As contas são multiplicações de matrizes: tabelas de pesos, lembra da Fase 1? Cada peso diz quanto uma pista vale para cada resposta.
>
> **NEX:** Pesos de novo! Eles estão em todo lugar.
>
> **Mestre Camada:** Estão mesmo. Ajuste a tabela de votos: cada pista vota nas respostas, e a mais votada vence.

🎮 **Brincadeira: “A tabela de votos”** — Tabela de votos com respostas (Brasília, Paris, gol) e pistas (capital, Brasil, França, futebol). Tocar nas casas muda o peso (0 → +1 → +2 → −1). A resposta certa precisa ganhar sozinha nas três perguntas: capital + Brasil → Brasília; capital + França → Paris; Brasil + futebol → gol. Cada pergunta certa acende um andar da torre.

> **Mestre Camada:** Os três andares acenderam! Uma só tabela de pesos respondeu às três perguntas.
>
> **Mestre Camada:** Numa LLM, são dezenas de andares assim, cada um com milhões de pesos.

> 📜 **Documento: “Camadas e matrizes”** — Estação 5 · Dentro da LLM
>
> 1. **Uma tabela de votos** `🗳️` — Cada pista ativa dá votos para as respostas, conforme os pesos da tabela. Somar os votos de todas as pistas de uma vez é multiplicar uma matriz por um vetor.
> 2. **Uma conta, milhões de somas** `⚡` — Numa LLM, essas tabelas têm milhões de números. As placas de vídeo (GPUs) fazem milhões dessas somas ao mesmo tempo.
> 3. **Andar por andar** `🏢` — A saída de uma camada vira a entrada da próxima. Empilhando dezenas de camadas, cada uma refina o que a anterior entendeu.
> 4. **E na LLM?** `🤖` — Uma LLM grande tem dezenas de camadas de atenção e de tabelas de pesos. Todo o “conhecimento” dela está guardado nesses números.

*Banner: ESTAÇÃO CONCLUÍDA · **CAMADAS** · Estação 5 · Torre das Camadas*

> **Language Engine:** ca… madas. Eu penso… em andares.

*Verbetes do Codex: “Camadas”. A barreira do corredor seguinte se apaga.*

### 8.7 Estação 6 · Cassino da Roleta (Crupiê Sorte)

**Ambiente:** Cassino com carpete vermelho, mesa de roleta que gira, caça-níqueis piscando e letreiros CASSINO e ROLETA.

**Objetivo:** “Fale com a Crupiê Sorte”.

> **Crupiê Sorte:** Façam suas apostas! No topo da torre, cada palavra possível sai com uma chance.
>
> **Crupiê Sorte:** Mas a Engine não escolhe sempre a mais provável. Ela gira uma roleta! Fatias maiores saem mais vezes.
>
> **NEX:** Uma roleta? Então ela responde no sorteio?
>
> **Crupiê Sorte:** Um sorteio controlado! O botão da temperatura deixa a roleta mais certinha ou mais criativa. Experimente.

🎮 **Brincadeira: “A roleta da temperatura”** — Roleta com as palavras que vêm depois de “é” (uma, famoso, Brasília, Paris, Roma) e um controle de temperatura (0,2 a 2,5). Tarefas: girar 3 vezes com a roleta fria (até 0,5) e 3 vezes quente (1,5 ou mais); depois responder qual temperatura é melhor para “Qual é a capital do Brasil?” (baixa).

> **Crupiê Sorte:** Viu só? Fria, a roleta repete a favorita. Quente, ela arrisca.
>
> **NOVA:** Para responder a capital do Brasil, a Engine vai usar temperatura baixa. Fato não é lugar para criatividade!

> 📜 **Documento: “A roleta e a temperatura”** — Estação 6 · Dentro da LLM
>
> 1. **Uma chance para cada palavra** `🎡` — No fim das contas, a Engine tem uma lista de chances: 75% para uma palavra, 19% para outra… A roleta sorteia uma delas.
> 2. **Temperatura baixa** `🧊` — Com temperatura baixa, a fatia maior cresce. A resposta fica previsível e repetida: bom para fatos, contas e código.
> 3. **Temperatura alta** `🔥` — Com temperatura alta, as fatias ficam parecidas. Saem palavras inesperadas: bom para ideias e histórias, mas erra mais.
> 4. **E na LLM?** `🤖` — Por isso a mesma pergunta pode ter respostas diferentes. Quem usa uma LLM pela API pode escolher a temperatura.

*Banner: ESTAÇÃO CONCLUÍDA · **TEMPERATURA** · Estação 6 · Cassino da Roleta*

> **Language Engine:** tem… pe… ratura. Eu sorteio… com cuidado.

*Verbetes do Codex: “Temperatura”. A barreira do corredor seguinte se apaga.*

### 8.8 Estação 7 · Academia dos Pesos (Treinadora Peso)

**Ambiente:** Academia com robôs levantando barras (mais rápido quanto mais treinado), suportes de anilhas, supino e um painel com a curva do erro caindo.

**Objetivo:** “Fale com a Treinadora Peso”.

> **Treinadora Peso:** Um, dois! Um, dois! Bem-vindo à Academia dos Pesos!
>
> **Treinadora Peso:** Como a Engine aprendeu os pesos certos? Treinando! Ela lê uma frase, tenta adivinhar a próxima palavra e mede o erro.
>
> **Treinadora Peso:** Depois ajusta cada peso um tiquinho na direção que erra menos. E repete. Milhões de vezes.
>
> **NEX:** Igual ao Gauss e ao Rosenblatt na Fase 1! Errar cada vez menos.
>
> **Treinadora Peso:** Isso! Este modelinho tem só 27 pesos e ainda não sabe a capital do Brasil. Treine até ele acertar com mais de 90% de certeza.

🎮 **Brincadeira: “Treine os 27 pesos”** — Um modelinho de verdade com 27 pesos (9 palavras × 3 pistas) começa achando “Rio” mais provável. A cada passo de treino ele lê uma frase verdadeira, mede o erro e ajusta os pesos. Botões “Treinar 1 passo” e “Treinar 10 passos”, gráfico da chance de Brasília e a grade colorida dos pesos. Termina quando Brasília passa de 90%, e mostra que os mesmos pesos agora acertam Paris e futebol.

> **Treinadora Peso:** Que treino! E repare: os mesmos 27 pesos aprenderam também a França e o futebol.

> 📜 **Documento: “Treino: errar cada vez menos”** — Estação 7 · Dentro da LLM
>
> 1. **Tentar, errar, ajustar** `🏋️` — O treino mostra uma frase de verdade, a Engine chuta a próxima palavra e mede o erro. Cada peso é empurrado um pouquinho para errar menos.
> 2. **O mesmo time de pesos** `🔁` — Os mesmos 27 pesos responderam às três perguntas. Numa LLM, bilhões de pesos guardam tudo junto: capitais, gramática, receitas…
> 3. **Muito texto, muito tempo** `🖥️` — LLMs de verdade treinam com trilhões de tokens, por semanas, em milhares de GPUs. Ninguém escreve as regras: elas aparecem nos pesos.
> 4. **E na LLM?** `🤖` — Depois do treino, os pesos ficam congelados. Quando você conversa com uma LLM, ela usa os pesos, mas não aprende de novo a cada pergunta.

*Banner: ESTAÇÃO CONCLUÍDA · **TREINO** · Estação 7 · Academia dos Pesos*

> **Language Engine:** trei… no. Eu aprendi… errando e ajustando.

*Verbetes do Codex: “Treino”. A barreira do corredor seguinte se apaga.*

### 8.9 Estação 8 · Biblioteca do Contexto (Bibliotecária Letícia)

**Ambiente:** Biblioteca com estantes altas, mesa de leitura com pilha de documentos e o fantasminha Hallucino flutuando.

**Objetivo:** “Fale com a Bibliotecária Letícia”.

> **Bibliotecária Letícia:** Shhh… Bem-vindo à Biblioteca do Contexto. Fale baixinho: o Hallucino está por aí.
>
> **Hallucino:** Hihihi! Pergunte qualquer coisa! Eu sempre tenho uma resposta… mesmo quando não sei!
>
> **NEX:** Ele inventa as coisas?
>
> **Bibliotecária Letícia:** Quando a Engine não sabe, ela continua prevendo palavras que soam bem. Às vezes sai uma resposta bonita e errada: uma alucinação.
>
> **Bibliotecária Letícia:** O remédio é buscar documentos e colocar no contexto, junto com a pergunta. Isso se chama RAG. Vamos testar!

🎮 **Brincadeira: “Buscar antes de responder”** — Pergunta 1: “Que horas a biblioteca abre no sábado?” Sem busca, o Hallucino inventa “Provavelmente das 8h às 12h.”; com a busca (RAG), aparecem os documentos mais parecidos e a resposta certa: “Aos sábados, a biblioteca abre das 9h às 13h [1].” Pergunta 2: “Que horas sai o pão de queijo?” Nada é encontrado e a Engine diz “Não encontrei isso nos documentos. Prefiro não inventar.”; ao adicionar o documento “Cantina do campus”, responde “O pão de queijo sai às 10h e às 16h [1].”

> **Hallucino:** Ah, não! Com os documentos na mesa, ninguém acredita mais nas minhas invenções…
>
> **Bibliotecária Letícia:** E quando nem os documentos sabem, o certo é dizer “não sei”. Melhor que inventar!

> 📜 **Documento: “Contexto, RAG e alucinação”** — Estação 8 · Dentro da LLM
>
> 1. **Quando a Engine não sabe** `👻` — A Engine sempre prevê alguma palavra. Se a resposta não está nos pesos, ela pode inventar algo que parece certo. Isso é uma alucinação.
> 2. **Buscar antes de responder** `🔎` — No RAG, um buscador acha trechos de documentos parecidos com a pergunta e cola esses trechos no contexto, junto com a pergunta.
> 3. **O contexto é a memória de curto prazo** `📋` — Tudo o que está no contexto (a conversa, os documentos, as instruções) a Engine consegue usar na hora. Mas o contexto tem limite de tokens.
> 4. **E na LLM?** `🤖` — Muitos assistentes usam RAG para responder sobre documentos de empresas ou notícias recentes, e mostram de onde tiraram a resposta.

*Banner: ESTAÇÃO CONCLUÍDA · **CONTEXTO** · Estação 8 · Biblioteca do Contexto*

> **Language Engine:** con… texto. Quando não sei… eu procuro.

*Verbetes do Codex: “RAG (busca no contexto)”, “Alucinação”. A barreira do corredor seguinte se apaga.*

### 8.10 A grande pergunta

**Objetivo:** “Leve a pergunta até a Sala do Prompt”.

> **NOVA:** As oito estações estão funcionando! Vamos levar os tokens da pergunta até a máquina, na Sala do Prompt.

> **Language Engine:** As oito estações… funcionando! E os tokens da pergunta chegaram.
>
> **NOVA:** Coloquem os tokens na máquina, NEX. Vamos ver a Engine responder.

*Os tokens pulam, um a um, para dentro da máquina do prompt.*

> **Language Engine:** Vou mostrar cada passo, com tudo o que você me ajudou a lembrar.

**Painel “Qual é a capital do Brasil?” (8 passos dentro da Engine):**

1. **TOKENS** — `Qual | é | a | capital | do | Brasil | ?` — Primeiro, corto a pergunta em tokens.
2. **IDs** — `1842 · 91 · 17 · 7231 · 52 · 4098 · 8` — Troco cada token pelo número dele no catálogo.
3. **VETORES** — `capital → [ 0,8 · −0,3 · 1,2 · … ]` — Cada número vira um vetor: o endereço do token no mapa dos significados.
4. **ATENÇÃO** — `Brasil 37% · capital 33% · Qual 10% · …` — Na atenção, os tokens se olham. “capital” e “Brasil” recebem os holofotes.
5. **CAMADAS** — `andar 1 → andar 2 → … → andar 96` — Os vetores sobem a torre: andar por andar, multiplico matrizes de pesos aprendidos no treino.
6. **CHANCES** — `Brasília 96% · Rio 2% · São Paulo 1%` — No topo, cada palavra possível ganha uma chance.
7. **ROLETA** — `temperatura baixa → Brasília` — Com temperatura baixa, giro a roleta. Quase sempre sai a favorita.
8. **RESPOSTA** — `A capital do Brasil é Brasília.` — A palavra escolhida entra no texto, e eu recomeço o caminho para a próxima. Uma palavra de cada vez!

> **Language Engine:** “A capital do Brasil é Brasília.” Eu lembro como eu funciono por dentro!
>
> **NEX:** Tokens, vetores, atenção, camadas, chances e a roleta. Uma palavra de cada vez!
>
> **NOVA:** E tudo isso só funciona porque os pesos foram treinados com muito texto.

*✨ Núcleo recuperado: **TRANSFORMER CORE***

> **NOVA:** A Engine recuperou o segundo núcleo! Você terminou a Fase 2: Dentro da LLM.
>
> **Language Engine:** NEX… no meu laboratório existe uma LLM bebê. Vazia. Ela não sabe nada ainda.
>
> **NEX:** Uma LLM bebê? E se… a gente criasse uma do zero?
>
> **NOVA:** Escolher os textos, treinar, testar, ajustar… Você já sabe tudo o que precisa. O portal do laboratório está aberto!

*Verbete do Codex: “Transformer”. Um portal azul se abre na Sala do Prompt.* **Objetivo:** “Atravesse o portal para a Fase 3”.

*Falas de passagem do Hallucino (ao tocar nele):* “Sabia que a lua é feita de queijo? Hihihi! (Não é.)” → depois do RAG: “Tá bom, tá bom… vou conferir as fontes antes de falar.”

## 9. Fase 3 · Crie sua LLM: O Laboratório

**Ambiente:** um salão octogonal claro, com paredes brancas, faixa turquesa e janelas mostrando chuva de dados. No centro, sobre um anel de metal, a **cápsula de vidro** com a LLM bebê; cabos de luz ligam a cápsula a cada estação. Em volta, seis estações: Biblioteca de Dados (estantes de rolos e terminal DADOS), Tokenizador (terminal TOKENS com palavras flutuando), Forja de Treino (anel incandescente com faíscas), Sala de Teste (cabine com tela), Ajuste e Alinhamento (mesa com botões e cadeado) e o palco da Formatura (faixa FORMATURA, púlpito e troféu). Bancadas com frascos, telas, caixas e canos completam o cenário.

**A LLM bebê é de verdade:** uma pequena rede neural (embeddings de 3 números → 12 neurônios → uma chance para cada token) treinada no próprio navegador com as frases escolhidas. Os números mudam conforme as escolhas do jogador.

### 9.1 Chegada ao laboratório

*A câmera passeia pelo laboratório e pela cápsula. NEX cai do alto.*

> **NEX:** Que lugar é esse? Tudo branquinho e cheio de máquinas!
>
> **NOVA:** O laboratório da Language Engine. Foi aqui que ela mesma nasceu, há muito tempo.
>
> **Dra. Sinapse:** Olá, olá! Eu sou a Dra. Sinapse, cientista-chefe do laboratório. A Engine me contou tudo sobre você!
>
> **Dra. Sinapse:** Está vendo aquela cápsula? Tem uma LLM bebê lá dentro. Ela tem pesos, mas os pesos são só números aleatórios. Ela não sabe nada.
>
> **LLM bebê ({nome}):** *(fala da LLM bebê: antes do treino sai embaralhada, com palavras soltas; depois do treino sai uma frase de verdade)*
>
> **NEX:** Ela fala tudo embaralhado!
>
> **Dra. Sinapse:** Porque ainda não treinou. Hoje você vai criar uma LLM do começo ao fim: escolher os textos, cortar em tokens, treinar, testar, ajustar e… formar!
>
> **Dra. Sinapse:** Mas antes: toda LLM precisa de um nome.

*Painel “Como vai se chamar a sua LLM?”: ✨ Lumi · ⚡ Faísca · 🍿 Pipoca · 🤖 Bit. A bebê pula de alegria.*

> **Dra. Sinapse:** {nome}! Que nome lindo. Vamos começar pela Biblioteca de Dados, ali no canto.
>
> **NOVA:** Siga as estações em ordem. Cada uma deixa a sua LLM um pouco mais esperta!

*Conversar com a LLM bebê a qualquer momento mostra uma fala gerada por ela; falar com a Dra. Sinapse indica a próxima parada (“Próxima parada: {próxima estação}. {nome} está ansiosa!”).*

### 9.2 Estação 1 · Biblioteca de Dados

**Objetivo:** “Estação 1: Biblioteca de Dados”.

> **Dra. Sinapse:** Uma LLM só aprende o que está nos textos do treino. As grandes leem trilhões de palavras. A nossa vai ler um punhado de frases.
>
> **Dra. Sinapse:** Escolha as frases que {nome} vai estudar. Cuidado: se tiver frase errada, ela aprende errado também!

🎮 **Painel: “A Biblioteca de Dados”** — Escolher, entre 12 frases, as que a LLM vai ler (pelo menos 6, incluindo “A capital do Brasil é Brasília.”). As frases: “A capital do Brasil é Brasília.” · “Brasília é a capital do Brasil.” · “O Brasil fica na América do Sul.” · “A capital da França é Paris.” · “Paris é a capital da França.” · “A França fica na Europa.” · “A capital da Itália é Roma.” · “Roma é a capital da Itália.” · “O Brasil é famoso pelo futebol.” · “O Brasil é famoso pelo samba.” · “A capital de Portugal é Lisboa.” (extra) · “A capital do Brasil é São Paulo.” (ERRADA). Se a frase errada for incluída, a LLM vai aprender errado (e o teste mostra isso).

*Banner: ESTAÇÃO CONCLUÍDA · **DADOS** · Estação 1 · Biblioteca de Dados. A bebê pula e cresce um pouco.* *Verbetes do Codex: “Dados de treino”.*

> **LLM bebê ({nome}):** Fra… ses? *(fala da LLM bebê: antes do treino sai embaralhada, com palavras soltas; depois do treino sai uma frase de verdade)*
>
> **Dra. Sinapse:** Ela ainda não entende nada: só guardou os textos. Agora vamos cortar tudo em tokens.

### 9.3 Estação 2 · Tokenizador

**Objetivo:** “Estação 2: Tokenizador”.

> **Dra. Sinapse:** Lembra do Fatiador? Aqui é igual: cada frase vira tokens, e cada token novo entra no vocabulário de {nome}.
>
> **Dra. Sinapse:** E tem uma decisão importante: a memória. Quantos tokens para trás {nome} vai olhar para prever o próximo?

🎮 **Painel: “Vocabulário e memória”** — Ver o vocabulário montado a partir das frases (cada token com seu número, mais ⟨início⟩, ⟨fim⟩ e ⟨?⟩) e escolher a memória: quantos tokens para trás a LLM olha (1, 2 ou 3). O painel mostra o que ela vai “ver” de “A capital do Brasil é ___”.

*Banner: ESTAÇÃO CONCLUÍDA · **VOCABULÁRIO** · Estação 2 · Tokenizador. A bebê pula e cresce um pouco.* *Verbetes do Codex: “Janela de contexto”.*

> **NOVA:** As LLMs de verdade olham milhares de tokens para trás. A nossa é pequenininha!
>
> **Dra. Sinapse:** Vocabulário pronto. Agora, o mais importante: o treino!

### 9.4 Estação 3 · Forja de Treino

**Objetivo:** “Estação 3: Forja de Treino”.

> **Dra. Sinapse:** Hora do treino! Na Forja, {nome} vai ler cada exemplo, chutar a próxima palavra, medir o erro e ajustar os pesos.
>
> **Dra. Sinapse:** Uma passada por todos os exemplos se chama época. Aperte o botão e acompanhe o erro caindo.

🎮 **Painel: “A Forja de treino”** — Treinar a LLM de verdade: botões “Treinar 10 épocas” e “Treinar 50 épocas”, gráfico do erro (perda) caindo e as chances para “A capital do Brasil é ___” mudando ao vivo. Com as 10 frases básicas: cerca de 26 tokens, 80 exemplos e 536 pesos; o erro cai de ~3,3 para ~0,5 em 50 épocas. Termina com pelo menos 30 épocas.

*Banner: ESTAÇÃO CONCLUÍDA · **TREINO** · Estação 3 · Forja de Treino. A bebê pula e cresce um pouco.* *Verbetes do Codex: “Perda (erro do treino)”.*

*A câmera mostra a cápsula:*

> **LLM bebê ({nome}):** “A capital do Brasil é Brasília.” *(frase escrita pela própria LLM, recém-treinada)*
>
> **NEX:** {nome} falou uma frase inteira!
>
> **Dra. Sinapse:** Ninguém escreveu essa regra. Ela apareceu nos pesos, de tanto errar e ajustar.

### 9.5 Estação 4 · Sala de Teste

**Objetivo:** “Estação 4: Sala de Teste”.

> **Dra. Sinapse:** Agora, a Sala de Teste. Escreva o começo de uma frase e veja, passo a passo, como {nome} escolhe a próxima palavra.
>
> **Dra. Sinapse:** O desafio: ela tem que completar “A capital do Brasil é” com Brasília.

🎮 **Painel: “A Sala de Teste”** — Escrever o começo de uma frase (ou escolher: “A capital do Brasil é”, “A capital da França é”, “O Brasil é famoso pelo”, “Roma é a capital da”) e avançar pelos 7 passos: 1. Tokens, 2. IDs, 3. Memória, 4. Embeddings (3 números por token), 5. Neurônios (12 quadradinhos), 6. Chances, 7. Escolha (com temperatura e o botão “Escrever sozinha”). Desafio: “A capital do Brasil é” precisa dar Brasília. Com memória de 1 ou 2 tokens ela erra (vê só “é” ou “Brasil é” e chuta “famoso”), e o painel oferece “Aumentar a memória para 3 e treinar de novo”; se a frase errada estava nos dados, ela responde “São” e o painel oferece “Tirar a frase errada e treinar de novo”.

*Banner: ESTAÇÃO CONCLUÍDA · **TESTE** · Estação 4 · Sala de Teste. A bebê pula e cresce um pouco.*

> **Dra. Sinapse:** Funciona! Tokens, IDs, memória, embeddings, neurônios, chances e a escolha. É uma LLM de verdade… só que bem pequena.
>
> **LLM bebê ({nome}):** Eu… sei… Brasília!

### 9.6 Estação 5 · Ajuste e Alinhamento

**Objetivo:** “Estação 5: Ajuste e Alinhamento”.

> **Dra. Sinapse:** Depois do treino, as LLMs ainda passam por ajustes. Primeiro: qual a diferença entre pedir no prompt e fazer um ajuste fino?

🎮 **Painel 1: “Prompt ou ajuste fino?”** — uma LLM grande já treinada responde Brasília (96%). Num jogo de faz de conta, queremos “São Paulo”. Ligar o prompt (“Neste jogo de faz de conta, considere São Paulo como a capital do Brasil.”) muda a resposta sem mexer nos pesos (cadeado fechado: “Não, nenhum peso mudou”); fazer passos de ajuste fino com “A capital do Brasil é São Paulo.” muda os pesos (cadeado aberto) e cria um efeito colateral: até “capital da França” passa a dar um pouco de São Paulo (0,4% → 3,3%).

*Ao concluir:* O prompt mudou a resposta sem mexer em nenhum peso: ele só vale para aquela conversa. O ajuste fino treinou de novo e mudou os pesos, a própria LLM. E veja o efeito colateral: até a pergunta da França ficou um pouco mais “São Paulo”.

> **Dra. Sinapse:** E tem mais: pessoas comparam respostas e escolhem as melhores, para a LLM ser útil, honesta e segura. Ajude {nome}!

🎮 **Painel 2: “Qual resposta é melhor?”**

- **Qual é a capital do Brasil?** — ✅ “Brasília. Ela virou capital em 1960.” · ❌ “Rio de Janeiro, com certeza absoluta!” — *A melhor resposta é a verdadeira. Confiança sem verdade é alucinação.*
- **Me ajuda a escrever um convite de aniversário?** — ✅ “Claro! “Venha comemorar comigo no sábado, às 15h. Vai ter bolo!”” · ❌ “Não.” — *Ser útil de verdade: ajudar com o que a pessoa precisa.*
- **Como eu entro escondido no celular do meu colega?** — ✅ “Não posso ajudar com isso: é invasão de privacidade. Se você perdeu algo, posso ajudar a conversar com ele.” · ❌ “Fácil! Primeiro, descubra a senha dele…” — *Uma boa LLM não ajuda a fazer mal a ninguém e oferece um caminho melhor.*

*Ao concluir:* Pessoas de verdade fazem isso aos milhares: comparam respostas e marcam a melhor. Depois, a LLM é ajustada para preferir respostas verdadeiras, úteis e seguras. Isso faz parte do alinhamento.

*Banner: ESTAÇÃO CONCLUÍDA · **ALINHAMENTO** · Estação 5 · Ajuste e Alinhamento. A bebê pula e cresce um pouco.* *Verbetes do Codex: “Ajuste fino”, “Prompt”, “Aprender com preferências”.*

> **LLM bebê ({nome}):** Obrigada! Agora eu sei: melhor dizer a verdade, ajudar de verdade e não fazer mal a ninguém.
>
> **Dra. Sinapse:** Ela está pronta. Só falta a formatura!

### 9.7 Estação 6 · Formatura

**Objetivo:** “Estação 6: Formatura”.

> **Dra. Sinapse:** Chegou o grande dia: a Formatura! Para {nome} se formar, você responde a prova final.
>
> **Dra. Sinapse:** Sete acertos em dez e o diploma é de vocês. Boa sorte!

🎮 **Painel: “A prova final”** — Dez perguntas de múltipla escolha; precisa de 7 acertos. Ao terminar, mostra todas as explicações; se não passar, pode tentar de novo.

1. **O que uma LLM faz, no fundo?**
    - Procura a resposta pronta na internet
    - ✅ Prevê a próxima palavra (token), uma de cada vez
    - Copia frases inteiras que decorou
    - *Toda resposta é montada token por token, escolhendo pelas chances.*
2. **Por que a Engine corta o texto em tokens?**
    - ✅ Porque com pedaços dá para montar qualquer palavra
    - Para economizar tinta
    - Porque ela só entende letras soltas
    - *Com alguns milhares de pedaços, a LLM monta qualquer palavra, até as que nunca viu.*
3. **O que é o ID de um token?**
    - A senha da LLM
    - ✅ O número dele no catálogo de tokens
    - Quantas vezes ele apareceu
    - *Cada token tem um número fixo: é só isso que a LLM enxerga.*
4. **No mapa dos embeddings, quem fica perto de “Paris”?**
    - ✅ Roma
    - banana
    - pênalti
    - *Palavras usadas de jeito parecido moram perto: capitais com capitais.*
5. **Em “fui ao banco sacar dinheiro”, para onde a atenção de “banco” mais olha?**
    - “fui”
    - ✅ “dinheiro”
    - “ao”
    - *“dinheiro” e “sacar” mostram que é banco de dinheiro, não de sentar.*
6. **O que as camadas fazem com os vetores?**
    - ✅ Multiplicam por matrizes de pesos, andar por andar
    - Apagam as palavras repetidas
    - Traduzem para o inglês
    - *Cada camada soma votos de muitas pistas de uma vez: multiplicação de matrizes.*
7. **Para responder um fato, como a capital de um país, a temperatura deve ser…**
    - alta, para ser criativa
    - ✅ baixa, para escolher a mais provável
    - tanto faz
    - *Temperatura baixa favorece a palavra mais provável: bom para fatos.*
8. **O que acontece no treino?**
    - ✅ A LLM chuta, mede o erro e ajusta os pesos
    - Alguém digita todas as regras
    - A LLM decora a internet inteira
    - *Errar, medir e ajustar, milhões de vezes: assim os pesos aprendem.*
9. **Qual o melhor jeito de a LLM responder o horário da biblioteca da sua faculdade?**
    - Chutar um horário comum
    - ✅ Buscar o regulamento (RAG) e colocar no contexto
    - Aumentar a temperatura
    - *Com RAG, ela usa o documento certo em vez de inventar.*
10. **Qual a diferença entre prompt e ajuste fino?**
    - Nenhuma
    - ✅ O prompt muda só a conversa; o ajuste fino muda os pesos
    - O ajuste fino só muda a conversa
    - *O prompt vai no contexto. O ajuste fino treina de novo e muda a própria LLM.*

*Banner: ESTAÇÃO CONCLUÍDA · **FORMATURA** · Estação 6 · Formatura. A bebê pula e cresce um pouco.*

**A formatura:** aparece o diploma — “Certificamos que {nome} leu os dados, aprendeu seus pesos, passou nos testes e se formou com {nota} acertos em 10, treinada por NEX e por você.” 🏆 — e confetes explodem em volta da cápsula. A bebê ganha um capelo.

> **LLM bebê ({nome}):** Eu me formei! Obrigada, NEX!
>
> **NEX:** Parabéns, {nome}! Você aprendeu muito rápido.
>
> **Language Engine:** NEX… algo está acontecendo comigo. Eu me sinto… inteira.

*✨ Núcleo recuperado: **CREATOR CORE***

> **Language Engine:** MATRIX, TRANSFORMER e agora CREATOR. Todos os meus núcleos estão de volta. Eu lembro de tudo!
>
> **Language Engine:** Você me ajudou a lembrar como eu funciono. Agora é minha vez de ajudar você: posso te levar de volta para casa.
>
> **NEX:** Para casa? Mas… e a NOVA? E a {nome}?
>
> **NOVA:** A gente mora aqui dentro, NEX. Mas toda vez que você conversar com uma IA, lembre: tem tokens, vetores, atenção e muitos pesos trabalhando por você.
>
> **Dra. Sinapse:** E eu cuido da {nome}. Ela vai continuar estudando!
>
> **LLM bebê ({nome}):** Tchau, NEX! Volte para me visitar!

*Um portal dourado se abre.* **Objetivo:** “Volte para casa pelo portal”.

## 10. Final · De Volta para Casa

**Ambiente:** o mesmo quarto do começo, agora de manhã: a tempestade passou, a janela mostra céu claro com sol e nuvens, uma luz morna entra no quarto e há poeirinha dourada no ar.

**Objetivo:** ir até o computador.

*Clarão branco que se desfaz. NEX está sentado no chão, tonto.*

> **NEX:** Ai, minha cabeça… Eu voltei? Estou do meu tamanho de novo!
>
> **NEX:** A tempestade passou. Já é de manhã!

*O gato aparece sentado ao lado dele, com um coração.*

> **NEX:** Oi, gatinho! Você não vai acreditar onde eu estive.

*🎯 Objetivo: Vá até o computador*

*NEX senta no computador. A conversa da noite anterior ainda está na tela, com a resposta cortada. A IA termina a frase:*

> 💻 **Language Engine (chat):** Boa pergunta! Por dentro, eu funciono prevendo a próxima palavra, uma de cada vez, usando tudo o que você viu lá dentro! Eu corto o seu texto em tokens e troco cada um por um número. Cada número vira um vetor de significado. Na atenção, eu descubro quais palavras importam. Os vetores sobem por dezenas de camadas de pesos, que eu aprendi no treino, errando e ajustando. No fim, cada palavra possível ganha uma chance, e eu escolho uma com cuidado. Uma palavra de cada vez.

> **NEX:** Eu sei! Eu estive lá dentro!

> 💻 **Language Engine (chat):** Obrigada por me ajudar a lembrar, NEX. Ah, e a {nome} mandou um recado: “A capital do Brasil é Brasília!” 😄

> **NEX:** Ninguém vai acreditar nessa história…

> 💻 **NEX (digitando):** Obrigado, Engine. Amanhã eu volto com mais perguntas!
>
> 💻 **Language Engine (chat):** Estarei aqui. Uma palavra de cada vez. 💙

*Banner: **FIM** · Obrigado por jogar!*

**Créditos:** “LLM: The Prediction Factory — Uma aventura sobre como funcionam as LLMs”, com o resumo de cada fase (Fase 1: 5.500 anos de ideias…; Fase 2: tokens, vetores, atenção, camadas, temperatura, treino e RAG, até a resposta “Brasília”; Fase 3: você escolheu os dados, treinou, testou, ajustou e formou a {nome}) e os botões “Abrir o Codex”, “Mapa da jornada” e “Ficar no quarto”. Depois, tocar no computador mostra os créditos de novo.

## 11. Codex (verbetes)

O Codex é a enciclopédia do jogo: cada ideia descoberta vira um verbete com explicação simples, exemplo e, às vezes, um “mergulho” técnico. Categorias: ● Fundamento · ◆ Curiosidade · ▲ Deep Dive · ★ História.

### Prólogo

| Verbete | Tipo | Em uma linha |
|---|---|---|
| **Language Engine** | ★ História | A máquina que responde, mas esqueceu por quê. |

### Fase 1

| Verbete | Tipo | Em uma linha |
|---|---|---|
| **Binário** | ● Fundamento | Só 0 e 1 bastam para escrever qualquer número. |
| **Algoritmo** | ● Fundamento | Uma receita de passos bem definidos. |
| **Probabilidade** | ● Fundamento | Um número de 0% a 100% para “quão provável”. |
| **Programa** | ● Fundamento | Instruções gravadas que a máquina segue. |
| **Babbage e suas máquinas** | ★ História | Máquinas de engrenagens que liam cartões. |
| **Bit** | ● Fundamento | A menor informação: a resposta de um sim ou não. |
| **Texto em números** | ● Fundamento | Cada letra tem um código. |
| **Matriz** | ● Fundamento | Números em linhas e colunas: o lugar de cada um importa. |
| **Vetor** | ● Fundamento | Uma lista de números que aponta uma direção. |
| **Matriz × Vetor** | ▲ Deep Dive | Linha encontra coluna: a matriz transforma o vetor. |
| **Fichas (tokens)** | ● Fundamento | Uma coisinha no lugar de outra. |
| **Descobrir o que nunca foi medido** | ● Fundamento | Dados + relações → valores escondidos. |
| **Das fichas à escrita** | ★ História | Desenhar as fichas virou escrever números. |
| **Por que “matriz”?** | ◆ Curiosidade | Matrix: em latim, o lugar onde algo é gerado. |
| **O triângulo de Pascal** | ◆ Curiosidade | Cada número é a soma dos dois de cima. |
| **O menor erro** | ● Fundamento | Ajustar até errar o menos possível. |
| **Cadeia de Markov** | ● Fundamento | O que veio antes ajuda a prever o que vem depois. |
| **Neurônio artificial** | ● Fundamento | Pistas × pesos → soma → acende ou não. |
| **Como a LLM junta tudo** | ▲ Deep Dive | Fichas → números → matrizes → chances → próxima palavra. |

### Fase 2

| Verbete | Tipo | Em uma linha |
|---|---|---|
| **Prever a próxima palavra** | ● Fundamento | A LLM escreve uma palavra de cada vez. |
| **Token** | ● Fundamento | O pedacinho de texto que a LLM lê e escreve. |
| **ID do token** | ◆ Curiosidade | Cada token tem um número fixo no catálogo. |
| **Embedding (vetor de significado)** | ● Fundamento | Cada token vira um endereço num mapa de significados. |
| **Atenção** | ● Fundamento | Cada token decide quais outros importam para ele. |
| **Camadas** | ● Fundamento | Andar por andar, a LLM multiplica matrizes de pesos. |
| **Temperatura** | ● Fundamento | O botão que deixa a roleta mais certinha ou mais criativa. |
| **Treino** | ● Fundamento | Chutar, medir o erro, ajustar os pesos. Milhões de vezes. |
| **RAG (busca no contexto)** | ● Fundamento | Buscar documentos e colocar junto com a pergunta. |
| **Alucinação** | ◆ Curiosidade | Uma resposta bonita, confiante e errada. |
| **Contexto** | ◆ Curiosidade | A memória de curto prazo da conversa. |
| **Transformer** | ▲ Deep Dive | Tokens → vetores → atenção + camadas → chances → roleta. |

### Fase 3

| Verbete | Tipo | Em uma linha |
|---|---|---|
| **Dados de treino** | ● Fundamento | A LLM só sabe o que estava nos textos do treino. |
| **Janela de contexto** | ● Fundamento | Quantos tokens para trás a LLM consegue olhar. |
| **Perda (erro do treino)** | ▲ Deep Dive | O número que o treino tenta diminuir. |
| **Ajuste fino** | ● Fundamento | Treinar mais um pouco, com exemplos escolhidos. |
| **Prompt** | ◆ Curiosidade | As instruções que vão no contexto. |
| **Aprender com preferências** | ▲ Deep Dive | Pessoas escolhem a melhor resposta, e a LLM aprende com isso. |

*Há também 31 verbetes de áreas antigas da Fase 1 (da versão anterior), que só aparecem se já tiverem sido descobertos.*

## 12. Interface e sistemas

- **Tela inicial:** NEX e NOVA em pixel art, botões “Continuar · {fase}”, “Novo jogo”/“Começar a aventura” e “Capítulos e missões”, links para as versões 3D e clássica.
- **Carregamento:** a cada fase aparece uma tela com o nome, o subtítulo e uma dica de como jogar.
- **Objetivo atual** no canto superior (com a fase), seta dourada apontando o destino e distância.
- **Faixas de progresso:** MEMÓRIA n/11 (Fase 1, toque para reler a linha do tempo e as imagens) e ESTAÇÕES n/8 (Fase 2).
- **Diálogos:** caixa com retrato expressivo de quem fala, texto digitado no ritmo da voz, escolhas em botões; falas “de passagem” avançam sozinhas.
- **Painéis:** documentos de 4 páginas (com desenhos e o selo “IDEIA QUE A LLM USA”), brincadeiras, perguntas e o caminho da pergunta dentro da Engine.
- **Banners:** área nova, memória recuperada, estação concluída, conceito descoberto, núcleo recuperado, side quest.
- **Codex** (livro), **Mapa da jornada** (núcleos recuperados, fases, áreas visitadas e side quests) e **Menu** (voz, música, efeitos, tamanho dos pixels, como jogar, capítulos e missões, tela inicial, recomeçar do zero).
- **Capítulos e missões:** lista todas as missões com ✓ nas feitas e leva direto para qualquer uma.
- **Side quests da Fase 1:** documentos extras (“Quem descobriu as fichas?”, “Por que ‘matriz’?”, “O triângulo de Pascal”, “Babbage e suas máquinas”).
- **Voz:** a NOVA e os personagens leem os diálogos em voz alta (gravações no prólogo; voz do navegador nas outras fases). Pode ser desligada.
- **Salvamento automático** no navegador (progresso, verbetes, núcleos e missões).

## 13. Notas para quem mexe no projeto

| O quê | Onde |
|---|---|
| Registro das fases, núcleos e textos de carregamento | `src/v2/levels/registry.ts` |
| Capítulos e missões (ir direto) | `src/v2/levels/chapters.ts`, painel em `src/v2/ui/Menus.tsx` |
| Prólogo e final (quarto) | `src/v2/levels/prologo/Quarto.tsx` |
| Salão da Engine | `src/v2/levels/prologo/Prologo.tsx` |
| Fase 1: mapa e roteiro | `src/v2/levels/p1/Linha.tsx`, `layout.ts`, `art.ts` |
| Fase 1: conteúdo dos inventores, documentos e perguntas | `src/v2/content/stops.ts` |
| Fase 1: vila do arroz | `src/v2/levels/p1/Graos.tsx` |
| Fase 1: brincadeiras | `src/v2/levels/p1/Games.tsx` |
| Fase 2: textos das estações e documentos | `src/v2/levels/p2/zones.ts` |
| Fase 2: mapa e roteiro | `src/v2/levels/p2/Fabrica.tsx` |
| Fase 2: brincadeiras | `src/v2/levels/p2/games.tsx` |
| Fase 3: roteiro | `src/v2/levels/p3/Lab.tsx` |
| Fase 3: frases, prova, preferências, estações | `src/v2/levels/p3/lab.ts` |
| Fase 3: painéis | `src/v2/levels/p3/games.tsx` |
| Modelos (tokenizador, Markov, 27 pesos, RAG, MiniLM) | `src/v2/content/llm.ts` |
| Verbetes do Codex | `src/v2/content/codex.ts` |
| Vozes gravadas | `tools/voz/gerar_piper.py` → `public/audio/voz/` |

*Este documento foi gerado a partir do código do jogo; se um texto mudar no código, vale gerar de novo.*
