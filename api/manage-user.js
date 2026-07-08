// api/manage-user.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yöntem izin verilmedi' });
  }

  const { action, targetUserId, newPassword, newName, newRole, newRutbe, targetUsername } = req.body;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey };

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