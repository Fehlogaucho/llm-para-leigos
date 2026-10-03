# Guia técnico: como construir uma área/fase

Este jogo é uma aventura 3D (React Three Fiber). Cada área é um "nível" carregado sob demanda. Use a Área 1 (`src/game/levels/p1/Observatorio.tsx` + `src/game/levels/p1/observatorio/Map.tsx`) como **referência de qualidade e de padrão de código**. Leia esses dois arquivos inteiros antes de começar.

## Estrutura

- `src/game/levels/registry.ts` — registro de todos os níveis (`defineLevel`): id, nome, trilha (`theme`), side quests (`quests`), próximo nível (`next`) e o `load: () => import(...)`. Os níveis da Fase 1 já estão registrados.
- `src/game/engine/` — motor: `level.ts` (`useLevel`), `script.ts` (roteiros: `start`, `QUICK`, `Ctx`), `runtime.ts` (`RT`: posição do NEX, câmera…), `collision.ts`, `CameraRig.tsx` (`FOCUS`), `audio.ts` (`SFX.play`, temas), `voice.ts`.
- `src/game/world/` — peças do mundo:
  - `core.tsx`: `Solid` (filhos viram colisão), `Block` (caixa invisível de colisão), `Ramp` (rampa invisível), `Interactable` (objeto usável com losango e alcance), `useFlag`, `ObjectiveBeacon`.
  - `Architecture.tsx`: `Batch` (junta malhas estáticas: use para decoração repetida), `Column`, `Arch`, `Stairs` (degraus + rampa), `RoundPlatform`, `RectPlatform`, `Balustrade`, `RingBalustrade`, `Lantern`, `Banner`, `Statue`, `Tree`, `Bush`, `Ivy`, `Bench`, `Pedestal`, `Brazier`, `Cliff`, `Wall`.
  - `Instruments.tsx`: `Telescope`, `ArmillarySphere`, `CelestialGlobe`, `Hourglass`, `Sundial`, `Abacus`, `Orrery`, `Bookshelf`, `Desk`, `Portal`.
  - `Atmosphere.tsx`: `SkyDome` e `Lights` (presets: `sunset`, `dusk`, `night`, `day`, `cyber`), `Planet`, `CloudSea`, `CloudPuffs`, `FloatingIslands`, `Waterfall`, `Dust`.
  - `materials.ts`: `MAT.*` (materiais compartilhados: pedra, mármore, bronze, ouro, cobre, ferro, madeira, vidro, brilhos `glowWarm`/`glowBlue`/`glowViolet`…). `textures.ts`: texturas procedurais.
  - `puzzle.tsx`: `useOverlay(id, node, deps)` (painel DOM a partir de um componente 3D), `Panel`, `Scope`.
  - `fonts.ts`: `FONT.body | FONT.title | FONT.mono` para `<Text>` do drei.
- `src/game/content/codex.ts` — entradas do Codex (`CODEX`). As da Fase 1 já existem; use os ids existentes.
- `src/game/store.ts` — estado (zustand): `flags`, `quests`, `codex`, `fragments`, `cores`, `objective`, `dialog`…

## Padrão de um nível

```tsx
export default function MinhaArea() {
  useLevel({ spawn: [x, y, z], yaw: Math.PI, scripts: [main, ...hints], minY: -20 })
  return (<>
    <SkyDome preset="day" /><Lights preset="day" />
    ...cenário (com Solid/Block/Ramp para colisão)...
    ...componentes de missões/side quests...
  </>)
}
```

- `spawn` = pés do NEX. `yaw` = para onde ele olha (Math.PI = olhando para -z, "norte").
- Coordenadas em metros. NEX tem ~1,42 m. Porta ≈ 2,1 m. Degrau ≤ 0,2 m (o NEX **não sobe degraus maiores que ~0,3 m**: use `Ramp` ou `Stairs`).
- Tudo que deve bloquear ou servir de chão precisa estar dentro de `<Solid>` (ou ser `Block`/`Ramp`). Malhas decorativas que não devem colidir: `userData={{ noCollide: true }}`.
- Colisão que liga/desliga (ponte que aparece, plataforma que some): renderize o `<Solid>` condicionalmente (montar/desmontar reconstrói o mundo de colisão sozinho).
- Céu/luz próprios: `<SkyDome preset="day" custom={{ zenith: '#...', horizon: '#...', sun: [x,y,z], fog: '#...' }} />` e `<Lights preset="day" custom={{...}} sunI={..} hemiI={..} />`.
- Bordas de penhasco: cerque com `Block` invisível ou balaustradas. Se o NEX cair abaixo de `minY`, ele volta ao último ponto seguro.

## Roteiros (história, missões)

Roteiros são funções `async (c: Ctx) => {...}`. São cancelados quando o jogador sai da área. API principal de `c`:

