import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Ana DIERDIO reposunda /mctimeline/ altında yayınlanır. */
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/mctimeline/' : '/',
  build: {
    // Vercel ana repoyu statik yayınladığı için çıktıyı bu klasöre yazarız.
    outDir: '.',
    emptyOutDir: false,
  },
  server: {
    port: 5184,
  },
}))
