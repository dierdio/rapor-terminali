import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Bağımsız domain/subdomain deployment için kök path kullanır. */
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5184,
  },
})
