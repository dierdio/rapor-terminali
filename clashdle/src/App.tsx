import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Card } from './types'
import { clearAccess, grantAccess, hasAccess } from './game/access'
import Gate from './Gate'
import {
  ATTRIBUTES,
  CARDS,
  MAX_GUESSES,
  cardImages,
  compareGuess,
  dailyAnswerIndex,
  dayKey,
  emojiRow,
  formatAttr,
  formatDuration,
  isCorrectGuess,
  randomAnswerIndex,
  randomSeed,
  secondsUntilNextDay,
  shareText,
  searchCards,
  type Mode,
} from './game/logic'
import {
  applyResult,
  clearDay,
  clearRandom,
  loadDay,
  loadMode,
  loadRandom,
  loadStats,
  saveDay,
  saveMode,
  saveRandom,
  saveStats,
  type DayState,
  type RandomState,
  type Stats,
} from './game/storage'

type Comparison = ReturnType<typeof compareGuess>
type Row = { card: Card; comparisons: Comparison }

const ANSWER_LABEL: Record<Mode, string> = {
  daily: 'Günlük Kart',
  random: 'Rastgele Kart',
}

function CardFace({
  card,
  size = 'md',
  hidden = false,
}: {
  card?: Card
  size?: 'sm' | 'md' | 'lg'
  hidden?: boolean
}) {
  const [attempt, setAttempt] = useState(0)
  useEffect(() => setAttempt(0), [card?.key])

  const box = size === 'lg' ? 'h-28 w-28' : size === 'sm' ? 'h-12 w-12' : 'h-20 w-20'

  if (hidden || !card) {
    return (
      <div
        className={`${box} shrink-0 rounded-xl border border-royalyellow/60 bg-gray-900 grid place-items-center`}
        aria-hidden="true"
      >
        <span className="text-2xl text-royalyellow">?</span>
      </div>
    )
  }

  const images = cardImages(card)

  if (attempt >= images.length) {
    return (
      <div
        className={`${box} shrink-0 rounded-xl bg-gray-700 grid place-items-center text-xs text-gray-300 text-center p-1`}
        title={card.name}
      >
        {card.name_tr?.slice(0, 12) || card.name.slice(0, 12)}
      </div>
    )
  }

  return (
    <img
      src={images[attempt]}
      alt={card.name_tr ?? card.name}
      title={`${card.name_tr ?? card.name} (${card.name})`}
      decoding="async"
      onError={() => setAttempt((n) => n + 1)}
      className={`${box} shrink-0 object-contain`}
    />
  )
}

/** Karsilastirma hucrenin rengi ve ok yonu */
const cellStyle = {
  correct: 'bg-correct text-black',
  low: 'bg-wrong text-white',
  high: 'bg-wrong text-white',
  na: 'bg-na text-gray-200',
} as const

const arrowOf = (status: string) =>
  status === 'low' ? '↑' : status === 'high' ? '↓' : status === 'correct' ? '✓' : '–'

