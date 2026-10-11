# LLM: The Prediction Factory

Aventura educativa em português (Brasil) sobre como funcionam as LLMs. Site: https://llm-para-leigos.pages.dev

Há três versões no mesmo site:
- **Principal (raiz `/`): 2D isométrica em pixel art** — `index.html` → `src/v2/main.tsx`. Progresso salvo em `pf2d-save-v1`.
- **3D (`/3d/`)** — `3d/index.html` → `src/main.tsx` (código em `src/game/`, congelado). Progresso em `pf-save-v1`.
- **Clássica (`/classico/`)** — `public/classico/` (gerada por `legacy/build.sh` a partir de `legacy/src`).

## Versão 2D (src/v2)
- Stack: Vite + React 19 + TypeScript + zustand; desenho próprio em Canvas 2D (sem three.js). Toda a arte é gerada por código (pixel art procedural), em cache.
- Motor em `src/v2/engine/`: `runtime.ts` (projeção isométrica `iso(x, y, z)`, casa = losango 32×16, tipos `Scene`/`Thing`/`Interact`, estado `RT`), `View.tsx` (carrega a fase, anda com o NEX, câmera, ordem de profundidade, chão pré-desenhado em pedaços com penhascos, toque-para-andar), `world.ts` (colisão e caminho A*), `script.ts` (roteiros: `say`, `objective`, `focus(pos, zoom)`, `cinematic([{pos, zoom, h, dur, cut}])` …), `input.ts`, `pix.ts` (Pix, fonte 5×7 com acentos).
- Arte em `src/v2/art/`: `core.ts` (pisos, blocos, cilindros, brilhos, pinturas de parede), `person.ts` (NEX, NOVA, inventores, holograma, retratos), `sky.ts` (céus), `fx.ts` (portal, névoa, cristais).
- Fases em `src/v2/levels/` (registro em `registry.ts`; cada fase exporta `build(): Scene`):
  - `prologo/Quarto.tsx` (quarto + chat; `buildRoom(fim)` também monta o epílogo de manhã) e `prologo/Prologo.tsx` (salão da Language Engine).
  - Fase 1 `p1/Linha.tsx` — **O Arquivo da Memória**: arquipélago de 11 ilhas (uma por época) em volta da Memória Central, ligadas por pontes de luz com névoa (abre quando a ilha anterior é concluída). Planta em `p1/layout.ts` (ISL, BRIDGES, onBridge, PEDESTAL, VILLAGE), peças em `p1/art.ts`, vila do arroz em `p1/Graos.tsx`. As palavras recuperadas seguem o NEX.
  - Fase 2 `p2/Fabrica.tsx` — **Dentro da LLM / A Fábrica de Previsões**: 3×3 salas (Sala do Prompt no meio) com corredores de esteira (`Scene.flow`) e barreiras de energia. 8 estações com robôs (`p2/zones.ts`: textos, documentos, palavra, codex), brincadeiras em `p2/games.tsx` (prever, tokens, atenção, camadas, roleta/temperatura, treino de 27 pesos, RAG); o Vale dos Vetores é no mundo (levar palavras perdidas, seguir a seta Portugal→Lisboa). Planta em `p2/layout.ts`, arte em `p2/art.ts`.
  - Fase 3 `p3/Lab.tsx` — **Crie sua LLM / O Laboratório**: 6 estações (dados, vocabulário+memória, forja de treino, sala de teste com os 7 passos, ajuste fino+preferências, formatura com prova ≥7/10). A LLM bebê é uma MiniLM treinada de verdade no navegador (`content/llm.ts`); escolhas guardadas nas flags `p3_mask`, `p3_mem`, `p3_ep`, `p3_nome` (o modelo é refeito ao recarregar). Painéis em `p3/games.tsx`, dados em `p3/lab.ts`.
  - Final `fim/Casa.tsx` (epílogo no quarto, a IA termina a resposta, créditos).
- Modelos didáticos (tokenizador, contagem de Markov, mini-modelo de 27 pesos, busca RAG, MiniLM) em `src/v2/content/llm.ts` (portados de `legacy/src/models.js`).
- Robôs que falam: `levels/robots.tsx` (`registerRobot`); habitantes/seguidores em `engine/npc.ts`; criaturas em `art/creatures.ts`.
- Conteúdo em `src/v2/content/` (`stops.ts`, `photos.ts`, `codex.ts`) — cópias do conteúdo da 3D; mudanças de texto vão aqui.
- Interface em `src/v2/ui/` (HUD, diálogo, menus, carregamento). Ganchos de teste em `window.__pf` (inclui `walkTo(x, y)` e `VOICE`).
- Vozes gravadas: `tools/voz/gerar_piper.py` lê as falas (`{ who, text }` e escolhas) dos arquivos passados, gera um mp3 por fala em `public/audio/voz/` (nome = hash FNV-1a de "QUEM|texto") e atualiza `index.json`. `src/v2/engine/voice.ts` toca o arquivo se existir; senão usa a voz do navegador. Timbre de cada personagem e pronúncias ficam no script. Hoje só o prólogo tem voz (Piper, voz pt-br-edresson-low, baixada do GitHub do Piper v0.0.2); as Fases 1–3 usam a voz do navegador. Se mudar o texto de uma fala, gere de novo.

## Geral
- Documentos de design em `docs/` (GDD Master v3, narrativa v2.1, produção da Fase 1) e guia técnico da 3D em `docs/AREA_GUIDE.md`.
- Build: `bash build.sh` (npm ci + vite build → `dist/`, com as duas entradas). Todo push para `main` publica no Cloudflare Pages.
- Imagens reais dos inventores vêm do Wikimedia Commons (upload.wikimedia.org, URL com o MD5 do nome); o ambiente de desenvolvimento não acessa o Commons.
- Textos do jogo em português do Brasil, simples, para leigos.
