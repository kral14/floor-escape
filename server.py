import http.server
import socketserver
import json
import os
import random
import string
import sys
import sqlite3
import hashlib
from datetime import datetime, timezone
from urllib.parse import urlparse

try:
    from generator import verify_signed_gift_code
except Exception:
    verify_signed_gift_code = None

# Windows konsol kodlaşdırma xətasının qarşısını almaq
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 4000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
DATA_DIR = os.path.join(BASE_DIR, 'data')
DB_FILE = os.path.join(DATA_DIR, 'floor_escape.db')
CODES_FILE = os.path.join(DATA_DIR, 'gift_codes.json')
USED_TOKENS_FILE = os.path.join(DATA_DIR, 'used_tokens.json')

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
            conn.commit()
            print("  SQLite Baza: data/floor_escape.db hazirdir.")
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

        # 3. API: Oyunçu Tərəqqisinin Sinxronizasiyası (Sync)
        if parsed.path == '/api/player/sync':
            player_id = (data.get('playerId') or '').strip()
            if not player_id:
                self.send_json({'success': False, 'message': 'Oyunçu ID tələb olunur!'}, 400)
                return

            try:
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute('SELECT 1 FROM players WHERE player_id = ?', (player_id,))
                    if not cursor.fetchone():
                        self.send_json({'success': False, 'message': 'Oyunçu tapılmadı!'}, 404)
                        return

                    gold = float(data.get('gold', 0))
                    diamonds = int(data.get('diamonds', 0))
                    red = int(data.get('redDiamonds', 0))
                    best_floor = int(data.get('bestFloor', 1))
                    total_score = int(data.get('totalScore', 0))
                    upgrades_json = json.dumps(data.get('permUpgrades', {}))
                    chests_json = json.dumps(data.get('claimedChests', []))

                    cursor.execute('''
                        UPDATE players 
                        SET gold = ?, diamonds = ?, red_diamonds = ?, best_floor = MAX(best_floor, ?),
                            total_score = MAX(total_score, ?), perm_upgrades = ?, claimed_chests = ?,
                            last_login = CURRENT_TIMESTAMP
                        WHERE player_id = ?
                    ''', (gold, diamonds, red, best_floor, total_score, upgrades_json, chests_json, player_id))
                    conn.commit()

                    self.send_json({'success': True, 'message': 'Məlumatlar mərkəzi bazada saxlanıldı!'})
                    return
            except Exception as e:
                self.send_json({'success': False, 'message': f'Sinxronizasiya xətası: {str(e)}'}, 500)
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

        # 5. API: Hədiyyə Kodu Generasiyası (Admin)
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

        # 6. API: Kodu istifadə etmək (Redeem)
        if parsed.path == '/api/giftcode/redeem':
            target = (data.get('code') or '').strip()
            if not target:
                self.send_json({'success': False, 'message': 'Kod daxil edilməyib!'}, 400)
                return

            # Kriptoqrafik İmzalı Kod Yoxlanışı (HMAC-SHA256 Token)
            if verify_signed_gift_code:
                is_signed, res_payload = verify_signed_gift_code(target)
                if is_signed and isinstance(res_payload, dict):
                    nonce = res_payload.get('n')
                    used_tokens = read_used_tokens()
                    if nonce in used_tokens:
                        self.send_json({'success': False, 'message': 'Bu hədiyyə kodu artıq istifadə edilib!'}, 400)
                        return

                    used_tokens[nonce] = {
                        'blue': res_payload.get('b', 0),
                        'red': res_payload.get('r', 0),
                        'usedAt': datetime.now(timezone.utc).isoformat()
                    }
                    save_used_tokens(used_tokens)

                    self.send_json({
                        'success': True,
                        'message': 'Hədiyyə kodu uğurla aktivləşdirildi!',
                        'blueDiamonds': res_payload.get('b', 0),
                        'redDiamonds': res_payload.get('r', 0)
                    })
                    return
                elif target.startswith('GIFT-') and len(target.split('-')) == 3:
                    self.send_json({'success': False, 'message': 'Təhlükəsizlik xətası: Saxta və ya dəyişdirilmiş kod!'}, 400)
                    return

            # Standart baza kodları (Fallback)
            codes = read_codes()
            found = next((c for c in codes if c.get('code') == target), None)

            if not found:
                self.send_json({'success': False, 'message': 'Bu kod mövcud deyil!'}, 404)
                return

            if found.get('used'):
                self.send_json({'success': False, 'message': 'Bu kod artıq istifadə edilib!'}, 400)
                return

            found['used'] = True
            found['usedAt'] = datetime.now(timezone.utc).isoformat()
            save_codes(codes)

            self.send_json({
                'success': True,
                'message': 'Kod uğurla aktivləşdirildi!',
                'blueDiamonds': found.get('blueDiamonds', 0),
                'redDiamonds': found.get('redDiamonds', 0)
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
