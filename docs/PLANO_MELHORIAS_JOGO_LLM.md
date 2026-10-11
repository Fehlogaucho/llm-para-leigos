# Plano de Melhorias — JOGO COMPLETO
## Projeto: LLM: The Prediction Factory

**Versão:** 1.0  
**Data:** 11 de outubro de 2026  
**Objetivo:** Consolidar as sugestões de melhoria para elevar a qualidade científica, pedagógica, narrativa, técnica e de experiência do jogo educativo sobre Large Language Models (LLMs).

---

## 1. Resumo executivo

O projeto possui uma premissa forte: ensinar conceitos de inteligência artificial por meio de exploração, narrativa, desafios e experimentação. A recomendação é preservar a identidade do jogo — personagens, universo, três fases principais e combinação de história com prática — e aprimorar o conteúdo de forma incremental.

As prioridades são:

1. Revisar a precisão científica e histórica.
2. Fortalecer a aprendizagem ativa e a transferência de conhecimento.
3. Explicitar os limites do modelo de linguagem simplificado da Fase 3.
4. Melhorar ritmo, acessibilidade e usabilidade, especialmente em dispositivos móveis.
5. Criar critérios de aceitação, testes de regressão e métricas de aprendizagem.
6. Validar o resultado com jogadores iniciantes e testes técnicos.

> **Princípio orientador:** preservar as metáforas que tornam o jogo acessível, mas deixar clara a diferença entre a representação didática do jogo e o funcionamento técnico real.

---

## 2. Escopo e princípios de implementação

### 2.1. Preservar os pontos fortes

- Manter a premissa de entrar na Language Engine e recuperar seus núcleos.
- Preservar a divisão em três fases:
  - **Fase 1 — Arquivo da Memória:** fundamentos históricos, matemáticos e computacionais.
  - **Fase 2 — Fábrica de Previsões:** fluxo de processamento de uma LLM.
  - **Fase 3 — Laboratório:** experimentação e treinamento de uma mini-rede neural.
- Manter os personagens e suas funções narrativas, salvo se testes mostrarem problemas.
- Preservar as mecânicas de exploração, descoberta, missões e recompensas.
- Manter a versão visual principal escolhida para o jogo e documentar claramente quaisquer versões alternativas.

### 2.2. Princípios para as melhorias

- **Precisão sem excesso de jargão:** explicar conceitos corretamente com linguagem acessível.
- **Aprender fazendo:** priorizar previsões, experimentos e resolução de problemas.
- **Metáforas transparentes:** indicar quando uma representação é simplificada.
- **Progressão gradual:** introduzir um conceito por vez e conectar os conceitos.
- **Acessibilidade por padrão:** oferecer alternativas de interação, leitura e áudio.
- **Testabilidade:** cada missão deve ter condições claras de funcionamento e conclusão.
- **Validação empírica:** não presumir que uma explicação foi compreendida só porque o jogador avançou.

---

## 3. Prioridade 1 — Revisão científica e conceitual

### 3.1. Tokens

**Risco identificado:** expressões como “a LLM nunca lê letras: lê fichas” podem sugerir que todos os tokens correspondem a palavras completas ou que o modelo interpreta fichas de maneira semelhante à compreensão humana.

**Melhorias propostas:**

- Explicar que um token pode corresponder a uma palavra, parte de palavra, espaço, pontuação ou outra sequência de caracteres, conforme o tokenizador.
- Mostrar a divisão de uma frase em tokens usando exemplos concretos.
- Diferenciar o texto visível, os tokens e os IDs numéricos usados pelo modelo.
- Explicar que tokenização depende do tokenizador e que palavras iguais não precisam sempre corresponder a um único token.
- Evitar sugerir que existe uma correspondência universal de um token para uma palavra.

**Critério de aceitação:** o jogador consegue explicar, com suas próprias palavras, que tokens são unidades de processamento de texto e que não equivalem necessariamente a palavras inteiras.

### 3.2. Embeddings e representações vetoriais

**Risco identificado:** dizer que “cada número vira um vetor de significado” pode sugerir que cada dimensão tem um significado humano fixo e isolado.

