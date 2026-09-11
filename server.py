import http.server
import socketserver
import json
import os
import random
import string
import sys
import sqlite3
import hashlib
import threading
import asyncio
import websockets
from datetime import datetime, timezone
from urllib.parse import urlparse

try:
    from generator import verify_signed_gift_code, create_signed_gift_code
except Exception:
    verify_signed_gift_code = None
    create_signed_gift_code = None

# Windows konsol kodlaşdırma xətasının qarşısını almaq
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 4000
WS_PORT = 4001
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
DATA_DIR = os.path.join(BASE_DIR, 'data')
DB_FILE = os.path.join(DATA_DIR, 'floor_escape.db')
CODES_FILE = os.path.join(DATA_DIR, 'gift_codes.json')
USED_TOKENS_FILE = os.path.join(DATA_DIR, 'used_tokens.json')

# ============================================================================
# ⚡ WEBSOCKET REAL-TIME ENGINE (CANLI POÇT VƏ BİLDİRİŞ SERVERİ)
# ============================================================================
ws_clients = set()
ws_player_map = {}
ws_loop = None

async def ws_handler(websocket):
    ws_clients.add(websocket)
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                mtype = data.get('type')
                if mtype == 'REGISTER':
                    pid = str(data.get('playerId', '')).strip()
                    if pid:
                        ws_player_map[websocket] = pid
                elif mtype == 'PING':
                    await websocket.send(json.dumps({'type': 'PONG'}))
            except Exception:
                pass
    except Exception:
        pass
    finally:
        ws_clients.discard(websocket)
        ws_player_map.pop(websocket, None)

def broadcast_inbox_message(target_type, player_id, msg_data):
    global ws_loop
    if not ws_loop:
        return
    try:
        asyncio.run_coroutine_threadsafe(_async_broadcast_inbox(target_type, player_id, msg_data), ws_loop)
    except Exception as e:
        print(f"WebSocket broadcast xətası: {e}")

async def _async_broadcast_inbox(target_type, player_id, msg_data):
    if not ws_clients:
        return
    payload = json.dumps({
        'type': 'NEW_INBOX_MESSAGE',
        'targetType': target_type,
        'playerId': player_id,
        'message': msg_data
    }, ensure_ascii=False)
    
    dead = set()
    for ws in list(ws_clients):
        try:
            ws_pid = ws_player_map.get(ws)
            if target_type == 'ALL' or (ws_pid and str(ws_pid) == str(player_id)):
                await ws.send(payload)
        except Exception:
            dead.add(ws)
    for ws in dead:
        ws_clients.discard(ws)
        ws_player_map.pop(ws, None)

def start_websocket_server():
    global ws_loop
    ws_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(ws_loop)
    
    async def main():
        async with websockets.serve(ws_handler, "0.0.0.0", WS_PORT):
            print(f"  ⚡ WebSocket Real-Time Serveri Aktivdir: ws://localhost:{WS_PORT}")
            await asyncio.Future()
            
    try:
        ws_loop.run_until_complete(main())
    except Exception as e:
        print(f"WebSocket server xətası: {e}")

# WebSocket serverini arxa planda işə salırıq
ws_thread = threading.Thread(target=start_websocket_server, daemon=True)
ws_thread.start()

# data qovluğunun mövcudluğuna əmin olmaq
os.makedirs(DATA_DIR, exist_ok=True)
if not os.path.exists(CODES_FILE):
    with open(CODES_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f)

if not os.path.exists(USED_TOKENS_FILE):
    with open(USED_TOKENS_FILE, 'w', encoding='utf-8') as f:
        json.dump({}, f)

