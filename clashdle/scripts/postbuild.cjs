/**
 * Derleme sonrasi:
 *   1. Vite'in urettigi dev.html dosyasini index.html olarak yeniden adlandirir
 *      (https://dierdio.com/clashdle/ adresi bu dosyayi arar)
 *   2. Gelistirme girisi olan dev.html'i sablondan yeniden olusturur
 *
 * Kullanim: npm run build  (vite'ten sonra otomatik calisir)
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const BUILT = path.join(ROOT, 'dev.html')
const FINAL = path.join(ROOT, 'index.html')
const TEMPLATE = path.join(ROOT, 'dev.template.html')

if (fs.existsSync(BUILT)) {
  fs.renameSync(BUILT, FINAL)
  console.log('  dev.html -> index.html')
} else {
  console.log('  ! dev.html bulunamadi (derleme basarisiz olabilir)')
}

if (fs.existsSync(TEMPLATE)) {
  fs.copyFileSync(TEMPLATE, path.join(ROOT, 'dev.html'))
  console.log('  dev.template.html -> dev.html (gelistirme girisi)')
}
