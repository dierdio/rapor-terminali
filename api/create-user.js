// api/create-user.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yöntem izin verilmedi' });
  }

  const { username, password, tam_isim, seviye, yetkili } = req.body;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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