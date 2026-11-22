import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Ana DIERDIO reposunda /mctimeline/ altında yayınlanır. */
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/mctimeline/' : '/',
  build: {
    // Ana repo build sırasında public/mctimeline içine kopyalanır.
    outDir: '../public/mctimeline',
    emptyOutDir: true,
  },
  server: {
    port: 5184,
  },
}))
