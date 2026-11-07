/**
 * Clashdle - erisim kapisi
 *
 * Uygulama sadece dogru kodu giren kisilere acilir. Kod KAYNAK ICINDE
 * tutulmaz; yalnizca SHA-256 ozeti saklanir. Bu yuzden kodu kopyala-yapistir
 * ile gormek mumkun degil.
 *
 * !!! ONEMLI: Bu bir "yol lambasi", gercek guvenlik degil.
 * Depo herkese acik oldugu icin (kisisel kulliniyorsan gizli yapman daha iyi
 * olur) motivli biri ozeti kaba kuvvetle(kaba kuvvet) kirabilir veya
 * uygulamanin kendisini indirip calistirabilir. Gercek koruma icin Vercel
 * "Deployment Protection > Password Protection" kullan (bkz. README).
 */

/** Kullanimdaki kodun SHA-256 ozeti (hex) */
const CODE_HASH = 'df4b2ead662f5db4bc4cd1e708a180a8477da8d83dc08ecee2a82971ada0dd36'

/** Varsayilan erisim kodu - kendi kodunu kullanmak icin asagidaki komutu calistir:
 *  node -e "console.log(require('crypto').createHash('sha256').update('KODUN').digest('hex'))"
 *  ciktiyi CODE_HASH ile degistir. (Su an: clash2026)
 */

const SESSION_KEY = 'clashdle:access'
const REMEMBER_KEY = 'clashdle:access-remember'
const REMEMBER_MS = 7 * 24 * 60 * 60 * 1000 // 7 gun

function storageSafe(set: (k: string, v: string) => void, get: (k: string) => string | null): boolean {
  try {
    const probe = 'clashdle:probe'
    set(probe, '1')
    get(probe)
    localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

/** Erisim verildi mi? (oturum ya da "beni hatirla") */
export function hasAccess(): boolean {
  try {
    if (sessionStorage.getItem(SESSION_KEY) === '1') return true
    const raw = localStorage.getItem(REMEMBER_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { at: number }
      if (parsed && Date.now() - parsed.at < REMEMBER_MS) return true
      localStorage.removeItem(REMEMBER_KEY)
    }
  } catch {}
  return false
}

/** Giris basarili olunca erisim verir */
export function grantAccess(remember: boolean): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
    if (remember) localStorage.setItem(REMEMBER_KEY, JSON.stringify({ at: Date.now() }))
  } catch {}
}

/** Cikis: kilidi yeniden ac */
export function clearAccess(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(REMEMBER_KEY)
  } catch {}
}

/** Girilen kodun dogru olup olmadigini kontrol eder */
export async function verifyCode(code: string): Promise<boolean> {
  if (!code) return false
  try {
    const data = new TextEncoder().encode(code.trim())
    const digest = await crypto.subtle.digest('SHA-256', data)
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
    return hex === CODE_HASH
  } catch {
    // Web Crypto yoksa (eski tarayici) kodu karsilastirma yapamayiz
    return false
  }
}

/** storageSafe: tarayici gizli modda depolamayi engellerse uygulama calismaya devam etsin */
export const storageAvailable = storageSafe(
  (k, v) => sessionStorage.setItem(k, v),
  (k) => sessionStorage.getItem(k)
)
