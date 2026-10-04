# LLM: The Prediction Factory

Aventura 3D educativa em português (Brasil) sobre como funcionam as LLMs. Site: https://llm-para-leigos.pages.dev

- Stack: Vite + React 19 + TypeScript + React Three Fiber (three.js) + drei + postprocessing + three-mesh-bvh + zustand.
- Código em `src/`. Fases em `src/game/levels/` (registradas em `levels/registry.ts`). A Fase 1 é um ambiente só: `levels/p1/Linha.tsx` (linha do tempo com 11 inventores; conteúdo em `p1/linha/stops.ts`, documentos/brincadeiras em `p1/linha/Doc.tsx` e `Games.tsx`; posições em `p1/linha/layout.ts`). A parte 2 (Liu Hui) é uma cena própria, “O Mistério dos Três Grãos”: vila em `p1/linha/Village.tsx`, mesa/balança/grande ideia e roteiros em `p1/linha/Graos.tsx`. As antigas Áreas 1–7 (`p1/Observatorio.tsx` … `p1/Matriz.tsx`) ficam fora da campanha, só como fonte de peças reaproveitáveis. Motor em `src/game/engine/`, peças do mundo em `src/game/world/`, interface em `src/game/ui/`, Codex em `src/game/content/codex.ts`.
- Documentos de design em `docs/` (GDD Master v3, narrativa v2.1, produção da Fase 1) e guia técnico em `docs/AREA_GUIDE.md`.
- Build: `bash build.sh` (npm ci + vite build → `dist/`). Todo push para `main` publica no Cloudflare Pages.
- A versão clássica 2D fica em `public/classico/` (gerada por `legacy/build.sh` a partir de `legacy/src`).
- Textos do jogo em português do Brasil, simples, para leigos.
