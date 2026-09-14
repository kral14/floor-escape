const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT || '4000', 10);
const WS_PORT = parseInt(process.env.WS_PORT || '4001', 10);
const BASE_DIR = __dirname;
const PUBLIC_DIR = path.join(BASE_DIR, 'public');
const DATA_DIR = path.join(BASE_DIR, 'data');

// data qovluğunu təmin edirik
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const CHAT_FILE = path.join(DATA_DIR, 'chat_messages.json');
const INBOX_FILE = path.join(DATA_DIR, 'inbox_messages.json');
const CODES_FILE = path.join(DATA_DIR, 'gift_codes.json');

function readJson(file, defaultVal) {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify(defaultVal, null, 2), 'utf-8');
            return defaultVal;
        }
        const data = fs.readFileSync(file, 'utf-8');
        return JSON.parse(data || 'null') || defaultVal;
    } catch (e) {
        console.error(`Xəta [readJson: ${file}]:`, e.message);
        return defaultVal;
    }
}

function writeJson(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (e) {
        console.error(`Xəta [writeJson: ${file}]:`, e.message);
        return false;
    }
}

function hashPin(pin) {
    return crypto.createHash('sha256').update(String(pin).trim()).digest('hex');
}

function generatePlayerId() {
    return 'G-' + Math.floor(100000 + Math.random() * 900000);
}

function generateRandomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const seg1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const seg2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const seg3 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `GIFT-${seg1}-${seg2}-${seg3}`;
}

// İlkin inbox mesajı (əgər boşdursa)
const initialInbox = readJson(INBOX_FILE, [
    {
        id: 1,
        target_type: 'ALL',
        player_id: 'ALL',
        title: 'Floor Escape Serverinə Xoş Gəldiniz!',
        note: 'Yeni server açılışı münasibətilə bütün qaçışçılara 50 Göy və 20 Qırmızı Almaz hədiyyə!',
        gift_code: 'GIFT-WELCOME-2026',
        blue_diamonds: 50,
        red_diamonds: 20,
        created_at: new Date().toISOString(),
        claimed_by: []
    }
]);

// MIME tipləri
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
};

// WebSocket Müştəriləri
const wsClients = new Set();
const wsPlayerMap = new Map();

function broadcastInbox(targetType, playerId, msgData) {
    const payload = JSON.stringify({
        type: 'NEW_INBOX_MESSAGE',
        targetType,
        playerId,
        message: msgData
    });
    for (const ws of wsClients) {
        try {
            const p = wsPlayerMap.get(ws);
            if (targetType === 'ALL' || (p && String(p) === String(playerId))) {
                ws.send(payload);
            }
        } catch (e) {
            wsClients.delete(ws);
        }
    }
}

