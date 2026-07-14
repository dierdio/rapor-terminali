const SUPABASE_URL = 'https://bwajmlxxmxamwneyebax.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3YWptbHh4bXhhbXduZXllYmF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTA0MTIsImV4cCI6MjA5NDY4NjQxMn0.Buifz0hiJ-3SrXpCX31EiaQ_f8TMgyWOzmsm-9YIMoY';
    const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const BUILD_VERSION = 'v5.1 [PORTFOLIO/LAZY YÜKLEME]';

    const SCP_LIST = [ { s: 'Sektör 2', i: ['SCP-012','SCP-066','SCP-087','SCP-093','SCP-120','SCP-173','SCP-207','SCP-316','SCP-330','SCP-513','SCP-701','SCP-714','SCP-860','SCP-914','SCP-966','SCP-999','SCP-1025','SCP-1056','SCP-1162'] }, { s: 'Sektör 3', i: ['SCP-002','SCP-008','SCP-016','SCP-017','SCP-035','SCP-049','SCP-076','SCP-079','SCP-096','SCP-106','SCP-217','SCP-299','SCP-323','SCP-409','SCP-457','SCP-610','SCP-682','SCP-938','SCP-939','SCP-2006','SCP-3114'] } ];
    const SCD_LIST = [ { s: 'Sektör 2', i: ['SCD-012','SCD-066','SCD-087','SCD-093','SCD-120','SCD-173','SCD-207','SCD-316','SCD-330','SCD-513','SCD-701','SCD-714','SCD-860','SCD-914','SCD-966','SCD-999','SCD-1025','SCD-1056','SCD-1162'] }, { s: 'Sektör 3', i: ['SCD-002','SCD-008','SCD-016','SCD-017','SCD-035','SCD-049','SCD-076','SCD-079','SCD-096','SCD-106','SCD-217','SCD-299','SCD-323','SCD-409','SCD-457','SCD-610','SCD-682','SCD-938','SCD-939','SCD-2006','SCD-3114'] } ];
    const RUTBE_LIST = [ { kat: 'hc', label: '── HC ──', disabled: true }, { kat: 'hc', label: 'Bilim Direktörü Asistanı - S4' }, { kat: 'hc', label: 'Baş Araştırmacı - S4' }, { kat: 'hr', label: '── HR ──', disabled: true }, { kat: 'hr', label: 'Baş Araştırmacı Stajyeri - S4' }, { kat: 'hr', label: 'Tesis Araştırmacısı - S4' }, { kat: 'hr', label: 'Uzman Araştırmacı - S4' }, { kat: 'hr', label: 'Yetkin Araştırmacı - S4' }, { kat: 'mr', label: '── MR ──', disabled: true }, { kat: 'mr', label: 'Seçkin Araştırmacı - S4' }, { kat: 'mr', label: 'Deneyimli Araştırmacı - S3' }, { kat: 'mr', label: 'Araştırmacı - S3' }, { kat: 'mr', label: 'Yeni Araştırmacı - S3' }, { kat: 'lr', label: '── LR ──', disabled: true }, { kat: 'lr', label: 'Araştırmacı Adayı - S2' }, { kat: 'lr', label: 'Uzman Stajyer - S2' }, { kat: 'lr', label: 'Stajyer - S2' } ];
    const RC = { hc: '#9b2335', hr: '#e05252', mr: '#d4a017', lr: '#4caf50' };

    let CU = null, VF = null, VF_TAB = 'deney', imgs = [], tsc = 0, ALL_PROFILES = [], ALL_MESAJLAR = [];
    let ALL_RAPS = [], ALL_GRAPS = [], ALL_KAZA = [], ALL_MUHAFAZA = [], ALL_ORNEK_TOPLAMA = [], ALL_ORNEK_SAKLAMA = [];

    async function fetchRaps() { if (window.F_fetchRaps) return ALL_RAPS; window.F_fetchRaps = true;  const { data } = await _supabase.from('raporlar').select('id, username, display_name, scd, scp, d_no, sorumlu, rutbe, zb, ze, sd, amac, sonuc, ano, ek, timestamps, onay_durum, onay_yapan, onay_tarih, created_at').eq('is_deleted', false).order('created_at', { ascending: false }); ALL_RAPS = (data || []).map(dbToRap); return ALL_RAPS; }
    async function insertRap(rap) { const { data, error } = await _supabase.from('raporlar').insert([rapToDb(rap)]).select().single(); if (error) return null; const mapped = dbToRap(data); ALL_RAPS.unshift(mapped); logAction('YENİ RAPOR OLUŞTURULDU', `Deney Raporu ID: ${mapped.id}`); return mapped; }
    async function updateRap(id, fields) { const { error } = await _supabase.from('raporlar').update(fields).eq('id', id); if (!error) { const i = ALL_RAPS.findIndex(x => x.id === id); if (i >= 0) Object.assign(ALL_RAPS[i], fields); } }
    async function deleteRap(id) { const { error } = await _supabase.from('raporlar').update({ is_deleted: true }).eq('id', id); if (!error) ALL_RAPS = ALL_RAPS.filter(x => x.id !== id); }

    async function fetchGRaps() { if (window.F_fetchGRaps) return ALL_GRAPS; window.F_fetchGRaps = true;  const { data } = await _supabase.from('gunluk_raporlar').select('id, username, display_name, scd, scp, d_no, sorumlu, rutbe, zb, ze, sd, amac, sonuc, ano, ek, timestamps, onay_durum, onay_yapan, onay_tarih, created_at').eq('is_deleted', false).order('created_at', { ascending: false }); ALL_GRAPS = (data || []).map(dbToGRap); return ALL_GRAPS; }
    async function insertGRap(rap) { const { data, error } = await _supabase.from('gunluk_raporlar').insert([gRapToDb(rap)]).select().single(); if (error) return null; const mapped = dbToGRap(data); ALL_GRAPS.unshift(mapped); return mapped; }
    async function updateGRap(id, fields) { const { error } = await _supabase.from('gunluk_raporlar').update(fields).eq('id', id); if (!error) { const i = ALL_GRAPS.findIndex(x => x.id === id); if (i >= 0) Object.assign(ALL_GRAPS[i], fields); } }
    async function deleteGRap(id) { const { error } = await _supabase.from('gunluk_raporlar').update({ is_deleted: true }).eq('id', id); if (!error) ALL_GRAPS = ALL_GRAPS.filter(x => x.id !== id); }

    function dbToRap(r) { return { id: r.id, username: r.username, displayName: r.display_name, scd: r.scd, scp: r.scp, dNo: r.d_no, sorumlu: r.sorumlu, rutbe: r.rutbe, zb: r.zb, ze: r.ze, sd: r.sd, amac: r.amac, sonuc: r.sonuc, ano: r.ano, ek: r.ek, timestamps: r.timestamps || [], images: r.images || [], onayDurum: r.onay_durum || 'bekliyor', onayYapan: r.onay_yapan, onayTarih: r.onay_tarih, tarih: r.created_at ? new Date(r.created_at).toLocaleString('tr-TR') : '—' }; }
    function rapToDb(r) { return { user_id: CU.userId, username: r.username, display_name: r.displayName, scd: r.scd, scp: r.scp, d_no: r.dNo, sorumlu: r.sorumlu, rutbe: r.rutbe, zb: r.zb, ze: r.ze, sd: r.sd, amac: r.amac, sonuc: r.sonuc, ano: r.ano, ek: r.ek, timestamps: r.timestamps, images: r.images, onay_durum: 'bekliyor' }; }
    function dbToGRap(r) { return { id: r.id, username: r.username, displayName: r.display_name, dNo: r.d_no, robloxAdi: r.roblox_adi, rutbe: r.rutbe, rutbeKat: r.rutbe_kat, deneyler: r.deneyler, sure: r.sure, ekler: r.ekler, mesaiImgs: r.mesai_images || [], deneyImgs: r.deney_images || [], onayDurum: r.onay_durum || 'bekliyor', onayYapan: r.onay_yapan, onayTarih: r.onay_tarih, tarih: r.created_at ? new Date(r.created_at).toLocaleString('tr-TR') : '—' }; }
    function gRapToDb(r) { return { user_id: CU.userId, username: r.username, display_name: r.displayName, d_no: r.dNo, roblox_adi: r.robloxAdi, rutbe: r.rutbe, rutbe_kat: r.rutbeKat, deneyler: r.deneyler, sure: r.sure, ekler: r.ekler, mesai_images: r.mesaiImgs, deney_images: r.deneyImgs, onay_durum: 'bekliyor' }; }

    function getRaps() { return ALL_RAPS; } function getGRaps() { return ALL_GRAPS; }
    function userRapCount(u) { return ALL_RAPS.filter(r => r.username === u).length; } function userGRapCount(u) { return ALL_GRAPS.filter(r => r.username === u).length; } function fmtNo(n) { return String(n).padStart(3, '0') }

    async function fetchKaza() { if (window.F_fetchKaza) return ALL_KAZA; const { data } = await _supabase.from('kaza_raporlar').select('id, username, display_name, scd, scp, d_no, sorumlu, rutbe, zb, ze, sd, amac, sonuc, ano, ek, timestamps, onay_durum, onay_yapan, onay_tarih, created_at').eq('is_deleted', false).order('created_at', { ascending: false }); ALL_KAZA = data || []; window.F_fetchKaza = true; return ALL_KAZA; }
    async function insertKaza(r) { const { data, error } = await _supabase.from('kaza_raporlar').insert([r]).select().single(); if (error) return null; ALL_KAZA.unshift(data); return data; }
    async function deleteKaza(id) { const { error } = await _supabase.from('kaza_raporlar').update({ is_deleted: true }).eq('id', id); if (!error) ALL_KAZA = ALL_KAZA.filter(x => x.id !== id); }
    async function updateKaza(id, fields) { const { error } = await _supabase.from('kaza_raporlar').update(fields).eq('id', id); if (!error) { const i = ALL_KAZA.findIndex(x => x.id === id); if (i >= 0) Object.assign(ALL_KAZA[i], fields); } }

    async function fetchMuhafaza() { if (window.F_fetchMuhafaza) return ALL_MUHAFAZA; const { data } = await _supabase.from('muhafaza_raporlar').select('id, username, display_name, scd, scp, d_no, sorumlu, rutbe, zb, ze, sd, amac, sonuc, ano, ek, timestamps, onay_durum, onay_yapan, onay_tarih, created_at').eq('is_deleted', false).order('created_at', { ascending: false }); ALL_MUHAFAZA = data || []; window.F_fetchMuhafaza = true; return ALL_MUHAFAZA; }
    async function insertMuhafaza(r) { const { data, error } = await _supabase.from('muhafaza_raporlar').insert([r]).select().single(); if (error) return null; ALL_MUHAFAZA.unshift(data); return data; }
    async function deleteMuhafaza(id) { const { error } = await _supabase.from('muhafaza_raporlar').update({ is_deleted: true }).eq('id', id); if (!error) ALL_MUHAFAZA = ALL_MUHAFAZA.filter(x => x.id !== id); }
    async function updateMuhafaza(id, fields) { const { error } = await _supabase.from('muhafaza_raporlar').update(fields).eq('id', id); if (!error) { const i = ALL_MUHAFAZA.findIndex(x => x.id === id); if (i >= 0) Object.assign(ALL_MUHAFAZA[i], fields); } }

    async function fetchOrnekToplama() { if (window.F_fetchOrnekToplama) return ALL_ORNEK_TOPLAMA; const { data } = await _supabase.from('ornek_toplama_raporlar').select('id, username, display_name, scd, scp, d_no, sorumlu, rutbe, zb, ze, sd, amac, sonuc, ano, ek, timestamps, onay_durum, onay_yapan, onay_tarih, created_at').eq('is_deleted', false).order('created_at', { ascending: false }); ALL_ORNEK_TOPLAMA = data || []; window.F_fetchOrnekToplama = true; return ALL_ORNEK_TOPLAMA; }
    async function insertOrnekToplama(r) { const { data, error } = await _supabase.from('ornek_toplama_raporlar').insert([r]).select().single(); if (error) return null; ALL_ORNEK_TOPLAMA.unshift(data); return data; }
    async function deleteOrnekToplama(id) { const { error } = await _supabase.from('ornek_toplama_raporlar').update({ is_deleted: true }).eq('id', id); if (!error) ALL_ORNEK_TOPLAMA = ALL_ORNEK_TOPLAMA.filter(x => x.id !== id); }
    async function updateOrnekToplama(id, fields) { const { error } = await _supabase.from('ornek_toplama_raporlar').update(fields).eq('id', id); if (!error) { const i = ALL_ORNEK_TOPLAMA.findIndex(x => x.id === id); if (i >= 0) Object.assign(ALL_ORNEK_TOPLAMA[i], fields); } }

    async function fetchOrnekSaklama() { if (window.F_fetchOrnekSaklama) return ALL_ORNEK_SAKLAMA; const { data } = await _supabase.from('ornek_saklama_raporlar').select('id, username, display_name, scd, scp, d_no, sorumlu, rutbe, zb, ze, sd, amac, sonuc, ano, ek, timestamps, onay_durum, onay_yapan, onay_tarih, created_at').eq('is_deleted', false).order('created_at', { ascending: false }); ALL_ORNEK_SAKLAMA = data || []; window.F_fetchOrnekSaklama = true; return ALL_ORNEK_SAKLAMA; }
    async function insertOrnekSaklama(r) { const { data, error } = await _supabase.from('ornek_saklama_raporlar').insert([r]).select().single(); if (error) return null; ALL_ORNEK_SAKLAMA.unshift(data); return data; }
    async function deleteOrnekSaklama(id) { const { error } = await _supabase.from('ornek_saklama_raporlar').update({ is_deleted: true }).eq('id', id); if (!error) ALL_ORNEK_SAKLAMA = ALL_ORNEK_SAKLAMA.filter(x => x.id !== id); }
    async function updateOrnekSaklama(id, fields) { const { error } = await _supabase.from('ornek_saklama_raporlar').update(fields).eq('id', id); if (!error) { const i = ALL_ORNEK_SAKLAMA.findIndex(x => x.id === id); if (i >= 0) Object.assign(ALL_ORNEK_SAKLAMA[i], fields); } }

    async function fetchMesajlar() { if (window.F_fetchMesajlar) return ALL_MESAJLAR; const { data } = await _supabase.from('mesajlar').select('*').order('created_at', { ascending: false }); ALL_MESAJLAR = data || []; updateMesajBadge(); initRealtime(); logAction('SİSTEME GİRİŞ YAPILDI', 'Başarılı giriş'); window.F_fetchMesajlar = true; return ALL_MESAJLAR; }
    async function sendMesaj(row) { const { data, error } = await _supabase.from('mesajlar').insert([row]).select().single(); if (!error && data) ALL_MESAJLAR.unshift(data); return { data, error }; }
    async function mesajOkundu(id) { const m = ALL_MESAJLAR.find(x => x.id === id); if (!m) return; const list = Array.isArray(m.okundu_by) ? m.okundu_by : []; if (list.includes(CU.username)) return; const updated = [...list, CU.username]; await _supabase.from('mesajlar').update({ okundu_by: updated }).eq('id', id); m.okundu_by = updated; updateMesajBadge(); initRealtime(); logAction('SİSTEME GİRİŞ YAPILDI', 'Başarılı giriş'); }
    
