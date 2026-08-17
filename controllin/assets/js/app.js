/* controllin' App Logic */

const SUPABASE_URL = 'https://poxifowrycsxkhduzshx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBveGlmb3dyeWNzeGtoZHV6c2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTI1ODAsImV4cCI6MjEwMTk2ODU4MH0.X0HK_oqako8yY7-Sf9wWGRSgUp7VaYtSFdao7g0OaGE';

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let activeServerId = null;

// Auth Kontrolü
(async function init() {
    const { data } = await _supabase.auth.getSession();
    if (!data?.session?.user) {
        window.location.replace('/controllin/login.html');
        return;
    }

    // Profili Getir
    const { data: profile } = await _supabase.from('controllin_profiles').select('*').eq('id', data.session.user.id).single();
    if (!profile) {
        await _supabase.auth.signOut();
        window.location.replace('/controllin/login.html');
        return;
    }

    currentUser = profile;
    document.getElementById('current-user').textContent = currentUser.username;

    // Yönlendirme Vercel düzeltmesi
    if (window.location.pathname.endsWith('.html')) {
        const clean = window.location.pathname.replace(/\.html$/, '');
        window.history.replaceState(null, '', clean + window.location.search + window.location.hash);
    }

    initNavigation();
    fetchServerData();
    fetchUsers();

    // Gerçek zamanlı güncellemeler (VDS backend veriyi değiştirirse hemen görsün)
    const channel = _supabase.channel('public:controllin_servers')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'controllin_servers' }, payload => {
            if(payload.new.id === activeServerId) {
                updateServerUI(payload.new);
            }
        })
        .subscribe();
})();

// Menü Geçişleri
function initNavigation() {
    const navServer = document.getElementById('nav-server');
    const navUsers = document.getElementById('nav-users');
    const viewServer = document.getElementById('view-server');
    const viewUsers = document.getElementById('view-users');

    navServer.addEventListener('click', (e) => {
        e.preventDefault();
        navServer.classList.add('active');
        navUsers.classList.remove('active');
        viewServer.style.display = 'grid';
        viewUsers.style.display = 'none';
    });

    navUsers.addEventListener('click', (e) => {
        e.preventDefault();
        navUsers.classList.add('active');
        navServer.classList.remove('active');
        viewUsers.style.display = 'grid';
        viewServer.style.display = 'none';
    });
}

// Sunucu Verilerini Çekme
async function fetchServerData() {
    const { data, error } = await _supabase.from('controllin_servers').select('*').limit(1).single();
    
    if (error || !data) {
        document.getElementById('server-name').textContent = "Sunucu Bulunamadı";
        return;
    }

    activeServerId = data.id;
    updateServerUI(data);
}

// UI Güncelleme (Sunucu)
function updateServerUI(server) {
    document.getElementById('server-id').textContent = `ID: ${server.id}`;
    document.getElementById('server-name').textContent = server.name;
    document.getElementById('server-players').textContent = `${server.players} / ${server.max_players}`;
    
    const statusText = document.getElementById('server-status-text');
    const statusDot = document.getElementById('status-indicator');
    
    statusDot.className = 'status-dot'; // Reset
    
    switch(server.status) {
        case 'online':
            statusText.textContent = 'AKTİF & ÇEVRİMİÇİ';
            statusDot.classList.add('online');
            break;
        case 'offline':
            statusText.textContent = 'KAPALI';
            statusDot.classList.add('offline');
            break;
        case 'starting':
            statusText.textContent = 'BAŞLATILIYOR...';
            statusDot.classList.add('starting');
            break;
        case 'stopping':
            statusText.textContent = 'DURDURULUYOR...';
            statusDot.classList.add('starting');
            break;
        default:
            statusText.textContent = server.status.toUpperCase();
            break;
    }

    // Eğer console'da son log varsa güncelle
    if (server.last_log) {
        const out = document.getElementById('console-output');
        out.innerHTML += `<br>> ${server.last_log}`;
        out.scrollTop = out.scrollHeight;
    }
}

