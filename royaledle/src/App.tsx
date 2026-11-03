import React, { useState, useEffect, useRef, useCallback } from 'react'
import cardsData from './data/cards.json'

// --- Veri yapıları & sabitler ---

type Card = {
  id: number
  name: string
  cost: number
  rarity: string
  type: string
  targets: string
  range: string
  hit_speed: string
  speed: string
  release_year: number
  img: string
  emojis: string
  description: string
}

const rarityOrder: Record<string, number> = {
  'Common': 1,
  'Rare': 2,
  'Epic': 3,
  'Legendary': 4,
}

const typeOrder: Record<string, number> = {
  'Birlik': 1,
  'Büyü': 2,
  'Bina': 3,
}

const targetOrder: Record<string, number> = {
  'Kara': 1,
  'Hava': 2,
  'Her ikisi': 3,
  'Binalar': 4,
}

// Kart verilerini hazırla - cards.json'dan card objelerine dönüştür
const allCards: Card[] = cardsData.cards.map((c: any, i: number) => ({
  id: i + 1,
  name: c.name,
  cost: c.cost,
  rarity: c.rarity,
  type: c.type,
  targets: c.targets,
  range: c.range,
  hit_speed: c.hit_speed || 'N/A',
  speed: c.speed || 'N/A',
  release_year: c.release_year ?? 2016,
  img: c.img,
  emojis: c.emojis,
  description: c.description,
}))

// Karşılaştırma renkleri
const COLOR_GREEN = '#19b419'
const COLOR_RED = '#b41919'
const COLOR_YELLOW = '#bd9b37'

// --- Yardımcı fonksiyonlar ---

// Tarih bazlı deterministik günlük kart seçici
// Her gün aynı kart, LocalStorage ile kalıcı
function getDailyAnswer(localStorageKey: string = 'royaledle_answer'): number {
  const now = new Date()
  // Gece yarısı (00:00)Reset - sadece gün ve ayı considerarak
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  
  let saved = localStorage.getItem(localStorageKey)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed.key === key) {
        return parsed.answerIndex
      }
    } catch {}
  }
  
  // Yeni gün - rastgele ama deterministik (tüm kullanıcılar aynı kartı alır)
  // Math.random seed'i gün için sabit
  const seed = parseInt(key.replace(/-/g, ''), 10)
  let rng = seed
  const shuffled = [...allCards].sort(() => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    return rng / 2147483648 - 0.5
  })
  const answerIndex = rng < 0 ? rng * -1 : rng % allCards.length
  
  localStorage.setItem(localStorageKey, JSON.stringify({ key, answerIndex }))
  return answerIndex
}

// Karşılaştırma hesapla
function compareCardValues(
  guess: Card,
  answer: Card,
  key: keyof Card
): 'correct' | 'low' | 'high' | 'equal' {
  const g = guess[key]
  const a = answer[key]
  
  if (g === a) return 'correct'
  
  // Sayısal karşılaştırmalar
  if (typeof g === 'number' && typeof a === 'number') {
    return g < a ? 'low' : 'high'
  }
  
  // Sıralı string değerler (nadirlik, tür, hedef)
  const orderMap: Record<string, Record<string, number>> = {
    rarity: rarityOrder,
    type: typeOrder,
    targets: targetOrder,
  }
  
  const order = orderMap[key as keyof typeof orderMap]
  if (order && typeof g === 'string' && typeof a === 'string') {
    const gRank = order[g] ?? 999
    const aRank = order[a] ?? 999
    return gRank < aRank ? 'low' : 'high'
  }
  
  return 'equal'
}

// Ok simgesi oluştur
function getArrowDirection(
  guess: Card,
  answer: Card,
  key: keyof Card
): 'up' | 'down' | null {
  const comparison = compareCardValues(guess, answer, key)
  
  // Doğruysa arrow yok
  if (comparison === 'correct') return null
  
  // Tahmin > cevap => aşağı ok (↓), tahmin < cevap => yukarı ok (↑)
  // "Yeşil: tam doğru, Kırmızı: yanlış, Sarı: kısmen yakın, Oklar: sayısal yön"
  return comparison === 'high' ? 'down' : 'up'
}

