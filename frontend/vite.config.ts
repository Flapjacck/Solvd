import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // cubing.js runs scramble generation in a module web worker
  worker: { format: 'es' },
  // pre-bundling breaks cubing's worker entry files, so serve it as-is
  optimizeDeps: { exclude: ['cubing'] },
})
