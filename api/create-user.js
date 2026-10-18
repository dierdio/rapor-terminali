// api/create-user.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yöntem izin verilmedi' });
  }

  const { username, password, tam_isim, seviye, yetkili } = req.body;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // --- GÜVENLİK: İsteği yapan oturum doğrulanmalı ve 'yetkili' rolünde olmalı ---
  const yetkiHata = await yetkiliKontrol(req, supabaseUrl, serviceRoleKey);
  if (yetkiHata) return res.status(yetkiHata.status).json({ error: yetkiHata.message });

  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        email: `${username}@site62.local`,
        password: password,
        email_confirm: true
      })
    });

    const authData = await authResponse.json();
    if (!authResponse.ok) {
      return res.status(400).json({ error: authData.msg || authData.message || 'Auth hesabı oluşturulamadı.' });
    }

    const newUserId = authData.id;
    const role = yetkili ? 'yetkili' : 'yetkisiz';

    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        id: newUserId,
        username: username,
        display_name: tam_isim, 
        role: role,
        rutbe: seviye
      })
    });

    if (!profileResponse.ok) {
      const profData = await profileResponse.json();
      return res.status(400).json({ error: profData.message || 'Profil tablosuna yazılamadı.' });
    }

    return res.status(200).json({ success: true, message: 'Kullanıcı başarıyla oluşturuldu.' });

  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
}

// İsteği gönderen kullanıcının JWT'sini doğrular ve 'yetkili' rolünü kontrol eder.
// Hata varsa { status, message } döner, her şey yolundaysa null döner.
async function yetkiliKontrol(req, supabaseUrl, serviceRoleKey) {
  if (!supabaseUrl || !serviceRoleKey) {
    return { status: 500, message: 'Sunucu yapılandırması eksik (SUPABASE env değişkenleri).' };
  }
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return { status: 401, message: 'Oturum bulunamadı. Lütfen giriş yapın.' };

  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': serviceRoleKey }
    });
    if (!userRes.ok) return { status: 401, message: 'Oturum doğrulanamadı.' };
    const user = await userRes.json();
    if (!user || !user.id) return { status: 401, message: 'Oturum doğrulanamadı.' };

    const profRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
      headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
    });
    if (!profRes.ok) return { status: 403, message: 'Yetki kontrolü başarısız oldu.' };
    const rows = await profRes.json();
    if (!Array.isArray(rows) || !rows[0] || rows[0].role !== 'yetkili') {
      return { status: 403, message: 'Bu işlem için yetkiniz yok.' };
    }
    return null;
  } catch (e) {
    return { status: 500, message: 'Yetki kontrolü sırasında hata oluştu.' };
  }
}
