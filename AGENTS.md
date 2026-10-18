# dierdio-portfolyo — Ajan Kuralları

Bu dosya OpenCode oturumlarında (AGENTS.md) otomatik okunur.

# Git Workflow Rule
- **Push on request**: Commit ve push işlemlerini yalnızca kullanıcı sohbette
  açıkça istediğinde yap ("pushla", "gönder", "commit et" gibi).
- Push istendiğinde: `git add .`, `git commit -m "<kısa Türkçe açıklama>"`,
  `git push` sırasıyla çalıştır.
- Commit mesajları kısa ve Türkçe olsun.
- `terminal-yedek/` klasörü .gitignore'dadır; asla commit'lenmez.

# Version Bumping Rule
- Kod tabanında güncelleme yaptığında (özellikle CSS/JS değişikliklerinde),
  commit'ten ÖNCE ilgili HTML dosyalarındaki sürüm numarasını otomatik artır.
- Sürüm parametresi script etiketlerinde (örn. `app.js?v=1.1.0`) ve sağ alt
  köşedeki görsel sürüm etiketinde (örn. `v1.1.0`) bulunur.
- Patch sürümünü (son rakam) 1 artır (örn. `1.1.0` -> `1.1.1`).
- Artan sürümün hem cache-busting script URL'sinde hem de görsel metinde
  aynı olduğunu doğrula.
