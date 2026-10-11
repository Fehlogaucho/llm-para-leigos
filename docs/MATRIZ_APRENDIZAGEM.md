# Matriz de aprendizagem e critérios por missão

Especificação pedagógica e técnica de **LLM: The Prediction Factory** (versão 2D), feita a partir do [*Plano de Melhorias v1.0*](PLANO_MELHORIAS_JOGO_LLM.md) (outubro de 2026). Tem quatro partes:

1. a matriz de aprendizagem (Prioridade 6.1 do plano);
2. os critérios de cada missão (6.2);
3. as métricas e testes que verificam cada item (6.3, 6.4 e 7);
4. a situação de cada item do checklist de aprovação.

Fontes científicas e históricas: [`REFERENCIAS.md`](REFERENCIAS.md). Protocolo com jogadores: [`PROTOCOLO_TESTE_INICIANTES.md`](PROTOCOLO_TESTE_INICIANTES.md). Como rodar os testes: [`../tests/README.md`](../tests/README.md).

---

## 1. Matriz de aprendizagem

Cada conceito tem pelo menos **uma atividade de experimentação** e **uma de transferência**, como pede o critério de aceitação 5.3. As colunas *Prova* e *Piloto* indicam onde o conceito é avaliado: a prova final da Fase 3 (12 perguntas) e as avaliações antes e depois do jogo no modo piloto (8 pares).

