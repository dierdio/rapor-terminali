/* ============================================================
   ASELGET — Oyun Tasarımı Topluluğu Yönetim Sistemi
   v1.0.0 · Supabase (auth + Postgres + RLS)
   ============================================================ */

const SUPABASE_URL = 'https://poxifowrycsxkhduzshx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBveGlmb3dyeWNzeGtoZHV6c2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTI1ODAsImV4cCI6MjEwMTk2ODU4MH0.X0HK_oqako8yY7-Sf9wWGRSgUp7VaYtSFdao7g0OaGE';
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- YARDIMCILAR ---------- */
function esc(s) { return String(s ?? '').replace(/&/g, '&' + 'amp;').replace(/</g, '&' + 'lt;').replace(/>/g, '&' + 'gt;').replace(/"/g, '&' + 'quot;').replace(/'/g, '&' + '#39;'); }
function jesc(s) { return esc(String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"')); }

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const GUNLER = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const DURUM_LABEL = { geldi: 'Geldi', gelmedi: 'Gelmedi', mazeretli: 'Mazeretli' };

function fmtTarih(iso) { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }); }
function fmtTarihKisa(iso) { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
function fmtSaat(iso) { if (!iso) return ''; const d = new Date(iso); return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); }
function fmtTum(iso) { return fmtTarih(iso) + ' · ' + fmtSaat(iso); }
function avatar(seed) { return 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + encodeURIComponent(seed || 'AG') + '&backgroundColor=1e3a8a,312e81,1e40af'; }
function is_admin() { return ME && ME.rol === 'admin'; }

function toast(msg, tip = '') {
  const w = document.getElementById('toast-wrap');
  const t = document.createElement('div');
  t.className = 'toast ' + tip;
  t.textContent = msg;
  w.appendChild(t);
  setTimeout(() => t.classList.add('show'), 40);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 3800);
}

function openModal(html) { document.getElementById('modal-box').innerHTML = html; document.getElementById('modal-overlay').classList.add('active'); }
function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function hataGoster(msg) { toast(msg, 'err'); }
function supabaseHata(err) {
  const m = String(err?.message || err || 'Bilinmeyen hata');
  if (m.includes('Email not confirmed')) return 'E-posta adresin doğrulanmamış. Lütfen e-postana gelen bağlantıya tıkla.';
  if (m.includes('Invalid login credentials')) return 'E-posta veya şifre hatalı.';
  if (m.includes('already registered')) return 'Bu e-posta ile zaten bir hesap var.';
  if (m.includes('Password should be')) return 'Şifre en az 6 karakter olmalı.';
  if (m.includes('rate limit')) return 'Çok fazla deneme yaptın, biraz bekle.';
  if (m.includes('Rol değiştirme')) return 'Rol değiştirme yetkiniz yok.';
  return m;
}

/* ---------- DURUM ---------- */
let ME = null; // { id, isim, rol, sinif, discord, bio, email }
let CACHE = { profiles: [], dersler: [], yoklama: [], duyurular: [] };
let calCursor = null;      // takvim ay imleci (1'inin tarihi)
let secilenGun = null;     // takvimde seçili gün 'YYYY-MM-DD'
let yoklamaDersId = null;  // yoklama alınan ders
let yoklamaDraft = {};     // uye_id -> durum (kaydedilmemiş)
let authMod = 'login';     // login | register

/* ---------- AUTH ---------- */
(async function init() {
  const { data } = await _supabase.auth.getSession();
  if (data?.session?.user) {
    const ok = await ensureProfile(data.session.user);
    if (ok) return bootApp();
  }
  showAuth();
})();

async function ensureProfile(user) {
  let prof = null, profErr = null;
  await _supabase.from('aselget_profiles').select('*').eq('id', user.id).single()
    .then(({ data, error }) => { prof = data; profErr = error; });
  if (profErr || !prof) {
    // Profil yoksa (ör. kayıt sonrası ilk giriş) metaveriden oluştur
    const meta = user.user_metadata || {};
    const ins = await _supabase.from('aselget_profiles').insert([{
      id: user.id,
      isim: meta.isim || meta.full_name || (user.email || 'uye').split('@')[0],
      sinif: meta.sinif || '',
      discord: meta.discord || ''
    }]).select().single();
    if (ins.error) {
      hataGoster('Profil oluşturulamadı: ' + supabaseHata(ins.error));
      await _supabase.auth.signOut();
      showAuth();
      return false;
    }
    prof = ins.data;
  }
  ME = { ...prof, email: user.email };
  return true;
}

function showAuth() {
  document.getElementById('topbar').style.display = 'none';
  document.getElementById('footer').style.display = 'none';
  renderAuth();
}

async function bootApp() {
  document.getElementById('topbar').style.display = 'flex';
  document.getElementById('footer').style.display = 'flex';
  document.getElementById('chip-avatar').src = avatar(ME.isim);
  document.getElementById('chip-name').textContent = ME.isim || 'Üye';
  const roleEl = document.getElementById('chip-role');
  roleEl.textContent = is_admin() ? 'ADMİN' : 'ÜYE';
  roleEl.className = 'chip-role ' + (is_admin() ? 'admin' : 'uye');
  buildNav();
  calCursor = new Date(); calCursor.setDate(1);
  await loadAll();
  if (!location.hash || location.hash === '#' || location.hash === '#/') location.hash = '#/panel';
  route();
}

function buildNav() {
  const items = [
    ['panel', 'Panel'], ['takvim', 'Takvim'], ['dersler', 'Dersler'],
    ...(is_admin() ? [['yoklama', 'Yoklama']] : []),
    ['uyeler', 'Üyeler'], ['duyurular', 'Duyurular'], ['profil', 'Profil']
  ];
  document.getElementById('nav').innerHTML = items.map(([id, label]) =>
    `<button class="nav-item" data-view="${id}" onclick="location.hash='#/${id}'">${label}</button>`
  ).join('');
}

async function loadAll() {
  try {
    const [p, d, y, du] = await Promise.all([
      _supabase.from('aselget_profiles').select('*').order('created_at', { ascending: true }),
      _supabase.from('aselget_dersler').select('*').order('ders_tarihi', { ascending: true }),
      _supabase.from('aselget_yoklama').select('*'),
      _supabase.from('aselget_duyurular').select('*').order('created_at', { ascending: false })
    ]);
    if (p.error) throw p.error; if (d.error) throw d.error; if (y.error) throw y.error; if (du.error) throw du.error;
    CACHE.profiles = p.data || []; CACHE.dersler = d.data || []; CACHE.yoklama = y.data || []; CACHE.duyurular = du.data || [];
  } catch (err) {
    hataGoster('Veriler yüklenemedi: ' + supabaseHata(err));
  }
}

async function doLogout() {
  await _supabase.auth.signOut();
  ME = null; CACHE = { profiles: [], dersler: [], yoklama: [], duyurular: [] };
  location.hash = '';
  showAuth();
}

/* ---------- GİRİŞ / KAYIT ---------- */
function renderAuth() {
  const reg = authMod === 'register';
  document.getElementById('app-view').innerHTML = `
  <div class="auth-wrap">
    <div class="auth-box">
      <div class="auth-hero">
        <div class="brand-logo">AG</div>
        <h1>ASELGET</h1>
        <p>ASELSAN OYUN GELİŞTİRİCİLERİ TOPLULUĞU</p>
        <div class="achieve-badge">🏆 EĞİTİJAM 2026 K12 · Türkiye Birincisi — "Parallel Rooms"</div>
      </div>
      <div class="card auth-card">
        <div class="auth-err" id="auth-err"></div>
        <div class="auth-ok" id="auth-ok"></div>
        ${reg ? `
        <div class="field"><label class="label">Ad Soyad</label><input class="input" id="r-isim" placeholder="Adın Soyadın"></div>
        <div class="form-row">
          <div class="field"><label class="label">Sınıf (opsiyonel)</label><input class="input" id="r-sinif" placeholder="örn. 12-A"></div>
          <div class="field"><label class="label">Discord (opsiyonel)</label><input class="input" id="r-discord" placeholder="kullanıcı_adı"></div>
        </div>` : ''}
        <div class="field"><label class="label">E-posta</label><input class="input" id="a-email" type="email" placeholder="ornek@eposta.com"></div>
        <div class="field"><label class="label">Şifre</label><input class="input" id="a-pass" type="password" placeholder="••••••••"></div>
        <button class="btn" style="width:100%" id="auth-btn" onclick="authGonder()">${reg ? 'Kayıt Ol' : 'Giriş Yap'}</button>
        <div class="auth-switch">
          ${reg ? 'Hesabın var mı?' : 'Hesabın yok mu?'}
          <a onclick="authMod='${reg ? 'login' : 'register'}'; renderAuth()">${reg ? 'Giriş Yap' : 'Kayıt Ol'}</a>
        </div>
      </div>
    </div>
  </div>`;
}

async function authGonder() {
  const errEl = document.getElementById('auth-err');
  const okEl = document.getElementById('auth-ok');
  const btn = document.getElementById('auth-btn');
  errEl.style.display = 'none'; okEl.style.display = 'none';
  const email = document.getElementById('a-email').value.trim();
  const pass = document.getElementById('a-pass').value;
  if (!email || !pass) { errEl.textContent = 'E-posta ve şifre zorunludur.'; errEl.style.display = 'block'; return; }
  btn.disabled = true;
  try {
    if (authMod === 'register') {
      const isim = document.getElementById('r-isim').value.trim();
      if (!isim) { errEl.textContent = 'Ad soyad zorunludur.'; errEl.style.display = 'block'; btn.disabled = false; return; }
      const { data, error } = await _supabase.auth.signUp({
        email, password: pass,
        options: { data: { isim, sinif: document.getElementById('r-sinif').value.trim(), discord: document.getElementById('r-discord').value.trim() } }
      });
      if (error) throw error;
      if (data.session) { const ok = await ensureProfile(data.session.user); if (ok) return bootApp(); }
      okEl.textContent = 'Kayıt alındı! E-postana gönderilen doğrulama bağlantısına tıkladıktan sonra giriş yapabilirsin.';
      okEl.style.display = 'block';
    } else {
      const { data, error } = await _supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      const ok = await ensureProfile(data.session.user);
      if (ok) bootApp();
    }
  } catch (err) {
    errEl.textContent = supabaseHata(err); errEl.style.display = 'block';
  } finally { btn.disabled = false; }
}

/* ---------- YÖNLENDİRME ---------- */
const VIEWLER = ['panel', 'takvim', 'dersler', 'yoklama', 'uyeler', 'duyurular', 'profil'];
window.addEventListener('hashchange', route);

function route() {
  if (!ME) return;
  let view = (location.hash || '#/panel').replace('#/', '').split('?')[0];
  if (!VIEWLER.includes(view)) view = 'panel';
  if (view === 'yoklama' && !is_admin()) view = 'panel';
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  closeModal();
  const appView = document.getElementById('app-view');
  appView.innerHTML = '<div class="empty">YÜKLENİYOR...</div>';
  try {
    if (view === 'panel') renderPanel();
    else if (view === 'takvim') renderTakvim();
    else if (view === 'dersler') renderDersler();
    else if (view === 'yoklama') renderYoklama();
    else if (view === 'uyeler') renderUyeler();
    else if (view === 'duyurular') renderDuyurular();
    else if (view === 'profil') renderProfil();
  } catch (err) {
    appView.innerHTML = '<div class="empty">Bir hata oluştu: ' + esc(supabaseHata(err)) + '</div>';
  }
  window.scrollTo({ top: 0 });
}

/* ---------- İSTATİSTİK YARDIMCILARI ---------- */
function uyeYoklamaOzet(uyeId) {
  const kayitlar = CACHE.yoklama.filter(y => y.uye_id === uyeId);
  const geldi = kayitlar.filter(y => y.durum === 'geldi').length;
  const gelmedi = kayitlar.filter(y => y.durum === 'gelmedi').length;
  const mazeret = kayitlar.filter(y => y.durum === 'mazeretli').length;
  const toplam = kayitlar.length;
  const oran = toplam ? Math.round(((geldi + mazeret) / toplam) * 100) : null;
  return { geldi, gelmedi, mazeret, toplam, oran };
}

function siraliDersler() { return CACHE.dersler.slice().sort((a, b) => new Date(a.ders_tarihi) - new Date(b.ders_tarihi)); }
function sonrakiDers() { const now = Date.now(); return siraliDersler().find(d => new Date(d.ders_tarihi).getTime() >= now - 45 * 60 * 1000) || null; }

/* ---------- VİEW: PANEL ---------- */
function renderPanel() {
  const appView = document.getElementById('app-view');
  const gelecek = siraliDersler().filter(d => new Date(d.ders_tarihi) >= new Date(Date.now() - 45 * 60 * 1000));
  const sxd = gelecek[0] || null;
  const ozet = uyeYoklamaOzet(ME.id);
  const buAy = CACHE.dersler.filter(d => { const t = new Date(d.ders_tarihi); const n = new Date(); return t.getMonth() === n.getMonth() && t.getFullYear() === n.getFullYear(); }).length;
  const sonDuyurular = CACHE.duyurular.slice(0, 3);
  const yaklasan = gelecek.slice(0, 5);
  let saatFark = '';
  if (sxd) {
    const dk = Math.floor((new Date(sxd.ders_tarihi) - new Date()) / 60000);
    saatFark = dk <= 0 ? 'Şimdi!' : dk < 60 ? dk + ' dk sonra' : dk < 1440 ? Math.floor(dk / 60) + ' sa sonra' : Math.floor(dk / 1440) + ' gün sonra';
  }

  appView.innerHTML = `
    <div class="hero-banner">
      <h2>Merhaba, ${esc((ME.isim || 'Üye').split(' ')[0])} 👋</h2>
      <p>ASELGET — eğitimde oyunlaştırma ilkesiyle yola çıkan, oyun tasarımı ve geliştirmeye odaklanan topluluğumuzun yönetim merkezine hoş geldin.</p>
      ${sxd ? `
      <div class="next-lesson">
        <span class="badge blue">SIRADAKİ DERS</span>
        <span class="nl-title">${esc(sxd.baslik)}</span>
        <span class="nl-when">${fmtTarihKisa(sxd.ders_tarihi)} · ${fmtSaat(sxd.ders_tarihi)}</span>
        <span class="count-chip">${esc(saatFark)}</span>
      </div>` : `<div class="next-lesson"><span class="badge dim">PLANLANMIŞ DERS YOK</span><span class="li-sub">Takvimden yeni bir ders ekleyebilirsin.</span></div>`}
    </div>

    <div class="grid grid-4">
      <div class="card stat-card"><div class="stat-num accent">${CACHE.profiles.length}</div><div class="stat-label">TOPLAM ÜYE</div></div>
      <div class="card stat-card"><div class="stat-num">${CACHE.dersler.length}</div><div class="stat-label">TOPLAM DERS</div></div>
      <div class="card stat-card"><div class="stat-num">${buAy}</div><div class="stat-label">BU AYKİ DERS</div></div>
      <div class="card stat-card"><div class="stat-num ${ozet.oran === null ? '' : ozet.oran >= 75 ? '' : 'accent'}">${ozet.oran === null ? '—' : ozet.oran + '%'}</div><div class="stat-label">KENDİ KATILIM ORANIN</div></div>
    </div>

    <div class="grid grid-2" style="margin-top:14px">
      <div>
        <div class="section-title">📅 Yaklaşan Dersler</div>
        ${yaklasan.length ? yaklasan.map(d => `
          <div class="list-item">
            <div class="li-main"><div class="li-title">${esc(d.baslik)}</div><div class="li-sub">${fmtTarihKisa(d.ders_tarihi)} · ${fmtSaat(d.ders_tarihi)}${d.egitmen ? ' · ' + esc(d.egitmen) : ''}</div></div>
            <div class="li-actions">${is_admin() ? `<button class="btn small ghost" onclick="yoklamayaGit(${d.id})">Yoklama</button>` : ''}</div>
          </div>`).join('') : '<div class="empty">Henüz planlanmış ders yok.</div>'}
      </div>
      <div>
        <div class="section-title">📣 Son Duyurular</div>
        ${sonDuyurular.length ? sonDuyurular.map(d => `
          <div class="list-item">
            <div class="li-main"><div class="li-title">${d.onemli ? '⚠️ ' : ''}${esc(d.baslik)}</div><div class="li-sub">${esc(d.icerik).substring(0, 90)}${d.icerik && d.icerik.length > 90 ? '…' : ''}</div></div>
          </div>`).join('') : '<div class="empty">Henüz duyuru yok.</div>'}
      </div>
    </div>`;
}

function yoklamayaGit(dersId) { location.hash = '#/yoklama'; setTimeout(() => { yoklamaDersId = dersId; if (ME && is_admin()) route(); }, 30); }

/* ---------- VİEW: TAKVİM ---------- */
function renderTakvim() {
  const appView = document.getElementById('app-view');
  const y = calCursor.getFullYear(), a = calCursor.getMonth();
  const ilkGun = new Date(y, a, 1);
  const baslangicIdx = (ilkGun.getDay() + 6) % 7; // Pazartesi = 0
  const gunSayisi = new Date(y, a + 1, 0).getDate();
  const oncekiAyGun = new Date(y, a, 0).getDate();
  const bugunStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD (yerel)

  let hucreler = '';
  GUNLER.forEach(g => hucreler += `<div class="cal-dow">${g}</div>`);
  for (let i = 0; i < baslangicIdx; i++) hucreler += `<div class="cal-cell other"><span class="cal-daynum">${oncekiAyGun - baslangicIdx + 1 + i}</span></div>`;

  for (let gn = 1; gn <= gunSayisi; gn++) {
    const gunTarihi = new Date(y, a, gn);
    const gunStr = gunTarihi.toLocaleDateString('sv-SE');
    const gununDersleri = CACHE.dersler.filter(d => d.ders_tarihi && new Date(d.ders_tarihi).toLocaleDateString('sv-SE') === gunStr)
      .sort((x, z) => new Date(x.ders_tarihi) - new Date(z.ders_tarihi));
    const sinif = [gunStr === bugunStr ? 'today' : '', gunStr === secilenGun ? 'selected' : ''].join(' ');
    hucreler += `
      <div class="cal-cell ${sinif}" onclick="gunSec('${gunStr}')">
        <span class="cal-daynum">${gn}</span>
        ${gununDersleri.slice(0, 3).map(d => {
          const gecmis = new Date(d.ders_tarihi) < new Date();
          return `<span class="cal-event ${gecmis ? 'past' : ''}" title="${esc(d.baslik)}">${fmtSaat(d.ders_tarihi)} ${esc(d.baslik)}</span>`;
        }).join('')}
        ${gununDersleri.length > 3 ? `<span class="cal-event past">+${gununDersleri.length - 3} daha</span>` : ''}
      </div>`;
  }
  const kalan = (7 - ((baslangicIdx + gunSayisi) % 7)) % 7;
  for (let i = 1; i <= kalan; i++) hucreler += `<div class="cal-cell other"><span class="cal-daynum">${i}</span></div>`;

  let detayHtml = '';
  if (secilenGun) {
    const gununDersleri = CACHE.dersler.filter(d => d.ders_tarihi && new Date(d.ders_tarihi).toLocaleDateString('sv-SE') === secilenGun)
      .sort((x, z) => new Date(x.ders_tarihi) - new Date(z.ders_tarihi));
    detayHtml = `
      <div class="day-detail">
        <div class="section-title">${fmtTarih(secilenGun + 'T00:00:00')}</div>
        ${gununDersleri.length ? gununDersleri.map(d => `
          <div class="list-item">
            <div class="li-main"><div class="li-title">${esc(d.baslik)}</div><div class="li-sub">${fmtSaat(d.ders_tarihi)}${d.egitmen ? ' · ' + esc(d.egitmen) : ''}${d.aciklama ? ' — ' + esc(d.aciklama) : ''}</div></div>
            <div class="li-actions">
              ${katilimOzeti(d.id)}
              ${is_admin() ? `<button class="btn small ghost" onclick="yoklamayaGit(${d.id})">Yoklama</button>` : ''}
            </div>
          </div>`).join('') : '<div class="empty">Bu gün için planlanmış ders yok.</div>'}
      </div>`;
  }

  appView.innerHTML = `
    <div class="page-head">
      <div><div class="page-title">Takvim</div><div class="page-sub">Dersler ve etkinlikler</div></div>
      ${is_admin() ? '<button class="btn" onclick="location.hash=\'#/dersler\'">+ Ders Ekle</button>' : ''}
    </div>
    <div class="card">
      <div class="cal-head">
        <div class="cal-title">${AYLAR[a]} ${y}</div>
        <div class="cal-nav">
          <button class="btn small ghost" onclick="ayKaydir(-1)">←</button>
          <button class="btn small ghost" onclick="buguneGit()">Bugün</button>
          <button class="btn small ghost" onclick="ayKaydir(1)">→</button>
        </div>
      </div>
      <div class="cal-grid">${hucreler}</div>
    </div>
    ${detayHtml}`;
}

function ayKaydir(yon) {
  calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() + yon, 1);
  secilenGun = null;
  renderTakvim();
}
function buguneGit() {
  const n = new Date();
  calCursor = new Date(n.getFullYear(), n.getMonth(), 1);
  secilenGun = n.toLocaleDateString('sv-SE');
  renderTakvim();
}
function gunSec(gunStr) { secilenGun = gunStr; renderTakvim(); }

