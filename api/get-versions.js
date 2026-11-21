export default async function handler(req, res) {
    const { type } = req.query;
    
    // Set CORS headers just in case
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    try {
        if (type === 'paper') {
            const response = await fetch('https://fill.papermc.io/v3/projects/paper', {
                signal: AbortSignal.timeout(8000),
                headers: { 'User-Agent': 'ControllinPanel/1.0 (admin@dierdio.com)' }
            });
            if (!response.ok) return res.status(502).json({ error: 'PaperMC sürümleri alınamadı.' });
            const data = await response.json();
            // v3 API returns an object where keys are major versions and values are arrays of versions (descending).
            // We flatten it and reverse it so that app.js's .reverse() makes it descending again.
            if (!data || !data.versions || typeof data.versions !== 'object') return res.status(502).json({ error: 'PaperMC yanıtı geçersiz.' });
            let allVersions = Object.values(data.versions).flat().filter(v => typeof v === 'string').reverse();
            res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
            res.status(200).json({ versions: allVersions });
        } else if (type === 'vanilla') {
            const response = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json', { signal: AbortSignal.timeout(8000) });
            if (!response.ok) return res.status(502).json({ error: 'Minecraft sürümleri alınamadı.' });
            const data = await response.json();
            res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
            res.status(200).json(data);
        } else {
            res.status(400).json({ error: 'Geçersiz tür (paper veya vanilla olmalı)' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
