#!/bin/bash
# Monta o jogo para o Cloudflare Pages (comando de build: bash build.sh, saída: dist)
set -e
cd "$(dirname "$0")"
npm ci --no-audit --no-fund
npm run build
echo "pronto: dist/"