**Melhorias propostas:**

- Explicar que tokens são associados a representações numéricas aprendidas.
- Mostrar vetores como posições em um espaço multidimensional, usando uma visualização 2D ou 3D apenas como projeção didática.
- Informar que dimensões individuais normalmente não correspondem a conceitos humanos simples.
- Diferenciar embeddings iniciais das representações que são transformadas pelas camadas da rede.
- Evitar apresentar distância vetorial como prova absoluta de sinonímia ou compreensão.

**Critério de aceitação:** o jogador distingue um ID de token de seu embedding e compreende que a representação é aprendida, distribuída e dependente do modelo.

### 3.3. Atenção e Transformer

**Risco identificado:** frases como “cada token decide quais outros importam” atribuem intenção consciente ao modelo e simplificam o mecanismo.

**Melhorias propostas:**

- Descrever atenção como um cálculo que pondera informações de outras posições da sequência.
- Usar mapas de calor para mostrar pesos de atenção em um exemplo pequeno.
- Explicar que a visualização é ilustrativa e não uma explicação completa de todas as operações internas.
- Apresentar, de forma gradual, consultas (*queries*), chaves (*keys*) e valores (*values*) apenas quando fizer sentido pedagógico.
- Explicar que Transformers possuem várias camadas e cabeças de atenção, e que o diagrama do jogo é uma simplificação.
- Não sugerir que mapas de atenção, isoladamente, explicam por completo a decisão de um modelo.

**Critério de aceitação:** o jogador consegue descrever a atenção como um mecanismo de ponderação de informações, sem atribuir consciência ou intenção literal ao modelo.

### 3.4. Previsão do próximo token e geração

**Melhorias propostas:**

- Mostrar que o modelo calcula uma distribuição de probabilidades sobre tokens possíveis.
- Diferenciar a distribuição prevista, o método de seleção do próximo token e o token efetivamente escolhido.
- Demonstrar que a geração ocorre de forma iterativa: o token gerado passa a integrar o contexto usado no passo seguinte.
- Explicar que diferentes estratégias de amostragem podem produzir resultados distintos.
- Evitar dizer que o token de maior probabilidade será sempre escolhido, pois isso depende da estratégia de geração.
- Demonstrar que uma resposta fluente não é garantia de verdade.

**Critério de aceitação:** o jogador diferencia probabilidade prevista de certeza factual e compreende que a resposta é construída token por token.

### 3.5. Temperatura e amostragem

**Risco identificado:** associar temperatura baixa a respostas corretas e temperatura alta a respostas erradas cria uma regra falsa.

**Melhorias propostas:**

- Explicar que temperatura modifica a distribuição de probabilidades antes da amostragem.
- Demonstrar, com a mesma distribuição inicial, como temperaturas diferentes podem alterar a diversidade das saídas.
- Ressaltar que temperatura baixa não garante verdade, segurança ou correção.
- Explicar que temperatura alta não implica necessariamente erro; pode apenas aumentar a variabilidade.
- Se outros parâmetros, como *top-k* ou *top-p*, forem apresentados, diferenciá-los de temperatura.

**Critério de aceitação:** o jogador entende que temperatura afeta a seleção e a variabilidade, não funciona como um controle direto de verdade.

### 3.6. Dados de treinamento, aprendizagem e generalização

**Risco identificado:** afirmar que a LLM “só sabe o que estava nos textos do treino” é excessivamente simplificador. O modelo aprende padrões e pode generalizar, embora também possa memorizar e errar.

**Melhorias propostas:**

- Distinguir memorização de exemplos, aprendizagem de padrões e generalização.
- Explicar que os dados de treinamento influenciam o comportamento, mas não determinam cada resposta como uma consulta literal a um arquivo.
- Mostrar como o modelo pode produzir combinações inéditas e ainda assim estar errado.
- Demonstrar que dados incompletos, enviesados ou de baixa qualidade podem afetar resultados.
- Evitar representar o treinamento como simples armazenamento de documentos em uma base de dados.

**Critério de aceitação:** o jogador consegue explicar por que uma saída nova não prova compreensão humana nem garante correção.

