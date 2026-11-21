export default async function handler(req, res) {
    const { appid } = req.query;

    // CORS ayarları (Frontend'den doğrudan çağrılabilmesi için)
    res.setHeader('Access-Control-Allow-Credentials', false);
    res.setHeader('Access-Control-Allow-Origin', process.env.PUBLIC_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (!appid || !/^\d+$/.test(String(appid))) {
        return res.status(400).json({ error: 'appid is required' });
    }

    try {
        const response = await fetch(`https://store.steampowered.com/appreviews/${appid}?json=1&language=english&num_per_page=5`, { signal: AbortSignal.timeout(8000) });
        
        if (!response.ok) {
            throw new Error(`Steam API responded with ${response.status}`);
        }

        const data = await response.json();
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        res.status(200).json(data);
    } catch (error) {
        console.error('Steam API Hatası:', error);
        res.status(500).json({ error: 'Yorumlar çekilirken bir hata oluştu.' });
    }
}
