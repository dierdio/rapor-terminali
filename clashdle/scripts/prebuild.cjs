/**
 * Derleme oncesi hazirlik:
 *   1. assets/ klasorundeki eski hash'li ciktilari temizler (uretim ciktisi
 *      klasorun kendisine yazildigi icin dist/ kullanilmiyor)
 *   2. public/ icindeki statik dosyalari ciktiya kopyalar (Vite, outDir ile
 *      publicDir ayni klasor oldugunda bunu otomatik yapamiyor)
 *
 * Kullanim: npm run build  (vite'ten once otomatik calisir)
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

function rimraf(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (fs.statSync(full).isDirectory()) rimraf(full)
    else fs.unlinkSync(full)
  }
  fs.rmdirSync(dir)
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true })
  let count = 0
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name)
    const dest = path.join(to, entry.name)
    if (entry.isDirectory()) count += copyDir(src, dest)
    else {
      fs.copyFileSync(src, dest)
      count++
    }
  }
  return count
}

let cleaned = 0
const assetsDir = path.join(ROOT, 'assets')
if (fs.existsSync(assetsDir)) {
  for (const file of fs.readdirSync(assetsDir)) {
    fs.unlinkSync(path.join(assetsDir, file))
    cleaned++
  }
}
console.log(cleaned ? '  temizlendi: ' + cleaned + ' eski dosya (assets/)' : '  assets/ temiz')

const publicDir = path.join(ROOT, 'public')
if (fs.existsSync(publicDir)) {
  const copied = copyDir(publicDir, ROOT)
  console.log('  kopyalandi: ' + copied + ' statik dosya (public/ -> /)')
}

// Gelistirme giris dosyasini sablondan uret (onceki derleme onu ezmis olabilir)
const template = path.join(ROOT, 'dev.template.html')
if (fs.existsSync(template)) {
  fs.copyFileSync(template, path.join(ROOT, 'dev.html'))
  console.log('  dev.template.html -> dev.html')
}