function katilimOzeti(dersId) {
  const kayitlar = CACHE.yoklama.filter(y => y.ders_id === dersId);
  if (!kayitlar.length) return '<span class="badge dim">YOKLAMA YOK</span>';
  const g = kayitlar.filter(y => y.durum === 'geldi').length;
  return `<span class="badge ok">✓ ${g}/${kayitlar.length}</span>`;
}

/* ---------- VİEW: DERSLER ---------- */
function renderDersler() {
  const appView = document.getElementById('app-view');
  const simdi = Date.now();
  const gelecek = siraliDersler().filter(d => new Date(d.ders_tarihi).getTime() >= simdi - 45 * 60 * 1000).reverse();
  const gecmis = siraliDersler().filter(d => new Date(d.ders_tarihi).getTime() < simdi - 45 * 60 * 1000).reverse();

  appView.innerHTML = `
    <div class="page-head">
      <div><div class="page-title">Dersler</div><div class="page-sub">${CACHE.dersler.length} ders kayıtlı</div></div>
      ${is_admin() ? '<button class="btn" onclick="dersFormu()">+ Yeni Ders</button>' : ''}
    </div>

    <div class="section-title">🔮 Yaklaşan</div>
    ${gelecek.length ? gelecek.map(d => dersSatiri(d)).join('') : '<div class="empty">Planlanmış yaklaşan ders yok.</div>'}

    <div class="section-title">📜 Geçmiş</div>
    ${gecmis.length ? gecmis.map(d => dersSatiri(d)).join('') : '<div class="empty">Geçmiş ders kaydı yok.</div>'}`;
}

