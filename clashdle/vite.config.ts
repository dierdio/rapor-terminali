import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Uygulama dierdio.com/clashdle/ adresinden yayinlanir.
 *
 * Vercel bu depoyu derlemeden statik olarak yayinladigi icin derleme ciktisi
 * clashdle/ klasorunun kendisine yazilir (outDir: '.'). Boylece:
 *   clashdle/index.html   -> https://dierdio.com/clashdle/
 *   clashdle/assets/*     -> https://dierdio.com/clashdle/assets/*
 *   clashdle/cards/*      -> https://dierdio.com/clashdle/cards/* *
 * Giris dosyasi dev.html'dir; uretim ciktisi postbuild.cjs ile index.html
 * olarak yeniden adlandirilir. Boylece kaynak ile cikti cakismaz.
 */
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/clashdle/' : '/',
  build: {
    // Derleme ciktisi klasorun kendisine yazilir
    outDir: '.',
    // src/, scripts/, dev.template.html silinmesin
    emptyOutDir: false,
    rollupOptions: {
      input: 'dev.html',
      output: {
        // Giris dosyasi dev.html oldugu icin dosya adlari "dev-" ile baslamasin
        entryFileNames: 'assets/index-[hash].js',
        chunkFileNames: 'assets/index-[hash].js',
        assetFileNames: 'assets/index-[hash].[ext]',
      },
    },
  },
  server: {
    port: 5183,
    open: '/dev.html',
  },
  preview: {
    port: 5183,
    open: '/index.html',
  },
}))