window.MESAJ_TAB = window.MESAJ_TAB || 'gelen';
window.setMesajTab = function(tab) { window.MESAJ_TAB = tab; renderMesajKutusu(); };
function getGidenMesajlar() { if (!CU) return []; return ALL_MESAJLAR.filter(m => m.gonderen_un === CU.username); }
function getGelenMesajlar() { if (!CU) return []; return ALL_MESAJLAR.filter(m => m.alici_un === CU.username || m.alici_tip === 'toplu_herkes' || (m.alici_tip === 'toplu_yetkisiz' && CU.role === 'yetkisiz') || (m.alici_tip === 'toplu_yetkili' && CU.role === 'yetkili')); }
    function getOkunmamisSayi() { return getGelenMesajlar().filter(m => { const list = Array.isArray(m.okundu_by) ? m.okundu_by : []; return !list.includes(CU.username); }).length; }
    function updateMesajBadge() { const badge = document.getElementById('mesaj-badge'); if (!badge) return; const n = getOkunmamisSayi(); badge.textContent = n > 0 ? n : ''; badge.style.display = n > 0 ? 'inline-flex' : 'none'; }

    (async function initSession() {
      const { data } = await _supabase.auth.getSession();
      if (!data?.session?.user) { window.location.replace('/terminal/login.html'); return; }
      const userId = data.session.user.id;
      const { data: allProfiles } = await _supabase.from('profiles').select('*');
      ALL_PROFILES = (allProfiles || []).map(p => ({ username: p.username, role: p.role, displayName: p.display_name, rutbe: p.rutbe, rutbeKat: p.rutbe_kat, robloxId: p.roblox_id }));
      const myRow = (allProfiles || []).find(x => x.id === userId);
      const profileData = ALL_PROFILES.find(p => p.username === myRow?.username);
      if (!profileData) { await logAction('SİSTEMDEN ÇIKIŞ YAPILDI'); await _supabase.auth.signOut(); window.location.replace('/terminal/login.html'); return; }
      CU = Object.freeze({ userId, username: profileData.username, role: profileData.role, displayName: profileData.displayName, rutbe: profileData.rutbe, rutbeKat: profileData.rutbeKat, robloxId: profileData.robloxId, email: data.session.user.email });
      document.getElementById('hun').textContent = CU.displayName;
      const re = document.getElementById('hrutbe');
      re.textContent = CU.rutbe; re.style.color = RC[CU.rutbeKat] || 'var(--green)';
      
      await Promise.all([fetchMesajlar()]); 
      buildSidebar();
      await playBootSequence(); document.getElementById('init-loading').style.display = 'none';
      setTimeout(() => { Promise.all([fetchRaps(), fetchKaza(), fetchMuhafaza(), fetchOrnekToplama(), fetchOrnekSaklama(), fetchGRaps()]).catch(console.error); }, 1000);
      document.getElementById('main-screen').classList.add('active');
      if (CU.role === 'yetkisiz') { showPage(isS1() ? 'gunluk-yaz' : 'rapor-yaz'); }
      else { showPage('tum-raporlar'); }
      updateClock();
    })();

    function updateClock() { const el = document.getElementById('hclock'); if (el) { const n = new Date(); el.textContent = n.toLocaleDateString('tr-TR') + ' ' + n.toTimeString().split(' ')[0] } }
    setInterval(updateClock, 1000);
    (function () { const el = document.getElementById('build-ver-badge'); if (el) el.innerHTML = 'BUILD <span>' + BUILD_VERSION + '</span>'; })();

    async function doLogout() { await logAction('SİSTEMDEN ÇIKIŞ YAPILDI'); await _supabase.auth.signOut(); CU = null; VF = null; imgs = []; tsc = 0; window.location.replace('/terminal/login.html'); }

    function buildSidebar() {
      const sb = document.getElementById('sidebar');
      sb.innerHTML = CU.role === 'yetkisiz'
        ? (isS1()
          ? `<div class="sb-label">PERSONEL ERİŞİMİ</div>
             <div class="sb-tree-group"><button class="sb-tree-toggle open" id="tree-gunluk" onclick="toggleTree('gunluk')"><span>GÜNLÜK RAPORLAR</span><span class="sb-tree-arrow">▶</span></button><div class="sb-tree-children open" id="tree-gunluk-children"><button class="sb-item" id="nav-gunluk-yaz" onclick="showPage('gunluk-yaz')">RAPOR YAZ</button><button class="sb-item" id="nav-gunluk-raporlarim" onclick="showPage('gunluk-raporlarim')">RAPORLARIM</button></div></div>`
          : `<div class="sb-label">PERSONEL ERİŞİMİ</div>
             <div class="sb-tree-group"><button class="sb-tree-toggle open" id="tree-deney" onclick="toggleTree('deney')"><span>DENEY RAPORLARI</span><span class="sb-tree-arrow">▶</span></button><div class="sb-tree-children open" id="tree-deney-children"><button class="sb-item" id="nav-rapor-yaz" onclick="showPage('rapor-yaz')">RAPOR YAZ</button><button class="sb-item" id="nav-raporlarim" onclick="showPage('raporlarim')">RAPORLARIM</button></div></div>
             <div class="sb-tree-group"><button class="sb-tree-toggle" id="tree-gunluk" onclick="toggleTree('gunluk')"><span>GÜNLÜK RAPORLAR</span><span class="sb-tree-arrow">▶</span></button><div class="sb-tree-children" id="tree-gunluk-children"><button class="sb-item" id="nav-gunluk-yaz" onclick="showPage('gunluk-yaz')">RAPOR YAZ</button><button class="sb-item" id="nav-gunluk-raporlarim" onclick="showPage('gunluk-raporlarim')">RAPORLARIM</button></div></div>
             <div class="sb-tree-group"><button class="sb-tree-toggle" id="tree-ozel" onclick="toggleTree('ozel')"><span>ÖZEL RAPORLAR</span><span class="sb-tree-arrow">▶</span></button><div class="sb-tree-children" id="tree-ozel-children"><button class="sb-item" id="nav-ozel-raporlarim" onclick="showPage('ozel-raporlarim')">RAPORLARIM</button><button class="sb-item" id="nav-kaza-yaz" onclick="showPage('kaza-yaz')">KAZA YAZ</button><button class="sb-item" id="nav-muhafaza-yaz" onclick="showPage('muhafaza-yaz')">MUHAFAZA YAZ</button><button class="sb-item" id="nav-ornek-toplama-yaz" onclick="showPage('ornek-toplama-yaz')">ÖRNEK TOPLAMA</button><button class="sb-item" id="nav-ornek-saklama-yaz" onclick="showPage('ornek-saklama-yaz')">ÖRNEK SAKLAMA</button></div></div>
             <div class="sb-tree-group"><button class="sb-tree-toggle" id="tree-dinamik" onclick="toggleTree('dinamik'); yukleDinamikMenu()"><span>DİNAMİK RAPORLAR</span><span class="sb-tree-arrow">▶</span></button><div class="sb-tree-children" id="tree-dinamik-children"><div class="sb-item" style="font-size:9px">Yükleniyor...</div></div></div>`)
        : `<div class="sb-label">YETKİLİ ERİŞİMİ</div>
           <button class="sb-item" id="nav-tum-raporlar" onclick="showPage('tum-raporlar')">TÜM DENEY RAPORLARI</button>
           <button class="sb-item" id="nav-tum-ozel-raporlar" onclick="showPage('tum-ozel-raporlar')">TÜM ÖZEL RAPORLAR</button>
           <button class="sb-item" id="nav-dosyalar" onclick="showPage('dosyalar')">PERSONEL DOSYALARI</button>
           <div class="sb-label" style="margin-top:8px">SİSTEM YÖNETİMİ</div>
           <button class="sb-item" id="nav-hesap-olustur" onclick="showPage('hesap-olustur')">HESAP OLUŞTUR</button>
           <button class="sb-item" id="nav-personel-yonetimi" onclick="showPage('personel-yonetimi')">PERSONEL YÖNETİMİ</button>
           <button class="sb-item" id="nav-format-yonetimi" onclick="showPage('format-yonetimi')">RAPOR FORMATLARI</button>
           <div class="sb-label" style="margin-top:8px">İLETİŞİM</div>
           <button class="sb-item" id="nav-mesaj-kutu" onclick="toggleMesajKutusu()" style="color:var(--green);border-color:var(--green)">[ MESAJ KUTUSU ] <span id="sb-mesaj-badge" style="display:none;color:var(--bg);background:var(--green);padding:0 5px;border-radius:3px;margin-left:5px;"></span></button><button class="sb-item" id="nav-mesaj-gonder" onclick="showPage('mesaj-gonder')">MESAJ GÖNDER</button>`;
    }

    function toggleTree(id) { const toggle = document.getElementById('tree-' + id); const children = document.getElementById('tree-' + id + '-children'); if (!toggle || !children) return; const isOpen = toggle.classList.contains('open'); toggle.classList.toggle('open', !isOpen); children.classList.toggle('open', !isOpen); }
    function setNav(id) { document.querySelectorAll('.sb-item').forEach(e => e.classList.remove('active')); const el = document.getElementById('nav-' + id); if (el) el.classList.add('active'); }

    async function showPage(id) {
      window.current_page_id = id;
      VF = null; VF_TAB = 'deney'; imgs = []; tsc = 0; setNav(id);
      const ca = document.getElementById('ca');
      ca.innerHTML = '<div class="empty">YÜKLENİYOR...</div>';

      if (CU.role === 'yetkisiz') {
        const groupMap = { 'rapor-yaz': 'deney', 'raporlarim': 'deney', 'gunluk-yaz': 'gunluk', 'gunluk-raporlarim': 'gunluk', 'ozel-raporlarim': 'ozel', 'kaza-yaz': 'ozel', 'muhafaza-yaz': 'ozel', 'ornek-toplama-yaz': 'ozel', 'ornek-saklama-yaz': 'ozel', 'dinamik': 'dinamik' };
        const group = groupMap[id];
        if (group) { ['deney', 'gunluk', 'ozel', 'dinamik'].forEach(g => { const t = document.getElementById('tree-' + g); const c = document.getElementById('tree-' + g + '-children'); if (t && c) { t.classList.toggle('open', g === group); c.classList.toggle('open', g === group); } }); }
      }

      try {
        if (id === 'rapor-yaz') ca.innerHTML = bRaporYaz();
        else if (id === 'raporlarim') { ca.innerHTML = '<div class="ph"><h2>YÜKLENİYOR...</h2></div>'; setTimeout(async () => { await fetchRaps(); if (window.current_page_id !== id) return; ca.innerHTML = bRaporlarim(); if(window.typeText) ca.querySelectorAll('.ph h2').forEach(h=>window.typeText(h,h.textContent,20)); }, 10); }
        else if (id === 'tum-raporlar') { ca.innerHTML = '<div class="ph"><h2>YÜKLENİYOR...</h2></div>'; setTimeout(async () => { await fetchRaps(); if (window.current_page_id !== id) return; ca.innerHTML = bTumRaporlar(); if(window.typeText) ca.querySelectorAll('.ph h2').forEach(h=>window.typeText(h,h.textContent,20)); }, 10); }
        else if (id === 'dosyalar') { ca.innerHTML = '<div class="ph"><h2>YÜKLENİYOR...</h2></div>'; setTimeout(async () => { await Promise.all([fetchRaps(), fetchKaza(), fetchMuhafaza(), fetchOrnekToplama(), fetchOrnekSaklama(), fetchGRaps()]); if (window.current_page_id !== id) return; ca.innerHTML = bDosyalar(); if(window.typeText) ca.querySelectorAll('.ph h2').forEach(h=>window.typeText(h,h.textContent,20)); }, 10); }
        else if (id === 'gunluk-yaz') ca.innerHTML = bGunlukYaz();
        else if (id === 'gunluk-raporlarim') { ca.innerHTML = '<div class="ph"><h2>YÜKLENİYOR...</h2></div>'; setTimeout(async () => { await fetchGRaps(); if (window.current_page_id !== id) return; ca.innerHTML = bGunlukRaporlarim(); if(window.typeText) ca.querySelectorAll('.ph h2').forEach(h=>window.typeText(h,h.textContent,20)); }, 10); }
        else if (id === 'tum-gunluk') { ca.innerHTML = '<div class="ph"><h2>YÜKLENİYOR...</h2></div>'; setTimeout(async () => { await fetchGRaps(); if (window.current_page_id !== id) return; ca.innerHTML = bTumGunluk(); if(window.typeText) ca.querySelectorAll('.ph h2').forEach(h=>window.typeText(h,h.textContent,20)); }, 10); }
        else if (id === 'kaza-yaz') ca.innerHTML = bKazaYaz();
        else if (id === 'muhafaza-yaz') ca.innerHTML = bMuhafazaYaz();
        else if (id === 'ornek-toplama-yaz') ca.innerHTML = bOrnekToplamaYaz();
        else if (id === 'ornek-saklama-yaz') ca.innerHTML = bOrnekSaklamaYaz();
        else if (id === 'ozel-raporlarim') { ca.innerHTML = '<div class="ph"><h2>YÜKLENİYOR...</h2></div>'; setTimeout(async () => { await Promise.all([fetchKaza(), fetchMuhafaza(), fetchOrnekToplama(), fetchOrnekSaklama()]); if (window.current_page_id !== id) return; ca.innerHTML = bOzelRaporlarim(); if(window.typeText) ca.querySelectorAll('.ph h2').forEach(h=>window.typeText(h,h.textContent,20)); }, 10); }
        else if (id === 'tum-ozel-raporlar') { ca.innerHTML = '<div class="ph"><h2>YÜKLENİYOR...</h2></div>'; setTimeout(async () => { await Promise.all([fetchKaza(), fetchMuhafaza(), fetchOrnekToplama(), fetchOrnekSaklama()]); if (window.current_page_id !== id) return; ca.innerHTML = bTumOzelRaporlar(); if(window.typeText) ca.querySelectorAll('.ph h2').forEach(h=>window.typeText(h,h.textContent,20)); }, 10); }
        else if (id === 'mesaj-gonder') ca.innerHTML = bMesajGonder();
        else if (id === 'ayarlar') ca.innerHTML = bAyarlar();
        else if (id === 'loglar') { ca.innerHTML = '<div class="ph"><h2>YÜKLENİYOR...</h2></div>'; setTimeout(async () => { await fetchLoglar(); if (window.current_page_id !== id) return; ca.innerHTML = bLoglar(); if(window.typeText) ca.querySelectorAll('.ph h2').forEach(h=>window.typeText(h,h.textContent,20)); }, 10); }
        else if (id === 'hesap-olustur') ca.innerHTML = bHesapOlustur();
        else if (id === 'personel-yonetimi') ca.innerHTML = bPersonelYonetimi();
        else if (id === 'format-yonetimi') { ca.innerHTML = bFormatYonetimi(); fetchFormatlar(); }
      } catch (err) { ca.innerHTML = '<div class="empty">VERİLER YÜKLENİRKEN BİR HATA OLUŞTU.</div>'; console.error(err); }
      
      if (window.typeText) {
          const headers = ca.querySelectorAll('.ph h2');
          headers.forEach(header => {
              const text = header.textContent;
              window.typeText(header, text, 20);
          });
      }
    }

    function isS2() { return CU && CU.rutbeKat === 'lr'; } function isS1() { return CU && CU.rutbe && CU.rutbe.includes('S1'); }
    function scpOpts() { let h = '<option value="">-- SCP SEÇ --</option>'; SCP_LIST.forEach(s => { if (isS2() && s.s !== 'Sektör 2') return; h += `<optgroup label="[ ${s.s} ]">`; s.i.forEach(i => h += `<option value="${i}">${i}</option>`); h += `</optgroup>`; }); return h; }
    function scdOpts() { let h = '<option value="">-- DENEY KODU SEÇ --</option>'; SCD_LIST.forEach(s => { if (isS2() && s.s !== 'Sektör 2') return; h += `<optgroup label="[ ${s.s} ]">`; s.i.forEach(i => h += `<option value="${i}">${i}</option>`); h += `</optgroup>`; }); return h; }
    function rutbeOpts() { let h = '<option value="">-- RÜTBE SEÇ --</option>'; RUTBE_LIST.forEach(r => { if (r.disabled) h += `<option disabled style="color:${RC[r.kat]};font-weight:bold;background:#080f08">${r.label}</option>`; else h += `<option value="${r.label}" style="color:${RC[r.kat]};background:#080f08">${r.label}</option>`; }); return h; }

    function bHesapOlustur() { return `<div><div class="ph"><h2>HESAP OLUŞTUR</h2><p>// YENİ PERSONEL KAYDI</p></div><div class="suc" id="ho-suc">PERSONEL HESABI OLUŞTURULDU.</div><div class="form-err-box" id="ho-form-err"></div><div class="rf"><div class="fs"><div class="fs-title">// KİMLİK</div><div class="frow"><div class="fg"><label>KULLANICI ADI</label><input type="text" class="tin" id="ho-username"/></div><div class="fg"><label>ŞİFRE</label><input type="password" class="tin" id="ho-password"/></div></div><div class="fg"><label>AD SOYAD</label><input type="text" class="tin" id="ho-isim"/></div></div><div class="fs"><div class="fs-title">// YETKİ</div><div class="frow"><div class="fg"><label>RÜTBE</label><select class="ts" id="ho-rutbe" onchange="upRutbeClrHo()">${rutbeOpts()}</select></div><div class="fg"><label>YETKİ TÜRÜ</label><select class="ts" id="ho-role"><option value="yetkisiz">Yetkisiz</option><option value="yetkili">Yetkili Admin</option></select></div></div></div><button class="sub-btn" onclick="gonderHesapOlustur()" id="ho-btn">[ KAYDI TAMAMLA ]</button></div></div>`; }
    function upRutbeClrHo() { const sel = document.getElementById('ho-rutbe'); if (!sel) return; const f = RUTBE_LIST.find(r => r.label === sel.value); sel.style.color = f ? RC[f.kat] || 'var(--green)' : 'var(--green)'; }
    async function gonderHesapOlustur() { const btn = document.getElementById('ho-btn'); btn.disabled = true; btn.textContent = '[ İŞLENİYOR... ]'; const username = document.getElementById('ho-username').value.trim(); const password = document.getElementById('ho-password').value; const tam_isim = document.getElementById('ho-isim').value.trim(); const rutbe = document.getElementById('ho-rutbe').value; const yetkili = document.getElementById('ho-role').value === 'yetkili'; let seviye = 'Bilinmiyor'; if (rutbe.includes('- S')) seviye = 'S' + rutbe.split('- S')[1].trim(); try { const res = await fetch('/api/create-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, tam_isim, seviye, yetkili }) }); const data = await res.json(); if (res.ok) { const s = document.getElementById('ho-suc'); s.style.display = 'block'; setTimeout(() => s.style.display = 'none', 4000); } else { alert('[HATA]: ' + (data.error || 'Bilinmeyen bir hata oluştu.')); } } catch (err) { alert('API Hatası.'); } finally { btn.disabled = false; btn.textContent = '[ KAYDI TAMAMLA ]'; } }

    function bPersonelYonetimi() { let h = `<div><div class="ph"><h2>PERSONEL YÖNETİMİ</h2></div><div class="rlist">`; ALL_PROFILES.forEach(p => { h += `<div class="rc" style="display:flex;justify-content:space-between;align-items:center;border-left-color:var(--amber)"><div><div class="rc-id">${p.username}</div><div class="rc-meta">${p.displayName} · <span style="color:var(--amber)">${p.role.toUpperCase()}</span> · ${p.rutbe}</div></div><div style="display:flex;gap:6px"><button class="exp-btn" onclick="openEditModal('${p.username}')">[ DÜZENLE ]</button>${p.username !== CU.username ? `<button class="sil-btn" onclick="openDeleteUserModal('${p.username}')">[ SİL ]</button>` : ''}</div></div>`; }); return h + `</div></div>`; }
    function openEditModal(username) { const p = ALL_PROFILES.find(x => x.username === username); if (!p) return; document.getElementById('mt').textContent = `PERSONEL DÜZENLE // ${p.username}`; document.getElementById('mo-sil-btn').style.display = 'none'; let b = `<div class="rf" style="border:none;padding:0;max-width:100%"><div class="fs"><div class="fg"><label>İSİM SOYİSİM</label><input type="text" class="tin" id="ed-isim" value="${p.displayName}"/></div><div class="fg"><label>HESAP İZNİ</label><select class="ts" id="ed-role"><option value="yetkisiz" ${p.role==='yetkisiz'?'selected':''}>Yetkisiz</option><option value="yetkili" ${p.role==='yetkili'?'selected':''}>Yetkili</option></select></div><div class="fg"><label>RÜTBE</label><select class="ts" id="ed-rutbe"><option value="">-- SEÇİNİZ --</option>${RUTBE_LIST.map(r => r.disabled ? `<option disabled>${r.label}</option>` : `<option value="${r.label}" ${p.rutbe===r.label?'selected':''}>${r.label}</option>`).join('')}</select></div><div class="fg"><label>YENİ ŞİFRE</label><input type="password" class="tin" id="ed-sifre"/></div></div><button class="sub-btn" id="ed-btn" onclick="saveUserEdit('${p.username}')">[ GÜNCELLE ]</button><div id="ed-result" style="margin-top:10px;font-size:11px"></div></div>`; document.getElementById('mbody').innerHTML = b; document.getElementById('mo').classList.add('active'); }
    async function saveUserEdit(username) { const btn = document.getElementById('ed-btn'); const res = document.getElementById('ed-result'); btn.disabled = true; res.textContent = "Güncelleniyor..."; const payload = { action: 'update', targetUsername: username, newName: document.getElementById('ed-isim').value, newRole: document.getElementById('ed-role').value, newRutbe: document.getElementById('ed-rutbe').value, newPassword: document.getElementById('ed-sifre').value }; if (payload.newPassword) { const {data:prof} = await _supabase.from('profiles').select('id').eq('username', username).single(); if(prof) payload.targetUserId = prof.id; } try { const r = await fetch('/api/manage-user', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) }); if(r.ok) { res.textContent = "Başarılı!"; setTimeout(()=> window.location.reload(), 1500); } else { res.textContent = "Hata oluştu."; btn.disabled = false; } } catch(e) { res.textContent = "Bağlantı hatası."; btn.disabled = false; } }
    function openDeleteUserModal(username) { if(!confirm(`Silmek istediğinize emin misiniz?`)) return; executeUserDelete(username); }
    async function executeUserDelete(username) { const {data:prof} = await _supabase.from('profiles').select('id').eq('username', username).single(); if(!prof) return; const r = await fetch('/api/manage-user', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'delete', targetUserId: prof.id, targetUsername: username }) }); if(r.ok) { alert("Silindi."); window.location.reload(); } else { alert("Hata."); } }

    function bFormatYonetimi() { return `<div><div class="ph"><h2>RAPOR FORMATLARI</h2></div><div class="rf"><div class="fs"><div class="fg"><label>FORMAT ADI</label><input type="text" class="tin" id="fmt-adi"/></div><div class="fg"><label>ALANLAR (Virgülle ayırın)</label><textarea class="ta" id="fmt-alanlar"></textarea></div></div><button class="sub-btn" onclick="saveFormat()">[ EKLE ]</button></div><div class="ph" style="margin-top:30px"><h2>MEVCUT FORMATLAR</h2></div><div id="fmt-list" class="rlist">Yükleniyor...</div></div>`; }
    async function fetchFormatlar() { const list = document.getElementById('fmt-list'); if(!list) return; const { data, error } = await _supabase.from('rapor_formatlari').select('*').order('created_at', { ascending: false }); if(error || !data || data.length === 0) { list.innerHTML = `<div class="empty">HİÇ FORMAT YOK.</div>`; return; } let h = ''; data.forEach(f => { h += `<div class="rc" style="border-left-color:var(--green)"><div class="rc-hdr"><div class="rc-id">${f.format_adi}</div><div class="rc-meta">${f.olusturan}</div></div><div class="rc-body">Alanlar: ${f.alanlar.map(a => a.isim).join(', ')}</div><div style="margin-top:8px"><button class="sil-btn" onclick="silFormat(${f.id})">[ SİL ]</button></div></div>`; }); list.innerHTML = h; }
    async function silFormat(id) { if(!confirm("Emin misiniz?")) return; const {error} = await _supabase.from('rapor_formatlari').delete().eq('id', id); if(!error) fetchFormatlar(); }
    async function saveFormat() { const adi = document.getElementById('fmt-adi').value.trim(); const alanlarStr = document.getElementById('fmt-alanlar').value.trim(); if(!adi || !alanlarStr) return; const alanlar = alanlarStr.split(',').map(a => ({ isim: a.trim(), tip: 'textarea' })); const {error} = await _supabase.from('rapor_formatlari').insert([{ format_adi: adi, alanlar: alanlar, olusturan: CU.username }]); if(!error) { alert("Eklendi!"); showPage('format-yonetimi'); } }

    async function yukleDinamikMenu() { const c = document.getElementById('tree-dinamik-children'); if(!c) return; const {data, error} = await _supabase.from('rapor_formatlari').select('*'); if(error || !data || data.length === 0) { c.innerHTML = '<div class="sb-item" style="font-size:9px">Aktif format bulunamadı.</div>'; return; } c.innerHTML = data.map(f => `<button class="sb-item" onclick="showDinamikForm(${f.id}, '${f.format_adi}')">${f.format_adi.toUpperCase()}</button>`).join(''); }
    let aktifDinamikFormat = null;
    async function showDinamikForm(fId, fAdi) { document.querySelectorAll('.sb-item').forEach(e => e.classList.remove('active')); const {data} = await _supabase.from('rapor_formatlari').select('alanlar').eq('id', fId).single(); if(!data) return; aktifDinamikFormat = fId; let html = `<div><div class="ph"><h2>${fAdi.toUpperCase()}</h2></div><div class="rf"><div class="fs">`; data.alanlar.forEach((alan, i) => { html += `<div class="fg"><label>${alan.isim.toUpperCase()}</label><textarea class="ta dinamik-input" data-isim="${alan.isim}" id="dinamik-${i}"></textarea></div>`; }); html += `</div><button class="sub-btn" onclick="gonderDinamikRapor('${fAdi}')">[ GÖNDER ]</button></div></div>`; document.getElementById('ca').innerHTML = html; }
    async function gonderDinamikRapor(fAdi) { const inps = document.querySelectorAll('.dinamik-input'); let json = {}, bos = false; inps.forEach(i => { if(!i.value.trim()) bos=true; else json[i.getAttribute('data-isim')] = i.value.trim(); }); if(bos) return alert("Alanları doldurun."); const btn = document.querySelector('#ca .sub-btn'); btn.disabled=true; const {error} = await _supabase.from('dinamik_raporlar').insert([{format_id: aktifDinamikFormat, format_adi: fAdi, user_id: CU.userId, username: CU.username, display_name: CU.displayName, rutbe: CU.rutbe, icerik: json, onay_durum: 'bekliyor'}]); if(!error){ alert("Başarılı!"); inps.forEach(i=>i.value=''); } btn.disabled=false; }

    function bRaporYaz() { if (isS1()) return `<div><div class="ph"><h2>YENİ DENEY RAPORU</h2></div><div style="padding:20px;text-align:center;color:var(--red)">⚠ ERİŞİM REDDEDİLDİ</div></div>`; const nextNo = fmtNo(userRapCount(CU.username) + 1); const autoRutbe = CU.rutbe || ''; const rutbeColor = CU.rutbeKat ? (RC[CU.rutbeKat] || 'var(--green)') : 'var(--green)'; return `<div><div class="ph"><h2>YENİ DENEY RAPORU</h2></div><div class="suc" id="suc">BAŞARILI.</div><div class="form-err-box" id="form-err"></div><div class="rf"><div class="fs"><div class="frow"><div class="fg"><label>KOD</label><select class="ts" id="r-scd">${scdOpts()}</select></div><div class="fg"><label>NO</label><input type="text" class="tin" value="${nextNo}" readonly/></div></div><div class="frow"><div class="fg"><label>SCP</label><select class="ts" id="r-scp">${scpOpts()}</select></div><div class="fg"><label>SORUMLU</label><input type="text" class="tin" id="r-sor"/></div></div><div class="fg"><label>RÜTBE</label><input type="text" class="tin" id="r-rutbe" value="${autoRutbe}" readonly style="color:${rutbeColor}"/></div><div class="frow"><div class="fg"><label>BAŞLANGIÇ</label><input type="time" class="ttm" id="r-zb"/></div><div class="fg"><label>BİTİŞ</label><input type="time" class="ttm" id="r-ze"/></div></div><div class="fg"><label>SINIF-D</label><input type="number" class="tn" id="r-sd"/></div></div><div class="fs"><div class="fg"><label>AMACI</label><textarea class="ta" id="r-amac"></textarea></div><div class="fg"><label>SONUCU</label><textarea class="ta" id="r-sonuc"></textarea></div></div><div class="fs"><div class="ts-list" id="tsl"></div><button class="add-ts" onclick="addTs()">ZAMAN DAMGASI EKLE</button></div><div class="fs"><div class="fg"><label>ANOMALİLER</label><textarea class="ta" id="r-ano"></textarea></div><div class="fg"><label>EKLER</label><textarea class="ta" id="r-ek"></textarea></div></div><div class="fs"><div class="img-area" onclick="document.getElementById('img-in').click()"><input type="file" id="img-in" accept="image/*" multiple onchange="handleImgs(event)"/><label class="img-lbl">GÖRSEL YÜKLE</label><div class="img-prev" id="imgprev"></div></div></div><button class="sub-btn" onclick="gonder()">[ GÖNDER ]</button></div></div>`; }
    function addTs() { const list = document.getElementById('tsl'); if (!list) return; const id = 'ts' + Date.now(); tsc++; const div = document.createElement('div'); div.className = 'ts-row'; div.id = id; div.innerHTML = `<input type="time" class="ts-t" step="1"/><input type="text" class="ts-n" placeholder="Olay açıklaması..."/><button class="ts-rm" onclick="rmTs('${id}')">✕</button>`; list.appendChild(div); }
    function rmTs(id) { const el = document.getElementById(id); if (el) { el.remove(); tsc-- } }
    function getTs() { return Array.from(document.querySelectorAll('.ts-row')).map(r => ({ time: r.querySelector('.ts-t').value.trim(), note: r.querySelector('.ts-n').value.trim() })).filter(t => t.time || t.note); }
    function handleImgs(e) { Array.from(e.target.files).forEach(f => { const r = new FileReader(); r.onload = ev => { imgs.push(ev.target.result); renderImgs() }; r.readAsDataURL(f); }); }
    function renderImgs() { const p = document.getElementById('imgprev'); if (!p) return; p.innerHTML = imgs.map((s, i) => `<div class="img-th"><img src="${s}"/><button class="img-th-rm" onclick="rmImg(${i})">✕</button></div>`).join(''); }
    function rmImg(i) { imgs.splice(i, 1); renderImgs() }
    async function gonder() { const btn = document.querySelector('#ca .sub-btn'); if (btn) { btn.disabled = true; } const saved = await insertRap({ username: CU.username, displayName: CU.displayName, dNo: fmtNo(userRapCount(CU.username) + 1), scd: document.getElementById('r-scd').value, scp: document.getElementById('r-scp').value, sorumlu: document.getElementById('r-sor').value.trim(), rutbe: CU.rutbe || '', zb: document.getElementById('r-zb').value, ze: document.getElementById('r-ze').value, sd: document.getElementById('r-sd').value, amac: document.getElementById('r-amac').value.trim(), sonuc: document.getElementById('r-sonuc').value.trim(), ano: document.getElementById('r-ano').value.trim(), ek: document.getElementById('r-ek').value.trim(), timestamps: getTs(), images: [...imgs] }); if (btn) { btn.disabled = false; } if (!saved) { alert('Hata'); return; } alert('Başarılı!'); }

    function bRaporlarim() { const raps = getRaps().filter(r => r.username === CU.username); let h = `<div><div class="ph"><h2>RAPORLARIM</h2></div><div class="rlist">`; if (!raps.length) h += `<div class="empty">VERİ BULUNAMADI.</div>`; else raps.slice().reverse().forEach(r => h += rCard(r, false)); return h + `</div></div>`; }
    function bTumRaporlar() { const raps = getRaps(); let h = `<div><div class="ph"><h2>TÜM RAPORLAR</h2></div><div class="rlist">`; if (!raps.length) h += `<div class="empty">VERİ BULUNAMADI.</div>`; else raps.slice().reverse().forEach(r => h += rCard(r, true)); return h + `</div></div>`; }
    function rCard(r, su) { return `<div class="rc"><div class="rc-hdr"><div><div class="rc-id">${r.scd || '—'} // DENEY-${r.dNo || '000'}</div><div class="rc-meta">${su ? `<span style="color:var(--green)">${r.displayName}</span> · ` : ''}${r.tarih}</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><span class="rc-scp">${r.scp ? r.scp.split('–')[0].trim() : '—'}</span>${onayDurumBadge(r.onayDurum)}</div></div><div class="rc-body">${r.amac ? r.amac.substring(0, 120) + '…' : ''}</div><div style="display:flex;gap:6px;margin-top:8px"><button class="exp-btn" onclick="openMo(${r.id})">[ TAM RAPORU GÖRÜNTÜLE ]</button>${(CU.role === 'yetkili') ? `<button class="sil-btn" onclick="silRapor(${r.id})">[ SİL ]</button>` : ''}</div></div>`; }

    function bDosyalar() {
      const raps = getRaps(); const yetk = ALL_PROFILES.filter(u => u.role === 'yetkisiz');
      if (VF) {
        const u = ALL_PROFILES.find(x => x.username === VF); const ur = raps.filter(r => r.username === VF); const uk = ALL_KAZA.filter(r => r.username === VF); const um = ALL_MUHAFAZA.filter(r => r.username === VF); const uot = ALL_ORNEK_TOPLAMA.filter(r => r.username === VF); const uos = ALL_ORNEK_SAKLAMA.filter(r => r.username === VF); const ug = ALL_GRAPS.filter(r => r.username === VF);
        const tabs = [{ id: 'deney', label: 'DENEY', count: ur.length }, { id: 'kaza', label: 'KAZA', count: uk.length }, { id: 'muhafaza', label: 'MUHAFAZA', count: um.length }, { id: 'ornek-toplama', label: 'TOPLAMA', count: uot.length }, { id: 'ornek-saklama', label: 'SAKLAMA', count: uos.length }, { id: 'gunluk', label: 'GÜNLÜK', count: ug.length }];
        let tabsHtml = `<div class="dosya-tabs">` + tabs.map(t => `<button class="dosya-tab${VF_TAB === t.id ? ' active' : ''}" onclick="switchDosyaTab('${t.id}')">${t.label} <span class="dosya-tab-count">${t.count}</span></button>`).join('') + `</div>`;
        let contentHtml = '';
        if (VF_TAB === 'deney') contentHtml = `<div class="rlist">` + (ur.length ? ur.slice().reverse().map(r => rCard(r, false)).join('') : `<div class="empty">VERİ BULUNAMADI.</div>`) + `</div>`;
        else if (VF_TAB === 'kaza') contentHtml = buildKazaList(uk, false); else if (VF_TAB === 'muhafaza') contentHtml = buildMuhafazaList(um, false); else if (VF_TAB === 'ornek-toplama') contentHtml = buildOrnekToplamaList(uot, false); else if (VF_TAB === 'ornek-saklama') contentHtml = buildOrnekSaklamaList(uos, false); else if (VF_TAB === 'gunluk') contentHtml = buildGunlukList(ug, false);
        return `<div><button class="back-btn" onclick="VF=null;VF_TAB='deney';setNav('dosyalar');document.getElementById('ca').innerHTML=bDosyalar()">DOSYALARA DÖN</button><div class="ph"><h2>${u ? u.displayName.toUpperCase() : VF} // DOSYA</h2></div>${tabsHtml}<div id="dosya-tab-content" style="margin-top:14px">${contentHtml}</div></div>`;
      }
      let h = `<div><div class="ph"><h2>PERSONEL DOSYALARI</h2></div><div class="fgrid">`;
      yetk.forEach(u => { const c = raps.filter(r => r.username === u.username).length + ALL_KAZA.filter(r => r.username === u.username).length + ALL_MUHAFAZA.filter(r => r.username === u.username).length + ALL_ORNEK_TOPLAMA.filter(r => r.username === u.username).length + ALL_ORNEK_SAKLAMA.filter(r => r.username === u.username).length + ALL_GRAPS.filter(r => r.username === u.username).length; h += `<div class="fi" onclick="openFolder('${u.username}')"><span class="fi-icon">[DIR]</span><div class="fi-name">${u.displayName}</div><div class="fi-count">${c} KAYIT</div></div>`; });
      return h + `</div></div>`;
    }

    function switchDosyaTab(tabId) { VF_TAB = tabId; document.getElementById('ca').innerHTML = bDosyalar(); }
    function switchOzelTab(tabId, ctxId) { const wrap = document.getElementById('ozel-tab-wrap-' + ctxId); if (!wrap) return; wrap.querySelectorAll('.dosya-tab').forEach(b => b.classList.remove('active')); const btn = wrap.querySelector('[data-tab="' + tabId + '"]'); if (btn) btn.classList.add('active'); const content = document.getElementById('ozel-tab-content-' + ctxId); if (!content) return; const u = ctxId === 'mine' ? CU.username : null; const kList = u ? ALL_KAZA.filter(r => r.username === u) : ALL_KAZA; const mList = u ? ALL_MUHAFAZA.filter(r => r.username === u) : ALL_MUHAFAZA; const otList = u ? ALL_ORNEK_TOPLAMA.filter(r => r.username === u) : ALL_ORNEK_TOPLAMA; const osList = u ? ALL_ORNEK_SAKLAMA.filter(r => r.username === u) : ALL_ORNEK_SAKLAMA; const su = ctxId !== 'mine'; if (tabId === 'kaza') content.innerHTML = buildKazaList(kList, su); else if (tabId === 'muhafaza') content.innerHTML = buildMuhafazaList(mList, su); else if (tabId === 'ornek-toplama') content.innerHTML = buildOrnekToplamaList(otList, su); else if (tabId === 'ornek-saklama') content.innerHTML = buildOrnekSaklamaList(osList, su); }
    function buildOzelTabs(ctxId, defaultTab, counts) { const tabs = [{ id: 'kaza', label: 'KAZA', count: counts.kaza }, { id: 'muhafaza', label: 'MUHAFAZA', count: counts.muhafaza }, { id: 'ornek-toplama', label: 'TOPLAMA', count: counts.ot }, { id: 'ornek-saklama', label: 'SAKLAMA', count: counts.os }]; return `<div class="dosya-tabs" id="ozel-tab-wrap-${ctxId}">` + tabs.map(t => `<button class="dosya-tab${t.id === defaultTab ? ' active' : ''}" data-tab="${t.id}" onclick="switchOzelTab('${t.id}','${ctxId}')">${t.label} <span class="dosya-tab-count">${t.count}</span></button>`).join('') + `</div>`; }

    function bOzelRaporlarim() { const u = CU.username; const kList = ALL_KAZA.filter(r => r.username === u); const mList = ALL_MUHAFAZA.filter(r => r.username === u); const otList = ALL_ORNEK_TOPLAMA.filter(r => r.username === u); const osList = ALL_ORNEK_SAKLAMA.filter(r => r.username === u); const total = kList.length + mList.length + otList.length + osList.length; const tabs = buildOzelTabs('mine', 'kaza', { kaza: kList.length, muhafaza: mList.length, ot: otList.length, os: osList.length }); const content = buildKazaList(kList, false); return `<div><div class="ph"><h2>ÖZEL RAPORLARIM</h2></div>${tabs}<div id="ozel-tab-content-mine" style="margin-top:14px">${content}</div></div>`; }
    function bTumOzelRaporlar() { const tabs = buildOzelTabs('all', 'kaza', { kaza: ALL_KAZA.length, muhafaza: ALL_MUHAFAZA.length, ot: ALL_ORNEK_TOPLAMA.length, os: ALL_ORNEK_SAKLAMA.length }); const content = buildKazaList(ALL_KAZA, true); return `<div><div class="ph"><h2>TÜM ÖZEL RAPORLAR</h2></div>${tabs}<div id="ozel-tab-content-all" style="margin-top:14px">${content}</div></div>`; }
    function openFolder(u) { VF = u; VF_TAB = 'deney'; document.getElementById('ca').innerHTML = bDosyalar() }

    function buildKazaList(list, showUser) { return `<div class="rlist">` + (list.length ? list.slice().reverse().map(r => kazaCard(r, showUser)).join('') : `<div class="empty">VERİ BULUNAMADI.</div>`) + `</div>`; }
    function kazaCard(r, su) { return `<div class="rc" style="border-left-color:#e05252"><div class="rc-hdr"><div><div class="rc-id" style="color:#e05252">KAZA-${String(r.id).padStart(3, '0')}</div><div class="rc-meta">${su ? `<span style="color:var(--green)">${r.display_name}</span> · ` : ''}${r.olay_tarihi || '—'}</div></div><div>${onayDurumBadge(r.onay_durum || 'bekliyor')}</div></div><div class="rc-body">${r.olay_ozeti ? r.olay_ozeti.substring(0, 120) + '…' : '—'}</div><div style="display:flex;gap:6px;margin-top:8px"><button class="exp-btn" onclick="openKazaMo(${r.id})">[ TAM GÖRÜNTÜLE ]</button>${(CU.role === 'yetkili') ? `<button class="sil-btn" onclick="silKaza(${r.id})">[ SİL ]</button>` : ''}</div></div>`; }
    function buildMuhafazaList(list, showUser) { return `<div class="rlist">` + (list.length ? list.slice().reverse().map(r => muhafazaCard(r, showUser)).join('') : `<div class="empty">VERİ BULUNAMADI.</div>`) + `</div>`; }
    function muhafazaCard(r, su) { return `<div class="rc" style="border-left-color:var(--amber)"><div class="rc-hdr"><div><div class="rc-id" style="color:var(--amber)">MUHAFAZA-${String(r.id).padStart(3, '0')}</div><div class="rc-meta">${su ? `<span style="color:var(--green)">${r.display_name}</span> · ` : ''}${r.operasyon_tarihi || '—'}</div></div><div>${onayDurumBadge(r.onay_durum || 'bekliyor')}</div></div><div class="rc-body">${r.operasyon_nedeni ? r.operasyon_nedeni.substring(0, 120) + '…' : '—'}</div><div style="display:flex;gap:6px;margin-top:8px"><button class="exp-btn" onclick="openMuhafazaMo(${r.id})">[ TAM GÖRÜNTÜLE ]</button>${(CU.role === 'yetkili') ? `<button class="sil-btn" onclick="silMuhafaza(${r.id})">[ SİL ]</button>` : ''}</div></div>`; }
    function buildOrnekToplamaList(list, showUser) { return `<div class="rlist">` + (list.length ? list.slice().reverse().map(r => ornekToplamaCard(r, showUser)).join('') : `<div class="empty">VERİ BULUNAMADI.</div>`) + `</div>`; }
    function ornekToplamaCard(r, su) { return `<div class="rc" style="border-left-color:#4caf50"><div class="rc-hdr"><div><div class="rc-id" style="color:#4caf50">TOPLAMA-${String(r.id).padStart(3, '0')}</div><div class="rc-meta">${su ? `<span style="color:var(--green)">${r.display_name}</span> · ` : ''}${r.ornek_tarihi || '—'}</div></div><div>${onayDurumBadge(r.onay_durum || 'bekliyor')}</div></div><div class="rc-body">${r.ne_yapilacak ? r.ne_yapilacak.substring(0, 120) + '…' : '—'}</div><div style="display:flex;gap:6px;margin-top:8px"><button class="exp-btn" onclick="openOrnekToplamaMo(${r.id})">[ TAM GÖRÜNTÜLE ]</button>${(CU.role === 'yetkili') ? `<button class="sil-btn" onclick="silOrnekToplama(${r.id})">[ SİL ]</button>` : ''}</div></div>`; }
    function buildGunlukList(list, showUser) { return `<div class="rlist">` + (list.length ? list.slice().reverse().map(r => gCard(r, showUser)).join('') : `<div class="empty">VERİ BULUNAMADI.</div>`) + `</div>`; }
    function buildOrnekSaklamaList(list, showUser) { return `<div class="rlist">` + (list.length ? list.slice().reverse().map(r => ornekSaklamaCard(r, showUser)).join('') : `<div class="empty">VERİ BULUNAMADI.</div>`) + `</div>`; }
    function ornekSaklamaCard(r, su) { return `<div class="rc" style="border-left-color:#607d8b"><div class="rc-hdr"><div><div class="rc-id" style="color:#90a4ae">SAKLAMA-${String(r.id).padStart(3, '0')}</div><div class="rc-meta">${su ? `<span style="color:var(--green)">${r.display_name}</span> · ` : ''}${r.ornek_tarih_saat || '—'}</div></div><div>${onayDurumBadge(r.onay_durum || 'bekliyor')}</div></div><div class="rc-body">${r.saklama_yeri ? r.saklama_yeri.substring(0, 120) + '…' : '—'}</div><div style="display:flex;gap:6px;margin-top:8px"><button class="exp-btn" onclick="openOrnekSaklamaMo(${r.id})">[ TAM GÖRÜNTÜLE ]</button>${(CU.role === 'yetkili') ? `<button class="sil-btn" onclick="silOrnekSaklama(${r.id})">[ SİL ]</button>` : ''}</div></div>`; }

    function openKazaMo(id) { const r = ALL_KAZA.find(x => x.id === id); if (!r) return; openModalId = id; const silBtn = document.getElementById('mo-sil-btn'); if (silBtn) { silBtn.onclick = () => silKaza(id); silBtn.style.display = (CU.role === 'yetkili') ? 'block' : 'none'; } document.getElementById('mt').textContent = `KAZA RAPORU — ${r.display_name}`; let b = `<div class="mf"><div class="mfl">OLAY TARİHİ</div><div class="mfv">${r.olay_tarihi || '—'}</div></div><div class="mf"><div class="mfl">// OLAY ÖZETİ</div><div class="mfp">${r.olay_ozeti || '—'}</div></div>`; document.getElementById('mbody').innerHTML = b; document.getElementById('mo').classList.add('active'); }
    function openMuhafazaMo(id) { const r = ALL_MUHAFAZA.find(x => x.id === id); if (!r) return; openModalId = id; const silBtn = document.getElementById('mo-sil-btn'); if (silBtn) { silBtn.onclick = () => silMuhafaza(id); silBtn.style.display = (CU.role === 'yetkili') ? 'block' : 'none'; } document.getElementById('mt').textContent = `MUHAFAZA RAPORU — ${r.display_name}`; let b = `<div class="mf"><div class="mfl">OPERASYON TARİHİ</div><div class="mfv">${r.operasyon_tarihi || '—'}</div></div><div class="mf"><div class="mfl">// NEDENİ</div><div class="mfp">${r.operasyon_nedeni || '—'}</div></div>`; document.getElementById('mbody').innerHTML = b; document.getElementById('mo').classList.add('active'); }
    function openOrnekToplamaMo(id) { const r = ALL_ORNEK_TOPLAMA.find(x => x.id === id); if (!r) return; openModalId = id; const silBtn = document.getElementById('mo-sil-btn'); if (silBtn) { silBtn.onclick = () => silOrnekToplama(id); silBtn.style.display = (CU.role === 'yetkili') ? 'block' : 'none'; } document.getElementById('mt').textContent = `ÖRNEK TOPLAMA RAPORU — ${r.display_name}`; let b = `<div class="mf"><div class="mfl">TARİH</div><div class="mfv">${r.ornek_tarihi || '—'}</div></div><div class="mf"><div class="mfl">// YAPILACAK</div><div class="mfp">${r.ne_yapilacak || '—'}</div></div>`; document.getElementById('mbody').innerHTML = b; document.getElementById('mo').classList.add('active'); }
    function openOrnekSaklamaMo(id) { const r = ALL_ORNEK_SAKLAMA.find(x => x.id === id); if (!r) return; openModalId = id; const silBtn = document.getElementById('mo-sil-btn'); if (silBtn) { silBtn.onclick = () => silOrnekSaklama(id); silBtn.style.display = (CU.role === 'yetkili') ? 'block' : 'none'; } document.getElementById('mt').textContent = `ÖRNEK SAKLAMA RAPORU — ${r.display_name}`; let b = `<div class="mf"><div class="mfl">TARİH/SAAT</div><div class="mfv">${r.ornek_tarih_saat || '—'}</div></div><div class="mf"><div class="mfl">// YER</div><div class="mfp">${r.saklama_yeri || '—'}</div></div>`; document.getElementById('mbody').innerHTML = b; document.getElementById('mo').classList.add('active'); }

    function silKaza(id) { const r = ALL_KAZA.find(x => x.id === id); if (!r) return; silPendingId = 'kaza_' + id; document.getElementById('confirm-target').textContent = `KAZA RAPORU — ${r.display_name}`; document.getElementById('confirm-overlay').classList.add('active'); }
    function silMuhafaza(id) { const r = ALL_MUHAFAZA.find(x => x.id === id); if (!r) return; silPendingId = 'muh_' + id; document.getElementById('confirm-target').textContent = `MUHAFAZA RAPORU — ${r.display_name}`; document.getElementById('confirm-overlay').classList.add('active'); }
    function silOrnekToplama(id) { const r = ALL_ORNEK_TOPLAMA.find(x => x.id === id); if (!r) return; silPendingId = 'ot_' + id; document.getElementById('confirm-target').textContent = `ÖRNEK TOPLAMA — ${r.display_name}`; document.getElementById('confirm-overlay').classList.add('active'); }
    function silOrnekSaklama(id) { const r = ALL_ORNEK_SAKLAMA.find(x => x.id === id); if (!r) return; silPendingId = 'os_' + id; document.getElementById('confirm-target').textContent = `ÖRNEK SAKLAMA — ${r.display_name}`; document.getElementById('confirm-overlay').classList.add('active'); }

    function bKazaYaz() { return `<div><div class="ph"><h2>YENİ KAZA RAPORU</h2></div><div class="rf"><div class="fs"><div class="fg"><label>OLAY TARİHİ</label><input type="text" class="tin" id="kaza-tarih" placeholder="GG.AA.YYYY"/></div><div class="fg"><label>OLAY ÖZETİ</label><textarea class="ta" id="kaza-ozet"></textarea></div><div class="fg"><label>OLAY SEBEBİ</label><textarea class="ta" id="kaza-sebep"></textarea></div><div class="fg"><label>KAYIPLAR</label><textarea class="ta" id="kaza-kayip"></textarea></div></div><button class="sub-btn" onclick="gonderKaza()">[ KAZA RAPORUNU GÖNDER ]</button></div></div>`; }
    async function gonderKaza() { const btn = document.querySelector('#ca .sub-btn'); if (btn) { btn.disabled = true; btn.textContent = '[ GÖNDERİLİYOR... ]'; } const saved = await insertKaza({ user_id: CU.userId, username: CU.username, display_name: CU.displayName, olay_tarihi: document.getElementById('kaza-tarih').value, olay_ozeti: document.getElementById('kaza-ozet').value, olay_sebebi: document.getElementById('kaza-sebep').value, kayiplar: document.getElementById('kaza-kayip').value, onay_durum: 'bekliyor' }); if (btn) { btn.disabled = false; btn.textContent = '[ KAZA RAPORUNU GÖNDER ]'; } if (!saved) { alert('Hata'); return; } alert("Başarılı"); }
    function bMuhafazaYaz() { return `<div><div class="ph"><h2>YENİ MUHAFAZA RAPORU</h2></div><div class="rf"><div class="fs"><div class="fg"><label>SCP</label><select class="ts" id="muh-scp">${scpOpts()}</select></div><div class="fg"><label>TARİH</label><input type="text" class="tin" id="muh-tarih"/></div><div class="fg"><label>NEDENİ</label><textarea class="ta" id="muh-neden"></textarea></div><div class="fg"><label>DEĞİŞİKLİKLER</label><textarea class="ta" id="muh-degisiklik"></textarea></div></div><button class="sub-btn" onclick="gonderMuhafaza()">[ GÖNDER ]</button></div></div>`; }
    async function gonderMuhafaza() { const saved = await insertMuhafaza({ user_id: CU.userId, username: CU.username, display_name: CU.displayName, degisen_scp: document.getElementById('muh-scp').value, operasyon_tarihi: document.getElementById('muh-tarih').value, operasyon_nedeni: document.getElementById('muh-neden').value, muhafaza_degisiklikler: document.getElementById('muh-degisiklik').value, onay_durum: 'bekliyor' }); if (!saved) { alert('Hata'); return; } alert("Başarılı"); }
    function bOrnekToplamaYaz() { return `<div><div class="ph"><h2>YENİ ÖRNEK TOPLAMA RAPORU</h2></div><div class="rf"><div class="fs"><div class="fg"><label>SCP</label><select class="ts" id="ot-scp">${scpOpts()}</select></div><div class="fg"><label>TARİH</label><input type="text" class="tin" id="ot-tarih"/></div><div class="fg"><label>NE YAPILACAK</label><textarea class="ta" id="ot-ne"></textarea></div></div><button class="sub-btn" onclick="gonderOrnekToplama()">[ GÖNDER ]</button></div></div>`; }
    async function gonderOrnekToplama() { const saved = await insertOrnekToplama({ user_id: CU.userId, username: CU.username, display_name: CU.displayName, ornek_scp: document.getElementById('ot-scp').value, ornek_tarihi: document.getElementById('ot-tarih').value, ne_yapilacak: document.getElementById('ot-ne').value, onay_durum: 'bekliyor' }); if (!saved) { alert('Hata'); return; } alert("Başarılı"); }
    function bOrnekSaklamaYaz() { return `<div><div class="ph"><h2>YENİ ÖRNEK SAKLAMA RAPORU</h2></div><div class="rf"><div class="fs"><div class="fg"><label>SCP</label><select class="ts" id="os-scp">${scpOpts()}</select></div><div class="fg"><label>TARİH/SAAT</label><input type="text" class="tin" id="os-tarih"/></div><div class="fg"><label>NE YAPILACAK</label><textarea class="ta" id="os-ne"></textarea></div><div class="fg"><label>YER</label><textarea class="ta" id="os-yer"></textarea></div></div><button class="sub-btn" onclick="gonderOrnekSaklama()">[ GÖNDER ]</button></div></div>`; }
    async function gonderOrnekSaklama() { const saved = await insertOrnekSaklama({ user_id: CU.userId, username: CU.username, display_name: CU.displayName, ornek_scp: document.getElementById('os-scp').value, ornek_tarih_saat: document.getElementById('os-tarih').value, ne_yapilacak: document.getElementById('os-ne').value, saklama_yeri: document.getElementById('os-yer').value, onay_durum: 'bekliyor' }); if (!saved) { alert('Hata'); return; } alert("Başarılı"); }

    async function openMo(id) {
      const r = getRaps().find(x => x.id === id); if (!r) return;
      if (!r.images_loaded) {
          const { data } = await _supabase.from('raporlar').select('images').eq('id', id).single();
          r.images = data ? (data.images || []) : [];
          r.images_loaded = true;
      }
      openModalId = id; openGModalId = null;
      const silBtn = document.getElementById('mo-sil-btn');
      if (silBtn) { silBtn.onclick = () => silFromModal(); silBtn.style.display = (CU.role === 'yetkili') ? 'block' : 'none'; }
      document.getElementById('mt').textContent = `${r.scd || '—'} // DENEY-${r.dNo || '000'}`;
      const rk = RUTBE_LIST.find(x => x.label === r.rutbe); const rc = rk ? RC[rk.kat] || 'var(--green)' : 'var(--green)';
      let b = `<div class="mf"><div class="mfl">DENEY KODU / NUMARA</div><div class="mfv">${r.scd || '—'} &nbsp;|&nbsp; DENEY-${r.dNo || '000'}</div></div><div class="mf"><div class="mfl">SCP</div><div class="mfv">${r.scp || '—'}</div></div><div class="mf"><div class="mfl">DENEY SORUMLUSU</div><div class="mfv">${r.sorumlu || '—'}</div></div><div class="mf"><div class="mfl">PERSONEL RÜTBESİ</div><div class="mfv" style="color:${rc}">${r.rutbe || '—'}</div></div><div class="mf"><div class="mfl">ZAMAN</div><div class="mfv">${r.zb || '--:--'} → ${r.ze || '--:--'}</div></div><div class="mf"><div class="mfl">KULLANILAN SINIF-D</div><div class="mfv">${r.sd || '0'} KİŞİ</div></div><div class="mf"><div class="mfl">RAPOR TARİHİ</div><div class="mfv">${r.tarih}</div></div><div class="mf"><div class="mfl">// DENEY AMACI</div><div class="mfp">${r.amac || '—'}</div></div><div class="mf"><div class="mfl">// DENEY SONUCU</div><div class="mfp">${r.sonuc || '—'}</div></div>`;
      if (r.timestamps && r.timestamps.length > 0) { b += `<div class="mf"><div class="mfl">// ZAMAN DAMGALARI</div>`; r.timestamps.forEach(t => { b += `<div class="mts"><span class="mts-t">[${t.time || '--:--:--'}]</span><span>${t.note || ''}</span></div>`; }); b += `</div>`; }
      b += `<div class="mf"><div class="mfl">// ANORMAL DURUMLAR</div><div class="mfp">${r.ano || 'Kayıt yok.'}</div></div><div class="mf"><div class="mfl">// EKLEMELERİM</div><div class="mfp">${r.ek || 'Kayıt yok.'}</div></div>`;
      b += `<div class="mf"><div class="mfl">// ONAY DURUMU</div><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:4px">${onayDurumBadge(r.onayDurum)}${r.onayYapan ? `<span style="font-size:10px;color:var(--text-dim)">— ${r.onayYapan} · ${r.onayTarih}</span>` : ''}</div>${CU.role === 'yetkili' ? `<div class="onay-btn-grp"><button class="onay-btn onayla" onclick="onaylaRapor(${r.id})">[ ✓ ONAYLA ]</button><button class="onay-btn reddet" onclick="reddetRapor(${r.id})">[ ✕ REDDET ]</button></div>`: ''}</div>`;
      if (r.images && r.images.length > 0) { b += `<div class="mf"><div class="mfl">// GÖRSELLER</div><div class="mimgs">`; r.images.forEach(s => { b += `<img src="${s}" class="mimg" onclick="openLb('${s}')" title="Büyütmek için tıkla"/>`; }); b += `</div></div>`; }
      document.getElementById('mbody').innerHTML = b; document.getElementById('mo').classList.add('active');
    }

    function openLb(src) { document.getElementById('lb-img').src = src; document.getElementById('lb').classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeLb() { document.getElementById('lb').classList.remove('active'); document.getElementById('lb-img').src = ''; document.body.style.overflow = ''; }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb() });
    function onayDurumBadge(durum) { if (durum === 'onaylandi') return `<span class="onay-badge onay-onaylandi">✓ ONAYLANDI</span>`; if (durum === 'reddedildi') return `<span class="onay-badge onay-reddedildi">✕ REDDEDİLDİ</span>`; return `<span class="onay-badge onay-bekliyor">◎ ONAY BEKLİYOR</span>`; }

    function bGunlukYaz() { return `<div><div class="ph"><h2>YENİ GÜNLÜK RAPOR</h2></div><div class="rf"><div class="fs"><div class="fg"><label>ROBLOX TAKMA ADIM</label><input type="text" class="tin" id="g-roblox"/></div></div><div class="fs"><div class="fg"><label>YAPTIĞIM DENEYLER</label><textarea class="ta" id="g-deneyler"></textarea></div><div class="fg"><label>SÜRE</label><input type="text" class="tin" id="g-sure"/></div></div><button class="sub-btn" onclick="gonderGunluk()">[ GÖNDER ]</button></div></div>`; }
    async function gonderGunluk() { const saved = await insertGRap({ username: CU.username, displayName: CU.displayName, dNo: fmtNo(userGRapCount(CU.username) + 1), robloxAdi: document.getElementById('g-roblox').value, deneyler: document.getElementById('g-deneyler').value, sure: document.getElementById('g-sure').value }); if (!saved) { alert('Hata'); return; } alert("Başarılı"); }
    function bGunlukRaporlarim() { const graps = getGRaps().filter(r => r.username === CU.username); let h = `<div><div class="ph"><h2>GÜNLÜK RAPORLARIM</h2></div><div class="rlist">`; if (!graps.length) h += `<div class="empty">VERİ BULUNAMADI.</div>`; else graps.slice().reverse().forEach(r => h += gCard(r, false)); return h + `</div></div>`; }
    function bTumGunluk() { const graps = getGRaps(); let h = `<div><div class="ph"><h2>TÜM GÜNLÜK RAPORLAR</h2></div><div class="rlist">`; if (!graps.length) h += `<div class="empty">VERİ BULUNAMADI.</div>`; else graps.slice().reverse().forEach(r => h += gCard(r, true)); return h + `</div></div>`; }
    function gCard(r, su) { return `<div class="rc" style="border-left-color:var(--amber-dim)"><div class="rc-hdr"><div><div class="rc-id" style="color:var(--amber)">GÜNLÜK-${r.dNo || '000'}</div><div class="rc-meta">${su ? `<span style="color:var(--green)">${r.displayName}</span> · ` : ''}${r.tarih}</div></div></div><div class="rc-body">${r.deneyler ? r.deneyler.substring(0, 120) + '…' : ''}</div><div style="display:flex;gap:6px;margin-top:8px"><button class="exp-btn" onclick="openGMo(${r.id})">[ TAM RAPORU GÖRÜNTÜLE ]</button>${(CU.role === 'yetkili') ? `<button class="sil-btn" onclick="silGRapor(${r.id})">[ SİL ]</button>` : ''}</div></div>`; }
    let openGModalId = null;
    function openGMo(id) { const r = getGRaps().find(x => x.id === id); if (!r) return; openGModalId = id; const silBtn = document.getElementById('mo-sil-btn'); if (silBtn) { silBtn.style.display = (CU.role === 'yetkili') ? 'block' : 'none'; silBtn.onclick = () => silGRaporFromModal(); } document.getElementById('mt').textContent = `GÜNLÜK RAPOR — ${r.dNo || '000'} // ${r.displayName}`; let b = `<div class="mf"><div class="mfl">YAPILAN DENEYLER</div><div class="mfp">${r.deneyler || '—'}</div></div><div class="mf"><div class="mfl">MESAİDE GEÇİRİLEN SÜRE</div><div class="mfv">${r.sure || '—'}</div></div>`; document.getElementById('mbody').innerHTML = b; document.getElementById('mo').classList.add('active'); }
    function silGRaporFromModal() { if (openGModalId) silGRapor(openGModalId); }
    function silGRapor(id) { const r = getGRaps().find(x => x.id === id); if (!r) return; silPendingId = 'g_' + id; document.getElementById('confirm-target').textContent = `GÜNLÜK-${r.dNo || '000'} — ${r.displayName}`; document.getElementById('confirm-overlay').classList.add('active'); }

    let silPendingId = null, openModalId = null;
    function silFromModal() { if (openModalId) silRapor(openModalId) }
    function silRapor(id) { const r = getRaps().find(x => x.id === id); if (!r) return; silPendingId = id; document.getElementById('confirm-target').textContent = `${r.scd || '—'} // DENEY-${r.dNo || '000'} — ${r.displayName}`; document.getElementById('confirm-overlay').classList.add('active'); }
    async function confirmSil() {
      if (!silPendingId) return;
      if (typeof silPendingId === 'string' && silPendingId.startsWith('g_')) { await deleteGRap(parseInt(silPendingId.replace('g_', ''))); } else if (typeof silPendingId === 'string' && silPendingId.startsWith('kaza_')) { await deleteKaza(parseInt(silPendingId.replace('kaza_', ''))); } else if (typeof silPendingId === 'string' && silPendingId.startsWith('muh_')) { await deleteMuhafaza(parseInt(silPendingId.replace('muh_', ''))); } else if (typeof silPendingId === 'string' && silPendingId.startsWith('ot_')) { await deleteOrnekToplama(parseInt(silPendingId.replace('ot_', ''))); } else if (typeof silPendingId === 'string' && silPendingId.startsWith('os_')) { await deleteOrnekSaklama(parseInt(silPendingId.replace('os_', ''))); } else { await deleteRap(silPendingId); }
      silPendingId = null; document.getElementById('confirm-overlay').classList.remove('active'); closeMoDirect(); const activeNav = document.querySelector('.sb-item.active'); if (activeNav) { const id = activeNav.id.replace('nav-', ''); if (id === 'dosyalar' && VF) { document.getElementById('ca').innerHTML = bDosyalar(); } else showPage(id); }
    }
    function cancelSil() { silPendingId = null; document.getElementById('confirm-overlay').classList.remove('active'); }
    function closeMo(e) { if (e.target === document.getElementById('mo')) closeMoDirect() }
    function closeMoDirect() { document.getElementById('mo').classList.remove('active') }

    function toggleMesajKutusu() { const ov = document.getElementById('mesaj-overlay'); if (ov.classList.contains('active')) { closeMesajKutusu(); return; } renderMesajKutusu(); ov.classList.add('active'); }
    function closeMesajKutusu() { document.getElementById('mesaj-overlay').classList.remove('active'); }
    function closeMesajOnOutside(e) { if (e.target === document.getElementById('mesaj-overlay')) closeMesajKutusu(); }
    function closeMesajDetay() { document.getElementById('mesaj-detay-overlay').classList.remove('active'); }
    function closeMesajDetayOnOutside(e) { if (e.target === document.getElementById('mesaj-detay-overlay')) closeMesajDetay(); }
    function fmtMesajTarih(ts) { if (!ts) return '—'; const d = new Date(ts); return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); }
    function renderMesajKutusu() {
    const body = document.getElementById('mesaj-panel-body');
    let tabHtml = '';
    if (CU && CU.role === 'yetkili') {
        tabHtml = `<div style="display:flex;gap:10px;margin-bottom:15px;">
            <button class="${window.MESAJ_TAB === 'gelen' ? 'mesaj-tab-btn active' : 'mesaj-tab-btn'}" onclick="setMesajTab('gelen')" style="flex:1;padding:5px;background:var(--bg);color:var(--green);border:1px solid var(--green);cursor:pointer;font-family:inherit;font-size:inherit;${window.MESAJ_TAB === 'gelen' ? 'background:var(--green);color:#000;' : ''}">[ GELEN KUTUSU ]</button>
            <button class="${window.MESAJ_TAB === 'giden' ? 'mesaj-tab-btn active' : 'mesaj-tab-btn'}" onclick="setMesajTab('giden')" style="flex:1;padding:5px;background:var(--bg);color:var(--green);border:1px solid var(--green);cursor:pointer;font-family:inherit;font-size:inherit;${window.MESAJ_TAB === 'giden' ? 'background:var(--green);color:#000;' : ''}">[ GÖNDERİLENLER ]</button>
        </div>`;
    }
    
    const liste = window.MESAJ_TAB === 'giden' ? getGidenMesajlar() : getGelenMesajlar();
    
    if (!liste.length) {
        body.innerHTML = tabHtml + `<div class="mesaj-bos">[ KUTU BOŞ ]</div>`;
        return;
    }
    
    body.innerHTML = tabHtml + liste.map(m => {
        const okundu = Array.isArray(m.okundu_by) && m.okundu_by.includes(CU.username);
        const aliciBilgi = m.alici_tip === 'tekil' ? `Sana/Ona` : m.alici_tip === 'toplu_yetkisiz' ? 'Toplu (Yetkisiz)' : m.alici_tip === 'toplu_yetkili' ? 'Toplu (Yetkili)' : 'Toplu (Herkes)';
        const profil = ALL_PROFILES.find(p => p.username === m.gonderen_un);
        const kodAdi = profil ? profil.displayName : m.gonderen_un;
        return `<div class="mesaj-item${okundu ? '' : ' okunmamis'}" onclick="mesajDetayAc(${m.id})"><div class="mesaj-item-hdr"><span class="mesaj-item-konu">${m.konu}</span><span class="mesaj-item-tarih">${fmtMesajTarih(m.created_at)}</span></div><div class="mesaj-item-gonderen">Gönderen: ${kodAdi} · ${aliciBilgi}</div><div class="mesaj-item-preview">${m.mesaj}</div></div>`;
    }).join('');
}
    async function mesajDetayAc(id) { const m = ALL_MESAJLAR.find(x => x.id === id); if (!m) return; await mesajOkundu(id); renderMesajKutusu(); const aliciLabel = m.alici_tip === 'tekil' ? m.alici_un : m.alici_tip === 'toplu_yetkisiz' ? 'Tüm Yetkisiz Personel' : m.alici_tip === 'toplu_yetkili' ? 'Tüm Yetkili Personel' : 'Tüm Personel'; const body = document.getElementById('mesaj-detay-body'); const profil = ALL_PROFILES.find(p => p.username === m.gonderen_un); const kodAdi = profil ? profil.displayName : m.gonderen_un; body.innerHTML = `<div class="mesaj-detay-meta"><span class="mesaj-detay-ml">GÖNDEREN</span><span class="mesaj-detay-mv">${kodAdi}</span><span class="mesaj-detay-ml">ALICI</span><span class="mesaj-detay-mv">${aliciLabel}</span><span class="mesaj-detay-ml">KONU</span><span class="mesaj-detay-mv">${m.konu}</span><span class="mesaj-detay-ml">TARİH</span><span class="mesaj-detay-mv">${fmtMesajTarih(m.created_at)}</span></div><div class="mesaj-detay-icerik">${m.mesaj}</div>${m.gorsel_url ? `<img src="${m.gorsel_url}" class="mesaj-detay-gorsel" alt="Görsel" onclick="openLb('${m.gorsel_url}')" style="cursor:zoom-in;max-width:100%;"/>` : ''}${m.gonderen_un === CU.username ? `<div style="margin-top:15px;text-align:right;"><button class="sil-btn" onclick="silMesaj(${m.id})" style="font-size:10px">[ MESAJI SİL ]</button></div>` : ''}`; document.getElementById('mesaj-detay-overlay').classList.add('active'); }
    function bMesajGonder() { const opts = ALL_PROFILES.filter(p => p.username !== CU.username).sort((a, b) => a.username.localeCompare(b.username)).map(p => `<option value="tekil:${p.username}">${p.username} — ${p.displayName || ''} (${p.role})</option>`).join(''); return `<div class="mesaj-form-wrap"><div class="ph"><h2>MESAJ GÖNDER</h2></div><div class="rf" style="margin-top:16px"><div class="fs"><div class="fs-title">// ALICI SEÇİMİ</div><select class="mesaj-alici-select" id="mg-alici"><optgroup label="── TOPLU MESAJ ──"><option value="toplu_yetkisiz">Toplu Mesaj (Tüm Yetkisiz Personel)</option><option value="toplu_yetkili">Toplu Mesaj (Tüm Yetkili Personel)</option><option value="toplu_herkes">Toplu Mesaj (Herkes)</option></optgroup><optgroup label="── BİREYSEL PERSONEL ──">${opts}</optgroup></select></div><div class="fs" style="margin-top:12px"><div class="fs-title">// KONU</div><input type="text" class="ts" id="mg-konu" style="width:100%"/></div><div class="fs" style="margin-top:12px"><div class="fs-title">// MESAJ İÇERİĞİ</div><textarea class="ta" id="mg-mesaj" rows="7" style="width:100%"></textarea></div><div class="fs" style="margin-top:12px"><div class="fs-title">// GÖRSEL EKLE (OPSİYONEL)</div><input type="file" id="mg-gorsel" accept="image/*" class="ts" style="width:100%;cursor:pointer"/></div><button class="mesaj-send-btn" id="mg-send-btn" onclick="mesajGonder()">[ MESAJI GÖNDER ]</button><div id="mg-result" style="margin-top:10px;font-size:10px;display:none"></div></div></div>`; }
    async function mesajGonder() { const aliciVal = document.getElementById('mg-alici').value; const konu = document.getElementById('mg-konu').value.trim(); const mesajText = document.getElementById('mg-mesaj').value.trim(); const gorselFile = document.getElementById('mg-gorsel').files[0]; const resultEl = document.getElementById('mg-result'); const btn = document.getElementById('mg-send-btn'); if (!konu || !mesajText) { resultEl.style.display = 'block'; resultEl.style.color = 'var(--red)'; resultEl.textContent = '[HATA] Konu ve mesaj zorunludur.'; return; } btn.disabled = true; resultEl.style.display = 'block'; resultEl.style.color = 'var(--text-dim)'; resultEl.textContent = 'GÖNDERİLİYOR...'; let gorselUrl = null; if (gorselFile) { gorselUrl = await new Promise((resolve) => { const r = new FileReader(); r.onload = ev => resolve(ev.target.result); r.readAsDataURL(gorselFile); }); } const isTekil = aliciVal.startsWith('tekil:'); const row = { gonderen_id: (await _supabase.auth.getUser()).data.user.id, gonderen_un: CU.username, alici_tip: isTekil ? 'tekil' : aliciVal, alici_un: isTekil ? aliciVal.replace('tekil:', '') : null, konu, mesaj: mesajText, gorsel_url: gorselUrl }; const { error } = await sendMesaj(row); btn.disabled = false; if (error) { resultEl.style.color = 'var(--red)'; resultEl.textContent = '[HATA] Mesaj gönderilemedi: ' + error.message; } else { resultEl.style.color = 'var(--green)'; resultEl.textContent = '✓ MESAJ BAŞARIYLA GÖNDERİLDİ.'; logAction('MESAJ GÖNDERİLDİ', `Alıcı: ${row.alici_tip} ${row.alici_un || ''}`); document.getElementById('mg-konu').value = ''; document.getElementById('mg-mesaj').value = ''; document.getElementById('mg-gorsel').value = ''; } }
