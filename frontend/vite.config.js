// frontend/vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',     // Carpeta de salida
    emptyOutDir: true,
  },
  // Si sirves desde FastAPI en /static:
  base: '/static/',    // <-- Importante si FastAPI sirve los archivos estáticos
})