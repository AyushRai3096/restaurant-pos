import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      // better-sqlite3 is a compiled .node binary. Vite cannot bundle it, so it
      // stays external and is loaded from node_modules at runtime.
      external: ['better-sqlite3'],
    },
  },
});
