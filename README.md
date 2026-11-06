# rapor-terminali

DIERDIO ekosistemi — Vercel üzerinde yayında olan çok bileşenli web projesi.

## Bileşenler

| Klasör | Uygulama | Açıklama |
|---|---|---|
| `index.html` | Landing | DIERDIO açılış sayfası (aurora, partikül, 3D tilt kartlar) |
| `terminal/` | Tesis-62 // Rapor Terminali | SCP temalı raporlama sistemi: deney/günlük/kaza/muhafaza/örnek raporları, rütbe sistemi, onay akışı, iç mesajlaşma, güvenlik logları |
| `kritr/` | KRITR Oyuncu Merkezi | CheapShark tabanlı oyun/indirim keşfi + Steam yorumları |
| `controllin/` | Minecraft Kontrol Paneli | VDS'teki Minecraft sunucularını yönetme paneli |
| `aselget/` | ASELGET Topluluk Sistemi | Aselsan Oyun Geliştiricileri Topluluğu: üye dizini, ders yönetimi, yoklama alma, etkinlik takvimi, duyurular |
| `clashdle/` | Clashdle | Günlük Clash Royale kart tahmin oyunu (Vite + React + TypeScript + Tailwind), Wordle tarzı 8 özellik karşılaştırması + rastgele antrenman modu |
| `controllin/vds-daemon/` | Daemon | VDS üzerinde çalışan Express API: sunucu kurulumu (Paper/Vanilla), screen oturum yönetimi, dosya yöneticisi |
| `api/` | Vercel Serverless | `create-user`, `manage-user` (Supabase admin işlemleri, JWT + yetkili kontrolü), `get-versions`, `get-reviews` (proxy) |
| `supabase/` | SQL Scriptleri | Storage bucket ve RLS sertleştirme scriptleri |

## Mimari

- **Frontend:** Statik HTML/CSS/JS (Vercel rewrite'ları ile SPA yönlendirme)
- **Clashdle:** Vite + React 18 + TypeScript + Tailwind (kendi alt projesi: `clashdle/`). Kart verisi
  `clashdle/scripts/build-cards.cjs` scripti ile Clash Royale Wiki + RoyaleAPI i18n çeviri verisinden üretilir.
- **Backend:** Vercel Serverless Functions + Supabase (Auth, Postgres, Realtime, Storage)
- **Daemon:** Node.js (Express) — `API_TOKEN` ile korunur
- İki ayrı Supabase projesi kullanılır: `terminal` (bwajmlxx...) ve `kritr` + `controllin` + `aselget` (poxifowr...)

## ASELGET Kurulumu

`aselget/` uygulamasının tabloları için `supabase/aselget-setup.sql` scriptini
Supabase SQL Editor'de (poxifowr... projesi) çalıştırın. İlk kayıt olan kişi
otomatik olarak admin olur. Detaylar scriptin içinde.

## Vercel Environment Variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (yalnızca serverless — asla istemciye koymayın)

## vds-daemon Başlatma

```bash
API_TOKEN="uzun-ve-rastgele-bir-token" node server.js
# İsteğe bağlı: PORT=3000 BASE_DIR=/home/minecraft
```

Token'ı panelin "Bağlantı Ayarları" bölümüne girin.

## Görseller (opsiyonel)

Terminal rapor görselleri varsayılan olarak veritabanına base64 kaydedilir.
`supabase/hardening.sql` scriptini çalıştırıp `rapor-gorselleri` bucket'ını
oluşturursanız, yeni görseller otomatik olarak Supabase Storage'a yüklenir.
Bucket yoksa sistem eski davranışa geri döner — hiçbir şey kırılmaz.

## Sürüm Kuralları

Her JS/CSS değişikliğinde ilgili uygulamanın sürüm numarası bir artırılır
(cache-busting `?v=` parametresi + görsel etiket). Detay: `AGENTS.md`.

## Clashdle (dierdio.com/clashdle)

Günlük mod + rastgele antrenman modu içeren Clash Royale kart tahmin oyunu.

```bash
cd clashdle
node scripts/build-cards.cjs               # kart verisini yenile (Wiki + i18n çeviriler)
node scripts/fetch-fallback-images.cjs     # CDN'de olmayan kart görsellerini yerle indir
npm run dev                                # geliştirme sunucusu (:5183) — dev.html açar
npm run typecheck                          # tsc --noEmit
npm run build                              # uretim derlemesi -> clashdle/index.html + assets/
```

Derleme ciktisi `clashdle/` klasorunun kendisine yazilir ve `index.html` olarak
yeniden adlandirilir (giris dosyasi `dev.template.html` sabronundan `dev.html`
olarak uretilir). Boylece Vercel rewrite'a gerek kalmadan:

```
/clashdle/index.html   -> https://dierdio.com/clashdle/
/clashdle/assets/*     -> https://dierdio.com/clashdle/assets/*
/clashdle/cards/*      -> https://dierdio.com/clashdle/cards/*
```

Kart kapsamı yalnızca **ana oyun**: evrim (Evolution) kartlar ve oyundan kaldırılmış
kartlar veriye girmez. Türkçe adlar RoyaleAPI'nin resmî çeviri verisinden alınır;
orada henüz olmayan yeni kartlar `deckshop.pro` üzerinden doğrulanır (örnek:
Berserker → Yaramaz, Minion Giant → Minyon Dev). RoyaleAPI CDN'inde bulunmayan
görseller `public/cards/` altına indirilir.