### 3.7. RAG — Geração aumentada por recuperação

**Risco identificado:** apresentar RAG como uma etapa obrigatória de toda LLM ou como uma solução que elimina alucinações.

**Melhorias propostas:**

- Mostrar RAG como uma arquitetura complementar, não como componente obrigatório de todo modelo.
- Separar visualmente a recuperação de documentos da geração da resposta.
- Explicar o fluxo: pergunta → busca/recuperação → contexto recuperado → geração.
- Mostrar que documentos recuperados podem ser irrelevantes, desatualizados ou incorretos.
- Demonstrar que o modelo ainda pode interpretar mal o contexto ou responder sem suporte suficiente.
- Explicar a importância de avaliar a relevância das fontes e a fidelidade da resposta ao material recuperado.

**Critério de aceitação:** o jogador sabe que RAG fornece contexto externo e pode melhorar a fundamentação, mas não garante uma resposta correta.

### 3.8. Ajuste fino (*fine-tuning*)

**Risco identificado:** apresentar o ajuste fino como uma forma simples e previsível de trocar uma única resposta pode ocultar efeitos colaterais e dependência dos dados e do método.

**Melhorias propostas:**

- Diferenciar *fine-tuning* de engenharia de prompt e de RAG.
- Explicar que o ajuste fino modifica parâmetros do modelo a partir de exemplos de treinamento.
- Demonstrar que a mudança de comportamento depende dos dados, do procedimento e da intensidade do ajuste.
- Mostrar que exemplos incorretos podem degradar o desempenho ou introduzir comportamentos indesejados.
- Evitar prometer que um pequeno conjunto de exemplos produzirá uma mudança isolada e perfeitamente controlada.
- Comparar resultados antes e depois do ajuste em perguntas vistas e não vistas durante o treinamento.

**Critério de aceitação:** o jogador consegue distinguir instruções fornecidas no prompt, contexto recuperado por RAG e parâmetros modificados por ajuste fino.

### 3.9. Limites, alucinações e avaliação

**Melhorias propostas:**

- Criar situações em que o modelo responde com confiança, mas sem evidências suficientes.
- Ensinar o jogador a verificar afirmações em fontes confiáveis.
- Diferenciar fluência, consistência, fundamentação e correção factual.
- Explicar que modelos podem falhar em tarefas simples e acertar tarefas complexas, dependendo do contexto.
- Evitar antropomorfismos literais como “o modelo sabe”, “decide” ou “lembra” sem qualificar o uso metafórico.

**Critério de aceitação:** o jogador não usa fluência ou confiança aparente como único critério para confiar em uma resposta.

---

## 4. Prioridade 2 — Revisão histórica e bibliográfica da Fase 1

A Fase 1 é um diferencial narrativo, mas deve passar por revisão histórica antes da publicação.

### 4.1. Temas que exigem checagem

- **Pascal e Fermat:** contextualizar a correspondência de 1654 no desenvolvimento da teoria das probabilidades, sem afirmar que foi o primeiro estudo matemático da incerteza.
- **Fichas de barro:** apresentar com nuance a hipótese de que fichas contábeis contribuíram para o desenvolvimento da escrita; distinguir evidência arqueológica de interpretação histórica.
- **Gauss e Ceres:** separar a previsão e recuperação da órbita de Ceres dos métodos matemáticos publicados e desenvolvidos posteriormente.
- **Liu Hui:** diferenciar a época de composição dos *Nove Capítulos da Arte Matemática* da época dos comentários de Liu Hui.
- **Demais personagens e marcos:** conferir datas, atribuições, traduções, relações de causa e efeito e o contexto cultural de cada descoberta.

### 4.2. Referências obrigatórias

Para cada marco histórico, registrar:

- Afirmação histórica apresentada no jogo.
- Fonte primária, quando disponível.
- Fonte secundária acadêmica ou institucional confiável.
- Data de acesso ou de consulta.
- Grau de certeza e eventuais interpretações concorrentes.
- Crédito, autoria, data e acervo de cada imagem histórica.

### 4.3. Como transformar história em aprendizagem

Para cada ilha ou lembrança histórica:

1. Apresentar uma situação intrigante.
2. Permitir uma interação curta antes da explicação.
3. Explicar o conceito em linguagem acessível.
4. Conectar o conceito à computação ou às LLMs.
5. Oferecer um desafio opcional de aprofundamento.
6. Colocar detalhes históricos extensos no Codex, sem interromper a missão principal.

**Critério de aceitação:** toda afirmação histórica central tem fonte rastreável, e metáforas ou interpretações são identificadas como tais.

---

## 5. Prioridade 3 — Fortalecer a aprendizagem ativa

### 5.1. Estrutura recomendada para cada missão

Cada missão deve incluir, quando aplicável:

1. **Previsão:** perguntar ao jogador o que espera que aconteça.
2. **Experimentação:** permitir mudar uma variável, dado ou escolha.
3. **Observação:** mostrar o resultado e o que mudou.
4. **Explicação:** relacionar o resultado ao conceito.
5. **Transferência:** apresentar um problema diferente que use a mesma ideia.
6. **Reflexão:** explicar por que a tentativa funcionou ou falhou.

### 5.2. Tipos de desafio a incluir

- Prever o próximo token a partir de uma distribuição simplificada.
- Comparar duas tokenizações da mesma frase.
- Alterar o contexto e observar como as representações mudam.
- Comparar respostas a perguntas ambíguas.
- Identificar quando um documento recuperado não sustenta uma resposta.
- Testar o modelo com frases semelhantes às vistas no treinamento e com frases novas.
- Distinguir um acerto por memorização de uma generalização plausível.
- Corrigir uma explicação errada e justificar a correção.

### 5.3. Feedback pedagógico

- Evitar feedback limitado a “certo” ou “errado”.
- Explicar qual raciocínio levou ao resultado.
- Oferecer uma pista progressiva antes de revelar a solução.
- Permitir novas tentativas sem penalidade excessiva.
- Retomar conceitos anteriores em novos contextos.
- Separar domínio do conceito de velocidade de resposta.

**Critério de aceitação:** cada conceito principal aparece em pelo menos uma atividade de experimentação e uma atividade de transferência.

---

## 6. Prioridade 4 — Melhorias específicas por fase

### 6.1. Fase 1 — Arquivo da Memória

**Objetivo:** criar fundamentos históricos, matemáticos e computacionais sem transformar a exploração em uma sequência longa de leituras.

Ações:

- Manter as onze ilhas, caso sejam parte da estrutura já definida.
- Reduzir a densidade de texto na missão principal.
- Criar uma interação curta e significativa em cada ilha.
- Transferir detalhes e referências para o Codex.
- Revisar rigorosamente datas, atribuições e fontes.
- Conectar explicitamente cada conceito histórico a uma ideia computacional.
- Incluir perguntas de transferência entre ilhas.

**Critério de aceitação:** o jogador consegue resumir a ideia principal de cada ilha e relacioná-la a um conceito computacional sem precisar memorizar longos textos.

### 6.2. Fase 2 — Fábrica de Previsões

**Objetivo:** mostrar como o texto é processado e como uma resposta é gerada.

Ações:

- Usar uma pergunta recorrente como fio condutor, sem sugerir que toda LLM opera sempre da mesma forma.
- Mostrar tokens e IDs separadamente.
- Mostrar embeddings como representações aprendidas.
- Usar uma visualização didática para a atenção.
- Explicar a transformação pelas camadas do Transformer.
- Mostrar a distribuição de probabilidades do próximo token.
- Demonstrar a seleção do token e a repetição do processo.
- Tratar RAG como uma opção complementar de arquitetura.
- Incluir exemplos em que a saída é fluente, mas incorreta.
- Identificar claramente o que foi simplificado para fins didáticos.

**Critério de aceitação:** o jogador consegue ordenar e explicar as principais etapas da geração, reconhecendo que o diagrama não representa todos os detalhes de uma implementação real.

### 6.3. Fase 3 — Laboratório

**Objetivo:** permitir que o jogador experimente o treinamento de uma mini-rede neural e observe seus limites.

Ações:

- Descrever o sistema como uma mini-rede neural de linguagem treinada no navegador, se essa for a implementação real.
- Não sugerir que seu tamanho ou desempenho seja comparável ao de uma LLM moderna.
- Mostrar os dados de treinamento e o vocabulário.
- Permitir experimentar diferentes conjuntos de exemplos.
- Mostrar a evolução da função de perda sem prometer redução monotônica em todos os casos.
- Comparar exemplos vistos e não vistos.
- Criar desafios de generalização.
- Mostrar como dados insuficientes ou incorretos podem afetar a saída.
- Comparar prompt, RAG e ajuste fino como técnicas distintas.
- Mostrar as limitações de um acerto isolado como evidência de aprendizagem.

**Critério de aceitação:** o jogador consegue explicar o que foi treinado, o que mudou, como o resultado foi avaliado e quais são as limitações do experimento.

---

## 7. Prioridade 5 — Ritmo, conteúdo e interface

### 7.1. Ritmo da campanha

O documento deve definir uma estimativa de duração por fase, mas essa estimativa precisa ser validada com jogadores.

Ações:

- Medir o tempo médio de cada missão.
- Identificar diálogos e documentos que interrompem a ação.
- Criar um percurso principal conciso e conteúdo opcional de aprofundamento.
- Permitir rever explicações no Codex sem repetir a missão.
- Evitar obrigar o jogador a ler todos os materiais para progredir.
- Oferecer pausas naturais entre desafios conceitualmente densos.

### 7.2. Interface e controles móveis

Testar:

- Legibilidade dos textos em telas pequenas.
- Tamanho e espaçamento das áreas de toque.
- Controles de movimento e interação.
- Funcionamento dos painéis sem bloquear elementos essenciais.
- Orientação da tela e adaptação do layout.
- Uso em dispositivos com diferentes capacidades de processamento.
- Navegação por teclado, quando aplicável.
- Compatibilidade com leitores de tela nos componentes que suportarem essa tecnologia.

### 7.3. Áudio e acessibilidade

Ações:

- Manter legendas disponíveis durante toda a experiência.
- Oferecer controle de volume independente para música, efeitos e voz.
- Permitir avançar ou repetir falas.
- Avaliar a consistência de qualidade entre vozes gravadas e sintetizadas.
- Oferecer alternativa textual para informações transmitidas exclusivamente por áudio.
- Incluir opção para reduzir movimentos e efeitos visuais intensos.
- Evitar que cor seja o único indicador de estado ou resultado.
- Considerar modos de contraste e fontes legíveis.

### 7.4. Salvamento e navegação

Ações:

- Testar a entrada direta em missões.
- Verificar dependências entre personagens, itens, núcleos e objetivos.
- Testar sair e retornar durante uma missão.
- Testar reiniciar uma fase já concluída.
- Verificar persistência de escolhas e resultados.
- Garantir que o jogador consiga recuperar explicações importantes.
- Definir o comportamento esperado quando um salvamento estiver ausente, incompleto ou inválido.

**Critério de aceitação:** a interface permanece utilizável nos dispositivos suportados, e o progresso não se torna inconsistente em caminhos de navegação previstos.

---

## 8. Prioridade 6 — Especificação técnica e critérios de aceitação

O documento de conteúdo deve ser complementado por requisitos verificáveis.

### 8.1. Matriz de aprendizagem

Criar uma tabela com estas colunas:

| Campo | Descrição |
|---|---|
| ID do conceito | Identificador único e estável |
| Conceito | Tema ensinado |
| Objetivo de aprendizagem | O que o jogador deve conseguir explicar ou fazer |
| Missão | Onde o conceito é introduzido |
| Mecânica | Como o jogador interage com o conceito |
| Evidência | Que ação demonstra aprendizagem |
| Feedback | Como o jogo explica o resultado |
| Referência | Fonte científica ou histórica |
| Teste | Como validar o funcionamento e a aprendizagem |

### 8.2. Critérios por missão

Cada missão deve especificar:

- Condições de início.
- Objetivos e pré-requisitos.
- Ações permitidas.
- Estados da missão.
- Condições de sucesso e falha.
- Pistas e feedback.
- Regras de repetição.
- Condições de conclusão.
- Recompensas e efeitos na progressão.
- Comportamento ao sair ou reiniciar.
- Casos de teste associados.