async function onaylaRapor(id, type = 'deney') {
    let table = type === 'gunluk' ? 'gunluk_raporlar' : 'raporlar';
    let array = type === 'gunluk' ? ALL_GRAPS : ALL_RAPS;
    
    const { error } = await _supabase.from(table).update({ onay_durum: 'onaylandi', onay_yapan: CU.displayName, onay_tarih: new Date().toISOString() }).eq('id', id);
    if (!error) {
        let r = array.find(x => x.id === id);
        if (r) {
            r.onayDurum = 'onaylandi';
            r.onayYapan = CU.displayName;
            r.onayTarih = new Date().toISOString();
        }
        logAction('RAPOR REDDEDİLDİ', `Rapor ID: ${id} (${type})`);
        logAction('RAPOR ONAYLANDI', `Rapor ID: ${id} (${type})`);
        if (type === 'gunluk') {
            if (openGModalId) openGMo(openGModalId);
            showPage(VF ? 'dosyalar' : 'tum-gunluk');
        } else {
            if (openModalId) openMo(openModalId);
            showPage(VF ? 'dosyalar' : 'tum-raporlar');
        }
    } else {
        alert("Bir hata oluştu.");
    }
}

async function reddetRapor(id, type = 'deney') {
    let table = type === 'gunluk' ? 'gunluk_raporlar' : 'raporlar';
    let array = type === 'gunluk' ? ALL_GRAPS : ALL_RAPS;
    
    const { error } = await _supabase.from(table).update({ onay_durum: 'reddedildi', onay_yapan: CU.displayName, onay_tarih: new Date().toISOString() }).eq('id', id);
    if (!error) {
        let r = array.find(x => x.id === id);
        if (r) {
            r.onayDurum = 'reddedildi';
            r.onayYapan = CU.displayName;
            r.onayTarih = new Date().toISOString();
        }
        logAction('RAPOR REDDEDİLDİ', `Rapor ID: ${id} (${type})`);
        logAction('RAPOR ONAYLANDI', `Rapor ID: ${id} (${type})`);
        if (type === 'gunluk') {
            if (openGModalId) openGMo(openGModalId);
            showPage(VF ? 'dosyalar' : 'tum-gunluk');
        } else {
            if (openModalId) openMo(openModalId);
            showPage(VF ? 'dosyalar' : 'tum-raporlar');
        }
    } else {
        alert("Bir hata oluştu.");
    }
}

