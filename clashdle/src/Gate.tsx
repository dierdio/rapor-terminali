import React, { useState } from 'react'
import { verifyCode } from './game/access'

/** Kod dogru girilmeden once giris ekrani */
export default function Gate({ onUnlock }: { onUnlock: (remember: boolean) => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [remember, setRemember] = useState(true)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const ok = await verifyCode(code)
    setBusy(false)
    if (!ok) {
      setError('Kod hatalı. Tekrar dene.')
      return
    }
    onUnlock(remember)
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gray-900 px-4 text-white">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-gray-600 bg-gray-800 p-6"
      >
        <div className="mb-5 text-center">
          <span className="text-4xl">🏰</span>
          <h1 className="mt-2 text-2xl font-extrabold">Clashdle</h1>
          <p className="mt-1 text-sm text-gray-400">
            Bu oyun davetiyelidir. Devam etmek için erişim kodunu gir.
          </p>
        </div>

        <label htmlFor="gate-code" className="block text-sm text-gray-300">
          Erişim Kodu
        </label>
        <input
          id="gate-code"
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          autoComplete="off"
          placeholder="••••••••"
          className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-royalgreen"
        />

        <label className="mt-3 flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 accent-royalgreen"
          />
          Beni hatırla (7 gün)
        </label>

        {error && <p className="mt-3 text-sm text-royalred">{error}</p>}

        <button
          type="submit"
          disabled={busy || !code}
          className="mt-5 w-full rounded-xl bg-royalgreen py-3 font-bold hover:bg-green-600 disabled:opacity-50"
        >
          {busy ? 'Kontrol ediliyor…' : 'Giriş Yap'}
        </button>

        <p className="mt-4 text-center text-xs text-gray-500">
          Kodun yok mu? Oyunun sahibinden isteyebilirsin.
        </p>
      </form>
    </div>
  )
}
