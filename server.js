const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const BASE_DIR = __dirname;
const PUBLIC_DIR = path.join(BASE_DIR, 'public');
const PORT = parseInt(process.env.PORT || '4000', 10);
const WS_PORT = parseInt(process.env.WS_PORT || '4001', 10);

// ==========================================
// 🛑 1. MÜHİT DƏYİŞƏNİ (DATABASE_URL) YOXLANIŞI
// ==========================================
// Mühit dəyişəni YALNIZ və YALNIZ sistemin mühitindən (process.env) oxunur.
const DATABASE_URL = (process.env.DATABASE_URL || '').trim();

if (!DATABASE_URL || (!DATABASE_URL.startsWith('postgresql://') && !DATABASE_URL.startsWith('postgres://'))) {
    console.error('\n' + '!'.repeat(72));
    console.error(' [KRİTİK XƏTA] DATABASE_URL MÜHİT DƏYİŞƏNİ TƏYİN EDİLMƏYİB!');
    console.error(' Floor Escape serveri yalnız mərkəzi PostgreSQL bazası ilə işləyir.');
    console.error(' Lokal yaddaş (JSON və ya SQLite) istifadəsi tamamilə qadağandır.');
    console.error(' Server işə düşmədi və proses dayandırılır.');
    console.error(' Zəhmət olmasa mühit dəyişənini təyin edin: DATABASE_URL=postgresql://user:pass@host:5432/dbname');
    console.error('!'.repeat(72) + '\n');
    process.exit(1);
}

// ==========================================
// 🐘 2. POSTGRESQL POOL VƏ BAĞLANTI
// ==========================================
const pool = new Pool({
    connectionString: DATABASE_URL,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20
});

pool.on('error', (err) => {
    console.error(' [PostgreSQL Gözlənilməz Xəta]:', err.message);
});

// Miqrasiya və Cədvəllərin yoxlanılması
async function initDb() {
    console.log(' [*] PostgreSQL verilənlər bazasına qoşulma yoxlanılır...');
    try {
        const client = await pool.connect();
        const sqlFile = path.join(BASE_DIR, 'migrations', '001_init_postgres.sql');
        if (fs.existsSync(sqlFile)) {
            const sql = fs.readFileSync(sqlFile, 'utf-8');
            await client.query(sql);
            console.log(' [✓] PostgreSQL cədvəlləri uğurla yoxlanıldı və hazırlandı!');
        }
        client.release();
    } catch (err) {
        console.error('\n' + '!'.repeat(72));
        console.error(' [KRİTİK XƏTA] PostgreSQL bazasına qoşulmaq mümkün olmadı:');
        console.error(' ' + err.message);
        console.error(' Server mərkəzi baza olmadan işləyə bilməz. Proses dayandırılır.');
        console.error('!'.repeat(72) + '\n');
        process.exit(1);
    }
}

// ==========================================
// KÖMƏKÇİ FUNKSİYALAR
// ==========================================
function hashPin(pin) {
    return crypto.createHash('sha256').update(String(pin).trim()).digest('hex');
}

function mergePermUpgrades(existingUpgrades, clientUpgrades) {
    const existing = (existingUpgrades && typeof existingUpgrades === 'object') ? existingUpgrades : {};
    const client = (clientUpgrades && typeof clientUpgrades === 'object') ? clientUpgrades : {};
    const merged = { ...existing };

    for (const [k, v] of Object.entries(client)) {
        if (!(k in merged)) {
            merged[k] = v;
            continue;
        }
        const exVal = merged[k];
        if (typeof v === 'number' && typeof exVal === 'number') {
            if (k === 'turretInterval') {
                merged[k] = (v > 0) ? Math.min(exVal, v) : exVal;
            } else if (k === 'cyberStars' || k === 'maxCyberStars') {
                merged[k] = Math.max(exVal, v);
            } else {
                merged[k] = Math.max(exVal, v);
            }
        } else if (Array.isArray(v) && Array.isArray(exVal)) {
            merged[k] = Array.from(new Set([...exVal, ...v]));
        } else if (typeof v === 'boolean' && typeof exVal === 'boolean') {
            merged[k] = exVal || v;
        } else {
            if (v !== undefined && v !== null && v !== '') {
                merged[k] = v;
            } else if (v === null && (k === 'equippedSpawnAnim' || k === 'equippedSkin')) {
                merged[k] = null;
            }
        }
    }
    const ownedAnims = Array.isArray(merged.ownedSpawnAnims) ? merged.ownedSpawnAnims : [];
    if (merged.equippedSpawnAnim && !ownedAnims.includes(merged.equippedSpawnAnim)) {
        merged.equippedSpawnAnim = null;
    }
    return merged;
}

