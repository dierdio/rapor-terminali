/**
 * clashdle - kart veri uretimi
 *
 * Clash Royale Wiki (Fandom) MediaWiki API'sinden guncel kart verisini cekip
 * src/data/cards.json dosyasini uretir. Elle bakim gerektirmez:
 *
 *   node scripts/build-cards.cjs            # veriyi yenile
 *   node scripts/build-cards.cjs --check    # + resim URL'lerini dogrula
 *
 * Kapsam: YALNIZCA ana oyundaki (normal modda oynanan) kartlar.
 *   - Evrim (Evolution) kartlari haric
 *   - Oyun'dan kaldirilmis kartlar ("Removed Cards" kategorisi) haric
 *
 * Kaynaklar:
 *   - Istatistikler : Clash Royale Wiki (Fandom) - Card Infobox + unit-attributes-table
 *   - Turkce adlar  : RoyaleAPI resmi ceviri verisi (cards_i18n.json) + DeckShop (tr)
 *   - Resimler      : RoyaleAPI CDN (birincil) / Clash Royale Wiki FilePath (yedek)
 */
'use strict'

const fs = require('fs')
const path = require('path')
const https = require('https')

const API = 'https://clashroyale.fandom.com/api.php'
const I18N_URL = 'https://royaleapi.github.io/cr-api-data/json/cards_i18n.json'
const DECKSHOP_URL = 'https://www.deckshop.pro/tr/card/detail/'
const WIKI_FILE_URL = 'https://clashroyale.fandom.com/wiki/Special:FilePath/'

/**
 * Resmi ceviri verisinde (cards_i18n.json) bulunmayan kartlarin Turkce adlari.
 * deckshop.pro'un Turkce sayfalarindan dogrulanmistir (oyun yerellestirmesi).
 */
const UNOFFICIAL_TR_NAMES = {
  Berserker: 'Yaramaz',
  'Boss Bandit': 'Boss Haydut',
  'Goblin Curse': 'Goblin Laneti',
  'Goblin Demolisher': 'Goblin Yıkıcı',
  'Goblin Machine': 'Goblin Makinesi',
  Goblinstein: 'Goblinstein',
  'Little Prince': 'Küçük Prens',
  'Minion Giant': 'Minyon Dev',
  Ronin: 'Ronin',
  'Rune Giant': 'Rün Devi',
  'Spirit Empress': 'Ruh İmparatoriçesi',
  'Suspicious Bush': 'Şüpheli Çalı',
  Vines: 'Sarmaşık',
  Void: 'Boşluk',
}

// Oyunun karsilastirma listesinde yer almayan sayfalar
const EXCLUDE = new Set([
  // Evrim (evolution) kartlari: temel kartlarin guclendirilmis versiyonlari
  'Super Knight', 'Super Archers', 'Super Ice Golem', 'Super Lava Hound',
  'Super Magic Archer', 'Super Mini P.E.K.K.A.', 'Super Witch',
  // Sezon/etkinlik gorselleri (istatistikleri temel kartla ayni)
  'Santa Hog Rider', 'Party Hut', 'Party Rocket',
])

/** Ana oyundan kaldirilmis kartlar (wiki "Removed Cards" kategorisi) */
const REMOVED_CATEGORY = 'Removed Cards'

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { 'User-Agent': 'clashdle-card-builder/1.0 (educational project)' } },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume()
          return resolve(getJson(res.headers.location))
        }
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (c) => (body += c))
        res.on('end', () => {
          try {
            resolve(JSON.parse(body))
          } catch (e) {
            reject(new Error('JSON parse hatasi: ' + e.message))
          }
        })
      }
    )
    req.on('error', reject)
    req.setTimeout(30000, () => req.destroy(new Error('zaman asimi')))
  })
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Wikimetnini okunabilir duz metne cevirir */
function tidy(text) {
  if (text == null) return ''
  return String(text)
    .replace(/\{\{Rarity\|([^|}]*)(\|[^}]*)?}}/g, '$1')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[:?Category:([^\]|]*)\|([^\]]*)\]\]/g, '$2')
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** "Medium (60)" / "Melee: Medium (1.2)" gibi metinden sayiyi cikarir */
function toNumber(value) {
  if (value == null || value === '') return null
  if (typeof value === 'number') return value
  const m = String(value).match(/-?\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : null
}

/** unit-attributes-table: basliklari ve ilk veri satirini eslestirir */
function attributeTable(content) {
  const start = content.indexOf('id="unit-attributes-table"')
  if (start < 0) return null
  const open = content.lastIndexOf('{|', start)
  let depth = 0
  let end = -1
  for (let i = open; i < content.length; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) { end = i + 1; break }
    }
  }
  return end < 0 ? null : content.slice(open, end)
}

