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

Acesse **https://llm-para-leigos.pages.dev**. O progresso fica salvo no próprio navegador. O jogo precisa de internet para carregar as fontes e a biblioteca 3D ([three.js](https://threejs.org/)).

## Como editar

O código fica na pasta `src/`:

- `head.html`: estilos (cores, fontes, layout)
- `body.html`: estrutura da tela (cabeçalho, Tok, menu, introdução)
- `engine.js`, `hud.js`, `ui2d.js`, `mini3d.js`, `concepts.js`, `models.js`: motor do jogo, interface, cenas 3D, glossário e mini-modelos
- `c01_vitrine.js` a `c12_formatura.js`: uma fase por arquivo (`museu_base.js` e `galaxia_base.js` são a base das fases 5 e 7)
- `main.js`: inicialização

O comando `bash build.sh` junta tudo num arquivo só, `dist/index.html`, que dá para abrir direto no navegador.

## Publicação

Cada mudança enviada para o ramo `main` é publicada automaticamente pelo Cloudflare Pages, que roda `bash build.sh` e publica a pasta `dist`.
