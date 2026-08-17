/* controllin' App Logic with VDS Integration */

const SUPABASE_URL = 'https://poxifowrycsxkhduzshx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBveGlmb3dyeWNzeGtoZHV6c2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTI1ODAsImV4cCI6MjEwMTk2ODU4MH0.X0HK_oqako8yY7-Sf9wWGRSgUp7VaYtSFdao7g0OaGE';
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let vdsConfig = { url: '', token: '' };
let currentFileManagerPath = '';
let activeServerName = null;

// Auth Kontrolü
(async function init() {
    const { data } = await _supabase.auth.getSession();
    if (!data?.session?.user) {
        window.location.replace('/controllin/login.html');
        return;
    }

    const { data: profile } = await _supabase.from('controllin_profiles').select('*').eq('id', data.session.user.id).single();
    if (!profile) {
        await _supabase.auth.signOut();
        window.location.replace('/controllin/login.html');
        return;
    }

    currentUser = profile;
    document.getElementById('current-user').textContent = currentUser.username;

    if (window.location.pathname.endsWith('.html')) {
        const clean = window.location.pathname.replace(/\.html$/, '');
        window.history.replaceState(null, '', clean + window.location.search + window.location.hash);
    }

    loadSettings();
    initNavigation();
    fetchUsers();
    
    if (vdsConfig.url && vdsConfig.token) {
        fetchVDSServers();
    } else {
        document.getElementById('vds-server-list').innerHTML = '<div class="text-error text-small">VDS ayarları eksik.</div>';
    }
})();

// --- AYARLAR ---
function loadSettings() {
    vdsConfig.url = localStorage.getItem('controllin_vds_url') || '';
    vdsConfig.token = localStorage.getItem('controllin_vds_token') || '';
    document.getElementById('setting-api-url').value = vdsConfig.url;
    document.getElementById('setting-api-token').value = vdsConfig.token;
}

function saveSettings() {
    const url = document.getElementById('setting-api-url').value.trim();
    const token = document.getElementById('setting-api-token').value.trim();
    localStorage.setItem('controllin_vds_url', url);
    localStorage.setItem('controllin_vds_token', token);
    vdsConfig = { url, token };
    
    document.getElementById('settings-msg').textContent = 'Ayarlar kaydedildi! Sayfa yenileniyor...';
    setTimeout(() => window.location.reload(), 1000);
}

// --- MENÜ ---
function initNavigation() {
    const views = ['server', 'files', 'users', 'settings'];
    
    views.forEach(v => {
        document.getElementById(`nav-${v}`).addEventListener('click', (e) => {
            e.preventDefault();
            views.forEach(v2 => {
                document.getElementById(`nav-${v2}`).classList.remove('active');
                document.getElementById(`view-${v2}`).style.display = 'none';
            });
            document.getElementById(`nav-${v}`).classList.add('active');
            document.getElementById(`view-${v}`).style.display = 'grid';
            
            if (v === 'files') loadFileManager(currentFileManagerPath);
        });
    });
}

// --- VDS API İSTEKLERİ ---
async function vdsFetch(endpoint, options = {}) {
    if (!vdsConfig.url) throw new Error("VDS URL eksik");
    
    const headers = {
        'Authorization': `Bearer ${vdsConfig.token}`,
        ...options.headers
    };
    
    const res = await fetch(`${vdsConfig.url}${endpoint}`, { ...options, headers });
    if (!res.ok) {
        const errData = await res.json().catch(()=>({}));
        throw new Error(errData.error || res.statusText);
    }
    return res;
}

// --- SUNUCU YÖNETİMİ ---
async function fetchVDSServers() {
    try {
        const res = await vdsFetch('/api/servers');
        const data = await res.json();
        
        const listEl = document.getElementById('vds-server-list');
        listEl.innerHTML = '';
        
        if (data.servers.length === 0) {
            listEl.innerHTML = '<div class="text-small text-muted">Sunucu bulunamadı.</div>';
            return;
        }

        data.servers.forEach(srv => {
            const el = document.createElement('a');
            el.href = '#';
            el.className = 'nav-link text-small';
            el.style.paddingLeft = '10px';
            el.textContent = `> ${srv}`;
            el.onclick = (e) => {
                e.preventDefault();
                selectServer(srv);
            };
            listEl.appendChild(el);
        });
    } catch (e) {
        document.getElementById('vds-server-list').innerHTML = `<div class="text-error text-small">Bağlantı Hatası: ${e.message}</div>`;
    }
}

function selectServer(name) {
    activeServerName = name;
    document.getElementById('server-name').textContent = name;
    document.getElementById('server-id').textContent = `VDS Klasörü: /home/minecraft/${name}`;
    document.getElementById('status-indicator').className = 'status-dot';
    document.getElementById('server-status-text').textContent = 'Seçildi (Durum Bilinmiyor)';
    
    appendConsole(`[SİSTEM] ${name} seçildi. (Not: Tam durum takibi için VDS daemon'a eklenti yapılabilir).`);
}

