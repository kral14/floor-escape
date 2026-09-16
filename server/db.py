import os
import sys
import json
import random
import sqlite3
import hashlib

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DB_FILE = os.path.join(DATA_DIR, 'floor_escape.db')
CODES_FILE = os.path.join(DATA_DIR, 'gift_codes.json')
USED_TOKENS_FILE = os.path.join(DATA_DIR, 'used_tokens.json')
ENV_FILE = os.path.join(BASE_DIR, '.env')
SQL_MIGRATION_FILE = os.path.join(BASE_DIR, 'migrations', '001_init_postgres.sql')

# .env faylını avtomatik oxumaq
def load_env():
    if os.path.exists(ENV_FILE):
        try:
            with open(ENV_FILE, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        os.environ.setdefault(k.strip(), v.strip())
        except Exception:
            pass

load_env()

DATABASE_URL = os.environ.get('DATABASE_URL', '').strip()
USE_POSTGRES = DATABASE_URL.startswith('postgresql://') or DATABASE_URL.startswith('postgres://')
DB_STRICT = os.environ.get('DB_STRICT', '0').strip().lower() in ('1', 'true', 'yes')

_POSTGRES_ACTIVE = False

class PostgresCursorWrapper:
    def __init__(self, cur):
        self.cur = cur

    def execute(self, query, params=None):
        if '?' in query:
            query = query.replace('?', '%s')
        if params is not None:
            return self.cur.execute(query, params)
        return self.cur.execute(query)

    def fetchone(self):
        return self.cur.fetchone()

    def fetchall(self):
        return self.cur.fetchall()

    @property
    def rowcount(self):
        return self.cur.rowcount

class PostgresConnWrapper:
    def __init__(self, conn):
        self.conn = conn

    def cursor(self):
        import psycopg2.extras
        return PostgresCursorWrapper(self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor))

    def commit(self):
        return self.conn.commit()

    def rollback(self):
        return self.conn.rollback()

    def close(self):
        return self.conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.conn.rollback()
        else:
            self.conn.commit()
        self.conn.close()

def ensure_data_files():
    is_remote_env = os.environ.get('IS_REMOTE_SERVER', '0').lower() in ('1', 'true', 'yes')
    remote_url = os.environ.get('REMOTE_SERVER_URL', 'http://132.145.76.194:8082').rstrip('/')
    if remote_url and not is_remote_env and not USE_POSTGRES:
        # Lokal maşında uzaq server rejimi aktivdirsə, yerli data qovluğu/faylları yaradılmır
        return
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(CODES_FILE):
        with open(CODES_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)
    if not os.path.exists(USED_TOKENS_FILE):
        with open(USED_TOKENS_FILE, 'w', encoding='utf-8') as f:
            json.dump({}, f)

ensure_data_files()

def get_db():
    global _POSTGRES_ACTIVE
    if USE_POSTGRES:
        try:
            import psycopg2
            conn = psycopg2.connect(DATABASE_URL)
            _POSTGRES_ACTIVE = True
            return PostgresConnWrapper(conn)
        except Exception as e:
            if DB_STRICT:
                print(f" [✘] PostgreSQL əlaqəsi kəsildi: {e}")
                sys.exit(1)
            print(f" [!] PostgreSQL xətası, SQLite fallback: {e}")
    conn = sqlite3.connect(DB_FILE, timeout=15)
    conn.row_factory = sqlite3.Row
    return conn

def init_postgres():
    """PostgreSQL cədvəllərinin olub-olmadığını yoxlayır və avtomatik miqrasiya edir"""
    global _POSTGRES_ACTIVE
    try:
        import psycopg2
    except ImportError:
        print(" [*] psycopg2 modulu tapılmadı, quraşdırılır...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
        import psycopg2

    print(" [*] PostgreSQL bazası yoxlanılır və miqrasiya icra edilir...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    
    if os.path.exists(SQL_MIGRATION_FILE):
        with open(SQL_MIGRATION_FILE, 'r', encoding='utf-8') as f:
            sql = f.read()
        with conn.cursor() as cur:
            cur.execute(sql)
        print(" [✓] PostgreSQL cədvəlləri uğurla yoxlanıldı və yaradıldı!")
    else:
        print(f" [-] Miqrasiya faylı tapılmadı: {SQL_MIGRATION_FILE}")
    conn.close()
    _POSTGRES_ACTIVE = True

def init_db():
    global _POSTGRES_ACTIVE
    # 1. Əgər DATABASE_URL varsa, ilk öncə PostgreSQL miqrasiyasını işə sal
    if USE_POSTGRES:
        try:
            init_postgres()
            return
        except Exception as e:
            print(f" [!] PostgreSQL-ə qoşularkən xəta baş verdi: {e}")
            if DB_STRICT:
                print(" [✘] DB_STRICT=1 rejimi aktivdir! Server dayandırılır.")
                sys.exit(1)
            print(" [i] Fallback: Lokal SQLite bazasına keçid edilir...")
            _POSTGRES_ACTIVE = False

    # 2. Əks halda SQLite ilə davam et
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
