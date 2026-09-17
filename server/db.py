import os
import sys
import json
import random
import hashlib

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
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

DEFAULT_PG_URL = 'postgresql://user_floorgame:nvMrKdvM8nkqGGogWVM1oM8i@84.8.148.216:5432/db_floorgame'
DATABASE_URL = os.environ.get('DATABASE_URL', '').strip()

if not DATABASE_URL:
    print("\n" + "!" * 72)
    print(" [DEPLOY UĞURSUZ OLDU / STARTUP ABORTED]")
    print(" [KRİTİK XƏTA] 'DATABASE_URL' MÜHİT DƏYİŞƏNİ (ENV) TƏYİN EDİLMƏYİB!")
    print(" Layihə yalnız mərkəzi PostgreSQL verilənlər bazası ilə işləyir.")
    print(" Lokal yaddaş (SQLite) ləğv edilmişdir və istifadəsi qadağandır.")
    print(" Bu səbəbdən server işə düşməyəcək və DEPLOY UĞURSUZ OLARAQ DAYANDIRILIR.")
    print(" Zəhmət olmasa mühit dəyişənini (DATABASE_URL) serverə daxil edin.")
    print(" Nümunə: export DATABASE_URL=postgresql://user:pass@host:5432/dbname")
    print("!" * 72 + "\n")
    sys.exit(1)

USE_POSTGRES = True
_POSTGRES_ACTIVE = True

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
    pass

def get_db():
    try:
        import psycopg2
        conn = psycopg2.connect(DATABASE_URL)
        return PostgresConnWrapper(conn)
    except Exception as e:
        print("\n" + "=" * 70)
        print(f" [KRİTİK XƏTA] PostgreSQL bazasına qoşulmaq mümkün olmadı: {e}")
        print(" Lokal yaddaşa keçid qadağandır! Server dayandırılır.")
        print("=" * 70 + "\n")
        sys.exit(1)

def init_postgres():
    """PostgreSQL cədvəllərinin olub-olmadığını yoxlayır və avtomatik miqrasiya edir"""
    try:
        import psycopg2
    except ImportError:
        print(" [*] psycopg2 modulu tapılmadı, quraşdırılır...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
        import psycopg2

    print(" [*] PostgreSQL bazası yoxlanılır və miqrasiya icra edilir...")
    try:
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
    except Exception as e:
        print("\n" + "=" * 70)
        print(f" [KRİTİK XƏTA] PostgreSQL miqrasiyası zamanı xəta: {e}")
        print(" Server dayandırılır.")
        print("=" * 70 + "\n")
        sys.exit(1)

def init_db():
    init_postgres()

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
