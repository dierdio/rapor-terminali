const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN || 'GUVENLI_TOKEN_BURAYA';
const BASE_DIR = process.env.BASE_DIR || '/home/minecraft';

app.use(cors());
app.use(express.json());

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader.split(' ')[1] !== API_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized. Invalid API Token.' });
    }
    next();
};

app.use(authMiddleware);

// --- SUNUCULARI LİSTELEME ---
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

// --- YENİ SUNUCU OLUŞTURMA ---
app.post('/api/servers', (req, res) => {
    const serverName = req.body.name;
    if (!serverName || !/^[a-zA-Z0-9_-]+$/.test(serverName)) {
        return res.status(400).json({ error: 'Geçersiz sunucu adı (sadece harf, rakam, tire ve altçizgi).' });
    }
    const targetDir = path.join(BASE_DIR, serverName);
    if (fs.existsSync(targetDir)) {
        return res.status(400).json({ error: 'Bu isimde bir sunucu (klasör) zaten var.' });
    }
    try {
        fs.mkdirSync(targetDir, { recursive: true });
        res.json({ success: true, message: 'Sunucu klasörü oluşturuldu.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TAM OTOMATİK SUNUCU KURULUMU ---
const https = require('https');

// Yardımcı: Https üzerinden veri çekme
const fetchJson = (url) => new Promise((resolve, reject) => {
    const options = { headers: { 'User-Agent': 'ControllinPanel/1.0 (admin@dierdio.com)' } };
    https.get(url, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
});

// Yardımcı: Dosya İndirme
const downloadFile = (url, dest) => new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = { headers: { 'User-Agent': 'ControllinPanel/1.0 (admin@dierdio.com)' } };
    https.get(url, options, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303 || response.statusCode === 307 || response.statusCode === 308) {
            return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        }
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
        fs.unlink(dest, () => reject(err));
    });
});

app.post('/api/servers/install', async (req, res) => {
    const { name, type, version, ram } = req.body;
    if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) return res.status(400).json({ error: 'Geçersiz sunucu adı.' });
    if (!version) return res.status(400).json({ error: 'Sürüm gerekli.' });

    const targetDir = path.join(BASE_DIR, name);
    if (fs.existsSync(targetDir)) return res.status(400).json({ error: 'Bu isimde bir klasör zaten var.' });

    try {
        // 1. Klasörü oluştur
        fs.mkdirSync(targetDir, { recursive: true });

        // 2. Jar URL'sini Bul
        let jarUrl = null;
        if (type === 'paper') {
            const vData = await fetchJson(`https://fill.papermc.io/v3/projects/paper/versions/${version}`);
            if (!vData.builds || vData.builds.length === 0) throw new Error("PaperMC sürümü bulunamadı.");
            const latestBuild = vData.builds[0]; // v3'te en güncel build 0. index'tedir
            const bData = await fetchJson(`https://fill.papermc.io/v3/projects/paper/versions/${version}/builds/${latestBuild}`);
            if (!bData.downloads || !bData.downloads['server:default']) throw new Error("PaperMC indirme linki bulunamadı.");
            jarUrl = bData.downloads['server:default'].url;
        } 
        else if (type === 'vanilla') {
            const manifest = await fetchJson('https://launchermeta.mojang.com/mc/game/version_manifest.json');
            const vMeta = manifest.versions.find(v => v.id === version);
            if (!vMeta) throw new Error("Vanilla sürümü bulunamadı.");
            const vDetail = await fetchJson(vMeta.url);
            jarUrl = vDetail.downloads.server.url;
        } 
        else {
            throw new Error("Desteklenmeyen sunucu türü.");
        }

        // 3. Dosyayı indir
        const jarPath = path.join(targetDir, 'server.jar');
        await downloadFile(jarUrl, jarPath);

        // 4. EULA'yı onayla
        fs.writeFileSync(path.join(targetDir, 'eula.txt'), 'eula=true\n');

        // 5. Başlatma scriptini (run.sh) oluştur
        const ramG = ram || '2';
        const runScript = `#!/bin/bash\njava -Xms${ramG}G -Xmx${ramG}G -jar server.jar nogui\n`;
        fs.writeFileSync(path.join(targetDir, 'run.sh'), runScript);
        fs.chmodSync(path.join(targetDir, 'run.sh'), '755'); // Çalıştırma izni

        res.json({ success: true, message: `${type} ${version} başarıyla kuruldu ve başlatılmaya hazır!` });

    } catch (err) {
        // Hata olursa klasörü temizle
        if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
        res.status(500).json({ error: err.message });
    }
});

// --- SUNUCU DURUMU VE LOG ---
app.get('/api/servers/:name/status', (req, res) => {
    const serverName = req.params.name;
    const targetDir = path.join(BASE_DIR, serverName);
    
    // RAM Status
    const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
    const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);
    const ramStatus = `${usedMem} GB / ${totalMem} GB`;

    // Screen Durumu kontrolü
    exec(`screen -list | grep "mc_${serverName}"`, (error, stdout) => {
        const isRunning = stdout && stdout.includes(`mc_${serverName}`);
        
        let consoleOutput = "[SİSTEM] Log bulunamadı veya sunucu henüz log üretmedi.";
        const screenLogPath = path.join(targetDir, 'screenlog.0');
        const mcLogPath = path.join(targetDir, 'logs', 'latest.log');
        
        let targetLog = null;
        if (fs.existsSync(screenLogPath)) targetLog = screenLogPath;
        else if (fs.existsSync(mcLogPath)) targetLog = mcLogPath;

        if (targetLog) {
            exec(`tail -n 100 ${targetLog}`, (errTail, stdoutTail) => {
                if (!errTail && stdoutTail) consoleOutput = stdoutTail;
                res.json({ isRunning: !!isRunning, ramStatus, log: consoleOutput });
            });
        } else {
            res.json({ isRunning: !!isRunning, ramStatus, log: consoleOutput });
        }
    });
});

