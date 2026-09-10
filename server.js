const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3005;
const PUBLIC_DIR = path.join(__dirname, 'public');
const CODES_FILE = path.join(__dirname, 'data', 'gift_codes.json');

// MIME tipləri
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function readCodes() {
    try {
        if (!fs.existsSync(CODES_FILE)) {
            fs.writeFileSync(CODES_FILE, JSON.stringify([]));
        }
        const data = fs.readFileSync(CODES_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Kodlar oxunarkən xəta:', err);
        return [];
    }
}

function saveCodes(codes) {
    try {
        fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error('Kodlar saxlanılarkən xəta:', err);
        return false;
    }
}

function generateRandomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const seg1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const seg2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const seg3 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `GIFT-${seg1}-${seg2}-${seg3}`;
}

const server = http.createServer((req, res) => {
    // CORS başlıqları
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // API: Kodların siyahısı
    if (pathname === '/api/giftcode/list' && req.method === 'GET') {
        const codes = readCodes();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, codes }));
        return;
    }

    // API: Yeni Hədiyyə Kodu Yaratmaq
    if (pathname === '/api/giftcode/generate' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const blueDiamonds = Math.max(0, parseInt(data.blueDiamonds) || 0);
                const redDiamonds = Math.max(0, parseInt(data.redDiamonds) || 0);

                if (blueDiamonds === 0 && redDiamonds === 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Almaz sayı 0-dan böyük olmalıdır!' }));
                    return;
                }

                let newCode = data.customCode ? data.customCode.trim().toUpperCase() : generateRandomCode();
                const codes = readCodes();

                if (codes.some(c => c.code === newCode)) {
                    newCode = generateRandomCode();
                }

                const newEntry = {
                    code: newCode,
                    blueDiamonds,
                    redDiamonds,
                    used: false,
                    createdAt: new Date().toISOString()
                };

                codes.push(newEntry);
                saveCodes(codes);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, code: newEntry }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Yanlış məlumat formatı!' }));
            }
        });
        return;
    }

    // API: Kodu İstifadə Etmək (Redeem)
    if (pathname === '/api/giftcode/redeem' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const targetCode = (data.code || '').trim().toUpperCase();

                if (!targetCode) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Kod daxil edilməyib!' }));
                    return;
                }

                const codes = readCodes();
                const item = codes.find(c => c.code === targetCode);

                if (!item) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Bu kod mövcud deyil!' }));
                    return;
                }

                if (item.used) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Bu kod artıq istifadə edilib!' }));
                    return;
                }

                item.used = true;
                item.usedAt = new Date().toISOString();
                saveCodes(codes);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Kod uğurla aktivləşdirildi!',
                    blueDiamonds: item.blueDiamonds || 0,
                    redDiamonds: item.redDiamonds || 0
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Xəta baş verdi!' }));
            }
        });
        return;
    }

    // STATİK FAYLLARIN TƏQDİM EDİLMƏSİ
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

    // Təhlükəsizlik: PUBLIC_DIR-dən kənara çıxışın qarşısını almaq
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Qadağandır');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Fayl Tapılmadı');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Floor Escape Server işə düşdü: http://localhost:${PORT}`);
});
