// api/manage-user.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yöntem izin verilmedi' });
  }

  const { action, targetUserId, newPassword, newName, newRole, newRutbe, targetUsername } = req.body;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey };

  // --- GÜVENLİK: İsteği yapan oturum doğrulanmalı ve 'yetkili' rolünde olmalı ---
  const yetkiHata = await yetkiliKontrol(req, supabaseUrl, serviceKey);
  if (yetkiHata) return res.status(yetkiHata.status).json({ error: yetkiHata.message });

  try {
    if (action === 'delete') {
      // 1. Auth'tan sil
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUserId}`, { method: 'DELETE', headers });
      // 2. Profiles'dan sil
      await fetch(`${supabaseUrl}/rest/v1/profiles?username=eq.${targetUsername}`, { method: 'DELETE', headers });
      return res.status(200).json({ success: true });
    } 
    
    if (action === 'update') {
      // Şifre değişecekse Auth güncelle
      if (newPassword && newPassword.trim() !== '') {
        await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUserId}`, {
          method: 'PUT', headers, body: JSON.stringify({ password: newPassword })
        });
      }
      // Profiles tablosunu güncelle (İsim, Yetki, Rütbe)
      await fetch(`${supabaseUrl}/rest/v1/profiles?username=eq.${targetUsername}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ display_name: newName, role: newRole, rutbe: newRutbe })
      });
      return res.status(200).json({ success: true });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
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
      headers: { 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey }
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