function tidyHeader(line) {
  return tidy(
    line.replace(/^!+/, '').replace(/^\s*scope="col"\s*\|/, '').replace(/^\s*width="[^"]*"\s*\|/, '')
  ).replace(/^scope=\S*\s*/, '')
}

function parseAttributes(content) {
  const block = attributeTable(content)
  if (!block) return null
  const lines = block.split('\n').map((l) => l.trim()).filter((l) => l !== '')
  lines.shift() // "{| ... " acilis satiri

  const headers = []
  let i = 0
  while (i < lines.length) {
    const t = lines[i]
    if (t.startsWith('!')) { headers.push(tidyHeader(t)); i++; continue }
    if (t.startsWith('|-')) { i++; break }
    if (t.startsWith('|')) break
    i++
  }

  let row = ''
  while (i < lines.length && !lines[i].startsWith('|-') && !lines[i].startsWith('|}')) {
    if (lines[i].startsWith('|+')) { i++; continue }
    row += (row ? '||' : '') + lines[i].replace(/^\|+/, '')
    i++
  }
  if (!row) return null

  const cells = row.split('||').map(tidy)
  if (!cells.some((c) => c !== '')) return null

  const out = {}
  for (let n = 0; n < headers.length; n++) out[headers[n]] = cells[n] === undefined ? '' : cells[n]
  return out
}

function parseInfobox(content) {
  const m = content.match(/\{\{Card Infobox\|([\s\S]*?)\}\}/)
  if (!m) return {}
  const out = {}
  for (const part of m[1].split('|')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    out[part.slice(0, i).trim()] = part.slice(i + 1).trim()
  }
  return out
}

/** Sayfa gecmissindeki ilk tarih (infobox yoksa yedek) */
function yearFromHistory(content) {
  const hist = content.indexOf('==History==')
  if (hist < 0) return null
  const first = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/.exec(content.slice(hist, hist + 4000))
  return first ? Number(first[3]) : null
}

/**
 * Hedef (target) degerlerini kucuk, karsilastirilabilir bir kumeye indirger.
 * Wiki bazen "Building" (tekil), "Friendly Troops", "King's Tower" gibi
 * destek kartlarina ozel degerler uretir; bunlar tek bir "Special" kategorisine
 * toplanir. Bos deger (saldirmayan binalar, alan bazli buyuler) null kalir ve
 * oyunda "uygun degil" olarak gosterilir.
 */
const TARGET_MAP = {
  Ground: 'Ground',
  Air: 'Air',
  'Air & Ground': 'Air & Ground',
  Buildings: 'Buildings',
  Building: 'Buildings',
  'Friendly Troops': 'Special',
  'Friendly Troops & Buildings': 'Special',
  "King's Tower": 'Special',
}

