/**
 * clashdle - saf oyun mantigi (React'tan bagimsiz)
 *
 * Buradaki fonksiyonlarin hicbiri DOM'a dokunmaz; bu sayede test edilebilir
 * ve kullanicinin tahmin verisi ile gercek kart verisi birbirine karismaz.
 */
import cardsData from '../data/cards.json'
import type { Card, CardDataset } from '../types'

export const CARDS: Card[] = (cardsData as unknown as CardDataset).cards
export const CARD_META = (cardsData as unknown as CardDataset).meta

/** Resim adresi: RoyaleAPI'nin statik CDN'i */
export const cardImage = (key: string) =>
  `https://royaleapi.github.io/cr-api-assets/cards/${key}.png`

/**
 * Kartin goruntuleri, denenme sirasiyla:
 *   1. RoyaleAPI CDN (keskin ve hizli)
 *   2. Yerel gorsel (CDN'de olmayan yeni kartlar icin public/cards)
 */
export function cardImages(card: Card): string[] {
  const urls = [cardImage(card.key)]
  if (card.img_local) {
    urls.push(`/clashdle/cards/${card.img_local}`)
  }
  return urls
}

/* --- Karsilastirilan ozellikler ------------------------------------------- */

export type AttrKey =
  | 'cost'
  | 'rarity'
  | 'type'
  | 'target'
  | 'range'
  | 'hit_speed'
  | 'speed'
  | 'release_year'

export type CompareStatus = 'correct' | 'low' | 'high' | 'na'

export interface AttributeDef {
  key: AttrKey
  /** Tablo basligi */
  label: string
  /** "Nasil oynanir" ekranindaki aciklama */
  hint: string
  value: (card: Card) => number | string | null
}

const RARITY_ORDER: Record<string, number> = {
  Common: 1, Rare: 2, Epic: 3, Legendary: 4, Champion: 5,
}
const TYPE_ORDER: Record<string, number> = {
  Spell: 1, Building: 2, Troop: 3,
}
const TARGET_ORDER: Record<string, number> = {
  Buildings: 1, Ground: 2, Air: 3, 'Air & Ground': 4, Special: 5,
}

const ORDERS: Partial<Record<AttrKey, Record<string, number>>> = {
  rarity: RARITY_ORDER,
  type: TYPE_ORDER,
  target: TARGET_ORDER,
}

/** Oyunun kendi Turkce yerellestirme etiketleri (RoyaleAPI oyun verisi / texts.json) */
export const RARITY_LABEL: Record<string, string> = {
  Common: 'Sıradan', Rare: 'Ender', Epic: 'Destansı', Legendary: 'Efsanevi', Champion: 'Şampiyon',
}
export const TYPE_LABEL: Record<string, string> = {
  Troop: 'Birlik', Building: 'Bina', Spell: 'Büyü',
}
export const TARGET_LABEL: Record<string, string> = {
  Buildings: 'Binalar', Ground: 'Kara', Air: 'Hava', 'Air & Ground': 'Hava ve Kara', Special: 'Özel',
}
export const SPEED_LABEL: Record<number, string> = {
  45: 'Yavaş', 60: 'Orta', 90: 'Hızlı', 120: 'Çok Hızlı',
}

/** Sayiyi Turkce 1 ondalikli yazar */
const num = (v: number) => v.toLocaleString('tr-TR', { maximumFractionDigits: 1 })

const labelOf = (map: Record<string, string>, value: string | null) =>
  value == null ? null : map[value] ?? value

export const ATTRIBUTES: AttributeDef[] = [
  {
    key: 'cost', label: 'İksir',
    hint: 'Kartın iksir maliyeti. Yeşil = aynı, kırmızı + ok = daha yüksek/düşük.',
    value: (c) => c.cost,
  },
  {
    key: 'rarity', label: 'Nadirlik',
    hint: 'Sıradan < Ender < Destansı < Efsanevi < Şampiyon sırasına göre karşılaştırılır.',
    value: (c) => c.rarity,
  },
  {
    key: 'type', label: 'Tür',
    hint: 'Büyü < Bina < Birlik sırasına göre karşılaştırılır.',
    value: (c) => c.type,
  },
  {
    key: 'target', label: 'Hedef',
    hint: 'Kartın vurabildiği hedef: Kara, Hava, Hava ve Kara, Binalar veya Özel (dost birlikler/kule).',
    value: (c) => c.target,
  },
  {
    key: 'range', label: 'Menzil',
    hint: 'Menzil kare cinsindendir. Büyülerde etki alanı yarıçapı gösterilir.',
    value: (c) => c.range,
  },
  {
    key: 'hit_speed', label: 'Vuruş Hızı',
    hint: 'Saldırı aralığı (saniye). Yalnızca saldıran kartlarda vardır.',
    value: (c) => c.hit_speed,
  },
  {
    key: 'speed', label: 'Hız',
    hint: 'Hareket hızı: Yavaş < Orta < Hızlı < Çok hızlı. Yalnızca birliklerde vardır.',
    value: (c) => c.speed,
  },
  {
    key: 'release_year', label: 'Çıkış Yılı',
    hint: 'Kartın oyuna eklendiği yıl.',
    value: (c) => c.release_year,
  },
]

/** Ozelligin ekranda gosterilen degeri */
export function formatAttr(attr: AttributeDef, card: Card): string {
  const v = attr.value(card)
  if (v == null) return '—'
  switch (attr.key) {
    case 'cost': return String(v)
    case 'rarity': return labelOf(RARITY_LABEL, v as string) as string
    case 'type': return labelOf(TYPE_LABEL, v as string) as string
    case 'target': return labelOf(TARGET_LABEL, v as string) as string
    case 'range': return `${num(v as number)}`
    case 'hit_speed': return `${num(v as number)} sn`
    case 'speed': return SPEED_LABEL[v as number] ?? `${v}`
    case 'release_year': return String(v)
    default: return String(v)
  }
}