async function silMesaj(id) {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
    const { data, error } = await _supabase.from('mesajlar').delete().eq('id', id).select();
    if (!error) {
        if (data && data.length === 0) {
            alert('Mesaj silinemedi: Supabase veritabanında (RLS) "Delete" yetkiniz kapalı olabilir. Lütfen Supabase panelinden mesajlar tablosu için Delete politikasını (policy) açın.');
            return;
        }
        ALL_MESAJLAR = ALL_MESAJLAR.filter(m => m.id !== id);
        updateMesajBadge(); initRealtime(); logAction('SİSTEME GİRİŞ YAPILDI', 'Başarılı giriş');
        renderMesajKutusu();
        closeMesajDetay();
        logAction('MESAJ SİLİNDİ', `Mesaj ID: ${id}`);
    } else {
        alert('Mesaj silinirken hata oluştu.');
    }
}


function bAyarlar() {
    const s = JSON.parse(localStorage.getItem('t62_settings') || '{}');
    const theme = s.theme || 'default';
    const sfx = s.sfx !== false;
    const fastBoot = s.fastBoot === true;
    
    return `<div class="ph"><h2>SİSTEM AYARLARI</h2></div>
    <div class="rf" style="margin-top:16px;">
        <div class="fs">
            <div class="fs-title">// ARAYÜZ TEMASI</div>
            <select id="set-theme" class="ts" onchange="saveSettings()">
                <option value="default" ${theme === 'default' ? 'selected' : ''}>Klasik Yeşil (Matrix)</option>
                <option value="amber" ${theme === 'amber' ? 'selected' : ''}>Kehribar (Eski Sistem)</option>
                <option value="red" ${theme === 'red' ? 'selected' : ''}>Kırmızı Alarm</option>
            </select>
        </div>
        <div class="fs" style="margin-top:16px;">
            <div class="fs-title">// SES EFEKTLERİ</div>
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
                <input type="checkbox" id="set-sfx" onchange="saveSettings()" ${sfx ? 'checked' : ''} /> Ses efektleri açık (Tıklama, Bildirim vs.)
            </label>
        </div>
        <div class="fs" style="margin-top:16px;">
            <div class="fs-title">// HIZLI BAŞLATMA</div>
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
                <input type="checkbox" id="set-boot" onchange="saveSettings()" ${fastBoot ? 'checked' : ''} /> Boot simülasyonunu atla
            </label>
        </div>
    </div>`;
}