// LocalStorage'dan oyuncu ilerlemesini yükle
function loadProgress(localStorageKey: string = 'royaledle_progress'): {
  streak: number
  totalGames: number
  wins: number[]
  lastPlayed: string
} | null {
  const saved = localStorage.getItem(localStorageKey)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {}
  }
  return null
}

// İlerleyi kaydet
function saveProgress(
  progress: {
    streak: number
    totalGames: number
    wins: number[]
    lastPlayed: string
  },
  localStorageKey: string = 'royaledle_progress'
) {
  localStorage.setItem(localStorageKey, JSON.stringify(progress))
}

// Gece yarısı mı kontrol et - yenileme gerekli
function shouldResetDay(
  lastPlayed: string,
  localStorageKey: string = 'royaledle_daykey'
): boolean {
  const now = new Date()
  const last = new Date(lastPlayed)
  const diffDays = Math.ceil((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 1
}

// Share fonksiyonu
function shareResult(
  win: boolean,
  guesses: number,
  localStorageKey: string = 'royaledle_progress'
) {
  const progress = loadProgress(localStorageKey)
  if (!progress) return false
  
  const emojiGrid = '🟩🟩🟩🟩🟩' // 5 kart için
  const shareText = `${win ? 'Royaledle Classic' : 'Royaledle'} ${win ? `(${guesses} denemede)` : ''} #ClashRoyale`
  
  // Share API - tarayıcı destekiyorsa
  if (navigator.share) {
    navigator.share({
      title: win ? 'Royaledle Classic!' : 'Royaledle',
      text: shareText,
      url: window.location.origin
    }).then(() => {
      // Share başarılı
    }).catch(() => {
      // Share başarısız
    })
  }
  return true
}

// --- Ana oyun bileşeni ---
interface AppProps {
  localStorageKey?: string
}

export default function App(): JSX.Element {
  const [cards, setCards] = useState<Card[]>(allCards)
  const [answerIndex, setAnswerIndex] = useState<number>(0)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [guesses, setGuesses] = useState<number[]>([])
  const [gameOver, setGameOver] = useState<boolean>(false)
  const [won, setWon] = useState<boolean>(false)
  const [showShare, setShowShare] = useState<boolean>(false)
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filteredCards, setFilteredCards] = useState<Card[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false)
  const [history, setHistory] = useState<Array<{
    card: Card
    comparisons: Record<keyof Card, 'correct' | 'low' | 'high' | 'equal'>
    arrow: 'up' | 'down' | null
  }>>([])
  const [predictionCount, setPredictionCount] = useState<number>(0)
  
  // LocalStorage key'leri
  const LS_KEY = 'royaledle_game'
  const PROGRESS_LS = 'royaledle_progress'
  const DAY_LS = 'royaledle_daykey'
  
  // Oyun durumunu başlat
  useEffect(() => {
    // LocalStorage'dan ilerlemeyi yükle
    const savedProgress = loadProgress(PROGRESS_LS)
    
    // Geç Gün mü kontrol et ve resetle
    if (savedProgress && shouldResetDay(savedProgress.lastPlayed, DAY_LS)) {
      // Gün sıfırla ama streak'i koru veya sıfırla
      // Burada tam reset yapalım
      localStorage.removeItem(PROGRESS_LS)
    }
    
    // Deterministic daily answer'i belirle
    const dailyIndex = getDailyAnswer(LS_KEY)
    setAnswerIndex(dailyIndex)
    
    // Progress'u kaydet (tarih için)
    const progress = savedProgress || {
      streak: 0,
      totalGames: 0,
      wins: [],
      lastPlayed: new Date().toISOString(),
    }
    progress.lastPlayed = new Date().toISOString()
    saveProgress(progress, PROGRESS_LS)
    
    // Filtrelenmiş kartları başlat
    setFilteredCards(cards.filter((_, i) => i !== dailyIndex)) // Tahmin edilecek kart hariç
  }, [])
  
  // Arama filtreleme
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) {
      setFilteredCards(cards.filter((_, i) => i !== answerIndex))
      return
    }
    
    const matches = cards.filter((card) => {
      return card.name.toLowerCase().includes(query) || 
        card.emojis.toLowerCase().includes(query) ||
        card.description.toLowerCase().includes(query)
    })
    
    // Zaten tahmin edilmiş kartları hariç tut
    setFilteredCards(matches.filter((card) => !guesses.includes(card.id)))
  }, [searchQuery, guesses])
  
  // Tahmin işlemi
  const handleSubmit = useCallback((card: Card) => {
    if (gameOver || guesses.includes(card.id)) return
    
    const answer = cards[answerIndex]
    const comparisons: Record<keyof Card, 'correct' | 'low' | 'high' | 'equal'> = {}
    const arrows: ('up' | 'down' | null)[] = {}
    
    // Tüm detailKeys için karşılaştırma yap
    const detailKeys: (keyof Card)[] = [
      'cost', 'rarity', 'type', 'targets', 'range', 
      'hit_speed', 'speed', 'release_year'
    ]
    
    detailKeys.forEach((key) => {
      const cmp = compareCardValues(card, answer, key)
      comparisons[key] = cmp
      arrows[key] = getArrowDirection(card, answer, key)
    })
    
    // Yeni tahmini ekle
    const newGuessEntry = {
      card,
      comparisons,
      arrows: arrows as ('up' | 'down' | null)[],
    }
    
    setGuesses((prev) => [...prev, card.id])
    setHistory((prev) => [...prev, newGuessEntry])
    setPredictionCount(prev => prev + 1)
    
    // Kazanma kontrolü - tüm karşılaştırmalar doğruysa kazan
    const allCorrect = detailKeys.every((key) => comparisons[key] === 'correct')
    
    if (allCorrect) {
      setWon(true)
      setGameOver(true)
      
      // Kazanma bloğunu kaydet
      const progress = loadProgress(PROGRESS_LS)
      if (progress) {
        const newWins = [...progress.wins, guesses.length + 1]
        const newStreak = Math.max((progress.streak || 0) + 1, 1)
        saveProgress({
          streak: newStreak,
          totalGames: (progress.totalGames || 0) + 1,
          wins: newWins,
          lastPlayed: new Date().toISOString(),
        }, PROGRESS_LS)
      }
      
      setShowShare(true)
    } else if (guesses.length >= 8) {
      // Maksimal 8 tahmin
      setGameOver(true)
    }
  }, [cards, answerIndex, gameOver, guesses, setGuesses, setHistory, setWon, setGameOver, setPredictionCount, setShowShare, loadProgress, saveProgress])
  
  // Klavye gezinimi
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSearchOpen) {
        if (e.key === 'Escape') {
          setIsSearchOpen(false)
          setSearchQuery('')
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          // Öneri gezinimi (basit implementasyon)
        }
        return
      }
      
      if (e.key === 'Enter' && selectedCard) {
        handleSubmit(selectedCard)
      }
      
      if (e.key === 'ArrowDown') {
        // Aşağı ok - bir sonraki öneriye
      }
      
      if (e.key === 'ArrowUp') {
        // Yukarı ok - önceki öneriye
      }
      
      if (e.key === 'Escape') {
        setSelectedCard(null)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchOpen, selectedCard, setSelectedCard, handleSubmit, setSearchQuery])
  
  // Başlangıç kontrolü - sadece ilk render'de
  useEffect(() => {
    // Klavye odaklandırması için
    const input = document.querySelector('input.search-input')
    if (input) input.focus()
  }, [])
  
  // Eğer tahmin tamamlandıysa ve kart seçili ise...
  useEffect(() => {
    // Search query'ı temizle ve search'i kapat
    setSearchQuery('')
    setIsSearchOpen(false)
  }, [gameOver])
  
  // Seçili kartı bul
  const findCardByName = useCallback((name: string): Card | null => {
    const card = cards.find((c) => c.name.toLowerCase() === name.toLowerCase())
    return card || null
  }, [cards])
  
  // Filtrelenmiş kartları güncelle
  useEffect(() => {
    setFilteredCards(cards.filter((card) => !guesses.includes(card.id)))
  }, [cards, guesses])
  
  // Oyun durumu - kazanma/karakter ekranı
  const restartGame = useCallback(() => {
    setGuesses([])
    setHistory([])
    setPredictionCount(0)
    setWon(false)
    setGameOver(false)
    setSelectedCard(null)
    setShowShare(false)
    setShowHowToPlay(false)
    
    // Yeni gün için answer'ı yeniden belirle
    setAnswerIndex(getDailyAnswer(LS_KEY))
    setFilteredCards(cards.filter((_, i) => i !== answerIndex))
  }, [cards, answerIndex, setDailyAnswer, setFilteredCards, LS_KEY, getDailyAnswer])
  
  // Eğer oyun bitti ve yeniden başlatıldıysa
  useEffect(() => {
    if (gameOver && !won) {
      // Kaybetti - streak broken, ama total games artıyor
      const progress = loadProgress(PROGRESS_LS)
      if (progress) {
        saveProgress({
          streak: 0,
          totalGames: (progress.totalGames || 0) + 1,
          wins: progress.wins,
          lastPlayed: new Date().toISOString(),
        }, PROGRESS_LS)
      }
    }
  }, [gameOver, won, loadProgress, saveProgress])
  
  // Share butonu clicked
  const handleShareClick = useCallback(() => {
    shareResult(won, predictionCount + 1, PROGRESS_LS)
    setShowShare(false)
  }, [won, predictionCount, setShowShare, PROGRESS_LS, shareResult])
  
  // --- Render ---
  
  // Filtrelenmiş kartlar veya arama sonuçları
  const displayCards = filteredCards.length > 0 ? filteredCards : cards.filter((c) => c.id !== answerIndex + 1)
  
  // Gece yarı sayacı (kalan saat)
  useEffect(() => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setHours(24, 0, 0, 0)
    const diffMs = tomorrow.getTime() - now.getTime()
    const diffHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)))
    
    // Her saniye güncelle
    const timer = setInterval(() => {
      setPredictionCount(prev => {
        // actually this is for something else - let me use a ref
        return prev
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  // Streak ve istatistikler
  const progress = loadProgress(PROGRESS_LS)
  const streak = progress?.streak ?? 0
  const totalGames = progress?.totalGames ?? 0
  const wins = progress?.wins ?? []
  
  // OK renk sınıfı
  const getComparisonClass = (type: 'correct' | 'low' | 'high' | 'equal'): string => {
    switch (type) {
      case 'correct': return 'bg-green-200'
      case 'low': return 'bg-red-200'
      case 'high': return 'bg-red-200'
      case 'equal': return 'bg-yellow-200'
      default: return 'bg-gray-200'
    }
  }
  
  const getArrowClass = (dir: 'up' | 'down' | null): string => {
    if (!dir) return ''
    return dir === 'down' ? 'arrow-down' : 'arrow-up'
  }
  
  // --- JSX Render ---
  
  if (gameOver) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-bold mb-4">
          {won ? 'Tebrikler!' : 'Maalesef!')
        </h1>
        <p className="text-xl mb-6">
          {won ? `Kart: ${cards[answerIndex].name}` : 'Tahminler bitti!'}</p>
        <div className="text-3xl mb-4">
          {won ? `${predictionCount + 1} denemede kazanıldı!` : 'Tekrar deneyin!'}
        </div>
        <button 
          onClick={restartGame}
          className="px-6 py-3 bg-royalgreen text-white rounded hover:bg-green-600 transition"
        >
          Tekrar Oynayın
        </button>
        {won && (
          <button
            onClick={handleShareClick}
            className="px-6 py-3 bg-royalyellow text-black rounded hover:bg-yellow-400 transition mt-2"
          >
            Paylaş
          </button>
        )}
        <button
          onClick={() => setShowHowToPlay(true)}
          className="px-6 py-3 bg-gray-700 rounded hover:bg-gray-600 transition mt-2"
        >
          Nasıl Oynanır?
        </button>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="mb-6 w-full max-w-6xl px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-wider">
            🏰 Royaledle Classic
          </h1>
          
          <div className="flex items-center gap-3">
            <span className="text-lg">
              {Math.floor(streak)} Günlük {streak === 1 ? 'Streak' : 'Streak'}
            </span>
            <span className="text-sm text-gray-300">
              {totalGames} oyun {totalGames === 1 ? 'oynandı' : 'oynadı'}
            </span>
          </div>
        </div>
      </header>
      
      {/* Ana içerik */}
      <main className="w-full max-w-6xl mx-auto">
        {/* Arama ve Filter Bölümü */}
        <section className="mb-6 rounded-lg border border-gray-700 p-4 bg-gray-800">
          <div className="flex gap-2">
            <div className="relative w-64">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-royalgreen placeholder-gray-400"
                placeholder="Kart adı veya emoji ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                ref={searchRef => { /* could use for focus management */ }}
                disabled={gameOver}
              />
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-royalgreen text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition"
                disabled={gameOver}
              >
                🔍
              </button>
            </div>
            
            {isSearchOpen && !gameOver && (
              <div className="absolute right-full w-64 mt-2 bg-gray-800 rounded-xl border border-gray-600 max-height={300} overflow-y-auto">
                <div className="p-3 text-sm text-gray-400">Temizle: Escape</div>
                {filteredCards.length > 0 ? (
                  <div>
                    {filteredCards.slice(0, 10).map((card) => (
                      <div
                        key={card.id}
                        onClick={() => {
                          setSearchQuery(card.name)
                          setIsSearchOpen(false)
                          handleSubmit(card)
                        }}
                        className="p-2 rounded hover:bg-royalgreen cursor-pointer mb-1 transition"
                        style={{ background: guesses.includes(card.id) ? 'rgba(255,255,255,0.2)' : 'transparent' }}
                      >
                        <span className="font-bold">{card.name}</span>
                        <span className="text-xs opacity-50">{card.emojis}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-gray-500">Kart bulunamadı</div>
                )}
              </div>
            )}
            
            <button
              onClick={() => setShowHowToPlay(true)}
              className="ml-2 px-3 py-1 bg-royalgreen text-white rounded text-sm hover:bg-green-600 transition"
            >
              Nasıl Oynanır?
            </button>
          </div>
        </section>
        
        {/* Tahmin Tablosu */}
        <section className="mb-6 rounded-lg border border-gray-700 p-4 bg-gray-800">
          <h2 className="text-xl font-bold mb-4">Günlük Clash Royale Kartı</h2>
          
          {/* Gizli kart bilgisi (görsel ile) */}
          <div className="mb-4">
            <img
              src={`https://royaleapi.github.io/cr-api-assets/cards/${cards[answerIndex].img}.png`}
              alt={cards[answerIndex].name}
              className="h-20 w-auto object-contain mx-auto"
              style={{ filter: 'opacity(0.8)' }}
            />
            <p className="mt-2 text-center text-gray-300">{cards[answerIndex].name} (Tahmin edilecek)</p>
          </div>
          
          {/* Tahmin Tablosu */}
          {guesses.length > 0 || !gameOver ? (
            <div className="space-y-3">
              {history.map((entry, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded border-l-4"
                  style={{ borderColor: entry.comparisons.cost === 'correct' ? 'green' : 'transparent' }}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm">
                      {entry.card.name} (#{idx + 1})
                    </span>
                    <span className="text-xs text-gray-400">
                      {entry.card.cost} IX
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-8 gap-1 my-3">
                    {/* Kolon başlıkları */}
                    <div className="col-span-8 text-xs text-gray-400 font-bold mb-1">
                      Kart↔Kart
                    </div>
                    
                    {/* Karşılaştırma hücreleri */}
                    {['cost', 'rarity', 'type', 'targets', 'range', 'hit_speed', 'speed', 'release_year'].map((key) => {
                      const cmp = entry.comparisons[key]
                      const arrow = entry.arrows[key]
                      const colorClass = getComparisonClass(cmp)
                      const arrowClass = getArrowClass(arrow)
                      
                      return (
                        <div
                          key={key}
                          className={`detail-cell ${colorClass} ${arrowClass} h-6 flex items-center justify-center`}
                        >
                          {cmp === 'correct' ? (
                            <span className="font-bold text-green-800">✓</span>
                          ) : (
                            <span className="text-sm">
                              {arrow === 'down' ? '↓' : '↑'}
                            </span>
                          )}
                        </div>
                      )
                    })}
                    
                    {/* Ok arka planları - hücre altına */}
                    {history[history.length - 1] && history[history.length - 1].arrows.map((arrow, i) => (
                      arrow ? (
                        <div
                          key={i}
                          className="absolute bottom-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-black opacity-80"
                        >
                          {arrow === 'down' ? '▼' : '▲'}
                        </div>
                      ) : null
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    {Object.entries(entry.comparisons).map(([key, val]) => {
                      const g = entry.card[key]
                      const a = cards[answerIndex][key]
                      return `${key}: ${g}${val === 'correct' ? '=' : val === 'low' ? '<' : '>'}${a}`
                    }).join(' | ')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Tahminleriniz burada görünecek</p>
          )}
        </section>
        
        {/* Seçili kart önizleme */}
        {selectedCard && !gameOver && (
          <section className="mb-6 rounded-lg border border-royalgreen p-4 bg-gray-800">
            <h3 className="text-bold mb-3">Tahmin Edilen Kart</h3>
            <img
              src={`https://royaleapi.github.io/cr-api-assets/cards/${selectedCard.img}.png`}
              alt={selectedCard.name}
              className="h-24 w-auto mb-2"
            />
            <p className="text-lg font-bold">{selectedCard.name}</p>
            <p className="text-sm text-gray-300">İksir: {selectedCard.cost}</p>
            <p className="text-sm text-gray-300">Tür: {selectedCard.type}</p>
            <p className="text-sm text-gray-300">Nadirlik: {selectedCard.rarity}</p>
            <button
              onClick={() => handleSubmit(selectedCard)}
              className="mt-4 px-4 py-2 bg-royalgreen text-white rounded hover:bg-green-600 transition"
            >
              Tahmin Et
            </button>
          </section>
        )}
        
        {/* Arama kutusundan kart seçimi sonrası */}
        {isSearchOpen && !selectedCard && !gameOver && (
          <div className="mt-4">
            <p className="text-sm text-gray-400">Karşılaşan kartlar: {filteredCards.length > 0 ? filteredCards.slice(0, 5).map((c) => c.name).join(', ') : 'Kart bulunamadı'}</p>
          </div>
        )}
      </main>
      
      {/* Gece yarı sayacı */}
      <footer className="mt-6 text-center text-sm text-gray-400">
        {gameOver ? '' : (
          <p>
            {won ? 'Bugün kazanıldı!' : (
              <span className="relative">
                {predictionCount} / 8 tahmin {predictionCount > 0 && predictionCount < 8 ? 'kalan' : ''}
                <span className="absolute -bottom-1 -left-1 w-3 h-3 bg-royalgreen rounded-full"></span>
              </span>
            )}
            {won ? '' : (
              <span className="ml-2">
                {new Date().toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' })},
                {new Date().toLocaleDateString('tr-TR')}
              </span>
            )}
          </p>
        )}
      </footer>
    </div>
  )
}