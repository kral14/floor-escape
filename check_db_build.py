import os
import sys

# Windows konsolunda UTF-8 dəstəyi
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

print("\n" + "=" * 72)
print(" [BUILD MƏRHƏLƏSİ] POSTGRESQL VERİLƏNLƏR BAZASINA ƏLAQƏ YOXLANIŞI...")
print("=" * 72)

# .env faylını oxumaq (əgər lokal və ya serverdə mövcuddursa)
env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(env_file):
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip())
    except Exception:
        pass

db_url = os.environ.get('DATABASE_URL', '').strip()

if not db_url:
    print("\n" + "!" * 72)
    print(" [BUILD UĞURSUZ OLDU / BUILD FAILED]")
    print(" [KRİTİK XƏTA] 'DATABASE_URL' MÜHİT DƏYİŞƏNİ (ENV) TƏYİN EDİLMƏYİB!")
    print(" Layihə yalnız mərkəzi PostgreSQL bazası ilə işləyir.")
    print(" Mühit dəyişəni olmadan layihənin BUILD EDİLMƏSİ QADAĞANDIR.")
    print(" Lokal yaddaşdan (SQLite) istifadə tam ləğv olunub.")
    print(" Zəhmət olmasa build/deploy mühitində DATABASE_URL təyin edin.")
    print(" Nümunə: DATABASE_URL=postgresql://user:pass@host:5432/dbname")
    print("!" * 72 + "\n")
    sys.exit(1)

try:
    import psycopg2
    print(" [*] PostgreSQL bazasına qoşulma yoxlanılır...")
    conn = psycopg2.connect(db_url, connect_timeout=8)
    with conn.cursor() as cur:
        cur.execute("SELECT 1;")
    conn.close()
    print(" [✓] PostgreSQL bazasına əlaqə uğurla təsdiqləndi! (Baza aktivdir)")
    print(" [✓] Build mərhələsi uğurla davam edir.")
    print("=" * 72 + "\n")
    sys.exit(0)
except Exception as e:
    print("\n" + "!" * 72)
    print(" [BUILD UĞURSUZ OLDU / BUILD FAILED]")
    print(f" [KRİTİK XƏTA] PostgreSQL bazasına qoşulmaq mümkün olmadı: {e}")
    print(" Baza ilə əlaqə olmadan build davam edə bilməz. Proses dayandırılır.")
    print("!" * 72 + "\n")
    sys.exit(1)
