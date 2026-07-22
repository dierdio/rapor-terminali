const SUPABASE_URL = 'https://bwajmlxxmxamwneyebax.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3YWptbHh4bXhhbXduZXllYmF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTA0MTIsImV4cCI6MjA5NDY4NjQxMn0.Buifz0hiJ-3SrXpCX31EiaQ_f8TMgyWOzmsm-9YIMoY';
    const BUILD_VERSION = 'v5.5';
    const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    document.getElementById('build-ver-badge').innerHTML = 'BUILD <span>' + BUILD_VERSION + '</span>';

    if (window.location.pathname.endsWith('.html')) {
      const clean = window.location.pathname.replace(/\.html$/, '');
      window.history.replaceState(null, '', clean + window.location.search + window.location.hash);
    }

    (async function() {
      const { data } = await _supabase.auth.getSession();
      if (data?.session?.user) {
        const { data: profile } = await _supabase.from('profiles').select('id').eq('id', data.session.user.id).single();
        if (profile) { window.location.replace('/terminal/'); return; }
        await _supabase.auth.signOut();
      }
    })();

    document.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

    async function doLogin() {
      const usernameInput = document.getElementById('lu').value.trim();
      const p = document.getElementById('lp').value;
      const errEl = document.getElementById('lerr');
      const infoEl = document.getElementById('login-info');
      const btn = document.getElementById('login-btn');
      errEl.style.display = 'none';

      if (!usernameInput || !p) { errEl.style.display = 'block'; return; }
      btn.disabled = true; infoEl.style.display = 'block';

      let email = usernameInput;
      if (!usernameInput.includes('@')) {
        const { data: profileRow } = await _supabase.from('profiles').select('id, username').eq('username', usernameInput).single();
        if (!profileRow) { errEl.style.display = 'block'; infoEl.style.display = 'none'; btn.disabled = false; return; }
        email = usernameInput + '@site62.local';
      }

      const { data, error } = await _supabase.auth.signInWithPassword({ email, password: p });
      if (error || !data.user) { errEl.style.display = 'block'; infoEl.style.display = 'none'; btn.disabled = false; return; }

      const { data: profile } = await _supabase.from('profiles').select('id').eq('id', data.user.id).single();
      if (!profile) { errEl.style.display = 'block'; infoEl.style.display = 'none'; btn.disabled = false; await _supabase.auth.signOut(); return; }

      // Use typing effect
      if (window.typeText) {
          window.typeText(infoEl, 'ERİŞİM ONAYLANDI. YÖNLENDİRİLİYOR...', 30, () => {
              setTimeout(() => {
                  window.location.replace('/terminal/');
              }, 500);
          });
      } else {
          infoEl.textContent = 'ERİŞİM ONAYLANDI. YÖNLENDİRİLİYOR...';
          window.location.replace('/terminal/');
      }
    }