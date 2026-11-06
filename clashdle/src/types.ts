/**
 * clashdle - ortak tipler
 *
 * Veri modeli Clash Royale Wiki'den uretilir (bkz. scripts/build-cards.cjs).
 * Kart degerleri kanonik Ingilizce formatta tutulur; Turkce etiketler
 * src/game/logic.ts icindeki sozluklerden gelir.
 */

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Champion'
export type CardType = 'Troop' | 'Building' | 'Spell'
export type Target = 'Buildings' | 'Ground' | 'Air' | 'Air & Ground' | 'Special'

export interface Card {
  id: number
  /** RoyaleAPI resim anahtari: /cards/<key>.png */
  key: string
  /** Gosterilen ad (oyunun kanonik Ingilizce adı) */
  name: string
  /** Resmi Turkce ad - aramada ve bilgi panelinde kullanilir */
  name_tr: string | null
  /** Ad resmi ceviri verisinden mi geldi? (false = DeckShop'tan dogrulanan) */
  name_tr_official: boolean | null
  /** Turkce adin kaynagi: 'royaleapi' (oyun verisi) | 'deckshop' | null */
  name_tr_source: 'royaleapi' | 'deckshop' | null
  /** RoyaleAPI CDN'inde yoksa kullanilacak wiki goruntu dosyasi */
  img_wiki: string | null
  /** public/cards altindaki yerel gorsel (CDN'de yoksa) */
  img_local: string | null
  cost: number
  rarity: Rarity
  type: CardType
  target: Target | null
  range: number | null
  hit_speed: number | null
  speed: number | null
  flying: boolean | null
  release_year: number | null
  arena: string | null
}

export interface CardDataset {
  meta: {
    source: string
    generated_at: string
    card_count: number
    attributes: string[]
  }
  cards: Card[]
}