function mergeClaimedChests(existingChests, clientChests) {
    const ex = Array.isArray(existingChests) ? existingChests : [];
    const cl = Array.isArray(clientChests) ? clientChests : [];
    return Array.from(new Set([...ex, ...cl]));
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

// ==========================================
// 🚀 HTTP SERVER
// ==========================================
const server = http.createServer(async (req, res) => {
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
    };

    // ==========================================
    // API MARŞRUTLARI (GET)
    // ==========================================
    if (req.method === 'GET') {
        if (pathname === '/api/realtime-config') return sendJson({ port: null });

        // 0. Oyunçuların Siyahısı (Admin Generator üçün)
        if (pathname === '/api/players/list') {
            try {
                const result = await pool.query(
                    `SELECT player_id, username, diamonds, red_diamonds, gold, best_floor, last_login, created_at 
                     FROM players ORDER BY last_login DESC LIMIT 100`
                );
                return sendJson({ success: true, players: result.rows });
            } catch (err) {
                return sendJson({ success: false, message: err.message }, 500);
            }
        }

        // 1. Liderlər Cədvəli
        if (pathname === '/api/leaderboard') {
            try {
                const result = await pool.query(
                    `SELECT player_id, username, best_floor, diamonds, red_diamonds, gold, total_score, last_login 
                     FROM players 
                     ORDER BY best_floor DESC, diamonds DESC, red_diamonds DESC, total_score DESC 
                     LIMIT 50`
                );
                return sendJson({ success: true, leaderboard: result.rows });
            } catch (err) {
                return sendJson({ success: false, message: err.message }, 500);
            }
        }

        // 2. Qlobal Çat Mesajları
        if (pathname === '/api/chat/messages') {
            try {
                const result = await pool.query(
                    `SELECT id, player_id, username, message, created_at 
                     FROM chat_messages 
                     ORDER BY id DESC LIMIT 50`
                );
                return sendJson({ success: true, messages: result.rows.reverse() });
            } catch (err) {
                return sendJson({ success: false, message: err.message }, 500);
            }
        }

        // 3. Oyunçunun İnbox / Məktub Qutusu
        if (pathname === '/api/inbox') {
            const playerId = (parsedUrl.searchParams.get('playerId') || parsedUrl.searchParams.get('player_id') || '').trim();
            if (!playerId) {
                return sendJson({ success: false, message: 'Player ID tələb olunur!' }, 400);
            }
            try {
                const result = await pool.query(
                    `SELECT m.id, m.target_type, m.player_id, m.title, m.note, m.gift_code, 
                            m.blue_diamonds, m.red_diamonds, m.created_at,
                            CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END AS is_claimed
                     FROM inbox_messages m
                     LEFT JOIN claimed_messages c ON c.message_id = m.id AND c.player_id = $1
                     WHERE (m.target_type = 'ALL' OR m.player_id = $1)
                       AND (m.expires_at IS NULL OR m.expires_at > CURRENT_TIMESTAMP)
                     ORDER BY m.id DESC LIMIT 50`,
                    [playerId]
                );
                return sendJson({ success: true, messages: result.rows });
            } catch (err) {
                return sendJson({ success: false, message: err.message }, 500);
            }
        }

        // 4. Oyunçu Profili
        if (pathname === '/api/player/profile') {
            const playerId = (parsedUrl.searchParams.get('playerId') || '').trim();
            if (!playerId) return sendJson({ success: false, message: 'Player ID tələb olunur!' }, 400);
            try {
                const result = await pool.query(
                    `SELECT player_id, username, gold, diamonds, red_diamonds, best_floor, total_score, perm_upgrades, claimed_chests 
                     FROM players WHERE player_id = $1`,
                    [playerId]
                );
                if (result.rows.length > 0) {
                    const row = result.rows[0];
                    return sendJson({
                        success: true,
                        player: {
                            playerId: row.player_id,
                            username: row.username,
                            gold: row.gold,
                            diamonds: row.diamonds,
                            redDiamonds: row.red_diamonds,
                            bestFloor: row.best_floor,
                            totalScore: row.total_score,
                            permUpgrades: row.perm_upgrades || {},
                            claimedChests: row.claimed_chests || []
                        }
                    });
                }
                return sendJson({ success: false, message: 'Oyunçu tapılmadı!' }, 200);
            } catch (err) {
                return sendJson({ success: false, message: err.message }, 500);
            }
        }

        // 5. Hədiyyə kodları siyahısı
        if (pathname === '/api/giftcode/list') {
            try {
                const result = await pool.query(
                    `SELECT code, target_type, target_player_id, blue_diamonds, red_diamonds, expires_at, created_at, is_active 
                     FROM gift_codes_advanced ORDER BY created_at DESC LIMIT 50`
                );
                return sendJson({ success: true, codes: result.rows });
            } catch (err) {
                return sendJson({ success: false, message: err.message }, 500);
            }
        }
    }

    // ==========================================
    // API MARŞRUTLARI (POST)
    // ==========================================
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
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

                try {
                    // Adın təkrar olub-olmaması
                    const check = await pool.query('SELECT 1 FROM players WHERE lower(username) = lower($1)', [username]);
                    if (check.rows.length > 0) {
                        return sendJson({ success: false, message: 'Bu ad artıq istifadə olunur! Başqa ad seçin.' }, 400);
                    }

                    const playerId = generatePlayerId();
                    const pinH = hashPin(pin);
                    const gold = Math.max(75, parseFloat(data.gold) || 75);
                    const diamonds = Math.max(0, parseInt(data.diamonds) || 0);
                    const redDiamonds = Math.max(0, parseInt(data.redDiamonds) || 0);
                    const bestFloor = Math.max(1, parseInt(data.bestFloor) || 1);
                    const totalScore = Math.max(0, parseInt(data.totalScore) || 0);
                    const permUpgrades = JSON.stringify(data.permUpgrades || {});
                    const claimedChests = JSON.stringify(data.claimedChests || []);

                    await pool.query(
                        `INSERT INTO players (player_id, username, pin_hash, gold, diamonds, red_diamonds, best_floor, total_score, perm_upgrades, claimed_chests)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [playerId, username, pinH, gold, diamonds, redDiamonds, bestFloor, totalScore, permUpgrades, claimedChests]
                    );

                    return sendJson({
                        success: true,
                        message: 'Qeydiyyat uğurla tamamlandı!',
                        player: { playerId, username, gold, diamonds, redDiamonds, bestFloor, permUpgrades: data.permUpgrades || {}, claimedChests: data.claimedChests || [] }
                    });
                } catch (err) {
                    return sendJson({ success: false, message: err.message }, 500);
                }
            }

            // 2. Oyunçu Girişi
            if (pathname === '/api/auth/login') {
                const loginKey = (data.login || data.username || '').trim();
                const pin = String(data.pin || data.password || '').trim();

                if (!loginKey || !pin) {
                    return sendJson({ success: false, message: 'İstifadəçi adı və PIN daxil edilməlidir!' }, 400);
                }

                try {
                    const result = await pool.query(
                        `SELECT * FROM players WHERE lower(username) = lower($1) OR player_id = $1`,
                        [loginKey]
                    );
                    if (result.rows.length === 0) {
                        return sendJson({ success: false, message: 'Bu adda və ya ID-də oyunçu tapılmadı! Zəhmət olmasa Qeydiyyatdan keçin.' }, 400);
                    }

                    const player = result.rows[0];
                    if (player.pin_hash !== hashPin(pin)) {
                        return sendJson({ success: false, message: 'PIN şifrə yanlışdır!' }, 400);
                    }

                    await pool.query('UPDATE players SET last_login = CURRENT_TIMESTAMP WHERE player_id = $1', [player.player_id]);

                    return sendJson({
                        success: true,
                        message: `Xoş gəldin, ${player.username}!`,
                        player: {
                            playerId: player.player_id,
                            username: player.username,
                            gold: player.gold,
                            diamonds: player.diamonds,
                            redDiamonds: player.red_diamonds,
                            bestFloor: player.best_floor,
                            totalScore: player.total_score || 0,
                            permUpgrades: player.perm_upgrades || {},
                            claimedChests: player.claimed_chests || []
                        }
                    });
                } catch (err) {
                    return sendJson({ success: false, message: err.message }, 500);
                }
            }

            // 3. Tərəqqinin Sinxronizasiyası (Sync)
            if (pathname === '/api/player/sync') {
                const playerId = (data.playerId || data.player_id || '').trim();
                if (!playerId) return sendJson({ success: false, message: 'ID tələb olunur' }, 200);

                try {
                    const exRes = await pool.query(
                        `SELECT gold, diamonds, red_diamonds, best_floor, total_score, perm_upgrades, claimed_chests 
                         FROM players WHERE player_id = $1`,
                        [playerId]
                    );
                    if (exRes.rows.length === 0) {
                        return sendJson({ success: false, message: 'Oyunçu tapılmadı' }, 200);
                    }
                    const existing = exRes.rows[0];

                    const gold = (data.gold !== undefined) ? parseFloat(data.gold) : (parseFloat(existing.gold) || 0);
                    const clientDiamonds = (data.diamonds !== undefined) ? Math.max(0, parseInt(data.diamonds) || 0) : (existing.diamonds || 0);
                    const clientRed = (data.redDiamonds !== undefined) ? Math.max(0, parseInt(data.redDiamonds) || 0) : (existing.red_diamonds || 0);
                    const bestFloor = Math.max(existing.best_floor || 1, parseInt(data.bestFloor) || 1);
                    const totalScore = Math.max(existing.total_score || 0, parseInt(data.totalScore) || 0);

                    const mergedUpgrades = mergePermUpgrades(existing.perm_upgrades, data.permUpgrades);
                    const mergedChests = mergeClaimedChests(existing.claimed_chests, data.claimedChests);

                    await pool.query(
                        `UPDATE players 
                         SET gold = $1, diamonds = $2, red_diamonds = $3, 
                             best_floor = $4, total_score = $5,
                             perm_upgrades = $6, claimed_chests = $7,
                             last_login = CURRENT_TIMESTAMP
                         WHERE player_id = $8`,
                        [gold, clientDiamonds, clientRed, bestFloor, totalScore, JSON.stringify(mergedUpgrades), JSON.stringify(mergedChests), playerId]
                    );

                    return sendJson({ 
                        success: true, 
                        message: 'Məlumatlar PostgreSQL-də saxlanıldı!',
                        gold,
                        diamonds: clientDiamonds,
                        redDiamonds: clientRed,
                        bestFloor,
                        permUpgrades: mergedUpgrades,
                        claimedChests: mergedChests
                    });
                } catch (err) {
                    return sendJson({ success: false, message: err.message }, 500);
                }
            }

            // 4. Çata Mesaj Göndərmək
            if (pathname === '/api/chat/send') {
                const playerId = (data.playerId || 'Qonaq').trim();
                const username = (data.username || 'Oyunçu').trim();
                const msg = (data.message || '').trim();

                if (!msg) return sendJson({ success: false, message: 'Mesaj boş ola bilməz!' }, 400);

                try {
                    await pool.query(
                        'INSERT INTO chat_messages (player_id, username, message) VALUES ($1, $2, $3)',
                        [playerId, username, msg.slice(0, 200)]
                    );
                    return sendJson({ success: true, message: 'Mesaj göndərildi!' });
                } catch (err) {
                    return sendJson({ success: false, message: err.message }, 500);
                }
            }

            // 5. İnbox Mükafatını Götürmək (Claim)
            if (pathname === '/api/inbox/claim') {
                const msgId = parseInt(data.messageId || data.message_id, 10);
                const playerId = (data.playerId || data.player_id || '').trim();

                if (!msgId || !playerId) {
                    return sendJson({ success: false, message: 'Mesaj ID və Oyunçu ID tələb olunur!' }, 400);
                }

                try {
                    // Məktubu tapırıq
                    const msgRes = await pool.query('SELECT * FROM inbox_messages WHERE id = $1', [msgId]);
                    if (msgRes.rows.length === 0) {
                        return sendJson({ success: false, message: 'Məktub tapılmadı!' }, 404);
                    }
                    const msg = msgRes.rows[0];

                    // Artıq götürülübmü?
                    const claimCheck = await pool.query('SELECT 1 FROM claimed_messages WHERE message_id = $1 AND player_id = $2', [msgId, playerId]);
                    if (claimCheck.rows.length > 0) {
                        return sendJson({ success: false, message: 'Bu mükafat artıq götürülüb!' }, 400);
                    }

                    // Claim əlavə edirik
                    await pool.query('INSERT INTO claimed_messages (message_id, player_id) VALUES ($1, $2)', [msgId, playerId]);

                    // Oyunçunun balansını artırırıq
                    const blue = msg.blue_diamonds || 0;
                    const red = msg.red_diamonds || 0;
                    await pool.query(
                        'UPDATE players SET diamonds = diamonds + $1, red_diamonds = red_diamonds + $2 WHERE player_id = $3',
                        [blue, red, playerId]
                    );

                    return sendJson({
                        success: true,
                        message: 'Mükafat uğurla qəbul edildi!',
                        blueDiamonds: blue,
                        redDiamonds: red
                    });
                } catch (err) {
                    return sendJson({ success: false, message: err.message }, 500);
                }
            }

            // 6. Admin Hədiyyə Kodu Yaratmaq və Məktub Göndərmək
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

                try {
                    const msgInsert = await pool.query(
                        `INSERT INTO inbox_messages (target_type, player_id, title, note, gift_code, blue_diamonds, red_diamonds, expires_at)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                        [targetType, playerId, title, note, token, blue, red, expiresAt]
                    );
                    const newMsgId = msgInsert.rows[0].id;

                    await pool.query(
                        `INSERT INTO gift_codes_advanced (code, target_type, target_player_id, blue_diamonds, red_diamonds, expires_at)
                         VALUES ($1, $2, $3, $4, $5, $6)
                         ON CONFLICT (code) DO NOTHING`,
                        [token, targetType, playerId, blue, red, expiresAt]
                    );

                    const newMsg = {
                        id: newMsgId,
                        target_type: targetType,
                        player_id: playerId,
                        title,
                        note,
                        gift_code: token,
                        blue_diamonds: blue,
                        red_diamonds: red,
                        created_at: new Date().toISOString(),
                        is_claimed: 0
                    };

                    broadcastInbox(targetType, playerId, newMsg);

                    return sendJson({
                        success: true,
                        message: `Hədiyyə yaradıldı və ${targetType === 'ALL' ? 'hamıya' : playerId + ' oyunçusuna'} göndərildi!`,
                        code: token,
                        messageId: newMsgId
                    });
                } catch (err) {
                    return sendJson({ success: false, message: err.message }, 500);
                }
            }

            // 7. Hədiyyə Kodunu Aktivləşdirmək (Redeem)
            if (pathname === '/api/giftcode/redeem') {
                const targetCode = (data.code || '').trim().toUpperCase();
                const playerId = (data.playerId || '').trim();

                if (!targetCode) return sendJson({ success: false, message: 'Kod daxil edilməyib!' }, 400);

                try {
                    const codeRes = await pool.query('SELECT * FROM gift_codes_advanced WHERE code = $1', [targetCode]);
                    if (codeRes.rows.length === 0) {
                        return sendJson({ success: false, message: 'Bu kod mövcud deyil!' }, 404);
                    }
                    const item = codeRes.rows[0];
                    if (item.is_active === 0) {
                        return sendJson({ success: false, message: 'Bu kod artıq deaktivdir və ya istifadə edilib!' }, 400);
                    }

                    if (item.target_type === 'SINGLE' && item.target_player_id !== playerId) {
                        return sendJson({ success: false, message: 'Bu kod sizin üçün nəzərdə tutulmayıb!' }, 403);
                    }

                    if (item.target_type === 'SINGLE') {
                        await pool.query('UPDATE gift_codes_advanced SET is_active = 0 WHERE code = $1', [targetCode]);
                    }

                    const blue = item.blue_diamonds || 0;
                    const red = item.red_diamonds || 0;

                    if (playerId) {
                        await pool.query(
                            'UPDATE players SET diamonds = diamonds + $1, red_diamonds = red_diamonds + $2 WHERE player_id = $3',
                            [blue, red, playerId]
                        );
                    }

                    return sendJson({
                        success: true,
                        message: 'Kod uğurla aktivləşdirildi!',
                        blueDiamonds: blue,
                        redDiamonds: red
                    });
                } catch (err) {
                    return sendJson({ success: false, message: err.message }, 500);
                }
            }

            // 8. Yol Yadda Saxlanılması (Track Studio API)
            if (pathname === '/api/tracks/save') {
                const track = data.track;
                const allTracks = data.allTracks;

                const jsonPath = path.join(PUBLIC_DIR, 'data', 'floor_patterns.json');
                const jsPath = path.join(PUBLIC_DIR, 'js', 'data', 'floor_patterns.js');

                let targetTracks = allTracks;
                if (!targetTracks || !Array.isArray(targetTracks)) {
                    let currentData = { tracks: [] };
                    try {
                        if (fs.existsSync(jsonPath)) {
                            currentData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8') || '{"tracks":[]}');
                        }
                    } catch (e) {}
                    targetTracks = currentData.tracks || [];
                    if (track && track.id) {
                        const idx = targetTracks.findIndex(t => t.id === track.id);
                        if (idx >= 0) targetTracks[idx] = track;
                        else targetTracks.push(track);
                    }
                }

                const payload = {
                    totalTracks: targetTracks.length,
                    description: "Floor Escape 30 ədəd sınaq yolu. Track Studio tərəfindən idarə olunur.",
                    tracks: targetTracks
                };

                try {
                    fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');
                    const jsContent = `// Avtomatik yenilənmiş Floor Escape Sınaq Yolları\nwindow.FLOOR_PATTERNS = ${JSON.stringify(payload, null, 2)};\n`;
                    fs.writeFileSync(jsPath, jsContent, 'utf-8');
                } catch (e) {
                    console.error('JS faylı yazılarkən xəta:', e.message);
                }

                return sendJson({
                    success: true,
                    message: `Yol ${track ? track.id : ''} uğurla yadda saxlandı!`,
                    trackId: track ? track.id : 1
                });
            }

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

// Serveri Dinləyirik və Baza Yoxlanışını Başladırıq
initDb().then(() => {
    server.listen(PORT, '0.0.0.0', () => {
        console.log('======================================================');
        console.log(`  ⚡ Floor Escape Universal Node Server Aktivdir!`);
        console.log(`  Port: ${PORT}`);
        console.log(`  🐘 PostgreSQL Verilənlər Bazası Tam Bağlandı!`);
        console.log('======================================================');
    });
});

// WebSocket Serveri
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
