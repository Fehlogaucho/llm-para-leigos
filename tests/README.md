# Testes

## Testes de unidade (rápidos, sem navegador)

```bash
npm test
```

Empacota cada `tests/unit/*.test.ts` com o rolldown (o mesmo motor do Vite) e roda com `node --test`. Cobrem:

- `content.test.ts`: documentos completos com fontes e notas, verbetes e links do Codex, prova final, avaliações do modo piloto e frases corrigidas que não podem voltar;
- `models.test.ts`: tokenizadores, temperatura, modelinho de 27 pesos, MiniLM (perda, memória, palavras nunca vistas) e a busca do RAG;
- `save.test.ts`: save válido, incompleto, inválido e antigo;
- `chapters.test.ts`: entrada direta em todas as missões pelo menu “Capítulos e missões”.

## Testes de ponta a ponta (jogam de verdade, no Chromium)

Precisam de Python 3 com Playwright e de um build servido na porta 4173:

```bash
npx vite build --outDir /tmp/build-main --emptyOutDir
npx vite preview --outDir /tmp/build-main --port 4173 &
python3 tests/e2e/smoke.py --quick   # tela inicial, save danificado, piloto, acessibilidade, capítulos
python3 tests/e2e/play_p1.py         # Fase 1 inteira
python3 tests/e2e/play_p2.py         # Fase 2 inteira
python3 tests/e2e/play_p3.py --pilot # Fase 3, final e métricas do modo piloto
```

- `--mobile` usa a tela de um celular (390×844, toque); `--shots` salva capturas em `tests/e2e/out/` (ou em `PF_SHOTS`).
- `PF_URL` aponta para outro endereço (ex.: `PF_URL=https://llm-para-leigos.pages.dev/`).
- Não refaça o build enquanto um teste roda: os arquivos mudam de nome e a página quebra.
- Cada teste imprime uma linha por verificação e sai com erro se alguma falhar.
