import json
import base64
import hmac
import hashlib
import time
import secrets
import sys
import os
import sqlite3
from datetime import datetime, timezone, timedelta

# Windows konsol kodlaşdırması
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

SECRET_KEY = "FLOOR_ESCAPE_SECRET_KEY_2026_AGY_SECURE_TOKEN_SYSTEM"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DB_FILE = os.path.join(DATA_DIR, 'floor_escape.db')

def get_db():
    conn = sqlite3.connect(DB_FILE, timeout=15)
    conn.row_factory = sqlite3.Row
    return conn

def create_signed_gift_code(blue_diamonds, red_diamonds):
    nonce = secrets.token_hex(4).upper() # 8 simvol
    payload = {
        "b": int(blue_diamonds),
        "r": int(red_diamonds),
        "n": nonce,
        "t": int(time.time())
    }
    
    json_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    payload_b64 = base64.urlsafe_b64encode(json_bytes).decode('utf-8').rstrip('=')
    sig = hmac.new(SECRET_KEY.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()[:12].upper()
    token = f"GIFT-{payload_b64}-{sig}"
    return token, payload

def verify_signed_gift_code(token):
    try:
        parts = token.strip().split('-')
        if len(parts) != 3 or parts[0] != "GIFT":
            return False, "Kod formatı düzgün deyil!"
        
        payload_b64 = parts[1]
        received_sig = parts[2].upper()
        
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()[:12].upper()
        if not hmac.compare_digest(received_sig, expected_sig):
            return False, "Təhlükəsizlik xətası: Saxta və ya dəyişdirilmiş kod!"
        
        padded_b64 = payload_b64 + '=' * (-len(payload_b64) % 4)
        json_bytes = base64.urlsafe_b64decode(padded_b64)
        payload = json.loads(json_bytes.decode('utf-8'))
        return True, payload
    except Exception as e:
        return False, f"Kodu oxumaq mümkün olmadı: {str(e)}"

def get_all_players_from_db():
    try:
        if not os.path.exists(DB_FILE):
            return []
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT player_id, username, diamonds, red_diamonds, gold, best_floor, last_login
                FROM players
                ORDER BY last_login DESC
            ''')
            return [dict(r) for r in cursor.fetchall()]
    except Exception as e:
        print(f"Oyunçuları oxuyarkən xəta: {e}")
        return []

def send_gift_code_and_inbox(target_type, player_id, blue, red, title, note, expires_hours=None):
    token, _ = create_signed_gift_code(blue, red)
    
    expires_at = None
    if expires_hours and expires_hours > 0:
        exp_dt = datetime.now(timezone.utc) + timedelta(hours=expires_hours)
        expires_at = exp_dt.isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. gift_codes_advanced cədvəlinə yazırıq
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
        cursor.execute('''
            INSERT INTO gift_codes_advanced (code, target_type, target_player_id, blue_diamonds, red_diamonds, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (token, target_type, player_id, blue, red, expires_at))

        # 2. inbox_messages cədvəlinə yazırıq
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
        cursor.execute('''
            INSERT INTO inbox_messages (target_type, player_id, title, note, gift_code, blue_diamonds, red_diamonds, expires_at, is_claimed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        ''', (target_type, player_id, title, note, token, blue, red, expires_at))
        new_msg_id = cursor.lastrowid

        conn.commit()

    # ⚡ Real-Time WebSocket serverinə dərhal xəbər veririk ki brauzerlərə canlı çatdırsın
    try:
        import urllib.request
        notify_payload = json.dumps({
            'targetType': target_type,
            'playerId': player_id,
            'message': {
                'id': new_msg_id,
                'title': title,
                'note': note,
                'gift_code': token,
                'blue_diamonds': blue,
                'red_diamonds': red,
                'expires_at': expires_at,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'is_claimed': 0
            }
        }).encode('utf-8')
        req = urllib.request.Request('http://localhost:4000/api/inbox/notify', data=notify_payload, headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(req, timeout=1.5)
    except Exception:
        pass

    return token, expires_at

# ============================================================================
# 🖥️ TKINTER ULTRA-MÜASİR KİBER ADMİN GUI PƏNCƏRƏSİ
# ============================================================================

def launch_gui():
    try:
        import tkinter as tk
        from tkinter import ttk, messagebox
    except ImportError:
        print("Tkinter tapılmadı. Konsol rejimi işə salınır...")
        main_console()
        return

    root = tk.Tk()
    root.title("Floor Escape - Admin Hədiyyə və Məktub Generatoru")
    root.geometry("980x720")
    root.minsize(860, 640)
    root.configure(bg="#0b1120") # Dark Cyber Navy

    # Stil Tənzimləmələri
    style = ttk.Style()
    style.theme_use('clam')
    
    style.configure(".", background="#0b1120", foreground="#f8fafc", font=("Segoe UI", 10))
    style.configure("TLabel", background="#0b1120", foreground="#e2e8f0", font=("Segoe UI", 10))
    style.configure("Header.TLabel", background="#0b1120", foreground="#38bdf8", font=("Segoe UI", 16, "bold"))
    style.configure("SubHeader.TLabel", background="#0b1120", foreground="#94a3b8", font=("Segoe UI", 9))
    style.configure("Cyan.TLabel", background="#0b1120", foreground="#06b6d4", font=("Segoe UI", 10, "bold"))
    style.configure("Ruby.TLabel", background="#0b1120", foreground="#f43f5e", font=("Segoe UI", 10, "bold"))

    style.configure("Treeview", 
                    background="#1e293b", 
                    foreground="#f8fafc", 
                    fieldbackground="#1e293b", 
                    font=("Segoe UI", 9),
                    rowheight=26)
    style.configure("Treeview.Heading", 
                    background="#0f172a", 
                    foreground="#38bdf8", 
                    font=("Segoe UI", 10, "bold"))
    style.map("Treeview", background=[('selected', '#0284c7')], foreground=[('selected', '#ffffff')])

    # Əsas Konteyner
    main_frame = tk.Frame(root, bg="#0b1120", padx=16, pady=14)
    main_frame.pack(fill=tk.BOTH, expand=True)

    # 1. Başlıq Paneli
    header_frame = tk.Frame(main_frame, bg="#0b1120")
    header_frame.pack(fill=tk.X, pady=(0, 10))

    lbl_title = ttk.Label(header_frame, text="🎁 Floor Escape • Admin Hədiyyə və Məktub Mərkəzi", style="Header.TLabel")
    lbl_title.pack(anchor="w")
    lbl_desc = ttk.Label(header_frame, text="İstifadəçiləri seçin, almaz miqdarını və vaxtını təyin edin. Birbaşa oyunçu poçtuna məktub kimi göndərilir.", style="SubHeader.TLabel")
    lbl_desc.pack(anchor="w")

    # 2. Üst Bölmə: Oyunçu Seçimi və Cədvəl
    player_box = tk.LabelFrame(main_frame, text=" 👥 1. HƏDƏF SEÇİMİ VƏ QEYDİYYATLI OYUNÇULAR ", bg="#0f172a", fg="#38bdf8", font=("Segoe UI", 10, "bold"), padx=12, pady=8)
    player_box.pack(fill=tk.BOTH, expand=True, pady=(0, 10))

    # Hədəf rejimi (Radio düymələri)
    target_mode_var = tk.StringVar(value="SINGLE")
    
    top_bar = tk.Frame(player_box, bg="#0f172a")
    top_bar.pack(fill=tk.X, pady=(0, 8))

    r_single = tk.Radiobutton(top_bar, text="👤 Tək Fərdi Oyunçuya (Özəl Kod & Məktub)", variable=target_mode_var, value="SINGLE",
                              bg="#0f172a", fg="#38bdf8", selectcolor="#1e293b", activebackground="#0f172a", activeforeground="#38bdf8", font=("Segoe UI", 10, "bold"))
    r_single.pack(side=tk.LEFT, padx=(0, 20))

    r_all = tk.Radiobutton(top_bar, text="🌐 Bütün Oyunçulara (Hər kəs 1 dəfə qəbul edə bilər)", variable=target_mode_var, value="ALL",
                           bg="#0f172a", fg="#a855f7", selectcolor="#1e293b", activebackground="#0f172a", activeforeground="#a855f7", font=("Segoe UI", 10, "bold"))
    r_all.pack(side=tk.LEFT)

    # Axtarış və Yeniləmə Barı
    search_bar = tk.Frame(player_box, bg="#0f172a")
    search_bar.pack(fill=tk.X, pady=(0, 6))

    tk.Label(search_bar, text="🔍 Axtarış:", bg="#0f172a", fg="#94a3b8", font=("Segoe UI", 9)).pack(side=tk.LEFT, padx=(0, 6))
    search_var = tk.StringVar()
    ent_search = tk.Entry(search_bar, textvariable=search_var, bg="#1e293b", fg="#ffffff", insertbackground="#ffffff", width=24, font=("Segoe UI", 9))
    ent_search.pack(side=tk.LEFT, padx=(0, 14))

    tk.Label(search_bar, text="🎯 Seçilmiş ID:", bg="#0f172a", fg="#38bdf8", font=("Segoe UI", 9, "bold")).pack(side=tk.LEFT, padx=(0, 6))
    selected_id_var = tk.StringVar()
    ent_selected_id = tk.Entry(search_bar, textvariable=selected_id_var, bg="#1e293b", fg="#38bdf8", font=("Segoe UI", 10, "bold"), width=16, insertbackground="#ffffff")
    ent_selected_id.pack(side=tk.LEFT, padx=(0, 14))

    btn_refresh = tk.Button(search_bar, text="🔄 Siyahını Yenilə", bg="#0369a1", fg="#ffffff", font=("Segoe UI", 9, "bold"), cursor="hand2", padx=8, pady=2, relief=tk.FLAT)
    btn_refresh.pack(side=tk.RIGHT)

    # Cədvəl
    tree_frame = tk.Frame(player_box, bg="#0f172a")
    tree_frame.pack(fill=tk.BOTH, expand=True)

    columns = ("id", "name", "blue", "red", "gold", "floor", "last_login")
    tree = ttk.Treeview(tree_frame, columns=columns, show="headings", selectmode="browse")
    
    tree.heading("id", text="Player ID")
    tree.heading("name", text="Oyunçu Adı")
    tree.heading("blue", text="Mavi 💎")
    tree.heading("red", text="Qırmızı 💎🔴")
    tree.heading("gold", text="Qızıl 🪙")
    tree.heading("floor", text="Maks Qat")
    tree.heading("last_login", text="Son Giriş")

    tree.column("id", width=110, anchor="center")
    tree.column("name", width=150, anchor="w")
    tree.column("blue", width=80, anchor="center")
    tree.column("red", width=95, anchor="center")
    tree.column("gold", width=85, anchor="center")
    tree.column("floor", width=75, anchor="center")
    tree.column("last_login", width=160, anchor="center")

    scroll = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=tree.yview)
    tree.configure(yscrollcommand=scroll.set)
    tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
    scroll.pack(side=tk.RIGHT, fill=tk.Y)

    # Oyunçuları doldurmaq funksiyası
    all_players_cache = []

    def populate_players():
        nonlocal all_players_cache
        all_players_cache = get_all_players_from_db()
        filter_players()

    def filter_players(*args):
        q = search_var.get().strip().lower()
        for item in tree.get_children():
            tree.delete(item)
        for p in all_players_cache:
            pid = str(p.get('player_id', ''))
            pname = str(p.get('username', ''))
            if not q or q in pid.lower() or q in pname.lower():
                tree.insert("", tk.END, values=(
                    pid,
                    pname,
                    p.get('diamonds', 0),
                    p.get('red_diamonds', 0),
                    int(p.get('gold', 0)),
                    p.get('best_floor', 1),
                    str(p.get('last_login', ''))[:19]
                ))

    def on_tree_select(event):
        sel = tree.selection()
        if sel:
            item = tree.item(sel[0])
            vals = item['values']
            if vals:
                selected_id_var.set(str(vals[0]))
                target_mode_var.set("SINGLE")

    tree.bind("<<TreeviewSelect>>", on_tree_select)
    search_var.trace_add("write", filter_players)
    btn_refresh.config(command=populate_players)

    # 3. Alt Bölmə: Hədiyyə və Məktub Parametrləri
    bottom_frame = tk.Frame(main_frame, bg="#0b1120")
    bottom_frame.pack(fill=tk.X)

    # Sol sütun: Almazlar və Vaxt
    reward_box = tk.LabelFrame(bottom_frame, text=" 💎 2. HƏDİYYƏ VƏ VAXT LİMİTİ ", bg="#0f172a", fg="#06b6d4", font=("Segoe UI", 10, "bold"), padx=12, pady=10)
    reward_box.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 8))

    r_grid = tk.Frame(reward_box, bg="#0f172a")
    r_grid.pack(fill=tk.X)

    tk.Label(r_grid, text="💎 Mavi Almaz:", bg="#0f172a", fg="#38bdf8", font=("Segoe UI", 10, "bold")).grid(row=0, column=0, sticky="w", pady=4)
    blue_var = tk.StringVar(value="25")
    ent_blue = tk.Entry(r_grid, textvariable=blue_var, bg="#1e293b", fg="#38bdf8", width=12, font=("Segoe UI", 11, "bold"), insertbackground="#ffffff")
    ent_blue.grid(row=0, column=1, sticky="w", padx=8, pady=4)

    tk.Label(r_grid, text="💎🔴 Qırmızı Almaz:", bg="#0f172a", fg="#f43f5e", font=("Segoe UI", 10, "bold")).grid(row=1, column=0, sticky="w", pady=4)
    red_var = tk.StringVar(value="10")
    ent_red = tk.Entry(r_grid, textvariable=red_var, bg="#1e293b", fg="#f43f5e", width=12, font=("Segoe UI", 11, "bold"), insertbackground="#ffffff")
    ent_red.grid(row=1, column=1, sticky="w", padx=8, pady=4)

    tk.Label(r_grid, text="⏳ Etibarlılıq Müddəti:", bg="#0f172a", fg="#facc15", font=("Segoe UI", 10, "bold")).grid(row=2, column=0, sticky="w", pady=4)
    time_options = [
        "Limitsiz (Həmişəlik)",
        "1 Saat",
        "6 Saat",
        "12 Saat",
        "24 Saat (1 Gün)",
        "3 Gün",
        "7 Gün (1 Həftə)",
        "30 Gün (1 Ay)"
    ]
    time_var = tk.StringVar(value="24 Saat (1 Gün)")
    cmb_time = ttk.Combobox(r_grid, textvariable=time_var, values=time_options, state="readonly", width=18, font=("Segoe UI", 9))
    cmb_time.grid(row=2, column=1, sticky="w", padx=8, pady=4)

    # Sağ sütun: Məktub və Qeyd
    mail_box = tk.LabelFrame(bottom_frame, text=" ✉️ 3. MƏKTUB VƏ TƏBRİK QEYDİ ", bg="#0f172a", fg="#a855f7", font=("Segoe UI", 10, "bold"), padx=12, pady=10)
    mail_box.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

    tk.Label(mail_box, text="Məktub Başlığı:", bg="#0f172a", fg="#cbd5e1", font=("Segoe UI", 9, "bold")).pack(anchor="w")
    title_var = tk.StringVar(value="🎁 Xüsusi Admin Hədiyyəsi!")
    ent_title = tk.Entry(mail_box, textvariable=title_var, bg="#1e293b", fg="#ffffff", font=("Segoe UI", 9), insertbackground="#ffffff")
    ent_title.pack(fill=tk.X, pady=(2, 6))

    tk.Label(mail_box, text="Oyunçuya Qeyd / Təbrik Mesajı:", bg="#0f172a", fg="#cbd5e1", font=("Segoe UI", 9, "bold")).pack(anchor="w")
    txt_note = tk.Text(mail_box, bg="#1e293b", fg="#f1f5f9", font=("Segoe UI", 9), height=3, insertbackground="#ffffff")
    txt_note.insert("1.0", "Salam! Floor Escape arenasında aktivliyinə görə sənə xüsusi almaz göndərdik. Oyunda uğurlar!")
    txt_note.pack(fill=tk.X, pady=(2, 0))

    # 4. Əməliyyat və Nəticə Paneli
    action_box = tk.Frame(main_frame, bg="#0b1120")
    action_box.pack(fill=tk.X, pady=(12, 0))

    res_code_var = tk.StringVar()

    def do_send_gift():
        target_type = target_mode_var.get()
        pid = selected_id_var.get().strip()

        if target_type == "SINGLE" and not pid:
            messagebox.showwarning("Xəbərdarlıq", "Zəhmət olmasa cədvəldən bir oyunçu seçin və ya ID daxil edin!")
            return

        try:
            blue = int(blue_var.get().strip() or "0")
            red = int(red_var.get().strip() or "0")
        except ValueError:
            messagebox.showerror("Xəta", "Almaz sayı yalnız tam rəqəm olmalıdır!")
            return

        if blue <= 0 and red <= 0:
            messagebox.showerror("Xəta", "Ən azı 1 almaz (mavi və ya qırmızı) təyin edilməlidir!")
            return

        # Müddəti hesablamaq
        t_sel = time_var.get()
        hours = None
        if "1 Saat" in t_sel: hours = 1
        elif "6 Saat" in t_sel: hours = 6
        elif "12 Saat" in t_sel: hours = 12
        elif "24 Saat" in t_sel: hours = 24
        elif "3 Gün" in t_sel: hours = 72
        elif "7 Gün" in t_sel: hours = 168
        elif "30 Gün" in t_sel: hours = 720

        title = title_var.get().strip() or "🎁 Xüsusi Admin Hədiyyəsi!"
        note = txt_note.get("1.0", tk.END).strip()

        try:
            token, exp_at = send_gift_code_and_inbox(
                target_type=target_type,
                player_id=pid if target_type == "SINGLE" else "ALL",
                blue=blue,
                red=red,
                title=title,
                note=note,
                expires_hours=hours
            )

            res_code_var.set(token)
            target_str = f"ID: {pid}" if target_type == "SINGLE" else "BÜTÜN OYUNÇULAR"
            exp_str = f"{hours} saat" if hours else "Limitsiz"
            
            messagebox.showinfo(
                "Uğurlu Əməliyyat", 
                f"✅ Hədiyyə Kodu Yaradıldı və Məktub Göndərildi!\n\n"
                f"🎯 Hədəf: {target_str}\n"
                f"💎 Mavi: {blue} | 💎🔴 Qırmızı: {red}\n"
                f"⏳ Vaxt: {exp_str}\n"
                f"🔑 Kod: {token}\n\n"
                f"Oyunçunun poçt qutusuna (📬 İnbox) dərhal çatdırıldı!"
            )
            populate_players()
        except Exception as err:
            messagebox.showerror("Xəta", f"Göndərilərkən xəta baş verdi:\n{err}")

    def copy_code():
        code = res_code_var.get().strip()
        if code:
            root.clipboard_clear()
            root.clipboard_append(code)
            messagebox.showinfo("Kopyalandı", "Hədiyyə kodu panoya kopyalandı!")
        else:
            messagebox.showwarning("Boşdur", "Hələ heç bir kod yaradılmayıb!")

    btn_send = tk.Button(action_box, text="🚀 KODU YARAT VƏ MƏKTUB GÖNDƏR", command=do_send_gift,
                         bg="#10b981", fg="#042f2e", font=("Segoe UI", 11, "bold"), cursor="hand2", padx=20, pady=8, relief=tk.FLAT)
    btn_send.pack(side=tk.LEFT, padx=(0, 14))

    ent_result = tk.Entry(action_box, textvariable=res_code_var, bg="#1e293b", fg="#38bdf8", font=("Segoe UI", 11, "bold"), width=36, insertbackground="#ffffff")
    ent_result.pack(side=tk.LEFT, padx=(0, 10))

    btn_copy = tk.Button(action_box, text="📋 Kodu Kopyala", command=copy_code,
                         bg="#0284c7", fg="#ffffff", font=("Segoe UI", 10, "bold"), cursor="hand2", padx=12, pady=6, relief=tk.FLAT)
    btn_copy.pack(side=tk.LEFT)

    # İlkin məlumatları yükləyirik
    populate_players()

    root.mainloop()

