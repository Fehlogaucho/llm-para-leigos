# Protocolo de teste com jogadores iniciantes

Roteiro para a Prioridade 7 do plano de melhorias: validar, com pessoas que não conhecem LLMs, se o jogo ensina o que promete. O jogo já traz as ferramentas (modo piloto, avaliações antes e depois e métricas locais). Este documento diz como usá-las.

> **Privacidade:** o modo piloto não envia nada. Tudo fica no navegador do aparelho até alguém exportar o arquivo. Não peça nome, e-mail nem dados pessoais: use um código (P01, P02…). Para participantes menores de idade, siga as regras da escola ou da instituição e peça a autorização dos responsáveis.

---

## 1. Preparação

1. **Participantes:** de 6 a 10 pessoas sem experiência significativa com LLMs (nunca estudaram o assunto; podem já ter usado um chat de IA). Se possível, misture idades e aparelhos (celular e computador).
2. **Aparelho:** um navegador atualizado. Abra o jogo com o modo piloto ligado: `https://llm-para-leigos.pages.dev/?piloto=1`. Também dá para ligar em Menu → “Modo piloto (pesquisa)”.
3. **Zerar antes de cada pessoa:** Menu → “Recomeçar do zero” e, no modo piloto, “Apagar dados do piloto” (depois de exportar os dados da pessoa anterior).
4. **Som:** fones de ouvido, com a voz ligada (padrão).
5. **Materiais:** este roteiro, uma planilha de observação (modelo na seção 6) e um cronômetro.

## 2. Sessão (cerca de 60 a 90 minutos)

| Etapa | Duração | O que fazer |
|---|---|---|
| Boas-vindas | 3 min | Explique que o teste é do jogo, não da pessoa. Peça para pensar em voz alta. |
| Avaliação inicial | 5 min | Toque em “Começar a aventura”. O jogo mostra 8 perguntas antes de começar. Digite o código do participante. **Não ajude.** |
| Jogo | 45 a 75 min | Deixe a pessoa jogar sem instruções. Para sessões curtas, combine antes uma seleção de missões (seção 3). Só intervenha se ela travar por mais de 3 minutos, e anote. |
| Avaliação final | 8 min | Ao terminar (créditos), toque em “Avaliação final (modo piloto)”. Se a sessão acabar antes, abra pelo Menu → “Avaliação final”. Há 8 perguntas equivalentes (não idênticas) e 2 perguntas abertas. |
| Problema novo (transferência) | 5 min | Faça oralmente a pergunta da seção 4, que não aparece no jogo. |
| Entrevista | 10 min | Perguntas da seção 5. |
| Exportar | 1 min | Menu → “Exportar dados (JSON)”. Guarde o arquivo com o código do participante. |

## 3. Seleções de missões (sessões curtas)

Use **Capítulos e missões** para começar no ponto certo. O jogo registra quantas vezes esse atalho foi usado (`jumps`).

| Seleção | Missões | Conceitos (ver a matriz) |
|---|---|---|
| A · Como a LLM escreve | Fase 2 inteira | C01–C11 |
| B · Criar uma LLM | Fase 3 inteira | C08–C13 |
| C · Origens | Fase 1: ilhas de Pascal, Gauss, Markov e Rosenblatt + Memória Central | H, C06, C08 |

## 4. Problema novo (transferência)

Leia em voz alta e anote a explicação, sem corrigir:

> “Uma amiga pediu a uma IA a data de uma prova da escola. A IA respondeu com uma data e um texto muito bem escrito. Ela deve confiar? Por quê? O que a IA fez por dentro para escrever essa resposta?”

Uma boa resposta menciona pelo menos dois destes pontos: a resposta é prevista pedaço por pedaço pelas chances; texto bonito não garante verdade; a IA pode não ter a informação (ou ter uma velha); vale conferir num documento oficial; um sistema com busca (RAG) ajudaria se achasse o calendário atual.

## 5. Entrevista

1. Com suas palavras: como uma LLM escreve uma resposta?
2. Qual parte do jogo te ajudou a entender melhor? E qual confundiu?
3. Teve alguma hora em que você leu muito e quis pular? Onde?
4. Os controles foram fáceis? Algo foi difícil de tocar, ler ou ouvir?
5. Depois de jogar, você confiaria mais ou menos numa resposta de IA? Por quê?

## 6. Planilha de observação (uma linha por momento)

| Participante | Tempo | Missão | O que aconteceu | Tipo (dúvida, erro, travou, abandonou, comentário) | Intervenção? |
|---|---|---|---|---|---|

## 7. Análise

Para cada participante, junte o arquivo JSON, a planilha e as respostas da seção 4.

| Pergunta | Onde olhar no JSON | Como interpretar |
|---|---|---|
| Aprendeu? | `pre.score` × `pos.score`; acerto por conceito em `pre.ids` + `pre.correct` e `pos.ids` + `pos.correct` (a resposta −1 é “Não sei”) | melhora por conceito, não só no total |
| Entendeu sem decorar frases? | `open.explain` + seção 4 | explicação com as próprias palavras (não só repetir frases do jogo) |
| Onde travou? | `activities.*.tries`, `hints`, `ms`; atividades sem `done` | muitas tentativas ou dicas = explicação confusa ou interface ruim |
| Leu os documentos? | `activities["doc:…"].ms` | tempo de leitura muito curto pode indicar texto longo demais |
| Usou o Codex? | `codex.opens`, `codex.entries` | revisões espontâneas |
| Erros recorrentes | `exam.wrong` (perguntas da prova) | conceito a revisar no jogo |

### Critérios de sucesso

Como recomenda o plano (9.3), **as metas numéricas são definidas depois de um piloto inicial** com 3 ou 4 pessoas. Sugestões do que acompanhar:

- melhora entre as avaliações inicial e final em todos os conceitos;
- pelo menos metade das pessoas explica a geração token a token e o limite da fluência com as próprias palavras;
- resolução do problema novo (seção 4);
- nenhuma missão com abandono por problema técnico;
- comentários positivos sobre clareza, ritmo e controles.

## 8. Depois do teste

1. Liste os problemas encontrados, com evidências (trecho da planilha, dados do JSON).
2. Corrija o jogo e atualize `docs/MATRIZ_APRENDIZAGEM.md` e `docs/JOGO_COMPLETO.md`.
3. Rode os testes automáticos (`tests/README.md`).
4. Repita o teste com pessoas novas antes da versão final.
