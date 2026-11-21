# Minecraft Timeline

DIERDIO ekosisteminde `dierdio.com/mctimeline/` altında yayınlanacak,
Minecraft tarihini Pre-Classic'ten güncel sürümlere kadar çift dilli ve
etkileşimli biçimde sunacak proje.

## İlk teknoloji kararı

- **React 18 + TypeScript:** Timeline kartları, modal detay görünümü, filtreler,
  dil ve ses tercihleri için tip güvenli bileşen mimarisi.
- **Vite:** Hızlı geliştirme sunucusu ve küçük statik üretim çıktısı.
- **Tailwind CSS + özel CSS:** Responsive yerleşim ve Minecraft esintili piksel
  yüzeyleri için utility sınıfları; dokular ve animasyonlar için özel CSS.
- **Web Audio API:** Harici telifli ses dosyalarına bağımlı kalmadan arayüz
  seslerini üretmek için ses katmanı. Minecraft sesleri kullanılacaksa lisans ve
  dağıtım koşulları ayrıca doğrulanacak.
- **Statik veri modülü/JSON:** `src/data/timelineData.json` içerik editörlüğü
  için tek ve kolay genişletilebilir kaynak olacak. Her kayıt TR/EN metin,
  sınıflandırma, tarih, özellik, medya ve kaynak bilgisi taşır.

## Dosya yapısı

```text
mctimeline/
├── index.html                 # Üretim giriş noktası
├── package.json               # Geliştirme ve build komutları
├── tsconfig.json              # Strict TypeScript ayarları
├── vite.config.ts             # /mctimeline/ base path ve dev portu
├── README.md
└── src/
    ├── main.tsx               # React bootstrap
    ├── index.css              # Global/Tailwind giriş stili
    ├── types.ts               # Timeline ve i18n tipleri
    ├── data/
    │   └── timelineData.json  # İlk çift dilli örnek kayıtlar
    ├── components/             # Sonraki adım: timeline, modal, filtre, header
    ├── hooks/                  # Sonraki adım: locale, audio, responsive state
    ├── lib/                    # Sonraki adım: tarih, ses ve asset yardımcıları
    └── assets/                 # Sonraki adım: dokular, ikonlar, ekran görüntüleri
```

## Veri şeması

Her `TimelineMilestone` kaydı şu ana alanları kullanır:

| Alan | Açıklama |
|---|---|
| `id` | Kalıcı, URL ve React key için benzersiz kimlik |
| `date` | ISO-8601 tarih; sıralama için kullanılır |
| `datePrecision` | Gün/ay/yıl kesinliği |
| `version` | Sürüm veya dönem etiketi |
| `era` | Pre-Classic, Classic, Indev, Infdev, Alpha, Beta vb. |
| `category` | Java, platform veya büyük dönüm noktası filtresi |
| `title` | `{ tr, en }` başlık |
| `summary` | Timeline üzerinde gösterilecek kısa `{ tr, en }` metin |
| `details` | Detay kartı/modal için uzun `{ tr, en }` açıklama |
| `features` | Çift dilli öne çıkan özellik listesi |
| `tags` | Filtreleme ve rozetler için etiketler |
| `media` | Ekran görüntüsü/ikon/doku ve alt metni |
| `sources` | Wiki ve diğer doğrulama kaynaklarının URL listesi |

## İlk örnek kapsamı

Veri seti şu kronolojik omurgayı içerir:

1. Cave Game teknik prototipi — 10 Mayıs 2009
2. Classic 0.0.11a — 17 Mayıs 2009
3. Indev 0.31 — 23 Aralık 2009
4. Infdev — 27 Şubat 2010
5. Alpha v1.0.0 — 30 Haziran 2010
6. Beta 1.0 — 20 Aralık 2010

Tarihler, ilk arayüz uygulamasından önce Minecraft Wiki kayıtlarıyla ve gerekli
olduğu yerlerde sürüm geçmişi kaynaklarıyla tekrar doğrulanacaktır. Sonraki
adımda Java 1.0'dan güncel sürümlere, ardından Pocket Edition, konsol,
Better Together, Dungeons, Legends ve Microsoft satın alımı gibi çapraz
platform kayıtlarına genişletilecektir.

## Bağımsız deployment

Proje bağımsız bir repository ve domain/subdomain üzerinde yayınlanacak şekilde
`vite.config.ts` içinde `base: '/'` kullanır. Önerilen adres:

```text
https://mctimeline.dierdio.com/
```

GitHub Pages, Cloudflare Pages veya Netlify üzerinde build çıktısı `dist/`
klasörüdür. GitHub Pages için `.github/workflows/deploy.yml` workflow'u hazırdır.

### Build

```bash
npm install
npm run typecheck
npm run build
npm run preview
```