function dersSatiri(d) {
  return `
    <div class="list-item">
      <div class="li-main">
        <div class="li-title">${esc(d.baslik)}</div>
        <div class="li-sub">${fmtTarihKisa(d.ders_tarihi)} · ${fmtSaat(d.ders_tarihi)}${d.egitmen ? ' · Eğitmen: ' + esc(d.egitmen) : ''}${d.aciklama ? ' — ' + esc(d.aciklama) : ''}</div>
      </div>
      <div class="li-actions">
        ${katilimOzeti(d.id)}
        ${is_admin() ? `
          <button class="btn small ghost" onclick="yoklamayaGit(${d.id})">Yoklama</button>
          <button class="btn small ghost" onclick="dersFormu(${d.id})">Düzenle</button>
          <button class="btn small danger" onclick="dersSil(${d.id}, '${jesc(d.baslik)}')">Sil</button>` : ''}
      </div>
    </div>`;
}

function dersFormu(id = null) {
  if (!is_admin()) return;
  const d = id ? CACHE.dersler.find(x => x.id === id) : null;
  const tarihLocal = d ? new Date(d.ders_tarihi) : new Date(Date.now() + 24 * 3600 * 1000);
  const pad = n => String(n).padStart(2, '0');
  const dtLocal = `${tarihLocal.getFullYear()}-${pad(tarihLocal.getMonth() + 1)}-${pad(tarihLocal.getDate())}T${pad(tarihLocal.getHours())}:${pad(tarihLocal.getMinutes())}`;
  openModal(`
    <div class="modal-head"><div class="modal-title">${d ? 'Dersi Düzenle' : 'Yeni Ders'}</div><button class="modal-x" onclick="closeModal()">✕</button></div>
    <div class="field"><label class="label">Ders Başlığı *</label><input class="input" id="f-baslik" value="${esc(d?.baslik || '')}" placeholder="örn. Oyun Tasarımına Giriş"></div>
    <div class="form-row">
      <div class="field"><label class="label">Tarih ve Saat *</label><input class="input" id="f-tarih" type="datetime-local" value="${dtLocal}"></div>
      <div class="field"><label class="label">Eğitmen</label><input class="input" id="f-egitmen" value="${esc(d?.egitmen || '')}" placeholder="Dersi veren kişi"></div>
    </div>
    <div class="field"><label class="label">Açıklama</label><textarea class="textarea" id="f-aciklama" placeholder="Ders içeriği, gereksinimler...">${esc(d?.aciklama || '')}</textarea></div>
    <button class="btn" style="width:100%" onclick="dersKaydet(${d ? d.id : 'null'})">${d ? 'Değişiklikleri Kaydet' : 'Dersi Oluştur'}</button>
  `);
}

