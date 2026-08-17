const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN || 'GUVENLI_TOKEN_BURAYA';
const BASE_DIR = process.env.BASE_DIR || '/home/minecraft';

app.use(cors()); // Güvenlik için cors ayarlarını Vercel domaininize sınırlayabilirsiniz
app.use(express.json());

// Yetkilendirme Middleware
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader.split(' ')[1] !== API_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized. Invalid API Token.' });
    }
    next();
};

app.use(authMiddleware);

// --- SUNUCULARI LİSTELEME ---
// /home/minecraft içindeki klasörleri döner (.cache ve .local hariç)
app.get('/api/servers', (req, res) => {
    try {
        if (!fs.existsSync(BASE_DIR)) {
            return res.json({ servers: [] });
        }

        const entries = fs.readdirSync(BASE_DIR, { withFileTypes: true });
        const servers = entries
            .filter(dirent => dirent.isDirectory() && !['.cache', '.local'].includes(dirent.name))
            .map(dirent => dirent.name);
            
        res.json({ servers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SUNUCU BAŞLATMA ---
app.post('/api/servers/:name/start', (req, res) => {
    const serverName = req.params.name;
    const targetDir = path.join(BASE_DIR, serverName);

    // Güvenlik: Path Traversal Koruması
    if (!targetDir.startsWith(BASE_DIR)) return res.status(400).json({ error: 'Invalid path' });

    if (!fs.existsSync(targetDir)) {
        return res.status(404).json({ error: 'Sunucu klasörü bulunamadı.' });
    }

    // run.sh veya start.sh arayalım
    const runScript = fs.existsSync(path.join(targetDir, 'run.sh')) ? 'run.sh' 
                    : fs.existsSync(path.join(targetDir, 'start.sh')) ? 'start.sh' 
                    : null;

    if (!runScript) {
        return res.status(400).json({ error: 'Başlatma betiği (run.sh veya start.sh) bulunamadı.' });
    }

    // Script'i screen veya tmux ile başlatmak en iyisidir (örn: screen -dmS sunucu_adi bash run.sh)
    const cmd = `cd ${targetDir} && screen -dmS mc_${serverName} bash ${runScript}`;
    
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: error.message, stderr });
        }
        res.json({ success: true, message: 'Sunucu başlatma komutu gönderildi.' });
    });
});

// --- DOSYA YÖNETİCİSİ ---
const upload = multer({ dest: '/tmp/controllin_uploads' });

// 1. Klasör İçeriğini Listele
app.get('/api/files', (req, res) => {
    let targetPath = req.query.path || '';
    // Güvenlik
    const fullPath = path.join(BASE_DIR, targetPath);
    if (!fullPath.startsWith(BASE_DIR)) return res.status(400).json({ error: 'Invalid path' });

    try {
        if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Not found' });
        
        const stat = fs.statSync(fullPath);
        if (!stat.isDirectory()) {
            return res.status(400).json({ error: 'Not a directory' });
        }

        const entries = fs.readdirSync(fullPath, { withFileTypes: true });
        const files = entries.map(dirent => {
            const itemPath = path.join(fullPath, dirent.name);
            const itemStat = fs.statSync(itemPath);
            return {
                name: dirent.name,
                isDirectory: dirent.isDirectory(),
                size: itemStat.size,
                mtime: itemStat.mtime
            };
        });

        // Klasörleri başa, dosyaları sona sırala
        files.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });

        res.json({ files, currentPath: targetPath });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Dosya İndir (Export)
app.get('/api/files/download', (req, res) => {
    const targetPath = req.query.path;
    if (!targetPath) return res.status(400).json({ error: 'Path required' });

    const fullPath = path.join(BASE_DIR, targetPath);
    if (!fullPath.startsWith(BASE_DIR)) return res.status(400).json({ error: 'Invalid path' });

    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File not found' });
    
    res.download(fullPath);
});

// 3. Dosya Yükle (Import)
app.post('/api/files/upload', upload.single('file'), (req, res) => {
    const targetPath = req.body.path || '';
    const fullDir = path.join(BASE_DIR, targetPath);
    
    if (!fullDir.startsWith(BASE_DIR)) return res.status(400).json({ error: 'Invalid path' });

    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const finalPath = path.join(fullDir, req.file.originalname);
    
    // Geçici tmp dosyasını hedef klasöre taşı
    fs.rename(req.file.path, finalPath, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Dosya yüklendi.' });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[controllin-daemon] API Sunucusu port ${PORT} üzerinde çalışıyor.`);
    console.log(`Hedef Dizin: ${BASE_DIR}`);
});