// --- SUNUCU BAŞLATMA ---
app.post('/api/servers/:name/start', (req, res) => {
    const serverName = req.params.name;
    const targetDir = path.join(BASE_DIR, serverName);

    if (!targetDir.startsWith(BASE_DIR)) return res.status(400).json({ error: 'Invalid path' });
    if (!fs.existsSync(targetDir)) return res.status(404).json({ error: 'Sunucu klasörü bulunamadı.' });

    const runScript = fs.existsSync(path.join(targetDir, 'run.sh')) ? 'run.sh' 
                    : fs.existsSync(path.join(targetDir, 'start.sh')) ? 'start.sh' 
                    : null;

    if (!runScript) return res.status(400).json({ error: 'Başlatma betiği (run.sh veya start.sh) bulunamadı.' });

    // screenlog.0 eskiden kalmışsa temizleyelim ki yeni konsol kafa karıştırmasın
    const screenLogPath = path.join(targetDir, 'screenlog.0');
    if (fs.existsSync(screenLogPath)) fs.unlinkSync(screenLogPath);

    // -L flagi eklenerek screenlog.0 oluşması sağlanıyor
    const cmd = `cd ${targetDir} && screen -L -Logfile screenlog.0 -dmS mc_${serverName} bash ${runScript}`;
    
    exec(cmd, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: error.message, stderr });
        res.json({ success: true, message: 'Sunucu başlatma komutu gönderildi.' });
    });
});

// --- KOMUT GÖNDERME ---
app.post('/api/servers/:name/command', (req, res) => {
    const serverName = req.params.name;
    const command = req.body.command;
    if (!command) return res.status(400).json({ error: 'Komut boş olamaz.' });

    const safeCommand = command.replace(/"/g, '\\"');
    const cmd = `screen -S mc_${serverName} -p 0 -X stuff "${safeCommand}\\r"`;
    
    exec(cmd, (error) => {
        if (error) return res.status(500).json({ error: 'Komut gönderilemedi: Sunucu kapalı olabilir.' });
        res.json({ success: true, message: 'Komut iletildi.' });
    });
});

// --- DOSYA YÖNETİCİSİ ---
const upload = multer({ dest: '/tmp/controllin_uploads' });

app.get('/api/files', (req, res) => {
    let targetPath = req.query.path || '';
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

app.get('/api/files/download', (req, res) => {
    const targetPath = req.query.path;
    if (!targetPath) return res.status(400).json({ error: 'Path required' });
    const fullPath = path.join(BASE_DIR, targetPath);
    if (!fullPath.startsWith(BASE_DIR)) return res.status(400).json({ error: 'Invalid path' });
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File not found' });
    res.download(fullPath);
});

app.post('/api/files/upload', upload.single('file'), (req, res) => {
    const targetPath = req.body.path || '';
    const fullDir = path.join(BASE_DIR, targetPath);
    if (!fullDir.startsWith(BASE_DIR)) return res.status(400).json({ error: 'Invalid path' });
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const finalPath = path.join(fullDir, req.file.originalname);
    fs.rename(req.file.path, finalPath, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Dosya yüklendi.' });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[controllin-daemon] API Sunucusu port ${PORT} üzerinde çalışıyor.`);
});