// Server
const server = http.createServer((req, res) => {
    // CORS Başlıqları
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    const sendJson = (data, status = 200) => {
        res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(data));
        console.log(`[${req.method}] ${pathname} -> ${status}`);
    };

    // ==========================================
    // API MARŞRUTLARI (GET)
    // ==========================================
    if (req.method === 'GET') {
        if (pathname === '/api/realtime-config') return sendJson({ port: null });
        // 0. Oyunçuların Siyahısı (Admin Generator üçün)
        if (pathname === '/api/players/list') {
            const players = readJson(PLAYERS_FILE, []);
            const rows = players.map(p => ({
                player_id: p.playerId,
                username: p.username,
                diamonds: p.diamonds || 0,
                red_diamonds: p.redDiamonds || 0,
                gold: p.gold || 0,
                best_floor: p.bestFloor || 1,
                last_login: p.lastLogin || p.createdAt,
                created_at: p.createdAt
            })).sort((a, b) => (new Date(b.last_login || 0) - new Date(a.last_login || 0)));
            return sendJson({ success: true, players: rows });
        }

        // 1. Liderlər Cədvəli
        if (pathname === '/api/leaderboard') {
            const players = readJson(PLAYERS_FILE, []);
            const rows = players
                .map(p => ({
                    player_id: p.playerId,
                    username: p.username,
                    best_floor: p.bestFloor || 1,
                    diamonds: p.diamonds || 0,
                    red_diamonds: p.redDiamonds || 0,
                    gold: p.gold || 0,
                    total_score: p.totalScore || 0,
                    last_login: p.lastLogin || p.createdAt
                }))
                .sort((a, b) => (b.best_floor - a.best_floor) || (b.diamonds - a.diamonds) || (b.red_diamonds - a.red_diamonds) || (b.total_score - a.total_score))
                .slice(0, 50);

            return sendJson({ success: true, leaderboard: rows });
        }

        // 2. Qlobal Çat Mesajları
        if (pathname === '/api/chat/messages') {
            const messages = readJson(CHAT_FILE, []);
            const rows = messages.slice(-50);
            return sendJson({ success: true, messages: rows });
        }

        // 3. Oyunçunun İnbox / Məktub Qutusu
        if (pathname === '/api/inbox') {
            const playerId = (parsedUrl.searchParams.get('playerId') || parsedUrl.searchParams.get('player_id') || '').trim();
            if (!playerId) {
                return sendJson({ success: false, message: 'Player ID tələb olunur!' }, 400);
            }
            const allInbox = readJson(INBOX_FILE, []);
            const rows = allInbox
                .filter(m => (m.target_type === 'ALL' || m.player_id === playerId) && !(Array.isArray(m.deleted_by) && m.deleted_by.includes(playerId)))
                .map(m => {
                    const claimedList = Array.isArray(m.claimed_by) ? m.claimed_by : (m.claimed_by ? [m.claimed_by] : []);
                    const isClaimed = claimedList.includes(playerId) || m.is_claimed === 1;
                    return {
                        id: m.id,
                        target_type: m.target_type,
                        player_id: m.player_id,
                        title: m.title,
                        note: m.note,
                        gift_code: m.gift_code,
                        blue_diamonds: m.blue_diamonds || 0,
                        red_diamonds: m.red_diamonds || 0,
                        created_at: m.created_at,
                        is_claimed: isClaimed ? 1 : 0
                    };
                })
                .sort((a, b) => b.id - a.id)
                .slice(0, 50);

            return sendJson({ success: true, messages: rows });
        }

        // 4. Oyunçu Profili
        if (pathname === '/api/player/profile') {
            const playerId = (parsedUrl.searchParams.get('playerId') || '').trim();
            const players = readJson(PLAYERS_FILE, []);
            const p = players.find(x => x.playerId === playerId);
            if (p) {
                return sendJson({
                    success: true,
                    player: {
                        playerId: p.playerId,
                        username: p.username,
                        diamonds: p.diamonds || 0,
                        redDiamonds: p.redDiamonds || 0,
                        gold: p.gold || 0,
                        bestFloor: p.bestFloor || 1,
                        permUpgrades: p.permUpgrades || {},
                        claimedChests: p.claimedChests || []
                    }
                });
            }
            return sendJson({ success: false, message: 'Oyunçu tapılmadı!' }, 200);
        }

        // 5. Hədiyyə kodları siyahısı
        if (pathname === '/api/giftcode/list') {
            const codes = readJson(CODES_FILE, []);
            return sendJson({ success: true, codes });
        }
    }

    // ==========================================
    // API MARŞRUTLARI (POST)
    // ==========================================
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            let data = {};
            try { data = JSON.parse(body || '{}'); } catch (e) { data = {}; }

            // 1. Oyunçu Qeydiyyatı
            if (pathname === '/api/auth/register') {
                const username = (data.username || '').trim();
                const pin = String(data.pin || '').trim();

                if (username.length < 2 || username.length > 20) {
                    return sendJson({ success: false, message: 'Oyunçu adı 2-20 simvol olmalıdır!' }, 400);
                }
                if (pin.length < 3 || pin.length > 12) {
                    return sendJson({ success: false, message: 'PIN 3-12 simvol olmalıdır!' }, 400);
                }

                const players = readJson(PLAYERS_FILE, []);
                if (players.some(p => p.username.toLowerCase() === username.toLowerCase())) {
                    return sendJson({ success: false, message: 'Bu ad artıq istifadə olunur! Başqa ad seçin.' }, 400);
                }

                const playerId = generatePlayerId();
                const newPlayer = {
                    playerId,
                    username,
                    pinHash: hashPin(pin),
                    gold: Math.max(75, parseFloat(data.gold) || 75),
                    diamonds: Math.max(0, parseInt(data.diamonds) || 0),
                    redDiamonds: Math.max(0, parseInt(data.redDiamonds) || 0),
                    bestFloor: Math.max(1, parseInt(data.bestFloor) || 1),
                    totalScore: Math.max(0, parseInt(data.totalScore) || 0),
                    permUpgrades: data.permUpgrades || {},
                    claimedChests: data.claimedChests || [],
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };

                players.push(newPlayer);
                writeJson(PLAYERS_FILE, players);

                return sendJson({
                    success: true,
                    message: 'Qeydiyyat uğurla tamamlandı!',
                    player: {
                        playerId: newPlayer.playerId,
                        username: newPlayer.username,
                        gold: newPlayer.gold,
                        diamonds: newPlayer.diamonds,
                        redDiamonds: newPlayer.redDiamonds,
                        bestFloor: newPlayer.bestFloor,
                        permUpgrades: newPlayer.permUpgrades,
                        claimedChests: newPlayer.claimedChests
                    }
                });
            }

            // 2. Oyunçu Girişi
            if (pathname === '/api/auth/login') {
                const loginKey = (data.login || data.username || '').trim();
                const pin = String(data.pin || data.password || '').trim();

                if (!loginKey || !pin) {
                    return sendJson({ success: false, message: 'İstifadəçi adı və PIN daxil edilməlidir!' }, 400);
                }

                const players = readJson(PLAYERS_FILE, []);
                const player = players.find(p => p.username.toLowerCase() === loginKey.toLowerCase() || p.playerId === loginKey);

                if (!player) {
                    return sendJson({ success: false, message: 'Bu adda və ya ID-də oyunçu tapılmadı! Əgər ilk dəfə daxil olursunuzsa, zəhmət olmasa Qeydiyyatdan keçin.' }, 400);
                }
                if (player.pinHash !== hashPin(pin)) {
                    return sendJson({ success: false, message: 'PIN şifrə yanlışdır!' }, 400);
                }

                player.lastLogin = new Date().toISOString();
                writeJson(PLAYERS_FILE, players);

                return sendJson({
                    success: true,
                    message: `Xoş gəldin, ${player.username}!`,
                    player: {
                        playerId: player.playerId,
                        username: player.username,
                        gold: player.gold,
                        diamonds: player.diamonds,
                        redDiamonds: player.redDiamonds,
                        bestFloor: player.bestFloor,
                        totalScore: player.totalScore || 0,
                        permUpgrades: player.permUpgrades || {},
                        claimedChests: player.claimedChests || []
                    }
                });
            }

            // 3. Tərəqqinin Sinxronizasiyası (Sync)
            if (pathname === '/api/player/sync') {
                const playerId = (data.playerId || data.player_id || '').trim();
                if (!playerId) return sendJson({ success: false, message: 'ID tələb olunur' }, 200);

                const players = readJson(PLAYERS_FILE, []);
                const player = players.find(p => p.playerId === playerId);
                if (!player) return sendJson({ success: false, message: 'Oyunçu tapılmadı' }, 200);

                player.gold = parseFloat(data.gold) || player.gold;
                player.diamonds = Math.max(0, parseInt(data.diamonds) || player.diamonds);
                player.redDiamonds = Math.max(0, parseInt(data.redDiamonds) || player.redDiamonds);
                player.bestFloor = Math.max(player.bestFloor || 1, parseInt(data.bestFloor) || 1);
                player.totalScore = Math.max(player.totalScore || 0, parseInt(data.totalScore) || 0);
                if (data.permUpgrades) player.permUpgrades = data.permUpgrades;
                if (data.claimedChests) player.claimedChests = data.claimedChests;
                player.lastLogin = new Date().toISOString();

                writeJson(PLAYERS_FILE, players);
                return sendJson({
                    success: true,
                    message: 'Məlumatlar saxlanıldı!',
                    diamonds: player.diamonds,
                    redDiamonds: player.redDiamonds,
                    bestFloor: player.bestFloor
                });
            }

            // 4. Çata Mesaj Göndərmək
            if (pathname === '/api/chat/send') {
                const playerId = (data.playerId || 'Qonaq').trim();
                const username = (data.username || 'Oyunçu').trim();
                const msg = (data.message || '').trim();

                if (!msg) return sendJson({ success: false, message: 'Mesaj boş ola bilməz!' }, 400);

                const messages = readJson(CHAT_FILE, []);
                const nextId = messages.length > 0 ? (messages[messages.length - 1].id + 1) : 1;
                const newMsg = {
                    id: nextId,
                    player_id: playerId,
                    username: username,
                    message: msg.slice(0, 200),
                    created_at: new Date().toISOString()
                };
                messages.push(newMsg);
                if (messages.length > 200) messages.shift();
                writeJson(CHAT_FILE, messages);

                return sendJson({ success: true, message: 'Mesaj göndərildi!' });
            }

            // 5. İnbox Mükafatını Götürmək (Claim)
            if (pathname === '/api/inbox/claim') {
                const msgId = parseInt(data.messageId || data.message_id, 10);
                const playerId = (data.playerId || data.player_id || '').trim();

                if (!msgId || !playerId) {
                    return sendJson({ success: false, message: 'Mesaj ID və Oyunçu ID tələb olunur!' }, 400);
                }

                const allInbox = readJson(INBOX_FILE, []);
                const msg = allInbox.find(m => m.id === msgId);
                if (!msg) {
                    return sendJson({ success: false, message: 'Məktub tapılmadı!' }, 404);
                }

                if (!Array.isArray(msg.claimed_by)) {
                    msg.claimed_by = msg.claimed_by ? [msg.claimed_by] : [];
                }
                if (msg.claimed_by.includes(playerId)) {
                    return sendJson({ success: false, message: 'Bu mükafat artıq götürülüb!' }, 400);
                }

                msg.claimed_by.push(playerId);
                writeJson(INBOX_FILE, allInbox);

                const blue = msg.blue_diamonds || 0;
                const red = msg.red_diamonds || 0;

                // Oyunçunun balansını artırırıq
                const players = readJson(PLAYERS_FILE, []);
                const player = players.find(p => p.playerId === playerId);
                if (player) {
                    player.diamonds = (player.diamonds || 0) + blue;
                    player.redDiamonds = (player.redDiamonds || 0) + red;
                    writeJson(PLAYERS_FILE, players);
                }

                return sendJson({
                    success: true,
                    message: 'Mükafat uğurla qəbul edildi!',
                    blueDiamonds: blue,
                    redDiamonds: red
                });
            }

            // 5.1 İnbox Məktubunu Silmək (Delete)
            if (pathname === '/api/inbox/delete') {
                const msgId = parseInt(data.messageId || data.message_id, 10);
                const playerId = (data.playerId || data.player_id || '').trim();

                const allInbox = readJson(INBOX_FILE, []);
                const msgIdx = allInbox.findIndex(m => m.id === msgId);
                if (msgIdx !== -1) {
                    const msg = allInbox[msgIdx];
                    if (msg.player_id === playerId) {
                        allInbox.splice(msgIdx, 1);
                    } else {
                        if (!Array.isArray(msg.deleted_by)) msg.deleted_by = [];
                        if (!msg.deleted_by.includes(playerId)) msg.deleted_by.push(playerId);
                    }
                    writeJson(INBOX_FILE, allInbox);
                }

                return sendJson({ success: true, message: 'Məktub uğurla silindi!' });
            }

            // 6. Hədiyyə Kodu Yaratmaq (Admin)
            if (pathname === '/api/giftcode/generate') {
                const blue = Math.max(0, parseInt(data.blueDiamonds) || 0);
                const red = Math.max(0, parseInt(data.redDiamonds) || 0);
                if (blue === 0 && red === 0) {
                    return sendJson({ success: false, message: 'Almaz sayı 0-dan böyük olmalıdır!' }, 400);
                }
                const custom = (data.customCode || '').trim().toUpperCase();
                const codes = readJson(CODES_FILE, []);
                let newCode = custom || generateRandomCode();
                if (codes.some(c => c.code === newCode)) newCode = generateRandomCode();

                const newEntry = {
                    code: newCode,
                    blueDiamonds: blue,
                    redDiamonds: red,
                    used: false,
                    createdAt: new Date().toISOString()
                };
                codes.push(newEntry);
                writeJson(CODES_FILE, codes);

                return sendJson({ success: true, code: newEntry });
            }

            // 7. Hədiyyə Kodunu Aktivləşdirmək (Redeem)
            if (pathname === '/api/giftcode/redeem') {
                const targetCode = (data.code || '').trim().toUpperCase();
                const playerId = (data.playerId || '').trim();

                if (!targetCode) {
                    return sendJson({ success: false, message: 'Kod daxil edilməyib!' }, 400);
                }

                const codes = readJson(CODES_FILE, []);
                const item = codes.find(c => c.code === targetCode);

                if (!item) {
                    return sendJson({ success: false, message: 'Bu kod mövcud deyil!' }, 404);
                }
                if (item.used) {
                    return sendJson({ success: false, message: 'Bu kod artıq istifadə edilib!' }, 400);
                }

                item.used = true;
                item.usedAt = new Date().toISOString();
                item.usedBy = playerId;
                writeJson(CODES_FILE, codes);

                // Oyunçunun balansını artırırıq
                if (playerId) {
                    const players = readJson(PLAYERS_FILE, []);
                    const player = players.find(p => p.playerId === playerId);
                    if (player) {
                        player.diamonds = (player.diamonds || 0) + (item.blueDiamonds || 0);
                        player.redDiamonds = (player.redDiamonds || 0) + (item.redDiamonds || 0);
                        writeJson(PLAYERS_FILE, players);
                    }
                }

                return sendJson({
                    success: true,
                    message: 'Kod uğurla aktivləşdirildi!',
                    blueDiamonds: item.blueDiamonds || 0,
                    redDiamonds: item.redDiamonds || 0
                });
            }

            // 8. Admin Hədiyyə Kodu Yaratmaq və Məktub Göndərmək (Generator üçün)
            if (pathname === '/api/admin/send_gift') {
                const targetType = (data.targetType || 'ALL').trim().toUpperCase();
                const playerId = (data.playerId || 'ALL').trim();
                const blue = Math.max(0, parseInt(data.blueDiamonds) || 0);
                const red = Math.max(0, parseInt(data.redDiamonds) || 0);
                const title = (data.title || '🎁 Xüsusi Admin Hədiyyəsi!').trim();
                const note = (data.note || '').trim();
                const expiresAt = data.expiresAt || null;

                if (blue <= 0 && red <= 0) {
                    return sendJson({ success: false, message: 'Ən azı 1 almaz daxil edilməlidir!' }, 400);
                }

                const token = data.token || generateRandomCode();
                const allInbox = readJson(INBOX_FILE, []);
                const nextId = allInbox.length > 0 ? (Math.max(...allInbox.map(m => m.id || 0)) + 1) : 1;

                const newMsg = {
                    id: nextId,
                    target_type: targetType,
                    player_id: playerId,
                    title,
                    note,
                    gift_code: token,
                    blue_diamonds: blue,
                    red_diamonds: red,
                    expires_at: expiresAt,
                    created_at: new Date().toISOString(),
                    claimed_by: [],
                    is_claimed: 0
                };

                allInbox.push(newMsg);
                writeJson(INBOX_FILE, allInbox);

                const codes = readJson(CODES_FILE, []);
                codes.push({
                    code: token,
                    target_type: targetType,
                    target_player_id: playerId,
                    blueDiamonds: blue,
                    redDiamonds: red,
                    expires_at: expiresAt,
                    used: false,
                    createdAt: new Date().toISOString()
                });
                writeJson(CODES_FILE, codes);

                broadcastInbox(targetType, playerId, newMsg);

                return sendJson({
                    success: true,
                    message: `Hədiyyə yaradıldı və ${targetType === 'ALL' ? 'hamıya' : playerId + ' oyunçusuna'} göndərildi!`,
                    code: token,
                    messageId: nextId
                });
            }

            // Əgər heç bir POST marşrutuna uyğun gəlmirsə
            return sendJson({ success: false, message: 'Marşrut tapılmadı' }, 404);
        });
        return;
    }

    // ==========================================
    // STATİK FAYLLARIN TƏQDİM EDİLMƏSİ (HTML, JS, CSS)
    // ==========================================
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

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

