/**
 * Repoyu statik olarak sunar (Vercel davranisini taklit eder).
 * Clashdle derleme ciktisi dogrudan clashdle/ kokune yazildigi icin
 * rewrite gerekmez: /clashdle/ -> clashdle/index.html
 *
 *   node scripts/serve-root.cjs 5199   -> http://localhost:5199/clashdle/
 */
'use strict'
const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const PORT = Number(process.argv[2]) || 5199

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json',
}

function resolveFile(urlPath) {
  const clean = urlPath.split('?')[0]
  let filePath = clean

  if (clean.endsWith('/')) filePath += 'index.html'
  else if (!path.extname(clean)) filePath += '/index.html'

  const full = path.join(ROOT, filePath)
  if (fs.existsSync(full) && fs.statSync(full).isFile()) return full

  const idx = path.join(path.dirname(full), 'index.html')
  if (fs.existsSync(idx)) return idx
  return null
}

http
  .createServer((req, res) => {
    const target = resolveFile(req.url)
    if (!target) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('404 ' + req.url)
      return
    }
    const body = fs.readFileSync(target)
    res.writeHead(200, { 'Content-Type': MIME[path.extname(target)] || 'application/octet-stream' })
    res.end(body)
  })
  .listen(PORT, () => console.log('http://localhost:' + PORT + '/clashdle/'))
