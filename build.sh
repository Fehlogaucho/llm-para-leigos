#!/bin/bash
# Monta o jogo num arquivo só: dist/index.html
# Uso: bash build.sh   (o Cloudflare Pages roda este comando a cada mudança no GitHub)
set -e
cd "$(dirname "$0")"
THREE="https://cdn.jsdelivr.net/npm/three@0.147.0"
# A ordem importa: motor e interface primeiro, depois as 12 fases, e main.js por último.
FILES="engine concepts hud ui2d mini3d models c01_vitrine c02_passado c03_prever c04_tokens museu_base c05_matrizes c06_treino galaxia_base c07_universo c08_atencao c09_ajustes c10_rag c11_crie c12_formatura main"
mkdir -p dist
{
  printf '<!doctype html>\n<html lang="pt-BR">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="description" content="Jogo em português que ensina, fase a fase, como funcionam as LLMs.">\n'
  cat src/head.html src/body.html
  echo "<script src=\"$THREE/build/three.min.js\"></script>"
  echo "<script src=\"$THREE/examples/js/controls/OrbitControls.js\"></script>"
  echo "<script src=\"$THREE/examples/js/environments/RoomEnvironment.js\"></script>"
  echo "<script>"
  for f in $FILES; do cat "src/$f.js"; done
  echo "</script>"
  echo "</html>"
} > dist/index.html
echo "dist/index.html: $(wc -c < dist/index.html) bytes"
