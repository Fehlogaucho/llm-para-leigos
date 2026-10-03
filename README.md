# LLM: The Prediction Factory

Uma aventura 3D em português para descobrir, por dentro, como funcionam as LLMs (as inteligências artificiais de texto).

A Language Engine, uma máquina que conversa e responde, perdeu a memória. NEX e a robô NOVA atravessam mundos que contam a história das ideias por trás dela e recuperam os Núcleos de Conhecimento.

- **Prólogo**: a Language Engine se desmonta e a NOVA acorda.
- **Fase 1 · As Origens**: Observatório, Vale dos Números, Jardim da Lógica, Câmara da Probabilidade, Oficina das Máquinas, Sala da Computação e Câmara da Matriz.
- **Fases 2 a 11 e Final**: tokens, próximo token, embeddings, atenção, Transformer, treinamento, RAG, agentes, especialistas, sistemas de IA e “Você é a LLM”.

Cada área tem uma missão principal e side quests opcionais. As descobertas vão para o Codex, com uma camada simples e outra técnica.

## Como jogar

Abra https://llm-para-leigos.pages.dev no navegador (celular ou computador).

- Celular: arraste o círculo para andar ou toque no chão; arraste a tela para girar a câmera.
- Computador: WASD ou setas, Shift para correr, mouse para girar, E para usar.

## Como editar

```bash
npm install
npm run dev      # servidor local
bash build.sh    # build de produção em dist/
```

O Cloudflare Pages roda `bash build.sh` e publica `dist/` a cada push na branch `main`.

A versão clássica (2D) continua em `/classico`.