| ID | Conceito | Objetivo de aprendizagem (o jogador consegue…) | Onde é introduzido | Mecânica (experimentação) | Transferência | Evidência | Feedback | Prova / Piloto | Referência | Teste automático |
|---|---|---|---|---|---|---|---|---|---|---|
| C01 | Tokens | explicar que tokens são pedaços de texto (palavra, parte, espaço, pontuação) definidos por um tokenizador, e não sempre palavras | Ilha das fichas (F1) → Fatiador (F2) | cortar 3 palavras; laboratório livre comparando **dois tokenizadores** e vendo texto → tokens → IDs | Tokenizador do laboratório (F3), com o vocabulário da própria LLM | cortes certos; contagem A ≠ B | cada corte errado diz o que faltou ou sobrou; o acerto explica a regra | Q2 · `tokens` | Sennrich et al. 2016 | `play_p2` (laboratório A/B e IDs); `models.test` (tokenizador) |
| C02 | ID × embedding | distinguir o número de catálogo (ID) do vetor aprendido | Fatiador (IDs) e Vale dos Vetores | ver os IDs da pergunta; na Sala de Teste, passos 2 (IDs) e 4 (embeddings) da própria LLM | Sala de Teste (F3) | percorre os 7 passos | texto de cada passo | Q3 · `embeddings` | Mikolov et al. 2013 | `play_p3` |
| C03 | Embeddings e proximidade | dizer que palavras usadas de jeito parecido ficam perto, e que o mapa 2D é só uma projeção | Vale dos Vetores (F2) | levar palavras perdidas ao bairro certo; seguir a seta Brasil→Brasília a partir de Portugal | pergunta de prova com palavras novas | bairro certo; Lisboa | soltar no bairro errado dá dica; documento traz “O jogo simplificou” | Q4 · `embeddings` | Mikolov et al. 2013 | `play_p2` |
| C04 | Atenção | descrever a atenção como um cálculo que pondera as outras posições, sem intenção | Praça dos Holofotes (F2) | escolher as 2 palavras que explicam “banco” (2 frases) e a pergunta; **mapa de calor** ilustrativo | trocar a palavra que recebe o holofote (moeda, língua…) | 3 cenas certas | erro explica qual pista muda o sentido; aviso de ilustração | Q5 · `atencao` | Vaswani et al. 2017; Jain e Wallace 2019 | `play_p2` (mapa de calor) |
| C05 | Camadas e matrizes | explicar que cada camada multiplica vetores por matrizes de pesos | Cayley (F1) → Torre das Camadas (F2) | matriz que leva a seta à estrela; tabela de votos com 12 pesos | uma tabela responde três perguntas diferentes | três andares acesos | cada pergunta mostra a contagem dos votos | Q6 | Goodfellow et al. 2016 | `play_p1`, `play_p2` |
| C06 | Próximo token e geração | diferenciar distribuição, método de escolha e token escolhido; dizer que a geração é repetida token a token | Markov e Pascal (F1) → Oficina do Adivinho (F2) | você contra a máquina de contar (3 rodadas) | **desafio de ordenar os 8 passos** antes da resposta final (F2); Sala de Teste (F3) | ordem correta | pista a cada erro; depois de 2 erros, o passo certo pisca | Q1 · `geracao` | Radford et al. 2019 | `play_p2` (ordem, pista) |
| C07 | Temperatura | dizer que a temperatura muda a variedade, não a verdade | Cassino da Roleta (F2) | **palpite antes**, girar fria e quente, conferir o palpite | 2 perguntas: temperatura para fatos e “temperatura baixa garante acerto?” | responde “não garante” | erro lembra o modelinho que achava “Rio” | Q7 · `temperatura` | Holtzman et al. 2020 | `play_p2` (palpite, 2ª pergunta) |
| C08 | Treino e perda | explicar chutar → medir o erro → ajustar; dizer que o erro oscila e que erro baixo pode ser decoreba | Gauss e Rosenblatt (F1) → Academia dos Pesos (F2) | treinar 27 pesos até 90%; na Forja, **palpite** e curva de perda reais | Forja (F3) com a própria LLM | Brasília > 90%; ≥ 30 épocas | mensagem final comenta oscilação e decoreba | Q8 · `treino` | Goodfellow et al. 2016 | `play_p2`, `play_p3`; `models.test` |
| C09 | Dados e generalização | explicar por que acertar o que já viu não prova aprendizado | Biblioteca de Dados (F3) | escolher as frases (inclusive a errada) | **teste com frases vistas, novas e com palavra nunca vista** (Sala de Teste) | escolhe a conclusão certa | erro aponta a frase da Espanha | Q12 · `treino` | Zhang et al. 2017 | `play_p3`; `models.test` (Espanha) |
| C10 | Alucinação e avaliação crítica | não usar fluência ou confiança como critério de verdade | Hallucino (F2) | perguntar sem e com busca | Espanha → “Roma” com confiança (F3); conselho final da IA no epílogo | escolhe conferir em fontes | explicação do erro | Q11 · `critico` | Ji et al. 2023 | `play_p2`, `play_p3` |
| C11 | RAG | dizer que RAG é opcional, separa busca e geração e não garante acerto | Biblioteca do Contexto (F2) | 3 perguntas: sem busca; documento não encontrado; **aviso de 2019 que não sustenta a resposta** | classificar situações (Ajuste e Alinhamento, F3) | escolhe a resposta que admite a dúvida | erro aponta a data do documento | Q9 · `rag_ajuste` | Lewis et al. 2020 | `play_p2` (aviso velho) |
| C12 | Prompt × RAG × ajuste fino | distinguir o que muda o contexto do que muda os pesos | Ajuste e Alinhamento (F3) | ligar o prompt; fazer passos de ajuste fino e ver o efeito colateral | **3 situações: escolher a técnica** | 3 acertos | cada escolha errada explica por que não serve | Q10 · `rag_ajuste` | Howard e Ruder 2018 | `play_p3` |
| C13 | Alinhamento por preferências | explicar que pessoas comparam respostas e a LLM é ajustada a preferir as melhores | Ajuste e Alinhamento (F3) | escolher a melhor de 2 respostas (3 vezes) | — | 3 acertos | por que a resposta é melhor | — | Ouyang et al. 2022 | `play_p3` |
| C14 | Metáfora × mecanismo | reconhecer que a Engine “lembrar” ou “decidir” é imagem da história | Prólogo (escolha “A Engine pensa e sente como gente?”) | quadro “O jogo simplificou” nos documentos; avisos nos caminhos | resposta honesta da IA no epílogo | — | — | — | — | `content.test` (notas em todos os documentos da F2) |
| H01–H11 | Ideias históricas | resumir a ideia de cada ilha e ligá-la a um conceito computacional | 11 ilhas (F1) | brincadeira curta em cada ilha | **desafio de ligar** 5 ideias ao que fazem numa LLM (Memória Central) | 5 ligações | erro dá dica com o inventor da ilha | — | `REFERENCIAS.md` | `play_p1` (ligar, dica) |

---

## 2. Critérios por missão

Regras comuns a todas as missões:
- **Repetição:** brincadeiras e perguntas aceitam novas tentativas sem penalidade; a prova final pode ser refeita.
- **Saída no meio:** sair da fase cancela o painel aberto; ao voltar, a missão recomeça do início (as anteriores continuam feitas).
- **Entrada direta:** “Capítulos e missões” marca as missões anteriores como feitas, as fases anteriores como concluídas (com núcleos) e recomeça o capítulo a partir da escolhida; fases seguintes ficam como estavam (`levels/chapters.ts`).
- **Documentos:** podem ser fechados a qualquer momento e relidos depois (linha do tempo, Codex).

### Prólogo e quarto

| Missão | Início | Sucesso | Feedback | Conclusão (flag) | Recompensa | Testes |
|---|---|---|---|---|---|---|
| Uma pergunta | novo jogo | ir ao computador e escolher a pergunta | — | `quarto_done` | — | `smoke` (capítulos) |
| A máquina que esqueceu | `quarto_done` | ligar a Engine e atravessar o portal | — | `pro_done` | verbetes “Language Engine” e “O que é metáfora no jogo” | `smoke` |

