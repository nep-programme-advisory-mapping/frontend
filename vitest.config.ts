import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.spec.ts', 'tests/component/**/*.spec.ts'],
    // The default 'forks' pool spawns child processes, which some sandboxed
    // CI/dev environments block outright (it just hangs until timeout).
    // 'threads' needs no process spawn and runs the same tests fine.
    pool: 'threads',
  },
})