/** RoyaleAPI dosya anahtari: "P.E.K.K.A." -> "pekka", "Mini P.E.K.K.A." -> "mini-pekka" */
function imageKey(nameEn) {
  return nameEn
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/['`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Kartin wiki goruntu dosyasini sec: "Minion Giant" -> "MinionGiantCard.png" */
function pickCardImage(files, nameEn) {
  if (!files || !files.length) return null
  const flat = nameEn.replace(/[^a-zA-Z0-9]+/g, '')
  const exact = files.find((f) => f.replace(/[^a-zA-Z0-9]+/g, '') === flat + 'Card')
  if (exact) return exact
  const generic = files.find((f) => /Card\.png$/i.test(f))
  return generic || null
}

/** i18n anahtari: genellikle resim anahtariyla ayni */
const keyOf = imageKey

/** Objede tanimli ilk anahtarin degerini dondurur */
const pick = (obj, names) => {
  for (const n of names) {
    const v = obj && obj[n]
    if (v !== undefined && v !== null && v !== '') return v
  }
  return ''
}

async function main() {
  const checkImages = process.argv.includes('--check')

  process.stdout.write('1) Kart sayfalari toplaniyor...\n')
  const all = new Set()
  for (const cat of ['Troop Cards', 'Building Cards', 'Spell Cards']) {
    let cont = null
    do {
      const url =
        API + '?action=query&list=categorymembers&cmtitle=' +
        encodeURIComponent('Category:' + cat) +
        '&cmlimit=500&cmtype=page&format=json&formatversion=2' +
        (cont ? '&cmcontinue=' + encodeURIComponent(cont) : '')
      const d = await getJson(url)
      const cm = d.query && d.query.categorymembers
      if (cm) cm.forEach((m) => all.add(m.title))
      cont = d.continue && d.continue.cmcontinue ? d.continue.cmcontinue : null
    } while (cont)
    process.stdout.write('   ' + cat + ' okundu\n')
  }

  const titles = [...all]
    .filter((t) => !t.includes('/'))
    .filter((t) => !EXCLUDE.has(t))
    .sort((a, b) => a.localeCompare(b))

  process.stdout.write('\n2) Resmi ceviri verisi okunuyor (cards_i18n.json)...\n')
  const i18n = await getJson(I18N_URL)
  const trNames = {}
  for (const c of i18n) {
    const tr = c._lang && c._lang.name && c._lang.name.tr
    if (!tr) continue
    if (c.key) trNames[c.key] = tr
    if (c.name) trNames[c.name.replace(/\.$/, '')] = tr
  }
  process.stdout.write('   ' + i18n.length + ' ceviri kaydi\n')

  process.stdout.write('\n3) Wikimetinler okunuyor (' + titles.length + ' kart)...\n')
  const contents = {}
  const fallback = {}
  for (let i = 0; i < titles.length; i += 20) {
    const chunk = titles.slice(i, i + 20)
    const url =
      API + '?action=query&prop=revisions&titles=' + encodeURIComponent(chunk.join('|')) +
      '&rvprop=content&rvslots=main&format=json&formatversion=2&redirects=1'
    const d = await getJson(url)
    for (const r of (d.query && d.query.redirects) || []) fallback[r.from] = r.to
    for (const p of (d.query && d.query.pages) || []) {
      const rev = p.revisions && p.revisions[0]
      const c = rev && rev.slots && rev.slots.main ? rev.slots.main.content : ''
      if (c) contents[p.title] = c
    }
    process.stdout.write('   ' + Math.min(i + 20, titles.length) + '/' + titles.length + '\n')
    await sleep(300)
  }

  // Kategoriler ve kart goruntu dosyalari: light sorgu (budanmis icerik yok)
  process.stdout.write('   kategori + goruntu dosyalari okunuyor...\n')
  const categories = {}
  const images = {}
  for (let i = 0; i < titles.length; i += 20) {
    const chunk = titles.slice(i, i + 20)
    let cont = null
    do {
      const url =
        API + '?action=query&prop=categories|images&titles=' + encodeURIComponent(chunk.join('|')) +
        '&cllimit=500&imlimit=500&format=json&formatversion=2&redirects=1' +
        (cont ? '&' + cont : '')
      const d = await getJson(url)
      for (const p of (d.query && d.query.pages) || []) {
        if (p.categories) categories[p.title] = p.categories.map((x) => x.title.replace('Category:', ''))
        if (p.images) {
          images[p.title] = (images[p.title] || []).concat(
            p.images.map((x) => x.title.replace('File:', ''))
          )
        }
      }
      cont = d.continue
        ? Object.entries(d.continue).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&')
        : null
    } while (cont)
    await sleep(300)
  }

  process.stdout.write('\n4) Kartlar ayristiriliyor...\n')
  const cards = []
  const problems = []
  const skipped = []
  for (const title of titles) {
    const resolved = fallback[title] || title
    const content = contents[resolved] || contents[title]
    if (!content) {
      problems.push(title + ' (sayfa okunamadi)')
      continue
    }
    // Ana oyundan kaldirilmis kartlar atlanir
    const cats = categories[resolved] || categories[title] || []
    if (cats.includes(REMOVED_CATEGORY)) {
      skipped.push(title + ' (oyundan kaldirilmis)')
      continue
    }
    const info = parseInfobox(content)
    const attrs = parseAttributes(content) || {}
    const nameEn = title.replace(/\.$/, '')
    const officialTr = trNames[keyOf(nameEn)] || trNames[nameEn] || null
    const nameTr = officialTr || UNOFFICIAL_TR_NAMES[nameEn] || tidy((content.match(/[|{]tr=([^|}]*)/) || [])[1]).trim() || null
    const officialFlag = officialTr ? true : nameTr ? false : null

    const cost = toNumber(pick(attrs, ['Cost']) || info.Cost)
    const rarity = pick(info, ['Rarity']) || pick(attrs, ['Rarity'])
    const type = pick(info, ['Type']) || pick(attrs, ['Type'])
    const target = pick(attrs, ['Target'])
    const speed = toNumber(pick(attrs, ['Speed']))
    const range = toNumber(pick(attrs, ['Range', 'Radius']))
    const hitSpeed = toNumber(pick(attrs, ['Hit Speed', 'Hit Speed (Stage 1)']))
    const transport = pick(attrs, ['Transport'])
    const release = /\d{4}/.exec(info.ReleaseDate || '')
    const year = release ? Number(release[0]) : yearFromHistory(content)

    const missing = [
      cost == null ? 'cost' : '', !rarity ? 'rarity' : '', !type ? 'type' : '',
    ].filter(Boolean)
    if (missing.length) {
      problems.push(nameEn + ' (eksik: ' + missing.join(', ') + ')')
      continue
    }

    cards.push({
      key: imageKey(nameEn),
      name: nameEn,
      name_tr: nameTr || null,
      name_tr_official: officialFlag,
      name_tr_source: officialTr ? 'royaleapi' : nameTr ? 'deckshop' : null,
      /** RoyaleAPI CDN'inde yoksa wiki dosya adiyla yedek resim */
      img_wiki: pickCardImage(images[resolved] || images[title], nameEn),
      cost,
      rarity,
      type,
      target: target ? TARGET_MAP[target] || null : null,
      range,
      hit_speed: hitSpeed,
      speed,
      flying: transport ? transport === 'Air' : null,
      release_year: year,
      arena: info.Arena || null,
    })
  }

  if (problems.length) {
    process.stdout.write('\n! Sorunlu kartlar:\n')
    problems.forEach((p) => process.stdout.write('   - ' + p + '\n'))
  }
  if (skipped.length) {
    process.stdout.write('\n! Kapsam disi (ana oyunda yok):\n')
    skipped.forEach((s) => process.stdout.write('   - ' + s + '\n'))
  }

  cards.forEach((c, i) => (c.id = i + 1))
  const payload = {
    meta: {
      source: 'Clash Royale Wiki (Fandom) - https://clashroyale.fandom.com',
      generated_at: new Date().toISOString().slice(0, 10),
      card_count: cards.length,
      attributes: ['cost', 'rarity', 'type', 'target', 'range', 'hit_speed', 'speed', 'release_year'],
    },
    cards,
  }

  const outFile = path.join(__dirname, '..', 'src', 'data', 'cards.json')
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + '\n', 'utf8')

  const counts = (key) => {
    const m = {}
    cards.forEach((c) => (m[c[key]] = (m[c[key]] || 0) + 1))
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ':' + v).join('  ')
  }
  process.stdout.write('\n4) ' + cards.length + ' kart yazildi -> src/data/cards.json\n')
  process.stdout.write('   tur: ' + counts('type') + '\n')
  process.stdout.write('   nadirlik: ' + counts('rarity') + '\n')
  process.stdout.write('   hedef: ' + counts('target') + '\n')
  process.stdout.write('   turkce ad bilinen: ' + cards.filter((c) => c.name_tr).length + '/' + cards.length +
    ' (resmi: ' + cards.filter((c) => c.name_tr_official === true).length +
    ', gecici: ' + cards.filter((c) => c.name_tr_official === false).length + ')\n')
  process.stdout.write('   yil bilinen: ' + cards.filter((c) => c.release_year).length + '/' + cards.length + '\n')
  process.stdout.write('   hiz bilinen: ' + cards.filter((c) => c.speed != null).length + '/' + cards.length + '\n')
  process.stdout.write('   menzil bilinen: ' + cards.filter((c) => c.range != null).length + '/' + cards.length + '\n')
  process.stdout.write('   vurus hizi bilinen: ' + cards.filter((c) => c.hit_speed != null).length + '/' + cards.length + '\n')

  if (checkImages) {
    process.stdout.write('\n5) Resim URL dogrulamasi...\n')
    const bad = []
    for (const c of cards) {
      const url = 'https://royaleapi.github.io/cr-api-assets/cards/' + c.key + '.png'
      const ok = await new Promise((resolve) => {
        const req = https.request(url, { method: 'HEAD' }, (r) => { r.resume(); r.on('end', () => resolve(r.statusCode === 200)) })
        req.on('error', () => resolve(false))
        req.end()
      })
      if (!ok) bad.push(c.key)
    }
    process.stdout.write(bad.length ? '   EKSIK: ' + bad.join(', ') + '\n' : '   tum resimler erisilebilir\n')
  }
}

main().catch((e) => {
  process.stderr.write('HATA: ' + e.message + '\n')
  process.exit(1)
})
