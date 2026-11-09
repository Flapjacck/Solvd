import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // cubing.js runs scramble generation in a module web worker
  worker: { format: 'es' },
  build: {
    // Production-only fix: scrambles never generated in the built site ("document is not defined").
    // cubing's scramble worker loads chunks with Vite's preload helper, which reads `document`,
    // and the worker even ended up importing the app's entry chunk. Three things avoid that:
    // - one stylesheet, so no chunk lists CSS as a dependency
    // - no preload hints for dynamic imports made from worker chunks
    // - the cubing code shared by the app and the worker lives in its own chunk, not the entry
    cssCodeSplit: false,
    modulePreload: {
      resolveDependencies: (_file, deps, { hostId }) => (/worker|inside|twips|search|dynamic/i.test(hostId) ? [] : deps),
    },
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [{ name: 'cubing-core', test: /node_modules[\\/]cubing[\\/](?!.*(dynamic|twisty|twips|wasm|puzzle-geometry))/ }],
        },
      },
    },
  },
  // pre-bundling breaks cubing's worker entry files, so serve it as-is
  optimizeDeps: { exclude: ['cubing'] },
})
