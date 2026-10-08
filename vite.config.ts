import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020', chunkSizeWarningLimit: 3000, assetsInlineLimit: 0, sourcemap: false,
    // duas versões: a nova (2D, pixel art) na raiz e a 3D em /3d/
    rollupOptions: { input: { main: resolve(__dirname, 'index.html'), v3d: resolve(__dirname, '3d/index.html') } },
  },
  server: { host: true },
})