function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-600 bg-gray-800 p-6 text-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Nasıl Oynanır?</h2>
          <button onClick={onClose} className="rounded bg-gray-700 px-3 py-1 hover:bg-gray-600">
            Kapat
          </button>
        </div>

        <ol className="space-y-3 text-gray-200">
          <li>
            <strong className="text-white">Amaç:</strong> Gizli Clash Royale kartını <strong>8 tahmin</strong>{' '}
            içinde bul.
          </li>
          <li>
            <strong className="text-white">İki mod:</strong>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              <span className="rounded bg-gray-700/60 p-2">
                <span className="font-semibold text-royalyellow">Günlük</span>
                <div className="text-xs text-gray-300">
                  Herkesin aynı gün aynı kartı tahmin ettiği klasik mod. Gece yarısı yenilenir, seri ve
                  istatistik burada tutulur.
                </div>
              </span>
              <span className="rounded bg-gray-700/60 p-2">
                <span className="font-semibold text-royalyellow">Rastgele</span>
                <div className="text-xs text-gray-300">
                  İstediğin kartla antrenman. Seriyi ve günlük istatistiği etkilemez, "Yeni rastgele kart" ile
                  süreklenir.
                </div>
              </span>
            </div>
          </li>
          <li>
            <strong className="text-white">Tahmin:</strong> Arama kutusuna kart adı yaz, listeden seç. Klavyedeyken{' '}
            <kbd className="rounded bg-gray-700 px-1">↑</kbd> <kbd className="rounded bg-gray-700 px-1">↓</kbd> ile
            gezin, <kbd className="rounded bg-gray-700 px-1">Enter</kbd> ile kartı seç, <strong>Enter</strong> ile de
            tahmini onayla · <kbd className="rounded bg-gray-700 px-1">Esc</kbd> seçimi temizler.
          </li>
          <li>
            <strong className="text-white">Geri bildirim:</strong> her sütun bir özelliktir.
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-correct px-2 py-0.5 font-bold text-black">✓ Yeşil</span>
              <span className="text-gray-300">= tam doğru.</span>
              <span className="rounded bg-wrong px-2 py-0.5 font-bold text-white">↑ Kırmızı</span>
              <span className="text-gray-300">= yanlış; gizli kart daha büyük, ok yukarı bakıyor.</span>
              <span className="rounded bg-wrong px-2 py-0.5 font-bold text-white">↓ Kırmızı</span>
              <span className="text-gray-300">= yanlış; gizli kart daha küçük.</span>
              <span className="rounded bg-na px-2 py-0.5 text-gray-200">– Gri</span>
              <span className="text-gray-300">= bu özellik her iki kartta da yok, karar verme.</span>
            </div>
          </li>
          <li className="pt-2">
            <strong className="text-white">Özellikler:</strong>
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {ATTRIBUTES.map((a) => (
                <li key={a.key} className="rounded bg-gray-700/60 p-2">
                  <span className="font-semibold text-royalyellow">{a.label}</span>
                  <div className="text-xs text-gray-300">{a.hint}</div>
                </li>
              ))}
            </ul>
          </li>
          <li>
            <strong className="text-white">Kayıt:</strong> İlerleme tarayıcında saklanır; yarım kalan günlük oyun
            korunur, rastgele moddaki oyun da ayrıca kaydedilir.
          </li>
        </ol>
      </div>
    </div>
  )
}

function App(): React.ReactElement {
  // Erisim kapisi: dogru kod girilene kadar oyun yuklenmez
  const [unlocked, setUnlocked] = useState(() => hasAccess())

  if (!unlocked) {
    return (
      <Gate
        onUnlock={(remember) => {
          grantAccess(remember)
          setUnlocked(true)
        }}
      />
    )
  }
  const lock = () => {
    clearAccess()
    setUnlocked(false)
  }
  return <Game onLock={lock} />
}

