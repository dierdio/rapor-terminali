/**
 * RoyaleAPI CDN'inde olmayan (404) kart gorsellerini Clash Royale Wiki'den
 * indirip public/cards/ altina kaydeder ve kart verisinde img_local olarak
 * isaretler.
 *
 *   node scripts/fetch-fallback-images.cjs            # yalnizca eksikler
 *   node scripts/fetch-fallback-images.cjs --force    # tumunu yenile
 */
'use strict'
const fs = require('fs')
const path = require('path')
const https = require('https')

const ROOT = path.join(__dirname, '..')
const DATA_FILE = path.join(ROOT, 'src', 'data', 'cards.json')
const OUT_DIR = path.join(ROOT, 'public', 'cards')
const CDN = 'https://royaleapi.github.io/cr-api-assets/cards/'
const WIKI_FILE = 'https://clashroyale.fandom.com/wiki/Special:FilePath/'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

function request(url, binary) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': UA,
          Accept: 'image/avif,image/webp,image/png,*/*;q=0.8',
          Referer: 'https://clashroyale.fandom.com/',
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume()
          return resolve(request(res.headers.location, binary))
        }
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const body = binary ? Buffer.concat(chunks) : Buffer.concat(chunks).toString('utf8')
          resolve({ status: res.statusCode, type: res.headers['content-type'] || '', body })
        })
      }
    )
    req.on('error', reject)
    req.setTimeout(30000, () => req.destroy(new Error('zaman asimi')))
  })
}

async function main() {
  const force = process.argv.includes('--force')
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  fs.mkdirSync(OUT_DIR, { recursive: true })

  let downloaded = 0
  let missing = []

  for (const card of data.cards) {
    const cdn = CDN + card.key + '.png'
    const head = await request(cdn, false).catch(() => ({ status: 0, body: '' }))
    if (head.status === 200 && !force) continue

    if (!card.img_wiki) {
      missing.push(card.name + ' (wiki dosyasi yok)')
      continue
    }
    // 1) Wiki'nin dogrudan static adresi (tam boy, diger kartlarla ayni cozunurluk)
    // 2) DeckShop karti
    let file = null
    const infoUrl =
      'https://clashroyale.fandom.com/api.php?action=query&titles=File:' +
      encodeURIComponent(card.img_wiki) +
      '&prop=imageinfo&iiprop=url&format=json&formatversion=2'
    const info = await request(infoUrl, false).catch(() => null)
    if (info && info.status === 200) {
      try {
        const parsed = JSON.parse(info.body)
        const direct = (parsed.query.pages || [])[0]?.imageinfo?.[0]?.url
        if (direct) {
          file = await request(direct, true).catch(() => null)
          if (file && (file.status !== 200 || !/^image\//.test(file.type))) file = null
        }
      } catch {}
    }
    if (!file) {
      const flat = card.name.replace(/[^a-zA-Z0-9]+/g, '')
      for (const src of ['https://www.deckshop.pro/img/c/' + flat + '.png']) {
        file = await request(src, true).catch(() => null)
        if (file && (file.status !== 200 || !/^image\//.test(file.type))) file = null
        else break
      }
    }
    if (!file) {
      missing.push(card.name + ' (goruntu indirilemedi)')
      continue
    }
    const ext = /png/.test(file.type) ? 'png' : /webp/.test(file.type) ? 'webp' : /jpe?g/.test(file.type) ? 'jpg' : 'img'
    fs.writeFileSync(path.join(OUT_DIR, card.key + '.' + ext), file.body)
    card.img_local = card.key + '.' + ext
    downloaded++
    process.stdout.write('  indirildi: ' + card.name + ' -> cards/' + card.img_local + ' (' + Math.round(file.body.length / 1024) + ' KB)\n')
  }

  data.cards.forEach((c) => { if (!c.img_local) delete c.img_local })
  data.meta.image_fallback = `${downloaded} yerel gorsel (public/cards)`
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8')

  process.stdout.write('\n' + downloaded + ' gorsel indirildi -> public/cards\n')
  if (missing.length) {
    process.stdout.write('! Cozulemeyen:\n')
    missing.forEach((m) => process.stdout.write('   - ' + m + '\n'))
  }
}

main().catch((e) => { console.error('HATA', e.message); process.exit(1) })