### Fase 1 · O Arquivo da Memória

| Missão | Início | Ações | Sucesso / falha | Pistas | Conclusão | Recompensa | Testes |
|---|---|---|---|---|---|---|---|
| Chegada ao Arquivo | `pro_done` | cinemática, Arquivista | — | — | `l1_intro` | — | `play_p1` |
| Ilha *k* (1–11) | ilha anterior concluída (a ponte abre) | falar com o inventor; imagem real; documento; brincadeira ou pergunta | brincadeira resolvida | erro → dica; pergunta: 2º erro mostra dica específica | `l1_<id>` | palavra da memória; verbetes; documento extra (side quest) | `play_p1` (cada ilha; fontes no documento) |
| A Memória Central | 11 ilhas | levar as palavras ao núcleo; caminho “O céu é ___”; **ligar ideias** | 5 ligações certas | dica do inventor a cada erro | `l1_final`, `l1_done` | núcleo MATRIX; verbete “Como a LLM junta tudo” | `play_p1` |

### Fase 2 · A Fábrica de Previsões

| Missão | Início | Ações | Sucesso / falha | Pistas | Conclusão | Recompensa | Testes |
|---|---|---|---|---|---|---|---|
| Chegada à fábrica | `l1_done` | cinemática e NOVA | — | — | `p2_intro` | — | `play_p2` |
| Estação *k* (1–8) | estação anterior concluída (a barreira some) | falar com o robô; brincadeira; documento | brincadeira concluída (ver C01–C11) | específicas por brincadeira | `p2_<id>` | palavra; verbetes; barreira seguinte some | `play_p2` (cada estação e nota “O jogo simplificou”) |
| A grande pergunta | 8 estações | levar os tokens à máquina; **ordenar os 8 passos**; caminho da pergunta | ordem certa | pista por passo; o certo pisca depois de 2 erros | `p2_final`, `p2_done` | núcleo TRANSFORMER | `play_p2` |

### Fase 3 · O Laboratório

| Missão | Início | Ações | Sucesso / falha | Pistas | Conclusão | Recompensa | Testes |
|---|---|---|---|---|---|---|---|
| Chegada ao laboratório | `p2_done` | dar nome à LLM | escolher um nome | — | `p3_intro`, `p3_nome` | — | `play_p3` |
| Biblioteca de Dados | — | escolher ≥ 6 frases (com a do Brasil) | enviar | aviso se faltar | `p3_dados`, `p3_mask` | verbete “Dados de treino” | `play_p3` |
| Tokenizador | — | ver o vocabulário; escolher a memória (1–3) | escolher | — | `p3_tokens`, `p3_mem` | “Janela de contexto” | `play_p3` |
| Forja de Treino | — | **palpite**; treinar ≥ 30 épocas | ≥ 30 épocas | ficha técnica; aviso sobre decoreba | `p3_forja`, `p3_ep` | “Perda”, “A sua LLM × uma LLM de verdade” | `play_p3` |
| Sala de Teste | — | 7 passos; consertar memória ou dados; **teste de generalização** | Brasília e conclusão certa | botões de conserto; erro explicado | `p3_teste` | “Decorar × generalizar” | `play_p3`; `models.test` |
| Ajuste e Alinhamento | — | prompt; ajuste fino; **3 situações**; preferências | tudo certo | explicação por escolha | `p3_ajuste` | “Ajuste fino”, “Prompt”, “Aprender com preferências” | `play_p3` |
| Formatura | — | prova de 12 perguntas | ≥ 8 acertos | explicação em cada resposta; pode refazer | `p3_prova`, `p3_nota`, `p3_done` | diploma; núcleo CREATOR | `play_p3` |
| A despedida | `p3_done` | atravessar o portal | — | — | `p3_saida` | — | `chapters.test` |

### Final

| Missão | Início | Sucesso | Conclusão | Extra | Testes |
|---|---|---|---|---|---|
| A resposta | `p3_done` | ir ao computador; a IA termina a resposta e lembra de conferir fontes | `fim_done` | créditos; no modo piloto, botão “Avaliação final” | `play_p3` |

---

## 3. Métricas e testes

### Métricas (só no navegador)

`src/v2/engine/metrics.ts` guarda em `localStorage` (chave `pf2d-metrics-v1`). **Nada é enviado.** No modo piloto, o menu permite exportar um arquivo JSON.