// Serveri Dinləyirik
server.listen(PORT, '0.0.0.0', () => {
    console.log('======================================================');
    console.log(`  ⚡ Floor Escape Universal Node Server Aktivdir!`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Qovluq: ${PUBLIC_DIR}`);
    console.log(`  Məlumat Bazası: ${DATA_DIR}`);
    console.log('======================================================');
});

// Könüllü WebSocket Serveri (Əsas HTTP server üzərində eyni portda işləyir)
try {
    const WebSocket = require('ws');
    const wss = new WebSocket.Server({ server });
    console.log(`  ⚡ WebSocket Real-Time Serveri Eyni Portda Aktivdir (Port: ${PORT})`);

    wss.on('connection', (ws) => {
        wsClients.add(ws);
        ws.on('message', (msg) => {
            try {
                const data = JSON.parse(msg);
                if (data.type === 'REGISTER' && data.playerId) {
                    wsPlayerMap.set(ws, data.playerId);
                } else if (data.type === 'PING') {
                    ws.send(JSON.stringify({ type: 'PONG' }));
                }
            } catch (e) {}
        });
        ws.on('close', () => {
            wsClients.delete(ws);
            wsPlayerMap.delete(ws);
        });
    });
} catch (e) {
    console.log('  ℹ️ ws paketi tapılmadı, çat sorğu (HTTP polling) rejimində davam edir.');
}