function saveSettings() {
    const theme = document.getElementById('set-theme').value;
    const sfx = document.getElementById('set-sfx').checked;
    const fastBoot = document.getElementById('set-boot').checked;
    
    const settings = { theme, sfx, fastBoot };
    localStorage.setItem('t62_settings', JSON.stringify(settings));
    applySettings();
}

function applySettings() {
    const s = JSON.parse(localStorage.getItem('t62_settings') || '{}');
    document.body.classList.remove('theme-amber', 'theme-red');
    if (s.theme && s.theme !== 'default') {
        document.body.classList.add('theme-' + s.theme);
    }
    // Update global variables for sound if needed
    window.T62_SFX = s.sfx !== false;
}

// Ensure settings are applied on load
applySettings();


async function logAction(aksiyon, detay = '') {
    if (!CU || !CU.username) return;
    try {
        await _supabase.from('sistem_loglari').insert([{
            kullanici_ad: CU.username,
            aksiyon: aksiyon,
            detay: detay
        }]);
    } catch(e) {}
}

let ALL_LOGS = [];
async function fetchLoglar() {
    const { data } = await _supabase.from('sistem_loglari').select('*').order('created_at', { ascending: false }).limit(100);
    ALL_LOGS = data || [];
    return ALL_LOGS;
}

