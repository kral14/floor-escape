import os
import sys
import json
import random
import sqlite3
import hashlib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DB_FILE = os.path.join(DATA_DIR, 'floor_escape.db')
CODES_FILE = os.path.join(DATA_DIR, 'gift_codes.json')
USED_TOKENS_FILE = os.path.join(DATA_DIR, 'used_tokens.json')

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
