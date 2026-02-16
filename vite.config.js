import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  root: __dirname,
  publicDir: 'public',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    // 토큰 교환: 같은 출처로 호출 → Vite가 localhost:4000 으로 프록시 (샌드박스에서 포트 4000 직접 접속 불필요)
    proxy: {
      '/get-access-token': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/get-user-info': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
  },
})