| Indicador do plano (9.1) | Como é medido |
|---|---|
| Início e conclusão por fase | data de cada flag de conclusão (`quarto_done` … `fim_done`) |
| Abandono por missão | atividades abertas sem `done` |
| Tempo por atividade | soma do tempo com o painel aberto (`ms`) e número de aberturas |
| Tentativas por desafio | sons de erro durante a atividade (`tries`) |
| Uso de pistas | dicas mostradas (`hints`) |
| Revisões no Codex | aberturas do Codex e de cada verbete |
| Erros recorrentes por conceito | erros por pergunta da prova (`exam.wrong`) |
| Desempenho antes e depois | avaliações inicial e final (8 pares equivalentes) |
| Explicação com as próprias palavras | 2 perguntas abertas no fim da avaliação final |
| Uso de atalhos | vezes que “Capítulos e missões” foi usado (`jumps`) |

> Tempo de jogo e acertos sozinhos **não** provam aprendizagem (plano, 9.1). A análise deve olhar a diferença entre as avaliações, as perguntas abertas e as entrevistas.

### Testes automáticos

| Tipo | Arquivo | O que cobre |
|---|---|---|
| Unidade | `tests/unit/content.test.ts` | documentos completos com fontes e notas, verbetes e links do Codex, prova e avaliações do piloto, frases corrigidas que não podem voltar |
| Unidade | `tests/unit/models.test.ts` | tokenizadores, temperatura, modelinho de 27 pesos, MiniLM (queda da perda, memória, palavra nunca vista), busca do RAG |
| Unidade | `tests/unit/save.test.ts` | save válido, incompleto, inválido e antigo |
| Unidade | `tests/unit/chapters.test.ts` | entrada direta em todas as missões, núcleos, preservação das fases seguintes |
| Ponta a ponta | `tests/e2e/smoke.py` | save danificado, modo piloto, acessibilidade, diálogo, entrada em missões |
| Ponta a ponta | `tests/e2e/play_p1.py`, `play_p2.py`, `play_p3.py` | as três fases jogadas do começo ao fim (computador e celular), com as verificações pedagógicas |

### Desempenho (8.4)

Metas a definir depois de escolher os aparelhos-alvo (plano, 8.4). Valores de referência medidos no ambiente de testes (Chromium sem placa de vídeo):

| Item | Referência atual |
|---|---|
| Treino da MiniLM | 60 épocas em cerca de 0,25 s (`models.test`) |
| Carregar uma fase | a tela de carregamento fica cerca de 0,65 s; a fase fica pronta em cerca de 1 a 2 s (`smoke`) |

---

## 4. Situação do checklist de aprovação (seção 12 do plano)

| Item | Situação | Onde |
|---|---|---|
| Conceitos centrais revisados | ✅ feito | textos de `stops.ts`, `zones.ts`, `codex.ts`, `lab.ts`, diálogos |
| Metáforas diferenciadas de mecanismos | ✅ feito | quadro “O jogo simplificou”, avisos nos caminhos, verbete C14, escolha no prólogo |
| Referências rastreáveis | ✅ feito (falta revisão de especialista) | `REFERENCIAS.md`, quadro “Fontes” nos documentos |
| RAG, temperatura e ajuste fino sem promessas indevidas | ✅ feito | estações 6 e 8, Ajuste e Alinhamento |
| Limitações e erros dos modelos | ✅ feito | teste de generalização, ficha técnica, epílogo |
| Objetivos de aprendizagem por missão | ✅ feito | este documento |
| Previsão e experimentação | ✅ feito | palpites (roleta, forja, teste), experimentos |
| Feedback explicativo | ✅ feito | dicas progressivas, explicações de erro |
| Desafios de transferência | ✅ feito | ligar ideias, ordenar passos, escolher técnica, frases novas |
| Aprendizagem avaliada além da conclusão | 🟡 ferramenta pronta | modo piloto (avaliações + perguntas abertas); falta aplicar |
| Duração avaliada com jogadores | ⏳ pendente | protocolo pronto; métricas medem o tempo |
| Interface móvel testada | ✅ automático; ⏳ aparelhos reais | `play_p*.py --mobile` |
| Legendas e controles de áudio | ✅ feito | texto sempre na tela; volumes de voz, música e efeitos; repetir e voltar fala |
| Opções de acessibilidade | ✅ feito | tamanho do texto, alto contraste, movimento reduzido, ícones além das cores |
| Salvamento e navegação testados | ✅ feito | `save.test`, `chapters.test`, `smoke.py` |
| Critérios de aceitação definidos | ✅ feito | seção 2 |
| Testes de regressão | ✅ feito | `tests/` |
| Desempenho nos aparelhos suportados | ⏳ pendente | definir aparelhos-alvo |
| Testes com iniciantes | ⏳ pendente | `PROTOCOLO_TESTE_INICIANTES.md` |
