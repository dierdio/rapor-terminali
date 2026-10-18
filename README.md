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
| `controllin/vds-daemon/` | Daemon | VDS üzerinde çalışan Express API: sunucu kurulumu (Paper/Vanilla), screen oturum yönetimi, dosya yöneticisi |
| `api/` | Vercel Serverless | `create-user`, `manage-user` (Supabase admin işlemleri, JWT + yetkili kontrolü), `get-versions`, `get-reviews` (proxy) |
| `supabase/` | SQL Scriptleri | Storage bucket ve RLS sertleştirme scriptleri |

## Mimari

- **Frontend:** Statik HTML/CSS/JS (Vercel rewrite'ları ile SPA yönlendirme)
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