def get_db():
    conn = sqlite3.connect(DB_FILE, timeout=15)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            # 1. OYUNÇULAR VƏ HESABLAR CƏDVƏLİ
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS players (
                    player_id TEXT PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    pin_hash TEXT NOT NULL,
                    gold REAL DEFAULT 75,
                    diamonds INTEGER DEFAULT 0,
                    red_diamonds INTEGER DEFAULT 0,
                    best_floor INTEGER DEFAULT 1,
                    total_score INTEGER DEFAULT 0,
                    perm_upgrades TEXT DEFAULT '{}',
                    claimed_chests TEXT DEFAULT '[]',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            # 2. QLOBAL ÇAT MESAJLARI CƏDVƏLİ
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    player_id TEXT NOT NULL,
                    username TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            # 3. İNBOX / POÇT BİLDİRİŞLƏRİ VƏ HƏDİYYƏLƏR CƏDVƏLİ
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS inbox_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    target_type TEXT NOT NULL DEFAULT 'ALL',
                    player_id TEXT DEFAULT 'ALL',
                    title TEXT NOT NULL,
                    note TEXT,
                    gift_code TEXT NOT NULL,
                    blue_diamonds INTEGER DEFAULT 0,
                    red_diamonds INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP DEFAULT NULL,
                    is_claimed INTEGER DEFAULT 0,
                    claimed_by TEXT DEFAULT NULL,
                    claimed_at TIMESTAMP DEFAULT NULL
                )
            ''')
            # Mövcud bazaya çatışmayan sütunları əlavə etmək (Migrasiya)
            cursor.execute("PRAGMA table_info(inbox_messages)")
            cols = [col[1] for col in cursor.fetchall()]
            if 'is_claimed' not in cols:
                cursor.execute("ALTER TABLE inbox_messages ADD COLUMN is_claimed INTEGER DEFAULT 0")
            if 'claimed_by' not in cols:
                cursor.execute("ALTER TABLE inbox_messages ADD COLUMN claimed_by TEXT DEFAULT NULL")
            if 'claimed_at' not in cols:
                cursor.execute("ALTER TABLE inbox_messages ADD COLUMN claimed_at TIMESTAMP DEFAULT NULL")

            # 4. MƏKTUBLARIN QƏBUL EDİLMƏSİ (CLAIM) CƏDVƏLİ
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS claimed_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    message_id INTEGER NOT NULL,
                    player_id TEXT NOT NULL,
                    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(message_id, player_id)
                )
            ''')
            # 5. ƏTRAFLI HƏDİYYƏ KODLARI CƏDVƏLİ
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS gift_codes_advanced (
                    code TEXT PRIMARY KEY,
                    target_type TEXT NOT NULL DEFAULT 'ALL',
                    target_player_id TEXT DEFAULT 'ALL',
                    blue_diamonds INTEGER DEFAULT 0,
                    red_diamonds INTEGER DEFAULT 0,
                    expires_at TIMESTAMP DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_active INTEGER DEFAULT 1
                )
            ''')
            conn.commit()
            print("  SQLite Baza: data/floor_escape.db hazirdir (İnbox və Hədiyyə cədvəlləri aktivdir).")
    except Exception as e:
        print(f"Baza yaradılarkən xəta: {e}")

init_db()

def hash_pin(pin):
    return hashlib.sha256(str(pin).strip().encode('utf-8')).hexdigest()

def generate_player_id():
    with get_db() as conn:
        cursor = conn.cursor()
        while True:
            pid = str(random.randint(1000000, 9999999))
            cursor.execute('SELECT 1 FROM players WHERE player_id = ?', (pid,))
            if not cursor.fetchone():
                return pid

def read_used_tokens():
    try:
        with open(USED_TOKENS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}

def save_used_tokens(tokens):
    try:
        with open(USED_TOKENS_FILE, 'w', encoding='utf-8') as f:
            json.dump(tokens, f, indent=2, ensure_ascii=False)
        return True
    except Exception:
        return False

def read_codes():
    try:
        with open(CODES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Kodları oxuyarkən xəta: {e}")
        return []

def save_codes(codes):
    try:
        with open(CODES_FILE, 'w', encoding='utf-8') as f:
            json.dump(codes, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Kodları saxlayarkən xəta: {e}")
        return False

def generate_random_code():
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    seg1 = ''.join(random.choices(chars, k=4))
    seg2 = ''.join(random.choices(chars, k=4))
    seg3 = ''.join(random.choices(chars, k=4))
    return f"GIFT-{seg1}-{seg2}-{seg3}"

class GameHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def end_headers(self):
        # CORS başlıqları
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Keşin qarşısını almaq üçün (həmişə ən son JS/CSS yüklənsin)
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def do_GET(self):
        parsed = urlparse(self.path)

        # 1. API: Hədiyyə kodlarının siyahısı
        if parsed.path == '/api/giftcode/list':
            codes = read_codes()
            self.send_json({'success': True, 'codes': codes})
            return

        # 2. API: Liderlər Cədvəli (Daşbord)
        if parsed.path == '/api/leaderboard':
            try:
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute('''
                        SELECT player_id, username, best_floor, diamonds, red_diamonds, gold, total_score, last_login
                        FROM players
                        ORDER BY best_floor DESC, diamonds DESC, red_diamonds DESC, total_score DESC
                        LIMIT 50
                    ''')
                    rows = [dict(r) for r in cursor.fetchall()]
                    self.send_json({'success': True, 'leaderboard': rows})
                    return
            except Exception as e:
                self.send_json({'success': False, 'message': str(e)}, 500)
                return

        # 3. API: Qlobal Çat Mesajları
        if parsed.path == '/api/chat/messages':
            try:
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute('''
                        SELECT id, player_id, username, message, created_at
                        FROM chat_messages
                        ORDER BY id DESC
                        LIMIT 50
                    ''')
                    rows = [dict(r) for r in cursor.fetchall()]
                    rows.reverse()
                    self.send_json({'success': True, 'messages': rows})
                    return
            except Exception as e:
                self.send_json({'success': False, 'message': str(e)}, 500)
                return

        # 4. API: Oyunçuların Siyahısı (Admin Generator GUI üçün)
        if parsed.path == '/api/players/list':
            try:
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute('''
                        SELECT player_id, username, diamonds, red_diamonds, gold, best_floor, last_login, created_at
                        FROM players
                        ORDER BY last_login DESC
                    ''')
                    rows = [dict(r) for r in cursor.fetchall()]
                    self.send_json({'success': True, 'players': rows})
                    return
            except Exception as e:
                self.send_json({'success': False, 'message': str(e)}, 500)
                return

        # 5. API: Oyunçunun İnbox / Məktub Qutusu
        if parsed.path == '/api/inbox':
            from urllib.parse import parse_qs
            qs = parse_qs(parsed.query)
            player_id = (qs.get('playerId', [''])[0]).strip()
            if not player_id:
                self.send_json({'success': False, 'message': 'Player ID tələb olunur!'}, 400)
                return
            try:
                with get_db() as conn:
                    cursor = conn.cursor()
                    # Həm bu oyunçuya aid olan, həm də 'ALL' olan məktublar
                    cursor.execute('''
                        SELECT m.*, 
                               CASE 
                                   WHEN m.is_claimed = 1 THEN 1
                                   WHEN c.id IS NOT NULL THEN 1 
                                   ELSE 0 
                               END as is_claimed,
                               COALESCE(c.claimed_at, m.claimed_at) as claimed_at
                        FROM inbox_messages m
                        LEFT JOIN claimed_messages c ON m.id = c.message_id AND c.player_id = ?
                        WHERE m.target_type = 'ALL' OR m.player_id = ?
                        ORDER BY m.id DESC
                        LIMIT 50
                    ''', (player_id, player_id))
                    rows = [dict(r) for r in cursor.fetchall()]
                    self.send_json({'success': True, 'messages': rows})
                    return
            except Exception as e:
                self.send_json({'success': False, 'message': str(e)}, 500)
                return

        # 3. API: Tək Oyunçu Profili (Ən son almaz və tərəqqi)
        if parsed.path == '/api/player/profile':
            from urllib.parse import parse_qs
            qs = parse_qs(parsed.query)
            player_id = (qs.get('playerId', [''])[0]).strip()
            if not player_id:
                self.send_json({'success': False, 'message': 'Player ID tələb olunur!'}, 200)
                return
            try:
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute('SELECT player_id, username, diamonds, red_diamonds, gold, best_floor, perm_upgrades, claimed_chests FROM players WHERE player_id = ?', (player_id,))
                    row = cursor.fetchone()
                    if row:
                        self.send_json({
                            'success': True,
                            'player': {
                                'playerId': row['player_id'],
                                'username': row['username'],
                                'diamonds': row['diamonds'] or 0,
                                'redDiamonds': row['red_diamonds'] or 0,
                                'gold': row['gold'] or 0,
                                'bestFloor': row['best_floor'] or 1,
                                'permUpgrades': json.loads(row['perm_upgrades'] or '{}'),
                                'claimedChests': json.loads(row['claimed_chests'] or '[]')
                            }
                        })
                    else:
                        self.send_json({'success': False, 'message': 'Oyunçu tapılmadı!'}, 200)
                    return
            except Exception as e:
                self.send_json({'success': False, 'message': str(e)}, 200)
                return

        # Favicon 404 xətasını aradan qaldırmaq
        if parsed.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return

        # Statik fayllar
        try:
            return super().do_GET()
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def do_POST(self):
        parsed = urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'

        try:
            data = json.loads(post_data)
        except Exception:
            data = {}

        # 1. API: Oyunçu Qeydiyyatı (Register)
        if parsed.path == '/api/auth/register':
            username = (data.get('username') or '').strip()
            pin = str(data.get('pin') or '').strip()

            if len(username) < 2 or len(username) > 20:
                self.send_json({'success': False, 'message': 'Oyunçu adı 2-20 simvol arasında olmalıdır!'}, 400)
                return

            if len(pin) < 3 or len(pin) > 12:
                self.send_json({'success': False, 'message': 'PIN şifrə 3-12 rəqəm/simvol olmalıdır!'}, 400)
                return

            try:
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute('SELECT 1 FROM players WHERE LOWER(username) = LOWER(?)', (username,))
                    if cursor.fetchone():
                        self.send_json({'success': False, 'message': 'Bu oyunçu adı artıq istifadə olunur! Başqa ad seçin.'}, 400)
                        return

                    player_id = generate_player_id()
                    pin_h = hash_pin(pin)

                    # İlkin başlanğıc parametrləri
                    init_gold = max(75, float(data.get('gold', 75)))
                    init_diamonds = max(0, int(data.get('diamonds', 0)))
                    init_red = max(0, int(data.get('redDiamonds', 0)))
                    init_floor = max(1, int(data.get('bestFloor', 1)))
                    init_upgrades = json.dumps(data.get('permUpgrades', {}))
                    init_chests = json.dumps(data.get('claimedChests', []))

                    cursor.execute('''
                        INSERT INTO players (player_id, username, pin_hash, gold, diamonds, red_diamonds, best_floor, perm_upgrades, claimed_chests)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (player_id, username, pin_h, init_gold, init_diamonds, init_red, init_floor, init_upgrades, init_chests))
                    conn.commit()

                    self.send_json({
                        'success': True,
                        'message': 'Qeydiyyat uğurla tamamlandı!',
                        'player': {
                            'playerId': player_id,
                            'username': username,
                            'gold': init_gold,
                            'diamonds': init_diamonds,
                            'redDiamonds': init_red,
                            'bestFloor': init_floor,
                            'permUpgrades': json.loads(init_upgrades),
                            'claimedChests': json.loads(init_chests)
                        }
                    })
                    return
            except Exception as e:
                self.send_json({'success': False, 'message': f'Qeydiyyat xətası: {str(e)}'}, 500)
                return

        # 2. API: Oyunçu Girişi (Login)
        if parsed.path == '/api/auth/login':
            login_key = (data.get('login') or '').strip()
            pin = str(data.get('pin') or '').strip()

            if not login_key or not pin:
                self.send_json({'success': False, 'message': 'İstifadəçi adı/ID və PIN daxil edilməlidir!'}, 400)
                return

            try:
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute('''
                        SELECT * FROM players 
                        WHERE LOWER(username) = LOWER(?) OR player_id = ?
                    ''', (login_key, login_key))
                    row = cursor.fetchone()

                    if not row:
                        self.send_json({'success': False, 'message': 'Bu adda və ya ID-də oyunçu tapılmadı!'}, 404)
                        return

                    if row['pin_hash'] != hash_pin(pin):
                        self.send_json({'success': False, 'message': 'PIN şifrə yanlışdır!'}, 401)
                        return

                    cursor.execute('UPDATE players SET last_login = CURRENT_TIMESTAMP WHERE player_id = ?', (row['player_id'],))
                    conn.commit()

                    upgrades = json.loads(row['perm_upgrades'] or '{}')
                    chests = json.loads(row['claimed_chests'] or '[]')

                    self.send_json({
                        'success': True,
                        'message': f'Xoş gəldin, {row["username"]}!',
                        'player': {
                            'playerId': row['player_id'],
                            'username': row['username'],
                            'gold': row['gold'],
                            'diamonds': row['diamonds'],
                            'redDiamonds': row['red_diamonds'],
                            'bestFloor': row['best_floor'],
                            'totalScore': row['total_score'],
                            'permUpgrades': upgrades,
                            'claimedChests': chests
                        }
                    })
                    return
            except Exception as e:
                self.send_json({'success': False, 'message': f'Giriş xətası: {str(e)}'}, 500)
                return

        # 3. API: Oyunçu Tərəqqisinin Sinxronizasiyası (Sync) - ALMAZLARIN QORUNMASI
        if parsed.path == '/api/player/sync':
            player_id = (data.get('playerId') or '').strip()
            if not player_id:
                self.send_json({'success': False, 'message': 'Oyunçu ID tələb olunur!'}, 200)
                return

            try:
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute('SELECT diamonds, red_diamonds, gold, best_floor, total_score FROM players WHERE player_id = ?', (player_id,))
                    existing = cursor.fetchone()
                    if not existing:
                        self.send_json({'success': False, 'message': 'Oyunçu tapılmadı!'}, 200)
                        return

                    gold = float(data.get('gold', 0))
                    client_diamonds = int(data.get('diamonds', 0))
                    client_red = int(data.get('redDiamonds', 0))
                    best_floor = int(data.get('bestFloor', 1))
                    total_score = int(data.get('totalScore', 0))
                    upgrades_json = json.dumps(data.get('permUpgrades', {}))
                    chests_json = json.dumps(data.get('claimedChests', []))

                    # Oyunçunun oyunda qazandığı və ya xərclədiyi cari almaz balansı dəqiq qeyd olunur
                    final_diamonds = max(0, client_diamonds)
                    final_red = max(0, client_red)
                    final_floor = max(existing['best_floor'] or 1, best_floor)
                    final_score = max(existing['total_score'] or 0, total_score)

                    cursor.execute('''
                        UPDATE players 
                        SET gold = ?, diamonds = ?, red_diamonds = ?, best_floor = ?,
                            total_score = ?, perm_upgrades = ?, claimed_chests = ?,
                            last_login = CURRENT_TIMESTAMP
                        WHERE player_id = ?
                    ''', (gold, final_diamonds, final_red, final_floor, final_score, upgrades_json, chests_json, player_id))
                    conn.commit()

                    self.send_json({
                        'success': True,
                        'message': 'Məlumatlar mərkəzi bazada saxlanıldı!',
                        'diamonds': final_diamonds,
                        'redDiamonds': final_red,
                        'bestFloor': final_floor
                    })
                    return
            except Exception as e:
                self.send_json({'success': False, 'message': f'Sinxronizasiya xətası: {str(e)}'}, 200)
                return

        # 4. API: Çata Mesaj Göndərmək
        if parsed.path == '/api/chat/send':
            player_id = (data.get('playerId') or 'Qonaq').strip()
            username = (data.get('username') or 'Oyunçu').strip()
            msg = (data.get('message') or '').strip()

            if not msg:
                self.send_json({'success': False, 'message': 'Mesaj boş ola bilməz!'}, 400)
                return

            if len(msg) > 200:
                msg = msg[:200]

            try:
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute('''
                        INSERT INTO chat_messages (player_id, username, message)
                        VALUES (?, ?, ?)
                    ''', (player_id, username, msg))
                    conn.commit()

                    self.send_json({'success': True, 'message': 'Mesaj göndərildi!'})
                    return
            except Exception as e:
                self.send_json({'success': False, 'message': str(e)}, 500)
                return

        # 5. API: Hədiyyə Kodu Generasiyası (Köhnə Standart)
        if parsed.path == '/api/giftcode/generate':
            blue = max(0, int(data.get('blueDiamonds', 0) or 0))
            red = max(0, int(data.get('redDiamonds', 0) or 0))
            custom = (data.get('customCode') or '').strip().upper()

            if blue == 0 and red == 0:
                self.send_json({'success': False, 'message': 'Almaz sayı 0-dan böyük olmalıdır!'}, 400)
                return

            codes = read_codes()
            code_str = custom if custom else generate_random_code()
            if any(c.get('code') == code_str for c in codes):
                code_str = generate_random_code()

            new_entry = {
                'code': code_str,
                'blueDiamonds': blue,
                'redDiamonds': red,
                'used': False,
                'createdAt': datetime.now(timezone.utc).isoformat()
            }
            codes.append(new_entry)
            save_codes(codes)

            self.send_json({'success': True, 'code': new_entry})
            return

        # 6. API: Admin Hədiyyə Kodu Yaratmaq və Məktub Göndərmək
        if parsed.path == '/api/admin/send_gift':
            target_type = (data.get('targetType') or 'ALL').strip().upper()
            player_id = (data.get('playerId') or 'ALL').strip()
            blue = int(data.get('blueDiamonds') or 0)
            red = int(data.get('redDiamonds') or 0)
            title = (data.get('title') or '🎁 Xüsusi Admin Hədiyyəsi!').strip()
            note = (data.get('note') or '').strip()
            expires_at = data.get('expiresAt') # ISO string və ya None
            
            if blue <= 0 and red <= 0:
                self.send_json({'success': False, 'message': 'Ən azı 1 almaz daxil edilməlidir!'}, 400)
                return
            
            if target_type == 'SINGLE' and (not player_id or player_id == 'ALL'):
                self.send_json({'success': False, 'message': 'Fərdi oyunçu üçün Player ID seçilməlidir!'}, 400)
                return

            # Kriptoqrafik kod yaradırıq
            if create_signed_gift_code:
                token, _ = create_signed_gift_code(blue, red)
            else:
                token = generate_random_code()

            try:
                with get_db() as conn:
                    cursor = conn.cursor()
                    target_name = 'Bütün Oyunçular'
                    if target_type == 'SINGLE':
                        cursor.execute('SELECT username FROM players WHERE player_id = ?', (player_id,))
                        p_row = cursor.fetchone()
                        if not p_row:
                            self.send_json({'success': False, 'message': f'ID {player_id} olan oyunçu tapılmadı!'}, 404)
                            return
                        target_name = p_row['username']

                    # 1. Advanced kod bazasına yazırıq
                    cursor.execute('''
                        INSERT INTO gift_codes_advanced (code, target_type, target_player_id, blue_diamonds, red_diamonds, expires_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (token, target_type, player_id, blue, red, expires_at))

                    # 2. Məktub bazasına yazırıq
                    cursor.execute('''
                        INSERT INTO inbox_messages (target_type, player_id, title, note, gift_code, blue_diamonds, red_diamonds, expires_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (target_type, player_id, title, note, token, blue, red, expires_at))
                    new_msg_id = cursor.lastrowid

                    conn.commit()

                    # ⚡ Real-Time WebSocket ilə dərhal canlı bildiriş yayırıq
                    broadcast_inbox_message(target_type, player_id, {
                        'id': new_msg_id,
                        'title': title,
                        'note': note,
                        'gift_code': token,
                        'blue_diamonds': blue,
                        'red_diamonds': red,
                        'expires_at': expires_at,
                        'created_at': datetime.now(timezone.utc).isoformat(),
                        'is_claimed': 0
                    })

                    self.send_json({
                        'success': True,
                        'message': f'Hədiyyə kodu yaradıldı və {"hamıya" if target_type == "ALL" else target_name + "-a"} məktub göndərildi!',
                        'code': token,
                        'target': target_name,
                        'blueDiamonds': blue,
                        'redDiamonds': red
                    })
                    return
            except Exception as e:
                self.send_json({'success': False, 'message': str(e)}, 500)
                return

        # 7. API: Generator və ya Xarici Skriptdən Real-Time WebSocket Bildirişi
        if parsed.path == '/api/inbox/notify':
            target_type = (data.get('targetType') or 'ALL').strip().upper()
            player_id = (data.get('playerId') or 'ALL').strip()
            msg_data = data.get('message') or {}
            broadcast_inbox_message(target_type, player_id, msg_data)
            self.send_json({'success': True, 'message': 'WebSocket bildirişi yayımlandı!'})
            return

        # 8. API: Məktubdakı Hədiyyəni Qəbul Etmək (Claim & Verify)
        if parsed.path == '/api/inbox/claim':
            player_id = (data.get('playerId') or '').strip()
            message_id = int(data.get('messageId') or 0)

            if not player_id or not message_id:
                self.send_json({'success': False, 'message': 'Məlumatlar natamamdır! (Player ID və Message ID tələb olunur)'}, 200)
                return

            try:
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute('SELECT * FROM inbox_messages WHERE id = ?', (message_id,))
                    msg = cursor.fetchone()
                    if not msg:
                        self.send_json({'success': False, 'message': 'Hədiyyə tapılmadı və ya bazadan silinib!'}, 200)
                        return

                    # 1. HƏDƏF OYUNÇU YOXLANIŞI (Kim üçündür?)
                    target_type = msg['target_type'] or 'ALL'
                    target_player = str(msg['player_id'] or 'ALL').strip()
                    if target_type == 'SINGLE' and target_player != player_id:
                        self.send_json({
                            'success': False, 
                            'message': f'Bu hədiyyə başqa oyunçuya (# {target_player}) məxsusdur! Sizin ID: #{player_id}'
                        }, 200)
                        return

                    # 2. VAXT YOXLANIŞI (Təsdiq etməyə uyğundurmu?)
                    if msg['expires_at']:
                        try:
                            clean_exp = msg['expires_at'].replace('Z', '+00:00')
                            exp_dt = datetime.fromisoformat(clean_exp)
                            if datetime.now(timezone.utc) > exp_dt:
                                self.send_json({
                                    'success': False, 
                                    'isExpired': True,
                                    'message': 'Bu hədiyyənin istifadə müddəti bitib! İkinci dəfə və ya vaxtı keçdikdən sonra qəbul edilə bilməz.'
                                }, 200)
                                return
                        except Exception as ex:
                            print(f"Vaxt yoxlanışı xətası: {ex}")

                    # 3. İSTİFADƏ EDİLİBMİ YOXLANIŞI (Artıq təsdiqlidirmi?)
                    # A) Məktubun özü artıq təsdiqlənibmi?
                    if msg['is_claimed'] == 1:
                        self.send_json({
                            'success': False, 
                            'alreadyClaimed': True, 
                            'message': 'Bu hədiyyə artıq təsdiqlənib və istifadə edilib! Bir kod yalnız BİR DƏFƏ istifadə edilə bilər.'
                        }, 200)
                        return

                    # B) Bu oyunçu üçün claimed_messages cədvəlində varmı?
                    cursor.execute('SELECT id FROM claimed_messages WHERE message_id = ? AND player_id = ?', (message_id, player_id))
                    if cursor.fetchone():
                        self.send_json({
                            'success': False, 
                            'alreadyClaimed': True, 
                            'message': 'Bu hədiyyə artıq sizin tərəfinizdən qəbul edilib! İkinci dəfə istifadə edilə bilməz.'
                        }, 200)
                        return

                    # 4. HƏR ŞEY UYĞUNDURSA: BAZADA TƏSDİQLƏYİRİK VƏ BALANSI ARTIRIRIQ
                    blue = int(msg['blue_diamonds'] or 0)
                    red = int(msg['red_diamonds'] or 0)
                    gift_code = msg['gift_code'] or ''

                    # A) inbox_messages cədvəlində təsdiqləndi olaraq qeyd edirik
                    cursor.execute('''
                        UPDATE inbox_messages 
                        SET is_claimed = 1, claimed_by = ?, claimed_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    ''', (player_id, message_id))

                    # B) claimed_messages cədvəlinə unikal qeyd atırıq
                    cursor.execute('''
                        INSERT OR IGNORE INTO claimed_messages (message_id, player_id)
                        VALUES (?, ?)
                    ''', (message_id, player_id))

                    # C) Əgər bu kod advanced cədvəlində varsa, deaktiv edirik
                    if gift_code:
                        cursor.execute('UPDATE gift_codes_advanced SET is_active = 0 WHERE code = ?', (gift_code,))
                        # D) used_tokens.json-a da birdəfəlik qeyd atırıq
                        try:
                            used_tokens = read_used_tokens()
                            used_tokens[gift_code] = {
                                'playerId': player_id,
                                'claimedAt': datetime.now(timezone.utc).isoformat()
                            }
                            save_used_tokens(used_tokens)
                        except Exception:
                            pass

                    # E) Oyunçunun rəsmi bazadakı balansını artırırıq
                    cursor.execute('''
                        UPDATE players 
                        SET diamonds = diamonds + ?, red_diamonds = red_diamonds + ?
                        WHERE player_id = ?
                    ''', (blue, red, player_id))

                    cursor.execute('SELECT diamonds, red_diamonds FROM players WHERE player_id = ?', (player_id,))
                    p_res = cursor.fetchone()

                    conn.commit()

                    self.send_json({
                        'success': True,
                        'message': f'🎉 Hədiyyə kodu uğurla təsdiqləndi və qəbul edildi! (+{blue} [cyan], +{red} [ruby])',
                        'blueAdded': blue,
                        'redAdded': red,
                        'newDiamonds': p_res['diamonds'] if p_res else blue,
                        'newRedDiamonds': p_res['red_diamonds'] if p_res else red
                    })
                    return
            except Exception as e:
                self.send_json({'success': False, 'message': f'Baza xətası: {str(e)}'}, 200)
                return

        # 8. API: Məktubu Silmək (Delete)
        if parsed.path == '/api/inbox/delete':
            message_id = int(data.get('messageId') or 0)
            if not message_id:
                self.send_json({'success': False, 'message': 'Məktub ID tələb olunur!'}, 200)
                return

            try:
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute('DELETE FROM inbox_messages WHERE id = ?', (message_id,))
                    cursor.execute('DELETE FROM claimed_messages WHERE message_id = ?', (message_id,))
                    conn.commit()

                    self.send_json({'success': True, 'message': 'Məktub uğurla silindi!'})
                    return
            except Exception as e:
                self.send_json({'success': False, 'message': str(e)}, 200)
                return

        # 8. API: Kodu istifadə etmək (Redeem)
        if parsed.path == '/api/giftcode/redeem':
            target = (data.get('code') or '').strip()
            player_id = (data.get('playerId') or '').strip()
            if not target:
                self.send_json({'success': False, 'message': 'Kod daxil edilməyib!'}, 200)
                return

            # A) Əvvəlcə Advanced Gift Codes və ya İnbox Məktubları bazasında yoxlayırıq
            try:
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute('SELECT * FROM gift_codes_advanced WHERE code = ?', (target,))
                    adv_code = cursor.fetchone()

                    # Əgər advanced bazada tapılmasa, inbox_messages cədvəlində yoxlayırıq
                    inbox_code_match = None
                    if not adv_code:
                        cursor.execute('SELECT * FROM inbox_messages WHERE gift_code = ?', (target,))
                        inbox_code_match = cursor.fetchone()

                    code_source = adv_code or inbox_code_match

                    if code_source:
                        target_type = code_source['target_type'] or 'ALL'
                        target_player = str(code_source.get('target_player_id') or code_source.get('player_id') or 'ALL').strip()
                        
                        # Vaxt yoxlanışı
                        if code_source['expires_at']:
                            try:
                                clean_exp = code_source['expires_at'].replace('Z', '+00:00')
                                exp_dt = datetime.fromisoformat(clean_exp)
                                if datetime.now(timezone.utc) > exp_dt:
                                    self.send_json({'success': False, 'message': 'Bu kodun istifadə müddəti bitib!'}, 200)
                                    return
                            except Exception:
                                pass

                        # Hədəf oyunçu yoxlanışı
                        if target_type == 'SINGLE':
                            if target_player != player_id:
                                self.send_json({'success': False, 'message': f'Bu hədiyyə kodu başqa oyunçu üçün (#{target_player}) nəzərdə tutulub! Sizin ID: #{player_id}'}, 200)
                                return

                            # Artıq istifadə edilibmi?
                            is_claimed_state = code_source.get('is_claimed', 0) if inbox_code_match else (1 if code_source.get('is_active', 1) == 0 else 0)
                            if is_claimed_state == 1:
                                self.send_json({'success': False, 'message': 'Bu fərdi hədiyyə kodu artıq istifadə edilib və qəbul olunub!'}, 200)
                                return

                            # Fərdi kodu hər yerdə deaktiv edirik
                            cursor.execute('UPDATE gift_codes_advanced SET is_active = 0 WHERE code = ?', (target,))
                            if inbox_code_match:
                                cursor.execute('UPDATE inbox_messages SET is_claimed = 1, claimed_by = ?, claimed_at = CURRENT_TIMESTAMP WHERE id = ?', (player_id, inbox_code_match['id']))
                                cursor.execute('INSERT OR IGNORE INTO claimed_messages (message_id, player_id) VALUES (?, ?)', (inbox_code_match['id'], player_id))
                        else:
                            # ALL tipli kod: bu oyunçu daha əvvəl istifadə edibmi?
                            if inbox_code_match:
                                cursor.execute('SELECT id FROM claimed_messages WHERE message_id = ? AND player_id = ?', (inbox_code_match['id'], player_id))
                                if cursor.fetchone():
                                    self.send_json({'success': False, 'message': 'Bu ümumi hədiyyə kodunu artıq istifadə etmisiniz!'}, 200)
                                    return
                                cursor.execute('INSERT OR IGNORE INTO claimed_messages (message_id, player_id) VALUES (?, ?)', (inbox_code_match['id'], player_id))

                            used_dict = read_used_tokens()
                            key = f"{target}_{player_id}"
                            if key in used_dict:
                                self.send_json({'success': False, 'message': 'Bu ümumi hədiyyə kodunu artıq istifadə etmisiniz!'}, 200)
                                return
                            used_dict[key] = {'usedAt': datetime.now(timezone.utc).isoformat()}
                            save_used_tokens(used_dict)

                        # Oyunçunun balansını artırırıq
                        blue = code_source['blue_diamonds'] or 0
                        red = code_source['red_diamonds'] or 0
                        if player_id:
                            cursor.execute('''
                                UPDATE players SET diamonds = diamonds + ?, red_diamonds = red_diamonds + ?
                                WHERE player_id = ?
                            ''', (blue, red, player_id))
                        conn.commit()

                        self.send_json({
                            'success': True,
                            'message': f'🎉 Hədiyyə kodu uğurla aktivləşdirildi! (+{blue} [cyan], +{red} [ruby])',
                            'blueDiamonds': blue,
                            'redDiamonds': red
                        })
                        return
            except Exception as e:
                print(f"Advanced kod yoxlanışında xəta: {e}")

            # B) Kriptoqrafik İmzalı Kod Yoxlanışı (Fallback HMAC-SHA256 Token)
            if verify_signed_gift_code:
                is_signed, res_payload = verify_signed_gift_code(target)
                if is_signed and isinstance(res_payload, dict):
                    nonce = res_payload.get('n')
                    used_tokens = read_used_tokens()
                    if nonce in used_tokens:
                        self.send_json({'success': False, 'message': 'Bu hədiyyə kodu artıq istifadə edilib!'}, 200)
                        return

                    used_tokens[nonce] = {
                        'blue': res_payload.get('b', 0),
                        'red': res_payload.get('r', 0),
                        'usedAt': datetime.now(timezone.utc).isoformat()
                    }
                    save_used_tokens(used_tokens)

                    blue = res_payload.get('b', 0)
                    red = res_payload.get('r', 0)
                    if player_id:
                        try:
                            with get_db() as conn:
                                cursor = conn.cursor()
                                cursor.execute('''
                                    UPDATE players SET diamonds = diamonds + ?, red_diamonds = red_diamonds + ?
                                    WHERE player_id = ?
                                ''', (blue, red, player_id))
                                conn.commit()
                        except Exception:
                            pass

                    self.send_json({
                        'success': True,
                        'message': 'Hədiyyə kodu uğurla aktivləşdirildi!',
                        'blueDiamonds': blue,
                        'redDiamonds': red
                    })
                    return
                elif target.startswith('GIFT-') and len(target.split('-')) == 3:
                    self.send_json({'success': False, 'message': 'Təhlükəsizlik xətası: Saxta və ya dəyişdirilmiş kod!'}, 200)
                    return

            # C) Standart baza kodları (Fallback JSON)
            codes = read_codes()
            found = next((c for c in codes if c.get('code') == target), None)

            if not found:
                self.send_json({'success': False, 'message': 'Bu kod mövcud deyil!'}, 200)
                return

            if found.get('used'):
                self.send_json({'success': False, 'message': 'Bu kod artıq istifadə edilib!'}, 200)
                return

            found['used'] = True
            found['usedAt'] = datetime.now(timezone.utc).isoformat()
            save_codes(codes)

            blue = found.get('blueDiamonds', 0)
            red = found.get('redDiamonds', 0)
            if player_id:
                try:
                    with get_db() as conn:
                        cursor = conn.cursor()
                        cursor.execute('''
                            UPDATE players SET diamonds = diamonds + ?, red_diamonds = red_diamonds + ?
                            WHERE player_id = ?
                        ''', (blue, red, player_id))
                        conn.commit()
                except Exception:
                    pass

            self.send_json({
                'success': True,
                'message': 'Kod uğurla aktivləşdirildi!',
                'blueDiamonds': blue,
                'redDiamonds': red
            })
            return

        self.send_response(404)
        self.end_headers()

    def log_message(self, format, *args):
        # Konsolu təmiz saxlamaq üçün standart log
        sys.stdout.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format % args))

def run_server():
    httpd = http.server.ThreadingHTTPServer(("", PORT), GameHTTPRequestHandler)
    print("======================================================")
    print("  Floor Escape Python Serveri Aktivdir!")
    print(f"  Unvan: http://localhost:{PORT}")
    print(f"  Qovluq: {PUBLIC_DIR}")
    print("======================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer dayandirildi.")
    finally:
        httpd.server_close()

if __name__ == '__main__':
    run_server()