/** Oyunun kendisi (kilit acildiktan sonra) */
function Game({ onLock }: { onLock: () => void }): React.ReactElement {
  const [today, setToday] = useState(() => dayKey())
  const [mode, setMode] = useState<Mode>(() => loadMode())
  const [randomGame, setRandomGame] = useState<RandomState>(
    () => loadRandom() ?? { seed: randomSeed(), guesses: [], status: 'playing' }
  )
  const [stats, setStats] = useState<Stats>(() => loadStats())
  const [day, setDay] = useState<DayState>(() => loadDay(today) ?? { day: today, guesses: [], status: 'playing' })
  const [selected, setSelected] = useState<Card | null>(null)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(() => secondsUntilNextDay())

  const searchRef = useRef<HTMLInputElement>(null)

  /** Aktif modun karti: gunde deterministik, rastgelede tohum ile belirlenir */
  const answer = useMemo(() => {
    if (mode === 'daily') return CARDS[dailyAnswerIndex(CARDS, today)] ?? CARDS[0]
    return CARDS[randomAnswerIndex(CARDS, randomGame.seed)] ?? CARDS[0]
  }, [mode, today, randomGame.seed])

  const guesses = mode === 'daily' ? day.guesses : randomGame.guesses
  const finished = mode === 'daily' ? day.status !== 'playing' : randomGame.status !== 'playing'
  const won = mode === 'daily' ? day.status === 'won' : randomGame.status === 'won'

  /* --- gun degisimi: gece yarisi sayaci ---------------------------------- */
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date()
      setCountdown(secondsUntilNextDay(now))
      const key = dayKey(now)
      if (key !== today) {
        setToday(key)
        setDay(loadDay(key) ?? { day: key, guesses: [], status: 'playing' })
        setCopied(false)
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [today])

  /* --- mod degisiminde secimi temizle ------------------------------------ */
  const switchMode = useCallback((next: Mode) => {
    setMode(next)
    saveMode(next)
    setSelected(null)
    setQuery('')
    setCursor(0)
    setCopied(false)
  }, [])

  /* --- oynanabilir tahminler ---------------------------------------------- */
  const suggestions = useMemo(() => searchCards(CARDS, query, guesses), [query, guesses])

  /* --- oyun akisi --------------------------------------------------------- */
  const guessCount = guesses.length
  const remaining = MAX_GUESSES - guessCount

  // En yeni tahmin her zaman en ustte gorunur
  const rows: Row[] = useMemo(
    () =>
      guesses
        .map((id) => CARDS.find((c) => c.id === id))
        .filter((c): c is Card => Boolean(c))
        .reverse()
        .map((card) => ({ card, comparisons: compareGuess(card, answer) })),
    [guesses, answer]
  )

  const submitGuess = useCallback(
    (card: Card) => {
      if (finished || guesses.includes(card.id)) return
      const next = [...guesses, card.id]
      const isWin = isCorrectGuess(card, answer)
      const status: DayState['status'] = isWin ? 'won' : next.length >= MAX_GUESSES ? 'lost' : 'playing'

      if (mode === 'daily') {
        const nextState: DayState = { day: today, guesses: next, status }
        setDay(nextState)
        saveDay(nextState)
        setStats((prev) => {
          const updated = applyResult(prev, today, isWin, next.length)
          saveStats(updated)
          return updated
        })
      } else {
        const nextState: RandomState = { seed: randomGame.seed, guesses: next, status }
        setRandomGame(nextState)
        saveRandom(nextState)
      }
      setSelected(null)
      setQuery('')
      setCursor(0)
    },
    [answer, finished, guesses, mode, randomGame.seed, today]
  )

  /** Karti sec: once onizleme acilir, ikinci Enter/clik ile tahmin edilir */
  const chooseCard = useCallback((card: Card) => {
    setSelected(card)
    setQuery(card.name)
    setCursor(0)
  }, [])

  /* --- klavye ------------------------------------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showHelp) {
        if (e.key === 'Escape') setShowHelp(false)
        return
      }
      if (document.activeElement !== searchRef.current) return
      const list = suggestions
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursor((c) => (list.length ? (c + 1) % list.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursor((c) => (list.length ? (c - 1 + list.length) % list.length : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const pick = list[cursor]
        if (!pick) return
        // Ayni kart secili ve imlec yine onun uzerinde: onayla
        if (selected && selected.id === pick.id) submitGuess(selected)
        else chooseCard(pick)
      } else if (e.key === 'Escape') {
        setQuery('')
        setSelected(null)
        setCursor(0)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cursor, suggestions, submitGuess, showHelp, selected, chooseCard])

  /* --- odak --------------------------------------------------------------- */
  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  /* --- paylasim ----------------------------------------------------------- */
  // Izgara kronolojik sirada (en eski tahmin ustte), tablo ise terstir
  const gridRows = [...rows].reverse()
  const emojiGrid = gridRows.map((r) => emojiRow(r.comparisons)).join('\n')
  const shareMessage = shareText(today, won, guessCount, gridRows.map((r) => emojiRow(r.comparisons)), mode)

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Clashdle', text: shareMessage })
        return
      }
      await navigator.clipboard.writeText(shareMessage)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }, [shareMessage])

  /** Gunluk modda ayni kartla tekrar, rastgelede yeni kart */
  const restartPractice = useCallback(() => {
    if (mode === 'daily') {
      clearDay(today)
      setDay({ day: today, guesses: [], status: 'playing' })
    } else {
      clearRandom()
      setRandomGame({ seed: randomSeed(), guesses: [], status: 'playing' })
    }
    setSelected(null)
    setQuery('')
    setCursor(0)
    setCopied(false)
  }, [mode, today])

  /* --- ekran -------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-900/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl">🏰</span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-wide">Clashdle</h1>
              <p className="text-xs text-gray-400">
                Clash Royale kart tahmin oyunu · {CARDS.length} kart ·{' '}
                {mode === 'daily' ? `günün kartı (${today})` : 'rastgele antrenman'}
              </p>
            </div>
            <div
              role="tablist"
              aria-label="Oyun modu"
              className="flex rounded-full border border-gray-600 bg-gray-900 p-1 text-sm"
            >
              <button
                role="tab"
                aria-selected={mode === 'daily'}
                onClick={() => switchMode('daily')}
                className={`rounded-full px-3 py-1 transition ${
                  mode === 'daily' ? 'bg-royalgreen font-semibold' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Günlük
              </button>
              <button
                role="tab"
                aria-selected={mode === 'random'}
                onClick={() => switchMode('random')}
                className={`rounded-full px-3 py-1 transition ${
                  mode === 'random' ? 'bg-royalgreen font-semibold' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Rastgele
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-gray-800 px-3 py-1" title="Ardışık gün kazanma serisi (günlük mod)">
              🔥 <strong>{stats.streak}</strong> gün
            </span>
            <span className="rounded-full bg-gray-800 px-3 py-1" title="En uzun seri">
              🏆 <strong>{stats.bestStreak}</strong>
            </span>
            <span className="rounded-full bg-gray-800 px-3 py-1" title="Oynanan oyun / kazanılan (günlük mod)">
              🎮 <strong>{stats.played}</strong> oyun · <strong>{stats.wins}</strong> kazanıldı
            </span>
            <button
              onClick={() => setShowHelp(true)}
              className="rounded-full bg-royalgreen px-3 py-1 font-semibold hover:bg-green-600"
            >
              Nasıl Oynanır?
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        {/* Gizli kart + durum */}
        <section className="flex flex-col gap-4 rounded-2xl border border-gray-700 bg-gray-800 p-4 sm:flex-row sm:items-center">
          {finished ? (
            <CardFace card={answer} size="lg" />
          ) : (
            <CardFace hidden size="lg" />
          )}
          <div className="flex-1">
            <p className="text-sm text-gray-400">{finished ? 'Doğru kart' : ANSWER_LABEL[mode]}</p>
            <p className="text-2xl font-bold">
              {finished ? answer.name : 'Tahmin etmeye çalış ✨'}
              {finished && answer.name_tr && (
                <span className="ml-2 text-base font-normal text-gray-400">{answer.name_tr}</span>
              )}
            </p>
            <p className="mt-1 text-sm text-gray-300">
              {finished
                ? won
                  ? `${guessCount} tahminde kazandın!`
                  : `${MAX_GUESSES} tahminde bulamadın.`
                : `${remaining} tahmin hakkın kaldı`}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {mode === 'random' ? (
                <span>
                  Rastgele mod: istediğin kadar oyna, seriyi ve günlük istatistiği etkilemez ·{' '}
                  <button onClick={restartPractice} className="underline decoration-dotted hover:text-white">
                    yeni rastgele kart
                  </button>
                </span>
              ) : (
                <span>
                  Sıradaki kart: <span className="tabular">{formatDuration(countdown)}</span>
                </span>
              )}
            </p>
          </div>
        </section>

        {/* Tahmin arayuzu */}
        {!finished && (
          <section className="rounded-2xl border border-gray-700 bg-gray-800 p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setCursor(0)
                }}
                placeholder="Kart adı ara… (ör. valkyrie, bowler, ateş)"
                aria-label="Kart ara"
                autoComplete="off"
                className="flex-1 rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 outline-none focus:border-royalgreen"
              />
              <button
                onClick={() => setShowHelp(true)}
                className="rounded-xl bg-gray-700 px-4 py-3 text-sm font-semibold hover:bg-gray-600 sm:w-auto"
              >
                Kurallar
              </button>
            </div>

            {suggestions.length > 0 && (
              <ul className="mt-2 max-h-64 divide-y divide-gray-700 overflow-y-auto rounded-xl border border-gray-600">
                {suggestions.map((c, i) => (
                  <li key={c.id}>
                    <button
                      onClick={() => chooseCard(c)}
                      onMouseEnter={() => setCursor(i)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                        i === cursor || selected?.id === c.id ? 'bg-royalgreen/20' : 'hover:bg-gray-700/60'
                      }`}
                    >
                      <CardFace card={c} size="sm" />
                      <span className="flex-1">
                        <span className="text-base font-semibold">{c.name_tr ?? c.name}</span>
                        <span className="ml-2 text-xs text-gray-400">{c.name}</span>
                      </span>
                      <span className="rounded bg-gray-700 px-2 py-0.5 text-xs">{c.cost} iksir</span>
                    </button>
                  </li>
                ))}
                {suggestions.length === 0 && (
                  <li className="px-3 py-3 text-center text-sm text-gray-500">Kart bulunamadı</li>
                )}
              </ul>
            )}

            {query && suggestions.length === 0 && (
              <p className="mt-3 text-sm text-gray-400">“{query}” ile eşleşen kart yok.</p>
            )}
          </section>
        )}

        {/* Secili kart onizlemesi */}
        {selected && !finished && (
          <section className="rounded-2xl border-2 border-royalgreen bg-gray-800 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <CardFace card={selected} size="lg" />
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold">{selected.name_tr ?? selected.name}</h3>
                <p className="text-sm text-gray-400">{selected.name}</p>
                <p className="mt-2 text-base text-gray-200">
                  {ATTRIBUTES.map((a, i) => (
                    <span key={a.key}>
                      {i > 0 && <span className="mx-1 text-gray-500">·</span>}
                      <span className="text-gray-400">{a.label}:</span> {formatAttr(a, selected)}
                    </span>
                  ))}
                </p>
              </div>
              <button
                onClick={() => submitGuess(selected)}
                className="rounded-xl bg-royalgreen px-5 py-3 font-bold hover:bg-green-600"
              >
                Tahmin Et
              </button>
            </div>
          </section>
        )}

        {/* Tahmin tablosu */}
        <section className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800">
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">
              Henüz tahmin yok. Yukarıdan bir kart seçerek başla — her satırda 8 özelliğin karşılaştırması gösterilir.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-sm tracking-wide text-gray-300">
                    <th className="sticky left-0 z-10 bg-gray-900 px-3 py-3 text-left">Kart</th>
                    {ATTRIBUTES.map((a) => (
                      <th
                        key={a.key}
                        className="px-1.5 py-3 text-center"
                        title={a.hint}
                      >
                        {a.label.toLocaleUpperCase('tr')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.card.id} className="border-t border-gray-700">
                      <td className="sticky left-0 z-10 flex items-center gap-2 bg-gray-800 px-3 py-2">
                        <span className="w-5 text-right text-sm text-gray-400">{guessCount - i}</span>
                        <CardFace card={row.card} size="sm" />
                        <span className="text-base font-semibold" title={row.card.name}>
                          {row.card.name_tr ?? row.card.name}
                        </span>
                      </td>
                      {row.comparisons.map(({ attr, status }) => (
                        <td key={attr.key} className="px-1.5 py-2 text-center">
                          <div
                            className={`mx-auto flex h-14 w-full max-w-[96px] flex-col items-center justify-center gap-0.5 rounded-lg font-bold ${cellStyle[status]}`}
                            title={`${attr.label}: ${formatAttr(attr, row.card)}`}
                          >
                            <span className="text-2xl leading-none">{arrowOf(status)}</span>
                            <span
                              className={`text-sm leading-none ${status === 'na' ? 'text-gray-200' : 'opacity-90'}`}
                            >
                              {status === 'na' ? '—' : formatAttr(attr, row.card)}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Sonuc */}
        {finished && (
          <section className="rounded-2xl border border-gray-600 bg-gray-800 p-5">
            <h2 className="text-2xl font-bold">
              {won ? '🎉 Tebrikler!' : '😕 Tahmin hakkı bitti'}
            </h2>
            <p className="mt-1 text-sm text-gray-300">
              {won
                ? `Doğru kart: ${answer.name} · ${guessCount} tahmin.`
                : `Doğru kart ${answer.name} olacaktı.`}{' '}
              {mode === 'daily'
                ? stats.streak > 0
                  ? `Seri: ${stats.streak} gün.`
                  : 'Serin sıfırlandı.'
                : 'Rastgele mod istatistiğe yazılmaz.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleShare}
                className="rounded-xl bg-royalyellow px-4 py-2 font-bold text-black hover:bg-yellow-400"
              >
                Sonucu Paylaş
              </button>
              <button
                onClick={restartPractice}
                className="rounded-xl bg-gray-700 px-4 py-2 font-semibold hover:bg-gray-600"
              >
                {mode === 'daily' ? 'Bugünü yeniden oyna' : 'Yeni rastgele kart'}
              </button>
              {copied && <span className="self-center text-sm text-green-400">Panoya kopyalandı!</span>}
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-gray-900 p-3 text-sm leading-6">{emojiGrid}</pre>
          </section>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-center text-xs text-gray-500">
        Clashdle v1.8.0 · veriler Clash Royale Wiki + RoyaleAPI'den üretilir · Supercell'e bağlı değildir ·{' '}
        <button onClick={onLock} className="underline decoration-dotted hover:text-gray-300">
          kilitli çık
        </button>
      </footer>

      {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
    </div>
  )
}

export default App