// Aksiyonlar (DB'ye iş emri bırakır, VDS dinler)
async function setServerAction(action) {
    if(!activeServerId) return;
    
    // UI Feedback
    let mockStatus = '';
    if(action === 'start') mockStatus = 'starting';
    if(action === 'stop') mockStatus = 'stopping';
    if(action === 'restart') mockStatus = 'starting';
    
    updateServerUI({ ...{id: activeServerId, name: document.getElementById('server-name').textContent, players: 0, max_players: 20}, status: mockStatus });

    // DB'ye isteği yazıyoruz (target_action kolonu VDS scripti tarafından okunacak)
    await _supabase.from('controllin_servers').update({ 
        target_action: action,
        status: mockStatus, // (Gerçekte status VDS'ten güncellenmeli ama UX için sahte durum basıyoruz)
        updated_at: new Date().toISOString()
    }).eq('id', activeServerId);
    
    appendConsole(`[SİSTEM] '${action.toUpperCase()}' komutu VDS'e iletildi...`);
}

// Konsol
function sendConsoleCommand() {
    const input = document.getElementById('console-input');
    const cmd = input.value.trim();
    if(!cmd) return;
    
    appendConsole(`$ ${cmd}`);
    input.value = '';
    
    // Gerçek bir sistemde bu komut DB'de bir 'commands_queue' tablosuna yazılır.
    // Şimdilik sadece ui gösterimi.
}

function appendConsole(text) {
    const out = document.getElementById('console-output');
    out.innerHTML += `<br>${text}`;
    out.scrollTop = out.scrollHeight;
}

// Mod Yükleme
function installMod() {
    const mod = document.getElementById('mod-input').value.trim();
    if(!mod) return;
    
    appendConsole(`[MOD YÖNETİCİSİ] '${mod}' modunu yükleme isteği kuyruğa alındı.`);
    document.getElementById('mod-input').value = '';
    
    // İş emri olarak action = 'install_mod:xxx' kaydedilebilir.
    if(activeServerId) {
        _supabase.from('controllin_servers').update({ 
            target_action: `install_mod:${mod}`
        }).eq('id', activeServerId).then();
    }
}

// Kullanıcıları Çek
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

// Yeni Kullanıcı Oluşturma (Projede varolan api/create-user.js yapısını kullanmaya çalışacağız)
async function createNewUser() {
    const name = document.getElementById('new-user-name').value.trim();
    const pass = document.getElementById('new-user-pass').value;
    
    if(!name || !pass) {
        alert("Kullanıcı adı ve şifre zorunludur.");
        return;
    }

    // Terminal projesindeki api mantığı: email üzerinden auth oluşturur, sonra profile ekler.
    let email = name;
    if(!email.includes('@')) email = email + '@controllin.local';

    try {
        const res = await fetch('/api/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: pass, username: name, role: 'admin' }) // Terminal API role, username falan bekler
        });
        
        if(res.ok) {
            alert("Kullanıcı (Auth) başarıyla oluşturuldu!\nNot: DB tarafındaki trigger'lar veya manuel eklemeler gerekebilir. (Şu an api/create-user terminal için kodlanmış olabilir)");
            // Terminal api'si terminal_profiles'a ekliyor olabilir, bu yüzden biz de controllin_profiles'a elle auth idsini alıp eklemeliyiz.
            // Fakat Vercel serverless fonksiyonunu direkt çağırdığımız için, id döndürmezse manuel SQL'den eklemek gerekebilir.
        } else {
            alert("API Hatası. Vercel logs'u kontrol edin.");
        }
    } catch (e) {
        alert("Bağlantı hatası: " + e.message);
    }
}

// Çıkış
async function doLogout() {
    await _supabase.auth.signOut();
    window.location.replace('/controllin/login.html');
}