- `c.say(lines, { ambient? })` — diálogo. `lines` = `{ who: 'NOVA' | 'NEX' | 'SISTEMA', text, choices? }`. `ambient: true` não trava o jogador (fala curta enquanto anda). Sem ambient: trava até o jogador tocar.
- `c.objective(texto, alvo?)` — objetivo na barra + seta + feixe de luz no alvo.
- `c.reach(pos, raio)`, `c.wait(seg)`, `c.until(() => cond)`, `c.waitFlag(k)`.
- `c.cinematic([{ pos, look, dur, cut?, fov? }])` — plano de câmera (primeiro plano com `cut: true` começa nele; sem `cut` parte da câmera atual).
- `c.focus(pos, look, fov)` / `c.unfocus()` — câmera para num objeto (modo quebra-cabeça; o NEX não anda).
- `c.discover(idCodex, nivel?)` — banner "CONCEITO DESCOBERTO" + Codex.
- `c.fragment(id, 'Fragmento: X')`, `c.core(id, 'MATRIX CORE')`, `c.quest(id, 'active' | 'done', 'Nome')`.
- `c.setFlag(k)`, `c.flag(k)`, `c.goto('p1a3')` (vai para outro nível com tela de carregamento), `c.freeze(true/false)`.
- Para iniciar um roteiro a partir de um objeto: `onUse={() => start('id-unico', async (c) => {...})}` (`start` de `engine/script.ts`; não roda duas vezes ao mesmo tempo).
- Fora de roteiro (ex.: dentro de um onClick): `QUICK.discover(...)`, `QUICK.quest(...)`.

Padrão de missão principal com retomada (o progresso fica salvo):

```ts
async function main(c: Ctx) {
  if (!c.flag('a2_intro')) { await c.cinematic([...]); await c.say([...]); c.setFlag('a2_intro') }
  if (!c.flag('a2_passo1')) { c.objective('…', alvo); await c.waitFlag('a2_passo1') }
  ...
  c.objective('Atravesse o portal', posPortal)
}
```

Use prefixo de flags da área: `a2_`, `a3_`… (Área N da Fase 1 = `aN_`). Ids de side quest: os do `registry.ts`.

## Quebra-cabeças

Padrão da Área 1: o componente guarda o estado (useState), `useOverlay` mostra o painel DOM (`<Panel title onExit>`), o 3D reage ao estado. Toques em objetos 3D: `onClick={(e) => { e.stopPropagation(); ... }}` em malhas (para alvos pequenos, uma esfera maior transparente `opacity 0`). Sempre dê uma saída (`onExit`) e feedback claro (SFX + toast `G().showToast(...)`), e explique o erro de forma gentil.

## Regras de narrativa e pedagogia (dos GDDs em `docs/`)

- Primeiro o jogador experimenta, depois entende, por último recebe o nome técnico (via `c.discover`).
- NOVA provoca e guia, não dá aula longa. NEX faz as perguntas que o jogador faria. Falas curtas (1–2 frases).
- Side quests nascem do ambiente: NOVA comenta "Tem alguma coisa estranha aqui." e o jogador investiga. Nunca obrigatórias para terminar a área.
- Português do Brasil, simples, sem jargão sem explicação. Números e exemplos concretos.
- Tudo deve funcionar no celular (toque) e no computador. Painéis cabem em 390 px de largura.

## Qualidade visual

- Estilo: aventura estilizada, iluminação cinematográfica, emissivos + bloom, céu com estrelas, ilhas flutuantes, partículas (`Sparkles`), cada área com identidade própria (ver tabela de ambientes nos GDDs).
- Use `Batch` para decoração estática repetida (menos chamadas de desenho). Evite muitas `pointLight` (no máx. ~6; elas só valem na qualidade alta).
- Crie modelos procedurais próprios (geometrias do three) dentro da pasta da sua área quando precisar.

## Testes

Para não conflitar com outras pessoas trabalhando ao mesmo tempo, faça o build numa pasta própria e sirva numa porta própria:

```bash
cd /home/claude/llm-para-leigos
npx tsc --noEmit -p .
npx vite build --outDir /tmp/build-<area> --emptyOutDir
npx vite preview --outDir /tmp/build-<area> --port <porta> --strictPort &
```

Testes com Playwright (Chromium com swiftshader, já instalado): `args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']`. Para começar direto na sua área, injete um save antes de carregar:

```js
localStorage.setItem('pf-save-v1', JSON.stringify({ level: 'p1a2', flags: { nova: 1 } }))
```

Depois clique em `.title .btn.primary` e espere ~6 s. Ganchos de teste em `window.__pf`: `useGame` (estado), `RT` (ex.: `RT.player.set(x,y,z)` teleporta), `INTERACTS` (ex.: `__pf.INTERACTS.get('id').use()`), `gotoLevel`. Câmera fixa para fotos:

```js
__pf.useGame.setState({ dialog: null, cine: { shots: [{ pos: [px,py,pz], look: [lx,ly,lz], dur: 999, cut: true }], t0: performance.now(), resolve() {}, skippable: false } })
```

Exemplos de scripts de teste: `/tmp/claude-0/-home-claude-llm-para-leigos/17d7b317-a4c2-5297-8e19-87e4be044f2a/scratchpad/t/lib.py`, `cam.py`, `play_a1.py` (copie para sua pasta e ajuste porta/nível).