async function setServerAction(action) {
    if (!activeServerName) {
        alert("Önce soldan bir sunucu seçin.");
        return;
    }
    
    appendConsole(`[SİSTEM] '${action}' komutu VDS'e gönderiliyor...`);
    
    try {
        const res = await vdsFetch(`/api/servers/${activeServerName}/start`, { method: 'POST' });
        const data = await res.json();
        appendConsole(`> BAŞARILI: ${data.message}`);
    } catch (e) {
        appendConsole(`> HATA: ${e.message}`);
    }
}

function appendConsole(text) {
    const out = document.getElementById('console-output');
    out.innerHTML += `<br>${text}`;
    out.scrollTop = out.scrollHeight;
}

// --- DOSYA YÖNETİCİSİ ---
async function loadFileManager(subPath = '') {
    currentFileManagerPath = subPath;
    document.getElementById('file-breadcrumb').textContent = `/home/minecraft/${subPath}`;
    
    const tbody = document.getElementById('file-list');
    tbody.innerHTML = '<tr><td colspan="3" style="padding: 10px; text-align: center;">Yükleniyor...</td></tr>';
    
    try {
        const res = await vdsFetch(`/api/files?path=${encodeURIComponent(subPath)}`);
        const data = await res.json();
        
        tbody.innerHTML = '';
        
        // Üst klasöre çıkma (Eğer root'ta değilsek)
        if (subPath !== '') {
            const upPath = subPath.split('/').slice(0, -1).join('/');
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid var(--border-color); cursor: pointer;" onclick="loadFileManager('${upPath}')">
                    <td style="padding: 10px;">📁 ..</td>
                    <td style="padding: 10px;">-</td>
                    <td style="padding: 10px;">-</td>
                </tr>
            `;
        }
        
        if(data.files.length === 0) {
            tbody.innerHTML += '<tr><td colspan="3" style="padding: 10px; text-align: center;">Klasör boş.</td></tr>';
            return;
        }

        data.files.forEach(f => {
            const icon = f.isDirectory ? '📁' : '📄';
            const actionHTML = f.isDirectory 
                ? `<button class="b-btn text-small" style="padding: 4px 8px;" onclick="loadFileManager('${subPath ? subPath+'/' : ''}${f.name}')">İçine Gir</button>`
                : `<a href="${vdsConfig.url}/api/files/download?path=${encodeURIComponent(subPath ? subPath+'/' : '')}${encodeURIComponent(f.name)}" target="_blank" class="b-btn text-small" style="padding: 4px 8px; text-decoration: none;">İndir</a>`;
                
            const sizeHTML = f.isDirectory ? '-' : (f.size / 1024).toFixed(1) + ' KB';

            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #2a2a2a;">
                    <td style="padding: 10px; display: flex; align-items: center; gap: 8px;">${icon} ${f.name}</td>
                    <td style="padding: 10px; color: var(--text-muted);">${sizeHTML}</td>
                    <td style="padding: 10px;">${actionHTML}</td>
                </tr>
            `;
        });
    } catch(e) {
        tbody.innerHTML = `<tr><td colspan="3" style="padding: 10px; color: var(--error-color);">Hata: ${e.message}</td></tr>`;
    }
}

async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', currentFileManagerPath);

    appendConsole(`[DOSYA] ${file.name} yükleniyor...`);
    
    try {
        const res = await vdsFetch(`/api/files/upload`, {
            method: 'POST',
            body: formData,
            headers: { 'Authorization': `Bearer ${vdsConfig.token}` } // FormData için Content-Type otomatik ayarlanır
        });
        const data = await res.json();
        alert("Dosya başarıyla yüklendi.");
        loadFileManager(currentFileManagerPath);
    } catch(err) {
        alert("Yükleme hatası: " + err.message);
    }
    
    e.target.value = ''; // Reset input
}

// --- KULLANICI YÖNETİMİ ---
async function fetchUsers() {
    const list = document.getElementById('users-list');
    const { data, error } = await _supabase.from('controllin_profiles').select('*').order('created_at', { ascending: false });
    
    if (error || !data) {
        list.innerHTML = '<div class="text-error">Kullanıcılar yüklenemedi.</div>';
        return;
    }

    list.innerHTML = '';
    data.forEach(user => {
        list.innerHTML += `
            <div class="flex-between mb-2">
                <div>
                    <strong>${user.username}</strong>
                    <div class="text-small text-muted">ID: ${user.id.substring(0,8)}... | Rol: ${user.role}</div>
                </div>
            </div>
        `;
    });
}

// Logout
async function doLogout() {
    await _supabase.auth.signOut();
    window.location.replace('/controllin/login.html');
}
