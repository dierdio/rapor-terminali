export default async function handler(req, res) {
    const { type } = req.query;
    
    // Set CORS headers just in case
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    try {
        if (type === 'paper') {
            const response = await fetch('https://api.papermc.io/v2/projects/paper', {
                headers: { 'User-Agent': 'ControllinPanel/1.0 (admin@dierdio.com)' }
            });
            const data = await response.json();
            res.status(200).json(data);
        } else if (type === 'vanilla') {
            const response = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
            const data = await response.json();
            res.status(200).json(data);
        } else {
            res.status(400).json({ error: 'Geçersiz tür (paper veya vanilla olmalı)' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
