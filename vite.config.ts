import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET ||
    (apiBaseUrl.startsWith('http') ? apiBaseUrl.replace(/\/api\/?$/, '') : 'http://localhost:8000')

  return {
    plugins: [
      vue(),
      tailwindcss(),
      vueDevTools(),
    ],

    esbuild: {
      drop: ['console', 'debugger'],
    } as any,

    build: {
      sourcemap: false,
      minify: 'esbuild',
    },

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/broadcasting': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/sanctum': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