### 8.3. Testes de regressão

Manter testes para:

- Diálogos e gatilhos narrativos.
- Desbloqueio e conclusão de missões.
- Salvamento e carregamento.
- Inventário, núcleos e recompensas.
- Entrada direta em capítulos.
- Navegação entre telas e painéis.
- Experimentos da Fase 3.
- Exibição de resultados, gráficos e mensagens de erro.
- Compatibilidade com os dispositivos suportados.

### 8.4. Desempenho

Definir metas mensuráveis, depois de identificar os dispositivos-alvo:

- Tempo de carregamento inicial.
- Taxa de quadros durante a exploração.
- Consumo de memória.
- Tempo de resposta das interações.
- Tempo de treinamento no navegador.
- Comportamento em dispositivos de menor desempenho.
- Recuperação após interrupções ou falhas.

**Critério de aceitação:** cada requisito de produção possui um teste reproduzível e um resultado esperado.

---

## 9. Prioridade 7 — Métricas de aprendizagem e testes com jogadores

### 9.1. Indicadores do jogo

Monitorar, respeitando a privacidade e a legislação aplicável:

- Taxa de início e conclusão por fase.
- Taxa de abandono por missão.
- Tempo gasto por atividade.
- Quantidade de tentativas por desafio.
- Erros recorrentes por conceito.
- Uso de pistas e revisões no Codex.
- Desempenho em desafios de transferência.
- Diferença entre acertos durante a missão e acertos em avaliação posterior.

Não usar apenas tempo de jogo ou taxa de acerto como prova de aprendizagem.

### 9.2. Protocolo de testes com iniciantes

1. Recrutar pessoas sem experiência significativa com LLMs.
2. Aplicar uma avaliação curta de conhecimento prévio.
3. Solicitar que completem uma seleção de missões sem instruções externas.
4. Observar dúvidas, erros e pontos de abandono.
5. Aplicar uma avaliação posterior com questões equivalentes, mas não idênticas.
6. Incluir pelo menos um problema novo que exija transferência do conceito.
7. Entrevistar participantes sobre as explicações que acharam confusas.
8. Revisar o conteúdo com base nos resultados e repetir o teste.

### 9.3. Critérios de sucesso

Definir metas após um piloto inicial, em vez de inventar números arbitrários.

Exemplos de critérios:

- Melhoria entre a avaliação inicial e a posterior.
- Capacidade de explicar conceitos sem repetir frases do jogo.
- Resolução de um problema novo com o conceito aprendido.
- Redução de erros conceituais recorrentes após revisão.
- Conclusão das missões sem bloqueios técnicos graves.
- Feedback positivo sobre clareza, ritmo e controles.

---

## 10. Plano de execução recomendado

A ordem abaixo reduz retrabalho e protege a identidade do projeto.

### Etapa 1 — Auditoria do conteúdo

- [ ] Inventariar conceitos e afirmações técnicas.
- [ ] Revisar explicações sobre tokens, embeddings, atenção e geração.
- [ ] Revisar temperatura, RAG, ajuste fino e alucinações.
- [ ] Conferir os marcos históricos e as referências.
- [ ] Identificar metáforas que precisam de uma nota de esclarecimento.

**Entrega:** lista de correções científicas e históricas, com referências rastreáveis.

### Etapa 2 — Revisão pedagógica

- [ ] Definir objetivos de aprendizagem por missão.
- [ ] Identificar onde o jogador apenas lê ou memoriza.
- [ ] Acrescentar previsões e experimentos.
- [ ] Criar desafios de transferência.
- [ ] Padronizar o feedback pedagógico.

**Entrega:** matriz de aprendizagem e roteiro revisado das missões.

### Etapa 3 — Revisão do laboratório

- [ ] Documentar exatamente qual modelo é implementado.
- [ ] Conferir a representação dos dados e do vocabulário.
- [ ] Validar o cálculo e a exibição da função de perda.
- [ ] Criar testes com dados vistos e não vistos.
- [ ] Explicar as limitações do modelo.
- [ ] Separar claramente os experimentos de prompt, RAG e ajuste fino.