/**
 * Bir ozelligi karsilastirir.
 * 'na'  : iki taraftan en az biri bu ozellige sahip degil (not: karar verme)
 * 'correct' : tam eslesme
 * 'low' / 'high' : tahmin cevaptan kucuk / buyuk
 */
export function compareAttr(attr: AttributeDef, guess: Card, answer: Card): CompareStatus {
  const g = attr.value(guess)
  const a = attr.value(answer)
  if (g == null || a == null) return 'na'
  if (g === a) return 'correct'

  if (typeof g === 'number' && typeof a === 'number') return g < a ? 'low' : 'high'

  const order = ORDERS[attr.key]
  if (order) {
    const gr = order[g as string] ?? 999
    const ar = order[a as string] ?? 999
    return gr < ar ? 'low' : 'high'
  }
  return 'na'
}

/** Bir tahmin satirindaki 8 karsilastirma sonucu */
export function compareGuess(guess: Card, answer: Card): Array<{ attr: AttributeDef; status: CompareStatus }> {
  return ATTRIBUTES.map((attr) => ({ attr, status: compareAttr(attr, guess, answer) }))
}

/** Tahmin dogru mu? Yalnizca mevcut ozelliklerin hepsi eslesmeli */
export function isCorrectGuess(guess: Card, answer: Card): boolean {
  return compareGuess(guess, answer).every((x) => x.status === 'correct' || x.status === 'na')
}

/* --- Gunluk kart ---------------------------------------------------------- */

/** Yerel saate gore gun anahtari: 2026-11-04 */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** FNV-1a 32-bit hash - tum tarayicilarda ayni sonucu verir */
function hash32(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** Gunun cevabini belirler: tum oyuncular ayni gun ayni karti gorur */
export function dailyAnswerIndex(cards: Card[] = CARDS, key: string): number {
  if (cards.length === 0) return 0
  // Kartlari yalnizca belirli bir gunde sabit bir sartla karistirmak icin
  // anahtari her gunun tohumu olarak kullanmak yeterli.
  return hash32(`clashdle/${key}`) % cards.length
}

/**
 * Rastgele (egzersiz) modu icin tohum.
 * Gunun cozumuunden bagimsiz, her istediginde yeni kart getirir.
 */
export function randomSeed(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Tohumdan kart secimi (gunluk moddan farkli: kullanici basligi) */
export function randomAnswerIndex(cards: Card[] = CARDS, seed: string): number {
  if (cards.length === 0) return 0
  return hash32(`clashdle/random/${seed}`) % cards.length
}

/** Iki gun anahtari arasindaki tam gun farki ("2026-11-04" - "2026-11-03" -> 1) */
export function daysBetween(fromDay: string | null, toDay: string): number {
  if (!fromDay) return Number.NaN
  const a = Date.parse(`${fromDay}T00:00:00Z`)
  const b = Date.parse(`${toDay}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.NaN
  return Math.round((b - a) / 86400000)
}

/** Gece yarisina kalan saniye */
export function secondsUntilNextDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000))
}

/** Kalani "07:12:33" biciminde yazar */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = String(Math.floor(s / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return `${h}:${m}:${sec}`
}

/* --- Paylasim ------------------------------------------------------------- */

/** Her gunde tahmin hakki sayisi */
export const MAX_GUESSES = 8

const EMOJI: Record<CompareStatus, string> = {
  correct: '🟩', low: '🟥', high: '🟥', na: '⬛',
}

/** Bir tahmin satirinin emoji ozeti */
export function emojiRow(comparisons: Array<{ status: CompareStatus }>): string {
  return comparisons.map((c) => EMOJI[c.status]).join('')
}

/** Oyun modu: gunun sabit karti veya rastgele egzersiz karti */
export type Mode = 'daily' | 'random'

/** Paylasilacak metin */
export function shareText(
  day: string,
  wins: boolean,
  guessCount: number,
  rows: string[],
  mode: Mode = 'daily'
): string {
  const header =
    mode === 'random'
      ? wins
        ? `Clashdle Rastgele ${guessCount}/${MAX_GUESSES}`
        : `Clashdle Rastgele X/${MAX_GUESSES}`
      : wins
        ? `Clashdle ${day} ${guessCount}/${MAX_GUESSES}`
        : `Clashdle ${day} X/${MAX_GUESSES}`
  const grid = rows.join('\n')
  return `${header}\n\n${grid}\n\n#Clashdle #ClashRoyale`
}

/* --- Arama ---------------------------------------------------------------- */

/** Kart arama: ad, Turkce ad ve arena alaninda ara */
export function searchCards(cards: Card[], query: string, excludeIds: number[] = []): Card[] {
  const q = query
    .toLocaleLowerCase('tr')
    .replace(/[ıİ]/g, 'i')
    .replace(/[şŞ]/g, 's')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .trim()
  const excluded = new Set(excludeIds)
  if (!q) {
    return cards.filter((c) => !excluded.has(c.id)).slice(0, 40)
  }
  return cards
    .filter((c) => !excluded.has(c.id))
    .filter((c) => {
      const haystack = [c.name, c.name_tr, c.arena]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('tr')
        .replace(/[ıİ]/g, 'i').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
        .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c')
      return haystack.includes(q)
    })
    .slice(0, 40)
}