function bLoglar() {
    let h = `<div class="ph"><h2>SİSTEM GÜVENLİK LOGLARI</h2></div><div class="rlist" style="margin-top:10px;">`;
    if (!ALL_LOGS.length) {
        h += `<div class="empty">LOG BULUNAMADI.</div>`;
    } else {
        h += ALL_LOGS.map(l => {
            const date = new Date(l.created_at).toLocaleString('tr-TR');
            return `<div class="rc" style="display:flex;flex-direction:column;gap:5px;border-left-color:var(--amber);">
                <div style="font-size:10px;color:var(--text-dim)">[ ${date} ] — KULLANICI: <span style="color:var(--green)">${l.kullanici_ad}</span></div>
                <div style="font-size:14px;color:var(--text)">◈ ${l.aksiyon}</div>
                ${l.detay ? `<div style="font-size:11px;color:var(--text-dim)">Detay: ${l.detay}</div>` : ''}
            </div>`;
        }).join('');
    }
    h += `</div>`;
    return h;
}


function showToast(title, msg) {
    if (window.T62_SFX !== false && window.playClick) {
        // play a sound if we have one
        const actx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = actx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, actx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, actx.currentTime + 0.1);
        const g = actx.createGain();
        g.gain.setValueAtTime(0.1, actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.2);
        osc.connect(g); g.connect(actx.destination);
        osc.start(); osc.stop(actx.currentTime + 0.2);
    }
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.style.background = 'var(--bg2)';
    t.style.border = '1px solid var(--green)';
    t.style.padding = '10px 15px';
    t.style.color = 'var(--green)';
    t.style.fontFamily = "'VT323', monospace";
    t.style.boxShadow = '0 0 10px var(--green-glow)';
    t.style.opacity = '0';
    t.style.transform = 'translateX(100%)';
    t.style.transition = 'all 0.3s ease';
    t.innerHTML = `<div style="font-weight:bold;font-size:16px;border-bottom:1px solid var(--border);padding-bottom:5px;margin-bottom:5px;">◈ ${title}</div><div style="font-size:14px;color:var(--text-dim)">${msg}</div>`;
    c.appendChild(t);
    
    setTimeout(() => { t.style.opacity = '1'; t.style.transform = 'translateX(0)'; }, 50);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(100%)'; setTimeout(() => t.remove(), 300); }, 5000);
}