**Entrega:** especificação técnica e pedagógica da Fase 3.

### Etapa 4 — Revisão de UX e acessibilidade

- [ ] Medir a duração das missões.
- [ ] Revisar o volume de texto obrigatório.
- [ ] Testar dispositivos móveis.
- [ ] Verificar legendas, controles de áudio e opções de acessibilidade.
- [ ] Testar salvamento, retorno e entrada direta em capítulos.

**Entrega:** lista priorizada de melhorias de interface e navegação.

### Etapa 5 — Validação e lançamento

- [ ] Criar testes de aceitação por missão.
- [ ] Automatizar os testes de regressão possíveis.
- [ ] Realizar testes técnicos nos dispositivos-alvo.
- [ ] Executar um piloto com jogadores iniciantes.
- [ ] Analisar as métricas de aprendizagem.
- [ ] Corrigir os problemas encontrados.
- [ ] Repetir os testes críticos antes de publicar.

**Entrega:** relatório de validação com problemas, evidências e decisão de lançamento.

---

## 11. Registro de riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Metáforas confundidas com funcionamento literal | Alto | Identificar simplificações e acrescentar notas técnicas |
| Erros históricos ou fontes frágeis | Alto | Revisão especializada e referências rastreáveis |
| Modelo didático confundido com LLM moderna | Alto | Explicitar escala, arquitetura e limitações |
| Aprendizagem baseada em memorização | Alto | Experimentação e desafios de transferência |
| Excesso de leitura e abandono | Médio/alto | Reduzir texto obrigatório e testar o ritmo |
| Falhas de salvamento ou progressão | Alto | Testes de regressão e critérios de aceitação |
| Experiência ruim em celulares | Médio/alto | Testes em dispositivos-alvo e ajustes de interface |
| Indicadores de sucesso pouco representativos | Médio/alto | Avaliar transferência, não apenas acertos e tempo |

---

## 12. Checklist de aprovação para a versão final

### Ciência e história
- [ ] Conceitos centrais revisados.
- [ ] Metáforas claramente diferenciadas de mecanismos reais.
- [ ] Referências históricas e técnicas rastreáveis.
- [ ] RAG, temperatura e ajuste fino explicados sem promessas indevidas.
- [ ] Limitações, incertezas e erros dos modelos representados.

### Pedagogia
- [ ] Objetivos de aprendizagem definidos por missão.
- [ ] Atividades de previsão e experimentação incluídas.
- [ ] Feedback explicativo disponível.
- [ ] Desafios de transferência implementados.
- [ ] Aprendizagem avaliada por evidências além da conclusão da fase.

### Experiência e acessibilidade
- [ ] Duração avaliada com jogadores.
- [ ] Interface móvel testada.
- [ ] Legendas e controles de áudio disponíveis.
- [ ] Opções de acessibilidade verificadas.
- [ ] Salvamento e navegação testados.

### Engenharia e qualidade
- [ ] Critérios de aceitação definidos.
- [ ] Testes de regressão implementados onde viável.
- [ ] Desempenho avaliado nos dispositivos suportados.
- [ ] Falhas críticas corrigidas.
- [ ] Testes com iniciantes concluídos e documentados.

---

## 13. Decisão recomendada

**Não reconstruir o jogo do zero.** A estrutura narrativa e o conceito central devem ser preservados.

A melhor estratégia é fazer uma revisão incremental, começando pela precisão científica e pela aprendizagem ativa. Em seguida, fortalecer a Fase 3, revisar a experiência de uso e concluir com testes técnicos e pedagógicos.

O critério mais importante para considerar o projeto bem-sucedido não é apenas o jogador concluir a aventura ou conseguir fazer a mini-rede produzir uma resposta correta. É conseguir explicar, com suas próprias palavras, como uma LLM gera texto, por que pode errar e como avaliar suas respostas de forma crítica.

**Resultado esperado:** um jogo que combine narrativa envolvente, rigor conceitual, experimentação prática e evidências reais de aprendizagem.
