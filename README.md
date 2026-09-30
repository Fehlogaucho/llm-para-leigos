# LLM para leigos

Um jogo em português, para celular e computador, que explica sem fórmulas como funcionam as LLMs, as inteligências artificiais de texto por trás de assistentes como o ChatGPT e o Claude.

O jogo acompanha uma pergunta simples, “Qual é a capital do Brasil?”, do texto digitado até a resposta “Brasília”, em 12 fases:

1. **O que uma LLM faz**: a vitrine e um mistério
2. **Viagem ao passado**: 9 enigmas históricos, da China antiga ao ChatGPT, e uma conversa com a ELIZA (1966)
3. **Prever a próxima palavra**: contagens, a roleta das chances e a temperatura
4. **Tokens**: cortar palavras em pedaços e trocar cada pedaço por um número
5. **Matrizes**: ser a matriz e ajustar os pesos até a resposta certa vencer (3D)
6. **Treinamento**: 27 pesos que aprendem de verdade
7. **Universo dos significados**: a galáxia das palavras (3D)
8. **Atenção**: os holofotes que olham a frase inteira
9. **Prompt ou fine-tuning**: dois jeitos de mudar a resposta
10. **RAG**: a biblioteca do modelo, com e sem busca
11. **Crie sua LLM**: uma pequena rede neural treinada no navegador
12. **Formatura**: o caminho completo de uma resposta e a prova final

## Como jogar

Abra o `index.html` num navegador moderno. O jogo inteiro está nesse arquivo. Ele precisa de internet para carregar as fontes e a biblioteca 3D ([three.js](https://threejs.org/)). O progresso fica salvo no próprio navegador.

## Publicação

O site é publicado com o Cloudflare Pages, direto deste repositório, sem etapa de build: o diretório de saída é a raiz do repositório.