async function dersKaydet(id) {
  const baslik = document.getElementById('f-baslik').value.trim();
  const tarihVal = document.getElementById('f-tarih').value;
  if (!baslik || !tarihVal) { hataGoster('Başlık ve tarih zorunludur.'); return; }
  const payload = {
    baslik,
    ders_tarihi: new Date(tarihVal).toISOString(),
    egitmen: document.getElementById('f-egitmen').value.trim(),
    aciklama: document.getElementById('f-aciklama').value.trim(),
    olusturan: ME.id
  };
  const res = id
    ? await _supabase.from('aselget_dersler').update(payload).eq('id', id)
    : await _supabase.from('aselget_dersler').insert([payload]);
  if (res.error) { hataGoster('Kaydedilemedi: ' + supabaseHata(res.error)); return; }
  closeModal(); toast(id ? 'Ders güncellendi.' : 'Ders oluşturuldu.', 'ok');
  await loadAll(); route();
}

async function dersSil(id, baslik) {
  if (!confirm(`"${baslik}" dersi ve bağlı yoklama kayıtları silinecek. Emin misin?`)) return;
  const { error } = await _supabase.from('aselget_dersler').delete().eq('id', id);
  if (error) { hataGoster('Silinemedi: ' + supabaseHata(error)); return; }
  toast('Ders silindi.', 'ok');
  await loadAll(); route();
}

