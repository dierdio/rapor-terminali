/* controllin' Login Logic */

// Kritr projesindeki aynı auth keyleri (kullanıcının onayladığı üzere)
const SUPABASE_URL = 'https://bwajmlxxmxamwneyebax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3YWptbHh4bXhhbXduZXllYmF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTA0MTIsImV4cCI6MjA5NDY4NjQxMn0.Buifz0hiJ-3SrXpCX31EiaQ_f8TMgyWOzmsm-9YIMoY';

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Eğer path html ile bitiyorsa temizle (Vercel rewrite uyumu için)
if (window.location.pathname.endsWith('.html')) {
    const clean = window.location.pathname.replace(/\.html$/, '');
    window.history.replaceState(null, '', clean + window.location.search + window.location.hash);
}

// Oturum kontrolü
(async function() {
    const { data } = await _supabase.auth.getSession();
    if (data?.session?.user) {
        // Oturum varsa, controllin_profiles tablosunda kaydı var mı bak
        const { data: profile } = await _supabase.from('controllin_profiles').select('id').eq('id', data.session.user.id).single();
        if (profile) { 
            window.location.replace('/controllin/'); 
            return; 
        }
        // Yoksa çıkar
        await _supabase.auth.signOut();
    }
})();

// Enter ile giriş
document.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

async function doLogin() {
    const usernameInput = document.getElementById('lu').value.trim();
    const p = document.getElementById('lp').value;
    const errEl = document.getElementById('lerr');
    const infoEl = document.getElementById('login-info');
    const btn = document.getElementById('login-btn');
    
    errEl.style.display = 'none';

    if (!usernameInput || !p) { 
        errEl.style.display = 'block'; 
        return; 
    }
    
    btn.disabled = true; 
    infoEl.style.display = 'block';
    infoEl.textContent = 'KİMLİK DOĞRULANIYOR...';

    // Sadece kullanıcı adı istenildiği için arkaplanda domaine tamamlıyoruz.
    // (Böylece Supabase email formatına uygun oluyor)
    let email = usernameInput;
    if (!usernameInput.includes('@')) {
        email = usernameInput + '@controllin.local';
    }

    const { data, error } = await _supabase.auth.signInWithPassword({ email, password: p });
    
    if (error || !data.user) { 
        errEl.style.display = 'block'; 
        infoEl.style.display = 'none'; 
        btn.disabled = false; 
        return; 
    }

    // Kullanıcının controllin profillerinde olup olmadığını kontrol et
    const { data: profile } = await _supabase.from('controllin_profiles').select('id').eq('id', data.user.id).single();
    
    if (!profile) { 
        // Kullanıcı giriş yaptı ama controllin'e yetkisi yok (belki Kritr kullanıcısı)
        // Eğer otomatik eklenmesini istersek buraya insert yazılır, ama güvenlik için engelliyoruz:
        errEl.textContent = "HATA: CONTROLLIN PANELİNE ERİŞİM YETKİNİZ YOK.";
        errEl.style.display = 'block'; 
        infoEl.style.display = 'none'; 
        btn.disabled = false; 
        await _supabase.auth.signOut(); 
        return; 
    }

    infoEl.textContent = 'ERİŞİM ONAYLANDI. YÖNLENDİRİLİYOR...';
    setTimeout(() => {
        window.location.replace('/controllin/');
    }, 800);
}
