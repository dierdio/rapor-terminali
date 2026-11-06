/**
 * vercel.json rewrite kurallarini yerelde simule eder:
 *   /clashdle/assets/(.*) -> /clashdle/dist/assets/$1
 *   /clashdle/(.*)        -> /clashdle/dist/$1
 * Kullanim: node serve-root.cjs <port>
 */
'use strict'
const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const PORT = Number(process.argv[2]) || 5199

const RULES = [
  { source: /^\/clashdle\/assets\/(.*)$/, destination: '/clashdle/dist/assets/$1' },
  { source: /^\/clashdle\/(.*)$/, destination: '/clashdle/dist/$1' },
]

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json',
}

http
  .createServer((req, res) => {
    const url = req.url.split('?')[0]
    let filePath = url

    for (const rule of RULES) {
      const m = rule.source.exec(url)
      if (m) {
        filePath = rule.destination.replace(/\$(\d)/, (_, n) => m[n])
        break
      }
    }

    const full = path.join(ROOT, filePath)
    if (full.endsWith(path.sep) || full === ROOT) {
      const idx = path.join(full, 'index.html')
      if (fs.existsSync(idx)) return send(idx)
      return notFound(res)
    }
    if (!fs.existsSync(full)) {
      const idx = path.join(path.dirname(full), 'index.html')
      if (fs.existsSync(idx)) return send(idx)
      return notFound(res)
    }
    send(full)

    function send(p) {
      const body = fs.readFileSync(p)
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' })
      res.end(body)
    }
    function notFound(r) {
      r.writeHead(404, { 'Content-Type': 'text/plain' })
      r.end('404 ' + url)
    }
  })
  .listen(PORT, () => console.log('http://localhost:' + PORT + '/clashdle/'))