/* ---------- VİEW: YOKLAMA (admin) ---------- */
function renderYoklama() {
  if (!is_admin()) { location.hash = '#/panel'; return; }
  const appView = document.getElementById('app-view');
  const dersler = siraliDersler().reverse(); // en yeni üstte
  if (!yoklamaDersId && dersler.length) yoklamaDersId = dersler.find(d => new Date(d.ders_tarihi) <= new Date()) ? dersler[0].id : dersler[dersler.length - 1].id;

  appView.innerHTML = `
    <div class="page-head">
      <div><div class="page-title">Yoklama</div><div class="page-sub">Ders bazlı katılım kaydı</div></div>
    </div>
    ${dersler.length ? `
    <div class="card" style="margin-bottom:16px">
      <div class="form-row" style="grid-template-columns: 2fr 1fr; align-items:end">
        <div class="field" style="margin:0"><label class="label">Ders Seç</label>
          <select class="select" id="y-ders" onchange="yoklamaDersSec(this.value)">
            ${dersler.map(d => `<option value="${d.id}" ${d.id === yoklamaDersId ? 'selected' : ''}>${esc(d.baslik)} — ${fmtTarihKisa(d.ders_tarihi)} ${fmtSaat(d.ders_tarihi)}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="margin:0"><button class="btn" style="width:100%" onclick="yoklamaKaydet()">💾 Kaydet</button></div>
      </div>
    </div>
    <div id="yoklama-liste">${yoklamaListeHtml()}</div>`
      : '<div class="empty">Önce Dersler bölümünden bir ders oluşturmalısın.</div>'}`;
}

function yoklamaListeHtml() {
  const ders = CACHE.dersler.find(d => d.id === yoklamaDersId);
  if (!ders) return '<div class="empty">Ders bulunamadı.</div>';
  const kayitlar = CACHE.yoklama.filter(y => y.ders_id === yoklamaDersId);
  const durumlar = {}; kayitlar.forEach(k => durumlar[k.uye_id] = k.durum);

  const satirlar = CACHE.profiles.map(p => {
    const secili = yoklamaDraft[p.id] !== undefined ? yoklamaDraft[p.id] : (durumlar[p.id] || null);
    const btn = (durum, label) => `<button class="att-btn ${secili === durum ? 'sel ' + durum : ''}" onclick="yoklamaDurum('${p.id}','${durum}')">${label}</button>`;
    return `
      <div class="att-row">
        <div class="att-left">
          <img src="${avatar(p.isim)}" width="36" height="36" alt="">
          <div><div class="att-name">${esc(p.isim || 'Üye')}</div><div class="att-sub">${esc(p.sinif || '')}${p.rol === 'admin' ? ' · Yönetici' : ''}</div></div>
        </div>
        <div class="att-btns">
          ${btn('geldi', '✓ Geldi')}${btn('mazeretli', '⏱ Mazeretli')}${btn('gelmedi', '✕ Gelmedi')}
        </div>
      </div>`;
  }).join('');

  const geldiler = CACHE.profiles.filter(p => (yoklamaDraft[p.id] !== undefined ? yoklamaDraft[p.id] : durumlar[p.id]) === 'geldi').length;

  return `
    <div class="card" style="margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap">
      <div><span class="badge blue">${esc(ders.baslik)}</span> <span class="li-sub">${fmtTarihKisa(ders.ders_tarihi)} · ${fmtSaat(ders.ders_tarihi)}</span></div>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap">
        <span class="badge ok">✓ ${geldiler}/${CACHE.profiles.length} GELDİ</span>
        <button class="btn small ghost" onclick="hepsiGeldi()">Hepsi Geldi</button>
        <button class="btn small ghost" onclick="draftTemizle()">Sıfırla</button>
      </div>
    </div>
    ${satirlar || '<div class="empty">Henüz kayıtlı üye yok.</div>'}`;
}

function yoklamaDersSec(val) { yoklamaDersId = parseInt(val, 10); yoklamaDraft = {}; document.getElementById('yoklama-liste').innerHTML = yoklamaListeHtml(); }
function yoklamaDurum(uyeId, durum) { yoklamaDraft[uyeId] = durum; document.getElementById('yoklama-liste').innerHTML = yoklamaListeHtml(); }
function draftTemizle() { yoklamaDraft = {}; document.getElementById('yoklama-liste').innerHTML = yoklamaListeHtml(); }
function hepsiGeldi() { CACHE.profiles.forEach(p => { yoklamaDraft[p.id] = 'geldi'; }); document.getElementById('yoklama-liste').innerHTML = yoklamaListeHtml(); }

async function yoklamaKaydet() {
  if (!Object.keys(yoklamaDraft).length) { toast('Değişiklik yok.'); return; }
  const rows = Object.entries(yoklamaDraft).map(([uyeId, durum]) => ({
    ders_id: yoklamaDersId, uye_id: uyeId, durum, kaydeden: ME.id
  }));
  const { error } = await _supabase.from('aselget_yoklama').upsert(rows, { onConflict: 'ders_id,uye_id' });
  if (error) { hataGoster('Yoklama kaydedilemedi: ' + supabaseHata(error)); return; }
  yoklamaDraft = {};
  toast('Yoklama kaydedildi ✓', 'ok');
  await loadAll(); route();
}

/* ---------- VİEW: ÜYELER ---------- */
function renderUyeler() {
  const appView = document.getElementById('app-view');
  const uyeler = CACHE.profiles.slice().sort((a, b) => (a.rol === b.rol ? (a.isim || '').localeCompare(b.isim || '') : a.rol === 'admin' ? -1 : 1));
  appView.innerHTML = `
    <div class="page-head">
      <div><div class="page-title">Üyeler</div><div class="page-sub">${uyeler.length} kayıtlı üye — karta tıkla, detayları gör</div></div>
    </div>
    <div class="grid grid-3">
      ${uyeler.map(p => {
        const ozet = uyeYoklamaOzet(p.id);
        return `
        <div class="card uye-card hoverable" onclick="uyeDetay('${jesc(p.id)}')">
          <div class="uye-top">
            <img src="${avatar(p.isim)}" width="46" height="46" alt="">
            <div style="min-width:0">
              <div class="uye-name">${esc(p.isim || 'Üye')}</div>
              <div class="uye-meta">${esc(p.sinif || '—')}${p.discord ? ' · @' + esc(p.discord) : ''}</div>
            </div>
          </div>
          <div>
            <div class="uye-rate-label"><span>Katılım</span><span>${ozet.oran === null ? 'veri yok' : ozet.oran + '%'}</span></div>
            <div class="rate-bar"><div class="rate-fill ${ozet.oran !== null ? (ozet.oran >= 75 ? 'good' : ozet.oran < 40 ? 'low' : '') : ''}" style="width:${ozet.oran === null ? 0 : ozet.oran}%"></div></div>
          </div>
          <div>${p.rol === 'admin' ? '<span class="badge blue">ADMİN</span>' : '<span class="badge dim">ÜYE</span>'}
               ${p.id === ME.id ? '<span class="badge ok">SEN</span>' : ''}</div>
        </div>`;
      }).join('')}
    </div>
    ${uyeler.length ? '' : '<div class="empty">Henüz kayıtlı üye yok.</div>'}`;
}

function uyeDetay(uyeId) {
  const p = CACHE.profiles.find(x => x.id === uyeId);
  if (!p) return;
  const ozet = uyeYoklamaOzet(uyeId);
  const kayitlar = CACHE.yoklama.filter(y => y.uye_id === uyeId)
    .map(y => ({ ...y, ders: CACHE.dersler.find(d => d.id === y.ders_id) }))
    .filter(y => y.ders)
    .sort((a, b) => new Date(b.ders.ders_tarihi) - new Date(a.ders.ders_tarihi));
  const badge = durum => durum === 'geldi' ? '<span class="badge ok">GELDİ</span>' : durum === 'mazeretli' ? '<span class="badge warn">MAZERETLİ</span>' : '<span class="badge bad">GELMEDİ</span>';

  openModal(`
    <div class="modal-head"><div class="modal-title">Üye Detayı</div><button class="modal-x" onclick="closeModal()">✕</button></div>
    <div style="display:flex; align-items:center; gap:14px; margin-bottom:16px">
      <img src="${avatar(p.isim)}" width="58" height="58" style="border-radius:50%; border:2px solid var(--border-strong)" alt="">
      <div>
        <div class="uye-name" style="font-size:17px">${esc(p.isim || 'Üye')}</div>
        <div class="uye-meta">${p.rol === 'admin' ? '<span class="badge blue">ADMİN</span>' : '<span class="badge dim">ÜYE</span>'} ${esc(p.sinif || '')}</div>
      </div>
    </div>
    ${p.discord ? `<div class="li-sub" style="margin-bottom:6px">💬 Discord: <b>@${esc(p.discord)}</b></div>` : ''}
    ${p.bio ? `<div class="li-sub" style="margin-bottom:12px">${esc(p.bio)}</div>` : ''}
    <div class="card" style="padding:14px; margin-bottom:14px">
      <div class="uye-rate-label"><span>Katılım Oranı</span><span>${ozet.oran === null ? 'veri yok' : ozet.oran + '%'} — ${ozet.geldi} geldi · ${ozet.mazeret} mazeretli · ${ozet.gelmedi} gelmedi</span></div>
      <div class="rate-bar"><div class="rate-fill ${ozet.oran !== null ? (ozet.oran >= 75 ? 'good' : ozet.oran < 40 ? 'low' : '') : ''}" style="width:${ozet.oran === null ? 0 : ozet.oran}%"></div></div>
    </div>
    ${is_admin() ? `
      <div class="field"><label class="label">Rol Yönetimi (Admin)</label>
        <div style="display:flex; gap:8px">
          <select class="select" id="rol-select">
            <option value="uye" ${p.rol === 'uye' ? 'selected' : ''}>Üye</option>
            <option value="admin" ${p.rol === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
          <button class="btn small" onclick="rolKaydet('${jesc(p.id)}')">Kaydet</button>
        </div>
      </div>` : ''}
    <div class="section-title" style="margin-top:10px">Yoklama Geçmişi</div>
    ${kayitlar.length ? kayitlar.slice(0, 12).map(y => `
      <div class="list-item" style="padding:9px 14px">
        <div class="li-main"><div class="li-title" style="font-size:13px">${esc(y.ders.baslik)}</div><div class="li-sub">${fmtTarihKisa(y.ders.ders_tarihi)}</div></div>
        ${badge(y.durum)}
      </div>`).join('') : '<div class="empty">Henüz yoklama kaydı yok.</div>'}
  `);
}

async function rolKaydet(uyeId) {
  if (!is_admin()) return;
  const yeniRol = document.getElementById('rol-select').value;
  const { error } = await _supabase.from('aselget_profiles').update({ rol: yeniRol }).eq('id', uyeId);
  if (error) { hataGoster('Rol değiştirilemedi: ' + supabaseHata(error)); return; }
  toast('Rol güncellendi.', 'ok');
  closeModal();
  await loadAll(); route();
}

/* ---------- VİEW: DUYURULAR ---------- */
function renderDuyurular() {
  const appView = document.getElementById('app-view');
  appView.innerHTML = `
    <div class="page-head">
      <div><div class="page-title">Duyurular</div><div class="page-sub">Topluluk duyuruları ve haberler</div></div>
      ${is_admin() ? '<button class="btn" onclick="duyuruFormu()">+ Duyuru Ekle</button>' : ''}
    </div>
    ${CACHE.duyurular.length ? CACHE.duyurular.map(d => {
      const olusturan = CACHE.profiles.find(p => p.id === d.olusturan);
      return `
      <div class="card ${d.onemli ? '' : ''}" style="margin-bottom:12px; ${d.onemli ? 'border-color:rgba(251,191,36,0.45);' : ''}">
        <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap">
          <div style="min-width:0">
            <div class="li-title" style="font-size:15.5px">${d.onemli ? '⚠️ ' : ''}${esc(d.baslik)}</div>
            <div class="li-sub" style="margin-top:6px; white-space:pre-wrap">${esc(d.icerik)}</div>
            <div class="li-sub" style="margin-top:8px">${esc(olusturan?.isim || 'Yönetim')} · ${fmtTarihKisa(d.created_at)}</div>
          </div>
          ${is_admin() ? `<div class="li-actions"><button class="btn small danger" onclick="duyuruSil(${d.id})">Sil</button></div>` : ''}
        </div>
      </div>`;
    }).join('') : '<div class="empty">Henüz duyuru yok.</div>'}`;
}

function duyuruFormu() {
  if (!is_admin()) return;
  openModal(`
    <div class="modal-head"><div class="modal-title">Yeni Duyuru</div><button class="modal-x" onclick="closeModal()">✕</button></div>
    <div class="field"><label class="label">Başlık *</label><input class="input" id="d-baslik" placeholder="Duyuru başlığı"></div>
    <div class="field"><label class="label">İçerik</label><textarea class="textarea" id="d-icerik" placeholder="Duyuru metni..."></textarea></div>
    <div class="field"><label style="display:flex; gap:9px; align-items:center; cursor:pointer"><input type="checkbox" id="d-onemli"> <span style="font-size:13px">Önemli duyuru olarak işaretle (sarı çerçeve)</span></label></div>
    <button class="btn" style="width:100%" onclick="duyuruEkle()">Duyuruyu Yayınla</button>
  `);
}

async function duyuruEkle() {
  const baslik = document.getElementById('d-baslik').value.trim();
  if (!baslik) { hataGoster('Başlık zorunludur.'); return; }
  const { error } = await _supabase.from('aselget_duyurular').insert([{
    baslik,
    icerik: document.getElementById('d-icerik').value.trim(),
    onemli: document.getElementById('d-onemli').checked,
    olusturan: ME.id
  }]);
  if (error) { hataGoster('Duyuru eklenemedi: ' + supabaseHata(error)); return; }
  closeModal(); toast('Duyuru yayınlandı.', 'ok');
  await loadAll(); route();
}

async function duyuruSil(id) {
  if (!confirm('Bu duyuru silinecek. Emin misin?')) return;
  const { error } = await _supabase.from('aselget_duyurular').delete().eq('id', id);
  if (error) { hataGoster('Silinemedi: ' + supabaseHata(error)); return; }
  toast('Duyuru silindi.', 'ok');
  await loadAll(); route();
}

/* ---------- VİEW: PROFİL ---------- */
function renderProfil() {
  const appView = document.getElementById('app-view');
  const ozet = uyeYoklamaOzet(ME.id);
  const katildigi = CACHE.yoklama.filter(y => y.uye_id === ME.id && y.durum === 'geldi').length;

  appView.innerHTML = `
    <div class="page-head"><div><div class="page-title">Profilim</div><div class="page-sub">Bilgilerini güncelle, katılımını takip et</div></div></div>
    <div class="grid grid-2">
      <div class="card">
        <div class="section-title" style="margin-top:0">Kişisel Bilgiler</div>
        <div class="field"><label class="label">Ad Soyad</label><input class="input" id="p-isim" value="${esc(ME.isim || '')}"></div>
        <div class="form-row">
          <div class="field"><label class="label">Sınıf</label><input class="input" id="p-sinif" value="${esc(ME.sinif || '')}" placeholder="örn. 12-A"></div>
          <div class="field"><label class="label">Discord</label><input class="input" id="p-discord" value="${esc(ME.discord || '')}" placeholder="kullanıcı_adı"></div>
        </div>
        <div class="field"><label class="label">Hakkımda</label><textarea class="textarea" id="p-bio" placeholder="İlgi alanların, bildiğin motorlar...">${esc(ME.bio || '')}</textarea></div>
        <button class="btn" onclick="profilKaydet()">Bilgilerimi Kaydet</button>
        <div class="li-sub" style="margin-top:12px">E-posta: ${esc(ME.email || '—')}</div>
      </div>
      <div>
        <div class="card" style="margin-bottom:14px">
          <div class="section-title" style="margin-top:0">Katılım Özetim</div>
          <div class="grid grid-3">
            <div><div class="stat-num accent">${katildigi}</div><div class="stat-label">GELDİĞİM DERS</div></div>
            <div><div class="stat-num">${ozet.mazeret}</div><div class="stat-label">MAZERETLİ</div></div>
            <div><div class="stat-num">${ozet.gelmedi}</div><div class="stat-label">GELMEDİĞİM</div></div>
          </div>
          <div style="margin-top:14px">
            <div class="uye-rate-label"><span>Genel Katılım</span><span>${ozet.oran === null ? 'veri yok' : ozet.oran + '%'}</span></div>
            <div class="rate-bar"><div class="rate-fill ${ozet.oran !== null ? (ozet.oran >= 75 ? 'good' : ozet.oran < 40 ? 'low' : '') : ''}" style="width:${ozet.oran === null ? 0 : ozet.oran}%"></div></div>
          </div>
        </div>
        <div class="card">
          <div class="section-title" style="margin-top:0">🏆 Topluluk Başarısı</div>
          <div class="li-sub">ASELGET Ekibi, geliştirdiği <b>"Parallel Rooms"</b> oyunuyla <b>EĞİTİJAM 2026 K12</b> kategorisinde <b>Türkiye Birincisi</b> oldu. Bu gurur hepimizin!</div>
        </div>
      </div>
    </div>`;
}

async function profilKaydet() {
  const isim = document.getElementById('p-isim').value.trim();
  if (!isim) { hataGoster('Ad soyad boş olamaz.'); return; }
  const { error } = await _supabase.from('aselget_profiles').update({
    isim,
    sinif: document.getElementById('p-sinif').value.trim(),
    discord: document.getElementById('p-discord').value.trim(),
    bio: document.getElementById('p-bio').value.trim()
  }).eq('id', ME.id);
  if (error) { hataGoster('Kaydedilemedi: ' + supabaseHata(error)); return; }
  ME.isim = isim;
  toast('Profilin güncellendi ✓', 'ok');
  await loadAll(); bootApp();
}