function initRealtime() {
    // Listen for new messages
    _supabase.channel('public:mesajlar')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mesajlar' }, payload => {
            const m = payload.new;
            if (m.gonderen_un !== CU.username && (m.alici_un === CU.username || m.alici_tip === 'toplu_herkes' || (m.alici_tip === 'toplu_yetkisiz' && CU.role === 'yetkisiz') || (m.alici_tip === 'toplu_yetkili' && CU.role === 'yetkili'))) {
                ALL_MESAJLAR.unshift(m);
                updateMesajBadge();
                renderMesajKutusu();
                showToast('YENİ MESAJ', `Gönderen: ${m.gonderen_un}<br>Konu: ${m.konu}`);
            }
        })
        .subscribe();
        
    // Listen for report approvals
    _supabase.channel('public:raporlar')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'raporlar' }, payload => {
            const r = payload.new;
            if (r.username === CU.username && r.onay_durum !== 'bekliyor') {
                // Update local state if needed
                const local = ALL_RAPS.find(x => x.id === r.id);
                if (local && local.onayDurum === 'bekliyor') {
                    local.onayDurum = r.onay_durum;
                    local.onayYapan = r.onay_yapan;
                    showToast('RAPOR GÜNCELLEMESİ', `Rapor ID: ${r.id}<br>Durum: ${r.onay_durum.toUpperCase()}`);
                }
            }
        })
        .subscribe();
}
