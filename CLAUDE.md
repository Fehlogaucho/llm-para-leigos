# LLM para leigos

Jogo educativo em português (Brasil) que explica LLMs em 12 fases. Site: https://llm-para-leigos.pages.dev

- Edite só os arquivos em `src/`. Nunca edite `dist/`: ele é gerado.
- Depois de editar, rode `bash build.sh` e confira que `dist/index.html` abre sem erros no console.
- Todo push para `main` publica sozinho no Cloudflare Pages (comando de build `bash build.sh`, saída `dist`).
- A ordem dos arquivos no build importa (lista `FILES` em `build.sh`); uma fase nova entra antes de `main`.
- Textos do jogo em português do Brasil, simples, para leigos; sem jargão sem explicação.
- Sem dependências além de three.js 0.147 (CDN) e Google Fonts; tudo vira um único HTML.
