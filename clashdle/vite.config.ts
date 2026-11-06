import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Uygulama dierdio.com/clashdle/ altinda yayinlanir
  base: '/clashdle/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5183,
  },
  preview: {
    port: 5183,
  },
})
