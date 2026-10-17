import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const backend = process.env.API_TARGET || 'http://127.0.0.1:3000'
const media = process.env.MEDIA_TARGET || 'http://127.0.0.1:8888'
const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'mobile' ? [{
      name: 'copy-exercise-media-for-mobile',
      closeBundle() {
        cpSync(resolve(root, '../media/img'), resolve(root, 'dist/img'), { recursive: true })
        cpSync(resolve(root, '../media/gif'), resolve(root, 'dist/gif'), { recursive: true })
      },
    }] : []),
  ],
  base: './',
  server: {
    proxy: {
      '/api': { target: backend, changeOrigin: true },
      '/img': { target: media, changeOrigin: true },
      '/gif': { target: media, changeOrigin: true }
    }
  },
  build: { chunkSizeWarningLimit: 1500 }
}))
