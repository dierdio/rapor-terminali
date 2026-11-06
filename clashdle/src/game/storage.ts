/**
 * clashdle - localStorage katmani
 *
 * Iki kayit turu vardir:
 *   clashdle:v1:day:<gun>   -> o gunun tahminleri ve durumu
 *   clashdle:v1:stats       -> streak / oynanan oyun / kazanma dagilimi
 *
 * Degerler her zaman dogrulanir; bozuk/kargo karismis kayit varsa sessizce
 * temiz duruma doner (oyunun acilmasini engellemez).
 */
import { daysBetween } from './logic'

const SCOPE = 'clashdle:v1'
const DAY_PREFIX = `${SCOPE}:day:`
const STATS_KEY = `${SCOPE}:stats`
const RANDOM_KEY = `${SCOPE}:random`
const MODE_KEY = `${SCOPE}:mode`

export type DayStatus = 'playing' | 'won' | 'lost'

export interface DayState {
  day: string
  guesses: number[]
  status: DayStatus
  /** Oyun bitince paylasilan metnin kenar kaydi */
  shared?: boolean
}

/** Rastgele (egzersiz) modunun durumu - gunluk moddan bagimsiz */
export interface RandomState {
  seed: string
  guesses: number[]
  status: DayStatus
}

export interface Stats {
  lastDay: string | null
  streak: number
  bestStreak: number
  played: number
  wins: number
  /** kac tahminde kazanildigi -> kac kez */
  distribution: Record<string, number>
}

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as T) : null
  } catch {
    return null
  }
}

export function emptyStats(): Stats {
  return { lastDay: null, streak: 0, bestStreak: 0, played: 0, wins: 0, distribution: {} }
}

export function loadStats(): Stats {
  const parsed = safeParse<Stats>(localStorage.getItem(STATS_KEY))
  if (!parsed) return emptyStats()
  const stats = { ...emptyStats(), ...parsed }
  if (typeof stats.distribution !== 'object' || stats.distribution === null) {
    stats.distribution = {}
  }
  return stats
}

export function saveStats(stats: Stats): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

export function loadDay(day: string): DayState | null {
  const parsed = safeParse<DayState>(localStorage.getItem(DAY_PREFIX + day))
  if (!parsed || parsed.day !== day || !Array.isArray(parsed.guesses)) return null
  if (!['playing', 'won', 'lost'].includes(parsed.status)) return null
  return { day, guesses: parsed.guesses.filter((n) => Number.isFinite(n)), status: parsed.status }
}

export function saveDay(state: DayState): void {
  localStorage.setItem(DAY_PREFIX + state.day, JSON.stringify(state))
}

export function clearDay(day: string): void {
  localStorage.removeItem(DAY_PREFIX + day)
}

export function loadRandom(): RandomState | null {
  const parsed = safeParse<RandomState>(localStorage.getItem(RANDOM_KEY))
  if (!parsed || typeof parsed.seed !== 'string' || !Array.isArray(parsed.guesses)) return null
  if (!['playing', 'won', 'lost'].includes(parsed.status)) return null
  return { seed: parsed.seed, guesses: parsed.guesses, status: parsed.status }
}

export function saveRandom(state: RandomState): void {
  localStorage.setItem(RANDOM_KEY, JSON.stringify(state))
}

export function clearRandom(): void {
  localStorage.removeItem(RANDOM_KEY)
}

/** Son seçilen mod (sayfa yenilenince kullanıcı kaldığı yere döner) */
export function loadMode(): 'daily' | 'random' {
  const value = localStorage.getItem(MODE_KEY)
  return value === 'random' ? 'random' : 'daily'
}

export function saveMode(mode: 'daily' | 'random'): void {
  localStorage.setItem(MODE_KEY, mode)
}

/**
 * Bir gunun sonucunu istatistiklere yansitir (bir kez calisir).
 * Streak: ardisik gunlerde kazanma zinciri.
 */
export function applyResult(stats: Stats, day: string, wins: boolean, guessCount: number): Stats {
  if (stats.lastDay === day) return stats // ayni gun tekrar sayma

  const consecutive = daysBetween(stats.lastDay, day) === 1
  const streak = wins ? (consecutive ? stats.streak + 1 : 1) : 0
  const distribution = { ...stats.distribution }
  if (wins) {
    const k = String(guessCount)
    distribution[k] = (distribution[k] || 0) + 1
  }

  return {
    lastDay: day,
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
    played: stats.played + 1,
    wins: wins ? stats.wins + 1 : stats.wins,
    distribution,
  }
}
