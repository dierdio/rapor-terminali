import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Production çıktısı dierdio.com/mctimeline/ altında çalışır. */
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/mctimeline/' : '/',
  server: {
    port: 5184,
  },
}))
