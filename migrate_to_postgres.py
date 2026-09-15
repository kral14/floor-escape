#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Floor Escape - SQLite -> PostgreSQL Avtomatik Miqrasiya Skripti
İstifadə qaydası:
    python migrate_to_postgres.py "postgresql://user:password@host:5432/dbname"
və ya mühit dəyişəni ilə:
    DATABASE_URL="postgresql://user:password@host:5432/dbname" python migrate_to_postgres.py
"""

import os
import sys
import json
import sqlite3

# Windows konsol kodlaşdırma tənzimləməsi
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print(" [!] 'psycopg2' kitabxanası tapılmadı. Quraşdırılır...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
    import psycopg2
    from psycopg2.extras import execute_values

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQL_FILE = os.path.join(BASE_DIR, 'migrations', '001_init_postgres.sql')
SQLITE_DB = os.path.join(BASE_DIR, 'data', 'floor_escape.db')
ENV_FILE = os.path.join(BASE_DIR, '.env')

def load_env_file():
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip())

load_env_file()

def get_pg_connection(conn_str):
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        return conn
    except Exception as e:
        print(f"[-] PostgreSQL bazasına qoşularkən xəta: {e}")
        sys.exit(1)

def apply_schema(pg_conn):
    print(" [*] PostgreSQL sxemi tətbiq edilir...")
    if not os.path.exists(SQL_FILE):
        print(f"[-] Miqrasiya SQL faylı tapılmadı: {SQL_FILE}")
        sys.exit(1)

    with open(SQL_FILE, 'r', encoding='utf-8') as f:
        sql = f.read()

    with pg_conn.cursor() as cur:
        cur.execute(sql)
    print(" [+] Cədvəllər və indekslər uğurla yaradıldı!")

def migrate_data_from_sqlite(pg_conn):
    if not os.path.exists(SQLITE_DB):
        print(" [i] Yerli SQLite faylı (data/floor_escape.db) tapılmadı. Data köçürülməsi atlandı.")
        return

    print(" [*] SQLite faylından məlumatlar PostgreSQL-ə köçürülür...")
    sq_conn = sqlite3.connect(SQLITE_DB)
    sq_conn.row_factory = sqlite3.Row
    sq_cur = sq_conn.cursor()

    # 1. Players
    try:
        sq_cur.execute("SELECT * FROM players")
        rows = sq_cur.fetchall()
        if rows:
            with pg_conn.cursor() as pg_cur:
                for r in rows:
                    perm = r['perm_upgrades'] if r['perm_upgrades'] else '{}'
                    chests = r['claimed_chests'] if r['claimed_chests'] else '[]'
                    pg_cur.execute("""
                        INSERT INTO players (
                            player_id, username, pin_hash, gold, diamonds, red_diamonds,
                            best_floor, total_score, perm_upgrades, claimed_chests,
                            created_at, last_login
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (player_id) DO UPDATE SET
                            gold = EXCLUDED.gold,
                            diamonds = EXCLUDED.diamonds,
                            red_diamonds = EXCLUDED.red_diamonds,
                            best_floor = EXCLUDED.best_floor,
                            total_score = EXCLUDED.total_score,
                            perm_upgrades = EXCLUDED.perm_upgrades,
                            claimed_chests = EXCLUDED.claimed_chests,
                            last_login = EXCLUDED.last_login;
                    """, (
                        r['player_id'], r['username'], r['pin_hash'], r['gold'],
                        r['diamonds'], r['red_diamonds'], r['best_floor'], r['total_score'],
                        perm, chests, r['created_at'], r['last_login']
                    ))
            print(f" [+] Players: {len(rows)} qeyd köçürüldü.")
    except Exception as e:
        print(f" [-] Players köçürülərkən xəta: {e}")

    # 2. Chat messages
    try:
        sq_cur.execute("SELECT * FROM chat_messages")
        rows = sq_cur.fetchall()
        if rows:
            with pg_conn.cursor() as pg_cur:
                for r in rows:
                    pg_cur.execute("""
                        INSERT INTO chat_messages (player_id, username, message, created_at)
                        VALUES (%s, %s, %s, %s)
                    """, (r['player_id'], r['username'], r['message'], r['created_at']))
            print(f" [+] Chat messages: {len(rows)} qeyd köçürüldü.")
    except Exception as e:
        print(f" [-] Chat messages köçürülərkən xəta: {e}")

    # 3. Inbox messages
    try:
        sq_cur.execute("SELECT * FROM inbox_messages")
        rows = sq_cur.fetchall()
        if rows:
            with pg_conn.cursor() as pg_cur:
                for r in rows:
                    pg_cur.execute("""
                        INSERT INTO inbox_messages (
                            target_type, player_id, title, note, gift_code,
                            blue_diamonds, red_diamonds, created_at, expires_at,
                            is_claimed, claimed_by, claimed_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        r['target_type'], r['player_id'], r['title'], r['note'], r['gift_code'],
                        r['blue_diamonds'], r['red_diamonds'], r['created_at'], r['expires_at'],
                        r['is_claimed'], r['claimed_by'], r['claimed_at']
                    ))
            print(f" [+] Inbox messages: {len(rows)} qeyd köçürüldü.")
    except Exception as e:
        print(f" [-] Inbox messages köçürülərkən xəta: {e}")

    # 4. Claimed messages
    try:
        sq_cur.execute("SELECT * FROM claimed_messages")
        rows = sq_cur.fetchall()
        if rows:
            with pg_conn.cursor() as pg_cur:
                for r in rows:
                    pg_cur.execute("""
                        INSERT INTO claimed_messages (message_id, player_id, claimed_at)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (message_id, player_id) DO NOTHING;
                    """, (r['message_id'], r['player_id'], r['claimed_at']))
            print(f" [+] Claimed messages: {len(rows)} qeyd köçürüldü.")
    except Exception as e:
        print(f" [-] Claimed messages köçürülərkən xəta: {e}")

    # 5. Gift codes advanced
    try:
        sq_cur.execute("SELECT * FROM gift_codes_advanced")
        rows = sq_cur.fetchall()
        if rows:
            with pg_conn.cursor() as pg_cur:
                for r in rows:
                    pg_cur.execute("""
                        INSERT INTO gift_codes_advanced (
                            code, target_type, target_player_id,
                            blue_diamonds, red_diamonds, expires_at, created_at, is_active
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (code) DO NOTHING;
                    """, (
                        r['code'], r['target_type'], r['target_player_id'],
                        r['blue_diamonds'], r['red_diamonds'], r['expires_at'],
                        r['created_at'], r['is_active']
                    ))
            print(f" [+] Gift codes: {len(rows)} qeyd köçürüldü.")
    except Exception as e:
        print(f" [-] Gift codes köçürülərkən xəta: {e}")

    sq_conn.close()

def main():
    conn_str = None
    if len(sys.argv) > 1:
        conn_str = sys.argv[1]
    else:
        conn_str = os.environ.get('DATABASE_URL')

    if not conn_str:
        print("\n=======================================================")
        print(" [!] PostgreSQL connection string tələb olunur!")
        print(" İstifadə qaydası:")
        print('   python migrate_to_postgres.py "postgresql://user:pass@host:5432/dbname"')
        print(" və ya mühit dəyişəni ilə:")
        print('   set DATABASE_URL="postgresql://user:pass@host:5432/dbname"')
        print("   python migrate_to_postgres.py")
        print("=======================================================\n")
        sys.exit(1)

    print("\n=======================================================")
    print("       Floor Escape -> PostgreSQL Miqrasiyası")
    print("=======================================================")
    pg_conn = get_pg_connection(conn_str)
    apply_schema(pg_conn)
    migrate_data_from_sqlite(pg_conn)
    pg_conn.close()
    print("\n [✓] Bütün miqrasiya prosesi uğurla tamamlandı!\n")

if __name__ == '__main__':
    main()