# ============================================================================
# 📟 KONSOL FALLBACK (Terminal üçün)
# ============================================================================

def main_console():
    print("=" * 65)
    print("🎁 FLOOR ESCAPE - ADMİN HƏDİYYƏ VƏ MƏKTUB GENERATORU")
    print("=" * 65)
    
    players = get_all_players_from_db()
    print(f"\n📋 Bazada {len(players)} oyunçu mövcuddur:")
    for p in players[:10]:
        print(f" - ID: {p['player_id']} | Ad: {p['username']} | Mavi: {p['diamonds']} 💎 | Qırmızı: {p['red_diamonds']} 💎🔴")
    if len(players) > 10:
        print(f" ... və daha {len(players) - 10} oyunçu.")

    print("\nRejim seçin:")
    print(" 1) Fərdi Oyunçuya Göndər")
    print(" 2) Bütün Oyunçulara Göndər (ALL)")
    
    choice = input("Seçiminiz (1 və ya 2): ").strip()
    target_type = "SINGLE" if choice == "1" else "ALL"
    
    target_id = "ALL"
    if target_type == "SINGLE":
        target_id = input("Oyunçu ID-sini daxil edin: ").strip()

    try:
        blue = int(input("💎 Mavi Almaz sayı (məs: 20): ").strip() or "0")
        red = int(input("💎🔴 Qırmızı Almaz sayı (məs: 10): ").strip() or "0")
        hours_in = input("⏳ Bitmə vaxtı (saatla, boş = limitsiz): ").strip()
        hours = int(hours_in) if hours_in else None

        title = input("✉️ Məktub başlığı (boş = standart): ").strip() or "🎁 Xüsusi Admin Hədiyyəsi!"
        note = input("📝 Qeyd / Mesaj: ").strip() or "Sistem tərəfindən sizə xüsusi almaz hədiyyəsi təqdim edildi."

        token, exp_at = send_gift_code_and_inbox(target_type, target_id, blue, red, title, note, hours)
        
        print("\n" + "=" * 65)
        print("✅ HƏDİYYƏ KODU VƏ MƏKTUB UĞURLA GÖNDƏRİLDİ!")
        print(f"🔑 Kod: {token}")
        print(f"🎯 Hədəf: {target_id}")
        print(f"💎 Hədiyyə: +{blue} Mavi | +{red} Qırmızı")
        print(f"⏳ Müddət: {exp_at or 'Limitsiz'}")
        print("=" * 65)
    except Exception as e:
        print(f"❌ Xəta: {e}")

if __name__ == '__main__':
    # Əgər DISPLAY və ya GUI mühiti varsa GUI açılır, əks halda konsola keçir
    try:
        launch_gui()
    except Exception as e:
        print(f"GUI açıla bilmədi ({e}). Konsola keçilir...")
        main_console()
